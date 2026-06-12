package com.apiarena.submissionservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration;
import org.springframework.boot.autoconfigure.data.mongo.MongoRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.apiarena.submissionservice.config.RateLimitProperties;

@SpringBootApplication(exclude = {
		MongoAutoConfiguration.class,
		MongoDataAutoConfiguration.class,
		MongoRepositoriesAutoConfiguration.class
})
@EnableConfigurationProperties(RateLimitProperties.class)
@EnableAsync
@EnableScheduling
public class SubmissionServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(SubmissionServiceApplication.class, args);
	}

}
