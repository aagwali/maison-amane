// src/domain/pilot/services/views.service.test.ts
//
// UNIT TESTS: Pure functions, no Effect Layer needed.
// Tests view structuring and flattening transformations.

import { describe, expect, it } from 'vitest'

import { ViewType } from '../enums'
import { MakeImageUrl, type ProductView } from '../value-objects'
import { flattenViews, MIN_VIEWS, structureViews } from './views.service'

// ============================================
// TEST FIXTURES
// ============================================

const makeView = (viewType: ViewType, suffix = ""): ProductView => ({
  viewType,
  imageUrl: MakeImageUrl(`https://cdn.example.com/${viewType.toLowerCase()}${suffix}.jpg`),
})

const frontView = makeView(ViewType.FRONT)
const detailView = makeView(ViewType.DETAIL)
const backView = makeView(ViewType.BACK)
const ambianceView = makeView(ViewType.AMBIANCE)

// ============================================
// CONSTRAINTS
// ============================================

describe("MIN_VIEWS constant", () => {
  it("is defined as 4", () => {
    expect(MIN_VIEWS).toBe(4)
  })
})

// ============================================
// structureViews
// ============================================

describe("structureViews", () => {
  it("extracts front view into dedicated field", () => {
    const views = [frontView, detailView, backView, ambianceView]

    const structured = structureViews(views)

    expect(structured.front).toEqual(frontView)
  })

  it("extracts detail view into dedicated field", () => {
    const views = [frontView, detailView, backView, ambianceView]

    const structured = structureViews(views)

    expect(structured.detail).toEqual(detailView)
  })

  it("puts remaining views into additional array", () => {
    const views = [frontView, detailView, backView, ambianceView]

    const structured = structureViews(views)

    expect(structured.additional).toHaveLength(2)
    expect(structured.additional).toContainEqual(backView)
    expect(structured.additional).toContainEqual(ambianceView)
  })

  it("handles views in any order", () => {
    const views = [ambianceView, backView, detailView, frontView]

    const structured = structureViews(views)

    expect(structured.front).toEqual(frontView)
    expect(structured.detail).toEqual(detailView)
    expect(structured.additional).toHaveLength(2)
  })

  it("handles exactly 2 views (only front and detail)", () => {
    const views = [frontView, detailView]

    const structured = structureViews(views)

    expect(structured.front).toEqual(frontView)
    expect(structured.detail).toEqual(detailView)
    expect(structured.additional).toHaveLength(0)
  })
})

// ============================================
// flattenViews
// ============================================

describe("flattenViews", () => {
  it("returns array with front, detail, then additional views", () => {
    const structured = {
      front: frontView,
      detail: detailView,
      additional: [backView, ambianceView],
    }

    const flattened = flattenViews(structured)

    expect(flattened).toHaveLength(4)
    expect(flattened[0]).toEqual(frontView)
    expect(flattened[1]).toEqual(detailView)
    expect(flattened[2]).toEqual(backView)
    expect(flattened[3]).toEqual(ambianceView)
  })

  it("handles empty additional array", () => {
    const structured = {
      front: frontView,
      detail: detailView,
      additional: [],
    }

    const flattened = flattenViews(structured)

    expect(flattened).toHaveLength(2)
  })
})

// ============================================
// ROUNDTRIP
// ============================================

describe("structureViews <-> flattenViews roundtrip", () => {
  it("preserves data through structure then flatten", () => {
    const views = [frontView, detailView, backView, ambianceView]

    const structured = structureViews(views)
    const flattened = flattenViews(structured)

    // Order may differ (front/detail first after flatten)
    expect(flattened).toHaveLength(views.length)
    expect(flattened).toContainEqual(frontView)
    expect(flattened).toContainEqual(detailView)
    expect(flattened).toContainEqual(backView)
    expect(flattened).toContainEqual(ambianceView)
  })
})
