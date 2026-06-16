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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.sandboxservice.model.dto.BuildRequest;
import com.apiarena.sandboxservice.model.dto.SandboxExecutionDTO;
import com.apiarena.sandboxservice.model.entities.SandboxExecution;
import com.apiarena.sandboxservice.repository.SandboxExecutionRepository;

@Service
public class SandboxService {

    private static final Logger log = LoggerFactory.getLogger(SandboxService.class);

    private static final int PROCESS_CANDIDATE_PORT = 9100;
    private static final int MAVEN_TIMEOUT_MIN = 12;
    private static final int STARTUP_WAIT_SEC = 90;

    /** Any HTTP response (even 4xx/5xx) on these paths means the JVM is serving HTTP. */
    private static final String[] READINESS_PATHS = {
            "/actuator/health",
            "/api/items",
            "/api/books",
            "/api/todos",
            "/api/products",
            "/api/tasks",
            "/api/messages",
            "/api/cache",
            "/ping",
            "/",
    };

    private static final Object BUILD_LOCK = new Object();

    @Autowired
    private SandboxExecutionRepository executionRepository;

    @Autowired
    private SandboxProcessRegistry processRegistry;

    @Value("${sandbox.runner.mode:dind}")
    private String runnerMode;

    /**
     * "process" mode builds and runs untrusted submissions directly on the host with no isolation.
     * It must never run by accident in a real deployment, so it requires an explicit opt-in.
     */
    @Value("${sandbox.allow-process-mode:false}")
    private boolean allowProcessMode;

    @Value("${sandbox.dind.network:apiarena-network}")
    private String dindNetwork;

    @Value("${sandbox.dind.container-port:8080}")
    private int dindContainerPort;

    @Value("${sandbox.container.memory-limit:256m}")
    private String memoryLimit;

    @Value("${sandbox.container.cpu-limit:1.0}")
    private double cpuLimit;

    @Value("${sandbox.container.timeout-seconds:900}")
    private int timeoutSeconds;

    @Value("${sandbox.dind.pids-limit:256}")
    private int dindPidsLimit;

    @Value("${sandbox.dind.use-init:true}")
    private boolean dindUseInit;

    /** Docker --ulimit nofile=soft:hard; empty disables. */
    @Value("${sandbox.dind.nofile-ulimit:8192:8192}")
    private String dindNofileUlimit;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    @Transactional
    public SandboxExecutionDTO buildAndRun(BuildRequest request) {
        if ("dind".equalsIgnoreCase(runnerMode)) {
            return buildAndRunDind(request);
        }
        if (!allowProcessMode) {
            throw new IllegalStateException(
                    "sandbox.runner.mode=" + runnerMode + " runs untrusted code on the host without isolation; "
                            + "set sandbox.allow-process-mode=true to opt in (never in production).");
        }
        synchronized (BUILD_LOCK) {
            return buildAndRunProcess(request);
        }
    }

    private SandboxExecutionDTO buildAndRunProcess(BuildRequest request) {
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
        execution.setMemoryLimit(memoryLimit);
        execution.setCpuLimit(cpuLimit);
        execution.setTimeoutSeconds(timeoutSeconds);
        execution.setStartedAt(LocalDateTime.now());
        execution.setExposedPort(PROCESS_CANDIDATE_PORT);

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
                    "--server.port=" + PROCESS_CANDIDATE_PORT,
                    "--spring.main.banner-mode=off");
            run.directory(projectRoot.toFile());
            run.redirectErrorStream(true);

            Process appProcess = run.start();
            processRegistry.register(submissionId, appProcess);
            new Thread(() -> drainStream(appProcess.getInputStream(), submissionId), "sandbox-app-log-" + submissionId).start();

            boolean ready = waitForCandidateReady("127.0.0.1", PROCESS_CANDIDATE_PORT);
            if (!ready) {
                appProcess.destroyForcibly();
                processRegistry.remove(submissionId);
                buildLog.append("[BUILD] ERROR: API did not become ready on port ").append(PROCESS_CANDIDATE_PORT)
                        .append(" (tried: ").append(String.join(", ", READINESS_PATHS)).append(")\n");
                return failExecution(execution, buildLog.toString(), "Candidate API failed to start (timeout " + STARTUP_WAIT_SEC + "s)");
            }

            buildLog.append("[BUILD] Candidate API listening on port ").append(PROCESS_CANDIDATE_PORT).append("\n");

            execution.setBuildLogs(buildLog.toString());
            execution.setStatus(SandboxExecution.Status.RUNNING);
            execution.setImageName("local-jar:" + submissionId);
            execution.setContainerId("proc-" + submissionId);
            execution.setExposedPort(PROCESS_CANDIDATE_PORT);
            execution.setRuntimeLogs("[SANDBOX] Process started PID " + appProcess.pid());

            SandboxExecution saved = executionRepository.save(execution);
            log.info("Sandbox(process) build OK for submission {} on port {}", submissionId, PROCESS_CANDIDATE_PORT);
            return SandboxExecutionDTO.fromEntity(saved);

        } catch (Exception e) {
            log.error("Sandbox build failed for {}", submissionId, e);
            buildLog.append("[BUILD] EXCEPTION: ").append(e.getMessage()).append("\n");
            return failExecution(execution, buildLog.toString(), e.getMessage());
        }
    }

    private SandboxExecutionDTO buildAndRunDind(BuildRequest request) {
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
        execution.setMemoryLimit(memoryLimit);
        execution.setCpuLimit(cpuLimit);
        execution.setTimeoutSeconds(timeoutSeconds);
        execution.setStartedAt(LocalDateTime.now());
        execution.setExposedPort(dindContainerPort);

        String imageName = "apiarena-candidate-img-" + submissionId + "-" + System.currentTimeMillis();
        String containerName = "apiarena-candidate-" + submissionId;
        StringBuilder buildLog = new StringBuilder();
        Path workDir = Path.of(System.getProperty("java.io.tmpdir"), "sandbox-dind-" + submissionId);
        try {
            if (Files.exists(workDir)) deleteRecursive(workDir);
            Files.createDirectories(workDir);
            ZipExtractUtil.unzipFile(zipPath, workDir);
            Optional<Path> pomOpt = findPom(workDir);
            if (pomOpt.isEmpty()) {
                return failExecution(execution, "[BUILD] No pom.xml in ZIP", "No pom.xml in ZIP");
            }
            Path projectRoot = pomOpt.get().getParent();
            Path dockerfile = projectRoot.resolve("Dockerfile.apiarena");
            // Always use the server-controlled Dockerfile; never accept a caller-supplied one.
            Files.writeString(dockerfile, defaultCandidateDockerfile(), StandardCharsets.UTF_8);

            runDockerCommand(List.of("docker", "rm", "-f", containerName), workDir, 10, false);
            if (!dockerNetworkExists(workDir, dindNetwork)) {
                return failExecution(execution, "[BUILD] Docker network not found: " + dindNetwork,
                        "Docker network not found: " + dindNetwork);
            }

            CommandResult buildResult = runDockerCommand(
                    List.of("docker", "build", "-t", imageName, "-f", dockerfile.toString(), projectRoot.toString()),
                    projectRoot,
                    MAVEN_TIMEOUT_MIN * 60,
                    true);
            buildLog.append(buildResult.output());
            if (buildResult.exitCode() != 0) {
                return failExecution(execution, buildLog.toString(), "Docker build failed");
            }

            List<String> runCmd = new ArrayList<>();
            runCmd.add("docker");
            runCmd.add("run");
            runCmd.add("-d");
            if (dindUseInit) {
                runCmd.add("--init");
            }
            runCmd.add("--name");
            runCmd.add(containerName);
            runCmd.add("--network");
            runCmd.add(dindNetwork);
            runCmd.add("--cpus");
            runCmd.add(String.valueOf(cpuLimit));
            runCmd.add("--memory");
            runCmd.add(memoryLimit);
            runCmd.add("--pids-limit");
            runCmd.add(String.valueOf(Math.max(64, dindPidsLimit)));
            if (dindNofileUlimit != null && !dindNofileUlimit.isBlank()) {
                runCmd.add("--ulimit");
                runCmd.add("nofile=" + dindNofileUlimit.trim());
            }
            runCmd.add("--cap-drop=ALL");
            runCmd.add("--security-opt=no-new-privileges:true");
            runCmd.add("--read-only");
            runCmd.add("--tmpfs");
            runCmd.add("/tmp:rw,nosuid,nodev,size=64m");
            runCmd.add("-e");
            runCmd.add("SERVER_PORT=" + dindContainerPort);
            runCmd.add(imageName);

            CommandResult runResult = runDockerCommand(runCmd, workDir, 20, true);
            buildLog.append(runResult.output());
            if (runResult.exitCode() != 0) {
                runDockerCommand(List.of("docker", "rmi", "-f", imageName), workDir, 10, false);
                return failExecution(execution, buildLog.toString(), "Docker run failed");
            }

            boolean ready = waitForCandidateReady(containerName, dindContainerPort);
            if (!ready) {
                try {
                    CommandResult logs = runDockerCommand(List.of("docker", "logs", "--tail", "200", containerName),
                            workDir, 10, true);
                    if (logs.output() != null && !logs.output().isBlank()) {
                        buildLog.append("\n[BUILD] Candidate logs (tail)\n").append(logs.output()).append("\n");
                    }
                    buildLog.append("[BUILD] Readiness paths tried: ")
                            .append(String.join(", ", READINESS_PATHS))
                            .append("\n");
                } catch (Exception ignored) {
                    // best-effort only
                }
                runDockerCommand(List.of("docker", "rm", "-f", containerName), workDir, 10, false);
                runDockerCommand(List.of("docker", "rmi", "-f", imageName), workDir, 10, false);
                buildLog.append("[BUILD] Candidate not ready in time\n");
                return failExecution(execution, buildLog.toString(), "Candidate API failed to start");
            }

            buildLog.append("[BUILD] Candidate container ready: ").append(containerName).append(":")
                    .append(dindContainerPort).append("\n");
            execution.setBuildLogs(buildLog.toString());
            execution.setStatus(SandboxExecution.Status.RUNNING);
            execution.setImageName(imageName);
            execution.setContainerId(containerName);
            execution.setExposedPort(dindContainerPort);
            execution.setRuntimeLogs("[SANDBOX] DinD container started: " + containerName);
            return SandboxExecutionDTO.fromEntity(executionRepository.save(execution));
        } catch (Exception e) {
            log.error("Sandbox(DinD) build failed for {}", submissionId, e);
            buildLog.append("\n[BUILD] EXCEPTION: ").append(e.getMessage());
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
    private boolean waitForCandidateReady(String host, int port) {
        String base = "http://" + host + ":" + port;
        for (int i = 0; i < STARTUP_WAIT_SEC; i++) {
            for (String path : READINESS_PATHS) {
                try {
                    HttpRequest req = HttpRequest.newBuilder()
                            .uri(URI.create(base + path))
                            .timeout(Duration.ofSeconds(4))
                            .GET()
                            .build();
                    HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                    int code = resp.statusCode();
                    if (code > 0) {
                        log.info("Candidate ready on {} — HTTP {}", path, code);
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

    private String defaultCandidateDockerfile() {
        return """
                FROM maven:3.9-eclipse-temurin-21-alpine AS build
                WORKDIR /src
                COPY pom.xml .
                RUN mvn -B -DskipTests dependency:go-offline
                COPY src ./src
                RUN mvn -B -DskipTests package
                FROM eclipse-temurin:21-jre-alpine
                WORKDIR /app
                COPY --from=build /src/target/*.jar app.jar
                EXPOSE 8080
                ENTRYPOINT ["sh","-c","java -jar /app/app.jar --server.port=${SERVER_PORT:-8080} --spring.main.banner-mode=off"]
                """;
    }

    private CommandResult runDockerCommand(List<String> command, Path workDir, int timeoutSeconds, boolean captureOutput)
            throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(workDir.toFile());
        pb.redirectErrorStream(true);
        Process p = pb.start();
        String out = captureOutput ? readProcessOutput(p.getInputStream()) : "";
        boolean finished = p.waitFor(timeoutSeconds, TimeUnit.SECONDS);
        if (!finished) {
            p.destroyForcibly();
            return new CommandResult(124, out + "\n[CMD] timeout: " + String.join(" ", command));
        }
        return new CommandResult(p.exitValue(), out);
    }

    @SuppressWarnings("unused")
    private boolean dockerNetworkExists(Path workDir, String networkName) {
        try {
            CommandResult result = runDockerCommand(
                    List.of("docker", "network", "inspect", networkName),
                    workDir,
                    10,
                    false);
            return result.exitCode() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private record CommandResult(int exitCode, String output) {
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
        Optional<SandboxExecution> opt = executionRepository.findBySubmissionId(submissionId);
        if (opt.isEmpty()) {
            SandboxExecutionDTO empty = SandboxExecutionDTO.builder()
                    .submissionId(submissionId)
                    .status(SandboxExecution.Status.STOPPED.name())
                    .build();
            return empty;
        }
        SandboxExecution execution = opt.get();

        if ("dind".equalsIgnoreCase(runnerMode)) {
            if (execution.getContainerId() != null && execution.getContainerId().startsWith("apiarena-candidate-")) {
                try {
                    runDockerCommand(List.of("docker", "rm", "-f", execution.getContainerId()),
                            Path.of(System.getProperty("java.io.tmpdir")), 20, false);
                } catch (Exception e) {
                    log.warn("Could not remove container {}: {}", execution.getContainerId(), e.getMessage());
                }
            }
            if (execution.getImageName() != null && execution.getImageName().startsWith("apiarena-candidate-img-")) {
                try {
                    runDockerCommand(List.of("docker", "rmi", "-f", execution.getImageName()),
                            Path.of(System.getProperty("java.io.tmpdir")), 20, false);
                } catch (Exception e) {
                    log.debug("Could not remove image {}: {}", execution.getImageName(), e.getMessage());
                }
            }
        } else {
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
        }

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
