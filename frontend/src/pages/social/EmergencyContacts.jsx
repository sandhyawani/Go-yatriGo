import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../context/authContext";
import axios from "../../api/axios";
import { Phone, Plus, Trash2, ShieldAlert, Edit2, Mail, ToggleLeft, ToggleRight, AlertOctagon, MapPin, UserX } from "lucide-react";
import { showToast } from "../../utils/showToast";

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ name: "", relation: "", phone: "", email: "", isPrimary: false });

  // Mock global toggles
  const [sosActive, setSosActive] = useState(false);
  const [locationSharing, setLocationSharing] = useState(true);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/social/emergency-contacts", { withCredentials: true });
      setContacts(res.data.contacts || []);
    } catch (err) {
      showToast.error("Failed to fetch emergency contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.relation.trim()) {
      return showToast.error("Name, phone and relation are required");
    }
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
    if (!phoneRegex.test(formData.phone)) {
      return showToast.error("Please enter a valid phone number");
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return showToast.error("Please enter a valid email address");
    }

    try {
      if (editingId) {
        const res = await axios.put(`/social/emergency-contacts/${editingId}`, formData, { withCredentials: true });
        if (res.data.success) {
          setContacts(res.data.contacts);
          showToast.success("Contact updated");
        }
      } else {
        const res = await axios.post("/social/emergency-contacts", formData, { withCredentials: true });
        if (res.data.success) {
          setContacts(res.data.contacts);
          showToast.success("Contact added");
        }
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: "", relation: "", phone: "", email: "", isPrimary: false });
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to save contact");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to remove this emergency contact?");
    if (!confirmed) return;
    try {
      const res = await axios.delete(`/social/emergency-contacts/${id}`, { withCredentials: true });
      if (res.data.success) {
        setContacts(res.data.contacts);
        showToast.success("Contact deleted");
      }
    } catch (err) {
      showToast.error("Failed to delete contact");
    }
  };

  const startEdit = (contact) => {
    setFormData({
      name: contact.name || "",
      relation: contact.relation || "",
      phone: contact.phone || "",
      email: contact.email || "",
      isPrimary: contact.isPrimary || false
    });
    setEditingId(contact._id);
    setIsAdding(true);
  };

  const handleSOSToggle = () => {
    // TODO: Implement backend SOS logic
    setSosActive(!sosActive);
    if (!sosActive) {
      showToast.error("SOS Alert Activated! Emergency contacts have been notified.", { icon: '🚨' });
    } else {
      showToast.success("SOS Alert Deactivated.");
    }
  };

  return (
    <div className=" bg-slate-50 pt-14 md:pt-0 pb-20">
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-amber-500" />
              Emergency Contacts
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">People to contact during travel emergencies</p>
          </div>
          {!isAdding && (
            <button onClick={() => { setFormData({ name: "", relation: "", phone: "", email: "", isPrimary: false }); setIsAdding(true); setEditingId(null); }} className="p-3 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-colors shadow-sm">
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Global Safety Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-colors ${sosActive ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-500'}`}>
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">SOS Alert</h3>
                <p className="text-xs text-slate-400">Notify primary contacts</p>
              </div>
            </div>
            <button onClick={handleSOSToggle} className="text-slate-400 hover:text-rose-500 transition-colors">
              {sosActive ? <ToggleRight className="w-8 h-8 text-rose-500" /> : <ToggleLeft className="w-8 h-8" />}
            </button>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-colors ${locationSharing ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-500'}`}>
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Location Sharing</h3>
                <p className="text-xs text-slate-400">Share trip tracking</p>
              </div>
            </div>
            <button onClick={() => setLocationSharing(!locationSharing)} className="text-slate-400 hover:text-emerald-500 transition-colors">
              {locationSharing ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft className="w-8 h-8" />}
            </button>
          </div>
        </div>

        {isAdding && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand-100 mb-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4">{editingId ? 'Edit Contact' : 'Add New Contact'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Relation</label>
                  <input type="text" required placeholder="e.g. Brother, Friend" value={formData.relation} onChange={e => setFormData({...formData, relation: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" required placeholder="+1 234 567 8900" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-9 pr-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" placeholder="Optional" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-9 pr-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                <input type="checkbox" checked={formData.isPrimary} onChange={e => setFormData({...formData, isPrimary: e.target.checked})} className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500/20" />
                <div>
                  <span className="text-sm font-bold text-slate-700 block">Set as Primary Contact</span>
                  <span className="text-[10px] text-slate-500 font-medium">This person will be contacted first in emergencies.</span>
                </div>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 btn-primary py-3 rounded-xl">{editingId ? 'Update Contact' : 'Save Contact'}</button>
                <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="flex-1 btn-secondary py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500 mx-auto"></div></div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-brand-300" />
              </div>
              <p className="text-slate-800 font-bold mb-1">No Contacts Found</p>
              <p className="text-slate-500 text-sm font-medium px-6">Add emergency contacts so we know who to reach out to during your trips.</p>
            </div>
          ) : (
            contacts.map(contact => (
              <div key={contact._id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-brand-200 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                    <UserX className="w-5 h-5 hidden" />
                    <span className="font-black text-sm uppercase">{contact.name?.substring(0,2) || "?"}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      {contact.name}
                      {contact.isPrimary && (
                        <span className="text-[9px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider border border-brand-100">Primary</span>
                      )}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">{contact.relation}</span>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Phone className="w-3 h-3" />
                        <span className="text-xs font-medium">{contact.phone}</span>
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <Mail className="w-3 h-3" />
                          <span className="text-xs font-medium">{contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(contact)} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-brand-500 rounded-xl transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(contact._id)} className="p-2 text-rose-300 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default EmergencyContacts;
