package com.maisonamane.domain.catalog.projection;

import com.maisonamane.domain.pilot.enums.Size;
import com.maisonamane.domain.pilot.valueobject.PositiveCm;
import com.maisonamane.domain.pilot.valueobject.Price;
import java.util.Objects;

/**
 * Sealed interface for catalog variants (simplified for UI).
 * Maps Effect-TS S.Union(CatalogStandardVariant, CatalogCustomVariant).
 */
public sealed interface CatalogVariant permits
    CatalogVariant.StandardVariant,
    CatalogVariant.CustomVariant {

    record StandardVariant(Size size) implements CatalogVariant {
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

    record CustomVariant(CatalogDimensions dimensions, Price price) implements CatalogVariant {
        public CustomVariant {
            Objects.requireNonNull(dimensions, "Dimensions cannot be null");
            Objects.requireNonNull(price, "Price cannot be null");
        }

        public static CustomVariant of(CatalogDimensions dimensions, Price price) {
            return new CustomVariant(dimensions, price);
        }
    }

    record CatalogDimensions(PositiveCm width, PositiveCm length) {
        public CatalogDimensions {
            Objects.requireNonNull(width, "Width cannot be null");
            Objects.requireNonNull(length, "Length cannot be null");
        }

        public static CatalogDimensions of(int widthCm, int lengthCm) {
            return new CatalogDimensions(PositiveCm.of(widthCm), PositiveCm.of(lengthCm));
        }
    }
}
