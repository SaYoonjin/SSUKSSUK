package com.ssukssuk.repository.plant;

import lombok.Getter;

@Getter
public class BindingProjection {
    private final String serial;
    private final Long plantId;

    public BindingProjection(String serial, Long plantId) {
        this.serial = serial;
        this.plantId = plantId;
    }
}
