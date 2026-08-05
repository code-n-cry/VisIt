export interface Group {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

export interface Entry {
  id: string;
  categoryId: string;
  groupId: string | null;
  name: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface Settings {
  userName: string;
  displayCurrency: string;
  dailyLimit?: number;
  dailyLimitCurrency?: string;
}

export interface AppData {
  settings: Settings | null;
  groups: Group[];
  categories: Category[];
  entries: Entry[];
}
