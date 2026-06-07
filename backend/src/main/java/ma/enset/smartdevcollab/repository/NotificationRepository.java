package ma.enset.smartdevcollab.repository;

import ma.enset.smartdevcollab.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop20ByUserEmailOrderByCreatedAtDesc(String email);

    long countByUserEmailAndReadFalse(String email);
}