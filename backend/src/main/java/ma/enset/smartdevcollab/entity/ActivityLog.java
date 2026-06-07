package ma.enset.smartdevcollab.entity;
import jakarta.persistence.*; import lombok.*; import java.time.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name="activity_logs")
public class ActivityLog { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id; @ManyToOne @JoinColumn(name="project_id") private Project project; @ManyToOne @JoinColumn(name="user_id") private User user; @Column(nullable=false) private String action; @Column(name="created_at") private LocalDateTime createdAt; @PrePersist void onCreate(){createdAt=LocalDateTime.now();} }
