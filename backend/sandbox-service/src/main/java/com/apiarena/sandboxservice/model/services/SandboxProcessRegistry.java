package com.apiarena.sandboxservice.model.services;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

@Component
public class SandboxProcessRegistry {

    private final Map<Long, Process> processes = new ConcurrentHashMap<>();

    public void register(Long submissionId, Process process) {
        Process old = processes.put(submissionId, process);
        if (old != null && old.isAlive()) {
            old.destroyForcibly();
        }
    }

    public Process get(Long submissionId) {
        return processes.get(submissionId);
    }

    public void remove(Long submissionId) {
        processes.remove(submissionId);
    }
}
