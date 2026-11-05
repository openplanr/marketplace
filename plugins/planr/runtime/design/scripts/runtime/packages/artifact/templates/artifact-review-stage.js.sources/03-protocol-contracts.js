

  // ../protocol/src/canonical-json.mjs
  function deepFreeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      for (const nested of Object.values(value)) deepFreeze(nested);
      Object.freeze(value);
    }
    return value;
  }