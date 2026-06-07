package ma.enset.smartdevcollab.service;

import ma.enset.smartdevcollab.entity.ActivityLog;
import ma.enset.smartdevcollab.entity.Project;
import ma.enset.smartdevcollab.entity.User;
import ma.enset.smartdevcollab.repository.ActivityLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ActivityService {

    private final ActivityLogRepository logs;

    public ActivityService(ActivityLogRepository logs) {
        this.logs = logs;
    }

    public void log(Project p, User u, String action) {
        logs.save(
                ActivityLog.builder()
                        .project(p)
                        .user(u)
                        .action(action)
                        .build()
        );
    }

    public List<ActivityLog> byProject(Long id) {
        return logs.findRecentByProjectId(id);
    }
}