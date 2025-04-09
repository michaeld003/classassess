package com.classassess.classassess.dto;

public class AnnouncementRequest {
    private String title;
    private String content;

    // Default constructor
    public AnnouncementRequest() {
    }

    // Constructor with fields
    public AnnouncementRequest(String title, String content) {
        this.title = title;
        this.content = content;
    }

    // Getters and setters
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}