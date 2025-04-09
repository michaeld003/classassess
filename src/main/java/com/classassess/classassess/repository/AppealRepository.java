package com.classassess.classassess.repository;

import com.classassess.classassess.model.Appeal;
import com.classassess.classassess.model.AppealStatus;
import com.classassess.classassess.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppealRepository extends JpaRepository<Appeal, Long> {

    List<Appeal> findByStatus(AppealStatus status);

    List<Appeal> findBySubmission_Student_Id(Long studentId);

    @Query("SELECT a FROM Appeal a WHERE a.test.lecturer.id = :lecturerId AND a.status = :status")
    List<Appeal> findByLecturerIdAndStatus(@Param("lecturerId") Long lecturerId, @Param("status") AppealStatus status);

    @Query("SELECT COUNT(a) FROM Appeal a WHERE a.test.lecturer.id = :lecturerId AND a.status = :status")
    Long countByLecturerIdAndStatus(@Param("lecturerId") Long lecturerId, @Param("status") AppealStatus status);


    List<Appeal> findByTestCreatedByOrderByCreatedAtDesc(User createdBy);

    int countByTestCreatedByAndStatus(User createdBy, AppealStatus status);

    // Methods for analytics
    @Query("SELECT m.id, m.code, m.title, COUNT(a), SUM(CASE WHEN a.status = 'APPROVED' THEN 1 ELSE 0 END) " +
            "FROM Appeal a JOIN a.test t JOIN t.module m " +
            "WHERE t.lecturer.id = :lecturerId " +
            "GROUP BY m.id, m.code, m.title")
    List<Object[]> getAppealMetricsByModule(@Param("lecturerId") Long lecturerId);

    @Query("SELECT m.id, m.code, m.title, COUNT(ans), AVG(CASE WHEN ans.score >= 0.6 THEN 1.0 ELSE 0.0 END) " +
            "FROM Answer ans JOIN ans.question q JOIN q.test t JOIN t.module m " +
            "WHERE t.lecturer.id = :lecturerId AND ans.score IS NOT NULL " +
            "GROUP BY m.id, m.code, m.title")
    List<Object[]> getAnswerMetricsByModule(@Param("lecturerId") Long lecturerId);

    Optional<Appeal> findBySubmissionId(Long submissionId);

    Optional<Appeal> findTopBySubmissionIdOrderByCreatedAtDesc(Long id);

    @Query("SELECT m.id, m.code, m.title, COUNT(a), SUM(CASE WHEN a.status = 'APPROVED' THEN 1 ELSE 0 END) " +
            "FROM Appeal a JOIN a.test t JOIN t.module m " +
            "GROUP BY m.id, m.code, m.title")
    List<Object[]> getAppealMetricsByModuleForAdmin();

    @Query("SELECT m.id, m.code, m.title, COUNT(ans), AVG(CASE WHEN ans.score >= 0.6 THEN 1.0 ELSE 0.0 END) " +
            "FROM Answer ans JOIN ans.question q JOIN q.test t JOIN t.module m " +
            "WHERE ans.score IS NOT NULL " +
            "GROUP BY m.id, m.code, m.title")
    List<Object[]> getAnswerMetricsByModuleForAdmin();
}