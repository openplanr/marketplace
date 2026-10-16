
      function commitHookEffectListMount(flags, finishedWork) {
        try {
          var updateQueue = finishedWork.updateQueue, lastEffect = null !== updateQueue ? updateQueue.lastEffect : null;
          if (null !== lastEffect) {
            var firstEffect = lastEffect.next;
            updateQueue = firstEffect;
            do {
              if ((updateQueue.tag & flags) === flags) {
                lastEffect = void 0;
                var create = updateQueue.create, inst = updateQueue.inst;
                lastEffect = create();
                inst.destroy = lastEffect;
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
          var updateQueue = finishedWork.updateQueue, lastEffect = null !== updateQueue ? updateQueue.lastEffect : null;
          if (null !== lastEffect) {
            var firstEffect = lastEffect.next;
            updateQueue = firstEffect;
            do {
              if ((updateQueue.tag & flags) === flags) {
                var inst = updateQueue.inst, destroy = inst.destroy;
                if (void 0 !== destroy) {
                  inst.destroy = void 0;
                  lastEffect = finishedWork;
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
        if (null !== updateQueue) {
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
        );
        instance.state = current.memoizedState;
        try {
          instance.componentWillUnmount();
        } catch (error) {
          captureCommitPhaseError(current, nearestMountedAncestor, error);
        }
      }
      function safelyAttachRef(current, nearestMountedAncestor) {
        try {
          var ref = current.ref;
          if (null !== ref) {
            switch (current.tag) {
              case 26:
              case 27:
              case 5:
                var instanceToUse = current.stateNode;
                break;
              case 30:
                var instance = current.stateNode, name = getViewTransitionName(current.memoizedProps, instance);
                if (null === instance.ref || instance.ref.name !== name)
                  instance.ref = createViewTransitionInstance(name);
                instanceToUse = instance.ref;
                break;
              case 7:
                if (null === current.stateNode) {
                  var fragmentInstance = new FragmentInstance(current);
                  traverseVisibleInstancesAndTextInstances(
                    current.child,
                    false,
                    addFragmentHandleToFiber,
                    fragmentInstance,
                    void 0,
                    void 0
                  );
                  current.stateNode = fragmentInstance;
                }
                instanceToUse = current.stateNode;
                break;
              default:
                instanceToUse = current.stateNode;
            }
            "function" === typeof ref ? current.refCleanup = ref(instanceToUse) : ref.current = instanceToUse;
          }
        } catch (error) {
          captureCommitPhaseError(current, nearestMountedAncestor, error);
        }
      }
      function safelyDetachRef(current, nearestMountedAncestor) {
        var ref = current.ref, refCleanup = current.refCleanup;
        if (null !== ref)
          if ("function" === typeof refCleanup)
            try {
              refCleanup();
            } catch (error) {
              captureCommitPhaseError(current, nearestMountedAncestor, error);
            } finally {
              current.refCleanup = null, current = current.alternate, null != current && (current.refCleanup = null);
            }
          else if ("function" === typeof ref)
            try {
              ref(null);
            } catch (error$148) {
              captureCommitPhaseError(current, nearestMountedAncestor, error$148);
            }
          else ref.current = null;
      }
      function commitNewChildToFragmentInstances(fiber, parentFragmentInstances) {
        if ((5 === fiber.tag || 27 === fiber.tag || 6 === fiber.tag) && null === fiber.alternate && null !== parentFragmentInstances)
          for (var i = 0; i < parentFragmentInstances.length; i++)
            commitNewChildToFragmentInstance(
              fiber.stateNode,
              parentFragmentInstances[i]
            );
      }
      function commitFragmentInstanceInsertionEffects(fiber) {
        for (var parent = fiber.return; null !== parent; ) {
          isFragmentInstanceParent(parent) && commitNewChildToFragmentInstance(fiber.stateNode, parent.stateNode);
          if (isFragmentInstanceHostBoundary(parent)) break;
          parent = parent.return;
        }
      }
      function commitFragmentInstanceDeletionEffects(fiber) {
        for (var parent = fiber.return; null !== parent; ) {
          isFragmentInstanceParent(parent) && deleteChildFromFragmentInstance(fiber.stateNode, parent.stateNode);
          if (isFragmentInstanceHostBoundary(parent)) break;
          parent = parent.return;
        }
      }
      function isFragmentInstanceHostBoundary(fiber) {
        return 5 === fiber.tag || 3 === fiber.tag || 27 === fiber.tag;
      }
      function isFragmentInstanceParent(fiber) {
        return fiber && 7 === fiber.tag && null !== fiber.stateNode;
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
          updateProperties(domElement, finishedWork.type, oldProps, newProps);
          domElement[internalPropsKey] = newProps;
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      function isHostParent(fiber) {
        return 5 === fiber.tag || 3 === fiber.tag || 26 === fiber.tag || 27 === fiber.tag && isSingletonScope(fiber.type) || 4 === fiber.tag;
      }
      function getHostSibling(fiber) {
        a: for (; ; ) {
          for (; null === fiber.sibling; ) {
            if (null === fiber.return || isHostParent(fiber.return)) return null;
            fiber = fiber.return;
          }
          fiber.sibling.return = fiber.return;
          for (fiber = fiber.sibling; 5 !== fiber.tag && 6 !== fiber.tag && 18 !== fiber.tag; ) {
            if (27 === fiber.tag && isSingletonScope(fiber.type)) continue a;
            if (fiber.flags & 2) continue a;
            if (null === fiber.child || 4 === fiber.tag) continue a;
            else fiber.child.return = fiber, fiber = fiber.child;
          }
          if (!(fiber.flags & 2)) return fiber.stateNode;
        }
      }
      function insertOrAppendPlacementNodeIntoContainer(node, before, parent, parentFragmentInstances) {
        var tag = node.tag;
        if (5 === tag || 6 === tag)
          tag = node.stateNode, before ? (9 === parent.nodeType ? parent.body : "HTML" === parent.nodeName ? parent.ownerDocument.body : parent).insertBefore(tag, before) : (before = 9 === parent.nodeType ? parent.body : "HTML" === parent.nodeName ? parent.ownerDocument.body : parent, before.appendChild(tag), parent = parent._reactRootContainer, null !== parent && void 0 !== parent || null !== before.onclick || (before.onclick = noop$1)), commitNewChildToFragmentInstances(node, parentFragmentInstances), viewTransitionMutationContext = true;
        else if (4 !== tag && (27 === tag && (commitNewChildToFragmentInstances(node, parentFragmentInstances), parentFragmentInstances = null, isSingletonScope(node.type) && (parent = node.stateNode, before = null)), node = node.child, null !== node))
          for (insertOrAppendPlacementNodeIntoContainer(
            node,
            before,
            parent,
            parentFragmentInstances
          ), node = node.sibling; null !== node; )
            insertOrAppendPlacementNodeIntoContainer(
              node,
              before,
              parent,
              parentFragmentInstances
            ), node = node.sibling;
      }
      function insertOrAppendPlacementNode(node, before, parent, parentFragmentInstances) {
        var tag = node.tag;
        if (5 === tag || 6 === tag)
          tag = node.stateNode, before ? parent.insertBefore(tag, before) : parent.appendChild(tag), commitNewChildToFragmentInstances(node, parentFragmentInstances), viewTransitionMutationContext = true;
        else if (4 !== tag && (27 === tag && (commitNewChildToFragmentInstances(node, parentFragmentInstances), parentFragmentInstances = null, isSingletonScope(node.type) && (parent = node.stateNode)), node = node.child, null !== node))
          for (insertOrAppendPlacementNode(
            node,
            before,
            parent,
            parentFragmentInstances
          ), node = node.sibling; null !== node; )
            insertOrAppendPlacementNode(
              node,
              before,
              parent,
              parentFragmentInstances
            ), node = node.sibling;
      }
      function commitHostSingletonAcquisition(finishedWork) {
        var singleton = finishedWork.stateNode, props = finishedWork.memoizedProps;
        try {
          for (var type = finishedWork.type, attributes = singleton.attributes; attributes.length; )
            singleton.removeAttributeNode(attributes[0]);
          setInitialProperties(singleton, type, props);
          singleton[internalInstanceKey] = finishedWork;
          singleton[internalPropsKey] = props;
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      var shouldStartViewTransition = false;
      var appearingViewTransitions = null;
      function trackEnterViewTransitions(placement) {
        if (30 === placement.tag || 0 !== (placement.subtreeFlags & 33554432))
          shouldStartViewTransition = true;
      }
      var viewTransitionCancelableChildren = null;
      function pushViewTransitionCancelableScope() {
        var prevChildren = viewTransitionCancelableChildren;
        viewTransitionCancelableChildren = null;
        return prevChildren;
      }
      var viewTransitionHostInstanceIdx = 0;
      function applyViewTransitionToHostInstances(fiber, name, className, collectMeasurements, stopAtNestedViewTransitions) {
        viewTransitionHostInstanceIdx = 0;
        return applyViewTransitionToHostInstancesRecursive(
          fiber.child,
          name,
          className,
          collectMeasurements,
          stopAtNestedViewTransitions
        );
      }
      function applyViewTransitionToHostInstancesRecursive(child, name, className, collectMeasurements, stopAtNestedViewTransitions) {
        for (var inViewport = false; null !== child; ) {
          if (5 === child.tag) {
            var instance = child.stateNode;
            if (null !== collectMeasurements) {
              var measurement = measureInstance(instance);
              collectMeasurements.push(measurement);
              measurement.view && (inViewport = true);
            } else
              inViewport || measureInstance(instance).view && (inViewport = true);
            shouldStartViewTransition = true;
            applyViewTransitionName(
              instance,
              0 === viewTransitionHostInstanceIdx ? name : name + "_" + viewTransitionHostInstanceIdx,
              className
            );
            viewTransitionHostInstanceIdx++;
          } else if (22 !== child.tag || null === child.memoizedState)
            30 === child.tag && stopAtNestedViewTransitions || applyViewTransitionToHostInstancesRecursive(
              child.child,
              name,
              className,
              collectMeasurements,
              stopAtNestedViewTransitions
            ) && (inViewport = true);
          child = child.sibling;
        }
        return inViewport;
      }
      function restoreViewTransitionOnHostInstances(child, stopAtNestedViewTransitions) {
        for (; null !== child; ) {
          if (5 === child.tag)
            restoreViewTransitionName(child.stateNode, child.memoizedProps);
          else if (22 !== child.tag || null === child.memoizedState)
            30 === child.tag && stopAtNestedViewTransitions || restoreViewTransitionOnHostInstances(
              child.child,
              stopAtNestedViewTransitions
            );
          child = child.sibling;
        }
      }
      function commitAppearingPairViewTransitions(placement) {
        if (0 !== (placement.subtreeFlags & 18874368))
          for (placement = placement.child; null !== placement; ) {
            if (22 !== placement.tag || null === placement.memoizedState) {
              if (commitAppearingPairViewTransitions(placement), 30 === placement.tag && 0 !== (placement.flags & 18874368) && placement.stateNode.paired) {
                var props = placement.memoizedProps;
                if (null == props.name || "auto" === props.name)
                  throw Error(formatProdErrorMessage(544));
                var name = props.name;
                props = getViewTransitionClassName(props.default, props.share);
                "none" !== props && (applyViewTransitionToHostInstances(
                  placement,
                  name,
                  props,
                  null,
                  false
                ) || restoreViewTransitionOnHostInstances(placement.child, false));
              }
            }
            placement = placement.sibling;
          }
      }
      function commitEnterViewTransitions(placement, gesture) {
        if (30 === placement.tag) {
          var state = placement.stateNode, props = placement.memoizedProps, name = getViewTransitionName(props, state), className = getViewTransitionClassName(
            props.default,
            state.paired ? props.share : props.enter
          );
          "none" !== className ? applyViewTransitionToHostInstances(placement, name, className, null, false) ? (commitAppearingPairViewTransitions(placement), state.paired || gesture || scheduleViewTransitionEvent(placement, props.onEnter)) : restoreViewTransitionOnHostInstances(placement.child, false) : commitAppearingPairViewTransitions(placement);
        } else if (0 !== (placement.subtreeFlags & 33554432))
          for (placement = placement.child; null !== placement; )
            commitEnterViewTransitions(placement, gesture), placement = placement.sibling;
        else commitAppearingPairViewTransitions(placement);
      }
      function commitDeletedPairViewTransitions(deletion) {
        if (null !== appearingViewTransitions && 0 !== appearingViewTransitions.size) {
          var pairs = appearingViewTransitions;
          if (0 !== (deletion.subtreeFlags & 18874368))
            for (deletion = deletion.child; null !== deletion; ) {
              if (22 !== deletion.tag || null === deletion.memoizedState) {
                if (30 === deletion.tag && 0 !== (deletion.flags & 18874368)) {
                  var props = deletion.memoizedProps, name = props.name;
                  if (null != name && "auto" !== name) {
                    var pair = pairs.get(name);
                    if (void 0 !== pair) {
                      var className = getViewTransitionClassName(
                        props.default,
                        props.share
                      );
                      "none" !== className && (applyViewTransitionToHostInstances(
                        deletion,
                        name,
                        className,
                        null,
                        false
                      ) ? (className = deletion.stateNode, pair.paired = className, className.paired = pair, scheduleViewTransitionEvent(deletion, props.onShare)) : restoreViewTransitionOnHostInstances(deletion.child, false));
                      pairs.delete(name);
                      if (0 === pairs.size) break;
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
        if (30 === deletion.tag) {
          var props = deletion.memoizedProps, name = getViewTransitionName(props, deletion.stateNode), pair = null !== appearingViewTransitions ? appearingViewTransitions.get(name) : void 0, className = getViewTransitionClassName(
            props.default,
            void 0 !== pair ? props.share : props.exit
          );
          "none" !== className && (applyViewTransitionToHostInstances(deletion, name, className, null, false) ? void 0 !== pair ? (className = deletion.stateNode, pair.paired = className, className.paired = pair, appearingViewTransitions.delete(name), scheduleViewTransitionEvent(deletion, props.onShare)) : scheduleViewTransitionEvent(deletion, props.onExit) : restoreViewTransitionOnHostInstances(deletion.child, false));
          null !== appearingViewTransitions && commitDeletedPairViewTransitions(deletion);
        } else if (0 !== (deletion.subtreeFlags & 33554432))
          for (deletion = deletion.child; null !== deletion; )
            commitExitViewTransitions(deletion), deletion = deletion.sibling;
        else
          null !== appearingViewTransitions && commitDeletedPairViewTransitions(deletion);
      }
      function commitNestedViewTransitions(changedParent) {
        for (changedParent = changedParent.child; null !== changedParent; ) {
          if (30 === changedParent.tag) {
            var props = changedParent.memoizedProps, name = getViewTransitionName(props, changedParent.stateNode);
            props = getViewTransitionClassName(props.default, props.update);
            changedParent.flags &= -5;
            "none" !== props && applyViewTransitionToHostInstances(
              changedParent,
              name,
              props,
              changedParent.memoizedState = [],
              false
            );
          } else
            0 !== (changedParent.subtreeFlags & 33554432) && commitNestedViewTransitions(changedParent);
          changedParent = changedParent.sibling;
        }
      }
      function restorePairedViewTransitions(parent) {
        if (0 !== (parent.subtreeFlags & 18874368))
          for (parent = parent.child; null !== parent; ) {
            if (22 !== parent.tag || null === parent.memoizedState) {
              if (30 === parent.tag && 0 !== (parent.flags & 18874368)) {
                var instance = parent.stateNode;
                null !== instance.paired && (instance.paired = null, restoreViewTransitionOnHostInstances(parent.child, false));
              }
              restorePairedViewTransitions(parent);
            }
            parent = parent.sibling;
          }
      }
      function restoreEnterOrExitViewTransitions(fiber) {
        if (30 === fiber.tag)
          fiber.stateNode.paired = null, restoreViewTransitionOnHostInstances(fiber.child, false), restorePairedViewTransitions(fiber);
        else if (0 !== (fiber.subtreeFlags & 33554432))
          for (fiber = fiber.child; null !== fiber; )
            restoreEnterOrExitViewTransitions(fiber), fiber = fiber.sibling;
        else restorePairedViewTransitions(fiber);
      }
      function restoreNestedViewTransitions(changedParent) {
        for (changedParent = changedParent.child; null !== changedParent; )
          30 === changedParent.tag ? restoreViewTransitionOnHostInstances(changedParent.child, false) : 0 !== (changedParent.subtreeFlags & 33554432) && restoreNestedViewTransitions(changedParent), changedParent = changedParent.sibling;
      }
      function measureViewTransitionHostInstancesRecursive(parentViewTransition, child, newName, oldName, className, previousMeasurements, stopAtNestedViewTransitions) {
        for (var inViewport = false; null !== child; ) {
          if (5 === child.tag) {
            var instance = child.stateNode;
            if (null !== previousMeasurements && viewTransitionHostInstanceIdx < previousMeasurements.length) {
              var previousMeasurement = previousMeasurements[viewTransitionHostInstanceIdx], nextMeasurement = measureInstance(instance);
              if (previousMeasurement.view || nextMeasurement.view) inViewport = true;
              var JSCompiler_temp;
              if (JSCompiler_temp = 0 === (parentViewTransition.flags & 4))
                if (nextMeasurement.clip) JSCompiler_temp = true;
                else {
                  JSCompiler_temp = previousMeasurement.rect;
                  var newRect = nextMeasurement.rect;
                  JSCompiler_temp = JSCompiler_temp.y !== newRect.y || JSCompiler_temp.x !== newRect.x || JSCompiler_temp.height !== newRect.height || JSCompiler_temp.width !== newRect.width;
                }
              JSCompiler_temp && (parentViewTransition.flags |= 4);
              nextMeasurement.abs ? nextMeasurement = !previousMeasurement.abs : (previousMeasurement = previousMeasurement.rect, nextMeasurement = nextMeasurement.rect, nextMeasurement = previousMeasurement.height !== nextMeasurement.height || previousMeasurement.width !== nextMeasurement.width);
              nextMeasurement && (parentViewTransition.flags |= 32);
            } else parentViewTransition.flags |= 32;
            0 !== (parentViewTransition.flags & 4) && applyViewTransitionName(
              instance,
              0 === viewTransitionHostInstanceIdx ? newName : newName + "_" + viewTransitionHostInstanceIdx,
              className
            );
            inViewport && 0 !== (parentViewTransition.flags & 4) || (null === viewTransitionCancelableChildren && (viewTransitionCancelableChildren = []), viewTransitionCancelableChildren.push(
              instance,
              0 === viewTransitionHostInstanceIdx ? oldName : oldName + "_" + viewTransitionHostInstanceIdx,
              child.memoizedProps
            ));
            viewTransitionHostInstanceIdx++;
          } else if (22 !== child.tag || null === child.memoizedState)
            30 === child.tag && stopAtNestedViewTransitions ? parentViewTransition.flags |= child.flags & 32 : measureViewTransitionHostInstancesRecursive(
              parentViewTransition,
              child.child,
              newName,
              oldName,
              className,
              previousMeasurements,
              stopAtNestedViewTransitions
            ) && (inViewport = true);
          child = child.sibling;
        }
        return inViewport;
      }
      function measureNestedViewTransitions(changedParent, gesture) {
        for (changedParent = changedParent.child; null !== changedParent; ) {
          if (30 === changedParent.tag) {
            var props = changedParent.memoizedProps, state = changedParent.stateNode, name = getViewTransitionName(props, state), className = getViewTransitionClassName(props.default, props.update);
            if (gesture) {
              state = state.clones;
              var previousMeasurements = null === state ? null : state.map(measureClonedInstance);
            } else
              previousMeasurements = changedParent.memoizedState, changedParent.memoizedState = null;
            state = changedParent;
            var child = changedParent.child;
            viewTransitionHostInstanceIdx = 0;
            name = measureViewTransitionHostInstancesRecursive(
              state,
              child,
              name,
              name,
              className,
              previousMeasurements,
              false
            );
            0 !== (changedParent.flags & 4) && name && (gesture || scheduleViewTransitionEvent(changedParent, props.onUpdate));
          } else
            0 !== (changedParent.subtreeFlags & 33554432) && measureNestedViewTransitions(changedParent, gesture);
          changedParent = changedParent.sibling;
        }
      }
      var offscreenSubtreeIsHidden = false;
      var offscreenSubtreeWasHidden = false;
      var offscreenDirectParentIsHidden = false;
      var needsFormReset = false;
      var PossiblyWeakSet = "function" === typeof WeakSet ? WeakSet : Set;
      var nextEffect = null;
      var viewTransitionContextChanged = false;
      var inUpdateViewTransition = false;
      var rootViewTransitionAffected = false;
      var rootViewTransitionNameCanceled = false;
      function commitBeforeMutationEffects(root2, firstChild, committedLanes) {
        root2 = root2.containerInfo;
        eventsEnabled = _enabled;
        root2 = getActiveElementDeep(root2);
        if (hasSelectionCapabilities(root2)) {
          if ("selectionStart" in root2)
            var JSCompiler_temp = {
              start: root2.selectionStart,
              end: root2.selectionEnd
            };
          else
            a: {
              JSCompiler_temp = (JSCompiler_temp = root2.ownerDocument) && JSCompiler_temp.defaultView || window;
              var selection = JSCompiler_temp.getSelection && JSCompiler_temp.getSelection();
              if (selection && 0 !== selection.rangeCount) {
                JSCompiler_temp = selection.anchorNode;
                var anchorOffset = selection.anchorOffset, focusNode = selection.focusNode;
                selection = selection.focusOffset;
                try {
                  JSCompiler_temp.nodeType, focusNode.nodeType;
                } catch (e$21) {
                  JSCompiler_temp = null;
                  break a;
                }
                var length = 0, start2 = -1, end = -1, indexWithinAnchor = 0, indexWithinFocus = 0, node = root2, parentNode = null;
                b: for (; ; ) {
                  for (var next; ; ) {
                    node !== JSCompiler_temp || 0 !== anchorOffset && 3 !== node.nodeType || (start2 = length + anchorOffset);
                    node !== focusNode || 0 !== selection && 3 !== node.nodeType || (end = length + selection);
                    3 === node.nodeType && (length += node.nodeValue.length);
                    if (null === (next = node.firstChild)) break;
                    parentNode = node;
                    node = next;
                  }
                  for (; ; ) {
                    if (node === root2) break b;
                    parentNode === JSCompiler_temp && ++indexWithinAnchor === anchorOffset && (start2 = length);
                    parentNode === focusNode && ++indexWithinFocus === selection && (end = length);
                    if (null !== (next = node.nextSibling)) break;
                    node = parentNode;
                    parentNode = node.parentNode;
                  }
                  node = next;
                }
                JSCompiler_temp = -1 === start2 || -1 === end ? null : { start: start2, end };
              } else JSCompiler_temp = null;
            }
          JSCompiler_temp = JSCompiler_temp || { start: 0, end: 0 };
        } else JSCompiler_temp = null;
        selectionInformation = { focusedElem: root2, selectionRange: JSCompiler_temp };
        _enabled = false;
        committedLanes = (committedLanes & 335544064) === committedLanes;
        nextEffect = firstChild;
        for (firstChild = committedLanes ? 9270 : 1024; null !== nextEffect; ) {
          root2 = nextEffect;
          if (committedLanes && (JSCompiler_temp = root2.deletions, null !== JSCompiler_temp))
            for (anchorOffset = 0; anchorOffset < JSCompiler_temp.length; anchorOffset++)
              committedLanes && commitExitViewTransitions(JSCompiler_temp[anchorOffset]);
          if (null === root2.alternate && 0 !== (root2.flags & 2))
            committedLanes && trackEnterViewTransitions(root2), commitBeforeMutationEffects_complete(committedLanes);
          else {
            if (22 === root2.tag) {
              if (JSCompiler_temp = root2.alternate, null !== root2.memoizedState) {
                null !== JSCompiler_temp && null === JSCompiler_temp.memoizedState && committedLanes && commitExitViewTransitions(JSCompiler_temp);
                commitBeforeMutationEffects_complete(committedLanes);
                continue;
              } else if (null !== JSCompiler_temp && null !== JSCompiler_temp.memoizedState) {
                committedLanes && trackEnterViewTransitions(root2);
                commitBeforeMutationEffects_complete(committedLanes);
                continue;
              }
            }
            JSCompiler_temp = root2.child;
            0 !== (root2.subtreeFlags & firstChild) && null !== JSCompiler_temp ? (JSCompiler_temp.return = root2, nextEffect = JSCompiler_temp) : (committedLanes && commitNestedViewTransitions(root2), commitBeforeMutationEffects_complete(committedLanes));
          }
        }
        appearingViewTransitions = null;
      }
      function commitBeforeMutationEffects_complete(isViewTransitionEligible$jscomp$0) {
        for (; null !== nextEffect; ) {
          var fiber = nextEffect, isViewTransitionEligible = isViewTransitionEligible$jscomp$0, current = fiber.alternate, flags = fiber.flags;
          switch (fiber.tag) {
            case 0:
            case 11:
            case 15:
              break;
            case 1:
              if (0 !== (flags & 1024) && null !== current) {
                isViewTransitionEligible = void 0;
                flags = current.memoizedProps;
                current = current.memoizedState;
                var instance = fiber.stateNode;
                try {
                  var resolvedPrevProps = resolveClassComponentProps(
                    fiber.type,
                    flags
                  );
                  isViewTransitionEligible = instance.getSnapshotBeforeUpdate(
                    resolvedPrevProps,
                    current
                  );
                  instance.__reactInternalSnapshotBeforeUpdate = isViewTransitionEligible;
                } catch (error) {
                  captureCommitPhaseError(fiber, fiber.return, error);
                }
              }
              break;
            case 3:
              if (0 !== (flags & 1024)) {
                if (current = fiber.stateNode.containerInfo, isViewTransitionEligible = current.nodeType, 9 === isViewTransitionEligible)
                  clearContainerSparingly(current);
                else if (1 === isViewTransitionEligible)
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
              isViewTransitionEligible && null !== current && (isViewTransitionEligible = getViewTransitionName(
                current.memoizedProps,
                current.stateNode
              ), flags = fiber.memoizedProps, flags = getViewTransitionClassName(flags.default, flags.update), "none" !== flags && applyViewTransitionToHostInstances(
                current,
                isViewTransitionEligible,
                flags,
                current.memoizedState = [],
                true
              ));
              break;
            default:
              if (0 !== (flags & 1024)) throw Error(formatProdErrorMessage(163));
          }
          current = fiber.sibling;
          if (null !== current) {
            current.return = fiber.return;
            nextEffect = current;
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
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            flags & 4 && commitHookEffectListMount(5, finishedWork);
            break;
          case 1:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            if (flags & 4)
              if (finishedRoot = finishedWork.stateNode, null === current)
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
            flags & 64 && commitClassCallbacks(finishedWork);
            flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
            break;
          case 3:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            if (flags & 64 && (finishedRoot = finishedWork.updateQueue, null !== finishedRoot)) {
              current = null;
              if (null !== finishedWork.child)
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
            null === current && flags & 4 && commitHostSingletonAcquisition(finishedWork);
          case 26:
          case 5:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            null === current && flags & 4 && commitHostMount(finishedWork);
            flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
            break;
          case 12:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            break;
          case 31:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
            break;
          case 13:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
            flags & 64 && (finishedRoot = finishedWork.memoizedState, null !== finishedRoot && (finishedRoot = finishedRoot.dehydrated, null !== finishedRoot && (finishedWork = retryDehydratedSuspenseBoundary.bind(
              null,
              finishedWork
            ), registerSuspenseInstanceRetry(finishedRoot, finishedWork))));
            break;
          case 22:
            flags = null !== finishedWork.memoizedState || offscreenSubtreeIsHidden;
            if (!flags) {
              var newOffscreenSubtreeWasHidden = null !== current && null !== current.memoizedState || offscreenSubtreeWasHidden;
              current = offscreenSubtreeIsHidden;
              prevProps = offscreenSubtreeWasHidden;
              offscreenSubtreeIsHidden = flags;
              (offscreenSubtreeWasHidden = newOffscreenSubtreeWasHidden) && !prevProps ? (flags = 2, 0 !== (finishedWork.subtreeFlags & 8772) && (flags |= 1), recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                flags
              )) : recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
              offscreenSubtreeIsHidden = current;
              offscreenSubtreeWasHidden = prevProps;
            }
            break;
          case 30:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
            break;
          case 7:
            flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
          default:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
        }
      }
      function hideOrUnhideAllChildren(parentFiber, isHidden2) {
        for (parentFiber = parentFiber.child; null !== parentFiber; )
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
                "function" === typeof style2.setProperty ? style2.setProperty("display", "none", "important") : style2.display = "none";
              } else {
                var instance$jscomp$0 = fiber.stateNode, styleProp = fiber.memoizedProps.style, display = void 0 !== styleProp && null !== styleProp && styleProp.hasOwnProperty("display") ? styleProp.display : null;
                instance$jscomp$0.style.display = null == display || "boolean" === typeof display ? "" : ("" + display).trim();
              }
            } catch (error) {
              captureCommitPhaseError(fiber, fiber.return, error);
            }
            hideOrUnhideNearestPortals(fiber, isHidden2);
            break;
          case 6:
            try {
              fiber.stateNode.nodeValue = isHidden2 ? "" : fiber.memoizedProps, viewTransitionMutationContext = true;
            } catch (error) {
              captureCommitPhaseError(fiber, fiber.return, error);
            }
            break;
          case 18:
            try {
              var instance$jscomp$1 = fiber.stateNode;
              isHidden2 ? hideOrUnhideDehydratedBoundary(instance$jscomp$1, true) : hideOrUnhideDehydratedBoundary(fiber.stateNode, false);
            } catch (error) {
              captureCommitPhaseError(fiber, fiber.return, error);
            }
            break;
          case 22:
          case 23:
            null === fiber.memoizedState && hideOrUnhideAllChildren(fiber, isHidden2);
            break;
          default:
            hideOrUnhideAllChildren(fiber, isHidden2);
        }
      }
      function hideOrUnhideNearestPortals(parentFiber, isHidden$jscomp$0) {
        if (parentFiber.subtreeFlags & 67108864)
          for (parentFiber = parentFiber.child; null !== parentFiber; ) {
            a: {
              var fiber = parentFiber, isHidden2 = isHidden$jscomp$0;
              switch (fiber.tag) {
                case 4:
                  hideOrUnhideAllChildrenOnFiber(fiber, isHidden2);
                  break a;
                case 22:
                  null === fiber.memoizedState && hideOrUnhideNearestPortals(fiber, isHidden2);
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
        null !== alternate && (fiber.alternate = null, detachFiberAfterEffects(alternate));
        fiber.child = null;
        fiber.deletions = null;
        fiber.sibling = null;
        5 === fiber.tag && (alternate = fiber.stateNode, null !== alternate && detachDeletedInstance(alternate));
        fiber.stateNode = null;
        fiber.return = null;
        fiber.dependencies = null;
        fiber.memoizedProps = null;
        fiber.memoizedState = null;
        fiber.pendingProps = null;
        fiber.stateNode = null;
        fiber.updateQueue = null;
      }
      var hostParent = null;
      var hostParentIsContainer = false;
      function recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, parent) {
        for (parent = parent.child; null !== parent; )
          commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, parent), parent = parent.sibling;
      }
      function commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, deletedFiber) {
        if (injectedHook && "function" === typeof injectedHook.onCommitFiberUnmount)
          try {
            injectedHook.onCommitFiberUnmount(rendererID, deletedFiber);
          } catch (err) {
          }
        switch (deletedFiber.tag) {
          case 26:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            deletedFiber.memoizedState ? deletedFiber.memoizedState.count-- : deletedFiber.stateNode && !offscreenSubtreeWasHidden && (deletedFiber = deletedFiber.stateNode, deletedFiber.parentNode.removeChild(deletedFiber));
            break;
          case 27:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
            commitFragmentInstanceDeletionEffects(deletedFiber);
            var prevHostParent = hostParent, prevHostParentIsContainer = hostParentIsContainer;
            isSingletonScope(deletedFiber.type) && (hostParent = deletedFiber.stateNode, hostParentIsContainer = false);
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            releaseSingletonInstance(
              deletedFiber.stateNode,
              deletedFiber.type,
              deletedFiber.memoizedProps
            );
            hostParent = prevHostParent;
            hostParentIsContainer = prevHostParentIsContainer;
            break;
          case 5:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor), commitFragmentInstanceDeletionEffects(deletedFiber);
          case 6:
            6 === deletedFiber.tag && commitFragmentInstanceDeletionEffects(deletedFiber);
            prevHostParent = hostParent;
            prevHostParentIsContainer = hostParentIsContainer;
            hostParent = null;
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            hostParent = prevHostParent;
            hostParentIsContainer = prevHostParentIsContainer;
            if (null !== hostParent)
              if (hostParentIsContainer)
                try {
                  (9 === hostParent.nodeType ? hostParent.body : "HTML" === hostParent.nodeName ? hostParent.ownerDocument.body : hostParent).removeChild(deletedFiber.stateNode), viewTransitionMutationContext = true;
                } catch (error) {
                  captureCommitPhaseError(
                    deletedFiber,
                    nearestMountedAncestor,
                    error
                  );
                }
              else
                try {
                  hostParent.removeChild(deletedFiber.stateNode), viewTransitionMutationContext = true;
                } catch (error) {
                  captureCommitPhaseError(
                    deletedFiber,
                    nearestMountedAncestor,
                    error
                  );
                }
            break;
          case 18:
            null !== hostParent && (hostParentIsContainer ? (finishedRoot = hostParent, clearHydrationBoundary(
              9 === finishedRoot.nodeType ? finishedRoot.body : "HTML" === finishedRoot.nodeName ? finishedRoot.ownerDocument.body : finishedRoot,
              deletedFiber.stateNode
            ), retryIfBlockedOn(finishedRoot)) : clearHydrationBoundary(hostParent, deletedFiber.stateNode));
            break;
          case 4:
            prevHostParent = hostParent;
            prevHostParentIsContainer = hostParentIsContainer;
            hostParent = deletedFiber.stateNode.containerInfo;
            hostParentIsContainer = true;
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            hostParent = prevHostParent;
            hostParentIsContainer = prevHostParentIsContainer;
            break;
          case 0:
          case 11:
          case 14:
          case 15:
            commitHookEffectListUnmount(2, deletedFiber, nearestMountedAncestor);
            offscreenSubtreeWasHidden || commitHookEffectListUnmount(4, deletedFiber, nearestMountedAncestor);
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          case 1:
            offscreenSubtreeWasHidden || (safelyDetachRef(deletedFiber, nearestMountedAncestor), prevHostParent = deletedFiber.stateNode, "function" === typeof prevHostParent.componentWillUnmount && safelyCallComponentWillUnmount(
              deletedFiber,
              nearestMountedAncestor,
              prevHostParent
            ));
            recursivelyTraverseDeletionEffects(
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
            offscreenSubtreeWasHidden = (prevHostParent = offscreenSubtreeWasHidden) || null !== deletedFiber.memoizedState;
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            offscreenSubtreeWasHidden = prevHostParent;
            break;
          case 30:
            safelyDetachRef(deletedFiber, nearestMountedAncestor);
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          case 7:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
            recursivelyTraverseDeletionEffects(
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
        if (null === finishedWork.memoizedState && (finishedRoot = finishedWork.alternate, null !== finishedRoot && (finishedRoot = finishedRoot.memoizedState, null !== finishedRoot))) {
          finishedRoot = finishedRoot.dehydrated;
          try {
            retryIfBlockedOn(finishedRoot);
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
      }
      function commitSuspenseHydrationCallbacks(finishedRoot, finishedWork) {
        if (null === finishedWork.memoizedState && (finishedRoot = finishedWork.alternate, null !== finishedRoot && (finishedRoot = finishedRoot.memoizedState, null !== finishedRoot && (finishedRoot = finishedRoot.dehydrated, null !== finishedRoot))))
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
            null === retryCache && (retryCache = finishedWork.stateNode = new PossiblyWeakSet());
            return retryCache;
          case 22:
            return finishedWork = finishedWork.stateNode, retryCache = finishedWork._retryCache, null === retryCache && (retryCache = finishedWork._retryCache = new PossiblyWeakSet()), retryCache;
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
        if (null !== deletions)
          for (var i = 0; i < deletions.length; i++) {
            var childToDelete = deletions[i], root2 = root$jscomp$0, returnFiber = parentFiber, parent = returnFiber;
            a: for (; null !== parent; ) {
              switch (parent.tag) {
                case 27:
                  if (isSingletonScope(parent.type)) {
                    hostParent = parent.stateNode;
                    hostParentIsContainer = false;
                    break a;
                  }
                  break;
                case 5:
                  hostParent = parent.stateNode;
                  hostParentIsContainer = false;
                  break a;
                case 3:
                case 4:
                  hostParent = parent.stateNode.containerInfo;
                  hostParentIsContainer = true;
                  break a;
              }
              parent = parent.return;
            }
            if (null === hostParent) throw Error(formatProdErrorMessage(160));
            commitDeletionEffectsOnFiber(root2, returnFiber, childToDelete);
            hostParent = null;
            hostParentIsContainer = false;
            root2 = childToDelete.alternate;
            null !== root2 && (root2.return = null);
            childToDelete.return = null;
          }
        if (parentFiber.subtreeFlags & 13886)
          for (parentFiber = parentFiber.child; null !== parentFiber; )
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
            if (flags & 4 && (current = finishedWork.updateQueue, current = null !== current ? current.events : null, null !== current))
              for (var ii = 0; ii < current.length; ii++) {
                var _eventPayloads$ii2 = current[ii];
                _eventPayloads$ii2.ref.impl = _eventPayloads$ii2.nextImpl;
              }
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            flags & 4 && (commitHookEffectListUnmount(3, finishedWork, finishedWork.return), commitHookEffectListMount(3, finishedWork), commitHookEffectListUnmount(5, finishedWork, finishedWork.return));
            break;
          case 1:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
            flags & 64 && offscreenSubtreeIsHidden && (finishedWork = finishedWork.updateQueue, null !== finishedWork && (root2 = finishedWork.callbacks, null !== root2 && (lanes = finishedWork.shared.hiddenCallbacks, finishedWork.shared.hiddenCallbacks = null === lanes ? root2 : lanes.concat(root2))));
            break;
          case 26:
            ii = currentHoistableRoot;
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
            if (flags & 4)
              if (flags = null !== current ? current.memoizedState : null, lanes = finishedWork.memoizedState, null === current)
                if (null === lanes)
                  if (null === finishedWork.stateNode)
                    if (offscreenSubtreeIsHidden)
                      finishedWork.stateNode = createHoistableInstance(
                        finishedWork.type,
                        finishedWork.memoizedProps,
                        root2.containerInfo,
                        finishedWork
                      );
                    else {
                      a: {
                        root2 = finishedWork.type;
                        lanes = finishedWork.memoizedProps;
                        flags = ii.ownerDocument || ii;
                        b: switch (root2) {
                          case "title":
                            current = flags.getElementsByTagName("title")[0];
                            if (!current || current[internalHoistableMarker] || current[internalInstanceKey] || "http://www.w3.org/2000/svg" === current.namespaceURI || current.hasAttribute("itemprop"))
                              current = flags.createElement(root2), flags.head.insertBefore(
                                current,
                                flags.querySelector("head > title")
                              );
                            setInitialProperties(current, root2, lanes);
                            current[internalInstanceKey] = finishedWork;
                            markNodeAsHoistable(current);
                            root2 = current;
                            break a;
                          case "link":
                            if (ii = getHydratableHoistableCache(
                              "link",
                              "href",
                              flags
                            ).get(root2 + (lanes.href || ""))) {
                              for (_eventPayloads$ii2 = 0; _eventPayloads$ii2 < ii.length; _eventPayloads$ii2++)
                                if (current = ii[_eventPayloads$ii2], current.getAttribute("href") === (null == lanes.href || "" === lanes.href ? null : lanes.href) && current.getAttribute("rel") === (null == lanes.rel ? null : lanes.rel) && current.getAttribute("title") === (null == lanes.title ? null : lanes.title) && current.getAttribute("crossorigin") === (null == lanes.crossOrigin ? null : lanes.crossOrigin)) {
                                  ii.splice(_eventPayloads$ii2, 1);
                                  break b;
                                }
                            }
                            current = flags.createElement(root2);
                            setInitialProperties(current, root2, lanes);
                            flags.head.appendChild(current);
                            break;
                          case "meta":
                            if (ii = getHydratableHoistableCache(
                              "meta",
                              "content",
                              flags
                            ).get(root2 + (lanes.content || ""))) {
                              for (_eventPayloads$ii2 = 0; _eventPayloads$ii2 < ii.length; _eventPayloads$ii2++)
                                if (current = ii[_eventPayloads$ii2], current.getAttribute("content") === (null == lanes.content ? null : "" + lanes.content) && current.getAttribute("name") === (null == lanes.name ? null : lanes.name) && current.getAttribute("property") === (null == lanes.property ? null : lanes.property) && current.getAttribute("http-equiv") === (null == lanes.httpEquiv ? null : lanes.httpEquiv) && current.getAttribute("charset") === (null == lanes.charSet ? null : lanes.charSet)) {
                                  ii.splice(_eventPayloads$ii2, 1);
                                  break b;
                                }
                            }
                            current = flags.createElement(root2);
                            setInitialProperties(current, root2, lanes);
                            flags.head.appendChild(current);
                            break;
                          default:
                            throw Error(formatProdErrorMessage(468, root2));
                        }
                        current[internalInstanceKey] = finishedWork;
                        markNodeAsHoistable(current);
                        root2 = current;
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
                flags !== lanes ? (null === flags ? (root2 = current.stateNode, null === root2 || offscreenSubtreeWasHidden || root2.parentNode.removeChild(root2)) : flags.count--, null === lanes ? offscreenSubtreeIsHidden || mountHoistable(ii, finishedWork.type, finishedWork.stateNode) : acquireResource(ii, lanes, finishedWork.memoizedProps)) : null === lanes && null !== finishedWork.stateNode && commitHostUpdate(
                  finishedWork,
                  finishedWork.memoizedProps,
                  current.memoizedProps
                );
            break;
          case 27:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
            null !== current && flags & 4 && commitHostUpdate(
              finishedWork,
              finishedWork.memoizedProps,
              current.memoizedProps
            );
            break;
          case 5:
            ii = offscreenDirectParentIsHidden;
            offscreenDirectParentIsHidden = false;
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
            offscreenDirectParentIsHidden = ii;
            commitReconciliationEffects(finishedWork);
            flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
            if (finishedWork.flags & 32) {
              root2 = finishedWork.stateNode;
              try {
                setTextContent(root2, ""), viewTransitionMutationContext = true;
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
            flags & 4 && null != finishedWork.stateNode && (root2 = finishedWork.memoizedProps, commitHostUpdate(
              finishedWork,
              root2,
              null !== current ? current.memoizedProps : root2
            ));
            flags & 1024 && (needsFormReset = true);
            break;
          case 6:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            if (flags & 4) {
              if (null === finishedWork.stateNode)
                throw Error(formatProdErrorMessage(162));
              root2 = finishedWork.memoizedProps;
              lanes = finishedWork.stateNode;
              try {
                lanes.nodeValue = root2, viewTransitionMutationContext = true;
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
            break;
          case 3:
            viewTransitionMutationContext = false;
            tagCaches = null;
            ii = currentHoistableRoot;
            currentHoistableRoot = getHoistableRoot(root2.containerInfo);
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
            currentHoistableRoot = ii;
            commitReconciliationEffects(finishedWork);
            if (flags & 4 && null !== current && current.memoizedState.isDehydrated)
              try {
                retryIfBlockedOn(root2.containerInfo);
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            needsFormReset && (needsFormReset = false, recursivelyResetForms(finishedWork));
            viewTransitionMutationContext = false;
            break;
          case 4:
            flags = offscreenDirectParentIsHidden;
            offscreenDirectParentIsHidden = offscreenSubtreeIsHidden;
            current = pushMutationContext();
            ii = currentHoistableRoot;
            currentHoistableRoot = getHoistableRoot(
              finishedWork.stateNode.containerInfo
            );
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            currentHoistableRoot = ii;
            viewTransitionMutationContext && inUpdateViewTransition && (rootViewTransitionAffected = true);
            viewTransitionMutationContext = current;
            offscreenDirectParentIsHidden = flags;
            break;
          case 12:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            break;
          case 31:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            flags & 4 && (root2 = finishedWork.updateQueue, null !== root2 && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, root2)));
            break;
          case 13:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            finishedWork.child.flags & 8192 && null !== finishedWork.memoizedState !== (null !== current && null !== current.memoizedState) && (globalMostRecentFallbackTime = now());
            flags & 4 && (root2 = finishedWork.updateQueue, null !== root2 && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, root2)));
            break;
          case 22:
            ii = null !== finishedWork.memoizedState;
            _eventPayloads$ii2 = null !== current && null !== current.memoizedState;
            var prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden, prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden, prevOffscreenDirectParentIsHidden$166 = offscreenDirectParentIsHidden;
            offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden || ii;
            offscreenDirectParentIsHidden = prevOffscreenDirectParentIsHidden$166 || ii;
            offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden || _eventPayloads$ii2;
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
            offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
            offscreenDirectParentIsHidden = prevOffscreenDirectParentIsHidden$166;
            offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
            commitReconciliationEffects(finishedWork);
            flags & 8192 && (root2 = finishedWork.stateNode, root2._visibility = ii ? root2._visibility & -2 : root2._visibility | 1, !ii || null === current || _eventPayloads$ii2 || offscreenSubtreeIsHidden || offscreenSubtreeWasHidden || (root2 = _eventPayloads$ii2 || offscreenSubtreeWasHidden, lanes = offscreenSubtreeIsHidden, current = offscreenSubtreeWasHidden, offscreenSubtreeIsHidden = ii || offscreenSubtreeIsHidden, offscreenSubtreeWasHidden = root2, recursivelyTraverseDisappearLayoutEffects(finishedWork, 2), offscreenSubtreeIsHidden = lanes, offscreenSubtreeWasHidden = current), !ii && offscreenDirectParentIsHidden || hideOrUnhideAllChildren(finishedWork, ii));
            flags & 4 && (root2 = finishedWork.updateQueue, null !== root2 && (lanes = root2.retryQueue, null !== lanes && (root2.retryQueue = null, attachSuspenseRetryListeners(finishedWork, lanes))));
            break;
          case 19:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            flags & 4 && (root2 = finishedWork.updateQueue, null !== root2 && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, root2)));
            break;
          case 30:
            flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
            flags = pushMutationContext();
            ii = inUpdateViewTransition;
            _eventPayloads$ii2 = (lanes & 335544064) === lanes;
            prevOffscreenSubtreeIsHidden = finishedWork.memoizedProps;
            inUpdateViewTransition = _eventPayloads$ii2 && "none" !== getViewTransitionClassName(
              prevOffscreenSubtreeIsHidden.default,
              prevOffscreenSubtreeIsHidden.update
            );
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            _eventPayloads$ii2 && null !== current && viewTransitionMutationContext && (finishedWork.flags |= 4);
            inUpdateViewTransition = ii;
            viewTransitionMutationContext = flags;
            break;
          case 21:
            break;
          case 7:
            flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return)), current && null !== current.stateNode && (current.stateNode._fragmentFiber = finishedWork);
          default:
            recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork);
        }
      }
      function commitReconciliationEffects(finishedWork) {
        var flags = finishedWork.flags;
        if (flags & 2) {
          try {
            for (var hostParentFiber, parentFiber = finishedWork.return; null !== parentFiber; ) {
              if (isHostParent(parentFiber)) {
                hostParentFiber = parentFiber;
                break;
              }
              parentFiber = parentFiber.return;
            }
            parentFiber = null;
            for (var parent = finishedWork.return; null !== parent; ) {
              if (isFragmentInstanceParent(parent)) {
                var fragmentInstance = parent.stateNode;
                null === parentFiber ? parentFiber = [fragmentInstance] : parentFiber.push(fragmentInstance);
              }
              if (isFragmentInstanceHostBoundary(parent)) break;
              parent = parent.return;
            }
            var JSCompiler_inline_result = parentFiber;
            if (null == hostParentFiber) throw Error(formatProdErrorMessage(160));
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
          for (parentFiber = parentFiber.child; null !== parentFiber; ) {
            var fiber = parentFiber;
            recursivelyResetForms(fiber);
            5 === fiber.tag && fiber.flags & 1024 && (fiber = fiber.stateNode, _enabled = true, fiber.reset(), _enabled = false);
            parentFiber = parentFiber.sibling;
          }
      }
      function recursivelyTraverseAfterMutationEffects(root2, parentFiber) {
        if (parentFiber.subtreeFlags & 9270)
          for (parentFiber = parentFiber.child; null !== parentFiber; )
            commitAfterMutationEffectsOnFiber(parentFiber, root2), parentFiber = parentFiber.sibling;
        else measureNestedViewTransitions(parentFiber, false);
      }
      function commitAfterMutationEffectsOnFiber(finishedWork, root2) {
        var current = finishedWork.alternate;
        if (null === current) commitEnterViewTransitions(finishedWork, false);
        else
          switch (finishedWork.tag) {
            case 3:
              rootViewTransitionNameCanceled = viewTransitionContextChanged = false;
              pushViewTransitionCancelableScope();
              recursivelyTraverseAfterMutationEffects(root2, finishedWork);
              if (!viewTransitionContextChanged && !rootViewTransitionAffected) {
                finishedWork = viewTransitionCancelableChildren;
                if (null !== finishedWork)
                  for (var i = 0; i < finishedWork.length; i += 3) {
                    current = finishedWork[i];
                    var oldName = finishedWork[i + 1];
                    restoreViewTransitionName(current, finishedWork[i + 2]);
                    current = current.ownerDocument.documentElement;
                    null !== current && current.animate(
                      { opacity: [0, 0], pointerEvents: ["none", "none"] },
                      {
                        duration: 0,
                        fill: "forwards",
                        pseudoElement: "::view-transition-group(" + oldName + ")"
                      }
                    );
                  }
                finishedWork = root2.containerInfo;
                finishedWork = 9 === finishedWork.nodeType ? finishedWork.documentElement : finishedWork.ownerDocument.documentElement;
                null !== finishedWork && "" === finishedWork.style.viewTransitionName && (finishedWork.style.viewTransitionName = "none", finishedWork.animate(
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
                ));
                rootViewTransitionNameCanceled = true;
              }
              viewTransitionCancelableChildren = null;
              break;
            case 5:
              recursivelyTraverseAfterMutationEffects(root2, finishedWork);
              break;
            case 4:
              i = viewTransitionContextChanged;
              viewTransitionContextChanged = false;
              recursivelyTraverseAfterMutationEffects(root2, finishedWork);
              viewTransitionContextChanged && (rootViewTransitionAffected = true);
              viewTransitionContextChanged = i;
              break;
            case 22:
              null === finishedWork.memoizedState && (null !== current.memoizedState ? commitEnterViewTransitions(finishedWork, false) : recursivelyTraverseAfterMutationEffects(root2, finishedWork));
              break;
            case 30:
              i = viewTransitionContextChanged;
              oldName = pushViewTransitionCancelableScope();
              viewTransitionContextChanged = false;
              recursivelyTraverseAfterMutationEffects(root2, finishedWork);
              viewTransitionContextChanged && (finishedWork.flags |= 4);
              var props = finishedWork.memoizedProps, state = finishedWork.stateNode;
              root2 = getViewTransitionName(props, state);
              state = getViewTransitionName(current.memoizedProps, state);
              var className = getViewTransitionClassName(props.default, props.update);
              "none" === className ? root2 = false : (props = current.memoizedState, current.memoizedState = null, current = finishedWork.child, viewTransitionHostInstanceIdx = 0, root2 = measureViewTransitionHostInstancesRecursive(
                finishedWork,
                current,
                root2,
                state,
                className,
                props,
                true
              ), viewTransitionHostInstanceIdx !== (null === props ? 0 : props.length) && (finishedWork.flags |= 32));
              0 !== (finishedWork.flags & 4) && root2 ? (scheduleViewTransitionEvent(
                finishedWork,
                finishedWork.memoizedProps.onUpdate
              ), viewTransitionCancelableChildren = oldName) : null !== oldName && (oldName.push.apply(oldName, viewTransitionCancelableChildren), viewTransitionCancelableChildren = oldName);
              viewTransitionContextChanged = 0 !== (finishedWork.flags & 32) ? true : i;
              break;
            default:
              recursivelyTraverseAfterMutationEffects(root2, finishedWork);
          }
      }
      function recursivelyTraverseLayoutEffects(root2, parentFiber) {
        if (parentFiber.subtreeFlags & 8772)
          for (parentFiber = parentFiber.child; null !== parentFiber; )
            commitLayoutEffectOnFiber(root2, parentFiber.alternate, parentFiber), parentFiber = parentFiber.sibling;
      }
      function recursivelyTraverseDisappearLayoutEffects(parentFiber, layoutEffectTraversalFlags$jscomp$0) {
        for (parentFiber = parentFiber.child; null !== parentFiber; ) {
          var finishedWork = parentFiber, layoutEffectTraversalFlags = layoutEffectTraversalFlags$jscomp$0;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
              commitHookEffectListUnmount(4, finishedWork, finishedWork.return);
              recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 1:
              safelyDetachRef(finishedWork, finishedWork.return);
              var instance = finishedWork.stateNode;
              "function" === typeof instance.componentWillUnmount && safelyCallComponentWillUnmount(
                finishedWork,
                finishedWork.return,
                instance
              );
              recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 27:
              0 !== (layoutEffectTraversalFlags & 2) && releaseSingletonInstance(
                finishedWork.stateNode,
                finishedWork.type,
                finishedWork.memoizedProps
              );
            case 5:
              safelyDetachRef(finishedWork, finishedWork.return);
              5 !== finishedWork.tag && 27 !== finishedWork.tag || commitFragmentInstanceDeletionEffects(finishedWork);
              recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 6:
              commitFragmentInstanceDeletionEffects(finishedWork);
              break;
            case 26:
              safelyDetachRef(finishedWork, finishedWork.return);
              instance = finishedWork.stateNode;
              null !== finishedWork.memoizedState || null === instance || offscreenSubtreeWasHidden || instance.parentNode.removeChild(instance);
              recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 22:
              null === finishedWork.memoizedState && recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 30:
              safelyDetachRef(finishedWork, finishedWork.return);
              recursivelyTraverseDisappearLayoutEffects(
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
        layoutEffectTraversalFlags = 0 !== (parentFiber.subtreeFlags & 8772) ? layoutEffectTraversalFlags : layoutEffectTraversalFlags & -2;
        for (parentFiber = parentFiber.child; null !== parentFiber; ) {
          var current = parentFiber.alternate, finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, flags = finishedWork.flags, includeWorkInProgressEffects = 0 !== (layoutEffectTraversalFlags & 1);
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 15:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
              commitHookEffectListMount(4, finishedWork);
              break;
            case 1:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
              current = finishedWork;
              finishedRoot = current.stateNode;
              if ("function" === typeof finishedRoot.componentDidMount)
                try {
                  finishedRoot.componentDidMount();
                } catch (error) {
                  captureCommitPhaseError(current, current.return, error);
                }
              current = finishedWork;
              finishedRoot = current.updateQueue;
              if (null !== finishedRoot) {
                var instance = current.stateNode;
                try {
                  var hiddenCallbacks = finishedRoot.shared.hiddenCallbacks;
                  if (null !== hiddenCallbacks)
                    for (finishedRoot.shared.hiddenCallbacks = null, finishedRoot = 0; finishedRoot < hiddenCallbacks.length; finishedRoot++)
                      callCallback(hiddenCallbacks[finishedRoot], instance);
                } catch (error) {
                  captureCommitPhaseError(current, current.return, error);
                }
              }
              includeWorkInProgressEffects && flags & 64 && commitClassCallbacks(finishedWork);
              safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 27:
              0 !== (layoutEffectTraversalFlags & 2) && commitHostSingletonAcquisition(finishedWork);
            case 5:
              5 !== finishedWork.tag && 27 !== finishedWork.tag || commitFragmentInstanceInsertionEffects(finishedWork);
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
              includeWorkInProgressEffects && null === current && flags & 4 && commitHostMount(finishedWork);
              safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 6:
              commitFragmentInstanceInsertionEffects(finishedWork);
              break;
            case 26:
              instance = finishedWork.stateNode;
              null !== finishedWork.memoizedState || null === instance || offscreenSubtreeIsHidden || mountHoistable(
                getHoistableRoot(instance.ownerDocument),
                finishedWork.type,
                instance
              );
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
              includeWorkInProgressEffects && null === current && flags & 4 && commitHostMount(finishedWork);
              safelyAttachRef(finishedWork, finishedWork.return);
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
              );
              includeWorkInProgressEffects && flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
              break;
            case 13:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
              includeWorkInProgressEffects && flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
              break;
            case 22:
              null === finishedWork.memoizedState && recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
              safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 30:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
              safelyAttachRef(finishedWork, finishedWork.return);
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
        null !== current && null !== current.memoizedState && null !== current.memoizedState.cachePool && (previousCache = current.memoizedState.cachePool.pool);
        current = null;
        null !== finishedWork.memoizedState && null !== finishedWork.memoizedState.cachePool && (current = finishedWork.memoizedState.cachePool.pool);
        current !== previousCache && (null != current && current.refCount++, null != previousCache && releaseCache(previousCache));
      }
      function commitCachePassiveMountEffect(current, finishedWork) {
        current = null;
        null !== finishedWork.alternate && (current = finishedWork.alternate.memoizedState.cache);
        finishedWork = finishedWork.memoizedState.cache;
        finishedWork !== current && (finishedWork.refCount++, null != current && releaseCache(current));
      }
      function recursivelyTraversePassiveMountEffects(root2, parentFiber, committedLanes, committedTransitions) {
        var isViewTransitionEligible = (committedLanes & 335544064) === committedLanes;
        if (parentFiber.subtreeFlags & (isViewTransitionEligible ? 10262 : 10256))
          for (parentFiber = parentFiber.child; null !== parentFiber; )
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
        isViewTransitionEligible && null === finishedWork.alternate && null !== finishedWork.return && null !== finishedWork.return.alternate && restoreEnterOrExitViewTransitions(finishedWork);
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
            );
            flags & 2048 && commitHookEffectListMount(9, finishedWork);
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
            );
            isViewTransitionEligible && rootViewTransitionNameCanceled && (finishedRoot = finishedRoot.containerInfo, finishedRoot = 9 === finishedRoot.nodeType ? finishedRoot.body : "HTML" === finishedRoot.nodeName ? finishedRoot.ownerDocument.body : finishedRoot, "root" === finishedRoot.style.viewTransitionName && (finishedRoot.style.viewTransitionName = ""), finishedRoot = finishedRoot.ownerDocument.documentElement, null !== finishedRoot && "none" === finishedRoot.style.viewTransitionName && (finishedRoot.style.viewTransitionName = ""));
            flags & 2048 && (flags = null, null !== finishedWork.alternate && (flags = finishedWork.alternate.memoizedState.cache), finishedWork = finishedWork.memoizedState.cache, finishedWork !== flags && (finishedWork.refCount++, null != flags && releaseCache(flags)));
            break;
          case 12:
            if (flags & 2048) {
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions
              );
              flags = finishedWork.stateNode;
              try {
                var _finishedWork$memoize2 = finishedWork.memoizedProps, id = _finishedWork$memoize2.id, onPostCommit = _finishedWork$memoize2.onPostCommit;
                "function" === typeof onPostCommit && onPostCommit(
                  id,
                  null === finishedWork.alternate ? "mount" : "update",
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
            _finishedWork$memoize2 = finishedWork.stateNode;
            id = finishedWork.alternate;
            null !== finishedWork.memoizedState ? (isViewTransitionEligible && null !== id && null === id.memoizedState && restoreEnterOrExitViewTransitions(id), _finishedWork$memoize2._visibility & 2 ? recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ) : recursivelyTraverseAtomicPassiveEffects(
              finishedRoot,
              finishedWork
            )) : (isViewTransitionEligible && null !== id && null !== id.memoizedState && restoreEnterOrExitViewTransitions(finishedWork), _finishedWork$memoize2._visibility & 2 ? recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ) : (_finishedWork$memoize2._visibility |= 2, recursivelyTraverseReconnectPassiveEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions,
              0 !== (finishedWork.subtreeFlags & 10256) || false
            )));
            flags & 2048 && commitOffscreenPassiveMountEffects(id, finishedWork);
            break;
          case 24:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
            break;
          case 30:
            isViewTransitionEligible && (flags = finishedWork.alternate, null !== flags && (restoreViewTransitionOnHostInstances(flags.child, true), restoreViewTransitionOnHostInstances(finishedWork.child, true)));
            recursivelyTraversePassiveMountEffects(
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
        includeWorkInProgressEffects = includeWorkInProgressEffects && (0 !== (parentFiber.subtreeFlags & 10256) || false);
        for (parentFiber = parentFiber.child; null !== parentFiber; ) {
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
              );
              commitHookEffectListMount(8, finishedWork);
              break;
            case 23:
              break;
            case 22:
              var instance = finishedWork.stateNode;
              null !== finishedWork.memoizedState ? instance._visibility & 2 ? recursivelyTraverseReconnectPassiveEffects(
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
              ));
              includeWorkInProgressEffects && flags & 2048 && commitOffscreenPassiveMountEffects(
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
              );
              includeWorkInProgressEffects && flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
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
          for (parentFiber = parentFiber.child; null !== parentFiber; ) {
            var finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, flags = finishedWork.flags;
            switch (finishedWork.tag) {
              case 22:
                recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
                flags & 2048 && commitOffscreenPassiveMountEffects(
                  finishedWork.alternate,
                  finishedWork
                );
                break;
              case 24:
                recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
                flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
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
          for (parentFiber = parentFiber.child; null !== parentFiber; )
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
            );
            fiber.flags & suspenseyCommitFlag && (null !== fiber.memoizedState ? suspendResource(
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
            );
            fiber.flags & suspenseyCommitFlag && (fiber = fiber.stateNode, (committedLanes & 335544128) === committedLanes && suspendInstance(suspendedState, fiber));
            break;
          case 3:
          case 4:
            var previousHoistableRoot = currentHoistableRoot;
            currentHoistableRoot = getHoistableRoot(fiber.stateNode.containerInfo);
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            );
            currentHoistableRoot = previousHoistableRoot;
            break;
          case 22:
            null === fiber.memoizedState && (previousHoistableRoot = fiber.alternate, null !== previousHoistableRoot && null !== previousHoistableRoot.memoizedState ? (previousHoistableRoot = suspenseyCommitFlag, suspenseyCommitFlag = 16777216, recursivelyAccumulateSuspenseyCommit(
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
            if (0 !== (fiber.flags & suspenseyCommitFlag) && (previousHoistableRoot = fiber.memoizedProps.name, null != previousHoistableRoot && "auto" !== previousHoistableRoot)) {
              var state = fiber.stateNode;
              state.paired = null;
              null === appearingViewTransitions && (appearingViewTransitions = /* @__PURE__ */ new Map());
              appearingViewTransitions.set(previousHoistableRoot, state);
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
        if (null !== previousFiber && (parentFiber = previousFiber.child, null !== parentFiber)) {
          previousFiber.child = null;
          do
            previousFiber = parentFiber.sibling, parentFiber.sibling = null, parentFiber = previousFiber;
          while (null !== parentFiber);
        }
      }
      function recursivelyTraversePassiveUnmountEffects(parentFiber) {
        var deletions = parentFiber.deletions;
        if (0 !== (parentFiber.flags & 16)) {
          if (null !== deletions)
            for (var i = 0; i < deletions.length; i++) {
              var childToDelete = deletions[i];
              nextEffect = childToDelete;
              commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
                childToDelete,
                parentFiber
              );
            }
          detachAlternateSiblings(parentFiber);
        }
        if (parentFiber.subtreeFlags & 10256)
          for (parentFiber = parentFiber.child; null !== parentFiber; )
            commitPassiveUnmountOnFiber(parentFiber), parentFiber = parentFiber.sibling;
      }
      function commitPassiveUnmountOnFiber(finishedWork) {
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            finishedWork.flags & 2048 && commitHookEffectListUnmount(9, finishedWork, finishedWork.return);
            break;
          case 3:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
          case 12:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
          case 22:
            var instance = finishedWork.stateNode;
            null !== finishedWork.memoizedState && instance._visibility & 2 && (null === finishedWork.return || 13 !== finishedWork.return.tag) ? (instance._visibility &= -3, recursivelyTraverseDisconnectPassiveEffects(finishedWork)) : recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
          default:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
        }
      }
      function recursivelyTraverseDisconnectPassiveEffects(parentFiber) {
        var deletions = parentFiber.deletions;
        if (0 !== (parentFiber.flags & 16)) {
          if (null !== deletions)
            for (var i = 0; i < deletions.length; i++) {
              var childToDelete = deletions[i];
              nextEffect = childToDelete;
              commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
                childToDelete,
                parentFiber
              );
            }
          detachAlternateSiblings(parentFiber);
        }
        for (parentFiber = parentFiber.child; null !== parentFiber; ) {
          deletions = parentFiber;
          switch (deletions.tag) {
            case 0:
            case 11:
            case 15:
              commitHookEffectListUnmount(8, deletions, deletions.return);
              recursivelyTraverseDisconnectPassiveEffects(deletions);
              break;
            case 22:
              i = deletions.stateNode;
              i._visibility & 2 && (i._visibility &= -3, recursivelyTraverseDisconnectPassiveEffects(deletions));
              break;
            default:
              recursivelyTraverseDisconnectPassiveEffects(deletions);
          }
          parentFiber = parentFiber.sibling;
        }
      }
      function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(deletedSubtreeRoot, nearestMountedAncestor) {
        for (; null !== nextEffect; ) {
          var fiber = nextEffect;
          switch (fiber.tag) {
            case 0:
            case 11:
            case 15:
              commitHookEffectListUnmount(8, fiber, nearestMountedAncestor);
              break;
            case 23:
            case 22:
              if (null !== fiber.memoizedState && null !== fiber.memoizedState.cachePool) {
                var cache = fiber.memoizedState.cachePool.pool;
                null != cache && cache.refCount++;
              }
              break;
            case 24:
              releaseCache(fiber.memoizedState.cache);
          }
          cache = fiber.child;
          if (null !== cache) cache.return = fiber, nextEffect = cache;
          else
            a: for (fiber = deletedSubtreeRoot; null !== nextEffect; ) {
              cache = nextEffect;
              var sibling = cache.sibling, returnFiber = cache.return;
              detachFiberAfterEffects(cache);
              if (cache === fiber) {
                nextEffect = null;
                break a;
              }
              if (null !== sibling) {
                sibling.return = returnFiber;
                nextEffect = sibling;
                break a;
              }
              nextEffect = returnFiber;
            }
        }
      }
      var DefaultAsyncDispatcher = {
        getCacheForType: function(resourceType) {
          var cache = readContext(CacheContext), cacheForType = cache.data.get(resourceType);
          void 0 === cacheForType && (cacheForType = resourceType(), cache.data.set(resourceType, cacheForType));
          return cacheForType;
        },
        cacheSignal: function() {
          return readContext(CacheContext).controller.signal;
        }
      };
      var PossiblyWeakMap = "function" === typeof WeakMap ? WeakMap : Map;