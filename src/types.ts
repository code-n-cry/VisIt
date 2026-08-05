export interface Group {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  banned?: boolean;
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

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  targetCurrency: string;
  savedAmount: number;
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
  goals: Goal[];
}
