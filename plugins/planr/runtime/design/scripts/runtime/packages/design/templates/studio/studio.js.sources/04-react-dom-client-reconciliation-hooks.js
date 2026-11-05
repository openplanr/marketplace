
      function createChildReconciler(shouldTrackSideEffects) {
        function deleteChild(returnFiber, childToDelete) {
          if (shouldTrackSideEffects) {
            var deletions = returnFiber.deletions;
            deletions === null ? (returnFiber.deletions = [childToDelete], returnFiber.flags |= 16) : deletions.push(childToDelete);
          }
        }
        function deleteRemainingChildren(returnFiber, currentFirstChild) {
          if (!shouldTrackSideEffects) return null;
          for (; currentFirstChild !== null; )
            deleteChild(returnFiber, currentFirstChild), currentFirstChild = currentFirstChild.sibling;
          return null;
        }
        function mapRemainingChildren(currentFirstChild) {
          for (var existingChildren = /* @__PURE__ */ new Map(); currentFirstChild !== null; )
            currentFirstChild.key === null ? existingChildren.set(currentFirstChild.index, currentFirstChild) : existingChildren.set(currentFirstChild.key, currentFirstChild), currentFirstChild = currentFirstChild.sibling;
          return existingChildren;
        }
        function useFiber(fiber, pendingProps) {
          return fiber = createWorkInProgress(fiber, pendingProps), fiber.index = 0, fiber.sibling = null, fiber;
        }
        function placeChild(newFiber, lastPlacedIndex, newIndex) {
          return newFiber.index = newIndex, shouldTrackSideEffects ? (newIndex = newFiber.alternate, newIndex !== null ? (newIndex = newIndex.index, newIndex < lastPlacedIndex ? (newFiber.flags |= 2, lastPlacedIndex) : newIndex) : (newFiber.flags |= 134217730, lastPlacedIndex)) : (newFiber.flags |= 1048576, lastPlacedIndex);
        }
        function placeSingleChild(newFiber) {
          return shouldTrackSideEffects && newFiber.alternate === null && (newFiber.flags |= 134217730), newFiber;
        }
        function updateTextNode(returnFiber, current, textContent, lanes) {
          return current === null || current.tag !== 6 ? (current = createFiberFromText(textContent, returnFiber.mode, lanes), current.return = returnFiber, current) : (current = useFiber(current, textContent), current.return = returnFiber, current);
        }
        function updateElement(returnFiber, current, element, lanes) {
          var elementType = element.type;
          return elementType === REACT_FRAGMENT_TYPE ? (returnFiber = updateFragment(
            returnFiber,
            current,
            element.props.children,
            lanes,
            element.key
          ), coerceRef(returnFiber, element), returnFiber) : current !== null && (current.elementType === elementType || typeof elementType == "object" && elementType !== null && elementType.$$typeof === REACT_LAZY_TYPE2 && resolveLazy(elementType) === current.type) ? (current = useFiber(current, element.props), coerceRef(current, element), current.return = returnFiber, current) : (current = createFiberFromTypeAndProps(
            element.type,
            element.key,
            element.props,
            null,
            returnFiber.mode,
            lanes
          ), coerceRef(current, element), current.return = returnFiber, current);
        }
        function updatePortal(returnFiber, current, portal, lanes) {
          return current === null || current.tag !== 4 || current.stateNode.containerInfo !== portal.containerInfo || current.stateNode.implementation !== portal.implementation ? (current = createFiberFromPortal(portal, returnFiber.mode, lanes), current.return = returnFiber, current) : (current = useFiber(current, portal.children || []), current.return = returnFiber, current);
        }
        function updateFragment(returnFiber, current, fragment, lanes, key) {
          return current === null || current.tag !== 7 ? (current = createFiberFromFragment(
            fragment,
            returnFiber.mode,
            lanes,
            key
          ), current.return = returnFiber, current) : (current = useFiber(current, fragment), current.return = returnFiber, current);
        }
        function createChild(returnFiber, newChild, lanes) {
          if (typeof newChild == "string" && newChild !== "" || typeof newChild == "number" || typeof newChild == "bigint")
            return newChild = createFiberFromText(
              "" + newChild,
              returnFiber.mode,
              lanes
            ), newChild.return = returnFiber, newChild;
          if (typeof newChild == "object" && newChild !== null) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                return lanes = createFiberFromTypeAndProps(
                  newChild.type,
                  newChild.key,
                  newChild.props,
                  null,
                  returnFiber.mode,
                  lanes
                ), coerceRef(lanes, newChild), lanes.return = returnFiber, lanes;
              case REACT_PORTAL_TYPE:
                return newChild = createFiberFromPortal(
                  newChild,
                  returnFiber.mode,
                  lanes
                ), newChild.return = returnFiber, newChild;
              case REACT_LAZY_TYPE2:
                return newChild = resolveLazy(newChild), createChild(returnFiber, newChild, lanes);
            }
            if (isArrayImpl(newChild) || getIteratorFn(newChild))
              return newChild = createFiberFromFragment(
                newChild,
                returnFiber.mode,
                lanes,
                null
              ), newChild.return = returnFiber, newChild;
            if (typeof newChild.then == "function")
              return createChild(returnFiber, unwrapThenable(newChild), lanes);
            if (newChild.$$typeof === REACT_CONTEXT_TYPE)
              return createChild(
                returnFiber,
                readContextDuringReconciliation(returnFiber, newChild),
                lanes
              );
            throwOnInvalidObjectTypeImpl(returnFiber, newChild);
          }
          return null;
        }
        function updateSlot(returnFiber, oldFiber, newChild, lanes) {
          var key = oldFiber !== null ? oldFiber.key : null;
          if (typeof newChild == "string" && newChild !== "" || typeof newChild == "number" || typeof newChild == "bigint")
            return key !== null ? null : updateTextNode(returnFiber, oldFiber, "" + newChild, lanes);
          if (typeof newChild == "object" && newChild !== null) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                return newChild.key === key ? updateElement(returnFiber, oldFiber, newChild, lanes) : null;
              case REACT_PORTAL_TYPE:
                return newChild.key === key ? updatePortal(returnFiber, oldFiber, newChild, lanes) : null;
              case REACT_LAZY_TYPE2:
                return newChild = resolveLazy(newChild), updateSlot(returnFiber, oldFiber, newChild, lanes);
            }
            if (isArrayImpl(newChild) || getIteratorFn(newChild))
              return key !== null ? null : updateFragment(returnFiber, oldFiber, newChild, lanes, null);
            if (typeof newChild.then == "function")
              return updateSlot(
                returnFiber,
                oldFiber,
                unwrapThenable(newChild),
                lanes
              );
            if (newChild.$$typeof === REACT_CONTEXT_TYPE)
              return updateSlot(
                returnFiber,
                oldFiber,
                readContextDuringReconciliation(returnFiber, newChild),
                lanes
              );
            throwOnInvalidObjectTypeImpl(returnFiber, newChild);
          }
          return null;
        }
        function updateFromMap(existingChildren, returnFiber, newIdx, newChild, lanes) {
          if (typeof newChild == "string" && newChild !== "" || typeof newChild == "number" || typeof newChild == "bigint")
            return existingChildren = existingChildren.get(newIdx) || null, updateTextNode(returnFiber, existingChildren, "" + newChild, lanes);
          if (typeof newChild == "object" && newChild !== null) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                return existingChildren = existingChildren.get(
                  newChild.key === null ? newIdx : newChild.key
                ) || null, updateElement(returnFiber, existingChildren, newChild, lanes);
              case REACT_PORTAL_TYPE:
                return existingChildren = existingChildren.get(
                  newChild.key === null ? newIdx : newChild.key
                ) || null, updatePortal(returnFiber, existingChildren, newChild, lanes);
              case REACT_LAZY_TYPE2:
                return newChild = resolveLazy(newChild), updateFromMap(
                  existingChildren,
                  returnFiber,
                  newIdx,
                  newChild,
                  lanes
                );
            }
            if (isArrayImpl(newChild) || getIteratorFn(newChild))
              return existingChildren = existingChildren.get(newIdx) || null, updateFragment(returnFiber, existingChildren, newChild, lanes, null);
            if (typeof newChild.then == "function")
              return updateFromMap(
                existingChildren,
                returnFiber,
                newIdx,
                unwrapThenable(newChild),
                lanes
              );
            if (newChild.$$typeof === REACT_CONTEXT_TYPE)
              return updateFromMap(
                existingChildren,
                returnFiber,
                newIdx,
                readContextDuringReconciliation(returnFiber, newChild),
                lanes
              );
            throwOnInvalidObjectTypeImpl(returnFiber, newChild);
          }
          return null;
        }
        function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, lanes) {
          for (var resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, newIdx = currentFirstChild = 0, nextOldFiber = null; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
            oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
            var newFiber = updateSlot(
              returnFiber,
              oldFiber,
              newChildren[newIdx],
              lanes
            );
            if (newFiber === null) {
              oldFiber === null && (oldFiber = nextOldFiber);
              break;
            }
            shouldTrackSideEffects && oldFiber && newFiber.alternate === null && deleteChild(returnFiber, oldFiber), currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx), previousNewFiber === null ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber, previousNewFiber = newFiber, oldFiber = nextOldFiber;
          }
          if (newIdx === newChildren.length)
            return deleteRemainingChildren(returnFiber, oldFiber), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
          if (oldFiber === null) {
            for (; newIdx < newChildren.length; newIdx++)
              oldFiber = createChild(returnFiber, newChildren[newIdx], lanes), oldFiber !== null && (currentFirstChild = placeChild(
                oldFiber,
                currentFirstChild,
                newIdx
              ), previousNewFiber === null ? resultingFirstChild = oldFiber : previousNewFiber.sibling = oldFiber, previousNewFiber = oldFiber);
            return isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
          }
          for (oldFiber = mapRemainingChildren(oldFiber); newIdx < newChildren.length; newIdx++)
            nextOldFiber = updateFromMap(
              oldFiber,
              returnFiber,
              newIdx,
              newChildren[newIdx],
              lanes
            ), nextOldFiber !== null && (shouldTrackSideEffects && (newFiber = nextOldFiber.alternate, newFiber !== null && oldFiber.delete(newFiber.key === null ? newIdx : newFiber.key)), currentFirstChild = placeChild(
              nextOldFiber,
              currentFirstChild,
              newIdx
            ), previousNewFiber === null ? resultingFirstChild = nextOldFiber : previousNewFiber.sibling = nextOldFiber, previousNewFiber = nextOldFiber);
          return shouldTrackSideEffects && oldFiber.forEach(function(child) {
            return deleteChild(returnFiber, child);
          }), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
        }
        function reconcileChildrenIterator(returnFiber, currentFirstChild, newChildren, lanes) {
          if (newChildren == null) throw Error(formatProdErrorMessage(151));
          for (var resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, newIdx = currentFirstChild = 0, nextOldFiber = null, step = newChildren.next(); oldFiber !== null && !step.done; newIdx++, step = newChildren.next()) {
            oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
            var newFiber = updateSlot(returnFiber, oldFiber, step.value, lanes);
            if (newFiber === null) {
              oldFiber === null && (oldFiber = nextOldFiber);
              break;
            }
            shouldTrackSideEffects && oldFiber && newFiber.alternate === null && deleteChild(returnFiber, oldFiber), currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx), previousNewFiber === null ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber, previousNewFiber = newFiber, oldFiber = nextOldFiber;
          }
          if (step.done)
            return deleteRemainingChildren(returnFiber, oldFiber), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
          if (oldFiber === null) {
            for (; !step.done; newIdx++, step = newChildren.next())
              step = createChild(returnFiber, step.value, lanes), step !== null && (currentFirstChild = placeChild(step, currentFirstChild, newIdx), previousNewFiber === null ? resultingFirstChild = step : previousNewFiber.sibling = step, previousNewFiber = step);
            return isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
          }
          for (oldFiber = mapRemainingChildren(oldFiber); !step.done; newIdx++, step = newChildren.next())
            step = updateFromMap(oldFiber, returnFiber, newIdx, step.value, lanes), step !== null && (shouldTrackSideEffects && (nextOldFiber = step.alternate, nextOldFiber !== null && oldFiber.delete(
              nextOldFiber.key === null ? newIdx : nextOldFiber.key
            )), currentFirstChild = placeChild(step, currentFirstChild, newIdx), previousNewFiber === null ? resultingFirstChild = step : previousNewFiber.sibling = step, previousNewFiber = step);
          return shouldTrackSideEffects && oldFiber.forEach(function(child) {
            return deleteChild(returnFiber, child);
          }), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
        }
        function reconcileChildFibersImpl(returnFiber, currentFirstChild, newChild, lanes) {
          if (typeof newChild == "object" && newChild !== null && newChild.type === REACT_FRAGMENT_TYPE && newChild.key === null && newChild.props.ref === void 0 && (newChild = newChild.props.children), typeof newChild == "object" && newChild !== null) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                a: {
                  for (var key = newChild.key; currentFirstChild !== null; ) {
                    if (currentFirstChild.key === key) {
                      if (key = newChild.type, key === REACT_FRAGMENT_TYPE) {
                        if (currentFirstChild.tag === 7) {
                          deleteRemainingChildren(
                            returnFiber,
                            currentFirstChild.sibling
                          ), lanes = useFiber(
                            currentFirstChild,
                            newChild.props.children
                          ), coerceRef(lanes, newChild), lanes.return = returnFiber, returnFiber = lanes;
                          break a;
                        }
                      } else if (currentFirstChild.elementType === key || typeof key == "object" && key !== null && key.$$typeof === REACT_LAZY_TYPE2 && resolveLazy(key) === currentFirstChild.type) {
                        deleteRemainingChildren(
                          returnFiber,
                          currentFirstChild.sibling
                        ), lanes = useFiber(currentFirstChild, newChild.props), coerceRef(lanes, newChild), lanes.return = returnFiber, returnFiber = lanes;
                        break a;
                      }
                      deleteRemainingChildren(returnFiber, currentFirstChild);
                      break;
                    } else deleteChild(returnFiber, currentFirstChild);
                    currentFirstChild = currentFirstChild.sibling;
                  }
                  newChild.type === REACT_FRAGMENT_TYPE ? (lanes = createFiberFromFragment(
                    newChild.props.children,
                    returnFiber.mode,
                    lanes,
                    newChild.key
                  ), coerceRef(lanes, newChild), lanes.return = returnFiber, returnFiber = lanes) : (lanes = createFiberFromTypeAndProps(
                    newChild.type,
                    newChild.key,
                    newChild.props,
                    null,
                    returnFiber.mode,
                    lanes
                  ), coerceRef(lanes, newChild), lanes.return = returnFiber, returnFiber = lanes);
                }
                return placeSingleChild(returnFiber);
              case REACT_PORTAL_TYPE:
                a: {
                  for (key = newChild.key; currentFirstChild !== null; ) {
                    if (currentFirstChild.key === key)
                      if (currentFirstChild.tag === 4 && currentFirstChild.stateNode.containerInfo === newChild.containerInfo && currentFirstChild.stateNode.implementation === newChild.implementation) {
                        deleteRemainingChildren(
                          returnFiber,
                          currentFirstChild.sibling
                        ), lanes = useFiber(currentFirstChild, newChild.children || []), lanes.return = returnFiber, returnFiber = lanes;
                        break a;
                      } else {
                        deleteRemainingChildren(returnFiber, currentFirstChild);
                        break;
                      }
                    else deleteChild(returnFiber, currentFirstChild);
                    currentFirstChild = currentFirstChild.sibling;
                  }
                  lanes = createFiberFromPortal(newChild, returnFiber.mode, lanes), lanes.return = returnFiber, returnFiber = lanes;
                }
                return placeSingleChild(returnFiber);
              case REACT_LAZY_TYPE2:
                return newChild = resolveLazy(newChild), reconcileChildFibersImpl(
                  returnFiber,
                  currentFirstChild,
                  newChild,
                  lanes
                );
            }
            if (isArrayImpl(newChild))
              return reconcileChildrenArray(
                returnFiber,
                currentFirstChild,
                newChild,
                lanes
              );
            if (getIteratorFn(newChild)) {
              if (key = getIteratorFn(newChild), typeof key != "function") throw Error(formatProdErrorMessage(150));
              return newChild = key.call(newChild), reconcileChildrenIterator(
                returnFiber,
                currentFirstChild,
                newChild,
                lanes
              );
            }
            if (typeof newChild.then == "function")
              return reconcileChildFibersImpl(
                returnFiber,
                currentFirstChild,
                unwrapThenable(newChild),
                lanes
              );
            if (newChild.$$typeof === REACT_CONTEXT_TYPE)
              return reconcileChildFibersImpl(
                returnFiber,
                currentFirstChild,
                readContextDuringReconciliation(returnFiber, newChild),
                lanes
              );
            throwOnInvalidObjectTypeImpl(returnFiber, newChild);
          }
          return typeof newChild == "string" && newChild !== "" || typeof newChild == "number" || typeof newChild == "bigint" ? (newChild = "" + newChild, currentFirstChild !== null && currentFirstChild.tag === 6 ? (deleteRemainingChildren(returnFiber, currentFirstChild.sibling), lanes = useFiber(currentFirstChild, newChild), lanes.return = returnFiber, returnFiber = lanes) : (deleteRemainingChildren(returnFiber, currentFirstChild), lanes = createFiberFromText(newChild, returnFiber.mode, lanes), lanes.return = returnFiber, returnFiber = lanes), placeSingleChild(returnFiber)) : deleteRemainingChildren(returnFiber, currentFirstChild);
        }
        return function(returnFiber, currentFirstChild, newChild, lanes) {
          try {
            thenableIndexCounter$1 = 0;
            var firstChildFiber = reconcileChildFibersImpl(
              returnFiber,
              currentFirstChild,
              newChild,
              lanes
            );
            return thenableState$1 = null, firstChildFiber;
          } catch (x) {
            if (x === SuspenseException || x === SuspenseActionException) throw x;
            var fiber = createFiberImplClass(29, x, null, returnFiber.mode);
            return fiber.lanes = lanes, fiber.return = returnFiber, fiber;
          }
        };
      }
      var reconcileChildFibers = createChildReconciler(!0), mountChildFibers = createChildReconciler(!1), hasForceUpdate = !1;
      function initializeUpdateQueue(fiber) {
        fiber.updateQueue = {
          baseState: fiber.memoizedState,
          firstBaseUpdate: null,
          lastBaseUpdate: null,
          shared: { pending: null, lanes: 0, hiddenCallbacks: null },
          callbacks: null
        };
      }
      function cloneUpdateQueue(current, workInProgress2) {
        current = current.updateQueue, workInProgress2.updateQueue === current && (workInProgress2.updateQueue = {
          baseState: current.baseState,
          firstBaseUpdate: current.firstBaseUpdate,
          lastBaseUpdate: current.lastBaseUpdate,
          shared: current.shared,
          callbacks: null
        });
      }
      function createUpdate(lane) {
        return { lane, tag: 0, payload: null, callback: null, next: null };
      }
      function enqueueUpdate(fiber, update, lane) {
        var updateQueue = fiber.updateQueue;
        if (updateQueue === null) return null;
        if (updateQueue = updateQueue.shared, (executionContext & 2) !== 0) {
          var pending = updateQueue.pending;
          return pending === null ? update.next = update : (update.next = pending.next, pending.next = update), updateQueue.pending = update, update = getRootForUpdatedFiber(fiber), markUpdateLaneFromFiberToRoot(fiber, null, lane), update;
        }
        return enqueueUpdate$1(fiber, updateQueue, update, lane), getRootForUpdatedFiber(fiber);
      }
      function entangleTransitions(root2, fiber, lane) {
        if (fiber = fiber.updateQueue, fiber !== null && (fiber = fiber.shared, (lane & 4194048) !== 0)) {
          var queueLanes = fiber.lanes;
          queueLanes &= root2.pendingLanes, lane |= queueLanes, fiber.lanes = lane, markRootEntangled(root2, lane);
        }
      }
      function enqueueCapturedUpdate(workInProgress2, capturedUpdate) {
        var queue = workInProgress2.updateQueue, current = workInProgress2.alternate;
        if (current !== null && (current = current.updateQueue, queue === current)) {
          var newFirst = null, newLast = null;
          if (queue = queue.firstBaseUpdate, queue !== null) {
            do {
              var clone = {
                lane: queue.lane,
                tag: queue.tag,
                payload: queue.payload,
                callback: null,
                next: null
              };
              newLast === null ? newFirst = newLast = clone : newLast = newLast.next = clone, queue = queue.next;
            } while (queue !== null);
            newLast === null ? newFirst = newLast = capturedUpdate : newLast = newLast.next = capturedUpdate;
          } else newFirst = newLast = capturedUpdate;
          queue = {
            baseState: current.baseState,
            firstBaseUpdate: newFirst,
            lastBaseUpdate: newLast,
            shared: current.shared,
            callbacks: current.callbacks
          }, workInProgress2.updateQueue = queue;
          return;
        }
        workInProgress2 = queue.lastBaseUpdate, workInProgress2 === null ? queue.firstBaseUpdate = capturedUpdate : workInProgress2.next = capturedUpdate, queue.lastBaseUpdate = capturedUpdate;
      }
      var didReadFromEntangledAsyncAction = !1;
      function suspendIfUpdateReadFromEntangledAsyncAction() {
        if (didReadFromEntangledAsyncAction) {
          var entangledActionThenable = currentEntangledActionThenable;
          if (entangledActionThenable !== null) throw entangledActionThenable;
        }
      }
      function processUpdateQueue(workInProgress$jscomp$0, props, instance$jscomp$0, renderLanes2) {
        didReadFromEntangledAsyncAction = !1;
        var queue = workInProgress$jscomp$0.updateQueue;
        hasForceUpdate = !1;
        var firstBaseUpdate = queue.firstBaseUpdate, lastBaseUpdate = queue.lastBaseUpdate, pendingQueue = queue.shared.pending;
        if (pendingQueue !== null) {
          queue.shared.pending = null;
          var lastPendingUpdate = pendingQueue, firstPendingUpdate = lastPendingUpdate.next;
          lastPendingUpdate.next = null, lastBaseUpdate === null ? firstBaseUpdate = firstPendingUpdate : lastBaseUpdate.next = firstPendingUpdate, lastBaseUpdate = lastPendingUpdate;
          var current = workInProgress$jscomp$0.alternate;
          current !== null && (current = current.updateQueue, pendingQueue = current.lastBaseUpdate, pendingQueue !== lastBaseUpdate && (pendingQueue === null ? current.firstBaseUpdate = firstPendingUpdate : pendingQueue.next = firstPendingUpdate, current.lastBaseUpdate = lastPendingUpdate));
        }
        if (firstBaseUpdate !== null) {
          var newState = queue.baseState;
          lastBaseUpdate = 0, current = firstPendingUpdate = lastPendingUpdate = null, pendingQueue = firstBaseUpdate;
          do {
            var updateLane = pendingQueue.lane & -536870913, isHiddenUpdate = updateLane !== pendingQueue.lane;
            if (isHiddenUpdate ? (workInProgressRootRenderLanes & updateLane) === updateLane : (renderLanes2 & updateLane) === updateLane) {
              updateLane !== 0 && updateLane === currentEntangledLane && (didReadFromEntangledAsyncAction = !0), current !== null && (current = current.next = {
                lane: 0,
                tag: pendingQueue.tag,
                payload: pendingQueue.payload,
                callback: null,
                next: null
              });
              a: {
                var workInProgress2 = workInProgress$jscomp$0, update = pendingQueue;
                updateLane = props;
                var instance = instance$jscomp$0;
                switch (update.tag) {
                  case 1:
                    if (workInProgress2 = update.payload, typeof workInProgress2 == "function") {
                      newState = workInProgress2.call(instance, newState, updateLane);
                      break a;
                    }
                    newState = workInProgress2;
                    break a;
                  case 3:
                    workInProgress2.flags = workInProgress2.flags & -65537 | 128;
                  case 0:
                    if (workInProgress2 = update.payload, updateLane = typeof workInProgress2 == "function" ? workInProgress2.call(instance, newState, updateLane) : workInProgress2, updateLane == null) break a;
                    newState = assign({}, newState, updateLane);
                    break a;
                  case 2:
                    hasForceUpdate = !0;
                }
              }
              updateLane = pendingQueue.callback, updateLane !== null && (workInProgress$jscomp$0.flags |= 64, isHiddenUpdate && (workInProgress$jscomp$0.flags |= 8192), isHiddenUpdate = queue.callbacks, isHiddenUpdate === null ? queue.callbacks = [updateLane] : isHiddenUpdate.push(updateLane));
            } else
              isHiddenUpdate = {
                lane: updateLane,
                tag: pendingQueue.tag,
                payload: pendingQueue.payload,
                callback: pendingQueue.callback,
                next: null
              }, current === null ? (firstPendingUpdate = current = isHiddenUpdate, lastPendingUpdate = newState) : current = current.next = isHiddenUpdate, lastBaseUpdate |= updateLane;
            if (pendingQueue = pendingQueue.next, pendingQueue === null) {
              if (pendingQueue = queue.shared.pending, pendingQueue === null)
                break;
              isHiddenUpdate = pendingQueue, pendingQueue = isHiddenUpdate.next, isHiddenUpdate.next = null, queue.lastBaseUpdate = isHiddenUpdate, queue.shared.pending = null;
            }
          } while (!0);
          current === null && (lastPendingUpdate = newState), queue.baseState = lastPendingUpdate, queue.firstBaseUpdate = firstPendingUpdate, queue.lastBaseUpdate = current, firstBaseUpdate === null && (queue.shared.lanes = 0), workInProgressRootSkippedLanes |= lastBaseUpdate, workInProgress$jscomp$0.lanes = lastBaseUpdate, workInProgress$jscomp$0.memoizedState = newState;
        }
      }
      function callCallback(callback, context) {
        if (typeof callback != "function")
          throw Error(formatProdErrorMessage(191, callback));
        callback.call(context);
      }
      function commitCallbacks(updateQueue, context) {
        var callbacks = updateQueue.callbacks;
        if (callbacks !== null)
          for (updateQueue.callbacks = null, updateQueue = 0; updateQueue < callbacks.length; updateQueue++)
            callCallback(callbacks[updateQueue], context);
      }
      var currentTreeHiddenStackCursor = createCursor(null), prevEntangledRenderLanesCursor = createCursor(0);
      function pushHiddenContext(fiber, context) {
        fiber = entangledRenderLanes, push(prevEntangledRenderLanesCursor, fiber), push(currentTreeHiddenStackCursor, context), entangledRenderLanes = fiber | context.baseLanes;
      }
      function reuseHiddenContextOnStack() {
        push(prevEntangledRenderLanesCursor, entangledRenderLanes), push(currentTreeHiddenStackCursor, currentTreeHiddenStackCursor.current);
      }
      function popHiddenContext() {
        entangledRenderLanes = prevEntangledRenderLanesCursor.current, pop(currentTreeHiddenStackCursor), pop(prevEntangledRenderLanesCursor);
      }
      var suspenseHandlerStackCursor = createCursor(null), shellBoundary = null;
      function pushPrimaryTreeSuspenseHandler(handler) {
        var current = handler.alternate;
        push(suspenseStackCursor, suspenseStackCursor.current & 1), push(suspenseHandlerStackCursor, handler), shellBoundary === null && (current === null || currentTreeHiddenStackCursor.current !== null || current.memoizedState !== null) && (shellBoundary = handler);
      }
      function pushDehydratedActivitySuspenseHandler(fiber) {
        push(suspenseStackCursor, suspenseStackCursor.current), push(suspenseHandlerStackCursor, fiber), shellBoundary === null && (shellBoundary = fiber);
      }
      function pushOffscreenSuspenseHandler(fiber) {
        fiber.tag === 22 ? (push(suspenseStackCursor, suspenseStackCursor.current), push(suspenseHandlerStackCursor, fiber), shellBoundary === null && (shellBoundary = fiber)) : reuseSuspenseHandlerOnStack();
      }
      function reuseSuspenseHandlerOnStack() {
        push(suspenseStackCursor, suspenseStackCursor.current), push(suspenseHandlerStackCursor, suspenseHandlerStackCursor.current);
      }
      function popSuspenseHandler(fiber) {
        pop(suspenseHandlerStackCursor), shellBoundary === fiber && (shellBoundary = null), pop(suspenseStackCursor);
      }
      var suspenseStackCursor = createCursor(0);
      function pushSuspenseListContext(fiber, newContext) {
        push(suspenseHandlerStackCursor, suspenseHandlerStackCursor.current), push(suspenseStackCursor, newContext);
      }
      function popSuspenseListContext(fiber) {
        pop(suspenseStackCursor), pop(suspenseHandlerStackCursor), shellBoundary === fiber && (shellBoundary = null);
      }
      function findFirstSuspended(row) {
        for (var node = row; node !== null; ) {
          if (node.tag === 13) {
            var state = node.memoizedState;
            if (state !== null && (state = state.dehydrated, state === null || isSuspenseInstancePending(state) || isSuspenseInstanceFallback(state)))
              return node;
          } else if (node.tag === 19 && node.memoizedProps.revealOrder !== "independent") {
            if ((node.flags & 128) !== 0) return node;
          } else if (node.child !== null) {
            node.child.return = node, node = node.child;
            continue;
          }
          if (node === row) break;
          for (; node.sibling === null; ) {
            if (node.return === null || node.return === row) return null;
            node = node.return;
          }
          node.sibling.return = node.return, node = node.sibling;
        }
        return null;
      }
      var renderLanes = 0, currentlyRenderingFiber = null, currentHook = null, workInProgressHook = null, didScheduleRenderPhaseUpdate = !1, didScheduleRenderPhaseUpdateDuringThisPass = !1, shouldDoubleInvokeUserFnsInHooksDEV = !1, localIdCounter = 0, thenableIndexCounter = 0, thenableState = null, globalClientIdCounter = 0;
      function throwInvalidHookError() {
        throw Error(formatProdErrorMessage(321));
      }
      function areHookInputsEqual(nextDeps, prevDeps) {
        if (prevDeps === null) return !1;
        for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++)
          if (!objectIs(nextDeps[i], prevDeps[i])) return !1;
        return !0;
      }
      function renderWithHooks(current, workInProgress2, Component, props, secondArg, nextRenderLanes) {
        return renderLanes = nextRenderLanes, currentlyRenderingFiber = workInProgress2, workInProgress2.memoizedState = null, workInProgress2.updateQueue = null, workInProgress2.lanes = 0, ReactSharedInternals.H = current === null || current.memoizedState === null ? HooksDispatcherOnMount : HooksDispatcherOnUpdate, shouldDoubleInvokeUserFnsInHooksDEV = !1, nextRenderLanes = Component(props, secondArg), shouldDoubleInvokeUserFnsInHooksDEV = !1, didScheduleRenderPhaseUpdateDuringThisPass && (nextRenderLanes = renderWithHooksAgain(
          workInProgress2,
          Component,
          props,
          secondArg
        )), finishRenderingHooks(current), nextRenderLanes;
      }
      function finishRenderingHooks(current) {
        ReactSharedInternals.H = ContextOnlyDispatcher;
        var didRenderTooFewHooks = currentHook !== null && currentHook.next !== null;
        if (renderLanes = 0, workInProgressHook = currentHook = currentlyRenderingFiber = null, didScheduleRenderPhaseUpdate = !1, thenableIndexCounter = 0, thenableState = null, didRenderTooFewHooks) throw Error(formatProdErrorMessage(300));
        current === null || didReceiveUpdate || (current = current.dependencies, current !== null && checkIfContextChanged(current) && (didReceiveUpdate = !0));
      }
      function renderWithHooksAgain(workInProgress2, Component, props, secondArg) {
        currentlyRenderingFiber = workInProgress2;
        var numberOfReRenders = 0;
        do {
          if (didScheduleRenderPhaseUpdateDuringThisPass && (thenableState = null), thenableIndexCounter = 0, didScheduleRenderPhaseUpdateDuringThisPass = !1, 25 <= numberOfReRenders) throw Error(formatProdErrorMessage(301));
          if (numberOfReRenders += 1, workInProgressHook = currentHook = null, workInProgress2.updateQueue != null) {
            var children = workInProgress2.updateQueue;
            children.lastEffect = null, children.events = null, children.stores = null, children.memoCache != null && (children.memoCache.index = 0);
          }
          ReactSharedInternals.H = HooksDispatcherOnRerender, children = Component(props, secondArg);
        } while (didScheduleRenderPhaseUpdateDuringThisPass);
        return children;
      }
      function TransitionAwareHostComponent() {
        var dispatcher = ReactSharedInternals.H, maybeThenable = dispatcher.useState()[0];
        return maybeThenable = typeof maybeThenable.then == "function" ? useThenable(maybeThenable) : maybeThenable, dispatcher = dispatcher.useState()[0], (currentHook !== null ? currentHook.memoizedState : null) !== dispatcher && (currentlyRenderingFiber.flags |= 1024), maybeThenable;
      }
      function checkDidRenderIdHook() {
        var didRenderIdHook = localIdCounter !== 0;
        return localIdCounter = 0, didRenderIdHook;
      }
      function bailoutHooks(current, workInProgress2, lanes) {
        workInProgress2.updateQueue = current.updateQueue, workInProgress2.flags &= -2053, current.lanes &= ~lanes;
      }
      function resetHooksOnUnwind(workInProgress2) {
        if (didScheduleRenderPhaseUpdate) {
          for (workInProgress2 = workInProgress2.memoizedState; workInProgress2 !== null; ) {
            var queue = workInProgress2.queue;
            queue !== null && (queue.pending = null), workInProgress2 = workInProgress2.next;
          }
          didScheduleRenderPhaseUpdate = !1;
        }
        renderLanes = 0, workInProgressHook = currentHook = currentlyRenderingFiber = null, didScheduleRenderPhaseUpdateDuringThisPass = !1, thenableIndexCounter = localIdCounter = 0, thenableState = null;
      }
      function mountWorkInProgressHook() {
        var hook = {
          memoizedState: null,
          baseState: null,
          baseQueue: null,
          queue: null,
          next: null
        };
        return workInProgressHook === null ? currentlyRenderingFiber.memoizedState = workInProgressHook = hook : workInProgressHook = workInProgressHook.next = hook, workInProgressHook;
      }
      function updateWorkInProgressHook() {
        if (currentHook === null) {
          var nextCurrentHook = currentlyRenderingFiber.alternate;
          nextCurrentHook = nextCurrentHook !== null ? nextCurrentHook.memoizedState : null;
        } else nextCurrentHook = currentHook.next;
        var nextWorkInProgressHook = workInProgressHook === null ? currentlyRenderingFiber.memoizedState : workInProgressHook.next;
        if (nextWorkInProgressHook !== null)
          workInProgressHook = nextWorkInProgressHook, currentHook = nextCurrentHook;
        else {
          if (nextCurrentHook === null)
            throw currentlyRenderingFiber.alternate === null ? Error(formatProdErrorMessage(467)) : Error(formatProdErrorMessage(310));
          currentHook = nextCurrentHook, nextCurrentHook = {
            memoizedState: currentHook.memoizedState,
            baseState: currentHook.baseState,
            baseQueue: currentHook.baseQueue,
            queue: currentHook.queue,
            next: null
          }, workInProgressHook === null ? currentlyRenderingFiber.memoizedState = workInProgressHook = nextCurrentHook : workInProgressHook = workInProgressHook.next = nextCurrentHook;
        }
        return workInProgressHook;
      }
      function createFunctionComponentUpdateQueue() {
        return { lastEffect: null, events: null, stores: null, memoCache: null };
      }
      function useThenable(thenable) {
        var index3 = thenableIndexCounter;
        return thenableIndexCounter += 1, thenableState === null && (thenableState = []), thenable = trackUsedThenable(thenableState, thenable, index3), index3 = currentlyRenderingFiber, (workInProgressHook === null ? index3.memoizedState : workInProgressHook.next) === null && (index3 = index3.alternate, ReactSharedInternals.H = index3 === null || index3.memoizedState === null ? HooksDispatcherOnMount : HooksDispatcherOnUpdate), thenable;
      }
      function use2(usable) {
        if (usable !== null && typeof usable == "object") {
          if (typeof usable.then == "function") return useThenable(usable);
          if (usable.$$typeof === REACT_RECOVERABLE_TYPE) return;
          if (usable.$$typeof === REACT_CONTEXT_TYPE) return readContext(usable);
        }
        throw Error(formatProdErrorMessage(438, String(usable)));
      }
      function useMemoCache(size4) {
        var memoCache = null, updateQueue = currentlyRenderingFiber.updateQueue;
        if (updateQueue !== null && (memoCache = updateQueue.memoCache), memoCache == null) {
          var current = currentlyRenderingFiber.alternate;
          current !== null && (current = current.updateQueue, current !== null && (current = current.memoCache, current != null && (memoCache = {
            data: current.data.map(function(array) {
              return array.slice();
            }),
            index: 0
          })));
        }
        if (memoCache == null && (memoCache = { data: [], index: 0 }), updateQueue === null && (updateQueue = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = updateQueue), updateQueue.memoCache = memoCache, updateQueue = memoCache.data[memoCache.index], updateQueue === void 0)
          for (updateQueue = memoCache.data[memoCache.index] = Array(size4), current = 0; current < size4; current++)
            updateQueue[current] = REACT_MEMO_CACHE_SENTINEL;
        return memoCache.index++, updateQueue;
      }
      function basicStateReducer(state, action) {
        return typeof action == "function" ? action(state) : action;
      }
      function updateReducer(reducer) {
        var hook = updateWorkInProgressHook();
        return updateReducerImpl(hook, currentHook, reducer);
      }
      function updateReducerImpl(hook, current, reducer) {
        var queue = hook.queue;
        if (queue === null) throw Error(formatProdErrorMessage(311));
        queue.lastRenderedReducer = reducer;
        var baseQueue = hook.baseQueue, pendingQueue = queue.pending;
        if (pendingQueue !== null) {
          if (baseQueue !== null) {
            var baseFirst = baseQueue.next;
            baseQueue.next = pendingQueue.next, pendingQueue.next = baseFirst;
          }
          current.baseQueue = baseQueue = pendingQueue, queue.pending = null;
        }
        if (pendingQueue = hook.baseState, baseQueue === null) hook.memoizedState = pendingQueue;
        else {
          current = baseQueue.next;
          var newBaseQueueFirst = baseFirst = null, newBaseQueueLast = null, update = current, didReadFromEntangledAsyncAction$64 = !1;
          do {
            var updateLane = update.lane & -536870913;
            if (updateLane !== update.lane ? (workInProgressRootRenderLanes & updateLane) === updateLane : (renderLanes & updateLane) === updateLane) {
              var revertLane = update.revertLane;
              if (revertLane === 0)
                newBaseQueueLast !== null && (newBaseQueueLast = newBaseQueueLast.next = {
                  lane: 0,
                  revertLane: 0,
                  gesture: null,
                  action: update.action,
                  hasEagerState: update.hasEagerState,
                  eagerState: update.eagerState,
                  next: null
                }), updateLane === currentEntangledLane && (didReadFromEntangledAsyncAction$64 = !0);
              else if ((renderLanes & revertLane) === revertLane) {
                update = update.next, revertLane === currentEntangledLane && (didReadFromEntangledAsyncAction$64 = !0);
                continue;
              } else
                updateLane = {
                  lane: 0,
                  revertLane: update.revertLane,
                  gesture: null,
                  action: update.action,
                  hasEagerState: update.hasEagerState,
                  eagerState: update.eagerState,
                  next: null
                }, newBaseQueueLast === null ? (newBaseQueueFirst = newBaseQueueLast = updateLane, baseFirst = pendingQueue) : newBaseQueueLast = newBaseQueueLast.next = updateLane, currentlyRenderingFiber.lanes |= revertLane, workInProgressRootSkippedLanes |= revertLane;
              updateLane = update.action, shouldDoubleInvokeUserFnsInHooksDEV && reducer(pendingQueue, updateLane), pendingQueue = update.hasEagerState ? update.eagerState : reducer(pendingQueue, updateLane);
            } else
              revertLane = {
                lane: updateLane,
                revertLane: update.revertLane,
                gesture: update.gesture,
                action: update.action,
                hasEagerState: update.hasEagerState,
                eagerState: update.eagerState,
                next: null
              }, newBaseQueueLast === null ? (newBaseQueueFirst = newBaseQueueLast = revertLane, baseFirst = pendingQueue) : newBaseQueueLast = newBaseQueueLast.next = revertLane, currentlyRenderingFiber.lanes |= updateLane, workInProgressRootSkippedLanes |= updateLane;
            update = update.next;
          } while (update !== null && update !== current);
          if (newBaseQueueLast === null ? baseFirst = pendingQueue : newBaseQueueLast.next = newBaseQueueFirst, !objectIs(pendingQueue, hook.memoizedState) && (didReceiveUpdate = !0, didReadFromEntangledAsyncAction$64 && (reducer = currentEntangledActionThenable, reducer !== null)))
            throw reducer;
          hook.memoizedState = pendingQueue, hook.baseState = baseFirst, hook.baseQueue = newBaseQueueLast, queue.lastRenderedState = pendingQueue;
        }
        return baseQueue === null && (queue.lanes = 0), [hook.memoizedState, queue.dispatch];
      }
      function rerenderReducer(reducer) {
        var hook = updateWorkInProgressHook(), queue = hook.queue;
        if (queue === null) throw Error(formatProdErrorMessage(311));
        queue.lastRenderedReducer = reducer;
        var dispatch = queue.dispatch, lastRenderPhaseUpdate = queue.pending, newState = hook.memoizedState;
        if (lastRenderPhaseUpdate !== null) {
          queue.pending = null;
          var update = lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
          do
            newState = reducer(newState, update.action), update = update.next;
          while (update !== lastRenderPhaseUpdate);
          objectIs(newState, hook.memoizedState) || (didReceiveUpdate = !0), hook.memoizedState = newState, hook.baseQueue === null && (hook.baseState = newState), queue.lastRenderedState = newState;
        }
        return [newState, dispatch];
      }
      function updateSyncExternalStore(subscribe2, getSnapshot, getServerSnapshot) {
        var fiber = currentlyRenderingFiber, hook = updateWorkInProgressHook(), isHydrating$jscomp$0 = isHydrating;
        if (isHydrating$jscomp$0) {
          if (getServerSnapshot === void 0) throw Error(formatProdErrorMessage(407));
          getServerSnapshot = getServerSnapshot();
        } else getServerSnapshot = getSnapshot();
        var snapshotChanged = !objectIs(
          (currentHook || hook).memoizedState,
          getServerSnapshot
        );
        if (snapshotChanged && (hook.memoizedState = getServerSnapshot, didReceiveUpdate = !0), hook = hook.queue, updateEffect(subscribeToStore.bind(null, fiber, hook, subscribe2), [
          subscribe2
        ]), subscribe2 = hook.getSnapshot !== getSnapshot || snapshotChanged || workInProgressHook !== null && (workInProgressHook.memoizedState.tag & 1) !== 0, pushSimpleEffect(
          subscribe2 ? 9 : 8,
          { destroy: void 0 },
          updateStoreInstance.bind(null, fiber, hook, getServerSnapshot, getSnapshot),
          null
        ), subscribe2) {
          if (fiber.flags |= 2048, workInProgressRoot === null) throw Error(formatProdErrorMessage(349));
          isHydrating$jscomp$0 || (renderLanes & 127) !== 0 || pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
        }
        return getServerSnapshot;
      }
      function pushStoreConsistencyCheck(fiber, getSnapshot, renderedSnapshot) {
        fiber.flags |= 16384, fiber = { getSnapshot, value: renderedSnapshot }, getSnapshot = currentlyRenderingFiber.updateQueue, getSnapshot === null ? (getSnapshot = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = getSnapshot, getSnapshot.stores = [fiber]) : (renderedSnapshot = getSnapshot.stores, renderedSnapshot === null ? getSnapshot.stores = [fiber] : renderedSnapshot.push(fiber));
      }
      function updateStoreInstance(fiber, inst, nextSnapshot, getSnapshot) {
        inst.value = nextSnapshot, inst.getSnapshot = getSnapshot, checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
      }
      function subscribeToStore(fiber, inst, subscribe2) {
        return subscribe2(function() {
          checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
        });
      }
      function checkIfSnapshotChanged(inst) {
        var latestGetSnapshot = inst.getSnapshot;
        inst = inst.value;
        try {
          var nextValue = latestGetSnapshot();
          return !objectIs(inst, nextValue);
        } catch {
          return !0;
        }
      }
      function forceStoreRerender(fiber) {
        var root2 = enqueueConcurrentRenderForLane(fiber, 2);
        root2 !== null && scheduleUpdateOnFiber(root2, fiber, 2);
      }
      function mountStateImpl(initialState) {
        var hook = mountWorkInProgressHook();
        if (typeof initialState == "function") {
          var initialStateInitializer = initialState;
          if (initialState = initialStateInitializer(), shouldDoubleInvokeUserFnsInHooksDEV) {
            setIsStrictModeForDevtools(!0);
            try {
              initialStateInitializer();
            } finally {
              setIsStrictModeForDevtools(!1);
            }
          }
        }
        return hook.memoizedState = hook.baseState = initialState, hook.queue = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: basicStateReducer,
          lastRenderedState: initialState
        }, hook;
      }
      function updateOptimisticImpl(hook, current, passthrough, reducer) {
        return hook.baseState = passthrough, updateReducerImpl(
          hook,
          currentHook,
          typeof reducer == "function" ? reducer : basicStateReducer
        );
      }
      function dispatchActionState(fiber, actionQueue, setPendingState, setState, payload) {
        if (isRenderPhaseUpdate(fiber)) throw Error(formatProdErrorMessage(485));
        if (fiber = actionQueue.action, fiber !== null) {
          var actionNode = {
            payload,
            action: fiber,
            next: null,
            isTransition: !0,
            status: "pending",
            value: null,
            reason: null,
            listeners: [],
            then: function(listener) {
              actionNode.listeners.push(listener);
            }
          };
          ReactSharedInternals.T !== null ? setPendingState(!0) : actionNode.isTransition = !1, setState(actionNode), setPendingState = actionQueue.pending, setPendingState === null ? (actionNode.next = actionQueue.pending = actionNode, runActionStateAction(actionQueue, actionNode)) : (actionNode.next = setPendingState.next, actionQueue.pending = setPendingState.next = actionNode);
        }
      }
      function runActionStateAction(actionQueue, node) {
        var action = node.action, payload = node.payload, prevState = actionQueue.state;
        if (node.isTransition) {
          var prevTransition = ReactSharedInternals.T, currentTransition = {};
          currentTransition.types = prevTransition !== null ? prevTransition.types : null, ReactSharedInternals.T = currentTransition;
          try {
            var returnValue = action(prevState, payload), onStartTransitionFinish = ReactSharedInternals.S;
            onStartTransitionFinish !== null && onStartTransitionFinish(currentTransition, returnValue), handleActionReturnValue(actionQueue, node, returnValue);
          } catch (error) {
            onActionError(actionQueue, node, error);
          } finally {
            prevTransition !== null && currentTransition.types !== null && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
          }
        } else
          try {
            prevTransition = action(prevState, payload), handleActionReturnValue(actionQueue, node, prevTransition);
          } catch (error$70) {
            onActionError(actionQueue, node, error$70);
          }
      }
      function handleActionReturnValue(actionQueue, node, returnValue) {
        returnValue !== null && typeof returnValue == "object" && typeof returnValue.then == "function" ? returnValue.then(
          function(nextState) {
            onActionSuccess(actionQueue, node, nextState);
          },
          function(error) {
            return onActionError(actionQueue, node, error);
          }
        ) : onActionSuccess(actionQueue, node, returnValue);
      }
      function onActionSuccess(actionQueue, actionNode, nextState) {
        actionNode.status = "fulfilled", actionNode.value = nextState, notifyActionListeners(actionNode), actionQueue.state = nextState, actionNode = actionQueue.pending, actionNode !== null && (nextState = actionNode.next, nextState === actionNode ? actionQueue.pending = null : (nextState = nextState.next, actionNode.next = nextState, runActionStateAction(actionQueue, nextState)));
      }
      function onActionError(actionQueue, actionNode, error) {
        var last = actionQueue.pending;
        if (actionQueue.pending = null, last !== null) {
          last = last.next;
          do
            actionNode.status = "rejected", actionNode.reason = error, notifyActionListeners(actionNode), actionNode = actionNode.next;
          while (actionNode !== last);
        }
        actionQueue.action = null;
      }
      function notifyActionListeners(actionNode) {
        actionNode = actionNode.listeners;
        for (var i = 0; i < actionNode.length; i++) (0, actionNode[i])();
      }
      function actionStateReducer(oldState, newState) {
        return newState;
      }
      function mountActionState(action, initialStateProp) {
        if (isHydrating) {
          var ssrFormState = workInProgressRoot.formState;
          if (ssrFormState !== null) {
            a: {
              var JSCompiler_inline_result = currentlyRenderingFiber;
              if (isHydrating) {
                if (nextHydratableInstance) {
                  b: {
                    for (var JSCompiler_inline_result$jscomp$0 = nextHydratableInstance, inRootOrSingleton = rootOrSingletonContext; JSCompiler_inline_result$jscomp$0.nodeType !== 8; ) {
                      if (!inRootOrSingleton) {
                        JSCompiler_inline_result$jscomp$0 = null;
                        break b;
                      }
                      if (JSCompiler_inline_result$jscomp$0 = getNextHydratable(
                        JSCompiler_inline_result$jscomp$0.nextSibling
                      ), JSCompiler_inline_result$jscomp$0 === null) {
                        JSCompiler_inline_result$jscomp$0 = null;
                        break b;
                      }
                    }
                    inRootOrSingleton = JSCompiler_inline_result$jscomp$0.data, JSCompiler_inline_result$jscomp$0 = inRootOrSingleton === "F!" || inRootOrSingleton === "F" ? JSCompiler_inline_result$jscomp$0 : null;
                  }
                  if (JSCompiler_inline_result$jscomp$0) {
                    nextHydratableInstance = getNextHydratable(
                      JSCompiler_inline_result$jscomp$0.nextSibling
                    ), JSCompiler_inline_result = JSCompiler_inline_result$jscomp$0.data === "F!";
                    break a;
                  }
                }
                throwOnHydrationMismatch(JSCompiler_inline_result);
              }
              JSCompiler_inline_result = !1;
            }
            JSCompiler_inline_result && (initialStateProp = ssrFormState[0]);
          }
        }
        return ssrFormState = mountWorkInProgressHook(), ssrFormState.memoizedState = ssrFormState.baseState = initialStateProp, JSCompiler_inline_result = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: actionStateReducer,
          lastRenderedState: initialStateProp
        }, ssrFormState.queue = JSCompiler_inline_result, ssrFormState = dispatchSetState.bind(
          null,
          currentlyRenderingFiber,
          JSCompiler_inline_result
        ), JSCompiler_inline_result.dispatch = ssrFormState, JSCompiler_inline_result = mountStateImpl(!1), inRootOrSingleton = dispatchOptimisticSetState.bind(
          null,
          currentlyRenderingFiber,
          !1,
          JSCompiler_inline_result.queue
        ), JSCompiler_inline_result = mountWorkInProgressHook(), JSCompiler_inline_result$jscomp$0 = {
          state: initialStateProp,
          dispatch: null,
          action,
          pending: null
        }, JSCompiler_inline_result.queue = JSCompiler_inline_result$jscomp$0, ssrFormState = dispatchActionState.bind(
          null,
          currentlyRenderingFiber,
          JSCompiler_inline_result$jscomp$0,
          inRootOrSingleton,
          ssrFormState
        ), JSCompiler_inline_result$jscomp$0.dispatch = ssrFormState, JSCompiler_inline_result.memoizedState = action, [initialStateProp, ssrFormState, !1];
      }
      function updateActionState(action) {
        var stateHook = updateWorkInProgressHook();
        return updateActionStateImpl(stateHook, currentHook, action);
      }
      function updateActionStateImpl(stateHook, currentStateHook, action) {
        if (currentStateHook = updateReducerImpl(
          stateHook,
          currentStateHook,
          actionStateReducer
        )[0], stateHook = updateReducer(basicStateReducer)[0], typeof currentStateHook == "object" && currentStateHook !== null && typeof currentStateHook.then == "function")
          try {
            var state = useThenable(currentStateHook);
          } catch (x) {
            throw x === SuspenseException ? SuspenseActionException : x;
          }
        else state = currentStateHook;
        currentStateHook = updateWorkInProgressHook();
        var actionQueue = currentStateHook.queue, dispatch = actionQueue.dispatch;
        return action !== currentStateHook.memoizedState && (currentlyRenderingFiber.flags |= 2048, pushSimpleEffect(
          9,
          { destroy: void 0 },
          actionStateActionEffect.bind(null, actionQueue, action),
          null
        )), [state, dispatch, stateHook];
      }
      function actionStateActionEffect(actionQueue, action) {
        actionQueue.action = action;
      }
      function rerenderActionState(action) {
        var stateHook = updateWorkInProgressHook(), currentStateHook = currentHook;
        if (currentStateHook !== null)
          return updateActionStateImpl(stateHook, currentStateHook, action);
        updateWorkInProgressHook(), stateHook = stateHook.memoizedState, currentStateHook = updateWorkInProgressHook();
        var dispatch = currentStateHook.queue.dispatch;
        return currentStateHook.memoizedState = action, [stateHook, dispatch, !1];
      }
      function pushSimpleEffect(tag, inst, create, deps) {
        return tag = { tag, create, deps, inst, next: null }, inst = currentlyRenderingFiber.updateQueue, inst === null && (inst = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = inst), create = inst.lastEffect, create === null ? inst.lastEffect = tag.next = tag : (deps = create.next, create.next = tag, tag.next = deps, inst.lastEffect = tag), tag;
      }
      function updateRef() {
        return updateWorkInProgressHook().memoizedState;
      }
      function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
        var hook = mountWorkInProgressHook();
        currentlyRenderingFiber.flags |= fiberFlags, hook.memoizedState = pushSimpleEffect(
          1 | hookFlags,
          { destroy: void 0 },
          create,
          deps === void 0 ? null : deps
        );
      }
      function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
        var hook = updateWorkInProgressHook();
        deps = deps === void 0 ? null : deps;
        var inst = hook.memoizedState.inst;
        currentHook !== null && deps !== null && areHookInputsEqual(deps, currentHook.memoizedState.deps) ? hook.memoizedState = pushSimpleEffect(hookFlags, inst, create, deps) : (currentlyRenderingFiber.flags |= fiberFlags, hook.memoizedState = pushSimpleEffect(
          1 | hookFlags,
          inst,
          create,
          deps
        ));
      }
      function mountEffect(create, deps) {
        mountEffectImpl(8390656, 8, create, deps);
      }
      function updateEffect(create, deps) {
        updateEffectImpl(2048, 8, create, deps);
      }
      function useEffectEventImpl(payload) {
        currentlyRenderingFiber.flags |= 4;
        var componentUpdateQueue = currentlyRenderingFiber.updateQueue;
        if (componentUpdateQueue === null)
          componentUpdateQueue = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = componentUpdateQueue, componentUpdateQueue.events = [payload];
        else {
          var events = componentUpdateQueue.events;
          events === null ? componentUpdateQueue.events = [payload] : events.push(payload);
        }
      }
      function updateEvent(callback) {
        var ref = updateWorkInProgressHook().memoizedState;
        return useEffectEventImpl({ ref, nextImpl: callback }), function() {
          if ((executionContext & 2) !== 0) throw Error(formatProdErrorMessage(440));
          return ref.impl.apply(void 0, arguments);
        };
      }
      function updateInsertionEffect(create, deps) {
        return updateEffectImpl(4, 2, create, deps);
      }
      function updateLayoutEffect(create, deps) {
        return updateEffectImpl(4, 4, create, deps);
      }
      function imperativeHandleEffect(create, ref) {
        if (typeof ref == "function") {
          create = create();
          var refCleanup = ref(create);
          return function() {
            typeof refCleanup == "function" ? refCleanup() : ref(null);
          };
        }
        if (ref != null)
          return create = create(), ref.current = create, function() {
            ref.current = null;
          };
      }
      function updateImperativeHandle(ref, create, deps) {
        deps = deps != null ? deps.concat([ref]) : null, updateEffectImpl(4, 4, imperativeHandleEffect.bind(null, create, ref), deps);
      }
      function mountDebugValue() {
      }
      function updateCallback(callback, deps) {
        var hook = updateWorkInProgressHook();
        deps = deps === void 0 ? null : deps;
        var prevState = hook.memoizedState;
        return deps !== null && areHookInputsEqual(deps, prevState[1]) ? prevState[0] : (hook.memoizedState = [callback, deps], callback);
      }
      function updateMemo(nextCreate, deps) {
        var hook = updateWorkInProgressHook();
        deps = deps === void 0 ? null : deps;
        var prevState = hook.memoizedState;
        if (deps !== null && areHookInputsEqual(deps, prevState[1]))
          return prevState[0];
        if (prevState = nextCreate(), shouldDoubleInvokeUserFnsInHooksDEV) {
          setIsStrictModeForDevtools(!0);
          try {
            nextCreate();
          } finally {
            setIsStrictModeForDevtools(!1);
          }
        }
        return hook.memoizedState = [prevState, deps], prevState;
      }
      function mountDeferredValueImpl(hook, value, initialValue) {
        return initialValue === void 0 || (renderLanes & 1073741824) !== 0 && (workInProgressRootRenderLanes & 261930) === 0 ? hook.memoizedState = value : (hook.memoizedState = initialValue, hook = requestDeferredLane(), currentlyRenderingFiber.lanes |= hook, workInProgressRootSkippedLanes |= hook, initialValue);
      }
      function updateDeferredValueImpl(hook, prevValue, value, initialValue) {
        return objectIs(value, prevValue) ? value : currentTreeHiddenStackCursor.current !== null ? (hook = mountDeferredValueImpl(hook, value, initialValue), objectIs(hook, prevValue) || (didReceiveUpdate = !0), hook) : (renderLanes & 106) === 0 || (renderLanes & 1073741824) !== 0 && (workInProgressRootRenderLanes & 261930) === 0 ? (didReceiveUpdate = !0, hook.memoizedState = value) : (hook = requestDeferredLane(), currentlyRenderingFiber.lanes |= hook, workInProgressRootSkippedLanes |= hook, prevValue);
      }
      function startTransition(fiber, queue, pendingState, finishedState, callback) {
        var previousPriority = ReactDOMSharedInternals.p;
        ReactDOMSharedInternals.p = previousPriority !== 0 && 8 > previousPriority ? previousPriority : 8;
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        currentTransition.types = prevTransition !== null ? prevTransition.types : null, ReactSharedInternals.T = currentTransition, dispatchOptimisticSetState(fiber, !1, queue, pendingState);
        try {
          var returnValue = callback(), onStartTransitionFinish = ReactSharedInternals.S;
          if (onStartTransitionFinish !== null && onStartTransitionFinish(currentTransition, returnValue), returnValue !== null && typeof returnValue == "object" && typeof returnValue.then == "function") {
            var thenableForFinishedState = chainThenableValue(
              returnValue,
              finishedState
            );
            dispatchSetStateInternal(
              fiber,
              queue,
              thenableForFinishedState,
              requestUpdateLane(fiber)
            );
          } else
            dispatchSetStateInternal(
              fiber,
              queue,
              finishedState,
              requestUpdateLane(fiber)
            );
        } catch (error) {
          dispatchSetStateInternal(
            fiber,
            queue,
            { then: function() {
            }, status: "rejected", reason: error },
            requestUpdateLane()
          );
        } finally {
          ReactDOMSharedInternals.p = previousPriority, prevTransition !== null && currentTransition.types !== null && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      }
      function noop3() {
      }
      function startHostTransition(formFiber, pendingState, action, formData) {
        if (formFiber.tag !== 5) throw Error(formatProdErrorMessage(476));
        var queue = ensureFormComponentIsStateful(formFiber).queue;
        startTransition(
          formFiber,
          queue,
          pendingState,
          sharedNotPendingObject,
          action === null ? noop3 : function() {
            return requestFormReset$1(formFiber), action(formData);
          }
        );
      }
      function ensureFormComponentIsStateful(formFiber) {
        var existingStateHook = formFiber.memoizedState;
        if (existingStateHook !== null) return existingStateHook;
        existingStateHook = {
          memoizedState: sharedNotPendingObject,
          baseState: sharedNotPendingObject,
          baseQueue: null,
          queue: {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: basicStateReducer,
            lastRenderedState: sharedNotPendingObject
          },
          next: null
        };
        var initialResetState = {};
        return existingStateHook.next = {
          memoizedState: initialResetState,
          baseState: initialResetState,
          baseQueue: null,
          queue: {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: basicStateReducer,
            lastRenderedState: initialResetState
          },
          next: null
        }, formFiber.memoizedState = existingStateHook, formFiber = formFiber.alternate, formFiber !== null && (formFiber.memoizedState = existingStateHook), existingStateHook;
      }
      function requestFormReset$1(formFiber) {
        var stateHook = ensureFormComponentIsStateful(formFiber);
        stateHook.next === null && (stateHook = formFiber.alternate.memoizedState), dispatchSetStateInternal(
          formFiber,
          stateHook.next.queue,
          {},
          requestUpdateLane()
        );
      }
      function useHostTransitionStatus() {
        return readContext(HostTransitionContext);
      }
      function updateId() {
        return updateWorkInProgressHook().memoizedState;
      }
      function updateRefresh() {
        return updateWorkInProgressHook().memoizedState;
      }
      function refreshCache(fiber) {
        for (var provider = fiber.return; provider !== null; ) {
          switch (provider.tag) {
            case 24:
            case 3:
              var lane = requestUpdateLane();
              fiber = createUpdate(lane);
              var root$73 = enqueueUpdate(provider, fiber, lane);
              root$73 !== null && (scheduleUpdateOnFiber(root$73, provider, lane), entangleTransitions(root$73, provider, lane)), provider = { cache: createCache() }, fiber.payload = provider;
              return;
          }
          provider = provider.return;
        }
      }
      function dispatchReducerAction(fiber, queue, action) {
        var lane = requestUpdateLane();
        action = {
          lane,
          revertLane: 0,
          gesture: null,
          action,
          hasEagerState: !1,
          eagerState: null,
          next: null
        }, isRenderPhaseUpdate(fiber) ? enqueueRenderPhaseUpdate(queue, action) : (action = enqueueConcurrentHookUpdate(fiber, queue, action, lane), action !== null && (scheduleUpdateOnFiber(action, fiber, lane), entangleTransitionUpdate(action, queue, lane)));
      }
      function dispatchSetState(fiber, queue, action) {
        var lane = requestUpdateLane();
        dispatchSetStateInternal(fiber, queue, action, lane);
      }
      function dispatchSetStateInternal(fiber, queue, action, lane) {
        var update = {
          lane,
          revertLane: 0,
          gesture: null,
          action,
          hasEagerState: !1,
          eagerState: null,
          next: null
        };
        if (isRenderPhaseUpdate(fiber)) enqueueRenderPhaseUpdate(queue, update);
        else {
          var alternate = fiber.alternate;
          if (fiber.lanes === 0 && (alternate === null || alternate.lanes === 0) && (alternate = queue.lastRenderedReducer, alternate !== null))
            try {
              var currentState = queue.lastRenderedState, eagerState = alternate(currentState, action);
              if (update.hasEagerState = !0, update.eagerState = eagerState, objectIs(eagerState, currentState))
                return enqueueUpdate$1(fiber, queue, update, 0), workInProgressRoot === null && finishQueueingConcurrentUpdates(), !1;
            } catch {
            }
          if (action = enqueueConcurrentHookUpdate(fiber, queue, update, lane), action !== null)
            return scheduleUpdateOnFiber(action, fiber, lane), entangleTransitionUpdate(action, queue, lane), !0;
        }
        return !1;
      }
      function dispatchOptimisticSetState(fiber, throwIfDuringRender, queue, action) {
        if (action = {
          lane: 2,
          revertLane: requestTransitionLane(),
          gesture: null,
          action,
          hasEagerState: !1,
          eagerState: null,
          next: null
        }, isRenderPhaseUpdate(fiber)) {
          if (throwIfDuringRender) throw Error(formatProdErrorMessage(479));
        } else
          throwIfDuringRender = enqueueConcurrentHookUpdate(
            fiber,
            queue,
            action,
            2
          ), throwIfDuringRender !== null && scheduleUpdateOnFiber(throwIfDuringRender, fiber, 2);
      }
      function isRenderPhaseUpdate(fiber) {
        var alternate = fiber.alternate;
        return fiber === currentlyRenderingFiber || alternate !== null && alternate === currentlyRenderingFiber;
      }
      function enqueueRenderPhaseUpdate(queue, update) {
        didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = !0;
        var pending = queue.pending;
        pending === null ? update.next = update : (update.next = pending.next, pending.next = update), queue.pending = update;
      }
      function entangleTransitionUpdate(root2, queue, lane) {
        if ((lane & 4194048) !== 0) {
          var queueLanes = queue.lanes;
          queueLanes &= root2.pendingLanes, lane |= queueLanes, queue.lanes = lane, markRootEntangled(root2, lane);
        }
      }
      var ContextOnlyDispatcher = {
        readContext,
        use: use2,
        useCallback: throwInvalidHookError,
        useContext: throwInvalidHookError,
        useEffect: throwInvalidHookError,
        useImperativeHandle: throwInvalidHookError,
        useLayoutEffect: throwInvalidHookError,
        useInsertionEffect: throwInvalidHookError,
        useMemo: throwInvalidHookError,
        useReducer: throwInvalidHookError,
        useRef: throwInvalidHookError,
        useState: throwInvalidHookError,
        useDebugValue: throwInvalidHookError,
        useDeferredValue: throwInvalidHookError,
        useTransition: throwInvalidHookError,
        useSyncExternalStore: throwInvalidHookError,
        useId: throwInvalidHookError,
        useHostTransitionStatus: throwInvalidHookError,
        useFormState: throwInvalidHookError,
        useActionState: throwInvalidHookError,
        useOptimistic: throwInvalidHookError,
        useMemoCache: throwInvalidHookError,
        useCacheRefresh: throwInvalidHookError,
        useEffectEvent: throwInvalidHookError
      }, HooksDispatcherOnMount = {
        readContext,
        use: use2,
        useCallback: function(callback, deps) {
          return mountWorkInProgressHook().memoizedState = [
            callback,
            deps === void 0 ? null : deps
          ], callback;
        },
        useContext: readContext,
        useEffect: mountEffect,
        useImperativeHandle: function(ref, create, deps) {
          deps = deps != null ? deps.concat([ref]) : null, mountEffectImpl(
            4194308,
            4,
            imperativeHandleEffect.bind(null, create, ref),
            deps
          );
        },
        useLayoutEffect: function(create, deps) {
          return mountEffectImpl(4194308, 4, create, deps);
        },
        useInsertionEffect: function(create, deps) {
          mountEffectImpl(4, 2, create, deps);
        },
        useMemo: function(nextCreate, deps) {
          var hook = mountWorkInProgressHook();
          deps = deps === void 0 ? null : deps;
          var nextValue = nextCreate();
          if (shouldDoubleInvokeUserFnsInHooksDEV) {
            setIsStrictModeForDevtools(!0);
            try {
              nextCreate();
            } finally {
              setIsStrictModeForDevtools(!1);
            }
          }
          return hook.memoizedState = [nextValue, deps], nextValue;
        },
        useReducer: function(reducer, initialArg, init) {
          var hook = mountWorkInProgressHook();
          if (init !== void 0) {
            var initialState = init(initialArg);
            if (shouldDoubleInvokeUserFnsInHooksDEV) {
              setIsStrictModeForDevtools(!0);
              try {
                init(initialArg);
              } finally {
                setIsStrictModeForDevtools(!1);
              }
            }
          } else initialState = initialArg;
          return hook.memoizedState = hook.baseState = initialState, reducer = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: reducer,
            lastRenderedState: initialState
          }, hook.queue = reducer, reducer = reducer.dispatch = dispatchReducerAction.bind(
            null,
            currentlyRenderingFiber,
            reducer
          ), [hook.memoizedState, reducer];
        },
        useRef: function(initialValue) {
          var hook = mountWorkInProgressHook();
          return initialValue = { current: initialValue }, hook.memoizedState = initialValue;
        },
        useState: function(initialState) {
          initialState = mountStateImpl(initialState);
          var queue = initialState.queue, dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
          return queue.dispatch = dispatch, [initialState.memoizedState, dispatch];
        },
        useDebugValue: mountDebugValue,
        useDeferredValue: function(value, initialValue) {
          var hook = mountWorkInProgressHook();
          return mountDeferredValueImpl(hook, value, initialValue);
        },
        useTransition: function() {
          var stateHook = mountStateImpl(!1);
          return stateHook = startTransition.bind(
            null,
            currentlyRenderingFiber,
            stateHook.queue,
            !0,
            !1
          ), mountWorkInProgressHook().memoizedState = stateHook, [!1, stateHook];
        },
        useSyncExternalStore: function(subscribe2, getSnapshot, getServerSnapshot) {
          var fiber = currentlyRenderingFiber, hook = mountWorkInProgressHook();
          if (isHydrating) {
            if (getServerSnapshot === void 0)
              throw Error(formatProdErrorMessage(407));
            getServerSnapshot = getServerSnapshot();
          } else {
            if (getServerSnapshot = getSnapshot(), workInProgressRoot === null)
              throw Error(formatProdErrorMessage(349));
            (workInProgressRootRenderLanes & 127) !== 0 || pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
          }
          hook.memoizedState = getServerSnapshot;
          var inst = { value: getServerSnapshot, getSnapshot };
          return hook.queue = inst, mountEffect(subscribeToStore.bind(null, fiber, inst, subscribe2), [
            subscribe2
          ]), fiber.flags |= 2048, pushSimpleEffect(
            9,
            { destroy: void 0 },
            updateStoreInstance.bind(
              null,
              fiber,
              inst,
              getServerSnapshot,
              getSnapshot
            ),
            null
          ), getServerSnapshot;
        },
        useId: function() {
          var hook = mountWorkInProgressHook(), identifierPrefix = workInProgressRoot.identifierPrefix;
          if (isHydrating) {
            var JSCompiler_inline_result = treeContextOverflow, idWithLeadingBit = treeContextId;
            JSCompiler_inline_result = (idWithLeadingBit & ~(1 << 32 - clz32(idWithLeadingBit) - 1)).toString(32) + JSCompiler_inline_result, identifierPrefix = "_" + identifierPrefix + "R_" + JSCompiler_inline_result, JSCompiler_inline_result = localIdCounter++, 0 < JSCompiler_inline_result && (identifierPrefix += "H" + JSCompiler_inline_result.toString(32)), identifierPrefix += "_";
          } else
            JSCompiler_inline_result = globalClientIdCounter++, identifierPrefix = "_" + identifierPrefix + "r_" + JSCompiler_inline_result.toString(32) + "_";
          return hook.memoizedState = identifierPrefix;
        },
        useHostTransitionStatus,
        useFormState: mountActionState,
        useActionState: mountActionState,
        useOptimistic: function(passthrough) {
          var hook = mountWorkInProgressHook();
          hook.memoizedState = hook.baseState = passthrough;
          var queue = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: null,
            lastRenderedState: null
          };
          return hook.queue = queue, hook = dispatchOptimisticSetState.bind(
            null,
            currentlyRenderingFiber,
            !0,
            queue
          ), queue.dispatch = hook, [passthrough, hook];
        },
        useMemoCache,
        useCacheRefresh: function() {
          return mountWorkInProgressHook().memoizedState = refreshCache.bind(
            null,
            currentlyRenderingFiber
          );
        },
        useEffectEvent: function(callback) {
          var hook = mountWorkInProgressHook(), ref = { impl: callback };
          return hook.memoizedState = ref, function() {
            if ((executionContext & 2) !== 0)
              throw Error(formatProdErrorMessage(440));
            return ref.impl.apply(void 0, arguments);
          };
        }
      }, HooksDispatcherOnUpdate = {
        readContext,
        use: use2,
        useCallback: updateCallback,
        useContext: readContext,
        useEffect: updateEffect,
        useImperativeHandle: updateImperativeHandle,
        useInsertionEffect: updateInsertionEffect,
        useLayoutEffect: updateLayoutEffect,
        useMemo: updateMemo,
        useReducer: updateReducer,
        useRef: updateRef,
        useState: function() {
          return updateReducer(basicStateReducer);
        },
        useDebugValue: mountDebugValue,
        useDeferredValue: function(value, initialValue) {
          var hook = updateWorkInProgressHook();
          return updateDeferredValueImpl(
            hook,
            currentHook.memoizedState,
            value,
            initialValue
          );
        },
        useTransition: function() {
          var booleanOrThenable = updateReducer(basicStateReducer)[0], start2 = updateWorkInProgressHook().memoizedState;
          return [
            typeof booleanOrThenable == "boolean" ? booleanOrThenable : useThenable(booleanOrThenable),
            start2
          ];
        },
        useSyncExternalStore: updateSyncExternalStore,
        useId: updateId,
        useHostTransitionStatus,
        useFormState: updateActionState,
        useActionState: updateActionState,
        useOptimistic: function(passthrough, reducer) {
          var hook = updateWorkInProgressHook();
          return updateOptimisticImpl(hook, currentHook, passthrough, reducer);
        },
        useMemoCache,
        useCacheRefresh: updateRefresh,
        useEffectEvent: updateEvent
      }, HooksDispatcherOnRerender = {
        readContext,
        use: use2,
        useCallback: updateCallback,
        useContext: readContext,
        useEffect: updateEffect,
        useImperativeHandle: updateImperativeHandle,
        useInsertionEffect: updateInsertionEffect,
        useLayoutEffect: updateLayoutEffect,
        useMemo: updateMemo,
        useReducer: rerenderReducer,
        useRef: updateRef,
        useState: function() {
          return rerenderReducer(basicStateReducer);
        },
        useDebugValue: mountDebugValue,
        useDeferredValue: function(value, initialValue) {
          var hook = updateWorkInProgressHook();
          return currentHook === null ? mountDeferredValueImpl(hook, value, initialValue) : updateDeferredValueImpl(
            hook,
            currentHook.memoizedState,
            value,
            initialValue
          );
        },
        useTransition: function() {
          var booleanOrThenable = rerenderReducer(basicStateReducer)[0], start2 = updateWorkInProgressHook().memoizedState;
          return [
            typeof booleanOrThenable == "boolean" ? booleanOrThenable : useThenable(booleanOrThenable),
            start2
          ];
        },
        useSyncExternalStore: updateSyncExternalStore,
        useId: updateId,
        useHostTransitionStatus,
        useFormState: rerenderActionState,
        useActionState: rerenderActionState,
        useOptimistic: function(passthrough, reducer) {
          var hook = updateWorkInProgressHook();
          return currentHook !== null ? updateOptimisticImpl(hook, currentHook, passthrough, reducer) : (hook.baseState = passthrough, [passthrough, hook.queue.dispatch]);
        },
        useMemoCache,
        useCacheRefresh: updateRefresh,
        useEffectEvent: updateEvent
      };
      function applyDerivedStateFromProps(workInProgress2, ctor, getDerivedStateFromProps, nextProps) {
        ctor = workInProgress2.memoizedState, getDerivedStateFromProps = getDerivedStateFromProps(nextProps, ctor), getDerivedStateFromProps = getDerivedStateFromProps == null ? ctor : assign({}, ctor, getDerivedStateFromProps), workInProgress2.memoizedState = getDerivedStateFromProps, workInProgress2.lanes === 0 && (workInProgress2.updateQueue.baseState = getDerivedStateFromProps);
      }