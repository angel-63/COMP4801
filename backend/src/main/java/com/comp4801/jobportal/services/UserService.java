package com.comp4801.jobportal.services;

import com.comp4801.jobportal.dto.RegistrationRequest;
import com.comp4801.jobportal.model.Job;
import com.comp4801.jobportal.model.Preference;
import com.comp4801.jobportal.model.Skill;
import com.comp4801.jobportal.model.User;
import com.comp4801.jobportal.repository.JobRepository;
import com.comp4801.jobportal.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    @Autowired
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public User registerUser(@Valid RegistrationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        // convert List<String> skills to List<Skill> with proficiency null
        List<Skill> skillEntities = request.getSkills().stream()
                .map(skillName -> {
                    Skill skill = new Skill();
                    skill.setName(skillName);
                    skill.setProficiency(null);
                    return skill;
                })
                .collect(Collectors.toList());

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .location(request.getLocation())
                .links(request.getLinks())
                .preferences(request.getPreferences())
                .education(request.getEducations())
                .workExperience(request.getExperiences())
                .projects(request.getProjects())
                .skills(skillEntities)
                .build();

        return userRepository.save(user);
    }

    public User login(String email, String password){
        if (!userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email not yet registered");
        }
        return validateCredential(email, password);
    }

    private User validateCredential(String email, String password) {

    }

    public User createOrUpdateProfile(User user) {
        if (user.getId() == null) {
            // New user
            return userRepository.save(user);
        }
        // Update existing
        User existing = getUserById(user.getId());
        // Merge logic (you can use BeanUtils or manual mapping)
        return userRepository.save(user);
    }

    public User getUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User getProfileByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updatePreferences(String userId, Preference preferences) {
        User user = getUserById(userId);
        user.setPreferences(preferences);
        return userRepository.save(user);
    }
//    public Page<Job> getSavedJobs(String userId, Pageable pageable, String sortBy, String direction) {
//        // 1. Get saved job IDs for the user
//        List<String> jobIds = userRepository.findByUserId(userId)
//                .stream()
//                .map(SavedJob::getJobId)
//                .collect(Collectors.toList());
//
//        // 2. Delegate to userRepository method
//        return jobRepository.findJobsByIds(jobIds, pageable, sortBy, direction);
//    }
}
