package com.ssukssuk.service.push;

import com.ssukssuk.domain.push.PushToken;
import com.ssukssuk.dto.push.PushTokenRequest;
import com.ssukssuk.dto.push.PushTokenResponse;
import com.ssukssuk.repository.push.PushTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PushService {

    private final PushTokenRepository pushTokenRepository;

    @Transactional
    public PushTokenResponse registerToken(
            PushTokenRequest request
    ) {
        // 유저가 이 기기에서 이미 토큰 등록했는지 조회
        PushToken token = pushTokenRepository
                .findByDeviceId(request.getMobileDeviceId())
                .map(existing -> {
                    existing.updateToken(request.getToken());
                    return existing;
                })
                .orElseGet(() ->
                        PushToken.builder()
                                .deviceId(request.getMobileDeviceId())
                                .platform(request.getPlatform())
                                .token(request.getToken())
                                .build()
                );


        pushTokenRepository.save(token);

        return PushTokenResponse.from(token);
    }
}

