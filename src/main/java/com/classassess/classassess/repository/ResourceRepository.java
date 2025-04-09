package com.classassess.classassess.repository;

import com.classassess.classassess.model.Resource;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByModuleId(Long moduleId);

    @Modifying
    @Transactional
    void deleteById(Long id);
}