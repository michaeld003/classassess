package com.classassess.classassess.repository;

import com.classassess.classassess.model.Module;
import com.classassess.classassess.model.ModuleStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ModuleStatusHistoryRepository extends JpaRepository<ModuleStatusHistory, Long> {
    List<ModuleStatusHistory> findByModuleOrderByChangedAtDesc(Module module);
}