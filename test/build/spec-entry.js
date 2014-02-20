(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){/**
 * @license
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modern -o ./dist/lodash.js`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used to pool arrays and objects used internally */
  var arrayPool = [],
      objectPool = [];

  /** Used to generate unique IDs */
  var idCounter = 0;

  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
  var keyPrefix = +new Date + '';

  /** Used as the size when optimizations are enabled for large arrays */
  var largeArraySize = 75;

  /** Used as the max size of the `arrayPool` and `objectPool` */
  var maxPoolSize = 40;

  /** Used to detect and test whitespace */
  var whitespace = (
    // whitespace
    ' \t\x0B\f\xA0\ufeff' +

    // line terminators
    '\n\r\u2028\u2029' +

    // unicode category "Zs" space separators
    '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
  );

  /** Used to match empty string literals in compiled template source */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /**
   * Used to match ES6 template delimiters
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-literals-string-literals
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;

  /** Used to detected named functions */
  var reFuncName = /^\s*function[ \n\r\t]+\w/;

  /** Used to match "interpolate" template delimiters */
  var reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match leading whitespace and zeros to be removed */
  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');

  /** Used to ensure capturing order of template delimiters */
  var reNoMatch = /($^)/;

  /** Used to detect functions containing a `this` reference */
  var reThis = /\bthis\b/;

  /** Used to match unescaped characters in compiled string literals */
  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

  /** Used to assign default `context` object properties */
  var contextProps = [
    'Array', 'Boolean', 'Date', 'Function', 'Math', 'Number', 'Object',
    'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN',
    'parseInt', 'setTimeout'
  ];

  /** Used to make template sourceURLs easier to identify */
  var templateCounter = 0;

  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]',
      arrayClass = '[object Array]',
      boolClass = '[object Boolean]',
      dateClass = '[object Date]',
      funcClass = '[object Function]',
      numberClass = '[object Number]',
      objectClass = '[object Object]',
      regexpClass = '[object RegExp]',
      stringClass = '[object String]';

  /** Used to identify object classifications that `_.clone` supports */
  var cloneableClasses = {};
  cloneableClasses[funcClass] = false;
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
  cloneableClasses[boolClass] = cloneableClasses[dateClass] =
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

  /** Used as an internal `_.debounce` options object */
  var debounceOptions = {
    'leading': false,
    'maxWait': 0,
    'trailing': false
  };

  /** Used as the property descriptor for `__bindData__` */
  var descriptor = {
    'configurable': false,
    'enumerable': false,
    'value': null,
    'writable': false
  };

  /** Used to determine if values are of the language type Object */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  /** Used to escape characters for inclusion in compiled string literals */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Used as a reference to the global object */
  var root = (objectTypes[typeof window] && window) || this;

  /** Detect free variable `exports` */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module` */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports` */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    root = freeGlobal;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `_.indexOf` without support for binary searches
   * or `fromIndex` constraints.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} [fromIndex=0] The index to search from.
   * @returns {number} Returns the index of the matched value or `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    var index = (fromIndex || 0) - 1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * An implementation of `_.contains` for cache objects that mimics the return
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
   *
   * @private
   * @param {Object} cache The cache object to inspect.
   * @param {*} value The value to search for.
   * @returns {number} Returns `0` if `value` is found, else `-1`.
   */
  function cacheIndexOf(cache, value) {
    var type = typeof value;
    cache = cache.cache;

    if (type == 'boolean' || value == null) {
      return cache[value] ? 0 : -1;
    }
    if (type != 'number' && type != 'string') {
      type = 'object';
    }
    var key = type == 'number' ? value : keyPrefix + value;
    cache = (cache = cache[type]) && cache[key];

    return type == 'object'
      ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1)
      : (cache ? 0 : -1);
  }

  /**
   * Adds a given value to the corresponding cache object.
   *
   * @private
   * @param {*} value The value to add to the cache.
   */
  function cachePush(value) {
    var cache = this.cache,
        type = typeof value;

    if (type == 'boolean' || value == null) {
      cache[value] = true;
    } else {
      if (type != 'number' && type != 'string') {
        type = 'object';
      }
      var key = type == 'number' ? value : keyPrefix + value,
          typeCache = cache[type] || (cache[type] = {});

      if (type == 'object') {
        (typeCache[key] || (typeCache[key] = [])).push(value);
      } else {
        typeCache[key] = true;
      }
    }
  }

  /**
   * Used by `_.max` and `_.min` as the default callback when a given
   * collection is a string value.
   *
   * @private
   * @param {string} value The character to inspect.
   * @returns {number} Returns the code unit of given character.
   */
  function charAtCallback(value) {
    return value.charCodeAt(0);
  }

  /**
   * Used by `sortBy` to compare transformed `collection` elements, stable sorting
   * them in ascending order.
   *
   * @private
   * @param {Object} a The object to compare to `b`.
   * @param {Object} b The object to compare to `a`.
   * @returns {number} Returns the sort order indicator of `1` or `-1`.
   */
  function compareAscending(a, b) {
    var ac = a.criteria,
        bc = b.criteria,
        index = -1,
        length = ac.length;

    while (++index < length) {
      var value = ac[index],
          other = bc[index];

      if (value !== other) {
        if (value > other || typeof value == 'undefined') {
          return 1;
        }
        if (value < other || typeof other == 'undefined') {
          return -1;
        }
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to return the same value for
    // `a` and `b`. See https://github.com/jashkenas/underscore/pull/1247
    //
    // This also ensures a stable sort in V8 and other engines.
    // See http://code.google.com/p/v8/issues/detail?id=90
    return a.index - b.index;
  }

  /**
   * Creates a cache object to optimize linear searches of large arrays.
   *
   * @private
   * @param {Array} [array=[]] The array to search.
   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
   */
  function createCache(array) {
    var index = -1,
        length = array.length,
        first = array[0],
        mid = array[(length / 2) | 0],
        last = array[length - 1];

    if (first && typeof first == 'object' &&
        mid && typeof mid == 'object' && last && typeof last == 'object') {
      return false;
    }
    var cache = getObject();
    cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;

    var result = getObject();
    result.array = array;
    result.cache = cache;
    result.push = cachePush;

    while (++index < length) {
      result.push(array[index]);
    }
    return result;
  }

  /**
   * Used by `template` to escape characters for inclusion in compiled
   * string literals.
   *
   * @private
   * @param {string} match The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(match) {
    return '\\' + stringEscapes[match];
  }

  /**
   * Gets an array from the array pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Array} The array from the pool.
   */
  function getArray() {
    return arrayPool.pop() || [];
  }

  /**
   * Gets an object from the object pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Object} The object from the pool.
   */
  function getObject() {
    return objectPool.pop() || {
      'array': null,
      'cache': null,
      'criteria': null,
      'false': false,
      'index': 0,
      'null': false,
      'number': null,
      'object': null,
      'push': null,
      'string': null,
      'true': false,
      'undefined': false,
      'value': null
    };
  }

  /**
   * Releases the given array back to the array pool.
   *
   * @private
   * @param {Array} [array] The array to release.
   */
  function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
      arrayPool.push(array);
    }
  }

  /**
   * Releases the given object back to the object pool.
   *
   * @private
   * @param {Object} [object] The object to release.
   */
  function releaseObject(object) {
    var cache = object.cache;
    if (cache) {
      releaseObject(cache);
    }
    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
    if (objectPool.length < maxPoolSize) {
      objectPool.push(object);
    }
  }

  /**
   * Slices the `collection` from the `start` index up to, but not including,
   * the `end` index.
   *
   * Note: This function is used instead of `Array#slice` to support node lists
   * in IE < 9 and to ensure dense arrays are returned.
   *
   * @private
   * @param {Array|Object|string} collection The collection to slice.
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @returns {Array} Returns the new array.
   */
  function slice(array, start, end) {
    start || (start = 0);
    if (typeof end == 'undefined') {
      end = array ? array.length : 0;
    }
    var index = -1,
        length = end - start || 0,
        result = Array(length < 0 ? 0 : length);

    while (++index < length) {
      result[index] = array[start + index];
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new `lodash` function using the given context object.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns the `lodash` function.
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See http://es5.github.io/#x11.1.5.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references */
    var Array = context.Array,
        Boolean = context.Boolean,
        Date = context.Date,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /**
     * Used for `Array` method references.
     *
     * Normally `Array.prototype` would suffice, however, using an array literal
     * avoids issues in Narwhal.
     */
    var arrayRef = [];

    /** Used for native method references */
    var objectProto = Object.prototype;

    /** Used to restore the original `_` reference in `noConflict` */
    var oldDash = context._;

    /** Used to resolve the internal [[Class]] of values */
    var toString = objectProto.toString;

    /** Used to detect if a method is native */
    var reNative = RegExp('^' +
      String(toString)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/toString| for [^\]]+/g, '.*?') + '$'
    );

    /** Native method shortcuts */
    var ceil = Math.ceil,
        clearTimeout = context.clearTimeout,
        floor = Math.floor,
        fnToString = Function.prototype.toString,
        getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
        hasOwnProperty = objectProto.hasOwnProperty,
        push = arrayRef.push,
        setTimeout = context.setTimeout,
        splice = arrayRef.splice,
        unshift = arrayRef.unshift;

    /** Used to set meta data on functions */
    var defineProperty = (function() {
      // IE 8 only accepts DOM elements
      try {
        var o = {},
            func = isNative(func = Object.defineProperty) && func,
            result = func(o, o, o) && func;
      } catch(e) { }
      return result;
    }());

    /* Native method shortcuts for methods with the same name as other `lodash` methods */
    var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,
        nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,
        nativeIsFinite = context.isFinite,
        nativeIsNaN = context.isNaN,
        nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random;

    /** Used to lookup a built-in constructor by [[Class]] */
    var ctorByClass = {};
    ctorByClass[arrayClass] = Array;
    ctorByClass[boolClass] = Boolean;
    ctorByClass[dateClass] = Date;
    ctorByClass[funcClass] = Function;
    ctorByClass[objectClass] = Object;
    ctorByClass[numberClass] = Number;
    ctorByClass[regexpClass] = RegExp;
    ctorByClass[stringClass] = String;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps the given value to enable intuitive
     * method chaining.
     *
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
     * and `unshift`
     *
     * Chaining is supported in custom builds as long as the `value` method is
     * implicitly or explicitly included in the build.
     *
     * The chainable wrapper functions are:
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
     * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,
     * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,
     * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,
     * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,
     * and `zip`
     *
     * The non-chainable wrapper functions are:
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
     * `template`, `unescape`, `uniqueId`, and `value`
     *
     * The wrapper functions `first` and `last` return wrapped values when `n` is
     * provided, otherwise they return unwrapped values.
     *
     * Explicit chaining can be enabled by using the `_.chain` method.
     *
     * @name _
     * @constructor
     * @category Chaining
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns a `lodash` instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(num) {
     *   return num * num;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
      return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))
       ? value
       : new lodashWrapper(value);
    }

    /**
     * A fast path for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap in a `lodash` instance.
     * @param {boolean} chainAll A flag to enable chaining for all methods
     * @returns {Object} Returns a `lodash` instance.
     */
    function lodashWrapper(value, chainAll) {
      this.__chain__ = !!chainAll;
      this.__wrapped__ = value;
    }
    // ensure `new lodashWrapper` is an instance of `lodash`
    lodashWrapper.prototype = lodash.prototype;

    /**
     * An object used to flag environments features.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    /**
     * Detect if functions can be decompiled by `Function#toString`
     * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext);

    /**
     * Detect if `Function#name` is supported (all but IE).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcNames = typeof Function.name == 'string';

    /**
     * By default, the template delimiters used by Lo-Dash are similar to those in
     * embedded Ruby (ERB). Change the following template settings to use alternative
     * delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': /<%-([\s\S]+?)%>/g,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': /<%([\s\S]+?)%>/g,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*--------------------------------------------------------------------------*/

    /**
     * The base implementation of `_.bind` that creates the bound function and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new bound function.
     */
    function baseBind(bindData) {
      var func = bindData[0],
          partialArgs = bindData[2],
          thisArg = bindData[4];

      function bound() {
        // `Function#bind` spec
        // http://es5.github.io/#x15.3.4.5
        if (partialArgs) {
          // avoid `arguments` object deoptimizations by using `slice` instead
          // of `Array.prototype.slice.call` and not assigning `arguments` to a
          // variable as a ternary expression
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        // mimic the constructor's `return` behavior
        // http://es5.github.io/#x13.2.2
        if (this instanceof bound) {
          // ensure `new bound` is an instance of `func`
          var thisBinding = baseCreate(func.prototype),
              result = func.apply(thisBinding, args || arguments);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisArg, args || arguments);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.clone` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, callback, stackA, stackB) {
      if (callback) {
        var result = callback(value);
        if (typeof result != 'undefined') {
          return result;
        }
      }
      // inspect [[Class]]
      var isObj = isObject(value);
      if (isObj) {
        var className = toString.call(value);
        if (!cloneableClasses[className]) {
          return value;
        }
        var ctor = ctorByClass[className];
        switch (className) {
          case boolClass:
          case dateClass:
            return new ctor(+value);

          case numberClass:
          case stringClass:
            return new ctor(value);

          case regexpClass:
            result = ctor(value.source, reFlags.exec(value));
            result.lastIndex = value.lastIndex;
            return result;
        }
      } else {
        return value;
      }
      var isArr = isArray(value);
      if (isDeep) {
        // check for circular references and return corresponding clone
        var initedStack = !stackA;
        stackA || (stackA = getArray());
        stackB || (stackB = getArray());

        var length = stackA.length;
        while (length--) {
          if (stackA[length] == value) {
            return stackB[length];
          }
        }
        result = isArr ? ctor(value.length) : {};
      }
      else {
        result = isArr ? slice(value) : assign({}, value);
      }
      // add array properties assigned by `RegExp#exec`
      if (isArr) {
        if (hasOwnProperty.call(value, 'index')) {
          result.index = value.index;
        }
        if (hasOwnProperty.call(value, 'input')) {
          result.input = value.input;
        }
      }
      // exit for shallow clone
      if (!isDeep) {
        return result;
      }
      // add the source value to the stack of traversed objects
      // and associate it with its clone
      stackA.push(value);
      stackB.push(result);

      // recursively populate clone (susceptible to call stack limits)
      (isArr ? forEach : forOwn)(value, function(objValue, key) {
        result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
      });

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    function baseCreate(prototype, properties) {
      return isObject(prototype) ? nativeCreate(prototype) : {};
    }
    // fallback for browsers without `Object.create`
    if (!nativeCreate) {
      baseCreate = (function() {
        function Object() {}
        return function(prototype) {
          if (isObject(prototype)) {
            Object.prototype = prototype;
            var result = new Object;
            Object.prototype = null;
          }
          return result || context.Object();
        };
      }());
    }

    /**
     * The base implementation of `_.createCallback` without support for creating
     * "_.pluck" or "_.where" style callbacks.
     *
     * @private
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     */
    function baseCreateCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      // exit early for no `thisArg` or already bound by `Function#bind`
      if (typeof thisArg == 'undefined' || !('prototype' in func)) {
        return func;
      }
      var bindData = func.__bindData__;
      if (typeof bindData == 'undefined') {
        if (support.funcNames) {
          bindData = !func.name;
        }
        bindData = bindData || !support.funcDecomp;
        if (!bindData) {
          var source = fnToString.call(func);
          if (!support.funcNames) {
            bindData = !reFuncName.test(source);
          }
          if (!bindData) {
            // checks if `func` references the `this` keyword and stores the result
            bindData = reThis.test(source);
            setBindData(func, bindData);
          }
        }
      }
      // exit early if there are no `this` references or `func` is bound
      if (bindData === false || (bindData !== true && bindData[1] & 1)) {
        return func;
      }
      switch (argCount) {
        case 1: return function(value) {
          return func.call(thisArg, value);
        };
        case 2: return function(a, b) {
          return func.call(thisArg, a, b);
        };
        case 3: return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
      }
      return bind(func, thisArg);
    }

    /**
     * The base implementation of `createWrapper` that creates the wrapper and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new function.
     */
    function baseCreateWrapper(bindData) {
      var func = bindData[0],
          bitmask = bindData[1],
          partialArgs = bindData[2],
          partialRightArgs = bindData[3],
          thisArg = bindData[4],
          arity = bindData[5];

      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          key = func;

      function bound() {
        var thisBinding = isBind ? thisArg : this;
        if (partialArgs) {
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        if (partialRightArgs || isCurry) {
          args || (args = slice(arguments));
          if (partialRightArgs) {
            push.apply(args, partialRightArgs);
          }
          if (isCurry && args.length < arity) {
            bitmask |= 16 & ~32;
            return baseCreateWrapper([func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity]);
          }
        }
        args || (args = arguments);
        if (isBindKey) {
          func = thisBinding[key];
        }
        if (this instanceof bound) {
          thisBinding = baseCreate(func.prototype);
          var result = func.apply(thisBinding, args);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisBinding, args);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.difference` that accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {Array} [values] The array of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     */
    function baseDifference(array, values) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          isLarge = length >= largeArraySize && indexOf === baseIndexOf,
          result = [];

      if (isLarge) {
        var cache = createCache(values);
        if (cache) {
          indexOf = cacheIndexOf;
          values = cache;
        } else {
          isLarge = false;
        }
      }
      while (++index < length) {
        var value = array[index];
        if (indexOf(values, value) < 0) {
          result.push(value);
        }
      }
      if (isLarge) {
        releaseObject(values);
      }
      return result;
    }

    /**
     * The base implementation of `_.flatten` without support for callback
     * shorthands or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.
     * @param {number} [fromIndex=0] The index to start from.
     * @returns {Array} Returns a new flattened array.
     */
    function baseFlatten(array, isShallow, isStrict, fromIndex) {
      var index = (fromIndex || 0) - 1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];

        if (value && typeof value == 'object' && typeof value.length == 'number'
            && (isArray(value) || isArguments(value))) {
          // recursively flatten arrays (susceptible to call stack limits)
          if (!isShallow) {
            value = baseFlatten(value, isShallow, isStrict);
          }
          var valIndex = -1,
              valLength = value.length,
              resIndex = result.length;

          result.length += valLength;
          while (++valIndex < valLength) {
            result[resIndex++] = value[valIndex];
          }
        } else if (!isStrict) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,
     * that allows partial "_.where" style comparisons.
     *
     * @private
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
      // used to indicate that when comparing objects, `a` has at least the properties of `b`
      if (callback) {
        var result = callback(a, b);
        if (typeof result != 'undefined') {
          return !!result;
        }
      }
      // exit early for identical values
      if (a === b) {
        // treat `+0` vs. `-0` as not equal
        return a !== 0 || (1 / a == 1 / b);
      }
      var type = typeof a,
          otherType = typeof b;

      // exit early for unlike primitive values
      if (a === a &&
          !(a && objectTypes[type]) &&
          !(b && objectTypes[otherType])) {
        return false;
      }
      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
      // http://es5.github.io/#x15.3.4.4
      if (a == null || b == null) {
        return a === b;
      }
      // compare [[Class]] names
      var className = toString.call(a),
          otherClass = toString.call(b);

      if (className == argsClass) {
        className = objectClass;
      }
      if (otherClass == argsClass) {
        otherClass = objectClass;
      }
      if (className != otherClass) {
        return false;
      }
      switch (className) {
        case boolClass:
        case dateClass:
          // coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
          return +a == +b;

        case numberClass:
          // treat `NaN` vs. `NaN` as equal
          return (a != +a)
            ? b != +b
            // but treat `+0` vs. `-0` as not equal
            : (a == 0 ? (1 / a == 1 / b) : a == +b);

        case regexpClass:
        case stringClass:
          // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
          // treat string primitives and their corresponding object instances as equal
          return a == String(b);
      }
      var isArr = className == arrayClass;
      if (!isArr) {
        // unwrap any `lodash` wrapped values
        var aWrapped = hasOwnProperty.call(a, '__wrapped__'),
            bWrapped = hasOwnProperty.call(b, '__wrapped__');

        if (aWrapped || bWrapped) {
          return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
        }
        // exit for functions and DOM nodes
        if (className != objectClass) {
          return false;
        }
        // in older versions of Opera, `arguments` objects have `Array` constructors
        var ctorA = a.constructor,
            ctorB = b.constructor;

        // non `Object` object instances with different constructors are not equal
        if (ctorA != ctorB &&
              !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) &&
              ('constructor' in a && 'constructor' in b)
            ) {
          return false;
        }
      }
      // assume cyclic structures are equal
      // the algorithm for detecting cyclic structures is adapted from ES 5.1
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
      var initedStack = !stackA;
      stackA || (stackA = getArray());
      stackB || (stackB = getArray());

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == a) {
          return stackB[length] == b;
        }
      }
      var size = 0;
      result = true;

      // add `a` and `b` to the stack of traversed objects
      stackA.push(a);
      stackB.push(b);

      // recursively compare objects and arrays (susceptible to call stack limits)
      if (isArr) {
        // compare lengths to determine if a deep comparison is necessary
        length = a.length;
        size = b.length;
        result = size == length;

        if (result || isWhere) {
          // deep compare the contents, ignoring non-numeric properties
          while (size--) {
            var index = length,
                value = b[size];

            if (isWhere) {
              while (index--) {
                if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {
                  break;
                }
              }
            } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
              break;
            }
          }
        }
      }
      else {
        // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
        // which, in this case, is more costly
        forIn(b, function(value, key, b) {
          if (hasOwnProperty.call(b, key)) {
            // count the number of properties.
            size++;
            // deep compare each property value.
            return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));
          }
        });

        if (result && !isWhere) {
          // ensure both objects have the same number of properties
          forIn(a, function(value, key, a) {
            if (hasOwnProperty.call(a, key)) {
              // `size` will be `-1` if `a` has more properties than `b`
              return (result = --size > -1);
            }
          });
        }
      }
      stackA.pop();
      stackB.pop();

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.merge` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     */
    function baseMerge(object, source, callback, stackA, stackB) {
      (isArray(source) ? forEach : forOwn)(source, function(source, key) {
        var found,
            isArr,
            result = source,
            value = object[key];

        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
          // avoid merging previously merged cyclic sources
          var stackLength = stackA.length;
          while (stackLength--) {
            if ((found = stackA[stackLength] == source)) {
              value = stackB[stackLength];
              break;
            }
          }
          if (!found) {
            var isShallow;
            if (callback) {
              result = callback(value, source);
              if ((isShallow = typeof result != 'undefined')) {
                value = result;
              }
            }
            if (!isShallow) {
              value = isArr
                ? (isArray(value) ? value : [])
                : (isPlainObject(value) ? value : {});
            }
            // add `source` and associated `value` to the stack of traversed objects
            stackA.push(source);
            stackB.push(value);

            // recursively merge objects and arrays (susceptible to call stack limits)
            if (!isShallow) {
              baseMerge(value, source, callback, stackA, stackB);
            }
          }
        }
        else {
          if (callback) {
            result = callback(value, source);
            if (typeof result == 'undefined') {
              result = source;
            }
          }
          if (typeof result != 'undefined') {
            value = result;
          }
        }
        object[key] = value;
      });
    }

    /**
     * The base implementation of `_.random` without argument juggling or support
     * for returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns a random number.
     */
    function baseRandom(min, max) {
      return min + floor(nativeRandom() * (max - min + 1));
    }

    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function} [callback] The function called per iteration.
     * @returns {Array} Returns a duplicate-value-free array.
     */
    function baseUniq(array, isSorted, callback) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          result = [];

      var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,
          seen = (callback || isLarge) ? getArray() : result;

      if (isLarge) {
        var cache = createCache(seen);
        indexOf = cacheIndexOf;
        seen = cache;
      }
      while (++index < length) {
        var value = array[index],
            computed = callback ? callback(value, index, array) : value;

        if (isSorted
              ? !index || seen[seen.length - 1] !== computed
              : indexOf(seen, computed) < 0
            ) {
          if (callback || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      if (isLarge) {
        releaseArray(seen.array);
        releaseObject(seen);
      } else if (callback) {
        releaseArray(seen);
      }
      return result;
    }

    /**
     * Creates a function that aggregates a collection, creating an object composed
     * of keys generated from the results of running each element of the collection
     * through a callback. The given `setter` function sets the keys and values
     * of the composed object.
     *
     * @private
     * @param {Function} setter The setter function.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter) {
      return function(collection, callback, thisArg) {
        var result = {};
        callback = lodash.createCallback(callback, thisArg, 3);

        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          while (++index < length) {
            var value = collection[index];
            setter(result, value, callback(value, index, collection), collection);
          }
        } else {
          forOwn(collection, function(value, key, collection) {
            setter(result, value, callback(value, key, collection), collection);
          });
        }
        return result;
      };
    }

    /**
     * Creates a function that, when called, either curries or invokes `func`
     * with an optional `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of method flags to compose.
     *  The bitmask may be composed of the following flags:
     *  1 - `_.bind`
     *  2 - `_.bindKey`
     *  4 - `_.curry`
     *  8 - `_.curry` (bound)
     *  16 - `_.partial`
     *  32 - `_.partialRight`
     * @param {Array} [partialArgs] An array of arguments to prepend to those
     *  provided to the new function.
     * @param {Array} [partialRightArgs] An array of arguments to append to those
     *  provided to the new function.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new function.
     */
    function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          isPartial = bitmask & 16,
          isPartialRight = bitmask & 32;

      if (!isBindKey && !isFunction(func)) {
        throw new TypeError;
      }
      if (isPartial && !partialArgs.length) {
        bitmask &= ~16;
        isPartial = partialArgs = false;
      }
      if (isPartialRight && !partialRightArgs.length) {
        bitmask &= ~32;
        isPartialRight = partialRightArgs = false;
      }
      var bindData = func && func.__bindData__;
      if (bindData && bindData !== true) {
        // clone `bindData`
        bindData = slice(bindData);
        if (bindData[2]) {
          bindData[2] = slice(bindData[2]);
        }
        if (bindData[3]) {
          bindData[3] = slice(bindData[3]);
        }
        // set `thisBinding` is not previously bound
        if (isBind && !(bindData[1] & 1)) {
          bindData[4] = thisArg;
        }
        // set if previously bound but not currently (subsequent curried functions)
        if (!isBind && bindData[1] & 1) {
          bitmask |= 8;
        }
        // set curried arity if not yet set
        if (isCurry && !(bindData[1] & 4)) {
          bindData[5] = arity;
        }
        // append partial left arguments
        if (isPartial) {
          push.apply(bindData[2] || (bindData[2] = []), partialArgs);
        }
        // append partial right arguments
        if (isPartialRight) {
          unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
        }
        // merge flags
        bindData[1] |= bitmask;
        return createWrapper.apply(null, bindData);
      }
      // fast path for `_.bind`
      var creater = (bitmask == 1 || bitmask === 17) ? baseBind : baseCreateWrapper;
      return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);
    }

    /**
     * Used by `escape` to convert characters to HTML entities.
     *
     * @private
     * @param {string} match The matched character to escape.
     * @returns {string} Returns the escaped character.
     */
    function escapeHtmlChar(match) {
      return htmlEscapes[match];
    }

    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized, this method returns the custom method, otherwise it returns
     * the `baseIndexOf` function.
     *
     * @private
     * @returns {Function} Returns the "indexOf" function.
     */
    function getIndexOf() {
      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
      return result;
    }

    /**
     * Checks if `value` is a native function.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
     */
    function isNative(value) {
      return typeof value == 'function' && reNative.test(value);
    }

    /**
     * Sets `this` binding data on a given function.
     *
     * @private
     * @param {Function} func The function to set data on.
     * @param {Array} value The data array to set.
     */
    var setBindData = !defineProperty ? noop : function(func, value) {
      descriptor.value = value;
      defineProperty(func, '__bindData__', descriptor);
    };

    /**
     * A fallback implementation of `isPlainObject` which checks if a given value
     * is an object created by the `Object` constructor, assuming objects created
     * by the `Object` constructor have no inherited enumerable properties and that
     * there are no `Object.prototype` extensions.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     */
    function shimIsPlainObject(value) {
      var ctor,
          result;

      // avoid non Object objects, `arguments` objects, and DOM elements
      if (!(value && toString.call(value) == objectClass) ||
          (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
        return false;
      }
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      forIn(value, function(value, key) {
        result = key;
      });
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);
    }

    /**
     * Used by `unescape` to convert HTML entities to characters.
     *
     * @private
     * @param {string} match The matched character to unescape.
     * @returns {string} Returns the unescaped character.
     */
    function unescapeHtmlChar(match) {
      return htmlUnescapes[match];
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Checks if `value` is an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
     * @example
     *
     * (function() { return _.isArguments(arguments); })(1, 2, 3);
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == argsClass || false;
    }

    /**
     * Checks if `value` is an array.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
     * @example
     *
     * (function() { return _.isArray(arguments); })();
     * // => false
     *
     * _.isArray([1, 2, 3]);
     * // => true
     */
    var isArray = nativeIsArray || function(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == arrayClass || false;
    };

    /**
     * A fallback implementation of `Object.keys` which produces an array of the
     * given object's own enumerable property names.
     *
     * @private
     * @type Function
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     */
    var shimKeys = function(object) {
      var index, iterable = object, result = [];
      if (!iterable) return result;
      if (!(objectTypes[typeof object])) return result;
        for (index in iterable) {
          if (hasOwnProperty.call(iterable, index)) {
            result.push(index);
          }
        }
      return result
    };

    /**
     * Creates an array composed of the own enumerable property names of an object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     * @example
     *
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      if (!isObject(object)) {
        return [];
      }
      return nativeKeys(object);
    };

    /**
     * Used to convert characters to HTML entities:
     *
     * Though the `>` character is escaped for symmetry, characters like `>` and `/`
     * don't require escaping in HTML and have no special meaning unless they're part
     * of a tag or an unquoted attribute value.
     * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
     */
    var htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    /** Used to convert HTML entities to characters */
    var htmlUnescapes = invert(htmlEscapes);

    /** Used to match HTML entities and HTML characters */
    var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'),
        reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');

    /*--------------------------------------------------------------------------*/

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources will overwrite property assignments of previous
     * sources. If a callback is provided it will be executed to produce the
     * assigned values. The callback is bound to `thisArg` and invoked with two
     * arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @type Function
     * @alias extend
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize assigning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });
     * // => { 'name': 'fred', 'employer': 'slate' }
     *
     * var defaults = _.partialRight(_.assign, function(a, b) {
     *   return typeof a == 'undefined' ? b : a;
     * });
     *
     * var object = { 'name': 'barney' };
     * defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var assign = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
        var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
      } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
        callback = args[--argsLength];
      }
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
        }
        }
      }
      return result
    };

    /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects will also
     * be cloned, otherwise they will be assigned by reference. If a callback
     * is provided it will be executed to produce the cloned values. If the
     * callback returns `undefined` cloning will be handled by the method instead.
     * The callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var shallow = _.clone(characters);
     * shallow[0] === characters[0];
     * // => true
     *
     * var deep = _.clone(characters, true);
     * deep[0] === characters[0];
     * // => false
     *
     * _.mixin({
     *   'clone': _.partialRight(_.clone, function(value) {
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
     *   })
     * });
     *
     * var clone = _.clone(document.body);
     * clone.childNodes.length;
     * // => 0
     */
    function clone(value, isDeep, callback, thisArg) {
      // allows working with "Collections" methods without using their `index`
      // and `collection` arguments for `isDeep` and `callback`
      if (typeof isDeep != 'boolean' && isDeep != null) {
        thisArg = callback;
        callback = isDeep;
        isDeep = false;
      }
      return baseClone(value, isDeep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates a deep clone of `value`. If a callback is provided it will be
     * executed to produce the cloned values. If the callback returns `undefined`
     * cloning will be handled by the method instead. The callback is bound to
     * `thisArg` and invoked with one argument; (value).
     *
     * Note: This method is loosely based on the structured clone algorithm. Functions
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var deep = _.cloneDeep(characters);
     * deep[0] === characters[0];
     * // => false
     *
     * var view = {
     *   'label': 'docs',
     *   'node': element
     * };
     *
     * var clone = _.cloneDeep(view, function(value) {
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
     * });
     *
     * clone.node == view.node;
     * // => false
     */
    function cloneDeep(value, callback, thisArg) {
      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties) {
      var result = baseCreate(prototype);
      return properties ? assign(result, properties) : result;
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional defaults of the same property will be ignored.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param- {Object} [guard] Allows working with `_.reduce` without using its
     *  `key` and `object` arguments as sources.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var object = { 'name': 'barney' };
     * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var defaults = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (typeof result[index] == 'undefined') result[index] = iterable[index];
        }
        }
      }
      return result
    };

    /**
     * This method is like `_.findIndex` except that it returns the key of the
     * first element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': false },
     *   'fred': {    'age': 40, 'blocked': true },
     *   'pebbles': { 'age': 1,  'blocked': false }
     * };
     *
     * _.findKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (property order is not guaranteed across environments)
     *
     * // using "_.where" callback shorthand
     * _.findKey(characters, { 'age': 1 });
     * // => 'pebbles'
     *
     * // using "_.pluck" callback shorthand
     * _.findKey(characters, 'blocked');
     * // => 'fred'
     */
    function findKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwn(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * This method is like `_.findKey` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': true },
     *   'fred': {    'age': 40, 'blocked': false },
     *   'pebbles': { 'age': 1,  'blocked': true }
     * };
     *
     * _.findLastKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles`, assuming `_.findKey` returns `barney`
     *
     * // using "_.where" callback shorthand
     * _.findLastKey(characters, { 'age': 40 });
     * // => 'fred'
     *
     * // using "_.pluck" callback shorthand
     * _.findLastKey(characters, 'blocked');
     * // => 'pebbles'
     */
    function findLastKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwnRight(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over own and inherited enumerable properties of an object,
     * executing the callback for each property. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, key, object). Callbacks may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forIn(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)
     */
    var forIn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        for (index in iterable) {
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forIn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forInRight(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'
     */
    function forInRight(object, callback, thisArg) {
      var pairs = [];

      forIn(object, function(value, key) {
        pairs.push(key, value);
      });

      var length = pairs.length;
      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(pairs[length--], pairs[length], object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Iterates over own enumerable properties of an object, executing the callback
     * for each property. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, key, object). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
     */
    var forOwn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forOwn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'
     */
    function forOwnRight(object, callback, thisArg) {
      var props = keys(object),
          length = props.length;

      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        var key = props[length];
        if (callback(object[key], key, object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Creates a sorted array of property names of all enumerable properties,
     * own and inherited, of `object` that have function values.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names that have function values.
     * @example
     *
     * _.functions(_);
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
     */
    function functions(object) {
      var result = [];
      forIn(object, function(value, key) {
        if (isFunction(value)) {
          result.push(key);
        }
      });
      return result.sort();
    }

    /**
     * Checks if the specified property name exists as a direct property of `object`,
     * instead of an inherited property.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to check.
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.
     * @example
     *
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
     * // => true
     */
    function has(object, key) {
      return object ? hasOwnProperty.call(object, key) : false;
    }

    /**
     * Creates an object composed of the inverted keys and values of the given object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to invert.
     * @returns {Object} Returns the created inverted object.
     * @example
     *
     * _.invert({ 'first': 'fred', 'second': 'barney' });
     * // => { 'fred': 'first', 'barney': 'second' }
     */
    function invert(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        result[object[key]] = key;
      }
      return result;
    }

    /**
     * Checks if `value` is a boolean value.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.
     * @example
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false ||
        value && typeof value == 'object' && toString.call(value) == boolClass || false;
    }

    /**
     * Checks if `value` is a date.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     */
    function isDate(value) {
      return value && typeof value == 'object' && toString.call(value) == dateClass || false;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     */
    function isElement(value) {
      return value && value.nodeType === 1 || false;
    }

    /**
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
     * length of `0` and objects with no own enumerable properties are considered
     * "empty".
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({});
     * // => true
     *
     * _.isEmpty('');
     * // => true
     */
    function isEmpty(value) {
      var result = true;
      if (!value) {
        return result;
      }
      var className = toString.call(value),
          length = value.length;

      if ((className == arrayClass || className == stringClass || className == argsClass ) ||
          (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {
        return !length;
      }
      forOwn(value, function() {
        return (result = false);
      });
      return result;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent to each other. If a callback is provided it will be executed
     * to compare values. If the callback returns `undefined` comparisons will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (a, b).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var copy = { 'name': 'fred' };
     *
     * object == copy;
     * // => false
     *
     * _.isEqual(object, copy);
     * // => true
     *
     * var words = ['hello', 'goodbye'];
     * var otherWords = ['hi', 'goodbye'];
     *
     * _.isEqual(words, otherWords, function(a, b) {
     *   var reGreet = /^(?:hello|hi)$/i,
     *       aGreet = _.isString(a) && reGreet.test(a),
     *       bGreet = _.isString(b) && reGreet.test(b);
     *
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
     * });
     * // => true
     */
    function isEqual(a, b, callback, thisArg) {
      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));
    }

    /**
     * Checks if `value` is, or can be coerced to, a finite number.
     *
     * Note: This is not the same as native `isFinite` which will return true for
     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.
     * @example
     *
     * _.isFinite(-101);
     * // => true
     *
     * _.isFinite('10');
     * // => true
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite('');
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
    }

    /**
     * Checks if `value` is a function.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     */
    function isFunction(value) {
      return typeof value == 'function';
    }

    /**
     * Checks if `value` is the language type of Object.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // check if the value is the ECMAScript language type of Object
      // http://es5.github.io/#x8
      // and avoid a V8 bug
      // http://code.google.com/p/v8/issues/detail?id=2291
      return !!(value && objectTypes[typeof value]);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * Note: This is not the same as native `isNaN` which will return `true` for
     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // `NaN` as a primitive is the only value that is not equal to itself
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(undefined);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is a number.
     *
     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(8.4 * 5);
     * // => true
     */
    function isNumber(value) {
      return typeof value == 'number' ||
        value && typeof value == 'object' && toString.call(value) == numberClass || false;
    }

    /**
     * Checks if `value` is an object created by the `Object` constructor.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * _.isPlainObject(new Shape);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     */
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
      if (!(value && toString.call(value) == objectClass)) {
        return false;
      }
      var valueOf = value.valueOf,
          objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

      return objProto
        ? (value == objProto || getPrototypeOf(value) == objProto)
        : shimIsPlainObject(value);
    };

    /**
     * Checks if `value` is a regular expression.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.
     * @example
     *
     * _.isRegExp(/fred/);
     * // => true
     */
    function isRegExp(value) {
      return value && typeof value == 'object' && toString.call(value) == regexpClass || false;
    }

    /**
     * Checks if `value` is a string.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
     * @example
     *
     * _.isString('fred');
     * // => true
     */
    function isString(value) {
      return typeof value == 'string' ||
        value && typeof value == 'object' && toString.call(value) == stringClass || false;
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     */
    function isUndefined(value) {
      return typeof value == 'undefined';
    }

    /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new object with values of the results of each `callback` execution.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(num) { return num * 3; });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     *
     * var characters = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // using "_.pluck" callback shorthand
     * _.mapValues(characters, 'age');
     * // => { 'fred': 40, 'pebbles': 1 }
     */
    function mapValues(object, callback, thisArg) {
      var result = {};
      callback = lodash.createCallback(callback, thisArg, 3);

      forOwn(object, function(value, key, object) {
        result[key] = callback(value, key, object);
      });
      return result;
    }

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * will overwrite property assignments of previous sources. If a callback is
     * provided it will be executed to produce the merged values of the destination
     * and source properties. If the callback returns `undefined` merging will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var names = {
     *   'characters': [
     *     { 'name': 'barney' },
     *     { 'name': 'fred' }
     *   ]
     * };
     *
     * var ages = {
     *   'characters': [
     *     { 'age': 36 },
     *     { 'age': 40 }
     *   ]
     * };
     *
     * _.merge(names, ages);
     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }
     *
     * var food = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var otherFood = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(food, otherFood, function(a, b) {
     *   return _.isArray(a) ? a.concat(b) : undefined;
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
     */
    function merge(object) {
      var args = arguments,
          length = 2;

      if (!isObject(object)) {
        return object;
      }
      // allows working with `_.reduce` and `_.reduceRight` without using
      // their `index` and `collection` arguments
      if (typeof args[2] != 'number') {
        length = args.length;
      }
      if (length > 3 && typeof args[length - 2] == 'function') {
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
      } else if (length > 2 && typeof args[length - 1] == 'function') {
        callback = args[--length];
      }
      var sources = slice(arguments, 1, length),
          index = -1,
          stackA = getArray(),
          stackB = getArray();

      while (++index < length) {
        baseMerge(object, sources[index], callback, stackA, stackB);
      }
      releaseArray(stackA);
      releaseArray(stackB);
      return object;
    }

    /**
     * Creates a shallow clone of `object` excluding the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` omitting the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The properties to omit or the
     *  function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object without the omitted properties.
     * @example
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');
     * // => { 'name': 'fred' }
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {
     *   return typeof value == 'number';
     * });
     * // => { 'name': 'fred' }
     */
    function omit(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var props = [];
        forIn(object, function(value, key) {
          props.push(key);
        });
        props = baseDifference(props, baseFlatten(arguments, true, false, 1));

        var index = -1,
            length = props.length;

        while (++index < length) {
          var key = props[index];
          result[key] = object[key];
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (!callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * Creates a two dimensional array of an object's key-value pairs,
     * i.e. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)
     */
    function pairs(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates a shallow clone of `object` composed of the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` picking the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The function called per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object composed of the picked properties.
     * @example
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');
     * // => { 'name': 'fred' }
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {
     *   return key.charAt(0) != '_';
     * });
     * // => { 'name': 'fred' }
     */
    function pick(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var index = -1,
            props = baseFlatten(arguments, true, false, 1),
            length = isObject(object) ? props.length : 0;

        while (++index < length) {
          var key = props[index];
          if (key in object) {
            result[key] = object[key];
          }
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * An alternative to `_.reduce` this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own
     * enumerable properties through a callback, with each callback execution
     * potentially mutating the `accumulator` object. The callback is bound to
     * `thisArg` and invoked with four arguments; (accumulator, value, key, object).
     * Callbacks may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
     *   num *= num;
     *   if (num % 2) {
     *     return result.push(num) < 3;
     *   }
     * });
     * // => [1, 9, 25]
     *
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     * });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function transform(object, callback, accumulator, thisArg) {
      var isArr = isArray(object);
      if (accumulator == null) {
        if (isArr) {
          accumulator = [];
        } else {
          var ctor = object && object.constructor,
              proto = ctor && ctor.prototype;

          accumulator = baseCreate(proto);
        }
      }
      if (callback) {
        callback = lodash.createCallback(callback, thisArg, 4);
        (isArr ? forEach : forOwn)(object, function(value, index, object) {
          return callback(accumulator, value, index, object);
        });
      }
      return accumulator;
    }

    /**
     * Creates an array composed of the own enumerable property values of `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property values.
     * @example
     *
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3] (property order is not guaranteed across environments)
     */
    function values(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array of elements from the specified indexes, or keys, of the
     * `collection`. Indexes may be specified as individual arguments or as arrays
     * of indexes.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`
     *   to retrieve, specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns a new array of elements corresponding to the
     *  provided indexes.
     * @example
     *
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
     * // => ['a', 'c', 'e']
     *
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);
     * // => ['fred', 'pebbles']
     */
    function at(collection) {
      var args = arguments,
          index = -1,
          props = baseFlatten(args, true, false, 1),
          length = (args[2] && args[2][args[1]] === collection) ? 1 : props.length,
          result = Array(length);

      while(++index < length) {
        result[index] = collection[props[index]];
      }
      return result;
    }

    /**
     * Checks if a given value is present in a collection using strict equality
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the
     * offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @alias include
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {*} target The value to check for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.
     * @example
     *
     * _.contains([1, 2, 3], 1);
     * // => true
     *
     * _.contains([1, 2, 3], 1, 2);
     * // => false
     *
     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.contains('pebbles', 'eb');
     * // => true
     */
    function contains(collection, target, fromIndex) {
      var index = -1,
          indexOf = getIndexOf(),
          length = collection ? collection.length : 0,
          result = false;

      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
      if (isArray(collection)) {
        result = indexOf(collection, target, fromIndex) > -1;
      } else if (typeof length == 'number') {
        result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;
      } else {
        forOwn(collection, function(value) {
          if (++index >= fromIndex) {
            return !(result = value === target);
          }
        });
      }
      return result;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through the callback. The corresponding value
     * of each key is the number of times the key was returned by the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);
    });

    /**
     * Checks if the given callback returns truey value for **all** elements of
     * a collection. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if all elements passed the callback check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes']);
     * // => false
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.every(characters, 'age');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.every(characters, { 'age': 36 });
     * // => false
     */
    function every(collection, callback, thisArg) {
      var result = true;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if (!(result = !!callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return (result = !!callback(value, index, collection));
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning an array of all elements
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that passed the callback check.
     * @example
     *
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [2, 4, 6]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.filter(characters, 'blocked');
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     *
     * // using "_.where" callback shorthand
     * _.filter(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     */
    function filter(collection, callback, thisArg) {
      var result = [];
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            result.push(value);
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result.push(value);
          }
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning the first element that
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect, findWhere
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.find(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => { 'name': 'barney', 'age': 36, 'blocked': false }
     *
     * // using "_.where" callback shorthand
     * _.find(characters, { 'age': 1 });
     * // =>  { 'name': 'pebbles', 'age': 1, 'blocked': false }
     *
     * // using "_.pluck" callback shorthand
     * _.find(characters, 'blocked');
     * // => { 'name': 'fred', 'age': 40, 'blocked': true }
     */
    function find(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            return value;
          }
        }
      } else {
        var result;
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result = value;
            return false;
          }
        });
        return result;
      }
    }

    /**
     * This method is like `_.find` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(num) {
     *   return num % 2 == 1;
     * });
     * // => 3
     */
    function findLast(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forEachRight(collection, function(value, index, collection) {
        if (callback(value, index, collection)) {
          result = value;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over elements of a collection, executing the callback for each
     * element. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * Note: As with other "Collections" methods, objects with a `length` property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
     * // => logs each number and returns '1,2,3'
     *
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
     * // => logs each number and returns the object (property order is not guaranteed across environments)
     */
    function forEach(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (++index < length) {
          if (callback(collection[index], index, collection) === false) {
            break;
          }
        }
      } else {
        forOwn(collection, callback);
      }
      return collection;
    }

    /**
     * This method is like `_.forEach` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');
     * // => logs each number from right to left and returns '3,2,1'
     */
    function forEachRight(collection, callback, thisArg) {
      var length = collection ? collection.length : 0;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (length--) {
          if (callback(collection[length], length, collection) === false) {
            break;
          }
        }
      } else {
        var props = keys(collection);
        length = props.length;
        forOwn(collection, function(value, key, collection) {
          key = props ? props[--length] : --length;
          return callback(collection[key], key, collection);
        });
      }
      return collection;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of a collection through the callback. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using "_.pluck" callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of the collection through the given callback. The corresponding
     * value of each key is the last element responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keys = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keys, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(characters, function(key) { this.fromCharCode(key.code); }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function(result, value, key) {
      result[key] = value;
    });

    /**
     * Invokes the method named by `methodName` on each element in the `collection`
     * returning an array of the results of each invoked method. Additional arguments
     * will be provided to each invoked method. If `methodName` is a function it
     * will be invoked for, and `this` bound to, each element in the `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|string} methodName The name of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [arg] Arguments to invoke the method with.
     * @returns {Array} Returns a new array of the results of each invoked method.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    function invoke(collection, methodName) {
      var args = slice(arguments, 2),
          index = -1,
          isFunc = typeof methodName == 'function',
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
      });
      return result;
    }

    /**
     * Creates an array of values by running each element in the collection
     * through the callback. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of the results of each `callback` execution.
     * @example
     *
     * _.map([1, 2, 3], function(num) { return num * 3; });
     * // => [3, 6, 9]
     *
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
     * // => [3, 6, 9] (property order is not guaranteed across environments)
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(characters, 'name');
     * // => ['barney', 'fred']
     */
    function map(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        var result = Array(length);
        while (++index < length) {
          result[index] = callback(collection[index], index, collection);
        }
      } else {
        result = [];
        forOwn(collection, function(value, key, collection) {
          result[++index] = callback(value, key, collection);
        });
      }
      return result;
    }

    /**
     * Retrieves the maximum value of a collection. If the collection is empty or
     * falsey `-Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.max(characters, function(chr) { return chr.age; });
     * // => { 'name': 'fred', 'age': 40 };
     *
     * // using "_.pluck" callback shorthand
     * _.max(characters, 'age');
     * // => { 'name': 'fred', 'age': 40 };
     */
    function max(collection, callback, thisArg) {
      var computed = -Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value > result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current > computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the minimum value of a collection. If the collection is empty or
     * falsey `Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.min(characters, function(chr) { return chr.age; });
     * // => { 'name': 'barney', 'age': 36 };
     *
     * // using "_.pluck" callback shorthand
     * _.min(characters, 'age');
     * // => { 'name': 'barney', 'age': 36 };
     */
    function min(collection, callback, thisArg) {
      var computed = Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value < result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current < computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the value of a specified property from all elements in the collection.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {string} property The name of the property to pluck.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.pluck(characters, 'name');
     * // => ['barney', 'fred']
     */
    var pluck = map;

    /**
     * Reduces a collection to a value which is the accumulated result of running
     * each element in the collection through the callback, where each successive
     * callback execution consumes the return value of the previous execution. If
     * `accumulator` is not provided the first element of the collection will be
     * used as the initial `accumulator` value. The callback is bound to `thisArg`
     * and invoked with four arguments; (accumulator, value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var sum = _.reduce([1, 2, 3], function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function reduce(collection, callback, accumulator, thisArg) {
      if (!collection) return accumulator;
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);

      var index = -1,
          length = collection.length;

      if (typeof length == 'number') {
        if (noaccum) {
          accumulator = collection[++index];
        }
        while (++index < length) {
          accumulator = callback(accumulator, collection[index], index, collection);
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          accumulator = noaccum
            ? (noaccum = false, value)
            : callback(accumulator, value, index, collection)
        });
      }
      return accumulator;
    }

    /**
     * This method is like `_.reduce` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var list = [[0, 1], [2, 3], [4, 5]];
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, callback, accumulator, thisArg) {
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);
      forEachRight(collection, function(value, index, collection) {
        accumulator = noaccum
          ? (noaccum = false, value)
          : callback(accumulator, value, index, collection);
      });
      return accumulator;
    }

    /**
     * The opposite of `_.filter` this method returns the elements of a
     * collection that the callback does **not** return truey for.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that failed the callback check.
     * @example
     *
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [1, 3, 5]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.reject(characters, 'blocked');
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     *
     * // using "_.where" callback shorthand
     * _.reject(characters, { 'age': 36 });
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     */
    function reject(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);
      return filter(collection, function(value, index, collection) {
        return !callback(value, index, collection);
      });
    }

    /**
     * Retrieves a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Allows working with functions like `_.map`
     *  without using their `index` arguments as `n`.
     * @returns {Array} Returns the random sample(s) of `collection`.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      if (collection && typeof collection.length != 'number') {
        collection = values(collection);
      }
      if (n == null || guard) {
        return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;
      }
      var result = shuffle(collection);
      result.length = nativeMin(nativeMax(0, n), result.length);
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the Fisher-Yates
     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns a new shuffled collection.
     * @example
     *
     * _.shuffle([1, 2, 3, 4, 5, 6]);
     * // => [4, 1, 6, 3, 5, 2]
     */
    function shuffle(collection) {
      var index = -1,
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        var rand = baseRandom(0, ++index);
        result[index] = result[rand];
        result[rand] = value;
      });
      return result;
    }

    /**
     * Gets the size of the `collection` by returning `collection.length` for arrays
     * and array-like objects or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns `collection.length` or number of own enumerable properties.
     * @example
     *
     * _.size([1, 2]);
     * // => 2
     *
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
     * // => 3
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      var length = collection ? collection.length : 0;
      return typeof length == 'number' ? length : keys(collection).length;
    }

    /**
     * Checks if the callback returns a truey value for **any** element of a
     * collection. The function returns as soon as it finds a passing value and
     * does not iterate over the entire collection. The callback is bound to
     * `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if any element passed the callback check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.some(characters, 'blocked');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.some(characters, { 'age': 1 });
     * // => false
     */
    function some(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if ((result = callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return !(result = callback(value, index, collection));
        });
      }
      return !!result;
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through the callback. This method
     * performs a stable sort, that is, it will preserve the original sort order
     * of equal elements. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an array of property names is provided for `callback` the collection
     * will be sorted by each property value.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of sorted elements.
     * @example
     *
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
     * // => [3, 1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'barney',  'age': 26 },
     *   { 'name': 'fred',    'age': 30 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(_.sortBy(characters, 'age'), _.values);
     * // => [['barney', 26], ['fred', 30], ['barney', 36], ['fred', 40]]
     *
     * // sorting by multiple properties
     * _.map(_.sortBy(characters, ['name', 'age']), _.values);
     * // = > [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]
     */
    function sortBy(collection, callback, thisArg) {
      var index = -1,
          isArr = isArray(callback),
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      if (!isArr) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      forEach(collection, function(value, key, collection) {
        var object = result[++index] = getObject();
        if (isArr) {
          object.criteria = map(callback, function(key) { return value[key]; });
        } else {
          (object.criteria = getArray())[0] = callback(value, key, collection);
        }
        object.index = index;
        object.value = value;
      });

      length = result.length;
      result.sort(compareAscending);
      while (length--) {
        var object = result[length];
        result[length] = object.value;
        if (!isArr) {
          releaseArray(object.criteria);
        }
        releaseObject(object);
      }
      return result;
    }

    /**
     * Converts the `collection` to an array.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to convert.
     * @returns {Array} Returns the new converted array.
     * @example
     *
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
     * // => [2, 3, 4]
     */
    function toArray(collection) {
      if (collection && typeof collection.length == 'number') {
        return slice(collection);
      }
      return values(collection);
    }

    /**
     * Performs a deep comparison of each element in a `collection` to the given
     * `properties` object, returning an array of all elements that have equivalent
     * property values.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Object} props The object of property values to filter by.
     * @returns {Array} Returns a new array of elements that have the given properties.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * _.where(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'pets': ['hoppy'] }]
     *
     * _.where(characters, { 'pets': ['dino'] });
     * // => [{ 'name': 'fred', 'age': 40, 'pets': ['baby puss', 'dino'] }]
     */
    var where = filter;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are all falsey.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Creates an array excluding all values of the provided arrays using strict
     * equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
     * // => [1, 3, 4]
     */
    function difference(array) {
      return baseDifference(array, baseFlatten(arguments, true, true, 1));
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.findIndex(characters, function(chr) {
     *   return chr.age < 20;
     * });
     * // => 2
     *
     * // using "_.where" callback shorthand
     * _.findIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findIndex(characters, 'blocked');
     * // => 1
     */
    function findIndex(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        if (callback(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': true },
     *   { 'name': 'fred',    'age': 40, 'blocked': false },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }
     * ];
     *
     * _.findLastIndex(characters, function(chr) {
     *   return chr.age > 30;
     * });
     * // => 1
     *
     * // using "_.where" callback shorthand
     * _.findLastIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findLastIndex(characters, 'blocked');
     * // => 2
     */
    function findLastIndex(array, callback, thisArg) {
      var length = array ? array.length : 0;
      callback = lodash.createCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(array[length], length, array)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * Gets the first element or first `n` elements of an array. If a callback
     * is provided elements at the beginning of the array are returned as long
     * as the callback returns truey. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias head, take
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the first element(s) of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.first([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false, 'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.first(characters, 'blocked');
     * // => [{ 'name': 'barney', 'blocked': true, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');
     * // => ['barney', 'fred']
     */
    function first(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = -1;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[0] : undefined;
        }
      }
      return slice(array, 0, nativeMin(nativeMax(0, n), length));
    }

    /**
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`
     * is truey, the array will only be flattened a single level. If a callback
     * is provided each element of the array is passed through the callback before
     * flattening. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new flattened array.
     * @example
     *
     * _.flatten([1, [2], [3, [[4]]]]);
     * // => [1, 2, 3, 4];
     *
     * _.flatten([1, [2], [3, [[4]]]], true);
     * // => [1, 2, 3, [[4]]];
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.flatten(characters, 'pets');
     * // => ['hoppy', 'baby puss', 'dino']
     */
    function flatten(array, isShallow, callback, thisArg) {
      // juggle arguments
      if (typeof isShallow != 'boolean' && isShallow != null) {
        thisArg = callback;
        callback = (typeof isShallow != 'function' && thisArg && thisArg[isShallow] === array) ? null : isShallow;
        isShallow = false;
      }
      if (callback != null) {
        array = map(array, callback, thisArg);
      }
      return baseFlatten(array, isShallow);
    }

    /**
     * Gets the index at which the first occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`. If the array is already sorted
     * providing `true` for `fromIndex` will run a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 1
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 4
     *
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      if (typeof fromIndex == 'number') {
        var length = array ? array.length : 0;
        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);
      } else if (fromIndex) {
        var index = sortedIndex(array, value);
        return array[index] === value ? index : -1;
      }
      return baseIndexOf(array, value, fromIndex);
    }

    /**
     * Gets all but the last element or last `n` elements of an array. If a
     * callback is provided elements at the end of the array are excluded from
     * the result as long as the callback returns truey. The callback is bound
     * to `thisArg` and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     *
     * _.initial([1, 2, 3], 2);
     * // => [1]
     *
     * _.initial([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [1]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.initial(characters, 'blocked');
     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');
     * // => ['barney', 'fred']
     */
    function initial(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : callback || n;
      }
      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
    }

    /**
     * Creates an array of unique values present in all provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of shared values.
     * @example
     *
     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2]
     */
    function intersection() {
      var args = [],
          argsIndex = -1,
          argsLength = arguments.length,
          caches = getArray(),
          indexOf = getIndexOf(),
          trustIndexOf = indexOf === baseIndexOf,
          seen = getArray();

      while (++argsIndex < argsLength) {
        var value = arguments[argsIndex];
        if (isArray(value) || isArguments(value)) {
          args.push(value);
          caches.push(trustIndexOf && value.length >= largeArraySize &&
            createCache(argsIndex ? args[argsIndex] : seen));
        }
      }
      var array = args[0],
          index = -1,
          length = array ? array.length : 0,
          result = [];

      outer:
      while (++index < length) {
        var cache = caches[0];
        value = array[index];

        if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
          argsIndex = argsLength;
          (cache || seen).push(value);
          while (--argsIndex) {
            cache = caches[argsIndex];
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
              continue outer;
            }
          }
          result.push(value);
        }
      }
      while (argsLength--) {
        cache = caches[argsLength];
        if (cache) {
          releaseObject(cache);
        }
      }
      releaseArray(caches);
      releaseArray(seen);
      return result;
    }

    /**
     * Gets the last element or last `n` elements of an array. If a callback is
     * provided elements at the end of the array are returned as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the last element(s) of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     *
     * _.last([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.last([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [2, 3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.last(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.last(characters, { 'employer': 'na' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function last(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[length - 1] : undefined;
        }
      }
      return slice(array, nativeMax(0, length - n));
    }

    /**
     * Gets the index at which the last occurrence of `value` is found using strict
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
     * as the offset from the end of the collection.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 4
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 1
     */
    function lastIndexOf(array, value, fromIndex) {
      var index = array ? array.length : 0;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Removes all provided values from the given array using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {...*} [value] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull(array) {
      var args = arguments,
          argsIndex = 0,
          argsLength = args.length,
          length = array ? array.length : 0;

      while (++argsIndex < argsLength) {
        var index = -1,
            value = args[argsIndex];
        while (++index < length) {
          if (array[index] === value) {
            splice.call(array, index--, 1);
            length--;
          }
        }
      }
      return array;
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to but not including `end`. If `start` is less than `stop` a
     * zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns a new range array.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      start = +start || 0;
      step = typeof step == 'number' ? step : (+step || 1);

      if (end == null) {
        end = start;
        start = 0;
      }
      // use `Array(length)` so engines like Chakra and V8 avoid slower modes
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s
      var index = -1,
          length = nativeMax(0, ceil((end - start) / (step || 1))),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Removes all elements from an array that the callback returns truey for
     * and returns an array of removed elements. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4, 5, 6];
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });
     *
     * console.log(array);
     * // => [1, 3, 5]
     *
     * console.log(evens);
     * // => [2, 4, 6]
     */
    function remove(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (callback(value, index, array)) {
          result.push(value);
          splice.call(array, index--, 1);
          length--;
        }
      }
      return result;
    }

    /**
     * The opposite of `_.initial` this method gets all but the first element or
     * first `n` elements of an array. If a callback function is provided elements
     * at the beginning of the array are excluded from the result as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias drop, tail
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     *
     * _.rest([1, 2, 3], 2);
     * // => [3]
     *
     * _.rest([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true, 'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.rest(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.rest(characters, { 'employer': 'slate' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function rest(array, callback, thisArg) {
      if (typeof callback != 'number' && callback != null) {
        var n = 0,
            index = -1,
            length = array ? array.length : 0;

        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);
      }
      return slice(array, n);
    }

    /**
     * Uses a binary search to determine the smallest index at which a value
     * should be inserted into a given sorted array in order to maintain the sort
     * order of the array. If a callback is provided it will be executed for
     * `value` and each element of `array` to compute their sort ranking. The
     * callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([20, 30, 50], 40);
     * // => 2
     *
     * // using "_.pluck" callback shorthand
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 2
     *
     * var dict = {
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
     * };
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return dict.wordToNumber[word];
     * });
     * // => 2
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return this.wordToNumber[word];
     * }, dict);
     * // => 2
     */
    function sortedIndex(array, value, callback, thisArg) {
      var low = 0,
          high = array ? array.length : low;

      // explicitly reference `identity` for better inlining in Firefox
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
      value = callback(value);

      while (low < high) {
        var mid = (low + high) >>> 1;
        (callback(array[mid]) < value)
          ? low = mid + 1
          : high = mid;
      }
      return low;
    }

    /**
     * Creates an array of unique values, in order, of the provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of combined values.
     * @example
     *
     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2, 3, 5, 4]
     */
    function union() {
      return baseUniq(baseFlatten(arguments, true, true));
    }

    /**
     * Creates a duplicate-value-free version of an array using strict equality
     * for comparisons, i.e. `===`. If the array is sorted, providing
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided
     * each element of `array` is passed through the callback before uniqueness
     * is computed. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a duplicate-value-free array.
     * @example
     *
     * _.uniq([1, 2, 1, 3, 1]);
     * // => [1, 2, 3]
     *
     * _.uniq([1, 1, 2, 2, 3], true);
     * // => [1, 2, 3]
     *
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
     * // => ['A', 'b', 'C']
     *
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
     * // => [1, 2.5, 3]
     *
     * // using "_.pluck" callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, callback, thisArg) {
      // juggle arguments
      if (typeof isSorted != 'boolean' && isSorted != null) {
        thisArg = callback;
        callback = (typeof isSorted != 'function' && thisArg && thisArg[isSorted] === array) ? null : isSorted;
        isSorted = false;
      }
      if (callback != null) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      return baseUniq(array, isSorted, callback);
    }

    /**
     * Creates an array excluding all provided values using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to filter.
     * @param {...*} [value] The values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
     * // => [2, 3, 4]
     */
    function without(array) {
      return baseDifference(array, slice(arguments, 1));
    }

    /**
     * Creates an array that is the symmetric difference of the provided arrays.
     * See http://en.wikipedia.org/wiki/Symmetric_difference.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of values.
     * @example
     *
     * _.xor([1, 2, 3], [5, 2, 1, 4]);
     * // => [3, 5, 4]
     *
     * _.xor([1, 2, 5], [2, 3, 5], [3, 4, 5]);
     * // => [1, 4, 5]
     */
    function xor() {
      var index = -1,
          length = arguments.length;

      while (++index < length) {
        var array = arguments[index];
        if (isArray(array) || isArguments(array)) {
          var result = result
            ? baseUniq(baseDifference(result, array).concat(baseDifference(array, result)))
            : array;
        }
      }
      return result || [];
    }

    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second
     * elements of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @alias unzip
     * @category Arrays
     * @param {...Array} [array] Arrays to process.
     * @returns {Array} Returns a new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
    function zip() {
      var array = arguments.length > 1 ? arguments : arguments[0],
          index = -1,
          length = array ? max(pluck(array, 'length')) : 0,
          result = Array(length < 0 ? 0 : length);

      while (++index < length) {
        result[index] = pluck(array, index);
      }
      return result;
    }

    /**
     * Creates an object composed from arrays of `keys` and `values`. Provide
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`
     * or two arrays, one of `keys` and one of corresponding `values`.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Arrays
     * @param {Array} keys The array of keys.
     * @param {Array} [values=[]] The array of values.
     * @returns {Object} Returns an object composed of the given keys and
     *  corresponding values.
     * @example
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
    function zipObject(keys, values) {
      var index = -1,
          length = keys ? keys.length : 0,
          result = {};

      if (!values && length && !isArray(keys[0])) {
        values = [];
      }
      while (++index < length) {
        var key = keys[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that executes `func`, with  the `this` binding and
     * arguments of the created function, only after being called `n` times.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {number} n The number of times the function must be called before
     *  `func` is executed.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('Done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'Done saving!', after all saves have completed
     */
    function after(n, func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with the `this`
     * binding of `thisArg` and prepends any additional `bind` arguments to those
     * provided to the bound function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var func = function(greeting) {
     *   return greeting + ' ' + this.name;
     * };
     *
     * func = _.bind(func, { 'name': 'fred' }, 'hi');
     * func();
     * // => 'hi fred'
     */
    function bind(func, thisArg) {
      return arguments.length > 2
        ? createWrapper(func, 17, slice(arguments, 2), null, thisArg)
        : createWrapper(func, 1, null, null, thisArg);
    }

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all the function properties
     * of `object` will be bound.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...string} [methodName] The object method names to
     *  bind, specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() { console.log('clicked ' + this.label); }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs', when the button is clicked
     */
    function bindAll(object) {
      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),
          index = -1,
          length = funcs.length;

      while (++index < length) {
        var key = funcs[index];
        object[key] = createWrapper(object[key], 1, null, null, object);
      }
      return object;
    }

    /**
     * Creates a function that, when called, invokes the method at `object[key]`
     * and prepends any additional `bindKey` arguments to those provided to the bound
     * function. This method differs from `_.bind` by allowing bound functions to
     * reference methods that will be redefined or don't yet exist.
     * See http://michaux.ca/articles/lazy-function-definition-pattern.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'name': 'fred',
     *   'greet': function(greeting) {
     *     return greeting + ' ' + this.name;
     *   }
     * };
     *
     * var func = _.bindKey(object, 'greet', 'hi');
     * func();
     * // => 'hi fred'
     *
     * object.greet = function(greeting) {
     *   return greeting + 'ya ' + this.name + '!';
     * };
     *
     * func();
     * // => 'hiya fred!'
     */
    function bindKey(object, key) {
      return arguments.length > 2
        ? createWrapper(key, 19, slice(arguments, 2), null, object)
        : createWrapper(key, 3, null, null, object);
    }

    /**
     * Creates a function that is the composition of the provided functions,
     * where each function consumes the return value of the function that follows.
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
     * Each function is executed with the `this` binding of the composed function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {...Function} [func] Functions to compose.
     * @returns {Function} Returns the new composed function.
     * @example
     *
     * var realNameMap = {
     *   'pebbles': 'penelope'
     * };
     *
     * var format = function(name) {
     *   name = realNameMap[name.toLowerCase()] || name;
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
     * };
     *
     * var greet = function(formatted) {
     *   return 'Hiya ' + formatted + '!';
     * };
     *
     * var welcome = _.compose(greet, format);
     * welcome('pebbles');
     * // => 'Hiya Penelope!'
     */
    function compose() {
      var funcs = arguments,
          length = funcs.length;

      while (length--) {
        if (!isFunction(funcs[length])) {
          throw new TypeError;
        }
      }
      return function() {
        var args = arguments,
            length = funcs.length;

        while (length--) {
          args = [funcs[length].apply(this, args)];
        }
        return args[0];
      };
    }

    /**
     * Creates a function which accepts one or more arguments of `func` that when
     * invoked either executes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` can be specified
     * if `func.length` is not sufficient.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var curried = _.curry(function(a, b, c) {
     *   console.log(a + b + c);
     * });
     *
     * curried(1)(2)(3);
     * // => 6
     *
     * curried(1, 2)(3);
     * // => 6
     *
     * curried(1, 2, 3);
     * // => 6
     */
    function curry(func, arity) {
      arity = typeof arity == 'number' ? arity : (+arity || func.length);
      return createWrapper(func, 4, null, null, null, arity);
    }

    /**
     * Creates a function that will delay the execution of `func` until after
     * `wait` milliseconds have elapsed since the last time it was invoked.
     * Provide an options object to indicate that `func` should be invoked on
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
     * to the debounced function will return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to debounce.
     * @param {number} wait The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * var lazyLayout = _.debounce(calculateLayout, 150);
     * jQuery(window).on('resize', lazyLayout);
     *
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * });
     *
     * // ensure `batchLog` is executed once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * source.addEventListener('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }, false);
     */
    function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          maxWait = false,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      wait = nativeMax(0, wait) || 0;
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = options.leading;
        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      var delayed = function() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0) {
          if (maxTimeoutId) {
            clearTimeout(maxTimeoutId);
          }
          var isCalled = trailingCall;
          maxTimeoutId = timeoutId = trailingCall = undefined;
          if (isCalled) {
            lastCalled = now();
            result = func.apply(thisArg, args);
            if (!timeoutId && !maxTimeoutId) {
              args = thisArg = null;
            }
          }
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      };

      var maxDelayed = function() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (trailing || (maxWait !== wait)) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = null;
          }
        }
      };

      return function() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          }
          else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        }
        else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = null;
        }
        return result;
      };
    }

    /**
     * Defers executing the `func` function until the current call stack has cleared.
     * Additional arguments will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to defer.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) { console.log(text); }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
    function defer(func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 1);
      return setTimeout(function() { func.apply(undefined, args); }, 1);
    }

    /**
     * Executes the `func` function after `wait` milliseconds. Additional arguments
     * will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay execution.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) { console.log(text); }, 1000, 'later');
     * // => logs 'later' after one second
     */
    function delay(func, wait) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 2);
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it will be used to determine the cache key for storing the result
     * based on the arguments provided to the memoized function. By default, the
     * first argument provided to the memoized function is used as the cache key.
     * The `func` is executed with the `this` binding of the memoized function.
     * The result cache is exposed as the `cache` property on the memoized function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] A function used to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var fibonacci = _.memoize(function(n) {
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
     * });
     *
     * fibonacci(9)
     * // => 34
     *
     * var data = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // modifying the result cache
     * var get = _.memoize(function(name) { return data[name]; }, _.identity);
     * get('pebbles');
     * // => { 'name': 'pebbles', 'age': 1 }
     *
     * get.cache.pebbles.name = 'penelope';
     * get('pebbles');
     * // => { 'name': 'penelope', 'age': 1 }
     */
    function memoize(func, resolver) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var memoized = function() {
        var cache = memoized.cache,
            key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];

        return hasOwnProperty.call(cache, key)
          ? cache[key]
          : (cache[key] = func.apply(this, arguments));
      }
      memoized.cache = {};
      return memoized;
    }

    /**
     * Creates a function that is restricted to execute `func` once. Repeat calls to
     * the function will return the value of the first call. The `func` is executed
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` executes `createApplication` once
     */
    function once(func) {
      var ran,
          result;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (ran) {
          return result;
        }
        ran = true;
        result = func.apply(this, arguments);

        // clear the `func` variable so the function may be garbage collected
        func = null;
        return result;
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with any additional
     * `partial` arguments prepended to those provided to the new function. This
     * method is similar to `_.bind` except it does **not** alter the `this` binding.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) { return greeting + ' ' + name; };
     * var hi = _.partial(greet, 'hi');
     * hi('fred');
     * // => 'hi fred'
     */
    function partial(func) {
      return createWrapper(func, 16, slice(arguments, 1));
    }

    /**
     * This method is like `_.partial` except that `partial` arguments are
     * appended to those provided to the new function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);
     *
     * var options = {
     *   'variable': 'data',
     *   'imports': { 'jq': $ }
     * };
     *
     * defaultsDeep(options, _.templateSettings);
     *
     * options.variable
     * // => 'data'
     *
     * options.imports
     * // => { '_': _, 'jq': $ }
     */
    function partialRight(func) {
      return createWrapper(func, 32, null, slice(arguments, 1));
    }

    /**
     * Creates a function that, when executed, will only call the `func` function
     * at most once per every `wait` milliseconds. Provide an options object to
     * indicate that `func` should be invoked on the leading and/or trailing edge
     * of the `wait` timeout. Subsequent calls to the throttled function will
     * return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to throttle.
     * @param {number} wait The number of milliseconds to throttle executions to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * var throttled = _.throttle(updatePosition, 100);
     * jQuery(window).on('scroll', throttled);
     *
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? options.leading : leading;
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      debounceOptions.leading = leading;
      debounceOptions.maxWait = wait;
      debounceOptions.trailing = trailing;

      return debounce(func, wait, debounceOptions);
    }

    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Additional arguments provided to the function are appended
     * to those provided to the wrapper function. The wrapper is executed with
     * the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('Fred, Wilma, & Pebbles');
     * // => '<p>Fred, Wilma, &amp; Pebbles</p>'
     */
    function wrap(value, wrapper) {
      return createWrapper(wrapper, 16, [value]);
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var getter = _.constant(object);
     * getter() === object;
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    /**
     * Produces a callback bound to an optional `thisArg`. If `func` is a property
     * name the created callback will return the property value for a given element.
     * If `func` is an object the created callback will return `true` for elements
     * that contain the equivalent object properties, otherwise it will return `false`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
     *   return !match ? func(callback, thisArg) : function(object) {
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(characters, 'age__gt38');
     * // => [{ 'name': 'fred', 'age': 40 }]
     */
    function createCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (func == null || type == 'function') {
        return baseCreateCallback(func, thisArg, argCount);
      }
      // handle "_.pluck" style callback shorthands
      if (type != 'object') {
        return property(func);
      }
      var props = keys(func),
          key = props[0],
          a = func[key];

      // handle "_.where" style callback shorthands
      if (props.length == 1 && a === a && !isObject(a)) {
        // fast path the common case of providing an object with a single
        // property containing a primitive value
        return function(object) {
          var b = object[key];
          return a === b && (a !== 0 || (1 / a == 1 / b));
        };
      }
      return function(object) {
        var length = props.length,
            result = false;

        while (length--) {
          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
            break;
          }
        }
        return result;
      };
    }

    /**
     * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
     * corresponding HTML entities.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('Fred, Wilma, & Pebbles');
     * // => 'Fred, Wilma, &amp; Pebbles'
     */
    function escape(string) {
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Adds function properties of a source object to the destination object.
     * If `object` is a function methods will be added to its prototype as well.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Function|Object} [object=lodash] object The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added are chainable.
     * @example
     *
     * function capitalize(string) {
     *   return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
     * }
     *
     * _.mixin({ 'capitalize': capitalize });
     * _.capitalize('fred');
     * // => 'Fred'
     *
     * _('fred').capitalize().value();
     * // => 'Fred'
     *
     * _.mixin({ 'capitalize': capitalize }, { 'chain': false });
     * _('fred').capitalize();
     * // => 'Fred'
     */
    function mixin(object, source, options) {
      var chain = true,
          methodNames = source && functions(source);

      if (!source || (!options && !methodNames.length)) {
        if (options == null) {
          options = source;
        }
        ctor = lodashWrapper;
        source = object;
        object = lodash;
        methodNames = functions(source);
      }
      if (options === false) {
        chain = false;
      } else if (isObject(options) && 'chain' in options) {
        chain = options.chain;
      }
      var ctor = object,
          isFunc = isFunction(ctor);

      forEach(methodNames, function(methodName) {
        var func = object[methodName] = source[methodName];
        if (isFunc) {
          ctor.prototype[methodName] = function() {
            var chainAll = this.__chain__,
                value = this.__wrapped__,
                args = [value];

            push.apply(args, arguments);
            var result = func.apply(object, args);
            if (chain || chainAll) {
              if (value === result && isObject(result)) {
                return this;
              }
              result = new ctor(result);
              result.__chain__ = chainAll;
            }
            return result;
          };
        }
      });
    }

    /**
     * Reverts the '_' variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      context._ = oldDash;
      return this;
    }

    /**
     * A no-operation function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {
      // no operation performed
    }

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var stamp = _.now();
     * _.defer(function() { console.log(_.now() - stamp); });
     * // => logs the number of milliseconds it took for the deferred function to be called
     */
    var now = isNative(now = Date.now) && now || function() {
      return new Date().getTime();
    };

    /**
     * Converts the given value into an integer of the specified radix.
     * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the
     * `value` is a hexadecimal, in which case a `radix` of `16` is used.
     *
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`
     * implementations. See http://es5.github.io/#E.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} value The value to parse.
     * @param {number} [radix] The radix used to interpret the value to parse.
     * @returns {number} Returns the new integer value.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     */
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {
      // Firefox < 21 and Opera < 15 follow the ES3 specified implementation of `parseInt`
      return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
    };

    /**
     * Creates a "_.pluck" style function, which returns the `key` value of a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} key The name of the property to retrieve.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var characters = [
     *   { 'name': 'fred',   'age': 40 },
     *   { 'name': 'barney', 'age': 36 }
     * ];
     *
     * var getName = _.property('name');
     *
     * _.map(characters, getName);
     * // => ['barney', 'fred']
     *
     * _.sortBy(characters, getName);
     * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]
     */
    function property(key) {
      return function(object) {
        return object[key];
      };
    }

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number will be
     * returned. If `floating` is truey or either `min` or `max` are floats a
     * floating-point number will be returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating=false] Specify returning a floating-point number.
     * @returns {number} Returns a random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      var noMin = min == null,
          noMax = max == null;

      if (floating == null) {
        if (typeof min == 'boolean' && noMax) {
          floating = min;
          min = 1;
        }
        else if (!noMax && typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      if (floating || min % 1 || max % 1) {
        var rand = nativeRandom();
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1)))), max);
      }
      return baseRandom(min, max);
    }

    /**
     * Resolves the value of property `key` on `object`. If `key` is a function
     * it will be invoked with the `this` binding of `object` and its result returned,
     * else the property value is returned. If `object` is falsey then `undefined`
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to resolve.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = {
     *   'cheese': 'crumpets',
     *   'stuff': function() {
     *     return 'nonsense';
     *   }
     * };
     *
     * _.result(object, 'cheese');
     * // => 'crumpets'
     *
     * _.result(object, 'stuff');
     * // => 'nonsense'
     */
    function result(object, key) {
      if (object) {
        var value = object[key];
        return isFunction(value) ? object[key]() : value;
      }
    }

    /**
     * A micro-templating method that handles arbitrary delimiters, preserves
     * whitespace, and correctly escapes quotes within interpolated code.
     *
     * Note: In the development build, `_.template` utilizes sourceURLs for easier
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
     *
     * For more information on precompiling templates see:
     * http://lodash.com/custom-builds
     *
     * For more information on Chrome extension sandboxes see:
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} text The template text.
     * @param {Object} data The data object used to populate the text.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as local variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [variable] The data object variable name.
     * @returns {Function|string} Returns a compiled function when no `data` object
     *  is given, else it returns the interpolated text.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= name %>');
     * compiled({ 'name': 'fred' });
     * // => 'hello fred'
     *
     * // using the "escape" delimiter to escape HTML in data property values
     * _.template('<b><%- value %></b>', { 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to generate HTML
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
     * _.template('hello ${ name }', { 'name': 'pebbles' });
     * // => 'hello pebbles'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * _.template('<% print("hello " + name); %>!', { 'name': 'barney' });
     * // => 'hello barney!'
     *
     * // using a custom template delimiters
     * _.templateSettings = {
     *   'interpolate': /{{([\s\S]+?)}}/g
     * };
     *
     * _.template('hello {{ name }}!', { 'name': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using the `imports` option to import jQuery
     * var list = '<% jq.each(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { 'jq': jQuery } });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     *   var __t, __p = '', __e = _.escape;
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
     *   return __p;
     * }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(text, data, options) {
      // based on John Resig's `tmpl` implementation
      // http://ejohn.org/blog/javascript-micro-templating/
      // and Laura Doktorova's doT.js
      // https://github.com/olado/doT
      var settings = lodash.templateSettings;
      text = String(text || '');

      // avoid missing dependencies when `iteratorTemplate` is not defined
      options = defaults({}, options, settings);

      var imports = defaults({}, options.imports, settings.imports),
          importsKeys = keys(imports),
          importsValues = values(imports);

      var isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // compile the regexp to match each delimiter
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // escape characters that cannot be included in string literals
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // replace delimiters with snippets
        if (escapeValue) {
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // the JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value
        return match;
      });

      source += "';\n";

      // if `variable` is not specified, wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain
      var variable = options.variable,
          hasVariable = variable;

      if (!hasVariable) {
        variable = 'obj';
        source = 'with (' + variable + ') {\n' + source + '\n}\n';
      }
      // cleanup code by stripping empty strings
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // frame code as the function body
      source = 'function(' + variable + ') {\n' +
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
        "var __t, __p = '', __e = _.escape" +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      // Use a sourceURL for easier debugging.
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
      var sourceURL = '\n/*\n//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\n*/';

      try {
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
      } catch(e) {
        e.source = source;
        throw e;
      }
      if (data) {
        return result(data);
      }
      // provide the compiled function's source by its `toString` method, in
      // supported environments, or the `source` property as a convenience for
      // inlining compiled templates during the build process
      result.source = source;
      return result;
    }

    /**
     * Executes the callback `n` times, returning an array of the results
     * of each callback execution. The callback is bound to `thisArg` and invoked
     * with one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} n The number of times to execute the callback.
     * @param {Function} callback The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns an array of the results of each `callback` execution.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) { mage.castSpell(n); });
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
     *
     * _.times(3, function(n) { this.cast(n); }, mage);
     * // => also calls `mage.castSpell(n)` three times
     */
    function times(n, callback, thisArg) {
      n = (n = +n) > -1 ? n : 0;
      var index = -1,
          result = Array(n);

      callback = baseCreateCallback(callback, thisArg, 1);
      while (++index < n) {
        result[index] = callback(index);
      }
      return result;
    }

    /**
     * The inverse of `_.escape` this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
     * corresponding characters.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('Fred, Barney &amp; Pebbles');
     * // => 'Fred, Barney & Pebbles'
     */
    function unescape(string) {
      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
    }

    /**
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return String(prefix == null ? '' : prefix) + id;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object that wraps the given value with explicit
     * method chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(characters)
     *     .sortBy('age')
     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })
     *     .first()
     *     .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      value = new lodashWrapper(value);
      value.__chain__ = true;
      return value;
    }

    /**
     * Invokes `interceptor` with the `value` as the first argument and then
     * returns `value`. The purpose of this method is to "tap into" a method
     * chain in order to perform operations on intermediate results within
     * the chain.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3, 4])
     *  .tap(function(array) { array.pop(); })
     *  .reverse()
     *  .value();
     * // => [3, 2, 1]
     */
    function tap(value, interceptor) {
      interceptor(value);
      return value;
    }

    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chaining
     * @returns {*} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(characters).first();
     * // => { 'name': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(characters).chain()
     *   .first()
     *   .pick('age')
     *   .value();
     * // => { 'age': 36 }
     */
    function wrapperChain() {
      this.__chain__ = true;
      return this;
    }

    /**
     * Produces the `toString` result of the wrapped value.
     *
     * @name toString
     * @memberOf _
     * @category Chaining
     * @returns {string} Returns the string result.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return String(this.__wrapped__);
    }

    /**
     * Extracts the wrapped value.
     *
     * @name valueOf
     * @memberOf _
     * @alias value
     * @category Chaining
     * @returns {*} Returns the wrapped value.
     * @example
     *
     * _([1, 2, 3]).valueOf();
     * // => [1, 2, 3]
     */
    function wrapperValueOf() {
      return this.__wrapped__;
    }

    /*--------------------------------------------------------------------------*/

    // add functions that return wrapped values when chaining
    lodash.after = after;
    lodash.assign = assign;
    lodash.at = at;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.chain = chain;
    lodash.compact = compact;
    lodash.compose = compose;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.createCallback = createCallback;
    lodash.curry = curry;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.map = map;
    lodash.mapValues = mapValues;
    lodash.max = max;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.min = min;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.property = property;
    lodash.pull = pull;
    lodash.range = range;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.shuffle = shuffle;
    lodash.sortBy = sortBy;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.values = values;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.zip = zip;
    lodash.zipObject = zipObject;

    // add aliases
    lodash.collect = map;
    lodash.drop = rest;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;
    lodash.unzip = zip;

    // add functions to `lodash.prototype`
    mixin(lodash);

    /*--------------------------------------------------------------------------*/

    // add functions that return unwrapped values when chaining
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.contains = contains;
    lodash.escape = escape;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.has = has;
    lodash.identity = identity;
    lodash.indexOf = indexOf;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isNaN = isNaN;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isUndefined = isUndefined;
    lodash.lastIndexOf = lastIndexOf;
    lodash.mixin = mixin;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.result = result;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.template = template;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;

    // add aliases
    lodash.all = every;
    lodash.any = some;
    lodash.detect = find;
    lodash.findWhere = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.include = contains;
    lodash.inject = reduce;

    mixin(function() {
      var source = {}
      forOwn(lodash, function(func, methodName) {
        if (!lodash.prototype[methodName]) {
          source[methodName] = func;
        }
      });
      return source;
    }(), false);

    /*--------------------------------------------------------------------------*/

    // add functions capable of returning wrapped and unwrapped values when chaining
    lodash.first = first;
    lodash.last = last;
    lodash.sample = sample;

    // add aliases
    lodash.take = first;
    lodash.head = first;

    forOwn(lodash, function(func, methodName) {
      var callbackable = methodName !== 'sample';
      if (!lodash.prototype[methodName]) {
        lodash.prototype[methodName]= function(n, guard) {
          var chainAll = this.__chain__,
              result = func(this.__wrapped__, n, guard);

          return !chainAll && (n == null || (guard && !(callbackable && typeof n == 'function')))
            ? result
            : new lodashWrapper(result, chainAll);
        };
      }
    });

    /*--------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = '2.4.1';

    // add "Chaining" functions to the wrapper
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.value = wrapperValueOf;
    lodash.prototype.valueOf = wrapperValueOf;

    // add `Array` functions that return unwrapped values
    forEach(['join', 'pop', 'shift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        var chainAll = this.__chain__,
            result = func.apply(this.__wrapped__, arguments);

        return chainAll
          ? new lodashWrapper(result, chainAll)
          : result;
      };
    });

    // add `Array` functions that return the existing wrapped value
    forEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        func.apply(this.__wrapped__, arguments);
        return this;
      };
    });

    // add `Array` functions that return new wrapped values
    forEach(['concat', 'slice', 'splice'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
      };
    });

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // expose Lo-Dash
  var _ = runInContext();

  // some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash is loaded with a RequireJS shim config.
    // See http://requirejs.org/docs/api.html#config-shim
    root._ = _;

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define(function() {
      return _;
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports && freeModule) {
    // in Node.js or RingoJS
    if (moduleExports) {
      (freeModule.exports = _)._ = _;
    }
    // in Narwhal or Rhino -require
    else {
      freeExports._ = _;
    }
  }
  else {
    // in a browser or Rhino
    root._ = _;
  }
}.call(this));
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
/*global describe: false, it: false, expect: false, require: false */

var labelConvert = require("../../webapp/js/treedrawing/label-convert.ts");
var $ = require("jquery");

describe("The label converter", function () {
    var M = labelConvert.matchMetadataAgainstObject;
    var N = labelConvert.nodeMatchesSpec;
    var mapping = {
        defaults: { PRN: { parenthetical: "yes" }},
        defaultSubcategories: [],
        byLabel : {
            NP: {
                subcategories: ["SBJ","OB1"],
                metadataKeys: {
                    LFD: { key: "left-disloc", value: "yes" },
                    TMP: { key: "semantic", value: { fn: "temporal" }}
                }
            },
            IP: {
                subcategories: ["MAT","SUB"],
                metadataKeys: {
                    TMP: { key: "foo", value: "bar"}
                }
            }
        }
    };
    it("should match simple objects against templates correctly", function () {
        expect(M("x", "y", { x: "y" }));
        expect(!M("x", "y", { x: "z" }));
        expect(M("x", "y", { x: "y", a: "b" }));
        expect(!M("x", "y", {}));
        expect(!M("x", "y", { a: "b" }));
    });
    it("should match complex nodes correctly", function () {
        expect(M("x", { y : "z" }, { x: { y: "z" }}));
        expect(!M("x", { y : "z" }, { x: { y: "a" }}));
        expect(!M("x", { y : "z" }, { x: { a: "z" }}));
        expect(!M("x", { y : "z" }, { x: "y" }));
    });
    it("should match node categories", function () {
        var node = $('<div data-category="X"></div>').get(0);
        expect(N(node, { category: "X" }));
        expect(!N(node, { category: "Y" }));
    });
    it("should match node subcategories", function () {
        var node = $('<div data-subcategory="X"></div>').get(0);
        expect(N(node, { subcategory: "X" }));
        expect(!N(node, { subcategory: "Y" }));
    });
    it("should match node categories with subcategories", function () {
        var node = $('<div data-category="X" data-subcategory="Y"></div>').get(0);
        expect(N(node, { category: "X", subcategory: "Y" }));
        expect(!N(node, { subcategory: "Y" }));
        expect(!N(node, { category: "X" }));
        expect(!N(node, { category: "X", subcategory: "Z" }));
        expect(!N(node, { category: "Z", subcategory: "Y" }));
    });
    it("should match node metadata", function () {
        var node = $('<div data-category="X" data-subcategory="Y"></div>').get(0);
        node.setAttribute("data-metadata",
                          JSON.stringify({ a: "b", x: { y: "z", q: "w" }}));
        expect(N(node, { category: "X" }));
        expect(N(node, { category: "X", subcategory: "Y" }));
        expect(N(node, { category: "X", subcategory: "Y", metadata: { a: "b"}}));
        expect(N(node, { category: "X", subcategory: "Y", metadata: { x: { y: "z" }}}));
        expect(N(node, { metadata: { a: "b"}}));
        expect(N(node, { metadata: { x: { y: "z" }}}));
        expect(N(node, { metadata: { a: "b", x: { y: "z" }}}));

        expect(!N(node, { metadata: { a: "c" }}));
        expect(!N(node, { metadata: { x: { y: "w" }}}));
        expect(!N(node, { metadata: { x: "y" }}));
        expect(!N(node, { metadata: { e: "f" }}));
        expect(!N(node, { metadata: { a: "b", x: { y: "z" }, e: "f" }}));
    });
    it("should properly discern valid subcats", function () {
        expect(1);
        // TODO: how to test private function?
    });
    it("should convert labels to match specs properly", function () {
        var LMS = labelConvert.labelToMatchSpec;
        expect(LMS("NP", mapping)).toEqual({ category: "NP" });
        expect(LMS("NP-SBJ", mapping)).toEqual({ category: "NP", subcategory: "SBJ" });
        expect(LMS("NP-SBJ-TMP", mapping)).toEqual({ category: "NP", subcategory: "SBJ",
                                            metadata: { semantic: {
                                                fn: "temporal"
                                            }}});
        expect(LMS("NP-TMP", mapping)).toEqual({ category: "NP",
                                                 metadata: { semantic: {
                                                     fn: "temporal"
                                                 }}});
    });
    it("should properly set labels on nodes", function () {
        var node = $('<div></div>').get(0);
        var SL = labelConvert.setLabelForNode;
        SL("NP-SBJ", node, mapping);
        expect(node).toHaveAttribute("data-category", "NP");
        expect(node).toHaveAttribute("data-subcategory", "SBJ");

        SL("NP-SBJ", node, mapping, true);
        // Cannot remove the category
        expect(node).toHaveAttribute("data-category", "NP");
        expect(node).not.toHaveAttribute("data-subcategory");

        SL("NP-TMP", node, mapping);
        expect(node).toHaveAttribute("data-category", "NP");
        expect(node).not.toHaveAttribute("data-subcategory");
        expect(node).toHaveAttribute("data-metadata", JSON.stringify(
            { semantic: { fn: "temporal" }}
        ));

        SL("NP-TMP", node, mapping, true);

        expect(node).toHaveAttribute("data-category", "NP");
        expect(node).not.toHaveAttribute("data-subcategory");
        expect(node).not.toHaveAttribute("data-metadata");
    });
});

},{"../../webapp/js/treedrawing/label-convert.ts":18}],3:[function(require,module,exports){
/*global describe: false, it: false, expect: false, require: false */

var parse = require('../../webapp/js/parse.js');

require("../string-matcher");

describe("The parser", function () {
    var xml = '<doc><sentence category="IP" subcategory="MAT"><node' +
            ' category="NP" subcategory="SBJ"><leaf'
            + ' category="PRO">I</leaf></node></sentence></doc>'
      , html = '<div class="snode" data-category="IP" data-subcategory="MAT"><div class="snode"'
            + ' data-category="NP" data-subcategory="SBJ"><div class="snode"'
            + ' data-nodetype="leaf" data-category="PRO"><span '
            + 'class="wnode">I</span></div></div></div>';
    it("should generate correct HTML from XML", function () {
        expect(parse.parseXmlToHtml(xml).innerHTML).toEqualString(html);
    });
    it("should fail", function () {
        expect(false);
    });
});

},{"../../webapp/js/parse.js":6,"../string-matcher":4}],4:[function(require,module,exports){
/*global beforeEach: false, jasmine: false */

beforeEach(function() {
    var matchers = {
        toEqualString:
        function toEqualStringOuter () {
            return { compare:
                     function toEqualString (actual, expected) {
                         var result = {};
                         result.pass = expected === actual;
                         if (result.pass) {
                             result.message = "'" + actual + "' is equal to '" +
                                 expected + "'";
                         } else {
                             var i = 0;
                             while (expected.charAt(i) === actual.charAt(i)) {
                                 i++;
                             }
                             result.message = "Expected '" + actual +
                                 "' to be equal to '" + expected + "'" + "\n" +
                                 "Common prefix: '" + expected.substring(0, i)
                                 + "'\n" + "Differing portion: '" +
                                 expected.substring(i) + "'" + " vs. '" +
                                 actual.substring(i) + "'";
                         }
                         return result;
                     }
                   };
        },
        toHaveAttribute:
        function toHaveAttributeOuter () {
            return { compare:
                     function toHaveAttribute (actual, attribute, value) {
                         var result = {};
                         if (! actual instanceof Element) {
                             result.pass = false;
                             result.message = "Expected a non-Element to have" +
                                 "an attribute.";
                         } else {
                             if (typeof value !== "undefined") {
                                 result.pass = actual.hasAttribute(attribute) &&
                                     actual.getAttribute(attribute) === value;
                                 if (result.pass) {
                                     result.message = "Expected attribute '" +
                                         attribute + "' was '" + value + "'";
                                 } else {
                                     result.message = "Expected attribute '" +
                                         attribute + "' was '" +
                                         actual.getAttribute(attribute) + "'" +
                                         " instead of '" + value + "'";
                                 }
                             } else {
                                 result.pass = actual.hasAttribute(attribute);
                                 result.message = "Expected attribute '" +
                                     attribute + "' was " + (result.pass ? "" :
                                                           "not ") + "found";
                             }
                         }
                         return result;
                   }};
        }
    };

    jasmine.addMatchers(matchers);
});

},{}],5:[function(require,module,exports){
// Generated by CoffeeScript 1.6.3
/*!
 jQuery Growl
 Copyright 2013 Kevin Sylvestre
 1.1.4

 Modified by Aaron Ecay
 */

var $, Animation, Growl,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

$ = require("jquery");

Animation = (function() {
    function Animation() {}

    Animation.transitions = {
        "webkitTransition": "webkitTransitionEnd",
        "mozTransition": "mozTransitionEnd",
        "oTransition": "oTransitionEnd",
        "transition": "transitionend"
    };

    Animation.transition = function($el) {
        var el, result, type, _ref;
        el = $el[0];
        _ref = this.transitions;
        for (type in _ref) {
            result = _ref[type];
            if (el.style[type] != null) {
                return result;
            }
        }
    };

    return Animation;

})();

Growl = (function() {
    Growl.settings = {
        namespace: 'growl',
        duration: 3200,
        close: "&times;",
        location: "default",
        style: "default",
        size: "medium"
    };

    Growl.growl = function(settings) {
        if (settings == null) {
            settings = {};
        }
        this.initialize();
        return new Growl(settings);
    };

    Growl.initialize = function() {
        return $("body:not(:has(#growls))").append('<div id="growls" />');
    };

    function Growl(settings) {
        if (settings == null) {
            settings = {};
        }
        this.html = __bind(this.html, this);
        this.$growl = __bind(this.$growl, this);
        this.$growls = __bind(this.$growls, this);
        this.animate = __bind(this.animate, this);
        this.remove = __bind(this.remove, this);
        this.dismiss = __bind(this.dismiss, this);
        this.present = __bind(this.present, this);
        this.close = __bind(this.close, this);
        this.cycle = __bind(this.cycle, this);
        this.unbind = __bind(this.unbind, this);
        this.bind = __bind(this.bind, this);
        this.render = __bind(this.render, this);
        this.settings = $.extend({}, Growl.settings, settings);
        this.$growls().attr('class', this.settings.location);
        this.render();
    }

    Growl.prototype.render = function() {
        var $growl;
        $growl = this.$growl();
        this.$growls().append($growl);
        this.cycle($growl);
    };

    Growl.prototype.bind = function($growl) {
        if ($growl == null) {
            $growl = this.$growl();
        }
        return $growl.find("." + this.settings.namespace + "-close").on("click", this.close);
    };

    Growl.prototype.unbind = function($growl) {
        if ($growl == null) {
            $growl = this.$growl();
        }
        return $growl.find("." + (this.settings.namespace - close)).off("click", this.close);
    };

    Growl.prototype.cycle = function($growl) {
        if ($growl == null) {
            $growl = this.$growl();
        }
        return $growl.queue(this.present).delay(this.settings.duration).queue(this.dismiss).queue(this.remove);
    };

    Growl.prototype.close = function(event) {
        var $growl;
        event.preventDefault();
        event.stopPropagation();
        $growl = this.$growl();
        return $growl.stop().queue(this.dismiss).queue(this.remove);
    };

    Growl.prototype.present = function(callback) {
        var $growl;
        $growl = this.$growl();
        this.bind($growl);
        return this.animate($growl, "" + this.settings.namespace + "-incoming", 'out', callback);
    };

    Growl.prototype.dismiss = function(callback) {
        var $growl;
        $growl = this.$growl();
        this.unbind($growl);
        return this.animate($growl, "" + this.settings.namespace + "-outgoing", 'in', callback);
    };

    Growl.prototype.remove = function(callback) {
        this.$growl().remove();
        return callback();
    };

    Growl.prototype.animate = function($element, name, direction, callback) {
        var transition;
        if (direction == null) {
            direction = 'in';
        }
        transition = Animation.transition($element);
        $element[direction === 'in' ? 'removeClass' : 'addClass'](name);
        $element.offset().position;
        $element[direction === 'in' ? 'addClass' : 'removeClass'](name);
        if (callback == null) {
            return;
        }
        if (transition != null) {
            $element.one(transition, callback);
        } else {
            callback();
        }
    };

    Growl.prototype.$growls = function() {
        return this.$_growls != null ? this.$_growls : this.$_growls = $('#growls');
    };

    Growl.prototype.$growl = function() {
        return this.$_growl != null ? this.$_growl : this.$_growl = $(this.html());
    };

    Growl.prototype.html = function() {
        return "<div class='" + this.settings.namespace + " " + this.settings.namespace + "-" + this.settings.style + " " + this.settings.namespace + "-" + this.settings.size + "'>\n  <div class='" + this.settings.namespace + "-close'>" + this.settings.close + "</div>\n  <div class='" + this.settings.namespace + "-title'>" + this.settings.title + "</div>\n  <div class='" + this.settings.namespace + "-message'>" + this.settings.message + "</div>\n</div>";
    };

    return Growl;

})();

exports.growl = function(options) {
    if (options == null) {
        options = {};
    }
    return Growl.growl(options);
};

exports.growl.error = function(options) {
    var settings;
    if (options == null) {
        options = {};
    }
    settings = {
        title: "Error!",
        style: "error"
    };
    return exports.growl($.extend(settings, options));
};

exports.growl.notice = function(options) {
    var settings;
    if (options == null) {
        options = {};
    }
    settings = {
        title: "Notice!",
        style: "notice"
    };
    return exports.growl($.extend(settings, options));
};

exports.growl.warning = function(options) {
    var settings;
    if (options == null) {
        options = {};
    }
    settings = {
        title: "Warning!",
        style: "warning"
    };
    return exports.growl($.extend(settings, options));
};

},{}],6:[function(require,module,exports){
/*global DOMParser: false, exports: true */

/*jshint browser: true */

function makeWnode (xmlNode) {
    var wnode = document.createElement("span"),
        tn = document.createTextNode(xmlNode.textContent);
    wnode.className = "wnode";
    wnode.appendChild(tn);
    return wnode;
}

function makeSnode (xmlNode) {
    var snode = document.createElement("div"),
        cn = xmlNode.childNodes,
        atts = xmlNode.attributes,
        c, a, i;
    snode.className = "snode";
    for (i = 0; i < cn.length; i++) {
        c = cn[i];
        if (c.nodeType === 3 && c.textContent.trim() !== "") {
            snode.appendChild(makeWnode(c));
            snode.setAttribute("data-nodetype", xmlNode.nodeName);
        } else if (c.nodeType === 1) {
            snode.appendChild(makeSnode(c));
        }
    }
    for (i = 0; i < atts.length; i++) {
        a = atts[i];
        snode.setAttribute("data-" + a.nodeName, a.nodeValue);
    }
    return snode;
}

exports.parseXmlToHtml = function parseXmlToHtml (xml) {
    var dom = new DOMParser().parseFromString(xml, "text/xml"),
        sn0 = document.createElement("div"),
        rootElement = dom.childNodes[0],
        cn =  rootElement.childNodes,
        c;
    sn0.className = "snode";
    sn0.id = "sn0";
    for (var i = 0; i < cn.length; i++) {
        c = cn[i];
        if (c.nodeType === 1) {
            sn0.appendChild(makeSnode(c));
        }
    }
    // TODO: global attributes
    return sn0;
};

function nodeToXml (doc, node, root) {
    var name, i;
    if (root) {
        name = "sentence";
    } else {
        if (node.nodeType === 1) {
            // Element node
            name = "nonterminal";
        } else {
            // Text node
            name = "terminal";
        }
    }
    var s = doc.createNode(name),
        attrs = node.attributes;
    for (i = 0; i < attrs.length; i++) {
        s.setAttribute(attrs[i].name, attrs[i].value);
    }
    if (node.nodeType === 1) {
        for (i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType === 1 ||
               node.childNodes[i].nodeType === 3) {
                // Element node or text node
                s.appendChild(nodeToXml(node.childNodes[i]));
            }
        }
    }
    return s;
}

exports.parseHtmlToXml = function parseHtmlToXml (node) {
    var doc = document.implementation.createDocument(null, "corpus", null);
    node.each(function () {
        doc.appendChild(nodeToXml(doc, this, true));
    });
};

},{}],7:[function(require,module,exports){
exports.ctrlKeyMap = {};
exports.shiftKeyMap = {};
exports.regularKeyMap = {};

/**
* Add a keybinding command.
*
* Calls to this function should be in the `settings.js` file, grouped in a
* function called `customCommands`
*
* @param {Object} dict a mapping of properties of the keybinding.  Can
* contain:
*
* - `keycode`: the numeric keycode for the binding (mandatory)
* - `shift`: true if this is a binding with shift pressed (optional)
* - `ctrl`: true if this is a binding with control pressed (optional)
*
* @param {Function} fn the function to associate with the keybinding.  Any
* further arguments to the `addCommand` function are passed to `fn` on each
* invocation.
*/
function addCommand(dict, fn) {
    var commandMap;
    if (dict.ctrl) {
        commandMap = exports.ctrlKeyMap;
    } else if (dict.shift) {
        commandMap = exports.shiftKeyMap;
    } else {
        commandMap = exports.regularKeyMap;
    }
    commandMap[dict.keycode] = {
        func: fn,
        args: Array.prototype.slice.call(arguments, 2)
    };
}
exports.addCommand = addCommand;

},{}],8:[function(require,module,exports){
///<reference path="./../../../types/all.d.ts" />
// TODO: type decls
var initialState = {
    ipnodes: [],
    commentTypes: [],
    extensions: [],
    clauseExtensions: [],
    leafExtensions: [],
    caseBarriers: [],
    displayCaseMenu: false,
    caseTags: [],
    casePhrases: [],
    caseMarkers: [],
    defaultConMenuGroup: [],
    customConMenuGroups: [],
    logDetail: false
};

module.exports = initialState;

},{}],9:[function(require,module,exports){
module.exports=require(8)
},{}],10:[function(require,module,exports){
///<reference path="./../../../types/all.d.ts" />
// Copyright (c) 2011 Anton Karl Ingason, Aaron Ecay
// This file is part of the Annotald program for annotating
// phrase-structure treebanks in the Penn Treebank style.
// This file is distributed under the terms of the GNU General
// Public License as published by the Free Software Foundation, either
// version 3 of the License, or (at your option) any later version.
// This program is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser
// General Public License for more details.
// You should have received a copy of the GNU Lesser General Public
// License along with this program.  If not, see
// <http://www.gnu.org/licenses/>.
var _ = require("lodash");
var $ = require("jquery");
var selection = require("./selection");
var undo = require("./undo");
var utils = require("./utils");
var edit = require("./struc-edit");
var conf = require("./config");

var conmenus = {}, conleafs = [], caseMarkers = [];

function resetGlobals() {
    conmenus = {};
    conleafs = [];
    caseMarkers = [];
}
exports.resetGlobals = resetGlobals;

function hideContextMenu() {
    $("#conMenu").css("visibility", "hidden");
}
exports.hideContextMenu = hideContextMenu;

function addConMenu(label, suggestions) {
    conmenus[label] = {
        suggestions: suggestions
    };
}
exports.addConMenu = addConMenu;

function addConLeaf(suggestion, before, label, word) {
    var conleaf = {
        suggestion: suggestion,
        before: before,
        label: label,
        word: word
    };

    conleafs.push(conleaf);
}
exports.addConLeaf = addConLeaf;

function addCaseMarker(marker) {
    caseMarkers.push(marker);
}
exports.addCaseMarker = addCaseMarker;
;

// TODO: addCaseMarkers, plural
/**
* Toggle the extension of a node.
*
* A context menu action function.
*
* @param {Node} node
* @param {String} extension the extension to toggle
* @returns {Function} A function which, when called, will execute the action.
* @private
*/
function doToggleExtension(node, extension) {
    return function () {
        undo.touchTree($(node));
        selection.clearSelection();
        selection.selectNode(node);
        edit.toggleExtension(extension);
        exports.hideContextMenu();
        selection.clearSelection();
    };
}

/**
* Set the case of a node.
*
* A context menu action function.  Recurses into children of this node,
* stopping when a barrier (case node or explicitly defined barrier) is
* reached.
*
* @param {Node} node
* @param {String} theCase the case to assign
* @returns {Function} A function which, when called, will execute the action.
* @private
*/
function setCaseOnTag(node, theCase) {
    function doKids(n, override) {
        if (utils.isCaseNode(n.get(0))) {
            utils.setCase(n.get(0), theCase);
        } else if (_.contains(conf.caseBarriers, utils.getLabel(n).split("-")[0]) && !n.parent().is(".CONJP") && !override) {
            // nothing
        } else {
            n.children(".snode").each(function () {
                doKids($(this));
            });
        }
    }
    return function () {
        undo.touchTree(node);
        doKids(node, true);
    };
}

/**
* Insert a leaf node.
*
* A context menu action function.
*
* @param {Object} conleaf an object describing the leaf to be added.  Has the
* following keys:
*
* - `before` Boolean, insert this leaf beofre or fter the target
* - `label` String, the label of the node to insert
* - `word` String, the text of the node to insert
* @param {Node} node
* @returns {Function} A function which, when called, will execute the action.
* @private
*/
function doConLeaf(conleaf, node) {
    return function () {
        edit.makeLeaf(conleaf.before, conleaf.label, conleaf.word, node);
        exports.hideContextMenu();
    };
}

/**
* Add a group of labels to the context menu.
*
* When activating the context menu, if the label of the targeted node belongs
* to one of these groups, the other entries in the group will be suggested as
* new labels.
*
* @param {String[]} group
*/
function addConMenuGroup(group) {
    for (var i = 0; i < group.length; i++) {
        exports.addConMenu(group[i], group);
    }
}
exports.addConMenuGroup = addConMenuGroup;

/**
* Add a terminal node to the context menu.
*
* Add a terminal node that the context menu will allow inserting in the tree.
*
* @param {String} phrase the label of the leaf
* @param {String} terminal the text of the leaf
*/
function addConLeafBefore(phrase, terminal) {
    exports.addConLeaf("&lt; (" + phrase + " " + terminal + ")", true, phrase, terminal);
}
exports.addConLeafBefore = addConLeafBefore;

/**
* Compute the suggested changes for the context menu for a label.
*
* @param {String} label
* @private
*/
function getSuggestions(node) {
    var indstr = "", indtype = "", theCase = "";
    if (utils.getIndex(node)) {
        indstr = utils.getIndex(node).toString();
        indtype = utils.getIndexType(node);
    }
    var label = utils.getLabel($(node));
    theCase = utils.getCase(node);
    if (theCase) {
        theCase = "-" + theCase;
    }

    var suggestions = [];
    var menuitems = conf.customConMenuGroups;
    if (conmenus[label] !== null) {
        menuitems = conmenus[label].suggestions;
    }

    for (var i = 0; i < menuitems.length; i++) {
        var menuitem = menuitems[i];

        // TODO: check whether menuitem is really a bare category
        if (utils.isCaseCategory(menuitem)) {
            menuitem += theCase;
        }
        suggestions.push(menuitem + indtype + indstr);
    }
    return _.uniq(suggestions);
}

/**
* Populate the context menu for a given node.
*
* Does not display the menu.
*
* @param {Node} nodeOrig
* @private
*/
function loadContextMenu(nodeOrig) {
    var nO = $(nodeOrig), nodeIndex = utils.getIndex(nodeOrig), indexSep = "", indexString = "", nodelabel = utils.getLabel(nO), newnode, i;
    function loadConMenuMousedown() {
        var suggestion = "" + $(this).text();
        utils.setNodeLabel(nO, suggestion);
        exports.hideContextMenu();
    }

    if (nodeIndex) {
        indexSep = utils.getIndexType(nodeOrig);
        indexString = indexSep + utils.getIndex(nodeOrig);
    }
    $("#conLeft").empty();
    $("#conLeft").append($("<div class='conMenuHeading'>Label</div>"));

    var suggestions = getSuggestions(nodeOrig);
    for (i = 0; i < suggestions.length; i++) {
        if (suggestions[i] !== nodelabel) {
            newnode = $("<div class='conMenuItem'><a href='#'>" + suggestions[i] + indexString + "</a></div>");
            $(newnode).mousedown(loadConMenuMousedown);
            $("#conLeft").append(newnode);
        }
    }

    // do the right side context menu
    $("#conRight").empty();

    if (conf.displayCaseMenu) {
        if (utils.hasCase(nodeOrig) || utils.isCasePhrase(nodeOrig)) {
            $("#conRight").append($("<div class='conMenuHeading'>Case</div>"));
            caseMarkers.forEach(function (c) {
                newnode = $("<div class='conMenuItem'><a href='#'>-" + c + "</a></div>");
                $(newnode).mousedown(setCaseOnTag(nO, c));
                $("#conRight").append(newnode);
            });
        }
    }

    // do addleafbefore
    $("#conRight").append($("<div class='conMenuHeading'>Leaf before</div>"));
    for (i = 0; i < conleafs.length; i++) {
        newnode = $("<div class='conMenuItem'><a href='#'>" + conleafs[i].suggestion + "</a></div>");
        $(newnode).mousedown(doConLeaf(conleafs[i], nodeOrig));
        $("#conRight").append(newnode);
    }

    $("#conRightest").empty();
    $("#conRightest").append($("<div class='conMenuHeading'>Toggle ext.</div>"));

    for (i = 0; i < conf.extensions.length; i++) {
        // do the right side context menu
        newnode = $("<div class='conMenuItem'><a href='#'>" + conf.extensions[i] + "</a></div>");
        $(newnode).mousedown(doToggleExtension(nodeOrig, conf.extensions[i]));
        $("#conRightest").append(newnode);
    }
}

function showContextMenu(e) {
    var element = e.target;
    if (element === document.getElementById("sn0")) {
        selection.clearSelection();
        return;
    }

    var left = e.pageX + "px";
    var top = e.pageY + "px";

    var conl = $("#conLeft"), conr = $("#conRight"), conrr = $("#conRightest"), conm = $("#conMenu");

    conl.empty();
    loadContextMenu(element);

    // Make the columns equally high
    conl.height("auto");
    conr.height("auto");
    conrr.height("auto");
    var h = _.max(_.map([conl, conr, conrr], function (x) {
        return x.height();
    }));
    conl.height(h);
    conr.height(h);
    conrr.height(h);

    conm.css("left", left);
    conm.css("top", top);
    conm.css("visibility", "visible");
}
exports.showContextMenu = showContextMenu;

},{"./config":8,"./selection":25,"./struc-edit":28,"./undo":29,"./utils":31,"lodash":1}],11:[function(require,module,exports){
module.exports=require(10)
},{"./config":8,"./selection":25,"./struc-edit":28,"./undo":29,"./utils":31,"lodash":1}],12:[function(require,module,exports){
///<reference path="./../../../types/all.d.ts" />
// TODO: migrate to vex
var $ = require("jquery");
var events = require("./events");

var dialogShowing = false;

function isDialogShowing() {
    return dialogShowing;
}
exports.isDialogShowing = isDialogShowing;
;

/**
* Hide the displayed dialog box.
*/
function hideDialogBox() {
    $("#dialogBox").get(0).style.visibility = "hidden";
    $("#dialogBackground").get(0).style.visibility = "hidden";
    document.body.onkeydown = events.handleKeyDown;
    dialogShowing = false;
}
exports.hideDialogBox = hideDialogBox;

/**
* Show a dialog box.
*
* This function creates keybindings for the escape (to close dialog box) and
* return (caller-specified behavior) keys.
*
* @param {String} title the title of the dialog box
* @param {String} html the html to display in the dialog box
* @param {Function} returnFn a function to call when return is pressed
* @param {Function} hideHook a function to run when hiding the dialog box
*/
function showDialogBox(title, html, returnFn, hideHook) {
    document.body.onkeydown = function (e) {
        if (e.keyCode === 27) {
            if (hideHook) {
                hideHook();
            }
            exports.hideDialogBox();
        } else if (e.keyCode === 13 && returnFn) {
            returnFn();
        }
    };
    html = "<div class=\"menuTitle\">" + title + "</div>" + "<div id=\"dialogContent\">" + html + "</div>";
    $("#dialogBox").html(html).get(0).style.visibility = "visible";
    $("#dialogBackground").get(0).style.visibility = "visible";
    dialogShowing = true;
}
exports.showDialogBox = showDialogBox;

// TODO: ideally we would not export this, but there is a caller...
/**
* Set a handler for the enter key in a text box.
* @private
*/
function setInputFieldEnter(field, fn) {
    field.keydown(function (e) {
        if (e.keyCode === 13) {
            fn();
            return false;
        } else {
            return true;
        }
    });
}
exports.setInputFieldEnter = setInputFieldEnter;

},{"./events":15}],13:[function(require,module,exports){
module.exports=require(12)
},{"./events":15}],14:[function(require,module,exports){
///<reference path="./../../../types/all.d.ts" />
var s = require("./struc-edit");
var xUndo = require("./undo");
var n = require("./node-edit");
var selection = require("./selection");
var xSearch = require("./search");
var view = require("./view");
var nodeFormatter = require("./node-formatter");

exports.nf = nodeFormatter;

exports.leafAfter = s.leafAfter;
exports.leafBefore = s.leafBefore;
exports.setLabel = s.setLabel;
exports.makeNode = s.makeNode;
exports.coIndex = s.coIndex;
exports.splitWord = n.splitWord;
exports.toggleExtension = s.toggleExtension;
exports.pruneNode = s.pruneNode;
exports.undo = xUndo.undo;
exports.redo = xUndo.redo;
exports.editNode = n.editNode;
exports.clearSelection = selection.clearSelection;
exports.displayRename = n.displayRename;
exports.search = xSearch.search;
exports.toggleLemmata = view.toggleLemmata;
exports.toggleCollapsed = view.toggleCollapsed;

},{"./node-edit":21,"./node-formatter":22,"./search":24,"./selection":25,"./struc-edit":28,"./undo":29,"./view":32}],15:[function(require,module,exports){
///<reference path="./../../../types/all.d.ts" />
var dummy;

var $ = require("jquery");
var _ = require("lodash");

var globals = require("./global");
dummy = require("./global");
var contextmenu = require("./contextmenu");
dummy = require("./contextmenu");
var bindings = require("./bindings");
dummy = require("./bindings");
var undo = require("./undo");
dummy = require("./undo");
var selection = require("./selection");
dummy = require("./selection");
var edit = require("./struc-edit");
dummy = require("./struc-edit");
var metadataEditor = require("./metadata");
dummy = require("./metadata.ts");
var dialog = require("./dialog");
dummy = require("./dialog");

function killTextSelection(e) {
    if (dialog.isDialogShowing() || $(e.target).parents(".togetherjs,.togetherjs-modal").length > 0) {
        return;
    }
    var sel = window.getSelection();
    sel.removeAllRanges();
}
exports.killTextSelection = killTextSelection;
;

var keyDownHooks = [];

function addKeyDownHook(fn) {
    keyDownHooks.push(fn);
}
exports.addKeyDownHook = addKeyDownHook;
;

function handleKeyDown(e) {
    if ((e.ctrlKey && e.shiftKey) || e.metaKey || e.altKey) {
        // unsupported modifier combinations
        return true;
    }
    if (e.keyCode === 16 || e.keyCode === 17 || e.keyCode === 18) {
        // Don't handle shift, ctrl, and meta presses
        return true;
    }
    if ($(e.target).parents(".togetherjs,.togetherjs-modal").length > 0) {
        // Don't interfere with TogetherJS UI elements
        return true;
    }
    var commandMap;
    if (e.ctrlKey) {
        commandMap = bindings.ctrlKeyMap;
    } else if (e.shiftKey) {
        commandMap = bindings.shiftKeyMap;
    } else {
        commandMap = bindings.regularKeyMap;
    }
    globals.lastEventWasMouse = false;
    if (!commandMap[e.keyCode]) {
        return true;
    }
    e.preventDefault();
    var theFn = commandMap[e.keyCode].func;
    var theArgs = commandMap[e.keyCode].args;
    _.each(keyDownHooks, function (fn) {
        fn({
            keyCode: e.keyCode,
            shift: e.shiftKey,
            ctrl: e.ctrlKey
        }, theFn, theArgs);
    });
    theFn.apply(undefined, theArgs);
    if (!theFn.async) {
        undo.undoBarrier();
    }
    return false;
}
exports.handleKeyDown = handleKeyDown;
;

var clickHooks = [];

function addClickHook(fn) {
    clickHooks.push(fn);
}
exports.addClickHook = addClickHook;

function handleNodeClick(e) {
    var element = e.target;
    metadataEditor.saveMetadata();
    if (e.button === 2) {
        // rightclick
        if (selection.cardinality() === 1) {
            if (selection.get() !== element) {
                e.stopPropagation();
                edit.moveNode(element);
            } else {
                contextmenu.showContextMenu(e);
            }
        } else if (selection.cardinality() === 2) {
            e.stopPropagation();
            edit.moveNodes(element);
        } else {
            contextmenu.showContextMenu(e);
        }
    } else {
        // leftclick
        contextmenu.hideContextMenu();
        if (e.shiftKey && selection.get()) {
            selection.selectNode(element, true);
            e.preventDefault(); // Otherwise, this sets the text
            // selection in the browser...
        } else {
            selection.selectNode(element);
            if (e.ctrlKey) {
                edit.makeNode("XP");
            }
        }
    }
    _.each(clickHooks, function (fn) {
        fn(e.button);
    });
    e.stopPropagation();
    globals.lastEventWasMouse = true;
    undo.undoBarrier();
}
exports.handleNodeClick = handleNodeClick;

},{"./bindings":7,"./contextmenu":10,"./dialog":12,"./global":16,"./metadata":19,"./metadata.ts":20,"./selection":25,"./struc-edit":28,"./undo":29,"lodash":1}],16:[function(require,module,exports){
exports.lastEventWasMouse = false;
exports.lastSavedState = "";
exports.labelMapping = {
    defaults: {},
    defaultSubcategories: [],
    byLabel: {}
};

},{}],17:[function(require,module,exports){
module.exports=require(16)
},{}],18:[function(require,module,exports){
///<reference path="./../../../types/all.d.ts" />
var dummy;

var _ = require("lodash");

var globals = require("./global");
dummy = require("./global.ts");
var metadata = require("./metadata");
dummy = require("./metadata.ts");

function isValidSubcategoryForCategory(subcat, cat, mapping) {
    return (mapping.defaultSubcategories.indexOf(subcat) >= 0 || mapping.byLabel[cat].subcategories.indexOf(subcat) >= 0);
}

function matchMetadataAgainstObject(key, value, object) {
    if (!object[key]) {
        return false;
    }
    if (typeof object[key] === "string") {
        return object[key] === value;
    }
    return _.all(_.forOwn(object[key], function (v, k) {
        if (!value[k]) {
            return false;
        }
        return exports.matchMetadataAgainstObject(k, value[k], v);
    }));
}
exports.matchMetadataAgainstObject = matchMetadataAgainstObject;

function nodeMatchesSpec(node, spec) {
    if (spec.category) {
        if (node.getAttribute("data-category") !== spec.category) {
            return false;
        }
    }
    if (spec.subcategory) {
        if (node.getAttribute("data-subcategory") !== spec.subcategory) {
            return false;
        }
    }
    if (spec.metadata) {
        var md = JSON.parse(node.getAttribute("data-metadata"));
        var res = _.all(_.forOwn(spec.metadata, function (value, key) {
            return exports.matchMetadataAgainstObject(key, value, md);
        }));
    }
    return res;
}
exports.nodeMatchesSpec = nodeMatchesSpec;

function labelToMatchSpec(label, mapping) {
    var pieces = label.split("-");
    var r = {};
    r.category = pieces.shift();
    var submap = mapping.byLabel[r.category].metadataKeys;
    if (pieces.length > 0 && isValidSubcategoryForCategory(pieces[0], r.category, mapping)) {
        r.subcategory = pieces.shift();
    }
    if (pieces.length > 0) {
        r.metadata = {};
        _.each(pieces, function (v) {
            var x = submap[v] || mapping.defaults[v];
            if (x) {
                r.metadata[x.key] = x.value;
            }
        });
    }
    return r;
}
exports.labelToMatchSpec = labelToMatchSpec;

/*
use the deep-diff package
make setlabel take two lists: one for nonterminals and one for terminals
*/
function setLabelForNode(label, node, mapping, remove) {
    if (typeof mapping === "undefined") { mapping = globals.labelMapping; }
    var pieces = label.split("-");
    var category = pieces.shift();
    node.setAttribute("data-category", category);
    if (pieces.length > 0 && isValidSubcategoryForCategory(pieces[0], category, mapping)) {
        if (remove) {
            node.removeAttribute("data-subcategory");
        } else {
            node.setAttribute("data-subcategory", pieces[0]);
        }
        pieces.shift();
    }
    if (pieces.length > 0) {
        var submapping = mapping.byLabel[category].metadataKeys || {};
        _.map(pieces, function (piece) {
            var action = submapping[piece] || mapping.defaults[piece];
            if (!action) {
                return;
            }
            if (remove) {
                metadata.removeMetadata(node, action.key, action.value);
            } else {
                metadata.setMetadata(node, action.key, action.value);
            }
        });
    }
}
exports.setLabelForNode = setLabelForNode;

},{"./global":16,"./global.ts":17,"./metadata":19,"./metadata.ts":20,"lodash":1}],19:[function(require,module,exports){
///<reference path="./../../../types/all.d.ts" />
/* tslint:disable:quotemark */
var dummy;

var $ = require("jquery");
var _ = require("lodash");

var dialog = require("./dialog");
dummy = require("./dialog.ts");
var selection = require("./selection");
dummy = require("./selection");

function setInDict(dict, key, val, remove) {
    if (typeof val === "string") {
        if (remove) {
            delete dict[key];
        } else {
            dict[key] = val;
        }
    } else {
        _.forOwn(val, function (v, k) {
            dict[key] = setInDict(dict[key] || {}, k, v, remove);
            if (_.isEmpty(dict[key])) {
                delete dict[key];
            }
        });
    }
    return dict;
}

function removeMetadata(node, key, value) {
    if (typeof value === "undefined") { value = ""; }
    var metadata = JSON.parse(node.getAttribute("data-metadata")) || {};
    metadata = setInDict(metadata, key, value, true);
    if (_.isEmpty(metadata)) {
        node.removeAttribute("data-metadata");
    } else {
        node.setAttribute("data-metadata", JSON.stringify(metadata));
    }
}
exports.removeMetadata = removeMetadata;

function setMetadata(node, key, value) {
    var metadata = JSON.parse(node.getAttribute("data-metadata")) || {};
    metadata = setInDict(metadata, key, value);
    node.setAttribute("data-metadata", JSON.stringify(metadata));
}
exports.setMetadata = setMetadata;

function getMetadata(node) {
    return JSON.parse(node.getAttribute("data-metadata")) || {};
}
exports.getMetadata = getMetadata;

/**
* Convert a JS disctionary to an HTML form.
*
* For the metadata editing code.
* @private
*/
function dictionaryToForm(dict, level) {
    if (!level) {
        level = 0;
    }
    var res = "";
    if (dict) {
        res = '<table class="metadataTable"><thead><tr><td>Key</td>' + '<td>Value</td></tr></thead>';
        for (var k in dict) {
            if (dict.hasOwnProperty(k)) {
                if (typeof dict[k] === "string") {
                    res += '<tr class="strval" data-level="' + level + '"><td class="key">' + '<span style="width:"' + 4 * level + 'px;"></span>' + k + '</td><td class="val"><input class="metadataField" ' + 'type="text" name="' + k + '" value="' + dict[k] + '" /></td></tr>';
                } else if (typeof dict[k] === "object") {
                    res += '<tr class="tabhead"><td colspan=2>' + k + '</td></tr>';
                    res += dictionaryToForm(dict[k], level + 1);
                }
            }
        }
        res += '</table>';
    }
    return res;
}

/**
* Convert an HTML form into a JS dictionary
*
* For the metadata editing code
* @private
*/
function formToDictionary(form) {
    var d = {}, dstack = [], curlevel = 0, namestack = [];
    form.find("tr").each(function () {
        if ($(this).hasClass("strval")) {
            var key = $(this).children(".key").text();
            var val = $(this).find(".val>.metadataField").val();
            d[key] = val;
            if ($(this).prop("data-level") < curlevel) {
                var newDict = dstack.pop();
                var nextName = namestack.pop();
                newDict[nextName] = d;
                d = newDict;
            }
        } else if ($(this).hasClass("tabhead")) {
            namestack.push($(this).text());
            curlevel = $(this).prop("data-level");
            dstack.push(d);
            d = {};
        }
    });
    if (dstack.length > 0) {
        var len = dstack.length;
        for (var i = 0; i < len; i++) {
            var newDict = dstack.pop();
            var nextName = namestack.pop();
            newDict[nextName] = d;
            d = newDict;
        }
    }
    return d;
}

function saveMetadata() {
    if ($("#metadata").html() !== "") {
        $(selection.get()).prop("data-metadata", JSON.stringify(formToDictionary($("#metadata"))));
    }
}
exports.saveMetadata = saveMetadata;

function metadataKeyClick(e) {
    var keyNode = e.target;
    var html = 'Name: <input type="text" ' + 'id="metadataNewName" value="' + $(keyNode).text() + '" /><div id="dialogButtons"><input type="button" value="Save" ' + 'id="metadataKeySave" /><input type="button" value="Delete" ' + 'id="metadataKeyDelete" /></div>';
    dialog.showDialogBox("Edit Metadata", html);

    // TODO: make focus go to end, or select whole thing?
    $("#metadataNewName").focus();
    function saveMetadataInner() {
        $(keyNode).text($("#metadataNewName").val());
        dialog.hideDialogBox();
        exports.saveMetadata();
    }
    function deleteMetadata() {
        $(keyNode).parent().remove();
        dialog.hideDialogBox();
        exports.saveMetadata();
    }
    $("#metadataKeySave").click(saveMetadataInner);
    dialog.setInputFieldEnter($("#metadataNewName"), saveMetadataInner);
    $("#metadataKeyDelete").click(deleteMetadata);
    return false;
}

function addMetadataDialog() {
    // TODO: allow specifying value too in initial dialog?
    var html = 'New Name: <input type="text" id="metadataNewName" value="NEW" />' + '<div id="dialogButtons"><input type="button" id="addMetadata" ' + 'value="Add" /></div>';
    dialog.showDialogBox("Add Metatata", html);
    function addMetadata() {
        var oldMetadata = formToDictionary($("#metadata"));
        oldMetadata[$("#metadataNewName").val()] = "NEW";
        $(selection.get()).prop("data-metadata", JSON.stringify(oldMetadata));
        exports.updateMetadataEditor();
        dialog.hideDialogBox();
    }
    $("#addMetadata").click(addMetadata);
    dialog.setInputFieldEnter($("#metadataNewName"), addMetadata);
}

function updateMetadataEditor() {
    if (selection.cardinality() !== 1) {
        $("#metadata").html("");
        return;
    }
    var addButtonHtml = '<input type="button" id="addMetadataButton" ' + 'value="Add" />';
    $("#metadata").html(dictionaryToForm(exports.getMetadata(selection.get())) + addButtonHtml);
    $("#metadata").find(".metadataField").change(exports.saveMetadata).focusout(exports.saveMetadata).keydown(function (e) {
        if (e.keyCode === 13) {
            $(e.target).blur();
        }
        e.stopPropagation();
        return true;
    });
    $("#metadata").find(".key").click(metadataKeyClick);
    $("#addMetadataButton").click(addMetadataDialog);
}
exports.updateMetadataEditor = updateMetadataEditor;

},{"./dialog":12,"./dialog.ts":13,"./selection":25,"lodash":1}],20:[function(require,module,exports){
///<reference path="./../../../types/all.d.ts" />
/* tslint:disable:quotemark */
var dummy;

var $ = require("jquery");
var _ = require("lodash");

var dialog = require("./dialog");
dummy = require("./dialog.ts");
var selection = require("./selection");
dummy = require("./selection.ts");

function setInDict(dict, key, val, remove) {
    if (typeof val === "string") {
        if (remove) {
            delete dict[key];
        } else {
            dict[key] = val;
        }
    } else {
        _.forOwn(val, function (v, k) {
            dict[key] = setInDict(dict[key] || {}, k, v, remove);
            if (_.isEmpty(dict[key])) {
                delete dict[key];
            }
        });
    }
    return dict;
}

function removeMetadata(node, key, value) {
    if (typeof value === "undefined") { value = ""; }
    var metadata = JSON.parse(node.getAttribute("data-metadata")) || {};
    metadata = setInDict(metadata, key, value, true);
    if (_.isEmpty(metadata)) {
        node.removeAttribute("data-metadata");
    } else {
        node.setAttribute("data-metadata", JSON.stringify(metadata));
    }
}
exports.removeMetadata = removeMetadata;

function setMetadata(node, key, value) {
    var metadata = JSON.parse(node.getAttribute("data-metadata")) || {};
    metadata = setInDict(metadata, key, value);
    node.setAttribute("data-metadata", JSON.stringify(metadata));
}
exports.setMetadata = setMetadata;

function getMetadata(node) {
    return JSON.parse(node.getAttribute("data-metadata")) || {};
}
exports.getMetadata = getMetadata;

/**
* Convert a JS disctionary to an HTML form.
*
* For the metadata editing code.
* @private
*/
function dictionaryToForm(dict, level) {
    if (!level) {
        level = 0;
    }
    var res = "";
    if (dict) {
        res = '<table class="metadataTable"><thead><tr><td>Key</td>' + '<td>Value</td></tr></thead>';
        for (var k in dict) {
            if (dict.hasOwnProperty(k)) {
                if (typeof dict[k] === "string") {
                    res += '<tr class="strval" data-level="' + level + '"><td class="key">' + '<span style="width:"' + 4 * level + 'px;"></span>' + k + '</td><td class="val"><input class="metadataField" ' + 'type="text" name="' + k + '" value="' + dict[k] + '" /></td></tr>';
                } else if (typeof dict[k] === "object") {
                    res += '<tr class="tabhead"><td colspan=2>' + k + '</td></tr>';
                    res += dictionaryToForm(dict[k], level + 1);
                }
            }
        }
        res += '</table>';
    }
    return res;
}

/**
* Convert an HTML form into a JS dictionary
*
* For the metadata editing code
* @private
*/
function formToDictionary(form) {
    var d = {}, dstack = [], curlevel = 0, namestack = [];
    form.find("tr").each(function () {
        if ($(this).hasClass("strval")) {
            var key = $(this).children(".key").text();
            var val = $(this).find(".val>.metadataField").val();
            d[key] = val;
            if ($(this).prop("data-level") < curlevel) {
                var newDict = dstack.pop();
                var nextName = namestack.pop();
                newDict[nextName] = d;
                d = newDict;
            }
        } else if ($(this).hasClass("tabhead")) {
            namestack.push($(this).text());
            curlevel = $(this).prop("data-level");
            dstack.push(d);
            d = {};
        }
    });
    if (dstack.length > 0) {
        var len = dstack.length;
        for (var i = 0; i < len; i++) {
            var newDict = dstack.pop();
            var nextName = namestack.pop();
            newDict[nextName] = d;
            d = newDict;
        }
    }
    return d;
}

function saveMetadata() {
    if ($("#metadata").html() !== "") {
        $(selection.get()).prop("data-metadata", JSON.stringify(formToDictionary($("#metadata"))));
    }
}
exports.saveMetadata = saveMetadata;

function metadataKeyClick(e) {
    var keyNode = e.target;
    var html = 'Name: <input type="text" ' + 'id="metadataNewName" value="' + $(keyNode).text() + '" /><div id="dialogButtons"><input type="button" value="Save" ' + 'id="metadataKeySave" /><input type="button" value="Delete" ' + 'id="metadataKeyDelete" /></div>';
    dialog.showDialogBox("Edit Metadata", html);

    // TODO: make focus go to end, or select whole thing?
    $("#metadataNewName").focus();
    function saveMetadataInner() {
        $(keyNode).text($("#metadataNewName").val());
        dialog.hideDialogBox();
        exports.saveMetadata();
    }
    function deleteMetadata() {
        $(keyNode).parent().remove();
        dialog.hideDialogBox();
        exports.saveMetadata();
    }
    $("#metadataKeySave").click(saveMetadataInner);
    dialog.setInputFieldEnter($("#metadataNewName"), saveMetadataInner);
    $("#metadataKeyDelete").click(deleteMetadata);
    return false;
}

function addMetadataDialog() {
    // TODO: allow specifying value too in initial dialog?
    var html = 'New Name: <input type="text" id="metadataNewName" value="NEW" />' + '<div id="dialogButtons"><input type="button" id="addMetadata" ' + 'value="Add" /></div>';
    dialog.showDialogBox("Add Metatata", html);
    function addMetadata() {
        var oldMetadata = formToDictionary($("#metadata"));
        oldMetadata[$("#metadataNewName").val()] = "NEW";
        $(selection.get()).prop("data-metadata", JSON.stringify(oldMetadata));
        exports.updateMetadataEditor();
        dialog.hideDialogBox();
    }
    $("#addMetadata").click(addMetadata);
    dialog.setInputFieldEnter($("#metadataNewName"), addMetadata);
}

function updateMetadataEditor() {
    if (selection.cardinality() !== 1) {
        $("#metadata").html("");
        return;
    }
    var addButtonHtml = '<input type="button" id="addMetadataButton" ' + 'value="Add" />';
    $("#metadata").html(dictionaryToForm(exports.getMetadata(selection.get())) + addButtonHtml);
    $("#metadata").find(".metadataField").change(exports.saveMetadata).focusout(exports.saveMetadata).keydown(function (e) {
        if (e.keyCode === 13) {
            $(e.target).blur();
        }
        e.stopPropagation();
        return true;
    });
    $("#metadata").find(".key").click(metadataKeyClick);
    $("#addMetadataButton").click(addMetadataDialog);
}
exports.updateMetadataEditor = updateMetadataEditor;

},{"./dialog":12,"./dialog.ts":13,"./selection":25,"./selection.ts":26,"lodash":1}],21:[function(require,module,exports){
///<reference path="./../../../types/all.d.ts" />
/* tslint:disable:quotemark no-string-literal */
var $ = require("jquery");
var _ = require("lodash");
var utils = require("./utils");
var undo = require("./undo");
var logger = require("../ui/log");
var selection = require("./selection");
var events = require("./events");
var dialog = require("./dialog");
var startup = require("./startup");
var conf = require("./config");
var strucEdit = require("./struc-edit");

// * Editing parts of the tree
// TODO: document entry points better
// DONE(?): split these fns up...they are monsters.
var commentTypeCheckboxes;

startup.addStartupHook(function setupCommentTypes() {
    var commentTypes = conf.commentTypes;
    commentTypeCheckboxes = "Type of comment: ";
    for (var i = 0; i < commentTypes.length; i++) {
        commentTypeCheckboxes += '<input type="radio" name="commentType" value="' + commentTypes[i] + '" id="commentType' + commentTypes[i] + '" /> ' + commentTypes[i];
    }
});

function editComment() {
    if (selection.cardinality() !== 1) {
        return;
    }
    undo.touchTree($(selection.get()));
    var commentRaw = $.trim(utils.wnodeString(selection.get()));
    var commentType = commentRaw.split(":")[0];

    // remove the {
    commentType = commentType.substring(1);
    var commentText = commentRaw.split(":")[1];
    commentText = commentText.substring(0, commentText.length - 1);

    // regex because string does not give global search.
    commentText = commentText.replace(/_/g, " ");
    dialog.showDialogBox("Edit Comment", '<textarea id="commentEditBox">' + commentText + '</textarea><div id="commentTypes">' + commentTypeCheckboxes + '</div><div id="dialogButtons">' + '<input type="button"' + 'id="commentEditButton" value="Save" /></div>');
    $("input:radio[name=commentType]").val([commentType]);
    $("#commentEditBox").focus().get(0).setSelectionRange(commentText.length, commentText.length);
    function editCommentDone(change) {
        if (change) {
            var newText = $.trim($("#commentEditBox").val());
            if (/_|\n|:|\}|\{|\(|\)/.test(newText)) {
                // TODO(AWE): slicker way of indicating errors...
                alert("illegal characters in comment: illegal characters are" + " _, :, {}, (), and newline");

                // hideDialogBox();
                $("#commentEditBox").val(newText);
                return;
            }
            newText = newText.replace(/ /g, "_");
            commentType = $("input:radio[name=commentType]:checked").val();
            utils.setNodeLabel($(selection.get()).children(".wnode"), "{" + commentType + ":" + newText + "}");
        }
        dialog.hideDialogBox();
    }
    $("#commentEditButton").click(editCommentDone);
    $("#commentEditBox").keydown(function (e) {
        if (e.keyCode === 13) {
            // return
            editCommentDone(true);
            return false;
        } else if (e.keyCode === 27) {
            editCommentDone(false);
            return false;
        } else {
            return true;
        }
    });
}
exports.editComment = editComment;
exports.editComment["async"] = true;

/**
* Return the JQuery object with the editor for a leaf node.
* @private
*/
function leafEditorHtml(label, word, lemma) {
    // Single quotes mess up the HTML code.
    if (lemma) {
        lemma = lemma.replace(/'/g, "&#39;");
    }
    word = word.replace(/'/g, "&#39;");
    label = label.replace(/'/g, "&#39;");

    var editorHtml = "<div id='leafeditor' class='snode'>" + "<input id='leafphrasebox' class='labeledit' type='text' value='" + label + "' /><input id='leaftextbox' class='labeledit' type='text' value='" + word + "' " + (!utils.isEmpty(word) ? "disabled='disabled'" : "") + " />";
    if (lemma) {
        editorHtml += "<input id='leaflemmabox' class='labeledit' " + "type='text' value='" + lemma + "' />";
    }
    editorHtml += "</div>";

    return $(editorHtml);
}

/**
* Return the JQuery object with the replacement after editing a leaf node.
* @private
*/
function leafEditorReplacement(label, word, lemma) {
    if (lemma) {
        lemma = lemma.replace(/</g, "&lt;");
        lemma = lemma.replace(/>/g, "&gt;");
        lemma = lemma.replace(/'/g, "&#39;");
    }

    word = word.replace(/</g, "&lt;");
    word = word.replace(/>/g, "&gt;");
    word = word.replace(/'/g, "&#39;");

    // TODO: test for illegal chars in label
    label = label.toUpperCase();

    var replText = "<div class='snode'>" + label + " <span class='wnode'>" + word;
    if (lemma) {
        replText += "<span class='lemma'>-" + lemma + "</span>";
    }
    replText += "</span></div>";
    return $(replText);
}

/**
* Edit the selected node
*
* If the selected node is a terminal, edit its label, and lemma.  The text is
* available for editing if it is an empty node (trace, comment, etc.).  If a
* non-terminal, edit the node label.
*/
function displayRename() {
    // Lifted so we can close over it below
    var label = utils.getLabel($(selection.get()));

    // Inner functions
    function space(event) {
        var element = (event.target || event.srcElement);
        $(element).val($(element).val());
        event.preventDefault();
    }
    function postChange(newNode) {
        if (newNode) {
            utils.updateCssClass(newNode, label);
            selection.clearSelection();
            selection.updateSelection();
            document.body.onkeydown = events.handleKeyDown;
            $("#sn0").mousedown(events.handleNodeClick);
            $("#editpane").mousedown(selection.clearSelection);
            $("#butundo").prop("disabled", false);
            $("#butredo").prop("disabled", false);
            $("#butsave").prop("disabled", false);
        }
    }

    // Begin code
    if (selection.cardinality() !== 1) {
        return;
    }
    undo.undoBeginTransaction();
    undo.touchTree($(selection.get()));
    document.body.onkeydown = null;
    $("#sn0").unbind("mousedown");
    $("#editpane").unbind("mousedown");
    $("#butundo").prop("disabled", true);
    $("#butredo").prop("disabled", true);
    $("#butsave").prop("disabled", true);

    if ($(selection.get()).children(".wnode").length > 0) {
        // this is a terminal
        var word, lemma;

        // is this right? we still want to allow editing of index, maybe?
        var isLeafNode = utils.guessLeafNode(selection.get());
        if ($(selection.get()).children(".wnode").children(".lemma").length > 0) {
            var preword = $.trim($(selection.get()).children().first().text()).split("-");
            lemma = preword.pop();
            word = preword.join("-");
        } else {
            word = $.trim($(selection.get()).children().first().text());
        }

        $(selection.get()).replaceWith(leafEditorHtml(label, word, lemma));

        $("#leafphrasebox,#leaftextbox,#leaflemmabox").keydown(function (event) {
            var replNode;
            if (event.keyCode === 32) {
                space(event);
            }
            if (event.keyCode === 27) {
                replNode = leafEditorReplacement(label, word, lemma);
                $("#leafeditor").replaceWith(replNode);
                postChange(replNode);
                undo.undoAbortTransaction();
            }
            if (event.keyCode === 13) {
                var newlabel = $("#leafphrasebox").val().toUpperCase();
                var newword = $("#leaftextbox").val();
                var newlemma;
                if (lemma) {
                    newlemma = $("#leaflemmabox").val();
                }

                if (isLeafNode) {
                    // TODO: restore
                    // if (typeof testValidLeafLabel !== "undefined") {
                    //     if (!testValidLeafLabel(newlabel)) {
                    //         displayWarning("Not a valid leaf label: '" +
                    //                        newlabel + "'.");
                    //         return;
                    //     }
                    // }
                } else {
                    // TODO: restore
                    // if (typeof testValidPhraseLabel !== "undefined") {
                    //     if (!testValidPhraseLabel(newlabel)) {
                    //         displayWarning("Not a valid phrase label: '" +
                    //                        newlabel + "'.");
                    //         return;
                    //     }
                    // }
                }
                if (newword + newlemma === "") {
                    logger.warning("Cannot create an empty leaf.");
                    return;
                }
                replNode = leafEditorReplacement(newlabel, newword, newlemma);
                $("#leafeditor").replaceWith(replNode);
                postChange(replNode);
                undo.undoEndTransaction();
                undo.undoBarrier();
            }
            if (event.keyCode === 9) {
                var element = (event.target || event.srcElement);
                if ($("#leafphrasebox").is(element)) {
                    if (!$("#leaftextbox").prop("disabled")) {
                        $("#leaftextbox").focus();
                    } else if ($("#leaflemmabox").length === 1) {
                        $("#leaflemmabox").focus();
                    }
                } else if ($("#leaftextbox").is(element)) {
                    if ($("#leaflemmabox").length === 1) {
                        $("#leaflemmabox").focus();
                    } else {
                        $("#leafphrasebox").focus();
                    }
                } else if ($("#leaflemmabox").is(element)) {
                    $("#leafphrasebox").focus();
                }
                event.preventDefault();
            }
        }).mouseup(function editLeafClick(e) {
            e.stopPropagation();
        });
        setTimeout(function () {
            $("#leafphrasebox").focus();
        }, 10);
    } else {
        // this is not a terminal
        var editor = $("<input id='labelbox' class='labeledit' " + "type='text' value='" + label + "' />");
        var origNode = $(selection.get());

        // var isWordLevelConj =
        //         origNode.children(".snode").children(".snode").size() === 0 &&
        //         // TODO: make configurable
        //         origNode.children(".CONJ") .size() > 0;
        utils.textNode(origNode).replaceWith(editor);
        $("#labelbox").keydown(function (event) {
            if (event.keyCode === 9) {
                event.preventDefault();
            }
            if (event.keyCode === 32) {
                space(event);
            }
            if (event.keyCode === 27) {
                $("#labelbox").replaceWith(label + " ");
                postChange(origNode);
                undo.undoAbortTransaction();
            }
            if (event.keyCode === 13) {
                var newphrase = $("#labelbox").val().toUpperCase();

                // TODO: restore
                // if (typeof testValidPhraseLabel !== "undefined") {
                //     if (!(testValidPhraseLabel(newphrase) ||
                //           (typeof testValidLeafLabel !== "undefined" &&
                //            isWordLevelConj &&
                //            testValidLeafLabel(newphrase)))) {
                //         logger.warning("Not a valid phrase label: '" +
                //                        newphrase + "'.");
                //         return;
                //     }
                // }
                $("#labelbox").replaceWith(newphrase + " ");
                postChange(origNode);
                undo.undoEndTransaction();
                undo.undoBarrier();
            }
        }).mouseup(function editNonLeafClick(e) {
            e.stopPropagation();
        });
        setTimeout(function () {
            $("#labelbox").focus();
        }, 10);
    }
}
exports.displayRename = displayRename;
exports.displayRename["async"] = true;

/**
* Edit the lemma of a terminal node.
*/
function editLemma() {
    // Inner functions
    function space(event) {
        var element = (event.target || event.srcElement);
        $(element).val($(element).val());
        event.preventDefault();
    }
    function postChange() {
        selection.clearSelection();
        selection.updateSelection();
        document.body.onkeydown = events.handleKeyDown;
        $("#sn0").mousedown(events.handleNodeClick);
        $("#butundo").prop("disabled", false);
        $("#butredo").prop("disabled", false);
        $("#butsave").prop("disabled", false);
    }

    // Begin code
    var childLemmata = $(selection.get()).children(".wnode").children(".lemma");
    if (selection.cardinality() !== 1 || childLemmata.length !== 1) {
        return;
    }
    document.body.onkeydown = null;
    $("#sn0").unbind("mousedown");
    undo.undoBeginTransaction();
    undo.touchTree($(selection.get()));
    $("#butundo").prop("disabled", true);
    $("#butredo").prop("disabled", true);
    $("#butsave").prop("disabled", true);

    var lemma = $(selection.get()).children(".wnode").children(".lemma").text();
    lemma = lemma.substring(1);
    var editor = $("<span id='leafeditor' class='wnode'><input " + "id='leaflemmabox' class='labeledit' type='text' value='" + lemma + "' /></span>");
    $(selection.get()).children(".wnode").children(".lemma").replaceWith(editor);
    $("#leaflemmabox").keydown(function (event) {
        if (event.keyCode === 9) {
            event.preventDefault();
        }
        if (event.keyCode === 32) {
            space(event);
        }
        if (event.keyCode === 27) {
            $("#leafeditor").replaceWith("<span class='lemma'>-" + lemma + "</span>");
            postChange();
            undo.undoAbortTransaction();
        }
        if (event.keyCode === 13) {
            var newlemma = $("#leaflemmabox").val();
            newlemma = newlemma.replace("<", "&lt;");
            newlemma = newlemma.replace(">", "&gt;");
            newlemma = newlemma.replace(/'/g, "&#39;");

            $("#leafeditor").replaceWith("<span class='lemma'>-" + newlemma + "</span>");
            postChange();
            undo.undoEndTransaction();
            undo.undoBarrier();
        }
    }).mouseup(function editLemmaClick(e) {
        e.stopPropagation();
    });
    setTimeout(function () {
        $("#leaflemmabox").focus();
    }, 10);
}
exports.editLemma = editLemma;
exports.editLemma["async"] = true;

/**
* Perform an appropriate editing operation on the selected node.
*/
function editNode() {
    if (utils.getLabel($(selection.get())) === "CODE" && _.contains(conf.commentTypes, utils.wnodeString(selection.get()).substr(1).split(":")[0])) {
        exports.editComment();
    } else {
        exports.displayRename();
    }
}
exports.editNode = editNode;
exports.editNode["async"] = true;

// * Splitting words
function addLemma(lemma) {
    // TODO: This only makes sense for dash-format corpora
    if (selection.cardinality() !== 1) {
        return;
    }
    if (!utils.isLeafNode(selection.get()) || utils.isEmptyNode(selection.get())) {
        return;
    }
    undo.touchTree($(selection.get()));
    var theLemma = $("<span class='lemma'>-" + lemma + "</span>");
    $(selection.get()).children(".wnode").append(theLemma);
}
exports.addLemma = addLemma;

function splitWord() {
    if (selection.cardinality() !== 1) {
        return;
    }
    if (!utils.isLeafNode(selection.get()) || utils.isEmptyNode(selection.get())) {
        return;
    }
    undo.undoBeginTransaction();
    undo.touchTree($(selection.get()));
    var wordSplit = utils.wnodeString(selection.get()).split("-");
    var origWord = wordSplit[0];
    var startsWithAt = false, endsWithAt = false;
    if (origWord[0] === "@") {
        startsWithAt = true;
        origWord = origWord.substr(1);
    }
    if (origWord.substr(origWord.length - 1, 1) === "@") {
        endsWithAt = true;
        origWord = origWord.substr(0, origWord.length - 1);
    }
    var origLemma = "XXX";
    if (wordSplit.length === 2) {
        origLemma = "@" + wordSplit[1] + "@";
    }
    var origLabel = utils.getLabel($(selection.get()));
    function doSplit() {
        var words = $("#splitWordInput").val().split("@");
        if (words.join("") !== origWord) {
            logger.warning("The two new words don't match the original.  Aborting");
            undo.undoAbortTransaction();
            return;
        }
        if (words.length < 0) {
            logger.warning("You have not specified where to split the word.");
            undo.undoAbortTransaction();
            return;
        }
        if (words.length > 2) {
            logger.warning("You can only split in one place at a time.");
            undo.undoAbortTransaction();
            return;
        }
        var labelSplit = origLabel.split("+");
        var secondLabel = "X";
        if (labelSplit.length === 2) {
            utils.setLeafLabel($(selection.get()), labelSplit[0]);
            secondLabel = labelSplit[1];
        }
        utils.setLeafLabel($(selection.get()), (startsWithAt ? "@" : "") + words[0] + "@");
        var hasLemma = $(selection.get()).find(".lemma").length > 0;
        strucEdit.makeLeaf(false, secondLabel, "@" + words[1] + (endsWithAt ? "@" : ""));
        if (hasLemma) {
            // TODO: move to something like foo@1 and foo@2 for the two pieces
            // of the lemmata
            exports.addLemma(origLemma);
        }
        dialog.hideDialogBox();
        undo.undoEndTransaction();
        undo.undoBarrier();
    }
    var html = "Enter an at-sign at the place to split the word: \
<input type='text' id='splitWordInput' value='" + origWord + "' /><div id='dialogButtons'><input type='button' id='splitWordButton'\
 value='Split' /></div>";
    dialog.showDialogBox("Split word", html, doSplit);
    $("#splitWordButton").click(doSplit);
    $("#splitWordInput").focus();
}
exports.splitWord = splitWord;
exports.splitWord["async"] = true;

},{"../ui/log":33,"./config":8,"./dialog":12,"./events":15,"./selection":25,"./startup":27,"./struc-edit":28,"./undo":29,"./utils":31,"lodash":1}],22:[function(require,module,exports){
///<reference path="./../../../types/all.d" />
var $ = require("jquery");
var _ = require("lodash");
var startup = require("./startup");

function formatSnode(snode) {
    var textNode = snode.childNodes[0];
    if (textNode.nodeType !== 3) {
        var newTN = document.createTextNode("");
        snode.insertBefore(newTN, textNode);
        textNode = newTN;
    }
    if (snode.nodeType !== 1) {
        throw "Tried to format a non-snode.";
    }
    var snodeElement = snode;
    var tv = snodeElement.getAttribute("data-category");
    if (snodeElement.getAttribute("data-subcategory")) {
        tv += "-" + snodeElement.getAttribute("data-subcategory");
    }
    if (snodeElement.getAttribute("data-index")) {
        tv += snodeElement.getAttribute("data-idxtype") === "gap" ? "=" : "-";
        tv += snodeElement.getAttribute("data-index");
    }
    tv += " ";
    textNode.nodeValue = tv;
}

function snodeChange(records, observer) {
    _.each(records, function (record) {
        formatSnode(record.target);
    });
}

var snodeMO = new MutationObserver(snodeChange);

startup.addStartupHook(function () {
    $(".snode").each(function () {
        if (this.id === "sn0") {
            return;
        }
        formatSnode(this);
        exports.observeSnode(this);
    });
});

function observeSnode(snode) {
    snodeMO.observe(snode, { attributes: true });
}
exports.observeSnode = observeSnode;

},{"./startup":27,"lodash":1}],23:[function(require,module,exports){
///<reference path="./../../../types/all.d.ts" />
var parser = require("../parse");
var logger = require("../ui/log");
var lastSavedState = require("./global").lastSavedState;
var $ = require("jquery");
var Q = require("q");

var saveInProgress = false;
exports.saveFn;

function save(e, extraArgs) {
    if (!extraArgs) {
        extraArgs = {};
    }
    if (document.getElementById("leafphrasebox") || document.getElementById("labelbox")) {
        // It should be impossible to trigger a save in these conditions, but
        // it causes data corruption if the save happens,, so this functions
        // as a last-ditch safety.
        logger.error("Cannot save while editing a node label.");
        return;
    }
    if (!saveInProgress) {
        logger.notice("Saving...");
        saveInProgress = true;
        var lss = $("#editpane").html();
        exports.saveFn(parser.parseHtmlToXml($("#sn0"))).then(function () {
            logger.notice("Save success");
            saveInProgress = false;
            lastSavedState = lss;
        }, function (err) {
            logger.error("Save error: " + err);
            saveInProgress = false;
        });
    }
}
exports.save = save;
;

},{"../parse":6,"../ui/log":33,"./global":16,"q":false}],24:[function(require,module,exports){
///<reference path="./../../../types/all.d.ts" />
var $ = require("jquery");
var startup = require("./startup");
var utils = require("./utils");
var dialog = require("./dialog");
var logger = require("../ui/log");

// TODO: anchor right end of string, so that NP does not match NPR, only NP or
// NP-X (???)
// TODO: profile this and optimize like crazy.
// * HTML strings and other globals
/**
* The HTML code for a regular search node
* @private
* @constant
*/
// TODO: make the presence of a lemma search option contingent on the presence
// of lemmata in the corpus
var searchnodehtml = "<div class='searchnode'>" + "<div class='searchadddelbuttons'>" + "<input type='button' class='searchornodebut' " + "value='|' />" + "<input type='button' class='searchdeepnodebut' " + "value='D' />" + "<input type='button' class='searchprecnodebut' " + "value='>' />" + "<input type='button' class='searchdelnodebut' " + "value='-' />" + "<input type='button' class='searchnewnodebut' " + "value='+' />" + "</div>" + "<select class='searchtype'><option>Label</option>" + "<option>Text</option><option>Lemma</option></select>: " + "<input type='text' class='searchtext' />" + "</div>";

/**
* The HTML code for an "or" search node
* @private
* @constant
*/
var searchornodehtml = "<div class='searchnode searchornode'>" + "<div class='searchadddelbuttons'>" + "<input type='button' class='searchdelnodebut' value='-' />" + "</div>" + "<input type='hidden' class='searchtype' value='Or' />OR<br />" + searchnodehtml + "</div>";

/**
* The HTML code for a "deep" search node
* @private
* @constant
*/
var searchdeepnodehtml = "<div class='searchnode searchdeepnode'>" + "<div class='searchadddelbuttons'>" + "<input type='button' class='searchdelnodebut' value='-' />" + "</div>" + "<input type='hidden' class='searchtype' value='Deep' />...<br />" + searchnodehtml + "</div>";

/**
* The HTML code for a "precedes" search node
* @private
* @constant
*/
var searchprecnodehtml = "<div class='searchnode searchprecnode'>" + "<div class='searchadddelbuttons'>" + "<input type='button' class='searchdelnodebut' value='-' />" + "</div>" + "<input type='hidden' class='searchtype' value='Prec' />&gt;<br />" + searchnodehtml + "</div>";

/**
* The HTML code for a node to add new search nodes
* @private
* @constant
*/
var addsearchnodehtml = "<div class='newsearchnode'>" + "<input type='hidden' class='searchtype' value='NewNode' />+" + "</div>";

/**
* The HTML code for the default starting search node
* @private
* @constant
*/
var searchhtml = "<div id='searchnodes' class='searchnode'><input type='hidden' " + "class='searchtype' value='Root' />" + searchnodehtml + "</div>";

/**
* The last search
*
* So that it can be restored next time the dialog is opened.
* @private
*/
var savedsearch = $(searchhtml);

// * Helper functions
/**
* Indicate that a node matches a search
*
* @param {Node} node the node to flag
*/
function flagSearchMatch(node) {
    $(node).addClass("searchmatch");
    $("#matchcommands").show();
}

/**
* Hook up event handlers after adding a node to the search dialog
*/
function searchNodePostAdd(node) {
    $(".searchnewnodebut").unbind("click").click(addSearchDaughter);
    $(".searchdelnodebut").unbind("click").click(searchDelNode);
    $(".searchdeepnodebut").unbind("click").click(searchDeepNode);
    $(".searchornodebut").unbind("click").click(searchOrNode);
    $(".searchprecnodebut").unbind("click").click(searchPrecNode);
    rejiggerSearchSiblingAdd();
    var nodeToFocus = (node && node.find(".searchtext")) || $(".searchtext").first();
    nodeToFocus.focus();
}

/**
* Recalculate the position of nodes that add siblings in the search dialog.
* @private
*/
function rejiggerSearchSiblingAdd() {
    $(".newsearchnode").remove();
    $(".searchnode").map(function () {
        $(this).children(".searchnode").last().after(addsearchnodehtml);
    });
    $(".newsearchnode").click(addSearchSibling);
}

/**
* Remember the currently-entered search, in order to restore it subsequently.
* @private
*/
function saveSearch() {
    savedsearch = $("#searchnodes").clone();
    var savedselects = savedsearch.find("select");
    var origselects = $("#searchnodes").find("select");
    savedselects.map(function (i) {
        $(this).val(origselects.eq(i).val());
    });
}

/**
* Perform the search as entered in the dialog
* @private
*/
function doSearch() {
    // TODO: need to save val of incremental across searches
    var searchnodes = $("#searchnodes");
    saveSearch();
    dialog.hideDialogBox();
    var searchCtx = $(".snode");
    var incremental = $("#searchInc").prop("checked");

    if (incremental && $(".searchmatch").length > 0) {
        var lastMatchTop = $(".searchmatch").last().offset().top;
        searchCtx = searchCtx.filter(function () {
            // TODO: do this with faster document position dom call
            return $(this).offset().top > lastMatchTop;
        });
    }

    clearSearchMatches();

    for (var i = 0; i < searchCtx.length; i++) {
        var res = interpretSearchNode(searchnodes, searchCtx[i]);
        if (res) {
            flagSearchMatch(res);
            if (incremental) {
                break;
            }
        }
    }
    nextSearchMatch(null, true);
    // TODO: when reaching the end of the document in incremental search,
    // don't dehighlight the last match, but print a nice message
    // TODO: need a way to go back in incremental search
}

/**
* Clear any previous search, reverting the dialog back to its default state.
* @private
*/
function clearSearch() {
    savedsearch = $(searchhtml);
    $("#searchnodes").replaceWith(savedsearch);
    searchNodePostAdd();
}

// * Event handlers
/**
* Clear the highlighting from search matches.
*/
function clearSearchMatches() {
    $(".searchmatch").removeClass("searchmatch");
    $("#matchcommands").hide();
}

/**
* Scroll down to the next node that matched a search.
*/
function nextSearchMatch(e, fromSearch) {
    if (!fromSearch) {
        if ($("#searchInc").prop("checked")) {
            doSearch();
        }
    }
    utils.scrollToNext(".searchmatch");
}

/**
* Add a sibling search node
* @private
*/
function addSearchDaughter(e) {
    var node = $(e.target).parents(".searchnode").first();
    var newnode = $(searchnodehtml);
    node.append(newnode);
    searchNodePostAdd(newnode);
}

/**
* Add a sibling search node
* @private
*/
function addSearchSibling(e) {
    var node = $(e.target);
    var newnode = $(searchnodehtml);
    node.before(newnode);
    searchNodePostAdd(newnode);
}

/**
* Delete a search node
* @private
*/
function searchDelNode(e) {
    var node = $(e.target).parents(".searchnode").first();
    var tmp = $("#searchnodes").children(".searchnode:not(.newsearchnode)");
    if (tmp.length === 1 && tmp.is(node) && node.children(".searchnode").length === 0) {
        logger.warning("Cannot remove only search term!");
        return;
    }
    var child = node.children(".searchnode").first();
    if (child.length === 1) {
        node.contents().filter(":not(.searchnode)").remove();
        child.unwrap();
    } else {
        node.remove();
    }
    rejiggerSearchSiblingAdd();
}

/**
* Add an "or" search node
* @private
*/
function searchOrNode(e) {
    var node = $(e.target).parents(".searchnode").first();
    var newnode = $(searchornodehtml);
    node.replaceWith(newnode);
    newnode.children(".searchnode").replaceWith(node);
    searchNodePostAdd(newnode);
}

/**
* Add a "deep" search node
* @private
*/
function searchDeepNode(e) {
    var node = $(e.target).parents(".searchnode").first();
    var newnode = $(searchdeepnodehtml);
    node.append(newnode);
    searchNodePostAdd(newnode);
}

/**
* Add a "precedes" search node
* @private
*/
function searchPrecNode(e) {
    var node = $(e.target).parents(".searchnode").first();
    var newnode = $(searchprecnodehtml);
    node.after(newnode);
    searchNodePostAdd(newnode);
}

// * Search interpretation function
/**
* Interpret the DOM nodes comprising the search dialog.
*
* This function is treponsible for transforming the representation of a
* search query as HTML into an executable query, and matching it against a
* node.
* @private
*
* @param {Node} node the search node to interpret
* @param {Node} target the tree node to match it against
* @param {Object} options search options
* @returns {Node} `target` if it matched the query, otherwise `undefined`
*/
function interpretSearchNode(node, target, options) {
    if (typeof options === "undefined") { options = {}; }
    // TODO: optimize to remove jquery calls, only use regex matching if needed
    // TODO: make case sensitivity an option?
    var searchtype = $(node).children(".searchtype").val();
    var rx, hasMatch, i, j;
    var newTarget = $(target).children();
    var childSearches = $(node).children(".searchnode");

    if ($(node).parent().is("#searchnodes") && !$("#searchnodes").children(".searchnode").first().is(node) && !options.norecurse) {
        // special case siblings at root level
        // What an ugly hack, can it be improved?
        newTarget = $(target).siblings();
        for (j = 0; j < newTarget.length; j++) {
            if (interpretSearchNode(node, newTarget[j], { norecurse: true })) {
                return target;
            }
        }
    }

    if (searchtype === "Label") {
        rx = RegExp("^" + $(node).children(".searchtext").val(), "i");
        hasMatch = $(target).hasClass("snode") && rx.test(utils.getLabel($(target)));
        if (!hasMatch) {
            return undefined;
        }
    } else if (searchtype === "Text") {
        rx = RegExp("^" + $(node).children(".searchtext").val(), "i");
        hasMatch = $(target).children(".wnode").length === 1 && rx.test(utils.wnodeString(target));
        if (!hasMatch) {
            return undefined;
        }
    } else if (searchtype === "Lemma") {
        rx = RegExp("^" + $(node).children(".searchtext").val(), "i");
        hasMatch = utils.hasLemma($(target)) && rx.test(utils.getLemma($(target)));
        if (!hasMatch) {
            return undefined;
        }
    } else if (searchtype === "Root") {
        newTarget = $(target);
    } else if (searchtype === "Or") {
        for (i = 0; i < childSearches.length; i++) {
            if (interpretSearchNode($(childSearches[i]), target)) {
                return target;
            }
        }
        return undefined;
    } else if (searchtype === "Deep") {
        newTarget = $(target).find(".snode,.wnode");
    } else if (searchtype === "Prec") {
        newTarget = $(target).nextAll();
    }

    for (i = 0; i < childSearches.length; i++) {
        var succ = false;
        for (j = 0; j < newTarget.length; j++) {
            if (interpretSearchNode($(childSearches[i]), newTarget[j])) {
                succ = true;
                break;
            }
        }
        if (!succ) {
            return undefined;
        }
    }

    return target;
}

// * The core search function
/**
* Display a search dialog.
*/
function search() {
    var html = "<div id='searchnodes' />" + "<div id='dialogButtons'><label for='searchInc'>Incremental: " + "</label><input id='searchInc' name='searchInc' type='checkbox' />" + "<input id='clearSearch' type='button' value='Clear' />" + "<input id='doSearch' type='button' value='Search' /></div>";
    dialog.showDialogBox("Search", html, doSearch, saveSearch);
    $("#searchnodes").replaceWith(savedsearch);
    $("#doSearch").click(doSearch);
    $("#clearSearch").click(clearSearch);
    searchNodePostAdd();
}
exports.search = search;

// * Startup hook
startup.addStartupHook(function () {
    $("#butsearch").click(exports.search);
    $("#butnextmatch").click(nextSearchMatch);
    $("#butclearmatch").click(clearSearchMatches);
    $("#matchcommands").hide();
});

},{"../ui/log":33,"./dialog":12,"./startup":27,"./utils":31}],25:[function(require,module,exports){
///<reference path="./../../../types/all.d.ts" />
var dummy;

var $ = require("jquery");
var contextmenu = require("./contextmenu");
dummy = require("./contextmenu.ts");
var metadataEditor = require("./metadata");
dummy = require("./metadata.ts");
var globals = require("./global");
dummy = require("./global.ts");

/**
* This variable holds the selected node, or "start" node if multiple
* selection is in effect.  Otherwise undefined.
*
* @type Element
*/
var startnode = null;

/**
* This variable holds the "end" node if multiple selection is in effect.
* Otherwise undefined.
*
* @type Element
*/
var endnode = null;

function updateSelection(suppressRemote) {
    // update selection display
    $(".snodesel").removeClass("snodesel");

    if (startnode) {
        $(startnode).addClass("snodesel");
    }

    if (endnode) {
        $(endnode).addClass("snodesel");
    }

    metadataEditor.updateMetadataEditor();

    if (!suppressRemote) {
        $(document).trigger("set_selection", [startnode, endnode]);
    }
}
exports.updateSelection = updateSelection;

/**
* Remove any selection of nodes.
*/
function clearSelection() {
    metadataEditor.saveMetadata();
    window.event.preventDefault();
    startnode = endnode = null;
    exports.updateSelection();
    contextmenu.hideContextMenu();
}
exports.clearSelection = clearSelection;

/**
* Select a node, and update the GUI to reflect that.
*
* @param {Node} node the node to be selected
* @param {Boolean} force if true, force this node to be a secondary
* selection, even if it wouldn't otherwise be
* @param {Boolean} remote whether this request was triggered remotely
*/
function selectNode(node, force) {
    if (node) {
        if (!(node instanceof Element)) {
            try  {
                throw Error("foo");
            } catch (e) {
                console.log("selecting a non-node: " + e.stack);
            }
        }
        if (node === document.getElementById("sn0")) {
            exports.clearSelection();
            return;
        }

        while (node && !$(node).hasClass("snode")) {
            node = node.parentNode;
            if (node.nodeType !== 1) {
                node = undefined;
            }
        }

        if (node === startnode) {
            startnode = null;
            if (endnode) {
                startnode = endnode;
                endnode = null;
            }
        } else if (startnode === null) {
            startnode = node;
        } else {
            if (startnode && (globals.lastEventWasMouse || force)) {
                if (node === endnode) {
                    endnode = null;
                } else {
                    endnode = node;
                }
            } else {
                endnode = null;
                startnode = node;
            }
        }
        exports.updateSelection();
    } else {
        try  {
            throw Error("foo");
        } catch (e) {
            console.log("tried to select something falsey: " + e.stack);
        }
    }
}
exports.selectNode = selectNode;

/**
* Scroll the page so that the first selected node is visible.
*/
function scrollToShowSel() {
    function isTopVisible(elem) {
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();
        var elemTop = $(elem).offset().top;

        return ((elemTop <= docViewBottom) && (elemTop >= docViewTop));
    }
    if (!isTopVisible(startnode)) {
        window.scroll(0, $(startnode).offset().top - $(window).height() * 0.25);
    }
}
exports.scrollToShowSel = scrollToShowSel;
;

function get(second) {
    if (second) {
        return endnode;
    }
    return startnode;
}
exports.get = get;

function set(node, second) {
    if (second) {
        endnode = node;
    } else {
        startnode = node;
    }
}
exports.set = set;

function cardinality() {
    if (startnode && endnode) {
        return 2;
    } else if (startnode) {
        return 1;
    } else {
        return 0;
    }
}
exports.cardinality = cardinality;

function clear(second) {
    if (second) {
        endnode = undefined;
    } else {
        startnode = undefined;
    }
}
exports.clear = clear;

},{"./contextmenu":10,"./contextmenu.ts":11,"./global":16,"./global.ts":17,"./metadata":19,"./metadata.ts":20}],26:[function(require,module,exports){
module.exports=require(25)
},{"./contextmenu":10,"./contextmenu.ts":11,"./global":16,"./global.ts":17,"./metadata":19,"./metadata.ts":20}],27:[function(require,module,exports){
///<reference path="./../../../types/all.d.ts" />
;

/* These vars and functions need to be put before the requires, because of
* circular dependency issues.
*/
var startupHooks = [], shutdownHooks = [], savedOnKeydown, savedOnMouseup, savedOnBeforeUnload, savedOnUnload, shutdownCallback;

function addStartupHook(fn) {
    startupHooks.push(fn);
}
exports.addStartupHook = addStartupHook;

function addShutdownHook(fn) {
    shutdownHooks.push(fn);
}
exports.addShutdownHook = addShutdownHook;
;

var globals = require("./global");
var lastSavedState = globals.lastSavedState;
var $ = require("jquery");
var _ = require("lodash");
var displayError = require("../ui/log").error;
var events = require("./events");
var save = require("./save");
var undo = require("./undo");
var selection = require("./selection");
var contextmenu = require("./contextmenu");

require("./entry-points"); // TODO: is this necessary?

function quitTreeDrawing(e, force) {
    // unAutoIdle();
    if (!force && $("#editpane").html() !== lastSavedState) {
        displayError("Cannot exit, unsaved changes exist.  <a href='#' " + "onclick='quitServer(null, true);return false;'>Force</a>");
    } else {
        document.body.onkeydown = savedOnKeydown;
        document.body.onmouseup = savedOnMouseup;
        window.onunload = savedOnUnload;
        window.onbeforeunload = savedOnBeforeUnload;
        _.each(shutdownHooks, function (hook) {
            hook();
        });
        shutdownCallback();
    }
}
exports.quitTreeDrawing = quitTreeDrawing;

function navigationWarning() {
    if ($("#editpane").html() !== lastSavedState) {
        return "Unsaved changes exist, are you sure you want to leave the page?";
    }
    return undefined;
}

function assignEvents() {
    // Save global event handlers
    savedOnKeydown = document.body.onkeydown;
    savedOnMouseup = document.body.onmouseup;
    savedOnBeforeUnload = window.onbeforeunload;
    savedOnUnload = window.onunload;

    // Install global event handlers
    document.body.onkeydown = events.handleKeyDown;
    document.body.onmouseup = events.killTextSelection;
    window.onbeforeunload = navigationWarning;

    // window.onunload = logUnload;
    // Install element-specific event handlers
    $("#sn0").mousedown(events.handleNodeClick);
    $("#butsave").mousedown(save.save);
    $("#butundo").mousedown(undo.undo);
    $("#butredo").mousedown(undo.redo);
    $("#butexit").unbind("click").click(exports.quitTreeDrawing);

    // TODO
    //$("#butidle").mousedown(idle);
    //$("#butvalidate").unbind("click").click(validateTrees);
    //$("#butnexterr").unbind("click").click(nextValidationError);
    //$("#butnexttree").unbind("click").click(nextTree);
    //$("#butprevtree").unbind("click").click(prevTree);
    //$("#butgototree").unbind("click").click(goToTree);
    $("#editpane").mousedown(selection.clearSelection);
    $("#conMenu").mousedown(contextmenu.hideContextMenu);
    // $(document).mousewheel(handleMouseWheel);
}

function startupTreedrawing(exitFn, saveFn) {
    // TODO: something is very slow here; profile
    assignEvents();

    _.each(startupHooks, function (hook) {
        hook();
    });

    lastSavedState = $("#editpane").html();
    shutdownCallback = exitFn;
    save.saveFn = saveFn;
}
exports.startupTreedrawing = startupTreedrawing;

function resetGlobals() {
    // TODO: encapsulation violation
    var newGlobals = {
        ipnodes: [],
        commentTypes: [],
        extensions: [],
        clauseExtensions: [],
        leafExtensions: [],
        caseBarriers: [],
        displayCaseMenu: false,
        caseTags: [],
        casePhrases: [],
        caseMarkers: [],
        defaultConMenuGroup: [],
        logDetail: false
    };
    _.forOwn(newGlobals, function (v, k) {
        globals[k] = v;
    });
    contextmenu.resetGlobals();
}
exports.resetGlobals = resetGlobals;

},{"../ui/log":33,"./contextmenu":10,"./entry-points":14,"./events":15,"./global":16,"./save":23,"./selection":25,"./undo":29,"lodash":1}],28:[function(require,module,exports){
///<reference path="./../../../types/all.d.ts" />
/* tslint:disable:variable-name no-bitwise quotemark */
var $ = require("jquery");
var utils = require("./utils");
var selection = require("./selection");
var undo = require("./undo");
var events = require("./events");
var conf = require("./config");

// * Coindexation
/**
* Coindex nodes.
*
* Coindex the two selected nodes.  If they are already coindexed, toggle
* types of coindexation (normal -> gapping -> backwards gapping -> double
* gapping -> no indices).  If only one node is selected, remove its index.
*/
function coIndex() {
    var sel = selection.get();
    var sel2 = selection.get(true);
    if (selection.cardinality() === 1) {
        if (utils.getIndex(sel)) {
            undo.touchTree($(sel));
            utils.removeIndex(sel);
        }
    } else if (selection.cardinality() === 2) {
        // don't do anything if different token roots
        var startRoot = utils.getTokenRoot($(sel));
        var endRoot = utils.getTokenRoot($(sel2));
        if (startRoot !== endRoot) {
            // TODO: message
            return;
        }

        undo.touchTree($(sel));

        // if both nodes already have an index
        if (utils.getIndex(sel) && utils.getIndex(sel2)) {
            // and if it is the same index
            if (utils.getIndex(sel) === utils.getIndex(sel2)) {
                var types = utils.getIndexType(sel) + utils.getIndexType(sel2);

                // remove it
                if (types === "=-") {
                    utils.setIndexType(sel2, "=");
                } else if (types === "--") {
                    utils.setIndexType(sel2, "=");
                } else if (types === "-=") {
                    utils.setIndexType(sel, "=");
                    utils.setIndexType(sel2, "-");
                } else if (types === "==") {
                    utils.removeIndex(sel);
                    utils.removeIndex(sel2);
                }
            }
        } else if (utils.getIndex(sel) && !utils.getIndex(sel2)) {
            utils.setIndex(sel2, utils.getIndex(sel));
        } else if (!utils.getIndex(sel) && utils.getIndex(sel2)) {
            utils.setIndex(sel, utils.getIndex(sel2));
        } else {
            var index = utils.maxIndex(startRoot) + 1;
            utils.setIndex(sel, index);
            utils.setIndex(sel2, index);
        }
    }
}
exports.coIndex = coIndex;

// * Movement
/**
* Move the selected node(s) to a new position.
*
* The movement operation must not change the text of the token.
*
* Empty categories are not allowed to be moved as a leaf.  However, a
* non-terminal containing only empty categories can be moved.
*
* @param {Node} parent the parent node to move selection under
*
* @returns {Boolean} whether the operation was successful
*/
function moveNode(parent) {
    var parent_ip = $(selection.get()).parents("#sn0>.snode,#sn0").first();
    var other_parent = $(parent).parents("#sn0>.snode,#sn0").first();
    if (parent === document.getElementById("sn0") || !parent_ip.is(other_parent)) {
        parent_ip = $("#sn0");
    }
    var parent_before;
    var textbefore = utils.currentText(parent_ip);
    if (!utils.isPossibleTarget(parent) || $(selection.get()).parent().children().length === 1 || $(parent).parents().is(selection.get()) || utils.isEmptyNode(selection.get())) {
        selection.clearSelection();
        return false;
    } else if ($(selection.get()).parents().is(parent)) {
        // move up if moving to a node that is already my parent
        if ($(selection.get()).parent().children().first().is(selection.get())) {
            if ($(selection.get()).parentsUntil(parent).slice(0, -1).filter(":not(:first-child)").length > 0) {
                selection.clearSelection();
                return false;
            }
            if (parent === document.getElementById("sn0")) {
                undo.touchTree($(selection.get()));
                undo.registerNewRootTree($(selection.get()));
            } else {
                undo.touchTree($(selection.get()));
            }
            $(selection.get()).insertBefore($(parent).children().filter($(selection.get()).parents()));
            if (utils.currentText(parent_ip) !== textbefore) {
                alert("failed what should have been a strict test");
            }
        } else if ($(selection.get()).parent().children().last().is(selection.get())) {
            if ($(selection.get()).parentsUntil(parent).slice(0, -1).filter(":not(:last-child)").length > 0) {
                selection.clearSelection();
                return false;
            }
            if (parent === document.getElementById("sn0")) {
                undo.touchTree($(selection.get()));
                undo.registerNewRootTree($(selection.get()));
            } else {
                undo.touchTree($(selection.get()));
            }
            $(selection.get()).insertAfter($(parent).children().filter($(selection.get()).parents()));
            if (utils.currentText(parent_ip) !== textbefore) {
                alert("failed what should have been a strict test");
            }
        } else {
            // cannot move from this position
            selection.clearSelection();
            return false;
        }
    } else {
        // otherwise move under my sister
        var tokenMerge = utils.isRootNode($(selection.get()));
        var maxindex = utils.maxIndex(utils.getTokenRoot($(parent)));
        var movednode = $(selection.get());

        // NOTE: currently there are no more stringent checks below; if that
        // changes, we might want to demote this
        parent_before = parent_ip.clone();

        // where a and b are DOM elements (not jquery-wrapped),
        // a.compareDocumentPosition(b) returns an integer.  The first (counting
        // from 0) bit is set if B precedes A, and the second bit is set if A
        // precedes B.
        // TODO: perhaps here and in the immediately following else if it is
        // possible to simplify and remove the compareDocumentPosition call,
        // since the jQuery subsumes it
        if (parent.compareDocumentPosition(selection.get()) & 0x4) {
            // check whether the nodes are adjacent.  Ideally, we would like
            // to say selfAndParentsUntil, but no such jQuery fn exists, thus
            // necessitating the disjunction.
            // TODO: too strict
            // &&
            // $(selection.get()).prev().is(
            //     $(parent).parentsUntil(startnode.parentNode).last()) ||
            // $(selection.get()).prev().is(parent)
            // parent precedes startnode
            undo.undoBeginTransaction();
            if (tokenMerge) {
                undo.registerDeletedRootTree($(selection.get()));
                undo.touchTree($(parent));

                // TODO: this will bomb if we are merging more than 2 tokens
                // by multiple selection.
                utils.addToIndices(movednode, maxindex);
            } else {
                undo.touchTree($(selection.get()));
                undo.touchTree($(parent));
            }
            movednode.appendTo(parent);
            if (utils.currentText(parent_ip) !== textbefore) {
                undo.undoAbortTransaction();
                parent_ip.replaceWith(parent_before);
                if (parent_ip.prop("id") === "sn0") {
                    $("#sn0").mousedown(events.handleNodeClick);
                }
                selection.clearSelection();
                return false;
            } else {
                undo.undoEndTransaction();
            }
        } else if ((parent.compareDocumentPosition(selection.get()) & 0x2)) {
            // &&
            // $(selection.get()).next().is(
            //     $(parent).parentsUntil(startnode.parentNode).last()) ||
            // $(selection.get()).next().is(parent)
            // startnode precedes parent
            undo.undoBeginTransaction();
            if (tokenMerge) {
                undo.registerDeletedRootTree($(selection.get()));
                undo.touchTree($(parent));
                utils.addToIndices(movednode, maxindex);
            } else {
                undo.touchTree($(selection.get()));
                undo.touchTree($(parent));
            }
            movednode.insertBefore($(parent).children().first());
            if (utils.currentText(parent_ip) !== textbefore) {
                undo.undoAbortTransaction();
                parent_ip.replaceWith(parent_before);
                if (parent_ip.attr("id") === "sn0") {
                    $("#sn0").mousedown(events.handleNodeClick);
                }
                selection.clearSelection();
                return false;
            } else {
                undo.undoEndTransaction();
            }
        }
    }
    selection.clearSelection();
    return true;
}
exports.moveNode = moveNode;

/**
* Move several nodes.
*
* The two selected nodes must be sisters, and they and all intervening sisters
* will be moved as a unit.  Calls {@link moveNode} to do the heavy lifting.
*
* @param {Node} parent the parent to move the selection under
*/
function moveNodes(parent) {
    if (selection.cardinality() !== 2) {
        return;
    }
    undo.undoBeginTransaction();
    undo.touchTree($(selection.get()));
    undo.touchTree($(parent));
    if (selection.get().compareDocumentPosition(selection.get(true)) & 0x2) {
        // endnode precedes startnode, reverse them
        var temp = selection.get();
        selection.set(selection.get(true));
        selection.set(temp, true);
    }
    if (selection.get().parentNode === selection.get(true).parentNode) {
        // collect startnode and its sister up until endnode
        $(selection.get()).add($(selection.get()).nextUntil($(selection.get(true)))).add($(selection.get(true))).wrapAll('<div xxx="newnode" class="snode">XP</div>');
    } else {
        return;
    }
    var toselect = $(".snode[xxx=newnode]").first();

    // BUG when making XP and then use context menu: TODO XXX
    selection.set(toselect.get(0));
    var res = undo.ignoringUndo(function () {
        exports.moveNode(parent);
    });
    if (res) {
        undo.undoEndTransaction();
    } else {
        undo.undoAbortTransaction();
    }
    selection.set($(".snode[xxx=newnode]").first().get(0));
    selection.clear(true);
    exports.pruneNode();
    selection.clearSelection();
}
exports.moveNodes = moveNodes;

// * Deletion
/**
* Delete a node.
*
* The node can only be deleted if doing so does not affect the text, i.e. it
* directly dominates no non-empty terminals.
*/
function pruneNode() {
    if (selection.cardinality() === 1) {
        if (utils.isLeafNode(selection.get()) && utils.isEmptyNode(selection.get())) {
            // it is ok to delete leaf if it is empty/trace
            if (utils.isRootNode($(selection.get()))) {
                // perversely, it is possible to have a leaf node at the root
                // of a file.
                undo.registerDeletedRootTree($(selection.get()));
            } else {
                undo.touchTree($(selection.get()));
            }
            var idx = utils.getIndex(selection.get());
            if (idx > 0) {
                var root = $(utils.getTokenRoot($(selection.get())));
                var sameIdx = root.find('.snode').filter(function () {
                    return utils.getIndex(this) === idx;
                }).not(selection.get());
                if (sameIdx.length === 1) {
                    var osn = selection.get();
                    selection.set(sameIdx.get(0));
                    exports.coIndex();
                    selection.set(osn);
                }
            }
            $(selection.get()).remove();
            selection.clearSelection();
            selection.updateSelection();
            return;
        } else if (utils.isLeafNode(selection.get())) {
            // but other leaves are not deleted
            return;
        } else if (selection.get() === document.getElementById("sn0")) {
            return;
        }

        var toselect = $(selection.get()).children().first();
        undo.touchTree($(selection.get()));
        $(selection.get()).replaceWith($(selection.get()).children());
        selection.clearSelection();
        selection.selectNode(toselect.get(0));
        selection.updateSelection();
    }
}
exports.pruneNode = pruneNode;

// * Creation
// TODO: the hardcoding of defaults in this function is ugly.  We should
// supply a default heuristic fn to try to guess these, then allow
// settings.js to override it.
// TODO: maybe put the heuristic into leafbefore/after, and leave this fn clean?
/**
* Create a leaf node adjacent to the selection, or a given target.
*
* @param {Boolean} before whether to create the node before or after selection
* @param {String} label the label to give the new node
* @param {String} word the text to give the new node
* @param {Node} target where to put the new node (default: selected node)
*/
function makeLeaf(before, label, word, target) {
    if (typeof label === "undefined") { label = "NP-SBJ"; }
    if (typeof word === "undefined") { word = "*con"; }
    if (!(target || selection.get())) {
        return;
    }
    if (target === undefined) {
        target = selection.get();
    }

    undo.undoBeginTransaction();
    var isRootLevel = false;
    if (utils.isRootNode($(target))) {
        isRootLevel = true;
    } else {
        undo.touchTree($(target));
    }

    var lemma = "";
    var temp = word.split("-");
    if (temp.length > 1) {
        lemma = temp.pop();
        word = temp.join("-");
    }

    var doCoindex = false;

    if (selection.get(true)) {
        var startRoot = utils.getTokenRoot($(selection.get()));
        var endRoot = utils.getTokenRoot($(selection.get(true)));
        if (startRoot === endRoot) {
            word = "*ICH*";
            label = utils.getLabel($(selection.get(true)));
            if (utils.startsWith(label, "W")) {
                word = "*T*";
                label = label.substr(1).replace(/-[0-9]+$/, "");
            } else if (label.split("-").indexOf("CL") > -1) {
                word = "*CL*";
                label = utils.getLabel($(selection.get(true))).replace("-CL", "");
                if (label.substring(0, 3) === "PRO") {
                    label = "NP";
                }
            }
            doCoindex = true;
        } else {
            undo.undoAbortTransaction();
            return;
        }
    }

    var newleaf = "<div class='snode " + label + "'>" + label + "<span class='wnode'>" + word;
    if (lemma !== "") {
        newleaf += "<span class='lemma'>-" + lemma + "</span>";
    }
    newleaf += "</span></div>\n";
    var newleafJQ = $(newleaf);
    if (before) {
        newleafJQ.insertBefore(target);
    } else {
        newleafJQ.insertAfter(target);
    }
    if (doCoindex) {
        selection.set(newleafJQ.get(0));
        exports.coIndex();
    }
    selection.clear();
    selection.clear(true);
    selection.selectNode(newleafJQ.get(0));
    selection.updateSelection();
    if (isRootLevel) {
        undo.registerNewRootTree(newleafJQ);
    }
    undo.undoEndTransaction();
}
exports.makeLeaf = makeLeaf;

/**
* Create a leaf node before the selected node.
*
* Uses heuristic to determine whether the new leaf is to be a trace, empty
* subject, etc.
*/
function leafBefore() {
    exports.makeLeaf(true);
}
exports.leafBefore = leafBefore;

/**
* Create a leaf node after the selected node.
*
* Uses heuristic to determine whether the new leaf is to be a trace, empty
* subject, etc.
*/
function leafAfter() {
    exports.makeLeaf(false);
}
exports.leafAfter = leafAfter;
;

/**
* Create a phrasal node.
*
* The node will dominate the selected node or (if two sisters are selected)
* the selection and all intervening sisters.
*
* @param {String} [label] the label to give the new node (default: XP)
*/
function makeNode(label) {
    // check if something is selected
    if (!selection.get()) {
        return;
    }
    if (!label) {
        label = "XP";
    }
    var rootLevel = utils.isRootNode($(selection.get()));
    undo.undoBeginTransaction();
    if (rootLevel) {
        undo.registerDeletedRootTree($(selection.get()));
    } else {
        undo.touchTree($(selection.get()));
    }
    var parent_ip = $(selection.get()).parents("#sn0>.snode,#sn0").first();
    var parent_before = parent_ip.clone();
    var newnode = '<div class="snode ' + label + '">' + label + ' </div>\n';

    // make end = start if only one node is selected
    if (!selection.get(true)) {
        // if only one node, wrap around that one
        $(selection.get()).wrapAll(newnode);
    } else {
        if (selection.get().compareDocumentPosition(selection.get(true)) & 0x2) {
            // startnode and endnode in wrong order, reverse them
            var temp = selection.get();
            selection.set(selection.get(true));
            selection.set(temp, true);
        }

        // check if they are really sisters XXXXXXXXXXXXXXX
        if ($(selection.get()).siblings().is(selection.get(true))) {
            // then, collect startnode and its sister up until endnode
            var oldtext = utils.currentText(parent_ip);
            $(selection.get()).add($(selection.get()).nextUntil($(selection.get(true)))).add($(selection.get(true))).wrapAll(newnode);

            // undo if this messed up the text order
            if (utils.currentText(parent_ip) !== oldtext) {
                // TODO: is this plausible? can we remove the check?
                parent_ip.replaceWith(parent_before);
                undo.undoAbortTransaction();
                selection.clearSelection();
                return;
            }
        } else {
            return;
        }
    }

    var toselect = $(selection.get()).parent();

    selection.clearSelection();

    if (rootLevel) {
        undo.registerNewRootTree(toselect);
    }

    undo.undoEndTransaction();

    selection.selectNode(toselect.get(0));
    selection.updateSelection();
}
exports.makeNode = makeNode;

// * Label manipulation
/**
* Toggle a dash tag on a node
*
* If the node bears the given dash tag, remove it.  If not, add it.  This
* function attempts to put multiple dash tags in the proper order, according
* to the configuration in the `leaf_extensions`, `extensions`, and
* `clause_extensions` variables in the `settings.js` file.
*
* @param {String} extension the dash tag to toggle
* @param {String[]} [extensionList] override the guess as to the
* appropriate ordered list of possible extensions.
*/
function toggleExtension(extension, extensionList) {
    if (selection.cardinality() !== 1) {
        return false;
    }

    if (!extensionList) {
        if (utils.guessLeafNode(selection.get())) {
            extensionList = conf.leafExtensions;
        } else if (utils.getLabel($(selection.get())).split("-")[0] === "IP" || utils.getLabel($(selection.get())).split("-")[0] === "CP") {
            // TODO: should FRAG be a clause?
            // TODO: make configurable
            extensionList = conf.clauseExtensions;
        } else {
            extensionList = conf.extensions;
        }
    }

    // Tried to toggle an extension on an inapplicable node.
    if (extensionList.indexOf(extension) < 0) {
        return false;
    }

    undo.touchTree($(selection.get()));
    var textnode = utils.textNode($(selection.get()));
    var oldlabel = $.trim(textnode.text());

    // Extension is not de-dashed here.  toggleStringExtension handles it.
    // The new config format however requires a dash-less extension.
    var newlabel = utils.toggleStringExtension(oldlabel, extension, extensionList);
    textnode.replaceWith(newlabel + " ");
    utils.updateCssClass($(selection.get()), oldlabel);

    return true;
}
exports.toggleExtension = toggleExtension;

/**
* Set the label of a node intelligently
*
* Given a list of labels, this function will attempt to find the node's
* current label in the list.  If it is successful, it sets the node's label
* to the next label in the list (or the first, if the node's current label is
* the last in the list).  If not, it sets the label to the first label in the
* list.
*
* @param labels a list of labels.  This can also be an object -- if so, the
* base label (without any dash tags) of the target node is looked up as a
* key, and its corresponding value is used as the list.  If there is no value
* for that key, the first value specified in the object is the default.
*/
function setLabel(labels) {
    if (selection.cardinality() !== 1) {
        return false;
    }

    var textnode = utils.textNode($(selection.get()));
    var oldlabel = $.trim(textnode.text());
    var newlabel = utils.lookupNextLabel(oldlabel, labels);

    // TODO: restore
    // if (utils.guessLeafNode($(selection.get()))) {
    //     if (typeof testValidLeafLabel !== "undefined") {
    //         if (!testValidLeafLabel(newlabel)) {
    //             return false;
    //         }
    //     }
    // } else {
    //     if (typeof testValidPhraseLabel !== "undefined") {
    //         if (!testValidPhraseLabel(newlabel)) {
    //             return false;
    //         }
    //     }
    // }
    undo.touchTree($(selection.get()));

    textnode.replaceWith(newlabel + " ");
    utils.updateCssClass($(selection.get()), oldlabel);

    return true;
}
exports.setLabel = setLabel;

},{"./config":8,"./events":15,"./selection":25,"./undo":29,"./utils":31}],29:[function(require,module,exports){
///<reference path="./../../../types/all.d.ts" />
var $ = require("jquery");
var _ = require("lodash");
var selection = require("./selection");
var startup = require("./startup");
var utils = require("./utils");

var logger = require("../ui/log");


// TODO: type decls!
var undoMap, undoNewTrees, undoDeletedTrees, undoStack = [], redoStack = [], undoTransactionStack = [];

var idNumber = 1;

/**
* Reset the undo system.
*
* This function removes any intermediate state the undo system has stored; it
* does not affect the undo history.
* @private
*/
function resetUndo() {
    undoMap = {};
    undoNewTrees = [];
    undoDeletedTrees = [];
    undoTransactionStack = [];
}
exports.resetUndo = resetUndo;

/**
* Reset the undo system entirely.
*
* This function zeroes out any undo history.
*/
function nukeUndo() {
    exports.resetUndo();
    undoStack = [];
    redoStack = [];
}
exports.nukeUndo = nukeUndo;

/**
* Record an undo step.
* @private
*/
function undoBarrier() {
    if (_.size(undoMap) === 0 && _.size(undoNewTrees) === 0 && _.size(undoDeletedTrees) === 0) {
        return;
    }
    undoStack.push({
        map: undoMap,
        newTr: undoNewTrees,
        delTr: undoDeletedTrees
    });
    exports.resetUndo();
    redoStack = [];
}
exports.undoBarrier = undoBarrier;

/**
* Begin an undo transaction.
*
* This function MUST be matched by a call to either `undoEndTransaction`
* (which keeps all intermediate steps since the start call) or
* `undoAbortTransaction` (which discards said steps).
*/
function undoBeginTransaction() {
    undoTransactionStack.push({
        map: undoMap,
        newTr: undoNewTrees,
        delTr: undoDeletedTrees
    });
}
exports.undoBeginTransaction = undoBeginTransaction;

/**
* End an undo transaction, keeping its changes
*/
function undoEndTransaction() {
    undoTransactionStack.pop();
}
exports.undoEndTransaction = undoEndTransaction;

/**
* End an undo transaction, discarding its changes
*/
function undoAbortTransaction() {
    var t = undoTransactionStack.pop();
    undoMap = t.map;
    undoNewTrees = t.newTr;
    undoDeletedTrees = t.delTr;
}
exports.undoAbortTransaction = undoAbortTransaction;

/**
* Execute a function, discarding whatever effects it has on the undo system.
*
* @param {Function} fn a function to execute
*
* @returns the result of `fn`
*/
function ignoringUndo(fn) {
    // a bit of a grim hack, but it works
    exports.undoBeginTransaction();
    var res = fn();
    exports.undoAbortTransaction();
    return res;
}
exports.ignoringUndo = ignoringUndo;

/**
* Inform the undo system that changes are being made.
*
* @param {JQuery} node the node in which changes are being made
*/
function touchTree(node) {
    var root = $(utils.getTokenRoot(node));
    if (!undoMap[root.prop("id")]) {
        undoMap[root.prop("id")] = root.clone();
    }
}
exports.touchTree = touchTree;
;

/**
* Inform the undo system of the addition of a new tree at the root level.
*
* @param {JQuery} tree the tree being added
*/
function registerNewRootTree(tree) {
    var newid = "id" + idNumber;
    idNumber++;
    undoNewTrees.push(newid);
    tree.prop("id", newid);
}
exports.registerNewRootTree = registerNewRootTree;
;

/**
* Inform the undo system of a tree's removal at the root level
*
* @param {JQuery} tree the tree being removed
*/
function registerDeletedRootTree(tree) {
    var prev = tree.prev();
    if (prev.length === 0) {
        prev = null;
    }
    undoDeletedTrees.push({
        tree: tree,
        before: prev && prev.prop("id")
    });
}
exports.registerDeletedRootTree = registerDeletedRootTree;

/**
* Perform an undo operation.
*
* This is a worker function, wrapped by `undo` and `redo`.
* @private
*/
// TODO: actual type
function doUndo(undoData) {
    // The following hint to the type of map is needed by the compiler,
    // apparently
    var map = {}, newTr = [], delTr = [];

    _.forEach(undoData.map, function (v, k) {
        var theNode = $("#" + k);
        map[k] = theNode.clone();
        theNode.replaceWith(v);
    });

    // Add back the deleted trees before removing the new trees, just in case
    // the insertion point of one of these is going to get zapped.  This
    // shouldn't happen, though.
    _.forEach(undoData.delTr, function (v) {
        var prev = v.before;
        if (prev) {
            v.tree.insertAfter($("#" + prev));
        } else {
            v.tree.prependTo($("#sn0"));
        }
        newTr.push(v.tree.prop("id"));
    });

    _.forEach(undoData.newTr, function (v) {
        var theNode = $("#" + v);
        var prev = theNode.prev();
        if (prev.length === 0) {
            prev = null;
        }
        delTr.push({
            tree: theNode.clone(),
            before: prev && prev.prop("id")
        });
        theNode.remove();
    });

    return {
        map: map,
        newTr: newTr,
        delTr: delTr
    };
}

/**
* Perform undo.
*/
function undo() {
    if (undoStack.length === 0) {
        logger.warning("No further undo information");
        return;
    }
    var lastUndo = undoStack.pop();
    redoStack.push(doUndo(lastUndo));
    selection.clearSelection();
    selection.updateSelection();
}
exports.undo = undo;
;

/**
* Perform redo.
*/
function redo() {
    if (redoStack.length === 0) {
        logger.warning("No further redo information");
        return;
    }
    undoStack.push(doUndo(redoStack.pop()));
    selection.clearSelection();
    selection.updateSelection();
}
exports.redo = redo;
;

function prepareUndoIds() {
    $("#sn0>.snode").map(function () {
        $(this).prop("id", "id" + idNumber);
        idNumber++;
    });
    exports.nukeUndo();
}

startup.addStartupHook(prepareUndoIds);

},{"../ui/log":33,"./selection":25,"./startup":27,"./utils":31,"lodash":1}],30:[function(require,module,exports){
module.exports=require(29)
},{"../ui/log":33,"./selection":25,"./startup":27,"./utils":31,"lodash":1}],31:[function(require,module,exports){
///<reference path="./../../../types/all.d.ts" />
// Copyright (c) 2012 Anton Karl Ingason, Aaron Ecay, Jana Beck
// This file is part of the Annotald program for annotating
// phrase-structure treebanks in the Penn Treebank style.
// This file is distributed under the terms of the GNU General
// Public License as published by the Free Software Foundation, either
// version 3 of the License, or (at your option) any later version.
// This program is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser
// General Public License for more details.
// You should have received a copy of the GNU Lesser General Public
// License along with this program.  If not, see
// <http://www.gnu.org/licenses/>.
var $ = require("jquery");
var _ = require("lodash");

var dummy;
var conf = require("./config");
dummy = require("./config.ts");
var undo = require("./undo");
dummy = require("./undo.ts");
var metadata = require("./metadata");
dummy = require("./metadata.ts");

function startsWith(a, b) {
    return (a.substr(0, b.length) === b);
}
exports.startsWith = startsWith;

function endsWith(a, b) {
    return (a.substr(a.length - b.length) === b);
}
exports.endsWith = endsWith;

/*
* Utility functions for Annotald.
*/
// TODOs: mark @privates appropriately, consider naming scheme for dom vs JQ args
// * UI helper functions
var messageHistory = "";

/**
* Log the message in the message history.
* @private
*/
function logMessage(msg) {
    var d = new Date();
    messageHistory += d.toUTCString() + ": " + $("<div>" + msg + "</div>").text() + "\n";
}
exports.logMessage = logMessage;

/**
* Scroll to display the next place in the document matching a selector.
*
* If no matches, do nothing.
*
* @returns {JQuery} the node scrolled to, or `undefined` if none.
*/
function scrollToNext(selector) {
    var docViewTop = $(window).scrollTop();
    var nextError = $(selector).filter(function () {
        // Magic number alert!  Not sure if the +5 is needed...
        return $(this).offset().top > docViewTop + 5;
    }).first();
    if (nextError.length === 1) {
        window.scroll(0, nextError.offset().top);
        return nextError;
    }
    return undefined;
}
exports.scrollToNext = scrollToNext;

/**
* Update the CSS class of a node to reflect its label.
*
* @param {JQuery} node
* @param {String} oldlabel (optional) the former label of this node
*/
function updateCssClass(node, oldlabel) {
    if (!node.hasClass("snode")) {
        return;
    }
    if (!oldlabel) {
        // oldlabel wasn't supplied -- try to guess
        oldlabel = _.find(node.prop("class").split(" "), function (s) {
            return (/[A-Z-]/).test(s);
        });
    }
    node.removeClass(oldlabel);
    node.addClass(exports.getLabel(node));
}
exports.updateCssClass = updateCssClass;

// * Functions on node representation
// ** Predicates
/**
* Indicate whether a node has a lemma associated with it.
*
* @param {JQuery} node
* @returns {Boolean}
* @private
*/
// TODO: is private right for this one?
function hasLemma(node) {
    return node.children(".wnode").children(".lemma").length === 1;
}
exports.hasLemma = hasLemma;
;

/**
* Test whether a node is a purely structural leaf.
*
* @param {Node} node the node to operate on
*/
function isLeafNode(node) {
    return $(node).children(".wnode").length > 0;
}
exports.isLeafNode = isLeafNode;

/**
* Test whether a given node is empty, i.e. a trace, comment, or other empty
* category.
*
* @param {Node} node
* @returns {Boolean}
*/
function isEmptyNode(node) {
    if (!exports.isLeafNode(node)) {
        return false;
    }
    if (exports.getLabel($(node)) === "CODE") {
        return true;
    }
    var text = exports.wnodeString(node);
    if (exports.startsWith(text, "*") || text.split("-")[0] === "0") {
        return true;
    }
    return false;
}
exports.isEmptyNode = isEmptyNode;

/**
* Test whether a string is empty, i.e. a trace, comment, or other empty
* category.
*
* @param {String} text the text to test
* @returns {Boolean}
*/
function isEmpty(text) {
    // TODO(AWE): should this be passed a node instead of a string, and then
    // test whether the node is a leaf or not before giving a return value?  This
    // would simplify the check I had to put in shouldIndexLeafNode, and prevent
    // future such errors.
    // TODO: use CODE-ness of a node, rather than starting with a bracket
    if (exports.startsWith(text, "*") || exports.startsWith(text, "{") || text.split("-")[0] === "0") {
        return true;
    }
    return false;
}
exports.isEmpty = isEmpty;
;

/**
* Test whether a node is a possible target for movement.
*
* @param {Node} node the node to operate on
*/
function isPossibleTarget(node) {
    // cannot move under a tag node
    // TODO(AWE): what is the calling convention?  can we optimize this jquery
    // call?
    if ($(node).children().first().is("span")) {
        return false;
    }
    return true;
}
exports.isPossibleTarget = isPossibleTarget;
;

/**
* Test whether a node is the root node of a tree.
*
* @param {JQuery} node the node to operate on
*/
function isRootNode(node) {
    return node.filter("#sn0>.snode").length > 0;
}
exports.isRootNode = isRootNode;
;

/**
* Test whether a node is a leaf using heuristics.
*
* This function respects the results of the `testValidLeafLabel` and
* `testValidPhraseLabel` functions, if these are defined.
*
* @param {Node} node the node to operate on
*/
// TODO: restore
function guessLeafNode(node) {
    // var label = getLabel($(node)).replace("-FLAG", "");
    // if (typeof testValidLeafLabel   !== "undefined" &&
    //     typeof testValidPhraseLabel !== "undefined") {
    //     if (testValidPhraseLabel(label)) {
    //         return false;
    //     } else if (testValidLeafLabel(label)) {
    //         return true;
    //     } else {
    //         // not a valid label, fall back to structural check
    //         return isLeafNode(node);
    //     }
    // } else {
    return exports.isLeafNode(node);
    // }
}
exports.guessLeafNode = guessLeafNode;

// ** Accessor functions
/**
* Get the root of the tree that a node belongs to.
*
* @param {JQuery} node the node to operate on
*/
function getTokenRoot(node) {
    return node.parents().addBack().filter("#sn0>.snode").get(0);
}
exports.getTokenRoot = getTokenRoot;
;

/**
* Get the text dominated by a given node, without removing empty material.
*
* @param {Node} node the node to operate on
*/
// TODO: convert to take jquery?
function wnodeString(node) {
    var text = $(node).find(".wnode").text();
    return text;
}
exports.wnodeString = wnodeString;

/**
* Get the ur-text dominated by a node.
*
* This function removes any empty material (traces, comments, etc.)  It does
* not rejoin words which have been split.  It also does not add spaces.
*
* @param {JQuery} root the node to operate on
*/
function currentText(root) {
    var nodes = root.get(0).getElementsByClassName("wnode");
    var text = "", nv;
    for (var i = 0; i < nodes.length; i++) {
        if (!exports.isEmptyNode(nodes[i])) {
            nv = nodes[i].childNodes[0].nodeValue;
            text += nv;
        }
    }
    return text;
}
exports.currentText = currentText;

/**
* Get the label of a node.
*
* @param {JQuery} node the node to operate on
*/
// TODO: tie this in to the formatiign functions?  or refactor/eliminate
function getLabel(node) {
    var n = node.get(0);
    var l = n.getAttribute("data-category");
    if (n.getAttribute("data-subcategory")) {
        l += "-" + n.getAttribute("data-subcategory");
    }
    return l;
}
exports.getLabel = getLabel;
exports.getLabel = exports.getLabel;

/**
* Get the first text node dominated by a node.
* @private
*
* @param {JQuery} node the node to operate on
*/
function textNode(node) {
    return node.contents().filter(function () {
        return this.nodeType === 3;
    }).first();
}
exports.textNode = textNode;

/**
* Return the lemma of a node, or undefined if none.
*
* @param {JQuery} node
* @returns {String}
*/
function getLemma(node) {
    return node.children(".wnode").children(".lemma").first().text().substring(1);
}
exports.getLemma = getLemma;

/**
* Test whether a node has a certain dash tag.
*
* @param {JQuery} node the node to operate on
* @param {String} tag the dash tag to look for, without any dashes
*/
function hasDashTag(node, tag) {
    var label = exports.getLabel(node);
    var tags = label.split("-").slice(1);
    return (tags.indexOf(tag) > -1);
}
exports.hasDashTag = hasDashTag;

// ** Index-related functions
/**
* Return the movement index associated with a node.
*
* @param {JQuery} node the node to operate on
*/
function getIndex(node) {
    return parseInt(node.getAttribute("data-index"), 10);
}
exports.getIndex = getIndex;

/**
* Return the type of index associated with a node, either `"-"` or `"="`.
*
* @param {JQuery} node the node to operate on
*/
// TODO: only used once, eliminate?
// TODO: use enum
function getIndexType(node) {
    return node.getAttribute("data-idxtype") === "gap" ? "=" : "-";
}
exports.getIndexType = getIndexType;
;

// TODO: document
function setIndexType(node, idxtype) {
    node.setAttribute("data-idxtype", idxtype === "=" ? "gap" : "regular");
}
exports.setIndexType = setIndexType;

// TODO: document
function setIndex(node, index) {
    node.setAttribute("data-index", index.toString());
    if (!node.getAttribute("data-idxtype")) {
        exports.setIndexType(node, "-");
    }
}
exports.setIndex = setIndex;

/**
* Get the highest index attested in a token.
*
* @param {Node} token the token to work on
*/
function maxIndex(token) {
    return _.max(_.map($(token).find(".snode"), function () {
        return exports.getIndex(this);
    }));
}
exports.maxIndex = maxIndex;

/**
* Increase the value of a tree's indices by an amount
* @private
*
* @param {JQuery} tokenRoot the token to operate on
* @param {number} numberToAdd
*/
// TODO: rwerite
function addToIndices(tokenRoot, numberToAdd) {
    var nodes = tokenRoot.find(".snode[data-index]").addBack();
    nodes.each(function () {
        exports.setIndex(this, exports.getIndex(this) + numberToAdd);
    });
}
exports.addToIndices = addToIndices;
;

function removeIndex(node) {
    node.removeAttribute("data-index");
    node.removeAttribute("data-idxtype");
}
exports.removeIndex = removeIndex;

// ** Case-related functions
/**
* Find the case associated with a node.
*
* This function respects the case-related variable `caseMarkers`.  It does
* not check if a node is in `caseTags`.
*
* @param {JQuery} node
* @returns {String} the case on the node, or `""` if none
*/
function getCase(node) {
    var m = metadata.getMetadata(node);

    /* tslint:disable:no-string-literal */
    if (m && m["morpho"]) {
        return m["morpho"]["case"];
    } else {
        return;
    }
    /* tslint:enable:no-string-literal */
}
exports.getCase = getCase;
;

/**
* Test if a node has case.
*
* This function tests whether a node is in `caseTags`, and then whether it
* has case.
*
* @param {JQuery} node
* @returns {Boolean}
*/
function hasCase(node) {
    return typeof exports.getCase(node) !== "undefined";
}
exports.hasCase = hasCase;

/**
* Test whether a node label corresponds to a case phrase.
*
* Based on the `casePhrases` configuration variable.
*
* @param {JQuery} nodeLabel
* @returns {Boolean}
*/
function isCasePhrase(node) {
    return _.contains(conf.casePhrases, node.getAttribute("data-category"));
}
exports.isCasePhrase = isCasePhrase;

/**
* Test whether a label can bear case.
*
* Respects the `caseTags` configuration variable.
*
* @param {String} label
* @returns {Boolean}
*/
function isCaseCategory(cat) {
    return _.contains(conf.caseTags, cat);
}
exports.isCaseCategory = isCaseCategory;

/**
* Test whether a node can bear case.
*
* See ``isCaseLabel``.
*
* @param {JQuery} node
* @returns {Boolean}
*/
function isCaseNode(node) {
    return exports.isCaseCategory(node.getAttribute("data-cetegory"));
}
exports.isCaseNode = isCaseNode;

/**
* Remove the case from a node.
*
* Does not record undo information.
*
* @param {Element} node
*/
function removeCase(node) {
    metadata.removeMetadata(node, "morpho", { "case": "foo" });
}
exports.removeCase = removeCase;

/**
* Set the case on a node.
*
* Removes any previous case.  Does not record undo information.
*
* @param {Element} node
* @param {string} theCase
*/
function setCase(node, theCase) {
    metadata.setMetadata(node, "morpho", { "case": theCase });
}
exports.setCase = setCase;
;

// TODO: toggling the case requires intelligence about where the dash tag
// should be put, which is only in toggleExtension
// function labelSetCase(label) {
// }
// ** Label-related functions
/**
* Sets the label of a node
*
* Contains none of the heuristics of {@link setLabel}.
*
* @param {JQuery} node the target node
* @param {String} label the new label
*/
function setNodeLabel(node, label, noUndo) {
    if (noUndo) {
        undo.undoBeginTransaction();
    }
    if (node.hasClass("snode")) {
        if (label[label.length - 1] !== " ") {
            // Some other spots in the code depend on the label ending with a
            // space...
            label += " ";
        }
    } else if (node.hasClass("wnode")) {
        // Words cannot have a trailing space, or CS barfs on save.
        label = $.trim(label);
    } else {
        // should never happen
        return;
    }
    var oldLabel = exports.getLabel(node);
    exports.textNode(node).replaceWith(label);
    exports.updateCssClass(node, oldLabel);
    if (noUndo) {
        undo.undoAbortTransaction();
    }
}
exports.setNodeLabel = setNodeLabel;

function setLeafLabel(node, label) {
    if (!node.hasClass(".wnode")) {
        // why do we do this?  We should be less fault-tolerant.
        node = node.children(".wnode").first();
    }
    exports.textNode(node).replaceWith($.trim(label));
}
exports.setLeafLabel = setLeafLabel;

// * Stubs
// TODO: remove
function toggleStringExtension() {
    var foo = [];
    for (var _i = 0; _i < (arguments.length - 0); _i++) {
        foo[_i] = arguments[_i + 0];
    }
    return;
}
exports.toggleStringExtension = toggleStringExtension;

function lookupNextLabel() {
    var foo = [];
    for (var _i = 0; _i < (arguments.length - 0); _i++) {
        foo[_i] = arguments[_i + 0];
    }
    return "foo";
}
exports.lookupNextLabel = lookupNextLabel;

},{"./config":8,"./config.ts":9,"./metadata":19,"./metadata.ts":20,"./undo":29,"./undo.ts":30,"lodash":1}],32:[function(require,module,exports){
///<reference path="./../../../types/all.d.ts" />
var startup = require("./startup");
var selection = require("./selection");

/**
* Toggle collapsing of a node.
*
* When a node is collapsed, its contents are displayed as continuous text,
* without labels.  The node itself still functions normally with respect to
* movement operations etc., but its contents are inaccessible.
*/
function toggleCollapsed() {
    if (selection.cardinality() !== 1) {
        return false;
    }
    $(selection.get()).toggleClass("collapsed");
    return true;
}
exports.toggleCollapsed = toggleCollapsed;

var lemmataStyleNode;
var lemmataHidden = true;

startup.addStartupHook(function () {
    lemmataStyleNode = document.createElement("style");
    lemmataStyleNode.setAttribute("type", "text/css");
    document.getElementsByTagName("head")[0].appendChild(lemmataStyleNode);
    lemmataStyleNode.innerHTML = ".lemma { display: none; }";
});

startup.addShutdownHook(function () {
    lemmataStyleNode.parentNode.removeChild(lemmataStyleNode);
});

/**
* Toggle display of lemmata.
*/
function toggleLemmata() {
    if (lemmataHidden) {
        lemmataStyleNode.innerHTML = "";
    } else {
        lemmataStyleNode.innerHTML = ".lemma { display: none; }";
    }
    lemmataHidden = !lemmataHidden;
}
exports.toggleLemmata = toggleLemmata;

},{"./selection":25,"./startup":27}],33:[function(require,module,exports){
/*global require: false, exports: true */

var notify = require("../ext/growl").growl;

exports.error = function (text) {
    notify.error({ title: "Error",
                   message: text });
};

exports.warning = function (text) {
    notify.warning({ title: "Warning",
                     message: text });
};

exports.notice = function (text) {
    notify.notice({ message: text,
                    title: ""});
};

},{"../ext/growl":5}]},{},[2,3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9hZWNheS9kZXZlbG9wbWVudC9hbm5vdGFsZC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvYWVjYXkvZGV2ZWxvcG1lbnQvYW5ub3RhbGQvbm9kZV9tb2R1bGVzL2xvZGFzaC9kaXN0L2xvZGFzaC5qcyIsIi9ob21lL2FlY2F5L2RldmVsb3BtZW50L2Fubm90YWxkL3Rlc3Qvc3BlYy9sYWJlbC1tYXRjaGVyLmpzIiwiL2hvbWUvYWVjYXkvZGV2ZWxvcG1lbnQvYW5ub3RhbGQvdGVzdC9zcGVjL3BhcnNlLXNwZWMuanMiLCIvaG9tZS9hZWNheS9kZXZlbG9wbWVudC9hbm5vdGFsZC90ZXN0L3N0cmluZy1tYXRjaGVyLmpzIiwiL2hvbWUvYWVjYXkvZGV2ZWxvcG1lbnQvYW5ub3RhbGQvd2ViYXBwL2pzL2V4dC9ncm93bC5qcyIsIi9ob21lL2FlY2F5L2RldmVsb3BtZW50L2Fubm90YWxkL3dlYmFwcC9qcy9wYXJzZS5qcyIsIi9ob21lL2FlY2F5L2RldmVsb3BtZW50L2Fubm90YWxkL3dlYmFwcC9qcy90cmVlZHJhd2luZy9iaW5kaW5ncy5qcyIsIi9ob21lL2FlY2F5L2RldmVsb3BtZW50L2Fubm90YWxkL3dlYmFwcC9qcy90cmVlZHJhd2luZy9jb25maWcuanMiLCIvaG9tZS9hZWNheS9kZXZlbG9wbWVudC9hbm5vdGFsZC93ZWJhcHAvanMvdHJlZWRyYXdpbmcvY29udGV4dG1lbnUuanMiLCIvaG9tZS9hZWNheS9kZXZlbG9wbWVudC9hbm5vdGFsZC93ZWJhcHAvanMvdHJlZWRyYXdpbmcvZGlhbG9nLmpzIiwiL2hvbWUvYWVjYXkvZGV2ZWxvcG1lbnQvYW5ub3RhbGQvd2ViYXBwL2pzL3RyZWVkcmF3aW5nL2VudHJ5LXBvaW50cy5qcyIsIi9ob21lL2FlY2F5L2RldmVsb3BtZW50L2Fubm90YWxkL3dlYmFwcC9qcy90cmVlZHJhd2luZy9ldmVudHMuanMiLCIvaG9tZS9hZWNheS9kZXZlbG9wbWVudC9hbm5vdGFsZC93ZWJhcHAvanMvdHJlZWRyYXdpbmcvZ2xvYmFsLmpzIiwiL2hvbWUvYWVjYXkvZGV2ZWxvcG1lbnQvYW5ub3RhbGQvd2ViYXBwL2pzL3RyZWVkcmF3aW5nL2xhYmVsLWNvbnZlcnQudHMiLCIvaG9tZS9hZWNheS9kZXZlbG9wbWVudC9hbm5vdGFsZC93ZWJhcHAvanMvdHJlZWRyYXdpbmcvbWV0YWRhdGEuanMiLCIvaG9tZS9hZWNheS9kZXZlbG9wbWVudC9hbm5vdGFsZC93ZWJhcHAvanMvdHJlZWRyYXdpbmcvbWV0YWRhdGEudHMiLCIvaG9tZS9hZWNheS9kZXZlbG9wbWVudC9hbm5vdGFsZC93ZWJhcHAvanMvdHJlZWRyYXdpbmcvbm9kZS1lZGl0LmpzIiwiL2hvbWUvYWVjYXkvZGV2ZWxvcG1lbnQvYW5ub3RhbGQvd2ViYXBwL2pzL3RyZWVkcmF3aW5nL25vZGUtZm9ybWF0dGVyLmpzIiwiL2hvbWUvYWVjYXkvZGV2ZWxvcG1lbnQvYW5ub3RhbGQvd2ViYXBwL2pzL3RyZWVkcmF3aW5nL3NhdmUuanMiLCIvaG9tZS9hZWNheS9kZXZlbG9wbWVudC9hbm5vdGFsZC93ZWJhcHAvanMvdHJlZWRyYXdpbmcvc2VhcmNoLmpzIiwiL2hvbWUvYWVjYXkvZGV2ZWxvcG1lbnQvYW5ub3RhbGQvd2ViYXBwL2pzL3RyZWVkcmF3aW5nL3NlbGVjdGlvbi5qcyIsIi9ob21lL2FlY2F5L2RldmVsb3BtZW50L2Fubm90YWxkL3dlYmFwcC9qcy90cmVlZHJhd2luZy9zdGFydHVwLmpzIiwiL2hvbWUvYWVjYXkvZGV2ZWxvcG1lbnQvYW5ub3RhbGQvd2ViYXBwL2pzL3RyZWVkcmF3aW5nL3N0cnVjLWVkaXQuanMiLCIvaG9tZS9hZWNheS9kZXZlbG9wbWVudC9hbm5vdGFsZC93ZWJhcHAvanMvdHJlZWRyYXdpbmcvdW5kby5qcyIsIi9ob21lL2FlY2F5L2RldmVsb3BtZW50L2Fubm90YWxkL3dlYmFwcC9qcy90cmVlZHJhd2luZy91dGlscy5qcyIsIi9ob21lL2FlY2F5L2RldmVsb3BtZW50L2Fubm90YWxkL3dlYmFwcC9qcy90cmVlZHJhd2luZy92aWV3LmpzIiwiL2hvbWUvYWVjYXkvZGV2ZWxvcG1lbnQvYW5ub3RhbGQvd2ViYXBwL2pzL3VpL2xvZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqb05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN4U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5ZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzdLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMva0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN2UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDampCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpey8qKlxuICogQGxpY2Vuc2VcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZGVybiAtbyAuL2Rpc3QvbG9kYXNoLmpzYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbjsoZnVuY3Rpb24oKSB7XG5cbiAgLyoqIFVzZWQgYXMgYSBzYWZlIHJlZmVyZW5jZSBmb3IgYHVuZGVmaW5lZGAgaW4gcHJlIEVTNSBlbnZpcm9ubWVudHMgKi9cbiAgdmFyIHVuZGVmaW5lZDtcblxuICAvKiogVXNlZCB0byBwb29sIGFycmF5cyBhbmQgb2JqZWN0cyB1c2VkIGludGVybmFsbHkgKi9cbiAgdmFyIGFycmF5UG9vbCA9IFtdLFxuICAgICAgb2JqZWN0UG9vbCA9IFtdO1xuXG4gIC8qKiBVc2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBJRHMgKi9cbiAgdmFyIGlkQ291bnRlciA9IDA7XG5cbiAgLyoqIFVzZWQgdG8gcHJlZml4IGtleXMgdG8gYXZvaWQgaXNzdWVzIHdpdGggYF9fcHJvdG9fX2AgYW5kIHByb3BlcnRpZXMgb24gYE9iamVjdC5wcm90b3R5cGVgICovXG4gIHZhciBrZXlQcmVmaXggPSArbmV3IERhdGUgKyAnJztcblxuICAvKiogVXNlZCBhcyB0aGUgc2l6ZSB3aGVuIG9wdGltaXphdGlvbnMgYXJlIGVuYWJsZWQgZm9yIGxhcmdlIGFycmF5cyAqL1xuICB2YXIgbGFyZ2VBcnJheVNpemUgPSA3NTtcblxuICAvKiogVXNlZCBhcyB0aGUgbWF4IHNpemUgb2YgdGhlIGBhcnJheVBvb2xgIGFuZCBgb2JqZWN0UG9vbGAgKi9cbiAgdmFyIG1heFBvb2xTaXplID0gNDA7XG5cbiAgLyoqIFVzZWQgdG8gZGV0ZWN0IGFuZCB0ZXN0IHdoaXRlc3BhY2UgKi9cbiAgdmFyIHdoaXRlc3BhY2UgPSAoXG4gICAgLy8gd2hpdGVzcGFjZVxuICAgICcgXFx0XFx4MEJcXGZcXHhBMFxcdWZlZmYnICtcblxuICAgIC8vIGxpbmUgdGVybWluYXRvcnNcbiAgICAnXFxuXFxyXFx1MjAyOFxcdTIwMjknICtcblxuICAgIC8vIHVuaWNvZGUgY2F0ZWdvcnkgXCJac1wiIHNwYWNlIHNlcGFyYXRvcnNcbiAgICAnXFx1MTY4MFxcdTE4MGVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMCdcbiAgKTtcblxuICAvKiogVXNlZCB0byBtYXRjaCBlbXB0eSBzdHJpbmcgbGl0ZXJhbHMgaW4gY29tcGlsZWQgdGVtcGxhdGUgc291cmNlICovXG4gIHZhciByZUVtcHR5U3RyaW5nTGVhZGluZyA9IC9cXGJfX3AgXFwrPSAnJzsvZyxcbiAgICAgIHJlRW1wdHlTdHJpbmdNaWRkbGUgPSAvXFxiKF9fcCBcXCs9KSAnJyBcXCsvZyxcbiAgICAgIHJlRW1wdHlTdHJpbmdUcmFpbGluZyA9IC8oX19lXFwoLio/XFwpfFxcYl9fdFxcKSkgXFwrXFxuJyc7L2c7XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gbWF0Y2ggRVM2IHRlbXBsYXRlIGRlbGltaXRlcnNcbiAgICogaHR0cDovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtbGl0ZXJhbHMtc3RyaW5nLWxpdGVyYWxzXG4gICAqL1xuICB2YXIgcmVFc1RlbXBsYXRlID0gL1xcJFxceyhbXlxcXFx9XSooPzpcXFxcLlteXFxcXH1dKikqKVxcfS9nO1xuXG4gIC8qKiBVc2VkIHRvIG1hdGNoIHJlZ2V4cCBmbGFncyBmcm9tIHRoZWlyIGNvZXJjZWQgc3RyaW5nIHZhbHVlcyAqL1xuICB2YXIgcmVGbGFncyA9IC9cXHcqJC87XG5cbiAgLyoqIFVzZWQgdG8gZGV0ZWN0ZWQgbmFtZWQgZnVuY3Rpb25zICovXG4gIHZhciByZUZ1bmNOYW1lID0gL15cXHMqZnVuY3Rpb25bIFxcblxcclxcdF0rXFx3LztcblxuICAvKiogVXNlZCB0byBtYXRjaCBcImludGVycG9sYXRlXCIgdGVtcGxhdGUgZGVsaW1pdGVycyAqL1xuICB2YXIgcmVJbnRlcnBvbGF0ZSA9IC88JT0oW1xcc1xcU10rPyklPi9nO1xuXG4gIC8qKiBVc2VkIHRvIG1hdGNoIGxlYWRpbmcgd2hpdGVzcGFjZSBhbmQgemVyb3MgdG8gYmUgcmVtb3ZlZCAqL1xuICB2YXIgcmVMZWFkaW5nU3BhY2VzQW5kWmVyb3MgPSBSZWdFeHAoJ15bJyArIHdoaXRlc3BhY2UgKyAnXSowKyg/PS4kKScpO1xuXG4gIC8qKiBVc2VkIHRvIGVuc3VyZSBjYXB0dXJpbmcgb3JkZXIgb2YgdGVtcGxhdGUgZGVsaW1pdGVycyAqL1xuICB2YXIgcmVOb01hdGNoID0gLygkXikvO1xuXG4gIC8qKiBVc2VkIHRvIGRldGVjdCBmdW5jdGlvbnMgY29udGFpbmluZyBhIGB0aGlzYCByZWZlcmVuY2UgKi9cbiAgdmFyIHJlVGhpcyA9IC9cXGJ0aGlzXFxiLztcblxuICAvKiogVXNlZCB0byBtYXRjaCB1bmVzY2FwZWQgY2hhcmFjdGVycyBpbiBjb21waWxlZCBzdHJpbmcgbGl0ZXJhbHMgKi9cbiAgdmFyIHJlVW5lc2NhcGVkU3RyaW5nID0gL1snXFxuXFxyXFx0XFx1MjAyOFxcdTIwMjlcXFxcXS9nO1xuXG4gIC8qKiBVc2VkIHRvIGFzc2lnbiBkZWZhdWx0IGBjb250ZXh0YCBvYmplY3QgcHJvcGVydGllcyAqL1xuICB2YXIgY29udGV4dFByb3BzID0gW1xuICAgICdBcnJheScsICdCb29sZWFuJywgJ0RhdGUnLCAnRnVuY3Rpb24nLCAnTWF0aCcsICdOdW1iZXInLCAnT2JqZWN0JyxcbiAgICAnUmVnRXhwJywgJ1N0cmluZycsICdfJywgJ2F0dGFjaEV2ZW50JywgJ2NsZWFyVGltZW91dCcsICdpc0Zpbml0ZScsICdpc05hTicsXG4gICAgJ3BhcnNlSW50JywgJ3NldFRpbWVvdXQnXG4gIF07XG5cbiAgLyoqIFVzZWQgdG8gbWFrZSB0ZW1wbGF0ZSBzb3VyY2VVUkxzIGVhc2llciB0byBpZGVudGlmeSAqL1xuICB2YXIgdGVtcGxhdGVDb3VudGVyID0gMDtcblxuICAvKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHNob3J0Y3V0cyAqL1xuICB2YXIgYXJnc0NsYXNzID0gJ1tvYmplY3QgQXJndW1lbnRzXScsXG4gICAgICBhcnJheUNsYXNzID0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICAgIGJvb2xDbGFzcyA9ICdbb2JqZWN0IEJvb2xlYW5dJyxcbiAgICAgIGRhdGVDbGFzcyA9ICdbb2JqZWN0IERhdGVdJyxcbiAgICAgIGZ1bmNDbGFzcyA9ICdbb2JqZWN0IEZ1bmN0aW9uXScsXG4gICAgICBudW1iZXJDbGFzcyA9ICdbb2JqZWN0IE51bWJlcl0nLFxuICAgICAgb2JqZWN0Q2xhc3MgPSAnW29iamVjdCBPYmplY3RdJyxcbiAgICAgIHJlZ2V4cENsYXNzID0gJ1tvYmplY3QgUmVnRXhwXScsXG4gICAgICBzdHJpbmdDbGFzcyA9ICdbb2JqZWN0IFN0cmluZ10nO1xuXG4gIC8qKiBVc2VkIHRvIGlkZW50aWZ5IG9iamVjdCBjbGFzc2lmaWNhdGlvbnMgdGhhdCBgXy5jbG9uZWAgc3VwcG9ydHMgKi9cbiAgdmFyIGNsb25lYWJsZUNsYXNzZXMgPSB7fTtcbiAgY2xvbmVhYmxlQ2xhc3Nlc1tmdW5jQ2xhc3NdID0gZmFsc2U7XG4gIGNsb25lYWJsZUNsYXNzZXNbYXJnc0NsYXNzXSA9IGNsb25lYWJsZUNsYXNzZXNbYXJyYXlDbGFzc10gPVxuICBjbG9uZWFibGVDbGFzc2VzW2Jvb2xDbGFzc10gPSBjbG9uZWFibGVDbGFzc2VzW2RhdGVDbGFzc10gPVxuICBjbG9uZWFibGVDbGFzc2VzW251bWJlckNsYXNzXSA9IGNsb25lYWJsZUNsYXNzZXNbb2JqZWN0Q2xhc3NdID1cbiAgY2xvbmVhYmxlQ2xhc3Nlc1tyZWdleHBDbGFzc10gPSBjbG9uZWFibGVDbGFzc2VzW3N0cmluZ0NsYXNzXSA9IHRydWU7XG5cbiAgLyoqIFVzZWQgYXMgYW4gaW50ZXJuYWwgYF8uZGVib3VuY2VgIG9wdGlvbnMgb2JqZWN0ICovXG4gIHZhciBkZWJvdW5jZU9wdGlvbnMgPSB7XG4gICAgJ2xlYWRpbmcnOiBmYWxzZSxcbiAgICAnbWF4V2FpdCc6IDAsXG4gICAgJ3RyYWlsaW5nJzogZmFsc2VcbiAgfTtcblxuICAvKiogVXNlZCBhcyB0aGUgcHJvcGVydHkgZGVzY3JpcHRvciBmb3IgYF9fYmluZERhdGFfX2AgKi9cbiAgdmFyIGRlc2NyaXB0b3IgPSB7XG4gICAgJ2NvbmZpZ3VyYWJsZSc6IGZhbHNlLFxuICAgICdlbnVtZXJhYmxlJzogZmFsc2UsXG4gICAgJ3ZhbHVlJzogbnVsbCxcbiAgICAnd3JpdGFibGUnOiBmYWxzZVxuICB9O1xuXG4gIC8qKiBVc2VkIHRvIGRldGVybWluZSBpZiB2YWx1ZXMgYXJlIG9mIHRoZSBsYW5ndWFnZSB0eXBlIE9iamVjdCAqL1xuICB2YXIgb2JqZWN0VHlwZXMgPSB7XG4gICAgJ2Jvb2xlYW4nOiBmYWxzZSxcbiAgICAnZnVuY3Rpb24nOiB0cnVlLFxuICAgICdvYmplY3QnOiB0cnVlLFxuICAgICdudW1iZXInOiBmYWxzZSxcbiAgICAnc3RyaW5nJzogZmFsc2UsXG4gICAgJ3VuZGVmaW5lZCc6IGZhbHNlXG4gIH07XG5cbiAgLyoqIFVzZWQgdG8gZXNjYXBlIGNoYXJhY3RlcnMgZm9yIGluY2x1c2lvbiBpbiBjb21waWxlZCBzdHJpbmcgbGl0ZXJhbHMgKi9cbiAgdmFyIHN0cmluZ0VzY2FwZXMgPSB7XG4gICAgJ1xcXFwnOiAnXFxcXCcsXG4gICAgXCInXCI6IFwiJ1wiLFxuICAgICdcXG4nOiAnbicsXG4gICAgJ1xccic6ICdyJyxcbiAgICAnXFx0JzogJ3QnLFxuICAgICdcXHUyMDI4JzogJ3UyMDI4JyxcbiAgICAnXFx1MjAyOSc6ICd1MjAyOSdcbiAgfTtcblxuICAvKiogVXNlZCBhcyBhIHJlZmVyZW5jZSB0byB0aGUgZ2xvYmFsIG9iamVjdCAqL1xuICB2YXIgcm9vdCA9IChvYmplY3RUeXBlc1t0eXBlb2Ygd2luZG93XSAmJiB3aW5kb3cpIHx8IHRoaXM7XG5cbiAgLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBleHBvcnRzYCAqL1xuICB2YXIgZnJlZUV4cG9ydHMgPSBvYmplY3RUeXBlc1t0eXBlb2YgZXhwb3J0c10gJiYgZXhwb3J0cyAmJiAhZXhwb3J0cy5ub2RlVHlwZSAmJiBleHBvcnRzO1xuXG4gIC8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgbW9kdWxlYCAqL1xuICB2YXIgZnJlZU1vZHVsZSA9IG9iamVjdFR5cGVzW3R5cGVvZiBtb2R1bGVdICYmIG1vZHVsZSAmJiAhbW9kdWxlLm5vZGVUeXBlICYmIG1vZHVsZTtcblxuICAvKiogRGV0ZWN0IHRoZSBwb3B1bGFyIENvbW1vbkpTIGV4dGVuc2lvbiBgbW9kdWxlLmV4cG9ydHNgICovXG4gIHZhciBtb2R1bGVFeHBvcnRzID0gZnJlZU1vZHVsZSAmJiBmcmVlTW9kdWxlLmV4cG9ydHMgPT09IGZyZWVFeHBvcnRzICYmIGZyZWVFeHBvcnRzO1xuXG4gIC8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZ2xvYmFsYCBmcm9tIE5vZGUuanMgb3IgQnJvd3NlcmlmaWVkIGNvZGUgYW5kIHVzZSBpdCBhcyBgcm9vdGAgKi9cbiAgdmFyIGZyZWVHbG9iYWwgPSBvYmplY3RUeXBlc1t0eXBlb2YgZ2xvYmFsXSAmJiBnbG9iYWw7XG4gIGlmIChmcmVlR2xvYmFsICYmIChmcmVlR2xvYmFsLmdsb2JhbCA9PT0gZnJlZUdsb2JhbCB8fCBmcmVlR2xvYmFsLndpbmRvdyA9PT0gZnJlZUdsb2JhbCkpIHtcbiAgICByb290ID0gZnJlZUdsb2JhbDtcbiAgfVxuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIC8qKlxuICAgKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5pbmRleE9mYCB3aXRob3V0IHN1cHBvcnQgZm9yIGJpbmFyeSBzZWFyY2hlc1xuICAgKiBvciBgZnJvbUluZGV4YCBjb25zdHJhaW50cy5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHNlYXJjaC5cbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2VhcmNoIGZvci5cbiAgICogQHBhcmFtIHtudW1iZXJ9IFtmcm9tSW5kZXg9MF0gVGhlIGluZGV4IHRvIHNlYXJjaCBmcm9tLlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbWF0Y2hlZCB2YWx1ZSBvciBgLTFgLlxuICAgKi9cbiAgZnVuY3Rpb24gYmFzZUluZGV4T2YoYXJyYXksIHZhbHVlLCBmcm9tSW5kZXgpIHtcbiAgICB2YXIgaW5kZXggPSAoZnJvbUluZGV4IHx8IDApIC0gMSxcbiAgICAgICAgbGVuZ3RoID0gYXJyYXkgPyBhcnJheS5sZW5ndGggOiAwO1xuXG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIGlmIChhcnJheVtpbmRleF0gPT09IHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIGltcGxlbWVudGF0aW9uIG9mIGBfLmNvbnRhaW5zYCBmb3IgY2FjaGUgb2JqZWN0cyB0aGF0IG1pbWljcyB0aGUgcmV0dXJuXG4gICAqIHNpZ25hdHVyZSBvZiBgXy5pbmRleE9mYCBieSByZXR1cm5pbmcgYDBgIGlmIHRoZSB2YWx1ZSBpcyBmb3VuZCwgZWxzZSBgLTFgLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gY2FjaGUgVGhlIGNhY2hlIG9iamVjdCB0byBpbnNwZWN0LlxuICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZWFyY2ggZm9yLlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIGAwYCBpZiBgdmFsdWVgIGlzIGZvdW5kLCBlbHNlIGAtMWAuXG4gICAqL1xuICBmdW5jdGlvbiBjYWNoZUluZGV4T2YoY2FjaGUsIHZhbHVlKSB7XG4gICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gICAgY2FjaGUgPSBjYWNoZS5jYWNoZTtcblxuICAgIGlmICh0eXBlID09ICdib29sZWFuJyB8fCB2YWx1ZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gY2FjaGVbdmFsdWVdID8gMCA6IC0xO1xuICAgIH1cbiAgICBpZiAodHlwZSAhPSAnbnVtYmVyJyAmJiB0eXBlICE9ICdzdHJpbmcnKSB7XG4gICAgICB0eXBlID0gJ29iamVjdCc7XG4gICAgfVxuICAgIHZhciBrZXkgPSB0eXBlID09ICdudW1iZXInID8gdmFsdWUgOiBrZXlQcmVmaXggKyB2YWx1ZTtcbiAgICBjYWNoZSA9IChjYWNoZSA9IGNhY2hlW3R5cGVdKSAmJiBjYWNoZVtrZXldO1xuXG4gICAgcmV0dXJuIHR5cGUgPT0gJ29iamVjdCdcbiAgICAgID8gKGNhY2hlICYmIGJhc2VJbmRleE9mKGNhY2hlLCB2YWx1ZSkgPiAtMSA/IDAgOiAtMSlcbiAgICAgIDogKGNhY2hlID8gMCA6IC0xKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgZ2l2ZW4gdmFsdWUgdG8gdGhlIGNvcnJlc3BvbmRpbmcgY2FjaGUgb2JqZWN0LlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBhZGQgdG8gdGhlIGNhY2hlLlxuICAgKi9cbiAgZnVuY3Rpb24gY2FjaGVQdXNoKHZhbHVlKSB7XG4gICAgdmFyIGNhY2hlID0gdGhpcy5jYWNoZSxcbiAgICAgICAgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcblxuICAgIGlmICh0eXBlID09ICdib29sZWFuJyB8fCB2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBjYWNoZVt2YWx1ZV0gPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodHlwZSAhPSAnbnVtYmVyJyAmJiB0eXBlICE9ICdzdHJpbmcnKSB7XG4gICAgICAgIHR5cGUgPSAnb2JqZWN0JztcbiAgICAgIH1cbiAgICAgIHZhciBrZXkgPSB0eXBlID09ICdudW1iZXInID8gdmFsdWUgOiBrZXlQcmVmaXggKyB2YWx1ZSxcbiAgICAgICAgICB0eXBlQ2FjaGUgPSBjYWNoZVt0eXBlXSB8fCAoY2FjaGVbdHlwZV0gPSB7fSk7XG5cbiAgICAgIGlmICh0eXBlID09ICdvYmplY3QnKSB7XG4gICAgICAgICh0eXBlQ2FjaGVba2V5XSB8fCAodHlwZUNhY2hlW2tleV0gPSBbXSkpLnB1c2godmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHlwZUNhY2hlW2tleV0gPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VkIGJ5IGBfLm1heGAgYW5kIGBfLm1pbmAgYXMgdGhlIGRlZmF1bHQgY2FsbGJhY2sgd2hlbiBhIGdpdmVuXG4gICAqIGNvbGxlY3Rpb24gaXMgYSBzdHJpbmcgdmFsdWUuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBUaGUgY2hhcmFjdGVyIHRvIGluc3BlY3QuXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGNvZGUgdW5pdCBvZiBnaXZlbiBjaGFyYWN0ZXIuXG4gICAqL1xuICBmdW5jdGlvbiBjaGFyQXRDYWxsYmFjayh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS5jaGFyQ29kZUF0KDApO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWQgYnkgYHNvcnRCeWAgdG8gY29tcGFyZSB0cmFuc2Zvcm1lZCBgY29sbGVjdGlvbmAgZWxlbWVudHMsIHN0YWJsZSBzb3J0aW5nXG4gICAqIHRoZW0gaW4gYXNjZW5kaW5nIG9yZGVyLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gYSBUaGUgb2JqZWN0IHRvIGNvbXBhcmUgdG8gYGJgLlxuICAgKiBAcGFyYW0ge09iamVjdH0gYiBUaGUgb2JqZWN0IHRvIGNvbXBhcmUgdG8gYGFgLlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBzb3J0IG9yZGVyIGluZGljYXRvciBvZiBgMWAgb3IgYC0xYC5cbiAgICovXG4gIGZ1bmN0aW9uIGNvbXBhcmVBc2NlbmRpbmcoYSwgYikge1xuICAgIHZhciBhYyA9IGEuY3JpdGVyaWEsXG4gICAgICAgIGJjID0gYi5jcml0ZXJpYSxcbiAgICAgICAgaW5kZXggPSAtMSxcbiAgICAgICAgbGVuZ3RoID0gYWMubGVuZ3RoO1xuXG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIHZhciB2YWx1ZSA9IGFjW2luZGV4XSxcbiAgICAgICAgICBvdGhlciA9IGJjW2luZGV4XTtcblxuICAgICAgaWYgKHZhbHVlICE9PSBvdGhlcikge1xuICAgICAgICBpZiAodmFsdWUgPiBvdGhlciB8fCB0eXBlb2YgdmFsdWUgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWUgPCBvdGhlciB8fCB0eXBlb2Ygb3RoZXIgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gRml4ZXMgYW4gYEFycmF5I3NvcnRgIGJ1ZyBpbiB0aGUgSlMgZW5naW5lIGVtYmVkZGVkIGluIEFkb2JlIGFwcGxpY2F0aW9uc1xuICAgIC8vIHRoYXQgY2F1c2VzIGl0LCB1bmRlciBjZXJ0YWluIGNpcmN1bXN0YW5jZXMsIHRvIHJldHVybiB0aGUgc2FtZSB2YWx1ZSBmb3JcbiAgICAvLyBgYWAgYW5kIGBiYC4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9qYXNoa2VuYXMvdW5kZXJzY29yZS9wdWxsLzEyNDdcbiAgICAvL1xuICAgIC8vIFRoaXMgYWxzbyBlbnN1cmVzIGEgc3RhYmxlIHNvcnQgaW4gVjggYW5kIG90aGVyIGVuZ2luZXMuXG4gICAgLy8gU2VlIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTkwXG4gICAgcmV0dXJuIGEuaW5kZXggLSBiLmluZGV4O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBjYWNoZSBvYmplY3QgdG8gb3B0aW1pemUgbGluZWFyIHNlYXJjaGVzIG9mIGxhcmdlIGFycmF5cy5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtBcnJheX0gW2FycmF5PVtdXSBUaGUgYXJyYXkgdG8gc2VhcmNoLlxuICAgKiBAcmV0dXJucyB7bnVsbHxPYmplY3R9IFJldHVybnMgdGhlIGNhY2hlIG9iamVjdCBvciBgbnVsbGAgaWYgY2FjaGluZyBzaG91bGQgbm90IGJlIHVzZWQuXG4gICAqL1xuICBmdW5jdGlvbiBjcmVhdGVDYWNoZShhcnJheSkge1xuICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGgsXG4gICAgICAgIGZpcnN0ID0gYXJyYXlbMF0sXG4gICAgICAgIG1pZCA9IGFycmF5WyhsZW5ndGggLyAyKSB8IDBdLFxuICAgICAgICBsYXN0ID0gYXJyYXlbbGVuZ3RoIC0gMV07XG5cbiAgICBpZiAoZmlyc3QgJiYgdHlwZW9mIGZpcnN0ID09ICdvYmplY3QnICYmXG4gICAgICAgIG1pZCAmJiB0eXBlb2YgbWlkID09ICdvYmplY3QnICYmIGxhc3QgJiYgdHlwZW9mIGxhc3QgPT0gJ29iamVjdCcpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGNhY2hlID0gZ2V0T2JqZWN0KCk7XG4gICAgY2FjaGVbJ2ZhbHNlJ10gPSBjYWNoZVsnbnVsbCddID0gY2FjaGVbJ3RydWUnXSA9IGNhY2hlWyd1bmRlZmluZWQnXSA9IGZhbHNlO1xuXG4gICAgdmFyIHJlc3VsdCA9IGdldE9iamVjdCgpO1xuICAgIHJlc3VsdC5hcnJheSA9IGFycmF5O1xuICAgIHJlc3VsdC5jYWNoZSA9IGNhY2hlO1xuICAgIHJlc3VsdC5wdXNoID0gY2FjaGVQdXNoO1xuXG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIHJlc3VsdC5wdXNoKGFycmF5W2luZGV4XSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogVXNlZCBieSBgdGVtcGxhdGVgIHRvIGVzY2FwZSBjaGFyYWN0ZXJzIGZvciBpbmNsdXNpb24gaW4gY29tcGlsZWRcbiAgICogc3RyaW5nIGxpdGVyYWxzLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWF0Y2ggVGhlIG1hdGNoZWQgY2hhcmFjdGVyIHRvIGVzY2FwZS5cbiAgICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgZXNjYXBlZCBjaGFyYWN0ZXIuXG4gICAqL1xuICBmdW5jdGlvbiBlc2NhcGVTdHJpbmdDaGFyKG1hdGNoKSB7XG4gICAgcmV0dXJuICdcXFxcJyArIHN0cmluZ0VzY2FwZXNbbWF0Y2hdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYW4gYXJyYXkgZnJvbSB0aGUgYXJyYXkgcG9vbCBvciBjcmVhdGVzIGEgbmV3IG9uZSBpZiB0aGUgcG9vbCBpcyBlbXB0eS5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHJldHVybnMge0FycmF5fSBUaGUgYXJyYXkgZnJvbSB0aGUgcG9vbC5cbiAgICovXG4gIGZ1bmN0aW9uIGdldEFycmF5KCkge1xuICAgIHJldHVybiBhcnJheVBvb2wucG9wKCkgfHwgW107XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbiBvYmplY3QgZnJvbSB0aGUgb2JqZWN0IHBvb2wgb3IgY3JlYXRlcyBhIG5ldyBvbmUgaWYgdGhlIHBvb2wgaXMgZW1wdHkuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBvYmplY3QgZnJvbSB0aGUgcG9vbC5cbiAgICovXG4gIGZ1bmN0aW9uIGdldE9iamVjdCgpIHtcbiAgICByZXR1cm4gb2JqZWN0UG9vbC5wb3AoKSB8fCB7XG4gICAgICAnYXJyYXknOiBudWxsLFxuICAgICAgJ2NhY2hlJzogbnVsbCxcbiAgICAgICdjcml0ZXJpYSc6IG51bGwsXG4gICAgICAnZmFsc2UnOiBmYWxzZSxcbiAgICAgICdpbmRleCc6IDAsXG4gICAgICAnbnVsbCc6IGZhbHNlLFxuICAgICAgJ251bWJlcic6IG51bGwsXG4gICAgICAnb2JqZWN0JzogbnVsbCxcbiAgICAgICdwdXNoJzogbnVsbCxcbiAgICAgICdzdHJpbmcnOiBudWxsLFxuICAgICAgJ3RydWUnOiBmYWxzZSxcbiAgICAgICd1bmRlZmluZWQnOiBmYWxzZSxcbiAgICAgICd2YWx1ZSc6IG51bGxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbGVhc2VzIHRoZSBnaXZlbiBhcnJheSBiYWNrIHRvIHRoZSBhcnJheSBwb29sLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0FycmF5fSBbYXJyYXldIFRoZSBhcnJheSB0byByZWxlYXNlLlxuICAgKi9cbiAgZnVuY3Rpb24gcmVsZWFzZUFycmF5KGFycmF5KSB7XG4gICAgYXJyYXkubGVuZ3RoID0gMDtcbiAgICBpZiAoYXJyYXlQb29sLmxlbmd0aCA8IG1heFBvb2xTaXplKSB7XG4gICAgICBhcnJheVBvb2wucHVzaChhcnJheSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbGVhc2VzIHRoZSBnaXZlbiBvYmplY3QgYmFjayB0byB0aGUgb2JqZWN0IHBvb2wuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb2JqZWN0XSBUaGUgb2JqZWN0IHRvIHJlbGVhc2UuXG4gICAqL1xuICBmdW5jdGlvbiByZWxlYXNlT2JqZWN0KG9iamVjdCkge1xuICAgIHZhciBjYWNoZSA9IG9iamVjdC5jYWNoZTtcbiAgICBpZiAoY2FjaGUpIHtcbiAgICAgIHJlbGVhc2VPYmplY3QoY2FjaGUpO1xuICAgIH1cbiAgICBvYmplY3QuYXJyYXkgPSBvYmplY3QuY2FjaGUgPSBvYmplY3QuY3JpdGVyaWEgPSBvYmplY3Qub2JqZWN0ID0gb2JqZWN0Lm51bWJlciA9IG9iamVjdC5zdHJpbmcgPSBvYmplY3QudmFsdWUgPSBudWxsO1xuICAgIGlmIChvYmplY3RQb29sLmxlbmd0aCA8IG1heFBvb2xTaXplKSB7XG4gICAgICBvYmplY3RQb29sLnB1c2gob2JqZWN0KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2xpY2VzIHRoZSBgY29sbGVjdGlvbmAgZnJvbSB0aGUgYHN0YXJ0YCBpbmRleCB1cCB0bywgYnV0IG5vdCBpbmNsdWRpbmcsXG4gICAqIHRoZSBgZW5kYCBpbmRleC5cbiAgICpcbiAgICogTm90ZTogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIGluc3RlYWQgb2YgYEFycmF5I3NsaWNlYCB0byBzdXBwb3J0IG5vZGUgbGlzdHNcbiAgICogaW4gSUUgPCA5IGFuZCB0byBlbnN1cmUgZGVuc2UgYXJyYXlzIGFyZSByZXR1cm5lZC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIHNsaWNlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gc3RhcnQgVGhlIHN0YXJ0IGluZGV4LlxuICAgKiBAcGFyYW0ge251bWJlcn0gZW5kIFRoZSBlbmQgaW5kZXguXG4gICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IGFycmF5LlxuICAgKi9cbiAgZnVuY3Rpb24gc2xpY2UoYXJyYXksIHN0YXJ0LCBlbmQpIHtcbiAgICBzdGFydCB8fCAoc3RhcnQgPSAwKTtcbiAgICBpZiAodHlwZW9mIGVuZCA9PSAndW5kZWZpbmVkJykge1xuICAgICAgZW5kID0gYXJyYXkgPyBhcnJheS5sZW5ndGggOiAwO1xuICAgIH1cbiAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgbGVuZ3RoID0gZW5kIC0gc3RhcnQgfHwgMCxcbiAgICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoIDwgMCA/IDAgOiBsZW5ndGgpO1xuXG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIHJlc3VsdFtpbmRleF0gPSBhcnJheVtzdGFydCArIGluZGV4XTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgYGxvZGFzaGAgZnVuY3Rpb24gdXNpbmcgdGhlIGdpdmVuIGNvbnRleHQgb2JqZWN0LlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBjYXRlZ29yeSBVdGlsaXRpZXNcbiAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0PXJvb3RdIFRoZSBjb250ZXh0IG9iamVjdC5cbiAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBgbG9kYXNoYCBmdW5jdGlvbi5cbiAgICovXG4gIGZ1bmN0aW9uIHJ1bkluQ29udGV4dChjb250ZXh0KSB7XG4gICAgLy8gQXZvaWQgaXNzdWVzIHdpdGggc29tZSBFUzMgZW52aXJvbm1lbnRzIHRoYXQgYXR0ZW1wdCB0byB1c2UgdmFsdWVzLCBuYW1lZFxuICAgIC8vIGFmdGVyIGJ1aWx0LWluIGNvbnN0cnVjdG9ycyBsaWtlIGBPYmplY3RgLCBmb3IgdGhlIGNyZWF0aW9uIG9mIGxpdGVyYWxzLlxuICAgIC8vIEVTNSBjbGVhcnMgdGhpcyB1cCBieSBzdGF0aW5nIHRoYXQgbGl0ZXJhbHMgbXVzdCB1c2UgYnVpbHQtaW4gY29uc3RydWN0b3JzLlxuICAgIC8vIFNlZSBodHRwOi8vZXM1LmdpdGh1Yi5pby8jeDExLjEuNS5cbiAgICBjb250ZXh0ID0gY29udGV4dCA/IF8uZGVmYXVsdHMocm9vdC5PYmplY3QoKSwgY29udGV4dCwgXy5waWNrKHJvb3QsIGNvbnRleHRQcm9wcykpIDogcm9vdDtcblxuICAgIC8qKiBOYXRpdmUgY29uc3RydWN0b3IgcmVmZXJlbmNlcyAqL1xuICAgIHZhciBBcnJheSA9IGNvbnRleHQuQXJyYXksXG4gICAgICAgIEJvb2xlYW4gPSBjb250ZXh0LkJvb2xlYW4sXG4gICAgICAgIERhdGUgPSBjb250ZXh0LkRhdGUsXG4gICAgICAgIEZ1bmN0aW9uID0gY29udGV4dC5GdW5jdGlvbixcbiAgICAgICAgTWF0aCA9IGNvbnRleHQuTWF0aCxcbiAgICAgICAgTnVtYmVyID0gY29udGV4dC5OdW1iZXIsXG4gICAgICAgIE9iamVjdCA9IGNvbnRleHQuT2JqZWN0LFxuICAgICAgICBSZWdFeHAgPSBjb250ZXh0LlJlZ0V4cCxcbiAgICAgICAgU3RyaW5nID0gY29udGV4dC5TdHJpbmcsXG4gICAgICAgIFR5cGVFcnJvciA9IGNvbnRleHQuVHlwZUVycm9yO1xuXG4gICAgLyoqXG4gICAgICogVXNlZCBmb3IgYEFycmF5YCBtZXRob2QgcmVmZXJlbmNlcy5cbiAgICAgKlxuICAgICAqIE5vcm1hbGx5IGBBcnJheS5wcm90b3R5cGVgIHdvdWxkIHN1ZmZpY2UsIGhvd2V2ZXIsIHVzaW5nIGFuIGFycmF5IGxpdGVyYWxcbiAgICAgKiBhdm9pZHMgaXNzdWVzIGluIE5hcndoYWwuXG4gICAgICovXG4gICAgdmFyIGFycmF5UmVmID0gW107XG5cbiAgICAvKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzICovXG4gICAgdmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuICAgIC8qKiBVc2VkIHRvIHJlc3RvcmUgdGhlIG9yaWdpbmFsIGBfYCByZWZlcmVuY2UgaW4gYG5vQ29uZmxpY3RgICovXG4gICAgdmFyIG9sZERhc2ggPSBjb250ZXh0Ll87XG5cbiAgICAvKiogVXNlZCB0byByZXNvbHZlIHRoZSBpbnRlcm5hbCBbW0NsYXNzXV0gb2YgdmFsdWVzICovXG4gICAgdmFyIHRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbiAgICAvKiogVXNlZCB0byBkZXRlY3QgaWYgYSBtZXRob2QgaXMgbmF0aXZlICovXG4gICAgdmFyIHJlTmF0aXZlID0gUmVnRXhwKCdeJyArXG4gICAgICBTdHJpbmcodG9TdHJpbmcpXG4gICAgICAgIC5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgJ1xcXFwkJicpXG4gICAgICAgIC5yZXBsYWNlKC90b1N0cmluZ3wgZm9yIFteXFxdXSsvZywgJy4qPycpICsgJyQnXG4gICAgKTtcblxuICAgIC8qKiBOYXRpdmUgbWV0aG9kIHNob3J0Y3V0cyAqL1xuICAgIHZhciBjZWlsID0gTWF0aC5jZWlsLFxuICAgICAgICBjbGVhclRpbWVvdXQgPSBjb250ZXh0LmNsZWFyVGltZW91dCxcbiAgICAgICAgZmxvb3IgPSBNYXRoLmZsb29yLFxuICAgICAgICBmblRvU3RyaW5nID0gRnVuY3Rpb24ucHJvdG90eXBlLnRvU3RyaW5nLFxuICAgICAgICBnZXRQcm90b3R5cGVPZiA9IGlzTmF0aXZlKGdldFByb3RvdHlwZU9mID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKSAmJiBnZXRQcm90b3R5cGVPZixcbiAgICAgICAgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eSxcbiAgICAgICAgcHVzaCA9IGFycmF5UmVmLnB1c2gsXG4gICAgICAgIHNldFRpbWVvdXQgPSBjb250ZXh0LnNldFRpbWVvdXQsXG4gICAgICAgIHNwbGljZSA9IGFycmF5UmVmLnNwbGljZSxcbiAgICAgICAgdW5zaGlmdCA9IGFycmF5UmVmLnVuc2hpZnQ7XG5cbiAgICAvKiogVXNlZCB0byBzZXQgbWV0YSBkYXRhIG9uIGZ1bmN0aW9ucyAqL1xuICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IChmdW5jdGlvbigpIHtcbiAgICAgIC8vIElFIDggb25seSBhY2NlcHRzIERPTSBlbGVtZW50c1xuICAgICAgdHJ5IHtcbiAgICAgICAgdmFyIG8gPSB7fSxcbiAgICAgICAgICAgIGZ1bmMgPSBpc05hdGl2ZShmdW5jID0gT2JqZWN0LmRlZmluZVByb3BlcnR5KSAmJiBmdW5jLFxuICAgICAgICAgICAgcmVzdWx0ID0gZnVuYyhvLCBvLCBvKSAmJiBmdW5jO1xuICAgICAgfSBjYXRjaChlKSB7IH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSgpKTtcblxuICAgIC8qIE5hdGl2ZSBtZXRob2Qgc2hvcnRjdXRzIGZvciBtZXRob2RzIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzICovXG4gICAgdmFyIG5hdGl2ZUNyZWF0ZSA9IGlzTmF0aXZlKG5hdGl2ZUNyZWF0ZSA9IE9iamVjdC5jcmVhdGUpICYmIG5hdGl2ZUNyZWF0ZSxcbiAgICAgICAgbmF0aXZlSXNBcnJheSA9IGlzTmF0aXZlKG5hdGl2ZUlzQXJyYXkgPSBBcnJheS5pc0FycmF5KSAmJiBuYXRpdmVJc0FycmF5LFxuICAgICAgICBuYXRpdmVJc0Zpbml0ZSA9IGNvbnRleHQuaXNGaW5pdGUsXG4gICAgICAgIG5hdGl2ZUlzTmFOID0gY29udGV4dC5pc05hTixcbiAgICAgICAgbmF0aXZlS2V5cyA9IGlzTmF0aXZlKG5hdGl2ZUtleXMgPSBPYmplY3Qua2V5cykgJiYgbmF0aXZlS2V5cyxcbiAgICAgICAgbmF0aXZlTWF4ID0gTWF0aC5tYXgsXG4gICAgICAgIG5hdGl2ZU1pbiA9IE1hdGgubWluLFxuICAgICAgICBuYXRpdmVQYXJzZUludCA9IGNvbnRleHQucGFyc2VJbnQsXG4gICAgICAgIG5hdGl2ZVJhbmRvbSA9IE1hdGgucmFuZG9tO1xuXG4gICAgLyoqIFVzZWQgdG8gbG9va3VwIGEgYnVpbHQtaW4gY29uc3RydWN0b3IgYnkgW1tDbGFzc11dICovXG4gICAgdmFyIGN0b3JCeUNsYXNzID0ge307XG4gICAgY3RvckJ5Q2xhc3NbYXJyYXlDbGFzc10gPSBBcnJheTtcbiAgICBjdG9yQnlDbGFzc1tib29sQ2xhc3NdID0gQm9vbGVhbjtcbiAgICBjdG9yQnlDbGFzc1tkYXRlQ2xhc3NdID0gRGF0ZTtcbiAgICBjdG9yQnlDbGFzc1tmdW5jQ2xhc3NdID0gRnVuY3Rpb247XG4gICAgY3RvckJ5Q2xhc3Nbb2JqZWN0Q2xhc3NdID0gT2JqZWN0O1xuICAgIGN0b3JCeUNsYXNzW251bWJlckNsYXNzXSA9IE51bWJlcjtcbiAgICBjdG9yQnlDbGFzc1tyZWdleHBDbGFzc10gPSBSZWdFeHA7XG4gICAgY3RvckJ5Q2xhc3Nbc3RyaW5nQ2xhc3NdID0gU3RyaW5nO1xuXG4gICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgYGxvZGFzaGAgb2JqZWN0IHdoaWNoIHdyYXBzIHRoZSBnaXZlbiB2YWx1ZSB0byBlbmFibGUgaW50dWl0aXZlXG4gICAgICogbWV0aG9kIGNoYWluaW5nLlxuICAgICAqXG4gICAgICogSW4gYWRkaXRpb24gdG8gTG8tRGFzaCBtZXRob2RzLCB3cmFwcGVycyBhbHNvIGhhdmUgdGhlIGZvbGxvd2luZyBgQXJyYXlgIG1ldGhvZHM6XG4gICAgICogYGNvbmNhdGAsIGBqb2luYCwgYHBvcGAsIGBwdXNoYCwgYHJldmVyc2VgLCBgc2hpZnRgLCBgc2xpY2VgLCBgc29ydGAsIGBzcGxpY2VgLFxuICAgICAqIGFuZCBgdW5zaGlmdGBcbiAgICAgKlxuICAgICAqIENoYWluaW5nIGlzIHN1cHBvcnRlZCBpbiBjdXN0b20gYnVpbGRzIGFzIGxvbmcgYXMgdGhlIGB2YWx1ZWAgbWV0aG9kIGlzXG4gICAgICogaW1wbGljaXRseSBvciBleHBsaWNpdGx5IGluY2x1ZGVkIGluIHRoZSBidWlsZC5cbiAgICAgKlxuICAgICAqIFRoZSBjaGFpbmFibGUgd3JhcHBlciBmdW5jdGlvbnMgYXJlOlxuICAgICAqIGBhZnRlcmAsIGBhc3NpZ25gLCBgYmluZGAsIGBiaW5kQWxsYCwgYGJpbmRLZXlgLCBgY2hhaW5gLCBgY29tcGFjdGAsXG4gICAgICogYGNvbXBvc2VgLCBgY29uY2F0YCwgYGNvdW50QnlgLCBgY3JlYXRlYCwgYGNyZWF0ZUNhbGxiYWNrYCwgYGN1cnJ5YCxcbiAgICAgKiBgZGVib3VuY2VgLCBgZGVmYXVsdHNgLCBgZGVmZXJgLCBgZGVsYXlgLCBgZGlmZmVyZW5jZWAsIGBmaWx0ZXJgLCBgZmxhdHRlbmAsXG4gICAgICogYGZvckVhY2hgLCBgZm9yRWFjaFJpZ2h0YCwgYGZvckluYCwgYGZvckluUmlnaHRgLCBgZm9yT3duYCwgYGZvck93blJpZ2h0YCxcbiAgICAgKiBgZnVuY3Rpb25zYCwgYGdyb3VwQnlgLCBgaW5kZXhCeWAsIGBpbml0aWFsYCwgYGludGVyc2VjdGlvbmAsIGBpbnZlcnRgLFxuICAgICAqIGBpbnZva2VgLCBga2V5c2AsIGBtYXBgLCBgbWF4YCwgYG1lbW9pemVgLCBgbWVyZ2VgLCBgbWluYCwgYG9iamVjdGAsIGBvbWl0YCxcbiAgICAgKiBgb25jZWAsIGBwYWlyc2AsIGBwYXJ0aWFsYCwgYHBhcnRpYWxSaWdodGAsIGBwaWNrYCwgYHBsdWNrYCwgYHB1bGxgLCBgcHVzaGAsXG4gICAgICogYHJhbmdlYCwgYHJlamVjdGAsIGByZW1vdmVgLCBgcmVzdGAsIGByZXZlcnNlYCwgYHNodWZmbGVgLCBgc2xpY2VgLCBgc29ydGAsXG4gICAgICogYHNvcnRCeWAsIGBzcGxpY2VgLCBgdGFwYCwgYHRocm90dGxlYCwgYHRpbWVzYCwgYHRvQXJyYXlgLCBgdHJhbnNmb3JtYCxcbiAgICAgKiBgdW5pb25gLCBgdW5pcWAsIGB1bnNoaWZ0YCwgYHVuemlwYCwgYHZhbHVlc2AsIGB3aGVyZWAsIGB3aXRob3V0YCwgYHdyYXBgLFxuICAgICAqIGFuZCBgemlwYFxuICAgICAqXG4gICAgICogVGhlIG5vbi1jaGFpbmFibGUgd3JhcHBlciBmdW5jdGlvbnMgYXJlOlxuICAgICAqIGBjbG9uZWAsIGBjbG9uZURlZXBgLCBgY29udGFpbnNgLCBgZXNjYXBlYCwgYGV2ZXJ5YCwgYGZpbmRgLCBgZmluZEluZGV4YCxcbiAgICAgKiBgZmluZEtleWAsIGBmaW5kTGFzdGAsIGBmaW5kTGFzdEluZGV4YCwgYGZpbmRMYXN0S2V5YCwgYGhhc2AsIGBpZGVudGl0eWAsXG4gICAgICogYGluZGV4T2ZgLCBgaXNBcmd1bWVudHNgLCBgaXNBcnJheWAsIGBpc0Jvb2xlYW5gLCBgaXNEYXRlYCwgYGlzRWxlbWVudGAsXG4gICAgICogYGlzRW1wdHlgLCBgaXNFcXVhbGAsIGBpc0Zpbml0ZWAsIGBpc0Z1bmN0aW9uYCwgYGlzTmFOYCwgYGlzTnVsbGAsIGBpc051bWJlcmAsXG4gICAgICogYGlzT2JqZWN0YCwgYGlzUGxhaW5PYmplY3RgLCBgaXNSZWdFeHBgLCBgaXNTdHJpbmdgLCBgaXNVbmRlZmluZWRgLCBgam9pbmAsXG4gICAgICogYGxhc3RJbmRleE9mYCwgYG1peGluYCwgYG5vQ29uZmxpY3RgLCBgcGFyc2VJbnRgLCBgcG9wYCwgYHJhbmRvbWAsIGByZWR1Y2VgLFxuICAgICAqIGByZWR1Y2VSaWdodGAsIGByZXN1bHRgLCBgc2hpZnRgLCBgc2l6ZWAsIGBzb21lYCwgYHNvcnRlZEluZGV4YCwgYHJ1bkluQ29udGV4dGAsXG4gICAgICogYHRlbXBsYXRlYCwgYHVuZXNjYXBlYCwgYHVuaXF1ZUlkYCwgYW5kIGB2YWx1ZWBcbiAgICAgKlxuICAgICAqIFRoZSB3cmFwcGVyIGZ1bmN0aW9ucyBgZmlyc3RgIGFuZCBgbGFzdGAgcmV0dXJuIHdyYXBwZWQgdmFsdWVzIHdoZW4gYG5gIGlzXG4gICAgICogcHJvdmlkZWQsIG90aGVyd2lzZSB0aGV5IHJldHVybiB1bndyYXBwZWQgdmFsdWVzLlxuICAgICAqXG4gICAgICogRXhwbGljaXQgY2hhaW5pbmcgY2FuIGJlIGVuYWJsZWQgYnkgdXNpbmcgdGhlIGBfLmNoYWluYCBtZXRob2QuXG4gICAgICpcbiAgICAgKiBAbmFtZSBfXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICogQGNhdGVnb3J5IENoYWluaW5nXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gd3JhcCBpbiBhIGBsb2Rhc2hgIGluc3RhbmNlLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYSBgbG9kYXNoYCBpbnN0YW5jZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIHdyYXBwZWQgPSBfKFsxLCAyLCAzXSk7XG4gICAgICpcbiAgICAgKiAvLyByZXR1cm5zIGFuIHVud3JhcHBlZCB2YWx1ZVxuICAgICAqIHdyYXBwZWQucmVkdWNlKGZ1bmN0aW9uKHN1bSwgbnVtKSB7XG4gICAgICogICByZXR1cm4gc3VtICsgbnVtO1xuICAgICAqIH0pO1xuICAgICAqIC8vID0+IDZcbiAgICAgKlxuICAgICAqIC8vIHJldHVybnMgYSB3cmFwcGVkIHZhbHVlXG4gICAgICogdmFyIHNxdWFyZXMgPSB3cmFwcGVkLm1hcChmdW5jdGlvbihudW0pIHtcbiAgICAgKiAgIHJldHVybiBudW0gKiBudW07XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBfLmlzQXJyYXkoc3F1YXJlcyk7XG4gICAgICogLy8gPT4gZmFsc2VcbiAgICAgKlxuICAgICAqIF8uaXNBcnJheShzcXVhcmVzLnZhbHVlKCkpO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBsb2Rhc2godmFsdWUpIHtcbiAgICAgIC8vIGRvbid0IHdyYXAgaWYgYWxyZWFkeSB3cmFwcGVkLCBldmVuIGlmIHdyYXBwZWQgYnkgYSBkaWZmZXJlbnQgYGxvZGFzaGAgY29uc3RydWN0b3JcbiAgICAgIHJldHVybiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnICYmICFpc0FycmF5KHZhbHVlKSAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCAnX193cmFwcGVkX18nKSlcbiAgICAgICA/IHZhbHVlXG4gICAgICAgOiBuZXcgbG9kYXNoV3JhcHBlcih2YWx1ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBmYXN0IHBhdGggZm9yIGNyZWF0aW5nIGBsb2Rhc2hgIHdyYXBwZXIgb2JqZWN0cy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gd3JhcCBpbiBhIGBsb2Rhc2hgIGluc3RhbmNlLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gY2hhaW5BbGwgQSBmbGFnIHRvIGVuYWJsZSBjaGFpbmluZyBmb3IgYWxsIG1ldGhvZHNcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGEgYGxvZGFzaGAgaW5zdGFuY2UuXG4gICAgICovXG4gICAgZnVuY3Rpb24gbG9kYXNoV3JhcHBlcih2YWx1ZSwgY2hhaW5BbGwpIHtcbiAgICAgIHRoaXMuX19jaGFpbl9fID0gISFjaGFpbkFsbDtcbiAgICAgIHRoaXMuX193cmFwcGVkX18gPSB2YWx1ZTtcbiAgICB9XG4gICAgLy8gZW5zdXJlIGBuZXcgbG9kYXNoV3JhcHBlcmAgaXMgYW4gaW5zdGFuY2Ugb2YgYGxvZGFzaGBcbiAgICBsb2Rhc2hXcmFwcGVyLnByb3RvdHlwZSA9IGxvZGFzaC5wcm90b3R5cGU7XG5cbiAgICAvKipcbiAgICAgKiBBbiBvYmplY3QgdXNlZCB0byBmbGFnIGVudmlyb25tZW50cyBmZWF0dXJlcy5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEB0eXBlIE9iamVjdFxuICAgICAqL1xuICAgIHZhciBzdXBwb3J0ID0gbG9kYXNoLnN1cHBvcnQgPSB7fTtcblxuICAgIC8qKlxuICAgICAqIERldGVjdCBpZiBmdW5jdGlvbnMgY2FuIGJlIGRlY29tcGlsZWQgYnkgYEZ1bmN0aW9uI3RvU3RyaW5nYFxuICAgICAqIChhbGwgYnV0IFBTMyBhbmQgb2xkZXIgT3BlcmEgbW9iaWxlIGJyb3dzZXJzICYgYXZvaWRlZCBpbiBXaW5kb3dzIDggYXBwcykuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgXy5zdXBwb3J0XG4gICAgICogQHR5cGUgYm9vbGVhblxuICAgICAqL1xuICAgIHN1cHBvcnQuZnVuY0RlY29tcCA9ICFpc05hdGl2ZShjb250ZXh0LldpblJURXJyb3IpICYmIHJlVGhpcy50ZXN0KHJ1bkluQ29udGV4dCk7XG5cbiAgICAvKipcbiAgICAgKiBEZXRlY3QgaWYgYEZ1bmN0aW9uI25hbWVgIGlzIHN1cHBvcnRlZCAoYWxsIGJ1dCBJRSkuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgXy5zdXBwb3J0XG4gICAgICogQHR5cGUgYm9vbGVhblxuICAgICAqL1xuICAgIHN1cHBvcnQuZnVuY05hbWVzID0gdHlwZW9mIEZ1bmN0aW9uLm5hbWUgPT0gJ3N0cmluZyc7XG5cbiAgICAvKipcbiAgICAgKiBCeSBkZWZhdWx0LCB0aGUgdGVtcGxhdGUgZGVsaW1pdGVycyB1c2VkIGJ5IExvLURhc2ggYXJlIHNpbWlsYXIgdG8gdGhvc2UgaW5cbiAgICAgKiBlbWJlZGRlZCBSdWJ5IChFUkIpLiBDaGFuZ2UgdGhlIGZvbGxvd2luZyB0ZW1wbGF0ZSBzZXR0aW5ncyB0byB1c2UgYWx0ZXJuYXRpdmVcbiAgICAgKiBkZWxpbWl0ZXJzLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQHR5cGUgT2JqZWN0XG4gICAgICovXG4gICAgbG9kYXNoLnRlbXBsYXRlU2V0dGluZ3MgPSB7XG5cbiAgICAgIC8qKlxuICAgICAgICogVXNlZCB0byBkZXRlY3QgYGRhdGFgIHByb3BlcnR5IHZhbHVlcyB0byBiZSBIVE1MLWVzY2FwZWQuXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIF8udGVtcGxhdGVTZXR0aW5nc1xuICAgICAgICogQHR5cGUgUmVnRXhwXG4gICAgICAgKi9cbiAgICAgICdlc2NhcGUnOiAvPCUtKFtcXHNcXFNdKz8pJT4vZyxcblxuICAgICAgLyoqXG4gICAgICAgKiBVc2VkIHRvIGRldGVjdCBjb2RlIHRvIGJlIGV2YWx1YXRlZC5cbiAgICAgICAqXG4gICAgICAgKiBAbWVtYmVyT2YgXy50ZW1wbGF0ZVNldHRpbmdzXG4gICAgICAgKiBAdHlwZSBSZWdFeHBcbiAgICAgICAqL1xuICAgICAgJ2V2YWx1YXRlJzogLzwlKFtcXHNcXFNdKz8pJT4vZyxcblxuICAgICAgLyoqXG4gICAgICAgKiBVc2VkIHRvIGRldGVjdCBgZGF0YWAgcHJvcGVydHkgdmFsdWVzIHRvIGluamVjdC5cbiAgICAgICAqXG4gICAgICAgKiBAbWVtYmVyT2YgXy50ZW1wbGF0ZVNldHRpbmdzXG4gICAgICAgKiBAdHlwZSBSZWdFeHBcbiAgICAgICAqL1xuICAgICAgJ2ludGVycG9sYXRlJzogcmVJbnRlcnBvbGF0ZSxcblxuICAgICAgLyoqXG4gICAgICAgKiBVc2VkIHRvIHJlZmVyZW5jZSB0aGUgZGF0YSBvYmplY3QgaW4gdGhlIHRlbXBsYXRlIHRleHQuXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIF8udGVtcGxhdGVTZXR0aW5nc1xuICAgICAgICogQHR5cGUgc3RyaW5nXG4gICAgICAgKi9cbiAgICAgICd2YXJpYWJsZSc6ICcnLFxuXG4gICAgICAvKipcbiAgICAgICAqIFVzZWQgdG8gaW1wb3J0IHZhcmlhYmxlcyBpbnRvIHRoZSBjb21waWxlZCB0ZW1wbGF0ZS5cbiAgICAgICAqXG4gICAgICAgKiBAbWVtYmVyT2YgXy50ZW1wbGF0ZVNldHRpbmdzXG4gICAgICAgKiBAdHlwZSBPYmplY3RcbiAgICAgICAqL1xuICAgICAgJ2ltcG9ydHMnOiB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBgbG9kYXNoYCBmdW5jdGlvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlck9mIF8udGVtcGxhdGVTZXR0aW5ncy5pbXBvcnRzXG4gICAgICAgICAqIEB0eXBlIEZ1bmN0aW9uXG4gICAgICAgICAqL1xuICAgICAgICAnXyc6IGxvZGFzaFxuICAgICAgfVxuICAgIH07XG5cbiAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgIC8qKlxuICAgICAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmJpbmRgIHRoYXQgY3JlYXRlcyB0aGUgYm91bmQgZnVuY3Rpb24gYW5kXG4gICAgICogc2V0cyBpdHMgbWV0YSBkYXRhLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBiaW5kRGF0YSBUaGUgYmluZCBkYXRhIGFycmF5LlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGJvdW5kIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJhc2VCaW5kKGJpbmREYXRhKSB7XG4gICAgICB2YXIgZnVuYyA9IGJpbmREYXRhWzBdLFxuICAgICAgICAgIHBhcnRpYWxBcmdzID0gYmluZERhdGFbMl0sXG4gICAgICAgICAgdGhpc0FyZyA9IGJpbmREYXRhWzRdO1xuXG4gICAgICBmdW5jdGlvbiBib3VuZCgpIHtcbiAgICAgICAgLy8gYEZ1bmN0aW9uI2JpbmRgIHNwZWNcbiAgICAgICAgLy8gaHR0cDovL2VzNS5naXRodWIuaW8vI3gxNS4zLjQuNVxuICAgICAgICBpZiAocGFydGlhbEFyZ3MpIHtcbiAgICAgICAgICAvLyBhdm9pZCBgYXJndW1lbnRzYCBvYmplY3QgZGVvcHRpbWl6YXRpb25zIGJ5IHVzaW5nIGBzbGljZWAgaW5zdGVhZFxuICAgICAgICAgIC8vIG9mIGBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbGAgYW5kIG5vdCBhc3NpZ25pbmcgYGFyZ3VtZW50c2AgdG8gYVxuICAgICAgICAgIC8vIHZhcmlhYmxlIGFzIGEgdGVybmFyeSBleHByZXNzaW9uXG4gICAgICAgICAgdmFyIGFyZ3MgPSBzbGljZShwYXJ0aWFsQXJncyk7XG4gICAgICAgICAgcHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICAgIC8vIG1pbWljIHRoZSBjb25zdHJ1Y3RvcidzIGByZXR1cm5gIGJlaGF2aW9yXG4gICAgICAgIC8vIGh0dHA6Ly9lczUuZ2l0aHViLmlvLyN4MTMuMi4yXG4gICAgICAgIGlmICh0aGlzIGluc3RhbmNlb2YgYm91bmQpIHtcbiAgICAgICAgICAvLyBlbnN1cmUgYG5ldyBib3VuZGAgaXMgYW4gaW5zdGFuY2Ugb2YgYGZ1bmNgXG4gICAgICAgICAgdmFyIHRoaXNCaW5kaW5nID0gYmFzZUNyZWF0ZShmdW5jLnByb3RvdHlwZSksXG4gICAgICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0JpbmRpbmcsIGFyZ3MgfHwgYXJndW1lbnRzKTtcbiAgICAgICAgICByZXR1cm4gaXNPYmplY3QocmVzdWx0KSA/IHJlc3VsdCA6IHRoaXNCaW5kaW5nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MgfHwgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICAgIHNldEJpbmREYXRhKGJvdW5kLCBiaW5kRGF0YSk7XG4gICAgICByZXR1cm4gYm91bmQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uY2xvbmVgIHdpdGhvdXQgYXJndW1lbnQganVnZ2xpbmcgb3Igc3VwcG9ydFxuICAgICAqIGZvciBgdGhpc0FyZ2AgYmluZGluZy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2xvbmUuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNEZWVwPWZhbHNlXSBTcGVjaWZ5IGEgZGVlcCBjbG9uZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY2xvbmluZyB2YWx1ZXMuXG4gICAgICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQT1bXV0gVHJhY2tzIHRyYXZlcnNlZCBzb3VyY2Ugb2JqZWN0cy5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tCPVtdXSBBc3NvY2lhdGVzIGNsb25lcyB3aXRoIHNvdXJjZSBjb3VudGVycGFydHMuXG4gICAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGNsb25lZCB2YWx1ZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiYXNlQ2xvbmUodmFsdWUsIGlzRGVlcCwgY2FsbGJhY2ssIHN0YWNrQSwgc3RhY2tCKSB7XG4gICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGNhbGxiYWNrKHZhbHVlKTtcbiAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBpbnNwZWN0IFtbQ2xhc3NdXVxuICAgICAgdmFyIGlzT2JqID0gaXNPYmplY3QodmFsdWUpO1xuICAgICAgaWYgKGlzT2JqKSB7XG4gICAgICAgIHZhciBjbGFzc05hbWUgPSB0b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgICAgICAgaWYgKCFjbG9uZWFibGVDbGFzc2VzW2NsYXNzTmFtZV0pIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGN0b3IgPSBjdG9yQnlDbGFzc1tjbGFzc05hbWVdO1xuICAgICAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgICAgIGNhc2UgYm9vbENsYXNzOlxuICAgICAgICAgIGNhc2UgZGF0ZUNsYXNzOlxuICAgICAgICAgICAgcmV0dXJuIG5ldyBjdG9yKCt2YWx1ZSk7XG5cbiAgICAgICAgICBjYXNlIG51bWJlckNsYXNzOlxuICAgICAgICAgIGNhc2Ugc3RyaW5nQ2xhc3M6XG4gICAgICAgICAgICByZXR1cm4gbmV3IGN0b3IodmFsdWUpO1xuXG4gICAgICAgICAgY2FzZSByZWdleHBDbGFzczpcbiAgICAgICAgICAgIHJlc3VsdCA9IGN0b3IodmFsdWUuc291cmNlLCByZUZsYWdzLmV4ZWModmFsdWUpKTtcbiAgICAgICAgICAgIHJlc3VsdC5sYXN0SW5kZXggPSB2YWx1ZS5sYXN0SW5kZXg7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG4gICAgICB2YXIgaXNBcnIgPSBpc0FycmF5KHZhbHVlKTtcbiAgICAgIGlmIChpc0RlZXApIHtcbiAgICAgICAgLy8gY2hlY2sgZm9yIGNpcmN1bGFyIHJlZmVyZW5jZXMgYW5kIHJldHVybiBjb3JyZXNwb25kaW5nIGNsb25lXG4gICAgICAgIHZhciBpbml0ZWRTdGFjayA9ICFzdGFja0E7XG4gICAgICAgIHN0YWNrQSB8fCAoc3RhY2tBID0gZ2V0QXJyYXkoKSk7XG4gICAgICAgIHN0YWNrQiB8fCAoc3RhY2tCID0gZ2V0QXJyYXkoKSk7XG5cbiAgICAgICAgdmFyIGxlbmd0aCA9IHN0YWNrQS5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgICAgIGlmIChzdGFja0FbbGVuZ3RoXSA9PSB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0YWNrQltsZW5ndGhdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSBpc0FyciA/IGN0b3IodmFsdWUubGVuZ3RoKSA6IHt9O1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IGlzQXJyID8gc2xpY2UodmFsdWUpIDogYXNzaWduKHt9LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgICAvLyBhZGQgYXJyYXkgcHJvcGVydGllcyBhc3NpZ25lZCBieSBgUmVnRXhwI2V4ZWNgXG4gICAgICBpZiAoaXNBcnIpIHtcbiAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsICdpbmRleCcpKSB7XG4gICAgICAgICAgcmVzdWx0LmluZGV4ID0gdmFsdWUuaW5kZXg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsICdpbnB1dCcpKSB7XG4gICAgICAgICAgcmVzdWx0LmlucHV0ID0gdmFsdWUuaW5wdXQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGV4aXQgZm9yIHNoYWxsb3cgY2xvbmVcbiAgICAgIGlmICghaXNEZWVwKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgICAvLyBhZGQgdGhlIHNvdXJjZSB2YWx1ZSB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHNcbiAgICAgIC8vIGFuZCBhc3NvY2lhdGUgaXQgd2l0aCBpdHMgY2xvbmVcbiAgICAgIHN0YWNrQS5wdXNoKHZhbHVlKTtcbiAgICAgIHN0YWNrQi5wdXNoKHJlc3VsdCk7XG5cbiAgICAgIC8vIHJlY3Vyc2l2ZWx5IHBvcHVsYXRlIGNsb25lIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cylcbiAgICAgIChpc0FyciA/IGZvckVhY2ggOiBmb3JPd24pKHZhbHVlLCBmdW5jdGlvbihvYmpWYWx1ZSwga2V5KSB7XG4gICAgICAgIHJlc3VsdFtrZXldID0gYmFzZUNsb25lKG9ialZhbHVlLCBpc0RlZXAsIGNhbGxiYWNrLCBzdGFja0EsIHN0YWNrQik7XG4gICAgICB9KTtcblxuICAgICAgaWYgKGluaXRlZFN0YWNrKSB7XG4gICAgICAgIHJlbGVhc2VBcnJheShzdGFja0EpO1xuICAgICAgICByZWxlYXNlQXJyYXkoc3RhY2tCKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uY3JlYXRlYCB3aXRob3V0IHN1cHBvcnQgZm9yIGFzc2lnbmluZ1xuICAgICAqIHByb3BlcnRpZXMgdG8gdGhlIGNyZWF0ZWQgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcHJvdG90eXBlIFRoZSBvYmplY3QgdG8gaW5oZXJpdCBmcm9tLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIG5ldyBvYmplY3QuXG4gICAgICovXG4gICAgZnVuY3Rpb24gYmFzZUNyZWF0ZShwcm90b3R5cGUsIHByb3BlcnRpZXMpIHtcbiAgICAgIHJldHVybiBpc09iamVjdChwcm90b3R5cGUpID8gbmF0aXZlQ3JlYXRlKHByb3RvdHlwZSkgOiB7fTtcbiAgICB9XG4gICAgLy8gZmFsbGJhY2sgZm9yIGJyb3dzZXJzIHdpdGhvdXQgYE9iamVjdC5jcmVhdGVgXG4gICAgaWYgKCFuYXRpdmVDcmVhdGUpIHtcbiAgICAgIGJhc2VDcmVhdGUgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIGZ1bmN0aW9uIE9iamVjdCgpIHt9XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihwcm90b3R5cGUpIHtcbiAgICAgICAgICBpZiAoaXNPYmplY3QocHJvdG90eXBlKSkge1xuICAgICAgICAgICAgT2JqZWN0LnByb3RvdHlwZSA9IHByb3RvdHlwZTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBuZXcgT2JqZWN0O1xuICAgICAgICAgICAgT2JqZWN0LnByb3RvdHlwZSA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXN1bHQgfHwgY29udGV4dC5PYmplY3QoKTtcbiAgICAgICAgfTtcbiAgICAgIH0oKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uY3JlYXRlQ2FsbGJhY2tgIHdpdGhvdXQgc3VwcG9ydCBmb3IgY3JlYXRpbmdcbiAgICAgKiBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFja3MuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7Kn0gW2Z1bmM9aWRlbnRpdHldIFRoZSB2YWx1ZSB0byBjb252ZXJ0IHRvIGEgY2FsbGJhY2suXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIHRoZSBjcmVhdGVkIGNhbGxiYWNrLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbYXJnQ291bnRdIFRoZSBudW1iZXIgb2YgYXJndW1lbnRzIHRoZSBjYWxsYmFjayBhY2NlcHRzLlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyBhIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJhc2VDcmVhdGVDYWxsYmFjayhmdW5jLCB0aGlzQXJnLCBhcmdDb3VudCkge1xuICAgICAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIGlkZW50aXR5O1xuICAgICAgfVxuICAgICAgLy8gZXhpdCBlYXJseSBmb3Igbm8gYHRoaXNBcmdgIG9yIGFscmVhZHkgYm91bmQgYnkgYEZ1bmN0aW9uI2JpbmRgXG4gICAgICBpZiAodHlwZW9mIHRoaXNBcmcgPT0gJ3VuZGVmaW5lZCcgfHwgISgncHJvdG90eXBlJyBpbiBmdW5jKSkge1xuICAgICAgICByZXR1cm4gZnVuYztcbiAgICAgIH1cbiAgICAgIHZhciBiaW5kRGF0YSA9IGZ1bmMuX19iaW5kRGF0YV9fO1xuICAgICAgaWYgKHR5cGVvZiBiaW5kRGF0YSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAoc3VwcG9ydC5mdW5jTmFtZXMpIHtcbiAgICAgICAgICBiaW5kRGF0YSA9ICFmdW5jLm5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgYmluZERhdGEgPSBiaW5kRGF0YSB8fCAhc3VwcG9ydC5mdW5jRGVjb21wO1xuICAgICAgICBpZiAoIWJpbmREYXRhKSB7XG4gICAgICAgICAgdmFyIHNvdXJjZSA9IGZuVG9TdHJpbmcuY2FsbChmdW5jKTtcbiAgICAgICAgICBpZiAoIXN1cHBvcnQuZnVuY05hbWVzKSB7XG4gICAgICAgICAgICBiaW5kRGF0YSA9ICFyZUZ1bmNOYW1lLnRlc3Qoc291cmNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFiaW5kRGF0YSkge1xuICAgICAgICAgICAgLy8gY2hlY2tzIGlmIGBmdW5jYCByZWZlcmVuY2VzIHRoZSBgdGhpc2Aga2V5d29yZCBhbmQgc3RvcmVzIHRoZSByZXN1bHRcbiAgICAgICAgICAgIGJpbmREYXRhID0gcmVUaGlzLnRlc3Qoc291cmNlKTtcbiAgICAgICAgICAgIHNldEJpbmREYXRhKGZ1bmMsIGJpbmREYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGV4aXQgZWFybHkgaWYgdGhlcmUgYXJlIG5vIGB0aGlzYCByZWZlcmVuY2VzIG9yIGBmdW5jYCBpcyBib3VuZFxuICAgICAgaWYgKGJpbmREYXRhID09PSBmYWxzZSB8fCAoYmluZERhdGEgIT09IHRydWUgJiYgYmluZERhdGFbMV0gJiAxKSkge1xuICAgICAgICByZXR1cm4gZnVuYztcbiAgICAgIH1cbiAgICAgIHN3aXRjaCAoYXJnQ291bnQpIHtcbiAgICAgICAgY2FzZSAxOiByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIHZhbHVlKTtcbiAgICAgICAgfTtcbiAgICAgICAgY2FzZSAyOiByZXR1cm4gZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgYSwgYik7XG4gICAgICAgIH07XG4gICAgICAgIGNhc2UgMzogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKTtcbiAgICAgICAgfTtcbiAgICAgICAgY2FzZSA0OiByZXR1cm4gZnVuY3Rpb24oYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4gYmluZChmdW5jLCB0aGlzQXJnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgY3JlYXRlV3JhcHBlcmAgdGhhdCBjcmVhdGVzIHRoZSB3cmFwcGVyIGFuZFxuICAgICAqIHNldHMgaXRzIG1ldGEgZGF0YS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtBcnJheX0gYmluZERhdGEgVGhlIGJpbmQgZGF0YSBhcnJheS5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiYXNlQ3JlYXRlV3JhcHBlcihiaW5kRGF0YSkge1xuICAgICAgdmFyIGZ1bmMgPSBiaW5kRGF0YVswXSxcbiAgICAgICAgICBiaXRtYXNrID0gYmluZERhdGFbMV0sXG4gICAgICAgICAgcGFydGlhbEFyZ3MgPSBiaW5kRGF0YVsyXSxcbiAgICAgICAgICBwYXJ0aWFsUmlnaHRBcmdzID0gYmluZERhdGFbM10sXG4gICAgICAgICAgdGhpc0FyZyA9IGJpbmREYXRhWzRdLFxuICAgICAgICAgIGFyaXR5ID0gYmluZERhdGFbNV07XG5cbiAgICAgIHZhciBpc0JpbmQgPSBiaXRtYXNrICYgMSxcbiAgICAgICAgICBpc0JpbmRLZXkgPSBiaXRtYXNrICYgMixcbiAgICAgICAgICBpc0N1cnJ5ID0gYml0bWFzayAmIDQsXG4gICAgICAgICAgaXNDdXJyeUJvdW5kID0gYml0bWFzayAmIDgsXG4gICAgICAgICAga2V5ID0gZnVuYztcblxuICAgICAgZnVuY3Rpb24gYm91bmQoKSB7XG4gICAgICAgIHZhciB0aGlzQmluZGluZyA9IGlzQmluZCA/IHRoaXNBcmcgOiB0aGlzO1xuICAgICAgICBpZiAocGFydGlhbEFyZ3MpIHtcbiAgICAgICAgICB2YXIgYXJncyA9IHNsaWNlKHBhcnRpYWxBcmdzKTtcbiAgICAgICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhcnRpYWxSaWdodEFyZ3MgfHwgaXNDdXJyeSkge1xuICAgICAgICAgIGFyZ3MgfHwgKGFyZ3MgPSBzbGljZShhcmd1bWVudHMpKTtcbiAgICAgICAgICBpZiAocGFydGlhbFJpZ2h0QXJncykge1xuICAgICAgICAgICAgcHVzaC5hcHBseShhcmdzLCBwYXJ0aWFsUmlnaHRBcmdzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGlzQ3VycnkgJiYgYXJncy5sZW5ndGggPCBhcml0eSkge1xuICAgICAgICAgICAgYml0bWFzayB8PSAxNiAmIH4zMjtcbiAgICAgICAgICAgIHJldHVybiBiYXNlQ3JlYXRlV3JhcHBlcihbZnVuYywgKGlzQ3VycnlCb3VuZCA/IGJpdG1hc2sgOiBiaXRtYXNrICYgfjMpLCBhcmdzLCBudWxsLCB0aGlzQXJnLCBhcml0eV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhcmdzIHx8IChhcmdzID0gYXJndW1lbnRzKTtcbiAgICAgICAgaWYgKGlzQmluZEtleSkge1xuICAgICAgICAgIGZ1bmMgPSB0aGlzQmluZGluZ1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzIGluc3RhbmNlb2YgYm91bmQpIHtcbiAgICAgICAgICB0aGlzQmluZGluZyA9IGJhc2VDcmVhdGUoZnVuYy5wcm90b3R5cGUpO1xuICAgICAgICAgIHZhciByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNCaW5kaW5nLCBhcmdzKTtcbiAgICAgICAgICByZXR1cm4gaXNPYmplY3QocmVzdWx0KSA/IHJlc3VsdCA6IHRoaXNCaW5kaW5nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXNCaW5kaW5nLCBhcmdzKTtcbiAgICAgIH1cbiAgICAgIHNldEJpbmREYXRhKGJvdW5kLCBiaW5kRGF0YSk7XG4gICAgICByZXR1cm4gYm91bmQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZGlmZmVyZW5jZWAgdGhhdCBhY2NlcHRzIGEgc2luZ2xlIGFycmF5XG4gICAgICogb2YgdmFsdWVzIHRvIGV4Y2x1ZGUuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBwcm9jZXNzLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IFt2YWx1ZXNdIFRoZSBhcnJheSBvZiB2YWx1ZXMgdG8gZXhjbHVkZS5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBuZXcgYXJyYXkgb2YgZmlsdGVyZWQgdmFsdWVzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJhc2VEaWZmZXJlbmNlKGFycmF5LCB2YWx1ZXMpIHtcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIGluZGV4T2YgPSBnZXRJbmRleE9mKCksXG4gICAgICAgICAgbGVuZ3RoID0gYXJyYXkgPyBhcnJheS5sZW5ndGggOiAwLFxuICAgICAgICAgIGlzTGFyZ2UgPSBsZW5ndGggPj0gbGFyZ2VBcnJheVNpemUgJiYgaW5kZXhPZiA9PT0gYmFzZUluZGV4T2YsXG4gICAgICAgICAgcmVzdWx0ID0gW107XG5cbiAgICAgIGlmIChpc0xhcmdlKSB7XG4gICAgICAgIHZhciBjYWNoZSA9IGNyZWF0ZUNhY2hlKHZhbHVlcyk7XG4gICAgICAgIGlmIChjYWNoZSkge1xuICAgICAgICAgIGluZGV4T2YgPSBjYWNoZUluZGV4T2Y7XG4gICAgICAgICAgdmFsdWVzID0gY2FjaGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaXNMYXJnZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICB2YXIgdmFsdWUgPSBhcnJheVtpbmRleF07XG4gICAgICAgIGlmIChpbmRleE9mKHZhbHVlcywgdmFsdWUpIDwgMCkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGlzTGFyZ2UpIHtcbiAgICAgICAgcmVsZWFzZU9iamVjdCh2YWx1ZXMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5mbGF0dGVuYCB3aXRob3V0IHN1cHBvcnQgZm9yIGNhbGxiYWNrXG4gICAgICogc2hvcnRoYW5kcyBvciBgdGhpc0FyZ2AgYmluZGluZy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGZsYXR0ZW4uXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNTaGFsbG93PWZhbHNlXSBBIGZsYWcgdG8gcmVzdHJpY3QgZmxhdHRlbmluZyB0byBhIHNpbmdsZSBsZXZlbC5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1N0cmljdD1mYWxzZV0gQSBmbGFnIHRvIHJlc3RyaWN0IGZsYXR0ZW5pbmcgdG8gYXJyYXlzIGFuZCBgYXJndW1lbnRzYCBvYmplY3RzLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbZnJvbUluZGV4PTBdIFRoZSBpbmRleCB0byBzdGFydCBmcm9tLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhIG5ldyBmbGF0dGVuZWQgYXJyYXkuXG4gICAgICovXG4gICAgZnVuY3Rpb24gYmFzZUZsYXR0ZW4oYXJyYXksIGlzU2hhbGxvdywgaXNTdHJpY3QsIGZyb21JbmRleCkge1xuICAgICAgdmFyIGluZGV4ID0gKGZyb21JbmRleCB8fCAwKSAtIDEsXG4gICAgICAgICAgbGVuZ3RoID0gYXJyYXkgPyBhcnJheS5sZW5ndGggOiAwLFxuICAgICAgICAgIHJlc3VsdCA9IFtdO1xuXG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICB2YXIgdmFsdWUgPSBhcnJheVtpbmRleF07XG5cbiAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyAmJiB0eXBlb2YgdmFsdWUubGVuZ3RoID09ICdudW1iZXInXG4gICAgICAgICAgICAmJiAoaXNBcnJheSh2YWx1ZSkgfHwgaXNBcmd1bWVudHModmFsdWUpKSkge1xuICAgICAgICAgIC8vIHJlY3Vyc2l2ZWx5IGZsYXR0ZW4gYXJyYXlzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cylcbiAgICAgICAgICBpZiAoIWlzU2hhbGxvdykge1xuICAgICAgICAgICAgdmFsdWUgPSBiYXNlRmxhdHRlbih2YWx1ZSwgaXNTaGFsbG93LCBpc1N0cmljdCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciB2YWxJbmRleCA9IC0xLFxuICAgICAgICAgICAgICB2YWxMZW5ndGggPSB2YWx1ZS5sZW5ndGgsXG4gICAgICAgICAgICAgIHJlc0luZGV4ID0gcmVzdWx0Lmxlbmd0aDtcblxuICAgICAgICAgIHJlc3VsdC5sZW5ndGggKz0gdmFsTGVuZ3RoO1xuICAgICAgICAgIHdoaWxlICgrK3ZhbEluZGV4IDwgdmFsTGVuZ3RoKSB7XG4gICAgICAgICAgICByZXN1bHRbcmVzSW5kZXgrK10gPSB2YWx1ZVt2YWxJbmRleF07XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCFpc1N0cmljdCkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5pc0VxdWFsYCwgd2l0aG91dCBzdXBwb3J0IGZvciBgdGhpc0FyZ2AgYmluZGluZyxcbiAgICAgKiB0aGF0IGFsbG93cyBwYXJ0aWFsIFwiXy53aGVyZVwiIHN0eWxlIGNvbXBhcmlzb25zLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0geyp9IGEgVGhlIHZhbHVlIHRvIGNvbXBhcmUuXG4gICAgICogQHBhcmFtIHsqfSBiIFRoZSBvdGhlciB2YWx1ZSB0byBjb21wYXJlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFja10gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBjb21wYXJpbmcgdmFsdWVzLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtpc1doZXJlPWZhbHNlXSBBIGZsYWcgdG8gaW5kaWNhdGUgcGVyZm9ybWluZyBwYXJ0aWFsIGNvbXBhcmlzb25zLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0E9W11dIFRyYWNrcyB0cmF2ZXJzZWQgYGFgIG9iamVjdHMuXG4gICAgICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQj1bXV0gVHJhY2tzIHRyYXZlcnNlZCBgYmAgb2JqZWN0cy5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJhc2VJc0VxdWFsKGEsIGIsIGNhbGxiYWNrLCBpc1doZXJlLCBzdGFja0EsIHN0YWNrQikge1xuICAgICAgLy8gdXNlZCB0byBpbmRpY2F0ZSB0aGF0IHdoZW4gY29tcGFyaW5nIG9iamVjdHMsIGBhYCBoYXMgYXQgbGVhc3QgdGhlIHByb3BlcnRpZXMgb2YgYGJgXG4gICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGNhbGxiYWNrKGEsIGIpO1xuICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHJldHVybiAhIXJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gZXhpdCBlYXJseSBmb3IgaWRlbnRpY2FsIHZhbHVlc1xuICAgICAgaWYgKGEgPT09IGIpIHtcbiAgICAgICAgLy8gdHJlYXQgYCswYCB2cy4gYC0wYCBhcyBub3QgZXF1YWxcbiAgICAgICAgcmV0dXJuIGEgIT09IDAgfHwgKDEgLyBhID09IDEgLyBiKTtcbiAgICAgIH1cbiAgICAgIHZhciB0eXBlID0gdHlwZW9mIGEsXG4gICAgICAgICAgb3RoZXJUeXBlID0gdHlwZW9mIGI7XG5cbiAgICAgIC8vIGV4aXQgZWFybHkgZm9yIHVubGlrZSBwcmltaXRpdmUgdmFsdWVzXG4gICAgICBpZiAoYSA9PT0gYSAmJlxuICAgICAgICAgICEoYSAmJiBvYmplY3RUeXBlc1t0eXBlXSkgJiZcbiAgICAgICAgICAhKGIgJiYgb2JqZWN0VHlwZXNbb3RoZXJUeXBlXSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgLy8gZXhpdCBlYXJseSBmb3IgYG51bGxgIGFuZCBgdW5kZWZpbmVkYCBhdm9pZGluZyBFUzMncyBGdW5jdGlvbiNjYWxsIGJlaGF2aW9yXG4gICAgICAvLyBodHRwOi8vZXM1LmdpdGh1Yi5pby8jeDE1LjMuNC40XG4gICAgICBpZiAoYSA9PSBudWxsIHx8IGIgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gYSA9PT0gYjtcbiAgICAgIH1cbiAgICAgIC8vIGNvbXBhcmUgW1tDbGFzc11dIG5hbWVzXG4gICAgICB2YXIgY2xhc3NOYW1lID0gdG9TdHJpbmcuY2FsbChhKSxcbiAgICAgICAgICBvdGhlckNsYXNzID0gdG9TdHJpbmcuY2FsbChiKTtcblxuICAgICAgaWYgKGNsYXNzTmFtZSA9PSBhcmdzQ2xhc3MpIHtcbiAgICAgICAgY2xhc3NOYW1lID0gb2JqZWN0Q2xhc3M7XG4gICAgICB9XG4gICAgICBpZiAob3RoZXJDbGFzcyA9PSBhcmdzQ2xhc3MpIHtcbiAgICAgICAgb3RoZXJDbGFzcyA9IG9iamVjdENsYXNzO1xuICAgICAgfVxuICAgICAgaWYgKGNsYXNzTmFtZSAhPSBvdGhlckNsYXNzKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHN3aXRjaCAoY2xhc3NOYW1lKSB7XG4gICAgICAgIGNhc2UgYm9vbENsYXNzOlxuICAgICAgICBjYXNlIGRhdGVDbGFzczpcbiAgICAgICAgICAvLyBjb2VyY2UgZGF0ZXMgYW5kIGJvb2xlYW5zIHRvIG51bWJlcnMsIGRhdGVzIHRvIG1pbGxpc2Vjb25kcyBhbmQgYm9vbGVhbnNcbiAgICAgICAgICAvLyB0byBgMWAgb3IgYDBgIHRyZWF0aW5nIGludmFsaWQgZGF0ZXMgY29lcmNlZCB0byBgTmFOYCBhcyBub3QgZXF1YWxcbiAgICAgICAgICByZXR1cm4gK2EgPT0gK2I7XG5cbiAgICAgICAgY2FzZSBudW1iZXJDbGFzczpcbiAgICAgICAgICAvLyB0cmVhdCBgTmFOYCB2cy4gYE5hTmAgYXMgZXF1YWxcbiAgICAgICAgICByZXR1cm4gKGEgIT0gK2EpXG4gICAgICAgICAgICA/IGIgIT0gK2JcbiAgICAgICAgICAgIC8vIGJ1dCB0cmVhdCBgKzBgIHZzLiBgLTBgIGFzIG5vdCBlcXVhbFxuICAgICAgICAgICAgOiAoYSA9PSAwID8gKDEgLyBhID09IDEgLyBiKSA6IGEgPT0gK2IpO1xuXG4gICAgICAgIGNhc2UgcmVnZXhwQ2xhc3M6XG4gICAgICAgIGNhc2Ugc3RyaW5nQ2xhc3M6XG4gICAgICAgICAgLy8gY29lcmNlIHJlZ2V4ZXMgdG8gc3RyaW5ncyAoaHR0cDovL2VzNS5naXRodWIuaW8vI3gxNS4xMC42LjQpXG4gICAgICAgICAgLy8gdHJlYXQgc3RyaW5nIHByaW1pdGl2ZXMgYW5kIHRoZWlyIGNvcnJlc3BvbmRpbmcgb2JqZWN0IGluc3RhbmNlcyBhcyBlcXVhbFxuICAgICAgICAgIHJldHVybiBhID09IFN0cmluZyhiKTtcbiAgICAgIH1cbiAgICAgIHZhciBpc0FyciA9IGNsYXNzTmFtZSA9PSBhcnJheUNsYXNzO1xuICAgICAgaWYgKCFpc0Fycikge1xuICAgICAgICAvLyB1bndyYXAgYW55IGBsb2Rhc2hgIHdyYXBwZWQgdmFsdWVzXG4gICAgICAgIHZhciBhV3JhcHBlZCA9IGhhc093blByb3BlcnR5LmNhbGwoYSwgJ19fd3JhcHBlZF9fJyksXG4gICAgICAgICAgICBiV3JhcHBlZCA9IGhhc093blByb3BlcnR5LmNhbGwoYiwgJ19fd3JhcHBlZF9fJyk7XG5cbiAgICAgICAgaWYgKGFXcmFwcGVkIHx8IGJXcmFwcGVkKSB7XG4gICAgICAgICAgcmV0dXJuIGJhc2VJc0VxdWFsKGFXcmFwcGVkID8gYS5fX3dyYXBwZWRfXyA6IGEsIGJXcmFwcGVkID8gYi5fX3dyYXBwZWRfXyA6IGIsIGNhbGxiYWNrLCBpc1doZXJlLCBzdGFja0EsIHN0YWNrQik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZXhpdCBmb3IgZnVuY3Rpb25zIGFuZCBET00gbm9kZXNcbiAgICAgICAgaWYgKGNsYXNzTmFtZSAhPSBvYmplY3RDbGFzcykge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBpbiBvbGRlciB2ZXJzaW9ucyBvZiBPcGVyYSwgYGFyZ3VtZW50c2Agb2JqZWN0cyBoYXZlIGBBcnJheWAgY29uc3RydWN0b3JzXG4gICAgICAgIHZhciBjdG9yQSA9IGEuY29uc3RydWN0b3IsXG4gICAgICAgICAgICBjdG9yQiA9IGIuY29uc3RydWN0b3I7XG5cbiAgICAgICAgLy8gbm9uIGBPYmplY3RgIG9iamVjdCBpbnN0YW5jZXMgd2l0aCBkaWZmZXJlbnQgY29uc3RydWN0b3JzIGFyZSBub3QgZXF1YWxcbiAgICAgICAgaWYgKGN0b3JBICE9IGN0b3JCICYmXG4gICAgICAgICAgICAgICEoaXNGdW5jdGlvbihjdG9yQSkgJiYgY3RvckEgaW5zdGFuY2VvZiBjdG9yQSAmJiBpc0Z1bmN0aW9uKGN0b3JCKSAmJiBjdG9yQiBpbnN0YW5jZW9mIGN0b3JCKSAmJlxuICAgICAgICAgICAgICAoJ2NvbnN0cnVjdG9yJyBpbiBhICYmICdjb25zdHJ1Y3RvcicgaW4gYilcbiAgICAgICAgICAgICkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gYXNzdW1lIGN5Y2xpYyBzdHJ1Y3R1cmVzIGFyZSBlcXVhbFxuICAgICAgLy8gdGhlIGFsZ29yaXRobSBmb3IgZGV0ZWN0aW5nIGN5Y2xpYyBzdHJ1Y3R1cmVzIGlzIGFkYXB0ZWQgZnJvbSBFUyA1LjFcbiAgICAgIC8vIHNlY3Rpb24gMTUuMTIuMywgYWJzdHJhY3Qgb3BlcmF0aW9uIGBKT2AgKGh0dHA6Ly9lczUuZ2l0aHViLmlvLyN4MTUuMTIuMylcbiAgICAgIHZhciBpbml0ZWRTdGFjayA9ICFzdGFja0E7XG4gICAgICBzdGFja0EgfHwgKHN0YWNrQSA9IGdldEFycmF5KCkpO1xuICAgICAgc3RhY2tCIHx8IChzdGFja0IgPSBnZXRBcnJheSgpKTtcblxuICAgICAgdmFyIGxlbmd0aCA9IHN0YWNrQS5sZW5ndGg7XG4gICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgaWYgKHN0YWNrQVtsZW5ndGhdID09IGEpIHtcbiAgICAgICAgICByZXR1cm4gc3RhY2tCW2xlbmd0aF0gPT0gYjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdmFyIHNpemUgPSAwO1xuICAgICAgcmVzdWx0ID0gdHJ1ZTtcblxuICAgICAgLy8gYWRkIGBhYCBhbmQgYGJgIHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0c1xuICAgICAgc3RhY2tBLnB1c2goYSk7XG4gICAgICBzdGFja0IucHVzaChiKTtcblxuICAgICAgLy8gcmVjdXJzaXZlbHkgY29tcGFyZSBvYmplY3RzIGFuZCBhcnJheXMgKHN1c2NlcHRpYmxlIHRvIGNhbGwgc3RhY2sgbGltaXRzKVxuICAgICAgaWYgKGlzQXJyKSB7XG4gICAgICAgIC8vIGNvbXBhcmUgbGVuZ3RocyB0byBkZXRlcm1pbmUgaWYgYSBkZWVwIGNvbXBhcmlzb24gaXMgbmVjZXNzYXJ5XG4gICAgICAgIGxlbmd0aCA9IGEubGVuZ3RoO1xuICAgICAgICBzaXplID0gYi5sZW5ndGg7XG4gICAgICAgIHJlc3VsdCA9IHNpemUgPT0gbGVuZ3RoO1xuXG4gICAgICAgIGlmIChyZXN1bHQgfHwgaXNXaGVyZSkge1xuICAgICAgICAgIC8vIGRlZXAgY29tcGFyZSB0aGUgY29udGVudHMsIGlnbm9yaW5nIG5vbi1udW1lcmljIHByb3BlcnRpZXNcbiAgICAgICAgICB3aGlsZSAoc2l6ZS0tKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBsZW5ndGgsXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBiW3NpemVdO1xuXG4gICAgICAgICAgICBpZiAoaXNXaGVyZSkge1xuICAgICAgICAgICAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgICAgICAgICAgIGlmICgocmVzdWx0ID0gYmFzZUlzRXF1YWwoYVtpbmRleF0sIHZhbHVlLCBjYWxsYmFjaywgaXNXaGVyZSwgc3RhY2tBLCBzdGFja0IpKSkge1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCEocmVzdWx0ID0gYmFzZUlzRXF1YWwoYVtzaXplXSwgdmFsdWUsIGNhbGxiYWNrLCBpc1doZXJlLCBzdGFja0EsIHN0YWNrQikpKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIGRlZXAgY29tcGFyZSBvYmplY3RzIHVzaW5nIGBmb3JJbmAsIGluc3RlYWQgb2YgYGZvck93bmAsIHRvIGF2b2lkIGBPYmplY3Qua2V5c2BcbiAgICAgICAgLy8gd2hpY2gsIGluIHRoaXMgY2FzZSwgaXMgbW9yZSBjb3N0bHlcbiAgICAgICAgZm9ySW4oYiwgZnVuY3Rpb24odmFsdWUsIGtleSwgYikge1xuICAgICAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGIsIGtleSkpIHtcbiAgICAgICAgICAgIC8vIGNvdW50IHRoZSBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgICAgICAgIHNpemUrKztcbiAgICAgICAgICAgIC8vIGRlZXAgY29tcGFyZSBlYWNoIHByb3BlcnR5IHZhbHVlLlxuICAgICAgICAgICAgcmV0dXJuIChyZXN1bHQgPSBoYXNPd25Qcm9wZXJ0eS5jYWxsKGEsIGtleSkgJiYgYmFzZUlzRXF1YWwoYVtrZXldLCB2YWx1ZSwgY2FsbGJhY2ssIGlzV2hlcmUsIHN0YWNrQSwgc3RhY2tCKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzdWx0ICYmICFpc1doZXJlKSB7XG4gICAgICAgICAgLy8gZW5zdXJlIGJvdGggb2JqZWN0cyBoYXZlIHRoZSBzYW1lIG51bWJlciBvZiBwcm9wZXJ0aWVzXG4gICAgICAgICAgZm9ySW4oYSwgZnVuY3Rpb24odmFsdWUsIGtleSwgYSkge1xuICAgICAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoYSwga2V5KSkge1xuICAgICAgICAgICAgICAvLyBgc2l6ZWAgd2lsbCBiZSBgLTFgIGlmIGBhYCBoYXMgbW9yZSBwcm9wZXJ0aWVzIHRoYW4gYGJgXG4gICAgICAgICAgICAgIHJldHVybiAocmVzdWx0ID0gLS1zaXplID4gLTEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzdGFja0EucG9wKCk7XG4gICAgICBzdGFja0IucG9wKCk7XG5cbiAgICAgIGlmIChpbml0ZWRTdGFjaykge1xuICAgICAgICByZWxlYXNlQXJyYXkoc3RhY2tBKTtcbiAgICAgICAgcmVsZWFzZUFycmF5KHN0YWNrQik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLm1lcmdlYCB3aXRob3V0IGFyZ3VtZW50IGp1Z2dsaW5nIG9yIHN1cHBvcnRcbiAgICAgKiBmb3IgYHRoaXNBcmdgIGJpbmRpbmcuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc291cmNlIFRoZSBzb3VyY2Ugb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFja10gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBtZXJnaW5nIHByb3BlcnRpZXMuXG4gICAgICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQT1bXV0gVHJhY2tzIHRyYXZlcnNlZCBzb3VyY2Ugb2JqZWN0cy5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tCPVtdXSBBc3NvY2lhdGVzIHZhbHVlcyB3aXRoIHNvdXJjZSBjb3VudGVycGFydHMuXG4gICAgICovXG4gICAgZnVuY3Rpb24gYmFzZU1lcmdlKG9iamVjdCwgc291cmNlLCBjYWxsYmFjaywgc3RhY2tBLCBzdGFja0IpIHtcbiAgICAgIChpc0FycmF5KHNvdXJjZSkgPyBmb3JFYWNoIDogZm9yT3duKShzb3VyY2UsIGZ1bmN0aW9uKHNvdXJjZSwga2V5KSB7XG4gICAgICAgIHZhciBmb3VuZCxcbiAgICAgICAgICAgIGlzQXJyLFxuICAgICAgICAgICAgcmVzdWx0ID0gc291cmNlLFxuICAgICAgICAgICAgdmFsdWUgPSBvYmplY3Rba2V5XTtcblxuICAgICAgICBpZiAoc291cmNlICYmICgoaXNBcnIgPSBpc0FycmF5KHNvdXJjZSkpIHx8IGlzUGxhaW5PYmplY3Qoc291cmNlKSkpIHtcbiAgICAgICAgICAvLyBhdm9pZCBtZXJnaW5nIHByZXZpb3VzbHkgbWVyZ2VkIGN5Y2xpYyBzb3VyY2VzXG4gICAgICAgICAgdmFyIHN0YWNrTGVuZ3RoID0gc3RhY2tBLmxlbmd0aDtcbiAgICAgICAgICB3aGlsZSAoc3RhY2tMZW5ndGgtLSkge1xuICAgICAgICAgICAgaWYgKChmb3VuZCA9IHN0YWNrQVtzdGFja0xlbmd0aF0gPT0gc291cmNlKSkge1xuICAgICAgICAgICAgICB2YWx1ZSA9IHN0YWNrQltzdGFja0xlbmd0aF07XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICB2YXIgaXNTaGFsbG93O1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIHJlc3VsdCA9IGNhbGxiYWNrKHZhbHVlLCBzb3VyY2UpO1xuICAgICAgICAgICAgICBpZiAoKGlzU2hhbGxvdyA9IHR5cGVvZiByZXN1bHQgIT0gJ3VuZGVmaW5lZCcpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSByZXN1bHQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghaXNTaGFsbG93KSB7XG4gICAgICAgICAgICAgIHZhbHVlID0gaXNBcnJcbiAgICAgICAgICAgICAgICA/IChpc0FycmF5KHZhbHVlKSA/IHZhbHVlIDogW10pXG4gICAgICAgICAgICAgICAgOiAoaXNQbGFpbk9iamVjdCh2YWx1ZSkgPyB2YWx1ZSA6IHt9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGFkZCBgc291cmNlYCBhbmQgYXNzb2NpYXRlZCBgdmFsdWVgIHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0c1xuICAgICAgICAgICAgc3RhY2tBLnB1c2goc291cmNlKTtcbiAgICAgICAgICAgIHN0YWNrQi5wdXNoKHZhbHVlKTtcblxuICAgICAgICAgICAgLy8gcmVjdXJzaXZlbHkgbWVyZ2Ugb2JqZWN0cyBhbmQgYXJyYXlzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cylcbiAgICAgICAgICAgIGlmICghaXNTaGFsbG93KSB7XG4gICAgICAgICAgICAgIGJhc2VNZXJnZSh2YWx1ZSwgc291cmNlLCBjYWxsYmFjaywgc3RhY2tBLCBzdGFja0IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGNhbGxiYWNrKHZhbHVlLCBzb3VyY2UpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgcmVzdWx0ID0gc291cmNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdmFsdWUgPSByZXN1bHQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG9iamVjdFtrZXldID0gdmFsdWU7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5yYW5kb21gIHdpdGhvdXQgYXJndW1lbnQganVnZ2xpbmcgb3Igc3VwcG9ydFxuICAgICAqIGZvciByZXR1cm5pbmcgZmxvYXRpbmctcG9pbnQgbnVtYmVycy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG1pbiBUaGUgbWluaW11bSBwb3NzaWJsZSB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbWF4IFRoZSBtYXhpbXVtIHBvc3NpYmxlIHZhbHVlLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgYSByYW5kb20gbnVtYmVyLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJhc2VSYW5kb20obWluLCBtYXgpIHtcbiAgICAgIHJldHVybiBtaW4gKyBmbG9vcihuYXRpdmVSYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8udW5pcWAgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFjayBzaG9ydGhhbmRzXG4gICAgICogb3IgYHRoaXNBcmdgIGJpbmRpbmcuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBwcm9jZXNzLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU29ydGVkPWZhbHNlXSBBIGZsYWcgdG8gaW5kaWNhdGUgdGhhdCBgYXJyYXlgIGlzIHNvcnRlZC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBkdXBsaWNhdGUtdmFsdWUtZnJlZSBhcnJheS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiYXNlVW5pcShhcnJheSwgaXNTb3J0ZWQsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICBpbmRleE9mID0gZ2V0SW5kZXhPZigpLFxuICAgICAgICAgIGxlbmd0aCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMCxcbiAgICAgICAgICByZXN1bHQgPSBbXTtcblxuICAgICAgdmFyIGlzTGFyZ2UgPSAhaXNTb3J0ZWQgJiYgbGVuZ3RoID49IGxhcmdlQXJyYXlTaXplICYmIGluZGV4T2YgPT09IGJhc2VJbmRleE9mLFxuICAgICAgICAgIHNlZW4gPSAoY2FsbGJhY2sgfHwgaXNMYXJnZSkgPyBnZXRBcnJheSgpIDogcmVzdWx0O1xuXG4gICAgICBpZiAoaXNMYXJnZSkge1xuICAgICAgICB2YXIgY2FjaGUgPSBjcmVhdGVDYWNoZShzZWVuKTtcbiAgICAgICAgaW5kZXhPZiA9IGNhY2hlSW5kZXhPZjtcbiAgICAgICAgc2VlbiA9IGNhY2hlO1xuICAgICAgfVxuICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gYXJyYXlbaW5kZXhdLFxuICAgICAgICAgICAgY29tcHV0ZWQgPSBjYWxsYmFjayA/IGNhbGxiYWNrKHZhbHVlLCBpbmRleCwgYXJyYXkpIDogdmFsdWU7XG5cbiAgICAgICAgaWYgKGlzU29ydGVkXG4gICAgICAgICAgICAgID8gIWluZGV4IHx8IHNlZW5bc2Vlbi5sZW5ndGggLSAxXSAhPT0gY29tcHV0ZWRcbiAgICAgICAgICAgICAgOiBpbmRleE9mKHNlZW4sIGNvbXB1dGVkKSA8IDBcbiAgICAgICAgICAgICkge1xuICAgICAgICAgIGlmIChjYWxsYmFjayB8fCBpc0xhcmdlKSB7XG4gICAgICAgICAgICBzZWVuLnB1c2goY29tcHV0ZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChpc0xhcmdlKSB7XG4gICAgICAgIHJlbGVhc2VBcnJheShzZWVuLmFycmF5KTtcbiAgICAgICAgcmVsZWFzZU9iamVjdChzZWVuKTtcbiAgICAgIH0gZWxzZSBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgcmVsZWFzZUFycmF5KHNlZW4pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCBhZ2dyZWdhdGVzIGEgY29sbGVjdGlvbiwgY3JlYXRpbmcgYW4gb2JqZWN0IGNvbXBvc2VkXG4gICAgICogb2Yga2V5cyBnZW5lcmF0ZWQgZnJvbSB0aGUgcmVzdWx0cyBvZiBydW5uaW5nIGVhY2ggZWxlbWVudCBvZiB0aGUgY29sbGVjdGlvblxuICAgICAqIHRocm91Z2ggYSBjYWxsYmFjay4gVGhlIGdpdmVuIGBzZXR0ZXJgIGZ1bmN0aW9uIHNldHMgdGhlIGtleXMgYW5kIHZhbHVlc1xuICAgICAqIG9mIHRoZSBjb21wb3NlZCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHNldHRlciBUaGUgc2V0dGVyIGZ1bmN0aW9uLlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGFnZ3JlZ2F0b3IgZnVuY3Rpb24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gY3JlYXRlQWdncmVnYXRvcihzZXR0ZXIpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihjb2xsZWN0aW9uLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICAgIGNhbGxiYWNrID0gbG9kYXNoLmNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAzKTtcblxuICAgICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24gPyBjb2xsZWN0aW9uLmxlbmd0aCA6IDA7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBsZW5ndGggPT0gJ251bWJlcicpIHtcbiAgICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gY29sbGVjdGlvbltpbmRleF07XG4gICAgICAgICAgICBzZXR0ZXIocmVzdWx0LCB2YWx1ZSwgY2FsbGJhY2sodmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSwgY29sbGVjdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvck93bihjb2xsZWN0aW9uLCBmdW5jdGlvbih2YWx1ZSwga2V5LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICBzZXR0ZXIocmVzdWx0LCB2YWx1ZSwgY2FsbGJhY2sodmFsdWUsIGtleSwgY29sbGVjdGlvbiksIGNvbGxlY3Rpb24pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0LCB3aGVuIGNhbGxlZCwgZWl0aGVyIGN1cnJpZXMgb3IgaW52b2tlcyBgZnVuY2BcbiAgICAgKiB3aXRoIGFuIG9wdGlvbmFsIGB0aGlzYCBiaW5kaW5nIGFuZCBwYXJ0aWFsbHkgYXBwbGllZCBhcmd1bWVudHMuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258c3RyaW5nfSBmdW5jIFRoZSBmdW5jdGlvbiBvciBtZXRob2QgbmFtZSB0byByZWZlcmVuY2UuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGJpdG1hc2sgVGhlIGJpdG1hc2sgb2YgbWV0aG9kIGZsYWdzIHRvIGNvbXBvc2UuXG4gICAgICogIFRoZSBiaXRtYXNrIG1heSBiZSBjb21wb3NlZCBvZiB0aGUgZm9sbG93aW5nIGZsYWdzOlxuICAgICAqICAxIC0gYF8uYmluZGBcbiAgICAgKiAgMiAtIGBfLmJpbmRLZXlgXG4gICAgICogIDQgLSBgXy5jdXJyeWBcbiAgICAgKiAgOCAtIGBfLmN1cnJ5YCAoYm91bmQpXG4gICAgICogIDE2IC0gYF8ucGFydGlhbGBcbiAgICAgKiAgMzIgLSBgXy5wYXJ0aWFsUmlnaHRgXG4gICAgICogQHBhcmFtIHtBcnJheX0gW3BhcnRpYWxBcmdzXSBBbiBhcnJheSBvZiBhcmd1bWVudHMgdG8gcHJlcGVuZCB0byB0aG9zZVxuICAgICAqICBwcm92aWRlZCB0byB0aGUgbmV3IGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IFtwYXJ0aWFsUmlnaHRBcmdzXSBBbiBhcnJheSBvZiBhcmd1bWVudHMgdG8gYXBwZW5kIHRvIHRob3NlXG4gICAgICogIHByb3ZpZGVkIHRvIHRoZSBuZXcgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBmdW5jYC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2FyaXR5XSBUaGUgYXJpdHkgb2YgYGZ1bmNgLlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNyZWF0ZVdyYXBwZXIoZnVuYywgYml0bWFzaywgcGFydGlhbEFyZ3MsIHBhcnRpYWxSaWdodEFyZ3MsIHRoaXNBcmcsIGFyaXR5KSB7XG4gICAgICB2YXIgaXNCaW5kID0gYml0bWFzayAmIDEsXG4gICAgICAgICAgaXNCaW5kS2V5ID0gYml0bWFzayAmIDIsXG4gICAgICAgICAgaXNDdXJyeSA9IGJpdG1hc2sgJiA0LFxuICAgICAgICAgIGlzQ3VycnlCb3VuZCA9IGJpdG1hc2sgJiA4LFxuICAgICAgICAgIGlzUGFydGlhbCA9IGJpdG1hc2sgJiAxNixcbiAgICAgICAgICBpc1BhcnRpYWxSaWdodCA9IGJpdG1hc2sgJiAzMjtcblxuICAgICAgaWYgKCFpc0JpbmRLZXkgJiYgIWlzRnVuY3Rpb24oZnVuYykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICAgIH1cbiAgICAgIGlmIChpc1BhcnRpYWwgJiYgIXBhcnRpYWxBcmdzLmxlbmd0aCkge1xuICAgICAgICBiaXRtYXNrICY9IH4xNjtcbiAgICAgICAgaXNQYXJ0aWFsID0gcGFydGlhbEFyZ3MgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChpc1BhcnRpYWxSaWdodCAmJiAhcGFydGlhbFJpZ2h0QXJncy5sZW5ndGgpIHtcbiAgICAgICAgYml0bWFzayAmPSB+MzI7XG4gICAgICAgIGlzUGFydGlhbFJpZ2h0ID0gcGFydGlhbFJpZ2h0QXJncyA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgdmFyIGJpbmREYXRhID0gZnVuYyAmJiBmdW5jLl9fYmluZERhdGFfXztcbiAgICAgIGlmIChiaW5kRGF0YSAmJiBiaW5kRGF0YSAhPT0gdHJ1ZSkge1xuICAgICAgICAvLyBjbG9uZSBgYmluZERhdGFgXG4gICAgICAgIGJpbmREYXRhID0gc2xpY2UoYmluZERhdGEpO1xuICAgICAgICBpZiAoYmluZERhdGFbMl0pIHtcbiAgICAgICAgICBiaW5kRGF0YVsyXSA9IHNsaWNlKGJpbmREYXRhWzJdKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYmluZERhdGFbM10pIHtcbiAgICAgICAgICBiaW5kRGF0YVszXSA9IHNsaWNlKGJpbmREYXRhWzNdKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBzZXQgYHRoaXNCaW5kaW5nYCBpcyBub3QgcHJldmlvdXNseSBib3VuZFxuICAgICAgICBpZiAoaXNCaW5kICYmICEoYmluZERhdGFbMV0gJiAxKSkge1xuICAgICAgICAgIGJpbmREYXRhWzRdID0gdGhpc0FyZztcbiAgICAgICAgfVxuICAgICAgICAvLyBzZXQgaWYgcHJldmlvdXNseSBib3VuZCBidXQgbm90IGN1cnJlbnRseSAoc3Vic2VxdWVudCBjdXJyaWVkIGZ1bmN0aW9ucylcbiAgICAgICAgaWYgKCFpc0JpbmQgJiYgYmluZERhdGFbMV0gJiAxKSB7XG4gICAgICAgICAgYml0bWFzayB8PSA4O1xuICAgICAgICB9XG4gICAgICAgIC8vIHNldCBjdXJyaWVkIGFyaXR5IGlmIG5vdCB5ZXQgc2V0XG4gICAgICAgIGlmIChpc0N1cnJ5ICYmICEoYmluZERhdGFbMV0gJiA0KSkge1xuICAgICAgICAgIGJpbmREYXRhWzVdID0gYXJpdHk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gYXBwZW5kIHBhcnRpYWwgbGVmdCBhcmd1bWVudHNcbiAgICAgICAgaWYgKGlzUGFydGlhbCkge1xuICAgICAgICAgIHB1c2guYXBwbHkoYmluZERhdGFbMl0gfHwgKGJpbmREYXRhWzJdID0gW10pLCBwYXJ0aWFsQXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gYXBwZW5kIHBhcnRpYWwgcmlnaHQgYXJndW1lbnRzXG4gICAgICAgIGlmIChpc1BhcnRpYWxSaWdodCkge1xuICAgICAgICAgIHVuc2hpZnQuYXBwbHkoYmluZERhdGFbM10gfHwgKGJpbmREYXRhWzNdID0gW10pLCBwYXJ0aWFsUmlnaHRBcmdzKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBtZXJnZSBmbGFnc1xuICAgICAgICBiaW5kRGF0YVsxXSB8PSBiaXRtYXNrO1xuICAgICAgICByZXR1cm4gY3JlYXRlV3JhcHBlci5hcHBseShudWxsLCBiaW5kRGF0YSk7XG4gICAgICB9XG4gICAgICAvLyBmYXN0IHBhdGggZm9yIGBfLmJpbmRgXG4gICAgICB2YXIgY3JlYXRlciA9IChiaXRtYXNrID09IDEgfHwgYml0bWFzayA9PT0gMTcpID8gYmFzZUJpbmQgOiBiYXNlQ3JlYXRlV3JhcHBlcjtcbiAgICAgIHJldHVybiBjcmVhdGVyKFtmdW5jLCBiaXRtYXNrLCBwYXJ0aWFsQXJncywgcGFydGlhbFJpZ2h0QXJncywgdGhpc0FyZywgYXJpdHldKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2VkIGJ5IGBlc2NhcGVgIHRvIGNvbnZlcnQgY2hhcmFjdGVycyB0byBIVE1MIGVudGl0aWVzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbWF0Y2ggVGhlIG1hdGNoZWQgY2hhcmFjdGVyIHRvIGVzY2FwZS5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBlc2NhcGVkIGNoYXJhY3Rlci5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBlc2NhcGVIdG1sQ2hhcihtYXRjaCkge1xuICAgICAgcmV0dXJuIGh0bWxFc2NhcGVzW21hdGNoXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBhcHByb3ByaWF0ZSBcImluZGV4T2ZcIiBmdW5jdGlvbi4gSWYgdGhlIGBfLmluZGV4T2ZgIG1ldGhvZCBpc1xuICAgICAqIGN1c3RvbWl6ZWQsIHRoaXMgbWV0aG9kIHJldHVybnMgdGhlIGN1c3RvbSBtZXRob2QsIG90aGVyd2lzZSBpdCByZXR1cm5zXG4gICAgICogdGhlIGBiYXNlSW5kZXhPZmAgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgXCJpbmRleE9mXCIgZnVuY3Rpb24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0SW5kZXhPZigpIHtcbiAgICAgIHZhciByZXN1bHQgPSAocmVzdWx0ID0gbG9kYXNoLmluZGV4T2YpID09PSBpbmRleE9mID8gYmFzZUluZGV4T2YgOiByZXN1bHQ7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYSBuYXRpdmUgZnVuY3Rpb24sIGVsc2UgYGZhbHNlYC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc05hdGl2ZSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nICYmIHJlTmF0aXZlLnRlc3QodmFsdWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgYHRoaXNgIGJpbmRpbmcgZGF0YSBvbiBhIGdpdmVuIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBzZXQgZGF0YSBvbi5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSB2YWx1ZSBUaGUgZGF0YSBhcnJheSB0byBzZXQuXG4gICAgICovXG4gICAgdmFyIHNldEJpbmREYXRhID0gIWRlZmluZVByb3BlcnR5ID8gbm9vcCA6IGZ1bmN0aW9uKGZ1bmMsIHZhbHVlKSB7XG4gICAgICBkZXNjcmlwdG9yLnZhbHVlID0gdmFsdWU7XG4gICAgICBkZWZpbmVQcm9wZXJ0eShmdW5jLCAnX19iaW5kRGF0YV9fJywgZGVzY3JpcHRvcik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEEgZmFsbGJhY2sgaW1wbGVtZW50YXRpb24gb2YgYGlzUGxhaW5PYmplY3RgIHdoaWNoIGNoZWNrcyBpZiBhIGdpdmVuIHZhbHVlXG4gICAgICogaXMgYW4gb2JqZWN0IGNyZWF0ZWQgYnkgdGhlIGBPYmplY3RgIGNvbnN0cnVjdG9yLCBhc3N1bWluZyBvYmplY3RzIGNyZWF0ZWRcbiAgICAgKiBieSB0aGUgYE9iamVjdGAgY29uc3RydWN0b3IgaGF2ZSBubyBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0aWVzIGFuZCB0aGF0XG4gICAgICogdGhlcmUgYXJlIG5vIGBPYmplY3QucHJvdG90eXBlYCBleHRlbnNpb25zLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHBsYWluIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHNoaW1Jc1BsYWluT2JqZWN0KHZhbHVlKSB7XG4gICAgICB2YXIgY3RvcixcbiAgICAgICAgICByZXN1bHQ7XG5cbiAgICAgIC8vIGF2b2lkIG5vbiBPYmplY3Qgb2JqZWN0cywgYGFyZ3VtZW50c2Agb2JqZWN0cywgYW5kIERPTSBlbGVtZW50c1xuICAgICAgaWYgKCEodmFsdWUgJiYgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gb2JqZWN0Q2xhc3MpIHx8XG4gICAgICAgICAgKGN0b3IgPSB2YWx1ZS5jb25zdHJ1Y3RvciwgaXNGdW5jdGlvbihjdG9yKSAmJiAhKGN0b3IgaW5zdGFuY2VvZiBjdG9yKSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgLy8gSW4gbW9zdCBlbnZpcm9ubWVudHMgYW4gb2JqZWN0J3Mgb3duIHByb3BlcnRpZXMgYXJlIGl0ZXJhdGVkIGJlZm9yZVxuICAgICAgLy8gaXRzIGluaGVyaXRlZCBwcm9wZXJ0aWVzLiBJZiB0aGUgbGFzdCBpdGVyYXRlZCBwcm9wZXJ0eSBpcyBhbiBvYmplY3Qnc1xuICAgICAgLy8gb3duIHByb3BlcnR5IHRoZW4gdGhlcmUgYXJlIG5vIGluaGVyaXRlZCBlbnVtZXJhYmxlIHByb3BlcnRpZXMuXG4gICAgICBmb3JJbih2YWx1ZSwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICByZXN1bHQgPSBrZXk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0eXBlb2YgcmVzdWx0ID09ICd1bmRlZmluZWQnIHx8IGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIHJlc3VsdCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlZCBieSBgdW5lc2NhcGVgIHRvIGNvbnZlcnQgSFRNTCBlbnRpdGllcyB0byBjaGFyYWN0ZXJzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbWF0Y2ggVGhlIG1hdGNoZWQgY2hhcmFjdGVyIHRvIHVuZXNjYXBlLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHVuZXNjYXBlZCBjaGFyYWN0ZXIuXG4gICAgICovXG4gICAgZnVuY3Rpb24gdW5lc2NhcGVIdG1sQ2hhcihtYXRjaCkge1xuICAgICAgcmV0dXJuIGh0bWxVbmVzY2FwZXNbbWF0Y2hdO1xuICAgIH1cblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYW4gYGFyZ3VtZW50c2Agb2JqZWN0LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYW4gYGFyZ3VtZW50c2Agb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIChmdW5jdGlvbigpIHsgcmV0dXJuIF8uaXNBcmd1bWVudHMoYXJndW1lbnRzKTsgfSkoMSwgMiwgMyk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogXy5pc0FyZ3VtZW50cyhbMSwgMiwgM10pO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNBcmd1bWVudHModmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcgJiYgdHlwZW9mIHZhbHVlLmxlbmd0aCA9PSAnbnVtYmVyJyAmJlxuICAgICAgICB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PSBhcmdzQ2xhc3MgfHwgZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYW4gYXJyYXkuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAdHlwZSBGdW5jdGlvblxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGFuIGFycmF5LCBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIChmdW5jdGlvbigpIHsgcmV0dXJuIF8uaXNBcnJheShhcmd1bWVudHMpOyB9KSgpO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICpcbiAgICAgKiBfLmlzQXJyYXkoWzEsIDIsIDNdKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICovXG4gICAgdmFyIGlzQXJyYXkgPSBuYXRpdmVJc0FycmF5IHx8IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnICYmIHR5cGVvZiB2YWx1ZS5sZW5ndGggPT0gJ251bWJlcicgJiZcbiAgICAgICAgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gYXJyYXlDbGFzcyB8fCBmYWxzZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQSBmYWxsYmFjayBpbXBsZW1lbnRhdGlvbiBvZiBgT2JqZWN0LmtleXNgIHdoaWNoIHByb2R1Y2VzIGFuIGFycmF5IG9mIHRoZVxuICAgICAqIGdpdmVuIG9iamVjdCdzIG93biBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAdHlwZSBGdW5jdGlvblxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpbnNwZWN0LlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhbiBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAgICAgKi9cbiAgICB2YXIgc2hpbUtleXMgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgIHZhciBpbmRleCwgaXRlcmFibGUgPSBvYmplY3QsIHJlc3VsdCA9IFtdO1xuICAgICAgaWYgKCFpdGVyYWJsZSkgcmV0dXJuIHJlc3VsdDtcbiAgICAgIGlmICghKG9iamVjdFR5cGVzW3R5cGVvZiBvYmplY3RdKSkgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgZm9yIChpbmRleCBpbiBpdGVyYWJsZSkge1xuICAgICAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGl0ZXJhYmxlLCBpbmRleCkpIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGluZGV4KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBhcnJheSBjb21wb3NlZCBvZiB0aGUgb3duIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMgb2YgYW4gb2JqZWN0LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYW4gYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8ua2V5cyh7ICdvbmUnOiAxLCAndHdvJzogMiwgJ3RocmVlJzogMyB9KTtcbiAgICAgKiAvLyA9PiBbJ29uZScsICd0d28nLCAndGhyZWUnXSAocHJvcGVydHkgb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQgYWNyb3NzIGVudmlyb25tZW50cylcbiAgICAgKi9cbiAgICB2YXIga2V5cyA9ICFuYXRpdmVLZXlzID8gc2hpbUtleXMgOiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgIGlmICghaXNPYmplY3Qob2JqZWN0KSkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgICB9XG4gICAgICByZXR1cm4gbmF0aXZlS2V5cyhvYmplY3QpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBVc2VkIHRvIGNvbnZlcnQgY2hhcmFjdGVycyB0byBIVE1MIGVudGl0aWVzOlxuICAgICAqXG4gICAgICogVGhvdWdoIHRoZSBgPmAgY2hhcmFjdGVyIGlzIGVzY2FwZWQgZm9yIHN5bW1ldHJ5LCBjaGFyYWN0ZXJzIGxpa2UgYD5gIGFuZCBgL2BcbiAgICAgKiBkb24ndCByZXF1aXJlIGVzY2FwaW5nIGluIEhUTUwgYW5kIGhhdmUgbm8gc3BlY2lhbCBtZWFuaW5nIHVubGVzcyB0aGV5J3JlIHBhcnRcbiAgICAgKiBvZiBhIHRhZyBvciBhbiB1bnF1b3RlZCBhdHRyaWJ1dGUgdmFsdWUuXG4gICAgICogaHR0cDovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvYW1iaWd1b3VzLWFtcGVyc2FuZHMgKHVuZGVyIFwic2VtaS1yZWxhdGVkIGZ1biBmYWN0XCIpXG4gICAgICovXG4gICAgdmFyIGh0bWxFc2NhcGVzID0ge1xuICAgICAgJyYnOiAnJmFtcDsnLFxuICAgICAgJzwnOiAnJmx0OycsXG4gICAgICAnPic6ICcmZ3Q7JyxcbiAgICAgICdcIic6ICcmcXVvdDsnLFxuICAgICAgXCInXCI6ICcmIzM5OydcbiAgICB9O1xuXG4gICAgLyoqIFVzZWQgdG8gY29udmVydCBIVE1MIGVudGl0aWVzIHRvIGNoYXJhY3RlcnMgKi9cbiAgICB2YXIgaHRtbFVuZXNjYXBlcyA9IGludmVydChodG1sRXNjYXBlcyk7XG5cbiAgICAvKiogVXNlZCB0byBtYXRjaCBIVE1MIGVudGl0aWVzIGFuZCBIVE1MIGNoYXJhY3RlcnMgKi9cbiAgICB2YXIgcmVFc2NhcGVkSHRtbCA9IFJlZ0V4cCgnKCcgKyBrZXlzKGh0bWxVbmVzY2FwZXMpLmpvaW4oJ3wnKSArICcpJywgJ2cnKSxcbiAgICAgICAgcmVVbmVzY2FwZWRIdG1sID0gUmVnRXhwKCdbJyArIGtleXMoaHRtbEVzY2FwZXMpLmpvaW4oJycpICsgJ10nLCAnZycpO1xuXG4gICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICAvKipcbiAgICAgKiBBc3NpZ25zIG93biBlbnVtZXJhYmxlIHByb3BlcnRpZXMgb2Ygc291cmNlIG9iamVjdChzKSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgKiBvYmplY3QuIFN1YnNlcXVlbnQgc291cmNlcyB3aWxsIG92ZXJ3cml0ZSBwcm9wZXJ0eSBhc3NpZ25tZW50cyBvZiBwcmV2aW91c1xuICAgICAqIHNvdXJjZXMuIElmIGEgY2FsbGJhY2sgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSBleGVjdXRlZCB0byBwcm9kdWNlIHRoZVxuICAgICAqIGFzc2lnbmVkIHZhbHVlcy4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIHR3b1xuICAgICAqIGFyZ3VtZW50czsgKG9iamVjdFZhbHVlLCBzb3VyY2VWYWx1ZSkuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAdHlwZSBGdW5jdGlvblxuICAgICAqIEBhbGlhcyBleHRlbmRcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAgICAgKiBAcGFyYW0gey4uLk9iamVjdH0gW3NvdXJjZV0gVGhlIHNvdXJjZSBvYmplY3RzLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFja10gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBhc3NpZ25pbmcgdmFsdWVzLlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5hc3NpZ24oeyAnbmFtZSc6ICdmcmVkJyB9LCB7ICdlbXBsb3llcic6ICdzbGF0ZScgfSk7XG4gICAgICogLy8gPT4geyAnbmFtZSc6ICdmcmVkJywgJ2VtcGxveWVyJzogJ3NsYXRlJyB9XG4gICAgICpcbiAgICAgKiB2YXIgZGVmYXVsdHMgPSBfLnBhcnRpYWxSaWdodChfLmFzc2lnbiwgZnVuY3Rpb24oYSwgYikge1xuICAgICAqICAgcmV0dXJuIHR5cGVvZiBhID09ICd1bmRlZmluZWQnID8gYiA6IGE7XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiB2YXIgb2JqZWN0ID0geyAnbmFtZSc6ICdiYXJuZXknIH07XG4gICAgICogZGVmYXVsdHMob2JqZWN0LCB7ICduYW1lJzogJ2ZyZWQnLCAnZW1wbG95ZXInOiAnc2xhdGUnIH0pO1xuICAgICAqIC8vID0+IHsgJ25hbWUnOiAnYmFybmV5JywgJ2VtcGxveWVyJzogJ3NsYXRlJyB9XG4gICAgICovXG4gICAgdmFyIGFzc2lnbiA9IGZ1bmN0aW9uKG9iamVjdCwgc291cmNlLCBndWFyZCkge1xuICAgICAgdmFyIGluZGV4LCBpdGVyYWJsZSA9IG9iamVjdCwgcmVzdWx0ID0gaXRlcmFibGU7XG4gICAgICBpZiAoIWl0ZXJhYmxlKSByZXR1cm4gcmVzdWx0O1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgICAgYXJnc0luZGV4ID0gMCxcbiAgICAgICAgICBhcmdzTGVuZ3RoID0gdHlwZW9mIGd1YXJkID09ICdudW1iZXInID8gMiA6IGFyZ3MubGVuZ3RoO1xuICAgICAgaWYgKGFyZ3NMZW5ndGggPiAzICYmIHR5cGVvZiBhcmdzW2FyZ3NMZW5ndGggLSAyXSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGJhc2VDcmVhdGVDYWxsYmFjayhhcmdzWy0tYXJnc0xlbmd0aCAtIDFdLCBhcmdzW2FyZ3NMZW5ndGgtLV0sIDIpO1xuICAgICAgfSBlbHNlIGlmIChhcmdzTGVuZ3RoID4gMiAmJiB0eXBlb2YgYXJnc1thcmdzTGVuZ3RoIC0gMV0gPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjYWxsYmFjayA9IGFyZ3NbLS1hcmdzTGVuZ3RoXTtcbiAgICAgIH1cbiAgICAgIHdoaWxlICgrK2FyZ3NJbmRleCA8IGFyZ3NMZW5ndGgpIHtcbiAgICAgICAgaXRlcmFibGUgPSBhcmdzW2FyZ3NJbmRleF07XG4gICAgICAgIGlmIChpdGVyYWJsZSAmJiBvYmplY3RUeXBlc1t0eXBlb2YgaXRlcmFibGVdKSB7XG4gICAgICAgIHZhciBvd25JbmRleCA9IC0xLFxuICAgICAgICAgICAgb3duUHJvcHMgPSBvYmplY3RUeXBlc1t0eXBlb2YgaXRlcmFibGVdICYmIGtleXMoaXRlcmFibGUpLFxuICAgICAgICAgICAgbGVuZ3RoID0gb3duUHJvcHMgPyBvd25Qcm9wcy5sZW5ndGggOiAwO1xuXG4gICAgICAgIHdoaWxlICgrK293bkluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgaW5kZXggPSBvd25Qcm9wc1tvd25JbmRleF07XG4gICAgICAgICAgcmVzdWx0W2luZGV4XSA9IGNhbGxiYWNrID8gY2FsbGJhY2socmVzdWx0W2luZGV4XSwgaXRlcmFibGVbaW5kZXhdKSA6IGl0ZXJhYmxlW2luZGV4XTtcbiAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBjbG9uZSBvZiBgdmFsdWVgLiBJZiBgaXNEZWVwYCBpcyBgdHJ1ZWAgbmVzdGVkIG9iamVjdHMgd2lsbCBhbHNvXG4gICAgICogYmUgY2xvbmVkLCBvdGhlcndpc2UgdGhleSB3aWxsIGJlIGFzc2lnbmVkIGJ5IHJlZmVyZW5jZS4gSWYgYSBjYWxsYmFja1xuICAgICAqIGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgZXhlY3V0ZWQgdG8gcHJvZHVjZSB0aGUgY2xvbmVkIHZhbHVlcy4gSWYgdGhlXG4gICAgICogY2FsbGJhY2sgcmV0dXJucyBgdW5kZWZpbmVkYCBjbG9uaW5nIHdpbGwgYmUgaGFuZGxlZCBieSB0aGUgbWV0aG9kIGluc3RlYWQuXG4gICAgICogVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIG9uZSBhcmd1bWVudDsgKHZhbHVlKS5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2xvbmUuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNEZWVwPWZhbHNlXSBTcGVjaWZ5IGEgZGVlcCBjbG9uZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY2xvbmluZyB2YWx1ZXMuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGNsb25lZCB2YWx1ZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdmcmVkJywgICAnYWdlJzogNDAgfVxuICAgICAqIF07XG4gICAgICpcbiAgICAgKiB2YXIgc2hhbGxvdyA9IF8uY2xvbmUoY2hhcmFjdGVycyk7XG4gICAgICogc2hhbGxvd1swXSA9PT0gY2hhcmFjdGVyc1swXTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiB2YXIgZGVlcCA9IF8uY2xvbmUoY2hhcmFjdGVycywgdHJ1ZSk7XG4gICAgICogZGVlcFswXSA9PT0gY2hhcmFjdGVyc1swXTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqXG4gICAgICogXy5taXhpbih7XG4gICAgICogICAnY2xvbmUnOiBfLnBhcnRpYWxSaWdodChfLmNsb25lLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAqICAgICByZXR1cm4gXy5pc0VsZW1lbnQodmFsdWUpID8gdmFsdWUuY2xvbmVOb2RlKGZhbHNlKSA6IHVuZGVmaW5lZDtcbiAgICAgKiAgIH0pXG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiB2YXIgY2xvbmUgPSBfLmNsb25lKGRvY3VtZW50LmJvZHkpO1xuICAgICAqIGNsb25lLmNoaWxkTm9kZXMubGVuZ3RoO1xuICAgICAqIC8vID0+IDBcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjbG9uZSh2YWx1ZSwgaXNEZWVwLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgLy8gYWxsb3dzIHdvcmtpbmcgd2l0aCBcIkNvbGxlY3Rpb25zXCIgbWV0aG9kcyB3aXRob3V0IHVzaW5nIHRoZWlyIGBpbmRleGBcbiAgICAgIC8vIGFuZCBgY29sbGVjdGlvbmAgYXJndW1lbnRzIGZvciBgaXNEZWVwYCBhbmQgYGNhbGxiYWNrYFxuICAgICAgaWYgKHR5cGVvZiBpc0RlZXAgIT0gJ2Jvb2xlYW4nICYmIGlzRGVlcCAhPSBudWxsKSB7XG4gICAgICAgIHRoaXNBcmcgPSBjYWxsYmFjaztcbiAgICAgICAgY2FsbGJhY2sgPSBpc0RlZXA7XG4gICAgICAgIGlzRGVlcCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGJhc2VDbG9uZSh2YWx1ZSwgaXNEZWVwLCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJyAmJiBiYXNlQ3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDEpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgZGVlcCBjbG9uZSBvZiBgdmFsdWVgLiBJZiBhIGNhbGxiYWNrIGlzIHByb3ZpZGVkIGl0IHdpbGwgYmVcbiAgICAgKiBleGVjdXRlZCB0byBwcm9kdWNlIHRoZSBjbG9uZWQgdmFsdWVzLiBJZiB0aGUgY2FsbGJhY2sgcmV0dXJucyBgdW5kZWZpbmVkYFxuICAgICAqIGNsb25pbmcgd2lsbCBiZSBoYW5kbGVkIGJ5IHRoZSBtZXRob2QgaW5zdGVhZC4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvXG4gICAgICogYHRoaXNBcmdgIGFuZCBpbnZva2VkIHdpdGggb25lIGFyZ3VtZW50OyAodmFsdWUpLlxuICAgICAqXG4gICAgICogTm90ZTogVGhpcyBtZXRob2QgaXMgbG9vc2VseSBiYXNlZCBvbiB0aGUgc3RydWN0dXJlZCBjbG9uZSBhbGdvcml0aG0uIEZ1bmN0aW9uc1xuICAgICAqIGFuZCBET00gbm9kZXMgYXJlICoqbm90KiogY2xvbmVkLiBUaGUgZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIGBhcmd1bWVudHNgIG9iamVjdHMgYW5kXG4gICAgICogb2JqZWN0cyBjcmVhdGVkIGJ5IGNvbnN0cnVjdG9ycyBvdGhlciB0aGFuIGBPYmplY3RgIGFyZSBjbG9uZWQgdG8gcGxhaW4gYE9iamVjdGAgb2JqZWN0cy5cbiAgICAgKiBTZWUgaHR0cDovL3d3dy53My5vcmcvVFIvaHRtbDUvaW5mcmFzdHJ1Y3R1cmUuaHRtbCNpbnRlcm5hbC1zdHJ1Y3R1cmVkLWNsb25pbmctYWxnb3JpdGhtLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBkZWVwIGNsb25lLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFja10gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBjbG9uaW5nIHZhbHVlcy5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgZGVlcCBjbG9uZWQgdmFsdWUuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBjaGFyYWN0ZXJzID0gW1xuICAgICAqICAgeyAnbmFtZSc6ICdiYXJuZXknLCAnYWdlJzogMzYgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAnZnJlZCcsICAgJ2FnZSc6IDQwIH1cbiAgICAgKiBdO1xuICAgICAqXG4gICAgICogdmFyIGRlZXAgPSBfLmNsb25lRGVlcChjaGFyYWN0ZXJzKTtcbiAgICAgKiBkZWVwWzBdID09PSBjaGFyYWN0ZXJzWzBdO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICpcbiAgICAgKiB2YXIgdmlldyA9IHtcbiAgICAgKiAgICdsYWJlbCc6ICdkb2NzJyxcbiAgICAgKiAgICdub2RlJzogZWxlbWVudFxuICAgICAqIH07XG4gICAgICpcbiAgICAgKiB2YXIgY2xvbmUgPSBfLmNsb25lRGVlcCh2aWV3LCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAqICAgcmV0dXJuIF8uaXNFbGVtZW50KHZhbHVlKSA/IHZhbHVlLmNsb25lTm9kZSh0cnVlKSA6IHVuZGVmaW5lZDtcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIGNsb25lLm5vZGUgPT0gdmlldy5ub2RlO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gY2xvbmVEZWVwKHZhbHVlLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgcmV0dXJuIGJhc2VDbG9uZSh2YWx1ZSwgdHJ1ZSwgdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicgJiYgYmFzZUNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAxKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBvYmplY3QgdGhhdCBpbmhlcml0cyBmcm9tIHRoZSBnaXZlbiBgcHJvdG90eXBlYCBvYmplY3QuIElmIGFcbiAgICAgKiBgcHJvcGVydGllc2Agb2JqZWN0IGlzIHByb3ZpZGVkIGl0cyBvd24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzIGFyZSBhc3NpZ25lZFxuICAgICAqIHRvIHRoZSBjcmVhdGVkIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHByb3RvdHlwZSBUaGUgb2JqZWN0IHRvIGluaGVyaXQgZnJvbS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXNdIFRoZSBwcm9wZXJ0aWVzIHRvIGFzc2lnbiB0byB0aGUgb2JqZWN0LlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIG5ldyBvYmplY3QuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIGZ1bmN0aW9uIFNoYXBlKCkge1xuICAgICAqICAgdGhpcy54ID0gMDtcbiAgICAgKiAgIHRoaXMueSA9IDA7XG4gICAgICogfVxuICAgICAqXG4gICAgICogZnVuY3Rpb24gQ2lyY2xlKCkge1xuICAgICAqICAgU2hhcGUuY2FsbCh0aGlzKTtcbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBDaXJjbGUucHJvdG90eXBlID0gXy5jcmVhdGUoU2hhcGUucHJvdG90eXBlLCB7ICdjb25zdHJ1Y3Rvcic6IENpcmNsZSB9KTtcbiAgICAgKlxuICAgICAqIHZhciBjaXJjbGUgPSBuZXcgQ2lyY2xlO1xuICAgICAqIGNpcmNsZSBpbnN0YW5jZW9mIENpcmNsZTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBjaXJjbGUgaW5zdGFuY2VvZiBTaGFwZTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICovXG4gICAgZnVuY3Rpb24gY3JlYXRlKHByb3RvdHlwZSwgcHJvcGVydGllcykge1xuICAgICAgdmFyIHJlc3VsdCA9IGJhc2VDcmVhdGUocHJvdG90eXBlKTtcbiAgICAgIHJldHVybiBwcm9wZXJ0aWVzID8gYXNzaWduKHJlc3VsdCwgcHJvcGVydGllcykgOiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXNzaWducyBvd24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIHNvdXJjZSBvYmplY3QocykgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICogb2JqZWN0IGZvciBhbGwgZGVzdGluYXRpb24gcHJvcGVydGllcyB0aGF0IHJlc29sdmUgdG8gYHVuZGVmaW5lZGAuIE9uY2UgYVxuICAgICAqIHByb3BlcnR5IGlzIHNldCwgYWRkaXRpb25hbCBkZWZhdWx0cyBvZiB0aGUgc2FtZSBwcm9wZXJ0eSB3aWxsIGJlIGlnbm9yZWQuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAdHlwZSBGdW5jdGlvblxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7Li4uT2JqZWN0fSBbc291cmNlXSBUaGUgc291cmNlIG9iamVjdHMuXG4gICAgICogQHBhcmFtLSB7T2JqZWN0fSBbZ3VhcmRdIEFsbG93cyB3b3JraW5nIHdpdGggYF8ucmVkdWNlYCB3aXRob3V0IHVzaW5nIGl0c1xuICAgICAqICBga2V5YCBhbmQgYG9iamVjdGAgYXJndW1lbnRzIGFzIHNvdXJjZXMuXG4gICAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgb2JqZWN0ID0geyAnbmFtZSc6ICdiYXJuZXknIH07XG4gICAgICogXy5kZWZhdWx0cyhvYmplY3QsIHsgJ25hbWUnOiAnZnJlZCcsICdlbXBsb3llcic6ICdzbGF0ZScgfSk7XG4gICAgICogLy8gPT4geyAnbmFtZSc6ICdiYXJuZXknLCAnZW1wbG95ZXInOiAnc2xhdGUnIH1cbiAgICAgKi9cbiAgICB2YXIgZGVmYXVsdHMgPSBmdW5jdGlvbihvYmplY3QsIHNvdXJjZSwgZ3VhcmQpIHtcbiAgICAgIHZhciBpbmRleCwgaXRlcmFibGUgPSBvYmplY3QsIHJlc3VsdCA9IGl0ZXJhYmxlO1xuICAgICAgaWYgKCFpdGVyYWJsZSkgcmV0dXJuIHJlc3VsdDtcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzLFxuICAgICAgICAgIGFyZ3NJbmRleCA9IDAsXG4gICAgICAgICAgYXJnc0xlbmd0aCA9IHR5cGVvZiBndWFyZCA9PSAnbnVtYmVyJyA/IDIgOiBhcmdzLmxlbmd0aDtcbiAgICAgIHdoaWxlICgrK2FyZ3NJbmRleCA8IGFyZ3NMZW5ndGgpIHtcbiAgICAgICAgaXRlcmFibGUgPSBhcmdzW2FyZ3NJbmRleF07XG4gICAgICAgIGlmIChpdGVyYWJsZSAmJiBvYmplY3RUeXBlc1t0eXBlb2YgaXRlcmFibGVdKSB7XG4gICAgICAgIHZhciBvd25JbmRleCA9IC0xLFxuICAgICAgICAgICAgb3duUHJvcHMgPSBvYmplY3RUeXBlc1t0eXBlb2YgaXRlcmFibGVdICYmIGtleXMoaXRlcmFibGUpLFxuICAgICAgICAgICAgbGVuZ3RoID0gb3duUHJvcHMgPyBvd25Qcm9wcy5sZW5ndGggOiAwO1xuXG4gICAgICAgIHdoaWxlICgrK293bkluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgaW5kZXggPSBvd25Qcm9wc1tvd25JbmRleF07XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHRbaW5kZXhdID09ICd1bmRlZmluZWQnKSByZXN1bHRbaW5kZXhdID0gaXRlcmFibGVbaW5kZXhdO1xuICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgaXMgbGlrZSBgXy5maW5kSW5kZXhgIGV4Y2VwdCB0aGF0IGl0IHJldHVybnMgdGhlIGtleSBvZiB0aGVcbiAgICAgKiBmaXJzdCBlbGVtZW50IHRoYXQgcGFzc2VzIHRoZSBjYWxsYmFjayBjaGVjaywgaW5zdGVhZCBvZiB0aGUgZWxlbWVudCBpdHNlbGYuXG4gICAgICpcbiAgICAgKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLnBsdWNrXCIgc3R5bGVcbiAgICAgKiBjYWxsYmFjayB3aWxsIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tcbiAgICAgKiB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LFxuICAgICAqIGVsc2UgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHNlYXJjaC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXJcbiAgICAgKiAgaXRlcmF0aW9uLiBJZiBhIHByb3BlcnR5IG5hbWUgb3Igb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZCB0b1xuICAgICAqICBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd8dW5kZWZpbmVkfSBSZXR1cm5zIHRoZSBrZXkgb2YgdGhlIGZvdW5kIGVsZW1lbnQsIGVsc2UgYHVuZGVmaW5lZGAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBjaGFyYWN0ZXJzID0ge1xuICAgICAqICAgJ2Jhcm5leSc6IHsgICdhZ2UnOiAzNiwgJ2Jsb2NrZWQnOiBmYWxzZSB9LFxuICAgICAqICAgJ2ZyZWQnOiB7ICAgICdhZ2UnOiA0MCwgJ2Jsb2NrZWQnOiB0cnVlIH0sXG4gICAgICogICAncGViYmxlcyc6IHsgJ2FnZSc6IDEsICAnYmxvY2tlZCc6IGZhbHNlIH1cbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogXy5maW5kS2V5KGNoYXJhY3RlcnMsIGZ1bmN0aW9uKGNocikge1xuICAgICAqICAgcmV0dXJuIGNoci5hZ2UgPCA0MDtcbiAgICAgKiB9KTtcbiAgICAgKiAvLyA9PiAnYmFybmV5JyAocHJvcGVydHkgb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQgYWNyb3NzIGVudmlyb25tZW50cylcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy53aGVyZVwiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8uZmluZEtleShjaGFyYWN0ZXJzLCB7ICdhZ2UnOiAxIH0pO1xuICAgICAqIC8vID0+ICdwZWJibGVzJ1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLnBsdWNrXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5maW5kS2V5KGNoYXJhY3RlcnMsICdibG9ja2VkJyk7XG4gICAgICogLy8gPT4gJ2ZyZWQnXG4gICAgICovXG4gICAgZnVuY3Rpb24gZmluZEtleShvYmplY3QsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICB2YXIgcmVzdWx0O1xuICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgZm9yT3duKG9iamVjdCwgZnVuY3Rpb24odmFsdWUsIGtleSwgb2JqZWN0KSB7XG4gICAgICAgIGlmIChjYWxsYmFjayh2YWx1ZSwga2V5LCBvYmplY3QpKSB7XG4gICAgICAgICAgcmVzdWx0ID0ga2V5O1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGxpa2UgYF8uZmluZEtleWAgZXhjZXB0IHRoYXQgaXQgaXRlcmF0ZXMgb3ZlciBlbGVtZW50c1xuICAgICAqIG9mIGEgYGNvbGxlY3Rpb25gIGluIHRoZSBvcHBvc2l0ZSBvcmRlci5cbiAgICAgKlxuICAgICAqIElmIGEgcHJvcGVydHkgbmFtZSBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ucGx1Y2tcIiBzdHlsZVxuICAgICAqIGNhbGxiYWNrIHdpbGwgcmV0dXJuIHRoZSBwcm9wZXJ0eSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICAgKlxuICAgICAqIElmIGFuIG9iamVjdCBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFja1xuICAgICAqIHdpbGwgcmV0dXJuIGB0cnVlYCBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBnaXZlbiBvYmplY3QsXG4gICAgICogZWxzZSBgZmFsc2VgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gc2VhcmNoLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlclxuICAgICAqICBpdGVyYXRpb24uIElmIGEgcHJvcGVydHkgbmFtZSBvciBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkIHRvXG4gICAgICogIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge3N0cmluZ3x1bmRlZmluZWR9IFJldHVybnMgdGhlIGtleSBvZiB0aGUgZm91bmQgZWxlbWVudCwgZWxzZSBgdW5kZWZpbmVkYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSB7XG4gICAgICogICAnYmFybmV5JzogeyAgJ2FnZSc6IDM2LCAnYmxvY2tlZCc6IHRydWUgfSxcbiAgICAgKiAgICdmcmVkJzogeyAgICAnYWdlJzogNDAsICdibG9ja2VkJzogZmFsc2UgfSxcbiAgICAgKiAgICdwZWJibGVzJzogeyAnYWdlJzogMSwgICdibG9ja2VkJzogdHJ1ZSB9XG4gICAgICogfTtcbiAgICAgKlxuICAgICAqIF8uZmluZExhc3RLZXkoY2hhcmFjdGVycywgZnVuY3Rpb24oY2hyKSB7XG4gICAgICogICByZXR1cm4gY2hyLmFnZSA8IDQwO1xuICAgICAqIH0pO1xuICAgICAqIC8vID0+IHJldHVybnMgYHBlYmJsZXNgLCBhc3N1bWluZyBgXy5maW5kS2V5YCByZXR1cm5zIGBiYXJuZXlgXG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ud2hlcmVcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLmZpbmRMYXN0S2V5KGNoYXJhY3RlcnMsIHsgJ2FnZSc6IDQwIH0pO1xuICAgICAqIC8vID0+ICdmcmVkJ1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLnBsdWNrXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5maW5kTGFzdEtleShjaGFyYWN0ZXJzLCAnYmxvY2tlZCcpO1xuICAgICAqIC8vID0+ICdwZWJibGVzJ1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZpbmRMYXN0S2V5KG9iamVjdCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciByZXN1bHQ7XG4gICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG4gICAgICBmb3JPd25SaWdodChvYmplY3QsIGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iamVjdCkge1xuICAgICAgICBpZiAoY2FsbGJhY2sodmFsdWUsIGtleSwgb2JqZWN0KSkge1xuICAgICAgICAgIHJlc3VsdCA9IGtleTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJdGVyYXRlcyBvdmVyIG93biBhbmQgaW5oZXJpdGVkIGVudW1lcmFibGUgcHJvcGVydGllcyBvZiBhbiBvYmplY3QsXG4gICAgICogZXhlY3V0aW5nIHRoZSBjYWxsYmFjayBmb3IgZWFjaCBwcm9wZXJ0eS4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYFxuICAgICAqIGFuZCBpbnZva2VkIHdpdGggdGhyZWUgYXJndW1lbnRzOyAodmFsdWUsIGtleSwgb2JqZWN0KS4gQ2FsbGJhY2tzIG1heSBleGl0XG4gICAgICogaXRlcmF0aW9uIGVhcmx5IGJ5IGV4cGxpY2l0bHkgcmV0dXJuaW5nIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAdHlwZSBGdW5jdGlvblxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGBvYmplY3RgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBmdW5jdGlvbiBTaGFwZSgpIHtcbiAgICAgKiAgIHRoaXMueCA9IDA7XG4gICAgICogICB0aGlzLnkgPSAwO1xuICAgICAqIH1cbiAgICAgKlxuICAgICAqIFNoYXBlLnByb3RvdHlwZS5tb3ZlID0gZnVuY3Rpb24oeCwgeSkge1xuICAgICAqICAgdGhpcy54ICs9IHg7XG4gICAgICogICB0aGlzLnkgKz0geTtcbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogXy5mb3JJbihuZXcgU2hhcGUsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgKiAgIGNvbnNvbGUubG9nKGtleSk7XG4gICAgICogfSk7XG4gICAgICogLy8gPT4gbG9ncyAneCcsICd5JywgYW5kICdtb3ZlJyAocHJvcGVydHkgb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQgYWNyb3NzIGVudmlyb25tZW50cylcbiAgICAgKi9cbiAgICB2YXIgZm9ySW4gPSBmdW5jdGlvbihjb2xsZWN0aW9uLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIGluZGV4LCBpdGVyYWJsZSA9IGNvbGxlY3Rpb24sIHJlc3VsdCA9IGl0ZXJhYmxlO1xuICAgICAgaWYgKCFpdGVyYWJsZSkgcmV0dXJuIHJlc3VsdDtcbiAgICAgIGlmICghb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSkgcmV0dXJuIHJlc3VsdDtcbiAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgJiYgdHlwZW9mIHRoaXNBcmcgPT0gJ3VuZGVmaW5lZCcgPyBjYWxsYmFjayA6IGJhc2VDcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG4gICAgICAgIGZvciAoaW5kZXggaW4gaXRlcmFibGUpIHtcbiAgICAgICAgICBpZiAoY2FsbGJhY2soaXRlcmFibGVbaW5kZXhdLCBpbmRleCwgY29sbGVjdGlvbikgPT09IGZhbHNlKSByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGxpa2UgYF8uZm9ySW5gIGV4Y2VwdCB0aGF0IGl0IGl0ZXJhdGVzIG92ZXIgZWxlbWVudHNcbiAgICAgKiBvZiBhIGBjb2xsZWN0aW9uYCBpbiB0aGUgb3Bwb3NpdGUgb3JkZXIuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogZnVuY3Rpb24gU2hhcGUoKSB7XG4gICAgICogICB0aGlzLnggPSAwO1xuICAgICAqICAgdGhpcy55ID0gMDtcbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBTaGFwZS5wcm90b3R5cGUubW92ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgKiAgIHRoaXMueCArPSB4O1xuICAgICAqICAgdGhpcy55ICs9IHk7XG4gICAgICogfTtcbiAgICAgKlxuICAgICAqIF8uZm9ySW5SaWdodChuZXcgU2hhcGUsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgKiAgIGNvbnNvbGUubG9nKGtleSk7XG4gICAgICogfSk7XG4gICAgICogLy8gPT4gbG9ncyAnbW92ZScsICd5JywgYW5kICd4JyBhc3N1bWluZyBgXy5mb3JJbiBgIGxvZ3MgJ3gnLCAneScsIGFuZCAnbW92ZSdcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBmb3JJblJpZ2h0KG9iamVjdCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciBwYWlycyA9IFtdO1xuXG4gICAgICBmb3JJbihvYmplY3QsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgcGFpcnMucHVzaChrZXksIHZhbHVlKTtcbiAgICAgIH0pO1xuXG4gICAgICB2YXIgbGVuZ3RoID0gcGFpcnMubGVuZ3RoO1xuICAgICAgY2FsbGJhY2sgPSBiYXNlQ3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgIGlmIChjYWxsYmFjayhwYWlyc1tsZW5ndGgtLV0sIHBhaXJzW2xlbmd0aF0sIG9iamVjdCkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSXRlcmF0ZXMgb3ZlciBvd24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIGFuIG9iamVjdCwgZXhlY3V0aW5nIHRoZSBjYWxsYmFja1xuICAgICAqIGZvciBlYWNoIHByb3BlcnR5LiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkIHdpdGggdGhyZWVcbiAgICAgKiBhcmd1bWVudHM7ICh2YWx1ZSwga2V5LCBvYmplY3QpLiBDYWxsYmFja3MgbWF5IGV4aXQgaXRlcmF0aW9uIGVhcmx5IGJ5XG4gICAgICogZXhwbGljaXRseSByZXR1cm5pbmcgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEB0eXBlIEZ1bmN0aW9uXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uZm9yT3duKHsgJzAnOiAnemVybycsICcxJzogJ29uZScsICdsZW5ndGgnOiAyIH0sIGZ1bmN0aW9uKG51bSwga2V5KSB7XG4gICAgICogICBjb25zb2xlLmxvZyhrZXkpO1xuICAgICAqIH0pO1xuICAgICAqIC8vID0+IGxvZ3MgJzAnLCAnMScsIGFuZCAnbGVuZ3RoJyAocHJvcGVydHkgb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQgYWNyb3NzIGVudmlyb25tZW50cylcbiAgICAgKi9cbiAgICB2YXIgZm9yT3duID0gZnVuY3Rpb24oY29sbGVjdGlvbiwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciBpbmRleCwgaXRlcmFibGUgPSBjb2xsZWN0aW9uLCByZXN1bHQgPSBpdGVyYWJsZTtcbiAgICAgIGlmICghaXRlcmFibGUpIHJldHVybiByZXN1bHQ7XG4gICAgICBpZiAoIW9iamVjdFR5cGVzW3R5cGVvZiBpdGVyYWJsZV0pIHJldHVybiByZXN1bHQ7XG4gICAgICBjYWxsYmFjayA9IGNhbGxiYWNrICYmIHR5cGVvZiB0aGlzQXJnID09ICd1bmRlZmluZWQnID8gY2FsbGJhY2sgOiBiYXNlQ3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgICB2YXIgb3duSW5kZXggPSAtMSxcbiAgICAgICAgICAgIG93blByb3BzID0gb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSAmJiBrZXlzKGl0ZXJhYmxlKSxcbiAgICAgICAgICAgIGxlbmd0aCA9IG93blByb3BzID8gb3duUHJvcHMubGVuZ3RoIDogMDtcblxuICAgICAgICB3aGlsZSAoKytvd25JbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIGluZGV4ID0gb3duUHJvcHNbb3duSW5kZXhdO1xuICAgICAgICAgIGlmIChjYWxsYmFjayhpdGVyYWJsZVtpbmRleF0sIGluZGV4LCBjb2xsZWN0aW9uKSA9PT0gZmFsc2UpIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgaXMgbGlrZSBgXy5mb3JPd25gIGV4Y2VwdCB0aGF0IGl0IGl0ZXJhdGVzIG92ZXIgZWxlbWVudHNcbiAgICAgKiBvZiBhIGBjb2xsZWN0aW9uYCBpbiB0aGUgb3Bwb3NpdGUgb3JkZXIuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5mb3JPd25SaWdodCh7ICcwJzogJ3plcm8nLCAnMSc6ICdvbmUnLCAnbGVuZ3RoJzogMiB9LCBmdW5jdGlvbihudW0sIGtleSkge1xuICAgICAqICAgY29uc29sZS5sb2coa2V5KTtcbiAgICAgKiB9KTtcbiAgICAgKiAvLyA9PiBsb2dzICdsZW5ndGgnLCAnMScsIGFuZCAnMCcgYXNzdW1pbmcgYF8uZm9yT3duYCBsb2dzICcwJywgJzEnLCBhbmQgJ2xlbmd0aCdcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBmb3JPd25SaWdodChvYmplY3QsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICB2YXIgcHJvcHMgPSBrZXlzKG9iamVjdCksXG4gICAgICAgICAgbGVuZ3RoID0gcHJvcHMubGVuZ3RoO1xuXG4gICAgICBjYWxsYmFjayA9IGJhc2VDcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG4gICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgdmFyIGtleSA9IHByb3BzW2xlbmd0aF07XG4gICAgICAgIGlmIChjYWxsYmFjayhvYmplY3Rba2V5XSwga2V5LCBvYmplY3QpID09PSBmYWxzZSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gb2JqZWN0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBzb3J0ZWQgYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMgb2YgYWxsIGVudW1lcmFibGUgcHJvcGVydGllcyxcbiAgICAgKiBvd24gYW5kIGluaGVyaXRlZCwgb2YgYG9iamVjdGAgdGhhdCBoYXZlIGZ1bmN0aW9uIHZhbHVlcy5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBhbGlhcyBtZXRob2RzXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYW4gYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMgdGhhdCBoYXZlIGZ1bmN0aW9uIHZhbHVlcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5mdW5jdGlvbnMoXyk7XG4gICAgICogLy8gPT4gWydhbGwnLCAnYW55JywgJ2JpbmQnLCAnYmluZEFsbCcsICdjbG9uZScsICdjb21wYWN0JywgJ2NvbXBvc2UnLCAuLi5dXG4gICAgICovXG4gICAgZnVuY3Rpb24gZnVuY3Rpb25zKG9iamVjdCkge1xuICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgZm9ySW4ob2JqZWN0LCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKGtleSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdC5zb3J0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIHRoZSBzcGVjaWZpZWQgcHJvcGVydHkgbmFtZSBleGlzdHMgYXMgYSBkaXJlY3QgcHJvcGVydHkgb2YgYG9iamVjdGAsXG4gICAgICogaW5zdGVhZCBvZiBhbiBpbmhlcml0ZWQgcHJvcGVydHkuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpbnNwZWN0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBrZXkgaXMgYSBkaXJlY3QgcHJvcGVydHksIGVsc2UgYGZhbHNlYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5oYXMoeyAnYSc6IDEsICdiJzogMiwgJ2MnOiAzIH0sICdiJyk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGhhcyhvYmplY3QsIGtleSkge1xuICAgICAgcmV0dXJuIG9iamVjdCA/IGhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpIDogZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBvYmplY3QgY29tcG9zZWQgb2YgdGhlIGludmVydGVkIGtleXMgYW5kIHZhbHVlcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW52ZXJ0LlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIGNyZWF0ZWQgaW52ZXJ0ZWQgb2JqZWN0LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmludmVydCh7ICdmaXJzdCc6ICdmcmVkJywgJ3NlY29uZCc6ICdiYXJuZXknIH0pO1xuICAgICAqIC8vID0+IHsgJ2ZyZWQnOiAnZmlyc3QnLCAnYmFybmV5JzogJ3NlY29uZCcgfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGludmVydChvYmplY3QpIHtcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIHByb3BzID0ga2V5cyhvYmplY3QpLFxuICAgICAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aCxcbiAgICAgICAgICByZXN1bHQgPSB7fTtcblxuICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgdmFyIGtleSA9IHByb3BzW2luZGV4XTtcbiAgICAgICAgcmVzdWx0W29iamVjdFtrZXldXSA9IGtleTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBib29sZWFuIHZhbHVlLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYSBib29sZWFuIHZhbHVlLCBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uaXNCb29sZWFuKG51bGwpO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNCb29sZWFuKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IGZhbHNlIHx8XG4gICAgICAgIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyAmJiB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PSBib29sQ2xhc3MgfHwgZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBkYXRlLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYSBkYXRlLCBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uaXNEYXRlKG5ldyBEYXRlKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNEYXRlKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnICYmIHRvU3RyaW5nLmNhbGwodmFsdWUpID09IGRhdGVDbGFzcyB8fCBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIERPTSBlbGVtZW50LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYSBET00gZWxlbWVudCwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmlzRWxlbWVudChkb2N1bWVudC5ib2R5KTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNFbGVtZW50KHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgJiYgdmFsdWUubm9kZVR5cGUgPT09IDEgfHwgZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgZW1wdHkuIEFycmF5cywgc3RyaW5ncywgb3IgYGFyZ3VtZW50c2Agb2JqZWN0cyB3aXRoIGFcbiAgICAgKiBsZW5ndGggb2YgYDBgIGFuZCBvYmplY3RzIHdpdGggbm8gb3duIGVudW1lcmFibGUgcHJvcGVydGllcyBhcmUgY29uc2lkZXJlZFxuICAgICAqIFwiZW1wdHlcIi5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSB2YWx1ZSBUaGUgdmFsdWUgdG8gaW5zcGVjdC5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgZW1wdHksIGVsc2UgYGZhbHNlYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5pc0VtcHR5KFsxLCAyLCAzXSk7XG4gICAgICogLy8gPT4gZmFsc2VcbiAgICAgKlxuICAgICAqIF8uaXNFbXB0eSh7fSk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogXy5pc0VtcHR5KCcnKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNFbXB0eSh2YWx1ZSkge1xuICAgICAgdmFyIHJlc3VsdCA9IHRydWU7XG4gICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgICB2YXIgY2xhc3NOYW1lID0gdG9TdHJpbmcuY2FsbCh2YWx1ZSksXG4gICAgICAgICAgbGVuZ3RoID0gdmFsdWUubGVuZ3RoO1xuXG4gICAgICBpZiAoKGNsYXNzTmFtZSA9PSBhcnJheUNsYXNzIHx8IGNsYXNzTmFtZSA9PSBzdHJpbmdDbGFzcyB8fCBjbGFzc05hbWUgPT0gYXJnc0NsYXNzICkgfHxcbiAgICAgICAgICAoY2xhc3NOYW1lID09IG9iamVjdENsYXNzICYmIHR5cGVvZiBsZW5ndGggPT0gJ251bWJlcicgJiYgaXNGdW5jdGlvbih2YWx1ZS5zcGxpY2UpKSkge1xuICAgICAgICByZXR1cm4gIWxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGZvck93bih2YWx1ZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAocmVzdWx0ID0gZmFsc2UpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIGEgZGVlcCBjb21wYXJpc29uIGJldHdlZW4gdHdvIHZhbHVlcyB0byBkZXRlcm1pbmUgaWYgdGhleSBhcmVcbiAgICAgKiBlcXVpdmFsZW50IHRvIGVhY2ggb3RoZXIuIElmIGEgY2FsbGJhY2sgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSBleGVjdXRlZFxuICAgICAqIHRvIGNvbXBhcmUgdmFsdWVzLiBJZiB0aGUgY2FsbGJhY2sgcmV0dXJucyBgdW5kZWZpbmVkYCBjb21wYXJpc29ucyB3aWxsXG4gICAgICogYmUgaGFuZGxlZCBieSB0aGUgbWV0aG9kIGluc3RlYWQuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kXG4gICAgICogaW52b2tlZCB3aXRoIHR3byBhcmd1bWVudHM7IChhLCBiKS5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHsqfSBhIFRoZSB2YWx1ZSB0byBjb21wYXJlLlxuICAgICAqIEBwYXJhbSB7Kn0gYiBUaGUgb3RoZXIgdmFsdWUgdG8gY29tcGFyZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaW5nIHZhbHVlcy5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgb2JqZWN0ID0geyAnbmFtZSc6ICdmcmVkJyB9O1xuICAgICAqIHZhciBjb3B5ID0geyAnbmFtZSc6ICdmcmVkJyB9O1xuICAgICAqXG4gICAgICogb2JqZWN0ID09IGNvcHk7XG4gICAgICogLy8gPT4gZmFsc2VcbiAgICAgKlxuICAgICAqIF8uaXNFcXVhbChvYmplY3QsIGNvcHkpO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKlxuICAgICAqIHZhciB3b3JkcyA9IFsnaGVsbG8nLCAnZ29vZGJ5ZSddO1xuICAgICAqIHZhciBvdGhlcldvcmRzID0gWydoaScsICdnb29kYnllJ107XG4gICAgICpcbiAgICAgKiBfLmlzRXF1YWwod29yZHMsIG90aGVyV29yZHMsIGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgKiAgIHZhciByZUdyZWV0ID0gL14oPzpoZWxsb3xoaSkkL2ksXG4gICAgICogICAgICAgYUdyZWV0ID0gXy5pc1N0cmluZyhhKSAmJiByZUdyZWV0LnRlc3QoYSksXG4gICAgICogICAgICAgYkdyZWV0ID0gXy5pc1N0cmluZyhiKSAmJiByZUdyZWV0LnRlc3QoYik7XG4gICAgICpcbiAgICAgKiAgIHJldHVybiAoYUdyZWV0IHx8IGJHcmVldCkgPyAoYUdyZWV0ID09IGJHcmVldCkgOiB1bmRlZmluZWQ7XG4gICAgICogfSk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzRXF1YWwoYSwgYiwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiBiYXNlSXNFcXVhbChhLCBiLCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJyAmJiBiYXNlQ3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDIpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcywgb3IgY2FuIGJlIGNvZXJjZWQgdG8sIGEgZmluaXRlIG51bWJlci5cbiAgICAgKlxuICAgICAqIE5vdGU6IFRoaXMgaXMgbm90IHRoZSBzYW1lIGFzIG5hdGl2ZSBgaXNGaW5pdGVgIHdoaWNoIHdpbGwgcmV0dXJuIHRydWUgZm9yXG4gICAgICogYm9vbGVhbnMgYW5kIGVtcHR5IHN0cmluZ3MuIFNlZSBodHRwOi8vZXM1LmdpdGh1Yi5pby8jeDE1LjEuMi41LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgZmluaXRlLCBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uaXNGaW5pdGUoLTEwMSk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogXy5pc0Zpbml0ZSgnMTAnKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBfLmlzRmluaXRlKHRydWUpO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICpcbiAgICAgKiBfLmlzRmluaXRlKCcnKTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqXG4gICAgICogXy5pc0Zpbml0ZShJbmZpbml0eSk7XG4gICAgICogLy8gPT4gZmFsc2VcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc0Zpbml0ZSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIG5hdGl2ZUlzRmluaXRlKHZhbHVlKSAmJiAhbmF0aXZlSXNOYU4ocGFyc2VGbG9hdCh2YWx1ZSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uaXNGdW5jdGlvbihfKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZSBsYW5ndWFnZSB0eXBlIG9mIE9iamVjdC5cbiAgICAgKiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmlzT2JqZWN0KHt9KTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogXy5pc09iamVjdCgxKTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gICAgICAvLyBjaGVjayBpZiB0aGUgdmFsdWUgaXMgdGhlIEVDTUFTY3JpcHQgbGFuZ3VhZ2UgdHlwZSBvZiBPYmplY3RcbiAgICAgIC8vIGh0dHA6Ly9lczUuZ2l0aHViLmlvLyN4OFxuICAgICAgLy8gYW5kIGF2b2lkIGEgVjggYnVnXG4gICAgICAvLyBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0yMjkxXG4gICAgICByZXR1cm4gISEodmFsdWUgJiYgb2JqZWN0VHlwZXNbdHlwZW9mIHZhbHVlXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYE5hTmAuXG4gICAgICpcbiAgICAgKiBOb3RlOiBUaGlzIGlzIG5vdCB0aGUgc2FtZSBhcyBuYXRpdmUgYGlzTmFOYCB3aGljaCB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yXG4gICAgICogYHVuZGVmaW5lZGAgYW5kIG90aGVyIG5vbi1udW1lcmljIHZhbHVlcy4gU2VlIGh0dHA6Ly9lczUuZ2l0aHViLmlvLyN4MTUuMS4yLjQuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYHZhbHVlYCBpcyBgTmFOYCwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmlzTmFOKE5hTik7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogXy5pc05hTihuZXcgTnVtYmVyKE5hTikpO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKlxuICAgICAqIGlzTmFOKHVuZGVmaW5lZCk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogXy5pc05hTih1bmRlZmluZWQpO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNOYU4odmFsdWUpIHtcbiAgICAgIC8vIGBOYU5gIGFzIGEgcHJpbWl0aXZlIGlzIHRoZSBvbmx5IHZhbHVlIHRoYXQgaXMgbm90IGVxdWFsIHRvIGl0c2VsZlxuICAgICAgLy8gKHBlcmZvcm0gdGhlIFtbQ2xhc3NdXSBjaGVjayBmaXJzdCB0byBhdm9pZCBlcnJvcnMgd2l0aCBzb21lIGhvc3Qgb2JqZWN0cyBpbiBJRSlcbiAgICAgIHJldHVybiBpc051bWJlcih2YWx1ZSkgJiYgdmFsdWUgIT0gK3ZhbHVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGBudWxsYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGBudWxsYCwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmlzTnVsbChudWxsKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBfLmlzTnVsbCh1bmRlZmluZWQpO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNOdWxsKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBudW1iZXIuXG4gICAgICpcbiAgICAgKiBOb3RlOiBgTmFOYCBpcyBjb25zaWRlcmVkIGEgbnVtYmVyLiBTZWUgaHR0cDovL2VzNS5naXRodWIuaW8vI3g4LjUuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYHZhbHVlYCBpcyBhIG51bWJlciwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmlzTnVtYmVyKDguNCAqIDUpO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc051bWJlcih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJyB8fFxuICAgICAgICB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcgJiYgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gbnVtYmVyQ2xhc3MgfHwgZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0IGNyZWF0ZWQgYnkgdGhlIGBPYmplY3RgIGNvbnN0cnVjdG9yLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHBsYWluIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBmdW5jdGlvbiBTaGFwZSgpIHtcbiAgICAgKiAgIHRoaXMueCA9IDA7XG4gICAgICogICB0aGlzLnkgPSAwO1xuICAgICAqIH1cbiAgICAgKlxuICAgICAqIF8uaXNQbGFpbk9iamVjdChuZXcgU2hhcGUpO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICpcbiAgICAgKiBfLmlzUGxhaW5PYmplY3QoWzEsIDIsIDNdKTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqXG4gICAgICogXy5pc1BsYWluT2JqZWN0KHsgJ3gnOiAwLCAneSc6IDAgfSk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqL1xuICAgIHZhciBpc1BsYWluT2JqZWN0ID0gIWdldFByb3RvdHlwZU9mID8gc2hpbUlzUGxhaW5PYmplY3QgOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKCEodmFsdWUgJiYgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gb2JqZWN0Q2xhc3MpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHZhciB2YWx1ZU9mID0gdmFsdWUudmFsdWVPZixcbiAgICAgICAgICBvYmpQcm90byA9IGlzTmF0aXZlKHZhbHVlT2YpICYmIChvYmpQcm90byA9IGdldFByb3RvdHlwZU9mKHZhbHVlT2YpKSAmJiBnZXRQcm90b3R5cGVPZihvYmpQcm90byk7XG5cbiAgICAgIHJldHVybiBvYmpQcm90b1xuICAgICAgICA/ICh2YWx1ZSA9PSBvYmpQcm90byB8fCBnZXRQcm90b3R5cGVPZih2YWx1ZSkgPT0gb2JqUHJvdG8pXG4gICAgICAgIDogc2hpbUlzUGxhaW5PYmplY3QodmFsdWUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGEgcmVndWxhciBleHByZXNzaW9uLCBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uaXNSZWdFeHAoL2ZyZWQvKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNSZWdFeHAodmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcgJiYgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gcmVnZXhwQ2xhc3MgfHwgZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBzdHJpbmcuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYHZhbHVlYCBpcyBhIHN0cmluZywgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmlzU3RyaW5nKCdmcmVkJyk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzU3RyaW5nKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdzdHJpbmcnIHx8XG4gICAgICAgIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyAmJiB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PSBzdHJpbmdDbGFzcyB8fCBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBgdW5kZWZpbmVkYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGB1bmRlZmluZWRgLCBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uaXNVbmRlZmluZWQodm9pZCAwKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNVbmRlZmluZWQodmFsdWUpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ3VuZGVmaW5lZCc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBvYmplY3Qgd2l0aCB0aGUgc2FtZSBrZXlzIGFzIGBvYmplY3RgIGFuZCB2YWx1ZXMgZ2VuZXJhdGVkIGJ5XG4gICAgICogcnVubmluZyBlYWNoIG93biBlbnVtZXJhYmxlIHByb3BlcnR5IG9mIGBvYmplY3RgIHRocm91Z2ggdGhlIGNhbGxiYWNrLlxuICAgICAqIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM7XG4gICAgICogKHZhbHVlLCBrZXksIG9iamVjdCkuXG4gICAgICpcbiAgICAgKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLnBsdWNrXCIgc3R5bGVcbiAgICAgKiBjYWxsYmFjayB3aWxsIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tcbiAgICAgKiB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LFxuICAgICAqIGVsc2UgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZFxuICAgICAqICBwZXIgaXRlcmF0aW9uLiBJZiBhIHByb3BlcnR5IG5hbWUgb3Igb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZFxuICAgICAqICB0byBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhIG5ldyBvYmplY3Qgd2l0aCB2YWx1ZXMgb2YgdGhlIHJlc3VsdHMgb2YgZWFjaCBgY2FsbGJhY2tgIGV4ZWN1dGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5tYXBWYWx1ZXMoeyAnYSc6IDEsICdiJzogMiwgJ2MnOiAzfSAsIGZ1bmN0aW9uKG51bSkgeyByZXR1cm4gbnVtICogMzsgfSk7XG4gICAgICogLy8gPT4geyAnYSc6IDMsICdiJzogNiwgJ2MnOiA5IH1cbiAgICAgKlxuICAgICAqIHZhciBjaGFyYWN0ZXJzID0ge1xuICAgICAqICAgJ2ZyZWQnOiB7ICduYW1lJzogJ2ZyZWQnLCAnYWdlJzogNDAgfSxcbiAgICAgKiAgICdwZWJibGVzJzogeyAnbmFtZSc6ICdwZWJibGVzJywgJ2FnZSc6IDEgfVxuICAgICAqIH07XG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ucGx1Y2tcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLm1hcFZhbHVlcyhjaGFyYWN0ZXJzLCAnYWdlJyk7XG4gICAgICogLy8gPT4geyAnZnJlZCc6IDQwLCAncGViYmxlcyc6IDEgfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG1hcFZhbHVlcyhvYmplY3QsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG5cbiAgICAgIGZvck93bihvYmplY3QsIGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iamVjdCkge1xuICAgICAgICByZXN1bHRba2V5XSA9IGNhbGxiYWNrKHZhbHVlLCBrZXksIG9iamVjdCk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVjdXJzaXZlbHkgbWVyZ2VzIG93biBlbnVtZXJhYmxlIHByb3BlcnRpZXMgb2YgdGhlIHNvdXJjZSBvYmplY3QocyksIHRoYXRcbiAgICAgKiBkb24ndCByZXNvbHZlIHRvIGB1bmRlZmluZWRgIGludG8gdGhlIGRlc3RpbmF0aW9uIG9iamVjdC4gU3Vic2VxdWVudCBzb3VyY2VzXG4gICAgICogd2lsbCBvdmVyd3JpdGUgcHJvcGVydHkgYXNzaWdubWVudHMgb2YgcHJldmlvdXMgc291cmNlcy4gSWYgYSBjYWxsYmFjayBpc1xuICAgICAqIHByb3ZpZGVkIGl0IHdpbGwgYmUgZXhlY3V0ZWQgdG8gcHJvZHVjZSB0aGUgbWVyZ2VkIHZhbHVlcyBvZiB0aGUgZGVzdGluYXRpb25cbiAgICAgKiBhbmQgc291cmNlIHByb3BlcnRpZXMuIElmIHRoZSBjYWxsYmFjayByZXR1cm5zIGB1bmRlZmluZWRgIG1lcmdpbmcgd2lsbFxuICAgICAqIGJlIGhhbmRsZWQgYnkgdGhlIG1ldGhvZCBpbnN0ZWFkLiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZFxuICAgICAqIGludm9rZWQgd2l0aCB0d28gYXJndW1lbnRzOyAob2JqZWN0VmFsdWUsIHNvdXJjZVZhbHVlKS5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7Li4uT2JqZWN0fSBbc291cmNlXSBUaGUgc291cmNlIG9iamVjdHMuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIG1lcmdpbmcgcHJvcGVydGllcy5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBuYW1lcyA9IHtcbiAgICAgKiAgICdjaGFyYWN0ZXJzJzogW1xuICAgICAqICAgICB7ICduYW1lJzogJ2Jhcm5leScgfSxcbiAgICAgKiAgICAgeyAnbmFtZSc6ICdmcmVkJyB9XG4gICAgICogICBdXG4gICAgICogfTtcbiAgICAgKlxuICAgICAqIHZhciBhZ2VzID0ge1xuICAgICAqICAgJ2NoYXJhY3RlcnMnOiBbXG4gICAgICogICAgIHsgJ2FnZSc6IDM2IH0sXG4gICAgICogICAgIHsgJ2FnZSc6IDQwIH1cbiAgICAgKiAgIF1cbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogXy5tZXJnZShuYW1lcywgYWdlcyk7XG4gICAgICogLy8gPT4geyAnY2hhcmFjdGVycyc6IFt7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiB9LCB7ICduYW1lJzogJ2ZyZWQnLCAnYWdlJzogNDAgfV0gfVxuICAgICAqXG4gICAgICogdmFyIGZvb2QgPSB7XG4gICAgICogICAnZnJ1aXRzJzogWydhcHBsZSddLFxuICAgICAqICAgJ3ZlZ2V0YWJsZXMnOiBbJ2JlZXQnXVxuICAgICAqIH07XG4gICAgICpcbiAgICAgKiB2YXIgb3RoZXJGb29kID0ge1xuICAgICAqICAgJ2ZydWl0cyc6IFsnYmFuYW5hJ10sXG4gICAgICogICAndmVnZXRhYmxlcyc6IFsnY2Fycm90J11cbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogXy5tZXJnZShmb29kLCBvdGhlckZvb2QsIGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgKiAgIHJldHVybiBfLmlzQXJyYXkoYSkgPyBhLmNvbmNhdChiKSA6IHVuZGVmaW5lZDtcbiAgICAgKiB9KTtcbiAgICAgKiAvLyA9PiB7ICdmcnVpdHMnOiBbJ2FwcGxlJywgJ2JhbmFuYSddLCAndmVnZXRhYmxlcyc6IFsnYmVldCcsICdjYXJyb3RdIH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBtZXJnZShvYmplY3QpIHtcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzLFxuICAgICAgICAgIGxlbmd0aCA9IDI7XG5cbiAgICAgIGlmICghaXNPYmplY3Qob2JqZWN0KSkge1xuICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgICAgfVxuICAgICAgLy8gYWxsb3dzIHdvcmtpbmcgd2l0aCBgXy5yZWR1Y2VgIGFuZCBgXy5yZWR1Y2VSaWdodGAgd2l0aG91dCB1c2luZ1xuICAgICAgLy8gdGhlaXIgYGluZGV4YCBhbmQgYGNvbGxlY3Rpb25gIGFyZ3VtZW50c1xuICAgICAgaWYgKHR5cGVvZiBhcmdzWzJdICE9ICdudW1iZXInKSB7XG4gICAgICAgIGxlbmd0aCA9IGFyZ3MubGVuZ3RoO1xuICAgICAgfVxuICAgICAgaWYgKGxlbmd0aCA+IDMgJiYgdHlwZW9mIGFyZ3NbbGVuZ3RoIC0gMl0gPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBiYXNlQ3JlYXRlQ2FsbGJhY2soYXJnc1stLWxlbmd0aCAtIDFdLCBhcmdzW2xlbmd0aC0tXSwgMik7XG4gICAgICB9IGVsc2UgaWYgKGxlbmd0aCA+IDIgJiYgdHlwZW9mIGFyZ3NbbGVuZ3RoIC0gMV0gPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjYWxsYmFjayA9IGFyZ3NbLS1sZW5ndGhdO1xuICAgICAgfVxuICAgICAgdmFyIHNvdXJjZXMgPSBzbGljZShhcmd1bWVudHMsIDEsIGxlbmd0aCksXG4gICAgICAgICAgaW5kZXggPSAtMSxcbiAgICAgICAgICBzdGFja0EgPSBnZXRBcnJheSgpLFxuICAgICAgICAgIHN0YWNrQiA9IGdldEFycmF5KCk7XG5cbiAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIGJhc2VNZXJnZShvYmplY3QsIHNvdXJjZXNbaW5kZXhdLCBjYWxsYmFjaywgc3RhY2tBLCBzdGFja0IpO1xuICAgICAgfVxuICAgICAgcmVsZWFzZUFycmF5KHN0YWNrQSk7XG4gICAgICByZWxlYXNlQXJyYXkoc3RhY2tCKTtcbiAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHNoYWxsb3cgY2xvbmUgb2YgYG9iamVjdGAgZXhjbHVkaW5nIHRoZSBzcGVjaWZpZWQgcHJvcGVydGllcy5cbiAgICAgKiBQcm9wZXJ0eSBuYW1lcyBtYXkgYmUgc3BlY2lmaWVkIGFzIGluZGl2aWR1YWwgYXJndW1lbnRzIG9yIGFzIGFycmF5cyBvZlxuICAgICAqIHByb3BlcnR5IG5hbWVzLiBJZiBhIGNhbGxiYWNrIGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgZXhlY3V0ZWQgZm9yIGVhY2hcbiAgICAgKiBwcm9wZXJ0eSBvZiBgb2JqZWN0YCBvbWl0dGluZyB0aGUgcHJvcGVydGllcyB0aGUgY2FsbGJhY2sgcmV0dXJucyB0cnVleVxuICAgICAqIGZvci4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIHRocmVlIGFyZ3VtZW50cztcbiAgICAgKiAodmFsdWUsIGtleSwgb2JqZWN0KS5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgc291cmNlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufC4uLnN0cmluZ3xzdHJpbmdbXX0gW2NhbGxiYWNrXSBUaGUgcHJvcGVydGllcyB0byBvbWl0IG9yIHRoZVxuICAgICAqICBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGFuIG9iamVjdCB3aXRob3V0IHRoZSBvbWl0dGVkIHByb3BlcnRpZXMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8ub21pdCh7ICduYW1lJzogJ2ZyZWQnLCAnYWdlJzogNDAgfSwgJ2FnZScpO1xuICAgICAqIC8vID0+IHsgJ25hbWUnOiAnZnJlZCcgfVxuICAgICAqXG4gICAgICogXy5vbWl0KHsgJ25hbWUnOiAnZnJlZCcsICdhZ2UnOiA0MCB9LCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAqICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJztcbiAgICAgKiB9KTtcbiAgICAgKiAvLyA9PiB7ICduYW1lJzogJ2ZyZWQnIH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBvbWl0KG9iamVjdCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YXIgcHJvcHMgPSBbXTtcbiAgICAgICAgZm9ySW4ob2JqZWN0LCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgICAgcHJvcHMucHVzaChrZXkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcHJvcHMgPSBiYXNlRGlmZmVyZW5jZShwcm9wcywgYmFzZUZsYXR0ZW4oYXJndW1lbnRzLCB0cnVlLCBmYWxzZSwgMSkpO1xuXG4gICAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgICAgbGVuZ3RoID0gcHJvcHMubGVuZ3RoO1xuXG4gICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgdmFyIGtleSA9IHByb3BzW2luZGV4XTtcbiAgICAgICAgICByZXN1bHRba2V5XSA9IG9iamVjdFtrZXldO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG4gICAgICAgIGZvckluKG9iamVjdCwgZnVuY3Rpb24odmFsdWUsIGtleSwgb2JqZWN0KSB7XG4gICAgICAgICAgaWYgKCFjYWxsYmFjayh2YWx1ZSwga2V5LCBvYmplY3QpKSB7XG4gICAgICAgICAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSB0d28gZGltZW5zaW9uYWwgYXJyYXkgb2YgYW4gb2JqZWN0J3Mga2V5LXZhbHVlIHBhaXJzLFxuICAgICAqIGkuZS4gYFtba2V5MSwgdmFsdWUxXSwgW2tleTIsIHZhbHVlMl1dYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGluc3BlY3QuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIG5ldyBhcnJheSBvZiBrZXktdmFsdWUgcGFpcnMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8ucGFpcnMoeyAnYmFybmV5JzogMzYsICdmcmVkJzogNDAgfSk7XG4gICAgICogLy8gPT4gW1snYmFybmV5JywgMzZdLCBbJ2ZyZWQnLCA0MF1dIChwcm9wZXJ0eSBvcmRlciBpcyBub3QgZ3VhcmFudGVlZCBhY3Jvc3MgZW52aXJvbm1lbnRzKVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHBhaXJzKG9iamVjdCkge1xuICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgcHJvcHMgPSBrZXlzKG9iamVjdCksXG4gICAgICAgICAgbGVuZ3RoID0gcHJvcHMubGVuZ3RoLFxuICAgICAgICAgIHJlc3VsdCA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIHZhciBrZXkgPSBwcm9wc1tpbmRleF07XG4gICAgICAgIHJlc3VsdFtpbmRleF0gPSBba2V5LCBvYmplY3Rba2V5XV07XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBzaGFsbG93IGNsb25lIG9mIGBvYmplY3RgIGNvbXBvc2VkIG9mIHRoZSBzcGVjaWZpZWQgcHJvcGVydGllcy5cbiAgICAgKiBQcm9wZXJ0eSBuYW1lcyBtYXkgYmUgc3BlY2lmaWVkIGFzIGluZGl2aWR1YWwgYXJndW1lbnRzIG9yIGFzIGFycmF5cyBvZlxuICAgICAqIHByb3BlcnR5IG5hbWVzLiBJZiBhIGNhbGxiYWNrIGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgZXhlY3V0ZWQgZm9yIGVhY2hcbiAgICAgKiBwcm9wZXJ0eSBvZiBgb2JqZWN0YCBwaWNraW5nIHRoZSBwcm9wZXJ0aWVzIHRoZSBjYWxsYmFjayByZXR1cm5zIHRydWV5XG4gICAgICogZm9yLiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkIHdpdGggdGhyZWUgYXJndW1lbnRzO1xuICAgICAqICh2YWx1ZSwga2V5LCBvYmplY3QpLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBzb3VyY2Ugb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258Li4uc3RyaW5nfHN0cmluZ1tdfSBbY2FsbGJhY2tdIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyXG4gICAgICogIGl0ZXJhdGlvbiBvciBwcm9wZXJ0eSBuYW1lcyB0byBwaWNrLCBzcGVjaWZpZWQgYXMgaW5kaXZpZHVhbCBwcm9wZXJ0eVxuICAgICAqICBuYW1lcyBvciBhcnJheXMgb2YgcHJvcGVydHkgbmFtZXMuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBhbiBvYmplY3QgY29tcG9zZWQgb2YgdGhlIHBpY2tlZCBwcm9wZXJ0aWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLnBpY2soeyAnbmFtZSc6ICdmcmVkJywgJ191c2VyaWQnOiAnZnJlZDEnIH0sICduYW1lJyk7XG4gICAgICogLy8gPT4geyAnbmFtZSc6ICdmcmVkJyB9XG4gICAgICpcbiAgICAgKiBfLnBpY2soeyAnbmFtZSc6ICdmcmVkJywgJ191c2VyaWQnOiAnZnJlZDEnIH0sIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgKiAgIHJldHVybiBrZXkuY2hhckF0KDApICE9ICdfJztcbiAgICAgKiB9KTtcbiAgICAgKiAvLyA9PiB7ICduYW1lJzogJ2ZyZWQnIH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBwaWNrKG9iamVjdCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICAgIHByb3BzID0gYmFzZUZsYXR0ZW4oYXJndW1lbnRzLCB0cnVlLCBmYWxzZSwgMSksXG4gICAgICAgICAgICBsZW5ndGggPSBpc09iamVjdChvYmplY3QpID8gcHJvcHMubGVuZ3RoIDogMDtcblxuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIHZhciBrZXkgPSBwcm9wc1tpbmRleF07XG4gICAgICAgICAgaWYgKGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgIHJlc3VsdFtrZXldID0gb2JqZWN0W2tleV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG4gICAgICAgIGZvckluKG9iamVjdCwgZnVuY3Rpb24odmFsdWUsIGtleSwgb2JqZWN0KSB7XG4gICAgICAgICAgaWYgKGNhbGxiYWNrKHZhbHVlLCBrZXksIG9iamVjdCkpIHtcbiAgICAgICAgICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQW4gYWx0ZXJuYXRpdmUgdG8gYF8ucmVkdWNlYCB0aGlzIG1ldGhvZCB0cmFuc2Zvcm1zIGBvYmplY3RgIHRvIGEgbmV3XG4gICAgICogYGFjY3VtdWxhdG9yYCBvYmplY3Qgd2hpY2ggaXMgdGhlIHJlc3VsdCBvZiBydW5uaW5nIGVhY2ggb2YgaXRzIG93blxuICAgICAqIGVudW1lcmFibGUgcHJvcGVydGllcyB0aHJvdWdoIGEgY2FsbGJhY2ssIHdpdGggZWFjaCBjYWxsYmFjayBleGVjdXRpb25cbiAgICAgKiBwb3RlbnRpYWxseSBtdXRhdGluZyB0aGUgYGFjY3VtdWxhdG9yYCBvYmplY3QuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0b1xuICAgICAqIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIGZvdXIgYXJndW1lbnRzOyAoYWNjdW11bGF0b3IsIHZhbHVlLCBrZXksIG9iamVjdCkuXG4gICAgICogQ2FsbGJhY2tzIG1heSBleGl0IGl0ZXJhdGlvbiBlYXJseSBieSBleHBsaWNpdGx5IHJldHVybmluZyBgZmFsc2VgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEBwYXJhbSB7Kn0gW2FjY3VtdWxhdG9yXSBUaGUgY3VzdG9tIGFjY3VtdWxhdG9yIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBhY2N1bXVsYXRlZCB2YWx1ZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIHNxdWFyZXMgPSBfLnRyYW5zZm9ybShbMSwgMiwgMywgNCwgNSwgNiwgNywgOCwgOSwgMTBdLCBmdW5jdGlvbihyZXN1bHQsIG51bSkge1xuICAgICAqICAgbnVtICo9IG51bTtcbiAgICAgKiAgIGlmIChudW0gJSAyKSB7XG4gICAgICogICAgIHJldHVybiByZXN1bHQucHVzaChudW0pIDwgMztcbiAgICAgKiAgIH1cbiAgICAgKiB9KTtcbiAgICAgKiAvLyA9PiBbMSwgOSwgMjVdXG4gICAgICpcbiAgICAgKiB2YXIgbWFwcGVkID0gXy50cmFuc2Zvcm0oeyAnYSc6IDEsICdiJzogMiwgJ2MnOiAzIH0sIGZ1bmN0aW9uKHJlc3VsdCwgbnVtLCBrZXkpIHtcbiAgICAgKiAgIHJlc3VsdFtrZXldID0gbnVtICogMztcbiAgICAgKiB9KTtcbiAgICAgKiAvLyA9PiB7ICdhJzogMywgJ2InOiA2LCAnYyc6IDkgfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRyYW5zZm9ybShvYmplY3QsIGNhbGxiYWNrLCBhY2N1bXVsYXRvciwgdGhpc0FyZykge1xuICAgICAgdmFyIGlzQXJyID0gaXNBcnJheShvYmplY3QpO1xuICAgICAgaWYgKGFjY3VtdWxhdG9yID09IG51bGwpIHtcbiAgICAgICAgaWYgKGlzQXJyKSB7XG4gICAgICAgICAgYWNjdW11bGF0b3IgPSBbXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgY3RvciA9IG9iamVjdCAmJiBvYmplY3QuY29uc3RydWN0b3IsXG4gICAgICAgICAgICAgIHByb3RvID0gY3RvciAmJiBjdG9yLnByb3RvdHlwZTtcblxuICAgICAgICAgIGFjY3VtdWxhdG9yID0gYmFzZUNyZWF0ZShwcm90byk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgNCk7XG4gICAgICAgIChpc0FyciA/IGZvckVhY2ggOiBmb3JPd24pKG9iamVjdCwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBvYmplY3QpIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgb2JqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWNjdW11bGF0b3I7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBhcnJheSBjb21wb3NlZCBvZiB0aGUgb3duIGVudW1lcmFibGUgcHJvcGVydHkgdmFsdWVzIG9mIGBvYmplY3RgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYW4gYXJyYXkgb2YgcHJvcGVydHkgdmFsdWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLnZhbHVlcyh7ICdvbmUnOiAxLCAndHdvJzogMiwgJ3RocmVlJzogMyB9KTtcbiAgICAgKiAvLyA9PiBbMSwgMiwgM10gKHByb3BlcnR5IG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkIGFjcm9zcyBlbnZpcm9ubWVudHMpXG4gICAgICovXG4gICAgZnVuY3Rpb24gdmFsdWVzKG9iamVjdCkge1xuICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgcHJvcHMgPSBrZXlzKG9iamVjdCksXG4gICAgICAgICAgbGVuZ3RoID0gcHJvcHMubGVuZ3RoLFxuICAgICAgICAgIHJlc3VsdCA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIHJlc3VsdFtpbmRleF0gPSBvYmplY3RbcHJvcHNbaW5kZXhdXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGFycmF5IG9mIGVsZW1lbnRzIGZyb20gdGhlIHNwZWNpZmllZCBpbmRleGVzLCBvciBrZXlzLCBvZiB0aGVcbiAgICAgKiBgY29sbGVjdGlvbmAuIEluZGV4ZXMgbWF5IGJlIHNwZWNpZmllZCBhcyBpbmRpdmlkdWFsIGFyZ3VtZW50cyBvciBhcyBhcnJheXNcbiAgICAgKiBvZiBpbmRleGVzLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0gey4uLihudW1iZXJ8bnVtYmVyW118c3RyaW5nfHN0cmluZ1tdKX0gW2luZGV4XSBUaGUgaW5kZXhlcyBvZiBgY29sbGVjdGlvbmBcbiAgICAgKiAgIHRvIHJldHJpZXZlLCBzcGVjaWZpZWQgYXMgaW5kaXZpZHVhbCBpbmRleGVzIG9yIGFycmF5cyBvZiBpbmRleGVzLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhIG5ldyBhcnJheSBvZiBlbGVtZW50cyBjb3JyZXNwb25kaW5nIHRvIHRoZVxuICAgICAqICBwcm92aWRlZCBpbmRleGVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmF0KFsnYScsICdiJywgJ2MnLCAnZCcsICdlJ10sIFswLCAyLCA0XSk7XG4gICAgICogLy8gPT4gWydhJywgJ2MnLCAnZSddXG4gICAgICpcbiAgICAgKiBfLmF0KFsnZnJlZCcsICdiYXJuZXknLCAncGViYmxlcyddLCAwLCAyKTtcbiAgICAgKiAvLyA9PiBbJ2ZyZWQnLCAncGViYmxlcyddXG4gICAgICovXG4gICAgZnVuY3Rpb24gYXQoY29sbGVjdGlvbikge1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgICAgaW5kZXggPSAtMSxcbiAgICAgICAgICBwcm9wcyA9IGJhc2VGbGF0dGVuKGFyZ3MsIHRydWUsIGZhbHNlLCAxKSxcbiAgICAgICAgICBsZW5ndGggPSAoYXJnc1syXSAmJiBhcmdzWzJdW2FyZ3NbMV1dID09PSBjb2xsZWN0aW9uKSA/IDEgOiBwcm9wcy5sZW5ndGgsXG4gICAgICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblxuICAgICAgd2hpbGUoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICByZXN1bHRbaW5kZXhdID0gY29sbGVjdGlvbltwcm9wc1tpbmRleF1dO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYSBnaXZlbiB2YWx1ZSBpcyBwcmVzZW50IGluIGEgY29sbGVjdGlvbiB1c2luZyBzdHJpY3QgZXF1YWxpdHlcbiAgICAgKiBmb3IgY29tcGFyaXNvbnMsIGkuZS4gYD09PWAuIElmIGBmcm9tSW5kZXhgIGlzIG5lZ2F0aXZlLCBpdCBpcyB1c2VkIGFzIHRoZVxuICAgICAqIG9mZnNldCBmcm9tIHRoZSBlbmQgb2YgdGhlIGNvbGxlY3Rpb24uXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAYWxpYXMgaW5jbHVkZVxuICAgICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHsqfSB0YXJnZXQgVGhlIHZhbHVlIHRvIGNoZWNrIGZvci5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2Zyb21JbmRleD0wXSBUaGUgaW5kZXggdG8gc2VhcmNoIGZyb20uXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdGFyZ2V0YCBlbGVtZW50IGlzIGZvdW5kLCBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uY29udGFpbnMoWzEsIDIsIDNdLCAxKTtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICpcbiAgICAgKiBfLmNvbnRhaW5zKFsxLCAyLCAzXSwgMSwgMik7XG4gICAgICogLy8gPT4gZmFsc2VcbiAgICAgKlxuICAgICAqIF8uY29udGFpbnMoeyAnbmFtZSc6ICdmcmVkJywgJ2FnZSc6IDQwIH0sICdmcmVkJyk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogXy5jb250YWlucygncGViYmxlcycsICdlYicpO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb250YWlucyhjb2xsZWN0aW9uLCB0YXJnZXQsIGZyb21JbmRleCkge1xuICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgaW5kZXhPZiA9IGdldEluZGV4T2YoKSxcbiAgICAgICAgICBsZW5ndGggPSBjb2xsZWN0aW9uID8gY29sbGVjdGlvbi5sZW5ndGggOiAwLFxuICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuXG4gICAgICBmcm9tSW5kZXggPSAoZnJvbUluZGV4IDwgMCA/IG5hdGl2ZU1heCgwLCBsZW5ndGggKyBmcm9tSW5kZXgpIDogZnJvbUluZGV4KSB8fCAwO1xuICAgICAgaWYgKGlzQXJyYXkoY29sbGVjdGlvbikpIHtcbiAgICAgICAgcmVzdWx0ID0gaW5kZXhPZihjb2xsZWN0aW9uLCB0YXJnZXQsIGZyb21JbmRleCkgPiAtMTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGxlbmd0aCA9PSAnbnVtYmVyJykge1xuICAgICAgICByZXN1bHQgPSAoaXNTdHJpbmcoY29sbGVjdGlvbikgPyBjb2xsZWN0aW9uLmluZGV4T2YodGFyZ2V0LCBmcm9tSW5kZXgpIDogaW5kZXhPZihjb2xsZWN0aW9uLCB0YXJnZXQsIGZyb21JbmRleCkpID4gLTE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3JPd24oY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBpZiAoKytpbmRleCA+PSBmcm9tSW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiAhKHJlc3VsdCA9IHZhbHVlID09PSB0YXJnZXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gb2JqZWN0IGNvbXBvc2VkIG9mIGtleXMgZ2VuZXJhdGVkIGZyb20gdGhlIHJlc3VsdHMgb2YgcnVubmluZ1xuICAgICAqIGVhY2ggZWxlbWVudCBvZiBgY29sbGVjdGlvbmAgdGhyb3VnaCB0aGUgY2FsbGJhY2suIFRoZSBjb3JyZXNwb25kaW5nIHZhbHVlXG4gICAgICogb2YgZWFjaCBrZXkgaXMgdGhlIG51bWJlciBvZiB0aW1lcyB0aGUga2V5IHdhcyByZXR1cm5lZCBieSB0aGUgY2FsbGJhY2suXG4gICAgICogVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIHRocmVlIGFyZ3VtZW50cztcbiAgICAgKiAodmFsdWUsIGluZGV4fGtleSwgY29sbGVjdGlvbikuXG4gICAgICpcbiAgICAgKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLnBsdWNrXCIgc3R5bGVcbiAgICAgKiBjYWxsYmFjayB3aWxsIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tcbiAgICAgKiB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LFxuICAgICAqIGVsc2UgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8c3RyaW5nfSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWRcbiAgICAgKiAgcGVyIGl0ZXJhdGlvbi4gSWYgYSBwcm9wZXJ0eSBuYW1lIG9yIG9iamVjdCBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIHVzZWRcbiAgICAgKiAgdG8gY3JlYXRlIGEgXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2ssIHJlc3BlY3RpdmVseS5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBjb21wb3NlZCBhZ2dyZWdhdGUgb2JqZWN0LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmNvdW50QnkoWzQuMywgNi4xLCA2LjRdLCBmdW5jdGlvbihudW0pIHsgcmV0dXJuIE1hdGguZmxvb3IobnVtKTsgfSk7XG4gICAgICogLy8gPT4geyAnNCc6IDEsICc2JzogMiB9XG4gICAgICpcbiAgICAgKiBfLmNvdW50QnkoWzQuMywgNi4xLCA2LjRdLCBmdW5jdGlvbihudW0pIHsgcmV0dXJuIHRoaXMuZmxvb3IobnVtKTsgfSwgTWF0aCk7XG4gICAgICogLy8gPT4geyAnNCc6IDEsICc2JzogMiB9XG4gICAgICpcbiAgICAgKiBfLmNvdW50QnkoWydvbmUnLCAndHdvJywgJ3RocmVlJ10sICdsZW5ndGgnKTtcbiAgICAgKiAvLyA9PiB7ICczJzogMiwgJzUnOiAxIH1cbiAgICAgKi9cbiAgICB2YXIgY291bnRCeSA9IGNyZWF0ZUFnZ3JlZ2F0b3IoZnVuY3Rpb24ocmVzdWx0LCB2YWx1ZSwga2V5KSB7XG4gICAgICAoaGFzT3duUHJvcGVydHkuY2FsbChyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XSsrIDogcmVzdWx0W2tleV0gPSAxKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiB0aGUgZ2l2ZW4gY2FsbGJhY2sgcmV0dXJucyB0cnVleSB2YWx1ZSBmb3IgKiphbGwqKiBlbGVtZW50cyBvZlxuICAgICAqIGEgY29sbGVjdGlvbi4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIHRocmVlXG4gICAgICogYXJndW1lbnRzOyAodmFsdWUsIGluZGV4fGtleSwgY29sbGVjdGlvbikuXG4gICAgICpcbiAgICAgKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLnBsdWNrXCIgc3R5bGVcbiAgICAgKiBjYWxsYmFjayB3aWxsIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tcbiAgICAgKiB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LFxuICAgICAqIGVsc2UgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBhbGlhcyBhbGxcbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBpdGVyYXRpb24uIElmIGEgcHJvcGVydHkgbmFtZSBvciBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkXG4gICAgICogIHRvIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGFsbCBlbGVtZW50cyBwYXNzZWQgdGhlIGNhbGxiYWNrIGNoZWNrLFxuICAgICAqICBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uZXZlcnkoW3RydWUsIDEsIG51bGwsICd5ZXMnXSk7XG4gICAgICogLy8gPT4gZmFsc2VcbiAgICAgKlxuICAgICAqIHZhciBjaGFyYWN0ZXJzID0gW1xuICAgICAqICAgeyAnbmFtZSc6ICdiYXJuZXknLCAnYWdlJzogMzYgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAnZnJlZCcsICAgJ2FnZSc6IDQwIH1cbiAgICAgKiBdO1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLnBsdWNrXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5ldmVyeShjaGFyYWN0ZXJzLCAnYWdlJyk7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLndoZXJlXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5ldmVyeShjaGFyYWN0ZXJzLCB7ICdhZ2UnOiAzNiB9KTtcbiAgICAgKiAvLyA9PiBmYWxzZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGV2ZXJ5KGNvbGxlY3Rpb24sIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgIGNhbGxiYWNrID0gbG9kYXNoLmNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAzKTtcblxuICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgbGVuZ3RoID0gY29sbGVjdGlvbiA/IGNvbGxlY3Rpb24ubGVuZ3RoIDogMDtcblxuICAgICAgaWYgKHR5cGVvZiBsZW5ndGggPT0gJ251bWJlcicpIHtcbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBpZiAoIShyZXN1bHQgPSAhIWNhbGxiYWNrKGNvbGxlY3Rpb25baW5kZXhdLCBpbmRleCwgY29sbGVjdGlvbikpKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvck93bihjb2xsZWN0aW9uLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICByZXR1cm4gKHJlc3VsdCA9ICEhY2FsbGJhY2sodmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJdGVyYXRlcyBvdmVyIGVsZW1lbnRzIG9mIGEgY29sbGVjdGlvbiwgcmV0dXJuaW5nIGFuIGFycmF5IG9mIGFsbCBlbGVtZW50c1xuICAgICAqIHRoZSBjYWxsYmFjayByZXR1cm5zIHRydWV5IGZvci4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmRcbiAgICAgKiBpbnZva2VkIHdpdGggdGhyZWUgYXJndW1lbnRzOyAodmFsdWUsIGluZGV4fGtleSwgY29sbGVjdGlvbikuXG4gICAgICpcbiAgICAgKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLnBsdWNrXCIgc3R5bGVcbiAgICAgKiBjYWxsYmFjayB3aWxsIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tcbiAgICAgKiB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LFxuICAgICAqIGVsc2UgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBhbGlhcyBzZWxlY3RcbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBpdGVyYXRpb24uIElmIGEgcHJvcGVydHkgbmFtZSBvciBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkXG4gICAgICogIHRvIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGEgbmV3IGFycmF5IG9mIGVsZW1lbnRzIHRoYXQgcGFzc2VkIHRoZSBjYWxsYmFjayBjaGVjay5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIGV2ZW5zID0gXy5maWx0ZXIoWzEsIDIsIDMsIDQsIDUsIDZdLCBmdW5jdGlvbihudW0pIHsgcmV0dXJuIG51bSAlIDIgPT0gMDsgfSk7XG4gICAgICogLy8gPT4gWzIsIDQsIDZdXG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgJ2FnZSc6IDM2LCAnYmxvY2tlZCc6IGZhbHNlIH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICdhZ2UnOiA0MCwgJ2Jsb2NrZWQnOiB0cnVlIH1cbiAgICAgKiBdO1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLnBsdWNrXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5maWx0ZXIoY2hhcmFjdGVycywgJ2Jsb2NrZWQnKTtcbiAgICAgKiAvLyA9PiBbeyAnbmFtZSc6ICdmcmVkJywgJ2FnZSc6IDQwLCAnYmxvY2tlZCc6IHRydWUgfV1cbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy53aGVyZVwiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8uZmlsdGVyKGNoYXJhY3RlcnMsIHsgJ2FnZSc6IDM2IH0pO1xuICAgICAqIC8vID0+IFt7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiwgJ2Jsb2NrZWQnOiBmYWxzZSB9XVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZpbHRlcihjb2xsZWN0aW9uLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuXG4gICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICBsZW5ndGggPSBjb2xsZWN0aW9uID8gY29sbGVjdGlvbi5sZW5ndGggOiAwO1xuXG4gICAgICBpZiAodHlwZW9mIGxlbmd0aCA9PSAnbnVtYmVyJykge1xuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIHZhciB2YWx1ZSA9IGNvbGxlY3Rpb25baW5kZXhdO1xuICAgICAgICAgIGlmIChjYWxsYmFjayh2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3JPd24oY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgaWYgKGNhbGxiYWNrKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikpIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJdGVyYXRlcyBvdmVyIGVsZW1lbnRzIG9mIGEgY29sbGVjdGlvbiwgcmV0dXJuaW5nIHRoZSBmaXJzdCBlbGVtZW50IHRoYXRcbiAgICAgKiB0aGUgY2FsbGJhY2sgcmV0dXJucyB0cnVleSBmb3IuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kXG4gICAgICogaW52b2tlZCB3aXRoIHRocmVlIGFyZ3VtZW50czsgKHZhbHVlLCBpbmRleHxrZXksIGNvbGxlY3Rpb24pLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAYWxpYXMgZGV0ZWN0LCBmaW5kV2hlcmVcbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBpdGVyYXRpb24uIElmIGEgcHJvcGVydHkgbmFtZSBvciBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkXG4gICAgICogIHRvIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGZvdW5kIGVsZW1lbnQsIGVsc2UgYHVuZGVmaW5lZGAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBjaGFyYWN0ZXJzID0gW1xuICAgICAqICAgeyAnbmFtZSc6ICdiYXJuZXknLCAgJ2FnZSc6IDM2LCAnYmxvY2tlZCc6IGZhbHNlIH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICAnYWdlJzogNDAsICdibG9ja2VkJzogdHJ1ZSB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdwZWJibGVzJywgJ2FnZSc6IDEsICAnYmxvY2tlZCc6IGZhbHNlIH1cbiAgICAgKiBdO1xuICAgICAqXG4gICAgICogXy5maW5kKGNoYXJhY3RlcnMsIGZ1bmN0aW9uKGNocikge1xuICAgICAqICAgcmV0dXJuIGNoci5hZ2UgPCA0MDtcbiAgICAgKiB9KTtcbiAgICAgKiAvLyA9PiB7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiwgJ2Jsb2NrZWQnOiBmYWxzZSB9XG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ud2hlcmVcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLmZpbmQoY2hhcmFjdGVycywgeyAnYWdlJzogMSB9KTtcbiAgICAgKiAvLyA9PiAgeyAnbmFtZSc6ICdwZWJibGVzJywgJ2FnZSc6IDEsICdibG9ja2VkJzogZmFsc2UgfVxuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLnBsdWNrXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5maW5kKGNoYXJhY3RlcnMsICdibG9ja2VkJyk7XG4gICAgICogLy8gPT4geyAnbmFtZSc6ICdmcmVkJywgJ2FnZSc6IDQwLCAnYmxvY2tlZCc6IHRydWUgfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZpbmQoY29sbGVjdGlvbiwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIGNhbGxiYWNrID0gbG9kYXNoLmNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAzKTtcblxuICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgbGVuZ3RoID0gY29sbGVjdGlvbiA/IGNvbGxlY3Rpb24ubGVuZ3RoIDogMDtcblxuICAgICAgaWYgKHR5cGVvZiBsZW5ndGggPT0gJ251bWJlcicpIHtcbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBjb2xsZWN0aW9uW2luZGV4XTtcbiAgICAgICAgICBpZiAoY2FsbGJhY2sodmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgZm9yT3duKGNvbGxlY3Rpb24sIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgICAgIGlmIChjYWxsYmFjayh2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pKSB7XG4gICAgICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGxpa2UgYF8uZmluZGAgZXhjZXB0IHRoYXQgaXQgaXRlcmF0ZXMgb3ZlciBlbGVtZW50c1xuICAgICAqIG9mIGEgYGNvbGxlY3Rpb25gIGZyb20gcmlnaHQgdG8gbGVmdC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8c3RyaW5nfSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWRcbiAgICAgKiAgcGVyIGl0ZXJhdGlvbi4gSWYgYSBwcm9wZXJ0eSBuYW1lIG9yIG9iamVjdCBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIHVzZWRcbiAgICAgKiAgdG8gY3JlYXRlIGEgXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2ssIHJlc3BlY3RpdmVseS5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgZm91bmQgZWxlbWVudCwgZWxzZSBgdW5kZWZpbmVkYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5maW5kTGFzdChbMSwgMiwgMywgNF0sIGZ1bmN0aW9uKG51bSkge1xuICAgICAqICAgcmV0dXJuIG51bSAlIDIgPT0gMTtcbiAgICAgKiB9KTtcbiAgICAgKiAvLyA9PiAzXG4gICAgICovXG4gICAgZnVuY3Rpb24gZmluZExhc3QoY29sbGVjdGlvbiwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciByZXN1bHQ7XG4gICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG4gICAgICBmb3JFYWNoUmlnaHQoY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgIGlmIChjYWxsYmFjayh2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pKSB7XG4gICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSXRlcmF0ZXMgb3ZlciBlbGVtZW50cyBvZiBhIGNvbGxlY3Rpb24sIGV4ZWN1dGluZyB0aGUgY2FsbGJhY2sgZm9yIGVhY2hcbiAgICAgKiBlbGVtZW50LiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkIHdpdGggdGhyZWUgYXJndW1lbnRzO1xuICAgICAqICh2YWx1ZSwgaW5kZXh8a2V5LCBjb2xsZWN0aW9uKS4gQ2FsbGJhY2tzIG1heSBleGl0IGl0ZXJhdGlvbiBlYXJseSBieVxuICAgICAqIGV4cGxpY2l0bHkgcmV0dXJuaW5nIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBOb3RlOiBBcyB3aXRoIG90aGVyIFwiQ29sbGVjdGlvbnNcIiBtZXRob2RzLCBvYmplY3RzIHdpdGggYSBgbGVuZ3RoYCBwcm9wZXJ0eVxuICAgICAqIGFyZSBpdGVyYXRlZCBsaWtlIGFycmF5cy4gVG8gYXZvaWQgdGhpcyBiZWhhdmlvciBgXy5mb3JJbmAgb3IgYF8uZm9yT3duYFxuICAgICAqIG1heSBiZSB1c2VkIGZvciBvYmplY3QgaXRlcmF0aW9uLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGFsaWFzIGVhY2hcbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtBcnJheXxPYmplY3R8c3RyaW5nfSBSZXR1cm5zIGBjb2xsZWN0aW9uYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXyhbMSwgMiwgM10pLmZvckVhY2goZnVuY3Rpb24obnVtKSB7IGNvbnNvbGUubG9nKG51bSk7IH0pLmpvaW4oJywnKTtcbiAgICAgKiAvLyA9PiBsb2dzIGVhY2ggbnVtYmVyIGFuZCByZXR1cm5zICcxLDIsMydcbiAgICAgKlxuICAgICAqIF8uZm9yRWFjaCh7ICdvbmUnOiAxLCAndHdvJzogMiwgJ3RocmVlJzogMyB9LCBmdW5jdGlvbihudW0pIHsgY29uc29sZS5sb2cobnVtKTsgfSk7XG4gICAgICogLy8gPT4gbG9ncyBlYWNoIG51bWJlciBhbmQgcmV0dXJucyB0aGUgb2JqZWN0IChwcm9wZXJ0eSBvcmRlciBpcyBub3QgZ3VhcmFudGVlZCBhY3Jvc3MgZW52aXJvbm1lbnRzKVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZvckVhY2goY29sbGVjdGlvbiwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24gPyBjb2xsZWN0aW9uLmxlbmd0aCA6IDA7XG5cbiAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgJiYgdHlwZW9mIHRoaXNBcmcgPT0gJ3VuZGVmaW5lZCcgPyBjYWxsYmFjayA6IGJhc2VDcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG4gICAgICBpZiAodHlwZW9mIGxlbmd0aCA9PSAnbnVtYmVyJykge1xuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIGlmIChjYWxsYmFjayhjb2xsZWN0aW9uW2luZGV4XSwgaW5kZXgsIGNvbGxlY3Rpb24pID09PSBmYWxzZSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3JPd24oY29sbGVjdGlvbiwgY2FsbGJhY2spO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgaXMgbGlrZSBgXy5mb3JFYWNoYCBleGNlcHQgdGhhdCBpdCBpdGVyYXRlcyBvdmVyIGVsZW1lbnRzXG4gICAgICogb2YgYSBgY29sbGVjdGlvbmAgZnJvbSByaWdodCB0byBsZWZ0LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGFsaWFzIGVhY2hSaWdodFxuICAgICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge0FycmF5fE9iamVjdHxzdHJpbmd9IFJldHVybnMgYGNvbGxlY3Rpb25gLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfKFsxLCAyLCAzXSkuZm9yRWFjaFJpZ2h0KGZ1bmN0aW9uKG51bSkgeyBjb25zb2xlLmxvZyhudW0pOyB9KS5qb2luKCcsJyk7XG4gICAgICogLy8gPT4gbG9ncyBlYWNoIG51bWJlciBmcm9tIHJpZ2h0IHRvIGxlZnQgYW5kIHJldHVybnMgJzMsMiwxJ1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZvckVhY2hSaWdodChjb2xsZWN0aW9uLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIGxlbmd0aCA9IGNvbGxlY3Rpb24gPyBjb2xsZWN0aW9uLmxlbmd0aCA6IDA7XG4gICAgICBjYWxsYmFjayA9IGNhbGxiYWNrICYmIHR5cGVvZiB0aGlzQXJnID09ICd1bmRlZmluZWQnID8gY2FsbGJhY2sgOiBiYXNlQ3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgaWYgKHR5cGVvZiBsZW5ndGggPT0gJ251bWJlcicpIHtcbiAgICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgICAgaWYgKGNhbGxiYWNrKGNvbGxlY3Rpb25bbGVuZ3RoXSwgbGVuZ3RoLCBjb2xsZWN0aW9uKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHByb3BzID0ga2V5cyhjb2xsZWN0aW9uKTtcbiAgICAgICAgbGVuZ3RoID0gcHJvcHMubGVuZ3RoO1xuICAgICAgICBmb3JPd24oY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUsIGtleSwgY29sbGVjdGlvbikge1xuICAgICAgICAgIGtleSA9IHByb3BzID8gcHJvcHNbLS1sZW5ndGhdIDogLS1sZW5ndGg7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGNvbGxlY3Rpb25ba2V5XSwga2V5LCBjb2xsZWN0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIG9iamVjdCBjb21wb3NlZCBvZiBrZXlzIGdlbmVyYXRlZCBmcm9tIHRoZSByZXN1bHRzIG9mIHJ1bm5pbmdcbiAgICAgKiBlYWNoIGVsZW1lbnQgb2YgYSBjb2xsZWN0aW9uIHRocm91Z2ggdGhlIGNhbGxiYWNrLiBUaGUgY29ycmVzcG9uZGluZyB2YWx1ZVxuICAgICAqIG9mIGVhY2gga2V5IGlzIGFuIGFycmF5IG9mIHRoZSBlbGVtZW50cyByZXNwb25zaWJsZSBmb3IgZ2VuZXJhdGluZyB0aGUga2V5LlxuICAgICAqIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM7XG4gICAgICogKHZhbHVlLCBpbmRleHxrZXksIGNvbGxlY3Rpb24pLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWBcbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8c3RyaW5nfSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWRcbiAgICAgKiAgcGVyIGl0ZXJhdGlvbi4gSWYgYSBwcm9wZXJ0eSBuYW1lIG9yIG9iamVjdCBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIHVzZWRcbiAgICAgKiAgdG8gY3JlYXRlIGEgXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2ssIHJlc3BlY3RpdmVseS5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBjb21wb3NlZCBhZ2dyZWdhdGUgb2JqZWN0LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmdyb3VwQnkoWzQuMiwgNi4xLCA2LjRdLCBmdW5jdGlvbihudW0pIHsgcmV0dXJuIE1hdGguZmxvb3IobnVtKTsgfSk7XG4gICAgICogLy8gPT4geyAnNCc6IFs0LjJdLCAnNic6IFs2LjEsIDYuNF0gfVxuICAgICAqXG4gICAgICogXy5ncm91cEJ5KFs0LjIsIDYuMSwgNi40XSwgZnVuY3Rpb24obnVtKSB7IHJldHVybiB0aGlzLmZsb29yKG51bSk7IH0sIE1hdGgpO1xuICAgICAqIC8vID0+IHsgJzQnOiBbNC4yXSwgJzYnOiBbNi4xLCA2LjRdIH1cbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy5wbHVja1wiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8uZ3JvdXBCeShbJ29uZScsICd0d28nLCAndGhyZWUnXSwgJ2xlbmd0aCcpO1xuICAgICAqIC8vID0+IHsgJzMnOiBbJ29uZScsICd0d28nXSwgJzUnOiBbJ3RocmVlJ10gfVxuICAgICAqL1xuICAgIHZhciBncm91cEJ5ID0gY3JlYXRlQWdncmVnYXRvcihmdW5jdGlvbihyZXN1bHQsIHZhbHVlLCBrZXkpIHtcbiAgICAgIChoYXNPd25Qcm9wZXJ0eS5jYWxsKHJlc3VsdCwga2V5KSA/IHJlc3VsdFtrZXldIDogcmVzdWx0W2tleV0gPSBbXSkucHVzaCh2YWx1ZSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIG9iamVjdCBjb21wb3NlZCBvZiBrZXlzIGdlbmVyYXRlZCBmcm9tIHRoZSByZXN1bHRzIG9mIHJ1bm5pbmdcbiAgICAgKiBlYWNoIGVsZW1lbnQgb2YgdGhlIGNvbGxlY3Rpb24gdGhyb3VnaCB0aGUgZ2l2ZW4gY2FsbGJhY2suIFRoZSBjb3JyZXNwb25kaW5nXG4gICAgICogdmFsdWUgb2YgZWFjaCBrZXkgaXMgdGhlIGxhc3QgZWxlbWVudCByZXNwb25zaWJsZSBmb3IgZ2VuZXJhdGluZyB0aGUga2V5LlxuICAgICAqIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM7XG4gICAgICogKHZhbHVlLCBpbmRleHxrZXksIGNvbGxlY3Rpb24pLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBpdGVyYXRpb24uIElmIGEgcHJvcGVydHkgbmFtZSBvciBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkXG4gICAgICogIHRvIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgY29tcG9zZWQgYWdncmVnYXRlIG9iamVjdC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIGtleXMgPSBbXG4gICAgICogICB7ICdkaXInOiAnbGVmdCcsICdjb2RlJzogOTcgfSxcbiAgICAgKiAgIHsgJ2Rpcic6ICdyaWdodCcsICdjb2RlJzogMTAwIH1cbiAgICAgKiBdO1xuICAgICAqXG4gICAgICogXy5pbmRleEJ5KGtleXMsICdkaXInKTtcbiAgICAgKiAvLyA9PiB7ICdsZWZ0JzogeyAnZGlyJzogJ2xlZnQnLCAnY29kZSc6IDk3IH0sICdyaWdodCc6IHsgJ2Rpcic6ICdyaWdodCcsICdjb2RlJzogMTAwIH0gfVxuICAgICAqXG4gICAgICogXy5pbmRleEJ5KGtleXMsIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShrZXkuY29kZSk7IH0pO1xuICAgICAqIC8vID0+IHsgJ2EnOiB7ICdkaXInOiAnbGVmdCcsICdjb2RlJzogOTcgfSwgJ2QnOiB7ICdkaXInOiAncmlnaHQnLCAnY29kZSc6IDEwMCB9IH1cbiAgICAgKlxuICAgICAqIF8uaW5kZXhCeShjaGFyYWN0ZXJzLCBmdW5jdGlvbihrZXkpIHsgdGhpcy5mcm9tQ2hhckNvZGUoa2V5LmNvZGUpOyB9LCBTdHJpbmcpO1xuICAgICAqIC8vID0+IHsgJ2EnOiB7ICdkaXInOiAnbGVmdCcsICdjb2RlJzogOTcgfSwgJ2QnOiB7ICdkaXInOiAncmlnaHQnLCAnY29kZSc6IDEwMCB9IH1cbiAgICAgKi9cbiAgICB2YXIgaW5kZXhCeSA9IGNyZWF0ZUFnZ3JlZ2F0b3IoZnVuY3Rpb24ocmVzdWx0LCB2YWx1ZSwga2V5KSB7XG4gICAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogSW52b2tlcyB0aGUgbWV0aG9kIG5hbWVkIGJ5IGBtZXRob2ROYW1lYCBvbiBlYWNoIGVsZW1lbnQgaW4gdGhlIGBjb2xsZWN0aW9uYFxuICAgICAqIHJldHVybmluZyBhbiBhcnJheSBvZiB0aGUgcmVzdWx0cyBvZiBlYWNoIGludm9rZWQgbWV0aG9kLiBBZGRpdGlvbmFsIGFyZ3VtZW50c1xuICAgICAqIHdpbGwgYmUgcHJvdmlkZWQgdG8gZWFjaCBpbnZva2VkIG1ldGhvZC4gSWYgYG1ldGhvZE5hbWVgIGlzIGEgZnVuY3Rpb24gaXRcbiAgICAgKiB3aWxsIGJlIGludm9rZWQgZm9yLCBhbmQgYHRoaXNgIGJvdW5kIHRvLCBlYWNoIGVsZW1lbnQgaW4gdGhlIGBjb2xsZWN0aW9uYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxzdHJpbmd9IG1ldGhvZE5hbWUgVGhlIG5hbWUgb2YgdGhlIG1ldGhvZCB0byBpbnZva2Ugb3JcbiAgICAgKiAgdGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAgICAgKiBAcGFyYW0gey4uLip9IFthcmddIEFyZ3VtZW50cyB0byBpbnZva2UgdGhlIG1ldGhvZCB3aXRoLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhIG5ldyBhcnJheSBvZiB0aGUgcmVzdWx0cyBvZiBlYWNoIGludm9rZWQgbWV0aG9kLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmludm9rZShbWzUsIDEsIDddLCBbMywgMiwgMV1dLCAnc29ydCcpO1xuICAgICAqIC8vID0+IFtbMSwgNSwgN10sIFsxLCAyLCAzXV1cbiAgICAgKlxuICAgICAqIF8uaW52b2tlKFsxMjMsIDQ1Nl0sIFN0cmluZy5wcm90b3R5cGUuc3BsaXQsICcnKTtcbiAgICAgKiAvLyA9PiBbWycxJywgJzInLCAnMyddLCBbJzQnLCAnNScsICc2J11dXG4gICAgICovXG4gICAgZnVuY3Rpb24gaW52b2tlKGNvbGxlY3Rpb24sIG1ldGhvZE5hbWUpIHtcbiAgICAgIHZhciBhcmdzID0gc2xpY2UoYXJndW1lbnRzLCAyKSxcbiAgICAgICAgICBpbmRleCA9IC0xLFxuICAgICAgICAgIGlzRnVuYyA9IHR5cGVvZiBtZXRob2ROYW1lID09ICdmdW5jdGlvbicsXG4gICAgICAgICAgbGVuZ3RoID0gY29sbGVjdGlvbiA/IGNvbGxlY3Rpb24ubGVuZ3RoIDogMCxcbiAgICAgICAgICByZXN1bHQgPSBBcnJheSh0eXBlb2YgbGVuZ3RoID09ICdudW1iZXInID8gbGVuZ3RoIDogMCk7XG5cbiAgICAgIGZvckVhY2goY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmVzdWx0WysraW5kZXhdID0gKGlzRnVuYyA/IG1ldGhvZE5hbWUgOiB2YWx1ZVttZXRob2ROYW1lXSkuYXBwbHkodmFsdWUsIGFyZ3MpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgdmFsdWVzIGJ5IHJ1bm5pbmcgZWFjaCBlbGVtZW50IGluIHRoZSBjb2xsZWN0aW9uXG4gICAgICogdGhyb3VnaCB0aGUgY2FsbGJhY2suIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aFxuICAgICAqIHRocmVlIGFyZ3VtZW50czsgKHZhbHVlLCBpbmRleHxrZXksIGNvbGxlY3Rpb24pLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAYWxpYXMgY29sbGVjdFxuICAgICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8c3RyaW5nfSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWRcbiAgICAgKiAgcGVyIGl0ZXJhdGlvbi4gSWYgYSBwcm9wZXJ0eSBuYW1lIG9yIG9iamVjdCBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIHVzZWRcbiAgICAgKiAgdG8gY3JlYXRlIGEgXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2ssIHJlc3BlY3RpdmVseS5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBuZXcgYXJyYXkgb2YgdGhlIHJlc3VsdHMgb2YgZWFjaCBgY2FsbGJhY2tgIGV4ZWN1dGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5tYXAoWzEsIDIsIDNdLCBmdW5jdGlvbihudW0pIHsgcmV0dXJuIG51bSAqIDM7IH0pO1xuICAgICAqIC8vID0+IFszLCA2LCA5XVxuICAgICAqXG4gICAgICogXy5tYXAoeyAnb25lJzogMSwgJ3R3byc6IDIsICd0aHJlZSc6IDMgfSwgZnVuY3Rpb24obnVtKSB7IHJldHVybiBudW0gKiAzOyB9KTtcbiAgICAgKiAvLyA9PiBbMywgNiwgOV0gKHByb3BlcnR5IG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkIGFjcm9zcyBlbnZpcm9ubWVudHMpXG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgJ2FnZSc6IDM2IH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICdhZ2UnOiA0MCB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy5wbHVja1wiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8ubWFwKGNoYXJhY3RlcnMsICduYW1lJyk7XG4gICAgICogLy8gPT4gWydiYXJuZXknLCAnZnJlZCddXG4gICAgICovXG4gICAgZnVuY3Rpb24gbWFwKGNvbGxlY3Rpb24sIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICBsZW5ndGggPSBjb2xsZWN0aW9uID8gY29sbGVjdGlvbi5sZW5ndGggOiAwO1xuXG4gICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG4gICAgICBpZiAodHlwZW9mIGxlbmd0aCA9PSAnbnVtYmVyJykge1xuICAgICAgICB2YXIgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICByZXN1bHRbaW5kZXhdID0gY2FsbGJhY2soY29sbGVjdGlvbltpbmRleF0sIGluZGV4LCBjb2xsZWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gW107XG4gICAgICAgIGZvck93bihjb2xsZWN0aW9uLCBmdW5jdGlvbih2YWx1ZSwga2V5LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgcmVzdWx0WysraW5kZXhdID0gY2FsbGJhY2sodmFsdWUsIGtleSwgY29sbGVjdGlvbik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZXMgdGhlIG1heGltdW0gdmFsdWUgb2YgYSBjb2xsZWN0aW9uLiBJZiB0aGUgY29sbGVjdGlvbiBpcyBlbXB0eSBvclxuICAgICAqIGZhbHNleSBgLUluZmluaXR5YCBpcyByZXR1cm5lZC4gSWYgYSBjYWxsYmFjayBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIGV4ZWN1dGVkXG4gICAgICogZm9yIGVhY2ggdmFsdWUgaW4gdGhlIGNvbGxlY3Rpb24gdG8gZ2VuZXJhdGUgdGhlIGNyaXRlcmlvbiBieSB3aGljaCB0aGUgdmFsdWVcbiAgICAgKiBpcyByYW5rZWQuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZVxuICAgICAqIGFyZ3VtZW50czsgKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikuXG4gICAgICpcbiAgICAgKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLnBsdWNrXCIgc3R5bGVcbiAgICAgKiBjYWxsYmFjayB3aWxsIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tcbiAgICAgKiB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LFxuICAgICAqIGVsc2UgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8c3RyaW5nfSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWRcbiAgICAgKiAgcGVyIGl0ZXJhdGlvbi4gSWYgYSBwcm9wZXJ0eSBuYW1lIG9yIG9iamVjdCBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIHVzZWRcbiAgICAgKiAgdG8gY3JlYXRlIGEgXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2ssIHJlc3BlY3RpdmVseS5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgbWF4aW11bSB2YWx1ZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5tYXgoWzQsIDIsIDgsIDZdKTtcbiAgICAgKiAvLyA9PiA4XG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgJ2FnZSc6IDM2IH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICdhZ2UnOiA0MCB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIF8ubWF4KGNoYXJhY3RlcnMsIGZ1bmN0aW9uKGNocikgeyByZXR1cm4gY2hyLmFnZTsgfSk7XG4gICAgICogLy8gPT4geyAnbmFtZSc6ICdmcmVkJywgJ2FnZSc6IDQwIH07XG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ucGx1Y2tcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLm1heChjaGFyYWN0ZXJzLCAnYWdlJyk7XG4gICAgICogLy8gPT4geyAnbmFtZSc6ICdmcmVkJywgJ2FnZSc6IDQwIH07XG4gICAgICovXG4gICAgZnVuY3Rpb24gbWF4KGNvbGxlY3Rpb24sIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICB2YXIgY29tcHV0ZWQgPSAtSW5maW5pdHksXG4gICAgICAgICAgcmVzdWx0ID0gY29tcHV0ZWQ7XG5cbiAgICAgIC8vIGFsbG93cyB3b3JraW5nIHdpdGggZnVuY3Rpb25zIGxpa2UgYF8ubWFwYCB3aXRob3V0IHVzaW5nXG4gICAgICAvLyB0aGVpciBgaW5kZXhgIGFyZ3VtZW50IGFzIGEgY2FsbGJhY2tcbiAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ2Z1bmN0aW9uJyAmJiB0aGlzQXJnICYmIHRoaXNBcmdbY2FsbGJhY2tdID09PSBjb2xsZWN0aW9uKSB7XG4gICAgICAgIGNhbGxiYWNrID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmIChjYWxsYmFjayA9PSBudWxsICYmIGlzQXJyYXkoY29sbGVjdGlvbikpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgICBsZW5ndGggPSBjb2xsZWN0aW9uLmxlbmd0aDtcblxuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIHZhciB2YWx1ZSA9IGNvbGxlY3Rpb25baW5kZXhdO1xuICAgICAgICAgIGlmICh2YWx1ZSA+IHJlc3VsdCkge1xuICAgICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFjayA9IChjYWxsYmFjayA9PSBudWxsICYmIGlzU3RyaW5nKGNvbGxlY3Rpb24pKVxuICAgICAgICAgID8gY2hhckF0Q2FsbGJhY2tcbiAgICAgICAgICA6IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG5cbiAgICAgICAgZm9yRWFjaChjb2xsZWN0aW9uLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICB2YXIgY3VycmVudCA9IGNhbGxiYWNrKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgICAgICAgaWYgKGN1cnJlbnQgPiBjb21wdXRlZCkge1xuICAgICAgICAgICAgY29tcHV0ZWQgPSBjdXJyZW50O1xuICAgICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmVzIHRoZSBtaW5pbXVtIHZhbHVlIG9mIGEgY29sbGVjdGlvbi4gSWYgdGhlIGNvbGxlY3Rpb24gaXMgZW1wdHkgb3JcbiAgICAgKiBmYWxzZXkgYEluZmluaXR5YCBpcyByZXR1cm5lZC4gSWYgYSBjYWxsYmFjayBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIGV4ZWN1dGVkXG4gICAgICogZm9yIGVhY2ggdmFsdWUgaW4gdGhlIGNvbGxlY3Rpb24gdG8gZ2VuZXJhdGUgdGhlIGNyaXRlcmlvbiBieSB3aGljaCB0aGUgdmFsdWVcbiAgICAgKiBpcyByYW5rZWQuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZVxuICAgICAqIGFyZ3VtZW50czsgKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikuXG4gICAgICpcbiAgICAgKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLnBsdWNrXCIgc3R5bGVcbiAgICAgKiBjYWxsYmFjayB3aWxsIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tcbiAgICAgKiB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LFxuICAgICAqIGVsc2UgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8c3RyaW5nfSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWRcbiAgICAgKiAgcGVyIGl0ZXJhdGlvbi4gSWYgYSBwcm9wZXJ0eSBuYW1lIG9yIG9iamVjdCBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIHVzZWRcbiAgICAgKiAgdG8gY3JlYXRlIGEgXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2ssIHJlc3BlY3RpdmVseS5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgbWluaW11bSB2YWx1ZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5taW4oWzQsIDIsIDgsIDZdKTtcbiAgICAgKiAvLyA9PiAyXG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgJ2FnZSc6IDM2IH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICdhZ2UnOiA0MCB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIF8ubWluKGNoYXJhY3RlcnMsIGZ1bmN0aW9uKGNocikgeyByZXR1cm4gY2hyLmFnZTsgfSk7XG4gICAgICogLy8gPT4geyAnbmFtZSc6ICdiYXJuZXknLCAnYWdlJzogMzYgfTtcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy5wbHVja1wiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8ubWluKGNoYXJhY3RlcnMsICdhZ2UnKTtcbiAgICAgKiAvLyA9PiB7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiB9O1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIG1pbihjb2xsZWN0aW9uLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIGNvbXB1dGVkID0gSW5maW5pdHksXG4gICAgICAgICAgcmVzdWx0ID0gY29tcHV0ZWQ7XG5cbiAgICAgIC8vIGFsbG93cyB3b3JraW5nIHdpdGggZnVuY3Rpb25zIGxpa2UgYF8ubWFwYCB3aXRob3V0IHVzaW5nXG4gICAgICAvLyB0aGVpciBgaW5kZXhgIGFyZ3VtZW50IGFzIGEgY2FsbGJhY2tcbiAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ2Z1bmN0aW9uJyAmJiB0aGlzQXJnICYmIHRoaXNBcmdbY2FsbGJhY2tdID09PSBjb2xsZWN0aW9uKSB7XG4gICAgICAgIGNhbGxiYWNrID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmIChjYWxsYmFjayA9PSBudWxsICYmIGlzQXJyYXkoY29sbGVjdGlvbikpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgICBsZW5ndGggPSBjb2xsZWN0aW9uLmxlbmd0aDtcblxuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIHZhciB2YWx1ZSA9IGNvbGxlY3Rpb25baW5kZXhdO1xuICAgICAgICAgIGlmICh2YWx1ZSA8IHJlc3VsdCkge1xuICAgICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFjayA9IChjYWxsYmFjayA9PSBudWxsICYmIGlzU3RyaW5nKGNvbGxlY3Rpb24pKVxuICAgICAgICAgID8gY2hhckF0Q2FsbGJhY2tcbiAgICAgICAgICA6IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG5cbiAgICAgICAgZm9yRWFjaChjb2xsZWN0aW9uLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICB2YXIgY3VycmVudCA9IGNhbGxiYWNrKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgICAgICAgaWYgKGN1cnJlbnQgPCBjb21wdXRlZCkge1xuICAgICAgICAgICAgY29tcHV0ZWQgPSBjdXJyZW50O1xuICAgICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmVzIHRoZSB2YWx1ZSBvZiBhIHNwZWNpZmllZCBwcm9wZXJ0eSBmcm9tIGFsbCBlbGVtZW50cyBpbiB0aGUgY29sbGVjdGlvbi5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEB0eXBlIEZ1bmN0aW9uXG4gICAgICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHkgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIHBsdWNrLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhIG5ldyBhcnJheSBvZiBwcm9wZXJ0eSB2YWx1ZXMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBjaGFyYWN0ZXJzID0gW1xuICAgICAqICAgeyAnbmFtZSc6ICdiYXJuZXknLCAnYWdlJzogMzYgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAnZnJlZCcsICAgJ2FnZSc6IDQwIH1cbiAgICAgKiBdO1xuICAgICAqXG4gICAgICogXy5wbHVjayhjaGFyYWN0ZXJzLCAnbmFtZScpO1xuICAgICAqIC8vID0+IFsnYmFybmV5JywgJ2ZyZWQnXVxuICAgICAqL1xuICAgIHZhciBwbHVjayA9IG1hcDtcblxuICAgIC8qKlxuICAgICAqIFJlZHVjZXMgYSBjb2xsZWN0aW9uIHRvIGEgdmFsdWUgd2hpY2ggaXMgdGhlIGFjY3VtdWxhdGVkIHJlc3VsdCBvZiBydW5uaW5nXG4gICAgICogZWFjaCBlbGVtZW50IGluIHRoZSBjb2xsZWN0aW9uIHRocm91Z2ggdGhlIGNhbGxiYWNrLCB3aGVyZSBlYWNoIHN1Y2Nlc3NpdmVcbiAgICAgKiBjYWxsYmFjayBleGVjdXRpb24gY29uc3VtZXMgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgcHJldmlvdXMgZXhlY3V0aW9uLiBJZlxuICAgICAqIGBhY2N1bXVsYXRvcmAgaXMgbm90IHByb3ZpZGVkIHRoZSBmaXJzdCBlbGVtZW50IG9mIHRoZSBjb2xsZWN0aW9uIHdpbGwgYmVcbiAgICAgKiB1c2VkIGFzIHRoZSBpbml0aWFsIGBhY2N1bXVsYXRvcmAgdmFsdWUuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2BcbiAgICAgKiBhbmQgaW52b2tlZCB3aXRoIGZvdXIgYXJndW1lbnRzOyAoYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleHxrZXksIGNvbGxlY3Rpb24pLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGFsaWFzIGZvbGRsLCBpbmplY3RcbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEBwYXJhbSB7Kn0gW2FjY3VtdWxhdG9yXSBJbml0aWFsIHZhbHVlIG9mIHRoZSBhY2N1bXVsYXRvci5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgYWNjdW11bGF0ZWQgdmFsdWUuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBzdW0gPSBfLnJlZHVjZShbMSwgMiwgM10sIGZ1bmN0aW9uKHN1bSwgbnVtKSB7XG4gICAgICogICByZXR1cm4gc3VtICsgbnVtO1xuICAgICAqIH0pO1xuICAgICAqIC8vID0+IDZcbiAgICAgKlxuICAgICAqIHZhciBtYXBwZWQgPSBfLnJlZHVjZSh7ICdhJzogMSwgJ2InOiAyLCAnYyc6IDMgfSwgZnVuY3Rpb24ocmVzdWx0LCBudW0sIGtleSkge1xuICAgICAqICAgcmVzdWx0W2tleV0gPSBudW0gKiAzO1xuICAgICAqICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgKiB9LCB7fSk7XG4gICAgICogLy8gPT4geyAnYSc6IDMsICdiJzogNiwgJ2MnOiA5IH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZWR1Y2UoY29sbGVjdGlvbiwgY2FsbGJhY2ssIGFjY3VtdWxhdG9yLCB0aGlzQXJnKSB7XG4gICAgICBpZiAoIWNvbGxlY3Rpb24pIHJldHVybiBhY2N1bXVsYXRvcjtcbiAgICAgIHZhciBub2FjY3VtID0gYXJndW1lbnRzLmxlbmd0aCA8IDM7XG4gICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgNCk7XG5cbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24ubGVuZ3RoO1xuXG4gICAgICBpZiAodHlwZW9mIGxlbmd0aCA9PSAnbnVtYmVyJykge1xuICAgICAgICBpZiAobm9hY2N1bSkge1xuICAgICAgICAgIGFjY3VtdWxhdG9yID0gY29sbGVjdGlvblsrK2luZGV4XTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIGFjY3VtdWxhdG9yID0gY2FsbGJhY2soYWNjdW11bGF0b3IsIGNvbGxlY3Rpb25baW5kZXhdLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvck93bihjb2xsZWN0aW9uLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICBhY2N1bXVsYXRvciA9IG5vYWNjdW1cbiAgICAgICAgICAgID8gKG5vYWNjdW0gPSBmYWxzZSwgdmFsdWUpXG4gICAgICAgICAgICA6IGNhbGxiYWNrKGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjY3VtdWxhdG9yO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGxpa2UgYF8ucmVkdWNlYCBleGNlcHQgdGhhdCBpdCBpdGVyYXRlcyBvdmVyIGVsZW1lbnRzXG4gICAgICogb2YgYSBgY29sbGVjdGlvbmAgZnJvbSByaWdodCB0byBsZWZ0LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGFsaWFzIGZvbGRyXG4gICAgICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAgICAgKiBAcGFyYW0geyp9IFthY2N1bXVsYXRvcl0gSW5pdGlhbCB2YWx1ZSBvZiB0aGUgYWNjdW11bGF0b3IuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGFjY3VtdWxhdGVkIHZhbHVlLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgbGlzdCA9IFtbMCwgMV0sIFsyLCAzXSwgWzQsIDVdXTtcbiAgICAgKiB2YXIgZmxhdCA9IF8ucmVkdWNlUmlnaHQobGlzdCwgZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYS5jb25jYXQoYik7IH0sIFtdKTtcbiAgICAgKiAvLyA9PiBbNCwgNSwgMiwgMywgMCwgMV1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZWR1Y2VSaWdodChjb2xsZWN0aW9uLCBjYWxsYmFjaywgYWNjdW11bGF0b3IsIHRoaXNBcmcpIHtcbiAgICAgIHZhciBub2FjY3VtID0gYXJndW1lbnRzLmxlbmd0aCA8IDM7XG4gICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgNCk7XG4gICAgICBmb3JFYWNoUmlnaHQoY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgIGFjY3VtdWxhdG9yID0gbm9hY2N1bVxuICAgICAgICAgID8gKG5vYWNjdW0gPSBmYWxzZSwgdmFsdWUpXG4gICAgICAgICAgOiBjYWxsYmFjayhhY2N1bXVsYXRvciwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGFjY3VtdWxhdG9yO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBvcHBvc2l0ZSBvZiBgXy5maWx0ZXJgIHRoaXMgbWV0aG9kIHJldHVybnMgdGhlIGVsZW1lbnRzIG9mIGFcbiAgICAgKiBjb2xsZWN0aW9uIHRoYXQgdGhlIGNhbGxiYWNrIGRvZXMgKipub3QqKiByZXR1cm4gdHJ1ZXkgZm9yLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBpdGVyYXRpb24uIElmIGEgcHJvcGVydHkgbmFtZSBvciBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkXG4gICAgICogIHRvIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGEgbmV3IGFycmF5IG9mIGVsZW1lbnRzIHRoYXQgZmFpbGVkIHRoZSBjYWxsYmFjayBjaGVjay5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIG9kZHMgPSBfLnJlamVjdChbMSwgMiwgMywgNCwgNSwgNl0sIGZ1bmN0aW9uKG51bSkgeyByZXR1cm4gbnVtICUgMiA9PSAwOyB9KTtcbiAgICAgKiAvLyA9PiBbMSwgMywgNV1cbiAgICAgKlxuICAgICAqIHZhciBjaGFyYWN0ZXJzID0gW1xuICAgICAqICAgeyAnbmFtZSc6ICdiYXJuZXknLCAnYWdlJzogMzYsICdibG9ja2VkJzogZmFsc2UgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAnZnJlZCcsICAgJ2FnZSc6IDQwLCAnYmxvY2tlZCc6IHRydWUgfVxuICAgICAqIF07XG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ucGx1Y2tcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLnJlamVjdChjaGFyYWN0ZXJzLCAnYmxvY2tlZCcpO1xuICAgICAqIC8vID0+IFt7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiwgJ2Jsb2NrZWQnOiBmYWxzZSB9XVxuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLndoZXJlXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5yZWplY3QoY2hhcmFjdGVycywgeyAnYWdlJzogMzYgfSk7XG4gICAgICogLy8gPT4gW3sgJ25hbWUnOiAnZnJlZCcsICdhZ2UnOiA0MCwgJ2Jsb2NrZWQnOiB0cnVlIH1dXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVqZWN0KGNvbGxlY3Rpb24sIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG4gICAgICByZXR1cm4gZmlsdGVyKGNvbGxlY3Rpb24sIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgICByZXR1cm4gIWNhbGxiYWNrKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZXMgYSByYW5kb20gZWxlbWVudCBvciBgbmAgcmFuZG9tIGVsZW1lbnRzIGZyb20gYSBjb2xsZWN0aW9uLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIHNhbXBsZS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW25dIFRoZSBudW1iZXIgb2YgZWxlbWVudHMgdG8gc2FtcGxlLlxuICAgICAqIEBwYXJhbS0ge09iamVjdH0gW2d1YXJkXSBBbGxvd3Mgd29ya2luZyB3aXRoIGZ1bmN0aW9ucyBsaWtlIGBfLm1hcGBcbiAgICAgKiAgd2l0aG91dCB1c2luZyB0aGVpciBgaW5kZXhgIGFyZ3VtZW50cyBhcyBgbmAuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSByYW5kb20gc2FtcGxlKHMpIG9mIGBjb2xsZWN0aW9uYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5zYW1wbGUoWzEsIDIsIDMsIDRdKTtcbiAgICAgKiAvLyA9PiAyXG4gICAgICpcbiAgICAgKiBfLnNhbXBsZShbMSwgMiwgMywgNF0sIDIpO1xuICAgICAqIC8vID0+IFszLCAxXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHNhbXBsZShjb2xsZWN0aW9uLCBuLCBndWFyZCkge1xuICAgICAgaWYgKGNvbGxlY3Rpb24gJiYgdHlwZW9mIGNvbGxlY3Rpb24ubGVuZ3RoICE9ICdudW1iZXInKSB7XG4gICAgICAgIGNvbGxlY3Rpb24gPSB2YWx1ZXMoY29sbGVjdGlvbik7XG4gICAgICB9XG4gICAgICBpZiAobiA9PSBudWxsIHx8IGd1YXJkKSB7XG4gICAgICAgIHJldHVybiBjb2xsZWN0aW9uID8gY29sbGVjdGlvbltiYXNlUmFuZG9tKDAsIGNvbGxlY3Rpb24ubGVuZ3RoIC0gMSldIDogdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgdmFyIHJlc3VsdCA9IHNodWZmbGUoY29sbGVjdGlvbik7XG4gICAgICByZXN1bHQubGVuZ3RoID0gbmF0aXZlTWluKG5hdGl2ZU1heCgwLCBuKSwgcmVzdWx0Lmxlbmd0aCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgb2Ygc2h1ZmZsZWQgdmFsdWVzLCB1c2luZyBhIHZlcnNpb24gb2YgdGhlIEZpc2hlci1ZYXRlc1xuICAgICAqIHNodWZmbGUuIFNlZSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Zpc2hlci1ZYXRlc19zaHVmZmxlLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIHNodWZmbGUuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGEgbmV3IHNodWZmbGVkIGNvbGxlY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uc2h1ZmZsZShbMSwgMiwgMywgNCwgNSwgNl0pO1xuICAgICAqIC8vID0+IFs0LCAxLCA2LCAzLCA1LCAyXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHNodWZmbGUoY29sbGVjdGlvbikge1xuICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgbGVuZ3RoID0gY29sbGVjdGlvbiA/IGNvbGxlY3Rpb24ubGVuZ3RoIDogMCxcbiAgICAgICAgICByZXN1bHQgPSBBcnJheSh0eXBlb2YgbGVuZ3RoID09ICdudW1iZXInID8gbGVuZ3RoIDogMCk7XG5cbiAgICAgIGZvckVhY2goY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdmFyIHJhbmQgPSBiYXNlUmFuZG9tKDAsICsraW5kZXgpO1xuICAgICAgICByZXN1bHRbaW5kZXhdID0gcmVzdWx0W3JhbmRdO1xuICAgICAgICByZXN1bHRbcmFuZF0gPSB2YWx1ZTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBzaXplIG9mIHRoZSBgY29sbGVjdGlvbmAgYnkgcmV0dXJuaW5nIGBjb2xsZWN0aW9uLmxlbmd0aGAgZm9yIGFycmF5c1xuICAgICAqIGFuZCBhcnJheS1saWtlIG9iamVjdHMgb3IgdGhlIG51bWJlciBvZiBvd24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzIGZvciBvYmplY3RzLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGluc3BlY3QuXG4gICAgICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyBgY29sbGVjdGlvbi5sZW5ndGhgIG9yIG51bWJlciBvZiBvd24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLnNpemUoWzEsIDJdKTtcbiAgICAgKiAvLyA9PiAyXG4gICAgICpcbiAgICAgKiBfLnNpemUoeyAnb25lJzogMSwgJ3R3byc6IDIsICd0aHJlZSc6IDMgfSk7XG4gICAgICogLy8gPT4gM1xuICAgICAqXG4gICAgICogXy5zaXplKCdwZWJibGVzJyk7XG4gICAgICogLy8gPT4gN1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHNpemUoY29sbGVjdGlvbikge1xuICAgICAgdmFyIGxlbmd0aCA9IGNvbGxlY3Rpb24gPyBjb2xsZWN0aW9uLmxlbmd0aCA6IDA7XG4gICAgICByZXR1cm4gdHlwZW9mIGxlbmd0aCA9PSAnbnVtYmVyJyA/IGxlbmd0aCA6IGtleXMoY29sbGVjdGlvbikubGVuZ3RoO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiB0aGUgY2FsbGJhY2sgcmV0dXJucyBhIHRydWV5IHZhbHVlIGZvciAqKmFueSoqIGVsZW1lbnQgb2YgYVxuICAgICAqIGNvbGxlY3Rpb24uIFRoZSBmdW5jdGlvbiByZXR1cm5zIGFzIHNvb24gYXMgaXQgZmluZHMgYSBwYXNzaW5nIHZhbHVlIGFuZFxuICAgICAqIGRvZXMgbm90IGl0ZXJhdGUgb3ZlciB0aGUgZW50aXJlIGNvbGxlY3Rpb24uIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0b1xuICAgICAqIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIHRocmVlIGFyZ3VtZW50czsgKHZhbHVlLCBpbmRleHxrZXksIGNvbGxlY3Rpb24pLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAYWxpYXMgYW55XG4gICAgICogQGNhdGVnb3J5IENvbGxlY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZFxuICAgICAqICBwZXIgaXRlcmF0aW9uLiBJZiBhIHByb3BlcnR5IG5hbWUgb3Igb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZFxuICAgICAqICB0byBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhbnkgZWxlbWVudCBwYXNzZWQgdGhlIGNhbGxiYWNrIGNoZWNrLFxuICAgICAqICBlbHNlIGBmYWxzZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uc29tZShbbnVsbCwgMCwgJ3llcycsIGZhbHNlXSwgQm9vbGVhbik7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiwgJ2Jsb2NrZWQnOiBmYWxzZSB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdmcmVkJywgICAnYWdlJzogNDAsICdibG9ja2VkJzogdHJ1ZSB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy5wbHVja1wiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8uc29tZShjaGFyYWN0ZXJzLCAnYmxvY2tlZCcpO1xuICAgICAqIC8vID0+IHRydWVcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy53aGVyZVwiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8uc29tZShjaGFyYWN0ZXJzLCB7ICdhZ2UnOiAxIH0pO1xuICAgICAqIC8vID0+IGZhbHNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gc29tZShjb2xsZWN0aW9uLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIHJlc3VsdDtcbiAgICAgIGNhbGxiYWNrID0gbG9kYXNoLmNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAzKTtcblxuICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgbGVuZ3RoID0gY29sbGVjdGlvbiA/IGNvbGxlY3Rpb24ubGVuZ3RoIDogMDtcblxuICAgICAgaWYgKHR5cGVvZiBsZW5ndGggPT0gJ251bWJlcicpIHtcbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBpZiAoKHJlc3VsdCA9IGNhbGxiYWNrKGNvbGxlY3Rpb25baW5kZXhdLCBpbmRleCwgY29sbGVjdGlvbikpKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvck93bihjb2xsZWN0aW9uLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICByZXR1cm4gIShyZXN1bHQgPSBjYWxsYmFjayh2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gISFyZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBhcnJheSBvZiBlbGVtZW50cywgc29ydGVkIGluIGFzY2VuZGluZyBvcmRlciBieSB0aGUgcmVzdWx0cyBvZlxuICAgICAqIHJ1bm5pbmcgZWFjaCBlbGVtZW50IGluIGEgY29sbGVjdGlvbiB0aHJvdWdoIHRoZSBjYWxsYmFjay4gVGhpcyBtZXRob2RcbiAgICAgKiBwZXJmb3JtcyBhIHN0YWJsZSBzb3J0LCB0aGF0IGlzLCBpdCB3aWxsIHByZXNlcnZlIHRoZSBvcmlnaW5hbCBzb3J0IG9yZGVyXG4gICAgICogb2YgZXF1YWwgZWxlbWVudHMuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aFxuICAgICAqIHRocmVlIGFyZ3VtZW50czsgKHZhbHVlLCBpbmRleHxrZXksIGNvbGxlY3Rpb24pLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNvbGxlY3Rpb25cbiAgICAgKiB3aWxsIGJlIHNvcnRlZCBieSBlYWNoIHByb3BlcnR5IHZhbHVlLlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7QXJyYXl8RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBpdGVyYXRpb24uIElmIGEgcHJvcGVydHkgbmFtZSBvciBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkXG4gICAgICogIHRvIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGEgbmV3IGFycmF5IG9mIHNvcnRlZCBlbGVtZW50cy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5zb3J0QnkoWzEsIDIsIDNdLCBmdW5jdGlvbihudW0pIHsgcmV0dXJuIE1hdGguc2luKG51bSk7IH0pO1xuICAgICAqIC8vID0+IFszLCAxLCAyXVxuICAgICAqXG4gICAgICogXy5zb3J0QnkoWzEsIDIsIDNdLCBmdW5jdGlvbihudW0pIHsgcmV0dXJuIHRoaXMuc2luKG51bSk7IH0sIE1hdGgpO1xuICAgICAqIC8vID0+IFszLCAxLCAyXVxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICAnYWdlJzogMzYgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAnZnJlZCcsICAgICdhZ2UnOiA0MCB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdiYXJuZXknLCAgJ2FnZSc6IDI2IH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICAnYWdlJzogMzAgfVxuICAgICAqIF07XG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ucGx1Y2tcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLm1hcChfLnNvcnRCeShjaGFyYWN0ZXJzLCAnYWdlJyksIF8udmFsdWVzKTtcbiAgICAgKiAvLyA9PiBbWydiYXJuZXknLCAyNl0sIFsnZnJlZCcsIDMwXSwgWydiYXJuZXknLCAzNl0sIFsnZnJlZCcsIDQwXV1cbiAgICAgKlxuICAgICAqIC8vIHNvcnRpbmcgYnkgbXVsdGlwbGUgcHJvcGVydGllc1xuICAgICAqIF8ubWFwKF8uc29ydEJ5KGNoYXJhY3RlcnMsIFsnbmFtZScsICdhZ2UnXSksIF8udmFsdWVzKTtcbiAgICAgKiAvLyA9ID4gW1snYmFybmV5JywgMjZdLCBbJ2Jhcm5leScsIDM2XSwgWydmcmVkJywgMzBdLCBbJ2ZyZWQnLCA0MF1dXG4gICAgICovXG4gICAgZnVuY3Rpb24gc29ydEJ5KGNvbGxlY3Rpb24sIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICBpc0FyciA9IGlzQXJyYXkoY2FsbGJhY2spLFxuICAgICAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24gPyBjb2xsZWN0aW9uLmxlbmd0aCA6IDAsXG4gICAgICAgICAgcmVzdWx0ID0gQXJyYXkodHlwZW9mIGxlbmd0aCA9PSAnbnVtYmVyJyA/IGxlbmd0aCA6IDApO1xuXG4gICAgICBpZiAoIWlzQXJyKSB7XG4gICAgICAgIGNhbGxiYWNrID0gbG9kYXNoLmNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAzKTtcbiAgICAgIH1cbiAgICAgIGZvckVhY2goY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUsIGtleSwgY29sbGVjdGlvbikge1xuICAgICAgICB2YXIgb2JqZWN0ID0gcmVzdWx0WysraW5kZXhdID0gZ2V0T2JqZWN0KCk7XG4gICAgICAgIGlmIChpc0Fycikge1xuICAgICAgICAgIG9iamVjdC5jcml0ZXJpYSA9IG1hcChjYWxsYmFjaywgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAob2JqZWN0LmNyaXRlcmlhID0gZ2V0QXJyYXkoKSlbMF0gPSBjYWxsYmFjayh2YWx1ZSwga2V5LCBjb2xsZWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBvYmplY3QuaW5kZXggPSBpbmRleDtcbiAgICAgICAgb2JqZWN0LnZhbHVlID0gdmFsdWU7XG4gICAgICB9KTtcblxuICAgICAgbGVuZ3RoID0gcmVzdWx0Lmxlbmd0aDtcbiAgICAgIHJlc3VsdC5zb3J0KGNvbXBhcmVBc2NlbmRpbmcpO1xuICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgIHZhciBvYmplY3QgPSByZXN1bHRbbGVuZ3RoXTtcbiAgICAgICAgcmVzdWx0W2xlbmd0aF0gPSBvYmplY3QudmFsdWU7XG4gICAgICAgIGlmICghaXNBcnIpIHtcbiAgICAgICAgICByZWxlYXNlQXJyYXkob2JqZWN0LmNyaXRlcmlhKTtcbiAgICAgICAgfVxuICAgICAgICByZWxlYXNlT2JqZWN0KG9iamVjdCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnRzIHRoZSBgY29sbGVjdGlvbmAgdG8gYW4gYXJyYXkuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gY29udmVydC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBjb252ZXJ0ZWQgYXJyYXkuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIChmdW5jdGlvbigpIHsgcmV0dXJuIF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpOyB9KSgxLCAyLCAzLCA0KTtcbiAgICAgKiAvLyA9PiBbMiwgMywgNF1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0b0FycmF5KGNvbGxlY3Rpb24pIHtcbiAgICAgIGlmIChjb2xsZWN0aW9uICYmIHR5cGVvZiBjb2xsZWN0aW9uLmxlbmd0aCA9PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4gc2xpY2UoY29sbGVjdGlvbik7XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWVzKGNvbGxlY3Rpb24pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIGEgZGVlcCBjb21wYXJpc29uIG9mIGVhY2ggZWxlbWVudCBpbiBhIGBjb2xsZWN0aW9uYCB0byB0aGUgZ2l2ZW5cbiAgICAgKiBgcHJvcGVydGllc2Agb2JqZWN0LCByZXR1cm5pbmcgYW4gYXJyYXkgb2YgYWxsIGVsZW1lbnRzIHRoYXQgaGF2ZSBlcXVpdmFsZW50XG4gICAgICogcHJvcGVydHkgdmFsdWVzLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQHR5cGUgRnVuY3Rpb25cbiAgICAgKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyBUaGUgb2JqZWN0IG9mIHByb3BlcnR5IHZhbHVlcyB0byBmaWx0ZXIgYnkuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGEgbmV3IGFycmF5IG9mIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgZ2l2ZW4gcHJvcGVydGllcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiwgJ3BldHMnOiBbJ2hvcHB5J10gfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAnZnJlZCcsICAgJ2FnZSc6IDQwLCAncGV0cyc6IFsnYmFieSBwdXNzJywgJ2Rpbm8nXSB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIF8ud2hlcmUoY2hhcmFjdGVycywgeyAnYWdlJzogMzYgfSk7XG4gICAgICogLy8gPT4gW3sgJ25hbWUnOiAnYmFybmV5JywgJ2FnZSc6IDM2LCAncGV0cyc6IFsnaG9wcHknXSB9XVxuICAgICAqXG4gICAgICogXy53aGVyZShjaGFyYWN0ZXJzLCB7ICdwZXRzJzogWydkaW5vJ10gfSk7XG4gICAgICogLy8gPT4gW3sgJ25hbWUnOiAnZnJlZCcsICdhZ2UnOiA0MCwgJ3BldHMnOiBbJ2JhYnkgcHVzcycsICdkaW5vJ10gfV1cbiAgICAgKi9cbiAgICB2YXIgd2hlcmUgPSBmaWx0ZXI7XG5cbiAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgd2l0aCBhbGwgZmFsc2V5IHZhbHVlcyByZW1vdmVkLiBUaGUgdmFsdWVzIGBmYWxzZWAsIGBudWxsYCxcbiAgICAgKiBgMGAsIGBcIlwiYCwgYHVuZGVmaW5lZGAsIGFuZCBgTmFOYCBhcmUgYWxsIGZhbHNleS5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBBcnJheXNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gY29tcGFjdC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBuZXcgYXJyYXkgb2YgZmlsdGVyZWQgdmFsdWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmNvbXBhY3QoWzAsIDEsIGZhbHNlLCAyLCAnJywgM10pO1xuICAgICAqIC8vID0+IFsxLCAyLCAzXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNvbXBhY3QoYXJyYXkpIHtcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIGxlbmd0aCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMCxcbiAgICAgICAgICByZXN1bHQgPSBbXTtcblxuICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gYXJyYXlbaW5kZXhdO1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBhcnJheSBleGNsdWRpbmcgYWxsIHZhbHVlcyBvZiB0aGUgcHJvdmlkZWQgYXJyYXlzIHVzaW5nIHN0cmljdFxuICAgICAqIGVxdWFsaXR5IGZvciBjb21wYXJpc29ucywgaS5lLiBgPT09YC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBBcnJheXNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gcHJvY2Vzcy5cbiAgICAgKiBAcGFyYW0gey4uLkFycmF5fSBbdmFsdWVzXSBUaGUgYXJyYXlzIG9mIHZhbHVlcyB0byBleGNsdWRlLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhIG5ldyBhcnJheSBvZiBmaWx0ZXJlZCB2YWx1ZXMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uZGlmZmVyZW5jZShbMSwgMiwgMywgNCwgNV0sIFs1LCAyLCAxMF0pO1xuICAgICAqIC8vID0+IFsxLCAzLCA0XVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGRpZmZlcmVuY2UoYXJyYXkpIHtcbiAgICAgIHJldHVybiBiYXNlRGlmZmVyZW5jZShhcnJheSwgYmFzZUZsYXR0ZW4oYXJndW1lbnRzLCB0cnVlLCB0cnVlLCAxKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgaXMgbGlrZSBgXy5maW5kYCBleGNlcHQgdGhhdCBpdCByZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgZmlyc3RcbiAgICAgKiBlbGVtZW50IHRoYXQgcGFzc2VzIHRoZSBjYWxsYmFjayBjaGVjaywgaW5zdGVhZCBvZiB0aGUgZWxlbWVudCBpdHNlbGYuXG4gICAgICpcbiAgICAgKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLnBsdWNrXCIgc3R5bGVcbiAgICAgKiBjYWxsYmFjayB3aWxsIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tcbiAgICAgKiB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LFxuICAgICAqIGVsc2UgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBBcnJheXNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gc2VhcmNoLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBpdGVyYXRpb24uIElmIGEgcHJvcGVydHkgbmFtZSBvciBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkXG4gICAgICogIHRvIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIGZvdW5kIGVsZW1lbnQsIGVsc2UgYC0xYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICAnYWdlJzogMzYsICdibG9ja2VkJzogZmFsc2UgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAnZnJlZCcsICAgICdhZ2UnOiA0MCwgJ2Jsb2NrZWQnOiB0cnVlIH0sXG4gICAgICogICB7ICduYW1lJzogJ3BlYmJsZXMnLCAnYWdlJzogMSwgICdibG9ja2VkJzogZmFsc2UgfVxuICAgICAqIF07XG4gICAgICpcbiAgICAgKiBfLmZpbmRJbmRleChjaGFyYWN0ZXJzLCBmdW5jdGlvbihjaHIpIHtcbiAgICAgKiAgIHJldHVybiBjaHIuYWdlIDwgMjA7XG4gICAgICogfSk7XG4gICAgICogLy8gPT4gMlxuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLndoZXJlXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5maW5kSW5kZXgoY2hhcmFjdGVycywgeyAnYWdlJzogMzYgfSk7XG4gICAgICogLy8gPT4gMFxuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLnBsdWNrXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5maW5kSW5kZXgoY2hhcmFjdGVycywgJ2Jsb2NrZWQnKTtcbiAgICAgKiAvLyA9PiAxXG4gICAgICovXG4gICAgZnVuY3Rpb24gZmluZEluZGV4KGFycmF5LCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgbGVuZ3RoID0gYXJyYXkgPyBhcnJheS5sZW5ndGggOiAwO1xuXG4gICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICBpZiAoY2FsbGJhY2soYXJyYXlbaW5kZXhdLCBpbmRleCwgYXJyYXkpKSB7XG4gICAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgaXMgbGlrZSBgXy5maW5kSW5kZXhgIGV4Y2VwdCB0aGF0IGl0IGl0ZXJhdGVzIG92ZXIgZWxlbWVudHNcbiAgICAgKiBvZiBhIGBjb2xsZWN0aW9uYCBmcm9tIHJpZ2h0IHRvIGxlZnQuXG4gICAgICpcbiAgICAgKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLnBsdWNrXCIgc3R5bGVcbiAgICAgKiBjYWxsYmFjayB3aWxsIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tcbiAgICAgKiB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LFxuICAgICAqIGVsc2UgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBBcnJheXNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gc2VhcmNoLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBpdGVyYXRpb24uIElmIGEgcHJvcGVydHkgbmFtZSBvciBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkXG4gICAgICogIHRvIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIGZvdW5kIGVsZW1lbnQsIGVsc2UgYC0xYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICAnYWdlJzogMzYsICdibG9ja2VkJzogdHJ1ZSB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdmcmVkJywgICAgJ2FnZSc6IDQwLCAnYmxvY2tlZCc6IGZhbHNlIH0sXG4gICAgICogICB7ICduYW1lJzogJ3BlYmJsZXMnLCAnYWdlJzogMSwgICdibG9ja2VkJzogdHJ1ZSB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIF8uZmluZExhc3RJbmRleChjaGFyYWN0ZXJzLCBmdW5jdGlvbihjaHIpIHtcbiAgICAgKiAgIHJldHVybiBjaHIuYWdlID4gMzA7XG4gICAgICogfSk7XG4gICAgICogLy8gPT4gMVxuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLndoZXJlXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5maW5kTGFzdEluZGV4KGNoYXJhY3RlcnMsIHsgJ2FnZSc6IDM2IH0pO1xuICAgICAqIC8vID0+IDBcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy5wbHVja1wiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8uZmluZExhc3RJbmRleChjaGFyYWN0ZXJzLCAnYmxvY2tlZCcpO1xuICAgICAqIC8vID0+IDJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBmaW5kTGFzdEluZGV4KGFycmF5LCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIGxlbmd0aCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMDtcbiAgICAgIGNhbGxiYWNrID0gbG9kYXNoLmNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAzKTtcbiAgICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgICBpZiAoY2FsbGJhY2soYXJyYXlbbGVuZ3RoXSwgbGVuZ3RoLCBhcnJheSkpIHtcbiAgICAgICAgICByZXR1cm4gbGVuZ3RoO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgZmlyc3QgZWxlbWVudCBvciBmaXJzdCBgbmAgZWxlbWVudHMgb2YgYW4gYXJyYXkuIElmIGEgY2FsbGJhY2tcbiAgICAgKiBpcyBwcm92aWRlZCBlbGVtZW50cyBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBhcnJheSBhcmUgcmV0dXJuZWQgYXMgbG9uZ1xuICAgICAqIGFzIHRoZSBjYWxsYmFjayByZXR1cm5zIHRydWV5LiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZFxuICAgICAqIGludm9rZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM7ICh2YWx1ZSwgaW5kZXgsIGFycmF5KS5cbiAgICAgKlxuICAgICAqIElmIGEgcHJvcGVydHkgbmFtZSBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ucGx1Y2tcIiBzdHlsZVxuICAgICAqIGNhbGxiYWNrIHdpbGwgcmV0dXJuIHRoZSBwcm9wZXJ0eSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICAgKlxuICAgICAqIElmIGFuIG9iamVjdCBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFja1xuICAgICAqIHdpbGwgcmV0dXJuIGB0cnVlYCBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBnaXZlbiBvYmplY3QsXG4gICAgICogZWxzZSBgZmFsc2VgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGFsaWFzIGhlYWQsIHRha2VcbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHF1ZXJ5LlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fG51bWJlcnxzdHJpbmd9IFtjYWxsYmFja10gVGhlIGZ1bmN0aW9uIGNhbGxlZFxuICAgICAqICBwZXIgZWxlbWVudCBvciB0aGUgbnVtYmVyIG9mIGVsZW1lbnRzIHRvIHJldHVybi4gSWYgYSBwcm9wZXJ0eSBuYW1lIG9yXG4gICAgICogIG9iamVjdCBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIHVzZWQgdG8gY3JlYXRlIGEgXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCJcbiAgICAgKiAgc3R5bGUgY2FsbGJhY2ssIHJlc3BlY3RpdmVseS5cbiAgICAgKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICAgKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgZmlyc3QgZWxlbWVudChzKSBvZiBgYXJyYXlgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmZpcnN0KFsxLCAyLCAzXSk7XG4gICAgICogLy8gPT4gMVxuICAgICAqXG4gICAgICogXy5maXJzdChbMSwgMiwgM10sIDIpO1xuICAgICAqIC8vID0+IFsxLCAyXVxuICAgICAqXG4gICAgICogXy5maXJzdChbMSwgMiwgM10sIGZ1bmN0aW9uKG51bSkge1xuICAgICAqICAgcmV0dXJuIG51bSA8IDM7XG4gICAgICogfSk7XG4gICAgICogLy8gPT4gWzEsIDJdXG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgICdibG9ja2VkJzogdHJ1ZSwgICdlbXBsb3llcic6ICdzbGF0ZScgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAnZnJlZCcsICAgICdibG9ja2VkJzogZmFsc2UsICdlbXBsb3llcic6ICdzbGF0ZScgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAncGViYmxlcycsICdibG9ja2VkJzogdHJ1ZSwgICdlbXBsb3llcic6ICduYScgfVxuICAgICAqIF07XG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ucGx1Y2tcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLmZpcnN0KGNoYXJhY3RlcnMsICdibG9ja2VkJyk7XG4gICAgICogLy8gPT4gW3sgJ25hbWUnOiAnYmFybmV5JywgJ2Jsb2NrZWQnOiB0cnVlLCAnZW1wbG95ZXInOiAnc2xhdGUnIH1dXG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ud2hlcmVcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLnBsdWNrKF8uZmlyc3QoY2hhcmFjdGVycywgeyAnZW1wbG95ZXInOiAnc2xhdGUnIH0pLCAnbmFtZScpO1xuICAgICAqIC8vID0+IFsnYmFybmV5JywgJ2ZyZWQnXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZpcnN0KGFycmF5LCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIG4gPSAwLFxuICAgICAgICAgIGxlbmd0aCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMDtcblxuICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPSAnbnVtYmVyJyAmJiBjYWxsYmFjayAhPSBudWxsKSB7XG4gICAgICAgIHZhciBpbmRleCA9IC0xO1xuICAgICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG4gICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoICYmIGNhbGxiYWNrKGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KSkge1xuICAgICAgICAgIG4rKztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbiA9IGNhbGxiYWNrO1xuICAgICAgICBpZiAobiA9PSBudWxsIHx8IHRoaXNBcmcpIHtcbiAgICAgICAgICByZXR1cm4gYXJyYXkgPyBhcnJheVswXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHNsaWNlKGFycmF5LCAwLCBuYXRpdmVNaW4obmF0aXZlTWF4KDAsIG4pLCBsZW5ndGgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGbGF0dGVucyBhIG5lc3RlZCBhcnJheSAodGhlIG5lc3RpbmcgY2FuIGJlIHRvIGFueSBkZXB0aCkuIElmIGBpc1NoYWxsb3dgXG4gICAgICogaXMgdHJ1ZXksIHRoZSBhcnJheSB3aWxsIG9ubHkgYmUgZmxhdHRlbmVkIGEgc2luZ2xlIGxldmVsLiBJZiBhIGNhbGxiYWNrXG4gICAgICogaXMgcHJvdmlkZWQgZWFjaCBlbGVtZW50IG9mIHRoZSBhcnJheSBpcyBwYXNzZWQgdGhyb3VnaCB0aGUgY2FsbGJhY2sgYmVmb3JlXG4gICAgICogZmxhdHRlbmluZy4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIHRocmVlXG4gICAgICogYXJndW1lbnRzOyAodmFsdWUsIGluZGV4LCBhcnJheSkuXG4gICAgICpcbiAgICAgKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLnBsdWNrXCIgc3R5bGVcbiAgICAgKiBjYWxsYmFjayB3aWxsIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tcbiAgICAgKiB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LFxuICAgICAqIGVsc2UgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBBcnJheXNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gZmxhdHRlbi5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1NoYWxsb3c9ZmFsc2VdIEEgZmxhZyB0byByZXN0cmljdCBmbGF0dGVuaW5nIHRvIGEgc2luZ2xlIGxldmVsLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkXG4gICAgICogIHBlciBpdGVyYXRpb24uIElmIGEgcHJvcGVydHkgbmFtZSBvciBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkXG4gICAgICogIHRvIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGEgbmV3IGZsYXR0ZW5lZCBhcnJheS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5mbGF0dGVuKFsxLCBbMl0sIFszLCBbWzRdXV1dKTtcbiAgICAgKiAvLyA9PiBbMSwgMiwgMywgNF07XG4gICAgICpcbiAgICAgKiBfLmZsYXR0ZW4oWzEsIFsyXSwgWzMsIFtbNF1dXV0sIHRydWUpO1xuICAgICAqIC8vID0+IFsxLCAyLCAzLCBbWzRdXV07XG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgJ2FnZSc6IDMwLCAncGV0cyc6IFsnaG9wcHknXSB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdmcmVkJywgICAnYWdlJzogNDAsICdwZXRzJzogWydiYWJ5IHB1c3MnLCAnZGlubyddIH1cbiAgICAgKiBdO1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLnBsdWNrXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5mbGF0dGVuKGNoYXJhY3RlcnMsICdwZXRzJyk7XG4gICAgICogLy8gPT4gWydob3BweScsICdiYWJ5IHB1c3MnLCAnZGlubyddXG4gICAgICovXG4gICAgZnVuY3Rpb24gZmxhdHRlbihhcnJheSwgaXNTaGFsbG93LCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgLy8ganVnZ2xlIGFyZ3VtZW50c1xuICAgICAgaWYgKHR5cGVvZiBpc1NoYWxsb3cgIT0gJ2Jvb2xlYW4nICYmIGlzU2hhbGxvdyAhPSBudWxsKSB7XG4gICAgICAgIHRoaXNBcmcgPSBjYWxsYmFjaztcbiAgICAgICAgY2FsbGJhY2sgPSAodHlwZW9mIGlzU2hhbGxvdyAhPSAnZnVuY3Rpb24nICYmIHRoaXNBcmcgJiYgdGhpc0FyZ1tpc1NoYWxsb3ddID09PSBhcnJheSkgPyBudWxsIDogaXNTaGFsbG93O1xuICAgICAgICBpc1NoYWxsb3cgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChjYWxsYmFjayAhPSBudWxsKSB7XG4gICAgICAgIGFycmF5ID0gbWFwKGFycmF5LCBjYWxsYmFjaywgdGhpc0FyZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYmFzZUZsYXR0ZW4oYXJyYXksIGlzU2hhbGxvdyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgaW5kZXggYXQgd2hpY2ggdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgYHZhbHVlYCBpcyBmb3VuZCB1c2luZ1xuICAgICAqIHN0cmljdCBlcXVhbGl0eSBmb3IgY29tcGFyaXNvbnMsIGkuZS4gYD09PWAuIElmIHRoZSBhcnJheSBpcyBhbHJlYWR5IHNvcnRlZFxuICAgICAqIHByb3ZpZGluZyBgdHJ1ZWAgZm9yIGBmcm9tSW5kZXhgIHdpbGwgcnVuIGEgZmFzdGVyIGJpbmFyeSBzZWFyY2guXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHNlYXJjaC5cbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZWFyY2ggZm9yLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbnxudW1iZXJ9IFtmcm9tSW5kZXg9MF0gVGhlIGluZGV4IHRvIHNlYXJjaCBmcm9tIG9yIGB0cnVlYFxuICAgICAqICB0byBwZXJmb3JtIGEgYmluYXJ5IHNlYXJjaCBvbiBhIHNvcnRlZCBhcnJheS5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbWF0Y2hlZCB2YWx1ZSBvciBgLTFgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmluZGV4T2YoWzEsIDIsIDMsIDEsIDIsIDNdLCAyKTtcbiAgICAgKiAvLyA9PiAxXG4gICAgICpcbiAgICAgKiBfLmluZGV4T2YoWzEsIDIsIDMsIDEsIDIsIDNdLCAyLCAzKTtcbiAgICAgKiAvLyA9PiA0XG4gICAgICpcbiAgICAgKiBfLmluZGV4T2YoWzEsIDEsIDIsIDIsIDMsIDNdLCAyLCB0cnVlKTtcbiAgICAgKiAvLyA9PiAyXG4gICAgICovXG4gICAgZnVuY3Rpb24gaW5kZXhPZihhcnJheSwgdmFsdWUsIGZyb21JbmRleCkge1xuICAgICAgaWYgKHR5cGVvZiBmcm9tSW5kZXggPT0gJ251bWJlcicpIHtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMDtcbiAgICAgICAgZnJvbUluZGV4ID0gKGZyb21JbmRleCA8IDAgPyBuYXRpdmVNYXgoMCwgbGVuZ3RoICsgZnJvbUluZGV4KSA6IGZyb21JbmRleCB8fCAwKTtcbiAgICAgIH0gZWxzZSBpZiAoZnJvbUluZGV4KSB7XG4gICAgICAgIHZhciBpbmRleCA9IHNvcnRlZEluZGV4KGFycmF5LCB2YWx1ZSk7XG4gICAgICAgIHJldHVybiBhcnJheVtpbmRleF0gPT09IHZhbHVlID8gaW5kZXggOiAtMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBiYXNlSW5kZXhPZihhcnJheSwgdmFsdWUsIGZyb21JbmRleCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyBhbGwgYnV0IHRoZSBsYXN0IGVsZW1lbnQgb3IgbGFzdCBgbmAgZWxlbWVudHMgb2YgYW4gYXJyYXkuIElmIGFcbiAgICAgKiBjYWxsYmFjayBpcyBwcm92aWRlZCBlbGVtZW50cyBhdCB0aGUgZW5kIG9mIHRoZSBhcnJheSBhcmUgZXhjbHVkZWQgZnJvbVxuICAgICAqIHRoZSByZXN1bHQgYXMgbG9uZyBhcyB0aGUgY2FsbGJhY2sgcmV0dXJucyB0cnVleS4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kXG4gICAgICogdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkIHdpdGggdGhyZWUgYXJndW1lbnRzOyAodmFsdWUsIGluZGV4LCBhcnJheSkuXG4gICAgICpcbiAgICAgKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLnBsdWNrXCIgc3R5bGVcbiAgICAgKiBjYWxsYmFjayB3aWxsIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tcbiAgICAgKiB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LFxuICAgICAqIGVsc2UgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBBcnJheXNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gcXVlcnkuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8bnVtYmVyfHN0cmluZ30gW2NhbGxiYWNrPTFdIFRoZSBmdW5jdGlvbiBjYWxsZWRcbiAgICAgKiAgcGVyIGVsZW1lbnQgb3IgdGhlIG51bWJlciBvZiBlbGVtZW50cyB0byBleGNsdWRlLiBJZiBhIHByb3BlcnR5IG5hbWUgb3JcbiAgICAgKiAgb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZCB0byBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIlxuICAgICAqICBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhIHNsaWNlIG9mIGBhcnJheWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8uaW5pdGlhbChbMSwgMiwgM10pO1xuICAgICAqIC8vID0+IFsxLCAyXVxuICAgICAqXG4gICAgICogXy5pbml0aWFsKFsxLCAyLCAzXSwgMik7XG4gICAgICogLy8gPT4gWzFdXG4gICAgICpcbiAgICAgKiBfLmluaXRpYWwoWzEsIDIsIDNdLCBmdW5jdGlvbihudW0pIHtcbiAgICAgKiAgIHJldHVybiBudW0gPiAxO1xuICAgICAqIH0pO1xuICAgICAqIC8vID0+IFsxXVxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICAnYmxvY2tlZCc6IGZhbHNlLCAnZW1wbG95ZXInOiAnc2xhdGUnIH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICAnYmxvY2tlZCc6IHRydWUsICAnZW1wbG95ZXInOiAnc2xhdGUnIH0sXG4gICAgICogICB7ICduYW1lJzogJ3BlYmJsZXMnLCAnYmxvY2tlZCc6IHRydWUsICAnZW1wbG95ZXInOiAnbmEnIH1cbiAgICAgKiBdO1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLnBsdWNrXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5pbml0aWFsKGNoYXJhY3RlcnMsICdibG9ja2VkJyk7XG4gICAgICogLy8gPT4gW3sgJ25hbWUnOiAnYmFybmV5JywgICdibG9ja2VkJzogZmFsc2UsICdlbXBsb3llcic6ICdzbGF0ZScgfV1cbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy53aGVyZVwiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8ucGx1Y2soXy5pbml0aWFsKGNoYXJhY3RlcnMsIHsgJ2VtcGxveWVyJzogJ25hJyB9KSwgJ25hbWUnKTtcbiAgICAgKiAvLyA9PiBbJ2Jhcm5leScsICdmcmVkJ11cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpbml0aWFsKGFycmF5LCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIG4gPSAwLFxuICAgICAgICAgIGxlbmd0aCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMDtcblxuICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPSAnbnVtYmVyJyAmJiBjYWxsYmFjayAhPSBudWxsKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGxlbmd0aDtcbiAgICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgICB3aGlsZSAoaW5kZXgtLSAmJiBjYWxsYmFjayhhcnJheVtpbmRleF0sIGluZGV4LCBhcnJheSkpIHtcbiAgICAgICAgICBuKys7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG4gPSAoY2FsbGJhY2sgPT0gbnVsbCB8fCB0aGlzQXJnKSA/IDEgOiBjYWxsYmFjayB8fCBuO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNsaWNlKGFycmF5LCAwLCBuYXRpdmVNaW4obmF0aXZlTWF4KDAsIGxlbmd0aCAtIG4pLCBsZW5ndGgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGFycmF5IG9mIHVuaXF1ZSB2YWx1ZXMgcHJlc2VudCBpbiBhbGwgcHJvdmlkZWQgYXJyYXlzIHVzaW5nXG4gICAgICogc3RyaWN0IGVxdWFsaXR5IGZvciBjb21wYXJpc29ucywgaS5lLiBgPT09YC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBBcnJheXNcbiAgICAgKiBAcGFyYW0gey4uLkFycmF5fSBbYXJyYXldIFRoZSBhcnJheXMgdG8gaW5zcGVjdC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYW4gYXJyYXkgb2Ygc2hhcmVkIHZhbHVlcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5pbnRlcnNlY3Rpb24oWzEsIDIsIDNdLCBbNSwgMiwgMSwgNF0sIFsyLCAxXSk7XG4gICAgICogLy8gPT4gWzEsIDJdXG4gICAgICovXG4gICAgZnVuY3Rpb24gaW50ZXJzZWN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBbXSxcbiAgICAgICAgICBhcmdzSW5kZXggPSAtMSxcbiAgICAgICAgICBhcmdzTGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aCxcbiAgICAgICAgICBjYWNoZXMgPSBnZXRBcnJheSgpLFxuICAgICAgICAgIGluZGV4T2YgPSBnZXRJbmRleE9mKCksXG4gICAgICAgICAgdHJ1c3RJbmRleE9mID0gaW5kZXhPZiA9PT0gYmFzZUluZGV4T2YsXG4gICAgICAgICAgc2VlbiA9IGdldEFycmF5KCk7XG5cbiAgICAgIHdoaWxlICgrK2FyZ3NJbmRleCA8IGFyZ3NMZW5ndGgpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gYXJndW1lbnRzW2FyZ3NJbmRleF07XG4gICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSB8fCBpc0FyZ3VtZW50cyh2YWx1ZSkpIHtcbiAgICAgICAgICBhcmdzLnB1c2godmFsdWUpO1xuICAgICAgICAgIGNhY2hlcy5wdXNoKHRydXN0SW5kZXhPZiAmJiB2YWx1ZS5sZW5ndGggPj0gbGFyZ2VBcnJheVNpemUgJiZcbiAgICAgICAgICAgIGNyZWF0ZUNhY2hlKGFyZ3NJbmRleCA/IGFyZ3NbYXJnc0luZGV4XSA6IHNlZW4pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdmFyIGFycmF5ID0gYXJnc1swXSxcbiAgICAgICAgICBpbmRleCA9IC0xLFxuICAgICAgICAgIGxlbmd0aCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMCxcbiAgICAgICAgICByZXN1bHQgPSBbXTtcblxuICAgICAgb3V0ZXI6XG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICB2YXIgY2FjaGUgPSBjYWNoZXNbMF07XG4gICAgICAgIHZhbHVlID0gYXJyYXlbaW5kZXhdO1xuXG4gICAgICAgIGlmICgoY2FjaGUgPyBjYWNoZUluZGV4T2YoY2FjaGUsIHZhbHVlKSA6IGluZGV4T2Yoc2VlbiwgdmFsdWUpKSA8IDApIHtcbiAgICAgICAgICBhcmdzSW5kZXggPSBhcmdzTGVuZ3RoO1xuICAgICAgICAgIChjYWNoZSB8fCBzZWVuKS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICB3aGlsZSAoLS1hcmdzSW5kZXgpIHtcbiAgICAgICAgICAgIGNhY2hlID0gY2FjaGVzW2FyZ3NJbmRleF07XG4gICAgICAgICAgICBpZiAoKGNhY2hlID8gY2FjaGVJbmRleE9mKGNhY2hlLCB2YWx1ZSkgOiBpbmRleE9mKGFyZ3NbYXJnc0luZGV4XSwgdmFsdWUpKSA8IDApIHtcbiAgICAgICAgICAgICAgY29udGludWUgb3V0ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgd2hpbGUgKGFyZ3NMZW5ndGgtLSkge1xuICAgICAgICBjYWNoZSA9IGNhY2hlc1thcmdzTGVuZ3RoXTtcbiAgICAgICAgaWYgKGNhY2hlKSB7XG4gICAgICAgICAgcmVsZWFzZU9iamVjdChjYWNoZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlbGVhc2VBcnJheShjYWNoZXMpO1xuICAgICAgcmVsZWFzZUFycmF5KHNlZW4pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBsYXN0IGVsZW1lbnQgb3IgbGFzdCBgbmAgZWxlbWVudHMgb2YgYW4gYXJyYXkuIElmIGEgY2FsbGJhY2sgaXNcbiAgICAgKiBwcm92aWRlZCBlbGVtZW50cyBhdCB0aGUgZW5kIG9mIHRoZSBhcnJheSBhcmUgcmV0dXJuZWQgYXMgbG9uZyBhcyB0aGVcbiAgICAgKiBjYWxsYmFjayByZXR1cm5zIHRydWV5LiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkXG4gICAgICogd2l0aCB0aHJlZSBhcmd1bWVudHM7ICh2YWx1ZSwgaW5kZXgsIGFycmF5KS5cbiAgICAgKlxuICAgICAqIElmIGEgcHJvcGVydHkgbmFtZSBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ucGx1Y2tcIiBzdHlsZVxuICAgICAqIGNhbGxiYWNrIHdpbGwgcmV0dXJuIHRoZSBwcm9wZXJ0eSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICAgKlxuICAgICAqIElmIGFuIG9iamVjdCBpcyBwcm92aWRlZCBmb3IgYGNhbGxiYWNrYCB0aGUgY3JlYXRlZCBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFja1xuICAgICAqIHdpbGwgcmV0dXJuIGB0cnVlYCBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBnaXZlbiBvYmplY3QsXG4gICAgICogZWxzZSBgZmFsc2VgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IEFycmF5c1xuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBxdWVyeS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxudW1iZXJ8c3RyaW5nfSBbY2FsbGJhY2tdIFRoZSBmdW5jdGlvbiBjYWxsZWRcbiAgICAgKiAgcGVyIGVsZW1lbnQgb3IgdGhlIG51bWJlciBvZiBlbGVtZW50cyB0byByZXR1cm4uIElmIGEgcHJvcGVydHkgbmFtZSBvclxuICAgICAqICBvYmplY3QgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZSB1c2VkIHRvIGNyZWF0ZSBhIFwiXy5wbHVja1wiIG9yIFwiXy53aGVyZVwiXG4gICAgICogIHN0eWxlIGNhbGxiYWNrLCByZXNwZWN0aXZlbHkuXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGxhc3QgZWxlbWVudChzKSBvZiBgYXJyYXlgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmxhc3QoWzEsIDIsIDNdKTtcbiAgICAgKiAvLyA9PiAzXG4gICAgICpcbiAgICAgKiBfLmxhc3QoWzEsIDIsIDNdLCAyKTtcbiAgICAgKiAvLyA9PiBbMiwgM11cbiAgICAgKlxuICAgICAqIF8ubGFzdChbMSwgMiwgM10sIGZ1bmN0aW9uKG51bSkge1xuICAgICAqICAgcmV0dXJuIG51bSA+IDE7XG4gICAgICogfSk7XG4gICAgICogLy8gPT4gWzIsIDNdXG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgICdibG9ja2VkJzogZmFsc2UsICdlbXBsb3llcic6ICdzbGF0ZScgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAnZnJlZCcsICAgICdibG9ja2VkJzogdHJ1ZSwgICdlbXBsb3llcic6ICdzbGF0ZScgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAncGViYmxlcycsICdibG9ja2VkJzogdHJ1ZSwgICdlbXBsb3llcic6ICduYScgfVxuICAgICAqIF07XG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ucGx1Y2tcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLnBsdWNrKF8ubGFzdChjaGFyYWN0ZXJzLCAnYmxvY2tlZCcpLCAnbmFtZScpO1xuICAgICAqIC8vID0+IFsnZnJlZCcsICdwZWJibGVzJ11cbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy53aGVyZVwiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8ubGFzdChjaGFyYWN0ZXJzLCB7ICdlbXBsb3llcic6ICduYScgfSk7XG4gICAgICogLy8gPT4gW3sgJ25hbWUnOiAncGViYmxlcycsICdibG9ja2VkJzogdHJ1ZSwgJ2VtcGxveWVyJzogJ25hJyB9XVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGxhc3QoYXJyYXksIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICB2YXIgbiA9IDAsXG4gICAgICAgICAgbGVuZ3RoID0gYXJyYXkgPyBhcnJheS5sZW5ndGggOiAwO1xuXG4gICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9ICdudW1iZXInICYmIGNhbGxiYWNrICE9IG51bGwpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gbGVuZ3RoO1xuICAgICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMyk7XG4gICAgICAgIHdoaWxlIChpbmRleC0tICYmIGNhbGxiYWNrKGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KSkge1xuICAgICAgICAgIG4rKztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbiA9IGNhbGxiYWNrO1xuICAgICAgICBpZiAobiA9PSBudWxsIHx8IHRoaXNBcmcpIHtcbiAgICAgICAgICByZXR1cm4gYXJyYXkgPyBhcnJheVtsZW5ndGggLSAxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHNsaWNlKGFycmF5LCBuYXRpdmVNYXgoMCwgbGVuZ3RoIC0gbikpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIGluZGV4IGF0IHdoaWNoIHRoZSBsYXN0IG9jY3VycmVuY2Ugb2YgYHZhbHVlYCBpcyBmb3VuZCB1c2luZyBzdHJpY3RcbiAgICAgKiBlcXVhbGl0eSBmb3IgY29tcGFyaXNvbnMsIGkuZS4gYD09PWAuIElmIGBmcm9tSW5kZXhgIGlzIG5lZ2F0aXZlLCBpdCBpcyB1c2VkXG4gICAgICogYXMgdGhlIG9mZnNldCBmcm9tIHRoZSBlbmQgb2YgdGhlIGNvbGxlY3Rpb24uXG4gICAgICpcbiAgICAgKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLnBsdWNrXCIgc3R5bGVcbiAgICAgKiBjYWxsYmFjayB3aWxsIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tcbiAgICAgKiB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LFxuICAgICAqIGVsc2UgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBBcnJheXNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gc2VhcmNoLlxuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNlYXJjaCBmb3IuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtmcm9tSW5kZXg9YXJyYXkubGVuZ3RoLTFdIFRoZSBpbmRleCB0byBzZWFyY2ggZnJvbS5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbWF0Y2hlZCB2YWx1ZSBvciBgLTFgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmxhc3RJbmRleE9mKFsxLCAyLCAzLCAxLCAyLCAzXSwgMik7XG4gICAgICogLy8gPT4gNFxuICAgICAqXG4gICAgICogXy5sYXN0SW5kZXhPZihbMSwgMiwgMywgMSwgMiwgM10sIDIsIDMpO1xuICAgICAqIC8vID0+IDFcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBsYXN0SW5kZXhPZihhcnJheSwgdmFsdWUsIGZyb21JbmRleCkge1xuICAgICAgdmFyIGluZGV4ID0gYXJyYXkgPyBhcnJheS5sZW5ndGggOiAwO1xuICAgICAgaWYgKHR5cGVvZiBmcm9tSW5kZXggPT0gJ251bWJlcicpIHtcbiAgICAgICAgaW5kZXggPSAoZnJvbUluZGV4IDwgMCA/IG5hdGl2ZU1heCgwLCBpbmRleCArIGZyb21JbmRleCkgOiBuYXRpdmVNaW4oZnJvbUluZGV4LCBpbmRleCAtIDEpKSArIDE7XG4gICAgICB9XG4gICAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgICBpZiAoYXJyYXlbaW5kZXhdID09PSB2YWx1ZSkge1xuICAgICAgICAgIHJldHVybiBpbmRleDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYWxsIHByb3ZpZGVkIHZhbHVlcyBmcm9tIHRoZSBnaXZlbiBhcnJheSB1c2luZyBzdHJpY3QgZXF1YWxpdHkgZm9yXG4gICAgICogY29tcGFyaXNvbnMsIGkuZS4gYD09PWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIG1vZGlmeS5cbiAgICAgKiBAcGFyYW0gey4uLip9IFt2YWx1ZV0gVGhlIHZhbHVlcyB0byByZW1vdmUuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGBhcnJheWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBhcnJheSA9IFsxLCAyLCAzLCAxLCAyLCAzXTtcbiAgICAgKiBfLnB1bGwoYXJyYXksIDIsIDMpO1xuICAgICAqIGNvbnNvbGUubG9nKGFycmF5KTtcbiAgICAgKiAvLyA9PiBbMSwgMV1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBwdWxsKGFycmF5KSB7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgICBhcmdzSW5kZXggPSAwLFxuICAgICAgICAgIGFyZ3NMZW5ndGggPSBhcmdzLmxlbmd0aCxcbiAgICAgICAgICBsZW5ndGggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IDA7XG5cbiAgICAgIHdoaWxlICgrK2FyZ3NJbmRleCA8IGFyZ3NMZW5ndGgpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgICB2YWx1ZSA9IGFyZ3NbYXJnc0luZGV4XTtcbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBpZiAoYXJyYXlbaW5kZXhdID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgc3BsaWNlLmNhbGwoYXJyYXksIGluZGV4LS0sIDEpO1xuICAgICAgICAgICAgbGVuZ3RoLS07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBhcnJheSBvZiBudW1iZXJzIChwb3NpdGl2ZSBhbmQvb3IgbmVnYXRpdmUpIHByb2dyZXNzaW5nIGZyb21cbiAgICAgKiBgc3RhcnRgIHVwIHRvIGJ1dCBub3QgaW5jbHVkaW5nIGBlbmRgLiBJZiBgc3RhcnRgIGlzIGxlc3MgdGhhbiBgc3RvcGAgYVxuICAgICAqIHplcm8tbGVuZ3RoIHJhbmdlIGlzIGNyZWF0ZWQgdW5sZXNzIGEgbmVnYXRpdmUgYHN0ZXBgIGlzIHNwZWNpZmllZC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBBcnJheXNcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0PTBdIFRoZSBzdGFydCBvZiB0aGUgcmFuZ2UuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGVuZCBUaGUgZW5kIG9mIHRoZSByYW5nZS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3N0ZXA9MV0gVGhlIHZhbHVlIHRvIGluY3JlbWVudCBvciBkZWNyZW1lbnQgYnkuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGEgbmV3IHJhbmdlIGFycmF5LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLnJhbmdlKDQpO1xuICAgICAqIC8vID0+IFswLCAxLCAyLCAzXVxuICAgICAqXG4gICAgICogXy5yYW5nZSgxLCA1KTtcbiAgICAgKiAvLyA9PiBbMSwgMiwgMywgNF1cbiAgICAgKlxuICAgICAqIF8ucmFuZ2UoMCwgMjAsIDUpO1xuICAgICAqIC8vID0+IFswLCA1LCAxMCwgMTVdXG4gICAgICpcbiAgICAgKiBfLnJhbmdlKDAsIC00LCAtMSk7XG4gICAgICogLy8gPT4gWzAsIC0xLCAtMiwgLTNdXG4gICAgICpcbiAgICAgKiBfLnJhbmdlKDEsIDQsIDApO1xuICAgICAqIC8vID0+IFsxLCAxLCAxXVxuICAgICAqXG4gICAgICogXy5yYW5nZSgwKTtcbiAgICAgKiAvLyA9PiBbXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJhbmdlKHN0YXJ0LCBlbmQsIHN0ZXApIHtcbiAgICAgIHN0YXJ0ID0gK3N0YXJ0IHx8IDA7XG4gICAgICBzdGVwID0gdHlwZW9mIHN0ZXAgPT0gJ251bWJlcicgPyBzdGVwIDogKCtzdGVwIHx8IDEpO1xuXG4gICAgICBpZiAoZW5kID09IG51bGwpIHtcbiAgICAgICAgZW5kID0gc3RhcnQ7XG4gICAgICAgIHN0YXJ0ID0gMDtcbiAgICAgIH1cbiAgICAgIC8vIHVzZSBgQXJyYXkobGVuZ3RoKWAgc28gZW5naW5lcyBsaWtlIENoYWtyYSBhbmQgVjggYXZvaWQgc2xvd2VyIG1vZGVzXG4gICAgICAvLyBodHRwOi8veW91dHUuYmUvWEFxSXBHVThaWmsjdD0xN20yNXNcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIGxlbmd0aCA9IG5hdGl2ZU1heCgwLCBjZWlsKChlbmQgLSBzdGFydCkgLyAoc3RlcCB8fCAxKSkpLFxuICAgICAgICAgIHJlc3VsdCA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIHJlc3VsdFtpbmRleF0gPSBzdGFydDtcbiAgICAgICAgc3RhcnQgKz0gc3RlcDtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhbGwgZWxlbWVudHMgZnJvbSBhbiBhcnJheSB0aGF0IHRoZSBjYWxsYmFjayByZXR1cm5zIHRydWV5IGZvclxuICAgICAqIGFuZCByZXR1cm5zIGFuIGFycmF5IG9mIHJlbW92ZWQgZWxlbWVudHMuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2BcbiAgICAgKiBhbmQgaW52b2tlZCB3aXRoIHRocmVlIGFyZ3VtZW50czsgKHZhbHVlLCBpbmRleCwgYXJyYXkpLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIG1vZGlmeS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZFxuICAgICAqICBwZXIgaXRlcmF0aW9uLiBJZiBhIHByb3BlcnR5IG5hbWUgb3Igb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZFxuICAgICAqICB0byBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhIG5ldyBhcnJheSBvZiByZW1vdmVkIGVsZW1lbnRzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgYXJyYXkgPSBbMSwgMiwgMywgNCwgNSwgNl07XG4gICAgICogdmFyIGV2ZW5zID0gXy5yZW1vdmUoYXJyYXksIGZ1bmN0aW9uKG51bSkgeyByZXR1cm4gbnVtICUgMiA9PSAwOyB9KTtcbiAgICAgKlxuICAgICAqIGNvbnNvbGUubG9nKGFycmF5KTtcbiAgICAgKiAvLyA9PiBbMSwgMywgNV1cbiAgICAgKlxuICAgICAqIGNvbnNvbGUubG9nKGV2ZW5zKTtcbiAgICAgKiAvLyA9PiBbMiwgNCwgNl1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZW1vdmUoYXJyYXksIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICBsZW5ndGggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IDAsXG4gICAgICAgICAgcmVzdWx0ID0gW107XG5cbiAgICAgIGNhbGxiYWNrID0gbG9kYXNoLmNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAzKTtcbiAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IGFycmF5W2luZGV4XTtcbiAgICAgICAgaWYgKGNhbGxiYWNrKHZhbHVlLCBpbmRleCwgYXJyYXkpKSB7XG4gICAgICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgICAgICAgIHNwbGljZS5jYWxsKGFycmF5LCBpbmRleC0tLCAxKTtcbiAgICAgICAgICBsZW5ndGgtLTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgb3Bwb3NpdGUgb2YgYF8uaW5pdGlhbGAgdGhpcyBtZXRob2QgZ2V0cyBhbGwgYnV0IHRoZSBmaXJzdCBlbGVtZW50IG9yXG4gICAgICogZmlyc3QgYG5gIGVsZW1lbnRzIG9mIGFuIGFycmF5LiBJZiBhIGNhbGxiYWNrIGZ1bmN0aW9uIGlzIHByb3ZpZGVkIGVsZW1lbnRzXG4gICAgICogYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgYXJyYXkgYXJlIGV4Y2x1ZGVkIGZyb20gdGhlIHJlc3VsdCBhcyBsb25nIGFzIHRoZVxuICAgICAqIGNhbGxiYWNrIHJldHVybnMgdHJ1ZXkuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWRcbiAgICAgKiB3aXRoIHRocmVlIGFyZ3VtZW50czsgKHZhbHVlLCBpbmRleCwgYXJyYXkpLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAYWxpYXMgZHJvcCwgdGFpbFxuICAgICAqIEBjYXRlZ29yeSBBcnJheXNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gcXVlcnkuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8bnVtYmVyfHN0cmluZ30gW2NhbGxiYWNrPTFdIFRoZSBmdW5jdGlvbiBjYWxsZWRcbiAgICAgKiAgcGVyIGVsZW1lbnQgb3IgdGhlIG51bWJlciBvZiBlbGVtZW50cyB0byBleGNsdWRlLiBJZiBhIHByb3BlcnR5IG5hbWUgb3JcbiAgICAgKiAgb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZCB0byBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIlxuICAgICAqICBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhIHNsaWNlIG9mIGBhcnJheWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8ucmVzdChbMSwgMiwgM10pO1xuICAgICAqIC8vID0+IFsyLCAzXVxuICAgICAqXG4gICAgICogXy5yZXN0KFsxLCAyLCAzXSwgMik7XG4gICAgICogLy8gPT4gWzNdXG4gICAgICpcbiAgICAgKiBfLnJlc3QoWzEsIDIsIDNdLCBmdW5jdGlvbihudW0pIHtcbiAgICAgKiAgIHJldHVybiBudW0gPCAzO1xuICAgICAqIH0pO1xuICAgICAqIC8vID0+IFszXVxuICAgICAqXG4gICAgICogdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICogICB7ICduYW1lJzogJ2Jhcm5leScsICAnYmxvY2tlZCc6IHRydWUsICAnZW1wbG95ZXInOiAnc2xhdGUnIH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICAnYmxvY2tlZCc6IGZhbHNlLCAgJ2VtcGxveWVyJzogJ3NsYXRlJyB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdwZWJibGVzJywgJ2Jsb2NrZWQnOiB0cnVlLCAnZW1wbG95ZXInOiAnbmEnIH1cbiAgICAgKiBdO1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgXCJfLnBsdWNrXCIgY2FsbGJhY2sgc2hvcnRoYW5kXG4gICAgICogXy5wbHVjayhfLnJlc3QoY2hhcmFjdGVycywgJ2Jsb2NrZWQnKSwgJ25hbWUnKTtcbiAgICAgKiAvLyA9PiBbJ2ZyZWQnLCAncGViYmxlcyddXG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ud2hlcmVcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLnJlc3QoY2hhcmFjdGVycywgeyAnZW1wbG95ZXInOiAnc2xhdGUnIH0pO1xuICAgICAqIC8vID0+IFt7ICduYW1lJzogJ3BlYmJsZXMnLCAnYmxvY2tlZCc6IHRydWUsICdlbXBsb3llcic6ICduYScgfV1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZXN0KGFycmF5LCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPSAnbnVtYmVyJyAmJiBjYWxsYmFjayAhPSBudWxsKSB7XG4gICAgICAgIHZhciBuID0gMCxcbiAgICAgICAgICAgIGluZGV4ID0gLTEsXG4gICAgICAgICAgICBsZW5ndGggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IDA7XG5cbiAgICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCAmJiBjYWxsYmFjayhhcnJheVtpbmRleF0sIGluZGV4LCBhcnJheSkpIHtcbiAgICAgICAgICBuKys7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG4gPSAoY2FsbGJhY2sgPT0gbnVsbCB8fCB0aGlzQXJnKSA/IDEgOiBuYXRpdmVNYXgoMCwgY2FsbGJhY2spO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNsaWNlKGFycmF5LCBuKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2VzIGEgYmluYXJ5IHNlYXJjaCB0byBkZXRlcm1pbmUgdGhlIHNtYWxsZXN0IGluZGV4IGF0IHdoaWNoIGEgdmFsdWVcbiAgICAgKiBzaG91bGQgYmUgaW5zZXJ0ZWQgaW50byBhIGdpdmVuIHNvcnRlZCBhcnJheSBpbiBvcmRlciB0byBtYWludGFpbiB0aGUgc29ydFxuICAgICAqIG9yZGVyIG9mIHRoZSBhcnJheS4gSWYgYSBjYWxsYmFjayBpcyBwcm92aWRlZCBpdCB3aWxsIGJlIGV4ZWN1dGVkIGZvclxuICAgICAqIGB2YWx1ZWAgYW5kIGVhY2ggZWxlbWVudCBvZiBgYXJyYXlgIHRvIGNvbXB1dGUgdGhlaXIgc29ydCByYW5raW5nLiBUaGVcbiAgICAgKiBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCBvbmUgYXJndW1lbnQ7ICh2YWx1ZSkuXG4gICAgICpcbiAgICAgKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLnBsdWNrXCIgc3R5bGVcbiAgICAgKiBjYWxsYmFjayB3aWxsIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBjYWxsYmFja2AgdGhlIGNyZWF0ZWQgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tcbiAgICAgKiB3aWxsIHJldHVybiBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LFxuICAgICAqIGVsc2UgYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBBcnJheXNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaW5zcGVjdC5cbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBldmFsdWF0ZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZFxuICAgICAqICBwZXIgaXRlcmF0aW9uLiBJZiBhIHByb3BlcnR5IG5hbWUgb3Igb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZFxuICAgICAqICB0byBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGluZGV4IGF0IHdoaWNoIGB2YWx1ZWAgc2hvdWxkIGJlIGluc2VydGVkXG4gICAgICogIGludG8gYGFycmF5YC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5zb3J0ZWRJbmRleChbMjAsIDMwLCA1MF0sIDQwKTtcbiAgICAgKiAvLyA9PiAyXG4gICAgICpcbiAgICAgKiAvLyB1c2luZyBcIl8ucGx1Y2tcIiBjYWxsYmFjayBzaG9ydGhhbmRcbiAgICAgKiBfLnNvcnRlZEluZGV4KFt7ICd4JzogMjAgfSwgeyAneCc6IDMwIH0sIHsgJ3gnOiA1MCB9XSwgeyAneCc6IDQwIH0sICd4Jyk7XG4gICAgICogLy8gPT4gMlxuICAgICAqXG4gICAgICogdmFyIGRpY3QgPSB7XG4gICAgICogICAnd29yZFRvTnVtYmVyJzogeyAndHdlbnR5JzogMjAsICd0aGlydHknOiAzMCwgJ2ZvdXJ0eSc6IDQwLCAnZmlmdHknOiA1MCB9XG4gICAgICogfTtcbiAgICAgKlxuICAgICAqIF8uc29ydGVkSW5kZXgoWyd0d2VudHknLCAndGhpcnR5JywgJ2ZpZnR5J10sICdmb3VydHknLCBmdW5jdGlvbih3b3JkKSB7XG4gICAgICogICByZXR1cm4gZGljdC53b3JkVG9OdW1iZXJbd29yZF07XG4gICAgICogfSk7XG4gICAgICogLy8gPT4gMlxuICAgICAqXG4gICAgICogXy5zb3J0ZWRJbmRleChbJ3R3ZW50eScsICd0aGlydHknLCAnZmlmdHknXSwgJ2ZvdXJ0eScsIGZ1bmN0aW9uKHdvcmQpIHtcbiAgICAgKiAgIHJldHVybiB0aGlzLndvcmRUb051bWJlclt3b3JkXTtcbiAgICAgKiB9LCBkaWN0KTtcbiAgICAgKiAvLyA9PiAyXG4gICAgICovXG4gICAgZnVuY3Rpb24gc29ydGVkSW5kZXgoYXJyYXksIHZhbHVlLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgdmFyIGxvdyA9IDAsXG4gICAgICAgICAgaGlnaCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogbG93O1xuXG4gICAgICAvLyBleHBsaWNpdGx5IHJlZmVyZW5jZSBgaWRlbnRpdHlgIGZvciBiZXR0ZXIgaW5saW5pbmcgaW4gRmlyZWZveFxuICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayA/IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMSkgOiBpZGVudGl0eTtcbiAgICAgIHZhbHVlID0gY2FsbGJhY2sodmFsdWUpO1xuXG4gICAgICB3aGlsZSAobG93IDwgaGlnaCkge1xuICAgICAgICB2YXIgbWlkID0gKGxvdyArIGhpZ2gpID4+PiAxO1xuICAgICAgICAoY2FsbGJhY2soYXJyYXlbbWlkXSkgPCB2YWx1ZSlcbiAgICAgICAgICA/IGxvdyA9IG1pZCArIDFcbiAgICAgICAgICA6IGhpZ2ggPSBtaWQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gbG93O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgdW5pcXVlIHZhbHVlcywgaW4gb3JkZXIsIG9mIHRoZSBwcm92aWRlZCBhcnJheXMgdXNpbmdcbiAgICAgKiBzdHJpY3QgZXF1YWxpdHkgZm9yIGNvbXBhcmlzb25zLCBpLmUuIGA9PT1gLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IEFycmF5c1xuICAgICAqIEBwYXJhbSB7Li4uQXJyYXl9IFthcnJheV0gVGhlIGFycmF5cyB0byBpbnNwZWN0LlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhbiBhcnJheSBvZiBjb21iaW5lZCB2YWx1ZXMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8udW5pb24oWzEsIDIsIDNdLCBbNSwgMiwgMSwgNF0sIFsyLCAxXSk7XG4gICAgICogLy8gPT4gWzEsIDIsIDMsIDUsIDRdXG4gICAgICovXG4gICAgZnVuY3Rpb24gdW5pb24oKSB7XG4gICAgICByZXR1cm4gYmFzZVVuaXEoYmFzZUZsYXR0ZW4oYXJndW1lbnRzLCB0cnVlLCB0cnVlKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGR1cGxpY2F0ZS12YWx1ZS1mcmVlIHZlcnNpb24gb2YgYW4gYXJyYXkgdXNpbmcgc3RyaWN0IGVxdWFsaXR5XG4gICAgICogZm9yIGNvbXBhcmlzb25zLCBpLmUuIGA9PT1gLiBJZiB0aGUgYXJyYXkgaXMgc29ydGVkLCBwcm92aWRpbmdcbiAgICAgKiBgdHJ1ZWAgZm9yIGBpc1NvcnRlZGAgd2lsbCB1c2UgYSBmYXN0ZXIgYWxnb3JpdGhtLiBJZiBhIGNhbGxiYWNrIGlzIHByb3ZpZGVkXG4gICAgICogZWFjaCBlbGVtZW50IG9mIGBhcnJheWAgaXMgcGFzc2VkIHRocm91Z2ggdGhlIGNhbGxiYWNrIGJlZm9yZSB1bmlxdWVuZXNzXG4gICAgICogaXMgY29tcHV0ZWQuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZVxuICAgICAqIGFyZ3VtZW50czsgKHZhbHVlLCBpbmRleCwgYXJyYXkpLlxuICAgICAqXG4gICAgICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy5wbHVja1wiIHN0eWxlXG4gICAgICogY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgY2FsbGJhY2tgIHRoZSBjcmVhdGVkIFwiXy53aGVyZVwiIHN0eWxlIGNhbGxiYWNrXG4gICAgICogd2lsbCByZXR1cm4gYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuIG9iamVjdCxcbiAgICAgKiBlbHNlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAYWxpYXMgdW5pcXVlXG4gICAgICogQGNhdGVnb3J5IEFycmF5c1xuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBwcm9jZXNzLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU29ydGVkPWZhbHNlXSBBIGZsYWcgdG8gaW5kaWNhdGUgdGhhdCBgYXJyYXlgIGlzIHNvcnRlZC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZFxuICAgICAqICBwZXIgaXRlcmF0aW9uLiBJZiBhIHByb3BlcnR5IG5hbWUgb3Igb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZFxuICAgICAqICB0byBjcmVhdGUgYSBcIl8ucGx1Y2tcIiBvciBcIl8ud2hlcmVcIiBzdHlsZSBjYWxsYmFjaywgcmVzcGVjdGl2ZWx5LlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBhIGR1cGxpY2F0ZS12YWx1ZS1mcmVlIGFycmF5LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLnVuaXEoWzEsIDIsIDEsIDMsIDFdKTtcbiAgICAgKiAvLyA9PiBbMSwgMiwgM11cbiAgICAgKlxuICAgICAqIF8udW5pcShbMSwgMSwgMiwgMiwgM10sIHRydWUpO1xuICAgICAqIC8vID0+IFsxLCAyLCAzXVxuICAgICAqXG4gICAgICogXy51bmlxKFsnQScsICdiJywgJ0MnLCAnYScsICdCJywgJ2MnXSwgZnVuY3Rpb24obGV0dGVyKSB7IHJldHVybiBsZXR0ZXIudG9Mb3dlckNhc2UoKTsgfSk7XG4gICAgICogLy8gPT4gWydBJywgJ2InLCAnQyddXG4gICAgICpcbiAgICAgKiBfLnVuaXEoWzEsIDIuNSwgMywgMS41LCAyLCAzLjVdLCBmdW5jdGlvbihudW0pIHsgcmV0dXJuIHRoaXMuZmxvb3IobnVtKTsgfSwgTWF0aCk7XG4gICAgICogLy8gPT4gWzEsIDIuNSwgM11cbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIFwiXy5wbHVja1wiIGNhbGxiYWNrIHNob3J0aGFuZFxuICAgICAqIF8udW5pcShbeyAneCc6IDEgfSwgeyAneCc6IDIgfSwgeyAneCc6IDEgfV0sICd4Jyk7XG4gICAgICogLy8gPT4gW3sgJ3gnOiAxIH0sIHsgJ3gnOiAyIH1dXG4gICAgICovXG4gICAgZnVuY3Rpb24gdW5pcShhcnJheSwgaXNTb3J0ZWQsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICAvLyBqdWdnbGUgYXJndW1lbnRzXG4gICAgICBpZiAodHlwZW9mIGlzU29ydGVkICE9ICdib29sZWFuJyAmJiBpc1NvcnRlZCAhPSBudWxsKSB7XG4gICAgICAgIHRoaXNBcmcgPSBjYWxsYmFjaztcbiAgICAgICAgY2FsbGJhY2sgPSAodHlwZW9mIGlzU29ydGVkICE9ICdmdW5jdGlvbicgJiYgdGhpc0FyZyAmJiB0aGlzQXJnW2lzU29ydGVkXSA9PT0gYXJyYXkpID8gbnVsbCA6IGlzU29ydGVkO1xuICAgICAgICBpc1NvcnRlZCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKGNhbGxiYWNrICE9IG51bGwpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGJhc2VVbmlxKGFycmF5LCBpc1NvcnRlZCwgY2FsbGJhY2spO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgZXhjbHVkaW5nIGFsbCBwcm92aWRlZCB2YWx1ZXMgdXNpbmcgc3RyaWN0IGVxdWFsaXR5IGZvclxuICAgICAqIGNvbXBhcmlzb25zLCBpLmUuIGA9PT1gLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IEFycmF5c1xuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBmaWx0ZXIuXG4gICAgICogQHBhcmFtIHsuLi4qfSBbdmFsdWVdIFRoZSB2YWx1ZXMgdG8gZXhjbHVkZS5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBuZXcgYXJyYXkgb2YgZmlsdGVyZWQgdmFsdWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLndpdGhvdXQoWzEsIDIsIDEsIDAsIDMsIDEsIDRdLCAwLCAxKTtcbiAgICAgKiAvLyA9PiBbMiwgMywgNF1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB3aXRob3V0KGFycmF5KSB7XG4gICAgICByZXR1cm4gYmFzZURpZmZlcmVuY2UoYXJyYXksIHNsaWNlKGFyZ3VtZW50cywgMSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgdGhhdCBpcyB0aGUgc3ltbWV0cmljIGRpZmZlcmVuY2Ugb2YgdGhlIHByb3ZpZGVkIGFycmF5cy5cbiAgICAgKiBTZWUgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9TeW1tZXRyaWNfZGlmZmVyZW5jZS5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBBcnJheXNcbiAgICAgKiBAcGFyYW0gey4uLkFycmF5fSBbYXJyYXldIFRoZSBhcnJheXMgdG8gaW5zcGVjdC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYW4gYXJyYXkgb2YgdmFsdWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLnhvcihbMSwgMiwgM10sIFs1LCAyLCAxLCA0XSk7XG4gICAgICogLy8gPT4gWzMsIDUsIDRdXG4gICAgICpcbiAgICAgKiBfLnhvcihbMSwgMiwgNV0sIFsyLCAzLCA1XSwgWzMsIDQsIDVdKTtcbiAgICAgKiAvLyA9PiBbMSwgNCwgNV1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB4b3IoKSB7XG4gICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuXG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICB2YXIgYXJyYXkgPSBhcmd1bWVudHNbaW5kZXhdO1xuICAgICAgICBpZiAoaXNBcnJheShhcnJheSkgfHwgaXNBcmd1bWVudHMoYXJyYXkpKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdCA9IHJlc3VsdFxuICAgICAgICAgICAgPyBiYXNlVW5pcShiYXNlRGlmZmVyZW5jZShyZXN1bHQsIGFycmF5KS5jb25jYXQoYmFzZURpZmZlcmVuY2UoYXJyYXksIHJlc3VsdCkpKVxuICAgICAgICAgICAgOiBhcnJheTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdCB8fCBbXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGFycmF5IG9mIGdyb3VwZWQgZWxlbWVudHMsIHRoZSBmaXJzdCBvZiB3aGljaCBjb250YWlucyB0aGUgZmlyc3RcbiAgICAgKiBlbGVtZW50cyBvZiB0aGUgZ2l2ZW4gYXJyYXlzLCB0aGUgc2Vjb25kIG9mIHdoaWNoIGNvbnRhaW5zIHRoZSBzZWNvbmRcbiAgICAgKiBlbGVtZW50cyBvZiB0aGUgZ2l2ZW4gYXJyYXlzLCBhbmQgc28gb24uXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAYWxpYXMgdW56aXBcbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHsuLi5BcnJheX0gW2FycmF5XSBBcnJheXMgdG8gcHJvY2Vzcy5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBuZXcgYXJyYXkgb2YgZ3JvdXBlZCBlbGVtZW50cy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy56aXAoWydmcmVkJywgJ2Jhcm5leSddLCBbMzAsIDQwXSwgW3RydWUsIGZhbHNlXSk7XG4gICAgICogLy8gPT4gW1snZnJlZCcsIDMwLCB0cnVlXSwgWydiYXJuZXknLCA0MCwgZmFsc2VdXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHppcCgpIHtcbiAgICAgIHZhciBhcnJheSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzIDogYXJndW1lbnRzWzBdLFxuICAgICAgICAgIGluZGV4ID0gLTEsXG4gICAgICAgICAgbGVuZ3RoID0gYXJyYXkgPyBtYXgocGx1Y2soYXJyYXksICdsZW5ndGgnKSkgOiAwLFxuICAgICAgICAgIHJlc3VsdCA9IEFycmF5KGxlbmd0aCA8IDAgPyAwIDogbGVuZ3RoKTtcblxuICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgcmVzdWx0W2luZGV4XSA9IHBsdWNrKGFycmF5LCBpbmRleCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gb2JqZWN0IGNvbXBvc2VkIGZyb20gYXJyYXlzIG9mIGBrZXlzYCBhbmQgYHZhbHVlc2AuIFByb3ZpZGVcbiAgICAgKiBlaXRoZXIgYSBzaW5nbGUgdHdvIGRpbWVuc2lvbmFsIGFycmF5LCBpLmUuIGBbW2tleTEsIHZhbHVlMV0sIFtrZXkyLCB2YWx1ZTJdXWBcbiAgICAgKiBvciB0d28gYXJyYXlzLCBvbmUgb2YgYGtleXNgIGFuZCBvbmUgb2YgY29ycmVzcG9uZGluZyBgdmFsdWVzYC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBhbGlhcyBvYmplY3RcbiAgICAgKiBAY2F0ZWdvcnkgQXJyYXlzXG4gICAgICogQHBhcmFtIHtBcnJheX0ga2V5cyBUaGUgYXJyYXkgb2Yga2V5cy5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBbdmFsdWVzPVtdXSBUaGUgYXJyYXkgb2YgdmFsdWVzLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYW4gb2JqZWN0IGNvbXBvc2VkIG9mIHRoZSBnaXZlbiBrZXlzIGFuZFxuICAgICAqICBjb3JyZXNwb25kaW5nIHZhbHVlcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy56aXBPYmplY3QoWydmcmVkJywgJ2Jhcm5leSddLCBbMzAsIDQwXSk7XG4gICAgICogLy8gPT4geyAnZnJlZCc6IDMwLCAnYmFybmV5JzogNDAgfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHppcE9iamVjdChrZXlzLCB2YWx1ZXMpIHtcbiAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgIGxlbmd0aCA9IGtleXMgPyBrZXlzLmxlbmd0aCA6IDAsXG4gICAgICAgICAgcmVzdWx0ID0ge307XG5cbiAgICAgIGlmICghdmFsdWVzICYmIGxlbmd0aCAmJiAhaXNBcnJheShrZXlzWzBdKSkge1xuICAgICAgICB2YWx1ZXMgPSBbXTtcbiAgICAgIH1cbiAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2luZGV4XTtcbiAgICAgICAgaWYgKHZhbHVlcykge1xuICAgICAgICAgIHJlc3VsdFtrZXldID0gdmFsdWVzW2luZGV4XTtcbiAgICAgICAgfSBlbHNlIGlmIChrZXkpIHtcbiAgICAgICAgICByZXN1bHRba2V5WzBdXSA9IGtleVsxXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IGV4ZWN1dGVzIGBmdW5jYCwgd2l0aCAgdGhlIGB0aGlzYCBiaW5kaW5nIGFuZFxuICAgICAqIGFyZ3VtZW50cyBvZiB0aGUgY3JlYXRlZCBmdW5jdGlvbiwgb25seSBhZnRlciBiZWluZyBjYWxsZWQgYG5gIHRpbWVzLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uc1xuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBuIFRoZSBudW1iZXIgb2YgdGltZXMgdGhlIGZ1bmN0aW9uIG11c3QgYmUgY2FsbGVkIGJlZm9yZVxuICAgICAqICBgZnVuY2AgaXMgZXhlY3V0ZWQuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gcmVzdHJpY3QuXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgcmVzdHJpY3RlZCBmdW5jdGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIHNhdmVzID0gWydwcm9maWxlJywgJ3NldHRpbmdzJ107XG4gICAgICpcbiAgICAgKiB2YXIgZG9uZSA9IF8uYWZ0ZXIoc2F2ZXMubGVuZ3RoLCBmdW5jdGlvbigpIHtcbiAgICAgKiAgIGNvbnNvbGUubG9nKCdEb25lIHNhdmluZyEnKTtcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIF8uZm9yRWFjaChzYXZlcywgZnVuY3Rpb24odHlwZSkge1xuICAgICAqICAgYXN5bmNTYXZlKHsgJ3R5cGUnOiB0eXBlLCAnY29tcGxldGUnOiBkb25lIH0pO1xuICAgICAqIH0pO1xuICAgICAqIC8vID0+IGxvZ3MgJ0RvbmUgc2F2aW5nIScsIGFmdGVyIGFsbCBzYXZlcyBoYXZlIGNvbXBsZXRlZFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFmdGVyKG4sIGZ1bmMpIHtcbiAgICAgIGlmICghaXNGdW5jdGlvbihmdW5jKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoLS1uIDwgMSkge1xuICAgICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQsIHdoZW4gY2FsbGVkLCBpbnZva2VzIGBmdW5jYCB3aXRoIHRoZSBgdGhpc2BcbiAgICAgKiBiaW5kaW5nIG9mIGB0aGlzQXJnYCBhbmQgcHJlcGVuZHMgYW55IGFkZGl0aW9uYWwgYGJpbmRgIGFyZ3VtZW50cyB0byB0aG9zZVxuICAgICAqIHByb3ZpZGVkIHRvIHRoZSBib3VuZCBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBiaW5kLlxuICAgICAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgZnVuY2AuXG4gICAgICogQHBhcmFtIHsuLi4qfSBbYXJnXSBBcmd1bWVudHMgdG8gYmUgcGFydGlhbGx5IGFwcGxpZWQuXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgYm91bmQgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBmdW5jID0gZnVuY3Rpb24oZ3JlZXRpbmcpIHtcbiAgICAgKiAgIHJldHVybiBncmVldGluZyArICcgJyArIHRoaXMubmFtZTtcbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogZnVuYyA9IF8uYmluZChmdW5jLCB7ICduYW1lJzogJ2ZyZWQnIH0sICdoaScpO1xuICAgICAqIGZ1bmMoKTtcbiAgICAgKiAvLyA9PiAnaGkgZnJlZCdcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiaW5kKGZ1bmMsIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID4gMlxuICAgICAgICA/IGNyZWF0ZVdyYXBwZXIoZnVuYywgMTcsIHNsaWNlKGFyZ3VtZW50cywgMiksIG51bGwsIHRoaXNBcmcpXG4gICAgICAgIDogY3JlYXRlV3JhcHBlcihmdW5jLCAxLCBudWxsLCBudWxsLCB0aGlzQXJnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCaW5kcyBtZXRob2RzIG9mIGFuIG9iamVjdCB0byB0aGUgb2JqZWN0IGl0c2VsZiwgb3ZlcndyaXRpbmcgdGhlIGV4aXN0aW5nXG4gICAgICogbWV0aG9kLiBNZXRob2QgbmFtZXMgbWF5IGJlIHNwZWNpZmllZCBhcyBpbmRpdmlkdWFsIGFyZ3VtZW50cyBvciBhcyBhcnJheXNcbiAgICAgKiBvZiBtZXRob2QgbmFtZXMuIElmIG5vIG1ldGhvZCBuYW1lcyBhcmUgcHJvdmlkZWQgYWxsIHRoZSBmdW5jdGlvbiBwcm9wZXJ0aWVzXG4gICAgICogb2YgYG9iamVjdGAgd2lsbCBiZSBib3VuZC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gYmluZCBhbmQgYXNzaWduIHRoZSBib3VuZCBtZXRob2RzIHRvLlxuICAgICAqIEBwYXJhbSB7Li4uc3RyaW5nfSBbbWV0aG9kTmFtZV0gVGhlIG9iamVjdCBtZXRob2QgbmFtZXMgdG9cbiAgICAgKiAgYmluZCwgc3BlY2lmaWVkIGFzIGluZGl2aWR1YWwgbWV0aG9kIG5hbWVzIG9yIGFycmF5cyBvZiBtZXRob2QgbmFtZXMuXG4gICAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIHZpZXcgPSB7XG4gICAgICogICAnbGFiZWwnOiAnZG9jcycsXG4gICAgICogICAnb25DbGljayc6IGZ1bmN0aW9uKCkgeyBjb25zb2xlLmxvZygnY2xpY2tlZCAnICsgdGhpcy5sYWJlbCk7IH1cbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogXy5iaW5kQWxsKHZpZXcpO1xuICAgICAqIGpRdWVyeSgnI2RvY3MnKS5vbignY2xpY2snLCB2aWV3Lm9uQ2xpY2spO1xuICAgICAqIC8vID0+IGxvZ3MgJ2NsaWNrZWQgZG9jcycsIHdoZW4gdGhlIGJ1dHRvbiBpcyBjbGlja2VkXG4gICAgICovXG4gICAgZnVuY3Rpb24gYmluZEFsbChvYmplY3QpIHtcbiAgICAgIHZhciBmdW5jcyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYmFzZUZsYXR0ZW4oYXJndW1lbnRzLCB0cnVlLCBmYWxzZSwgMSkgOiBmdW5jdGlvbnMob2JqZWN0KSxcbiAgICAgICAgICBpbmRleCA9IC0xLFxuICAgICAgICAgIGxlbmd0aCA9IGZ1bmNzLmxlbmd0aDtcblxuICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgdmFyIGtleSA9IGZ1bmNzW2luZGV4XTtcbiAgICAgICAgb2JqZWN0W2tleV0gPSBjcmVhdGVXcmFwcGVyKG9iamVjdFtrZXldLCAxLCBudWxsLCBudWxsLCBvYmplY3QpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCwgd2hlbiBjYWxsZWQsIGludm9rZXMgdGhlIG1ldGhvZCBhdCBgb2JqZWN0W2tleV1gXG4gICAgICogYW5kIHByZXBlbmRzIGFueSBhZGRpdGlvbmFsIGBiaW5kS2V5YCBhcmd1bWVudHMgdG8gdGhvc2UgcHJvdmlkZWQgdG8gdGhlIGJvdW5kXG4gICAgICogZnVuY3Rpb24uIFRoaXMgbWV0aG9kIGRpZmZlcnMgZnJvbSBgXy5iaW5kYCBieSBhbGxvd2luZyBib3VuZCBmdW5jdGlvbnMgdG9cbiAgICAgKiByZWZlcmVuY2UgbWV0aG9kcyB0aGF0IHdpbGwgYmUgcmVkZWZpbmVkIG9yIGRvbid0IHlldCBleGlzdC5cbiAgICAgKiBTZWUgaHR0cDovL21pY2hhdXguY2EvYXJ0aWNsZXMvbGF6eS1mdW5jdGlvbi1kZWZpbml0aW9uLXBhdHRlcm4uXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRoZSBtZXRob2QgYmVsb25ncyB0by5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIG1ldGhvZC5cbiAgICAgKiBAcGFyYW0gey4uLip9IFthcmddIEFyZ3VtZW50cyB0byBiZSBwYXJ0aWFsbHkgYXBwbGllZC5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBib3VuZCBmdW5jdGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIG9iamVjdCA9IHtcbiAgICAgKiAgICduYW1lJzogJ2ZyZWQnLFxuICAgICAqICAgJ2dyZWV0JzogZnVuY3Rpb24oZ3JlZXRpbmcpIHtcbiAgICAgKiAgICAgcmV0dXJuIGdyZWV0aW5nICsgJyAnICsgdGhpcy5uYW1lO1xuICAgICAqICAgfVxuICAgICAqIH07XG4gICAgICpcbiAgICAgKiB2YXIgZnVuYyA9IF8uYmluZEtleShvYmplY3QsICdncmVldCcsICdoaScpO1xuICAgICAqIGZ1bmMoKTtcbiAgICAgKiAvLyA9PiAnaGkgZnJlZCdcbiAgICAgKlxuICAgICAqIG9iamVjdC5ncmVldCA9IGZ1bmN0aW9uKGdyZWV0aW5nKSB7XG4gICAgICogICByZXR1cm4gZ3JlZXRpbmcgKyAneWEgJyArIHRoaXMubmFtZSArICchJztcbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogZnVuYygpO1xuICAgICAqIC8vID0+ICdoaXlhIGZyZWQhJ1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJpbmRLZXkob2JqZWN0LCBrZXkpIHtcbiAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID4gMlxuICAgICAgICA/IGNyZWF0ZVdyYXBwZXIoa2V5LCAxOSwgc2xpY2UoYXJndW1lbnRzLCAyKSwgbnVsbCwgb2JqZWN0KVxuICAgICAgICA6IGNyZWF0ZVdyYXBwZXIoa2V5LCAzLCBudWxsLCBudWxsLCBvYmplY3QpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IGlzIHRoZSBjb21wb3NpdGlvbiBvZiB0aGUgcHJvdmlkZWQgZnVuY3Rpb25zLFxuICAgICAqIHdoZXJlIGVhY2ggZnVuY3Rpb24gY29uc3VtZXMgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgZnVuY3Rpb24gdGhhdCBmb2xsb3dzLlxuICAgICAqIEZvciBleGFtcGxlLCBjb21wb3NpbmcgdGhlIGZ1bmN0aW9ucyBgZigpYCwgYGcoKWAsIGFuZCBgaCgpYCBwcm9kdWNlcyBgZihnKGgoKSkpYC5cbiAgICAgKiBFYWNoIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkIHdpdGggdGhlIGB0aGlzYCBiaW5kaW5nIG9mIHRoZSBjb21wb3NlZCBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAgICAgKiBAcGFyYW0gey4uLkZ1bmN0aW9ufSBbZnVuY10gRnVuY3Rpb25zIHRvIGNvbXBvc2UuXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgY29tcG9zZWQgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciByZWFsTmFtZU1hcCA9IHtcbiAgICAgKiAgICdwZWJibGVzJzogJ3BlbmVsb3BlJ1xuICAgICAqIH07XG4gICAgICpcbiAgICAgKiB2YXIgZm9ybWF0ID0gZnVuY3Rpb24obmFtZSkge1xuICAgICAqICAgbmFtZSA9IHJlYWxOYW1lTWFwW25hbWUudG9Mb3dlckNhc2UoKV0gfHwgbmFtZTtcbiAgICAgKiAgIHJldHVybiBuYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgbmFtZS5zbGljZSgxKS50b0xvd2VyQ2FzZSgpO1xuICAgICAqIH07XG4gICAgICpcbiAgICAgKiB2YXIgZ3JlZXQgPSBmdW5jdGlvbihmb3JtYXR0ZWQpIHtcbiAgICAgKiAgIHJldHVybiAnSGl5YSAnICsgZm9ybWF0dGVkICsgJyEnO1xuICAgICAqIH07XG4gICAgICpcbiAgICAgKiB2YXIgd2VsY29tZSA9IF8uY29tcG9zZShncmVldCwgZm9ybWF0KTtcbiAgICAgKiB3ZWxjb21lKCdwZWJibGVzJyk7XG4gICAgICogLy8gPT4gJ0hpeWEgUGVuZWxvcGUhJ1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNvbXBvc2UoKSB7XG4gICAgICB2YXIgZnVuY3MgPSBhcmd1bWVudHMsXG4gICAgICAgICAgbGVuZ3RoID0gZnVuY3MubGVuZ3RoO1xuXG4gICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKGZ1bmNzW2xlbmd0aF0pKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgICAgIGxlbmd0aCA9IGZ1bmNzLmxlbmd0aDtcblxuICAgICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgICBhcmdzID0gW2Z1bmNzW2xlbmd0aF0uYXBwbHkodGhpcywgYXJncyldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhcmdzWzBdO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gd2hpY2ggYWNjZXB0cyBvbmUgb3IgbW9yZSBhcmd1bWVudHMgb2YgYGZ1bmNgIHRoYXQgd2hlblxuICAgICAqIGludm9rZWQgZWl0aGVyIGV4ZWN1dGVzIGBmdW5jYCByZXR1cm5pbmcgaXRzIHJlc3VsdCwgaWYgYWxsIGBmdW5jYCBhcmd1bWVudHNcbiAgICAgKiBoYXZlIGJlZW4gcHJvdmlkZWQsIG9yIHJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGFjY2VwdHMgb25lIG9yIG1vcmUgb2YgdGhlXG4gICAgICogcmVtYWluaW5nIGBmdW5jYCBhcmd1bWVudHMsIGFuZCBzbyBvbi4gVGhlIGFyaXR5IG9mIGBmdW5jYCBjYW4gYmUgc3BlY2lmaWVkXG4gICAgICogaWYgYGZ1bmMubGVuZ3RoYCBpcyBub3Qgc3VmZmljaWVudC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBjdXJyeS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2FyaXR5PWZ1bmMubGVuZ3RoXSBUaGUgYXJpdHkgb2YgYGZ1bmNgLlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGN1cnJpZWQgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBjdXJyaWVkID0gXy5jdXJyeShmdW5jdGlvbihhLCBiLCBjKSB7XG4gICAgICogICBjb25zb2xlLmxvZyhhICsgYiArIGMpO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogY3VycmllZCgxKSgyKSgzKTtcbiAgICAgKiAvLyA9PiA2XG4gICAgICpcbiAgICAgKiBjdXJyaWVkKDEsIDIpKDMpO1xuICAgICAqIC8vID0+IDZcbiAgICAgKlxuICAgICAqIGN1cnJpZWQoMSwgMiwgMyk7XG4gICAgICogLy8gPT4gNlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGN1cnJ5KGZ1bmMsIGFyaXR5KSB7XG4gICAgICBhcml0eSA9IHR5cGVvZiBhcml0eSA9PSAnbnVtYmVyJyA/IGFyaXR5IDogKCthcml0eSB8fCBmdW5jLmxlbmd0aCk7XG4gICAgICByZXR1cm4gY3JlYXRlV3JhcHBlcihmdW5jLCA0LCBudWxsLCBudWxsLCBudWxsLCBhcml0eSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBkZWxheSB0aGUgZXhlY3V0aW9uIG9mIGBmdW5jYCB1bnRpbCBhZnRlclxuICAgICAqIGB3YWl0YCBtaWxsaXNlY29uZHMgaGF2ZSBlbGFwc2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgaXQgd2FzIGludm9rZWQuXG4gICAgICogUHJvdmlkZSBhbiBvcHRpb25zIG9iamVjdCB0byBpbmRpY2F0ZSB0aGF0IGBmdW5jYCBzaG91bGQgYmUgaW52b2tlZCBvblxuICAgICAqIHRoZSBsZWFkaW5nIGFuZC9vciB0cmFpbGluZyBlZGdlIG9mIHRoZSBgd2FpdGAgdGltZW91dC4gU3Vic2VxdWVudCBjYWxsc1xuICAgICAqIHRvIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gd2lsbCByZXR1cm4gdGhlIHJlc3VsdCBvZiB0aGUgbGFzdCBgZnVuY2AgY2FsbC5cbiAgICAgKlxuICAgICAqIE5vdGU6IElmIGBsZWFkaW5nYCBhbmQgYHRyYWlsaW5nYCBvcHRpb25zIGFyZSBgdHJ1ZWAgYGZ1bmNgIHdpbGwgYmUgY2FsbGVkXG4gICAgICogb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQgb25seSBpZiB0aGUgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiBpc1xuICAgICAqIGludm9rZWQgbW9yZSB0aGFuIG9uY2UgZHVyaW5nIHRoZSBgd2FpdGAgdGltZW91dC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBkZWJvdW5jZS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2FpdCBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byBkZWxheS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFRoZSBvcHRpb25zIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmxlYWRpbmc9ZmFsc2VdIFNwZWNpZnkgZXhlY3V0aW9uIG9uIHRoZSBsZWFkaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFdhaXRdIFRoZSBtYXhpbXVtIHRpbWUgYGZ1bmNgIGlzIGFsbG93ZWQgdG8gYmUgZGVsYXllZCBiZWZvcmUgaXQncyBjYWxsZWQuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50cmFpbGluZz10cnVlXSBTcGVjaWZ5IGV4ZWN1dGlvbiBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBkZWJvdW5jZWQgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIC8vIGF2b2lkIGNvc3RseSBjYWxjdWxhdGlvbnMgd2hpbGUgdGhlIHdpbmRvdyBzaXplIGlzIGluIGZsdXhcbiAgICAgKiB2YXIgbGF6eUxheW91dCA9IF8uZGVib3VuY2UoY2FsY3VsYXRlTGF5b3V0LCAxNTApO1xuICAgICAqIGpRdWVyeSh3aW5kb3cpLm9uKCdyZXNpemUnLCBsYXp5TGF5b3V0KTtcbiAgICAgKlxuICAgICAqIC8vIGV4ZWN1dGUgYHNlbmRNYWlsYCB3aGVuIHRoZSBjbGljayBldmVudCBpcyBmaXJlZCwgZGVib3VuY2luZyBzdWJzZXF1ZW50IGNhbGxzXG4gICAgICogalF1ZXJ5KCcjcG9zdGJveCcpLm9uKCdjbGljaycsIF8uZGVib3VuY2Uoc2VuZE1haWwsIDMwMCwge1xuICAgICAqICAgJ2xlYWRpbmcnOiB0cnVlLFxuICAgICAqICAgJ3RyYWlsaW5nJzogZmFsc2VcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIC8vIGVuc3VyZSBgYmF0Y2hMb2dgIGlzIGV4ZWN1dGVkIG9uY2UgYWZ0ZXIgMSBzZWNvbmQgb2YgZGVib3VuY2VkIGNhbGxzXG4gICAgICogdmFyIHNvdXJjZSA9IG5ldyBFdmVudFNvdXJjZSgnL3N0cmVhbScpO1xuICAgICAqIHNvdXJjZS5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgXy5kZWJvdW5jZShiYXRjaExvZywgMjUwLCB7XG4gICAgICogICAnbWF4V2FpdCc6IDEwMDBcbiAgICAgKiB9LCBmYWxzZSk7XG4gICAgICovXG4gICAgZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICAgICAgdmFyIGFyZ3MsXG4gICAgICAgICAgbWF4VGltZW91dElkLFxuICAgICAgICAgIHJlc3VsdCxcbiAgICAgICAgICBzdGFtcCxcbiAgICAgICAgICB0aGlzQXJnLFxuICAgICAgICAgIHRpbWVvdXRJZCxcbiAgICAgICAgICB0cmFpbGluZ0NhbGwsXG4gICAgICAgICAgbGFzdENhbGxlZCA9IDAsXG4gICAgICAgICAgbWF4V2FpdCA9IGZhbHNlLFxuICAgICAgICAgIHRyYWlsaW5nID0gdHJ1ZTtcblxuICAgICAgaWYgKCFpc0Z1bmN0aW9uKGZ1bmMpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3I7XG4gICAgICB9XG4gICAgICB3YWl0ID0gbmF0aXZlTWF4KDAsIHdhaXQpIHx8IDA7XG4gICAgICBpZiAob3B0aW9ucyA9PT0gdHJ1ZSkge1xuICAgICAgICB2YXIgbGVhZGluZyA9IHRydWU7XG4gICAgICAgIHRyYWlsaW5nID0gZmFsc2U7XG4gICAgICB9IGVsc2UgaWYgKGlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgIGxlYWRpbmcgPSBvcHRpb25zLmxlYWRpbmc7XG4gICAgICAgIG1heFdhaXQgPSAnbWF4V2FpdCcgaW4gb3B0aW9ucyAmJiAobmF0aXZlTWF4KHdhaXQsIG9wdGlvbnMubWF4V2FpdCkgfHwgMCk7XG4gICAgICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gb3B0aW9ucy50cmFpbGluZyA6IHRyYWlsaW5nO1xuICAgICAgfVxuICAgICAgdmFyIGRlbGF5ZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJlbWFpbmluZyA9IHdhaXQgLSAobm93KCkgLSBzdGFtcCk7XG4gICAgICAgIGlmIChyZW1haW5pbmcgPD0gMCkge1xuICAgICAgICAgIGlmIChtYXhUaW1lb3V0SWQpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChtYXhUaW1lb3V0SWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgaXNDYWxsZWQgPSB0cmFpbGluZ0NhbGw7XG4gICAgICAgICAgbWF4VGltZW91dElkID0gdGltZW91dElkID0gdHJhaWxpbmdDYWxsID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmIChpc0NhbGxlZCkge1xuICAgICAgICAgICAgbGFzdENhbGxlZCA9IG5vdygpO1xuICAgICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICAgICAgICAgIGlmICghdGltZW91dElkICYmICFtYXhUaW1lb3V0SWQpIHtcbiAgICAgICAgICAgICAgYXJncyA9IHRoaXNBcmcgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGRlbGF5ZWQsIHJlbWFpbmluZyk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHZhciBtYXhEZWxheWVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aW1lb3V0SWQpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgfVxuICAgICAgICBtYXhUaW1lb3V0SWQgPSB0aW1lb3V0SWQgPSB0cmFpbGluZ0NhbGwgPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmICh0cmFpbGluZyB8fCAobWF4V2FpdCAhPT0gd2FpdCkpIHtcbiAgICAgICAgICBsYXN0Q2FsbGVkID0gbm93KCk7XG4gICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICAgICAgICBpZiAoIXRpbWVvdXRJZCAmJiAhbWF4VGltZW91dElkKSB7XG4gICAgICAgICAgICBhcmdzID0gdGhpc0FyZyA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgIHN0YW1wID0gbm93KCk7XG4gICAgICAgIHRoaXNBcmcgPSB0aGlzO1xuICAgICAgICB0cmFpbGluZ0NhbGwgPSB0cmFpbGluZyAmJiAodGltZW91dElkIHx8ICFsZWFkaW5nKTtcblxuICAgICAgICBpZiAobWF4V2FpdCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICB2YXIgbGVhZGluZ0NhbGwgPSBsZWFkaW5nICYmICF0aW1lb3V0SWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCFtYXhUaW1lb3V0SWQgJiYgIWxlYWRpbmcpIHtcbiAgICAgICAgICAgIGxhc3RDYWxsZWQgPSBzdGFtcDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHJlbWFpbmluZyA9IG1heFdhaXQgLSAoc3RhbXAgLSBsYXN0Q2FsbGVkKSxcbiAgICAgICAgICAgICAgaXNDYWxsZWQgPSByZW1haW5pbmcgPD0gMDtcblxuICAgICAgICAgIGlmIChpc0NhbGxlZCkge1xuICAgICAgICAgICAgaWYgKG1heFRpbWVvdXRJZCkge1xuICAgICAgICAgICAgICBtYXhUaW1lb3V0SWQgPSBjbGVhclRpbWVvdXQobWF4VGltZW91dElkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhc3RDYWxsZWQgPSBzdGFtcDtcbiAgICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKCFtYXhUaW1lb3V0SWQpIHtcbiAgICAgICAgICAgIG1heFRpbWVvdXRJZCA9IHNldFRpbWVvdXQobWF4RGVsYXllZCwgcmVtYWluaW5nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzQ2FsbGVkICYmIHRpbWVvdXRJZCkge1xuICAgICAgICAgIHRpbWVvdXRJZCA9IGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCF0aW1lb3V0SWQgJiYgd2FpdCAhPT0gbWF4V2FpdCkge1xuICAgICAgICAgIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZGVsYXllZCwgd2FpdCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxlYWRpbmdDYWxsKSB7XG4gICAgICAgICAgaXNDYWxsZWQgPSB0cnVlO1xuICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzQ2FsbGVkICYmICF0aW1lb3V0SWQgJiYgIW1heFRpbWVvdXRJZCkge1xuICAgICAgICAgIGFyZ3MgPSB0aGlzQXJnID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWZlcnMgZXhlY3V0aW5nIHRoZSBgZnVuY2AgZnVuY3Rpb24gdW50aWwgdGhlIGN1cnJlbnQgY2FsbCBzdGFjayBoYXMgY2xlYXJlZC5cbiAgICAgKiBBZGRpdGlvbmFsIGFyZ3VtZW50cyB3aWxsIGJlIHByb3ZpZGVkIHRvIGBmdW5jYCB3aGVuIGl0IGlzIGludm9rZWQuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gZGVmZXIuXG4gICAgICogQHBhcmFtIHsuLi4qfSBbYXJnXSBBcmd1bWVudHMgdG8gaW52b2tlIHRoZSBmdW5jdGlvbiB3aXRoLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIHRpbWVyIGlkLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfLmRlZmVyKGZ1bmN0aW9uKHRleHQpIHsgY29uc29sZS5sb2codGV4dCk7IH0sICdkZWZlcnJlZCcpO1xuICAgICAqIC8vIGxvZ3MgJ2RlZmVycmVkJyBhZnRlciBvbmUgb3IgbW9yZSBtaWxsaXNlY29uZHNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBkZWZlcihmdW5jKSB7XG4gICAgICBpZiAoIWlzRnVuY3Rpb24oZnVuYykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICAgIH1cbiAgICAgIHZhciBhcmdzID0gc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBmdW5jLmFwcGx5KHVuZGVmaW5lZCwgYXJncyk7IH0sIDEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVzIHRoZSBgZnVuY2AgZnVuY3Rpb24gYWZ0ZXIgYHdhaXRgIG1pbGxpc2Vjb25kcy4gQWRkaXRpb25hbCBhcmd1bWVudHNcbiAgICAgKiB3aWxsIGJlIHByb3ZpZGVkIHRvIGBmdW5jYCB3aGVuIGl0IGlzIGludm9rZWQuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gZGVsYXkuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdhaXQgVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVsYXkgZXhlY3V0aW9uLlxuICAgICAqIEBwYXJhbSB7Li4uKn0gW2FyZ10gQXJndW1lbnRzIHRvIGludm9rZSB0aGUgZnVuY3Rpb24gd2l0aC5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSB0aW1lciBpZC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5kZWxheShmdW5jdGlvbih0ZXh0KSB7IGNvbnNvbGUubG9nKHRleHQpOyB9LCAxMDAwLCAnbGF0ZXInKTtcbiAgICAgKiAvLyA9PiBsb2dzICdsYXRlcicgYWZ0ZXIgb25lIHNlY29uZFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGRlbGF5KGZ1bmMsIHdhaXQpIHtcbiAgICAgIGlmICghaXNGdW5jdGlvbihmdW5jKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yO1xuICAgICAgfVxuICAgICAgdmFyIGFyZ3MgPSBzbGljZShhcmd1bWVudHMsIDIpO1xuICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGZ1bmMuYXBwbHkodW5kZWZpbmVkLCBhcmdzKTsgfSwgd2FpdCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgbWVtb2l6ZXMgdGhlIHJlc3VsdCBvZiBgZnVuY2AuIElmIGByZXNvbHZlcmAgaXNcbiAgICAgKiBwcm92aWRlZCBpdCB3aWxsIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSBjYWNoZSBrZXkgZm9yIHN0b3JpbmcgdGhlIHJlc3VsdFxuICAgICAqIGJhc2VkIG9uIHRoZSBhcmd1bWVudHMgcHJvdmlkZWQgdG8gdGhlIG1lbW9pemVkIGZ1bmN0aW9uLiBCeSBkZWZhdWx0LCB0aGVcbiAgICAgKiBmaXJzdCBhcmd1bWVudCBwcm92aWRlZCB0byB0aGUgbWVtb2l6ZWQgZnVuY3Rpb24gaXMgdXNlZCBhcyB0aGUgY2FjaGUga2V5LlxuICAgICAqIFRoZSBgZnVuY2AgaXMgZXhlY3V0ZWQgd2l0aCB0aGUgYHRoaXNgIGJpbmRpbmcgb2YgdGhlIG1lbW9pemVkIGZ1bmN0aW9uLlxuICAgICAqIFRoZSByZXN1bHQgY2FjaGUgaXMgZXhwb3NlZCBhcyB0aGUgYGNhY2hlYCBwcm9wZXJ0eSBvbiB0aGUgbWVtb2l6ZWQgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gaGF2ZSBpdHMgb3V0cHV0IG1lbW9pemVkLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtyZXNvbHZlcl0gQSBmdW5jdGlvbiB1c2VkIHRvIHJlc29sdmUgdGhlIGNhY2hlIGtleS5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBtZW1vaXppbmcgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBmaWJvbmFjY2kgPSBfLm1lbW9pemUoZnVuY3Rpb24obikge1xuICAgICAqICAgcmV0dXJuIG4gPCAyID8gbiA6IGZpYm9uYWNjaShuIC0gMSkgKyBmaWJvbmFjY2kobiAtIDIpO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogZmlib25hY2NpKDkpXG4gICAgICogLy8gPT4gMzRcbiAgICAgKlxuICAgICAqIHZhciBkYXRhID0ge1xuICAgICAqICAgJ2ZyZWQnOiB7ICduYW1lJzogJ2ZyZWQnLCAnYWdlJzogNDAgfSxcbiAgICAgKiAgICdwZWJibGVzJzogeyAnbmFtZSc6ICdwZWJibGVzJywgJ2FnZSc6IDEgfVxuICAgICAqIH07XG4gICAgICpcbiAgICAgKiAvLyBtb2RpZnlpbmcgdGhlIHJlc3VsdCBjYWNoZVxuICAgICAqIHZhciBnZXQgPSBfLm1lbW9pemUoZnVuY3Rpb24obmFtZSkgeyByZXR1cm4gZGF0YVtuYW1lXTsgfSwgXy5pZGVudGl0eSk7XG4gICAgICogZ2V0KCdwZWJibGVzJyk7XG4gICAgICogLy8gPT4geyAnbmFtZSc6ICdwZWJibGVzJywgJ2FnZSc6IDEgfVxuICAgICAqXG4gICAgICogZ2V0LmNhY2hlLnBlYmJsZXMubmFtZSA9ICdwZW5lbG9wZSc7XG4gICAgICogZ2V0KCdwZWJibGVzJyk7XG4gICAgICogLy8gPT4geyAnbmFtZSc6ICdwZW5lbG9wZScsICdhZ2UnOiAxIH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBtZW1vaXplKGZ1bmMsIHJlc29sdmVyKSB7XG4gICAgICBpZiAoIWlzRnVuY3Rpb24oZnVuYykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICAgIH1cbiAgICAgIHZhciBtZW1vaXplZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY2FjaGUgPSBtZW1vaXplZC5jYWNoZSxcbiAgICAgICAgICAgIGtleSA9IHJlc29sdmVyID8gcmVzb2x2ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSA6IGtleVByZWZpeCArIGFyZ3VtZW50c1swXTtcblxuICAgICAgICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChjYWNoZSwga2V5KVxuICAgICAgICAgID8gY2FjaGVba2V5XVxuICAgICAgICAgIDogKGNhY2hlW2tleV0gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgICAgfVxuICAgICAgbWVtb2l6ZWQuY2FjaGUgPSB7fTtcbiAgICAgIHJldHVybiBtZW1vaXplZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCBpcyByZXN0cmljdGVkIHRvIGV4ZWN1dGUgYGZ1bmNgIG9uY2UuIFJlcGVhdCBjYWxscyB0b1xuICAgICAqIHRoZSBmdW5jdGlvbiB3aWxsIHJldHVybiB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IGNhbGwuIFRoZSBgZnVuY2AgaXMgZXhlY3V0ZWRcbiAgICAgKiB3aXRoIHRoZSBgdGhpc2AgYmluZGluZyBvZiB0aGUgY3JlYXRlZCBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byByZXN0cmljdC5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyByZXN0cmljdGVkIGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgaW5pdGlhbGl6ZSA9IF8ub25jZShjcmVhdGVBcHBsaWNhdGlvbik7XG4gICAgICogaW5pdGlhbGl6ZSgpO1xuICAgICAqIGluaXRpYWxpemUoKTtcbiAgICAgKiAvLyBgaW5pdGlhbGl6ZWAgZXhlY3V0ZXMgYGNyZWF0ZUFwcGxpY2F0aW9uYCBvbmNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gb25jZShmdW5jKSB7XG4gICAgICB2YXIgcmFuLFxuICAgICAgICAgIHJlc3VsdDtcblxuICAgICAgaWYgKCFpc0Z1bmN0aW9uKGZ1bmMpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3I7XG4gICAgICB9XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChyYW4pIHtcbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIHJhbiA9IHRydWU7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgICAgICAvLyBjbGVhciB0aGUgYGZ1bmNgIHZhcmlhYmxlIHNvIHRoZSBmdW5jdGlvbiBtYXkgYmUgZ2FyYmFnZSBjb2xsZWN0ZWRcbiAgICAgICAgZnVuYyA9IG51bGw7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0LCB3aGVuIGNhbGxlZCwgaW52b2tlcyBgZnVuY2Agd2l0aCBhbnkgYWRkaXRpb25hbFxuICAgICAqIGBwYXJ0aWFsYCBhcmd1bWVudHMgcHJlcGVuZGVkIHRvIHRob3NlIHByb3ZpZGVkIHRvIHRoZSBuZXcgZnVuY3Rpb24uIFRoaXNcbiAgICAgKiBtZXRob2QgaXMgc2ltaWxhciB0byBgXy5iaW5kYCBleGNlcHQgaXQgZG9lcyAqKm5vdCoqIGFsdGVyIHRoZSBgdGhpc2AgYmluZGluZy5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBwYXJ0aWFsbHkgYXBwbHkgYXJndW1lbnRzIHRvLlxuICAgICAqIEBwYXJhbSB7Li4uKn0gW2FyZ10gQXJndW1lbnRzIHRvIGJlIHBhcnRpYWxseSBhcHBsaWVkLlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IHBhcnRpYWxseSBhcHBsaWVkIGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgZ3JlZXQgPSBmdW5jdGlvbihncmVldGluZywgbmFtZSkgeyByZXR1cm4gZ3JlZXRpbmcgKyAnICcgKyBuYW1lOyB9O1xuICAgICAqIHZhciBoaSA9IF8ucGFydGlhbChncmVldCwgJ2hpJyk7XG4gICAgICogaGkoJ2ZyZWQnKTtcbiAgICAgKiAvLyA9PiAnaGkgZnJlZCdcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBwYXJ0aWFsKGZ1bmMpIHtcbiAgICAgIHJldHVybiBjcmVhdGVXcmFwcGVyKGZ1bmMsIDE2LCBzbGljZShhcmd1bWVudHMsIDEpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBpcyBsaWtlIGBfLnBhcnRpYWxgIGV4Y2VwdCB0aGF0IGBwYXJ0aWFsYCBhcmd1bWVudHMgYXJlXG4gICAgICogYXBwZW5kZWQgdG8gdGhvc2UgcHJvdmlkZWQgdG8gdGhlIG5ldyBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBwYXJ0aWFsbHkgYXBwbHkgYXJndW1lbnRzIHRvLlxuICAgICAqIEBwYXJhbSB7Li4uKn0gW2FyZ10gQXJndW1lbnRzIHRvIGJlIHBhcnRpYWxseSBhcHBsaWVkLlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IHBhcnRpYWxseSBhcHBsaWVkIGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgZGVmYXVsdHNEZWVwID0gXy5wYXJ0aWFsUmlnaHQoXy5tZXJnZSwgXy5kZWZhdWx0cyk7XG4gICAgICpcbiAgICAgKiB2YXIgb3B0aW9ucyA9IHtcbiAgICAgKiAgICd2YXJpYWJsZSc6ICdkYXRhJyxcbiAgICAgKiAgICdpbXBvcnRzJzogeyAnanEnOiAkIH1cbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogZGVmYXVsdHNEZWVwKG9wdGlvbnMsIF8udGVtcGxhdGVTZXR0aW5ncyk7XG4gICAgICpcbiAgICAgKiBvcHRpb25zLnZhcmlhYmxlXG4gICAgICogLy8gPT4gJ2RhdGEnXG4gICAgICpcbiAgICAgKiBvcHRpb25zLmltcG9ydHNcbiAgICAgKiAvLyA9PiB7ICdfJzogXywgJ2pxJzogJCB9XG4gICAgICovXG4gICAgZnVuY3Rpb24gcGFydGlhbFJpZ2h0KGZ1bmMpIHtcbiAgICAgIHJldHVybiBjcmVhdGVXcmFwcGVyKGZ1bmMsIDMyLCBudWxsLCBzbGljZShhcmd1bWVudHMsIDEpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCwgd2hlbiBleGVjdXRlZCwgd2lsbCBvbmx5IGNhbGwgdGhlIGBmdW5jYCBmdW5jdGlvblxuICAgICAqIGF0IG1vc3Qgb25jZSBwZXIgZXZlcnkgYHdhaXRgIG1pbGxpc2Vjb25kcy4gUHJvdmlkZSBhbiBvcHRpb25zIG9iamVjdCB0b1xuICAgICAqIGluZGljYXRlIHRoYXQgYGZ1bmNgIHNob3VsZCBiZSBpbnZva2VkIG9uIHRoZSBsZWFkaW5nIGFuZC9vciB0cmFpbGluZyBlZGdlXG4gICAgICogb2YgdGhlIGB3YWl0YCB0aW1lb3V0LiBTdWJzZXF1ZW50IGNhbGxzIHRvIHRoZSB0aHJvdHRsZWQgZnVuY3Rpb24gd2lsbFxuICAgICAqIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0IGBmdW5jYCBjYWxsLlxuICAgICAqXG4gICAgICogTm90ZTogSWYgYGxlYWRpbmdgIGFuZCBgdHJhaWxpbmdgIG9wdGlvbnMgYXJlIGB0cnVlYCBgZnVuY2Agd2lsbCBiZSBjYWxsZWRcbiAgICAgKiBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uIGlzXG4gICAgICogaW52b2tlZCBtb3JlIHRoYW4gb25jZSBkdXJpbmcgdGhlIGB3YWl0YCB0aW1lb3V0LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uc1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIHRocm90dGxlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3YWl0IFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIHRocm90dGxlIGV4ZWN1dGlvbnMgdG8uXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBUaGUgb3B0aW9ucyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPXRydWVdIFNwZWNpZnkgZXhlY3V0aW9uIG9uIHRoZSBsZWFkaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50cmFpbGluZz10cnVlXSBTcGVjaWZ5IGV4ZWN1dGlvbiBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyB0aHJvdHRsZWQgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIC8vIGF2b2lkIGV4Y2Vzc2l2ZWx5IHVwZGF0aW5nIHRoZSBwb3NpdGlvbiB3aGlsZSBzY3JvbGxpbmdcbiAgICAgKiB2YXIgdGhyb3R0bGVkID0gXy50aHJvdHRsZSh1cGRhdGVQb3NpdGlvbiwgMTAwKTtcbiAgICAgKiBqUXVlcnkod2luZG93KS5vbignc2Nyb2xsJywgdGhyb3R0bGVkKTtcbiAgICAgKlxuICAgICAqIC8vIGV4ZWN1dGUgYHJlbmV3VG9rZW5gIHdoZW4gdGhlIGNsaWNrIGV2ZW50IGlzIGZpcmVkLCBidXQgbm90IG1vcmUgdGhhbiBvbmNlIGV2ZXJ5IDUgbWludXRlc1xuICAgICAqIGpRdWVyeSgnLmludGVyYWN0aXZlJykub24oJ2NsaWNrJywgXy50aHJvdHRsZShyZW5ld1Rva2VuLCAzMDAwMDAsIHtcbiAgICAgKiAgICd0cmFpbGluZyc6IGZhbHNlXG4gICAgICogfSkpO1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRocm90dGxlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgICAgIHZhciBsZWFkaW5nID0gdHJ1ZSxcbiAgICAgICAgICB0cmFpbGluZyA9IHRydWU7XG5cbiAgICAgIGlmICghaXNGdW5jdGlvbihmdW5jKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yO1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMgPT09IGZhbHNlKSB7XG4gICAgICAgIGxlYWRpbmcgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgbGVhZGluZyA9ICdsZWFkaW5nJyBpbiBvcHRpb25zID8gb3B0aW9ucy5sZWFkaW5nIDogbGVhZGluZztcbiAgICAgICAgdHJhaWxpbmcgPSAndHJhaWxpbmcnIGluIG9wdGlvbnMgPyBvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XG4gICAgICB9XG4gICAgICBkZWJvdW5jZU9wdGlvbnMubGVhZGluZyA9IGxlYWRpbmc7XG4gICAgICBkZWJvdW5jZU9wdGlvbnMubWF4V2FpdCA9IHdhaXQ7XG4gICAgICBkZWJvdW5jZU9wdGlvbnMudHJhaWxpbmcgPSB0cmFpbGluZztcblxuICAgICAgcmV0dXJuIGRlYm91bmNlKGZ1bmMsIHdhaXQsIGRlYm91bmNlT3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgcHJvdmlkZXMgYHZhbHVlYCB0byB0aGUgd3JhcHBlciBmdW5jdGlvbiBhcyBpdHNcbiAgICAgKiBmaXJzdCBhcmd1bWVudC4gQWRkaXRpb25hbCBhcmd1bWVudHMgcHJvdmlkZWQgdG8gdGhlIGZ1bmN0aW9uIGFyZSBhcHBlbmRlZFxuICAgICAqIHRvIHRob3NlIHByb3ZpZGVkIHRvIHRoZSB3cmFwcGVyIGZ1bmN0aW9uLiBUaGUgd3JhcHBlciBpcyBleGVjdXRlZCB3aXRoXG4gICAgICogdGhlIGB0aGlzYCBiaW5kaW5nIG9mIHRoZSBjcmVhdGVkIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uc1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHdyYXAuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gd3JhcHBlciBUaGUgd3JhcHBlciBmdW5jdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIHAgPSBfLndyYXAoXy5lc2NhcGUsIGZ1bmN0aW9uKGZ1bmMsIHRleHQpIHtcbiAgICAgKiAgIHJldHVybiAnPHA+JyArIGZ1bmModGV4dCkgKyAnPC9wPic7XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBwKCdGcmVkLCBXaWxtYSwgJiBQZWJibGVzJyk7XG4gICAgICogLy8gPT4gJzxwPkZyZWQsIFdpbG1hLCAmYW1wOyBQZWJibGVzPC9wPidcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB3cmFwKHZhbHVlLCB3cmFwcGVyKSB7XG4gICAgICByZXR1cm4gY3JlYXRlV3JhcHBlcih3cmFwcGVyLCAxNiwgW3ZhbHVlXSk7XG4gICAgfVxuXG4gICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGB2YWx1ZWAuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgVXRpbGl0aWVzXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcmV0dXJuIGZyb20gdGhlIG5ldyBmdW5jdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIG9iamVjdCA9IHsgJ25hbWUnOiAnZnJlZCcgfTtcbiAgICAgKiB2YXIgZ2V0dGVyID0gXy5jb25zdGFudChvYmplY3QpO1xuICAgICAqIGdldHRlcigpID09PSBvYmplY3Q7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNvbnN0YW50KHZhbHVlKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHJvZHVjZXMgYSBjYWxsYmFjayBib3VuZCB0byBhbiBvcHRpb25hbCBgdGhpc0FyZ2AuIElmIGBmdW5jYCBpcyBhIHByb3BlcnR5XG4gICAgICogbmFtZSB0aGUgY3JlYXRlZCBjYWxsYmFjayB3aWxsIHJldHVybiB0aGUgcHJvcGVydHkgdmFsdWUgZm9yIGEgZ2l2ZW4gZWxlbWVudC5cbiAgICAgKiBJZiBgZnVuY2AgaXMgYW4gb2JqZWN0IHRoZSBjcmVhdGVkIGNhbGxiYWNrIHdpbGwgcmV0dXJuIGB0cnVlYCBmb3IgZWxlbWVudHNcbiAgICAgKiB0aGF0IGNvbnRhaW4gdGhlIGVxdWl2YWxlbnQgb2JqZWN0IHByb3BlcnRpZXMsIG90aGVyd2lzZSBpdCB3aWxsIHJldHVybiBgZmFsc2VgLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IFV0aWxpdGllc1xuICAgICAqIEBwYXJhbSB7Kn0gW2Z1bmM9aWRlbnRpdHldIFRoZSB2YWx1ZSB0byBjb252ZXJ0IHRvIGEgY2FsbGJhY2suXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIHRoZSBjcmVhdGVkIGNhbGxiYWNrLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbYXJnQ291bnRdIFRoZSBudW1iZXIgb2YgYXJndW1lbnRzIHRoZSBjYWxsYmFjayBhY2NlcHRzLlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyBhIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgJ2FnZSc6IDM2IH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICdhZ2UnOiA0MCB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIC8vIHdyYXAgdG8gY3JlYXRlIGN1c3RvbSBjYWxsYmFjayBzaG9ydGhhbmRzXG4gICAgICogXy5jcmVhdGVDYWxsYmFjayA9IF8ud3JhcChfLmNyZWF0ZUNhbGxiYWNrLCBmdW5jdGlvbihmdW5jLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAqICAgdmFyIG1hdGNoID0gL14oLis/KV9fKFtnbF10KSguKykkLy5leGVjKGNhbGxiYWNrKTtcbiAgICAgKiAgIHJldHVybiAhbWF0Y2ggPyBmdW5jKGNhbGxiYWNrLCB0aGlzQXJnKSA6IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAqICAgICByZXR1cm4gbWF0Y2hbMl0gPT0gJ2d0JyA/IG9iamVjdFttYXRjaFsxXV0gPiBtYXRjaFszXSA6IG9iamVjdFttYXRjaFsxXV0gPCBtYXRjaFszXTtcbiAgICAgKiAgIH07XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBfLmZpbHRlcihjaGFyYWN0ZXJzLCAnYWdlX19ndDM4Jyk7XG4gICAgICogLy8gPT4gW3sgJ25hbWUnOiAnZnJlZCcsICdhZ2UnOiA0MCB9XVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNyZWF0ZUNhbGxiYWNrKGZ1bmMsIHRoaXNBcmcsIGFyZ0NvdW50KSB7XG4gICAgICB2YXIgdHlwZSA9IHR5cGVvZiBmdW5jO1xuICAgICAgaWYgKGZ1bmMgPT0gbnVsbCB8fCB0eXBlID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIGJhc2VDcmVhdGVDYWxsYmFjayhmdW5jLCB0aGlzQXJnLCBhcmdDb3VudCk7XG4gICAgICB9XG4gICAgICAvLyBoYW5kbGUgXCJfLnBsdWNrXCIgc3R5bGUgY2FsbGJhY2sgc2hvcnRoYW5kc1xuICAgICAgaWYgKHR5cGUgIT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIHByb3BlcnR5KGZ1bmMpO1xuICAgICAgfVxuICAgICAgdmFyIHByb3BzID0ga2V5cyhmdW5jKSxcbiAgICAgICAgICBrZXkgPSBwcm9wc1swXSxcbiAgICAgICAgICBhID0gZnVuY1trZXldO1xuXG4gICAgICAvLyBoYW5kbGUgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2sgc2hvcnRoYW5kc1xuICAgICAgaWYgKHByb3BzLmxlbmd0aCA9PSAxICYmIGEgPT09IGEgJiYgIWlzT2JqZWN0KGEpKSB7XG4gICAgICAgIC8vIGZhc3QgcGF0aCB0aGUgY29tbW9uIGNhc2Ugb2YgcHJvdmlkaW5nIGFuIG9iamVjdCB3aXRoIGEgc2luZ2xlXG4gICAgICAgIC8vIHByb3BlcnR5IGNvbnRhaW5pbmcgYSBwcmltaXRpdmUgdmFsdWVcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgICAgIHZhciBiID0gb2JqZWN0W2tleV07XG4gICAgICAgICAgcmV0dXJuIGEgPT09IGIgJiYgKGEgIT09IDAgfHwgKDEgLyBhID09IDEgLyBiKSk7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICAgIHZhciBsZW5ndGggPSBwcm9wcy5sZW5ndGgsXG4gICAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcblxuICAgICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgICBpZiAoIShyZXN1bHQgPSBiYXNlSXNFcXVhbChvYmplY3RbcHJvcHNbbGVuZ3RoXV0sIGZ1bmNbcHJvcHNbbGVuZ3RoXV0sIG51bGwsIHRydWUpKSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnRzIHRoZSBjaGFyYWN0ZXJzIGAmYCwgYDxgLCBgPmAsIGBcImAsIGFuZCBgJ2AgaW4gYHN0cmluZ2AgdG8gdGhlaXJcbiAgICAgKiBjb3JyZXNwb25kaW5nIEhUTUwgZW50aXRpZXMuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgVXRpbGl0aWVzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBUaGUgc3RyaW5nIHRvIGVzY2FwZS5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBlc2NhcGVkIHN0cmluZy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5lc2NhcGUoJ0ZyZWQsIFdpbG1hLCAmIFBlYmJsZXMnKTtcbiAgICAgKiAvLyA9PiAnRnJlZCwgV2lsbWEsICZhbXA7IFBlYmJsZXMnXG4gICAgICovXG4gICAgZnVuY3Rpb24gZXNjYXBlKHN0cmluZykge1xuICAgICAgcmV0dXJuIHN0cmluZyA9PSBudWxsID8gJycgOiBTdHJpbmcoc3RyaW5nKS5yZXBsYWNlKHJlVW5lc2NhcGVkSHRtbCwgZXNjYXBlSHRtbENoYXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHJldHVybnMgdGhlIGZpcnN0IGFyZ3VtZW50IHByb3ZpZGVkIHRvIGl0LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IFV0aWxpdGllc1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgQW55IHZhbHVlLlxuICAgICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIGB2YWx1ZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBvYmplY3QgPSB7ICduYW1lJzogJ2ZyZWQnIH07XG4gICAgICogXy5pZGVudGl0eShvYmplY3QpID09PSBvYmplY3Q7XG4gICAgICogLy8gPT4gdHJ1ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlkZW50aXR5KHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBmdW5jdGlvbiBwcm9wZXJ0aWVzIG9mIGEgc291cmNlIG9iamVjdCB0byB0aGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICAgICAqIElmIGBvYmplY3RgIGlzIGEgZnVuY3Rpb24gbWV0aG9kcyB3aWxsIGJlIGFkZGVkIHRvIGl0cyBwcm90b3R5cGUgYXMgd2VsbC5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBVdGlsaXRpZXNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdH0gW29iamVjdD1sb2Rhc2hdIG9iamVjdCBUaGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2UgVGhlIG9iamVjdCBvZiBmdW5jdGlvbnMgdG8gYWRkLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuY2hhaW49dHJ1ZV0gU3BlY2lmeSB3aGV0aGVyIHRoZSBmdW5jdGlvbnMgYWRkZWQgYXJlIGNoYWluYWJsZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogZnVuY3Rpb24gY2FwaXRhbGl6ZShzdHJpbmcpIHtcbiAgICAgKiAgIHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSkudG9Mb3dlckNhc2UoKTtcbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBfLm1peGluKHsgJ2NhcGl0YWxpemUnOiBjYXBpdGFsaXplIH0pO1xuICAgICAqIF8uY2FwaXRhbGl6ZSgnZnJlZCcpO1xuICAgICAqIC8vID0+ICdGcmVkJ1xuICAgICAqXG4gICAgICogXygnZnJlZCcpLmNhcGl0YWxpemUoKS52YWx1ZSgpO1xuICAgICAqIC8vID0+ICdGcmVkJ1xuICAgICAqXG4gICAgICogXy5taXhpbih7ICdjYXBpdGFsaXplJzogY2FwaXRhbGl6ZSB9LCB7ICdjaGFpbic6IGZhbHNlIH0pO1xuICAgICAqIF8oJ2ZyZWQnKS5jYXBpdGFsaXplKCk7XG4gICAgICogLy8gPT4gJ0ZyZWQnXG4gICAgICovXG4gICAgZnVuY3Rpb24gbWl4aW4ob2JqZWN0LCBzb3VyY2UsIG9wdGlvbnMpIHtcbiAgICAgIHZhciBjaGFpbiA9IHRydWUsXG4gICAgICAgICAgbWV0aG9kTmFtZXMgPSBzb3VyY2UgJiYgZnVuY3Rpb25zKHNvdXJjZSk7XG5cbiAgICAgIGlmICghc291cmNlIHx8ICghb3B0aW9ucyAmJiAhbWV0aG9kTmFtZXMubGVuZ3RoKSkge1xuICAgICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgICAgb3B0aW9ucyA9IHNvdXJjZTtcbiAgICAgICAgfVxuICAgICAgICBjdG9yID0gbG9kYXNoV3JhcHBlcjtcbiAgICAgICAgc291cmNlID0gb2JqZWN0O1xuICAgICAgICBvYmplY3QgPSBsb2Rhc2g7XG4gICAgICAgIG1ldGhvZE5hbWVzID0gZnVuY3Rpb25zKHNvdXJjZSk7XG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucyA9PT0gZmFsc2UpIHtcbiAgICAgICAgY2hhaW4gPSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZiAoaXNPYmplY3Qob3B0aW9ucykgJiYgJ2NoYWluJyBpbiBvcHRpb25zKSB7XG4gICAgICAgIGNoYWluID0gb3B0aW9ucy5jaGFpbjtcbiAgICAgIH1cbiAgICAgIHZhciBjdG9yID0gb2JqZWN0LFxuICAgICAgICAgIGlzRnVuYyA9IGlzRnVuY3Rpb24oY3Rvcik7XG5cbiAgICAgIGZvckVhY2gobWV0aG9kTmFtZXMsIGZ1bmN0aW9uKG1ldGhvZE5hbWUpIHtcbiAgICAgICAgdmFyIGZ1bmMgPSBvYmplY3RbbWV0aG9kTmFtZV0gPSBzb3VyY2VbbWV0aG9kTmFtZV07XG4gICAgICAgIGlmIChpc0Z1bmMpIHtcbiAgICAgICAgICBjdG9yLnByb3RvdHlwZVttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGNoYWluQWxsID0gdGhpcy5fX2NoYWluX18sXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB0aGlzLl9fd3JhcHBlZF9fLFxuICAgICAgICAgICAgICAgIGFyZ3MgPSBbdmFsdWVdO1xuXG4gICAgICAgICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gZnVuYy5hcHBseShvYmplY3QsIGFyZ3MpO1xuICAgICAgICAgICAgaWYgKGNoYWluIHx8IGNoYWluQWxsKSB7XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gcmVzdWx0ICYmIGlzT2JqZWN0KHJlc3VsdCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgY3RvcihyZXN1bHQpO1xuICAgICAgICAgICAgICByZXN1bHQuX19jaGFpbl9fID0gY2hhaW5BbGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldmVydHMgdGhlICdfJyB2YXJpYWJsZSB0byBpdHMgcHJldmlvdXMgdmFsdWUgYW5kIHJldHVybnMgYSByZWZlcmVuY2UgdG9cbiAgICAgKiB0aGUgYGxvZGFzaGAgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgVXRpbGl0aWVzXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBgbG9kYXNoYCBmdW5jdGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogdmFyIGxvZGFzaCA9IF8ubm9Db25mbGljdCgpO1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIG5vQ29uZmxpY3QoKSB7XG4gICAgICBjb250ZXh0Ll8gPSBvbGREYXNoO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBuby1vcGVyYXRpb24gZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgVXRpbGl0aWVzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBvYmplY3QgPSB7ICduYW1lJzogJ2ZyZWQnIH07XG4gICAgICogXy5ub29wKG9iamVjdCkgPT09IHVuZGVmaW5lZDtcbiAgICAgKiAvLyA9PiB0cnVlXG4gICAgICovXG4gICAgZnVuY3Rpb24gbm9vcCgpIHtcbiAgICAgIC8vIG5vIG9wZXJhdGlvbiBwZXJmb3JtZWRcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRoYXQgaGF2ZSBlbGFwc2VkIHNpbmNlIHRoZSBVbml4IGVwb2NoXG4gICAgICogKDEgSmFudWFyeSAxOTcwIDAwOjAwOjAwIFVUQykuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgVXRpbGl0aWVzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBzdGFtcCA9IF8ubm93KCk7XG4gICAgICogXy5kZWZlcihmdW5jdGlvbigpIHsgY29uc29sZS5sb2coXy5ub3coKSAtIHN0YW1wKTsgfSk7XG4gICAgICogLy8gPT4gbG9ncyB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBpdCB0b29rIGZvciB0aGUgZGVmZXJyZWQgZnVuY3Rpb24gdG8gYmUgY2FsbGVkXG4gICAgICovXG4gICAgdmFyIG5vdyA9IGlzTmF0aXZlKG5vdyA9IERhdGUubm93KSAmJiBub3cgfHwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENvbnZlcnRzIHRoZSBnaXZlbiB2YWx1ZSBpbnRvIGFuIGludGVnZXIgb2YgdGhlIHNwZWNpZmllZCByYWRpeC5cbiAgICAgKiBJZiBgcmFkaXhgIGlzIGB1bmRlZmluZWRgIG9yIGAwYCBhIGByYWRpeGAgb2YgYDEwYCBpcyB1c2VkIHVubGVzcyB0aGVcbiAgICAgKiBgdmFsdWVgIGlzIGEgaGV4YWRlY2ltYWwsIGluIHdoaWNoIGNhc2UgYSBgcmFkaXhgIG9mIGAxNmAgaXMgdXNlZC5cbiAgICAgKlxuICAgICAqIE5vdGU6IFRoaXMgbWV0aG9kIGF2b2lkcyBkaWZmZXJlbmNlcyBpbiBuYXRpdmUgRVMzIGFuZCBFUzUgYHBhcnNlSW50YFxuICAgICAqIGltcGxlbWVudGF0aW9ucy4gU2VlIGh0dHA6Ly9lczUuZ2l0aHViLmlvLyNFLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IFV0aWxpdGllc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcGFyc2UuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtyYWRpeF0gVGhlIHJhZGl4IHVzZWQgdG8gaW50ZXJwcmV0IHRoZSB2YWx1ZSB0byBwYXJzZS5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBuZXcgaW50ZWdlciB2YWx1ZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy5wYXJzZUludCgnMDgnKTtcbiAgICAgKiAvLyA9PiA4XG4gICAgICovXG4gICAgdmFyIHBhcnNlSW50ID0gbmF0aXZlUGFyc2VJbnQod2hpdGVzcGFjZSArICcwOCcpID09IDggPyBuYXRpdmVQYXJzZUludCA6IGZ1bmN0aW9uKHZhbHVlLCByYWRpeCkge1xuICAgICAgLy8gRmlyZWZveCA8IDIxIGFuZCBPcGVyYSA8IDE1IGZvbGxvdyB0aGUgRVMzIHNwZWNpZmllZCBpbXBsZW1lbnRhdGlvbiBvZiBgcGFyc2VJbnRgXG4gICAgICByZXR1cm4gbmF0aXZlUGFyc2VJbnQoaXNTdHJpbmcodmFsdWUpID8gdmFsdWUucmVwbGFjZShyZUxlYWRpbmdTcGFjZXNBbmRaZXJvcywgJycpIDogdmFsdWUsIHJhZGl4IHx8IDApO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgXCJfLnBsdWNrXCIgc3R5bGUgZnVuY3Rpb24sIHdoaWNoIHJldHVybnMgdGhlIGBrZXlgIHZhbHVlIG9mIGFcbiAgICAgKiBnaXZlbiBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgVXRpbGl0aWVzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gcmV0cmlldmUuXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBjaGFyYWN0ZXJzID0gW1xuICAgICAqICAgeyAnbmFtZSc6ICdmcmVkJywgICAnYWdlJzogNDAgfSxcbiAgICAgKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgJ2FnZSc6IDM2IH1cbiAgICAgKiBdO1xuICAgICAqXG4gICAgICogdmFyIGdldE5hbWUgPSBfLnByb3BlcnR5KCduYW1lJyk7XG4gICAgICpcbiAgICAgKiBfLm1hcChjaGFyYWN0ZXJzLCBnZXROYW1lKTtcbiAgICAgKiAvLyA9PiBbJ2Jhcm5leScsICdmcmVkJ11cbiAgICAgKlxuICAgICAqIF8uc29ydEJ5KGNoYXJhY3RlcnMsIGdldE5hbWUpO1xuICAgICAqIC8vID0+IFt7ICduYW1lJzogJ2Jhcm5leScsICdhZ2UnOiAzNiB9LCB7ICduYW1lJzogJ2ZyZWQnLCAgICdhZ2UnOiA0MCB9XVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHByb3BlcnR5KGtleSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgICByZXR1cm4gb2JqZWN0W2tleV07XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFByb2R1Y2VzIGEgcmFuZG9tIG51bWJlciBiZXR3ZWVuIGBtaW5gIGFuZCBgbWF4YCAoaW5jbHVzaXZlKS4gSWYgb25seSBvbmVcbiAgICAgKiBhcmd1bWVudCBpcyBwcm92aWRlZCBhIG51bWJlciBiZXR3ZWVuIGAwYCBhbmQgdGhlIGdpdmVuIG51bWJlciB3aWxsIGJlXG4gICAgICogcmV0dXJuZWQuIElmIGBmbG9hdGluZ2AgaXMgdHJ1ZXkgb3IgZWl0aGVyIGBtaW5gIG9yIGBtYXhgIGFyZSBmbG9hdHMgYVxuICAgICAqIGZsb2F0aW5nLXBvaW50IG51bWJlciB3aWxsIGJlIHJldHVybmVkIGluc3RlYWQgb2YgYW4gaW50ZWdlci5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBVdGlsaXRpZXNcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW21pbj0wXSBUaGUgbWluaW11bSBwb3NzaWJsZSB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW21heD0xXSBUaGUgbWF4aW11bSBwb3NzaWJsZSB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtmbG9hdGluZz1mYWxzZV0gU3BlY2lmeSByZXR1cm5pbmcgYSBmbG9hdGluZy1wb2ludCBudW1iZXIuXG4gICAgICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyBhIHJhbmRvbSBudW1iZXIuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8ucmFuZG9tKDAsIDUpO1xuICAgICAqIC8vID0+IGFuIGludGVnZXIgYmV0d2VlbiAwIGFuZCA1XG4gICAgICpcbiAgICAgKiBfLnJhbmRvbSg1KTtcbiAgICAgKiAvLyA9PiBhbHNvIGFuIGludGVnZXIgYmV0d2VlbiAwIGFuZCA1XG4gICAgICpcbiAgICAgKiBfLnJhbmRvbSg1LCB0cnVlKTtcbiAgICAgKiAvLyA9PiBhIGZsb2F0aW5nLXBvaW50IG51bWJlciBiZXR3ZWVuIDAgYW5kIDVcbiAgICAgKlxuICAgICAqIF8ucmFuZG9tKDEuMiwgNS4yKTtcbiAgICAgKiAvLyA9PiBhIGZsb2F0aW5nLXBvaW50IG51bWJlciBiZXR3ZWVuIDEuMiBhbmQgNS4yXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmFuZG9tKG1pbiwgbWF4LCBmbG9hdGluZykge1xuICAgICAgdmFyIG5vTWluID0gbWluID09IG51bGwsXG4gICAgICAgICAgbm9NYXggPSBtYXggPT0gbnVsbDtcblxuICAgICAgaWYgKGZsb2F0aW5nID09IG51bGwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtaW4gPT0gJ2Jvb2xlYW4nICYmIG5vTWF4KSB7XG4gICAgICAgICAgZmxvYXRpbmcgPSBtaW47XG4gICAgICAgICAgbWluID0gMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghbm9NYXggJiYgdHlwZW9mIG1heCA9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICBmbG9hdGluZyA9IG1heDtcbiAgICAgICAgICBub01heCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChub01pbiAmJiBub01heCkge1xuICAgICAgICBtYXggPSAxO1xuICAgICAgfVxuICAgICAgbWluID0gK21pbiB8fCAwO1xuICAgICAgaWYgKG5vTWF4KSB7XG4gICAgICAgIG1heCA9IG1pbjtcbiAgICAgICAgbWluID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1heCA9ICttYXggfHwgMDtcbiAgICAgIH1cbiAgICAgIGlmIChmbG9hdGluZyB8fCBtaW4gJSAxIHx8IG1heCAlIDEpIHtcbiAgICAgICAgdmFyIHJhbmQgPSBuYXRpdmVSYW5kb20oKTtcbiAgICAgICAgcmV0dXJuIG5hdGl2ZU1pbihtaW4gKyAocmFuZCAqIChtYXggLSBtaW4gKyBwYXJzZUZsb2F0KCcxZS0nICsgKChyYW5kICsnJykubGVuZ3RoIC0gMSkpKSksIG1heCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYmFzZVJhbmRvbShtaW4sIG1heCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVzb2x2ZXMgdGhlIHZhbHVlIG9mIHByb3BlcnR5IGBrZXlgIG9uIGBvYmplY3RgLiBJZiBga2V5YCBpcyBhIGZ1bmN0aW9uXG4gICAgICogaXQgd2lsbCBiZSBpbnZva2VkIHdpdGggdGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBvYmplY3RgIGFuZCBpdHMgcmVzdWx0IHJldHVybmVkLFxuICAgICAqIGVsc2UgdGhlIHByb3BlcnR5IHZhbHVlIGlzIHJldHVybmVkLiBJZiBgb2JqZWN0YCBpcyBmYWxzZXkgdGhlbiBgdW5kZWZpbmVkYFxuICAgICAqIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IFV0aWxpdGllc1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpbnNwZWN0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIHJlc29sdmUuXG4gICAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIHJlc29sdmVkIHZhbHVlLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgb2JqZWN0ID0ge1xuICAgICAqICAgJ2NoZWVzZSc6ICdjcnVtcGV0cycsXG4gICAgICogICAnc3R1ZmYnOiBmdW5jdGlvbigpIHtcbiAgICAgKiAgICAgcmV0dXJuICdub25zZW5zZSc7XG4gICAgICogICB9XG4gICAgICogfTtcbiAgICAgKlxuICAgICAqIF8ucmVzdWx0KG9iamVjdCwgJ2NoZWVzZScpO1xuICAgICAqIC8vID0+ICdjcnVtcGV0cydcbiAgICAgKlxuICAgICAqIF8ucmVzdWx0KG9iamVjdCwgJ3N0dWZmJyk7XG4gICAgICogLy8gPT4gJ25vbnNlbnNlJ1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlc3VsdChvYmplY3QsIGtleSkge1xuICAgICAgaWYgKG9iamVjdCkge1xuICAgICAgICB2YXIgdmFsdWUgPSBvYmplY3Rba2V5XTtcbiAgICAgICAgcmV0dXJuIGlzRnVuY3Rpb24odmFsdWUpID8gb2JqZWN0W2tleV0oKSA6IHZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEEgbWljcm8tdGVtcGxhdGluZyBtZXRob2QgdGhhdCBoYW5kbGVzIGFyYml0cmFyeSBkZWxpbWl0ZXJzLCBwcmVzZXJ2ZXNcbiAgICAgKiB3aGl0ZXNwYWNlLCBhbmQgY29ycmVjdGx5IGVzY2FwZXMgcXVvdGVzIHdpdGhpbiBpbnRlcnBvbGF0ZWQgY29kZS5cbiAgICAgKlxuICAgICAqIE5vdGU6IEluIHRoZSBkZXZlbG9wbWVudCBidWlsZCwgYF8udGVtcGxhdGVgIHV0aWxpemVzIHNvdXJjZVVSTHMgZm9yIGVhc2llclxuICAgICAqIGRlYnVnZ2luZy4gU2VlIGh0dHA6Ly93d3cuaHRtbDVyb2Nrcy5jb20vZW4vdHV0b3JpYWxzL2RldmVsb3BlcnRvb2xzL3NvdXJjZW1hcHMvI3RvYy1zb3VyY2V1cmxcbiAgICAgKlxuICAgICAqIEZvciBtb3JlIGluZm9ybWF0aW9uIG9uIHByZWNvbXBpbGluZyB0ZW1wbGF0ZXMgc2VlOlxuICAgICAqIGh0dHA6Ly9sb2Rhc2guY29tL2N1c3RvbS1idWlsZHNcbiAgICAgKlxuICAgICAqIEZvciBtb3JlIGluZm9ybWF0aW9uIG9uIENocm9tZSBleHRlbnNpb24gc2FuZGJveGVzIHNlZTpcbiAgICAgKiBodHRwOi8vZGV2ZWxvcGVyLmNocm9tZS5jb20vc3RhYmxlL2V4dGVuc2lvbnMvc2FuZGJveGluZ0V2YWwuaHRtbFxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IFV0aWxpdGllc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IFRoZSB0ZW1wbGF0ZSB0ZXh0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIFRoZSBkYXRhIG9iamVjdCB1c2VkIHRvIHBvcHVsYXRlIHRoZSB0ZXh0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7UmVnRXhwfSBbb3B0aW9ucy5lc2NhcGVdIFRoZSBcImVzY2FwZVwiIGRlbGltaXRlci5cbiAgICAgKiBAcGFyYW0ge1JlZ0V4cH0gW29wdGlvbnMuZXZhbHVhdGVdIFRoZSBcImV2YWx1YXRlXCIgZGVsaW1pdGVyLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5pbXBvcnRzXSBBbiBvYmplY3QgdG8gaW1wb3J0IGludG8gdGhlIHRlbXBsYXRlIGFzIGxvY2FsIHZhcmlhYmxlcy5cbiAgICAgKiBAcGFyYW0ge1JlZ0V4cH0gW29wdGlvbnMuaW50ZXJwb2xhdGVdIFRoZSBcImludGVycG9sYXRlXCIgZGVsaW1pdGVyLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbc291cmNlVVJMXSBUaGUgc291cmNlVVJMIG9mIHRoZSB0ZW1wbGF0ZSdzIGNvbXBpbGVkIHNvdXJjZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3ZhcmlhYmxlXSBUaGUgZGF0YSBvYmplY3QgdmFyaWFibGUgbmFtZS5cbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb258c3RyaW5nfSBSZXR1cm5zIGEgY29tcGlsZWQgZnVuY3Rpb24gd2hlbiBubyBgZGF0YWAgb2JqZWN0XG4gICAgICogIGlzIGdpdmVuLCBlbHNlIGl0IHJldHVybnMgdGhlIGludGVycG9sYXRlZCB0ZXh0LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAvLyB1c2luZyB0aGUgXCJpbnRlcnBvbGF0ZVwiIGRlbGltaXRlciB0byBjcmVhdGUgYSBjb21waWxlZCB0ZW1wbGF0ZVxuICAgICAqIHZhciBjb21waWxlZCA9IF8udGVtcGxhdGUoJ2hlbGxvIDwlPSBuYW1lICU+Jyk7XG4gICAgICogY29tcGlsZWQoeyAnbmFtZSc6ICdmcmVkJyB9KTtcbiAgICAgKiAvLyA9PiAnaGVsbG8gZnJlZCdcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIHRoZSBcImVzY2FwZVwiIGRlbGltaXRlciB0byBlc2NhcGUgSFRNTCBpbiBkYXRhIHByb3BlcnR5IHZhbHVlc1xuICAgICAqIF8udGVtcGxhdGUoJzxiPjwlLSB2YWx1ZSAlPjwvYj4nLCB7ICd2YWx1ZSc6ICc8c2NyaXB0PicgfSk7XG4gICAgICogLy8gPT4gJzxiPiZsdDtzY3JpcHQmZ3Q7PC9iPidcbiAgICAgKlxuICAgICAqIC8vIHVzaW5nIHRoZSBcImV2YWx1YXRlXCIgZGVsaW1pdGVyIHRvIGdlbmVyYXRlIEhUTUxcbiAgICAgKiB2YXIgbGlzdCA9ICc8JSBfLmZvckVhY2gocGVvcGxlLCBmdW5jdGlvbihuYW1lKSB7ICU+PGxpPjwlLSBuYW1lICU+PC9saT48JSB9KTsgJT4nO1xuICAgICAqIF8udGVtcGxhdGUobGlzdCwgeyAncGVvcGxlJzogWydmcmVkJywgJ2Jhcm5leSddIH0pO1xuICAgICAqIC8vID0+ICc8bGk+ZnJlZDwvbGk+PGxpPmJhcm5leTwvbGk+J1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgdGhlIEVTNiBkZWxpbWl0ZXIgYXMgYW4gYWx0ZXJuYXRpdmUgdG8gdGhlIGRlZmF1bHQgXCJpbnRlcnBvbGF0ZVwiIGRlbGltaXRlclxuICAgICAqIF8udGVtcGxhdGUoJ2hlbGxvICR7IG5hbWUgfScsIHsgJ25hbWUnOiAncGViYmxlcycgfSk7XG4gICAgICogLy8gPT4gJ2hlbGxvIHBlYmJsZXMnXG4gICAgICpcbiAgICAgKiAvLyB1c2luZyB0aGUgaW50ZXJuYWwgYHByaW50YCBmdW5jdGlvbiBpbiBcImV2YWx1YXRlXCIgZGVsaW1pdGVyc1xuICAgICAqIF8udGVtcGxhdGUoJzwlIHByaW50KFwiaGVsbG8gXCIgKyBuYW1lKTsgJT4hJywgeyAnbmFtZSc6ICdiYXJuZXknIH0pO1xuICAgICAqIC8vID0+ICdoZWxsbyBiYXJuZXkhJ1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgYSBjdXN0b20gdGVtcGxhdGUgZGVsaW1pdGVyc1xuICAgICAqIF8udGVtcGxhdGVTZXR0aW5ncyA9IHtcbiAgICAgKiAgICdpbnRlcnBvbGF0ZSc6IC97eyhbXFxzXFxTXSs/KX19L2dcbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogXy50ZW1wbGF0ZSgnaGVsbG8ge3sgbmFtZSB9fSEnLCB7ICduYW1lJzogJ211c3RhY2hlJyB9KTtcbiAgICAgKiAvLyA9PiAnaGVsbG8gbXVzdGFjaGUhJ1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgdGhlIGBpbXBvcnRzYCBvcHRpb24gdG8gaW1wb3J0IGpRdWVyeVxuICAgICAqIHZhciBsaXN0ID0gJzwlIGpxLmVhY2gocGVvcGxlLCBmdW5jdGlvbihuYW1lKSB7ICU+PGxpPjwlLSBuYW1lICU+PC9saT48JSB9KTsgJT4nO1xuICAgICAqIF8udGVtcGxhdGUobGlzdCwgeyAncGVvcGxlJzogWydmcmVkJywgJ2Jhcm5leSddIH0sIHsgJ2ltcG9ydHMnOiB7ICdqcSc6IGpRdWVyeSB9IH0pO1xuICAgICAqIC8vID0+ICc8bGk+ZnJlZDwvbGk+PGxpPmJhcm5leTwvbGk+J1xuICAgICAqXG4gICAgICogLy8gdXNpbmcgdGhlIGBzb3VyY2VVUkxgIG9wdGlvbiB0byBzcGVjaWZ5IGEgY3VzdG9tIHNvdXJjZVVSTCBmb3IgdGhlIHRlbXBsYXRlXG4gICAgICogdmFyIGNvbXBpbGVkID0gXy50ZW1wbGF0ZSgnaGVsbG8gPCU9IG5hbWUgJT4nLCBudWxsLCB7ICdzb3VyY2VVUkwnOiAnL2Jhc2ljL2dyZWV0aW5nLmpzdCcgfSk7XG4gICAgICogY29tcGlsZWQoZGF0YSk7XG4gICAgICogLy8gPT4gZmluZCB0aGUgc291cmNlIG9mIFwiZ3JlZXRpbmcuanN0XCIgdW5kZXIgdGhlIFNvdXJjZXMgdGFiIG9yIFJlc291cmNlcyBwYW5lbCBvZiB0aGUgd2ViIGluc3BlY3RvclxuICAgICAqXG4gICAgICogLy8gdXNpbmcgdGhlIGB2YXJpYWJsZWAgb3B0aW9uIHRvIGVuc3VyZSBhIHdpdGgtc3RhdGVtZW50IGlzbid0IHVzZWQgaW4gdGhlIGNvbXBpbGVkIHRlbXBsYXRlXG4gICAgICogdmFyIGNvbXBpbGVkID0gXy50ZW1wbGF0ZSgnaGkgPCU9IGRhdGEubmFtZSAlPiEnLCBudWxsLCB7ICd2YXJpYWJsZSc6ICdkYXRhJyB9KTtcbiAgICAgKiBjb21waWxlZC5zb3VyY2U7XG4gICAgICogLy8gPT4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAqICAgdmFyIF9fdCwgX19wID0gJycsIF9fZSA9IF8uZXNjYXBlO1xuICAgICAqICAgX19wICs9ICdoaSAnICsgKChfX3QgPSAoIGRhdGEubmFtZSApKSA9PSBudWxsID8gJycgOiBfX3QpICsgJyEnO1xuICAgICAqICAgcmV0dXJuIF9fcDtcbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiAvLyB1c2luZyB0aGUgYHNvdXJjZWAgcHJvcGVydHkgdG8gaW5saW5lIGNvbXBpbGVkIHRlbXBsYXRlcyBmb3IgbWVhbmluZ2Z1bFxuICAgICAqIC8vIGxpbmUgbnVtYmVycyBpbiBlcnJvciBtZXNzYWdlcyBhbmQgYSBzdGFjayB0cmFjZVxuICAgICAqIGZzLndyaXRlRmlsZVN5bmMocGF0aC5qb2luKGN3ZCwgJ2pzdC5qcycpLCAnXFxcbiAgICAgKiAgIHZhciBKU1QgPSB7XFxcbiAgICAgKiAgICAgXCJtYWluXCI6ICcgKyBfLnRlbXBsYXRlKG1haW5UZXh0KS5zb3VyY2UgKyAnXFxcbiAgICAgKiAgIH07XFxcbiAgICAgKiAnKTtcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0ZW1wbGF0ZSh0ZXh0LCBkYXRhLCBvcHRpb25zKSB7XG4gICAgICAvLyBiYXNlZCBvbiBKb2huIFJlc2lnJ3MgYHRtcGxgIGltcGxlbWVudGF0aW9uXG4gICAgICAvLyBodHRwOi8vZWpvaG4ub3JnL2Jsb2cvamF2YXNjcmlwdC1taWNyby10ZW1wbGF0aW5nL1xuICAgICAgLy8gYW5kIExhdXJhIERva3Rvcm92YSdzIGRvVC5qc1xuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL29sYWRvL2RvVFxuICAgICAgdmFyIHNldHRpbmdzID0gbG9kYXNoLnRlbXBsYXRlU2V0dGluZ3M7XG4gICAgICB0ZXh0ID0gU3RyaW5nKHRleHQgfHwgJycpO1xuXG4gICAgICAvLyBhdm9pZCBtaXNzaW5nIGRlcGVuZGVuY2llcyB3aGVuIGBpdGVyYXRvclRlbXBsYXRlYCBpcyBub3QgZGVmaW5lZFxuICAgICAgb3B0aW9ucyA9IGRlZmF1bHRzKHt9LCBvcHRpb25zLCBzZXR0aW5ncyk7XG5cbiAgICAgIHZhciBpbXBvcnRzID0gZGVmYXVsdHMoe30sIG9wdGlvbnMuaW1wb3J0cywgc2V0dGluZ3MuaW1wb3J0cyksXG4gICAgICAgICAgaW1wb3J0c0tleXMgPSBrZXlzKGltcG9ydHMpLFxuICAgICAgICAgIGltcG9ydHNWYWx1ZXMgPSB2YWx1ZXMoaW1wb3J0cyk7XG5cbiAgICAgIHZhciBpc0V2YWx1YXRpbmcsXG4gICAgICAgICAgaW5kZXggPSAwLFxuICAgICAgICAgIGludGVycG9sYXRlID0gb3B0aW9ucy5pbnRlcnBvbGF0ZSB8fCByZU5vTWF0Y2gsXG4gICAgICAgICAgc291cmNlID0gXCJfX3AgKz0gJ1wiO1xuXG4gICAgICAvLyBjb21waWxlIHRoZSByZWdleHAgdG8gbWF0Y2ggZWFjaCBkZWxpbWl0ZXJcbiAgICAgIHZhciByZURlbGltaXRlcnMgPSBSZWdFeHAoXG4gICAgICAgIChvcHRpb25zLmVzY2FwZSB8fCByZU5vTWF0Y2gpLnNvdXJjZSArICd8JyArXG4gICAgICAgIGludGVycG9sYXRlLnNvdXJjZSArICd8JyArXG4gICAgICAgIChpbnRlcnBvbGF0ZSA9PT0gcmVJbnRlcnBvbGF0ZSA/IHJlRXNUZW1wbGF0ZSA6IHJlTm9NYXRjaCkuc291cmNlICsgJ3wnICtcbiAgICAgICAgKG9wdGlvbnMuZXZhbHVhdGUgfHwgcmVOb01hdGNoKS5zb3VyY2UgKyAnfCQnXG4gICAgICAsICdnJyk7XG5cbiAgICAgIHRleHQucmVwbGFjZShyZURlbGltaXRlcnMsIGZ1bmN0aW9uKG1hdGNoLCBlc2NhcGVWYWx1ZSwgaW50ZXJwb2xhdGVWYWx1ZSwgZXNUZW1wbGF0ZVZhbHVlLCBldmFsdWF0ZVZhbHVlLCBvZmZzZXQpIHtcbiAgICAgICAgaW50ZXJwb2xhdGVWYWx1ZSB8fCAoaW50ZXJwb2xhdGVWYWx1ZSA9IGVzVGVtcGxhdGVWYWx1ZSk7XG5cbiAgICAgICAgLy8gZXNjYXBlIGNoYXJhY3RlcnMgdGhhdCBjYW5ub3QgYmUgaW5jbHVkZWQgaW4gc3RyaW5nIGxpdGVyYWxzXG4gICAgICAgIHNvdXJjZSArPSB0ZXh0LnNsaWNlKGluZGV4LCBvZmZzZXQpLnJlcGxhY2UocmVVbmVzY2FwZWRTdHJpbmcsIGVzY2FwZVN0cmluZ0NoYXIpO1xuXG4gICAgICAgIC8vIHJlcGxhY2UgZGVsaW1pdGVycyB3aXRoIHNuaXBwZXRzXG4gICAgICAgIGlmIChlc2NhcGVWYWx1ZSkge1xuICAgICAgICAgIHNvdXJjZSArPSBcIicgK1xcbl9fZShcIiArIGVzY2FwZVZhbHVlICsgXCIpICtcXG4nXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV2YWx1YXRlVmFsdWUpIHtcbiAgICAgICAgICBpc0V2YWx1YXRpbmcgPSB0cnVlO1xuICAgICAgICAgIHNvdXJjZSArPSBcIic7XFxuXCIgKyBldmFsdWF0ZVZhbHVlICsgXCI7XFxuX19wICs9ICdcIjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW50ZXJwb2xhdGVWYWx1ZSkge1xuICAgICAgICAgIHNvdXJjZSArPSBcIicgK1xcbigoX190ID0gKFwiICsgaW50ZXJwb2xhdGVWYWx1ZSArIFwiKSkgPT0gbnVsbCA/ICcnIDogX190KSArXFxuJ1wiO1xuICAgICAgICB9XG4gICAgICAgIGluZGV4ID0gb2Zmc2V0ICsgbWF0Y2gubGVuZ3RoO1xuXG4gICAgICAgIC8vIHRoZSBKUyBlbmdpbmUgZW1iZWRkZWQgaW4gQWRvYmUgcHJvZHVjdHMgcmVxdWlyZXMgcmV0dXJuaW5nIHRoZSBgbWF0Y2hgXG4gICAgICAgIC8vIHN0cmluZyBpbiBvcmRlciB0byBwcm9kdWNlIHRoZSBjb3JyZWN0IGBvZmZzZXRgIHZhbHVlXG4gICAgICAgIHJldHVybiBtYXRjaDtcbiAgICAgIH0pO1xuXG4gICAgICBzb3VyY2UgKz0gXCInO1xcblwiO1xuXG4gICAgICAvLyBpZiBgdmFyaWFibGVgIGlzIG5vdCBzcGVjaWZpZWQsIHdyYXAgYSB3aXRoLXN0YXRlbWVudCBhcm91bmQgdGhlIGdlbmVyYXRlZFxuICAgICAgLy8gY29kZSB0byBhZGQgdGhlIGRhdGEgb2JqZWN0IHRvIHRoZSB0b3Agb2YgdGhlIHNjb3BlIGNoYWluXG4gICAgICB2YXIgdmFyaWFibGUgPSBvcHRpb25zLnZhcmlhYmxlLFxuICAgICAgICAgIGhhc1ZhcmlhYmxlID0gdmFyaWFibGU7XG5cbiAgICAgIGlmICghaGFzVmFyaWFibGUpIHtcbiAgICAgICAgdmFyaWFibGUgPSAnb2JqJztcbiAgICAgICAgc291cmNlID0gJ3dpdGggKCcgKyB2YXJpYWJsZSArICcpIHtcXG4nICsgc291cmNlICsgJ1xcbn1cXG4nO1xuICAgICAgfVxuICAgICAgLy8gY2xlYW51cCBjb2RlIGJ5IHN0cmlwcGluZyBlbXB0eSBzdHJpbmdzXG4gICAgICBzb3VyY2UgPSAoaXNFdmFsdWF0aW5nID8gc291cmNlLnJlcGxhY2UocmVFbXB0eVN0cmluZ0xlYWRpbmcsICcnKSA6IHNvdXJjZSlcbiAgICAgICAgLnJlcGxhY2UocmVFbXB0eVN0cmluZ01pZGRsZSwgJyQxJylcbiAgICAgICAgLnJlcGxhY2UocmVFbXB0eVN0cmluZ1RyYWlsaW5nLCAnJDE7Jyk7XG5cbiAgICAgIC8vIGZyYW1lIGNvZGUgYXMgdGhlIGZ1bmN0aW9uIGJvZHlcbiAgICAgIHNvdXJjZSA9ICdmdW5jdGlvbignICsgdmFyaWFibGUgKyAnKSB7XFxuJyArXG4gICAgICAgIChoYXNWYXJpYWJsZSA/ICcnIDogdmFyaWFibGUgKyAnIHx8ICgnICsgdmFyaWFibGUgKyAnID0ge30pO1xcbicpICtcbiAgICAgICAgXCJ2YXIgX190LCBfX3AgPSAnJywgX19lID0gXy5lc2NhcGVcIiArXG4gICAgICAgIChpc0V2YWx1YXRpbmdcbiAgICAgICAgICA/ICcsIF9faiA9IEFycmF5LnByb3RvdHlwZS5qb2luO1xcbicgK1xuICAgICAgICAgICAgXCJmdW5jdGlvbiBwcmludCgpIHsgX19wICs9IF9fai5jYWxsKGFyZ3VtZW50cywgJycpIH1cXG5cIlxuICAgICAgICAgIDogJztcXG4nXG4gICAgICAgICkgK1xuICAgICAgICBzb3VyY2UgK1xuICAgICAgICAncmV0dXJuIF9fcFxcbn0nO1xuXG4gICAgICAvLyBVc2UgYSBzb3VyY2VVUkwgZm9yIGVhc2llciBkZWJ1Z2dpbmcuXG4gICAgICAvLyBodHRwOi8vd3d3Lmh0bWw1cm9ja3MuY29tL2VuL3R1dG9yaWFscy9kZXZlbG9wZXJ0b29scy9zb3VyY2VtYXBzLyN0b2Mtc291cmNldXJsXG4gICAgICB2YXIgc291cmNlVVJMID0gJ1xcbi8qXFxuLy8jIHNvdXJjZVVSTD0nICsgKG9wdGlvbnMuc291cmNlVVJMIHx8ICcvbG9kYXNoL3RlbXBsYXRlL3NvdXJjZVsnICsgKHRlbXBsYXRlQ291bnRlcisrKSArICddJykgKyAnXFxuKi8nO1xuXG4gICAgICB0cnkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gRnVuY3Rpb24oaW1wb3J0c0tleXMsICdyZXR1cm4gJyArIHNvdXJjZSArIHNvdXJjZVVSTCkuYXBwbHkodW5kZWZpbmVkLCBpbXBvcnRzVmFsdWVzKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBlLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQoZGF0YSk7XG4gICAgICB9XG4gICAgICAvLyBwcm92aWRlIHRoZSBjb21waWxlZCBmdW5jdGlvbidzIHNvdXJjZSBieSBpdHMgYHRvU3RyaW5nYCBtZXRob2QsIGluXG4gICAgICAvLyBzdXBwb3J0ZWQgZW52aXJvbm1lbnRzLCBvciB0aGUgYHNvdXJjZWAgcHJvcGVydHkgYXMgYSBjb252ZW5pZW5jZSBmb3JcbiAgICAgIC8vIGlubGluaW5nIGNvbXBpbGVkIHRlbXBsYXRlcyBkdXJpbmcgdGhlIGJ1aWxkIHByb2Nlc3NcbiAgICAgIHJlc3VsdC5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVzIHRoZSBjYWxsYmFjayBgbmAgdGltZXMsIHJldHVybmluZyBhbiBhcnJheSBvZiB0aGUgcmVzdWx0c1xuICAgICAqIG9mIGVhY2ggY2FsbGJhY2sgZXhlY3V0aW9uLiBUaGUgY2FsbGJhY2sgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkXG4gICAgICogd2l0aCBvbmUgYXJndW1lbnQ7IChpbmRleCkuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgVXRpbGl0aWVzXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG4gVGhlIG51bWJlciBvZiB0aW1lcyB0byBleGVjdXRlIHRoZSBjYWxsYmFjay5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gICAgICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGFuIGFycmF5IG9mIHRoZSByZXN1bHRzIG9mIGVhY2ggYGNhbGxiYWNrYCBleGVjdXRpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIHZhciBkaWNlUm9sbHMgPSBfLnRpbWVzKDMsIF8ucGFydGlhbChfLnJhbmRvbSwgMSwgNikpO1xuICAgICAqIC8vID0+IFszLCA2LCA0XVxuICAgICAqXG4gICAgICogXy50aW1lcygzLCBmdW5jdGlvbihuKSB7IG1hZ2UuY2FzdFNwZWxsKG4pOyB9KTtcbiAgICAgKiAvLyA9PiBjYWxscyBgbWFnZS5jYXN0U3BlbGwobilgIHRocmVlIHRpbWVzLCBwYXNzaW5nIGBuYCBvZiBgMGAsIGAxYCwgYW5kIGAyYCByZXNwZWN0aXZlbHlcbiAgICAgKlxuICAgICAqIF8udGltZXMoMywgZnVuY3Rpb24obikgeyB0aGlzLmNhc3Qobik7IH0sIG1hZ2UpO1xuICAgICAqIC8vID0+IGFsc28gY2FsbHMgYG1hZ2UuY2FzdFNwZWxsKG4pYCB0aHJlZSB0aW1lc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRpbWVzKG4sIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICBuID0gKG4gPSArbikgPiAtMSA/IG4gOiAwO1xuICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgcmVzdWx0ID0gQXJyYXkobik7XG5cbiAgICAgIGNhbGxiYWNrID0gYmFzZUNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAxKTtcbiAgICAgIHdoaWxlICgrK2luZGV4IDwgbikge1xuICAgICAgICByZXN1bHRbaW5kZXhdID0gY2FsbGJhY2soaW5kZXgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgaW52ZXJzZSBvZiBgXy5lc2NhcGVgIHRoaXMgbWV0aG9kIGNvbnZlcnRzIHRoZSBIVE1MIGVudGl0aWVzXG4gICAgICogYCZhbXA7YCwgYCZsdDtgLCBgJmd0O2AsIGAmcXVvdDtgLCBhbmQgYCYjMzk7YCBpbiBgc3RyaW5nYCB0byB0aGVpclxuICAgICAqIGNvcnJlc3BvbmRpbmcgY2hhcmFjdGVycy5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBVdGlsaXRpZXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRoZSBzdHJpbmcgdG8gdW5lc2NhcGUuXG4gICAgICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgdW5lc2NhcGVkIHN0cmluZy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy51bmVzY2FwZSgnRnJlZCwgQmFybmV5ICZhbXA7IFBlYmJsZXMnKTtcbiAgICAgKiAvLyA9PiAnRnJlZCwgQmFybmV5ICYgUGViYmxlcydcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB1bmVzY2FwZShzdHJpbmcpIHtcbiAgICAgIHJldHVybiBzdHJpbmcgPT0gbnVsbCA/ICcnIDogU3RyaW5nKHN0cmluZykucmVwbGFjZShyZUVzY2FwZWRIdG1sLCB1bmVzY2FwZUh0bWxDaGFyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSB1bmlxdWUgSUQuIElmIGBwcmVmaXhgIGlzIHByb3ZpZGVkIHRoZSBJRCB3aWxsIGJlIGFwcGVuZGVkIHRvIGl0LlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IFV0aWxpdGllc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbcHJlZml4XSBUaGUgdmFsdWUgdG8gcHJlZml4IHRoZSBJRCB3aXRoLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHVuaXF1ZSBJRC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogXy51bmlxdWVJZCgnY29udGFjdF8nKTtcbiAgICAgKiAvLyA9PiAnY29udGFjdF8xMDQnXG4gICAgICpcbiAgICAgKiBfLnVuaXF1ZUlkKCk7XG4gICAgICogLy8gPT4gJzEwNSdcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB1bmlxdWVJZChwcmVmaXgpIHtcbiAgICAgIHZhciBpZCA9ICsraWRDb3VudGVyO1xuICAgICAgcmV0dXJuIFN0cmluZyhwcmVmaXggPT0gbnVsbCA/ICcnIDogcHJlZml4KSArIGlkO1xuICAgIH1cblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGBsb2Rhc2hgIG9iamVjdCB0aGF0IHdyYXBzIHRoZSBnaXZlbiB2YWx1ZSB3aXRoIGV4cGxpY2l0XG4gICAgICogbWV0aG9kIGNoYWluaW5nIGVuYWJsZWQuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQ2hhaW5pbmdcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byB3cmFwLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIHdyYXBwZXIgb2JqZWN0LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgICdhZ2UnOiAzNiB9LFxuICAgICAqICAgeyAnbmFtZSc6ICdmcmVkJywgICAgJ2FnZSc6IDQwIH0sXG4gICAgICogICB7ICduYW1lJzogJ3BlYmJsZXMnLCAnYWdlJzogMSB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIHZhciB5b3VuZ2VzdCA9IF8uY2hhaW4oY2hhcmFjdGVycylcbiAgICAgKiAgICAgLnNvcnRCeSgnYWdlJylcbiAgICAgKiAgICAgLm1hcChmdW5jdGlvbihjaHIpIHsgcmV0dXJuIGNoci5uYW1lICsgJyBpcyAnICsgY2hyLmFnZTsgfSlcbiAgICAgKiAgICAgLmZpcnN0KClcbiAgICAgKiAgICAgLnZhbHVlKCk7XG4gICAgICogLy8gPT4gJ3BlYmJsZXMgaXMgMSdcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjaGFpbih2YWx1ZSkge1xuICAgICAgdmFsdWUgPSBuZXcgbG9kYXNoV3JhcHBlcih2YWx1ZSk7XG4gICAgICB2YWx1ZS5fX2NoYWluX18gPSB0cnVlO1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludm9rZXMgYGludGVyY2VwdG9yYCB3aXRoIHRoZSBgdmFsdWVgIGFzIHRoZSBmaXJzdCBhcmd1bWVudCBhbmQgdGhlblxuICAgICAqIHJldHVybnMgYHZhbHVlYC4gVGhlIHB1cnBvc2Ugb2YgdGhpcyBtZXRob2QgaXMgdG8gXCJ0YXAgaW50b1wiIGEgbWV0aG9kXG4gICAgICogY2hhaW4gaW4gb3JkZXIgdG8gcGVyZm9ybSBvcGVyYXRpb25zIG9uIGludGVybWVkaWF0ZSByZXN1bHRzIHdpdGhpblxuICAgICAqIHRoZSBjaGFpbi5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBjYXRlZ29yeSBDaGFpbmluZ1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHByb3ZpZGUgdG8gYGludGVyY2VwdG9yYC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbnRlcmNlcHRvciBUaGUgZnVuY3Rpb24gdG8gaW52b2tlLlxuICAgICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIGB2YWx1ZWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqIF8oWzEsIDIsIDMsIDRdKVxuICAgICAqICAudGFwKGZ1bmN0aW9uKGFycmF5KSB7IGFycmF5LnBvcCgpOyB9KVxuICAgICAqICAucmV2ZXJzZSgpXG4gICAgICogIC52YWx1ZSgpO1xuICAgICAqIC8vID0+IFszLCAyLCAxXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRhcCh2YWx1ZSwgaW50ZXJjZXB0b3IpIHtcbiAgICAgIGludGVyY2VwdG9yKHZhbHVlKTtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbmFibGVzIGV4cGxpY2l0IG1ldGhvZCBjaGFpbmluZyBvbiB0aGUgd3JhcHBlciBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAbmFtZSBjaGFpblxuICAgICAqIEBtZW1iZXJPZiBfXG4gICAgICogQGNhdGVnb3J5IENoYWluaW5nXG4gICAgICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIHdyYXBwZXIgb2JqZWN0LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgKiAgIHsgJ25hbWUnOiAnYmFybmV5JywgJ2FnZSc6IDM2IH0sXG4gICAgICogICB7ICduYW1lJzogJ2ZyZWQnLCAgICdhZ2UnOiA0MCB9XG4gICAgICogXTtcbiAgICAgKlxuICAgICAqIC8vIHdpdGhvdXQgZXhwbGljaXQgY2hhaW5pbmdcbiAgICAgKiBfKGNoYXJhY3RlcnMpLmZpcnN0KCk7XG4gICAgICogLy8gPT4geyAnbmFtZSc6ICdiYXJuZXknLCAnYWdlJzogMzYgfVxuICAgICAqXG4gICAgICogLy8gd2l0aCBleHBsaWNpdCBjaGFpbmluZ1xuICAgICAqIF8oY2hhcmFjdGVycykuY2hhaW4oKVxuICAgICAqICAgLmZpcnN0KClcbiAgICAgKiAgIC5waWNrKCdhZ2UnKVxuICAgICAqICAgLnZhbHVlKCk7XG4gICAgICogLy8gPT4geyAnYWdlJzogMzYgfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHdyYXBwZXJDaGFpbigpIHtcbiAgICAgIHRoaXMuX19jaGFpbl9fID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFByb2R1Y2VzIHRoZSBgdG9TdHJpbmdgIHJlc3VsdCBvZiB0aGUgd3JhcHBlZCB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEBuYW1lIHRvU3RyaW5nXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAY2F0ZWdvcnkgQ2hhaW5pbmdcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBzdHJpbmcgcmVzdWx0LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfKFsxLCAyLCAzXSkudG9TdHJpbmcoKTtcbiAgICAgKiAvLyA9PiAnMSwyLDMnXG4gICAgICovXG4gICAgZnVuY3Rpb24gd3JhcHBlclRvU3RyaW5nKCkge1xuICAgICAgcmV0dXJuIFN0cmluZyh0aGlzLl9fd3JhcHBlZF9fKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeHRyYWN0cyB0aGUgd3JhcHBlZCB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEBuYW1lIHZhbHVlT2ZcbiAgICAgKiBAbWVtYmVyT2YgX1xuICAgICAqIEBhbGlhcyB2YWx1ZVxuICAgICAqIEBjYXRlZ29yeSBDaGFpbmluZ1xuICAgICAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSB3cmFwcGVkIHZhbHVlLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiBfKFsxLCAyLCAzXSkudmFsdWVPZigpO1xuICAgICAqIC8vID0+IFsxLCAyLCAzXVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHdyYXBwZXJWYWx1ZU9mKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX193cmFwcGVkX187XG4gICAgfVxuXG4gICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICAvLyBhZGQgZnVuY3Rpb25zIHRoYXQgcmV0dXJuIHdyYXBwZWQgdmFsdWVzIHdoZW4gY2hhaW5pbmdcbiAgICBsb2Rhc2guYWZ0ZXIgPSBhZnRlcjtcbiAgICBsb2Rhc2guYXNzaWduID0gYXNzaWduO1xuICAgIGxvZGFzaC5hdCA9IGF0O1xuICAgIGxvZGFzaC5iaW5kID0gYmluZDtcbiAgICBsb2Rhc2guYmluZEFsbCA9IGJpbmRBbGw7XG4gICAgbG9kYXNoLmJpbmRLZXkgPSBiaW5kS2V5O1xuICAgIGxvZGFzaC5jaGFpbiA9IGNoYWluO1xuICAgIGxvZGFzaC5jb21wYWN0ID0gY29tcGFjdDtcbiAgICBsb2Rhc2guY29tcG9zZSA9IGNvbXBvc2U7XG4gICAgbG9kYXNoLmNvbnN0YW50ID0gY29uc3RhbnQ7XG4gICAgbG9kYXNoLmNvdW50QnkgPSBjb3VudEJ5O1xuICAgIGxvZGFzaC5jcmVhdGUgPSBjcmVhdGU7XG4gICAgbG9kYXNoLmNyZWF0ZUNhbGxiYWNrID0gY3JlYXRlQ2FsbGJhY2s7XG4gICAgbG9kYXNoLmN1cnJ5ID0gY3Vycnk7XG4gICAgbG9kYXNoLmRlYm91bmNlID0gZGVib3VuY2U7XG4gICAgbG9kYXNoLmRlZmF1bHRzID0gZGVmYXVsdHM7XG4gICAgbG9kYXNoLmRlZmVyID0gZGVmZXI7XG4gICAgbG9kYXNoLmRlbGF5ID0gZGVsYXk7XG4gICAgbG9kYXNoLmRpZmZlcmVuY2UgPSBkaWZmZXJlbmNlO1xuICAgIGxvZGFzaC5maWx0ZXIgPSBmaWx0ZXI7XG4gICAgbG9kYXNoLmZsYXR0ZW4gPSBmbGF0dGVuO1xuICAgIGxvZGFzaC5mb3JFYWNoID0gZm9yRWFjaDtcbiAgICBsb2Rhc2guZm9yRWFjaFJpZ2h0ID0gZm9yRWFjaFJpZ2h0O1xuICAgIGxvZGFzaC5mb3JJbiA9IGZvckluO1xuICAgIGxvZGFzaC5mb3JJblJpZ2h0ID0gZm9ySW5SaWdodDtcbiAgICBsb2Rhc2guZm9yT3duID0gZm9yT3duO1xuICAgIGxvZGFzaC5mb3JPd25SaWdodCA9IGZvck93blJpZ2h0O1xuICAgIGxvZGFzaC5mdW5jdGlvbnMgPSBmdW5jdGlvbnM7XG4gICAgbG9kYXNoLmdyb3VwQnkgPSBncm91cEJ5O1xuICAgIGxvZGFzaC5pbmRleEJ5ID0gaW5kZXhCeTtcbiAgICBsb2Rhc2guaW5pdGlhbCA9IGluaXRpYWw7XG4gICAgbG9kYXNoLmludGVyc2VjdGlvbiA9IGludGVyc2VjdGlvbjtcbiAgICBsb2Rhc2guaW52ZXJ0ID0gaW52ZXJ0O1xuICAgIGxvZGFzaC5pbnZva2UgPSBpbnZva2U7XG4gICAgbG9kYXNoLmtleXMgPSBrZXlzO1xuICAgIGxvZGFzaC5tYXAgPSBtYXA7XG4gICAgbG9kYXNoLm1hcFZhbHVlcyA9IG1hcFZhbHVlcztcbiAgICBsb2Rhc2gubWF4ID0gbWF4O1xuICAgIGxvZGFzaC5tZW1vaXplID0gbWVtb2l6ZTtcbiAgICBsb2Rhc2gubWVyZ2UgPSBtZXJnZTtcbiAgICBsb2Rhc2gubWluID0gbWluO1xuICAgIGxvZGFzaC5vbWl0ID0gb21pdDtcbiAgICBsb2Rhc2gub25jZSA9IG9uY2U7XG4gICAgbG9kYXNoLnBhaXJzID0gcGFpcnM7XG4gICAgbG9kYXNoLnBhcnRpYWwgPSBwYXJ0aWFsO1xuICAgIGxvZGFzaC5wYXJ0aWFsUmlnaHQgPSBwYXJ0aWFsUmlnaHQ7XG4gICAgbG9kYXNoLnBpY2sgPSBwaWNrO1xuICAgIGxvZGFzaC5wbHVjayA9IHBsdWNrO1xuICAgIGxvZGFzaC5wcm9wZXJ0eSA9IHByb3BlcnR5O1xuICAgIGxvZGFzaC5wdWxsID0gcHVsbDtcbiAgICBsb2Rhc2gucmFuZ2UgPSByYW5nZTtcbiAgICBsb2Rhc2gucmVqZWN0ID0gcmVqZWN0O1xuICAgIGxvZGFzaC5yZW1vdmUgPSByZW1vdmU7XG4gICAgbG9kYXNoLnJlc3QgPSByZXN0O1xuICAgIGxvZGFzaC5zaHVmZmxlID0gc2h1ZmZsZTtcbiAgICBsb2Rhc2guc29ydEJ5ID0gc29ydEJ5O1xuICAgIGxvZGFzaC50YXAgPSB0YXA7XG4gICAgbG9kYXNoLnRocm90dGxlID0gdGhyb3R0bGU7XG4gICAgbG9kYXNoLnRpbWVzID0gdGltZXM7XG4gICAgbG9kYXNoLnRvQXJyYXkgPSB0b0FycmF5O1xuICAgIGxvZGFzaC50cmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG4gICAgbG9kYXNoLnVuaW9uID0gdW5pb247XG4gICAgbG9kYXNoLnVuaXEgPSB1bmlxO1xuICAgIGxvZGFzaC52YWx1ZXMgPSB2YWx1ZXM7XG4gICAgbG9kYXNoLndoZXJlID0gd2hlcmU7XG4gICAgbG9kYXNoLndpdGhvdXQgPSB3aXRob3V0O1xuICAgIGxvZGFzaC53cmFwID0gd3JhcDtcbiAgICBsb2Rhc2gueG9yID0geG9yO1xuICAgIGxvZGFzaC56aXAgPSB6aXA7XG4gICAgbG9kYXNoLnppcE9iamVjdCA9IHppcE9iamVjdDtcblxuICAgIC8vIGFkZCBhbGlhc2VzXG4gICAgbG9kYXNoLmNvbGxlY3QgPSBtYXA7XG4gICAgbG9kYXNoLmRyb3AgPSByZXN0O1xuICAgIGxvZGFzaC5lYWNoID0gZm9yRWFjaDtcbiAgICBsb2Rhc2guZWFjaFJpZ2h0ID0gZm9yRWFjaFJpZ2h0O1xuICAgIGxvZGFzaC5leHRlbmQgPSBhc3NpZ247XG4gICAgbG9kYXNoLm1ldGhvZHMgPSBmdW5jdGlvbnM7XG4gICAgbG9kYXNoLm9iamVjdCA9IHppcE9iamVjdDtcbiAgICBsb2Rhc2guc2VsZWN0ID0gZmlsdGVyO1xuICAgIGxvZGFzaC50YWlsID0gcmVzdDtcbiAgICBsb2Rhc2gudW5pcXVlID0gdW5pcTtcbiAgICBsb2Rhc2gudW56aXAgPSB6aXA7XG5cbiAgICAvLyBhZGQgZnVuY3Rpb25zIHRvIGBsb2Rhc2gucHJvdG90eXBlYFxuICAgIG1peGluKGxvZGFzaCk7XG5cbiAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgIC8vIGFkZCBmdW5jdGlvbnMgdGhhdCByZXR1cm4gdW53cmFwcGVkIHZhbHVlcyB3aGVuIGNoYWluaW5nXG4gICAgbG9kYXNoLmNsb25lID0gY2xvbmU7XG4gICAgbG9kYXNoLmNsb25lRGVlcCA9IGNsb25lRGVlcDtcbiAgICBsb2Rhc2guY29udGFpbnMgPSBjb250YWlucztcbiAgICBsb2Rhc2guZXNjYXBlID0gZXNjYXBlO1xuICAgIGxvZGFzaC5ldmVyeSA9IGV2ZXJ5O1xuICAgIGxvZGFzaC5maW5kID0gZmluZDtcbiAgICBsb2Rhc2guZmluZEluZGV4ID0gZmluZEluZGV4O1xuICAgIGxvZGFzaC5maW5kS2V5ID0gZmluZEtleTtcbiAgICBsb2Rhc2guZmluZExhc3QgPSBmaW5kTGFzdDtcbiAgICBsb2Rhc2guZmluZExhc3RJbmRleCA9IGZpbmRMYXN0SW5kZXg7XG4gICAgbG9kYXNoLmZpbmRMYXN0S2V5ID0gZmluZExhc3RLZXk7XG4gICAgbG9kYXNoLmhhcyA9IGhhcztcbiAgICBsb2Rhc2guaWRlbnRpdHkgPSBpZGVudGl0eTtcbiAgICBsb2Rhc2guaW5kZXhPZiA9IGluZGV4T2Y7XG4gICAgbG9kYXNoLmlzQXJndW1lbnRzID0gaXNBcmd1bWVudHM7XG4gICAgbG9kYXNoLmlzQXJyYXkgPSBpc0FycmF5O1xuICAgIGxvZGFzaC5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG4gICAgbG9kYXNoLmlzRGF0ZSA9IGlzRGF0ZTtcbiAgICBsb2Rhc2guaXNFbGVtZW50ID0gaXNFbGVtZW50O1xuICAgIGxvZGFzaC5pc0VtcHR5ID0gaXNFbXB0eTtcbiAgICBsb2Rhc2guaXNFcXVhbCA9IGlzRXF1YWw7XG4gICAgbG9kYXNoLmlzRmluaXRlID0gaXNGaW5pdGU7XG4gICAgbG9kYXNoLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuICAgIGxvZGFzaC5pc05hTiA9IGlzTmFOO1xuICAgIGxvZGFzaC5pc051bGwgPSBpc051bGw7XG4gICAgbG9kYXNoLmlzTnVtYmVyID0gaXNOdW1iZXI7XG4gICAgbG9kYXNoLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG4gICAgbG9kYXNoLmlzUGxhaW5PYmplY3QgPSBpc1BsYWluT2JqZWN0O1xuICAgIGxvZGFzaC5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuICAgIGxvZGFzaC5pc1N0cmluZyA9IGlzU3RyaW5nO1xuICAgIGxvZGFzaC5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuICAgIGxvZGFzaC5sYXN0SW5kZXhPZiA9IGxhc3RJbmRleE9mO1xuICAgIGxvZGFzaC5taXhpbiA9IG1peGluO1xuICAgIGxvZGFzaC5ub0NvbmZsaWN0ID0gbm9Db25mbGljdDtcbiAgICBsb2Rhc2gubm9vcCA9IG5vb3A7XG4gICAgbG9kYXNoLm5vdyA9IG5vdztcbiAgICBsb2Rhc2gucGFyc2VJbnQgPSBwYXJzZUludDtcbiAgICBsb2Rhc2gucmFuZG9tID0gcmFuZG9tO1xuICAgIGxvZGFzaC5yZWR1Y2UgPSByZWR1Y2U7XG4gICAgbG9kYXNoLnJlZHVjZVJpZ2h0ID0gcmVkdWNlUmlnaHQ7XG4gICAgbG9kYXNoLnJlc3VsdCA9IHJlc3VsdDtcbiAgICBsb2Rhc2gucnVuSW5Db250ZXh0ID0gcnVuSW5Db250ZXh0O1xuICAgIGxvZGFzaC5zaXplID0gc2l6ZTtcbiAgICBsb2Rhc2guc29tZSA9IHNvbWU7XG4gICAgbG9kYXNoLnNvcnRlZEluZGV4ID0gc29ydGVkSW5kZXg7XG4gICAgbG9kYXNoLnRlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgbG9kYXNoLnVuZXNjYXBlID0gdW5lc2NhcGU7XG4gICAgbG9kYXNoLnVuaXF1ZUlkID0gdW5pcXVlSWQ7XG5cbiAgICAvLyBhZGQgYWxpYXNlc1xuICAgIGxvZGFzaC5hbGwgPSBldmVyeTtcbiAgICBsb2Rhc2guYW55ID0gc29tZTtcbiAgICBsb2Rhc2guZGV0ZWN0ID0gZmluZDtcbiAgICBsb2Rhc2guZmluZFdoZXJlID0gZmluZDtcbiAgICBsb2Rhc2guZm9sZGwgPSByZWR1Y2U7XG4gICAgbG9kYXNoLmZvbGRyID0gcmVkdWNlUmlnaHQ7XG4gICAgbG9kYXNoLmluY2x1ZGUgPSBjb250YWlucztcbiAgICBsb2Rhc2guaW5qZWN0ID0gcmVkdWNlO1xuXG4gICAgbWl4aW4oZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc291cmNlID0ge31cbiAgICAgIGZvck93bihsb2Rhc2gsIGZ1bmN0aW9uKGZ1bmMsIG1ldGhvZE5hbWUpIHtcbiAgICAgICAgaWYgKCFsb2Rhc2gucHJvdG90eXBlW21ldGhvZE5hbWVdKSB7XG4gICAgICAgICAgc291cmNlW21ldGhvZE5hbWVdID0gZnVuYztcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gc291cmNlO1xuICAgIH0oKSwgZmFsc2UpO1xuXG4gICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICAvLyBhZGQgZnVuY3Rpb25zIGNhcGFibGUgb2YgcmV0dXJuaW5nIHdyYXBwZWQgYW5kIHVud3JhcHBlZCB2YWx1ZXMgd2hlbiBjaGFpbmluZ1xuICAgIGxvZGFzaC5maXJzdCA9IGZpcnN0O1xuICAgIGxvZGFzaC5sYXN0ID0gbGFzdDtcbiAgICBsb2Rhc2guc2FtcGxlID0gc2FtcGxlO1xuXG4gICAgLy8gYWRkIGFsaWFzZXNcbiAgICBsb2Rhc2gudGFrZSA9IGZpcnN0O1xuICAgIGxvZGFzaC5oZWFkID0gZmlyc3Q7XG5cbiAgICBmb3JPd24obG9kYXNoLCBmdW5jdGlvbihmdW5jLCBtZXRob2ROYW1lKSB7XG4gICAgICB2YXIgY2FsbGJhY2thYmxlID0gbWV0aG9kTmFtZSAhPT0gJ3NhbXBsZSc7XG4gICAgICBpZiAoIWxvZGFzaC5wcm90b3R5cGVbbWV0aG9kTmFtZV0pIHtcbiAgICAgICAgbG9kYXNoLnByb3RvdHlwZVttZXRob2ROYW1lXT0gZnVuY3Rpb24obiwgZ3VhcmQpIHtcbiAgICAgICAgICB2YXIgY2hhaW5BbGwgPSB0aGlzLl9fY2hhaW5fXyxcbiAgICAgICAgICAgICAgcmVzdWx0ID0gZnVuYyh0aGlzLl9fd3JhcHBlZF9fLCBuLCBndWFyZCk7XG5cbiAgICAgICAgICByZXR1cm4gIWNoYWluQWxsICYmIChuID09IG51bGwgfHwgKGd1YXJkICYmICEoY2FsbGJhY2thYmxlICYmIHR5cGVvZiBuID09ICdmdW5jdGlvbicpKSlcbiAgICAgICAgICAgID8gcmVzdWx0XG4gICAgICAgICAgICA6IG5ldyBsb2Rhc2hXcmFwcGVyKHJlc3VsdCwgY2hhaW5BbGwpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICAvKipcbiAgICAgKiBUaGUgc2VtYW50aWMgdmVyc2lvbiBudW1iZXIuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIF9cbiAgICAgKiBAdHlwZSBzdHJpbmdcbiAgICAgKi9cbiAgICBsb2Rhc2guVkVSU0lPTiA9ICcyLjQuMSc7XG5cbiAgICAvLyBhZGQgXCJDaGFpbmluZ1wiIGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlclxuICAgIGxvZGFzaC5wcm90b3R5cGUuY2hhaW4gPSB3cmFwcGVyQ2hhaW47XG4gICAgbG9kYXNoLnByb3RvdHlwZS50b1N0cmluZyA9IHdyYXBwZXJUb1N0cmluZztcbiAgICBsb2Rhc2gucHJvdG90eXBlLnZhbHVlID0gd3JhcHBlclZhbHVlT2Y7XG4gICAgbG9kYXNoLnByb3RvdHlwZS52YWx1ZU9mID0gd3JhcHBlclZhbHVlT2Y7XG5cbiAgICAvLyBhZGQgYEFycmF5YCBmdW5jdGlvbnMgdGhhdCByZXR1cm4gdW53cmFwcGVkIHZhbHVlc1xuICAgIGZvckVhY2goWydqb2luJywgJ3BvcCcsICdzaGlmdCddLCBmdW5jdGlvbihtZXRob2ROYW1lKSB7XG4gICAgICB2YXIgZnVuYyA9IGFycmF5UmVmW21ldGhvZE5hbWVdO1xuICAgICAgbG9kYXNoLnByb3RvdHlwZVttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY2hhaW5BbGwgPSB0aGlzLl9fY2hhaW5fXyxcbiAgICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpcy5fX3dyYXBwZWRfXywgYXJndW1lbnRzKTtcblxuICAgICAgICByZXR1cm4gY2hhaW5BbGxcbiAgICAgICAgICA/IG5ldyBsb2Rhc2hXcmFwcGVyKHJlc3VsdCwgY2hhaW5BbGwpXG4gICAgICAgICAgOiByZXN1bHQ7XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgLy8gYWRkIGBBcnJheWAgZnVuY3Rpb25zIHRoYXQgcmV0dXJuIHRoZSBleGlzdGluZyB3cmFwcGVkIHZhbHVlXG4gICAgZm9yRWFjaChbJ3B1c2gnLCAncmV2ZXJzZScsICdzb3J0JywgJ3Vuc2hpZnQnXSwgZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuICAgICAgdmFyIGZ1bmMgPSBhcnJheVJlZlttZXRob2ROYW1lXTtcbiAgICAgIGxvZGFzaC5wcm90b3R5cGVbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZnVuYy5hcHBseSh0aGlzLl9fd3JhcHBlZF9fLCBhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICAvLyBhZGQgYEFycmF5YCBmdW5jdGlvbnMgdGhhdCByZXR1cm4gbmV3IHdyYXBwZWQgdmFsdWVzXG4gICAgZm9yRWFjaChbJ2NvbmNhdCcsICdzbGljZScsICdzcGxpY2UnXSwgZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuICAgICAgdmFyIGZ1bmMgPSBhcnJheVJlZlttZXRob2ROYW1lXTtcbiAgICAgIGxvZGFzaC5wcm90b3R5cGVbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBsb2Rhc2hXcmFwcGVyKGZ1bmMuYXBwbHkodGhpcy5fX3dyYXBwZWRfXywgYXJndW1lbnRzKSwgdGhpcy5fX2NoYWluX18pO1xuICAgICAgfTtcbiAgICB9KTtcblxuICAgIHJldHVybiBsb2Rhc2g7XG4gIH1cblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvLyBleHBvc2UgTG8tRGFzaFxuICB2YXIgXyA9IHJ1bkluQ29udGV4dCgpO1xuXG4gIC8vIHNvbWUgQU1EIGJ1aWxkIG9wdGltaXplcnMgbGlrZSByLmpzIGNoZWNrIGZvciBjb25kaXRpb24gcGF0dGVybnMgbGlrZSB0aGUgZm9sbG93aW5nOlxuICBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkZWZpbmUuYW1kID09ICdvYmplY3QnICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBFeHBvc2UgTG8tRGFzaCB0byB0aGUgZ2xvYmFsIG9iamVjdCBldmVuIHdoZW4gYW4gQU1EIGxvYWRlciBpcyBwcmVzZW50IGluXG4gICAgLy8gY2FzZSBMby1EYXNoIGlzIGxvYWRlZCB3aXRoIGEgUmVxdWlyZUpTIHNoaW0gY29uZmlnLlxuICAgIC8vIFNlZSBodHRwOi8vcmVxdWlyZWpzLm9yZy9kb2NzL2FwaS5odG1sI2NvbmZpZy1zaGltXG4gICAgcm9vdC5fID0gXztcblxuICAgIC8vIGRlZmluZSBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlIHNvLCB0aHJvdWdoIHBhdGggbWFwcGluZywgaXQgY2FuIGJlXG4gICAgLy8gcmVmZXJlbmNlZCBhcyB0aGUgXCJ1bmRlcnNjb3JlXCIgbW9kdWxlXG4gICAgZGVmaW5lKGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIF87XG4gICAgfSk7XG4gIH1cbiAgLy8gY2hlY2sgZm9yIGBleHBvcnRzYCBhZnRlciBgZGVmaW5lYCBpbiBjYXNlIGEgYnVpbGQgb3B0aW1pemVyIGFkZHMgYW4gYGV4cG9ydHNgIG9iamVjdFxuICBlbHNlIGlmIChmcmVlRXhwb3J0cyAmJiBmcmVlTW9kdWxlKSB7XG4gICAgLy8gaW4gTm9kZS5qcyBvciBSaW5nb0pTXG4gICAgaWYgKG1vZHVsZUV4cG9ydHMpIHtcbiAgICAgIChmcmVlTW9kdWxlLmV4cG9ydHMgPSBfKS5fID0gXztcbiAgICB9XG4gICAgLy8gaW4gTmFyd2hhbCBvciBSaGlubyAtcmVxdWlyZVxuICAgIGVsc2Uge1xuICAgICAgZnJlZUV4cG9ydHMuXyA9IF87XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIC8vIGluIGEgYnJvd3NlciBvciBSaGlub1xuICAgIHJvb3QuXyA9IF87XG4gIH1cbn0uY2FsbCh0aGlzKSk7XG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIi8qZ2xvYmFsIGRlc2NyaWJlOiBmYWxzZSwgaXQ6IGZhbHNlLCBleHBlY3Q6IGZhbHNlLCByZXF1aXJlOiBmYWxzZSAqL1xuXG52YXIgbGFiZWxDb252ZXJ0ID0gcmVxdWlyZShcIi4uLy4uL3dlYmFwcC9qcy90cmVlZHJhd2luZy9sYWJlbC1jb252ZXJ0LnRzXCIpO1xudmFyICQgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xuXG5kZXNjcmliZShcIlRoZSBsYWJlbCBjb252ZXJ0ZXJcIiwgZnVuY3Rpb24gKCkge1xuICAgIHZhciBNID0gbGFiZWxDb252ZXJ0Lm1hdGNoTWV0YWRhdGFBZ2FpbnN0T2JqZWN0O1xuICAgIHZhciBOID0gbGFiZWxDb252ZXJ0Lm5vZGVNYXRjaGVzU3BlYztcbiAgICB2YXIgbWFwcGluZyA9IHtcbiAgICAgICAgZGVmYXVsdHM6IHsgUFJOOiB7IHBhcmVudGhldGljYWw6IFwieWVzXCIgfX0sXG4gICAgICAgIGRlZmF1bHRTdWJjYXRlZ29yaWVzOiBbXSxcbiAgICAgICAgYnlMYWJlbCA6IHtcbiAgICAgICAgICAgIE5QOiB7XG4gICAgICAgICAgICAgICAgc3ViY2F0ZWdvcmllczogW1wiU0JKXCIsXCJPQjFcIl0sXG4gICAgICAgICAgICAgICAgbWV0YWRhdGFLZXlzOiB7XG4gICAgICAgICAgICAgICAgICAgIExGRDogeyBrZXk6IFwibGVmdC1kaXNsb2NcIiwgdmFsdWU6IFwieWVzXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgVE1QOiB7IGtleTogXCJzZW1hbnRpY1wiLCB2YWx1ZTogeyBmbjogXCJ0ZW1wb3JhbFwiIH19XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIElQOiB7XG4gICAgICAgICAgICAgICAgc3ViY2F0ZWdvcmllczogW1wiTUFUXCIsXCJTVUJcIl0sXG4gICAgICAgICAgICAgICAgbWV0YWRhdGFLZXlzOiB7XG4gICAgICAgICAgICAgICAgICAgIFRNUDogeyBrZXk6IFwiZm9vXCIsIHZhbHVlOiBcImJhclwifVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgaXQoXCJzaG91bGQgbWF0Y2ggc2ltcGxlIG9iamVjdHMgYWdhaW5zdCB0ZW1wbGF0ZXMgY29ycmVjdGx5XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZXhwZWN0KE0oXCJ4XCIsIFwieVwiLCB7IHg6IFwieVwiIH0pKTtcbiAgICAgICAgZXhwZWN0KCFNKFwieFwiLCBcInlcIiwgeyB4OiBcInpcIiB9KSk7XG4gICAgICAgIGV4cGVjdChNKFwieFwiLCBcInlcIiwgeyB4OiBcInlcIiwgYTogXCJiXCIgfSkpO1xuICAgICAgICBleHBlY3QoIU0oXCJ4XCIsIFwieVwiLCB7fSkpO1xuICAgICAgICBleHBlY3QoIU0oXCJ4XCIsIFwieVwiLCB7IGE6IFwiYlwiIH0pKTtcbiAgICB9KTtcbiAgICBpdChcInNob3VsZCBtYXRjaCBjb21wbGV4IG5vZGVzIGNvcnJlY3RseVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGV4cGVjdChNKFwieFwiLCB7IHkgOiBcInpcIiB9LCB7IHg6IHsgeTogXCJ6XCIgfX0pKTtcbiAgICAgICAgZXhwZWN0KCFNKFwieFwiLCB7IHkgOiBcInpcIiB9LCB7IHg6IHsgeTogXCJhXCIgfX0pKTtcbiAgICAgICAgZXhwZWN0KCFNKFwieFwiLCB7IHkgOiBcInpcIiB9LCB7IHg6IHsgYTogXCJ6XCIgfX0pKTtcbiAgICAgICAgZXhwZWN0KCFNKFwieFwiLCB7IHkgOiBcInpcIiB9LCB7IHg6IFwieVwiIH0pKTtcbiAgICB9KTtcbiAgICBpdChcInNob3VsZCBtYXRjaCBub2RlIGNhdGVnb3JpZXNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbm9kZSA9ICQoJzxkaXYgZGF0YS1jYXRlZ29yeT1cIlhcIj48L2Rpdj4nKS5nZXQoMCk7XG4gICAgICAgIGV4cGVjdChOKG5vZGUsIHsgY2F0ZWdvcnk6IFwiWFwiIH0pKTtcbiAgICAgICAgZXhwZWN0KCFOKG5vZGUsIHsgY2F0ZWdvcnk6IFwiWVwiIH0pKTtcbiAgICB9KTtcbiAgICBpdChcInNob3VsZCBtYXRjaCBub2RlIHN1YmNhdGVnb3JpZXNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbm9kZSA9ICQoJzxkaXYgZGF0YS1zdWJjYXRlZ29yeT1cIlhcIj48L2Rpdj4nKS5nZXQoMCk7XG4gICAgICAgIGV4cGVjdChOKG5vZGUsIHsgc3ViY2F0ZWdvcnk6IFwiWFwiIH0pKTtcbiAgICAgICAgZXhwZWN0KCFOKG5vZGUsIHsgc3ViY2F0ZWdvcnk6IFwiWVwiIH0pKTtcbiAgICB9KTtcbiAgICBpdChcInNob3VsZCBtYXRjaCBub2RlIGNhdGVnb3JpZXMgd2l0aCBzdWJjYXRlZ29yaWVzXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5vZGUgPSAkKCc8ZGl2IGRhdGEtY2F0ZWdvcnk9XCJYXCIgZGF0YS1zdWJjYXRlZ29yeT1cIllcIj48L2Rpdj4nKS5nZXQoMCk7XG4gICAgICAgIGV4cGVjdChOKG5vZGUsIHsgY2F0ZWdvcnk6IFwiWFwiLCBzdWJjYXRlZ29yeTogXCJZXCIgfSkpO1xuICAgICAgICBleHBlY3QoIU4obm9kZSwgeyBzdWJjYXRlZ29yeTogXCJZXCIgfSkpO1xuICAgICAgICBleHBlY3QoIU4obm9kZSwgeyBjYXRlZ29yeTogXCJYXCIgfSkpO1xuICAgICAgICBleHBlY3QoIU4obm9kZSwgeyBjYXRlZ29yeTogXCJYXCIsIHN1YmNhdGVnb3J5OiBcIlpcIiB9KSk7XG4gICAgICAgIGV4cGVjdCghTihub2RlLCB7IGNhdGVnb3J5OiBcIlpcIiwgc3ViY2F0ZWdvcnk6IFwiWVwiIH0pKTtcbiAgICB9KTtcbiAgICBpdChcInNob3VsZCBtYXRjaCBub2RlIG1ldGFkYXRhXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5vZGUgPSAkKCc8ZGl2IGRhdGEtY2F0ZWdvcnk9XCJYXCIgZGF0YS1zdWJjYXRlZ29yeT1cIllcIj48L2Rpdj4nKS5nZXQoMCk7XG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKFwiZGF0YS1tZXRhZGF0YVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7IGE6IFwiYlwiLCB4OiB7IHk6IFwielwiLCBxOiBcIndcIiB9fSkpO1xuICAgICAgICBleHBlY3QoTihub2RlLCB7IGNhdGVnb3J5OiBcIlhcIiB9KSk7XG4gICAgICAgIGV4cGVjdChOKG5vZGUsIHsgY2F0ZWdvcnk6IFwiWFwiLCBzdWJjYXRlZ29yeTogXCJZXCIgfSkpO1xuICAgICAgICBleHBlY3QoTihub2RlLCB7IGNhdGVnb3J5OiBcIlhcIiwgc3ViY2F0ZWdvcnk6IFwiWVwiLCBtZXRhZGF0YTogeyBhOiBcImJcIn19KSk7XG4gICAgICAgIGV4cGVjdChOKG5vZGUsIHsgY2F0ZWdvcnk6IFwiWFwiLCBzdWJjYXRlZ29yeTogXCJZXCIsIG1ldGFkYXRhOiB7IHg6IHsgeTogXCJ6XCIgfX19KSk7XG4gICAgICAgIGV4cGVjdChOKG5vZGUsIHsgbWV0YWRhdGE6IHsgYTogXCJiXCJ9fSkpO1xuICAgICAgICBleHBlY3QoTihub2RlLCB7IG1ldGFkYXRhOiB7IHg6IHsgeTogXCJ6XCIgfX19KSk7XG4gICAgICAgIGV4cGVjdChOKG5vZGUsIHsgbWV0YWRhdGE6IHsgYTogXCJiXCIsIHg6IHsgeTogXCJ6XCIgfX19KSk7XG5cbiAgICAgICAgZXhwZWN0KCFOKG5vZGUsIHsgbWV0YWRhdGE6IHsgYTogXCJjXCIgfX0pKTtcbiAgICAgICAgZXhwZWN0KCFOKG5vZGUsIHsgbWV0YWRhdGE6IHsgeDogeyB5OiBcIndcIiB9fX0pKTtcbiAgICAgICAgZXhwZWN0KCFOKG5vZGUsIHsgbWV0YWRhdGE6IHsgeDogXCJ5XCIgfX0pKTtcbiAgICAgICAgZXhwZWN0KCFOKG5vZGUsIHsgbWV0YWRhdGE6IHsgZTogXCJmXCIgfX0pKTtcbiAgICAgICAgZXhwZWN0KCFOKG5vZGUsIHsgbWV0YWRhdGE6IHsgYTogXCJiXCIsIHg6IHsgeTogXCJ6XCIgfSwgZTogXCJmXCIgfX0pKTtcbiAgICB9KTtcbiAgICBpdChcInNob3VsZCBwcm9wZXJseSBkaXNjZXJuIHZhbGlkIHN1YmNhdHNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBleHBlY3QoMSk7XG4gICAgICAgIC8vIFRPRE86IGhvdyB0byB0ZXN0IHByaXZhdGUgZnVuY3Rpb24/XG4gICAgfSk7XG4gICAgaXQoXCJzaG91bGQgY29udmVydCBsYWJlbHMgdG8gbWF0Y2ggc3BlY3MgcHJvcGVybHlcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgTE1TID0gbGFiZWxDb252ZXJ0LmxhYmVsVG9NYXRjaFNwZWM7XG4gICAgICAgIGV4cGVjdChMTVMoXCJOUFwiLCBtYXBwaW5nKSkudG9FcXVhbCh7IGNhdGVnb3J5OiBcIk5QXCIgfSk7XG4gICAgICAgIGV4cGVjdChMTVMoXCJOUC1TQkpcIiwgbWFwcGluZykpLnRvRXF1YWwoeyBjYXRlZ29yeTogXCJOUFwiLCBzdWJjYXRlZ29yeTogXCJTQkpcIiB9KTtcbiAgICAgICAgZXhwZWN0KExNUyhcIk5QLVNCSi1UTVBcIiwgbWFwcGluZykpLnRvRXF1YWwoeyBjYXRlZ29yeTogXCJOUFwiLCBzdWJjYXRlZ29yeTogXCJTQkpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGE6IHsgc2VtYW50aWM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuOiBcInRlbXBvcmFsXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX19KTtcbiAgICAgICAgZXhwZWN0KExNUyhcIk5QLVRNUFwiLCBtYXBwaW5nKSkudG9FcXVhbCh7IGNhdGVnb3J5OiBcIk5QXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGE6IHsgc2VtYW50aWM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm46IFwidGVtcG9yYWxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19fSk7XG4gICAgfSk7XG4gICAgaXQoXCJzaG91bGQgcHJvcGVybHkgc2V0IGxhYmVscyBvbiBub2Rlc1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlID0gJCgnPGRpdj48L2Rpdj4nKS5nZXQoMCk7XG4gICAgICAgIHZhciBTTCA9IGxhYmVsQ29udmVydC5zZXRMYWJlbEZvck5vZGU7XG4gICAgICAgIFNMKFwiTlAtU0JKXCIsIG5vZGUsIG1hcHBpbmcpO1xuICAgICAgICBleHBlY3Qobm9kZSkudG9IYXZlQXR0cmlidXRlKFwiZGF0YS1jYXRlZ29yeVwiLCBcIk5QXCIpO1xuICAgICAgICBleHBlY3Qobm9kZSkudG9IYXZlQXR0cmlidXRlKFwiZGF0YS1zdWJjYXRlZ29yeVwiLCBcIlNCSlwiKTtcblxuICAgICAgICBTTChcIk5QLVNCSlwiLCBub2RlLCBtYXBwaW5nLCB0cnVlKTtcbiAgICAgICAgLy8gQ2Fubm90IHJlbW92ZSB0aGUgY2F0ZWdvcnlcbiAgICAgICAgZXhwZWN0KG5vZGUpLnRvSGF2ZUF0dHJpYnV0ZShcImRhdGEtY2F0ZWdvcnlcIiwgXCJOUFwiKTtcbiAgICAgICAgZXhwZWN0KG5vZGUpLm5vdC50b0hhdmVBdHRyaWJ1dGUoXCJkYXRhLXN1YmNhdGVnb3J5XCIpO1xuXG4gICAgICAgIFNMKFwiTlAtVE1QXCIsIG5vZGUsIG1hcHBpbmcpO1xuICAgICAgICBleHBlY3Qobm9kZSkudG9IYXZlQXR0cmlidXRlKFwiZGF0YS1jYXRlZ29yeVwiLCBcIk5QXCIpO1xuICAgICAgICBleHBlY3Qobm9kZSkubm90LnRvSGF2ZUF0dHJpYnV0ZShcImRhdGEtc3ViY2F0ZWdvcnlcIik7XG4gICAgICAgIGV4cGVjdChub2RlKS50b0hhdmVBdHRyaWJ1dGUoXCJkYXRhLW1ldGFkYXRhXCIsIEpTT04uc3RyaW5naWZ5KFxuICAgICAgICAgICAgeyBzZW1hbnRpYzogeyBmbjogXCJ0ZW1wb3JhbFwiIH19XG4gICAgICAgICkpO1xuXG4gICAgICAgIFNMKFwiTlAtVE1QXCIsIG5vZGUsIG1hcHBpbmcsIHRydWUpO1xuXG4gICAgICAgIGV4cGVjdChub2RlKS50b0hhdmVBdHRyaWJ1dGUoXCJkYXRhLWNhdGVnb3J5XCIsIFwiTlBcIik7XG4gICAgICAgIGV4cGVjdChub2RlKS5ub3QudG9IYXZlQXR0cmlidXRlKFwiZGF0YS1zdWJjYXRlZ29yeVwiKTtcbiAgICAgICAgZXhwZWN0KG5vZGUpLm5vdC50b0hhdmVBdHRyaWJ1dGUoXCJkYXRhLW1ldGFkYXRhXCIpO1xuICAgIH0pO1xufSk7XG4iLCIvKmdsb2JhbCBkZXNjcmliZTogZmFsc2UsIGl0OiBmYWxzZSwgZXhwZWN0OiBmYWxzZSwgcmVxdWlyZTogZmFsc2UgKi9cblxudmFyIHBhcnNlID0gcmVxdWlyZSgnLi4vLi4vd2ViYXBwL2pzL3BhcnNlLmpzJyk7XG5cbnJlcXVpcmUoXCIuLi9zdHJpbmctbWF0Y2hlclwiKTtcblxuZGVzY3JpYmUoXCJUaGUgcGFyc2VyXCIsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgeG1sID0gJzxkb2M+PHNlbnRlbmNlIGNhdGVnb3J5PVwiSVBcIiBzdWJjYXRlZ29yeT1cIk1BVFwiPjxub2RlJyArXG4gICAgICAgICAgICAnIGNhdGVnb3J5PVwiTlBcIiBzdWJjYXRlZ29yeT1cIlNCSlwiPjxsZWFmJ1xuICAgICAgICAgICAgKyAnIGNhdGVnb3J5PVwiUFJPXCI+STwvbGVhZj48L25vZGU+PC9zZW50ZW5jZT48L2RvYz4nXG4gICAgICAsIGh0bWwgPSAnPGRpdiBjbGFzcz1cInNub2RlXCIgZGF0YS1jYXRlZ29yeT1cIklQXCIgZGF0YS1zdWJjYXRlZ29yeT1cIk1BVFwiPjxkaXYgY2xhc3M9XCJzbm9kZVwiJ1xuICAgICAgICAgICAgKyAnIGRhdGEtY2F0ZWdvcnk9XCJOUFwiIGRhdGEtc3ViY2F0ZWdvcnk9XCJTQkpcIj48ZGl2IGNsYXNzPVwic25vZGVcIidcbiAgICAgICAgICAgICsgJyBkYXRhLW5vZGV0eXBlPVwibGVhZlwiIGRhdGEtY2F0ZWdvcnk9XCJQUk9cIj48c3BhbiAnXG4gICAgICAgICAgICArICdjbGFzcz1cIndub2RlXCI+STwvc3Bhbj48L2Rpdj48L2Rpdj48L2Rpdj4nO1xuICAgIGl0KFwic2hvdWxkIGdlbmVyYXRlIGNvcnJlY3QgSFRNTCBmcm9tIFhNTFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGV4cGVjdChwYXJzZS5wYXJzZVhtbFRvSHRtbCh4bWwpLmlubmVySFRNTCkudG9FcXVhbFN0cmluZyhodG1sKTtcbiAgICB9KTtcbiAgICBpdChcInNob3VsZCBmYWlsXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZXhwZWN0KGZhbHNlKTtcbiAgICB9KTtcbn0pO1xuIiwiLypnbG9iYWwgYmVmb3JlRWFjaDogZmFsc2UsIGphc21pbmU6IGZhbHNlICovXG5cbmJlZm9yZUVhY2goZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1hdGNoZXJzID0ge1xuICAgICAgICB0b0VxdWFsU3RyaW5nOlxuICAgICAgICBmdW5jdGlvbiB0b0VxdWFsU3RyaW5nT3V0ZXIgKCkge1xuICAgICAgICAgICAgcmV0dXJuIHsgY29tcGFyZTpcbiAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHRvRXF1YWxTdHJpbmcgKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnBhc3MgPSBleHBlY3RlZCA9PT0gYWN0dWFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQucGFzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQubWVzc2FnZSA9IFwiJ1wiICsgYWN0dWFsICsgXCInIGlzIGVxdWFsIHRvICdcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZCArIFwiJ1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGV4cGVjdGVkLmNoYXJBdChpKSA9PT0gYWN0dWFsLmNoYXJBdChpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5tZXNzYWdlID0gXCJFeHBlY3RlZCAnXCIgKyBhY3R1YWwgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCInIHRvIGJlIGVxdWFsIHRvICdcIiArIGV4cGVjdGVkICsgXCInXCIgKyBcIlxcblwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiQ29tbW9uIHByZWZpeDogJ1wiICsgZXhwZWN0ZWQuc3Vic3RyaW5nKDAsIGkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiJ1xcblwiICsgXCJEaWZmZXJpbmcgcG9ydGlvbjogJ1wiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkLnN1YnN0cmluZyhpKSArIFwiJ1wiICsgXCIgdnMuICdcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWwuc3Vic3RyaW5nKGkpICsgXCInXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgdG9IYXZlQXR0cmlidXRlOlxuICAgICAgICBmdW5jdGlvbiB0b0hhdmVBdHRyaWJ1dGVPdXRlciAoKSB7XG4gICAgICAgICAgICByZXR1cm4geyBjb21wYXJlOlxuICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gdG9IYXZlQXR0cmlidXRlIChhY3R1YWwsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEgYWN0dWFsIGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucGFzcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQubWVzc2FnZSA9IFwiRXhwZWN0ZWQgYSBub24tRWxlbWVudCB0byBoYXZlXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJhbiBhdHRyaWJ1dGUuXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnBhc3MgPSBhY3R1YWwuaGFzQXR0cmlidXRlKGF0dHJpYnV0ZSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWwuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSkgPT09IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5wYXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lm1lc3NhZ2UgPSBcIkV4cGVjdGVkIGF0dHJpYnV0ZSAnXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGUgKyBcIicgd2FzICdcIiArIHZhbHVlICsgXCInXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5tZXNzYWdlID0gXCJFeHBlY3RlZCBhdHRyaWJ1dGUgJ1wiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlICsgXCInIHdhcyAnXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWwuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSkgKyBcIidcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGluc3RlYWQgb2YgJ1wiICsgdmFsdWUgKyBcIidcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wYXNzID0gYWN0dWFsLmhhc0F0dHJpYnV0ZShhdHRyaWJ1dGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lm1lc3NhZ2UgPSBcIkV4cGVjdGVkIGF0dHJpYnV0ZSAnXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZSArIFwiJyB3YXMgXCIgKyAocmVzdWx0LnBhc3MgPyBcIlwiIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJub3QgXCIpICsgXCJmb3VuZFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgfX07XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgamFzbWluZS5hZGRNYXRjaGVycyhtYXRjaGVycyk7XG59KTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS42LjNcbi8qIVxuIGpRdWVyeSBHcm93bFxuIENvcHlyaWdodCAyMDEzIEtldmluIFN5bHZlc3RyZVxuIDEuMS40XG5cbiBNb2RpZmllZCBieSBBYXJvbiBFY2F5XG4gKi9cblxudmFyICQsIEFuaW1hdGlvbiwgR3Jvd2wsXG4gICAgX19iaW5kID0gZnVuY3Rpb24oZm4sIG1lKXsgcmV0dXJuIGZ1bmN0aW9uKCl7IHJldHVybiBmbi5hcHBseShtZSwgYXJndW1lbnRzKTsgfTsgfTtcblxuJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG5cbkFuaW1hdGlvbiA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBBbmltYXRpb24oKSB7fVxuXG4gICAgQW5pbWF0aW9uLnRyYW5zaXRpb25zID0ge1xuICAgICAgICBcIndlYmtpdFRyYW5zaXRpb25cIjogXCJ3ZWJraXRUcmFuc2l0aW9uRW5kXCIsXG4gICAgICAgIFwibW96VHJhbnNpdGlvblwiOiBcIm1velRyYW5zaXRpb25FbmRcIixcbiAgICAgICAgXCJvVHJhbnNpdGlvblwiOiBcIm9UcmFuc2l0aW9uRW5kXCIsXG4gICAgICAgIFwidHJhbnNpdGlvblwiOiBcInRyYW5zaXRpb25lbmRcIlxuICAgIH07XG5cbiAgICBBbmltYXRpb24udHJhbnNpdGlvbiA9IGZ1bmN0aW9uKCRlbCkge1xuICAgICAgICB2YXIgZWwsIHJlc3VsdCwgdHlwZSwgX3JlZjtcbiAgICAgICAgZWwgPSAkZWxbMF07XG4gICAgICAgIF9yZWYgPSB0aGlzLnRyYW5zaXRpb25zO1xuICAgICAgICBmb3IgKHR5cGUgaW4gX3JlZikge1xuICAgICAgICAgICAgcmVzdWx0ID0gX3JlZlt0eXBlXTtcbiAgICAgICAgICAgIGlmIChlbC5zdHlsZVt0eXBlXSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gQW5pbWF0aW9uO1xuXG59KSgpO1xuXG5Hcm93bCA9IChmdW5jdGlvbigpIHtcbiAgICBHcm93bC5zZXR0aW5ncyA9IHtcbiAgICAgICAgbmFtZXNwYWNlOiAnZ3Jvd2wnLFxuICAgICAgICBkdXJhdGlvbjogMzIwMCxcbiAgICAgICAgY2xvc2U6IFwiJnRpbWVzO1wiLFxuICAgICAgICBsb2NhdGlvbjogXCJkZWZhdWx0XCIsXG4gICAgICAgIHN0eWxlOiBcImRlZmF1bHRcIixcbiAgICAgICAgc2l6ZTogXCJtZWRpdW1cIlxuICAgIH07XG5cbiAgICBHcm93bC5ncm93bCA9IGZ1bmN0aW9uKHNldHRpbmdzKSB7XG4gICAgICAgIGlmIChzZXR0aW5ncyA9PSBudWxsKSB7XG4gICAgICAgICAgICBzZXR0aW5ncyA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZSgpO1xuICAgICAgICByZXR1cm4gbmV3IEdyb3dsKHNldHRpbmdzKTtcbiAgICB9O1xuXG4gICAgR3Jvd2wuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJChcImJvZHk6bm90KDpoYXMoI2dyb3dscykpXCIpLmFwcGVuZCgnPGRpdiBpZD1cImdyb3dsc1wiIC8+Jyk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIEdyb3dsKHNldHRpbmdzKSB7XG4gICAgICAgIGlmIChzZXR0aW5ncyA9PSBudWxsKSB7XG4gICAgICAgICAgICBzZXR0aW5ncyA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaHRtbCA9IF9fYmluZCh0aGlzLmh0bWwsIHRoaXMpO1xuICAgICAgICB0aGlzLiRncm93bCA9IF9fYmluZCh0aGlzLiRncm93bCwgdGhpcyk7XG4gICAgICAgIHRoaXMuJGdyb3dscyA9IF9fYmluZCh0aGlzLiRncm93bHMsIHRoaXMpO1xuICAgICAgICB0aGlzLmFuaW1hdGUgPSBfX2JpbmQodGhpcy5hbmltYXRlLCB0aGlzKTtcbiAgICAgICAgdGhpcy5yZW1vdmUgPSBfX2JpbmQodGhpcy5yZW1vdmUsIHRoaXMpO1xuICAgICAgICB0aGlzLmRpc21pc3MgPSBfX2JpbmQodGhpcy5kaXNtaXNzLCB0aGlzKTtcbiAgICAgICAgdGhpcy5wcmVzZW50ID0gX19iaW5kKHRoaXMucHJlc2VudCwgdGhpcyk7XG4gICAgICAgIHRoaXMuY2xvc2UgPSBfX2JpbmQodGhpcy5jbG9zZSwgdGhpcyk7XG4gICAgICAgIHRoaXMuY3ljbGUgPSBfX2JpbmQodGhpcy5jeWNsZSwgdGhpcyk7XG4gICAgICAgIHRoaXMudW5iaW5kID0gX19iaW5kKHRoaXMudW5iaW5kLCB0aGlzKTtcbiAgICAgICAgdGhpcy5iaW5kID0gX19iaW5kKHRoaXMuYmluZCwgdGhpcyk7XG4gICAgICAgIHRoaXMucmVuZGVyID0gX19iaW5kKHRoaXMucmVuZGVyLCB0aGlzKTtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCBHcm93bC5zZXR0aW5ncywgc2V0dGluZ3MpO1xuICAgICAgICB0aGlzLiRncm93bHMoKS5hdHRyKCdjbGFzcycsIHRoaXMuc2V0dGluZ3MubG9jYXRpb24pO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH1cblxuICAgIEdyb3dsLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRncm93bDtcbiAgICAgICAgJGdyb3dsID0gdGhpcy4kZ3Jvd2woKTtcbiAgICAgICAgdGhpcy4kZ3Jvd2xzKCkuYXBwZW5kKCRncm93bCk7XG4gICAgICAgIHRoaXMuY3ljbGUoJGdyb3dsKTtcbiAgICB9O1xuXG4gICAgR3Jvd2wucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbigkZ3Jvd2wpIHtcbiAgICAgICAgaWYgKCRncm93bCA9PSBudWxsKSB7XG4gICAgICAgICAgICAkZ3Jvd2wgPSB0aGlzLiRncm93bCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkZ3Jvd2wuZmluZChcIi5cIiArIHRoaXMuc2V0dGluZ3MubmFtZXNwYWNlICsgXCItY2xvc2VcIikub24oXCJjbGlja1wiLCB0aGlzLmNsb3NlKTtcbiAgICB9O1xuXG4gICAgR3Jvd2wucHJvdG90eXBlLnVuYmluZCA9IGZ1bmN0aW9uKCRncm93bCkge1xuICAgICAgICBpZiAoJGdyb3dsID09IG51bGwpIHtcbiAgICAgICAgICAgICRncm93bCA9IHRoaXMuJGdyb3dsKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICRncm93bC5maW5kKFwiLlwiICsgKHRoaXMuc2V0dGluZ3MubmFtZXNwYWNlIC0gY2xvc2UpKS5vZmYoXCJjbGlja1wiLCB0aGlzLmNsb3NlKTtcbiAgICB9O1xuXG4gICAgR3Jvd2wucHJvdG90eXBlLmN5Y2xlID0gZnVuY3Rpb24oJGdyb3dsKSB7XG4gICAgICAgIGlmICgkZ3Jvd2wgPT0gbnVsbCkge1xuICAgICAgICAgICAgJGdyb3dsID0gdGhpcy4kZ3Jvd2woKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJGdyb3dsLnF1ZXVlKHRoaXMucHJlc2VudCkuZGVsYXkodGhpcy5zZXR0aW5ncy5kdXJhdGlvbikucXVldWUodGhpcy5kaXNtaXNzKS5xdWV1ZSh0aGlzLnJlbW92ZSk7XG4gICAgfTtcblxuICAgIEdyb3dsLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciAkZ3Jvd2w7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAkZ3Jvd2wgPSB0aGlzLiRncm93bCgpO1xuICAgICAgICByZXR1cm4gJGdyb3dsLnN0b3AoKS5xdWV1ZSh0aGlzLmRpc21pc3MpLnF1ZXVlKHRoaXMucmVtb3ZlKTtcbiAgICB9O1xuXG4gICAgR3Jvd2wucHJvdG90eXBlLnByZXNlbnQgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgJGdyb3dsO1xuICAgICAgICAkZ3Jvd2wgPSB0aGlzLiRncm93bCgpO1xuICAgICAgICB0aGlzLmJpbmQoJGdyb3dsKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW5pbWF0ZSgkZ3Jvd2wsIFwiXCIgKyB0aGlzLnNldHRpbmdzLm5hbWVzcGFjZSArIFwiLWluY29taW5nXCIsICdvdXQnLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIEdyb3dsLnByb3RvdHlwZS5kaXNtaXNzID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyICRncm93bDtcbiAgICAgICAgJGdyb3dsID0gdGhpcy4kZ3Jvd2woKTtcbiAgICAgICAgdGhpcy51bmJpbmQoJGdyb3dsKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW5pbWF0ZSgkZ3Jvd2wsIFwiXCIgKyB0aGlzLnNldHRpbmdzLm5hbWVzcGFjZSArIFwiLW91dGdvaW5nXCIsICdpbicsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgR3Jvd2wucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuJGdyb3dsKCkucmVtb3ZlKCk7XG4gICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgIH07XG5cbiAgICBHcm93bC5wcm90b3R5cGUuYW5pbWF0ZSA9IGZ1bmN0aW9uKCRlbGVtZW50LCBuYW1lLCBkaXJlY3Rpb24sIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciB0cmFuc2l0aW9uO1xuICAgICAgICBpZiAoZGlyZWN0aW9uID09IG51bGwpIHtcbiAgICAgICAgICAgIGRpcmVjdGlvbiA9ICdpbic7XG4gICAgICAgIH1cbiAgICAgICAgdHJhbnNpdGlvbiA9IEFuaW1hdGlvbi50cmFuc2l0aW9uKCRlbGVtZW50KTtcbiAgICAgICAgJGVsZW1lbnRbZGlyZWN0aW9uID09PSAnaW4nID8gJ3JlbW92ZUNsYXNzJyA6ICdhZGRDbGFzcyddKG5hbWUpO1xuICAgICAgICAkZWxlbWVudC5vZmZzZXQoKS5wb3NpdGlvbjtcbiAgICAgICAgJGVsZW1lbnRbZGlyZWN0aW9uID09PSAnaW4nID8gJ2FkZENsYXNzJyA6ICdyZW1vdmVDbGFzcyddKG5hbWUpO1xuICAgICAgICBpZiAoY2FsbGJhY2sgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0cmFuc2l0aW9uICE9IG51bGwpIHtcbiAgICAgICAgICAgICRlbGVtZW50Lm9uZSh0cmFuc2l0aW9uLCBjYWxsYmFjayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIEdyb3dsLnByb3RvdHlwZS4kZ3Jvd2xzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiRfZ3Jvd2xzICE9IG51bGwgPyB0aGlzLiRfZ3Jvd2xzIDogdGhpcy4kX2dyb3dscyA9ICQoJyNncm93bHMnKTtcbiAgICB9O1xuXG4gICAgR3Jvd2wucHJvdG90eXBlLiRncm93bCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kX2dyb3dsICE9IG51bGwgPyB0aGlzLiRfZ3Jvd2wgOiB0aGlzLiRfZ3Jvd2wgPSAkKHRoaXMuaHRtbCgpKTtcbiAgICB9O1xuXG4gICAgR3Jvd2wucHJvdG90eXBlLmh0bWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFwiPGRpdiBjbGFzcz0nXCIgKyB0aGlzLnNldHRpbmdzLm5hbWVzcGFjZSArIFwiIFwiICsgdGhpcy5zZXR0aW5ncy5uYW1lc3BhY2UgKyBcIi1cIiArIHRoaXMuc2V0dGluZ3Muc3R5bGUgKyBcIiBcIiArIHRoaXMuc2V0dGluZ3MubmFtZXNwYWNlICsgXCItXCIgKyB0aGlzLnNldHRpbmdzLnNpemUgKyBcIic+XFxuICA8ZGl2IGNsYXNzPSdcIiArIHRoaXMuc2V0dGluZ3MubmFtZXNwYWNlICsgXCItY2xvc2UnPlwiICsgdGhpcy5zZXR0aW5ncy5jbG9zZSArIFwiPC9kaXY+XFxuICA8ZGl2IGNsYXNzPSdcIiArIHRoaXMuc2V0dGluZ3MubmFtZXNwYWNlICsgXCItdGl0bGUnPlwiICsgdGhpcy5zZXR0aW5ncy50aXRsZSArIFwiPC9kaXY+XFxuICA8ZGl2IGNsYXNzPSdcIiArIHRoaXMuc2V0dGluZ3MubmFtZXNwYWNlICsgXCItbWVzc2FnZSc+XCIgKyB0aGlzLnNldHRpbmdzLm1lc3NhZ2UgKyBcIjwvZGl2PlxcbjwvZGl2PlwiO1xuICAgIH07XG5cbiAgICByZXR1cm4gR3Jvd2w7XG5cbn0pKCk7XG5cbmV4cG9ydHMuZ3Jvd2wgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgfVxuICAgIHJldHVybiBHcm93bC5ncm93bChvcHRpb25zKTtcbn07XG5cbmV4cG9ydHMuZ3Jvd2wuZXJyb3IgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIHNldHRpbmdzO1xuICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cbiAgICBzZXR0aW5ncyA9IHtcbiAgICAgICAgdGl0bGU6IFwiRXJyb3IhXCIsXG4gICAgICAgIHN0eWxlOiBcImVycm9yXCJcbiAgICB9O1xuICAgIHJldHVybiBleHBvcnRzLmdyb3dsKCQuZXh0ZW5kKHNldHRpbmdzLCBvcHRpb25zKSk7XG59O1xuXG5leHBvcnRzLmdyb3dsLm5vdGljZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB2YXIgc2V0dGluZ3M7XG4gICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgfVxuICAgIHNldHRpbmdzID0ge1xuICAgICAgICB0aXRsZTogXCJOb3RpY2UhXCIsXG4gICAgICAgIHN0eWxlOiBcIm5vdGljZVwiXG4gICAgfTtcbiAgICByZXR1cm4gZXhwb3J0cy5ncm93bCgkLmV4dGVuZChzZXR0aW5ncywgb3B0aW9ucykpO1xufTtcblxuZXhwb3J0cy5ncm93bC53YXJuaW5nID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBzZXR0aW5ncztcbiAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG4gICAgc2V0dGluZ3MgPSB7XG4gICAgICAgIHRpdGxlOiBcIldhcm5pbmchXCIsXG4gICAgICAgIHN0eWxlOiBcIndhcm5pbmdcIlxuICAgIH07XG4gICAgcmV0dXJuIGV4cG9ydHMuZ3Jvd2woJC5leHRlbmQoc2V0dGluZ3MsIG9wdGlvbnMpKTtcbn07XG4iLCIvKmdsb2JhbCBET01QYXJzZXI6IGZhbHNlLCBleHBvcnRzOiB0cnVlICovXG5cbi8qanNoaW50IGJyb3dzZXI6IHRydWUgKi9cblxuZnVuY3Rpb24gbWFrZVdub2RlICh4bWxOb2RlKSB7XG4gICAgdmFyIHdub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIiksXG4gICAgICAgIHRuID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoeG1sTm9kZS50ZXh0Q29udGVudCk7XG4gICAgd25vZGUuY2xhc3NOYW1lID0gXCJ3bm9kZVwiO1xuICAgIHdub2RlLmFwcGVuZENoaWxkKHRuKTtcbiAgICByZXR1cm4gd25vZGU7XG59XG5cbmZ1bmN0aW9uIG1ha2VTbm9kZSAoeG1sTm9kZSkge1xuICAgIHZhciBzbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksXG4gICAgICAgIGNuID0geG1sTm9kZS5jaGlsZE5vZGVzLFxuICAgICAgICBhdHRzID0geG1sTm9kZS5hdHRyaWJ1dGVzLFxuICAgICAgICBjLCBhLCBpO1xuICAgIHNub2RlLmNsYXNzTmFtZSA9IFwic25vZGVcIjtcbiAgICBmb3IgKGkgPSAwOyBpIDwgY24ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYyA9IGNuW2ldO1xuICAgICAgICBpZiAoYy5ub2RlVHlwZSA9PT0gMyAmJiBjLnRleHRDb250ZW50LnRyaW0oKSAhPT0gXCJcIikge1xuICAgICAgICAgICAgc25vZGUuYXBwZW5kQ2hpbGQobWFrZVdub2RlKGMpKTtcbiAgICAgICAgICAgIHNub2RlLnNldEF0dHJpYnV0ZShcImRhdGEtbm9kZXR5cGVcIiwgeG1sTm9kZS5ub2RlTmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoYy5ub2RlVHlwZSA9PT0gMSkge1xuICAgICAgICAgICAgc25vZGUuYXBwZW5kQ2hpbGQobWFrZVNub2RlKGMpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgYXR0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBhID0gYXR0c1tpXTtcbiAgICAgICAgc25vZGUuc2V0QXR0cmlidXRlKFwiZGF0YS1cIiArIGEubm9kZU5hbWUsIGEubm9kZVZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHNub2RlO1xufVxuXG5leHBvcnRzLnBhcnNlWG1sVG9IdG1sID0gZnVuY3Rpb24gcGFyc2VYbWxUb0h0bWwgKHhtbCkge1xuICAgIHZhciBkb20gPSBuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKHhtbCwgXCJ0ZXh0L3htbFwiKSxcbiAgICAgICAgc24wID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSxcbiAgICAgICAgcm9vdEVsZW1lbnQgPSBkb20uY2hpbGROb2Rlc1swXSxcbiAgICAgICAgY24gPSAgcm9vdEVsZW1lbnQuY2hpbGROb2RlcyxcbiAgICAgICAgYztcbiAgICBzbjAuY2xhc3NOYW1lID0gXCJzbm9kZVwiO1xuICAgIHNuMC5pZCA9IFwic24wXCI7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBjID0gY25baV07XG4gICAgICAgIGlmIChjLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgICAgICBzbjAuYXBwZW5kQ2hpbGQobWFrZVNub2RlKGMpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBUT0RPOiBnbG9iYWwgYXR0cmlidXRlc1xuICAgIHJldHVybiBzbjA7XG59O1xuXG5mdW5jdGlvbiBub2RlVG9YbWwgKGRvYywgbm9kZSwgcm9vdCkge1xuICAgIHZhciBuYW1lLCBpO1xuICAgIGlmIChyb290KSB7XG4gICAgICAgIG5hbWUgPSBcInNlbnRlbmNlXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgICAgIC8vIEVsZW1lbnQgbm9kZVxuICAgICAgICAgICAgbmFtZSA9IFwibm9udGVybWluYWxcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRleHQgbm9kZVxuICAgICAgICAgICAgbmFtZSA9IFwidGVybWluYWxcIjtcbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgcyA9IGRvYy5jcmVhdGVOb2RlKG5hbWUpLFxuICAgICAgICBhdHRycyA9IG5vZGUuYXR0cmlidXRlcztcbiAgICBmb3IgKGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcy5zZXRBdHRyaWJ1dGUoYXR0cnNbaV0ubmFtZSwgYXR0cnNbaV0udmFsdWUpO1xuICAgIH1cbiAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAobm9kZS5jaGlsZE5vZGVzW2ldLm5vZGVUeXBlID09PSAxIHx8XG4gICAgICAgICAgICAgICBub2RlLmNoaWxkTm9kZXNbaV0ubm9kZVR5cGUgPT09IDMpIHtcbiAgICAgICAgICAgICAgICAvLyBFbGVtZW50IG5vZGUgb3IgdGV4dCBub2RlXG4gICAgICAgICAgICAgICAgcy5hcHBlbmRDaGlsZChub2RlVG9YbWwobm9kZS5jaGlsZE5vZGVzW2ldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHM7XG59XG5cbmV4cG9ydHMucGFyc2VIdG1sVG9YbWwgPSBmdW5jdGlvbiBwYXJzZUh0bWxUb1htbCAobm9kZSkge1xuICAgIHZhciBkb2MgPSBkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5jcmVhdGVEb2N1bWVudChudWxsLCBcImNvcnB1c1wiLCBudWxsKTtcbiAgICBub2RlLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBkb2MuYXBwZW5kQ2hpbGQobm9kZVRvWG1sKGRvYywgdGhpcywgdHJ1ZSkpO1xuICAgIH0pO1xufTtcbiIsImV4cG9ydHMuY3RybEtleU1hcCA9IHt9O1xuZXhwb3J0cy5zaGlmdEtleU1hcCA9IHt9O1xuZXhwb3J0cy5yZWd1bGFyS2V5TWFwID0ge307XG5cbi8qKlxuKiBBZGQgYSBrZXliaW5kaW5nIGNvbW1hbmQuXG4qXG4qIENhbGxzIHRvIHRoaXMgZnVuY3Rpb24gc2hvdWxkIGJlIGluIHRoZSBgc2V0dGluZ3MuanNgIGZpbGUsIGdyb3VwZWQgaW4gYVxuKiBmdW5jdGlvbiBjYWxsZWQgYGN1c3RvbUNvbW1hbmRzYFxuKlxuKiBAcGFyYW0ge09iamVjdH0gZGljdCBhIG1hcHBpbmcgb2YgcHJvcGVydGllcyBvZiB0aGUga2V5YmluZGluZy4gIENhblxuKiBjb250YWluOlxuKlxuKiAtIGBrZXljb2RlYDogdGhlIG51bWVyaWMga2V5Y29kZSBmb3IgdGhlIGJpbmRpbmcgKG1hbmRhdG9yeSlcbiogLSBgc2hpZnRgOiB0cnVlIGlmIHRoaXMgaXMgYSBiaW5kaW5nIHdpdGggc2hpZnQgcHJlc3NlZCAob3B0aW9uYWwpXG4qIC0gYGN0cmxgOiB0cnVlIGlmIHRoaXMgaXMgYSBiaW5kaW5nIHdpdGggY29udHJvbCBwcmVzc2VkIChvcHRpb25hbClcbipcbiogQHBhcmFtIHtGdW5jdGlvbn0gZm4gdGhlIGZ1bmN0aW9uIHRvIGFzc29jaWF0ZSB3aXRoIHRoZSBrZXliaW5kaW5nLiAgQW55XG4qIGZ1cnRoZXIgYXJndW1lbnRzIHRvIHRoZSBgYWRkQ29tbWFuZGAgZnVuY3Rpb24gYXJlIHBhc3NlZCB0byBgZm5gIG9uIGVhY2hcbiogaW52b2NhdGlvbi5cbiovXG5mdW5jdGlvbiBhZGRDb21tYW5kKGRpY3QsIGZuKSB7XG4gICAgdmFyIGNvbW1hbmRNYXA7XG4gICAgaWYgKGRpY3QuY3RybCkge1xuICAgICAgICBjb21tYW5kTWFwID0gZXhwb3J0cy5jdHJsS2V5TWFwO1xuICAgIH0gZWxzZSBpZiAoZGljdC5zaGlmdCkge1xuICAgICAgICBjb21tYW5kTWFwID0gZXhwb3J0cy5zaGlmdEtleU1hcDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb21tYW5kTWFwID0gZXhwb3J0cy5yZWd1bGFyS2V5TWFwO1xuICAgIH1cbiAgICBjb21tYW5kTWFwW2RpY3Qua2V5Y29kZV0gPSB7XG4gICAgICAgIGZ1bmM6IGZuLFxuICAgICAgICBhcmdzOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpXG4gICAgfTtcbn1cbmV4cG9ydHMuYWRkQ29tbWFuZCA9IGFkZENvbW1hbmQ7XG4iLCIvLy88cmVmZXJlbmNlIHBhdGg9XCIuLy4uLy4uLy4uL3R5cGVzL2FsbC5kLnRzXCIgLz5cbi8vIFRPRE86IHR5cGUgZGVjbHNcbnZhciBpbml0aWFsU3RhdGUgPSB7XG4gICAgaXBub2RlczogW10sXG4gICAgY29tbWVudFR5cGVzOiBbXSxcbiAgICBleHRlbnNpb25zOiBbXSxcbiAgICBjbGF1c2VFeHRlbnNpb25zOiBbXSxcbiAgICBsZWFmRXh0ZW5zaW9uczogW10sXG4gICAgY2FzZUJhcnJpZXJzOiBbXSxcbiAgICBkaXNwbGF5Q2FzZU1lbnU6IGZhbHNlLFxuICAgIGNhc2VUYWdzOiBbXSxcbiAgICBjYXNlUGhyYXNlczogW10sXG4gICAgY2FzZU1hcmtlcnM6IFtdLFxuICAgIGRlZmF1bHRDb25NZW51R3JvdXA6IFtdLFxuICAgIGN1c3RvbUNvbk1lbnVHcm91cHM6IFtdLFxuICAgIGxvZ0RldGFpbDogZmFsc2Vcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaW5pdGlhbFN0YXRlO1xuIiwiLy8vPHJlZmVyZW5jZSBwYXRoPVwiLi8uLi8uLi8uLi90eXBlcy9hbGwuZC50c1wiIC8+XG4vLyBDb3B5cmlnaHQgKGMpIDIwMTEgQW50b24gS2FybCBJbmdhc29uLCBBYXJvbiBFY2F5XG4vLyBUaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgQW5ub3RhbGQgcHJvZ3JhbSBmb3IgYW5ub3RhdGluZ1xuLy8gcGhyYXNlLXN0cnVjdHVyZSB0cmVlYmFua3MgaW4gdGhlIFBlbm4gVHJlZWJhbmsgc3R5bGUuXG4vLyBUaGlzIGZpbGUgaXMgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbFxuLy8gUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5IHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlclxuLy8gdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuLy8gVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuLy8gV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuLy8gTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiBTZWUgdGhlIEdOVSBMZXNzZXJcbi8vIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbi8vIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbi8vIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZVxuLy8gPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxudmFyIF8gPSByZXF1aXJlKFwibG9kYXNoXCIpO1xudmFyICQgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xudmFyIHNlbGVjdGlvbiA9IHJlcXVpcmUoXCIuL3NlbGVjdGlvblwiKTtcbnZhciB1bmRvID0gcmVxdWlyZShcIi4vdW5kb1wiKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIGVkaXQgPSByZXF1aXJlKFwiLi9zdHJ1Yy1lZGl0XCIpO1xudmFyIGNvbmYgPSByZXF1aXJlKFwiLi9jb25maWdcIik7XG5cbnZhciBjb25tZW51cyA9IHt9LCBjb25sZWFmcyA9IFtdLCBjYXNlTWFya2VycyA9IFtdO1xuXG5mdW5jdGlvbiByZXNldEdsb2JhbHMoKSB7XG4gICAgY29ubWVudXMgPSB7fTtcbiAgICBjb25sZWFmcyA9IFtdO1xuICAgIGNhc2VNYXJrZXJzID0gW107XG59XG5leHBvcnRzLnJlc2V0R2xvYmFscyA9IHJlc2V0R2xvYmFscztcblxuZnVuY3Rpb24gaGlkZUNvbnRleHRNZW51KCkge1xuICAgICQoXCIjY29uTWVudVwiKS5jc3MoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xufVxuZXhwb3J0cy5oaWRlQ29udGV4dE1lbnUgPSBoaWRlQ29udGV4dE1lbnU7XG5cbmZ1bmN0aW9uIGFkZENvbk1lbnUobGFiZWwsIHN1Z2dlc3Rpb25zKSB7XG4gICAgY29ubWVudXNbbGFiZWxdID0ge1xuICAgICAgICBzdWdnZXN0aW9uczogc3VnZ2VzdGlvbnNcbiAgICB9O1xufVxuZXhwb3J0cy5hZGRDb25NZW51ID0gYWRkQ29uTWVudTtcblxuZnVuY3Rpb24gYWRkQ29uTGVhZihzdWdnZXN0aW9uLCBiZWZvcmUsIGxhYmVsLCB3b3JkKSB7XG4gICAgdmFyIGNvbmxlYWYgPSB7XG4gICAgICAgIHN1Z2dlc3Rpb246IHN1Z2dlc3Rpb24sXG4gICAgICAgIGJlZm9yZTogYmVmb3JlLFxuICAgICAgICBsYWJlbDogbGFiZWwsXG4gICAgICAgIHdvcmQ6IHdvcmRcbiAgICB9O1xuXG4gICAgY29ubGVhZnMucHVzaChjb25sZWFmKTtcbn1cbmV4cG9ydHMuYWRkQ29uTGVhZiA9IGFkZENvbkxlYWY7XG5cbmZ1bmN0aW9uIGFkZENhc2VNYXJrZXIobWFya2VyKSB7XG4gICAgY2FzZU1hcmtlcnMucHVzaChtYXJrZXIpO1xufVxuZXhwb3J0cy5hZGRDYXNlTWFya2VyID0gYWRkQ2FzZU1hcmtlcjtcbjtcblxuLy8gVE9ETzogYWRkQ2FzZU1hcmtlcnMsIHBsdXJhbFxuLyoqXG4qIFRvZ2dsZSB0aGUgZXh0ZW5zaW9uIG9mIGEgbm9kZS5cbipcbiogQSBjb250ZXh0IG1lbnUgYWN0aW9uIGZ1bmN0aW9uLlxuKlxuKiBAcGFyYW0ge05vZGV9IG5vZGVcbiogQHBhcmFtIHtTdHJpbmd9IGV4dGVuc2lvbiB0aGUgZXh0ZW5zaW9uIHRvIHRvZ2dsZVxuKiBAcmV0dXJucyB7RnVuY3Rpb259IEEgZnVuY3Rpb24gd2hpY2gsIHdoZW4gY2FsbGVkLCB3aWxsIGV4ZWN1dGUgdGhlIGFjdGlvbi5cbiogQHByaXZhdGVcbiovXG5mdW5jdGlvbiBkb1RvZ2dsZUV4dGVuc2lvbihub2RlLCBleHRlbnNpb24pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB1bmRvLnRvdWNoVHJlZSgkKG5vZGUpKTtcbiAgICAgICAgc2VsZWN0aW9uLmNsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgIHNlbGVjdGlvbi5zZWxlY3ROb2RlKG5vZGUpO1xuICAgICAgICBlZGl0LnRvZ2dsZUV4dGVuc2lvbihleHRlbnNpb24pO1xuICAgICAgICBleHBvcnRzLmhpZGVDb250ZXh0TWVudSgpO1xuICAgICAgICBzZWxlY3Rpb24uY2xlYXJTZWxlY3Rpb24oKTtcbiAgICB9O1xufVxuXG4vKipcbiogU2V0IHRoZSBjYXNlIG9mIGEgbm9kZS5cbipcbiogQSBjb250ZXh0IG1lbnUgYWN0aW9uIGZ1bmN0aW9uLiAgUmVjdXJzZXMgaW50byBjaGlsZHJlbiBvZiB0aGlzIG5vZGUsXG4qIHN0b3BwaW5nIHdoZW4gYSBiYXJyaWVyIChjYXNlIG5vZGUgb3IgZXhwbGljaXRseSBkZWZpbmVkIGJhcnJpZXIpIGlzXG4qIHJlYWNoZWQuXG4qXG4qIEBwYXJhbSB7Tm9kZX0gbm9kZVxuKiBAcGFyYW0ge1N0cmluZ30gdGhlQ2FzZSB0aGUgY2FzZSB0byBhc3NpZ25cbiogQHJldHVybnMge0Z1bmN0aW9ufSBBIGZ1bmN0aW9uIHdoaWNoLCB3aGVuIGNhbGxlZCwgd2lsbCBleGVjdXRlIHRoZSBhY3Rpb24uXG4qIEBwcml2YXRlXG4qL1xuZnVuY3Rpb24gc2V0Q2FzZU9uVGFnKG5vZGUsIHRoZUNhc2UpIHtcbiAgICBmdW5jdGlvbiBkb0tpZHMobiwgb3ZlcnJpZGUpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzQ2FzZU5vZGUobi5nZXQoMCkpKSB7XG4gICAgICAgICAgICB1dGlscy5zZXRDYXNlKG4uZ2V0KDApLCB0aGVDYXNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChfLmNvbnRhaW5zKGNvbmYuY2FzZUJhcnJpZXJzLCB1dGlscy5nZXRMYWJlbChuKS5zcGxpdChcIi1cIilbMF0pICYmICFuLnBhcmVudCgpLmlzKFwiLkNPTkpQXCIpICYmICFvdmVycmlkZSkge1xuICAgICAgICAgICAgLy8gbm90aGluZ1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbi5jaGlsZHJlbihcIi5zbm9kZVwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBkb0tpZHMoJCh0aGlzKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB1bmRvLnRvdWNoVHJlZShub2RlKTtcbiAgICAgICAgZG9LaWRzKG5vZGUsIHRydWUpO1xuICAgIH07XG59XG5cbi8qKlxuKiBJbnNlcnQgYSBsZWFmIG5vZGUuXG4qXG4qIEEgY29udGV4dCBtZW51IGFjdGlvbiBmdW5jdGlvbi5cbipcbiogQHBhcmFtIHtPYmplY3R9IGNvbmxlYWYgYW4gb2JqZWN0IGRlc2NyaWJpbmcgdGhlIGxlYWYgdG8gYmUgYWRkZWQuICBIYXMgdGhlXG4qIGZvbGxvd2luZyBrZXlzOlxuKlxuKiAtIGBiZWZvcmVgIEJvb2xlYW4sIGluc2VydCB0aGlzIGxlYWYgYmVvZnJlIG9yIGZ0ZXIgdGhlIHRhcmdldFxuKiAtIGBsYWJlbGAgU3RyaW5nLCB0aGUgbGFiZWwgb2YgdGhlIG5vZGUgdG8gaW5zZXJ0XG4qIC0gYHdvcmRgIFN0cmluZywgdGhlIHRleHQgb2YgdGhlIG5vZGUgdG8gaW5zZXJ0XG4qIEBwYXJhbSB7Tm9kZX0gbm9kZVxuKiBAcmV0dXJucyB7RnVuY3Rpb259IEEgZnVuY3Rpb24gd2hpY2gsIHdoZW4gY2FsbGVkLCB3aWxsIGV4ZWN1dGUgdGhlIGFjdGlvbi5cbiogQHByaXZhdGVcbiovXG5mdW5jdGlvbiBkb0NvbkxlYWYoY29ubGVhZiwgbm9kZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGVkaXQubWFrZUxlYWYoY29ubGVhZi5iZWZvcmUsIGNvbmxlYWYubGFiZWwsIGNvbmxlYWYud29yZCwgbm9kZSk7XG4gICAgICAgIGV4cG9ydHMuaGlkZUNvbnRleHRNZW51KCk7XG4gICAgfTtcbn1cblxuLyoqXG4qIEFkZCBhIGdyb3VwIG9mIGxhYmVscyB0byB0aGUgY29udGV4dCBtZW51LlxuKlxuKiBXaGVuIGFjdGl2YXRpbmcgdGhlIGNvbnRleHQgbWVudSwgaWYgdGhlIGxhYmVsIG9mIHRoZSB0YXJnZXRlZCBub2RlIGJlbG9uZ3NcbiogdG8gb25lIG9mIHRoZXNlIGdyb3VwcywgdGhlIG90aGVyIGVudHJpZXMgaW4gdGhlIGdyb3VwIHdpbGwgYmUgc3VnZ2VzdGVkIGFzXG4qIG5ldyBsYWJlbHMuXG4qXG4qIEBwYXJhbSB7U3RyaW5nW119IGdyb3VwXG4qL1xuZnVuY3Rpb24gYWRkQ29uTWVudUdyb3VwKGdyb3VwKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBncm91cC5sZW5ndGg7IGkrKykge1xuICAgICAgICBleHBvcnRzLmFkZENvbk1lbnUoZ3JvdXBbaV0sIGdyb3VwKTtcbiAgICB9XG59XG5leHBvcnRzLmFkZENvbk1lbnVHcm91cCA9IGFkZENvbk1lbnVHcm91cDtcblxuLyoqXG4qIEFkZCBhIHRlcm1pbmFsIG5vZGUgdG8gdGhlIGNvbnRleHQgbWVudS5cbipcbiogQWRkIGEgdGVybWluYWwgbm9kZSB0aGF0IHRoZSBjb250ZXh0IG1lbnUgd2lsbCBhbGxvdyBpbnNlcnRpbmcgaW4gdGhlIHRyZWUuXG4qXG4qIEBwYXJhbSB7U3RyaW5nfSBwaHJhc2UgdGhlIGxhYmVsIG9mIHRoZSBsZWFmXG4qIEBwYXJhbSB7U3RyaW5nfSB0ZXJtaW5hbCB0aGUgdGV4dCBvZiB0aGUgbGVhZlxuKi9cbmZ1bmN0aW9uIGFkZENvbkxlYWZCZWZvcmUocGhyYXNlLCB0ZXJtaW5hbCkge1xuICAgIGV4cG9ydHMuYWRkQ29uTGVhZihcIiZsdDsgKFwiICsgcGhyYXNlICsgXCIgXCIgKyB0ZXJtaW5hbCArIFwiKVwiLCB0cnVlLCBwaHJhc2UsIHRlcm1pbmFsKTtcbn1cbmV4cG9ydHMuYWRkQ29uTGVhZkJlZm9yZSA9IGFkZENvbkxlYWZCZWZvcmU7XG5cbi8qKlxuKiBDb21wdXRlIHRoZSBzdWdnZXN0ZWQgY2hhbmdlcyBmb3IgdGhlIGNvbnRleHQgbWVudSBmb3IgYSBsYWJlbC5cbipcbiogQHBhcmFtIHtTdHJpbmd9IGxhYmVsXG4qIEBwcml2YXRlXG4qL1xuZnVuY3Rpb24gZ2V0U3VnZ2VzdGlvbnMobm9kZSkge1xuICAgIHZhciBpbmRzdHIgPSBcIlwiLCBpbmR0eXBlID0gXCJcIiwgdGhlQ2FzZSA9IFwiXCI7XG4gICAgaWYgKHV0aWxzLmdldEluZGV4KG5vZGUpKSB7XG4gICAgICAgIGluZHN0ciA9IHV0aWxzLmdldEluZGV4KG5vZGUpLnRvU3RyaW5nKCk7XG4gICAgICAgIGluZHR5cGUgPSB1dGlscy5nZXRJbmRleFR5cGUobm9kZSk7XG4gICAgfVxuICAgIHZhciBsYWJlbCA9IHV0aWxzLmdldExhYmVsKCQobm9kZSkpO1xuICAgIHRoZUNhc2UgPSB1dGlscy5nZXRDYXNlKG5vZGUpO1xuICAgIGlmICh0aGVDYXNlKSB7XG4gICAgICAgIHRoZUNhc2UgPSBcIi1cIiArIHRoZUNhc2U7XG4gICAgfVxuXG4gICAgdmFyIHN1Z2dlc3Rpb25zID0gW107XG4gICAgdmFyIG1lbnVpdGVtcyA9IGNvbmYuY3VzdG9tQ29uTWVudUdyb3VwcztcbiAgICBpZiAoY29ubWVudXNbbGFiZWxdICE9PSBudWxsKSB7XG4gICAgICAgIG1lbnVpdGVtcyA9IGNvbm1lbnVzW2xhYmVsXS5zdWdnZXN0aW9ucztcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1lbnVpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbWVudWl0ZW0gPSBtZW51aXRlbXNbaV07XG5cbiAgICAgICAgLy8gVE9ETzogY2hlY2sgd2hldGhlciBtZW51aXRlbSBpcyByZWFsbHkgYSBiYXJlIGNhdGVnb3J5XG4gICAgICAgIGlmICh1dGlscy5pc0Nhc2VDYXRlZ29yeShtZW51aXRlbSkpIHtcbiAgICAgICAgICAgIG1lbnVpdGVtICs9IHRoZUNhc2U7XG4gICAgICAgIH1cbiAgICAgICAgc3VnZ2VzdGlvbnMucHVzaChtZW51aXRlbSArIGluZHR5cGUgKyBpbmRzdHIpO1xuICAgIH1cbiAgICByZXR1cm4gXy51bmlxKHN1Z2dlc3Rpb25zKTtcbn1cblxuLyoqXG4qIFBvcHVsYXRlIHRoZSBjb250ZXh0IG1lbnUgZm9yIGEgZ2l2ZW4gbm9kZS5cbipcbiogRG9lcyBub3QgZGlzcGxheSB0aGUgbWVudS5cbipcbiogQHBhcmFtIHtOb2RlfSBub2RlT3JpZ1xuKiBAcHJpdmF0ZVxuKi9cbmZ1bmN0aW9uIGxvYWRDb250ZXh0TWVudShub2RlT3JpZykge1xuICAgIHZhciBuTyA9ICQobm9kZU9yaWcpLCBub2RlSW5kZXggPSB1dGlscy5nZXRJbmRleChub2RlT3JpZyksIGluZGV4U2VwID0gXCJcIiwgaW5kZXhTdHJpbmcgPSBcIlwiLCBub2RlbGFiZWwgPSB1dGlscy5nZXRMYWJlbChuTyksIG5ld25vZGUsIGk7XG4gICAgZnVuY3Rpb24gbG9hZENvbk1lbnVNb3VzZWRvd24oKSB7XG4gICAgICAgIHZhciBzdWdnZXN0aW9uID0gXCJcIiArICQodGhpcykudGV4dCgpO1xuICAgICAgICB1dGlscy5zZXROb2RlTGFiZWwobk8sIHN1Z2dlc3Rpb24pO1xuICAgICAgICBleHBvcnRzLmhpZGVDb250ZXh0TWVudSgpO1xuICAgIH1cblxuICAgIGlmIChub2RlSW5kZXgpIHtcbiAgICAgICAgaW5kZXhTZXAgPSB1dGlscy5nZXRJbmRleFR5cGUobm9kZU9yaWcpO1xuICAgICAgICBpbmRleFN0cmluZyA9IGluZGV4U2VwICsgdXRpbHMuZ2V0SW5kZXgobm9kZU9yaWcpO1xuICAgIH1cbiAgICAkKFwiI2NvbkxlZnRcIikuZW1wdHkoKTtcbiAgICAkKFwiI2NvbkxlZnRcIikuYXBwZW5kKCQoXCI8ZGl2IGNsYXNzPSdjb25NZW51SGVhZGluZyc+TGFiZWw8L2Rpdj5cIikpO1xuXG4gICAgdmFyIHN1Z2dlc3Rpb25zID0gZ2V0U3VnZ2VzdGlvbnMobm9kZU9yaWcpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBzdWdnZXN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoc3VnZ2VzdGlvbnNbaV0gIT09IG5vZGVsYWJlbCkge1xuICAgICAgICAgICAgbmV3bm9kZSA9ICQoXCI8ZGl2IGNsYXNzPSdjb25NZW51SXRlbSc+PGEgaHJlZj0nIyc+XCIgKyBzdWdnZXN0aW9uc1tpXSArIGluZGV4U3RyaW5nICsgXCI8L2E+PC9kaXY+XCIpO1xuICAgICAgICAgICAgJChuZXdub2RlKS5tb3VzZWRvd24obG9hZENvbk1lbnVNb3VzZWRvd24pO1xuICAgICAgICAgICAgJChcIiNjb25MZWZ0XCIpLmFwcGVuZChuZXdub2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGRvIHRoZSByaWdodCBzaWRlIGNvbnRleHQgbWVudVxuICAgICQoXCIjY29uUmlnaHRcIikuZW1wdHkoKTtcblxuICAgIGlmIChjb25mLmRpc3BsYXlDYXNlTWVudSkge1xuICAgICAgICBpZiAodXRpbHMuaGFzQ2FzZShub2RlT3JpZykgfHwgdXRpbHMuaXNDYXNlUGhyYXNlKG5vZGVPcmlnKSkge1xuICAgICAgICAgICAgJChcIiNjb25SaWdodFwiKS5hcHBlbmQoJChcIjxkaXYgY2xhc3M9J2Nvbk1lbnVIZWFkaW5nJz5DYXNlPC9kaXY+XCIpKTtcbiAgICAgICAgICAgIGNhc2VNYXJrZXJzLmZvckVhY2goZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICAgICAgICBuZXdub2RlID0gJChcIjxkaXYgY2xhc3M9J2Nvbk1lbnVJdGVtJz48YSBocmVmPScjJz4tXCIgKyBjICsgXCI8L2E+PC9kaXY+XCIpO1xuICAgICAgICAgICAgICAgICQobmV3bm9kZSkubW91c2Vkb3duKHNldENhc2VPblRhZyhuTywgYykpO1xuICAgICAgICAgICAgICAgICQoXCIjY29uUmlnaHRcIikuYXBwZW5kKG5ld25vZGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBkbyBhZGRsZWFmYmVmb3JlXG4gICAgJChcIiNjb25SaWdodFwiKS5hcHBlbmQoJChcIjxkaXYgY2xhc3M9J2Nvbk1lbnVIZWFkaW5nJz5MZWFmIGJlZm9yZTwvZGl2PlwiKSk7XG4gICAgZm9yIChpID0gMDsgaSA8IGNvbmxlYWZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG5ld25vZGUgPSAkKFwiPGRpdiBjbGFzcz0nY29uTWVudUl0ZW0nPjxhIGhyZWY9JyMnPlwiICsgY29ubGVhZnNbaV0uc3VnZ2VzdGlvbiArIFwiPC9hPjwvZGl2PlwiKTtcbiAgICAgICAgJChuZXdub2RlKS5tb3VzZWRvd24oZG9Db25MZWFmKGNvbmxlYWZzW2ldLCBub2RlT3JpZykpO1xuICAgICAgICAkKFwiI2NvblJpZ2h0XCIpLmFwcGVuZChuZXdub2RlKTtcbiAgICB9XG5cbiAgICAkKFwiI2NvblJpZ2h0ZXN0XCIpLmVtcHR5KCk7XG4gICAgJChcIiNjb25SaWdodGVzdFwiKS5hcHBlbmQoJChcIjxkaXYgY2xhc3M9J2Nvbk1lbnVIZWFkaW5nJz5Ub2dnbGUgZXh0LjwvZGl2PlwiKSk7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgY29uZi5leHRlbnNpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIGRvIHRoZSByaWdodCBzaWRlIGNvbnRleHQgbWVudVxuICAgICAgICBuZXdub2RlID0gJChcIjxkaXYgY2xhc3M9J2Nvbk1lbnVJdGVtJz48YSBocmVmPScjJz5cIiArIGNvbmYuZXh0ZW5zaW9uc1tpXSArIFwiPC9hPjwvZGl2PlwiKTtcbiAgICAgICAgJChuZXdub2RlKS5tb3VzZWRvd24oZG9Ub2dnbGVFeHRlbnNpb24obm9kZU9yaWcsIGNvbmYuZXh0ZW5zaW9uc1tpXSkpO1xuICAgICAgICAkKFwiI2NvblJpZ2h0ZXN0XCIpLmFwcGVuZChuZXdub2RlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNob3dDb250ZXh0TWVudShlKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBlLnRhcmdldDtcbiAgICBpZiAoZWxlbWVudCA9PT0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzbjBcIikpIHtcbiAgICAgICAgc2VsZWN0aW9uLmNsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgbGVmdCA9IGUucGFnZVggKyBcInB4XCI7XG4gICAgdmFyIHRvcCA9IGUucGFnZVkgKyBcInB4XCI7XG5cbiAgICB2YXIgY29ubCA9ICQoXCIjY29uTGVmdFwiKSwgY29uciA9ICQoXCIjY29uUmlnaHRcIiksIGNvbnJyID0gJChcIiNjb25SaWdodGVzdFwiKSwgY29ubSA9ICQoXCIjY29uTWVudVwiKTtcblxuICAgIGNvbmwuZW1wdHkoKTtcbiAgICBsb2FkQ29udGV4dE1lbnUoZWxlbWVudCk7XG5cbiAgICAvLyBNYWtlIHRoZSBjb2x1bW5zIGVxdWFsbHkgaGlnaFxuICAgIGNvbmwuaGVpZ2h0KFwiYXV0b1wiKTtcbiAgICBjb25yLmhlaWdodChcImF1dG9cIik7XG4gICAgY29ucnIuaGVpZ2h0KFwiYXV0b1wiKTtcbiAgICB2YXIgaCA9IF8ubWF4KF8ubWFwKFtjb25sLCBjb25yLCBjb25ycl0sIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4LmhlaWdodCgpO1xuICAgIH0pKTtcbiAgICBjb25sLmhlaWdodChoKTtcbiAgICBjb25yLmhlaWdodChoKTtcbiAgICBjb25yci5oZWlnaHQoaCk7XG5cbiAgICBjb25tLmNzcyhcImxlZnRcIiwgbGVmdCk7XG4gICAgY29ubS5jc3MoXCJ0b3BcIiwgdG9wKTtcbiAgICBjb25tLmNzcyhcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xufVxuZXhwb3J0cy5zaG93Q29udGV4dE1lbnUgPSBzaG93Q29udGV4dE1lbnU7XG4iLCIvLy88cmVmZXJlbmNlIHBhdGg9XCIuLy4uLy4uLy4uL3R5cGVzL2FsbC5kLnRzXCIgLz5cbi8vIFRPRE86IG1pZ3JhdGUgdG8gdmV4XG52YXIgJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG52YXIgZXZlbnRzID0gcmVxdWlyZShcIi4vZXZlbnRzXCIpO1xuXG52YXIgZGlhbG9nU2hvd2luZyA9IGZhbHNlO1xuXG5mdW5jdGlvbiBpc0RpYWxvZ1Nob3dpbmcoKSB7XG4gICAgcmV0dXJuIGRpYWxvZ1Nob3dpbmc7XG59XG5leHBvcnRzLmlzRGlhbG9nU2hvd2luZyA9IGlzRGlhbG9nU2hvd2luZztcbjtcblxuLyoqXG4qIEhpZGUgdGhlIGRpc3BsYXllZCBkaWFsb2cgYm94LlxuKi9cbmZ1bmN0aW9uIGhpZGVEaWFsb2dCb3goKSB7XG4gICAgJChcIiNkaWFsb2dCb3hcIikuZ2V0KDApLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICQoXCIjZGlhbG9nQmFja2dyb3VuZFwiKS5nZXQoMCkuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgZG9jdW1lbnQuYm9keS5vbmtleWRvd24gPSBldmVudHMuaGFuZGxlS2V5RG93bjtcbiAgICBkaWFsb2dTaG93aW5nID0gZmFsc2U7XG59XG5leHBvcnRzLmhpZGVEaWFsb2dCb3ggPSBoaWRlRGlhbG9nQm94O1xuXG4vKipcbiogU2hvdyBhIGRpYWxvZyBib3guXG4qXG4qIFRoaXMgZnVuY3Rpb24gY3JlYXRlcyBrZXliaW5kaW5ncyBmb3IgdGhlIGVzY2FwZSAodG8gY2xvc2UgZGlhbG9nIGJveCkgYW5kXG4qIHJldHVybiAoY2FsbGVyLXNwZWNpZmllZCBiZWhhdmlvcikga2V5cy5cbipcbiogQHBhcmFtIHtTdHJpbmd9IHRpdGxlIHRoZSB0aXRsZSBvZiB0aGUgZGlhbG9nIGJveFxuKiBAcGFyYW0ge1N0cmluZ30gaHRtbCB0aGUgaHRtbCB0byBkaXNwbGF5IGluIHRoZSBkaWFsb2cgYm94XG4qIEBwYXJhbSB7RnVuY3Rpb259IHJldHVybkZuIGEgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIHJldHVybiBpcyBwcmVzc2VkXG4qIEBwYXJhbSB7RnVuY3Rpb259IGhpZGVIb29rIGEgZnVuY3Rpb24gdG8gcnVuIHdoZW4gaGlkaW5nIHRoZSBkaWFsb2cgYm94XG4qL1xuZnVuY3Rpb24gc2hvd0RpYWxvZ0JveCh0aXRsZSwgaHRtbCwgcmV0dXJuRm4sIGhpZGVIb29rKSB7XG4gICAgZG9jdW1lbnQuYm9keS5vbmtleWRvd24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoZS5rZXlDb2RlID09PSAyNykge1xuICAgICAgICAgICAgaWYgKGhpZGVIb29rKSB7XG4gICAgICAgICAgICAgICAgaGlkZUhvb2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV4cG9ydHMuaGlkZURpYWxvZ0JveCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PT0gMTMgJiYgcmV0dXJuRm4pIHtcbiAgICAgICAgICAgIHJldHVybkZuKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGh0bWwgPSBcIjxkaXYgY2xhc3M9XFxcIm1lbnVUaXRsZVxcXCI+XCIgKyB0aXRsZSArIFwiPC9kaXY+XCIgKyBcIjxkaXYgaWQ9XFxcImRpYWxvZ0NvbnRlbnRcXFwiPlwiICsgaHRtbCArIFwiPC9kaXY+XCI7XG4gICAgJChcIiNkaWFsb2dCb3hcIikuaHRtbChodG1sKS5nZXQoMCkuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuICAgICQoXCIjZGlhbG9nQmFja2dyb3VuZFwiKS5nZXQoMCkuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuICAgIGRpYWxvZ1Nob3dpbmcgPSB0cnVlO1xufVxuZXhwb3J0cy5zaG93RGlhbG9nQm94ID0gc2hvd0RpYWxvZ0JveDtcblxuLy8gVE9ETzogaWRlYWxseSB3ZSB3b3VsZCBub3QgZXhwb3J0IHRoaXMsIGJ1dCB0aGVyZSBpcyBhIGNhbGxlci4uLlxuLyoqXG4qIFNldCBhIGhhbmRsZXIgZm9yIHRoZSBlbnRlciBrZXkgaW4gYSB0ZXh0IGJveC5cbiogQHByaXZhdGVcbiovXG5mdW5jdGlvbiBzZXRJbnB1dEZpZWxkRW50ZXIoZmllbGQsIGZuKSB7XG4gICAgZmllbGQua2V5ZG93bihmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5leHBvcnRzLnNldElucHV0RmllbGRFbnRlciA9IHNldElucHV0RmllbGRFbnRlcjtcbiIsIi8vLzxyZWZlcmVuY2UgcGF0aD1cIi4vLi4vLi4vLi4vdHlwZXMvYWxsLmQudHNcIiAvPlxudmFyIHMgPSByZXF1aXJlKFwiLi9zdHJ1Yy1lZGl0XCIpO1xudmFyIHhVbmRvID0gcmVxdWlyZShcIi4vdW5kb1wiKTtcbnZhciBuID0gcmVxdWlyZShcIi4vbm9kZS1lZGl0XCIpO1xudmFyIHNlbGVjdGlvbiA9IHJlcXVpcmUoXCIuL3NlbGVjdGlvblwiKTtcbnZhciB4U2VhcmNoID0gcmVxdWlyZShcIi4vc2VhcmNoXCIpO1xudmFyIHZpZXcgPSByZXF1aXJlKFwiLi92aWV3XCIpO1xudmFyIG5vZGVGb3JtYXR0ZXIgPSByZXF1aXJlKFwiLi9ub2RlLWZvcm1hdHRlclwiKTtcblxuZXhwb3J0cy5uZiA9IG5vZGVGb3JtYXR0ZXI7XG5cbmV4cG9ydHMubGVhZkFmdGVyID0gcy5sZWFmQWZ0ZXI7XG5leHBvcnRzLmxlYWZCZWZvcmUgPSBzLmxlYWZCZWZvcmU7XG5leHBvcnRzLnNldExhYmVsID0gcy5zZXRMYWJlbDtcbmV4cG9ydHMubWFrZU5vZGUgPSBzLm1ha2VOb2RlO1xuZXhwb3J0cy5jb0luZGV4ID0gcy5jb0luZGV4O1xuZXhwb3J0cy5zcGxpdFdvcmQgPSBuLnNwbGl0V29yZDtcbmV4cG9ydHMudG9nZ2xlRXh0ZW5zaW9uID0gcy50b2dnbGVFeHRlbnNpb247XG5leHBvcnRzLnBydW5lTm9kZSA9IHMucHJ1bmVOb2RlO1xuZXhwb3J0cy51bmRvID0geFVuZG8udW5kbztcbmV4cG9ydHMucmVkbyA9IHhVbmRvLnJlZG87XG5leHBvcnRzLmVkaXROb2RlID0gbi5lZGl0Tm9kZTtcbmV4cG9ydHMuY2xlYXJTZWxlY3Rpb24gPSBzZWxlY3Rpb24uY2xlYXJTZWxlY3Rpb247XG5leHBvcnRzLmRpc3BsYXlSZW5hbWUgPSBuLmRpc3BsYXlSZW5hbWU7XG5leHBvcnRzLnNlYXJjaCA9IHhTZWFyY2guc2VhcmNoO1xuZXhwb3J0cy50b2dnbGVMZW1tYXRhID0gdmlldy50b2dnbGVMZW1tYXRhO1xuZXhwb3J0cy50b2dnbGVDb2xsYXBzZWQgPSB2aWV3LnRvZ2dsZUNvbGxhcHNlZDtcbiIsIi8vLzxyZWZlcmVuY2UgcGF0aD1cIi4vLi4vLi4vLi4vdHlwZXMvYWxsLmQudHNcIiAvPlxudmFyIGR1bW15O1xuXG52YXIgJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG52YXIgXyA9IHJlcXVpcmUoXCJsb2Rhc2hcIik7XG5cbnZhciBnbG9iYWxzID0gcmVxdWlyZShcIi4vZ2xvYmFsXCIpO1xuZHVtbXkgPSByZXF1aXJlKFwiLi9nbG9iYWxcIik7XG52YXIgY29udGV4dG1lbnUgPSByZXF1aXJlKFwiLi9jb250ZXh0bWVudVwiKTtcbmR1bW15ID0gcmVxdWlyZShcIi4vY29udGV4dG1lbnVcIik7XG52YXIgYmluZGluZ3MgPSByZXF1aXJlKFwiLi9iaW5kaW5nc1wiKTtcbmR1bW15ID0gcmVxdWlyZShcIi4vYmluZGluZ3NcIik7XG52YXIgdW5kbyA9IHJlcXVpcmUoXCIuL3VuZG9cIik7XG5kdW1teSA9IHJlcXVpcmUoXCIuL3VuZG9cIik7XG52YXIgc2VsZWN0aW9uID0gcmVxdWlyZShcIi4vc2VsZWN0aW9uXCIpO1xuZHVtbXkgPSByZXF1aXJlKFwiLi9zZWxlY3Rpb25cIik7XG52YXIgZWRpdCA9IHJlcXVpcmUoXCIuL3N0cnVjLWVkaXRcIik7XG5kdW1teSA9IHJlcXVpcmUoXCIuL3N0cnVjLWVkaXRcIik7XG52YXIgbWV0YWRhdGFFZGl0b3IgPSByZXF1aXJlKFwiLi9tZXRhZGF0YVwiKTtcbmR1bW15ID0gcmVxdWlyZShcIi4vbWV0YWRhdGEudHNcIik7XG52YXIgZGlhbG9nID0gcmVxdWlyZShcIi4vZGlhbG9nXCIpO1xuZHVtbXkgPSByZXF1aXJlKFwiLi9kaWFsb2dcIik7XG5cbmZ1bmN0aW9uIGtpbGxUZXh0U2VsZWN0aW9uKGUpIHtcbiAgICBpZiAoZGlhbG9nLmlzRGlhbG9nU2hvd2luZygpIHx8ICQoZS50YXJnZXQpLnBhcmVudHMoXCIudG9nZXRoZXJqcywudG9nZXRoZXJqcy1tb2RhbFwiKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHNlbCA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcbiAgICBzZWwucmVtb3ZlQWxsUmFuZ2VzKCk7XG59XG5leHBvcnRzLmtpbGxUZXh0U2VsZWN0aW9uID0ga2lsbFRleHRTZWxlY3Rpb247XG47XG5cbnZhciBrZXlEb3duSG9va3MgPSBbXTtcblxuZnVuY3Rpb24gYWRkS2V5RG93bkhvb2soZm4pIHtcbiAgICBrZXlEb3duSG9va3MucHVzaChmbik7XG59XG5leHBvcnRzLmFkZEtleURvd25Ib29rID0gYWRkS2V5RG93bkhvb2s7XG47XG5cbmZ1bmN0aW9uIGhhbmRsZUtleURvd24oZSkge1xuICAgIGlmICgoZS5jdHJsS2V5ICYmIGUuc2hpZnRLZXkpIHx8IGUubWV0YUtleSB8fCBlLmFsdEtleSkge1xuICAgICAgICAvLyB1bnN1cHBvcnRlZCBtb2RpZmllciBjb21iaW5hdGlvbnNcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChlLmtleUNvZGUgPT09IDE2IHx8IGUua2V5Q29kZSA9PT0gMTcgfHwgZS5rZXlDb2RlID09PSAxOCkge1xuICAgICAgICAvLyBEb24ndCBoYW5kbGUgc2hpZnQsIGN0cmwsIGFuZCBtZXRhIHByZXNzZXNcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICgkKGUudGFyZ2V0KS5wYXJlbnRzKFwiLnRvZ2V0aGVyanMsLnRvZ2V0aGVyanMtbW9kYWxcIikubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBEb24ndCBpbnRlcmZlcmUgd2l0aCBUb2dldGhlckpTIFVJIGVsZW1lbnRzXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICB2YXIgY29tbWFuZE1hcDtcbiAgICBpZiAoZS5jdHJsS2V5KSB7XG4gICAgICAgIGNvbW1hbmRNYXAgPSBiaW5kaW5ncy5jdHJsS2V5TWFwO1xuICAgIH0gZWxzZSBpZiAoZS5zaGlmdEtleSkge1xuICAgICAgICBjb21tYW5kTWFwID0gYmluZGluZ3Muc2hpZnRLZXlNYXA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29tbWFuZE1hcCA9IGJpbmRpbmdzLnJlZ3VsYXJLZXlNYXA7XG4gICAgfVxuICAgIGdsb2JhbHMubGFzdEV2ZW50V2FzTW91c2UgPSBmYWxzZTtcbiAgICBpZiAoIWNvbW1hbmRNYXBbZS5rZXlDb2RlXSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciB0aGVGbiA9IGNvbW1hbmRNYXBbZS5rZXlDb2RlXS5mdW5jO1xuICAgIHZhciB0aGVBcmdzID0gY29tbWFuZE1hcFtlLmtleUNvZGVdLmFyZ3M7XG4gICAgXy5lYWNoKGtleURvd25Ib29rcywgZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIGZuKHtcbiAgICAgICAgICAgIGtleUNvZGU6IGUua2V5Q29kZSxcbiAgICAgICAgICAgIHNoaWZ0OiBlLnNoaWZ0S2V5LFxuICAgICAgICAgICAgY3RybDogZS5jdHJsS2V5XG4gICAgICAgIH0sIHRoZUZuLCB0aGVBcmdzKTtcbiAgICB9KTtcbiAgICB0aGVGbi5hcHBseSh1bmRlZmluZWQsIHRoZUFyZ3MpO1xuICAgIGlmICghdGhlRm4uYXN5bmMpIHtcbiAgICAgICAgdW5kby51bmRvQmFycmllcigpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5leHBvcnRzLmhhbmRsZUtleURvd24gPSBoYW5kbGVLZXlEb3duO1xuO1xuXG52YXIgY2xpY2tIb29rcyA9IFtdO1xuXG5mdW5jdGlvbiBhZGRDbGlja0hvb2soZm4pIHtcbiAgICBjbGlja0hvb2tzLnB1c2goZm4pO1xufVxuZXhwb3J0cy5hZGRDbGlja0hvb2sgPSBhZGRDbGlja0hvb2s7XG5cbmZ1bmN0aW9uIGhhbmRsZU5vZGVDbGljayhlKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBlLnRhcmdldDtcbiAgICBtZXRhZGF0YUVkaXRvci5zYXZlTWV0YWRhdGEoKTtcbiAgICBpZiAoZS5idXR0b24gPT09IDIpIHtcbiAgICAgICAgLy8gcmlnaHRjbGlja1xuICAgICAgICBpZiAoc2VsZWN0aW9uLmNhcmRpbmFsaXR5KCkgPT09IDEpIHtcbiAgICAgICAgICAgIGlmIChzZWxlY3Rpb24uZ2V0KCkgIT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGVkaXQubW92ZU5vZGUoZWxlbWVudCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnRleHRtZW51LnNob3dDb250ZXh0TWVudShlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChzZWxlY3Rpb24uY2FyZGluYWxpdHkoKSA9PT0gMikge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGVkaXQubW92ZU5vZGVzKGVsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29udGV4dG1lbnUuc2hvd0NvbnRleHRNZW51KGUpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gbGVmdGNsaWNrXG4gICAgICAgIGNvbnRleHRtZW51LmhpZGVDb250ZXh0TWVudSgpO1xuICAgICAgICBpZiAoZS5zaGlmdEtleSAmJiBzZWxlY3Rpb24uZ2V0KCkpIHtcbiAgICAgICAgICAgIHNlbGVjdGlvbi5zZWxlY3ROb2RlKGVsZW1lbnQsIHRydWUpO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOyAvLyBPdGhlcndpc2UsIHRoaXMgc2V0cyB0aGUgdGV4dFxuICAgICAgICAgICAgLy8gc2VsZWN0aW9uIGluIHRoZSBicm93c2VyLi4uXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxlY3Rpb24uc2VsZWN0Tm9kZShlbGVtZW50KTtcbiAgICAgICAgICAgIGlmIChlLmN0cmxLZXkpIHtcbiAgICAgICAgICAgICAgICBlZGl0Lm1ha2VOb2RlKFwiWFBcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXy5lYWNoKGNsaWNrSG9va3MsIGZ1bmN0aW9uIChmbikge1xuICAgICAgICBmbihlLmJ1dHRvbik7XG4gICAgfSk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBnbG9iYWxzLmxhc3RFdmVudFdhc01vdXNlID0gdHJ1ZTtcbiAgICB1bmRvLnVuZG9CYXJyaWVyKCk7XG59XG5leHBvcnRzLmhhbmRsZU5vZGVDbGljayA9IGhhbmRsZU5vZGVDbGljaztcbiIsImV4cG9ydHMubGFzdEV2ZW50V2FzTW91c2UgPSBmYWxzZTtcbmV4cG9ydHMubGFzdFNhdmVkU3RhdGUgPSBcIlwiO1xuZXhwb3J0cy5sYWJlbE1hcHBpbmcgPSB7XG4gICAgZGVmYXVsdHM6IHt9LFxuICAgIGRlZmF1bHRTdWJjYXRlZ29yaWVzOiBbXSxcbiAgICBieUxhYmVsOiB7fVxufTtcbiIsIi8vLzxyZWZlcmVuY2UgcGF0aD1cIi4vLi4vLi4vLi4vdHlwZXMvYWxsLmQudHNcIiAvPlxudmFyIGR1bW15O1xuXG52YXIgXyA9IHJlcXVpcmUoXCJsb2Rhc2hcIik7XG5cbnZhciBnbG9iYWxzID0gcmVxdWlyZShcIi4vZ2xvYmFsXCIpO1xuZHVtbXkgPSByZXF1aXJlKFwiLi9nbG9iYWwudHNcIik7XG52YXIgbWV0YWRhdGEgPSByZXF1aXJlKFwiLi9tZXRhZGF0YVwiKTtcbmR1bW15ID0gcmVxdWlyZShcIi4vbWV0YWRhdGEudHNcIik7XG5cbmZ1bmN0aW9uIGlzVmFsaWRTdWJjYXRlZ29yeUZvckNhdGVnb3J5KHN1YmNhdCwgY2F0LCBtYXBwaW5nKSB7XG4gICAgcmV0dXJuIChtYXBwaW5nLmRlZmF1bHRTdWJjYXRlZ29yaWVzLmluZGV4T2Yoc3ViY2F0KSA+PSAwIHx8IG1hcHBpbmcuYnlMYWJlbFtjYXRdLnN1YmNhdGVnb3JpZXMuaW5kZXhPZihzdWJjYXQpID49IDApO1xufVxuXG5mdW5jdGlvbiBtYXRjaE1ldGFkYXRhQWdhaW5zdE9iamVjdChrZXksIHZhbHVlLCBvYmplY3QpIHtcbiAgICBpZiAoIW9iamVjdFtrZXldKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBvYmplY3Rba2V5XSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXR1cm4gb2JqZWN0W2tleV0gPT09IHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gXy5hbGwoXy5mb3JPd24ob2JqZWN0W2tleV0sIGZ1bmN0aW9uICh2LCBrKSB7XG4gICAgICAgIGlmICghdmFsdWVba10pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXhwb3J0cy5tYXRjaE1ldGFkYXRhQWdhaW5zdE9iamVjdChrLCB2YWx1ZVtrXSwgdik7XG4gICAgfSkpO1xufVxuZXhwb3J0cy5tYXRjaE1ldGFkYXRhQWdhaW5zdE9iamVjdCA9IG1hdGNoTWV0YWRhdGFBZ2FpbnN0T2JqZWN0O1xuXG5mdW5jdGlvbiBub2RlTWF0Y2hlc1NwZWMobm9kZSwgc3BlYykge1xuICAgIGlmIChzcGVjLmNhdGVnb3J5KSB7XG4gICAgICAgIGlmIChub2RlLmdldEF0dHJpYnV0ZShcImRhdGEtY2F0ZWdvcnlcIikgIT09IHNwZWMuY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3BlYy5zdWJjYXRlZ29yeSkge1xuICAgICAgICBpZiAobm9kZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLXN1YmNhdGVnb3J5XCIpICE9PSBzcGVjLnN1YmNhdGVnb3J5KSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNwZWMubWV0YWRhdGEpIHtcbiAgICAgICAgdmFyIG1kID0gSlNPTi5wYXJzZShub2RlLmdldEF0dHJpYnV0ZShcImRhdGEtbWV0YWRhdGFcIikpO1xuICAgICAgICB2YXIgcmVzID0gXy5hbGwoXy5mb3JPd24oc3BlYy5tZXRhZGF0YSwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBleHBvcnRzLm1hdGNoTWV0YWRhdGFBZ2FpbnN0T2JqZWN0KGtleSwgdmFsdWUsIG1kKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuZXhwb3J0cy5ub2RlTWF0Y2hlc1NwZWMgPSBub2RlTWF0Y2hlc1NwZWM7XG5cbmZ1bmN0aW9uIGxhYmVsVG9NYXRjaFNwZWMobGFiZWwsIG1hcHBpbmcpIHtcbiAgICB2YXIgcGllY2VzID0gbGFiZWwuc3BsaXQoXCItXCIpO1xuICAgIHZhciByID0ge307XG4gICAgci5jYXRlZ29yeSA9IHBpZWNlcy5zaGlmdCgpO1xuICAgIHZhciBzdWJtYXAgPSBtYXBwaW5nLmJ5TGFiZWxbci5jYXRlZ29yeV0ubWV0YWRhdGFLZXlzO1xuICAgIGlmIChwaWVjZXMubGVuZ3RoID4gMCAmJiBpc1ZhbGlkU3ViY2F0ZWdvcnlGb3JDYXRlZ29yeShwaWVjZXNbMF0sIHIuY2F0ZWdvcnksIG1hcHBpbmcpKSB7XG4gICAgICAgIHIuc3ViY2F0ZWdvcnkgPSBwaWVjZXMuc2hpZnQoKTtcbiAgICB9XG4gICAgaWYgKHBpZWNlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHIubWV0YWRhdGEgPSB7fTtcbiAgICAgICAgXy5lYWNoKHBpZWNlcywgZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIHZhciB4ID0gc3VibWFwW3ZdIHx8IG1hcHBpbmcuZGVmYXVsdHNbdl07XG4gICAgICAgICAgICBpZiAoeCkge1xuICAgICAgICAgICAgICAgIHIubWV0YWRhdGFbeC5rZXldID0geC52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiByO1xufVxuZXhwb3J0cy5sYWJlbFRvTWF0Y2hTcGVjID0gbGFiZWxUb01hdGNoU3BlYztcblxuLypcbnVzZSB0aGUgZGVlcC1kaWZmIHBhY2thZ2Vcbm1ha2Ugc2V0bGFiZWwgdGFrZSB0d28gbGlzdHM6IG9uZSBmb3Igbm9udGVybWluYWxzIGFuZCBvbmUgZm9yIHRlcm1pbmFsc1xuKi9cbmZ1bmN0aW9uIHNldExhYmVsRm9yTm9kZShsYWJlbCwgbm9kZSwgbWFwcGluZywgcmVtb3ZlKSB7XG4gICAgaWYgKHR5cGVvZiBtYXBwaW5nID09PSBcInVuZGVmaW5lZFwiKSB7IG1hcHBpbmcgPSBnbG9iYWxzLmxhYmVsTWFwcGluZzsgfVxuICAgIHZhciBwaWVjZXMgPSBsYWJlbC5zcGxpdChcIi1cIik7XG4gICAgdmFyIGNhdGVnb3J5ID0gcGllY2VzLnNoaWZ0KCk7XG4gICAgbm9kZS5zZXRBdHRyaWJ1dGUoXCJkYXRhLWNhdGVnb3J5XCIsIGNhdGVnb3J5KTtcbiAgICBpZiAocGllY2VzLmxlbmd0aCA+IDAgJiYgaXNWYWxpZFN1YmNhdGVnb3J5Rm9yQ2F0ZWdvcnkocGllY2VzWzBdLCBjYXRlZ29yeSwgbWFwcGluZykpIHtcbiAgICAgICAgaWYgKHJlbW92ZSkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoXCJkYXRhLXN1YmNhdGVnb3J5XCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoXCJkYXRhLXN1YmNhdGVnb3J5XCIsIHBpZWNlc1swXSk7XG4gICAgICAgIH1cbiAgICAgICAgcGllY2VzLnNoaWZ0KCk7XG4gICAgfVxuICAgIGlmIChwaWVjZXMubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgc3VibWFwcGluZyA9IG1hcHBpbmcuYnlMYWJlbFtjYXRlZ29yeV0ubWV0YWRhdGFLZXlzIHx8IHt9O1xuICAgICAgICBfLm1hcChwaWVjZXMsIGZ1bmN0aW9uIChwaWVjZSkge1xuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IHN1Ym1hcHBpbmdbcGllY2VdIHx8IG1hcHBpbmcuZGVmYXVsdHNbcGllY2VdO1xuICAgICAgICAgICAgaWYgKCFhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVtb3ZlKSB7XG4gICAgICAgICAgICAgICAgbWV0YWRhdGEucmVtb3ZlTWV0YWRhdGEobm9kZSwgYWN0aW9uLmtleSwgYWN0aW9uLnZhbHVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWV0YWRhdGEuc2V0TWV0YWRhdGEobm9kZSwgYWN0aW9uLmtleSwgYWN0aW9uLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5zZXRMYWJlbEZvck5vZGUgPSBzZXRMYWJlbEZvck5vZGU7XG4iLCIvLy88cmVmZXJlbmNlIHBhdGg9XCIuLy4uLy4uLy4uL3R5cGVzL2FsbC5kLnRzXCIgLz5cbi8qIHRzbGludDpkaXNhYmxlOnF1b3RlbWFyayAqL1xudmFyIGR1bW15O1xuXG52YXIgJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG52YXIgXyA9IHJlcXVpcmUoXCJsb2Rhc2hcIik7XG5cbnZhciBkaWFsb2cgPSByZXF1aXJlKFwiLi9kaWFsb2dcIik7XG5kdW1teSA9IHJlcXVpcmUoXCIuL2RpYWxvZy50c1wiKTtcbnZhciBzZWxlY3Rpb24gPSByZXF1aXJlKFwiLi9zZWxlY3Rpb25cIik7XG5kdW1teSA9IHJlcXVpcmUoXCIuL3NlbGVjdGlvblwiKTtcblxuZnVuY3Rpb24gc2V0SW5EaWN0KGRpY3QsIGtleSwgdmFsLCByZW1vdmUpIHtcbiAgICBpZiAodHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBpZiAocmVtb3ZlKSB7XG4gICAgICAgICAgICBkZWxldGUgZGljdFtrZXldO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGljdFtrZXldID0gdmFsO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgXy5mb3JPd24odmFsLCBmdW5jdGlvbiAodiwgaykge1xuICAgICAgICAgICAgZGljdFtrZXldID0gc2V0SW5EaWN0KGRpY3Rba2V5XSB8fCB7fSwgaywgdiwgcmVtb3ZlKTtcbiAgICAgICAgICAgIGlmIChfLmlzRW1wdHkoZGljdFtrZXldKSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBkaWN0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gZGljdDtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlTWV0YWRhdGEobm9kZSwga2V5LCB2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwidW5kZWZpbmVkXCIpIHsgdmFsdWUgPSBcIlwiOyB9XG4gICAgdmFyIG1ldGFkYXRhID0gSlNPTi5wYXJzZShub2RlLmdldEF0dHJpYnV0ZShcImRhdGEtbWV0YWRhdGFcIikpIHx8IHt9O1xuICAgIG1ldGFkYXRhID0gc2V0SW5EaWN0KG1ldGFkYXRhLCBrZXksIHZhbHVlLCB0cnVlKTtcbiAgICBpZiAoXy5pc0VtcHR5KG1ldGFkYXRhKSkge1xuICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtbWV0YWRhdGFcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoXCJkYXRhLW1ldGFkYXRhXCIsIEpTT04uc3RyaW5naWZ5KG1ldGFkYXRhKSk7XG4gICAgfVxufVxuZXhwb3J0cy5yZW1vdmVNZXRhZGF0YSA9IHJlbW92ZU1ldGFkYXRhO1xuXG5mdW5jdGlvbiBzZXRNZXRhZGF0YShub2RlLCBrZXksIHZhbHVlKSB7XG4gICAgdmFyIG1ldGFkYXRhID0gSlNPTi5wYXJzZShub2RlLmdldEF0dHJpYnV0ZShcImRhdGEtbWV0YWRhdGFcIikpIHx8IHt9O1xuICAgIG1ldGFkYXRhID0gc2V0SW5EaWN0KG1ldGFkYXRhLCBrZXksIHZhbHVlKTtcbiAgICBub2RlLnNldEF0dHJpYnV0ZShcImRhdGEtbWV0YWRhdGFcIiwgSlNPTi5zdHJpbmdpZnkobWV0YWRhdGEpKTtcbn1cbmV4cG9ydHMuc2V0TWV0YWRhdGEgPSBzZXRNZXRhZGF0YTtcblxuZnVuY3Rpb24gZ2V0TWV0YWRhdGEobm9kZSkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKG5vZGUuZ2V0QXR0cmlidXRlKFwiZGF0YS1tZXRhZGF0YVwiKSkgfHwge307XG59XG5leHBvcnRzLmdldE1ldGFkYXRhID0gZ2V0TWV0YWRhdGE7XG5cbi8qKlxuKiBDb252ZXJ0IGEgSlMgZGlzY3Rpb25hcnkgdG8gYW4gSFRNTCBmb3JtLlxuKlxuKiBGb3IgdGhlIG1ldGFkYXRhIGVkaXRpbmcgY29kZS5cbiogQHByaXZhdGVcbiovXG5mdW5jdGlvbiBkaWN0aW9uYXJ5VG9Gb3JtKGRpY3QsIGxldmVsKSB7XG4gICAgaWYgKCFsZXZlbCkge1xuICAgICAgICBsZXZlbCA9IDA7XG4gICAgfVxuICAgIHZhciByZXMgPSBcIlwiO1xuICAgIGlmIChkaWN0KSB7XG4gICAgICAgIHJlcyA9ICc8dGFibGUgY2xhc3M9XCJtZXRhZGF0YVRhYmxlXCI+PHRoZWFkPjx0cj48dGQ+S2V5PC90ZD4nICsgJzx0ZD5WYWx1ZTwvdGQ+PC90cj48L3RoZWFkPic7XG4gICAgICAgIGZvciAodmFyIGsgaW4gZGljdCkge1xuICAgICAgICAgICAgaWYgKGRpY3QuaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRpY3Rba10gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzICs9ICc8dHIgY2xhc3M9XCJzdHJ2YWxcIiBkYXRhLWxldmVsPVwiJyArIGxldmVsICsgJ1wiPjx0ZCBjbGFzcz1cImtleVwiPicgKyAnPHNwYW4gc3R5bGU9XCJ3aWR0aDpcIicgKyA0ICogbGV2ZWwgKyAncHg7XCI+PC9zcGFuPicgKyBrICsgJzwvdGQ+PHRkIGNsYXNzPVwidmFsXCI+PGlucHV0IGNsYXNzPVwibWV0YWRhdGFGaWVsZFwiICcgKyAndHlwZT1cInRleHRcIiBuYW1lPVwiJyArIGsgKyAnXCIgdmFsdWU9XCInICsgZGljdFtrXSArICdcIiAvPjwvdGQ+PC90cj4nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRpY3Rba10gPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzICs9ICc8dHIgY2xhc3M9XCJ0YWJoZWFkXCI+PHRkIGNvbHNwYW49Mj4nICsgayArICc8L3RkPjwvdHI+JztcbiAgICAgICAgICAgICAgICAgICAgcmVzICs9IGRpY3Rpb25hcnlUb0Zvcm0oZGljdFtrXSwgbGV2ZWwgKyAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVzICs9ICc8L3RhYmxlPic7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbi8qKlxuKiBDb252ZXJ0IGFuIEhUTUwgZm9ybSBpbnRvIGEgSlMgZGljdGlvbmFyeVxuKlxuKiBGb3IgdGhlIG1ldGFkYXRhIGVkaXRpbmcgY29kZVxuKiBAcHJpdmF0ZVxuKi9cbmZ1bmN0aW9uIGZvcm1Ub0RpY3Rpb25hcnkoZm9ybSkge1xuICAgIHZhciBkID0ge30sIGRzdGFjayA9IFtdLCBjdXJsZXZlbCA9IDAsIG5hbWVzdGFjayA9IFtdO1xuICAgIGZvcm0uZmluZChcInRyXCIpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcyhcInN0cnZhbFwiKSkge1xuICAgICAgICAgICAgdmFyIGtleSA9ICQodGhpcykuY2hpbGRyZW4oXCIua2V5XCIpLnRleHQoKTtcbiAgICAgICAgICAgIHZhciB2YWwgPSAkKHRoaXMpLmZpbmQoXCIudmFsPi5tZXRhZGF0YUZpZWxkXCIpLnZhbCgpO1xuICAgICAgICAgICAgZFtrZXldID0gdmFsO1xuICAgICAgICAgICAgaWYgKCQodGhpcykucHJvcChcImRhdGEtbGV2ZWxcIikgPCBjdXJsZXZlbCkge1xuICAgICAgICAgICAgICAgIHZhciBuZXdEaWN0ID0gZHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICAgIHZhciBuZXh0TmFtZSA9IG5hbWVzdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICBuZXdEaWN0W25leHROYW1lXSA9IGQ7XG4gICAgICAgICAgICAgICAgZCA9IG5ld0RpY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoJCh0aGlzKS5oYXNDbGFzcyhcInRhYmhlYWRcIikpIHtcbiAgICAgICAgICAgIG5hbWVzdGFjay5wdXNoKCQodGhpcykudGV4dCgpKTtcbiAgICAgICAgICAgIGN1cmxldmVsID0gJCh0aGlzKS5wcm9wKFwiZGF0YS1sZXZlbFwiKTtcbiAgICAgICAgICAgIGRzdGFjay5wdXNoKGQpO1xuICAgICAgICAgICAgZCA9IHt9O1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKGRzdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBsZW4gPSBkc3RhY2subGVuZ3RoO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbmV3RGljdCA9IGRzdGFjay5wb3AoKTtcbiAgICAgICAgICAgIHZhciBuZXh0TmFtZSA9IG5hbWVzdGFjay5wb3AoKTtcbiAgICAgICAgICAgIG5ld0RpY3RbbmV4dE5hbWVdID0gZDtcbiAgICAgICAgICAgIGQgPSBuZXdEaWN0O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkO1xufVxuXG5mdW5jdGlvbiBzYXZlTWV0YWRhdGEoKSB7XG4gICAgaWYgKCQoXCIjbWV0YWRhdGFcIikuaHRtbCgpICE9PSBcIlwiKSB7XG4gICAgICAgICQoc2VsZWN0aW9uLmdldCgpKS5wcm9wKFwiZGF0YS1tZXRhZGF0YVwiLCBKU09OLnN0cmluZ2lmeShmb3JtVG9EaWN0aW9uYXJ5KCQoXCIjbWV0YWRhdGFcIikpKSk7XG4gICAgfVxufVxuZXhwb3J0cy5zYXZlTWV0YWRhdGEgPSBzYXZlTWV0YWRhdGE7XG5cbmZ1bmN0aW9uIG1ldGFkYXRhS2V5Q2xpY2soZSkge1xuICAgIHZhciBrZXlOb2RlID0gZS50YXJnZXQ7XG4gICAgdmFyIGh0bWwgPSAnTmFtZTogPGlucHV0IHR5cGU9XCJ0ZXh0XCIgJyArICdpZD1cIm1ldGFkYXRhTmV3TmFtZVwiIHZhbHVlPVwiJyArICQoa2V5Tm9kZSkudGV4dCgpICsgJ1wiIC8+PGRpdiBpZD1cImRpYWxvZ0J1dHRvbnNcIj48aW5wdXQgdHlwZT1cImJ1dHRvblwiIHZhbHVlPVwiU2F2ZVwiICcgKyAnaWQ9XCJtZXRhZGF0YUtleVNhdmVcIiAvPjxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgdmFsdWU9XCJEZWxldGVcIiAnICsgJ2lkPVwibWV0YWRhdGFLZXlEZWxldGVcIiAvPjwvZGl2Pic7XG4gICAgZGlhbG9nLnNob3dEaWFsb2dCb3goXCJFZGl0IE1ldGFkYXRhXCIsIGh0bWwpO1xuXG4gICAgLy8gVE9ETzogbWFrZSBmb2N1cyBnbyB0byBlbmQsIG9yIHNlbGVjdCB3aG9sZSB0aGluZz9cbiAgICAkKFwiI21ldGFkYXRhTmV3TmFtZVwiKS5mb2N1cygpO1xuICAgIGZ1bmN0aW9uIHNhdmVNZXRhZGF0YUlubmVyKCkge1xuICAgICAgICAkKGtleU5vZGUpLnRleHQoJChcIiNtZXRhZGF0YU5ld05hbWVcIikudmFsKCkpO1xuICAgICAgICBkaWFsb2cuaGlkZURpYWxvZ0JveCgpO1xuICAgICAgICBleHBvcnRzLnNhdmVNZXRhZGF0YSgpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBkZWxldGVNZXRhZGF0YSgpIHtcbiAgICAgICAgJChrZXlOb2RlKS5wYXJlbnQoKS5yZW1vdmUoKTtcbiAgICAgICAgZGlhbG9nLmhpZGVEaWFsb2dCb3goKTtcbiAgICAgICAgZXhwb3J0cy5zYXZlTWV0YWRhdGEoKTtcbiAgICB9XG4gICAgJChcIiNtZXRhZGF0YUtleVNhdmVcIikuY2xpY2soc2F2ZU1ldGFkYXRhSW5uZXIpO1xuICAgIGRpYWxvZy5zZXRJbnB1dEZpZWxkRW50ZXIoJChcIiNtZXRhZGF0YU5ld05hbWVcIiksIHNhdmVNZXRhZGF0YUlubmVyKTtcbiAgICAkKFwiI21ldGFkYXRhS2V5RGVsZXRlXCIpLmNsaWNrKGRlbGV0ZU1ldGFkYXRhKTtcbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGFkZE1ldGFkYXRhRGlhbG9nKCkge1xuICAgIC8vIFRPRE86IGFsbG93IHNwZWNpZnlpbmcgdmFsdWUgdG9vIGluIGluaXRpYWwgZGlhbG9nP1xuICAgIHZhciBodG1sID0gJ05ldyBOYW1lOiA8aW5wdXQgdHlwZT1cInRleHRcIiBpZD1cIm1ldGFkYXRhTmV3TmFtZVwiIHZhbHVlPVwiTkVXXCIgLz4nICsgJzxkaXYgaWQ9XCJkaWFsb2dCdXR0b25zXCI+PGlucHV0IHR5cGU9XCJidXR0b25cIiBpZD1cImFkZE1ldGFkYXRhXCIgJyArICd2YWx1ZT1cIkFkZFwiIC8+PC9kaXY+JztcbiAgICBkaWFsb2cuc2hvd0RpYWxvZ0JveChcIkFkZCBNZXRhdGF0YVwiLCBodG1sKTtcbiAgICBmdW5jdGlvbiBhZGRNZXRhZGF0YSgpIHtcbiAgICAgICAgdmFyIG9sZE1ldGFkYXRhID0gZm9ybVRvRGljdGlvbmFyeSgkKFwiI21ldGFkYXRhXCIpKTtcbiAgICAgICAgb2xkTWV0YWRhdGFbJChcIiNtZXRhZGF0YU5ld05hbWVcIikudmFsKCldID0gXCJORVdcIjtcbiAgICAgICAgJChzZWxlY3Rpb24uZ2V0KCkpLnByb3AoXCJkYXRhLW1ldGFkYXRhXCIsIEpTT04uc3RyaW5naWZ5KG9sZE1ldGFkYXRhKSk7XG4gICAgICAgIGV4cG9ydHMudXBkYXRlTWV0YWRhdGFFZGl0b3IoKTtcbiAgICAgICAgZGlhbG9nLmhpZGVEaWFsb2dCb3goKTtcbiAgICB9XG4gICAgJChcIiNhZGRNZXRhZGF0YVwiKS5jbGljayhhZGRNZXRhZGF0YSk7XG4gICAgZGlhbG9nLnNldElucHV0RmllbGRFbnRlcigkKFwiI21ldGFkYXRhTmV3TmFtZVwiKSwgYWRkTWV0YWRhdGEpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVNZXRhZGF0YUVkaXRvcigpIHtcbiAgICBpZiAoc2VsZWN0aW9uLmNhcmRpbmFsaXR5KCkgIT09IDEpIHtcbiAgICAgICAgJChcIiNtZXRhZGF0YVwiKS5odG1sKFwiXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBhZGRCdXR0b25IdG1sID0gJzxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJhZGRNZXRhZGF0YUJ1dHRvblwiICcgKyAndmFsdWU9XCJBZGRcIiAvPic7XG4gICAgJChcIiNtZXRhZGF0YVwiKS5odG1sKGRpY3Rpb25hcnlUb0Zvcm0oZXhwb3J0cy5nZXRNZXRhZGF0YShzZWxlY3Rpb24uZ2V0KCkpKSArIGFkZEJ1dHRvbkh0bWwpO1xuICAgICQoXCIjbWV0YWRhdGFcIikuZmluZChcIi5tZXRhZGF0YUZpZWxkXCIpLmNoYW5nZShleHBvcnRzLnNhdmVNZXRhZGF0YSkuZm9jdXNvdXQoZXhwb3J0cy5zYXZlTWV0YWRhdGEpLmtleWRvd24oZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgICAgICQoZS50YXJnZXQpLmJsdXIoKTtcbiAgICAgICAgfVxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICAkKFwiI21ldGFkYXRhXCIpLmZpbmQoXCIua2V5XCIpLmNsaWNrKG1ldGFkYXRhS2V5Q2xpY2spO1xuICAgICQoXCIjYWRkTWV0YWRhdGFCdXR0b25cIikuY2xpY2soYWRkTWV0YWRhdGFEaWFsb2cpO1xufVxuZXhwb3J0cy51cGRhdGVNZXRhZGF0YUVkaXRvciA9IHVwZGF0ZU1ldGFkYXRhRWRpdG9yO1xuIiwiLy8vPHJlZmVyZW5jZSBwYXRoPVwiLi8uLi8uLi8uLi90eXBlcy9hbGwuZC50c1wiIC8+XG4vKiB0c2xpbnQ6ZGlzYWJsZTpxdW90ZW1hcmsgKi9cbnZhciBkdW1teTtcblxudmFyICQgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xudmFyIF8gPSByZXF1aXJlKFwibG9kYXNoXCIpO1xuXG52YXIgZGlhbG9nID0gcmVxdWlyZShcIi4vZGlhbG9nXCIpO1xuZHVtbXkgPSByZXF1aXJlKFwiLi9kaWFsb2cudHNcIik7XG52YXIgc2VsZWN0aW9uID0gcmVxdWlyZShcIi4vc2VsZWN0aW9uXCIpO1xuZHVtbXkgPSByZXF1aXJlKFwiLi9zZWxlY3Rpb24udHNcIik7XG5cbmZ1bmN0aW9uIHNldEluRGljdChkaWN0LCBrZXksIHZhbCwgcmVtb3ZlKSB7XG4gICAgaWYgKHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgaWYgKHJlbW92ZSkge1xuICAgICAgICAgICAgZGVsZXRlIGRpY3Rba2V5XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRpY3Rba2V5XSA9IHZhbDtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIF8uZm9yT3duKHZhbCwgZnVuY3Rpb24gKHYsIGspIHtcbiAgICAgICAgICAgIGRpY3Rba2V5XSA9IHNldEluRGljdChkaWN0W2tleV0gfHwge30sIGssIHYsIHJlbW92ZSk7XG4gICAgICAgICAgICBpZiAoXy5pc0VtcHR5KGRpY3Rba2V5XSkpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgZGljdFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGRpY3Q7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZU1ldGFkYXRhKG5vZGUsIGtleSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInVuZGVmaW5lZFwiKSB7IHZhbHVlID0gXCJcIjsgfVxuICAgIHZhciBtZXRhZGF0YSA9IEpTT04ucGFyc2Uobm9kZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLW1ldGFkYXRhXCIpKSB8fCB7fTtcbiAgICBtZXRhZGF0YSA9IHNldEluRGljdChtZXRhZGF0YSwga2V5LCB2YWx1ZSwgdHJ1ZSk7XG4gICAgaWYgKF8uaXNFbXB0eShtZXRhZGF0YSkpIHtcbiAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoXCJkYXRhLW1ldGFkYXRhXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKFwiZGF0YS1tZXRhZGF0YVwiLCBKU09OLnN0cmluZ2lmeShtZXRhZGF0YSkpO1xuICAgIH1cbn1cbmV4cG9ydHMucmVtb3ZlTWV0YWRhdGEgPSByZW1vdmVNZXRhZGF0YTtcblxuZnVuY3Rpb24gc2V0TWV0YWRhdGEobm9kZSwga2V5LCB2YWx1ZSkge1xuICAgIHZhciBtZXRhZGF0YSA9IEpTT04ucGFyc2Uobm9kZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLW1ldGFkYXRhXCIpKSB8fCB7fTtcbiAgICBtZXRhZGF0YSA9IHNldEluRGljdChtZXRhZGF0YSwga2V5LCB2YWx1ZSk7XG4gICAgbm9kZS5zZXRBdHRyaWJ1dGUoXCJkYXRhLW1ldGFkYXRhXCIsIEpTT04uc3RyaW5naWZ5KG1ldGFkYXRhKSk7XG59XG5leHBvcnRzLnNldE1ldGFkYXRhID0gc2V0TWV0YWRhdGE7XG5cbmZ1bmN0aW9uIGdldE1ldGFkYXRhKG5vZGUpIHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShub2RlLmdldEF0dHJpYnV0ZShcImRhdGEtbWV0YWRhdGFcIikpIHx8IHt9O1xufVxuZXhwb3J0cy5nZXRNZXRhZGF0YSA9IGdldE1ldGFkYXRhO1xuXG4vKipcbiogQ29udmVydCBhIEpTIGRpc2N0aW9uYXJ5IHRvIGFuIEhUTUwgZm9ybS5cbipcbiogRm9yIHRoZSBtZXRhZGF0YSBlZGl0aW5nIGNvZGUuXG4qIEBwcml2YXRlXG4qL1xuZnVuY3Rpb24gZGljdGlvbmFyeVRvRm9ybShkaWN0LCBsZXZlbCkge1xuICAgIGlmICghbGV2ZWwpIHtcbiAgICAgICAgbGV2ZWwgPSAwO1xuICAgIH1cbiAgICB2YXIgcmVzID0gXCJcIjtcbiAgICBpZiAoZGljdCkge1xuICAgICAgICByZXMgPSAnPHRhYmxlIGNsYXNzPVwibWV0YWRhdGFUYWJsZVwiPjx0aGVhZD48dHI+PHRkPktleTwvdGQ+JyArICc8dGQ+VmFsdWU8L3RkPjwvdHI+PC90aGVhZD4nO1xuICAgICAgICBmb3IgKHZhciBrIGluIGRpY3QpIHtcbiAgICAgICAgICAgIGlmIChkaWN0Lmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkaWN0W2tdID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcyArPSAnPHRyIGNsYXNzPVwic3RydmFsXCIgZGF0YS1sZXZlbD1cIicgKyBsZXZlbCArICdcIj48dGQgY2xhc3M9XCJrZXlcIj4nICsgJzxzcGFuIHN0eWxlPVwid2lkdGg6XCInICsgNCAqIGxldmVsICsgJ3B4O1wiPjwvc3Bhbj4nICsgayArICc8L3RkPjx0ZCBjbGFzcz1cInZhbFwiPjxpbnB1dCBjbGFzcz1cIm1ldGFkYXRhRmllbGRcIiAnICsgJ3R5cGU9XCJ0ZXh0XCIgbmFtZT1cIicgKyBrICsgJ1wiIHZhbHVlPVwiJyArIGRpY3Rba10gKyAnXCIgLz48L3RkPjwvdHI+JztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBkaWN0W2tdID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcyArPSAnPHRyIGNsYXNzPVwidGFiaGVhZFwiPjx0ZCBjb2xzcGFuPTI+JyArIGsgKyAnPC90ZD48L3RyPic7XG4gICAgICAgICAgICAgICAgICAgIHJlcyArPSBkaWN0aW9uYXJ5VG9Gb3JtKGRpY3Rba10sIGxldmVsICsgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlcyArPSAnPC90YWJsZT4nO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiogQ29udmVydCBhbiBIVE1MIGZvcm0gaW50byBhIEpTIGRpY3Rpb25hcnlcbipcbiogRm9yIHRoZSBtZXRhZGF0YSBlZGl0aW5nIGNvZGVcbiogQHByaXZhdGVcbiovXG5mdW5jdGlvbiBmb3JtVG9EaWN0aW9uYXJ5KGZvcm0pIHtcbiAgICB2YXIgZCA9IHt9LCBkc3RhY2sgPSBbXSwgY3VybGV2ZWwgPSAwLCBuYW1lc3RhY2sgPSBbXTtcbiAgICBmb3JtLmZpbmQoXCJ0clwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCQodGhpcykuaGFzQ2xhc3MoXCJzdHJ2YWxcIikpIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSAkKHRoaXMpLmNoaWxkcmVuKFwiLmtleVwiKS50ZXh0KCk7XG4gICAgICAgICAgICB2YXIgdmFsID0gJCh0aGlzKS5maW5kKFwiLnZhbD4ubWV0YWRhdGFGaWVsZFwiKS52YWwoKTtcbiAgICAgICAgICAgIGRba2V5XSA9IHZhbDtcbiAgICAgICAgICAgIGlmICgkKHRoaXMpLnByb3AoXCJkYXRhLWxldmVsXCIpIDwgY3VybGV2ZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV3RGljdCA9IGRzdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dE5hbWUgPSBuYW1lc3RhY2sucG9wKCk7XG4gICAgICAgICAgICAgICAgbmV3RGljdFtuZXh0TmFtZV0gPSBkO1xuICAgICAgICAgICAgICAgIGQgPSBuZXdEaWN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCQodGhpcykuaGFzQ2xhc3MoXCJ0YWJoZWFkXCIpKSB7XG4gICAgICAgICAgICBuYW1lc3RhY2sucHVzaCgkKHRoaXMpLnRleHQoKSk7XG4gICAgICAgICAgICBjdXJsZXZlbCA9ICQodGhpcykucHJvcChcImRhdGEtbGV2ZWxcIik7XG4gICAgICAgICAgICBkc3RhY2sucHVzaChkKTtcbiAgICAgICAgICAgIGQgPSB7fTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChkc3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgbGVuID0gZHN0YWNrLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgdmFyIG5ld0RpY3QgPSBkc3RhY2sucG9wKCk7XG4gICAgICAgICAgICB2YXIgbmV4dE5hbWUgPSBuYW1lc3RhY2sucG9wKCk7XG4gICAgICAgICAgICBuZXdEaWN0W25leHROYW1lXSA9IGQ7XG4gICAgICAgICAgICBkID0gbmV3RGljdDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZDtcbn1cblxuZnVuY3Rpb24gc2F2ZU1ldGFkYXRhKCkge1xuICAgIGlmICgkKFwiI21ldGFkYXRhXCIpLmh0bWwoKSAhPT0gXCJcIikge1xuICAgICAgICAkKHNlbGVjdGlvbi5nZXQoKSkucHJvcChcImRhdGEtbWV0YWRhdGFcIiwgSlNPTi5zdHJpbmdpZnkoZm9ybVRvRGljdGlvbmFyeSgkKFwiI21ldGFkYXRhXCIpKSkpO1xuICAgIH1cbn1cbmV4cG9ydHMuc2F2ZU1ldGFkYXRhID0gc2F2ZU1ldGFkYXRhO1xuXG5mdW5jdGlvbiBtZXRhZGF0YUtleUNsaWNrKGUpIHtcbiAgICB2YXIga2V5Tm9kZSA9IGUudGFyZ2V0O1xuICAgIHZhciBodG1sID0gJ05hbWU6IDxpbnB1dCB0eXBlPVwidGV4dFwiICcgKyAnaWQ9XCJtZXRhZGF0YU5ld05hbWVcIiB2YWx1ZT1cIicgKyAkKGtleU5vZGUpLnRleHQoKSArICdcIiAvPjxkaXYgaWQ9XCJkaWFsb2dCdXR0b25zXCI+PGlucHV0IHR5cGU9XCJidXR0b25cIiB2YWx1ZT1cIlNhdmVcIiAnICsgJ2lkPVwibWV0YWRhdGFLZXlTYXZlXCIgLz48aW5wdXQgdHlwZT1cImJ1dHRvblwiIHZhbHVlPVwiRGVsZXRlXCIgJyArICdpZD1cIm1ldGFkYXRhS2V5RGVsZXRlXCIgLz48L2Rpdj4nO1xuICAgIGRpYWxvZy5zaG93RGlhbG9nQm94KFwiRWRpdCBNZXRhZGF0YVwiLCBodG1sKTtcblxuICAgIC8vIFRPRE86IG1ha2UgZm9jdXMgZ28gdG8gZW5kLCBvciBzZWxlY3Qgd2hvbGUgdGhpbmc/XG4gICAgJChcIiNtZXRhZGF0YU5ld05hbWVcIikuZm9jdXMoKTtcbiAgICBmdW5jdGlvbiBzYXZlTWV0YWRhdGFJbm5lcigpIHtcbiAgICAgICAgJChrZXlOb2RlKS50ZXh0KCQoXCIjbWV0YWRhdGFOZXdOYW1lXCIpLnZhbCgpKTtcbiAgICAgICAgZGlhbG9nLmhpZGVEaWFsb2dCb3goKTtcbiAgICAgICAgZXhwb3J0cy5zYXZlTWV0YWRhdGEoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGVsZXRlTWV0YWRhdGEoKSB7XG4gICAgICAgICQoa2V5Tm9kZSkucGFyZW50KCkucmVtb3ZlKCk7XG4gICAgICAgIGRpYWxvZy5oaWRlRGlhbG9nQm94KCk7XG4gICAgICAgIGV4cG9ydHMuc2F2ZU1ldGFkYXRhKCk7XG4gICAgfVxuICAgICQoXCIjbWV0YWRhdGFLZXlTYXZlXCIpLmNsaWNrKHNhdmVNZXRhZGF0YUlubmVyKTtcbiAgICBkaWFsb2cuc2V0SW5wdXRGaWVsZEVudGVyKCQoXCIjbWV0YWRhdGFOZXdOYW1lXCIpLCBzYXZlTWV0YWRhdGFJbm5lcik7XG4gICAgJChcIiNtZXRhZGF0YUtleURlbGV0ZVwiKS5jbGljayhkZWxldGVNZXRhZGF0YSk7XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBhZGRNZXRhZGF0YURpYWxvZygpIHtcbiAgICAvLyBUT0RPOiBhbGxvdyBzcGVjaWZ5aW5nIHZhbHVlIHRvbyBpbiBpbml0aWFsIGRpYWxvZz9cbiAgICB2YXIgaHRtbCA9ICdOZXcgTmFtZTogPGlucHV0IHR5cGU9XCJ0ZXh0XCIgaWQ9XCJtZXRhZGF0YU5ld05hbWVcIiB2YWx1ZT1cIk5FV1wiIC8+JyArICc8ZGl2IGlkPVwiZGlhbG9nQnV0dG9uc1wiPjxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJhZGRNZXRhZGF0YVwiICcgKyAndmFsdWU9XCJBZGRcIiAvPjwvZGl2Pic7XG4gICAgZGlhbG9nLnNob3dEaWFsb2dCb3goXCJBZGQgTWV0YXRhdGFcIiwgaHRtbCk7XG4gICAgZnVuY3Rpb24gYWRkTWV0YWRhdGEoKSB7XG4gICAgICAgIHZhciBvbGRNZXRhZGF0YSA9IGZvcm1Ub0RpY3Rpb25hcnkoJChcIiNtZXRhZGF0YVwiKSk7XG4gICAgICAgIG9sZE1ldGFkYXRhWyQoXCIjbWV0YWRhdGFOZXdOYW1lXCIpLnZhbCgpXSA9IFwiTkVXXCI7XG4gICAgICAgICQoc2VsZWN0aW9uLmdldCgpKS5wcm9wKFwiZGF0YS1tZXRhZGF0YVwiLCBKU09OLnN0cmluZ2lmeShvbGRNZXRhZGF0YSkpO1xuICAgICAgICBleHBvcnRzLnVwZGF0ZU1ldGFkYXRhRWRpdG9yKCk7XG4gICAgICAgIGRpYWxvZy5oaWRlRGlhbG9nQm94KCk7XG4gICAgfVxuICAgICQoXCIjYWRkTWV0YWRhdGFcIikuY2xpY2soYWRkTWV0YWRhdGEpO1xuICAgIGRpYWxvZy5zZXRJbnB1dEZpZWxkRW50ZXIoJChcIiNtZXRhZGF0YU5ld05hbWVcIiksIGFkZE1ldGFkYXRhKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlTWV0YWRhdGFFZGl0b3IoKSB7XG4gICAgaWYgKHNlbGVjdGlvbi5jYXJkaW5hbGl0eSgpICE9PSAxKSB7XG4gICAgICAgICQoXCIjbWV0YWRhdGFcIikuaHRtbChcIlwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgYWRkQnV0dG9uSHRtbCA9ICc8aW5wdXQgdHlwZT1cImJ1dHRvblwiIGlkPVwiYWRkTWV0YWRhdGFCdXR0b25cIiAnICsgJ3ZhbHVlPVwiQWRkXCIgLz4nO1xuICAgICQoXCIjbWV0YWRhdGFcIikuaHRtbChkaWN0aW9uYXJ5VG9Gb3JtKGV4cG9ydHMuZ2V0TWV0YWRhdGEoc2VsZWN0aW9uLmdldCgpKSkgKyBhZGRCdXR0b25IdG1sKTtcbiAgICAkKFwiI21ldGFkYXRhXCIpLmZpbmQoXCIubWV0YWRhdGFGaWVsZFwiKS5jaGFuZ2UoZXhwb3J0cy5zYXZlTWV0YWRhdGEpLmZvY3Vzb3V0KGV4cG9ydHMuc2F2ZU1ldGFkYXRhKS5rZXlkb3duKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgICAgICAkKGUudGFyZ2V0KS5ibHVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgJChcIiNtZXRhZGF0YVwiKS5maW5kKFwiLmtleVwiKS5jbGljayhtZXRhZGF0YUtleUNsaWNrKTtcbiAgICAkKFwiI2FkZE1ldGFkYXRhQnV0dG9uXCIpLmNsaWNrKGFkZE1ldGFkYXRhRGlhbG9nKTtcbn1cbmV4cG9ydHMudXBkYXRlTWV0YWRhdGFFZGl0b3IgPSB1cGRhdGVNZXRhZGF0YUVkaXRvcjtcbiIsIi8vLzxyZWZlcmVuY2UgcGF0aD1cIi4vLi4vLi4vLi4vdHlwZXMvYWxsLmQudHNcIiAvPlxuLyogdHNsaW50OmRpc2FibGU6cXVvdGVtYXJrIG5vLXN0cmluZy1saXRlcmFsICovXG52YXIgJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG52YXIgXyA9IHJlcXVpcmUoXCJsb2Rhc2hcIik7XG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciB1bmRvID0gcmVxdWlyZShcIi4vdW5kb1wiKTtcbnZhciBsb2dnZXIgPSByZXF1aXJlKFwiLi4vdWkvbG9nXCIpO1xudmFyIHNlbGVjdGlvbiA9IHJlcXVpcmUoXCIuL3NlbGVjdGlvblwiKTtcbnZhciBldmVudHMgPSByZXF1aXJlKFwiLi9ldmVudHNcIik7XG52YXIgZGlhbG9nID0gcmVxdWlyZShcIi4vZGlhbG9nXCIpO1xudmFyIHN0YXJ0dXAgPSByZXF1aXJlKFwiLi9zdGFydHVwXCIpO1xudmFyIGNvbmYgPSByZXF1aXJlKFwiLi9jb25maWdcIik7XG52YXIgc3RydWNFZGl0ID0gcmVxdWlyZShcIi4vc3RydWMtZWRpdFwiKTtcblxuLy8gKiBFZGl0aW5nIHBhcnRzIG9mIHRoZSB0cmVlXG4vLyBUT0RPOiBkb2N1bWVudCBlbnRyeSBwb2ludHMgYmV0dGVyXG4vLyBET05FKD8pOiBzcGxpdCB0aGVzZSBmbnMgdXAuLi50aGV5IGFyZSBtb25zdGVycy5cbnZhciBjb21tZW50VHlwZUNoZWNrYm94ZXM7XG5cbnN0YXJ0dXAuYWRkU3RhcnR1cEhvb2soZnVuY3Rpb24gc2V0dXBDb21tZW50VHlwZXMoKSB7XG4gICAgdmFyIGNvbW1lbnRUeXBlcyA9IGNvbmYuY29tbWVudFR5cGVzO1xuICAgIGNvbW1lbnRUeXBlQ2hlY2tib3hlcyA9IFwiVHlwZSBvZiBjb21tZW50OiBcIjtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbW1lbnRUeXBlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb21tZW50VHlwZUNoZWNrYm94ZXMgKz0gJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiY29tbWVudFR5cGVcIiB2YWx1ZT1cIicgKyBjb21tZW50VHlwZXNbaV0gKyAnXCIgaWQ9XCJjb21tZW50VHlwZScgKyBjb21tZW50VHlwZXNbaV0gKyAnXCIgLz4gJyArIGNvbW1lbnRUeXBlc1tpXTtcbiAgICB9XG59KTtcblxuZnVuY3Rpb24gZWRpdENvbW1lbnQoKSB7XG4gICAgaWYgKHNlbGVjdGlvbi5jYXJkaW5hbGl0eSgpICE9PSAxKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdW5kby50b3VjaFRyZWUoJChzZWxlY3Rpb24uZ2V0KCkpKTtcbiAgICB2YXIgY29tbWVudFJhdyA9ICQudHJpbSh1dGlscy53bm9kZVN0cmluZyhzZWxlY3Rpb24uZ2V0KCkpKTtcbiAgICB2YXIgY29tbWVudFR5cGUgPSBjb21tZW50UmF3LnNwbGl0KFwiOlwiKVswXTtcblxuICAgIC8vIHJlbW92ZSB0aGUge1xuICAgIGNvbW1lbnRUeXBlID0gY29tbWVudFR5cGUuc3Vic3RyaW5nKDEpO1xuICAgIHZhciBjb21tZW50VGV4dCA9IGNvbW1lbnRSYXcuc3BsaXQoXCI6XCIpWzFdO1xuICAgIGNvbW1lbnRUZXh0ID0gY29tbWVudFRleHQuc3Vic3RyaW5nKDAsIGNvbW1lbnRUZXh0Lmxlbmd0aCAtIDEpO1xuXG4gICAgLy8gcmVnZXggYmVjYXVzZSBzdHJpbmcgZG9lcyBub3QgZ2l2ZSBnbG9iYWwgc2VhcmNoLlxuICAgIGNvbW1lbnRUZXh0ID0gY29tbWVudFRleHQucmVwbGFjZSgvXy9nLCBcIiBcIik7XG4gICAgZGlhbG9nLnNob3dEaWFsb2dCb3goXCJFZGl0IENvbW1lbnRcIiwgJzx0ZXh0YXJlYSBpZD1cImNvbW1lbnRFZGl0Qm94XCI+JyArIGNvbW1lbnRUZXh0ICsgJzwvdGV4dGFyZWE+PGRpdiBpZD1cImNvbW1lbnRUeXBlc1wiPicgKyBjb21tZW50VHlwZUNoZWNrYm94ZXMgKyAnPC9kaXY+PGRpdiBpZD1cImRpYWxvZ0J1dHRvbnNcIj4nICsgJzxpbnB1dCB0eXBlPVwiYnV0dG9uXCInICsgJ2lkPVwiY29tbWVudEVkaXRCdXR0b25cIiB2YWx1ZT1cIlNhdmVcIiAvPjwvZGl2PicpO1xuICAgICQoXCJpbnB1dDpyYWRpb1tuYW1lPWNvbW1lbnRUeXBlXVwiKS52YWwoW2NvbW1lbnRUeXBlXSk7XG4gICAgJChcIiNjb21tZW50RWRpdEJveFwiKS5mb2N1cygpLmdldCgwKS5zZXRTZWxlY3Rpb25SYW5nZShjb21tZW50VGV4dC5sZW5ndGgsIGNvbW1lbnRUZXh0Lmxlbmd0aCk7XG4gICAgZnVuY3Rpb24gZWRpdENvbW1lbnREb25lKGNoYW5nZSkge1xuICAgICAgICBpZiAoY2hhbmdlKSB7XG4gICAgICAgICAgICB2YXIgbmV3VGV4dCA9ICQudHJpbSgkKFwiI2NvbW1lbnRFZGl0Qm94XCIpLnZhbCgpKTtcbiAgICAgICAgICAgIGlmICgvX3xcXG58OnxcXH18XFx7fFxcKHxcXCkvLnRlc3QobmV3VGV4dCkpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPKEFXRSk6IHNsaWNrZXIgd2F5IG9mIGluZGljYXRpbmcgZXJyb3JzLi4uXG4gICAgICAgICAgICAgICAgYWxlcnQoXCJpbGxlZ2FsIGNoYXJhY3RlcnMgaW4gY29tbWVudDogaWxsZWdhbCBjaGFyYWN0ZXJzIGFyZVwiICsgXCIgXywgOiwge30sICgpLCBhbmQgbmV3bGluZVwiKTtcblxuICAgICAgICAgICAgICAgIC8vIGhpZGVEaWFsb2dCb3goKTtcbiAgICAgICAgICAgICAgICAkKFwiI2NvbW1lbnRFZGl0Qm94XCIpLnZhbChuZXdUZXh0KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuZXdUZXh0ID0gbmV3VGV4dC5yZXBsYWNlKC8gL2csIFwiX1wiKTtcbiAgICAgICAgICAgIGNvbW1lbnRUeXBlID0gJChcImlucHV0OnJhZGlvW25hbWU9Y29tbWVudFR5cGVdOmNoZWNrZWRcIikudmFsKCk7XG4gICAgICAgICAgICB1dGlscy5zZXROb2RlTGFiZWwoJChzZWxlY3Rpb24uZ2V0KCkpLmNoaWxkcmVuKFwiLndub2RlXCIpLCBcIntcIiArIGNvbW1lbnRUeXBlICsgXCI6XCIgKyBuZXdUZXh0ICsgXCJ9XCIpO1xuICAgICAgICB9XG4gICAgICAgIGRpYWxvZy5oaWRlRGlhbG9nQm94KCk7XG4gICAgfVxuICAgICQoXCIjY29tbWVudEVkaXRCdXR0b25cIikuY2xpY2soZWRpdENvbW1lbnREb25lKTtcbiAgICAkKFwiI2NvbW1lbnRFZGl0Qm94XCIpLmtleWRvd24oZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgICAgIC8vIHJldHVyblxuICAgICAgICAgICAgZWRpdENvbW1lbnREb25lKHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PT0gMjcpIHtcbiAgICAgICAgICAgIGVkaXRDb21tZW50RG9uZShmYWxzZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuZXhwb3J0cy5lZGl0Q29tbWVudCA9IGVkaXRDb21tZW50O1xuZXhwb3J0cy5lZGl0Q29tbWVudFtcImFzeW5jXCJdID0gdHJ1ZTtcblxuLyoqXG4qIFJldHVybiB0aGUgSlF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBlZGl0b3IgZm9yIGEgbGVhZiBub2RlLlxuKiBAcHJpdmF0ZVxuKi9cbmZ1bmN0aW9uIGxlYWZFZGl0b3JIdG1sKGxhYmVsLCB3b3JkLCBsZW1tYSkge1xuICAgIC8vIFNpbmdsZSBxdW90ZXMgbWVzcyB1cCB0aGUgSFRNTCBjb2RlLlxuICAgIGlmIChsZW1tYSkge1xuICAgICAgICBsZW1tYSA9IGxlbW1hLnJlcGxhY2UoLycvZywgXCImIzM5O1wiKTtcbiAgICB9XG4gICAgd29yZCA9IHdvcmQucmVwbGFjZSgvJy9nLCBcIiYjMzk7XCIpO1xuICAgIGxhYmVsID0gbGFiZWwucmVwbGFjZSgvJy9nLCBcIiYjMzk7XCIpO1xuXG4gICAgdmFyIGVkaXRvckh0bWwgPSBcIjxkaXYgaWQ9J2xlYWZlZGl0b3InIGNsYXNzPSdzbm9kZSc+XCIgKyBcIjxpbnB1dCBpZD0nbGVhZnBocmFzZWJveCcgY2xhc3M9J2xhYmVsZWRpdCcgdHlwZT0ndGV4dCcgdmFsdWU9J1wiICsgbGFiZWwgKyBcIicgLz48aW5wdXQgaWQ9J2xlYWZ0ZXh0Ym94JyBjbGFzcz0nbGFiZWxlZGl0JyB0eXBlPSd0ZXh0JyB2YWx1ZT0nXCIgKyB3b3JkICsgXCInIFwiICsgKCF1dGlscy5pc0VtcHR5KHdvcmQpID8gXCJkaXNhYmxlZD0nZGlzYWJsZWQnXCIgOiBcIlwiKSArIFwiIC8+XCI7XG4gICAgaWYgKGxlbW1hKSB7XG4gICAgICAgIGVkaXRvckh0bWwgKz0gXCI8aW5wdXQgaWQ9J2xlYWZsZW1tYWJveCcgY2xhc3M9J2xhYmVsZWRpdCcgXCIgKyBcInR5cGU9J3RleHQnIHZhbHVlPSdcIiArIGxlbW1hICsgXCInIC8+XCI7XG4gICAgfVxuICAgIGVkaXRvckh0bWwgKz0gXCI8L2Rpdj5cIjtcblxuICAgIHJldHVybiAkKGVkaXRvckh0bWwpO1xufVxuXG4vKipcbiogUmV0dXJuIHRoZSBKUXVlcnkgb2JqZWN0IHdpdGggdGhlIHJlcGxhY2VtZW50IGFmdGVyIGVkaXRpbmcgYSBsZWFmIG5vZGUuXG4qIEBwcml2YXRlXG4qL1xuZnVuY3Rpb24gbGVhZkVkaXRvclJlcGxhY2VtZW50KGxhYmVsLCB3b3JkLCBsZW1tYSkge1xuICAgIGlmIChsZW1tYSkge1xuICAgICAgICBsZW1tYSA9IGxlbW1hLnJlcGxhY2UoLzwvZywgXCImbHQ7XCIpO1xuICAgICAgICBsZW1tYSA9IGxlbW1hLnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpO1xuICAgICAgICBsZW1tYSA9IGxlbW1hLnJlcGxhY2UoLycvZywgXCImIzM5O1wiKTtcbiAgICB9XG5cbiAgICB3b3JkID0gd29yZC5yZXBsYWNlKC88L2csIFwiJmx0O1wiKTtcbiAgICB3b3JkID0gd29yZC5yZXBsYWNlKC8+L2csIFwiJmd0O1wiKTtcbiAgICB3b3JkID0gd29yZC5yZXBsYWNlKC8nL2csIFwiJiMzOTtcIik7XG5cbiAgICAvLyBUT0RPOiB0ZXN0IGZvciBpbGxlZ2FsIGNoYXJzIGluIGxhYmVsXG4gICAgbGFiZWwgPSBsYWJlbC50b1VwcGVyQ2FzZSgpO1xuXG4gICAgdmFyIHJlcGxUZXh0ID0gXCI8ZGl2IGNsYXNzPSdzbm9kZSc+XCIgKyBsYWJlbCArIFwiIDxzcGFuIGNsYXNzPSd3bm9kZSc+XCIgKyB3b3JkO1xuICAgIGlmIChsZW1tYSkge1xuICAgICAgICByZXBsVGV4dCArPSBcIjxzcGFuIGNsYXNzPSdsZW1tYSc+LVwiICsgbGVtbWEgKyBcIjwvc3Bhbj5cIjtcbiAgICB9XG4gICAgcmVwbFRleHQgKz0gXCI8L3NwYW4+PC9kaXY+XCI7XG4gICAgcmV0dXJuICQocmVwbFRleHQpO1xufVxuXG4vKipcbiogRWRpdCB0aGUgc2VsZWN0ZWQgbm9kZVxuKlxuKiBJZiB0aGUgc2VsZWN0ZWQgbm9kZSBpcyBhIHRlcm1pbmFsLCBlZGl0IGl0cyBsYWJlbCwgYW5kIGxlbW1hLiAgVGhlIHRleHQgaXNcbiogYXZhaWxhYmxlIGZvciBlZGl0aW5nIGlmIGl0IGlzIGFuIGVtcHR5IG5vZGUgKHRyYWNlLCBjb21tZW50LCBldGMuKS4gIElmIGFcbiogbm9uLXRlcm1pbmFsLCBlZGl0IHRoZSBub2RlIGxhYmVsLlxuKi9cbmZ1bmN0aW9uIGRpc3BsYXlSZW5hbWUoKSB7XG4gICAgLy8gTGlmdGVkIHNvIHdlIGNhbiBjbG9zZSBvdmVyIGl0IGJlbG93XG4gICAgdmFyIGxhYmVsID0gdXRpbHMuZ2V0TGFiZWwoJChzZWxlY3Rpb24uZ2V0KCkpKTtcblxuICAgIC8vIElubmVyIGZ1bmN0aW9uc1xuICAgIGZ1bmN0aW9uIHNwYWNlKGV2ZW50KSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gKGV2ZW50LnRhcmdldCB8fCBldmVudC5zcmNFbGVtZW50KTtcbiAgICAgICAgJChlbGVtZW50KS52YWwoJChlbGVtZW50KS52YWwoKSk7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBvc3RDaGFuZ2UobmV3Tm9kZSkge1xuICAgICAgICBpZiAobmV3Tm9kZSkge1xuICAgICAgICAgICAgdXRpbHMudXBkYXRlQ3NzQ2xhc3MobmV3Tm9kZSwgbGFiZWwpO1xuICAgICAgICAgICAgc2VsZWN0aW9uLmNsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICBzZWxlY3Rpb24udXBkYXRlU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5Lm9ua2V5ZG93biA9IGV2ZW50cy5oYW5kbGVLZXlEb3duO1xuICAgICAgICAgICAgJChcIiNzbjBcIikubW91c2Vkb3duKGV2ZW50cy5oYW5kbGVOb2RlQ2xpY2spO1xuICAgICAgICAgICAgJChcIiNlZGl0cGFuZVwiKS5tb3VzZWRvd24oc2VsZWN0aW9uLmNsZWFyU2VsZWN0aW9uKTtcbiAgICAgICAgICAgICQoXCIjYnV0dW5kb1wiKS5wcm9wKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAgICAgJChcIiNidXRyZWRvXCIpLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgICAgICAgICAkKFwiI2J1dHNhdmVcIikucHJvcChcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIEJlZ2luIGNvZGVcbiAgICBpZiAoc2VsZWN0aW9uLmNhcmRpbmFsaXR5KCkgIT09IDEpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB1bmRvLnVuZG9CZWdpblRyYW5zYWN0aW9uKCk7XG4gICAgdW5kby50b3VjaFRyZWUoJChzZWxlY3Rpb24uZ2V0KCkpKTtcbiAgICBkb2N1bWVudC5ib2R5Lm9ua2V5ZG93biA9IG51bGw7XG4gICAgJChcIiNzbjBcIikudW5iaW5kKFwibW91c2Vkb3duXCIpO1xuICAgICQoXCIjZWRpdHBhbmVcIikudW5iaW5kKFwibW91c2Vkb3duXCIpO1xuICAgICQoXCIjYnV0dW5kb1wiKS5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG4gICAgJChcIiNidXRyZWRvXCIpLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcbiAgICAkKFwiI2J1dHNhdmVcIikucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuXG4gICAgaWYgKCQoc2VsZWN0aW9uLmdldCgpKS5jaGlsZHJlbihcIi53bm9kZVwiKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIHRoaXMgaXMgYSB0ZXJtaW5hbFxuICAgICAgICB2YXIgd29yZCwgbGVtbWE7XG5cbiAgICAgICAgLy8gaXMgdGhpcyByaWdodD8gd2Ugc3RpbGwgd2FudCB0byBhbGxvdyBlZGl0aW5nIG9mIGluZGV4LCBtYXliZT9cbiAgICAgICAgdmFyIGlzTGVhZk5vZGUgPSB1dGlscy5ndWVzc0xlYWZOb2RlKHNlbGVjdGlvbi5nZXQoKSk7XG4gICAgICAgIGlmICgkKHNlbGVjdGlvbi5nZXQoKSkuY2hpbGRyZW4oXCIud25vZGVcIikuY2hpbGRyZW4oXCIubGVtbWFcIikubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIHByZXdvcmQgPSAkLnRyaW0oJChzZWxlY3Rpb24uZ2V0KCkpLmNoaWxkcmVuKCkuZmlyc3QoKS50ZXh0KCkpLnNwbGl0KFwiLVwiKTtcbiAgICAgICAgICAgIGxlbW1hID0gcHJld29yZC5wb3AoKTtcbiAgICAgICAgICAgIHdvcmQgPSBwcmV3b3JkLmpvaW4oXCItXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd29yZCA9ICQudHJpbSgkKHNlbGVjdGlvbi5nZXQoKSkuY2hpbGRyZW4oKS5maXJzdCgpLnRleHQoKSk7XG4gICAgICAgIH1cblxuICAgICAgICAkKHNlbGVjdGlvbi5nZXQoKSkucmVwbGFjZVdpdGgobGVhZkVkaXRvckh0bWwobGFiZWwsIHdvcmQsIGxlbW1hKSk7XG5cbiAgICAgICAgJChcIiNsZWFmcGhyYXNlYm94LCNsZWFmdGV4dGJveCwjbGVhZmxlbW1hYm94XCIpLmtleWRvd24oZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgcmVwbE5vZGU7XG4gICAgICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMzIpIHtcbiAgICAgICAgICAgICAgICBzcGFjZShldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMjcpIHtcbiAgICAgICAgICAgICAgICByZXBsTm9kZSA9IGxlYWZFZGl0b3JSZXBsYWNlbWVudChsYWJlbCwgd29yZCwgbGVtbWEpO1xuICAgICAgICAgICAgICAgICQoXCIjbGVhZmVkaXRvclwiKS5yZXBsYWNlV2l0aChyZXBsTm9kZSk7XG4gICAgICAgICAgICAgICAgcG9zdENoYW5nZShyZXBsTm9kZSk7XG4gICAgICAgICAgICAgICAgdW5kby51bmRvQWJvcnRUcmFuc2FjdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5ld2xhYmVsID0gJChcIiNsZWFmcGhyYXNlYm94XCIpLnZhbCgpLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgdmFyIG5ld3dvcmQgPSAkKFwiI2xlYWZ0ZXh0Ym94XCIpLnZhbCgpO1xuICAgICAgICAgICAgICAgIHZhciBuZXdsZW1tYTtcbiAgICAgICAgICAgICAgICBpZiAobGVtbWEpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3bGVtbWEgPSAkKFwiI2xlYWZsZW1tYWJveFwiKS52YWwoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNMZWFmTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiByZXN0b3JlXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmICh0eXBlb2YgdGVzdFZhbGlkTGVhZkxhYmVsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoIXRlc3RWYWxpZExlYWZMYWJlbChuZXdsYWJlbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBkaXNwbGF5V2FybmluZyhcIk5vdCBhIHZhbGlkIGxlYWYgbGFiZWw6ICdcIiArXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgbmV3bGFiZWwgKyBcIicuXCIpO1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHJlc3RvcmVcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHR5cGVvZiB0ZXN0VmFsaWRQaHJhc2VMYWJlbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKCF0ZXN0VmFsaWRQaHJhc2VMYWJlbChuZXdsYWJlbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBkaXNwbGF5V2FybmluZyhcIk5vdCBhIHZhbGlkIHBocmFzZSBsYWJlbDogJ1wiICtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICBuZXdsYWJlbCArIFwiJy5cIik7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChuZXd3b3JkICsgbmV3bGVtbWEgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLndhcm5pbmcoXCJDYW5ub3QgY3JlYXRlIGFuIGVtcHR5IGxlYWYuXCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlcGxOb2RlID0gbGVhZkVkaXRvclJlcGxhY2VtZW50KG5ld2xhYmVsLCBuZXd3b3JkLCBuZXdsZW1tYSk7XG4gICAgICAgICAgICAgICAgJChcIiNsZWFmZWRpdG9yXCIpLnJlcGxhY2VXaXRoKHJlcGxOb2RlKTtcbiAgICAgICAgICAgICAgICBwb3N0Q2hhbmdlKHJlcGxOb2RlKTtcbiAgICAgICAgICAgICAgICB1bmRvLnVuZG9FbmRUcmFuc2FjdGlvbigpO1xuICAgICAgICAgICAgICAgIHVuZG8udW5kb0JhcnJpZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSA5KSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSAoZXZlbnQudGFyZ2V0IHx8IGV2ZW50LnNyY0VsZW1lbnQpO1xuICAgICAgICAgICAgICAgIGlmICgkKFwiI2xlYWZwaHJhc2Vib3hcIikuaXMoZWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEkKFwiI2xlYWZ0ZXh0Ym94XCIpLnByb3AoXCJkaXNhYmxlZFwiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJChcIiNsZWFmdGV4dGJveFwiKS5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCQoXCIjbGVhZmxlbW1hYm94XCIpLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJChcIiNsZWFmbGVtbWFib3hcIikuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoJChcIiNsZWFmdGV4dGJveFwiKS5pcyhlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJChcIiNsZWFmbGVtbWFib3hcIikubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKFwiI2xlYWZsZW1tYWJveFwiKS5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgJChcIiNsZWFmcGhyYXNlYm94XCIpLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCQoXCIjbGVhZmxlbW1hYm94XCIpLmlzKGVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgICQoXCIjbGVhZnBocmFzZWJveFwiKS5mb2N1cygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5tb3VzZXVwKGZ1bmN0aW9uIGVkaXRMZWFmQ2xpY2soZSkge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJChcIiNsZWFmcGhyYXNlYm94XCIpLmZvY3VzKCk7XG4gICAgICAgIH0sIDEwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyB0aGlzIGlzIG5vdCBhIHRlcm1pbmFsXG4gICAgICAgIHZhciBlZGl0b3IgPSAkKFwiPGlucHV0IGlkPSdsYWJlbGJveCcgY2xhc3M9J2xhYmVsZWRpdCcgXCIgKyBcInR5cGU9J3RleHQnIHZhbHVlPSdcIiArIGxhYmVsICsgXCInIC8+XCIpO1xuICAgICAgICB2YXIgb3JpZ05vZGUgPSAkKHNlbGVjdGlvbi5nZXQoKSk7XG5cbiAgICAgICAgLy8gdmFyIGlzV29yZExldmVsQ29uaiA9XG4gICAgICAgIC8vICAgICAgICAgb3JpZ05vZGUuY2hpbGRyZW4oXCIuc25vZGVcIikuY2hpbGRyZW4oXCIuc25vZGVcIikuc2l6ZSgpID09PSAwICYmXG4gICAgICAgIC8vICAgICAgICAgLy8gVE9ETzogbWFrZSBjb25maWd1cmFibGVcbiAgICAgICAgLy8gICAgICAgICBvcmlnTm9kZS5jaGlsZHJlbihcIi5DT05KXCIpIC5zaXplKCkgPiAwO1xuICAgICAgICB1dGlscy50ZXh0Tm9kZShvcmlnTm9kZSkucmVwbGFjZVdpdGgoZWRpdG9yKTtcbiAgICAgICAgJChcIiNsYWJlbGJveFwiKS5rZXlkb3duKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDMyKSB7XG4gICAgICAgICAgICAgICAgc3BhY2UoZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDI3KSB7XG4gICAgICAgICAgICAgICAgJChcIiNsYWJlbGJveFwiKS5yZXBsYWNlV2l0aChsYWJlbCArIFwiIFwiKTtcbiAgICAgICAgICAgICAgICBwb3N0Q2hhbmdlKG9yaWdOb2RlKTtcbiAgICAgICAgICAgICAgICB1bmRvLnVuZG9BYm9ydFRyYW5zYWN0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV3cGhyYXNlID0gJChcIiNsYWJlbGJveFwiKS52YWwoKS50b1VwcGVyQ2FzZSgpO1xuXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogcmVzdG9yZVxuICAgICAgICAgICAgICAgIC8vIGlmICh0eXBlb2YgdGVzdFZhbGlkUGhyYXNlTGFiZWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgaWYgKCEodGVzdFZhbGlkUGhyYXNlTGFiZWwobmV3cGhyYXNlKSB8fFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAodHlwZW9mIHRlc3RWYWxpZExlYWZMYWJlbCAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgaXNXb3JkTGV2ZWxDb25qICYmXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICB0ZXN0VmFsaWRMZWFmTGFiZWwobmV3cGhyYXNlKSkpKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBsb2dnZXIud2FybmluZyhcIk5vdCBhIHZhbGlkIHBocmFzZSBsYWJlbDogJ1wiICtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgIG5ld3BocmFzZSArIFwiJy5cIik7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgJChcIiNsYWJlbGJveFwiKS5yZXBsYWNlV2l0aChuZXdwaHJhc2UgKyBcIiBcIik7XG4gICAgICAgICAgICAgICAgcG9zdENoYW5nZShvcmlnTm9kZSk7XG4gICAgICAgICAgICAgICAgdW5kby51bmRvRW5kVHJhbnNhY3Rpb24oKTtcbiAgICAgICAgICAgICAgICB1bmRvLnVuZG9CYXJyaWVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLm1vdXNldXAoZnVuY3Rpb24gZWRpdE5vbkxlYWZDbGljayhlKSB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9KTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKFwiI2xhYmVsYm94XCIpLmZvY3VzKCk7XG4gICAgICAgIH0sIDEwKTtcbiAgICB9XG59XG5leHBvcnRzLmRpc3BsYXlSZW5hbWUgPSBkaXNwbGF5UmVuYW1lO1xuZXhwb3J0cy5kaXNwbGF5UmVuYW1lW1wiYXN5bmNcIl0gPSB0cnVlO1xuXG4vKipcbiogRWRpdCB0aGUgbGVtbWEgb2YgYSB0ZXJtaW5hbCBub2RlLlxuKi9cbmZ1bmN0aW9uIGVkaXRMZW1tYSgpIHtcbiAgICAvLyBJbm5lciBmdW5jdGlvbnNcbiAgICBmdW5jdGlvbiBzcGFjZShldmVudCkge1xuICAgICAgICB2YXIgZWxlbWVudCA9IChldmVudC50YXJnZXQgfHwgZXZlbnQuc3JjRWxlbWVudCk7XG4gICAgICAgICQoZWxlbWVudCkudmFsKCQoZWxlbWVudCkudmFsKCkpO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwb3N0Q2hhbmdlKCkge1xuICAgICAgICBzZWxlY3Rpb24uY2xlYXJTZWxlY3Rpb24oKTtcbiAgICAgICAgc2VsZWN0aW9uLnVwZGF0ZVNlbGVjdGlvbigpO1xuICAgICAgICBkb2N1bWVudC5ib2R5Lm9ua2V5ZG93biA9IGV2ZW50cy5oYW5kbGVLZXlEb3duO1xuICAgICAgICAkKFwiI3NuMFwiKS5tb3VzZWRvd24oZXZlbnRzLmhhbmRsZU5vZGVDbGljayk7XG4gICAgICAgICQoXCIjYnV0dW5kb1wiKS5wcm9wKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAkKFwiI2J1dHJlZG9cIikucHJvcChcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgJChcIiNidXRzYXZlXCIpLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgLy8gQmVnaW4gY29kZVxuICAgIHZhciBjaGlsZExlbW1hdGEgPSAkKHNlbGVjdGlvbi5nZXQoKSkuY2hpbGRyZW4oXCIud25vZGVcIikuY2hpbGRyZW4oXCIubGVtbWFcIik7XG4gICAgaWYgKHNlbGVjdGlvbi5jYXJkaW5hbGl0eSgpICE9PSAxIHx8IGNoaWxkTGVtbWF0YS5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkb2N1bWVudC5ib2R5Lm9ua2V5ZG93biA9IG51bGw7XG4gICAgJChcIiNzbjBcIikudW5iaW5kKFwibW91c2Vkb3duXCIpO1xuICAgIHVuZG8udW5kb0JlZ2luVHJhbnNhY3Rpb24oKTtcbiAgICB1bmRvLnRvdWNoVHJlZSgkKHNlbGVjdGlvbi5nZXQoKSkpO1xuICAgICQoXCIjYnV0dW5kb1wiKS5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG4gICAgJChcIiNidXRyZWRvXCIpLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcbiAgICAkKFwiI2J1dHNhdmVcIikucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuXG4gICAgdmFyIGxlbW1hID0gJChzZWxlY3Rpb24uZ2V0KCkpLmNoaWxkcmVuKFwiLndub2RlXCIpLmNoaWxkcmVuKFwiLmxlbW1hXCIpLnRleHQoKTtcbiAgICBsZW1tYSA9IGxlbW1hLnN1YnN0cmluZygxKTtcbiAgICB2YXIgZWRpdG9yID0gJChcIjxzcGFuIGlkPSdsZWFmZWRpdG9yJyBjbGFzcz0nd25vZGUnPjxpbnB1dCBcIiArIFwiaWQ9J2xlYWZsZW1tYWJveCcgY2xhc3M9J2xhYmVsZWRpdCcgdHlwZT0ndGV4dCcgdmFsdWU9J1wiICsgbGVtbWEgKyBcIicgLz48L3NwYW4+XCIpO1xuICAgICQoc2VsZWN0aW9uLmdldCgpKS5jaGlsZHJlbihcIi53bm9kZVwiKS5jaGlsZHJlbihcIi5sZW1tYVwiKS5yZXBsYWNlV2l0aChlZGl0b3IpO1xuICAgICQoXCIjbGVhZmxlbW1hYm94XCIpLmtleWRvd24oZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSA5KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAzMikge1xuICAgICAgICAgICAgc3BhY2UoZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAyNykge1xuICAgICAgICAgICAgJChcIiNsZWFmZWRpdG9yXCIpLnJlcGxhY2VXaXRoKFwiPHNwYW4gY2xhc3M9J2xlbW1hJz4tXCIgKyBsZW1tYSArIFwiPC9zcGFuPlwiKTtcbiAgICAgICAgICAgIHBvc3RDaGFuZ2UoKTtcbiAgICAgICAgICAgIHVuZG8udW5kb0Fib3J0VHJhbnNhY3Rpb24oKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgICAgIHZhciBuZXdsZW1tYSA9ICQoXCIjbGVhZmxlbW1hYm94XCIpLnZhbCgpO1xuICAgICAgICAgICAgbmV3bGVtbWEgPSBuZXdsZW1tYS5yZXBsYWNlKFwiPFwiLCBcIiZsdDtcIik7XG4gICAgICAgICAgICBuZXdsZW1tYSA9IG5ld2xlbW1hLnJlcGxhY2UoXCI+XCIsIFwiJmd0O1wiKTtcbiAgICAgICAgICAgIG5ld2xlbW1hID0gbmV3bGVtbWEucmVwbGFjZSgvJy9nLCBcIiYjMzk7XCIpO1xuXG4gICAgICAgICAgICAkKFwiI2xlYWZlZGl0b3JcIikucmVwbGFjZVdpdGgoXCI8c3BhbiBjbGFzcz0nbGVtbWEnPi1cIiArIG5ld2xlbW1hICsgXCI8L3NwYW4+XCIpO1xuICAgICAgICAgICAgcG9zdENoYW5nZSgpO1xuICAgICAgICAgICAgdW5kby51bmRvRW5kVHJhbnNhY3Rpb24oKTtcbiAgICAgICAgICAgIHVuZG8udW5kb0JhcnJpZXIoKTtcbiAgICAgICAgfVxuICAgIH0pLm1vdXNldXAoZnVuY3Rpb24gZWRpdExlbW1hQ2xpY2soZSkge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0pO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAkKFwiI2xlYWZsZW1tYWJveFwiKS5mb2N1cygpO1xuICAgIH0sIDEwKTtcbn1cbmV4cG9ydHMuZWRpdExlbW1hID0gZWRpdExlbW1hO1xuZXhwb3J0cy5lZGl0TGVtbWFbXCJhc3luY1wiXSA9IHRydWU7XG5cbi8qKlxuKiBQZXJmb3JtIGFuIGFwcHJvcHJpYXRlIGVkaXRpbmcgb3BlcmF0aW9uIG9uIHRoZSBzZWxlY3RlZCBub2RlLlxuKi9cbmZ1bmN0aW9uIGVkaXROb2RlKCkge1xuICAgIGlmICh1dGlscy5nZXRMYWJlbCgkKHNlbGVjdGlvbi5nZXQoKSkpID09PSBcIkNPREVcIiAmJiBfLmNvbnRhaW5zKGNvbmYuY29tbWVudFR5cGVzLCB1dGlscy53bm9kZVN0cmluZyhzZWxlY3Rpb24uZ2V0KCkpLnN1YnN0cigxKS5zcGxpdChcIjpcIilbMF0pKSB7XG4gICAgICAgIGV4cG9ydHMuZWRpdENvbW1lbnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBleHBvcnRzLmRpc3BsYXlSZW5hbWUoKTtcbiAgICB9XG59XG5leHBvcnRzLmVkaXROb2RlID0gZWRpdE5vZGU7XG5leHBvcnRzLmVkaXROb2RlW1wiYXN5bmNcIl0gPSB0cnVlO1xuXG4vLyAqIFNwbGl0dGluZyB3b3Jkc1xuZnVuY3Rpb24gYWRkTGVtbWEobGVtbWEpIHtcbiAgICAvLyBUT0RPOiBUaGlzIG9ubHkgbWFrZXMgc2Vuc2UgZm9yIGRhc2gtZm9ybWF0IGNvcnBvcmFcbiAgICBpZiAoc2VsZWN0aW9uLmNhcmRpbmFsaXR5KCkgIT09IDEpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXV0aWxzLmlzTGVhZk5vZGUoc2VsZWN0aW9uLmdldCgpKSB8fCB1dGlscy5pc0VtcHR5Tm9kZShzZWxlY3Rpb24uZ2V0KCkpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdW5kby50b3VjaFRyZWUoJChzZWxlY3Rpb24uZ2V0KCkpKTtcbiAgICB2YXIgdGhlTGVtbWEgPSAkKFwiPHNwYW4gY2xhc3M9J2xlbW1hJz4tXCIgKyBsZW1tYSArIFwiPC9zcGFuPlwiKTtcbiAgICAkKHNlbGVjdGlvbi5nZXQoKSkuY2hpbGRyZW4oXCIud25vZGVcIikuYXBwZW5kKHRoZUxlbW1hKTtcbn1cbmV4cG9ydHMuYWRkTGVtbWEgPSBhZGRMZW1tYTtcblxuZnVuY3Rpb24gc3BsaXRXb3JkKCkge1xuICAgIGlmIChzZWxlY3Rpb24uY2FyZGluYWxpdHkoKSAhPT0gMSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghdXRpbHMuaXNMZWFmTm9kZShzZWxlY3Rpb24uZ2V0KCkpIHx8IHV0aWxzLmlzRW1wdHlOb2RlKHNlbGVjdGlvbi5nZXQoKSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB1bmRvLnVuZG9CZWdpblRyYW5zYWN0aW9uKCk7XG4gICAgdW5kby50b3VjaFRyZWUoJChzZWxlY3Rpb24uZ2V0KCkpKTtcbiAgICB2YXIgd29yZFNwbGl0ID0gdXRpbHMud25vZGVTdHJpbmcoc2VsZWN0aW9uLmdldCgpKS5zcGxpdChcIi1cIik7XG4gICAgdmFyIG9yaWdXb3JkID0gd29yZFNwbGl0WzBdO1xuICAgIHZhciBzdGFydHNXaXRoQXQgPSBmYWxzZSwgZW5kc1dpdGhBdCA9IGZhbHNlO1xuICAgIGlmIChvcmlnV29yZFswXSA9PT0gXCJAXCIpIHtcbiAgICAgICAgc3RhcnRzV2l0aEF0ID0gdHJ1ZTtcbiAgICAgICAgb3JpZ1dvcmQgPSBvcmlnV29yZC5zdWJzdHIoMSk7XG4gICAgfVxuICAgIGlmIChvcmlnV29yZC5zdWJzdHIob3JpZ1dvcmQubGVuZ3RoIC0gMSwgMSkgPT09IFwiQFwiKSB7XG4gICAgICAgIGVuZHNXaXRoQXQgPSB0cnVlO1xuICAgICAgICBvcmlnV29yZCA9IG9yaWdXb3JkLnN1YnN0cigwLCBvcmlnV29yZC5sZW5ndGggLSAxKTtcbiAgICB9XG4gICAgdmFyIG9yaWdMZW1tYSA9IFwiWFhYXCI7XG4gICAgaWYgKHdvcmRTcGxpdC5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgb3JpZ0xlbW1hID0gXCJAXCIgKyB3b3JkU3BsaXRbMV0gKyBcIkBcIjtcbiAgICB9XG4gICAgdmFyIG9yaWdMYWJlbCA9IHV0aWxzLmdldExhYmVsKCQoc2VsZWN0aW9uLmdldCgpKSk7XG4gICAgZnVuY3Rpb24gZG9TcGxpdCgpIHtcbiAgICAgICAgdmFyIHdvcmRzID0gJChcIiNzcGxpdFdvcmRJbnB1dFwiKS52YWwoKS5zcGxpdChcIkBcIik7XG4gICAgICAgIGlmICh3b3Jkcy5qb2luKFwiXCIpICE9PSBvcmlnV29yZCkge1xuICAgICAgICAgICAgbG9nZ2VyLndhcm5pbmcoXCJUaGUgdHdvIG5ldyB3b3JkcyBkb24ndCBtYXRjaCB0aGUgb3JpZ2luYWwuICBBYm9ydGluZ1wiKTtcbiAgICAgICAgICAgIHVuZG8udW5kb0Fib3J0VHJhbnNhY3Rpb24oKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAod29yZHMubGVuZ3RoIDwgMCkge1xuICAgICAgICAgICAgbG9nZ2VyLndhcm5pbmcoXCJZb3UgaGF2ZSBub3Qgc3BlY2lmaWVkIHdoZXJlIHRvIHNwbGl0IHRoZSB3b3JkLlwiKTtcbiAgICAgICAgICAgIHVuZG8udW5kb0Fib3J0VHJhbnNhY3Rpb24oKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAod29yZHMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgbG9nZ2VyLndhcm5pbmcoXCJZb3UgY2FuIG9ubHkgc3BsaXQgaW4gb25lIHBsYWNlIGF0IGEgdGltZS5cIik7XG4gICAgICAgICAgICB1bmRvLnVuZG9BYm9ydFRyYW5zYWN0aW9uKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGxhYmVsU3BsaXQgPSBvcmlnTGFiZWwuc3BsaXQoXCIrXCIpO1xuICAgICAgICB2YXIgc2Vjb25kTGFiZWwgPSBcIlhcIjtcbiAgICAgICAgaWYgKGxhYmVsU3BsaXQubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICB1dGlscy5zZXRMZWFmTGFiZWwoJChzZWxlY3Rpb24uZ2V0KCkpLCBsYWJlbFNwbGl0WzBdKTtcbiAgICAgICAgICAgIHNlY29uZExhYmVsID0gbGFiZWxTcGxpdFsxXTtcbiAgICAgICAgfVxuICAgICAgICB1dGlscy5zZXRMZWFmTGFiZWwoJChzZWxlY3Rpb24uZ2V0KCkpLCAoc3RhcnRzV2l0aEF0ID8gXCJAXCIgOiBcIlwiKSArIHdvcmRzWzBdICsgXCJAXCIpO1xuICAgICAgICB2YXIgaGFzTGVtbWEgPSAkKHNlbGVjdGlvbi5nZXQoKSkuZmluZChcIi5sZW1tYVwiKS5sZW5ndGggPiAwO1xuICAgICAgICBzdHJ1Y0VkaXQubWFrZUxlYWYoZmFsc2UsIHNlY29uZExhYmVsLCBcIkBcIiArIHdvcmRzWzFdICsgKGVuZHNXaXRoQXQgPyBcIkBcIiA6IFwiXCIpKTtcbiAgICAgICAgaWYgKGhhc0xlbW1hKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBtb3ZlIHRvIHNvbWV0aGluZyBsaWtlIGZvb0AxIGFuZCBmb29AMiBmb3IgdGhlIHR3byBwaWVjZXNcbiAgICAgICAgICAgIC8vIG9mIHRoZSBsZW1tYXRhXG4gICAgICAgICAgICBleHBvcnRzLmFkZExlbW1hKG9yaWdMZW1tYSk7XG4gICAgICAgIH1cbiAgICAgICAgZGlhbG9nLmhpZGVEaWFsb2dCb3goKTtcbiAgICAgICAgdW5kby51bmRvRW5kVHJhbnNhY3Rpb24oKTtcbiAgICAgICAgdW5kby51bmRvQmFycmllcigpO1xuICAgIH1cbiAgICB2YXIgaHRtbCA9IFwiRW50ZXIgYW4gYXQtc2lnbiBhdCB0aGUgcGxhY2UgdG8gc3BsaXQgdGhlIHdvcmQ6IFxcXG48aW5wdXQgdHlwZT0ndGV4dCcgaWQ9J3NwbGl0V29yZElucHV0JyB2YWx1ZT0nXCIgKyBvcmlnV29yZCArIFwiJyAvPjxkaXYgaWQ9J2RpYWxvZ0J1dHRvbnMnPjxpbnB1dCB0eXBlPSdidXR0b24nIGlkPSdzcGxpdFdvcmRCdXR0b24nXFxcbiB2YWx1ZT0nU3BsaXQnIC8+PC9kaXY+XCI7XG4gICAgZGlhbG9nLnNob3dEaWFsb2dCb3goXCJTcGxpdCB3b3JkXCIsIGh0bWwsIGRvU3BsaXQpO1xuICAgICQoXCIjc3BsaXRXb3JkQnV0dG9uXCIpLmNsaWNrKGRvU3BsaXQpO1xuICAgICQoXCIjc3BsaXRXb3JkSW5wdXRcIikuZm9jdXMoKTtcbn1cbmV4cG9ydHMuc3BsaXRXb3JkID0gc3BsaXRXb3JkO1xuZXhwb3J0cy5zcGxpdFdvcmRbXCJhc3luY1wiXSA9IHRydWU7XG4iLCIvLy88cmVmZXJlbmNlIHBhdGg9XCIuLy4uLy4uLy4uL3R5cGVzL2FsbC5kXCIgLz5cbnZhciAkID0gcmVxdWlyZShcImpxdWVyeVwiKTtcbnZhciBfID0gcmVxdWlyZShcImxvZGFzaFwiKTtcbnZhciBzdGFydHVwID0gcmVxdWlyZShcIi4vc3RhcnR1cFwiKTtcblxuZnVuY3Rpb24gZm9ybWF0U25vZGUoc25vZGUpIHtcbiAgICB2YXIgdGV4dE5vZGUgPSBzbm9kZS5jaGlsZE5vZGVzWzBdO1xuICAgIGlmICh0ZXh0Tm9kZS5ub2RlVHlwZSAhPT0gMykge1xuICAgICAgICB2YXIgbmV3VE4gPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcbiAgICAgICAgc25vZGUuaW5zZXJ0QmVmb3JlKG5ld1ROLCB0ZXh0Tm9kZSk7XG4gICAgICAgIHRleHROb2RlID0gbmV3VE47XG4gICAgfVxuICAgIGlmIChzbm9kZS5ub2RlVHlwZSAhPT0gMSkge1xuICAgICAgICB0aHJvdyBcIlRyaWVkIHRvIGZvcm1hdCBhIG5vbi1zbm9kZS5cIjtcbiAgICB9XG4gICAgdmFyIHNub2RlRWxlbWVudCA9IHNub2RlO1xuICAgIHZhciB0diA9IHNub2RlRWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNhdGVnb3J5XCIpO1xuICAgIGlmIChzbm9kZUVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiZGF0YS1zdWJjYXRlZ29yeVwiKSkge1xuICAgICAgICB0diArPSBcIi1cIiArIHNub2RlRWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXN1YmNhdGVnb3J5XCIpO1xuICAgIH1cbiAgICBpZiAoc25vZGVFbGVtZW50LmdldEF0dHJpYnV0ZShcImRhdGEtaW5kZXhcIikpIHtcbiAgICAgICAgdHYgKz0gc25vZGVFbGVtZW50LmdldEF0dHJpYnV0ZShcImRhdGEtaWR4dHlwZVwiKSA9PT0gXCJnYXBcIiA/IFwiPVwiIDogXCItXCI7XG4gICAgICAgIHR2ICs9IHNub2RlRWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWluZGV4XCIpO1xuICAgIH1cbiAgICB0diArPSBcIiBcIjtcbiAgICB0ZXh0Tm9kZS5ub2RlVmFsdWUgPSB0djtcbn1cblxuZnVuY3Rpb24gc25vZGVDaGFuZ2UocmVjb3Jkcywgb2JzZXJ2ZXIpIHtcbiAgICBfLmVhY2gocmVjb3JkcywgZnVuY3Rpb24gKHJlY29yZCkge1xuICAgICAgICBmb3JtYXRTbm9kZShyZWNvcmQudGFyZ2V0KTtcbiAgICB9KTtcbn1cblxudmFyIHNub2RlTU8gPSBuZXcgTXV0YXRpb25PYnNlcnZlcihzbm9kZUNoYW5nZSk7XG5cbnN0YXJ0dXAuYWRkU3RhcnR1cEhvb2soZnVuY3Rpb24gKCkge1xuICAgICQoXCIuc25vZGVcIikuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmlkID09PSBcInNuMFwiKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZm9ybWF0U25vZGUodGhpcyk7XG4gICAgICAgIGV4cG9ydHMub2JzZXJ2ZVNub2RlKHRoaXMpO1xuICAgIH0pO1xufSk7XG5cbmZ1bmN0aW9uIG9ic2VydmVTbm9kZShzbm9kZSkge1xuICAgIHNub2RlTU8ub2JzZXJ2ZShzbm9kZSwgeyBhdHRyaWJ1dGVzOiB0cnVlIH0pO1xufVxuZXhwb3J0cy5vYnNlcnZlU25vZGUgPSBvYnNlcnZlU25vZGU7XG4iLCIvLy88cmVmZXJlbmNlIHBhdGg9XCIuLy4uLy4uLy4uL3R5cGVzL2FsbC5kLnRzXCIgLz5cbnZhciBwYXJzZXIgPSByZXF1aXJlKFwiLi4vcGFyc2VcIik7XG52YXIgbG9nZ2VyID0gcmVxdWlyZShcIi4uL3VpL2xvZ1wiKTtcbnZhciBsYXN0U2F2ZWRTdGF0ZSA9IHJlcXVpcmUoXCIuL2dsb2JhbFwiKS5sYXN0U2F2ZWRTdGF0ZTtcbnZhciAkID0gcmVxdWlyZShcImpxdWVyeVwiKTtcbnZhciBRID0gcmVxdWlyZShcInFcIik7XG5cbnZhciBzYXZlSW5Qcm9ncmVzcyA9IGZhbHNlO1xuZXhwb3J0cy5zYXZlRm47XG5cbmZ1bmN0aW9uIHNhdmUoZSwgZXh0cmFBcmdzKSB7XG4gICAgaWYgKCFleHRyYUFyZ3MpIHtcbiAgICAgICAgZXh0cmFBcmdzID0ge307XG4gICAgfVxuICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxlYWZwaHJhc2Vib3hcIikgfHwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsYWJlbGJveFwiKSkge1xuICAgICAgICAvLyBJdCBzaG91bGQgYmUgaW1wb3NzaWJsZSB0byB0cmlnZ2VyIGEgc2F2ZSBpbiB0aGVzZSBjb25kaXRpb25zLCBidXRcbiAgICAgICAgLy8gaXQgY2F1c2VzIGRhdGEgY29ycnVwdGlvbiBpZiB0aGUgc2F2ZSBoYXBwZW5zLCwgc28gdGhpcyBmdW5jdGlvbnNcbiAgICAgICAgLy8gYXMgYSBsYXN0LWRpdGNoIHNhZmV0eS5cbiAgICAgICAgbG9nZ2VyLmVycm9yKFwiQ2Fubm90IHNhdmUgd2hpbGUgZWRpdGluZyBhIG5vZGUgbGFiZWwuXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghc2F2ZUluUHJvZ3Jlc3MpIHtcbiAgICAgICAgbG9nZ2VyLm5vdGljZShcIlNhdmluZy4uLlwiKTtcbiAgICAgICAgc2F2ZUluUHJvZ3Jlc3MgPSB0cnVlO1xuICAgICAgICB2YXIgbHNzID0gJChcIiNlZGl0cGFuZVwiKS5odG1sKCk7XG4gICAgICAgIGV4cG9ydHMuc2F2ZUZuKHBhcnNlci5wYXJzZUh0bWxUb1htbCgkKFwiI3NuMFwiKSkpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbG9nZ2VyLm5vdGljZShcIlNhdmUgc3VjY2Vzc1wiKTtcbiAgICAgICAgICAgIHNhdmVJblByb2dyZXNzID0gZmFsc2U7XG4gICAgICAgICAgICBsYXN0U2F2ZWRTdGF0ZSA9IGxzcztcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKFwiU2F2ZSBlcnJvcjogXCIgKyBlcnIpO1xuICAgICAgICAgICAgc2F2ZUluUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5zYXZlID0gc2F2ZTtcbjtcbiIsIi8vLzxyZWZlcmVuY2UgcGF0aD1cIi4vLi4vLi4vLi4vdHlwZXMvYWxsLmQudHNcIiAvPlxudmFyICQgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xudmFyIHN0YXJ0dXAgPSByZXF1aXJlKFwiLi9zdGFydHVwXCIpO1xudmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgZGlhbG9nID0gcmVxdWlyZShcIi4vZGlhbG9nXCIpO1xudmFyIGxvZ2dlciA9IHJlcXVpcmUoXCIuLi91aS9sb2dcIik7XG5cbi8vIFRPRE86IGFuY2hvciByaWdodCBlbmQgb2Ygc3RyaW5nLCBzbyB0aGF0IE5QIGRvZXMgbm90IG1hdGNoIE5QUiwgb25seSBOUCBvclxuLy8gTlAtWCAoPz8/KVxuLy8gVE9ETzogcHJvZmlsZSB0aGlzIGFuZCBvcHRpbWl6ZSBsaWtlIGNyYXp5LlxuLy8gKiBIVE1MIHN0cmluZ3MgYW5kIG90aGVyIGdsb2JhbHNcbi8qKlxuKiBUaGUgSFRNTCBjb2RlIGZvciBhIHJlZ3VsYXIgc2VhcmNoIG5vZGVcbiogQHByaXZhdGVcbiogQGNvbnN0YW50XG4qL1xuLy8gVE9ETzogbWFrZSB0aGUgcHJlc2VuY2Ugb2YgYSBsZW1tYSBzZWFyY2ggb3B0aW9uIGNvbnRpbmdlbnQgb24gdGhlIHByZXNlbmNlXG4vLyBvZiBsZW1tYXRhIGluIHRoZSBjb3JwdXNcbnZhciBzZWFyY2hub2RlaHRtbCA9IFwiPGRpdiBjbGFzcz0nc2VhcmNobm9kZSc+XCIgKyBcIjxkaXYgY2xhc3M9J3NlYXJjaGFkZGRlbGJ1dHRvbnMnPlwiICsgXCI8aW5wdXQgdHlwZT0nYnV0dG9uJyBjbGFzcz0nc2VhcmNob3Jub2RlYnV0JyBcIiArIFwidmFsdWU9J3wnIC8+XCIgKyBcIjxpbnB1dCB0eXBlPSdidXR0b24nIGNsYXNzPSdzZWFyY2hkZWVwbm9kZWJ1dCcgXCIgKyBcInZhbHVlPSdEJyAvPlwiICsgXCI8aW5wdXQgdHlwZT0nYnV0dG9uJyBjbGFzcz0nc2VhcmNocHJlY25vZGVidXQnIFwiICsgXCJ2YWx1ZT0nPicgLz5cIiArIFwiPGlucHV0IHR5cGU9J2J1dHRvbicgY2xhc3M9J3NlYXJjaGRlbG5vZGVidXQnIFwiICsgXCJ2YWx1ZT0nLScgLz5cIiArIFwiPGlucHV0IHR5cGU9J2J1dHRvbicgY2xhc3M9J3NlYXJjaG5ld25vZGVidXQnIFwiICsgXCJ2YWx1ZT0nKycgLz5cIiArIFwiPC9kaXY+XCIgKyBcIjxzZWxlY3QgY2xhc3M9J3NlYXJjaHR5cGUnPjxvcHRpb24+TGFiZWw8L29wdGlvbj5cIiArIFwiPG9wdGlvbj5UZXh0PC9vcHRpb24+PG9wdGlvbj5MZW1tYTwvb3B0aW9uPjwvc2VsZWN0PjogXCIgKyBcIjxpbnB1dCB0eXBlPSd0ZXh0JyBjbGFzcz0nc2VhcmNodGV4dCcgLz5cIiArIFwiPC9kaXY+XCI7XG5cbi8qKlxuKiBUaGUgSFRNTCBjb2RlIGZvciBhbiBcIm9yXCIgc2VhcmNoIG5vZGVcbiogQHByaXZhdGVcbiogQGNvbnN0YW50XG4qL1xudmFyIHNlYXJjaG9ybm9kZWh0bWwgPSBcIjxkaXYgY2xhc3M9J3NlYXJjaG5vZGUgc2VhcmNob3Jub2RlJz5cIiArIFwiPGRpdiBjbGFzcz0nc2VhcmNoYWRkZGVsYnV0dG9ucyc+XCIgKyBcIjxpbnB1dCB0eXBlPSdidXR0b24nIGNsYXNzPSdzZWFyY2hkZWxub2RlYnV0JyB2YWx1ZT0nLScgLz5cIiArIFwiPC9kaXY+XCIgKyBcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIGNsYXNzPSdzZWFyY2h0eXBlJyB2YWx1ZT0nT3InIC8+T1I8YnIgLz5cIiArIHNlYXJjaG5vZGVodG1sICsgXCI8L2Rpdj5cIjtcblxuLyoqXG4qIFRoZSBIVE1MIGNvZGUgZm9yIGEgXCJkZWVwXCIgc2VhcmNoIG5vZGVcbiogQHByaXZhdGVcbiogQGNvbnN0YW50XG4qL1xudmFyIHNlYXJjaGRlZXBub2RlaHRtbCA9IFwiPGRpdiBjbGFzcz0nc2VhcmNobm9kZSBzZWFyY2hkZWVwbm9kZSc+XCIgKyBcIjxkaXYgY2xhc3M9J3NlYXJjaGFkZGRlbGJ1dHRvbnMnPlwiICsgXCI8aW5wdXQgdHlwZT0nYnV0dG9uJyBjbGFzcz0nc2VhcmNoZGVsbm9kZWJ1dCcgdmFsdWU9Jy0nIC8+XCIgKyBcIjwvZGl2PlwiICsgXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBjbGFzcz0nc2VhcmNodHlwZScgdmFsdWU9J0RlZXAnIC8+Li4uPGJyIC8+XCIgKyBzZWFyY2hub2RlaHRtbCArIFwiPC9kaXY+XCI7XG5cbi8qKlxuKiBUaGUgSFRNTCBjb2RlIGZvciBhIFwicHJlY2VkZXNcIiBzZWFyY2ggbm9kZVxuKiBAcHJpdmF0ZVxuKiBAY29uc3RhbnRcbiovXG52YXIgc2VhcmNocHJlY25vZGVodG1sID0gXCI8ZGl2IGNsYXNzPSdzZWFyY2hub2RlIHNlYXJjaHByZWNub2RlJz5cIiArIFwiPGRpdiBjbGFzcz0nc2VhcmNoYWRkZGVsYnV0dG9ucyc+XCIgKyBcIjxpbnB1dCB0eXBlPSdidXR0b24nIGNsYXNzPSdzZWFyY2hkZWxub2RlYnV0JyB2YWx1ZT0nLScgLz5cIiArIFwiPC9kaXY+XCIgKyBcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIGNsYXNzPSdzZWFyY2h0eXBlJyB2YWx1ZT0nUHJlYycgLz4mZ3Q7PGJyIC8+XCIgKyBzZWFyY2hub2RlaHRtbCArIFwiPC9kaXY+XCI7XG5cbi8qKlxuKiBUaGUgSFRNTCBjb2RlIGZvciBhIG5vZGUgdG8gYWRkIG5ldyBzZWFyY2ggbm9kZXNcbiogQHByaXZhdGVcbiogQGNvbnN0YW50XG4qL1xudmFyIGFkZHNlYXJjaG5vZGVodG1sID0gXCI8ZGl2IGNsYXNzPSduZXdzZWFyY2hub2RlJz5cIiArIFwiPGlucHV0IHR5cGU9J2hpZGRlbicgY2xhc3M9J3NlYXJjaHR5cGUnIHZhbHVlPSdOZXdOb2RlJyAvPitcIiArIFwiPC9kaXY+XCI7XG5cbi8qKlxuKiBUaGUgSFRNTCBjb2RlIGZvciB0aGUgZGVmYXVsdCBzdGFydGluZyBzZWFyY2ggbm9kZVxuKiBAcHJpdmF0ZVxuKiBAY29uc3RhbnRcbiovXG52YXIgc2VhcmNoaHRtbCA9IFwiPGRpdiBpZD0nc2VhcmNobm9kZXMnIGNsYXNzPSdzZWFyY2hub2RlJz48aW5wdXQgdHlwZT0naGlkZGVuJyBcIiArIFwiY2xhc3M9J3NlYXJjaHR5cGUnIHZhbHVlPSdSb290JyAvPlwiICsgc2VhcmNobm9kZWh0bWwgKyBcIjwvZGl2PlwiO1xuXG4vKipcbiogVGhlIGxhc3Qgc2VhcmNoXG4qXG4qIFNvIHRoYXQgaXQgY2FuIGJlIHJlc3RvcmVkIG5leHQgdGltZSB0aGUgZGlhbG9nIGlzIG9wZW5lZC5cbiogQHByaXZhdGVcbiovXG52YXIgc2F2ZWRzZWFyY2ggPSAkKHNlYXJjaGh0bWwpO1xuXG4vLyAqIEhlbHBlciBmdW5jdGlvbnNcbi8qKlxuKiBJbmRpY2F0ZSB0aGF0IGEgbm9kZSBtYXRjaGVzIGEgc2VhcmNoXG4qXG4qIEBwYXJhbSB7Tm9kZX0gbm9kZSB0aGUgbm9kZSB0byBmbGFnXG4qL1xuZnVuY3Rpb24gZmxhZ1NlYXJjaE1hdGNoKG5vZGUpIHtcbiAgICAkKG5vZGUpLmFkZENsYXNzKFwic2VhcmNobWF0Y2hcIik7XG4gICAgJChcIiNtYXRjaGNvbW1hbmRzXCIpLnNob3coKTtcbn1cblxuLyoqXG4qIEhvb2sgdXAgZXZlbnQgaGFuZGxlcnMgYWZ0ZXIgYWRkaW5nIGEgbm9kZSB0byB0aGUgc2VhcmNoIGRpYWxvZ1xuKi9cbmZ1bmN0aW9uIHNlYXJjaE5vZGVQb3N0QWRkKG5vZGUpIHtcbiAgICAkKFwiLnNlYXJjaG5ld25vZGVidXRcIikudW5iaW5kKFwiY2xpY2tcIikuY2xpY2soYWRkU2VhcmNoRGF1Z2h0ZXIpO1xuICAgICQoXCIuc2VhcmNoZGVsbm9kZWJ1dFwiKS51bmJpbmQoXCJjbGlja1wiKS5jbGljayhzZWFyY2hEZWxOb2RlKTtcbiAgICAkKFwiLnNlYXJjaGRlZXBub2RlYnV0XCIpLnVuYmluZChcImNsaWNrXCIpLmNsaWNrKHNlYXJjaERlZXBOb2RlKTtcbiAgICAkKFwiLnNlYXJjaG9ybm9kZWJ1dFwiKS51bmJpbmQoXCJjbGlja1wiKS5jbGljayhzZWFyY2hPck5vZGUpO1xuICAgICQoXCIuc2VhcmNocHJlY25vZGVidXRcIikudW5iaW5kKFwiY2xpY2tcIikuY2xpY2soc2VhcmNoUHJlY05vZGUpO1xuICAgIHJlamlnZ2VyU2VhcmNoU2libGluZ0FkZCgpO1xuICAgIHZhciBub2RlVG9Gb2N1cyA9IChub2RlICYmIG5vZGUuZmluZChcIi5zZWFyY2h0ZXh0XCIpKSB8fCAkKFwiLnNlYXJjaHRleHRcIikuZmlyc3QoKTtcbiAgICBub2RlVG9Gb2N1cy5mb2N1cygpO1xufVxuXG4vKipcbiogUmVjYWxjdWxhdGUgdGhlIHBvc2l0aW9uIG9mIG5vZGVzIHRoYXQgYWRkIHNpYmxpbmdzIGluIHRoZSBzZWFyY2ggZGlhbG9nLlxuKiBAcHJpdmF0ZVxuKi9cbmZ1bmN0aW9uIHJlamlnZ2VyU2VhcmNoU2libGluZ0FkZCgpIHtcbiAgICAkKFwiLm5ld3NlYXJjaG5vZGVcIikucmVtb3ZlKCk7XG4gICAgJChcIi5zZWFyY2hub2RlXCIpLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgICAgICQodGhpcykuY2hpbGRyZW4oXCIuc2VhcmNobm9kZVwiKS5sYXN0KCkuYWZ0ZXIoYWRkc2VhcmNobm9kZWh0bWwpO1xuICAgIH0pO1xuICAgICQoXCIubmV3c2VhcmNobm9kZVwiKS5jbGljayhhZGRTZWFyY2hTaWJsaW5nKTtcbn1cblxuLyoqXG4qIFJlbWVtYmVyIHRoZSBjdXJyZW50bHktZW50ZXJlZCBzZWFyY2gsIGluIG9yZGVyIHRvIHJlc3RvcmUgaXQgc3Vic2VxdWVudGx5LlxuKiBAcHJpdmF0ZVxuKi9cbmZ1bmN0aW9uIHNhdmVTZWFyY2goKSB7XG4gICAgc2F2ZWRzZWFyY2ggPSAkKFwiI3NlYXJjaG5vZGVzXCIpLmNsb25lKCk7XG4gICAgdmFyIHNhdmVkc2VsZWN0cyA9IHNhdmVkc2VhcmNoLmZpbmQoXCJzZWxlY3RcIik7XG4gICAgdmFyIG9yaWdzZWxlY3RzID0gJChcIiNzZWFyY2hub2Rlc1wiKS5maW5kKFwic2VsZWN0XCIpO1xuICAgIHNhdmVkc2VsZWN0cy5tYXAoZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgJCh0aGlzKS52YWwob3JpZ3NlbGVjdHMuZXEoaSkudmFsKCkpO1xuICAgIH0pO1xufVxuXG4vKipcbiogUGVyZm9ybSB0aGUgc2VhcmNoIGFzIGVudGVyZWQgaW4gdGhlIGRpYWxvZ1xuKiBAcHJpdmF0ZVxuKi9cbmZ1bmN0aW9uIGRvU2VhcmNoKCkge1xuICAgIC8vIFRPRE86IG5lZWQgdG8gc2F2ZSB2YWwgb2YgaW5jcmVtZW50YWwgYWNyb3NzIHNlYXJjaGVzXG4gICAgdmFyIHNlYXJjaG5vZGVzID0gJChcIiNzZWFyY2hub2Rlc1wiKTtcbiAgICBzYXZlU2VhcmNoKCk7XG4gICAgZGlhbG9nLmhpZGVEaWFsb2dCb3goKTtcbiAgICB2YXIgc2VhcmNoQ3R4ID0gJChcIi5zbm9kZVwiKTtcbiAgICB2YXIgaW5jcmVtZW50YWwgPSAkKFwiI3NlYXJjaEluY1wiKS5wcm9wKFwiY2hlY2tlZFwiKTtcblxuICAgIGlmIChpbmNyZW1lbnRhbCAmJiAkKFwiLnNlYXJjaG1hdGNoXCIpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGxhc3RNYXRjaFRvcCA9ICQoXCIuc2VhcmNobWF0Y2hcIikubGFzdCgpLm9mZnNldCgpLnRvcDtcbiAgICAgICAgc2VhcmNoQ3R4ID0gc2VhcmNoQ3R4LmZpbHRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBkbyB0aGlzIHdpdGggZmFzdGVyIGRvY3VtZW50IHBvc2l0aW9uIGRvbSBjYWxsXG4gICAgICAgICAgICByZXR1cm4gJCh0aGlzKS5vZmZzZXQoKS50b3AgPiBsYXN0TWF0Y2hUb3A7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNsZWFyU2VhcmNoTWF0Y2hlcygpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWFyY2hDdHgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHJlcyA9IGludGVycHJldFNlYXJjaE5vZGUoc2VhcmNobm9kZXMsIHNlYXJjaEN0eFtpXSk7XG4gICAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgICAgIGZsYWdTZWFyY2hNYXRjaChyZXMpO1xuICAgICAgICAgICAgaWYgKGluY3JlbWVudGFsKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgbmV4dFNlYXJjaE1hdGNoKG51bGwsIHRydWUpO1xuICAgIC8vIFRPRE86IHdoZW4gcmVhY2hpbmcgdGhlIGVuZCBvZiB0aGUgZG9jdW1lbnQgaW4gaW5jcmVtZW50YWwgc2VhcmNoLFxuICAgIC8vIGRvbid0IGRlaGlnaGxpZ2h0IHRoZSBsYXN0IG1hdGNoLCBidXQgcHJpbnQgYSBuaWNlIG1lc3NhZ2VcbiAgICAvLyBUT0RPOiBuZWVkIGEgd2F5IHRvIGdvIGJhY2sgaW4gaW5jcmVtZW50YWwgc2VhcmNoXG59XG5cbi8qKlxuKiBDbGVhciBhbnkgcHJldmlvdXMgc2VhcmNoLCByZXZlcnRpbmcgdGhlIGRpYWxvZyBiYWNrIHRvIGl0cyBkZWZhdWx0IHN0YXRlLlxuKiBAcHJpdmF0ZVxuKi9cbmZ1bmN0aW9uIGNsZWFyU2VhcmNoKCkge1xuICAgIHNhdmVkc2VhcmNoID0gJChzZWFyY2hodG1sKTtcbiAgICAkKFwiI3NlYXJjaG5vZGVzXCIpLnJlcGxhY2VXaXRoKHNhdmVkc2VhcmNoKTtcbiAgICBzZWFyY2hOb2RlUG9zdEFkZCgpO1xufVxuXG4vLyAqIEV2ZW50IGhhbmRsZXJzXG4vKipcbiogQ2xlYXIgdGhlIGhpZ2hsaWdodGluZyBmcm9tIHNlYXJjaCBtYXRjaGVzLlxuKi9cbmZ1bmN0aW9uIGNsZWFyU2VhcmNoTWF0Y2hlcygpIHtcbiAgICAkKFwiLnNlYXJjaG1hdGNoXCIpLnJlbW92ZUNsYXNzKFwic2VhcmNobWF0Y2hcIik7XG4gICAgJChcIiNtYXRjaGNvbW1hbmRzXCIpLmhpZGUoKTtcbn1cblxuLyoqXG4qIFNjcm9sbCBkb3duIHRvIHRoZSBuZXh0IG5vZGUgdGhhdCBtYXRjaGVkIGEgc2VhcmNoLlxuKi9cbmZ1bmN0aW9uIG5leHRTZWFyY2hNYXRjaChlLCBmcm9tU2VhcmNoKSB7XG4gICAgaWYgKCFmcm9tU2VhcmNoKSB7XG4gICAgICAgIGlmICgkKFwiI3NlYXJjaEluY1wiKS5wcm9wKFwiY2hlY2tlZFwiKSkge1xuICAgICAgICAgICAgZG9TZWFyY2goKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1dGlscy5zY3JvbGxUb05leHQoXCIuc2VhcmNobWF0Y2hcIik7XG59XG5cbi8qKlxuKiBBZGQgYSBzaWJsaW5nIHNlYXJjaCBub2RlXG4qIEBwcml2YXRlXG4qL1xuZnVuY3Rpb24gYWRkU2VhcmNoRGF1Z2h0ZXIoZSkge1xuICAgIHZhciBub2RlID0gJChlLnRhcmdldCkucGFyZW50cyhcIi5zZWFyY2hub2RlXCIpLmZpcnN0KCk7XG4gICAgdmFyIG5ld25vZGUgPSAkKHNlYXJjaG5vZGVodG1sKTtcbiAgICBub2RlLmFwcGVuZChuZXdub2RlKTtcbiAgICBzZWFyY2hOb2RlUG9zdEFkZChuZXdub2RlKTtcbn1cblxuLyoqXG4qIEFkZCBhIHNpYmxpbmcgc2VhcmNoIG5vZGVcbiogQHByaXZhdGVcbiovXG5mdW5jdGlvbiBhZGRTZWFyY2hTaWJsaW5nKGUpIHtcbiAgICB2YXIgbm9kZSA9ICQoZS50YXJnZXQpO1xuICAgIHZhciBuZXdub2RlID0gJChzZWFyY2hub2RlaHRtbCk7XG4gICAgbm9kZS5iZWZvcmUobmV3bm9kZSk7XG4gICAgc2VhcmNoTm9kZVBvc3RBZGQobmV3bm9kZSk7XG59XG5cbi8qKlxuKiBEZWxldGUgYSBzZWFyY2ggbm9kZVxuKiBAcHJpdmF0ZVxuKi9cbmZ1bmN0aW9uIHNlYXJjaERlbE5vZGUoZSkge1xuICAgIHZhciBub2RlID0gJChlLnRhcmdldCkucGFyZW50cyhcIi5zZWFyY2hub2RlXCIpLmZpcnN0KCk7XG4gICAgdmFyIHRtcCA9ICQoXCIjc2VhcmNobm9kZXNcIikuY2hpbGRyZW4oXCIuc2VhcmNobm9kZTpub3QoLm5ld3NlYXJjaG5vZGUpXCIpO1xuICAgIGlmICh0bXAubGVuZ3RoID09PSAxICYmIHRtcC5pcyhub2RlKSAmJiBub2RlLmNoaWxkcmVuKFwiLnNlYXJjaG5vZGVcIikubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGxvZ2dlci53YXJuaW5nKFwiQ2Fubm90IHJlbW92ZSBvbmx5IHNlYXJjaCB0ZXJtIVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgY2hpbGQgPSBub2RlLmNoaWxkcmVuKFwiLnNlYXJjaG5vZGVcIikuZmlyc3QoKTtcbiAgICBpZiAoY2hpbGQubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIG5vZGUuY29udGVudHMoKS5maWx0ZXIoXCI6bm90KC5zZWFyY2hub2RlKVwiKS5yZW1vdmUoKTtcbiAgICAgICAgY2hpbGQudW53cmFwKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZS5yZW1vdmUoKTtcbiAgICB9XG4gICAgcmVqaWdnZXJTZWFyY2hTaWJsaW5nQWRkKCk7XG59XG5cbi8qKlxuKiBBZGQgYW4gXCJvclwiIHNlYXJjaCBub2RlXG4qIEBwcml2YXRlXG4qL1xuZnVuY3Rpb24gc2VhcmNoT3JOb2RlKGUpIHtcbiAgICB2YXIgbm9kZSA9ICQoZS50YXJnZXQpLnBhcmVudHMoXCIuc2VhcmNobm9kZVwiKS5maXJzdCgpO1xuICAgIHZhciBuZXdub2RlID0gJChzZWFyY2hvcm5vZGVodG1sKTtcbiAgICBub2RlLnJlcGxhY2VXaXRoKG5ld25vZGUpO1xuICAgIG5ld25vZGUuY2hpbGRyZW4oXCIuc2VhcmNobm9kZVwiKS5yZXBsYWNlV2l0aChub2RlKTtcbiAgICBzZWFyY2hOb2RlUG9zdEFkZChuZXdub2RlKTtcbn1cblxuLyoqXG4qIEFkZCBhIFwiZGVlcFwiIHNlYXJjaCBub2RlXG4qIEBwcml2YXRlXG4qL1xuZnVuY3Rpb24gc2VhcmNoRGVlcE5vZGUoZSkge1xuICAgIHZhciBub2RlID0gJChlLnRhcmdldCkucGFyZW50cyhcIi5zZWFyY2hub2RlXCIpLmZpcnN0KCk7XG4gICAgdmFyIG5ld25vZGUgPSAkKHNlYXJjaGRlZXBub2RlaHRtbCk7XG4gICAgbm9kZS5hcHBlbmQobmV3bm9kZSk7XG4gICAgc2VhcmNoTm9kZVBvc3RBZGQobmV3bm9kZSk7XG59XG5cbi8qKlxuKiBBZGQgYSBcInByZWNlZGVzXCIgc2VhcmNoIG5vZGVcbiogQHByaXZhdGVcbiovXG5mdW5jdGlvbiBzZWFyY2hQcmVjTm9kZShlKSB7XG4gICAgdmFyIG5vZGUgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKFwiLnNlYXJjaG5vZGVcIikuZmlyc3QoKTtcbiAgICB2YXIgbmV3bm9kZSA9ICQoc2VhcmNocHJlY25vZGVodG1sKTtcbiAgICBub2RlLmFmdGVyKG5ld25vZGUpO1xuICAgIHNlYXJjaE5vZGVQb3N0QWRkKG5ld25vZGUpO1xufVxuXG4vLyAqIFNlYXJjaCBpbnRlcnByZXRhdGlvbiBmdW5jdGlvblxuLyoqXG4qIEludGVycHJldCB0aGUgRE9NIG5vZGVzIGNvbXByaXNpbmcgdGhlIHNlYXJjaCBkaWFsb2cuXG4qXG4qIFRoaXMgZnVuY3Rpb24gaXMgdHJlcG9uc2libGUgZm9yIHRyYW5zZm9ybWluZyB0aGUgcmVwcmVzZW50YXRpb24gb2YgYVxuKiBzZWFyY2ggcXVlcnkgYXMgSFRNTCBpbnRvIGFuIGV4ZWN1dGFibGUgcXVlcnksIGFuZCBtYXRjaGluZyBpdCBhZ2FpbnN0IGFcbiogbm9kZS5cbiogQHByaXZhdGVcbipcbiogQHBhcmFtIHtOb2RlfSBub2RlIHRoZSBzZWFyY2ggbm9kZSB0byBpbnRlcnByZXRcbiogQHBhcmFtIHtOb2RlfSB0YXJnZXQgdGhlIHRyZWUgbm9kZSB0byBtYXRjaCBpdCBhZ2FpbnN0XG4qIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIHNlYXJjaCBvcHRpb25zXG4qIEByZXR1cm5zIHtOb2RlfSBgdGFyZ2V0YCBpZiBpdCBtYXRjaGVkIHRoZSBxdWVyeSwgb3RoZXJ3aXNlIGB1bmRlZmluZWRgXG4qL1xuZnVuY3Rpb24gaW50ZXJwcmV0U2VhcmNoTm9kZShub2RlLCB0YXJnZXQsIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwidW5kZWZpbmVkXCIpIHsgb3B0aW9ucyA9IHt9OyB9XG4gICAgLy8gVE9ETzogb3B0aW1pemUgdG8gcmVtb3ZlIGpxdWVyeSBjYWxscywgb25seSB1c2UgcmVnZXggbWF0Y2hpbmcgaWYgbmVlZGVkXG4gICAgLy8gVE9ETzogbWFrZSBjYXNlIHNlbnNpdGl2aXR5IGFuIG9wdGlvbj9cbiAgICB2YXIgc2VhcmNodHlwZSA9ICQobm9kZSkuY2hpbGRyZW4oXCIuc2VhcmNodHlwZVwiKS52YWwoKTtcbiAgICB2YXIgcngsIGhhc01hdGNoLCBpLCBqO1xuICAgIHZhciBuZXdUYXJnZXQgPSAkKHRhcmdldCkuY2hpbGRyZW4oKTtcbiAgICB2YXIgY2hpbGRTZWFyY2hlcyA9ICQobm9kZSkuY2hpbGRyZW4oXCIuc2VhcmNobm9kZVwiKTtcblxuICAgIGlmICgkKG5vZGUpLnBhcmVudCgpLmlzKFwiI3NlYXJjaG5vZGVzXCIpICYmICEkKFwiI3NlYXJjaG5vZGVzXCIpLmNoaWxkcmVuKFwiLnNlYXJjaG5vZGVcIikuZmlyc3QoKS5pcyhub2RlKSAmJiAhb3B0aW9ucy5ub3JlY3Vyc2UpIHtcbiAgICAgICAgLy8gc3BlY2lhbCBjYXNlIHNpYmxpbmdzIGF0IHJvb3QgbGV2ZWxcbiAgICAgICAgLy8gV2hhdCBhbiB1Z2x5IGhhY2ssIGNhbiBpdCBiZSBpbXByb3ZlZD9cbiAgICAgICAgbmV3VGFyZ2V0ID0gJCh0YXJnZXQpLnNpYmxpbmdzKCk7XG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBuZXdUYXJnZXQubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChpbnRlcnByZXRTZWFyY2hOb2RlKG5vZGUsIG5ld1RhcmdldFtqXSwgeyBub3JlY3Vyc2U6IHRydWUgfSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHNlYXJjaHR5cGUgPT09IFwiTGFiZWxcIikge1xuICAgICAgICByeCA9IFJlZ0V4cChcIl5cIiArICQobm9kZSkuY2hpbGRyZW4oXCIuc2VhcmNodGV4dFwiKS52YWwoKSwgXCJpXCIpO1xuICAgICAgICBoYXNNYXRjaCA9ICQodGFyZ2V0KS5oYXNDbGFzcyhcInNub2RlXCIpICYmIHJ4LnRlc3QodXRpbHMuZ2V0TGFiZWwoJCh0YXJnZXQpKSk7XG4gICAgICAgIGlmICghaGFzTWF0Y2gpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHNlYXJjaHR5cGUgPT09IFwiVGV4dFwiKSB7XG4gICAgICAgIHJ4ID0gUmVnRXhwKFwiXlwiICsgJChub2RlKS5jaGlsZHJlbihcIi5zZWFyY2h0ZXh0XCIpLnZhbCgpLCBcImlcIik7XG4gICAgICAgIGhhc01hdGNoID0gJCh0YXJnZXQpLmNoaWxkcmVuKFwiLndub2RlXCIpLmxlbmd0aCA9PT0gMSAmJiByeC50ZXN0KHV0aWxzLndub2RlU3RyaW5nKHRhcmdldCkpO1xuICAgICAgICBpZiAoIWhhc01hdGNoKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChzZWFyY2h0eXBlID09PSBcIkxlbW1hXCIpIHtcbiAgICAgICAgcnggPSBSZWdFeHAoXCJeXCIgKyAkKG5vZGUpLmNoaWxkcmVuKFwiLnNlYXJjaHRleHRcIikudmFsKCksIFwiaVwiKTtcbiAgICAgICAgaGFzTWF0Y2ggPSB1dGlscy5oYXNMZW1tYSgkKHRhcmdldCkpICYmIHJ4LnRlc3QodXRpbHMuZ2V0TGVtbWEoJCh0YXJnZXQpKSk7XG4gICAgICAgIGlmICghaGFzTWF0Y2gpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHNlYXJjaHR5cGUgPT09IFwiUm9vdFwiKSB7XG4gICAgICAgIG5ld1RhcmdldCA9ICQodGFyZ2V0KTtcbiAgICB9IGVsc2UgaWYgKHNlYXJjaHR5cGUgPT09IFwiT3JcIikge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2hpbGRTZWFyY2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGludGVycHJldFNlYXJjaE5vZGUoJChjaGlsZFNlYXJjaGVzW2ldKSwgdGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9IGVsc2UgaWYgKHNlYXJjaHR5cGUgPT09IFwiRGVlcFwiKSB7XG4gICAgICAgIG5ld1RhcmdldCA9ICQodGFyZ2V0KS5maW5kKFwiLnNub2RlLC53bm9kZVwiKTtcbiAgICB9IGVsc2UgaWYgKHNlYXJjaHR5cGUgPT09IFwiUHJlY1wiKSB7XG4gICAgICAgIG5ld1RhcmdldCA9ICQodGFyZ2V0KS5uZXh0QWxsKCk7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IGNoaWxkU2VhcmNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHN1Y2MgPSBmYWxzZTtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IG5ld1RhcmdldC5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKGludGVycHJldFNlYXJjaE5vZGUoJChjaGlsZFNlYXJjaGVzW2ldKSwgbmV3VGFyZ2V0W2pdKSkge1xuICAgICAgICAgICAgICAgIHN1Y2MgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghc3VjYykge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0YXJnZXQ7XG59XG5cbi8vICogVGhlIGNvcmUgc2VhcmNoIGZ1bmN0aW9uXG4vKipcbiogRGlzcGxheSBhIHNlYXJjaCBkaWFsb2cuXG4qL1xuZnVuY3Rpb24gc2VhcmNoKCkge1xuICAgIHZhciBodG1sID0gXCI8ZGl2IGlkPSdzZWFyY2hub2RlcycgLz5cIiArIFwiPGRpdiBpZD0nZGlhbG9nQnV0dG9ucyc+PGxhYmVsIGZvcj0nc2VhcmNoSW5jJz5JbmNyZW1lbnRhbDogXCIgKyBcIjwvbGFiZWw+PGlucHV0IGlkPSdzZWFyY2hJbmMnIG5hbWU9J3NlYXJjaEluYycgdHlwZT0nY2hlY2tib3gnIC8+XCIgKyBcIjxpbnB1dCBpZD0nY2xlYXJTZWFyY2gnIHR5cGU9J2J1dHRvbicgdmFsdWU9J0NsZWFyJyAvPlwiICsgXCI8aW5wdXQgaWQ9J2RvU2VhcmNoJyB0eXBlPSdidXR0b24nIHZhbHVlPSdTZWFyY2gnIC8+PC9kaXY+XCI7XG4gICAgZGlhbG9nLnNob3dEaWFsb2dCb3goXCJTZWFyY2hcIiwgaHRtbCwgZG9TZWFyY2gsIHNhdmVTZWFyY2gpO1xuICAgICQoXCIjc2VhcmNobm9kZXNcIikucmVwbGFjZVdpdGgoc2F2ZWRzZWFyY2gpO1xuICAgICQoXCIjZG9TZWFyY2hcIikuY2xpY2soZG9TZWFyY2gpO1xuICAgICQoXCIjY2xlYXJTZWFyY2hcIikuY2xpY2soY2xlYXJTZWFyY2gpO1xuICAgIHNlYXJjaE5vZGVQb3N0QWRkKCk7XG59XG5leHBvcnRzLnNlYXJjaCA9IHNlYXJjaDtcblxuLy8gKiBTdGFydHVwIGhvb2tcbnN0YXJ0dXAuYWRkU3RhcnR1cEhvb2soZnVuY3Rpb24gKCkge1xuICAgICQoXCIjYnV0c2VhcmNoXCIpLmNsaWNrKGV4cG9ydHMuc2VhcmNoKTtcbiAgICAkKFwiI2J1dG5leHRtYXRjaFwiKS5jbGljayhuZXh0U2VhcmNoTWF0Y2gpO1xuICAgICQoXCIjYnV0Y2xlYXJtYXRjaFwiKS5jbGljayhjbGVhclNlYXJjaE1hdGNoZXMpO1xuICAgICQoXCIjbWF0Y2hjb21tYW5kc1wiKS5oaWRlKCk7XG59KTtcbiIsIi8vLzxyZWZlcmVuY2UgcGF0aD1cIi4vLi4vLi4vLi4vdHlwZXMvYWxsLmQudHNcIiAvPlxudmFyIGR1bW15O1xuXG52YXIgJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG52YXIgY29udGV4dG1lbnUgPSByZXF1aXJlKFwiLi9jb250ZXh0bWVudVwiKTtcbmR1bW15ID0gcmVxdWlyZShcIi4vY29udGV4dG1lbnUudHNcIik7XG52YXIgbWV0YWRhdGFFZGl0b3IgPSByZXF1aXJlKFwiLi9tZXRhZGF0YVwiKTtcbmR1bW15ID0gcmVxdWlyZShcIi4vbWV0YWRhdGEudHNcIik7XG52YXIgZ2xvYmFscyA9IHJlcXVpcmUoXCIuL2dsb2JhbFwiKTtcbmR1bW15ID0gcmVxdWlyZShcIi4vZ2xvYmFsLnRzXCIpO1xuXG4vKipcbiogVGhpcyB2YXJpYWJsZSBob2xkcyB0aGUgc2VsZWN0ZWQgbm9kZSwgb3IgXCJzdGFydFwiIG5vZGUgaWYgbXVsdGlwbGVcbiogc2VsZWN0aW9uIGlzIGluIGVmZmVjdC4gIE90aGVyd2lzZSB1bmRlZmluZWQuXG4qXG4qIEB0eXBlIEVsZW1lbnRcbiovXG52YXIgc3RhcnRub2RlID0gbnVsbDtcblxuLyoqXG4qIFRoaXMgdmFyaWFibGUgaG9sZHMgdGhlIFwiZW5kXCIgbm9kZSBpZiBtdWx0aXBsZSBzZWxlY3Rpb24gaXMgaW4gZWZmZWN0LlxuKiBPdGhlcndpc2UgdW5kZWZpbmVkLlxuKlxuKiBAdHlwZSBFbGVtZW50XG4qL1xudmFyIGVuZG5vZGUgPSBudWxsO1xuXG5mdW5jdGlvbiB1cGRhdGVTZWxlY3Rpb24oc3VwcHJlc3NSZW1vdGUpIHtcbiAgICAvLyB1cGRhdGUgc2VsZWN0aW9uIGRpc3BsYXlcbiAgICAkKFwiLnNub2Rlc2VsXCIpLnJlbW92ZUNsYXNzKFwic25vZGVzZWxcIik7XG5cbiAgICBpZiAoc3RhcnRub2RlKSB7XG4gICAgICAgICQoc3RhcnRub2RlKS5hZGRDbGFzcyhcInNub2Rlc2VsXCIpO1xuICAgIH1cblxuICAgIGlmIChlbmRub2RlKSB7XG4gICAgICAgICQoZW5kbm9kZSkuYWRkQ2xhc3MoXCJzbm9kZXNlbFwiKTtcbiAgICB9XG5cbiAgICBtZXRhZGF0YUVkaXRvci51cGRhdGVNZXRhZGF0YUVkaXRvcigpO1xuXG4gICAgaWYgKCFzdXBwcmVzc1JlbW90ZSkge1xuICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKFwic2V0X3NlbGVjdGlvblwiLCBbc3RhcnRub2RlLCBlbmRub2RlXSk7XG4gICAgfVxufVxuZXhwb3J0cy51cGRhdGVTZWxlY3Rpb24gPSB1cGRhdGVTZWxlY3Rpb247XG5cbi8qKlxuKiBSZW1vdmUgYW55IHNlbGVjdGlvbiBvZiBub2Rlcy5cbiovXG5mdW5jdGlvbiBjbGVhclNlbGVjdGlvbigpIHtcbiAgICBtZXRhZGF0YUVkaXRvci5zYXZlTWV0YWRhdGEoKTtcbiAgICB3aW5kb3cuZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBzdGFydG5vZGUgPSBlbmRub2RlID0gbnVsbDtcbiAgICBleHBvcnRzLnVwZGF0ZVNlbGVjdGlvbigpO1xuICAgIGNvbnRleHRtZW51LmhpZGVDb250ZXh0TWVudSgpO1xufVxuZXhwb3J0cy5jbGVhclNlbGVjdGlvbiA9IGNsZWFyU2VsZWN0aW9uO1xuXG4vKipcbiogU2VsZWN0IGEgbm9kZSwgYW5kIHVwZGF0ZSB0aGUgR1VJIHRvIHJlZmxlY3QgdGhhdC5cbipcbiogQHBhcmFtIHtOb2RlfSBub2RlIHRoZSBub2RlIHRvIGJlIHNlbGVjdGVkXG4qIEBwYXJhbSB7Qm9vbGVhbn0gZm9yY2UgaWYgdHJ1ZSwgZm9yY2UgdGhpcyBub2RlIHRvIGJlIGEgc2Vjb25kYXJ5XG4qIHNlbGVjdGlvbiwgZXZlbiBpZiBpdCB3b3VsZG4ndCBvdGhlcndpc2UgYmVcbiogQHBhcmFtIHtCb29sZWFufSByZW1vdGUgd2hldGhlciB0aGlzIHJlcXVlc3Qgd2FzIHRyaWdnZXJlZCByZW1vdGVseVxuKi9cbmZ1bmN0aW9uIHNlbGVjdE5vZGUobm9kZSwgZm9yY2UpIHtcbiAgICBpZiAobm9kZSkge1xuICAgICAgICBpZiAoIShub2RlIGluc3RhbmNlb2YgRWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRyeSAge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiZm9vXCIpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic2VsZWN0aW5nIGEgbm9uLW5vZGU6IFwiICsgZS5zdGFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUgPT09IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic24wXCIpKSB7XG4gICAgICAgICAgICBleHBvcnRzLmNsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB3aGlsZSAobm9kZSAmJiAhJChub2RlKS5oYXNDbGFzcyhcInNub2RlXCIpKSB7XG4gICAgICAgICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgIT09IDEpIHtcbiAgICAgICAgICAgICAgICBub2RlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vZGUgPT09IHN0YXJ0bm9kZSkge1xuICAgICAgICAgICAgc3RhcnRub2RlID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChlbmRub2RlKSB7XG4gICAgICAgICAgICAgICAgc3RhcnRub2RlID0gZW5kbm9kZTtcbiAgICAgICAgICAgICAgICBlbmRub2RlID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChzdGFydG5vZGUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHN0YXJ0bm9kZSA9IG5vZGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoc3RhcnRub2RlICYmIChnbG9iYWxzLmxhc3RFdmVudFdhc01vdXNlIHx8IGZvcmNlKSkge1xuICAgICAgICAgICAgICAgIGlmIChub2RlID09PSBlbmRub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGVuZG5vZGUgPSBudWxsO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVuZG5vZGUgPSBub2RlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZW5kbm9kZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgc3RhcnRub2RlID0gbm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBleHBvcnRzLnVwZGF0ZVNlbGVjdGlvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSAge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJmb29cIik7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwidHJpZWQgdG8gc2VsZWN0IHNvbWV0aGluZyBmYWxzZXk6IFwiICsgZS5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLnNlbGVjdE5vZGUgPSBzZWxlY3ROb2RlO1xuXG4vKipcbiogU2Nyb2xsIHRoZSBwYWdlIHNvIHRoYXQgdGhlIGZpcnN0IHNlbGVjdGVkIG5vZGUgaXMgdmlzaWJsZS5cbiovXG5mdW5jdGlvbiBzY3JvbGxUb1Nob3dTZWwoKSB7XG4gICAgZnVuY3Rpb24gaXNUb3BWaXNpYmxlKGVsZW0pIHtcbiAgICAgICAgdmFyIGRvY1ZpZXdUb3AgPSAkKHdpbmRvdykuc2Nyb2xsVG9wKCk7XG4gICAgICAgIHZhciBkb2NWaWV3Qm90dG9tID0gZG9jVmlld1RvcCArICQod2luZG93KS5oZWlnaHQoKTtcbiAgICAgICAgdmFyIGVsZW1Ub3AgPSAkKGVsZW0pLm9mZnNldCgpLnRvcDtcblxuICAgICAgICByZXR1cm4gKChlbGVtVG9wIDw9IGRvY1ZpZXdCb3R0b20pICYmIChlbGVtVG9wID49IGRvY1ZpZXdUb3ApKTtcbiAgICB9XG4gICAgaWYgKCFpc1RvcFZpc2libGUoc3RhcnRub2RlKSkge1xuICAgICAgICB3aW5kb3cuc2Nyb2xsKDAsICQoc3RhcnRub2RlKS5vZmZzZXQoKS50b3AgLSAkKHdpbmRvdykuaGVpZ2h0KCkgKiAwLjI1KTtcbiAgICB9XG59XG5leHBvcnRzLnNjcm9sbFRvU2hvd1NlbCA9IHNjcm9sbFRvU2hvd1NlbDtcbjtcblxuZnVuY3Rpb24gZ2V0KHNlY29uZCkge1xuICAgIGlmIChzZWNvbmQpIHtcbiAgICAgICAgcmV0dXJuIGVuZG5vZGU7XG4gICAgfVxuICAgIHJldHVybiBzdGFydG5vZGU7XG59XG5leHBvcnRzLmdldCA9IGdldDtcblxuZnVuY3Rpb24gc2V0KG5vZGUsIHNlY29uZCkge1xuICAgIGlmIChzZWNvbmQpIHtcbiAgICAgICAgZW5kbm9kZSA9IG5vZGU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3RhcnRub2RlID0gbm9kZTtcbiAgICB9XG59XG5leHBvcnRzLnNldCA9IHNldDtcblxuZnVuY3Rpb24gY2FyZGluYWxpdHkoKSB7XG4gICAgaWYgKHN0YXJ0bm9kZSAmJiBlbmRub2RlKSB7XG4gICAgICAgIHJldHVybiAyO1xuICAgIH0gZWxzZSBpZiAoc3RhcnRub2RlKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbn1cbmV4cG9ydHMuY2FyZGluYWxpdHkgPSBjYXJkaW5hbGl0eTtcblxuZnVuY3Rpb24gY2xlYXIoc2Vjb25kKSB7XG4gICAgaWYgKHNlY29uZCkge1xuICAgICAgICBlbmRub2RlID0gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXJ0bm9kZSA9IHVuZGVmaW5lZDtcbiAgICB9XG59XG5leHBvcnRzLmNsZWFyID0gY2xlYXI7XG4iLCIvLy88cmVmZXJlbmNlIHBhdGg9XCIuLy4uLy4uLy4uL3R5cGVzL2FsbC5kLnRzXCIgLz5cbjtcblxuLyogVGhlc2UgdmFycyBhbmQgZnVuY3Rpb25zIG5lZWQgdG8gYmUgcHV0IGJlZm9yZSB0aGUgcmVxdWlyZXMsIGJlY2F1c2Ugb2ZcbiogY2lyY3VsYXIgZGVwZW5kZW5jeSBpc3N1ZXMuXG4qL1xudmFyIHN0YXJ0dXBIb29rcyA9IFtdLCBzaHV0ZG93bkhvb2tzID0gW10sIHNhdmVkT25LZXlkb3duLCBzYXZlZE9uTW91c2V1cCwgc2F2ZWRPbkJlZm9yZVVubG9hZCwgc2F2ZWRPblVubG9hZCwgc2h1dGRvd25DYWxsYmFjaztcblxuZnVuY3Rpb24gYWRkU3RhcnR1cEhvb2soZm4pIHtcbiAgICBzdGFydHVwSG9va3MucHVzaChmbik7XG59XG5leHBvcnRzLmFkZFN0YXJ0dXBIb29rID0gYWRkU3RhcnR1cEhvb2s7XG5cbmZ1bmN0aW9uIGFkZFNodXRkb3duSG9vayhmbikge1xuICAgIHNodXRkb3duSG9va3MucHVzaChmbik7XG59XG5leHBvcnRzLmFkZFNodXRkb3duSG9vayA9IGFkZFNodXRkb3duSG9vaztcbjtcblxudmFyIGdsb2JhbHMgPSByZXF1aXJlKFwiLi9nbG9iYWxcIik7XG52YXIgbGFzdFNhdmVkU3RhdGUgPSBnbG9iYWxzLmxhc3RTYXZlZFN0YXRlO1xudmFyICQgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xudmFyIF8gPSByZXF1aXJlKFwibG9kYXNoXCIpO1xudmFyIGRpc3BsYXlFcnJvciA9IHJlcXVpcmUoXCIuLi91aS9sb2dcIikuZXJyb3I7XG52YXIgZXZlbnRzID0gcmVxdWlyZShcIi4vZXZlbnRzXCIpO1xudmFyIHNhdmUgPSByZXF1aXJlKFwiLi9zYXZlXCIpO1xudmFyIHVuZG8gPSByZXF1aXJlKFwiLi91bmRvXCIpO1xudmFyIHNlbGVjdGlvbiA9IHJlcXVpcmUoXCIuL3NlbGVjdGlvblwiKTtcbnZhciBjb250ZXh0bWVudSA9IHJlcXVpcmUoXCIuL2NvbnRleHRtZW51XCIpO1xuXG5yZXF1aXJlKFwiLi9lbnRyeS1wb2ludHNcIik7IC8vIFRPRE86IGlzIHRoaXMgbmVjZXNzYXJ5P1xuXG5mdW5jdGlvbiBxdWl0VHJlZURyYXdpbmcoZSwgZm9yY2UpIHtcbiAgICAvLyB1bkF1dG9JZGxlKCk7XG4gICAgaWYgKCFmb3JjZSAmJiAkKFwiI2VkaXRwYW5lXCIpLmh0bWwoKSAhPT0gbGFzdFNhdmVkU3RhdGUpIHtcbiAgICAgICAgZGlzcGxheUVycm9yKFwiQ2Fubm90IGV4aXQsIHVuc2F2ZWQgY2hhbmdlcyBleGlzdC4gIDxhIGhyZWY9JyMnIFwiICsgXCJvbmNsaWNrPSdxdWl0U2VydmVyKG51bGwsIHRydWUpO3JldHVybiBmYWxzZTsnPkZvcmNlPC9hPlwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBkb2N1bWVudC5ib2R5Lm9ua2V5ZG93biA9IHNhdmVkT25LZXlkb3duO1xuICAgICAgICBkb2N1bWVudC5ib2R5Lm9ubW91c2V1cCA9IHNhdmVkT25Nb3VzZXVwO1xuICAgICAgICB3aW5kb3cub251bmxvYWQgPSBzYXZlZE9uVW5sb2FkO1xuICAgICAgICB3aW5kb3cub25iZWZvcmV1bmxvYWQgPSBzYXZlZE9uQmVmb3JlVW5sb2FkO1xuICAgICAgICBfLmVhY2goc2h1dGRvd25Ib29rcywgZnVuY3Rpb24gKGhvb2spIHtcbiAgICAgICAgICAgIGhvb2soKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNodXRkb3duQ2FsbGJhY2soKTtcbiAgICB9XG59XG5leHBvcnRzLnF1aXRUcmVlRHJhd2luZyA9IHF1aXRUcmVlRHJhd2luZztcblxuZnVuY3Rpb24gbmF2aWdhdGlvbldhcm5pbmcoKSB7XG4gICAgaWYgKCQoXCIjZWRpdHBhbmVcIikuaHRtbCgpICE9PSBsYXN0U2F2ZWRTdGF0ZSkge1xuICAgICAgICByZXR1cm4gXCJVbnNhdmVkIGNoYW5nZXMgZXhpc3QsIGFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBsZWF2ZSB0aGUgcGFnZT9cIjtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gYXNzaWduRXZlbnRzKCkge1xuICAgIC8vIFNhdmUgZ2xvYmFsIGV2ZW50IGhhbmRsZXJzXG4gICAgc2F2ZWRPbktleWRvd24gPSBkb2N1bWVudC5ib2R5Lm9ua2V5ZG93bjtcbiAgICBzYXZlZE9uTW91c2V1cCA9IGRvY3VtZW50LmJvZHkub25tb3VzZXVwO1xuICAgIHNhdmVkT25CZWZvcmVVbmxvYWQgPSB3aW5kb3cub25iZWZvcmV1bmxvYWQ7XG4gICAgc2F2ZWRPblVubG9hZCA9IHdpbmRvdy5vbnVubG9hZDtcblxuICAgIC8vIEluc3RhbGwgZ2xvYmFsIGV2ZW50IGhhbmRsZXJzXG4gICAgZG9jdW1lbnQuYm9keS5vbmtleWRvd24gPSBldmVudHMuaGFuZGxlS2V5RG93bjtcbiAgICBkb2N1bWVudC5ib2R5Lm9ubW91c2V1cCA9IGV2ZW50cy5raWxsVGV4dFNlbGVjdGlvbjtcbiAgICB3aW5kb3cub25iZWZvcmV1bmxvYWQgPSBuYXZpZ2F0aW9uV2FybmluZztcblxuICAgIC8vIHdpbmRvdy5vbnVubG9hZCA9IGxvZ1VubG9hZDtcbiAgICAvLyBJbnN0YWxsIGVsZW1lbnQtc3BlY2lmaWMgZXZlbnQgaGFuZGxlcnNcbiAgICAkKFwiI3NuMFwiKS5tb3VzZWRvd24oZXZlbnRzLmhhbmRsZU5vZGVDbGljayk7XG4gICAgJChcIiNidXRzYXZlXCIpLm1vdXNlZG93bihzYXZlLnNhdmUpO1xuICAgICQoXCIjYnV0dW5kb1wiKS5tb3VzZWRvd24odW5kby51bmRvKTtcbiAgICAkKFwiI2J1dHJlZG9cIikubW91c2Vkb3duKHVuZG8ucmVkbyk7XG4gICAgJChcIiNidXRleGl0XCIpLnVuYmluZChcImNsaWNrXCIpLmNsaWNrKGV4cG9ydHMucXVpdFRyZWVEcmF3aW5nKTtcblxuICAgIC8vIFRPRE9cbiAgICAvLyQoXCIjYnV0aWRsZVwiKS5tb3VzZWRvd24oaWRsZSk7XG4gICAgLy8kKFwiI2J1dHZhbGlkYXRlXCIpLnVuYmluZChcImNsaWNrXCIpLmNsaWNrKHZhbGlkYXRlVHJlZXMpO1xuICAgIC8vJChcIiNidXRuZXh0ZXJyXCIpLnVuYmluZChcImNsaWNrXCIpLmNsaWNrKG5leHRWYWxpZGF0aW9uRXJyb3IpO1xuICAgIC8vJChcIiNidXRuZXh0dHJlZVwiKS51bmJpbmQoXCJjbGlja1wiKS5jbGljayhuZXh0VHJlZSk7XG4gICAgLy8kKFwiI2J1dHByZXZ0cmVlXCIpLnVuYmluZChcImNsaWNrXCIpLmNsaWNrKHByZXZUcmVlKTtcbiAgICAvLyQoXCIjYnV0Z290b3RyZWVcIikudW5iaW5kKFwiY2xpY2tcIikuY2xpY2soZ29Ub1RyZWUpO1xuICAgICQoXCIjZWRpdHBhbmVcIikubW91c2Vkb3duKHNlbGVjdGlvbi5jbGVhclNlbGVjdGlvbik7XG4gICAgJChcIiNjb25NZW51XCIpLm1vdXNlZG93bihjb250ZXh0bWVudS5oaWRlQ29udGV4dE1lbnUpO1xuICAgIC8vICQoZG9jdW1lbnQpLm1vdXNld2hlZWwoaGFuZGxlTW91c2VXaGVlbCk7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0dXBUcmVlZHJhd2luZyhleGl0Rm4sIHNhdmVGbikge1xuICAgIC8vIFRPRE86IHNvbWV0aGluZyBpcyB2ZXJ5IHNsb3cgaGVyZTsgcHJvZmlsZVxuICAgIGFzc2lnbkV2ZW50cygpO1xuXG4gICAgXy5lYWNoKHN0YXJ0dXBIb29rcywgZnVuY3Rpb24gKGhvb2spIHtcbiAgICAgICAgaG9vaygpO1xuICAgIH0pO1xuXG4gICAgbGFzdFNhdmVkU3RhdGUgPSAkKFwiI2VkaXRwYW5lXCIpLmh0bWwoKTtcbiAgICBzaHV0ZG93bkNhbGxiYWNrID0gZXhpdEZuO1xuICAgIHNhdmUuc2F2ZUZuID0gc2F2ZUZuO1xufVxuZXhwb3J0cy5zdGFydHVwVHJlZWRyYXdpbmcgPSBzdGFydHVwVHJlZWRyYXdpbmc7XG5cbmZ1bmN0aW9uIHJlc2V0R2xvYmFscygpIHtcbiAgICAvLyBUT0RPOiBlbmNhcHN1bGF0aW9uIHZpb2xhdGlvblxuICAgIHZhciBuZXdHbG9iYWxzID0ge1xuICAgICAgICBpcG5vZGVzOiBbXSxcbiAgICAgICAgY29tbWVudFR5cGVzOiBbXSxcbiAgICAgICAgZXh0ZW5zaW9uczogW10sXG4gICAgICAgIGNsYXVzZUV4dGVuc2lvbnM6IFtdLFxuICAgICAgICBsZWFmRXh0ZW5zaW9uczogW10sXG4gICAgICAgIGNhc2VCYXJyaWVyczogW10sXG4gICAgICAgIGRpc3BsYXlDYXNlTWVudTogZmFsc2UsXG4gICAgICAgIGNhc2VUYWdzOiBbXSxcbiAgICAgICAgY2FzZVBocmFzZXM6IFtdLFxuICAgICAgICBjYXNlTWFya2VyczogW10sXG4gICAgICAgIGRlZmF1bHRDb25NZW51R3JvdXA6IFtdLFxuICAgICAgICBsb2dEZXRhaWw6IGZhbHNlXG4gICAgfTtcbiAgICBfLmZvck93bihuZXdHbG9iYWxzLCBmdW5jdGlvbiAodiwgaykge1xuICAgICAgICBnbG9iYWxzW2tdID0gdjtcbiAgICB9KTtcbiAgICBjb250ZXh0bWVudS5yZXNldEdsb2JhbHMoKTtcbn1cbmV4cG9ydHMucmVzZXRHbG9iYWxzID0gcmVzZXRHbG9iYWxzO1xuIiwiLy8vPHJlZmVyZW5jZSBwYXRoPVwiLi8uLi8uLi8uLi90eXBlcy9hbGwuZC50c1wiIC8+XG4vKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lIG5vLWJpdHdpc2UgcXVvdGVtYXJrICovXG52YXIgJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBzZWxlY3Rpb24gPSByZXF1aXJlKFwiLi9zZWxlY3Rpb25cIik7XG52YXIgdW5kbyA9IHJlcXVpcmUoXCIuL3VuZG9cIik7XG52YXIgZXZlbnRzID0gcmVxdWlyZShcIi4vZXZlbnRzXCIpO1xudmFyIGNvbmYgPSByZXF1aXJlKFwiLi9jb25maWdcIik7XG5cbi8vICogQ29pbmRleGF0aW9uXG4vKipcbiogQ29pbmRleCBub2Rlcy5cbipcbiogQ29pbmRleCB0aGUgdHdvIHNlbGVjdGVkIG5vZGVzLiAgSWYgdGhleSBhcmUgYWxyZWFkeSBjb2luZGV4ZWQsIHRvZ2dsZVxuKiB0eXBlcyBvZiBjb2luZGV4YXRpb24gKG5vcm1hbCAtPiBnYXBwaW5nIC0+IGJhY2t3YXJkcyBnYXBwaW5nIC0+IGRvdWJsZVxuKiBnYXBwaW5nIC0+IG5vIGluZGljZXMpLiAgSWYgb25seSBvbmUgbm9kZSBpcyBzZWxlY3RlZCwgcmVtb3ZlIGl0cyBpbmRleC5cbiovXG5mdW5jdGlvbiBjb0luZGV4KCkge1xuICAgIHZhciBzZWwgPSBzZWxlY3Rpb24uZ2V0KCk7XG4gICAgdmFyIHNlbDIgPSBzZWxlY3Rpb24uZ2V0KHRydWUpO1xuICAgIGlmIChzZWxlY3Rpb24uY2FyZGluYWxpdHkoKSA9PT0gMSkge1xuICAgICAgICBpZiAodXRpbHMuZ2V0SW5kZXgoc2VsKSkge1xuICAgICAgICAgICAgdW5kby50b3VjaFRyZWUoJChzZWwpKTtcbiAgICAgICAgICAgIHV0aWxzLnJlbW92ZUluZGV4KHNlbCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHNlbGVjdGlvbi5jYXJkaW5hbGl0eSgpID09PSAyKSB7XG4gICAgICAgIC8vIGRvbid0IGRvIGFueXRoaW5nIGlmIGRpZmZlcmVudCB0b2tlbiByb290c1xuICAgICAgICB2YXIgc3RhcnRSb290ID0gdXRpbHMuZ2V0VG9rZW5Sb290KCQoc2VsKSk7XG4gICAgICAgIHZhciBlbmRSb290ID0gdXRpbHMuZ2V0VG9rZW5Sb290KCQoc2VsMikpO1xuICAgICAgICBpZiAoc3RhcnRSb290ICE9PSBlbmRSb290KSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBtZXNzYWdlXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB1bmRvLnRvdWNoVHJlZSgkKHNlbCkpO1xuXG4gICAgICAgIC8vIGlmIGJvdGggbm9kZXMgYWxyZWFkeSBoYXZlIGFuIGluZGV4XG4gICAgICAgIGlmICh1dGlscy5nZXRJbmRleChzZWwpICYmIHV0aWxzLmdldEluZGV4KHNlbDIpKSB7XG4gICAgICAgICAgICAvLyBhbmQgaWYgaXQgaXMgdGhlIHNhbWUgaW5kZXhcbiAgICAgICAgICAgIGlmICh1dGlscy5nZXRJbmRleChzZWwpID09PSB1dGlscy5nZXRJbmRleChzZWwyKSkge1xuICAgICAgICAgICAgICAgIHZhciB0eXBlcyA9IHV0aWxzLmdldEluZGV4VHlwZShzZWwpICsgdXRpbHMuZ2V0SW5kZXhUeXBlKHNlbDIpO1xuXG4gICAgICAgICAgICAgICAgLy8gcmVtb3ZlIGl0XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVzID09PSBcIj0tXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdXRpbHMuc2V0SW5kZXhUeXBlKHNlbDIsIFwiPVwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVzID09PSBcIi0tXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdXRpbHMuc2V0SW5kZXhUeXBlKHNlbDIsIFwiPVwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVzID09PSBcIi09XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdXRpbHMuc2V0SW5kZXhUeXBlKHNlbCwgXCI9XCIpO1xuICAgICAgICAgICAgICAgICAgICB1dGlscy5zZXRJbmRleFR5cGUoc2VsMiwgXCItXCIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZXMgPT09IFwiPT1cIikge1xuICAgICAgICAgICAgICAgICAgICB1dGlscy5yZW1vdmVJbmRleChzZWwpO1xuICAgICAgICAgICAgICAgICAgICB1dGlscy5yZW1vdmVJbmRleChzZWwyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodXRpbHMuZ2V0SW5kZXgoc2VsKSAmJiAhdXRpbHMuZ2V0SW5kZXgoc2VsMikpIHtcbiAgICAgICAgICAgIHV0aWxzLnNldEluZGV4KHNlbDIsIHV0aWxzLmdldEluZGV4KHNlbCkpO1xuICAgICAgICB9IGVsc2UgaWYgKCF1dGlscy5nZXRJbmRleChzZWwpICYmIHV0aWxzLmdldEluZGV4KHNlbDIpKSB7XG4gICAgICAgICAgICB1dGlscy5zZXRJbmRleChzZWwsIHV0aWxzLmdldEluZGV4KHNlbDIpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHV0aWxzLm1heEluZGV4KHN0YXJ0Um9vdCkgKyAxO1xuICAgICAgICAgICAgdXRpbHMuc2V0SW5kZXgoc2VsLCBpbmRleCk7XG4gICAgICAgICAgICB1dGlscy5zZXRJbmRleChzZWwyLCBpbmRleCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLmNvSW5kZXggPSBjb0luZGV4O1xuXG4vLyAqIE1vdmVtZW50XG4vKipcbiogTW92ZSB0aGUgc2VsZWN0ZWQgbm9kZShzKSB0byBhIG5ldyBwb3NpdGlvbi5cbipcbiogVGhlIG1vdmVtZW50IG9wZXJhdGlvbiBtdXN0IG5vdCBjaGFuZ2UgdGhlIHRleHQgb2YgdGhlIHRva2VuLlxuKlxuKiBFbXB0eSBjYXRlZ29yaWVzIGFyZSBub3QgYWxsb3dlZCB0byBiZSBtb3ZlZCBhcyBhIGxlYWYuICBIb3dldmVyLCBhXG4qIG5vbi10ZXJtaW5hbCBjb250YWluaW5nIG9ubHkgZW1wdHkgY2F0ZWdvcmllcyBjYW4gYmUgbW92ZWQuXG4qXG4qIEBwYXJhbSB7Tm9kZX0gcGFyZW50IHRoZSBwYXJlbnQgbm9kZSB0byBtb3ZlIHNlbGVjdGlvbiB1bmRlclxuKlxuKiBAcmV0dXJucyB7Qm9vbGVhbn0gd2hldGhlciB0aGUgb3BlcmF0aW9uIHdhcyBzdWNjZXNzZnVsXG4qL1xuZnVuY3Rpb24gbW92ZU5vZGUocGFyZW50KSB7XG4gICAgdmFyIHBhcmVudF9pcCA9ICQoc2VsZWN0aW9uLmdldCgpKS5wYXJlbnRzKFwiI3NuMD4uc25vZGUsI3NuMFwiKS5maXJzdCgpO1xuICAgIHZhciBvdGhlcl9wYXJlbnQgPSAkKHBhcmVudCkucGFyZW50cyhcIiNzbjA+LnNub2RlLCNzbjBcIikuZmlyc3QoKTtcbiAgICBpZiAocGFyZW50ID09PSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNuMFwiKSB8fCAhcGFyZW50X2lwLmlzKG90aGVyX3BhcmVudCkpIHtcbiAgICAgICAgcGFyZW50X2lwID0gJChcIiNzbjBcIik7XG4gICAgfVxuICAgIHZhciBwYXJlbnRfYmVmb3JlO1xuICAgIHZhciB0ZXh0YmVmb3JlID0gdXRpbHMuY3VycmVudFRleHQocGFyZW50X2lwKTtcbiAgICBpZiAoIXV0aWxzLmlzUG9zc2libGVUYXJnZXQocGFyZW50KSB8fCAkKHNlbGVjdGlvbi5nZXQoKSkucGFyZW50KCkuY2hpbGRyZW4oKS5sZW5ndGggPT09IDEgfHwgJChwYXJlbnQpLnBhcmVudHMoKS5pcyhzZWxlY3Rpb24uZ2V0KCkpIHx8IHV0aWxzLmlzRW1wdHlOb2RlKHNlbGVjdGlvbi5nZXQoKSkpIHtcbiAgICAgICAgc2VsZWN0aW9uLmNsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKCQoc2VsZWN0aW9uLmdldCgpKS5wYXJlbnRzKCkuaXMocGFyZW50KSkge1xuICAgICAgICAvLyBtb3ZlIHVwIGlmIG1vdmluZyB0byBhIG5vZGUgdGhhdCBpcyBhbHJlYWR5IG15IHBhcmVudFxuICAgICAgICBpZiAoJChzZWxlY3Rpb24uZ2V0KCkpLnBhcmVudCgpLmNoaWxkcmVuKCkuZmlyc3QoKS5pcyhzZWxlY3Rpb24uZ2V0KCkpKSB7XG4gICAgICAgICAgICBpZiAoJChzZWxlY3Rpb24uZ2V0KCkpLnBhcmVudHNVbnRpbChwYXJlbnQpLnNsaWNlKDAsIC0xKS5maWx0ZXIoXCI6bm90KDpmaXJzdC1jaGlsZClcIikubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHNlbGVjdGlvbi5jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwYXJlbnQgPT09IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic24wXCIpKSB7XG4gICAgICAgICAgICAgICAgdW5kby50b3VjaFRyZWUoJChzZWxlY3Rpb24uZ2V0KCkpKTtcbiAgICAgICAgICAgICAgICB1bmRvLnJlZ2lzdGVyTmV3Um9vdFRyZWUoJChzZWxlY3Rpb24uZ2V0KCkpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdW5kby50b3VjaFRyZWUoJChzZWxlY3Rpb24uZ2V0KCkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICQoc2VsZWN0aW9uLmdldCgpKS5pbnNlcnRCZWZvcmUoJChwYXJlbnQpLmNoaWxkcmVuKCkuZmlsdGVyKCQoc2VsZWN0aW9uLmdldCgpKS5wYXJlbnRzKCkpKTtcbiAgICAgICAgICAgIGlmICh1dGlscy5jdXJyZW50VGV4dChwYXJlbnRfaXApICE9PSB0ZXh0YmVmb3JlKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQoXCJmYWlsZWQgd2hhdCBzaG91bGQgaGF2ZSBiZWVuIGEgc3RyaWN0IHRlc3RcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoJChzZWxlY3Rpb24uZ2V0KCkpLnBhcmVudCgpLmNoaWxkcmVuKCkubGFzdCgpLmlzKHNlbGVjdGlvbi5nZXQoKSkpIHtcbiAgICAgICAgICAgIGlmICgkKHNlbGVjdGlvbi5nZXQoKSkucGFyZW50c1VudGlsKHBhcmVudCkuc2xpY2UoMCwgLTEpLmZpbHRlcihcIjpub3QoOmxhc3QtY2hpbGQpXCIpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb24uY2xlYXJTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGFyZW50ID09PSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNuMFwiKSkge1xuICAgICAgICAgICAgICAgIHVuZG8udG91Y2hUcmVlKCQoc2VsZWN0aW9uLmdldCgpKSk7XG4gICAgICAgICAgICAgICAgdW5kby5yZWdpc3Rlck5ld1Jvb3RUcmVlKCQoc2VsZWN0aW9uLmdldCgpKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHVuZG8udG91Y2hUcmVlKCQoc2VsZWN0aW9uLmdldCgpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkKHNlbGVjdGlvbi5nZXQoKSkuaW5zZXJ0QWZ0ZXIoJChwYXJlbnQpLmNoaWxkcmVuKCkuZmlsdGVyKCQoc2VsZWN0aW9uLmdldCgpKS5wYXJlbnRzKCkpKTtcbiAgICAgICAgICAgIGlmICh1dGlscy5jdXJyZW50VGV4dChwYXJlbnRfaXApICE9PSB0ZXh0YmVmb3JlKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQoXCJmYWlsZWQgd2hhdCBzaG91bGQgaGF2ZSBiZWVuIGEgc3RyaWN0IHRlc3RcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBjYW5ub3QgbW92ZSBmcm9tIHRoaXMgcG9zaXRpb25cbiAgICAgICAgICAgIHNlbGVjdGlvbi5jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gb3RoZXJ3aXNlIG1vdmUgdW5kZXIgbXkgc2lzdGVyXG4gICAgICAgIHZhciB0b2tlbk1lcmdlID0gdXRpbHMuaXNSb290Tm9kZSgkKHNlbGVjdGlvbi5nZXQoKSkpO1xuICAgICAgICB2YXIgbWF4aW5kZXggPSB1dGlscy5tYXhJbmRleCh1dGlscy5nZXRUb2tlblJvb3QoJChwYXJlbnQpKSk7XG4gICAgICAgIHZhciBtb3ZlZG5vZGUgPSAkKHNlbGVjdGlvbi5nZXQoKSk7XG5cbiAgICAgICAgLy8gTk9URTogY3VycmVudGx5IHRoZXJlIGFyZSBubyBtb3JlIHN0cmluZ2VudCBjaGVja3MgYmVsb3c7IGlmIHRoYXRcbiAgICAgICAgLy8gY2hhbmdlcywgd2UgbWlnaHQgd2FudCB0byBkZW1vdGUgdGhpc1xuICAgICAgICBwYXJlbnRfYmVmb3JlID0gcGFyZW50X2lwLmNsb25lKCk7XG5cbiAgICAgICAgLy8gd2hlcmUgYSBhbmQgYiBhcmUgRE9NIGVsZW1lbnRzIChub3QganF1ZXJ5LXdyYXBwZWQpLFxuICAgICAgICAvLyBhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKGIpIHJldHVybnMgYW4gaW50ZWdlci4gIFRoZSBmaXJzdCAoY291bnRpbmdcbiAgICAgICAgLy8gZnJvbSAwKSBiaXQgaXMgc2V0IGlmIEIgcHJlY2VkZXMgQSwgYW5kIHRoZSBzZWNvbmQgYml0IGlzIHNldCBpZiBBXG4gICAgICAgIC8vIHByZWNlZGVzIEIuXG4gICAgICAgIC8vIFRPRE86IHBlcmhhcHMgaGVyZSBhbmQgaW4gdGhlIGltbWVkaWF0ZWx5IGZvbGxvd2luZyBlbHNlIGlmIGl0IGlzXG4gICAgICAgIC8vIHBvc3NpYmxlIHRvIHNpbXBsaWZ5IGFuZCByZW1vdmUgdGhlIGNvbXBhcmVEb2N1bWVudFBvc2l0aW9uIGNhbGwsXG4gICAgICAgIC8vIHNpbmNlIHRoZSBqUXVlcnkgc3Vic3VtZXMgaXRcbiAgICAgICAgaWYgKHBhcmVudC5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihzZWxlY3Rpb24uZ2V0KCkpICYgMHg0KSB7XG4gICAgICAgICAgICAvLyBjaGVjayB3aGV0aGVyIHRoZSBub2RlcyBhcmUgYWRqYWNlbnQuICBJZGVhbGx5LCB3ZSB3b3VsZCBsaWtlXG4gICAgICAgICAgICAvLyB0byBzYXkgc2VsZkFuZFBhcmVudHNVbnRpbCwgYnV0IG5vIHN1Y2ggalF1ZXJ5IGZuIGV4aXN0cywgdGh1c1xuICAgICAgICAgICAgLy8gbmVjZXNzaXRhdGluZyB0aGUgZGlzanVuY3Rpb24uXG4gICAgICAgICAgICAvLyBUT0RPOiB0b28gc3RyaWN0XG4gICAgICAgICAgICAvLyAmJlxuICAgICAgICAgICAgLy8gJChzZWxlY3Rpb24uZ2V0KCkpLnByZXYoKS5pcyhcbiAgICAgICAgICAgIC8vICAgICAkKHBhcmVudCkucGFyZW50c1VudGlsKHN0YXJ0bm9kZS5wYXJlbnROb2RlKS5sYXN0KCkpIHx8XG4gICAgICAgICAgICAvLyAkKHNlbGVjdGlvbi5nZXQoKSkucHJldigpLmlzKHBhcmVudClcbiAgICAgICAgICAgIC8vIHBhcmVudCBwcmVjZWRlcyBzdGFydG5vZGVcbiAgICAgICAgICAgIHVuZG8udW5kb0JlZ2luVHJhbnNhY3Rpb24oKTtcbiAgICAgICAgICAgIGlmICh0b2tlbk1lcmdlKSB7XG4gICAgICAgICAgICAgICAgdW5kby5yZWdpc3RlckRlbGV0ZWRSb290VHJlZSgkKHNlbGVjdGlvbi5nZXQoKSkpO1xuICAgICAgICAgICAgICAgIHVuZG8udG91Y2hUcmVlKCQocGFyZW50KSk7XG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiB0aGlzIHdpbGwgYm9tYiBpZiB3ZSBhcmUgbWVyZ2luZyBtb3JlIHRoYW4gMiB0b2tlbnNcbiAgICAgICAgICAgICAgICAvLyBieSBtdWx0aXBsZSBzZWxlY3Rpb24uXG4gICAgICAgICAgICAgICAgdXRpbHMuYWRkVG9JbmRpY2VzKG1vdmVkbm9kZSwgbWF4aW5kZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1bmRvLnRvdWNoVHJlZSgkKHNlbGVjdGlvbi5nZXQoKSkpO1xuICAgICAgICAgICAgICAgIHVuZG8udG91Y2hUcmVlKCQocGFyZW50KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtb3ZlZG5vZGUuYXBwZW5kVG8ocGFyZW50KTtcbiAgICAgICAgICAgIGlmICh1dGlscy5jdXJyZW50VGV4dChwYXJlbnRfaXApICE9PSB0ZXh0YmVmb3JlKSB7XG4gICAgICAgICAgICAgICAgdW5kby51bmRvQWJvcnRUcmFuc2FjdGlvbigpO1xuICAgICAgICAgICAgICAgIHBhcmVudF9pcC5yZXBsYWNlV2l0aChwYXJlbnRfYmVmb3JlKTtcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50X2lwLnByb3AoXCJpZFwiKSA9PT0gXCJzbjBcIikge1xuICAgICAgICAgICAgICAgICAgICAkKFwiI3NuMFwiKS5tb3VzZWRvd24oZXZlbnRzLmhhbmRsZU5vZGVDbGljayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNlbGVjdGlvbi5jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdW5kby51bmRvRW5kVHJhbnNhY3Rpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICgocGFyZW50LmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKHNlbGVjdGlvbi5nZXQoKSkgJiAweDIpKSB7XG4gICAgICAgICAgICAvLyAmJlxuICAgICAgICAgICAgLy8gJChzZWxlY3Rpb24uZ2V0KCkpLm5leHQoKS5pcyhcbiAgICAgICAgICAgIC8vICAgICAkKHBhcmVudCkucGFyZW50c1VudGlsKHN0YXJ0bm9kZS5wYXJlbnROb2RlKS5sYXN0KCkpIHx8XG4gICAgICAgICAgICAvLyAkKHNlbGVjdGlvbi5nZXQoKSkubmV4dCgpLmlzKHBhcmVudClcbiAgICAgICAgICAgIC8vIHN0YXJ0bm9kZSBwcmVjZWRlcyBwYXJlbnRcbiAgICAgICAgICAgIHVuZG8udW5kb0JlZ2luVHJhbnNhY3Rpb24oKTtcbiAgICAgICAgICAgIGlmICh0b2tlbk1lcmdlKSB7XG4gICAgICAgICAgICAgICAgdW5kby5yZWdpc3RlckRlbGV0ZWRSb290VHJlZSgkKHNlbGVjdGlvbi5nZXQoKSkpO1xuICAgICAgICAgICAgICAgIHVuZG8udG91Y2hUcmVlKCQocGFyZW50KSk7XG4gICAgICAgICAgICAgICAgdXRpbHMuYWRkVG9JbmRpY2VzKG1vdmVkbm9kZSwgbWF4aW5kZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1bmRvLnRvdWNoVHJlZSgkKHNlbGVjdGlvbi5nZXQoKSkpO1xuICAgICAgICAgICAgICAgIHVuZG8udG91Y2hUcmVlKCQocGFyZW50KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtb3ZlZG5vZGUuaW5zZXJ0QmVmb3JlKCQocGFyZW50KS5jaGlsZHJlbigpLmZpcnN0KCkpO1xuICAgICAgICAgICAgaWYgKHV0aWxzLmN1cnJlbnRUZXh0KHBhcmVudF9pcCkgIT09IHRleHRiZWZvcmUpIHtcbiAgICAgICAgICAgICAgICB1bmRvLnVuZG9BYm9ydFRyYW5zYWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgcGFyZW50X2lwLnJlcGxhY2VXaXRoKHBhcmVudF9iZWZvcmUpO1xuICAgICAgICAgICAgICAgIGlmIChwYXJlbnRfaXAuYXR0cihcImlkXCIpID09PSBcInNuMFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICQoXCIjc24wXCIpLm1vdXNlZG93bihldmVudHMuaGFuZGxlTm9kZUNsaWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uLmNsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1bmRvLnVuZG9FbmRUcmFuc2FjdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHNlbGVjdGlvbi5jbGVhclNlbGVjdGlvbigpO1xuICAgIHJldHVybiB0cnVlO1xufVxuZXhwb3J0cy5tb3ZlTm9kZSA9IG1vdmVOb2RlO1xuXG4vKipcbiogTW92ZSBzZXZlcmFsIG5vZGVzLlxuKlxuKiBUaGUgdHdvIHNlbGVjdGVkIG5vZGVzIG11c3QgYmUgc2lzdGVycywgYW5kIHRoZXkgYW5kIGFsbCBpbnRlcnZlbmluZyBzaXN0ZXJzXG4qIHdpbGwgYmUgbW92ZWQgYXMgYSB1bml0LiAgQ2FsbHMge0BsaW5rIG1vdmVOb2RlfSB0byBkbyB0aGUgaGVhdnkgbGlmdGluZy5cbipcbiogQHBhcmFtIHtOb2RlfSBwYXJlbnQgdGhlIHBhcmVudCB0byBtb3ZlIHRoZSBzZWxlY3Rpb24gdW5kZXJcbiovXG5mdW5jdGlvbiBtb3ZlTm9kZXMocGFyZW50KSB7XG4gICAgaWYgKHNlbGVjdGlvbi5jYXJkaW5hbGl0eSgpICE9PSAyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdW5kby51bmRvQmVnaW5UcmFuc2FjdGlvbigpO1xuICAgIHVuZG8udG91Y2hUcmVlKCQoc2VsZWN0aW9uLmdldCgpKSk7XG4gICAgdW5kby50b3VjaFRyZWUoJChwYXJlbnQpKTtcbiAgICBpZiAoc2VsZWN0aW9uLmdldCgpLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKHNlbGVjdGlvbi5nZXQodHJ1ZSkpICYgMHgyKSB7XG4gICAgICAgIC8vIGVuZG5vZGUgcHJlY2VkZXMgc3RhcnRub2RlLCByZXZlcnNlIHRoZW1cbiAgICAgICAgdmFyIHRlbXAgPSBzZWxlY3Rpb24uZ2V0KCk7XG4gICAgICAgIHNlbGVjdGlvbi5zZXQoc2VsZWN0aW9uLmdldCh0cnVlKSk7XG4gICAgICAgIHNlbGVjdGlvbi5zZXQodGVtcCwgdHJ1ZSk7XG4gICAgfVxuICAgIGlmIChzZWxlY3Rpb24uZ2V0KCkucGFyZW50Tm9kZSA9PT0gc2VsZWN0aW9uLmdldCh0cnVlKS5wYXJlbnROb2RlKSB7XG4gICAgICAgIC8vIGNvbGxlY3Qgc3RhcnRub2RlIGFuZCBpdHMgc2lzdGVyIHVwIHVudGlsIGVuZG5vZGVcbiAgICAgICAgJChzZWxlY3Rpb24uZ2V0KCkpLmFkZCgkKHNlbGVjdGlvbi5nZXQoKSkubmV4dFVudGlsKCQoc2VsZWN0aW9uLmdldCh0cnVlKSkpKS5hZGQoJChzZWxlY3Rpb24uZ2V0KHRydWUpKSkud3JhcEFsbCgnPGRpdiB4eHg9XCJuZXdub2RlXCIgY2xhc3M9XCJzbm9kZVwiPlhQPC9kaXY+Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdG9zZWxlY3QgPSAkKFwiLnNub2RlW3h4eD1uZXdub2RlXVwiKS5maXJzdCgpO1xuXG4gICAgLy8gQlVHIHdoZW4gbWFraW5nIFhQIGFuZCB0aGVuIHVzZSBjb250ZXh0IG1lbnU6IFRPRE8gWFhYXG4gICAgc2VsZWN0aW9uLnNldCh0b3NlbGVjdC5nZXQoMCkpO1xuICAgIHZhciByZXMgPSB1bmRvLmlnbm9yaW5nVW5kbyhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGV4cG9ydHMubW92ZU5vZGUocGFyZW50KTtcbiAgICB9KTtcbiAgICBpZiAocmVzKSB7XG4gICAgICAgIHVuZG8udW5kb0VuZFRyYW5zYWN0aW9uKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdW5kby51bmRvQWJvcnRUcmFuc2FjdGlvbigpO1xuICAgIH1cbiAgICBzZWxlY3Rpb24uc2V0KCQoXCIuc25vZGVbeHh4PW5ld25vZGVdXCIpLmZpcnN0KCkuZ2V0KDApKTtcbiAgICBzZWxlY3Rpb24uY2xlYXIodHJ1ZSk7XG4gICAgZXhwb3J0cy5wcnVuZU5vZGUoKTtcbiAgICBzZWxlY3Rpb24uY2xlYXJTZWxlY3Rpb24oKTtcbn1cbmV4cG9ydHMubW92ZU5vZGVzID0gbW92ZU5vZGVzO1xuXG4vLyAqIERlbGV0aW9uXG4vKipcbiogRGVsZXRlIGEgbm9kZS5cbipcbiogVGhlIG5vZGUgY2FuIG9ubHkgYmUgZGVsZXRlZCBpZiBkb2luZyBzbyBkb2VzIG5vdCBhZmZlY3QgdGhlIHRleHQsIGkuZS4gaXRcbiogZGlyZWN0bHkgZG9taW5hdGVzIG5vIG5vbi1lbXB0eSB0ZXJtaW5hbHMuXG4qL1xuZnVuY3Rpb24gcHJ1bmVOb2RlKCkge1xuICAgIGlmIChzZWxlY3Rpb24uY2FyZGluYWxpdHkoKSA9PT0gMSkge1xuICAgICAgICBpZiAodXRpbHMuaXNMZWFmTm9kZShzZWxlY3Rpb24uZ2V0KCkpICYmIHV0aWxzLmlzRW1wdHlOb2RlKHNlbGVjdGlvbi5nZXQoKSkpIHtcbiAgICAgICAgICAgIC8vIGl0IGlzIG9rIHRvIGRlbGV0ZSBsZWFmIGlmIGl0IGlzIGVtcHR5L3RyYWNlXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNSb290Tm9kZSgkKHNlbGVjdGlvbi5nZXQoKSkpKSB7XG4gICAgICAgICAgICAgICAgLy8gcGVydmVyc2VseSwgaXQgaXMgcG9zc2libGUgdG8gaGF2ZSBhIGxlYWYgbm9kZSBhdCB0aGUgcm9vdFxuICAgICAgICAgICAgICAgIC8vIG9mIGEgZmlsZS5cbiAgICAgICAgICAgICAgICB1bmRvLnJlZ2lzdGVyRGVsZXRlZFJvb3RUcmVlKCQoc2VsZWN0aW9uLmdldCgpKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHVuZG8udG91Y2hUcmVlKCQoc2VsZWN0aW9uLmdldCgpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaWR4ID0gdXRpbHMuZ2V0SW5kZXgoc2VsZWN0aW9uLmdldCgpKTtcbiAgICAgICAgICAgIGlmIChpZHggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJvb3QgPSAkKHV0aWxzLmdldFRva2VuUm9vdCgkKHNlbGVjdGlvbi5nZXQoKSkpKTtcbiAgICAgICAgICAgICAgICB2YXIgc2FtZUlkeCA9IHJvb3QuZmluZCgnLnNub2RlJykuZmlsdGVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmdldEluZGV4KHRoaXMpID09PSBpZHg7XG4gICAgICAgICAgICAgICAgfSkubm90KHNlbGVjdGlvbi5nZXQoKSk7XG4gICAgICAgICAgICAgICAgaWYgKHNhbWVJZHgubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvc24gPSBzZWxlY3Rpb24uZ2V0KCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbi5zZXQoc2FtZUlkeC5nZXQoMCkpO1xuICAgICAgICAgICAgICAgICAgICBleHBvcnRzLmNvSW5kZXgoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uLnNldChvc24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICQoc2VsZWN0aW9uLmdldCgpKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIHNlbGVjdGlvbi5jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgc2VsZWN0aW9uLnVwZGF0ZVNlbGVjdGlvbigpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2UgaWYgKHV0aWxzLmlzTGVhZk5vZGUoc2VsZWN0aW9uLmdldCgpKSkge1xuICAgICAgICAgICAgLy8gYnV0IG90aGVyIGxlYXZlcyBhcmUgbm90IGRlbGV0ZWRcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIGlmIChzZWxlY3Rpb24uZ2V0KCkgPT09IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic24wXCIpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdG9zZWxlY3QgPSAkKHNlbGVjdGlvbi5nZXQoKSkuY2hpbGRyZW4oKS5maXJzdCgpO1xuICAgICAgICB1bmRvLnRvdWNoVHJlZSgkKHNlbGVjdGlvbi5nZXQoKSkpO1xuICAgICAgICAkKHNlbGVjdGlvbi5nZXQoKSkucmVwbGFjZVdpdGgoJChzZWxlY3Rpb24uZ2V0KCkpLmNoaWxkcmVuKCkpO1xuICAgICAgICBzZWxlY3Rpb24uY2xlYXJTZWxlY3Rpb24oKTtcbiAgICAgICAgc2VsZWN0aW9uLnNlbGVjdE5vZGUodG9zZWxlY3QuZ2V0KDApKTtcbiAgICAgICAgc2VsZWN0aW9uLnVwZGF0ZVNlbGVjdGlvbigpO1xuICAgIH1cbn1cbmV4cG9ydHMucHJ1bmVOb2RlID0gcHJ1bmVOb2RlO1xuXG4vLyAqIENyZWF0aW9uXG4vLyBUT0RPOiB0aGUgaGFyZGNvZGluZyBvZiBkZWZhdWx0cyBpbiB0aGlzIGZ1bmN0aW9uIGlzIHVnbHkuICBXZSBzaG91bGRcbi8vIHN1cHBseSBhIGRlZmF1bHQgaGV1cmlzdGljIGZuIHRvIHRyeSB0byBndWVzcyB0aGVzZSwgdGhlbiBhbGxvd1xuLy8gc2V0dGluZ3MuanMgdG8gb3ZlcnJpZGUgaXQuXG4vLyBUT0RPOiBtYXliZSBwdXQgdGhlIGhldXJpc3RpYyBpbnRvIGxlYWZiZWZvcmUvYWZ0ZXIsIGFuZCBsZWF2ZSB0aGlzIGZuIGNsZWFuP1xuLyoqXG4qIENyZWF0ZSBhIGxlYWYgbm9kZSBhZGphY2VudCB0byB0aGUgc2VsZWN0aW9uLCBvciBhIGdpdmVuIHRhcmdldC5cbipcbiogQHBhcmFtIHtCb29sZWFufSBiZWZvcmUgd2hldGhlciB0byBjcmVhdGUgdGhlIG5vZGUgYmVmb3JlIG9yIGFmdGVyIHNlbGVjdGlvblxuKiBAcGFyYW0ge1N0cmluZ30gbGFiZWwgdGhlIGxhYmVsIHRvIGdpdmUgdGhlIG5ldyBub2RlXG4qIEBwYXJhbSB7U3RyaW5nfSB3b3JkIHRoZSB0ZXh0IHRvIGdpdmUgdGhlIG5ldyBub2RlXG4qIEBwYXJhbSB7Tm9kZX0gdGFyZ2V0IHdoZXJlIHRvIHB1dCB0aGUgbmV3IG5vZGUgKGRlZmF1bHQ6IHNlbGVjdGVkIG5vZGUpXG4qL1xuZnVuY3Rpb24gbWFrZUxlYWYoYmVmb3JlLCBsYWJlbCwgd29yZCwgdGFyZ2V0KSB7XG4gICAgaWYgKHR5cGVvZiBsYWJlbCA9PT0gXCJ1bmRlZmluZWRcIikgeyBsYWJlbCA9IFwiTlAtU0JKXCI7IH1cbiAgICBpZiAodHlwZW9mIHdvcmQgPT09IFwidW5kZWZpbmVkXCIpIHsgd29yZCA9IFwiKmNvblwiOyB9XG4gICAgaWYgKCEodGFyZ2V0IHx8IHNlbGVjdGlvbi5nZXQoKSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGFyZ2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGFyZ2V0ID0gc2VsZWN0aW9uLmdldCgpO1xuICAgIH1cblxuICAgIHVuZG8udW5kb0JlZ2luVHJhbnNhY3Rpb24oKTtcbiAgICB2YXIgaXNSb290TGV2ZWwgPSBmYWxzZTtcbiAgICBpZiAodXRpbHMuaXNSb290Tm9kZSgkKHRhcmdldCkpKSB7XG4gICAgICAgIGlzUm9vdExldmVsID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1bmRvLnRvdWNoVHJlZSgkKHRhcmdldCkpO1xuICAgIH1cblxuICAgIHZhciBsZW1tYSA9IFwiXCI7XG4gICAgdmFyIHRlbXAgPSB3b3JkLnNwbGl0KFwiLVwiKTtcbiAgICBpZiAodGVtcC5sZW5ndGggPiAxKSB7XG4gICAgICAgIGxlbW1hID0gdGVtcC5wb3AoKTtcbiAgICAgICAgd29yZCA9IHRlbXAuam9pbihcIi1cIik7XG4gICAgfVxuXG4gICAgdmFyIGRvQ29pbmRleCA9IGZhbHNlO1xuXG4gICAgaWYgKHNlbGVjdGlvbi5nZXQodHJ1ZSkpIHtcbiAgICAgICAgdmFyIHN0YXJ0Um9vdCA9IHV0aWxzLmdldFRva2VuUm9vdCgkKHNlbGVjdGlvbi5nZXQoKSkpO1xuICAgICAgICB2YXIgZW5kUm9vdCA9IHV0aWxzLmdldFRva2VuUm9vdCgkKHNlbGVjdGlvbi5nZXQodHJ1ZSkpKTtcbiAgICAgICAgaWYgKHN0YXJ0Um9vdCA9PT0gZW5kUm9vdCkge1xuICAgICAgICAgICAgd29yZCA9IFwiKklDSCpcIjtcbiAgICAgICAgICAgIGxhYmVsID0gdXRpbHMuZ2V0TGFiZWwoJChzZWxlY3Rpb24uZ2V0KHRydWUpKSk7XG4gICAgICAgICAgICBpZiAodXRpbHMuc3RhcnRzV2l0aChsYWJlbCwgXCJXXCIpKSB7XG4gICAgICAgICAgICAgICAgd29yZCA9IFwiKlQqXCI7XG4gICAgICAgICAgICAgICAgbGFiZWwgPSBsYWJlbC5zdWJzdHIoMSkucmVwbGFjZSgvLVswLTldKyQvLCBcIlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobGFiZWwuc3BsaXQoXCItXCIpLmluZGV4T2YoXCJDTFwiKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgd29yZCA9IFwiKkNMKlwiO1xuICAgICAgICAgICAgICAgIGxhYmVsID0gdXRpbHMuZ2V0TGFiZWwoJChzZWxlY3Rpb24uZ2V0KHRydWUpKSkucmVwbGFjZShcIi1DTFwiLCBcIlwiKTtcbiAgICAgICAgICAgICAgICBpZiAobGFiZWwuc3Vic3RyaW5nKDAsIDMpID09PSBcIlBST1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsID0gXCJOUFwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRvQ29pbmRleCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1bmRvLnVuZG9BYm9ydFRyYW5zYWN0aW9uKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbmV3bGVhZiA9IFwiPGRpdiBjbGFzcz0nc25vZGUgXCIgKyBsYWJlbCArIFwiJz5cIiArIGxhYmVsICsgXCI8c3BhbiBjbGFzcz0nd25vZGUnPlwiICsgd29yZDtcbiAgICBpZiAobGVtbWEgIT09IFwiXCIpIHtcbiAgICAgICAgbmV3bGVhZiArPSBcIjxzcGFuIGNsYXNzPSdsZW1tYSc+LVwiICsgbGVtbWEgKyBcIjwvc3Bhbj5cIjtcbiAgICB9XG4gICAgbmV3bGVhZiArPSBcIjwvc3Bhbj48L2Rpdj5cXG5cIjtcbiAgICB2YXIgbmV3bGVhZkpRID0gJChuZXdsZWFmKTtcbiAgICBpZiAoYmVmb3JlKSB7XG4gICAgICAgIG5ld2xlYWZKUS5pbnNlcnRCZWZvcmUodGFyZ2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBuZXdsZWFmSlEuaW5zZXJ0QWZ0ZXIodGFyZ2V0KTtcbiAgICB9XG4gICAgaWYgKGRvQ29pbmRleCkge1xuICAgICAgICBzZWxlY3Rpb24uc2V0KG5ld2xlYWZKUS5nZXQoMCkpO1xuICAgICAgICBleHBvcnRzLmNvSW5kZXgoKTtcbiAgICB9XG4gICAgc2VsZWN0aW9uLmNsZWFyKCk7XG4gICAgc2VsZWN0aW9uLmNsZWFyKHRydWUpO1xuICAgIHNlbGVjdGlvbi5zZWxlY3ROb2RlKG5ld2xlYWZKUS5nZXQoMCkpO1xuICAgIHNlbGVjdGlvbi51cGRhdGVTZWxlY3Rpb24oKTtcbiAgICBpZiAoaXNSb290TGV2ZWwpIHtcbiAgICAgICAgdW5kby5yZWdpc3Rlck5ld1Jvb3RUcmVlKG5ld2xlYWZKUSk7XG4gICAgfVxuICAgIHVuZG8udW5kb0VuZFRyYW5zYWN0aW9uKCk7XG59XG5leHBvcnRzLm1ha2VMZWFmID0gbWFrZUxlYWY7XG5cbi8qKlxuKiBDcmVhdGUgYSBsZWFmIG5vZGUgYmVmb3JlIHRoZSBzZWxlY3RlZCBub2RlLlxuKlxuKiBVc2VzIGhldXJpc3RpYyB0byBkZXRlcm1pbmUgd2hldGhlciB0aGUgbmV3IGxlYWYgaXMgdG8gYmUgYSB0cmFjZSwgZW1wdHlcbiogc3ViamVjdCwgZXRjLlxuKi9cbmZ1bmN0aW9uIGxlYWZCZWZvcmUoKSB7XG4gICAgZXhwb3J0cy5tYWtlTGVhZih0cnVlKTtcbn1cbmV4cG9ydHMubGVhZkJlZm9yZSA9IGxlYWZCZWZvcmU7XG5cbi8qKlxuKiBDcmVhdGUgYSBsZWFmIG5vZGUgYWZ0ZXIgdGhlIHNlbGVjdGVkIG5vZGUuXG4qXG4qIFVzZXMgaGV1cmlzdGljIHRvIGRldGVybWluZSB3aGV0aGVyIHRoZSBuZXcgbGVhZiBpcyB0byBiZSBhIHRyYWNlLCBlbXB0eVxuKiBzdWJqZWN0LCBldGMuXG4qL1xuZnVuY3Rpb24gbGVhZkFmdGVyKCkge1xuICAgIGV4cG9ydHMubWFrZUxlYWYoZmFsc2UpO1xufVxuZXhwb3J0cy5sZWFmQWZ0ZXIgPSBsZWFmQWZ0ZXI7XG47XG5cbi8qKlxuKiBDcmVhdGUgYSBwaHJhc2FsIG5vZGUuXG4qXG4qIFRoZSBub2RlIHdpbGwgZG9taW5hdGUgdGhlIHNlbGVjdGVkIG5vZGUgb3IgKGlmIHR3byBzaXN0ZXJzIGFyZSBzZWxlY3RlZClcbiogdGhlIHNlbGVjdGlvbiBhbmQgYWxsIGludGVydmVuaW5nIHNpc3RlcnMuXG4qXG4qIEBwYXJhbSB7U3RyaW5nfSBbbGFiZWxdIHRoZSBsYWJlbCB0byBnaXZlIHRoZSBuZXcgbm9kZSAoZGVmYXVsdDogWFApXG4qL1xuZnVuY3Rpb24gbWFrZU5vZGUobGFiZWwpIHtcbiAgICAvLyBjaGVjayBpZiBzb21ldGhpbmcgaXMgc2VsZWN0ZWRcbiAgICBpZiAoIXNlbGVjdGlvbi5nZXQoKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghbGFiZWwpIHtcbiAgICAgICAgbGFiZWwgPSBcIlhQXCI7XG4gICAgfVxuICAgIHZhciByb290TGV2ZWwgPSB1dGlscy5pc1Jvb3ROb2RlKCQoc2VsZWN0aW9uLmdldCgpKSk7XG4gICAgdW5kby51bmRvQmVnaW5UcmFuc2FjdGlvbigpO1xuICAgIGlmIChyb290TGV2ZWwpIHtcbiAgICAgICAgdW5kby5yZWdpc3RlckRlbGV0ZWRSb290VHJlZSgkKHNlbGVjdGlvbi5nZXQoKSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHVuZG8udG91Y2hUcmVlKCQoc2VsZWN0aW9uLmdldCgpKSk7XG4gICAgfVxuICAgIHZhciBwYXJlbnRfaXAgPSAkKHNlbGVjdGlvbi5nZXQoKSkucGFyZW50cyhcIiNzbjA+LnNub2RlLCNzbjBcIikuZmlyc3QoKTtcbiAgICB2YXIgcGFyZW50X2JlZm9yZSA9IHBhcmVudF9pcC5jbG9uZSgpO1xuICAgIHZhciBuZXdub2RlID0gJzxkaXYgY2xhc3M9XCJzbm9kZSAnICsgbGFiZWwgKyAnXCI+JyArIGxhYmVsICsgJyA8L2Rpdj5cXG4nO1xuXG4gICAgLy8gbWFrZSBlbmQgPSBzdGFydCBpZiBvbmx5IG9uZSBub2RlIGlzIHNlbGVjdGVkXG4gICAgaWYgKCFzZWxlY3Rpb24uZ2V0KHRydWUpKSB7XG4gICAgICAgIC8vIGlmIG9ubHkgb25lIG5vZGUsIHdyYXAgYXJvdW5kIHRoYXQgb25lXG4gICAgICAgICQoc2VsZWN0aW9uLmdldCgpKS53cmFwQWxsKG5ld25vZGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChzZWxlY3Rpb24uZ2V0KCkuY29tcGFyZURvY3VtZW50UG9zaXRpb24oc2VsZWN0aW9uLmdldCh0cnVlKSkgJiAweDIpIHtcbiAgICAgICAgICAgIC8vIHN0YXJ0bm9kZSBhbmQgZW5kbm9kZSBpbiB3cm9uZyBvcmRlciwgcmV2ZXJzZSB0aGVtXG4gICAgICAgICAgICB2YXIgdGVtcCA9IHNlbGVjdGlvbi5nZXQoKTtcbiAgICAgICAgICAgIHNlbGVjdGlvbi5zZXQoc2VsZWN0aW9uLmdldCh0cnVlKSk7XG4gICAgICAgICAgICBzZWxlY3Rpb24uc2V0KHRlbXAsIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgdGhleSBhcmUgcmVhbGx5IHNpc3RlcnMgWFhYWFhYWFhYWFhYWFhYXG4gICAgICAgIGlmICgkKHNlbGVjdGlvbi5nZXQoKSkuc2libGluZ3MoKS5pcyhzZWxlY3Rpb24uZ2V0KHRydWUpKSkge1xuICAgICAgICAgICAgLy8gdGhlbiwgY29sbGVjdCBzdGFydG5vZGUgYW5kIGl0cyBzaXN0ZXIgdXAgdW50aWwgZW5kbm9kZVxuICAgICAgICAgICAgdmFyIG9sZHRleHQgPSB1dGlscy5jdXJyZW50VGV4dChwYXJlbnRfaXApO1xuICAgICAgICAgICAgJChzZWxlY3Rpb24uZ2V0KCkpLmFkZCgkKHNlbGVjdGlvbi5nZXQoKSkubmV4dFVudGlsKCQoc2VsZWN0aW9uLmdldCh0cnVlKSkpKS5hZGQoJChzZWxlY3Rpb24uZ2V0KHRydWUpKSkud3JhcEFsbChuZXdub2RlKTtcblxuICAgICAgICAgICAgLy8gdW5kbyBpZiB0aGlzIG1lc3NlZCB1cCB0aGUgdGV4dCBvcmRlclxuICAgICAgICAgICAgaWYgKHV0aWxzLmN1cnJlbnRUZXh0KHBhcmVudF9pcCkgIT09IG9sZHRleHQpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBpcyB0aGlzIHBsYXVzaWJsZT8gY2FuIHdlIHJlbW92ZSB0aGUgY2hlY2s/XG4gICAgICAgICAgICAgICAgcGFyZW50X2lwLnJlcGxhY2VXaXRoKHBhcmVudF9iZWZvcmUpO1xuICAgICAgICAgICAgICAgIHVuZG8udW5kb0Fib3J0VHJhbnNhY3Rpb24oKTtcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb24uY2xlYXJTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgdG9zZWxlY3QgPSAkKHNlbGVjdGlvbi5nZXQoKSkucGFyZW50KCk7XG5cbiAgICBzZWxlY3Rpb24uY2xlYXJTZWxlY3Rpb24oKTtcblxuICAgIGlmIChyb290TGV2ZWwpIHtcbiAgICAgICAgdW5kby5yZWdpc3Rlck5ld1Jvb3RUcmVlKHRvc2VsZWN0KTtcbiAgICB9XG5cbiAgICB1bmRvLnVuZG9FbmRUcmFuc2FjdGlvbigpO1xuXG4gICAgc2VsZWN0aW9uLnNlbGVjdE5vZGUodG9zZWxlY3QuZ2V0KDApKTtcbiAgICBzZWxlY3Rpb24udXBkYXRlU2VsZWN0aW9uKCk7XG59XG5leHBvcnRzLm1ha2VOb2RlID0gbWFrZU5vZGU7XG5cbi8vICogTGFiZWwgbWFuaXB1bGF0aW9uXG4vKipcbiogVG9nZ2xlIGEgZGFzaCB0YWcgb24gYSBub2RlXG4qXG4qIElmIHRoZSBub2RlIGJlYXJzIHRoZSBnaXZlbiBkYXNoIHRhZywgcmVtb3ZlIGl0LiAgSWYgbm90LCBhZGQgaXQuICBUaGlzXG4qIGZ1bmN0aW9uIGF0dGVtcHRzIHRvIHB1dCBtdWx0aXBsZSBkYXNoIHRhZ3MgaW4gdGhlIHByb3BlciBvcmRlciwgYWNjb3JkaW5nXG4qIHRvIHRoZSBjb25maWd1cmF0aW9uIGluIHRoZSBgbGVhZl9leHRlbnNpb25zYCwgYGV4dGVuc2lvbnNgLCBhbmRcbiogYGNsYXVzZV9leHRlbnNpb25zYCB2YXJpYWJsZXMgaW4gdGhlIGBzZXR0aW5ncy5qc2AgZmlsZS5cbipcbiogQHBhcmFtIHtTdHJpbmd9IGV4dGVuc2lvbiB0aGUgZGFzaCB0YWcgdG8gdG9nZ2xlXG4qIEBwYXJhbSB7U3RyaW5nW119IFtleHRlbnNpb25MaXN0XSBvdmVycmlkZSB0aGUgZ3Vlc3MgYXMgdG8gdGhlXG4qIGFwcHJvcHJpYXRlIG9yZGVyZWQgbGlzdCBvZiBwb3NzaWJsZSBleHRlbnNpb25zLlxuKi9cbmZ1bmN0aW9uIHRvZ2dsZUV4dGVuc2lvbihleHRlbnNpb24sIGV4dGVuc2lvbkxpc3QpIHtcbiAgICBpZiAoc2VsZWN0aW9uLmNhcmRpbmFsaXR5KCkgIT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghZXh0ZW5zaW9uTGlzdCkge1xuICAgICAgICBpZiAodXRpbHMuZ3Vlc3NMZWFmTm9kZShzZWxlY3Rpb24uZ2V0KCkpKSB7XG4gICAgICAgICAgICBleHRlbnNpb25MaXN0ID0gY29uZi5sZWFmRXh0ZW5zaW9ucztcbiAgICAgICAgfSBlbHNlIGlmICh1dGlscy5nZXRMYWJlbCgkKHNlbGVjdGlvbi5nZXQoKSkpLnNwbGl0KFwiLVwiKVswXSA9PT0gXCJJUFwiIHx8IHV0aWxzLmdldExhYmVsKCQoc2VsZWN0aW9uLmdldCgpKSkuc3BsaXQoXCItXCIpWzBdID09PSBcIkNQXCIpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IHNob3VsZCBGUkFHIGJlIGEgY2xhdXNlP1xuICAgICAgICAgICAgLy8gVE9ETzogbWFrZSBjb25maWd1cmFibGVcbiAgICAgICAgICAgIGV4dGVuc2lvbkxpc3QgPSBjb25mLmNsYXVzZUV4dGVuc2lvbnM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHRlbnNpb25MaXN0ID0gY29uZi5leHRlbnNpb25zO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gVHJpZWQgdG8gdG9nZ2xlIGFuIGV4dGVuc2lvbiBvbiBhbiBpbmFwcGxpY2FibGUgbm9kZS5cbiAgICBpZiAoZXh0ZW5zaW9uTGlzdC5pbmRleE9mKGV4dGVuc2lvbikgPCAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB1bmRvLnRvdWNoVHJlZSgkKHNlbGVjdGlvbi5nZXQoKSkpO1xuICAgIHZhciB0ZXh0bm9kZSA9IHV0aWxzLnRleHROb2RlKCQoc2VsZWN0aW9uLmdldCgpKSk7XG4gICAgdmFyIG9sZGxhYmVsID0gJC50cmltKHRleHRub2RlLnRleHQoKSk7XG5cbiAgICAvLyBFeHRlbnNpb24gaXMgbm90IGRlLWRhc2hlZCBoZXJlLiAgdG9nZ2xlU3RyaW5nRXh0ZW5zaW9uIGhhbmRsZXMgaXQuXG4gICAgLy8gVGhlIG5ldyBjb25maWcgZm9ybWF0IGhvd2V2ZXIgcmVxdWlyZXMgYSBkYXNoLWxlc3MgZXh0ZW5zaW9uLlxuICAgIHZhciBuZXdsYWJlbCA9IHV0aWxzLnRvZ2dsZVN0cmluZ0V4dGVuc2lvbihvbGRsYWJlbCwgZXh0ZW5zaW9uLCBleHRlbnNpb25MaXN0KTtcbiAgICB0ZXh0bm9kZS5yZXBsYWNlV2l0aChuZXdsYWJlbCArIFwiIFwiKTtcbiAgICB1dGlscy51cGRhdGVDc3NDbGFzcygkKHNlbGVjdGlvbi5nZXQoKSksIG9sZGxhYmVsKTtcblxuICAgIHJldHVybiB0cnVlO1xufVxuZXhwb3J0cy50b2dnbGVFeHRlbnNpb24gPSB0b2dnbGVFeHRlbnNpb247XG5cbi8qKlxuKiBTZXQgdGhlIGxhYmVsIG9mIGEgbm9kZSBpbnRlbGxpZ2VudGx5XG4qXG4qIEdpdmVuIGEgbGlzdCBvZiBsYWJlbHMsIHRoaXMgZnVuY3Rpb24gd2lsbCBhdHRlbXB0IHRvIGZpbmQgdGhlIG5vZGUnc1xuKiBjdXJyZW50IGxhYmVsIGluIHRoZSBsaXN0LiAgSWYgaXQgaXMgc3VjY2Vzc2Z1bCwgaXQgc2V0cyB0aGUgbm9kZSdzIGxhYmVsXG4qIHRvIHRoZSBuZXh0IGxhYmVsIGluIHRoZSBsaXN0IChvciB0aGUgZmlyc3QsIGlmIHRoZSBub2RlJ3MgY3VycmVudCBsYWJlbCBpc1xuKiB0aGUgbGFzdCBpbiB0aGUgbGlzdCkuICBJZiBub3QsIGl0IHNldHMgdGhlIGxhYmVsIHRvIHRoZSBmaXJzdCBsYWJlbCBpbiB0aGVcbiogbGlzdC5cbipcbiogQHBhcmFtIGxhYmVscyBhIGxpc3Qgb2YgbGFiZWxzLiAgVGhpcyBjYW4gYWxzbyBiZSBhbiBvYmplY3QgLS0gaWYgc28sIHRoZVxuKiBiYXNlIGxhYmVsICh3aXRob3V0IGFueSBkYXNoIHRhZ3MpIG9mIHRoZSB0YXJnZXQgbm9kZSBpcyBsb29rZWQgdXAgYXMgYVxuKiBrZXksIGFuZCBpdHMgY29ycmVzcG9uZGluZyB2YWx1ZSBpcyB1c2VkIGFzIHRoZSBsaXN0LiAgSWYgdGhlcmUgaXMgbm8gdmFsdWVcbiogZm9yIHRoYXQga2V5LCB0aGUgZmlyc3QgdmFsdWUgc3BlY2lmaWVkIGluIHRoZSBvYmplY3QgaXMgdGhlIGRlZmF1bHQuXG4qL1xuZnVuY3Rpb24gc2V0TGFiZWwobGFiZWxzKSB7XG4gICAgaWYgKHNlbGVjdGlvbi5jYXJkaW5hbGl0eSgpICE9PSAxKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgdGV4dG5vZGUgPSB1dGlscy50ZXh0Tm9kZSgkKHNlbGVjdGlvbi5nZXQoKSkpO1xuICAgIHZhciBvbGRsYWJlbCA9ICQudHJpbSh0ZXh0bm9kZS50ZXh0KCkpO1xuICAgIHZhciBuZXdsYWJlbCA9IHV0aWxzLmxvb2t1cE5leHRMYWJlbChvbGRsYWJlbCwgbGFiZWxzKTtcblxuICAgIC8vIFRPRE86IHJlc3RvcmVcbiAgICAvLyBpZiAodXRpbHMuZ3Vlc3NMZWFmTm9kZSgkKHNlbGVjdGlvbi5nZXQoKSkpKSB7XG4gICAgLy8gICAgIGlmICh0eXBlb2YgdGVzdFZhbGlkTGVhZkxhYmVsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgLy8gICAgICAgICBpZiAoIXRlc3RWYWxpZExlYWZMYWJlbChuZXdsYWJlbCkpIHtcbiAgICAvLyAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgIH1cbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgICBpZiAodHlwZW9mIHRlc3RWYWxpZFBocmFzZUxhYmVsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgLy8gICAgICAgICBpZiAoIXRlc3RWYWxpZFBocmFzZUxhYmVsKG5ld2xhYmVsKSkge1xuICAgIC8vICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgfVxuICAgIC8vIH1cbiAgICB1bmRvLnRvdWNoVHJlZSgkKHNlbGVjdGlvbi5nZXQoKSkpO1xuXG4gICAgdGV4dG5vZGUucmVwbGFjZVdpdGgobmV3bGFiZWwgKyBcIiBcIik7XG4gICAgdXRpbHMudXBkYXRlQ3NzQ2xhc3MoJChzZWxlY3Rpb24uZ2V0KCkpLCBvbGRsYWJlbCk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn1cbmV4cG9ydHMuc2V0TGFiZWwgPSBzZXRMYWJlbDtcbiIsIi8vLzxyZWZlcmVuY2UgcGF0aD1cIi4vLi4vLi4vLi4vdHlwZXMvYWxsLmQudHNcIiAvPlxudmFyICQgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xudmFyIF8gPSByZXF1aXJlKFwibG9kYXNoXCIpO1xudmFyIHNlbGVjdGlvbiA9IHJlcXVpcmUoXCIuL3NlbGVjdGlvblwiKTtcbnZhciBzdGFydHVwID0gcmVxdWlyZShcIi4vc3RhcnR1cFwiKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuXG52YXIgbG9nZ2VyID0gcmVxdWlyZShcIi4uL3VpL2xvZ1wiKTtcblxuXG4vLyBUT0RPOiB0eXBlIGRlY2xzIVxudmFyIHVuZG9NYXAsIHVuZG9OZXdUcmVlcywgdW5kb0RlbGV0ZWRUcmVlcywgdW5kb1N0YWNrID0gW10sIHJlZG9TdGFjayA9IFtdLCB1bmRvVHJhbnNhY3Rpb25TdGFjayA9IFtdO1xuXG52YXIgaWROdW1iZXIgPSAxO1xuXG4vKipcbiogUmVzZXQgdGhlIHVuZG8gc3lzdGVtLlxuKlxuKiBUaGlzIGZ1bmN0aW9uIHJlbW92ZXMgYW55IGludGVybWVkaWF0ZSBzdGF0ZSB0aGUgdW5kbyBzeXN0ZW0gaGFzIHN0b3JlZDsgaXRcbiogZG9lcyBub3QgYWZmZWN0IHRoZSB1bmRvIGhpc3RvcnkuXG4qIEBwcml2YXRlXG4qL1xuZnVuY3Rpb24gcmVzZXRVbmRvKCkge1xuICAgIHVuZG9NYXAgPSB7fTtcbiAgICB1bmRvTmV3VHJlZXMgPSBbXTtcbiAgICB1bmRvRGVsZXRlZFRyZWVzID0gW107XG4gICAgdW5kb1RyYW5zYWN0aW9uU3RhY2sgPSBbXTtcbn1cbmV4cG9ydHMucmVzZXRVbmRvID0gcmVzZXRVbmRvO1xuXG4vKipcbiogUmVzZXQgdGhlIHVuZG8gc3lzdGVtIGVudGlyZWx5LlxuKlxuKiBUaGlzIGZ1bmN0aW9uIHplcm9lcyBvdXQgYW55IHVuZG8gaGlzdG9yeS5cbiovXG5mdW5jdGlvbiBudWtlVW5kbygpIHtcbiAgICBleHBvcnRzLnJlc2V0VW5kbygpO1xuICAgIHVuZG9TdGFjayA9IFtdO1xuICAgIHJlZG9TdGFjayA9IFtdO1xufVxuZXhwb3J0cy5udWtlVW5kbyA9IG51a2VVbmRvO1xuXG4vKipcbiogUmVjb3JkIGFuIHVuZG8gc3RlcC5cbiogQHByaXZhdGVcbiovXG5mdW5jdGlvbiB1bmRvQmFycmllcigpIHtcbiAgICBpZiAoXy5zaXplKHVuZG9NYXApID09PSAwICYmIF8uc2l6ZSh1bmRvTmV3VHJlZXMpID09PSAwICYmIF8uc2l6ZSh1bmRvRGVsZXRlZFRyZWVzKSA9PT0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHVuZG9TdGFjay5wdXNoKHtcbiAgICAgICAgbWFwOiB1bmRvTWFwLFxuICAgICAgICBuZXdUcjogdW5kb05ld1RyZWVzLFxuICAgICAgICBkZWxUcjogdW5kb0RlbGV0ZWRUcmVlc1xuICAgIH0pO1xuICAgIGV4cG9ydHMucmVzZXRVbmRvKCk7XG4gICAgcmVkb1N0YWNrID0gW107XG59XG5leHBvcnRzLnVuZG9CYXJyaWVyID0gdW5kb0JhcnJpZXI7XG5cbi8qKlxuKiBCZWdpbiBhbiB1bmRvIHRyYW5zYWN0aW9uLlxuKlxuKiBUaGlzIGZ1bmN0aW9uIE1VU1QgYmUgbWF0Y2hlZCBieSBhIGNhbGwgdG8gZWl0aGVyIGB1bmRvRW5kVHJhbnNhY3Rpb25gXG4qICh3aGljaCBrZWVwcyBhbGwgaW50ZXJtZWRpYXRlIHN0ZXBzIHNpbmNlIHRoZSBzdGFydCBjYWxsKSBvclxuKiBgdW5kb0Fib3J0VHJhbnNhY3Rpb25gICh3aGljaCBkaXNjYXJkcyBzYWlkIHN0ZXBzKS5cbiovXG5mdW5jdGlvbiB1bmRvQmVnaW5UcmFuc2FjdGlvbigpIHtcbiAgICB1bmRvVHJhbnNhY3Rpb25TdGFjay5wdXNoKHtcbiAgICAgICAgbWFwOiB1bmRvTWFwLFxuICAgICAgICBuZXdUcjogdW5kb05ld1RyZWVzLFxuICAgICAgICBkZWxUcjogdW5kb0RlbGV0ZWRUcmVlc1xuICAgIH0pO1xufVxuZXhwb3J0cy51bmRvQmVnaW5UcmFuc2FjdGlvbiA9IHVuZG9CZWdpblRyYW5zYWN0aW9uO1xuXG4vKipcbiogRW5kIGFuIHVuZG8gdHJhbnNhY3Rpb24sIGtlZXBpbmcgaXRzIGNoYW5nZXNcbiovXG5mdW5jdGlvbiB1bmRvRW5kVHJhbnNhY3Rpb24oKSB7XG4gICAgdW5kb1RyYW5zYWN0aW9uU3RhY2sucG9wKCk7XG59XG5leHBvcnRzLnVuZG9FbmRUcmFuc2FjdGlvbiA9IHVuZG9FbmRUcmFuc2FjdGlvbjtcblxuLyoqXG4qIEVuZCBhbiB1bmRvIHRyYW5zYWN0aW9uLCBkaXNjYXJkaW5nIGl0cyBjaGFuZ2VzXG4qL1xuZnVuY3Rpb24gdW5kb0Fib3J0VHJhbnNhY3Rpb24oKSB7XG4gICAgdmFyIHQgPSB1bmRvVHJhbnNhY3Rpb25TdGFjay5wb3AoKTtcbiAgICB1bmRvTWFwID0gdC5tYXA7XG4gICAgdW5kb05ld1RyZWVzID0gdC5uZXdUcjtcbiAgICB1bmRvRGVsZXRlZFRyZWVzID0gdC5kZWxUcjtcbn1cbmV4cG9ydHMudW5kb0Fib3J0VHJhbnNhY3Rpb24gPSB1bmRvQWJvcnRUcmFuc2FjdGlvbjtcblxuLyoqXG4qIEV4ZWN1dGUgYSBmdW5jdGlvbiwgZGlzY2FyZGluZyB3aGF0ZXZlciBlZmZlY3RzIGl0IGhhcyBvbiB0aGUgdW5kbyBzeXN0ZW0uXG4qXG4qIEBwYXJhbSB7RnVuY3Rpb259IGZuIGEgZnVuY3Rpb24gdG8gZXhlY3V0ZVxuKlxuKiBAcmV0dXJucyB0aGUgcmVzdWx0IG9mIGBmbmBcbiovXG5mdW5jdGlvbiBpZ25vcmluZ1VuZG8oZm4pIHtcbiAgICAvLyBhIGJpdCBvZiBhIGdyaW0gaGFjaywgYnV0IGl0IHdvcmtzXG4gICAgZXhwb3J0cy51bmRvQmVnaW5UcmFuc2FjdGlvbigpO1xuICAgIHZhciByZXMgPSBmbigpO1xuICAgIGV4cG9ydHMudW5kb0Fib3J0VHJhbnNhY3Rpb24oKTtcbiAgICByZXR1cm4gcmVzO1xufVxuZXhwb3J0cy5pZ25vcmluZ1VuZG8gPSBpZ25vcmluZ1VuZG87XG5cbi8qKlxuKiBJbmZvcm0gdGhlIHVuZG8gc3lzdGVtIHRoYXQgY2hhbmdlcyBhcmUgYmVpbmcgbWFkZS5cbipcbiogQHBhcmFtIHtKUXVlcnl9IG5vZGUgdGhlIG5vZGUgaW4gd2hpY2ggY2hhbmdlcyBhcmUgYmVpbmcgbWFkZVxuKi9cbmZ1bmN0aW9uIHRvdWNoVHJlZShub2RlKSB7XG4gICAgdmFyIHJvb3QgPSAkKHV0aWxzLmdldFRva2VuUm9vdChub2RlKSk7XG4gICAgaWYgKCF1bmRvTWFwW3Jvb3QucHJvcChcImlkXCIpXSkge1xuICAgICAgICB1bmRvTWFwW3Jvb3QucHJvcChcImlkXCIpXSA9IHJvb3QuY2xvbmUoKTtcbiAgICB9XG59XG5leHBvcnRzLnRvdWNoVHJlZSA9IHRvdWNoVHJlZTtcbjtcblxuLyoqXG4qIEluZm9ybSB0aGUgdW5kbyBzeXN0ZW0gb2YgdGhlIGFkZGl0aW9uIG9mIGEgbmV3IHRyZWUgYXQgdGhlIHJvb3QgbGV2ZWwuXG4qXG4qIEBwYXJhbSB7SlF1ZXJ5fSB0cmVlIHRoZSB0cmVlIGJlaW5nIGFkZGVkXG4qL1xuZnVuY3Rpb24gcmVnaXN0ZXJOZXdSb290VHJlZSh0cmVlKSB7XG4gICAgdmFyIG5ld2lkID0gXCJpZFwiICsgaWROdW1iZXI7XG4gICAgaWROdW1iZXIrKztcbiAgICB1bmRvTmV3VHJlZXMucHVzaChuZXdpZCk7XG4gICAgdHJlZS5wcm9wKFwiaWRcIiwgbmV3aWQpO1xufVxuZXhwb3J0cy5yZWdpc3Rlck5ld1Jvb3RUcmVlID0gcmVnaXN0ZXJOZXdSb290VHJlZTtcbjtcblxuLyoqXG4qIEluZm9ybSB0aGUgdW5kbyBzeXN0ZW0gb2YgYSB0cmVlJ3MgcmVtb3ZhbCBhdCB0aGUgcm9vdCBsZXZlbFxuKlxuKiBAcGFyYW0ge0pRdWVyeX0gdHJlZSB0aGUgdHJlZSBiZWluZyByZW1vdmVkXG4qL1xuZnVuY3Rpb24gcmVnaXN0ZXJEZWxldGVkUm9vdFRyZWUodHJlZSkge1xuICAgIHZhciBwcmV2ID0gdHJlZS5wcmV2KCk7XG4gICAgaWYgKHByZXYubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHByZXYgPSBudWxsO1xuICAgIH1cbiAgICB1bmRvRGVsZXRlZFRyZWVzLnB1c2goe1xuICAgICAgICB0cmVlOiB0cmVlLFxuICAgICAgICBiZWZvcmU6IHByZXYgJiYgcHJldi5wcm9wKFwiaWRcIilcbiAgICB9KTtcbn1cbmV4cG9ydHMucmVnaXN0ZXJEZWxldGVkUm9vdFRyZWUgPSByZWdpc3RlckRlbGV0ZWRSb290VHJlZTtcblxuLyoqXG4qIFBlcmZvcm0gYW4gdW5kbyBvcGVyYXRpb24uXG4qXG4qIFRoaXMgaXMgYSB3b3JrZXIgZnVuY3Rpb24sIHdyYXBwZWQgYnkgYHVuZG9gIGFuZCBgcmVkb2AuXG4qIEBwcml2YXRlXG4qL1xuLy8gVE9ETzogYWN0dWFsIHR5cGVcbmZ1bmN0aW9uIGRvVW5kbyh1bmRvRGF0YSkge1xuICAgIC8vIFRoZSBmb2xsb3dpbmcgaGludCB0byB0aGUgdHlwZSBvZiBtYXAgaXMgbmVlZGVkIGJ5IHRoZSBjb21waWxlcixcbiAgICAvLyBhcHBhcmVudGx5XG4gICAgdmFyIG1hcCA9IHt9LCBuZXdUciA9IFtdLCBkZWxUciA9IFtdO1xuXG4gICAgXy5mb3JFYWNoKHVuZG9EYXRhLm1hcCwgZnVuY3Rpb24gKHYsIGspIHtcbiAgICAgICAgdmFyIHRoZU5vZGUgPSAkKFwiI1wiICsgayk7XG4gICAgICAgIG1hcFtrXSA9IHRoZU5vZGUuY2xvbmUoKTtcbiAgICAgICAgdGhlTm9kZS5yZXBsYWNlV2l0aCh2KTtcbiAgICB9KTtcblxuICAgIC8vIEFkZCBiYWNrIHRoZSBkZWxldGVkIHRyZWVzIGJlZm9yZSByZW1vdmluZyB0aGUgbmV3IHRyZWVzLCBqdXN0IGluIGNhc2VcbiAgICAvLyB0aGUgaW5zZXJ0aW9uIHBvaW50IG9mIG9uZSBvZiB0aGVzZSBpcyBnb2luZyB0byBnZXQgemFwcGVkLiAgVGhpc1xuICAgIC8vIHNob3VsZG4ndCBoYXBwZW4sIHRob3VnaC5cbiAgICBfLmZvckVhY2godW5kb0RhdGEuZGVsVHIsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIHZhciBwcmV2ID0gdi5iZWZvcmU7XG4gICAgICAgIGlmIChwcmV2KSB7XG4gICAgICAgICAgICB2LnRyZWUuaW5zZXJ0QWZ0ZXIoJChcIiNcIiArIHByZXYpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHYudHJlZS5wcmVwZW5kVG8oJChcIiNzbjBcIikpO1xuICAgICAgICB9XG4gICAgICAgIG5ld1RyLnB1c2godi50cmVlLnByb3AoXCJpZFwiKSk7XG4gICAgfSk7XG5cbiAgICBfLmZvckVhY2godW5kb0RhdGEubmV3VHIsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIHZhciB0aGVOb2RlID0gJChcIiNcIiArIHYpO1xuICAgICAgICB2YXIgcHJldiA9IHRoZU5vZGUucHJldigpO1xuICAgICAgICBpZiAocHJldi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHByZXYgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGRlbFRyLnB1c2goe1xuICAgICAgICAgICAgdHJlZTogdGhlTm9kZS5jbG9uZSgpLFxuICAgICAgICAgICAgYmVmb3JlOiBwcmV2ICYmIHByZXYucHJvcChcImlkXCIpXG4gICAgICAgIH0pO1xuICAgICAgICB0aGVOb2RlLnJlbW92ZSgpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbWFwOiBtYXAsXG4gICAgICAgIG5ld1RyOiBuZXdUcixcbiAgICAgICAgZGVsVHI6IGRlbFRyXG4gICAgfTtcbn1cblxuLyoqXG4qIFBlcmZvcm0gdW5kby5cbiovXG5mdW5jdGlvbiB1bmRvKCkge1xuICAgIGlmICh1bmRvU3RhY2subGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGxvZ2dlci53YXJuaW5nKFwiTm8gZnVydGhlciB1bmRvIGluZm9ybWF0aW9uXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBsYXN0VW5kbyA9IHVuZG9TdGFjay5wb3AoKTtcbiAgICByZWRvU3RhY2sucHVzaChkb1VuZG8obGFzdFVuZG8pKTtcbiAgICBzZWxlY3Rpb24uY2xlYXJTZWxlY3Rpb24oKTtcbiAgICBzZWxlY3Rpb24udXBkYXRlU2VsZWN0aW9uKCk7XG59XG5leHBvcnRzLnVuZG8gPSB1bmRvO1xuO1xuXG4vKipcbiogUGVyZm9ybSByZWRvLlxuKi9cbmZ1bmN0aW9uIHJlZG8oKSB7XG4gICAgaWYgKHJlZG9TdGFjay5sZW5ndGggPT09IDApIHtcbiAgICAgICAgbG9nZ2VyLndhcm5pbmcoXCJObyBmdXJ0aGVyIHJlZG8gaW5mb3JtYXRpb25cIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdW5kb1N0YWNrLnB1c2goZG9VbmRvKHJlZG9TdGFjay5wb3AoKSkpO1xuICAgIHNlbGVjdGlvbi5jbGVhclNlbGVjdGlvbigpO1xuICAgIHNlbGVjdGlvbi51cGRhdGVTZWxlY3Rpb24oKTtcbn1cbmV4cG9ydHMucmVkbyA9IHJlZG87XG47XG5cbmZ1bmN0aW9uIHByZXBhcmVVbmRvSWRzKCkge1xuICAgICQoXCIjc24wPi5zbm9kZVwiKS5tYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICAkKHRoaXMpLnByb3AoXCJpZFwiLCBcImlkXCIgKyBpZE51bWJlcik7XG4gICAgICAgIGlkTnVtYmVyKys7XG4gICAgfSk7XG4gICAgZXhwb3J0cy5udWtlVW5kbygpO1xufVxuXG5zdGFydHVwLmFkZFN0YXJ0dXBIb29rKHByZXBhcmVVbmRvSWRzKTtcbiIsIi8vLzxyZWZlcmVuY2UgcGF0aD1cIi4vLi4vLi4vLi4vdHlwZXMvYWxsLmQudHNcIiAvPlxuLy8gQ29weXJpZ2h0IChjKSAyMDEyIEFudG9uIEthcmwgSW5nYXNvbiwgQWFyb24gRWNheSwgSmFuYSBCZWNrXG4vLyBUaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgQW5ub3RhbGQgcHJvZ3JhbSBmb3IgYW5ub3RhdGluZ1xuLy8gcGhyYXNlLXN0cnVjdHVyZSB0cmVlYmFua3MgaW4gdGhlIFBlbm4gVHJlZWJhbmsgc3R5bGUuXG4vLyBUaGlzIGZpbGUgaXMgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbFxuLy8gUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5IHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlclxuLy8gdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuLy8gVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dFxuLy8gV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuLy8gTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiBTZWUgdGhlIEdOVSBMZXNzZXJcbi8vIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbi8vIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWNcbi8vIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZVxuLy8gPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxudmFyICQgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xudmFyIF8gPSByZXF1aXJlKFwibG9kYXNoXCIpO1xuXG52YXIgZHVtbXk7XG52YXIgY29uZiA9IHJlcXVpcmUoXCIuL2NvbmZpZ1wiKTtcbmR1bW15ID0gcmVxdWlyZShcIi4vY29uZmlnLnRzXCIpO1xudmFyIHVuZG8gPSByZXF1aXJlKFwiLi91bmRvXCIpO1xuZHVtbXkgPSByZXF1aXJlKFwiLi91bmRvLnRzXCIpO1xudmFyIG1ldGFkYXRhID0gcmVxdWlyZShcIi4vbWV0YWRhdGFcIik7XG5kdW1teSA9IHJlcXVpcmUoXCIuL21ldGFkYXRhLnRzXCIpO1xuXG5mdW5jdGlvbiBzdGFydHNXaXRoKGEsIGIpIHtcbiAgICByZXR1cm4gKGEuc3Vic3RyKDAsIGIubGVuZ3RoKSA9PT0gYik7XG59XG5leHBvcnRzLnN0YXJ0c1dpdGggPSBzdGFydHNXaXRoO1xuXG5mdW5jdGlvbiBlbmRzV2l0aChhLCBiKSB7XG4gICAgcmV0dXJuIChhLnN1YnN0cihhLmxlbmd0aCAtIGIubGVuZ3RoKSA9PT0gYik7XG59XG5leHBvcnRzLmVuZHNXaXRoID0gZW5kc1dpdGg7XG5cbi8qXG4qIFV0aWxpdHkgZnVuY3Rpb25zIGZvciBBbm5vdGFsZC5cbiovXG4vLyBUT0RPczogbWFyayBAcHJpdmF0ZXMgYXBwcm9wcmlhdGVseSwgY29uc2lkZXIgbmFtaW5nIHNjaGVtZSBmb3IgZG9tIHZzIEpRIGFyZ3Ncbi8vICogVUkgaGVscGVyIGZ1bmN0aW9uc1xudmFyIG1lc3NhZ2VIaXN0b3J5ID0gXCJcIjtcblxuLyoqXG4qIExvZyB0aGUgbWVzc2FnZSBpbiB0aGUgbWVzc2FnZSBoaXN0b3J5LlxuKiBAcHJpdmF0ZVxuKi9cbmZ1bmN0aW9uIGxvZ01lc3NhZ2UobXNnKSB7XG4gICAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICAgIG1lc3NhZ2VIaXN0b3J5ICs9IGQudG9VVENTdHJpbmcoKSArIFwiOiBcIiArICQoXCI8ZGl2PlwiICsgbXNnICsgXCI8L2Rpdj5cIikudGV4dCgpICsgXCJcXG5cIjtcbn1cbmV4cG9ydHMubG9nTWVzc2FnZSA9IGxvZ01lc3NhZ2U7XG5cbi8qKlxuKiBTY3JvbGwgdG8gZGlzcGxheSB0aGUgbmV4dCBwbGFjZSBpbiB0aGUgZG9jdW1lbnQgbWF0Y2hpbmcgYSBzZWxlY3Rvci5cbipcbiogSWYgbm8gbWF0Y2hlcywgZG8gbm90aGluZy5cbipcbiogQHJldHVybnMge0pRdWVyeX0gdGhlIG5vZGUgc2Nyb2xsZWQgdG8sIG9yIGB1bmRlZmluZWRgIGlmIG5vbmUuXG4qL1xuZnVuY3Rpb24gc2Nyb2xsVG9OZXh0KHNlbGVjdG9yKSB7XG4gICAgdmFyIGRvY1ZpZXdUb3AgPSAkKHdpbmRvdykuc2Nyb2xsVG9wKCk7XG4gICAgdmFyIG5leHRFcnJvciA9ICQoc2VsZWN0b3IpLmZpbHRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIE1hZ2ljIG51bWJlciBhbGVydCEgIE5vdCBzdXJlIGlmIHRoZSArNSBpcyBuZWVkZWQuLi5cbiAgICAgICAgcmV0dXJuICQodGhpcykub2Zmc2V0KCkudG9wID4gZG9jVmlld1RvcCArIDU7XG4gICAgfSkuZmlyc3QoKTtcbiAgICBpZiAobmV4dEVycm9yLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB3aW5kb3cuc2Nyb2xsKDAsIG5leHRFcnJvci5vZmZzZXQoKS50b3ApO1xuICAgICAgICByZXR1cm4gbmV4dEVycm9yO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufVxuZXhwb3J0cy5zY3JvbGxUb05leHQgPSBzY3JvbGxUb05leHQ7XG5cbi8qKlxuKiBVcGRhdGUgdGhlIENTUyBjbGFzcyBvZiBhIG5vZGUgdG8gcmVmbGVjdCBpdHMgbGFiZWwuXG4qXG4qIEBwYXJhbSB7SlF1ZXJ5fSBub2RlXG4qIEBwYXJhbSB7U3RyaW5nfSBvbGRsYWJlbCAob3B0aW9uYWwpIHRoZSBmb3JtZXIgbGFiZWwgb2YgdGhpcyBub2RlXG4qL1xuZnVuY3Rpb24gdXBkYXRlQ3NzQ2xhc3Mobm9kZSwgb2xkbGFiZWwpIHtcbiAgICBpZiAoIW5vZGUuaGFzQ2xhc3MoXCJzbm9kZVwiKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghb2xkbGFiZWwpIHtcbiAgICAgICAgLy8gb2xkbGFiZWwgd2Fzbid0IHN1cHBsaWVkIC0tIHRyeSB0byBndWVzc1xuICAgICAgICBvbGRsYWJlbCA9IF8uZmluZChub2RlLnByb3AoXCJjbGFzc1wiKS5zcGxpdChcIiBcIiksIGZ1bmN0aW9uIChzKSB7XG4gICAgICAgICAgICByZXR1cm4gKC9bQS1aLV0vKS50ZXN0KHMpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbm9kZS5yZW1vdmVDbGFzcyhvbGRsYWJlbCk7XG4gICAgbm9kZS5hZGRDbGFzcyhleHBvcnRzLmdldExhYmVsKG5vZGUpKTtcbn1cbmV4cG9ydHMudXBkYXRlQ3NzQ2xhc3MgPSB1cGRhdGVDc3NDbGFzcztcblxuLy8gKiBGdW5jdGlvbnMgb24gbm9kZSByZXByZXNlbnRhdGlvblxuLy8gKiogUHJlZGljYXRlc1xuLyoqXG4qIEluZGljYXRlIHdoZXRoZXIgYSBub2RlIGhhcyBhIGxlbW1hIGFzc29jaWF0ZWQgd2l0aCBpdC5cbipcbiogQHBhcmFtIHtKUXVlcnl9IG5vZGVcbiogQHJldHVybnMge0Jvb2xlYW59XG4qIEBwcml2YXRlXG4qL1xuLy8gVE9ETzogaXMgcHJpdmF0ZSByaWdodCBmb3IgdGhpcyBvbmU/XG5mdW5jdGlvbiBoYXNMZW1tYShub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUuY2hpbGRyZW4oXCIud25vZGVcIikuY2hpbGRyZW4oXCIubGVtbWFcIikubGVuZ3RoID09PSAxO1xufVxuZXhwb3J0cy5oYXNMZW1tYSA9IGhhc0xlbW1hO1xuO1xuXG4vKipcbiogVGVzdCB3aGV0aGVyIGEgbm9kZSBpcyBhIHB1cmVseSBzdHJ1Y3R1cmFsIGxlYWYuXG4qXG4qIEBwYXJhbSB7Tm9kZX0gbm9kZSB0aGUgbm9kZSB0byBvcGVyYXRlIG9uXG4qL1xuZnVuY3Rpb24gaXNMZWFmTm9kZShub2RlKSB7XG4gICAgcmV0dXJuICQobm9kZSkuY2hpbGRyZW4oXCIud25vZGVcIikubGVuZ3RoID4gMDtcbn1cbmV4cG9ydHMuaXNMZWFmTm9kZSA9IGlzTGVhZk5vZGU7XG5cbi8qKlxuKiBUZXN0IHdoZXRoZXIgYSBnaXZlbiBub2RlIGlzIGVtcHR5LCBpLmUuIGEgdHJhY2UsIGNvbW1lbnQsIG9yIG90aGVyIGVtcHR5XG4qIGNhdGVnb3J5LlxuKlxuKiBAcGFyYW0ge05vZGV9IG5vZGVcbiogQHJldHVybnMge0Jvb2xlYW59XG4qL1xuZnVuY3Rpb24gaXNFbXB0eU5vZGUobm9kZSkge1xuICAgIGlmICghZXhwb3J0cy5pc0xlYWZOb2RlKG5vZGUpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGV4cG9ydHMuZ2V0TGFiZWwoJChub2RlKSkgPT09IFwiQ09ERVwiKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICB2YXIgdGV4dCA9IGV4cG9ydHMud25vZGVTdHJpbmcobm9kZSk7XG4gICAgaWYgKGV4cG9ydHMuc3RhcnRzV2l0aCh0ZXh0LCBcIipcIikgfHwgdGV4dC5zcGxpdChcIi1cIilbMF0gPT09IFwiMFwiKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5leHBvcnRzLmlzRW1wdHlOb2RlID0gaXNFbXB0eU5vZGU7XG5cbi8qKlxuKiBUZXN0IHdoZXRoZXIgYSBzdHJpbmcgaXMgZW1wdHksIGkuZS4gYSB0cmFjZSwgY29tbWVudCwgb3Igb3RoZXIgZW1wdHlcbiogY2F0ZWdvcnkuXG4qXG4qIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IHRoZSB0ZXh0IHRvIHRlc3RcbiogQHJldHVybnMge0Jvb2xlYW59XG4qL1xuZnVuY3Rpb24gaXNFbXB0eSh0ZXh0KSB7XG4gICAgLy8gVE9ETyhBV0UpOiBzaG91bGQgdGhpcyBiZSBwYXNzZWQgYSBub2RlIGluc3RlYWQgb2YgYSBzdHJpbmcsIGFuZCB0aGVuXG4gICAgLy8gdGVzdCB3aGV0aGVyIHRoZSBub2RlIGlzIGEgbGVhZiBvciBub3QgYmVmb3JlIGdpdmluZyBhIHJldHVybiB2YWx1ZT8gIFRoaXNcbiAgICAvLyB3b3VsZCBzaW1wbGlmeSB0aGUgY2hlY2sgSSBoYWQgdG8gcHV0IGluIHNob3VsZEluZGV4TGVhZk5vZGUsIGFuZCBwcmV2ZW50XG4gICAgLy8gZnV0dXJlIHN1Y2ggZXJyb3JzLlxuICAgIC8vIFRPRE86IHVzZSBDT0RFLW5lc3Mgb2YgYSBub2RlLCByYXRoZXIgdGhhbiBzdGFydGluZyB3aXRoIGEgYnJhY2tldFxuICAgIGlmIChleHBvcnRzLnN0YXJ0c1dpdGgodGV4dCwgXCIqXCIpIHx8IGV4cG9ydHMuc3RhcnRzV2l0aCh0ZXh0LCBcIntcIikgfHwgdGV4dC5zcGxpdChcIi1cIilbMF0gPT09IFwiMFwiKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5leHBvcnRzLmlzRW1wdHkgPSBpc0VtcHR5O1xuO1xuXG4vKipcbiogVGVzdCB3aGV0aGVyIGEgbm9kZSBpcyBhIHBvc3NpYmxlIHRhcmdldCBmb3IgbW92ZW1lbnQuXG4qXG4qIEBwYXJhbSB7Tm9kZX0gbm9kZSB0aGUgbm9kZSB0byBvcGVyYXRlIG9uXG4qL1xuZnVuY3Rpb24gaXNQb3NzaWJsZVRhcmdldChub2RlKSB7XG4gICAgLy8gY2Fubm90IG1vdmUgdW5kZXIgYSB0YWcgbm9kZVxuICAgIC8vIFRPRE8oQVdFKTogd2hhdCBpcyB0aGUgY2FsbGluZyBjb252ZW50aW9uPyAgY2FuIHdlIG9wdGltaXplIHRoaXMganF1ZXJ5XG4gICAgLy8gY2FsbD9cbiAgICBpZiAoJChub2RlKS5jaGlsZHJlbigpLmZpcnN0KCkuaXMoXCJzcGFuXCIpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5leHBvcnRzLmlzUG9zc2libGVUYXJnZXQgPSBpc1Bvc3NpYmxlVGFyZ2V0O1xuO1xuXG4vKipcbiogVGVzdCB3aGV0aGVyIGEgbm9kZSBpcyB0aGUgcm9vdCBub2RlIG9mIGEgdHJlZS5cbipcbiogQHBhcmFtIHtKUXVlcnl9IG5vZGUgdGhlIG5vZGUgdG8gb3BlcmF0ZSBvblxuKi9cbmZ1bmN0aW9uIGlzUm9vdE5vZGUobm9kZSkge1xuICAgIHJldHVybiBub2RlLmZpbHRlcihcIiNzbjA+LnNub2RlXCIpLmxlbmd0aCA+IDA7XG59XG5leHBvcnRzLmlzUm9vdE5vZGUgPSBpc1Jvb3ROb2RlO1xuO1xuXG4vKipcbiogVGVzdCB3aGV0aGVyIGEgbm9kZSBpcyBhIGxlYWYgdXNpbmcgaGV1cmlzdGljcy5cbipcbiogVGhpcyBmdW5jdGlvbiByZXNwZWN0cyB0aGUgcmVzdWx0cyBvZiB0aGUgYHRlc3RWYWxpZExlYWZMYWJlbGAgYW5kXG4qIGB0ZXN0VmFsaWRQaHJhc2VMYWJlbGAgZnVuY3Rpb25zLCBpZiB0aGVzZSBhcmUgZGVmaW5lZC5cbipcbiogQHBhcmFtIHtOb2RlfSBub2RlIHRoZSBub2RlIHRvIG9wZXJhdGUgb25cbiovXG4vLyBUT0RPOiByZXN0b3JlXG5mdW5jdGlvbiBndWVzc0xlYWZOb2RlKG5vZGUpIHtcbiAgICAvLyB2YXIgbGFiZWwgPSBnZXRMYWJlbCgkKG5vZGUpKS5yZXBsYWNlKFwiLUZMQUdcIiwgXCJcIik7XG4gICAgLy8gaWYgKHR5cGVvZiB0ZXN0VmFsaWRMZWFmTGFiZWwgICAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgIC8vICAgICB0eXBlb2YgdGVzdFZhbGlkUGhyYXNlTGFiZWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAvLyAgICAgaWYgKHRlc3RWYWxpZFBocmFzZUxhYmVsKGxhYmVsKSkge1xuICAgIC8vICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIC8vICAgICB9IGVsc2UgaWYgKHRlc3RWYWxpZExlYWZMYWJlbChsYWJlbCkpIHtcbiAgICAvLyAgICAgICAgIHJldHVybiB0cnVlO1xuICAgIC8vICAgICB9IGVsc2Uge1xuICAgIC8vICAgICAgICAgLy8gbm90IGEgdmFsaWQgbGFiZWwsIGZhbGwgYmFjayB0byBzdHJ1Y3R1cmFsIGNoZWNrXG4gICAgLy8gICAgICAgICByZXR1cm4gaXNMZWFmTm9kZShub2RlKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH0gZWxzZSB7XG4gICAgcmV0dXJuIGV4cG9ydHMuaXNMZWFmTm9kZShub2RlKTtcbiAgICAvLyB9XG59XG5leHBvcnRzLmd1ZXNzTGVhZk5vZGUgPSBndWVzc0xlYWZOb2RlO1xuXG4vLyAqKiBBY2Nlc3NvciBmdW5jdGlvbnNcbi8qKlxuKiBHZXQgdGhlIHJvb3Qgb2YgdGhlIHRyZWUgdGhhdCBhIG5vZGUgYmVsb25ncyB0by5cbipcbiogQHBhcmFtIHtKUXVlcnl9IG5vZGUgdGhlIG5vZGUgdG8gb3BlcmF0ZSBvblxuKi9cbmZ1bmN0aW9uIGdldFRva2VuUm9vdChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUucGFyZW50cygpLmFkZEJhY2soKS5maWx0ZXIoXCIjc24wPi5zbm9kZVwiKS5nZXQoMCk7XG59XG5leHBvcnRzLmdldFRva2VuUm9vdCA9IGdldFRva2VuUm9vdDtcbjtcblxuLyoqXG4qIEdldCB0aGUgdGV4dCBkb21pbmF0ZWQgYnkgYSBnaXZlbiBub2RlLCB3aXRob3V0IHJlbW92aW5nIGVtcHR5IG1hdGVyaWFsLlxuKlxuKiBAcGFyYW0ge05vZGV9IG5vZGUgdGhlIG5vZGUgdG8gb3BlcmF0ZSBvblxuKi9cbi8vIFRPRE86IGNvbnZlcnQgdG8gdGFrZSBqcXVlcnk/XG5mdW5jdGlvbiB3bm9kZVN0cmluZyhub2RlKSB7XG4gICAgdmFyIHRleHQgPSAkKG5vZGUpLmZpbmQoXCIud25vZGVcIikudGV4dCgpO1xuICAgIHJldHVybiB0ZXh0O1xufVxuZXhwb3J0cy53bm9kZVN0cmluZyA9IHdub2RlU3RyaW5nO1xuXG4vKipcbiogR2V0IHRoZSB1ci10ZXh0IGRvbWluYXRlZCBieSBhIG5vZGUuXG4qXG4qIFRoaXMgZnVuY3Rpb24gcmVtb3ZlcyBhbnkgZW1wdHkgbWF0ZXJpYWwgKHRyYWNlcywgY29tbWVudHMsIGV0Yy4pICBJdCBkb2VzXG4qIG5vdCByZWpvaW4gd29yZHMgd2hpY2ggaGF2ZSBiZWVuIHNwbGl0LiAgSXQgYWxzbyBkb2VzIG5vdCBhZGQgc3BhY2VzLlxuKlxuKiBAcGFyYW0ge0pRdWVyeX0gcm9vdCB0aGUgbm9kZSB0byBvcGVyYXRlIG9uXG4qL1xuZnVuY3Rpb24gY3VycmVudFRleHQocm9vdCkge1xuICAgIHZhciBub2RlcyA9IHJvb3QuZ2V0KDApLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJ3bm9kZVwiKTtcbiAgICB2YXIgdGV4dCA9IFwiXCIsIG52O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFleHBvcnRzLmlzRW1wdHlOb2RlKG5vZGVzW2ldKSkge1xuICAgICAgICAgICAgbnYgPSBub2Rlc1tpXS5jaGlsZE5vZGVzWzBdLm5vZGVWYWx1ZTtcbiAgICAgICAgICAgIHRleHQgKz0gbnY7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRleHQ7XG59XG5leHBvcnRzLmN1cnJlbnRUZXh0ID0gY3VycmVudFRleHQ7XG5cbi8qKlxuKiBHZXQgdGhlIGxhYmVsIG9mIGEgbm9kZS5cbipcbiogQHBhcmFtIHtKUXVlcnl9IG5vZGUgdGhlIG5vZGUgdG8gb3BlcmF0ZSBvblxuKi9cbi8vIFRPRE86IHRpZSB0aGlzIGluIHRvIHRoZSBmb3JtYXRpaWduIGZ1bmN0aW9ucz8gIG9yIHJlZmFjdG9yL2VsaW1pbmF0ZVxuZnVuY3Rpb24gZ2V0TGFiZWwobm9kZSkge1xuICAgIHZhciBuID0gbm9kZS5nZXQoMCk7XG4gICAgdmFyIGwgPSBuLmdldEF0dHJpYnV0ZShcImRhdGEtY2F0ZWdvcnlcIik7XG4gICAgaWYgKG4uZ2V0QXR0cmlidXRlKFwiZGF0YS1zdWJjYXRlZ29yeVwiKSkge1xuICAgICAgICBsICs9IFwiLVwiICsgbi5nZXRBdHRyaWJ1dGUoXCJkYXRhLXN1YmNhdGVnb3J5XCIpO1xuICAgIH1cbiAgICByZXR1cm4gbDtcbn1cbmV4cG9ydHMuZ2V0TGFiZWwgPSBnZXRMYWJlbDtcbmV4cG9ydHMuZ2V0TGFiZWwgPSBleHBvcnRzLmdldExhYmVsO1xuXG4vKipcbiogR2V0IHRoZSBmaXJzdCB0ZXh0IG5vZGUgZG9taW5hdGVkIGJ5IGEgbm9kZS5cbiogQHByaXZhdGVcbipcbiogQHBhcmFtIHtKUXVlcnl9IG5vZGUgdGhlIG5vZGUgdG8gb3BlcmF0ZSBvblxuKi9cbmZ1bmN0aW9uIHRleHROb2RlKG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5jb250ZW50cygpLmZpbHRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGVUeXBlID09PSAzO1xuICAgIH0pLmZpcnN0KCk7XG59XG5leHBvcnRzLnRleHROb2RlID0gdGV4dE5vZGU7XG5cbi8qKlxuKiBSZXR1cm4gdGhlIGxlbW1hIG9mIGEgbm9kZSwgb3IgdW5kZWZpbmVkIGlmIG5vbmUuXG4qXG4qIEBwYXJhbSB7SlF1ZXJ5fSBub2RlXG4qIEByZXR1cm5zIHtTdHJpbmd9XG4qL1xuZnVuY3Rpb24gZ2V0TGVtbWEobm9kZSkge1xuICAgIHJldHVybiBub2RlLmNoaWxkcmVuKFwiLndub2RlXCIpLmNoaWxkcmVuKFwiLmxlbW1hXCIpLmZpcnN0KCkudGV4dCgpLnN1YnN0cmluZygxKTtcbn1cbmV4cG9ydHMuZ2V0TGVtbWEgPSBnZXRMZW1tYTtcblxuLyoqXG4qIFRlc3Qgd2hldGhlciBhIG5vZGUgaGFzIGEgY2VydGFpbiBkYXNoIHRhZy5cbipcbiogQHBhcmFtIHtKUXVlcnl9IG5vZGUgdGhlIG5vZGUgdG8gb3BlcmF0ZSBvblxuKiBAcGFyYW0ge1N0cmluZ30gdGFnIHRoZSBkYXNoIHRhZyB0byBsb29rIGZvciwgd2l0aG91dCBhbnkgZGFzaGVzXG4qL1xuZnVuY3Rpb24gaGFzRGFzaFRhZyhub2RlLCB0YWcpIHtcbiAgICB2YXIgbGFiZWwgPSBleHBvcnRzLmdldExhYmVsKG5vZGUpO1xuICAgIHZhciB0YWdzID0gbGFiZWwuc3BsaXQoXCItXCIpLnNsaWNlKDEpO1xuICAgIHJldHVybiAodGFncy5pbmRleE9mKHRhZykgPiAtMSk7XG59XG5leHBvcnRzLmhhc0Rhc2hUYWcgPSBoYXNEYXNoVGFnO1xuXG4vLyAqKiBJbmRleC1yZWxhdGVkIGZ1bmN0aW9uc1xuLyoqXG4qIFJldHVybiB0aGUgbW92ZW1lbnQgaW5kZXggYXNzb2NpYXRlZCB3aXRoIGEgbm9kZS5cbipcbiogQHBhcmFtIHtKUXVlcnl9IG5vZGUgdGhlIG5vZGUgdG8gb3BlcmF0ZSBvblxuKi9cbmZ1bmN0aW9uIGdldEluZGV4KG5vZGUpIHtcbiAgICByZXR1cm4gcGFyc2VJbnQobm9kZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLWluZGV4XCIpLCAxMCk7XG59XG5leHBvcnRzLmdldEluZGV4ID0gZ2V0SW5kZXg7XG5cbi8qKlxuKiBSZXR1cm4gdGhlIHR5cGUgb2YgaW5kZXggYXNzb2NpYXRlZCB3aXRoIGEgbm9kZSwgZWl0aGVyIGBcIi1cImAgb3IgYFwiPVwiYC5cbipcbiogQHBhcmFtIHtKUXVlcnl9IG5vZGUgdGhlIG5vZGUgdG8gb3BlcmF0ZSBvblxuKi9cbi8vIFRPRE86IG9ubHkgdXNlZCBvbmNlLCBlbGltaW5hdGU/XG4vLyBUT0RPOiB1c2UgZW51bVxuZnVuY3Rpb24gZ2V0SW5kZXhUeXBlKG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLWlkeHR5cGVcIikgPT09IFwiZ2FwXCIgPyBcIj1cIiA6IFwiLVwiO1xufVxuZXhwb3J0cy5nZXRJbmRleFR5cGUgPSBnZXRJbmRleFR5cGU7XG47XG5cbi8vIFRPRE86IGRvY3VtZW50XG5mdW5jdGlvbiBzZXRJbmRleFR5cGUobm9kZSwgaWR4dHlwZSkge1xuICAgIG5vZGUuc2V0QXR0cmlidXRlKFwiZGF0YS1pZHh0eXBlXCIsIGlkeHR5cGUgPT09IFwiPVwiID8gXCJnYXBcIiA6IFwicmVndWxhclwiKTtcbn1cbmV4cG9ydHMuc2V0SW5kZXhUeXBlID0gc2V0SW5kZXhUeXBlO1xuXG4vLyBUT0RPOiBkb2N1bWVudFxuZnVuY3Rpb24gc2V0SW5kZXgobm9kZSwgaW5kZXgpIHtcbiAgICBub2RlLnNldEF0dHJpYnV0ZShcImRhdGEtaW5kZXhcIiwgaW5kZXgudG9TdHJpbmcoKSk7XG4gICAgaWYgKCFub2RlLmdldEF0dHJpYnV0ZShcImRhdGEtaWR4dHlwZVwiKSkge1xuICAgICAgICBleHBvcnRzLnNldEluZGV4VHlwZShub2RlLCBcIi1cIik7XG4gICAgfVxufVxuZXhwb3J0cy5zZXRJbmRleCA9IHNldEluZGV4O1xuXG4vKipcbiogR2V0IHRoZSBoaWdoZXN0IGluZGV4IGF0dGVzdGVkIGluIGEgdG9rZW4uXG4qXG4qIEBwYXJhbSB7Tm9kZX0gdG9rZW4gdGhlIHRva2VuIHRvIHdvcmsgb25cbiovXG5mdW5jdGlvbiBtYXhJbmRleCh0b2tlbikge1xuICAgIHJldHVybiBfLm1heChfLm1hcCgkKHRva2VuKS5maW5kKFwiLnNub2RlXCIpLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBleHBvcnRzLmdldEluZGV4KHRoaXMpO1xuICAgIH0pKTtcbn1cbmV4cG9ydHMubWF4SW5kZXggPSBtYXhJbmRleDtcblxuLyoqXG4qIEluY3JlYXNlIHRoZSB2YWx1ZSBvZiBhIHRyZWUncyBpbmRpY2VzIGJ5IGFuIGFtb3VudFxuKiBAcHJpdmF0ZVxuKlxuKiBAcGFyYW0ge0pRdWVyeX0gdG9rZW5Sb290IHRoZSB0b2tlbiB0byBvcGVyYXRlIG9uXG4qIEBwYXJhbSB7bnVtYmVyfSBudW1iZXJUb0FkZFxuKi9cbi8vIFRPRE86IHJ3ZXJpdGVcbmZ1bmN0aW9uIGFkZFRvSW5kaWNlcyh0b2tlblJvb3QsIG51bWJlclRvQWRkKSB7XG4gICAgdmFyIG5vZGVzID0gdG9rZW5Sb290LmZpbmQoXCIuc25vZGVbZGF0YS1pbmRleF1cIikuYWRkQmFjaygpO1xuICAgIG5vZGVzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBleHBvcnRzLnNldEluZGV4KHRoaXMsIGV4cG9ydHMuZ2V0SW5kZXgodGhpcykgKyBudW1iZXJUb0FkZCk7XG4gICAgfSk7XG59XG5leHBvcnRzLmFkZFRvSW5kaWNlcyA9IGFkZFRvSW5kaWNlcztcbjtcblxuZnVuY3Rpb24gcmVtb3ZlSW5kZXgobm9kZSkge1xuICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKFwiZGF0YS1pbmRleFwiKTtcbiAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtaWR4dHlwZVwiKTtcbn1cbmV4cG9ydHMucmVtb3ZlSW5kZXggPSByZW1vdmVJbmRleDtcblxuLy8gKiogQ2FzZS1yZWxhdGVkIGZ1bmN0aW9uc1xuLyoqXG4qIEZpbmQgdGhlIGNhc2UgYXNzb2NpYXRlZCB3aXRoIGEgbm9kZS5cbipcbiogVGhpcyBmdW5jdGlvbiByZXNwZWN0cyB0aGUgY2FzZS1yZWxhdGVkIHZhcmlhYmxlIGBjYXNlTWFya2Vyc2AuICBJdCBkb2VzXG4qIG5vdCBjaGVjayBpZiBhIG5vZGUgaXMgaW4gYGNhc2VUYWdzYC5cbipcbiogQHBhcmFtIHtKUXVlcnl9IG5vZGVcbiogQHJldHVybnMge1N0cmluZ30gdGhlIGNhc2Ugb24gdGhlIG5vZGUsIG9yIGBcIlwiYCBpZiBub25lXG4qL1xuZnVuY3Rpb24gZ2V0Q2FzZShub2RlKSB7XG4gICAgdmFyIG0gPSBtZXRhZGF0YS5nZXRNZXRhZGF0YShub2RlKTtcblxuICAgIC8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXG4gICAgaWYgKG0gJiYgbVtcIm1vcnBob1wiXSkge1xuICAgICAgICByZXR1cm4gbVtcIm1vcnBob1wiXVtcImNhc2VcIl07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLXN0cmluZy1saXRlcmFsICovXG59XG5leHBvcnRzLmdldENhc2UgPSBnZXRDYXNlO1xuO1xuXG4vKipcbiogVGVzdCBpZiBhIG5vZGUgaGFzIGNhc2UuXG4qXG4qIFRoaXMgZnVuY3Rpb24gdGVzdHMgd2hldGhlciBhIG5vZGUgaXMgaW4gYGNhc2VUYWdzYCwgYW5kIHRoZW4gd2hldGhlciBpdFxuKiBoYXMgY2FzZS5cbipcbiogQHBhcmFtIHtKUXVlcnl9IG5vZGVcbiogQHJldHVybnMge0Jvb2xlYW59XG4qL1xuZnVuY3Rpb24gaGFzQ2FzZShub2RlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBleHBvcnRzLmdldENhc2Uobm9kZSkgIT09IFwidW5kZWZpbmVkXCI7XG59XG5leHBvcnRzLmhhc0Nhc2UgPSBoYXNDYXNlO1xuXG4vKipcbiogVGVzdCB3aGV0aGVyIGEgbm9kZSBsYWJlbCBjb3JyZXNwb25kcyB0byBhIGNhc2UgcGhyYXNlLlxuKlxuKiBCYXNlZCBvbiB0aGUgYGNhc2VQaHJhc2VzYCBjb25maWd1cmF0aW9uIHZhcmlhYmxlLlxuKlxuKiBAcGFyYW0ge0pRdWVyeX0gbm9kZUxhYmVsXG4qIEByZXR1cm5zIHtCb29sZWFufVxuKi9cbmZ1bmN0aW9uIGlzQ2FzZVBocmFzZShub2RlKSB7XG4gICAgcmV0dXJuIF8uY29udGFpbnMoY29uZi5jYXNlUGhyYXNlcywgbm9kZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNhdGVnb3J5XCIpKTtcbn1cbmV4cG9ydHMuaXNDYXNlUGhyYXNlID0gaXNDYXNlUGhyYXNlO1xuXG4vKipcbiogVGVzdCB3aGV0aGVyIGEgbGFiZWwgY2FuIGJlYXIgY2FzZS5cbipcbiogUmVzcGVjdHMgdGhlIGBjYXNlVGFnc2AgY29uZmlndXJhdGlvbiB2YXJpYWJsZS5cbipcbiogQHBhcmFtIHtTdHJpbmd9IGxhYmVsXG4qIEByZXR1cm5zIHtCb29sZWFufVxuKi9cbmZ1bmN0aW9uIGlzQ2FzZUNhdGVnb3J5KGNhdCkge1xuICAgIHJldHVybiBfLmNvbnRhaW5zKGNvbmYuY2FzZVRhZ3MsIGNhdCk7XG59XG5leHBvcnRzLmlzQ2FzZUNhdGVnb3J5ID0gaXNDYXNlQ2F0ZWdvcnk7XG5cbi8qKlxuKiBUZXN0IHdoZXRoZXIgYSBub2RlIGNhbiBiZWFyIGNhc2UuXG4qXG4qIFNlZSBgYGlzQ2FzZUxhYmVsYGAuXG4qXG4qIEBwYXJhbSB7SlF1ZXJ5fSBub2RlXG4qIEByZXR1cm5zIHtCb29sZWFufVxuKi9cbmZ1bmN0aW9uIGlzQ2FzZU5vZGUobm9kZSkge1xuICAgIHJldHVybiBleHBvcnRzLmlzQ2FzZUNhdGVnb3J5KG5vZGUuZ2V0QXR0cmlidXRlKFwiZGF0YS1jZXRlZ29yeVwiKSk7XG59XG5leHBvcnRzLmlzQ2FzZU5vZGUgPSBpc0Nhc2VOb2RlO1xuXG4vKipcbiogUmVtb3ZlIHRoZSBjYXNlIGZyb20gYSBub2RlLlxuKlxuKiBEb2VzIG5vdCByZWNvcmQgdW5kbyBpbmZvcm1hdGlvbi5cbipcbiogQHBhcmFtIHtFbGVtZW50fSBub2RlXG4qL1xuZnVuY3Rpb24gcmVtb3ZlQ2FzZShub2RlKSB7XG4gICAgbWV0YWRhdGEucmVtb3ZlTWV0YWRhdGEobm9kZSwgXCJtb3JwaG9cIiwgeyBcImNhc2VcIjogXCJmb29cIiB9KTtcbn1cbmV4cG9ydHMucmVtb3ZlQ2FzZSA9IHJlbW92ZUNhc2U7XG5cbi8qKlxuKiBTZXQgdGhlIGNhc2Ugb24gYSBub2RlLlxuKlxuKiBSZW1vdmVzIGFueSBwcmV2aW91cyBjYXNlLiAgRG9lcyBub3QgcmVjb3JkIHVuZG8gaW5mb3JtYXRpb24uXG4qXG4qIEBwYXJhbSB7RWxlbWVudH0gbm9kZVxuKiBAcGFyYW0ge3N0cmluZ30gdGhlQ2FzZVxuKi9cbmZ1bmN0aW9uIHNldENhc2Uobm9kZSwgdGhlQ2FzZSkge1xuICAgIG1ldGFkYXRhLnNldE1ldGFkYXRhKG5vZGUsIFwibW9ycGhvXCIsIHsgXCJjYXNlXCI6IHRoZUNhc2UgfSk7XG59XG5leHBvcnRzLnNldENhc2UgPSBzZXRDYXNlO1xuO1xuXG4vLyBUT0RPOiB0b2dnbGluZyB0aGUgY2FzZSByZXF1aXJlcyBpbnRlbGxpZ2VuY2UgYWJvdXQgd2hlcmUgdGhlIGRhc2ggdGFnXG4vLyBzaG91bGQgYmUgcHV0LCB3aGljaCBpcyBvbmx5IGluIHRvZ2dsZUV4dGVuc2lvblxuLy8gZnVuY3Rpb24gbGFiZWxTZXRDYXNlKGxhYmVsKSB7XG4vLyB9XG4vLyAqKiBMYWJlbC1yZWxhdGVkIGZ1bmN0aW9uc1xuLyoqXG4qIFNldHMgdGhlIGxhYmVsIG9mIGEgbm9kZVxuKlxuKiBDb250YWlucyBub25lIG9mIHRoZSBoZXVyaXN0aWNzIG9mIHtAbGluayBzZXRMYWJlbH0uXG4qXG4qIEBwYXJhbSB7SlF1ZXJ5fSBub2RlIHRoZSB0YXJnZXQgbm9kZVxuKiBAcGFyYW0ge1N0cmluZ30gbGFiZWwgdGhlIG5ldyBsYWJlbFxuKi9cbmZ1bmN0aW9uIHNldE5vZGVMYWJlbChub2RlLCBsYWJlbCwgbm9VbmRvKSB7XG4gICAgaWYgKG5vVW5kbykge1xuICAgICAgICB1bmRvLnVuZG9CZWdpblRyYW5zYWN0aW9uKCk7XG4gICAgfVxuICAgIGlmIChub2RlLmhhc0NsYXNzKFwic25vZGVcIikpIHtcbiAgICAgICAgaWYgKGxhYmVsW2xhYmVsLmxlbmd0aCAtIDFdICE9PSBcIiBcIikge1xuICAgICAgICAgICAgLy8gU29tZSBvdGhlciBzcG90cyBpbiB0aGUgY29kZSBkZXBlbmQgb24gdGhlIGxhYmVsIGVuZGluZyB3aXRoIGFcbiAgICAgICAgICAgIC8vIHNwYWNlLi4uXG4gICAgICAgICAgICBsYWJlbCArPSBcIiBcIjtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAobm9kZS5oYXNDbGFzcyhcIndub2RlXCIpKSB7XG4gICAgICAgIC8vIFdvcmRzIGNhbm5vdCBoYXZlIGEgdHJhaWxpbmcgc3BhY2UsIG9yIENTIGJhcmZzIG9uIHNhdmUuXG4gICAgICAgIGxhYmVsID0gJC50cmltKGxhYmVsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBzaG91bGQgbmV2ZXIgaGFwcGVuXG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG9sZExhYmVsID0gZXhwb3J0cy5nZXRMYWJlbChub2RlKTtcbiAgICBleHBvcnRzLnRleHROb2RlKG5vZGUpLnJlcGxhY2VXaXRoKGxhYmVsKTtcbiAgICBleHBvcnRzLnVwZGF0ZUNzc0NsYXNzKG5vZGUsIG9sZExhYmVsKTtcbiAgICBpZiAobm9VbmRvKSB7XG4gICAgICAgIHVuZG8udW5kb0Fib3J0VHJhbnNhY3Rpb24oKTtcbiAgICB9XG59XG5leHBvcnRzLnNldE5vZGVMYWJlbCA9IHNldE5vZGVMYWJlbDtcblxuZnVuY3Rpb24gc2V0TGVhZkxhYmVsKG5vZGUsIGxhYmVsKSB7XG4gICAgaWYgKCFub2RlLmhhc0NsYXNzKFwiLndub2RlXCIpKSB7XG4gICAgICAgIC8vIHdoeSBkbyB3ZSBkbyB0aGlzPyAgV2Ugc2hvdWxkIGJlIGxlc3MgZmF1bHQtdG9sZXJhbnQuXG4gICAgICAgIG5vZGUgPSBub2RlLmNoaWxkcmVuKFwiLndub2RlXCIpLmZpcnN0KCk7XG4gICAgfVxuICAgIGV4cG9ydHMudGV4dE5vZGUobm9kZSkucmVwbGFjZVdpdGgoJC50cmltKGxhYmVsKSk7XG59XG5leHBvcnRzLnNldExlYWZMYWJlbCA9IHNldExlYWZMYWJlbDtcblxuLy8gKiBTdHVic1xuLy8gVE9ETzogcmVtb3ZlXG5mdW5jdGlvbiB0b2dnbGVTdHJpbmdFeHRlbnNpb24oKSB7XG4gICAgdmFyIGZvbyA9IFtdO1xuICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCAoYXJndW1lbnRzLmxlbmd0aCAtIDApOyBfaSsrKSB7XG4gICAgICAgIGZvb1tfaV0gPSBhcmd1bWVudHNbX2kgKyAwXTtcbiAgICB9XG4gICAgcmV0dXJuO1xufVxuZXhwb3J0cy50b2dnbGVTdHJpbmdFeHRlbnNpb24gPSB0b2dnbGVTdHJpbmdFeHRlbnNpb247XG5cbmZ1bmN0aW9uIGxvb2t1cE5leHRMYWJlbCgpIHtcbiAgICB2YXIgZm9vID0gW107XG4gICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IChhcmd1bWVudHMubGVuZ3RoIC0gMCk7IF9pKyspIHtcbiAgICAgICAgZm9vW19pXSA9IGFyZ3VtZW50c1tfaSArIDBdO1xuICAgIH1cbiAgICByZXR1cm4gXCJmb29cIjtcbn1cbmV4cG9ydHMubG9va3VwTmV4dExhYmVsID0gbG9va3VwTmV4dExhYmVsO1xuIiwiLy8vPHJlZmVyZW5jZSBwYXRoPVwiLi8uLi8uLi8uLi90eXBlcy9hbGwuZC50c1wiIC8+XG52YXIgc3RhcnR1cCA9IHJlcXVpcmUoXCIuL3N0YXJ0dXBcIik7XG52YXIgc2VsZWN0aW9uID0gcmVxdWlyZShcIi4vc2VsZWN0aW9uXCIpO1xuXG4vKipcbiogVG9nZ2xlIGNvbGxhcHNpbmcgb2YgYSBub2RlLlxuKlxuKiBXaGVuIGEgbm9kZSBpcyBjb2xsYXBzZWQsIGl0cyBjb250ZW50cyBhcmUgZGlzcGxheWVkIGFzIGNvbnRpbnVvdXMgdGV4dCxcbiogd2l0aG91dCBsYWJlbHMuICBUaGUgbm9kZSBpdHNlbGYgc3RpbGwgZnVuY3Rpb25zIG5vcm1hbGx5IHdpdGggcmVzcGVjdCB0b1xuKiBtb3ZlbWVudCBvcGVyYXRpb25zIGV0Yy4sIGJ1dCBpdHMgY29udGVudHMgYXJlIGluYWNjZXNzaWJsZS5cbiovXG5mdW5jdGlvbiB0b2dnbGVDb2xsYXBzZWQoKSB7XG4gICAgaWYgKHNlbGVjdGlvbi5jYXJkaW5hbGl0eSgpICE9PSAxKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgJChzZWxlY3Rpb24uZ2V0KCkpLnRvZ2dsZUNsYXNzKFwiY29sbGFwc2VkXCIpO1xuICAgIHJldHVybiB0cnVlO1xufVxuZXhwb3J0cy50b2dnbGVDb2xsYXBzZWQgPSB0b2dnbGVDb2xsYXBzZWQ7XG5cbnZhciBsZW1tYXRhU3R5bGVOb2RlO1xudmFyIGxlbW1hdGFIaWRkZW4gPSB0cnVlO1xuXG5zdGFydHVwLmFkZFN0YXJ0dXBIb29rKGZ1bmN0aW9uICgpIHtcbiAgICBsZW1tYXRhU3R5bGVOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgIGxlbW1hdGFTdHlsZU5vZGUuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcInRleHQvY3NzXCIpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaGVhZFwiKVswXS5hcHBlbmRDaGlsZChsZW1tYXRhU3R5bGVOb2RlKTtcbiAgICBsZW1tYXRhU3R5bGVOb2RlLmlubmVySFRNTCA9IFwiLmxlbW1hIHsgZGlzcGxheTogbm9uZTsgfVwiO1xufSk7XG5cbnN0YXJ0dXAuYWRkU2h1dGRvd25Ib29rKGZ1bmN0aW9uICgpIHtcbiAgICBsZW1tYXRhU3R5bGVOb2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobGVtbWF0YVN0eWxlTm9kZSk7XG59KTtcblxuLyoqXG4qIFRvZ2dsZSBkaXNwbGF5IG9mIGxlbW1hdGEuXG4qL1xuZnVuY3Rpb24gdG9nZ2xlTGVtbWF0YSgpIHtcbiAgICBpZiAobGVtbWF0YUhpZGRlbikge1xuICAgICAgICBsZW1tYXRhU3R5bGVOb2RlLmlubmVySFRNTCA9IFwiXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbGVtbWF0YVN0eWxlTm9kZS5pbm5lckhUTUwgPSBcIi5sZW1tYSB7IGRpc3BsYXk6IG5vbmU7IH1cIjtcbiAgICB9XG4gICAgbGVtbWF0YUhpZGRlbiA9ICFsZW1tYXRhSGlkZGVuO1xufVxuZXhwb3J0cy50b2dnbGVMZW1tYXRhID0gdG9nZ2xlTGVtbWF0YTtcbiIsIi8qZ2xvYmFsIHJlcXVpcmU6IGZhbHNlLCBleHBvcnRzOiB0cnVlICovXG5cbnZhciBub3RpZnkgPSByZXF1aXJlKFwiLi4vZXh0L2dyb3dsXCIpLmdyb3dsO1xuXG5leHBvcnRzLmVycm9yID0gZnVuY3Rpb24gKHRleHQpIHtcbiAgICBub3RpZnkuZXJyb3IoeyB0aXRsZTogXCJFcnJvclwiLFxuICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHRleHQgfSk7XG59O1xuXG5leHBvcnRzLndhcm5pbmcgPSBmdW5jdGlvbiAodGV4dCkge1xuICAgIG5vdGlmeS53YXJuaW5nKHsgdGl0bGU6IFwiV2FybmluZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogdGV4dCB9KTtcbn07XG5cbmV4cG9ydHMubm90aWNlID0gZnVuY3Rpb24gKHRleHQpIHtcbiAgICBub3RpZnkubm90aWNlKHsgbWVzc2FnZTogdGV4dCxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiXCJ9KTtcbn07XG4iXX0=
