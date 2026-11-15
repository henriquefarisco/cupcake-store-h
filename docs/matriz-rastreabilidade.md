# Matriz de rastreabilidade

Origem: PIT I, páginas 3–5. Implementação: src/client/main.tsx, src/server/index.ts e src/shared/domain.ts. Testes: tests/unit/domain.test.ts, scripts/integration.mjs e tests/e2e/store.spec.ts. Resultados finais locais: aprovados nos níveis explicitados; não equivalem a aceite humano.

| História | Jira   | Requisito           | Código e contrato                     | Evidência automatizada                                  |
| -------- | ------ | ------------------- | ------------------------------------- | ------------------------------------------------------- |
| H01      | KAN-4  | Visualizar catálogo | GET /products; Home/Catalog           | H01 catálogo seed; vitrine E2E                          |
| H02      | KAN-11 | Consultar detalhes  | GET /products/:id; Details            | H02 detalhes; vitrine E2E                               |
| H03      | KAN-12 | Buscar e filtrar    | GET /products; Catalog                | H03 filtros; vitrine E2E                                |
| H04      | KAN-13 | Criar conta         | POST /auth/register; Auth             | H04 cadastro; compra E2E                                |
| H05      | KAN-14 | Login e logout      | /auth/login, logout, me; Auth/Account | H05 login/logout/senha/sessão; compra E2E               |
| H06      | KAN-15 | Editar dados        | PATCH /account; Account               | H06 perfil persistido; compra E2E                       |
| H07      | KAN-16 | Adicionar à sacola  | Store.add; Details/Card               | cartTotal unitário; compra E2E                          |
| H08      | KAN-17 | Alterar sacola      | Cart; localStorage                    | cartTotal/vazio unitário; quantidade e persistência E2E |
| H09      | KAN-18 | Revisar pedido      | Checkout; GET /products/:id           | H09 preços servidor; revisão E2E                        |
| H10      | KAN-19 | Escolher pagamento  | Checkout; schema checkout             | PIX em integração/E2E; entrega E2E admin                |
| H11      | KAN-20 | Confirmar pedido    | POST /orders; triggers batch          | idempotência/concorrência/rollback; compra E2E          |
| H12      | KAN-21 | Receber confirmação | OrderView; GET /orders/:id            | H12 resumo; confirmação E2E                             |
| H13      | KAN-22 | Informar endereço   | schema address; Checkout; addresses   | CEP inválido e persistência; compra E2E                 |
| H14      | KAN-23 | Acompanhar status   | OrdersList/OrderView; histórico       | H14 titularidade/histórico; compra E2E                  |
| H15      | KAN-24 | Gerenciar produtos  | /admin/products; AdminPanel           | H15 criar/editar/desativar; admin E2E                   |
| H16      | KAN-25 | Gerenciar pedidos   | /admin/orders; canTransition          | H16 transições/cancelamento; admin E2E                  |
| H17      | KAN-26 | Relatório de vendas | /admin/reports/sales; AdminPanel      | H17 ranking/período/status; admin E2E                   |

Epics: KAN-5 H01–H03; KAN-6 H04–H06; KAN-7 H07–H09; KAN-8 H10–H12; KAN-9 H13–H14; KAN-10 H15–H17. Os IDs foram extraídos do documento original; o Jira não foi alterado.
