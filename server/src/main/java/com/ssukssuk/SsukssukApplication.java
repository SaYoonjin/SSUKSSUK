package com.ssukssuk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class SsukssukApplication {

    public static void main(String[] args) {
        SpringApplication.run(SsukssukApplication.class, args);
    }

}
