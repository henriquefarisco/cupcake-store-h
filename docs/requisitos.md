# Requisitos

O escopo preserva os seis Epics da PIT I: catálogo (H01–H03), cadastro/acesso (H04–H06), carrinho/pedido (H07–H09), pagamentos (H10–H12), entrega/acompanhamento (H13–H14) e administração (H15–H17).

| História | Critério verificável                                               |
| -------- | ------------------------------------------------------------------ |
| H01      | catálogo com ilustração, nome, descrição, preço, estoque e ações   |
| H02      | detalhe individual com quantidade e preço                          |
| H03      | busca e filtros combináveis por categoria, preço e disponibilidade |
| H04      | cadastro validado com senha derivada e e-mail único                |
| H05      | login, cookie seguro, expiração e logout                           |
| H06      | consulta e edição do próprio nome                                  |
| H07      | adicionar produto e quantidade à sacola persistente                |
| H08      | alterar quantidade/remover e recalcular                            |
| H09      | revisão de itens e preços atualizados antes de confirmar           |
| H10      | PIX simulado ou pagamento na entrega simulado                      |
| H11      | pedido atômico no banco com reserva de estoque e idempotência      |
| H12      | confirmação na aplicação com identificador e resumo                |
| H13      | endereço brasileiro validado sem depender de consulta externa      |
| H14      | listar pedidos próprios e histórico atualizado                     |
| H15      | administração de produtos protegida no servidor                    |
| H16      | administração de pedidos com estados válidos e cancelamento        |
| H17      | totais, ranking, datas e distribuição por status                   |

Requisitos não funcionais: layout responsivo, rótulos e foco visível, erros recuperáveis, moeda BRL em centavos, datas em UTC/apresentação São Paulo, integridade relacional, consultas parametrizadas, autorização no servidor, proteção de sessão/CSRF, limites de entrada/autenticação, documentação e testes reproduzíveis. Publicação deve permanecer em infraestrutura gratuita sem cartão ou assinatura nova.

Requisitos acadêmicos: banco físico e dicionário, UML renderizada, código público, testes com evidências, laudo e modelo Word preenchido. Cinco avaliações humanas e dois vídeos são etapas distintas da automação; seus campos ficam pendentes até existirem resultados autênticos.
