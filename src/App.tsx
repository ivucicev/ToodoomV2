import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Share2, 
  Plus, 
  Check, 
  Home, 
  ShoppingBag, 
  CheckSquare, 
  Utensils, 
  Tag, 
  User, 
  Eye, 
  EyeOff,
  RefreshCw,
  Clock,
  ChevronRight,
  ClipboardCheck,
  House,
  ArrowUpDown,
  Coffee,
  Heart,
  Sprout,
  Hammer,
  Compass,
  Calendar,
  Book,
  Smile,
  X,
  Sun,
  Moon,
  CheckCheck,
  Trash2,
  ChevronDown,
  LayoutGrid,
  StickyNote,
  Notebook,
  MoreHorizontal,
  Edit2,
  Lock,
  Unlock
} from "lucide-react";
import { Household, TodoItem, Category, DEFAULT_CATEGORIES, DEFAULT_NOTE_CATEGORIES, NoteItem, NotepadTab } from "./types";
import { version } from "../package.json";
import { TaskItem } from "./components/TaskItem";

import { HouseholdManager } from "./components/HouseholdManager";
import { CategoryEditModal } from "./components/CategoryEditModal";

// Dynamic map for rendering standard household icons safely
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag: ShoppingBag,
  CheckSquare: CheckSquare,
  Home: Home,
  Utensils: Utensils,
  Sparkles: Sparkles,
  Tag: Tag,
  Coffee: Coffee,
  Heart: Heart,
  Sprout: Sprout,
  Hammer: Hammer,
  Compass: Compass,
  Calendar: Calendar,
  Book: Book,
  Smile: Smile,
};

// Inline parsing helper for task list category (@GroupName) and tag (#TagName) inline notation
export function parseTaskText(inputText: string) {
  const categoryRegex = /(?:^|\s)@([a-zA-Z0-9\u00C0-\u017F_-]+)/g;
  const tagRegex = /(?:^|\s)#([a-zA-Z0-9\u00C0-\u017F_-]+)/g;

  const categoryMatches = [...inputText.matchAll(categoryRegex)];
  const tagMatches = [...inputText.matchAll(tagRegex)];

  const categoryName = categoryMatches[0] ? categoryMatches[0][1] : null;
  const tags = tagMatches.map(m => m[1].toLowerCase());

  let cleanedText = inputText;
  if (categoryName) {
    cleanedText = cleanedText.replace(/(?:^|\s)@[a-zA-Z0-9\u00C0-\u017F_-]+/g, "").trim();
  }
  tagMatches.forEach(m => {
    cleanedText = cleanedText.replace(/(?:^|\s)#[a-zA-Z0-9\u00C0-\u017F_-]+/g, "").trim();
  });

  // Remove duplicate/extra spaces
  cleanedText = cleanedText.replace(/\s+/g, " ").trim();

  return {
    cleanedText: cleanedText || "Untitled task",
    categoryName,
    tags
  };
}


interface MentionTextareaProps {
  value: string;
  onChange: (val: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  className: string;
  categories: Category[];
  id?: string;
  style?: React.CSSProperties;
  onBlur?: () => void;
  autoFocus?: boolean;
}

const MentionTextarea: React.FC<MentionTextareaProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  categories,
  id,
  style,
  onBlur,
  autoFocus
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [query, setQuery] = useState("");
  const [triggerIndex, setTriggerIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filtered = useMemo(() => {
    if (!showPopup) return [];
    const q = query.toLowerCase();
    return categories.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.id.toLowerCase().includes(q)
    );
  }, [showPopup, query, categories]);

  const insertCategory = (catName: string) => {
    if (!textareaRef.current) return;
    const txt = value;
    const before = txt.slice(0, triggerIndex);
    const after = txt.slice(textareaRef.current.selectionStart || 0);
    const replacement = `@${catName.replace(/\s+/g, "")} `;
    const newVal = before + replacement + after;
    onChange(newVal);
    setShowPopup(false);

    // Reposition cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPosition = triggerIndex + replacement.length;
        textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 10);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);

    const cursor = e.target.selectionStart || 0;
    // Find the last index of '@' before the cursor
    const textBeforeCursor = val.slice(0, cursor);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex !== -1) {
      // Check if it's preceded by whitespace or is at the beginning
      const isStart = atIndex === 0;
      const prevChar = val[atIndex - 1];
      const isPrecededByWhitespace = !prevChar || prevChar === " " || prevChar === "\n" || prevChar === "\t";

      if (isStart || isPrecededByWhitespace) {
        const potentialQuery = textBeforeCursor.slice(atIndex + 1);
        // Only trigger if no spaces are in the query
        if (!potentialQuery.includes(" ") && !potentialQuery.includes("\n")) {
          setShowPopup(true);
          setQuery(potentialQuery);
          setTriggerIndex(atIndex);
          setSelectedIndex(0);
          return;
        }
      }
    }

    setShowPopup(false);
  };

  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPopup && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertCategory(filtered[selectedIndex].name);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowPopup(false);
        return;
      }
    }
    
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div className="relative w-full flex-1 flex flex-col h-full bg-transparent min-h-0">
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDownInternal}
        onBlur={() => {
          // Delay blur slightly to let clicks on the suggestions trigger first
          setTimeout(() => {
            setShowPopup(false);
            if (onBlur) onBlur();
          }, 180);
        }}
        placeholder={placeholder}
        className={className}
        style={style}
        autoFocus={autoFocus}
      />
      {showPopup && filtered.length > 0 && (
        <div className="absolute z-50 left-0 bottom-full mb-1 max-h-40 overflow-y-auto w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg p-1.5 animate-fade-in animate-duration-100 font-sans text-left">
          <div className="px-2 py-1 text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-505 tracking-wider">
            Category Suggestions
          </div>
          {filtered.map((cat, idx) => {
            const IconComp = ICON_MAP[cat.icon || "Tag"] || Tag;
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={cat.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevents blur
                  insertCategory(cat.name);
                }}
                className={`flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold select-none transition-colors ${
                  isSelected
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
              >
                <IconComp className="w-3.5 h-3.5 shrink-0" style={{ color: cat.color }} />
                <span className="truncate">{cat.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Helper to render note content highlighting hashtags (#tag) and categories (@category)
export function renderNoteContent(text: string, categories?: Category[]) {
  if (!text) return "";
  const parts = text.split(/(\s+)/); // Kept whitespace
  return parts.map((part, i) => {
    if (part.startsWith("@") && part.length > 1) {
      const cleanTag = part.slice(1).replace(/[^a-zA-Z0-9\u00C0-\u017F_-]+$/, "");
      const tagStr = cleanTag.toLowerCase();
      const matchingCat = categories?.find((c) => {
        const nameLow = c.name.toLowerCase();
        const nameNoSpaces = nameLow.replace(/\s+/g, "");
        return (
          c.id.toLowerCase() === tagStr ||
          nameLow === tagStr ||
          nameNoSpaces === tagStr ||
          nameLow.replace(/\s+/g, "_") === tagStr ||
          nameLow.replace(/\s+/g, "-") === tagStr
        );
      });
      const highlightColor = matchingCat ? matchingCat.color : undefined;
      if (highlightColor) {
        return (
          <span key={i} className="font-extrabold inline-block px-1 rounded bg-neutral-100/10" style={{ color: highlightColor }}>
            {part}
          </span>
        );
      }
      return (
        <span key={i} className="text-pink-600 dark:text-pink-400 font-bold inline-block">
          {part}
        </span>
      );
    }
    if (part.startsWith("#") && part.length > 1) {
      return (
        <span key={i} className="text-amber-600 dark:text-amber-500 font-bold inline-block">
          {part}
        </span>
      );
    }
    return part;
  });
}

// Helper to generate consistent beautiful colors for dynamic categories
const getNoteCardStyles = (firstCatName: string | null, categories: Category[], darkMode: boolean) => {
  if (!firstCatName || !categories) {
    return {
      bg: "bg-white dark:bg-neutral-900/45 border-neutral-200/60 dark:border-neutral-800 hover:bg-neutral-50/30 dark:hover:bg-neutral-900/60",
      text: "text-neutral-750 dark:text-neutral-200",
      badgeBg: "bg-neutral-100/80 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400",
      accent: "#a3a3a3",
      style: {}
    };
  }

  const matchingCat = categories.find((c) => {
    const nameLow = c.name.toLowerCase();
    const nameNoSpaces = nameLow.replace(/\s+/g, "");
    const tagLow = firstCatName.toLowerCase();
    return (
      c.id.toLowerCase() === tagLow ||
      nameLow === tagLow ||
      nameNoSpaces === tagLow ||
      nameLow.replace(/\s+/g, "_") === tagLow ||
      nameLow.replace(/\s+/g, "-") === tagLow
    );
  });

  if (!matchingCat) {
    return {
      bg: "bg-white dark:bg-neutral-900/40 border-neutral-200/65 dark:border-neutral-800/80 hover:bg-neutral-50/25 dark:hover:bg-neutral-900/60",
      text: "text-neutral-750 dark:text-neutral-200",
      badgeBg: "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400",
      accent: "#a3a3a3",
      style: {}
    };
  }

  const color = matchingCat.color || "#10b981";

  return {
    bg: "transition-all duration-200",
    text: "text-neutral-900 dark:text-neutral-100",
    badgeBg: "bg-neutral-100/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300",
    accent: color,
    style: {
      backgroundColor: darkMode ? `${color}18` : `${color}0C`,
      borderColor: `${color}45`,
      borderWidth: "1.5px",
    }
  };
};

interface NoteCardProps {
  note: { id: string; text: string };
  categories: Category[];
  darkMode: boolean;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, categories, darkMode, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);

  // Sync editing content when remote text changes
  useEffect(() => {
    setEditText(note.text);
  }, [note.text]);

  const handleSave = () => {
    setIsEditing(false);
    if (editText.trim() && editText.trim() !== note.text.trim()) {
      onUpdate(note.id, editText.trim());
    } else if (!editText.trim()) {
      setEditText(note.text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === "Escape") {
      setEditText(note.text);
      setIsEditing(false);
    }
  };

  // Find first category if exists for decorative color alignment
  const categoryMatch = note.text.match(/(?:^|\s)@([a-zA-Z0-9\u00C0-\u017F_-]+)/);
  const firstCat = categoryMatch ? categoryMatch[1] : null;

  const matchingCat = firstCat ? categories.find((c) => {
    const nameLow = c.name.toLowerCase();
    const nameNoSpaces = nameLow.replace(/\s+/g, "");
    const tagLow = firstCat.toLowerCase();
    return (
      c.id.toLowerCase() === tagLow ||
      nameLow === tagLow ||
      nameNoSpaces === tagLow ||
      nameLow.replace(/\s+/g, "_") === tagLow ||
      nameLow.replace(/\s+/g, "-") === tagLow
    );
  }) : null;

  const cardStyle = getNoteCardStyles(firstCat, categories, darkMode);

  return (
    <motion.div
      layoutId={`note-card-${note.id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`group relative flex flex-col justify-between p-5 border rounded-2xl shadow-sm hover:shadow-md dark:hover:shadow-neutral-950/20 transition-all ${cardStyle.bg} min-h-[190px]`}
      style={cardStyle.style}
    >
      {isEditing ? (
        <div className="flex-1 flex flex-col h-full z-10">
          <MentionTextarea
            value={editText}
            onChange={setEditText}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            autoFocus
            placeholder="Note content..."
            className="w-full flex-1 bg-transparent resize-none border-none outline-none text-sm leading-relaxed placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-0 p-0 font-sans"
            style={{ minHeight: "120px" }}
            categories={categories}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full cursor-pointer z-10" onClick={() => setIsEditing(true)}>
          {/* Note content */}
          <div className={`text-sm leading-relaxed select-text font-sans whitespace-pre-wrap break-words pr-5 pb-4 ${cardStyle.text}`}>
            {renderNoteContent(note.text, categories)}
          </div>
          
          {/* Header decoration badge for tags */}
          {firstCat && (
            <div className="mt-auto">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${cardStyle.badgeBg}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cardStyle.accent }} />
                @{matchingCat ? matchingCat.name : firstCat}
              </span>
            </div>
          )}

          {/* Hover control bar containing actions */}
          <div className="absolute top-4 right-4 flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40 rounded-lg transition-colors cursor-pointer"
              title="Edit note"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Delete this note?")) {
                  onDelete(note.id);
                }
              }}
              className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-955/20 rounded-lg transition-colors cursor-pointer"
              title="Delete note"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function App() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHouseholdSetup, setShowHouseholdSetup] = useState(false);
  // iOS install banner: show when opened in Safari (not standalone) with a shared URL
  const [showIosBanner, setShowIosBanner] = useState(() => {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = (window.navigator as any).standalone === true;
    const hasHousehold = new URLSearchParams(window.location.search).has("h");
    return isIos && !isStandalone && hasHousehold;
  });
  const [setupName, setSetupName] = useState("");
  const [setupOwnerName, setSetupOwnerName] = useState("");
  const [setupOwnerPin, setSetupOwnerPin] = useState("");
  const [joinCode, setJoinCode] = useState("");

  // Filter/View states
  const [currentTab, setCurrentTab] = useState<"tasks" | "notes" | "notepad">("tasks");
  const [selectedNoteCategory, setSelectedNoteCategory] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "alphabetical" | "ai">("newest");
  const [aiSorting, setAiSorting] = useState<boolean>(false);
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState<boolean>(false);

  // Active profile: who is using the app on this device
  const [activeProfile, setActiveProfile] = useState<string>("");
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Notes and notepad are per-profile, synced to server so they work across devices
  const [privateNotes, setPrivateNotes] = useState<NoteItem[]>([]);
  const [notepadTabs, setNotepadTabs] = useState<NotepadTab[]>([
    { id: "tab-1", title: "general notes", content: "" }
  ]);
  const [activeNotepadTabId, setActiveNotepadTabId] = useState<string>("tab-1");
  const [editingTabId, setEditingTabId] = useState<string | null>(null);

  // Find the active notepad tab
  const activeTab = useMemo(() => {
    return notepadTabs.find((t) => t.id === activeNotepadTabId) || notepadTabs[0] || { id: "tab-1", title: "general notes", content: "" };
  }, [notepadTabs, activeNotepadTabId]);

  // Local scratchpad/notepad state for fluid real-time writing experience without typing lag
  const [notepadContent, setNotepadContent] = useState<string>(() => activeTab.content);
  const isEditingNotepadRef = useRef<boolean>(false);
  const justCreatedRef = useRef<boolean>(false);
  const debouncedSaveRef = useRef<NodeJS.Timeout | null>(null);

  // Sync notepadContent when activeTab changes
  useEffect(() => {
    if (!isEditingNotepadRef.current) {
      setNotepadContent(activeTab.content);
    }
  }, [activeTab.id, activeTab.content]);

  // Form states for quick-entry
  const [newTask, setNewTask] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newNoteInput, setNewNoteInput] = useState("");

  // Autocomplete suggestions states
  const [cursorIndex, setCursorIndex] = useState<number>(0);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Extract token: is the cursor inside or right after a @category or #tag token?
  const activeToken = useMemo(() => {
    if (!newTask) return null;
    const textBeforeCursor = newTask.slice(0, cursorIndex);
    const match = textBeforeCursor.match(/(?:^|\s)([@#])([a-zA-Z0-9\u00C0-\u017F_-]*)$/);
    if (match) {
      return {
        type: match[1] === "@" ? "category" : "tag",
        query: match[2],
        startIndex: textBeforeCursor.length - match[0].trimStart().length,
        endIndex: textBeforeCursor.length
      };
    }
    return null;
  }, [newTask, cursorIndex]);

  const filteredSuggestions = useMemo(() => {
    if (!activeToken || !household) return [];
    const { type, query } = activeToken;
    const cleanQuery = query.toLowerCase();

    if (type === "category") {
      const categoriesList = household.categories.map((c) => c.name);
      return categoriesList.filter((name) =>
        name.toLowerCase().includes(cleanQuery)
      );
    } else {
      // Gather unique tags from existing todos
      const allTags = Array.from(
        new Set(household.todos.flatMap((t) => t.tags || []))
      ) as string[];
      // Fallback suggestions for tags to make it rich
      const defaultSuggestions = ["fresh", "urgent", "weekly", "today", "weekend", "work", "home"];
      const combinedTags = Array.from(new Set([...allTags, ...defaultSuggestions])) as string[];
      return combinedTags.filter((tag) =>
        tag.toLowerCase().includes(cleanQuery)
      );
    }
  }, [activeToken, household]);

  const insertSuggestion = (suggestion: string) => {
    if (!activeToken) return;
    const prefix = activeToken.type === "category" ? "@" : "#";
    const formattedSuggestion = activeToken.type === "category" ? suggestion : suggestion.toLowerCase();
    const replacementStr = `${prefix}${formattedSuggestion} `;
    
    const before = newTask.slice(0, activeToken.startIndex);
    const after = newTask.slice(activeToken.endIndex);
    const updatedValue = before + replacementStr + after;
    setNewTask(updatedValue);
    
    // Focus the element back and set the cursor right after the newly inserted token
    const inputEl = document.getElementById("new-task-text-input") as HTMLInputElement;
    if (inputEl) {
      inputEl.focus();
      const newCursorPos = activeToken.startIndex + replacementStr.length;
      setCursorIndex(newCursorPos);
      setTimeout(() => {
        inputEl.setSelectionRange(newCursorPos, newCursorPos);
      }, 10);
    }
    setShowSuggestions(false);
  };

  // Sharing feedback states
  const [copied, setCopied] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingNoteCategory, setEditingNoteCategory] = useState<Category | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Password protection state management
  const [passwordInput, setPasswordInput] = useState("");
  const [householdPassword, setHouseholdPassword] = useState<string>(() => {
    const hId = new URLSearchParams(window.location.search).get("h") || window.location.hash.replace("#", "").trim();
    if (hId) return localStorage.getItem(`breezy_password_${hId}`) || "";
    return "";
  });
  const [isPasswordScreen, setIsPasswordScreen] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("breezy_dark_mode");
    // Default to dark mode if no setting exists ("light mode is maybe tooooo light")
    return saved === null ? true : saved === "true";
  });

  // Dark Mode side effects
  useEffect(() => {
    localStorage.setItem("breezy_dark_mode", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Initialize and load household from ?h= query param, #hash fallback, or localStorage
  useEffect(() => {
    const init = async () => {
      // ?h= is preferred (survives PWA install). #hash is legacy fallback.
      const params = new URLSearchParams(window.location.search);
      let householdId = params.get("h") || window.location.hash.replace("#", "").trim();

      if (!householdId) householdId = localStorage.getItem("breezy_household_id") || "";

      if (householdId) {
        const savedPass = localStorage.getItem(`breezy_password_${householdId}`) || "";
        setHouseholdPassword(savedPass);
        setIsPasswordScreen(false);
        setPasswordError(null);
        await loadHousehold(householdId, savedPass);
      } else {
        setLoading(false);
        setShowHouseholdSetup(true);
      }
    };

    init();
  }, []);

  // Load per-profile notes & notepad from server whenever household or active profile changes
  useEffect(() => {
    if (!household) return;
    const profile = activeProfile || "shared";
    const notes = household.profileNotes?.[profile] ?? household.notes ?? [];
    const defaultTabs = [{ id: "tab-1", title: "general notes", content: "" }];
    const tabs = household.profileNotepads?.[profile] ?? household.notepadTabs ?? defaultTabs;
    setPrivateNotes(notes);
    if (!isEditingNotepadRef.current) {
      const validTabs = tabs.length > 0 ? tabs : defaultTabs;
      setNotepadTabs(validTabs);
      setActiveNotepadTabId(prev => validTabs.find(t => t.id === prev) ? prev : validTabs[0].id);
    }
  }, [household?.id, activeProfile]);

  // Load or prompt for active profile when household changes
  useEffect(() => {
    if (household?.id) {
      const saved = localStorage.getItem(`breezy_profile_${household.id}`);
      if (saved) {
        setActiveProfile(saved);
        setProfileModalOpen(false);
      } else if (household.members.length > 0 || household.owner) {
        // Household is claimed — must pick a profile from the list
        setProfileModalOpen(true);
      }
      // else: brand new unclaimed household, let in freely
    }
  }, [household?.id]);

  // Soft Auto-Polling Sync to enable multi-device household sharing without complex websockets
  useEffect(() => {
    if (!household?.id || isPasswordScreen) return;

    const interval = setInterval(async () => {
      try {
        const headers: HeadersInit = {};
        if (householdPassword) {
          headers["x-household-password"] = householdPassword;
        }

        const res = await fetch(`/api/household/${household.id}`, { headers });
        if (res.status === 401) {
          setIsPasswordScreen(true);
          setHousehold(null);
          return;
        }

        if (res.ok) {
          const remoteData = (await res.json()) as Household;
          // Only update local state if remote was updated more recently
          if (remoteData.updatedAt !== household.updatedAt) {
            setHousehold(remoteData);
          }
        }
      } catch (err) {
        console.warn("Background sync offline", err);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [household?.id, household?.updatedAt, householdPassword, isPasswordScreen]);

  // Network Fetch Action: Get House Loadout
  const loadHousehold = async (id: string, customPass?: string) => {
    setLoading(true);
    setError(null);
    setIsPasswordScreen(false);
    setPasswordError(null);

    const passToTry = customPass !== undefined ? customPass : householdPassword;

    try {
      const headers: HeadersInit = {};
      if (passToTry) {
        headers["x-household-password"] = passToTry;
      }

      const res = await fetch(`/api/household/${id}`, { headers });
      
      if (res.status === 401) {
        setIsPasswordScreen(true);
        setHousehold(null);
        if (passToTry) {
          setPasswordError("Incorrect password. Please try again.");
        }
        return;
      }

      if (!res.ok) {
        throw new Error("Could not find this household");
      }
      const data = (await res.json()) as Household;
      setHousehold(data);

      if (passToTry) {
        localStorage.setItem(`breezy_password_${id}`, passToTry);
        setHouseholdPassword(passToTry);
      }

      localStorage.setItem("breezy_household_id", data.id);
      history.replaceState(null, "", `?h=${data.id}`);
      // Track visited households for switcher (max 10)
      try {
        const prev = JSON.parse(localStorage.getItem("breezy_visited_households") || "[]") as {id:string,name:string}[];
        const filtered = prev.filter(h => h.id !== data.id);
        filtered.unshift({ id: data.id, name: data.name });
        localStorage.setItem("breezy_visited_households", JSON.stringify(filtered.slice(0, 10)));
      } catch {}

      justCreatedRef.current = false;
    } catch (err: any) {
      setError(err?.message || "Something went wrong loading your home.");
      // Room dead/unreachable — clear stale localStorage so user isn't stuck
      localStorage.removeItem("breezy_household_id");
      history.replaceState(null, "", window.location.pathname);
    } finally {
      setLoading(false);
    }
  };

  // Network Create Action: Create household with a given name
  const createNewHousehold = async (name?: string, ownerName?: string, ownerPin?: string) => {
    justCreatedRef.current = true;
    setLoading(true);
    setError(null);
    setShowHouseholdSetup(false);
    setIsPasswordScreen(false);
    setPasswordError(null);
    setHouseholdPassword("");
    try {
      const res = await fetch("/api/new-household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name?.trim() || "", ownerName: ownerName?.trim() || "", ownerPin: ownerPin?.trim() || "" }),
      });
      if (!res.ok) throw new Error("Failed to configure new home");
      const data = (await res.json()) as Household;
      setHousehold(data);
      localStorage.setItem("breezy_household_id", data.id);
      history.replaceState(null, "", `?h=${data.id}`);
      // Auto-set owner as active profile — no modal needed
      if (ownerName?.trim()) {
        const trimmed = ownerName.trim();
        setActiveProfile(trimmed);
        localStorage.setItem(`breezy_profile_${data.id}`, trimmed);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to initialize new household.");
    } finally {
      setLoading(false);
    }
  };

  // Push changes and sync live with server
  const syncWithServer = async (updatedHousehold: Household) => {
    if (!updatedHousehold.id) return;
    setSyncing(true);
    
    // Clear pending debounce triggers
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (householdPassword) {
        headers["x-household-password"] = householdPassword;
      }

      const res = await fetch(`/api/household/${updatedHousehold.id}`, {
        method: "POST",
        headers,
        body: JSON.stringify(updatedHousehold),
      });

      if (res.status === 401) {
        setIsPasswordScreen(true);
        setHousehold(null);
        return;
      }

      if (res.ok) {
        const freshData = (await res.json()) as Household;
        // Only sync the server-authoritative updatedAt — full state is already correct
        // from the optimistic update. Replacing the whole household here causes a
        // second full re-render that looks like a page flash to the user.
        setHousehold(prev => prev ? { ...prev, updatedAt: freshData.updatedAt } : freshData);
      }
    } catch (err) {
      console.error("Local save failed to sync immediately, retrying shortly", err);
    } finally {
      setSyncing(false);
    }
  };

  // Immediate Local UI Updates (Pristine React responsiveness)
  const syncLocalAndRemote = (nextState: Household) => {
    setHousehold(nextState);
    syncWithServer(nextState);
  };

  // Handle: Create individual todo item
  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !household) return;

    // Use our beautiful parser to digest @category and #tag markup on the fly
    const { cleanedText, categoryName, tags } = parseTaskText(newTask);

    // Fallbacks: if no category is defined, place in currently selected sidebar category (if !== "all"), or default to first category in house
    const defaultCatId = selectedCategory !== "all" ? selectedCategory : (household.categories[0]?.id || "cat-misc");
    let finalCategoryId = defaultCatId;
    let nextCategories = [...household.categories];

    if (categoryName) {
      const existing = household.categories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (existing) {
        finalCategoryId = existing.id;
      } else {
        // Create a new custom category under the hood on the fly!
        const formattedName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
        const colors = ["#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#14B8A6"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        const newCat: Category = {
          id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: formattedName,
          color: randomColor,
          icon: "Tag"
        };
        
        nextCategories.push(newCat);
        finalCategoryId = newCat.id;
      }
    }

    const newTodoItem: TodoItem = {
      id: `task-${Date.now()}`,
      categoryId: finalCategoryId,
      text: cleanedText,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: tags,
      notes: newNotes.trim() ? newNotes.trim() : undefined,
      createdBy: activeProfile || undefined,
    };

    const nextState: Household = {
      ...household,
      categories: nextCategories,
      todos: [newTodoItem, ...household.todos],
      updatedAt: new Date().toISOString(),
    };

    syncLocalAndRemote(nextState);

    // If a category was supplied, immediately switch active view to that category!
    if (categoryName) {
      setSelectedCategory(finalCategoryId);
    }

    // Reset typing entry input
    setNewTask("");
    setNewNotes("");
    setShowSuggestions(false);
    setCursorIndex(0);
  };

  // Toggle incomplete status with satisfying transition state
  const handleToggleComplete = (todoId: string) => {
    if (!household) return;

    const nextTodos = household.todos.map((t) => {
      if (t.id === todoId) {
        const isCompleted = !t.completed;
        return {
          ...t,
          completed: isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : undefined,
          completedBy: isCompleted ? (activeProfile || undefined) : undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    // Custom sorting: newly completed items move to a dedicated stack nicely, keeping view orderly
    const sortedTodos = [
      ...nextTodos.filter((t) => !t.completed),
      ...nextTodos.filter((t) => t.completed),
    ];

    syncLocalAndRemote({
      ...household,
      todos: sortedTodos,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handle: Modify chore wording directly
  const handleUpdateText = (todoId: string, newText: string, newNotes?: string) => {
    if (!household) return;

    // Use our beautiful parser!
    const { cleanedText, categoryName, tags } = parseTaskText(newText);

    let nextCategories = [...household.categories];
    let finalCategoryId: string | null = null;

    if (categoryName) {
      const existing = household.categories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (existing) {
        finalCategoryId = existing.id;
      } else {
        const formattedName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
        const colors = ["#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#14B8A6"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const newCat: Category = {
          id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: formattedName,
          color: randomColor,
          icon: "Tag"
        };
        nextCategories.push(newCat);
        finalCategoryId = newCat.id;
      }
    }

    const nextTodos = household.todos.map((t) => {
      if (t.id === todoId) {
        return { 
          ...t, 
          text: cleanedText, 
          categoryId: finalCategoryId || t.categoryId, // Keep existing category if none was parsed
          tags: tags, // Always match current parsed tags
          notes: newNotes !== undefined ? (newNotes.trim() ? newNotes.trim() : undefined) : t.notes,
          updatedAt: new Date().toISOString() 
        };
      }
      return t;
    });

    syncLocalAndRemote({
      ...household,
      categories: nextCategories,
      todos: nextTodos,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handle: Remove todo completely
  const handleDeleteTodo = (todoId: string) => {
    if (!household) return;

    const nextTodos = household.todos.filter((t) => t.id !== todoId);

    syncLocalAndRemote({
      ...household,
      todos: nextTodos,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handle: Mark all active chores in current view as completed
  const handleCompleteAll = () => {
    if (!household) return;

    const shownTodoIds = new Set(filteredTodos.map((t) => t.id));

    const nextTodos = household.todos.map((t) => {
      if (shownTodoIds.has(t.id) && !t.completed) {
        return {
          ...t,
          completed: true,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    syncLocalAndRemote({
      ...household,
      todos: nextTodos,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handle: Delete all completed chores in current view
  const handleDeleteCompleted = () => {
    if (!household) return;

    const shownTodoIds = new Set(filteredTodos.map((t) => t.id));

    const nextTodos = household.todos.filter((t) => {
      const isCompletedAndShown = t.completed && shownTodoIds.has(t.id);
      return !isCompletedAndShown;
    });

    syncLocalAndRemote({
      ...household,
      todos: nextTodos,
      updatedAt: new Date().toISOString(),
    });
  };

  // Notepad multiple tabs operations
  const handleAddNotepadTab = () => {
    // Generate a unique auto-incremented notepad name
    let nextNum = notepadTabs.length + 1;
    let nextTitle = `Notepad ${nextNum}`;
    while (notepadTabs.some((t) => t.title.toLowerCase() === nextTitle.toLowerCase())) {
      nextNum += 1;
      nextTitle = `Notepad ${nextNum}`;
    }

    const newTab: NotepadTab = {
      id: `tab-${Date.now()}`,
      title: nextTitle,
      content: "",
    };
    const nextTabs = [...notepadTabs, newTab];
    setNotepadTabs(nextTabs);
    setActiveNotepadTabId(newTab.id);
    setEditingTabId(newTab.id);
    syncProfileNotepads(nextTabs);
  };

  const syncProfileNotepads = (nextTabs: NotepadTab[]) => {
    if (!household) return;
    const profile = activeProfile || "shared";
    syncLocalAndRemote({
      ...household,
      profileNotepads: { ...(household.profileNotepads || {}), [profile]: nextTabs },
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteNotepadTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notepadTabs.length <= 1) return;
    if (confirm("Delete this notepad tab? All its content will be permanently lost.")) {
      const nextTabs = notepadTabs.filter((t) => t.id !== tabId);
      setNotepadTabs(nextTabs);
      if (activeNotepadTabId === tabId) {
        setActiveNotepadTabId(nextTabs[0].id);
      }
      syncProfileNotepads(nextTabs);
    }
  };

  const handleRenameNotepadTab = (tabId: string, _currentTitle: string) => {
    setEditingTabId(tabId);
  };

  const handleFinishRenameTab = (tabId: string, nextTitle: string) => {
    const trimmedTitle = nextTitle.trim();
    if (!trimmedTitle) { setEditingTabId(null); return; }
    const nextTabs = notepadTabs.map((t) => (t.id === tabId ? { ...t, title: trimmedTitle } : t));
    setNotepadTabs(nextTabs);
    setEditingTabId(null);
    syncProfileNotepads(nextTabs);
  };

  const handleNotepadChange = (newVal: string) => {
    setNotepadContent(newVal);
    const nextTabs = notepadTabs.map((t) => (t.id === activeNotepadTabId ? { ...t, content: newVal } : t));
    setNotepadTabs(nextTabs);

    if (debouncedSaveRef.current) clearTimeout(debouncedSaveRef.current);
    debouncedSaveRef.current = setTimeout(() => syncProfileNotepads(nextTabs), 1500);
  };

  const handleNotepadBlur = () => {
    isEditingNotepadRef.current = false;
    if (debouncedSaveRef.current) clearTimeout(debouncedSaveRef.current);
    syncProfileNotepads(notepadTabs);
  };

// Private notes operations (persisting in browser local storage & synced to cloud server)
  const handleAddNote = (text: string) => {
    if (!text.trim()) return;

    let processedText = text.trim();
    if (selectedNoteCategory !== "all" && household) {
      const noteCats = household.noteCategories || DEFAULT_NOTE_CATEGORIES;
      const activeCat = noteCats.find((c) => c.id === selectedNoteCategory);
      if (activeCat) {
        const alreadyHasCat = getNoteCategory(processedText, noteCats);
        if (!alreadyHasCat) {
          processedText = `${processedText}\n\n@${activeCat.name}`;
        }
      }
    }

    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      text: processedText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const nextNotes = [newNote, ...privateNotes];
    setPrivateNotes(nextNotes);
    syncProfileNotes(nextNotes);
  };

  const syncProfileNotes = (nextNotes: NoteItem[]) => {
    if (!household) return;
    const profile = activeProfile || "shared";
    syncLocalAndRemote({
      ...household,
      profileNotes: { ...(household.profileNotes || {}), [profile]: nextNotes },
      updatedAt: new Date().toISOString()
    });
  };

  const handleUpdateNote = (noteId: string, newText: string) => {
    const nextNotes = privateNotes.map((n) =>
      n.id === noteId ? { ...n, text: newText, updatedAt: new Date().toISOString() } : n
    );
    setPrivateNotes(nextNotes);
    syncProfileNotes(nextNotes);
  };

  const handleDeleteNote = (noteId: string) => {
    const nextNotes = privateNotes.filter((n) => n.id !== noteId);
    setPrivateNotes(nextNotes);
    syncProfileNotes(nextNotes);
  };

  const handleDeleteNotesByCategory = (catName: string) => {
    const noteCats = household?.noteCategories || DEFAULT_NOTE_CATEGORIES;
    const nextNotes = privateNotes.filter((n) => {
      const cat = getNoteCategory(n.text, noteCats);
      return cat?.name.toLowerCase() !== catName.toLowerCase();
    });
    setPrivateNotes(nextNotes);
    syncProfileNotes(nextNotes);
  };

  // Helper to parse potential category from notes
  const getNoteCategory = (noteText: string, categories: Category[]) => {
    if (!noteText || !categories) return null;
    
    // We can extract all tokens starting with @
    const tokens = noteText.match(/@([a-zA-Z0-9\u00C0-\u017F_-]+)/g);
    if (!tokens) return null;
    
    // Check elements
    for (const token of tokens) {
      const tagStr = token.slice(1).toLowerCase();
      const match = categories.find((c) => {
        const nameLow = c.name.toLowerCase();
        const nameNoSpaces = nameLow.replace(/\s+/g, "");
        return (
          c.id.toLowerCase() === tagStr ||
          nameLow === tagStr ||
          nameNoSpaces === tagStr ||
          nameLow.replace(/\s+/g, "_") === tagStr ||
          nameLow.replace(/\s+/g, "-") === tagStr
        );
      });
      if (match) return match;
    }
    return null;
  };

  // Filter notes by chosen dynamic category
  const filteredNotes = useMemo(() => {
    const allNotes = privateNotes;
    if (selectedNoteCategory === "all") return allNotes;
    const noteCats = household?.noteCategories || DEFAULT_NOTE_CATEGORIES;
    return allNotes.filter((note) => {
      const matchingCat = getNoteCategory(note.text, noteCats);
      return matchingCat?.id === selectedNoteCategory;
    });
  }, [privateNotes, selectedNoteCategory, household?.noteCategories]);

  // Handle: Update individual category (such as icon and color)
  const handleUpdateCategory = (updatedCat: Category) => {
    if (!household) return;

    const nextCategories = household.categories.map((c) =>
      c.id === updatedCat.id ? updatedCat : c
    );

    syncLocalAndRemote({
      ...household,
      categories: nextCategories,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSetMemberPin = (member: string, pin: string) => {
    if (!household || activeProfile !== household.owner) return;
    syncLocalAndRemote({
      ...household,
      memberPins: { ...(household.memberPins || {}), [member]: pin },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateNoteCategory = (updatedCat: Category) => {
    if (!household) return;
    const current = household.noteCategories || DEFAULT_NOTE_CATEGORIES;
    const next = current.map((c) => c.id === updatedCat.id ? updatedCat : c);
    syncLocalAndRemote({ ...household, noteCategories: next, updatedAt: new Date().toISOString() });
  };

  // Household Custom Settings Callbacks
  const handleUpdateHouseholdName = (nextName: string) => {
    if (!household) return;
    syncLocalAndRemote({
      ...household,
      name: nextName,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateHouseholdPassword = (nextPass: string) => {
    if (!household) return;
    const trimmed = nextPass.trim();

    // Update local client state and localStorage copy
    setHouseholdPassword(trimmed);
    if (trimmed) {
      localStorage.setItem(`breezy_password_${household.id}`, trimmed);
    } else {
      localStorage.removeItem(`breezy_password_${household.id}`);
    }

    // Reset password screens and errors
    setIsPasswordScreen(false);
    setPasswordError(null);

    // Coordinate other states
    syncWithServer({
      ...household,
      password: trimmed || undefined,
      updatedAt: new Date().toISOString()
    });
  };

  const handleAddMember = (memberName: string, pin?: string) => {
    if (!household || activeProfile !== household.owner) return;
    const cleanName = memberName.trim();
    if (!cleanName || household.members.includes(cleanName)) return;

    const nextPins = pin?.trim()
      ? { ...(household.memberPins || {}), [cleanName]: pin.trim() }
      : household.memberPins;

    syncLocalAndRemote({
      ...household,
      members: [...household.members, cleanName],
      ...(nextPins ? { memberPins: nextPins } : {}),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRemoveMember = (memberName: string) => {
    if (!household || activeProfile !== household.owner) return;

    const nextTodos = household.todos.map((t) => {
      if (t.assignedTo === memberName) {
        return { ...t, assignedTo: undefined };
      }
      return t;
    });

    syncLocalAndRemote({
      ...household,
      members: household.members.filter((m) => m !== memberName),
      todos: nextTodos,
      updatedAt: new Date().toISOString(),
    });
  };



  // Easy Cozy URL Copy Helper (Share mechanism)
  const handleCopyLink = async () => {
    if (!household) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?h=${household.id}`;
    const shareText = `Join ${household.name} on Toodoom\n\nOr join by code: ${household.id}`;

    // Use native share sheet if available (iOS Safari, Android Chrome)
    if (navigator.share) {
      try {
        await navigator.share({
          title: household.name,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // User dismissed share sheet — no-op
        return;
      }
    }

    // Fallback: copy to clipboard
    const doCopy = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(doCopy).catch(() => {
        const el = document.createElement("textarea");
        el.value = shareUrl;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.focus(); el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        doCopy();
      });
    } else {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus(); el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      doCopy();
    }
  };

  const handleSelectProfile = (name: string) => {
    setActiveProfile(name);
    if (household?.id) {
      localStorage.setItem(`breezy_profile_${household.id}`, name);
      // First profile to claim this household becomes the owner
      if (!household.owner) {
        syncLocalAndRemote({ ...household, owner: name, updatedAt: new Date().toISOString() });
      }
    }
    setProfileModalOpen(false);
    setShowProfilePicker(false);
  };

  // Create filters
  const filteredTodos = household
    ? household.todos.filter((todo) => {
        // Category filters
        if (selectedCategory !== "all" && todo.categoryId !== selectedCategory) {
          return false;
        }
        return true;
      })
    : [];

  // Dynamic AI sort and classification handler using the backend express api
  const handleAISortList = async () => {
    if (!household || filteredTodos.length === 0) return;
    setAiSorting(true);
    try {
      const currentCategory = household.categories.find(c => c.id === selectedCategory);
      const categoryName = currentCategory ? currentCategory.name : "Miscellaneous";
      
      const res = await fetch("/api/ai-sort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: filteredTodos,
          categoryName
        })
      });
      
      if (!res.ok) {
        if (res.status === 403) {
          alert("Please configure your GEMINI_API_KEY in the Secrets panel first!");
          return;
        }
        throw new Error("Sorting failed");
      }
      
      const data = await res.json();
      if (data.sortedItems && Array.isArray(data.sortedItems)) {
        const mappedGroupNames = new Map<string, string>();
        data.sortedItems.forEach((it: any) => {
          mappedGroupNames.set(it.id, it.groupName);
        });
        
        const updatedTodos = household.todos.map(todo => {
          if (mappedGroupNames.has(todo.id)) {
            return {
              ...todo,
              aiGroup: mappedGroupNames.get(todo.id),
              updatedAt: new Date().toISOString()
            };
          }
          return todo;
        });
        
        // Arrange database order matching the returned sequence
        const sortedIdsOrder = data.sortedItems.map((it: any) => it.id);
        const nextTodos = [...updatedTodos].sort((a, b) => {
          const indexA = sortedIdsOrder.indexOf(a.id);
          const indexB = sortedIdsOrder.indexOf(b.id);
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return 0;
        });
        
        syncLocalAndRemote({
          ...household,
          todos: nextTodos,
          updatedAt: new Date().toISOString()
        });
        
        setSortBy("ai");
      }
    } catch (err) {
      console.error("Failed AI organizer service:", err);
    } finally {
      setAiSorting(false);
    }
  };

  // Perform alphabetical, chronological, or smart AI group sorted layouts for active tasks
  const sortedActiveTodos = React.useMemo(() => {
    const active = filteredTodos.filter((t) => !t.completed);
    const sortList = (subList: typeof active) => {
      if (sortBy === "newest") {
        return [...subList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sortBy === "oldest") {
        return [...subList].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else if (sortBy === "alphabetical") {
        return [...subList].sort((a, b) => a.text.localeCompare(b.text));
      } else if (sortBy === "ai") {
        return [...subList].sort((a, b) => {
          const groupA = a.aiGroup || "Need AI Organising";
          const groupB = b.aiGroup || "Need AI Organising";
          if (groupA !== groupB) {
            return groupA.localeCompare(groupB);
          }
          return a.text.localeCompare(b.text);
        });
      }
      return subList;
    };
    return sortList(active);
  }, [filteredTodos, sortBy]);

  // Perform sorting for completed tasks
  const sortedCompletedTodos = React.useMemo(() => {
    const completed = filteredTodos.filter((t) => t.completed);
    const sortList = (subList: typeof completed) => {
      if (sortBy === "newest") {
        return [...subList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sortBy === "oldest") {
        return [...subList].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else if (sortBy === "alphabetical") {
        return [...subList].sort((a, b) => a.text.localeCompare(b.text));
      } else if (sortBy === "ai") {
        return [...subList].sort((a, b) => {
          const groupA = a.aiGroup || "Need AI Organising";
          const groupB = b.aiGroup || "Need AI Organising";
          if (groupA !== groupB) {
            return groupA.localeCompare(groupB);
          }
          return a.text.localeCompare(b.text);
        });
      }
      return subList;
    };
    return sortList(completed);
  }, [filteredTodos, sortBy]);

  // For AI department groups template
  const aiGroupedActive = React.useMemo(() => {
    if (sortBy !== "ai" || !household) return null;
    
    const active = filteredTodos.filter(t => !t.completed);
    const completed = filteredTodos.filter(t => t.completed);
    
    const groups: Record<string, typeof active> = {};
    active.forEach(it => {
      const g = it.aiGroup || "Need AI Organising";
      if (!groups[g]) groups[g] = [];
      groups[g].push(it);
    });
    
    return {
      groups,
      completed
    };
  }, [filteredTodos, sortBy, household]);

  const incompleteCount = household
    ? household.todos.filter((t) => !t.completed).length
    : 0;

  if (showHouseholdSetup) {
    return (
      <div style={{ minHeight: 'calc(100dvh - env(safe-area-inset-top, 0px))' }} className={`flex flex-col items-center justify-center px-4 bg-[#FAF9F6] dark:bg-[#121210] ${darkMode ? "dark" : ""}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-neutral-200/50 dark:border-neutral-700/50">
              <House className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <h1 className="text-2xl font-black text-neutral-800 dark:text-neutral-100 mb-2 font-sans">Name your space</h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Give your household a name — it'll be part of your unique link.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = setupName.trim();
              const ownerName = setupOwnerName.trim();
              const ownerPin = setupOwnerPin.trim();
              if (!name || !ownerName || !ownerPin) return;
              createNewHousehold(name, ownerName, ownerPin);
            }}
            className="space-y-3"
          >
            <input
              type="text"
              placeholder="e.g. Smith Family, Our Apartment..."
              value={setupName}
              onChange={(e) => setSetupName(e.target.value)}
              autoFocus
              maxLength={40}
              className="w-full text-sm font-sans bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 placeholder-neutral-400 dark:placeholder-neutral-600"
            />
            {setupName.trim() && (
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 px-1 font-mono">
                URL: {setupName.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-").substring(0, 28)}-XXXX
              </p>
            )}
            <input
              type="text"
              placeholder="Your name (e.g. Ivan, Mom, Alex...)"
              value={setupOwnerName}
              onChange={(e) => setSetupOwnerName(e.target.value)}
              maxLength={20}
              className="w-full text-sm font-sans bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 placeholder-neutral-400 dark:placeholder-neutral-600"
            />
            <input
              type="password"
              placeholder="Your PIN (to sign in securely)"
              value={setupOwnerPin}
              onChange={(e) => setSetupOwnerPin(e.target.value)}
              maxLength={20}
              className="w-full text-sm font-sans bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 placeholder-neutral-400 dark:placeholder-neutral-600"
            />
            <button
              type="submit"
              disabled={!setupName.trim() || !setupOwnerName.trim() || !setupOwnerPin.trim()}
              className="w-full py-3 bg-neutral-800 dark:bg-neutral-100 hover:bg-neutral-900 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-sm font-bold rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create Household
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-xs text-center text-neutral-500 dark:text-neutral-400 mb-3 font-sans">Already have a household?</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = joinCode.trim();
                if (!val) return;
                // Accept full URL or bare code
                let code = val;
                try {
                  const u = new URL(val);
                  code = u.searchParams.get("h") || u.hash.replace("#", "") || val;
                } catch {}
                code = code.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
                if (code) {
                  localStorage.setItem("breezy_household_id", code);
                  history.replaceState(null, "", `?h=${code}`);
                  setShowHouseholdSetup(false);
                  loadHousehold(code);
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Paste invite link or household code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 text-sm font-sans bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2.5 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 placeholder-neutral-400 dark:placeholder-neutral-600"
              />
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="px-4 py-2.5 bg-neutral-800 dark:bg-neutral-100 hover:bg-neutral-900 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-sm font-bold rounded-xl cursor-pointer disabled:opacity-40"
              >
                Join
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100dvh - env(safe-area-inset-top, 0px))' }} className="flex flex-col items-center justify-center px-4 bg-[#FAF9F6] dark:bg-[#121210]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="text-neutral-400 dark:text-neutral-600 mb-4"
        >
          <RefreshCw className="w-8 h-8" />
        </motion.div>
        <p className="text-sm font-sans font-medium text-neutral-500 dark:text-neutral-400 tracking-wide">
          Polishing up your kitchen table list...
        </p>
      </div>
    );
  }

  if (isPasswordScreen) {
    return (
      <div style={{ minHeight: 'calc(100dvh - env(safe-area-inset-top, 0px))' }} className="flex flex-col items-center justify-center px-4 bg-[#FAF9F6] dark:bg-[#121210]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-xl relative text-center font-sans"
        >
          <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-200/50 dark:border-neutral-700/50">
            <Lock className="w-5 h-5 stroke-[2]" />
          </div>
          <h3 className="text-lg font-black text-neutral-800 dark:text-neutral-100 mb-2">Password Protected</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
            This cozy household space is secured. Enter your password to synchronize tasks, notes, and notepad tabs.
          </p>
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const hId = new URLSearchParams(window.location.search).get("h") || localStorage.getItem("breezy_household_id") || "";
              if (hId) {
                loadHousehold(hId, passwordInput.trim());
              }
            }}
            className="space-y-3.5"
          >
            <div>
              <input
                type="password"
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
                className="w-full text-center text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-700"
              />
              {passwordError && (
                <p className="text-[11px] text-red-500 font-semibold mt-2">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-neutral-800 dark:bg-neutral-100 hover:bg-neutral-900 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
            >
              Access Household Room
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-800/60 text-[10px] text-neutral-450 dark:text-neutral-500">
            <span>Want to start fresh? </span>
            <button
              onClick={() => {
                history.replaceState(null, "", window.location.pathname);
                localStorage.removeItem("breezy_household_id");
                setShowHouseholdSetup(true);
              }}
              className="font-bold underline text-neutral-650 dark:text-neutral-450 hover:text-neutral-850 dark:hover:text-neutral-200 cursor-pointer"
            >
              Create new household
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error || !household) {
    return (
      <div style={{ minHeight: 'calc(100dvh - env(safe-area-inset-top, 0px))' }} className="flex flex-col items-center justify-center px-4 max-w-sm mx-auto text-center bg-[#FAF9F6] dark:bg-[#121210]">
        <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mb-4">
          <House className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-100 mb-1">Room offline</h3>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-6">{error || "Household connection issue"}</p>
        <button
          onClick={() => { localStorage.removeItem("breezy_household_id"); setShowHouseholdSetup(true); }}
          className="px-4 py-2 bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold rounded-xl hover:bg-neutral-900 dark:hover:bg-neutral-200 cursor-pointer"
        >
          Create New Cozy Household
        </button>
      </div>
    );
  }

  return (
    <div className="pb-32 px-4 sm:px-6 bg-[#FAF9F6] dark:bg-[#121210] text-[#1a1a1a] dark:text-neutral-100 transition-colors duration-300 selection:bg-neutral-200 dark:selection:bg-neutral-800" style={{ minHeight: 'calc(100dvh - env(safe-area-inset-top, 0px))' }}>

      {/* iOS install banner — shown in Safari when opened via shared link */}
      {showIosBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 dark:bg-neutral-950 border-t border-neutral-700 px-4 py-3 flex items-center justify-between gap-3 font-sans shadow-2xl">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white">Install Toodoom</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">Tap <strong>Share →</strong> then <strong>Add to Home Screen</strong> to open this household link in the app.</p>
          </div>
          <button onClick={() => setShowIosBanner(false)} className="p-1.5 text-neutral-400 hover:text-white cursor-pointer shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto">

        {/* Header — always single row, title truncates, icons on right */}
        <header className="pt-2 pb-5 flex items-center gap-3 border-b border-neutral-200/50 dark:border-neutral-800/60 mb-6 min-w-0">
          <h1 className="text-lg sm:text-2xl font-black font-sans tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
            <span className="truncate">
              {currentTab === "tasks" ? household.name : currentTab === "notes" ? "Notes" : "Notepad"}
            </span>
            {currentTab === "tasks" && syncing && (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
            {currentTab === "tasks" && incompleteCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold leading-none bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/20 dark:border-neutral-700/30 shrink-0">
                {incompleteCount}
              </span>
            )}
          </h1>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Refresh button */}
            <button
              onClick={() => household?.id && loadHousehold(household.id, householdPassword || undefined)}
              disabled={syncing}
              className="flex items-center justify-center w-9 h-9 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-800 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-350 transition-all cursor-pointer shadow-sm disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            </button>

            {currentTab === "tasks" && (
              <>
                {/* Elegant Dropdown for List Actions */}
                <div className="relative">
                  <button
                    onClick={() => setIsActionsDropdownOpen(!isActionsDropdownOpen)}
                    className="flex items-center justify-center w-9 h-9 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-800 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-350 transition-all cursor-pointer shadow-sm"
                    title="List Actions"
                    id="header-actions-dropdown-trigger"
                  >
                    <MoreHorizontal className="w-4.5 h-4.5 text-neutral-600 dark:text-neutral-300" />
                  </button>

                  <AnimatePresence>
                    {isActionsDropdownOpen && (
                      <>
                        {/* Backdrop to close dropdown on click outside */}
                        <div
                          className="fixed inset-0 z-35"
                          onClick={() => setIsActionsDropdownOpen(false)}
                        />

                        {/* Floating Dropdown Panel */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 8 }}
                          transition={{ type: "spring", stiffness: 450, damping: 25 }}
                          style={{ width: "min(208px, calc(100vw - 1rem))" }}
                          className="absolute right-0 top-full mt-2 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-xl z-40 p-1.5 font-sans"
                        >
                          {/* AI Organize Button/Menu Item */}
                          <button
                            onClick={() => {
                              handleAISortList();
                              setIsActionsDropdownOpen(false);
                            }}
                            disabled={aiSorting || filteredTodos.length === 0}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
                          >
                            {aiSorting ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                                <span>Sorting aisles...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
                                <span>AI Organize List</span>
                              </>
                            )}
                          </button>

                          {/* Complete All Button/Menu Item */}
                          <button
                            onClick={() => {
                              handleCompleteAll();
                              setIsActionsDropdownOpen(false);
                            }}
                            disabled={filteredTodos.filter((t) => !t.completed).length === 0}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
                          >
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Complete All</span>
                          </button>

                          {/* Delete Completed Button/Menu Item */}
                          <button
                            onClick={() => {
                              handleDeleteCompleted();
                              setIsActionsDropdownOpen(false);
                            }}
                            disabled={filteredTodos.filter((t) => t.completed).length === 0}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800 text-red-650 dark:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                            <span>Delete Completed</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* Active Profile Chip — only owner can switch */}
            <div className="relative">
              <button
                onClick={() => activeProfile === household.owner && setShowProfilePicker(!showProfilePicker)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-all shadow-sm max-w-[130px] ${
                  activeProfile === household.owner ? "hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer" : "cursor-default opacity-80"
                }`}
                title={activeProfile === household.owner ? "Switch profile" : activeProfile || "No profile"}
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate hidden sm:inline">{activeProfile || "Set profile"}</span>
              </button>

              <AnimatePresence>
                {showProfilePicker && household && (
                  <>
                    <div className="fixed inset-0 z-35" onClick={() => setShowProfilePicker(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ type: "spring", stiffness: 450, damping: 25 }}
                      style={{ width: "min(192px, calc(100vw - 1rem))" }}
                      className="absolute right-0 top-full mt-2 max-h-[60vh] overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-xl z-40 p-2 font-sans"
                    >
                      <div className="px-2 py-1 text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                        Switch profile
                      </div>
                      {/* Dedupe: include owner even if not in members array */}
                      {Array.from(new Set([...(household.owner ? [household.owner] : []), ...household.members])).map((member) => (
                        <button
                          key={member}
                          onClick={() => handleSelectProfile(member)}
                          className={`flex items-center gap-2 w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            activeProfile === member
                              ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                          }`}
                        >
                          <User className="w-3 h-3 shrink-0" />
                          <span className="flex-1 truncate">{member}</span>
                          {activeProfile === member && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {currentTab === "tasks" && (
              <>
                {/* Custom Household Configurations Dialog (Icon Only Managed Internally) */}
                <HouseholdManager
                  householdId={household.id}
                  householdName={household.name}
                  members={household.members}
                  owner={household.owner || ""}
                  isOwner={activeProfile === household.owner && !!household.owner}
                  memberPins={household.memberPins || {}}
                  onUpdateName={handleUpdateHouseholdName}
                  onAddMember={handleAddMember}
                  onRemoveMember={handleRemoveMember}
                  onSetMemberPin={handleSetMemberPin}
                  onNewHousehold={() => {
                    localStorage.removeItem("breezy_household_id");
                    history.replaceState(null, "", window.location.pathname);
                    setHousehold(null);
                    setShowHouseholdSetup(true);
                    setSetupName("");
                    setSetupOwnerName("");
                    setSetupOwnerPin("");
                  }}
                  darkMode={darkMode}
                  onToggleDarkMode={() => setDarkMode(!darkMode)}
                  copied={copied}
                  onCopyLink={handleCopyLink}
                  appVersion={version}
                  visitedHouseholds={(() => { try { return JSON.parse(localStorage.getItem("breezy_visited_households") || "[]"); } catch { return []; } })()}
                  onSwitchHousehold={(id: string) => { localStorage.setItem("breezy_household_id", id); history.replaceState(null, "", `?h=${id}`); setActiveProfile(""); window.location.reload(); }}
                  hasPassword={!!household.password}
                  onUpdatePassword={handleUpdateHouseholdPassword}
                />
              </>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {currentTab === "tasks" ? (
            <motion.div
              key="tasks_view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.18 }}
            >
              {/* Dynamic Mobile Category Swiper / Desktop Filter Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* List Sidebar Filter & Creators */}
          <div className="lg:col-span-1 space-y-5 w-full overflow-hidden">
            <div>
              
              {/* Scrolling Categories Pill Container */}
              <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-2.5 lg:pb-0 scrollbar-none snap-x font-sans w-full min-w-0">
                {/* "All" general choice */}
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 snap-start border ${
                    selectedCategory === "all"
                      ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border-transparent shadow-sm"
                      : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/60 dark:hover:bg-neutral-800"
                  }`}
                  id="tab-all-categories"
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>All Tasks</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                    selectedCategory === "all"
                      ? "bg-neutral-300 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-200 font-bold"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                  }`}>
                    {household.todos.length}
                  </span>
                </button>

                {/* Real lists mapped */}
                {household.categories.map((cat) => {
                  const IconComp = ICON_MAP[cat.icon || "Tag"] || Tag;
                  const catCount = household.todos.filter((t) => t.categoryId === cat.id && !t.completed).length;
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 snap-start border ${
                        isSelected
                          ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 shadow-sm font-bold"
                          : "bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/60 dark:hover:bg-neutral-800"
                      }`}
                      style={{
                        borderLeftWidth: isSelected ? "4px" : "1px",
                        borderLeftColor: cat.color,
                      }}
                      id={`tab-category-${cat.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(cat);
                          }}
                          className="p-1 rounded-md hover:bg-neutral-100/80 dark:hover:bg-neutral-800 -ml-1.5 transition-all cursor-pointer group/icon flex items-center justify-center"
                          title="Click to change list icon & color"
                        >
                          <IconComp className="w-3.5 h-3.5 shrink-0 transition-transform group-hover/icon:scale-120" style={{ color: cat.color }} />
                        </span>
                        <span className="truncate max-w-[100px]">{cat.name}</span>
                      </div>
                      <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded-md">
                        {catCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Core App Body Tasks Grid */}
          <div className="lg:col-span-3 space-y-6">

            {/* Core Stack Tasks List container */}
            <div className="space-y-4">
              
              {/* Quick entry form card resembling a real task list item */}
              <div className="relative z-30 animate-fade-in">
                <form 
                  onSubmit={handleCreateTodo} 
                  className="group relative flex items-start justify-between gap-3.5 px-4 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-md dark:hover:shadow-neutral-950/40 transition-all focus-within:border-neutral-300 dark:focus-within:border-neutral-700/85 focus-within:shadow-md"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Subtle tactile circular icon representing the uncompleted task checkbox */}
                    <div className="relative flex items-center justify-center w-6 h-6 rounded-full border-2 border-dashed border-neutral-200 dark:border-neutral-800 shrink-0 mt-0.5 text-neutral-400 dark:text-neutral-500">
                      <Plus className="w-3.5 h-3.5" />
                    </div>

                    {/* Task text input stream & notes alignment */}
                    <div className="flex-1 min-w-0">
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="Type @list to assign, #tag to label (e.g. Get organic milk @groceries #fresh)"
                          value={newTask}
                          onChange={(e) => {
                            setNewTask(e.target.value);
                            setCursorIndex(e.target.selectionStart || 0);
                            setShowSuggestions(true);
                            setSelectedIndex(0);
                          }}
                          onKeyUp={(e) => {
                            const target = e.target as HTMLInputElement;
                            setCursorIndex(target.selectionStart || 0);
                          }}
                          onSelect={(e) => {
                            const target = e.target as HTMLInputElement;
                            setCursorIndex(target.selectionStart || 0);
                          }}
                          onFocus={(e) => {
                            const target = e.target as HTMLInputElement;
                            setCursorIndex(target.selectionStart || 0);
                            setShowSuggestions(true);
                            setSelectedIndex(0);
                          }}
                          onBlur={() => {
                            // Small delay to allow clicking suggestions before overlay unmounts
                            setTimeout(() => {
                              setShowSuggestions(false);
                            }, 200);
                          }}
                          onKeyDown={(e) => {
                            if (showSuggestions && filteredSuggestions.length > 0) {
                              if (e.key === "ArrowDown") {
                                e.preventDefault();
                                setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length);
                              } else if (e.key === "ArrowUp") {
                                e.preventDefault();
                                setSelectedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
                              } else if (e.key === "Enter" || e.key === "Tab") {
                                e.preventDefault();
                                insertSuggestion(filteredSuggestions[selectedIndex]);
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                setShowSuggestions(false);
                              }
                            }
                          }}
                          className="w-full text-sm font-sans font-medium text-neutral-800 dark:text-neutral-100 placeholder-neutral-300 dark:placeholder-neutral-600 bg-transparent border-none p-0 focus:outline-none focus:ring-0 leading-tight"
                          id="new-task-text-input"
                          autoComplete="off"
                        />

                        {/* Suggestions list popup overlay */}
                        <AnimatePresence>
                          {showSuggestions && filteredSuggestions.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.98, y: 4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.98, y: 4 }}
                              transition={{ duration: 0.12, ease: "easeOut" }}
                              className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#181817] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-50 overflow-hidden text-left"
                            >
                              <div className="px-3 py-2 bg-neutral-50/80 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 font-sans tracking-wide">
                                <span className="font-bold uppercase tracking-wider">
                                  Suggested {activeToken?.type === "category" ? "Lists" : "Tags"}
                                </span>
                                <span>⇅ Navigate · ↵ Select</span>
                              </div>
                              <ul className="max-h-52 overflow-y-auto divide-y divide-neutral-50 dark:divide-neutral-900/60 font-sans text-[13px]">
                                {filteredSuggestions.map((suggestion, idx) => {
                                  const isSelected = idx === selectedIndex;
                                  const isCategory = activeToken?.type === "category";
                                  
                                  // Find category color if it exists
                                  let catColor = undefined;
                                  if (isCategory && household) {
                                    const matchedCat = household.categories.find(
                                      (c) => c.name.toLowerCase() === suggestion.toLowerCase()
                                    );
                                    if (matchedCat) catColor = matchedCat.color;
                                  }

                                  return (
                                    <li
                                      key={suggestion}
                                      onMouseDown={(e) => {
                                        // Prevent default to avoid blur firing before selection completes
                                        e.preventDefault();
                                        insertSuggestion(suggestion);
                                      }}
                                      className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-all ${
                                        isSelected
                                          ? "bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-l-4 border-neutral-800 dark:border-neutral-100 pl-2.5"
                                          : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {isCategory ? (
                                          <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: catColor || "#999" }}
                                          />
                                        ) : (
                                          <Tag className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                        )}
                                        <span className={isSelected ? "font-semibold" : "font-medium"}>
                                          {isCategory ? suggestion : `#${suggestion}`}
                                        </span>
                                      </div>
                                      
                                      {isSelected && (
                                        <span className="text-[10px] bg-neutral-200/60 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded font-mono font-bold">
                                          ENTER
                                        </span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Notes text entry mirroring list item notes style */}
                      <input
                        type="text"
                        placeholder="Add optional notes or descriptions..."
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        className="block w-full text-xs font-sans text-neutral-500 dark:text-neutral-400 placeholder-neutral-400 dark:placeholder-neutral-600 bg-transparent border-none p-0 mt-1 focus:outline-none focus:ring-0 leading-tight"
                        id="new-task-notes-input"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {/* Submit trigger button aligning exactly on the right */}
                  <div className="flex items-center gap-2 shrink-0 self-center pl-1">
                    <button
                      type="submit"
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-800 dark:bg-neutral-100 hover:bg-neutral-900 dark:hover:bg-white text-white dark:text-neutral-900 transition-all shadow-sm shrink-0 active:scale-95 cursor-pointer"
                      id="btn-add-todo"
                      title="Add Task"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>

              {sortBy === "ai" && aiGroupedActive ? (
                /* Grouped Active Layout for AI Department/Location sequence */
                <div className="space-y-6">
                  {Object.entries(aiGroupedActive.groups).map(([groupName, groupTodos]) => {
                    const typedTodos = groupTodos as TodoItem[];
                    return (
                      <div key={groupName} className="space-y-2">
                         <div className="flex items-center gap-2 px-1">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/10 border border-amber-200 text-amber-600 text-[10px] font-bold">
                            ✧
                          </span>
                          <h4 className="text-[10px] sm:text-xs font-black text-neutral-700 uppercase tracking-widest font-sans">
                            {groupName}
                          </h4>
                          <span className="text-[9px] bg-neutral-100 text-neutral-400 px-1.5 py-0.5 rounded-full font-sans family-mono">
                            {typedTodos.length}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <AnimatePresence initial={false}>
                            {typedTodos.map((todo) => {
                              const category = household.categories.find(
                                (c) => c.id === todo.categoryId
                              ) || { id: "cat-misc", name: "Misc", color: "#737373" };

                              return (
                                <TaskItem
                                  key={todo.id}
                                  todo={todo}
                                  category={category}
                                  onToggleComplete={handleToggleComplete}
                                  onUpdateText={handleUpdateText}
                                  onDelete={handleDeleteTodo}
                                />
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}

                  {/* Completed items grouped in their cozy compartment under active ones */}
                  {aiGroupedActive.completed.length > 0 && (
                    <div className="space-y-2 pt-5 border-t border-neutral-100 dark:border-neutral-800/40">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 text-[10px] font-bold">
                            ✓
                          </span>
                          <h4 className="text-[10px] sm:text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-sans">
                            Completed Tasks ({aiGroupedActive.completed.length})
                          </h4>
                        </div>
                        
                        <button
                          onClick={() => setShowCompleted(!showCompleted)}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer shadow-sm"
                          id="toggle-show-completed-ai"
                        >
                          {showCompleted ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                              <span>Shown</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </div>

                      {showCompleted && (
                        <div className="space-y-2">
                          <AnimatePresence initial={false}>
                            {aiGroupedActive.completed.map((todo) => {
                              const category = household.categories.find(
                                (c) => c.id === todo.categoryId
                              ) || { id: "cat-misc", name: "Misc", color: "#737373" };

                              return (
                                <TaskItem
                                  key={todo.id}
                                  todo={todo}
                                  category={category}
                                  onToggleComplete={handleToggleComplete}
                                  onUpdateText={handleUpdateText}
                                  onDelete={handleDeleteTodo}
                                />
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  )}

                  {filteredTodos.length === 0 && (
                    <div className="text-center py-10 bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
                      <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 font-sans">List is empty</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Standard chronological or alphabetical layouts */
                <div className="space-y-4">
                  {/* Active/New Tasks Section */}
                  {sortedActiveTodos.length > 0 ? (
                    <div className="space-y-2">
                      <AnimatePresence initial={false}>
                        {sortedActiveTodos.map((todo) => {
                          const category = household.categories.find(
                            (c) => c.id === todo.categoryId
                          ) || { id: "cat-misc", name: "Misc", color: "#737373" };

                          return (
                            <TaskItem
                              key={todo.id}
                              todo={todo}
                              category={category}
                              onToggleComplete={handleToggleComplete}
                              onUpdateText={handleUpdateText}
                              onDelete={handleDeleteTodo}
                            />
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  ) : null}

                  {/* Empty state displayed only when there are no active/new items */}
                  {sortedActiveTodos.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-neutral-900 border border-dashed border-neutral-200/65 dark:border-neutral-800 rounded-2xl shadow-sm"
                    >
                      <div className="w-10 h-10 bg-neutral-50 dark:bg-neutral-950 text-neutral-300 dark:text-neutral-600 rounded-full flex items-center justify-center mb-3 border border-neutral-100 dark:border-neutral-800/40">
                        <Check className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-200 mb-0.5 font-sans">
                        All clean in this corner!
                      </p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-xs mx-auto font-sans">
                        There are no active tasks left in this selection. Add some work or pick a different filter.
                      </p>
                    </motion.div>
                  )}

                  {/* Divider and Completed toggle filter bar placed ABOVE completed items and BELOW new items */}
                  {sortedCompletedTodos.length > 0 && (
                    <div className="flex items-center justify-between pt-5 pb-1 border-t border-neutral-100 dark:border-neutral-800/40 text-xs text-neutral-400 dark:text-neutral-500">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 text-[10px] font-bold">
                          ✓
                        </span>
                        <h4 className="text-[10px] sm:text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-sans">
                          Completed ({sortedCompletedTodos.length})
                        </h4>
                      </div>
                      
                      <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer shadow-sm animate-fade-in"
                        id="toggle-show-completed"
                      >
                        {showCompleted ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                            <span>Shown</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Render Completed items below the filter when showCompleted is true */}
                  {showCompleted && sortedCompletedTodos.length > 0 && (
                    <div className="space-y-2">
                      <AnimatePresence initial={false}>
                        {sortedCompletedTodos.map((todo) => {
                          const category = household.categories.find(
                            (c) => c.id === todo.categoryId
                          ) || { id: "cat-misc", name: "Misc", color: "#737373" };

                          return (
                            <TaskItem
                              key={todo.id}
                              todo={todo}
                              category={category}
                              onToggleComplete={handleToggleComplete}
                              onUpdateText={handleUpdateText}
                              onDelete={handleDeleteTodo}
                            />
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </motion.div>
    ) : currentTab === "notes" ? (
      <motion.div
        key="notes_view"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.18 }}
        className="space-y-6"
      >
        {/* Dynamic Mobile Category Swiper / Desktop Filter Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Notes List Sidebar Filter Column (Same Look as Tasks) */}
          <div className="lg:col-span-1 space-y-5 w-full overflow-hidden">
            <div>
              {/* Scrolling Categories Pill Container */}
              <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-2.5 lg:pb-0 scrollbar-none snap-x font-sans w-full min-w-0">
                {/* "All Notes" general choice */}
                <button
                  onClick={() => setSelectedNoteCategory("all")}
                  className={`flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 snap-start border ${
                    selectedNoteCategory === "all"
                      ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border-transparent shadow-sm"
                      : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/60 dark:hover:bg-neutral-800"
                  }`}
                  id="tab-all-notes-category"
                >
                  <div className="flex items-center gap-2">
                    <StickyNote className="w-3.5 h-3.5" />
                    <span>All Notes</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                    selectedNoteCategory === "all"
                      ? "bg-neutral-300 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-200 font-bold"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                  }`}>
                    {privateNotes.length}
                  </span>
                </button>

                {/* Note-specific categories */}
                {(household.noteCategories || DEFAULT_NOTE_CATEGORIES).map((cat) => {
                  const IconComp = ICON_MAP[cat.icon || "Tag"] || Tag;
                  const catCount = privateNotes.filter((note) => {
                    const matchingCat = getNoteCategory(note.text, household.noteCategories || DEFAULT_NOTE_CATEGORIES);
                    return matchingCat?.id === cat.id;
                  }).length;
                  const isSelected = selectedNoteCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedNoteCategory(cat.id)}
                      className={`flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 snap-start border ${
                        isSelected
                          ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 shadow-sm font-bold"
                          : "bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/60 dark:hover:bg-neutral-800"
                      }`}
                      style={{
                        borderLeftWidth: isSelected ? "4px" : "1px",
                        borderLeftColor: cat.color,
                      }}
                      id={`note-category-${cat.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingNoteCategory(cat);
                          }}
                          className="p-1 rounded-md hover:bg-neutral-100/80 dark:hover:bg-neutral-800 -ml-1.5 transition-all cursor-pointer group/icon flex items-center justify-center"
                          title="Click to change category icon & color"
                        >
                          <IconComp className="w-3.5 h-3.5 shrink-0 transition-transform group-hover/icon:scale-120" style={{ color: cat.color }} />
                        </span>
                        <span className="truncate max-w-[100px]">{cat.name}</span>
                      </div>
                      <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded-md">
                        {catCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Notes Main Area (Right Side, 3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            


            {/* Sticky Notes Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {/* Creator Sticky Card (First item inside the board) */}
              <div className="bg-white dark:bg-neutral-900/40 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl p-5 flex flex-col justify-between min-h-[190px] shadow-sm relative group">
                <div className="flex-1 flex flex-col pt-1">
                  <MentionTextarea
                    value={newNoteInput}
                    onChange={setNewNoteInput}
                    placeholder="Type a household note... Auto-saves on blur or Ctrl+Enter. Use @Category (like @Groceries) to categorize, #tags to label."
                    className="w-full flex-1 bg-transparent resize-none border-none outline-none text-sm leading-relaxed text-[#1a1a1a] dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-0 p-0 font-sans"
                    id="new-note-textarea"
                    categories={household.noteCategories || DEFAULT_NOTE_CATEGORIES}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        if (newNoteInput.trim()) {
                          handleAddNote(newNoteInput);
                          setNewNoteInput("");
                        }
                      }
                    }}
                    onBlur={() => {
                      if (newNoteInput.trim()) {
                        handleAddNote(newNoteInput);
                        setNewNoteInput("");
                      }
                    }}
                  />
                </div>
              </div>

              <AnimatePresence initial={false}>
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    categories={household.noteCategories || DEFAULT_NOTE_CATEGORIES}
                    darkMode={darkMode}
                    onUpdate={handleUpdateNote}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* No notes state inside right col */}
            {filteredNotes.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-neutral-900 border border-dashed border-neutral-250 dark:border-neutral-800 rounded-2xl shadow-sm"
              >
                <div className="w-10 h-10 bg-neutral-50 dark:bg-neutral-950 text-neutral-300 dark:text-neutral-650 rounded-full flex items-center justify-center mb-3 border border-neutral-100 dark:border-neutral-800/40">
                  <StickyNote className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-200 mb-0.5 font-sans">
                  No notes in this category
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-xs mx-auto font-sans">
                  Write down lists or ideas and mention @{selectedNoteCategory !== "all" ? (household.noteCategories || DEFAULT_NOTE_CATEGORIES).find(c => c.id === selectedNoteCategory)?.name : "Category"} to organize.
                </p>
              </motion.div>
            )}

          </div>
        </div>
      </motion.div>
    ) : (
      <motion.div
        key="notepad_view"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.18 }}
      >
        {/* Multitabs Notepad Tab Bar */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-2 scrollbar-none font-sans">
          {/* New Tab Button */}
          <button
            onClick={handleAddNotepadTab}
            className="flex items-center justify-center min-w-8 h-8 w-8 rounded-lg bg-neutral-100 hover:bg-neutral-200/90 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-all cursor-pointer shadow-sm shrink-0"
            title="Create new notepad tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* List of tabs */}
          {notepadTabs.map((tab) => {
            const isActive = tab.id === activeNotepadTabId;
            const isEditing = tab.id === editingTabId;
            return (
              <div
                key={tab.id}
                onClick={() => {
                  if (!isEditing) {
                    setActiveNotepadTabId(tab.id);
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer whitespace-nowrap shadow-sm group ${
                  isActive
                    ? "bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-950 ring-2 ring-neutral-900/10 dark:ring-white/10"
                    : "bg-white hover:bg-neutral-50 dark:bg-neutral-950 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 border-neutral-200 dark:border-neutral-800/80"
                }`}
                title={isEditing ? undefined : "Double click to rename"}
              >
                {isEditing ? (
                  <input
                    type="text"
                    defaultValue={tab.title}
                    autoFocus
                    onBlur={(e) => {
                      handleFinishRenameTab(tab.id, e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleFinishRenameTab(tab.id, e.currentTarget.value);
                      } else if (e.key === "Escape") {
                        setEditingTabId(null);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-1.5 py-0.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 w-24 font-bold"
                  />
                ) : (
                  <span className="flex items-center gap-1">
                    <span 
                      onDoubleClick={() => setEditingTabId(tab.id)}
                      className="select-none"
                    >
                      {tab.title}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTabId(tab.id);
                      }}
                      className="sm:opacity-0 sm:group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-opacity rounded cursor-pointer"
                      title="Rename tab"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}
                
                {/* Delete/Close Tab button inline */}
                {notepadTabs.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteNotepadTab(tab.id, e)}
                    className="p-0.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Delete tab"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Notepad Editor View — fills available viewport height */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/80 rounded-2xl p-6 md:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.01)] flex flex-col relative" style={{ minHeight: 'calc(100dvh - 260px)' }}>
          {/* Writing canvas */}
          <div className="flex-1 flex flex-col">
            <textarea
              placeholder="Start writing..."
              value={notepadContent}
              onChange={(e) => {
                isEditingNotepadRef.current = true;
                handleNotepadChange(e.target.value);
              }}
              onBlur={handleNotepadBlur}
              className="w-full flex-1 bg-transparent resize-none border-none outline-none text-sm md:text-base leading-relaxed text-neutral-800 dark:text-neutral-100 placeholder-neutral-350 dark:placeholder-neutral-700 focus:ring-0 p-0 font-sans"
            />
          </div>

          {/* Status footer inside card */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800/40 text-[10px] text-neutral-400 dark:text-neutral-500 font-sans font-semibold uppercase tracking-wider">
            <span>{notepadContent.split(/\s+/).filter(Boolean).length} Words</span>
            <span>{notepadContent.length} Characters</span>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>

        {/* Cozy Segmented Tab Bar - floating & anchored at the bottom perfectly */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-45 max-w-[95%]">
          <div className="bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md p-1 rounded-full border border-neutral-200/60 dark:border-neutral-800/85 flex items-center gap-0.5 shadow-lg font-sans">
            <button
              onClick={() => setCurrentTab("tasks")}
              className="relative flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer z-10"
              id="tab-btn-tasks"
            >
              <LayoutGrid className={`w-3.5 h-3.5 relative z-10 ${currentTab === "tasks" ? "text-neutral-800 dark:text-neutral-100" : "text-neutral-400 dark:text-neutral-500"}`} />
              <span className={`relative z-10 ${currentTab === "tasks" ? "text-neutral-800 dark:text-neutral-100 font-extrabold" : "text-neutral-500 dark:text-neutral-400 font-semibold"}`}>Tasks</span>
              {currentTab === "tasks" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-neutral-200/20 dark:border-neutral-700/30"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  style={{ originY: "0px" }}
                />
              )}
            </button>
            <button
              onClick={() => setCurrentTab("notes")}
              className="relative flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer z-10"
              id="tab-btn-notes"
            >
              <StickyNote className={`w-3.5 h-3.5 relative z-10 ${currentTab === "notes" ? "text-neutral-800 dark:text-neutral-100" : "text-neutral-400 dark:text-neutral-500"}`} />
              <span className={`relative z-10 ${currentTab === "notes" ? "text-neutral-800 dark:text-neutral-100 font-extrabold" : "text-neutral-500 dark:text-neutral-400 font-semibold"}`}>Notes</span>
              {currentTab === "notes" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-neutral-200/20 dark:border-neutral-700/30"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  style={{ originY: "0px" }}
                />
              )}
            </button>
            <button
              onClick={() => setCurrentTab("notepad")}
              className="relative flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer z-10"
              id="tab-btn-notepad"
            >
              <Notebook className={`w-3.5 h-3.5 relative z-10 ${currentTab === "notepad" ? "text-neutral-800 dark:text-neutral-100" : "text-neutral-400 dark:text-neutral-500"}`} />
              <span className={`relative z-10 ${currentTab === "notepad" ? "text-neutral-800 dark:text-neutral-100 font-extrabold" : "text-neutral-500 dark:text-neutral-400 font-semibold"}`}>Notepad</span>
              {currentTab === "notepad" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-neutral-200/20 dark:border-neutral-700/30"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  style={{ originY: "0px" }}
                />
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Task Category Customizer Modal */}
      <AnimatePresence>
        {editingCategory && (
          <CategoryEditModal
            category={editingCategory}
            onClose={() => setEditingCategory(null)}
            onSave={handleUpdateCategory}
          />
        )}
      </AnimatePresence>

      {/* Note Category Customizer Modal */}
      <AnimatePresence>
        {editingNoteCategory && (
          <CategoryEditModal
            category={editingNoteCategory}
            onClose={() => setEditingNoteCategory(null)}
            onSave={handleUpdateNoteCategory}
          />
        )}
      </AnimatePresence>

      {/* Profile Picker Modal — shown on first visit to a household */}
      <AnimatePresence>
        {profileModalOpen && household && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 pb-8 sm:pb-0">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="w-full max-w-xs bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl font-sans"
            >
              <div className="text-center mb-5">
                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </div>
                <h3 className="text-base font-black text-neutral-800 dark:text-neutral-100 mb-1">Who are you?</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {household.members.length > 0
                    ? "Pick your profile to continue."
                    : `Ask ${household.owner || "the owner"} to add you via Settings.`}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {Array.from(new Set([...(household.owner ? [household.owner] : []), ...household.members])).map((member) => {
                  const hasPin = !!(household.memberPins?.[member]);
                  const isPending = pendingProfile === member;
                  return (
                    <div key={member}>
                      <button
                        onClick={() => {
                          if (hasPin) {
                            setPendingProfile(isPending ? null : member);
                            setPinInput("");
                            setPinError(false);
                          } else {
                            handleSelectProfile(member);
                          }
                        }}
                        className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border active:scale-[0.98] ${
                          isPending
                            ? "bg-neutral-100 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100"
                            : "bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-neutral-100 dark:border-neutral-700/50 text-neutral-700 dark:text-neutral-200"
                        }`}
                      >
                        <User className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
                        <span className="flex-1 text-left">{member}</span>
                        {hasPin && <Lock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
                      </button>

                      {isPending && hasPin && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (pinInput === household.memberPins?.[member]) {
                              handleSelectProfile(member);
                              setPendingProfile(null);
                              setPinInput("");
                              setPinError(false);
                            } else {
                              setPinError(true);
                            }
                          }}
                          className="flex gap-2 mt-1.5"
                        >
                          <input
                            type="password"
                            placeholder="Enter PIN..."
                            value={pinInput}
                            onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                            autoFocus
                            className={`flex-1 text-sm bg-neutral-50 dark:bg-neutral-900 border rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 ${
                              pinError
                                ? "border-red-400 focus:ring-red-400"
                                : "border-neutral-200 dark:border-neutral-700 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                            }`}
                          />
                          <button type="submit" className="px-3.5 py-2 bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold rounded-xl cursor-pointer">
                            <Check className="w-4 h-4" />
                          </button>
                        </form>
                      )}
                      {isPending && pinError && (
                        <p className="text-[11px] text-red-500 mt-1 px-1">Wrong PIN</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
