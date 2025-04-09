package com.classassess.classassess.service;

import com.classassess.classassess.model.Module;
import com.classassess.classassess.dto.*;
import com.classassess.classassess.model.*;
import com.classassess.classassess.model.Module;
import com.classassess.classassess.repository.*;
import com.classassess.classassess.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModuleService {
    private final ModuleRepository moduleRepository;
    private final ModuleStudentRepository moduleStudentRepository;
    private final UserService userService;
    private final TestService testService;
    private final AnnouncementRepository announcementRepository;
    private final ResourceRepository resourceRepository;
    private final TestRepository testRepository;
    private final SubmissionRepository submissionRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final EmailService emailService;


    @Transactional
    public ModuleDTO createModule(ModuleDTO moduleDTO) {
        try {
            // Get current authenticated user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User currentUser = userService.getCurrentUser();
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            Module module = new Module();
            module.setCode(moduleDTO.getCode());
            module.setTitle(moduleDTO.getTitle());
            module.setDescription(moduleDTO.getDescription());
            module.setActive(true);
            module.setCreatedAt(LocalDateTime.now());

            // Set the lecturer based on role and provided data
            if (isAdmin && moduleDTO.getLecturerId() != null) {
                // Admin is creating module and specified a lecturer
                try {
                    User lecturer = userService.getUserById(moduleDTO.getLecturerId());
                    if (!lecturer.getRole().equals(Role.LECTURER)) {
                        throw new IllegalArgumentException("Selected user is not a lecturer");
                    }
                    module.setLecturer(lecturer);
                } catch (RuntimeException e) {
                    // This is to handle case where lecturer is not found
                    throw new ResourceNotFoundException("Lecturer not found with ID: " + moduleDTO.getLecturerId());
                }
            } else {
                // Default to current user (should be a lecturer if not admin)
                module.setLecturer(currentUser);
            }

            Module savedModule = moduleRepository.save(module);
            return toDTO(savedModule);
        } catch (Exception e) {
            System.err.println("Error in createModule service: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public List<ModuleDTO> getAllModules() {
        return moduleRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ModuleDTO getModuleById(Long id) {
        return moduleRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));
    }

    public ModuleDetailsDTO getModuleDetails(Long moduleId) {
        User currentUser = userService.getCurrentUser();
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        ModuleStudent enrollment = moduleStudentRepository
                .findByModuleAndStudent(module, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Not enrolled in this module"));

        List<AnnouncementDTO> announcements = getModuleAnnouncements(moduleId);
        List<ResourceDTO> resources = getModuleResources(moduleId);
        List<TestDTO> tests = getModuleTests(moduleId);

        return ModuleDetailsDTO.builder()
                .moduleInfo(toDTO(module))
                .progress(enrollment.getProgress())
                .announcements(announcements)
                .resources(resources)
                .tests(tests)
                .build();
    }

    @Transactional
    public ModuleDTO updateModule(Long id, ModuleDTO moduleDTO) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        // Update basic fields
        module.setCode(moduleDTO.getCode());
        module.setTitle(moduleDTO.getTitle());
        module.setDescription(moduleDTO.getDescription());

        // Handle lecturer assignment for admins
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin && moduleDTO.getLecturerId() != null) {
            try {
                User lecturer = userService.getUserById(moduleDTO.getLecturerId());
                if (!lecturer.getRole().equals(Role.LECTURER)) {
                    throw new IllegalArgumentException("Selected user is not a lecturer");
                }
                module.setLecturer(lecturer);
            } catch (RuntimeException e) {
                throw new ResourceNotFoundException("Lecturer not found with ID: " + moduleDTO.getLecturerId());
            }
        }

        return toDTO(moduleRepository.save(module));
    }

    @Transactional
    public void deleteModule(Long id) {
        try {
            Module module = moduleRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + id));

            // Check if the module has any students enrolled
            if (moduleStudentRepository.countByModule(module) > 0) {
                throw new IllegalStateException("Cannot delete module with enrolled students");
            }

            // Check if the module has any tests
            if (!module.getTests().isEmpty()) {
                throw new IllegalStateException("Cannot delete module with existing tests");
            }

            // Proceed with deletion
            moduleRepository.delete(module);
            System.out.println("Module deleted successfully: " + id);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("Unexpected error deleting module: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to delete module: " + e.getMessage());
        }
    }

    public List<ModuleDTO> getEnrolledModules() {
        User student = userService.getCurrentUser();
        List<ModuleStudent> enrollments = moduleStudentRepository.findByStudent(student);
        return enrollments.stream()
                .map(enrollment -> {
                    ModuleDTO dto = toDTO(enrollment.getModule());
                    dto.setProgress(enrollment.getProgress());
                    dto.setIsEnrolled(true);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public List<ModuleDTO> getTeachingModules() {
        User lecturer = userService.getCurrentUser();
        return moduleRepository.findByLecturer(lecturer).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<AnnouncementDTO> getModuleAnnouncements(Long moduleId) {
        return announcementRepository.findByModuleId(moduleId).stream()
                .map(this::toAnnouncementDTO)
                .collect(Collectors.toList());
    }

    public List<ResourceDTO> getModuleResources(Long moduleId) {
        return resourceRepository.findByModuleId(moduleId).stream()
                .map(this::toResourceDTO)
                .collect(Collectors.toList());
    }

    public List<TestDTO> getModuleTests(Long moduleId) {
        User currentUser = userService.getCurrentUser();
        return testRepository.findByModuleId(moduleId).stream()
                .map(test -> {
                    TestDTO dto = toTestDTO(test);
                    submissionRepository.findByTestAndStudent(test, currentUser)
                            .ifPresent(submission -> {
                                dto.setStatus(submission.getStatus());
                                dto.setScore(submission.getTotalScore());
                            });
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public StudentDashboardDTO getStudentDashboard() {
        User student = userService.getCurrentUser();
        List<ModuleDTO> enrolledModules = getEnrolledModules();
        List<TestDTO> upcomingTests = testService.getUpcomingTestsByStudent(student.getId());
        List<SubmissionDTO> recentResults = submissionRepository.findByStudentOrderBySubmittedAtDesc(student)
                .stream()
                .limit(5)
                .map(this::toSubmissionDTO)
                .collect(Collectors.toList());

        return StudentDashboardDTO.builder()
                .enrolledModules(enrolledModules)
                .upcomingTests(upcomingTests)
                .pastResults(recentResults)
                .build();
    }

    private Module toEntity(ModuleDTO dto) {
        Module module = new Module();
        module.setTitle(dto.getTitle());
        module.setCode(dto.getCode());
        module.setDescription(dto.getDescription());
        module.setStartDate(dto.getStartDate());
        module.setEndDate(dto.getEndDate());
        return module;
    }

    private void updateModuleFromDTO(Module module, ModuleDTO dto) {
        module.setTitle(dto.getTitle());
        module.setCode(dto.getCode());
        module.setDescription(dto.getDescription());
        module.setStartDate(dto.getStartDate());
        module.setEndDate(dto.getEndDate());
    }

    /**
     * Safe DTO conversion for admin views that doesn't require current user context
     */
    private ModuleDTO toDTOForAdmin(Module module) {
        try {
            ModuleDTO dto = new ModuleDTO();
            dto.setId(module.getId());
            dto.setTitle(module.getTitle());
            dto.setCode(module.getCode());
            dto.setDescription(module.getDescription());
            dto.setStartDate(module.getStartDate());
            dto.setEndDate(module.getEndDate());

            // Safely access lecturer info
            if (module.getLecturer() != null) {
                dto.setLecturerName(module.getLecturer().getFullName());

            } else {
                dto.setLecturerName("Unknown");
            }

            dto.setIsActive(module.getActive());

            // Default values for user-specific fields
            dto.setIsEnrolled(false);
            dto.setProgress(0.0);

            // Get student count
            Long studentCount = moduleStudentRepository.countByModule(module);
            dto.setStudentCount(studentCount != null ? studentCount : 0L);

            return dto;
        } catch (Exception e) {
            System.err.println("Error in toDTOForAdmin: " + e.getMessage());
            e.printStackTrace();
            // Return basic DTO with essential info to prevent complete failure
            ModuleDTO basicDto = new ModuleDTO();
            basicDto.setId(module.getId());
            basicDto.setTitle(module.getTitle() != null ? module.getTitle() : "Unknown");
            basicDto.setCode(module.getCode() != null ? module.getCode() : "Unknown");
            basicDto.setIsActive(module.getActive() != null ? module.getActive() : false);
            return basicDto;
        }
    }

    private ModuleDTO toDTO(Module module) {
        try {
            ModuleDTO dto = new ModuleDTO();
            dto.setId(module.getId());
            dto.setTitle(module.getTitle());
            dto.setCode(module.getCode());
            dto.setDescription(module.getDescription());
            dto.setStartDate(module.getStartDate());
            dto.setEndDate(module.getEndDate());

            // Check for null lecturer
            if (module.getLecturer() != null) {
                dto.setLecturerName(module.getLecturer().getFullName());

            } else {
                dto.setLecturerName("Unknown");
            }

            dto.setIsActive(module.getActive());

            try {
                User currentUser = userService.getCurrentUser();
                boolean isEnrolled = moduleStudentRepository.existsByModuleAndStudent(module, currentUser);
                dto.setIsEnrolled(isEnrolled);

                if (isEnrolled) {
                    ModuleStudent enrollment = moduleStudentRepository
                            .findByModuleAndStudent(module, currentUser)
                            .orElse(null);
                    if (enrollment != null) {
                        dto.setProgress(enrollment.getProgress());
                    }
                }
            } catch (Exception e) {
                // Handle user not found or authentication issues
                System.out.println("Could not get current user for module DTO: " + e.getMessage());
                dto.setIsEnrolled(false);
                dto.setProgress(0.0);
            }

            Long studentCount = moduleStudentRepository.countByModule(module);
            dto.setStudentCount(studentCount != null ? studentCount : 0L);
            return dto;
        } catch (Exception e) {
            System.err.println("Error in toDTO: " + e.getMessage());
            e.printStackTrace();
            // Return basic DTO with essential info to prevent complete failure
            ModuleDTO basicDto = new ModuleDTO();
            basicDto.setId(module.getId());
            basicDto.setTitle(module.getTitle() != null ? module.getTitle() : "Unknown");
            basicDto.setCode(module.getCode() != null ? module.getCode() : "Unknown");
            basicDto.setIsActive(module.getActive() != null ? module.getActive() : false);
            return basicDto;
        }
    }

    private AnnouncementDTO toAnnouncementDTO(Announcement announcement) {
        return AnnouncementDTO.builder()
                .id(announcement.getId())
                .title(announcement.getTitle())
                .content(announcement.getContent())
                .date(announcement.getCreatedAt())
                .build();
    }

    private ResourceDTO toResourceDTO(Resource resource) {
        return ResourceDTO.builder()
                .id(resource.getId())
                .title(resource.getTitle())
                .type(resource.getType())
                .url(resource.getUrl())
                .build();
    }

    private TestDTO toTestDTO(Test test) {
        return TestDTO.builder()
                .id(test.getId())
                .title(test.getTitle())
                .description(test.getDescription())
                .startTime(test.getStartTime())
                .endTime(test.getEndTime())
                .durationMinutes(test.getDurationMinutes())
                .moduleCode(test.getModule().getCode())
                .build();
    }

    private SubmissionDTO toSubmissionDTO(Submission submission) {
        return SubmissionDTO.builder()
                .id(submission.getId())
                .testId(submission.getTest().getId())
                .testTitle(submission.getTest().getTitle())
                .moduleCode(submission.getTest().getModule().getCode())
                .submittedAt(submission.getSubmittedAt())
                .status(submission.getStatus())
                .totalScore(submission.getTotalScore())
                .build();
    }

    @Transactional
    public void enrollStudentInModules(List<Long> moduleIds) {
        User student = userService.getCurrentUser();

        // Check if student already has enrollments
        List<ModuleStudent> currentEnrollments = moduleStudentRepository.findByStudent(student);
        if (!currentEnrollments.isEmpty()) {
            throw new RuntimeException("Student is already enrolled in modules");
        }

        // Validate number of modules
        if (moduleIds.size() != 3) {
            throw new RuntimeException("Students must enroll in exactly 3 modules");
        }

        // Enroll in each module
        for (Long moduleId : moduleIds) {
            Module module = moduleRepository.findById(moduleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + moduleId));

            ModuleStudent enrollment = new ModuleStudent(module, student);
            moduleStudentRepository.save(enrollment);
        }
    }

    public List<ModuleDTO> getAvailableModules() {
        User student = userService.getCurrentUser();

        // Get all modules
        List<Module> allModules = moduleRepository.findAll();

        // Get modules the student is already enrolled in
        List<Module> enrolledModules = moduleStudentRepository.findByStudent(student)
                .stream()
                .map(ModuleStudent::getModule)
                .collect(Collectors.toList());

        // Filter out enrolled modules and convert to DTOs
        return allModules.stream()
                .filter(module -> !enrolledModules.contains(module))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ModuleDTO toggleModuleStatus(Long id, boolean isActive) {
        try {
            System.out.println("Toggling module status for id: " + id + " to " + isActive);
            Module module = moduleRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

            // Store original active state
            Boolean wasActive = module.getActive();

            // Explicitly print current status before change
            System.out.println("Current active status: " + module.getActive());

            // Set the new status
            module.setActive(isActive);

            // If deactivating, also update status of associated tests if they exist
            if (!isActive && module.getTests() != null) {
                for (Test test : module.getTests()) {
                    // Use CANCELLED status instead of INACTIVE
                    if (test.getStatus() != Test.TestStatus.CANCELLED) {
                        test.setStatus(Test.TestStatus.CANCELLED);
                    }
                }
            } else if (isActive && module.getTests() != null) {
                // If activating, restore tests to ACTIVE status where appropriate
                for (Test test : module.getTests()) {
                    // Only reset tests that haven't been explicitly cancelled by a lecturer
                    if (test.getEndTime() != null && test.getEndTime().isAfter(LocalDateTime.now())) {
                        test.setStatus(Test.TestStatus.ACTIVE);
                    }
                }
            }

            // Save and flush to ensure immediate persistence
            Module savedModule = moduleRepository.saveAndFlush(module);

            // Verify the change took effect
            System.out.println("New active status after save: " + savedModule.getActive());

            // If deactivating a previously active module, send deactivation notifications
            if (wasActive != null && wasActive && !isActive) {
                try {
                    notificationService.handleModuleDeactivationNotification(savedModule);

                    List<User> adminUsers = userRepository.findByRole(Role.ADMIN);
                    for (User admin : adminUsers) {
                        emailService.sendModuleStatusChangeNotification(
                                admin.getEmail(),
                                admin.getFullName(),
                                savedModule.getTitle(),
                                isActive
                        );
                    }
                } catch (Exception e) {
                    // Log but don't fail the operation if notification fails
                    System.err.println("Failed to send module deactivation notifications: " + e.getMessage());
                }
            }
// If activating a previously inactive module, send activation notifications
            else if ((wasActive == null || !wasActive) && isActive) {
                try {
                    notificationService.handleModuleActivationNotification(savedModule);
                    // to notify admins
                    List<User> adminUsers = userRepository.findByRole(Role.ADMIN);
                    for (User admin : adminUsers) {
                        emailService.sendModuleStatusChangeNotification(
                                admin.getEmail(),
                                admin.getFullName(),
                                savedModule.getTitle(),
                                isActive
                        );
                    }
                } catch (Exception e) {
                    // Log but don't fail the operation if notification fails
                    System.err.println("Failed to send module activation notifications: " + e.getMessage());
                }
            }
            // Use the admin-specific conversion that doesn't rely on authentication context
            return toDTOForAdmin(savedModule);
        } catch (Exception e) {
            System.err.println("Error in toggleModuleStatus: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public List<ModuleDTO> getAllModulesWithDetails() {
        System.out.println("getAllModulesWithDetails started");
        try {
            List<Module> modules = moduleRepository.findAll();
            System.out.println("Found " + modules.size() + " modules");

            return modules.stream()
                    .map(this::toDTOForAdmin)  // Use admin-specific conversion
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error in getAllModulesWithDetails: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public ModuleStatsDTO getModuleStats() {
        try {
            long totalModules = moduleRepository.count();
            long activeModules = moduleRepository.countByActiveTrue();
            long inactiveModules = totalModules - activeModules;

            // Find the module with most students
            Module mostPopularModule = null;
            long maxStudents = 0;

            List<Module> allModules = moduleRepository.findAll();
            for (Module module : allModules) {
                Long studentCount = moduleStudentRepository.countByModule(module);
                if (studentCount != null && studentCount > maxStudents) {
                    maxStudents = studentCount;
                    mostPopularModule = module;
                }
            }

            long totalEnrollments = moduleStudentRepository.count();

            return ModuleStatsDTO.builder()
                    .totalModules(totalModules)
                    .activeModules(activeModules)
                    .inactiveModules(inactiveModules)
                    .totalStudentEnrollments(totalEnrollments)
                    .moduleWithMostStudents(maxStudents)
                    .mostPopularModuleCode(mostPopularModule != null ? mostPopularModule.getCode() : "None")
                    .build();
        } catch (Exception e) {
            System.err.println("Error in getModuleStats: " + e.getMessage());
            e.printStackTrace();

            // Return default stats to prevent UI errors
            return ModuleStatsDTO.builder()
                    .totalModules(0L)  // Using Long literals
                    .activeModules(0L)
                    .inactiveModules(0L)
                    .totalStudentEnrollments(0L)
                    .moduleWithMostStudents(0L)
                    .mostPopularModuleCode("None")
                    .build();
        }
    }



    @Autowired
    private ModuleStatusHistoryRepository moduleStatusHistoryRepository;

    @Transactional
    public ModuleDTO toggleModuleStatus(Long id, boolean isActive, String reason) {
        try {
            System.out.println("Toggling module status for id: " + id + " to " + isActive);
            Module module = moduleRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

            User currentUser = userService.getCurrentUser();

            // If status is changing, record history
            if (module.getActive() != isActive) {
                module.setActive(isActive);
                module.setLastStatusChange(LocalDateTime.now());
                Module savedModule = moduleRepository.save(module);

                // Record the change in history
                ModuleStatusHistory history = new ModuleStatusHistory(
                        savedModule,
                        currentUser,
                        isActive,
                        reason
                );
                moduleStatusHistoryRepository.save(history);
            }

            return toDTOForAdmin(module);
        } catch (Exception e) {
            System.err.println("Error in toggleModuleStatus: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // Add a method to get module status history
    public List<ModuleStatusHistoryDTO> getModuleStatusHistory(Long moduleId) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        List<ModuleStatusHistory> history = moduleStatusHistoryRepository.findByModuleOrderByChangedAtDesc(module);

        return history.stream()
                .map(this::toModuleStatusHistoryDTO)
                .collect(Collectors.toList());
    }

    private ModuleStatusHistoryDTO toModuleStatusHistoryDTO(ModuleStatusHistory history) {
        return ModuleStatusHistoryDTO.builder()
                .id(history.getId())
                .moduleId(history.getModule().getId())
                .moduleCode(history.getModule().getCode())
                .changedByName(history.getChangedBy().getFullName())
                .changedByRole(history.getChangedBy().getRole().toString())
                .newStatus(history.getNewStatus())
                .changedAt(history.getChangedAt())
                .reason(history.getReason())
                .build();
    }

    @Transactional
    public ResourceDTO uploadResource(Long moduleId, String title, String description, MultipartFile file) throws IOException {
        // Get the module
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        // Create resource directory if it doesn't exist
        String uploadDir = "uploads/modules/" + moduleId + "/resources";
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate a unique filename to prevent collisions
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = "";
        if (originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = UUID.randomUUID().toString() + fileExtension;

        // Save the file
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Determine file type
        String fileType = file.getContentType();
        if (fileType == null) {
            fileType = "application/octet-stream"; // Default type if unknown
        }

        // Create and save resource entity
        Resource resource = new Resource();
        resource.setTitle(title);
        resource.setType(fileType);
        resource.setUrl("/uploads/modules/" + moduleId + "/resources/" + filename);
        resource.setModule(module);

        Resource savedResource = resourceRepository.save(resource);

        // Send notifications
        try {
            notificationService.handleResourceNotification(savedResource, module);
        } catch (Exception e) {
            // Log but don't fail the operation if notification fails
            System.err.println("Failed to send resource notifications: " + e.getMessage());
        }

        // Return DTO
        return ResourceDTO.builder()
                .id(savedResource.getId())
                .title(savedResource.getTitle())
                .type(savedResource.getType())
                .url(savedResource.getUrl())
                .build();
    }

    public List<UserDTO> getModuleStudents(Long moduleId) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        List<ModuleStudent> enrollments = moduleStudentRepository.findByModule(module);

        return enrollments.stream()
                .map(enrollment -> {
                    User student = enrollment.getStudent();
                    return UserDTO.builder()
                            .id(student.getId())
                            .email(student.getEmail())
                            .fullName(student.getFullName())
                            .role(Role.valueOf(student.getRole().name()))
                            .department(student.getDepartment())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public AnnouncementDTO createAnnouncement(Long moduleId, String title, String content) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        Announcement announcement = new Announcement();
        announcement.setTitle(title);
        announcement.setContent(content);
        announcement.setModule(module);
        announcement.setCreatedAt(LocalDateTime.now());

        Announcement savedAnnouncement = announcementRepository.save(announcement);

        // Send notifications
        try {
            notificationService.handleAnnouncementNotification(savedAnnouncement, module);
        } catch (Exception e) {
            // Log but don't fail the operation if notification fails
            System.err.println("Failed to send announcement notifications: " + e.getMessage());
        }

        return AnnouncementDTO.builder()
                .id(savedAnnouncement.getId())
                .title(savedAnnouncement.getTitle())
                .content(savedAnnouncement.getContent())
                .date(savedAnnouncement.getCreatedAt())
                .build();
    }
    @Transactional
    public void deleteAnnouncement(Long moduleId, Long announcementId) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));

        // Verify the announcement belongs to the module
        if (!announcement.getModule().getId().equals(moduleId)) {
            throw new ResourceNotFoundException("Announcement does not belong to this module");
        }

        announcementRepository.delete(announcement);
    }

    public List<ModuleDTO> getAllActiveModules() {
        return moduleRepository.findByActiveTrue().stream()
                .map(this::toDTOForAdmin) // Use the admin DTO converter that doesn't require authentication
                .collect(Collectors.toList());
    }
}