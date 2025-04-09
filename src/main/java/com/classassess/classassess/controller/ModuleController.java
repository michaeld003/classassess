package com.classassess.classassess.controller;

import com.classassess.classassess.dto.*;
import com.classassess.classassess.exception.ResourceNotFoundException;
import com.classassess.classassess.model.Module;
import com.classassess.classassess.model.Resource;
import com.classassess.classassess.model.Test;
import com.classassess.classassess.model.User;
import com.classassess.classassess.repository.ModuleRepository;
import com.classassess.classassess.repository.ResourceRepository;
import com.classassess.classassess.service.ModuleService;
import com.classassess.classassess.service.SubmissionService;
import com.classassess.classassess.service.TestService;
import com.classassess.classassess.service.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import com.classassess.classassess.dto.TestDTO;

@RestController
@RequestMapping("/api/modules")
@CrossOrigin(origins = {"http://localhost:5173"}, allowCredentials = "true")
@RequiredArgsConstructor
public class ModuleController {

    private final ModuleService moduleService;
    private final ModuleRepository moduleRepository;
    private final ResourceRepository resourceRepository;
    private final TestService testService;
    private final SubmissionService submissionService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<ModuleDTO>> getAllModules() {
        return ResponseEntity.ok(moduleService.getAllModules());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getModuleById(@PathVariable Long id) {
        try {
            Module module = moduleRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

            // Check if module is active or user is admin/lecturer of this module
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            boolean isModuleLecturer = false;

            // Check if current user is the lecturer for this module
            User currentUser = userService.getCurrentUser();
            if (module.getLecturer() != null && currentUser != null) {
                isModuleLecturer = module.getLecturer().getId().equals(currentUser.getId());
            }

            // Allow access if admin OR module is active OR user is the module's lecturer
            if (!isAdmin && !isModuleLecturer && (module.getActive() == null || !module.getActive())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(false, "This module is currently inactive"));
            }

            return ResponseEntity.ok(moduleService.getModuleById(id));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error retrieving module: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/details")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ModuleDetailsDTO> getModuleDetails(@PathVariable Long id) {
        return ResponseEntity.ok(moduleService.getModuleDetails(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    public ResponseEntity<?> createModule(@RequestBody ModuleDTO moduleDTO) {
        try {
            System.out.println("Creating module with data: " + moduleDTO);
            ModuleDTO created = moduleService.createModule(moduleDTO);
            System.out.println("Module created successfully: " + created.getId());
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            System.err.println("Error creating module: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error creating module: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    public ResponseEntity<?> updateModule(@PathVariable Long id, @RequestBody ModuleDTO moduleDTO) {
        try {
            System.out.println("Updating module with id: " + id);
            ModuleDTO updated = moduleService.updateModule(id, moduleDTO);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            System.err.println("Error updating module: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error updating module: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    public ResponseEntity<?> deleteModule(@PathVariable Long id) {
        try {
            System.out.println("Deleting module with id: " + id);
            moduleService.deleteModule(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("Error deleting module: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error deleting module: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/enroll")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> enrollStudent(@PathVariable Long id) {
        List<Long> moduleIds = List.of(id);
        moduleService.enrollStudentInModules(moduleIds);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/enrolled")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<ModuleDTO>> getEnrolledModules() {
        return ResponseEntity.ok(moduleService.getEnrolledModules());
    }

    @GetMapping("/teaching")
    @PreAuthorize("hasRole('LECTURER')")
    public ResponseEntity<List<ModuleDTO>> getTeachingModules() {
        return ResponseEntity.ok(moduleService.getTeachingModules());
    }

    @GetMapping("/{id}/announcements")
    public ResponseEntity<List<AnnouncementDTO>> getModuleAnnouncements(@PathVariable Long id) {
        return ResponseEntity.ok(moduleService.getModuleAnnouncements(id));
    }

    @GetMapping("/{id}/resources")
    public ResponseEntity<List<ResourceDTO>> getModuleResources(@PathVariable Long id) {
        return ResponseEntity.ok(moduleService.getModuleResources(id));
    }

    @GetMapping("/{id}/tests")
    public ResponseEntity<List<TestDTO>> getModuleTests(@PathVariable Long id) {
        return ResponseEntity.ok(moduleService.getModuleTests(id));
    }

    @GetMapping("/student/dashboard")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentDashboardDTO> getStudentDashboard() {
        return ResponseEntity.ok(moduleService.getStudentDashboard());
    }

    @GetMapping("/available")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<ModuleDTO>> getAvailableModules() {
        return ResponseEntity.ok(moduleService.getAvailableModules());
    }

    @PostMapping("/enroll")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> enrollInModules(@RequestBody ModuleEnrollmentRequest request) {
        moduleService.enrollStudentInModules(request.getModuleIds());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ModuleDTO>> getAllModulesWithDetails() {
        try {
            System.out.println("Admin requesting all modules with details");
            List<ModuleDTO> modules = moduleService.getAllModulesWithDetails();
            System.out.println("Found " + modules.size() + " modules to return");
            return ResponseEntity.ok(modules);
        } catch (Exception e) {
            System.err.println("Error in /admin/all endpoint: " + e.getMessage());
            e.printStackTrace();

            // Return empty list instead of 500 error to avoid frontend crash
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    public ResponseEntity<ModuleDTO> toggleModuleStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> status) {
        try {
            System.out.println("Toggling module status for id: " + id);
            boolean isActive = status.get("active");
            System.out.println("Setting active status to: " + isActive);

            ModuleDTO updatedModule = moduleService.toggleModuleStatus(id, isActive);
            return ResponseEntity.ok(updatedModule);
        } catch (Exception e) {
            System.err.println("Error toggling module status: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }


    @GetMapping("/{id}/status-history")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    public ResponseEntity<List<ModuleStatusHistoryDTO>> getModuleStatusHistory(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(moduleService.getModuleStatusHistory(id));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/resources")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    public ResponseEntity<ResourceDTO> uploadResource(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("file") MultipartFile file) {

        try {
            ResourceDTO resource = moduleService.uploadResource(id, title, description, file);
            return ResponseEntity.ok(resource);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{moduleId}/resources/{resourceId}/download")
    public ResponseEntity<?> downloadResource(
            @PathVariable Long moduleId,
            @PathVariable Long resourceId) {

        try {
            Resource resource = resourceRepository.findById(resourceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

            // Verify the resource belongs to the specified module
            if (!resource.getModule().getId().equals(moduleId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // Get the file path from the URL
            String filePath = resource.getUrl().replace("/uploads", "uploads");
            Path path = Paths.get(filePath);

            // Check if file exists
            if (!Files.exists(path)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "File not found"));
            }

            // Load file as Resource
            org.springframework.core.io.Resource fileResource = new FileSystemResource(path);

            // Determine content type
            String contentType = resource.getType();

            // Extract filename from path for Content-Disposition header
            String filename = path.getFileName().toString();

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(fileResource);

        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error downloading resource"));
        }
    }

    @GetMapping("/{id}/students")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    public ResponseEntity<List<UserDTO>> getModuleStudents(@PathVariable Long id) {
        try {
            Module module = moduleRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

            List<UserDTO> students = moduleService.getModuleStudents(id);
            return ResponseEntity.ok(students);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{moduleId}/resources/{resourceId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    @Transactional
    public ResponseEntity<?> deleteResource(
            @PathVariable Long moduleId,
            @PathVariable Long resourceId) {

        System.out.println("DELETE request for resource " + resourceId + " in module " + moduleId);

        try {
            // Find the resource
            Resource resource = resourceRepository.findById(resourceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

            System.out.println("Found resource: " + resource.getTitle());

            // Verify ownership
            if (!resource.getModule().getId().equals(moduleId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(false, "Resource doesn't belong to this module"));
            }

            // First, delete any files
            if (resource.getUrl() != null && !resource.getUrl().isEmpty()) {
                try {
                    String filePath = resource.getUrl().replace("/uploads", "uploads");
                    Path path = Paths.get(filePath);
                    Files.deleteIfExists(path);
                    System.out.println("Physical file deleted successfully");
                } catch (IOException e) {
                    System.err.println("Error deleting file: " + e.getMessage());
                    // Continue with database deletion
                }
            }

            // Delete from database - use direct SQL to ensure deletion
            System.out.println("Deleting resource from database");
            resourceRepository.deleteById(resourceId);

            // Verify deletion
            boolean exists = resourceRepository.existsById(resourceId);
            System.out.println("Resource still exists after deletion: " + exists);

            if (exists) {
                // Force delete if still exists
                System.out.println("Resource still exists, forcing deletion");
                resourceRepository.deleteById(resourceId);

                // Second verification
                exists = resourceRepository.existsById(resourceId);
                System.out.println("Resource still exists after forced deletion: " + exists);

                if (exists) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(new ApiResponse(false, "Failed to delete resource"));
                }
            }

            // Return success response
            return ResponseEntity.ok()
                    .body(new ApiResponse(true, "Resource deleted successfully"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error deleting resource: " + e.getMessage()));
        }
    }
    @GetMapping("/{moduleId}/tests/{testId}")
    public ResponseEntity<?> getTestDetails(@PathVariable Long moduleId, @PathVariable Long testId) {
        try {
            System.out.println("Fetching test details for moduleId=" + moduleId + ", testId=" + testId);

            // Check if module exists
            boolean moduleExists = moduleRepository.existsById(moduleId);
            if (!moduleExists) {
                System.out.println("Module not found: moduleId=" + moduleId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "Module not found"));
            }

            // Check if test exists
            boolean testExists = testService.testExists(testId);
            if (!testExists) {
                System.out.println("Test not found: testId=" + testId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "Test not found"));
            }

            // Get the test data
            TestDTO testDTO = testService.getTestById(testId);
            System.out.println("Successfully retrieved test details: " + testDTO);
            return ResponseEntity.ok(testDTO);
        } catch (Exception e) {
            System.err.println("Error fetching test details: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error fetching test details: " + e.getMessage()));
        }
    }

    @PostMapping("/{moduleId}/tests")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    public ResponseEntity<?> createTestForModule(
            @PathVariable Long moduleId,
            @RequestBody TestDTO testDTO) {
        try {
            System.out.println("Creating test for module id: " + moduleId);

            // Set the moduleId from the path parameter
            testDTO.setModuleId(moduleId);

            // Call the service to create the test
            TestDTO createdTest = testService.createTest(testDTO);

            return ResponseEntity.ok(createdTest);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            System.err.println("Error creating test: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error creating test: " + e.getMessage()));
        }
    }

    @GetMapping("/{moduleId}/students/{studentId}/tests")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    public ResponseEntity<?> getStudentTests(
            @PathVariable Long moduleId,
            @PathVariable Long studentId) {
        try {
            // Verify module exists
            Module module = moduleRepository.findById(moduleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

            // Get the student
            User student = userService.getUserById(studentId);

            // Get all submissions for this student in this module
            List<Map<String, Object>> testResults = submissionService.getStudentTestsForModule(moduleId, studentId);

            return ResponseEntity.ok(testResults);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", true, "message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", true, "message", "Error retrieving student tests: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/announcements")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    public ResponseEntity<AnnouncementDTO> postAnnouncement(
            @PathVariable Long id,
            @RequestBody AnnouncementRequest announcementRequest) {

        System.out.println("Posting announcement for module: " + id);
        System.out.println("Title: " + announcementRequest.getTitle());

        try {
            AnnouncementDTO announcement = moduleService.createAnnouncement(
                    id,
                    announcementRequest.getTitle(),
                    announcementRequest.getContent());

            System.out.println("Announcement created with ID: " + announcement.getId());
            return ResponseEntity.ok(announcement);
        } catch (ResourceNotFoundException e) {
            System.err.println("Resource not found: " + e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Error creating announcement: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{moduleId}/announcements/{announcementId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    @Transactional
    public ResponseEntity<?> deleteAnnouncement(
            @PathVariable Long moduleId,
            @PathVariable Long announcementId) {

        try {
            moduleService.deleteAnnouncement(moduleId, announcementId);
            return ResponseEntity.ok()
                    .body(new ApiResponse(true, "Announcement deleted successfully"));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error deleting announcement: " + e.getMessage()));
        }
    }

    @GetMapping("/public/available-for-registration")
    public ResponseEntity<List<ModuleDTO>> getModulesForRegistration() {
        return ResponseEntity.ok(moduleService.getAllActiveModules());
    }
}