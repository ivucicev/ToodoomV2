import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, X, Plus, Edit2, Check, Settings, Sparkles, Lock, Unlock, Crown, Sun, Moon, Share2, ClipboardCheck } from "lucide-react";

interface HouseholdManagerProps {
  householdName: string;
  members: string[];
  owner: string;
  isOwner: boolean;
  memberPins?: Record<string, string>;
  onUpdateName: (name: string) => void;
  onAddMember: (name: string, pin: string) => void;
  onRemoveMember: (name: string) => void;
  onSetMemberPin: (member: string, pin: string) => void;
  onNewHousehold: () => void;
  appVersion?: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  copied: boolean;
  onCopyLink: () => void;
  hasPassword?: boolean;
  onUpdatePassword?: (password: string) => void;
}

export const HouseholdManager: React.FC<HouseholdManagerProps> = ({
  householdName,
  members,
  owner,
  isOwner,
  memberPins = {},
  onUpdateName,
  onAddMember,
  onRemoveMember,
  onSetMemberPin,
  onNewHousehold,
  appVersion,
  darkMode,
  onToggleDarkMode,
  copied,
  onCopyLink,
  hasPassword = false,
  onUpdatePassword,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(householdName);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPin, setNewMemberPin] = useState("");
  const [editingPinFor, setEditingPinFor] = useState<string | null>(null);
  const [editingPinValue, setEditingPinValue] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleSaveName = () => {
    if (newName.trim() && newName.trim() !== householdName) {
      onUpdateName(newName.trim());
    }
    setIsEditingName(false);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newMemberName.trim();
    const pin = newMemberPin.trim();
    if (val && !members.includes(val)) {
      onAddMember(val, pin);
      setNewMemberName("");
      setNewMemberPin("");
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
            {/* Backdrop */}
            <div
              className={`fixed inset-0 z-50 ${isMobile ? "bg-black/50" : ""}`}
              onClick={() => setIsOpen(false)}
            />

            {/* Panel — bottom sheet on mobile, popover on desktop */}
            <motion.div
              initial={isMobile ? { opacity: 0, y: 40 } : { opacity: 0, scale: 0.95, y: 8 }}
              animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
              exit={isMobile ? { opacity: 0, y: 40 } : { opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={`z-50 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-xl font-sans overflow-y-auto ${
                isMobile
                  ? "fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh] p-5"
                  : "absolute right-0 top-full mt-2 w-80 max-h-[85vh] rounded-2xl p-5"
              }`}
            >
              {isMobile && (
                <div className="flex justify-center mb-3 -mt-1">
                  <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                </div>
              )}
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

                {/* Member chips */}
                <div className="flex flex-col gap-1.5 mb-3.5">
                  {members.map((member) => (
                    <div key={member}>
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-50 dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 text-xs rounded-full border border-neutral-100 dark:border-neutral-800 font-medium w-full justify-between">
                        <div className="flex items-center gap-1">
                          {member === owner && <Crown className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
                          <span>{member}</span>
                          {memberPins[member] ? (
                            <Lock className="w-2.5 h-2.5 text-emerald-500 shrink-0" title="PIN set" />
                          ) : (
                            <span className="text-[9px] text-red-400 font-bold">NO PIN</span>
                          )}
                        </div>
                        {isOwner && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setEditingPinFor(editingPinFor === member ? null : member); setEditingPinValue(""); }}
                              className="p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
                              title={memberPins[member] ? "Change PIN" : "Set PIN"}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            {member !== owner && (
                              <button
                                onClick={() => onRemoveMember(member)}
                                className="p-0.5 text-neutral-400 hover:text-red-500 cursor-pointer"
                                title={`Remove ${member}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {isOwner && editingPinFor === member && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const pin = editingPinValue.trim();
                            if (!pin) return;
                            onSetMemberPin(member, pin);
                            setEditingPinFor(null);
                            setEditingPinValue("");
                          }}
                          className="flex gap-1.5 mt-1"
                        >
                          <input
                            type="password"
                            placeholder={memberPins[member] ? "New PIN..." : "Set PIN..."}
                            value={editingPinValue}
                            onChange={(e) => setEditingPinValue(e.target.value)}
                            autoFocus
                            maxLength={20}
                            className="flex-1 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-700 dark:text-neutral-300 focus:outline-none"
                          />
                          <button type="submit" className="px-2.5 py-1.5 bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold rounded-lg cursor-pointer">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add new member — owner only */}
                {isOwner ? (
                  <form onSubmit={handleAddMember} className="space-y-2">
                    <input
                      type="text"
                      placeholder="Name (e.g. Mom, Leo)"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      maxLength={15}
                      className="w-full text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 focus:border-neutral-300 dark:focus:border-neutral-700 rounded-lg px-2.5 py-2 text-neutral-700 dark:text-neutral-300 focus:outline-none font-sans"
                    />
                    <input
                      type="password"
                      placeholder="PIN (required to sign in)"
                      value={newMemberPin}
                      onChange={(e) => setNewMemberPin(e.target.value)}
                      maxLength={20}
                      className="w-full text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 focus:border-neutral-300 dark:focus:border-neutral-700 rounded-lg px-2.5 py-2 text-neutral-700 dark:text-neutral-300 focus:outline-none font-sans"
                    />
                    <button
                      type="submit"
                      disabled={!newMemberName.trim() || !newMemberPin.trim()}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-neutral-800 dark:bg-neutral-100 hover:bg-neutral-900 dark:hover:bg-neutral-200 active:scale-95 text-white dark:text-neutral-900 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Member
                    </button>
                  </form>
                ) : (
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 italic">
                    Only <span className="font-bold">{owner || "the owner"}</span> can add or remove members.
                  </p>
                )}
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

              {/* Share + Dark Mode row */}
              <div className="mt-4 pt-3 border-t border-neutral-50 dark:border-neutral-800/60 flex items-center gap-2">
                <button
                  onClick={onCopyLink}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    copied
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                      : "bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  {copied ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy Link"}
                </button>
                <button
                  onClick={onToggleDarkMode}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-450 dark:text-neutral-500 italic">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Share link to invite members</span>
                </div>
                <div className="flex items-center gap-3">
                  {appVersion && (
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-600 font-mono">v{appVersion}</span>
                  )}
                  <button
                    onClick={() => { setIsOpen(false); onNewHousehold(); }}
                    className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors cursor-pointer underline underline-offset-2"
                  >
                    + New Household
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
