import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { api } from "./api";
import { addToCart, parsePrice, type CartItem } from "./cart";
import { QuantityInput } from "./QuantityInput";
import {
  money,
  cartTotal,
  statusLabels,
  canTransition,
  type Product,
  type User,
  type Status,
} from "../shared/domain";
import "./style.css";
const Store = createContext<{
  user: User | null;
  refresh: () => Promise<void>;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  add: (p: Product, q?: number) => void;
  notice: (s: string) => void;
}>(null!);
const useStore = () => useContext(Store);
function App() {
  const [user, setUser] = useState<User | null>(null),
    [cart, setCart] = useState<CartItem[]>(() => {
      try {
        const saved = JSON.parse(localStorage.getItem("cupcake-cart") || "[]");
        return Array.isArray(saved)
          ? saved
              .filter(
                (i) =>
                  Number.isInteger(i.id) &&
                  Number.isInteger(i.quantity) &&
                  i.quantity > 0 &&
                  i.quantity <= 50 &&
                  Number.isInteger(i.price_cents),
              )
              .slice(0, 20)
          : [];
      } catch {
        return [];
      }
    }),
    [message, setMessage] = useState("");
  const refresh = async () => setUser(await api<User | null>("/auth/me"));
  const cartRef = useRef(cart);
  useEffect(() => {
    refresh().catch(() => {});
  }, []);
  useEffect(() => {
    cartRef.current = cart;
    localStorage.setItem("cupcake-cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [message]);
  function add(p: Product, q = 1) {
    const result = addToCart(cartRef.current, p, q);
    cartRef.current = result.items;
    setCart(result.items);
    setMessage(result.message);
  }
  return (
    <Store.Provider
      value={{ user, refresh, cart, setCart, add, notice: setMessage }}
    >
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <div className="announcement">
        Feitos de carinho. Compartilhados com amor.{" "}
        <span>Loja demonstrativa • pagamentos simulados</span>
      </div>
      <header>
        <Link className="brand" to="/">
          <img src="/favicon.svg" alt="" />
          Cupcake <i>Store H</i>
        </Link>
        <nav aria-label="Menu principal">
          <NavLink to="/">A loja</NavLink>
          <NavLink to="/catalogo">Cupcakes</NavLink>
          <NavLink to="/pedidos">Meus pedidos</NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin">Administração</NavLink>
          )}
        </nav>
        <div className="header-actions">
          <Link
            to={user ? "/conta" : "/entrar"}
            aria-label={user ? "Minha conta" : "Entrar"}
            className="account-link"
          >
            ♡ <span>{user ? user.name.split(" ")[0] : "Entrar"}</span>
          </Link>
          <Link className="bag" to="/carrinho">
            Sacola <b>{cart.reduce((n, i) => n + i.quantity, 0)}</b>
          </Link>
        </div>
      </header>
      {message && (
        <div className="toast" role="status">
          ✓ {message}
        </div>
      )}
      <main id="conteudo">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/produto/:id" element={<Details />} />
          <Route path="/entrar" element={<Auth />} />
          <Route path="/cadastro" element={<Auth register />} />
          <Route path="/conta" element={<Account />} />
          <Route path="/carrinho" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedidos" element={<Orders />} />
          <Route path="/pedidos/:id" element={<OrderDetails />} />
          <Route path="/admin" element={<Admin />} />
          <Route
            path="*"
            element={
              <Empty
                title="Esta página saiu do forno errado."
                text="Volte à loja para encontrar seus favoritos."
              />
            }
          />
        </Routes>
      </main>
      <footer>
        <div>
          <Link className="brand" to="/">
            Cupcake <i>Store H</i>
          </Link>
          <p>Pequenos doces. Grandes momentos.</p>
        </div>
        <p>
          Projeto acadêmico • Sem cobranças reais.
          <br />
          Produtos ilustrativos. Consulte os ingredientes no catálogo.
        </p>
        <Link to="/catalogo">Escolha seu próximo momento doce ↗</Link>
      </footer>
    </Store.Provider>
  );
}
function ErrorText({ error }: { error: string }) {
  return error ? (
    <p className="error" role="alert">
      {error}
    </p>
  ) : null;
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <section className="empty">
      <span className="eyebrow">CUPCAKE STORE H</span>
      <h1>{title}</h1>
      <p>{text}</p>
      <Link className="button" to="/catalogo">
        Explorar cupcakes ↗
      </Link>
    </section>
  );
}
function useLoad<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    setError("");
    setData(null);
    if (path === null) return;
    api<T>(path)
      .then((v) => {
        if (live) setData(v);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [path, version]);
  return { data, error, reload: () => setVersion((v) => v + 1) };
}
function Loading({ error, reload }: { error: string; reload: () => void }) {
  return error ? (
    <div className="empty">
      <ErrorText error={error} />
      <button onClick={reload}>Tentar novamente</button>
    </div>
  ) : (
    <p className="loading" role="status">
      Preparando um momento doce…
    </p>
  );
}
function Home() {
  const { data, error, reload } = useLoad<Product[]>("/products");
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="small-star">✦</span> CONFEITARIA FEITA DE AFETO
          </span>
          <h1>
            A vida merece
            <br />
            um lado mais <em>doce.</em>
          </h1>
          <p>
            Massa fofinha, cobertura generosa e aquele carinho que transforma
            qualquer pausa em um bom momento.
          </p>
          <Link className="button" to="/catalogo">
            Encontre seu favorito <span>↗</span>
          </Link>
          <div className="hero-note">
            <span>♡</span> Pequenos detalhes, grandes sorrisos.
          </div>
        </div>
        <div className="hero-art">
          <div className="art-orbit" />
          <span className="art-caption">
            um carinho
            <br />
            <i>em forma de cupcake</i>
          </span>
          <img
            className="hero-cupcake"
            src="/images/morango.svg"
            alt="Ilustração de cupcake de morango com cobertura rosada"
          />
          <div className="round-stamp">
            FEITO COM
            <br />
            <strong>♡</strong>
            <br />
            CARINHO
          </div>
          <span className="spark one">✧</span>
          <span className="spark two">✦</span>
          <span className="art-label">
            MORANGO DO JARDIM <span>o seu novo favorito</span>
          </span>
        </div>
      </section>
      <div className="values">
        <span>✦ Receita de felicidade</span>
        <span>♡ Carinho em cada detalhe</span>
        <span>✦ Sabores para compartilhar</span>
      </div>
      <section className="collection">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ESCOLHA O SEU MOMENTO</span>
            <h2>
              Uma coleção de <em>delícias.</em>
            </h2>
          </div>
          <Link to="/catalogo">Ver todos os cupcakes ↗</Link>
        </div>
        {data ? (
          <div className="product-grid">
            {data.slice(0, 4).map((p) => (
              <Card p={p} key={p.id} />
            ))}
          </div>
        ) : (
          <Loading error={error} reload={reload} />
        )}
      </section>
      <section className="story">
        <span className="eyebrow">MAIS QUE UM DOCINHO</span>
        <h2>
          Para celebrar o extraordinário.
          <br />E adoçar o <em>dia a dia.</em>
        </h2>
        <p>
          Do primeiro ao último pedacinho, uma experiência pensada para ser
          compartilhada. Escolha seus sabores e monte sua caixinha de
          felicidade.
        </p>
        <Link to="/catalogo" className="text-link">
          Vamos escolher juntos? ↗
        </Link>
      </section>
    </>
  );
}
function Card({ p }: { p: Product }) {
  const { add } = useStore();
  return (
    <article className="product-card">
      <Link
        to={"/produto/" + p.id}
        className={"product-picture tone-" + p.category_id}
      >
        <span className="product-tag">{p.category}</span>
        <img src={p.image} alt={"Cupcake " + p.name} loading="lazy" />
      </Link>
      <div className="product-info">
        <span className="eyebrow">
          {p.stock > 0
            ? "UM PEDACINHO DE FELICIDADE"
            : "TEMPORARIAMENTE ESGOTADO"}
        </span>
        <Link to={"/produto/" + p.id}>
          <h3>{p.name}</h3>
        </Link>
        <p>{p.description.split(". ")[0]}.</p>
        <div className="product-bottom">
          <strong>{money(p.price_cents)}</strong>
          <button
            aria-label={"Adicionar " + p.name}
            disabled={!p.stock}
            onClick={() => add(p)}
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}
function Catalog() {
  const [q, setQ] = useState(""),
    [category, setCategory] = useState("0"),
    [max, setMax] = useState("100000"),
    [available, setAvailable] = useState(false),
    [page, setPage] = useState(1);
  const path =
    "/products?" +
    new URLSearchParams({
      q,
      category,
      max,
      available: available ? "1" : "0",
      page: String(page),
    });
  const { data, error, reload } = useLoad<Product[]>(path);
  return (
    <section className="page">
      <div className="page-heading">
        <span className="eyebrow">NOSSA VITRINE</span>
        <h1>
          Encontre seu <em>favorito.</em>
        </h1>
        <p>Um sabor para cada vontade. Um carinho em cada escolha.</p>
      </div>
      <form className="filters" onSubmit={(e) => e.preventDefault()}>
        <label>
          Buscar cupcake
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Qual sabor combina com hoje?"
          />
        </label>
        <label>
          Categoria
          <select
            aria-label="Categoria"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="0">Todos os sabores</option>
            <option value="1">Clássicos</option>
            <option value="2">Frutados</option>
            <option value="3">Especiais</option>
          </select>
        </label>
        <label>
          Preço máximo
          <select
            aria-label="Preço máximo"
            value={max}
            onChange={(e) => {
              setMax(e.target.value);
              setPage(1);
            }}
          >
            <option value="100000">Sem limite</option>
            <option value="1300">Até R$ 13</option>
            <option value="1500">Até R$ 15</option>
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
          />{" "}
          Em estoque
        </label>
      </form>
      {data ? (
        <>
          {data.length ? (
            <div className="product-grid">
              {data.map((p) => (
                <Card p={p} key={p.id} />
              ))}
            </div>
          ) : (
            <p className="empty">
              Nenhum cupcake encontrado. Experimente outro filtro.
            </p>
          )}
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage((v) => v - 1)}>
              Anterior
            </button>
            <span>Página {page}</span>
            <button
              disabled={data.length < 24}
              onClick={() => setPage((v) => v + 1)}
            >
              Próxima
            </button>
          </div>
        </>
      ) : (
        <Loading error={error} reload={reload} />
      )}
    </section>
  );
}
function Details() {
  const { id } = useParams();
  const { data: p, error, reload } = useLoad<Product>("/products/" + id);
  const [quantity, setQuantity] = useState(1);
  const [quantityValid, setQuantityValid] = useState(true);
  const { add } = useStore();
  return p ? (
    <section className="page detail">
      <div className={"detail-picture tone-" + p.category_id}>
        <img src={p.image} alt={p.name} />
      </div>
      <div>
        <Link className="eyebrow" to="/catalogo">
          ← VOLTAR AO CATÁLOGO
        </Link>
        <h1>{p.name}</h1>
        <p>{p.description}</p>
        <p className="price">{money(p.price_cents)}</p>
        <p>
          {p.stock > 0
            ? p.stock + " unidades disponíveis"
            : "Esgotado por enquanto."}
        </p>
        <QuantityInput
          value={quantity}
          max={Math.min(50, p.stock)}
          onChange={setQuantity}
          onValidityChange={setQuantityValid}
        />
        <button
          className="button"
          disabled={
            !p.stock ||
            !quantityValid ||
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > Math.min(50, p.stock)
          }
          onClick={() => add(p, quantity)}
        >
          Adicionar à sacola • {money(p.price_cents * quantity)}
        </button>
        <p className="muted">
          Pedido e pagamento demonstrativos, sem cobrança real.
        </p>
      </div>
    </section>
  ) : (
    <Loading error={error} reload={reload} />
  );
}
function Input({
  name,
  label,
  type = "text",
  required = true,
  defaultValue,
  minLength,
  pattern,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  minLength?: number;
  pattern?: string;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        minLength={minLength}
        pattern={pattern}
        autoComplete={
          name === "password"
            ? "current-password"
            : name === "name"
              ? "name"
              : name === "email"
                ? "email"
                : undefined
        }
      />
    </label>
  );
}
function Auth({ register = false }: { register?: boolean }) {
  const { refresh } = useStore(),
    navigate = useNavigate();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api(
        "/auth/" + (register ? "register" : "login"),
        "POST",
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      await refresh();
      navigate("/conta");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="form-page">
      <span className="eyebrow">SEU CANTINHO DOCE</span>
      <h1>{register ? "Vamos nos conhecer?" : "Que bom ter você aqui."}</h1>
      <p>
        {register
          ? "Crie sua conta para acompanhar os seus pedidos."
          : "Entre para continuar seu próximo momento doce."}
      </p>
      <form onSubmit={submit}>
        {register && <Input name="name" label="Seu nome" minLength={2} />}
        <Input name="email" label="E-mail" type="email" />
        <Input
          name="password"
          label="Senha (mínimo de 12 caracteres)"
          type="password"
          minLength={12}
        />
        <ErrorText error={error} />
        <button className="button" disabled={busy}>
          {busy
            ? "Aguarde…"
            : register
              ? "Criar conta"
              : "Entrar na minha conta"}
        </button>
      </form>
      <p>
        {register ? "Já tem conta?" : "Primeira vez por aqui?"}{" "}
        <Link to={register ? "/entrar" : "/cadastro"}>
          {register ? "Entrar" : "Criar uma conta"}
        </Link>
      </p>
      <p className="muted">
        Use dados de teste. Esta é uma demonstração acadêmica.
      </p>
    </section>
  );
}
function Gate({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const { user } = useStore();
  if (!user)
    return (
      <section className="empty">
        <h1>Seu próximo momento começa aqui.</h1>
        <p>Entre na sua conta para acessar esta página.</p>
        <Link className="button" to="/entrar">
          Entrar
        </Link>
      </section>
    );
  if (admin && user.role !== "admin")
    return (
      <Empty
        title="Área da administração"
        text="Sua conta não tem acesso a este painel."
      />
    );
  return children;
}
function Account() {
  const { user, refresh, notice } = useStore();
  const [error, setError] = useState("");
  return (
    <Gate>
      <section className="form-page">
        <span className="eyebrow">MINHA CONTA</span>
        <h1>Olá, {user?.name.split(" ")[0]}.</h1>
        <p>{user?.email}</p>
        <form
          key={user?.id}
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api(
                "/account",
                "PATCH",
                Object.fromEntries(new FormData(e.currentTarget)),
              );
              await refresh();
              notice("Seus dados foram atualizados.");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <Input
            name="name"
            label="Seu nome"
            defaultValue={user?.name}
            minLength={2}
          />
          <ErrorText error={error} />
          <button className="button">Salvar dados</button>
        </form>
        <div className="inline-actions">
          <Link to="/pedidos">Meus pedidos ↗</Link>
          <button
            onClick={async () => {
              try {
                await api("/auth/logout", "POST", {});
                await refresh();
                notice("Você saiu da sua conta.");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Sair da conta
          </button>
        </div>
      </section>
    </Gate>
  );
}
function Cart() {
  const { cart, setCart } = useStore();
  if (!cart.length)
    return (
      <Empty
        title="Sua sacola espera por um carinho."
        text="Explore os sabores e escolha os seus favoritos."
      />
    );
  return (
    <section className="page cart-page">
      <span className="eyebrow">SUA SELEÇÃO</span>
      <h1>
        Uma sacola de <em>felicidade.</em>
      </h1>
      <div className="cart-layout">
        <div>
          {cart.map((i) => (
            <article className="cart-row" key={i.id}>
              <img src={i.image} alt={i.name} />
              <div>
                <Link to={"/produto/" + i.id}>
                  <h3>{i.name}</h3>
                </Link>
                <p>{money(i.price_cents)} por unidade</p>
                <button
                  className="plain"
                  onClick={() => setCart((v) => v.filter((x) => x.id !== i.id))}
                >
                  Remover
                </button>
              </div>
              <QuantityInput
                value={i.quantity}
                max={Math.min(50, i.stock)}
                label={"Quantidade de " + i.name}
                onChange={(quantity) =>
                  setCart((items) =>
                    items.map((item) =>
                      item.id === i.id ? { ...item, quantity } : item,
                    ),
                  )
                }
              />
              <strong>{money(i.price_cents * i.quantity)}</strong>
            </article>
          ))}
        </div>
        <aside className="summary">
          <h2>Seu momento doce</h2>
          <p>
            Produtos <strong>{money(cartTotal(cart))}</strong>
          </p>
          <p>
            Entrega <strong>Grátis nesta demonstração</strong>
          </p>
          <hr />
          <p className="price">
            Total <strong>{money(cartTotal(cart))}</strong>
          </p>
          <Link className="button" to="/checkout">
            Revisar e continuar ↗
          </Link>
          <p className="muted">
            Valores e estoque serão confirmados pelo servidor.
          </p>
        </aside>
      </div>
    </section>
  );
}
function Checkout() {
  const { cart, setCart } = useStore(),
    navigate = useNavigate();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [key] = useState(() => crypto.randomUUID());
  const [current, setCurrent] = useState<Product[] | null>(null);
  useEffect(() => {
    Promise.all(cart.map((i) => api<Product>("/products/" + i.id)))
      .then(setCurrent)
      .catch((e) => setError(e.message));
  }, [cart]);
  const valid =
    current &&
    current.length === cart.length &&
    cart.every((i) => current.find((p) => p.id === i.id)!.stock >= i.quantity);
  const total = cartTotal(
    cart.map((i) => ({
      ...i,
      price_cents:
        current?.find((p) => p.id === i.id)?.price_cents || i.price_cents,
    })),
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const order = await api<{ id: string }>("/orders", "POST", {
        key,
        items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })),
        address: form,
        payment: form.payment,
      });
      setCart([]);
      navigate("/pedidos/" + order.id + "?confirmado=1");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Gate>
      {!cart.length ? (
        <Empty
          title="Sua sacola está vazia."
          text="Adicione um cupcake para continuar."
        />
      ) : (
        <section className="page checkout">
          <span className="eyebrow">FALTA SÓ UM POUQUINHO</span>
          <h1>
            Revise seu <em>momento doce.</em>
          </h1>
          <form className="cart-layout" onSubmit={submit}>
            <div className="form-card">
              <h2>Onde vamos entregar?</h2>
              <p className="muted">
                Demonstração: preencha com um endereço fictício.
              </p>
              <div className="form-grid">
                <Input name="cep" label="CEP" pattern="[0-9]{5}-?[0-9]{3}" />
                <Input name="street" label="Rua" minLength={3} />
                <Input name="number" label="Número" />
                <Input name="district" label="Bairro" />
                <Input name="city" label="Cidade" />
                <Input name="state" label="UF (ex.: SP)" pattern="[A-Z]{2}" />
                <Input name="complement" label="Complemento" required={false} />
              </div>
              <h2>Como prefere pagar?</h2>
              <label className="radio">
                <input
                  name="payment"
                  type="radio"
                  value="pix_simulado"
                  defaultChecked
                />{" "}
                PIX simulado
              </label>
              <label className="radio">
                <input name="payment" type="radio" value="entrega" /> Pagamento
                na entrega (simulado)
              </label>
              <p className="muted">
                Não há cobrança, chave PIX real ou envio físico.
              </p>
            </div>
            <aside className="summary">
              <h2>Revisão do pedido</h2>
              {cart.map((i) => (
                <p key={i.id}>
                  {i.quantity} × {i.name}
                  <strong>
                    {money(
                      (current?.find((p) => p.id === i.id)?.price_cents ||
                        i.price_cents) * i.quantity,
                    )}
                  </strong>
                </p>
              ))}
              <hr />
              <p className="price">
                Total <strong>{money(total)}</strong>
              </p>
              {!valid && (
                <p>
                  Verificando disponibilidade. Se o estoque mudou,{" "}
                  <Link to="/carrinho">ajuste a sacola</Link>.
                </p>
              )}
              <ErrorText error={error} />
              <button className="button" disabled={busy || !valid}>
                {busy ? "Registrando…" : "Confirmar pedido simulado"}
              </button>
            </aside>
          </form>
        </section>
      )}
    </Gate>
  );
}
interface Order {
  id: string;
  status: Status;
  total_cents: number;
  created_at: string;
  payment: string;
  customer?: string;
  email?: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  items?: { name: string; quantity: number; unit_price_cents: number }[];
  history?: { status: Status; created_at: string }[];
}
const date = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
function Orders() {
  const { user } = useStore();
  return <Gate>{user && <OrdersList />}</Gate>;
}
function OrdersList() {
  const { data, error, reload } = useLoad<Order[]>("/orders/me");
  return (
    <section className="page">
      <span className="eyebrow">SEUS MOMENTOS</span>
      <h1>Meus pedidos</h1>
      {data ? (
        data.length ? (
          <div className="orders">
            {data.map((o) => (
              <Link className="order-row" to={"/pedidos/" + o.id} key={o.id}>
                <span>
                  Pedido {o.id.slice(0, 8)}
                  <small>{date(o.created_at)}</small>
                </span>
                <span className="status">{statusLabels[o.status]}</span>
                <strong>{money(o.total_cents)} ↗</strong>
              </Link>
            ))}
          </div>
        ) : (
          <Empty
            title="Seu primeiro momento ainda vem."
            text="Os pedidos que você fizer aparecerão aqui."
          />
        )
      ) : (
        <Loading error={error} reload={reload} />
      )}
    </section>
  );
}
function OrderDetails() {
  const { id } = useParams(),
    { user } = useStore();
  return <Gate>{user && <OrderView id={id!} />}</Gate>;
}
function OrderView({ id }: { id: string }) {
  const { data: o, error, reload } = useLoad<Order>("/orders/" + id);
  return o ? (
    <section className="page">
      <span className="eyebrow">PEDIDO REGISTRADO • PAGAMENTO SIMULADO</span>
      <h1>Seu carinho está a caminho.</h1>
      <p>
        Pedido <strong>{o.id}</strong> • {date(o.created_at)}
      </p>
      <div className="cart-layout">
        <div className="form-card">
          <h2>Acompanhe seu pedido</h2>
          <ol className="timeline">
            {o.history?.map((h, i) => (
              <li key={i}>
                <strong>{statusLabels[h.status]}</strong>
                <span>{date(h.created_at)}</span>
              </li>
            ))}
          </ol>
          <p className="status">{statusLabels[o.status]}</p>
          <button onClick={reload}>Atualizar acompanhamento</button>
          <h2>Endereço de entrega</h2>
          <p>
            {o.street}, {o.number} • {o.city}/{o.state}
          </p>
          <p className="muted">
            Pedido demonstrativo. Não há entrega física ou cobrança.
          </p>
        </div>
        <aside className="summary">
          <h2>Resumo</h2>
          {o.items?.map((i, n) => (
            <p key={n}>
              {i.quantity} × {i.name}
              <strong>{money(i.unit_price_cents * i.quantity)}</strong>
            </p>
          ))}
          <hr />
          <p>
            Total <strong>{money(o.total_cents)}</strong>
          </p>
          <p>
            {o.payment === "pix_simulado"
              ? "PIX simulado"
              : "Pagamento na entrega simulado"}
          </p>
        </aside>
      </div>
    </section>
  ) : (
    <Loading error={error} reload={reload} />
  );
}
function Admin() {
  const { user } = useStore();
  return <Gate admin>{user?.role === "admin" && <AdminPanel />}</Gate>;
}
function AdminPanel() {
  const formRef = useRef<HTMLFormElement>(null);
  const [tab, setTab] = useState("products"),
    [error, setError] = useState(""),
    [edit, setEdit] = useState<Product | null>(null),
    [creating, setCreating] = useState(false),
    [from, setFrom] = useState("2000-01-01"),
    [to, setTo] = useState("2099-12-31");
  useEffect(() => {
    if (!edit && !creating) return;
    const frame = requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
      formRef.current?.querySelector("input")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [edit, creating]);
  const dateError =
    from && to && from > to
      ? "A data inicial deve ser anterior ou igual à data final."
      : "";
  const reportParams = new URLSearchParams();
  if (from) reportParams.set("from", from);
  if (to) reportParams.set("to", to);
  const products = useLoad<Product[]>("/admin/products"),
    orders = useLoad<Order[]>("/admin/orders");
  const report = useLoad<{
    summary: { orders: number; total_cents: number };
    top: { name: string; quantity: number }[];
    distribution: { status: Status; count: number }[];
    daily: { day: string; total_cents: number }[];
  }>(dateError ? null : "/admin/reports/sales?" + reportParams.toString());
  async function action(work: () => Promise<unknown>) {
    setError("");
    try {
      await work();
      products.reload();
      orders.reload();
      report.reload();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className="page">
      <span className="eyebrow">BASTIDORES DA LOJA</span>
      <h1>Administração</h1>
      <div className="tabs">
        {[
          ["products", "Produtos"],
          ["orders", "Pedidos"],
          ["reports", "Relatório de vendas"],
        ].map(([key, label]) => (
          <button
            className={tab === key ? "selected" : ""}
            onClick={() => setTab(key)}
            key={key}
          >
            {label}
          </button>
        ))}
      </div>
      <ErrorText error={error} />
      {tab === "products" && (
        <>
          <button
            className="button"
            onClick={() => {
              setCreating(true);
              setEdit(null);
            }}
          >
            Cadastrar cupcake +
          </button>
          {(edit || creating) && (
            <form
              ref={formRef}
              className="form-card"
              key={edit?.id || "new"}
              onSubmit={(e) => {
                e.preventDefault();
                const f = Object.fromEntries(new FormData(e.currentTarget));
                const price = parsePrice(String(f.price));
                if (price === null) {
                  setError(
                    "Informe um preço de R$ 1,00 a R$ 1.000,00, como 12,90 ou 12.90.",
                  );
                  return;
                }
                action(async () => {
                  await api(
                    "/admin/products" + (edit ? "/" + edit.id : ""),
                    edit ? "PATCH" : "POST",
                    {
                      ...f,
                      price_cents: price,
                      stock: Number(f.stock),
                      category_id: Number(f.category_id),
                      active: Number(f.active),
                    },
                  );
                  setEdit(null);
                  setCreating(false);
                });
              }}
            >
              <h2>{edit ? "Editar" : "Novo"} cupcake</h2>
              <div className="form-grid">
                <Input name="name" label="Nome" defaultValue={edit?.name} />
                <Input
                  name="description"
                  label="Descrição e ingredientes"
                  defaultValue={edit?.description}
                />
                <Input
                  name="price"
                  label="Preço em reais"
                  defaultValue={String((edit?.price_cents || 1290) / 100)}
                />
                <Input
                  name="stock"
                  label="Estoque"
                  type="number"
                  defaultValue={String(edit?.stock ?? 100)}
                />
                <label>
                  Categoria
                  <select
                    name="category_id"
                    defaultValue={edit?.category_id || 1}
                  >
                    <option value="1">Clássicos</option>
                    <option value="2">Frutados</option>
                    <option value="3">Especiais</option>
                  </select>
                </label>
                <label>
                  Visibilidade
                  <select name="active" defaultValue={edit?.active ?? 1}>
                    <option value="1">Ativo</option>
                    <option value="0">Desativado</option>
                  </select>
                </label>
                <label>
                  Ilustração
                  <select
                    name="image"
                    defaultValue={edit?.image || "/images/chocolate.svg"}
                  >
                    {[
                      "chocolate",
                      "red-velvet",
                      "morango",
                      "limao",
                      "doce-de-leite",
                      "pistache",
                      "coco",
                      "frutas",
                    ].map((v) => (
                      <option key={v} value={"/images/" + v + ".svg"}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="inline-actions">
                <button className="button">Salvar produto</button>
                <button
                  type="button"
                  onClick={() => {
                    setEdit(null);
                    setCreating(false);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
          {products.data ? (
            <div className="admin-list">
              {products.data.map((p) => (
                <article className="order-row" key={p.id}>
                  <span>
                    {p.name}
                    <small>
                      {money(p.price_cents)} • Estoque: {p.stock} •{" "}
                      {p.active ? "Ativo" : "Desativado"}
                    </small>
                  </span>
                  <button
                    onClick={() => {
                      setEdit(p);
                      setCreating(false);
                    }}
                  >
                    Editar {p.name}
                  </button>
                  <button
                    disabled={!p.active}
                    onClick={() =>
                      action(() => api("/admin/products/" + p.id, "DELETE", {}))
                    }
                  >
                    Desativar
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <Loading error={products.error} reload={products.reload} />
          )}
        </>
      )}
      {tab === "orders" &&
        (orders.data ? (
          <div>
            {orders.data.length === 0 && <p>Nenhum pedido registrado.</p>}
            {orders.data.map((o) => (
              <article className="order-row" key={o.id}>
                <Link to={"/pedidos/" + o.id}>
                  Pedido {o.id.slice(0, 8)}
                  <small>
                    {o.customer} • {o.email} • {money(o.total_cents)}
                  </small>
                </Link>
                <span>{statusLabels[o.status]}</span>
                <div className="inline-actions">
                  {Object.keys(statusLabels)
                    .filter((s) => canTransition(o.status, s as Status))
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() =>
                          action(() =>
                            api("/admin/orders/" + o.id + "/status", "PATCH", {
                              status: s,
                            }),
                          )
                        }
                      >
                        {statusLabels[s as Status]}
                      </button>
                    ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Loading error={orders.error} reload={orders.reload} />
        ))}
      {tab === "reports" && (
        <>
          <div className="filters">
            <label>
              De
              <input
                aria-label="Data inicial"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label>
              Até
              <input
                aria-label="Data final"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
          {dateError ? (
            <ErrorText error={dateError} />
          ) : report.data ? (
            <>
              <div className="metrics">
                <div>
                  <span>Pedidos no período</span>
                  <strong>{report.data.summary.orders}</strong>
                </div>
                <div>
                  <span>Total sem cancelados</span>
                  <strong>{money(report.data.summary.total_cents)}</strong>
                </div>
              </div>
              <h2>Produtos mais vendidos</h2>
              {report.data.top.map((p) => (
                <p key={p.name}>
                  {p.name} — {p.quantity} unidades
                </p>
              ))}
              <h2>Distribuição por status</h2>
              {report.data.distribution.map((r) => (
                <p key={r.status}>
                  {statusLabels[r.status]}: {r.count}
                </p>
              ))}
              <h2>Vendas por dia</h2>
              {report.data.daily.map((r) => (
                <p key={r.day}>
                  {r.day}: {money(r.total_cents)}
                </p>
              ))}
              <p className="muted">
                Horário de São Paulo. Valores demonstrativos de pedidos, sem
                pagamentos reais.
              </p>
            </>
          ) : (
            <Loading error={report.error} reload={report.reload} />
          )}
        </>
      )}
    </section>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
