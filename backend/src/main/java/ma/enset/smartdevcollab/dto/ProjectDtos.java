package ma.enset.smartdevcollab.dto;
import java.time.LocalDate;
public class ProjectDtos {
 public record ProjectRequest(String title, String description, LocalDate deadline) {}
 public record MemberRequest(Long userId) {}
}
