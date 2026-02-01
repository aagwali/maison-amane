package com.maisonamane.domain.pilot.entity;

import com.maisonamane.domain.pilot.enums.Size;
import com.maisonamane.domain.pilot.valueobject.CustomDimension;
import com.maisonamane.domain.pilot.valueobject.Price;
import java.util.Objects;

/**
 * Sealed interface representing product variants.
 * Maps Effect-TS S.Union(StandardVariant, CustomVariant) to Java sealed interface.
 *
 * Variants are Value Objects:
 * - Defined by their attributes (size, dimensions, price)
 * - No identity of their own - they exist only within a Product aggregate
 * - Immutable - changes create new variants, not mutations
 */
public sealed interface ProductVariant permits ProductVariant.StandardVariant, ProductVariant.CustomVariant {

    Size size();

    record StandardVariant(Size size) implements ProductVariant {
        public StandardVariant {
            Objects.requireNonNull(size, "Size cannot be null");
            if (size == Size.CUSTOM) {
                throw new IllegalArgumentException("StandardVariant cannot have CUSTOM size");
            }
        }

        public static StandardVariant regular() {
            return new StandardVariant(Size.REGULAR);
        }

        public static StandardVariant large() {
            return new StandardVariant(Size.LARGE);
        }
    }

    record CustomVariant(CustomDimension customDimensions, Price price) implements ProductVariant {
        public CustomVariant {
            Objects.requireNonNull(customDimensions, "CustomDimensions cannot be null");
            Objects.requireNonNull(price, "Price cannot be null");
        }

        @Override
        public Size size() {
            return Size.CUSTOM;
        }

        public static CustomVariant of(CustomDimension dimensions, Price price) {
            return new CustomVariant(dimensions, price);
        }

        public static CustomVariant of(int widthCm, int lengthCm, int priceInCentimes) {
            return new CustomVariant(
                CustomDimension.of(widthCm, lengthCm),
                Price.of(priceInCentimes)
            );
        }
    }

    // Factory methods
    static StandardVariant standard(Size size) {
        return new StandardVariant(size);
    }

    static CustomVariant custom(CustomDimension dimensions, Price price) {
        return CustomVariant.of(dimensions, price);
    }

    // Type checks
    default boolean isStandard() {
        return this instanceof StandardVariant;
    }

    default boolean isCustom() {
        return this instanceof CustomVariant;
    }
}
