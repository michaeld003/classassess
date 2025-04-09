package com.classassess.classassess.repository;

import com.classassess.classassess.model.Submission;
import com.classassess.classassess.model.SubmissionStatus;
import com.classassess.classassess.model.Test;
import com.classassess.classassess.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    Optional<Submission> findByTestAndStudent(Test test, User student);

    List<Submission> findByStudentAndStatus(User student, SubmissionStatus status);

    List<Submission> findByTestIn(List<Test> tests);

    int countByStudentAndStatus(User student, SubmissionStatus status);

    boolean existsByTestIdAndStudentIdAndStatusIn(Long testId, Long studentId, List<SubmissionStatus> statuses);
    
    List<Submission> findByStudentOrderBySubmittedAtDesc(User student);

    @Query("SELECT COUNT(CASE WHEN s.totalScore >= 60 THEN 1 ELSE NULL END), COUNT(s) " +
            "FROM Submission s " +
            "JOIN s.test t " +
            "WHERE t.module.id = :moduleId AND s.status = 'GRADED'")
    List<Object[]> findModulePassingRate(@Param("moduleId") Long moduleId);


    List<Submission> findByStudentIdAndTestModuleId(Long studentId, Long moduleId);
}