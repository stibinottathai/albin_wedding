import { supabase, isSupabaseConfigured } from "./supabase";

export interface WeddingBudget {
  id: string;
  total_budget: number;
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  budget_id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string; // YYYY-MM-DD
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const expenseCategories = [
  "Venue",
  "Catering",
  "Photography & Videography",
  "Decoration",
  "Bridal & Groom Dress",
  "Makeup",
  "Jewellery",
  "Transportation",
  "Music & Entertainment",
  "Miscellaneous"
] as const;

export type ExpenseCategory = typeof expenseCategories[number];

class MockBudgetDB {
  private getStorageKey(key: string): string {
    return `wedding_db_${key}`;
  }

  private getData<T>(key: string, defaultVal: T): T {
    if (typeof window === "undefined") return defaultVal;
    const item = localStorage.getItem(this.getStorageKey(key));
    if (!item) {
      this.setData(key, defaultVal);
      return defaultVal;
    }
    try {
      return JSON.parse(item) as T;
    } catch {
      return defaultVal;
    }
  }

  private setData<T>(key: string, data: T): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.getStorageKey(key), JSON.stringify(data));
  }

  getBudget(): WeddingBudget | null {
    return this.getData<WeddingBudget | null>("budget", null);
  }

  saveBudget(budget: WeddingBudget): void {
    this.setData("budget", budget);
  }

  getExpenses(): Expense[] {
    return this.getData<Expense[]>("expenses", []);
  }

  saveExpenses(expenses: Expense[]): void {
    this.setData("expenses", expenses);
  }
}

const mockBudgetDb = new MockBudgetDB();

// Unified API Service for Budgets and Expenses

export const getWeddingBudget = async (): Promise<WeddingBudget | null> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("wedding_budgets")
        .select("*")
        .limit(1);
      
      if (data && data.length > 0) {
        return data[0] as WeddingBudget;
      }
      return null;
    } catch (e) {
      console.error("Supabase getWeddingBudget error:", e);
    }
  }
  return mockBudgetDb.getBudget();
};

export const createWeddingBudget = async (totalBudget: number): Promise<WeddingBudget> => {
  const newBudget: WeddingBudget = {
    id: typeof window !== "undefined" && window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
    total_budget: totalBudget,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("wedding_budgets")
        .insert({ total_budget: totalBudget })
        .select()
        .single();
      
      if (data && !error) {
        return data as WeddingBudget;
      }
      if (error) {
        throw new Error(error.message);
      }
    } catch (e) {
      console.error("Supabase createWeddingBudget error:", e);
      throw e;
    }
  }

  mockBudgetDb.saveBudget(newBudget);
  return newBudget;
};

export const updateWeddingBudget = async (id: string, totalBudget: number): Promise<WeddingBudget> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("wedding_budgets")
        .update({ total_budget: totalBudget, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      
      if (data && !error) {
        return data as WeddingBudget;
      }
      if (error) {
        throw new Error(error.message);
      }
    } catch (e) {
      console.error("Supabase updateWeddingBudget error:", e);
      throw e;
    }
  }

  const budget = mockBudgetDb.getBudget();
  if (budget && budget.id === id) {
    const updated = { ...budget, total_budget: totalBudget, updated_at: new Date().toISOString() };
    mockBudgetDb.saveBudget(updated);
    return updated;
  }
  throw new Error("Budget not found locally.");
};

export const getExpenses = async (budgetId?: string): Promise<Expense[]> => {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from("expenses").select("*").order("expense_date", { ascending: false });
      if (budgetId) {
        query = query.eq("budget_id", budgetId);
      }
      const { data, error } = await query;
      if (data) {
        return data as Expense[];
      }
    } catch (e) {
      console.error("Supabase getExpenses error:", e);
    }
  }
  const allExpenses = mockBudgetDb.getExpenses();
  if (budgetId) {
    return allExpenses.filter(e => e.budget_id === budgetId);
  }
  return allExpenses;
};

export const createExpense = async (
  expense: Omit<Expense, "id" | "created_at" | "updated_at">
): Promise<Expense> => {
  const newExpense: Expense = {
    ...expense,
    id: typeof window !== "undefined" && window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          budget_id: expense.budget_id,
          title: expense.title,
          category: expense.category,
          amount: expense.amount,
          expense_date: expense.expense_date,
          notes: expense.notes,
        })
        .select()
        .single();
      
      if (data && !error) {
        return data as Expense;
      }
      if (error) {
        throw new Error(error.message);
      }
    } catch (e) {
      console.error("Supabase createExpense error:", e);
      throw e;
    }
  }

  const expenses = mockBudgetDb.getExpenses();
  expenses.push(newExpense);
  mockBudgetDb.saveExpenses(expenses);
  return newExpense;
};

export const updateExpense = async (id: string, updatedFields: Partial<Omit<Expense, "id" | "budget_id" | "created_at" | "updated_at">>): Promise<Expense> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .update({
          ...updatedFields,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      
      if (data && !error) {
        return data as Expense;
      }
      if (error) {
        throw new Error(error.message);
      }
    } catch (e) {
      console.error("Supabase updateExpense error:", e);
      throw e;
    }
  }

  const expenses = mockBudgetDb.getExpenses();
  const index = expenses.findIndex(e => e.id === id);
  if (index >= 0) {
    const updated = {
      ...expenses[index],
      ...updatedFields,
      updated_at: new Date().toISOString(),
    };
    expenses[index] = updated;
    mockBudgetDb.saveExpenses(expenses);
    return updated;
  }
  throw new Error("Expense not found locally.");
};

export const deleteExpense = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);
      
      if (error) {
        throw new Error(error.message);
      }
      return true;
    } catch (e) {
      console.error("Supabase deleteExpense error:", e);
      throw e;
    }
  }

  const expenses = mockBudgetDb.getExpenses();
  const filtered = expenses.filter(e => e.id !== id);
  if (expenses.length !== filtered.length) {
    mockBudgetDb.saveExpenses(filtered);
    return true;
  }
  return false;
};
