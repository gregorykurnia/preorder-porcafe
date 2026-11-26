// The bazaar menu. Prices in Rupiah. Change items here; ids must stay stable
// once orders exist, because saved orders refer to them.

export type Product = {
  /** Unique per orderable line, e.g. "pork-sate-5". */
  id: string;
  /** The menu item this belongs to, used by the staff filter. */
  itemId: string;
  name: string;
  /** e.g. "5 skewers"; empty for items with one size. */
  variant: string;
  price: number;
};

export type MenuItem = {
  id: string;
  name: string;
  products: Product[];
};

export type Category = {
  id: string;
  name: string;
  image: string;
  imageShape: "rect" | "round";
  items: MenuItem[];
};

function single(id: string, name: string, price: number): MenuItem {
  return { id, name, products: [{ id, itemId: id, name, variant: "", price }] };
}

function sate(id: string, name: string, price5: number, price10: number): MenuItem {
  return {
    id,
    name,
    products: [
      { id: `${id}-5`, itemId: id, name, variant: "5 skewers", price: price5 },
      { id: `${id}-10`, itemId: id, name, variant: "10 skewers", price: price10 },
    ],
  };
}

export const MENU: Category[] = [
  {
    id: "sate",
    name: "Sate",
    image: "/menu/sate.jpg",
    imageShape: "rect",
    items: [
      sate("pork-sate", "Pork Sate", 60_000, 110_000),
      sate("sate-taichan", "Sate Taichan", 75_000, 140_000),
      sate("sate-samcan", "Sate Samcan", 75_000, 140_000),
    ],
  },
  {
    id: "rice-bowl",
    name: "Rice bowl",
    image: "/menu/bowl-sate.jpg",
    imageShape: "rect",
    items: [
      single("sate-and-samcan", "Sate and Samcan", 65_000),
      single("samcan-telur", "Samcan Telur", 60_000),
    ],
  },
  {
    id: "cookies",
    name: "Soft cookies",
    image: "/menu/cookies.jpg",
    imageShape: "round",
    items: [
      single("brown-butter-dark-choco", "Brown Butter Dark Choco", 20_000),
      single("biscoff-cookie-butter", "Biscoff Cookie Butter", 20_000),
      single("matcha-white-chocolate", "Matcha White Chocolate", 20_000),
    ],
  },
  {
    id: "coffee",
    name: "Chilled coffee",
    image: "/menu/coffee.jpg",
    imageShape: "round",
    items: [
      single("coffee-jelly-latte", "Coffee Jelly Latte", 25_000),
      single("cranberry-americano", "Cranberry Americano", 25_000),
    ],
  },
];

export const ITEMS: MenuItem[] = MENU.flatMap((c) => c.items);
export const PRODUCTS: Product[] = ITEMS.flatMap((i) => i.products);
const BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));

export function findProduct(id: string): Product | undefined {
  return BY_ID.get(id);
}

export function formatRp(amount: number): string {
  return "Rp" + amount.toLocaleString("id-ID");
}
