package com.maisonamane.infrastructure.messaging.rabbitmq.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Instant;
import java.util.List;

/**
 * DTO for PilotProductPublished event message from RabbitMQ.
 * Matches the JSON structure serialized by the domain events.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class PilotProductPublishedMessage {

    private ValueWrapper productId;
    private ProductData product;
    private ValueWrapper correlationId;
    private ValueWrapper userId;
    private Instant timestamp;

    public PilotProductPublishedMessage() {}

    public ValueWrapper getProductId() { return productId; }
    public void setProductId(ValueWrapper productId) { this.productId = productId; }
    public ProductData getProduct() { return product; }
    public void setProduct(ProductData product) { this.product = product; }
    public ValueWrapper getCorrelationId() { return correlationId; }
    public void setCorrelationId(ValueWrapper correlationId) { this.correlationId = correlationId; }
    public ValueWrapper getUserId() { return userId; }
    public void setUserId(ValueWrapper userId) { this.userId = userId; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public static class ValueWrapper {
        private String value;
        public ValueWrapper() {}
        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ProductData {
        private ValueWrapper id;
        private ValueWrapper label;
        private String type;
        private String category;
        private ValueWrapper description;
        private String priceRange;
        private List<VariantData> variants;
        private ViewsData views;
        private String status;
        private SyncStatusData syncStatus;
        private Instant createdAt;
        private Instant updatedAt;

        public ProductData() {}
        public ValueWrapper getId() { return id; }
        public void setId(ValueWrapper id) { this.id = id; }
        public ValueWrapper getLabel() { return label; }
        public void setLabel(ValueWrapper label) { this.label = label; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public ValueWrapper getDescription() { return description; }
        public void setDescription(ValueWrapper description) { this.description = description; }
        public String getPriceRange() { return priceRange; }
        public void setPriceRange(String priceRange) { this.priceRange = priceRange; }
        public List<VariantData> getVariants() { return variants; }
        public void setVariants(List<VariantData> variants) { this.variants = variants; }
        public ViewsData getViews() { return views; }
        public void setViews(ViewsData views) { this.views = views; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public SyncStatusData getSyncStatus() { return syncStatus; }
        public void setSyncStatus(SyncStatusData syncStatus) { this.syncStatus = syncStatus; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public Instant getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class VariantData {
        private String size;
        private CustomDimensionsData customDimensions;
        private Integer price;

        public VariantData() {}
        public String getSize() { return size; }
        public void setSize(String size) { this.size = size; }
        public CustomDimensionsData getCustomDimensions() { return customDimensions; }
        public void setCustomDimensions(CustomDimensionsData customDimensions) { this.customDimensions = customDimensions; }
        public Integer getPrice() { return price; }
        public void setPrice(Integer price) { this.price = price; }
    }

    public static class CustomDimensionsData {
        private ValueWrapper width;
        private ValueWrapper length;

        public CustomDimensionsData() {}
        public ValueWrapper getWidth() { return width; }
        public void setWidth(ValueWrapper width) { this.width = width; }
        public ValueWrapper getLength() { return length; }
        public void setLength(ValueWrapper length) { this.length = length; }
    }

    public static class ViewsData {
        private ViewData front;
        private ViewData detail;
        private List<ViewData> additional;

        public ViewsData() {}
        public ViewData getFront() { return front; }
        public void setFront(ViewData front) { this.front = front; }
        public ViewData getDetail() { return detail; }
        public void setDetail(ViewData detail) { this.detail = detail; }
        public List<ViewData> getAdditional() { return additional; }
        public void setAdditional(List<ViewData> additional) { this.additional = additional; }
    }

    public static class ViewData {
        private String viewType;
        private ImageUrlWrapper imageUrl;

        public ViewData() {}
        public String getViewType() { return viewType; }
        public void setViewType(String viewType) { this.viewType = viewType; }
        public ImageUrlWrapper getImageUrl() { return imageUrl; }
        public void setImageUrl(ImageUrlWrapper imageUrl) { this.imageUrl = imageUrl; }
    }

    public static class ImageUrlWrapper {
        private String value;
        public ImageUrlWrapper() {}
        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
    }

    public static class SyncStatusData {
        private String _tag;

        public SyncStatusData() {}
        public String get_tag() { return _tag; }
        public void set_tag(String _tag) { this._tag = _tag; }
    }
}
