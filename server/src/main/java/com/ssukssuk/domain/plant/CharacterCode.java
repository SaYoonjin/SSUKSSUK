package com.ssukssuk.domain.plant;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "character_code")
public class CharacterCode {

    @Id
    @Column(name = "character_code", nullable = false)
    private Integer characterCode;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;
}