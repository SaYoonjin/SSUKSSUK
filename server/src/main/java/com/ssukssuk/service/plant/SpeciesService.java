package com.ssukssuk.service.plant;

import com.ssukssuk.domain.plant.Species;
import com.ssukssuk.dto.plant.SpeciesResponse;
import com.ssukssuk.repository.plant.SpeciesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SpeciesService {

    private final SpeciesRepository speciesRepository;

    public List<SpeciesResponse> getAllSpecies() {
        return speciesRepository.findAll().stream()
                .map(SpeciesResponse::from)
                .toList();
    }
}
