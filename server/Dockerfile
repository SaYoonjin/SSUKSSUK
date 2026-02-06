# ===========================================
# Spring Boot Backend Dockerfile
# Multi-stage build for smaller image size
# ===========================================

# Stage 1: Build
FROM gradle:8.5-jdk17 AS builder

WORKDIR /app

# Copy gradle files first for caching
COPY build.gradle settings.gradle ./
COPY gradle ./gradle

# Download dependencies (cached if no changes)
RUN gradle dependencies --no-daemon || true

# Copy source code
COPY src ./src

# Build application
RUN gradle bootJar --no-daemon -x test

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy jar from builder
COPY --from=builder /app/build/libs/*.jar app.jar

# Change ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=1h --timeout=3s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
