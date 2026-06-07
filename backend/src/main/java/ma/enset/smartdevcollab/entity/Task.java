package ma.enset.smartdevcollab.entity;
import jakarta.persistence.*; import lombok.*; import java.time.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name="tasks")
public class Task {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false) private String title;
 @Column(length=4000) private String description;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private TaskStatus status;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private Priority priority;
 @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="project_id", nullable=false) private Project project;
 @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="assigned_to") private User assignedTo;
 @Column(name="due_date")
 private LocalDate dueDate;
 @Column(name = "due_at")
 private LocalDateTime dueAt;
 @Column(name="deliverable") private String deliverable;
 @Column(name="created_at") private LocalDateTime createdAt;
 @Column(name="updated_at") private LocalDateTime updatedAt;
 @PrePersist public void prePersist(){ createdAt=LocalDateTime.now(); updatedAt=createdAt; if(status==null) status=TaskStatus.TODO; if(priority==null) priority=Priority.MEDIUM; }
 @PreUpdate public void preUpdate(){ updatedAt=LocalDateTime.now(); }

}
