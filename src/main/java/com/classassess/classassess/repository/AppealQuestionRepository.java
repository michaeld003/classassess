package com.classassess.classassess.repository;

import com.classassess.classassess.model.AppealQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppealQuestionRepository extends JpaRepository<AppealQuestion, Long> {
    List<AppealQuestion> findByAppealId(Long appealId);
    Optional<AppealQuestion> findByAppealIdAndQuestionId(Long appealId, Long questionId);
}