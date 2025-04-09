package com.classassess.classassess.repository;

import com.classassess.classassess.model.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {
    List<Answer> findBySubmissionId(Long submissionId);
    
    Optional<Answer> findBySubmissionIdAndQuestionId(Long submissionId, Long questionId);
}