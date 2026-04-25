package com.comp4801.jobportal.controller;

import com.comp4801.jobportal.dto.LoginRequest;
import com.comp4801.jobportal.dto.RegistrationRequest;
import com.comp4801.jobportal.dto.UserProfileResponse;
import com.comp4801.jobportal.dto.UserUpdateRequest;
import com.comp4801.jobportal.model.SavedJob;
import com.comp4801.jobportal.model.User;
import com.comp4801.jobportal.services.JwtUtil;
import com.comp4801.jobportal.services.UserService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/users")
@AllArgsConstructor
public class UserController {
    @Autowired
    private final UserService userService;
    @Autowired
    private final JwtUtil jwtUtil;

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileResponse> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(UserProfileResponse.from(userService.getUserById(id)));
    }

    @GetMapping
    public ResponseEntity<UserProfileResponse> getUserByEmail(@RequestParam String email) {
        return ResponseEntity.ok(UserProfileResponse.from(userService.getUserByEmail(email)));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegistrationRequest request) {
        log.info("REGISTER - Request body bound: " + request);
        User user = userService.registerUser(request);
        String token = jwtUtil.generateToken(user.getId());
        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        response.put("userId", user.getId());
        response.put("email", user.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@Valid @RequestBody LoginRequest loginRequest) {
        User user = userService.login(loginRequest.getEmail(), loginRequest.getPassword());
        String token = jwtUtil.generateToken(user.getId());
        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        response.put("userId", user.getId());
        response.put("email", user.getEmail());
        return ResponseEntity.ok(response);
    }


    @PutMapping("/{id}")
    public ResponseEntity<UserProfileResponse> saveUser(@PathVariable String id, @RequestBody UserUpdateRequest updateRequest) {
        log.info("SAVE - Request body found: " + updateRequest);
        User user = updateRequest.toUser();
        user.setId(id);
        return ResponseEntity.ok(UserProfileResponse.from(userService.saveUser(id, user)));
    }

    @GetMapping("/{id}/saved-jobs")
    public ResponseEntity<List<SavedJob>> getSavedJobs(@PathVariable String id) {
        return ResponseEntity.ok(userService.getSavedJobs(id));
    }

    @PutMapping("/{id}/saved-jobs")
    public ResponseEntity<List<SavedJob>> replaceSavedJobs(
            @PathVariable String id,
            @RequestBody List<SavedJob> savedJobs
    ) {
        return ResponseEntity.ok(userService.replaceSavedJobs(id, savedJobs));
    }

    @PostMapping("/{id}/saved-jobs")
    public ResponseEntity<List<SavedJob>> saveSavedJob(@PathVariable String id, @RequestBody SavedJob savedJob) {
        return ResponseEntity.ok(userService.upsertSavedJob(id, savedJob));
    }

    @DeleteMapping("/{id}/saved-jobs/{jobId}")
    public ResponseEntity<List<SavedJob>> deleteSavedJob(@PathVariable String id, @PathVariable String jobId) {
        return ResponseEntity.ok(userService.removeSavedJob(id, jobId));
    }
}
