package com.maisonamane.application.pilot.validation;

import com.maisonamane.application.pilot.command.UnvalidatedProductData;
import com.maisonamane.application.pilot.command.UnvalidatedProductData.UnvalidatedDimensions;
import com.maisonamane.application.pilot.command.UnvalidatedProductData.UnvalidatedVariant;
import com.maisonamane.application.pilot.command.UnvalidatedProductData.UnvalidatedView;
import com.maisonamane.domain.pilot.entity.ProductVariant;
import com.maisonamane.domain.pilot.enums.PriceRange;
import com.maisonamane.domain.pilot.enums.ProductCategory;
import com.maisonamane.domain.pilot.enums.ProductStatus;
import com.maisonamane.domain.pilot.enums.ProductType;
import com.maisonamane.domain.pilot.enums.Size;
import com.maisonamane.domain.pilot.enums.ViewType;
import com.maisonamane.domain.pilot.error.PilotProductError.ValidationError;
import com.maisonamane.domain.pilot.valueobject.CustomDimension;
import com.maisonamane.domain.pilot.valueobject.ImageUrl;
import com.maisonamane.domain.pilot.valueobject.Price;
import com.maisonamane.domain.pilot.valueobject.ProductDescription;
import com.maisonamane.domain.pilot.valueobject.ProductLabel;
import com.maisonamane.domain.pilot.valueobject.ProductView;
import com.maisonamane.domain.pilot.valueobject.ProductViews;
import io.vavr.collection.Seq;
import io.vavr.control.Either;
import io.vavr.control.Validation;
import java.util.ArrayList;
import java.util.List;

/**
 * Validator for product data.
 * Maps Effect-TS Schema validation to Java Vavr Validation.
 *
 * Three-level validation flow:
 * 1. API Schema → Command DTO (unvalidated)
 * 2. Application Schema → Validated Data (this class)
 * 3. Domain Schema → Aggregate (in aggregate constructor)
 */
public final class ProductDataValidator {

    private static final int MIN_VIEWS = 2;

    private ProductDataValidator() {
    }

    public static Either<ValidationError, ValidatedProductData> validate(UnvalidatedProductData data) {
        return Validation.combine(
            validateLabel(data.label()),
            validateType(data.type()),
            validateCategory(data.category()),
            validateDescription(data.description()),
            validatePriceRange(data.priceRange()),
            validateVariants(data.variants()),
            validateViews(data.views()),
            validateStatus(data.status())
        ).ap(ValidatedProductData::new)
            .toEither()
            .mapLeft(ProductDataValidator::combineErrors);
    }

    private static ValidationError combineErrors(Seq<String> errors) {
        return ValidationError.of(String.join("; ", errors));
    }

    private static Validation<String, ProductLabel> validateLabel(String label) {
        try {
            return Validation.valid(ProductLabel.of(label));
        } catch (Exception e) {
            return Validation.invalid("Invalid label: " + e.getMessage());
        }
    }

    private static Validation<String, ProductType> validateType(String type) {
        try {
            return Validation.valid(ProductType.valueOf(type));
        } catch (Exception e) {
            return Validation.invalid("Invalid product type: " + type);
        }
    }

    private static Validation<String, ProductCategory> validateCategory(String category) {
        try {
            return Validation.valid(ProductCategory.valueOf(category));
        } catch (Exception e) {
            return Validation.invalid("Invalid category: " + category);
        }
    }

    private static Validation<String, ProductDescription> validateDescription(String description) {
        try {
            return Validation.valid(ProductDescription.of(description));
        } catch (Exception e) {
            return Validation.invalid("Invalid description: " + e.getMessage());
        }
    }

    private static Validation<String, PriceRange> validatePriceRange(String priceRange) {
        try {
            return Validation.valid(PriceRange.valueOf(priceRange));
        } catch (Exception e) {
            return Validation.invalid("Invalid price range: " + priceRange);
        }
    }

    private static Validation<String, ProductStatus> validateStatus(String status) {
        try {
            return Validation.valid(ProductStatus.valueOf(status));
        } catch (Exception e) {
            return Validation.invalid("Invalid status: " + status);
        }
    }

    private static Validation<String, List<ProductVariant>> validateVariants(List<UnvalidatedVariant> variants) {
        if (variants == null || variants.isEmpty()) {
            return Validation.invalid("At least one variant is required");
        }

        List<ProductVariant> validated = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (int i = 0; i < variants.size(); i++) {
            UnvalidatedVariant v = variants.get(i);
            try {
                validated.add(validateVariant(v));
            } catch (Exception e) {
                errors.add("Variant[" + i + "]: " + e.getMessage());
            }
        }

        if (!errors.isEmpty()) {
            return Validation.invalid(String.join("; ", errors));
        }
        return Validation.valid(validated);
    }

    private static ProductVariant validateVariant(UnvalidatedVariant variant) {
        Size size = Size.valueOf(variant.size());

        if (size == Size.CUSTOM) {
            UnvalidatedDimensions dims = variant.customDimensions();
            if (dims == null || dims.width() == null || dims.length() == null) {
                throw new IllegalArgumentException("Custom variant requires dimensions");
            }
            if (variant.price() == null) {
                throw new IllegalArgumentException("Custom variant requires price");
            }
            return ProductVariant.custom(
                CustomDimension.of(dims.width(), dims.length()),
                Price.of(variant.price())
            );
        }

        return ProductVariant.standard(size);
    }

    private static Validation<String, ProductViews> validateViews(List<UnvalidatedView> views) {
        if (views == null || views.size() < MIN_VIEWS) {
            return Validation.invalid("Minimum " + MIN_VIEWS + " views required");
        }

        List<String> errors = new ArrayList<>();
        List<ProductView> validatedViews = new ArrayList<>();
        ProductView front = null;
        ProductView detail = null;
        List<ProductView> additional = new ArrayList<>();

        for (int i = 0; i < views.size(); i++) {
            UnvalidatedView v = views.get(i);
            try {
                ViewType viewType = ViewType.valueOf(v.viewType());
                ImageUrl imageUrl = ImageUrl.of(v.imageUrl());
                ProductView productView = new ProductView(viewType, imageUrl);
                validatedViews.add(productView);

                switch (viewType) {
                    case FRONT -> front = productView;
                    case DETAIL -> detail = productView;
                    default -> additional.add(productView);
                }
            } catch (Exception e) {
                errors.add("View[" + i + "]: " + e.getMessage());
            }
        }

        if (front == null) {
            errors.add("FRONT view is required");
        }
        if (detail == null) {
            errors.add("DETAIL view is required");
        }

        if (!errors.isEmpty()) {
            return Validation.invalid(String.join("; ", errors));
        }

        return Validation.valid(ProductViews.of(front, detail, additional));
    }
}
