package com.studypal.backend.controller;

import com.studypal.backend.service.AuthService;
import com.studypal.backend.model.User;
import com.studypal.backend.payload.LoginRequest;
import com.studypal.backend.payload.LoginResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000") // Add this line
public class AuthController {

    @Autowired
    private AuthService authService;

    // Register new user
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        return authService.register(user);
    }

    // Login and return JWT token
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        return authService.login(loginRequest);
    }
}
