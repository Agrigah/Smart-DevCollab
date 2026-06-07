package ma.enset.smartdevcollab.entity;
import jakarta.persistence.*; import lombok.*; import java.time.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name="skills")
public class Skill { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id; @Column(nullable=false, unique=true) private String name; private String description; private LocalDateTime createdAt; @PrePersist void onCreate(){createdAt=LocalDateTime.now();} }
