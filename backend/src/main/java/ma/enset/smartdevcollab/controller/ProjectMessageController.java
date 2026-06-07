package ma.enset.smartdevcollab.controller;

import ma.enset.smartdevcollab.entity.*;
import ma.enset.smartdevcollab.repository.*;
import ma.enset.smartdevcollab.service.ActivityService;
import ma.enset.smartdevcollab.service.NotificationService;

import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin("*")
public class ProjectMessageController {

    private final ProjectMessageRepository messageRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final NotificationService notificationService;
    private final ActivityService activityService;

    public ProjectMessageController(
            ProjectMessageRepository messageRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository,
            ProjectMemberRepository projectMemberRepository,
            NotificationService notificationService,
            ActivityService activityService
    ) {
        this.messageRepository = messageRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.notificationService = notificationService;
        this.activityService = activityService;
    }

    @GetMapping("/project/{projectId}")
    public List<ProjectMessage> getMessages(
            @PathVariable Long projectId,
            Authentication authentication
    ) {
        String email = getEmail(authentication);

        if (!canAccessProject(projectId, email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé.");
        }

        return messageRepository.findTop50ByProjectIdOrderByCreatedAtAsc(projectId);
    }

    @PostMapping(
            value = "/project/{projectId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ProjectMessage sendMessage(
            @PathVariable Long projectId,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication authentication
    ) throws Exception {
        String email = getEmail(authentication);

        if (!canAccessProject(projectId, email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé.");
        }

        boolean hasText = content != null && !content.isBlank();
        boolean hasFile = file != null && !file.isEmpty();

        if (!hasText && !hasFile) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message vide.");
        }

        if (hasFile && !"application/pdf".equals(file.getContentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seulement les fichiers PDF sont autorisés.");
        }

        Project project = projectRepository.findById(projectId).orElseThrow();
        User sender = userRepository.findByEmail(email).orElseThrow();

        ProjectMessage message = ProjectMessage.builder()
                .project(project)
                .sender(sender)
                .content(hasText ? content : "")
                .build();

        if (hasFile) {
            message.setAttachmentData(file.getBytes());
            message.setAttachmentName(file.getOriginalFilename());
            message.setAttachmentType(file.getContentType());
            message.setAttachmentSize(file.getSize());
        }

        ProjectMessage saved = messageRepository.save(message);

        activityService.log(
                project,
                sender,
                hasFile
                        ? "a envoyé un fichier PDF dans la discussion du projet"
                        : "a envoyé un message dans la discussion du projet"
        );

        notifyProjectMembers(projectId, sender, project, hasFile);

        return saved;
    }

    @GetMapping("/{messageId}/file")
    public ResponseEntity<byte[]> downloadFile(
            @PathVariable Long messageId,
            Authentication authentication
    ) {
        ProjectMessage message = messageRepository.findById(messageId).orElseThrow();
        Long projectId = message.getProject().getId();

        String email = getEmail(authentication);

        if (!canAccessProject(projectId, email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé.");
        }

        if (message.getAttachmentData() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Aucun fichier.");
        }

        String filename = URLEncoder.encode(
                message.getAttachmentName(),
                StandardCharsets.UTF_8
        );

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\""
                )
                .body(message.getAttachmentData());
    }

    private void notifyProjectMembers(
            Long projectId,
            User sender,
            Project project,
            boolean hasFile
    ) {
        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);

        for (ProjectMember member : members) {
            User receiver = member.getUser();

            if (receiver == null) continue;
            if (receiver.getEmail().equals(sender.getEmail())) continue;

            notificationService.notify(
                    receiver,
                    hasFile ? "Nouveau fichier PDF" : "Nouveau message",
                    sender.getFullName() + " a envoyé " +
                            (hasFile ? "un fichier PDF" : "un message") +
                            " dans le projet " + project.getTitle()
            );
        }
    }

    private boolean canAccessProject(Long projectId, String email) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) return false;

        if (user.getRole() == Role.TEACHER || user.getRole() == Role.ADMIN) {
            return true;
        }

        return projectMemberRepository.isMember(projectId, email);
    }

    private String getEmail(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }

        return "demo@smartdevcollab.com";
    }
}