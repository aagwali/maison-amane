package com.maisonamane.infrastructure.http.dto;

import java.util.List;

public record ViewsResponse(ViewResponse front, ViewResponse detail, List<ViewResponse> additional) {}
