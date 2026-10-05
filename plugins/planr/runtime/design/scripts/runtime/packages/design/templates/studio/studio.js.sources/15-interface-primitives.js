

  // ../../node_modules/@radix-ui/react-popper/dist/index.mjs
  var import_jsx_runtime11 = __toESM(require_jsx_runtime(), 1);
  var __defProp21 = Object.defineProperty;
  var __name20 = (target, value) => __defProp21(target, "name", { value, configurable: true });
  var POPPER_NAME = "Popper";
  var [createPopperContext, createPopperScope] = createContextScope(POPPER_NAME);
  var [PopperProvider, usePopperContext] = createPopperContext(POPPER_NAME);
  var Popper = /* @__PURE__ */ __name20((props) => {
    const { __scopePopper, children } = props;
    const [anchor, setAnchor] = React31.useState(null);
    const [placementState, setPlacementState] = React31.useState(void 0);
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
      PopperProvider,
      {
        scope: __scopePopper,
        anchor,
        onAnchorChange: setAnchor,
        placementState,
        setPlacementState,
        children
      }
    );
  }, "Popper");
  var ANCHOR_NAME = "PopperAnchor";
  var PopperAnchor = /* @__PURE__ */ React31.forwardRef(
    /* @__PURE__ */ __name20(function PopperAnchor2(props, forwardedRef) {
      const { __scopePopper, virtualRef, ...anchorProps } = props;
      const context = usePopperContext(ANCHOR_NAME, __scopePopper);
      const ref = React31.useRef(null);
      const onAnchorChange = context.onAnchorChange;
      const callbackRef = React31.useCallback(
        (node) => {
          ref.current = node;
          if (node) {
            onAnchorChange(node);
          }
        },
        [onAnchorChange]
      );
      const composedRefs = useComposedRefs(forwardedRef, callbackRef);
      const anchorRef = React31.useRef(null);
      React31.useEffect(() => {
        if (!virtualRef) {
          return;
        }
        const previousAnchor = anchorRef.current;
        anchorRef.current = virtualRef.current;
        if (previousAnchor !== anchorRef.current) {
          onAnchorChange(anchorRef.current);
        }
      });
      const sideAndAlign = context.placementState && getSideAndAlignFromPlacement(context.placementState);
      const placedSide = sideAndAlign?.[0];
      const placedAlign = sideAndAlign?.[1];
      return virtualRef ? null : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        Primitive.div,
        {
          "data-radix-popper-side": placedSide,
          "data-radix-popper-align": placedAlign,
          ...anchorProps,
          ref: composedRefs
        }
      );
    }, "PopperAnchor")
  );
  var CONTENT_NAME2 = "PopperContent";
  var [PopperContentProvider, useContentContext] = createPopperContext(CONTENT_NAME2);
  var PopperContent = /* @__PURE__ */ React31.forwardRef(
    /* @__PURE__ */ __name20(function PopperContent2(props, forwardedRef) {
      const {
        __scopePopper,
        side = "bottom",
        sideOffset = 0,
        align = "center",
        alignOffset = 0,
        arrowPadding = 0,
        avoidCollisions = true,
        collisionBoundary = [],
        collisionPadding: collisionPaddingProp = 0,
        sticky = "partial",
        hideWhenDetached = false,
        updatePositionStrategy = "optimized",
        onPlaced,
        ...contentProps
      } = props;
      const context = usePopperContext(CONTENT_NAME2, __scopePopper);
      const [content, setContent] = React31.useState(null);
      const composedRefs = useComposedRefs(forwardedRef, setContent);
      const [arrow4, setArrow] = React31.useState(null);
      const arrowSize = useSize(arrow4);
      const arrowWidth = arrowSize?.width ?? 0;
      const arrowHeight = arrowSize?.height ?? 0;
      const desiredPlacement = side + (align !== "center" ? "-" + align : "");
      const collisionPadding = typeof collisionPaddingProp === "number" ? collisionPaddingProp : { top: 0, right: 0, bottom: 0, left: 0, ...collisionPaddingProp };
      const boundary = Array.isArray(collisionBoundary) ? collisionBoundary : [collisionBoundary];
      const hasExplicitBoundaries = boundary.length > 0;
      const detectOverflowOptions = {
        padding: collisionPadding,
        boundary: boundary.filter(isNotNull),
        // with `strategy: 'fixed'`, this is the only way to get it to respect boundaries
        altBoundary: hasExplicitBoundaries
      };
      const { refs, floatingStyles, placement, isPositioned, middlewareData } = useFloating({
        // default to `fixed` strategy so users don't have to pick and we also avoid focus scroll issues
        strategy: "fixed",
        placement: desiredPlacement,
        whileElementsMounted: /* @__PURE__ */ __name20((...args) => {
          const cleanup = autoUpdate(...args, {
            animationFrame: updatePositionStrategy === "always"
          });
          return cleanup;
        }, "whileElementsMounted"),
        elements: {
          reference: context.anchor
        },
        middleware: [
          offset3({ mainAxis: sideOffset + arrowHeight, alignmentAxis: alignOffset }),
          avoidCollisions && shift3({
            mainAxis: true,
            crossAxis: false,
            limiter: sticky === "partial" ? limitShift3() : void 0,
            ...detectOverflowOptions
          }),
          avoidCollisions && flip3({ ...detectOverflowOptions }),
          size3({
            ...detectOverflowOptions,
            apply: /* @__PURE__ */ __name20(({ elements, rects, availableWidth, availableHeight }) => {
              const { width: anchorWidth, height: anchorHeight } = rects.reference;
              const contentStyle = elements.floating.style;
              contentStyle.setProperty("--radix-popper-available-width", `${availableWidth}px`);
              contentStyle.setProperty("--radix-popper-available-height", `${availableHeight}px`);
              contentStyle.setProperty("--radix-popper-anchor-width", `${anchorWidth}px`);
              contentStyle.setProperty("--radix-popper-anchor-height", `${anchorHeight}px`);
            }, "apply")
          }),
          arrow4 && arrow3({ element: arrow4, padding: arrowPadding }),
          transformOrigin({ arrowWidth, arrowHeight }),
          hideWhenDetached && hide3({
            strategy: "referenceHidden",
            ...detectOverflowOptions,
            // `hide` detects whether the anchor (reference) is clipped, so when
            // no explicit `collisionBoundary` is set we fall back to Floating
            // UI's default clipping ancestors (e.g. a scrollable menu). This
            // lets an occluded submenu hide once its anchor scrolls out of view
            // (#3237). The collision/size middlewares deliberately keep the
            // viewport-based default to avoid clamping content rendered inside
            // transformed or overflow-clipping portal containers.
            boundary: hasExplicitBoundaries ? detectOverflowOptions.boundary : void 0
          })
        ]
      });
      const setPlacementState = context.setPlacementState;
      useLayoutEffect2(() => {
        setPlacementState(placement);
        return () => {
          setPlacementState(void 0);
        };
      }, [placement, setPlacementState]);
      const [placedSide, placedAlign] = getSideAndAlignFromPlacement(placement);
      const handlePlaced = useCallbackRef(onPlaced);
      useLayoutEffect2(() => {
        if (isPositioned) {
          handlePlaced?.();
        }
      }, [isPositioned, handlePlaced]);
      const arrowX = middlewareData.arrow?.x;
      const arrowY = middlewareData.arrow?.y;
      const cannotCenterArrow = middlewareData.arrow?.centerOffset !== 0;
      const [contentZIndex, setContentZIndex] = React31.useState();
      useLayoutEffect2(() => {
        if (content) setContentZIndex(window.getComputedStyle(content).zIndex);
      }, [content]);
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        "div",
        {
          ref: refs.setFloating,
          "data-radix-popper-content-wrapper": "",
          style: {
            ...floatingStyles,
            transform: isPositioned ? floatingStyles.transform : "translate(0, -200%)",
            // keep off the page when measuring
            minWidth: "max-content",
            zIndex: contentZIndex,
            "--radix-popper-transform-origin": [
              middlewareData.transformOrigin?.x,
              middlewareData.transformOrigin?.y
            ].join(" "),
            // hide the content if using the hide middleware and should be hidden
            // set visibility to hidden and disable pointer events so the UI behaves
            // as if the PopperContent isn't there at all
            ...middlewareData.hide?.referenceHidden && {
              visibility: "hidden",
              pointerEvents: "none"
            }
          },
          dir: props.dir,
          children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
            PopperContentProvider,
            {
              scope: __scopePopper,
              placedSide,
              placedAlign,
              onArrowChange: setArrow,
              arrowX,
              arrowY,
              shouldHideArrow: cannotCenterArrow,
              children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
                Primitive.div,
                {
                  "data-side": placedSide,
                  "data-align": placedAlign,
                  ...contentProps,
                  ref: composedRefs,
                  style: {
                    ...contentProps.style,
                    // if the PopperContent hasn't been placed yet (not all
                    // measurements done) we prevent animations so that users'
                    // animations don't kick in too early from the wrong sides.
                    animation: !isPositioned ? "none" : contentProps.style?.animation
                  }
                }
              )
            }
          )
        }
      );
    }, "PopperContent")
  );
  var ARROW_NAME = "PopperArrow";
  var OPPOSITE_SIDE = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right"
  };
  var PopperArrow = /* @__PURE__ */ React31.forwardRef(
    /* @__PURE__ */ __name20(function PopperArrow2(props, forwardedRef) {
      const { __scopePopper, ...arrowProps } = props;
      const contentContext = useContentContext(ARROW_NAME, __scopePopper);
      const baseSide = OPPOSITE_SIDE[contentContext.placedSide];
      return (
        // we have to use an extra wrapper because `ResizeObserver` (used by `useSize`)
        // doesn't report size as we'd expect on SVG elements.
        // it reports their bounding box which is effectively the largest path inside the SVG.
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
          "span",
          {
            ref: contentContext.onArrowChange,
            style: {
              position: "absolute",
              left: contentContext.arrowX,
              top: contentContext.arrowY,
              [baseSide]: 0,
              transformOrigin: {
                top: "",
                right: "0 0",
                bottom: "center 0",
                left: "100% 0"
              }[contentContext.placedSide],
              transform: {
                top: "translateY(100%)",
                right: "translateY(50%) rotate(90deg) translateX(-50%)",
                bottom: `rotate(180deg)`,
                left: "translateY(50%) rotate(-90deg) translateX(50%)"
              }[contentContext.placedSide],
              visibility: contentContext.shouldHideArrow ? "hidden" : void 0
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
              Root,
              {
                ...arrowProps,
                ref: forwardedRef,
                style: {
                  ...arrowProps.style,
                  // ensures the element can be measured correctly (mostly for if SVG)
                  display: "block"
                }
              }
            )
          }
        )
      );
    }, "PopperArrow")
  );
  function isNotNull(value) {
    return value !== null;
  }
  __name20(isNotNull, "isNotNull");
  var transformOrigin = /* @__PURE__ */ __name20((options2) => ({
    name: "transformOrigin",
    options: options2,
    fn(data) {
      const { placement, rects, middlewareData } = data;
      const cannotCenterArrow = middlewareData.arrow?.centerOffset !== 0;
      const isArrowHidden = cannotCenterArrow;
      const arrowWidth = isArrowHidden ? 0 : options2.arrowWidth;
      const arrowHeight = isArrowHidden ? 0 : options2.arrowHeight;
      const [placedSide, placedAlign] = getSideAndAlignFromPlacement(placement);
      const noArrowAlign = { start: "0%", center: "50%", end: "100%" }[placedAlign];
      const arrowXCenter = (middlewareData.arrow?.x ?? 0) + arrowWidth / 2;
      const arrowYCenter = (middlewareData.arrow?.y ?? 0) + arrowHeight / 2;
      let x = "";
      let y = "";
      if (placedSide === "bottom") {
        x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`;
        y = `${-arrowHeight}px`;
      } else if (placedSide === "top") {
        x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`;
        y = `${rects.floating.height + arrowHeight}px`;
      } else if (placedSide === "right") {
        x = `${-arrowHeight}px`;
        y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`;
      } else if (placedSide === "left") {
        x = `${rects.floating.width + arrowHeight}px`;
        y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`;
      }
      return { data: { x, y } };
    }
  }), "transformOrigin");
  function getSideAndAlignFromPlacement(placement) {
    const [side, align = "center"] = placement.split("-");
    return [side, align];
  }
  __name20(getSideAndAlignFromPlacement, "getSideAndAlignFromPlacement");
  var Root2 = Popper;
  var Anchor = PopperAnchor;
  var Content = PopperContent;
  var Arrow3 = PopperArrow;

  // ../../node_modules/@radix-ui/react-roving-focus/dist/index.mjs
  var React33 = __toESM(require_react(), 1);

  // ../../node_modules/@radix-ui/react-use-is-hydrated/dist/index.mjs
  var React210 = __toESM(require_react(), 1);
  var React32 = __toESM(require_react(), 1);
  var __defProp22 = Object.defineProperty;
  var __name21 = (target, value) => __defProp22(target, "name", { value, configurable: true });
  var _isHydrated = false;
  function useIsHydrated() {
    const [isHydrated, setIsHydrated] = React32.useState(_isHydrated);
    React32.useEffect(() => {
      if (!_isHydrated) {
        _isHydrated = true;
        setIsHydrated(true);
      }
    }, []);
    return isHydrated;
  }
  __name21(useIsHydrated, "useIsHydrated");
  var useReactSyncExternalStore = React210[" useSyncExternalStore ".trim().toString()];
  function subscribe() {
    return () => {
    };
  }
  __name21(subscribe, "subscribe");
  function useIsHydratedModern() {
    return useReactSyncExternalStore(
      subscribe,
      () => true,
      () => false
    );
  }
  __name21(useIsHydratedModern, "useIsHydratedModern");
  var useIsHydrated2 = typeof useReactSyncExternalStore === "function" ? useIsHydratedModern : useIsHydrated;

  // ../../node_modules/@radix-ui/react-roving-focus/dist/index.mjs
  var import_jsx_runtime12 = __toESM(require_jsx_runtime(), 1);
  var __defProp23 = Object.defineProperty;
  var __name22 = (target, value) => __defProp23(target, "name", { value, configurable: true });
  var ENTRY_FOCUS = "rovingFocusGroup.onEntryFocus";
  var EVENT_OPTIONS2 = { bubbles: false, cancelable: true };
  var GROUP_NAME = "RovingFocusGroup";
  var [Collection, useCollection, createCollectionScope] = createCollection(GROUP_NAME);
  var [createRovingFocusGroupContext, createRovingFocusGroupScope] = createContextScope(
    GROUP_NAME,
    [createCollectionScope]
  );
  var [RovingFocusProvider, useRovingFocusContext] = createRovingFocusGroupContext(GROUP_NAME);
  var RovingFocusGroup = /* @__PURE__ */ React33.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name22(function RovingFocusGroup2(props, forwardedRef) {
      return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Collection.Provider, { scope: props.__scopeRovingFocusGroup, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Collection.Slot, { scope: props.__scopeRovingFocusGroup, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(RovingFocusGroupImpl, { ...props, ref: forwardedRef }) }) });
    }, "RovingFocusGroup")
  );
  var RovingFocusGroupImpl = /* @__PURE__ */ React33.forwardRef(/* @__PURE__ */ __name22(function RovingFocusGroupImpl2(props, forwardedRef) {
    const {
      __scopeRovingFocusGroup,
      orientation,
      loop = false,
      dir,
      currentTabStopId: currentTabStopIdProp,
      defaultCurrentTabStopId,
      onCurrentTabStopIdChange,
      onEntryFocus,
      preventScrollOnEntryFocus = false,
      ...groupProps
    } = props;
    const ref = React33.useRef(null);
    const composedRefs = useComposedRefs(forwardedRef, ref);
    const direction = useDirection(dir);
    const [currentTabStopId, setCurrentTabStopId] = useControllableState({
      prop: currentTabStopIdProp,
      defaultProp: defaultCurrentTabStopId ?? null,
      onChange: onCurrentTabStopIdChange,
      caller: GROUP_NAME
    });
    const [isTabbingBackOut, setIsTabbingBackOut] = React33.useState(false);
    const handleEntryFocus = useCallbackRef(onEntryFocus);
    const getItems = useCollection(__scopeRovingFocusGroup);
    const isClickFocusRef = React33.useRef(false);
    const [focusableItemsCount, setFocusableItemsCount] = React33.useState(0);
    React33.useEffect(() => {
      const node = ref.current;
      if (node) {
        node.addEventListener(ENTRY_FOCUS, handleEntryFocus);
        return () => node.removeEventListener(ENTRY_FOCUS, handleEntryFocus);
      }
    }, [handleEntryFocus]);
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
      RovingFocusProvider,
      {
        scope: __scopeRovingFocusGroup,
        orientation,
        dir: direction,
        loop,
        currentTabStopId,
        onItemFocus: React33.useCallback(
          (tabStopId) => setCurrentTabStopId(tabStopId),
          [setCurrentTabStopId]
        ),
        onItemShiftTab: React33.useCallback(() => setIsTabbingBackOut(true), []),
        onFocusableItemAdd: React33.useCallback(
          () => setFocusableItemsCount((prevCount) => prevCount + 1),
          []
        ),
        onFocusableItemRemove: React33.useCallback(
          () => setFocusableItemsCount((prevCount) => prevCount - 1),
          []
        ),
        children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
          Primitive.div,
          {
            tabIndex: isTabbingBackOut || focusableItemsCount === 0 ? -1 : 0,
            "data-orientation": orientation,
            ...groupProps,
            ref: composedRefs,
            style: { outline: "none", ...props.style },
            onMouseDown: composeEventHandlers(props.onMouseDown, () => {
              isClickFocusRef.current = true;
            }),
            onFocus: composeEventHandlers(props.onFocus, (event) => {
              const isKeyboardFocus = !isClickFocusRef.current;
              if (event.target === event.currentTarget && isKeyboardFocus && !isTabbingBackOut) {
                const entryFocusEvent = new CustomEvent(ENTRY_FOCUS, EVENT_OPTIONS2);
                event.currentTarget.dispatchEvent(entryFocusEvent);
                if (!entryFocusEvent.defaultPrevented) {
                  const items = getItems().filter((item) => item.focusable);
                  const activeItem = items.find((item) => item.active);
                  const currentItem = items.find((item) => item.id === currentTabStopId);
                  const candidateItems = [activeItem, currentItem, ...items].filter(
                    Boolean
                  );
                  const candidateNodes = candidateItems.map((item) => item.ref.current);
                  focusFirst2(candidateNodes, preventScrollOnEntryFocus);
                }
              }
              isClickFocusRef.current = false;
            }),
            onBlur: composeEventHandlers(props.onBlur, () => setIsTabbingBackOut(false))
          }
        )
      }
    );
  }, "RovingFocusGroupImpl"));
  var ITEM_NAME = "RovingFocusGroupItem";
  var RovingFocusGroupItem = /* @__PURE__ */ React33.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name22(function RovingFocusGroupItem2(props, forwardedRef) {
      const {
        __scopeRovingFocusGroup,
        focusable = true,
        active = false,
        tabStopId,
        children,
        ...itemProps
      } = props;
      const autoId = useId();
      const id = tabStopId || autoId;
      const context = useRovingFocusContext(ITEM_NAME, __scopeRovingFocusGroup);
      const isCurrentTabStop = context.currentTabStopId === id;
      const getItems = useCollection(__scopeRovingFocusGroup);
      const { onFocusableItemAdd, onFocusableItemRemove, currentTabStopId } = context;
      const isHydrated = useIsHydrated2();
      useLayoutEffect2(() => {
        if (!isHydrated || !focusable) {
          return;
        }
        onFocusableItemAdd();
        return () => onFocusableItemRemove();
      }, [isHydrated, focusable, onFocusableItemAdd, onFocusableItemRemove]);
      React33.useEffect(() => {
        if (isHydrated || !focusable) {
          return;
        }
        onFocusableItemAdd();
        return () => onFocusableItemRemove();
      }, [isHydrated, focusable, onFocusableItemAdd, onFocusableItemRemove]);
      return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
        Collection.ItemSlot,
        {
          scope: __scopeRovingFocusGroup,
          id,
          focusable,
          active,
          children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
            Primitive.span,
            {
              tabIndex: isCurrentTabStop ? 0 : -1,
              "data-orientation": context.orientation,
              ...itemProps,
              ref: forwardedRef,
              onMouseDown: composeEventHandlers(props.onMouseDown, (event) => {
                if (!focusable) event.preventDefault();
                else context.onItemFocus(id);
              }),
              onFocus: composeEventHandlers(props.onFocus, () => context.onItemFocus(id)),
              onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
                if (event.key === "Tab" && event.shiftKey) {
                  context.onItemShiftTab();
                  return;
                }
                if (event.target !== event.currentTarget) return;
                const focusIntent = getFocusIntent(event, context.orientation, context.dir);
                if (focusIntent !== void 0) {
                  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                  event.preventDefault();
                  const items = getItems().filter((item) => item.focusable);
                  let candidateNodes = items.map((item) => item.ref.current);
                  if (focusIntent === "last") candidateNodes.reverse();
                  else if (focusIntent === "prev" || focusIntent === "next") {
                    if (focusIntent === "prev") candidateNodes.reverse();
                    const currentIndex = candidateNodes.indexOf(event.currentTarget);
                    candidateNodes = context.loop ? wrapArray(candidateNodes, currentIndex + 1) : candidateNodes.slice(currentIndex + 1);
                  }
                  setTimeout(() => focusFirst2(candidateNodes));
                }
              }),
              children: typeof children === "function" ? children({ isCurrentTabStop, hasTabStop: currentTabStopId != null }) : children
            }
          )
        }
      );
    }, "RovingFocusGroupItem")
  );
  var MAP_KEY_TO_FOCUS_INTENT = {
    ArrowLeft: "prev",
    ArrowUp: "prev",
    ArrowRight: "next",
    ArrowDown: "next",
    PageUp: "first",
    Home: "first",
    PageDown: "last",
    End: "last"
  };
  function getDirectionAwareKey(key, dir) {
    if (dir !== "rtl") return key;
    return key === "ArrowLeft" ? "ArrowRight" : key === "ArrowRight" ? "ArrowLeft" : key;
  }
  __name22(getDirectionAwareKey, "getDirectionAwareKey");
  function getFocusIntent(event, orientation, dir) {
    const key = getDirectionAwareKey(event.key, dir);
    if (orientation === "vertical" && ["ArrowLeft", "ArrowRight"].includes(key)) return void 0;
    if (orientation === "horizontal" && ["ArrowUp", "ArrowDown"].includes(key)) return void 0;
    return MAP_KEY_TO_FOCUS_INTENT[key];
  }
  __name22(getFocusIntent, "getFocusIntent");
  function focusFirst2(candidates, preventScroll = false) {
    const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
    for (const candidate of candidates) {
      if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
      candidate.focus({ preventScroll });
      if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
    }
  }
  __name22(focusFirst2, "focusFirst");
  function wrapArray(array, startIndex) {
    return array.map((_, index2) => array[(startIndex + index2) % array.length]);
  }
  __name22(wrapArray, "wrapArray");
  var Root3 = RovingFocusGroup;
  var Item = RovingFocusGroupItem;

  // ../../node_modules/@radix-ui/react-menu/dist/index.mjs
  var import_jsx_runtime13 = __toESM(require_jsx_runtime(), 1);
  var __defProp24 = Object.defineProperty;
  var __name23 = (target, value) => __defProp24(target, "name", { value, configurable: true });
  var SELECTION_KEYS = ["Enter", " "];
  var FIRST_KEYS = ["ArrowDown", "PageUp", "Home"];
  var LAST_KEYS = ["ArrowUp", "PageDown", "End"];
  var FIRST_LAST_KEYS = [...FIRST_KEYS, ...LAST_KEYS];
  var SUB_OPEN_KEYS = {
    ltr: [...SELECTION_KEYS, "ArrowRight"],
    rtl: [...SELECTION_KEYS, "ArrowLeft"]
  };
  var SUB_CLOSE_KEYS = {
    ltr: ["ArrowLeft"],
    rtl: ["ArrowRight"]
  };
  var MENU_NAME = "Menu";
  var [Collection2, useCollection2, createCollectionScope2] = createCollection(MENU_NAME);
  var [createMenuContext, createMenuScope] = createContextScope(MENU_NAME, [
    createCollectionScope2,
    createPopperScope,
    createRovingFocusGroupScope
  ]);
  var usePopperScope = createPopperScope();
  var useRovingFocusGroupScope = createRovingFocusGroupScope();
  var [MenuProvider, useMenuContext] = createMenuContext(MENU_NAME);
  var [MenuRootProvider, useMenuRootContext] = createMenuContext(MENU_NAME);
  var Menu = /* @__PURE__ */ __name23((props) => {
    const { __scopeMenu, open = false, children, dir, onOpenChange, modal = true } = props;
    const popperScope = usePopperScope(__scopeMenu);
    const [content, setContent] = React34.useState(null);
    const isUsingKeyboardRef = React34.useRef(false);
    const handleOpenChange = useCallbackRef(onOpenChange);
    const direction = useDirection(dir);
    React34.useEffect(() => {
      const handleKeyDown = /* @__PURE__ */ __name23(() => {
        isUsingKeyboardRef.current = true;
        document.addEventListener("pointerdown", handlePointer, { capture: true, once: true });
        document.addEventListener("pointermove", handlePointer, { capture: true, once: true });
      }, "handleKeyDown");
      const handlePointer = /* @__PURE__ */ __name23(() => isUsingKeyboardRef.current = false, "handlePointer");
      document.addEventListener("keydown", handleKeyDown, { capture: true });
      return () => {
        document.removeEventListener("keydown", handleKeyDown, { capture: true });
        document.removeEventListener("pointerdown", handlePointer, { capture: true });
        document.removeEventListener("pointermove", handlePointer, { capture: true });
      };
    }, []);
    React34.useEffect(() => {
      if (!open) {
        return;
      }
      const handleBlur = /* @__PURE__ */ __name23(() => handleOpenChange(false), "handleBlur");
      window.addEventListener("blur", handleBlur);
      return () => window.removeEventListener("blur", handleBlur);
    }, [open, handleOpenChange]);
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Root2, { ...popperScope, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
      MenuProvider,
      {
        scope: __scopeMenu,
        open,
        onOpenChange: handleOpenChange,
        content,
        onContentChange: setContent,
        children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
          MenuRootProvider,
          {
            scope: __scopeMenu,
            onClose: React34.useCallback(() => handleOpenChange(false), [handleOpenChange]),
            isUsingKeyboardRef,
            dir: direction,
            modal,
            children
          }
        )
      }
    ) });
  }, "Menu");
  var MenuAnchor = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function MenuAnchor2(props, forwardedRef) {
      const { __scopeMenu, ...anchorProps } = props;
      const popperScope = usePopperScope(__scopeMenu);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Anchor, { ...popperScope, ...anchorProps, ref: forwardedRef });
    }, "MenuAnchor")
  );
  var PORTAL_NAME2 = "MenuPortal";
  var [PortalProvider2, usePortalContext2] = createMenuContext(PORTAL_NAME2, {
    forceMount: void 0
  });
  var MenuPortal = /* @__PURE__ */ __name23((props) => {
    const { __scopeMenu, forceMount, children, container } = props;
    const context = useMenuContext(PORTAL_NAME2, __scopeMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(PortalProvider2, { scope: __scopeMenu, forceMount, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Presence, { present: forceMount || context.open, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Portal, { asChild: true, container, children }) }) });
  }, "MenuPortal");
  var CONTENT_NAME3 = "MenuContent";
  var [MenuContentProvider, useMenuContentContext] = createMenuContext(CONTENT_NAME3);
  var MenuContent = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function MenuContent2(props, forwardedRef) {
      const portalContext = usePortalContext2(CONTENT_NAME3, props.__scopeMenu);
      const { forceMount = portalContext.forceMount, ...contentProps } = props;
      const context = useMenuContext(CONTENT_NAME3, props.__scopeMenu);
      const rootContext = useMenuRootContext(CONTENT_NAME3, props.__scopeMenu);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Collection2.Provider, { scope: props.__scopeMenu, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Presence, { present: forceMount || context.open, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Collection2.Slot, { scope: props.__scopeMenu, children: rootContext.modal ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(MenuRootContentModal, { ...contentProps, ref: forwardedRef }) : /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(MenuRootContentNonModal, { ...contentProps, ref: forwardedRef }) }) }) });
    }, "MenuContent")
  );
  var MenuRootContentModal = /* @__PURE__ */ React34.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name23(function MenuRootContentModal2(props, forwardedRef) {
      const context = useMenuContext(CONTENT_NAME3, props.__scopeMenu);
      const ref = React34.useRef(null);
      const composedRefs = useComposedRefs(forwardedRef, ref);
      React34.useEffect(() => {
        const content = ref.current;
        if (content) return hideOthers(content);
      }, []);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        MenuContentImpl,
        {
          ...props,
          ref: composedRefs,
          trapFocus: context.open,
          disableOutsidePointerEvents: context.open,
          disableOutsideScroll: true,
          onFocusOutside: composeEventHandlers(
            props.onFocusOutside,
            (event) => event.preventDefault(),
            { checkForDefaultPrevented: false }
          ),
          onDismiss: () => context.onOpenChange(false)
        }
      );
    }, "MenuRootContentModal")
  );
  var MenuRootContentNonModal = /* @__PURE__ */ React34.forwardRef(/* @__PURE__ */ __name23(function MenuRootContentNonModal2(props, forwardedRef) {
    const context = useMenuContext(CONTENT_NAME3, props.__scopeMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
      MenuContentImpl,
      {
        ...props,
        ref: forwardedRef,
        trapFocus: false,
        disableOutsidePointerEvents: false,
        disableOutsideScroll: false,
        onDismiss: () => context.onOpenChange(false)
      }
    );
  }, "MenuRootContentNonModal"));
  var Slot2 = createSlot("MenuContent.ScrollLock");
  var MenuContentImpl = /* @__PURE__ */ React34.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name23(function MenuContentImpl2(props, forwardedRef) {
      const {
        __scopeMenu,
        loop = false,
        trapFocus,
        onOpenAutoFocus,
        onCloseAutoFocus,
        disableOutsidePointerEvents,
        onEntryFocus,
        onEscapeKeyDown,
        onPointerDownOutside,
        onFocusOutside,
        onInteractOutside,
        onDismiss,
        disableOutsideScroll,
        ...contentProps
      } = props;
      const context = useMenuContext(CONTENT_NAME3, __scopeMenu);
      const rootContext = useMenuRootContext(CONTENT_NAME3, __scopeMenu);
      const popperScope = usePopperScope(__scopeMenu);
      const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeMenu);
      const getItems = useCollection2(__scopeMenu);
      const [currentItemId, setCurrentItemId] = React34.useState(null);
      const contentRef = React34.useRef(null);
      const composedRefs = useComposedRefs(forwardedRef, contentRef, context.onContentChange);
      const timerRef = React34.useRef(0);
      const searchRef = React34.useRef("");
      const pointerGraceTimerRef = React34.useRef(0);
      const pointerGraceIntentRef = React34.useRef(null);
      const pointerDirRef = React34.useRef("right");
      const lastPointerXRef = React34.useRef(0);
      const ScrollLockWrapper = disableOutsideScroll ? Combination_default : React34.Fragment;
      const scrollLockWrapperProps = disableOutsideScroll ? { as: Slot2, allowPinchZoom: true } : void 0;
      const handleTypeaheadSearch = /* @__PURE__ */ __name23((key) => {
        const search = searchRef.current + key;
        const items = getItems().filter((item) => !item.disabled);
        const currentItem = document.activeElement;
        const currentMatch = items.find((item) => item.ref.current === currentItem)?.textValue;
        const values = items.map((item) => item.textValue);
        const nextMatch = getNextMatch(values, search, currentMatch);
        const newItem = items.find((item) => item.textValue === nextMatch)?.ref.current;
        (/* @__PURE__ */ __name23((function updateSearch(value) {
          searchRef.current = value;
          window.clearTimeout(timerRef.current);
          if (value !== "") timerRef.current = window.setTimeout(() => updateSearch(""), 1e3);
        }), "updateSearch"))(search);
        if (newItem) {
          setTimeout(() => newItem.focus());
        }
      }, "handleTypeaheadSearch");
      React34.useEffect(() => {
        return () => window.clearTimeout(timerRef.current);
      }, []);
      useFocusGuards();
      const isPointerMovingToSubmenu = React34.useCallback((event) => {
        const isMovingTowards = pointerDirRef.current === pointerGraceIntentRef.current?.side;
        return isMovingTowards && isPointerInGraceArea(event, pointerGraceIntentRef.current?.area);
      }, []);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        MenuContentProvider,
        {
          scope: __scopeMenu,
          searchRef,
          onItemEnter: React34.useCallback(
            (event) => {
              if (isPointerMovingToSubmenu(event)) event.preventDefault();
            },
            [isPointerMovingToSubmenu]
          ),
          onItemLeave: React34.useCallback(
            (event) => {
              if (isPointerMovingToSubmenu(event)) return;
              contentRef.current?.focus();
              setCurrentItemId(null);
            },
            [isPointerMovingToSubmenu]
          ),
          onTriggerLeave: React34.useCallback(
            (event) => {
              if (isPointerMovingToSubmenu(event)) event.preventDefault();
            },
            [isPointerMovingToSubmenu]
          ),
          pointerGraceTimerRef,
          onPointerGraceIntentChange: React34.useCallback((intent) => {
            pointerGraceIntentRef.current = intent;
          }, []),
          children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(ScrollLockWrapper, { ...scrollLockWrapperProps, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
            FocusScope,
            {
              asChild: true,
              trapped: trapFocus,
              onMountAutoFocus: composeEventHandlers(onOpenAutoFocus, (event) => {
                event.preventDefault();
                contentRef.current?.focus({ preventScroll: true });
              }),
              onUnmountAutoFocus: onCloseAutoFocus,
              children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
                DismissableLayer,
                {
                  asChild: true,
                  disableOutsidePointerEvents,
                  onEscapeKeyDown,
                  onPointerDownOutside,
                  onFocusOutside,
                  onInteractOutside,
                  onDismiss,
                  children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
                    Root3,
                    {
                      asChild: true,
                      ...rovingFocusGroupScope,
                      dir: rootContext.dir,
                      orientation: "vertical",
                      loop,
                      currentTabStopId: currentItemId,
                      onCurrentTabStopIdChange: setCurrentItemId,
                      onEntryFocus: composeEventHandlers(onEntryFocus, (event) => {
                        if (!rootContext.isUsingKeyboardRef.current) event.preventDefault();
                      }),
                      preventScrollOnEntryFocus: true,
                      children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
                        Content,
                        {
                          role: "menu",
                          "aria-orientation": "vertical",
                          "data-state": getOpenState(context.open),
                          "data-radix-menu-content": "",
                          dir: rootContext.dir,
                          ...popperScope,
                          ...contentProps,
                          ref: composedRefs,
                          style: { outline: "none", ...contentProps.style },
                          onKeyDown: composeEventHandlers(contentProps.onKeyDown, (event) => {
                            const target = event.target;
                            const isKeyDownInside = target.closest("[data-radix-menu-content]") === event.currentTarget;
                            const isModifierKey = event.ctrlKey || event.altKey || event.metaKey;
                            const isCharacterKey = event.key.length === 1;
                            if (isKeyDownInside) {
                              if (event.key === "Tab") event.preventDefault();
                              if (!isModifierKey && isCharacterKey) handleTypeaheadSearch(event.key);
                            }
                            const content = contentRef.current;
                            if (event.target !== content) return;
                            if (!FIRST_LAST_KEYS.includes(event.key)) return;
                            event.preventDefault();
                            const items = getItems().filter((item) => !item.disabled);
                            const candidateNodes = items.map((item) => item.ref.current);
                            if (LAST_KEYS.includes(event.key)) candidateNodes.reverse();
                            focusFirst3(candidateNodes);
                          }),
                          onBlur: composeEventHandlers(props.onBlur, (event) => {
                            if (!event.currentTarget.contains(event.target)) {
                              window.clearTimeout(timerRef.current);
                              searchRef.current = "";
                            }
                          }),
                          onPointerMove: composeEventHandlers(
                            props.onPointerMove,
                            whenMouse((event) => {
                              const target = event.target;
                              const pointerXHasChanged = lastPointerXRef.current !== event.clientX;
                              if (event.currentTarget.contains(target) && pointerXHasChanged) {
                                const newDir = event.clientX > lastPointerXRef.current ? "right" : "left";
                                pointerDirRef.current = newDir;
                                lastPointerXRef.current = event.clientX;
                              }
                            })
                          )
                        }
                      )
                    }
                  )
                }
              )
            }
          ) })
        }
      );
    }, "MenuContentImpl")
  );
  var MenuGroup = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function MenuGroup2(props, forwardedRef) {
      const { __scopeMenu, ...groupProps } = props;
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Primitive.div, { role: "group", ...groupProps, ref: forwardedRef });
    }, "MenuGroup")
  );
  var MenuLabel = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function MenuLabel2(props, forwardedRef) {
      const { __scopeMenu, ...labelProps } = props;
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Primitive.div, { ...labelProps, ref: forwardedRef });
    }, "MenuLabel")
  );
  var ITEM_NAME2 = "MenuItem";
  var ITEM_SELECT = "menu.itemSelect";
  var MenuItem = /* @__PURE__ */ React34.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name23(function MenuItem2(props, forwardedRef) {
      const { disabled = false, onSelect, ...itemProps } = props;
      const ref = React34.useRef(null);
      const rootContext = useMenuRootContext(ITEM_NAME2, props.__scopeMenu);
      const contentContext = useMenuContentContext(ITEM_NAME2, props.__scopeMenu);
      const composedRefs = useComposedRefs(forwardedRef, ref);
      const isPointerDownRef = React34.useRef(false);
      const handleSelect = /* @__PURE__ */ __name23(() => {
        const menuItem = ref.current;
        if (!disabled && menuItem) {
          const itemSelectEvent = new CustomEvent(ITEM_SELECT, { bubbles: true, cancelable: true });
          menuItem.addEventListener(ITEM_SELECT, (event) => onSelect?.(event), { once: true });
          dispatchDiscreteCustomEvent(menuItem, itemSelectEvent);
          if (itemSelectEvent.defaultPrevented) {
            isPointerDownRef.current = false;
          } else {
            rootContext.onClose();
          }
        }
      }, "handleSelect");
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        MenuItemImpl,
        {
          ...itemProps,
          ref: composedRefs,
          disabled,
          onClick: composeEventHandlers(props.onClick, handleSelect),
          onPointerDown: (event) => {
            props.onPointerDown?.(event);
            isPointerDownRef.current = true;
          },
          onPointerUp: composeEventHandlers(props.onPointerUp, (event) => {
            if (!isPointerDownRef.current) event.currentTarget?.click();
          }),
          onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
            if (disabled || event.target !== event.currentTarget) {
              return;
            }
            const isTypingAhead = contentContext.searchRef.current !== "";
            if (isTypingAhead && event.key === " ") {
              return;
            }
            if (SELECTION_KEYS.includes(event.key)) {
              event.currentTarget.click();
              event.preventDefault();
            }
          })
        }
      );
    }, "MenuItem")
  );
  var MenuItemImpl = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function MenuItemImpl2(props, forwardedRef) {
      const { __scopeMenu, disabled = false, textValue, ...itemProps } = props;
      const contentContext = useMenuContentContext(ITEM_NAME2, __scopeMenu);
      const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeMenu);
      const ref = React34.useRef(null);
      const composedRefs = useComposedRefs(forwardedRef, ref);
      const [isFocused, setIsFocused] = React34.useState(false);
      const [textContent, setTextContent] = React34.useState("");
      React34.useEffect(() => {
        const menuItem = ref.current;
        if (menuItem) {
          setTextContent((menuItem.textContent ?? "").trim());
        }
      }, [itemProps.children]);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        Collection2.ItemSlot,
        {
          scope: __scopeMenu,
          disabled,
          textValue: textValue ?? textContent,
          children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Item, { asChild: true, ...rovingFocusGroupScope, focusable: !disabled, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
            Primitive.div,
            {
              role: "menuitem",
              "data-highlighted": isFocused ? "" : void 0,
              "aria-disabled": disabled || void 0,
              "data-disabled": disabled ? "" : void 0,
              ...itemProps,
              ref: composedRefs,
              onPointerMove: composeEventHandlers(
                props.onPointerMove,
                whenMouse((event) => {
                  if (disabled) {
                    contentContext.onItemLeave(event);
                  } else {
                    contentContext.onItemEnter(event);
                    if (!event.defaultPrevented) {
                      const item = event.currentTarget;
                      item.focus({ preventScroll: true });
                    }
                  }
                })
              ),
              onPointerLeave: composeEventHandlers(
                props.onPointerLeave,
                whenMouse((event) => contentContext.onItemLeave(event))
              ),
              onFocus: composeEventHandlers(props.onFocus, () => setIsFocused(true)),
              onBlur: composeEventHandlers(props.onBlur, () => setIsFocused(false))
            }
          ) })
        }
      );
    }, "MenuItemImpl")
  );
  var MenuCheckboxItem = /* @__PURE__ */ React34.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name23(function MenuCheckboxItem2(props, forwardedRef) {
      const { checked = false, onCheckedChange, ...checkboxItemProps } = props;
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(ItemIndicatorProvider, { scope: props.__scopeMenu, checked, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        MenuItem,
        {
          role: "menuitemcheckbox",
          "aria-checked": isIndeterminate(checked) ? "mixed" : checked,
          ...checkboxItemProps,
          ref: forwardedRef,
          "data-state": getCheckedState(checked),
          onSelect: composeEventHandlers(
            checkboxItemProps.onSelect,
            () => onCheckedChange?.(isIndeterminate(checked) ? true : !checked),
            { checkForDefaultPrevented: false }
          )
        }
      ) });
    }, "MenuCheckboxItem")
  );
  var RADIO_GROUP_NAME = "MenuRadioGroup";
  var [RadioGroupProvider, useRadioGroupContext] = createMenuContext(
    RADIO_GROUP_NAME,
    { value: void 0, onValueChange: /* @__PURE__ */ __name23(() => {
    }, "onValueChange") }
  );
  var MenuRadioGroup = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function MenuRadioGroup2(props, forwardedRef) {
      const { value, onValueChange, ...groupProps } = props;
      const handleValueChange = useCallbackRef(onValueChange);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(RadioGroupProvider, { scope: props.__scopeMenu, value, onValueChange: handleValueChange, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(MenuGroup, { ...groupProps, ref: forwardedRef }) });
    }, "MenuRadioGroup")
  );
  var RADIO_ITEM_NAME = "MenuRadioItem";
  var MenuRadioItem = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function MenuRadioItem2(props, forwardedRef) {
      const { value, ...radioItemProps } = props;
      const context = useRadioGroupContext(RADIO_ITEM_NAME, props.__scopeMenu);
      const checked = value === context.value;
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(ItemIndicatorProvider, { scope: props.__scopeMenu, checked, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        MenuItem,
        {
          role: "menuitemradio",
          "aria-checked": checked,
          ...radioItemProps,
          ref: forwardedRef,
          "data-state": getCheckedState(checked),
          onSelect: composeEventHandlers(
            radioItemProps.onSelect,
            () => context.onValueChange?.(value),
            { checkForDefaultPrevented: false }
          )
        }
      ) });
    }, "MenuRadioItem")
  );
  var ITEM_INDICATOR_NAME = "MenuItemIndicator";
  var [ItemIndicatorProvider, useItemIndicatorContext] = createMenuContext(
    ITEM_INDICATOR_NAME,
    { checked: false }
  );
  var MenuItemIndicator = /* @__PURE__ */ React34.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name23(function MenuItemIndicator2(props, forwardedRef) {
      const { __scopeMenu, forceMount, ...itemIndicatorProps } = props;
      const indicatorContext = useItemIndicatorContext(ITEM_INDICATOR_NAME, __scopeMenu);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        Presence,
        {
          present: forceMount || isIndeterminate(indicatorContext.checked) || indicatorContext.checked === true,
          children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
            Primitive.span,
            {
              ...itemIndicatorProps,
              ref: forwardedRef,
              "data-state": getCheckedState(indicatorContext.checked)
            }
          )
        }
      );
    }, "MenuItemIndicator")
  );
  var MenuSeparator = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function MenuSeparator2(props, forwardedRef) {
      const { __scopeMenu, ...separatorProps } = props;
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        Primitive.div,
        {
          role: "separator",
          "aria-orientation": "horizontal",
          ...separatorProps,
          ref: forwardedRef
        }
      );
    }, "MenuSeparator")
  );
  var MenuArrow = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function MenuArrow2(props, forwardedRef) {
      const { __scopeMenu, ...arrowProps } = props;
      const popperScope = usePopperScope(__scopeMenu);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Arrow3, { ...popperScope, ...arrowProps, ref: forwardedRef });
    }, "MenuArrow")
  );
  var SUB_NAME = "MenuSub";
  var [MenuSubProvider, useMenuSubContext] = createMenuContext(SUB_NAME);
  var MenuSub = /* @__PURE__ */ __name23((props) => {
    const { __scopeMenu, children, open = false, onOpenChange } = props;
    const parentMenuContext = useMenuContext(SUB_NAME, __scopeMenu);
    const popperScope = usePopperScope(__scopeMenu);
    const [trigger, setTrigger] = React34.useState(null);
    const [content, setContent] = React34.useState(null);
    const handleOpenChange = useCallbackRef(onOpenChange);
    React34.useEffect(() => {
      if (parentMenuContext.open === false) handleOpenChange(false);
      return () => handleOpenChange(false);
    }, [parentMenuContext.open, handleOpenChange]);
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Root2, { ...popperScope, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
      MenuProvider,
      {
        scope: __scopeMenu,
        open,
        onOpenChange: handleOpenChange,
        content,
        onContentChange: setContent,
        children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
          MenuSubProvider,
          {
            scope: __scopeMenu,
            contentId: useId(),
            triggerId: useId(),
            trigger,
            onTriggerChange: setTrigger,
            children
          }
        )
      }
    ) });
  }, "MenuSub");
  var SUB_TRIGGER_NAME = "MenuSubTrigger";
  var MenuSubTrigger = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function MenuSubTrigger2(props, forwardedRef) {
      const context = useMenuContext(SUB_TRIGGER_NAME, props.__scopeMenu);
      const rootContext = useMenuRootContext(SUB_TRIGGER_NAME, props.__scopeMenu);
      const subContext = useMenuSubContext(SUB_TRIGGER_NAME, props.__scopeMenu);
      const contentContext = useMenuContentContext(SUB_TRIGGER_NAME, props.__scopeMenu);
      const openTimerRef = React34.useRef(null);
      const { pointerGraceTimerRef, onPointerGraceIntentChange } = contentContext;
      const scope = { __scopeMenu: props.__scopeMenu };
      const clearOpenTimer = React34.useCallback(() => {
        if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }, []);
      React34.useEffect(() => clearOpenTimer, [clearOpenTimer]);
      React34.useEffect(() => {
        const pointerGraceTimer = pointerGraceTimerRef.current;
        return () => {
          window.clearTimeout(pointerGraceTimer);
          onPointerGraceIntentChange(null);
        };
      }, [pointerGraceTimerRef, onPointerGraceIntentChange]);
      const composedRefs = useComposedRefs(forwardedRef, subContext.onTriggerChange);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(MenuAnchor, { asChild: true, ...scope, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        MenuItemImpl,
        {
          id: subContext.triggerId,
          "aria-haspopup": "menu",
          "aria-expanded": context.open,
          "aria-controls": context.open ? subContext.contentId : void 0,
          "data-state": getOpenState(context.open),
          ...props,
          ref: composedRefs,
          onClick: (event) => {
            props.onClick?.(event);
            if (props.disabled || event.defaultPrevented) return;
            event.currentTarget.focus();
            if (!context.open) context.onOpenChange(true);
          },
          onPointerMove: composeEventHandlers(
            props.onPointerMove,
            whenMouse((event) => {
              contentContext.onItemEnter(event);
              if (event.defaultPrevented) return;
              if (!props.disabled && !context.open && !openTimerRef.current) {
                contentContext.onPointerGraceIntentChange(null);
                openTimerRef.current = window.setTimeout(() => {
                  context.onOpenChange(true);
                  clearOpenTimer();
                }, 100);
              }
            })
          ),
          onPointerLeave: composeEventHandlers(
            props.onPointerLeave,
            whenMouse((event) => {
              clearOpenTimer();
              const contentRect = context.content?.getBoundingClientRect();
              if (contentRect) {
                const side = context.content?.dataset.side;
                const rightSide = side === "right";
                const bleed = rightSide ? -5 : 5;
                const contentNearEdge = contentRect[rightSide ? "left" : "right"];
                const contentFarEdge = contentRect[rightSide ? "right" : "left"];
                contentContext.onPointerGraceIntentChange({
                  area: [
                    // Apply a bleed on clientX to ensure that our exit point is
                    // consistently within polygon bounds
                    { x: event.clientX + bleed, y: event.clientY },
                    { x: contentNearEdge, y: contentRect.top },
                    { x: contentFarEdge, y: contentRect.top },
                    { x: contentFarEdge, y: contentRect.bottom },
                    { x: contentNearEdge, y: contentRect.bottom }
                  ],
                  side
                });
                window.clearTimeout(pointerGraceTimerRef.current);
                pointerGraceTimerRef.current = window.setTimeout(
                  () => contentContext.onPointerGraceIntentChange(null),
                  300
                );
              } else {
                contentContext.onTriggerLeave(event);
                if (event.defaultPrevented) return;
                contentContext.onPointerGraceIntentChange(null);
              }
            })
          ),
          onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
            if (props.disabled || event.target !== event.currentTarget) {
              return;
            }
            const isTypingAhead = contentContext.searchRef.current !== "";
            if (isTypingAhead && event.key === " ") {
              return;
            }
            if (SUB_OPEN_KEYS[rootContext.dir].includes(event.key)) {
              context.onOpenChange(true);
              context.content?.focus();
              event.preventDefault();
            }
          })
        }
      ) });
    }, "MenuSubTrigger")
  );
  var SUB_CONTENT_NAME = "MenuSubContent";
  var MenuSubContent = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function MenuSubContent2(props, forwardedRef) {
      const portalContext = usePortalContext2(CONTENT_NAME3, props.__scopeMenu);
      const { forceMount = portalContext.forceMount, align = "start", ...subContentProps } = props;
      const context = useMenuContext(CONTENT_NAME3, props.__scopeMenu);
      const rootContext = useMenuRootContext(CONTENT_NAME3, props.__scopeMenu);
      const subContext = useMenuSubContext(SUB_CONTENT_NAME, props.__scopeMenu);
      const ref = React34.useRef(null);
      const composedRefs = useComposedRefs(forwardedRef, ref);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Collection2.Provider, { scope: props.__scopeMenu, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Presence, { present: forceMount || context.open, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Collection2.Slot, { scope: props.__scopeMenu, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        MenuContentImpl,
        {
          id: subContext.contentId,
          "aria-labelledby": subContext.triggerId,
          ...subContentProps,
          ref: composedRefs,
          align,
          side: rootContext.dir === "rtl" ? "left" : "right",
          disableOutsidePointerEvents: false,
          disableOutsideScroll: false,
          trapFocus: false,
          onOpenAutoFocus: (event) => {
            if (rootContext.isUsingKeyboardRef.current) ref.current?.focus();
            event.preventDefault();
          },
          onCloseAutoFocus: (event) => event.preventDefault(),
          onFocusOutside: composeEventHandlers(props.onFocusOutside, (event) => {
            if (event.target !== subContext.trigger) context.onOpenChange(false);
          }),
          onEscapeKeyDown: composeEventHandlers(props.onEscapeKeyDown, (event) => {
            rootContext.onClose();
            event.preventDefault();
          }),
          onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
            const isKeyDownInside = event.currentTarget.contains(event.target);
            const isCloseKey = SUB_CLOSE_KEYS[rootContext.dir].includes(event.key);
            if (isKeyDownInside && isCloseKey) {
              context.onOpenChange(false);
              subContext.trigger?.focus();
              event.preventDefault();
            }
          })
        }
      ) }) }) });
    }, "MenuSubContent")
  );
  function getOpenState(open) {
    return open ? "open" : "closed";
  }
  __name23(getOpenState, "getOpenState");
  function isIndeterminate(checked) {
    return checked === "indeterminate";
  }
  __name23(isIndeterminate, "isIndeterminate");
  function getCheckedState(checked) {
    return isIndeterminate(checked) ? "indeterminate" : checked ? "checked" : "unchecked";
  }
  __name23(getCheckedState, "getCheckedState");
  function focusFirst3(candidates) {
    const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
    for (const candidate of candidates) {
      if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
      candidate.focus();
      if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
    }
  }
  __name23(focusFirst3, "focusFirst");
  function wrapArray2(array, startIndex) {
    return array.map((_, index2) => array[(startIndex + index2) % array.length]);
  }
  __name23(wrapArray2, "wrapArray");
  function getNextMatch(values, search, currentMatch) {
    const isRepeated = search.length > 1 && Array.from(search).every((char) => char === search[0]);
    const normalizedSearch = isRepeated ? search[0] : search;
    const currentMatchIndex = currentMatch ? values.indexOf(currentMatch) : -1;
    let wrappedValues = wrapArray2(values, Math.max(currentMatchIndex, 0));
    const excludeCurrentMatch = normalizedSearch.length === 1;
    if (excludeCurrentMatch) wrappedValues = wrappedValues.filter((v) => v !== currentMatch);
    const nextMatch = wrappedValues.find(
      (value) => value.toLowerCase().startsWith(normalizedSearch.toLowerCase())
    );
    return nextMatch !== currentMatch ? nextMatch : void 0;
  }
  __name23(getNextMatch, "getNextMatch");
  function isPointInPolygon(point, polygon) {
    const { x, y } = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const ii = polygon[i];
      const jj = polygon[j];
      const xi = ii.x;
      const yi = ii.y;
      const xj = jj.x;
      const yj = jj.y;
      const intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
  __name23(isPointInPolygon, "isPointInPolygon");
  function isPointerInGraceArea(event, area) {
    if (!area) return false;
    const cursorPos = { x: event.clientX, y: event.clientY };
    return isPointInPolygon(cursorPos, area);
  }
  __name23(isPointerInGraceArea, "isPointerInGraceArea");
  function whenMouse(handler) {
    return (event) => event.pointerType === "mouse" ? handler(event) : void 0;
  }
  __name23(whenMouse, "whenMouse");
  var Root32 = Menu;
  var Anchor2 = MenuAnchor;
  var Portal3 = MenuPortal;
  var Content2 = MenuContent;
  var Group = MenuGroup;
  var Label = MenuLabel;
  var Item2 = MenuItem;
  var CheckboxItem = MenuCheckboxItem;
  var RadioGroup = MenuRadioGroup;
  var RadioItem = MenuRadioItem;
  var ItemIndicator = MenuItemIndicator;
  var Separator = MenuSeparator;
  var Arrow22 = MenuArrow;
  var Sub = MenuSub;
  var SubTrigger = MenuSubTrigger;
  var SubContent = MenuSubContent;

  // ../../node_modules/@radix-ui/react-dropdown-menu/dist/index.mjs
  var dist_exports5 = {};
  __export(dist_exports5, {
    Arrow: () => Arrow23,
    CheckboxItem: () => CheckboxItem2,
    Content: () => Content22,
    DropdownMenu: () => DropdownMenu,
    DropdownMenuArrow: () => DropdownMenuArrow,
    DropdownMenuCheckboxItem: () => DropdownMenuCheckboxItem,
    DropdownMenuContent: () => DropdownMenuContent,
    DropdownMenuGroup: () => DropdownMenuGroup,
    DropdownMenuItem: () => DropdownMenuItem,
    DropdownMenuItemIndicator: () => DropdownMenuItemIndicator,
    DropdownMenuLabel: () => DropdownMenuLabel,
    DropdownMenuPortal: () => DropdownMenuPortal,
    DropdownMenuRadioGroup: () => DropdownMenuRadioGroup,
    DropdownMenuRadioItem: () => DropdownMenuRadioItem,
    DropdownMenuSeparator: () => DropdownMenuSeparator,
    DropdownMenuSub: () => DropdownMenuSub,
    DropdownMenuSubContent: () => DropdownMenuSubContent,
    DropdownMenuSubTrigger: () => DropdownMenuSubTrigger,
    DropdownMenuTrigger: () => DropdownMenuTrigger,
    Group: () => Group2,
    Item: () => Item22,
    ItemIndicator: () => ItemIndicator2,
    Label: () => Label2,
    Portal: () => Portal22,
    RadioGroup: () => RadioGroup2,
    RadioItem: () => RadioItem2,
    Root: () => Root22,
    Separator: () => Separator2,
    Sub: () => Sub2,
    SubContent: () => SubContent2,
    SubTrigger: () => SubTrigger2,
    Trigger: () => Trigger,
    createDropdownMenuScope: () => createDropdownMenuScope
  });
  var React35 = __toESM(require_react(), 1);
  var import_jsx_runtime14 = __toESM(require_jsx_runtime(), 1);
  var __defProp25 = Object.defineProperty;
  var __name24 = (target, value) => __defProp25(target, "name", { value, configurable: true });
  var DROPDOWN_MENU_NAME = "DropdownMenu";
  var [createDropdownMenuContext, createDropdownMenuScope] = createContextScope(
    DROPDOWN_MENU_NAME,
    [createMenuScope]
  );
  var useMenuScope = createMenuScope();
  var [DropdownMenuProvider, useDropdownMenuContext] = createDropdownMenuContext(DROPDOWN_MENU_NAME);
  var DropdownMenu = /* @__PURE__ */ __name24((props) => {
    const {
      __scopeDropdownMenu,
      children,
      dir,
      open: openProp,
      defaultOpen,
      onOpenChange,
      modal = true
    } = props;
    const menuScope = useMenuScope(__scopeDropdownMenu);
    const triggerRef = React35.useRef(null);
    const [open, setOpen] = useControllableState({
      prop: openProp,
      defaultProp: defaultOpen ?? false,
      onChange: onOpenChange,
      caller: DROPDOWN_MENU_NAME
    });
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
      DropdownMenuProvider,
      {
        scope: __scopeDropdownMenu,
        triggerId: useId(),
        triggerRef,
        contentId: useId(),
        open,
        onOpenChange: setOpen,
        onOpenToggle: React35.useCallback(() => setOpen((prevOpen) => !prevOpen), [setOpen]),
        modal,
        children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Root32, { ...menuScope, open, onOpenChange: setOpen, dir, modal, children })
      }
    );
  }, "DropdownMenu");
  var TRIGGER_NAME2 = "DropdownMenuTrigger";
  var DropdownMenuTrigger = /* @__PURE__ */ React35.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name24(function DropdownMenuTrigger2(props, forwardedRef) {
      const { __scopeDropdownMenu, disabled = false, ...triggerProps } = props;
      const context = useDropdownMenuContext(TRIGGER_NAME2, __scopeDropdownMenu);
      const menuScope = useMenuScope(__scopeDropdownMenu);
      const composedRefs = useComposedRefs(forwardedRef, context.triggerRef);
      return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Anchor2, { asChild: true, ...menuScope, children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
        Primitive.button,
        {
          type: "button",
          id: context.triggerId,
          "aria-haspopup": "menu",
          "aria-expanded": context.open,
          "aria-controls": context.open ? context.contentId : void 0,
          "data-state": context.open ? "open" : "closed",
          "data-disabled": disabled ? "" : void 0,
          disabled,
          ...triggerProps,
          ref: composedRefs,
          onPointerDown: composeEventHandlers(props.onPointerDown, (event) => {
            if (!disabled && event.button === 0 && event.ctrlKey === false) {
              context.onOpenToggle();
              if (!context.open) event.preventDefault();
            }
          }),
          onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
            if (disabled) return;
            if (["Enter", " "].includes(event.key)) context.onOpenToggle();
            if (event.key === "ArrowDown") context.onOpenChange(true);
            if (["Enter", " ", "ArrowDown"].includes(event.key)) event.preventDefault();
          })
        }
      ) });
    }, "DropdownMenuTrigger")
  );
  var DropdownMenuPortal = /* @__PURE__ */ __name24((props) => {
    const { __scopeDropdownMenu, ...portalProps } = props;
    const menuScope = useMenuScope(__scopeDropdownMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Portal3, { ...menuScope, ...portalProps });
  }, "DropdownMenuPortal");
  var CONTENT_NAME4 = "DropdownMenuContent";
  var DropdownMenuContent = /* @__PURE__ */ React35.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name24(function DropdownMenuContent2(props, forwardedRef) {
      const { __scopeDropdownMenu, ...contentProps } = props;
      const context = useDropdownMenuContext(CONTENT_NAME4, __scopeDropdownMenu);
      const menuScope = useMenuScope(__scopeDropdownMenu);
      const hasInteractedOutsideRef = React35.useRef(false);
      return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
        Content2,
        {
          id: context.contentId,
          "aria-labelledby": context.triggerId,
          ...menuScope,
          ...contentProps,
          ref: forwardedRef,
          onCloseAutoFocus: composeEventHandlers(props.onCloseAutoFocus, (event) => {
            if (!hasInteractedOutsideRef.current) context.triggerRef.current?.focus();
            hasInteractedOutsideRef.current = false;
            event.preventDefault();
          }),
          onInteractOutside: composeEventHandlers(props.onInteractOutside, (event) => {
            const originalEvent = event.detail.originalEvent;
            const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
            const isRightClick = originalEvent.button === 2 || ctrlLeftClick;
            if (!context.modal || isRightClick) hasInteractedOutsideRef.current = true;
          }),
          style: {
            ...props.style,
            // re-namespace exposed content custom properties
            ...{
              "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
              "--radix-dropdown-menu-content-available-width": "var(--radix-popper-available-width)",
              "--radix-dropdown-menu-content-available-height": "var(--radix-popper-available-height)",
              "--radix-dropdown-menu-trigger-width": "var(--radix-popper-anchor-width)",
              "--radix-dropdown-menu-trigger-height": "var(--radix-popper-anchor-height)"
            }
          }
        }
      );
    }, "DropdownMenuContent")
  );
  var DropdownMenuGroup = /* @__PURE__ */ React35.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name24(function DropdownMenuGroup2(props, forwardedRef) {
      const { __scopeDropdownMenu, ...groupProps } = props;
      const menuScope = useMenuScope(__scopeDropdownMenu);
      return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Group, { ...menuScope, ...groupProps, ref: forwardedRef });
    }, "DropdownMenuGroup")
  );
  var DropdownMenuLabel = /* @__PURE__ */ React35.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name24(function DropdownMenuLabel2(props, forwardedRef) {
      const { __scopeDropdownMenu, ...labelProps } = props;
      const menuScope = useMenuScope(__scopeDropdownMenu);
      return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Label, { ...menuScope, ...labelProps, ref: forwardedRef });
    }, "DropdownMenuLabel")
  );
  var DropdownMenuItem = /* @__PURE__ */ React35.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name24(function DropdownMenuItem2(props, forwardedRef) {
      const { __scopeDropdownMenu, ...itemProps } = props;
      const menuScope = useMenuScope(__scopeDropdownMenu);
      return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Item2, { ...menuScope, ...itemProps, ref: forwardedRef });
    }, "DropdownMenuItem")
  );
  var DropdownMenuCheckboxItem = /* @__PURE__ */ React35.forwardRef(/* @__PURE__ */ __name24(function DropdownMenuCheckboxItem2(props, forwardedRef) {
    const { __scopeDropdownMenu, ...checkboxItemProps } = props;
    const menuScope = useMenuScope(__scopeDropdownMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(CheckboxItem, { ...menuScope, ...checkboxItemProps, ref: forwardedRef });
  }, "DropdownMenuCheckboxItem"));
  var DropdownMenuRadioGroup = /* @__PURE__ */ React35.forwardRef(/* @__PURE__ */ __name24(function DropdownMenuRadioGroup2(props, forwardedRef) {
    const { __scopeDropdownMenu, ...radioGroupProps } = props;
    const menuScope = useMenuScope(__scopeDropdownMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(RadioGroup, { ...menuScope, ...radioGroupProps, ref: forwardedRef });
  }, "DropdownMenuRadioGroup"));
  var DropdownMenuRadioItem = /* @__PURE__ */ React35.forwardRef(/* @__PURE__ */ __name24(function DropdownMenuRadioItem2(props, forwardedRef) {
    const { __scopeDropdownMenu, ...radioItemProps } = props;
    const menuScope = useMenuScope(__scopeDropdownMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(RadioItem, { ...menuScope, ...radioItemProps, ref: forwardedRef });
  }, "DropdownMenuRadioItem"));
  var DropdownMenuItemIndicator = /* @__PURE__ */ React35.forwardRef(/* @__PURE__ */ __name24(function DropdownMenuItemIndicator2(props, forwardedRef) {
    const { __scopeDropdownMenu, ...itemIndicatorProps } = props;
    const menuScope = useMenuScope(__scopeDropdownMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(ItemIndicator, { ...menuScope, ...itemIndicatorProps, ref: forwardedRef });
  }, "DropdownMenuItemIndicator"));
  var DropdownMenuSeparator = /* @__PURE__ */ React35.forwardRef(/* @__PURE__ */ __name24(function DropdownMenuSeparator2(props, forwardedRef) {
    const { __scopeDropdownMenu, ...separatorProps } = props;
    const menuScope = useMenuScope(__scopeDropdownMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Separator, { ...menuScope, ...separatorProps, ref: forwardedRef });
  }, "DropdownMenuSeparator"));
  var DropdownMenuArrow = /* @__PURE__ */ React35.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name24(function DropdownMenuArrow2(props, forwardedRef) {
      const { __scopeDropdownMenu, ...arrowProps } = props;
      const menuScope = useMenuScope(__scopeDropdownMenu);
      return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Arrow22, { ...menuScope, ...arrowProps, ref: forwardedRef });
    }, "DropdownMenuArrow")
  );
  var DropdownMenuSub = /* @__PURE__ */ __name24((props) => {
    const { __scopeDropdownMenu, children, open: openProp, onOpenChange, defaultOpen } = props;
    const menuScope = useMenuScope(__scopeDropdownMenu);
    const [open, setOpen] = useControllableState({
      prop: openProp,
      defaultProp: defaultOpen ?? false,
      onChange: onOpenChange,
      caller: "DropdownMenuSub"
    });
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Sub, { ...menuScope, open, onOpenChange: setOpen, children });
  }, "DropdownMenuSub");
  var DropdownMenuSubTrigger = /* @__PURE__ */ React35.forwardRef(/* @__PURE__ */ __name24(function DropdownMenuSubTrigger2(props, forwardedRef) {
    const { __scopeDropdownMenu, ...subTriggerProps } = props;
    const menuScope = useMenuScope(__scopeDropdownMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(SubTrigger, { ...menuScope, ...subTriggerProps, ref: forwardedRef });
  }, "DropdownMenuSubTrigger"));
  var DropdownMenuSubContent = /* @__PURE__ */ React35.forwardRef(/* @__PURE__ */ __name24(function DropdownMenuSubContent2(props, forwardedRef) {
    const { __scopeDropdownMenu, ...subContentProps } = props;
    const menuScope = useMenuScope(__scopeDropdownMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
      SubContent,
      {
        ...menuScope,
        ...subContentProps,
        ref: forwardedRef,
        style: {
          ...props.style,
          // re-namespace exposed content custom properties
          ...{
            "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
            "--radix-dropdown-menu-content-available-width": "var(--radix-popper-available-width)",
            "--radix-dropdown-menu-content-available-height": "var(--radix-popper-available-height)",
            "--radix-dropdown-menu-trigger-width": "var(--radix-popper-anchor-width)",
            "--radix-dropdown-menu-trigger-height": "var(--radix-popper-anchor-height)"
          }
        }
      }
    );
  }, "DropdownMenuSubContent"));
  var Root22 = DropdownMenu;
  var Trigger = DropdownMenuTrigger;
  var Portal22 = DropdownMenuPortal;
  var Content22 = DropdownMenuContent;
  var Group2 = DropdownMenuGroup;
  var Label2 = DropdownMenuLabel;
  var Item22 = DropdownMenuItem;
  var CheckboxItem2 = DropdownMenuCheckboxItem;
  var RadioGroup2 = DropdownMenuRadioGroup;
  var RadioItem2 = DropdownMenuRadioItem;
  var ItemIndicator2 = DropdownMenuItemIndicator;
  var Separator2 = DropdownMenuSeparator;
  var Arrow23 = DropdownMenuArrow;
  var Sub2 = DropdownMenuSub;
  var SubTrigger2 = DropdownMenuSubTrigger;
  var SubContent2 = DropdownMenuSubContent;