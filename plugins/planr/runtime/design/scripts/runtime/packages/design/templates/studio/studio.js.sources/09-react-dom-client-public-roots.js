
      function FiberRootNode(containerInfo, tag, hydrate, identifierPrefix, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator, formState) {
        this.tag = 1, this.containerInfo = containerInfo, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = createLaneMap(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = createLaneMap(0), this.hiddenUpdates = createLaneMap(null), this.identifierPrefix = identifierPrefix, this.onUncaughtError = onUncaughtError, this.onCaughtError = onCaughtError, this.onRecoverableError = onRecoverableError, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = formState, this.transitionTypes = null, this.incompleteTransitions = /* @__PURE__ */ new Map();
      }
      function createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, identifierPrefix, formState, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator) {
        return containerInfo = new FiberRootNode(
          containerInfo,
          tag,
          hydrate,
          identifierPrefix,
          onUncaughtError,
          onCaughtError,
          onRecoverableError,
          onDefaultTransitionIndicator,
          formState
        ), tag = 1, isStrictMode === !0 && (tag |= 24), isStrictMode = createFiberImplClass(3, null, null, tag), containerInfo.current = isStrictMode, isStrictMode.stateNode = containerInfo, tag = createCache(), tag.refCount++, containerInfo.pooledCache = tag, tag.refCount++, isStrictMode.memoizedState = {
          element: initialChildren,
          isDehydrated: hydrate,
          cache: tag
        }, initializeUpdateQueue(isStrictMode), containerInfo;
      }
      function getContextForSubtree(parentComponent) {
        return parentComponent ? (parentComponent = emptyContextObject, parentComponent) : emptyContextObject;
      }
      function updateContainerImpl(rootFiber, lane, element, container, parentComponent, callback) {
        parentComponent = getContextForSubtree(parentComponent), container.context === null ? container.context = parentComponent : container.pendingContext = parentComponent, container = createUpdate(lane), container.payload = { element }, callback = callback === void 0 ? null : callback, callback !== null && (container.callback = callback), element = enqueueUpdate(rootFiber, container, lane), element !== null && (scheduleUpdateOnFiber(element, rootFiber, lane), entangleTransitions(element, rootFiber, lane));
      }
      function markRetryLaneImpl(fiber, retryLane) {
        if (fiber = fiber.memoizedState, fiber !== null && fiber.dehydrated !== null) {
          var a = fiber.retryLane;
          fiber.retryLane = a !== 0 && a < retryLane ? a : retryLane;
        }
      }
      function markRetryLaneIfNotHydrated(fiber, retryLane) {
        markRetryLaneImpl(fiber, retryLane), (fiber = fiber.alternate) && markRetryLaneImpl(fiber, retryLane);
      }
      function attemptContinuousHydration(fiber) {
        if (fiber.tag === 13 || fiber.tag === 31) {
          var root2 = enqueueConcurrentRenderForLane(fiber, 67108864);
          root2 !== null && scheduleUpdateOnFiber(root2, fiber, 67108864), markRetryLaneIfNotHydrated(fiber, 67108864);
        }
      }
      function attemptHydrationAtCurrentPriority(fiber) {
        if (fiber.tag === 13 || fiber.tag === 31) {
          var lane = requestUpdateLane();
          lane = getBumpedLaneForHydrationByLane(lane);
          var root2 = enqueueConcurrentRenderForLane(fiber, lane);
          root2 !== null && scheduleUpdateOnFiber(root2, fiber, lane), markRetryLaneIfNotHydrated(fiber, lane);
        }
      }
      var _enabled = !0;
      function dispatchDiscreteEvent(domEventName, eventSystemFlags, container, nativeEvent) {
        var prevTransition = ReactSharedInternals.T;
        ReactSharedInternals.T = null;
        var previousPriority = ReactDOMSharedInternals.p;
        try {
          ReactDOMSharedInternals.p = 2, dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
        } finally {
          ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = prevTransition;
        }
      }
      function dispatchContinuousEvent(domEventName, eventSystemFlags, container, nativeEvent) {
        var prevTransition = ReactSharedInternals.T;
        ReactSharedInternals.T = null;
        var previousPriority = ReactDOMSharedInternals.p;
        try {
          ReactDOMSharedInternals.p = 8, dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
        } finally {
          ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = prevTransition;
        }
      }
      function dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
        if (_enabled) {
          var blockedOn = findInstanceBlockingEvent(nativeEvent);
          if (blockedOn === null)
            dispatchEventForPluginEventSystem(
              domEventName,
              eventSystemFlags,
              nativeEvent,
              return_targetInst,
              targetContainer
            ), clearIfContinuousEvent(domEventName, nativeEvent);
          else if (queueIfContinuousEvent(
            blockedOn,
            domEventName,
            eventSystemFlags,
            targetContainer,
            nativeEvent
          ))
            nativeEvent.stopPropagation();
          else if (clearIfContinuousEvent(domEventName, nativeEvent), eventSystemFlags & 4 && -1 < discreteReplayableEvents.indexOf(domEventName)) {
            for (; blockedOn !== null; ) {
              var fiber = getInstanceFromNode(blockedOn);
              if (fiber !== null)
                switch (fiber.tag) {
                  case 3:
                    if (fiber = fiber.stateNode, fiber.current.memoizedState.isDehydrated) {
                      var lanes = getHighestPriorityLanes(fiber.pendingLanes);
                      if (lanes !== 0) {
                        var root2 = fiber;
                        for (root2.pendingLanes |= 2, root2.entangledLanes |= 2; lanes; ) {
                          var lane = 1 << 31 - clz32(lanes);
                          root2.entanglements[1] |= lane, lanes &= ~lane;
                        }
                        ensureRootIsScheduled(fiber), (executionContext & 6) === 0 && (workInProgressRootRenderTargetTime = now() + 500, flushSyncWorkAcrossRoots_impl(0, !1));
                      }
                    }
                    break;
                  case 31:
                  case 13:
                    root2 = enqueueConcurrentRenderForLane(fiber, 2), root2 !== null && scheduleUpdateOnFiber(root2, fiber, 2), flushSyncWork$1(), markRetryLaneIfNotHydrated(fiber, 2);
                }
              if (fiber = findInstanceBlockingEvent(nativeEvent), fiber === null && dispatchEventForPluginEventSystem(
                domEventName,
                eventSystemFlags,
                nativeEvent,
                return_targetInst,
                targetContainer
              ), fiber === blockedOn) break;
              blockedOn = fiber;
            }
            blockedOn !== null && nativeEvent.stopPropagation();
          } else
            dispatchEventForPluginEventSystem(
              domEventName,
              eventSystemFlags,
              nativeEvent,
              null,
              targetContainer
            );
        }
      }
      function findInstanceBlockingEvent(nativeEvent) {
        return nativeEvent = getEventTarget(nativeEvent), findInstanceBlockingTarget(nativeEvent);
      }
      var return_targetInst = null;
      function findInstanceBlockingTarget(targetNode) {
        if (return_targetInst = null, targetNode = getClosestInstanceFromNode(targetNode), targetNode !== null) {
          var nearestMounted = getNearestMountedFiber(targetNode);
          if (nearestMounted === null) targetNode = null;
          else {
            var tag = nearestMounted.tag;
            if (tag === 13) {
              if (targetNode = getSuspenseInstanceFromFiber(nearestMounted), targetNode !== null) return targetNode;
              targetNode = null;
            } else if (tag === 31) {
              if (targetNode = getActivityInstanceFromFiber(nearestMounted), targetNode !== null) return targetNode;
              targetNode = null;
            } else if (tag === 3) {
              if (nearestMounted.stateNode.current.memoizedState.isDehydrated)
                return nearestMounted.tag === 3 ? nearestMounted.stateNode.containerInfo : null;
              targetNode = null;
            } else nearestMounted !== targetNode && (targetNode = null);
          }
        }
        return return_targetInst = targetNode, null;
      }
      function getEventPriority(domEventName) {
        switch (domEventName) {
          case "beforetoggle":
          case "cancel":
          case "click":
          case "close":
          case "contextmenu":
          case "copy":
          case "cut":
          case "auxclick":
          case "dblclick":
          case "dragend":
          case "dragstart":
          case "drop":
          case "focusin":
          case "focusout":
          case "input":
          case "invalid":
          case "keydown":
          case "keypress":
          case "keyup":
          case "mousedown":
          case "mouseup":
          case "paste":
          case "pause":
          case "play":
          case "pointercancel":
          case "pointerdown":
          case "pointerup":
          case "ratechange":
          case "reset":
          case "seeked":
          case "submit":
          case "toggle":
          case "touchcancel":
          case "touchend":
          case "touchstart":
          case "volumechange":
          case "change":
          case "selectionchange":
          case "textInput":
          case "compositionstart":
          case "compositionend":
          case "compositionupdate":
          case "beforeblur":
          case "afterblur":
          case "beforeinput":
          case "blur":
          case "fullscreenchange":
          case "fullscreenerror":
          case "focus":
          case "hashchange":
          case "popstate":
          case "select":
          case "selectstart":
            return 2;
          case "drag":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "mousemove":
          case "mouseout":
          case "mouseover":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "resize":
          case "scroll":
          case "touchmove":
          case "wheel":
          case "mouseenter":
          case "mouseleave":
          case "pointerenter":
          case "pointerleave":
            return 8;
          case "message":
            switch (getCurrentPriorityLevel()) {
              case ImmediatePriority:
                return 2;
              case UserBlockingPriority:
                return 8;
              case NormalPriority$1:
              case LowPriority:
                return 32;
              case IdlePriority:
                return 268435456;
              default:
                return 32;
            }
          default:
            return 32;
        }
      }
      var hasScheduledReplayAttempt = !1, queuedFocus = null, queuedDrag = null, queuedMouse = null, queuedPointers = /* @__PURE__ */ new Map(), queuedPointerCaptures = /* @__PURE__ */ new Map(), queuedExplicitHydrationTargets = [], discreteReplayableEvents = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(
        " "
      );
      function clearIfContinuousEvent(domEventName, nativeEvent) {
        switch (domEventName) {
          case "focusin":
          case "focusout":
            queuedFocus = null;
            break;
          case "dragenter":
          case "dragleave":
            queuedDrag = null;
            break;
          case "mouseover":
          case "mouseout":
            queuedMouse = null;
            break;
          case "pointerover":
          case "pointerout":
            queuedPointers.delete(nativeEvent.pointerId);
            break;
          case "gotpointercapture":
          case "lostpointercapture":
            queuedPointerCaptures.delete(nativeEvent.pointerId);
        }
      }
      function accumulateOrCreateContinuousQueuedReplayableEvent(existingQueuedEvent, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
        return existingQueuedEvent === null || existingQueuedEvent.nativeEvent !== nativeEvent ? (existingQueuedEvent = {
          blockedOn,
          domEventName,
          eventSystemFlags,
          nativeEvent,
          targetContainers: [targetContainer]
        }, blockedOn !== null && (blockedOn = getInstanceFromNode(blockedOn), blockedOn !== null && attemptContinuousHydration(blockedOn)), existingQueuedEvent) : (existingQueuedEvent.eventSystemFlags |= eventSystemFlags, blockedOn = existingQueuedEvent.targetContainers, targetContainer !== null && blockedOn.indexOf(targetContainer) === -1 && blockedOn.push(targetContainer), existingQueuedEvent);
      }
      function queueIfContinuousEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
        switch (domEventName) {
          case "focusin":
            return queuedFocus = accumulateOrCreateContinuousQueuedReplayableEvent(
              queuedFocus,
              blockedOn,
              domEventName,
              eventSystemFlags,
              targetContainer,
              nativeEvent
            ), !0;
          case "dragenter":
            return queuedDrag = accumulateOrCreateContinuousQueuedReplayableEvent(
              queuedDrag,
              blockedOn,
              domEventName,
              eventSystemFlags,
              targetContainer,
              nativeEvent
            ), !0;
          case "mouseover":
            return queuedMouse = accumulateOrCreateContinuousQueuedReplayableEvent(
              queuedMouse,
              blockedOn,
              domEventName,
              eventSystemFlags,
              targetContainer,
              nativeEvent
            ), !0;
          case "pointerover":
            var pointerId = nativeEvent.pointerId;
            return queuedPointers.set(
              pointerId,
              accumulateOrCreateContinuousQueuedReplayableEvent(
                queuedPointers.get(pointerId) || null,
                blockedOn,
                domEventName,
                eventSystemFlags,
                targetContainer,
                nativeEvent
              )
            ), !0;
          case "gotpointercapture":
            return pointerId = nativeEvent.pointerId, queuedPointerCaptures.set(
              pointerId,
              accumulateOrCreateContinuousQueuedReplayableEvent(
                queuedPointerCaptures.get(pointerId) || null,
                blockedOn,
                domEventName,
                eventSystemFlags,
                targetContainer,
                nativeEvent
              )
            ), !0;
        }
        return !1;
      }
      function attemptExplicitHydrationTarget(queuedTarget) {
        var targetInst = getClosestInstanceFromNode(queuedTarget.target);
        if (targetInst !== null) {
          var nearestMounted = getNearestMountedFiber(targetInst);
          if (nearestMounted !== null) {
            if (targetInst = nearestMounted.tag, targetInst === 13) {
              if (targetInst = getSuspenseInstanceFromFiber(nearestMounted), targetInst !== null) {
                queuedTarget.blockedOn = targetInst, runWithPriority(queuedTarget.priority, function() {
                  attemptHydrationAtCurrentPriority(nearestMounted);
                });
                return;
              }
            } else if (targetInst === 31) {
              if (targetInst = getActivityInstanceFromFiber(nearestMounted), targetInst !== null) {
                queuedTarget.blockedOn = targetInst, runWithPriority(queuedTarget.priority, function() {
                  attemptHydrationAtCurrentPriority(nearestMounted);
                });
                return;
              }
            } else if (targetInst === 3 && nearestMounted.stateNode.current.memoizedState.isDehydrated) {
              queuedTarget.blockedOn = nearestMounted.tag === 3 ? nearestMounted.stateNode.containerInfo : null;
              return;
            }
          }
        }
        queuedTarget.blockedOn = null;
      }
      function attemptReplayContinuousQueuedEvent(queuedEvent) {
        if (queuedEvent.blockedOn !== null) return !1;
        for (var targetContainers = queuedEvent.targetContainers; 0 < targetContainers.length; ) {
          var nextBlockedOn = findInstanceBlockingEvent(queuedEvent.nativeEvent);
          if (nextBlockedOn === null) {
            nextBlockedOn = queuedEvent.nativeEvent;
            var nativeEventClone = new nextBlockedOn.constructor(
              nextBlockedOn.type,
              nextBlockedOn
            );
            currentReplayingEvent = nativeEventClone, nextBlockedOn.target.dispatchEvent(nativeEventClone), currentReplayingEvent = null;
          } else
            return targetContainers = getInstanceFromNode(nextBlockedOn), targetContainers !== null && attemptContinuousHydration(targetContainers), queuedEvent.blockedOn = nextBlockedOn, !1;
          targetContainers.shift();
        }
        return !0;
      }
      function attemptReplayContinuousQueuedEventInMap(queuedEvent, key, map) {
        attemptReplayContinuousQueuedEvent(queuedEvent) && map.delete(key);
      }
      function replayUnblockedEvents() {
        hasScheduledReplayAttempt = !1, queuedFocus !== null && attemptReplayContinuousQueuedEvent(queuedFocus) && (queuedFocus = null), queuedDrag !== null && attemptReplayContinuousQueuedEvent(queuedDrag) && (queuedDrag = null), queuedMouse !== null && attemptReplayContinuousQueuedEvent(queuedMouse) && (queuedMouse = null), queuedPointers.forEach(attemptReplayContinuousQueuedEventInMap), queuedPointerCaptures.forEach(attemptReplayContinuousQueuedEventInMap);
      }
      function scheduleCallbackIfUnblocked(queuedEvent, unblocked) {
        queuedEvent.blockedOn === unblocked && (queuedEvent.blockedOn = null, hasScheduledReplayAttempt || (hasScheduledReplayAttempt = !0, Scheduler.unstable_scheduleCallback(
          Scheduler.unstable_NormalPriority,
          replayUnblockedEvents
        )));
      }
      var lastScheduledReplayQueue = null;
      function scheduleReplayQueueIfNeeded(formReplayingQueue) {
        lastScheduledReplayQueue !== formReplayingQueue && (lastScheduledReplayQueue = formReplayingQueue, Scheduler.unstable_scheduleCallback(
          Scheduler.unstable_NormalPriority,
          function() {
            lastScheduledReplayQueue === formReplayingQueue && (lastScheduledReplayQueue = null);
            for (var i = 0; i < formReplayingQueue.length; i += 3) {
              var form = formReplayingQueue[i], submitterOrAction = formReplayingQueue[i + 1], formData = formReplayingQueue[i + 2];
              if (typeof submitterOrAction != "function") {
                if (findInstanceBlockingTarget(submitterOrAction || form) === null)
                  continue;
                break;
              }
              var formInst = getInstanceFromNode(form);
              formInst !== null && (formReplayingQueue.splice(i, 3), i -= 3, startHostTransition(
                formInst,
                {
                  pending: !0,
                  data: formData,
                  method: form.method,
                  action: submitterOrAction
                },
                submitterOrAction,
                formData
              ));
            }
          }
        ));
      }
      function retryIfBlockedOn(unblocked) {
        function unblock(queuedEvent) {
          return scheduleCallbackIfUnblocked(queuedEvent, unblocked);
        }
        queuedFocus !== null && scheduleCallbackIfUnblocked(queuedFocus, unblocked), queuedDrag !== null && scheduleCallbackIfUnblocked(queuedDrag, unblocked), queuedMouse !== null && scheduleCallbackIfUnblocked(queuedMouse, unblocked), queuedPointers.forEach(unblock), queuedPointerCaptures.forEach(unblock);
        for (var i = 0; i < queuedExplicitHydrationTargets.length; i++) {
          var queuedTarget = queuedExplicitHydrationTargets[i];
          queuedTarget.blockedOn === unblocked && (queuedTarget.blockedOn = null);
        }
        for (; 0 < queuedExplicitHydrationTargets.length && (i = queuedExplicitHydrationTargets[0], i.blockedOn === null); )
          attemptExplicitHydrationTarget(i), i.blockedOn === null && queuedExplicitHydrationTargets.shift();
        if (i = (unblocked.ownerDocument || unblocked).$$reactFormReplay, i != null)
          for (queuedTarget = 0; queuedTarget < i.length; queuedTarget += 3) {
            var form = i[queuedTarget], submitterOrAction = i[queuedTarget + 1], formProps = form[internalPropsKey] || null;
            if (typeof submitterOrAction == "function")
              formProps || scheduleReplayQueueIfNeeded(i);
            else if (formProps) {
              var action = null;
              if (submitterOrAction && submitterOrAction.hasAttribute("formAction")) {
                if (form = submitterOrAction, formProps = submitterOrAction[internalPropsKey] || null)
                  action = formProps.formAction;
                else if (findInstanceBlockingTarget(form) !== null) continue;
              } else action = formProps.action;
              typeof action == "function" ? i[queuedTarget + 1] = action : (i.splice(queuedTarget, 3), queuedTarget -= 3), scheduleReplayQueueIfNeeded(i);
            }
          }
      }
      function defaultOnDefaultTransitionIndicator() {
        function handleNavigate(event) {
          event.canIntercept && event.info === "react-transition" && event.intercept({
            handler: function() {
              return new Promise(function(resolve) {
                return pendingResolve = resolve;
              });
            },
            focusReset: "manual",
            scroll: "manual"
          });
        }
        function handleNavigateComplete() {
          pendingResolve !== null && (pendingResolve(), pendingResolve = null), isCancelled || setTimeout(startFakeNavigation, 20);
        }
        function startFakeNavigation() {
          if (!isCancelled && !navigation.transition) {
            var currentEntry = navigation.currentEntry;
            currentEntry && currentEntry.url != null && navigation.navigate(currentEntry.url, {
              state: currentEntry.getState(),
              info: "react-transition",
              history: "replace"
            });
          }
        }
        if (typeof navigation == "object") {
          var isCancelled = !1, pendingResolve = null;
          return navigation.addEventListener("navigate", handleNavigate), navigation.addEventListener("navigatesuccess", handleNavigateComplete), navigation.addEventListener("navigateerror", handleNavigateComplete), setTimeout(startFakeNavigation, 100), function() {
            isCancelled = !0, navigation.removeEventListener("navigate", handleNavigate), navigation.removeEventListener("navigatesuccess", handleNavigateComplete), navigation.removeEventListener("navigateerror", handleNavigateComplete), pendingResolve !== null && (pendingResolve(), pendingResolve = null);
          };
        }
      }
      function ReactDOMRoot(internalRoot) {
        this._internalRoot = internalRoot;
      }
      ReactDOMHydrationRoot.prototype.render = ReactDOMRoot.prototype.render = function(children) {
        var root2 = this._internalRoot;
        if (root2 === null) throw Error(formatProdErrorMessage(409));
        var current = root2.current, lane = requestUpdateLane();
        updateContainerImpl(current, lane, children, root2, null, null);
      };
      ReactDOMHydrationRoot.prototype.unmount = ReactDOMRoot.prototype.unmount = function() {
        var root2 = this._internalRoot;
        if (root2 !== null) {
          this._internalRoot = null;
          var container = root2.containerInfo;
          updateContainerImpl(root2.current, 2, null, root2, null, null), flushSyncWork$1(), container[internalContainerInstanceKey] = null;
        }
      };
      function ReactDOMHydrationRoot(internalRoot) {
        this._internalRoot = internalRoot;
      }
      ReactDOMHydrationRoot.prototype.unstable_scheduleHydration = function(target) {
        if (target) {
          var updatePriority = resolveUpdatePriority();
          target = { blockedOn: null, target, priority: updatePriority };
          for (var i = 0; i < queuedExplicitHydrationTargets.length && updatePriority !== 0 && updatePriority < queuedExplicitHydrationTargets[i].priority; i++) ;
          queuedExplicitHydrationTargets.splice(i, 0, target), i === 0 && attemptExplicitHydrationTarget(target);
        }
      };
      var isomorphicReactPackageVersion$jscomp$inline_2043 = React36.version;
      if (isomorphicReactPackageVersion$jscomp$inline_2043 !== "19.3.0")
        throw Error(
          formatProdErrorMessage(
            527,
            isomorphicReactPackageVersion$jscomp$inline_2043,
            "19.3.0"
          )
        );
      ReactDOMSharedInternals.findDOMNode = function(componentOrElement) {
        var fiber = componentOrElement._reactInternals;
        if (fiber === void 0)
          throw typeof componentOrElement.render == "function" ? Error(formatProdErrorMessage(188)) : (componentOrElement = Object.keys(componentOrElement).join(","), Error(formatProdErrorMessage(268, componentOrElement)));
        return componentOrElement = findCurrentFiberUsingSlowPath(fiber), componentOrElement = componentOrElement !== null ? findCurrentHostFiberImpl(componentOrElement) : null, componentOrElement = componentOrElement === null ? null : componentOrElement.stateNode, componentOrElement;
      };
      var internals$jscomp$inline_2586 = {
        bundleType: 0,
        version: "19.3.0",
        rendererPackageName: "react-dom",
        currentDispatcherRef: ReactSharedInternals,
        reconcilerVersion: "19.3.0"
      };
      if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && (hook$jscomp$inline_2587 = __REACT_DEVTOOLS_GLOBAL_HOOK__, !hook$jscomp$inline_2587.isDisabled && hook$jscomp$inline_2587.supportsFiber))
        try {
          rendererID = hook$jscomp$inline_2587.inject(
            internals$jscomp$inline_2586
          ), injectedHook = hook$jscomp$inline_2587;
        } catch {
        }
      var hook$jscomp$inline_2587;
      exports.createRoot = function(container, options3) {
        if (!isValidContainer(container)) throw Error(formatProdErrorMessage(299));
        var isStrictMode = !1, identifierPrefix = "", onUncaughtError = defaultOnUncaughtError, onCaughtError = defaultOnCaughtError, onRecoverableError = defaultOnRecoverableError;
        return options3 != null && (options3.unstable_strictMode === !0 && (isStrictMode = !0), options3.identifierPrefix !== void 0 && (identifierPrefix = options3.identifierPrefix), options3.onUncaughtError !== void 0 && (onUncaughtError = options3.onUncaughtError), options3.onCaughtError !== void 0 && (onCaughtError = options3.onCaughtError), options3.onRecoverableError !== void 0 && (onRecoverableError = options3.onRecoverableError)), options3 = createFiberRoot(
          container,
          1,
          !1,
          null,
          null,
          isStrictMode,
          identifierPrefix,
          null,
          onUncaughtError,
          onCaughtError,
          onRecoverableError,
          defaultOnDefaultTransitionIndicator
        ), container[internalContainerInstanceKey] = options3.current, listenToAllSupportedEvents(container), new ReactDOMRoot(options3);
      };
      exports.hydrateRoot = function(container, initialChildren, options3) {
        if (!isValidContainer(container)) throw Error(formatProdErrorMessage(299));
        var isStrictMode = !1, identifierPrefix = "", onUncaughtError = defaultOnUncaughtError, onCaughtError = defaultOnCaughtError, onRecoverableError = defaultOnRecoverableError, formState = null;
        return options3 != null && (options3.unstable_strictMode === !0 && (isStrictMode = !0), options3.identifierPrefix !== void 0 && (identifierPrefix = options3.identifierPrefix), options3.onUncaughtError !== void 0 && (onUncaughtError = options3.onUncaughtError), options3.onCaughtError !== void 0 && (onCaughtError = options3.onCaughtError), options3.onRecoverableError !== void 0 && (onRecoverableError = options3.onRecoverableError), options3.formState !== void 0 && (formState = options3.formState)), initialChildren = createFiberRoot(
          container,
          1,
          !0,
          initialChildren,
          options3 ?? null,
          isStrictMode,
          identifierPrefix,
          formState,
          onUncaughtError,
          onCaughtError,
          onRecoverableError,
          defaultOnDefaultTransitionIndicator
        ), initialChildren.context = getContextForSubtree(null), options3 = initialChildren.current, isStrictMode = requestUpdateLane(), isStrictMode = getBumpedLaneForHydrationByLane(isStrictMode), identifierPrefix = createUpdate(isStrictMode), identifierPrefix.callback = null, enqueueUpdate(options3, identifierPrefix, isStrictMode), options3 = isStrictMode, initialChildren.current.lanes = options3, markRootUpdated$1(initialChildren, options3), ensureRootIsScheduled(initialChildren), container[internalContainerInstanceKey] = initialChildren.current, listenToAllSupportedEvents(container), new ReactDOMHydrationRoot(initialChildren);
      };
      exports.version = "19.3.0";