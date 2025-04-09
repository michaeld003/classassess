package com.classassess.classassess.repository;

import com.classassess.classassess.model.Module;
import com.classassess.classassess.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModuleRepository extends JpaRepository<Module, Long> {
    List<Module> findByLecturer(User lecturer);
    List<Module> findByModuleStudents_Student(User student);
    Optional<Module> findByCode(String code);

    @Query("SELECT COUNT(DISTINCT ms.student.id) FROM Module m JOIN m.moduleStudents ms WHERE m.lecturer.id = :lecturerId")
    Long countDistinctStudentsByLecturerId(@Param("lecturerId") Long lecturerId);

    long countByActiveTrue();

    @Query("SELECT COUNT(DISTINCT ms.student.id) FROM ModuleStudent ms WHERE ms.module.id = :moduleId")
    Long countStudentsInModule(@Param("moduleId") Long moduleId);

    @Query("SELECT ms.module.id FROM ModuleStudent ms WHERE ms.student.id = :studentId")
    List<Long> findModuleIdsByStudentId(@Param("studentId") Long studentId);

    List<Module> findByActiveTrue();
}