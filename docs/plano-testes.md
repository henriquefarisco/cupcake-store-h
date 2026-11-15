# Plano e resultados de testes

## Atualização 1.0.1

Após a primeira demonstração, foram acrescentados testes de regressão de preço brasileiro, filtros de data, quantidade em edição, feedback da sacola e foco no celular. A rodada local final passou com 15 unitários, 40 verificações de integração e 14 E2E. Os números abaixo de 11 unitários/oito E2E documentam a versão inicial. Ver [correções e evidências](correcoes-video-1.md).

Ambiente local: Windows, Node 24, Wrangler/workerd, D1 SQLite local, Chromium Playwright. Front-end compilado em modo produção. Os dados de teste são fictícios. O banco remoto não recebe a suíte de integração/E2E.

| Nível                      | Escopo                                                                | Resultado da rodada local final                             |
| -------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| Unitário Vitest            | moeda, total, validação, transições e derivação de senha              | 11 aprovados, zero reprovados                               |
| Integração HTTP/workerd/D1 | catálogo, auth, perfil, pedidos, estoque, segurança e administração   | 40 verificações aprovadas, zero reprovadas                  |
| E2E Chromium               | catálogo/teclado, compra/perfil, administração e recuperação de erros | oito testes aprovados em desktop/mobile, zero reprovados    |
| Auditoria npm              | árvore instalada, inclusive desenvolvimento                           | zero vulnerabilidades conhecidas após override de minimatch |
| Build/ESLint/TypeScript    | compilação e análise estática                                         | aprovados                                                   |
| Smoke produção             | site, SPA, health, catálogo e assets                                  | aprovado, somente leitura                                   |

## Reprodução

Siga manual-instalacao.md. Mantenha Wrangler em 127.0.0.1:8793 com migrations locais aplicadas. Execute `npm test`, `npm run test:integration` e `npm run test:e2e`. A integração recusa BASE_URL externa. O helper local-db utiliza explicitamente --local. A pipeline repete as verificações em Linux sobre o mesmo runtime Worker.

Os 40 checks de integração verificam inclusive preço enviado pelo cliente ignorado, idempotência com payload igual/diferente, concorrência por última unidade, rollback de lote, devolução de estoque uma vez, acesso de outro cliente negado, sessão expirada, limite de autenticação e transições proibidas. Testes de navegador incluem persistência da sacola após recarga, atualização de quantidade, cadastro/login/logout, perfil, confirmação e administração de produto/pedido/relatório.

## Evidências

- [Resultados sanitizados da integração](evidencias/integracao.json).
- [Página inicial desktop](evidencias/inicio-desktop.png) e [mobile](evidencias/inicio-mobile.png).
- [Confirmação desktop](evidencias/pedido-desktop.png) e [mobile](evidencias/pedido-mobile.png).
- HTML Playwright e JUnit em playwright-report/ e test-results/ locais e artefatos de Actions, excluídos do código público para evitar traces com cookies.

## Defeitos e retestes

Uma primeira rodada de integração encontrou aridade incorreta no INSERT de endereço; foi corrigida e os 40 checks passaram. E2E inicial encontrou seletores de testes ambíguos por texto de opções e nomes reutilizados; adicionaram-se rótulos explícitos aos filtros e identificadores únicos aos produtos de teste. O valor BRL foi verificado por texto de valor no registro apropriado, evitando diferença de espaço não separável. A rodada final passou nos oito testes. Não se registraram esses ajustes como feedback de colegas.

## Limites

Não há teste de carga, cobertura percentual medida, auditoria de acessibilidade completa ou teste físico iOS/Safari. Emulação mobile é Chromium com dimensões/toque de iPhone. O laudo não atesta ausência absoluta de defeitos. Cinco avaliações humanas estão preparadas na entrega local, porém pendentes de execução real.
