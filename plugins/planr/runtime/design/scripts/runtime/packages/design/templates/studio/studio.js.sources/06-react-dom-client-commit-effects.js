
      function commitHookEffectListMount(flags, finishedWork) {
        try {
          var updateQueue = finishedWork.updateQueue, lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
          if (lastEffect !== null) {
            var firstEffect = lastEffect.next;
            updateQueue = firstEffect;
            do {
              if ((updateQueue.tag & flags) === flags) {
                lastEffect = void 0;
                var create = updateQueue.create, inst = updateQueue.inst;
                lastEffect = create(), inst.destroy = lastEffect;
              }
              updateQueue = updateQueue.next;
            } while (updateQueue !== firstEffect);
          }
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      function commitHookEffectListUnmount(flags, finishedWork, nearestMountedAncestor$jscomp$0) {
        try {
          var updateQueue = finishedWork.updateQueue, lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
          if (lastEffect !== null) {
            var firstEffect = lastEffect.next;
            updateQueue = firstEffect;
            do {
              if ((updateQueue.tag & flags) === flags) {
                var inst = updateQueue.inst, destroy = inst.destroy;
                if (destroy !== void 0) {
                  inst.destroy = void 0, lastEffect = finishedWork;
                  var nearestMountedAncestor = nearestMountedAncestor$jscomp$0, destroy_ = destroy;
                  try {
                    destroy_();
                  } catch (error) {
                    captureCommitPhaseError(
                      lastEffect,
                      nearestMountedAncestor,
                      error
                    );
                  }
                }
              }
              updateQueue = updateQueue.next;
            } while (updateQueue !== firstEffect);
          }
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      function commitClassCallbacks(finishedWork) {
        var updateQueue = finishedWork.updateQueue;
        if (updateQueue !== null) {
          var instance = finishedWork.stateNode;
          try {
            commitCallbacks(updateQueue, instance);
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
      }
      function safelyCallComponentWillUnmount(current, nearestMountedAncestor, instance) {
        instance.props = resolveClassComponentProps(
          current.type,
          current.memoizedProps
        ), instance.state = current.memoizedState;
        try {
          instance.componentWillUnmount();
        } catch (error) {
          captureCommitPhaseError(current, nearestMountedAncestor, error);
        }
      }
      function safelyAttachRef(current, nearestMountedAncestor) {
        try {
          var ref = current.ref;
          if (ref !== null) {
            switch (current.tag) {
              case 26:
              case 27:
              case 5:
                var instanceToUse = current.stateNode;
                break;
              case 30:
                var instance = current.stateNode, name = getViewTransitionName(current.memoizedProps, instance);
                (instance.ref === null || instance.ref.name !== name) && (instance.ref = createViewTransitionInstance(name)), instanceToUse = instance.ref;
                break;
              case 7:
                if (current.stateNode === null) {
                  var fragmentInstance = new FragmentInstance(current);
                  traverseVisibleInstancesAndTextInstances(
                    current.child,
                    !1,
                    addFragmentHandleToFiber,
                    fragmentInstance,
                    void 0,
                    void 0
                  ), current.stateNode = fragmentInstance;
                }
                instanceToUse = current.stateNode;
                break;
              default:
                instanceToUse = current.stateNode;
            }
            typeof ref == "function" ? current.refCleanup = ref(instanceToUse) : ref.current = instanceToUse;
          }
        } catch (error) {
          captureCommitPhaseError(current, nearestMountedAncestor, error);
        }
      }
      function safelyDetachRef(current, nearestMountedAncestor) {
        var ref = current.ref, refCleanup = current.refCleanup;
        if (ref !== null)
          if (typeof refCleanup == "function")
            try {
              refCleanup();
            } catch (error) {
              captureCommitPhaseError(current, nearestMountedAncestor, error);
            } finally {
              current.refCleanup = null, current = current.alternate, current != null && (current.refCleanup = null);
            }
          else if (typeof ref == "function")
            try {
              ref(null);
            } catch (error$148) {
              captureCommitPhaseError(current, nearestMountedAncestor, error$148);
            }
          else ref.current = null;
      }
      function commitNewChildToFragmentInstances(fiber, parentFragmentInstances) {
        if ((fiber.tag === 5 || fiber.tag === 27 || fiber.tag === 6) && fiber.alternate === null && parentFragmentInstances !== null)
          for (var i = 0; i < parentFragmentInstances.length; i++)
            commitNewChildToFragmentInstance(
              fiber.stateNode,
              parentFragmentInstances[i]
            );
      }
      function commitFragmentInstanceInsertionEffects(fiber) {
        for (var parent2 = fiber.return; parent2 !== null && (isFragmentInstanceParent(parent2) && commitNewChildToFragmentInstance(fiber.stateNode, parent2.stateNode), !isFragmentInstanceHostBoundary(parent2)); )
          parent2 = parent2.return;
      }
      function commitFragmentInstanceDeletionEffects(fiber) {
        for (var parent2 = fiber.return; parent2 !== null && (isFragmentInstanceParent(parent2) && deleteChildFromFragmentInstance(fiber.stateNode, parent2.stateNode), !isFragmentInstanceHostBoundary(parent2)); )
          parent2 = parent2.return;
      }
      function isFragmentInstanceHostBoundary(fiber) {
        return fiber.tag === 5 || fiber.tag === 3 || fiber.tag === 27;
      }
      function isFragmentInstanceParent(fiber) {
        return fiber && fiber.tag === 7 && fiber.stateNode !== null;
      }
      function commitHostMount(finishedWork) {
        var type = finishedWork.type, props = finishedWork.memoizedProps, instance = finishedWork.stateNode;
        try {
          a: switch (type) {
            case "button":
            case "input":
            case "select":
            case "textarea":
              props.autoFocus && instance.focus();
              break a;
            case "img":
              props.src ? instance.src = props.src : props.srcSet && (instance.srcset = props.srcSet);
          }
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      function commitHostUpdate(finishedWork, newProps, oldProps) {
        try {
          var domElement = finishedWork.stateNode;
          updateProperties(domElement, finishedWork.type, oldProps, newProps), domElement[internalPropsKey] = newProps;
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      function isHostParent(fiber) {
        return fiber.tag === 5 || fiber.tag === 3 || fiber.tag === 26 || fiber.tag === 27 && isSingletonScope(fiber.type) || fiber.tag === 4;
      }
      function getHostSibling(fiber) {
        a: for (; ; ) {
          for (; fiber.sibling === null; ) {
            if (fiber.return === null || isHostParent(fiber.return)) return null;
            fiber = fiber.return;
          }
          for (fiber.sibling.return = fiber.return, fiber = fiber.sibling; fiber.tag !== 5 && fiber.tag !== 6 && fiber.tag !== 18; ) {
            if (fiber.tag === 27 && isSingletonScope(fiber.type) || fiber.flags & 2 || fiber.child === null || fiber.tag === 4) continue a;
            fiber.child.return = fiber, fiber = fiber.child;
          }
          if (!(fiber.flags & 2)) return fiber.stateNode;
        }
      }
      function insertOrAppendPlacementNodeIntoContainer(node, before, parent2, parentFragmentInstances) {
        var tag = node.tag;
        if (tag === 5 || tag === 6)
          tag = node.stateNode, before ? (parent2.nodeType === 9 ? parent2.body : parent2.nodeName === "HTML" ? parent2.ownerDocument.body : parent2).insertBefore(tag, before) : (before = parent2.nodeType === 9 ? parent2.body : parent2.nodeName === "HTML" ? parent2.ownerDocument.body : parent2, before.appendChild(tag), parent2 = parent2._reactRootContainer, parent2 != null || before.onclick !== null || (before.onclick = noop$1)), commitNewChildToFragmentInstances(node, parentFragmentInstances), viewTransitionMutationContext = !0;
        else if (tag !== 4 && (tag === 27 && (commitNewChildToFragmentInstances(node, parentFragmentInstances), parentFragmentInstances = null, isSingletonScope(node.type) && (parent2 = node.stateNode, before = null)), node = node.child, node !== null))
          for (insertOrAppendPlacementNodeIntoContainer(
            node,
            before,
            parent2,
            parentFragmentInstances
          ), node = node.sibling; node !== null; )
            insertOrAppendPlacementNodeIntoContainer(
              node,
              before,
              parent2,
              parentFragmentInstances
            ), node = node.sibling;
      }
      function insertOrAppendPlacementNode(node, before, parent2, parentFragmentInstances) {
        var tag = node.tag;
        if (tag === 5 || tag === 6)
          tag = node.stateNode, before ? parent2.insertBefore(tag, before) : parent2.appendChild(tag), commitNewChildToFragmentInstances(node, parentFragmentInstances), viewTransitionMutationContext = !0;
        else if (tag !== 4 && (tag === 27 && (commitNewChildToFragmentInstances(node, parentFragmentInstances), parentFragmentInstances = null, isSingletonScope(node.type) && (parent2 = node.stateNode)), node = node.child, node !== null))
          for (insertOrAppendPlacementNode(
            node,
            before,
            parent2,
            parentFragmentInstances
          ), node = node.sibling; node !== null; )
            insertOrAppendPlacementNode(
              node,
              before,
              parent2,
              parentFragmentInstances
            ), node = node.sibling;
      }
      function commitHostSingletonAcquisition(finishedWork) {
        var singleton = finishedWork.stateNode, props = finishedWork.memoizedProps;
        try {
          for (var type = finishedWork.type, attributes = singleton.attributes; attributes.length; )
            singleton.removeAttributeNode(attributes[0]);
          setInitialProperties(singleton, type, props), singleton[internalInstanceKey] = finishedWork, singleton[internalPropsKey] = props;
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      var shouldStartViewTransition = !1, appearingViewTransitions = null;
      function trackEnterViewTransitions(placement) {
        (placement.tag === 30 || (placement.subtreeFlags & 33554432) !== 0) && (shouldStartViewTransition = !0);
      }
      var viewTransitionCancelableChildren = null;
      function pushViewTransitionCancelableScope() {
        var prevChildren = viewTransitionCancelableChildren;
        return viewTransitionCancelableChildren = null, prevChildren;
      }
      var viewTransitionHostInstanceIdx = 0;
      function applyViewTransitionToHostInstances(fiber, name, className, collectMeasurements, stopAtNestedViewTransitions) {
        return viewTransitionHostInstanceIdx = 0, applyViewTransitionToHostInstancesRecursive(
          fiber.child,
          name,
          className,
          collectMeasurements,
          stopAtNestedViewTransitions
        );
      }
      function applyViewTransitionToHostInstancesRecursive(child, name, className, collectMeasurements, stopAtNestedViewTransitions) {
        for (var inViewport = !1; child !== null; ) {
          if (child.tag === 5) {
            var instance = child.stateNode;
            if (collectMeasurements !== null) {
              var measurement = measureInstance(instance);
              collectMeasurements.push(measurement), measurement.view && (inViewport = !0);
            } else
              inViewport || measureInstance(instance).view && (inViewport = !0);
            shouldStartViewTransition = !0, applyViewTransitionName(
              instance,
              viewTransitionHostInstanceIdx === 0 ? name : name + "_" + viewTransitionHostInstanceIdx,
              className
            ), viewTransitionHostInstanceIdx++;
          } else (child.tag !== 22 || child.memoizedState === null) && (child.tag === 30 && stopAtNestedViewTransitions || applyViewTransitionToHostInstancesRecursive(
            child.child,
            name,
            className,
            collectMeasurements,
            stopAtNestedViewTransitions
          ) && (inViewport = !0));
          child = child.sibling;
        }
        return inViewport;
      }
      function restoreViewTransitionOnHostInstances(child, stopAtNestedViewTransitions) {
        for (; child !== null; )
          child.tag === 5 ? restoreViewTransitionName(child.stateNode, child.memoizedProps) : (child.tag !== 22 || child.memoizedState === null) && (child.tag === 30 && stopAtNestedViewTransitions || restoreViewTransitionOnHostInstances(
            child.child,
            stopAtNestedViewTransitions
          )), child = child.sibling;
      }
      function commitAppearingPairViewTransitions(placement) {
        if ((placement.subtreeFlags & 18874368) !== 0)
          for (placement = placement.child; placement !== null; ) {
            if ((placement.tag !== 22 || placement.memoizedState === null) && (commitAppearingPairViewTransitions(placement), placement.tag === 30 && (placement.flags & 18874368) !== 0 && placement.stateNode.paired)) {
              var props = placement.memoizedProps;
              if (props.name == null || props.name === "auto")
                throw Error(formatProdErrorMessage(544));
              var name = props.name;
              props = getViewTransitionClassName(props.default, props.share), props !== "none" && (applyViewTransitionToHostInstances(
                placement,
                name,
                props,
                null,
                !1
              ) || restoreViewTransitionOnHostInstances(placement.child, !1));
            }
            placement = placement.sibling;
          }
      }
      function commitEnterViewTransitions(placement, gesture) {
        if (placement.tag === 30) {
          var state = placement.stateNode, props = placement.memoizedProps, name = getViewTransitionName(props, state), className = getViewTransitionClassName(
            props.default,
            state.paired ? props.share : props.enter
          );
          className !== "none" ? applyViewTransitionToHostInstances(placement, name, className, null, !1) ? (commitAppearingPairViewTransitions(placement), state.paired || gesture || scheduleViewTransitionEvent(placement, props.onEnter)) : restoreViewTransitionOnHostInstances(placement.child, !1) : commitAppearingPairViewTransitions(placement);
        } else if ((placement.subtreeFlags & 33554432) !== 0)
          for (placement = placement.child; placement !== null; )
            commitEnterViewTransitions(placement, gesture), placement = placement.sibling;
        else commitAppearingPairViewTransitions(placement);
      }
      function commitDeletedPairViewTransitions(deletion) {
        if (appearingViewTransitions !== null && appearingViewTransitions.size !== 0) {
          var pairs = appearingViewTransitions;
          if ((deletion.subtreeFlags & 18874368) !== 0)
            for (deletion = deletion.child; deletion !== null; ) {
              if (deletion.tag !== 22 || deletion.memoizedState === null) {
                if (deletion.tag === 30 && (deletion.flags & 18874368) !== 0) {
                  var props = deletion.memoizedProps, name = props.name;
                  if (name != null && name !== "auto") {
                    var pair = pairs.get(name);
                    if (pair !== void 0) {
                      var className = getViewTransitionClassName(
                        props.default,
                        props.share
                      );
                      if (className !== "none" && (applyViewTransitionToHostInstances(
                        deletion,
                        name,
                        className,
                        null,
                        !1
                      ) ? (className = deletion.stateNode, pair.paired = className, className.paired = pair, scheduleViewTransitionEvent(deletion, props.onShare)) : restoreViewTransitionOnHostInstances(deletion.child, !1)), pairs.delete(name), pairs.size === 0) break;
                    }
                  }
                }
                commitDeletedPairViewTransitions(deletion);
              }
              deletion = deletion.sibling;
            }
        }
      }
      function commitExitViewTransitions(deletion) {
        if (deletion.tag === 30) {
          var props = deletion.memoizedProps, name = getViewTransitionName(props, deletion.stateNode), pair = appearingViewTransitions !== null ? appearingViewTransitions.get(name) : void 0, className = getViewTransitionClassName(
            props.default,
            pair !== void 0 ? props.share : props.exit
          );
          className !== "none" && (applyViewTransitionToHostInstances(deletion, name, className, null, !1) ? pair !== void 0 ? (className = deletion.stateNode, pair.paired = className, className.paired = pair, appearingViewTransitions.delete(name), scheduleViewTransitionEvent(deletion, props.onShare)) : scheduleViewTransitionEvent(deletion, props.onExit) : restoreViewTransitionOnHostInstances(deletion.child, !1)), appearingViewTransitions !== null && commitDeletedPairViewTransitions(deletion);
        } else if ((deletion.subtreeFlags & 33554432) !== 0)
          for (deletion = deletion.child; deletion !== null; )
            commitExitViewTransitions(deletion), deletion = deletion.sibling;
        else
          appearingViewTransitions !== null && commitDeletedPairViewTransitions(deletion);
      }
      function commitNestedViewTransitions(changedParent) {
        for (changedParent = changedParent.child; changedParent !== null; ) {
          if (changedParent.tag === 30) {
            var props = changedParent.memoizedProps, name = getViewTransitionName(props, changedParent.stateNode);
            props = getViewTransitionClassName(props.default, props.update), changedParent.flags &= -5, props !== "none" && applyViewTransitionToHostInstances(
              changedParent,
              name,
              props,
              changedParent.memoizedState = [],
              !1
            );
          } else
            (changedParent.subtreeFlags & 33554432) !== 0 && commitNestedViewTransitions(changedParent);
          changedParent = changedParent.sibling;
        }
      }
      function restorePairedViewTransitions(parent2) {
        if ((parent2.subtreeFlags & 18874368) !== 0)
          for (parent2 = parent2.child; parent2 !== null; ) {
            if (parent2.tag !== 22 || parent2.memoizedState === null) {
              if (parent2.tag === 30 && (parent2.flags & 18874368) !== 0) {
                var instance = parent2.stateNode;
                instance.paired !== null && (instance.paired = null, restoreViewTransitionOnHostInstances(parent2.child, !1));
              }
              restorePairedViewTransitions(parent2);
            }
            parent2 = parent2.sibling;
          }
      }
      function restoreEnterOrExitViewTransitions(fiber) {
        if (fiber.tag === 30)
          fiber.stateNode.paired = null, restoreViewTransitionOnHostInstances(fiber.child, !1), restorePairedViewTransitions(fiber);
        else if ((fiber.subtreeFlags & 33554432) !== 0)
          for (fiber = fiber.child; fiber !== null; )
            restoreEnterOrExitViewTransitions(fiber), fiber = fiber.sibling;
        else restorePairedViewTransitions(fiber);
      }
      function restoreNestedViewTransitions(changedParent) {
        for (changedParent = changedParent.child; changedParent !== null; )
          changedParent.tag === 30 ? restoreViewTransitionOnHostInstances(changedParent.child, !1) : (changedParent.subtreeFlags & 33554432) !== 0 && restoreNestedViewTransitions(changedParent), changedParent = changedParent.sibling;
      }
      function measureViewTransitionHostInstancesRecursive(parentViewTransition, child, newName, oldName, className, previousMeasurements, stopAtNestedViewTransitions) {
        for (var inViewport = !1; child !== null; ) {
          if (child.tag === 5) {
            var instance = child.stateNode;
            if (previousMeasurements !== null && viewTransitionHostInstanceIdx < previousMeasurements.length) {
              var previousMeasurement = previousMeasurements[viewTransitionHostInstanceIdx], nextMeasurement = measureInstance(instance);
              (previousMeasurement.view || nextMeasurement.view) && (inViewport = !0);
              var JSCompiler_temp;
              if (JSCompiler_temp = (parentViewTransition.flags & 4) === 0)
                if (nextMeasurement.clip) JSCompiler_temp = !0;
                else {
                  JSCompiler_temp = previousMeasurement.rect;
                  var newRect = nextMeasurement.rect;
                  JSCompiler_temp = JSCompiler_temp.y !== newRect.y || JSCompiler_temp.x !== newRect.x || JSCompiler_temp.height !== newRect.height || JSCompiler_temp.width !== newRect.width;
                }
              JSCompiler_temp && (parentViewTransition.flags |= 4), nextMeasurement.abs ? nextMeasurement = !previousMeasurement.abs : (previousMeasurement = previousMeasurement.rect, nextMeasurement = nextMeasurement.rect, nextMeasurement = previousMeasurement.height !== nextMeasurement.height || previousMeasurement.width !== nextMeasurement.width), nextMeasurement && (parentViewTransition.flags |= 32);
            } else parentViewTransition.flags |= 32;
            (parentViewTransition.flags & 4) !== 0 && applyViewTransitionName(
              instance,
              viewTransitionHostInstanceIdx === 0 ? newName : newName + "_" + viewTransitionHostInstanceIdx,
              className
            ), inViewport && (parentViewTransition.flags & 4) !== 0 || (viewTransitionCancelableChildren === null && (viewTransitionCancelableChildren = []), viewTransitionCancelableChildren.push(
              instance,
              viewTransitionHostInstanceIdx === 0 ? oldName : oldName + "_" + viewTransitionHostInstanceIdx,
              child.memoizedProps
            )), viewTransitionHostInstanceIdx++;
          } else (child.tag !== 22 || child.memoizedState === null) && (child.tag === 30 && stopAtNestedViewTransitions ? parentViewTransition.flags |= child.flags & 32 : measureViewTransitionHostInstancesRecursive(
            parentViewTransition,
            child.child,
            newName,
            oldName,
            className,
            previousMeasurements,
            stopAtNestedViewTransitions
          ) && (inViewport = !0));
          child = child.sibling;
        }
        return inViewport;
      }
      function measureNestedViewTransitions(changedParent, gesture) {
        for (changedParent = changedParent.child; changedParent !== null; ) {
          if (changedParent.tag === 30) {
            var props = changedParent.memoizedProps, state = changedParent.stateNode, name = getViewTransitionName(props, state), className = getViewTransitionClassName(props.default, props.update);
            if (gesture) {
              state = state.clones;
              var previousMeasurements = state === null ? null : state.map(measureClonedInstance);
            } else
              previousMeasurements = changedParent.memoizedState, changedParent.memoizedState = null;
            state = changedParent;
            var child = changedParent.child;
            viewTransitionHostInstanceIdx = 0, name = measureViewTransitionHostInstancesRecursive(
              state,
              child,
              name,
              name,
              className,
              previousMeasurements,
              !1
            ), (changedParent.flags & 4) !== 0 && name && (gesture || scheduleViewTransitionEvent(changedParent, props.onUpdate));
          } else
            (changedParent.subtreeFlags & 33554432) !== 0 && measureNestedViewTransitions(changedParent, gesture);
          changedParent = changedParent.sibling;
        }
      }
      var offscreenSubtreeIsHidden = !1, offscreenSubtreeWasHidden = !1, offscreenDirectParentIsHidden = !1, needsFormReset = !1, PossiblyWeakSet = typeof WeakSet == "function" ? WeakSet : Set, nextEffect = null, viewTransitionContextChanged = !1, inUpdateViewTransition = !1, rootViewTransitionAffected = !1, rootViewTransitionNameCanceled = !1;
      function commitBeforeMutationEffects(root2, firstChild, committedLanes) {
        if (root2 = root2.containerInfo, eventsEnabled = _enabled, root2 = getActiveElementDeep(root2), hasSelectionCapabilities(root2)) {
          if ("selectionStart" in root2)
            var JSCompiler_temp = {
              start: root2.selectionStart,
              end: root2.selectionEnd
            };
          else
            a: {
              JSCompiler_temp = (JSCompiler_temp = root2.ownerDocument) && JSCompiler_temp.defaultView || window;
              var selection = JSCompiler_temp.getSelection && JSCompiler_temp.getSelection();
              if (selection && selection.rangeCount !== 0) {
                JSCompiler_temp = selection.anchorNode;
                var anchorOffset = selection.anchorOffset, focusNode = selection.focusNode;
                selection = selection.focusOffset;
                try {
                  JSCompiler_temp.nodeType, focusNode.nodeType;
                } catch {
                  JSCompiler_temp = null;
                  break a;
                }
                var length = 0, start2 = -1, end = -1, indexWithinAnchor = 0, indexWithinFocus = 0, node = root2, parentNode = null;
                b: for (; ; ) {
                  for (var next; node !== JSCompiler_temp || anchorOffset !== 0 && node.nodeType !== 3 || (start2 = length + anchorOffset), node !== focusNode || selection !== 0 && node.nodeType !== 3 || (end = length + selection), node.nodeType === 3 && (length += node.nodeValue.length), (next = node.firstChild) !== null; )
                    parentNode = node, node = next;
                  for (; ; ) {
                    if (node === root2) break b;
                    if (parentNode === JSCompiler_temp && ++indexWithinAnchor === anchorOffset && (start2 = length), parentNode === focusNode && ++indexWithinFocus === selection && (end = length), (next = node.nextSibling) !== null) break;
                    node = parentNode, parentNode = node.parentNode;
                  }
                  node = next;
                }
                JSCompiler_temp = start2 === -1 || end === -1 ? null : { start: start2, end };
              } else JSCompiler_temp = null;
            }
          JSCompiler_temp = JSCompiler_temp || { start: 0, end: 0 };
        } else JSCompiler_temp = null;
        for (selectionInformation = { focusedElem: root2, selectionRange: JSCompiler_temp }, _enabled = !1, committedLanes = (committedLanes & 335544064) === committedLanes, nextEffect = firstChild, firstChild = committedLanes ? 9270 : 1024; nextEffect !== null; ) {
          if (root2 = nextEffect, committedLanes && (JSCompiler_temp = root2.deletions, JSCompiler_temp !== null))
            for (anchorOffset = 0; anchorOffset < JSCompiler_temp.length; anchorOffset++)
              committedLanes && commitExitViewTransitions(JSCompiler_temp[anchorOffset]);
          if (root2.alternate === null && (root2.flags & 2) !== 0)
            committedLanes && trackEnterViewTransitions(root2), commitBeforeMutationEffects_complete(committedLanes);
          else {
            if (root2.tag === 22) {
              if (JSCompiler_temp = root2.alternate, root2.memoizedState !== null) {
                JSCompiler_temp !== null && JSCompiler_temp.memoizedState === null && committedLanes && commitExitViewTransitions(JSCompiler_temp), commitBeforeMutationEffects_complete(committedLanes);
                continue;
              } else if (JSCompiler_temp !== null && JSCompiler_temp.memoizedState !== null) {
                committedLanes && trackEnterViewTransitions(root2), commitBeforeMutationEffects_complete(committedLanes);
                continue;
              }
            }
            JSCompiler_temp = root2.child, (root2.subtreeFlags & firstChild) !== 0 && JSCompiler_temp !== null ? (JSCompiler_temp.return = root2, nextEffect = JSCompiler_temp) : (committedLanes && commitNestedViewTransitions(root2), commitBeforeMutationEffects_complete(committedLanes));
          }
        }
        appearingViewTransitions = null;
      }
      function commitBeforeMutationEffects_complete(isViewTransitionEligible$jscomp$0) {
        for (; nextEffect !== null; ) {
          var fiber = nextEffect, isViewTransitionEligible = isViewTransitionEligible$jscomp$0, current = fiber.alternate, flags = fiber.flags;
          switch (fiber.tag) {
            case 0:
            case 11:
            case 15:
              break;
            case 1:
              if ((flags & 1024) !== 0 && current !== null) {
                isViewTransitionEligible = void 0, flags = current.memoizedProps, current = current.memoizedState;
                var instance = fiber.stateNode;
                try {
                  var resolvedPrevProps = resolveClassComponentProps(
                    fiber.type,
                    flags
                  );
                  isViewTransitionEligible = instance.getSnapshotBeforeUpdate(
                    resolvedPrevProps,
                    current
                  ), instance.__reactInternalSnapshotBeforeUpdate = isViewTransitionEligible;
                } catch (error) {
                  captureCommitPhaseError(fiber, fiber.return, error);
                }
              }
              break;
            case 3:
              if ((flags & 1024) !== 0) {
                if (current = fiber.stateNode.containerInfo, isViewTransitionEligible = current.nodeType, isViewTransitionEligible === 9)
                  clearContainerSparingly(current);
                else if (isViewTransitionEligible === 1)
                  switch (current.nodeName) {
                    case "HEAD":
                    case "HTML":
                    case "BODY":
                      clearContainerSparingly(current);
                      break;
                    default:
                      current.textContent = "";
                  }
              }
              break;
            case 5:
            case 26:
            case 27:
            case 6:
            case 4:
            case 17:
              break;
            case 30:
              isViewTransitionEligible && current !== null && (isViewTransitionEligible = getViewTransitionName(
                current.memoizedProps,
                current.stateNode
              ), flags = fiber.memoizedProps, flags = getViewTransitionClassName(flags.default, flags.update), flags !== "none" && applyViewTransitionToHostInstances(
                current,
                isViewTransitionEligible,
                flags,
                current.memoizedState = [],
                !0
              ));
              break;
            default:
              if ((flags & 1024) !== 0) throw Error(formatProdErrorMessage(163));
          }
          if (current = fiber.sibling, current !== null) {
            current.return = fiber.return, nextEffect = current;
            break;
          }
          nextEffect = fiber.return;
        }
      }
      function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
        var flags = finishedWork.flags;
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork), flags & 4 && commitHookEffectListMount(5, finishedWork);
            break;
          case 1:
            if (recursivelyTraverseLayoutEffects(finishedRoot, finishedWork), flags & 4)
              if (finishedRoot = finishedWork.stateNode, current === null)
                try {
                  finishedRoot.componentDidMount();
                } catch (error) {
                  captureCommitPhaseError(finishedWork, finishedWork.return, error);
                }
              else {
                var prevProps = resolveClassComponentProps(
                  finishedWork.type,
                  current.memoizedProps
                );
                current = current.memoizedState;
                try {
                  finishedRoot.componentDidUpdate(
                    prevProps,
                    current,
                    finishedRoot.__reactInternalSnapshotBeforeUpdate
                  );
                } catch (error$146) {
                  captureCommitPhaseError(
                    finishedWork,
                    finishedWork.return,
                    error$146
                  );
                }
              }
            flags & 64 && commitClassCallbacks(finishedWork), flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
            break;
          case 3:
            if (recursivelyTraverseLayoutEffects(finishedRoot, finishedWork), flags & 64 && (finishedRoot = finishedWork.updateQueue, finishedRoot !== null)) {
              if (current = null, finishedWork.child !== null)
                switch (finishedWork.child.tag) {
                  case 27:
                  case 5:
                    current = finishedWork.child.stateNode;
                    break;
                  case 1:
                    current = finishedWork.child.stateNode;
                }
              try {
                commitCallbacks(finishedRoot, current);
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
            break;
          case 27:
            current === null && flags & 4 && commitHostSingletonAcquisition(finishedWork);
          case 26:
          case 5:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork), current === null && flags & 4 && commitHostMount(finishedWork), flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
            break;
          case 12:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            break;
          case 31:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork), flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
            break;
          case 13:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork), flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork), flags & 64 && (finishedRoot = finishedWork.memoizedState, finishedRoot !== null && (finishedRoot = finishedRoot.dehydrated, finishedRoot !== null && (finishedWork = retryDehydratedSuspenseBoundary.bind(
              null,
              finishedWork
            ), registerSuspenseInstanceRetry(finishedRoot, finishedWork))));
            break;
          case 22:
            if (flags = finishedWork.memoizedState !== null || offscreenSubtreeIsHidden, !flags) {
              var newOffscreenSubtreeWasHidden = current !== null && current.memoizedState !== null || offscreenSubtreeWasHidden;
              current = offscreenSubtreeIsHidden, prevProps = offscreenSubtreeWasHidden, offscreenSubtreeIsHidden = flags, (offscreenSubtreeWasHidden = newOffscreenSubtreeWasHidden) && !prevProps ? (flags = 2, (finishedWork.subtreeFlags & 8772) !== 0 && (flags |= 1), recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                flags
              )) : recursivelyTraverseLayoutEffects(finishedRoot, finishedWork), offscreenSubtreeIsHidden = current, offscreenSubtreeWasHidden = prevProps;
            }
            break;
          case 30:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork), flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
            break;
          case 7:
            flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
          default:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
        }
      }
      function hideOrUnhideAllChildren(parentFiber, isHidden2) {
        for (parentFiber = parentFiber.child; parentFiber !== null; )
          hideOrUnhideAllChildrenOnFiber(parentFiber, isHidden2), parentFiber = parentFiber.sibling;
      }
      function hideOrUnhideAllChildrenOnFiber(fiber, isHidden2) {
        switch (fiber.tag) {
          case 5:
          case 26:
            try {
              var instance = fiber.stateNode;
              if (isHidden2) {
                var style2 = instance.style;
                typeof style2.setProperty == "function" ? style2.setProperty("display", "none", "important") : style2.display = "none";
              } else {
                var instance$jscomp$0 = fiber.stateNode, styleProp = fiber.memoizedProps.style, display = styleProp != null && styleProp.hasOwnProperty("display") ? styleProp.display : null;
                instance$jscomp$0.style.display = display == null || typeof display == "boolean" ? "" : ("" + display).trim();
              }
            } catch (error) {
              captureCommitPhaseError(fiber, fiber.return, error);
            }
            hideOrUnhideNearestPortals(fiber, isHidden2);
            break;
          case 6:
            try {
              fiber.stateNode.nodeValue = isHidden2 ? "" : fiber.memoizedProps, viewTransitionMutationContext = !0;
            } catch (error) {
              captureCommitPhaseError(fiber, fiber.return, error);
            }
            break;
          case 18:
            try {
              var instance$jscomp$1 = fiber.stateNode;
              isHidden2 ? hideOrUnhideDehydratedBoundary(instance$jscomp$1, !0) : hideOrUnhideDehydratedBoundary(fiber.stateNode, !1);
            } catch (error) {
              captureCommitPhaseError(fiber, fiber.return, error);
            }
            break;
          case 22:
          case 23:
            fiber.memoizedState === null && hideOrUnhideAllChildren(fiber, isHidden2);
            break;
          default:
            hideOrUnhideAllChildren(fiber, isHidden2);
        }
      }
      function hideOrUnhideNearestPortals(parentFiber, isHidden$jscomp$0) {
        if (parentFiber.subtreeFlags & 67108864)
          for (parentFiber = parentFiber.child; parentFiber !== null; ) {
            a: {
              var fiber = parentFiber, isHidden2 = isHidden$jscomp$0;
              switch (fiber.tag) {
                case 4:
                  hideOrUnhideAllChildrenOnFiber(fiber, isHidden2);
                  break a;
                case 22:
                  fiber.memoizedState === null && hideOrUnhideNearestPortals(fiber, isHidden2);
                  break a;
                default:
                  hideOrUnhideNearestPortals(fiber, isHidden2);
              }
            }
            parentFiber = parentFiber.sibling;
          }
      }
      function detachFiberAfterEffects(fiber) {
        var alternate = fiber.alternate;
        alternate !== null && (fiber.alternate = null, detachFiberAfterEffects(alternate)), fiber.child = null, fiber.deletions = null, fiber.sibling = null, fiber.tag === 5 && (alternate = fiber.stateNode, alternate !== null && detachDeletedInstance(alternate)), fiber.stateNode = null, fiber.return = null, fiber.dependencies = null, fiber.memoizedProps = null, fiber.memoizedState = null, fiber.pendingProps = null, fiber.stateNode = null, fiber.updateQueue = null;
      }
      var hostParent = null, hostParentIsContainer = !1;
      function recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, parent2) {
        for (parent2 = parent2.child; parent2 !== null; )
          commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, parent2), parent2 = parent2.sibling;
      }
      function commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, deletedFiber) {
        if (injectedHook && typeof injectedHook.onCommitFiberUnmount == "function")
          try {
            injectedHook.onCommitFiberUnmount(rendererID, deletedFiber);
          } catch {
          }
        switch (deletedFiber.tag) {
          case 26:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor), recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            ), deletedFiber.memoizedState ? deletedFiber.memoizedState.count-- : deletedFiber.stateNode && !offscreenSubtreeWasHidden && (deletedFiber = deletedFiber.stateNode, deletedFiber.parentNode.removeChild(deletedFiber));
            break;
          case 27:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor), commitFragmentInstanceDeletionEffects(deletedFiber);
            var prevHostParent = hostParent, prevHostParentIsContainer = hostParentIsContainer;
            isSingletonScope(deletedFiber.type) && (hostParent = deletedFiber.stateNode, hostParentIsContainer = !1), recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            ), releaseSingletonInstance(
              deletedFiber.stateNode,
              deletedFiber.type,
              deletedFiber.memoizedProps
            ), hostParent = prevHostParent, hostParentIsContainer = prevHostParentIsContainer;
            break;
          case 5:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor), commitFragmentInstanceDeletionEffects(deletedFiber);
          case 6:
            if (deletedFiber.tag === 6 && commitFragmentInstanceDeletionEffects(deletedFiber), prevHostParent = hostParent, prevHostParentIsContainer = hostParentIsContainer, hostParent = null, recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            ), hostParent = prevHostParent, hostParentIsContainer = prevHostParentIsContainer, hostParent !== null)
              if (hostParentIsContainer)
                try {
                  (hostParent.nodeType === 9 ? hostParent.body : hostParent.nodeName === "HTML" ? hostParent.ownerDocument.body : hostParent).removeChild(deletedFiber.stateNode), viewTransitionMutationContext = !0;
                } catch (error) {
                  captureCommitPhaseError(
                    deletedFiber,
                    nearestMountedAncestor,
                    error
                  );
                }
              else
                try {
                  hostParent.removeChild(deletedFiber.stateNode), viewTransitionMutationContext = !0;
                } catch (error) {
                  captureCommitPhaseError(
                    deletedFiber,
                    nearestMountedAncestor,
                    error
                  );
                }
            break;
          case 18:
            hostParent !== null && (hostParentIsContainer ? (finishedRoot = hostParent, clearHydrationBoundary(
              finishedRoot.nodeType === 9 ? finishedRoot.body : finishedRoot.nodeName === "HTML" ? finishedRoot.ownerDocument.body : finishedRoot,
              deletedFiber.stateNode
            ), retryIfBlockedOn(finishedRoot)) : clearHydrationBoundary(hostParent, deletedFiber.stateNode));
            break;
          case 4:
            prevHostParent = hostParent, prevHostParentIsContainer = hostParentIsContainer, hostParent = deletedFiber.stateNode.containerInfo, hostParentIsContainer = !0, recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            ), hostParent = prevHostParent, hostParentIsContainer = prevHostParentIsContainer;
            break;
          case 0:
          case 11:
          case 14:
          case 15:
            commitHookEffectListUnmount(2, deletedFiber, nearestMountedAncestor), offscreenSubtreeWasHidden || commitHookEffectListUnmount(4, deletedFiber, nearestMountedAncestor), recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          case 1:
            offscreenSubtreeWasHidden || (safelyDetachRef(deletedFiber, nearestMountedAncestor), prevHostParent = deletedFiber.stateNode, typeof prevHostParent.componentWillUnmount == "function" && safelyCallComponentWillUnmount(
              deletedFiber,
              nearestMountedAncestor,
              prevHostParent
            )), recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          case 21:
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          case 22:
            offscreenSubtreeWasHidden = (prevHostParent = offscreenSubtreeWasHidden) || deletedFiber.memoizedState !== null, recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            ), offscreenSubtreeWasHidden = prevHostParent;
            break;
          case 30:
            safelyDetachRef(deletedFiber, nearestMountedAncestor), recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          case 7:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor), recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          default:
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
        }
      }
      function commitActivityHydrationCallbacks(finishedRoot, finishedWork) {
        if (finishedWork.memoizedState === null && (finishedRoot = finishedWork.alternate, finishedRoot !== null && (finishedRoot = finishedRoot.memoizedState, finishedRoot !== null))) {
          finishedRoot = finishedRoot.dehydrated;
          try {
            retryIfBlockedOn(finishedRoot);
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
      }
      function commitSuspenseHydrationCallbacks(finishedRoot, finishedWork) {
        if (finishedWork.memoizedState === null && (finishedRoot = finishedWork.alternate, finishedRoot !== null && (finishedRoot = finishedRoot.memoizedState, finishedRoot !== null && (finishedRoot = finishedRoot.dehydrated, finishedRoot !== null))))
          try {
            retryIfBlockedOn(finishedRoot);
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
      }
      function getRetryCache(finishedWork) {
        switch (finishedWork.tag) {
          case 31:
          case 13:
          case 19:
            var retryCache = finishedWork.stateNode;
            return retryCache === null && (retryCache = finishedWork.stateNode = new PossiblyWeakSet()), retryCache;
          case 22:
            return finishedWork = finishedWork.stateNode, retryCache = finishedWork._retryCache, retryCache === null && (retryCache = finishedWork._retryCache = new PossiblyWeakSet()), retryCache;
          default:
            throw Error(formatProdErrorMessage(435, finishedWork.tag));
        }
      }
      function attachSuspenseRetryListeners(finishedWork, wakeables) {
        var retryCache = getRetryCache(finishedWork);
        wakeables.forEach(function(wakeable) {
          if (!retryCache.has(wakeable)) {
            retryCache.add(wakeable);
            var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
            wakeable.then(retry, retry);
          }
        });
      }
      function recursivelyTraverseMutationEffects(root$jscomp$0, parentFiber, lanes) {
        var deletions = parentFiber.deletions;
        if (deletions !== null)
          for (var i = 0; i < deletions.length; i++) {
            var childToDelete = deletions[i], root2 = root$jscomp$0, returnFiber = parentFiber, parent2 = returnFiber;
            a: for (; parent2 !== null; ) {
              switch (parent2.tag) {
                case 27:
                  if (isSingletonScope(parent2.type)) {
                    hostParent = parent2.stateNode, hostParentIsContainer = !1;
                    break a;
                  }
                  break;
                case 5:
                  hostParent = parent2.stateNode, hostParentIsContainer = !1;
                  break a;
                case 3:
                case 4:
                  hostParent = parent2.stateNode.containerInfo, hostParentIsContainer = !0;
                  break a;
              }
              parent2 = parent2.return;
            }
            if (hostParent === null) throw Error(formatProdErrorMessage(160));
            commitDeletionEffectsOnFiber(root2, returnFiber, childToDelete), hostParent = null, hostParentIsContainer = !1, root2 = childToDelete.alternate, root2 !== null && (root2.return = null), childToDelete.return = null;
          }
        if (parentFiber.subtreeFlags & 13886)
          for (parentFiber = parentFiber.child; parentFiber !== null; )
            commitMutationEffectsOnFiber(parentFiber, root$jscomp$0, lanes), parentFiber = parentFiber.sibling;
      }
      var currentHoistableRoot = null;
      function commitMutationEffectsOnFiber(finishedWork, root2, lanes) {
        var current = finishedWork.alternate, flags = finishedWork.flags;
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            if (flags & 4 && (current = finishedWork.updateQueue, current = current !== null ? current.events : null, current !== null))
              for (var ii = 0; ii < current.length; ii++) {
                var _eventPayloads$ii2 = current[ii];
                _eventPayloads$ii2.ref.impl = _eventPayloads$ii2.nextImpl;
              }
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), flags & 4 && (commitHookEffectListUnmount(3, finishedWork, finishedWork.return), commitHookEffectListMount(3, finishedWork), commitHookEffectListUnmount(5, finishedWork, finishedWork.return));
            break;
          case 1:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), flags & 512 && (offscreenSubtreeWasHidden || current === null || safelyDetachRef(current, current.return)), flags & 64 && offscreenSubtreeIsHidden && (finishedWork = finishedWork.updateQueue, finishedWork !== null && (root2 = finishedWork.callbacks, root2 !== null && (lanes = finishedWork.shared.hiddenCallbacks, finishedWork.shared.hiddenCallbacks = lanes === null ? root2 : lanes.concat(root2))));
            break;
          case 26:
            if (ii = currentHoistableRoot, recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), flags & 512 && (offscreenSubtreeWasHidden || current === null || safelyDetachRef(current, current.return)), flags & 4)
              if (flags = current !== null ? current.memoizedState : null, lanes = finishedWork.memoizedState, current === null)
                if (lanes === null)
                  if (finishedWork.stateNode === null)
                    if (offscreenSubtreeIsHidden)
                      finishedWork.stateNode = createHoistableInstance(
                        finishedWork.type,
                        finishedWork.memoizedProps,
                        root2.containerInfo,
                        finishedWork
                      );
                    else {
                      a: {
                        root2 = finishedWork.type, lanes = finishedWork.memoizedProps, flags = ii.ownerDocument || ii;
                        b: switch (root2) {
                          case "title":
                            current = flags.getElementsByTagName("title")[0], (!current || current[internalHoistableMarker] || current[internalInstanceKey] || current.namespaceURI === "http://www.w3.org/2000/svg" || current.hasAttribute("itemprop")) && (current = flags.createElement(root2), flags.head.insertBefore(
                              current,
                              flags.querySelector("head > title")
                            )), setInitialProperties(current, root2, lanes), current[internalInstanceKey] = finishedWork, markNodeAsHoistable(current), root2 = current;
                            break a;
                          case "link":
                            if (ii = getHydratableHoistableCache(
                              "link",
                              "href",
                              flags
                            ).get(root2 + (lanes.href || ""))) {
                              for (_eventPayloads$ii2 = 0; _eventPayloads$ii2 < ii.length; _eventPayloads$ii2++)
                                if (current = ii[_eventPayloads$ii2], current.getAttribute("href") === (lanes.href == null || lanes.href === "" ? null : lanes.href) && current.getAttribute("rel") === (lanes.rel == null ? null : lanes.rel) && current.getAttribute("title") === (lanes.title == null ? null : lanes.title) && current.getAttribute("crossorigin") === (lanes.crossOrigin == null ? null : lanes.crossOrigin)) {
                                  ii.splice(_eventPayloads$ii2, 1);
                                  break b;
                                }
                            }
                            current = flags.createElement(root2), setInitialProperties(current, root2, lanes), flags.head.appendChild(current);
                            break;
                          case "meta":
                            if (ii = getHydratableHoistableCache(
                              "meta",
                              "content",
                              flags
                            ).get(root2 + (lanes.content || ""))) {
                              for (_eventPayloads$ii2 = 0; _eventPayloads$ii2 < ii.length; _eventPayloads$ii2++)
                                if (current = ii[_eventPayloads$ii2], current.getAttribute("content") === (lanes.content == null ? null : "" + lanes.content) && current.getAttribute("name") === (lanes.name == null ? null : lanes.name) && current.getAttribute("property") === (lanes.property == null ? null : lanes.property) && current.getAttribute("http-equiv") === (lanes.httpEquiv == null ? null : lanes.httpEquiv) && current.getAttribute("charset") === (lanes.charSet == null ? null : lanes.charSet)) {
                                  ii.splice(_eventPayloads$ii2, 1);
                                  break b;
                                }
                            }
                            current = flags.createElement(root2), setInitialProperties(current, root2, lanes), flags.head.appendChild(current);
                            break;
                          default:
                            throw Error(formatProdErrorMessage(468, root2));
                        }
                        current[internalInstanceKey] = finishedWork, markNodeAsHoistable(current), root2 = current;
                      }
                      finishedWork.stateNode = root2;
                    }
                  else
                    offscreenSubtreeIsHidden || mountHoistable(ii, finishedWork.type, finishedWork.stateNode);
                else
                  finishedWork.stateNode = acquireResource(
                    ii,
                    lanes,
                    finishedWork.memoizedProps
                  );
              else
                flags !== lanes ? (flags === null ? (root2 = current.stateNode, root2 === null || offscreenSubtreeWasHidden || root2.parentNode.removeChild(root2)) : flags.count--, lanes === null ? offscreenSubtreeIsHidden || mountHoistable(ii, finishedWork.type, finishedWork.stateNode) : acquireResource(ii, lanes, finishedWork.memoizedProps)) : lanes === null && finishedWork.stateNode !== null && commitHostUpdate(
                  finishedWork,
                  finishedWork.memoizedProps,
                  current.memoizedProps
                );
            break;
          case 27:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), flags & 512 && (offscreenSubtreeWasHidden || current === null || safelyDetachRef(current, current.return)), current !== null && flags & 4 && commitHostUpdate(
              finishedWork,
              finishedWork.memoizedProps,
              current.memoizedProps
            );
            break;
          case 5:
            if (ii = offscreenDirectParentIsHidden, offscreenDirectParentIsHidden = !1, recursivelyTraverseMutationEffects(root2, finishedWork, lanes), offscreenDirectParentIsHidden = ii, commitReconciliationEffects(finishedWork), flags & 512 && (offscreenSubtreeWasHidden || current === null || safelyDetachRef(current, current.return)), finishedWork.flags & 32) {
              root2 = finishedWork.stateNode;
              try {
                setTextContent(root2, ""), viewTransitionMutationContext = !0;
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
            flags & 4 && finishedWork.stateNode != null && (root2 = finishedWork.memoizedProps, commitHostUpdate(
              finishedWork,
              root2,
              current !== null ? current.memoizedProps : root2
            )), flags & 1024 && (needsFormReset = !0);
            break;
          case 6:
            if (recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), flags & 4) {
              if (finishedWork.stateNode === null)
                throw Error(formatProdErrorMessage(162));
              root2 = finishedWork.memoizedProps, lanes = finishedWork.stateNode;
              try {
                lanes.nodeValue = root2, viewTransitionMutationContext = !0;
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
            break;
          case 3:
            if (viewTransitionMutationContext = !1, tagCaches = null, ii = currentHoistableRoot, currentHoistableRoot = getHoistableRoot(root2.containerInfo), recursivelyTraverseMutationEffects(root2, finishedWork, lanes), currentHoistableRoot = ii, commitReconciliationEffects(finishedWork), flags & 4 && current !== null && current.memoizedState.isDehydrated)
              try {
                retryIfBlockedOn(root2.containerInfo);
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            needsFormReset && (needsFormReset = !1, recursivelyResetForms(finishedWork)), viewTransitionMutationContext = !1;
            break;
          case 4:
            flags = offscreenDirectParentIsHidden, offscreenDirectParentIsHidden = offscreenSubtreeIsHidden, current = pushMutationContext(), ii = currentHoistableRoot, currentHoistableRoot = getHoistableRoot(
              finishedWork.stateNode.containerInfo
            ), recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), currentHoistableRoot = ii, viewTransitionMutationContext && inUpdateViewTransition && (rootViewTransitionAffected = !0), viewTransitionMutationContext = current, offscreenDirectParentIsHidden = flags;
            break;
          case 12:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork);
            break;
          case 31:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), flags & 4 && (root2 = finishedWork.updateQueue, root2 !== null && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, root2)));
            break;
          case 13:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), finishedWork.child.flags & 8192 && finishedWork.memoizedState !== null != (current !== null && current.memoizedState !== null) && (globalMostRecentFallbackTime = now()), flags & 4 && (root2 = finishedWork.updateQueue, root2 !== null && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, root2)));
            break;
          case 22:
            ii = finishedWork.memoizedState !== null, _eventPayloads$ii2 = current !== null && current.memoizedState !== null;
            var prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden, prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden, prevOffscreenDirectParentIsHidden$166 = offscreenDirectParentIsHidden;
            offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden || ii, offscreenDirectParentIsHidden = prevOffscreenDirectParentIsHidden$166 || ii, offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden || _eventPayloads$ii2, recursivelyTraverseMutationEffects(root2, finishedWork, lanes), offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden, offscreenDirectParentIsHidden = prevOffscreenDirectParentIsHidden$166, offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden, commitReconciliationEffects(finishedWork), flags & 8192 && (root2 = finishedWork.stateNode, root2._visibility = ii ? root2._visibility & -2 : root2._visibility | 1, !ii || current === null || _eventPayloads$ii2 || offscreenSubtreeIsHidden || offscreenSubtreeWasHidden || (root2 = _eventPayloads$ii2 || offscreenSubtreeWasHidden, lanes = offscreenSubtreeIsHidden, current = offscreenSubtreeWasHidden, offscreenSubtreeIsHidden = ii || offscreenSubtreeIsHidden, offscreenSubtreeWasHidden = root2, recursivelyTraverseDisappearLayoutEffects(finishedWork, 2), offscreenSubtreeIsHidden = lanes, offscreenSubtreeWasHidden = current), !ii && offscreenDirectParentIsHidden || hideOrUnhideAllChildren(finishedWork, ii)), flags & 4 && (root2 = finishedWork.updateQueue, root2 !== null && (lanes = root2.retryQueue, lanes !== null && (root2.retryQueue = null, attachSuspenseRetryListeners(finishedWork, lanes))));
            break;
          case 19:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), flags & 4 && (root2 = finishedWork.updateQueue, root2 !== null && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, root2)));
            break;
          case 30:
            flags & 512 && (offscreenSubtreeWasHidden || current === null || safelyDetachRef(current, current.return)), flags = pushMutationContext(), ii = inUpdateViewTransition, _eventPayloads$ii2 = (lanes & 335544064) === lanes, prevOffscreenSubtreeIsHidden = finishedWork.memoizedProps, inUpdateViewTransition = _eventPayloads$ii2 && getViewTransitionClassName(
              prevOffscreenSubtreeIsHidden.default,
              prevOffscreenSubtreeIsHidden.update
            ) !== "none", recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), _eventPayloads$ii2 && current !== null && viewTransitionMutationContext && (finishedWork.flags |= 4), inUpdateViewTransition = ii, viewTransitionMutationContext = flags;
            break;
          case 21:
            break;
          case 7:
            flags & 512 && (offscreenSubtreeWasHidden || current === null || safelyDetachRef(current, current.return)), current && current.stateNode !== null && (current.stateNode._fragmentFiber = finishedWork);
          default:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork);
        }
      }
      function commitReconciliationEffects(finishedWork) {
        var flags = finishedWork.flags;
        if (flags & 2) {
          try {
            for (var hostParentFiber, parentFiber = finishedWork.return; parentFiber !== null; ) {
              if (isHostParent(parentFiber)) {
                hostParentFiber = parentFiber;
                break;
              }
              parentFiber = parentFiber.return;
            }
            parentFiber = null;
            for (var parent2 = finishedWork.return; parent2 !== null; ) {
              if (isFragmentInstanceParent(parent2)) {
                var fragmentInstance = parent2.stateNode;
                parentFiber === null ? parentFiber = [fragmentInstance] : parentFiber.push(fragmentInstance);
              }
              if (isFragmentInstanceHostBoundary(parent2)) break;
              parent2 = parent2.return;
            }
            var JSCompiler_inline_result = parentFiber;
            if (hostParentFiber == null) throw Error(formatProdErrorMessage(160));
            switch (hostParentFiber.tag) {
              case 27:
                var parent$jscomp$0 = hostParentFiber.stateNode, before = getHostSibling(finishedWork);
                insertOrAppendPlacementNode(
                  finishedWork,
                  before,
                  parent$jscomp$0,
                  JSCompiler_inline_result
                );
                break;
              case 5:
                var parent$149 = hostParentFiber.stateNode;
                hostParentFiber.flags & 32 && (setTextContent(parent$149, ""), hostParentFiber.flags &= -33);
                var before$150 = getHostSibling(finishedWork);
                insertOrAppendPlacementNode(
                  finishedWork,
                  before$150,
                  parent$149,
                  JSCompiler_inline_result
                );
                break;
              case 3:
              case 4:
                var parent$151 = hostParentFiber.stateNode.containerInfo, before$152 = getHostSibling(finishedWork);
                insertOrAppendPlacementNodeIntoContainer(
                  finishedWork,
                  before$152,
                  parent$151,
                  JSCompiler_inline_result
                );
                break;
              default:
                throw Error(formatProdErrorMessage(161));
            }
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
          finishedWork.flags &= -3;
        }
        flags & 4096 && (finishedWork.flags &= -4097);
      }
      function recursivelyResetForms(parentFiber) {
        if (parentFiber.subtreeFlags & 1024)
          for (parentFiber = parentFiber.child; parentFiber !== null; ) {
            var fiber = parentFiber;
            recursivelyResetForms(fiber), fiber.tag === 5 && fiber.flags & 1024 && (fiber = fiber.stateNode, _enabled = !0, fiber.reset(), _enabled = !1), parentFiber = parentFiber.sibling;
          }
      }
      function recursivelyTraverseAfterMutationEffects(root2, parentFiber) {
        if (parentFiber.subtreeFlags & 9270)
          for (parentFiber = parentFiber.child; parentFiber !== null; )
            commitAfterMutationEffectsOnFiber(parentFiber, root2), parentFiber = parentFiber.sibling;
        else measureNestedViewTransitions(parentFiber, !1);
      }
      function commitAfterMutationEffectsOnFiber(finishedWork, root2) {
        var current = finishedWork.alternate;
        if (current === null) commitEnterViewTransitions(finishedWork, !1);
        else
          switch (finishedWork.tag) {
            case 3:
              if (rootViewTransitionNameCanceled = viewTransitionContextChanged = !1, pushViewTransitionCancelableScope(), recursivelyTraverseAfterMutationEffects(root2, finishedWork), !viewTransitionContextChanged && !rootViewTransitionAffected) {
                if (finishedWork = viewTransitionCancelableChildren, finishedWork !== null)
                  for (var i = 0; i < finishedWork.length; i += 3) {
                    current = finishedWork[i];
                    var oldName = finishedWork[i + 1];
                    restoreViewTransitionName(current, finishedWork[i + 2]), current = current.ownerDocument.documentElement, current !== null && current.animate(
                      { opacity: [0, 0], pointerEvents: ["none", "none"] },
                      {
                        duration: 0,
                        fill: "forwards",
                        pseudoElement: "::view-transition-group(" + oldName + ")"
                      }
                    );
                  }
                finishedWork = root2.containerInfo, finishedWork = finishedWork.nodeType === 9 ? finishedWork.documentElement : finishedWork.ownerDocument.documentElement, finishedWork !== null && finishedWork.style.viewTransitionName === "" && (finishedWork.style.viewTransitionName = "none", finishedWork.animate(
                  { opacity: [0, 0], pointerEvents: ["none", "none"] },
                  {
                    duration: 0,
                    fill: "forwards",
                    pseudoElement: "::view-transition-group(root)"
                  }
                ), finishedWork.animate(
                  { width: [0, 0], height: [0, 0] },
                  {
                    duration: 0,
                    fill: "forwards",
                    pseudoElement: "::view-transition"
                  }
                )), rootViewTransitionNameCanceled = !0;
              }
              viewTransitionCancelableChildren = null;
              break;
            case 5:
              recursivelyTraverseAfterMutationEffects(root2, finishedWork);
              break;
            case 4:
              i = viewTransitionContextChanged, viewTransitionContextChanged = !1, recursivelyTraverseAfterMutationEffects(root2, finishedWork), viewTransitionContextChanged && (rootViewTransitionAffected = !0), viewTransitionContextChanged = i;
              break;
            case 22:
              finishedWork.memoizedState === null && (current.memoizedState !== null ? commitEnterViewTransitions(finishedWork, !1) : recursivelyTraverseAfterMutationEffects(root2, finishedWork));
              break;
            case 30:
              i = viewTransitionContextChanged, oldName = pushViewTransitionCancelableScope(), viewTransitionContextChanged = !1, recursivelyTraverseAfterMutationEffects(root2, finishedWork), viewTransitionContextChanged && (finishedWork.flags |= 4);
              var props = finishedWork.memoizedProps, state = finishedWork.stateNode;
              root2 = getViewTransitionName(props, state), state = getViewTransitionName(current.memoizedProps, state);
              var className = getViewTransitionClassName(props.default, props.update);
              className === "none" ? root2 = !1 : (props = current.memoizedState, current.memoizedState = null, current = finishedWork.child, viewTransitionHostInstanceIdx = 0, root2 = measureViewTransitionHostInstancesRecursive(
                finishedWork,
                current,
                root2,
                state,
                className,
                props,
                !0
              ), viewTransitionHostInstanceIdx !== (props === null ? 0 : props.length) && (finishedWork.flags |= 32)), (finishedWork.flags & 4) !== 0 && root2 ? (scheduleViewTransitionEvent(
                finishedWork,
                finishedWork.memoizedProps.onUpdate
              ), viewTransitionCancelableChildren = oldName) : oldName !== null && (oldName.push.apply(oldName, viewTransitionCancelableChildren), viewTransitionCancelableChildren = oldName), viewTransitionContextChanged = (finishedWork.flags & 32) !== 0 ? !0 : i;
              break;
            default:
              recursivelyTraverseAfterMutationEffects(root2, finishedWork);
          }
      }
      function recursivelyTraverseLayoutEffects(root2, parentFiber) {
        if (parentFiber.subtreeFlags & 8772)
          for (parentFiber = parentFiber.child; parentFiber !== null; )
            commitLayoutEffectOnFiber(root2, parentFiber.alternate, parentFiber), parentFiber = parentFiber.sibling;
      }
      function recursivelyTraverseDisappearLayoutEffects(parentFiber, layoutEffectTraversalFlags$jscomp$0) {
        for (parentFiber = parentFiber.child; parentFiber !== null; ) {
          var finishedWork = parentFiber, layoutEffectTraversalFlags = layoutEffectTraversalFlags$jscomp$0;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
              commitHookEffectListUnmount(4, finishedWork, finishedWork.return), recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 1:
              safelyDetachRef(finishedWork, finishedWork.return);
              var instance = finishedWork.stateNode;
              typeof instance.componentWillUnmount == "function" && safelyCallComponentWillUnmount(
                finishedWork,
                finishedWork.return,
                instance
              ), recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 27:
              (layoutEffectTraversalFlags & 2) !== 0 && releaseSingletonInstance(
                finishedWork.stateNode,
                finishedWork.type,
                finishedWork.memoizedProps
              );
            case 5:
              safelyDetachRef(finishedWork, finishedWork.return), finishedWork.tag !== 5 && finishedWork.tag !== 27 || commitFragmentInstanceDeletionEffects(finishedWork), recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 6:
              commitFragmentInstanceDeletionEffects(finishedWork);
              break;
            case 26:
              safelyDetachRef(finishedWork, finishedWork.return), instance = finishedWork.stateNode, finishedWork.memoizedState !== null || instance === null || offscreenSubtreeWasHidden || instance.parentNode.removeChild(instance), recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 22:
              finishedWork.memoizedState === null && recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 30:
              safelyDetachRef(finishedWork, finishedWork.return), recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 7:
              safelyDetachRef(finishedWork, finishedWork.return);
            default:
              recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
          }
          parentFiber = parentFiber.sibling;
        }
      }
      function recursivelyTraverseReappearLayoutEffects(finishedRoot$jscomp$0, parentFiber, layoutEffectTraversalFlags) {
        for (layoutEffectTraversalFlags = (parentFiber.subtreeFlags & 8772) !== 0 ? layoutEffectTraversalFlags : layoutEffectTraversalFlags & -2, parentFiber = parentFiber.child; parentFiber !== null; ) {
          var current = parentFiber.alternate, finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, flags = finishedWork.flags, includeWorkInProgressEffects = (layoutEffectTraversalFlags & 1) !== 0;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 15:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              ), commitHookEffectListMount(4, finishedWork);
              break;
            case 1:
              if (recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              ), current = finishedWork, finishedRoot = current.stateNode, typeof finishedRoot.componentDidMount == "function")
                try {
                  finishedRoot.componentDidMount();
                } catch (error) {
                  captureCommitPhaseError(current, current.return, error);
                }
              if (current = finishedWork, finishedRoot = current.updateQueue, finishedRoot !== null) {
                var instance = current.stateNode;
                try {
                  var hiddenCallbacks = finishedRoot.shared.hiddenCallbacks;
                  if (hiddenCallbacks !== null)
                    for (finishedRoot.shared.hiddenCallbacks = null, finishedRoot = 0; finishedRoot < hiddenCallbacks.length; finishedRoot++)
                      callCallback(hiddenCallbacks[finishedRoot], instance);
                } catch (error) {
                  captureCommitPhaseError(current, current.return, error);
                }
              }
              includeWorkInProgressEffects && flags & 64 && commitClassCallbacks(finishedWork), safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 27:
              (layoutEffectTraversalFlags & 2) !== 0 && commitHostSingletonAcquisition(finishedWork);
            case 5:
              finishedWork.tag !== 5 && finishedWork.tag !== 27 || commitFragmentInstanceInsertionEffects(finishedWork), recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              ), includeWorkInProgressEffects && current === null && flags & 4 && commitHostMount(finishedWork), safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 6:
              commitFragmentInstanceInsertionEffects(finishedWork);
              break;
            case 26:
              instance = finishedWork.stateNode, finishedWork.memoizedState !== null || instance === null || offscreenSubtreeIsHidden || mountHoistable(
                getHoistableRoot(instance.ownerDocument),
                finishedWork.type,
                instance
              ), recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              ), includeWorkInProgressEffects && current === null && flags & 4 && commitHostMount(finishedWork), safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 12:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 31:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              ), includeWorkInProgressEffects && flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
              break;
            case 13:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              ), includeWorkInProgressEffects && flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
              break;
            case 22:
              finishedWork.memoizedState === null && recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              ), safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 30:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              ), safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 7:
              safelyAttachRef(finishedWork, finishedWork.return);
            default:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
          }
          parentFiber = parentFiber.sibling;
        }
      }
      function commitOffscreenPassiveMountEffects(current, finishedWork) {
        var previousCache = null;
        current !== null && current.memoizedState !== null && current.memoizedState.cachePool !== null && (previousCache = current.memoizedState.cachePool.pool), current = null, finishedWork.memoizedState !== null && finishedWork.memoizedState.cachePool !== null && (current = finishedWork.memoizedState.cachePool.pool), current !== previousCache && (current != null && current.refCount++, previousCache != null && releaseCache(previousCache));
      }
      function commitCachePassiveMountEffect(current, finishedWork) {
        current = null, finishedWork.alternate !== null && (current = finishedWork.alternate.memoizedState.cache), finishedWork = finishedWork.memoizedState.cache, finishedWork !== current && (finishedWork.refCount++, current != null && releaseCache(current));
      }
      function recursivelyTraversePassiveMountEffects(root2, parentFiber, committedLanes, committedTransitions) {
        var isViewTransitionEligible = (committedLanes & 335544064) === committedLanes;
        if (parentFiber.subtreeFlags & (isViewTransitionEligible ? 10262 : 10256))
          for (parentFiber = parentFiber.child; parentFiber !== null; )
            commitPassiveMountOnFiber(
              root2,
              parentFiber,
              committedLanes,
              committedTransitions
            ), parentFiber = parentFiber.sibling;
        else isViewTransitionEligible && restoreNestedViewTransitions(parentFiber);
      }
      function commitPassiveMountOnFiber(finishedRoot, finishedWork, committedLanes, committedTransitions) {
        var isViewTransitionEligible = (committedLanes & 335544064) === committedLanes;
        isViewTransitionEligible && finishedWork.alternate === null && finishedWork.return !== null && finishedWork.return.alternate !== null && restoreEnterOrExitViewTransitions(finishedWork);
        var flags = finishedWork.flags;
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ), flags & 2048 && commitHookEffectListMount(9, finishedWork);
            break;
          case 1:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            break;
          case 3:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ), isViewTransitionEligible && rootViewTransitionNameCanceled && (finishedRoot = finishedRoot.containerInfo, finishedRoot = finishedRoot.nodeType === 9 ? finishedRoot.body : finishedRoot.nodeName === "HTML" ? finishedRoot.ownerDocument.body : finishedRoot, finishedRoot.style.viewTransitionName === "root" && (finishedRoot.style.viewTransitionName = ""), finishedRoot = finishedRoot.ownerDocument.documentElement, finishedRoot !== null && finishedRoot.style.viewTransitionName === "none" && (finishedRoot.style.viewTransitionName = "")), flags & 2048 && (flags = null, finishedWork.alternate !== null && (flags = finishedWork.alternate.memoizedState.cache), finishedWork = finishedWork.memoizedState.cache, finishedWork !== flags && (finishedWork.refCount++, flags != null && releaseCache(flags)));
            break;
          case 12:
            if (flags & 2048) {
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions
              ), flags = finishedWork.stateNode;
              try {
                var _finishedWork$memoize2 = finishedWork.memoizedProps, id = _finishedWork$memoize2.id, onPostCommit = _finishedWork$memoize2.onPostCommit;
                typeof onPostCommit == "function" && onPostCommit(
                  id,
                  finishedWork.alternate === null ? "mount" : "update",
                  flags.passiveEffectDuration,
                  -0
                );
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            } else
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions
              );
            break;
          case 31:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            break;
          case 13:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            break;
          case 23:
            break;
          case 22:
            _finishedWork$memoize2 = finishedWork.stateNode, id = finishedWork.alternate, finishedWork.memoizedState !== null ? (isViewTransitionEligible && id !== null && id.memoizedState === null && restoreEnterOrExitViewTransitions(id), _finishedWork$memoize2._visibility & 2 ? recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ) : recursivelyTraverseAtomicPassiveEffects(
              finishedRoot,
              finishedWork
            )) : (isViewTransitionEligible && id !== null && id.memoizedState !== null && restoreEnterOrExitViewTransitions(finishedWork), _finishedWork$memoize2._visibility & 2 ? recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ) : (_finishedWork$memoize2._visibility |= 2, recursivelyTraverseReconnectPassiveEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions,
              (finishedWork.subtreeFlags & 10256) !== 0 || !1
            ))), flags & 2048 && commitOffscreenPassiveMountEffects(id, finishedWork);
            break;
          case 24:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ), flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
            break;
          case 30:
            isViewTransitionEligible && (flags = finishedWork.alternate, flags !== null && (restoreViewTransitionOnHostInstances(flags.child, !0), restoreViewTransitionOnHostInstances(finishedWork.child, !0))), recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            break;
          default:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
        }
      }
      function recursivelyTraverseReconnectPassiveEffects(finishedRoot$jscomp$0, parentFiber, committedLanes$jscomp$0, committedTransitions$jscomp$0, includeWorkInProgressEffects) {
        for (includeWorkInProgressEffects = includeWorkInProgressEffects && ((parentFiber.subtreeFlags & 10256) !== 0 || !1), parentFiber = parentFiber.child; parentFiber !== null; ) {
          var finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, committedLanes = committedLanes$jscomp$0, committedTransitions = committedTransitions$jscomp$0, flags = finishedWork.flags;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 15:
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              ), commitHookEffectListMount(8, finishedWork);
              break;
            case 23:
              break;
            case 22:
              var instance = finishedWork.stateNode;
              finishedWork.memoizedState !== null ? instance._visibility & 2 ? recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              ) : recursivelyTraverseAtomicPassiveEffects(
                finishedRoot,
                finishedWork
              ) : (instance._visibility |= 2, recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              )), includeWorkInProgressEffects && flags & 2048 && commitOffscreenPassiveMountEffects(
                finishedWork.alternate,
                finishedWork
              );
              break;
            case 24:
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              ), includeWorkInProgressEffects && flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
              break;
            default:
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              );
          }
          parentFiber = parentFiber.sibling;
        }
      }
      function recursivelyTraverseAtomicPassiveEffects(finishedRoot$jscomp$0, parentFiber) {
        if (parentFiber.subtreeFlags & 10256)
          for (parentFiber = parentFiber.child; parentFiber !== null; ) {
            var finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, flags = finishedWork.flags;
            switch (finishedWork.tag) {
              case 22:
                recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork), flags & 2048 && commitOffscreenPassiveMountEffects(
                  finishedWork.alternate,
                  finishedWork
                );
                break;
              case 24:
                recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork), flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
                break;
              default:
                recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
            }
            parentFiber = parentFiber.sibling;
          }
      }
      var suspenseyCommitFlag = 8192;
      function recursivelyAccumulateSuspenseyCommit(parentFiber, committedLanes, suspendedState) {
        if (parentFiber.subtreeFlags & suspenseyCommitFlag)
          for (parentFiber = parentFiber.child; parentFiber !== null; )
            accumulateSuspenseyCommitOnFiber(
              parentFiber,
              committedLanes,
              suspendedState
            ), parentFiber = parentFiber.sibling;
      }
      function accumulateSuspenseyCommitOnFiber(fiber, committedLanes, suspendedState) {
        switch (fiber.tag) {
          case 26:
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            ), fiber.flags & suspenseyCommitFlag && (fiber.memoizedState !== null ? suspendResource(
              suspendedState,
              currentHoistableRoot,
              fiber.memoizedState,
              fiber.memoizedProps
            ) : (fiber = fiber.stateNode, (committedLanes & 335544128) === committedLanes && suspendInstance(suspendedState, fiber)));
            break;
          case 5:
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            ), fiber.flags & suspenseyCommitFlag && (fiber = fiber.stateNode, (committedLanes & 335544128) === committedLanes && suspendInstance(suspendedState, fiber));
            break;
          case 3:
          case 4:
            var previousHoistableRoot = currentHoistableRoot;
            currentHoistableRoot = getHoistableRoot(fiber.stateNode.containerInfo), recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            ), currentHoistableRoot = previousHoistableRoot;
            break;
          case 22:
            fiber.memoizedState === null && (previousHoistableRoot = fiber.alternate, previousHoistableRoot !== null && previousHoistableRoot.memoizedState !== null ? (previousHoistableRoot = suspenseyCommitFlag, suspenseyCommitFlag = 16777216, recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            ), suspenseyCommitFlag = previousHoistableRoot) : recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            ));
            break;
          case 30:
            if ((fiber.flags & suspenseyCommitFlag) !== 0 && (previousHoistableRoot = fiber.memoizedProps.name, previousHoistableRoot != null && previousHoistableRoot !== "auto")) {
              var state = fiber.stateNode;
              state.paired = null, appearingViewTransitions === null && (appearingViewTransitions = /* @__PURE__ */ new Map()), appearingViewTransitions.set(previousHoistableRoot, state);
            }
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            );
            break;
          default:
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            );
        }
      }
      function detachAlternateSiblings(parentFiber) {
        var previousFiber = parentFiber.alternate;
        if (previousFiber !== null && (parentFiber = previousFiber.child, parentFiber !== null)) {
          previousFiber.child = null;
          do
            previousFiber = parentFiber.sibling, parentFiber.sibling = null, parentFiber = previousFiber;
          while (parentFiber !== null);
        }
      }
      function recursivelyTraversePassiveUnmountEffects(parentFiber) {
        var deletions = parentFiber.deletions;
        if ((parentFiber.flags & 16) !== 0) {
          if (deletions !== null)
            for (var i = 0; i < deletions.length; i++) {
              var childToDelete = deletions[i];
              nextEffect = childToDelete, commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
                childToDelete,
                parentFiber
              );
            }
          detachAlternateSiblings(parentFiber);
        }
        if (parentFiber.subtreeFlags & 10256)
          for (parentFiber = parentFiber.child; parentFiber !== null; )
            commitPassiveUnmountOnFiber(parentFiber), parentFiber = parentFiber.sibling;
      }
      function commitPassiveUnmountOnFiber(finishedWork) {
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
            recursivelyTraversePassiveUnmountEffects(finishedWork), finishedWork.flags & 2048 && commitHookEffectListUnmount(9, finishedWork, finishedWork.return);
            break;
          case 3:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
          case 12:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
          case 22:
            var instance = finishedWork.stateNode;
            finishedWork.memoizedState !== null && instance._visibility & 2 && (finishedWork.return === null || finishedWork.return.tag !== 13) ? (instance._visibility &= -3, recursivelyTraverseDisconnectPassiveEffects(finishedWork)) : recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
          default:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
        }
      }
      function recursivelyTraverseDisconnectPassiveEffects(parentFiber) {
        var deletions = parentFiber.deletions;
        if ((parentFiber.flags & 16) !== 0) {
          if (deletions !== null)
            for (var i = 0; i < deletions.length; i++) {
              var childToDelete = deletions[i];
              nextEffect = childToDelete, commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
                childToDelete,
                parentFiber
              );
            }
          detachAlternateSiblings(parentFiber);
        }
        for (parentFiber = parentFiber.child; parentFiber !== null; ) {
          switch (deletions = parentFiber, deletions.tag) {
            case 0:
            case 11:
            case 15:
              commitHookEffectListUnmount(8, deletions, deletions.return), recursivelyTraverseDisconnectPassiveEffects(deletions);
              break;
            case 22:
              i = deletions.stateNode, i._visibility & 2 && (i._visibility &= -3, recursivelyTraverseDisconnectPassiveEffects(deletions));
              break;
            default:
              recursivelyTraverseDisconnectPassiveEffects(deletions);
          }
          parentFiber = parentFiber.sibling;
        }
      }
      function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(deletedSubtreeRoot, nearestMountedAncestor) {
        for (; nextEffect !== null; ) {
          var fiber = nextEffect;
          switch (fiber.tag) {
            case 0:
            case 11:
            case 15:
              commitHookEffectListUnmount(8, fiber, nearestMountedAncestor);
              break;
            case 23:
            case 22:
              if (fiber.memoizedState !== null && fiber.memoizedState.cachePool !== null) {
                var cache = fiber.memoizedState.cachePool.pool;
                cache != null && cache.refCount++;
              }
              break;
            case 24:
              releaseCache(fiber.memoizedState.cache);
          }
          if (cache = fiber.child, cache !== null) cache.return = fiber, nextEffect = cache;
          else
            a: for (fiber = deletedSubtreeRoot; nextEffect !== null; ) {
              cache = nextEffect;
              var sibling = cache.sibling, returnFiber = cache.return;
              if (detachFiberAfterEffects(cache), cache === fiber) {
                nextEffect = null;
                break a;
              }
              if (sibling !== null) {
                sibling.return = returnFiber, nextEffect = sibling;
                break a;
              }
              nextEffect = returnFiber;
            }
        }
      }