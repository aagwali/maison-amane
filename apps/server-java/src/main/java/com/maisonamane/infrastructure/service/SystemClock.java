package com.maisonamane.infrastructure.service;

import org.springframework.stereotype.Component;
import java.time.Instant;

/**
 * System clock provider.
 * Maps Effect-TS SystemClockLive to Spring @Component.
 */
@Component
public class SystemClock implements com.maisonamane.port.driven.service.Clock {

    @Override
    public Instant now() {
        return Instant.now();
    }
}
