# Dicionário de dados

Gerado a partir da migration 0001 por introspecção SQLite. O SQL versionado é a definição normativa. Valores monetários são centavos; datas de negócio são ISO 8601 UTC; expirações técnicas são milissegundos Unix.

## users

Contas, credenciais derivadas e papel de acesso.

| Campo      | Tipo | Obrigatório | Chave primária | Padrão                               |
| ---------- | ---- | ----------- | -------------- | ------------------------------------ |
| id         | TEXT | Sim         | 1              | —                                    |
| name       | TEXT | Sim         | —              | —                                    |
| email      | TEXT | Sim         | —              | —                                    |
| password   | TEXT | Sim         | —              | —                                    |
| role       | TEXT | Sim         | —              | 'customer'                           |
| created_at | TEXT | Sim         | —              | strftime('%Y-%m-%dT%H:%M:%fZ','now') |

Restrições e índices:

```sql
CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','admin')), created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
```

- Índice `sqlite_autoindex_users_2` (email); único: sim.
- Índice `sqlite_autoindex_users_1` (id); único: sim.

## sessions

Sessões opacas armazenadas por hash, com expiração.

| Campo      | Tipo    | Obrigatório | Chave primária | Padrão |
| ---------- | ------- | ----------- | -------------- | ------ |
| token_hash | TEXT    | Sim         | 1              | —      |
| user_id    | TEXT    | Sim         | —              | —      |
| expires_at | INTEGER | Sim         | —              | —      |

Restrições e índices:

```sql
CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
```

- FK `user_id` → `users.id`; ON DELETE CASCADE.
- Índice `sessions_expiry` (expires_at); único: não.
- Índice `sqlite_autoindex_sessions_1` (token_hash); único: sim.

## categories

Grupos do catálogo.

| Campo | Tipo    | Obrigatório | Chave primária | Padrão |
| ----- | ------- | ----------- | -------------- | ------ |
| id    | INTEGER | Sim         | 1              | —      |
| name  | TEXT    | Sim         | —              | —      |

Restrições e índices:

```sql
CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
```

- Índice `sqlite_autoindex_categories_1` (name); único: sim.

## products

Produtos, preço atual, estoque e visibilidade lógica.

| Campo       | Tipo    | Obrigatório | Chave primária | Padrão |
| ----------- | ------- | ----------- | -------------- | ------ |
| id          | INTEGER | Sim         | 1              | —      |
| name        | TEXT    | Sim         | —              | —      |
| description | TEXT    | Sim         | —              | —      |
| category_id | INTEGER | Sim         | —              | —      |
| price_cents | INTEGER | Sim         | —              | —      |
| stock       | INTEGER | Sim         | —              | —      |
| active      | INTEGER | Sim         | —              | 1      |
| image       | TEXT    | Sim         | —              | —      |

Restrições e índices:

```sql
CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, category_id INTEGER NOT NULL REFERENCES categories(id), price_cents INTEGER NOT NULL CHECK(price_cents>=100), stock INTEGER NOT NULL CHECK(stock>=0), active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)), image TEXT NOT NULL);
```

- FK `category_id` → `categories.id`; ON DELETE NO ACTION.
- Índice `products_category` (category_id, active); único: não.

## addresses

Snapshot de endereço do pedido.

| Campo      | Tipo | Obrigatório | Chave primária | Padrão |
| ---------- | ---- | ----------- | -------------- | ------ |
| id         | TEXT | Sim         | 1              | —      |
| user_id    | TEXT | Sim         | —              | —      |
| cep        | TEXT | Sim         | —              | —      |
| street     | TEXT | Sim         | —              | —      |
| number     | TEXT | Sim         | —              | —      |
| district   | TEXT | Sim         | —              | —      |
| city       | TEXT | Sim         | —              | —      |
| state      | TEXT | Sim         | —              | —      |
| complement | TEXT | Sim         | —              | ''     |

Restrições e índices:

```sql
CREATE TABLE addresses (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), cep TEXT NOT NULL, street TEXT NOT NULL, number TEXT NOT NULL, district TEXT NOT NULL, city TEXT NOT NULL, state TEXT NOT NULL, complement TEXT NOT NULL DEFAULT '');
```

- FK `user_id` → `users.id`; ON DELETE NO ACTION.
- Índice `sqlite_autoindex_addresses_1` (id); único: sim.

## orders

Cabeçalho do pedido, pagamento demonstrativo, total e idempotência.

| Campo           | Tipo    | Obrigatório | Chave primária | Padrão                               |
| --------------- | ------- | ----------- | -------------- | ------------------------------------ |
| id              | TEXT    | Sim         | 1              | —                                    |
| user_id         | TEXT    | Sim         | —              | —                                    |
| address_id      | TEXT    | Sim         | —              | —                                    |
| payment         | TEXT    | Sim         | —              | —                                    |
| status          | TEXT    | Sim         | —              | 'recebido'                           |
| total_cents     | INTEGER | Sim         | —              | 0                                    |
| idempotency_key | TEXT    | Sim         | —              | —                                    |
| request_hash    | TEXT    | Sim         | —              | —                                    |
| created_at      | TEXT    | Sim         | —              | strftime('%Y-%m-%dT%H:%M:%fZ','now') |

Restrições e índices:

```sql
CREATE TABLE orders (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), address_id TEXT NOT NULL REFERENCES addresses(id), payment TEXT NOT NULL CHECK(payment IN ('pix_simulado','entrega')), status TEXT NOT NULL DEFAULT 'recebido' CHECK(status IN ('recebido','preparacao','entrega','entregue','cancelado')), total_cents INTEGER NOT NULL DEFAULT 0 CHECK(total_cents>=0), idempotency_key TEXT NOT NULL, request_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), UNIQUE(user_id,idempotency_key));
```

- FK `address_id` → `addresses.id`; ON DELETE NO ACTION.
- FK `user_id` → `users.id`; ON DELETE NO ACTION.
- Índice `orders_date_status` (created_at, status); único: não.
- Índice `orders_user_date` (user_id, created_at); único: não.
- Índice `sqlite_autoindex_orders_2` (user_id, idempotency_key); único: sim.
- Índice `sqlite_autoindex_orders_1` (id); único: sim.

## order_items

Itens com quantidade, nome e preço histórico.

| Campo            | Tipo    | Obrigatório | Chave primária | Padrão |
| ---------------- | ------- | ----------- | -------------- | ------ |
| order_id         | TEXT    | Sim         | 1              | —      |
| product_id       | INTEGER | Sim         | 2              | —      |
| name             | TEXT    | Sim         | —              | —      |
| quantity         | INTEGER | Sim         | —              | —      |
| unit_price_cents | INTEGER | Sim         | —              | —      |

Restrições e índices:

```sql
CREATE TABLE order_items (order_id TEXT NOT NULL REFERENCES orders(id), product_id INTEGER NOT NULL REFERENCES products(id), name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 50), unit_price_cents INTEGER NOT NULL CHECK(unit_price_cents>=100), PRIMARY KEY(order_id,product_id));
```

- FK `product_id` → `products.id`; ON DELETE NO ACTION.
- FK `order_id` → `orders.id`; ON DELETE NO ACTION.
- Índice `sqlite_autoindex_order_items_1` (order_id, product_id); único: sim.

## order_status_history

Auditoria de transições do pedido.

| Campo      | Tipo    | Obrigatório | Chave primária | Padrão                               |
| ---------- | ------- | ----------- | -------------- | ------------------------------------ |
| id         | INTEGER | Sim         | 1              | —                                    |
| order_id   | TEXT    | Sim         | —              | —                                    |
| status     | TEXT    | Sim         | —              | —                                    |
| changed_by | TEXT    | Sim         | —              | —                                    |
| created_at | TEXT    | Sim         | —              | strftime('%Y-%m-%dT%H:%M:%fZ','now') |

Restrições e índices:

```sql
CREATE TABLE order_status_history (id INTEGER PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), status TEXT NOT NULL, changed_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
```

- FK `changed_by` → `users.id`; ON DELETE NO ACTION.
- FK `order_id` → `orders.id`; ON DELETE NO ACTION.

## auth_limits

Contador técnico de autenticação por hash de IP.

| Campo      | Tipo    | Obrigatório | Chave primária | Padrão |
| ---------- | ------- | ----------- | -------------- | ------ |
| key        | TEXT    | Sim         | 1              | —      |
| attempts   | INTEGER | Sim         | —              | —      |
| expires_at | INTEGER | Sim         | —              | —      |

Restrições e índices:

```sql
CREATE TABLE auth_limits (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL);
```

- Índice `auth_limits_expiry` (expires_at); único: não.
- Índice `sqlite_autoindex_auth_limits_1` (key); único: sim.

## Regras entre tabelas

A aplicação exige produto ativo e saldo suficiente. O trigger item_stock valida antes da inserção; item_reserve reserva saldo e acumula o total. order_restore devolve itens ao cancelar. Todos participam do lote transacional. A chave (user_id,idempotency_key) é única. A ordem válida dos estados é validada pelo domínio e pelo controlador com atualização condicional; o CHECK do banco limita os valores possíveis. Validações textuais e de CEP/UF são feitas por Zod.
