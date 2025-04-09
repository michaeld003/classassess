package com.classassess.classassess.repository;

import com.classassess.classassess.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface UserSoftDeleteRepository extends JpaRepository<User, Long> {

    @Modifying
    @Transactional
    @Query(value = "UPDATE users SET is_deleted = true, is_enabled = false WHERE id = :userId", nativeQuery = true)
    void softDeleteUser(@Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query(value = "UPDATE users SET is_deleted = false WHERE id = :userId", nativeQuery = true)
    void restoreUser(@Param("userId") Long userId);

    @Query(value = "SELECT * FROM users WHERE is_deleted = false", nativeQuery = true)
    List<User> findAllActiveUsers();

    @Query(value = "SELECT * FROM users", nativeQuery = true)
    List<User> findAllIncludingDeleted();
}