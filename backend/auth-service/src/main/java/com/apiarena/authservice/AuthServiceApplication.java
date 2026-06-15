package com.apiarena.authservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.apiarena.authservice.config.EmailProperties;
import com.apiarena.authservice.config.PasswordReminderProperties;
import com.apiarena.authservice.config.RateLimitProperties;
import com.apiarena.authservice.config.TurnstileProperties;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties({ EmailProperties.class, RateLimitProperties.class, TurnstileProperties.class,
        PasswordReminderProperties.class })
public class AuthServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(AuthServiceApplication.class, args);
	}

}
