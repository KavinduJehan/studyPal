package com.studypal.backend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "tasks")
public class Task {

    @Id
    private String id;
    private String userId;
    private String title;
    private String description;
    private String priority; // e.g., HIGH, MEDIUM, LOW
    private LocalDateTime deadline;
    private int estimatedHours;
    private String status; // e.g., TO_DO, IN_PROGRESS, COMPLETED
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}