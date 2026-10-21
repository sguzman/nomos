'use strict';
/**
 * Nomos identity palette v2, keyed solely by the stable rule/group ID.
 *
 * Frozen OKLab-maximin palette: candidate colors are sampled in OKLCH,
 * gamut-mapped to sRGB for both appearances, then greedily chosen to maximize
 * the smaller nearest-neighbor OKLab distance across day/night variants.
 *
 * This avoids the golden-angle/Fibonacci near-collision seen among scattered
 * rule IDs. Palette slots do not depend on catalog order or selected items.
 * GROUP-0001..GROUP-0008 occupy the first eight most separated slots;
 * NOM-0001..NOM-0128 occupy the next 128 disjoint palette slots. Other IDs use a stable hash fallback.
 * Colors cannot be mathematically unique for unlimited identifiers.
 */
const NomosColor = (() => {
  const DAY = '6bd11e 15a4fb 590fb2 205f0d fb9c18 f479f4 055077 ab209e 6da373 7e62a2 906816 cd4111 23d0ce 149612 e0327f 0f3bbe b6bb3f 187a72 6e2470 ed9bad 2a72bd b8a5fd 8f3ecb 62400e 18d38a 483b85 9a636b b31442 d056d2 a69260 ec694e 63821d a77ce0 21a4a8 5946dc 951362 185544 a55195 ae83a7 69486b 974924 c47b1b 7aac10 84c2d5 546a3e 8087bc 4b6f92 7e0f9c 208c57 a3bd8b e076a9 a79510 27b942 7cc06b c62786 6b36a0 7172d4 56c19b 1588a9 19badc bc5a5a a34164 c36ec2 7d270b a41b0c 768452 ac714c deab16 3b5997 24aa6c 474e1c d29a86 c8b66d ab54c0 3f2baf 9255e3 086d46 d19bd1 883a71 880622 704389 484974 89a54c 6b5d0c 166270 68a7bb 784740 85b3f3 3e85f3 d46522 cd52ad 936189 90409e 599e3f 89c6b0 7d562d 518a6c 850f7e c88791 247929 606caa 08468b b56b9d cc3855 90822b 32a388 2c5cc1 722a53 c49749 a03183 9c4142 5a90b6 6baf9f 939bde 0b6a9c bc0d63 ee516d e2883e 478d95 a0c837 56d05f 615297 8c4e69 576a0d a572b4 67394c af591b a4a865 cd83f2 1293ca 353a97 a63cc6 af98c4 7849ce 5f30c3 b066dc'.split(' ');
  const NIGHT = '83ea44 7ec5fe 9463fc 5f9e50 febe7b fea5fd 508fba e65fd6 90c896 af92d6 c3994f fd7853 4ae7e5 52c54c fe7ca9 4e82fd ced45a 57afa5 b265b4 feb6c5 5ea4f4 cec3fe c078fd a47f50 46eca2 857acb cc9199 f45b75 f97dfa cbb582 fe9c86 91b253 c9a3fe 54cace 8b8afd da5a9e 5b9581 d980c7 d3a7cc a681a7 d37f5b eda24b 9acf45 9ad9ec 89a172 a6aee5 7ca2c7 bf5cdf 59bc84 bbd5a2 fe9ac8 ccb945 55dc65 97dc86 fd61b6 a573e2 9ca0fd 74ddb6 52b6d8 4ad7fb ee8685 de7697 ea92e8 c5684e e9604c a2b17d da9b76 f7c33e 7192d5 56d190 848d5a efb6a1 dfcd83 da81ef 7672f9 b990fd 53a77d ebb4eb c773ab d4585f ab7cc6 8486b4 abc76e a4954d 589dab 88c8dd b78078 a8ccfe 81b2fd fe9056 fa7bd7 c590ba c875d7 80c768 9fddc7 b68d63 7eb798 c959bf eba8b1 5eb05e 8f9ddf 4e87d3 e192c6 fd7184 bbad59 5fcbad 6094fd b86993 e5b769 dc69bb d97775 81b8e0 8bcfbf b2bafe 51a1d6 fb5796 fe919c feaa6a 73b9c0 b6df53 71e978 9789d3 c5829e 8ca24e ce9adf aa768a e48950 c3c683 e1abfe 4ebcf6 6e7cdf d970fb ceb5e4 a784fd 9476fd d493fe'.split(' ');
  const HUES = '136.077 244.033 294.041 139.914 66.201 327.349 239.976 332.549 147.211 303.391 79.775 36.671 193.679 142.507 359.741 264.269 111.756 186.038 326.441 5.372 252.773 293.349 307.185 71.928 159.177 288.335 10.501 13.37 327.176 87.842 33.405 125.352 302.478 198.406 281.253 350.16 169.847 334.746 331.732 324.742 44.221 66.882 127.933 218.37 130.276 277.975 247.95 317.232 156.434 130.183 351.331 100.326 145.467 139.599 349.907 303.13 280.77 167.09 223.371 218.043 21.477 0.587 327.886 36.784 30.427 121.231 51.63 86.4 263.932 157.26 116.07 40.928 95.808 319.652 280.283 299.851 159.685 326.334 340.801 19.502 312.675 282.398 123.753 98.018 212.731 220.308 28.62 256.789 259.012 47.14 339.026 334.017 321.321 138.256 170.099 65.984 160.151 331.092 9.818 143.898 274.69 256.002 340.425 14.131 100.348 173.045 262.792 348.09 79.474 339.825 22.005 240.63 177.662 278.234 240.52 0.289 14.04 56.763 204.575 124.092 144.746 291.438 353.208 121.77 318.001 354.626 51.225 111.068 313.449 235.049 274.932 317.163 308.424 295.049 290.424 311.202'.split(' ').map(Number);
  function hashId(text) {
    let hash = 0x811c9dc5;
    for (const ch of String(text)) {
      hash ^= ch.codePointAt(0);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash;
  }
  function paletteIndex(value) {
    const id = String(value);
    const rule = /^NOM-(\d+)$/.exec(id);
    const group = /^GROUP-(\d+)$/.exec(id);
    if (rule) {
      const n = Number(rule[1]);
      if (Number.isSafeInteger(n) && n >= 1 && n <= 128) return n+7;
    }
    if (group) {
      const n = Number(group[1]);
      if (Number.isSafeInteger(n) && n >= 1 && n <= 8) return n-1;
    }
    return hashId(id) % DAY.length;
  }
  function colorForId(id) {
    const i = paletteIndex(id);
    return { day: '#' + DAY[i], night: '#' + NIGHT[i], hue: HUES[i] };
  }
  function hueForId(id) {
    return HUES[paletteIndex(id)];
  }
  return Object.freeze({ colorForId, hueForId, paletteIndex });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = NomosColor;
