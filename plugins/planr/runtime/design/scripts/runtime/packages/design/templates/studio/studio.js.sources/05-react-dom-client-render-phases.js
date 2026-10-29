
      var classComponentUpdater = {
        enqueueSetState: function(inst, payload, callback) {
          inst = inst._reactInternals;
          var lane = requestUpdateLane(), update = createUpdate(lane);
          update.payload = payload, callback != null && (update.callback = callback), payload = enqueueUpdate(inst, update, lane), payload !== null && (scheduleUpdateOnFiber(payload, inst, lane), entangleTransitions(payload, inst, lane));
        },
        enqueueReplaceState: function(inst, payload, callback) {
          inst = inst._reactInternals;
          var lane = requestUpdateLane(), update = createUpdate(lane);
          update.tag = 1, update.payload = payload, callback != null && (update.callback = callback), payload = enqueueUpdate(inst, update, lane), payload !== null && (scheduleUpdateOnFiber(payload, inst, lane), entangleTransitions(payload, inst, lane));
        },
        enqueueForceUpdate: function(inst, callback) {
          inst = inst._reactInternals;
          var lane = requestUpdateLane(), update = createUpdate(lane);
          update.tag = 2, callback != null && (update.callback = callback), callback = enqueueUpdate(inst, update, lane), callback !== null && (scheduleUpdateOnFiber(callback, inst, lane), entangleTransitions(callback, inst, lane));
        }
      };
      function checkShouldComponentUpdate(workInProgress2, ctor, oldProps, newProps, oldState, newState, nextContext) {
        return workInProgress2 = workInProgress2.stateNode, typeof workInProgress2.shouldComponentUpdate == "function" ? workInProgress2.shouldComponentUpdate(newProps, newState, nextContext) : ctor.prototype && ctor.prototype.isPureReactComponent ? !shallowEqual2(oldProps, newProps) || !shallowEqual2(oldState, newState) : !0;
      }
      function callComponentWillReceiveProps(workInProgress2, instance, newProps, nextContext) {
        workInProgress2 = instance.state, typeof instance.componentWillReceiveProps == "function" && instance.componentWillReceiveProps(newProps, nextContext), typeof instance.UNSAFE_componentWillReceiveProps == "function" && instance.UNSAFE_componentWillReceiveProps(newProps, nextContext), instance.state !== workInProgress2 && classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
      }
      function resolveClassComponentProps(Component, baseProps) {
        var newProps = baseProps;
        if ("ref" in baseProps) {
          newProps = {};
          for (var propName in baseProps)
            propName !== "ref" && (newProps[propName] = baseProps[propName]);
        }
        if (Component = Component.defaultProps) {
          newProps === baseProps && (newProps = assign({}, newProps));
          for (var propName$77 in Component)
            newProps[propName$77] === void 0 && (newProps[propName$77] = Component[propName$77]);
        }
        return newProps;
      }
      function defaultOnUncaughtError(error) {
        reportGlobalError(error);
      }
      function defaultOnCaughtError(error) {
        console.error(error);
      }
      function defaultOnRecoverableError(error) {
        reportGlobalError(error);
      }
      function logUncaughtError(root2, errorInfo) {
        try {
          var onUncaughtError = root2.onUncaughtError;
          onUncaughtError(errorInfo.value, { componentStack: errorInfo.stack });
        } catch (e$78) {
          setTimeout(function() {
            throw e$78;
          });
        }
      }
      function logCaughtError(root2, boundary, errorInfo) {
        try {
          var onCaughtError = root2.onCaughtError;
          onCaughtError(errorInfo.value, {
            componentStack: errorInfo.stack,
            errorBoundary: boundary.tag === 1 ? boundary.stateNode : null
          });
        } catch (e$79) {
          setTimeout(function() {
            throw e$79;
          });
        }
      }
      function createRootErrorUpdate(root2, errorInfo, lane) {
        return lane = createUpdate(lane), lane.tag = 3, lane.payload = { element: null }, lane.callback = function() {
          logUncaughtError(root2, errorInfo);
        }, lane;
      }
      function createClassErrorUpdate(lane) {
        return lane = createUpdate(lane), lane.tag = 3, lane;
      }
      function initializeClassErrorUpdate(update, root2, fiber, errorInfo) {
        var getDerivedStateFromError = fiber.type.getDerivedStateFromError;
        if (typeof getDerivedStateFromError == "function") {
          var error = errorInfo.value;
          update.payload = function() {
            return getDerivedStateFromError(error);
          }, update.callback = function() {
            logCaughtError(root2, fiber, errorInfo);
          };
        }
        var inst = fiber.stateNode;
        inst !== null && typeof inst.componentDidCatch == "function" && (update.callback = function() {
          logCaughtError(root2, fiber, errorInfo), typeof getDerivedStateFromError != "function" && (legacyErrorBoundariesThatAlreadyFailed === null ? legacyErrorBoundariesThatAlreadyFailed = /* @__PURE__ */ new Set([this]) : legacyErrorBoundariesThatAlreadyFailed.add(this));
          var stack = errorInfo.stack;
          this.componentDidCatch(errorInfo.value, {
            componentStack: stack !== null ? stack : ""
          });
        });
      }
      function throwException(root2, returnFiber, sourceFiber, value, rootRenderLanes) {
        if (sourceFiber.flags |= 32768, value !== null && typeof value == "object" && typeof value.then == "function") {
          if (returnFiber = sourceFiber.alternate, returnFiber !== null && propagateParentContextChanges(
            returnFiber,
            sourceFiber,
            rootRenderLanes,
            !0
          ), sourceFiber = suspenseHandlerStackCursor.current, sourceFiber !== null) {
            switch (sourceFiber.tag) {
              case 31:
              case 13:
              case 19:
                return shellBoundary === null ? renderDidSuspendDelayIfPossible() : sourceFiber.alternate === null && workInProgressRootExitStatus === 0 && (workInProgressRootExitStatus = 3), sourceFiber.flags &= -257, sourceFiber.flags |= 65536, sourceFiber.lanes = rootRenderLanes, value === noopSuspenseyCommitThenable ? sourceFiber.flags |= 16384 : (returnFiber = sourceFiber.updateQueue, returnFiber === null ? sourceFiber.updateQueue = /* @__PURE__ */ new Set([value]) : returnFiber.add(value), attachPingListener(root2, value, rootRenderLanes)), !1;
              case 22:
                return sourceFiber.flags |= 65536, value === noopSuspenseyCommitThenable ? sourceFiber.flags |= 16384 : (returnFiber = sourceFiber.updateQueue, returnFiber === null ? (returnFiber = {
                  transitions: null,
                  markerInstances: null,
                  retryQueue: /* @__PURE__ */ new Set([value])
                }, sourceFiber.updateQueue = returnFiber) : (sourceFiber = returnFiber.retryQueue, sourceFiber === null ? returnFiber.retryQueue = /* @__PURE__ */ new Set([value]) : sourceFiber.add(value)), attachPingListener(root2, value, rootRenderLanes)), !1;
            }
            throw Error(formatProdErrorMessage(435, sourceFiber.tag));
          }
          return attachPingListener(root2, value, rootRenderLanes), renderDidSuspendDelayIfPossible(), !1;
        }
        if (isHydrating)
          return returnFiber = suspenseHandlerStackCursor.current, returnFiber !== null ? ((returnFiber.flags & 65536) === 0 && (returnFiber.flags |= 256), returnFiber.flags |= 65536, returnFiber.lanes = rootRenderLanes, value !== HydrationMismatchException && (root2 = Error(formatProdErrorMessage(422), { cause: value }), queueHydrationError(createCapturedValueAtFiber(root2, sourceFiber)))) : (value !== HydrationMismatchException && (returnFiber = Error(formatProdErrorMessage(423), {
            cause: value
          }), queueHydrationError(
            createCapturedValueAtFiber(returnFiber, sourceFiber)
          )), root2 = root2.current.alternate, root2.flags |= 65536, rootRenderLanes &= -rootRenderLanes, root2.lanes |= rootRenderLanes, value = createCapturedValueAtFiber(value, sourceFiber), rootRenderLanes = createRootErrorUpdate(
            root2.stateNode,
            value,
            rootRenderLanes
          ), enqueueCapturedUpdate(root2, rootRenderLanes), workInProgressRootExitStatus !== 4 && (workInProgressRootExitStatus = 2)), !1;
        var wrapperError = Error(formatProdErrorMessage(520), { cause: value });
        if (wrapperError = createCapturedValueAtFiber(wrapperError, sourceFiber), workInProgressRootConcurrentErrors === null ? workInProgressRootConcurrentErrors = [wrapperError] : workInProgressRootConcurrentErrors.push(wrapperError), workInProgressRootExitStatus !== 4 && (workInProgressRootExitStatus = 2), returnFiber === null) return !0;
        value = createCapturedValueAtFiber(value, sourceFiber), sourceFiber = returnFiber;
        do {
          switch (sourceFiber.tag) {
            case 3:
              return sourceFiber.flags |= 65536, root2 = rootRenderLanes & -rootRenderLanes, sourceFiber.lanes |= root2, root2 = createRootErrorUpdate(sourceFiber.stateNode, value, root2), enqueueCapturedUpdate(sourceFiber, root2), !1;
            case 1:
              if (returnFiber = sourceFiber.type, wrapperError = sourceFiber.stateNode, (sourceFiber.flags & 128) === 0 && (typeof returnFiber.getDerivedStateFromError == "function" || wrapperError !== null && typeof wrapperError.componentDidCatch == "function" && (legacyErrorBoundariesThatAlreadyFailed === null || !legacyErrorBoundariesThatAlreadyFailed.has(wrapperError))))
                return sourceFiber.flags |= 65536, rootRenderLanes &= -rootRenderLanes, sourceFiber.lanes |= rootRenderLanes, rootRenderLanes = createClassErrorUpdate(rootRenderLanes), initializeClassErrorUpdate(
                  rootRenderLanes,
                  root2,
                  sourceFiber,
                  value
                ), enqueueCapturedUpdate(sourceFiber, rootRenderLanes), !1;
              break;
            case 22:
              if (sourceFiber.memoizedState !== null)
                return sourceFiber.flags |= 65536, !1;
          }
          sourceFiber = sourceFiber.return;
        } while (sourceFiber !== null);
        return !1;
      }
      var SelectiveHydrationException = Error(formatProdErrorMessage(461)), didReceiveUpdate = !1;
      function reconcileChildren(current, workInProgress2, nextChildren, renderLanes2) {
        workInProgress2.child = current === null ? mountChildFibers(workInProgress2, null, nextChildren, renderLanes2) : reconcileChildFibers(
          workInProgress2,
          current.child,
          nextChildren,
          renderLanes2
        );
      }
      function updateForwardRef(current, workInProgress2, Component, nextProps, renderLanes2) {
        Component = Component.render;
        var ref = workInProgress2.ref;
        if ("ref" in nextProps) {
          var propsWithoutRef = {};
          for (var key in nextProps)
            key !== "ref" && (propsWithoutRef[key] = nextProps[key]);
        } else propsWithoutRef = nextProps;
        return prepareToReadContext(workInProgress2), nextProps = renderWithHooks(
          current,
          workInProgress2,
          Component,
          propsWithoutRef,
          ref,
          renderLanes2
        ), key = checkDidRenderIdHook(), current !== null && !didReceiveUpdate ? (bailoutHooks(current, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2)) : (isHydrating && key && pushMaterializedTreeId(workInProgress2), workInProgress2.flags |= 1, reconcileChildren(current, workInProgress2, nextProps, renderLanes2), workInProgress2.child);
      }
      function updateMemoComponent(current, workInProgress2, Component, nextProps, renderLanes2) {
        if (current === null) {
          var type = Component.type;
          return typeof type == "function" && !shouldConstruct(type) && type.defaultProps === void 0 && Component.compare === null ? (workInProgress2.tag = 15, workInProgress2.type = type, updateSimpleMemoComponent(
            current,
            workInProgress2,
            type,
            nextProps,
            renderLanes2
          )) : (current = createFiberFromTypeAndProps(
            Component.type,
            null,
            nextProps,
            workInProgress2,
            workInProgress2.mode,
            renderLanes2
          ), current.ref = workInProgress2.ref, current.return = workInProgress2, workInProgress2.child = current);
        }
        if (type = current.child, !checkScheduledUpdateOrContext(current, renderLanes2)) {
          var prevProps = type.memoizedProps;
          if (Component = Component.compare, Component = Component !== null ? Component : shallowEqual2, Component(prevProps, nextProps) && current.ref === workInProgress2.ref)
            return bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
        }
        return workInProgress2.flags |= 1, current = createWorkInProgress(type, nextProps), current.ref = workInProgress2.ref, current.return = workInProgress2, workInProgress2.child = current;
      }
      function updateSimpleMemoComponent(current, workInProgress2, Component, nextProps, renderLanes2) {
        if (current !== null) {
          var prevProps = current.memoizedProps;
          if (shallowEqual2(prevProps, nextProps) && current.ref === workInProgress2.ref)
            if (didReceiveUpdate = !1, workInProgress2.pendingProps = nextProps = prevProps, checkScheduledUpdateOrContext(current, renderLanes2))
              (current.flags & 131072) !== 0 && (didReceiveUpdate = !0);
            else
              return workInProgress2.lanes = current.lanes, bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
        }
        return updateFunctionComponent(
          current,
          workInProgress2,
          Component,
          nextProps,
          renderLanes2
        );
      }
      function updateOffscreenComponent(current, workInProgress2, renderLanes2, nextProps) {
        var nextChildren = nextProps.children, prevState = current !== null ? current.memoizedState : null;
        if (current === null && workInProgress2.stateNode === null && (workInProgress2.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null
        }), nextProps.mode === "hidden") {
          if ((workInProgress2.flags & 128) !== 0) {
            if (prevState = prevState !== null ? prevState.baseLanes | renderLanes2 : renderLanes2, current !== null) {
              for (nextProps = workInProgress2.child = current.child, nextChildren = 0; nextProps !== null; )
                nextChildren = nextChildren | nextProps.lanes | nextProps.childLanes, nextProps = nextProps.sibling;
              nextProps = nextChildren & ~prevState;
            } else nextProps = 0, workInProgress2.child = null;
            return deferHiddenOffscreenComponent(
              current,
              workInProgress2,
              prevState,
              renderLanes2,
              nextProps
            );
          }
          if ((renderLanes2 & 536870912) !== 0)
            workInProgress2.memoizedState = { baseLanes: 0, cachePool: null }, current !== null && pushTransition(
              workInProgress2,
              prevState !== null ? prevState.cachePool : null
            ), prevState !== null ? pushHiddenContext(workInProgress2, prevState) : reuseHiddenContextOnStack(), pushOffscreenSuspenseHandler(workInProgress2);
          else
            return nextProps = workInProgress2.lanes = 536870912, deferHiddenOffscreenComponent(
              current,
              workInProgress2,
              prevState !== null ? prevState.baseLanes | renderLanes2 : renderLanes2,
              renderLanes2,
              nextProps
            );
        } else
          prevState !== null ? (pushTransition(workInProgress2, prevState.cachePool), pushHiddenContext(workInProgress2, prevState), reuseSuspenseHandlerOnStack(), workInProgress2.memoizedState = null) : (current !== null && pushTransition(workInProgress2, null), reuseHiddenContextOnStack(), reuseSuspenseHandlerOnStack());
        return reconcileChildren(current, workInProgress2, nextChildren, renderLanes2), workInProgress2.child;
      }
      function bailoutOffscreenComponent(current, workInProgress2) {
        return current !== null && current.tag === 22 || workInProgress2.stateNode !== null || (workInProgress2.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null
        }), workInProgress2.sibling;
      }
      function deferHiddenOffscreenComponent(current, workInProgress2, nextBaseLanes, renderLanes2, remainingChildLanes) {
        var JSCompiler_inline_result = peekCacheFromPool();
        return JSCompiler_inline_result = JSCompiler_inline_result === null ? null : { parent: CacheContext._currentValue, pool: JSCompiler_inline_result }, workInProgress2.memoizedState = {
          baseLanes: nextBaseLanes,
          cachePool: JSCompiler_inline_result
        }, current !== null && pushTransition(workInProgress2, null), reuseHiddenContextOnStack(), pushOffscreenSuspenseHandler(workInProgress2), current !== null && propagateParentContextChanges(current, workInProgress2, renderLanes2, !0), workInProgress2.childLanes = remainingChildLanes, null;
      }
      function mountActivityChildren(workInProgress2, nextProps) {
        return nextProps = mountWorkInProgressOffscreenFiber(
          { mode: nextProps.mode, children: nextProps.children },
          workInProgress2.mode
        ), nextProps.ref = workInProgress2.ref, workInProgress2.child = nextProps, nextProps.return = workInProgress2, nextProps;
      }
      function retryActivityComponentWithoutHydrating(current, workInProgress2, renderLanes2) {
        return reconcileChildFibers(workInProgress2, current.child, null, renderLanes2), current = mountActivityChildren(workInProgress2, workInProgress2.pendingProps), current.flags |= 2, popSuspenseHandler(workInProgress2), workInProgress2.memoizedState = null, current;
      }
      function updateActivityComponent(current, workInProgress2, renderLanes2) {
        var nextProps = workInProgress2.pendingProps, didSuspend = (workInProgress2.flags & 128) !== 0;
        if (workInProgress2.flags &= -129, current === null) {
          if (isHydrating) {
            if (nextProps.mode === "hidden")
              return current = mountActivityChildren(workInProgress2, nextProps), workInProgress2.lanes = 536870912, current.memoizedState = { baseLanes: 0, cachePool: null }, bailoutOffscreenComponent(null, current);
            if (pushDehydratedActivitySuspenseHandler(workInProgress2), (current = nextHydratableInstance) ? (current = canHydrateHydrationBoundary(
              current,
              rootOrSingletonContext
            ), current = current !== null && current.data === "&" ? current : null, current !== null && (workInProgress2.memoizedState = {
              dehydrated: current,
              treeContext: treeContextProvider !== null ? { id: treeContextId, overflow: treeContextOverflow } : null,
              retryLane: 536870912,
              hydrationErrors: null
            }, renderLanes2 = createFiberFromDehydratedFragment(current), renderLanes2.return = workInProgress2, workInProgress2.child = renderLanes2, hydrationParentFiber = workInProgress2, nextHydratableInstance = null)) : current = null, current === null) throw throwOnHydrationMismatch(workInProgress2);
            return workInProgress2.lanes = 536870912, null;
          }
          return mountActivityChildren(workInProgress2, nextProps);
        }
        var prevState = current.memoizedState;
        if (prevState !== null) {
          var dehydrated = prevState.dehydrated;
          if (pushDehydratedActivitySuspenseHandler(workInProgress2), didSuspend)
            if (workInProgress2.flags & 256)
              workInProgress2.flags &= -257, workInProgress2 = retryActivityComponentWithoutHydrating(
                current,
                workInProgress2,
                renderLanes2
              );
            else if (workInProgress2.memoizedState !== null)
              workInProgress2.child = current.child, workInProgress2.flags |= 128, workInProgress2 = null;
            else throw Error(formatProdErrorMessage(558));
          else if (didReceiveUpdate || propagateParentContextChanges(current, workInProgress2, renderLanes2, !1), didSuspend = (renderLanes2 & current.childLanes) !== 0, didReceiveUpdate || didSuspend) {
            if (currentTreeHiddenStackCursor.current === null) {
              if (nextProps = workInProgressRoot, nextProps !== null && (dehydrated = getBumpedLaneForHydration(nextProps, renderLanes2), dehydrated !== 0 && dehydrated !== prevState.retryLane))
                throw prevState.retryLane = dehydrated, enqueueConcurrentRenderForLane(current, dehydrated), scheduleUpdateOnFiber(nextProps, current, dehydrated), SelectiveHydrationException;
              renderDidSuspendDelayIfPossible();
            }
            workInProgress2 = retryActivityComponentWithoutHydrating(
              current,
              workInProgress2,
              renderLanes2
            );
          } else
            current = prevState.treeContext, nextHydratableInstance = getNextHydratable(dehydrated.nextSibling), hydrationParentFiber = workInProgress2, isHydrating = !0, hydrationErrors = null, rootOrSingletonContext = !1, current !== null && restoreSuspendedTreeContext(workInProgress2, current), workInProgress2 = mountActivityChildren(workInProgress2, nextProps), workInProgress2.flags |= 134221824;
          return workInProgress2;
        }
        return current = createWorkInProgress(current.child, {
          mode: nextProps.mode,
          children: nextProps.children
        }), current.ref = workInProgress2.ref, workInProgress2.child = current, current.return = workInProgress2, current;
      }
      function markRef(current, workInProgress2) {
        var ref = workInProgress2.ref;
        if (ref === null)
          current !== null && current.ref !== null && (workInProgress2.flags |= 4194816);
        else {
          if (typeof ref != "function" && typeof ref != "object")
            throw Error(formatProdErrorMessage(284));
          (current === null || current.ref !== ref) && (workInProgress2.flags |= 4194816);
        }
      }
      function updateFunctionComponent(current, workInProgress2, Component, nextProps, renderLanes2) {
        return prepareToReadContext(workInProgress2), Component = renderWithHooks(
          current,
          workInProgress2,
          Component,
          nextProps,
          void 0,
          renderLanes2
        ), nextProps = checkDidRenderIdHook(), current !== null && !didReceiveUpdate ? (bailoutHooks(current, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2)) : (isHydrating && nextProps && pushMaterializedTreeId(workInProgress2), workInProgress2.flags |= 1, reconcileChildren(current, workInProgress2, Component, renderLanes2), workInProgress2.child);
      }
      function replayFunctionComponent(current, workInProgress2, nextProps, Component, secondArg, renderLanes2) {
        return prepareToReadContext(workInProgress2), workInProgress2.updateQueue = null, nextProps = renderWithHooksAgain(
          workInProgress2,
          Component,
          nextProps,
          secondArg
        ), finishRenderingHooks(current), Component = checkDidRenderIdHook(), current !== null && !didReceiveUpdate ? (bailoutHooks(current, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2)) : (isHydrating && Component && pushMaterializedTreeId(workInProgress2), workInProgress2.flags |= 1, reconcileChildren(current, workInProgress2, nextProps, renderLanes2), workInProgress2.child);
      }
      function updateClassComponent(current, workInProgress2, Component, nextProps, renderLanes2) {
        if (prepareToReadContext(workInProgress2), workInProgress2.stateNode === null) {
          var context = emptyContextObject, contextType = Component.contextType;
          typeof contextType == "object" && contextType !== null && (context = readContext(contextType)), context = new Component(nextProps, context), workInProgress2.memoizedState = context.state !== null && context.state !== void 0 ? context.state : null, context.updater = classComponentUpdater, workInProgress2.stateNode = context, context._reactInternals = workInProgress2, context = workInProgress2.stateNode, context.props = nextProps, context.state = workInProgress2.memoizedState, context.refs = {}, initializeUpdateQueue(workInProgress2), contextType = Component.contextType, context.context = typeof contextType == "object" && contextType !== null ? readContext(contextType) : emptyContextObject, context.state = workInProgress2.memoizedState, contextType = Component.getDerivedStateFromProps, typeof contextType == "function" && (applyDerivedStateFromProps(
            workInProgress2,
            Component,
            contextType,
            nextProps
          ), context.state = workInProgress2.memoizedState), typeof Component.getDerivedStateFromProps == "function" || typeof context.getSnapshotBeforeUpdate == "function" || typeof context.UNSAFE_componentWillMount != "function" && typeof context.componentWillMount != "function" || (contextType = context.state, typeof context.componentWillMount == "function" && context.componentWillMount(), typeof context.UNSAFE_componentWillMount == "function" && context.UNSAFE_componentWillMount(), contextType !== context.state && classComponentUpdater.enqueueReplaceState(context, context.state, null), processUpdateQueue(workInProgress2, nextProps, context, renderLanes2), suspendIfUpdateReadFromEntangledAsyncAction(), context.state = workInProgress2.memoizedState), typeof context.componentDidMount == "function" && (workInProgress2.flags |= 4194308), nextProps = !0;
        } else if (current === null) {
          context = workInProgress2.stateNode;
          var unresolvedOldProps = workInProgress2.memoizedProps, oldProps = resolveClassComponentProps(Component, unresolvedOldProps);
          context.props = oldProps;
          var oldContext = context.context, contextType$jscomp$0 = Component.contextType;
          contextType = emptyContextObject, typeof contextType$jscomp$0 == "object" && contextType$jscomp$0 !== null && (contextType = readContext(contextType$jscomp$0));
          var getDerivedStateFromProps = Component.getDerivedStateFromProps;
          contextType$jscomp$0 = typeof getDerivedStateFromProps == "function" || typeof context.getSnapshotBeforeUpdate == "function", unresolvedOldProps = workInProgress2.pendingProps !== unresolvedOldProps, contextType$jscomp$0 || typeof context.UNSAFE_componentWillReceiveProps != "function" && typeof context.componentWillReceiveProps != "function" || (unresolvedOldProps || oldContext !== contextType) && callComponentWillReceiveProps(
            workInProgress2,
            context,
            nextProps,
            contextType
          ), hasForceUpdate = !1;
          var oldState = workInProgress2.memoizedState;
          context.state = oldState, processUpdateQueue(workInProgress2, nextProps, context, renderLanes2), suspendIfUpdateReadFromEntangledAsyncAction(), oldContext = workInProgress2.memoizedState, unresolvedOldProps || oldState !== oldContext || hasForceUpdate ? (typeof getDerivedStateFromProps == "function" && (applyDerivedStateFromProps(
            workInProgress2,
            Component,
            getDerivedStateFromProps,
            nextProps
          ), oldContext = workInProgress2.memoizedState), (oldProps = hasForceUpdate || checkShouldComponentUpdate(
            workInProgress2,
            Component,
            oldProps,
            nextProps,
            oldState,
            oldContext,
            contextType
          )) ? (contextType$jscomp$0 || typeof context.UNSAFE_componentWillMount != "function" && typeof context.componentWillMount != "function" || (typeof context.componentWillMount == "function" && context.componentWillMount(), typeof context.UNSAFE_componentWillMount == "function" && context.UNSAFE_componentWillMount()), typeof context.componentDidMount == "function" && (workInProgress2.flags |= 4194308)) : (typeof context.componentDidMount == "function" && (workInProgress2.flags |= 4194308), workInProgress2.memoizedProps = nextProps, workInProgress2.memoizedState = oldContext), context.props = nextProps, context.state = oldContext, context.context = contextType, nextProps = oldProps) : (typeof context.componentDidMount == "function" && (workInProgress2.flags |= 4194308), nextProps = !1);
        } else {
          context = workInProgress2.stateNode, cloneUpdateQueue(current, workInProgress2), contextType = workInProgress2.memoizedProps, contextType$jscomp$0 = resolveClassComponentProps(Component, contextType), context.props = contextType$jscomp$0, getDerivedStateFromProps = workInProgress2.pendingProps, oldState = context.context, oldContext = Component.contextType, oldProps = emptyContextObject, typeof oldContext == "object" && oldContext !== null && (oldProps = readContext(oldContext)), unresolvedOldProps = Component.getDerivedStateFromProps, (oldContext = typeof unresolvedOldProps == "function" || typeof context.getSnapshotBeforeUpdate == "function") || typeof context.UNSAFE_componentWillReceiveProps != "function" && typeof context.componentWillReceiveProps != "function" || (contextType !== getDerivedStateFromProps || oldState !== oldProps) && callComponentWillReceiveProps(
            workInProgress2,
            context,
            nextProps,
            oldProps
          ), hasForceUpdate = !1, oldState = workInProgress2.memoizedState, context.state = oldState, processUpdateQueue(workInProgress2, nextProps, context, renderLanes2), suspendIfUpdateReadFromEntangledAsyncAction();
          var newState = workInProgress2.memoizedState;
          contextType !== getDerivedStateFromProps || oldState !== newState || hasForceUpdate || current !== null && current.dependencies !== null && checkIfContextChanged(current.dependencies) ? (typeof unresolvedOldProps == "function" && (applyDerivedStateFromProps(
            workInProgress2,
            Component,
            unresolvedOldProps,
            nextProps
          ), newState = workInProgress2.memoizedState), (contextType$jscomp$0 = hasForceUpdate || checkShouldComponentUpdate(
            workInProgress2,
            Component,
            contextType$jscomp$0,
            nextProps,
            oldState,
            newState,
            oldProps
          ) || current !== null && current.dependencies !== null && checkIfContextChanged(current.dependencies)) ? (oldContext || typeof context.UNSAFE_componentWillUpdate != "function" && typeof context.componentWillUpdate != "function" || (typeof context.componentWillUpdate == "function" && context.componentWillUpdate(nextProps, newState, oldProps), typeof context.UNSAFE_componentWillUpdate == "function" && context.UNSAFE_componentWillUpdate(
            nextProps,
            newState,
            oldProps
          )), typeof context.componentDidUpdate == "function" && (workInProgress2.flags |= 4), typeof context.getSnapshotBeforeUpdate == "function" && (workInProgress2.flags |= 1024)) : (typeof context.componentDidUpdate != "function" || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress2.flags |= 4), typeof context.getSnapshotBeforeUpdate != "function" || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress2.flags |= 1024), workInProgress2.memoizedProps = nextProps, workInProgress2.memoizedState = newState), context.props = nextProps, context.state = newState, context.context = oldProps, nextProps = contextType$jscomp$0) : (typeof context.componentDidUpdate != "function" || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress2.flags |= 4), typeof context.getSnapshotBeforeUpdate != "function" || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress2.flags |= 1024), nextProps = !1);
        }
        return context = nextProps, markRef(current, workInProgress2), nextProps = (workInProgress2.flags & 128) !== 0, context || nextProps ? (context = workInProgress2.stateNode, Component = nextProps && typeof Component.getDerivedStateFromError != "function" ? null : context.render(), workInProgress2.flags |= 1, current !== null && nextProps ? (workInProgress2.child = reconcileChildFibers(
          workInProgress2,
          current.child,
          null,
          renderLanes2
        ), workInProgress2.child = reconcileChildFibers(
          workInProgress2,
          null,
          Component,
          renderLanes2
        )) : reconcileChildren(current, workInProgress2, Component, renderLanes2), workInProgress2.memoizedState = context.state, current = workInProgress2.child) : current = bailoutOnAlreadyFinishedWork(
          current,
          workInProgress2,
          renderLanes2
        ), current;
      }
      function mountHostRootWithoutHydrating(current, workInProgress2, nextChildren, renderLanes2) {
        return resetHydrationState(), workInProgress2.flags |= 256, reconcileChildren(current, workInProgress2, nextChildren, renderLanes2), workInProgress2.child;
      }
      var SUSPENDED_MARKER = {
        dehydrated: null,
        treeContext: null,
        retryLane: 0,
        hydrationErrors: null
      };
      function mountSuspenseOffscreenState(renderLanes2) {
        return { baseLanes: renderLanes2, cachePool: getSuspendedCache() };
      }
      function getRemainingWorkInPrimaryTree(current, primaryTreeDidDefer, renderLanes2) {
        return current = current !== null ? current.childLanes & ~renderLanes2 : 0, primaryTreeDidDefer && (current |= workInProgressDeferredLane), current;
      }
      function updateSuspenseComponent(current, workInProgress2, renderLanes2) {
        var nextProps = workInProgress2.pendingProps, showFallback = !1, didSuspend = (workInProgress2.flags & 128) !== 0, JSCompiler_temp;
        if ((JSCompiler_temp = didSuspend) || (JSCompiler_temp = current !== null && current.memoizedState === null ? !1 : (suspenseStackCursor.current & 2) !== 0), JSCompiler_temp && (showFallback = !0, workInProgress2.flags &= -129), JSCompiler_temp = (workInProgress2.flags & 32) !== 0, workInProgress2.flags &= -33, current === null) {
          if (isHydrating) {
            if (showFallback ? pushPrimaryTreeSuspenseHandler(workInProgress2) : reuseSuspenseHandlerOnStack(), (current = nextHydratableInstance) ? (current = canHydrateHydrationBoundary(
              current,
              rootOrSingletonContext
            ), current = current !== null && current.data !== "&" ? current : null, current !== null && (workInProgress2.memoizedState = {
              dehydrated: current,
              treeContext: treeContextProvider !== null ? { id: treeContextId, overflow: treeContextOverflow } : null,
              retryLane: 536870912,
              hydrationErrors: null
            }, renderLanes2 = createFiberFromDehydratedFragment(current), renderLanes2.return = workInProgress2, workInProgress2.child = renderLanes2, hydrationParentFiber = workInProgress2, nextHydratableInstance = null)) : current = null, current === null) throw throwOnHydrationMismatch(workInProgress2);
            return isSuspenseInstanceFallback(current) ? workInProgress2.lanes = 32 : workInProgress2.lanes = 536870912, null;
          }
          return didSuspend = nextProps.children, nextProps = nextProps.fallback, showFallback ? (reuseSuspenseHandlerOnStack(), showFallback = workInProgress2.mode, didSuspend = mountWorkInProgressOffscreenFiber(
            { mode: "hidden", children: didSuspend },
            showFallback
          ), nextProps = createFiberFromFragment(
            nextProps,
            showFallback,
            renderLanes2,
            null
          ), didSuspend.return = workInProgress2, nextProps.return = workInProgress2, didSuspend.sibling = nextProps, workInProgress2.child = didSuspend, nextProps = workInProgress2.child, nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes2), nextProps.childLanes = getRemainingWorkInPrimaryTree(
            current,
            JSCompiler_temp,
            renderLanes2
          ), workInProgress2.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(null, nextProps)) : (pushPrimaryTreeSuspenseHandler(workInProgress2), mountSuspensePrimaryChildren(workInProgress2, didSuspend));
        }
        var prevState = current.memoizedState;
        if (prevState !== null) {
          var dehydrated$96 = prevState.dehydrated;
          if (dehydrated$96 !== null)
            return updateDehydratedSuspenseComponent(
              current,
              workInProgress2,
              didSuspend,
              JSCompiler_temp,
              nextProps,
              dehydrated$96,
              prevState,
              renderLanes2
            );
        }
        return showFallback ? (reuseSuspenseHandlerOnStack(), showFallback = nextProps.fallback, didSuspend = workInProgress2.mode, prevState = current.child, dehydrated$96 = prevState.sibling, nextProps = createWorkInProgress(prevState, {
          mode: "hidden",
          children: nextProps.children
        }), nextProps.subtreeFlags = prevState.subtreeFlags & 1206910976, dehydrated$96 !== null ? showFallback = createWorkInProgress(dehydrated$96, showFallback) : (showFallback = createFiberFromFragment(
          showFallback,
          didSuspend,
          renderLanes2,
          null
        ), showFallback.flags |= 2), showFallback.return = workInProgress2, nextProps.return = workInProgress2, nextProps.sibling = showFallback, workInProgress2.child = nextProps, bailoutOffscreenComponent(null, nextProps), nextProps = workInProgress2.child, showFallback = current.child.memoizedState, showFallback === null ? showFallback = mountSuspenseOffscreenState(renderLanes2) : (didSuspend = showFallback.cachePool, didSuspend !== null ? (prevState = CacheContext._currentValue, didSuspend = didSuspend.parent !== prevState ? { parent: prevState, pool: prevState } : didSuspend) : didSuspend = getSuspendedCache(), showFallback = {
          baseLanes: showFallback.baseLanes | renderLanes2,
          cachePool: didSuspend
        }), nextProps.memoizedState = showFallback, nextProps.childLanes = getRemainingWorkInPrimaryTree(
          current,
          JSCompiler_temp,
          renderLanes2
        ), workInProgress2.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(current.child, nextProps)) : (pushPrimaryTreeSuspenseHandler(workInProgress2), renderLanes2 = current.child, current = renderLanes2.sibling, renderLanes2 = createWorkInProgress(renderLanes2, {
          mode: "visible",
          children: nextProps.children
        }), renderLanes2.return = workInProgress2, renderLanes2.sibling = null, current !== null && (JSCompiler_temp = workInProgress2.deletions, JSCompiler_temp === null ? (workInProgress2.deletions = [current], workInProgress2.flags |= 16) : JSCompiler_temp.push(current)), workInProgress2.child = renderLanes2, workInProgress2.memoizedState = null, renderLanes2);
      }
      function mountSuspensePrimaryChildren(workInProgress2, primaryChildren) {
        return primaryChildren = mountWorkInProgressOffscreenFiber(
          { mode: "visible", children: primaryChildren },
          workInProgress2.mode
        ), primaryChildren.return = workInProgress2, workInProgress2.child = primaryChildren;
      }
      function mountWorkInProgressOffscreenFiber(offscreenProps, mode) {
        return offscreenProps = createFiberImplClass(22, offscreenProps, null, mode), offscreenProps.lanes = 0, offscreenProps;
      }
      function retrySuspenseComponentWithoutHydrating(current, workInProgress2, renderLanes2) {
        return reconcileChildFibers(workInProgress2, current.child, null, renderLanes2), current = mountSuspensePrimaryChildren(
          workInProgress2,
          workInProgress2.pendingProps.children
        ), current.flags |= 2, workInProgress2.memoizedState = null, current;
      }
      function updateDehydratedSuspenseComponent(current, workInProgress2, didSuspend, didPrimaryChildrenDefer, nextProps, suspenseInstance, suspenseState, renderLanes2) {
        if (didSuspend)
          return workInProgress2.flags & 256 ? (pushPrimaryTreeSuspenseHandler(workInProgress2), workInProgress2.flags &= -257, retrySuspenseComponentWithoutHydrating(
            current,
            workInProgress2,
            renderLanes2
          )) : workInProgress2.memoizedState !== null ? (reuseSuspenseHandlerOnStack(), workInProgress2.child = current.child, workInProgress2.flags |= 128, null) : (reuseSuspenseHandlerOnStack(), suspenseInstance = nextProps.fallback, suspenseState = workInProgress2.mode, nextProps = mountWorkInProgressOffscreenFiber(
            { mode: "visible", children: nextProps.children },
            suspenseState
          ), suspenseInstance = createFiberFromFragment(
            suspenseInstance,
            suspenseState,
            renderLanes2,
            null
          ), suspenseInstance.flags |= 2, nextProps.return = workInProgress2, suspenseInstance.return = workInProgress2, nextProps.sibling = suspenseInstance, workInProgress2.child = nextProps, reconcileChildFibers(workInProgress2, current.child, null, renderLanes2), nextProps = workInProgress2.child, nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes2), nextProps.childLanes = getRemainingWorkInPrimaryTree(
            current,
            didPrimaryChildrenDefer,
            renderLanes2
          ), workInProgress2.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(null, nextProps));
        if (pushPrimaryTreeSuspenseHandler(workInProgress2), isSuspenseInstanceFallback(suspenseInstance)) {
          if (didPrimaryChildrenDefer = suspenseInstance.nextSibling && suspenseInstance.nextSibling.dataset, didPrimaryChildrenDefer) var digest = didPrimaryChildrenDefer.dgst;
          return didPrimaryChildrenDefer = digest, didPrimaryChildrenDefer !== "" && (nextProps = Error(formatProdErrorMessage(419)), nextProps.stack = "", nextProps.digest = didPrimaryChildrenDefer, queueHydrationError({ value: nextProps, source: null, stack: null })), retrySuspenseComponentWithoutHydrating(
            current,
            workInProgress2,
            renderLanes2
          );
        }
        if (didReceiveUpdate || propagateParentContextChanges(current, workInProgress2, renderLanes2, !1), didPrimaryChildrenDefer = (renderLanes2 & current.childLanes) !== 0, didReceiveUpdate || didPrimaryChildrenDefer) {
          if (currentTreeHiddenStackCursor.current !== null)
            return retrySuspenseComponentWithoutHydrating(
              current,
              workInProgress2,
              renderLanes2
            );
          if (didPrimaryChildrenDefer = workInProgressRoot, didPrimaryChildrenDefer !== null && (nextProps = getBumpedLaneForHydration(
            didPrimaryChildrenDefer,
            renderLanes2
          ), nextProps !== 0 && nextProps !== suspenseState.retryLane))
            throw suspenseState.retryLane = nextProps, enqueueConcurrentRenderForLane(current, nextProps), scheduleUpdateOnFiber(didPrimaryChildrenDefer, current, nextProps), SelectiveHydrationException;
          return isSuspenseInstancePending(suspenseInstance) || renderDidSuspendDelayIfPossible(), retrySuspenseComponentWithoutHydrating(
            current,
            workInProgress2,
            renderLanes2
          );
        }
        return isSuspenseInstancePending(suspenseInstance) ? (workInProgress2.flags |= 192, workInProgress2.child = current.child, null) : (current = suspenseState.treeContext, nextHydratableInstance = getNextHydratable(suspenseInstance.nextSibling), hydrationParentFiber = workInProgress2, isHydrating = !0, hydrationErrors = null, rootOrSingletonContext = !1, current !== null && restoreSuspendedTreeContext(workInProgress2, current), workInProgress2 = mountSuspensePrimaryChildren(
          workInProgress2,
          nextProps.children
        ), workInProgress2.flags |= 134221824, workInProgress2);
      }
      function scheduleSuspenseWorkOnFiber(fiber, renderLanes2, propagationRoot) {
        fiber.lanes |= renderLanes2;
        var alternate = fiber.alternate;
        alternate !== null && (alternate.lanes |= renderLanes2), scheduleContextWorkOnParentPath(fiber.return, renderLanes2, propagationRoot);
      }
      function findLastContentRow(firstChild) {
        for (var lastContentRow = null; firstChild !== null; ) {
          var currentRow = firstChild.alternate;
          currentRow !== null && findFirstSuspended(currentRow) === null && (lastContentRow = firstChild), firstChild = firstChild.sibling;
        }
        return lastContentRow;
      }
      function initSuspenseListRenderState(workInProgress2, isBackwards, tail, lastContentRow, tailMode, treeForkCount2) {
        var renderState = workInProgress2.memoizedState;
        renderState === null ? workInProgress2.memoizedState = {
          isBackwards,
          rendering: null,
          renderingStartTime: 0,
          last: lastContentRow,
          tail,
          tailMode,
          treeForkCount: treeForkCount2
        } : (renderState.isBackwards = isBackwards, renderState.rendering = null, renderState.renderingStartTime = 0, renderState.last = lastContentRow, renderState.tail = tail, renderState.tailMode = tailMode, renderState.treeForkCount = treeForkCount2);
      }
      function reverseChildren(fiber) {
        var row = fiber.child;
        for (fiber.child = null; row !== null; ) {
          var nextRow = row.sibling;
          row.sibling = fiber.child, fiber.child = row, row = nextRow;
        }
      }
      function updateSuspenseListComponent(current, workInProgress2, renderLanes2) {
        var nextProps = workInProgress2.pendingProps, revealOrder = nextProps.revealOrder, tailMode = nextProps.tail;
        nextProps = nextProps.children;
        var suspenseContext = suspenseStackCursor.current;
        if (workInProgress2.flags & 128)
          return pushSuspenseListContext(workInProgress2, suspenseContext), null;
        var shouldForceFallback = (suspenseContext & 2) !== 0;
        if (shouldForceFallback ? (suspenseContext = suspenseContext & 1 | 2, workInProgress2.flags |= 128) : suspenseContext &= 1, pushSuspenseListContext(workInProgress2, suspenseContext), revealOrder === "backwards" && current !== null ? (reverseChildren(current), reconcileChildren(current, workInProgress2, nextProps, renderLanes2), reverseChildren(current)) : reconcileChildren(current, workInProgress2, nextProps, renderLanes2), nextProps = isHydrating ? treeForkCount : 0, !shouldForceFallback && current !== null && (current.flags & 128) !== 0)
          a: for (current = workInProgress2.child; current !== null; ) {
            if (current.tag === 13)
              current.memoizedState !== null && scheduleSuspenseWorkOnFiber(current, renderLanes2, workInProgress2);
            else if (current.tag === 19)
              scheduleSuspenseWorkOnFiber(current, renderLanes2, workInProgress2);
            else if (current.child !== null) {
              current.child.return = current, current = current.child;
              continue;
            }
            if (current === workInProgress2) break a;
            for (; current.sibling === null; ) {
              if (current.return === null || current.return === workInProgress2)
                break a;
              current = current.return;
            }
            current.sibling.return = current.return, current = current.sibling;
          }
        switch (revealOrder) {
          case "backwards":
            renderLanes2 = findLastContentRow(workInProgress2.child), renderLanes2 === null ? (revealOrder = workInProgress2.child, workInProgress2.child = null) : (revealOrder = renderLanes2.sibling, renderLanes2.sibling = null, reverseChildren(workInProgress2)), initSuspenseListRenderState(
              workInProgress2,
              !0,
              revealOrder,
              null,
              tailMode,
              nextProps
            );
            break;
          case "unstable_legacy-backwards":
            for (renderLanes2 = null, revealOrder = workInProgress2.child, workInProgress2.child = null; revealOrder !== null; ) {
              if (current = revealOrder.alternate, current !== null && findFirstSuspended(current) === null) {
                workInProgress2.child = revealOrder;
                break;
              }
              current = revealOrder.sibling, revealOrder.sibling = renderLanes2, renderLanes2 = revealOrder, revealOrder = current;
            }
            initSuspenseListRenderState(
              workInProgress2,
              !0,
              renderLanes2,
              null,
              tailMode,
              nextProps
            );
            break;
          case "together":
            initSuspenseListRenderState(
              workInProgress2,
              !1,
              null,
              null,
              void 0,
              nextProps
            );
            break;
          case "independent":
            workInProgress2.memoizedState = null;
            break;
          default:
            renderLanes2 = findLastContentRow(workInProgress2.child), renderLanes2 === null ? (revealOrder = workInProgress2.child, workInProgress2.child = null) : (revealOrder = renderLanes2.sibling, renderLanes2.sibling = null), initSuspenseListRenderState(
              workInProgress2,
              !1,
              revealOrder,
              renderLanes2,
              tailMode,
              nextProps
            );
        }
        return workInProgress2.child;
      }
      function updateContextProvider(current, workInProgress2, renderLanes2) {
        var newProps = workInProgress2.pendingProps;
        return pushProvider(workInProgress2, workInProgress2.type, newProps.value), reconcileChildren(current, workInProgress2, newProps.children, renderLanes2), workInProgress2.child;
      }
      function bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2) {
        if (current !== null && (workInProgress2.dependencies = current.dependencies), workInProgressRootSkippedLanes |= workInProgress2.lanes, (renderLanes2 & workInProgress2.childLanes) === 0)
          if (current !== null) {
            if (propagateParentContextChanges(
              current,
              workInProgress2,
              renderLanes2,
              !1
            ), (renderLanes2 & workInProgress2.childLanes) === 0)
              return null;
          } else return null;
        if (current !== null && workInProgress2.child !== current.child)
          throw Error(formatProdErrorMessage(153));
        if (workInProgress2.child !== null) {
          for (current = workInProgress2.child, renderLanes2 = createWorkInProgress(current, current.pendingProps), workInProgress2.child = renderLanes2, renderLanes2.return = workInProgress2; current.sibling !== null; )
            current = current.sibling, renderLanes2 = renderLanes2.sibling = createWorkInProgress(current, current.pendingProps), renderLanes2.return = workInProgress2;
          renderLanes2.sibling = null;
        }
        return workInProgress2.child;
      }
      function checkScheduledUpdateOrContext(current, renderLanes2) {
        return (current.lanes & renderLanes2) !== 0 ? !0 : (current = current.dependencies, !!(current !== null && checkIfContextChanged(current)));
      }
      function attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress2, renderLanes2) {
        switch (workInProgress2.tag) {
          case 3:
            pushHostContainer(workInProgress2, workInProgress2.stateNode.containerInfo), pushProvider(workInProgress2, CacheContext, current.memoizedState.cache), resetHydrationState();
            break;
          case 27:
          case 5:
            pushHostContext(workInProgress2);
            break;
          case 4:
            pushHostContainer(workInProgress2, workInProgress2.stateNode.containerInfo);
            break;
          case 10:
            pushProvider(
              workInProgress2,
              workInProgress2.type,
              workInProgress2.memoizedProps.value
            );
            break;
          case 31:
            if (workInProgress2.memoizedState !== null)
              return workInProgress2.flags |= 128, pushDehydratedActivitySuspenseHandler(workInProgress2), null;
            break;
          case 13:
            var state$108 = workInProgress2.memoizedState;
            if (state$108 !== null) {
              if (state$108.dehydrated !== null)
                return pushPrimaryTreeSuspenseHandler(workInProgress2), workInProgress2.flags |= 128, null;
              state$108 = propagateParentContextChanges(
                current,
                workInProgress2,
                renderLanes2,
                !1
              );
              var primaryChildLanes = workInProgress2.child.childLanes;
              return state$108 || (renderLanes2 & primaryChildLanes) !== 0 ? updateSuspenseComponent(current, workInProgress2, renderLanes2) : (pushPrimaryTreeSuspenseHandler(workInProgress2), current = bailoutOnAlreadyFinishedWork(
                current,
                workInProgress2,
                renderLanes2
              ), current !== null ? current.sibling : null);
            }
            pushPrimaryTreeSuspenseHandler(workInProgress2);
            break;
          case 19:
            if (workInProgress2.flags & 128)
              return updateSuspenseListComponent(
                current,
                workInProgress2,
                renderLanes2
              );
            if (primaryChildLanes = (current.flags & 128) !== 0, state$108 = (renderLanes2 & workInProgress2.childLanes) !== 0, state$108 || (propagateParentContextChanges(
              current,
              workInProgress2,
              renderLanes2,
              !1
            ), state$108 = (renderLanes2 & workInProgress2.childLanes) !== 0), primaryChildLanes) {
              if (state$108)
                return updateSuspenseListComponent(
                  current,
                  workInProgress2,
                  renderLanes2
                );
              workInProgress2.flags |= 128;
            }
            if (primaryChildLanes = workInProgress2.memoizedState, primaryChildLanes !== null && (primaryChildLanes.rendering = null, primaryChildLanes.tail = null, primaryChildLanes.lastEffect = null), pushSuspenseListContext(workInProgress2, suspenseStackCursor.current), state$108) break;
            return null;
          case 22:
            return workInProgress2.lanes = 0, updateOffscreenComponent(
              current,
              workInProgress2,
              renderLanes2,
              workInProgress2.pendingProps
            );
          case 24:
            pushProvider(workInProgress2, CacheContext, current.memoizedState.cache);
        }
        return bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
      }
      function beginWork(current, workInProgress2, renderLanes2) {
        if (current !== null)
          if (current.memoizedProps !== workInProgress2.pendingProps)
            didReceiveUpdate = !0;
          else {
            if (!checkScheduledUpdateOrContext(current, renderLanes2) && (workInProgress2.flags & 128) === 0)
              return didReceiveUpdate = !1, attemptEarlyBailoutIfNoScheduledUpdate(
                current,
                workInProgress2,
                renderLanes2
              );
            didReceiveUpdate = (current.flags & 131072) !== 0;
          }
        else
          didReceiveUpdate = !1, isHydrating && (workInProgress2.flags & 1048576) !== 0 && pushTreeId(workInProgress2, treeForkCount, workInProgress2.index);
        switch (workInProgress2.lanes = 0, workInProgress2.tag) {
          case 16:
            a: {
              var props = workInProgress2.pendingProps;
              if (current = resolveLazy(workInProgress2.elementType), workInProgress2.type = current, typeof current == "function")
                shouldConstruct(current) ? (props = resolveClassComponentProps(current, props), workInProgress2.tag = 1, workInProgress2 = updateClassComponent(
                  null,
                  workInProgress2,
                  current,
                  props,
                  renderLanes2
                )) : (workInProgress2.tag = 0, workInProgress2 = updateFunctionComponent(
                  null,
                  workInProgress2,
                  current,
                  props,
                  renderLanes2
                ));
              else {
                if (current != null) {
                  var $$typeof = current.$$typeof;
                  if ($$typeof === REACT_FORWARD_REF_TYPE) {
                    workInProgress2.tag = 11, workInProgress2 = updateForwardRef(
                      null,
                      workInProgress2,
                      current,
                      props,
                      renderLanes2
                    );
                    break a;
                  } else if ($$typeof === REACT_MEMO_TYPE) {
                    workInProgress2.tag = 14, workInProgress2 = updateMemoComponent(
                      null,
                      workInProgress2,
                      current,
                      props,
                      renderLanes2
                    );
                    break a;
                  } else if ($$typeof === REACT_CONTEXT_TYPE) {
                    workInProgress2.tag = 10, workInProgress2.type = current, workInProgress2 = updateContextProvider(
                      null,
                      workInProgress2,
                      renderLanes2
                    );
                    break a;
                  }
                }
                throw workInProgress2 = getComponentNameFromType(current) || current, Error(formatProdErrorMessage(306, workInProgress2, ""));
              }
            }
            return workInProgress2;
          case 0:
            return updateFunctionComponent(
              current,
              workInProgress2,
              workInProgress2.type,
              workInProgress2.pendingProps,
              renderLanes2
            );
          case 1:
            return props = workInProgress2.type, $$typeof = resolveClassComponentProps(
              props,
              workInProgress2.pendingProps
            ), updateClassComponent(
              current,
              workInProgress2,
              props,
              $$typeof,
              renderLanes2
            );
          case 3:
            a: {
              if (pushHostContainer(
                workInProgress2,
                workInProgress2.stateNode.containerInfo
              ), current === null) throw Error(formatProdErrorMessage(387));
              props = workInProgress2.pendingProps;
              var prevState = workInProgress2.memoizedState;
              $$typeof = prevState.element, cloneUpdateQueue(current, workInProgress2), processUpdateQueue(workInProgress2, props, null, renderLanes2);
              var nextState = workInProgress2.memoizedState;
              if (props = nextState.cache, pushProvider(workInProgress2, CacheContext, props), props !== prevState.cache && propagateContextChanges(
                workInProgress2,
                [CacheContext],
                renderLanes2,
                !0
              ), suspendIfUpdateReadFromEntangledAsyncAction(), props = nextState.element, prevState.isDehydrated)
                if (prevState = {
                  element: props,
                  isDehydrated: !1,
                  cache: nextState.cache
                }, workInProgress2.updateQueue.baseState = prevState, workInProgress2.memoizedState = prevState, workInProgress2.flags & 256) {
                  workInProgress2 = mountHostRootWithoutHydrating(
                    current,
                    workInProgress2,
                    props,
                    renderLanes2
                  );
                  break a;
                } else if (props !== $$typeof) {
                  $$typeof = createCapturedValueAtFiber(
                    Error(formatProdErrorMessage(424)),
                    workInProgress2
                  ), queueHydrationError($$typeof), workInProgress2 = mountHostRootWithoutHydrating(
                    current,
                    workInProgress2,
                    props,
                    renderLanes2
                  );
                  break a;
                } else
                  for (current = workInProgress2.stateNode.containerInfo, current.nodeType === 9 ? current = current.body : current = current.nodeName === "HTML" ? current.ownerDocument.body : current, nextHydratableInstance = getNextHydratable(current.firstChild), hydrationParentFiber = workInProgress2, isHydrating = !0, hydrationErrors = null, rootOrSingletonContext = !0, renderLanes2 = mountChildFibers(
                    workInProgress2,
                    null,
                    props,
                    renderLanes2
                  ), workInProgress2.child = renderLanes2; renderLanes2; )
                    renderLanes2.flags = renderLanes2.flags & -3 | 134221824, renderLanes2 = renderLanes2.sibling;
              else {
                if (resetHydrationState(), props === $$typeof) {
                  workInProgress2 = bailoutOnAlreadyFinishedWork(
                    current,
                    workInProgress2,
                    renderLanes2
                  );
                  break a;
                }
                reconcileChildren(current, workInProgress2, props, renderLanes2);
              }
              workInProgress2 = workInProgress2.child;
            }
            return workInProgress2;
          case 26:
            return markRef(current, workInProgress2), current === null ? (renderLanes2 = getResource(
              workInProgress2.type,
              null,
              workInProgress2.pendingProps,
              null
            )) ? workInProgress2.memoizedState = renderLanes2 : isHydrating || (workInProgress2.stateNode = createHoistableInstance(
              workInProgress2.type,
              workInProgress2.pendingProps,
              rootInstanceStackCursor.current,
              workInProgress2
            )) : workInProgress2.memoizedState = getResource(
              workInProgress2.type,
              current.memoizedProps,
              workInProgress2.pendingProps,
              current.memoizedState
            ), null;
          case 27:
            return pushHostContext(workInProgress2), current === null && isHydrating && (props = workInProgress2.stateNode = resolveSingletonInstance(
              workInProgress2.type,
              workInProgress2.pendingProps,
              rootInstanceStackCursor.current
            ), hydrationParentFiber = workInProgress2, rootOrSingletonContext = !0, $$typeof = nextHydratableInstance, isSingletonScope(workInProgress2.type) ? (previousHydratableOnEnteringScopedSingleton = $$typeof, nextHydratableInstance = getNextHydratable(props.firstChild)) : nextHydratableInstance = $$typeof), reconcileChildren(
              current,
              workInProgress2,
              workInProgress2.pendingProps.children,
              renderLanes2
            ), markRef(current, workInProgress2), current === null && (workInProgress2.flags |= 4194304), workInProgress2.child;
          case 5:
            return current === null && isHydrating && (($$typeof = props = nextHydratableInstance) && (props = canHydrateInstance(
              props,
              workInProgress2.type,
              workInProgress2.pendingProps,
              rootOrSingletonContext
            ), props !== null ? (workInProgress2.stateNode = props, hydrationParentFiber = workInProgress2, nextHydratableInstance = getNextHydratable(props.firstChild), rootOrSingletonContext = !1, $$typeof = !0) : $$typeof = !1), $$typeof || throwOnHydrationMismatch(workInProgress2)), pushHostContext(workInProgress2), $$typeof = workInProgress2.type, prevState = workInProgress2.pendingProps, nextState = current !== null ? current.memoizedProps : null, props = prevState.children, shouldSetTextContent($$typeof, prevState) ? props = null : nextState !== null && shouldSetTextContent($$typeof, nextState) && (workInProgress2.flags |= 32), workInProgress2.memoizedState !== null && ($$typeof = renderWithHooks(
              current,
              workInProgress2,
              TransitionAwareHostComponent,
              null,
              null,
              renderLanes2
            ), HostTransitionContext._currentValue = $$typeof), markRef(current, workInProgress2), reconcileChildren(current, workInProgress2, props, renderLanes2), workInProgress2.child;
          case 6:
            return current === null && isHydrating && ((current = renderLanes2 = nextHydratableInstance) && (renderLanes2 = canHydrateTextInstance(
              renderLanes2,
              workInProgress2.pendingProps,
              rootOrSingletonContext
            ), renderLanes2 !== null ? (workInProgress2.stateNode = renderLanes2, hydrationParentFiber = workInProgress2, nextHydratableInstance = null, current = !0) : current = !1), current || throwOnHydrationMismatch(workInProgress2)), null;
          case 13:
            return updateSuspenseComponent(current, workInProgress2, renderLanes2);
          case 4:
            return pushHostContainer(
              workInProgress2,
              workInProgress2.stateNode.containerInfo
            ), props = workInProgress2.pendingProps, current === null ? workInProgress2.child = reconcileChildFibers(
              workInProgress2,
              null,
              props,
              renderLanes2
            ) : reconcileChildren(current, workInProgress2, props, renderLanes2), workInProgress2.child;
          case 11:
            return updateForwardRef(
              current,
              workInProgress2,
              workInProgress2.type,
              workInProgress2.pendingProps,
              renderLanes2
            );
          case 7:
            return props = workInProgress2.pendingProps, markRef(current, workInProgress2), reconcileChildren(current, workInProgress2, props, renderLanes2), workInProgress2.child;
          case 8:
            return reconcileChildren(
              current,
              workInProgress2,
              workInProgress2.pendingProps.children,
              renderLanes2
            ), workInProgress2.child;
          case 12:
            return reconcileChildren(
              current,
              workInProgress2,
              workInProgress2.pendingProps.children,
              renderLanes2
            ), workInProgress2.child;
          case 10:
            return updateContextProvider(current, workInProgress2, renderLanes2);
          case 9:
            return $$typeof = workInProgress2.type._context, props = workInProgress2.pendingProps.children, prepareToReadContext(workInProgress2), $$typeof = readContext($$typeof), props = props($$typeof), workInProgress2.flags |= 1, reconcileChildren(current, workInProgress2, props, renderLanes2), workInProgress2.child;
          case 14:
            return updateMemoComponent(
              current,
              workInProgress2,
              workInProgress2.type,
              workInProgress2.pendingProps,
              renderLanes2
            );
          case 15:
            return updateSimpleMemoComponent(
              current,
              workInProgress2,
              workInProgress2.type,
              workInProgress2.pendingProps,
              renderLanes2
            );
          case 19:
            return updateSuspenseListComponent(current, workInProgress2, renderLanes2);
          case 31:
            return updateActivityComponent(current, workInProgress2, renderLanes2);
          case 22:
            return updateOffscreenComponent(
              current,
              workInProgress2,
              renderLanes2,
              workInProgress2.pendingProps
            );
          case 24:
            return prepareToReadContext(workInProgress2), props = readContext(CacheContext), current === null ? ($$typeof = peekCacheFromPool(), $$typeof === null && ($$typeof = workInProgressRoot, prevState = createCache(), $$typeof.pooledCache = prevState, prevState.refCount++, prevState !== null && ($$typeof.pooledCacheLanes |= renderLanes2), $$typeof = prevState), workInProgress2.memoizedState = { parent: props, cache: $$typeof }, initializeUpdateQueue(workInProgress2), pushProvider(workInProgress2, CacheContext, $$typeof)) : ((current.lanes & renderLanes2) !== 0 && (cloneUpdateQueue(current, workInProgress2), processUpdateQueue(workInProgress2, null, null, renderLanes2), suspendIfUpdateReadFromEntangledAsyncAction()), $$typeof = current.memoizedState, prevState = workInProgress2.memoizedState, $$typeof.parent !== props ? ($$typeof = { parent: props, cache: props }, workInProgress2.memoizedState = $$typeof, workInProgress2.lanes === 0 && (workInProgress2.memoizedState = workInProgress2.updateQueue.baseState = $$typeof), pushProvider(workInProgress2, CacheContext, props)) : (props = prevState.cache, pushProvider(workInProgress2, CacheContext, props), props !== $$typeof.cache && propagateContextChanges(
              workInProgress2,
              [CacheContext],
              renderLanes2,
              !0
            ))), reconcileChildren(
              current,
              workInProgress2,
              workInProgress2.pendingProps.children,
              renderLanes2
            ), workInProgress2.child;
          case 30:
            return workInProgress2.stateNode === null && (workInProgress2.stateNode = {
              autoName: null,
              paired: null,
              clones: null,
              ref: null
            }), props = workInProgress2.pendingProps, props.name != null && props.name !== "auto" ? workInProgress2.flags |= current === null ? 18882560 : 18874368 : isHydrating && pushMaterializedTreeId(workInProgress2), current !== null && current.memoizedProps.name !== props.name ? workInProgress2.flags |= 4194816 : markRef(current, workInProgress2), reconcileChildren(current, workInProgress2, props.children, renderLanes2), workInProgress2.child;
          case 29:
            throw workInProgress2.pendingProps;
        }
        throw Error(formatProdErrorMessage(156, workInProgress2.tag));
      }
      function markUpdate(workInProgress2) {
        workInProgress2.flags |= 4;
      }
      function preloadInstanceAndSuspendIfNeeded(workInProgress2, type, oldProps, newProps, renderLanes2) {
        var JSCompiler_temp;
        if ((JSCompiler_temp = (workInProgress2.mode & 32) !== 0) && (JSCompiler_temp = oldProps === null ? maySuspendCommit(type, newProps) : maySuspendCommit(type, newProps) && (newProps.src !== oldProps.src || newProps.srcSet !== oldProps.srcSet)), JSCompiler_temp) {
          if (workInProgress2.flags |= 16777216, (renderLanes2 & 335544128) === renderLanes2)
            if (workInProgress2.stateNode.complete) workInProgress2.flags |= 8192;
            else if (shouldRemainOnPreviousScreen()) workInProgress2.flags |= 8192;
            else
              throw suspendedThenable = noopSuspenseyCommitThenable, SuspenseyCommitException;
        } else workInProgress2.flags &= -16777217;
      }
      function preloadResourceAndSuspendIfNeeded(workInProgress2, resource) {
        if (resource.type !== "stylesheet" || (resource.state.loading & 4) !== 0)
          workInProgress2.flags &= -16777217;
        else if (workInProgress2.flags |= 16777216, !preloadResource(resource))
          if (shouldRemainOnPreviousScreen()) workInProgress2.flags |= 8192;
          else
            throw suspendedThenable = noopSuspenseyCommitThenable, SuspenseyCommitException;
      }
      function scheduleRetryEffect(workInProgress2, retryQueue) {
        retryQueue !== null && (workInProgress2.flags |= 4), workInProgress2.flags & 16384 && (retryQueue = workInProgress2.tag !== 22 ? claimNextRetryLane() : 536870912, workInProgress2.lanes |= retryQueue, workInProgressSuspendedRetryLanes |= retryQueue);
      }
      function cutOffTailIfNeeded(renderState, hasRenderedATailFallback) {
        if (!isHydrating)
          switch (renderState.tailMode) {
            case "visible":
              break;
            case "collapsed":
              for (var tailNode = renderState.tail, lastTailNode = null; tailNode !== null; )
                tailNode.alternate !== null && (lastTailNode = tailNode), tailNode = tailNode.sibling;
              lastTailNode === null ? hasRenderedATailFallback || renderState.tail === null ? renderState.tail = null : renderState.tail.sibling = null : lastTailNode.sibling = null;
              break;
            default:
              for (hasRenderedATailFallback = renderState.tail, tailNode = null; hasRenderedATailFallback !== null; )
                hasRenderedATailFallback.alternate !== null && (tailNode = hasRenderedATailFallback), hasRenderedATailFallback = hasRenderedATailFallback.sibling;
              tailNode === null ? renderState.tail = null : tailNode.sibling = null;
          }
      }
      function bubbleProperties(completedWork) {
        var didBailout = completedWork.alternate !== null && completedWork.alternate.child === completedWork.child, newChildLanes = 0, subtreeFlags = 0;
        if (didBailout)
          for (var child$113 = completedWork.child; child$113 !== null; )
            newChildLanes |= child$113.lanes | child$113.childLanes, subtreeFlags |= child$113.subtreeFlags & 1206910976, subtreeFlags |= child$113.flags & 1206910976, child$113.return = completedWork, child$113 = child$113.sibling;
        else
          for (child$113 = completedWork.child; child$113 !== null; )
            newChildLanes |= child$113.lanes | child$113.childLanes, subtreeFlags |= child$113.subtreeFlags, subtreeFlags |= child$113.flags, child$113.return = completedWork, child$113 = child$113.sibling;
        return completedWork.subtreeFlags |= subtreeFlags, completedWork.childLanes = newChildLanes, didBailout;
      }
      function completeWork(current, workInProgress2, renderLanes2) {
        var newProps = workInProgress2.pendingProps;
        switch (popTreeContext(workInProgress2), workInProgress2.tag) {
          case 16:
          case 15:
          case 0:
          case 11:
          case 7:
          case 8:
          case 12:
          case 9:
          case 14:
            return bubbleProperties(workInProgress2), null;
          case 1:
            return bubbleProperties(workInProgress2), null;
          case 3:
            return renderLanes2 = workInProgress2.stateNode, newProps = null, current !== null && (newProps = current.memoizedState.cache), workInProgress2.memoizedState.cache !== newProps && (workInProgress2.flags |= 2048), popProvider(CacheContext), popHostContainer(), renderLanes2.pendingContext && (renderLanes2.context = renderLanes2.pendingContext, renderLanes2.pendingContext = null), (current === null || current.child === null) && (popHydrationState(workInProgress2) ? markUpdate(workInProgress2) : current === null || current.memoizedState.isDehydrated && (workInProgress2.flags & 256) === 0 || (workInProgress2.flags |= 1024, upgradeHydrationErrorsToRecoverable())), bubbleProperties(workInProgress2), null;
          case 26:
            var type = workInProgress2.type, nextResource = workInProgress2.memoizedState;
            return current === null ? (markUpdate(workInProgress2), nextResource !== null ? (bubbleProperties(workInProgress2), preloadResourceAndSuspendIfNeeded(workInProgress2, nextResource)) : (bubbleProperties(workInProgress2), preloadInstanceAndSuspendIfNeeded(
              workInProgress2,
              type,
              null,
              newProps,
              renderLanes2
            ))) : nextResource ? nextResource !== current.memoizedState ? (markUpdate(workInProgress2), bubbleProperties(workInProgress2), preloadResourceAndSuspendIfNeeded(workInProgress2, nextResource)) : (bubbleProperties(workInProgress2), workInProgress2.flags &= -16777217) : (current = current.memoizedProps, current !== newProps && markUpdate(workInProgress2), bubbleProperties(workInProgress2), preloadInstanceAndSuspendIfNeeded(
              workInProgress2,
              type,
              current,
              newProps,
              renderLanes2
            )), null;
          case 27:
            if (popHostContext(workInProgress2), renderLanes2 = rootInstanceStackCursor.current, type = workInProgress2.type, current !== null && workInProgress2.stateNode != null)
              current.memoizedProps !== newProps && markUpdate(workInProgress2);
            else {
              if (!newProps) {
                if (workInProgress2.stateNode === null)
                  throw Error(formatProdErrorMessage(166));
                return bubbleProperties(workInProgress2), workInProgress2.subtreeFlags &= -33554433, null;
              }
              current = contextStackCursor.current, popHydrationState(workInProgress2) ? prepareToHydrateHostInstance(workInProgress2, current) : (current = resolveSingletonInstance(type, newProps, renderLanes2), workInProgress2.stateNode = current, markUpdate(workInProgress2));
            }
            return bubbleProperties(workInProgress2), workInProgress2.subtreeFlags &= -33554433, null;
          case 5:
            if (popHostContext(workInProgress2), type = workInProgress2.type, current !== null && workInProgress2.stateNode != null)
              current.memoizedProps !== newProps && markUpdate(workInProgress2);
            else {
              if (!newProps) {
                if (workInProgress2.stateNode === null)
                  throw Error(formatProdErrorMessage(166));
                return bubbleProperties(workInProgress2), workInProgress2.subtreeFlags &= -33554433, null;
              }
              if (nextResource = contextStackCursor.current, popHydrationState(workInProgress2))
                prepareToHydrateHostInstance(workInProgress2, nextResource);
              else {
                var ownerDocument = getOwnerDocumentFromRootContainer(
                  rootInstanceStackCursor.current
                );
                switch (nextResource) {
                  case 1:
                    nextResource = ownerDocument.createElementNS(
                      "http://www.w3.org/2000/svg",
                      type
                    );
                    break;
                  case 2:
                    nextResource = ownerDocument.createElementNS(
                      "http://www.w3.org/1998/Math/MathML",
                      type
                    );
                    break;
                  default:
                    switch (type) {
                      case "svg":
                        nextResource = ownerDocument.createElementNS(
                          "http://www.w3.org/2000/svg",
                          type
                        );
                        break;
                      case "math":
                        nextResource = ownerDocument.createElementNS(
                          "http://www.w3.org/1998/Math/MathML",
                          type
                        );
                        break;
                      case "script":
                        nextResource = ownerDocument.createElement("div"), nextResource.innerHTML = "<script><\/script>", nextResource = nextResource.removeChild(
                          nextResource.firstChild
                        );
                        break;
                      case "select":
                        nextResource = typeof newProps.is == "string" ? ownerDocument.createElement("select", {
                          is: newProps.is
                        }) : ownerDocument.createElement("select"), newProps.multiple ? nextResource.multiple = !0 : newProps.size && (nextResource.size = newProps.size);
                        break;
                      default:
                        nextResource = typeof newProps.is == "string" ? ownerDocument.createElement(type, { is: newProps.is }) : ownerDocument.createElement(type);
                    }
                }
                nextResource[internalInstanceKey] = workInProgress2, nextResource[internalPropsKey] = newProps;
                a: for (ownerDocument = workInProgress2.child; ownerDocument !== null; ) {
                  if (ownerDocument.tag === 5 || ownerDocument.tag === 6)
                    nextResource.appendChild(ownerDocument.stateNode);
                  else if (ownerDocument.tag !== 4 && ownerDocument.tag !== 27 && ownerDocument.child !== null) {
                    ownerDocument.child.return = ownerDocument, ownerDocument = ownerDocument.child;
                    continue;
                  }
                  if (ownerDocument === workInProgress2) break a;
                  for (; ownerDocument.sibling === null; ) {
                    if (ownerDocument.return === null || ownerDocument.return === workInProgress2)
                      break a;
                    ownerDocument = ownerDocument.return;
                  }
                  ownerDocument.sibling.return = ownerDocument.return, ownerDocument = ownerDocument.sibling;
                }
                workInProgress2.stateNode = nextResource;
                a: switch (setInitialProperties(nextResource, type, newProps), type) {
                  case "button":
                  case "input":
                  case "select":
                  case "textarea":
                    newProps = !!newProps.autoFocus;
                    break a;
                  case "img":
                    newProps = !0;
                    break a;
                  default:
                    newProps = !1;
                }
                newProps && markUpdate(workInProgress2);
              }
            }
            return bubbleProperties(workInProgress2), workInProgress2.subtreeFlags &= -33554433, preloadInstanceAndSuspendIfNeeded(
              workInProgress2,
              workInProgress2.type,
              current === null ? null : current.memoizedProps,
              workInProgress2.pendingProps,
              renderLanes2
            ), null;
          case 6:
            if (current && workInProgress2.stateNode != null)
              current.memoizedProps !== newProps && markUpdate(workInProgress2);
            else {
              if (typeof newProps != "string" && workInProgress2.stateNode === null)
                throw Error(formatProdErrorMessage(166));
              if (current = rootInstanceStackCursor.current, popHydrationState(workInProgress2)) {
                if (current = workInProgress2.stateNode, renderLanes2 = workInProgress2.memoizedProps, newProps = null, type = hydrationParentFiber, type !== null)
                  switch (type.tag) {
                    case 27:
                    case 5:
                      newProps = type.memoizedProps;
                  }
                current[internalInstanceKey] = workInProgress2, current = !!(current.nodeValue === renderLanes2 || newProps !== null && newProps.suppressHydrationWarning === !0 || checkForUnmatchedText(current.nodeValue, renderLanes2)), current || throwOnHydrationMismatch(workInProgress2, !0);
              } else
                current = getOwnerDocumentFromRootContainer(current).createTextNode(
                  newProps
                ), current[internalInstanceKey] = workInProgress2, workInProgress2.stateNode = current;
            }
            return bubbleProperties(workInProgress2), null;
          case 31:
            if (renderLanes2 = workInProgress2.memoizedState, current === null || current.memoizedState !== null) {
              if (newProps = popHydrationState(workInProgress2), renderLanes2 !== null) {
                if (current === null) {
                  if (!newProps) throw Error(formatProdErrorMessage(318));
                  if (current = workInProgress2.memoizedState, current = current !== null ? current.dehydrated : null, !current) throw Error(formatProdErrorMessage(557));
                  current[internalInstanceKey] = workInProgress2;
                } else
                  resetHydrationState(), (workInProgress2.flags & 128) === 0 && (workInProgress2.memoizedState = null), workInProgress2.flags |= 4;
                bubbleProperties(workInProgress2), current = !1;
              } else
                renderLanes2 = upgradeHydrationErrorsToRecoverable(), current !== null && current.memoizedState !== null && (current.memoizedState.hydrationErrors = renderLanes2), current = !0;
              if (!current)
                return workInProgress2.flags & 256 ? (popSuspenseHandler(workInProgress2), workInProgress2) : (popSuspenseHandler(workInProgress2), null);
              if ((workInProgress2.flags & 128) !== 0)
                throw Error(formatProdErrorMessage(558));
            }
            return bubbleProperties(workInProgress2), null;
          case 13:
            if (newProps = workInProgress2.memoizedState, current === null || current.memoizedState !== null && current.memoizedState.dehydrated !== null) {
              if (type = popHydrationState(workInProgress2), newProps !== null && newProps.dehydrated !== null) {
                if (current === null) {
                  if (!type) throw Error(formatProdErrorMessage(318));
                  if (type = workInProgress2.memoizedState, type = type !== null ? type.dehydrated : null, !type) throw Error(formatProdErrorMessage(317));
                  type[internalInstanceKey] = workInProgress2;
                } else
                  resetHydrationState(), (workInProgress2.flags & 128) === 0 && (workInProgress2.memoizedState = null), workInProgress2.flags |= 4;
                bubbleProperties(workInProgress2), type = !1;
              } else
                type = upgradeHydrationErrorsToRecoverable(), current !== null && current.memoizedState !== null && (current.memoizedState.hydrationErrors = type), type = !0;
              if (!type)
                return workInProgress2.flags & 256 ? (popSuspenseHandler(workInProgress2), workInProgress2) : (popSuspenseHandler(workInProgress2), null);
            }
            return popSuspenseHandler(workInProgress2), (workInProgress2.flags & 128) !== 0 ? (workInProgress2.lanes = renderLanes2, workInProgress2) : (renderLanes2 = newProps !== null, current = current !== null && current.memoizedState !== null, renderLanes2 && (newProps = workInProgress2.child, type = null, newProps.alternate !== null && newProps.alternate.memoizedState !== null && newProps.alternate.memoizedState.cachePool !== null && (type = newProps.alternate.memoizedState.cachePool.pool), nextResource = null, newProps.memoizedState !== null && newProps.memoizedState.cachePool !== null && (nextResource = newProps.memoizedState.cachePool.pool), nextResource !== type && (newProps.flags |= 2048)), renderLanes2 !== current && renderLanes2 && (workInProgress2.child.flags |= 8192), scheduleRetryEffect(workInProgress2, workInProgress2.updateQueue), bubbleProperties(workInProgress2), null);
          case 4:
            return popHostContainer(), current === null && listenToAllSupportedEvents(workInProgress2.stateNode.containerInfo), workInProgress2.flags |= 67108864, bubbleProperties(workInProgress2), null;
          case 10:
            return popProvider(workInProgress2.type), bubbleProperties(workInProgress2), null;
          case 19:
            if (popSuspenseListContext(workInProgress2), newProps = workInProgress2.memoizedState, newProps === null) return bubbleProperties(workInProgress2), null;
            if (type = (workInProgress2.flags & 128) !== 0, nextResource = newProps.rendering, nextResource === null)
              if (type) cutOffTailIfNeeded(newProps, !1);
              else {
                if (workInProgressRootExitStatus !== 0 || current !== null && (current.flags & 128) !== 0)
                  for (current = workInProgress2.child; current !== null; ) {
                    if (nextResource = findFirstSuspended(current), nextResource !== null) {
                      for (workInProgress2.flags |= 128, cutOffTailIfNeeded(newProps, !1), current = nextResource.updateQueue, workInProgress2.updateQueue = current, scheduleRetryEffect(workInProgress2, current), workInProgress2.subtreeFlags = 0, current = renderLanes2, renderLanes2 = workInProgress2.child; renderLanes2 !== null; )
                        resetWorkInProgress(renderLanes2, current), renderLanes2 = renderLanes2.sibling;
                      return pushSuspenseListContext(
                        workInProgress2,
                        suspenseStackCursor.current & 1 | 2
                      ), isHydrating && pushTreeFork(workInProgress2, newProps.treeForkCount), workInProgress2.child;
                    }
                    current = current.sibling;
                  }
                newProps.tail !== null && now() > workInProgressRootRenderTargetTime && (workInProgress2.flags |= 128, type = !0, cutOffTailIfNeeded(newProps, !1), workInProgress2.lanes = 4194304);
              }
            else {
              if (!type)
                if (current = findFirstSuspended(nextResource), current !== null) {
                  if (workInProgress2.flags |= 128, type = !0, current = current.updateQueue, workInProgress2.updateQueue = current, scheduleRetryEffect(workInProgress2, current), cutOffTailIfNeeded(newProps, !0), newProps.tail === null && newProps.tailMode !== "collapsed" && newProps.tailMode !== "visible" && !nextResource.alternate && !isHydrating)
                    return bubbleProperties(workInProgress2), null;
                } else
                  2 * now() - newProps.renderingStartTime > workInProgressRootRenderTargetTime && renderLanes2 !== 536870912 && (workInProgress2.flags |= 128, type = !0, cutOffTailIfNeeded(newProps, !1), workInProgress2.lanes = 4194304);
              newProps.isBackwards ? (nextResource.sibling = workInProgress2.child, workInProgress2.child = nextResource) : (current = newProps.last, current !== null ? current.sibling = nextResource : workInProgress2.child = nextResource, newProps.last = nextResource);
            }
            if (newProps.tail !== null) {
              current = newProps.tail;
              a: {
                for (renderLanes2 = current; renderLanes2 !== null; ) {
                  if (renderLanes2.alternate !== null) {
                    renderLanes2 = !1;
                    break a;
                  }
                  renderLanes2 = renderLanes2.sibling;
                }
                renderLanes2 = !0;
              }
              return newProps.rendering = current, newProps.tail = current.sibling, newProps.renderingStartTime = now(), current.sibling = null, nextResource = suspenseStackCursor.current, nextResource = type ? nextResource & 1 | 2 : nextResource & 1, newProps.tailMode === "visible" || newProps.tailMode === "collapsed" || !renderLanes2 || isHydrating ? pushSuspenseListContext(workInProgress2, nextResource) : (renderLanes2 = nextResource, push(suspenseHandlerStackCursor, workInProgress2), push(suspenseStackCursor, renderLanes2), shellBoundary === null && (shellBoundary = workInProgress2)), isHydrating && pushTreeFork(workInProgress2, newProps.treeForkCount), current;
            }
            return bubbleProperties(workInProgress2), null;
          case 22:
          case 23:
            return popSuspenseHandler(workInProgress2), popHiddenContext(), newProps = workInProgress2.memoizedState !== null, current !== null ? current.memoizedState !== null !== newProps && (workInProgress2.flags |= 8192) : newProps && (workInProgress2.flags |= 8192), newProps ? (renderLanes2 & 536870912) !== 0 && (workInProgress2.flags & 128) === 0 && (bubbleProperties(workInProgress2), workInProgress2.subtreeFlags & 6 && (workInProgress2.flags |= 8192)) : bubbleProperties(workInProgress2), renderLanes2 = workInProgress2.updateQueue, renderLanes2 !== null && scheduleRetryEffect(workInProgress2, renderLanes2.retryQueue), renderLanes2 = null, current !== null && current.memoizedState !== null && current.memoizedState.cachePool !== null && (renderLanes2 = current.memoizedState.cachePool.pool), newProps = null, workInProgress2.memoizedState !== null && workInProgress2.memoizedState.cachePool !== null && (newProps = workInProgress2.memoizedState.cachePool.pool), newProps !== renderLanes2 && (workInProgress2.flags |= 2048), current !== null && pop(resumedCache), null;
          case 24:
            return renderLanes2 = null, current !== null && (renderLanes2 = current.memoizedState.cache), workInProgress2.memoizedState.cache !== renderLanes2 && (workInProgress2.flags |= 2048), popProvider(CacheContext), bubbleProperties(workInProgress2), null;
          case 25:
            return null;
          case 30:
            return workInProgress2.flags |= 33554432, bubbleProperties(workInProgress2), null;
        }
        throw Error(formatProdErrorMessage(156, workInProgress2.tag));
      }
      function unwindWork(current, workInProgress2) {
        switch (popTreeContext(workInProgress2), workInProgress2.tag) {
          case 1:
            return current = workInProgress2.flags, current & 65536 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
          case 3:
            return popProvider(CacheContext), popHostContainer(), current = workInProgress2.flags, (current & 65536) !== 0 && (current & 128) === 0 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
          case 26:
          case 27:
          case 5:
            return popHostContext(workInProgress2), null;
          case 31:
            if (workInProgress2.memoizedState !== null) {
              if (popSuspenseHandler(workInProgress2), workInProgress2.alternate === null)
                throw Error(formatProdErrorMessage(340));
              resetHydrationState();
            }
            return current = workInProgress2.flags, current & 65536 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
          case 13:
            if (popSuspenseHandler(workInProgress2), current = workInProgress2.memoizedState, current !== null && current.dehydrated !== null) {
              if (workInProgress2.alternate === null)
                throw Error(formatProdErrorMessage(340));
              resetHydrationState();
            }
            return current = workInProgress2.flags, current & 65536 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
          case 19:
            return popSuspenseListContext(workInProgress2), current = workInProgress2.flags, current & 65536 ? (workInProgress2.flags = current & -65537 | 128, current = workInProgress2.memoizedState, current !== null && (current.rendering = null, current.tail = null), workInProgress2.flags |= 4, workInProgress2) : null;
          case 4:
            return popHostContainer(), null;
          case 10:
            return popProvider(workInProgress2.type), null;
          case 22:
          case 23:
            return popSuspenseHandler(workInProgress2), popHiddenContext(), current !== null && pop(resumedCache), current = workInProgress2.flags, current & 65536 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
          case 24:
            return popProvider(CacheContext), null;
          case 25:
            return null;
          default:
            return null;
        }
      }
      function unwindInterruptedWork(current, interruptedWork) {
        switch (popTreeContext(interruptedWork), interruptedWork.tag) {
          case 3:
            popProvider(CacheContext), popHostContainer();
            break;
          case 26:
          case 27:
          case 5:
            popHostContext(interruptedWork);
            break;
          case 4:
            popHostContainer();
            break;
          case 31:
            interruptedWork.memoizedState !== null && popSuspenseHandler(interruptedWork);
            break;
          case 13:
            popSuspenseHandler(interruptedWork);
            break;
          case 19:
            popSuspenseListContext(interruptedWork);
            break;
          case 10:
            popProvider(interruptedWork.type);
            break;
          case 22:
          case 23:
            popSuspenseHandler(interruptedWork), popHiddenContext(), current !== null && pop(resumedCache);
            break;
          case 24:
            popProvider(CacheContext);
        }
      }