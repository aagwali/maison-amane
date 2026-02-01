package com.maisonamane.infrastructure.http.mapper;

import com.maisonamane.application.pilot.command.UnvalidatedProductData;
import com.maisonamane.application.pilot.command.UnvalidatedProductData.UnvalidatedDimensions;
import com.maisonamane.application.pilot.command.UnvalidatedProductData.UnvalidatedVariant;
import com.maisonamane.application.pilot.command.UnvalidatedProductData.UnvalidatedView;
import com.maisonamane.domain.pilot.aggregate.PilotProduct;
import com.maisonamane.domain.pilot.entity.ProductVariant;
import com.maisonamane.domain.pilot.entity.ProductVariant.CustomVariant;
import com.maisonamane.domain.pilot.entity.ProductVariant.StandardVariant;
import com.maisonamane.domain.pilot.valueobject.ProductView;
import com.maisonamane.domain.pilot.valueobject.ProductViews;
import com.maisonamane.domain.pilot.valueobject.SyncStatus;
import com.maisonamane.infrastructure.http.dto.CreatePilotProductRequest;
import com.maisonamane.infrastructure.http.dto.CustomDimensionsResponse;
import com.maisonamane.infrastructure.http.dto.PilotProductResponse;
import com.maisonamane.infrastructure.http.dto.SyncErrorResponse;
import com.maisonamane.infrastructure.http.dto.SyncStatusResponse;
import com.maisonamane.infrastructure.http.dto.VariantRequest;
import com.maisonamane.infrastructure.http.dto.VariantResponse;
import com.maisonamane.infrastructure.http.dto.ViewRequest;
import com.maisonamane.infrastructure.http.dto.ViewResponse;
import com.maisonamane.infrastructure.http.dto.ViewsResponse;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class PilotProductHttpMapper {

    public UnvalidatedProductData toUnvalidatedData(CreatePilotProductRequest request) {
        return new UnvalidatedProductData(
                request.label(),
                request.type(),
                request.category(),
                request.description(),
                request.priceRange(),
                request.variants().stream().map(this::toUnvalidatedVariant).toList(),
                request.views().stream().map(this::toUnvalidatedView).toList(),
                request.status());
    }

    private UnvalidatedVariant toUnvalidatedVariant(VariantRequest variant) {
        UnvalidatedDimensions dimensions = null;
        if (variant.customDimensions() != null) {
            dimensions =
                    new UnvalidatedDimensions(
                            (int) variant.customDimensions().width(),
                            (int) variant.customDimensions().length());
        }
        Integer price = variant.price() != null ? variant.price().intValue() : null;
        return new UnvalidatedVariant(variant.size(), dimensions, price);
    }

    private UnvalidatedView toUnvalidatedView(ViewRequest view) {
        return new UnvalidatedView(view.viewType(), view.imageUrl());
    }

    public PilotProductResponse toResponse(PilotProduct product) {
        return new PilotProductResponse(
                product.id().value(),
                product.label().value(),
                product.type().name(),
                product.category().name(),
                product.description().value(),
                product.priceRange().name(),
                toVariantResponses(product.variants()),
                toViewsResponse(product.views()),
                product.status().name(),
                toSyncStatusResponse(product.syncStatus()),
                product.createdAt(),
                product.updatedAt());
    }

    private List<VariantResponse> toVariantResponses(List<ProductVariant> variants) {
        return variants.stream().map(this::toVariantResponse).toList();
    }

    private VariantResponse toVariantResponse(ProductVariant variant) {
        return switch (variant) {
            case StandardVariant std -> VariantResponse.standard(
                    generateVariantId(std), std.size().name());
            case CustomVariant custom -> VariantResponse.custom(
                    generateVariantId(custom),
                    new CustomDimensionsResponse(
                            custom.customDimensions().width().value(),
                            custom.customDimensions().length().value()),
                    custom.price().valueInCentimes());
        };
    }

    private String generateVariantId(ProductVariant variant) {
        return switch (variant) {
            case StandardVariant std -> "variant-" + std.size().name().toLowerCase();
            case CustomVariant custom -> "variant-custom-"
                    + custom.customDimensions().width().value()
                    + "x"
                    + custom.customDimensions().length().value();
        };
    }

    private ViewsResponse toViewsResponse(ProductViews views) {
        return new ViewsResponse(
                toViewResponse(views.front()),
                toViewResponse(views.detail()),
                views.additional().stream().map(this::toViewResponse).toList());
    }

    private ViewResponse toViewResponse(ProductView view) {
        return new ViewResponse(view.viewType().name(), view.imageUrl().value());
    }

    private SyncStatusResponse toSyncStatusResponse(SyncStatus syncStatus) {
        return switch (syncStatus) {
            case SyncStatus.NotSynced notSynced -> SyncStatusResponse.notSynced();
            case SyncStatus.Synced synced -> SyncStatusResponse.synced(
                    synced.shopifyProductId().value(), synced.syncedAt());
            case SyncStatus.SyncFailed failed -> SyncStatusResponse.syncFailed(
                    new SyncErrorResponse(
                            failed.error().code(), failed.error().message(), failed.error().details()),
                    failed.failedAt(),
                    failed.attempts());
        };
    }
}
