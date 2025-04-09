package com.classassess.classassess.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column
    private String department;

    @Column(name = "created_at", insertable = false, updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Builder.Default
    @Column(name = "is_enabled", columnDefinition = "BOOLEAN DEFAULT true")
    private Boolean isEnabled = true;

    @Builder.Default
    @Column(name = "is_account_non_locked", columnDefinition = "BOOLEAN DEFAULT true")
    private Boolean isAccountNonLocked = true;

    // New field for account approval status
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false, columnDefinition = "VARCHAR(255) DEFAULT 'PENDING'")
    private AccountStatus accountStatus = AccountStatus.PENDING;

    // New field to track who reviewed the account
    @Column(name = "reviewed_by_id")
    private Long reviewedById;

    // New field to track when the account status was last updated
    @Column(name = "status_updated_at")
    private LocalDateTime statusUpdatedAt;

    @Builder.Default
    @OneToMany(mappedBy = "student")
    private List<ModuleStudent> enrolledModules = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "lecturer")
    private List<Module> teachingModules = new ArrayList<>();

    // Account status enum
    public enum AccountStatus {
        PENDING,    // Awaiting admin approval
        APPROVED,   // Account approved and active
        REJECTED,   // Account rejected by admin
        SUSPENDED   // Account temporarily suspended
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isEnabled == null) {
            isEnabled = true;
        }
        if (isAccountNonLocked == null) {
            isAccountNonLocked = true;
        }
        if (accountStatus == null) {
            accountStatus = AccountStatus.PENDING;
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return isAccountNonLocked != null ? isAccountNonLocked : true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        // Only check the isEnabled field, not account status
        return isEnabled != null ? isEnabled : true;
    }

    public void setPassword(String password) {
        this.passwordHash = password;
    }

    @Builder.Default
    private Boolean isDeleted = false;

    // Add getter and setter
    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean deleted) {
        isDeleted = deleted;
    }

    @Column(name = "reset_token")
    private String resetToken;

    @Column(name = "reset_token_expiry")
    private Date resetTokenExpiry;

}