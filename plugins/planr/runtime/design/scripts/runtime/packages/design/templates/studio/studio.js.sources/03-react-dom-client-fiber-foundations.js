
      "use strict";
      /**
       * @license React
       * react-dom-client.production.js
       *
       * Copyright (c) Meta Platforms, Inc. and affiliates.
       *
       * This source code is licensed under the MIT license found in the
       * LICENSE file in the root directory of this source tree.
       */
      var Scheduler = require_scheduler(), React36 = require_react(), ReactDOM4 = require_react_dom();
      function formatProdErrorMessage(code) {
        var url = "https://react.dev/errors/" + code;
        if (1 < arguments.length) {
          url += "?args[]=" + encodeURIComponent(arguments[1]);
          for (var i = 2; i < arguments.length; i++)
            url += "&args[]=" + encodeURIComponent(arguments[i]);
        }
        return "Minified React error #" + code + "; visit " + url + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      function isValidContainer(node) {
        return !(!node || node.nodeType !== 1 && node.nodeType !== 9 && node.nodeType !== 11);
      }
      function getNearestMountedFiber(fiber) {
        for (var node = fiber, nextNode = node; nextNode && !nextNode.alternate; )
          node = nextNode, (node.flags & 4098) !== 0 && (fiber = node.return), nextNode = node.return;
        for (; node.return; ) node = node.return;
        return node.tag === 3 ? fiber : null;
      }
      function getSuspenseInstanceFromFiber(fiber) {
        if (fiber.tag === 13) {
          var suspenseState = fiber.memoizedState;
          if (suspenseState === null && (fiber = fiber.alternate, fiber !== null && (suspenseState = fiber.memoizedState)), suspenseState !== null) return suspenseState.dehydrated;
        }
        return null;
      }
      function getActivityInstanceFromFiber(fiber) {
        if (fiber.tag === 31) {
          var activityState = fiber.memoizedState;
          if (activityState === null && (fiber = fiber.alternate, fiber !== null && (activityState = fiber.memoizedState)), activityState !== null) return activityState.dehydrated;
        }
        return null;
      }
      function assertIsMounted(fiber) {
        if (getNearestMountedFiber(fiber) !== fiber)
          throw Error(formatProdErrorMessage(188));
      }
      function findCurrentFiberUsingSlowPath(fiber) {
        var alternate = fiber.alternate;
        if (!alternate) {
          if (alternate = getNearestMountedFiber(fiber), alternate === null) throw Error(formatProdErrorMessage(188));
          return alternate !== fiber ? null : fiber;
        }
        for (var a = fiber, b = alternate; ; ) {
          var parentA = a.return;
          if (parentA === null) break;
          var parentB = parentA.alternate;
          if (parentB === null) {
            if (b = parentA.return, b !== null) {
              a = b;
              continue;
            }
            break;
          }
          if (parentA.child === parentB.child) {
            for (parentB = parentA.child; parentB; ) {
              if (parentB === a) return assertIsMounted(parentA), fiber;
              if (parentB === b) return assertIsMounted(parentA), alternate;
              parentB = parentB.sibling;
            }
            throw Error(formatProdErrorMessage(188));
          }
          if (a.return !== b.return) a = parentA, b = parentB;
          else {
            for (var didFindChild = !1, child$0 = parentA.child; child$0; ) {
              if (child$0 === a) {
                didFindChild = !0, a = parentA, b = parentB;
                break;
              }
              if (child$0 === b) {
                didFindChild = !0, b = parentA, a = parentB;
                break;
              }
              child$0 = child$0.sibling;
            }
            if (!didFindChild) {
              for (child$0 = parentB.child; child$0; ) {
                if (child$0 === a) {
                  didFindChild = !0, a = parentB, b = parentA;
                  break;
                }
                if (child$0 === b) {
                  didFindChild = !0, b = parentB, a = parentA;
                  break;
                }
                child$0 = child$0.sibling;
              }
              if (!didFindChild) throw Error(formatProdErrorMessage(189));
            }
          }
          if (a.alternate !== b) throw Error(formatProdErrorMessage(190));
        }
        if (a.tag !== 3) throw Error(formatProdErrorMessage(188));
        return a.stateNode.current === a ? fiber : alternate;
      }
      function findCurrentHostFiberImpl(node) {
        var tag = node.tag;
        if (tag === 5 || tag === 26 || tag === 27 || tag === 6) return node;
        for (node = node.child; node !== null; ) {
          if (tag = findCurrentHostFiberImpl(node), tag !== null) return tag;
          node = node.sibling;
        }
        return null;
      }
      function traverseVisibleInstancesAndTextInstances(child, searchWithinHosts, fn, a, b, c) {
        for (; child !== null; ) {
          if ((child.tag === 5 || child.tag === 27 || child.tag === 6) && fn(child, a, b, c) || (child.tag !== 22 || child.memoizedState === null) && (searchWithinHosts || child.tag !== 5 && child.tag !== 27) && traverseVisibleInstancesAndTextInstances(
            child.child,
            searchWithinHosts,
            fn,
            a,
            b,
            c
          ))
            return !0;
          child = child.sibling;
        }
        return !1;
      }
      function getFragmentParentInstanceOrContainerFiber(fiber) {
        for (fiber = fiber.return; fiber !== null; ) {
          if (fiber.tag === 3 || fiber.tag === 5 || fiber.tag === 27) return fiber;
          fiber = fiber.return;
        }
        return null;
      }
      function fiberIsPortaledIntoHost(fiber) {
        var foundPortalParent = !1;
        for (fiber = fiber.return; fiber !== null && (fiber.tag === 4 && (foundPortalParent = !0), !(fiber.tag === 3 || fiber.tag === 5 || fiber.tag === 27)); )
          fiber = fiber.return;
        return foundPortalParent;
      }
      function getFragmentInstanceOrTextInstanceSiblings(fiber) {
        var result = [null, null], parentHostFiber = getFragmentParentInstanceOrContainerFiber(fiber);
        return parentHostFiber === null || findFragmentInstanceOrTextInstanceSiblings(
          result,
          fiber,
          parentHostFiber.child,
          { foundSelf: !1 }
        ), result;
      }
      function findFragmentInstanceOrTextInstanceSiblings(result, self, child, state) {
        for (; child !== null; ) {
          if (child === self) state.foundSelf = !0;
          else if (child.tag === 5 || child.tag === 27 || child.tag === 6) {
            if (state.foundSelf) return result[1] = child, !0;
            result[0] = child;
          } else if ((child.tag !== 22 || child.memoizedState === null) && findFragmentInstanceOrTextInstanceSiblings(
            result,
            self,
            child.child,
            state
          ))
            return !0;
          child = child.sibling;
        }
        return !1;
      }
      function getInstanceFromHostFiber(fiber) {
        switch (fiber.tag) {
          case 5:
          case 27:
          case 6:
            return fiber.stateNode;
          case 3:
            return fiber.stateNode.containerInfo;
          default:
            throw Error(formatProdErrorMessage(559));
        }
      }
      var searchTarget = null, searchBoundary = null;
      function isFiberPrecedingCheck(child, target, boundary) {
        return child === boundary ? !0 : child === target ? (searchTarget = child, !0) : !1;
      }
      function isFiberFollowingCheck(child, target, boundary) {
        return child === boundary ? (searchBoundary = child, !1) : child === target ? (searchBoundary !== null && (searchTarget = child), !0) : !1;
      }
      function getParentForFragmentAncestors(inst) {
        if (inst === null) return null;
        do
          inst = inst === null ? null : inst.return;
        while (inst && inst.tag !== 5 && inst.tag !== 27 && inst.tag !== 3);
        return inst || null;
      }
      function getLowestCommonAncestor(instA, instB, getParent2) {
        for (var depthA = 0, tempA = instA; tempA; tempA = getParent2(tempA)) depthA++;
        tempA = 0;
        for (var tempB = instB; tempB; tempB = getParent2(tempB)) tempA++;
        for (; 0 < depthA - tempA; ) instA = getParent2(instA), depthA--;
        for (; 0 < tempA - depthA; ) instB = getParent2(instB), tempA--;
        for (; depthA--; ) {
          if (instA === instB || instB !== null && instA === instB.alternate)
            return instA;
          instA = getParent2(instA), instB = getParent2(instB);
        }
        return null;
      }
      var assign = Object.assign, REACT_LEGACY_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.element"), REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE2 = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), REACT_LEGACY_HIDDEN_TYPE = /* @__PURE__ */ Symbol.for("react.legacy_hidden"), REACT_MEMO_CACHE_SENTINEL = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel"), REACT_VIEW_TRANSITION_TYPE = /* @__PURE__ */ Symbol.for("react.view_transition"), REACT_RECOVERABLE_TYPE = /* @__PURE__ */ Symbol.for("react.recoverable"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
      function getIteratorFn(maybeIterable) {
        return maybeIterable === null || typeof maybeIterable != "object" ? null : (maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"], typeof maybeIterable == "function" ? maybeIterable : null);
      }
      var REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference");
      function getComponentNameFromType(type) {
        if (type == null) return null;
        if (typeof type == "function")
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if (typeof type == "string") return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
          case REACT_VIEW_TRANSITION_TYPE:
            return "ViewTransition";
        }
        if (typeof type == "object")
          switch (type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              return type = type.displayName, type || (type = innerType.displayName || innerType.name || "", type = type !== "" ? "ForwardRef(" + type + ")" : "ForwardRef"), type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, innerType !== null ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE2:
              innerType = type._payload, type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch {
              }
          }
        return null;
      }
      var isArrayImpl = Array.isArray, ReactSharedInternals = React36.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, ReactDOMSharedInternals = ReactDOM4.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, sharedNotPendingObject = {
        pending: !1,
        data: null,
        method: null,
        action: null
      }, valueStack = [], index2 = -1;
      function createCursor(defaultValue) {
        return { current: defaultValue };
      }
      function pop(cursor) {
        0 > index2 || (cursor.current = valueStack[index2], valueStack[index2] = null, index2--);
      }
      function push(cursor, value) {
        index2++, valueStack[index2] = cursor.current, cursor.current = value;
      }
      var contextStackCursor = createCursor(null), contextFiberStackCursor = createCursor(null), rootInstanceStackCursor = createCursor(null), hostTransitionProviderCursor = createCursor(null);
      function pushHostContainer(fiber, nextRootInstance) {
        switch (push(rootInstanceStackCursor, nextRootInstance), push(contextFiberStackCursor, fiber), push(contextStackCursor, null), nextRootInstance.nodeType) {
          case 9:
          case 11:
            fiber = (fiber = nextRootInstance.documentElement) && (fiber = fiber.namespaceURI) ? getOwnHostContext(fiber) : 0;
            break;
          default:
            if (fiber = nextRootInstance.tagName, nextRootInstance = nextRootInstance.namespaceURI)
              nextRootInstance = getOwnHostContext(nextRootInstance), fiber = getChildHostContextProd(nextRootInstance, fiber);
            else
              switch (fiber) {
                case "svg":
                  fiber = 1;
                  break;
                case "math":
                  fiber = 2;
                  break;
                default:
                  fiber = 0;
              }
        }
        pop(contextStackCursor), push(contextStackCursor, fiber);
      }
      function popHostContainer() {
        pop(contextStackCursor), pop(contextFiberStackCursor), pop(rootInstanceStackCursor);
      }
      function pushHostContext(fiber) {
        var stateHook = fiber.memoizedState;
        stateHook !== null && (HostTransitionContext._currentValue = stateHook.memoizedState, push(hostTransitionProviderCursor, fiber)), stateHook = contextStackCursor.current;
        var JSCompiler_inline_result = getChildHostContextProd(stateHook, fiber.type);
        stateHook !== JSCompiler_inline_result && (push(contextFiberStackCursor, fiber), push(contextStackCursor, JSCompiler_inline_result));
      }
      function popHostContext(fiber) {
        contextFiberStackCursor.current === fiber && (pop(contextStackCursor), pop(contextFiberStackCursor)), hostTransitionProviderCursor.current === fiber && (pop(hostTransitionProviderCursor), HostTransitionContext._currentValue = sharedNotPendingObject);
      }
      var prefix, suffix;
      function describeBuiltInComponentFrame(name) {
        if (prefix === void 0)
          try {
            throw Error();
          } catch (x) {
            var match = x.stack.trim().match(/\n( *(at )?)/);
            prefix = match && match[1] || "", suffix = -1 < x.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < x.stack.indexOf("@") ? "@unknown:0:0" : "";
          }
        return `
` + prefix + name + suffix;
      }
      var reentry = !1;
      function describeNativeComponentFrame(fn, construct) {
        if (!fn || reentry) return "";
        reentry = !0;
        var previousPrepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        try {
          var RunInRootFrame = {
            DetermineComponentFrameRoot: function() {
              try {
                if (construct) {
                  var Fake = function() {
                    throw Error();
                  };
                  if (Object.defineProperty(Fake.prototype, "props", {
                    set: function() {
                      throw Error();
                    }
                  }), typeof Reflect == "object" && Reflect.construct) {
                    try {
                      Reflect.construct(Fake, []);
                    } catch (x) {
                      var control = x;
                    }
                    Reflect.construct(fn, [], Fake);
                  } else {
                    try {
                      Fake.call();
                    } catch (x$1) {
                      control = x$1;
                    }
                    Fake = !1;
                    try {
                      var prevProps = Object.getOwnPropertyDescriptor(
                        fn.prototype,
                        "props"
                      );
                      Object.defineProperty(fn.prototype, "props", {
                        configurable: !0,
                        set: function() {
                          throw Error();
                        }
                      }), Fake = !0, new fn();
                    } finally {
                      Fake && (prevProps !== void 0 ? Object.defineProperty(fn.prototype, "props", prevProps) : delete fn.prototype.props);
                    }
                  }
                } else {
                  try {
                    throw Error();
                  } catch (x$2) {
                    control = x$2;
                  }
                  (Fake = fn()) && typeof Fake.catch == "function" && Fake.catch(function() {
                  });
                }
              } catch (sample) {
                if (sample && control && typeof sample.stack == "string")
                  return [sample.stack, control.stack];
              }
              return [null, null];
            }
          };
          RunInRootFrame.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
          var namePropDescriptor = Object.getOwnPropertyDescriptor(
            RunInRootFrame.DetermineComponentFrameRoot,
            "name"
          );
          namePropDescriptor && namePropDescriptor.configurable && Object.defineProperty(
            RunInRootFrame.DetermineComponentFrameRoot,
            "name",
            { value: "DetermineComponentFrameRoot" }
          );
          var _RunInRootFrame$Deter = RunInRootFrame.DetermineComponentFrameRoot(), sampleStack = _RunInRootFrame$Deter[0], controlStack = _RunInRootFrame$Deter[1];
          if (sampleStack && controlStack) {
            var sampleLines = sampleStack.split(`
`), controlLines = controlStack.split(`
`);
            for (namePropDescriptor = RunInRootFrame = 0; RunInRootFrame < sampleLines.length && !sampleLines[RunInRootFrame].includes("DetermineComponentFrameRoot"); )
              RunInRootFrame++;
            for (; namePropDescriptor < controlLines.length && !controlLines[namePropDescriptor].includes(
              "DetermineComponentFrameRoot"
            ); )
              namePropDescriptor++;
            if (RunInRootFrame === sampleLines.length || namePropDescriptor === controlLines.length)
              for (RunInRootFrame = sampleLines.length - 1, namePropDescriptor = controlLines.length - 1; 1 <= RunInRootFrame && 0 <= namePropDescriptor && sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]; )
                namePropDescriptor--;
            for (; 1 <= RunInRootFrame && 0 <= namePropDescriptor; RunInRootFrame--, namePropDescriptor--)
              if (sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
                if (RunInRootFrame !== 1 || namePropDescriptor !== 1)
                  do
                    if (RunInRootFrame--, namePropDescriptor--, 0 > namePropDescriptor || sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
                      var frame = `
` + sampleLines[RunInRootFrame].replace(" at new ", " at ");
                      return fn.displayName && frame.includes("<anonymous>") && (frame = frame.replace("<anonymous>", fn.displayName)), frame;
                    }
                  while (1 <= RunInRootFrame && 0 <= namePropDescriptor);
                break;
              }
          }
        } finally {
          reentry = !1, Error.prepareStackTrace = previousPrepareStackTrace;
        }
        return (previousPrepareStackTrace = fn ? fn.displayName || fn.name : "") ? describeBuiltInComponentFrame(previousPrepareStackTrace) : "";
      }
      function describeFiber(fiber, childFiber) {
        switch (fiber.tag) {
          case 26:
          case 27:
          case 5:
            return describeBuiltInComponentFrame(fiber.type);
          case 16:
            return describeBuiltInComponentFrame("Lazy");
          case 13:
            return fiber.child !== childFiber && childFiber !== null ? describeBuiltInComponentFrame("Suspense Fallback") : describeBuiltInComponentFrame("Suspense");
          case 19:
            return describeBuiltInComponentFrame("SuspenseList");
          case 0:
          case 15:
            return describeNativeComponentFrame(fiber.type, !1);
          case 11:
            return describeNativeComponentFrame(fiber.type.render, !1);
          case 1:
            return describeNativeComponentFrame(fiber.type, !0);
          case 31:
            return describeBuiltInComponentFrame("Activity");
          case 30:
            return describeBuiltInComponentFrame("ViewTransition");
          default:
            return "";
        }
      }
      function getStackByFiberInDevAndProd(workInProgress2) {
        try {
          var info = "", previous = null;
          do
            info += describeFiber(workInProgress2, previous), previous = workInProgress2, workInProgress2 = workInProgress2.return;
          while (workInProgress2);
          return info;
        } catch (x) {
          return `
Error generating stack: ` + x.message + `
` + x.stack;
        }
      }
      var hasOwnProperty = Object.prototype.hasOwnProperty, scheduleCallback$3 = Scheduler.unstable_scheduleCallback, cancelCallback$1 = Scheduler.unstable_cancelCallback, shouldYield = Scheduler.unstable_shouldYield, requestPaint = Scheduler.unstable_requestPaint, now = Scheduler.unstable_now, getCurrentPriorityLevel = Scheduler.unstable_getCurrentPriorityLevel, ImmediatePriority = Scheduler.unstable_ImmediatePriority, UserBlockingPriority = Scheduler.unstable_UserBlockingPriority, NormalPriority$1 = Scheduler.unstable_NormalPriority, LowPriority = Scheduler.unstable_LowPriority, IdlePriority = Scheduler.unstable_IdlePriority, log$1 = Scheduler.log, unstable_setDisableYieldValue = Scheduler.unstable_setDisableYieldValue, rendererID = null, injectedHook = null;
      function setIsStrictModeForDevtools(newIsStrictMode) {
        if (typeof log$1 == "function" && unstable_setDisableYieldValue(newIsStrictMode), injectedHook && typeof injectedHook.setStrictMode == "function")
          try {
            injectedHook.setStrictMode(rendererID, newIsStrictMode);
          } catch {
          }
      }
      var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback, log = Math.log, LN2 = Math.LN2;
      function clz32Fallback(x) {
        return x >>>= 0, x === 0 ? 32 : 31 - (log(x) / LN2 | 0) | 0;
      }
      var nextTransitionUpdateLane = 256, nextTransitionDeferredLane = 262144, nextRetryLane = 4194304;
      function getHighestPriorityLanes(lanes) {
        var pendingSyncLanes = lanes & 42;
        if (pendingSyncLanes !== 0) return pendingSyncLanes;
        switch (lanes & -lanes) {
          case 1:
            return 1;
          case 2:
            return 2;
          case 4:
            return 4;
          case 8:
            return 8;
          case 16:
            return 16;
          case 32:
            return 32;
          case 64:
            return 64;
          case 128:
            return 128;
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
            return lanes & -lanes;
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return lanes & 3932160;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            return lanes & 62914560;
          case 67108864:
            return 67108864;
          case 134217728:
            return 134217728;
          case 268435456:
            return 268435456;
          case 536870912:
            return 536870912;
          case 1073741824:
            return 0;
          default:
            return lanes;
        }
      }
      function getNextLanes(root2, wipLanes, rootHasPendingCommit) {
        var pendingLanes = root2.pendingLanes;
        if (pendingLanes === 0) return 0;
        var nextLanes = 0, suspendedLanes = root2.suspendedLanes, pingedLanes = root2.pingedLanes;
        root2 = root2.warmLanes;
        var nonIdlePendingLanes = pendingLanes & 134217727;
        return nonIdlePendingLanes !== 0 ? (pendingLanes = nonIdlePendingLanes & ~suspendedLanes, pendingLanes !== 0 ? nextLanes = getHighestPriorityLanes(pendingLanes) : (pingedLanes &= nonIdlePendingLanes, pingedLanes !== 0 ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = nonIdlePendingLanes & ~root2, rootHasPendingCommit !== 0 && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit))))) : (nonIdlePendingLanes = pendingLanes & ~suspendedLanes, nonIdlePendingLanes !== 0 ? nextLanes = getHighestPriorityLanes(nonIdlePendingLanes) : pingedLanes !== 0 ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = pendingLanes & ~root2, rootHasPendingCommit !== 0 && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit)))), nextLanes === 0 ? 0 : wipLanes !== 0 && wipLanes !== nextLanes && (wipLanes & suspendedLanes) === 0 && (suspendedLanes = nextLanes & -nextLanes, rootHasPendingCommit = wipLanes & -wipLanes, suspendedLanes >= rootHasPendingCommit || suspendedLanes === 32 && (rootHasPendingCommit & 4194048) !== 0) ? wipLanes : nextLanes;
      }
      function checkIfRootIsPrerendering(root2, renderLanes2) {
        return (root2.pendingLanes & ~(root2.suspendedLanes & ~root2.pingedLanes) & renderLanes2) === 0;
      }
      function getEntangledLanes(root2, renderLanes2) {
        (renderLanes2 & 8) !== 0 && (renderLanes2 |= renderLanes2 & 32);
        var allEntangledLanes = root2.entangledLanes;
        if (allEntangledLanes !== 0)
          for (root2 = root2.entanglements, allEntangledLanes &= renderLanes2; 0 < allEntangledLanes; ) {
            var index$4 = 31 - clz32(allEntangledLanes), lane = 1 << index$4;
            renderLanes2 |= root2[index$4], allEntangledLanes &= ~lane;
          }
        return renderLanes2;
      }
      function computeExpirationTime(lane, currentTime) {
        switch (lane) {
          case 1:
          case 2:
          case 4:
          case 8:
          case 64:
            return currentTime + 250;
          case 16:
          case 32:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return currentTime + 5e3;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            return -1;
          case 67108864:
          case 134217728:
          case 268435456:
          case 536870912:
          case 1073741824:
            return -1;
          default:
            return -1;
        }
      }
      function claimNextRetryLane() {
        var lane = nextRetryLane;
        return nextRetryLane <<= 1, (nextRetryLane & 62914560) === 0 && (nextRetryLane = 4194304), lane;
      }
      function createLaneMap(initial) {
        for (var laneMap = [], i = 0; 31 > i; i++) laneMap.push(initial);
        return laneMap;
      }
      function markRootUpdated$1(root2, updateLane) {
        root2.pendingLanes |= updateLane, updateLane !== 268435456 && (root2.suspendedLanes = 0, root2.pingedLanes = 0, root2.warmLanes = 0);
      }
      function markRootFinished(root2, finishedLanes, remainingLanes, spawnedLane, updatedLanes, suspendedRetryLanes) {
        var previouslyPendingLanes = root2.pendingLanes;
        root2.pendingLanes = remainingLanes, root2.suspendedLanes = 0, root2.pingedLanes = 0, root2.warmLanes = 0, root2.expiredLanes &= remainingLanes, root2.entangledLanes &= remainingLanes, root2.errorRecoveryDisabledLanes &= remainingLanes, root2.shellSuspendCounter = 0;
        var entanglements = root2.entanglements, expirationTimes = root2.expirationTimes, hiddenUpdates = root2.hiddenUpdates;
        for (remainingLanes = previouslyPendingLanes & ~remainingLanes; 0 < remainingLanes; ) {
          var index$7 = 31 - clz32(remainingLanes), lane = 1 << index$7;
          entanglements[index$7] = 0, expirationTimes[index$7] = -1;
          var hiddenUpdatesForLane = hiddenUpdates[index$7];
          if (hiddenUpdatesForLane !== null)
            for (hiddenUpdates[index$7] = null, index$7 = 0; index$7 < hiddenUpdatesForLane.length; index$7++) {
              var update = hiddenUpdatesForLane[index$7];
              update !== null && (update.lane &= -536870913);
            }
          remainingLanes &= ~lane;
        }
        spawnedLane !== 0 && markSpawnedDeferredLane(root2, spawnedLane, 0), suspendedRetryLanes !== 0 && updatedLanes === 0 && root2.tag !== 0 && (root2.suspendedLanes |= suspendedRetryLanes & ~(previouslyPendingLanes & ~finishedLanes));
      }
      function markSpawnedDeferredLane(root2, spawnedLane, entangledLanes) {
        root2.pendingLanes |= spawnedLane, root2.suspendedLanes &= ~spawnedLane;
        var spawnedLaneIndex = 31 - clz32(spawnedLane);
        root2.entangledLanes |= spawnedLane, root2.entanglements[spawnedLaneIndex] = root2.entanglements[spawnedLaneIndex] | 1073741824 | entangledLanes & 261930;
      }
      function markRootEntangled(root2, entangledLanes) {
        var rootEntangledLanes = root2.entangledLanes |= entangledLanes;
        for (root2 = root2.entanglements; rootEntangledLanes; ) {
          var index$8 = 31 - clz32(rootEntangledLanes), lane = 1 << index$8;
          lane & entangledLanes | root2[index$8] & entangledLanes && (root2[index$8] |= entangledLanes), rootEntangledLanes &= ~lane;
        }
      }
      function getBumpedLaneForHydration(root2, renderLanes2) {
        var renderLane = renderLanes2 & -renderLanes2;
        return renderLane = (renderLane & 42) !== 0 ? 1 : getBumpedLaneForHydrationByLane(renderLane), (renderLane & (root2.suspendedLanes | renderLanes2)) !== 0 ? 0 : renderLane;
      }
      function getBumpedLaneForHydrationByLane(lane) {
        switch (lane) {
          case 2:
            lane = 1;
            break;
          case 8:
            lane = 4;
            break;
          case 32:
            lane = 16;
            break;
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            lane = 128;
            break;
          case 268435456:
            lane = 134217728;
            break;
          default:
            lane = 0;
        }
        return lane;
      }
      function lanesToEventPriority(lanes) {
        return lanes &= -lanes, 2 < lanes ? 8 < lanes ? (lanes & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
      }
      function resolveUpdatePriority() {
        var updatePriority = ReactDOMSharedInternals.p;
        return updatePriority !== 0 ? updatePriority : (updatePriority = window.event, updatePriority === void 0 ? 32 : getEventPriority(updatePriority.type));
      }
      function runWithPriority(priority, fn) {
        var previousPriority = ReactDOMSharedInternals.p;
        try {
          return ReactDOMSharedInternals.p = priority, fn();
        } finally {
          ReactDOMSharedInternals.p = previousPriority;
        }
      }
      var randomKey = Math.random().toString(36).slice(2), internalInstanceKey = "__reactFiber$" + randomKey, internalPropsKey = "__reactProps$" + randomKey, internalContainerInstanceKey = "__reactContainer$" + randomKey, internalEventHandlersKey = "__reactEvents$" + randomKey, internalEventHandlerListenersKey = "__reactListeners$" + randomKey, internalEventHandlesSetKey = "__reactHandles$" + randomKey, internalRootNodeResourcesKey = "__reactResources$" + randomKey, internalHoistableMarker = "__reactMarker$" + randomKey, internalLoadPendingKey = "__reactLoad$" + randomKey;
      function detachDeletedInstance(node) {
        delete node[internalInstanceKey], delete node[internalPropsKey], delete node[internalEventHandlerListenersKey], delete node[internalEventHandlesSetKey];
      }
      function getClosestInstanceFromNode(targetNode) {
        var targetInst;
        if (targetInst = targetNode[internalInstanceKey]) return targetInst;
        for (var parentNode = targetNode.parentNode; parentNode; ) {
          if (targetInst = parentNode[internalContainerInstanceKey] || parentNode[internalInstanceKey]) {
            if (parentNode = targetInst.alternate, targetInst.child !== null || parentNode !== null && parentNode.child !== null)
              for (targetNode = getParentHydrationBoundary(targetNode); targetNode !== null; ) {
                if (parentNode = targetNode[internalInstanceKey]) return parentNode;
                targetNode = getParentHydrationBoundary(targetNode);
              }
            return targetInst;
          }
          targetNode = parentNode, parentNode = targetNode.parentNode;
        }
        return null;
      }
      function getInstanceFromNode(node) {
        if (node = node[internalInstanceKey] || node[internalContainerInstanceKey]) {
          var tag = node.tag;
          if (tag === 5 || tag === 6 || tag === 13 || tag === 31 || tag === 26 || tag === 27 || tag === 3)
            return node;
        }
        return null;
      }
      function getNodeFromInstance(inst) {
        var tag = inst.tag;
        if (tag === 5 || tag === 26 || tag === 27 || tag === 6) return inst.stateNode;
        throw Error(formatProdErrorMessage(33));
      }
      function getResourcesFromRoot(root2) {
        var resources = root2[internalRootNodeResourcesKey];
        return resources || (resources = root2[internalRootNodeResourcesKey] = { hoistableStyles: /* @__PURE__ */ new Map(), hoistableScripts: /* @__PURE__ */ new Map() }), resources;
      }
      function markNodeAsHoistable(node) {
        node[internalHoistableMarker] = !0;
      }
      function clearPendingLoadOnNode(node) {
        node[internalLoadPendingKey] = void 0;
      }
      var allNativeEvents = /* @__PURE__ */ new Set(), registrationNameDependencies = {};
      function registerTwoPhaseEvent(registrationName, dependencies) {
        registerDirectEvent(registrationName, dependencies), registerDirectEvent(registrationName + "Capture", dependencies);
      }
      function registerDirectEvent(registrationName, dependencies) {
        for (registrationNameDependencies[registrationName] = dependencies, registrationName = 0; registrationName < dependencies.length; registrationName++)
          allNativeEvents.add(dependencies[registrationName]);
      }
      var VALID_ATTRIBUTE_NAME_REGEX = RegExp(
        "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"
      ), illegalAttributeNameCache = {}, validatedAttributeNameCache = {};
      function isAttributeNameSafe(attributeName) {
        return hasOwnProperty.call(validatedAttributeNameCache, attributeName) ? !0 : hasOwnProperty.call(illegalAttributeNameCache, attributeName) ? !1 : VALID_ATTRIBUTE_NAME_REGEX.test(attributeName) ? validatedAttributeNameCache[attributeName] = !0 : (illegalAttributeNameCache[attributeName] = !0, !1);
      }
      var viewTransitionMutationContext = !1;
      function pushMutationContext() {
        var prev = viewTransitionMutationContext;
        return viewTransitionMutationContext = !1, prev;
      }
      function setValueForAttribute(node, name, value) {
        if (isAttributeNameSafe(name))
          if (value === null) node.removeAttribute(name);
          else {
            switch (typeof value) {
              case "undefined":
              case "function":
              case "symbol":
                node.removeAttribute(name);
                return;
              case "boolean":
                var prefix$10 = name.toLowerCase().slice(0, 5);
                if (prefix$10 !== "data-" && prefix$10 !== "aria-") {
                  node.removeAttribute(name);
                  return;
                }
            }
            node.setAttribute(name, value);
          }
      }
      function setValueForKnownAttribute(node, name, value) {
        if (value === null) node.removeAttribute(name);
        else {
          switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
              node.removeAttribute(name);
              return;
          }
          node.setAttribute(name, value);
        }
      }
      function setValueForNamespacedAttribute(node, namespace, name, value) {
        if (value === null) node.removeAttribute(name);
        else {
          switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
              node.removeAttribute(name);
              return;
          }
          node.setAttributeNS(namespace, name, value);
        }
      }
      function getToStringValue(value) {
        switch (typeof value) {
          case "bigint":
          case "boolean":
          case "number":
          case "string":
          case "undefined":
            return value;
          case "object":
            return value;
          default:
            return "";
        }
      }
      function isCheckable(elem) {
        var type = elem.type;
        return (elem = elem.nodeName) && elem.toLowerCase() === "input" && (type === "checkbox" || type === "radio");
      }
      function trackValueOnNode(node, valueField, currentValue) {
        var descriptor = Object.getOwnPropertyDescriptor(
          node.constructor.prototype,
          valueField
        );
        if (!node.hasOwnProperty(valueField) && typeof descriptor < "u" && typeof descriptor.get == "function" && typeof descriptor.set == "function") {
          var get = descriptor.get, set = descriptor.set;
          return Object.defineProperty(node, valueField, {
            configurable: !0,
            get: function() {
              return get.call(this);
            },
            set: function(value) {
              currentValue = "" + value, set.call(this, value);
            }
          }), Object.defineProperty(node, valueField, {
            enumerable: descriptor.enumerable
          }), {
            getValue: function() {
              return currentValue;
            },
            setValue: function(value) {
              currentValue = "" + value;
            },
            stopTracking: function() {
              node._valueTracker = null, delete node[valueField];
            }
          };
        }
      }
      function track(node) {
        if (!node._valueTracker) {
          var valueField = isCheckable(node) ? "checked" : "value";
          node._valueTracker = trackValueOnNode(
            node,
            valueField,
            "" + node[valueField]
          );
        }
      }
      function updateValueIfChanged(node) {
        if (!node) return !1;
        var tracker = node._valueTracker;
        if (!tracker) return !0;
        var lastValue = tracker.getValue(), value = "";
        return node && (value = isCheckable(node) ? node.checked ? "true" : "false" : node.value), node = value, node !== lastValue ? (tracker.setValue(node), !0) : !1;
      }
      var escapeSelectorAttributeValueInsideDoubleQuotesRegex = /[\n"\\]/g;
      function escapeSelectorAttributeValueInsideDoubleQuotes(value) {
        return value.replace(
          escapeSelectorAttributeValueInsideDoubleQuotesRegex,
          function(ch) {
            return "\\" + ch.charCodeAt(0).toString(16) + " ";
          }
        );
      }
      function updateInput(element, value, defaultValue, lastDefaultValue, checked, defaultChecked, type, name) {
        element.name = "", type != null && typeof type != "function" && typeof type != "symbol" && typeof type != "boolean" ? element.type = type : element.removeAttribute("type"), value != null ? type === "number" ? (value === 0 && element.value === "" || element.value != value) && (element.value = "" + getToStringValue(value)) : element.value !== "" + getToStringValue(value) && (element.value = "" + getToStringValue(value)) : type !== "submit" && type !== "reset" || element.removeAttribute("value"), value != null ? type === "number" && element.value == value ? setDefaultValue(element, getToStringValue(element.value)) : setDefaultValue(element, getToStringValue(value)) : defaultValue != null ? setDefaultValue(element, getToStringValue(defaultValue)) : lastDefaultValue != null && element.removeAttribute("value"), checked == null && defaultChecked != null && (element.defaultChecked = !!defaultChecked), checked != null && (element.checked = checked && typeof checked != "function" && typeof checked != "symbol"), name != null && typeof name != "function" && typeof name != "symbol" && typeof name != "boolean" ? element.name = "" + getToStringValue(name) : element.removeAttribute("name");
      }
      function initInput(element, value, defaultValue, checked, defaultChecked, type, name, isHydrating2) {
        if (type != null && typeof type != "function" && typeof type != "symbol" && typeof type != "boolean" && (element.type = type), value != null || defaultValue != null) {
          if (!(type !== "submit" && type !== "reset" || value != null)) {
            track(element);
            return;
          }
          defaultValue = defaultValue != null ? "" + getToStringValue(defaultValue) : "", value = value != null ? "" + getToStringValue(value) : defaultValue, isHydrating2 || value === element.value || (element.value = value), element.defaultValue = value;
        }
        checked = checked ?? defaultChecked, checked = typeof checked != "function" && typeof checked != "symbol" && !!checked, element.checked = isHydrating2 ? element.checked : !!checked, element.defaultChecked = !!checked, name != null && typeof name != "function" && typeof name != "symbol" && typeof name != "boolean" && (element.name = name), track(element);
      }
      function setDefaultValue(node, value) {
        node.defaultValue !== "" + value && (node.defaultValue = "" + value);
      }
      function updateOptions(node, multiple, propValue, setDefaultSelected) {
        if (node = node.options, multiple) {
          multiple = {};
          for (var i = 0; i < propValue.length; i++)
            multiple["$" + propValue[i]] = !0;
          for (propValue = 0; propValue < node.length; propValue++)
            i = multiple.hasOwnProperty("$" + node[propValue].value), node[propValue].selected !== i && (node[propValue].selected = i), i && setDefaultSelected && (node[propValue].defaultSelected = !0);
        } else {
          for (propValue = "" + getToStringValue(propValue), multiple = null, i = 0; i < node.length; i++) {
            if (node[i].value === propValue) {
              node[i].selected = !0, setDefaultSelected && (node[i].defaultSelected = !0);
              return;
            }
            multiple !== null || node[i].disabled || (multiple = node[i]);
          }
          multiple !== null && (multiple.selected = !0);
        }
      }
      function updateTextarea(element, value, defaultValue) {
        if (value != null && (value = "" + getToStringValue(value), value !== element.value && (element.value = value), defaultValue == null)) {
          element.defaultValue !== value && (element.defaultValue = value);
          return;
        }
        element.defaultValue = defaultValue != null ? "" + getToStringValue(defaultValue) : "";
      }
      function initTextarea(element, value, defaultValue, children) {
        if (value == null) {
          if (children != null) {
            if (defaultValue != null) throw Error(formatProdErrorMessage(92));
            if (isArrayImpl(children)) {
              if (1 < children.length) throw Error(formatProdErrorMessage(93));
              children = children[0];
            }
            defaultValue = children;
          }
          defaultValue == null && (defaultValue = ""), value = defaultValue;
        }
        defaultValue = getToStringValue(value), element.defaultValue = defaultValue, children = element.textContent, children === defaultValue && children !== "" && children !== null && (element.value = children), track(element);
      }
      function setTextContent(node, text) {
        if (text) {
          var firstChild = node.firstChild;
          if (firstChild && firstChild === node.lastChild && firstChild.nodeType === 3) {
            firstChild.nodeValue = text;
            return;
          }
        }
        node.textContent = text;
      }
      var unitlessNumbers = new Set(
        "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
          " "
        )
      );
      function setValueForStyle(style2, styleName, value) {
        var isCustomProperty = styleName.indexOf("--") === 0;
        value == null || typeof value == "boolean" || value === "" ? isCustomProperty ? style2.setProperty(styleName, "") : styleName === "float" ? style2.cssFloat = "" : style2[styleName] = "" : isCustomProperty ? style2.setProperty(styleName, value) : typeof value != "number" || value === 0 || unitlessNumbers.has(styleName) ? styleName === "float" ? style2.cssFloat = value : style2[styleName] = ("" + value).trim() : style2[styleName] = value + "px";
      }
      function setValueForStyles(node, styles, prevStyles) {
        if (styles != null && typeof styles != "object")
          throw Error(formatProdErrorMessage(62));
        if (node = node.style, prevStyles != null) {
          for (var styleName in prevStyles)
            !prevStyles.hasOwnProperty(styleName) || styles != null && styles.hasOwnProperty(styleName) || (styleName.indexOf("--") === 0 ? node.setProperty(styleName, "") : styleName === "float" ? node.cssFloat = "" : node[styleName] = "", viewTransitionMutationContext = !0);
          for (var styleName$16 in styles)
            styleName = styles[styleName$16], styles.hasOwnProperty(styleName$16) && prevStyles[styleName$16] !== styleName && (setValueForStyle(node, styleName$16, styleName), viewTransitionMutationContext = !0);
        } else
          for (var styleName$17 in styles)
            styles.hasOwnProperty(styleName$17) && setValueForStyle(node, styleName$17, styles[styleName$17]);
      }
      function isCustomElement(tagName) {
        if (tagName.indexOf("-") === -1) return !1;
        switch (tagName) {
          case "annotation-xml":
          case "color-profile":
          case "font-face":
          case "font-face-src":
          case "font-face-uri":
          case "font-face-format":
          case "font-face-name":
          case "missing-glyph":
            return !1;
          default:
            return !0;
        }
      }
      var aliases = /* @__PURE__ */ new Map([
        ["acceptCharset", "accept-charset"],
        ["htmlFor", "for"],
        ["httpEquiv", "http-equiv"],
        ["crossOrigin", "crossorigin"],
        ["accentHeight", "accent-height"],
        ["alignmentBaseline", "alignment-baseline"],
        ["arabicForm", "arabic-form"],
        ["baselineShift", "baseline-shift"],
        ["capHeight", "cap-height"],
        ["clipPath", "clip-path"],
        ["clipRule", "clip-rule"],
        ["colorInterpolation", "color-interpolation"],
        ["colorInterpolationFilters", "color-interpolation-filters"],
        ["colorProfile", "color-profile"],
        ["colorRendering", "color-rendering"],
        ["dominantBaseline", "dominant-baseline"],
        ["enableBackground", "enable-background"],
        ["fillOpacity", "fill-opacity"],
        ["fillRule", "fill-rule"],
        ["floodColor", "flood-color"],
        ["floodOpacity", "flood-opacity"],
        ["fontFamily", "font-family"],
        ["fontSize", "font-size"],
        ["fontSizeAdjust", "font-size-adjust"],
        ["fontStretch", "font-stretch"],
        ["fontStyle", "font-style"],
        ["fontVariant", "font-variant"],
        ["fontWeight", "font-weight"],
        ["glyphName", "glyph-name"],
        ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
        ["glyphOrientationVertical", "glyph-orientation-vertical"],
        ["horizAdvX", "horiz-adv-x"],
        ["horizOriginX", "horiz-origin-x"],
        ["imageRendering", "image-rendering"],
        ["letterSpacing", "letter-spacing"],
        ["lightingColor", "lighting-color"],
        ["markerEnd", "marker-end"],
        ["markerMid", "marker-mid"],
        ["markerStart", "marker-start"],
        ["maskType", "mask-type"],
        ["overlinePosition", "overline-position"],
        ["overlineThickness", "overline-thickness"],
        ["paintOrder", "paint-order"],
        ["panose-1", "panose-1"],
        ["pointerEvents", "pointer-events"],
        ["renderingIntent", "rendering-intent"],
        ["shapeRendering", "shape-rendering"],
        ["stopColor", "stop-color"],
        ["stopOpacity", "stop-opacity"],
        ["strikethroughPosition", "strikethrough-position"],
        ["strikethroughThickness", "strikethrough-thickness"],
        ["strokeDasharray", "stroke-dasharray"],
        ["strokeDashoffset", "stroke-dashoffset"],
        ["strokeLinecap", "stroke-linecap"],
        ["strokeLinejoin", "stroke-linejoin"],
        ["strokeMiterlimit", "stroke-miterlimit"],
        ["strokeOpacity", "stroke-opacity"],
        ["strokeWidth", "stroke-width"],
        ["textAnchor", "text-anchor"],
        ["textDecoration", "text-decoration"],
        ["textRendering", "text-rendering"],
        ["transformOrigin", "transform-origin"],
        ["underlinePosition", "underline-position"],
        ["underlineThickness", "underline-thickness"],
        ["unicodeBidi", "unicode-bidi"],
        ["unicodeRange", "unicode-range"],
        ["unitsPerEm", "units-per-em"],
        ["vAlphabetic", "v-alphabetic"],
        ["vHanging", "v-hanging"],
        ["vIdeographic", "v-ideographic"],
        ["vMathematical", "v-mathematical"],
        ["vectorEffect", "vector-effect"],
        ["vertAdvY", "vert-adv-y"],
        ["vertOriginX", "vert-origin-x"],
        ["vertOriginY", "vert-origin-y"],
        ["wordSpacing", "word-spacing"],
        ["writingMode", "writing-mode"],
        ["xmlnsXlink", "xmlns:xlink"],
        ["xHeight", "x-height"]
      ]), isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
      function sanitizeURL(url) {
        return isJavaScriptProtocol.test("" + url) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : url;
      }
      function noop$1() {
      }
      var currentReplayingEvent = null;
      function getEventTarget(nativeEvent) {
        return nativeEvent = nativeEvent.target || nativeEvent.srcElement || window, nativeEvent.correspondingUseElement && (nativeEvent = nativeEvent.correspondingUseElement), nativeEvent.nodeType === 3 ? nativeEvent.parentNode : nativeEvent;
      }
      var restoreTarget = null, restoreQueue = null;
      function restoreStateOfTarget(target) {
        var internalInstance = getInstanceFromNode(target);
        if (internalInstance && (target = internalInstance.stateNode)) {
          var props = target[internalPropsKey] || null;
          a: switch (target = internalInstance.stateNode, internalInstance.type) {
            case "input":
              if (updateInput(
                target,
                props.value,
                props.defaultValue,
                props.defaultValue,
                props.checked,
                props.defaultChecked,
                props.type,
                props.name
              ), internalInstance = props.name, props.type === "radio" && internalInstance != null) {
                for (props = target; props.parentNode; ) props = props.parentNode;
                for (props = props.querySelectorAll(
                  'input[name="' + escapeSelectorAttributeValueInsideDoubleQuotes(
                    "" + internalInstance
                  ) + '"][type="radio"]'
                ), internalInstance = 0; internalInstance < props.length; internalInstance++) {
                  var otherNode = props[internalInstance];
                  if (otherNode !== target && otherNode.form === target.form) {
                    var otherProps = otherNode[internalPropsKey] || null;
                    if (!otherProps) throw Error(formatProdErrorMessage(90));
                    updateInput(
                      otherNode,
                      otherProps.value,
                      otherProps.defaultValue,
                      otherProps.defaultValue,
                      otherProps.checked,
                      otherProps.defaultChecked,
                      otherProps.type,
                      otherProps.name
                    );
                  }
                }
                for (internalInstance = 0; internalInstance < props.length; internalInstance++)
                  otherNode = props[internalInstance], otherNode.form === target.form && updateValueIfChanged(otherNode);
              }
              break a;
            case "textarea":
              updateTextarea(target, props.value, props.defaultValue);
              break a;
            case "select":
              internalInstance = props.value, internalInstance != null && updateOptions(target, !!props.multiple, internalInstance, !1);
          }
        }
      }
      var isInsideEventHandler = !1;
      function batchedUpdates$1(fn, a, b) {
        if (isInsideEventHandler) return fn(a, b);
        isInsideEventHandler = !0;
        try {
          var JSCompiler_inline_result = fn(a);
          return JSCompiler_inline_result;
        } finally {
          if (isInsideEventHandler = !1, (restoreTarget !== null || restoreQueue !== null) && (flushSyncWork$1(), restoreTarget && (a = restoreTarget, fn = restoreQueue, restoreQueue = restoreTarget = null, restoreStateOfTarget(a), fn)))
            for (a = 0; a < fn.length; a++) restoreStateOfTarget(fn[a]);
        }
      }
      function getListener(inst, registrationName) {
        var stateNode = inst.stateNode;
        if (stateNode === null) return null;
        var props = stateNode[internalPropsKey] || null;
        if (props === null) return null;
        stateNode = props[registrationName];
        a: switch (registrationName) {
          case "onClick":
          case "onClickCapture":
          case "onDoubleClick":
          case "onDoubleClickCapture":
          case "onMouseDown":
          case "onMouseDownCapture":
          case "onMouseMove":
          case "onMouseMoveCapture":
          case "onMouseUp":
          case "onMouseUpCapture":
          case "onMouseEnter":
            (props = !props.disabled) || (inst = inst.type, props = !(inst === "button" || inst === "input" || inst === "select" || inst === "textarea")), inst = !props;
            break a;
          default:
            inst = !1;
        }
        if (inst) return null;
        if (stateNode && typeof stateNode != "function")
          throw Error(
            formatProdErrorMessage(231, registrationName, typeof stateNode)
          );
        return stateNode;
      }
      var canUseDOM2 = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), passiveBrowserEventsSupported = !1;
      if (canUseDOM2)
        try {
          options2 = {}, Object.defineProperty(options2, "passive", {
            get: function() {
              passiveBrowserEventsSupported = !0;
            }
          }), window.addEventListener("test", options2, options2), window.removeEventListener("test", options2, options2);
        } catch {
          passiveBrowserEventsSupported = !1;
        }
      var options2, root = null, startText = null, fallbackText = null;
      function getData() {
        if (fallbackText) return fallbackText;
        var start2, startValue = startText, startLength = startValue.length, end, endValue = "value" in root ? root.value : root.textContent, endLength = endValue.length;
        for (start2 = 0; start2 < startLength && startValue[start2] === endValue[start2]; start2++) ;
        var minEnd = startLength - start2;
        for (end = 1; end <= minEnd && startValue[startLength - end] === endValue[endLength - end]; end++) ;
        return fallbackText = endValue.slice(start2, 1 < end ? 1 - end : void 0);
      }
      function getEventCharCode(nativeEvent) {
        var keyCode = nativeEvent.keyCode;
        return "charCode" in nativeEvent ? (nativeEvent = nativeEvent.charCode, nativeEvent === 0 && keyCode === 13 && (nativeEvent = 13)) : nativeEvent = keyCode, nativeEvent === 10 && (nativeEvent = 13), 32 <= nativeEvent || nativeEvent === 13 ? nativeEvent : 0;
      }
      function functionThatReturnsTrue() {
        return !0;
      }
      function functionThatReturnsFalse() {
        return !1;
      }
      function createSyntheticEvent(Interface) {
        function SyntheticBaseEvent(reactName, reactEventType, targetInst, nativeEvent, nativeEventTarget) {
          this._reactName = reactName, this._targetInst = targetInst, this.type = reactEventType, this.nativeEvent = nativeEvent, this.target = nativeEventTarget, this.currentTarget = null;
          for (var propName in Interface)
            Interface.hasOwnProperty(propName) && (reactName = Interface[propName], this[propName] = reactName ? reactName(nativeEvent) : nativeEvent[propName]);
          return this.isDefaultPrevented = (nativeEvent.defaultPrevented != null ? nativeEvent.defaultPrevented : nativeEvent.returnValue === !1) ? functionThatReturnsTrue : functionThatReturnsFalse, this.isPropagationStopped = functionThatReturnsFalse, this;
        }
        return assign(SyntheticBaseEvent.prototype, {
          preventDefault: function() {
            this.defaultPrevented = !0;
            var event = this.nativeEvent;
            event && (event.preventDefault ? event.preventDefault() : typeof event.returnValue != "unknown" && (event.returnValue = !1), this.isDefaultPrevented = functionThatReturnsTrue);
          },
          stopPropagation: function() {
            var event = this.nativeEvent;
            event && (event.stopPropagation ? event.stopPropagation() : typeof event.cancelBubble != "unknown" && (event.cancelBubble = !0), this.isPropagationStopped = functionThatReturnsTrue);
          },
          persist: function() {
          },
          isPersistent: functionThatReturnsTrue
        }), SyntheticBaseEvent;
      }
      var EventInterface = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function(event) {
          return event.timeStamp || Date.now();
        },
        defaultPrevented: 0,
        isTrusted: 0
      }, SyntheticEvent = createSyntheticEvent(EventInterface), UIEventInterface = assign({}, EventInterface, { view: 0, detail: 0 }), SyntheticUIEvent = createSyntheticEvent(UIEventInterface), lastMovementX, lastMovementY, lastMouseEvent, MouseEventInterface = assign({}, UIEventInterface, {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        getModifierState: getEventModifierState,
        button: 0,
        buttons: 0,
        relatedTarget: function(event) {
          return event.relatedTarget === void 0 ? event.fromElement === event.srcElement ? event.toElement : event.fromElement : event.relatedTarget;
        },
        movementX: function(event) {
          return "movementX" in event ? event.movementX : (event !== lastMouseEvent && (lastMouseEvent && event.type === "mousemove" ? (lastMovementX = event.screenX - lastMouseEvent.screenX, lastMovementY = event.screenY - lastMouseEvent.screenY) : lastMovementY = lastMovementX = 0, lastMouseEvent = event), lastMovementX);
        },
        movementY: function(event) {
          return "movementY" in event ? event.movementY : lastMovementY;
        }
      }), SyntheticMouseEvent = createSyntheticEvent(MouseEventInterface), DragEventInterface = assign({}, MouseEventInterface, { dataTransfer: 0 }), SyntheticDragEvent = createSyntheticEvent(DragEventInterface), FocusEventInterface = assign({}, UIEventInterface, { relatedTarget: 0 }), SyntheticFocusEvent = createSyntheticEvent(FocusEventInterface), AnimationEventInterface = assign({}, EventInterface, {
        animationName: 0,
        elapsedTime: 0,
        pseudoElement: 0
      }), SyntheticAnimationEvent = createSyntheticEvent(AnimationEventInterface), ClipboardEventInterface = assign({}, EventInterface, {
        clipboardData: function(event) {
          return "clipboardData" in event ? event.clipboardData : window.clipboardData;
        }
      }), SyntheticClipboardEvent = createSyntheticEvent(ClipboardEventInterface), CompositionEventInterface = assign({}, EventInterface, { data: 0 }), SyntheticCompositionEvent = createSyntheticEvent(CompositionEventInterface), normalizeKey = {
        Esc: "Escape",
        Spacebar: " ",
        Left: "ArrowLeft",
        Up: "ArrowUp",
        Right: "ArrowRight",
        Down: "ArrowDown",
        Del: "Delete",
        Win: "OS",
        Menu: "ContextMenu",
        Apps: "ContextMenu",
        Scroll: "ScrollLock",
        MozPrintableKey: "Unidentified"
      }, translateToKey = {
        8: "Backspace",
        9: "Tab",
        12: "Clear",
        13: "Enter",
        16: "Shift",
        17: "Control",
        18: "Alt",
        19: "Pause",
        20: "CapsLock",
        27: "Escape",
        32: " ",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown",
        45: "Insert",
        46: "Delete",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12",
        144: "NumLock",
        145: "ScrollLock",
        224: "Meta"
      }, modifierKeyToProp = {
        Alt: "altKey",
        Control: "ctrlKey",
        Meta: "metaKey",
        Shift: "shiftKey"
      };
      function modifierStateGetter(keyArg) {
        var nativeEvent = this.nativeEvent;
        return nativeEvent.getModifierState ? nativeEvent.getModifierState(keyArg) : (keyArg = modifierKeyToProp[keyArg]) ? !!nativeEvent[keyArg] : !1;
      }
      function getEventModifierState() {
        return modifierStateGetter;
      }
      var KeyboardEventInterface = assign({}, UIEventInterface, {
        key: function(nativeEvent) {
          if (nativeEvent.key) {
            var key = normalizeKey[nativeEvent.key] || nativeEvent.key;
            if (key !== "Unidentified") return key;
          }
          return nativeEvent.type === "keypress" ? (nativeEvent = getEventCharCode(nativeEvent), nativeEvent === 13 ? "Enter" : String.fromCharCode(nativeEvent)) : nativeEvent.type === "keydown" || nativeEvent.type === "keyup" ? translateToKey[nativeEvent.keyCode] || "Unidentified" : "";
        },
        code: 0,
        location: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        repeat: 0,
        locale: 0,
        getModifierState: getEventModifierState,
        charCode: function(event) {
          return event.type === "keypress" ? getEventCharCode(event) : 0;
        },
        keyCode: function(event) {
          return event.type === "keydown" || event.type === "keyup" ? event.keyCode : 0;
        },
        which: function(event) {
          return event.type === "keypress" ? getEventCharCode(event) : event.type === "keydown" || event.type === "keyup" ? event.keyCode : 0;
        }
      }), SyntheticKeyboardEvent = createSyntheticEvent(KeyboardEventInterface), PointerEventInterface = assign({}, MouseEventInterface, {
        pointerId: 0,
        width: 0,
        height: 0,
        pressure: 0,
        tangentialPressure: 0,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        pointerType: 0,
        isPrimary: 0
      }), SyntheticPointerEvent = createSyntheticEvent(PointerEventInterface), SubmitEventInterface = assign({}, EventInterface, { submitter: 0 }), SyntheticSubmitEvent = createSyntheticEvent(SubmitEventInterface), TouchEventInterface = assign({}, UIEventInterface, {
        touches: 0,
        targetTouches: 0,
        changedTouches: 0,
        altKey: 0,
        metaKey: 0,
        ctrlKey: 0,
        shiftKey: 0,
        getModifierState: getEventModifierState
      }), SyntheticTouchEvent = createSyntheticEvent(TouchEventInterface), TransitionEventInterface = assign({}, EventInterface, {
        propertyName: 0,
        elapsedTime: 0,
        pseudoElement: 0
      }), SyntheticTransitionEvent = createSyntheticEvent(TransitionEventInterface), WheelEventInterface = assign({}, MouseEventInterface, {
        deltaX: function(event) {
          return "deltaX" in event ? event.deltaX : "wheelDeltaX" in event ? -event.wheelDeltaX : 0;
        },
        deltaY: function(event) {
          return "deltaY" in event ? event.deltaY : "wheelDeltaY" in event ? -event.wheelDeltaY : "wheelDelta" in event ? -event.wheelDelta : 0;
        },
        deltaZ: 0,
        deltaMode: 0
      }), SyntheticWheelEvent = createSyntheticEvent(WheelEventInterface), ToggleEventInterface = assign({}, EventInterface, {
        newState: 0,
        oldState: 0,
        source: 0
      }), SyntheticToggleEvent = createSyntheticEvent(ToggleEventInterface), END_KEYCODES = [9, 13, 27, 32], canUseCompositionEvent = canUseDOM2 && "CompositionEvent" in window, documentMode = null;
      canUseDOM2 && "documentMode" in document && (documentMode = document.documentMode);
      var canUseTextInputEvent = canUseDOM2 && "TextEvent" in window && !documentMode, useFallbackCompositionData = canUseDOM2 && (!canUseCompositionEvent || documentMode && 8 < documentMode && 11 >= documentMode), SPACEBAR_CHAR = " ", hasSpaceKeypress = !1;
      function isFallbackCompositionEnd(domEventName, nativeEvent) {
        switch (domEventName) {
          case "keyup":
            return END_KEYCODES.indexOf(nativeEvent.keyCode) !== -1;
          case "keydown":
            return nativeEvent.keyCode !== 229;
          case "keypress":
          case "mousedown":
          case "focusout":
            return !0;
          default:
            return !1;
        }
      }
      function getDataFromCustomEvent(nativeEvent) {
        return nativeEvent = nativeEvent.detail, typeof nativeEvent == "object" && "data" in nativeEvent ? nativeEvent.data : null;
      }
      var isComposing = !1;
      function getNativeBeforeInputChars(domEventName, nativeEvent) {
        switch (domEventName) {
          case "compositionend":
            return getDataFromCustomEvent(nativeEvent);
          case "keypress":
            return nativeEvent.which !== 32 ? null : (hasSpaceKeypress = !0, SPACEBAR_CHAR);
          case "textInput":
            return domEventName = nativeEvent.data, domEventName === SPACEBAR_CHAR && hasSpaceKeypress ? null : domEventName;
          default:
            return null;
        }
      }
      function getFallbackBeforeInputChars(domEventName, nativeEvent) {
        if (isComposing)
          return domEventName === "compositionend" || !canUseCompositionEvent && isFallbackCompositionEnd(domEventName, nativeEvent) ? (domEventName = getData(), fallbackText = startText = root = null, isComposing = !1, domEventName) : null;
        switch (domEventName) {
          case "paste":
            return null;
          case "keypress":
            if (!(nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) || nativeEvent.ctrlKey && nativeEvent.altKey) {
              if (nativeEvent.char && 1 < nativeEvent.char.length)
                return nativeEvent.char;
              if (nativeEvent.which) return String.fromCharCode(nativeEvent.which);
            }
            return null;
          case "compositionend":
            return useFallbackCompositionData && nativeEvent.locale !== "ko" ? null : nativeEvent.data;
          default:
            return null;
        }
      }
      var supportedInputTypes = {
        color: !0,
        date: !0,
        datetime: !0,
        "datetime-local": !0,
        email: !0,
        month: !0,
        number: !0,
        password: !0,
        range: !0,
        search: !0,
        tel: !0,
        text: !0,
        time: !0,
        url: !0,
        week: !0
      };
      function isTextInputElement(elem) {
        var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
        return nodeName === "input" ? !!supportedInputTypes[elem.type] : nodeName === "textarea";
      }
      function createAndAccumulateChangeEvent(dispatchQueue, inst, nativeEvent, target) {
        restoreTarget ? restoreQueue ? restoreQueue.push(target) : restoreQueue = [target] : restoreTarget = target, inst = accumulateTwoPhaseListeners(inst, "onChange"), 0 < inst.length && (nativeEvent = new SyntheticEvent(
          "onChange",
          "change",
          null,
          nativeEvent,
          target
        ), dispatchQueue.push({ event: nativeEvent, listeners: inst }));
      }
      var activeElement$1 = null, activeElementInst$1 = null;
      function runEventInBatch(dispatchQueue) {
        processDispatchQueue(dispatchQueue, 0);
      }
      function getInstIfValueChanged(targetInst) {
        var targetNode = getNodeFromInstance(targetInst);
        if (updateValueIfChanged(targetNode)) return targetInst;
      }
      function getTargetInstForChangeEvent(domEventName, targetInst) {
        if (domEventName === "change") return targetInst;
      }
      var isInputEventSupported = !1;
      canUseDOM2 && (canUseDOM2 ? (isSupported$jscomp$inline_474 = "oninput" in document, isSupported$jscomp$inline_474 || (element$jscomp$inline_475 = document.createElement("div"), element$jscomp$inline_475.setAttribute("oninput", "return;"), isSupported$jscomp$inline_474 = typeof element$jscomp$inline_475.oninput == "function"), JSCompiler_inline_result$jscomp$318 = isSupported$jscomp$inline_474) : JSCompiler_inline_result$jscomp$318 = !1, isInputEventSupported = JSCompiler_inline_result$jscomp$318 && (!document.documentMode || 9 < document.documentMode));
      var JSCompiler_inline_result$jscomp$318, isSupported$jscomp$inline_474, element$jscomp$inline_475;
      function stopWatchingForValueChange() {
        activeElement$1 && (activeElement$1.detachEvent("onpropertychange", handlePropertyChange), activeElementInst$1 = activeElement$1 = null);
      }
      function handlePropertyChange(nativeEvent) {
        if (nativeEvent.propertyName === "value" && getInstIfValueChanged(activeElementInst$1)) {
          var dispatchQueue = [];
          createAndAccumulateChangeEvent(
            dispatchQueue,
            activeElementInst$1,
            nativeEvent,
            getEventTarget(nativeEvent)
          ), batchedUpdates$1(runEventInBatch, dispatchQueue);
        }
      }
      function handleEventsForInputEventPolyfill(domEventName, target, targetInst) {
        domEventName === "focusin" ? (stopWatchingForValueChange(), activeElement$1 = target, activeElementInst$1 = targetInst, activeElement$1.attachEvent("onpropertychange", handlePropertyChange)) : domEventName === "focusout" && stopWatchingForValueChange();
      }
      function getTargetInstForInputEventPolyfill(domEventName) {
        if (domEventName === "selectionchange" || domEventName === "keyup" || domEventName === "keydown")
          return getInstIfValueChanged(activeElementInst$1);
      }
      function getTargetInstForClickEvent(domEventName, targetInst) {
        if (domEventName === "click") return getInstIfValueChanged(targetInst);
      }
      function getTargetInstForInputOrChangeEvent(domEventName, targetInst) {
        if (domEventName === "input" || domEventName === "change")
          return getInstIfValueChanged(targetInst);
      }
      function is(x, y) {
        return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y;
      }
      var objectIs = typeof Object.is == "function" ? Object.is : is;
      function shallowEqual2(objA, objB) {
        if (objectIs(objA, objB)) return !0;
        if (typeof objA != "object" || objA === null || typeof objB != "object" || objB === null)
          return !1;
        var keysA = Object.keys(objA), keysB = Object.keys(objB);
        if (keysA.length !== keysB.length) return !1;
        for (keysB = 0; keysB < keysA.length; keysB++) {
          var currentKey = keysA[keysB];
          if (!hasOwnProperty.call(objB, currentKey) || !objectIs(objA[currentKey], objB[currentKey]))
            return !1;
        }
        return !0;
      }
      function getActiveElement2(doc) {
        if (doc = doc || (typeof document < "u" ? document : void 0), typeof doc > "u") return null;
        try {
          return doc.activeElement || doc.body;
        } catch {
          return doc.body;
        }
      }
      function getLeafNode(node) {
        for (; node && node.firstChild; ) node = node.firstChild;
        return node;
      }
      function getNodeForCharacterOffset(root2, offset4) {
        var node = getLeafNode(root2);
        root2 = 0;
        for (var nodeEnd; node; ) {
          if (node.nodeType === 3) {
            if (nodeEnd = root2 + node.textContent.length, root2 <= offset4 && nodeEnd >= offset4)
              return { node, offset: offset4 - root2 };
            root2 = nodeEnd;
          }
          a: {
            for (; node; ) {
              if (node.nextSibling) {
                node = node.nextSibling;
                break a;
              }
              node = node.parentNode;
            }
            node = void 0;
          }
          node = getLeafNode(node);
        }
      }
      function containsNode(outerNode, innerNode) {
        return outerNode && innerNode ? outerNode === innerNode ? !0 : outerNode && outerNode.nodeType === 3 ? !1 : innerNode && innerNode.nodeType === 3 ? containsNode(outerNode, innerNode.parentNode) : "contains" in outerNode ? outerNode.contains(innerNode) : outerNode.compareDocumentPosition ? !!(outerNode.compareDocumentPosition(innerNode) & 16) : !1 : !1;
      }
      function getActiveElementDeep(containerInfo) {
        containerInfo = containerInfo != null && containerInfo.ownerDocument != null && containerInfo.ownerDocument.defaultView != null ? containerInfo.ownerDocument.defaultView : window;
        for (var element = getActiveElement2(containerInfo.document); element instanceof containerInfo.HTMLIFrameElement; ) {
          try {
            var JSCompiler_inline_result = typeof element.contentWindow.location.href == "string";
          } catch {
            JSCompiler_inline_result = !1;
          }
          if (JSCompiler_inline_result) containerInfo = element.contentWindow;
          else break;
          element = getActiveElement2(containerInfo.document);
        }
        return element;
      }
      function hasSelectionCapabilities(elem) {
        var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
        return nodeName && (nodeName === "input" && (elem.type === "text" || elem.type === "search" || elem.type === "tel" || elem.type === "url" || elem.type === "password") || nodeName === "textarea" || elem.contentEditable === "true");
      }
      var skipSelectionChangeEvent = canUseDOM2 && "documentMode" in document && 11 >= document.documentMode, activeElement = null, activeElementInst = null, lastSelection = null, mouseDown = !1;
      function constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget) {
        var doc = nativeEventTarget.window === nativeEventTarget ? nativeEventTarget.document : nativeEventTarget.nodeType === 9 ? nativeEventTarget : nativeEventTarget.ownerDocument;
        mouseDown || activeElement == null || activeElement !== getActiveElement2(doc) || (doc = activeElement, "selectionStart" in doc && hasSelectionCapabilities(doc) ? doc = { start: doc.selectionStart, end: doc.selectionEnd } : (doc = (doc.ownerDocument && doc.ownerDocument.defaultView || window).getSelection(), doc = {
          anchorNode: doc.anchorNode,
          anchorOffset: doc.anchorOffset,
          focusNode: doc.focusNode,
          focusOffset: doc.focusOffset
        }), lastSelection && shallowEqual2(lastSelection, doc) || (lastSelection = doc, doc = accumulateTwoPhaseListeners(activeElementInst, "onSelect"), 0 < doc.length && (nativeEvent = new SyntheticEvent(
          "onSelect",
          "select",
          null,
          nativeEvent,
          nativeEventTarget
        ), dispatchQueue.push({ event: nativeEvent, listeners: doc }), nativeEvent.target = activeElement)));
      }
      function makePrefixMap(styleProp, eventName) {
        var prefixes = {};
        return prefixes[styleProp.toLowerCase()] = eventName.toLowerCase(), prefixes["Webkit" + styleProp] = "webkit" + eventName, prefixes["Moz" + styleProp] = "moz" + eventName, prefixes;
      }
      var vendorPrefixes = {
        animationend: makePrefixMap("Animation", "AnimationEnd"),
        animationiteration: makePrefixMap("Animation", "AnimationIteration"),
        animationstart: makePrefixMap("Animation", "AnimationStart"),
        transitionrun: makePrefixMap("Transition", "TransitionRun"),
        transitionstart: makePrefixMap("Transition", "TransitionStart"),
        transitioncancel: makePrefixMap("Transition", "TransitionCancel"),
        transitionend: makePrefixMap("Transition", "TransitionEnd")
      }, prefixedEventNames = {}, style = {};
      canUseDOM2 && (style = document.createElement("div").style, "AnimationEvent" in window || (delete vendorPrefixes.animationend.animation, delete vendorPrefixes.animationiteration.animation, delete vendorPrefixes.animationstart.animation), "TransitionEvent" in window || delete vendorPrefixes.transitionend.transition);
      function getVendorPrefixedEventName(eventName) {
        if (prefixedEventNames[eventName]) return prefixedEventNames[eventName];
        if (!vendorPrefixes[eventName]) return eventName;
        var prefixMap = vendorPrefixes[eventName], styleProp;
        for (styleProp in prefixMap)
          if (prefixMap.hasOwnProperty(styleProp) && styleProp in style)
            return prefixedEventNames[eventName] = prefixMap[styleProp];
        return eventName;
      }
      var ANIMATION_END = getVendorPrefixedEventName("animationend"), ANIMATION_ITERATION = getVendorPrefixedEventName("animationiteration"), ANIMATION_START = getVendorPrefixedEventName("animationstart"), TRANSITION_RUN = getVendorPrefixedEventName("transitionrun"), TRANSITION_START = getVendorPrefixedEventName("transitionstart"), TRANSITION_CANCEL = getVendorPrefixedEventName("transitioncancel"), TRANSITION_END = getVendorPrefixedEventName("transitionend"), topLevelEventsToReactNames = /* @__PURE__ */ new Map(), simpleEventPluginEvents = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
        " "
      );
      simpleEventPluginEvents.push("scrollEnd");
      function registerSimpleEvent(domEventName, reactName) {
        topLevelEventsToReactNames.set(domEventName, reactName), registerTwoPhaseEvent(reactName, [domEventName]);
      }
      var globalClientIdCounter$1 = 0;
      function getViewTransitionName(props, instance) {
        if (props.name != null && props.name !== "auto") return props.name;
        if (instance.autoName !== null) return instance.autoName;
        props = pendingEffectsRoot.identifierPrefix;
        var globalClientId = globalClientIdCounter$1++;
        return props = "_" + props + "t_" + globalClientId.toString(32) + "_", instance.autoName = props;
      }
      function getClassNameByType(classByType) {
        if (classByType == null || typeof classByType == "string")
          return classByType;
        var className = null, activeTypes = pendingTransitionTypes;
        if (activeTypes !== null)
          for (var i = 0; i < activeTypes.length; i++) {
            var match = classByType[activeTypes[i]];
            if (match != null) {
              if (match === "none") return "none";
              className = className == null ? match : className + (" " + match);
            }
          }
        return className ?? classByType.default;
      }
      function getViewTransitionClassName(defaultClass, eventClass) {
        return defaultClass = getClassNameByType(defaultClass), eventClass = getClassNameByType(eventClass), eventClass == null ? defaultClass === "auto" ? null : defaultClass : eventClass === "auto" ? null : eventClass;
      }
      var reportGlobalError = typeof reportError == "function" ? reportError : function(error) {
        if (typeof window == "object" && typeof window.ErrorEvent == "function") {
          var event = new window.ErrorEvent("error", {
            bubbles: !0,
            cancelable: !0,
            message: typeof error == "object" && error !== null && typeof error.message == "string" ? String(error.message) : String(error),
            error
          });
          if (!window.dispatchEvent(event)) return;
        } else if (typeof process == "object" && typeof process.emit == "function") {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      }, concurrentQueues = [], concurrentQueuesIndex = 0, concurrentlyUpdatedLanes = 0;
      function finishQueueingConcurrentUpdates() {
        for (var endIndex = concurrentQueuesIndex, i = concurrentlyUpdatedLanes = concurrentQueuesIndex = 0; i < endIndex; ) {
          var fiber = concurrentQueues[i];
          concurrentQueues[i++] = null;
          var queue = concurrentQueues[i];
          concurrentQueues[i++] = null;
          var update = concurrentQueues[i];
          concurrentQueues[i++] = null;
          var lane = concurrentQueues[i];
          if (concurrentQueues[i++] = null, queue !== null && update !== null) {
            var pending = queue.pending;
            pending === null ? update.next = update : (update.next = pending.next, pending.next = update), queue.pending = update;
          }
          lane !== 0 && markUpdateLaneFromFiberToRoot(fiber, update, lane);
        }
      }
      function enqueueUpdate$1(fiber, queue, update, lane) {
        concurrentQueues[concurrentQueuesIndex++] = fiber, concurrentQueues[concurrentQueuesIndex++] = queue, concurrentQueues[concurrentQueuesIndex++] = update, concurrentQueues[concurrentQueuesIndex++] = lane, concurrentlyUpdatedLanes |= lane, fiber.lanes |= lane, fiber = fiber.alternate, fiber !== null && (fiber.lanes |= lane);
      }
      function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
        return enqueueUpdate$1(fiber, queue, update, lane), getRootForUpdatedFiber(fiber);
      }
      function enqueueConcurrentRenderForLane(fiber, lane) {
        return enqueueUpdate$1(fiber, null, null, lane), getRootForUpdatedFiber(fiber);
      }
      function markUpdateLaneFromFiberToRoot(sourceFiber, update, lane) {
        sourceFiber.lanes |= lane;
        var alternate = sourceFiber.alternate;
        alternate !== null && (alternate.lanes |= lane);
        for (var isHidden2 = !1, parent2 = sourceFiber.return; parent2 !== null; )
          parent2.childLanes |= lane, alternate = parent2.alternate, alternate !== null && (alternate.childLanes |= lane), parent2.tag === 22 && (sourceFiber = parent2.stateNode, sourceFiber === null || sourceFiber._visibility & 1 || (isHidden2 = !0)), sourceFiber = parent2, parent2 = parent2.return;
        return sourceFiber.tag === 3 ? (parent2 = sourceFiber.stateNode, isHidden2 && update !== null && (isHidden2 = 31 - clz32(lane), sourceFiber = parent2.hiddenUpdates, alternate = sourceFiber[isHidden2], alternate === null ? sourceFiber[isHidden2] = [update] : alternate.push(update), update.lane = lane | 536870912), parent2) : null;
      }
      function getRootForUpdatedFiber(sourceFiber) {
        if (50 < nestedUpdateCount)
          throw nestedUpdateCount = 0, rootWithNestedUpdates = null, Error(formatProdErrorMessage(185));
        for (var parent2 = sourceFiber.return; parent2 !== null; )
          sourceFiber = parent2, parent2 = sourceFiber.return;
        return sourceFiber.tag === 3 ? sourceFiber.stateNode : null;
      }
      var emptyContextObject = {};
      function FiberNode(tag, pendingProps, key, mode) {
        this.tag = tag, this.key = key, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = pendingProps, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = mode, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
      }
      function createFiberImplClass(tag, pendingProps, key, mode) {
        return new FiberNode(tag, pendingProps, key, mode);
      }
      function shouldConstruct(Component) {
        return Component = Component.prototype, !(!Component || !Component.isReactComponent);
      }
      function createWorkInProgress(current, pendingProps) {
        var workInProgress2 = current.alternate;
        return workInProgress2 === null ? (workInProgress2 = createFiberImplClass(
          current.tag,
          pendingProps,
          current.key,
          current.mode
        ), workInProgress2.elementType = current.elementType, workInProgress2.type = current.type, workInProgress2.stateNode = current.stateNode, workInProgress2.alternate = current, current.alternate = workInProgress2) : (workInProgress2.pendingProps = pendingProps, workInProgress2.type = current.type, workInProgress2.flags = 0, workInProgress2.subtreeFlags = 0, workInProgress2.deletions = null), workInProgress2.flags = current.flags & 1206910976, workInProgress2.childLanes = current.childLanes, workInProgress2.lanes = current.lanes, workInProgress2.child = current.child, workInProgress2.memoizedProps = current.memoizedProps, workInProgress2.memoizedState = current.memoizedState, workInProgress2.updateQueue = current.updateQueue, pendingProps = current.dependencies, workInProgress2.dependencies = pendingProps === null ? null : { lanes: pendingProps.lanes, firstContext: pendingProps.firstContext }, workInProgress2.sibling = current.sibling, workInProgress2.index = current.index, workInProgress2.ref = current.ref, workInProgress2.refCleanup = current.refCleanup, workInProgress2;
      }
      function resetWorkInProgress(workInProgress2, renderLanes2) {
        workInProgress2.flags &= 1206910978;
        var current = workInProgress2.alternate;
        return current === null ? (workInProgress2.childLanes = 0, workInProgress2.lanes = renderLanes2, workInProgress2.child = null, workInProgress2.subtreeFlags = 0, workInProgress2.memoizedProps = null, workInProgress2.memoizedState = null, workInProgress2.updateQueue = null, workInProgress2.dependencies = null, workInProgress2.stateNode = null) : (workInProgress2.childLanes = current.childLanes, workInProgress2.lanes = current.lanes, workInProgress2.child = current.child, workInProgress2.subtreeFlags = 0, workInProgress2.deletions = null, workInProgress2.memoizedProps = current.memoizedProps, workInProgress2.memoizedState = current.memoizedState, workInProgress2.updateQueue = current.updateQueue, workInProgress2.type = current.type, renderLanes2 = current.dependencies, workInProgress2.dependencies = renderLanes2 === null ? null : {
          lanes: renderLanes2.lanes,
          firstContext: renderLanes2.firstContext
        }), workInProgress2;
      }
      function createFiberFromTypeAndProps(type, key, pendingProps, owner, mode, lanes) {
        var fiberTag = 0;
        if (owner = type, typeof owner == "function") shouldConstruct(owner) && (fiberTag = 1);
        else if (typeof owner == "string")
          fiberTag = isHostHoistableType(
            type,
            pendingProps,
            contextStackCursor.current
          ) ? 26 : type === "html" || type === "head" || type === "body" ? 27 : 5;
        else
          a: switch (owner) {
            case REACT_ACTIVITY_TYPE:
              return type = createFiberImplClass(31, pendingProps, key, mode), type.elementType = REACT_ACTIVITY_TYPE, type.lanes = lanes, type;
            case REACT_FRAGMENT_TYPE:
              return createFiberFromFragment(pendingProps.children, mode, lanes, key);
            case REACT_STRICT_MODE_TYPE:
              fiberTag = 8, mode |= 24;
              break;
            case REACT_PROFILER_TYPE:
              return type = createFiberImplClass(12, pendingProps, key, mode | 2), type.elementType = REACT_PROFILER_TYPE, type.lanes = lanes, type;
            case REACT_SUSPENSE_TYPE:
              return type = createFiberImplClass(13, pendingProps, key, mode), type.elementType = REACT_SUSPENSE_TYPE, type.lanes = lanes, type;
            case REACT_SUSPENSE_LIST_TYPE:
              return type = createFiberImplClass(19, pendingProps, key, mode), type.elementType = REACT_SUSPENSE_LIST_TYPE, type.lanes = lanes, type;
            case REACT_LEGACY_HIDDEN_TYPE:
            case REACT_VIEW_TRANSITION_TYPE:
              return type = mode | 32, type = createFiberImplClass(30, pendingProps, key, type), type.elementType = REACT_VIEW_TRANSITION_TYPE, type.lanes = lanes, type.stateNode = {
                autoName: null,
                paired: null,
                clones: null,
                ref: null
              }, type;
            default:
              if (typeof owner == "object" && owner !== null)
                switch (owner.$$typeof) {
                  case REACT_CONTEXT_TYPE:
                    fiberTag = 10;
                    break a;
                  case REACT_CONSUMER_TYPE:
                    fiberTag = 9;
                    break a;
                  case REACT_FORWARD_REF_TYPE:
                    fiberTag = 11;
                    break a;
                  case REACT_MEMO_TYPE:
                    fiberTag = 14;
                    break a;
                  case REACT_LAZY_TYPE2:
                    fiberTag = 16, owner = null;
                    break a;
                }
              fiberTag = 29, pendingProps = Error(
                formatProdErrorMessage(130, type === null ? "null" : typeof type, "")
              ), owner = null;
          }
        return key = createFiberImplClass(fiberTag, pendingProps, key, mode), key.elementType = type, key.type = owner, key.lanes = lanes, key;
      }
      function createFiberFromFragment(elements, mode, lanes, key) {
        return elements = createFiberImplClass(7, elements, key, mode), elements.lanes = lanes, elements;
      }
      function createFiberFromText(content, mode, lanes) {
        return content = createFiberImplClass(6, content, null, mode), content.lanes = lanes, content;
      }
      function createFiberFromDehydratedFragment(dehydratedNode) {
        var fiber = createFiberImplClass(18, null, null, 0);
        return fiber.stateNode = dehydratedNode, fiber;
      }
      function createFiberFromPortal(portal, mode, lanes) {
        return mode = createFiberImplClass(
          4,
          portal.children !== null ? portal.children : [],
          portal.key,
          mode
        ), mode.lanes = lanes, mode.stateNode = {
          containerInfo: portal.containerInfo,
          pendingChildren: null,
          implementation: portal.implementation
        }, mode;
      }
      var CapturedStacks = /* @__PURE__ */ new WeakMap();
      function createCapturedValueAtFiber(value, source) {
        if (typeof value == "object" && value !== null) {
          var existing = CapturedStacks.get(value);
          return existing !== void 0 ? existing : (source = {
            value,
            source,
            stack: getStackByFiberInDevAndProd(source)
          }, CapturedStacks.set(value, source), source);
        }
        return {
          value,
          source,
          stack: getStackByFiberInDevAndProd(source)
        };
      }
      var forkStack = [], forkStackIndex = 0, treeForkProvider = null, treeForkCount = 0, idStack = [], idStackIndex = 0, treeContextProvider = null, treeContextId = 1, treeContextOverflow = "";
      function pushTreeFork(workInProgress2, totalChildren) {
        forkStack[forkStackIndex++] = treeForkCount, forkStack[forkStackIndex++] = treeForkProvider, treeForkProvider = workInProgress2, treeForkCount = totalChildren;
      }
      function pushTreeId(workInProgress2, totalChildren, index3) {
        idStack[idStackIndex++] = treeContextId, idStack[idStackIndex++] = treeContextOverflow, idStack[idStackIndex++] = treeContextProvider, treeContextProvider = workInProgress2;
        var baseIdWithLeadingBit = treeContextId;
        workInProgress2 = treeContextOverflow;
        var baseLength = 32 - clz32(baseIdWithLeadingBit) - 1;
        baseIdWithLeadingBit &= ~(1 << baseLength), index3 += 1;
        var length = 32 - clz32(totalChildren) + baseLength;
        if (30 < length) {
          var numberOfOverflowBits = baseLength - baseLength % 5;
          length = (baseIdWithLeadingBit & (1 << numberOfOverflowBits) - 1).toString(32), baseIdWithLeadingBit >>= numberOfOverflowBits, baseLength -= numberOfOverflowBits, treeContextId = 1 << 32 - clz32(totalChildren) + baseLength | index3 << baseLength | baseIdWithLeadingBit, treeContextOverflow = length + workInProgress2;
        } else
          treeContextId = 1 << length | index3 << baseLength | baseIdWithLeadingBit, treeContextOverflow = workInProgress2;
      }
      function pushMaterializedTreeId(workInProgress2) {
        workInProgress2.return !== null && (pushTreeFork(workInProgress2, 1), pushTreeId(workInProgress2, 1, 0));
      }
      function popTreeContext(workInProgress2) {
        for (; workInProgress2 === treeForkProvider; )
          treeForkProvider = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null, treeForkCount = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null;
        for (; workInProgress2 === treeContextProvider; )
          treeContextProvider = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextOverflow = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextId = idStack[--idStackIndex], idStack[idStackIndex] = null;
      }
      function restoreSuspendedTreeContext(workInProgress2, suspendedContext) {
        idStack[idStackIndex++] = treeContextId, idStack[idStackIndex++] = treeContextOverflow, idStack[idStackIndex++] = treeContextProvider, treeContextId = suspendedContext.id, treeContextOverflow = suspendedContext.overflow, treeContextProvider = workInProgress2;
      }
      var hydrationParentFiber = null, nextHydratableInstance = null, isHydrating = !1, hydrationErrors = null, rootOrSingletonContext = !1, HydrationMismatchException = Error(formatProdErrorMessage(519));
      function throwOnHydrationMismatch(fiber) {
        var error = Error(
          formatProdErrorMessage(
            418,
            1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML",
            ""
          )
        );
        throw queueHydrationError(createCapturedValueAtFiber(error, fiber)), HydrationMismatchException;
      }
      function prepareToHydrateHostInstance(fiber) {
        var instance = fiber.stateNode, type = fiber.type, props = fiber.memoizedProps;
        switch (instance[internalInstanceKey] = fiber, instance[internalPropsKey] = props, type) {
          case "dialog":
            listenToNonDelegatedEvent("cancel", instance), listenToNonDelegatedEvent("close", instance);
            break;
          case "iframe":
          case "object":
          case "embed":
            listenToNonDelegatedEvent("load", instance);
            break;
          case "video":
          case "audio":
            for (type = 0; type < mediaEventTypes.length; type++)
              listenToNonDelegatedEvent(mediaEventTypes[type], instance);
            break;
          case "source":
            listenToNonDelegatedEvent("error", instance);
            break;
          case "img":
          case "image":
          case "link":
            listenToNonDelegatedEvent("error", instance), listenToNonDelegatedEvent("load", instance);
            break;
          case "details":
            listenToNonDelegatedEvent("toggle", instance);
            break;
          case "input":
            listenToNonDelegatedEvent("invalid", instance), initInput(
              instance,
              props.value,
              props.defaultValue,
              props.checked,
              props.defaultChecked,
              props.type,
              props.name,
              !0
            );
            break;
          case "select":
            listenToNonDelegatedEvent("invalid", instance);
            break;
          case "textarea":
            listenToNonDelegatedEvent("invalid", instance), initTextarea(instance, props.value, props.defaultValue, props.children);
        }
        type = props.children, typeof type != "string" && typeof type != "number" && typeof type != "bigint" || instance.textContent === "" + type || props.suppressHydrationWarning === !0 || checkForUnmatchedText(instance.textContent, type) ? (props.popover != null && (listenToNonDelegatedEvent("beforetoggle", instance), listenToNonDelegatedEvent("toggle", instance)), props.onScroll != null && listenToNonDelegatedEvent("scroll", instance), props.onScrollEnd != null && listenToNonDelegatedEvent("scrollend", instance), props.onClick != null && (instance.onclick = noop$1), instance = !0) : instance = !1, instance || throwOnHydrationMismatch(fiber, !0);
      }
      function popToNextHostParent(fiber) {
        for (hydrationParentFiber = fiber.return; hydrationParentFiber; )
          switch (hydrationParentFiber.tag) {
            case 5:
            case 31:
            case 13:
              rootOrSingletonContext = !1;
              return;
            case 27:
            case 3:
              rootOrSingletonContext = !0;
              return;
            default:
              hydrationParentFiber = hydrationParentFiber.return;
          }
      }
      function popHydrationState(fiber) {
        if (fiber !== hydrationParentFiber) return !1;
        if (!isHydrating) return popToNextHostParent(fiber), isHydrating = !0, !1;
        var tag = fiber.tag, JSCompiler_temp;
        if ((JSCompiler_temp = tag !== 3 && tag !== 27) && ((JSCompiler_temp = tag === 5) && (JSCompiler_temp = fiber.type, JSCompiler_temp = !(JSCompiler_temp !== "form" && JSCompiler_temp !== "button") || shouldSetTextContent(fiber.type, fiber.memoizedProps)), JSCompiler_temp = !JSCompiler_temp), JSCompiler_temp && nextHydratableInstance && throwOnHydrationMismatch(fiber), popToNextHostParent(fiber), tag === 13) {
          if (fiber = fiber.memoizedState, fiber = fiber !== null ? fiber.dehydrated : null, !fiber) throw Error(formatProdErrorMessage(317));
          nextHydratableInstance = getNextHydratableInstanceAfterHydrationBoundary(fiber);
        } else if (tag === 31) {
          if (fiber = fiber.memoizedState, fiber = fiber !== null ? fiber.dehydrated : null, !fiber) throw Error(formatProdErrorMessage(317));
          nextHydratableInstance = getNextHydratableInstanceAfterHydrationBoundary(fiber);
        } else
          tag === 27 ? (tag = nextHydratableInstance, isSingletonScope(fiber.type) ? (fiber = previousHydratableOnEnteringScopedSingleton, previousHydratableOnEnteringScopedSingleton = null, nextHydratableInstance = fiber) : nextHydratableInstance = tag) : nextHydratableInstance = hydrationParentFiber ? getNextHydratable(fiber.stateNode.nextSibling) : null;
        return !0;
      }
      function resetHydrationState() {
        nextHydratableInstance = hydrationParentFiber = null, isHydrating = !1;
      }
      function upgradeHydrationErrorsToRecoverable() {
        var queuedErrors = hydrationErrors;
        return queuedErrors !== null && (workInProgressRootRecoverableErrors === null ? workInProgressRootRecoverableErrors = queuedErrors : workInProgressRootRecoverableErrors.push.apply(
          workInProgressRootRecoverableErrors,
          queuedErrors
        ), hydrationErrors = null), queuedErrors;
      }
      function queueHydrationError(error) {
        hydrationErrors === null ? hydrationErrors = [error] : hydrationErrors.push(error);
      }
      var valueCursor = createCursor(null), currentlyRenderingFiber$1 = null, lastContextDependency = null;
      function pushProvider(providerFiber, context, nextValue) {
        push(valueCursor, context._currentValue), context._currentValue = nextValue;
      }
      function popProvider(context) {
        context._currentValue = valueCursor.current, pop(valueCursor);
      }
      function scheduleContextWorkOnParentPath(parent2, renderLanes2, propagationRoot) {
        for (; parent2 !== null; ) {
          var alternate = parent2.alternate;
          if ((parent2.childLanes & renderLanes2) !== renderLanes2 ? (parent2.childLanes |= renderLanes2, alternate !== null && (alternate.childLanes |= renderLanes2)) : alternate !== null && (alternate.childLanes & renderLanes2) !== renderLanes2 && (alternate.childLanes |= renderLanes2), parent2 === propagationRoot) break;
          parent2 = parent2.return;
        }
      }
      function propagateContextChanges(workInProgress2, contexts, renderLanes2, forcePropagateEntireTree) {
        var fiber = workInProgress2.child;
        for (fiber !== null && (fiber.return = workInProgress2); fiber !== null; ) {
          var list = fiber.dependencies;
          if (list !== null) {
            var nextFiber = fiber.child;
            list = list.firstContext;
            a: for (; list !== null; ) {
              var dependency = list;
              list = fiber;
              for (var i = 0; i < contexts.length; i++)
                if (dependency.context === contexts[i]) {
                  list.lanes |= renderLanes2, dependency = list.alternate, dependency !== null && (dependency.lanes |= renderLanes2), scheduleContextWorkOnParentPath(
                    list.return,
                    renderLanes2,
                    workInProgress2
                  ), forcePropagateEntireTree || (nextFiber = null);
                  break a;
                }
              list = dependency.next;
            }
          } else if (fiber.tag === 18) {
            if (nextFiber = fiber.return, nextFiber === null) throw Error(formatProdErrorMessage(341));
            nextFiber.lanes |= renderLanes2, list = nextFiber.alternate, list !== null && (list.lanes |= renderLanes2), scheduleContextWorkOnParentPath(nextFiber, renderLanes2, workInProgress2), nextFiber = null;
          } else
            fiber.tag === 13 && fiber.memoizedState !== null && fiber.memoizedState.dehydrated === null ? (fiber.lanes |= renderLanes2, nextFiber = fiber.alternate, nextFiber !== null && (nextFiber.lanes |= renderLanes2), scheduleContextWorkOnParentPath(
              fiber.return,
              renderLanes2,
              workInProgress2
            ), nextFiber = fiber.child, nextFiber = nextFiber !== null ? nextFiber.sibling : null) : nextFiber = fiber.child;
          if (nextFiber !== null) nextFiber.return = fiber;
          else
            for (nextFiber = fiber; nextFiber !== null; ) {
              if (nextFiber === workInProgress2) {
                nextFiber = null;
                break;
              }
              if (fiber = nextFiber.sibling, fiber !== null) {
                fiber.return = nextFiber.return, nextFiber = fiber;
                break;
              }
              nextFiber = nextFiber.return;
            }
          fiber = nextFiber;
        }
      }
      function propagateParentContextChanges(current, workInProgress2, renderLanes2, forcePropagateEntireTree) {
        current = null;
        for (var parent2 = workInProgress2, isInsidePropagationBailout = !1; parent2 !== null; ) {
          if (!isInsidePropagationBailout) {
            if ((parent2.flags & 524288) !== 0) isInsidePropagationBailout = !0;
            else if ((parent2.flags & 262144) !== 0) break;
          }
          if (parent2.tag === 10) {
            var currentParent = parent2.alternate;
            if (currentParent === null) throw Error(formatProdErrorMessage(387));
            if (currentParent = currentParent.memoizedProps, currentParent !== null) {
              var context = parent2.type;
              objectIs(parent2.pendingProps.value, currentParent.value) || (current !== null ? current.push(context) : current = [context]);
            }
          } else if (parent2 === hostTransitionProviderCursor.current) {
            if (currentParent = parent2.alternate, currentParent === null) throw Error(formatProdErrorMessage(387));
            currentParent.memoizedState.memoizedState !== parent2.memoizedState.memoizedState && (current !== null ? current.push(HostTransitionContext) : current = [HostTransitionContext]);
          }
          parent2 = parent2.return;
        }
        return current !== null && propagateContextChanges(
          workInProgress2,
          current,
          renderLanes2,
          forcePropagateEntireTree
        ), workInProgress2.flags |= 262144, current !== null;
      }
      function checkIfContextChanged(currentDependencies) {
        for (currentDependencies = currentDependencies.firstContext; currentDependencies !== null; ) {
          if (!objectIs(
            currentDependencies.context._currentValue,
            currentDependencies.memoizedValue
          ))
            return !0;
          currentDependencies = currentDependencies.next;
        }
        return !1;
      }
      function prepareToReadContext(workInProgress2) {
        currentlyRenderingFiber$1 = workInProgress2, lastContextDependency = null, workInProgress2 = workInProgress2.dependencies, workInProgress2 !== null && (workInProgress2.firstContext = null);
      }
      function readContext(context) {
        return readContextForConsumer(currentlyRenderingFiber$1, context);
      }
      function readContextDuringReconciliation(consumer, context) {
        return currentlyRenderingFiber$1 === null && prepareToReadContext(consumer), readContextForConsumer(consumer, context);
      }
      function readContextForConsumer(consumer, context) {
        var value = context._currentValue;
        if (context = { context, memoizedValue: value, next: null }, lastContextDependency === null) {
          if (consumer === null) throw Error(formatProdErrorMessage(308));
          lastContextDependency = context, consumer.dependencies = { lanes: 0, firstContext: context }, consumer.flags |= 524288;
        } else lastContextDependency = lastContextDependency.next = context;
        return value;
      }
      var AbortControllerLocal = typeof AbortController < "u" ? AbortController : function() {
        var listeners = [], signal = this.signal = {
          aborted: !1,
          addEventListener: function(type, listener) {
            listeners.push(listener);
          }
        };
        this.abort = function() {
          signal.aborted = !0, listeners.forEach(function(listener) {
            return listener();
          });
        };
      }, scheduleCallback$2 = Scheduler.unstable_scheduleCallback, NormalPriority = Scheduler.unstable_NormalPriority, CacheContext = {
        $$typeof: REACT_CONTEXT_TYPE,
        Consumer: null,
        Provider: null,
        _currentValue: null,
        _currentValue2: null,
        _threadCount: 0
      };
      function createCache() {
        return {
          controller: new AbortControllerLocal(),
          data: /* @__PURE__ */ new Map(),
          refCount: 0
        };
      }
      function releaseCache(cache) {
        cache.refCount--, cache.refCount === 0 && scheduleCallback$2(NormalPriority, function() {
          cache.controller.abort();
        });
      }
      function queueTransitionTypes(root2, transitionTypes) {
        if ((root2.pendingLanes & 4194048) !== 0) {
          var queued = root2.transitionTypes;
          for (queued === null && (queued = root2.transitionTypes = []), root2 = 0; root2 < transitionTypes.length; root2++) {
            var transitionType = transitionTypes[root2];
            queued.indexOf(transitionType) === -1 && queued.push(transitionType);
          }
        }
      }
      var entangledTransitionTypes = null;
      function claimQueuedTransitionTypes(root2) {
        var claimed = root2.transitionTypes;
        return root2.transitionTypes = null, claimed;
      }
      var currentEntangledListeners = null, currentEntangledPendingCount = 0, currentEntangledLane = 0, currentEntangledActionThenable = null;
      function entangleAsyncAction(transition, thenable) {
        if (currentEntangledListeners === null) {
          var entangledListeners = currentEntangledListeners = [];
          currentEntangledPendingCount = 0, currentEntangledLane = requestTransitionLane(), currentEntangledActionThenable = {
            status: "pending",
            value: void 0,
            then: function(resolve) {
              entangledListeners.push(resolve);
            }
          };
        }
        return currentEntangledPendingCount++, thenable.then(pingEngtangledActionScope, pingEngtangledActionScope), thenable;
      }
      function pingEngtangledActionScope() {
        if (--currentEntangledPendingCount === 0 && (entangledTransitionTypes = null, currentEntangledListeners !== null)) {
          currentEntangledActionThenable !== null && (currentEntangledActionThenable.status = "fulfilled");
          var listeners = currentEntangledListeners;
          currentEntangledListeners = null, currentEntangledLane = 0, currentEntangledActionThenable = null;
          for (var i = 0; i < listeners.length; i++) (0, listeners[i])();
        }
      }
      function chainThenableValue(thenable, result) {
        var listeners = [], thenableWithOverride = {
          status: "pending",
          value: null,
          reason: null,
          then: function(resolve) {
            listeners.push(resolve);
          }
        };
        return thenable.then(
          function() {
            thenableWithOverride.status = "fulfilled", thenableWithOverride.value = result;
            for (var i = 0; i < listeners.length; i++) (0, listeners[i])(result);
          },
          function(error) {
            for (thenableWithOverride.status = "rejected", thenableWithOverride.reason = error, error = 0; error < listeners.length; error++)
              (0, listeners[error])(void 0);
          }
        ), thenableWithOverride;
      }
      var prevOnStartTransitionFinish = ReactSharedInternals.S;
      ReactSharedInternals.S = function(transition, returnValue) {
        if (globalMostRecentTransitionTime = now(), typeof returnValue == "object" && returnValue !== null && typeof returnValue.then == "function" && entangleAsyncAction(transition, returnValue), entangledTransitionTypes !== null)
          for (var root$28 = firstScheduledRoot; root$28 !== null; )
            queueTransitionTypes(root$28, entangledTransitionTypes), root$28 = root$28.next;
        if (root$28 = transition.types, root$28 !== null) {
          for (var root$29 = firstScheduledRoot; root$29 !== null; )
            queueTransitionTypes(root$29, root$28), root$29 = root$29.next;
          if (currentEntangledLane !== 0) {
            root$29 = entangledTransitionTypes, root$29 === null && (root$29 = entangledTransitionTypes = []);
            for (var i = 0; i < root$28.length; i++) {
              var transitionType = root$28[i];
              root$29.indexOf(transitionType) === -1 && root$29.push(transitionType);
            }
          }
        }
        prevOnStartTransitionFinish !== null && prevOnStartTransitionFinish(transition, returnValue);
      };
      var resumedCache = createCursor(null);
      function peekCacheFromPool() {
        var cacheResumedFromPreviousRender = resumedCache.current;
        return cacheResumedFromPreviousRender !== null ? cacheResumedFromPreviousRender : workInProgressRoot.pooledCache;
      }
      function pushTransition(offscreenWorkInProgress, prevCachePool) {
        prevCachePool === null ? push(resumedCache, resumedCache.current) : push(resumedCache, prevCachePool.pool);
      }
      function getSuspendedCache() {
        var cacheFromPool = peekCacheFromPool();
        return cacheFromPool === null ? null : { parent: CacheContext._currentValue, pool: cacheFromPool };
      }
      var SuspenseException = Error(formatProdErrorMessage(460)), SuspenseyCommitException = Error(formatProdErrorMessage(474)), SuspenseActionException = Error(formatProdErrorMessage(542)), noopSuspenseyCommitThenable = { then: function() {
      } };
      function isThenableResolved(thenable) {
        return thenable = thenable.status, thenable === "fulfilled" || thenable === "rejected";
      }
      function trackUsedThenable(thenableState2, thenable, index3) {
        switch (index3 = thenableState2[index3], index3 === void 0 ? thenableState2.push(thenable) : index3 !== thenable && (thenable.then(noop$1, noop$1), thenable = index3), thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenableState2 = thenable.reason, checkIfUseWrappedInAsyncCatch(thenableState2), thenableState2 === void 0 && !("reason" in thenable) ? Error(formatProdErrorMessage(600)) : thenableState2;
          default:
            if (typeof thenable.status == "string") thenable.then(noop$1, noop$1);
            else {
              if (thenableState2 = workInProgressRoot, thenableState2 !== null && 100 < thenableState2.shellSuspendCounter)
                throw Error(formatProdErrorMessage(482));
              thenableState2 = thenable, thenableState2.status = "pending", thenableState2.then(
                function(fulfilledValue) {
                  if (thenable.status === "pending") {
                    var fulfilledThenable = thenable;
                    fulfilledThenable.status = "fulfilled", fulfilledThenable.value = fulfilledValue;
                  }
                },
                function(error) {
                  if (thenable.status === "pending") {
                    var rejectedThenable = thenable;
                    rejectedThenable.status = "rejected", rejectedThenable.reason = error;
                  }
                }
              );
            }
            switch (thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenableState2 = thenable.reason, checkIfUseWrappedInAsyncCatch(thenableState2), thenableState2;
            }
            throw suspendedThenable = thenable, SuspenseException;
        }
      }
      function resolveLazy(lazyType) {
        try {
          var init = lazyType._init;
          return init(lazyType._payload);
        } catch (x) {
          throw x !== null && typeof x == "object" && typeof x.then == "function" ? (suspendedThenable = x, SuspenseException) : x;
        }
      }
      var suspendedThenable = null;
      function getSuspendedThenable() {
        if (suspendedThenable === null) throw Error(formatProdErrorMessage(459));
        var thenable = suspendedThenable;
        return suspendedThenable = null, thenable;
      }
      function checkIfUseWrappedInAsyncCatch(rejectedReason) {
        if (rejectedReason === SuspenseException || rejectedReason === SuspenseActionException)
          throw Error(formatProdErrorMessage(483));
      }
      var thenableState$1 = null, thenableIndexCounter$1 = 0;
      function unwrapThenable(thenable) {
        var index3 = thenableIndexCounter$1;
        return thenableIndexCounter$1 += 1, thenableState$1 === null && (thenableState$1 = []), trackUsedThenable(thenableState$1, thenable, index3);
      }
      function coerceRef(workInProgress2, element) {
        element = element.props.ref, workInProgress2.ref = element !== void 0 ? element : null;
      }
      function throwOnInvalidObjectTypeImpl(returnFiber, newChild) {
        throw newChild.$$typeof === REACT_LEGACY_ELEMENT_TYPE ? Error(formatProdErrorMessage(525)) : (returnFiber = Object.prototype.toString.call(newChild), Error(
          formatProdErrorMessage(
            31,
            returnFiber === "[object Object]" ? "object with keys {" + Object.keys(newChild).join(", ") + "}" : returnFiber
          )
        ));
      }