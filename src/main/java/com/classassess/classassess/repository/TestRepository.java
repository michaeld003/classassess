package com.classassess.classassess.repository;

import com.classassess.classassess.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TestRepository extends JpaRepository<Test, Long> {

    @Query("SELECT t FROM Test t WHERE t.lecturer.id = :lecturerId AND t.status != 'CANCELLED'")
    List<Test> findByLecturerId(@Param("lecturerId") Long lecturerId);

    @Query("SELECT t FROM Test t WHERE t.module.id = :moduleId AND t.status != 'CANCELLED'")
    List<Test> findByModuleId(@Param("moduleId") Long moduleId);

    @Query("SELECT t FROM Test t WHERE t.endTime >= CURRENT_TIMESTAMP AND t.status = 'ACTIVE'")
    List<Test> findActiveTests();

    // New queries for analytics
    @Query("SELECT t FROM Test t WHERE t.lecturer.id = :lecturerId AND t.startTime BETWEEN :startDate AND :endDate")
    List<Test> findByLecturerIdAndDateRange(@Param("lecturerId") Long lecturerId,
                                            @Param("startDate") LocalDateTime startDate,
                                            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(t) FROM Test t WHERE t.lecturer.id = :lecturerId AND t.startTime > CURRENT_TIMESTAMP")
    Integer countUpcomingTestsByLecturerId(@Param("lecturerId") Long lecturerId);

    @Query("SELECT COUNT(t) FROM Test t WHERE t.lecturer.id = :lecturerId AND t.startTime <= CURRENT_TIMESTAMP")
    Integer countCompletedTestsByLecturerId(@Param("lecturerId") Long lecturerId);

    @Query("SELECT t.module.id as moduleId, t.module.code as moduleCode, t.module.title as moduleTitle, " +
            "COUNT(DISTINCT t) as testCount, AVG(s.totalScore) as avgScore " +
            "FROM Test t LEFT JOIN Submission s ON s.test = t " +
            "WHERE t.lecturer.id = :lecturerId " +
            "GROUP BY t.module.id, t.module.code, t.module.title")
    List<Object[]> getModulePerformanceByLecturerId(@Param("lecturerId") Long lecturerId);

    @Query(value = "SELECT YEAR(t.start_time) as year, MONTH(t.start_time) as month, " +
            "s.status, COUNT(*) as count " +
            "FROM tests t LEFT JOIN submissions s ON s.test_id = t.id " +
            "WHERE t.lecturer_id = :lecturerId " +
            "GROUP BY YEAR(t.start_time), MONTH(t.start_time), s.status", nativeQuery = true)
    List<Object[]> getTestActivityRawData(@Param("lecturerId") Long lecturerId);

    @Query(value = "SELECT YEAR(t.start_time) as year, MONTH(t.start_time) as month, " +
            "COUNT(t.id) as count " +
            "FROM tests t " +
            "WHERE t.lecturer_id = :lecturerId " +
            "AND t.end_time > NOW() " +
            "GROUP BY YEAR(t.start_time), MONTH(t.start_time)", nativeQuery = true)
    List<Object[]> getUpcomingTestsByMonth(@Param("lecturerId") Long lecturerId);

    @Query("SELECT m.id as moduleId, m.code as moduleCode, m.title as moduleTitle, " +
            "COUNT(DISTINCT t) as testCount, AVG(s.totalScore) as avgScore " +
            "FROM Test t LEFT JOIN Submission s ON s.test = t " +
            "JOIN t.module m " +
            "GROUP BY m.id, m.code, m.title")
    List<Object[]> getModulePerformanceForAdmin();

    @Query(value = "SELECT YEAR(t.start_time) as year, MONTH(t.start_time) as month, " +
            "s.status, COUNT(*) as count " +
            "FROM tests t LEFT JOIN submissions s ON s.test_id = t.id " +
            "GROUP BY YEAR(t.start_time), MONTH(t.start_time), s.status", nativeQuery = true)
    List<Object[]> getTestActivityRawDataForAdmin();

    @Query(value = "SELECT YEAR(t.start_time) as year, MONTH(t.start_time) as month, " +
            "COUNT(t.id) as count " +
            "FROM tests t " +
            "WHERE t.end_time > NOW() " +
            "GROUP BY YEAR(t.start_time), MONTH(t.start_time)", nativeQuery = true)
    List<Object[]> getUpcomingTestsByMonthForAdmin();
}