'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { hueForId } = require('../docs/rule-colors.js');

test('color stable, in bounds, and independent of catalog order', () => {
  const ids = ['NOM-0001', 'NOM-0002', 'NOM-0003', 'NOM-0004'];
  const original = new Map(ids.map(id => [id, hueForId(id)]));
  for (const id of [...ids].reverse()) {
    assert.equal(hueForId(id), original.get(id));
    assert.ok(original.get(id) >= 0 && original.get(id) < 360);
  }
});
test('adjacent numeric IDs are perceptually spaced around hue wheel', () => {
  const hues = Array.from({length: 8}, (_, i) => hueForId('NOM-' + String(i+1).padStart(4,'0')));
  assert.equal(new Set(hues).size, hues.length);
  for (let i = 1; i < hues.length; i++) {
    const distance = Math.abs(hues[i] - hues[i-1]);
    assert.ok(Math.min(distance,360-distance)>120);
  }
});
test('arbitrary string IDs remain deterministic', () => {
  assert.equal(hueForId('rule/privacy'), hueForId('rule/privacy'));
});
test('initial catalog colors are distinct', () => {
  assert.equal(new Set(['NOM-0001','NOM-0002','NOM-0003','NOM-0004'].map(hueForId)).size, 4);
});
