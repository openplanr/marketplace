

  // ../artifact/lib/artifact/ui/studio-shell-components.mjs
  var import_react3 = __toESM(require_react(), 1), StudioButton = (0, import_react3.forwardRef)(function({ variant = "default", className = "", type = "button", ...props }, ref) {
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
    let view = element?.ownerDocument.defaultView;
    return view && element && parseFloat(view.getComputedStyle(element).gap) || 0;
  }
  function measureLeadingFloor(leading) {
    let view = leading.ownerDocument.defaultView;
    if (!view) return 128;
    let leadingControls = [...leading.children].filter(
      (node) => node instanceof view.HTMLElement && !node.classList.contains("planr-brand") && node.getClientRects().length > 0
    ), branding = [
      ...leading.querySelectorAll(".planr-mark,.design-wordmark")
    ].filter((node) => node.getClientRects().length), brandGap = inlineGap(leading.querySelector(".planr-brand")), brandingWidth = branding.reduce(
      (total, node) => total + node.getBoundingClientRect().width + brandGap,
      0
    ), titleBlock = leading.querySelector(".planr-title-block"), badge = titleBlock?.querySelector(".studio-type-badge"), title = titleBlock?.querySelector("strong,.de-title"), titleFloor = Math.max(36, parseFloat(view.getComputedStyle(title ?? leading).fontSize) * 3);
    return Math.max(
      128,
      (badge?.getBoundingClientRect().width || 0) + inlineGap(titleBlock) + titleFloor
    ) + brandingWidth + leadingControls.reduce((total, control) => total + control.getBoundingClientRect().width, 0) + leadingControls.length * inlineGap(leading);
  }
  function StudioToolbar({
    title,
    titleNode,
    brand = !0,
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
    let toolbar = (0, import_react3.useRef)(null);
    return (0, import_react3.useLayoutEffect)(() => {
      let element = toolbar.current, window2 = element?.ownerDocument.defaultView;
      if (!element || !window2) return;
      let center = element.querySelector(".studio-toolbar-center"), trailing = element.querySelector(".studio-toolbar-trailing"), leading2 = element.querySelector(".studio-toolbar-leading"), secondary = element.querySelector(".studio-toolbar-secondary");
      if (!center || !trailing || !leading2) return;
      let measure = () => {
        let width = element.getBoundingClientRect().width;
        if (!width) return;
        element.dataset.studioDensity = width <= 680 ? "narrow" : "regular";
        let style = window2.getComputedStyle(element), available = width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight), gap = Math.max(12, parseFloat(style.columnGap) || 0);
        element.dataset.studioCenter = "true";
        let centerWidth = center.scrollWidth;
        element.dataset.studioCenter = String(centerWidth > 0);
        let controlSelector = 'button,a,summary,input,select,output,[role="status"]', controls = [
          ...trailing.querySelectorAll(controlSelector),
          ...secondary?.querySelectorAll(controlSelector) ?? []
        ].filter(
          (control) => control.getClientRects().length && !control.closest('[role="menu"],.studio-tooltip,[role="dialog"]') && (!control.closest("details") || !!control.closest("summary")) && !control.parentElement?.closest(controlSelector)
        ), actionWidth = controls.reduce((total, control) => {
          if (secondary?.contains(control) && control.getAttribute("role") === "status") {
            let range = element.ownerDocument.createRange();
            range.selectNodeContents(control);
            let textWidth = range.getBoundingClientRect().width, controlStyle = window2.getComputedStyle(control);
            return total + textWidth + (parseFloat(controlStyle.paddingLeft) || 0) + (parseFloat(controlStyle.paddingRight) || 0);
          }
          return total + control.getBoundingClientRect().width;
        }, 0) + Math.max(0, controls.length - 1) * (parseFloat(window2.getComputedStyle(trailing).gap) || 8), leadingFloor = measureLeadingFloor(leading2), outerWidth = Math.max(leadingFloor, actionWidth);
        element.dataset.studioLayout = centerWidth > 0 ? width <= 680 || centerWidth + outerWidth * 2 + gap * 2 > available ? "compact" : "inline" : leadingFloor + actionWidth + gap > available ? "compact" : "inline";
      };
      measure();
      let frame = 0, scheduleMeasure = () => {
        frame || (frame = window2.requestAnimationFrame(() => {
          frame = 0, measure();
        }));
      }, resize = typeof window2.ResizeObserver == "function" ? new window2.ResizeObserver(scheduleMeasure) : null;
      for (let node of [element, center, trailing, secondary]) node && resize?.observe(node);
      let mutations = new window2.MutationObserver(scheduleMeasure);
      mutations.observe(element, {
        subtree: !0,
        childList: !0,
        characterData: !0,
        attributes: !0,
        attributeFilter: ["hidden"]
      }), window2.addEventListener("resize", scheduleMeasure);
      let active = !0;
      return element.ownerDocument.fonts?.ready.then(() => {
        active && scheduleMeasure();
      }), () => {
        active = !1, resize?.disconnect(), mutations.disconnect(), window2.cancelAnimationFrame(frame), window2.removeEventListener("resize", scheduleMeasure);
      };
    }, [Tag]), /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
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
    let trigger = (0, import_react3.useRef)(null), mousePosition = (0, import_react3.useRef)(null), keyboardPosition = (0, import_react3.useRef)(null);
    (0, import_react3.useLayoutEffect)(() => {
      let ownerDocument = trigger.current?.ownerDocument;
      if (!ownerDocument) return;
      let move = (event) => {
        if (event.pointerType !== "mouse") return;
        let position = { x: event.clientX, y: event.clientY }, previous = keyboardPosition.current;
        previous && (previous.x !== position.x || previous.y !== position.y) && (keyboardPosition.current = null), mousePosition.current = position;
      }, down = (event) => {
        keyboardPosition.current = null, event.pointerType === "mouse" && (mousePosition.current = { x: event.clientX, y: event.clientY });
      };
      return ownerDocument.addEventListener("pointermove", move, !0), ownerDocument.addEventListener("pointerdown", down, !0), () => {
        ownerDocument.removeEventListener("pointermove", move, !0), ownerDocument.removeEventListener("pointerdown", down, !0);
      };
    }, []);
    let retainKeyboardFocus = (event) => {
      let position = keyboardPosition.current;
      event.pointerType === "mouse" && position?.x === event.clientX && position.y === event.clientY && event.preventDefault();
    }, keyboardInput = () => {
      keyboardPosition.current = mousePosition.current;
    };
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
      dist_exports5.Root,
      {
        modal: !1,
        open,
        onOpenChange: (value) => {
          value || (keyboardPosition.current = null), onOpenChange?.(value);
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { className: `studio-menu ${className}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(dist_exports5.Trigger, { asChild: !0, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
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
                let content = event.target, ownerDocument = content?.ownerDocument, active = ownerDocument?.activeElement;
                active?.isConnected && active !== ownerDocument?.body && active !== ownerDocument?.documentElement && !content?.contains(active) || trigger.current?.isConnected && trigger.current.focus();
              },
              children: items.map((item, index2) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
                dist_exports5.Item,
                {
                  asChild: !0,
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
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(dist_exports.Close, { asChild: !0, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
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
    let document2 = root.ownerDocument, window2 = document2.defaultView;
    if (!window2) return null;
    let old = root.querySelector(".design-toolbar");
    if (!old || old.hasAttribute("data-studio-react-chrome")) return null;
    let share = old.querySelector(".design-share"), showShare = !!share && !share.hidden, showExport = !old.querySelector(".design-export")?.hidden, state = {
      previewLabel: old.querySelector("[data-design-preview-state]")?.textContent ?? "Loading preview",
      saveLabel: old.querySelector("[data-design-save-state]")?.textContent ?? "Loading studio",
      savePhase: "loading",
      ...initial,
      exportMenuOpen: !1
    }, listeners = /* @__PURE__ */ new Set(), update = (value) => {
      let next = { ...state, ...value };
      Object.keys(next).every(
        (key) => next[key] === state[key]
      ) || (state = next, (0, import_react_dom2.flushSync)(
        () => listeners.forEach((listener) => {
          listener();
        })
      ));
    }, mount = document2.createElement("div");
    mount.className = "studio-chrome-mount", old.replaceWith(mount);
    let react = (0, import_client.createRoot)(mount);
    function Chrome() {
      let current = (0, import_react4.useSyncExternalStore)(
        (listener) => (listeners.add(listener), () => listeners.delete(listener)),
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
    let observer = new window2.MutationObserver(() => {
      let node = root.querySelector("[data-design-save-state]");
      node && update({
        saveLabel: node.textContent ?? "",
        savePhase: node.dataset.status ?? state.savePhase
      });
    });
    observer.observe(mount, {
      subtree: !0,
      characterData: !0,
      childList: !0,
      attributes: !0,
      attributeFilter: ["data-status"]
    }), root.dataset.studioFramework = "react";
    let destroyed = !1;
    return {
      update,
      destroy() {
        destroyed || (destroyed = !0, observer.disconnect(), (0, import_react_dom2.flushSync)(() => react.unmount()), mount.replaceWith(old), delete root.dataset.studioFramework);
      }
    };
  }
  function PersistentPanel({ element }) {
    let host = (0, import_react4.useRef)(null);
    return (0, import_react4.useLayoutEffect)(() => {
      let target = host.current;
      if (!target) return;
      let marker = element.ownerDocument.createComment("studio-panel-home");
      return element.before(marker), target.append(element), () => {
        marker.replaceWith(element);
      };
    }, [element]), /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { ref: host, className: "studio-panel-content" });
  }
  function mountStudioPanelDialogs({
    root,
    closePanel,
    breakpoint = 960
  }) {
    let document2 = root.ownerDocument, window2 = document2.defaultView;
    if (!window2) return { destroy() {
    } };
    let left = root.querySelector(".design-navigator,.diagram-outline"), right = root.querySelector(".planr-review-rail");
    if (!left || !right) return { destroy() {
    } };
    let panels = { left, right }, mount = document2.createElement("div");
    mount.className = "studio-panel-mount", root.append(mount);
    let react = (0, import_client.createRoot)(mount), snapshot = "", wasCompact = !1, lastOpenSide = "left", listeners = /* @__PURE__ */ new Set(), read = () => {
      let width = root.getBoundingClientRect().width || window2.innerWidth, compact = width <= breakpoint;
      compact && !wasCompact && (wasCompact = !0, root.dataset.outlineOpen === "true" && closePanel("left")), wasCompact = compact;
      let next = width <= breakpoint ? root.dataset.designNavOpen === "true" || root.dataset.outlineOpen === "true" ? "left" : root.dataset.planrRailOpen === "true" ? "right" : "" : "";
      snapshot !== next && (next && (lastOpenSide = next), snapshot = next, listeners.forEach((listener) => {
        listener();
      }));
    };
    function Panels() {
      let side = (0, import_react4.useSyncExternalStore)(
        (listener) => (listeners.add(listener), () => listeners.delete(listener)),
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
            event.preventDefault(), root.querySelector(
              lastOpenSide === "left" ? "[data-design-toggle-nav],[data-action=outline]" : "[data-planr-action=feedback],[data-action=review]"
            )?.focus({ preventScroll: !0 });
          },
          onOpenChange: (open) => {
            !open && side && closePanel(side);
          },
          children: side && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(PersistentPanel, { element: panels[side === "left" ? "left" : "right"] }, side)
        }
      );
    }
    read(), (0, import_react_dom2.flushSync)(() => react.render(/* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Panels, {})));
    let observer = new window2.MutationObserver(read);
    observer.observe(root, {
      attributes: !0,
      attributeFilter: ["data-design-nav-open", "data-outline-open", "data-planr-rail-open"]
    });
    let resize = typeof window2.ResizeObserver == "function" ? new window2.ResizeObserver(read) : null;
    return resize?.observe(root), window2.addEventListener("resize", read), {
      destroy() {
        observer.disconnect(), resize?.disconnect(), window2.removeEventListener("resize", read), (0, import_react_dom2.flushSync)(() => react.unmount()), mount.remove();
      }
    };
  }
  function PreservedNode({ element }) {
    let host = (0, import_react4.useRef)(null);
    return (0, import_react4.useLayoutEffect)(() => {
      if (!element) return;
      let marker = element.ownerDocument.createComment("studio-control-home");
      return element.before(marker), host.current?.append(element), () => {
        marker.replaceWith(element);
      };
    }, [element]), /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { ref: host, className: "studio-preserved-control" });
  }