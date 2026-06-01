FROM openjdk:17-jdk-slim
WORKDIR /app
# 빌드된 jar 파일을 app.jar로 복사 (plain jar 제외를 위해 빌드 결과물 확인 필요)
COPY build/libs/*-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
