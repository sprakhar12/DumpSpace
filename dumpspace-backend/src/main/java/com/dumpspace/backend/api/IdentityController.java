package com.dumpspace.backend.api;

import com.google.firebase.auth.FirebaseToken;
import com.dumpspace.backend.users.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class IdentityController {

    private final UserService userService;

    public IdentityController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/identity")
    public Map<String, Object> identity(HttpServletRequest request) throws Exception {
        FirebaseToken token = (FirebaseToken) request.getAttribute("firebaseToken");
        return userService.upsertUser(token);
    }
}
