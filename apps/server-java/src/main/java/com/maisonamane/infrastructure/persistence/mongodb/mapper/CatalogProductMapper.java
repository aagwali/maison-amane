package com.maisonamane.infrastructure.persistence.mongodb.mapper;

import com.maisonamane.domain.catalog.projection.CatalogImages;
import com.maisonamane.domain.catalog.projection.CatalogProduct;
import com.maisonamane.domain.catalog.projection.CatalogVariant;
import com.maisonamane.domain.catalog.projection.CatalogVariant.CatalogDimensions;
import com.maisonamane.domain.pilot.enums.PriceRange;
import com.maisonamane.domain.pilot.enums.ProductCategory;
import com.maisonamane.domain.pilot.valueobject.ImageUrl;
import com.maisonamane.domain.pilot.valueobject.Price;
import com.maisonamane.domain.pilot.valueobject.ProductDescription;
import com.maisonamane.domain.pilot.valueobject.ProductId;
import com.maisonamane.domain.pilot.valueobject.ProductLabel;
import com.maisonamane.infrastructure.persistence.mongodb.document.CatalogProductDocument;
import com.maisonamane.infrastructure.persistence.mongodb.document.CatalogProductDocument.ImagesDoc;
import com.maisonamane.infrastructure.persistence.mongodb.document.CatalogProductDocument.VariantDoc;
import io.vavr.control.Option;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class CatalogProductMapper {

    public CatalogProductDocument toDocument(CatalogProduct product) {
        return new CatalogProductDocument(
                product.id().value(),
                product.label().value(),
                product.description().value(),
                product.category().name(),
                product.priceRange().name(),
                mapVariantsToDoc(product.variants()),
                mapImagesToDoc(product.images()),
                product.shopifyUrl().getOrNull(),
                product.publishedAt());
    }

    public CatalogProduct toDomain(CatalogProductDocument doc) {
        return CatalogProduct.create(
                ProductId.of(doc.id()),
                ProductLabel.of(doc.label()),
                ProductDescription.of(doc.description()),
                ProductCategory.valueOf(doc.category()),
                PriceRange.valueOf(doc.priceRange()),
                mapVariantsToDomain(doc.variants()),
                mapImagesToDomain(doc.images()),
                Option.of(doc.shopifyUrl()),
                doc.publishedAt());
    }

    private List<VariantDoc> mapVariantsToDoc(List<CatalogVariant> variants) {
        return variants.stream().map(this::mapVariantToDoc).toList();
    }

    private VariantDoc mapVariantToDoc(CatalogVariant variant) {
        return switch (variant) {
            case CatalogVariant.StandardVariant std -> new VariantDoc(
                    "StandardVariant", std.size().name(), null, null);
            case CatalogVariant.CustomVariant custom -> new VariantDoc(
                    "CustomVariant",
                    "CUSTOM",
                    Map.of(
                            "width", custom.dimensions().width().value(),
                            "length", custom.dimensions().length().value()),
                    custom.price().valueInCentimes());
        };
    }

    private ImagesDoc mapImagesToDoc(CatalogImages images) {
        return new ImagesDoc(
                images.front().value(),
                images.detail().value(),
                images.gallery().stream().map(ImageUrl::value).toList());
    }

    private List<CatalogVariant> mapVariantsToDomain(List<VariantDoc> variants) {
        return variants.stream().map(this::mapVariantToDomain).toList();
    }

    private CatalogVariant mapVariantToDomain(VariantDoc doc) {
        if ("CustomVariant".equals(doc._tag())) {
            return new CatalogVariant.CustomVariant(
                    CatalogDimensions.of(doc.dimensions().get("width"), doc.dimensions().get("length")),
                    Price.of(doc.price()));
        }
        return new CatalogVariant.StandardVariant(
                com.maisonamane.domain.pilot.enums.Size.valueOf(doc.size()));
    }

    private CatalogImages mapImagesToDomain(ImagesDoc doc) {
        return CatalogImages.of(
                ImageUrl.of(doc.front()),
                ImageUrl.of(doc.detail()),
                doc.gallery().stream().map(ImageUrl::of).toList());
    }
}
