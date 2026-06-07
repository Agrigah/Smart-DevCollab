package ma.enset.smartdevcollab.entity;
import jakarta.persistence.*; import lombok.*; import java.time.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name="projects")
public class Project {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false) private String title;
 @Column(length=4000) private String description;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private ProjectStatus status;
 @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="owner_id") private User owner;
 @Column(name="deadline") private LocalDate deadline;
 @Column(name="created_at") private LocalDateTime createdAt;
 @Column(name="updated_at") private LocalDateTime updatedAt;
 @PrePersist public void prePersist(){ createdAt=LocalDateTime.now(); updatedAt=createdAt; if(status==null) status=ProjectStatus.PLANNED; }
 @PreUpdate public void preUpdate(){ updatedAt=LocalDateTime.now(); }
}
