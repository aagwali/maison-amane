package com.maisonamane.infrastructure.http.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SyncErrorResponse(String code, String message, Object details) {}
