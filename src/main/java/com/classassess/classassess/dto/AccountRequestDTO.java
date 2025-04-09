package com.classassess.classassess.dto;

import com.classassess.classassess.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountRequestDTO {
    private Long id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String department;
    private Role role;
    private LocalDateTime requestDate;
}