package ma.enset.smartdevcollab.repository;

import ma.enset.smartdevcollab.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import jakarta.transaction.Transactional;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog> findByProjectId(Long projectId);

    @Query("SELECT a FROM ActivityLog a WHERE a.project.id = :projectId ORDER BY a.createdAt DESC")
    List<ActivityLog> findRecentByProjectId(Long projectId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ActivityLog a WHERE a.project.id = :projectId")
    void deleteByProjectId(Long projectId);

}
