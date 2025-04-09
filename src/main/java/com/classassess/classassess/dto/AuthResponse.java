package com.classassess.classassess.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private String email;
    private String role;
    private String fullName;

    // New fields for account status
    private String accountStatus;
    private String message;
    private boolean requiresApproval;
}