package ma.enset.smartdevcollab.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import ma.enset.smartdevcollab.entity.*;
import ma.enset.smartdevcollab.repository.ProjectRepository;
import ma.enset.smartdevcollab.repository.TaskRepository;
import ma.enset.smartdevcollab.repository.UserRepository;
import ma.enset.smartdevcollab.service.ActivityService;
import ma.enset.smartdevcollab.service.NotificationService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin("*")
public class AiController {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ActivityService activityService;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    public AiController(
            TaskRepository taskRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            ActivityService activityService
    ) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.activityService = activityService;
    }

    @PostMapping("/plan")
    public List<Map<String, Object>> generatePlan(@RequestBody Map<String, Object> request) {
        String prompt = String.valueOf(request.getOrDefault("prompt", ""));

        if (prompt == null || prompt.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Prompt vide.");
        }

        String finalPrompt = """
                Tu es un assistant intelligent de gestion de projet académique.

                À partir du prompt utilisateur, génère un plan WBS.

                Retourne obligatoirement un JSON sous cette forme :
                {
                  "tasks": [
                    {
                      "title": "Titre de la tâche",
                      "description": "Description courte",
                      "assignee": "Nom du responsable proposé ou Non assigné",
                      "priority": "LOW ou MEDIUM ou HIGH",
                      "deliverable": "Livrable attendu"
                    }
                  ]
                }

                Règles :
                - Retourne uniquement du JSON valide.
                - Génère entre 5 et 8 tâches.
                - Utilise les compétences des membres si elles sont données.
                - Si aucun membre ne correspond, mets "Non assigné".
                - Les priorités doivent être LOW, MEDIUM ou HIGH.

                Prompt utilisateur :
                """ + prompt;

        try {
            String aiText = callGemini(finalPrompt);
            String clean = cleanJson(aiText);

            JsonNode root = mapper.readTree(clean);
            JsonNode tasksNode = root.get("tasks");

            if (tasksNode == null || !tasksNode.isArray()) {
                throw new RuntimeException("La réponse IA ne contient pas tasks : " + clean);
            }

            return mapper.convertValue(
                    tasksNode,
                    new TypeReference<List<Map<String, Object>>>() {}
            );

        } catch (Exception e) {
            e.printStackTrace();
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Erreur Gemini : " + e.getMessage()
            );
        }
    }

    private String callGemini(String prompt) throws Exception {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new RuntimeException("Clé Gemini manquante.");
        }

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of(
                                "parts", List.of(
                                        Map.of("text", prompt)
                                )
                        )
                )
        );

        String jsonBody = mapper.writeValueAsString(body);

        String encodedModel = URLEncoder.encode(geminiModel, StandardCharsets.UTF_8);
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + encodedModel
                + ":generateContent";

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("x-goog-api-key", geminiApiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpClient client = HttpClient.newHttpClient();

        HttpResponse<String> response = client.send(
                httpRequest,
                HttpResponse.BodyHandlers.ofString()
        );

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            System.out.println("GEMINI ERROR STATUS: " + response.statusCode());
            System.out.println("GEMINI ERROR BODY: " + response.body());

            throw new RuntimeException(
                    "Gemini error " + response.statusCode() + " : " + response.body()
            );
        }

        JsonNode root = mapper.readTree(response.body());

        return root
                .get("candidates")
                .get(0)
                .get("content")
                .get("parts")
                .get(0)
                .get("text")
                .asText();
    }

    private String cleanJson(String text) {
        return text
                .replace("```json", "")
                .replace("```", "")
                .trim();
    }

    @PostMapping("/projects/{projectId}/tasks")
    public List<Task> createTasksFromAi(
            @PathVariable Long projectId,
            @RequestBody List<Map<String, Object>> aiTasks
    ) {
        List<Task> createdTasks = new ArrayList<>();
        Project project = projectRepository.findById(projectId).orElseThrow();

        for (Map<String, Object> item : aiTasks) {
            String assigneeName = String.valueOf(item.get("assignee"));
            User assignedUser = findOrCreateUser(assigneeName);

            Task task = Task.builder()
                    .title(String.valueOf(item.get("title")))
                    .description(String.valueOf(item.get("description")))
                    .priority(Priority.valueOf(String.valueOf(item.get("priority"))))
                    .status(TaskStatus.TODO)
                    .project(project)
                    .assignedTo(assignedUser)
                    .deliverable(String.valueOf(item.get("deliverable")))
                    .build();

            Task savedTask = taskRepository.save(task);
            createdTasks.add(savedTask);

            if (assignedUser != null) {
                notificationService.notify(
                        assignedUser,
                        "Nouvelle tâche assignée",
                        "La tâche '" + savedTask.getTitle() + "' vous a été assignée dans le projet " + project.getTitle()
                );

                activityService.log(
                        project,
                        assignedUser,
                        "a reçu la tâche : " + savedTask.getTitle()
                );
            }
        }

        return createdTasks;
    }

    private User findOrCreateUser(String fullName) {
        if (fullName == null || fullName.isBlank() || fullName.equalsIgnoreCase("Non assigné")) {
            return null;
        }

        String email = normalize(fullName)
                .replace(" ", ".")
                .replaceAll("[^a-z0-9.]", "")
                + "@smartdevcollab.local";

        return userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User user = User.builder()
                            .fullName(fullName)
                            .email(email)
                            .password("auto-generated")
                            .role(Role.STUDENT)
                            .build();

                    return userRepository.save(user);
                });
    }

    private String normalize(String value) {
        if (value == null) return "";

        return value.toLowerCase()
                .replace("é", "e")
                .replace("è", "e")
                .replace("ê", "e")
                .replace("à", "a")
                .replace("â", "a")
                .replace("ç", "c")
                .replace("î", "i")
                .replace("ï", "i")
                .replace("ô", "o")
                .replace("ù", "u")
                .replace("û", "u")
                .trim();
    }

}