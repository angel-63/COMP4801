package com.comp4801.jobportal.services;

import com.comp4801.jobportal.dto.RegistrationRequest;
import com.comp4801.jobportal.model.SavedJob;
import com.comp4801.jobportal.model.Skill;
import com.comp4801.jobportal.model.User;
import com.comp4801.jobportal.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public User registerUser(@Valid RegistrationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        request.getPreferences().setId(new ObjectId().toString());

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .location(request.getLocation())
                .preferenceTags(request.getPreferences())
                .skillTags(request.getSkills())
                .links(request.getLinks() != null ? request.getLinks() : new ArrayList<>())
                .education(request.getEducations() != null ? request.getEducations() : new ArrayList<>())
                .workExperience(request.getExperiences() != null ? request.getExperiences() : new ArrayList<>())
                .project(request.getProjects() != null ? request.getProjects() : new ArrayList<>())
                .build();

        return userRepository.save(user);
    }

    public User login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        return user;
    }

    public User getUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + email));
    }

    public User saveUser(String id, User user) {
        User existingUser = getUserById(id);
        user.setId(id);
        user.setPassword(existingUser.getPassword());
        user.getPreferenceTags().setId(existingUser.getPreferenceTags().getId());
        if (user.getSavedJobs() == null) {
            user.setSavedJobs(existingUser.getSavedJobs());
        } else {
            user.setSavedJobs(normalizeSavedJobs(user.getSavedJobs()));
        }
        return userRepository.save(user);
    }

    public List<SavedJob> getSavedJobs(String id) {
        User user = getUserById(id);
        return new ArrayList<>(user.getSavedJobs() == null ? List.of() : user.getSavedJobs());
    }

    public List<SavedJob> upsertSavedJob(String id, SavedJob savedJob) {
        User user = getUserById(id);
        List<SavedJob> existing = new ArrayList<>(user.getSavedJobs() == null ? List.of() : user.getSavedJobs());

        savedJob.setSavedAt(hasText(savedJob.getSavedAt()) ? savedJob.getSavedAt() : Instant.now().toString());

        existing.removeIf(item -> item != null && savedJob.getId() != null && savedJob.getId().equals(item.getId()));
        existing.add(0, savedJob);

        user.setSavedJobs(normalizeSavedJobs(existing));
        userRepository.save(user);
        return user.getSavedJobs();
    }

    public List<SavedJob> replaceSavedJobs(String id, List<SavedJob> savedJobs) {
        User user = getUserById(id);
        user.setSavedJobs(normalizeSavedJobs(savedJobs));
        userRepository.save(user);
        return user.getSavedJobs();
    }

    public List<SavedJob> removeSavedJob(String id, String jobId) {
        User user = getUserById(id);
        List<SavedJob> existing = new ArrayList<>(user.getSavedJobs() == null ? List.of() : user.getSavedJobs());
        existing.removeIf(item -> item != null && jobId.equals(item.getId()));
        user.setSavedJobs(existing);
        userRepository.save(user);
        return user.getSavedJobs();
    }

    private List<SavedJob> normalizeSavedJobs(List<SavedJob> savedJobs) {
        if (savedJobs == null || savedJobs.isEmpty()) {
            return new ArrayList<>();
        }

        Map<String, SavedJob> deduped = new LinkedHashMap<>();

        for (SavedJob item : savedJobs) {
            if (item == null || !hasText(item.getId())) {
                continue;
            }

            if (!hasText(item.getSavedAt())) {
                item.setSavedAt(Instant.now().toString());
            }

            deduped.put(item.getId(), item);
        }

        return deduped.values().stream()
                .sorted(Comparator.comparing(UserService::parseSavedAt).reversed())
                .toList();
    }

    private static Instant parseSavedAt(SavedJob savedJob) {
        try {
            return Instant.parse(savedJob.getSavedAt());
        } catch (Exception ignored) {
            return Instant.EPOCH;
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}