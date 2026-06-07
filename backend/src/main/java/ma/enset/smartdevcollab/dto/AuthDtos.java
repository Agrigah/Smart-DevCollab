package ma.enset.smartdevcollab.dto;
import ma.enset.smartdevcollab.entity.Role;
public class AuthDtos {
 public record RegisterRequest(String fullName, String email, String password, Role role, String skillsText) {}
 public record LoginRequest(String email, String password) {}
 public record AuthResponse(String token, Long id, String fullName, String email, Role role, String skillsText) {}
}
