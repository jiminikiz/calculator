import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initial, press } from './calc.js';

const run = (keys, s = initial()) => keys.reduce(press, s);

test('precedence', () => {
  assert.equal(run([...'2+3*4', '=']).entry, '14');
});

test('result becomes the next entry', () => {
  const s = run([...'4263.03-50=', '-', '1', '3', '=']);
  assert.equal(s.entry, '4200.03');
  assert.equal(s.lastExpr, '4213.03 − 13');
});

test('a digit after = starts over', () => {
  assert.equal(run([...'2+2=', '7']).entry, '7');
});

test('float noise is tidied', () => {
  assert.equal(run([...'0.1+0.2=']).entry, '0.3');
});

test('operator replaces operator', () => {
  assert.equal(run([...'5+*2=']).entry, '10');
});

test('leading minus', () => {
  assert.equal(run([...'-5+2=']).entry, '-3');
});

test('percent', () => {
  assert.equal(run([...'200*5%=']).entry, '10');
});

test('divide by zero is an error, not a history entry', () => {
  const s = run([...'1/0=']);
  assert.equal(s.error, true);
  assert.equal(s.history.length, 0);
});

test('back steps into the previous number', () => {
  const s = run([...'12+', 'back', 'back']);
  assert.equal(s.entry, '1');
});

test('history newest first', () => {
  const s = run([...'1+1=', ...'*3=']);
  assert.deepEqual(s.history.map((h) => h.result), ['6', '2']);
});
