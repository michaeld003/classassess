package com.classassess.classassess.repository;

import com.classassess.classassess.model.User;
import com.classassess.classassess.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);

    // methods for account status
    List<User> findByAccountStatus(User.AccountStatus status);
    long countByAccountStatus(User.AccountStatus status);

    // methods for soft delete
    List<User> findByIsDeletedFalse();
    List<User> findByRoleAndIsDeletedFalse(Role role);
    List<User> findByAccountStatusAndIsDeletedFalse(User.AccountStatus status);
    long countByIsDeletedFalse();
}