import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Minus, Plus, ShoppingBag, Store, Trash2, Search, PackagePlus } from "lucide-react";
import { api, type BagItem, type Product } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cesta — Lista de compras" },
      { name: "description", content: "Monte sua sacola e marque os itens no mercado." },
      { property: "og:title", content: "Cesta — Lista de compras" },
      { property: "og:description", content: "Monte sua sacola e marque os itens no mercado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
type Tab = "produtos" | "sacola" | "cadastro";

function App() {
  const [tab, setTab] = useState<Tab>("produtos");
  const [products, setProducts] = useState<Product[]>([]);
  const [bag, setBag] = useState<BagItem[]>([]);

  useEffect(() => {
    api.listProducts().then(setProducts);
    api.getBag().then(setBag);
  }, []);

  const updateBag = (next: BagItem[]) => {
    setBag(next);
    api.saveBag(next);
  };
  const qtyOf = (id: string) => bag.find((b) => b.productId === id)?.qty ?? 0;
  const setQty = (id: string, qty: number) => {
    const exists = bag.some((b) => b.productId === id);
    if (qty <= 0) return updateBag(bag.filter((b) => b.productId !== id));
    updateBag(
      exists
        ? bag.map((b) => (b.productId === id ? { ...b, qty } : b))
        : [...bag, { productId: id, qty, checked: false }],
    );
  };

  const count = bag.reduce((s, b) => s + b.qty, 0);

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
        <header className="px-6 pt-10 pb-4">
          <p className="text-sm text-muted-foreground">Olá 👋</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {tab === "produtos" ? "O que vamos comprar?" : tab === "sacola" ? "Sua sacola" : "Novo produto"}
          </h1>
        </header>

        <main className="flex-1 px-6 pb-28">
          {tab === "produtos" && <Catalog products={products} qtyOf={qtyOf} setQty={setQty} />}
          {tab === "sacola" && (
            <Bag bag={bag} products={products} setQty={setQty} update={updateBag} goShop={() => setTab("produtos")} />
          )}
          {tab === "cadastro" && (
            <Register
              products={products}
              onCreate={async (p) => {
                const np = await api.createProduct(p);
                setProducts((ps) => [np, ...ps]);
              }}
              onDelete={async (id) => {
                await api.deleteProduct(id);
                setProducts((ps) => ps.filter((p) => p.id !== id));
                updateBag(bag.filter((b) => b.productId !== id));
              }}
            />
          )}
        </main>

        <nav className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t bg-background/90 px-6 py-3 backdrop-blur">
          <div className="grid grid-cols-3 gap-2">
            <NavBtn active={tab === "produtos"} onClick={() => setTab("produtos")} icon={<Store size={20} />} label="Produtos" />
            <NavBtn
              active={tab === "sacola"}
              onClick={() => setTab("sacola")}
              icon={<ShoppingBag size={20} />}
              label="Sacola"
              badge={count}
            />
            <NavBtn active={tab === "cadastro"} onClick={() => setTab("cadastro")} icon={<PackagePlus size={20} />} label="Cadastrar" />
          </div>
        </nav>
      </div>
    </div>
  );
}

function NavBtn({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
      {!!badge && (
        <span className="absolute top-1 right-[calc(50%-22px)] grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}

function Catalog({ products, qtyOf, setQty }: { products: Product[]; qtyOf: (id: string) => number; setQty: (id: string, q: number) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todos");
  const cats = useMemo(() => ["Todos", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const list = products.filter(
    (p) => (cat === "Todos" || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
        <Search size={18} className="text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto" className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
      </label>
      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
              cat === c ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <ul className="divide-y">
        {list.map((p) => {
          const qty = qtyOf(p.id);
          return (
            <li key={p.id} className="flex items-center gap-3 py-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary font-display text-lg text-secondary-foreground">
                {p.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  {brl(p.price)} / {p.unit}
                </p>
              </div>
              {qty === 0 ? (
                <button onClick={() => setQty(p.id, 1)} className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground" aria-label={`Adicionar ${p.name}`}>
                  <Plus size={18} />
                </button>
              ) : (
                <Stepper qty={qty} onChange={(n) => setQty(p.id, n)} />
              )}
            </li>
          );
        })}
        {list.length === 0 && <p className="py-10 text-center text-muted-foreground">Nenhum produto encontrado.</p>}
      </ul>
    </div>
  );
}

function Stepper({ qty, onChange }: { qty: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-muted p-1">
      <button onClick={() => onChange(qty - 1)} className="grid h-8 w-8 place-items-center rounded-full bg-background" aria-label="Diminuir">
        <Minus size={14} />
      </button>
      <span className="w-6 text-center text-sm font-semibold">{qty}</span>
      <button onClick={() => onChange(qty + 1)} className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground" aria-label="Aumentar">
        <Plus size={14} />
      </button>
    </div>
  );
}

function Bag({ bag, products, setQty, update, goShop }: { bag: BagItem[]; products: Product[]; setQty: (id: string, q: number) => void; update: (b: BagItem[]) => void; goShop: () => void }) {
  const rows = bag
    .map((b) => ({ ...b, p: products.find((p) => p.id === b.productId) }))
    .filter((r): r is BagItem & { p: Product } => !!r.p)
    .sort((a, b) => Number(a.checked) - Number(b.checked));
  const done = rows.filter((r) => r.checked).length;
  const total = rows.reduce((s, r) => s + r.p.price * r.qty, 0);
  const pct = rows.length ? (done / rows.length) * 100 : 0;

  if (!rows.length)
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary">
          <ShoppingBag className="text-secondary-foreground" />
        </div>
        <p className="mt-4 font-medium">Sua sacola está vazia</p>
        <p className="text-sm text-muted-foreground">Adicione produtos para montar sua lista.</p>
        <button onClick={goShop} className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
          Ver produtos
        </button>
      </div>
    );

  const toggle = (id: string) => update(bag.map((b) => (b.productId === id ? { ...b, checked: !b.checked } : b)));

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-primary p-5 text-primary-foreground">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm opacity-80">Total estimado</p>
            <p className="font-display text-3xl font-semibold">{brl(total)}</p>
          </div>
          <p className="text-sm opacity-80">
            {done}/{rows.length} itens
          </p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-foreground/20">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.productId} className={`flex items-center gap-3 rounded-2xl border p-3 transition-opacity ${r.checked ? "opacity-50" : ""}`}>
            <button
              onClick={() => toggle(r.productId)}
              aria-label="Marcar"
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                r.checked ? "border-primary bg-primary text-primary-foreground" : "border-border"
              }`}
            >
              {r.checked && <Check size={14} strokeWidth={3} />}
            </button>
            <div className="min-w-0 flex-1" onClick={() => toggle(r.productId)}>
              <p className={`truncate font-medium ${r.checked ? "line-through" : ""}`}>{r.p.name}</p>
              <p className="text-sm text-muted-foreground">{brl(r.p.price * r.qty)}</p>
            </div>
            <Stepper qty={r.qty} onChange={(n) => setQty(r.productId, n)} />
          </li>
        ))}
      </ul>

      {done > 0 && (
        <button onClick={() => update(bag.filter((b) => !b.checked))} className="w-full rounded-full border py-3 text-sm text-muted-foreground">
          Limpar itens marcados
        </button>
      )}
    </div>
  );
}

function Register({ products, onCreate, onDelete }: { products: Product[]; onCreate: (p: Omit<Product, "id">) => Promise<void>; onDelete: (id: string) => void }) {
  const [form, setForm] = useState({ name: "", category: "", price: "", unit: "un" });
  const valid = form.name.trim() && form.category.trim() && Number(form.price) > 0;
  const field = "w-full rounded-2xl bg-muted px-4 py-3 outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-8">
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!valid) return;
          await onCreate({ name: form.name.trim(), category: form.category.trim(), price: Number(form.price), unit: form.unit });
          setForm({ name: "", category: "", price: "", unit: "un" });
        }}
      >
        <input className={field} placeholder="Nome do produto" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={field} placeholder="Categoria (ex.: Hortifruti)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <div className="flex gap-3">
          <input className={field} type="number" step="0.01" min="0" inputMode="decimal" placeholder="Preço" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <select className={`${field} w-28`} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            {["un", "kg", "g", "L", "ml", "cx"].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
        <button disabled={!valid} className="w-full rounded-full bg-primary py-3.5 font-medium text-primary-foreground transition-opacity disabled:opacity-40">
          Cadastrar produto
        </button>
      </form>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Cadastrados ({products.length})</h2>
        <ul className="divide-y">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  {p.category} · {brl(p.price)}/{p.unit}
                </p>
              </div>
              <button onClick={() => onDelete(p.id)} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Excluir">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
