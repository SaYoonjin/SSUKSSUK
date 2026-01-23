package com.ssukssuk.repository.plant;

import com.ssukssuk.domain.plant.Species;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpeciesRepository extends JpaRepository<Species, Long> {
}