PRAGMA foreign_keys = ON;
CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','admin')), created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, category_id INTEGER NOT NULL REFERENCES categories(id), price_cents INTEGER NOT NULL CHECK(price_cents>=100), stock INTEGER NOT NULL CHECK(stock>=0), active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)), image TEXT NOT NULL);
CREATE INDEX products_category ON products(category_id,active);
CREATE TABLE addresses (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), cep TEXT NOT NULL, street TEXT NOT NULL, number TEXT NOT NULL, district TEXT NOT NULL, city TEXT NOT NULL, state TEXT NOT NULL, complement TEXT NOT NULL DEFAULT '');
CREATE TABLE orders (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), address_id TEXT NOT NULL REFERENCES addresses(id), payment TEXT NOT NULL CHECK(payment IN ('pix_simulado','entrega')), status TEXT NOT NULL DEFAULT 'recebido' CHECK(status IN ('recebido','preparacao','entrega','entregue','cancelado')), total_cents INTEGER NOT NULL DEFAULT 0 CHECK(total_cents>=0), idempotency_key TEXT NOT NULL, request_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), UNIQUE(user_id,idempotency_key));
CREATE INDEX orders_user_date ON orders(user_id,created_at);
CREATE INDEX orders_date_status ON orders(created_at,status);
CREATE TABLE order_items (order_id TEXT NOT NULL REFERENCES orders(id), product_id INTEGER NOT NULL REFERENCES products(id), name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 50), unit_price_cents INTEGER NOT NULL CHECK(unit_price_cents>=100), PRIMARY KEY(order_id,product_id));
CREATE TABLE order_status_history (id INTEGER PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), status TEXT NOT NULL, changed_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE auth_limits (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX auth_limits_expiry ON auth_limits(expires_at);
CREATE TRIGGER item_stock BEFORE INSERT ON order_items BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM products WHERE id=NEW.product_id AND active=1 AND stock>=NEW.quantity AND price_cents=NEW.unit_price_cents) THEN RAISE(ABORT,'STOCK_UNAVAILABLE') END;
END;
CREATE TRIGGER item_reserve AFTER INSERT ON order_items BEGIN
 UPDATE products SET stock=stock-NEW.quantity WHERE id=NEW.product_id;
 UPDATE orders SET total_cents=total_cents+NEW.quantity*NEW.unit_price_cents WHERE id=NEW.order_id;
END;
CREATE TRIGGER order_restore AFTER UPDATE OF status ON orders WHEN NEW.status='cancelado' AND OLD.status!='cancelado' BEGIN
 UPDATE products SET stock=stock+(SELECT quantity FROM order_items WHERE order_id=NEW.id AND product_id=products.id) WHERE id IN (SELECT product_id FROM order_items WHERE order_id=NEW.id);
END;
