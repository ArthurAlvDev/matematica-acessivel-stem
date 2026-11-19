# Equação Acessível

Conversor web **100% local** de LaTeX para **MathML semântico**, com leitura em português e geração de folhas STEM acessíveis em HTML, Markdown e relatório.

- Site: <https://equacao.olacdev.com>
- Licença: MIT
- Feito por **OlacDev** — <https://olacdev.com/>

## O problema

Fórmulas em páginas web são, muitas vezes, imagens ou notação renderizada sem estrutura. Leitores de tela não conseguem ler a expressão, e a pessoa cega ou com baixa visão perde exatamente o conteúdo central da aula. MathML resolve isso quando é semântico — mas escrever MathML à mão é inviável para quem já escreve em LaTeX.

## O que a ferramenta faz

1. **Converte LaTeX em MathML semântico** (`<math>` com `semantics`, `alttext` e anotação de fala em PT-BR).
2. **Gera a leitura em voz**: "fração com numerador menos b mais ou menos raiz quadrada de b ao quadrado menos 4 a c e denominador 2 a".
3. **Monta a folha acessível**: títulos, texto, fórmulas no texto e equações numeradas com leitura e fonte LaTeX.
4. **Exporta** HTML autônomo (abre em qualquer navegador, MathML preservado), Markdown e relatório com erros de sintaxe por linha.
5. **Aponta erros** com a linha exata em vez de falhar em silêncio.

## Como usar

1. Cole o conteúdo em Markdown, com `$...$` para fórmulas no texto e `$$...$$` para equações em destaque.
2. Clique em **Converter**.
3. Revise a pré-visualização e a leitura de cada equação.
4. Exporte a folha `.html` ou `.md`.

## Sintaxe suportada

| Grupo | Comandos |
| --- | --- |
| Estrutura | `\frac{}{}`, `\sqrt{}`, `\sqrt[3]{}`, `^`, `_`, `_^`, `(...)`, `[...]`, `\|...\|` |
| Gregas | `\alpha` … `\omega`, `\Gamma` … `\Omega` |
| Relações | `\le`, `\ge`, `\neq`, `\approx`, `\equiv`, `\to`, `\in`, `\subset`, `\subseteq` |
| Operadores | `\pm`, `\cdot`, `\times`, `\div`, `\infty`, `\partial`, `\emptyset` |
| Grandes operadores | `\sum`, `\prod`, `\int`, `\iint`, `\oint`, `\lim` |
| Funções | `\sin`, `\cos`, `\tan`, `\log`, `\ln`, `\exp`, `\max`, `\min`, `\det`, `\gcd` |
| Texto e acentos | `\text{}`, `\mathrm{}`, `\vec{}`, `\hat{}`, `\bar{}`, `f'` |
| Conjuntos numéricos | `\mathbb{Z}`, `\mathbb{R}`, `\mathbb{N}`, `\mathbb{Q}`, `\mathbb{C}` |

**Não suportado nesta versão:** ambientes `matrix`, `cases`, `align`, `\overbrace`, `\underbrace`, cores e macros personalizadas. O erro é reportado na interface e no relatório.

## Estrutura

```
index.html          interface acessível (atalho, foco visível, status ao vivo)
src/latex.js        tokenizador e parser descendente recursivo (precedência, implícito)
src/mathml.js       AST → MathML + fala PT-BR + forma linear
src/sheet.js        Markdown com $...$ / $$...$$ → folha, Markdown e relatório
src/app.js          interface, pré-visualização em iframe isolado, exportações
tests/              65 testes (node:test), sem dependências
```

## Desenvolvimento

```bash
npm test        # 65 testes
npm run serve   # http://localhost:8081
```

## Decisões de acessibilidade

- `alttext` em **todas** as expressões, mesmo quando o leitor de tela não suporta MathML.
- `annotation encoding="application/x-speech"` com a leitura em PT-BR.
- Texto alternativo descreve a **estrutura** ("fração com numerador …"), não o glifo.
- Interface com foco visível, contraste AA, `aria-live` para status e respeito a `prefers-reduced-motion`.
- Pré-visualização em `iframe sandbox=""`: o HTML gerado nunca executa script na origem do app.

## Privacidade

Nenhuma requisição de rede após o carregamento. Sem cookies, sem analytics, sem fontes externas. A CSP restringe scripts, estilos e frames à própria origem.

## Limitações conhecidas

- Cobertura parcial de LaTeX (subconjunto declarado acima).
- A leitura automática é um rascunho: notação específica de disciplina pode precisar de ajuste manual no `alttext`.
- Sem teste formal com usuários nesta versão.

## Licença

MIT — veja [LICENSE](LICENSE).

Citação sugerida:

> FERREIRA, A. A. **Equação Acessível: conversor local de LaTeX para MathML semântico e folhas STEM acessíveis**. 2026. Software. Disponível em: <https://equacao.olacdev.com>.
