package com.classassess.classassess.repository;

import com.classassess.classassess.model.Module;  // Change this import
import com.classassess.classassess.model.ModuleStudent;
import com.classassess.classassess.model.User;    // Change this import
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModuleStudentRepository extends JpaRepository<ModuleStudent, Long> {
    List<ModuleStudent> findByStudent(User student);
    boolean existsByModuleAndStudent(Module module, User student);
    Optional<ModuleStudent> findByModuleAndStudent(Module module, User student);
    Long countByModule(Module module);
    void deleteByStudent(User student);
    int countByStudent(User student);
    List<ModuleStudent> findByModule(Module module);
}