package ma.enset.smartdevcollab.controller;

import ma.enset.smartdevcollab.entity.User;
import ma.enset.smartdevcollab.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*")
public class UserController {

    private final UserRepository users;

    public UserController(UserRepository users) {
        this.users = users;
    }

    @GetMapping
    public List<User> all() {
        return users.findAll();
    }
}