package com.studypal.backend.model;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "tasks")
public class Task {

    @Id
    private String id;

    @NotBlank(message = "userId is required")
    private String userId;

    @NotBlank(message = "title is required")
    @Size(max = 200, message = "title must be at most 200 characters")
    private String title;

    @Size(max = 2000, message = "description must be at most 2000 characters")
    private String description;

    @NotBlank(message = "priority is required")
    private String priority; // e.g., HIGH, MEDIUM, LOW

    private LocalDateTime startDate;

    private LocalDateTime deadline;

    @Min(value = 0, message = "estimatedHours must be non-negative")
    private int estimatedHours;

    @NotBlank(message = "status is required")
    private String status; // e.g., TO_DO, IN_PROGRESS, COMPLETED

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}