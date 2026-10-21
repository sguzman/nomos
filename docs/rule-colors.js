'use strict';
/** Stable, order-independent OKLCH hue identity derived from each rule ID.
 * Consecutive numeric IDs advance around the wheel by the golden angle.
 * No finite palette guarantees globally unique visible colors. */
const NomosColor = (() => {
  const GOLDEN_ANGLE = 137.50776405003785;
  function hashId(text) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash;
  }
  function hueForId(id) {
    const value = String(id);
    const match = /^(.*?)(\d+)$/.exec(value);
    let angle;
    if (match && Number.isSafeInteger(Number(match[2]))) {
      const namespace = match[1] + ':' + match[2].length;
      angle = (hashId(namespace) % 360 + Number(match[2]) * GOLDEN_ANGLE) % 360;
    } else {
      angle = (hashId(value) * GOLDEN_ANGLE) % 360;
    }
    return Number(((angle + 360) % 360).toFixed(3));
  }
  return Object.freeze({ hueForId });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = NomosColor;
