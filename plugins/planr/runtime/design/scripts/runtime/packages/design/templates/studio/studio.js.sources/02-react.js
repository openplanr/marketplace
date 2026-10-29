

  // ../../node_modules/react/cjs/react-jsx-runtime.production.js
  var require_react_jsx_runtime_production = __commonJS({
    "../../node_modules/react/cjs/react-jsx-runtime.production.js"(exports) {
      "use strict";
      /**
       * @license React
       * react-jsx-runtime.production.js
       *
       * Copyright (c) Meta Platforms, Inc. and affiliates.
       *
       * This source code is licensed under the MIT license found in the
       * LICENSE file in the root directory of this source tree.
       */
      var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment");
      function jsxProd(type, config, maybeKey) {
        var key = null;
        if (maybeKey !== void 0 && (key = "" + maybeKey), config.key !== void 0 && (key = "" + config.key), "key" in config) {
          maybeKey = {};
          for (var propName in config)
            propName !== "key" && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        return config = maybeKey.ref, {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          ref: config !== void 0 ? config : null,
          props: maybeKey
        };
      }
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.jsx = jsxProd;
      exports.jsxs = jsxProd;
    }
  });

  // ../../node_modules/react/jsx-runtime.js
  var require_jsx_runtime = __commonJS({
    "../../node_modules/react/jsx-runtime.js"(exports, module) {
      "use strict";
      module.exports = require_react_jsx_runtime_production();
    }
  });

  // ../../node_modules/react/cjs/react.production.js
  var require_react_production = __commonJS({
    "../../node_modules/react/cjs/react.production.js"(exports) {
      "use strict";
      /**
       * @license React
       * react.production.js
       *
       * Copyright (c) Meta Platforms, Inc. and affiliates.
       *
       * This source code is licensed under the MIT license found in the
       * LICENSE file in the root directory of this source tree.
       */
      var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE2 = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = /* @__PURE__ */ Symbol.for("react.view_transition"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
      function getIteratorFn(maybeIterable) {
        return maybeIterable === null || typeof maybeIterable != "object" ? null : (maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"], typeof maybeIterable == "function" ? maybeIterable : null);
      }
      var ReactNoopUpdateQueue = {
        isMounted: function() {
          return !1;
        },
        enqueueForceUpdate: function() {
        },
        enqueueReplaceState: function() {
        },
        enqueueSetState: function() {
        }
      }, assign = Object.assign, emptyObject = {};
      function Component(props, context, updater) {
        this.props = props, this.context = context, this.refs = emptyObject, this.updater = updater || ReactNoopUpdateQueue;
      }
      Component.prototype.isReactComponent = {};
      Component.prototype.setState = function(partialState, callback) {
        if (typeof partialState != "object" && typeof partialState != "function" && partialState != null)
          throw Error(
            "takes an object of state variables to update or a function which returns an object of state variables."
          );
        this.updater.enqueueSetState(this, partialState, callback, "setState");
      };
      Component.prototype.forceUpdate = function(callback) {
        this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
      };
      function ComponentDummy() {
      }
      ComponentDummy.prototype = Component.prototype;
      function PureComponent(props, context, updater) {
        this.props = props, this.context = context, this.refs = emptyObject, this.updater = updater || ReactNoopUpdateQueue;
      }
      var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
      pureComponentPrototype.constructor = PureComponent;
      assign(pureComponentPrototype, Component.prototype);
      pureComponentPrototype.isPureReactComponent = !0;
      var isArrayImpl = Array.isArray;
      function noop3() {
      }
      var ReactSharedInternals = { H: null, A: null, T: null, S: null }, hasOwnProperty = Object.prototype.hasOwnProperty;
      function ReactElement(type, key, props) {
        var refProp = props.ref;
        return {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          ref: refProp !== void 0 ? refProp : null,
          props
        };
      }
      function cloneAndReplaceKey(oldElement, newKey) {
        return ReactElement(oldElement.type, newKey, oldElement.props);
      }
      function isValidElement2(object2) {
        return typeof object2 == "object" && object2 !== null && object2.$$typeof === REACT_ELEMENT_TYPE;
      }
      function escape(key) {
        var escaperLookup = { "=": "=0", ":": "=2" };
        return "$" + key.replace(/[=:]/g, function(match) {
          return escaperLookup[match];
        });
      }
      var userProvidedKeyEscapeRegex = /\/+/g;
      function getElementKey(element, index2) {
        return typeof element == "object" && element !== null && element.key != null ? escape("" + element.key) : index2.toString(36);
      }
      function resolveThenable(thenable) {
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenable.reason;
          default:
            switch (typeof thenable.status == "string" ? thenable.then(noop3, noop3) : (thenable.status = "pending", thenable.then(
              function(fulfilledValue) {
                thenable.status === "pending" && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
              },
              function(error) {
                thenable.status === "pending" && (thenable.status = "rejected", thenable.reason = error);
              }
            )), thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenable.reason;
            }
        }
        throw thenable;
      }
      function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
        var type = typeof children;
        (type === "undefined" || type === "boolean") && (children = null);
        var invokeCallback = !1;
        if (children === null) invokeCallback = !0;
        else
          switch (type) {
            case "bigint":
            case "string":
            case "number":
              invokeCallback = !0;
              break;
            case "object":
              switch (children.$$typeof) {
                case REACT_ELEMENT_TYPE:
                case REACT_PORTAL_TYPE:
                  invokeCallback = !0;
                  break;
                case REACT_LAZY_TYPE2:
                  return invokeCallback = children._init, mapIntoArray(
                    invokeCallback(children._payload),
                    array,
                    escapedPrefix,
                    nameSoFar,
                    callback
                  );
              }
          }
        if (invokeCallback)
          return callback = callback(children), invokeCallback = nameSoFar === "" ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", invokeCallback != null && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
            return c;
          })) : callback != null && (isValidElement2(callback) && (callback = cloneAndReplaceKey(
            callback,
            escapedPrefix + (callback.key == null || children && children.key === callback.key ? "" : ("" + callback.key).replace(
              userProvidedKeyEscapeRegex,
              "$&/"
            ) + "/") + invokeCallback
          )), array.push(callback)), 1;
        invokeCallback = 0;
        var nextNamePrefix = nameSoFar === "" ? "." : nameSoFar + ":";
        if (isArrayImpl(children))
          for (var i = 0; i < children.length; i++)
            nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if (i = getIteratorFn(children), typeof i == "function")
          for (children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
            nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if (type === "object") {
          if (typeof children.then == "function")
            return mapIntoArray(
              resolveThenable(children),
              array,
              escapedPrefix,
              nameSoFar,
              callback
            );
          throw array = String(children), Error(
            "Objects are not valid as a React child (found: " + (array === "[object Object]" ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
          );
        }
        return invokeCallback;
      }
      function mapChildren(children, func, context) {
        if (children == null) return children;
        var result = [], count3 = 0;
        return mapIntoArray(children, result, "", "", function(child) {
          return func.call(context, child, count3++);
        }), result;
      }
      function lazyInitializer(payload) {
        if (payload._status === -1) {
          var ctor = payload._result, thenable = ctor();
          thenable.then(
            function(moduleObject) {
              (payload._status === 0 || payload._status === -1) && (payload._status = 1, payload._result = moduleObject, thenable.status === void 0 && (thenable.status = "fulfilled", thenable.value = moduleObject));
            },
            function(error) {
              (payload._status === 0 || payload._status === -1) && (payload._status = 2, payload._result = error, thenable.status === void 0 && (thenable.status = "rejected", thenable.reason = error));
            }
          ), payload._status === -1 && (payload._status = 0, payload._result = thenable);
        }
        if (payload._status === 1) return payload._result.default;
        throw payload._result;
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
      };
      function startTransition(scope) {
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        currentTransition.types = prevTransition !== null ? prevTransition.types : null, ReactSharedInternals.T = currentTransition;
        try {
          var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
          onStartTransitionFinish !== null && onStartTransitionFinish(currentTransition, returnValue), typeof returnValue == "object" && returnValue !== null && typeof returnValue.then == "function" && returnValue.then(noop3, reportGlobalError);
        } catch (error) {
          reportGlobalError(error);
        } finally {
          prevTransition !== null && currentTransition.types !== null && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      }
      function addTransitionType(type) {
        var transition = ReactSharedInternals.T;
        if (transition !== null) {
          var transitionTypes = transition.types;
          transitionTypes === null ? transition.types = [type] : transitionTypes.indexOf(type) === -1 && transitionTypes.push(type);
        } else startTransition(addTransitionType.bind(null, type));
      }
      var Children5 = {
        map: mapChildren,
        forEach: function(children, forEachFunc, forEachContext) {
          mapChildren(
            children,
            function() {
              forEachFunc.apply(this, arguments);
            },
            forEachContext
          );
        },
        count: function(children) {
          var n = 0;
          return mapChildren(children, function() {
            n++;
          }), n;
        },
        toArray: function(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        },
        only: function(children) {
          if (!isValidElement2(children))
            throw Error(
              "React.Children.only expected to receive a single React element child."
            );
          return children;
        }
      };
      exports.Activity = REACT_ACTIVITY_TYPE;
      exports.Children = Children5;
      exports.Component = Component;
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.Profiler = REACT_PROFILER_TYPE;
      exports.PureComponent = PureComponent;
      exports.StrictMode = REACT_STRICT_MODE_TYPE;
      exports.Suspense = REACT_SUSPENSE_TYPE;
      exports.ViewTransition = REACT_VIEW_TRANSITION_TYPE;
      exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
      exports.__COMPILER_RUNTIME = {
        __proto__: null,
        c: function(size4) {
          return ReactSharedInternals.H.useMemoCache(size4);
        }
      };
      exports.addTransitionType = addTransitionType;
      exports.cache = function(fn) {
        return function() {
          return fn.apply(null, arguments);
        };
      };
      exports.cacheSignal = function() {
        return null;
      };
      exports.cloneElement = function(element, config, children) {
        if (element == null)
          throw Error(
            "The argument must be a React element, but you passed " + element + "."
          );
        var props = assign({}, element.props), key = element.key;
        if (config != null)
          for (propName in config.key !== void 0 && (key = "" + config.key), config)
            !hasOwnProperty.call(config, propName) || propName === "key" || propName === "__self" || propName === "__source" || propName === "ref" && config.ref === void 0 || (props[propName] = config[propName]);
        var propName = arguments.length - 2;
        if (propName === 1) props.children = children;
        else if (1 < propName) {
          for (var childArray = Array(propName), i = 0; i < propName; i++)
            childArray[i] = arguments[i + 2];
          props.children = childArray;
        }
        return ReactElement(element.type, key, props);
      };
      exports.createContext = function(defaultValue) {
        return defaultValue = {
          $$typeof: REACT_CONTEXT_TYPE,
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          _threadCount: 0,
          Provider: null,
          Consumer: null
        }, defaultValue.Provider = defaultValue, defaultValue.Consumer = {
          $$typeof: REACT_CONSUMER_TYPE,
          _context: defaultValue
        }, defaultValue;
      };
      exports.createElement = function(type, config, children) {
        var propName, props = {}, key = null;
        if (config != null)
          for (propName in config.key !== void 0 && (key = "" + config.key), config)
            hasOwnProperty.call(config, propName) && propName !== "key" && propName !== "__self" && propName !== "__source" && (props[propName] = config[propName]);
        var childrenLength = arguments.length - 2;
        if (childrenLength === 1) props.children = children;
        else if (1 < childrenLength) {
          for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++)
            childArray[i] = arguments[i + 2];
          props.children = childArray;
        }
        if (type && type.defaultProps)
          for (propName in childrenLength = type.defaultProps, childrenLength)
            props[propName] === void 0 && (props[propName] = childrenLength[propName]);
        return ReactElement(type, key, props);
      };
      exports.createRef = function() {
        return { current: null };
      };
      exports.forwardRef = function(render) {
        return { $$typeof: REACT_FORWARD_REF_TYPE, render };
      };
      exports.isValidElement = isValidElement2;
      exports.lazy = function(ctor) {
        return {
          $$typeof: REACT_LAZY_TYPE2,
          _payload: { _status: -1, _result: ctor },
          _init: lazyInitializer
        };
      };
      exports.memo = function(type, compare) {
        return {
          $$typeof: REACT_MEMO_TYPE,
          type,
          compare: compare === void 0 ? null : compare
        };
      };
      exports.startTransition = startTransition;
      exports.unstable_useCacheRefresh = function() {
        return ReactSharedInternals.H.useCacheRefresh();
      };
      exports.use = function(usable) {
        return ReactSharedInternals.H.use(usable);
      };
      exports.useActionState = function(action, initialState, permalink) {
        return ReactSharedInternals.H.useActionState(action, initialState, permalink);
      };
      exports.useCallback = function(callback, deps) {
        return ReactSharedInternals.H.useCallback(callback, deps);
      };
      exports.useContext = function(Context) {
        return ReactSharedInternals.H.useContext(Context);
      };
      exports.useDebugValue = function() {
      };
      exports.useDeferredValue = function(value, initialValue) {
        return ReactSharedInternals.H.useDeferredValue(value, initialValue);
      };
      exports.useEffect = function(create, deps) {
        return ReactSharedInternals.H.useEffect(create, deps);
      };
      exports.useEffectEvent = function(callback) {
        return ReactSharedInternals.H.useEffectEvent(callback);
      };
      exports.useId = function() {
        return ReactSharedInternals.H.useId();
      };
      exports.useImperativeHandle = function(ref, create, deps) {
        return ReactSharedInternals.H.useImperativeHandle(ref, create, deps);
      };
      exports.useInsertionEffect = function(create, deps) {
        return ReactSharedInternals.H.useInsertionEffect(create, deps);
      };
      exports.useLayoutEffect = function(create, deps) {
        return ReactSharedInternals.H.useLayoutEffect(create, deps);
      };
      exports.useMemo = function(create, deps) {
        return ReactSharedInternals.H.useMemo(create, deps);
      };
      exports.useOptimistic = function(passthrough, reducer) {
        return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
      };
      exports.useReducer = function(reducer, initialArg, init) {
        return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
      };
      exports.useRef = function(initialValue) {
        return ReactSharedInternals.H.useRef(initialValue);
      };
      exports.useState = function(initialState) {
        return ReactSharedInternals.H.useState(initialState);
      };
      exports.useSyncExternalStore = function(subscribe2, getSnapshot, getServerSnapshot) {
        return ReactSharedInternals.H.useSyncExternalStore(
          subscribe2,
          getSnapshot,
          getServerSnapshot
        );
      };
      exports.useTransition = function() {
        return ReactSharedInternals.H.useTransition();
      };
      exports.version = "19.3.1";
    }
  });

  // ../../node_modules/react/index.js
  var require_react = __commonJS({
    "../../node_modules/react/index.js"(exports, module) {
      "use strict";
      module.exports = require_react_production();
    }
  });

  // ../../node_modules/react-dom/cjs/react-dom.production.js
  var require_react_dom_production = __commonJS({
    "../../node_modules/react-dom/cjs/react-dom.production.js"(exports) {
      "use strict";
      /**
       * @license React
       * react-dom.production.js
       *
       * Copyright (c) Meta Platforms, Inc. and affiliates.
       *
       * This source code is licensed under the MIT license found in the
       * LICENSE file in the root directory of this source tree.
       */
      var React36 = require_react();
      function formatProdErrorMessage(code) {
        var url = "https://react.dev/errors/" + code;
        if (1 < arguments.length) {
          url += "?args[]=" + encodeURIComponent(arguments[1]);
          for (var i = 2; i < arguments.length; i++)
            url += "&args[]=" + encodeURIComponent(arguments[i]);
        }
        return "Minified React error #" + code + "; visit " + url + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      function noop3() {
      }
      var Internals = {
        d: {
          f: noop3,
          r: function() {
            throw Error(formatProdErrorMessage(522));
          },
          D: noop3,
          C: noop3,
          L: noop3,
          m: noop3,
          X: noop3,
          S: noop3,
          M: noop3
        },
        p: 0,
        findDOMNode: null
      }, REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_RECOVERABLE_TYPE = /* @__PURE__ */ Symbol.for("react.recoverable"), REACT_OPTIMISTIC_KEY = /* @__PURE__ */ Symbol.for("react.optimistic_key");
      function createPortal$1(children, containerInfo, implementation) {
        var key = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
        return {
          $$typeof: REACT_PORTAL_TYPE,
          key: key == null ? null : key === REACT_OPTIMISTIC_KEY ? REACT_OPTIMISTIC_KEY : "" + key,
          children,
          containerInfo,
          implementation
        };
      }
      var ReactSharedInternals = React36.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      function getCrossOriginStringAs(as, input) {
        if (as === "font") return "";
        if (typeof input == "string")
          return input === "use-credentials" ? input : "";
      }
      exports.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Internals;
      exports.browser = function(reason) {
        return { $$typeof: REACT_RECOVERABLE_TYPE, _reason: reason };
      };
      exports.createPortal = function(children, container) {
        var key = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
        if (!container || container.nodeType !== 1 && container.nodeType !== 9 && container.nodeType !== 11)
          throw Error(formatProdErrorMessage(299));
        return createPortal$1(children, container, null, key);
      };
      exports.flushSync = function(fn) {
        var previousTransition = ReactSharedInternals.T, previousUpdatePriority = Internals.p;
        try {
          if (ReactSharedInternals.T = null, Internals.p = 2, fn) return fn();
        } finally {
          ReactSharedInternals.T = previousTransition, Internals.p = previousUpdatePriority, Internals.d.f();
        }
      };
      exports.preconnect = function(href, options2) {
        typeof href == "string" && (options2 ? (options2 = options2.crossOrigin, options2 = typeof options2 == "string" ? options2 === "use-credentials" ? options2 : "" : void 0) : options2 = null, Internals.d.C(href, options2));
      };
      exports.prefetchDNS = function(href) {
        typeof href == "string" && Internals.d.D(href);
      };
      exports.preinit = function(href, options2) {
        if (typeof href == "string" && options2 && typeof options2.as == "string") {
          var as = options2.as, crossOrigin = getCrossOriginStringAs(as, options2.crossOrigin), integrity = typeof options2.integrity == "string" ? options2.integrity : void 0, fetchPriority = typeof options2.fetchPriority == "string" ? options2.fetchPriority : void 0;
          as === "style" ? Internals.d.S(
            href,
            typeof options2.precedence == "string" ? options2.precedence : void 0,
            {
              crossOrigin,
              integrity,
              fetchPriority
            }
          ) : as === "script" && Internals.d.X(href, {
            crossOrigin,
            integrity,
            fetchPriority,
            nonce: typeof options2.nonce == "string" ? options2.nonce : void 0
          });
        }
      };
      exports.preinitModule = function(href, options2) {
        if (typeof href == "string")
          if (typeof options2 == "object" && options2 !== null) {
            if (options2.as == null || options2.as === "script") {
              var crossOrigin = getCrossOriginStringAs(
                options2.as,
                options2.crossOrigin
              );
              Internals.d.M(href, {
                crossOrigin,
                integrity: typeof options2.integrity == "string" ? options2.integrity : void 0,
                nonce: typeof options2.nonce == "string" ? options2.nonce : void 0,
                fetchPriority: typeof options2.fetchPriority == "string" ? options2.fetchPriority : void 0
              });
            }
          } else options2 == null && Internals.d.M(href);
      };
      exports.preload = function(href, options2) {
        if (typeof href == "string" && typeof options2 == "object" && options2 !== null && typeof options2.as == "string") {
          var as = options2.as, crossOrigin = getCrossOriginStringAs(as, options2.crossOrigin);
          Internals.d.L(href, as, {
            crossOrigin,
            integrity: typeof options2.integrity == "string" ? options2.integrity : void 0,
            nonce: typeof options2.nonce == "string" ? options2.nonce : void 0,
            type: typeof options2.type == "string" ? options2.type : void 0,
            fetchPriority: typeof options2.fetchPriority == "string" ? options2.fetchPriority : void 0,
            referrerPolicy: typeof options2.referrerPolicy == "string" ? options2.referrerPolicy : void 0,
            imageSrcSet: typeof options2.imageSrcSet == "string" ? options2.imageSrcSet : void 0,
            imageSizes: typeof options2.imageSizes == "string" ? options2.imageSizes : void 0,
            media: typeof options2.media == "string" ? options2.media : void 0
          });
        }
      };
      exports.preloadModule = function(href, options2) {
        if (typeof href == "string")
          if (options2) {
            var crossOrigin = getCrossOriginStringAs(options2.as, options2.crossOrigin);
            Internals.d.m(href, {
              as: typeof options2.as == "string" && options2.as !== "script" ? options2.as : void 0,
              crossOrigin,
              integrity: typeof options2.integrity == "string" ? options2.integrity : void 0,
              nonce: typeof options2.nonce == "string" ? options2.nonce : void 0,
              fetchPriority: typeof options2.fetchPriority == "string" ? options2.fetchPriority : void 0
            });
          } else Internals.d.m(href);
      };
      exports.requestFormReset = function(form) {
        Internals.d.r(form);
      };
      exports.unstable_batchedUpdates = function(fn, a) {
        return fn(a);
      };
      exports.useFormState = function(action, initialState, permalink) {
        return ReactSharedInternals.H.useFormState(action, initialState, permalink);
      };
      exports.useFormStatus = function() {
        return ReactSharedInternals.H.useHostTransitionStatus();
      };
      exports.version = "19.3.1";
    }
  });

  // ../../node_modules/react-dom/index.js
  var require_react_dom = __commonJS({
    "../../node_modules/react-dom/index.js"(exports, module) {
      "use strict";
      function checkDCE() {
        if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
          try {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
          } catch (err) {
            console.error(err);
          }
      }
      checkDCE(), module.exports = require_react_dom_production();
    }
  });

  // ../../node_modules/scheduler/cjs/scheduler.production.js
  var require_scheduler_production = __commonJS({
    "../../node_modules/scheduler/cjs/scheduler.production.js"(exports) {
      "use strict";
      /**
       * @license React
       * scheduler.production.js
       *
       * Copyright (c) Meta Platforms, Inc. and affiliates.
       *
       * This source code is licensed under the MIT license found in the
       * LICENSE file in the root directory of this source tree.
       */
      function push(heap, node) {
        var index2 = heap.length;
        heap.push(node);
        a: for (; 0 < index2; ) {
          var parentIndex = index2 - 1 >>> 1, parent2 = heap[parentIndex];
          if (0 < compare(parent2, node))
            heap[parentIndex] = node, heap[index2] = parent2, index2 = parentIndex;
          else break a;
        }
      }
      function peek(heap) {
        return heap.length === 0 ? null : heap[0];
      }
      function pop(heap) {
        if (heap.length === 0) return null;
        var first = heap[0], last = heap.pop();
        if (last !== first) {
          heap[0] = last;
          a: for (var index2 = 0, length = heap.length, halfLength = length >>> 1; index2 < halfLength; ) {
            var leftIndex = 2 * (index2 + 1) - 1, left = heap[leftIndex], rightIndex = leftIndex + 1, right = heap[rightIndex];
            if (0 > compare(left, last))
              rightIndex < length && 0 > compare(right, left) ? (heap[index2] = right, heap[rightIndex] = last, index2 = rightIndex) : (heap[index2] = left, heap[leftIndex] = last, index2 = leftIndex);
            else if (rightIndex < length && 0 > compare(right, last))
              heap[index2] = right, heap[rightIndex] = last, index2 = rightIndex;
            else break a;
          }
        }
        return first;
      }
      function compare(a, b) {
        var diff = a.sortIndex - b.sortIndex;
        return diff !== 0 ? diff : a.id - b.id;
      }
      exports.unstable_now = void 0;
      typeof performance == "object" && typeof performance.now == "function" ? (localPerformance = performance, exports.unstable_now = function() {
        return localPerformance.now();
      }) : (localDate = Date, initialTime = localDate.now(), exports.unstable_now = function() {
        return localDate.now() - initialTime;
      });
      var localPerformance, localDate, initialTime, taskQueue = [], timerQueue = [], taskIdCounter = 1, currentTask = null, currentPriorityLevel = 3, isPerformingWork = !1, isHostCallbackScheduled = !1, isHostTimeoutScheduled = !1, needsPaint = !1, localSetTimeout = typeof setTimeout == "function" ? setTimeout : null, localClearTimeout = typeof clearTimeout == "function" ? clearTimeout : null, localSetImmediate = typeof setImmediate < "u" ? setImmediate : null;
      function advanceTimers(currentTime) {
        for (var timer = peek(timerQueue); timer !== null; ) {
          if (timer.callback === null) pop(timerQueue);
          else if (timer.startTime <= currentTime)
            pop(timerQueue), timer.sortIndex = timer.expirationTime, push(taskQueue, timer);
          else break;
          timer = peek(timerQueue);
        }
      }
      function handleTimeout(currentTime) {
        if (isHostTimeoutScheduled = !1, advanceTimers(currentTime), !isHostCallbackScheduled)
          if (peek(taskQueue) !== null)
            isHostCallbackScheduled = !0, isMessageLoopRunning || (isMessageLoopRunning = !0, schedulePerformWorkUntilDeadline());
          else {
            var firstTimer = peek(timerQueue);
            firstTimer !== null && requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
          }
      }
      var isMessageLoopRunning = !1, taskTimeoutID = -1, frameInterval = 5, startTime = -1;
      function shouldYieldToHost() {
        return needsPaint ? !0 : !(exports.unstable_now() - startTime < frameInterval);
      }
      function performWorkUntilDeadline() {
        if (needsPaint = !1, isMessageLoopRunning) {
          var currentTime = exports.unstable_now();
          startTime = currentTime;
          var hasMoreWork = !0;
          try {
            a: {
              isHostCallbackScheduled = !1, isHostTimeoutScheduled && (isHostTimeoutScheduled = !1, localClearTimeout(taskTimeoutID), taskTimeoutID = -1), isPerformingWork = !0;
              var previousPriorityLevel = currentPriorityLevel;
              try {
                b: {
                  for (advanceTimers(currentTime), currentTask = peek(taskQueue); currentTask !== null && !(currentTask.expirationTime > currentTime && shouldYieldToHost()); ) {
                    var callback = currentTask.callback;
                    if (typeof callback == "function") {
                      currentTask.callback = null, currentPriorityLevel = currentTask.priorityLevel;
                      var continuationCallback = callback(
                        currentTask.expirationTime <= currentTime
                      );
                      if (currentTime = exports.unstable_now(), typeof continuationCallback == "function") {
                        currentTask.callback = continuationCallback, advanceTimers(currentTime), hasMoreWork = !0;
                        break b;
                      }
                      currentTask === peek(taskQueue) && pop(taskQueue), advanceTimers(currentTime);
                    } else pop(taskQueue);
                    currentTask = peek(taskQueue);
                  }
                  if (currentTask !== null) hasMoreWork = !0;
                  else {
                    var firstTimer = peek(timerQueue);
                    firstTimer !== null && requestHostTimeout(
                      handleTimeout,
                      firstTimer.startTime - currentTime
                    ), hasMoreWork = !1;
                  }
                }
                break a;
              } finally {
                currentTask = null, currentPriorityLevel = previousPriorityLevel, isPerformingWork = !1;
              }
              hasMoreWork = void 0;
            }
          } finally {
            hasMoreWork ? schedulePerformWorkUntilDeadline() : isMessageLoopRunning = !1;
          }
        }
      }
      var schedulePerformWorkUntilDeadline;
      typeof localSetImmediate == "function" ? schedulePerformWorkUntilDeadline = function() {
        localSetImmediate(performWorkUntilDeadline);
      } : typeof MessageChannel < "u" ? (channel = new MessageChannel(), port = channel.port2, channel.port1.onmessage = performWorkUntilDeadline, schedulePerformWorkUntilDeadline = function() {
        port.postMessage(null);
      }) : schedulePerformWorkUntilDeadline = function() {
        localSetTimeout(performWorkUntilDeadline, 0);
      };
      var channel, port;
      function requestHostTimeout(callback, ms) {
        taskTimeoutID = localSetTimeout(function() {
          callback(exports.unstable_now());
        }, ms);
      }
      exports.unstable_IdlePriority = 5;
      exports.unstable_ImmediatePriority = 1;
      exports.unstable_LowPriority = 4;
      exports.unstable_NormalPriority = 3;
      exports.unstable_Profiling = null;
      exports.unstable_UserBlockingPriority = 2;
      exports.unstable_cancelCallback = function(task) {
        task.callback = null;
      };
      exports.unstable_forceFrameRate = function(fps) {
        0 > fps || 125 < fps ? console.error(
          "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"
        ) : frameInterval = 0 < fps ? Math.floor(1e3 / fps) : 5;
      };
      exports.unstable_getCurrentPriorityLevel = function() {
        return currentPriorityLevel;
      };
      exports.unstable_next = function(eventHandler) {
        switch (currentPriorityLevel) {
          case 1:
          case 2:
          case 3:
            var priorityLevel = 3;
            break;
          default:
            priorityLevel = currentPriorityLevel;
        }
        var previousPriorityLevel = currentPriorityLevel;
        currentPriorityLevel = priorityLevel;
        try {
          return eventHandler();
        } finally {
          currentPriorityLevel = previousPriorityLevel;
        }
      };
      exports.unstable_requestPaint = function() {
        needsPaint = !0;
      };
      exports.unstable_runWithPriority = function(priorityLevel, eventHandler) {
        switch (priorityLevel) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
          default:
            priorityLevel = 3;
        }
        var previousPriorityLevel = currentPriorityLevel;
        currentPriorityLevel = priorityLevel;
        try {
          return eventHandler();
        } finally {
          currentPriorityLevel = previousPriorityLevel;
        }
      };
      exports.unstable_scheduleCallback = function(priorityLevel, callback, options2) {
        var currentTime = exports.unstable_now();
        switch (typeof options2 == "object" && options2 !== null ? (options2 = options2.delay, options2 = typeof options2 == "number" && 0 < options2 ? currentTime + options2 : currentTime) : options2 = currentTime, priorityLevel) {
          case 1:
            var timeout = -1;
            break;
          case 2:
            timeout = 250;
            break;
          case 5:
            timeout = 1073741823;
            break;
          case 4:
            timeout = 1e4;
            break;
          default:
            timeout = 5e3;
        }
        return timeout = options2 + timeout, priorityLevel = {
          id: taskIdCounter++,
          callback,
          priorityLevel,
          startTime: options2,
          expirationTime: timeout,
          sortIndex: -1
        }, options2 > currentTime ? (priorityLevel.sortIndex = options2, push(timerQueue, priorityLevel), peek(taskQueue) === null && priorityLevel === peek(timerQueue) && (isHostTimeoutScheduled ? (localClearTimeout(taskTimeoutID), taskTimeoutID = -1) : isHostTimeoutScheduled = !0, requestHostTimeout(handleTimeout, options2 - currentTime))) : (priorityLevel.sortIndex = timeout, push(taskQueue, priorityLevel), isHostCallbackScheduled || isPerformingWork || (isHostCallbackScheduled = !0, isMessageLoopRunning || (isMessageLoopRunning = !0, schedulePerformWorkUntilDeadline()))), priorityLevel;
      };
      exports.unstable_shouldYield = shouldYieldToHost;
      exports.unstable_wrapCallback = function(callback) {
        var parentPriorityLevel = currentPriorityLevel;
        return function() {
          var previousPriorityLevel = currentPriorityLevel;
          currentPriorityLevel = parentPriorityLevel;
          try {
            return callback.apply(this, arguments);
          } finally {
            currentPriorityLevel = previousPriorityLevel;
          }
        };
      };
    }
  });

  // ../../node_modules/scheduler/index.js
  var require_scheduler = __commonJS({
    "../../node_modules/scheduler/index.js"(exports, module) {
      "use strict";
      module.exports = require_scheduler_production();
    }
  });