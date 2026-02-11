package com.ssukssuk.dto.push;

import com.ssukssuk.domain.push.PushToken;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class PushTokenResponse {

    private String mobileDeviceId;
    private String platform;
    private String token;
    private LocalDateTime registeredAt;

    public static PushTokenResponse from(PushToken token) {
        return new PushTokenResponse(
                token.getDeviceId(),
                token.getPlatform(),
                token.getToken(),
                token.getCreatedAt()
        );
    }
}
