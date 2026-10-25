

  // ../../node_modules/@radix-ui/react-primitive/dist/index.mjs
  var React3 = __toESM(require_react(), 1), ReactDOM = __toESM(require_react_dom(), 1);

  // ../../node_modules/@radix-ui/react-slot/dist/index.mjs
  var React2 = __toESM(require_react(), 1);

  // ../../node_modules/@radix-ui/react-compose-refs/dist/index.mjs
  var React = __toESM(require_react(), 1), __defProp2 = Object.defineProperty, __name = (target, value) => __defProp2(target, "name", { value, configurable: !0 });
  function setRef(ref, value) {
    if (typeof ref == "function")
      return ref(value);
    ref != null && (ref.current = value);
  }
  __name(setRef, "setRef");
  function composeRefs(...refs) {
    return (node) => {
      let hasCleanup = !1, cleanups = refs.map((ref) => {
        let cleanup = setRef(ref, node);
        return !hasCleanup && typeof cleanup == "function" && (hasCleanup = !0), cleanup;
      });
      if (hasCleanup)
        return () => {
          for (let i = 0; i < cleanups.length; i++) {
            let cleanup = cleanups[i];
            typeof cleanup == "function" ? cleanup() : setRef(refs[i], null);
          }
        };
    };
  }
  __name(composeRefs, "composeRefs");
  function useComposedRefs(...refs) {
    return React.useCallback(composeRefs(...refs), refs);
  }
  __name(useComposedRefs, "useComposedRefs");

  // ../../node_modules/@radix-ui/react-slot/dist/index.mjs
  var __defProp3 = Object.defineProperty, __name2 = (target, value) => __defProp3(target, "name", { value, configurable: !0 });
  // @__NO_SIDE_EFFECTS__
  function createSlot(ownerName) {
    let Slot22 = React2.forwardRef((props, forwardedRef) => {
      let { children, ...slotProps } = props, slottableElement = null, hasSlottable = !1, newChildren = [];
      children = useUnwrappedLazy(children), React2.Children.forEach(children, (maybeSlottable) => {
        if (isSlottable(maybeSlottable)) {
          hasSlottable = !0;
          let slottable = maybeSlottable, child = "child" in slottable.props ? slottable.props.child : slottable.props.children;
          for (; isLazyComponent(child) && typeof use == "function"; )
            child = use(child._payload);
          slottableElement = getSlottableElementFromSlottable(slottable, child), newChildren.push(slottableElement?.props?.children);
        } else
          newChildren.push(maybeSlottable);
      }), slottableElement ? slottableElement = React2.cloneElement(slottableElement, void 0, newChildren) : (
        // A `Slottable` was found but it didn't resolve to a single element (e.g.
        // it wrapped multiple elements, text, or a render-prop `child` that
        // wasn't an element). Don't fall back to treating the `Slottable` wrapper
        // itself as the slot target — throw a descriptive error below instead.
        !hasSlottable && React2.Children.count(children) === 1 && React2.isValidElement(children) && (slottableElement = children)
      );
      let slottableElementRef = slottableElement ? getElementRef(slottableElement) : void 0, composedRef = useComposedRefs(forwardedRef, slottableElementRef);
      if (!slottableElement) {
        if (children || children === 0)
          throw new Error(
            hasSlottable ? createSlottableError(ownerName) : createSlotError(ownerName)
          );
        return children;
      }
      let mergedProps = mergeProps(slotProps, slottableElement.props ?? {});
      return slottableElement.type !== React2.Fragment && (mergedProps.ref = forwardedRef ? composedRef : slottableElementRef), React2.cloneElement(slottableElement, mergedProps);
    });
    return Slot22.displayName = `${ownerName}.Slot`, Slot22;
  }
  __name2(createSlot, "createSlot");
  var SLOTTABLE_IDENTIFIER = /* @__PURE__ */ Symbol.for("radix.slottable");
  // @__NO_SIDE_EFFECTS__
  function createSlottable(ownerName) {
    let Slottable2 = /* @__PURE__ */ __name2((props) => "child" in props ? props.children(props.child) : props.children, "Slottable");
    return Slottable2.displayName = `${ownerName}.Slottable`, Slottable2.__radixId = SLOTTABLE_IDENTIFIER, Slottable2;
  }
  __name2(createSlottable, "createSlottable");
  var getSlottableElementFromSlottable = /* @__PURE__ */ __name2((slottable, child) => "child" in slottable.props ? React2.isValidElement(child) ? React2.cloneElement(child, void 0, slottable.props.children(child.props.children)) : null : React2.isValidElement(child) ? child : null, "getSlottableElementFromSlottable");
  function mergeProps(slotProps, childProps) {
    let overrideProps = { ...childProps };
    for (let propName in childProps) {
      let slotPropValue = slotProps[propName], childPropValue = childProps[propName];
      /^on[A-Z]/.test(propName) ? slotPropValue && childPropValue ? overrideProps[propName] = (...args) => {
        let result = childPropValue(...args);
        return slotPropValue(...args), result;
      } : slotPropValue && (overrideProps[propName] = slotPropValue) : propName === "style" ? overrideProps[propName] = { ...slotPropValue, ...childPropValue } : propName === "className" ? overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ") : propName === "aria-describedby" && (overrideProps[propName] = concatAriaDescribedby(childPropValue, slotPropValue));
    }
    return { ...slotProps, ...overrideProps };
  }
  __name2(mergeProps, "mergeProps");
  function getElementRef(element) {
    let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get, mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
    return mayWarn ? element.ref : (getter = Object.getOwnPropertyDescriptor(element, "ref")?.get, mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning, mayWarn ? element.props.ref : element.props.ref || element.ref);
  }
  __name2(getElementRef, "getElementRef");
  function isSlottable(child) {
    return React2.isValidElement(child) && typeof child.type == "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER;
  }
  __name2(isSlottable, "isSlottable");
  var REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy");
  function isLazyComponent(element) {
    return element != null && typeof element == "object" && "$$typeof" in element && element.$$typeof === REACT_LAZY_TYPE && "_payload" in element && isPromiseLike(element._payload);
  }
  __name2(isLazyComponent, "isLazyComponent");
  function isPromiseLike(value) {
    return typeof value == "object" && value !== null && "then" in value;
  }
  __name2(isPromiseLike, "isPromiseLike");
  function useUnwrappedLazy(value) {
    let unwrapped = value;
    for (; isLazyComponent(unwrapped) && typeof use == "function"; )
      unwrapped = use(unwrapped._payload);
    return unwrapped;
  }
  __name2(useUnwrappedLazy, "useUnwrappedLazy");
  function concatAriaDescribedby(...values) {
    let ids = /* @__PURE__ */ new Set();
    for (let value of values)
      if (typeof value == "string")
        for (let id of String(value).trim().split(/\s+/))
          id && ids.add(id);
    return ids.size > 0 ? Array.from(ids).join(" ") : void 0;
  }
  __name2(concatAriaDescribedby, "concatAriaDescribedby");
  var createSlotError = /* @__PURE__ */ __name2((ownerName) => `${ownerName} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`, "createSlotError"), createSlottableError = /* @__PURE__ */ __name2((ownerName) => `${ownerName} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`, "createSlottableError"), use = React2[" use ".trim().toString()];

  // ../../node_modules/@radix-ui/react-primitive/dist/index.mjs
  var import_jsx_runtime = __toESM(require_jsx_runtime(), 1), __defProp4 = Object.defineProperty, __name3 = (target, value) => __defProp4(target, "name", { value, configurable: !0 }), NODES = [
    "a",
    "button",
    "div",
    "form",
    "h2",
    "h3",
    "img",
    "input",
    "label",
    "li",
    "nav",
    "ol",
    "p",
    "select",
    "span",
    "svg",
    "ul"
  ], Primitive = NODES.reduce((primitive, node) => {
    let Slot3 = createSlot(`Primitive.${node}`), Node2 = React3.forwardRef((props, forwardedRef) => {
      let { asChild, ...primitiveProps } = props, Comp = asChild ? Slot3 : node;
      return typeof window < "u" && (window[/* @__PURE__ */ Symbol.for("radix-ui")] = !0), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Comp, { ...primitiveProps, ref: forwardedRef });
    });
    return Node2.displayName = `Primitive.${node}`, { ...primitive, [node]: Node2 };
  }, {});
  function dispatchDiscreteCustomEvent(target, event) {
    target && ReactDOM.flushSync(() => target.dispatchEvent(event));
  }
  __name3(dispatchDiscreteCustomEvent, "dispatchDiscreteCustomEvent");

  // ../../node_modules/@radix-ui/react-context/dist/index.mjs
  var React4 = __toESM(require_react(), 1), import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1), __defProp5 = Object.defineProperty, __name4 = (target, value) => __defProp5(target, "name", { value, configurable: !0 });
  // @__NO_SIDE_EFFECTS__
  function createContext2(rootComponentName, defaultContext) {
    let Context = React4.createContext(defaultContext);
    Context.displayName = rootComponentName + "Context";
    let Provider = /* @__PURE__ */ __name4((props) => {
      let { children, ...context } = props, value = React4.useMemo(() => context, Object.values(context));
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Context.Provider, { value, children });
    }, "Provider");
    Provider.displayName = rootComponentName + "Provider";
    function useContext22(consumerName, options2 = {}) {
      let { optional = !1 } = options2, context = React4.useContext(Context);
      if (context) return context;
      if (defaultContext !== void 0) return defaultContext;
      if (!optional)
        throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
    }
    return __name4(useContext22, "useContext"), [Provider, useContext22];
  }
  __name4(createContext2, "createContext");
  // @__NO_SIDE_EFFECTS__
  function createContextScope(scopeName, createContextScopeDeps = []) {
    let defaultContexts = [];
    function createContext32(rootComponentName, defaultContext) {
      let BaseContext = React4.createContext(defaultContext);
      BaseContext.displayName = rootComponentName + "Context";
      let index2 = defaultContexts.length;
      defaultContexts = [...defaultContexts, defaultContext];
      let Provider = /* @__PURE__ */ __name4((props) => {
        let { scope, children, ...context } = props, Context = scope?.[scopeName]?.[index2] || BaseContext, value = React4.useMemo(() => context, Object.values(context));
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Context.Provider, { value, children });
      }, "Provider");
      Provider.displayName = rootComponentName + "Provider";
      function useContext22(consumerName, scope, options2 = {}) {
        let { optional = !1 } = options2, Context = scope?.[scopeName]?.[index2] || BaseContext, context = React4.useContext(Context);
        if (context) return context;
        if (defaultContext !== void 0) return defaultContext;
        if (!optional)
          throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
      }
      return __name4(useContext22, "useContext"), [Provider, useContext22];
    }
    __name4(createContext32, "createContext");
    let createScope = /* @__PURE__ */ __name4(() => {
      let scopeContexts = defaultContexts.map((defaultContext) => React4.createContext(defaultContext));
      return /* @__PURE__ */ __name4(function(scope) {
        let contexts = scope?.[scopeName] || scopeContexts;
        return React4.useMemo(
          () => ({ [`__scope${scopeName}`]: { ...scope, [scopeName]: contexts } }),
          [scope, contexts]
        );
      }, "useScope");
    }, "createScope");
    return createScope.scopeName = scopeName, [createContext32, composeContextScopes(createScope, ...createContextScopeDeps)];
  }
  __name4(createContextScope, "createContextScope");
  function composeContextScopes(...scopes) {
    let baseScope = scopes[0];
    if (scopes.length === 1) return baseScope;
    let createScope = /* @__PURE__ */ __name4(() => {
      let scopeHooks = scopes.map((createScope2) => ({
        useScope: createScope2(),
        scopeName: createScope2.scopeName
      }));
      return /* @__PURE__ */ __name4(function(overrideScopes) {
        let nextScopes = scopeHooks.reduce((nextScopes2, { useScope, scopeName }) => {
          let currentScope = useScope(overrideScopes)[`__scope${scopeName}`];
          return { ...nextScopes2, ...currentScope };
        }, {});
        return React4.useMemo(() => ({ [`__scope${baseScope.scopeName}`]: nextScopes }), [nextScopes]);
      }, "useComposedScopes");
    }, "createScope");
    return createScope.scopeName = baseScope.scopeName, createScope;
  }
  __name4(composeContextScopes, "composeContextScopes");

  // ../../node_modules/@radix-ui/react-collection/dist/index.mjs
  var React6 = __toESM(require_react(), 1);
  var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1), React22 = __toESM(require_react(), 1);

  // ../../node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs
  var React5 = __toESM(require_react(), 1), useLayoutEffect2 = globalThis?.document ? React5.useLayoutEffect : () => {
  };

  // ../../node_modules/@radix-ui/react-collection/dist/index.mjs
  var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1), __defProp6 = Object.defineProperty, __name5 = (target, value) => __defProp6(target, "name", { value, configurable: !0 });
  // @__NO_SIDE_EFFECTS__
  function createCollection(name) {
    let PROVIDER_NAME = name + "CollectionProvider", [createCollectionContext, createCollectionScope3] = createContextScope(PROVIDER_NAME), [CollectionProviderImpl, useCollectionContext] = createCollectionContext(
      PROVIDER_NAME,
      { collectionRef: { current: null }, itemMap: /* @__PURE__ */ new Map() }
    ), CollectionProvider = /* @__PURE__ */ __name5((props) => {
      let { scope, children } = props, ref = React6.useRef(null), itemMap = React6.useRef(/* @__PURE__ */ new Map()).current;
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CollectionProviderImpl, { scope, itemMap, collectionRef: ref, children });
    }, "CollectionProvider");
    CollectionProvider.displayName = PROVIDER_NAME;
    let COLLECTION_SLOT_NAME = name + "CollectionSlot", CollectionSlotImpl = createSlot(COLLECTION_SLOT_NAME), CollectionSlot = React6.forwardRef(
      (props, forwardedRef) => {
        let { scope, children } = props, context = useCollectionContext(COLLECTION_SLOT_NAME, scope), composedRefs = useComposedRefs(forwardedRef, context.collectionRef);
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CollectionSlotImpl, { ref: composedRefs, children });
      }
    );
    CollectionSlot.displayName = COLLECTION_SLOT_NAME;
    let ITEM_SLOT_NAME = name + "CollectionItemSlot", ITEM_DATA_ATTR = "data-radix-collection-item", CollectionItemSlotImpl = createSlot(ITEM_SLOT_NAME), CollectionItemSlot = React6.forwardRef(
      (props, forwardedRef) => {
        let { scope, children, ...itemData } = props, ref = React6.useRef(null), composedRefs = useComposedRefs(forwardedRef, ref), context = useCollectionContext(ITEM_SLOT_NAME, scope);
        return React6.useEffect(() => (context.itemMap.set(ref, { ref, ...itemData }), () => {
          context.itemMap.delete(ref);
        })), /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CollectionItemSlotImpl, { [ITEM_DATA_ATTR]: "", ref: composedRefs, children });
      }
    );
    CollectionItemSlot.displayName = ITEM_SLOT_NAME;
    function useCollection3(scope) {
      let context = useCollectionContext(name + "CollectionConsumer", scope);
      return React6.useCallback(() => {
        let collectionNode = context.collectionRef.current;
        if (!collectionNode) return [];
        let orderedNodes = Array.from(collectionNode.querySelectorAll(`[${ITEM_DATA_ATTR}]`));
        return Array.from(context.itemMap.values()).sort(
          (a, b) => orderedNodes.indexOf(a.ref.current) - orderedNodes.indexOf(b.ref.current)
        );
      }, [context.collectionRef, context.itemMap]);
    }
    return __name5(useCollection3, "useCollection"), [
      { Provider: CollectionProvider, Slot: CollectionSlot, ItemSlot: CollectionItemSlot },
      useCollection3,
      createCollectionScope3
    ];
  }
  __name5(createCollection, "createCollection");
  var __instanciated = /* @__PURE__ */ new WeakMap(), OrderedDict = class _OrderedDict extends Map {
    static {
      __name5(this, "OrderedDict");
    }
    #keys;
    constructor(entries) {
      super(entries), this.#keys = [...super.keys()], __instanciated.set(this, !0);
    }
    set(key, value) {
      return __instanciated.get(this) && !this.has(key) && this.#keys.push(key), super.set(key, value), this;
    }
    /**
     * Sets a key-value pair so that it ends up at the given index.
     * - Existing keys are moved
     * - Negative indices count from the end of the resulting dictionary, so
     *   inserting at -1 makes the item the last one, -2 the second to last, etc.
     * - Out-of-range indices are clamped
     */
    insert(index2, key, value) {
      let has = this.has(key), finalSize = has ? this.size : this.size + 1, relativeIndex = toSafeInteger(index2), targetIndex = relativeIndex >= 0 ? Math.min(relativeIndex, finalSize - 1) : Math.max(finalSize + relativeIndex, 0);
      if (has ? this.#keys.indexOf(key) === targetIndex : targetIndex === this.size)
        return this.set(key, value), this;
      let keys = this.#keys.filter((existingKey) => existingKey !== key);
      keys.splice(targetIndex, 0, key);
      let entries = keys.map((entryKey) => [
        entryKey,
        entryKey === key ? value : this.get(entryKey)
      ]);
      this.clear();
      for (let [entryKey, entryValue] of entries)
        this.set(entryKey, entryValue);
      return this;
    }
    with(index2, key, value) {
      let copy = new _OrderedDict(this);
      return copy.insert(index2, key, value), copy;
    }
    before(key) {
      let index2 = this.#keys.indexOf(key) - 1;
      if (!(index2 < 0))
        return this.entryAt(index2);
    }
    /**
     * Sets a new key-value pair at the position before the given key.
     */
    setBefore(key, newKey, value) {
      let index2 = this.#keys.indexOf(key);
      if (index2 === -1)
        return this;
      let currentIndex = this.#keys.indexOf(newKey), targetIndex = currentIndex !== -1 && currentIndex < index2 ? index2 - 1 : index2;
      return this.insert(targetIndex, newKey, value);
    }
    after(key) {
      let index2 = this.#keys.indexOf(key);
      if (index2 = index2 === -1 || index2 === this.size - 1 ? -1 : index2 + 1, index2 !== -1)
        return this.entryAt(index2);
    }
    /**
     * Sets a new key-value pair at the position after the given key.
     */
    setAfter(key, newKey, value) {
      let index2 = this.#keys.indexOf(key);
      if (index2 === -1)
        return this;
      let currentIndex = this.#keys.indexOf(newKey), targetIndex = currentIndex !== -1 && currentIndex <= index2 ? index2 : index2 + 1;
      return this.insert(targetIndex, newKey, value);
    }
    first() {
      return this.entryAt(0);
    }
    last() {
      return this.entryAt(-1);
    }
    clear() {
      return this.#keys = [], super.clear();
    }
    delete(key) {
      let deleted = super.delete(key);
      return deleted && this.#keys.splice(this.#keys.indexOf(key), 1), deleted;
    }
    deleteAt(index2) {
      let key = this.keyAt(index2);
      return key !== void 0 ? this.delete(key) : !1;
    }
    at(index2) {
      let key = at(this.#keys, index2);
      if (key !== void 0)
        return this.get(key);
    }
    entryAt(index2) {
      let key = at(this.#keys, index2);
      if (key !== void 0)
        return [key, this.get(key)];
    }
    indexOf(key) {
      return this.#keys.indexOf(key);
    }
    keyAt(index2) {
      return at(this.#keys, index2);
    }
    from(key, offset4) {
      let index2 = this.indexOf(key);
      if (index2 === -1)
        return;
      let dest = index2 + offset4;
      return dest < 0 && (dest = 0), dest >= this.size && (dest = this.size - 1), this.at(dest);
    }
    keyFrom(key, offset4) {
      let index2 = this.indexOf(key);
      if (index2 === -1)
        return;
      let dest = index2 + offset4;
      return dest < 0 && (dest = 0), dest >= this.size && (dest = this.size - 1), this.keyAt(dest);
    }
    find(predicate, thisArg) {
      let index2 = 0;
      for (let entry of this) {
        if (Reflect.apply(predicate, thisArg, [entry, index2, this]))
          return entry;
        index2++;
      }
    }
    findIndex(predicate, thisArg) {
      let index2 = 0;
      for (let entry of this) {
        if (Reflect.apply(predicate, thisArg, [entry, index2, this]))
          return index2;
        index2++;
      }
      return -1;
    }
    filter(predicate, thisArg) {
      let entries = [], index2 = 0;
      for (let entry of this)
        Reflect.apply(predicate, thisArg, [entry, index2, this]) && entries.push(entry), index2++;
      return new _OrderedDict(entries);
    }
    map(callbackfn, thisArg) {
      let entries = [], index2 = 0;
      for (let entry of this)
        entries.push([entry[0], Reflect.apply(callbackfn, thisArg, [entry, index2, this])]), index2++;
      return new _OrderedDict(entries);
    }
    reduce(...args) {
      let [callbackfn, initialValue] = args, hasInitialValue = args.length > 1;
      if (!hasInitialValue && this.size === 0)
        throw new TypeError("Reduce of empty OrderedDict with no initial value");
      let index2 = 0, accumulator = initialValue;
      for (let entry of this)
        index2 === 0 && !hasInitialValue ? accumulator = entry : accumulator = Reflect.apply(callbackfn, this, [accumulator, entry, index2, this]), index2++;
      return accumulator;
    }
    reduceRight(...args) {
      let [callbackfn, initialValue] = args, hasInitialValue = args.length > 1;
      if (!hasInitialValue && this.size === 0)
        throw new TypeError("Reduce of empty OrderedDict with no initial value");
      let accumulator = initialValue;
      for (let index2 = this.size - 1; index2 >= 0; index2--) {
        let entry = this.entryAt(index2);
        index2 === this.size - 1 && !hasInitialValue ? accumulator = entry : accumulator = Reflect.apply(callbackfn, this, [accumulator, entry, index2, this]);
      }
      return accumulator;
    }
    /**
     * Sorts the dictionary in place. This method mutates the dictionary and
     * returns a reference to the same object
     *
     * @param compareFn Function used to determine the order of the elements. It
     * is expected to return a negative value if the first argument is less than
     * the second argument, zero if they're equal, and a positive value otherwise.
     */
    sort(compareFn) {
      if (typeof compareFn != "function")
        throw new TypeError("OrderedDict.sort requires a compare function");
      let entries = [...this.entries()].sort(compareFn);
      this.clear();
      for (let [key, value] of entries)
        this.set(key, value);
      return this;
    }
    /**
     * Returns a copy of the dictionary with its elements sorted.
     *
     * @param compareFn Function used to determine the order of the elements. It
     * is expected to return a negative value if the first argument is less than
     * the second argument, zero if they're equal, and a positive value otherwise.
     */
    toSorted(compareFn) {
      if (typeof compareFn != "function")
        throw new TypeError("OrderedDict.toSorted requires a compare function");
      let entries = [...this.entries()].sort(compareFn);
      return new _OrderedDict(entries);
    }
    toReversed() {
      let reversed = new _OrderedDict();
      for (let index2 = this.size - 1; index2 >= 0; index2--) {
        let key = this.keyAt(index2), element = this.get(key);
        reversed.set(key, element);
      }
      return reversed;
    }
    toSpliced(...args) {
      let entries = [...this.entries()];
      return entries.splice(...args), new _OrderedDict(entries);
    }
    slice(start2, end) {
      let result = new _OrderedDict();
      for (let key of this.#keys.slice(start2, end))
        result.set(key, this.get(key));
      return result;
    }
    every(predicate, thisArg) {
      let index2 = 0;
      for (let entry of this) {
        if (!Reflect.apply(predicate, thisArg, [entry, index2, this]))
          return !1;
        index2++;
      }
      return !0;
    }
    some(predicate, thisArg) {
      let index2 = 0;
      for (let entry of this) {
        if (Reflect.apply(predicate, thisArg, [entry, index2, this]))
          return !0;
        index2++;
      }
      return !1;
    }
  };
  function at(array, index2) {
    if ("at" in Array.prototype)
      return Array.prototype.at.call(array, index2);
    let actualIndex = toSafeIndex(array, index2);
    return actualIndex === -1 ? void 0 : array[actualIndex];
  }
  __name5(at, "at");
  function toSafeIndex(array, index2) {
    let length = array.length, relativeIndex = toSafeInteger(index2), actualIndex = relativeIndex >= 0 ? relativeIndex : length + relativeIndex;
    return actualIndex < 0 || actualIndex >= length ? -1 : actualIndex;
  }
  __name5(toSafeIndex, "toSafeIndex");
  function toSafeInteger(number) {
    return number !== number || number === 0 ? 0 : Math.trunc(number);
  }
  __name5(toSafeInteger, "toSafeInteger");
  // @__NO_SIDE_EFFECTS__
  function createCollection2(name) {
    let PROVIDER_NAME = name + "CollectionProvider", [createCollectionContext, createCollectionScope3] = createContextScope(PROVIDER_NAME), [CollectionStableContextProvider, useStableCollectionContext] = createCollectionContext(PROVIDER_NAME);
    CollectionStableContextProvider.displayName = name + "CollectionStableContextProvider";
    let [CollectionStatefulContextProvider, useStatefulCollectionContext] = createCollectionContext(PROVIDER_NAME);
    CollectionStatefulContextProvider.displayName = name + "CollectionStatefulContextProvider";
    let CollectionProvider = /* @__PURE__ */ __name5(({ state, ...props }) => state ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CollectionProviderImpl, { ...props, state }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CollectionInit, { ...props }), "CollectionProvider");
    CollectionProvider.displayName = PROVIDER_NAME;
    let CollectionInit = /* @__PURE__ */ __name5((props) => {
      let state = useInitCollection();
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CollectionProviderImpl, { ...props, state });
    }, "CollectionInit");
    CollectionInit.displayName = name + "CollectionInit";
    let CollectionProviderImpl = /* @__PURE__ */ __name5((props) => {
      let { scope, children, state } = props, ref = React22.useRef(null), [collectionElement, setCollectionElement] = React22.useState(
        null
      ), composeRefs2 = useComposedRefs(ref, setCollectionElement), [collection, setCollection] = state, registryRef = React22.useRef(
        new OrderedDict()
      ), getCollection = React22.useCallback(() => {
        let registry = registryRef.current;
        return isInDocumentOrder(registry) || registry.sort(sortByDocumentPosition), registry;
      }, []);
      return React22.useEffect(() => {
        if (!collectionElement)
          return;
        let observer = getChildListObserver(() => {
          setCollection((map) => {
            let sorted = map.toSorted(sortByDocumentPosition);
            return sorted.some(([key], index2) => map.keyAt(index2) !== key) ? sorted : map;
          });
        });
        return observer.observe(collectionElement, {
          childList: !0,
          subtree: !0
        }), () => {
          observer.disconnect();
        };
      }, [collectionElement, setCollection]), /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        CollectionStableContextProvider,
        {
          scope,
          collectionElementRef: composeRefs2,
          collectionElementRefObject: ref,
          getCollection,
          setCollection,
          registryRef,
          children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            CollectionStatefulContextProvider,
            {
              scope,
              collectionElement,
              collection,
              children
            }
          )
        }
      );
    }, "CollectionProviderImpl");
    CollectionProviderImpl.displayName = name + "CollectionProviderImpl";
    let COLLECTION_SLOT_NAME = name + "CollectionSlot", CollectionSlotImpl = createSlot(COLLECTION_SLOT_NAME), CollectionSlot = React22.forwardRef(
      (props, forwardedRef) => {
        let { scope, children } = props, context = useStableCollectionContext(COLLECTION_SLOT_NAME, scope), composedRefs = useComposedRefs(forwardedRef, context.collectionElementRef);
        return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CollectionSlotImpl, { ref: composedRefs, children });
      }
    );
    CollectionSlot.displayName = COLLECTION_SLOT_NAME;
    let ITEM_SLOT_NAME = name + "CollectionItemSlot", ITEM_DATA_ATTR = "data-radix-collection-item", CollectionItemSlotImpl = createSlot(ITEM_SLOT_NAME), CollectionItemSlot = React22.forwardRef(
      (props, forwardedRef) => {
        let { scope, children, ...itemData } = props, ref = React22.useRef(null), context = useStableCollectionContext(ITEM_SLOT_NAME, scope), { setCollection, registryRef } = context, itemDataRef = React22.useRef(itemData);
        shallowEqual(itemDataRef.current, itemData) || (itemDataRef.current = itemData);
        let memoizedItemData = itemDataRef.current, registerElement = React22.useCallback(
          (node) => {
            let registry = registryRef.current;
            node ? registry.set(node, {
              ...itemDataRef.current,
              element: node
            }) : ref.current && registry.delete(ref.current);
          },
          [registryRef]
        ), composedRefs = useComposedRefs(forwardedRef, registerElement, ref);
        useLayoutEffect2(() => {
          let node = ref.current, registry = registryRef.current;
          node && registry.has(node) && registry.set(node, { ...memoizedItemData, element: node });
        }, [memoizedItemData, registryRef]);
        let registeredRef = React22.useRef(null);
        return React22.useEffect(() => {
          let element = ref.current, registered = registeredRef.current;
          (registered?.element ?? null) === element && (!element || registered?.itemData === memoizedItemData) || (registeredRef.current = element ? { element, itemData: memoizedItemData } : null, setCollection((map) => {
            let next = new OrderedDict(map);
            return registered && registered.element !== element && next.delete(registered.element), element && next.set(element, { ...memoizedItemData, element }), next.sort(sortByDocumentPosition);
          }));
        }), React22.useEffect(() => () => {
          let registered = registeredRef.current;
          registeredRef.current = null, registered && setCollection((map) => {
            if (!map.has(registered.element))
              return map;
            let next = new OrderedDict(map);
            return next.delete(registered.element), next;
          });
        }, [setCollection]), /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CollectionItemSlotImpl, { [ITEM_DATA_ATTR]: "", ref: composedRefs, children });
      }
    );
    CollectionItemSlot.displayName = ITEM_SLOT_NAME;
    function useInitCollection() {
      return React22.useState(new OrderedDict());
    }
    __name5(useInitCollection, "useInitCollection");
    function useCollection3(scope) {
      let { collection } = useStatefulCollectionContext(name + "CollectionConsumer", scope);
      return collection;
    }
    __name5(useCollection3, "useCollection");
    function useGetCollection(scope) {
      let { getCollection } = useStableCollectionContext(name + "CollectionConsumer", scope);
      return getCollection;
    }
    return __name5(useGetCollection, "useGetCollection"), [
      { Provider: CollectionProvider, Slot: CollectionSlot, ItemSlot: CollectionItemSlot },
      {
        createCollectionScope: createCollectionScope3,
        useCollection: useCollection3,
        useGetCollection,
        useInitCollection
      }
    ];
  }
  __name5(createCollection2, "createCollection");
  function shallowEqual(a, b) {
    if (a === b) return !0;
    if (typeof a != "object" || typeof b != "object" || a == null || b == null) return !1;
    let keysA = Object.keys(a), keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return !1;
    for (let key of keysA)
      if (!Object.prototype.hasOwnProperty.call(b, key) || a[key] !== b[key]) return !1;
    return !0;
  }
  __name5(shallowEqual, "shallowEqual");
  function isElementPreceding(a, b) {
    return !!(b.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_PRECEDING);
  }
  __name5(isElementPreceding, "isElementPreceding");
  function isInDocumentOrder(dict) {
    let previous;
    for (let element of dict.keys()) {
      if (previous) {
        let position = previous.compareDocumentPosition(element);
        if (!(position & Node.DOCUMENT_POSITION_DISCONNECTED) && position & Node.DOCUMENT_POSITION_PRECEDING)
          return !1;
      }
      previous = element;
    }
    return !0;
  }
  __name5(isInDocumentOrder, "isInDocumentOrder");
  function sortByDocumentPosition(a, b) {
    return !a[1].element || !b[1].element ? 0 : isElementPreceding(a[1].element, b[1].element) ? -1 : 1;
  }
  __name5(sortByDocumentPosition, "sortByDocumentPosition");
  function getChildListObserver(callback) {
    return new MutationObserver((mutationsList) => {
      for (let mutation of mutationsList)
        if (mutation.type === "childList") {
          callback();
          return;
        }
    });
  }
  __name5(getChildListObserver, "getChildListObserver");

  // ../../node_modules/@radix-ui/primitive/dist/index.mjs
  var __defProp7 = Object.defineProperty, __name6 = (target, value) => __defProp7(target, "name", { value, configurable: !0 }), canUseDOM = !!(typeof window < "u" && window.document && window.document.createElement);
  function composeEventHandlers(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = !0 } = {}) {
    return /* @__PURE__ */ __name6(function(event) {
      if (originalEventHandler?.(event), checkForDefaultPrevented === !1 || !event || !event.defaultPrevented)
        return ourEventHandler?.(event);
    }, "handleEvent");
  }
  __name6(composeEventHandlers, "composeEventHandlers");
  function getOwnerWindow(element) {
    if (!canUseDOM)
      throw new Error("Cannot access window outside of the DOM");
    return element?.ownerDocument?.defaultView ?? window;
  }
  __name6(getOwnerWindow, "getOwnerWindow");
  function getOwnerDocument(element) {
    if (!canUseDOM)
      throw new Error("Cannot access document outside of the DOM");
    return element?.ownerDocument ?? document;
  }
  __name6(getOwnerDocument, "getOwnerDocument");
  function getActiveElement(node, activeDescendant = !1) {
    let { activeElement } = getOwnerDocument(node);
    if (!activeElement?.nodeName)
      return null;
    if (isFrame(activeElement) && activeElement.contentDocument)
      return getActiveElement(activeElement.contentDocument.body, activeDescendant);
    if (activeDescendant) {
      let id = activeElement.getAttribute("aria-activedescendant");
      if (id) {
        let element = getOwnerDocument(activeElement).getElementById(id);
        if (element)
          return element;
      }
    }
    return activeElement;
  }
  __name6(getActiveElement, "getActiveElement");
  function isFrame(element) {
    return element.tagName === "IFRAME";
  }
  __name6(isFrame, "isFrame");

  // ../../node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs
  var React8 = __toESM(require_react(), 1);

  // ../../node_modules/@radix-ui/primitive/dist/internal/is-development.false.mjs
  var IS_DEVELOPMENT = !1;

  // ../../node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs
  var React23 = __toESM(require_react(), 1);

  // ../../node_modules/@radix-ui/react-use-effect-event/dist/index.mjs
  var React7 = __toESM(require_react(), 1), __defProp8 = Object.defineProperty, __name7 = (target, value) => __defProp8(target, "name", { value, configurable: !0 }), useReactEffectEvent = React7[" useEffectEvent ".trim().toString()], useReactInsertionEffect = React7[" useInsertionEffect ".trim().toString()];
  function useEffectEvent(callback) {
    if (typeof useReactEffectEvent == "function")
      return useReactEffectEvent(callback);
    let ref = React7.useRef(() => {
      throw new Error("Cannot call an event handler while rendering.");
    });
    return typeof useReactInsertionEffect == "function" ? useReactInsertionEffect(() => {
      ref.current = callback;
    }) : useLayoutEffect2(() => {
      ref.current = callback;
    }), React7.useMemo(() => ((...args) => ref.current?.(...args)), []);
  }
  __name7(useEffectEvent, "useEffectEvent");

  // ../../node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs
  var __defProp9 = Object.defineProperty, __name8 = (target, value) => __defProp9(target, "name", { value, configurable: !0 }), useInsertionEffect = React8[" useInsertionEffect ".trim().toString()] || useLayoutEffect2;
  function useControllableState({
    prop,
    defaultProp,
    onChange = /* @__PURE__ */ __name8(() => {
    }, "onChange"),
    caller
  }) {
    let [uncontrolledProp, setUncontrolledProp, onChangeRef] = useUncontrolledState({
      defaultProp,
      onChange
    }), isControlled = prop !== void 0, value = isControlled ? prop : uncontrolledProp;
    if (IS_DEVELOPMENT) {
      let isControlledRef = React8.useRef(prop !== void 0);
      React8.useEffect(() => {
        let wasControlled = isControlledRef.current;
        wasControlled !== isControlled && console.warn(
          `${caller} is changing from ${wasControlled ? "controlled" : "uncontrolled"} to ${isControlled ? "controlled" : "uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
        ), isControlledRef.current = isControlled;
      }, [isControlled, caller]);
    }
    let setValue = React8.useCallback(
      (nextValue) => {
        if (isControlled) {
          let value2 = isFunction(nextValue) ? nextValue(prop) : nextValue;
          value2 !== prop && onChangeRef.current?.(value2);
        } else
          setUncontrolledProp(nextValue);
      },
      [isControlled, prop, setUncontrolledProp, onChangeRef]
    );
    return [value, setValue];
  }
  __name8(useControllableState, "useControllableState");
  function useUncontrolledState({
    defaultProp,
    onChange
  }) {
    let [value, setValue] = React8.useState(defaultProp), prevValueRef = React8.useRef(value), onChangeRef = React8.useRef(onChange);
    return useInsertionEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]), React8.useEffect(() => {
      prevValueRef.current !== value && (onChangeRef.current?.(value), prevValueRef.current = value);
    }, [value, prevValueRef]), [value, setValue, onChangeRef];
  }
  __name8(useUncontrolledState, "useUncontrolledState");
  function isFunction(value) {
    return typeof value == "function";
  }
  __name8(isFunction, "isFunction");
  var SYNC_STATE = /* @__PURE__ */ Symbol("RADIX:SYNC_STATE");
  function useControllableStateReducer(reducer, userArgs, initialArg, init) {
    let { prop: controlledState, defaultProp, onChange: onChangeProp, caller } = userArgs, isControlled = controlledState !== void 0, onChange = useEffectEvent(onChangeProp);
    if (IS_DEVELOPMENT) {
      let isControlledRef = React23.useRef(controlledState !== void 0);
      React23.useEffect(() => {
        let wasControlled = isControlledRef.current;
        wasControlled !== isControlled && console.warn(
          `${caller} is changing from ${wasControlled ? "controlled" : "uncontrolled"} to ${isControlled ? "controlled" : "uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
        ), isControlledRef.current = isControlled;
      }, [isControlled, caller]);
    }
    let args = [{ ...initialArg, state: defaultProp }];
    init && args.push(init);
    let [internalState, dispatch] = React23.useReducer(
      (state2, action) => {
        if (action.type === SYNC_STATE)
          return { ...state2, state: action.state };
        let next = reducer(state2, action);
        return isControlled && !Object.is(next.state, state2.state) && onChange(next.state), next;
      },
      ...args
    ), uncontrolledState = internalState.state, prevValueRef = React23.useRef(uncontrolledState);
    React23.useEffect(() => {
      prevValueRef.current !== uncontrolledState && (prevValueRef.current = uncontrolledState, isControlled || onChange(uncontrolledState));
    }, [uncontrolledState, prevValueRef, isControlled]);
    let state = React23.useMemo(() => controlledState !== void 0 ? { ...internalState, state: controlledState } : internalState, [internalState, controlledState]);
    return React23.useEffect(() => {
      isControlled && !Object.is(controlledState, internalState.state) && dispatch({ type: SYNC_STATE, state: controlledState });
    }, [controlledState, internalState.state, isControlled]), [state, dispatch];
  }
  __name8(useControllableStateReducer, "useControllableStateReducer");

  // ../../node_modules/@radix-ui/react-presence/dist/index.mjs
  var React24 = __toESM(require_react(), 1);
  var React9 = __toESM(require_react(), 1), __defProp10 = Object.defineProperty, __name9 = (target, value) => __defProp10(target, "name", { value, configurable: !0 });
  function useStateMachine(initialState, machine) {
    return React9.useReducer((state, event) => machine[state][event] ?? state, initialState);
  }
  __name9(useStateMachine, "useStateMachine");
  var Presence = /* @__PURE__ */ __name9((props) => {
    let { present, children } = props, presence = usePresence(present), child = typeof children == "function" ? children({ present: presence.isPresent }) : React24.Children.only(children), ref = useStableComposedRefs(presence.ref, getElementRef2(child));
    return typeof children == "function" || presence.isPresent ? React24.cloneElement(child, { ref }) : null;
  }, "Presence");
  function usePresence(present) {
    let [node, setNode] = React24.useState(), stylesRef = React24.useRef(null), prevPresentRef = React24.useRef(present), prevAnimationNameRef = React24.useRef("none"), mountAnimationNameRef = React24.useRef(void 0), initialState = present ? "mounted" : "unmounted", [state, send] = useStateMachine(initialState, {
      mounted: {
        UNMOUNT: "unmounted",
        ANIMATION_OUT: "unmountSuspended"
      },
      unmountSuspended: {
        MOUNT: "mounted",
        ANIMATION_END: "unmounted"
      },
      unmounted: {
        MOUNT: "mounted"
      }
    });
    return React24.useEffect(() => {
      state === "mounted" ? (prevAnimationNameRef.current = mountAnimationNameRef.current ?? getAnimationName(stylesRef.current), mountAnimationNameRef.current = void 0) : prevAnimationNameRef.current = "none";
    }, [state]), useLayoutEffect2(() => {
      let styles = stylesRef.current, wasPresent = prevPresentRef.current;
      if (wasPresent !== present) {
        let prevAnimationName = prevAnimationNameRef.current, currentAnimationName = getAnimationName(styles);
        present ? (mountAnimationNameRef.current = currentAnimationName, send("MOUNT")) : currentAnimationName === "none" || styles?.display === "none" ? send("UNMOUNT") : send(wasPresent && prevAnimationName !== currentAnimationName ? "ANIMATION_OUT" : "UNMOUNT"), prevPresentRef.current = present;
      }
    }, [present, send]), useLayoutEffect2(() => {
      if (node) {
        let timeoutId, ownerWindow = node.ownerDocument.defaultView ?? window, handleAnimationEnd = /* @__PURE__ */ __name9((event) => {
          let isCurrentAnimation = getAnimationName(stylesRef.current).includes(CSS.escape(event.animationName));
          if (event.target === node && isCurrentAnimation && (send("ANIMATION_END"), !prevPresentRef.current)) {
            let currentFillMode = node.style.animationFillMode;
            node.style.animationFillMode = "forwards", timeoutId = ownerWindow.setTimeout(() => {
              node.style.animationFillMode === "forwards" && (node.style.animationFillMode = currentFillMode);
            });
          }
        }, "handleAnimationEnd"), handleAnimationStart = /* @__PURE__ */ __name9((event) => {
          event.target === node && (prevAnimationNameRef.current = getAnimationName(stylesRef.current));
        }, "handleAnimationStart");
        return node.addEventListener("animationstart", handleAnimationStart), node.addEventListener("animationcancel", handleAnimationEnd), node.addEventListener("animationend", handleAnimationEnd), () => {
          ownerWindow.clearTimeout(timeoutId), node.removeEventListener("animationstart", handleAnimationStart), node.removeEventListener("animationcancel", handleAnimationEnd), node.removeEventListener("animationend", handleAnimationEnd);
        };
      } else
        send("ANIMATION_END");
    }, [node, send]), {
      isPresent: ["mounted", "unmountSuspended"].includes(state),
      ref: React24.useCallback((node2) => {
        if (node2) {
          let styles = getComputedStyle(node2);
          stylesRef.current = styles, mountAnimationNameRef.current = getAnimationName(styles);
        } else
          stylesRef.current = null;
        setNode(node2);
      }, [])
    };
  }
  __name9(usePresence, "usePresence");
  function setRef2(ref, value) {
    if (typeof ref == "function")
      return ref(value);
    ref != null && (ref.current = value);
  }
  __name9(setRef2, "setRef");
  function useStableComposedRefs(...refs) {
    let refsRef = React24.useRef(refs);
    return refsRef.current = refs, React24.useCallback((node) => {
      let currentRefs = refsRef.current, hasCleanup = !1, cleanups = currentRefs.map((ref) => {
        let cleanup = setRef2(ref, node);
        return !hasCleanup && typeof cleanup == "function" && (hasCleanup = !0), cleanup;
      });
      if (hasCleanup)
        return () => {
          for (let i = 0; i < cleanups.length; i++) {
            let cleanup = cleanups[i];
            typeof cleanup == "function" ? cleanup() : setRef2(currentRefs[i], null);
          }
        };
    }, []);
  }
  __name9(useStableComposedRefs, "useStableComposedRefs");
  function getAnimationName(styles) {
    return styles?.animationName || "none";
  }
  __name9(getAnimationName, "getAnimationName");
  function getElementRef2(element) {
    let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get, mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
    return mayWarn ? element.ref : (getter = Object.getOwnPropertyDescriptor(element, "ref")?.get, mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning, mayWarn ? element.props.ref : element.props.ref || element.ref);
  }
  __name9(getElementRef2, "getElementRef");

  // ../../node_modules/@radix-ui/react-id/dist/index.mjs
  var React10 = __toESM(require_react(), 1);
  var __defProp11 = Object.defineProperty, __name10 = (target, value) => __defProp11(target, "name", { value, configurable: !0 }), useReactId = React10[" useId ".trim().toString()] || (() => {
  }), count = 0;
  function useId(deterministicId) {
    let [id, setId] = React10.useState(useReactId());
    return useLayoutEffect2(() => {
      deterministicId || setId((reactId) => reactId ?? String(count++));
    }, [deterministicId]), deterministicId || (id ? `radix-${id}` : "");
  }
  __name10(useId, "useId");

  // ../../node_modules/@radix-ui/react-direction/dist/index.mjs
  var React11 = __toESM(require_react(), 1), import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1), __defProp12 = Object.defineProperty, __name11 = (target, value) => __defProp12(target, "name", { value, configurable: !0 }), Direction = {
    LTR: "ltr",
    RTL: "rtl"
  }, DirectionContext = React11.createContext(void 0);
  function useDirection(localDir) {
    let globalDir = React11.useContext(DirectionContext);
    return localDir || globalDir || Direction.LTR;
  }
  __name11(useDirection, "useDirection");

  // ../../node_modules/@radix-ui/react-dialog/dist/index.mjs
  var dist_exports = {};
  __export(dist_exports, {
    Close: () => DialogClose,
    Content: () => DialogContent,
    Description: () => DialogDescription,
    Dialog: () => Dialog,
    DialogClose: () => DialogClose,
    DialogContent: () => DialogContent,
    DialogDescription: () => DialogDescription,
    DialogOverlay: () => DialogOverlay,
    DialogPortal: () => DialogPortal,
    DialogTitle: () => DialogTitle,
    DialogTrigger: () => DialogTrigger,
    Overlay: () => DialogOverlay,
    Portal: () => DialogPortal,
    Root: () => Dialog,
    Title: () => DialogTitle,
    Trigger: () => DialogTrigger,
    WarningProvider: () => WarningProvider,
    createDialogScope: () => createDialogScope
  });
  var React27 = __toESM(require_react(), 1);

  // ../../node_modules/@radix-ui/react-dismissable-layer/dist/index.mjs
  var React13 = __toESM(require_react(), 1);

  // ../../node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs
  var React12 = __toESM(require_react(), 1), __defProp13 = Object.defineProperty, __name12 = (target, value) => __defProp13(target, "name", { value, configurable: !0 }), useReactInsertionEffect2 = React12[" useInsertionEffect ".trim().toString()];
  function useCallbackRef(callback) {
    let callbackRef = React12.useRef(callback);
    return typeof useReactInsertionEffect2 == "function" ? useReactInsertionEffect2(() => {
      callbackRef.current = callback;
    }) : useLayoutEffect2(() => {
      callbackRef.current = callback;
    }), React12.useMemo(() => ((...args) => callbackRef.current?.(...args)), []);
  }
  __name12(useCallbackRef, "useCallbackRef");

  // ../../node_modules/@radix-ui/react-dismissable-layer/dist/index.mjs
  var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1), __defProp14 = Object.defineProperty, __name13 = (target, value) => __defProp14(target, "name", { value, configurable: !0 }), CONTEXT_UPDATE = "dismissableLayer.update", POINTER_DOWN_OUTSIDE = "dismissableLayer.pointerDownOutside", FOCUS_OUTSIDE = "dismissableLayer.focusOutside", originalBodyPointerEvents, DismissableLayerContext = React13.createContext({
    layers: /* @__PURE__ */ new Set(),
    layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
    branches: /* @__PURE__ */ new Set(),
    // Outside elements that belong to a layer's own dismiss affordance (eg, a
    // dialog overlay). Pressing them should dismiss the layer regardless of
    // whether or not they stop propagation.
    //
    // See https://github.com/radix-ui/primitives/issues/3346
    dismissableSurfaces: /* @__PURE__ */ new Set()
  }), DismissableLayer = /* @__PURE__ */ React13.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name13(function(props, forwardedRef) {
      let {
        disableOutsidePointerEvents = !1,
        deferPointerDownOutside = !1,
        onEscapeKeyDown,
        onPointerDownOutside,
        onFocusOutside,
        onInteractOutside,
        onDismiss,
        ...layerProps
      } = props, context = React13.useContext(DismissableLayerContext), [node, setNode] = React13.useState(null), ownerDocument = node?.ownerDocument ?? globalThis?.document, [, force] = React13.useState({}), composedRefs = useComposedRefs(forwardedRef, setNode), layers = Array.from(context.layers), [highestLayerWithOutsidePointerEventsDisabled] = [
        ...context.layersWithOutsidePointerEventsDisabled
      ].slice(-1), highestLayerWithOutsidePointerEventsDisabledIndex = highestLayerWithOutsidePointerEventsDisabled ? layers.indexOf(highestLayerWithOutsidePointerEventsDisabled) : -1, index2 = node ? layers.indexOf(node) : -1, isBodyPointerEventsDisabled = context.layersWithOutsidePointerEventsDisabled.size > 0, isPointerEventsEnabled = index2 >= highestLayerWithOutsidePointerEventsDisabledIndex, isDeferredPointerDownOutsideRef = React13.useRef(!1), pointerDownOutside = usePointerDownOutside(
        (event) => {
          onPointerDownOutside?.(event), onInteractOutside?.(event), event.defaultPrevented || onDismiss?.();
        },
        {
          ownerDocument,
          deferPointerDownOutside,
          isDeferredPointerDownOutsideRef,
          dismissableSurfaces: context.dismissableSurfaces,
          shouldHandlePointerDownOutside: React13.useCallback(
            (target) => {
              if (!(target instanceof Node))
                return !1;
              let isPointerDownOnBranch = [...context.branches].some(
                (branch) => branch.contains(target)
              );
              return isPointerEventsEnabled && !isPointerDownOnBranch;
            },
            [context.branches, isPointerEventsEnabled]
          )
        }
      ), focusOutside = useFocusOutside((event) => {
        if (deferPointerDownOutside && isDeferredPointerDownOutsideRef.current)
          return;
        let target = event.target;
        [...context.branches].some((branch) => branch.contains(target)) || (onFocusOutside?.(event), onInteractOutside?.(event), event.defaultPrevented || onDismiss?.());
      }, ownerDocument), isHighestLayer = node ? index2 === layers.length - 1 : !1, handleKeyDown = useCallbackRef((event) => {
        event.key === "Escape" && (onEscapeKeyDown?.(event), !event.defaultPrevented && onDismiss && (event.preventDefault(), onDismiss()));
      });
      return React13.useEffect(() => {
        if (isHighestLayer)
          return ownerDocument.addEventListener("keydown", handleKeyDown, { capture: !0 }), () => ownerDocument.removeEventListener("keydown", handleKeyDown, { capture: !0 });
      }, [ownerDocument, isHighestLayer, handleKeyDown]), React13.useEffect(() => {
        if (node)
          return disableOutsidePointerEvents && (context.layersWithOutsidePointerEventsDisabled.size === 0 && (originalBodyPointerEvents = ownerDocument.body.style.pointerEvents, ownerDocument.body.style.pointerEvents = "none"), context.layersWithOutsidePointerEventsDisabled.add(node)), context.layers.add(node), dispatchUpdate(), () => {
            disableOutsidePointerEvents && (context.layersWithOutsidePointerEventsDisabled.delete(node), context.layersWithOutsidePointerEventsDisabled.size === 0 && (ownerDocument.body.style.pointerEvents = originalBodyPointerEvents));
          };
      }, [node, ownerDocument, disableOutsidePointerEvents, context]), React13.useEffect(() => () => {
        node && (context.layers.delete(node), context.layersWithOutsidePointerEventsDisabled.delete(node), dispatchUpdate());
      }, [node, context]), React13.useEffect(() => {
        let handleUpdate = /* @__PURE__ */ __name13(() => force({}), "handleUpdate");
        return document.addEventListener(CONTEXT_UPDATE, handleUpdate), () => document.removeEventListener(CONTEXT_UPDATE, handleUpdate);
      }, []), /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        Primitive.div,
        {
          ...layerProps,
          ref: composedRefs,
          style: {
            pointerEvents: isBodyPointerEventsDisabled ? isPointerEventsEnabled ? "auto" : "none" : void 0,
            ...props.style
          },
          onFocusCapture: composeEventHandlers(props.onFocusCapture, focusOutside.onFocusCapture),
          onBlurCapture: composeEventHandlers(props.onBlurCapture, focusOutside.onBlurCapture),
          onPointerDownCapture: composeEventHandlers(
            props.onPointerDownCapture,
            pointerDownOutside.onPointerDownCapture
          )
        }
      );
    }, "DismissableLayer")
  );
  function useDismissableLayerSurface() {
    let context = React13.useContext(DismissableLayerContext), [node, setNode] = React13.useState(null);
    return React13.useEffect(() => {
      if (node)
        return context.dismissableSurfaces.add(node), () => {
          context.dismissableSurfaces.delete(node);
        };
    }, [node, context.dismissableSurfaces]), setNode;
  }
  __name13(useDismissableLayerSurface, "useDismissableLayerSurface");
  var IS_TRUE = /* @__PURE__ */ __name13(() => !0, "IS_TRUE");
  function usePointerDownOutside(onPointerDownOutside, args) {
    let {
      ownerDocument = globalThis?.document,
      deferPointerDownOutside = !1,
      isDeferredPointerDownOutsideRef,
      dismissableSurfaces,
      shouldHandlePointerDownOutside = IS_TRUE
    } = args, handlePointerDownOutside = useCallbackRef(onPointerDownOutside), isPointerInsideReactTreeRef = React13.useRef(!1), isPointerDownOutsideRef = React13.useRef(!1), interceptedOutsideInteractionEventsRef = React13.useRef(/* @__PURE__ */ new Map()), handleClickRef = React13.useRef(() => {
    });
    return React13.useEffect(() => {
      function resetOutsideInteraction() {
        isPointerDownOutsideRef.current = !1, isDeferredPointerDownOutsideRef.current = !1, interceptedOutsideInteractionEventsRef.current.clear();
      }
      __name13(resetOutsideInteraction, "resetOutsideInteraction");
      function isOutsideInteractionIntercepted() {
        return Array.from(interceptedOutsideInteractionEventsRef.current.values()).some(Boolean);
      }
      __name13(isOutsideInteractionIntercepted, "isOutsideInteractionIntercepted");
      function handleInteractionCapture(event) {
        if (!isPointerDownOutsideRef.current)
          return;
        let target = event.target;
        target instanceof Node && [...dismissableSurfaces].some((surface) => surface.contains(target)) || interceptedOutsideInteractionEventsRef.current.set(event.type, !0), event.type === "click" && window.setTimeout(() => {
          isPointerDownOutsideRef.current && handleClickRef.current();
        }, 0);
      }
      __name13(handleInteractionCapture, "handleInteractionCapture");
      function handleInteractionBubble(event) {
        isPointerDownOutsideRef.current && interceptedOutsideInteractionEventsRef.current.set(event.type, !1);
      }
      __name13(handleInteractionBubble, "handleInteractionBubble");
      let handlePointerDown = /* @__PURE__ */ __name13((event) => {
        if (event.target && !isPointerInsideReactTreeRef.current) {
          let handleAndDispatchPointerDownOutsideEvent2 = function() {
            ownerDocument.removeEventListener("click", handleClickRef.current);
            let wasOutsideInteractionIntercepted = isOutsideInteractionIntercepted();
            resetOutsideInteraction(), wasOutsideInteractionIntercepted || handleAndDispatchCustomEvent(
              POINTER_DOWN_OUTSIDE,
              handlePointerDownOutside,
              eventDetail,
              { discrete: !0 }
            );
          };
          var handleAndDispatchPointerDownOutsideEvent = handleAndDispatchPointerDownOutsideEvent2;
          if (__name13(handleAndDispatchPointerDownOutsideEvent2, "handleAndDispatchPointerDownOutsideEvent"), !shouldHandlePointerDownOutside(event.target)) {
            ownerDocument.removeEventListener("click", handleClickRef.current), resetOutsideInteraction(), isPointerInsideReactTreeRef.current = !1;
            return;
          }
          let eventDetail = { originalEvent: event };
          isPointerDownOutsideRef.current = !0, isDeferredPointerDownOutsideRef.current = deferPointerDownOutside && event.button === 0, interceptedOutsideInteractionEventsRef.current.clear(), !deferPointerDownOutside || event.button !== 0 ? handleAndDispatchPointerDownOutsideEvent2() : (ownerDocument.removeEventListener("click", handleClickRef.current), handleClickRef.current = handleAndDispatchPointerDownOutsideEvent2, ownerDocument.addEventListener("click", handleClickRef.current, { once: !0 }));
        } else
          ownerDocument.removeEventListener("click", handleClickRef.current), resetOutsideInteraction();
        isPointerInsideReactTreeRef.current = !1;
      }, "handlePointerDown"), outsideInteractionEvents = [
        "pointerup",
        "mousedown",
        "mouseup",
        "touchstart",
        "touchend",
        "click"
      ];
      for (let eventName of outsideInteractionEvents)
        ownerDocument.addEventListener(eventName, handleInteractionCapture, !0), ownerDocument.addEventListener(eventName, handleInteractionBubble);
      let timerId = window.setTimeout(() => {
        ownerDocument.addEventListener("pointerdown", handlePointerDown);
      }, 0);
      return () => {
        window.clearTimeout(timerId), ownerDocument.removeEventListener("pointerdown", handlePointerDown), ownerDocument.removeEventListener("click", handleClickRef.current);
        for (let eventName of outsideInteractionEvents)
          ownerDocument.removeEventListener(eventName, handleInteractionCapture, !0), ownerDocument.removeEventListener(eventName, handleInteractionBubble);
      };
    }, [
      ownerDocument,
      handlePointerDownOutside,
      deferPointerDownOutside,
      isDeferredPointerDownOutsideRef,
      dismissableSurfaces,
      shouldHandlePointerDownOutside
    ]), {
      // ensures we check React component tree (not just DOM tree)
      onPointerDownCapture: /* @__PURE__ */ __name13(() => isPointerInsideReactTreeRef.current = !0, "onPointerDownCapture")
    };
  }
  __name13(usePointerDownOutside, "usePointerDownOutside");
  function useFocusOutside(onFocusOutside, ownerDocument = globalThis?.document) {
    let handleFocusOutside = useCallbackRef(onFocusOutside), isFocusInsideReactTreeRef = React13.useRef(!1);
    return React13.useEffect(() => {
      let handleFocus = /* @__PURE__ */ __name13((event) => {
        event.target && !isFocusInsideReactTreeRef.current && handleAndDispatchCustomEvent(FOCUS_OUTSIDE, handleFocusOutside, { originalEvent: event }, {
          discrete: !1
        });
      }, "handleFocus");
      return ownerDocument.addEventListener("focusin", handleFocus), () => ownerDocument.removeEventListener("focusin", handleFocus);
    }, [ownerDocument, handleFocusOutside]), {
      onFocusCapture: /* @__PURE__ */ __name13(() => isFocusInsideReactTreeRef.current = !0, "onFocusCapture"),
      onBlurCapture: /* @__PURE__ */ __name13(() => isFocusInsideReactTreeRef.current = !1, "onBlurCapture")
    };
  }
  __name13(useFocusOutside, "useFocusOutside");
  function dispatchUpdate() {
    let event = new CustomEvent(CONTEXT_UPDATE);
    document.dispatchEvent(event);
  }
  __name13(dispatchUpdate, "dispatchUpdate");
  function handleAndDispatchCustomEvent(name, handler, detail, { discrete }) {
    let target = detail.originalEvent.target, event = new CustomEvent(name, { bubbles: !1, cancelable: !0, detail });
    handler && target.addEventListener(name, handler, { once: !0 }), discrete ? dispatchDiscreteCustomEvent(target, event) : target.dispatchEvent(event);
  }
  __name13(handleAndDispatchCustomEvent, "handleAndDispatchCustomEvent");

  // ../../node_modules/@radix-ui/react-focus-scope/dist/index.mjs
  var React14 = __toESM(require_react(), 1);
  var import_jsx_runtime7 = __toESM(require_jsx_runtime(), 1), __defProp15 = Object.defineProperty, __name14 = (target, value) => __defProp15(target, "name", { value, configurable: !0 }), AUTOFOCUS_ON_MOUNT = "focusScope.autoFocusOnMount", AUTOFOCUS_ON_UNMOUNT = "focusScope.autoFocusOnUnmount", EVENT_OPTIONS = { bubbles: !1, cancelable: !0 }, FocusScope = /* @__PURE__ */ React14.forwardRef(
    /* @__PURE__ */ __name14(function(props, forwardedRef) {
      let {
        loop = !1,
        trapped = !1,
        branches,
        onMountAutoFocus: onMountAutoFocusProp,
        onUnmountAutoFocus: onUnmountAutoFocusProp,
        ...scopeProps
      } = props, [container, setContainer] = React14.useState(null), onMountAutoFocus = useCallbackRef(onMountAutoFocusProp), onUnmountAutoFocus = useCallbackRef(onUnmountAutoFocusProp), lastFocusedElementRef = React14.useRef(null), composedRefs = useComposedRefs(forwardedRef, setContainer), branchesRef = React14.useRef(branches);
      React14.useEffect(() => {
        branchesRef.current = branches;
      });
      let isTargetInScope = React14.useCallback(
        (target) => target ? container?.contains(target) ? !0 : !!branchesRef.current?.some((branch) => branch.contains(target)) : !1,
        [container]
      ), focusScope = React14.useRef({
        paused: !1,
        pause() {
          this.paused = !0;
        },
        resume() {
          this.paused = !1;
        }
      }).current;
      React14.useEffect(() => {
        if (trapped) {
          let handleFocusIn2 = function(event) {
            if (focusScope.paused || !container) return;
            let target = event.target;
            isTargetInScope(target) ? lastFocusedElementRef.current = target : focus(lastFocusedElementRef.current, { select: !0 });
          }, handleFocusOut2 = function(event) {
            if (focusScope.paused || !container) return;
            let relatedTarget = event.relatedTarget;
            relatedTarget !== null && (isTargetInScope(relatedTarget) || focus(lastFocusedElementRef.current, { select: !0 }));
          }, handleMutations2 = function(mutations) {
            if (document.activeElement === document.body)
              for (let mutation of mutations)
                mutation.removedNodes.length > 0 && focus(container);
          };
          var handleFocusIn = handleFocusIn2, handleFocusOut = handleFocusOut2, handleMutations = handleMutations2;
          __name14(handleFocusIn2, "handleFocusIn"), __name14(handleFocusOut2, "handleFocusOut"), __name14(handleMutations2, "handleMutations"), document.addEventListener("focusin", handleFocusIn2), document.addEventListener("focusout", handleFocusOut2);
          let mutationObserver = new MutationObserver(handleMutations2);
          return container && mutationObserver.observe(container, { childList: !0, subtree: !0 }), () => {
            document.removeEventListener("focusin", handleFocusIn2), document.removeEventListener("focusout", handleFocusOut2), mutationObserver.disconnect();
          };
        }
      }, [trapped, container, focusScope.paused, isTargetInScope]), React14.useEffect(() => {
        if (container) {
          focusScopesStack.add(focusScope);
          let previouslyFocusedElement = document.activeElement;
          if (!container.contains(previouslyFocusedElement)) {
            let mountEvent = new CustomEvent(AUTOFOCUS_ON_MOUNT, EVENT_OPTIONS);
            container.addEventListener(AUTOFOCUS_ON_MOUNT, onMountAutoFocus), container.dispatchEvent(mountEvent), mountEvent.defaultPrevented || (focusFirst(removeLinks(getTabbableCandidates(container)), { select: !0 }), document.activeElement === previouslyFocusedElement && focus(container));
          }
          return () => {
            container.removeEventListener(AUTOFOCUS_ON_MOUNT, onMountAutoFocus);
            let ownerDocument = container.ownerDocument, UnmountEvent = CustomEvent;
            setTimeout(() => {
              let unmountEvent = new UnmountEvent(AUTOFOCUS_ON_UNMOUNT, EVENT_OPTIONS);
              container.addEventListener(AUTOFOCUS_ON_UNMOUNT, onUnmountAutoFocus), container.dispatchEvent(unmountEvent), unmountEvent.defaultPrevented || focus(previouslyFocusedElement ?? ownerDocument.body, { select: !0 }), container.removeEventListener(AUTOFOCUS_ON_UNMOUNT, onUnmountAutoFocus), focusScopesStack.remove(focusScope);
            }, 0);
          };
        }
      }, [container, onMountAutoFocus, onUnmountAutoFocus, focusScope]);
      let handleKeyDown = React14.useCallback(
        (event) => {
          if (!loop && !trapped || focusScope.paused) return;
          let isTabKey = event.key === "Tab" && !event.altKey && !event.ctrlKey && !event.metaKey, focusedElement = document.activeElement;
          if (isTabKey && focusedElement) {
            let container2 = event.currentTarget, [first, last] = getTabbableEdges(container2);
            first && last ? !event.shiftKey && focusedElement === last ? (event.preventDefault(), loop && focus(first, { select: !0 })) : event.shiftKey && focusedElement === first && (event.preventDefault(), loop && focus(last, { select: !0 })) : focusedElement === container2 && event.preventDefault();
          }
        },
        [loop, trapped, focusScope.paused]
      );
      return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Primitive.div, { tabIndex: -1, ...scopeProps, ref: composedRefs, onKeyDown: handleKeyDown });
    }, "FocusScope")
  ), FocusScopeBranchContext = React14.createContext(null);
  function FocusScopeBranchProvider({ registry, children }) {
    return registry ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(FocusScopeBranchContext.Provider, { value: registry, children }) : children;
  }
  __name14(FocusScopeBranchProvider, "FocusScopeBranchProvider");
  function useFocusScopeBranchRegistry() {
    let [nodes, setNodes] = React14.useState([]), registry = React14.useMemo(
      () => ({
        add: /* @__PURE__ */ __name14((node) => setNodes((prev) => prev.includes(node) ? prev : [...prev, node]), "add"),
        remove: /* @__PURE__ */ __name14((node) => setNodes((prev) => prev.filter((current) => current !== node)), "remove")
      }),
      []
    );
    return { nodes, registry };
  }
  __name14(useFocusScopeBranchRegistry, "useFocusScopeBranchRegistry");
  function useFocusScopeBranch(node) {
    let registry = React14.useContext(FocusScopeBranchContext);
    React14.useEffect(() => {
      if (!(!node || !registry))
        return registry.add(node), () => registry.remove(node);
    }, [node, registry]);
  }
  __name14(useFocusScopeBranch, "useFocusScopeBranch");
  function focusFirst(candidates, { select = !1 } = {}) {
    let previouslyFocusedElement = document.activeElement;
    for (let candidate of candidates)
      if (focus(candidate, { select }), document.activeElement !== previouslyFocusedElement) return;
  }
  __name14(focusFirst, "focusFirst");
  function getTabbableEdges(container) {
    let candidates = getTabbableCandidates(container), first = findVisible(candidates, container), last = findVisible(candidates.reverse(), container);
    return [first, last];
  }
  __name14(getTabbableEdges, "getTabbableEdges");
  function getTabbableCandidates(container) {
    let nodes = [], walker = container.ownerDocument.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
      acceptNode: /* @__PURE__ */ __name14((node) => {
        let isHiddenInput = node.tagName === "INPUT" && node.type === "hidden";
        return node.disabled || node.hidden || isHiddenInput ? NodeFilter.FILTER_SKIP : node.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }, "acceptNode")
    });
    for (; walker.nextNode(); )
      nodes.push(walker.currentNode);
    return nodes;
  }
  __name14(getTabbableCandidates, "getTabbableCandidates");
  function findVisible(elements, container) {
    let canUseCheckVisibility = typeof container.checkVisibility == "function" && container.checkVisibility({ checkVisibilityCSS: !0 });
    for (let element of elements)
      if (!(canUseCheckVisibility ? !element.checkVisibility({ checkVisibilityCSS: !0 }) : isHidden(element, { upTo: container })))
        return element;
  }
  __name14(findVisible, "findVisible");
  function isHidden(node, { upTo }) {
    if (getComputedStyle(node).visibility === "hidden") return !0;
    for (; node; ) {
      if (upTo !== void 0 && node === upTo) return !1;
      if (getComputedStyle(node).display === "none") return !0;
      node = node.parentElement;
    }
    return !1;
  }
  __name14(isHidden, "isHidden");
  function isSelectableInput(element) {
    return element.tagName === "INPUT" && typeof element.select == "function";
  }
  __name14(isSelectableInput, "isSelectableInput");
  function focus(element, { select = !1 } = {}) {
    if (element && element.focus) {
      let previouslyFocusedElement = (element.ownerDocument ?? document).activeElement;
      element.focus({ preventScroll: !0 }), element !== previouslyFocusedElement && isSelectableInput(element) && select && element.select();
    }
  }
  __name14(focus, "focus");
  var focusScopesStack = createFocusScopesStack();
  function createFocusScopesStack() {
    let stack = [];
    return {
      add(focusScope) {
        let activeFocusScope = stack[0];
        focusScope !== activeFocusScope && activeFocusScope?.pause(), stack = arrayRemove(stack, focusScope), stack.unshift(focusScope);
      },
      remove(focusScope) {
        stack = arrayRemove(stack, focusScope), stack[0]?.resume();
      }
    };
  }
  __name14(createFocusScopesStack, "createFocusScopesStack");
  function arrayRemove(array, item) {
    let updatedArray = [...array], index2 = updatedArray.indexOf(item);
    return index2 !== -1 && updatedArray.splice(index2, 1), updatedArray;
  }
  __name14(arrayRemove, "arrayRemove");
  function removeLinks(items) {
    return items.filter((item) => item.tagName !== "A");
  }
  __name14(removeLinks, "removeLinks");

  // ../../node_modules/@radix-ui/react-portal/dist/index.mjs
  var React15 = __toESM(require_react(), 1), ReactDOM2 = __toESM(require_react_dom(), 1);
  var import_jsx_runtime8 = __toESM(require_jsx_runtime(), 1), __defProp16 = Object.defineProperty, __name15 = (target, value) => __defProp16(target, "name", { value, configurable: !0 }), Portal = /* @__PURE__ */ React15.forwardRef(
    /* @__PURE__ */ __name15(function(props, forwardedRef) {
      let { container: containerProp, ...portalProps } = props, [mounted, setMounted] = React15.useState(!1);
      useLayoutEffect2(() => setMounted(!0), []);
      let container = containerProp || mounted && globalThis?.document?.body;
      return container ? ReactDOM2.createPortal(/* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Primitive.div, { ...portalProps, ref: forwardedRef }), container) : null;
    }, "Portal")
  );

  // ../../node_modules/@radix-ui/react-focus-guards/dist/index.mjs
  var React16 = __toESM(require_react(), 1), __defProp17 = Object.defineProperty, __name16 = (target, value) => __defProp17(target, "name", { value, configurable: !0 }), count2 = 0, guards = null;
  function FocusGuards(props) {
    return useFocusGuards(), props.children;
  }
  __name16(FocusGuards, "FocusGuards");
  function useFocusGuards() {
    React16.useEffect(() => {
      guards || (guards = { start: createFocusGuard(), end: createFocusGuard() });
      let { start: start2, end } = guards;
      return document.body.firstElementChild !== start2 && document.body.insertAdjacentElement("afterbegin", start2), document.body.lastElementChild !== end && document.body.insertAdjacentElement("beforeend", end), count2++, () => {
        count2 === 1 && (guards?.start.remove(), guards?.end.remove(), guards = null), count2 = Math.max(0, count2 - 1);
      };
    }, []);
  }
  __name16(useFocusGuards, "useFocusGuards");
  function createFocusGuard() {
    let element = document.createElement("span");
    return element.setAttribute("data-radix-focus-guard", ""), element.tabIndex = 0, element.style.outline = "none", element.style.opacity = "0", element.style.position = "fixed", element.style.pointerEvents = "none", element;
  }
  __name16(createFocusGuard, "createFocusGuard");

  // ../../node_modules/tslib/tslib.es6.mjs
  var __assign = function() {
    return __assign = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) Object.prototype.hasOwnProperty.call(s, p) && (t[p] = s[p]);
      }
      return t;
    }, __assign.apply(this, arguments);
  };
  function __rest(s, e) {
    var t = {};
    for (var p in s) Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0 && (t[p] = s[p]);
    if (s != null && typeof Object.getOwnPropertySymbols == "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++)
        e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]) && (t[p[i]] = s[p[i]]);
    return t;
  }
  function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++)
      (ar || !(i in from)) && (ar || (ar = Array.prototype.slice.call(from, 0, i)), ar[i] = from[i]);
    return to.concat(ar || Array.prototype.slice.call(from));
  }

  // ../../node_modules/react-remove-scroll/dist/es2015/Combination.js
  var React26 = __toESM(require_react());

  // ../../node_modules/react-remove-scroll/dist/es2015/UI.js
  var React19 = __toESM(require_react());

  // ../../node_modules/react-remove-scroll-bar/dist/es2015/constants.js
  var zeroRightClassName = "right-scroll-bar-position", fullWidthClassName = "width-before-scroll-bar", noScrollbarsClassName = "with-scroll-bars-hidden", removedBarSizeVariable = "--removed-body-scroll-bar-size";

  // ../../node_modules/use-callback-ref/dist/es2015/assignRef.js
  function assignRef(ref, value) {
    return typeof ref == "function" ? ref(value) : ref && (ref.current = value), ref;
  }

  // ../../node_modules/use-callback-ref/dist/es2015/useRef.js
  var import_react = __toESM(require_react());
  function useCallbackRef2(initialValue, callback) {
    var ref = (0, import_react.useState)(function() {
      return {
        // value
        value: initialValue,
        // last callback
        callback,
        // "memoized" public interface
        facade: {
          get current() {
            return ref.value;
          },
          set current(value) {
            var last = ref.value;
            last !== value && (ref.value = value, ref.callback(value, last));
          }
        }
      };
    })[0];
    return ref.callback = callback, ref.facade;
  }

  // ../../node_modules/use-callback-ref/dist/es2015/useMergeRef.js
  var React17 = __toESM(require_react());
  var useIsomorphicLayoutEffect = typeof window < "u" ? React17.useLayoutEffect : React17.useEffect, currentValues = /* @__PURE__ */ new WeakMap();
  function useMergeRefs(refs, defaultValue) {
    var callbackRef = useCallbackRef2(defaultValue || null, function(newValue) {
      return refs.forEach(function(ref) {
        return assignRef(ref, newValue);
      });
    });
    return useIsomorphicLayoutEffect(function() {
      var oldValue = currentValues.get(callbackRef);
      if (oldValue) {
        var prevRefs_1 = new Set(oldValue), nextRefs_1 = new Set(refs), current_1 = callbackRef.current;
        prevRefs_1.forEach(function(ref) {
          nextRefs_1.has(ref) || assignRef(ref, null);
        }), nextRefs_1.forEach(function(ref) {
          prevRefs_1.has(ref) || assignRef(ref, current_1);
        });
      }
      currentValues.set(callbackRef, refs);
    }, [refs]), callbackRef;
  }

  // ../../node_modules/use-sidecar/dist/es2015/medium.js
  function ItoI(a) {
    return a;
  }
  function innerCreateMedium(defaults, middleware) {
    middleware === void 0 && (middleware = ItoI);
    var buffer = [], assigned = !1, medium = {
      read: function() {
        if (assigned)
          throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
        return buffer.length ? buffer[buffer.length - 1] : defaults;
      },
      useMedium: function(data) {
        var item = middleware(data, assigned);
        return buffer.push(item), function() {
          buffer = buffer.filter(function(x) {
            return x !== item;
          });
        };
      },
      assignSyncMedium: function(cb) {
        for (assigned = !0; buffer.length; ) {
          var cbs = buffer;
          buffer = [], cbs.forEach(cb);
        }
        buffer = {
          push: function(x) {
            return cb(x);
          },
          filter: function() {
            return buffer;
          }
        };
      },
      assignMedium: function(cb) {
        assigned = !0;
        var pendingQueue = [];
        if (buffer.length) {
          var cbs = buffer;
          buffer = [], cbs.forEach(cb), pendingQueue = buffer;
        }
        var executeQueue = function() {
          var cbs2 = pendingQueue;
          pendingQueue = [], cbs2.forEach(cb);
        }, cycle = function() {
          return Promise.resolve().then(executeQueue);
        };
        cycle(), buffer = {
          push: function(x) {
            pendingQueue.push(x), cycle();
          },
          filter: function(filter) {
            return pendingQueue = pendingQueue.filter(filter), buffer;
          }
        };
      }
    };
    return medium;
  }
  function createSidecarMedium(options2) {
    options2 === void 0 && (options2 = {});
    var medium = innerCreateMedium(null);
    return medium.options = __assign({ async: !0, ssr: !1 }, options2), medium;
  }

  // ../../node_modules/use-sidecar/dist/es2015/exports.js
  var React18 = __toESM(require_react()), SideCar = function(_a) {
    var sideCar = _a.sideCar, rest = __rest(_a, ["sideCar"]);
    if (!sideCar)
      throw new Error("Sidecar: please provide `sideCar` property to import the right car");
    var Target = sideCar.read();
    if (!Target)
      throw new Error("Sidecar medium not found");
    return React18.createElement(Target, __assign({}, rest));
  };
  SideCar.isSideCarExport = !0;
  function exportSidecar(medium, exported) {
    return medium.useMedium(exported), SideCar;
  }

  // ../../node_modules/react-remove-scroll/dist/es2015/medium.js
  var effectCar = createSidecarMedium();

  // ../../node_modules/react-remove-scroll/dist/es2015/UI.js
  var nothing = function() {
  }, RemoveScroll = React19.forwardRef(function(props, parentRef) {
    var ref = React19.useRef(null), _a = React19.useState({
      onScrollCapture: nothing,
      onWheelCapture: nothing,
      onTouchMoveCapture: nothing
    }), callbacks = _a[0], setCallbacks = _a[1], forwardProps = props.forwardProps, children = props.children, className = props.className, removeScrollBar = props.removeScrollBar, enabled = props.enabled, shards = props.shards, sideCar = props.sideCar, noRelative = props.noRelative, noIsolation = props.noIsolation, inert = props.inert, allowPinchZoom = props.allowPinchZoom, _b = props.as, Container = _b === void 0 ? "div" : _b, gapMode = props.gapMode, rest = __rest(props, ["forwardProps", "children", "className", "removeScrollBar", "enabled", "shards", "sideCar", "noRelative", "noIsolation", "inert", "allowPinchZoom", "as", "gapMode"]), SideCar2 = sideCar, containerRef = useMergeRefs([ref, parentRef]), containerProps = __assign(__assign({}, rest), callbacks);
    return React19.createElement(
      React19.Fragment,
      null,
      enabled && React19.createElement(SideCar2, { sideCar: effectCar, removeScrollBar, shards, noRelative, noIsolation, inert, setCallbacks, allowPinchZoom: !!allowPinchZoom, lockRef: ref, gapMode }),
      forwardProps ? React19.cloneElement(React19.Children.only(children), __assign(__assign({}, containerProps), { ref: containerRef })) : React19.createElement(Container, __assign({}, containerProps, { className, ref: containerRef }), children)
    );
  });
  RemoveScroll.defaultProps = {
    enabled: !0,
    removeScrollBar: !0,
    inert: !1
  };
  RemoveScroll.classNames = {
    fullWidth: fullWidthClassName,
    zeroRight: zeroRightClassName
  };

  // ../../node_modules/react-remove-scroll/dist/es2015/SideEffect.js
  var React25 = __toESM(require_react());

  // ../../node_modules/react-remove-scroll-bar/dist/es2015/component.js
  var React21 = __toESM(require_react());

  // ../../node_modules/react-style-singleton/dist/es2015/hook.js
  var React20 = __toESM(require_react());

  // ../../node_modules/get-nonce/dist/es2015/index.js
  var currentNonce;
  var getNonce = function() {
    if (currentNonce)
      return currentNonce;
    if (typeof __webpack_nonce__ < "u")
      return __webpack_nonce__;
  };

  // ../../node_modules/react-style-singleton/dist/es2015/singleton.js
  function makeStyleTag() {
    if (!document)
      return null;
    var tag = document.createElement("style");
    tag.type = "text/css";
    var nonce = getNonce();
    return nonce && tag.setAttribute("nonce", nonce), tag;
  }
  function injectStyles(tag, css) {
    tag.styleSheet ? tag.styleSheet.cssText = css : tag.appendChild(document.createTextNode(css));
  }
  function insertStyleTag(tag) {
    var head = document.head || document.getElementsByTagName("head")[0];
    head.appendChild(tag);
  }
  var stylesheetSingleton = function() {
    var counter = 0, stylesheet = null;
    return {
      add: function(style) {
        counter == 0 && (stylesheet = makeStyleTag()) && (injectStyles(stylesheet, style), insertStyleTag(stylesheet)), counter++;
      },
      remove: function() {
        counter--, !counter && stylesheet && (stylesheet.parentNode && stylesheet.parentNode.removeChild(stylesheet), stylesheet = null);
      }
    };
  };

  // ../../node_modules/react-style-singleton/dist/es2015/hook.js
  var styleHookSingleton = function() {
    var sheet = stylesheetSingleton();
    return function(styles, isDynamic) {
      React20.useEffect(function() {
        return sheet.add(styles), function() {
          sheet.remove();
        };
      }, [styles && isDynamic]);
    };
  };

  // ../../node_modules/react-style-singleton/dist/es2015/component.js
  var styleSingleton = function() {
    var useStyle = styleHookSingleton(), Sheet = function(_a) {
      var styles = _a.styles, dynamic = _a.dynamic;
      return useStyle(styles, dynamic), null;
    };
    return Sheet;
  };

  // ../../node_modules/react-remove-scroll-bar/dist/es2015/utils.js
  var zeroGap = {
    left: 0,
    top: 0,
    right: 0,
    gap: 0
  }, parse = function(x) {
    return parseInt(x || "", 10) || 0;
  }, getOffset = function(gapMode) {
    var cs = window.getComputedStyle(document.body), left = cs[gapMode === "padding" ? "paddingLeft" : "marginLeft"], top = cs[gapMode === "padding" ? "paddingTop" : "marginTop"], right = cs[gapMode === "padding" ? "paddingRight" : "marginRight"];
    return [parse(left), parse(top), parse(right)];
  }, getGapWidth = function(gapMode) {
    if (gapMode === void 0 && (gapMode = "margin"), typeof window > "u")
      return zeroGap;
    var offsets = getOffset(gapMode), documentWidth = document.documentElement.clientWidth, windowWidth = window.innerWidth;
    return {
      left: offsets[0],
      top: offsets[1],
      right: offsets[2],
      gap: Math.max(0, windowWidth - documentWidth + offsets[2] - offsets[0])
    };
  };

  // ../../node_modules/react-remove-scroll-bar/dist/es2015/component.js
  var Style = styleSingleton(), lockAttribute = "data-scroll-locked", getStyles = function(_a, allowRelative, gapMode, important) {
    var left = _a.left, top = _a.top, right = _a.right, gap = _a.gap;
    return gapMode === void 0 && (gapMode = "margin"), `
  .`.concat(noScrollbarsClassName, ` {
   overflow: hidden `).concat(important, `;
   padding-right: `).concat(gap, "px ").concat(important, `;
  }
  body[`).concat(lockAttribute, `] {
    overflow: hidden `).concat(important, `;
    overscroll-behavior: contain;
    `).concat([
      allowRelative && "position: relative ".concat(important, ";"),
      gapMode === "margin" && `
    padding-left: `.concat(left, `px;
    padding-top: `).concat(top, `px;
    padding-right: `).concat(right, `px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(gap, "px ").concat(important, `;
    `),
      gapMode === "padding" && "padding-right: ".concat(gap, "px ").concat(important, ";")
    ].filter(Boolean).join(""), `
  }
  
  .`).concat(zeroRightClassName, ` {
    right: `).concat(gap, "px ").concat(important, `;
  }
  
  .`).concat(fullWidthClassName, ` {
    margin-right: `).concat(gap, "px ").concat(important, `;
  }
  
  .`).concat(zeroRightClassName, " .").concat(zeroRightClassName, ` {
    right: 0 `).concat(important, `;
  }
  
  .`).concat(fullWidthClassName, " .").concat(fullWidthClassName, ` {
    margin-right: 0 `).concat(important, `;
  }
  
  body[`).concat(lockAttribute, `] {
    `).concat(removedBarSizeVariable, ": ").concat(gap, `px;
  }
`);
  }, getCurrentUseCounter = function() {
    var counter = parseInt(document.body.getAttribute(lockAttribute) || "0", 10);
    return isFinite(counter) ? counter : 0;
  }, useLockAttribute = function() {
    React21.useEffect(function() {
      return document.body.setAttribute(lockAttribute, (getCurrentUseCounter() + 1).toString()), function() {
        var newCounter = getCurrentUseCounter() - 1;
        newCounter <= 0 ? document.body.removeAttribute(lockAttribute) : document.body.setAttribute(lockAttribute, newCounter.toString());
      };
    }, []);
  }, RemoveScrollBar = function(_a) {
    var noRelative = _a.noRelative, noImportant = _a.noImportant, _b = _a.gapMode, gapMode = _b === void 0 ? "margin" : _b;
    useLockAttribute();
    var gap = React21.useMemo(function() {
      return getGapWidth(gapMode);
    }, [gapMode]);
    return React21.createElement(Style, { styles: getStyles(gap, !noRelative, gapMode, noImportant ? "" : "!important") });
  };

  // ../../node_modules/react-remove-scroll/dist/es2015/aggresiveCapture.js
  var passiveSupported = !1;
  if (typeof window < "u")
    try {
      options = Object.defineProperty({}, "passive", {
        get: function() {
          return passiveSupported = !0, !0;
        }
      }), window.addEventListener("test", options, options), window.removeEventListener("test", options, options);
    } catch {
      passiveSupported = !1;
    }
  var options, nonPassive = passiveSupported ? { passive: !1 } : !1;

  // ../../node_modules/react-remove-scroll/dist/es2015/handleScroll.js
  var alwaysContainsScroll = function(node) {
    return node.tagName === "TEXTAREA";
  }, elementCanBeScrolled = function(node, overflow) {
    if (!(node instanceof Element))
      return !1;
    var styles = window.getComputedStyle(node);
    return (
      // not-not-scrollable
      styles[overflow] !== "hidden" && // contains scroll inside self
      !(styles.overflowY === styles.overflowX && !alwaysContainsScroll(node) && styles[overflow] === "visible")
    );
  }, elementCouldBeVScrolled = function(node) {
    return elementCanBeScrolled(node, "overflowY");
  }, elementCouldBeHScrolled = function(node) {
    return elementCanBeScrolled(node, "overflowX");
  }, locationCouldBeScrolled = function(axis, node) {
    var ownerDocument = node.ownerDocument, current = node;
    do {
      typeof ShadowRoot < "u" && current instanceof ShadowRoot && (current = current.host);
      var isScrollable = elementCouldBeScrolled(axis, current);
      if (isScrollable) {
        var _a = getScrollVariables(axis, current), scrollHeight = _a[1], clientHeight = _a[2];
        if (scrollHeight > clientHeight)
          return !0;
      }
      current = current.parentNode;
    } while (current && current !== ownerDocument.body);
    return !1;
  }, getVScrollVariables = function(_a) {
    var scrollTop = _a.scrollTop, scrollHeight = _a.scrollHeight, clientHeight = _a.clientHeight;
    return [
      scrollTop,
      scrollHeight,
      clientHeight
    ];
  }, getHScrollVariables = function(_a) {
    var scrollLeft = _a.scrollLeft, scrollWidth = _a.scrollWidth, clientWidth = _a.clientWidth;
    return [
      scrollLeft,
      scrollWidth,
      clientWidth
    ];
  }, elementCouldBeScrolled = function(axis, node) {
    return axis === "v" ? elementCouldBeVScrolled(node) : elementCouldBeHScrolled(node);
  }, getScrollVariables = function(axis, node) {
    return axis === "v" ? getVScrollVariables(node) : getHScrollVariables(node);
  }, getDirectionFactor = function(axis, direction) {
    return axis === "h" && direction === "rtl" ? -1 : 1;
  }, handleScroll = function(axis, endTarget, event, sourceDelta, noOverscroll) {
    var directionFactor = getDirectionFactor(axis, window.getComputedStyle(endTarget).direction), delta = directionFactor * sourceDelta, target = event.target, targetInLock = endTarget.contains(target), shouldCancelScroll = !1, isDeltaPositive = delta > 0, availableScroll = 0, availableScrollTop = 0;
    do {
      if (!target)
        break;
      var _a = getScrollVariables(axis, target), position = _a[0], scroll_1 = _a[1], capacity = _a[2], elementScroll = scroll_1 - capacity - directionFactor * position;
      (position || elementScroll) && elementCouldBeScrolled(axis, target) && (availableScroll += elementScroll, availableScrollTop += position);
      var parent_1 = target.parentNode;
      target = parent_1 && parent_1.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? parent_1.host : parent_1;
    } while (
      // portaled content
      !targetInLock && target !== document.body || // self content
      targetInLock && (endTarget.contains(target) || endTarget === target)
    );
    return (isDeltaPositive && (noOverscroll && Math.abs(availableScroll) < 1 || !noOverscroll && delta > availableScroll) || !isDeltaPositive && (noOverscroll && Math.abs(availableScrollTop) < 1 || !noOverscroll && -delta > availableScrollTop)) && (shouldCancelScroll = !0), shouldCancelScroll;
  };

  // ../../node_modules/react-remove-scroll/dist/es2015/SideEffect.js
  var getTouchXY = function(event) {
    return "changedTouches" in event ? [event.changedTouches[0].clientX, event.changedTouches[0].clientY] : [0, 0];
  }, getDeltaXY = function(event) {
    return [event.deltaX, event.deltaY];
  }, extractRef = function(ref) {
    return ref && "current" in ref ? ref.current : ref;
  }, deltaCompare = function(x, y) {
    return x[0] === y[0] && x[1] === y[1];
  }, generateStyle = function(id) {
    return `
  .block-interactivity-`.concat(id, ` {pointer-events: none;}
  .allow-interactivity-`).concat(id, ` {pointer-events: all;}
`);
  }, idCounter = 0, lockStack = [];
  function RemoveScrollSideCar(props) {
    var shouldPreventQueue = React25.useRef([]), touchStartRef = React25.useRef([0, 0]), activeAxis = React25.useRef(), id = React25.useState(idCounter++)[0], Style2 = React25.useState(styleSingleton)[0], lastProps = React25.useRef(props);
    React25.useEffect(function() {
      lastProps.current = props;
    }, [props]), React25.useEffect(function() {
      if (props.inert) {
        document.body.classList.add("block-interactivity-".concat(id));
        var allow_1 = __spreadArray([props.lockRef.current], (props.shards || []).map(extractRef), !0).filter(Boolean);
        return allow_1.forEach(function(el) {
          return el.classList.add("allow-interactivity-".concat(id));
        }), function() {
          document.body.classList.remove("block-interactivity-".concat(id)), allow_1.forEach(function(el) {
            return el.classList.remove("allow-interactivity-".concat(id));
          });
        };
      }
    }, [props.inert, props.lockRef.current, props.shards]);
    var shouldCancelEvent = React25.useCallback(function(event, parent2) {
      if ("touches" in event && event.touches.length === 2 || event.type === "wheel" && event.ctrlKey)
        return !lastProps.current.allowPinchZoom;
      var touch = getTouchXY(event), touchStart = touchStartRef.current, deltaX = "deltaX" in event ? event.deltaX : touchStart[0] - touch[0], deltaY = "deltaY" in event ? event.deltaY : touchStart[1] - touch[1], currentAxis, target = event.target, moveDirection = Math.abs(deltaX) > Math.abs(deltaY) ? "h" : "v";
      if ("touches" in event && moveDirection === "h" && target.type === "range")
        return !1;
      var selection = window.getSelection(), anchorNode = selection && selection.anchorNode, isTouchingSelection = anchorNode ? anchorNode === target || anchorNode.contains(target) : !1;
      if (isTouchingSelection)
        return !1;
      var canBeScrolledInMainDirection = locationCouldBeScrolled(moveDirection, target);
      if (!canBeScrolledInMainDirection)
        return !0;
      if (canBeScrolledInMainDirection ? currentAxis = moveDirection : (currentAxis = moveDirection === "v" ? "h" : "v", canBeScrolledInMainDirection = locationCouldBeScrolled(moveDirection, target)), !canBeScrolledInMainDirection)
        return !1;
      if (!activeAxis.current && "changedTouches" in event && (deltaX || deltaY) && (activeAxis.current = currentAxis), !currentAxis)
        return !0;
      var cancelingAxis = activeAxis.current || currentAxis;
      return handleScroll(cancelingAxis, parent2, event, cancelingAxis === "h" ? deltaX : deltaY, !0);
    }, []), shouldPrevent = React25.useCallback(function(_event) {
      var event = _event;
      if (!(!lockStack.length || lockStack[lockStack.length - 1] !== Style2)) {
        var delta = "deltaY" in event ? getDeltaXY(event) : getTouchXY(event), sourceEvent = shouldPreventQueue.current.filter(function(e) {
          return e.name === event.type && (e.target === event.target || event.target === e.shadowParent) && deltaCompare(e.delta, delta);
        })[0];
        if (sourceEvent && sourceEvent.should) {
          event.cancelable && event.preventDefault();
          return;
        }
        if (!sourceEvent) {
          var shardNodes = (lastProps.current.shards || []).map(extractRef).filter(Boolean).filter(function(node) {
            return node.contains(event.target);
          }), shouldStop = shardNodes.length > 0 ? shouldCancelEvent(event, shardNodes[0]) : !lastProps.current.noIsolation;
          shouldStop && event.cancelable && event.preventDefault();
        }
      }
    }, []), shouldCancel = React25.useCallback(function(name, delta, target, should) {
      var event = { name, delta, target, should, shadowParent: getOutermostShadowParent(target) };
      shouldPreventQueue.current.push(event), setTimeout(function() {
        shouldPreventQueue.current = shouldPreventQueue.current.filter(function(e) {
          return e !== event;
        });
      }, 1);
    }, []), scrollTouchStart = React25.useCallback(function(event) {
      touchStartRef.current = getTouchXY(event), activeAxis.current = void 0;
    }, []), scrollWheel = React25.useCallback(function(event) {
      shouldCancel(event.type, getDeltaXY(event), event.target, shouldCancelEvent(event, props.lockRef.current));
    }, []), scrollTouchMove = React25.useCallback(function(event) {
      shouldCancel(event.type, getTouchXY(event), event.target, shouldCancelEvent(event, props.lockRef.current));
    }, []);
    React25.useEffect(function() {
      return lockStack.push(Style2), props.setCallbacks({
        onScrollCapture: scrollWheel,
        onWheelCapture: scrollWheel,
        onTouchMoveCapture: scrollTouchMove
      }), document.addEventListener("wheel", shouldPrevent, nonPassive), document.addEventListener("touchmove", shouldPrevent, nonPassive), document.addEventListener("touchstart", scrollTouchStart, nonPassive), function() {
        lockStack = lockStack.filter(function(inst) {
          return inst !== Style2;
        }), document.removeEventListener("wheel", shouldPrevent, nonPassive), document.removeEventListener("touchmove", shouldPrevent, nonPassive), document.removeEventListener("touchstart", scrollTouchStart, nonPassive);
      };
    }, []);
    var removeScrollBar = props.removeScrollBar, inert = props.inert;
    return React25.createElement(
      React25.Fragment,
      null,
      inert ? React25.createElement(Style2, { styles: generateStyle(id) }) : null,
      removeScrollBar ? React25.createElement(RemoveScrollBar, { noRelative: props.noRelative, gapMode: props.gapMode }) : null
    );
  }
  function getOutermostShadowParent(node) {
    for (var shadowParent = null; node !== null; )
      node instanceof ShadowRoot && (shadowParent = node.host, node = node.host), node = node.parentNode;
    return shadowParent;
  }

  // ../../node_modules/react-remove-scroll/dist/es2015/sidecar.js
  var sidecar_default = exportSidecar(effectCar, RemoveScrollSideCar);

  // ../../node_modules/react-remove-scroll/dist/es2015/Combination.js
  var ReactRemoveScroll = React26.forwardRef(function(props, ref) {
    return React26.createElement(RemoveScroll, __assign({}, props, { ref, sideCar: sidecar_default }));
  });
  ReactRemoveScroll.classNames = RemoveScroll.classNames;
  var Combination_default = ReactRemoveScroll;

  // ../../node_modules/aria-hidden/dist/es2015/index.js
  var getDefaultParent = function(originalTarget) {
    if (typeof document > "u")
      return null;
    var sampleTarget = Array.isArray(originalTarget) ? originalTarget[0] : originalTarget;
    return sampleTarget.ownerDocument.body;
  }, counterMap = /* @__PURE__ */ new WeakMap(), uncontrolledNodes = /* @__PURE__ */ new WeakMap(), markerMap = {}, lockCount = 0, unwrapHost = function(node) {
    return node && (node.host || unwrapHost(node.parentNode));
  }, correctTargets = function(parent2, targets) {
    return targets.map(function(target) {
      if (parent2.contains(target))
        return target;
      var correctedTarget = unwrapHost(target);
      return correctedTarget && parent2.contains(correctedTarget) ? correctedTarget : (console.error("aria-hidden", target, "in not contained inside", parent2, ". Doing nothing"), null);
    }).filter(function(x) {
      return !!x;
    });
  }, applyAttributeToOthers = function(originalTarget, parentNode, markerName, controlAttribute) {
    var targets = correctTargets(parentNode, Array.isArray(originalTarget) ? originalTarget : [originalTarget]);
    markerMap[markerName] || (markerMap[markerName] = /* @__PURE__ */ new WeakMap());
    var markerCounter = markerMap[markerName], hiddenNodes = [], elementsToKeep = /* @__PURE__ */ new Set(), elementsToStop = new Set(targets), keep = function(el) {
      !el || elementsToKeep.has(el) || (elementsToKeep.add(el), keep(el.parentNode));
    };
    targets.forEach(keep);
    var deep = function(parent2) {
      !parent2 || elementsToStop.has(parent2) || Array.prototype.forEach.call(parent2.children, function(node) {
        if (elementsToKeep.has(node))
          deep(node);
        else
          try {
            var attr = node.getAttribute(controlAttribute), alreadyHidden = attr !== null && attr !== "false", counterValue = (counterMap.get(node) || 0) + 1, markerValue = (markerCounter.get(node) || 0) + 1;
            counterMap.set(node, counterValue), markerCounter.set(node, markerValue), hiddenNodes.push(node), counterValue === 1 && alreadyHidden && uncontrolledNodes.set(node, !0), markerValue === 1 && node.setAttribute(markerName, "true"), alreadyHidden || node.setAttribute(controlAttribute, "true");
          } catch (e) {
            console.error("aria-hidden: cannot operate on ", node, e);
          }
      });
    };
    return deep(parentNode), elementsToKeep.clear(), lockCount++, function() {
      hiddenNodes.forEach(function(node) {
        var counterValue = counterMap.get(node) - 1, markerValue = markerCounter.get(node) - 1;
        counterMap.set(node, counterValue), markerCounter.set(node, markerValue), counterValue || (uncontrolledNodes.has(node) || node.removeAttribute(controlAttribute), uncontrolledNodes.delete(node)), markerValue || node.removeAttribute(markerName);
      }), lockCount--, lockCount || (counterMap = /* @__PURE__ */ new WeakMap(), counterMap = /* @__PURE__ */ new WeakMap(), uncontrolledNodes = /* @__PURE__ */ new WeakMap(), markerMap = {});
    };
  }, hideOthers = function(originalTarget, parentNode, markerName) {
    markerName === void 0 && (markerName = "data-aria-hidden");
    var targets = Array.from(Array.isArray(originalTarget) ? originalTarget : [originalTarget]), activeParentNode = parentNode || getDefaultParent(originalTarget);
    return activeParentNode ? (targets.push.apply(targets, Array.from(activeParentNode.querySelectorAll("[aria-live], script"))), applyAttributeToOthers(targets, activeParentNode, markerName, "aria-hidden")) : function() {
      return null;
    };
  };

  // ../../node_modules/@radix-ui/react-dialog/dist/index.mjs
  var import_jsx_runtime9 = __toESM(require_jsx_runtime(), 1), __defProp18 = Object.defineProperty, __name17 = (target, value) => __defProp18(target, "name", { value, configurable: !0 }), DIALOG_NAME = "Dialog", [createDialogContext, createDialogScope] = createContextScope(DIALOG_NAME), [DialogProvider, useDialogContext] = createDialogContext(DIALOG_NAME), Dialog = /* @__PURE__ */ __name17((props) => {
    let {
      __scopeDialog,
      children,
      open: openProp,
      defaultOpen,
      onOpenChange,
      modal = !0
    } = props, triggerRef = React27.useRef(null), contentRef = React27.useRef(null), { nodes: branchNodes, registry: branchRegistry } = useFocusScopeBranchRegistry(), [open, setOpen] = useControllableState({
      prop: openProp,
      defaultProp: defaultOpen ?? !1,
      onChange: onOpenChange,
      caller: DIALOG_NAME
    }), [titleCount, setTitleCount] = React27.useState(0), [descriptionCount, setDescriptionCount] = React27.useState(0);
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      DialogProvider,
      {
        scope: __scopeDialog,
        triggerRef,
        contentRef,
        contentId: useId(),
        titleId: useId(),
        descriptionId: useId(),
        titlePresent: titleCount > 0,
        descriptionPresent: descriptionCount > 0,
        setTitleCount,
        setDescriptionCount,
        open,
        onOpenChange: setOpen,
        onOpenToggle: React27.useCallback(() => setOpen((prevOpen) => !prevOpen), [setOpen]),
        modal,
        branchNodes,
        branchRegistry,
        children
      }
    );
  }, "Dialog"), TRIGGER_NAME = "DialogTrigger", DialogTrigger = /* @__PURE__ */ React27.forwardRef(
    /* @__PURE__ */ __name17(function(props, forwardedRef) {
      let { __scopeDialog, ...triggerProps } = props, context = useDialogContext(TRIGGER_NAME, __scopeDialog), composedTriggerRef = useComposedRefs(forwardedRef, context.triggerRef);
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        Primitive.button,
        {
          type: "button",
          "aria-haspopup": "dialog",
          "aria-expanded": context.open,
          "aria-controls": context.open ? context.contentId : void 0,
          "data-state": getState(context.open),
          ...triggerProps,
          ref: composedTriggerRef,
          onClick: composeEventHandlers(props.onClick, context.onOpenToggle)
        }
      );
    }, "DialogTrigger")
  ), PORTAL_NAME = "DialogPortal", [PortalProvider, usePortalContext] = createDialogContext(PORTAL_NAME, {
    forceMount: void 0
  }), DialogPortal = /* @__PURE__ */ __name17((props) => {
    let { __scopeDialog, forceMount, children, container } = props, context = useDialogContext(PORTAL_NAME, __scopeDialog);
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(PortalProvider, { scope: __scopeDialog, forceMount, children: React27.Children.map(children, (child) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Presence, { present: forceMount || context.open, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Portal, { asChild: !0, container, children: child }) })) });
  }, "DialogPortal"), OVERLAY_NAME = "DialogOverlay", DialogOverlay = /* @__PURE__ */ React27.forwardRef(
    /* @__PURE__ */ __name17(function(props, forwardedRef) {
      let portalContext = usePortalContext(OVERLAY_NAME, props.__scopeDialog), { forceMount = portalContext.forceMount, ...overlayProps } = props, context = useDialogContext(OVERLAY_NAME, props.__scopeDialog);
      return context.modal ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Presence, { present: forceMount || context.open, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(DialogOverlayImpl, { ...overlayProps, ref: forwardedRef }) }) : null;
    }, "DialogOverlay")
  ), Slot = createSlot("DialogOverlay.RemoveScroll"), DialogOverlayImpl = /* @__PURE__ */ React27.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name17(function(props, forwardedRef) {
      let { __scopeDialog, ...overlayProps } = props, context = useDialogContext(OVERLAY_NAME, __scopeDialog), registerDismissableSurface = useDismissableLayerSurface(), composedRefs = useComposedRefs(forwardedRef, registerDismissableSurface);
      return (
        // Make sure `Content` is scrollable even when it doesn't live inside
        // `RemoveScroll` (eg. when `Overlay` and `Content` are siblings). Nested
        // layers are registered as branches and added as shards so they remain
        // scrollable too. See https://github.com/radix-ui/primitives/issues/3423
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          Combination_default,
          {
            as: Slot,
            allowPinchZoom: !0,
            shards: React27.useMemo(
              () => [context.contentRef, ...context.branchNodes.map((node) => ({ current: node }))],
              [context.contentRef, context.branchNodes]
            ),
            children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
              Primitive.div,
              {
                "data-state": getState(context.open),
                ...overlayProps,
                ref: composedRefs,
                style: { pointerEvents: "auto", ...overlayProps.style }
              }
            )
          }
        )
      );
    }, "DialogOverlayImpl")
  ), CONTENT_NAME = "DialogContent", DialogContent = /* @__PURE__ */ React27.forwardRef(
    /* @__PURE__ */ __name17(function(props, forwardedRef) {
      let portalContext = usePortalContext(CONTENT_NAME, props.__scopeDialog), { forceMount = portalContext.forceMount, ...contentProps } = props, context = useDialogContext(CONTENT_NAME, props.__scopeDialog);
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Presence, { present: forceMount || context.open, children: context.modal ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(DialogContentModal, { ...contentProps, ref: forwardedRef }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(DialogContentNonModal, { ...contentProps, ref: forwardedRef }) });
    }, "DialogContent")
  ), DialogContentModal = /* @__PURE__ */ React27.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name17(function(props, forwardedRef) {
      let context = useDialogContext(CONTENT_NAME, props.__scopeDialog), contentRef = React27.useRef(null), composedRefs = useComposedRefs(forwardedRef, context.contentRef, contentRef);
      return React27.useEffect(() => {
        let content = contentRef.current;
        if (content) return hideOthers(content);
      }, []), /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        DialogContentImpl,
        {
          ...props,
          ref: composedRefs,
          trapFocus: context.open,
          disableOutsidePointerEvents: context.open,
          onCloseAutoFocus: composeEventHandlers(props.onCloseAutoFocus, (event) => {
            event.preventDefault(), context.triggerRef.current?.focus();
          }),
          onPointerDownOutside: composeEventHandlers(props.onPointerDownOutside, (event) => {
            let originalEvent = event.detail.originalEvent, ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === !0;
            (originalEvent.button === 2 || ctrlLeftClick) && event.preventDefault();
          }),
          onFocusOutside: composeEventHandlers(
            props.onFocusOutside,
            (event) => event.preventDefault()
          )
        }
      );
    }, "DialogContentModal")
  ), DialogContentNonModal = /* @__PURE__ */ React27.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name17(function(props, forwardedRef) {
      let context = useDialogContext(CONTENT_NAME, props.__scopeDialog), hasInteractedOutsideRef = React27.useRef(!1), hasPointerDownOutsideRef = React27.useRef(!1);
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        DialogContentImpl,
        {
          ...props,
          ref: forwardedRef,
          trapFocus: !1,
          disableOutsidePointerEvents: !1,
          onCloseAutoFocus: (event) => {
            props.onCloseAutoFocus?.(event), event.defaultPrevented || (hasInteractedOutsideRef.current || context.triggerRef.current?.focus(), event.preventDefault()), hasInteractedOutsideRef.current = !1, hasPointerDownOutsideRef.current = !1;
          },
          onInteractOutside: (event) => {
            props.onInteractOutside?.(event), event.defaultPrevented || (hasInteractedOutsideRef.current = !0, event.detail.originalEvent.type === "pointerdown" && (hasPointerDownOutsideRef.current = !0));
            let target = event.target;
            context.triggerRef.current?.contains(target) && event.preventDefault(), event.detail.originalEvent.type === "focusin" && hasPointerDownOutsideRef.current && event.preventDefault();
          }
        }
      );
    }, "DialogContentNonModal")
  ), DialogContentImpl = /* @__PURE__ */ React27.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name17(function(props, forwardedRef) {
      let {
        __scopeDialog,
        trapFocus,
        onOpenAutoFocus,
        onCloseAutoFocus,
        "aria-describedby": ariaDescribedby,
        children,
        ...contentProps
      } = props, context = useDialogContext(CONTENT_NAME, __scopeDialog);
      return useFocusGuards(), /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(FocusScopeBranchProvider, { registry: context.branchRegistry, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        FocusScope,
        {
          asChild: !0,
          loop: !0,
          trapped: trapFocus,
          branches: context.branchNodes,
          onMountAutoFocus: onOpenAutoFocus,
          onUnmountAutoFocus: onCloseAutoFocus,
          children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            DismissableLayer,
            {
              role: "dialog",
              id: context.contentId,
              "aria-labelledby": context.titlePresent ? context.titleId : void 0,
              "aria-describedby": context.descriptionPresent ? concatAriaDescribedby2(ariaDescribedby, context.descriptionId) : ariaDescribedby,
              "data-state": getState(context.open),
              ...contentProps,
              ref: forwardedRef,
              deferPointerDownOutside: !0,
              onDismiss: () => context.onOpenChange(!1),
              children
            }
          )
        }
      ) });
    }, "DialogContentImpl")
  ), DialogTitle = /* @__PURE__ */ React27.forwardRef(
    /* @__PURE__ */ __name17(function(props, forwardedRef) {
      let { __scopeDialog, ...titleProps } = props, context = useDialogContext("DialogTitle", __scopeDialog), { setTitleCount } = context;
      return useLayoutEffect2(() => (setTitleCount((count3) => count3 + 1), () => setTitleCount((count3) => count3 - 1)), [setTitleCount]), /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Primitive.h2, { id: context.titleId, ...titleProps, ref: forwardedRef });
    }, "DialogTitle")
  ), DialogDescription = /* @__PURE__ */ React27.forwardRef(
    // blank line to reduce diff noise
    /* @__PURE__ */ __name17(function(props, forwardedRef) {
      let { __scopeDialog, ...descriptionProps } = props, context = useDialogContext("DialogDescription", __scopeDialog), { setDescriptionCount } = context;
      return useLayoutEffect2(() => (setDescriptionCount((count3) => count3 + 1), () => setDescriptionCount((count3) => count3 - 1)), [setDescriptionCount]), /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Primitive.p, { id: context.descriptionId, ...descriptionProps, ref: forwardedRef });
    }, "DialogDescription")
  ), CLOSE_NAME = "DialogClose", DialogClose = /* @__PURE__ */ React27.forwardRef(
    /* @__PURE__ */ __name17(function(props, forwardedRef) {
      let { __scopeDialog, ...closeProps } = props, context = useDialogContext(CLOSE_NAME, __scopeDialog);
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        Primitive.button,
        {
          type: "button",
          ...closeProps,
          ref: forwardedRef,
          onClick: composeEventHandlers(props.onClick, () => context.onOpenChange(!1))
        }
      );
    }, "DialogClose")
  ), WarningProvider = /* @__PURE__ */ __name17((props) => props.children, "WarningProvider");
  function concatAriaDescribedby2(...values) {
    let ids = /* @__PURE__ */ new Set();
    for (let value of values)
      if (typeof value == "string")
        for (let id of String(value).trim().split(/\s+/))
          id && ids.add(id);
    return ids.size > 0 ? Array.from(ids).join(" ") : void 0;
  }
  __name17(concatAriaDescribedby2, "concatAriaDescribedby");
  function getState(open) {
    return open ? "open" : "closed";
  }
  __name17(getState, "getState");

  // ../../node_modules/@radix-ui/react-use-size/dist/index.mjs
  var React28 = __toESM(require_react(), 1);
  var __defProp19 = Object.defineProperty, __name18 = (target, value) => __defProp19(target, "name", { value, configurable: !0 });
  function useSize(element) {
    let [size4, setSize] = React28.useState(void 0);
    return useLayoutEffect2(() => {
      if (element) {
        setSize({ width: element.offsetWidth, height: element.offsetHeight });
        let rAF = 0, resizeObserver = new ResizeObserver((entries) => {
          if (!Array.isArray(entries) || !entries.length)
            return;
          let entry = entries[0];
          window.cancelAnimationFrame(rAF), rAF = window.requestAnimationFrame(() => {
            let width, height;
            if ("borderBoxSize" in entry) {
              let borderSizeEntry = entry.borderBoxSize, borderSize = Array.isArray(borderSizeEntry) ? borderSizeEntry[0] : borderSizeEntry;
              width = borderSize.inlineSize, height = borderSize.blockSize;
            } else
              width = element.offsetWidth, height = element.offsetHeight;
            setSize({ width, height });
          });
        });
        return resizeObserver.observe(element, { box: "border-box" }), () => {
          window.cancelAnimationFrame(rAF), resizeObserver.unobserve(element);
        };
      } else
        setSize(void 0);
    }, [element]), size4;
  }
  __name18(useSize, "useSize");

  // ../../node_modules/@radix-ui/react-menu/dist/index.mjs
  var React34 = __toESM(require_react(), 1);

  // ../../node_modules/@radix-ui/react-popper/dist/index.mjs
  var React31 = __toESM(require_react(), 1);

  // ../../node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
  var sides = ["top", "right", "bottom", "left"];
  var min = Math.min, max = Math.max, round = Math.round, floor = Math.floor, createCoords = (v) => ({
    x: v,
    y: v
  }), oppositeSideMap = {
    left: "right",
    right: "left",
    bottom: "top",
    top: "bottom"
  };
  function clamp(start2, value, end) {
    return max(start2, min(value, end));
  }
  function evaluate(value, param) {
    return typeof value == "function" ? value(param) : value;
  }
  function getSide(placement) {
    return placement.split("-")[0];
  }
  function getAlignment(placement) {
    return placement.split("-")[1];
  }
  function getOppositeAxis(axis) {
    return axis === "x" ? "y" : "x";
  }
  function getAxisLength(axis) {
    return axis === "y" ? "height" : "width";
  }
  function getSideAxis(placement) {
    let firstChar = placement[0];
    return firstChar === "t" || firstChar === "b" ? "y" : "x";
  }
  function getAlignmentAxis(placement) {
    return getOppositeAxis(getSideAxis(placement));
  }
  function getAlignmentSides(placement, rects, rtl) {
    rtl === void 0 && (rtl = !1);
    let alignment = getAlignment(placement), alignmentAxis = getAlignmentAxis(placement), length = getAxisLength(alignmentAxis), mainAlignmentSide = alignmentAxis === "x" ? alignment === (rtl ? "end" : "start") ? "right" : "left" : alignment === "start" ? "bottom" : "top";
    return rects.reference[length] > rects.floating[length] && (mainAlignmentSide = getOppositePlacement(mainAlignmentSide)), [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
  }
  function getExpandedPlacements(placement) {
    let oppositePlacement = getOppositePlacement(placement);
    return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
  }
  function getOppositeAlignmentPlacement(placement) {
    return placement.includes("start") ? placement.replace("start", "end") : placement.replace("end", "start");
  }
  var lrPlacement = ["left", "right"], rlPlacement = ["right", "left"], tbPlacement = ["top", "bottom"], btPlacement = ["bottom", "top"];
  function getSideList(side, isStart, rtl) {
    switch (side) {
      case "top":
      case "bottom":
        return rtl ? isStart ? rlPlacement : lrPlacement : isStart ? lrPlacement : rlPlacement;
      case "left":
      case "right":
        return isStart ? tbPlacement : btPlacement;
      default:
        return [];
    }
  }
  function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
    let alignment = getAlignment(placement), list = getSideList(getSide(placement), direction === "start", rtl);
    return alignment && (list = list.map((side) => side + "-" + alignment), flipAlignment && (list = list.concat(list.map(getOppositeAlignmentPlacement)))), list;
  }
  function getOppositePlacement(placement) {
    let side = getSide(placement);
    return oppositeSideMap[side] + placement.slice(side.length);
  }
  function expandPaddingObject(padding) {
    var _padding$top, _padding$right, _padding$bottom, _padding$left;
    return {
      top: (_padding$top = padding.top) != null ? _padding$top : 0,
      right: (_padding$right = padding.right) != null ? _padding$right : 0,
      bottom: (_padding$bottom = padding.bottom) != null ? _padding$bottom : 0,
      left: (_padding$left = padding.left) != null ? _padding$left : 0
    };
  }
  function getPaddingObject(padding) {
    return typeof padding != "number" ? expandPaddingObject(padding) : {
      top: padding,
      right: padding,
      bottom: padding,
      left: padding
    };
  }
  function rectToClientRect(rect2) {
    let {
      x,
      y,
      width,
      height
    } = rect2;
    return {
      width,
      height,
      top: y,
      left: x,
      right: x + width,
      bottom: y + height,
      x,
      y
    };
  }

  // ../../node_modules/@floating-ui/core/dist/floating-ui.core.mjs
  function computeCoordsFromPlacement(_ref, placement, rtl) {
    let {
      reference,
      floating
    } = _ref, sideAxis = getSideAxis(placement), alignmentAxis = getAlignmentAxis(placement), alignLength = getAxisLength(alignmentAxis), side = getSide(placement), isVertical = sideAxis === "y", commonX = reference.x + reference.width / 2 - floating.width / 2, commonY = reference.y + reference.height / 2 - floating.height / 2, commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2, coords;
    switch (side) {
      case "top":
        coords = {
          x: commonX,
          y: reference.y - floating.height
        };
        break;
      case "bottom":
        coords = {
          x: commonX,
          y: reference.y + reference.height
        };
        break;
      case "right":
        coords = {
          x: reference.x + reference.width,
          y: commonY
        };
        break;
      case "left":
        coords = {
          x: reference.x - floating.width,
          y: commonY
        };
        break;
      default:
        coords = {
          x: reference.x,
          y: reference.y
        };
    }
    let alignment = getAlignment(placement);
    return alignment && (coords[alignmentAxis] += commonAlign * (alignment === "end" ? 1 : -1) * (rtl && isVertical ? -1 : 1)), coords;
  }
  async function detectOverflow(state, options2) {
    var _await$platform$isEle;
    options2 === void 0 && (options2 = {});
    let {
      x,
      y,
      platform: platform2,
      rects,
      elements,
      strategy
    } = state, {
      boundary = "clippingAncestors",
      rootBoundary = "viewport",
      elementContext = "floating",
      altBoundary = !1,
      padding = 0
    } = evaluate(options2, state), paddingObject = getPaddingObject(padding), element = elements[altBoundary ? elementContext === "floating" ? "reference" : "floating" : elementContext], clippingClientRect = rectToClientRect(await platform2.getClippingRect({
      element: (_await$platform$isEle = await (platform2.isElement == null ? void 0 : platform2.isElement(element))) == null || _await$platform$isEle ? element : element.contextElement || await (platform2.getDocumentElement == null ? void 0 : platform2.getDocumentElement(elements.floating)),
      boundary,
      rootBoundary,
      strategy
    })), rect2 = elementContext === "floating" ? {
      x,
      y,
      width: rects.floating.width,
      height: rects.floating.height
    } : rects.reference, offsetParent = await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(elements.floating)), offsetScale = await (platform2.isElement == null ? void 0 : platform2.isElement(offsetParent)) && await (platform2.getScale == null ? void 0 : platform2.getScale(offsetParent)) || {
      x: 1,
      y: 1
    }, elementClientRect = rectToClientRect(platform2.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform2.convertOffsetParentRelativeRectToViewportRelativeRect({
      elements,
      rect: rect2,
      offsetParent,
      strategy
    }) : rect2);
    return {
      top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
      bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
      left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
      right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
    };
  }
  var MAX_RESET_COUNT = 50, computePosition = async (reference, floating, config) => {
    let {
      placement = "bottom",
      strategy = "absolute",
      middleware = [],
      platform: platform2
    } = config, platformWithDetectOverflow = platform2.detectOverflow ? platform2 : {
      ...platform2,
      detectOverflow
    }, rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(floating)), rects = await platform2.getElementRects({
      reference,
      floating,
      strategy
    }), {
      x,
      y
    } = computeCoordsFromPlacement(rects, placement, rtl), statefulPlacement = placement, resetCount = 0, middlewareData = {};
    for (let i = 0; i < middleware.length; i++) {
      let currentMiddleware = middleware[i];
      if (!currentMiddleware)
        continue;
      let {
        name,
        fn
      } = currentMiddleware, {
        x: nextX,
        y: nextY,
        data,
        reset
      } = await fn({
        x,
        y,
        initialPlacement: placement,
        placement: statefulPlacement,
        strategy,
        middlewareData,
        rects,
        platform: platformWithDetectOverflow,
        elements: {
          reference,
          floating
        }
      });
      x = nextX ?? x, y = nextY ?? y, middlewareData[name] = {
        ...middlewareData[name],
        ...data
      }, reset && resetCount < MAX_RESET_COUNT && (resetCount++, typeof reset == "object" && (reset.placement && (statefulPlacement = reset.placement), reset.rects && (rects = reset.rects === !0 ? await platform2.getElementRects({
        reference,
        floating,
        strategy
      }) : reset.rects), {
        x,
        y
      } = computeCoordsFromPlacement(rects, statefulPlacement, rtl)), i = -1);
    }
    return {
      x,
      y,
      placement: statefulPlacement,
      strategy,
      middlewareData
    };
  }, arrow = (options2) => ({
    name: "arrow",
    options: options2,
    async fn(state) {
      let {
        x,
        y,
        placement,
        rects,
        platform: platform2,
        elements,
        middlewareData
      } = state, {
        element,
        padding = 0
      } = evaluate(options2, state) || {};
      if (element == null)
        return {};
      let paddingObject = getPaddingObject(padding), coords = {
        x,
        y
      }, axis = getAlignmentAxis(placement), length = getAxisLength(axis), arrowDimensions = await platform2.getDimensions(element), isYAxis = axis === "y", minProp = isYAxis ? "top" : "left", maxProp = isYAxis ? "bottom" : "right", clientProp = isYAxis ? "clientHeight" : "clientWidth", endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length], startDiff = coords[axis] - rects.reference[axis], arrowOffsetParent = await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(element)), clientSize = arrowOffsetParent ? arrowOffsetParent[clientProp] : 0;
      (!clientSize || !await (platform2.isElement == null ? void 0 : platform2.isElement(arrowOffsetParent))) && (clientSize = elements.floating[clientProp] || rects.floating[length]);
      let centerToReference = endDiff / 2 - startDiff / 2, largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1, minPadding = min(paddingObject[minProp], largestPossiblePadding), maxPadding = min(paddingObject[maxProp], largestPossiblePadding), max2 = clientSize - arrowDimensions[length] - maxPadding, center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference, offset4 = clamp(minPadding, center, max2), shouldAddOffset = !middlewareData.arrow && getAlignment(placement) != null && center !== offset4 && rects.reference[length] / 2 - (center < minPadding ? minPadding : maxPadding) - arrowDimensions[length] / 2 < 0, alignmentOffset = shouldAddOffset ? center < minPadding ? center - minPadding : center - max2 : 0;
      return {
        [axis]: coords[axis] + alignmentOffset,
        data: {
          [axis]: offset4,
          centerOffset: center - offset4 - alignmentOffset,
          ...shouldAddOffset && {
            alignmentOffset
          }
        },
        reset: shouldAddOffset
      };
    }
  });
  var flip = function(options2) {
    return options2 === void 0 && (options2 = {}), {
      name: "flip",
      options: options2,
      async fn(state) {
        var _middlewareData$arrow, _middlewareData$flip;
        let {
          placement,
          middlewareData,
          rects,
          initialPlacement,
          platform: platform2,
          elements
        } = state, {
          mainAxis: checkMainAxis = !0,
          crossAxis: checkCrossAxis = !0,
          fallbackPlacements: specifiedFallbackPlacements,
          fallbackStrategy = "bestFit",
          fallbackAxisSideDirection = "none",
          flipAlignment = !0,
          ...detectOverflowOptions
        } = evaluate(options2, state);
        if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset)
          return {};
        let side = getSide(placement), initialSideAxis = getSideAxis(initialPlacement), isBasePlacement = getSide(initialPlacement) === initialPlacement, rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating)), fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement)), hasFallbackAxisSideDirection = fallbackAxisSideDirection !== "none";
        !specifiedFallbackPlacements && hasFallbackAxisSideDirection && fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
        let placements2 = [initialPlacement, ...fallbackPlacements], overflow = await platform2.detectOverflow(state, detectOverflowOptions), overflows = [], overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
        if (checkMainAxis && overflows.push(overflow[side]), checkCrossAxis) {
          let sides2 = getAlignmentSides(placement, rects, rtl);
          overflows.push(overflow[sides2[0]], overflow[sides2[1]]);
        }
        if (overflowsData = [...overflowsData, {
          placement,
          overflows
        }], !overflows.every((side2) => side2 <= 0)) {
          var _middlewareData$flip2, _overflowsData$filter;
          let nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1, nextPlacement = placements2[nextIndex];
          if (nextPlacement && (!(checkCrossAxis === "alignment" ? initialSideAxis !== getSideAxis(nextPlacement) : !1) || // We leave the current main axis only if every placement on that axis
          // overflows the main axis.
          overflowsData.every((d) => getSideAxis(d.placement) === initialSideAxis ? d.overflows[0] > 0 : !0)))
            return {
              data: {
                index: nextIndex,
                overflows: overflowsData
              },
              reset: {
                placement: nextPlacement
              }
            };
          let resetPlacement = (_overflowsData$filter = overflowsData.filter((d) => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;
          if (!resetPlacement)
            switch (fallbackStrategy) {
              case "bestFit": {
                var _overflowsData$filter2;
                let placement2 = (_overflowsData$filter2 = overflowsData.filter((d) => {
                  if (hasFallbackAxisSideDirection) {
                    let currentSideAxis = getSideAxis(d.placement);
                    return currentSideAxis === initialSideAxis || // Create a bias to the `y` side axis due to horizontal
                    // reading directions favoring greater width.
                    currentSideAxis === "y";
                  }
                  return !0;
                }).map((d) => [d.placement, d.overflows.filter((overflow2) => overflow2 > 0).reduce((acc, overflow2) => acc + overflow2, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$filter2[0];
                placement2 && (resetPlacement = placement2);
                break;
              }
              case "initialPlacement":
                resetPlacement = initialPlacement;
                break;
            }
          if (placement !== resetPlacement)
            return {
              reset: {
                placement: resetPlacement
              }
            };
        }
        return {};
      }
    };
  };
  function getSideOffsets(overflow, rect2) {
    return {
      top: overflow.top - rect2.height,
      right: overflow.right - rect2.width,
      bottom: overflow.bottom - rect2.height,
      left: overflow.left - rect2.width
    };
  }
  function isAnySideFullyClipped(overflow) {
    return sides.some((side) => overflow[side] >= 0);
  }
  var hide = function(options2) {
    return options2 === void 0 && (options2 = {}), {
      name: "hide",
      options: options2,
      async fn(state) {
        let {
          rects,
          platform: platform2
        } = state, {
          strategy = "referenceHidden",
          ...detectOverflowOptions
        } = evaluate(options2, state);
        switch (strategy) {
          case "referenceHidden": {
            let overflow = await platform2.detectOverflow(state, {
              ...detectOverflowOptions,
              elementContext: "reference"
            }), offsets = getSideOffsets(overflow, rects.reference);
            return {
              data: {
                referenceHiddenOffsets: offsets,
                referenceHidden: isAnySideFullyClipped(offsets)
              }
            };
          }
          case "escaped": {
            let overflow = await platform2.detectOverflow(state, {
              ...detectOverflowOptions,
              altBoundary: !0
            }), offsets = getSideOffsets(overflow, rects.floating);
            return {
              data: {
                escapedOffsets: offsets,
                escaped: isAnySideFullyClipped(offsets)
              }
            };
          }
          default:
            return {};
        }
      }
    };
  };
  var originSides = /* @__PURE__ */ new Set(["left", "top"]);
  async function convertValueToCoords(state, options2) {
    let {
      placement,
      platform: platform2,
      elements
    } = state, rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating)), side = getSide(placement), alignment = getAlignment(placement), isVertical = getSideAxis(placement) === "y", mainAxisMulti = originSides.has(side) ? -1 : 1, crossAxisMulti = rtl && isVertical ? -1 : 1, rawValue = evaluate(options2, state), {
      mainAxis,
      crossAxis,
      alignmentAxis
    } = typeof rawValue == "number" ? {
      mainAxis: rawValue,
      crossAxis: 0,
      alignmentAxis: null
    } : {
      mainAxis: rawValue.mainAxis || 0,
      crossAxis: rawValue.crossAxis || 0,
      alignmentAxis: rawValue.alignmentAxis
    };
    return alignment && typeof alignmentAxis == "number" && (crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis), isVertical ? {
      x: crossAxis * crossAxisMulti,
      y: mainAxis * mainAxisMulti
    } : {
      x: mainAxis * mainAxisMulti,
      y: crossAxis * crossAxisMulti
    };
  }
  var offset = function(options2) {
    return options2 === void 0 && (options2 = 0), {
      name: "offset",
      options: options2,
      async fn(state) {
        var _middlewareData$offse, _middlewareData$arrow;
        let {
          x,
          y,
          placement,
          middlewareData
        } = state, diffCoords = await convertValueToCoords(state, options2);
        return placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset ? {} : {
          x: x + diffCoords.x,
          y: y + diffCoords.y,
          data: {
            ...diffCoords,
            placement
          }
        };
      }
    };
  }, shift = function(options2) {
    return options2 === void 0 && (options2 = {}), {
      name: "shift",
      options: options2,
      async fn(state) {
        let {
          x,
          y,
          placement,
          platform: platform2
        } = state, {
          mainAxis: checkMainAxis = !0,
          crossAxis: checkCrossAxis = !1,
          limiter = {
            fn: (_ref) => {
              let {
                x: x2,
                y: y2
              } = _ref;
              return {
                x: x2,
                y: y2
              };
            }
          },
          ...detectOverflowOptions
        } = evaluate(options2, state), coords = {
          x,
          y
        }, overflow = await platform2.detectOverflow(state, detectOverflowOptions), crossAxis = getSideAxis(placement), mainAxis = getOppositeAxis(crossAxis), mainAxisCoord = coords[mainAxis], crossAxisCoord = coords[crossAxis], clampCoord = (axis, coord) => clamp(coord + overflow[axis === "y" ? "top" : "left"], coord, coord - overflow[axis === "y" ? "bottom" : "right"]);
        checkMainAxis && (mainAxisCoord = clampCoord(mainAxis, mainAxisCoord)), checkCrossAxis && (crossAxisCoord = clampCoord(crossAxis, crossAxisCoord));
        let limitedCoords = limiter.fn({
          ...state,
          [mainAxis]: mainAxisCoord,
          [crossAxis]: crossAxisCoord
        });
        return {
          ...limitedCoords,
          data: {
            x: limitedCoords.x - x,
            y: limitedCoords.y - y,
            enabled: {
              [mainAxis]: checkMainAxis,
              [crossAxis]: checkCrossAxis
            }
          }
        };
      }
    };
  }, limitShift = function(options2) {
    return options2 === void 0 && (options2 = {}), {
      options: options2,
      fn(state) {
        var _rawOffset$mainAxis, _rawOffset$crossAxis;
        let {
          x,
          y,
          placement,
          rects,
          middlewareData
        } = state, {
          offset: offset4 = 0,
          mainAxis: checkMainAxis = !0,
          crossAxis: checkCrossAxis = !0
        } = evaluate(options2, state), coords = {
          x,
          y
        }, crossAxis = getSideAxis(placement), mainAxis = getOppositeAxis(crossAxis), mainAxisCoord = coords[mainAxis], crossAxisCoord = coords[crossAxis], rawOffset = evaluate(offset4, state), computedOffset = typeof rawOffset == "number" ? {
          mainAxis: rawOffset,
          crossAxis: 0
        } : {
          mainAxis: (_rawOffset$mainAxis = rawOffset.mainAxis) != null ? _rawOffset$mainAxis : 0,
          crossAxis: (_rawOffset$crossAxis = rawOffset.crossAxis) != null ? _rawOffset$crossAxis : 0
        };
        if (checkMainAxis) {
          let len = mainAxis === "y" ? "height" : "width", limitMin = rects.reference[mainAxis] - rects.floating[len] + computedOffset.mainAxis, limitMax = rects.reference[mainAxis] + rects.reference[len] - computedOffset.mainAxis;
          mainAxisCoord < limitMin ? mainAxisCoord = limitMin : mainAxisCoord > limitMax && (mainAxisCoord = limitMax);
        }
        if (checkCrossAxis) {
          var _middlewareData$offse, _middlewareData$offse2;
          let len = mainAxis === "y" ? "width" : "height", isOriginSide = originSides.has(getSide(placement)), limitMin = rects.reference[crossAxis] - rects.floating[len] + (isOriginSide && ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse[crossAxis]) || 0) + (isOriginSide ? 0 : computedOffset.crossAxis), limitMax = rects.reference[crossAxis] + rects.reference[len] + (isOriginSide ? 0 : ((_middlewareData$offse2 = middlewareData.offset) == null ? void 0 : _middlewareData$offse2[crossAxis]) || 0) - (isOriginSide ? computedOffset.crossAxis : 0);
          crossAxisCoord < limitMin ? crossAxisCoord = limitMin : crossAxisCoord > limitMax && (crossAxisCoord = limitMax);
        }
        return {
          [mainAxis]: mainAxisCoord,
          [crossAxis]: crossAxisCoord
        };
      }
    };
  }, size = function(options2) {
    return options2 === void 0 && (options2 = {}), {
      name: "size",
      options: options2,
      async fn(state) {
        let {
          placement,
          rects,
          platform: platform2,
          elements
        } = state, {
          apply = () => {
          },
          ...detectOverflowOptions
        } = evaluate(options2, state), overflow = await platform2.detectOverflow(state, detectOverflowOptions), side = getSide(placement), alignment = getAlignment(placement), isYAxis = getSideAxis(placement) === "y", {
          width,
          height
        } = rects.floating, heightSide, widthSide;
        side === "top" || side === "bottom" ? (heightSide = side, widthSide = alignment === (await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating)) ? "start" : "end") ? "left" : "right") : (widthSide = side, heightSide = alignment === "end" ? "top" : "bottom");
        let maximumClippingHeight = height - overflow.top - overflow.bottom, maximumClippingWidth = width - overflow.left - overflow.right, overflowAvailableHeight = min(height - overflow[heightSide], maximumClippingHeight), overflowAvailableWidth = min(width - overflow[widthSide], maximumClippingWidth), shiftData = state.middlewareData.shift, noShift = !shiftData, availableHeight = overflowAvailableHeight, availableWidth = overflowAvailableWidth;
        shiftData != null && shiftData.enabled.x && (availableWidth = maximumClippingWidth), shiftData != null && shiftData.enabled.y && (availableHeight = maximumClippingHeight), noShift && !alignment && (isYAxis ? availableWidth = width - 2 * max(overflow.left, overflow.right) : availableHeight = height - 2 * max(overflow.top, overflow.bottom)), await apply({
          ...state,
          availableWidth,
          availableHeight
        });
        let nextDimensions = await platform2.getDimensions(elements.floating);
        return width !== nextDimensions.width || height !== nextDimensions.height ? {
          reset: {
            rects: !0
          }
        } : {};
      }
    };
  };

  // ../../node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
  function hasWindow() {
    return typeof window < "u";
  }
  function getNodeName(node) {
    return isNode(node) ? (node.nodeName || "").toLowerCase() : "#document";
  }
  function getWindow(node) {
    var _node$ownerDocument;
    return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
  }
  function getDocumentElement(node) {
    var _ref;
    return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
  }
  function isNode(value) {
    return hasWindow() ? value instanceof Node || value instanceof getWindow(value).Node : !1;
  }
  function isElement(value) {
    return hasWindow() ? value instanceof Element || value instanceof getWindow(value).Element : !1;
  }
  function isHTMLElement(value) {
    return hasWindow() ? value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement : !1;
  }
  function isShadowRoot(value) {
    return !hasWindow() || typeof ShadowRoot > "u" ? !1 : value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
  }
  function isOverflowElement(element) {
    let {
      overflow,
      overflowX,
      overflowY,
      display
    } = getComputedStyle2(element);
    return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && display !== "inline" && display !== "contents";
  }
  function isTableElement(element) {
    return /^(table|td|th)$/.test(getNodeName(element));
  }
  function isTopLayer(element) {
    try {
      if (element.matches(":popover-open"))
        return !0;
    } catch {
    }
    try {
      return element.matches(":modal");
    } catch {
      return !1;
    }
  }
  var willChangeRe = /transform|translate|scale|rotate|perspective|filter/, containRe = /paint|layout|strict|content/, isNotNone = (value) => !!value && value !== "none", isWebKitValue;
  function isContainingBlock(elementOrCss) {
    let css = isElement(elementOrCss) ? getComputedStyle2(elementOrCss) : elementOrCss;
    return isNotNone(css.transform) || isNotNone(css.translate) || isNotNone(css.scale) || isNotNone(css.rotate) || isNotNone(css.perspective) || !isWebKit() && (isNotNone(css.backdropFilter) || isNotNone(css.filter)) || willChangeRe.test(css.willChange || "") || containRe.test(css.contain || "");
  }
  function getContainingBlock(element) {
    let currentNode = getParentNode(element);
    for (; isHTMLElement(currentNode) && !isLastTraversableNode(currentNode); ) {
      if (isContainingBlock(currentNode))
        return currentNode;
      if (isTopLayer(currentNode))
        return null;
      currentNode = getParentNode(currentNode);
    }
    return null;
  }
  function isWebKit() {
    return isWebKitValue == null && (isWebKitValue = typeof CSS < "u" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none")), isWebKitValue;
  }
  function isLastTraversableNode(node) {
    return /^(html|body|#document)$/.test(getNodeName(node));
  }
  function getComputedStyle2(element) {
    return getWindow(element).getComputedStyle(element);
  }
  function getNodeScroll(element) {
    return isElement(element) ? {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    } : {
      scrollLeft: element.scrollX,
      scrollTop: element.scrollY
    };
  }
  function getParentNode(node) {
    if (getNodeName(node) === "html")
      return node;
    let result = (
      // Step into the shadow DOM of the parent of a slotted node.
      node.assignedSlot || // DOM Element detected.
      node.parentNode || // ShadowRoot detected.
      isShadowRoot(node) && node.host || // Fallback.
      getDocumentElement(node)
    );
    return isShadowRoot(result) ? result.host : result;
  }
  function getNearestOverflowAncestor(node) {
    let parentNode = getParentNode(node);
    return isLastTraversableNode(parentNode) ? (node.ownerDocument || node).body : isHTMLElement(parentNode) && isOverflowElement(parentNode) ? parentNode : getNearestOverflowAncestor(parentNode);
  }
  function getOverflowAncestors(node, list, traverseIframes) {
    var _node$ownerDocument2;
    list === void 0 && (list = []), traverseIframes === void 0 && (traverseIframes = !0);
    let scrollableAncestor = getNearestOverflowAncestor(node), isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body), win = getWindow(scrollableAncestor);
    if (isBody) {
      let frameElement = getFrameElement(win);
      return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []);
    } else
      return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
  }
  function getFrameElement(win) {
    return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
  }

  // ../../node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
  function getCssDimensions(element) {
    let css = getComputedStyle2(element), width = parseFloat(css.width) || 0, height = parseFloat(css.height) || 0, hasOffset = isHTMLElement(element), offsetWidth = hasOffset ? element.offsetWidth : width, offsetHeight = hasOffset ? element.offsetHeight : height, shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
    return shouldFallback && (width = offsetWidth, height = offsetHeight), {
      width,
      height,
      $: shouldFallback
    };
  }
  function unwrapElement(element) {
    return isElement(element) ? element : element.contextElement;
  }
  function getScale(element) {
    let domElement = unwrapElement(element);
    if (!isHTMLElement(domElement))
      return createCoords(1);
    let rect2 = domElement.getBoundingClientRect(), {
      width,
      height,
      $
    } = getCssDimensions(domElement), x = ($ ? round(rect2.width) : rect2.width) / width, y = ($ ? round(rect2.height) : rect2.height) / height;
    return (!x || !Number.isFinite(x)) && (x = 1), (!y || !Number.isFinite(y)) && (y = 1), {
      x,
      y
    };
  }
  var noOffsets = /* @__PURE__ */ createCoords(0);
  function getVisualOffsets(element) {
    let win = getWindow(element);
    return !isWebKit() || !win.visualViewport ? noOffsets : {
      x: win.visualViewport.offsetLeft,
      y: win.visualViewport.offsetTop
    };
  }
  function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
    return isFixed === void 0 && (isFixed = !1), !!floatingOffsetParent && isFixed && floatingOffsetParent === getWindow(element);
  }
  function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
    includeScale === void 0 && (includeScale = !1), isFixedStrategy === void 0 && (isFixedStrategy = !1);
    let clientRect = element.getBoundingClientRect(), domElement = unwrapElement(element), scale = createCoords(1);
    includeScale && (offsetParent ? isElement(offsetParent) && (scale = getScale(offsetParent)) : scale = getScale(element));
    let visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0), x = (clientRect.left + visualOffsets.x) / scale.x, y = (clientRect.top + visualOffsets.y) / scale.y, width = clientRect.width / scale.x, height = clientRect.height / scale.y;
    if (domElement && offsetParent) {
      let win = getWindow(domElement), offsetWin = isElement(offsetParent) ? getWindow(offsetParent) : offsetParent, currentWin = win, currentIFrame = getFrameElement(currentWin);
      for (; currentIFrame && offsetWin !== currentWin; ) {
        let iframeScale = getScale(currentIFrame), iframeRect = currentIFrame.getBoundingClientRect(), css = getComputedStyle2(currentIFrame), left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x, top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
        x *= iframeScale.x, y *= iframeScale.y, width *= iframeScale.x, height *= iframeScale.y, x += left, y += top, currentWin = getWindow(currentIFrame), currentIFrame = getFrameElement(currentWin);
      }
    }
    return rectToClientRect({
      width,
      height,
      x,
      y
    });
  }
  function getWindowScrollBarX(element, rect2) {
    let leftScroll = getNodeScroll(element).scrollLeft;
    return rect2 ? rect2.left + leftScroll : getBoundingClientRect(getDocumentElement(element)).left + leftScroll;
  }
  function getHTMLOffset(documentElement, scroll) {
    let htmlRect = documentElement.getBoundingClientRect(), x = htmlRect.left + scroll.scrollLeft - getWindowScrollBarX(documentElement, htmlRect), y = htmlRect.top + scroll.scrollTop;
    return {
      x,
      y
    };
  }
  function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
    let {
      elements,
      rect: rect2,
      offsetParent,
      strategy
    } = _ref, isFixed = strategy === "fixed", documentElement = getDocumentElement(offsetParent), topLayer = elements ? isTopLayer(elements.floating) : !1;
    if (offsetParent === documentElement || topLayer && isFixed)
      return rect2;
    let scroll = {
      scrollLeft: 0,
      scrollTop: 0
    }, scale = createCoords(1), offsets = createCoords(0), isOffsetParentAnElement = isHTMLElement(offsetParent);
    if ((isOffsetParentAnElement || !isFixed) && ((getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) && (scroll = getNodeScroll(offsetParent)), isOffsetParentAnElement)) {
      let offsetRect = getBoundingClientRect(offsetParent);
      scale = getScale(offsetParent), offsets.x = offsetRect.x + offsetParent.clientLeft, offsets.y = offsetRect.y + offsetParent.clientTop;
    }
    let htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
    return {
      width: rect2.width * scale.x,
      height: rect2.height * scale.y,
      x: rect2.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
      y: rect2.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y
    };
  }
  function getClientRects(element) {
    return element.getClientRects ? Array.from(element.getClientRects()) : [];
  }
  function getDocumentRect(html) {
    let scroll = getNodeScroll(html), body = html.ownerDocument.body, width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth), height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight), x = -scroll.scrollLeft + getWindowScrollBarX(html), y = -scroll.scrollTop;
    return getComputedStyle2(body).direction === "rtl" && (x += max(html.clientWidth, body.clientWidth) - width), {
      width,
      height,
      x,
      y
    };
  }
  var SCROLLBAR_MAX = 25;
  function getViewportRect(element, strategy, rootBoundary) {
    rootBoundary === void 0 && (rootBoundary = "viewport");
    let isLayoutViewport = rootBoundary === "layoutViewport", win = getWindow(element), html = getDocumentElement(element), visualViewport = win.visualViewport, width = html.clientWidth, height = html.clientHeight, x = 0, y = 0;
    if (visualViewport) {
      let layoutRelativeClientCoords = !isWebKit() || strategy === "fixed";
      isLayoutViewport ? layoutRelativeClientCoords || (x = -visualViewport.offsetLeft, y = -visualViewport.offsetTop) : (width = visualViewport.width, height = visualViewport.height, layoutRelativeClientCoords && (x = visualViewport.offsetLeft, y = visualViewport.offsetTop));
    }
    if (getWindowScrollBarX(html) <= 0) {
      let doc = html.ownerDocument, body = doc.body, bodyStyles = getComputedStyle(body), bodyMarginInline = doc.compatMode === "CSS1Compat" && parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight) || 0, reservedWidth = Math.abs(html.clientWidth - body.clientWidth - bodyMarginInline), gutter = getComputedStyle(html).scrollbarGutter === "stable both-edges" ? reservedWidth / 2 : reservedWidth;
      gutter <= SCROLLBAR_MAX && (width -= gutter);
    }
    return {
      width,
      height,
      x,
      y
    };
  }
  function getInnerBoundingClientRect(element, strategy) {
    let clientRect = getBoundingClientRect(element, !0, strategy === "fixed"), top = clientRect.top + element.clientTop, left = clientRect.left + element.clientLeft, scale = getScale(element), width = element.clientWidth * scale.x, height = element.clientHeight * scale.y, x = left * scale.x, y = top * scale.y;
    return {
      width,
      height,
      x,
      y
    };
  }
  function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
    let rect2;
    if (clippingAncestor === "viewport" || clippingAncestor === "layoutViewport")
      rect2 = getViewportRect(element, strategy, clippingAncestor);
    else if (clippingAncestor === "document")
      rect2 = getDocumentRect(getDocumentElement(element));
    else if (isElement(clippingAncestor))
      rect2 = getInnerBoundingClientRect(clippingAncestor, strategy);
    else {
      let visualOffsets = getVisualOffsets(element);
      rect2 = {
        x: clippingAncestor.x - visualOffsets.x,
        y: clippingAncestor.y - visualOffsets.y,
        width: clippingAncestor.width,
        height: clippingAncestor.height
      };
    }
    return rectToClientRect(rect2);
  }
  function getClippingElementAncestors(element, cache) {
    let cachedResult = cache.get(element);
    if (cachedResult)
      return cachedResult;
    let result = getOverflowAncestors(element, [], !1).filter((el) => isElement(el) && getNodeName(el) !== "body"), lastKeptComputedStyle = null, elementIsFixed = getComputedStyle2(element).position === "fixed", currentNode = elementIsFixed ? getParentNode(element) : element;
    for (; isElement(currentNode) && !isLastTraversableNode(currentNode); ) {
      let computedStyle = getComputedStyle2(currentNode), currentNodeIsContaining = isContainingBlock(currentNode), lastPosition = lastKeptComputedStyle ? lastKeptComputedStyle.position : elementIsFixed ? "fixed" : "";
      !currentNodeIsContaining && (lastPosition === "fixed" || lastPosition === "absolute" && computedStyle.position === "static") ? result = result.filter((ancestor) => ancestor !== currentNode) : lastKeptComputedStyle = computedStyle, currentNode = getParentNode(currentNode);
    }
    return cache.set(element, result), result;
  }
  function getClippingRect(_ref) {
    let {
      element,
      boundary,
      rootBoundary,
      strategy
    } = _ref, clippingAncestors = [...boundary === "clippingAncestors" ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary), rootBoundary], firstRect = getClientRectFromClippingAncestor(element, clippingAncestors[0], strategy), top = firstRect.top, right = firstRect.right, bottom = firstRect.bottom, left = firstRect.left;
    for (let i = 1; i < clippingAncestors.length; i++) {
      let rect2 = getClientRectFromClippingAncestor(element, clippingAncestors[i], strategy);
      top = max(rect2.top, top), right = min(rect2.right, right), bottom = min(rect2.bottom, bottom), left = max(rect2.left, left);
    }
    return {
      width: right - left,
      height: bottom - top,
      x: left,
      y: top
    };
  }
  function getDimensions(element) {
    let {
      width,
      height
    } = getCssDimensions(element);
    return {
      width,
      height
    };
  }
  function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
    let isOffsetParentAnElement = isHTMLElement(offsetParent), documentElement = getDocumentElement(offsetParent), isFixed = strategy === "fixed", rect2 = getBoundingClientRect(element, !0, isFixed, offsetParent), scroll = {
      scrollLeft: 0,
      scrollTop: 0
    }, offsets = createCoords(0);
    if ((isOffsetParentAnElement || !isFixed) && ((getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) && (scroll = getNodeScroll(offsetParent)), isOffsetParentAnElement)) {
      let offsetRect = getBoundingClientRect(offsetParent, !0, isFixed, offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft, offsets.y = offsetRect.y + offsetParent.clientTop;
    }
    !isOffsetParentAnElement && documentElement && (offsets.x = getWindowScrollBarX(documentElement));
    let htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0), x = rect2.left + scroll.scrollLeft - offsets.x - htmlOffset.x, y = rect2.top + scroll.scrollTop - offsets.y - htmlOffset.y;
    return {
      x,
      y,
      width: rect2.width,
      height: rect2.height
    };
  }
  function isStaticPositioned(element) {
    return getComputedStyle2(element).position === "static";
  }
  function getTrueOffsetParent(element, polyfill) {
    if (!isHTMLElement(element) || getComputedStyle2(element).position === "fixed")
      return null;
    if (polyfill)
      return polyfill(element);
    let rawOffsetParent = element.offsetParent;
    return getDocumentElement(element) === rawOffsetParent && (rawOffsetParent = rawOffsetParent.ownerDocument.body), rawOffsetParent;
  }
  function getOffsetParent(element, polyfill) {
    let win = getWindow(element);
    if (isTopLayer(element))
      return win;
    if (!isHTMLElement(element)) {
      let svgOffsetParent = getParentNode(element);
      for (; svgOffsetParent && !isLastTraversableNode(svgOffsetParent); ) {
        if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent))
          return svgOffsetParent;
        svgOffsetParent = getParentNode(svgOffsetParent);
      }
      return win;
    }
    let offsetParent = getTrueOffsetParent(element, polyfill);
    for (; offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent); )
      offsetParent = getTrueOffsetParent(offsetParent, polyfill);
    return offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent) ? win : offsetParent || getContainingBlock(element) || win;
  }
  var getElementRects = async function(data) {
    let getOffsetParentFn = this.getOffsetParent || getOffsetParent, getDimensionsFn = this.getDimensions, floatingDimensions = await getDimensionsFn(data.floating);
    return {
      reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
      floating: {
        x: 0,
        y: 0,
        width: floatingDimensions.width,
        height: floatingDimensions.height
      }
    };
  };
  function isRTL(element) {
    return getComputedStyle2(element).direction === "rtl";
  }
  var platform = {
    convertOffsetParentRelativeRectToViewportRelativeRect,
    getDocumentElement,
    getClippingRect,
    getOffsetParent,
    getElementRects,
    getClientRects,
    getDimensions,
    getScale,
    isElement,
    isRTL
  };
  function rectsAreEqual(a, b) {
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
  }
  function observeMove(element, onMove, ancestorResize) {
    let io = null, timeoutId, root = getDocumentElement(element);
    function cleanup() {
      var _io;
      clearTimeout(timeoutId), (_io = io) == null || _io.disconnect(), io = null;
    }
    function refresh(skip, threshold) {
      skip === void 0 && (skip = !1), threshold === void 0 && (threshold = 1), cleanup();
      let elementRectForRootMargin = element.getBoundingClientRect(), {
        left,
        top,
        width,
        height
      } = elementRectForRootMargin;
      if (skip || onMove(), !width || !height)
        return;
      let insetTop = floor(top), insetRight = floor(root.clientWidth - (left + width)), insetBottom = floor(root.clientHeight - (top + height)), insetLeft = floor(left), options2 = {
        rootMargin: -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px",
        threshold: max(0, min(1, threshold)) || 1
      }, isFirstUpdate = !0;
      function handleObserve(entries) {
        let ratio = entries[0].intersectionRatio;
        if (!rectsAreEqual(elementRectForRootMargin, element.getBoundingClientRect()))
          return refresh();
        if (ratio !== threshold) {
          if (!isFirstUpdate)
            return refresh();
          ratio ? refresh(!1, ratio) : timeoutId = setTimeout(() => {
            refresh(!1, 1e-7);
          }, 1e3);
        }
        isFirstUpdate = !1;
      }
      try {
        io = new IntersectionObserver(handleObserve, {
          ...options2,
          // Handle <iframe>s
          root: root.ownerDocument
        });
      } catch {
        io = new IntersectionObserver(handleObserve, options2);
      }
      io.observe(element);
    }
    let win = getWindow(element), handleResize = () => refresh(ancestorResize);
    return win.addEventListener("resize", handleResize), refresh(!0), () => {
      win.removeEventListener("resize", handleResize), cleanup();
    };
  }
  function autoUpdate(reference, floating, update, options2) {
    options2 === void 0 && (options2 = {});
    let {
      ancestorScroll = !0,
      ancestorResize = !0,
      elementResize = typeof ResizeObserver == "function",
      layoutShift = typeof IntersectionObserver == "function",
      animationFrame = !1
    } = options2, referenceEl = unwrapElement(reference), ancestors = ancestorScroll || ancestorResize ? [...referenceEl ? getOverflowAncestors(referenceEl) : [], ...floating ? getOverflowAncestors(floating) : []] : [];
    ancestors.forEach((ancestor) => {
      ancestorScroll && ancestor.addEventListener("scroll", update), ancestorResize && ancestor.addEventListener("resize", update);
    });
    let cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update, ancestorResize) : null, reobserveFrame = -1, resizeObserver = null;
    elementResize && (resizeObserver = new ResizeObserver((_ref) => {
      let [firstEntry] = _ref;
      firstEntry && firstEntry.target === referenceEl && resizeObserver && floating && (resizeObserver.unobserve(floating), cancelAnimationFrame(reobserveFrame), reobserveFrame = requestAnimationFrame(() => {
        var _resizeObserver;
        (_resizeObserver = resizeObserver) == null || _resizeObserver.observe(floating);
      })), update();
    }), referenceEl && !animationFrame && resizeObserver.observe(referenceEl), floating && resizeObserver.observe(floating));
    let frameId, prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
    animationFrame && frameLoop();
    function frameLoop() {
      let nextRefRect = getBoundingClientRect(reference);
      prevRefRect && !rectsAreEqual(prevRefRect, nextRefRect) && update(), prevRefRect = nextRefRect, frameId = requestAnimationFrame(frameLoop);
    }
    return update(), () => {
      var _resizeObserver2;
      ancestors.forEach((ancestor) => {
        ancestorScroll && ancestor.removeEventListener("scroll", update), ancestorResize && ancestor.removeEventListener("resize", update);
      }), cleanupIo?.(), (_resizeObserver2 = resizeObserver) == null || _resizeObserver2.disconnect(), resizeObserver = null, animationFrame && cancelAnimationFrame(frameId);
    };
  }
  var offset2 = offset;
  var shift2 = shift, flip2 = flip, size2 = size, hide2 = hide, arrow2 = arrow;
  var limitShift2 = limitShift, computePosition2 = (reference, floating, options2) => {
    let cache = /* @__PURE__ */ new Map(), mergedOptions = options2 ?? {}, platformWithCache = {
      ...platform,
      ...mergedOptions.platform,
      _c: cache
    };
    return computePosition(reference, floating, {
      ...mergedOptions,
      platform: platformWithCache
    });
  };

  // ../../node_modules/@floating-ui/react-dom/dist/floating-ui.react-dom.mjs
  var React29 = __toESM(require_react(), 1), import_react2 = __toESM(require_react(), 1), ReactDOM3 = __toESM(require_react_dom(), 1), isClient = typeof document < "u", noop = function() {
  }, index = isClient ? import_react2.useLayoutEffect : noop;
  function deepEqual(a, b) {
    if (a === b)
      return !0;
    if (typeof a != typeof b)
      return !1;
    if (typeof a == "function" && a.toString() === b.toString())
      return !0;
    let length, i, keys;
    if (a && b && typeof a == "object") {
      if (Array.isArray(a)) {
        if (length = a.length, length !== b.length) return !1;
        for (i = length; i-- !== 0; )
          if (!deepEqual(a[i], b[i]))
            return !1;
        return !0;
      }
      if (keys = Object.keys(a), length = keys.length, length !== Object.keys(b).length)
        return !1;
      for (i = length; i-- !== 0; )
        if (!{}.hasOwnProperty.call(b, keys[i]))
          return !1;
      for (i = length; i-- !== 0; ) {
        let key = keys[i];
        if (!(key === "_owner" && a.$$typeof) && !deepEqual(a[key], b[key]))
          return !1;
      }
      return !0;
    }
    return a !== a && b !== b;
  }
  function getDPR(element) {
    return typeof window > "u" ? 1 : (element.ownerDocument.defaultView || window).devicePixelRatio || 1;
  }
  function roundByDPR(element, value) {
    let dpr = getDPR(element);
    return Math.round(value * dpr) / dpr;
  }
  function useLatestRef(value) {
    let ref = React29.useRef(value);
    return index(() => {
      ref.current = value;
    }), ref;
  }
  function useFloating(options2) {
    options2 === void 0 && (options2 = {});
    let {
      placement = "bottom",
      strategy = "absolute",
      middleware = [],
      platform: platform2,
      elements: {
        reference: externalReference,
        floating: externalFloating
      } = {},
      transform = !0,
      whileElementsMounted,
      open
    } = options2, [data, setData] = React29.useState({
      x: 0,
      y: 0,
      strategy,
      placement,
      middlewareData: {},
      isPositioned: !1
    }), [latestMiddleware, setLatestMiddleware] = React29.useState(middleware);
    deepEqual(latestMiddleware, middleware) || setLatestMiddleware(middleware);
    let [_reference, _setReference] = React29.useState(null), [_floating, _setFloating] = React29.useState(null), setReference = React29.useCallback((node) => {
      node !== referenceRef.current && (referenceRef.current = node, _setReference(node));
    }, []), setFloating = React29.useCallback((node) => {
      node !== floatingRef.current && (floatingRef.current = node, _setFloating(node));
    }, []), referenceEl = externalReference || _reference, floatingEl = externalFloating || _floating, referenceRef = React29.useRef(null), floatingRef = React29.useRef(null), dataRef = React29.useRef(data), hasWhileElementsMounted = whileElementsMounted != null, whileElementsMountedRef = useLatestRef(whileElementsMounted), platformRef = useLatestRef(platform2), openRef = useLatestRef(open), update = React29.useCallback(() => {
      if (!referenceRef.current || !floatingRef.current)
        return;
      let config = {
        placement,
        strategy,
        middleware: latestMiddleware
      };
      platformRef.current && (config.platform = platformRef.current), computePosition2(referenceRef.current, floatingRef.current, config).then((data2) => {
        let fullData = {
          ...data2,
          // The floating element's position may be recomputed while it's closed
          // but still mounted (such as when transitioning out). To ensure
          // `isPositioned` will be `false` initially on the next open, avoid
          // setting it to `true` when `open === false` (must be specified).
          isPositioned: openRef.current !== !1
        };
        isMountedRef.current && !deepEqual(dataRef.current, fullData) && (dataRef.current = fullData, ReactDOM3.flushSync(() => {
          setData(fullData);
        }));
      });
    }, [latestMiddleware, placement, strategy, platformRef, openRef]);
    index(() => {
      open === !1 && dataRef.current.isPositioned && (dataRef.current.isPositioned = !1, setData((data2) => ({
        ...data2,
        isPositioned: !1
      })));
    }, [open]);
    let isMountedRef = React29.useRef(!1);
    index(() => (isMountedRef.current = !0, () => {
      isMountedRef.current = !1;
    }), []), index(() => {
      if (referenceEl && (referenceRef.current = referenceEl), floatingEl && (floatingRef.current = floatingEl), referenceEl && floatingEl) {
        if (whileElementsMountedRef.current)
          return whileElementsMountedRef.current(referenceEl, floatingEl, update);
        update();
      }
    }, [referenceEl, floatingEl, update, whileElementsMountedRef, hasWhileElementsMounted]);
    let refs = React29.useMemo(() => ({
      reference: referenceRef,
      floating: floatingRef,
      setReference,
      setFloating
    }), [setReference, setFloating]), elements = React29.useMemo(() => ({
      reference: referenceEl,
      floating: floatingEl
    }), [referenceEl, floatingEl]), floatingStyles = React29.useMemo(() => {
      let initialStyles = {
        position: strategy,
        left: 0,
        top: 0
      };
      if (!elements.floating)
        return initialStyles;
      let x = roundByDPR(elements.floating, data.x), y = roundByDPR(elements.floating, data.y);
      return transform ? {
        ...initialStyles,
        transform: "translate(" + x + "px, " + y + "px)",
        ...getDPR(elements.floating) >= 1.5 && {
          willChange: "transform"
        }
      } : {
        position: strategy,
        left: x,
        top: y
      };
    }, [strategy, transform, elements.floating, data.x, data.y]);
    return React29.useMemo(() => ({
      ...data,
      update,
      refs,
      elements,
      floatingStyles
    }), [data, update, refs, elements, floatingStyles]);
  }
  var arrow$1 = (options2) => {
    function isRef(value) {
      return {}.hasOwnProperty.call(value, "current");
    }
    return {
      name: "arrow",
      options: options2,
      fn(state) {
        let {
          element,
          padding
        } = typeof options2 == "function" ? options2(state) : options2;
        return element && isRef(element) ? element.current != null ? arrow2({
          element: element.current,
          padding
        }).fn(state) : {} : element ? arrow2({
          element,
          padding
        }).fn(state) : {};
      }
    };
  }, offset3 = (options2, deps) => {
    let result = offset2(options2);
    return {
      name: result.name,
      fn: result.fn,
      options: [options2, deps]
    };
  }, shift3 = (options2, deps) => {
    let result = shift2(options2);
    return {
      name: result.name,
      fn: result.fn,
      options: [options2, deps]
    };
  }, limitShift3 = (options2, deps) => ({
    fn: limitShift2(options2).fn,
    options: [options2, deps]
  }), flip3 = (options2, deps) => {
    let result = flip2(options2);
    return {
      name: result.name,
      fn: result.fn,
      options: [options2, deps]
    };
  }, size3 = (options2, deps) => {
    let result = size2(options2);
    return {
      name: result.name,
      fn: result.fn,
      options: [options2, deps]
    };
  };
  var hide3 = (options2, deps) => {
    let result = hide2(options2);
    return {
      name: result.name,
      fn: result.fn,
      options: [options2, deps]
    };
  };
  var arrow3 = (options2, deps) => {
    let result = arrow$1(options2);
    return {
      name: result.name,
      fn: result.fn,
      options: [options2, deps]
    };
  };

  // ../../node_modules/@radix-ui/react-arrow/dist/index.mjs
  var React30 = __toESM(require_react(), 1);
  var import_jsx_runtime10 = __toESM(require_jsx_runtime(), 1), __defProp20 = Object.defineProperty, __name19 = (target, value) => __defProp20(target, "name", { value, configurable: !0 }), Arrow = /* @__PURE__ */ React30.forwardRef(
    /* @__PURE__ */ __name19(function(props, forwardedRef) {
      let { children, width = 10, height = 5, ...arrowProps } = props;
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        Primitive.svg,
        {
          ...arrowProps,
          ref: forwardedRef,
          width,
          height,
          viewBox: "0 0 30 10",
          preserveAspectRatio: "none",
          children: props.asChild ? children : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("polygon", { points: "0,0 30,0 15,10" })
        }
      );
    }, "Arrow")
  );

  // ../../node_modules/@radix-ui/react-popper/dist/index.mjs
  var import_jsx_runtime11 = __toESM(require_jsx_runtime(), 1), __defProp21 = Object.defineProperty, __name20 = (target, value) => __defProp21(target, "name", { value, configurable: !0 });
  var Sticky = {
    Partial: "partial",
    Always: "always"
  }, UpdatePositionStrategy = {
    Optimized: "optimized",
    Always: "always"
  }, POPPER_NAME = "Popper", [createPopperContext, createPopperScope] = createContextScope(POPPER_NAME), [PopperProvider, usePopperContext] = createPopperContext(POPPER_NAME), Popper = /* @__PURE__ */ __name20((props) => {
    let { __scopePopper, children } = props, [anchor, setAnchor] = React31.useState(null), [placementState, setPlacementState] = React31.useState(void 0);
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
      PopperProvider,
      {
        scope: __scopePopper,
        anchor,
        onAnchorChange: setAnchor,
        placementState,
        setPlacementState,
        children
      }
    );
  }, "Popper"), ANCHOR_NAME = "PopperAnchor", PopperAnchor = /* @__PURE__ */ React31.forwardRef(
    /* @__PURE__ */ __name20(function(props, forwardedRef) {
      let { __scopePopper, virtualRef, ...anchorProps } = props, context = usePopperContext(ANCHOR_NAME, __scopePopper), ref = React31.useRef(null), onAnchorChange = context.onAnchorChange, callbackRef = React31.useCallback(
        (node) => {
          ref.current = node, node && onAnchorChange(node);
        },
        [onAnchorChange]
      ), composedRefs = useComposedRefs(forwardedRef, callbackRef), anchorRef = React31.useRef(null);
      React31.useEffect(() => {
        if (!virtualRef)
          return;
        let previousAnchor = anchorRef.current;
        anchorRef.current = virtualRef.current, previousAnchor !== anchorRef.current && onAnchorChange(anchorRef.current);
      });
      let sideAndAlign = context.placementState && getSideAndAlignFromPlacement(context.placementState), placedSide = sideAndAlign?.[0], placedAlign = sideAndAlign?.[1];
      return virtualRef ? null : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        Primitive.div,
        {
          "data-radix-popper-side": placedSide,
          "data-radix-popper-align": placedAlign,
          ...anchorProps,
          ref: composedRefs
        }
      );
    }, "PopperAnchor")
  ), CONTENT_NAME2 = "PopperContent", [PopperContentProvider, useContentContext] = createPopperContext(CONTENT_NAME2), PopperContent = /* @__PURE__ */ React31.forwardRef(
    /* @__PURE__ */ __name20(function(props, forwardedRef) {
      let {
        __scopePopper,
        side = "bottom",
        sideOffset = 0,
        align = "center",
        alignOffset = 0,
        arrowPadding = 0,
        avoidCollisions = !0,
        collisionBoundary = [],
        collisionPadding: collisionPaddingProp = 0,
        sticky = Sticky.Partial,
        hideWhenDetached = !1,
        updatePositionStrategy = UpdatePositionStrategy.Optimized,
        onPlaced,
        ...contentProps
      } = props, context = usePopperContext(CONTENT_NAME2, __scopePopper), [content, setContent] = React31.useState(null), composedRefs = useComposedRefs(forwardedRef, setContent), [arrow4, setArrow] = React31.useState(null), arrowSize = useSize(arrow4), arrowWidth = arrowSize?.width ?? 0, arrowHeight = arrowSize?.height ?? 0, desiredPlacement = side + (align !== "center" ? "-" + align : ""), collisionPadding = typeof collisionPaddingProp == "number" ? collisionPaddingProp : { top: 0, right: 0, bottom: 0, left: 0, ...collisionPaddingProp }, boundary = Array.isArray(collisionBoundary) ? collisionBoundary : [collisionBoundary], hasExplicitBoundaries = boundary.length > 0, detectOverflowOptions = {
        padding: collisionPadding,
        boundary: boundary.filter(isNotNull),
        // with `strategy: 'fixed'`, this is the only way to get it to respect boundaries
        altBoundary: hasExplicitBoundaries
      }, { refs, floatingStyles, placement, isPositioned, middlewareData } = useFloating({
        // default to `fixed` strategy so users don't have to pick and we also avoid focus scroll issues
        strategy: "fixed",
        placement: desiredPlacement,
        whileElementsMounted: /* @__PURE__ */ __name20((...args) => autoUpdate(...args, {
          animationFrame: updatePositionStrategy === UpdatePositionStrategy.Always
        }), "whileElementsMounted"),
        elements: {
          reference: context.anchor
        },
        middleware: [
          offset3({ mainAxis: sideOffset + arrowHeight, alignmentAxis: alignOffset }),
          avoidCollisions && shift3({
            mainAxis: !0,
            crossAxis: !1,
            // Spread rather than passing `limiter: undefined`, which
            // `exactOptionalPropertyTypes` rejects for Floating UI's optional option.
            ...sticky === Sticky.Partial ? { limiter: limitShift3() } : {},
            ...detectOverflowOptions
          }),
          avoidCollisions && flip3({ ...detectOverflowOptions }),
          size3({
            ...detectOverflowOptions,
            apply: /* @__PURE__ */ __name20(({ elements, rects, availableWidth, availableHeight }) => {
              let { width: anchorWidth, height: anchorHeight } = rects.reference, contentStyle = elements.floating.style;
              contentStyle.setProperty("--radix-popper-available-width", `${availableWidth}px`), contentStyle.setProperty("--radix-popper-available-height", `${availableHeight}px`), contentStyle.setProperty("--radix-popper-anchor-width", `${anchorWidth}px`), contentStyle.setProperty("--radix-popper-anchor-height", `${anchorHeight}px`);
            }, "apply")
          }),
          arrow4 && arrow3({ element: arrow4, padding: arrowPadding }),
          transformOrigin({ arrowWidth, arrowHeight }),
          hideWhenDetached && // `hide` detects whether the anchor (reference) is clipped, so when
          // no explicit `collisionBoundary` is set we omit `boundary` entirely
          // and fall back to Floating UI's default clipping ancestors (e.g. a
          // scrollable menu). This lets an occluded submenu hide once its anchor
          // scrolls out of view (#3237). The collision/size middlewares
          // deliberately keep the viewport-based default to avoid clamping
          // content rendered inside transformed or overflow-clipping portal
          // containers. The key is omitted rather than set to `undefined`
          // because `exactOptionalPropertyTypes` rejects the explicit value.
          hide3(
            hasExplicitBoundaries ? { strategy: "referenceHidden", ...detectOverflowOptions } : {
              strategy: "referenceHidden",
              padding: detectOverflowOptions.padding,
              altBoundary: detectOverflowOptions.altBoundary
            }
          )
        ]
      }), setPlacementState = context.setPlacementState;
      useLayoutEffect2(() => (setPlacementState(placement), () => {
        setPlacementState(void 0);
      }), [placement, setPlacementState]);
      let [placedSide, placedAlign] = getSideAndAlignFromPlacement(placement), handlePlaced = useCallbackRef(onPlaced);
      useLayoutEffect2(() => {
        isPositioned && handlePlaced?.();
      }, [isPositioned, handlePlaced]);
      let arrowX = middlewareData.arrow?.x, arrowY = middlewareData.arrow?.y, cannotCenterArrow = middlewareData.arrow?.centerOffset !== 0, [contentZIndex, setContentZIndex] = React31.useState();
      return useLayoutEffect2(() => {
        content && setContentZIndex(window.getComputedStyle(content).zIndex);
      }, [content]), /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        "div",
        {
          ref: refs.setFloating,
          "data-radix-popper-content-wrapper": "",
          style: {
            ...floatingStyles,
            transform: isPositioned ? floatingStyles.transform : "translate(0, -200%)",
            // keep off the page when measuring
            minWidth: "max-content",
            zIndex: contentZIndex,
            "--radix-popper-transform-origin": [
              middlewareData.transformOrigin?.x,
              middlewareData.transformOrigin?.y
            ].join(" "),
            // hide the content if using the hide middleware and should be hidden
            // set visibility to hidden and disable pointer events so the UI behaves
            // as if the PopperContent isn't there at all
            ...middlewareData.hide?.referenceHidden && {
              visibility: "hidden",
              pointerEvents: "none"
            }
          },
          dir: props.dir,
          children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
            PopperContentProvider,
            {
              scope: __scopePopper,
              placedSide,
              placedAlign,
              onArrowChange: setArrow,
              arrowX,
              arrowY,
              shouldHideArrow: cannotCenterArrow,
              children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
                Primitive.div,
                {
                  "data-side": placedSide,
                  "data-align": placedAlign,
                  ...contentProps,
                  ref: composedRefs,
                  style: {
                    ...contentProps.style,
                    // if the PopperContent hasn't been placed yet (not all
                    // measurements done) we prevent animations so that users'
                    // animations don't kick in too early from the wrong sides.
                    animation: isPositioned ? contentProps.style?.animation : "none"
                  }
                }
              )
            }
          )
        }
      );
    }, "PopperContent")
  ), ARROW_NAME = "PopperArrow", OPPOSITE_SIDE = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right"
  }, PopperArrow = /* @__PURE__ */ React31.forwardRef(
    /* @__PURE__ */ __name20(function(props, forwardedRef) {
      let { __scopePopper, ...arrowProps } = props, contentContext = useContentContext(ARROW_NAME, __scopePopper), baseSide = OPPOSITE_SIDE[contentContext.placedSide];
      return (
        // we have to use an extra wrapper because `ResizeObserver` (used by `useSize`)
        // doesn't report size as we'd expect on SVG elements.
        // it reports their bounding box which is effectively the largest path inside the SVG.
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
          "span",
          {
            ref: contentContext.onArrowChange,
            style: {
              position: "absolute",
              left: contentContext.arrowX,
              top: contentContext.arrowY,
              [baseSide]: 0,
              transformOrigin: {
                top: "",
                right: "0 0",
                bottom: "center 0",
                left: "100% 0"
              }[contentContext.placedSide],
              transform: {
                top: "translateY(100%)",
                right: "translateY(50%) rotate(90deg) translateX(-50%)",
                bottom: "rotate(180deg)",
                left: "translateY(50%) rotate(-90deg) translateX(50%)"
              }[contentContext.placedSide],
              visibility: contentContext.shouldHideArrow ? "hidden" : void 0
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
              Arrow,
              {
                ...arrowProps,
                ref: forwardedRef,
                style: {
                  ...arrowProps.style,
                  // ensures the element can be measured correctly (mostly for if SVG)
                  display: "block"
                }
              }
            )
          }
        )
      );
    }, "PopperArrow")
  );
  function isNotNull(value) {
    return value !== null;
  }
  __name20(isNotNull, "isNotNull");
  var transformOrigin = /* @__PURE__ */ __name20((options2) => ({
    name: "transformOrigin",
    options: options2,
    fn(data) {
      let { placement, rects, middlewareData } = data, isArrowHidden = middlewareData.arrow?.centerOffset !== 0, arrowWidth = isArrowHidden ? 0 : options2.arrowWidth, arrowHeight = isArrowHidden ? 0 : options2.arrowHeight, [placedSide, placedAlign] = getSideAndAlignFromPlacement(placement), noArrowAlign = { start: "0%", center: "50%", end: "100%" }[placedAlign], arrowXCenter = (middlewareData.arrow?.x ?? 0) + arrowWidth / 2, arrowYCenter = (middlewareData.arrow?.y ?? 0) + arrowHeight / 2, x = "", y = "";
      return placedSide === "bottom" ? (x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`, y = `${-arrowHeight}px`) : placedSide === "top" ? (x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`, y = `${rects.floating.height + arrowHeight}px`) : placedSide === "right" ? (x = `${-arrowHeight}px`, y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`) : placedSide === "left" && (x = `${rects.floating.width + arrowHeight}px`, y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`), { data: { x, y } };
    }
  }), "transformOrigin");
  function getSideAndAlignFromPlacement(placement) {
    let [side, align = "center"] = placement.split("-");
    return [side, align];
  }
  __name20(getSideAndAlignFromPlacement, "getSideAndAlignFromPlacement");

  // ../../node_modules/@radix-ui/react-roving-focus/dist/index.mjs
  var React33 = __toESM(require_react(), 1);

  // ../../node_modules/@radix-ui/react-use-is-hydrated/dist/index.mjs
  var React210 = __toESM(require_react(), 1), React32 = __toESM(require_react(), 1), __defProp22 = Object.defineProperty, __name21 = (target, value) => __defProp22(target, "name", { value, configurable: !0 }), _isHydrated = !1;
  function useIsHydrated() {
    let [isHydrated, setIsHydrated] = React32.useState(_isHydrated);
    return React32.useEffect(() => {
      _isHydrated || (_isHydrated = !0, setIsHydrated(!0));
    }, []), isHydrated;
  }
  __name21(useIsHydrated, "useIsHydrated");
  var useReactSyncExternalStore = React210[" useSyncExternalStore ".trim().toString()];
  function subscribe() {
    return () => {
    };
  }
  __name21(subscribe, "subscribe");
  function useIsHydratedModern() {
    return useReactSyncExternalStore(
      subscribe,
      () => !0,
      () => !1
    );
  }
  __name21(useIsHydratedModern, "useIsHydratedModern");
  var useIsHydrated2 = typeof useReactSyncExternalStore == "function" ? useIsHydratedModern : useIsHydrated;