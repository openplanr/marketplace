
      function coerceFormActionProp(actionProp) {
        return actionProp == null || typeof actionProp == "symbol" || typeof actionProp == "boolean" ? null : typeof actionProp == "function" ? actionProp : sanitizeURL(actionProp);
      }
      function extractEvents$1(dispatchQueue, domEventName, maybeTargetInst, nativeEvent, nativeEventTarget) {
        if (domEventName === "submit" && maybeTargetInst && maybeTargetInst.stateNode === nativeEventTarget) {
          var action = coerceFormActionProp(
            (nativeEventTarget[internalPropsKey] || null).action
          ), submitter = nativeEvent.submitter;
          submitter && (domEventName = (domEventName = submitter[internalPropsKey] || null) ? coerceFormActionProp(domEventName.formAction) : submitter.getAttribute("formAction"), domEventName !== null && (action = domEventName, submitter = null));
          var event = new SyntheticEvent(
            "action",
            "action",
            null,
            nativeEvent,
            nativeEventTarget
          );
          dispatchQueue.push({
            event,
            listeners: [
              {
                instance: null,
                listener: function() {
                  if (nativeEvent.defaultPrevented) {
                    if (currentEventTransitionLane !== 0) {
                      var formData = new FormData(nativeEventTarget, submitter);
                      startHostTransition(
                        maybeTargetInst,
                        {
                          pending: !0,
                          data: formData,
                          method: nativeEventTarget.method,
                          action
                        },
                        null,
                        formData
                      );
                    }
                  } else
                    typeof action == "function" && (event.preventDefault(), formData = new FormData(nativeEventTarget, submitter), startHostTransition(
                      maybeTargetInst,
                      {
                        pending: !0,
                        data: formData,
                        method: nativeEventTarget.method,
                        action
                      },
                      action,
                      formData
                    ));
                },
                currentTarget: nativeEventTarget
              }
            ]
          });
        }
      }
      for (i$jscomp$inline_1667 = 0; i$jscomp$inline_1667 < simpleEventPluginEvents.length; i$jscomp$inline_1667++)
        eventName$jscomp$inline_1668 = simpleEventPluginEvents[i$jscomp$inline_1667], domEventName$jscomp$inline_1669 = eventName$jscomp$inline_1668.toLowerCase(), capitalizedEvent$jscomp$inline_1670 = eventName$jscomp$inline_1668[0].toUpperCase() + eventName$jscomp$inline_1668.slice(1), registerSimpleEvent(
          domEventName$jscomp$inline_1669,
          "on" + capitalizedEvent$jscomp$inline_1670
        );
      var eventName$jscomp$inline_1668, domEventName$jscomp$inline_1669, capitalizedEvent$jscomp$inline_1670, i$jscomp$inline_1667;
      registerSimpleEvent(ANIMATION_END, "onAnimationEnd");
      registerSimpleEvent(ANIMATION_ITERATION, "onAnimationIteration");
      registerSimpleEvent(ANIMATION_START, "onAnimationStart");
      registerSimpleEvent("dblclick", "onDoubleClick");
      registerSimpleEvent("focusin", "onFocus");
      registerSimpleEvent("focusout", "onBlur");
      registerSimpleEvent(TRANSITION_RUN, "onTransitionRun");
      registerSimpleEvent(TRANSITION_START, "onTransitionStart");
      registerSimpleEvent(TRANSITION_CANCEL, "onTransitionCancel");
      registerSimpleEvent(TRANSITION_END, "onTransitionEnd");
      registerDirectEvent("onMouseEnter", ["mouseout", "mouseover"]);
      registerDirectEvent("onMouseLeave", ["mouseout", "mouseover"]);
      registerDirectEvent("onPointerEnter", ["pointerout", "pointerover"]);
      registerDirectEvent("onPointerLeave", ["pointerout", "pointerover"]);
      registerTwoPhaseEvent(
        "onChange",
        "change click focusin focusout input keydown keyup selectionchange".split(" ")
      );
      registerTwoPhaseEvent(
        "onSelect",
        "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
          " "
        )
      );
      registerTwoPhaseEvent("onBeforeInput", [
        "compositionend",
        "keypress",
        "textInput",
        "paste"
      ]);
      registerTwoPhaseEvent(
        "onCompositionEnd",
        "compositionend focusout keydown keypress keyup mousedown".split(" ")
      );
      registerTwoPhaseEvent(
        "onCompositionStart",
        "compositionstart focusout keydown keypress keyup mousedown".split(" ")
      );
      registerTwoPhaseEvent(
        "onCompositionUpdate",
        "compositionupdate focusout keydown keypress keyup mousedown".split(" ")
      );
      var mediaEventTypes = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
        " "
      ), nonDelegatedEvents = new Set(
        "beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(mediaEventTypes)
      );
      function processDispatchQueue(dispatchQueue, eventSystemFlags) {
        eventSystemFlags = (eventSystemFlags & 4) !== 0;
        for (var i = 0; i < dispatchQueue.length; i++) {
          var _dispatchQueue$i = dispatchQueue[i], event = _dispatchQueue$i.event;
          _dispatchQueue$i = _dispatchQueue$i.listeners;
          a: {
            var previousInstance = void 0;
            if (eventSystemFlags)
              for (var i$jscomp$0 = _dispatchQueue$i.length - 1; 0 <= i$jscomp$0; i$jscomp$0--) {
                var _dispatchListeners$i = _dispatchQueue$i[i$jscomp$0], instance = _dispatchListeners$i.instance, currentTarget = _dispatchListeners$i.currentTarget;
                if (_dispatchListeners$i = _dispatchListeners$i.listener, instance !== previousInstance && event.isPropagationStopped())
                  break a;
                previousInstance = _dispatchListeners$i, event.currentTarget = currentTarget;
                try {
                  previousInstance(event);
                } catch (error) {
                  reportGlobalError(error);
                }
                event.currentTarget = null, previousInstance = instance;
              }
            else
              for (i$jscomp$0 = 0; i$jscomp$0 < _dispatchQueue$i.length; i$jscomp$0++) {
                if (_dispatchListeners$i = _dispatchQueue$i[i$jscomp$0], instance = _dispatchListeners$i.instance, currentTarget = _dispatchListeners$i.currentTarget, _dispatchListeners$i = _dispatchListeners$i.listener, instance !== previousInstance && event.isPropagationStopped())
                  break a;
                previousInstance = _dispatchListeners$i, event.currentTarget = currentTarget;
                try {
                  previousInstance(event);
                } catch (error) {
                  reportGlobalError(error);
                }
                event.currentTarget = null, previousInstance = instance;
              }
          }
        }
      }
      function listenToNonDelegatedEvent(domEventName, targetElement) {
        var JSCompiler_inline_result = targetElement[internalEventHandlersKey];
        JSCompiler_inline_result === void 0 && (JSCompiler_inline_result = targetElement[internalEventHandlersKey] = /* @__PURE__ */ new Set());
        var listenerSetKey = domEventName + "__bubble";
        JSCompiler_inline_result.has(listenerSetKey) || (addTrappedEventListener(targetElement, domEventName, 2, !1), JSCompiler_inline_result.add(listenerSetKey));
      }
      function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
        var eventSystemFlags = 0;
        isCapturePhaseListener && (eventSystemFlags |= 4), addTrappedEventListener(
          target,
          domEventName,
          eventSystemFlags,
          isCapturePhaseListener
        );
      }
      var listeningMarker = "_reactListening" + Math.random().toString(36).slice(2);
      function listenToAllSupportedEvents(rootContainerElement) {
        if (!rootContainerElement[listeningMarker]) {
          rootContainerElement[listeningMarker] = !0, allNativeEvents.forEach(function(domEventName) {
            domEventName !== "selectionchange" && (nonDelegatedEvents.has(domEventName) || listenToNativeEvent(domEventName, !1, rootContainerElement), listenToNativeEvent(domEventName, !0, rootContainerElement));
          });
          var ownerDocument = rootContainerElement.nodeType === 9 ? rootContainerElement : rootContainerElement.ownerDocument;
          ownerDocument === null || ownerDocument[listeningMarker] || (ownerDocument[listeningMarker] = !0, listenToNativeEvent("selectionchange", !1, ownerDocument));
        }
      }
      function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener) {
        switch (getEventPriority(domEventName)) {
          case 2:
            var listenerWrapper = dispatchDiscreteEvent;
            break;
          case 8:
            listenerWrapper = dispatchContinuousEvent;
            break;
          default:
            listenerWrapper = dispatchEvent;
        }
        eventSystemFlags = listenerWrapper.bind(
          null,
          domEventName,
          eventSystemFlags,
          targetContainer
        ), listenerWrapper = void 0, !passiveBrowserEventsSupported || domEventName !== "touchstart" && domEventName !== "touchmove" && domEventName !== "wheel" || (listenerWrapper = !0), isCapturePhaseListener ? listenerWrapper !== void 0 ? targetContainer.addEventListener(domEventName, eventSystemFlags, {
          capture: !0,
          passive: listenerWrapper
        }) : targetContainer.addEventListener(domEventName, eventSystemFlags, !0) : listenerWrapper !== void 0 ? targetContainer.addEventListener(domEventName, eventSystemFlags, {
          passive: listenerWrapper
        }) : targetContainer.addEventListener(domEventName, eventSystemFlags, !1);
      }
      function dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, targetInst$jscomp$0, targetContainer) {
        var ancestorInst = targetInst$jscomp$0;
        if ((eventSystemFlags & 1) === 0 && (eventSystemFlags & 2) === 0 && targetInst$jscomp$0 !== null)
          a: for (; ; ) {
            if (targetInst$jscomp$0 === null) return;
            var nodeTag = targetInst$jscomp$0.tag;
            if (nodeTag === 3 || nodeTag === 4) {
              var container = targetInst$jscomp$0.stateNode.containerInfo;
              if (container === targetContainer) break;
              if (nodeTag === 4)
                for (nodeTag = targetInst$jscomp$0.return; nodeTag !== null; ) {
                  var grandTag = nodeTag.tag;
                  if ((grandTag === 3 || grandTag === 4) && nodeTag.stateNode.containerInfo === targetContainer)
                    return;
                  nodeTag = nodeTag.return;
                }
              for (; container !== null; ) {
                if (nodeTag = getClosestInstanceFromNode(container), nodeTag === null) return;
                if (grandTag = nodeTag.tag, grandTag === 5 || grandTag === 6 || grandTag === 26 || grandTag === 27) {
                  targetInst$jscomp$0 = ancestorInst = nodeTag;
                  continue a;
                }
                container = container.parentNode;
              }
            }
            targetInst$jscomp$0 = targetInst$jscomp$0.return;
          }
        batchedUpdates$1(function() {
          var targetInst = ancestorInst, nativeEventTarget = getEventTarget(nativeEvent), dispatchQueue = [];
          a: {
            var reactName = topLevelEventsToReactNames.get(domEventName);
            if (reactName !== void 0) {
              var SyntheticEventCtor = SyntheticEvent, reactEventType = domEventName;
              switch (domEventName) {
                case "keypress":
                  if (getEventCharCode(nativeEvent) === 0) break a;
                case "keydown":
                case "keyup":
                  SyntheticEventCtor = SyntheticKeyboardEvent;
                  break;
                case "focusin":
                  reactEventType = "focus", SyntheticEventCtor = SyntheticFocusEvent;
                  break;
                case "focusout":
                  reactEventType = "blur", SyntheticEventCtor = SyntheticFocusEvent;
                  break;
                case "beforeblur":
                case "afterblur":
                  SyntheticEventCtor = SyntheticFocusEvent;
                  break;
                case "click":
                  if (nativeEvent.button === 2) break a;
                case "auxclick":
                case "dblclick":
                case "mousedown":
                case "mousemove":
                case "mouseup":
                case "mouseout":
                case "mouseover":
                case "contextmenu":
                  SyntheticEventCtor = SyntheticMouseEvent;
                  break;
                case "drag":
                case "dragend":
                case "dragenter":
                case "dragexit":
                case "dragleave":
                case "dragover":
                case "dragstart":
                case "drop":
                  SyntheticEventCtor = SyntheticDragEvent;
                  break;
                case "touchcancel":
                case "touchend":
                case "touchmove":
                case "touchstart":
                  SyntheticEventCtor = SyntheticTouchEvent;
                  break;
                case ANIMATION_END:
                case ANIMATION_ITERATION:
                case ANIMATION_START:
                  SyntheticEventCtor = SyntheticAnimationEvent;
                  break;
                case TRANSITION_END:
                  SyntheticEventCtor = SyntheticTransitionEvent;
                  break;
                case "scroll":
                case "scrollend":
                  SyntheticEventCtor = SyntheticUIEvent;
                  break;
                case "wheel":
                  SyntheticEventCtor = SyntheticWheelEvent;
                  break;
                case "copy":
                case "cut":
                case "paste":
                  SyntheticEventCtor = SyntheticClipboardEvent;
                  break;
                case "gotpointercapture":
                case "lostpointercapture":
                case "pointercancel":
                case "pointerdown":
                case "pointermove":
                case "pointerout":
                case "pointerover":
                case "pointerup":
                  SyntheticEventCtor = SyntheticPointerEvent;
                  break;
                case "submit":
                  SyntheticEventCtor = SyntheticSubmitEvent;
                  break;
                case "toggle":
                case "beforetoggle":
                  SyntheticEventCtor = SyntheticToggleEvent;
              }
              var inCapturePhase = (eventSystemFlags & 4) !== 0, accumulateTargetOnly = !inCapturePhase && (domEventName === "scroll" || domEventName === "scrollend"), reactEventName = inCapturePhase ? reactName !== null ? reactName + "Capture" : null : reactName;
              inCapturePhase = [];
              for (var instance = targetInst, lastHostComponent; instance !== null; ) {
                var _instance = instance;
                if (lastHostComponent = _instance.stateNode, _instance = _instance.tag, _instance !== 5 && _instance !== 26 && _instance !== 27 || lastHostComponent === null || reactEventName === null || (_instance = getListener(instance, reactEventName), _instance != null && inCapturePhase.push(
                  createDispatchListener(instance, _instance, lastHostComponent)
                )), accumulateTargetOnly) break;
                instance = instance.return;
              }
              0 < inCapturePhase.length && (reactName = new SyntheticEventCtor(
                reactName,
                reactEventType,
                null,
                nativeEvent,
                nativeEventTarget
              ), dispatchQueue.push({ event: reactName, listeners: inCapturePhase }));
            }
          }
          if ((eventSystemFlags & 7) === 0) {
            a: {
              if (SyntheticEventCtor = domEventName === "mouseover" || domEventName === "pointerover", reactName = domEventName === "mouseout" || domEventName === "pointerout", SyntheticEventCtor && nativeEvent !== currentReplayingEvent && (reactEventType = nativeEvent.relatedTarget || nativeEvent.fromElement) && (getClosestInstanceFromNode(reactEventType) || reactEventType[internalContainerInstanceKey]))
                break a;
              (reactName || SyntheticEventCtor) && (reactEventType = nativeEventTarget.window === nativeEventTarget ? nativeEventTarget : (SyntheticEventCtor = nativeEventTarget.ownerDocument) ? SyntheticEventCtor.defaultView || SyntheticEventCtor.parentWindow : window, reactName ? (SyntheticEventCtor = nativeEvent.relatedTarget || nativeEvent.toElement, reactName = targetInst, SyntheticEventCtor = SyntheticEventCtor ? getClosestInstanceFromNode(SyntheticEventCtor) : null, SyntheticEventCtor !== null && (accumulateTargetOnly = getNearestMountedFiber(SyntheticEventCtor), inCapturePhase = SyntheticEventCtor.tag, SyntheticEventCtor !== accumulateTargetOnly || inCapturePhase !== 5 && inCapturePhase !== 27 && inCapturePhase !== 6) && (SyntheticEventCtor = null)) : (reactName = null, SyntheticEventCtor = targetInst), reactName !== SyntheticEventCtor && (inCapturePhase = SyntheticMouseEvent, _instance = "onMouseLeave", reactEventName = "onMouseEnter", instance = "mouse", (domEventName === "pointerout" || domEventName === "pointerover") && (inCapturePhase = SyntheticPointerEvent, _instance = "onPointerLeave", reactEventName = "onPointerEnter", instance = "pointer"), accumulateTargetOnly = reactName == null ? reactEventType : getNodeFromInstance(reactName), lastHostComponent = SyntheticEventCtor == null ? reactEventType : getNodeFromInstance(SyntheticEventCtor), reactEventType = new inCapturePhase(
                _instance,
                instance + "leave",
                reactName,
                nativeEvent,
                nativeEventTarget
              ), reactEventType.target = accumulateTargetOnly, reactEventType.relatedTarget = lastHostComponent, _instance = null, getClosestInstanceFromNode(nativeEventTarget) === targetInst && (inCapturePhase = new inCapturePhase(
                reactEventName,
                instance + "enter",
                SyntheticEventCtor,
                nativeEvent,
                nativeEventTarget
              ), inCapturePhase.target = lastHostComponent, inCapturePhase.relatedTarget = accumulateTargetOnly, _instance = inCapturePhase), accumulateTargetOnly = _instance, inCapturePhase = reactName && SyntheticEventCtor ? getLowestCommonAncestor(
                reactName,
                SyntheticEventCtor,
                getParent
              ) : null, reactName !== null && accumulateEnterLeaveListenersForEvent(
                dispatchQueue,
                reactEventType,
                reactName,
                inCapturePhase,
                !1
              ), SyntheticEventCtor !== null && accumulateTargetOnly !== null && accumulateEnterLeaveListenersForEvent(
                dispatchQueue,
                accumulateTargetOnly,
                SyntheticEventCtor,
                inCapturePhase,
                !0
              )));
            }
            a: {
              if (reactName = targetInst ? getNodeFromInstance(targetInst) : window, SyntheticEventCtor = reactName.nodeName && reactName.nodeName.toLowerCase(), SyntheticEventCtor === "select" || SyntheticEventCtor === "input" && reactName.type === "file")
                var getTargetInstFunc = getTargetInstForChangeEvent;
              else if (isTextInputElement(reactName))
                if (isInputEventSupported)
                  getTargetInstFunc = getTargetInstForInputOrChangeEvent;
                else {
                  getTargetInstFunc = getTargetInstForInputEventPolyfill;
                  var handleEventFunc = handleEventsForInputEventPolyfill;
                }
              else
                SyntheticEventCtor = reactName.nodeName, !SyntheticEventCtor || SyntheticEventCtor.toLowerCase() !== "input" || reactName.type !== "checkbox" && reactName.type !== "radio" ? targetInst && isCustomElement(targetInst.elementType) && (getTargetInstFunc = getTargetInstForChangeEvent) : getTargetInstFunc = getTargetInstForClickEvent;
              if (getTargetInstFunc && (getTargetInstFunc = getTargetInstFunc(domEventName, targetInst))) {
                createAndAccumulateChangeEvent(
                  dispatchQueue,
                  getTargetInstFunc,
                  nativeEvent,
                  nativeEventTarget
                );
                break a;
              }
              handleEventFunc && handleEventFunc(domEventName, reactName, targetInst);
            }
            switch (handleEventFunc = targetInst ? getNodeFromInstance(targetInst) : window, domEventName) {
              case "focusin":
                (isTextInputElement(handleEventFunc) || handleEventFunc.contentEditable === "true") && (activeElement = handleEventFunc, activeElementInst = targetInst, lastSelection = null);
                break;
              case "focusout":
                lastSelection = activeElementInst = activeElement = null;
                break;
              case "mousedown":
                mouseDown = !0;
                break;
              case "contextmenu":
              case "mouseup":
              case "dragend":
                mouseDown = !1, constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
                break;
              case "selectionchange":
                if (skipSelectionChangeEvent) break;
              case "keydown":
              case "keyup":
                constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
            }
            var fallbackData;
            if (canUseCompositionEvent)
              b: {
                switch (domEventName) {
                  case "compositionstart":
                    var eventType = "onCompositionStart";
                    break b;
                  case "compositionend":
                    eventType = "onCompositionEnd";
                    break b;
                  case "compositionupdate":
                    eventType = "onCompositionUpdate";
                    break b;
                }
                eventType = void 0;
              }
            else
              isComposing ? isFallbackCompositionEnd(domEventName, nativeEvent) && (eventType = "onCompositionEnd") : domEventName === "keydown" && nativeEvent.keyCode === 229 && (eventType = "onCompositionStart");
            eventType && (useFallbackCompositionData && nativeEvent.locale !== "ko" && (isComposing || eventType !== "onCompositionStart" ? eventType === "onCompositionEnd" && isComposing && (fallbackData = getData()) : (root = nativeEventTarget, startText = "value" in root ? root.value : root.textContent, isComposing = !0)), handleEventFunc = accumulateTwoPhaseListeners(targetInst, eventType), 0 < handleEventFunc.length && (eventType = new SyntheticCompositionEvent(
              eventType,
              domEventName,
              null,
              nativeEvent,
              nativeEventTarget
            ), dispatchQueue.push({ event: eventType, listeners: handleEventFunc }), fallbackData ? eventType.data = fallbackData : (fallbackData = getDataFromCustomEvent(nativeEvent), fallbackData !== null && (eventType.data = fallbackData)))), (fallbackData = canUseTextInputEvent ? getNativeBeforeInputChars(domEventName, nativeEvent) : getFallbackBeforeInputChars(domEventName, nativeEvent)) && (eventType = accumulateTwoPhaseListeners(targetInst, "onBeforeInput"), 0 < eventType.length && (handleEventFunc = new SyntheticCompositionEvent(
              "onBeforeInput",
              "beforeinput",
              null,
              nativeEvent,
              nativeEventTarget
            ), dispatchQueue.push({
              event: handleEventFunc,
              listeners: eventType
            }), handleEventFunc.data = fallbackData)), extractEvents$1(
              dispatchQueue,
              domEventName,
              targetInst,
              nativeEvent,
              nativeEventTarget
            );
          }
          processDispatchQueue(dispatchQueue, eventSystemFlags);
        });
      }
      function createDispatchListener(instance, listener, currentTarget) {
        return {
          instance,
          listener,
          currentTarget
        };
      }
      function accumulateTwoPhaseListeners(targetFiber, reactName) {
        for (var captureName = reactName + "Capture", listeners = []; targetFiber !== null; ) {
          var _instance2 = targetFiber, stateNode = _instance2.stateNode;
          if (_instance2 = _instance2.tag, _instance2 !== 5 && _instance2 !== 26 && _instance2 !== 27 || stateNode === null || (_instance2 = getListener(targetFiber, captureName), _instance2 != null && listeners.unshift(
            createDispatchListener(targetFiber, _instance2, stateNode)
          ), _instance2 = getListener(targetFiber, reactName), _instance2 != null && listeners.push(
            createDispatchListener(targetFiber, _instance2, stateNode)
          )), targetFiber.tag === 3) return listeners;
          targetFiber = targetFiber.return;
        }
        return [];
      }
      function getParent(inst) {
        if (inst === null) return null;
        do
          inst = inst.return;
        while (inst && inst.tag !== 5 && inst.tag !== 27);
        return inst || null;
      }
      function accumulateEnterLeaveListenersForEvent(dispatchQueue, event, target, common, inCapturePhase) {
        for (var registrationName = event._reactName, listeners = []; target !== null && target !== common; ) {
          var _instance3 = target, alternate = _instance3.alternate, stateNode = _instance3.stateNode;
          if (_instance3 = _instance3.tag, alternate !== null && alternate === common) break;
          _instance3 !== 5 && _instance3 !== 26 && _instance3 !== 27 || stateNode === null || (alternate = stateNode, inCapturePhase ? (stateNode = getListener(target, registrationName), stateNode != null && listeners.unshift(
            createDispatchListener(target, stateNode, alternate)
          )) : inCapturePhase || (stateNode = getListener(target, registrationName), stateNode != null && listeners.push(
            createDispatchListener(target, stateNode, alternate)
          ))), target = target.return;
        }
        listeners.length !== 0 && dispatchQueue.push({ event, listeners });
      }
      var NORMALIZE_NEWLINES_REGEX = /\r\n?/g, NORMALIZE_NULL_AND_REPLACEMENT_REGEX = /\u0000|\uFFFD/g;
      function normalizeMarkupForTextOrAttribute(markup) {
        return (typeof markup == "string" ? markup : "" + markup).replace(NORMALIZE_NEWLINES_REGEX, `
`).replace(NORMALIZE_NULL_AND_REPLACEMENT_REGEX, "");
      }
      function checkForUnmatchedText(serverText, clientText) {
        return clientText = normalizeMarkupForTextOrAttribute(clientText), normalizeMarkupForTextOrAttribute(serverText) === clientText;
      }
      function setProp(domElement, tag, key, value, props, prevValue) {
        switch (key) {
          case "children":
            if (typeof value == "string")
              tag === "body" || tag === "textarea" && value === "" || setTextContent(domElement, value);
            else if (typeof value == "number" || typeof value == "bigint")
              tag !== "body" && setTextContent(domElement, "" + value);
            else return;
            break;
          case "className":
            setValueForKnownAttribute(domElement, "class", value);
            break;
          case "tabIndex":
            setValueForKnownAttribute(domElement, "tabindex", value);
            break;
          case "dir":
          case "role":
          case "viewBox":
          case "width":
          case "height":
            setValueForKnownAttribute(domElement, key, value);
            break;
          case "style":
            setValueForStyles(domElement, value, prevValue);
            return;
          case "data":
            if (tag !== "object") {
              setValueForKnownAttribute(domElement, "data", value);
              break;
            }
          case "src":
          case "href":
            if (value === "" && (tag !== "a" || key !== "href")) {
              domElement.removeAttribute(key);
              break;
            }
            if (value == null || typeof value == "function" || typeof value == "symbol" || typeof value == "boolean") {
              domElement.removeAttribute(key);
              break;
            }
            value = sanitizeURL(value), domElement.setAttribute(key, value);
            break;
          case "action":
          case "formAction":
            if (typeof value == "function") {
              domElement.setAttribute(
                key,
                "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')"
              );
              break;
            } else
              typeof prevValue == "function" && (key === "formAction" ? (tag !== "input" && setProp(domElement, tag, "name", props.name, props, null), setProp(
                domElement,
                tag,
                "formEncType",
                props.formEncType,
                props,
                null
              ), setProp(
                domElement,
                tag,
                "formMethod",
                props.formMethod,
                props,
                null
              ), setProp(
                domElement,
                tag,
                "formTarget",
                props.formTarget,
                props,
                null
              )) : (setProp(domElement, tag, "encType", props.encType, props, null), setProp(domElement, tag, "method", props.method, props, null), setProp(domElement, tag, "target", props.target, props, null)));
            if (value == null || typeof value == "symbol" || typeof value == "boolean") {
              domElement.removeAttribute(key);
              break;
            }
            value = sanitizeURL(value), domElement.setAttribute(key, value);
            break;
          case "onClick":
            value != null && (domElement.onclick = noop$1);
            return;
          case "onScroll":
            value != null && listenToNonDelegatedEvent("scroll", domElement);
            return;
          case "onScrollEnd":
            value != null && listenToNonDelegatedEvent("scrollend", domElement);
            return;
          case "dangerouslySetInnerHTML":
            if (value != null) {
              if (typeof value != "object" || !("__html" in value))
                throw Error(formatProdErrorMessage(61));
              if (key = value.__html, key != null) {
                if (props.children != null) throw Error(formatProdErrorMessage(60));
                prevValue?.__html !== key && (domElement.innerHTML = key);
              }
            }
            break;
          case "multiple":
            domElement.multiple = value && typeof value != "function" && typeof value != "symbol";
            break;
          case "muted":
            domElement.muted = value && typeof value != "function" && typeof value != "symbol";
            break;
          case "suppressContentEditableWarning":
          case "suppressHydrationWarning":
          case "defaultValue":
          case "defaultChecked":
          case "innerHTML":
          case "ref":
            break;
          case "autoFocus":
            break;
          case "xlinkHref":
            if (value == null || typeof value == "function" || typeof value == "boolean" || typeof value == "symbol") {
              domElement.removeAttribute("xlink:href");
              break;
            }
            key = sanitizeURL(value), domElement.setAttributeNS(
              "http://www.w3.org/1999/xlink",
              "xlink:href",
              key
            );
            break;
          case "contentEditable":
          case "spellCheck":
          case "draggable":
          case "value":
          case "autoReverse":
          case "externalResourcesRequired":
          case "focusable":
          case "preserveAlpha":
            value != null && typeof value != "function" && typeof value != "symbol" ? domElement.setAttribute(key, value) : domElement.removeAttribute(key);
            break;
          case "inert":
          case "allowFullScreen":
          case "async":
          case "autoPlay":
          case "controls":
          case "credentialless":
          case "default":
          case "defer":
          case "disabled":
          case "disablePictureInPicture":
          case "disableRemotePlayback":
          case "formNoValidate":
          case "hidden":
          case "loop":
          case "noModule":
          case "noValidate":
          case "open":
          case "playsInline":
          case "readOnly":
          case "required":
          case "reversed":
          case "scoped":
          case "seamless":
          case "itemScope":
            value && typeof value != "function" && typeof value != "symbol" ? domElement.setAttribute(key, "") : domElement.removeAttribute(key);
            break;
          case "capture":
          case "download":
            value === !0 ? domElement.setAttribute(key, "") : value !== !1 && value != null && typeof value != "function" && typeof value != "symbol" ? domElement.setAttribute(key, value) : domElement.removeAttribute(key);
            break;
          case "cols":
          case "rows":
          case "size":
          case "span":
            value != null && typeof value != "function" && typeof value != "symbol" && !isNaN(value) && 1 <= value ? domElement.setAttribute(key, value) : domElement.removeAttribute(key);
            break;
          case "rowSpan":
          case "start":
            value == null || typeof value == "function" || typeof value == "symbol" || isNaN(value) ? domElement.removeAttribute(key) : domElement.setAttribute(key, value);
            break;
          case "popover":
            listenToNonDelegatedEvent("beforetoggle", domElement), listenToNonDelegatedEvent("toggle", domElement), setValueForAttribute(domElement, "popover", value);
            break;
          case "xlinkActuate":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:actuate",
              value
            );
            break;
          case "xlinkArcrole":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:arcrole",
              value
            );
            break;
          case "xlinkRole":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:role",
              value
            );
            break;
          case "xlinkShow":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:show",
              value
            );
            break;
          case "xlinkTitle":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:title",
              value
            );
            break;
          case "xlinkType":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:type",
              value
            );
            break;
          case "xmlBase":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/XML/1998/namespace",
              "xml:base",
              value
            );
            break;
          case "xmlLang":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/XML/1998/namespace",
              "xml:lang",
              value
            );
            break;
          case "xmlSpace":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/XML/1998/namespace",
              "xml:space",
              value
            );
            break;
          case "is":
            setValueForAttribute(domElement, "is", value);
            break;
          case "innerText":
          case "textContent":
            return;
          default:
            if (!(2 < key.length) || key[0] !== "o" && key[0] !== "O" || key[1] !== "n" && key[1] !== "N")
              key = aliases.get(key) || key, setValueForAttribute(domElement, key, value);
            else return;
        }
        viewTransitionMutationContext = !0;
      }
      function setPropOnCustomElement(domElement, tag, key, value, props, prevValue) {
        switch (key) {
          case "style":
            setValueForStyles(domElement, value, prevValue);
            return;
          case "dangerouslySetInnerHTML":
            if (value != null) {
              if (typeof value != "object" || !("__html" in value))
                throw Error(formatProdErrorMessage(61));
              if (key = value.__html, key != null) {
                if (props.children != null) throw Error(formatProdErrorMessage(60));
                prevValue?.__html !== key && (domElement.innerHTML = key);
              }
            }
            break;
          case "children":
            if (typeof value == "string") setTextContent(domElement, value);
            else if (typeof value == "number" || typeof value == "bigint")
              setTextContent(domElement, "" + value);
            else return;
            break;
          case "onScroll":
            value != null && listenToNonDelegatedEvent("scroll", domElement);
            return;
          case "onScrollEnd":
            value != null && listenToNonDelegatedEvent("scrollend", domElement);
            return;
          case "onClick":
            value != null && (domElement.onclick = noop$1);
            return;
          case "suppressContentEditableWarning":
          case "suppressHydrationWarning":
          case "innerHTML":
          case "ref":
            return;
          case "innerText":
          case "textContent":
            return;
          default:
            if (!registrationNameDependencies.hasOwnProperty(key))
              a: {
                if (key[0] === "o" && key[1] === "n" && (props = key.endsWith("Capture"), prevValue = key.slice(2, props ? key.length - 7 : void 0), tag = domElement[internalPropsKey] || null, tag = tag != null ? tag[key] : null, typeof tag == "function" && domElement.removeEventListener(prevValue, tag, props), typeof value == "function")) {
                  typeof tag != "function" && tag !== null && (key in domElement ? domElement[key] = null : domElement.hasAttribute(key) && domElement.removeAttribute(key)), domElement.addEventListener(prevValue, value, props);
                  break a;
                }
                viewTransitionMutationContext = !0, key in domElement ? domElement[key] = value : value === !0 ? domElement.setAttribute(key, "") : setValueForAttribute(domElement, key, value);
              }
            return;
        }
        viewTransitionMutationContext = !0;
      }
      function setInitialProperties(domElement, tag, props) {
        switch (tag) {
          case "div":
          case "span":
          case "svg":
          case "path":
          case "a":
          case "g":
          case "p":
          case "li":
            break;
          case "img":
            listenToNonDelegatedEvent("error", domElement), listenToNonDelegatedEvent("load", domElement);
            var hasSrc = !1, hasSrcSet = !1, propKey;
            for (propKey in props)
              if (props.hasOwnProperty(propKey)) {
                var propValue = props[propKey];
                if (propValue != null)
                  switch (propKey) {
                    case "src":
                      hasSrc = !0;
                      break;
                    case "srcSet":
                      hasSrcSet = !0;
                      break;
                    case "children":
                    case "dangerouslySetInnerHTML":
                      throw Error(formatProdErrorMessage(137, tag));
                    default:
                      setProp(domElement, tag, propKey, propValue, props, null);
                  }
              }
            hasSrcSet && setProp(domElement, tag, "srcSet", props.srcSet, props, null), hasSrc && setProp(domElement, tag, "src", props.src, props, null);
            return;
          case "input":
            listenToNonDelegatedEvent("invalid", domElement);
            var defaultValue = propKey = propValue = hasSrcSet = null, checked = null, defaultChecked = null;
            for (hasSrc in props)
              if (props.hasOwnProperty(hasSrc)) {
                var propValue$204 = props[hasSrc];
                if (propValue$204 != null)
                  switch (hasSrc) {
                    case "name":
                      hasSrcSet = propValue$204;
                      break;
                    case "type":
                      propValue = propValue$204;
                      break;
                    case "checked":
                      checked = propValue$204;
                      break;
                    case "defaultChecked":
                      defaultChecked = propValue$204;
                      break;
                    case "value":
                      propKey = propValue$204;
                      break;
                    case "defaultValue":
                      defaultValue = propValue$204;
                      break;
                    case "children":
                    case "dangerouslySetInnerHTML":
                      if (propValue$204 != null)
                        throw Error(formatProdErrorMessage(137, tag));
                      break;
                    default:
                      setProp(domElement, tag, hasSrc, propValue$204, props, null);
                  }
              }
            initInput(
              domElement,
              propKey,
              defaultValue,
              checked,
              defaultChecked,
              propValue,
              hasSrcSet,
              !1
            );
            return;
          case "select":
            listenToNonDelegatedEvent("invalid", domElement), hasSrc = propValue = propKey = null;
            for (hasSrcSet in props)
              if (props.hasOwnProperty(hasSrcSet) && (defaultValue = props[hasSrcSet], defaultValue != null))
                switch (hasSrcSet) {
                  case "value":
                    propKey = defaultValue;
                    break;
                  case "defaultValue":
                    propValue = defaultValue;
                    break;
                  case "multiple":
                    hasSrc = defaultValue;
                  default:
                    setProp(domElement, tag, hasSrcSet, defaultValue, props, null);
                }
            tag = propKey, props = propValue, domElement.multiple = !!hasSrc, tag != null ? updateOptions(domElement, !!hasSrc, tag, !1) : props != null && updateOptions(domElement, !!hasSrc, props, !0);
            return;
          case "textarea":
            listenToNonDelegatedEvent("invalid", domElement), propKey = hasSrcSet = hasSrc = null;
            for (propValue in props)
              if (props.hasOwnProperty(propValue) && (defaultValue = props[propValue], defaultValue != null))
                switch (propValue) {
                  case "value":
                    hasSrc = defaultValue;
                    break;
                  case "defaultValue":
                    hasSrcSet = defaultValue;
                    break;
                  case "children":
                    propKey = defaultValue;
                    break;
                  case "dangerouslySetInnerHTML":
                    if (defaultValue != null) throw Error(formatProdErrorMessage(91));
                    break;
                  default:
                    setProp(domElement, tag, propValue, defaultValue, props, null);
                }
            initTextarea(domElement, hasSrc, hasSrcSet, propKey);
            return;
          case "option":
            for (checked in props)
              props.hasOwnProperty(checked) && (hasSrc = props[checked], hasSrc != null) && (checked === "selected" ? domElement.selected = hasSrc && typeof hasSrc != "function" && typeof hasSrc != "symbol" : setProp(domElement, tag, checked, hasSrc, props, null));
            return;
          case "dialog":
            listenToNonDelegatedEvent("beforetoggle", domElement), listenToNonDelegatedEvent("toggle", domElement), listenToNonDelegatedEvent("cancel", domElement), listenToNonDelegatedEvent("close", domElement);
            break;
          case "iframe":
          case "object":
            listenToNonDelegatedEvent("load", domElement);
            break;
          case "video":
          case "audio":
            for (hasSrc = 0; hasSrc < mediaEventTypes.length; hasSrc++)
              listenToNonDelegatedEvent(mediaEventTypes[hasSrc], domElement);
            break;
          case "image":
            listenToNonDelegatedEvent("error", domElement), listenToNonDelegatedEvent("load", domElement);
            break;
          case "details":
            listenToNonDelegatedEvent("toggle", domElement);
            break;
          case "embed":
          case "source":
          case "link":
            listenToNonDelegatedEvent("error", domElement), listenToNonDelegatedEvent("load", domElement);
          case "area":
          case "base":
          case "br":
          case "col":
          case "hr":
          case "keygen":
          case "meta":
          case "param":
          case "track":
          case "wbr":
          case "menuitem":
            for (defaultChecked in props)
              if (props.hasOwnProperty(defaultChecked) && (hasSrc = props[defaultChecked], hasSrc != null))
                switch (defaultChecked) {
                  case "children":
                  case "dangerouslySetInnerHTML":
                    throw Error(formatProdErrorMessage(137, tag));
                  default:
                    setProp(domElement, tag, defaultChecked, hasSrc, props, null);
                }
            return;
          default:
            if (isCustomElement(tag)) {
              for (propValue$204 in props)
                props.hasOwnProperty(propValue$204) && (hasSrc = props[propValue$204], hasSrc !== void 0 && setPropOnCustomElement(
                  domElement,
                  tag,
                  propValue$204,
                  hasSrc,
                  props,
                  void 0
                ));
              return;
            }
        }
        for (defaultValue in props)
          props.hasOwnProperty(defaultValue) && (hasSrc = props[defaultValue], hasSrc != null && setProp(domElement, tag, defaultValue, hasSrc, props, null));
      }
      var emptyProps = {};
      function updateProperties(domElement, tag, lastProps, nextProps) {
        switch (tag) {
          case "div":
          case "span":
          case "svg":
          case "path":
          case "a":
          case "g":
          case "p":
          case "li":
            break;
          case "input":
            var name = null, type = null, value = null, defaultValue = null, lastDefaultValue = null, checked = null, defaultChecked = null;
            for (propKey in lastProps) {
              var lastProp = lastProps[propKey];
              if (lastProps.hasOwnProperty(propKey) && lastProp != null)
                switch (propKey) {
                  case "checked":
                    break;
                  case "value":
                    break;
                  case "defaultValue":
                    lastDefaultValue = lastProp;
                  default:
                    nextProps.hasOwnProperty(propKey) || setProp(domElement, tag, propKey, null, nextProps, lastProp);
                }
            }
            for (var propKey$221 in nextProps) {
              var propKey = nextProps[propKey$221];
              if (lastProp = lastProps[propKey$221], nextProps.hasOwnProperty(propKey$221) && (propKey != null || lastProp != null))
                switch (propKey$221) {
                  case "type":
                    propKey !== lastProp && (viewTransitionMutationContext = !0), type = propKey;
                    break;
                  case "name":
                    propKey !== lastProp && (viewTransitionMutationContext = !0), name = propKey;
                    break;
                  case "checked":
                    propKey !== lastProp && (viewTransitionMutationContext = !0), checked = propKey;
                    break;
                  case "defaultChecked":
                    propKey !== lastProp && (viewTransitionMutationContext = !0), defaultChecked = propKey;
                    break;
                  case "value":
                    propKey !== lastProp && (viewTransitionMutationContext = !0), value = propKey;
                    break;
                  case "defaultValue":
                    propKey !== lastProp && (viewTransitionMutationContext = !0), defaultValue = propKey;
                    break;
                  case "children":
                  case "dangerouslySetInnerHTML":
                    if (propKey != null)
                      throw Error(formatProdErrorMessage(137, tag));
                    break;
                  default:
                    propKey !== lastProp && setProp(
                      domElement,
                      tag,
                      propKey$221,
                      propKey,
                      nextProps,
                      lastProp
                    );
                }
            }
            updateInput(
              domElement,
              value,
              defaultValue,
              lastDefaultValue,
              checked,
              defaultChecked,
              type,
              name
            );
            return;
          case "select":
            propKey = value = defaultValue = propKey$221 = null;
            for (type in lastProps)
              if (lastDefaultValue = lastProps[type], lastProps.hasOwnProperty(type) && lastDefaultValue != null)
                switch (type) {
                  case "value":
                    break;
                  case "multiple":
                    propKey = lastDefaultValue;
                  default:
                    nextProps.hasOwnProperty(type) || setProp(
                      domElement,
                      tag,
                      type,
                      null,
                      nextProps,
                      lastDefaultValue
                    );
                }
            for (name in nextProps)
              if (type = nextProps[name], lastDefaultValue = lastProps[name], nextProps.hasOwnProperty(name) && (type != null || lastDefaultValue != null))
                switch (name) {
                  case "value":
                    type !== lastDefaultValue && (viewTransitionMutationContext = !0), propKey$221 = type;
                    break;
                  case "defaultValue":
                    type !== lastDefaultValue && (viewTransitionMutationContext = !0), defaultValue = type;
                    break;
                  case "multiple":
                    type !== lastDefaultValue && (viewTransitionMutationContext = !0), value = type;
                  default:
                    type !== lastDefaultValue && setProp(
                      domElement,
                      tag,
                      name,
                      type,
                      nextProps,
                      lastDefaultValue
                    );
                }
            tag = defaultValue, lastProps = value, nextProps = propKey, propKey$221 != null ? updateOptions(domElement, !!lastProps, propKey$221, !1) : !!nextProps != !!lastProps && (tag != null ? updateOptions(domElement, !!lastProps, tag, !0) : updateOptions(domElement, !!lastProps, lastProps ? [] : "", !1));
            return;
          case "textarea":
            propKey = propKey$221 = null;
            for (defaultValue in lastProps)
              if (name = lastProps[defaultValue], lastProps.hasOwnProperty(defaultValue) && name != null && !nextProps.hasOwnProperty(defaultValue))
                switch (defaultValue) {
                  case "value":
                    break;
                  case "children":
                    break;
                  default:
                    setProp(domElement, tag, defaultValue, null, nextProps, name);
                }
            for (value in nextProps)
              if (name = nextProps[value], type = lastProps[value], nextProps.hasOwnProperty(value) && (name != null || type != null))
                switch (value) {
                  case "value":
                    name !== type && (viewTransitionMutationContext = !0), propKey$221 = name;
                    break;
                  case "defaultValue":
                    name !== type && (viewTransitionMutationContext = !0), propKey = name;
                    break;
                  case "children":
                    break;
                  case "dangerouslySetInnerHTML":
                    if (name != null) throw Error(formatProdErrorMessage(91));
                    break;
                  default:
                    name !== type && setProp(domElement, tag, value, name, nextProps, type);
                }
            updateTextarea(domElement, propKey$221, propKey);
            return;
          case "option":
            for (var propKey$237 in lastProps)
              propKey$221 = lastProps[propKey$237], lastProps.hasOwnProperty(propKey$237) && propKey$221 != null && !nextProps.hasOwnProperty(propKey$237) && (propKey$237 === "selected" ? domElement.selected = !1 : setProp(
                domElement,
                tag,
                propKey$237,
                null,
                nextProps,
                propKey$221
              ));
            for (lastDefaultValue in nextProps)
              propKey$221 = nextProps[lastDefaultValue], propKey = lastProps[lastDefaultValue], nextProps.hasOwnProperty(lastDefaultValue) && propKey$221 !== propKey && (propKey$221 != null || propKey != null) && (lastDefaultValue === "selected" ? (propKey$221 !== propKey && (viewTransitionMutationContext = !0), domElement.selected = propKey$221 && typeof propKey$221 != "function" && typeof propKey$221 != "symbol") : setProp(
                domElement,
                tag,
                lastDefaultValue,
                propKey$221,
                nextProps,
                propKey
              ));
            return;
          case "img":
          case "link":
          case "area":
          case "base":
          case "br":
          case "col":
          case "embed":
          case "hr":
          case "keygen":
          case "meta":
          case "param":
          case "source":
          case "track":
          case "wbr":
          case "menuitem":
            for (var propKey$242 in lastProps)
              propKey$221 = lastProps[propKey$242], lastProps.hasOwnProperty(propKey$242) && propKey$221 != null && !nextProps.hasOwnProperty(propKey$242) && setProp(domElement, tag, propKey$242, null, nextProps, propKey$221);
            for (checked in nextProps)
              if (propKey$221 = nextProps[checked], propKey = lastProps[checked], nextProps.hasOwnProperty(checked) && propKey$221 !== propKey && (propKey$221 != null || propKey != null))
                switch (checked) {
                  case "children":
                  case "dangerouslySetInnerHTML":
                    if (propKey$221 != null)
                      throw Error(formatProdErrorMessage(137, tag));
                    break;
                  default:
                    setProp(
                      domElement,
                      tag,
                      checked,
                      propKey$221,
                      nextProps,
                      propKey
                    );
                }
            return;
          default:
            if (isCustomElement(tag)) {
              for (var propKey$247 in lastProps)
                propKey$221 = lastProps[propKey$247], lastProps.hasOwnProperty(propKey$247) && propKey$221 !== void 0 && !nextProps.hasOwnProperty(propKey$247) && setPropOnCustomElement(
                  domElement,
                  tag,
                  propKey$247,
                  void 0,
                  nextProps,
                  propKey$221
                );
              for (defaultChecked in nextProps)
                propKey$221 = nextProps[defaultChecked], propKey = lastProps[defaultChecked], !nextProps.hasOwnProperty(defaultChecked) || propKey$221 === propKey || propKey$221 === void 0 && propKey === void 0 || setPropOnCustomElement(
                  domElement,
                  tag,
                  defaultChecked,
                  propKey$221,
                  nextProps,
                  propKey
                );
              return;
            }
        }
        for (var propKey$252 in lastProps)
          propKey$221 = lastProps[propKey$252], lastProps.hasOwnProperty(propKey$252) && propKey$221 != null && !nextProps.hasOwnProperty(propKey$252) && setProp(domElement, tag, propKey$252, null, nextProps, propKey$221);
        for (lastProp in nextProps)
          propKey$221 = nextProps[lastProp], propKey = lastProps[lastProp], !nextProps.hasOwnProperty(lastProp) || propKey$221 === propKey || propKey$221 == null && propKey == null || setProp(domElement, tag, lastProp, propKey$221, nextProps, propKey);
      }
      function isLikelyStaticResource(initiatorType) {
        switch (initiatorType) {
          case "css":
          case "script":
          case "font":
          case "img":
          case "image":
          case "input":
          case "link":
            return !0;
          default:
            return !1;
        }
      }
      function estimateBandwidth() {
        if (typeof performance.getEntriesByType == "function") {
          for (var count3 = 0, bits = 0, resourceEntries = performance.getEntriesByType("resource"), i = 0; i < resourceEntries.length; i++) {
            var entry = resourceEntries[i], transferSize = entry.transferSize, initiatorType = entry.initiatorType, duration = entry.duration;
            if (transferSize && duration && isLikelyStaticResource(initiatorType)) {
              for (initiatorType = 0, duration = entry.responseEnd, i += 1; i < resourceEntries.length; i++) {
                var overlapEntry = resourceEntries[i], overlapStartTime = overlapEntry.startTime;
                if (overlapStartTime > duration) break;
                var overlapTransferSize = overlapEntry.transferSize, overlapInitiatorType = overlapEntry.initiatorType;
                overlapTransferSize && isLikelyStaticResource(overlapInitiatorType) && (overlapEntry = overlapEntry.responseEnd, initiatorType += overlapTransferSize * (overlapEntry < duration ? 1 : (duration - overlapStartTime) / (overlapEntry - overlapStartTime)));
              }
              if (--i, bits += 8 * (transferSize + initiatorType) / (entry.duration / 1e3), count3++, 10 < count3) break;
            }
          }
          if (0 < count3) return bits / count3 / 1e6;
        }
        return navigator.connection && (count3 = navigator.connection.downlink, typeof count3 == "number") ? count3 : 5;
      }
      var eventsEnabled = null, selectionInformation = null;
      function getOwnerDocumentFromRootContainer(rootContainerElement) {
        return rootContainerElement.nodeType === 9 ? rootContainerElement : rootContainerElement.ownerDocument;
      }
      function getOwnHostContext(namespaceURI) {
        switch (namespaceURI) {
          case "http://www.w3.org/2000/svg":
            return 1;
          case "http://www.w3.org/1998/Math/MathML":
            return 2;
          default:
            return 0;
        }
      }
      function getChildHostContextProd(parentNamespace, type) {
        if (parentNamespace === 0)
          switch (type) {
            case "svg":
              return 1;
            case "math":
              return 2;
            default:
              return 0;
          }
        return parentNamespace === 1 && type === "foreignObject" ? 0 : parentNamespace;
      }
      function createHoistableInstance(type, props, rootContainerInstance, internalInstanceHandle) {
        return rootContainerInstance = getOwnerDocumentFromRootContainer(
          rootContainerInstance
        ).createElement(type), rootContainerInstance[internalInstanceKey] = internalInstanceHandle, rootContainerInstance[internalPropsKey] = props, setInitialProperties(rootContainerInstance, type, props), markNodeAsHoistable(rootContainerInstance), rootContainerInstance;
      }
      function shouldSetTextContent(type, props) {
        return type === "textarea" || type === "noscript" || typeof props.children == "string" || typeof props.children == "number" || typeof props.children == "bigint" || typeof props.dangerouslySetInnerHTML == "object" && props.dangerouslySetInnerHTML !== null && props.dangerouslySetInnerHTML.__html != null;
      }
      var currentPopstateTransitionEvent = null;
      function shouldAttemptEagerTransition() {
        var event = window.event;
        return event && event.type === "popstate" ? event === currentPopstateTransitionEvent ? !1 : (currentPopstateTransitionEvent = event, !0) : (currentPopstateTransitionEvent = null, !1);
      }
      var scheduleTimeout = typeof setTimeout == "function" ? setTimeout : void 0, cancelTimeout = typeof clearTimeout == "function" ? clearTimeout : void 0, localPromise = typeof Promise == "function" ? Promise : void 0, localRequestAnimationFrame = typeof requestAnimationFrame == "function" ? requestAnimationFrame : scheduleTimeout, scheduleMicrotask = typeof queueMicrotask == "function" ? queueMicrotask : typeof localPromise < "u" ? function(callback) {
        return localPromise.resolve(null).then(callback).catch(handleErrorInNextTick);
      } : scheduleTimeout;
      function handleErrorInNextTick(error) {
        setTimeout(function() {
          throw error;
        });
      }
      function isSingletonScope(type) {
        return type === "head";
      }
      function clearHydrationBoundary(parentInstance, hydrationInstance) {
        var node = hydrationInstance, depth = 0;
        do {
          var nextNode = node.nextSibling;
          if (parentInstance.removeChild(node), nextNode && nextNode.nodeType === 8)
            if (node = nextNode.data, node === "/$" || node === "/&") {
              if (depth === 0) {
                parentInstance.removeChild(nextNode), retryIfBlockedOn(hydrationInstance);
                return;
              }
              depth--;
            } else if (node === "$" || node === "$?" || node === "$~" || node === "$!" || node === "&")
              depth++;
            else if (node === "html")
              clearSingletonPreambleContribution(
                parentInstance.ownerDocument.documentElement
              );
            else if (node === "head") {
              node = parentInstance.ownerDocument.head, clearSingletonPreambleContribution(node);
              for (var node$jscomp$0 = node.firstChild; node$jscomp$0; ) {
                var nextNode$jscomp$0 = node$jscomp$0.nextSibling, nodeName = node$jscomp$0.nodeName;
                node$jscomp$0[internalHoistableMarker] || nodeName === "SCRIPT" || nodeName === "STYLE" || nodeName === "LINK" && node$jscomp$0.rel.toLowerCase() === "stylesheet" || node.removeChild(node$jscomp$0), node$jscomp$0 = nextNode$jscomp$0;
              }
            } else
              node === "body" && clearSingletonPreambleContribution(parentInstance.ownerDocument.body);
          node = nextNode;
        } while (node);
        retryIfBlockedOn(hydrationInstance);
      }
      function hideOrUnhideDehydratedBoundary(suspenseInstance, isHidden2) {
        var node = suspenseInstance;
        suspenseInstance = 0;
        do {
          var nextNode = node.nextSibling;
          if (node.nodeType === 1 ? isHidden2 ? (node._stashedDisplay = node.style.display, node.style.display = "none") : (node.style.display = node._stashedDisplay || "", node.getAttribute("style") === "" && node.removeAttribute("style")) : node.nodeType === 3 && (isHidden2 ? (node._stashedText = node.nodeValue, node.nodeValue = "") : node.nodeValue = node._stashedText || ""), nextNode && nextNode.nodeType === 8)
            if (node = nextNode.data, node === "/$") {
              if (suspenseInstance === 0) break;
              suspenseInstance--;
            } else
              node !== "$" && node !== "$?" && node !== "$~" && node !== "$!" || suspenseInstance++;
          node = nextNode;
        } while (node);
      }
      function applyViewTransitionName(instance, name, className) {
        if (name = CSS.escape(name) !== name ? "r-" + btoa(name).replace(/=/g, "") : name, instance.style.viewTransitionName = name, className != null && (instance.style.viewTransitionClass = className), className = getComputedStyle(instance), className.display === "inline") {
          if (name = instance.getClientRects(), name.length === 1) var JSCompiler_inline_result = 1;
          else
            for (var i = JSCompiler_inline_result = 0; i < name.length; i++) {
              var rect2 = name[i];
              0 < rect2.width && 0 < rect2.height && JSCompiler_inline_result++;
            }
          JSCompiler_inline_result === 1 && (instance = instance.style, instance.display = name.length === 1 ? "inline-block" : "block", instance.marginTop = "-" + className.paddingTop, instance.marginBottom = "-" + className.paddingBottom);
        }
      }
      function restoreViewTransitionName(instance, props) {
        instance = instance.style, props = props.style;
        var viewTransitionName = props != null ? props.hasOwnProperty("viewTransitionName") ? props.viewTransitionName : props.hasOwnProperty("view-transition-name") ? props["view-transition-name"] : null : null;
        instance.viewTransitionName = viewTransitionName == null || typeof viewTransitionName == "boolean" ? "" : ("" + viewTransitionName).trim(), viewTransitionName = props != null ? props.hasOwnProperty("viewTransitionClass") ? props.viewTransitionClass : props.hasOwnProperty("view-transition-class") ? props["view-transition-class"] : null : null, instance.viewTransitionClass = viewTransitionName == null || typeof viewTransitionName == "boolean" ? "" : ("" + viewTransitionName).trim(), instance.display === "inline-block" && (props == null ? instance.display = instance.margin = "" : (viewTransitionName = props.display, instance.display = viewTransitionName == null || typeof viewTransitionName == "boolean" ? "" : viewTransitionName, viewTransitionName = props.margin, viewTransitionName != null ? instance.margin = viewTransitionName : (viewTransitionName = props.hasOwnProperty("marginTop") ? props.marginTop : props["margin-top"], instance.marginTop = viewTransitionName == null || typeof viewTransitionName == "boolean" ? "" : viewTransitionName, props = props.hasOwnProperty("marginBottom") ? props.marginBottom : props["margin-bottom"], instance.marginBottom = props == null || typeof props == "boolean" ? "" : props)));
      }
      function createMeasurement(rect2, computedStyle, element) {
        return element = element.ownerDocument.defaultView, {
          rect: rect2,
          abs: computedStyle.position === "absolute" || computedStyle.position === "fixed",
          clip: computedStyle.clipPath !== "none" || computedStyle.overflow !== "visible" || computedStyle.filter !== "none" || computedStyle.mask !== "none" || computedStyle.mask !== "none" || computedStyle.borderRadius !== "0px",
          view: 0 <= rect2.bottom && 0 <= rect2.right && rect2.top <= element.innerHeight && rect2.left <= element.innerWidth
        };
      }
      function measureInstance(instance) {
        var rect2 = instance.getBoundingClientRect(), computedStyle = getComputedStyle(instance);
        return createMeasurement(rect2, computedStyle, instance);
      }
      function measureClonedInstance(instance) {
        var measuredRect = instance.getBoundingClientRect();
        measuredRect = new DOMRect(
          measuredRect.x + 2e4,
          measuredRect.y + 2e4,
          measuredRect.width,
          measuredRect.height
        );
        var computedStyle = getComputedStyle(instance);
        return createMeasurement(measuredRect, computedStyle, instance);
      }
      function forceLayout(ownerDocument) {
        return ownerDocument.documentElement.clientHeight;
      }
      function waitForImageToLoad(resolve) {
        this.addEventListener("load", resolve), this.addEventListener("error", resolve);
      }
      function startViewTransition(suspendedState, rootContainer, transitionTypes, mutationCallback, layoutCallback, afterMutationCallback, spawnedWorkCallback, passiveCallback, errorCallback) {
        var ownerDocument = rootContainer.nodeType === 9 ? rootContainer : rootContainer.ownerDocument;
        try {
          var transition = ownerDocument.startViewTransition({
            update: function() {
              var ownerWindow = ownerDocument.defaultView, pendingNavigation = ownerWindow.navigation && ownerWindow.navigation.transition, previousFontLoadingStatus = ownerDocument.fonts.status;
              mutationCallback();
              var blockingPromises = [];
              if (previousFontLoadingStatus === "loaded" && (forceLayout(ownerDocument), ownerDocument.fonts.status === "loading" && blockingPromises.push(ownerDocument.fonts.ready)), previousFontLoadingStatus = blockingPromises.length, suspendedState !== null)
                for (var suspenseyImages = suspendedState.suspenseyImages, imgBytes = 0, i = 0; i < suspenseyImages.length; i++) {
                  var suspenseyImage = suspenseyImages[i];
                  if (!suspenseyImage.complete) {
                    var rect2 = suspenseyImage.getBoundingClientRect();
                    if (0 < rect2.bottom && 0 < rect2.right && rect2.top < ownerWindow.innerHeight && rect2.left < ownerWindow.innerWidth) {
                      if (imgBytes += estimateImageBytes(suspenseyImage), imgBytes > estimatedBytesWithinLimit) {
                        blockingPromises.length = previousFontLoadingStatus;
                        break;
                      }
                      suspenseyImage = new Promise(
                        waitForImageToLoad.bind(suspenseyImage)
                      ), blockingPromises.push(suspenseyImage);
                    }
                  }
                }
              if (0 < blockingPromises.length)
                return ownerWindow = Promise.race([
                  Promise.all(blockingPromises),
                  new Promise(function(resolve) {
                    return setTimeout(resolve, 500);
                  })
                ]).then(layoutCallback, layoutCallback), (pendingNavigation ? Promise.allSettled([pendingNavigation.finished, ownerWindow]) : ownerWindow).then(afterMutationCallback, afterMutationCallback);
              if (layoutCallback(), pendingNavigation)
                return pendingNavigation.finished.then(
                  afterMutationCallback,
                  afterMutationCallback
                );
              afterMutationCallback();
            },
            types: transitionTypes
          });
          ownerDocument.__reactViewTransition = transition;
          var viewTransitionAnimations = [];
          return transition.ready.then(
            function() {
              for (var animations = ownerDocument.documentElement.getAnimations({
                subtree: !0
              }), i = 0; i < animations.length; i++) {
                var animation = animations[i], effect = animation.effect, pseudoElement = effect.pseudoElement;
                if (pseudoElement != null && pseudoElement.startsWith("::view-transition")) {
                  viewTransitionAnimations.push(animation), animation = effect.getKeyframes();
                  for (var height = pseudoElement = void 0, unchangedDimensions = !0, j = 0; j < animation.length; j++) {
                    var keyframe = animation[j], w = keyframe.width;
                    if (pseudoElement === void 0) pseudoElement = w;
                    else if (pseudoElement !== w) {
                      unchangedDimensions = !1;
                      break;
                    }
                    if (w = keyframe.height, height === void 0) height = w;
                    else if (height !== w) {
                      unchangedDimensions = !1;
                      break;
                    }
                    delete keyframe.width, delete keyframe.height, keyframe.transform === "none" && delete keyframe.transform;
                  }
                  unchangedDimensions && pseudoElement !== void 0 && height !== void 0 && (effect.setKeyframes(animation), unchangedDimensions = getComputedStyle(
                    effect.target,
                    effect.pseudoElement
                  ), unchangedDimensions.width !== pseudoElement || unchangedDimensions.height !== height) && (unchangedDimensions = animation[0], unchangedDimensions.width = pseudoElement, unchangedDimensions.height = height, unchangedDimensions = animation[animation.length - 1], unchangedDimensions.width = pseudoElement, unchangedDimensions.height = height, effect.setKeyframes(animation));
                }
              }
              spawnedWorkCallback();
            },
            function(error) {
              ownerDocument.__reactViewTransition === transition && (ownerDocument.__reactViewTransition = null);
              try {
                typeof error == "object" && error !== null && error.name === "InvalidStateError" && (error.message === "View transition was skipped because document visibility state is hidden." || error.message === "Skipping view transition because document visibility state has become hidden." || error.message === "Skipping view transition because viewport size changed." || error.message === "Transition was aborted because of invalid state") && (error = null), error !== null && errorCallback(error);
              } finally {
                mutationCallback(), layoutCallback(), spawnedWorkCallback();
              }
            }
          ), transition.finished.finally(function() {
            for (var i = 0; i < viewTransitionAnimations.length; i++)
              viewTransitionAnimations[i].cancel();
            ownerDocument.__reactViewTransition === transition && (ownerDocument.__reactViewTransition = null), passiveCallback();
          }), transition;
        } catch {
          return mutationCallback(), layoutCallback(), spawnedWorkCallback(), null;
        }
      }
      function ViewTransitionPseudoElement(pseudo, name) {
        this._scope = document.documentElement, this._selector = "::view-transition-" + pseudo + "(" + name + ")";
      }
      ViewTransitionPseudoElement.prototype.animate = function(keyframes, options3) {
        return options3 = typeof options3 == "number" ? { duration: options3 } : assign({}, options3), options3.pseudoElement = this._selector, this._scope.animate(keyframes, options3);
      };
      ViewTransitionPseudoElement.prototype.getAnimations = function() {
        for (var scope = this._scope, selector = this._selector, animations = scope.getAnimations({ subtree: !0 }), result = [], i = 0; i < animations.length; i++) {
          var effect = animations[i].effect;
          effect !== null && effect.target === scope && effect.pseudoElement === selector && result.push(animations[i]);
        }
        return result;
      };
      ViewTransitionPseudoElement.prototype.getComputedStyle = function() {
        return getComputedStyle(this._scope, this._selector);
      };
      function createViewTransitionInstance(name) {
        return {
          name,
          group: new ViewTransitionPseudoElement("group", name),
          imagePair: new ViewTransitionPseudoElement("image-pair", name),
          old: new ViewTransitionPseudoElement("old", name),
          new: new ViewTransitionPseudoElement("new", name)
        };
      }
      function FragmentInstance(fragmentFiber) {
        this._fragmentFiber = fragmentFiber, this._observers = this._eventListeners = null;
      }
      FragmentInstance.prototype.addEventListener = function(type, listener, optionsOrUseCapture) {
        var signal = null, cleanup = null;
        if (!(optionsOrUseCapture != null && typeof optionsOrUseCapture != "boolean" && (signal = optionsOrUseCapture.signal || null, signal !== null && signal.aborted))) {
          this._eventListeners === null && (this._eventListeners = []);
          var listeners = this._eventListeners;
          if (indexOfEventListener(listeners, type, listener, optionsOrUseCapture) === -1) {
            var fragmentInstance = this, attachedListener = listener;
            optionsOrUseCapture != null && typeof optionsOrUseCapture != "boolean" && optionsOrUseCapture.once === !0 && (attachedListener = function(event) {
              fragmentInstance.removeEventListener(
                type,
                listener,
                optionsOrUseCapture
              ), typeof listener == "function" ? listener.call(this, event) : listener.handleEvent(event);
            }), signal !== null && (cleanup = fragmentInstance.removeEventListener.bind(
              fragmentInstance,
              type,
              listener,
              optionsOrUseCapture
            ), signal.addEventListener("abort", cleanup, { once: !0 }), cleanup = signal.removeEventListener.bind(signal, "abort", cleanup)), signal = getAttachOptions(optionsOrUseCapture), listeners.push({
              type,
              listener,
              optionsOrUseCapture,
              attachedListener,
              cleanup
            }), traverseVisibleInstancesAndTextInstances(
              this._fragmentFiber.child,
              !1,
              addEventListenerToChild,
              type,
              attachedListener,
              signal
            );
          }
          this._eventListeners = listeners;
        }
      };
      function addEventListenerToChild(child, type, listener, optionsOrUseCapture) {
        return getInstanceFromHostFiber(child).addEventListener(
          type,
          listener,
          optionsOrUseCapture
        ), !1;
      }
      FragmentInstance.prototype.removeEventListener = function(type, listener, optionsOrUseCapture) {
        var listeners = this._eventListeners;
        if (listeners !== null && (listener = indexOfEventListener(
          listeners,
          type,
          listener,
          optionsOrUseCapture
        ), listener !== -1)) {
          var _listeners$index = listeners[listener];
          optionsOrUseCapture = _listeners$index.attachedListener;
          var cleanup = _listeners$index.cleanup;
          _listeners$index = getAttachOptions(_listeners$index.optionsOrUseCapture), traverseVisibleInstancesAndTextInstances(
            this._fragmentFiber.child,
            !1,
            removeEventListenerFromChild,
            type,
            optionsOrUseCapture,
            _listeners$index
          ), listeners.splice(listener, 1), cleanup !== null && cleanup();
        }
      };
      function removeEventListenerFromChild(child, type, listener, optionsOrUseCapture) {
        return getInstanceFromHostFiber(child).removeEventListener(
          type,
          listener,
          optionsOrUseCapture
        ), !1;
      }
      function getAttachOptions(opts) {
        return opts != null && typeof opts != "boolean" && (opts.once === !0 || opts.signal instanceof AbortSignal) ? { capture: opts.capture, passive: opts.passive } : opts;
      }
      function normalizeListenerOptions(opts) {
        return opts == null ? "c=0" : typeof opts == "boolean" ? "c=" + (opts ? "1" : "0") : "c=" + (opts.capture ? "1" : "0");
      }
      function indexOfEventListener(eventListeners, type, listener, optionsOrUseCapture) {
        if (eventListeners.length === 0) return -1;
        optionsOrUseCapture = normalizeListenerOptions(optionsOrUseCapture);
        for (var i = 0; i < eventListeners.length; i++) {
          var item = eventListeners[i];
          if (item.type === type && item.listener === listener && normalizeListenerOptions(item.optionsOrUseCapture) === optionsOrUseCapture)
            return i;
        }
        return -1;
      }
      FragmentInstance.prototype.dispatchEvent = function(event) {
        var parentHostFiber = getFragmentParentInstanceOrContainerFiber(
          this._fragmentFiber
        );
        if (parentHostFiber === null) return !0;
        parentHostFiber = getInstanceFromHostFiber(parentHostFiber);
        var eventListeners = this._eventListeners;
        if (eventListeners !== null && 0 < eventListeners.length || !event.bubbles) {
          var temp = parentHostFiber.nodeType === 9 ? parentHostFiber.createComment("") : document.createTextNode("");
          if (eventListeners)
            for (var i = 0; i < eventListeners.length; i++) {
              var _eventListeners$i = eventListeners[i];
              temp.addEventListener(
                _eventListeners$i.type,
                _eventListeners$i.attachedListener,
                getAttachOptions(_eventListeners$i.optionsOrUseCapture)
              );
            }
          if (parentHostFiber.appendChild(temp), event = temp.dispatchEvent(event), eventListeners)
            for (i = 0; i < eventListeners.length; i++)
              _eventListeners$i = eventListeners[i], temp.removeEventListener(
                _eventListeners$i.type,
                _eventListeners$i.attachedListener,
                getAttachOptions(_eventListeners$i.optionsOrUseCapture)
              );
          return parentHostFiber.removeChild(temp), event;
        }
        return parentHostFiber.dispatchEvent(event);
      };
      FragmentInstance.prototype.focus = function(focusOptions) {
        traverseVisibleInstancesAndTextInstances(
          this._fragmentFiber.child,
          !0,
          setFocusOnFiberIfFocusable,
          focusOptions,
          void 0,
          void 0
        );
      };
      function setFocusOnFiberIfFocusable(fiber, focusOptions) {
        return fiber.tag === 6 ? !1 : (fiber = getInstanceFromHostFiber(fiber), setFocusIfFocusable(fiber, focusOptions));
      }
      FragmentInstance.prototype.focusLast = function(focusOptions) {
        var children = [];
        traverseVisibleInstancesAndTextInstances(
          this._fragmentFiber.child,
          !0,
          collectChildren,
          children,
          void 0,
          void 0
        );
        for (var i = children.length - 1; 0 <= i && !setFocusOnFiberIfFocusable(children[i], focusOptions); i--) ;
      };
      function collectChildren(child, collection) {
        return collection.push(child), !1;
      }
      FragmentInstance.prototype.blur = function() {
        var parentHostFiber = getFragmentParentInstanceOrContainerFiber(
          this._fragmentFiber
        );
        parentHostFiber !== null && (parentHostFiber = getInstanceFromHostFiber(parentHostFiber), parentHostFiber = getOwnerDocumentFromRootContainer(parentHostFiber).activeElement, parentHostFiber !== null && traverseVisibleInstancesAndTextInstances(
          this._fragmentFiber.child,
          !1,
          blurActiveElementWithinFragment,
          parentHostFiber,
          void 0,
          void 0
        ));
      };
      function blurActiveElementWithinFragment(child, activeElement2) {
        return child.tag === 6 ? !1 : (child = getInstanceFromHostFiber(child), child === activeElement2 || child.contains(activeElement2) ? (activeElement2.blur(), !0) : !1);
      }
      FragmentInstance.prototype.observeUsing = function(observer) {
        this._observers === null && (this._observers = /* @__PURE__ */ new Set()), this._observers.add(observer), traverseVisibleInstancesAndTextInstances(
          this._fragmentFiber.child,
          !1,
          observeChild,
          observer,
          void 0,
          void 0
        );
      };
      function observeChild(child, observer) {
        return child.tag === 6 || (child = getInstanceFromHostFiber(child), observer.observe(child)), !1;
      }
      FragmentInstance.prototype.unobserveUsing = function(observer) {
        var observers = this._observers;
        if (observers !== null && observers.has(observer)) {
          observers.delete(observer), traverseVisibleInstancesAndTextInstances(
            this._fragmentFiber.child,
            !1,
            unobserveChild,
            observer,
            void 0,
            void 0
          );
          for (var i = observers = 0; i < pendingIntersectionUnobserves.length; i++) {
            var pending = pendingIntersectionUnobserves[i];
            pending.fragmentInstance === this && pending.observer === observer ? observer.unobserve(pending.instance) : pendingIntersectionUnobserves[observers++] = pending;
          }
          pendingIntersectionUnobserves.length = observers;
        }
      };
      function unobserveChild(child, observer) {
        return child.tag === 6 || (child = getInstanceFromHostFiber(child), observer.unobserve(child)), !1;
      }
      var pendingIntersectionUnobserves = [], intersectionUnobserveScheduled = !1;
      function schedulePendingIntersectionUnobserve(fragmentInstance, observer, instance) {
        pendingIntersectionUnobserves.push({
          fragmentInstance,
          observer,
          instance
        }), intersectionUnobserveScheduled || (intersectionUnobserveScheduled = !0, requestPostPaintCallback(function() {
          intersectionUnobserveScheduled = !1;
          var pending = pendingIntersectionUnobserves;
          pendingIntersectionUnobserves = [];
          for (var i = 0; i < pending.length; i++) {
            var item = pending[i];
            item.observer.unobserve(item.instance);
          }
        }));
      }
      FragmentInstance.prototype.getClientRects = function() {
        var rects = [];
        return traverseVisibleInstancesAndTextInstances(
          this._fragmentFiber.child,
          !1,
          collectClientRects,
          rects,
          void 0,
          void 0
        ), rects;
      };
      function collectClientRects(child, rects) {
        if (child.tag === 6) {
          child = child.stateNode;
          var range = child.ownerDocument.createRange();
          range.selectNodeContents(child), rects.push.apply(rects, range.getClientRects());
        } else
          child = getInstanceFromHostFiber(child), rects.push.apply(rects, child.getClientRects());
        return !1;
      }
      FragmentInstance.prototype.getRootNode = function(getRootNodeOptions) {
        var parentHostFiber = getFragmentParentInstanceOrContainerFiber(
          this._fragmentFiber
        );
        return parentHostFiber === null ? this : getInstanceFromHostFiber(parentHostFiber).getRootNode(getRootNodeOptions);
      };
      FragmentInstance.prototype.compareDocumentPosition = function(otherNode) {
        var parentHostFiber = getFragmentParentInstanceOrContainerFiber(
          this._fragmentFiber
        );
        if (parentHostFiber === null) return Node.DOCUMENT_POSITION_DISCONNECTED;
        var children = [];
        traverseVisibleInstancesAndTextInstances(
          this._fragmentFiber.child,
          !1,
          collectChildren,
          children,
          void 0,
          void 0
        );
        var parentHostInstance = getInstanceFromHostFiber(parentHostFiber);
        if (children.length === 0) {
          if (children = parentHostInstance, fiberIsPortaledIntoHost(this._fragmentFiber)) {
            a: {
              for (parentHostFiber = this._fragmentFiber.return; parentHostFiber !== null; ) {
                if (parentHostFiber.tag === 4) {
                  parentHostFiber = parentHostFiber.stateNode.containerInfo;
                  break a;
                }
                if (parentHostFiber.tag === 3 || parentHostFiber.tag === 5 || parentHostFiber.tag === 27)
                  break;
                parentHostFiber = parentHostFiber.return;
              }
              parentHostFiber = null;
            }
            parentHostFiber != null && (children = parentHostFiber);
          }
          parentHostFiber = this._fragmentFiber;
          var result = parentHostInstance = children.compareDocumentPosition(otherNode);
          return children === otherNode ? result = Node.DOCUMENT_POSITION_CONTAINS : parentHostInstance & Node.DOCUMENT_POSITION_CONTAINED_BY && (children = getFragmentInstanceOrTextInstanceSiblings(parentHostFiber)[1], children === null ? result = Node.DOCUMENT_POSITION_PRECEDING : (otherNode = getInstanceFromHostFiber(children).compareDocumentPosition(
            otherNode
          ), result = otherNode === 0 || otherNode & Node.DOCUMENT_POSITION_FOLLOWING ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING)), result |= Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
        }
        parentHostFiber = getInstanceFromHostFiber(children[0]), result = getInstanceFromHostFiber(children[children.length - 1]);
        var parentHostInstanceFromDOM = fiberIsPortaledIntoHost(this._fragmentFiber) ? parentHostFiber.parentElement : parentHostInstance;
        if (parentHostInstanceFromDOM == null)
          return Node.DOCUMENT_POSITION_DISCONNECTED;
        parentHostInstance = parentHostInstanceFromDOM.compareDocumentPosition(parentHostFiber) & Node.DOCUMENT_POSITION_CONTAINED_BY, parentHostInstanceFromDOM = parentHostInstanceFromDOM.compareDocumentPosition(result) & Node.DOCUMENT_POSITION_CONTAINED_BY;
        var firstResult = parentHostFiber.compareDocumentPosition(otherNode), lastResult = result.compareDocumentPosition(otherNode), otherNodeIsWithinFirstOrLastChild = firstResult & Node.DOCUMENT_POSITION_CONTAINED_BY || lastResult & Node.DOCUMENT_POSITION_CONTAINED_BY;
        return lastResult = parentHostInstance && parentHostInstanceFromDOM && firstResult & Node.DOCUMENT_POSITION_FOLLOWING && lastResult & Node.DOCUMENT_POSITION_PRECEDING, parentHostFiber = parentHostInstance && parentHostFiber === otherNode || parentHostInstanceFromDOM && result === otherNode || otherNodeIsWithinFirstOrLastChild || lastResult ? Node.DOCUMENT_POSITION_CONTAINED_BY : !parentHostInstance && parentHostFiber === otherNode || !parentHostInstanceFromDOM && result === otherNode ? Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC : firstResult, parentHostFiber & Node.DOCUMENT_POSITION_DISCONNECTED || parentHostFiber & Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC || validateDocumentPositionWithFiberTree(
          parentHostFiber,
          this._fragmentFiber,
          children[0],
          children[children.length - 1],
          otherNode
        ) ? parentHostFiber : Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
      };
      function validateDocumentPositionWithFiberTree(documentPosition, fragmentFiber, precedingBoundaryFiber, followingBoundaryFiber, otherNode) {
        var otherFiber = getClosestInstanceFromNode(otherNode);
        if (documentPosition & Node.DOCUMENT_POSITION_CONTAINED_BY) {
          if (precedingBoundaryFiber = !!otherFiber)
            a: {
              for (; otherFiber !== null; ) {
                if (otherFiber.tag === 7 && (otherFiber === fragmentFiber || otherFiber.alternate === fragmentFiber)) {
                  precedingBoundaryFiber = !0;
                  break a;
                }
                otherFiber = otherFiber.return;
              }
              precedingBoundaryFiber = !1;
            }
          return precedingBoundaryFiber;
        }
        if (documentPosition & Node.DOCUMENT_POSITION_CONTAINS) {
          if (otherFiber === null)
            return otherFiber = otherNode.ownerDocument, otherNode === otherFiber || otherNode === otherFiber.documentElement || otherNode === otherFiber.body;
          a: {
            for (otherFiber = fragmentFiber, fragmentFiber = getFragmentParentInstanceOrContainerFiber(fragmentFiber); otherFiber !== null; ) {
              if (!(otherFiber.tag !== 5 && otherFiber.tag !== 3 && otherFiber.tag !== 27 || otherFiber !== fragmentFiber && otherFiber.alternate !== fragmentFiber)) {
                otherFiber = !0;
                break a;
              }
              otherFiber = otherFiber.return;
            }
            otherFiber = !1;
          }
          return otherFiber;
        }
        return documentPosition & Node.DOCUMENT_POSITION_PRECEDING ? ((fragmentFiber = !!otherFiber) && !(fragmentFiber = otherFiber === precedingBoundaryFiber) && (fragmentFiber = getLowestCommonAncestor(
          precedingBoundaryFiber,
          otherFiber,
          getParentForFragmentAncestors
        ), fragmentFiber === null ? fragmentFiber = !1 : (traverseVisibleInstancesAndTextInstances(
          fragmentFiber,
          !0,
          isFiberPrecedingCheck,
          otherFiber,
          precedingBoundaryFiber
        ), otherFiber = searchTarget, searchTarget = null, fragmentFiber = otherFiber !== null)), fragmentFiber) : documentPosition & Node.DOCUMENT_POSITION_FOLLOWING ? ((fragmentFiber = !!otherFiber) && !(fragmentFiber = otherFiber === followingBoundaryFiber) && (fragmentFiber = getLowestCommonAncestor(
          followingBoundaryFiber,
          otherFiber,
          getParentForFragmentAncestors
        ), fragmentFiber === null ? fragmentFiber = !1 : (traverseVisibleInstancesAndTextInstances(
          fragmentFiber,
          !0,
          isFiberFollowingCheck,
          otherFiber,
          followingBoundaryFiber
        ), otherFiber = searchTarget, searchBoundary = searchTarget = null, fragmentFiber = otherFiber !== null)), fragmentFiber) : !1;
      }
      function scrollTextNodeIntoView(textNode, resolvedAlignToTop) {
        var range = textNode.ownerDocument.createRange();
        range.selectNodeContents(textNode), textNode = range.getBoundingClientRect(), window.scrollTo(
          window.scrollX + textNode.left,
          resolvedAlignToTop ? window.scrollY + textNode.top : window.scrollY + textNode.bottom - window.innerHeight
        );
      }
      FragmentInstance.prototype.scrollIntoView = function(alignToTop) {
        if (typeof alignToTop == "object") throw Error(formatProdErrorMessage(566));
        var children = [];
        traverseVisibleInstancesAndTextInstances(
          this._fragmentFiber.child,
          !1,
          collectChildren,
          children,
          void 0,
          void 0
        );
        var resolvedAlignToTop = alignToTop !== !1;
        if (children.length === 0) {
          var hostSiblings = getFragmentInstanceOrTextInstanceSiblings(
            this._fragmentFiber
          );
          if (hostSiblings = resolvedAlignToTop ? hostSiblings[1] || hostSiblings[0] || getFragmentParentInstanceOrContainerFiber(this._fragmentFiber) : hostSiblings[0] || hostSiblings[1], hostSiblings === null) return;
          if (hostSiblings.tag === 6) {
            alignToTop = getInstanceFromHostFiber(hostSiblings), scrollTextNodeIntoView(alignToTop, resolvedAlignToTop);
            return;
          }
          if (hostSiblings = getInstanceFromHostFiber(hostSiblings), hostSiblings.nodeType !== 9) {
            if (hostSiblings.nodeType === 11) {
              resolvedAlignToTop = "host" in hostSiblings ? hostSiblings.host : null, resolvedAlignToTop !== null && resolvedAlignToTop.scrollIntoView(alignToTop);
              return;
            }
            hostSiblings.scrollIntoView(alignToTop);
          }
        }
        for (hostSiblings = resolvedAlignToTop ? children.length - 1 : 0; hostSiblings !== (resolvedAlignToTop ? -1 : children.length); ) {
          var child = children[hostSiblings];
          child.tag === 6 ? (child = getInstanceFromHostFiber(child), scrollTextNodeIntoView(child, resolvedAlignToTop)) : getInstanceFromHostFiber(child).scrollIntoView(alignToTop), hostSiblings += resolvedAlignToTop ? -1 : 1;
        }
      };
      function addFragmentHandleToFiber(child, fragmentInstance) {
        return child = getInstanceFromHostFiber(child), addFragmentHandleToInstance(child, fragmentInstance), !1;
      }
      function addFragmentHandleToInstance(instance, fragmentInstance) {
        instance.reactFragments == null && (instance.reactFragments = /* @__PURE__ */ new Set()), instance.reactFragments.add(fragmentInstance);
      }
      function commitNewChildToFragmentInstance(childInstance, fragmentInstance) {
        var eventListeners = fragmentInstance._eventListeners;
        if (eventListeners !== null)
          for (var i$jscomp$0 = 0; i$jscomp$0 < eventListeners.length; i$jscomp$0++) {
            var _eventListeners$i3 = eventListeners[i$jscomp$0];
            childInstance.addEventListener(
              _eventListeners$i3.type,
              _eventListeners$i3.attachedListener,
              getAttachOptions(_eventListeners$i3.optionsOrUseCapture)
            );
          }
        childInstance.nodeType !== 3 && (eventListeners = fragmentInstance._observers, eventListeners !== null && eventListeners.forEach(function(observer) {
          for (var writeIdx = 0, i = 0; i < pendingIntersectionUnobserves.length; i++) {
            var pending = pendingIntersectionUnobserves[i];
            (pending.fragmentInstance !== fragmentInstance || pending.observer !== observer || pending.instance !== childInstance) && (pendingIntersectionUnobserves[writeIdx++] = pending);
          }
          pendingIntersectionUnobserves.length = writeIdx, observer.observe(childInstance);
        }), addFragmentHandleToInstance(childInstance, fragmentInstance));
      }
      function deleteChildFromFragmentInstance(childInstance, fragmentInstance) {
        var eventListeners = fragmentInstance._eventListeners;
        if (eventListeners !== null)
          for (var i = 0; i < eventListeners.length; i++) {
            var _eventListeners$i4 = eventListeners[i];
            childInstance.removeEventListener(
              _eventListeners$i4.type,
              _eventListeners$i4.attachedListener,
              getAttachOptions(_eventListeners$i4.optionsOrUseCapture)
            );
          }
        childInstance.nodeType !== 3 && (eventListeners = fragmentInstance._observers, eventListeners !== null && eventListeners.forEach(function(observer) {
          typeof observer.rootMargin == "string" ? schedulePendingIntersectionUnobserve(
            fragmentInstance,
            observer,
            childInstance
          ) : observer.unobserve(childInstance);
        }), childInstance.reactFragments != null && childInstance.reactFragments.delete(fragmentInstance));
      }
      function clearContainerSparingly(container) {
        var nextNode = container.firstChild;
        for (nextNode && nextNode.nodeType === 10 && (nextNode = nextNode.nextSibling); nextNode; ) {
          var node = nextNode;
          switch (nextNode = nextNode.nextSibling, node.nodeName) {
            case "HTML":
            case "HEAD":
            case "BODY":
              clearContainerSparingly(node), detachDeletedInstance(node);
              continue;
            case "SCRIPT":
            case "STYLE":
              continue;
            case "LINK":
              if (node.rel.toLowerCase() === "stylesheet") continue;
          }
          container.removeChild(node);
        }
      }
      function canHydrateInstance(instance, type, props, inRootOrSingleton) {
        for (; instance.nodeType === 1; ) {
          var anyProps = props;
          if (instance.nodeName.toLowerCase() !== type.toLowerCase()) {
            if (!inRootOrSingleton && (instance.nodeName !== "INPUT" || instance.type !== "hidden"))
              break;
          } else if (inRootOrSingleton) {
            if (!instance[internalHoistableMarker])
              switch (type) {
                case "meta":
                  if (!instance.hasAttribute("itemprop")) break;
                  return instance;
                case "link":
                  if (name = instance.getAttribute("rel"), name === "stylesheet" && instance.hasAttribute("data-precedence"))
                    break;
                  if (name !== anyProps.rel || instance.getAttribute("href") !== (anyProps.href == null || anyProps.href === "" ? null : anyProps.href) || instance.getAttribute("crossorigin") !== (anyProps.crossOrigin == null ? null : anyProps.crossOrigin) || instance.getAttribute("title") !== (anyProps.title == null ? null : anyProps.title))
                    break;
                  return instance;
                case "style":
                  if (instance.hasAttribute("data-precedence")) break;
                  return instance;
                case "script":
                  if (name = instance.getAttribute("src"), (name !== (anyProps.src == null ? null : anyProps.src) || instance.getAttribute("type") !== (anyProps.type == null ? null : anyProps.type) || instance.getAttribute("crossorigin") !== (anyProps.crossOrigin == null ? null : anyProps.crossOrigin)) && name && instance.hasAttribute("async") && !instance.hasAttribute("itemprop"))
                    break;
                  return instance;
                default:
                  return instance;
              }
          } else if (type === "input" && instance.type === "hidden") {
            var name = anyProps.name == null ? null : "" + anyProps.name;
            if (anyProps.type === "hidden" && instance.getAttribute("name") === name)
              return instance;
          } else return instance;
          if (instance = getNextHydratable(instance.nextSibling), instance === null) break;
        }
        return null;
      }
      function canHydrateTextInstance(instance, text, inRootOrSingleton) {
        if (text === "") return null;
        for (; instance.nodeType !== 3; )
          if ((instance.nodeType !== 1 || instance.nodeName !== "INPUT" || instance.type !== "hidden") && !inRootOrSingleton || (instance = getNextHydratable(instance.nextSibling), instance === null)) return null;
        return instance;
      }
      function canHydrateHydrationBoundary(instance, inRootOrSingleton) {
        for (; instance.nodeType !== 8; )
          if ((instance.nodeType !== 1 || instance.nodeName !== "INPUT" || instance.type !== "hidden") && !inRootOrSingleton || (instance = getNextHydratable(instance.nextSibling), instance === null)) return null;
        return instance;
      }
      function isSuspenseInstancePending(instance) {
        return instance.data === "$?" || instance.data === "$~";
      }
      function isSuspenseInstanceFallback(instance) {
        return instance.data === "$!" || instance.data === "$?" && instance.ownerDocument.readyState !== "loading";
      }
      function registerSuspenseInstanceRetry(instance, callback) {
        var ownerDocument = instance.ownerDocument;
        if (instance.data === "$~") instance._reactRetry = callback;
        else if (instance.data !== "$?" || ownerDocument.readyState !== "loading")
          callback();
        else {
          var listener = function() {
            callback(), ownerDocument.removeEventListener("DOMContentLoaded", listener);
          };
          ownerDocument.addEventListener("DOMContentLoaded", listener), instance._reactRetry = listener;
        }
      }
      function getNextHydratable(node) {
        for (; node != null; node = node.nextSibling) {
          var nodeType = node.nodeType;
          if (nodeType === 1 || nodeType === 3) break;
          if (nodeType === 8) {
            if (nodeType = node.data, nodeType === "$" || nodeType === "$!" || nodeType === "$?" || nodeType === "$~" || nodeType === "&" || nodeType === "F!" || nodeType === "F")
              break;
            if (nodeType === "/$" || nodeType === "/&") return null;
          }
        }
        return node;
      }
      var previousHydratableOnEnteringScopedSingleton = null;
      function getNextHydratableInstanceAfterHydrationBoundary(hydrationInstance) {
        hydrationInstance = hydrationInstance.nextSibling;
        for (var depth = 0; hydrationInstance; ) {
          if (hydrationInstance.nodeType === 8) {
            var data = hydrationInstance.data;
            if (data === "/$" || data === "/&") {
              if (depth === 0)
                return getNextHydratable(hydrationInstance.nextSibling);
              depth--;
            } else
              data !== "$" && data !== "$!" && data !== "$?" && data !== "$~" && data !== "&" || depth++;
          }
          hydrationInstance = hydrationInstance.nextSibling;
        }
        return null;
      }
      function getParentHydrationBoundary(targetInstance) {
        targetInstance = targetInstance.previousSibling;
        for (var depth = 0; targetInstance; ) {
          if (targetInstance.nodeType === 8) {
            var data = targetInstance.data;
            if (data === "$" || data === "$!" || data === "$?" || data === "$~" || data === "&") {
              if (depth === 0) return targetInstance;
              depth--;
            } else data !== "/$" && data !== "/&" || depth++;
          }
          targetInstance = targetInstance.previousSibling;
        }
        return null;
      }
      function setFocusIfFocusable(node, focusOptions) {
        function handleFocus() {
          didFocus = !0;
        }
        if (node.ownerDocument.activeElement === node) return !0;
        var didFocus = !1;
        try {
          node.ownerDocument.addEventListener("focus", handleFocus, !0), (node.focus || HTMLElement.prototype.focus).call(node, focusOptions);
        } finally {
          node.ownerDocument.removeEventListener("focus", handleFocus, !0);
        }
        return didFocus;
      }
      function requestPostPaintCallback(callback) {
        localRequestAnimationFrame(function() {
          localRequestAnimationFrame(function(time) {
            return callback(time);
          });
        });
      }
      function resolveSingletonInstance(type, props, rootContainerInstance) {
        switch (props = getOwnerDocumentFromRootContainer(rootContainerInstance), type) {
          case "html":
            if (type = props.documentElement, !type) throw Error(formatProdErrorMessage(452));
            return type;
          case "head":
            if (type = props.head, !type) throw Error(formatProdErrorMessage(453));
            return type;
          case "body":
            if (type = props.body, !type) throw Error(formatProdErrorMessage(454));
            return type;
          default:
            throw Error(formatProdErrorMessage(451));
        }
      }
      function releaseSingletonInstance(instance, type, props) {
        for (var propKey in props) {
          var propValue = props[propKey];
          props.hasOwnProperty(propKey) && propValue != null && setProp(instance, type, propKey, null, emptyProps, propValue);
        }
        props.dangerouslySetInnerHTML != null && (instance.textContent = ""), instance.onclick === noop$1 && (instance.onclick = null), detachDeletedInstance(instance);
      }
      function clearSingletonPreambleContribution(instance) {
        for (var attributes = instance.attributes; attributes.length; )
          instance.removeAttributeNode(attributes[0]);
        detachDeletedInstance(instance);
      }
      var preloadPropsMap = /* @__PURE__ */ new Map(), preconnectsSet = /* @__PURE__ */ new Set();
      function getHoistableRoot(container) {
        if (typeof container.getRootNode == "function") {
          var rootNode = container.getRootNode();
          if (rootNode.nodeType === 9 || rootNode.nodeType === 11) return rootNode;
        }
        return container.nodeType === 9 ? container : container.ownerDocument;
      }
      var previousDispatcher = ReactDOMSharedInternals.d;
      ReactDOMSharedInternals.d = {
        f: flushSyncWork,
        r: requestFormReset,
        D: prefetchDNS,
        C: preconnect,
        L: preload,
        m: preloadModule,
        X: preinitScript,
        S: preinitStyle,
        M: preinitModuleScript
      };
      function flushSyncWork() {
        var previousWasRendering = previousDispatcher.f(), wasRendering = flushSyncWork$1();
        return previousWasRendering || wasRendering;
      }
      function requestFormReset(form) {
        var formInst = getInstanceFromNode(form);
        formInst !== null && formInst.tag === 5 && formInst.type === "form" ? requestFormReset$1(formInst) : previousDispatcher.r(form);
      }
      var globalDocument = typeof document > "u" ? null : document;
      function preconnectAs(rel, href, crossOrigin) {
        var ownerDocument = globalDocument;
        if (ownerDocument && typeof href == "string" && href) {
          var limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(href);
          limitedEscapedHref = 'link[rel="' + rel + '"][href="' + limitedEscapedHref + '"]', typeof crossOrigin == "string" && (limitedEscapedHref += '[crossorigin="' + crossOrigin + '"]'), preconnectsSet.has(limitedEscapedHref) || (preconnectsSet.add(limitedEscapedHref), rel = { rel, crossOrigin, href }, ownerDocument.querySelector(limitedEscapedHref) === null && (href = ownerDocument.createElement("link"), setInitialProperties(href, "link", rel), markNodeAsHoistable(href), ownerDocument.head.appendChild(href)));
        }
      }
      function prefetchDNS(href) {
        previousDispatcher.D(href), preconnectAs("dns-prefetch", href, null);
      }
      function preconnect(href, crossOrigin) {
        previousDispatcher.C(href, crossOrigin), preconnectAs("preconnect", href, crossOrigin);
      }
      function preload(href, as, options3) {
        previousDispatcher.L(href, as, options3);
        var ownerDocument = globalDocument;
        if (ownerDocument && href && as) {
          var preloadSelector = 'link[rel="preload"][as="' + escapeSelectorAttributeValueInsideDoubleQuotes(as) + '"]';
          as === "image" && options3 && options3.imageSrcSet ? (preloadSelector += '[imagesrcset="' + escapeSelectorAttributeValueInsideDoubleQuotes(
            options3.imageSrcSet
          ) + '"]', typeof options3.imageSizes == "string" && (preloadSelector += '[imagesizes="' + escapeSelectorAttributeValueInsideDoubleQuotes(
            options3.imageSizes
          ) + '"]')) : preloadSelector += '[href="' + escapeSelectorAttributeValueInsideDoubleQuotes(href) + '"]';
          var key = preloadSelector;
          switch (as) {
            case "style":
              key = getStyleKey(href);
              break;
            case "script":
              key = getScriptKey(href);
          }
          if (!(preloadPropsMap.has(key) || (href = assign(
            {
              rel: "preload",
              href: as === "image" && options3 && options3.imageSrcSet ? void 0 : href,
              as
            },
            options3
          ), preloadPropsMap.set(key, href), ownerDocument.querySelector(preloadSelector) !== null || as === "style" && ownerDocument.querySelector(getStylesheetSelectorFromKey(key)) || as === "script" && ownerDocument.querySelector(getScriptSelectorFromKey(key))))) {
            var instance = ownerDocument.createElement("link");
            setInitialProperties(instance, "link", href), as === "style" && (instance[internalLoadPendingKey] = !0, instance.onload = instance.onerror = function() {
              clearPendingLoadOnNode(instance);
            }), markNodeAsHoistable(instance), ownerDocument.head.appendChild(instance);
          }
        }
      }
      function preloadModule(href, options3) {
        previousDispatcher.m(href, options3);
        var ownerDocument = globalDocument;
        if (ownerDocument && href) {
          var as = options3 && typeof options3.as == "string" ? options3.as : "script", preloadSelector = 'link[rel="modulepreload"][as="' + escapeSelectorAttributeValueInsideDoubleQuotes(as) + '"][href="' + escapeSelectorAttributeValueInsideDoubleQuotes(href) + '"]', key = preloadSelector;
          switch (as) {
            case "audioworklet":
            case "paintworklet":
            case "serviceworker":
            case "sharedworker":
            case "worker":
            case "script":
              key = getScriptKey(href);
          }
          if (!preloadPropsMap.has(key) && (href = assign({ rel: "modulepreload", href }, options3), preloadPropsMap.set(key, href), ownerDocument.querySelector(preloadSelector) === null)) {
            switch (as) {
              case "audioworklet":
              case "paintworklet":
              case "serviceworker":
              case "sharedworker":
              case "worker":
              case "script":
                if (ownerDocument.querySelector(getScriptSelectorFromKey(key)))
                  return;
            }
            as = ownerDocument.createElement("link"), setInitialProperties(as, "link", href), markNodeAsHoistable(as), ownerDocument.head.appendChild(as);
          }
        }
      }
      function preinitStyle(href, precedence, options3) {
        previousDispatcher.S(href, precedence, options3);
        var ownerDocument = globalDocument;
        if (ownerDocument && href) {
          var styles = getResourcesFromRoot(ownerDocument).hoistableStyles, key = getStyleKey(href);
          precedence = precedence || "default";
          var resource = styles.get(key);
          if (!resource) {
            var state = { loading: 0, preload: null };
            if (resource = ownerDocument.querySelector(
              getStylesheetSelectorFromKey(key)
            ))
              state.loading = 5;
            else {
              href = assign(
                { rel: "stylesheet", href, "data-precedence": precedence },
                options3
              ), (options3 = preloadPropsMap.get(key)) && adoptPreloadPropsForStylesheet(href, options3);
              var link = resource = ownerDocument.createElement("link");
              markNodeAsHoistable(link), setInitialProperties(link, "link", href), link._p = new Promise(function(resolve, reject) {
                link.onload = resolve, link.onerror = reject;
              }), link.addEventListener("load", function() {
                state.loading |= 1;
              }), link.addEventListener("error", function() {
                state.loading |= 2;
              }), state.loading |= 4, insertStylesheet(resource, precedence, ownerDocument);
            }
            resource = {
              type: "stylesheet",
              instance: resource,
              count: 1,
              state
            }, styles.set(key, resource);
          }
        }
      }
      function preinitScript(src, options3) {
        previousDispatcher.X(src, options3);
        var ownerDocument = globalDocument;
        if (ownerDocument && src) {
          var scripts = getResourcesFromRoot(ownerDocument).hoistableScripts, key = getScriptKey(src), resource = scripts.get(key);
          resource || (resource = ownerDocument.querySelector(getScriptSelectorFromKey(key)), resource || (src = assign({ src, async: !0 }, options3), (options3 = preloadPropsMap.get(key)) && adoptPreloadPropsForScript(src, options3), resource = ownerDocument.createElement("script"), markNodeAsHoistable(resource), setInitialProperties(resource, "link", src), ownerDocument.head.appendChild(resource)), resource = {
            type: "script",
            instance: resource,
            count: 1,
            state: null
          }, scripts.set(key, resource));
        }
      }
      function preinitModuleScript(src, options3) {
        previousDispatcher.M(src, options3);
        var ownerDocument = globalDocument;
        if (ownerDocument && src) {
          var scripts = getResourcesFromRoot(ownerDocument).hoistableScripts, key = getScriptKey(src), resource = scripts.get(key);
          resource || (resource = ownerDocument.querySelector(getScriptSelectorFromKey(key)), resource || (src = assign({ src, async: !0, type: "module" }, options3), (options3 = preloadPropsMap.get(key)) && adoptPreloadPropsForScript(src, options3), resource = ownerDocument.createElement("script"), markNodeAsHoistable(resource), setInitialProperties(resource, "link", src), ownerDocument.head.appendChild(resource)), resource = {
            type: "script",
            instance: resource,
            count: 1,
            state: null
          }, scripts.set(key, resource));
        }
      }
      function getResource(type, currentProps, pendingProps, currentResource) {
        var JSCompiler_inline_result = (JSCompiler_inline_result = rootInstanceStackCursor.current) ? getHoistableRoot(JSCompiler_inline_result) : null;
        if (!JSCompiler_inline_result) throw Error(formatProdErrorMessage(446));
        switch (type) {
          case "meta":
          case "title":
            return null;
          case "style":
            return typeof pendingProps.precedence == "string" && typeof pendingProps.href == "string" ? (pendingProps = getStyleKey(pendingProps.href), currentProps = getResourcesFromRoot(
              JSCompiler_inline_result
            ).hoistableStyles, currentResource = currentProps.get(pendingProps), currentResource || (currentResource = {
              type: "style",
              instance: null,
              count: 0,
              state: null
            }, currentProps.set(pendingProps, currentResource)), currentResource) : { type: "void", instance: null, count: 0, state: null };
          case "link":
            if (pendingProps.rel === "stylesheet" && typeof pendingProps.href == "string" && typeof pendingProps.precedence == "string") {
              type = getStyleKey(pendingProps.href);
              var styles$268 = getResourcesFromRoot(
                JSCompiler_inline_result
              ).hoistableStyles, resource$269 = styles$268.get(type);
              if (resource$269 || (JSCompiler_inline_result = JSCompiler_inline_result.ownerDocument || JSCompiler_inline_result, resource$269 = {
                type: "stylesheet",
                instance: null,
                count: 0,
                state: { loading: 0, preload: null }
              }, styles$268.set(type, resource$269), (styles$268 = JSCompiler_inline_result.querySelector(
                getStylesheetSelectorFromKey(type)
              )) ? styles$268._p || (resource$269.instance = styles$268, resource$269.state.loading = 5) : (styles$268 = preloadPropsMap.get(type), styles$268 || (styles$268 = {
                rel: "preload",
                as: "style",
                href: pendingProps.href,
                crossOrigin: pendingProps.crossOrigin,
                integrity: pendingProps.integrity,
                media: pendingProps.media,
                hrefLang: pendingProps.hrefLang,
                referrerPolicy: pendingProps.referrerPolicy
              }, preloadPropsMap.set(type, styles$268)), preloadStylesheet(
                JSCompiler_inline_result,
                type,
                styles$268,
                resource$269.state
              ))), currentProps && currentResource === null)
                throw Error(formatProdErrorMessage(528, ""));
              return resource$269;
            }
            if (currentProps && currentResource !== null)
              throw Error(formatProdErrorMessage(529, ""));
            return null;
          case "script":
            return currentProps = pendingProps.async, pendingProps = pendingProps.src, typeof pendingProps == "string" && currentProps && typeof currentProps != "function" && typeof currentProps != "symbol" ? (pendingProps = getScriptKey(pendingProps), currentProps = getResourcesFromRoot(
              JSCompiler_inline_result
            ).hoistableScripts, currentResource = currentProps.get(pendingProps), currentResource || (currentResource = {
              type: "script",
              instance: null,
              count: 0,
              state: null
            }, currentProps.set(pendingProps, currentResource)), currentResource) : { type: "void", instance: null, count: 0, state: null };
          default:
            throw Error(formatProdErrorMessage(444, type));
        }
      }
      function getStyleKey(href) {
        return 'href="' + escapeSelectorAttributeValueInsideDoubleQuotes(href) + '"';
      }
      function getStylesheetSelectorFromKey(key) {
        return 'link[rel="stylesheet"][' + key + "]";
      }
      function stylesheetPropsFromRawProps(rawProps) {
        return assign({}, rawProps, {
          "data-precedence": rawProps.precedence,
          precedence: null
        });
      }
      function preloadStylesheet(ownerDocument, key, preloadProps, state) {
        if (key = ownerDocument.querySelector(
          'link[rel="preload"][as="style"][' + key + "]"
        )) {
          if (key[internalLoadPendingKey] !== !0) {
            state.loading = 1;
            return;
          }
        } else
          key = ownerDocument.createElement("link"), key[internalLoadPendingKey] = !0, key.onload = key.onerror = clearPendingLoadOnNode.bind(null, key), setInitialProperties(key, "link", preloadProps), markNodeAsHoistable(key), ownerDocument.head.appendChild(key);
        state.preload = key, key.addEventListener("load", function() {
          return state.loading |= 1;
        }), key.addEventListener("error", function() {
          return state.loading |= 2;
        });
      }
      function getScriptKey(src) {
        return '[src="' + escapeSelectorAttributeValueInsideDoubleQuotes(src) + '"]';
      }
      function getScriptSelectorFromKey(key) {
        return "script[async]" + key;
      }
      function acquireResource(hoistableRoot, resource, props) {
        if (resource.count++, resource.instance === null)
          switch (resource.type) {
            case "style":
              var instance = hoistableRoot.querySelector(
                'style[data-href~="' + escapeSelectorAttributeValueInsideDoubleQuotes(props.href) + '"]'
              );
              if (instance)
                return resource.instance = instance, markNodeAsHoistable(instance), instance;
              var styleProps = assign({}, props, {
                "data-href": props.href,
                "data-precedence": props.precedence,
                href: null,
                precedence: null
              });
              return instance = (hoistableRoot.ownerDocument || hoistableRoot).createElement(
                "style"
              ), markNodeAsHoistable(instance), setInitialProperties(instance, "style", styleProps), insertStylesheet(instance, props.precedence, hoistableRoot), resource.instance = instance;
            case "stylesheet":
              styleProps = getStyleKey(props.href);
              var instance$274 = hoistableRoot.querySelector(
                getStylesheetSelectorFromKey(styleProps)
              );
              if (instance$274)
                return resource.state.loading |= 4, resource.instance = instance$274, markNodeAsHoistable(instance$274), instance$274;
              instance = stylesheetPropsFromRawProps(props), (styleProps = preloadPropsMap.get(styleProps)) && adoptPreloadPropsForStylesheet(instance, styleProps), instance$274 = (hoistableRoot.ownerDocument || hoistableRoot).createElement("link"), markNodeAsHoistable(instance$274);
              var linkInstance = instance$274;
              return linkInstance._p = new Promise(function(resolve, reject) {
                linkInstance.onload = resolve, linkInstance.onerror = reject;
              }), setInitialProperties(instance$274, "link", instance), resource.state.loading |= 4, insertStylesheet(instance$274, props.precedence, hoistableRoot), resource.instance = instance$274;
            case "script":
              return instance$274 = getScriptKey(props.src), (styleProps = hoistableRoot.querySelector(
                getScriptSelectorFromKey(instance$274)
              )) ? (resource.instance = styleProps, markNodeAsHoistable(styleProps), styleProps) : (instance = props, (styleProps = preloadPropsMap.get(instance$274)) && (instance = assign({}, props), adoptPreloadPropsForScript(instance, styleProps)), hoistableRoot = hoistableRoot.ownerDocument || hoistableRoot, styleProps = hoistableRoot.createElement("script"), markNodeAsHoistable(styleProps), setInitialProperties(styleProps, "link", instance), hoistableRoot.head.appendChild(styleProps), resource.instance = styleProps);
            case "void":
              return null;
            default:
              throw Error(formatProdErrorMessage(443, resource.type));
          }
        else
          resource.type === "stylesheet" && (resource.state.loading & 4) === 0 && (instance = resource.instance, resource.state.loading |= 4, insertStylesheet(instance, props.precedence, hoistableRoot));
        return resource.instance;
      }
      function insertStylesheet(instance, precedence, root2) {
        for (var nodes = root2.querySelectorAll(
          'link[rel="stylesheet"][data-precedence],style[data-precedence]'
        ), last = nodes.length ? nodes[nodes.length - 1] : null, prior = last, i = 0; i < nodes.length; i++) {
          var node = nodes[i];
          if (node.dataset.precedence === precedence) prior = node;
          else if (prior !== last) break;
        }
        prior ? prior.parentNode.insertBefore(instance, prior.nextSibling) : (precedence = root2.nodeType === 9 ? root2.head : root2, precedence.insertBefore(instance, precedence.firstChild));
      }
      function adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps) {
        stylesheetProps.crossOrigin == null && (stylesheetProps.crossOrigin = preloadProps.crossOrigin), stylesheetProps.referrerPolicy == null && (stylesheetProps.referrerPolicy = preloadProps.referrerPolicy), stylesheetProps.title == null && (stylesheetProps.title = preloadProps.title);
      }
      function adoptPreloadPropsForScript(scriptProps, preloadProps) {
        scriptProps.crossOrigin == null && (scriptProps.crossOrigin = preloadProps.crossOrigin), scriptProps.referrerPolicy == null && (scriptProps.referrerPolicy = preloadProps.referrerPolicy), scriptProps.integrity == null && (scriptProps.integrity = preloadProps.integrity);
      }
      var tagCaches = null;
      function getHydratableHoistableCache(type, keyAttribute, ownerDocument) {
        if (tagCaches === null) {
          var cache = /* @__PURE__ */ new Map(), caches = tagCaches = /* @__PURE__ */ new Map();
          caches.set(ownerDocument, cache);
        } else
          caches = tagCaches, cache = caches.get(ownerDocument), cache || (cache = /* @__PURE__ */ new Map(), caches.set(ownerDocument, cache));
        if (cache.has(type)) return cache;
        for (cache.set(type, null), ownerDocument = ownerDocument.getElementsByTagName(type), caches = 0; caches < ownerDocument.length; caches++) {
          var node = ownerDocument[caches];
          if (!(node[internalHoistableMarker] || node[internalInstanceKey] || type === "link" && node.getAttribute("rel") === "stylesheet") && node.namespaceURI !== "http://www.w3.org/2000/svg") {
            var nodeKey = node.getAttribute(keyAttribute) || "";
            nodeKey = type + nodeKey;
            var existing = cache.get(nodeKey);
            existing ? existing.push(node) : cache.set(nodeKey, [node]);
          }
        }
        return cache;
      }
      function mountHoistable(hoistableRoot, type, instance) {
        hoistableRoot = hoistableRoot.ownerDocument || hoistableRoot, hoistableRoot.head.insertBefore(
          instance,
          type === "title" ? hoistableRoot.querySelector("head > title") : null
        );
      }
      function isHostHoistableType(type, props, hostContext) {
        if (hostContext === 1 || props.itemProp != null) return !1;
        switch (type) {
          case "meta":
          case "title":
            return !0;
          case "style":
            if (typeof props.precedence != "string" || typeof props.href != "string" || props.href === "")
              break;
            return !0;
          case "link":
            if (typeof props.rel != "string" || typeof props.href != "string" || props.href === "" || props.onLoad || props.onError)
              break;
            return props.rel === "stylesheet" ? (type = props.disabled, typeof props.precedence == "string" && type == null) : !0;
          case "script":
            if (props.async && typeof props.async != "function" && typeof props.async != "symbol" && !props.onLoad && !props.onError && props.src && typeof props.src == "string")
              return !0;
        }
        return !1;
      }
      function maySuspendCommit(type, props) {
        return type === "img" && props.src != null && props.src !== "" && props.onLoad == null && props.loading !== "lazy";
      }
      function preloadResource(resource) {
        return !(resource.type === "stylesheet" && (resource.state.loading & 3) === 0);
      }
      function estimateImageBytes(instance) {
        return (instance.width || 100) * (instance.height || 100) * (typeof devicePixelRatio == "number" ? devicePixelRatio : 1) * 0.25;
      }
      function suspendInstance(state, instance) {
        typeof instance.decode == "function" && (state.imgCount++, instance.complete || (state.imgBytes += estimateImageBytes(instance), state.suspenseyImages.push(instance)), state = onUnsuspendImg.bind(state), instance.decode().then(state, state));
      }
      function suspendResource(state, hoistableRoot, resource, props) {
        if (resource.type === "stylesheet" && (typeof props.media != "string" || matchMedia(props.media).matches !== !1) && (resource.state.loading & 4) === 0) {
          if (resource.instance === null) {
            var key = getStyleKey(props.href), instance = hoistableRoot.querySelector(
              getStylesheetSelectorFromKey(key)
            );
            if (instance) {
              hoistableRoot = instance._p, hoistableRoot !== null && typeof hoistableRoot == "object" && typeof hoistableRoot.then == "function" && (state.count++, state = onUnsuspend.bind(state), hoistableRoot.then(state, state)), resource.state.loading |= 4, resource.instance = instance, markNodeAsHoistable(instance);
              return;
            }
            instance = hoistableRoot.ownerDocument || hoistableRoot, props = stylesheetPropsFromRawProps(props), (key = preloadPropsMap.get(key)) && adoptPreloadPropsForStylesheet(props, key), instance = instance.createElement("link"), markNodeAsHoistable(instance);
            var linkInstance = instance;
            linkInstance._p = new Promise(function(resolve, reject) {
              linkInstance.onload = resolve, linkInstance.onerror = reject;
            }), setInitialProperties(instance, "link", props), resource.instance = instance;
          }
          state.stylesheets === null && (state.stylesheets = /* @__PURE__ */ new Map()), state.stylesheets.set(resource, hoistableRoot), (hoistableRoot = resource.state.preload) && (resource.state.loading & 3) === 0 && (state.count++, resource = onUnsuspend.bind(state), hoistableRoot.addEventListener("load", resource), hoistableRoot.addEventListener("error", resource));
        }
      }
      var estimatedBytesWithinLimit = 0;
      function waitForCommitToBeReady(state, timeoutOffset) {
        return state.stylesheets && state.count === 0 && insertSuspendedStylesheets(state, state.stylesheets), 0 < state.count || 0 < state.imgCount ? function(commit) {
          var stylesheetTimer = setTimeout(function() {
            if (state.stylesheets && insertSuspendedStylesheets(state, state.stylesheets), state.unsuspend) {
              var unsuspend = state.unsuspend;
              state.unsuspend = null, unsuspend();
            }
          }, 6e4 + timeoutOffset);
          0 < state.imgBytes && estimatedBytesWithinLimit === 0 && (estimatedBytesWithinLimit = 62500 * estimateBandwidth());
          var imgTimer = setTimeout(
            function() {
              if (state.waitingForImages = !1, state.count === 0 && (state.stylesheets && insertSuspendedStylesheets(state, state.stylesheets), state.unsuspend)) {
                var unsuspend = state.unsuspend;
                state.unsuspend = null, unsuspend();
              }
            },
            (state.imgBytes > estimatedBytesWithinLimit ? 50 : 800) + timeoutOffset
          );
          return state.unsuspend = commit, function() {
            state.unsuspend = null, clearTimeout(stylesheetTimer), clearTimeout(imgTimer);
          };
        } : null;
      }
      function checkIfFullyUnsuspended(state) {
        if (state.count === 0 && (state.imgCount === 0 || !state.waitingForImages)) {
          if (state.stylesheets) insertSuspendedStylesheets(state, state.stylesheets);
          else if (state.unsuspend) {
            var unsuspend = state.unsuspend;
            state.unsuspend = null, unsuspend();
          }
        }
      }
      function onUnsuspend() {
        this.count--, checkIfFullyUnsuspended(this);
      }
      function onUnsuspendImg() {
        this.imgCount--, checkIfFullyUnsuspended(this);
      }
      var precedencesByRoot = null;
      function insertSuspendedStylesheets(state, resources) {
        state.stylesheets = null, state.unsuspend !== null && (state.count++, precedencesByRoot = /* @__PURE__ */ new Map(), resources.forEach(insertStylesheetIntoRoot, state), precedencesByRoot = null, onUnsuspend.call(state));
      }
      function insertStylesheetIntoRoot(root2, resource) {
        if (!(resource.state.loading & 4)) {
          var precedences = precedencesByRoot.get(root2);
          if (precedences) var last = precedences.get(null);
          else {
            precedences = /* @__PURE__ */ new Map(), precedencesByRoot.set(root2, precedences);
            for (var nodes = root2.querySelectorAll(
              "link[data-precedence],style[data-precedence]"
            ), i = 0; i < nodes.length; i++) {
              var node = nodes[i];
              (node.nodeName === "LINK" || node.getAttribute("media") !== "not all") && (precedences.set(node.dataset.precedence, node), last = node);
            }
            last && precedences.set(null, last);
          }
          nodes = resource.instance, node = nodes.getAttribute("data-precedence"), i = precedences.get(node) || last, i === last && precedences.set(null, nodes), precedences.set(node, nodes), this.count++, last = onUnsuspend.bind(this), nodes.addEventListener("load", last), nodes.addEventListener("error", last), i ? i.parentNode.insertBefore(nodes, i.nextSibling) : (root2 = root2.nodeType === 9 ? root2.head : root2, root2.insertBefore(nodes, root2.firstChild)), resource.state.loading |= 4;
        }
      }
      var HostTransitionContext = {
        $$typeof: REACT_CONTEXT_TYPE,
        Provider: null,
        Consumer: null,
        _currentValue: sharedNotPendingObject,
        _currentValue2: sharedNotPendingObject,
        _threadCount: 0
      };