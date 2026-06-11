import { supabase, isSupabaseConfigured } from "./supabase";

export interface WeddingTask {
  id: string;
  title: string;
  description?: string;
  due_date: string; // YYYY-MM-DD
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "PENDING" | "COMPLETED";
  created_at?: string;
  updated_at?: string;
}

class MockTasksDB {
  private getStorageKey(): string {
    return "wedding_db_tasks";
  }

  private getData(): WeddingTask[] {
    if (typeof window === "undefined") return [];
    const item = localStorage.getItem(this.getStorageKey());
    if (!item) {
      // Premium initial mock task items for a premium UX
      const defaultTasks: WeddingTask[] = [
        {
          id: "task-1",
          title: "Book Wedding Venue",
          description: "Finalize reservation details and pay advance deposit to secure the grand hall.",
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          priority: "URGENT",
          status: "PENDING",
        },
        {
          id: "task-2",
          title: "Finalize Catering Menu",
          description: "Select standard and premium dishes, lock headcounts, and schedule food tasting session.",
          due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          priority: "HIGH",
          status: "PENDING",
        },
        {
          id: "task-3",
          title: "Meet Photographer",
          description: "Review portfolio, agree on portrait and candids shotlist, and lock time schedules.",
          due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          priority: "MEDIUM",
          status: "PENDING",
        },
        {
          id: "task-4",
          title: "Order Wedding Invitations",
          description: "Finalize gold-foil invitation design proofs, verify spelling, and print first batch.",
          due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          priority: "HIGH",
          status: "PENDING", // Overdue task representation
        },
        {
          id: "task-5",
          title: "Confirm Guest List",
          description: "Gather responses and update final counts for dinner table seating configurations.",
          due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          priority: "LOW",
          status: "COMPLETED", // Completed task representation
        }
      ];
      this.setData(defaultTasks);
      return defaultTasks;
    }
    try {
      return JSON.parse(item) as WeddingTask[];
    } catch {
      return [];
    }
  }

  private setData(data: WeddingTask[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
  }

  getTasks(): WeddingTask[] {
    return this.getData();
  }

  saveTasks(tasks: WeddingTask[]): void {
    this.setData(tasks);
  }
}

const mockTasksDb = new MockTasksDB();

// Unified APIs for Tasks

export const getWeddingTasks = async (): Promise<WeddingTask[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("wedding_tasks")
        .select("*")
        .order("due_date", { ascending: true });
      if (data && !error) {
        return data as WeddingTask[];
      }
    } catch (e) {
      console.error("Supabase getWeddingTasks error:", e);
    }
  }
  return mockTasksDb.getTasks();
};

export const createWeddingTask = async (
  task: Omit<WeddingTask, "id" | "created_at" | "updated_at">
): Promise<WeddingTask> => {
  const newTask: WeddingTask = {
    ...task,
    id: typeof window !== "undefined" && window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
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
      
      if (data && !error) {
        return data as WeddingTask;
      }
      if (error) {
        throw new Error(error.message);
      }
    } catch (e) {
      console.error("Supabase createWeddingTask error:", e);
      throw e;
    }
  }

  const tasks = mockTasksDb.getTasks();
  tasks.push(newTask);
  mockTasksDb.saveTasks(tasks);
  return newTask;
};

export const updateWeddingTask = async (
  id: string,
  updatedFields: Partial<Omit<WeddingTask, "id" | "created_at" | "updated_at">>
): Promise<WeddingTask> => {
  if (isSupabaseConfigured) {
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
      
      if (data && !error) {
        return data as WeddingTask;
      }
      if (error) {
        throw new Error(error.message);
      }
    } catch (e) {
      console.error("Supabase updateWeddingTask error:", e);
      throw e;
    }
  }

  const tasks = mockTasksDb.getTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index >= 0) {
    const updated = {
      ...tasks[index],
      ...updatedFields,
      updated_at: new Date().toISOString(),
    };
    tasks[index] = updated;
    mockTasksDb.saveTasks(tasks);
    return updated;
  }
  throw new Error("Task not found locally.");
};

export const deleteWeddingTask = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("wedding_tasks")
        .delete()
        .eq("id", id);
      
      if (error) {
        throw new Error(error.message);
      }
      return true;
    } catch (e) {
      console.error("Supabase deleteWeddingTask error:", e);
      throw e;
    }
  }

  const tasks = mockTasksDb.getTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  if (tasks.length !== filtered.length) {
    mockTasksDb.saveTasks(filtered);
    return true;
  }
  return false;
};
