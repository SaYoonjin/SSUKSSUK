package com.ssukssuk.event;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class PlantStatusUpdatedEvent {
    private final Long plantId;
}
