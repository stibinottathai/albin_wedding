"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import BudgetTrackerTab from "../../../components/BudgetTrackerTab";

export default function BudgetDashboardPage() {
  const router = useRouter();

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
                Wedding Budget Tracker
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                Manage and track wedding expenses
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8">
        <BudgetTrackerTab />
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-[#f5ece5] bg-[#fff8f4] text-center text-[10px] text-slate-400 uppercase tracking-widest shrink-0 mt-12">
        Wedding Planner &copy; {new Date().getFullYear()} • Albin &amp; Stella
      </footer>
    </div>
  );
}
