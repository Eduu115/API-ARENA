package com.apiarena.submissionservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SubmissionServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(SubmissionServiceApplication.class, args);
	}

}
