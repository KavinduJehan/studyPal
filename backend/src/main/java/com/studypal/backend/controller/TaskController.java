package com.studypal.backend.controller;

import com.studypal.backend.model.Task;
import com.studypal.backend.service.TaskService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.validation.Validator;
import jakarta.validation.ConstraintViolation;
import java.util.Set;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@Slf4j
public class TaskController {

    private final TaskService taskService;
    private final Validator validator;

    @Autowired
    public TaskController(TaskService taskService, Validator validator) {
        this.taskService = taskService;
        this.validator = validator;
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@Valid @RequestBody Task task) {
        // programmatic validation fallback
        Set<ConstraintViolation<Task>> violations = validator.validate(task);
        if (!violations.isEmpty()) {
            String msg = violations.stream().map(v -> v.getPropertyPath() + ": " + v.getMessage()).reduce((a,b)->a+"; "+b).orElse("validation error");
            throw new com.studypal.backend.exception.BadRequestException(msg);
        }

        Task createdTask = taskService.createTask(task);
        log.info("createTask: created {} for user {}", createdTask.getId(), createdTask.getUserId());
        return new ResponseEntity<>(createdTask, HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getTasksByUserId(@PathVariable String userId,
                                              @RequestParam(name = "page", required = false) Integer page,
                                              @RequestParam(name = "size", required = false) Integer size) {
        if (page != null && size != null) {
            var p = taskService.getTasksByUserId(userId, page, size);
            return ResponseEntity.ok(p);
        } else {
            List<Task> tasks = taskService.getTasksByUserId(userId);
            return ResponseEntity.ok(tasks);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable String id) {
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable String id, @Valid @RequestBody Task updatedTask) {
        Set<ConstraintViolation<Task>> violations = validator.validate(updatedTask);
        if (!violations.isEmpty()) {
            String msg = violations.stream().map(v -> v.getPropertyPath() + ": " + v.getMessage()).reduce((a,b)->a+"; "+b).orElse("validation error");
            throw new com.studypal.backend.exception.BadRequestException(msg);
        }
        Task updated = taskService.updateTask(id, updatedTask);
        log.info("updateTask: updated {}", updated.getId());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable String id) {
    taskService.deleteTask(id);
    log.info("deleteTask: deleted {}", id);
    return ResponseEntity.noContent().build();
    }

    // 1) Overdue tasks
    @GetMapping("/user/{userId}/overdue")
    public ResponseEntity<List<Task>> getOverdueTasks(@PathVariable String userId) {
        return ResponseEntity.ok(taskService.findOverdueTasksByUserId(userId));
    }

    // 2) Rollover incomplete tasks
    @PostMapping("/user/{userId}/rollover")
    public ResponseEntity<List<Task>> rollover(@PathVariable String userId) {
        return ResponseEntity.ok(taskService.rolloverIncompleteTasks(userId));
    }

    // 3) Priority sorted
    @GetMapping("/user/{userId}/sorted-by-priority")
    public ResponseEntity<List<Task>> getSortedByPriority(@PathVariable String userId) {
        return ResponseEntity.ok(taskService.getTasksByUserIdSortedByPriority(userId));
    }

    // 4) Search and filter
    @GetMapping("/user/{userId}/search")
    public ResponseEntity<List<Task>> searchTasks(@PathVariable String userId,
                                                  @RequestParam(required = false) String q,
                                                  @RequestParam(required = false) String status,
                                                  @RequestParam(required = false) String priority) {
        return ResponseEntity.ok(taskService.searchTasks(userId, q, status, priority));
    }

    // 5) Bulk mark complete
    @PostMapping("/bulk/complete")
    public ResponseEntity<String> bulkComplete(@RequestBody List<String> ids) {
        int updated = taskService.bulkMarkComplete(ids);
        return ResponseEntity.ok(updated + " tasks marked as completed");
    }

    // 6) Task statistics
    @GetMapping("/user/{userId}/stats")
    public ResponseEntity<Object> stats(@PathVariable String userId) {
        return ResponseEntity.ok(taskService.taskStatistics(userId));
    }
}