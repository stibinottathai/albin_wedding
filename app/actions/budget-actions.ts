"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isServerSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "https://your-supabase-project-id.supabase.co" &&
  supabaseAnonKey !== "your-supabase-anon-key"
);

const getSupabaseClient = () => {
  if (!isServerSupabaseConfigured) return null;
  return createClient(supabaseUrl!, supabaseAnonKey!);
};

export async function createBudgetAction(totalBudget: number) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: "Supabase not configured on server." };
  }

  try {
    const { data, error } = await supabase
      .from("wedding_budgets")
      .insert({ total_budget: totalBudget })
      .select()
      .single();

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/budget");
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateBudgetAction(id: string, totalBudget: number) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: "Supabase not configured on server." };
  }

  try {
    const { data, error } = await supabase
      .from("wedding_budgets")
      .update({ total_budget: totalBudget, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/budget");
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function addExpenseAction(expense: {
  budget_id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  notes?: string;
}) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: "Supabase not configured on server." };
  }

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

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/budget");
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateExpenseAction(
  id: string,
  updatedFields: {
    title?: string;
    category?: string;
    amount?: number;
    expense_date?: string;
    notes?: string;
  }
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: "Supabase not configured on server." };
  }

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

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/budget");
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteExpenseAction(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: "Supabase not configured on server." };
  }

  try {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/budget");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
