import { supabase, isSupabaseConfigured } from "./supabase";
import { 
  getWeddingBudget, 
  createWeddingBudget, 
  getExpenses, 
  createExpense, 
  updateExpense, 
  deleteExpense 
} from "./budget-db";

export interface Vendor {
  id: string;
  vendor_name: string;
  category: string;
  contact_person?: string;
  phone: string;
  email?: string;
  total_cost: number;
  amount_paid: number;
  created_at?: string;
  updated_at?: string;
}

export const VENDOR_CATEGORIES = [
  "Venue",
  "Catering",
  "Wedding Cake & Desserts",
  "Bridal Wear",
  "Groom Wear",
  "Makeup",
  "Jewellery",
  "Photography",
  "Videography",
  "Music",
  "Sound & Lighting",
  "Decoration",
  "Printing",
  "Gifts & Favors",
  "Transportation",
  "Guest Accommodation",
  "Other"
] as const;

export const VENDOR_SERVICES_STRUCTURE = [
  {
    main: "Venue & Catering",
    subs: [
      { label: "Ceremony & Reception Venue", value: "Venue" as const },
      { label: "Food & Catering", value: "Catering" as const },
      { label: "Wedding Cake & Desserts", value: "Wedding Cake & Desserts" as const }
    ]
  },
  {
    main: "Attire & Beauty",
    subs: [
      { label: "Bridal Wear", value: "Bridal Wear" as const },
      { label: "Groom Wear", value: "Groom Wear" as const },
      { label: "Makeup & Hair", value: "Makeup" as const },
      { label: "Jewellery & Accessories", value: "Jewellery" as const }
    ]
  },
  {
    main: "Media & Entertainment",
    subs: [
      { label: "Photography", value: "Photography" as const },
      { label: "Videography", value: "Videography" as const },
      { label: "DJ & Live Music", value: "Music" as const },
      { label: "Sound & Stage Lighting", value: "Sound & Lighting" as const }
    ]
  },
  {
    main: "Decor & Stationery",
    subs: [
      { label: "Florals & Stage Decor", value: "Decoration" as const },
      { label: "Invitations & Printing", value: "Printing" as const },
      { label: "Gifts & Favors", value: "Gifts & Favors" as const }
    ]
  },
  {
    main: "Logistics & Travel",
    subs: [
      { label: "Transportation & Cars", value: "Transportation" as const },
      { label: "Guest Accommodation", value: "Guest Accommodation" as const }
    ]
  },
  {
    main: "Other Services",
    subs: [
      { label: "Miscellaneous / Coordinator", value: "Other" as const }
    ]
  }
] as const;

// Helper to map vendor categories to budget categories
export const mapVendorCategoryToExpense = (vendorCategory: string): string => {
  switch (vendorCategory) {
    case "Venue":
      return "Venue";
    case "Catering":
    case "Wedding Cake & Desserts":
      return "Catering";
    case "Photography":
    case "Videography":
      return "Photography & Videography";
    case "Decoration":
      return "Decoration";
    case "Bridal Wear":
    case "Groom Wear":
      return "Bridal & Groom Dress";
    case "Makeup":
      return "Makeup";
    case "Jewellery":
      return "Jewellery";
    case "Transportation":
      return "Transportation";
    case "Music":
    case "Sound & Lighting":
      return "Music & Entertainment";
    case "Printing":
    case "Gifts & Favors":
    case "Guest Accommodation":
    case "Other":
    default:
      return "Miscellaneous";
  }
};

// Sync vendor payment to budget expenses in localStorage fallback
export const syncVendorPaymentToBudgetLocal = async (
  vendorId: string,
  vendorName: string,
  category: string,
  amountPaid: number,
  isDelete: boolean = false
): Promise<void> => {
  try {
    // 1. Get or create active budget
    let budget = await getWeddingBudget();
    if (!budget) {
      budget = await createWeddingBudget(1000000); // 10 Lakhs default
    }

    // 2. Fetch all expenses for this budget
    const expenses = await getExpenses(budget.id);
    const targetTag = `[Vendor: ${vendorId}]`;
    const existingExpense = expenses.find(e => (e.notes || "").includes(targetTag));

    if (isDelete || amountPaid === 0) {
      // Delete existing expense if present
      if (existingExpense) {
        await deleteExpense(existingExpense.id);
      }
    } else {
      // Create or update expense
      const mappedCategory = mapVendorCategoryToExpense(category);
      if (existingExpense) {
        // Update
        await updateExpense(existingExpense.id, {
          title: `Vendor Payment: ${vendorName}`,
          amount: amountPaid,
          category: mappedCategory,
          expense_date: existingExpense.expense_date, // keep original date
          notes: targetTag,
        });
      } else {
        // Create new
        await createExpense({
          budget_id: budget.id,
          title: `Vendor Payment: ${vendorName}`,
          amount: amountPaid,
          category: mappedCategory,
          expense_date: new Date().toISOString().split("T")[0],
          notes: targetTag,
        });
      }
    }
  } catch (err) {
    console.error("Failed to sync vendor payment to local budget tracker:", err);
  }
};

class MockVendorsDB {
  private getStorageKey(): string {
    return "wedding_db_vendors";
  }

  private getData(): Vendor[] {
    if (typeof window === "undefined") return [];
    const item = localStorage.getItem(this.getStorageKey());
    if (!item) {
      // Premium initial mock vendor items
      const defaultVendors: Vendor[] = [
        {
          id: "vendor-1",
          vendor_name: "Grand Palace Resort",
          category: "Venue",
          contact_person: "Stibin Ottathai",
          phone: "9876543210",
          email: "grandpalaceresort@gmail.com",
          total_cost: 450000,
          amount_paid: 250000,
        },
        {
          id: "vendor-2",
          vendor_name: "Heritage Caterers",
          category: "Catering",
          contact_person: "Maria Kurian",
          phone: "9988776655",
          email: "heritagecaterers@yahoo.com",
          total_cost: 150000,
          amount_paid: 150000, // Fully Paid
        },
        {
          id: "vendor-3",
          vendor_name: "Royal Photography Studio",
          category: "Photography",
          contact_person: "Rahul Kumar",
          phone: "9876543210",
          email: "royalphotography@gmail.com",
          total_cost: 100000,
          amount_paid: 250000, // Wait, total_cost is 100000 and amount_paid cannot exceed it in validation, so let's set to 25000
        },
        {
          id: "vendor-4",
          vendor_name: "Sparkle Decorators",
          category: "Decoration",
          contact_person: "Alan Joy",
          phone: "8877665544",
          email: "sparkledecors@gmail.com",
          total_cost: 50000,
          amount_paid: 0, // Unpaid
        }
      ];
      // Quick fix for amount_paid validation in photographic mock:
      defaultVendors[2].amount_paid = 25000;
      this.setData(defaultVendors);
      return defaultVendors;
    }
    try {
      const parsed = JSON.parse(item) as any[];
      // Ensure total_cost and amount_paid are numbers
      return parsed.map(v => ({
        ...v,
        total_cost: Number(v.total_cost || 0),
        amount_paid: Number(v.amount_paid || 0)
      })) as Vendor[];
    } catch {
      return [];
    }
  }

  private setData(data: Vendor[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
  }

  getVendors(): Vendor[] {
    return this.getData();
  }

  saveVendors(vendors: Vendor[]): void {
    this.setData(vendors);
  }
}

const mockVendorsDb = new MockVendorsDB();

// Unified APIs for Vendors

export const getWeddingVendors = async (): Promise<Vendor[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("created_at", { ascending: false });
      if (data && !error) {
        return data.map(v => ({
          ...v,
          total_cost: Number(v.total_cost || 0),
          amount_paid: Number(v.amount_paid || 0)
        })) as Vendor[];
      }
    } catch (e) {
      console.error("Supabase getWeddingVendors error:", e);
    }
  }
  return mockVendorsDb.getVendors();
};

export const createWeddingVendor = async (
  vendor: Omit<Vendor, "id" | "created_at" | "updated_at">
): Promise<Vendor> => {
  const newVendor: Vendor = {
    ...vendor,
    id: typeof window !== "undefined" && window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
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
      
      if (data && !error) {
        return {
          ...data,
          total_cost: Number(data.total_cost || 0),
          amount_paid: Number(data.amount_paid || 0)
        } as Vendor;
      }
      if (error) {
        throw new Error(error.message);
      }
    } catch (e) {
      console.error("Supabase createWeddingVendor error:", e);
      throw e;
    }
  }

  const vendors = mockVendorsDb.getVendors();
  vendors.unshift(newVendor);
  mockVendorsDb.saveVendors(vendors);

  // Sync to local budget
  await syncVendorPaymentToBudgetLocal(newVendor.id, newVendor.vendor_name, newVendor.category, newVendor.amount_paid);

  return newVendor;
};

export const updateWeddingVendor = async (
  id: string,
  updatedFields: Partial<Omit<Vendor, "id" | "created_at" | "updated_at">>
): Promise<Vendor> => {
  if (isSupabaseConfigured) {
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
      
      if (data && !error) {
        return {
          ...data,
          total_cost: Number(data.total_cost || 0),
          amount_paid: Number(data.amount_paid || 0)
        } as Vendor;
      }
      if (error) {
        throw new Error(error.message);
      }
    } catch (e) {
      console.error("Supabase updateWeddingVendor error:", e);
      throw e;
    }
  }

  const vendors = mockVendorsDb.getVendors();
  const index = vendors.findIndex((v) => v.id === id);
  if (index >= 0) {
    const updated = {
      ...vendors[index],
      ...updatedFields,
      updated_at: new Date().toISOString(),
    };
    vendors[index] = updated;
    mockVendorsDb.saveVendors(vendors);

    // Sync to local budget
    await syncVendorPaymentToBudgetLocal(updated.id, updated.vendor_name, updated.category, updated.amount_paid);

    return updated;
  }
  throw new Error("Vendor not found locally.");
};

export const deleteWeddingVendor = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("vendors")
        .delete()
        .eq("id", id);
      
      if (error) {
        throw new Error(error.message);
      }
      return true;
    } catch (e) {
      console.error("Supabase deleteWeddingVendor error:", e);
      throw e;
    }
  }

  const vendors = mockVendorsDb.getVendors();
  const filtered = vendors.filter((v) => v.id !== id);
  if (vendors.length !== filtered.length) {
    mockVendorsDb.saveVendors(filtered);

    // Sync to local budget (mark as delete)
    await syncVendorPaymentToBudgetLocal(id, "", "", 0, true);

    return true;
  }
  return false;
};
