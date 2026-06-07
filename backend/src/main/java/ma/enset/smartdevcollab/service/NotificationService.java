package ma.enset.smartdevcollab.service;

import ma.enset.smartdevcollab.entity.Notification;
import ma.enset.smartdevcollab.entity.User;
import ma.enset.smartdevcollab.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notifications;

    public NotificationService(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    public void notify(User user, String title, String message) {
        if (user == null) {
            return;
        }

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .build();

        notifications.save(notification);
    }

    public List<Notification> byUserEmail(String email) {
        return notifications.findTop20ByUserEmailOrderByCreatedAtDesc(email);
    }

    public long unreadCount(String email) {
        return notifications.countByUserEmailAndReadFalse(email);
    }

    public void markAsRead(Long id) {
        Notification notification = notifications.findById(id).orElseThrow();
        notification.setRead(true);
        notifications.save(notification);
    }
}