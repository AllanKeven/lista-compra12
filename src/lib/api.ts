// Camada de dados: troque estas funções por chamadas fetch ao seu backend Node.
// Ex.: listProducts = () => fetch(`${API}/products`).then(r => r.json())

export type Product = { id: string; name: string; category: string; price: number; unit: string };
export type BagItem = { productId: string; qty: number; checked: boolean };

const PK = "sl.products";
const BK = "sl.bag";

const seed: Product[] = [
  { id: "1", name: "Arroz integral", category: "Grãos", price: 8.9, unit: "kg" },
  { id: "2", name: "Feijão carioca", category: "Grãos", price: 7.5, unit: "kg" },
  { id: "3", name: "Leite", category: "Laticínios", price: 4.99, unit: "L" },
  { id: "4", name: "Banana prata", category: "Hortifruti", price: 5.49, unit: "kg" },
  { id: "5", name: "Café", category: "Mercearia", price: 16.9, unit: "un" },
  { id: "6", name: "Pão de forma", category: "Padaria", price: 9.9, unit: "un" },
];

const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));

// Defina VITE_API_URL (ex.: http://localhost:3333) para usar seu backend.
const API = import.meta.env["VITE_API_URL"] as string | undefined;
const http = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (r.status === 204 ? undefined : await r.json()) as T;
};

const remote = {
  listProducts: () => http<Product[]>("/products"),
  createProduct: (p: Omit<Product, "id">) =>
    http<Product>("/products", { method: "POST", body: JSON.stringify(p) }),
  deleteProduct: (id: string) => http<void>(`/products/${id}`, { method: "DELETE" }),
  getBag: () => http<BagItem[]>("/bag"),
  saveBag: (items: BagItem[]) => http<void>("/bag", { method: "PUT", body: JSON.stringify(items) }),
};

const local = {
  async listProducts(): Promise<Product[]> {
    return read(PK, seed);
  },
  async createProduct(p: Omit<Product, "id">): Promise<Product> {
    const all = read(PK, seed);
    const np = { ...p, id: crypto.randomUUID() };
    write(PK, [np, ...all]);
    return np;
  },
  async deleteProduct(id: string) {
    write(PK, read(PK, seed).filter((p) => p.id !== id));
  },
  async getBag(): Promise<BagItem[]> {
    return read(BK, []);
  },
  async saveBag(items: BagItem[]) {
    write(BK, items);
  },
};

export const api = API ? remote : local;
