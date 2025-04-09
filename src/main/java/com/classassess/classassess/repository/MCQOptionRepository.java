package com.classassess.classassess.repository;

import com.classassess.classassess.model.MCQOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MCQOptionRepository extends JpaRepository<MCQOption, Long> {
    List<MCQOption> findByQuestionId(Long questionId);
    void deleteByQuestionId(Long questionId);
}

