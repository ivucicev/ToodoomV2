import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  ShoppingBag, 
  CheckSquare, 
  Home, 
  Utensils, 
  Sparkles, 
  Tag, 
  Coffee, 
  Heart, 
  Sprout, 
  Hammer, 
  Compass, 
  Calendar, 
  Book, 
  Smile,
  X,
  Check
} from "lucide-react";
import { Category } from "../types";

// Dynamic map matching high-quality components inside the modal
const PRESET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag,
  CheckSquare,
  Home,
  Utensils,
  Sparkles,
  Tag,
  Coffee,
  Heart,
  Sprout,
  Hammer,
  Compass,
  Calendar,
  Book,
  Smile,
};

const PRESET_COLORS = [
  "#EC4899", // Pink
  "#F43F5E", // Rose
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#EAB308", // Yellow
  "#10B981", // Green
  "#059669", // Emerald
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#0EA5E9", // Sky
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#D946EF", // Fuchsia
  "#4B5563"  // Charcoal
];

interface CategoryEditModalProps {
  category: Category;
  onClose: () => void;
  onSave: (updatedCategory: Category) => void;
}

export const CategoryEditModal: React.FC<CategoryEditModalProps> = ({
  category,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(category.name);
  const [selectedColor, setSelectedColor] = useState(category.color);
  const [selectedIcon, setSelectedIcon] = useState(category.icon || "Tag");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...category,
      name: name.trim(),
      color: selectedColor,
      icon: selectedIcon,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark frosted overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
      />

      {/* PopUp Dialog Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-100/80 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden z-10"
      >
        <header className="flex items-center justify-between px-6 py-5 border-b border-neutral-50 dark:border-neutral-800/60">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center border border-neutral-100 dark:border-neutral-800"
              style={{ backgroundColor: `${selectedColor}12` }}
            >
              {(() => {
                const IconComp = PRESET_ICONS[selectedIcon] || Tag;
                return <IconComp className="w-4 h-4" style={{ color: selectedColor }} />;
              })()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 font-sans">
                Customize Custom List
              </h3>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-sans tracking-wide">
                Update list name, visual icon, and border color
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-neutral-650 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* List Name Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-bold font-sans">
              List Title / Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. Yard work, Baby care..."
              className="w-full text-xs font-sans bg-neutral-50/50 dark:bg-neutral-950/50 border border-neutral-100 dark:border-neutral-800 rounded-xl px-3.5 py-3 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-neutral-300 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-neutral-950 transition-all font-medium"
              id="edit-category-name"
            />
          </div>

          {/* Color Palette Grid */}
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-bold font-sans">
              Custom Theme Color
            </label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((color) => {
                const isSelected = selectedColor.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className="aspect-square rounded-xl cursor-pointer relative flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-white/40 shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-white stroke-[3.5px]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon Selection Grid */}
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-bold font-sans">
              Select list icon
            </label>
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(PRESET_ICONS).map(([key, IconComponent]) => {
                const isSelected = selectedIcon === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedIcon(key)}
                    className={`aspect-square rounded-xl cursor-pointer flex items-center justify-center border transition-all hover:scale-105 active:scale-95 ${
                      isSelected
                        ? "bg-neutral-900 dark:bg-neutral-100 border-neutral-900 dark:border-neutral-100 text-white dark:text-neutral-900 shadow-md shadow-neutral-900/10"
                        : "bg-white dark:bg-neutral-900 border-neutral-100/80 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:border-neutral-250 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                    title={key}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-neutral-600 dark:text-neutral-450 bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all cursor-pointer font-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-bold text-white dark:text-neutral-900 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-xl transition-all shadow-md shadow-neutral-900/10 cursor-pointer font-sans"
            >
              Save Customizations
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
