

  // ../artifact/lib/artifact/ui/studio-shell-components.mjs
  var import_react3 = __toESM(require_react(), 1);
  var StudioButton = (0, import_react3.forwardRef)(function StudioButton2({ variant = "default", className = "", type = "button", ...props }, ref) {
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
      "button",
      {
        ref,
        type,
        className: `studio-button studio-button-${variant} ${className}`,
        ...props
      }
    );
  });
  function StudioBadge({ children }) {
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "studio-type-badge", children });
  }
  function StudioMark() {
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "planr-mark", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("svg", { viewBox: "0 0 160 160", focusable: "false", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("g", { transform: "rotate(-45 80 80)", children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
        "path",
        {
          d: "M125 50A52 52 0 1 0 125 110",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "12",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("rect", { x: "127", y: "71", width: "18", height: "18", rx: "3", fill: "currentColor" })
    ] }) }) });
  }
  function inlineGap(element) {
    const view = element?.ownerDocument.defaultView;
    return view && element ? parseFloat(view.getComputedStyle(element).gap) || 0 : 0;
  }
  function measureLeadingFloor(leading) {
    const view = leading.ownerDocument.defaultView;
    if (!view) return 128;
    const leadingControls = [...leading.children].filter(
      (node) => node instanceof view.HTMLElement && !node.classList.contains("planr-brand") && node.getClientRects().length > 0
    );
    const branding = [
      ...leading.querySelectorAll(".planr-mark,.design-wordmark")
    ].filter((node) => node.getClientRects().length);
    const brandGap = inlineGap(leading.querySelector(".planr-brand"));
    const brandingWidth = branding.reduce(
      (total, node) => total + node.getBoundingClientRect().width + brandGap,
      0
    );
    const titleBlock = leading.querySelector(".planr-title-block");
    const badge = titleBlock?.querySelector(".studio-type-badge");
    const title = titleBlock?.querySelector("strong,.de-title");
    const titleFloor = Math.max(36, parseFloat(view.getComputedStyle(title ?? leading).fontSize) * 3);
    const identityFloor = Math.max(
      128,
      (badge?.getBoundingClientRect().width || 0) + inlineGap(titleBlock) + titleFloor
    );
    return identityFloor + brandingWidth + leadingControls.reduce((total, control) => total + control.getBoundingClientRect().width, 0) + leadingControls.length * inlineGap(leading);
  }
  function StudioToolbar({
    title,
    titleNode,
    brand = true,
    as: Tag = "header",
    kind,
    hierarchy = [],
    subtitle,
    leading,
    viewPicker,
    status,
    actions,
    secondaryActions,
    className = ""
  }) {
    const toolbar = (0, import_react3.useRef)(null);
    (0, import_react3.useLayoutEffect)(() => {
      const element = toolbar.current;
      const window2 = element?.ownerDocument.defaultView;
      if (!element || !window2) return;
      const center = element.querySelector(".studio-toolbar-center");
      const trailing = element.querySelector(".studio-toolbar-trailing");
      const leading2 = element.querySelector(".studio-toolbar-leading");
      const secondary = element.querySelector(".studio-toolbar-secondary");
      if (!center || !trailing || !leading2) return;
      const measure = () => {
        const width = element.getBoundingClientRect().width;
        if (!width) return;
        element.dataset.studioDensity = width <= 680 ? "narrow" : "regular";
        const style = window2.getComputedStyle(element);
        const available = width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        const gap = Math.max(12, parseFloat(style.columnGap) || 0);
        element.dataset.studioCenter = "true";
        const centerWidth = center.scrollWidth;
        element.dataset.studioCenter = String(centerWidth > 0);
        const controlSelector = 'button,a,summary,input,select,output,[role="status"]';
        const controls = [
          ...trailing.querySelectorAll(controlSelector),
          ...secondary?.querySelectorAll(controlSelector) ?? []
        ].filter(
          (control) => control.getClientRects().length && !control.closest('[role="menu"],.studio-tooltip,[role="dialog"]') && (!control.closest("details") || !!control.closest("summary")) && !control.parentElement?.closest(controlSelector)
        );
        const actionWidth = controls.reduce((total, control) => {
          if (secondary?.contains(control) && control.getAttribute("role") === "status") {
            const range = element.ownerDocument.createRange();
            range.selectNodeContents(control);
            const textWidth = range.getBoundingClientRect().width;
            const controlStyle = window2.getComputedStyle(control);
            return total + textWidth + (parseFloat(controlStyle.paddingLeft) || 0) + (parseFloat(controlStyle.paddingRight) || 0);
          }
          return total + control.getBoundingClientRect().width;
        }, 0) + Math.max(0, controls.length - 1) * (parseFloat(window2.getComputedStyle(trailing).gap) || 8);
        const leadingFloor = measureLeadingFloor(leading2);
        const outerWidth = Math.max(leadingFloor, actionWidth);
        element.dataset.studioLayout = centerWidth > 0 ? width <= 680 || centerWidth + outerWidth * 2 + gap * 2 > available ? "compact" : "inline" : leadingFloor + actionWidth + gap > available ? "compact" : "inline";
      };
      measure();
      let frame = 0;
      const scheduleMeasure = () => {
        if (frame) return;
        frame = window2.requestAnimationFrame(() => {
          frame = 0;
          measure();
        });
      };
      const resize = typeof window2.ResizeObserver === "function" ? new window2.ResizeObserver(scheduleMeasure) : null;
      for (const node of [element, center, trailing, secondary]) if (node) resize?.observe(node);
      const mutations = new window2.MutationObserver(scheduleMeasure);
      mutations.observe(element, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["hidden"]
      });
      window2.addEventListener("resize", scheduleMeasure);
      let active = true;
      void element.ownerDocument.fonts?.ready.then(() => {
        if (active) scheduleMeasure();
      });
      return () => {
        active = false;
        resize?.disconnect();
        mutations.disconnect();
        window2.cancelAnimationFrame(frame);
        window2.removeEventListener("resize", scheduleMeasure);
      };
    }, [Tag]);
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
      Tag,
      {
        ref: (node) => {
          toolbar.current = node;
        },
        className: `planr-toolbar studio-toolbar ${className}`,
        "data-studio-react-chrome": "true",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "studio-toolbar-leading design-toolbar-leading", children: [
            leading,
            /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "planr-brand", children: [
              brand && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(StudioMark, {}),
                /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { className: "design-wordmark", children: [
                  "Open",
                  /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { children: "Planr" })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "studio-identity", children: [
                hierarchy.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("nav", { className: "studio-hierarchy", "aria-label": "Project path", children: hierarchy.map((item, index2) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { children: [
                  index2 > 0 && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { "aria-hidden": "true", children: " / " }),
                  item.href ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("a", { href: item.href, children: item.label }) : item.label
                ] }, item.href ?? item.label)) }),
                /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { className: "planr-title-block", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(StudioBadge, { children: kind === "artifact" ? "Artifact" : kind === "diagram" ? "Diagram" : "Design" }),
                  titleNode ?? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("strong", { title, children: title })
                ] }),
                subtitle && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "studio-subtitle", children: subtitle })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "studio-toolbar-center", children: viewPicker }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "studio-toolbar-trailing design-toolbar-trailing", children: [
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "studio-toolbar-status", children: status }),
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "studio-toolbar-actions", children: actions })
          ] }),
          secondaryActions && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "studio-toolbar-secondary", children: secondaryActions })
        ]
      }
    );
  }
  function StudioMenu({
    label,
    items,
    className = "",
    triggerAttributes = {},
    open,
    onOpenChange
  }) {
    const trigger = (0, import_react3.useRef)(null);
    const mousePosition = (0, import_react3.useRef)(null);
    const keyboardPosition = (0, import_react3.useRef)(null);
    (0, import_react3.useLayoutEffect)(() => {
      const ownerDocument = trigger.current?.ownerDocument;
      if (!ownerDocument) return;
      const move = (event) => {
        if (event.pointerType !== "mouse") return;
        const position = { x: event.clientX, y: event.clientY };
        const previous = keyboardPosition.current;
        if (previous && (previous.x !== position.x || previous.y !== position.y))
          keyboardPosition.current = null;
        mousePosition.current = position;
      };
      const down = (event) => {
        keyboardPosition.current = null;
        if (event.pointerType === "mouse")
          mousePosition.current = { x: event.clientX, y: event.clientY };
      };
      ownerDocument.addEventListener("pointermove", move, true);
      ownerDocument.addEventListener("pointerdown", down, true);
      return () => {
        ownerDocument.removeEventListener("pointermove", move, true);
        ownerDocument.removeEventListener("pointerdown", down, true);
      };
    }, []);
    const retainKeyboardFocus = (event) => {
      const position = keyboardPosition.current;
      if (event.pointerType === "mouse" && position?.x === event.clientX && position.y === event.clientY)
        event.preventDefault();
    };
    const keyboardInput = () => {
      keyboardPosition.current = mousePosition.current;
    };
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
      dist_exports5.Root,
      {
        modal: false,
        open,
        onOpenChange: (value) => {
          if (!value) keyboardPosition.current = null;
          onOpenChange?.(value);
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { className: `studio-menu ${className}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(dist_exports5.Trigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
            StudioButton,
            {
              "aria-label": label,
              title: label,
              ...triggerAttributes,
              ref: trigger,
              onKeyDownCapture: keyboardInput,
              children: [
                label,
                /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { "aria-hidden": "true", children: "⌄" })
              ]
            }
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
            dist_exports5.Content,
            {
              className: "studio-menu-content",
              align: "end",
              sideOffset: 8,
              collisionPadding: 8,
              onKeyDownCapture: keyboardInput,
              onCloseAutoFocus: (event) => {
                event.preventDefault();
                const content = event.target;
                const ownerDocument = content?.ownerDocument;
                const active = ownerDocument?.activeElement;
                if (active?.isConnected && active !== ownerDocument?.body && active !== ownerDocument?.documentElement && !content?.contains(active))
                  return;
                if (trigger.current?.isConnected) trigger.current.focus();
              },
              children: items.map((item, index2) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
                dist_exports5.Item,
                {
                  asChild: true,
                  disabled: item.disabled,
                  onSelect: item.onSelect,
                  onPointerMove: retainKeyboardFocus,
                  onPointerLeave: retainKeyboardFocus,
                  children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
                    "button",
                    {
                      type: "button",
                      className: `studio-menu-item${index2 > 0 && item.group !== items[index2 - 1].group ? " studio-menu-group-start" : ""}`,
                      disabled: item.disabled,
                      ...item.attributes,
                      children: item.label
                    }
                  )
                },
                item.id
              ))
            }
          )
        ] })
      }
    );
  }
  function StudioPanelDialog({
    open,
    onOpenChange,
    title,
    description = "Inspect this panel, then close it to return to the canvas.",
    side = "right",
    children,
    container,
    onCloseAutoFocus
  }) {
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(dist_exports.Root, { open, onOpenChange, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(dist_exports.Portal, { container, children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(dist_exports.Overlay, { className: "studio-panel-overlay" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
        dist_exports.Content,
        {
          onCloseAutoFocus,
          className: `studio-panel-dialog studio-panel-${side}`,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(dist_exports.Title, { className: "planr-visually-hidden", children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(dist_exports.Description, { className: "planr-visually-hidden", children: description }),
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(dist_exports.Close, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
              StudioButton,
              {
                className: "studio-panel-close",
                variant: "ghost",
                "aria-label": `Close ${title.toLowerCase()}`,
                children: "×"
              }
            ) }),
            children
          ]
        }
      )
    ] }) });
  }

  // ../artifact/lib/artifact/ui/studio-shell-mount-impl.mjs
  function mountDesignStudioChrome({
    root,
    title,
    state: initial
  }) {
    const document2 = root.ownerDocument;
    const window2 = document2.defaultView;
    if (!window2) return null;
    const old = root.querySelector(".design-toolbar");
    if (!old || old.hasAttribute("data-studio-react-chrome")) return null;
    const share = old.querySelector(".design-share");
    const showShare = !!share && !share.hidden;
    const showExport = !old.querySelector(".design-export")?.hidden;
    let state = {
      previewLabel: old.querySelector("[data-design-preview-state]")?.textContent ?? "Loading preview",
      saveLabel: old.querySelector("[data-design-save-state]")?.textContent ?? "Loading studio",
      savePhase: "loading",
      ...initial,
      exportMenuOpen: false
    };
    const listeners = /* @__PURE__ */ new Set();
    const update = (value) => {
      const next = { ...state, ...value };
      if (Object.keys(next).every(
        (key) => next[key] === state[key]
      ))
        return;
      state = next;
      (0, import_react_dom2.flushSync)(
        () => listeners.forEach((listener) => {
          listener();
        })
      );
    };
    const mount = document2.createElement("div");
    mount.className = "studio-chrome-mount";
    old.replaceWith(mount);
    const react = (0, import_client.createRoot)(mount);
    function Chrome() {
      const current = (0, import_react4.useSyncExternalStore)(
        (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        () => state
      );
      return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
        StudioToolbar,
        {
          title,
          kind: "design",
          className: "design-toolbar",
          leading: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
            StudioButton,
            {
              className: "planr-toolbar-action design-panel-toggle",
              variant: "ghost",
              "data-design-toggle-nav": "",
              "aria-controls": "design-navigator",
              "aria-expanded": current.navOpen,
              "aria-label": "Screens",
              title: "Screens",
              children: [
                "☰",
                /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "design-button-label", children: "Screens" })
              ]
            }
          ),
          viewPicker: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("fieldset", { className: "planr-segment design-view-picker", "aria-label": "Design view", children: ["canvas", "prototype", "walkthrough"].map((view) => /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
            StudioButton,
            {
              variant: "ghost",
              "data-design-view": view,
              "aria-pressed": current.view === view,
              "aria-label": view[0].toUpperCase() + view.slice(1),
              title: view[0].toUpperCase() + view.slice(1),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { "aria-hidden": "true", children: view === "canvas" ? "▦" : view === "prototype" ? "▷" : "▤" }),
                /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "design-button-label", children: view[0].toUpperCase() + view.slice(1) })
              ]
            },
            view
          )) }),
          status: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(import_jsx_runtime16.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("output", { className: "design-preview-state", "data-design-preview-state": "", children: current.previewLabel }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
              "output",
              {
                className: "design-save-state",
                "aria-live": "polite",
                "data-design-save-state": "",
                "data-status": current.savePhase,
                children: current.saveLabel
              }
            )
          ] }),
          actions: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(import_jsx_runtime16.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
              StudioButton,
              {
                className: "planr-toolbar-action design-review-toggle",
                "data-planr-action": "feedback",
                "data-planr-review-label": "Review",
                "aria-controls": "planr-review-rail",
                "aria-expanded": current.reviewOpen,
                "aria-label": "Review",
                title: "Review",
                children: [
                  "☷",
                  /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "design-button-label", children: "Review" })
                ]
              }
            ),
            showShare && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(PreservedNode, { element: share }),
            showExport && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
              StudioMenu,
              {
                className: "design-export",
                label: "Export",
                open: current.exportMenuOpen,
                onOpenChange: (open) => update({ exportMenuOpen: open }),
                triggerAttributes: { "data-studio-export-menu": "" },
                items: [
                  {
                    id: "html",
                    label: "Portable HTML",
                    group: "design",
                    attributes: { "data-design-export": "html" }
                  },
                  {
                    id: "png",
                    label: "Screen PNG",
                    group: "design",
                    attributes: { "data-design-export": "png" }
                  }
                ]
              }
            )
          ] })
        }
      );
    }
    (0, import_react_dom2.flushSync)(() => react.render(/* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Chrome, {})));
    const observer = new window2.MutationObserver(() => {
      const node = root.querySelector("[data-design-save-state]");
      if (node)
        update({
          saveLabel: node.textContent ?? "",
          savePhase: node.dataset.status ?? state.savePhase
        });
    });
    observer.observe(mount, {
      subtree: true,
      characterData: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-status"]
    });
    root.dataset.studioFramework = "react";
    let destroyed = false;
    return {
      update,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        observer.disconnect();
        (0, import_react_dom2.flushSync)(() => react.unmount());
        mount.replaceWith(old);
        delete root.dataset.studioFramework;
      }
    };
  }
  function PersistentPanel({ element }) {
    const host = (0, import_react4.useRef)(null);
    (0, import_react4.useLayoutEffect)(() => {
      const target = host.current;
      if (!target) return;
      const marker = element.ownerDocument.createComment("studio-panel-home");
      element.before(marker);
      target.append(element);
      return () => {
        marker.replaceWith(element);
      };
    }, [element]);
    return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { ref: host, className: "studio-panel-content" });
  }
  function mountStudioPanelDialogs({
    root,
    closePanel,
    breakpoint = 960
  }) {
    const document2 = root.ownerDocument;
    const window2 = document2.defaultView;
    if (!window2) return { destroy() {
    } };
    const left = root.querySelector(".design-navigator,.diagram-outline");
    const right = root.querySelector(".planr-review-rail");
    if (!left || !right) return { destroy() {
    } };
    const panels = { left, right };
    const mount = document2.createElement("div");
    mount.className = "studio-panel-mount";
    root.append(mount);
    const react = (0, import_client.createRoot)(mount);
    let snapshot = "";
    let wasCompact = false;
    let lastOpenSide = "left";
    const listeners = /* @__PURE__ */ new Set();
    const read = () => {
      const width = root.getBoundingClientRect().width || window2.innerWidth;
      const compact = width <= breakpoint;
      if (compact && !wasCompact) {
        wasCompact = true;
        if (root.dataset.outlineOpen === "true") closePanel("left");
      }
      wasCompact = compact;
      const next = width <= breakpoint ? root.dataset.designNavOpen === "true" || root.dataset.outlineOpen === "true" ? "left" : root.dataset.planrRailOpen === "true" ? "right" : "" : "";
      if (snapshot !== next) {
        if (next) lastOpenSide = next;
        snapshot = next;
        listeners.forEach((listener) => {
          listener();
        });
      }
    };
    function Panels() {
      const side = (0, import_react4.useSyncExternalStore)(
        (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        () => snapshot
      );
      return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
        StudioPanelDialog,
        {
          open: !!side,
          side: side === "left" ? "left" : "right",
          title: side === "left" ? "Screens" : "Review",
          container: root,
          onCloseAutoFocus: (event) => {
            event.preventDefault();
            root.querySelector(
              lastOpenSide === "left" ? "[data-design-toggle-nav],[data-action=outline]" : "[data-planr-action=feedback],[data-action=review]"
            )?.focus({ preventScroll: true });
          },
          onOpenChange: (open) => {
            if (!open && side) closePanel(side);
          },
          children: side && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(PersistentPanel, { element: panels[side === "left" ? "left" : "right"] }, side)
        }
      );
    }
    read();
    (0, import_react_dom2.flushSync)(() => react.render(/* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Panels, {})));
    const observer = new window2.MutationObserver(read);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-design-nav-open", "data-outline-open", "data-planr-rail-open"]
    });
    const resize = typeof window2.ResizeObserver === "function" ? new window2.ResizeObserver(read) : null;
    resize?.observe(root);
    window2.addEventListener("resize", read);
    return {
      destroy() {
        observer.disconnect();
        resize?.disconnect();
        window2.removeEventListener("resize", read);
        (0, import_react_dom2.flushSync)(() => react.unmount());
        mount.remove();
      }
    };
  }
  function PreservedNode({ element }) {
    const host = (0, import_react4.useRef)(null);
    (0, import_react4.useLayoutEffect)(() => {
      if (!element) return;
      const marker = element.ownerDocument.createComment("studio-control-home");
      element.before(marker);
      host.current?.append(element);
      return () => {
        marker.replaceWith(element);
      };
    }, [element]);
    return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { ref: host, className: "studio-preserved-control" });
  }