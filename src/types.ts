export interface TodoItem {
  id: string;
  categoryId: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  assignedTo?: string; // Name of household member
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
  todos: TodoItem[];
  notes?: NoteItem[];
  notepadTabs?: NotepadTab[];
  updatedAt: string;
  password?: string;
}

// Default/starting template for a new household
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-groceries", name: "Groceries", color: "#EC4899", icon: "ShoppingBag" }, // Pink
  { id: "cat-chores", name: "Daily Chores", color: "#3B82F6", icon: "CheckSquare" }, // Blue
  { id: "cat-home", name: "Home Projects", color: "#10B981", icon: "Home" }, // Emerald
  { id: "cat-meals", name: "Meal Planning", color: "#F59E0B", icon: "Utensils" }, // Amber
  { id: "cat-misc", name: "Everything Else", color: "#8B5CF6", icon: "Sparkles" } // Purple
];
