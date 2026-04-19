package com.comp4801.jobportal.controller;

import com.comp4801.jobportal.dto.UserProfileResponse;
import com.comp4801.jobportal.model.SavedJob;
import com.comp4801.jobportal.model.User;
import com.comp4801.jobportal.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileResponse> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(UserProfileResponse.from(userService.getUserById(id)));
    }

    @GetMapping
    public ResponseEntity<UserProfileResponse> getUserByEmail(@RequestParam String email) {
        return ResponseEntity.ok(UserProfileResponse.from(userService.getUserByEmail(email)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserProfileResponse> saveUser(@PathVariable String id, @RequestBody User user) {
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
