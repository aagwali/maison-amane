package com.maisonamane.domain.pilot.valueobject;

import java.util.Objects;
import java.util.regex.Pattern;

public record ImageUrl(String value) {

    private static final Pattern HTTPS_PATTERN = Pattern.compile("^https://.+");

    public ImageUrl {
        Objects.requireNonNull(value, "ImageUrl value cannot be null");
        if (!HTTPS_PATTERN.matcher(value).matches()) {
            throw new IllegalArgumentException("ImageUrl must start with https://");
        }
    }

    public static ImageUrl of(String value) {
        return new ImageUrl(value);
    }

    @Override
    public String toString() {
        return value;
    }
}
