package ma.enset.smartdevcollab.controller;

import ma.enset.smartdevcollab.entity.ActivityLog;
import ma.enset.smartdevcollab.service.ActivityService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activity")
@CrossOrigin("*")
public class ActivityController {

    private final ActivityService service;

    public ActivityController(ActivityService service) {
        this.service = service;
    }

    @GetMapping("/project/{projectId}")
    public List<ActivityLog> byProject(@PathVariable Long projectId) {
        return service.byProject(projectId);
    }
}