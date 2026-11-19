/* Folha STEM acessível: Markdown com $...$ e $$...$$ → MathML + leitura em voz. */
(function (root, factory) {
  const deps =
    typeof module === 'object' && module.exports
      ? { parser: require('./latex.js'), mathml: require('./mathml.js') }
      : { parser: root.LatexParser, mathml: root.MathMLBuilder };
  const api = factory(deps.parser, deps.mathml);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StemSheet = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (parser, mathml) {
  'use strict';

  const INLINE_RE = /\$([^$\n]+)\$/g;

  function parseMath(source) {
    return parser.parse(source);
  }

  function splitInline(text) {
    const parts = [];
    let last = 0;
    let match;
    INLINE_RE.lastIndex = 0;
    while ((match = INLINE_RE.exec(text))) {
      if (match.index > last) parts.push({ type: 'text', value: text.slice(last, match.index) });
      parts.push({ type: 'math', source: match[1], inline: true });
      last = match.index + match[0].length;
    }
    if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
    return parts;
  }

  function buildSheet(input) {
    const lines = String(input || '').replace(/\r\n?/g, '\n').split('\n');
    const blocks = [];
    const errors = [];
    let displayBuffer = null;

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const trimmed = line.trim();

      if (displayBuffer !== null) {
        if (trimmed.endsWith('$$')) {
          const source = (displayBuffer + ' ' + trimmed.slice(0, -2)).trim();
          displayBuffer = null;
          try {
            blocks.push({ type: 'math', source, ast: parseMath(source), inline: false, line: i + 1 });
          } catch (err) {
            errors.push({ line: i + 1, source, message: err.message });
          }
        } else {
          displayBuffer += ' ' + trimmed;
        }
        continue;
      }

      if (trimmed.startsWith('$$')) {
        const rest = trimmed.slice(2);
        if (rest.endsWith('$$') && rest.length > 2) {
          const source = rest.slice(0, -2).trim();
          try {
            blocks.push({ type: 'math', source, ast: parseMath(source), inline: false, line: i + 1 });
          } catch (err) {
            errors.push({ line: i + 1, source, message: err.message });
          }
        } else if (rest.trim()) {
          displayBuffer = rest.trim();
        } else {
          displayBuffer = '';
        }
        continue;
      }

      if (/^#{1,6}\s+/.test(trimmed)) {
        const level = trimmed.match(/^#+/)[0].length;
        blocks.push({ type: 'heading', level: Math.min(level, 3), value: trimmed.replace(/^#+\s+/, ''), line: i + 1 });
        continue;
      }

      if (!trimmed) continue;

      const parts = splitInline(trimmed);
      for (const part of parts) {
        if (part.type === 'text') {
          blocks.push({ type: 'text', value: part.value, line: i + 1 });
        } else {
          try {
            blocks.push({ type: 'math', source: part.source, ast: parseMath(part.source), inline: true, line: i + 1 });
          } catch (err) {
            errors.push({ line: i + 1, source: part.source, message: err.message });
          }
        }
      }
    }

    if (displayBuffer !== null) {
      errors.push({ line: lines.length, source: displayBuffer, message: 'Bloco $$ sem fechamento.' });
    }

    return { blocks, errors };
  }

  function renderBlock(block, counters, index) {
    if (block.type === 'heading') {
      const level = block.level;
      return `<h${level}>${mathml.esc(block.value)}</h${level}>`;
    }
    if (block.type === 'text') {
      return `<p>${mathml.esc(block.value)}</p>`;
    }
    if (block.inline) {
      return mathml.toMathML(block.ast, { display: false });
    }
    counters.equation += 1;
    const number = counters.equation;
    return (
      `<figure class="equation" id="eq-${number}">` +
      `<figcaption>Equação ${number}</figcaption>` +
      mathml.toMathML(block.ast, { display: true }) +
      `<p class="reading"><strong>Leitura:</strong> ${mathml.esc(mathml.speech(block.ast))}</p>` +
      `<p class="source"><strong>LaTeX:</strong> <code>${mathml.esc(block.source)}</code></p>` +
      '</figure>'
    );
  }

  function sheetHTML(sheet, options) {
    const opts = options || {};
    const counters = { equation: 0 };
    // MathML inline precisa ficar dentro de um parágrafo para não quebrar o fluxo.
    const output = [];
    let paragraph = [];

    const flush = () => {
      if (paragraph.length) {
        output.push(`<p>${paragraph.join(' ')}</p>`);
        paragraph = [];
      }
    };

    sheet.blocks.forEach((block, index) => {
      if (block.type === 'math' && block.inline) {
        paragraph.push(mathml.toMathML(block.ast, { display: false }));
        return;
      }
      if (block.type === 'text') {
        paragraph.push(mathml.esc(block.value));
        return;
      }
      flush();
      output.push(renderBlock(block, counters, index));
    });
    flush();

    const title = opts.title || 'Folha STEM acessível';
    const head = `<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${mathml.esc(title)}</title>\n`;
    const style = `<style>body{font:1rem/1.6 system-ui,Segoe UI,Arial,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1rem;color:#14162b}figure.equation{border:1px solid #d7dceb;border-radius:12px;padding:1rem;margin:1.2rem 0;background:#fbfcff}figcaption{font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:#4a4f6a}math{font-size:1.35rem}.reading{font-size:.92rem;color:#333}.source code{background:#eef1fa;padding:.1rem .35rem;border-radius:4px}h1,h2,h3{line-height:1.25}</style>\n`;
    const body = `<body>\n<h1>${mathml.esc(title)}</h1>\n${output.join('\n')}\n<p><small>Gerado pelo Equação Acessível · Made by OlacDev · olacdev.com</small></p>\n</body>\n</html>\n`;
    return head + style + '</head>\n' + body;
  }

  function sheetMarkdown(sheet, options) {
    const opts = options || {};
    const title = opts.title || 'Folha STEM acessível';
    const lines = [`# ${title}`, ''];
    let equation = 0;
    for (const block of sheet.blocks) {
      if (block.type === 'heading') {
        lines.push(`${'#'.repeat(block.level)} ${block.value}`, '');
      } else if (block.type === 'text') {
        lines.push(block.value, '');
      } else if (block.inline) {
        lines.push(`\`$${block.source}$\``);
      } else {
        equation += 1;
        lines.push(`### Equação ${equation}`, '', '```latex', block.source, '```', '');
        lines.push(`**Leitura:** ${mathml.speech(block.ast)}`, '');
        lines.push(`**Forma linear:** \`${mathml.linear(block.ast)}\``, '');
      }
    }
    lines.push('---', '', 'Gerado pelo Equação Acessível · Made by OlacDev · https://olacdev.com/');
    return lines.join('\n') + '\n';
  }

  function reportMarkdown(sheet, options) {
    const opts = options || {};
    const count = (type) => sheet.blocks.filter((b) => b.type === type).length;
    const equations = sheet.blocks.filter((b) => b.type === 'math' && !b.inline);
    const inline = sheet.blocks.filter((b) => b.type === 'math' && b.inline);
    const lines = [
      `# Relatório da folha — ${opts.title || 'sem título'}`,
      '',
      `- Blocos de texto: **${count('text')}**`,
      `- Títulos: **${count('heading')}**`,
      `- Equações em destaque: **${equations.length}**`,
      `- Fórmulas no texto: **${inline.length}**`,
      `- Erros de sintaxe: **${sheet.errors.length}**`,
      '',
      '## Equações',
      '',
    ];
    equations.forEach((block, i) => {
      lines.push(`${i + 1}. \`${block.source}\``);
      lines.push(`   - Leitura: ${mathml.speech(block.ast)}`);
    });
    if (!equations.length) lines.push('Nenhuma equação em destaque.');
    lines.push('', '## Erros', '');
    if (sheet.errors.length) {
      sheet.errors.forEach((e) => lines.push(`- Linha ${e.line}: ${e.message} (\`${e.source}\`)`));
    } else {
      lines.push('Nenhum erro de sintaxe.');
    }
    lines.push('', '## Nota metodológica', '');
    lines.push(
      'Cada equação é convertida em MathML semântico com `alttext` e uma anotação de fala em PT-BR, para leitores de tela que suportam MathML (NVDA + MathCAT, VoiceOver) ou que consomem o texto alternativo. A leitura automática é um rascunho: revise termos técnicos e notação específica da disciplina.'
    );
    return lines.join('\n') + '\n';
  }

  return { buildSheet, sheetHTML, sheetMarkdown, reportMarkdown, parseMath, splitInline };
});
