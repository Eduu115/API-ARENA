package com.apiarena.sandboxservice.model.services;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.sandboxservice.model.dto.BuildRequest;
import com.apiarena.sandboxservice.model.dto.SandboxExecutionDTO;
import com.apiarena.sandboxservice.model.entities.SandboxExecution;
import com.apiarena.sandboxservice.repository.SandboxExecutionRepository;

@Service
public class SandboxService {

    private static final Logger log = LoggerFactory.getLogger(SandboxService.class);

    private static final int CANDIDATE_PORT = 9100;
    private static final int MAVEN_TIMEOUT_MIN = 12;
    private static final int STARTUP_WAIT_SEC = 90;

    /** First successful GET 200 on any of these paths means the JVM is serving HTTP (challenge-agnostic). */
    private static final String[] READINESS_PATHS = {
            "/api/items",
            "/api/books",
            "/api/todos",
            "/api/products",
            "/ping",
    };

    private static final Object BUILD_LOCK = new Object();

    @Autowired
    private SandboxExecutionRepository executionRepository;

    @Autowired
    private SandboxProcessRegistry processRegistry;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    @Transactional
    public SandboxExecutionDTO buildAndRun(BuildRequest request) {
        synchronized (BUILD_LOCK) {
            return buildAndRunLocked(request);
        }
    }

    private SandboxExecutionDTO buildAndRunLocked(BuildRequest request) {
        Long submissionId = request.getSubmissionId();
        String zipPathStr = request.getZipFilePath();
        if (zipPathStr == null || zipPathStr.isBlank()) {
            return fail(submissionId, "zipFilePath is required");
        }

        Path zipPath = Path.of(zipPathStr).toAbsolutePath().normalize();
        if (!Files.exists(zipPath)) {
            return fail(submissionId, "ZIP not found at: " + zipPath);
        }

        executionRepository.findBySubmissionId(submissionId).ifPresent(executionRepository::delete);

        SandboxExecution execution = new SandboxExecution();
        execution.setSubmissionId(submissionId);
        execution.setStatus(SandboxExecution.Status.BUILDING);
        execution.setMemoryLimit("512m");
        execution.setCpuLimit(1.0);
        execution.setTimeoutSeconds(900);
        execution.setStartedAt(LocalDateTime.now());
        execution.setExposedPort(CANDIDATE_PORT);

        StringBuilder buildLog = new StringBuilder();
        buildLog.append("[BUILD] Submission ").append(submissionId).append("\n");
        buildLog.append("[BUILD] ZIP: ").append(zipPath).append("\n");

        Path workDir = Path.of(System.getProperty("java.io.tmpdir"), "sandbox-work-" + submissionId);
        try {
            if (Files.exists(workDir)) {
                deleteRecursive(workDir);
            }
            Files.createDirectories(workDir);

            ZipExtractUtil.unzipFile(zipPath, workDir);
            buildLog.append("[BUILD] Extracted to ").append(workDir).append("\n");

            Optional<Path> pomOpt = findPom(workDir);
            if (pomOpt.isEmpty()) {
                buildLog.append("[BUILD] ERROR: No pom.xml found (Maven project required)\n");
                execution.setBuildLogs(buildLog.toString());
                execution.setStatus(SandboxExecution.Status.FAILED);
                execution.setErrorMessage("No pom.xml in ZIP");
                execution.setFinishedAt(LocalDateTime.now());
                return SandboxExecutionDTO.fromEntity(executionRepository.save(execution));
            }

            Path pom = pomOpt.get();
            Path projectRoot = pom.getParent();
            buildLog.append("[BUILD] Found pom.xml at ").append(pom).append("\n");

            ProcessBuilder mvn = new ProcessBuilder(
                    "mvn", "-B", "-DskipTests", "package");
            mvn.directory(projectRoot.toFile());
            mvn.environment().put("JAVA_TOOL_OPTIONS", "-Dfile.encoding=UTF-8");
            mvn.redirectErrorStream(true);

            Process mvnProcess = mvn.start();
            StringBuilder mvnBuffer = new StringBuilder();
            Thread mvnDrain = new Thread(() -> {
                try {
                    mvnBuffer.append(readProcessOutput(mvnProcess.getInputStream()));
                } catch (IOException e) {
                    mvnBuffer.append("[BUILD] Error reading Maven output: ").append(e.getMessage());
                }
            }, "maven-out-" + submissionId);
            mvnDrain.start();

            boolean finished = mvnProcess.waitFor(MAVEN_TIMEOUT_MIN, TimeUnit.MINUTES);
            mvnDrain.join(5000);
            buildLog.append(mvnBuffer);
            if (!finished) {
                mvnProcess.destroyForcibly();
                buildLog.append("[BUILD] ERROR: Maven timed out after ").append(MAVEN_TIMEOUT_MIN).append(" minutes\n");
                return failExecution(execution, buildLog.toString(), "Maven build timed out");
            }
            if (mvnProcess.exitValue() != 0) {
                buildLog.append("[BUILD] ERROR: mvn package exit code ").append(mvnProcess.exitValue()).append("\n");
                return failExecution(execution, buildLog.toString(), "Maven build failed (exit " + mvnProcess.exitValue() + ")");
            }

            Optional<Path> jarOpt = findRunnableJar(projectRoot.resolve("target"));
            if (jarOpt.isEmpty()) {
                buildLog.append("[BUILD] ERROR: No runnable JAR in target/\n");
                return failExecution(execution, buildLog.toString(), "No JAR produced in target/");
            }
            Path jar = jarOpt.get();
            buildLog.append("[BUILD] JAR: ").append(jar.getFileName()).append("\n");

            ProcessBuilder run = new ProcessBuilder(
                    "java",
                    "-jar", jar.toAbsolutePath().toString(),
                    "--server.port=" + CANDIDATE_PORT,
                    "--spring.main.banner-mode=off");
            run.directory(projectRoot.toFile());
            run.redirectErrorStream(true);

            Process appProcess = run.start();
            processRegistry.register(submissionId, appProcess);
            new Thread(() -> drainStream(appProcess.getInputStream(), submissionId), "sandbox-app-log-" + submissionId).start();

            boolean ready = waitForCandidateReady(CANDIDATE_PORT);
            if (!ready) {
                appProcess.destroyForcibly();
                processRegistry.remove(submissionId);
                buildLog.append("[BUILD] ERROR: API did not become ready on port ").append(CANDIDATE_PORT)
                        .append(" (tried: ").append(String.join(", ", READINESS_PATHS)).append(")\n");
                return failExecution(execution, buildLog.toString(), "Candidate API failed to start (timeout " + STARTUP_WAIT_SEC + "s)");
            }

            buildLog.append("[BUILD] Candidate API listening on port ").append(CANDIDATE_PORT).append("\n");

            execution.setBuildLogs(buildLog.toString());
            execution.setStatus(SandboxExecution.Status.RUNNING);
            execution.setImageName("local-jar:" + submissionId);
            execution.setContainerId("proc-" + submissionId);
            execution.setExposedPort(CANDIDATE_PORT);
            execution.setRuntimeLogs("[SANDBOX] Process started PID " + appProcess.pid());

            SandboxExecution saved = executionRepository.save(execution);
            log.info("Sandbox build OK for submission {} on port {}", submissionId, CANDIDATE_PORT);
            return SandboxExecutionDTO.fromEntity(saved);

        } catch (Exception e) {
            log.error("Sandbox build failed for {}", submissionId, e);
            buildLog.append("[BUILD] EXCEPTION: ").append(e.getMessage()).append("\n");
            return failExecution(execution, buildLog.toString(), e.getMessage());
        }
    }

    private void drainStream(InputStream in, Long submissionId) {
        try (BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            while ((line = r.readLine()) != null) {
                log.debug("[candidate:{}] {}", submissionId, line);
            }
        } catch (IOException ignored) {
            // process ended
        }
    }

    /**
     * Polls common list/ping paths until one returns HTTP 200 (covers items, books, todos, etc.).
     */
    private boolean waitForCandidateReady(int port) {
        String base = "http://127.0.0.1:" + port;
        for (int i = 0; i < STARTUP_WAIT_SEC; i++) {
            for (String path : READINESS_PATHS) {
                try {
                    HttpRequest req = HttpRequest.newBuilder()
                            .uri(URI.create(base + path))
                            .timeout(Duration.ofSeconds(4))
                            .GET()
                            .build();
                    HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                    if (resp.statusCode() == 200) {
                        return true;
                    }
                } catch (Exception e) {
                    // connection refused / not ready — try next path
                }
            }
            try {
                Thread.sleep(1000);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        return false;
    }

    private SandboxExecutionDTO fail(Long submissionId, String message) {
        SandboxExecution ex = new SandboxExecution();
        ex.setSubmissionId(submissionId);
        ex.setStatus(SandboxExecution.Status.FAILED);
        ex.setErrorMessage(message);
        ex.setBuildLogs(message);
        ex.setFinishedAt(LocalDateTime.now());
        return SandboxExecutionDTO.fromEntity(executionRepository.save(ex));
    }

    private SandboxExecutionDTO failExecution(SandboxExecution execution, String logs, String err) {
        execution.setBuildLogs(logs);
        execution.setStatus(SandboxExecution.Status.FAILED);
        execution.setErrorMessage(err);
        execution.setFinishedAt(LocalDateTime.now());
        return SandboxExecutionDTO.fromEntity(executionRepository.save(execution));
    }

    private Optional<Path> findPom(Path root) throws IOException {
        try (Stream<Path> walk = Files.walk(root, 6)) {
            return walk.filter(p -> "pom.xml".equals(p.getFileName().toString())).findFirst();
        }
    }

    private Optional<Path> findRunnableJar(Path targetDir) throws IOException {
        if (!Files.isDirectory(targetDir)) {
            return Optional.empty();
        }
        try (Stream<Path> walk = Files.walk(targetDir, 1)) {
            return walk
                    .filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".jar"))
                    .filter(p -> {
                        String n = p.getFileName().toString();
                        return !n.contains("sources") && !n.contains("javadoc") && !n.endsWith("-original.jar");
                    })
                    .findFirst();
        }
    }

    private String readProcessOutput(InputStream in) throws IOException {
        try (BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = r.readLine()) != null) {
                sb.append(line).append('\n');
            }
            return sb.toString();
        }
    }

    private void deleteRecursive(Path path) throws IOException {
        if (!Files.exists(path)) {
            return;
        }
        try (Stream<Path> walk = Files.walk(path)) {
            walk.sorted((a, b) -> b.getNameCount() - a.getNameCount())
                    .forEach(p -> {
                        try {
                            Files.deleteIfExists(p);
                        } catch (IOException e) {
                            log.warn("Could not delete {}", p, e);
                        }
                    });
        }
    }

    public SandboxExecutionDTO getBySubmissionId(Long submissionId) {
        SandboxExecution execution = executionRepository.findBySubmissionId(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Sandbox execution not found for submission: " + submissionId));
        return SandboxExecutionDTO.fromEntity(execution);
    }

    @Transactional
    public SandboxExecutionDTO stop(Long submissionId) {
        Process p = processRegistry.get(submissionId);
        if (p != null && p.isAlive()) {
            p.destroyForcibly();
            try {
                p.waitFor(10, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            processRegistry.remove(submissionId);
        }

        Optional<SandboxExecution> opt = executionRepository.findBySubmissionId(submissionId);
        if (opt.isEmpty()) {
            SandboxExecutionDTO empty = SandboxExecutionDTO.builder()
                    .submissionId(submissionId)
                    .status(SandboxExecution.Status.STOPPED.name())
                    .build();
            return empty;
        }
        SandboxExecution execution = opt.get();

        execution.setStatus(SandboxExecution.Status.STOPPED);
        execution.setFinishedAt(LocalDateTime.now());
        if (execution.getStartedAt() != null) {
            execution.setExecutionTimeMs(
                    java.time.Duration.between(execution.getStartedAt(), execution.getFinishedAt()).toMillis());
        }
        String logs = execution.getRuntimeLogs() != null ? execution.getRuntimeLogs() : "";
        execution.setRuntimeLogs(logs + "\n[SANDBOX] Stopped");

        SandboxExecution saved = executionRepository.save(execution);
        return SandboxExecutionDTO.fromEntity(saved);
    }

    public SandboxExecutionDTO getMetrics(String containerId) {
        SandboxExecution execution = executionRepository.findByContainerId(containerId)
                .orElseThrow(() -> new IllegalArgumentException("Container not found: " + containerId));
        return SandboxExecutionDTO.fromEntity(execution);
    }
}
