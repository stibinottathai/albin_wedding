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
  IndianRupee, 
  Wallet,
  TrendingUp,
  CircleDot,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { 
  getWeddingBudget, 
  createWeddingBudget, 
  updateWeddingBudget, 
  getExpenses, 
  createExpense, 
  updateExpense, 
  deleteExpense,
  expenseCategories,
  WeddingBudget,
  Expense
} from "../lib/budget-db";
import { isSupabaseConfigured } from "../lib/supabase";
import { formatCurrency } from "../lib/utils";
import {
  createBudgetAction,
  updateBudgetAction,
  addExpenseAction,
  updateExpenseAction,
  deleteExpenseAction
} from "../app/actions/budget-actions";

// --- Form Validation Schemas ---
const budgetSchema = z.object({
  totalBudget: z.coerce
    .number({ message: "Budget must be a number" })
    .positive("Budget must be greater than 0"),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

const expenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce
    .number({ message: "Amount must be a number" })
    .positive("Amount must be greater than 0"),
  expenseDate: z.string().min(1, "Expense date is required"),
  notes: z.string().optional(),
  isAdvance: z.boolean().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

// Pie chart color palette matching the premium wedding theme
const CATEGORY_COLORS: Record<string, string> = {
  "Venue": "#8d795b", // Sage dark / gold accent
  "Catering": "#ba1a1a", // Terracotta
  "Photography & Videography": "#7a5642", // Dusty rose
  "Decoration": "#ba9332", // Medium gold
  "Bridal & Groom Dress": "#e0b84c", // Light warm gold
  "Makeup": "#cca662", // Soft gold
  "Jewellery": "#ad8845", // Deep gold/bronze
  "Transportation": "#5c6b73", // Slate grey
  "Music & Entertainment": "#8a3c26", // Crimson earth
  "Miscellaneous": "#4b4635" // Dark charcoal-brown
};

const DEFAULT_COLOR = "#b3b3b3";

export interface BudgetTrackerActions {
  openAddExpense: () => void;
  openUpdateBudget: () => void;
}

interface BudgetTrackerTabProps {
  registerActions?: (actions: BudgetTrackerActions | null) => void;
}

export default function BudgetTrackerTab({ registerActions }: BudgetTrackerTabProps) {
  // Mounted state for Recharts to avoid SSR hydration mismatches
  const [mounted, setMounted] = useState(false);
  
  // Data States
  const [budget, setBudget] = useState<WeddingBudget | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // UI Dialog / Modal States
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  
  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Pagination states
  const [expensePage, setExpensePage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  // Helper to generate premium page numbers with ellipsis
  const getPageNumbers = (current: number, total: number) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | string)[] = [];
    pages.push(1);
    if (current > 3) {
      pages.push("ellipsis-start");
    }
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (current < total - 2) {
      pages.push("ellipsis-end");
    }
    pages.push(total);
    return pages;
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- React Hook Form Initializations ---
  const budgetForm = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema) as any,
    defaultValues: {
      totalBudget: 0,
    }
  });

  const expenseForm = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      title: "",
      category: "",
      amount: 0,
      expenseDate: new Date().toISOString().split("T")[0],
      notes: "",
      isAdvance: false,
    }
  });

  // Load Budget and Expenses
  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const budgetData = await getWeddingBudget();
      setBudget(budgetData);
      
      if (budgetData) {
        const expensesData = await getExpenses(budgetData.id);
        setExpenses(expensesData);
        // Pre-fill budget input if budget exists
        budgetForm.setValue("totalBudget", budgetData.total_budget);
        
        // Adjust pagination page if it overshoots
        const totalPages = Math.ceil(expensesData.length / ITEMS_PER_PAGE) || 1;
        setExpensePage((prev) => Math.min(prev, totalPages));
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg("Failed to load budget tracking data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  useEffect(() => {
    if (registerActions) {
      if (budget) {
        registerActions({
          openAddExpense: () => {
            setEditingExpense(null);
            expenseForm.reset({
              title: "",
              category: expenseCategories[0],
              amount: 0,
              expenseDate: new Date().toISOString().split("T")[0],
              notes: "",
              isAdvance: false,
            });
            setIsExpenseModalOpen(true);
          },
          openUpdateBudget: () => {
            setIsBudgetModalOpen(true);
          }
        });
      } else {
        registerActions(null);
      }
    }
    return () => {
      if (registerActions) {
        registerActions(null);
      }
    };
  }, [registerActions, budget]);

  const watchedTitle = expenseForm.watch("title");

  useEffect(() => {
    if (!watchedTitle || editingExpense) return;
    
    const titleLower = watchedTitle.toLowerCase();
    
    let predictedCategory = "";
    if (titleLower.includes("venue") || titleLower.includes("hall") || titleLower.includes("resort") || titleLower.includes("hotel") || titleLower.includes("lawn") || titleLower.includes("stage")) {
      predictedCategory = "Venue";
    } else if (titleLower.includes("cater") || titleLower.includes("food") || titleLower.includes("buffet") || titleLower.includes("dinner") || titleLower.includes("lunch") || titleLower.includes("sweet") || titleLower.includes("cake") || titleLower.includes("drink") || titleLower.includes("coke") || titleLower.includes("snack") || titleLower.includes("biryani")) {
      predictedCategory = "Catering";
    } else if (titleLower.includes("photo") || titleLower.includes("video") || titleLower.includes("shoot") || titleLower.includes("album") || titleLower.includes("camera") || titleLower.includes("cinem") || titleLower.includes("photograph")) {
      predictedCategory = "Photography & Videography";
    } else if (titleLower.includes("decor") || titleLower.includes("flower") || titleLower.includes("light") || titleLower.includes("balloon") || titleLower.includes("theme") || titleLower.includes("mandap") || titleLower.includes("carpet") || titleLower.includes("flex")) {
      predictedCategory = "Decoration";
    } else if (titleLower.includes("dress") || titleLower.includes("groom") || titleLower.includes("bride") || titleLower.includes("suit") || titleLower.includes("sherwani") || titleLower.includes("gown") || titleLower.includes("saree") || titleLower.includes("lehenga") || titleLower.includes("tux") || titleLower.includes("wear") || titleLower.includes("clothing") || titleLower.includes("tailor")) {
      predictedCategory = "Bridal & Groom Dress";
    } else if (titleLower.includes("makeup") || titleLower.includes("parlour") || titleLower.includes("salon") || titleLower.includes("hair") || titleLower.includes("grooming") || titleLower.includes("stylist") || titleLower.includes("cosmetic") || titleLower.includes("beauty")) {
      predictedCategory = "Makeup";
    } else if (titleLower.includes("jewel") || titleLower.includes("ring") || titleLower.includes("gold") || titleLower.includes("necklace") || titleLower.includes("bangle") || titleLower.includes("diamond") || titleLower.includes("silver") || titleLower.includes("ornament")) {
      predictedCategory = "Jewellery";
    } else if (titleLower.includes("transport") || titleLower.includes("car") || titleLower.includes("cab") || titleLower.includes("bus") || titleLower.includes("travel") || titleLower.includes("flight") || titleLower.includes("ticket") || titleLower.includes("vehicle") || titleLower.includes("rent") || titleLower.includes("driver")) {
      predictedCategory = "Transportation";
    } else if (titleLower.includes("music") || titleLower.includes("dj") || titleLower.includes("sound") || titleLower.includes("band") || titleLower.includes("singer") || titleLower.includes("dance") || titleLower.includes("choreograph") || titleLower.includes("mic") || titleLower.includes("artist") || titleLower.includes("orchestra") || titleLower.includes("instrument")) {
      predictedCategory = "Music & Entertainment";
    }
    
    if (predictedCategory) {
      expenseForm.setValue("category", predictedCategory);
    }
  }, [watchedTitle, editingExpense, expenseForm]);

  // --- Calculations ---
  const totalBudget = budget ? Number(budget.total_budget) : 0;
  const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const remainingBudget = totalBudget - totalSpent;
  const usagePercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  // Pagination calculations
  const totalExpensePages = Math.ceil(expenses.length / ITEMS_PER_PAGE) || 1;
  const displayedExpenses = expenses.slice(
    (expensePage - 1) * ITEMS_PER_PAGE,
    expensePage * ITEMS_PER_PAGE
  );

  // Group spent amount by category
  const categoryAnalytics = expenseCategories.map(cat => {
    const total = expenses
      .filter(exp => exp.category === cat)
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
    return {
      category: cat,
      amount: total
    };
  }).filter(item => item.amount > 0); // only show categories with expenses

  // Sort by spent amount descending
  categoryAnalytics.sort((a, b) => b.amount - a.amount);

  // Recharts Chart Data format
  const chartData = categoryAnalytics.map(item => ({
    name: item.category,
    value: item.amount,
  }));

  // --- Handlers ---
  
  // Create / Update Budget
  const onBudgetSubmit = async (data: BudgetFormData) => {
    setIsSubmitting(true);
    try {
      if (budget) {
        // Update Budget
        let updated: WeddingBudget;
        if (isSupabaseConfigured) {
          const res = await updateBudgetAction(budget.id, data.totalBudget);
          if (!res.success) throw new Error(res.error);
          updated = res.data as WeddingBudget;
        } else {
          updated = await updateWeddingBudget(budget.id, data.totalBudget);
        }
        setBudget(updated);
        showToast("Wedding budget updated successfully!");
      } else {
        // Create Budget
        let newBudget: WeddingBudget;
        if (isSupabaseConfigured) {
          const res = await createBudgetAction(data.totalBudget);
          if (!res.success) throw new Error(res.error);
          newBudget = res.data as WeddingBudget;
        } else {
          newBudget = await createWeddingBudget(data.totalBudget);
        }
        setBudget(newBudget);
        showToast("Wedding budget created successfully!");
      }
      setIsBudgetModalOpen(false);
      // Reload expenses for the new budget ID
      if (budget === null) {
        loadData();
      }
    } catch (e: any) {
      showToast(e.message || "Failed to save budget settings.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add / Edit Expense
  const onExpenseSubmit = async (data: ExpenseFormData) => {
    if (!budget) return;
    setIsSubmitting(true);
    try {
      const notesValue = data.notes || "";
      if (editingExpense) {
        // Edit Mode
        const updatedFields = {
          title: data.title,
          category: data.category,
          amount: data.amount,
          expense_date: data.expenseDate,
          notes: notesValue,
        };

        if (isSupabaseConfigured) {
          const res = await updateExpenseAction(editingExpense.id, updatedFields);
          if (!res.success) throw new Error(res.error);
        } else {
          await updateExpense(editingExpense.id, {
            title: data.title,
            category: data.category,
            amount: data.amount,
            expense_date: data.expenseDate,
            notes: notesValue,
          });
        }
        
        showToast("Expense updated successfully!");
      } else {
        // Add Mode
        const newExpenseData = {
          budget_id: budget.id,
          title: data.title,
          category: data.category,
          amount: data.amount,
          expense_date: data.expenseDate,
          notes: notesValue,
        };

        if (isSupabaseConfigured) {
          const res = await addExpenseAction(newExpenseData);
          if (!res.success) throw new Error(res.error);
        } else {
          await createExpense(newExpenseData);
        }
        showToast("Expense recorded successfully!");
      }
      
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
      expenseForm.reset({
        title: "",
        category: "",
        amount: 0,
        expenseDate: new Date().toISOString().split("T")[0],
        notes: "",
        isAdvance: false,
      });
      loadData();
    } catch (e: any) {
      showToast(e.message || "Failed to record expense.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Expense Modal
  const handleEditExpenseClick = (exp: Expense) => {
    setEditingExpense(exp);
    const hasAdvanceTag = exp.notes?.startsWith("[Advance]") || false;
    const cleanNotes = hasAdvanceTag ? exp.notes?.substring("[Advance]".length) : exp.notes;

    expenseForm.reset({
      title: exp.title,
      category: exp.category,
      amount: exp.amount,
      expenseDate: exp.expense_date,
      notes: cleanNotes || "",
      isAdvance: hasAdvanceTag,
    });
    setIsExpenseModalOpen(true);
  };

  // Confirm Delete Expense
  const handleDeleteExpenseConfirm = async () => {
    if (!deletingExpense) return;
    const targetExpense = deletingExpense;
    
    // Close modal immediately so the UI is responsive
    setDeletingExpense(null);
    setIsSubmitting(true);
    
    // Save original state for potential rollback
    const originalExpenses = [...expenses];
    
    // Optimistically remove the expense from local list
    setExpenses((prev) => prev.filter((e) => e.id !== targetExpense.id));
    
    try {
      if (isSupabaseConfigured) {
        const res = await deleteExpenseAction(targetExpense.id);
        if (!res.success) throw new Error(res.error);
      } else {
        await deleteExpense(targetExpense.id);
      }
      showToast("Expense deleted successfully!");
    } catch (e: any) {
      // Rollback on error
      setExpenses(originalExpenses);
      showToast(e.message || "Failed to delete expense.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-slate-800 relative antialiased selection:bg-[#ffe088] selection:text-[#1f1b17] animate-fadeIn">
      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#d4af37] animate-spin"></div>
          </div>
          <p className="text-sm text-slate-500 font-medium tracking-wide">Retrieving budget worksheets...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl max-w-xl mx-auto text-center mt-12 shadow-sm">
          <Info className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h3 className="font-serif text-lg text-slate-900 font-bold mb-1">Database Error</h3>
          <p className="text-sm text-slate-600 mb-4">{errorMsg}</p>
          <button
            onClick={loadData}
            className="px-5 py-2.5 bg-slate-900 text-white font-semibold text-xs rounded-lg uppercase tracking-wider hover:bg-slate-800 transition-colors"
          >
            Try Reloading
          </button>
        </div>
      ) : !budget ? (
        /* Empty Budget State */
        <div className="max-w-xl mx-auto mt-12 bg-white rounded-3xl border border-[#d0c5af] p-8 md:p-12 text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#d4af37]"></div>
          <div className="w-16 h-16 rounded-full bg-[#f5ece5] text-[#735c00] flex items-center justify-center mx-auto mb-6 border border-[#d0c5af]/50">
            <Wallet className="h-7 w-7" />
          </div>
          <h2 className="font-serif text-2xl text-slate-950 font-semibold mb-2">No wedding budget found.</h2>
          <p className="text-sm text-[#4d4635] leading-relaxed mb-8">
            A comprehensive budget worksheet helps keep your celebrations organized and stress-free. Set up your total planning budget to start listing venue deposits, catering fees, and apparel expenses.
          </p>
          <button
            onClick={() => {
              budgetForm.setValue("totalBudget", 1000000); // 10 Lakhs default suggestion
              setIsBudgetModalOpen(true);
            }}
            className="px-6 py-3 bg-slate-900 text-white font-bold text-xs rounded-xl uppercase tracking-wider hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all shadow-md"
          >
            Create Budget Worksheet
          </button>
        </div>
      ) : (
        /* Active Budget Dashboard */
        <div className="space-y-8">
          
          {/* Dashboard Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
            <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
              Use this dashboard to monitor your overall wedding budget, categorize expenditures, and track individual deposits or payments.
            </p>
            {!registerActions && (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => {
                    setEditingExpense(null);
                    expenseForm.reset({
                      title: "",
                      category: expenseCategories[0],
                      amount: 0,
                      expenseDate: new Date().toISOString().split("T")[0],
                      notes: "",
                    });
                    setIsExpenseModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs tracking-wider uppercase rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Expense
                </button>
                <button
                  onClick={() => setIsBudgetModalOpen(true)}
                  className="px-4 py-2 border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-slate-950 font-semibold text-xs tracking-wider uppercase rounded-lg transition-all shrink-0 cursor-pointer"
                >
                  Update Budget Limit
                </button>
              </div>
            )}
          </div>

          {/* 1. Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Total Budget */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                  Total Budget
                </span>
                <span className="font-serif text-2xl font-bold text-slate-950 leading-none">
                  {formatCurrency(totalBudget)}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-[#735c00] flex items-center justify-center shrink-0">
                <Wallet className="h-6 w-6 text-[#d4af37]" />
              </div>
            </div>

            {/* Card 2: Total Spent */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                  Total Spent
                </span>
                <span className="font-serif text-2xl font-bold text-slate-950 leading-none">
                  {formatCurrency(totalSpent)}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 text-red-700 flex items-center justify-center shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>

            {/* Card 3: Remaining Budget */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                  Remaining Budget
                </span>
                <span className={`font-serif text-2xl font-bold leading-none ${
                  remainingBudget < 0 ? "text-red-600" : "text-emerald-700"
                }`}>
                  {formatCurrency(remainingBudget)}
                </span>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                remainingBudget < 0 
                  ? "bg-red-50 border-red-100 text-red-600" 
                  : "bg-emerald-50 border-emerald-100 text-emerald-700"
              }`}>
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>

            {/* Card 4: Budget Usage */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Utilization
                </span>
                <span className="text-xs font-bold font-serif px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  {usagePercentage.toFixed(0)}%
                </span>
              </div>
              <div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      usagePercentage > 90 ? "bg-red-600" : usagePercentage > 75 ? "bg-[#d4af37]" : "bg-emerald-600"
                    }`}
                    style={{ width: `${usagePercentage}%` }}
                  ></div>
                </div>
                <span className="text-[9px] text-slate-400 font-medium tracking-wide mt-1.5 block">
                  {remainingBudget < 0 
                    ? `Over budget by ${formatCurrency(Math.abs(remainingBudget))}`
                    : `${usagePercentage.toFixed(0)}% of funds deployed`}
                </span>
              </div>
            </div>

          </div>

          {/* 2. Charts & Category Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Pie Chart Card (Left 5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
              <div>
                <h3 className="font-serif text-base text-slate-900 font-bold mb-1">
                  Spending by Category
                </h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-4">
                  Visual budget distribution
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                {expenses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <CircleDot className="h-5 w-5 animate-pulse" />
                    </div>
                    <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">No data recorded</p>
                  </div>
                ) : mounted ? (
                  <div className="w-full h-56 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={CATEGORY_COLORS[entry.name] || DEFAULT_COLOR} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => formatCurrency(Number(value))}
                          contentStyle={{ 
                            background: '#0f172a', 
                            border: 'none', 
                            borderRadius: '8px', 
                            color: '#fff', 
                            fontSize: '11px',
                            fontWeight: '600'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                      <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400 block mb-0.5">Total Spent</span>
                      <span className="font-serif text-base font-bold text-slate-950">{formatCurrency(totalSpent)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-56"></div>
                )}
              </div>
            </div>

            {/* Category Breakdown Table (Right 7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-base text-slate-900 font-bold mb-1">
                  Category Allocation
                </h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-4">
                  Spent per wedding sector
                </p>
                
                {expenses.length === 0 ? (
                  <div className="py-20 text-center">
                    <Info className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">Record expenses to see category breakdowns.</p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto styled-scrollbar pr-2">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#f5ece5] text-slate-400 font-semibold uppercase tracking-wider text-[9px] pb-2">
                          <th className="py-2 font-medium">Category</th>
                          <th className="py-2 font-medium text-right">Total Spent</th>
                          <th className="py-2 font-medium text-right pr-2">Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {categoryAnalytics.map((item, idx) => {
                          const pct = totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0;
                          const catColor = CATEGORY_COLORS[item.category] || DEFAULT_COLOR;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-2.5 flex items-center gap-2 font-medium text-slate-850">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: catColor }}></span>
                                {item.category}
                              </td>
                              <td className="py-2.5 text-right font-serif font-bold text-slate-950">
                                {formatCurrency(item.amount)}
                              </td>
                              <td className="py-2.5 text-right font-medium text-slate-500 pr-2">
                                {pct.toFixed(0)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-[#f5ece5] flex justify-between items-center text-xs font-semibold text-slate-600">
                <span>Tracked Categories: {categoryAnalytics.length}</span>
                <span className="text-slate-900 font-serif font-bold">{formatCurrency(totalSpent)}</span>
              </div>
            </div>

          </div>

          {/* 3. Expense Ledger (Data Table) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Ledger Header */}
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-serif text-lg text-slate-950 font-bold mb-1">
                Expense Ledger
              </h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                Itemized list of wedding payments
              </p>
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              {expenses.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#f5ece5] text-slate-400 flex items-center justify-center mx-auto mb-4 border border-[#d0c5af]/30">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <h4 className="font-serif text-base font-bold text-slate-900 mb-1">No expenses recorded yet.</h4>
                  <p className="text-xs text-slate-500 mb-6">Add your first expense to begin managing your worksheet.</p>
                  <button
                    onClick={() => {
                      setEditingExpense(null);
                      expenseForm.reset({
                        title: "",
                        category: expenseCategories[0],
                        amount: 0,
                        expenseDate: new Date().toISOString().split("T")[0],
                        notes: "",
                      });
                      setIsExpenseModalOpen(true);
                    }}
                    className="px-4 py-2 border border-slate-300 hover:border-slate-800 text-slate-700 hover:text-slate-900 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    Record First Expense
                  </button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold uppercase tracking-wider text-[9px] select-none">
                      <th className="px-6 py-3.5">Expense Item</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5 text-right">Amount</th>
                      <th className="px-6 py-3.5">Payment Date</th>
                      <th className="px-6 py-3.5 hidden md:table-cell">Notes</th>
                      <th className="px-6 py-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/30 transition-colors group">
                        {/* Title */}
                        <td className="px-6 py-4 font-bold text-slate-950 text-sm">
                          <div className="flex flex-col sm:flex-row sm:items-start md:items-center gap-2">
                            <span>{exp.title}</span>
                            {exp.notes?.startsWith("[Advance]") && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider shrink-0 select-none">
                                Advance
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Category */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border bg-slate-50 text-[#735c00] border-slate-200 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[exp.category] || DEFAULT_COLOR }}></span>
                            {exp.category}
                          </span>
                        </td>
                        {/* Amount */}
                        <td className="px-6 py-4 text-right font-serif font-bold text-sm text-slate-900">
                          {formatCurrency(Number(exp.amount))}
                        </td>
                        {/* Date */}
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {new Date(exp.expense_date).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </td>
                        {/* Notes */}
                        <td className="px-6 py-4 text-slate-500 font-medium hidden md:table-cell max-w-xs truncate">
                          {exp.notes?.startsWith("[Advance]") 
                            ? (exp.notes.substring("[Advance]".length) || <span className="italic text-slate-300">—</span>) 
                            : (exp.notes || <span className="italic text-slate-300">—</span>)}
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditExpenseClick(exp)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded transition-colors cursor-pointer"
                              title="Edit expense"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingExpense(exp)}
                              className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded transition-colors cursor-pointer"
                              title="Delete expense"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {expenses.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 gap-4 select-none">
                <span className="text-xs text-slate-500 font-medium">
                  Showing {expenses.length > 0 ? (expensePage - 1) * ITEMS_PER_PAGE + 1 : 0}–{Math.min(expensePage * ITEMS_PER_PAGE, expenses.length)} of {expenses.length} payments
                </span>
                
                {totalExpensePages > 1 && (
                  <div className="flex items-center gap-1.5">
                    {/* Previous Button */}
                    <button
                      onClick={() => setExpensePage((prev) => Math.max(prev - 1, 1))}
                      disabled={expensePage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-50 disabled:hover:border-slate-200 transition-all cursor-pointer shadow-sm disabled:cursor-default"
                      title="Previous Page"
                    >
                      <ChevronLeft className="h-4 w-4 text-slate-600" />
                    </button>

                    {/* Page Numbers */}
                    {getPageNumbers(expensePage, totalExpensePages).map((p, idx) => {
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
                          onClick={() => setExpensePage(p as number)}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            expensePage === p
                              ? "bg-slate-900 text-white shadow-sm"
                              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    {/* Next Button */}
                    <button
                      onClick={() => setExpensePage((prev) => Math.min(prev + 1, totalExpensePages))}
                      disabled={expensePage === totalExpensePages}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-50 disabled:hover:border-slate-200 transition-all cursor-pointer shadow-sm disabled:cursor-default"
                      title="Next Page"
                    >
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* ── MODAL: CREATE / UPDATE BUDGET ── */}
      {isBudgetModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto py-8 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md shadow-2xl relative overflow-hidden my-auto">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#d4af37]"></div>
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-serif text-lg text-slate-950 font-bold">
                {budget ? "Update Budget Settings" : "Configure Wedding Budget"}
              </h3>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={budgetForm.handleSubmit(onBudgetSubmit)} className="p-6 space-y-6">
              <div>
                <label htmlFor="totalBudget" className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">
                  Total Budget Limit (INR ₹)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">
                    ₹
                  </div>
                  <input
                    id="totalBudget"
                    type="number"
                    step="any"
                    placeholder="e.g. 1000000"
                    {...budgetForm.register("totalBudget")}
                    className={`block w-full pl-8 pr-4 py-3 bg-[#fff8f4] border ${
                      budgetForm.formState.errors.totalBudget ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-[#ffe088]"
                    } rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 transition-all`}
                  />
                </div>
                {budgetForm.formState.errors.totalBudget && (
                  <p className="text-red-600 text-[11px] font-semibold mt-1">
                    {budgetForm.formState.errors.totalBudget.message}
                  </p>
                )}
                <span className="text-[10px] text-slate-400 block mt-2 leading-relaxed">
                  Provide the total targeted budget amount for the wedding. Suggested limit: ₹10,00,000.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md inline-flex items-center justify-center cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : budget ? (
                    "Save Changes"
                  ) : (
                    "Initialize Budget"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: ADD / EDIT EXPENSE ── */}
      {isExpenseModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto py-8 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] my-auto">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#d4af37] z-10"></div>

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-serif text-lg text-slate-950 font-bold">
                {editingExpense ? "Modify Expense Record" : "Record Wedding Expense"}
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="flex-1 flex flex-col overflow-hidden">
              
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 styled-scrollbar">
                
                {/* Row 1: Title */}
                <div>
                  <label htmlFor="title" className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                    Expense Description / Item Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    placeholder="e.g. Venue Booking Advance Payment"
                    {...expenseForm.register("title")}
                    className={`block w-full px-4 py-2.5 bg-[#fff8f4] border ${
                      expenseForm.formState.errors.title ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-[#ffe088]"
                    } rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 transition-all`}
                  />
                  {expenseForm.formState.errors.title && (
                    <p className="text-red-600 text-[10px] font-semibold mt-1">
                      {expenseForm.formState.errors.title.message}
                    </p>
                  )}
                </div>

                {/* Row 2: Category & Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                      Expense Category
                    </label>
                    <select
                      id="category"
                      {...expenseForm.register("category")}
                      className={`block w-full px-3 py-2.5 bg-[#fff8f4] border ${
                        expenseForm.formState.errors.category ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-[#ffe088]"
                      } rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 transition-all`}
                    >
                      <option value="">Choose category...</option>
                      {expenseCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {expenseForm.formState.errors.category && (
                      <p className="text-red-600 text-[10px] font-semibold mt-1">
                        {expenseForm.formState.errors.category.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="amount" className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                      Amount Paid (INR ₹)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                        ₹
                      </div>
                      <input
                        id="amount"
                        type="number"
                        step="any"
                        placeholder="e.g. 300000"
                        {...expenseForm.register("amount")}
                        className={`block w-full pl-7 pr-4 py-2.5 bg-[#fff8f4] border ${
                          expenseForm.formState.errors.amount ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-[#ffe088]"
                        } rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 transition-all`}
                      />
                    </div>
                    {expenseForm.formState.errors.amount && (
                      <p className="text-red-600 text-[10px] font-semibold mt-1">
                        {expenseForm.formState.errors.amount.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 3: Expense Date */}
                <div>
                  <label htmlFor="expenseDate" className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                    Payment Date
                  </label>
                  <input
                    id="expenseDate"
                    type="date"
                    {...expenseForm.register("expenseDate")}
                    className={`block w-full px-4 py-2.5 bg-[#fff8f4] border ${
                      expenseForm.formState.errors.expenseDate ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-[#ffe088]"
                    } rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 transition-all`}
                  />
                  {expenseForm.formState.errors.expenseDate && (
                    <p className="text-red-600 text-[10px] font-semibold mt-1">
                      {expenseForm.formState.errors.expenseDate.message}
                    </p>
                  )}
                </div>


                {/* Row 4: Notes (Optional) */}
                <div>
                  <label htmlFor="notes" className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="Include transaction IDs, payment receiver details, or balance payment schedules..."
                    {...expenseForm.register("notes")}
                    className="block w-full px-4 py-2.5 bg-[#fff8f4] border border-slate-200 focus:ring-[#ffe088] rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 transition-all resize-none"
                  />
                </div>

              </div>

              {/* Sticky Action Footer */}
              <div className="p-6 border-t border-slate-100 flex items-center gap-3 shrink-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
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
                  ) : editingExpense ? (
                    "Update Record"
                  ) : (
                    "Save Expense"
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: CONFIRM DELETE EXPENSE ── */}
      {deletingExpense && createPortal(
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto py-8 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm shadow-2xl relative overflow-hidden p-6 text-center my-auto">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 className="h-5 w-5" />
            </div>
            
            <h3 className="font-serif text-base font-bold text-slate-950 mb-2">Delete Expense Record</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Are you sure you want to delete this expense? <br/>
              <strong className="text-slate-900">"{deletingExpense.title}"</strong> ({formatCurrency(Number(deletingExpense.amount))})
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeletingExpense(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteExpenseConfirm}
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
