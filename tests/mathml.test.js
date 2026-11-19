'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const latex = require('../src/latex.js');
const mathml = require('../src/mathml.js');

const render = (source, opts) => mathml.toMathML(latex.parse(source), opts);

test('gera MathML com namespaces, semantics e alttext', () => {
  const out = render('x');
  assert.match(out, /^<math xmlns="http:\/\/www\.w3\.org\/1998\/Math\/MathML"/);
  assert.match(out, /<semantics>/);
  assert.match(out, /<annotation encoding="application\/x-speech">/);
  assert.match(out, /alttext="/);
});

test('usa display inline e block', () => {
  assert.match(render('x'), /display="inline"/);
  assert.match(render('x', { display: true }), /display="block"/);
});

test('identificador vira mi e número vira mn', () => {
  assert.match(render('x'), /<mi>x<\/mi>/);
  assert.match(render('42'), /<mn>42<\/mn>/);
});

test('operador vira mo', () => {
  assert.match(render('a+b'), /<mo>\+<\/mo>/);
});

test('fração vira mfrac com dois filhos', () => {
  const out = render('\\frac{1}{2}');
  assert.match(out, /<mfrac><mn>1<\/mn><mn>2<\/mn><\/mfrac>/);
});

test('potência vira msup', () => {
  assert.match(render('x^2'), /<msup><mi>x<\/mi><mn>2<\/mn><\/msup>/);
});

test('subscrito vira msub', () => {
  assert.match(render('a_1'), /<msub><mi>a<\/mi><mn>1<\/mn><\/msub>/);
});

test('raiz sem índice vira msqrt e com índice vira mroot', () => {
  assert.match(render('\\sqrt{x}'), /<msqrt><mi>x<\/mi><\/msqrt>/);
  assert.match(render('\\sqrt[3]{x}'), /<mroot><mi>x<\/mi><mn>3<\/mn><\/mroot>/);
});

test('função usa aplicação invisível', () => {
  assert.match(render('\\sin x'), /&#x2061;/);
});

test('delimitadores viram mo', () => {
  const out = render('(a)');
  assert.match(out, /<mo>\(<\/mo>/);
  assert.match(out, /<mo>\)<\/mo>/);
});

test('escapa caracteres perigosos', () => {
  const out = render('a<b');
  assert.match(out, /&lt;/);
  assert.doesNotMatch(out, /<mo><\/mo>/);
});

test('fala traduz operadores relacionais', () => {
  assert.equal(mathml.speech(latex.parse('a \\le b')), 'a menor ou igual a b');
  assert.equal(mathml.speech(latex.parse('a \\neq b')), 'a diferente de b');
});

test('fala descreve fração e raiz', () => {
  assert.equal(mathml.speech(latex.parse('\\frac{1}{2}')), 'fração com numerador 1 e denominador 2');
  assert.equal(mathml.speech(latex.parse('\\sqrt{x}')), 'raiz quadrada de x');
});

test('fala descreve potência e subscrito', () => {
  assert.equal(mathml.speech(latex.parse('x^2')), 'x elevado a 2');
  assert.equal(mathml.speech(latex.parse('a_i')), 'a subscrito i');
});

test('fala descreve funções em português', () => {
  assert.equal(mathml.speech(latex.parse('\\sin x')), 'seno de x');
  assert.equal(mathml.speech(latex.parse('\\log x')), 'logaritmo de x');
});

test('fala descreve somatório', () => {
  assert.equal(mathml.speech(latex.parse('\\sum')), 'somatório');
});

test('fala lê decimais com vírgula', () => {
  assert.equal(mathml.speech(latex.parse('3.5')), '3 vírgula 5');
});

test('linear produz forma curta legível', () => {
  assert.equal(mathml.linear(latex.parse('x^2')), 'x^(2)');
  assert.equal(mathml.linear(latex.parse('\\frac{a}{b}')), '(a)/(b)');
});

test('linear usa ponto para multiplicação implícita', () => {
  assert.equal(mathml.linear(latex.parse('2x')), '2·x');
});
