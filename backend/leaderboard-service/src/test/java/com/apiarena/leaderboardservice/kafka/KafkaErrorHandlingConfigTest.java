package com.apiarena.leaderboardservice.kafka;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

import java.util.concurrent.atomic.AtomicInteger;

import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.listener.KafkaMessageListenerContainer;
import org.springframework.kafka.listener.MessageListener;
import org.springframework.kafka.test.EmbeddedKafkaBroker;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.kafka.test.utils.ContainerTestUtils;
import org.springframework.kafka.test.utils.KafkaTestUtils;
import org.springframework.util.backoff.FixedBackOff;

import com.fasterxml.jackson.core.JsonParseException;

@EmbeddedKafka(partitions = 1, topics = {
        "retry-me", "retry-me.test-group.DLT",
        "bad-json", "bad-json.test-group.DLT"})
class KafkaErrorHandlingConfigTest {

    private static final String GROUP = "test-group";

    @Test
    void failingRecordIsRetriedThenPublishedToGroupDlt(EmbeddedKafkaBroker broker) {
        AtomicInteger attempts = new AtomicInteger();

        String deadLettered = consumeUntilDeadLettered(broker, "retry-me", record -> {
            attempts.incrementAndGet();
            throw new IllegalStateException("database down");
        });

        assertEquals("payload", deadLettered);
        assertEquals(3, attempts.get(), "first attempt + 2 retries");
    }

    @Test
    void unparseablePayloadSkipsRetries(EmbeddedKafkaBroker broker) {
        AtomicInteger attempts = new AtomicInteger();

        String deadLettered = consumeUntilDeadLettered(broker, "bad-json", record -> {
            attempts.incrementAndGet();
            throw new IllegalStateException(new JsonParseException(null, "not json"));
        });

        assertEquals("payload", deadLettered);
        assertEquals(1, attempts.get());
    }

    @Test
    void springBootWiresHandlerIntoListenerContainers() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(KafkaAutoConfiguration.class))
                .withUserConfiguration(KafkaErrorHandlingConfig.class)
                .withPropertyValues("spring.kafka.consumer.group-id=leaderboard-service")
                .run(context -> {
                    var container = context.getBean(ConcurrentKafkaListenerContainerFactory.class)
                            .createContainer("any-topic");
                    assertSame(context.getBean(DefaultErrorHandler.class), container.getCommonErrorHandler());
                });
    }

    /** Runs the listener behind the production error handler and returns the value that lands on the DLT. */
    private static String consumeUntilDeadLettered(
            EmbeddedKafkaBroker broker, String topic, MessageListener<String, String> listener) {
        KafkaTemplate<String, String> template = new KafkaTemplate<>(new DefaultKafkaProducerFactory<>(
                KafkaTestUtils.producerProps(broker), new StringSerializer(), new StringSerializer()));

        ContainerProperties containerProps = new ContainerProperties(topic);
        containerProps.setMessageListener(listener);
        KafkaMessageListenerContainer<String, String> container = new KafkaMessageListenerContainer<>(
                consumerFactory(broker, GROUP), containerProps);
        container.setCommonErrorHandler(
                KafkaErrorHandlingConfig.errorHandler(template, GROUP, new FixedBackOff(0, 2)));
        container.start();
        try {
            ContainerTestUtils.waitForAssignment(container, 1);
            template.send(topic, "payload");

            String dltTopic = topic + "." + GROUP + ".DLT";
            try (Consumer<String, String> dlt = consumerFactory(broker, "dlt-reader").createConsumer()) {
                broker.consumeFromAnEmbeddedTopic(dlt, dltTopic);
                return KafkaTestUtils.getSingleRecord(dlt, dltTopic).value();
            }
        } finally {
            container.stop();
        }
    }

    private static DefaultKafkaConsumerFactory<String, String> consumerFactory(EmbeddedKafkaBroker broker, String group) {
        return new DefaultKafkaConsumerFactory<>(
                KafkaTestUtils.consumerProps(group, "false", broker), new StringDeserializer(), new StringDeserializer());
    }
}
