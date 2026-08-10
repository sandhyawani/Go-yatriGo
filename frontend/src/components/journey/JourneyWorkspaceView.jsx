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
Clock } from
"lucide-react";
import axiosInstance from "../../api/axios";
import CustomSelect from "../ui/CustomSelect";

const JourneyWorkspaceView = ({ journeyId }) => {
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);


  const [category, setCategory] = useState("Notes");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [checklistInput, setChecklistInput] = useState("");
  const [items, setItems] = useState([]);
  const [isPinned, setIsPinned] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);

  const categories = [
  {
    name: "Notes",
    match: ["Squad Notes", "Important Notes", "General Notes", "Notes"],
    icon: <FileText className="w-3.5 h-3.5" />
  },
  {
    name: "Packing",
    match: ["Checklists / Packing", "Checklist", "Packing List", "Packing"],
    icon: <CheckSquare className="w-3.5 h-3.5" />
  },
  {
    name: "Meeting Point",
    match: ["Meeting Point"],
    icon: <MapPin className="w-3.5 h-3.5" />
  },
  {
    name: "Travel Tips",
    match: ["Travel Tips"],
    icon: <Lightbulb className="w-3.5 h-3.5" />
  },
  {
    name: "Emergency",
    match: ["Emergency Information", "Emergency Info", "Emergency"],
    icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
  }];


  const parseNoteDetails = (contentStr) => {
    if (!contentStr) return { details: "" };
    try {
      const parsed = JSON.parse(contentStr);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    } catch (e) {}
    return { details: contentStr };
  };

  const fetchNotes = () => {
    if (!journeyId) return;
    axiosInstance.
    get(`/journeys/${journeyId}/workspace`).
    then((res) => {
      if (res.data?.success) setNotes(res.data.notes);
    }).
    catch((err) => console.error("Error fetching workspace notes:", err));
  };

  useEffect(() => {
    fetchNotes();
  }, [journeyId]);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!checklistInput.trim()) return;
    setItems((prev) => [
    ...prev,
    { text: checklistInput.trim(), isCompleted: false }]
    );
    setChecklistInput("");
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setEditingNoteId(null);
    setTitle("");
    setContent("");
    setLocationAddress("");
    setMeetingTime("");
    setEmergencyPhone("");
    setItems([]);
    setIsPinned(false);
    setCategory("Notes");
  };

  const handleEditClick = (note) => {
    setEditingNoteId(note._id);
    
    let mappedCategory = "Notes";
    const foundCat = categories.find(c => c.match.includes(note.category) || c.name === note.category);
    if (foundCat) mappedCategory = foundCat.name;
    
    setCategory(mappedCategory);
    setTitle(note.title || "");
    const parsed = parseNoteDetails(note.content);
    setContent(parsed.instructions || parsed.details || note.content || "");
    setLocationAddress(parsed.address || "");
    setMeetingTime(parsed.time || "");
    setEmergencyPhone(parsed.phone || "");
    setItems(note.items || []);
    setIsPinned(note.isPinned || false);
    setIsModalOpen(true);
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    let finalContent = content;
    if (category === "Meeting Point") {
      finalContent = JSON.stringify({
        address: locationAddress,
        time: meetingTime,
        instructions: content
      });
    } else if (category === "Emergency") {
      finalContent = JSON.stringify({
        phone: emergencyPhone,
        details: content
      });
    } else if (category === "Travel Tip") {
      finalContent = JSON.stringify({
        details: content
      });
    }

    try {
      let backendCategory = category;
      if (category === "Notes") backendCategory = "Squad Notes";
      if (category === "Packing") backendCategory = "Packing List";
      if (category === "Emergency") backendCategory = "Emergency Information";
      if (category === "Travel Tips" || category === "Travel Tip") backendCategory = "Travel Tips";

      const payload = {
        category: backendCategory,
        title: title.trim(),
        content: finalContent,
        items: ["Packing", "Checklists / Packing", "Checklist", "Packing List"].includes(category) ? items : [],
        isPinned
      };

      if (editingNoteId) {
        const res = await axiosInstance.put(
        `/journeys/${journeyId}/workspace/${editingNoteId}`,
        payload
        );
        if (res.data?.success) {
          setNotes((prev) =>
          prev.map((n) => n._id === editingNoteId ? res.data.note : n)
          );
          setIsModalOpen(false);
          resetForm();
        }
      } else {
        const res = await axiosInstance.post(
        `/journeys/${journeyId}/workspace`,
        payload
        );
        if (res.data?.success) {
          setNotes((prev) => [res.data.note, ...prev]);
          setIsModalOpen(false);
          resetForm();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save workspace item");
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async (note) => {
    try {
      const res = await axiosInstance.put(
      `/journeys/${journeyId}/workspace/${note._id}`,
      {
        isPinned: !note.isPinned
      }
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
    idx === itemIdx ? { ...it, isCompleted: !it.isCompleted } : it
    );
    try {
      setNotes((prev) =>
      prev.map((n) =>
      n._id === note._id ? { ...n, items: updatedItems } : n
      )
      );
      await axiosInstance.put(`/journeys/${journeyId}/workspace/${note._id}`, {
        items: updatedItems
      });
    } catch (err) {
      fetchNotes();
    }
  };

  const renderCardBody = (note) => {
    if (["Packing", "Checklists / Packing", "Checklist", "Packing List"].includes(note.category)) {
      return (
        <div className="space-y-1.5 mt-1 max-h-52 overflow-y-auto pr-1 flex-1">
          {note.items?.map((it, idx) =>
          <div
          key={idx}
          onClick={() => toggleChecklistItem(note, idx)}
          className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 cursor-pointer hover:bg-brand-50/60 dark:hover:bg-slate-800 transition-all border border-slate-200/50 dark:border-slate-700/50">

              <div
            className={`w-4 h-4 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
            it.isCompleted ? "bg-[#7C3AED] border-[#7C3AED] text-white shadow-xs" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
            }`}>

                {it.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className={`text-xs font-semibold select-none break-all ${it.isCompleted ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-200"}`}>
                {it.text}
              </span>
            </div>
          )}
        </div>);

    }

    if (note.category === "Meeting Point") {
      const parsed = parseNoteDetails(note.content);
      const address = parsed.address || "";
      const time = parsed.time || "";
      const instructions = parsed.instructions || parsed.details || "";
      const mapsQuery = encodeURIComponent(`${note.title} ${address}`.trim());

      return (
        <div className="space-y-2 mt-1 flex-1 flex flex-col justify-between">
          <div className="space-y-1.5">
            {address &&
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-start gap-1.5 m-0">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>{address}</span>
              </p>}

            {time &&
            <p className="text-xs font-extrabold text-[#7C3AED] dark:text-brand-300 flex items-center gap-1.5 m-0">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{time}</span>
              </p>}

            {instructions &&
            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-medium m-0 pt-1 leading-relaxed">
                💬 {instructions}
              </p>}

          </div>

          <a
          href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black transition-all border border-slate-200 dark:border-slate-700 active:scale-95">

            <span>🗺️ View on Map / Get Directions</span>
          </a>
        </div>);

    }

    if (note.category === "Emergency" || note.category === "Emergency Info") {
      const parsed = parseNoteDetails(note.content);
      const phone = parsed.phone || "";
      const details = parsed.details || "";

      return (
        <div className="space-y-2 mt-1 flex-1 flex flex-col justify-between">
          <div className="space-y-1.5">
            {phone &&
            <p className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5 m-0">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>📞 {phone}</span>
              </p>}

            {details &&
            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-medium m-0 leading-relaxed">
                {details}
              </p>}

          </div>

          {phone &&
          <a
          href={`tel:${phone}`}
          className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-black transition-all border border-rose-200 dark:border-rose-800 active:scale-95">

              <span>📞 Call SOS Contact</span>
            </a>}

        </div>);

    }

    const parsed = parseNoteDetails(note.content);
    return (
      <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed mt-1 font-medium flex-1">
        {parsed.details || note.content}
      </p>);

  };

  const filteredNotes =
  activeTab === "All" ?
  notes :
  notes.filter((n) => {
    const catObj = categories.find((c) => c.name === activeTab);
    return catObj ?
    catObj.match.includes(n.category) :
    n.category === activeTab;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {}
      <div className="bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-0.5 px-0.5 flex-1 whitespace-nowrap flex-nowrap">
          <button
          onClick={() => setActiveTab("All")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap select-none shrink-0 ${
          activeTab === "All" ?
          "bg-white dark:bg-slate-800 text-[#7C3AED] shadow-xs font-extrabold ring-1 ring-slate-200/80 dark:ring-slate-700" :
          "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40"
          }`}>

            <Layers
            className={`w-3.5 h-3.5 ${activeTab === "All" ? "text-[#7C3AED]" : "text-slate-400"}`} />

            <span>All Items</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-brand-100 dark:bg-brand-900 text-[#7C3AED] rounded-md font-black">
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
              isActive ?
              "bg-white dark:bg-slate-800 text-[#7C3AED] shadow-xs font-extrabold ring-1 ring-slate-200/80 dark:ring-slate-700" :
              "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40"
              }`}>

                <span
                className={isActive ? "text-[#7C3AED]" : "text-slate-400"}>

                  {c.icon}
                </span>
                <span>{c.name}</span>
              </button>);

          })}
        </div>

        <button
        onClick={() => {
          resetForm();
          setIsModalOpen(true);
        }}
        className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#7c3aed] text-white text-xs font-bold shadow-md shadow-[#7C3AED]/25 transition-all active:scale-95 shrink-0 whitespace-nowrap ml-1">

          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Item</span>
        </button>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
        {filteredNotes.length === 0 ?
        <div className="col-span-full py-8 px-6 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 bg-[#7C3AED]/10 text-[#7C3AED] rounded-xl flex items-center justify-center mx-auto mb-2 border border-[#7C3AED]/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white">
              No items in this category yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-0.5 font-medium leading-relaxed">
              Add notes, packing checklists, meeting points, or emergency details for your squad.
            </p>
            <button
          onClick={() => setIsModalOpen(true)}
          className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#7c3aed] text-white text-xs font-bold transition-all shadow-sm active:scale-95">

              <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add First Item
            </button>
          </div> :

        filteredNotes.map((note) =>
        <div
        key={note._id}
        className={`relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between h-full group ${
        note.isPinned ?
        "border-amber-400/80 bg-gradient-to-br from-amber-500/10 via-white to-white dark:from-amber-950/30 dark:to-slate-900 shadow-md ring-1 ring-amber-400/30" :
        "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md shadow-xs"
        }`}>

              <div className="flex-1 flex flex-col min-h-0">
                {}
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                    {note.category}
                  </span>
                  <div className="flex items-center gap-1 opacity-85 group-hover:opacity-100 transition-opacity">
                    <button
                onClick={() => handleEditClick(note)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit Item">

                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                onClick={() => togglePin(note)}
                className={`p-1.5 rounded-xl transition-colors ${
                note.isPinned ?
                "text-amber-500 bg-amber-100 dark:bg-amber-950/60" :
                "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title="Pin Item">

                      <Pin
                  className={`w-3.5 h-3.5 ${note.isPinned ? "fill-amber-500" : ""}`} />

                    </button>
                    <button
                onClick={() => handleDelete(note._id)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                title="Delete Item">

                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2 leading-snug shrink-0">
                  {note.title}
                </h4>

                {}
                {renderCardBody(note)}
              </div>

              {}
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
                day: "numeric"
              })}
                </span>
              </div>
            </div>
        )}

      </div>

      {}
      {isModalOpen &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />{" "}
                {editingNoteId ? "Edit Workspace Item" : "Add Workspace Item"}
              </h3>
              <button
            onClick={() => {
              resetForm();
              setIsModalOpen(false);
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold">

                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Category
                </label>
                <CustomSelect
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#7C3AED]"
              options={categories.map(c => ({ label: c.name, value: c.name }))}
            />
              </div>

              {}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  {category === "Meeting Point" ?
                "Location / Place Name *" :
                category === "Emergency" ?
                "Contact Name / Organization *" :
                category === "Packing" ?
                "Checklist Title *" :
                "Title *"}
                </label>
                <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
              category === "Meeting Point" ?
              "e.g. Pune Railway Station / Swargate Bus Stand" :
              category === "Emergency" ?
              "e.g. District Tourist Helpline / Hospital SOS" :
              category === "Packing" ?
              "e.g. Beach & Trek Essentials" :
              category === "Travel Tip" ?
              "e.g. Ferry Timings & Local Food Recommendations" :
              "e.g. Flight Boarding Gates & Hotel Reservation Code"}

              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#7C3AED]" />

              </div>

              {}
              {category === "Meeting Point" &&
            <>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" /> Address / Area Details
                    </label>
                    <input
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="e.g. Agarkar Nagar, Platform 1 Side, Pune"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#7C3AED]" />

                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#7C3AED]" /> Meeting Date & Time
                    </label>
                    <input
                type="text"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                placeholder="e.g. Aug 15, 2026 · 06:30 AM"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#7C3AED]" />

                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                      💬 Meeting Instructions
                    </label>
                    <textarea
                rows="3"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="e.g. Meet outside the main entrance near the prepaid taxi stand."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-[#7C3AED]" />

                  </div>
                </>}


              {category === "Emergency" &&
            <>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Phone Number / SOS Helpline *
                    </label>
                    <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210 or 112"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#7C3AED]" />

                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                      Emergency Notes & Hospital Address
                    </label>
                    <textarea
                rows="3"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="e.g. Nearest hospital address, ambulance contact, or squad medical notes..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-[#7C3AED]" />

                  </div>
                </>}


              {["Packing", "Checklists / Packing", "Checklist", "Packing List"].includes(category) &&
            <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Add Checklist Items
                  </label>
                  <div className="flex gap-2 mb-2.5">
                    <input
                type="text"
                value={checklistInput}
                onChange={(e) => setChecklistInput(e.target.value)}
                placeholder="e.g. Pack chargers, power bank & adapter"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium outline-none focus:border-[#7C3AED]" />

                    <button
                type="button"
                onClick={handleAddItem}
                className="px-4 py-2 bg-[#7C3AED] hover:bg-[#7c3aed] text-white rounded-xl text-xs font-extrabold transition-all shrink-0">

                      Add
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {items.map((it, idx) =>
                <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60">

                        <span>• {it.text}</span>
                        <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-rose-500 hover:text-rose-600 text-[10px] font-black uppercase tracking-wider">

                          Remove
                        </button>
                      </div>
                )}
                  </div>
                </div>}


              {(category === "Notes" || category === "Travel Tip") &&
            <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    {category === "Travel Tip" ? "Tip Details & Useful Links" : "Notes / Instructions"}
                  </label>
                  <textarea
              rows="4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
              category === "Travel Tip" ?
              "e.g. Take the 7:30 AM ferry to avoid peak queue. Book tickets at..." :
              "Enter important instructions, booking links, or squad notes..."}

              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-[#7C3AED]" />

                </div>}


              <div className="flex items-center gap-2 pt-1">
                <input
              type="checkbox"
              id="pinNote"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded text-[#7C3AED] focus:ring-[#7C3AED] w-4 h-4 cursor-pointer" />

                <label
              htmlFor="pinNote"
              className="text-xs font-extrabold text-amber-600 dark:text-amber-400 cursor-pointer flex items-center gap-1">

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
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">

                  Cancel
                </button>
                <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#7c3aed] text-white text-xs font-extrabold shadow-md shadow-[#7C3AED]/25 transition-all active:scale-95">

                  {loading ?
                "Saving..." :
                editingNoteId ?
                "Update Item" :
                "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>}

    </div>);

};

export default JourneyWorkspaceView;
