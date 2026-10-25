

  // ../protocol/src/design-contracts.mjs
  var DESIGN_DOCUMENT_VERSION = "1.0.0";
  function initialFrameHeight(document2) {
    let fixed = document2.frames.flatMap(
      ({ height }) => typeof height == "number" && Number.isInteger(height) ? [height] : []
    );
    return fixed.length ? Math.max(...fixed) : 900;
  }
  var freeze = (value) => {
    if (value && typeof value == "object") {
      for (let nested of Object.values(value)) freeze(nested);
      Object.freeze(value);
    }
    return value;
  }, FRAME_SCHEMA = {
    type: "array",
    minItems: 1,
    items: {
      type: "object",
      additionalProperties: !1,
      required: ["id", "label", "width", "height"],
      properties: {
        id: { $ref: "#/$defs/id" },
        label: { $ref: "#/$defs/text" },
        width: { type: "integer", minimum: 1, maximum: 16384 },
        height: { type: "integer", minimum: 1, maximum: 16384 }
      }
    }
  }, DESIGN_DOCUMENT_V1_SCHEMA = freeze({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://openplanr.dev/schemas/v1.9.0/design-document.schema.json",
    "x-openplanr-contract": { id: "design-document", version: "1.9.0" },
    title: "OpenPlanr authored design document",
    type: "object",
    additionalProperties: !1,
    required: [
      "kind",
      "schemaVersion",
      "id",
      "title",
      "brief",
      "frames",
      "screens",
      "screenOrder",
      "variants",
      "selectedVariant",
      "defaultView"
    ],
    properties: {
      kind: { const: "openplanr-design-document" },
      schemaVersion: { const: DESIGN_DOCUMENT_VERSION },
      id: { $ref: "#/$defs/id" },
      title: { $ref: "#/$defs/text" },
      brief: {
        type: "object",
        additionalProperties: !1,
        required: ["text", "source", "provenance"],
        properties: {
          text: { $ref: "#/$defs/text" },
          source: { enum: ["spec", "png", "describe"] },
          provenance: { enum: ["spec", "inferred"] },
          references: { type: "array", items: { $ref: "#/$defs/text" }, uniqueItems: !0 }
        }
      },
      designSystem: {
        type: "object",
        additionalProperties: !1,
        properties: {
          path: { $ref: "#/$defs/localPath" },
          tokens: { $ref: "#/$defs/localPath" },
          spacing: {
            type: "array",
            minItems: 1,
            uniqueItems: !0,
            items: { type: "number", minimum: 0, maximum: 16384 }
          }
        }
      },
      assets: { $ref: "#/$defs/paths" },
      frames: FRAME_SCHEMA,
      screens: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: !1,
          required: ["id", "title", "source"],
          properties: {
            id: { $ref: "#/$defs/id" },
            title: { $ref: "#/$defs/text" },
            description: { $ref: "#/$defs/text" },
            source: { $ref: "#/$defs/source" },
            anchors: { $ref: "#/$defs/ids" }
          }
        }
      },
      screenOrder: { type: "array", minItems: 1, items: { $ref: "#/$defs/id" }, uniqueItems: !0 },
      flows: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: !1,
          required: ["id", "title", "screens"],
          properties: {
            id: { $ref: "#/$defs/id" },
            title: { $ref: "#/$defs/text" },
            screens: { type: "array", minItems: 1, items: { $ref: "#/$defs/id" } }
          }
        }
      },
      variants: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: !1,
          required: ["id", "label", "status"],
          properties: {
            id: { $ref: "#/$defs/id" },
            label: { $ref: "#/$defs/text" },
            description: { $ref: "#/$defs/text" },
            status: { enum: ["ready", "failed"] },
            issue: { $ref: "#/$defs/text" },
            sources: { type: "object", additionalProperties: { $ref: "#/$defs/source" } }
          },
          if: { properties: { status: { const: "failed" } } },
          then: { required: ["issue"] }
        }
      },
      selectedVariant: { $ref: "#/$defs/id" },
      defaultView: { enum: ["canvas", "prototype", "walkthrough"] }
    },
    $defs: {
      id: { type: "string", minLength: 1, maxLength: 128, pattern: "^[A-Za-z][A-Za-z0-9_-]*$" },
      text: { type: "string", minLength: 1, pattern: "\\S" },
      ids: { type: "array", items: { $ref: "#/$defs/id" }, uniqueItems: !0 },
      localPath: {
        type: "string",
        minLength: 1,
        description: "Path relative to the authored document directory. No URL, traversal, encoded path, query or fragment.",
        pattern: "^(?!/)(?!.*(?:^|/)\\.{1,2}(?:/|$))(?!.*//)(?!.*[/ ]$)[^\\\\:\\u0000-\\u001F%?#]+$"
      },
      paths: { type: "array", items: { $ref: "#/$defs/localPath" }, uniqueItems: !0 },
      source: {
        type: "object",
        additionalProperties: !1,
        required: ["html"],
        properties: {
          html: { $ref: "#/$defs/localPath" },
          styles: { $ref: "#/$defs/paths" },
          scripts: { $ref: "#/$defs/paths" }
        }
      }
    }
  }), DESIGN_DOCUMENT_SCHEMA = freeze({
    ...DESIGN_DOCUMENT_V1_SCHEMA,
    $id: "https://openplanr.dev/schemas/v1.20.0/design-document.schema.json",
    "x-openplanr-contract": { id: "design-document", version: "1.20.0" },
    properties: {
      .../** @type {Record<string, unknown>} */
      DESIGN_DOCUMENT_V1_SCHEMA.properties,
      frames: {
        ...FRAME_SCHEMA,
        items: {
          ...FRAME_SCHEMA.items,
          properties: {
            ...FRAME_SCHEMA.items.properties,
            height: { anyOf: [{ type: "integer", minimum: 1, maximum: 16384 }, { const: "auto" }] }
          }
        }
      },
      layout: {
        type: "object",
        additionalProperties: !1,
        properties: {
          boards: {
            type: "object",
            description: "Keys are screenId, screenId/frameId or screenId/frameId/variantId; each ID must exist in the document.",
            additionalProperties: {
              type: "object",
              additionalProperties: !1,
              required: ["x", "y"],
              properties: {
                x: { $ref: "#/$defs/coordinate" },
                y: { $ref: "#/$defs/coordinate" },
                title: { $ref: "#/$defs/text" }
              }
            }
          },
          sections: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: !1,
              required: ["id", "x", "y", "text"],
              properties: {
                id: { $ref: "#/$defs/id" },
                x: { $ref: "#/$defs/coordinate" },
                y: { $ref: "#/$defs/coordinate" },
                text: { $ref: "#/$defs/text" },
                maxW: { type: "integer", minimum: 1, maximum: 16384 }
              }
            }
          }
        }
      }
    },
    $defs: {
      .../** @type {Record<string, unknown>} */
      DESIGN_DOCUMENT_V1_SCHEMA.$defs,
      coordinate: { type: "number", minimum: -1e7, maximum: 1e7 }
    }
  });