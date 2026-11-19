'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const latex = require('../src/latex.js');

test('lê número e identificador', () => {
  assert.deepEqual(latex.parse('42'), { type: 'number', value: '42' });
  assert.deepEqual(latex.parse('x'), { type: 'identifier', value: 'x' });
});

test('normaliza vírgula decimal', () => {
  assert.deepEqual(latex.parse('3,14'), { type: 'number', value: '3.14' });
});

test('respeita precedência de multiplicação sobre soma', () => {
  const ast = latex.parse('a + b * c');
  assert.equal(ast.type, 'binary');
  assert.equal(ast.op, '+');
  assert.equal(ast.right.op, '*');
});

test('interpreta multiplicação implícita', () => {
  const ast = latex.parse('2x');
  assert.equal(ast.op, 'implicit');
  assert.equal(ast.left.value, '2');
  assert.equal(ast.right.value, 'x');
});

test('interpreta potência', () => {
  const ast = latex.parse('x^2');
  assert.equal(ast.type, 'sup');
  assert.equal(ast.base.value, 'x');
  assert.equal(ast.exp.value, '2');
});

test('interpreta subscrito', () => {
  const ast = latex.parse('a_i');
  assert.equal(ast.type, 'sub');
  assert.equal(ast.sub.value, 'i');
});

test('interpreta subscrito e potência no mesmo símbolo', () => {
  const ast = latex.parse('x_i^2');
  assert.equal(ast.type, 'subsup');
  assert.equal(ast.sub.value, 'i');
  assert.equal(ast.sup.value, '2');
});

test('interpreta fração', () => {
  const ast = latex.parse('\\frac{a+b}{2}');
  assert.equal(ast.type, 'frac');
  assert.equal(ast.num.type, 'binary');
  assert.equal(ast.den.value, '2');
});

test('interpreta raiz quadrada e raiz de índice', () => {
  assert.equal(latex.parse('\\sqrt{x}').type, 'sqrt');
  const cubed = latex.parse('\\sqrt[3]{x}');
  assert.equal(cubed.type, 'sqrt');
  assert.equal(cubed.index.value, '3');
});

test('interpreta letras gregas', () => {
  assert.equal(latex.parse('\\pi').value, 'π');
  assert.equal(latex.parse('\\Omega').value, 'Ω');
});

test('converte operadores relacionais', () => {
  assert.equal(latex.parse('a \\le b').op, '≤');
  assert.equal(latex.parse('a \\neq b').op, '≠');
});

test('interpreta funções trigonométricas e logarítmicas', () => {
  const ast = latex.parse('\\sin x');
  assert.equal(ast.type, 'function');
  assert.equal(ast.name, 'sin');
  assert.equal(ast.arg.value, 'x');
});

test('interpreta somatório e integral', () => {
  assert.equal(latex.parse('\\sum').value, '∑');
  assert.equal(latex.parse('\\int').value, '∫');
});

test('interpreta delimitadores', () => {
  const ast = latex.parse('(a+b)');
  assert.equal(ast.type, 'delim');
  assert.equal(ast.open, '(');
  assert.equal(ast.body.type, 'binary');
});

test('interpreta acentos', () => {
  const ast = latex.parse('\\vec{v}');
  assert.equal(ast.type, 'accent');
  assert.equal(ast.mark, '→');
});

test('interpreta texto literal', () => {
  assert.equal(latex.parse('\\text{km/h}').value, 'km/h');
});

test('rejeita expressão vazia', () => {
  assert.throws(() => latex.parse(''), /vazia/);
});

test('rejeita parêntese não fechado', () => {
  assert.throws(() => latex.parse('(a+b'), /Esperava/);
});

test('rejeita comando desconhecido', () => {
  assert.throws(() => latex.parse('\\foo{x}'), /não suportado/);
});

test('rejeita caractere desconhecido', () => {
  assert.throws(() => latex.parse('a # b'), /não suportado/);
});

test('ignora comentários de linha', () => {
  const ast = latex.parse('a + b % comentário');
  assert.equal(ast.op, '+');
});

test('tokeniza números, comandos e símbolos', () => {
  const tokens = latex.tokenize('2\\pi x_1');
  assert.deepEqual(tokens.map((t) => t.value), ['2', 'pi', 'x', '_', '1']);
});

test('aceita chaves como agrupamento', () => {
  const ast = latex.parse('{a+b}^2');
  assert.equal(ast.type, 'sup');
});
