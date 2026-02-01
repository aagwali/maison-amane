package com.maisonamane.infrastructure.persistence.mongodb.mapper;

import com.maisonamane.domain.pilot.aggregate.PilotProduct;
import com.maisonamane.domain.pilot.entity.ProductVariant;
import com.maisonamane.domain.pilot.enums.PriceRange;
import com.maisonamane.domain.pilot.enums.ProductCategory;
import com.maisonamane.domain.pilot.enums.ProductStatus;
import com.maisonamane.domain.pilot.enums.ProductType;
import com.maisonamane.domain.pilot.enums.Size;
import com.maisonamane.domain.pilot.enums.ViewType;
import com.maisonamane.domain.pilot.valueobject.*;
import com.maisonamane.infrastructure.persistence.mongodb.document.PilotProductDocument;
import com.maisonamane.infrastructure.persistence.mongodb.document.PilotProductDocument.*;
import java.util.stream.Collectors;

/**
 * Mapper between PilotProduct (domain) and PilotProductDocument (MongoDB).
 * Maps Effect-TS mapper functions to Java static methods.
 */
public final class PilotProductMapper {

    private PilotProductMapper() {
    }

    public static PilotProductDocument toDocument(PilotProduct product) {
        return new PilotProductDocument(
                product.id().value(),
                product.label().value(),
                product.type().name(),
                product.category().name(),
                product.description().value(),
                product.priceRange().name(),
                product.variants().stream().map(PilotProductMapper::variantToDocument).toList(),
                viewsToDocument(product.views()),
                product.status().name(),
                syncStatusToDocument(product.syncStatus()),
                product.createdAt(),
                product.updatedAt());
    }

    public static PilotProduct fromDocument(PilotProductDocument doc) {
        return new PilotProduct(
                ProductId.of(doc.id()),
                ProductLabel.of(doc.label()),
                ProductType.valueOf(doc.type()),
                ProductCategory.valueOf(doc.category()),
                ProductDescription.of(doc.description()),
                PriceRange.valueOf(doc.priceRange()),
                doc.variants().stream().map(PilotProductMapper::variantFromDocument).collect(Collectors.toList()),
                viewsFromDocument(doc.views()),
                ProductStatus.valueOf(doc.status()),
                syncStatusFromDocument(doc.syncStatus()),
                doc.createdAt(),
                doc.updatedAt());
    }

    // Variant mapping

    private static VariantDocument variantToDocument(ProductVariant variant) {
        return switch (variant) {
            case ProductVariant.StandardVariant std -> new VariantDocument(
                    "StandardVariant",
                    std.size().name(),
                    null,
                    null);
            case ProductVariant.CustomVariant custom -> new VariantDocument(
                    "CustomVariant",
                    "CUSTOM",
                    new DimensionsDocument(
                            custom.customDimensions().width().value(),
                            custom.customDimensions().length().value()),
                    custom.price().valueInCentimes());
        };
    }

    private static ProductVariant variantFromDocument(VariantDocument doc) {
        if ("CustomVariant".equals(doc.tag())) {
            return ProductVariant.custom(
                    CustomDimension.of(doc.customDimensions().width(), doc.customDimensions().length()),
                    Price.of(doc.price()));
        }
        return ProductVariant.standard(Size.valueOf(doc.size()));
    }

    // Views mapping

    private static ViewsDocument viewsToDocument(ProductViews views) {
        return new ViewsDocument(
                viewToDocument(views.front()),
                viewToDocument(views.detail()),
                views.additional().stream().map(PilotProductMapper::viewToDocument).toList());
    }

    private static ViewDocument viewToDocument(ProductView view) {
        return new ViewDocument(
                view.viewType().name(),
                view.imageUrl().value());
    }

    private static ProductViews viewsFromDocument(ViewsDocument doc) {
        return ProductViews.of(
                viewFromDocument(doc.front()),
                viewFromDocument(doc.detail()),
                doc.additional().stream().map(PilotProductMapper::viewFromDocument).toList());
    }

    private static ProductView viewFromDocument(ViewDocument doc) {
        return new ProductView(
                ViewType.valueOf(doc.viewType()),
                ImageUrl.of(doc.imageUrl()));
    }

    // SyncStatus mapping

    private static SyncStatusDocument syncStatusToDocument(SyncStatus status) {
        return switch (status) {
            case SyncStatus.NotSynced ignored -> new SyncStatusDocument(
                    "NotSynced", null, null, null, null, null);
            case SyncStatus.Synced synced -> new SyncStatusDocument(
                    "Synced",
                    synced.shopifyProductId().value(),
                    synced.syncedAt(),
                    null, null, null);
            case SyncStatus.SyncFailed failed -> new SyncStatusDocument(
                    "SyncFailed",
                    null, null,
                    new SyncErrorDocument(
                            failed.error().code(),
                            failed.error().message(),
                            failed.error().details()),
                    failed.failedAt(),
                    failed.attempts());
        };
    }

    private static SyncStatus syncStatusFromDocument(SyncStatusDocument doc) {
        return switch (doc.tag()) {
            case "Synced" -> SyncStatus.synced(
                    ShopifyProductId.of(doc.shopifyProductId()),
                    doc.syncedAt());
            case "SyncFailed" -> SyncStatus.syncFailed(
                    SyncError.of(
                            doc.error().code(),
                            doc.error().message(),
                            doc.error().details()),
                    doc.failedAt(),
                    doc.attempts());
            default -> SyncStatus.notSynced();
        };
    }
}
