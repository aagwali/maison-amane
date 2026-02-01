package com.maisonamane.port.driven.service;

import java.time.Instant;

/**
 * Interface for time provider.
 * Maps Effect-TS Context.Tag("Clock") to Java interface.
 */
public interface Clock {

    Instant now();
}
