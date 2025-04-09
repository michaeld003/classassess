package com.classassess.classassess.dto;

import com.classassess.classassess.model.Role;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String department;
    private Role role;
    private boolean isEnabled;
    private boolean isAccountNonLocked;
    private String createdAt;
    private String password;
    private String accountStatus;


    private Boolean isDeleted;


    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean deleted) {
        isDeleted = deleted;
    }
}