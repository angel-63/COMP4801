package com.comp4801.jobportal.controller;

import com.comp4801.jobportal.dto.UserProfileResponse;
import com.comp4801.jobportal.model.SavedJob;
import com.comp4801.jobportal.model.User;
import com.comp4801.jobportal.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
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
//
//import com.comp4801.jobportal.dto.RegistrationRequest;
//        import com.comp4801.jobportal.model.User;
//        import com.comp4801.jobportal.services.UserService;
//        import jakarta.validation.Valid;
//        import lombok.RequiredArgsConstructor;
//        import org.springframework.beans.factory.annotation.Autowired;
//        import org.springframework.http.HttpStatus;
//        import org.springframework.http.ResponseEntity;
//        import org.springframework.web.bind.annotation.*;
//
//@RestController
//@RequiredArgsConstructor
//@RequestMapping("/api/user")
//public class UserController {
//    @Autowired
//    private final UserService userService;
//
////    @GetMapping("/login")
////    public ResponseEntity<User> login(@Valid @RequestBody String email, String password) {
////        User user = userService.login(email, password);
////        return ResponseEntity.status(HttpStatus.CREATED).body(user);
////    }
////
////    @PostMapping("/register")
////    public ResponseEntity<User> register(@Valid @RequestBody RegistrationRequest request) {
////        User user = userService.registerUser(request);
////        return ResponseEntity.status(HttpStatus.CREATED).body(user);
////    }
//
//    @GetMapping("/{userId}")
//    public ResponseEntity<User> getUser(@PathVariable String id) {
//        User user = userService.getUserById(id);
//        return ResponseEntity.ok(user);
//    }
//
//    @PatchMapping()
//    public ResponseEntity<User> updateProfile(@RequestBody @Valid User profile) {
//        return ResponseEntity.ok(userService.createOrUpdateProfile(profile));
//    }
//
//}
