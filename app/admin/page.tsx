"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Settings as SettingsIcon, 
  MessageSquare, 
  BarChart3, 
  Copy, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  Lock,
  ArrowRight,
  Globe,
  ExternalLink
} from "lucide-react";
import { 
  getWeddingInfo, 
  saveWeddingInfo, 
  getGuests, 
  createGuest, 
  deleteGuest, 
  getWishes, 
  updateWishStatus, 
  deleteWish, 
  getAnalytics, 
  WeddingInfo, 
  Guest, 
  Wish, 
  Analytics 
} from "../../lib/db";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<"analytics" | "guests" | "wishes" | "settings">("analytics");
  const [weddingInfo, setWeddingInfo] = useState<WeddingInfo | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  // Form states for creating new guest
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestGreeting, setNewGuestGreeting] = useState("");
  const [newGuestAttendees, setNewGuestAttendees] = useState(2);
  const [newGuestEmail, setNewGuestEmail] = useState("");
  
  // Feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Authenticate Admin
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (error) {
          setAuthError(error.message);
          return;
        }
        if (data?.user) {
          if (data.user.email === "stibinaugustine3047@gmail.com") {
            setUser(data.user);
            setIsAuthenticated(true);
          } else {
            setAuthError("Unauthorized email address.");
            await supabase.auth.signOut();
          }
        }
      } catch (err: any) {
        setAuthError(err.message || "Sign in failed.");
      }
    } else {
      // Local fallback logic
      if (email.trim() === "stibinaugustine3047@gmail.com" && password === "12345678") {
        setIsAuthenticated(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("admin_authed", "true");
        }
      } else {
        setAuthError("Incorrect email or password.");
      }
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    sessionStorage.removeItem("admin_authed");
    setIsAuthenticated(false);
    setUser(null);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      if (typeof window !== "undefined") {
        const authed = sessionStorage.getItem("admin_authed");
        if (authed === "true") {
          setIsAuthenticated(true);
        }
      }
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          if (session.user.email === "stibinaugustine3047@gmail.com") {
            setUser(session.user);
            setIsAuthenticated(true);
          } else {
            setAuthError(`Unauthorized email: ${session.user.email}`);
            await supabase.auth.signOut();
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        if (session.user.email === "stibinaugustine3047@gmail.com") {
          setUser(session.user);
          setIsAuthenticated(true);
          setAuthError("");
        } else {
          setAuthError(`Unauthorized email: ${session.user.email}`);
          setIsAuthenticated(false);
          setUser(null);
          await supabase.auth.signOut();
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load Admin Data
  const loadAdminData = async () => {
    try {
      const info = await getWeddingInfo();
      setWeddingInfo(info);
      const guestList = await getGuests();
      setGuests(guestList);
      const wishesList = await getWishes(true); // Load approved + unapproved wishes
      setWishes(wishesList);
      const stats = await getAnalytics();
      setAnalytics(stats);
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  // Copy invitation link to clipboard
  const handleCopyLink = (guestId: string) => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const inviteUrl = `${origin}/invite/${guestId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(guestId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Add Guest Action
  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;

    try {
      await createGuest(
        newGuestName.trim(), 
        newGuestGreeting.trim() || newGuestName.trim(), 
        newGuestAttendees, 
        newGuestEmail.trim() || undefined
      );
      setNewGuestName("");
      setNewGuestGreeting("");
      setNewGuestAttendees(2);
      setNewGuestEmail("");
      loadAdminData(); // Refresh list
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Guest Action
  const handleDeleteGuest = async (id: string) => {
    if (confirm("Are you sure you want to delete this guest?")) {
      try {
        await deleteGuest(id);
        loadAdminData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Moderation: Approve/Reject Wish
  const handleToggleWish = async (id: string, approved: boolean) => {
    try {
      await updateWishStatus(id, approved);
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Moderation: Delete Wish
  const handleDeleteWish = async (id: string) => {
    if (confirm("Delete this message?")) {
      try {
        await deleteWish(id);
        loadAdminData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Settings: Save Wedding Details
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weddingInfo) return;

    try {
      await saveWeddingInfo(weddingInfo);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle setting updates locally before submit
  const handleSettingChange = (field: keyof WeddingInfo, value: string) => {
    if (!weddingInfo) return;
    setWeddingInfo({
      ...weddingInfo,
      [field]: value
    });
  };

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-[#0f1c18] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#d4af37] font-semibold tracking-widest uppercase">Checking Authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-[#0f1c18] flex items-center justify-center px-4">
        <div className="w-full max-w-sm glass-panel p-8 rounded-2xl border border-[#d4af37]/30 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] mx-auto mb-4">
            <Lock className="h-6 w-6 animate-pulse" />
          </div>
          <h1 className="font-serif text-2xl text-white font-bold mb-2">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground mb-6">Sign in to manage invitations & RSVPs.</p>
          
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-[#d4af37] mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 rounded-xl border border-emerald-900 bg-emerald-950/50 text-white placeholder-emerald-700/60 focus:outline-none focus:ring-1 focus:ring-[#d4af37] text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-[#d4af37] mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-emerald-900 bg-emerald-950/50 text-white placeholder-emerald-700/60 focus:outline-none focus:ring-1 focus:ring-[#d4af37] text-sm"
              />
              {authError && <p className="text-xs text-red-400 mt-2 text-center">{authError}</p>}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#d4af37] hover:bg-[#bfa032] text-black font-semibold text-xs uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              Sign In
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-8 text-center">
            {isSupabaseConfigured 
              ? "Use your Supabase email & password." 
              : <>Fallback: Use <code className="bg-emerald-950 px-1 py-0.5 rounded text-[#d4af37]">stibinaugustine3047@gmail.com</code> & <code className="bg-emerald-950 px-1 py-0.5 rounded text-[#d4af37]">12345678</code></>
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded bg-[#d4af37] text-slate-950 flex items-center justify-center font-bold">A</div>
            <div>
              <h2 className="font-serif text-white font-bold text-base leading-tight">Albin & Stella</h2>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Wedding Admin</span>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all ${
                activeTab === "analytics" ? "bg-slate-800 text-white border-l-4 border-[#d4af37]" : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <BarChart3 className="h-4 w-4 text-[#d4af37]" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("guests")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all ${
                activeTab === "guests" ? "bg-slate-800 text-white border-l-4 border-[#d4af37]" : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Users className="h-4 w-4 text-[#d4af37]" />
              Guest List
            </button>
            <button
              onClick={() => setActiveTab("wishes")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all ${
                activeTab === "wishes" ? "bg-slate-800 text-white border-l-4 border-[#d4af37]" : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <MessageSquare className="h-4 w-4 text-[#d4af37]" />
              Wishes Moderation
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all ${
                activeTab === "settings" ? "bg-slate-800 text-white border-l-4 border-[#d4af37]" : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <SettingsIcon className="h-4 w-4 text-[#d4af37]" />
              Site Settings
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 flex justify-between items-center text-xs">
          <a href="/" target="_blank" className="hover:text-white flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-primary" />
            View Site
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto">
        {/* Tab Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 capitalize">
              {activeTab === "settings" ? "Site Settings" : activeTab}
            </h1>
            <p className="text-xs text-slate-500 mt-1">Manage all wedding content, RSVPs, and configurations.</p>
          </div>
        </div>

        {/* Tab 1: Analytics */}
        {activeTab === "analytics" && analytics && (
          <div className="space-y-8 animate-fadeIn">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Total Page Visits</span>
                <span className="text-3xl font-semibold font-serif text-slate-900">{analytics.totalVisitors}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Invitation Opens</span>
                <span className="text-3xl font-semibold font-serif text-slate-900">
                  {analytics.invitationOpens} <span className="text-xs text-slate-400">({guests.length ? Math.round((analytics.invitationOpens / guests.length) * 100) : 0}%)</span>
                </span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">RSVPs Submitted</span>
                <span className="text-3xl font-semibold font-serif text-slate-900">
                  {analytics.rsvpAccepted + analytics.rsvpDeclined} <span className="text-xs text-slate-400">/ {guests.length}</span>
                </span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Guests Attending</span>
                <span className="text-3xl font-semibold font-serif text-emerald-600">
                  {analytics.totalGuestsAttending} <span className="text-xs text-slate-400">/ {analytics.totalGuestsAllowed} allowed</span>
                </span>
              </div>
            </div>

            {/* RSVP status charts / splits */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-md">
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-4">RSVP Splits</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Accepted ({analytics.rsvpAccepted})</span>
                    <span>{guests.length ? Math.round((analytics.rsvpAccepted / guests.length) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${guests.length ? (analytics.rsvpAccepted / guests.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Declined ({analytics.rsvpDeclined})</span>
                    <span>{guests.length ? Math.round((analytics.rsvpDeclined / guests.length) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${guests.length ? (analytics.rsvpDeclined / guests.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Pending ({guests.length - (analytics.rsvpAccepted + analytics.rsvpDeclined)})</span>
                    <span>{guests.length ? Math.round(((guests.length - (analytics.rsvpAccepted + analytics.rsvpDeclined)) / guests.length) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${guests.length ? ((guests.length - (analytics.rsvpAccepted + analytics.rsvpDeclined)) / guests.length) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Guest List */}
        {activeTab === "guests" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Add Guest Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-4">Add Invitation</h3>
              <form onSubmit={handleCreateGuest} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Guest Name</label>
                  <input
                    type="text"
                    required
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    placeholder="e.g. Uncle Jacob"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Greeting Label</label>
                  <input
                    type="text"
                    value={newGuestGreeting}
                    onChange={(e) => setNewGuestGreeting(e.target.value)}
                    placeholder="e.g. Uncle Jacob & Aunt Susan"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Allowed Attendees</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newGuestAttendees}
                    onChange={(e) => setNewGuestAttendees(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Generate Link
                </button>
              </form>
            </div>

            {/* Guests List Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Guest Name</th>
                      <th className="px-6 py-4">Allowed</th>
                      <th className="px-6 py-4">Views</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">RSVP Attending</th>
                      <th className="px-6 py-4">RSVP Message</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {guests.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          <div>{g.name}</div>
                          <span className="text-[11px] text-slate-400 italic font-normal">{g.greeting}</span>
                        </td>
                        <td className="px-6 py-4">{g.allowedAttendees}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${g.openedCount > 0 ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-800"}`}>
                            {g.openedCount} opens
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                            g.rsvpStatus === "accepted" ? "bg-emerald-100 text-emerald-800" :
                            g.rsvpStatus === "declined" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {g.rsvpStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {g.rsvpStatus === "accepted" ? `${g.rsvpAttendees} / ${g.allowedAttendees}` : "—"}
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate italic">{g.rsvpMessage || "—"}</td>
                        <td className="px-6 py-4 text-right space-x-2 shrink-0">
                          <button
                            onClick={() => handleCopyLink(g.id)}
                            className="text-slate-500 hover:text-slate-950 inline-flex items-center gap-1 text-xs"
                            title="Copy Invitation Link"
                          >
                            {copiedId === g.id ? (
                              <span className="text-emerald-600 flex items-center gap-0.5">
                                <Check className="h-3.5 w-3.5" /> Copied
                              </span>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" /> Link
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteGuest(g.id)}
                            className="text-rose-500 hover:text-rose-700 inline-flex"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Wishes Moderation */}
        {activeTab === "wishes" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {wishes.length === 0 ? (
                <div className="p-12 text-center italic text-slate-400">No wishes found.</div>
              ) : (
                wishes.map((w) => (
                  <div key={w.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-serif font-bold text-slate-900">{w.guestName}</span>
                        <span className="text-xs text-slate-400">• {new Date(w.timestamp).toLocaleDateString()}</span>
                        <span className="text-sm select-none">{w.emoji}</span>
                      </div>
                      <p className="text-slate-600 italic">"{w.message}"</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {w.approved ? (
                        <button
                          onClick={() => handleToggleWish(w.id, false)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
                        >
                          Revoke Approval
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleWish(w.id, true)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteWish(w.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Site Settings */}
        {activeTab === "settings" && weddingInfo && (
          <div className="space-y-8 animate-fadeIn">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <h3 className="font-serif font-bold text-lg text-slate-900 border-b pb-2 mb-4">Wedding Metadata</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Groom Name</label>
                    <input
                      type="text"
                      required
                      value={weddingInfo.groomName}
                      onChange={(e) => handleSettingChange("groomName", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Bride Name</label>
                    <input
                      type="text"
                      required
                      value={weddingInfo.brideName}
                      onChange={(e) => handleSettingChange("brideName", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Tagline</label>
                    <input
                      type="text"
                      required
                      value={weddingInfo.tagline}
                      onChange={(e) => handleSettingChange("tagline", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Wedding Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={weddingInfo.weddingDate}
                      onChange={(e) => handleSettingChange("weddingDate", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Background Music URL</label>
                    <input
                      type="text"
                      value={weddingInfo.bgMusicUrl}
                      onChange={(e) => handleSettingChange("bgMusicUrl", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Video Showcase URL</label>
                    <input
                      type="text"
                      value={weddingInfo.videoUrl}
                      onChange={(e) => handleSettingChange("videoUrl", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <h3 className="font-serif font-bold text-lg text-slate-900 border-b pb-2 mb-4">Venue & Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Location Venue Name</label>
                    <input
                      type="text"
                      value={weddingInfo.locationName}
                      onChange={(e) => handleSettingChange("locationName", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Location Address</label>
                    <input
                      type="text"
                      value={weddingInfo.locationAddress}
                      onChange={(e) => handleSettingChange("locationAddress", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Parking Instructions</label>
                    <textarea
                      rows={2}
                      value={weddingInfo.parkingInfo}
                      onChange={(e) => handleSettingChange("parkingInfo", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Google Maps Embed URL</label>
                    <input
                      type="text"
                      value={weddingInfo.googleMapEmbedUrl}
                      onChange={(e) => handleSettingChange("googleMapEmbedUrl", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Groom Contact Phone</label>
                    <input
                      type="text"
                      value={weddingInfo.contactGroom}
                      onChange={(e) => handleSettingChange("contactGroom", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Bride Contact Phone</label>
                    <input
                      type="text"
                      value={weddingInfo.contactBride}
                      onChange={(e) => handleSettingChange("contactBride", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <h3 className="font-serif font-bold text-lg text-slate-900 border-b pb-2 mb-4">Family Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Groom Parents</label>
                    <input
                      type="text"
                      value={weddingInfo.groomParents}
                      onChange={(e) => handleSettingChange("groomParents", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Bride Parents</label>
                    <input
                      type="text"
                      value={weddingInfo.brideParents}
                      onChange={(e) => handleSettingChange("brideParents", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Groom Siblings</label>
                    <input
                      type="text"
                      value={weddingInfo.groomSiblings}
                      onChange={(e) => handleSettingChange("groomSiblings", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Bride Siblings</label>
                    <input
                      type="text"
                      value={weddingInfo.brideSiblings}
                      onChange={(e) => handleSettingChange("brideSiblings", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Form submit footer */}
              <div className="flex items-center justify-between">
                {saveSuccess ? (
                  <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                    <Check className="h-4 w-4" /> Settings Saved Successfully!
                  </span>
                ) : (
                  <div />
                )}

                <button
                  type="submit"
                  className="px-8 py-3 bg-[#d4af37] hover:bg-[#bfa032] text-black font-semibold text-xs uppercase tracking-widest rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
