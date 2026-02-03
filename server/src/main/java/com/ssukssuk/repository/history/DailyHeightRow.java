package com.ssukssuk.repository.history;

import java.time.LocalDate;

public interface DailyHeightRow {
    LocalDate getD();      // DATE(inference_at)
    Double getHeight();
    Double getWidth();
}