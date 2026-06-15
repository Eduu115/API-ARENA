package com.apiarena.authservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.apiarena.authservice.config.EmailProperties;
import com.apiarena.authservice.config.RateLimitProperties;
import com.apiarena.authservice.config.TurnstileProperties;

@SpringBootApplication
@EnableConfigurationProperties({ EmailProperties.class, RateLimitProperties.class, TurnstileProperties.class })
public class AuthServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(AuthServiceApplication.class, args);
	}

}
