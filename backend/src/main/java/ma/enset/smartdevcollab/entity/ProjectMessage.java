package ma.enset.smartdevcollab.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "project_messages")
public class ProjectMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 3000)
    private String content;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @JsonIgnore
    @Lob
    @Column(name = "attachment_data", columnDefinition = "LONGBLOB")
    private byte[] attachmentData;

    @Column(name = "attachment_name")
    private String attachmentName;

    @Column(name = "attachment_type")
    private String attachmentType;

    @Column(name = "attachment_size")
    private Long attachmentSize;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}