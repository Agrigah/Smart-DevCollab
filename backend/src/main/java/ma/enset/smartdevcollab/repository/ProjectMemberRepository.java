package ma.enset.smartdevcollab.repository;

import ma.enset.smartdevcollab.entity.Project;
import ma.enset.smartdevcollab.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    List<ProjectMember> findByProjectId(Long projectId);

    boolean existsByProjectIdAndUserId(Long projectId, Long userId);

    void deleteByProjectId(Long projectId);

    @Query("SELECT pm.project FROM ProjectMember pm WHERE pm.user.email = :email")
    List<Project> findProjectsForUser(String email);

    @Query("SELECT COUNT(pm) > 0 FROM ProjectMember pm WHERE pm.project.id = :projectId AND pm.user.email = :email")
    boolean isMember(Long projectId, String email);
}