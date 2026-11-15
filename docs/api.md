# Contratos da API

Base: `/api`. JSON UTF-8. Erro: `{ "error": "mensagem" }`; validação pode incluir `fields` com caminho/mensagem. Códigos: 400 entrada, 401 sessão, 403 autorização/origem, 404 ausente, 409 conflito/estoque, 413 tamanho, 429 limite, 500 falha interna. Não há CORS aberto. Escritas exigem `Content-Type: application/json` e `Origin` da aplicação. Sessão segue em cookie HttpOnly.

| Método e rota                  | Acesso           | Entrada ou resposta                                                 |
| ------------------------------ | ---------------- | ------------------------------------------------------------------- |
| GET /health                    | Público          | status, database, payments                                          |
| GET /categories                | Público          | id, name                                                            |
| GET /products                  | Público          | q, category, max (centavos), available (0/1), page; até 24 produtos |
| GET /products/:id              | Público          | produto ativo ou 404                                                |
| POST /auth/register            | Público limitado | name, email, password; 201 usuário e cookie                         |
| POST /auth/login               | Público limitado | email, password; usuário e cookie                                   |
| POST /auth/logout              | Sessão opcional  | objeto vazio; revoga cookie/token                                   |
| GET /auth/me                   | Público          | usuário ou null                                                     |
| GET /account                   | Cliente          | id, name, email, role                                               |
| PATCH /account                 | Cliente          | name; retorna perfil atualizado                                     |
| GET /orders/me                 | Cliente          | até 100 pedidos próprios, recentes primeiro                         |
| POST /orders                   | Cliente          | key UUID, items, address, payment; 201 id ou 200 repetição          |
| GET /orders/:id                | Dono ou admin    | pedido, endereço, itens e histórico                                 |
| GET /admin/products            | Admin            | até 500 produtos, inclusive inativos                                |
| POST /admin/products           | Admin            | produto; 201 id                                                     |
| PATCH /admin/products/:id      | Admin            | produto completo; id                                                |
| DELETE /admin/products/:id     | Admin            | desativação lógica; id                                              |
| GET /admin/orders              | Admin            | até 100 pedidos com nome/e-mail do cliente                          |
| PATCH /admin/orders/:id/status | Admin            | status, com transição válida                                        |
| GET /admin/reports/sales       | Admin            | from/to YYYY-MM-DD; summary, top, distribution, daily               |

Produto: id, name, description, category_id, category, price_cents, stock, active (0/1), image. Escrita administrativa não inclui id/category textual; imagem deve ser caminho `/images/nome.svg`. Cadastro valida e-mail e senha entre 12 e 128 caracteres. Nome tem entre 2 e 100 caracteres. A atualização de perfil não altera e-mail ou senha.

Pedido: items contém productId e quantity inteira de 1 a 50, até 20 produtos distintos. Address contém cep, street, number, district, city, state e complement opcional. payment aceita pix_simulado ou entrega. Key é UUID exclusivo por usuário; mesmo conteúdo e chave retornam o pedido já registrado. Alterar conteúdo com a mesma chave resulta em 409. Preços e total enviados pelo cliente são ignorados.

Estados: recebido → preparacao → entrega → entregue. recebido/preparacao podem ir para cancelado. Finalizados não reabrem. Relatório exclui cancelados das somas e ranking, mas inclui todos na contagem e distribuição. Datas do filtro são dias de São Paulo (UTC-03).

Proteção de login/cadastro: até 15 solicitações por janela de 15 minutos por hash de IP, incluindo tentativas bem-sucedidas. Payload máximo de 16 KiB verificado durante leitura. Consultas SQL são parametrizadas. Endpoints desconhecidos em `/api` retornam JSON 404.
