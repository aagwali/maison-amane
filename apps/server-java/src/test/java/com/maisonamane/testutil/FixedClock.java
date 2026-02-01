package com.maisonamane.testutil;

import com.maisonamane.port.driven.service.Clock;
import java.time.Instant;

/**
 * Fixed clock for deterministic testing.
 * Maps Effect-TS FixedClockLive to Java.
 */
public class FixedClock implements Clock {

    private Instant fixedInstant;

    public FixedClock(Instant fixedInstant) {
        this.fixedInstant = fixedInstant;
    }

    public static FixedClock at(String isoDateTime) {
        return new FixedClock(Instant.parse(isoDateTime));
    }

    public static FixedClock atNow() {
        return new FixedClock(Instant.now());
    }

    @Override
    public Instant now() {
        return fixedInstant;
    }

    public void setFixedInstant(Instant instant) {
        this.fixedInstant = instant;
    }

    public void advance(long seconds) {
        this.fixedInstant = fixedInstant.plusSeconds(seconds);
    }
}
