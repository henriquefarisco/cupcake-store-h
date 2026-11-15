# Arquitetura

O navegador executa React com React Router e TypeScript, compilado pelo Vite. Assets estáticos e API compartilham um Cloudflare Worker. Hono recebe as rotas em `/api`; Zod valida entradas; Web Crypto realiza derivação de senhas e hash de tokens. O binding `DB` oferece acesso parametrizado ao D1. Nenhum segredo integra o bundle React.

## Responsabilidades

| Camada                       | Código                         | Responsabilidade                                   |
| ---------------------------- | ------------------------------ | -------------------------------------------------- |
| Apresentação                 | src/client/main.tsx, style.css | páginas, navegação, sacola e feedback              |
| Transporte cliente           | src/client/api.ts              | JSON, cookies e mensagens de erro                  |
| Domínio e contrato           | src/shared/domain.ts           | schemas, estados, moeda e totais                   |
| Controladores e persistência | src/server/index.ts            | middleware, autorização, rotas e SQL parametrizado |
| Criptografia                 | src/server/security.ts         | senha PBKDF2 e hash SHA-256                        |
| Modelo físico                | migrations/                    | tabelas, índices, triggers e seed                  |

Em uma aplicação pequena, controladores e consultas estão em um único módulo de servidor; não se adicionaram camadas vazias. A separação React/HTTP/domínio/SQL adapta os objetivos do MVC ao cliente SPA e ao Worker. Os modelos persistentes são registros relacionais; o diagrama de classes descreve tipos e serviços, sem alegar entidades ORM inexistentes.

## Consistência

O servidor ignora preços e total do navegador. O lote `DB.batch` inclui endereço, pedido, itens e histórico. Cada item usa nome/preço atuais por subconsulta. Triggers verificam produto ativo e saldo, reservam estoque e incrementam total. Uma falha aborta o lote inteiro. A restrição única de usuário/chave impede duplicatas; hash do pedido detecta reutilização da chave com conteúdo diferente. Atualizações de status usam comparação do estado anterior. Cancelamento devolve estoque uma única vez por transição.

## Segurança e implantação

Tokens aleatórios de sessão são armazenados apenas como SHA-256 e expiram em sete dias. Cookies têm HttpOnly, SameSite=Lax e Secure em HTTPS. Escritas exigem Origin da aplicação e JSON, limitado a 16 KiB. Administração exige papel no servidor. Auth tem limite persistido por hash do IP. Consultas têm limites, o catálogo possui paginação e filtros. Cabeçalhos de assets estão em public/_headers.

TypeScript foi escolhido pela integração com Workers, tipagem compartilhada e ausência de servidor pago. D1/SQLite evita infraestrutura de banco separada. Workers Free possui limites de CPU e requisições; não se habilita upgrade automático. Ver [riscos](riscos-limitacoes.md) e [fontes oficiais](configuracao-github-cloudflare.md).
