'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('declara idioma, título e descrição', () => {
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /<title>[^<]*Equação Acessível/);
  assert.match(html, /name="description"/);
});

test('tem estrutura semântica com um único h1', () => {
  assert.match(html, /class="skip-link" href="#main"/);
  assert.match(html, /<main id="main">/);
  assert.equal((html.match(/<h1/g) || []).length, 1);
});

test('referências locais existem', () => {
  const refs = [...html.matchAll(/(?:href|src)="([^"#]+)"/g)]
    .map((m) => m[1])
    .filter((r) => !/^https?:|^data:|^\/_vercel\//.test(r));
  assert.ok(refs.length >= 5);
  for (const ref of refs) assert.ok(fs.existsSync(path.join(root, ref)), `ausente: ${ref}`);
});

test('estado do sistema é anunciado', () => {
  assert.match(html, /id="status"[^>]*role="status"/);
  assert.match(html, /aria-live="polite"/);
});

test('CSP restritiva e sem scripts externos', () => {
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /default-src 'self'/);
  assert.doesNotMatch(html, /src="https?:\/\//);
});

test('campos têm rótulo associado', () => {
  const ids = [...html.matchAll(/<textarea[^>]*id="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length >= 1);
  for (const id of ids) assert.match(html, new RegExp(`for="${id}"`));
});

test('pré-visualização é isolada por sandbox', () => {
  assert.match(html, /<iframe[^>]*sandbox=""/);
});

test('credita OlacDev', () => {
  assert.match(html, /Made by OlacDev/);
  assert.match(html, /https:\/\/olacdev\.com\//);
});

test('o exemplo da interface converte sem erro', () => {
  const sheet = require('../src/sheet.js');
  const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
  const match = app.match(/const SAMPLE = `([\s\S]*?)`;/);
  assert.ok(match, 'esperava a amostra no app.js');
  const sample = match[1]
    .replace(/\\\\/g, '\\')
    .replace(/\\`/g, '`')
    .replace(/\\\$/g, '$');
  const out = sheet.buildSheet(sample);
  assert.equal(out.errors.length, 0, JSON.stringify(out.errors));
  assert.ok(out.blocks.filter((b) => b.type === 'math' && !b.inline).length >= 3);
});
