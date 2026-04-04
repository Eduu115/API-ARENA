package com.apiarena.leaderboardservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;

@SpringBootApplication
@EnableKafka
public class LeaderboardServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(LeaderboardServiceApplication.class, args);
	}

}
