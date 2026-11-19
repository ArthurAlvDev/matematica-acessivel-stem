# Equação Acessível: conversão local de LaTeX em MathML semântico para material STEM

**Arthur Alves Ferreira (Ferreira, A. A.)**
OlacDev · <https://olacdev.com/>

**Versão:** 1.0 · **Data:** 19/11/2026
**Licença do texto:** CC BY 4.0 · **Licença do software:** MIT
**Tipo de recurso (Zenodo):** Preprint · **Idioma:** Português (Brasil)

*Pré-print interno. Ainda não depositado em repositório de dados; ao publicar, substituir esta nota pelo DOI. A versão citável do software é o repositório público indicado nas referências.*

---

## Resumo

Fórmulas matemáticas publicadas na web continuam sendo, com frequência, imagens raster ou notação renderizada visualmente sem estrutura semântica. Para leitores de tela, o resultado é a perda do conteúdo central da aula: a expressão em si. Este trabalho apresenta o **Equação Acessível**, aplicação web estática e *client-side* que converte um subconjunto de LaTeX em **MathML semântico**, gera automaticamente uma **leitura em português** para cada expressão e monta **folhas STEM acessíveis** exportáveis em HTML autônomo e Markdown. O conversor é implementado por um analisador descendente recursivo com precedência, multiplicação implícita e tratamento de erros com indicação de linha. A descrição falada é produzida por um segundo passe sobre a árvore sintática, traduzindo estrutura (fração, raiz, potência, subscrito, operadores relacionais) em enunciados em PT-BR, exportada como `alttext` e como anotação `application/x-speech`. A suíte de testes soma 65 casos, incluindo integridade da página e verificação de que o exemplo embutido converte sem erro. Discutem-se os limites da leitura automática e a necessidade de revisão humana de notação específica.

**Palavras-chave:** acessibilidade digital; MathML; LaTeX; leitores de tela; educação STEM; WCAG 2.2.

## 1. Introdução

A notação matemática é uma barreira recorrente para estudantes cegos ou com baixa visão. A WCAG 2.2 trata do tema em 1.1.1 (conteúdo não textual) e 1.3.1 (informação e relações), e a recomendação técnica consolidada é oferecer a expressão em MathML — formato nativo dos navegadores, com estrutura de árvore que leitores de tela podem percorrer — acompanhada de texto alternativo significativo.

Na prática, três padrões problemáticos persistem: (i) equações exportadas como imagem (`<img src="eq3.png">`), sem qualquer texto alternativo útil; (ii) equações como texto Unicode sem estrutura, em que "x²" é lido como "x dois"; (iii) conversões que geram MathML puramente visual, sem `alttext` nem anotação, dependendo inteiramente do suporte do leitor de tela.

Ao mesmo tempo, o LaTeX é o formato em que professores e autores efetivamente escrevem. A distância entre "escrever em LaTeX" e "publicar MathML semântico com descrição" é onde o material se perde.

**Objetivo.** Descrever e validar uma ferramenta que percorre esse caminho — LaTeX → AST → MathML semântico + fala — inteiramente no navegador, sem depender de serviços externos e sem exigir instalação.

## 2. Fundamentação

### 2.1 MathML e leitores de tela

MathML permite representar frações, raízes, índices e operadores de modo que a tecnologia assistiva reconstrua a expressão. O suporte varia: NVDA com MathCAT e VoiceOver oferecem navegação estrutural; outros leitores consomem o atributo `alttext` ou a anotação `annotation`. Por isso, uma implementação defensiva fornece **três camadas**: a estrutura MathML, o `alttext` e a anotação de fala.

### 2.2 A leitura como tradução, não transliteração

Ler "x^2" como "x circunflexo dois" é transliteração e não ajuda. A leitura útil descreve a operação: "x elevado a 2". Do mesmo modo, "\\frac{a}{b}" deve virar "fração com numerador a e denominador b", e "\\sqrt{b^2-4ac}" deve virar "raiz quadrada de b ao quadrado menos 4 a c". Essa tradução exige conhecer a estrutura da árvore, não apenas os caracteres.

### 2.3 Erros explícitos

Ferramentas que falham em silêncio produzem material incompleto sem que o autor perceba. Reportar a linha exata e o trecho que falhou é requisito de qualidade, não conveniência.

## 3. Método

### 3.1 Arquitetura

| Módulo | Responsabilidade |
| --- | --- |
| `latex.js` | Tokenizador (comandos, números com vírgula decimal, símbolos) e parser descendente recursivo: relação → aditiva → multiplicativa (com implícita) → unária → pós-fixos (`^`, `_`, `'`) → átomo |
| `mathml.js` | AST → MathML (`mfrac`, `msqrt`, `mroot`, `msup`, `msub`, `msubsup`, `mover`, `munder`…), fala PT-BR e forma linear |
| `sheet.js` | Interpretação de Markdown com `$...$` e `$$...$$`, montagem da folha, exportação HTML/Markdown e relatório |
| `app.js` | Interface, pré-visualização em `iframe sandbox`, cópia de MathML e downloads |

### 3.2 Gramática implementada

O parser cobre: números (com normalização de vírgula), identificadores de um caractere, letras gregas, operadores binários (`\pm`, `\cdot`, `\times`, `\div`), relações (`\le`, `\ge`, `\neq`, `\approx`, `\in`, `\subset`…), frações, raízes (com e sem índice), potências, subscritos, derivadas por apóstrofo, funções nomeadas (`\sin`, `\log`…), grandes operadores (`\sum`, `\int`…), texto literal (`\text{}`), acentos (`\vec{}`) e conjuntos numéricos (`\mathbb{Z}`).

Ambientes como `matrix` e `cases` são deliberadamente recusados com mensagem explícita, em vez de gerar saída incorreta.

### 3.3 Multiplicação implícita

`2x`, `4ac` e `(a+b)(a-b)` são multiplicações. O parser trata a justaposição de átomos como operador `implicit`, marca essa origem na árvore e renderiza sem `<mo>` visível, preservando a leitura correta ("2 x") e a forma linear (`2·x`).

### 3.4 Geração da fala

A função `speech(ast)` percorre a árvore e produz enunciados por tipo de nó: fração ("fração com numerador … e denominador …"), raiz ("raiz quadrada de …", "raiz de índice 3 de …"), potência ("… elevado a …"), subscrito ("… subscrito …"), função ("seno de x"), relação ("menor ou igual a"), delimitadores ("abre parênteses … fecha parênteses"), decimais ("3 vírgula 5") e derivadas ("f linha"). O resultado é gravado em `alttext` e na anotação de fala, e exibido na interface junto de cada equação para revisão.

### 3.5 Isolamento da pré-visualização

O HTML gerado é exibido em `iframe` com `sandbox=""`, sem permissão de script. Assim, mesmo que o autor cole conteúdo malicioso, o pior caso é texto renderizado — nunca execução na origem da aplicação. A CSP da página reforça a restrição.

## 4. Validação

| Arquivo | Foco | Testes |
| --- | --- | --- |
| `latex.test.js` | precedência, implícita, potência/subscrito, fração, raiz, gregas, relações, funções, erros | 24 |
| `mathml.test.js` | estrutura MathML, `semantics`, `alttext`, escapes, fala, forma linear | 20 |
| `sheet.test.js` | blocos, `$$` multilinha, erros por linha, HTML, Markdown, relatório, escape de HTML | 14 |
| `page.test.js` | integridade de arquivos, rótulos, sandbox, CSP, créditos, exemplo embutido | 9 |

Resultado: **65 testes, 65 aprovados, 0 falhas**.

Casos notáveis: a fórmula de Bhaskara completa (`x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}`) é interpretada corretamente, com `\pm` como operador binário e a raiz contendo a expressão inteira; o escape de `<script>` no texto do usuário é coberto por teste; e o exemplo exibido na interface é convertido durante os testes, garantindo que a demonstração pública nunca quebre silenciosamente.

## 5. Acessibilidade da ferramenta

HTML semântico, `main` único, link de salto, foco visível de 3 px, rótulos explícitos, `role="status"` com `aria-live="polite"`, contraste AA em tema claro e escuro, respeito a `prefers-reduced-motion` e a `prefers-color-scheme`. A leitura de cada equação aparece em texto na própria interface, de modo que a revisão não depende do leitor de tela.

## 6. Limitações

1. **Subconjunto de LaTeX.** Ambientes matriciais, alinhamentos, macros e pacotes não são suportados; a recusa é explícita.
2. **Leitura genérica.** A fala automática é um rascunho. Notação específica (tensores, química, probabilidade condicional) exige ajuste manual.
3. **Sem validação perceptual.** Não há verificação de como o leitor de tela concreto pronuncia o MathML gerado.
4. **Sem estudo com usuários** nesta etapa.
5. **Identificadores de um caractere.** `\text{}` é necessário para nomes longos; não há heurística para palavras.

## 7. Trabalhos relacionados

Conversores LaTeX→MathML consolidados (por exemplo, MathJax e KaTeX no modo MathML) priorizam renderização visual; a descrição falada costuma ficar a cargo do autor. Editores científicos com exportação acessível existem, mas são aplicações de mesa ou serviços web com upload. O diferencial aqui não é a conversão em si, e sim o pacote: conversão + leitura em PT-BR + folha exportável + erro explícito, tudo local e sem instalação.

## 8. Conclusão

O Equação Acessível mostra que a distância entre escrever em LaTeX e publicar material STEM acessível pode ser percorrida no navegador, com regras explícitas, sem servidores e sem custo de infraestrutura. O produto não substitui a revisão do autor: entrega a estrutura correta, uma leitura plausível e um caminho de correção visível. Como continuação, prevê-se suporte a ambientes matriciais, edição do `alttext` na interface, testes com leitores de tela reais e um estudo de uso com professores de matemática e física.

## Referências

ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 15290**: Acessibilidade em comunicação na televisão. Rio de Janeiro: ABNT, 2005.

BRASIL. **Lei nº 13.146, de 6 de julho de 2015**. Institui a Lei Brasileira de Inclusão da Pessoa com Deficiência. Brasília, DF, 2015.

CARLISLE, D. **MathML3 Structure Specification**. W3C Recommendation. 2010.

FERREIRA, A. A. **Equação Acessível**: conversor local de LaTeX para MathML semântico e folhas STEM acessíveis. 2026. Software. Disponível em: <https://github.com/ArthurAlvDev/matematica-acessivel-stem>.

W3C. **Mathematical Markup Language (MathML) Version 4.0**. Working Draft. 2024.

W3C. **Web Content Accessibility Guidelines (WCAG) 2.2**. Recommendation. 2023.

---

### Nota sobre publicação

Este texto é um pré-print interno. **Não houve submissão a periódico nem depósito em repositório de dados nesta etapa.** A versão citável do software é o repositório público indicado acima, sob licença MIT.
