package com.classassess.classassess.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, String>> home() {
        return ResponseEntity.ok(Map.of(
                "message", "ClassAssess API is running",
                "status", "UP",
                "version", "1.0.0"
        ));
    }
    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", new java.util.Date().toString());
        response.put("message", "API is healthy");
        return ResponseEntity.ok(response);
    }
}