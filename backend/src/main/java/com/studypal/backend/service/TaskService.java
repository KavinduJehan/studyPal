package com.studypal.backend.service;

import com.studypal.backend.model.Task;
import com.studypal.backend.repository.TaskRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;

    @Autowired
    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public Task createTask(Task task) {
    task.setCreatedAt(LocalDateTime.now());
    task.setUpdatedAt(LocalDateTime.now());
    Task saved = taskRepository.save(task);
    log.info("Created task {} for user {}", saved.getId(), saved.getUserId());
    return saved;
    }

    public List<Task> getTasksByUserId(String userId) {
        return taskRepository.findByUserId(userId);
    }

    public Optional<Task> getTaskById(String id) {
        return taskRepository.findById(id);
    }

    @Cacheable(value = "tasks", key = "#userId + '-' + #page + '-' + #size")
    public Page<Task> getTasksByUserId(String userId, int page, int size) {
        return taskRepository.findByUserId(userId, PageRequest.of(page, size));
    }

    public Task updateTask(String id, Task updatedTask) {
        return taskRepository.findById(id).map(task -> {
            task.setTitle(updatedTask.getTitle());
            task.setDescription(updatedTask.getDescription());
            task.setPriority(updatedTask.getPriority());
            task.setDeadline(updatedTask.getDeadline());
            task.setEstimatedHours(updatedTask.getEstimatedHours());
            task.setStatus(updatedTask.getStatus());
            task.setUpdatedAt(LocalDateTime.now());
            Task saved = taskRepository.save(task);
            log.info("Updated task {}", saved.getId());
            return saved;
        }).orElseThrow(() -> new RuntimeException("Task not found"));
    }

    public void deleteTask(String id) {
    taskRepository.deleteById(id);
    log.info("Deleted task {}", id);
    }

    // 1) Overdue task detection
    public List<Task> findOverdueTasksByUserId(String userId) {
        LocalDateTime now = LocalDateTime.now();
        return taskRepository.findByUserId(userId).stream()
                .filter(t -> t.getDeadline() != null)
                .filter(t -> !"COMPLETED".equalsIgnoreCase(t.getStatus()))
                .filter(t -> t.getDeadline().isBefore(now))
                .collect(Collectors.toList());
    }

    // 2) Rollover incomplete tasks: move deadline forward by 1 day for overdue/incomplete tasks
    public List<Task> rolloverIncompleteTasks(String userId) {
        LocalDateTime now = LocalDateTime.now();
        List<Task> tasks = taskRepository.findByUserId(userId);
        List<Task> rolled = new ArrayList<>();

        for (Task t : tasks) {
            if (t.getDeadline() == null) continue;
            if ("COMPLETED".equalsIgnoreCase(t.getStatus())) continue;
            if (t.getDeadline().isBefore(now)) {
                t.setDeadline(t.getDeadline().plusDays(1));
                t.setUpdatedAt(LocalDateTime.now());
                rolled.add(taskRepository.save(t));
            }
        }

        return rolled;
    }

    // 3) Priority-based sorting (HIGH > MEDIUM > LOW)
    public List<Task> getTasksByUserIdSortedByPriority(String userId) {
        return taskRepository.findByUserId(userId).stream()
                .sorted((a, b) -> priorityValue(b.getPriority()) - priorityValue(a.getPriority()))
                .collect(Collectors.toList());
    }

    private int priorityValue(String p) {
        if (p == null) return 0;
        switch (p.toUpperCase()) {
            case "HIGH": return 3;
            case "MEDIUM": return 2;
            case "LOW": return 1;
            default: return 0;
        }
    }

    // 4) Search and filtering
    public List<Task> searchTasks(String userId, String q, String status, String priority) {
        return taskRepository.findByUserId(userId).stream()
                .filter(t -> {
                    if (status != null && !status.isEmpty()) {
                        if (t.getStatus() == null || !t.getStatus().equalsIgnoreCase(status)) return false;
                    }
                    if (priority != null && !priority.isEmpty()) {
                        if (t.getPriority() == null || !t.getPriority().equalsIgnoreCase(priority)) return false;
                    }
                    if (q != null && !q.isEmpty()) {
                        String lower = q.toLowerCase();
                        boolean inTitle = t.getTitle() != null && t.getTitle().toLowerCase().contains(lower);
                        boolean inDesc = t.getDescription() != null && t.getDescription().toLowerCase().contains(lower);
                        return inTitle || inDesc;
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    // 5) Bulk mark complete
    public int bulkMarkComplete(List<String> ids) {
        int count = 0;
        for (String id : ids) {
            Optional<Task> maybe = taskRepository.findById(id);
            if (maybe.isPresent()) {
                Task t = maybe.get();
                t.setStatus("COMPLETED");
                t.setUpdatedAt(LocalDateTime.now());
                taskRepository.save(t);
                count++;
            }
        }
        return count;
    }

    // 6) Task statistics
    public Map<String, Object> taskStatistics(String userId) {
        List<Task> all = taskRepository.findByUserId(userId);
        long total = all.size();
        long completed = all.stream().filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus())).count();
        long inProgress = all.stream().filter(t -> "IN_PROGRESS".equalsIgnoreCase(t.getStatus())).count();
        long toDo = all.stream().filter(t -> "TO_DO".equalsIgnoreCase(t.getStatus())).count();
        long overdue = all.stream().filter(t -> t.getDeadline() != null && t.getDeadline().isBefore(LocalDateTime.now()) && !"COMPLETED".equalsIgnoreCase(t.getStatus())).count();
        double avgEst = all.stream().mapToInt(Task::getEstimatedHours).average().orElse(0.0);

        return Map.of(
                "total", total,
                "completed", completed,
                "inProgress", inProgress,
                "toDo", toDo,
                "overdue", overdue,
                "avgEstimatedHours", avgEst
        );
    }
}