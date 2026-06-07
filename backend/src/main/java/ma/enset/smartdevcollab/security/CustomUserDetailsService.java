package ma.enset.smartdevcollab.security;
import ma.enset.smartdevcollab.repository.UserRepository; import org.springframework.security.core.userdetails.*; import org.springframework.stereotype.Service;
@Service
public class CustomUserDetailsService implements UserDetailsService{
 private final UserRepository repo; public CustomUserDetailsService(UserRepository repo){this.repo=repo;}
 public UserDetails loadUserByUsername(String email){ var u=repo.findByEmail(email).orElseThrow(); return User.builder().username(u.getEmail()).password(u.getPassword()).roles(u.getRole().name()).build(); }
}
