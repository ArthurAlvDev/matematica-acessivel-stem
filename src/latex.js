/* Parser de um subconjunto de LaTeX matemático — sem dependências, navegador e Node. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LatexParser = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const GREEK = {
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε',
    zeta: 'ζ', eta: 'η', theta: 'θ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ',
    pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', varphi: 'φ', chi: 'χ',
    psi: 'ψ', omega: 'ω',
    Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π',
    Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  };

  const OPERATORS = {
    cdot: '⋅', times: '×', div: '÷', pm: '±', mp: '∓',
    le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠',
    approx: '≈', equiv: '≡', sim: '∼', propto: '∝',
    to: '→', rightarrow: '→', leftarrow: '←', Leftrightarrow: '⇔', Rightarrow: '⇒',
    in: '∈', notin: '∉', subset: '⊂', subseteq: '⊆', cup: '∪', cap: '∩',
    emptyset: '∅', forall: '∀', exists: '∃', neg: '¬', land: '∧', lor: '∨',
    infty: '∞', partial: '∂', nabla: '∇', angle: '∠', perp: '⊥', parallel: '∥',
  };

  const BIG = {
    sum: '∑', prod: '∏', int: '∫', iint: '∬', oint: '∮', lim: 'lim',
  };

  const FUNCS = new Set(['sin', 'cos', 'tan', 'log', 'ln', 'exp', 'max', 'min', 'lim', 'det', 'mod', 'gcd']);

  const ACCENTS = { vec: '→', hat: '^', bar: '¯', tilde: '~', dot: '˙', ddot: '¨' };

  const REL = new Set([
    'le', 'leq', 'ge', 'geq', 'ne', 'neq', 'approx', 'equiv', 'sim', 'propto',
    'to', 'rightarrow', 'leftarrow', 'Leftrightarrow', 'Rightarrow', 'in', 'notin',
    'subset', 'subseteq',
  ]);

  const BINCMD = new Set(['pm', 'mp', 'cdot', 'times', 'div']);

  function tokenize(input) {
    const src = String(input || '');
    const tokens = [];
    let i = 0;
    while (i < src.length) {
      const ch = src[i];
      if (ch === '%') {
        while (i < src.length && src[i] !== '\n') i += 1;
        continue;
      }
      if (/\s/.test(ch)) { i += 1; continue; }
      if (ch === '\\') {
        const match = src.slice(i + 1).match(/^[a-zA-Z]+/);
        if (match) {
          tokens.push({ type: 'command', value: match[0] });
          i += 1 + match[0].length;
          continue;
        }
        tokens.push({ type: 'command', value: src[i + 1] || '' });
        i += 2;
        continue;
      }
      if (/[0-9]/.test(ch)) {
        const match = src.slice(i).match(/^\d+(?:[.,]\d+)?/);
        tokens.push({ type: 'number', value: match[0].replace(',', '.') });
        i += match[0].length;
        continue;
      }
      if (/[a-zA-Z]/.test(ch)) {
        tokens.push({ type: 'identifier', value: ch });
        i += 1;
        continue;
      }
      if ('+-*/=<>()[]{}^_|,\''.includes(ch)) {
        tokens.push({ type: 'symbol', value: ch });
        i += 1;
        continue;
      }
      if (ch === '&') { tokens.push({ type: 'symbol', value: '&' }); i += 1; continue; }
      throw new Error(`Caractere não suportado: "${ch}" na posição ${i}.`);
    }
    return tokens;
  }

  function parse(input) {
    const tokens = tokenize(input);
    let pos = 0;

    const peek = () => tokens[pos];
    const next = () => tokens[pos++];
    const isSymbol = (v) => peek() && peek().type === 'symbol' && peek().value === v;
    const isCmd = (v) => peek() && peek().type === 'command' && peek().value === v;

    function expectSymbol(v) {
      if (!isSymbol(v)) throw new Error(`Esperava "${v}".`);
      return next();
    }

    function parseRelational() {
      let left = parseAdditive();
      for (;;) {
        const t = peek();
        if (t && t.type === 'symbol' && '=<>'.includes(t.value)) {
          next();
          left = { type: 'binary', op: t.value, left, right: parseAdditive() };
          continue;
        }
        if (t && t.type === 'command' && REL.has(t.value)) {
          next();
          left = { type: 'binary', op: OPERATORS[t.value], left, right: parseAdditive() };
          continue;
        }
        break;
      }
      return left;
    }

    function parseAdditive() {
      let left = parseMultiplicative();
      for (;;) {
        const t = peek();
        if (t && t.type === 'symbol' && '+-'.includes(t.value)) {
          next();
          left = { type: 'binary', op: t.value, left, right: parseMultiplicative() };
          continue;
        }
        if (t && t.type === 'command' && (t.value === 'pm' || t.value === 'mp')) {
          next();
          left = { type: 'binary', op: OPERATORS[t.value], left, right: parseMultiplicative() };
          continue;
        }
        break;
      }
      return left;
    }

    function startsAtom() {
      const t = peek();
      if (!t) return false;
      if (t.type === 'number' || t.type === 'identifier') return true;
      if (t.type === 'command') {
        if (REL.has(t.value) || BINCMD.has(t.value)) return false;
        return true;
      }
      return t.type === 'symbol' && '([|'.includes(t.value);
    }

    function parseMultiplicative() {
      let left = parseUnary();
      for (;;) {
        const t = peek();
        if (!t) break;
        if (t.type === 'symbol' && (t.value === '*' || t.value === '/')) {
          const op = next().value;
          left = { type: 'binary', op, left, right: parseUnary() };
          continue;
        }
        if (t.type === 'command' && ['cdot', 'times', 'div'].includes(t.value)) {
          const op = next().value;
          left = { type: 'binary', op: op === 'cdot' ? '*' : op === 'times' ? '×' : '÷', left, right: parseUnary() };
          continue;
        }
        if (startsAtom()) {
          left = { type: 'binary', op: 'implicit', left, right: parseUnary() };
          continue;
        }
        break;
      }
      return left;
    }

    function parseUnary() {
      if (isSymbol('-')) { next(); return { type: 'unary', op: '-', value: parseUnary() }; }
      if (isSymbol('+')) { next(); return { type: 'unary', op: '+', value: parseUnary() }; }
      return parsePostfix();
    }

    function parsePostfix() {
      let base = parseAtom();
      for (;;) {
        if (isSymbol("'")) {
          next();
          base = { type: 'prime', base };
          continue;
        }
        if (isSymbol('^')) {
          next();
          const exp = parseAtom();
          base = base.type === 'sub' ? { type: 'subsup', base: base.base, sub: base.sub, sup: exp } : { type: 'sup', base, exp };
          continue;
        }
        if (isSymbol('_')) {
          next();
          const sub = parseAtom();
          base = base.type === 'sup' ? { type: 'subsup', base: base.base, sub, sup: base.exp } : { type: 'sub', base, sub };
          continue;
        }
        break;
      }
      return base;
    }

    function parseGroup(stopSymbol) {
      const body = [];
      while (peek() && !isSymbol(stopSymbol)) {
        body.push(parseRelational());
        if (isSymbol(',')) next();
      }
      expectSymbol(stopSymbol);
      return body.length === 1 ? body[0] : { type: 'row', body };
    }

    function readRawGroup() {
      expectSymbol('{');
      let out = '';
      let depth = 0;
      while (peek()) {
        const t = next();
        if (t.type === 'symbol' && t.value === '}') {
          if (depth === 0) return out;
          depth -= 1;
          out += '}';
          continue;
        }
        if (t.type === 'symbol' && t.value === '{') { depth += 1; out += '{'; continue; }
        if (t.type === 'command') { out += OPERATORS[t.value] || GREEK[t.value] || t.value; continue; }
        out += t.value;
      }
      throw new Error('Grupo de texto sem fechamento.');
    }

    function parseAtom() {
      const t = peek();
      if (!t) throw new Error('Expressão incompleta.');

      if (t.type === 'number') { next(); return { type: 'number', value: t.value }; }

      if (t.type === 'identifier') { next(); return { type: 'identifier', value: t.value }; }

      if (t.type === 'symbol') {
        if (t.value === '(') { next(); const inner = parseGroup(')'); return { type: 'delim', open: '(', close: ')', body: inner }; }
        if (t.value === '[') { next(); const inner = parseGroup(']'); return { type: 'delim', open: '[', close: ']', body: inner }; }
        if (t.value === '{') { next(); return parseGroup('}'); }
        if (t.value === '|') { next(); const inner = parseGroup('|'); return { type: 'delim', open: '|', close: '|', body: inner }; }
      }

      if (t.type === 'command') {
        const cmd = next().value;

        if (GREEK[cmd]) return { type: 'identifier', value: GREEK[cmd], greek: true };
        if (OPERATORS[cmd]) return { type: 'operator', value: OPERATORS[cmd], name: cmd };
        if (BIG[cmd]) return { type: 'bigop', value: BIG[cmd], name: cmd };

        if (cmd === 'frac' || cmd === 'dfrac' || cmd === 'tfrac') {
          const num = parseAtom();
          const den = parseAtom();
          return { type: 'frac', num, den };
        }
        if (cmd === 'sqrt') {
          let index = null;
          if (isSymbol('[')) { next(); index = parseGroup(']'); }
          const value = parseAtom();
          return { type: 'sqrt', index, value };
        }
        if (cmd === 'text' || cmd === 'mathrm' || cmd === 'operatorname') {
          return { type: 'text', value: readRawGroup() };
        }
        if (cmd === 'mathbb') {
          const raw = readRawGroup();
          const map = { Z: 'ℤ', R: 'ℝ', N: 'ℕ', Q: 'ℚ', C: 'ℂ', P: 'ℙ', H: 'ℍ' };
          return { type: 'identifier', value: raw.split('').map((c) => map[c] || c).join('') };
        }
        if (ACCENTS[cmd]) return { type: 'accent', mark: ACCENTS[cmd], value: parseAtom() };
        if (FUNCS.has(cmd)) {
          const arg = startsAtom() ? parseAtom() : null;
          return { type: 'function', name: cmd, arg };
        }
        if (cmd === 'left' || cmd === 'right') return parseAtom();
        if (cmd === ',' || cmd === ';' || cmd === '!' || cmd === 'quad' || cmd === 'qquad') return { type: 'space' };
        if (cmd === 'begin' || cmd === 'end') throw new Error('Ambientes (matrix, cases) ainda não são suportados nesta versão.');

        throw new Error(`Comando não suportado: \\${cmd}`);
      }

      throw new Error(`Token inesperado: "${t.value}".`);
    }

    function collectText(node) {
      if (!node) return '';
      if (node.type === 'text') return node.value;
      if (node.type === 'identifier') return node.value;
      if (node.type === 'number') return node.value;
      if (node.type === 'row') return node.body.map(collectText).join('');
      return '';
    }

    if (!tokens.length) throw new Error('Expressão vazia.');
    const ast = parseRelational();
    if (pos < tokens.length) throw new Error(`Trecho não interpretado: "${tokens[pos].value}".`);
    return ast;
  }

  return { parse, tokenize, GREEK, OPERATORS, BIG, FUNCS, ACCENTS };
});
