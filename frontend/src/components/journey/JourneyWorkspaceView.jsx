import React, { useState, useEffect } from "react";
import {
  Pin,
  Plus,
  Trash2,
  CheckSquare,
  MapPin,
  Lightbulb,
  ShieldAlert,
  FileText,
  Check,
  Layers,
  Sparkles,
  Edit2,
} from "lucide-react";
import axiosInstance from "../../api/axios";

const JourneyWorkspaceView = ({ journeyId }) => {
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Note Form State
  const [category, setCategory] = useState("Squad Notes");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [checklistInput, setChecklistInput] = useState("");
  const [items, setItems] = useState([]);
  const [isPinned, setIsPinned] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);

  const categories = [
    {
      name: "Checklists / Packing",
      match: ["Checklist", "Packing List", "Checklists / Packing"],
      icon: <CheckSquare className="w-3.5 h-3.5" />,
    },
    {
      name: "Meeting Point",
      match: ["Meeting Point"],
      icon: <MapPin className="w-3.5 h-3.5" />,
    },
    {
      name: "Travel Tips",
      match: ["Travel Tips"],
      icon: <Lightbulb className="w-3.5 h-3.5" />,
    },
    {
      name: "Emergency Info",
      match: ["Emergency Information", "Emergency Info"],
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />,
    },
    {
      name: "Squad Notes",
      match: ["Important Notes", "General Notes", "Squad Notes"],
      icon: <FileText className="w-3.5 h-3.5" />,
    },
  ];

  const fetchNotes = () => {
    if (!journeyId) return;
    axiosInstance
      .get(`/journeys/${journeyId}/workspace`)
      .then((res) => {
        if (res.data?.success) setNotes(res.data.notes);
      })
      .catch((err) => console.error("Error fetching workspace notes:", err));
  };

  useEffect(() => {
    fetchNotes();
  }, [journeyId]);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!checklistInput.trim()) return;
    setItems((prev) => [
      ...prev,
      { text: checklistInput.trim(), isCompleted: false },
    ]);
    setChecklistInput("");
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setEditingNoteId(null);
    setTitle("");
    setContent("");
    setItems([]);
    setIsPinned(false);
    setCategory("Squad Notes");
  };

  const handleEditClick = (note) => {
    setEditingNoteId(note._id);
    setCategory(note.category || "Squad Notes");
    setTitle(note.title || "");
    setContent(note.content || "");
    setItems(note.items || []);
    setIsPinned(note.isPinned || false);
    setIsModalOpen(true);
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      if (editingNoteId) {
        const res = await axiosInstance.put(
          `/journeys/${journeyId}/workspace/${editingNoteId}`,
          {
            category,
            title,
            content,
            items: [
              "Checklists / Packing",
              "Checklist",
              "Packing List",
            ].includes(category)
              ? items
              : [],
            isPinned,
          },
        );
        if (res.data?.success) {
          setNotes((prev) =>
            prev.map((n) => (n._id === editingNoteId ? res.data.note : n)),
          );
          setIsModalOpen(false);
          resetForm();
        }
      } else {
        const res = await axiosInstance.post(
          `/journeys/${journeyId}/workspace`,
          {
            category,
            title,
            content,
            items: [
              "Checklists / Packing",
              "Checklist",
              "Packing List",
            ].includes(category)
              ? items
              : [],
            isPinned,
          },
        );
        if (res.data?.success) {
          setNotes((prev) => [res.data.note, ...prev]);
          setIsModalOpen(false);
          resetForm();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save note");
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async (note) => {
    try {
      const res = await axiosInstance.put(
        `/journeys/${journeyId}/workspace/${note._id}`,
        {
          isPinned: !note.isPinned,
        },
      );
      if (res.data?.success) fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm("Delete this workspace note permanently?")) return;
    try {
      await axiosInstance.delete(`/journeys/${journeyId}/workspace/${noteId}`);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleChecklistItem = async (note, itemIdx) => {
    const updatedItems = note.items.map((it, idx) =>
      idx === itemIdx ? { ...it, isCompleted: !it.isCompleted } : it,
    );
    try {
      setNotes((prev) =>
        prev.map((n) =>
          n._id === note._id ? { ...n, items: updatedItems } : n,
        ),
      );
      await axiosInstance.put(`/journeys/${journeyId}/workspace/${note._id}`, {
        items: updatedItems,
      });
    } catch (err) {
      fetchNotes();
    }
  };

  const filteredNotes =
    activeTab === "All"
      ? notes
      : notes.filter((n) => {
          const catObj = categories.find((c) => c.name === activeTab);
          return catObj
            ? catObj.match.includes(n.category)
            : n.category === activeTab;
        });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Sleek Category Filter Bar & Action Button */}
      <div className="bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-0.5 px-0.5 flex-1 whitespace-nowrap flex-nowrap">
          <button
            onClick={() => setActiveTab("All")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap select-none shrink-0 ${
              activeTab === "All"
                ? "bg-white dark:bg-slate-800 text-[#6C4DF6] shadow-xs font-extrabold ring-1 ring-slate-200/80 dark:ring-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40"
            }`}
          >
            <Layers
              className={`w-3.5 h-3.5 ${activeTab === "All" ? "text-[#6C4DF6]" : "text-slate-400"}`}
            />
            <span>All Notes</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-purple-100 dark:bg-purple-950 text-[#6C4DF6] rounded-md font-black">
              {notes.length}
            </span>
          </button>

          {categories.map((c) => {
            const isActive = activeTab === c.name;
            return (
              <button
                key={c.name}
                onClick={() => setActiveTab(c.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap select-none shrink-0 ${
                  isActive
                    ? "bg-white dark:bg-slate-800 text-[#6C4DF6] shadow-xs font-extrabold ring-1 ring-slate-200/80 dark:ring-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40"
                }`}
              >
                <span
                  className={isActive ? "text-[#6C4DF6]" : "text-slate-400"}
                >
                  {c.icon}
                </span>
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#6C4DF6] hover:bg-[#5b3ee0] text-white text-xs font-bold shadow-md shadow-[#6C4DF6]/25 transition-all active:scale-95 shrink-0 whitespace-nowrap ml-1"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />{" "}
          <span className="hidden sm:inline">New Note / Checklist</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Notes Grid or WOW Empty State */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full py-14 px-6 text-center bg-gradient-to-br from-purple-900/10 via-slate-900/40 to-slate-900/40 dark:from-purple-950/20 dark:to-slate-900 rounded-3xl border border-purple-500/20 relative overflow-hidden shadow-sm">
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#6C4DF6]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-14 h-14 bg-[#6C4DF6]/15 border border-[#6C4DF6]/30 text-[#6C4DF6] rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-sm relative z-10">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>

            <h4 className="text-base font-black text-slate-800 dark:text-white tracking-tight relative z-10">
              Your Collaborative Workspace is Ready
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-300 max-w-md mx-auto mt-1 relative z-10 font-medium leading-relaxed">
              Pin packing checklists, hotel booking links, emergency contacts,
              or meeting spots so the entire squad stays synced.
            </p>

            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-[#6C4DF6] text-xs font-extrabold shadow-md hover:bg-purple-50 dark:hover:bg-slate-700 transition-all border border-purple-200 dark:border-purple-800/60 relative z-10 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> Create First Item
            </button>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note._id}
              className={`relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between h-full group ${
                note.isPinned
                  ? "border-amber-400/80 bg-gradient-to-br from-amber-500/10 via-white to-white dark:from-amber-950/30 dark:to-slate-900 shadow-md ring-1 ring-amber-400/30"
                  : "border-slate-200/80 dark:border-slate-800 hover:border-[#6C4DF6]/50 hover:shadow-lg shadow-xs"
              }`}
            >
              <div className="flex-1 flex flex-col min-h-0">
                {/* Note Header */}
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
                  <span className="px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[10px] font-black uppercase tracking-wider text-[#6C4DF6] dark:text-purple-300 border border-purple-100 dark:border-purple-800/50">
                    {note.category}
                  </span>
                  <div className="flex items-center gap-1 opacity-85 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditClick(note)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-[#6C4DF6] hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors"
                      title="Edit Note"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => togglePin(note)}
                      className={`p-1.5 rounded-xl transition-colors ${
                        note.isPinned
                          ? "text-amber-500 bg-amber-100 dark:bg-amber-950/60"
                          : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      title="Pin Note"
                    >
                      <Pin
                        className={`w-3.5 h-3.5 ${note.isPinned ? "fill-amber-500" : ""}`}
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(note._id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2.5 leading-snug shrink-0">
                  {note.title}
                </h4>

                {/* Body Content or Checklist */}
                {note.category === "Checklist" ||
                note.category === "Packing List" ||
                note.category === "Checklists / Packing" ? (
                  <div className="space-y-1.5 mt-1 max-h-52 overflow-y-auto pr-1 flex-1">
                    {note.items?.map((it, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleChecklistItem(note, idx)}
                        className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 cursor-pointer hover:bg-purple-50/60 dark:hover:bg-slate-800 transition-all border border-slate-200/50 dark:border-slate-700/50 hover:border-purple-300 dark:hover:border-purple-700"
                      >
                        <div
                          className={`w-4 h-4 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                            it.isCompleted
                              ? "bg-[#6C4DF6] border-[#6C4DF6] text-white shadow-xs"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                          }`}
                        >
                          {it.isCompleted && (
                            <Check className="w-3 h-3 stroke-[3]" />
                          )}
                        </div>
                        <span
                          className={`text-xs font-semibold select-none break-all ${it.isCompleted ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-200"}`}
                        >
                          {it.text}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed mt-1 font-medium flex-1">
                    {note.content}
                  </p>
                )}
              </div>

              {/* Note Footer pinned to bottom */}
              <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium shrink-0">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate pr-2">
                  By{" "}
                  <strong className="text-slate-800 dark:text-slate-200 font-extrabold truncate">
                    {note.creatorName || "Squad Member"}
                  </strong>
                </span>
                <span className="shrink-0 font-semibold">
                  {new Date(note.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sleek New Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#6C4DF6]" />{" "}
                {editingNoteId ? "Edit Workspace Item" : "Add Workspace Item"}
              </h3>
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#6C4DF6]"
                >
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Flight Boarding Gates & Hotel Link"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#6C4DF6]"
                />
              </div>

              {["Checklists / Packing", "Checklist", "Packing List"].includes(
                category,
              ) ? (
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Add Checklist Items
                  </label>
                  <div className="flex gap-2 mb-2.5">
                    <input
                      type="text"
                      value={checklistInput}
                      onChange={(e) => setChecklistInput(e.target.value)}
                      placeholder="e.g. Pack chargers & adapter"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium outline-none focus:border-[#6C4DF6]"
                    />
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-4 py-2 bg-[#6C4DF6] hover:bg-[#5b3ee0] text-white rounded-xl text-xs font-extrabold transition-all shrink-0"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60"
                      >
                        <span>• {it.text}</span>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-rose-500 hover:text-rose-600 text-[10px] font-black uppercase tracking-wider"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Notes / Instructions
                  </label>
                  <textarea
                    rows="4"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter important instructions, meeting spot addresses, or travel tips..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-[#6C4DF6]"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinNote"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded text-[#6C4DF6] focus:ring-[#6C4DF6] w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="pinNote"
                  className="text-xs font-extrabold text-amber-600 dark:text-amber-400 cursor-pointer flex items-center gap-1"
                >
                  📌 Pin to Top of Workspace
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-[#6C4DF6] hover:bg-[#5b3ee0] text-white text-xs font-extrabold shadow-md shadow-[#6C4DF6]/25 transition-all active:scale-95"
                >
                  {loading
                    ? "Saving..."
                    : editingNoteId
                      ? "Update Item"
                      : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyWorkspaceView;
