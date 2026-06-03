import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, Check, Edit2, X, User } from "lucide-react";
import { TodoItem, Category } from "../types";

interface TaskItemProps {
  todo: TodoItem;
  category: Category;
  onToggleComplete: (id: string) => void;
  onUpdateText: (id: string, text: string, notes?: string) => void;
  onDelete: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  todo,
  category,
  onToggleComplete,
  onUpdateText,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(() => {
    let t = todo.text;
    if (todo.tags && todo.tags.length > 0) {
      t += " " + todo.tags.map((tg) => `#${tg}`).join(" ");
    }
    return t;
  });
  const [editNotes, setEditNotes] = useState(todo.notes || "");

  // Sync editing text whenever the todo model (text, tags, or notes) is updated remotely
  useEffect(() => {
    let t = todo.text;
    if (todo.tags && todo.tags.length > 0) {
      t += " " + todo.tags.map((tg) => `#${tg}`).join(" ");
    }
    setEditText(t);
    setEditNotes(todo.notes || "");
  }, [todo.text, todo.tags, todo.notes]);

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onUpdateText(todo.id, editText.trim(), editNotes);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      let t = todo.text;
      if (todo.tags && todo.tags.length > 0) {
        t += " " + todo.tags.map((tg) => `#${tg}`).join(" ");
      }
      setEditText(t);
      setEditNotes(todo.notes || "");
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: todo.completed ? 0.32 : 1, y: 0 }}
      exit={{ opacity: 0, y: -4, transition: { duration: 0.12, ease: "easeIn" } }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className={`group relative flex ${isEditing || todo.notes ? "items-start" : "items-center"} justify-between gap-3 px-4 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-md dark:hover:shadow-neutral-950/40 transition-[box-shadow,border-color] focus-within:border-neutral-300 dark:focus-within:border-neutral-700/85 focus-within:shadow-md ${
        todo.completed
          ? "bg-neutral-50/20 dark:bg-neutral-950/10 border-neutral-100/30 dark:border-neutral-900/20 blur-[0.5px] grayscale select-none"
          : ""
      }`}
    >
      <div className={`flex ${isEditing || todo.notes ? "items-start" : "items-center"} gap-3.5 flex-1 min-w-0`}>
        {/* Satisfying Tactile Checkbox */}
        {isEditing ? (
          <div 
            className="relative flex items-center justify-center w-6 h-6 rounded-full border-2 border-dashed shrink-0 mt-0.5 text-neutral-400 dark:text-neutral-500"
            style={{ borderColor: category.color }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} />
          </div>
        ) : (
          <button
            onClick={() => onToggleComplete(todo.id)}
            className={`relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 shrink-0 cursor-pointer ${
              todo.completed
                ? "scale-100"
                : "border-neutral-200 dark:border-neutral-800 hover:scale-105 active:scale-95"
            }`}
            style={{
              borderColor: todo.completed ? category.color : undefined,
              backgroundColor: todo.completed ? `${category.color}15` : "transparent"
            }}
            aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
            id={`checkbox-${todo.id}`}
          >
            <AnimatePresence mode="wait">
              {todo.completed && (
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 30 }}
                  transition={{ type: "spring", stiffness: 450, damping: 20 }}
                >
                  <Check
                    className="w-4 h-4"
                    style={{ color: category.color }}
                    strokeWidth={3}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        )}

        {/* Task Text with Edit Mode */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full text-sm font-sans font-medium text-neutral-800 dark:text-neutral-100 placeholder-neutral-300 dark:placeholder-neutral-600 bg-transparent border-none p-0 focus:outline-none focus:ring-0 leading-tight"
                  placeholder="Task title..."
                  autoFocus
                />
              </div>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                onKeyDown={handleKeyDown}
                className="block w-full text-xs font-sans text-neutral-500 dark:text-neutral-400 placeholder-neutral-400 dark:placeholder-neutral-600 bg-transparent border-none p-0 mt-1 focus:outline-none focus:ring-0 leading-tight"
                placeholder="Add optional notes or descriptions..."
              />
            </div>
          ) : (
            <div className="relative">
              <span
                onClick={() => !todo.completed && setIsEditing(true)}
                className={`block text-sm font-sans tracking-wide text-neutral-700 dark:text-neutral-300 select-none break-words cursor-text ${
                  todo.completed
                    ? "text-neutral-400 dark:text-neutral-500 line-through decoration-neutral-300 dark:decoration-neutral-700 decoration-1.5 duration-500"
                    : "hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {todo.text}
              </span>

              {/* Tag Badges rendering natively and beautifully under list item titles */}
              {todo.tags && todo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {todo.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 font-medium font-mono text-[9px] tracking-wide transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {todo.notes && (
                <span className="block text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-1 whitespace-pre-wrap">
                  {todo.notes}
                </span>
              )}

              {/* Attribution: who created or completed */}
              {!todo.completed && todo.createdBy && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-neutral-350 dark:text-neutral-600 font-sans">
                  <User className="w-2.5 h-2.5" />
                  {todo.createdBy}
                </span>
              )}
              {todo.completed && todo.completedBy && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-neutral-350 dark:text-neutral-600 font-sans">
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  {todo.completedBy}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Control Right Side (Edit/Delete Actions Only) */}
      <div className="flex items-center gap-2 shrink-0 self-start mt-0.5">
        {isEditing ? (
          <div className="flex items-center gap-1.5 pl-1">
            <button
              onClick={handleSaveEdit}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-800 dark:bg-neutral-100 hover:bg-neutral-900 dark:hover:bg-white text-white dark:text-neutral-900 transition-all shadow-sm shrink-0 active:scale-95 cursor-pointer"
              title="Save changes"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                let t = todo.text;
                if (todo.tags && todo.tags.length > 0) {
                  t += " " + todo.tags.map((tg) => `#${tg}`).join(" ");
                }
                setEditText(t);
                setEditNotes(todo.notes || "");
                setIsEditing(false);
              }}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-50 dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-all border border-neutral-200/60 dark:border-neutral-700/50 shrink-0 active:scale-95 cursor-pointer"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
            {!todo.completed && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                title="Edit task"
                id={`edit-btn-${todo.id}`}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => onDelete(todo.id)}
              className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
              title="Delete task"
              id={`delete-btn-${todo.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
