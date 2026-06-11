"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Calendar, 
  Check, 
  X, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  CircleDot, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowRight,
  Search,
  Filter,
  CheckCircle
} from "lucide-react";
import { 
  getWeddingTasks, 
  createWeddingTask, 
  updateWeddingTask, 
  deleteWeddingTask,
  WeddingTask
} from "../lib/tasks-db";
import { isSupabaseConfigured } from "../lib/supabase";
import { createTaskAction, updateTaskAction, deleteTaskAction } from "../app/actions/tasks-actions";

// --- Form Validation Schema ---
const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  due_date: z.string().min(1, "Due date is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});

type TaskFormData = z.infer<typeof taskSchema>;

export interface TasksTrackerActions {
  openAddTask: () => void;
}

interface TasksTrackerTabProps {
  registerActions?: (actions: TasksTrackerActions | null) => void;
}

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export default function TasksTrackerTab({ registerActions }: TasksTrackerTabProps) {
  const [mounted, setMounted] = useState(false);
  
  // Data States
  const [tasks, setTasks] = useState<WeddingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // UI Dialog States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WeddingTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<WeddingTask | null>(null);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "LOW" | "MEDIUM" | "HIGH" | "URGENT">("ALL");
  
  // Pagination
  const [taskPage, setTaskPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const ITEMS_PER_PAGE = 7;
  
  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- React Hook Form ---
  const taskForm = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      due_date: new Date().toISOString().split("T")[0],
      priority: "MEDIUM",
    }
  });

  // Load Tasks
  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const data = await getWeddingTasks();
      setTasks(data);
      
      // Keep page index bounded
      const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE) || 1;
      setTaskPage((prev) => Math.min(prev, totalPages));
    } catch (e: any) {
      console.error(e);
      setErrorMsg("Failed to retrieve wedding tasks.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  // Register Actions for Parent component (Header Button click support)
  useEffect(() => {
    if (registerActions) {
      registerActions({
        openAddTask: () => {
          setEditingTask(null);
          taskForm.reset({
            title: "",
            description: "",
            due_date: new Date().toISOString().split("T")[0],
            priority: "MEDIUM",
          });
          setIsTaskModalOpen(true);
        }
      });
    }
    return () => {
      if (registerActions) {
        registerActions(null);
      }
    };
  }, [registerActions]);

  // Reset page pagination on search/filter changes
  useEffect(() => {
    setTaskPage(1);
  }, [searchQuery, statusFilter, priorityFilter]);

  // --- Calculations & Business Logic ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "COMPLETED").length;
  const pendingTasks = tasks.filter(t => t.status === "PENDING").length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filter Tasks list
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Paginated tasks
  const totalTaskPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE) || 1;
  const displayedTasks = filteredTasks.slice(
    (taskPage - 1) * ITEMS_PER_PAGE,
    taskPage * ITEMS_PER_PAGE
  );

  // Helper to resolve today's date in local YYYY-MM-DD
  const getTodayDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const todayStr = getTodayDateString();

  // Upcoming Tasks: PENDING, due >= today AND due <= today + 7 days
  const upcomingTasks = tasks
    .filter(t => {
      if (t.status !== "PENDING") return false;
      const dueTime = new Date(t.due_date).getTime();
      const todayTime = new Date(todayStr).getTime();
      const limitTime = todayTime + 7 * 24 * 60 * 60 * 1000;
      return dueTime >= todayTime && dueTime <= limitTime;
    })
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const totalUpcomingPages = Math.ceil(upcomingTasks.length / 6) || 1;
  const currentUpcomingPage = Math.min(upcomingPage, totalUpcomingPages);
  const displayedUpcomingTasks = upcomingTasks.slice(
    (currentUpcomingPage - 1) * 6,
    currentUpcomingPage * 6
  );

  // Overdue Tasks: PENDING, due < today
  const overdueTasks = tasks
    .filter(t => {
      if (t.status !== "PENDING") return false;
      const dueTime = new Date(t.due_date).getTime();
      const todayTime = new Date(todayStr).getTime();
      return dueTime < todayTime;
    })
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  // Helper to calculate days difference for badges
  const getDaysLabel = (dueDate: string) => {
    const diffTime = new Date(dueDate).getTime() - new Date(todayStr).getTime();
    const diffDays = Math.ceil(diffTime / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  };

  // Helper for page number generation
  const getPageNumbers = (current: number, total: number) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | string)[] = [];
    pages.push(1);
    if (current > 3) pages.push("ellipsis-start");
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push("ellipsis-end");
    pages.push(total);
    return pages;
  };

  // --- Handlers ---

  // Add / Edit Form submit
  const onTaskSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    try {
      if (editingTask) {
        // Edit Mode
        const fields = {
          title: data.title,
          description: data.description || "",
          due_date: data.due_date,
          priority: data.priority,
        };

        if (isSupabaseConfigured) {
          const res = await updateTaskAction(editingTask.id, fields);
          if (!res.success) throw new Error(res.error);
        } else {
          await updateWeddingTask(editingTask.id, fields);
        }
        showToast("Task updated successfully!");
      } else {
        // Create Mode
        const newTaskFields = {
          title: data.title,
          description: data.description || "",
          due_date: data.due_date,
          priority: data.priority,
          status: "PENDING" as const,
        };

        if (isSupabaseConfigured) {
          const res = await createTaskAction(newTaskFields);
          if (!res.success) throw new Error(res.error);
        } else {
          await createWeddingTask(newTaskFields);
        }
        showToast("Task created successfully!");
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
      loadData();
    } catch (e: any) {
      showToast(e.message || "Failed to save task.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status: PENDING <-> COMPLETED (Optimistic Update)
  const handleToggleStatus = async (task: WeddingTask) => {
    const newStatus = task.status === "PENDING" ? "COMPLETED" : "PENDING";
    const originalTasks = [...tasks];
    
    // Optimistically update local array
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    
    try {
      if (isSupabaseConfigured) {
        const res = await updateTaskAction(task.id, { status: newStatus });
        if (!res.success) throw new Error(res.error);
      } else {
        await updateWeddingTask(task.id, { status: newStatus });
      }
      showToast(`Task marked as ${newStatus.toLowerCase()}!`);
    } catch (e: any) {
      // Rollback
      setTasks(originalTasks);
      showToast(e.message || "Failed to update task status.", "error");
    }
  };

  // Open Edit Dialog
  const handleEditClick = (task: WeddingTask) => {
    setEditingTask(task);
    taskForm.reset({
      title: task.title,
      description: task.description || "",
      due_date: task.due_date,
      priority: task.priority,
    });
    setIsTaskModalOpen(true);
  };

  // Optimistic Delete Task
  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    const targetTask = deletingTask;
    setDeletingTask(null);
    setIsSubmitting(true);
    
    const originalTasks = [...tasks];
    
    // Optimistic remove
    setTasks(prev => prev.filter(t => t.id !== targetTask.id));
    
    try {
      if (isSupabaseConfigured) {
        const res = await deleteTaskAction(targetTask.id);
        if (!res.success) throw new Error(res.error);
      } else {
        await deleteWeddingTask(targetTask.id);
      }
      showToast("Task deleted successfully!");
    } catch (e: any) {
      // Rollback
      setTasks(originalTasks);
      showToast(e.message || "Failed to delete task.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for priority badges
  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-50 text-red-700 border-red-200";
      case "HIGH":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "MEDIUM":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "LOW":
        return "bg-slate-50 text-slate-600 border-slate-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="space-y-8 font-sans text-slate-800 relative antialiased selection:bg-[#ffe088] selection:text-[#1f1b17] animate-fadeIn">
      {/* Loading overlay */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#d4af37] animate-spin"></div>
          </div>
          <p className="text-sm text-slate-500 font-medium tracking-wide">Retrieving wedding tasks checklist...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl max-w-xl mx-auto text-center mt-12 shadow-sm">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h3 className="font-serif text-lg text-slate-900 font-bold mb-1">Database Error</h3>
          <p className="text-sm text-slate-600 mb-4">{errorMsg}</p>
          <button
            onClick={loadData}
            className="px-5 py-2.5 bg-slate-900 text-white font-semibold text-xs rounded-lg uppercase tracking-wider hover:bg-slate-800 transition-colors"
          >
            Try Reloading
          </button>
        </div>
      ) : (
        <>
          {/* 1. Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Total Tasks */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Total Tasks</span>
                <span className="text-3xl font-serif font-bold text-slate-900 block mt-1">{totalTasks}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            {/* Card 2: Pending Tasks */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Pending Tasks</span>
                <span className="text-3xl font-serif font-bold text-amber-600 block mt-1">{pendingTasks}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <CircleDot className="h-5 w-5" />
              </div>
            </div>

            {/* Card 3: Completed Tasks */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Completed Tasks</span>
                <span className="text-3xl font-serif font-bold text-emerald-600 block mt-1">{completedTasks}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            {/* Card 4: Completion Percentage */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Completion %</span>
                <span className="text-xl font-serif font-bold text-slate-900 block">{completionPercentage}%</span>
              </div>
              <div className="mt-4">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#d4af37] h-full rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

          </div>

          {/* 2. Main content area: Task Ledger & Sidebars */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Task Ledger (Table + Filters) */}
            <div className="xl:col-span-8 space-y-6">
              
              {/* Ledger Container */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                
                {/* Filters & Search Toolbar */}
                <div className="p-6 border-b border-slate-100 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-lg text-slate-950 font-bold mb-1">
                        Task Checklist
                      </h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                        Prepare and manage your wedding timeline
                      </p>
                    </div>

                    {/* Search Field */}
                    <div className="relative w-full md:max-w-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ffe088] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Dropdown Filters */}
                  <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold select-none">
                      <Filter className="h-3.5 w-3.5 text-slate-400" />
                      Filters:
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Status</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#ffe088]"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending Only</option>
                        <option value="COMPLETED">Completed Only</option>
                      </select>
                    </div>

                    {/* Priority Filter */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Priority</span>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value as any)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#ffe088]"
                      >
                        <option value="ALL">All Priorities</option>
                        {PRIORITIES.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    {/* Reset Button */}
                    {(searchQuery || statusFilter !== "ALL" || priorityFilter !== "ALL") && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("ALL");
                          setPriorityFilter("ALL");
                        }}
                        className="text-[10px] text-[#735c00] hover:text-[#524100] font-bold uppercase tracking-wider underline cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Table list */}
                <div className="overflow-x-auto">
                  {filteredTasks.length === 0 ? (
                    <div className="py-20 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#f5ece5] text-slate-400 flex items-center justify-center mx-auto mb-4 border border-[#d0c5af]/30">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <h4 className="font-serif text-base font-bold text-slate-900 mb-1">No wedding tasks found.</h4>
                      <p className="text-xs text-slate-500 mb-6">Start by creating your first wedding task.</p>
                      <button
                        onClick={() => {
                          setEditingTask(null);
                          taskForm.reset({
                            title: "",
                            description: "",
                            due_date: new Date().toISOString().split("T")[0],
                            priority: "MEDIUM",
                          });
                          setIsTaskModalOpen(true);
                        }}
                        className="px-4 py-2 border border-slate-300 hover:border-slate-800 text-slate-700 hover:text-slate-900 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                      >
                        Create Task
                      </button>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold uppercase tracking-wider text-[9px] select-none">
                          <th className="px-6 py-3.5">Task</th>
                          <th className="px-6 py-3.5">Due Date</th>
                          <th className="px-6 py-3.5">Priority</th>
                          <th className="px-6 py-3.5">Status</th>
                          <th className="px-6 py-3.5 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayedTasks.map((t) => {
                          const isOverdue = t.status === "PENDING" && new Date(t.due_date).getTime() < new Date(todayStr).getTime();
                          return (
                            <tr key={t.id} className="hover:bg-slate-50/30 transition-colors group">
                              
                              {/* Title & Description */}
                              <td className="px-6 py-4 max-w-sm">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleToggleStatus(t)}
                                      className={`p-0.5 rounded-full transition-colors cursor-pointer border ${
                                        t.status === "COMPLETED" 
                                          ? "bg-emerald-500 border-emerald-500 text-white" 
                                          : "border-slate-300 text-transparent hover:border-slate-500 hover:text-slate-400"
                                      }`}
                                      title={t.status === "COMPLETED" ? "Mark Pending" : "Mark Completed"}
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <span className={`font-bold text-sm ${
                                      t.status === "COMPLETED" 
                                        ? "text-slate-400 line-through decoration-slate-300" 
                                        : "text-slate-950"
                                    }`}>
                                      {t.status === "COMPLETED" && "✓ "}
                                      {t.title}
                                    </span>
                                  </div>
                                  {t.description && (
                                    <p className={`text-xs pl-6 ${t.status === "COMPLETED" ? "text-slate-300" : "text-slate-500"}`}>
                                      {t.description}
                                    </p>
                                  )}
                                </div>
                              </td>

                              {/* Due Date */}
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 font-semibold ${isOverdue ? "text-red-600 font-bold" : "text-slate-500"}`}>
                                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                                  {new Date(t.due_date).toLocaleDateString("en-IN", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                  {isOverdue && (
                                    <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1">
                                      Overdue
                                    </span>
                                  )}
                                </span>
                              </td>

                              {/* Priority */}
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getPriorityBadgeStyle(t.priority)}`}>
                                  {t.priority}
                                </span>
                              </td>

                              {/* Status Badge */}
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  t.status === "COMPLETED" 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                    : "bg-slate-50 text-slate-500 border-slate-200"
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.status === "COMPLETED" ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                                  {t.status === "COMPLETED" ? "Completed" : "Pending"}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleEditClick(t)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded transition-colors cursor-pointer"
                                    title="Edit task"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeletingTask(t)}
                                    className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded transition-colors cursor-pointer"
                                    title="Delete task"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Pagination footer */}
                {filteredTasks.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 gap-4 select-none">
                    <span className="text-xs text-slate-500 font-medium">
                      Showing {filteredTasks.length > 0 ? (taskPage - 1) * ITEMS_PER_PAGE + 1 : 0}–{Math.min(taskPage * ITEMS_PER_PAGE, filteredTasks.length)} of {filteredTasks.length} tasks
                    </span>

                    {totalTaskPages > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setTaskPage(prev => Math.max(prev - 1, 1))}
                          disabled={taskPage === 1}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-50 disabled:hover:border-slate-200 transition-all cursor-pointer shadow-sm disabled:cursor-default"
                        >
                          <ChevronLeft className="h-4 w-4 text-slate-600" />
                        </button>

                        {getPageNumbers(taskPage, totalTaskPages).map((p, idx) => {
                          if (p === "ellipsis-start" || p === "ellipsis-end") {
                            return (
                              <span key={`ell-${idx}`} className="px-2 text-xs text-slate-400 font-bold">
                                ...
                              </span>
                            );
                          }
                          return (
                            <button
                              key={p}
                              onClick={() => setTaskPage(p as number)}
                              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                taskPage === p
                                  ? "bg-slate-900 text-white shadow-sm"
                                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => setTaskPage(prev => Math.min(prev + 1, totalTaskPages))}
                          disabled={taskPage === totalTaskPages}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-50 disabled:hover:border-slate-200 transition-all cursor-pointer shadow-sm disabled:cursor-default"
                        >
                          <ChevronRight className="h-4 w-4 text-slate-600" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Right Column: Deadlines & Upcoming sidebar (Right 4 cols) */}
            <div className="xl:col-span-4 space-y-6">
              
              {/* Overdue Section */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="font-serif text-base font-bold text-slate-950">Overdue Tasks</h3>
                </div>
                
                <div className="pt-4 space-y-3.5">
                  {overdueTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No overdue items. Excellent work!</p>
                  ) : (
                    overdueTasks.map(t => (
                      <div key={t.id} className="p-3 bg-red-50/50 border border-red-100 rounded-xl space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-red-950 leading-snug">{t.title}</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${getPriorityBadgeStyle(t.priority)}`}>
                            {t.priority}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-red-700 font-semibold pt-1">
                          <span>Due: {new Date(t.due_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Upcoming Section */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100 text-[#d4af37]">
                  <Clock className="h-5 w-5" />
                  <h3 className="font-serif text-base font-bold text-slate-950">Upcoming (Next 7 Days)</h3>
                </div>

                <div className="pt-4">
                  {displayedUpcomingTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No tasks due within the next 7 days.</p>
                  ) : (
                    <>
                      <div className="space-y-3.5">
                        {displayedUpcomingTasks.map(t => (
                          <div key={t.id} className="p-3 bg-[#fffcf9] border border-amber-100/50 rounded-xl space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-xs text-slate-800 leading-snug">{t.title}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${getPriorityBadgeStyle(t.priority)}`}>
                                {t.priority}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pt-1">
                              <span>Due: {new Date(t.due_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                              <span className="text-[#a6861c] font-bold">{getDaysLabel(t.due_date)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {totalUpcomingPages > 1 && (
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 select-none">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-semibold">
                            Page {currentUpcomingPage} of {totalUpcomingPages}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setUpcomingPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentUpcomingPage === 1}
                              className="p-1 rounded-md border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-50 disabled:hover:border-slate-200 transition-all cursor-pointer shadow-sm disabled:cursor-default"
                              title="Previous Page"
                            >
                              <ChevronLeft className="h-3.5 w-3.5 text-slate-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setUpcomingPage(prev => Math.min(prev + 1, totalUpcomingPages))}
                              disabled={currentUpcomingPage === totalUpcomingPages}
                              className="p-1 rounded-md border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-50 disabled:hover:border-slate-200 transition-all cursor-pointer shadow-sm disabled:cursor-default"
                              title="Next Page"
                            >
                              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

            </div>

          </div>
        </>
      )}

      {/* ── MODAL: CREATE / UPDATE TASK ── */}
      {isTaskModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto py-8 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] my-auto">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#d4af37] z-10"></div>

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-serif text-lg text-slate-950 font-bold">
                {editingTask ? "Modify Preparation Task" : "Add Wedding Task"}
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="flex-1 flex flex-col overflow-hidden">
              
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 styled-scrollbar">
                
                {/* Task Title */}
                <div>
                  <label htmlFor="title" className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                    Task Title / Activity Description
                  </label>
                  <input
                    id="title"
                    type="text"
                    placeholder="e.g. Book Makeup Artist"
                    {...taskForm.register("title")}
                    className={`block w-full px-4 py-2.5 bg-[#fff8f4] border ${
                      taskForm.formState.errors.title ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-[#ffe088]"
                    } rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 transition-all`}
                  />
                  {taskForm.formState.errors.title && (
                    <p className="text-red-600 text-[10px] font-semibold mt-1">
                      {taskForm.formState.errors.title.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    placeholder="Provide context, address, contact persons, or specific instructions for this activity..."
                    {...taskForm.register("description")}
                    className="block w-full px-4 py-2.5 bg-[#fff8f4] border border-slate-200 focus:ring-[#ffe088] rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 transition-all resize-none"
                  />
                </div>

                {/* Due Date & Priority Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="due_date" className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                      Target Due Date
                    </label>
                    <input
                      id="due_date"
                      type="date"
                      {...taskForm.register("due_date")}
                      className={`block w-full px-4 py-2.5 bg-[#fff8f4] border ${
                        taskForm.formState.errors.due_date ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-[#ffe088]"
                      } rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 transition-all`}
                    />
                    {taskForm.formState.errors.due_date && (
                      <p className="text-red-600 text-[10px] font-semibold mt-1">
                        {taskForm.formState.errors.due_date.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                      Task Priority
                    </label>
                    <select
                      id="priority"
                      {...taskForm.register("priority")}
                      className="block w-full px-3 py-2.5 bg-[#fff8f4] border border-slate-200 focus:ring-[#ffe088] rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 transition-all"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Sticky Action Footer */}
              <div className="p-6 border-t border-slate-100 flex items-center gap-3 shrink-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md inline-flex items-center justify-center cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : editingTask ? (
                    "Save Changes"
                  ) : (
                    "Add Task"
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: CONFIRM DELETE TASK ── */}
      {deletingTask && createPortal(
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto py-8 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm shadow-2xl relative overflow-hidden p-6 text-center my-auto">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 className="h-5 w-5" />
            </div>
            
            <h3 className="font-serif text-base font-bold text-slate-950 mb-2">Delete Task Record</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Are you sure you want to delete this task? <br/>
              <strong className="text-slate-900">"{deletingTask.title}"</strong>
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeletingTask(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-sm cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Toast Overlay ── */}
      {toast && createPortal(
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3.5 rounded-2xl shadow-xl border transition-all duration-300 animate-fadeIn ${
          toast.type === "success" 
            ? "bg-slate-900 border-[#d4af37] text-white" 
            : "bg-red-950 border-red-800 text-white"
        }`}>
          {toast.type === "success" ? (
            <Check className="h-4 w-4 text-[#d4af37]" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
          <span className="text-[10px] font-bold tracking-wider uppercase">{toast.message}</span>
        </div>,
        document.body
      )}

    </div>
  );
}
