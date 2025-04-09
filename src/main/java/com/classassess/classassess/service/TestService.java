package com.classassess.classassess.service;

import com.classassess.classassess.dto.*;
import com.classassess.classassess.exception.ResourceNotFoundException;
import com.classassess.classassess.model.*;
import com.classassess.classassess.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TestService {
    private final TestRepository testRepository;
    private final SubmissionRepository submissionRepository;
    private final UserService userService;
    private final AIService aiService;
    private final ModuleRepository moduleRepository;
    private final AppealRepository appealRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final MCQOptionRepository mcqOptionRepository;
    private final NotificationService notificationService;

    public List<TestDTO> getStudentTests() {
        User currentUser = userService.getCurrentUser();
        return testRepository.findActiveTests().stream()
                .map(test -> {
                    TestDTO dto = convertToDTO(test);
                    submissionRepository.findByTestAndStudent(test, currentUser)
                            .ifPresent(submission -> {
                                dto.setStatus(submission.getStatus());
                                dto.setScore(submission.getTotalScore());
                            });
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public List<TestDTO> getLecturerTests() {
        User currentUser = userService.getCurrentUser();
        return testRepository.findByLecturerId(currentUser.getId()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TestDTO> getUpcomingTestsByStudent(Long studentId) {
        User currentUser = studentId == null ? userService.getCurrentUser()
                : userService.getUserById(studentId);

        // Get the modules this student is enrolled in
        List<Long> enrolledModuleIds = moduleRepository.findModuleIdsByStudentId(currentUser.getId());

        // Filter tests by enrolled modules
        return testRepository.findActiveTests().stream()
                .filter(test -> test.getModule() != null && enrolledModuleIds.contains(test.getModule().getId()))
                .map(test -> {
                    TestDTO dto = convertToDTO(test);
                    submissionRepository.findByTestAndStudent(test, currentUser)
                            .ifPresent(submission -> {
                                dto.setStatus(submission.getStatus());
                                dto.setScore(submission.getTotalScore());
                            });
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void submitTest(TestSubmissionDTO submissionDTO) {
        Test test = testRepository.findById(submissionDTO.getTestId())
                .orElseThrow(() -> new ResourceNotFoundException("Test not found"));
        User student = userService.getCurrentUser();

        // Check if a submission already exists
        Submission submission = submissionRepository.findByTestAndStudent(test, student)
                .orElse(new Submission());

        submission.setTest(test);
        submission.setStudent(student);
        submission.setStatus(SubmissionStatus.SUBMITTED);
        submission.setSubmittedAt(LocalDateTime.now());

        // Save the submission first to get an ID
        Submission savedSubmission = submissionRepository.save(submission);

        // Process each answer
        double totalScore = 0;
        int totalPoints = 0;

        // Handle both formats of answer submission (Map or List)
        Map<Long, String> answersMap = new HashMap<>();

        // Check if we're using the older Map-based format or newer List-based format
        if (submissionDTO.getAnswers() != null) {
            // Old Map format
            answersMap = submissionDTO.getAnswers();
        } else if (submissionDTO.getAnswersList() != null) {
            // New List format
            for (TestSubmissionDTO.AnswerDTO answer : submissionDTO.getAnswersList()) {
                answersMap.put(answer.getQuestionId(), answer.getAnswer());
            }
        }

        // Process all questions to ensure all are graded even if not answered
        for (Question question : test.getQuestions()) {
            Long questionId = question.getId();
            // Get the answer text, default to empty string if not provided
            String answerText = answersMap.getOrDefault(questionId, "");

            // Find or create an answer
            Answer answer = answerRepository.findBySubmissionIdAndQuestionId(savedSubmission.getId(), questionId)
                    .orElse(new Answer());

            answer.setSubmission(savedSubmission);
            answer.setQuestion(question);
            answer.setAnswerText(answerText);

            // Calculate score based on question type
            double score = calculateAnswerScore(question, answerText);
            answer.setScore(score);

            // Generate AI feedback for written answers
            if (question.getQuestionType() == QuestionType.WRITTEN ||
                    question.getQuestionType() == QuestionType.SHORT_ANSWER) {
                Map<String, Object> evaluation = aiService.evaluateWrittenAnswer(
                        question.getQuestionText(),
                        answerText,
                        question.getCorrectAnswer()
                );
                answer.setAiFeedback((String) evaluation.get("feedback"));
            }

            answerRepository.save(answer);

            totalScore += score;
            totalPoints += question.getPoints();
        }

        // Calculate final score as a percentage
        double finalScore = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
// Ensure the score is within 0-100 range
        finalScore = Math.min(Math.max(finalScore, 0.0), 100.0);
        savedSubmission.setTotalScore(finalScore);
        savedSubmission.setStatus(SubmissionStatus.GRADED);
        submissionRepository.save(savedSubmission);
    }

    /*private double calculateAnswerScore(Question question, String answerText) {
        if (question.getQuestionType() == QuestionType.MCQ) {
            // For MCQ, check if the answer matches any correct option
            return question.getOptions().stream()
                    .filter(option -> option.getIsCorrect() && option.getOptionText().equals(answerText))
                    .findFirst()
                    .map(option -> 1.0)
                    .orElse(0.0);
        } else if (question.getQuestionType() == QuestionType.WRITTEN ||
                question.getQuestionType() == QuestionType.SHORT_ANSWER) {
            // For written answers, use AI service to evaluate
            Map<String, Object> evaluation = aiService.evaluateWrittenAnswer(
                    question.getQuestionText(),
                    answerText,
                    question.getCorrectAnswer()
            );

            // AI service returns scores on 0-100 scale, convert to 0-1 scale
            double rawScore = (double) evaluation.get("score");
            return rawScore / 100.0; // Convert to 0-1 scale
        }
        return 0.0;
    }*/

    private double calculateAnswerScore(Question question, String answerText) {
        double normalizedScore = 0.0; // Score on a 0-1 scale

        if (question.getQuestionType() == QuestionType.MCQ) {
            // For MCQ, check if the answer matches any correct option
            normalizedScore = question.getOptions().stream()
                    .filter(option -> option.getIsCorrect() && option.getOptionText().equals(answerText))
                    .findFirst()
                    .map(option -> 1.0)
                    .orElse(0.0);
        } else if (question.getQuestionType() == QuestionType.WRITTEN ||
                question.getQuestionType() == QuestionType.SHORT_ANSWER) {
            // For written answers, use AI service to evaluate
            Map<String, Object> evaluation = aiService.evaluateWrittenAnswer(
                    question.getQuestionText(),
                    answerText,
                    question.getCorrectAnswer()
            );

            // AI service returns scores on 0-100 scale, convert to 0-1 scale
            double rawScore = (double) evaluation.get("score");
            normalizedScore = rawScore / 100.0; // Convert to 0-1 scale
        }

        // Scale the normalized score by the total points for this question
        return normalizedScore * question.getPoints();
    }

    @Transactional
    public void saveTestProgress(TestSubmissionDTO submissionDTO) {
        Test test = testRepository.findById(submissionDTO.getTestId())
                .orElseThrow(() -> new ResourceNotFoundException("Test not found"));
        User student = userService.getCurrentUser();

        // Find or create a submission
        Submission submission = submissionRepository.findByTestAndStudent(test, student)
                .orElse(new Submission());

        submission.setTest(test);
        submission.setStudent(student);
        submission.setStatus(SubmissionStatus.IN_PROGRESS);

        // Save the submission first to get an ID
        Submission savedSubmission = submissionRepository.save(submission);

        // Handle both formats of answer submission (Map or List)
        Map<Long, String> answersMap = new HashMap<>();

        // Check if we're using the older Map-based format or newer List-based format
        if (submissionDTO.getAnswers() != null) {
            // Old Map format
            answersMap = submissionDTO.getAnswers();
        } else if (submissionDTO.getAnswersList() != null) {
            // New List format
            for (TestSubmissionDTO.AnswerDTO answer : submissionDTO.getAnswersList()) {
                answersMap.put(answer.getQuestionId(), answer.getAnswer());
            }
        }

        // Save each answer
        for (Map.Entry<Long, String> entry : answersMap.entrySet()) {
            Long questionId = entry.getKey();
            String answerText = entry.getValue();

            Question question = questionRepository.findById(questionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

            // Find or create an answer
            Answer answer = answerRepository.findBySubmissionIdAndQuestionId(savedSubmission.getId(), questionId)
                    .orElse(new Answer());

            answer.setSubmission(savedSubmission);
            answer.setQuestion(question);
            answer.setAnswerText(answerText);

            answerRepository.save(answer);
        }
    }

    public Map<String, Object> getTestProgress(Long testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found"));
        User student = userService.getCurrentUser();

        // Find submission if it exists
        Optional<Submission> submissionOpt = submissionRepository.findByTestAndStudent(test, student);

        if (submissionOpt.isEmpty()) {
            return Map.of("status", "NOT_STARTED");
        }

        Submission submission = submissionOpt.get();

        // If already submitted, return status only
        if (submission.getStatus() == SubmissionStatus.SUBMITTED ||
                submission.getStatus() == SubmissionStatus.GRADED) {
            return Map.of(
                    "status", submission.getStatus().toString(),
                    "submittedAt", submission.getSubmittedAt()
            );
        }

        // Get answers for in-progress submission
        List<Answer> answers = answerRepository.findBySubmissionId(submission.getId());

        Map<String, String> answerMap = new HashMap<>();
        for (Answer answer : answers) {
            answerMap.put(answer.getQuestion().getId().toString(), answer.getAnswerText());
        }

        return Map.of(
                "status", submission.getStatus().toString(),
                "answers", answerMap
        );
    }

    public Map<String, Object> getTestResults(Long testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found"));

        // Check if test has started yet
        if (test.getStartTime() != null && test.getStartTime().isAfter(LocalDateTime.now())) {
            // Test hasn't started yet, return empty results
            Map<String, Object> emptyResults = new HashMap<>();
            emptyResults.put("data", new ArrayList<>());
            return emptyResults;
        }

        User currentUser = userService.getCurrentUser();

        try {
            Submission submission = submissionRepository.findByTestAndStudent(test, currentUser)
                    .orElseThrow(() -> new RuntimeException("Submission not found"));

            Map<String, Object> results = new HashMap<>();
            results.put("totalScore", submission.getTotalScore());
            results.put("status", submission.getStatus());
            results.put("submissionDate", submission.getSubmittedAt());
            results.put("data", List.of(Map.of(
                    "score", submission.getTotalScore(),
                    "status", submission.getStatus().toString(),
                    "submittedAt", submission.getSubmittedAt()
            )));

            return results;
        } catch (Exception e) {
            // If there's no submission, return empty results
            return Map.of("data", new ArrayList<>());
        }
    }

    @Transactional
    public TestDTO createTest(TestDTO testDTO) {
        // Get the current user (lecturer)
        User lecturer = userService.getCurrentUser();

        // Find the module by ID instead of code
        com.classassess.classassess.model.Module module = moduleRepository.findById(testDTO.getModuleId())
                .orElseThrow(() -> new ResourceNotFoundException("Module not found with ID: " + testDTO.getModuleId()));

        // Create and populate the test entity
        Test test = new Test();
        test.setTitle(testDTO.getTitle());
        test.setDescription(testDTO.getDescription());
        test.setDurationMinutes(testDTO.getDurationMinutes());
        test.setStartTime(testDTO.getStartTime());
        test.setEndTime(testDTO.getEndTime());
        test.setUseAiGeneration(testDTO.getUseAiGeneration());

        // Set the lecturer and module
        test.setLecturer(lecturer);
        test.setModule(module);
        test.setCreatedBy(lecturer);  // Also set the created_by field

        // Save the test to get an ID
        Test savedTest = testRepository.save(test);
        notificationService.handleTestCreationNotification(savedTest, module);

        // Process questions if any
        if (testDTO.getQuestions() != null && !testDTO.getQuestions().isEmpty()) {
            for (QuestionDTO questionDTO : testDTO.getQuestions()) {
                Question question = new Question();
                question.setTest(savedTest);
                question.setQuestionText(questionDTO.getQuestionText());
                question.setQuestionType(questionDTO.getQuestionType());
                question.setCorrectAnswer(questionDTO.getCorrectAnswer());
                question.setPoints(questionDTO.getPoints() != null ? questionDTO.getPoints() : 1);

                // Save the question
                Question savedQuestion = questionRepository.save(question);

                // Process MCQ options if applicable
                if (questionDTO.getQuestionType() == QuestionType.MCQ &&
                        questionDTO.getOptions() != null &&
                        !questionDTO.getOptions().isEmpty()) {

                    for (MCQOptionDTO optionDTO : questionDTO.getOptions()) {
                        MCQOption option = new MCQOption();
                        option.setQuestion(savedQuestion);
                        option.setOptionText(optionDTO.getOptionText());
                        option.setIsCorrect(optionDTO.getIsCorrect());
                        // Save the option
                        mcqOptionRepository.save(option);
                    }
                }
            }
        }

        // Generate AI questions if enabled
        if (Boolean.TRUE.equals(test.getUseAiGeneration())) {
            int questionCount = testDTO.getAiQuestionCount() != null ? testDTO.getAiQuestionCount() : 20;
            generateAIQuestions(savedTest, questionCount);
        }

        // Refresh the test data to include all generated questions
        Test refreshedTest = testRepository.findById(savedTest.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Test not found after save"));

        // Return the created test with all questions and options
        return convertToDTO(refreshedTest);
    }

    public TestDTO getTestById(Long id) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Test not found"));

        // Create DTO
        TestDTO dto = new TestDTO();
        dto.setId(test.getId());
        dto.setTitle(test.getTitle());
        dto.setDescription(test.getDescription());
        dto.setStartTime(test.getStartTime());
        dto.setEndTime(test.getEndTime());
        dto.setDurationMinutes(test.getDurationMinutes());
        dto.setUseAiGeneration(test.getUseAiGeneration());
        dto.setAiQuestionCount(test.getQuestions().size());
        dto.setTotalPoints(test.getTotalPoints());

        if (test.getModule() != null) {
            dto.setModuleId(test.getModule().getId());
            if (test.getModule().getCode() != null) {
                dto.setModuleCode(test.getModule().getCode());
            }
        }

        if (test.getLecturer() != null) {
            dto.setLecturerName(test.getLecturer().getFullName());
        }

        // Get all questions for this test
        List<QuestionDTO> questionDTOs = new ArrayList<>();

        for (Question question : test.getQuestions()) {
            QuestionDTO questionDTO = new QuestionDTO();
            questionDTO.setId(question.getId());
            questionDTO.setQuestionText(question.getQuestionText());
            questionDTO.setQuestionType(question.getQuestionType());
            questionDTO.setCorrectAnswer(question.getCorrectAnswer());
            questionDTO.setPoints(question.getPoints());

            // For MCQ questions, explicitly fetch options
            if (question.getQuestionType() == QuestionType.MCQ) {
                // Directly query for options
                List<MCQOption> options = mcqOptionRepository.findByQuestionId(question.getId());
                System.out.println("Found " + options.size() + " options for question ID " + question.getId());

                List<MCQOptionDTO> optionDTOs = new ArrayList<>();
                for (MCQOption option : options) {
                    MCQOptionDTO optionDTO = new MCQOptionDTO();
                    optionDTO.setId(option.getId());
                    optionDTO.setOptionText(option.getOptionText());
                    optionDTO.setIsCorrect(option.getIsCorrect());
                    optionDTOs.add(optionDTO);
                }

                questionDTO.setOptions(optionDTOs);
            }

            questionDTOs.add(questionDTO);
        }

        dto.setQuestions(questionDTOs);
        return dto;
    }

    public TestDTO getTestWithFullDetails(Long id) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found"));

        TestDTO dto = new TestDTO();
        dto.setId(test.getId());
        dto.setTitle(test.getTitle());
        dto.setDescription(test.getDescription());
        dto.setStartTime(test.getStartTime());
        dto.setEndTime(test.getEndTime());
        dto.setDurationMinutes(test.getDurationMinutes());
        dto.setUseAiGeneration(test.getUseAiGeneration());
        dto.setAiQuestionCount(test.getQuestions().size());
        dto.setTotalPoints(test.getTotalPoints());

        if (test.getModule() != null) {
            dto.setModuleId(test.getModule().getId());
            if (test.getModule().getCode() != null) {
                dto.setModuleCode(test.getModule().getCode());
            }
        }

        if (test.getLecturer() != null) {
            dto.setLecturerName(test.getLecturer().getFullName());
        }

        // Get all questions for this test
        List<Question> questions = questionRepository.findByTestId(test.getId());
        List<QuestionDTO> questionDTOs = new ArrayList<>();

        for (Question question : questions) {
            QuestionDTO questionDTO = new QuestionDTO();
            questionDTO.setId(question.getId());
            questionDTO.setQuestionText(question.getQuestionText());
            questionDTO.setQuestionType(question.getQuestionType());
            questionDTO.setPoints(question.getPoints());

            // For MCQ questions, fetch and include options
            if (question.getQuestionType() == QuestionType.MCQ) {
                List<MCQOption> options = mcqOptionRepository.findByQuestionId(question.getId());
                List<MCQOptionDTO> optionDTOs = new ArrayList<>();

                for (MCQOption option : options) {
                    MCQOptionDTO optionDTO = new MCQOptionDTO();
                    optionDTO.setId(option.getId());
                    optionDTO.setOptionText(option.getOptionText());
                    // For student view, we don't include which option is correct
                    optionDTO.setIsCorrect(null);
                    optionDTOs.add(optionDTO);
                }

                questionDTO.setOptions(optionDTOs);
            }

            questionDTOs.add(questionDTO);
        }

        dto.setQuestions(questionDTOs);
        return dto;
    }


    public TestDTO getTestForStudent(Long id) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found"));

        TestDTO dto = new TestDTO();
        dto.setId(test.getId());
        dto.setTitle(test.getTitle());
        dto.setDescription(test.getDescription());
        dto.setStartTime(test.getStartTime());
        dto.setEndTime(test.getEndTime());
        dto.setDurationMinutes(test.getDurationMinutes());

        // Get all questions for this test
        List<Question> questions = questionRepository.findByTestId(test.getId());
        List<QuestionDTO> questionDTOs = new ArrayList<>();

        for (Question question : questions) {
            QuestionDTO questionDTO = new QuestionDTO();
            questionDTO.setId(question.getId());
            questionDTO.setQuestionText(question.getQuestionText());
            questionDTO.setQuestionType(question.getQuestionType());
            questionDTO.setPoints(question.getPoints());

            // For MCQ questions, explicitly fetch options
            if (question.getQuestionType() == QuestionType.MCQ) {
                // Direct SQL query to ensure we get all options
                List<MCQOption> options = mcqOptionRepository.findByQuestionId(question.getId());

                List<MCQOptionDTO> optionDTOs = new ArrayList<>();
                for (MCQOption option : options) {
                    MCQOptionDTO optionDTO = new MCQOptionDTO();
                    optionDTO.setId(option.getId());
                    optionDTO.setOptionText(option.getOptionText());
                    // Don't include which option is correct for student view
                    optionDTOs.add(optionDTO);
                }

                questionDTO.setOptions(optionDTOs);
            }

            questionDTOs.add(questionDTO);
        }

        dto.setQuestions(questionDTOs);
        return dto;
    }

    @Transactional
    private void generateAIQuestions(Test test, Integer questionCount) {
        System.out.println("Generating " + questionCount + " AI questions for test ID: " + test.getId());

        List<Question> aiQuestions = aiService.generateQuestions(test.getTitle(), test.getDescription(), questionCount);
        System.out.println("AI Service returned " + aiQuestions.size() + " questions");

        for (int i = 0; i < aiQuestions.size(); i++) {
            Question question = aiQuestions.get(i);
            System.out.println("Processing question " + (i+1) + ": " + question.getQuestionText());
            System.out.println("Question type: " + question.getQuestionType());

            // Set the test for this question
            question.setTest(test);

            // Save the question first to get an ID
            Question savedQuestion = questionRepository.save(question);
            System.out.println("Saved question with ID: " + savedQuestion.getId());

            // Get the options from the question
            List<MCQOption> options = question.getOptions();
            System.out.println("Question has " + (options != null ? options.size() : 0) + " options");

            // Save each option
            if (options != null) {
                for (MCQOption option : options) {
                    option.setQuestion(savedQuestion); // Link to the saved question
                    MCQOption savedOption = mcqOptionRepository.save(option);
                    System.out.println("Saved option: " + savedOption.getId() + " - " + savedOption.getOptionText() + ", isCorrect: " + savedOption.getIsCorrect());
                }
            }
        }

        // Add the questions to the test's question list
        test.getQuestions().addAll(aiQuestions);

        // Save the test again to update its questions
        testRepository.save(test);
        System.out.println("Completed generating AI questions for test ID: " + test.getId());
    }

    private Test convertToEntity(TestDTO dto) {
        Test test = new Test();
        test.setTitle(dto.getTitle());
        test.setDescription(dto.getDescription());
        test.setStartTime(dto.getStartTime());
        test.setEndTime(dto.getEndTime());
        test.setDurationMinutes(dto.getDurationMinutes());
        test.setUseAiGeneration(dto.getUseAiGeneration());
        return test;
    }

    private TestDTO convertToDTO(Test test) {
        TestDTO dto = new TestDTO();
        dto.setId(test.getId());
        dto.setTitle(test.getTitle());
        dto.setDescription(test.getDescription());
        dto.setStartTime(test.getStartTime());
        dto.setEndTime(test.getEndTime());
        dto.setDurationMinutes(test.getDurationMinutes());
        dto.setUseAiGeneration(test.getUseAiGeneration());
        dto.setAiQuestionCount(test.getQuestions().size());
        dto.setTotalPoints(test.getTotalPoints());

        // Convert and add questions to the DTO
        List<QuestionDTO> questionDTOs = new ArrayList<>();
        for (Question question : test.getQuestions()) {
            questionDTOs.add(convertQuestionToDTO(question));
        }
        dto.setQuestions(questionDTOs);

        if (test.getModule() != null) {
            dto.setModuleId(test.getModule().getId());
            if (test.getModule().getCode() != null) {
                dto.setModuleCode(test.getModule().getCode());
            }
        }
        if (test.getLecturer() != null) {
            dto.setLecturerName(test.getLecturer().getFullName());
        }

        return dto;
    }

    // Convert Question entities to DTOs
    private QuestionDTO convertQuestionToDTO(Question question) {
        QuestionDTO dto = new QuestionDTO();
        dto.setId(question.getId());
        dto.setQuestionText(question.getQuestionText());
        dto.setQuestionType(question.getQuestionType());
        dto.setCorrectAnswer(question.getCorrectAnswer());
        dto.setPoints(question.getPoints());

        // For MCQ questions, fetch and include options
        if (question.getQuestionType() == QuestionType.MCQ) {
            List<MCQOption> options = mcqOptionRepository.findByQuestionId(question.getId());

            List<MCQOptionDTO> optionDTOs = new ArrayList<>();
            for (MCQOption option : options) {
                optionDTOs.add(convertOptionToDTO(option));
            }
            dto.setOptions(optionDTOs);
        }

        return dto;
    }

    // Convert MCQOption entities to DTOs
    private MCQOptionDTO convertOptionToDTO(MCQOption option) {
        MCQOptionDTO dto = new MCQOptionDTO();
        dto.setId(option.getId());
        dto.setOptionText(option.getOptionText());
        dto.setIsCorrect(option.getIsCorrect());
        return dto;
    }



    public Map<String, Object> getLecturerDashboardStats() {
        User currentUser = userService.getCurrentUser();
        Map<String, Object> stats = new HashMap<>();

        // Get total students from module_students table
        Long totalStudents = moduleRepository.countDistinctStudentsByLecturerId(currentUser.getId());

        // Get test counts
        List<Test> lecturerTests = testRepository.findByLecturerId(currentUser.getId());
        List<Submission> submissions = submissionRepository.findByTestIn(lecturerTests);

        // Count active tests (not ended)
        long activeTests = lecturerTests.stream()
                .filter(test -> test.getEndTime() != null &&
                        test.getEndTime().isAfter(java.time.LocalDateTime.now()))
                .count();

        // Count submissions by status
        long pendingGrading = submissions.stream()
                .filter(sub -> sub.getStatus() == SubmissionStatus.SUBMITTED)
                .count();

        long completedTests = submissions.stream()
                .filter(sub -> sub.getStatus() == SubmissionStatus.GRADED)
                .count();

        stats.put("totalStudents", totalStudents);
        stats.put("activeTests", activeTests);
        stats.put("pendingGrading", pendingGrading);
        stats.put("completedTests", completedTests);

        return stats;
    }

    public List<AppealDTO> getAppealsByLecturer() {
        User currentUser = userService.getCurrentUser();
        // Get appeals for tests created by this lecturer
        return appealRepository.findByTestCreatedByOrderByCreatedAtDesc(currentUser)
                .stream()
                .map(this::convertToAppealDTO)
                .collect(Collectors.toList());
    }

    public int getAppealCountByLecturer() {
        User currentUser = userService.getCurrentUser();
        return appealRepository.countByTestCreatedByAndStatus(currentUser, AppealStatus.PENDING);
    }

    public AppealDTO resolveAppeal(Long appealId, AppealResolutionDTO resolutionDTO) {
        User currentUser = userService.getCurrentUser();
        Appeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Appeal not found"));

        // Verify this lecturer is responsible for this test
        if (!appeal.getTest().getCreatedBy().equals(currentUser)) {
            throw new AccessDeniedException("You don't have permission to manage this appeal");
        }

        // Update appeal status
        appeal.setStatus(AppealStatus.valueOf(resolutionDTO.getStatus()));
        appeal.setFeedback(resolutionDTO.getFeedback());
        appeal.setResolvedBy(currentUser);
        appeal.setResolvedAt(LocalDateTime.now());

        // If approved, update submission score
        if (resolutionDTO.getStatus().equals("APPROVED")) {
            Submission submission = appeal.getSubmission();
            submission.setTotalScore(resolutionDTO.getNewScore());
            submissionRepository.save(submission);
        }

        Appeal savedAppeal = appealRepository.save(appeal);
        return convertToAppealDTO(savedAppeal);
    }

    private AppealDTO convertToAppealDTO(Appeal appeal) {
        return AppealDTO.builder()
                .id(appeal.getId())
                .testId(appeal.getTest().getId())
                .testTitle(appeal.getTest().getTitle())
                .student(appeal.getSubmission().getStudent().getFullName())
                .moduleCode(appeal.getTest().getModule().getCode())
                .originalScore(appeal.getOriginalScore())
                .requestedScore(appeal.getRequestedScore())
                .reason(appeal.getReason())
                .status(appeal.getStatus().name())
                .feedback(appeal.getFeedback())
                .build();
    }

    /**
     * Get performance metrics by module for the current lecturer
     */
    public List<ModulePerformanceDTO> getModulePerformance() {
        User currentUser = userService.getCurrentUser();
        List<Object[]> rawData = testRepository.getModulePerformanceByLecturerId(currentUser.getId());

        List<ModulePerformanceDTO> result = new ArrayList<>();
        for (Object[] row : rawData) {
            String moduleCode = (String) row[1];
            String moduleTitle = (String) row[2];
            long testCount = (long) row[3];
            Double avgScore = row[4] != null ? (Double) row[4] : 0.0;

            // Calculate passing rate (students with score >= 60%)
            Long moduleId = (Long) row[0];
            Double passingRate = calculateModulePassingRate(moduleId);

            // Get student count
            Integer studentCount = getModuleStudentCount(moduleId);

            result.add(ModulePerformanceDTO.builder()
                    .moduleCode(moduleCode)
                    .moduleTitle(moduleTitle)
                    .avgScore(avgScore)
                    .passingRate(passingRate)
                    .totalStudents(studentCount)
                    .totalSubmissions((int) testCount)
                    .build());
        }

        return result;
    }

    /**
     * Get test activity data for timeline visualization
     */
    public List<TestActivityDTO> getTestActivity() {
        User currentUser = userService.getCurrentUser();
        List<Object[]> rawData = testRepository.getTestActivityRawData(currentUser.getId());

        // Group by year-month
        Map<String, TestActivityDTO> activityMap = new HashMap<>();

        for (Object[] row : rawData) {
            if (row[0] == null || row[1] == null) continue;

            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            String status = (String) row[2];
            Long count = (Long) row[3];

            String period = String.format("%d-%02d", year, month);

            TestActivityDTO dto = activityMap.computeIfAbsent(period,
                    k -> TestActivityDTO.builder()
                            .period(period)
                            .completedTests(0)
                            .upcomingTests(0)
                            .build());

            if ("GRADED".equals(status)) {
                dto.setCompletedTests(count.intValue());
            }
        }

        // Get upcoming tests data
        List<Object[]> upcomingData = testRepository.getUpcomingTestsByMonth(currentUser.getId());
        for (Object[] row : upcomingData) {
            if (row[0] == null || row[1] == null) continue;

            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            Long count = (Long) row[2];

            String period = String.format("%d-%02d", year, month);

            TestActivityDTO dto = activityMap.computeIfAbsent(period,
                    k -> TestActivityDTO.builder()
                            .period(period)
                            .completedTests(0)
                            .upcomingTests(0)
                            .build());

            dto.setUpcomingTests(count.intValue());
        }

        return new ArrayList<>(activityMap.values());
    }

    /**
     * Get AI grading confidence metrics by module
     */
    public List<AIConfidenceDTO> getAIConfidence() {
        User currentUser = userService.getCurrentUser();

        // Get appeal metrics by module
        List<Object[]> appealData = appealRepository.getAppealMetricsByModule(currentUser.getId());
        Map<Long, Integer> appealsByModule = new HashMap<>();
        Map<Long, Integer> approvedAppealsByModule = new HashMap<>();

        for (Object[] row : appealData) {
            Long moduleId = (Long) row[0];
            Long appealCount = (Long) row[3];
            Long approvedCount = (Long) row[4];

            appealsByModule.put(moduleId, appealCount.intValue());
            approvedAppealsByModule.put(moduleId, approvedCount.intValue());
        }

        // Get answer metrics by module
        List<Object[]> answerData = appealRepository.getAnswerMetricsByModule(currentUser.getId());
        List<AIConfidenceDTO> result = new ArrayList<>();

        for (Object[] row : answerData) {
            Long moduleId = (Long) row[0];
            String moduleCode = (String) row[1];
            String moduleTitle = (String) row[2];
            Long answerCount = (Long) row[3];
            Double passingRate = (Double) row[4];

            int totalAppeals = appealsByModule.getOrDefault(moduleId, 0);
            int approvedAppeals = approvedAppealsByModule.getOrDefault(moduleId, 0);

            // Calculate confidence score based on pass rate and appeal success rate
            double confidenceScore = calculateAIConfidence(passingRate, totalAppeals, approvedAppeals, answerCount);

            result.add(AIConfidenceDTO.builder()
                    .moduleCode(moduleCode)
                    .moduleTitle(moduleTitle)
                    .confidenceScore(confidenceScore)
                    .totalGradedQuestions(answerCount.intValue())
                    .totalAppeals(totalAppeals)
                    .successfulAppeals(approvedAppeals)
                    .build());
        }

        return result;
    }

    /**
     * Get complete analytics dashboard data
     */
    public AnalyticsDashboardDTO getDashboardAnalytics() {
        User currentUser = userService.getCurrentUser();

        // Check if the current user is an admin
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (isAdmin) {
            return AnalyticsDashboardDTO.builder()
                    .modulePerformance(getModulePerformanceForAdmin())
                    .testActivity(getTestActivityForAdmin())
                    .aiConfidence(getAIConfidenceForAdmin())
                    .build();
        } else {
            return AnalyticsDashboardDTO.builder()
                    .modulePerformance(getModulePerformance())
                    .testActivity(getTestActivity())
                    .aiConfidence(getAIConfidence())
                    .build();
        }
    }

    /**
     * Get performance metrics by module for admin (all modules)
     */
    private List<ModulePerformanceDTO> getModulePerformanceForAdmin() {
        List<Object[]> rawData = testRepository.getModulePerformanceForAdmin();

        List<ModulePerformanceDTO> result = new ArrayList<>();
        for (Object[] row : rawData) {
            String moduleCode = (String) row[1];
            String moduleTitle = (String) row[2];
            long testCount = (long) row[3];
            Double avgScore = row[4] != null ? (Double) row[4] : 0.0;

            // Calculate passing rate (students with score >= 60%)
            Long moduleId = (Long) row[0];
            Double passingRate = calculateModulePassingRate(moduleId);

            // Get student count
            Integer studentCount = getModuleStudentCount(moduleId);

            result.add(ModulePerformanceDTO.builder()
                    .moduleCode(moduleCode)
                    .moduleTitle(moduleTitle)
                    .avgScore(avgScore)
                    .passingRate(passingRate)
                    .totalStudents(studentCount)
                    .totalSubmissions((int) testCount)
                    .build());
        }

        return result;
    }

    /**
     * Get test activity data for admin (all tests)
     */
    private List<TestActivityDTO> getTestActivityForAdmin() {
        List<Object[]> rawData = testRepository.getTestActivityRawDataForAdmin();

        // Group by year-month
        Map<String, TestActivityDTO> activityMap = new HashMap<>();

        for (Object[] row : rawData) {
            if (row[0] == null || row[1] == null) continue;

            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            String status = (String) row[2];
            Long count = (Long) row[3];

            String period = String.format("%d-%02d", year, month);

            TestActivityDTO dto = activityMap.computeIfAbsent(period,
                    k -> TestActivityDTO.builder()
                            .period(period)
                            .completedTests(0)
                            .upcomingTests(0)
                            .build());

            if ("GRADED".equals(status)) {
                dto.setCompletedTests(count.intValue());
            }
        }

        // Get upcoming tests data
        List<Object[]> upcomingData = testRepository.getUpcomingTestsByMonthForAdmin();
        for (Object[] row : upcomingData) {
            if (row[0] == null || row[1] == null) continue;

            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            Long count = (Long) row[2];

            String period = String.format("%d-%02d", year, month);

            TestActivityDTO dto = activityMap.computeIfAbsent(period,
                    k -> TestActivityDTO.builder()
                            .period(period)
                            .completedTests(0)
                            .upcomingTests(0)
                            .build());

            dto.setUpcomingTests(count.intValue());
        }

        return new ArrayList<>(activityMap.values());
    }

    /**
     * Get AI grading confidence metrics for admin (all modules)
     */
    private List<AIConfidenceDTO> getAIConfidenceForAdmin() {
        // Get appeal metrics by module
        List<Object[]> appealData = appealRepository.getAppealMetricsByModuleForAdmin();
        Map<Long, Integer> appealsByModule = new HashMap<>();
        Map<Long, Integer> approvedAppealsByModule = new HashMap<>();

        for (Object[] row : appealData) {
            Long moduleId = (Long) row[0];
            Long appealCount = (Long) row[3];
            Long approvedCount = (Long) row[4];

            appealsByModule.put(moduleId, appealCount.intValue());
            approvedAppealsByModule.put(moduleId, approvedCount.intValue());
        }

        // Get answer metrics by module
        List<Object[]> answerData = appealRepository.getAnswerMetricsByModuleForAdmin();
        List<AIConfidenceDTO> result = new ArrayList<>();

        for (Object[] row : answerData) {
            Long moduleId = (Long) row[0];
            String moduleCode = (String) row[1];
            String moduleTitle = (String) row[2];
            Long answerCount = (Long) row[3];
            Double passingRate = (Double) row[4];

            int totalAppeals = appealsByModule.getOrDefault(moduleId, 0);
            int approvedAppeals = approvedAppealsByModule.getOrDefault(moduleId, 0);

            // Calculate confidence score based on pass rate and appeal success rate
            double confidenceScore = calculateAIConfidence(passingRate, totalAppeals, approvedAppeals, answerCount);

            result.add(AIConfidenceDTO.builder()
                    .moduleCode(moduleCode)
                    .moduleTitle(moduleTitle)
                    .confidenceScore(confidenceScore)
                    .totalGradedQuestions(answerCount.intValue())
                    .totalAppeals(totalAppeals)
                    .successfulAppeals(approvedAppeals)
                    .build());
        }

        return result;
    }

    /**
     * Helper method to calculate module passing rate
     */
    private Double calculateModulePassingRate(Long moduleId) {
        // Get all submissions for tests in this module
        List<Object[]> results = submissionRepository.findModulePassingRate(moduleId);

        if (results.isEmpty()) {
            return 0.0;
        }

        // Extract values from the query result
        Long passedCount = (Long) results.get(0)[0];
        Long totalCount = (Long) results.get(0)[1];

        // Calculate passing rate as percentage
        return totalCount > 0 ? (passedCount * 100.0 / totalCount) : 0.0;
    }

    /**
     * Helper method to get module student count
     */
    private Integer getModuleStudentCount(Long moduleId) {
        return moduleRepository.countStudentsInModule(moduleId).intValue();
    }

    /**
     * Calculate AI confidence score
     * Formula: (passing rate * 0.6) + ((1 - approved appeals ratio) * 0.4) * 100
     */
    private double calculateAIConfidence(double passingRate, int totalAppeals, int approvedAppeals, long totalAnswers) {
        System.out.println("Calculating confidence for module with:");
        System.out.println("  - Passing rate: " + passingRate);
        System.out.println("  - Total appeals: " + totalAppeals);
        System.out.println("  - Approved appeals: " + approvedAppeals);
        System.out.println("  - Total answers: " + totalAnswers);
        // Calculate appeal factor (how often AI was correct when challenged)
        double appealRatio = totalAppeals > 0 ? (double) approvedAppeals / totalAppeals : 0;
        double appealFactor = totalAppeals > 0 ? (1 - appealRatio) : 1.0;

        // Calculate base confidence
        double confidenceScore = (passingRate * 0.5) + (appealFactor * 0.5);

        // Add significant bonus for zero appeals when there's substantial data
        if (totalAppeals == 0 && totalAnswers > 20) {
            confidenceScore = Math.min(1.0, confidenceScore + 0.3); // 30% bonus, capped at 100%
        }

        // Apply gradual scaling based on number of answers (more data = more confidence)
        double dataConfidenceFactor = Math.min(1.0, totalAnswers / 100.0); // Reaches max at 100 answers
        confidenceScore = confidenceScore * (0.7 + (0.3 * dataConfidenceFactor));

        // Scale to 0-100 and round to 1 decimal place
        return Math.round(confidenceScore * 1000) / 10.0;
    }

    public Test getTestEntity(Long id) {
        return testRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + id));
    }

    public boolean testExists(Long id) {
        return testRepository.existsById(id);
    }

    public Map<String, Object> getDetailedTestResults(Long testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found"));
        User currentUser = userService.getCurrentUser();

        Submission submission = submissionRepository.findByTestAndStudent(test, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        // Only allow viewing if the test is graded
        if (submission.getStatus() != SubmissionStatus.GRADED) {
            throw new AccessDeniedException("Test results are not available yet");
        }

        Map<String, Object> results = new HashMap<>();
        results.put("testId", test.getId());
        results.put("testTitle", test.getTitle());
        results.put("totalScore", submission.getTotalScore());
        results.put("status", submission.getStatus());
        results.put("submissionDate", submission.getSubmittedAt());

        Optional<Appeal> appealOpt = appealRepository.findBySubmissionId(submission.getId());
        if (appealOpt.isPresent()) {
            Appeal appeal = appealOpt.get();
            Map<String, Object> appealInfo = new HashMap<>();
            appealInfo.put("id", appeal.getId());
            appealInfo.put("status", appeal.getStatus().name());
            appealInfo.put("feedback", appeal.getFeedback());
            appealInfo.put("originalScore", appeal.getOriginalScore());
            appealInfo.put("requestedScore", appeal.getRequestedScore());
            appealInfo.put("updatedScore", appeal.getUpdatedScore());
            appealInfo.put("resolvedAt", appeal.getResolvedAt());

            results.put("appeal", appealInfo);
        }

        // Get detailed answers with feedback
        List<Answer> answers = answerRepository.findBySubmissionId(submission.getId());
        List<Map<String, Object>> detailedAnswers = new ArrayList<>();

        for (Answer answer : answers) {
            Question question = answer.getQuestion();
            Map<String, Object> answerDetails = new HashMap<>();

            answerDetails.put("questionId", question.getId());
            answerDetails.put("questionText", question.getQuestionText());
            answerDetails.put("questionType", question.getQuestionType());
            answerDetails.put("studentAnswer", answer.getAnswerText());
            answerDetails.put("score", answer.getScore());

            if (question.getQuestionType() == QuestionType.WRITTEN ||
                    question.getQuestionType() == QuestionType.SHORT_ANSWER) {
                answerDetails.put("feedback", answer.getAiFeedback());
                answerDetails.put("correctAnswer", question.getCorrectAnswer());
            } else if (question.getQuestionType() == QuestionType.MCQ) {
                // For MCQs, find the correct option
                String correctOption = question.getOptions().stream()
                        .filter(MCQOption::getIsCorrect)
                        .findFirst()
                        .map(MCQOption::getOptionText)
                        .orElse("");
                answerDetails.put("correctAnswer", correctOption);

                // Add all options for reference
                List<Map<String, Object>> options = new ArrayList<>();
                for (MCQOption option : question.getOptions()) {
                    options.add(Map.of(
                            "text", option.getOptionText(),
                            "isCorrect", option.getIsCorrect()
                    ));
                }
                answerDetails.put("options", options);
            }

            detailedAnswers.add(answerDetails);
        }

        results.put("answers", detailedAnswers);
        return results;
    }


    public List<QuestionDTO> getQuestionsForTest(Long testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found"));

        // Verify the current user is authorized to access this test
        User currentUser = userService.getCurrentUser();
        if (!test.getLecturer().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You don't have permission to access this test");
        }

        return test.getQuestions().stream()
                .map(this::convertQuestionToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TestDTO updateTestQuestions(Long testId, List<QuestionDTO> questionDTOs) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found"));

        // Verify the current user is authorized to modify this test
        User currentUser = userService.getCurrentUser();
        if (!test.getLecturer().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You don't have permission to modify this test");
        }

        // Verify the test hasn't started yet
        if (test.getStartTime() != null && test.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Cannot modify questions for a test that has already started");
        }

        // Process each question
        for (QuestionDTO questionDTO : questionDTOs) {
            if (questionDTO.getId() != null) {
                // Update existing question
                updateExistingQuestion(questionDTO);
            } else {
                // Create new question
                createNewQuestion(test, questionDTO);
            }
        }

        // Remove questions that aren't in the updated list
        List<Long> updatedQuestionIds = questionDTOs.stream()
                .map(QuestionDTO::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        List<Question> questionsToRemove = test.getQuestions().stream()
                .filter(q -> !updatedQuestionIds.contains(q.getId()))
                .collect(Collectors.toList());

        for (Question question : questionsToRemove) {
            // Remove options first to avoid foreign key constraints
            mcqOptionRepository.deleteByQuestionId(question.getId());
            questionRepository.delete(question);
        }

        // Return the updated test
        Test refreshedTest = testRepository.findById(test.getId()).get();
        return convertToDTO(refreshedTest);
    }

    private void updateExistingQuestion(QuestionDTO questionDTO) {
        Question question = questionRepository.findById(questionDTO.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        question.setQuestionText(questionDTO.getQuestionText());
        question.setQuestionType(questionDTO.getQuestionType());
        question.setCorrectAnswer(questionDTO.getCorrectAnswer());
        question.setPoints(questionDTO.getPoints() != null ? questionDTO.getPoints() : 1);

        questionRepository.save(question);

        // Handle MCQ options if applicable
        if (questionDTO.getQuestionType() == QuestionType.MCQ && questionDTO.getOptions() != null) {
            // Delete existing options
            mcqOptionRepository.deleteByQuestionId(question.getId());

            // Create new options
            for (MCQOptionDTO optionDTO : questionDTO.getOptions()) {
                MCQOption option = new MCQOption();
                option.setQuestion(question);
                option.setOptionText(optionDTO.getOptionText());
                option.setIsCorrect(optionDTO.getIsCorrect());
                mcqOptionRepository.save(option);
            }
        }
    }

    private void createNewQuestion(Test test, QuestionDTO questionDTO) {
        Question question = new Question();
        question.setTest(test);
        question.setQuestionText(questionDTO.getQuestionText());
        question.setQuestionType(questionDTO.getQuestionType());
        question.setCorrectAnswer(questionDTO.getCorrectAnswer());
        question.setPoints(questionDTO.getPoints() != null ? questionDTO.getPoints() : 1);

        Question savedQuestion = questionRepository.save(question);

        // Handle MCQ options if applicable
        if (questionDTO.getQuestionType() == QuestionType.MCQ && questionDTO.getOptions() != null) {
            for (MCQOptionDTO optionDTO : questionDTO.getOptions()) {
                MCQOption option = new MCQOption();
                option.setQuestion(savedQuestion);
                option.setOptionText(optionDTO.getOptionText());
                option.setIsCorrect(optionDTO.getIsCorrect());
                mcqOptionRepository.save(option);
            }
        }
    }

    /**
     * Delete multiple questions for a test by IDs
     */
    @Transactional
    public void deleteQuestions(Long testId, List<Long> questionIds) {
        // Verify the test exists
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found"));

        // Verify current user has permission to modify this test
        User currentUser = userService.getCurrentUser();
        if (!test.getLecturer().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You don't have permission to modify this test");
        }

        // Delete each question
        for (Long questionId : questionIds) {
            // First delete any MCQ options associated with the question
            mcqOptionRepository.deleteByQuestionId(questionId);

            // Then delete the question itself
            questionRepository.deleteById(questionId);
        }
    }


    @Transactional
    public void cancelTest(Long testId) {
        try {
            System.out.println("Service: Attempting to cancel test " + testId);

            Test test = testRepository.findById(testId)
                    .orElseThrow(() -> new ResourceNotFoundException("Test not found"));

            System.out.println("Found test in service, current status: " + test.getStatus());

            // Check if test has already started
            if (test.getStartTime() != null && test.getStartTime().isBefore(LocalDateTime.now())) {
                System.out.println("Test has already started, cannot cancel");
                throw new IllegalStateException("Cannot cancel a test that has already started");
            }

            // Try setting the status with debug info
            System.out.println("Current status type: " + test.getStatus().getClass().getName());
            System.out.println("Setting status to CANCELLED");

            test.setStatus(Test.TestStatus.CANCELLED);
            System.out.println("Status set to: " + test.getStatus());

            // Save with debug info
            System.out.println("Saving test with updated status");
            Test savedTest = testRepository.save(test);
            notificationService.handleTestCancellationNotification(savedTest, savedTest.getModule());
            System.out.println("Test saved. New status: " + savedTest.getStatus());

        } catch (Exception e) {
            System.err.println("Exception in cancelTest service method: " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}