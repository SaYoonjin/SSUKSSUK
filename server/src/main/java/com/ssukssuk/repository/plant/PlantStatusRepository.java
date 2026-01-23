package com.ssukssuk.repository.plant;

import com.ssukssuk.domain.plant.PlantStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlantStatusRepository
        extends JpaRepository<PlantStatus, Long> {
}