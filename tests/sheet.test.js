'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const sheet = require('../src/sheet.js');

const DOC = `# Função quadrática

A forma geral é $f(x) = ax^2 + bx + c$, com $a \\neq 0$.

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

O discriminante é $\\Delta = b^2 - 4ac$.
`;

test('detecta títulos, texto e equações', () => {
  const out = sheet.buildSheet(DOC);
  const headings = out.blocks.filter((b) => b.type === 'heading');
  const display = out.blocks.filter((b) => b.type === 'math' && !b.inline);
  const inline = out.blocks.filter((b) => b.type === 'math' && b.inline);
  assert.equal(headings.length, 1);
  assert.equal(headings[0].level, 1);
  assert.equal(display.length, 1);
  assert.ok(inline.length >= 2);
  assert.equal(out.errors.length, 0);
});

test('mantém o texto ao redor da fórmula', () => {
  const out = sheet.buildSheet('O valor de $x$ é positivo.');
  const texts = out.blocks.filter((b) => b.type === 'text').map((b) => b.value.trim());
  assert.ok(texts.includes('O valor de'));
  assert.ok(texts.includes('é positivo.'));
});

test('aceita bloco $$ em várias linhas', () => {
  const out = sheet.buildSheet('$$\na + b\n$$\n');
  assert.equal(out.blocks.filter((b) => b.type === 'math').length, 1);
  assert.match(out.blocks.find((b) => b.type === 'math').source, /a \+ b/);
});

test('aceita bloco $$ em uma linha', () => {
  const out = sheet.buildSheet('$$E = mc^2$$');
  const math = out.blocks.find((b) => b.type === 'math');
  assert.equal(math.source, 'E = mc^2');
  assert.equal(math.inline, false);
});

test('registra erro de sintaxe com a linha', () => {
  const out = sheet.buildSheet('ok\n$$\\foo{x}$$');
  assert.equal(out.errors.length, 1);
  assert.equal(out.errors[0].line, 2);
  assert.match(out.errors[0].message, /não suportado/);
});

test('registra bloco $$ sem fechamento', () => {
  const out = sheet.buildSheet('$$\na + b\n');
  assert.equal(out.errors.length, 1);
  assert.match(out.errors[0].message, /sem fechamento/);
});

test('HTML inclui MathML, leitura e numeração', () => {
  const out = sheet.buildSheet(DOC);
  const html = sheet.sheetHTML(out, { title: 'Teste' });
  assert.match(html, /<!DOCTYPE html>/);
  assert.match(html, /lang="pt-BR"/);
  assert.match(html, /<title>Teste<\/title>/);
  assert.match(html, /Equação 1/);
  assert.match(html, /<strong>Leitura:<\/strong>/);
  assert.match(html, /<math xmlns/);
  assert.match(html, /Made by OlacDev/);
});

test('HTML numera equações em sequência', () => {
  const out = sheet.buildSheet(DOC + '\n$$a + b$$\n');
  const html = sheet.sheetHTML(out);
  assert.match(html, /Equação 1/);
  assert.match(html, /Equação 2/);
});

test('HTML escapa texto do usuário', () => {
  const out = sheet.buildSheet('Use <script>alert(1)</script> aqui.');
  const html = sheet.sheetHTML(out);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;/);
});

test('Markdown exporta LaTeX, leitura e forma linear', () => {
  const out = sheet.buildSheet(DOC);
  const md = sheet.sheetMarkdown(out, { title: 'Folha' });
  assert.match(md, /# Folha/);
  assert.match(md, /```latex/);
  assert.match(md, /\*\*Leitura:\*\*/);
  assert.match(md, /\*\*Forma linear:\*\*/);
});

test('relatório conta blocos e lista equações', () => {
  const out = sheet.buildSheet(DOC);
  const md = sheet.reportMarkdown(out, { title: 'Folha' });
  assert.match(md, /# Relatório da folha — Folha/);
  assert.match(md, /Equações em destaque: \*\*1\*\*/);
  assert.match(md, /Nenhum erro de sintaxe/);
  assert.match(md, /Nota metodológica/);
});

test('relatório informa erros quando existem', () => {
  const out = sheet.buildSheet('$$\\foo$$');
  const md = sheet.reportMarkdown(out);
  assert.match(md, /Linha 1/);
});

test('documento vazio não quebra', () => {
  const out = sheet.buildSheet('');
  assert.equal(out.blocks.length, 0);
  assert.equal(out.errors.length, 0);
  assert.match(sheet.sheetHTML(out), /<h1>/);
});

test('inline não vira figura', () => {
  const out = sheet.buildSheet('Seja $x = 1$.');
  const html = sheet.sheetHTML(out);
  assert.doesNotMatch(html, /<figure/);
  assert.match(html, /display="inline"/);
});
