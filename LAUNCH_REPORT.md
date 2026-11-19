# Launch Report — Equação Acessível (ACC-008)

**Data:** 19/11/2026
**Projeto:** `matematica-acessivel-stem`
**Licença:** MIT
**Responsável:** Ferreira, A. A. (OlacDev)

## Estado

| Etapa | Estado | Evidência |
| --- | --- | --- |
| Build local | Concluído | 11 arquivos publicados, sem dependências de execução |
| Testes | 65/65 | `node --test tests/*.test.js` |
| GitHub | Publicado | `ArthurAlvDev/matematica-acessivel-stem` (branch `main`) |
| Vercel | Publicado | `https://matematica-acessivel-stem.vercel.app` (HTTP 200) |
| Domínio próprio | Pendente de DNS | `equacao.olacdev.com` adicionado; aguarda CNAME no Cloudflare |
| Artigo | Pronto (não publicado) | `ARTIGO_CIENTIFICO.md` |

## Escopo entregue

- Parser LaTeX com precedência, multiplicação implícita, derivadas por apóstrofo e erros com linha.
- MathML semântico com `semantics`, `alttext` e anotação `application/x-speech`.
- Leitura automática em PT-BR por tipo de nó (fração, raiz, potência, função, relação, decimais).
- Folha STEM acessível com equações numeradas, fonte LaTeX e leitura visível.
- Exportação: HTML autônomo, Markdown, relatório com erros por linha, cópia de MathML.
- Pré-visualização em `iframe sandbox=""` e CSP restritiva.
- Marca: "Made by OlacDev" no rodapé e no HTML exportado.

## Verificações executadas

- `node --test`: 65 testes, 65 aprovados.
- Produção: `/`, `/src/app.js` e `/src/mathml.js` retornam 200.
- Fórmula de Bhaskara interpretada corretamente (verificado por AST e por teste).
- Teste garante que o exemplo exibido na interface converte sem erro.

## Pendências e riscos

1. **DNS do domínio próprio** — CNAME `equacao` → `d5ca2773671cbaff.vercel-dns-017.com`.
2. **Cobertura parcial de LaTeX** — matrizes, `cases` e `align` recusados com mensagem explícita.
3. **Leitura automática é rascunho** — declarado na interface e no relatório gerado.
4. **Sem teste com leitores de tela reais** nesta versão.

## Próximo passo sugerido

Testar a folha gerada em NVDA + MathCAT e em VoiceOver; avaliar edição manual do `alttext` na interface.
