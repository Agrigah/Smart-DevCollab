package ma.enset.smartdevcollab.entity;
import jakarta.persistence.*; import lombok.*; import java.time.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name="project_members", uniqueConstraints=@UniqueConstraint(columnNames={"project_id","user_id"}))
public class ProjectMember {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne @JoinColumn(name="project_id", nullable=false) private Project project;
 @ManyToOne @JoinColumn(name="user_id", nullable=false) private User user;
 @Enumerated(EnumType.STRING) @Column(name="member_role") private MemberRole memberRole;
 @Column(name="joined_at") private LocalDateTime joinedAt;
 @PrePersist public void onCreate(){ joinedAt=LocalDateTime.now(); if(memberRole==null) memberRole=MemberRole.MEMBER; }
}
