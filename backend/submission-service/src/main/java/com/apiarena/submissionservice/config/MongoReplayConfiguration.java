package com.apiarena.submissionservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;

@Configuration
@ConditionalOnProperty(name = "replay.mongodb.enabled", havingValue = "true")
public class MongoReplayConfiguration {

    @Bean
    public MongoClient replayMongoClient(@Value("${spring.data.mongodb.uri}") String uri) {
        return MongoClients.create(uri);
    }

    @Bean
    public MongoTemplate replayMongoTemplate(MongoClient replayMongoClient,
            @Value("${spring.data.mongodb.uri}") String uri) {
        ConnectionString cs = new ConnectionString(uri);
        String db = cs.getDatabase();
        if (db == null || db.isBlank()) {
            db = "apiarena_logs";
        }
        return new MongoTemplate(replayMongoClient, db);
    }
}
