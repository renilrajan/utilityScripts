(() => {
  /**
   * CONFIGURATION
   * Define rules to match against field metadata (name, id, placeholder, label, aria-label).
   * - pattern: RegExp tested against aggregated field identifiers.
   * - value:
   *     - For text/textarea/select: String or callback `(el) => string`.
   *     - For checkbox: Boolean (true = check, false = uncheck).
   *     - For radio: Boolean (true = select) or String/RegExp matching the radio's value/label.
   */
  const rules = [
    {
      pattern: /first.*name|fname/i,
      value: "first_name",
    },
    {
      pattern: /last.*name|lname/i,
      value: "last_name",
    },
    {
      pattern: /e[-_]?mail/i,
      value: "test@gmail.com",
    },
    {
      pattern: /phone|mobile|tel/i,
      value: "+91 999999999",
    },
    {
      pattern: /address|street/i,
      value: "test address",
    },
    {
      pattern: /city/i,
      value: "Mumbai",
    },
    {
      pattern: /zip|postal/i,
      value: "6666666",
    },
    {
      pattern: /country/i,
      value: "India", // matches option value or option text in <select>
    },
    {
      pattern: /terms|agree|privacy/i,
      value: true, // check the box
    },
    {
      pattern: /gender|sex/i,
      value: /male/i, // picks the radio option matching 'female'
    },
    {
      pattern: /bio|notes|comments|description/i,
      value: "Automated test notes populated via console form filler.",
    },
  ];

  // Helper: Dispatch events for reactive frameworks (React, Angular, Vue)
  const triggerEvents = (element) => {
    element.dispatchEvent(new Event("focus", { bubbles: true }));
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
  };

  // Helper: React input state tracker bypass
  const setNativeValue = (element, value) => {
    const valueSetter = Object.getOwnPropertyDescriptor(element, "value")?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }
  };

  // Helper: React checkbox state tracker bypass
  const setNativeChecked = (element, checked) => {
    const checkedSetter = Object.getOwnPropertyDescriptor(element, "checked")?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeCheckedSetter = Object.getOwnPropertyDescriptor(prototype, "checked")?.set;

    if (prototypeCheckedSetter && checkedSetter !== prototypeCheckedSetter) {
      prototypeCheckedSetter.call(element, checked);
    } else if (checkedSetter) {
      checkedSetter.call(element, checked);
    } else {
      element.checked = checked;
    }
  };

  // Extract text labels associated with an element
  const getAssociatedLabels = (el) => {
    const labels = [];

    // 1. Explicit <label for="...">
    if (el.id) {
      const explicitLabel = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (explicitLabel) labels.push(explicitLabel.innerText || explicitLabel.textContent);
    }

    // 2. Ancestor <label>
    const parentLabel = el.closest("label");
    if (parentLabel) {
      labels.push(parentLabel.innerText || parentLabel.textContent);
    }

    // 3. aria-labelledby
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      labelledBy.split(/\s+/).forEach((id) => {
        const refEl = document.getElementById(id);
        if (refEl) labels.push(refEl.innerText || refEl.textContent);
      });
    }

    return labels.join(" ").trim();
  };

  // Aggregate metadata for regex testing
  const buildFieldDescriptor = (el) => {
    const parts = [
      el.name || "",
      el.id || "",
      el.placeholder || "",
      el.getAttribute("aria-label") || "",
      el.getAttribute("autocomplete") || "",
      getAssociatedLabels(el),
    ];
    return parts.filter(Boolean).join(" ");
  };

  // Exclude buttons, submits, resets, and hidden controls
  const isValidTarget = (el) => {
    if (el.disabled || el.readOnly) return false;

    const tag = el.tagName.toLowerCase();
    if (tag === "input") {
      const ignoredTypes = new Set([
        "submit", "button", "reset", "image", "file", "hidden"
      ]);
      return !ignoredTypes.has((el.type || "text").toLowerCase());
    }
    return tag === "select" || tag === "textarea";
  };

  // Collect candidate elements
  const candidates = Array.from(
    document.querySelectorAll("input, textarea, select")
  ).filter(isValidTarget);

  let filledCount = 0;

  candidates.forEach((el) => {
    const descriptor = buildFieldDescriptor(el);
    const matchedRule = rules.find((rule) => rule.pattern.test(descriptor));

    if (!matchedRule) return;

    const targetValue = typeof matchedRule.value === "function" 
      ? matchedRule.value(el) 
      : matchedRule.value;

    const tag = el.tagName.toLowerCase();
    const type = (el.type || "text").toLowerCase();

    if (tag === "select") {
      let optionMatched = false;
      const opts = Array.from(el.options);

      // Match by exact value, option label text, or regex
      const foundOption = opts.find((opt) => {
        if (targetValue instanceof RegExp) {
          return targetValue.test(opt.value) || targetValue.test(opt.text);
        }
        return (
          opt.value.toLowerCase() === String(targetValue).toLowerCase() ||
          opt.text.trim().toLowerCase() === String(targetValue).toLowerCase()
        );
      });

      if (foundOption) {
        el.selectedIndex = foundOption.index;
        optionMatched = true;
      }

      if (optionMatched) {
        triggerEvents(el);
        filledCount++;
      }
    } else if (type === "checkbox") {
      setNativeChecked(el, Boolean(targetValue));
      triggerEvents(el);
      filledCount++;
    } else if (type === "radio") {
      let shouldSelect = false;
      if (typeof targetValue === "boolean") {
        shouldSelect = targetValue;
      } else if (targetValue instanceof RegExp) {
        shouldSelect = targetValue.test(el.value) || targetValue.test(descriptor);
      } else {
        shouldSelect = el.value.toLowerCase() === String(targetValue).toLowerCase();
      }

      if (shouldSelect) {
        setNativeChecked(el, true);
        triggerEvents(el);
        filledCount++;
      }
    } else {
      // standard inputs and textareas
      setNativeValue(el, String(targetValue));
      triggerEvents(el);
      filledCount++;
    }
  });

  console.info(`Form Filler: Matched and populated ${filledCount} field(s).`);
})();(() => {
  /**
   * CONFIGURATION
   * Define rules to match against field metadata (name, id, placeholder, label, aria-label).
   * - pattern: RegExp tested against aggregated field identifiers.
   * - value:
   *     - For text/textarea/select: String or callback `(el) => string`.
   *     - For checkbox: Boolean (true = check, false = uncheck).
   *     - For radio: Boolean (true = select) or String/RegExp matching the radio's value/label.
   */
  const rules = [
    {
      pattern: /first.*name|fname/i,
      value: "Jane",
    },
    {
      pattern: /last.*name|lname/i,
      value: "Doe",
    },
    {
      pattern: /e[-_]?mail/i,
      value: "jane.doe@example.com",
    },
    {
      pattern: /phone|mobile|tel/i,
      value: "+1-555-0199",
    },
    {
      pattern: /address|street/i,
      value: "123 Main Street",
    },
    {
      pattern: /city/i,
      value: "Springfield",
    },
    {
      pattern: /zip|postal/i,
      value: "97477",
    },
    {
      pattern: /country/i,
      value: "US", // matches option value or option text in <select>
    },
    {
      pattern: /terms|agree|privacy/i,
      value: true, // check the box
    },
    {
      pattern: /gender|sex/i,
      value: /female/i, // picks the radio option matching 'female'
    },
    {
      pattern: /bio|notes|comments|description/i,
      value: "Automated test notes populated via console form filler.",
    },
  ];

  // Helper: Dispatch events for reactive frameworks (React, Angular, Vue)
  const triggerEvents = (element) => {
    element.dispatchEvent(new Event("focus", { bubbles: true }));
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
  };

  // Helper: React input state tracker bypass
  const setNativeValue = (element, value) => {
    const valueSetter = Object.getOwnPropertyDescriptor(element, "value")?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }
  };

  // Helper: React checkbox state tracker bypass
  const setNativeChecked = (element, checked) => {
    const checkedSetter = Object.getOwnPropertyDescriptor(element, "checked")?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeCheckedSetter = Object.getOwnPropertyDescriptor(prototype, "checked")?.set;

    if (prototypeCheckedSetter && checkedSetter !== prototypeCheckedSetter) {
      prototypeCheckedSetter.call(element, checked);
    } else if (checkedSetter) {
      checkedSetter.call(element, checked);
    } else {
      element.checked = checked;
    }
  };

  // Extract text labels associated with an element
  const getAssociatedLabels = (el) => {
    const labels = [];

    // 1. Explicit <label for="...">
    if (el.id) {
      const explicitLabel = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (explicitLabel) labels.push(explicitLabel.innerText || explicitLabel.textContent);
    }

    // 2. Ancestor <label>
    const parentLabel = el.closest("label");
    if (parentLabel) {
      labels.push(parentLabel.innerText || parentLabel.textContent);
    }

    // 3. aria-labelledby
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      labelledBy.split(/\s+/).forEach((id) => {
        const refEl = document.getElementById(id);
        if (refEl) labels.push(refEl.innerText || refEl.textContent);
      });
    }

    return labels.join(" ").trim();
  };

  // Aggregate metadata for regex testing
  const buildFieldDescriptor = (el) => {
    const parts = [
      el.name || "",
      el.id || "",
      el.placeholder || "",
      el.getAttribute("aria-label") || "",
      el.getAttribute("autocomplete") || "",
      getAssociatedLabels(el),
    ];
    return parts.filter(Boolean).join(" ");
  };

  // Exclude buttons, submits, resets, and hidden controls
  const isValidTarget = (el) => {
    if (el.disabled || el.readOnly) return false;

    const tag = el.tagName.toLowerCase();
    if (tag === "input") {
      const ignoredTypes = new Set([
        "submit", "button", "reset", "image", "file", "hidden"
      ]);
      return !ignoredTypes.has((el.type || "text").toLowerCase());
    }
    return tag === "select" || tag === "textarea";
  };

  // Collect candidate elements
  const candidates = Array.from(
    document.querySelectorAll("input, textarea, select")
  ).filter(isValidTarget);

  let filledCount = 0;

  candidates.forEach((el) => {
    const descriptor = buildFieldDescriptor(el);
    const matchedRule = rules.find((rule) => rule.pattern.test(descriptor));

    if (!matchedRule) return;

    const targetValue = typeof matchedRule.value === "function" 
      ? matchedRule.value(el) 
      : matchedRule.value;

    const tag = el.tagName.toLowerCase();
    const type = (el.type || "text").toLowerCase();

    if (tag === "select") {
      let optionMatched = false;
      const opts = Array.from(el.options);

      // Match by exact value, option label text, or regex
      const foundOption = opts.find((opt) => {
        if (targetValue instanceof RegExp) {
          return targetValue.test(opt.value) || targetValue.test(opt.text);
        }
        return (
          opt.value.toLowerCase() === String(targetValue).toLowerCase() ||
          opt.text.trim().toLowerCase() === String(targetValue).toLowerCase()
        );
      });

      if (foundOption) {
        el.selectedIndex = foundOption.index;
        optionMatched = true;
      }

      if (optionMatched) {
        triggerEvents(el);
        filledCount++;
      }
    } else if (type === "checkbox") {
      setNativeChecked(el, Boolean(targetValue));
      triggerEvents(el);
      filledCount++;
    } else if (type === "radio") {
      let shouldSelect = false;
      if (typeof targetValue === "boolean") {
        shouldSelect = targetValue;
      } else if (targetValue instanceof RegExp) {
        shouldSelect = targetValue.test(el.value) || targetValue.test(descriptor);
      } else {
        shouldSelect = el.value.toLowerCase() === String(targetValue).toLowerCase();
      }

      if (shouldSelect) {
        setNativeChecked(el, true);
        triggerEvents(el);
        filledCount++;
      }
    } else {
      // standard inputs and textareas
      setNativeValue(el, String(targetValue));
      triggerEvents(el);
      filledCount++;
    }
  });

  console.info(`Form Filler: Matched and populated ${filledCount} field(s).`);
})();