package ma.enset.smartdevcollab.repository;

import ma.enset.smartdevcollab.entity.ProjectMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectMessageRepository extends JpaRepository<ProjectMessage, Long> {

    List<ProjectMessage> findTop50ByProjectIdOrderByCreatedAtAsc(Long projectId);

    void deleteByProjectId(Long projectId);
}