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
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  AlertCircle,
  Phone,
  User,
  Mail,
  Wallet,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Tag
} from "lucide-react";
import { 
  getWeddingVendors, 
  createWeddingVendor, 
  updateWeddingVendor, 
  deleteWeddingVendor,
  Vendor,
  VENDOR_CATEGORIES,
  VENDOR_SERVICES_STRUCTURE
} from "../lib/vendors-db";
import { isSupabaseConfigured } from "../lib/supabase";
import { createVendorAction, updateVendorAction, deleteVendorAction } from "../app/actions/vendors-actions";

// --- Form Validation Schema ---
const vendorSchema = z.object({
  vendor_name: z.string().min(3, "Vendor name must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
  contact_person: z.string().optional(),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address").or(z.literal("")),
  total_cost: z.coerce.number().positive("Total cost must be greater than 0"),
  amount_paid: z.coerce.number().min(0, "Amount paid cannot be negative"),
}).refine((data) => data.amount_paid <= data.total_cost, {
  message: "Amount paid cannot exceed total cost",
  path: ["amount_paid"]
});

type VendorFormData = z.infer<typeof vendorSchema>;

export interface VendorsTrackerActions {
  openAddVendor: () => void;
}

interface VendorsTrackerTabProps {
  registerActions?: (actions: VendorsTrackerActions | null) => void;
  isActive?: boolean;
}

export default function VendorsTrackerTab({ registerActions, isActive = true }: VendorsTrackerTabProps) {
  const [mounted, setMounted] = useState(false);
  
  // Data States
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // UI Dialog States
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "PARTIAL" | "UNPAID">("ALL");
  
  // Pagination
  const [vendorPage, setVendorPage] = useState(1);
  const ITEMS_PER_PAGE = 7;
  
  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- React Hook Form ---
  const vendorForm = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema) as any,
    defaultValues: {
      vendor_name: "",
      category: "Photography",
      contact_person: "",
      phone: "",
      email: "",
      total_cost: 0,
      amount_paid: 0,
    }
  });

  // Load Vendors
  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const data = await getWeddingVendors();
      setVendors(data);
      
      // Keep page index bounded
      const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE) || 1;
      setVendorPage((prev) => Math.min(prev, totalPages));
    } catch (e: any) {
      console.error(e);
      setErrorMsg("Failed to retrieve wedding vendors checklist.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isActive) {
      loadData();
    }
  }, [isActive]);

  // Register Actions for Parent component (Header Button click support)
  useEffect(() => {
    if (registerActions) {
      registerActions({
        openAddVendor: () => {
          setEditingVendor(null);
          vendorForm.reset({
            vendor_name: "",
            category: "Venue",
            contact_person: "",
            phone: "",
            email: "",
            total_cost: 0,
            amount_paid: 0,
          });
          setIsVendorModalOpen(true);
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
    setVendorPage(1);
  }, [searchQuery, categoryFilter, statusFilter]);

  // --- Indian Rupee Currency Format ---
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // --- Calculations & Business Logic ---
  const totalVendors = vendors.length;
  const totalCostSum = vendors.reduce((sum, v) => sum + v.total_cost, 0);
  const totalPaidSum = vendors.reduce((sum, v) => sum + v.amount_paid, 0);
  const remainingSum = totalCostSum - totalPaidSum;

  // Filter Vendors list
  const filteredVendors = vendors.filter(v => {
    const matchesSearch = 
      v.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (v.contact_person || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone.includes(searchQuery);
      
    const matchesCategory = categoryFilter === "ALL" || v.category === categoryFilter;
    
    // Status Logic
    const remaining = v.total_cost - v.amount_paid;
    let paymentStatus: "PAID" | "PARTIAL" | "UNPAID" = "UNPAID";
    if (remaining === 0) {
      paymentStatus = "PAID";
    } else if (v.amount_paid > 0 && remaining > 0) {
      paymentStatus = "PARTIAL";
    } else if (v.amount_paid === 0) {
      paymentStatus = "UNPAID";
    }
    
    const matchesStatus = statusFilter === "ALL" || paymentStatus === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Paginated vendors
  const totalVendorPages = Math.ceil(filteredVendors.length / ITEMS_PER_PAGE) || 1;
  const displayedVendors = filteredVendors.slice(
    (vendorPage - 1) * ITEMS_PER_PAGE,
    vendorPage * ITEMS_PER_PAGE
  );

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
  const onVendorSubmit = async (data: VendorFormData) => {
    setIsSubmitting(true);
    const originalVendors = [...vendors];
    const fields = {
      vendor_name: data.vendor_name,
      category: data.category,
      contact_person: data.contact_person || "",
      phone: data.phone,
      email: data.email || "",
      total_cost: data.total_cost,
      amount_paid: data.amount_paid,
    };

    if (editingVendor) {
      // Optimistic edit update
      setVendors(prev => prev.map(v => v.id === editingVendor.id ? { ...v, ...fields } : v));
      setIsVendorModalOpen(false);
      setEditingVendor(null);
      
      try {
        const res = isSupabaseConfigured
          ? await updateVendorAction(editingVendor.id, fields)
          : { success: true, data: await updateWeddingVendor(editingVendor.id, fields) };
          
        if (res.success && res.data) {
          const formatted = {
            ...res.data,
            total_cost: Number(res.data.total_cost || 0),
            amount_paid: Number(res.data.amount_paid || 0)
          };
          setVendors(prev => prev.map(v => v.id === editingVendor.id ? formatted : v));
          showToast("Vendor details updated successfully!");
        } else {
          throw new Error(res.error || "Failed to update vendor");
        }
      } catch (e: any) {
        setVendors(originalVendors);
        showToast(e.message || "Failed to update vendor details.", "error");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Optimistic create update
      const tempId = `temp-${Date.now()}`;
      const tempVendor: Vendor = {
        id: tempId,
        ...fields,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setVendors(prev => [tempVendor, ...prev]);
      setIsVendorModalOpen(false);
      setEditingVendor(null);
      
      try {
        const res = isSupabaseConfigured
          ? await createVendorAction(fields)
          : { success: true, data: await createWeddingVendor(fields) };
          
        if (res.success && res.data) {
          const formatted = {
            ...res.data,
            total_cost: Number(res.data.total_cost || 0),
            amount_paid: Number(res.data.amount_paid || 0)
          };
          setVendors(prev => prev.map(v => v.id === tempId ? formatted : v));
          showToast("Vendor added successfully!");
        } else {
          throw new Error(res.error || "Failed to add vendor");
        }
      } catch (e: any) {
        setVendors(originalVendors);
        showToast(e.message || "Failed to add vendor details.", "error");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Open Edit Dialog
  const handleEditClick = (vendor: Vendor) => {
    setEditingVendor(vendor);
    vendorForm.reset({
      vendor_name: vendor.vendor_name,
      category: vendor.category,
      contact_person: vendor.contact_person || "",
      phone: vendor.phone,
      email: vendor.email || "",
      total_cost: vendor.total_cost,
      amount_paid: vendor.amount_paid,
    });
    setIsVendorModalOpen(true);
  };

  // Optimistic Delete Vendor
  const handleDeleteConfirm = async () => {
    if (!deletingVendor) return;
    const targetVendor = deletingVendor;
    setDeletingVendor(null);
    setIsSubmitting(true);
    
    const originalVendors = [...vendors];
    
    // Optimistic remove
    setVendors(prev => prev.filter(v => v.id !== targetVendor.id));
    
    try {
      if (isSupabaseConfigured) {
        const res = await deleteVendorAction(targetVendor.id);
        if (!res.success) throw new Error(res.error);
      } else {
        await deleteWeddingVendor(targetVendor.id);
      }
      showToast("Vendor deleted successfully!");
    } catch (e: any) {
      // Rollback
      setVendors(originalVendors);
      showToast(e.message || "Failed to delete vendor.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for status badges
  const getStatusBadge = (totalCost: number, amountPaid: number) => {
    const remaining = totalCost - amountPaid;
    if (remaining === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-wider">
          <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
          Paid
        </span>
      );
    } else if (amountPaid > 0 && remaining > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-800 border-amber-200 uppercase tracking-wider">
          <span className="w-1 h-1 rounded-full bg-amber-500"></span>
          Partial
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-500 border-slate-200 uppercase tracking-wider">
          <span className="w-1 h-1 rounded-full bg-slate-400"></span>
          Unpaid
        </span>
      );
    }
  };

  return (
    <div className="space-y-8 font-sans text-slate-800 relative antialiased selection:bg-[#ffe088] selection:text-[#1f1b17] animate-fadeIn">
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#d4af37] animate-spin"></div>
          </div>
          <p className="text-sm text-slate-500 font-medium tracking-wide">Retrieving wedding vendors...</p>
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
            
            {/* Card 1: Total Vendors */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Total Vendors</span>
                <span className="text-3xl font-serif font-bold text-slate-900 block mt-1">{totalVendors}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100">
                <User className="h-5 w-5" />
              </div>
            </div>

            {/* Card 2: Total Vendor Cost */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Total Vendor Cost</span>
                <span className="text-2xl font-serif font-bold text-slate-900 block mt-1">{formatINR(totalCostSum)}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#fffcf5] text-[#d4af37] flex items-center justify-center border border-amber-100/40">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            {/* Card 3: Total Paid */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Total Paid</span>
                <span className="text-2xl font-serif font-bold text-emerald-600 block mt-1">{formatINR(totalPaidSum)}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            {/* Card 4: Remaining Balance */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Remaining Balance</span>
                <span className="text-2xl font-serif font-bold text-amber-600 block mt-1">{formatINR(remainingSum)}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50/70 text-amber-600 flex items-center justify-center border border-amber-100">
                <Wallet className="h-5 w-5" />
              </div>
            </div>

          </div>

          {/* 2. Main content area: Vendor Ledger */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Filters & Search Toolbar */}
            <div className="p-6 border-b border-slate-100 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-lg text-slate-950 font-bold mb-1">
                    Vendor Directory
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                    Store and track all vendor details, costings, and payments
                  </p>
                </div>

                {/* Search Field */}
                <div className="relative w-full md:max-w-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by vendor, contact, phone..."
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

                {/* Category Filter */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Category</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#ffe088]"
                  >
                    <option value="ALL">All Categories</option>
                    {VENDOR_SERVICES_STRUCTURE.map((group) => (
                      <optgroup key={group.main} label={group.main}>
                        {group.subs.map((sub) => (
                          <option key={sub.value} value={sub.value}>
                            {sub.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Payment Status Filter */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Payment Status</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#ffe088]"
                  >
                    <option value="ALL">All Payments</option>
                    <option value="PAID">Fully Paid</option>
                    <option value="PARTIAL">Partially Paid</option>
                    <option value="UNPAID">Unpaid</option>
                  </select>
                </div>

                {/* Reset Button */}
                {(searchQuery || categoryFilter !== "ALL" || statusFilter !== "ALL") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("ALL");
                      setStatusFilter("ALL");
                    }}
                    className="text-[10px] text-[#735c00] hover:text-[#524100] font-bold uppercase tracking-wider underline cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Table layout */}
            <div className="overflow-x-auto">
              {filteredVendors.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#f5ece5] text-slate-400 flex items-center justify-center mx-auto mb-4 border border-[#d0c5af]/30">
                    <User className="h-6 w-6" />
                  </div>
                  <h4 className="font-serif text-base font-bold text-slate-900 mb-1">No vendors added yet.</h4>
                  <p className="text-xs text-slate-500 mb-6">Start by adding your first wedding vendor.</p>
                  <button
                    onClick={() => {
                      setEditingVendor(null);
                      vendorForm.reset({
                        vendor_name: "",
                        category: "Venue",
                        contact_person: "",
                        phone: "",
                        email: "",
                        total_cost: 0,
                        amount_paid: 0,
                      });
                      setIsVendorModalOpen(true);
                    }}
                    className="px-4 py-2 border border-slate-300 hover:border-slate-800 text-slate-700 hover:text-slate-900 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    Add Vendor
                  </button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold uppercase tracking-wider text-[9px] select-none">
                      <th className="px-6 py-3.5">Vendor</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5">Phone</th>
                      <th className="px-6 py-3.5">Total Cost</th>
                      <th className="px-6 py-3.5">Paid</th>
                      <th className="px-6 py-3.5">Remaining</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedVendors.map((v) => {
                      const remaining = v.total_cost - v.amount_paid;
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/30 transition-colors group">
                          
                          {/* Vendor Name & Contact Person */}
                          <td className="px-6 py-4 max-w-xs">
                            <div>
                              <div className="font-bold text-sm text-slate-950">{v.vendor_name}</div>
                              {v.contact_person && (
                                <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5 font-medium">
                                  <User className="h-3 w-3 shrink-0" />
                                  {v.contact_person}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600">
                              <Tag className="h-3 w-3 text-slate-400 shrink-0" />
                              {v.category}
                            </span>
                          </td>

                          {/* Phone */}
                          <td className="px-6 py-4">
                            <span className="text-slate-500 font-semibold flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                              {v.phone}
                            </span>
                          </td>

                          {/* Total Cost */}
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900">{formatINR(v.total_cost)}</span>
                          </td>

                          {/* Paid */}
                          <td className="px-6 py-4">
                            <span className="font-bold text-emerald-600">{formatINR(v.amount_paid)}</span>
                          </td>

                          {/* Remaining */}
                          <td className="px-6 py-4">
                            <span className={`font-bold ${remaining > 0 ? "text-amber-600" : "text-slate-400"}`}>
                              {formatINR(remaining)}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="px-6 py-4">
                            {getStatusBadge(v.total_cost, v.amount_paid)}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditClick(v)}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded transition-colors cursor-pointer"
                                title="Edit vendor"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingVendor(v)}
                                className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded transition-colors cursor-pointer"
                                title="Delete vendor"
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
            {filteredVendors.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 gap-4 select-none">
                <span className="text-xs text-slate-500 font-medium">
                  Showing {filteredVendors.length > 0 ? (vendorPage - 1) * ITEMS_PER_PAGE + 1 : 0}–{Math.min(vendorPage * ITEMS_PER_PAGE, filteredVendors.length)} of {filteredVendors.length} vendors
                </span>

                {totalVendorPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setVendorPage(prev => Math.max(prev - 1, 1))}
                      disabled={vendorPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-50 disabled:hover:border-slate-200 transition-all cursor-pointer shadow-sm disabled:cursor-default"
                    >
                      <ChevronLeft className="h-4 w-4 text-slate-600" />
                    </button>

                    {getPageNumbers(vendorPage, totalVendorPages).map((p, idx) => {
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
                          onClick={() => setVendorPage(p as number)}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            vendorPage === p
                              ? "bg-slate-900 text-white shadow-sm"
                              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setVendorPage(prev => Math.min(prev + 1, totalVendorPages))}
                      disabled={vendorPage === totalVendorPages}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-50 disabled:hover:border-slate-200 transition-all cursor-pointer shadow-sm disabled:cursor-default"
                    >
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </>
      )}

      {/* ── MODAL: ADD / EDIT VENDOR ── */}
      {isVendorModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto py-8 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] my-auto">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#d4af37] z-10"></div>

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-serif text-lg text-slate-950 font-bold">
                {editingVendor ? "Modify Vendor Record" : "Add Wedding Vendor"}
              </h3>
              <button
                onClick={() => setIsVendorModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={vendorForm.handleSubmit(onVendorSubmit)} className="flex-1 flex flex-col overflow-hidden">
              
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 styled-scrollbar">
                
                {/* Vendor Name */}
                <div>
                  <label htmlFor="vendor_name" className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                    Vendor Name / Business Title
                  </label>
                  <input
                    id="vendor_name"
                    type="text"
                    placeholder="e.g. Royal Photography Studio"
                    {...vendorForm.register("vendor_name")}
                    className={`block w-full px-4 py-2.5 bg-[#fff8f4] border ${
                      vendorForm.formState.errors.vendor_name ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-[#ffe088]"
                    } rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 transition-all`}
                  />
                  {vendorForm.formState.errors.vendor_name && (
                    <p className="text-red-600 text-[10px] font-semibold mt-1">
                      {vendorForm.formState.errors.vendor_name.message}
                    </p>
                  )}
                </div>

                {/* Category & Contact Person Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                      Service Category
                    </label>
                    <select
                      id="category"
                      {...vendorForm.register("category")}
                      className="block w-full px-3 py-2.5 bg-[#fff8f4] border border-slate-200 focus:ring-[#ffe088] rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 transition-all"
                    >
                      {VENDOR_SERVICES_STRUCTURE.map((group) => (
                        <optgroup key={group.main} label={group.main}>
                          {group.subs.map((sub) => (
                            <option key={sub.value} value={sub.value}>
                              {sub.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contact_person" className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                      Contact Person (Optional)
                    </label>
                    <input
                      id="contact_person"
                      type="text"
                      placeholder="e.g. Rahul Kumar"
                      {...vendorForm.register("contact_person")}
                      className="block w-full px-4 py-2.5 bg-[#fff8f4] border border-slate-200 focus:ring-[#ffe088] rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 transition-all"
                    />
                  </div>
                </div>

                {/* Phone & Email Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      {...vendorForm.register("phone")}
                      className={`block w-full px-4 py-2.5 bg-[#fff8f4] border ${
                        vendorForm.formState.errors.phone ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-[#ffe088]"
                      } rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 transition-all`}
                    />
                    {vendorForm.formState.errors.phone && (
                      <p className="text-red-600 text-[10px] font-semibold mt-1">
                        {vendorForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      id="email"
                      type="text"
                      placeholder="e.g. email@gmail.com"
                      {...vendorForm.register("email")}
                      className={`block w-full px-4 py-2.5 bg-[#fff8f4] border ${
                        vendorForm.formState.errors.email ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-[#ffe088]"
                      } rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 transition-all`}
                    />
                    {vendorForm.formState.errors.email && (
                      <p className="text-red-600 text-[10px] font-semibold mt-1">
                        {vendorForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Total Cost & Paid Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="total_cost" className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                      Total Cost (₹)
                    </label>
                    <input
                      id="total_cost"
                      type="number"
                      placeholder="e.g. 100000"
                      {...vendorForm.register("total_cost")}
                      className={`block w-full px-4 py-2.5 bg-[#fff8f4] border ${
                        vendorForm.formState.errors.total_cost ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-[#ffe088]"
                      } rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 transition-all`}
                    />
                    {vendorForm.formState.errors.total_cost && (
                      <p className="text-red-600 text-[10px] font-semibold mt-1">
                        {vendorForm.formState.errors.total_cost.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="amount_paid" className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                      Amount Paid (₹)
                    </label>
                    <input
                      id="amount_paid"
                      type="number"
                      placeholder="e.g. 25000"
                      {...vendorForm.register("amount_paid")}
                      className={`block w-full px-4 py-2.5 bg-[#fff8f4] border ${
                        vendorForm.formState.errors.amount_paid ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-[#ffe088]"
                      } rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-4 transition-all`}
                    />
                    {vendorForm.formState.errors.amount_paid && (
                      <p className="text-red-600 text-[10px] font-semibold mt-1">
                        {vendorForm.formState.errors.amount_paid.message}
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* Sticky Action Footer */}
              <div className="p-6 border-t border-slate-100 flex items-center gap-3 shrink-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
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
                  ) : editingVendor ? (
                    "Save Changes"
                  ) : (
                    "Add Vendor"
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: CONFIRM DELETE VENDOR ── */}
      {deletingVendor && createPortal(
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto py-8 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm shadow-2xl relative overflow-hidden p-6 text-center my-auto">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 className="h-5 w-5" />
            </div>
            
            <h3 className="font-serif text-base font-bold text-slate-950 mb-2">Delete Vendor Record</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Are you sure you want to delete this vendor? <br/>
              <strong className="text-slate-900">"{deletingVendor.vendor_name}"</strong>
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeletingVendor(null)}
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
