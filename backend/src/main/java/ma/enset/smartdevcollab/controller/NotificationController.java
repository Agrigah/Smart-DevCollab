package ma.enset.smartdevcollab.controller;

import ma.enset.smartdevcollab.entity.Notification;
import ma.enset.smartdevcollab.service.NotificationService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin("*")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public List<Notification> myNotifications(Authentication authentication) {
        String email = getEmail(authentication);
        return service.byUserEmail(email);
    }

    @GetMapping("/count")
    public Map<String, Long> unreadCount(Authentication authentication) {
        String email = getEmail(authentication);
        return Map.of("count", service.unreadCount(email));
    }

    @PutMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id) {
        service.markAsRead(id);
    }

    private String getEmail(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }

        return "demo@smartdevcollab.com";
    }
}