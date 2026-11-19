/* AST matemático → MathML semântico + descrição em fala (PT-BR). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MathMLBuilder = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SPEECH = {
    '+': 'mais', '-': 'menos', '*': 'vezes', '×': 'vezes', '÷': 'dividido por',
    '=': 'igual a', '<': 'menor que', '>': 'maior que',
    '≤': 'menor ou igual a', '≥': 'maior ou igual a', '≠': 'diferente de',
    '≈': 'aproximadamente igual a', '≡': 'equivalente a', '∼': 'semelhante a',
    '∝': 'proporcional a', '→': 'tende a', '←': 'recebe', '⇒': 'implica', '⇔': 'se e somente se',
    '∈': 'pertence a', '∉': 'não pertence a', '⊂': 'está contido em', '⊆': 'está contido ou é igual a',
    '∪': 'união', '∩': 'interseção', '∅': 'conjunto vazio', '∀': 'para todo', '∃': 'existe',
    '¬': 'não', '∧': 'e', '∨': 'ou', '∞': 'infinito', '∂': 'derivada parcial',
    '∇': 'nabla', '∠': 'ângulo', '⊥': 'perpendicular', '∥': 'paralelo', '±': 'mais ou menos', '∓': 'menos ou mais',
  };

  const BIG_SPEECH = { '∑': 'somatório', '∏': 'produtório', '∫': 'integral', '∬': 'integral dupla', '∮': 'integral de contorno' };

  const FUNC_SPEECH = {
    sin: 'seno', cos: 'cosseno', tan: 'tangente', log: 'logaritmo', ln: 'logaritmo natural',
    exp: 'exponencial', max: 'máximo', min: 'mínimo', lim: 'limite', det: 'determinante',
    mod: 'módulo', gcd: 'máximo divisor comum',
  };

  function esc(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function speech(node) {
    if (!node) return '';
    switch (node.type) {
      case 'number':
        return node.value.replace('.', ' vírgula ');
      case 'identifier':
        return node.value;
      case 'text':
        return node.value;
      case 'operator':
        return SPEECH[node.value] || node.value;
      case 'bigop': {
        const base = BIG_SPEECH[node.value] || node.value;
        return node.name === 'lim' ? 'limite' : base;
      }
      case 'space':
        return '';
      case 'row':
        return node.body.map(speech).join(', ');
      case 'binary': {
        if (node.op === 'implicit') return `${speech(node.left)} ${speech(node.right)}`;
        return `${speech(node.left)} ${SPEECH[node.op] || node.op} ${speech(node.right)}`;
      }
      case 'unary':
        return `${node.op === '-' ? 'menos ' : ''}${speech(node.value)}`;
      case 'frac':
        return `fração com numerador ${speech(node.num)} e denominador ${speech(node.den)}`;
      case 'sqrt':
        if (node.index) return `raiz de índice ${speech(node.index)} de ${speech(node.value)}`;
        return `raiz quadrada de ${speech(node.value)}`;
      case 'sup':
        return `${speech(node.base)} elevado a ${speech(node.exp)}`;
      case 'sub':
        return `${speech(node.base)} subscrito ${speech(node.sub)}`;
      case 'subsup':
        return `${speech(node.base)} subscrito ${speech(node.sub)} elevado a ${speech(node.sup)}`;
      case 'function':
        return node.arg ? `${FUNC_SPEECH[node.name] || node.name} de ${speech(node.arg)}` : FUNC_SPEECH[node.name] || node.name;
      case 'accent':
        return `${speech(node.value)} com acento ${node.mark === '→' ? 'vetorial' : node.mark}`;
      case 'prime':
        return `${speech(node.base)} linha`;
      case 'delim':
        return `${node.open === '(' ? 'abre parênteses' : node.open === '[' ? 'abre colchetes' : 'módulo de'} ${speech(node.body)} ${
          node.close === ')' ? 'fecha parênteses' : node.close === ']' ? 'fecha colchetes' : 'fim do módulo'
        }`;
      default:
        return '';
    }
  }

  function linear(node) {
    if (!node) return '';
    switch (node.type) {
      case 'number': return node.value;
      case 'identifier': return node.value;
      case 'text': return node.value;
      case 'operator': return node.value;
      case 'bigop': return node.value;
      case 'space': return ' ';
      case 'row': return node.body.map(linear).join(', ');
      case 'binary':
        if (node.op === 'implicit') return `${linear(node.left)}·${linear(node.right)}`;
        return `${linear(node.left)} ${node.op} ${linear(node.right)}`;
      case 'unary': return `${node.op}${linear(node.value)}`;
      case 'frac': return `(${linear(node.num)})/(${linear(node.den)})`;
      case 'sqrt': return node.index ? `root(${linear(node.index)})(${linear(node.value)})` : `√(${linear(node.value)})`;
      case 'sup': return `${linear(node.base)}^(${linear(node.exp)})`;
      case 'sub': return `${linear(node.base)}_(${linear(node.sub)})`;
      case 'subsup': return `${linear(node.base)}_(${linear(node.sub)})^(${linear(node.sup)})`;
      case 'function': return node.arg ? `${node.name}(${linear(node.arg)})` : node.name;
      case 'accent': return `${linear(node.value)}${node.mark}`;
      case 'prime': return `${linear(node.base)}′`;
      case 'delim': return `${node.open}${linear(node.body)}${node.close}`;
      default: return '';
    }
  }

  function toMathML(node, options) {
    const opts = options || {};
    const display = opts.display ? ' display="block"' : ' display="inline"';

    function render(n) {
      switch (n.type) {
        case 'number':
          return `<mn>${esc(n.value)}</mn>`;
        case 'identifier':
          return `<mi>${esc(n.value)}</mi>`;
        case 'text':
          return `<mtext>${esc(n.value)}</mtext>`;
        case 'operator':
          return `<mo>${esc(n.value)}</mo>`;
        case 'bigop':
          return `<mo largeop="true" movablelimits="true">${esc(n.value)}</mo>`;
        case 'space':
          return '<mspace width="0.3em"/>';
        case 'row':
          return `<mrow>${n.body.map(render).join('')}</mrow>`;
        case 'binary':
          if (n.op === 'implicit') return `<mrow>${render(n.left)}${render(n.right)}</mrow>`;
          return `<mrow>${render(n.left)}<mo>${esc(n.op)}</mo>${render(n.right)}</mrow>`;
        case 'unary':
          return `<mrow><mo>${esc(n.op)}</mo>${render(n.value)}</mrow>`;
        case 'frac':
          return `<mfrac>${render(n.num)}${render(n.den)}</mfrac>`;
        case 'sqrt':
          if (!n.index) return `<msqrt>${render(n.value)}</msqrt>`;
          return `<mroot>${render(n.value)}${render(n.index)}</mroot>`;
        case 'sup':
          return `<msup>${render(n.base)}${render(n.exp)}</msup>`;
        case 'sub':
          return `<msub>${render(n.base)}${render(n.sub)}</msub>`;
        case 'subsup':
          return `<msubsup>${render(n.base)}${render(n.sub)}${render(n.sup)}</msubsup>`;
        case 'function':
          if (!n.arg) return `<mi>${esc(n.name)}</mi>`;
          return `<mrow><mi>${esc(n.name)}</mi><mo>&#x2061;</mo>${render(n.arg)}</mrow>`;
        case 'accent':
          return `<mover accent="true">${render(n.value)}<mo>${esc(n.mark)}</mo></mover>`;
        case 'prime':
          return `<mrow>${render(n.base)}<mo>′</mo></mrow>`;
        case 'delim':
          return `<mrow><mo>${esc(n.open)}</mo>${render(n.body)}<mo>${esc(n.close)}</mo></mrow>`;
        default:
          return '';
      }
    }

    const body = render(node);
    const spoken = speech(node);
    return (
      `<math xmlns="http://www.w3.org/1998/Math/MathML"${display} alttext="${esc(spoken)}">` +
      `<semantics>${body}<annotation encoding="application/x-speech">${esc(spoken)}</annotation></semantics>` +
      '</math>'
    );
  }

  return { toMathML, speech, linear, esc, SPEECH, FUNC_SPEECH };
});
