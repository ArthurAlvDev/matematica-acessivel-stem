/* Equação Acessível — interface (100% local). */
(function () {
  'use strict';

  const state = { sheet: null, title: 'Folha STEM acessível' };
  const $ = (id) => document.getElementById(id);

  const SAMPLE = `# Função quadrática

A forma geral de uma função quadrática é $f(x) = ax^2 + bx + c$, com $a \\neq 0$.

As raízes são dadas pela fórmula de Bhaskara:

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

O discriminante é $\\Delta = b^2 - 4ac$ e decide quantas raízes reais existem.

## Derivada

A derivada de $f$ é $f'(x) = 2ax + b$. O vértice está em $x_v = \\frac{-b}{2a}$.

## Notação científica

$$N = m \\times 10^{n}$$

com $1 \\le m < 10$ e $n \\in \\mathbb{Z}$.

## Soma de uma série

$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$`;

  function setStatus(message, kind) {
    const el = $('status');
    el.textContent = message;
    el.dataset.kind = kind || 'info';
  }

  function convert() {
    const source = $('source').value;
    if (!source.trim()) {
      setStatus('Cole algum conteúdo com fórmulas para converter.', 'error');
      return;
    }
    const sheet = StemSheet.buildSheet(source);
    state.sheet = sheet;

    const equations = sheet.blocks.filter((b) => b.type === 'math' && !b.inline);
    const inline = sheet.blocks.filter((b) => b.type === 'math' && b.inline);

    $('results').hidden = false;
    $('stat-equations').textContent = String(equations.length);
    $('stat-inline').textContent = String(inline.length);
    $('stat-blocks').textContent = String(sheet.blocks.length);
    $('stat-errors').textContent = String(sheet.errors.length);

    renderErrors(sheet);
    renderPreview(sheet);
    renderEquations(equations);

    if (sheet.errors.length) {
      setStatus(`Conversão concluída com ${sheet.errors.length} erro(s) de sintaxe. Veja a lista no resumo.`, 'error');
    } else {
      setStatus(`Conversão concluída: ${equations.length} equação(ões) em destaque e ${inline.length} fórmula(s) no texto.`, 'ok');
    }
  }

  function renderErrors(sheet) {
    const box = $('errors');
    if (!sheet.errors.length) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    box.hidden = false;
    box.innerHTML =
      '<strong>Erros de sintaxe</strong><ul>' +
      sheet.errors
        .map((e) => `<li>Linha ${e.line}: ${escapeHTML(e.message)} <code>${escapeHTML(e.source || '')}</code></li>`)
        .join('') +
      '</ul>';
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderPreview(sheet) {
    const html = StemSheet.sheetHTML(sheet, { title: state.title });
    $('preview').srcdoc = html;
  }

  function renderEquations(equations) {
    const list = $('equations');
    list.innerHTML = '';
    if (!equations.length) {
      list.innerHTML = '<p class="muted">Nenhuma equação em destaque. Use <code>$$...$$</code> para criar uma.</p>';
      return;
    }

    equations.forEach((block, index) => {
      const figure = document.createElement('article');
      figure.className = 'equation';
      const mathml = MathMLBuilder.toMathML(block.ast, { display: false });
      figure.innerHTML =
        `<header><strong>Equação ${index + 1}</strong><span class="source">${escapeHTML(block.source)}</span></header>` +
        `<div class="math-holder">${mathml}</div>` +
        `<p class="reading"><strong>Leitura:</strong> ${escapeHTML(MathMLBuilder.speech(block.ast))}</p>` +
        `<button type="button" class="ghost" data-index="${index}">Copiar MathML</button>`;
      list.appendChild(figure);
    });

    list.querySelectorAll('button[data-index]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const block = equations[Number(btn.dataset.index)];
        const code = MathMLBuilder.toMathML(block.ast, { display: true });
        try {
          await navigator.clipboard.writeText(code);
          setStatus('MathML copiado para a área de transferência.', 'ok');
        } catch (_e) {
          setStatus('O navegador bloqueou a cópia. Exporte a folha em HTML.', 'error');
        }
      });
    });
  }

  function download(name, content, type) {
    const blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function bind() {
    $('btn-convert').addEventListener('click', convert);

    $('btn-sample').addEventListener('click', () => {
      $('source').value = SAMPLE;
      convert();
    });

    $('btn-clear').addEventListener('click', () => {
      $('source').value = '';
      $('results').hidden = true;
      state.sheet = null;
      setStatus('Pronto. Cole o conteúdo e clique em Converter.', 'info');
      $('source').focus();
    });

    $('btn-html').addEventListener('click', () => {
      if (!state.sheet) return;
      download('folha-stem-acessivel.html', StemSheet.sheetHTML(state.sheet, { title: state.title }), 'text/html;charset=utf-8');
      setStatus('Folha HTML exportada.', 'ok');
    });

    $('btn-md').addEventListener('click', () => {
      if (!state.sheet) return;
      download('folha-stem-acessivel.md', StemSheet.sheetMarkdown(state.sheet, { title: state.title }), 'text/markdown;charset=utf-8');
      setStatus('Folha Markdown exportada.', 'ok');
    });

    $('btn-report').addEventListener('click', () => {
      if (!state.sheet) return;
      download('relatorio-folha.md', StemSheet.reportMarkdown(state.sheet, { title: state.title }), 'text/markdown;charset=utf-8');
      setStatus('Relatório exportado.', 'ok');
    });

    $('btn-copy').addEventListener('click', async () => {
      if (!state.sheet) return;
      try {
        await navigator.clipboard.writeText(StemSheet.reportMarkdown(state.sheet, { title: state.title }));
        setStatus('Relatório copiado.', 'ok');
      } catch (_e) {
        setStatus('O navegador bloqueou a cópia. Use o download.', 'error');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bind();
    setStatus('Pronto. Nada é enviado para servidores: a conversão acontece no seu navegador.', 'info');
  });
})();
