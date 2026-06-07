package ma.enset.smartdevcollab.controller;

import ma.enset.smartdevcollab.dto.ProjectDtos.MemberRequest;
import ma.enset.smartdevcollab.dto.ProjectDtos.ProjectRequest;
import ma.enset.smartdevcollab.entity.ActivityLog;
import ma.enset.smartdevcollab.entity.Project;
import ma.enset.smartdevcollab.entity.ProjectMember;
import ma.enset.smartdevcollab.service.ActivityService;
import ma.enset.smartdevcollab.service.ProjectService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin("*")
public class ProjectController {

    private final ProjectService service;
    private final ActivityService activity;

    public ProjectController(ProjectService service, ActivityService activity) {
        this.service = service;
        this.activity = activity;
    }

    @GetMapping
    public List<Project> all(Authentication authentication) {
        String email = getEmail(authentication);
        return service.all(email);
    }

    @PostMapping
    public Project create(@RequestBody ProjectRequest r, Authentication authentication) {
        String email = getEmail(authentication);
        return service.create(r, email);
    }

    @PutMapping("/{id}")
    public Project update(@PathVariable Long id, @RequestBody ProjectRequest r) {
        return service.update(id, r);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PostMapping("/{id}/members")
    public Project addMember(@PathVariable Long id, @RequestBody MemberRequest r) {
        return service.addMember(id, r.userId());
    }

    @GetMapping("/{id}/members")
    public List<ProjectMember> members(@PathVariable Long id) {
        return service.members(id);
    }

    @GetMapping("/{id}/activity")
    public List<ActivityLog> logs(@PathVariable Long id) {
        return activity.byProject(id);
    }

    private String getEmail(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }

        return "demo@smartdevcollab.com";
    }
}