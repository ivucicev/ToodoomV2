import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, X, Plus, Edit2, Check, Settings, Sparkles, Lock, Unlock } from "lucide-react";

interface HouseholdManagerProps {
  householdName: string;
  members: string[];
  onUpdateName: (name: string) => void;
  onAddMember: (name: string) => void;
  onRemoveMember: (name: string) => void;
  hasPassword?: boolean;
  onUpdatePassword?: (password: string) => void;
}

export const HouseholdManager: React.FC<HouseholdManagerProps> = ({
  householdName,
  members,
  onUpdateName,
  onAddMember,
  onRemoveMember,
  hasPassword = false,
  onUpdatePassword,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(householdName);
  const [newMemberName, setNewMemberName] = useState("");

  const handleSaveName = () => {
    if (newName.trim() && newName.trim() !== householdName) {
      onUpdateName(newName.trim());
    }
    setIsEditingName(false);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newMemberName.trim();
    if (val && !members.includes(val) && val.toLowerCase() !== "everyone") {
      onAddMember(val);
      setNewMemberName("");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-2 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-800 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-350 transition-all cursor-pointer shadow-sm"
        title="Household Settings"
        id="household-settings-toggle"
      >
        <Settings className="w-4 h-4 stroke-[2]" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click closer */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />

            {/* Float Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
              className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-xl z-40 p-5 overflow-hidden font-sans"
            >
              <div className="flex items-center justify-between border-b border-neutral-50 dark:border-neutral-800/60 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  <span className="font-bold text-neutral-800 dark:text-neutral-100 text-sm">Household Hub</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Edit Household Name */}
              <div className="mb-4">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">
                  Household Name
                </label>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg"
                    >
                      <Check className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group bg-neutral-50/50 dark:bg-neutral-950/50 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 truncate">
                      {householdName}
                    </span>
                    <button
                      onClick={() => {
                        setNewName(householdName);
                        setIsEditingName(true);
                      }}
                      className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Members Manager */}
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">
                  Household Members
                </label>

                {/* Member chips with quick deletion */}
                <div className="flex flex-wrap gap-1.5 mb-3.5 max-h-28 overflow-y-auto">
                  {members.map((member) => (
                    <div
                      key={member}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-50 dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 text-xs rounded-full border border-neutral-100 dark:border-neutral-800 font-medium"
                    >
                      <span>{member}</span>
                      {member !== "Everyone" && (
                        <button
                          onClick={() => onRemoveMember(member)}
                          className="p-0.5 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-full text-neutral-400 dark:text-neutral-500 hover:text-red-500 cursor-pointer ml-0.5"
                          title={`Remove ${member}`}
                          id={`remove-member-${member}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add new member form */}
                <form onSubmit={handleAddMember} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="E.g. Mom, Leo, Jack"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    maxLength={15}
                    className="flex-1 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 focus:border-neutral-300 dark:focus:border-neutral-700 rounded-lg px-2.5 py-2 text-neutral-700 dark:text-neutral-300 focus:outline-none font-sans"
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center p-2 bg-neutral-800 dark:bg-neutral-100 hover:bg-neutral-900 dark:hover:bg-neutral-200 active:scale-95 text-white dark:text-neutral-900 rounded-lg transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Password Protection section */}
              <div className="mt-4 pt-4 border-t border-neutral-50 dark:border-neutral-800/60">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">
                  Password Protection
                </label>
                {hasPassword ? (
                  <div className="flex flex-col gap-2 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold font-sans">
                      <Lock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Locked and Secure</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Remove password protection? This will make the household and notes public to anyone who has your link.")) {
                          onUpdatePassword?.("");
                        }
                      }}
                      className="text-left text-xs text-red-500 hover:text-red-650 font-bold hover:underline cursor-pointer flex items-center gap-1 pt-0.5"
                    >
                      <Unlock className="w-3 h-3" />
                      <span>Disable password lock</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-relaxed italic">
                      Prevent unauthorized eyes from viewing your group lists, shared notepad, and household notes.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const pass = prompt("Set a password to protect this household:");
                        if (pass !== null) {
                          const trimmed = pass.trim();
                          if (trimmed) {
                            onUpdatePassword?.(trimmed);
                          } else {
                            alert("Password cannot be empty!");
                          }
                        }
                      }}
                      className="w-full text-center py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-855 dark:text-neutral-200 text-xs font-bold rounded-xl transition-all cursor-pointer border border-neutral-200/50 dark:border-neutral-800"
                    >
                      Set Lock Password
                    </button>
                  </div>
                )}
              </div>

              {/* Decorative sweet footnote */}
              <div className="mt-5 pt-3 border-t border-neutral-50 dark:border-neutral-800/60 flex items-center gap-1.5 text-[10px] text-neutral-450 dark:text-neutral-500 italic">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Anyone with the link & password can sync in!</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
