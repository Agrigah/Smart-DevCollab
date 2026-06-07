package ma.enset.smartdevcollab.dto;
import ma.enset.smartdevcollab.entity.*; import java.time.LocalDate;
public class TaskDtos {
 public record TaskRequest(String title, String description, TaskStatus status, Priority priority, Long projectId, Long assignedToId, LocalDate dueDate, String deliverable) {}
 public record StatusRequest(TaskStatus status) {}
}
