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

export async function createTaskAction(task: {
  title: string;
  description?: string;
  due_date: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "PENDING" | "COMPLETED";
}) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: "Supabase not configured on server." };
  }

  try {
    const { data, error } = await supabase
      .from("wedding_tasks")
      .insert({
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        priority: task.priority,
        status: task.status,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/tasks");
    revalidatePath("/admin");
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateTaskAction(
  id: string,
  updatedFields: {
    title?: string;
    description?: string;
    due_date?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    status?: "PENDING" | "COMPLETED";
  }
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: "Supabase not configured on server." };
  }

  try {
    const { data, error } = await supabase
      .from("wedding_tasks")
      .update({
        ...updatedFields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/tasks");
    revalidatePath("/admin");
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteTaskAction(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: "Supabase not configured on server." };
  }

  try {
    const { error } = await supabase
      .from("wedding_tasks")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/tasks");
    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
