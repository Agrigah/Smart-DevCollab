package ma.enset.smartdevcollab.entity;
import jakarta.persistence.*; import lombok.*; import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name="users")
public class User {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="full_name", nullable=false) private String fullName;
 @Column(nullable=false, unique=true) private String email;
 @Column(name="password_hash", nullable=false) private String password;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private Role role;
 @Column(name="skills_text", length=1000) private String skillsText;
 @Column(name="created_at") private LocalDateTime createdAt;
 @PrePersist public void onCreate(){ createdAt=LocalDateTime.now(); if(role==null) role=Role.STUDENT; }
}
