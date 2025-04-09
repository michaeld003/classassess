package com.classassess.classassess.repository;

import com.classassess.classassess.model.Announcement;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByModuleId(Long moduleId);

    @Modifying
    @Transactional
    void deleteById(Long id);
}