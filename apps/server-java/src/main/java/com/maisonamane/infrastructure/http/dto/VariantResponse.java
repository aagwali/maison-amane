package com.maisonamane.infrastructure.http.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record VariantResponse(
        String id,
        String tag,
        String size,
        CustomDimensionsResponse customDimensions,
        Double price) {

    public static VariantResponse standard(String id, String size) {
        return new VariantResponse(id, "StandardVariant", size, null, null);
    }

    public static VariantResponse custom(
            String id, CustomDimensionsResponse dimensions, double price) {
        return new VariantResponse(id, "CustomVariant", "CUSTOM", dimensions, price);
    }
}
