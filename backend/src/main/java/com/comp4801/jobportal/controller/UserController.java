package com.comp4801.jobportal.controller;

import com.comp4801.jobportal.dto.RegistrationRequest;
import com.comp4801.jobportal.model.User;
import com.comp4801.jobportal.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class UserController {
    @Autowired
    private final UserService userService;

//    @GetMapping("/login")
//    public ResponseEntity<User> login(@Valid @RequestBody String email, String password) {
//        User user = userService.login(email, password);
//        return ResponseEntity.status(HttpStatus.CREATED).body(user);
//    }
//
//    @PostMapping("/register")
//    public ResponseEntity<User> register(@Valid @RequestBody RegistrationRequest request) {
//        User user = userService.registerUser(request);
//        return ResponseEntity.status(HttpStatus.CREATED).body(user);
//    }

    @GetMapping("/{userId}")
    public ResponseEntity<User> getUser(@PathVariable String id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PatchMapping()
    public ResponseEntity<User> updateProfile(@RequestBody @Valid User profile) {
        return ResponseEntity.ok(userService.createOrUpdateProfile(profile));
    }

}
