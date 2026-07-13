export interface Category {
  id: string;
  name: string;
}

export interface Entry {
  id: string;
  categoryId: string;
  name: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface Settings {
  userName: string;
  displayCurrency: string;
}

export interface AppData {
  settings: Settings | null;
  categories: Category[];
  entries: Entry[];
}
