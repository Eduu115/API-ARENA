package com.apiarena.notificationservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.kafka.bootstrap-servers=localhost:9092",
        "spring.kafka.listener.auto-startup=false"
})
class NotificationServiceApplicationTests {

	@Test
	void contextLoads() {
	}
}
