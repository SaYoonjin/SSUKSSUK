package com.ssukssuk.repository.history;

import com.ssukssuk.domain.history.PlantImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PlantImageRepository extends JpaRepository<PlantImage, Long> {


}


