package com.maisonamane.infrastructure.messaging.rabbitmq.mapper;

import com.maisonamane.domain.pilot.aggregate.PilotProduct;
import com.maisonamane.domain.pilot.entity.ProductVariant;
import com.maisonamane.domain.pilot.enums.PriceRange;
import com.maisonamane.domain.pilot.enums.ProductCategory;
import com.maisonamane.domain.pilot.enums.ProductStatus;
import com.maisonamane.domain.pilot.enums.ProductType;
import com.maisonamane.domain.pilot.enums.Size;
import com.maisonamane.domain.pilot.enums.ViewType;
import com.maisonamane.domain.pilot.valueobject.CustomDimension;
import com.maisonamane.domain.pilot.valueobject.ImageUrl;
import com.maisonamane.domain.pilot.valueobject.Price;
import com.maisonamane.domain.pilot.valueobject.ProductDescription;
import com.maisonamane.domain.pilot.valueobject.ProductId;
import com.maisonamane.domain.pilot.valueobject.ProductLabel;
import com.maisonamane.domain.pilot.valueobject.ProductView;
import com.maisonamane.domain.pilot.valueobject.ProductViews;
import com.maisonamane.domain.pilot.valueobject.SyncStatus;
import com.maisonamane.infrastructure.messaging.rabbitmq.dto.PilotProductPublishedMessage.ProductData;
import com.maisonamane.infrastructure.messaging.rabbitmq.dto.PilotProductPublishedMessage.VariantData;
import com.maisonamane.infrastructure.messaging.rabbitmq.dto.PilotProductPublishedMessage.ViewData;
import com.maisonamane.infrastructure.messaging.rabbitmq.dto.PilotProductPublishedMessage.ViewsData;
import com.maisonamane.infrastructure.messaging.rabbitmq.dto.PilotProductPublishedMessage.SyncStatusData;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class MessageToDomainMapper {

    public PilotProduct toDomain(ProductData data) {
        return new PilotProduct(
                ProductId.of(data.getId().getValue()),
                ProductLabel.of(data.getLabel().getValue()),
                ProductType.valueOf(data.getType()),
                ProductCategory.valueOf(data.getCategory()),
                ProductDescription.of(data.getDescription().getValue()),
                PriceRange.valueOf(data.getPriceRange()),
                mapVariants(data.getVariants()),
                mapViews(data.getViews()),
                ProductStatus.valueOf(data.getStatus()),
                mapSyncStatus(data.getSyncStatus()),
                data.getCreatedAt(),
                data.getUpdatedAt());
    }

    private List<ProductVariant> mapVariants(List<VariantData> variants) {
        return variants.stream().map(this::mapVariant).toList();
    }

    private ProductVariant mapVariant(VariantData v) {
        if ("CUSTOM".equals(v.getSize()) && v.getCustomDimensions() != null) {
            var dims = v.getCustomDimensions();
            return ProductVariant.custom(
                    CustomDimension.of(
                            Integer.parseInt(dims.getWidth().getValue()),
                            Integer.parseInt(dims.getLength().getValue())),
                    Price.of(v.getPrice()));
        }
        return ProductVariant.standard(Size.valueOf(v.getSize()));
    }

    private ProductViews mapViews(ViewsData views) {
        var additional = views.getAdditional() != null
                ? views.getAdditional().stream().map(this::mapView).toList()
                : List.<ProductView>of();

        return ProductViews.of(mapView(views.getFront()), mapView(views.getDetail()), additional);
    }

    private ProductView mapView(ViewData v) {
        return new ProductView(
                ViewType.valueOf(v.getViewType()),
                ImageUrl.of(v.getImageUrl().getValue()));
    }

    private SyncStatus mapSyncStatus(SyncStatusData s) {
        if (s == null || "NotSynced".equals(s.get_tag())) {
            return SyncStatus.notSynced();
        }
        // Published products are always NotSynced initially
        return SyncStatus.notSynced();
    }
}
