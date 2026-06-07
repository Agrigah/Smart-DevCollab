package ma.enset.smartdevcollab.controller;
import ma.enset.smartdevcollab.service.AnalyticsService; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/analytics") public class AnalyticsController{ private final AnalyticsService service; public AnalyticsController(AnalyticsService service){this.service=service;} @GetMapping("/project/{id}") public Map<String,Object> project(@PathVariable Long id){return service.project(id);} }
