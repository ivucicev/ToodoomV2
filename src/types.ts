export interface TodoItem {
  id: string;
  categoryId: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  assignedTo?: string; // Name of household member
  createdBy?: string;
  completedBy?: string;
  notes?: string;
  aiGroup?: string; // Optional AI categorised group (e.g. Produce, Dairy, Kitchen, Yard)
  tags?: string[]; // Inline parsed hashtag lists
}

export interface Category {
  id: string;
  name: string;
  color: string; // Hex color or nice name
  icon?: string; // Lucide icon name or emoji
}

export interface NoteItem {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotepadTab {
  id: string;
  title: string;
  content: string;
}

export interface Household {
  id: string;
  name: string;
  members: string[];
  categories: Category[];
  noteCategories?: Category[];
  todos: TodoItem[];
  profileNotes?: Record<string, NoteItem[]>;
  profileNotepads?: Record<string, NotepadTab[]>;
  // Legacy fields kept for migration
  notes?: NoteItem[];
  notepadTabs?: NotepadTab[];
  owner?: string;
  memberPins?: Record<string, string>;
  updatedAt: string;
  password?: string;
}

// Default/starting template for a new household
export const DEFAULT_NOTE_CATEGORIES: Category[] = [
  { id: "ncat-ideas", name: "Ideas", color: "#F59E0B", icon: "Sparkles" },
  { id: "ncat-work", name: "Work", color: "#3B82F6", icon: "Book" },
  { id: "ncat-personal", name: "Personal", color: "#10B981", icon: "Heart" },
  { id: "ncat-shopping", name: "Shopping", color: "#EC4899", icon: "ShoppingBag" },
  { id: "ncat-misc", name: "Other", color: "#8B5CF6", icon: "Tag" },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-groceries", name: "Groceries", color: "#EC4899", icon: "ShoppingBag" }, // Pink
  { id: "cat-chores", name: "Daily Chores", color: "#3B82F6", icon: "CheckSquare" }, // Blue
  { id: "cat-home", name: "Home Projects", color: "#10B981", icon: "Home" }, // Emerald
  { id: "cat-meals", name: "Meal Planning", color: "#F59E0B", icon: "Utensils" }, // Amber
  { id: "cat-misc", name: "Everything Else", color: "#8B5CF6", icon: "Sparkles" } // Purple
];
