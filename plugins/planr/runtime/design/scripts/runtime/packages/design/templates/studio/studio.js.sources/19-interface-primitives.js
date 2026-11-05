

  // ../../node_modules/@radix-ui/react-roving-focus/dist/index.mjs
  var import_jsx_runtime12 = __toESM(require_jsx_runtime(), 1), __defProp23 = Object.defineProperty, __name22 = (target, value) => __defProp23(target, "name", { value, configurable: !0 }), ENTRY_FOCUS = "rovingFocusGroup.onEntryFocus", EVENT_OPTIONS2 = { bubbles: !1, cancelable: !0 }, GROUP_NAME = "RovingFocusGroup", [Collection, useCollection, createCollectionScope] = createCollection(GROUP_NAME), [createRovingFocusGroupContext, createRovingFocusGroupScope] = createContextScope(
    GROUP_NAME,
    [createCollectionScope]
  ), Orientation = {
    Vertical: "vertical",
    Horizontal: "horizontal"
  }, Direction2 = {
    LTR: "ltr",
    RTL: "rtl"
  }, [RovingFocusProvider, useRovingFocusContext] = createRovingFocusGroupContext(GROUP_NAME), RovingFocusGroup = /* @__PURE__ */ React33.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name22(function(props, forwardedRef) {
      return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Collection.Provider, { scope: props.__scopeRovingFocusGroup, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Collection.Slot, { scope: props.__scopeRovingFocusGroup, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(RovingFocusGroupImpl, { ...props, ref: forwardedRef }) }) });
    }, "RovingFocusGroup")
  ), RovingFocusGroupImpl = /* @__PURE__ */ React33.forwardRef(/* @__PURE__ */ __name22(function(props, forwardedRef) {
    let {
      __scopeRovingFocusGroup,
      orientation,
      loop = !1,
      dir,
      currentTabStopId: currentTabStopIdProp,
      defaultCurrentTabStopId,
      onCurrentTabStopIdChange,
      onEntryFocus,
      preventScrollOnEntryFocus = !1,
      ...groupProps
    } = props, ref = React33.useRef(null), composedRefs = useComposedRefs(forwardedRef, ref), direction = useDirection(dir), [currentTabStopId, setCurrentTabStopId] = useControllableState({
      prop: currentTabStopIdProp,
      defaultProp: defaultCurrentTabStopId ?? null,
      onChange: onCurrentTabStopIdChange,
      caller: GROUP_NAME
    }), [isTabbingBackOut, setIsTabbingBackOut] = React33.useState(!1), handleEntryFocus = useCallbackRef(onEntryFocus), getItems = useCollection(__scopeRovingFocusGroup), isClickFocusRef = React33.useRef(!1), [focusableItemsCount, setFocusableItemsCount] = React33.useState(0);
    return React33.useEffect(() => {
      let node = ref.current;
      if (node)
        return node.addEventListener(ENTRY_FOCUS, handleEntryFocus), () => node.removeEventListener(ENTRY_FOCUS, handleEntryFocus);
    }, [handleEntryFocus]), /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
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
        onItemShiftTab: React33.useCallback(() => setIsTabbingBackOut(!0), []),
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
              isClickFocusRef.current = !0;
            }),
            onFocus: composeEventHandlers(props.onFocus, (event) => {
              let isKeyboardFocus = !isClickFocusRef.current;
              if (event.target === event.currentTarget && isKeyboardFocus && !isTabbingBackOut) {
                let entryFocusEvent = new CustomEvent(ENTRY_FOCUS, EVENT_OPTIONS2);
                if (event.currentTarget.dispatchEvent(entryFocusEvent), !entryFocusEvent.defaultPrevented) {
                  let items = getItems().filter((item) => item.focusable), activeItem = items.find((item) => item.active), currentItem = items.find((item) => item.id === currentTabStopId), candidateNodes = [activeItem, currentItem, ...items].filter(
                    Boolean
                  ).map((item) => item.ref.current);
                  focusFirst2(candidateNodes, preventScrollOnEntryFocus);
                }
              }
              isClickFocusRef.current = !1;
            }),
            onBlur: composeEventHandlers(props.onBlur, () => setIsTabbingBackOut(!1))
          }
        )
      }
    );
  }, "RovingFocusGroupImpl")), ITEM_NAME = "RovingFocusGroupItem", RovingFocusGroupItem = /* @__PURE__ */ React33.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name22(function(props, forwardedRef) {
      let {
        __scopeRovingFocusGroup,
        focusable = !0,
        active = !1,
        tabStopId,
        children,
        ...itemProps
      } = props, autoId = useId(), id = tabStopId || autoId, context = useRovingFocusContext(ITEM_NAME, __scopeRovingFocusGroup), isCurrentTabStop = context.currentTabStopId === id, getItems = useCollection(__scopeRovingFocusGroup), { onFocusableItemAdd, onFocusableItemRemove, currentTabStopId } = context, isHydrated = useIsHydrated2();
      return useLayoutEffect2(() => {
        if (!(!isHydrated || !focusable))
          return onFocusableItemAdd(), () => onFocusableItemRemove();
      }, [isHydrated, focusable, onFocusableItemAdd, onFocusableItemRemove]), React33.useEffect(() => {
        if (!(isHydrated || !focusable))
          return onFocusableItemAdd(), () => onFocusableItemRemove();
      }, [isHydrated, focusable, onFocusableItemAdd, onFocusableItemRemove]), /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
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
                focusable ? context.onItemFocus(id) : event.preventDefault();
              }),
              onFocus: composeEventHandlers(props.onFocus, () => context.onItemFocus(id)),
              onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
                if (event.key === "Tab" && event.shiftKey) {
                  context.onItemShiftTab();
                  return;
                }
                if (event.target !== event.currentTarget) return;
                let focusIntent = getFocusIntent(event, context.orientation, context.dir);
                if (focusIntent !== void 0) {
                  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                  event.preventDefault();
                  let candidateNodes = getItems().filter((item) => item.focusable).map((item) => item.ref.current);
                  if (focusIntent === "last") candidateNodes.reverse();
                  else if (focusIntent === "prev" || focusIntent === "next") {
                    focusIntent === "prev" && candidateNodes.reverse();
                    let currentIndex = candidateNodes.indexOf(event.currentTarget);
                    candidateNodes = context.loop ? wrapArray(candidateNodes, currentIndex + 1) : candidateNodes.slice(currentIndex + 1);
                  }
                  setTimeout(() => focusFirst2(candidateNodes));
                }
              }),
              children: typeof children == "function" ? children({ isCurrentTabStop, hasTabStop: currentTabStopId != null }) : children
            }
          )
        }
      );
    }, "RovingFocusGroupItem")
  ), MAP_KEY_TO_FOCUS_INTENT = {
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
    return dir !== Direction2.RTL ? key : key === "ArrowLeft" ? "ArrowRight" : key === "ArrowRight" ? "ArrowLeft" : key;
  }
  __name22(getDirectionAwareKey, "getDirectionAwareKey");
  function getFocusIntent(event, orientation, dir) {
    let key = getDirectionAwareKey(event.key, dir);
    if (!(orientation === Orientation.Vertical && ["ArrowLeft", "ArrowRight"].includes(key)) && !(orientation === Orientation.Horizontal && ["ArrowUp", "ArrowDown"].includes(key)))
      return MAP_KEY_TO_FOCUS_INTENT[key];
  }
  __name22(getFocusIntent, "getFocusIntent");
  function focusFirst2(candidates, preventScroll = !1) {
    let PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
    for (let candidate of candidates)
      if (candidate === PREVIOUSLY_FOCUSED_ELEMENT || (candidate.focus({ preventScroll }), document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT)) return;
  }
  __name22(focusFirst2, "focusFirst");
  function wrapArray(array, startIndex) {
    return array.map((_, index2) => array[(startIndex + index2) % array.length]);
  }
  __name22(wrapArray, "wrapArray");

  // ../../node_modules/@radix-ui/react-menu/dist/index.mjs
  var import_jsx_runtime13 = __toESM(require_jsx_runtime(), 1), __defProp24 = Object.defineProperty, __name23 = (target, value) => __defProp24(target, "name", { value, configurable: !0 }), Direction3 = {
    LTR: "ltr",
    RTL: "rtl"
  }, SELECTION_KEYS = ["Enter", " "], FIRST_KEYS = ["ArrowDown", "PageUp", "Home"], LAST_KEYS = ["ArrowUp", "PageDown", "End"], FIRST_LAST_KEYS = [...FIRST_KEYS, ...LAST_KEYS], SUB_OPEN_KEYS = {
    ltr: [...SELECTION_KEYS, "ArrowRight"],
    rtl: [...SELECTION_KEYS, "ArrowLeft"]
  }, SUB_CLOSE_KEYS = {
    ltr: ["ArrowLeft"],
    rtl: ["ArrowRight"]
  }, MENU_NAME = "Menu", [Collection2, useCollection2, createCollectionScope2] = createCollection(MENU_NAME), [createMenuContext, createMenuScope] = createContextScope(MENU_NAME, [
    createCollectionScope2,
    createPopperScope,
    createRovingFocusGroupScope
  ]), usePopperScope = createPopperScope(), useRovingFocusGroupScope = createRovingFocusGroupScope(), [MenuProvider, useMenuContext] = createMenuContext(MENU_NAME), [MenuRootProvider, useMenuRootContext] = createMenuContext(MENU_NAME), Menu = /* @__PURE__ */ __name23((props) => {
    let { __scopeMenu, open = !1, children, dir, onOpenChange, modal = !0 } = props, popperScope = usePopperScope(__scopeMenu), [content, setContent] = React34.useState(null), isUsingKeyboardRef = React34.useRef(!1), handleOpenChange = useCallbackRef(onOpenChange), direction = useDirection(dir);
    return React34.useEffect(() => {
      let handleKeyDown = /* @__PURE__ */ __name23(() => {
        isUsingKeyboardRef.current = !0, document.addEventListener("pointerdown", handlePointer, { capture: !0, once: !0 }), document.addEventListener("pointermove", handlePointer, { capture: !0, once: !0 });
      }, "handleKeyDown"), handlePointer = /* @__PURE__ */ __name23(() => isUsingKeyboardRef.current = !1, "handlePointer");
      return document.addEventListener("keydown", handleKeyDown, { capture: !0 }), () => {
        document.removeEventListener("keydown", handleKeyDown, { capture: !0 }), document.removeEventListener("pointerdown", handlePointer, { capture: !0 }), document.removeEventListener("pointermove", handlePointer, { capture: !0 });
      };
    }, []), React34.useEffect(() => {
      if (!open)
        return;
      let handleBlur = /* @__PURE__ */ __name23(() => handleOpenChange(!1), "handleBlur");
      return window.addEventListener("blur", handleBlur), () => window.removeEventListener("blur", handleBlur);
    }, [open, handleOpenChange]), /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Popper, { ...popperScope, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
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
            onClose: React34.useCallback(() => handleOpenChange(!1), [handleOpenChange]),
            isUsingKeyboardRef,
            dir: direction,
            modal,
            children
          }
        )
      }
    ) });
  }, "Menu"), MenuAnchor = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function(props, forwardedRef) {
      let { __scopeMenu, ...anchorProps } = props, popperScope = usePopperScope(__scopeMenu);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(PopperAnchor, { ...popperScope, ...anchorProps, ref: forwardedRef });
    }, "MenuAnchor")
  ), PORTAL_NAME2 = "MenuPortal", [PortalProvider2, usePortalContext2] = createMenuContext(PORTAL_NAME2, {
    forceMount: void 0
  }), MenuPortal = /* @__PURE__ */ __name23((props) => {
    let { __scopeMenu, forceMount, children, container } = props, context = useMenuContext(PORTAL_NAME2, __scopeMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(PortalProvider2, { scope: __scopeMenu, forceMount, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Presence, { present: forceMount || context.open, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Portal, { asChild: !0, container, children }) }) });
  }, "MenuPortal"), CONTENT_NAME3 = "MenuContent", [MenuContentProvider, useMenuContentContext] = createMenuContext(CONTENT_NAME3), MenuContent = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function(props, forwardedRef) {
      let portalContext = usePortalContext2(CONTENT_NAME3, props.__scopeMenu), { forceMount = portalContext.forceMount, ...contentProps } = props, context = useMenuContext(CONTENT_NAME3, props.__scopeMenu), rootContext = useMenuRootContext(CONTENT_NAME3, props.__scopeMenu);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Collection2.Provider, { scope: props.__scopeMenu, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Presence, { present: forceMount || context.open, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Collection2.Slot, { scope: props.__scopeMenu, children: rootContext.modal ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(MenuRootContentModal, { ...contentProps, ref: forwardedRef }) : /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(MenuRootContentNonModal, { ...contentProps, ref: forwardedRef }) }) }) });
    }, "MenuContent")
  ), MenuRootContentModal = /* @__PURE__ */ React34.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name23(function(props, forwardedRef) {
      let context = useMenuContext(CONTENT_NAME3, props.__scopeMenu), ref = React34.useRef(null), composedRefs = useComposedRefs(forwardedRef, ref);
      return React34.useEffect(() => {
        let content = ref.current;
        if (content) return hideOthers(content);
      }, []), /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        MenuContentImpl,
        {
          ...props,
          ref: composedRefs,
          trapFocus: context.open,
          disableOutsidePointerEvents: context.open,
          disableOutsideScroll: !0,
          onFocusOutside: composeEventHandlers(
            props.onFocusOutside,
            (event) => event.preventDefault(),
            { checkForDefaultPrevented: !1 }
          ),
          onDismiss: () => context.onOpenChange(!1)
        }
      );
    }, "MenuRootContentModal")
  ), MenuRootContentNonModal = /* @__PURE__ */ React34.forwardRef(/* @__PURE__ */ __name23(function(props, forwardedRef) {
    let context = useMenuContext(CONTENT_NAME3, props.__scopeMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
      MenuContentImpl,
      {
        ...props,
        ref: forwardedRef,
        trapFocus: !1,
        disableOutsidePointerEvents: !1,
        disableOutsideScroll: !1,
        onDismiss: () => context.onOpenChange(!1)
      }
    );
  }, "MenuRootContentNonModal")), Slot2 = createSlot("MenuContent.ScrollLock"), MenuContentImpl = /* @__PURE__ */ React34.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name23(function(props, forwardedRef) {
      let {
        __scopeMenu,
        loop = !1,
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
      } = props, context = useMenuContext(CONTENT_NAME3, __scopeMenu), rootContext = useMenuRootContext(CONTENT_NAME3, __scopeMenu), popperScope = usePopperScope(__scopeMenu), rovingFocusGroupScope = useRovingFocusGroupScope(__scopeMenu), getItems = useCollection2(__scopeMenu), [currentItemId, setCurrentItemId] = React34.useState(null), contentRef = React34.useRef(null), [branchNode, setBranchNode] = React34.useState(null);
      useFocusScopeBranch(branchNode);
      let { nodes: branchNodes, registry: branchRegistry } = useFocusScopeBranchRegistry(), isModal = !!(trapFocus || disableOutsideScroll), composedRefs = useComposedRefs(
        forwardedRef,
        contentRef,
        context.onContentChange,
        setBranchNode
      ), timerRef = React34.useRef(0), searchRef = React34.useRef(""), pointerGraceTimerRef = React34.useRef(0), pointerGraceIntentRef = React34.useRef(null), pointerDirRef = React34.useRef("right"), lastPointerXRef = React34.useRef(0), shards = React34.useMemo(
        () => disableOutsideScroll ? [contentRef, ...branchNodes.map((node) => ({ current: node }))] : [],
        [contentRef, branchNodes, disableOutsideScroll]
      ), ScrollLockWrapper = disableOutsideScroll ? Combination_default : React34.Fragment, scrollLockWrapperProps = disableOutsideScroll ? {
        as: Slot2,
        allowPinchZoom: !0,
        shards
      } : void 0, handleTypeaheadSearch = /* @__PURE__ */ __name23((key) => {
        let search = searchRef.current + key, items = getItems().filter((item) => !item.disabled), currentItem = document.activeElement, currentMatch = items.find((item) => item.ref.current === currentItem)?.textValue, values = items.map((item) => item.textValue), nextMatch = getNextMatch(values, search, currentMatch), newItem = items.find((item) => item.textValue === nextMatch)?.ref.current;
        function updateSearch(value) {
          searchRef.current = value, window.clearTimeout(timerRef.current), value !== "" && (timerRef.current = window.setTimeout(() => updateSearch(""), 1e3));
        }
        __name23(updateSearch, "updateSearch"), updateSearch(search), newItem && setTimeout(() => newItem.focus());
      }, "handleTypeaheadSearch");
      React34.useEffect(() => () => window.clearTimeout(timerRef.current), []), useFocusGuards();
      let isPointerMovingToSubmenu = React34.useCallback((event) => pointerDirRef.current === pointerGraceIntentRef.current?.side && isPointerInGraceArea(event, pointerGraceIntentRef.current?.area), []);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        MenuContentProvider,
        {
          scope: __scopeMenu,
          searchRef,
          onItemEnter: React34.useCallback(
            (event) => {
              isPointerMovingToSubmenu(event) && event.preventDefault();
            },
            [isPointerMovingToSubmenu]
          ),
          onItemLeave: React34.useCallback(
            (event) => {
              isPointerMovingToSubmenu(event) || (contentRef.current?.focus(), setCurrentItemId(null));
            },
            [isPointerMovingToSubmenu]
          ),
          onTriggerLeave: React34.useCallback(
            (event) => {
              isPointerMovingToSubmenu(event) && event.preventDefault();
            },
            [isPointerMovingToSubmenu]
          ),
          pointerGraceTimerRef,
          onPointerGraceIntentChange: React34.useCallback((intent) => {
            pointerGraceIntentRef.current = intent;
          }, []),
          children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(FocusScopeBranchProvider, { registry: isModal ? branchRegistry : null, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(ScrollLockWrapper, { ...scrollLockWrapperProps, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
            FocusScope,
            {
              asChild: !0,
              trapped: trapFocus,
              branches: branchNodes,
              onMountAutoFocus: composeEventHandlers(onOpenAutoFocus, (event) => {
                event.preventDefault(), contentRef.current?.focus({ preventScroll: !0 });
              }),
              onUnmountAutoFocus: onCloseAutoFocus,
              children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
                DismissableLayer,
                {
                  asChild: !0,
                  disableOutsidePointerEvents,
                  onEscapeKeyDown,
                  onPointerDownOutside,
                  onFocusOutside,
                  onInteractOutside,
                  onDismiss,
                  children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
                    RovingFocusGroup,
                    {
                      asChild: !0,
                      ...rovingFocusGroupScope,
                      dir: rootContext.dir,
                      orientation: "vertical",
                      loop,
                      currentTabStopId: currentItemId,
                      onCurrentTabStopIdChange: setCurrentItemId,
                      onEntryFocus: composeEventHandlers(onEntryFocus, (event) => {
                        rootContext.isUsingKeyboardRef.current || event.preventDefault();
                      }),
                      preventScrollOnEntryFocus: !0,
                      children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
                        PopperContent,
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
                            let isKeyDownInside = event.target.closest("[data-radix-menu-content]") === event.currentTarget, isModifierKey = event.ctrlKey || event.altKey || event.metaKey, isCharacterKey = event.key.length === 1;
                            isKeyDownInside && (event.key === "Tab" && event.preventDefault(), !isModifierKey && isCharacterKey && handleTypeaheadSearch(event.key));
                            let content = contentRef.current;
                            if (event.target !== content || !FIRST_LAST_KEYS.includes(event.key)) return;
                            event.preventDefault();
                            let candidateNodes = getItems().filter((item) => !item.disabled).map((item) => item.ref.current);
                            LAST_KEYS.includes(event.key) && candidateNodes.reverse(), focusFirst3(candidateNodes);
                          }),
                          onBlur: composeEventHandlers(props.onBlur, (event) => {
                            event.currentTarget.contains(event.target) || (window.clearTimeout(timerRef.current), searchRef.current = "");
                          }),
                          onPointerMove: composeEventHandlers(
                            props.onPointerMove,
                            whenMouse((event) => {
                              let target = event.target, pointerXHasChanged = lastPointerXRef.current !== event.clientX;
                              if (event.currentTarget.contains(target) && pointerXHasChanged) {
                                let newDir = event.clientX > lastPointerXRef.current ? "right" : "left";
                                pointerDirRef.current = newDir, lastPointerXRef.current = event.clientX;
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
          ) }) })
        }
      );
    }, "MenuContentImpl")
  ), MenuGroup = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function(props, forwardedRef) {
      let { __scopeMenu, ...groupProps } = props;
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Primitive.div, { role: "group", ...groupProps, ref: forwardedRef });
    }, "MenuGroup")
  ), MenuLabel = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function(props, forwardedRef) {
      let { __scopeMenu, ...labelProps } = props;
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Primitive.div, { ...labelProps, ref: forwardedRef });
    }, "MenuLabel")
  ), ITEM_NAME2 = "MenuItem", ITEM_SELECT = "menu.itemSelect", MenuItem = /* @__PURE__ */ React34.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name23(function(props, forwardedRef) {
      let { disabled = !1, onSelect, ...itemProps } = props, ref = React34.useRef(null), rootContext = useMenuRootContext(ITEM_NAME2, props.__scopeMenu), contentContext = useMenuContentContext(ITEM_NAME2, props.__scopeMenu), composedRefs = useComposedRefs(forwardedRef, ref), isPointerDownRef = React34.useRef(!1), handleSelect = /* @__PURE__ */ __name23(() => {
        let menuItem = ref.current;
        if (!disabled && menuItem) {
          let itemSelectEvent = new CustomEvent(ITEM_SELECT, { bubbles: !0, cancelable: !0 });
          menuItem.addEventListener(ITEM_SELECT, (event) => onSelect?.(event), { once: !0 }), dispatchDiscreteCustomEvent(menuItem, itemSelectEvent), itemSelectEvent.defaultPrevented ? isPointerDownRef.current = !1 : rootContext.onClose();
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
            props.onPointerDown?.(event), isPointerDownRef.current = !0;
          },
          onPointerUp: composeEventHandlers(props.onPointerUp, (event) => {
            isPointerDownRef.current || event.currentTarget?.click();
          }),
          onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
            disabled || event.target !== event.currentTarget || contentContext.searchRef.current !== "" && event.key === " " || SELECTION_KEYS.includes(event.key) && (event.currentTarget.click(), event.preventDefault());
          })
        }
      );
    }, "MenuItem")
  ), MenuItemImpl = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function(props, forwardedRef) {
      let { __scopeMenu, disabled = !1, textValue, ...itemProps } = props, contentContext = useMenuContentContext(ITEM_NAME2, __scopeMenu), rovingFocusGroupScope = useRovingFocusGroupScope(__scopeMenu), ref = React34.useRef(null), composedRefs = useComposedRefs(forwardedRef, ref), [isFocused, setIsFocused] = React34.useState(!1), [textContent, setTextContent] = React34.useState("");
      return React34.useEffect(() => {
        let menuItem = ref.current;
        menuItem && setTextContent((menuItem.textContent ?? "").trim());
      }, [itemProps.children]), /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        Collection2.ItemSlot,
        {
          scope: __scopeMenu,
          disabled,
          textValue: textValue ?? textContent,
          children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(RovingFocusGroupItem, { asChild: !0, ...rovingFocusGroupScope, focusable: !disabled, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
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
                  disabled ? contentContext.onItemLeave(event) : (contentContext.onItemEnter(event), event.defaultPrevented || event.currentTarget.focus({ preventScroll: !0 }));
                })
              ),
              onPointerLeave: composeEventHandlers(
                props.onPointerLeave,
                whenMouse((event) => contentContext.onItemLeave(event))
              ),
              onFocus: composeEventHandlers(props.onFocus, () => setIsFocused(!0)),
              onBlur: composeEventHandlers(props.onBlur, () => setIsFocused(!1))
            }
          ) })
        }
      );
    }, "MenuItemImpl")
  ), MenuCheckboxItem = /* @__PURE__ */ React34.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name23(function(props, forwardedRef) {
      let { checked = !1, onCheckedChange, ...checkboxItemProps } = props;
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
            () => onCheckedChange?.(isIndeterminate(checked) ? !0 : !checked),
            { checkForDefaultPrevented: !1 }
          )
        }
      ) });
    }, "MenuCheckboxItem")
  ), RADIO_GROUP_NAME = "MenuRadioGroup", [RadioGroupProvider, useRadioGroupContext] = createMenuContext(
    RADIO_GROUP_NAME,
    { value: void 0, onValueChange: /* @__PURE__ */ __name23(() => {
    }, "onValueChange") }
  ), MenuRadioGroup = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function(props, forwardedRef) {
      let { value, onValueChange, ...groupProps } = props, handleValueChange = useCallbackRef(onValueChange);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(RadioGroupProvider, { scope: props.__scopeMenu, value, onValueChange: handleValueChange, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(MenuGroup, { ...groupProps, ref: forwardedRef }) });
    }, "MenuRadioGroup")
  ), RADIO_ITEM_NAME = "MenuRadioItem", MenuRadioItem = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function(props, forwardedRef) {
      let { value, ...radioItemProps } = props, context = useRadioGroupContext(RADIO_ITEM_NAME, props.__scopeMenu), checked = value === context.value;
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
            { checkForDefaultPrevented: !1 }
          )
        }
      ) });
    }, "MenuRadioItem")
  ), ITEM_INDICATOR_NAME = "MenuItemIndicator", [ItemIndicatorProvider, useItemIndicatorContext] = createMenuContext(
    ITEM_INDICATOR_NAME,
    { checked: !1 }
  ), MenuItemIndicator = /* @__PURE__ */ React34.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name23(function(props, forwardedRef) {
      let { __scopeMenu, forceMount, ...itemIndicatorProps } = props, indicatorContext = useItemIndicatorContext(ITEM_INDICATOR_NAME, __scopeMenu);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        Presence,
        {
          present: forceMount || isIndeterminate(indicatorContext.checked) || indicatorContext.checked === !0,
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
  ), MenuSeparator = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function(props, forwardedRef) {
      let { __scopeMenu, ...separatorProps } = props;
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
  ), MenuArrow = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function(props, forwardedRef) {
      let { __scopeMenu, ...arrowProps } = props, popperScope = usePopperScope(__scopeMenu);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(PopperArrow, { ...popperScope, ...arrowProps, ref: forwardedRef });
    }, "MenuArrow")
  ), SUB_NAME = "MenuSub", [MenuSubProvider, useMenuSubContext] = createMenuContext(SUB_NAME), MenuSub = /* @__PURE__ */ __name23((props) => {
    let { __scopeMenu, children, open = !1, onOpenChange } = props, parentMenuContext = useMenuContext(SUB_NAME, __scopeMenu), popperScope = usePopperScope(__scopeMenu), [trigger, setTrigger] = React34.useState(null), [content, setContent] = React34.useState(null), handleOpenChange = useCallbackRef(onOpenChange);
    return React34.useEffect(() => (parentMenuContext.open === !1 && handleOpenChange(!1), () => handleOpenChange(!1)), [parentMenuContext.open, handleOpenChange]), /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Popper, { ...popperScope, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
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
  }, "MenuSub"), SUB_TRIGGER_NAME = "MenuSubTrigger", MenuSubTrigger = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function(props, forwardedRef) {
      let context = useMenuContext(SUB_TRIGGER_NAME, props.__scopeMenu), rootContext = useMenuRootContext(SUB_TRIGGER_NAME, props.__scopeMenu), subContext = useMenuSubContext(SUB_TRIGGER_NAME, props.__scopeMenu), contentContext = useMenuContentContext(SUB_TRIGGER_NAME, props.__scopeMenu), openTimerRef = React34.useRef(null), { pointerGraceTimerRef, onPointerGraceIntentChange } = contentContext, scope = { __scopeMenu: props.__scopeMenu }, clearOpenTimer = React34.useCallback(() => {
        openTimerRef.current && window.clearTimeout(openTimerRef.current), openTimerRef.current = null;
      }, []);
      React34.useEffect(() => clearOpenTimer, [clearOpenTimer]), React34.useEffect(() => {
        let pointerGraceTimer = pointerGraceTimerRef.current;
        return () => {
          window.clearTimeout(pointerGraceTimer), onPointerGraceIntentChange(null);
        };
      }, [pointerGraceTimerRef, onPointerGraceIntentChange]);
      let composedRefs = useComposedRefs(forwardedRef, subContext.onTriggerChange);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(MenuAnchor, { asChild: !0, ...scope, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
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
            props.onClick?.(event), !(props.disabled || event.defaultPrevented) && (event.currentTarget.focus(), context.open || context.onOpenChange(!0));
          },
          onPointerMove: composeEventHandlers(
            props.onPointerMove,
            whenMouse((event) => {
              contentContext.onItemEnter(event), !event.defaultPrevented && !props.disabled && !context.open && !openTimerRef.current && (contentContext.onPointerGraceIntentChange(null), openTimerRef.current = window.setTimeout(() => {
                context.onOpenChange(!0), clearOpenTimer();
              }, 100));
            })
          ),
          onPointerLeave: composeEventHandlers(
            props.onPointerLeave,
            whenMouse((event) => {
              clearOpenTimer();
              let contentRect = context.content?.getBoundingClientRect();
              if (contentRect) {
                let side = context.content?.dataset.side, rightSide = side === "right", bleed = rightSide ? -5 : 5, contentNearEdge = contentRect[rightSide ? "left" : "right"], contentFarEdge = contentRect[rightSide ? "right" : "left"];
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
                }), window.clearTimeout(pointerGraceTimerRef.current), pointerGraceTimerRef.current = window.setTimeout(
                  () => contentContext.onPointerGraceIntentChange(null),
                  300
                );
              } else {
                if (contentContext.onTriggerLeave(event), event.defaultPrevented) return;
                contentContext.onPointerGraceIntentChange(null);
              }
            })
          ),
          onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
            props.disabled || event.target !== event.currentTarget || contentContext.searchRef.current !== "" && event.key === " " || SUB_OPEN_KEYS[rootContext.dir].includes(event.key) && (context.onOpenChange(!0), context.content?.focus(), event.preventDefault());
          })
        }
      ) });
    }, "MenuSubTrigger")
  ), SUB_CONTENT_NAME = "MenuSubContent", MenuSubContent = /* @__PURE__ */ React34.forwardRef(
    /* @__PURE__ */ __name23(function(props, forwardedRef) {
      let portalContext = usePortalContext2(CONTENT_NAME3, props.__scopeMenu), { forceMount = portalContext.forceMount, align = "start", ...subContentProps } = props, context = useMenuContext(CONTENT_NAME3, props.__scopeMenu), rootContext = useMenuRootContext(CONTENT_NAME3, props.__scopeMenu), subContext = useMenuSubContext(SUB_CONTENT_NAME, props.__scopeMenu), ref = React34.useRef(null), composedRefs = useComposedRefs(forwardedRef, ref);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Collection2.Provider, { scope: props.__scopeMenu, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Presence, { present: forceMount || context.open, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Collection2.Slot, { scope: props.__scopeMenu, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        MenuContentImpl,
        {
          id: subContext.contentId,
          "aria-labelledby": subContext.triggerId,
          ...subContentProps,
          ref: composedRefs,
          align,
          side: rootContext.dir === Direction3.RTL ? "left" : "right",
          disableOutsidePointerEvents: !1,
          disableOutsideScroll: !1,
          trapFocus: !1,
          onOpenAutoFocus: (event) => {
            rootContext.isUsingKeyboardRef.current && ref.current?.focus(), event.preventDefault();
          },
          onCloseAutoFocus: (event) => event.preventDefault(),
          onFocusOutside: composeEventHandlers(props.onFocusOutside, (event) => {
            event.target !== subContext.trigger && context.onOpenChange(!1);
          }),
          onEscapeKeyDown: composeEventHandlers(props.onEscapeKeyDown, (event) => {
            rootContext.onClose(), event.preventDefault();
          }),
          onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
            let isKeyDownInside = event.currentTarget.contains(event.target), isCloseKey = SUB_CLOSE_KEYS[rootContext.dir].includes(event.key);
            isKeyDownInside && isCloseKey && (context.onOpenChange(!1), subContext.trigger?.focus(), event.preventDefault());
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
    let PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
    for (let candidate of candidates)
      if (candidate === PREVIOUSLY_FOCUSED_ELEMENT || (candidate.focus(), document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT)) return;
  }
  __name23(focusFirst3, "focusFirst");
  function wrapArray2(array, startIndex) {
    return array.map((_, index2) => array[(startIndex + index2) % array.length]);
  }
  __name23(wrapArray2, "wrapArray");
  function getNextMatch(values, search, currentMatch) {
    let normalizedSearch = search.length > 1 && Array.from(search).every((char) => char === search[0]) ? search[0] : search, currentMatchIndex = currentMatch ? values.indexOf(currentMatch) : -1, wrappedValues = wrapArray2(values, Math.max(currentMatchIndex, 0));
    normalizedSearch.length === 1 && (wrappedValues = wrappedValues.filter((v) => v !== currentMatch));
    let nextMatch = wrappedValues.find(
      (value) => value.toLowerCase().startsWith(normalizedSearch.toLowerCase())
    );
    return nextMatch !== currentMatch ? nextMatch : void 0;
  }
  __name23(getNextMatch, "getNextMatch");
  function isPointInPolygon(point2, polygon) {
    let { x, y } = point2, inside = !1;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      let ii = polygon[i], jj = polygon[j], xi = ii.x, yi = ii.y, xj = jj.x, yj = jj.y;
      yi > y != yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi && (inside = !inside);
    }
    return inside;
  }
  __name23(isPointInPolygon, "isPointInPolygon");
  function isPointerInGraceArea(event, area) {
    if (!area) return !1;
    let cursorPos = { x: event.clientX, y: event.clientY };
    return isPointInPolygon(cursorPos, area);
  }
  __name23(isPointerInGraceArea, "isPointerInGraceArea");
  function whenMouse(handler) {
    return (event) => event.pointerType === "mouse" ? handler(event) : void 0;
  }
  __name23(whenMouse, "whenMouse");

  // ../../node_modules/@radix-ui/react-dropdown-menu/dist/index.mjs
  var dist_exports5 = {};
  __export(dist_exports5, {
    Arrow: () => DropdownMenuArrow,
    CheckboxItem: () => DropdownMenuCheckboxItem,
    Content: () => DropdownMenuContent,
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
    Group: () => DropdownMenuGroup,
    Item: () => DropdownMenuItem,
    ItemIndicator: () => DropdownMenuItemIndicator,
    Label: () => DropdownMenuLabel,
    Portal: () => DropdownMenuPortal,
    RadioGroup: () => DropdownMenuRadioGroup,
    RadioItem: () => DropdownMenuRadioItem,
    Root: () => DropdownMenu,
    Separator: () => DropdownMenuSeparator,
    Sub: () => DropdownMenuSub,
    SubContent: () => DropdownMenuSubContent,
    SubTrigger: () => DropdownMenuSubTrigger,
    Trigger: () => DropdownMenuTrigger,
    createDropdownMenuScope: () => createDropdownMenuScope
  });
  var React35 = __toESM(require_react(), 1);
  var import_jsx_runtime14 = __toESM(require_jsx_runtime(), 1), __defProp25 = Object.defineProperty, __name24 = (target, value) => __defProp25(target, "name", { value, configurable: !0 }), DROPDOWN_MENU_NAME = "DropdownMenu", [createDropdownMenuContext, createDropdownMenuScope] = createContextScope(
    DROPDOWN_MENU_NAME,
    [createMenuScope]
  ), useMenuScope = createMenuScope(), [DropdownMenuProvider, useDropdownMenuContext] = createDropdownMenuContext(DROPDOWN_MENU_NAME), DropdownMenu = /* @__PURE__ */ __name24((props) => {
    let {
      __scopeDropdownMenu,
      children,
      dir,
      open: openProp,
      defaultOpen,
      onOpenChange,
      modal = !0
    } = props, menuScope = useMenuScope(__scopeDropdownMenu), triggerRef = React35.useRef(null), [open, setOpen] = useControllableState({
      prop: openProp,
      defaultProp: defaultOpen ?? !1,
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
        children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Menu, { ...menuScope, open, onOpenChange: setOpen, dir, modal, children })
      }
    );
  }, "DropdownMenu"), TRIGGER_NAME2 = "DropdownMenuTrigger", DropdownMenuTrigger = /* @__PURE__ */ React35.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name24(function(props, forwardedRef) {
      let { __scopeDropdownMenu, disabled = !1, ...triggerProps } = props, context = useDropdownMenuContext(TRIGGER_NAME2, __scopeDropdownMenu), menuScope = useMenuScope(__scopeDropdownMenu), composedRefs = useComposedRefs(forwardedRef, context.triggerRef);
      return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(MenuAnchor, { asChild: !0, ...menuScope, children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
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
            !disabled && event.button === 0 && event.ctrlKey === !1 && (context.onOpenToggle(), context.open || event.preventDefault());
          }),
          onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
            disabled || (["Enter", " "].includes(event.key) && context.onOpenToggle(), event.key === "ArrowDown" && context.onOpenChange(!0), ["Enter", " ", "ArrowDown"].includes(event.key) && event.preventDefault());
          })
        }
      ) });
    }, "DropdownMenuTrigger")
  ), DropdownMenuPortal = /* @__PURE__ */ __name24((props) => {
    let { __scopeDropdownMenu, ...portalProps } = props, menuScope = useMenuScope(__scopeDropdownMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(MenuPortal, { ...menuScope, ...portalProps });
  }, "DropdownMenuPortal"), CONTENT_NAME4 = "DropdownMenuContent", DropdownMenuContent = /* @__PURE__ */ React35.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name24(function(props, forwardedRef) {
      let { __scopeDropdownMenu, ...contentProps } = props, context = useDropdownMenuContext(CONTENT_NAME4, __scopeDropdownMenu), menuScope = useMenuScope(__scopeDropdownMenu), hasInteractedOutsideRef = React35.useRef(!1);
      return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
        MenuContent,
        {
          id: context.contentId,
          "aria-labelledby": context.triggerId,
          ...menuScope,
          ...contentProps,
          ref: forwardedRef,
          onCloseAutoFocus: composeEventHandlers(props.onCloseAutoFocus, (event) => {
            hasInteractedOutsideRef.current || context.triggerRef.current?.focus(), hasInteractedOutsideRef.current = !1, event.preventDefault();
          }),
          onInteractOutside: composeEventHandlers(props.onInteractOutside, (event) => {
            let originalEvent = event.detail.originalEvent, ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === !0, isRightClick = originalEvent.button === 2 || ctrlLeftClick;
            (!context.modal || isRightClick) && (hasInteractedOutsideRef.current = !0);
          }),
          style: {
            ...props.style,
            "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
            "--radix-dropdown-menu-content-available-width": "var(--radix-popper-available-width)",
            "--radix-dropdown-menu-content-available-height": "var(--radix-popper-available-height)",
            "--radix-dropdown-menu-trigger-width": "var(--radix-popper-anchor-width)",
            "--radix-dropdown-menu-trigger-height": "var(--radix-popper-anchor-height)"
          }
        }
      );
    }, "DropdownMenuContent")
  ), DropdownMenuGroup = /* @__PURE__ */ React35.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name24(function(props, forwardedRef) {
      let { __scopeDropdownMenu, ...groupProps } = props, menuScope = useMenuScope(__scopeDropdownMenu);
      return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(MenuGroup, { ...menuScope, ...groupProps, ref: forwardedRef });
    }, "DropdownMenuGroup")
  ), DropdownMenuLabel = /* @__PURE__ */ React35.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name24(function(props, forwardedRef) {
      let { __scopeDropdownMenu, ...labelProps } = props, menuScope = useMenuScope(__scopeDropdownMenu);
      return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(MenuLabel, { ...menuScope, ...labelProps, ref: forwardedRef });
    }, "DropdownMenuLabel")
  ), DropdownMenuItem = /* @__PURE__ */ React35.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name24(function(props, forwardedRef) {
      let { __scopeDropdownMenu, ...itemProps } = props, menuScope = useMenuScope(__scopeDropdownMenu);
      return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(MenuItem, { ...menuScope, ...itemProps, ref: forwardedRef });
    }, "DropdownMenuItem")
  ), DropdownMenuCheckboxItem = /* @__PURE__ */ React35.forwardRef(/* @__PURE__ */ __name24(function(props, forwardedRef) {
    let { __scopeDropdownMenu, ...checkboxItemProps } = props, menuScope = useMenuScope(__scopeDropdownMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(MenuCheckboxItem, { ...menuScope, ...checkboxItemProps, ref: forwardedRef });
  }, "DropdownMenuCheckboxItem")), DropdownMenuRadioGroup = /* @__PURE__ */ React35.forwardRef(/* @__PURE__ */ __name24(function(props, forwardedRef) {
    let { __scopeDropdownMenu, ...radioGroupProps } = props, menuScope = useMenuScope(__scopeDropdownMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(MenuRadioGroup, { ...menuScope, ...radioGroupProps, ref: forwardedRef });
  }, "DropdownMenuRadioGroup")), DropdownMenuRadioItem = /* @__PURE__ */ React35.forwardRef(/* @__PURE__ */ __name24(function(props, forwardedRef) {
    let { __scopeDropdownMenu, ...radioItemProps } = props, menuScope = useMenuScope(__scopeDropdownMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(MenuRadioItem, { ...menuScope, ...radioItemProps, ref: forwardedRef });
  }, "DropdownMenuRadioItem")), DropdownMenuItemIndicator = /* @__PURE__ */ React35.forwardRef(/* @__PURE__ */ __name24(function(props, forwardedRef) {
    let { __scopeDropdownMenu, ...itemIndicatorProps } = props, menuScope = useMenuScope(__scopeDropdownMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(MenuItemIndicator, { ...menuScope, ...itemIndicatorProps, ref: forwardedRef });
  }, "DropdownMenuItemIndicator")), DropdownMenuSeparator = /* @__PURE__ */ React35.forwardRef(/* @__PURE__ */ __name24(function(props, forwardedRef) {
    let { __scopeDropdownMenu, ...separatorProps } = props, menuScope = useMenuScope(__scopeDropdownMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(MenuSeparator, { ...menuScope, ...separatorProps, ref: forwardedRef });
  }, "DropdownMenuSeparator")), DropdownMenuArrow = /* @__PURE__ */ React35.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name24(function(props, forwardedRef) {
      let { __scopeDropdownMenu, ...arrowProps } = props, menuScope = useMenuScope(__scopeDropdownMenu);
      return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(MenuArrow, { ...menuScope, ...arrowProps, ref: forwardedRef });
    }, "DropdownMenuArrow")
  ), DropdownMenuSub = /* @__PURE__ */ __name24((props) => {
    let { __scopeDropdownMenu, children, open: openProp, onOpenChange, defaultOpen } = props, menuScope = useMenuScope(__scopeDropdownMenu), [open, setOpen] = useControllableState({
      prop: openProp,
      defaultProp: defaultOpen ?? !1,
      onChange: onOpenChange,
      caller: "DropdownMenuSub"
    });
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(MenuSub, { ...menuScope, open, onOpenChange: setOpen, children });
  }, "DropdownMenuSub"), DropdownMenuSubTrigger = /* @__PURE__ */ React35.forwardRef(/* @__PURE__ */ __name24(function(props, forwardedRef) {
    let { __scopeDropdownMenu, ...subTriggerProps } = props, menuScope = useMenuScope(__scopeDropdownMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(MenuSubTrigger, { ...menuScope, ...subTriggerProps, ref: forwardedRef });
  }, "DropdownMenuSubTrigger")), DropdownMenuSubContent = /* @__PURE__ */ React35.forwardRef(/* @__PURE__ */ __name24(function(props, forwardedRef) {
    let { __scopeDropdownMenu, ...subContentProps } = props, menuScope = useMenuScope(__scopeDropdownMenu);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
      MenuSubContent,
      {
        ...menuScope,
        ...subContentProps,
        ref: forwardedRef,
        style: {
          ...props.style,
          "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
          "--radix-dropdown-menu-content-available-width": "var(--radix-popper-available-width)",
          "--radix-dropdown-menu-content-available-height": "var(--radix-popper-available-height)",
          "--radix-dropdown-menu-trigger-width": "var(--radix-popper-anchor-width)",
          "--radix-dropdown-menu-trigger-height": "var(--radix-popper-anchor-height)"
        }
      }
    );
  }, "DropdownMenuSubContent"));