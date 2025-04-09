package com.classassess.classassess.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(AuthenticationException e) {
        return new ResponseEntity<>(new ErrorResponse(e.getMessage()), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException e) {
        return new ResponseEntity<>(new ErrorResponse(e.getMessage()), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        return new ResponseEntity<>(new ErrorResponse("An unexpected error occurred"), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    record ErrorResponse(String message) {}
}