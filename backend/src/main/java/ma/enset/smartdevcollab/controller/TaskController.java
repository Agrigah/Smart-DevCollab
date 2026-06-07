package ma.enset.smartdevcollab.controller;

import ma.enset.smartdevcollab.entity.*;
import ma.enset.smartdevcollab.repository.*;
import ma.enset.smartdevcollab.service.ActivityService;
import ma.enset.smartdevcollab.service.NotificationService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.time.LocalDateTime;
@RestController
@RequestMapping("/api/tasks")
@CrossOrigin("*")
public class TaskController {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ActivityService activityService;
    private final NotificationService notificationService;

    public TaskController(
            TaskRepository taskRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository,
            ProjectMemberRepository projectMemberRepository,
            ActivityService activityService,
            NotificationService notificationService
    ) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.activityService = activityService;
        this.notificationService = notificationService;
    }

    @GetMapping("/project/{projectId}")
    public List<Task> byProject(
            @PathVariable Long projectId,
            Authentication authentication
    ) {
        String email = getEmail(authentication);

        if (!canAccessProject(projectId, email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé.");
        }

        return taskRepository.findByProjectId(projectId);
    }

    @PostMapping
    public Task create(
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        String email = getEmail(authentication);

        Long projectId = Long.valueOf(String.valueOf(body.get("projectId")));
        Project project = projectRepository.findById(projectId).orElseThrow();

        if (!canAccessProject(projectId, email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé.");
        }

        User actor = userRepository.findByEmail(email).orElse(null);

        User assignedUser = null;
        if (body.get("assignedTo") != null && !String.valueOf(body.get("assignedTo")).isBlank()) {
            Long assignedToId = Long.valueOf(String.valueOf(body.get("assignedTo")));
            assignedUser = userRepository.findById(assignedToId).orElse(null);
        }

        LocalDate dueDate = null;
        if (body.get("dueDate") != null && !String.valueOf(body.get("dueDate")).isBlank()) {
            dueDate = LocalDate.parse(String.valueOf(body.get("dueDate")));
        }

        Priority priority = Priority.MEDIUM;
        if (body.get("priority") != null) {
            priority = Priority.valueOf(String.valueOf(body.get("priority")));
        }

        Task task = Task.builder()
                .title(String.valueOf(body.get("title")))
                .description(String.valueOf(body.getOrDefault("description", "")))
                .priority(priority)
                .status(TaskStatus.TODO)
                .project(project)
                .assignedTo(assignedUser)
                .dueDate(dueDate)
                .deliverable(String.valueOf(body.getOrDefault("deliverable", "")))
                .build();

        Task saved = taskRepository.save(task);

        activityService.log(
                project,
                actor,
                "a ajouté la tâche '" + saved.getTitle() + "'"
        );

        if (assignedUser != null) {
            notificationService.notify(
                    assignedUser,
                    "Nouvelle tâche assignée",
                    "La tâche '" + saved.getTitle() + "' vous a été assignée dans le projet " + project.getTitle()
            );
        }

        return saved;
    }

    @PutMapping("/{id}/status")
    public Task updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        String email = getEmail(authentication);

        Task task = taskRepository.findById(id).orElseThrow();
        Project project = task.getProject();

        if (!canAccessProject(project.getId(), email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé.");
        }

        User actor = userRepository.findByEmail(email).orElse(null);

        String newStatus = body.get("status");
        task.setStatus(TaskStatus.valueOf(newStatus));

        Task saved = taskRepository.save(task);

        activityService.log(
                project,
                actor,
                "a déplacé la tâche '" + saved.getTitle() + "' vers " + newStatus
        );

        if (saved.getAssignedTo() != null && actor != null &&
                !saved.getAssignedTo().getEmail().equals(actor.getEmail())) {

            notificationService.notify(
                    saved.getAssignedTo(),
                    "Tâche modifiée",
                    actor.getFullName() + " a déplacé votre tâche '" + saved.getTitle() + "' vers " + newStatus
            );
        }

        return saved;
    }

    @PutMapping("/{id}/deadline")
    public Task updateDeadline(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        String email = getEmail(authentication);

        Task task = taskRepository.findById(id).orElseThrow();
        Project project = task.getProject();

        if (!canAccessProject(project.getId(), email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé.");
        }

        User actor = userRepository.findByEmail(email).orElse(null);

        String dueAtValue = body.get("dueAt");

        if (dueAtValue == null || dueAtValue.isBlank()) {
            task.setDueAt(null);
            task.setDueDate(null);
        } else {
            LocalDateTime dueAt = LocalDateTime.parse(dueAtValue);
            task.setDueAt(dueAt);
            task.setDueDate(dueAt.toLocalDate());
        }

        Task saved = taskRepository.save(task);

        activityService.log(
                project,
                actor,
                "a modifié la deadline de la tâche '" + saved.getTitle() + "'"
        );

        if (saved.getAssignedTo() != null && actor != null &&
                !saved.getAssignedTo().getEmail().equals(actor.getEmail())) {

            notificationService.notify(
                    saved.getAssignedTo(),
                    "Deadline modifiée",
                    actor.getFullName() + " a modifié la deadline de votre tâche '" + saved.getTitle() + "'"
            );
        }

        if (saved.getAssignedTo() != null && saved.getDueAt() != null &&
                saved.getDueAt().toLocalDate().equals(LocalDate.now())) {

            notificationService.notify(
                    saved.getAssignedTo(),
                    "Tâche à terminer aujourd'hui",
                    "La tâche '" + saved.getTitle() + "' doit être terminée aujourd'hui avant " + saved.getDueAt().toLocalTime()
            );
        }

        return saved;
    }

    private boolean canAccessProject(Long projectId, String email) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return false;
        }

        if (user.getRole() == Role.TEACHER || user.getRole() == Role.ADMIN) {
            return true;
        }

        return projectMemberRepository.isMember(projectId, email);
    }

    private String getEmail(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }

        return "demo@smartdevcollab.com";
    }
    @PutMapping("/{id}/assign")
    public Task assignTask(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body,
            Authentication authentication
    ) {
        String email = getEmail(authentication);

        Task task = taskRepository.findById(id).orElseThrow();
        Project project = task.getProject();

        if (!canAccessProject(project.getId(), email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé.");
        }

        User actor = userRepository.findByEmail(email).orElse(null);

        Long userId = body.get("userId");

        User assignedUser = null;

        if (userId != null && userId != 0) {
            assignedUser = userRepository.findById(userId).orElseThrow();
        }

        task.setAssignedTo(assignedUser);

        Task saved = taskRepository.save(task);

        activityService.log(
                project,
                actor,
                "a assigné la tâche '" + saved.getTitle() + "' à " +
                        (assignedUser != null ? assignedUser.getFullName() : "personne")
        );

        if (assignedUser != null) {
            notificationService.notify(
                    assignedUser,
                    "Nouvelle tâche assignée",
                    "La tâche '" + saved.getTitle() + "' vous a été assignée dans le projet " + project.getTitle()
            );
        }

        return saved;
    }
    @PutMapping("/{id}")
    public Task updateTask(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        String email = getEmail(authentication);

        Task task = taskRepository.findById(id).orElseThrow();
        Project project = task.getProject();

        if (!canAccessProject(project.getId(), email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé.");
        }

        User actor = userRepository.findByEmail(email).orElse(null);

        if (body.get("title") != null) {
            task.setTitle(String.valueOf(body.get("title")));
        }

        if (body.get("description") != null) {
            task.setDescription(String.valueOf(body.get("description")));
        }

        if (body.get("priority") != null) {
            task.setPriority(Priority.valueOf(String.valueOf(body.get("priority"))));
        }

        if (body.get("dueAt") != null && !String.valueOf(body.get("dueAt")).isBlank()) {
            LocalDateTime dueAt = LocalDateTime.parse(String.valueOf(body.get("dueAt")));
            task.setDueAt(dueAt);
            task.setDueDate(dueAt.toLocalDate());
        } else {
            task.setDueAt(null);
            task.setDueDate(null);
        }

        if (body.get("assignedTo") != null) {
            Long assignedToId = Long.valueOf(String.valueOf(body.get("assignedTo")));

            if (assignedToId == 0) {
                task.setAssignedTo(null);
            } else {
                User assignedUser = userRepository.findById(assignedToId).orElseThrow();
                task.setAssignedTo(assignedUser);

                notificationService.notify(
                        assignedUser,
                        "Tâche assignée",
                        "La tâche '" + task.getTitle() + "' vous a été assignée dans le projet " + project.getTitle()
                );
            }
        }

        Task saved = taskRepository.save(task);

        activityService.log(
                project,
                actor,
                "a modifié la tâche '" + saved.getTitle() + "'"
        );

        return saved;
    }

    @DeleteMapping("/{id}")
    public void deleteTask(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = getEmail(authentication);

        Task task = taskRepository.findById(id).orElseThrow();
        Project project = task.getProject();

        if (!canAccessProject(project.getId(), email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé.");
        }

        User actor = userRepository.findByEmail(email).orElse(null);

        activityService.log(
                project,
                actor,
                "a supprimé la tâche '" + task.getTitle() + "'"
        );

        taskRepository.deleteById(id);
    }
}