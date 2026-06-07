package ma.enset.smartdevcollab.dto;
import java.time.LocalDate; import java.util.*;
public class AiDtos {
 public record AiProjectRequest(String projectTitle, String cahierDesCharges, String membersText, Long projectId) {}
 public record AiTaskSuggestion(String title, String description, String priority, String assignedToEmail, String assignedToName, String deliverable, LocalDate dueDate) {}
 public record AiProjectPlanResponse(String summary, List<AiTaskSuggestion> tasks) {}
 public record CreateTasksFromAiRequest(Long projectId, List<AiTaskSuggestion> tasks) {}
}
