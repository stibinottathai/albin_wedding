"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { mapVendorCategoryToExpense } from "../../lib/vendors-db";

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

// Helper to sync vendor payments as expenses in Supabase budget
async function syncVendorPaymentToBudgetServer(
  supabase: any,
  vendorId: string,
  vendorName: string,
  category: string,
  amountPaid: number,
  isDelete: boolean = false
): Promise<void> {
  try {
    // 1. Get or create active budget record
    let budgetId = null;
    const { data: budgets, error: budgetError } = await supabase
      .from("wedding_budgets")
      .select("id")
      .limit(1);

    if (budgets && budgets.length > 0) {
      budgetId = budgets[0].id;
    } else {
      const { data: newBudget, error: newBudgetError } = await supabase
        .from("wedding_budgets")
        .insert({ total_budget: 1000000 })
        .select()
        .single();
      if (newBudget) {
        budgetId = newBudget.id;
      } else {
        throw new Error("Failed to resolve or create budget record.");
      }
    }

    // 2. Search for existing expense tagged with the vendor ID
    const targetTag = `[Vendor: ${vendorId}]`;
    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("*")
      .eq("budget_id", budgetId)
      .like("notes", `%${targetTag}%`);

    const existingExpense = expenses && expenses.length > 0 ? expenses[0] : null;

    if (isDelete || amountPaid === 0) {
      if (existingExpense) {
        await supabase.from("expenses").delete().eq("id", existingExpense.id);
      }
    } else {
      const mappedCategory = mapVendorCategoryToExpense(category);
      if (existingExpense) {
        // Update existing expense
        await supabase
          .from("expenses")
          .update({
            title: `Vendor Payment: ${vendorName}`,
            amount: amountPaid,
            category: mappedCategory,
            notes: targetTag,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingExpense.id);
      } else {
        // Insert new expense
        await supabase
          .from("expenses")
          .insert({
            budget_id: budgetId,
            title: `Vendor Payment: ${vendorName}`,
            amount: amountPaid,
            category: mappedCategory,
            expense_date: new Date().toISOString().split("T")[0],
            notes: targetTag,
          });
      }
    }
  } catch (err) {
    console.error("Failed to sync vendor payment to Supabase budget:", err);
  }
}

export async function createVendorAction(vendor: {
  vendor_name: string;
  category: string;
  contact_person?: string;
  phone: string;
  email?: string;
  total_cost: number;
  amount_paid: number;
}) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: "Supabase not configured on server." };
  }

  try {
    const { data, error } = await supabase
      .from("vendors")
      .insert({
        vendor_name: vendor.vendor_name,
        category: vendor.category,
        contact_person: vendor.contact_person,
        phone: vendor.phone,
        email: vendor.email,
        total_cost: vendor.total_cost,
        amount_paid: vendor.amount_paid,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Sync to budget database
    await syncVendorPaymentToBudgetServer(supabase, data.id, data.vendor_name, data.category, Number(data.amount_paid));

    revalidatePath("/dashboard/vendors");
    revalidatePath("/dashboard/budget");
    revalidatePath("/admin");
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateVendorAction(
  id: string,
  updatedFields: {
    vendor_name?: string;
    category?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    total_cost?: number;
    amount_paid?: number;
  }
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: "Supabase not configured on server." };
  }

  try {
    const { data, error } = await supabase
      .from("vendors")
      .update({
        ...updatedFields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Sync to budget database
    await syncVendorPaymentToBudgetServer(supabase, data.id, data.vendor_name, data.category, Number(data.amount_paid));

    revalidatePath("/dashboard/vendors");
    revalidatePath("/dashboard/budget");
    revalidatePath("/admin");
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteVendorAction(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: "Supabase not configured on server." };
  }

  try {
    const { error } = await supabase
      .from("vendors")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);

    // Sync to budget database (mark as deleted)
    await syncVendorPaymentToBudgetServer(supabase, id, "", "", 0, true);

    revalidatePath("/dashboard/vendors");
    revalidatePath("/dashboard/budget");
    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
