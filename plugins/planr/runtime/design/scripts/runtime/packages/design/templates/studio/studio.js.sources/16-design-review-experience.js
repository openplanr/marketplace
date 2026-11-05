

  // lib/design/ui/layout.mjs
  function boardPlacement(design, entry, { layout = design.layout, compare = !1, variantId = design.selectedVariant } = {}) {
    let frame = design.frames.find(({ id }) => id === entry.frameId), variants = compare ? design.variants.filter(({ status }) => status === "ready") : [{ id: variantId }], groupWidth = design.frames.reduce((sum, item) => sum + item.width, 0) + 96 * Math.max(0, design.frames.length - 1) + 160, offset4 = variants.findIndex(({ id }) => id === entry.variantId) * groupWidth + design.frames.slice(0, design.frames.indexOf(frame)).reduce((sum, item) => sum + item.width + 96, 0), screen = design.screens.find(({ id }) => id === entry.screenId), variant = design.variants.find(({ id }) => id === entry.variantId), matches = [
      entry.screenId,
      `${entry.screenId}/${entry.frameId}`,
      `${entry.screenId}/${entry.frameId}/${entry.variantId}`
    ].map(
      (key) => layout?.boards && Object.hasOwn(layout.boards, key) ? layout.boards[key] : void 0
    ), position = matches[2] ?? matches[1] ?? (matches[0] ? { x: matches[0].x + offset4, y: matches[0].y } : {
      x: offset4,
      y: 72 + design.screenOrder.indexOf(entry.screenId) * (initialFrameHeight(design) + 176)
    }), title = [...matches].reverse().find((match) => match?.title)?.title ?? `${screen.title}${design.variants.filter(({ status }) => status === "ready").length > 1 ? ` / ${variant.label}` : ""}`;
    return { x: position.x, y: position.y, title };
  }