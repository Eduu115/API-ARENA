# Stage 1: build sandbox-service JAR
FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: runtime — Maven + JDK + docker-cli (+ buildx) for DinD candidate builds
FROM maven:3.9-eclipse-temurin-21-alpine

# buildx: candidate images build in a limited docker-container builder (see SandboxService)
RUN apk add --no-cache unzip docker-cli docker-cli-buildx

WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8084

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8084/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
