package com.classassess.classassess.service;

import com.classassess.classassess.model.Question;
import com.classassess.classassess.model.MCQOption;
import com.classassess.classassess.model.QuestionType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AIService {

    @Value("${openai.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate;

    public AIService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<Question> generateQuestions(String topic, String description, int count) {
        List<Question> questions = new ArrayList<>();

        try {
            // Prepare the request for OpenAI API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);

            String prompt = "Generate " + count + " multiple choice questions about " + topic + ". " + description;

            Map<String, Object> requestBody = Map.of(
                    "model", "gpt-3.5-turbo",
                    "messages", List.of(
                            Map.of(
                                    "role", "system",
                                    "content", "You are an expert educational test generator. Create detailed, accurate multiple-choice questions with 4 options each."
                            ),
                            Map.of(
                                    "role", "user",
                                    "content", prompt
                            )
                    ),
                    "temperature", 0.7
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // Try to call the OpenAI API
            try {
                String apiUrl = "https://api.openai.com/v1/chat/completions";
                Map<String, Object> response = restTemplate.postForObject(apiUrl, request, Map.class);

                // Parse the AI response and create questions
                if (response != null && response.containsKey("choices")) {
                    List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                    if (!choices.isEmpty()) {
                        Map<String, Object> choice = choices.get(0);
                        Map<String, Object> message = (Map<String, Object>) choice.get("message");
                        String content = (String) message.get("content");

                        // Parse the content and create questions
                        return parseAIResponse(content, topic);
                    }
                }
            } catch (Exception e) {
                System.err.println("Error calling OpenAI API: " + e.getMessage());
                // Fall back to sample questions if API call fails
            }
        } catch (Exception e) {
            System.err.println("Error in AI question generation: " + e.getMessage());
        }

        // Fallback: Return sample questions if the API call fails
        for (int i = 0; i < count; i++) {
            Question question = new Question();
            question.setQuestionType(QuestionType.MCQ);
            question.setQuestionText("Sample question about " + topic + " #" + (i + 1));
            question.setPoints(1);

            List<MCQOption> options = new ArrayList<>();
            for (int j = 0; j < 4; j++) {
                MCQOption option = new MCQOption();
                option.setOptionText("Option " + (j + 1));
                option.setIsCorrect(j == 0);
                option.setQuestion(question);
                options.add(option);
            }

            question.setOptions(options);
            questions.add(question);
        }

        return questions;
    }

    private List<Question> parseAIResponse(String content, String topic) {
        List<Question> questions = new ArrayList<>();
        // Simple parsing logic - in a real system, you would use more robust parsing
        String[] lines = content.split("\n");

        Question currentQuestion = null;
        List<MCQOption> currentOptions = null;
        int correctIndex = -1;

        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) continue;

            if (line.matches("\\d+\\..*") || line.startsWith("Q")) {
                // This is a new question
                if (currentQuestion != null && currentOptions != null && correctIndex >= 0) {
                    // Set the correct answer
                    if (correctIndex < currentOptions.size()) {
                        currentOptions.get(correctIndex).setIsCorrect(true);
                    }
                    currentQuestion.setOptions(currentOptions);
                    questions.add(currentQuestion);
                }

                // Start a new question
                currentQuestion = new Question();
                currentQuestion.setQuestionType(QuestionType.MCQ);
                currentQuestion.setQuestionText(line.replaceFirst("\\d+\\.\\s*|Q\\d+:\\s*", ""));
                currentQuestion.setPoints(1);

                currentOptions = new ArrayList<>();
                correctIndex = -1;
            } else if (line.matches("[A-D]\\..*|[a-d]\\..*") && currentQuestion != null) {
                // This is an option
                MCQOption option = new MCQOption();
                option.setOptionText(line.replaceFirst("[A-Da-d]\\.\\s*", ""));
                option.setIsCorrect(false);
                option.setQuestion(currentQuestion);

                currentOptions.add(option);
            } else if ((line.contains("Correct answer:") || line.contains("Answer:")) && currentOptions != null) {
                // This line indicates the correct answer
                if (line.contains("A") || line.contains("a")) correctIndex = 0;
                else if (line.contains("B") || line.contains("b")) correctIndex = 1;
                else if (line.contains("C") || line.contains("c")) correctIndex = 2;
                else if (line.contains("D") || line.contains("d")) correctIndex = 3;
            }
        }

        // Add the last question if exists
        if (currentQuestion != null && currentOptions != null && correctIndex >= 0) {
            if (correctIndex < currentOptions.size()) {
                currentOptions.get(correctIndex).setIsCorrect(true);
            }
            currentQuestion.setOptions(currentOptions);
            questions.add(currentQuestion);
        }

        // If parsing failed, fall back to a sample question
        if (questions.isEmpty()) {
            Question question = new Question();
            question.setQuestionType(QuestionType.MCQ);
            question.setQuestionText("Sample question about " + topic + " #1");
            question.setPoints(1);

            List<MCQOption> options = new ArrayList<>();
            for (int j = 0; j < 4; j++) {
                MCQOption option = new MCQOption();
                option.setOptionText("Option " + (j + 1));
                option.setIsCorrect(j == 0);
                option.setQuestion(question);
                options.add(option);
            }

            question.setOptions(options);
            questions.add(question);
        }

        return questions;
    }

    public Map<String, Object> evaluateWrittenAnswer(String question, String answer, String correctAnswer) {
        // Skip empty answers
        if (answer == null || answer.trim().isEmpty()) {
            return Map.of(
                    "score", 0.0,
                    "feedback", "No answer provided."
            );
        }

        // If correct answer is not provided, use AI to evaluate based on the question alone
        if (correctAnswer == null || correctAnswer.trim().isEmpty()) {
            try {
                // Use OpenAI to evaluate without a reference answer
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("Authorization", "Bearer " + apiKey);

                String prompt = "Question: " + question + "\n\n" +
                        "Student Answer: " + answer + "\n\n" +
                        "As an expert educator, evaluate this answer for accuracy and completeness. " +
                        "Provide a score between 0 and 100, and specific constructive feedback about what's " +
                        "correct and what could be improved.";

                Map<String, Object> requestBody = Map.of(
                        "model", "gpt-3.5-turbo",
                        "messages", List.of(
                                Map.of(
                                        "role", "system",
                                        "content", "You are an AI educational assessment assistant. Evaluate student answers fairly and provide constructive feedback."
                                ),
                                Map.of(
                                        "role", "user",
                                        "content", prompt
                                )
                        ),
                        "temperature", 0.3
                );

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

                String apiUrl = "https://api.openai.com/v1/chat/completions";
                Map<String, Object> response = restTemplate.postForObject(apiUrl, request, Map.class);

                if (response != null && response.containsKey("choices")) {
                    List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                    if (!choices.isEmpty()) {
                        Map<String, Object> choice = choices.get(0);
                        Map<String, Object> message = (Map<String, Object>) choice.get("message");
                        String content = (String) message.get("content");

                        // Extract score and feedback from the AI response
                        double score = extractScoreFromAIResponse(content);
                        String feedback = extractFeedbackFromAIResponse(content);

                        return Map.of(
                                "score", score,
                                "feedback", feedback
                        );
                    }
                }
            } catch (Exception e) {
                System.err.println("Error calling OpenAI API for evaluation without reference answer: " + e.getMessage());
                // Fall back to basic scoring if AI evaluation fails
                return Map.of(
                        "score", Math.min(50.0, calculateImprovedSimilarity(answer, question) / 2),
                        "feedback", "Your answer has been evaluated based on relevance to the question. Consider reviewing course materials for a more complete answer."
                );
            }
        }

        try {
            // Try to use the OpenAI API for evaluation
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);

            String prompt = "Question: " + question + "\n\n" +
                    "Model Answer: " + correctAnswer + "\n\n" +
                    "Student Answer: " + answer + "\n\n" +
                    "Evaluate the student's answer in comparison to the model answer. Provide a score between 0 and 100, and constructive feedback.";

            Map<String, Object> requestBody = Map.of(
                    "model", "gpt-3.5-turbo",
                    "messages", List.of(
                            Map.of(
                                    "role", "system",
                                    "content", "You are an AI educational assessment assistant. Evaluate student answers fairly and provide constructive feedback."
                            ),
                            Map.of(
                                    "role", "user",
                                    "content", prompt
                            )
                    ),
                    "temperature", 0.3
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            try {
                String apiUrl = "https://api.openai.com/v1/chat/completions";
                Map<String, Object> response = restTemplate.postForObject(apiUrl, request, Map.class);

                if (response != null && response.containsKey("choices")) {
                    List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                    if (!choices.isEmpty()) {
                        Map<String, Object> choice = choices.get(0);
                        Map<String, Object> message = (Map<String, Object>) choice.get("message");
                        String content = (String) message.get("content");

                        // Extract score and feedback from the AI response
                        double score = extractScoreFromAIResponse(content);
                        String feedback = extractFeedbackFromAIResponse(content);

                        return Map.of(
                                "score", score,
                                "feedback", feedback
                        );
                    }
                }
            } catch (Exception e) {
                System.err.println("Error calling OpenAI API for evaluation: " + e.getMessage());
                // Fall back to algorithmic scoring if API call fails
            }
        } catch (Exception e) {
            System.err.println("Error in AI evaluation: " + e.getMessage());
        }

        // Fallback to algorithmic scoring method
        double score = calculateImprovedSimilarity(answer, correctAnswer);
        String feedback = generateDetailedFeedback(score, answer, correctAnswer);

        return Map.of(
                "score", score,
                "feedback", feedback
        );
    }

    private double extractScoreFromAIResponse(String content) {
        try {
            // Try to extract score using regex
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("Score:?\\s*(\\d+)",
                    java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Matcher matcher = pattern.matcher(content);

            if (matcher.find()) {
                return Double.parseDouble(matcher.group(1));
            }

            // Alternative pattern
            pattern = java.util.regex.Pattern.compile("(\\d+)/100",
                    java.util.regex.Pattern.CASE_INSENSITIVE);
            matcher = pattern.matcher(content);

            if (matcher.find()) {
                return Double.parseDouble(matcher.group(1));
            }

            // If no explicit score, try to estimate from feedback
            if (content.toLowerCase().contains("excellent") || content.toLowerCase().contains("perfect")) {
                return 95.0;
            } else if (content.toLowerCase().contains("good") || content.toLowerCase().contains("well done")) {
                return 85.0;
            } else if (content.toLowerCase().contains("satisfactory") || content.toLowerCase().contains("adequate")) {
                return 75.0;
            } else if (content.toLowerCase().contains("needs improvement") || content.toLowerCase().contains("lacking")) {
                return 65.0;
            } else if (content.toLowerCase().contains("poor") || content.toLowerCase().contains("insufficient")) {
                return 55.0;
            }
        } catch (Exception e) {
            System.err.println("Error extracting score: " + e.getMessage());
        }

        // Default to algorithmic scoring if extraction fails
        return calculateImprovedSimilarity(content, content);
    }

    private String extractFeedbackFromAIResponse(String content) {
        try {
            // Try to extract feedback section
            String feedback = content;

            // Remove score section if present
            feedback = feedback.replaceFirst("Score:?\\s*\\d+(/100)?", "").trim();

            // Remove any potential headers
            feedback = feedback.replaceFirst("^(Feedback|Evaluation|Assessment):\\s*", "").trim();

            return feedback;
        } catch (Exception e) {
            System.err.println("Error extracting feedback: " + e.getMessage());
        }

        // Return the content as is if extraction fails
        return content;
    }

    private double calculateImprovedSimilarity(String answer, String correctAnswer) {
        // Normalize text: convert to lowercase, remove punctuation
        String normalizedAnswer = answer.toLowerCase().replaceAll("[^a-z0-9\\s]", "");
        String normalizedCorrect = correctAnswer.toLowerCase().replaceAll("[^a-z0-9\\s]", "");

        // Split into words
        String[] answerWords = normalizedAnswer.split("\\s+");
        String[] correctWords = normalizedCorrect.split("\\s+");

        // Calculate word overlap
        Set<String> answerSet = new HashSet<>(Arrays.asList(answerWords));
        Set<String> correctSet = new HashSet<>(Arrays.asList(correctWords));

        // Count keywords that appear in both
        Set<String> intersection = new HashSet<>(answerSet);
        intersection.retainAll(correctSet);

        // Calculate semantic overlap - how many key concepts are covered
        double keywordCoverage = correctSet.isEmpty() ? 0 : (double) intersection.size() / correctSet.size();

        // Calculate length ratio - penalize extremely short answers
        double lengthRatio = correctWords.length == 0 ? 0 :
                Math.min(1.0, (double) answerWords.length / (correctWords.length * 0.7));

        // Calculate final score as weighted average
        return (keywordCoverage * 0.7 + lengthRatio * 0.3) * 100;
    }

    private String generateDetailedFeedback(double score, String answer, String correctAnswer) {
        if (score >= 90) {
            return "Excellent answer! You've covered all the key points accurately.";
        } else if (score >= 75) {
            return "Good answer! You've addressed most of the important concepts.";
        } else if (score >= 60) {
            return "Satisfactory answer, but some key points are missing or could be expanded.";
        } else if (score >= 40) {
            return "Your answer shows some understanding, but several important concepts are missing. Review the material and try again.";
        } else {
            return "Your answer needs significant improvement. Please review the course materials on this topic.";
        }
    }

    private Map<String, Object> basicWordMatchScoring(String question, String answer) {
        // Calculate a basic score based on answer length and complexity
        int wordCount = answer.split("\\s+").length;
        double score = Math.min(100, wordCount * 5.0); // 5 points per word up to 100

        String feedback = "Your answer has been evaluated based on length and complexity.";

        return Map.of(
                "score", score,
                "feedback", feedback
        );
    }
}