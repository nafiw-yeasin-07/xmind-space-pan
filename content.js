(() => {
  "use strict";

  const STATE = {
    spaceDown: false,
    dragging: false,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
    panEl: null
  };

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = (el.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function findBestPanElement() {
    const candidates = [];

    const pushIfValid = (el) => {
      if (!el) return;
      const cs = getComputedStyle(el);
      const overflowOk =
        cs.overflowX === "auto" || cs.overflowX === "scroll" ||
        cs.overflowY === "auto" || cs.overflowY === "scroll";
      if (!overflowOk) return;

      const area = (el.scrollWidth - el.clientWidth) + (el.scrollHeight - el.clientHeight);
      if (area <= 2000) return;

      candidates.push({ el, area });
    };

    pushIfValid(document.scrollingElement);

    document.querySelectorAll("*").forEach((el) => {
      if (el.clientWidth < 300 || el.clientHeight < 300) return;
      pushIfValid(el);
    });

    candidates.sort((a, b) => b.area - a.area);
    return candidates[0]?.el || document.scrollingElement;
  }

  function ensurePanEl() {
    if (STATE.panEl && document.contains(STATE.panEl)) return STATE.panEl;
    STATE.panEl = findBestPanElement();
    return STATE.panEl;
  }

  function setCursor(mode) {
    const root = document.documentElement;
    if (mode === "grab") root.style.cursor = "grab";
    if (mode === "grabbing") root.style.cursor = "grabbing";
    if (mode === "none") root.style.cursor = "";
  }

  function onKeyDown(e) {
    if (e.code !== "Space") return;
    if (e.repeat) return;
    if (isTypingTarget(e.target)) return;

    STATE.spaceDown = true;
    ensurePanEl();

    e.preventDefault();
    e.stopPropagation();

    setCursor("grab");
  }

  function onKeyUp(e) {
    if (e.code !== "Space") return;

    STATE.spaceDown = false;
    STATE.dragging = false;

    setCursor("none");
  }

  function onMouseDown(e) {
    if (!STATE.spaceDown) return;
    if (e.button !== 0) return;
    if (isTypingTarget(e.target)) return;

    const panEl = ensurePanEl();
    if (!panEl) return;

    STATE.dragging = true;
    STATE.startX = e.clientX;
    STATE.startY = e.clientY;
    STATE.startScrollLeft = panEl.scrollLeft;
    STATE.startScrollTop = panEl.scrollTop;

    e.preventDefault();
    e.stopPropagation();

    setCursor("grabbing");
  }

  function onMouseMove(e) {
    if (!STATE.dragging) return;

    const panEl = ensurePanEl();
    if (!panEl) return;

    const dx = e.clientX - STATE.startX;
    const dy = e.clientY - STATE.startY;

    panEl.scrollLeft = STATE.startScrollLeft - dx;
    panEl.scrollTop = STATE.startScrollTop - dy;

    e.preventDefault();
    e.stopPropagation();
  }

  function stopDrag() {
    if (!STATE.dragging) return;
    STATE.dragging = false;
    if (STATE.spaceDown) setCursor("grab");
    else setCursor("none");
  }

  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp, true);

  window.addEventListener("mousedown", onMouseDown, true);
  window.addEventListener("mousemove", onMouseMove, true);
  window.addEventListener("mouseup", stopDrag, true);
  window.addEventListener("blur", () => {
    STATE.spaceDown = false;
    STATE.dragging = false;
    setCursor("none");
  }, true);
})();
