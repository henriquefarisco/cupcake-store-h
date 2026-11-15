# Análise dos documentos de referência

Os três originais foram extraídos integralmente para análise local. Os dados de identificação e os documentos originais permanecem fora do repositório público. As imagens do mapa de afinidade e das evidências do Jira da PIT I também foram inspecionadas.

## PIT I

Documento de nove páginas. Páginas 1–2: situação-problema 1, planejamento ágil, escopo de loja de cupcakes e estimativa histórica de 18 horas, que não representa tempo de implementação desta versão. Páginas 3–4: seis Epics KAN-5 a KAN-10, 17 histórias, critérios e backlog. Página 5: mapa de afinidade. Páginas 6–9: evidências do Jira e resultado consolidado.

A tabela da página 4 fornece o mapeamento H01/KAN-4 e H02–H17/KAN-11–KAN-26, preservado em [rastreabilidade](matriz-rastreabilidade.md). Os status históricos do quadro indicavam elaboração/validação dos artefatos; não provavam existência de código. A raiz inicialmente continha somente os documentos. Não foi necessário reativar o Jira, pois o documento registra o backlog necessário.

## PIT II

Material com 41 páginas. Páginas 4–8: modelagem conceitual, lógica e física, integridade e comparação DER/classes. Páginas 10–14: clareza, consistência, recuperação de erros e feedback na IHC. Páginas 15–19: desenvolvimento tradicional, low-code e no-code. Páginas 20–26: qualidade, verificação, validação e separação MVC. Páginas 27–29: materiais complementares. Páginas 30–31: revisão do escopo, UML, interface, banco físico e dicionário. Páginas 32–34: código front-end/back-end funcional e testado, repositório Git e linguagens sugeridas. Páginas 35–36 e 38–39: testes de cinco colegas/profissionais, evidências, melhorias, documentação e vídeo atualizado de até cinco minutos. Página 38: vídeo inicial narrado de pelo menos cinco minutos. Páginas 40–41: entrega e referências.

A página 34 usa a expressão “linguagens sugeridas” ao listar Java, PHP, C#, .NET e Python. TypeScript não aparece nessa lista. A escolha de TypeScript foi solicitada para uma arquitetura Workers/D1 gratuita e mantém tipagem compartilhada entre cliente e servidor. Trata-se de uma adaptação técnica explicitada, sem afirmar aprovação prévia do tutor. A separação de apresentação, controladores HTTP, validação/domínio e persistência conserva a finalidade didática do MVC; o projeto não utiliza ORM nem classes de entidade artificiais.

## Modelo Word

Contém identificação, documentação, tabela de oito campos de codificação, cinco tabelas de avaliação, laudo de qualidade e tabela do segundo vídeo. A cópia preenchida deve preservar a estrutura acadêmica, com dados reais do responsável somente na entrega local. Os cinco formulários permanecem pendentes até avaliações reais. Os dois vídeos não serão gerados nem terão URLs fictícias.

## Correspondência com os artefatos

| Exigência                       | Artefato                                                 |
| ------------------------------- | -------------------------------------------------------- |
| Revisão de escopo e backlog     | requisitos.md, matriz-rastreabilidade.md                 |
| UML e modelagem                 | diagramas/, modelagem-banco.md, dicionario-dados.md      |
| Interface e processamento       | src/client/, src/server/, src/shared/                    |
| Persistência real               | migrations/0001_schema.sql e 0002_seed.sql               |
| Testes e defeitos               | tests/, plano-testes.md, laudo-qualidade.md, evidencias/ |
| Código público e implantação    | README.md, .github/workflows/, implantacao.md            |
| Atividade identificada e vídeos | entrega/ local, excluída do Git                          |

## Decisões e limites

React/Vite atende navegação e formulários; Hono concentra controladores HTTP; Zod valida o contrato; D1 mantém integridade e índices. Um Worker serve API e assets na mesma origem para simplificar sessão e CSRF. Dinheiro é inteiro em centavos. Ilustrações e logo SVG são próprios. PIX e entrega são demonstrativos. Não há e-mail transacional, cartão ou frete comercial. A autenticação usa cookie opaco, hash da sessão e PBKDF2 compatível com Web Crypto; as limitações estão em riscos-limitacoes.md.

Avaliações humanas, vídeos e eventual decisão acadêmica do tutor não podem ser substituídos por automação. Nenhum nome de avaliador ou feedback foi inventado.
