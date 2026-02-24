package com.apiarena.submissionservice.model.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import com.apiarena.submissionservice.config.WebSocketConfig;
import com.apiarena.submissionservice.model.dto.SubmissionStatusCacheDTO;

@Service
public class SubmissionWebSocketService {

    private static final String DESTINATION_PREFIX = WebSocketConfig.TOPIC_PREFIX + "/submission/";

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendStatusUpdate(Long submissionId, SubmissionStatusCacheDTO status) {
        String destination = DESTINATION_PREFIX + submissionId;
        messagingTemplate.convertAndSend(destination, status);
    }

    public void sendLogAppend(Long submissionId, String source, String line, String level) {
        String destination = DESTINATION_PREFIX + submissionId + "/logs";
        messagingTemplate.convertAndSend(destination, new LogMessage(source, line, level));
    }

    public void sendCompleted(Long submissionId, SubmissionStatusCacheDTO status) {
        sendStatusUpdate(submissionId, status);
    }

    public String getWsTopicForSubmission(Long submissionId) {
        return DESTINATION_PREFIX + submissionId;
    }

    public record LogMessage(String source, String line, String level) {}
}
