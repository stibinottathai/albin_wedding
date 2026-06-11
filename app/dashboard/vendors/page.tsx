"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import VendorsTrackerTab from "../../../components/VendorsTrackerTab";

export default function VendorsDashboardPage() {
  const router = useRouter();
  const [vendorsActions, setVendorsActions] = useState<any>(null);

  return (
    <div className="flex-1 min-h-screen bg-[#fff8f4] flex flex-col font-sans relative antialiased selection:bg-[#ffe088] selection:text-[#1f1b17]">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 py-5 px-6 shrink-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700/50 cursor-pointer"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-serif text-[#d4af37] text-xl md:text-2xl font-bold tracking-wide">
                Wedding Vendors Directory
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                Manage vendor profiles, costs, and payment checklist
              </p>
            </div>
          </div>

          {vendorsActions && (
            <button
              onClick={() => vendorsActions.openAddVendor()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#d4af37] text-slate-950 hover:bg-[#ffe699] font-bold text-xs tracking-wider uppercase rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Vendor
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8">
        <VendorsTrackerTab registerActions={setVendorsActions} />
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-[#f5ece5] bg-[#fff8f4] text-center text-[10px] text-slate-400 uppercase tracking-widest shrink-0 mt-12">
        Wedding Planner &copy; {new Date().getFullYear()} • Albin &amp; Stella
      </footer>
    </div>
  );
}
