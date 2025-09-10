package com.studypal.backend.service;

import com.studypal.backend.model.User;
import com.studypal.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Create or save a new user
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    // Find a user by email
    public Optional<User> findUserByEmail(String email) {
        return Optional.ofNullable(userRepository.findByEmail(email));
    }

    // Find a user by ID
    public Optional<User> findUserById(String id) {
        return userRepository.findById(id);
    }

    // Delete a user by ID
    public void deleteUserById(String id) {
        userRepository.deleteById(id);
    }
}