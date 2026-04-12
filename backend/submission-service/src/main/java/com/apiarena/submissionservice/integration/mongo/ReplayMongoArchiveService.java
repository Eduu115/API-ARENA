package com.apiarena.submissionservice.integration.mongo;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import com.apiarena.submissionservice.model.dto.ReplayEventDTO;
import com.apiarena.submissionservice.model.entities.ReplayEvent;

@Service
@ConditionalOnProperty(name = "replay.mongodb.enabled", havingValue = "true")
public class ReplayMongoArchiveService {

    private static final Logger log = LoggerFactory.getLogger(ReplayMongoArchiveService.class);
    private static final String COLLECTION = "replay_archives";

    private final MongoTemplate mongoTemplate;

    public ReplayMongoArchiveService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public void appendEvent(ReplayEvent e) {
        if (e == null || e.getSubmissionId() == null) {
            return;
        }
        try {
            Query q = Query.query(Criteria.where("submissionId").is(e.getSubmissionId()));
            Update up = new Update()
                    .push("events", toDocument(e))
                    .set("lastOccurredAt", toDate(e.getOccurredAt()))
                    .setOnInsert("submissionId", e.getSubmissionId());
            FindAndModifyOptions opts = FindAndModifyOptions.options().upsert(true);
            mongoTemplate.findAndModify(q, up, opts, Document.class, COLLECTION);
        } catch (Exception ex) {
            log.warn("Mongo replay append failed for submission {}: {}", e.getSubmissionId(), ex.getMessage());
        }
    }

    public Optional<List<ReplayEventDTO>> findTimeline(Long submissionId) {
        try {
            Query q = Query.query(Criteria.where("submissionId").is(submissionId));
            Document doc = mongoTemplate.findOne(q, Document.class, COLLECTION);
            if (doc == null) {
                return Optional.empty();
            }
            @SuppressWarnings("unchecked")
            List<Document> raw = (List<Document>) doc.get("events");
            if (raw == null || raw.isEmpty()) {
                return Optional.empty();
            }
            List<ReplayEventDTO> out = new ArrayList<>();
            for (Document d : raw) {
                out.add(fromDocument(d));
            }
            return Optional.of(out);
        } catch (Exception ex) {
            log.warn("Mongo replay read failed for submission {}: {}", submissionId, ex.getMessage());
            return Optional.empty();
        }
    }

    public void deleteBySubmissionId(Long submissionId) {
        try {
            mongoTemplate.remove(Query.query(Criteria.where("submissionId").is(submissionId)), COLLECTION);
        } catch (Exception ex) {
            log.warn("Mongo replay delete failed for submission {}: {}", submissionId, ex.getMessage());
        }
    }

    public long deleteByLastOccurredAtBefore(LocalDateTime cutoff) {
        try {
            Date until = Date.from(cutoff.atZone(ZoneId.systemDefault()).toInstant());
            var result = mongoTemplate.remove(
                    Query.query(Criteria.where("lastOccurredAt").lt(until)), COLLECTION);
            return result.getDeletedCount();
        } catch (Exception ex) {
            log.warn("Mongo replay retention cleanup failed: {}", ex.getMessage());
            return 0;
        }
    }

    private static Document toDocument(ReplayEvent e) {
        Document d = new Document();
        d.append("id", e.getId());
        d.append("stage", e.getStage());
        d.append("eventType", e.getEventType());
        d.append("severity", e.getSeverity());
        d.append("message", e.getMessage());
        if (e.getMetadata() != null) {
            d.append("metadata", new Document(e.getMetadata()));
        }
        d.append("occurredAt", toDate(e.getOccurredAt()));
        return d;
    }

    private static Date toDate(LocalDateTime t) {
        if (t == null) {
            return Date.from(Instant.now());
        }
        return Date.from(t.atZone(ZoneId.systemDefault()).toInstant());
    }

    @SuppressWarnings("unchecked")
    private static ReplayEventDTO fromDocument(Document d) {
        Long id = d.get("id") instanceof Number n ? n.longValue() : null;
        String stage = d.getString("stage");
        String eventType = d.getString("eventType");
        String severity = d.getString("severity");
        String message = d.getString("message");
        Map<String, Object> meta = null;
        Object md = d.get("metadata");
        if (md instanceof Document doc) {
            meta = doc.entrySet().stream()
                    .collect(java.util.stream.Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        }
        LocalDateTime occurredAt = null;
        Object oa = d.get("occurredAt");
        if (oa instanceof Date date) {
            occurredAt = LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault());
        }
        return ReplayEventDTO.builder()
                .id(id)
                .stage(stage)
                .eventType(eventType)
                .severity(severity)
                .message(message)
                .metadata(meta)
                .occurredAt(occurredAt)
                .build();
    }
}
