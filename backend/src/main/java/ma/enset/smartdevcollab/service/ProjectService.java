package ma.enset.smartdevcollab.service;

import jakarta.transaction.Transactional;
import ma.enset.smartdevcollab.dto.ProjectDtos.*;
import ma.enset.smartdevcollab.entity.*;
import ma.enset.smartdevcollab.repository.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectService {

 private final ProjectRepository projects;
 private final UserRepository users;
 private final ProjectMemberRepository members;
 private final ActivityService activity;
 private final UserService userService;
 private final TaskRepository tasks;
 private final ActivityLogRepository activities;
 private final ProjectMessageRepository messages;

 public ProjectService(
         ProjectRepository projects,
         UserRepository users,
         ProjectMemberRepository members,
         ActivityService activity,
         UserService userService,
         TaskRepository tasks,
         ActivityLogRepository activities,
         ProjectMessageRepository messages
 ) {
  this.projects = projects;
  this.users = users;
  this.members = members;
  this.activity = activity;
  this.userService = userService;
  this.tasks = tasks;
  this.activities = activities;
  this.messages = messages;
 }

 public List<Project> all() {
  return projects.findAll();
 }

 public Project create(ProjectRequest r, String email) {
  User owner = userService.byEmailOrDemo(email);

  Project p = Project.builder()
          .title(r.title())
          .description(r.description())
          .deadline(r.deadline())
          .status(ProjectStatus.PLANNED)
          .owner(owner)
          .build();

  p = projects.save(p);

  members.save(
          ProjectMember.builder()
                  .project(p)
                  .user(owner)
                  .memberRole(MemberRole.OWNER)
                  .build()
  );

  activity.log(p, owner, "a créé le projet");

  return p;
 }

 public Project update(Long id, ProjectRequest r) {
  Project p = projects.findById(id).orElseThrow();

  p.setTitle(r.title());
  p.setDescription(r.description());
  p.setDeadline(r.deadline());

  return projects.save(p);
 }

 @Transactional
 public void delete(Long id) {
  tasks.deleteByProjectId(id);
  members.deleteByProjectId(id);
  activities.deleteByProjectId(id);
  messages.deleteByProjectId(id);
  projects.deleteById(id);
 }

 public Project addMember(Long id, Long userId) {
  Project p = projects.findById(id).orElseThrow();
  User u = users.findById(userId).orElseThrow();

  if (!members.existsByProjectIdAndUserId(id, userId)) {
   members.save(
           ProjectMember.builder()
                   .project(p)
                   .user(u)
                   .memberRole(MemberRole.MEMBER)
                   .build()
   );

   activity.log(p, u, "a rejoint le projet");
  }

  return p;
 }

 public List<Project> all(String email) {
  User user = users.findByEmail(email).orElse(null);

  if (user != null && (user.getRole() == Role.TEACHER || user.getRole() == Role.ADMIN)) {
   return projects.findAll();
  }

  return members.findProjectsForUser(email);
 }

 public List<ProjectMember> members(Long id) {
  return members.findByProjectId(id);
 }
}