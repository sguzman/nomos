'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { colorForId, hueForId, paletteIndex } = require('../docs/rule-colors.js');
const catalog = require('../docs/catalog.json');

function labFromHex(hex) {
  const encoded = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255);
  const linear = encoded.map(c => c<=.04045 ? c/12.92 : ((c+.055)/1.055)**2.4);
  const [r,g,b] = linear;
  const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b);
  const m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b);
  const s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
  return [
    .2104542553*l+.793617785*m-.0040720468*s,
    1.9779984951*l-2.428592205*m+.4505937099*s,
    .0259040371*l+.7827717662*m-.808675766*s
  ];
}
function perceptualDistance(hex1,hex2) {
  const a=labFromHex(hex1),b=labFromHex(hex2);
  return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
}
function smallestSeparation(ids, appearance) {
  let minimum=Infinity;
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++) {
    minimum=Math.min(minimum,perceptualDistance(
      colorForId(ids[i])[appearance],colorForId(ids[j])[appearance]));
  }
  return minimum;
}
test('colors are deterministic by ID and valid in both appearance modes',()=>{
  for(const id of ['NOM-0001','NOM-0042','NOM-0067','GROUP-0001','GROUP-0008','other/x']) {
    assert.deepEqual(colorForId(id),colorForId(id));
    assert.match(colorForId(id).day,/^#[0-9a-f]{6}$/);
    assert.match(colorForId(id).night,/^#[0-9a-f]{6}$/);
    assert.equal(hueForId(id),colorForId(id).hue);
  }
});
test('all published rule and group swatches have nontrivial OKLab separation',()=>{
  const ids=[...catalog.rules.map(r=>r.id),...catalog.groups.map(g=>g.id)];
  assert.equal(new Set(ids.map(id=>colorForId(id).day)).size,ids.length);
  assert.equal(new Set(ids.map(id=>colorForId(id).night)).size,ids.length);
  for(const mode of ['day','night']) {
    const distance=smallestSeparation(ids,mode);
    assert.ok(distance>.038,mode+' minimum perceptual distance was '+distance);
  }
});
test('reported near-purple examples are now perceptually separated',()=>{
  const ids=['NOM-0042','NOM-0029','NOM-0021','NOM-0055','NOM-0050',
             'NOM-0008','GROUP-0002','NOM-0063','NOM-0037','NOM-0034'];
  for(const mode of ['day','night']){
    const distance=smallestSeparation(ids,mode);
    assert.ok(distance>.055,mode+' screenshot pair minimum distance: '+distance);
  }
});
test('group catalog metadata matches each current color identity',()=>{
  for(const group of catalog.groups){
    assert.equal(group.color.hue_degrees,hueForId(group.id));
    assert.equal(group.color.scheme,'oklab_maximin_v2');
  }
});
test('palette slots for current rule and group namespaces are independent',()=>{
  assert.equal(paletteIndex('NOM-0001'),0);
  assert.equal(paletteIndex('NOM-0067'),66);
  assert.equal(paletteIndex('GROUP-0001'),127);
  assert.equal(paletteIndex('GROUP-0008'),134);
  assert.equal(new Set([...catalog.rules,...catalog.groups].map(x=>paletteIndex(x.id))).size,75);
});
