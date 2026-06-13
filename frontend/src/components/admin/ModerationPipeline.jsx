import { showToast } from "../../utils/showToast";
import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { DataGrid } from "@mui/x-data-grid";
import CircularProgress from "@mui/material/CircularProgress";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Search, Filter, ShieldAlert, Utensils, Hotel, Activity, Zap } from "lucide-react";

const ModerationPipeline = ({ type }) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [searchQuery, setSearchQuery] = useState("");

  const config = {
    restaurant: {
      label: "Restaurant",
      icon: <Utensils className="w-5 h-5" />,
      endpoint: "/restaurant",
      color: "rose"
    },
    hotel: {
      label: "Hotel",
      icon: <Hotel className="w-5 h-5" />,
      endpoint: "/hotels",
      color: "blue"
    },
    activity: {
      label: "Special Activity",
      icon: <Activity className="w-5 h-5" />,
      endpoint: "/activities",
      color: "cyan"
    }
  };

  const current = config[type] || config.restaurant;

  const tabs = [
    { id: "PENDING", label: "Pending Approval", icon: <Clock className="w-4 h-4" />, color: "text-amber-500", bg: "bg-amber-50" },
    { id: "APPROVED", label: "Authorized Assets", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-500", bg: "bg-emerald-50" },
    { id: "DECLINED", label: "Declined Protocols", icon: <XCircle className="w-4 h-4" />, color: "text-rose-500", bg: "bg-rose-50" },
    { id: "SUSPENDED", label: "Suspended Ops", icon: <ShieldAlert className="w-4 h-4" />, color: "text-slate-500", bg: "bg-slate-50" },
  ];

  const columns = [
    {
      field: "name",
      headerName: "Entity Name",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <div className="flex flex-col">
            <span className="font-black text-slate-900 tracking-tight">{params.value || params.row.brand + ' ' + params.row.model}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{params.row.city || params.row.location || "Global"}</span>
        </div>
      )
    },
    {
      field: "user",
      headerName: "Provider",
      width: 150,
      renderCell: (params) => (
        <div className="text-[11px] font-bold text-slate-600">
            {params.value?.name || "System"}
        </div>
      )
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params) => (
        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
            params.value === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 
            params.value === 'PENDING' ? 'bg-amber-50 text-amber-600' :
            params.value === 'SUSPENDED' ? 'bg-slate-100 text-slate-600' :
            'bg-rose-50 text-rose-600'
        }`}>
            {params.value}
        </div>
      )
    },
    {
      field: "actions",
      headerName: "Command Core",
      width: 280,
      sortable: false,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          {activeTab === 'PENDING' && (
            <>
                <button
                    className="bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest py-2 px-4 rounded-lg hover:bg-emerald-600 transition-all active:scale-95 shadow-sm"
                    onClick={() => handleUpdateStatus(params.id, "approve")}
                >
                    Authorize
                </button>
                <button
                    className="bg-rose-50 text-rose-600 border border-rose-100 font-black text-[9px] uppercase tracking-widest py-2 px-4 rounded-lg hover:bg-rose-600 hover:text-white transition-all active:scale-95"
                    onClick={() => handleUpdateStatus(params.id, "reject")}
                >
                    Decline
                </button>
            </>
          )}
          {activeTab === 'APPROVED' && (
            <button
                className="bg-slate-100 text-slate-600 font-black text-[9px] uppercase tracking-widest py-2 px-4 rounded-lg hover:bg-rose-600 hover:text-white transition-all active:scale-95"
                onClick={() => handleUpdateStatus(params.id, "suspend")}
            >
                Suspend
            </button>
          )}
          {(activeTab === 'DECLINED' || activeTab === 'SUSPENDED') && (
             <button
                className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-black text-[9px] uppercase tracking-widest py-2 px-4 rounded-lg hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
                onClick={() => handleUpdateStatus(params.id, "approve")}
            >
                Reinstate
            </button>
          )}
          <button
              className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
              onClick={() => handleDelete(params.id)}
          >
              <XCircle className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab, type]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const endpoint = `${current.endpoint}/status/${activeTab.toLowerCase()}`;
      const response = await axios.get(endpoint);
      // Backend might return array directly or wrapped in success object
      const items = Array.isArray(response.data) ? response.data : (response.data.activities || response.data.resturents || []);
      setData(items);
    } catch (error) {
      console.error("Fetch Error:", error);
      showToast.error("Network Sync Failed", "The moderation core could not retrieve live data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id, action) => {
    try {
      setIsLoading(true);
      const endpoint = `${current.endpoint}/${action}/${id}`;
      await axios.put(endpoint);
      
      showToast.success("Protocol Updated");
      await fetchData();
    } catch (error) {
      showToast.error("Update Failure", "The command could not be processed by the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
        title: 'Destroy Entity?',
        text: 'This will permanently remove the listing from the database.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Confirm Deletion',
        customClass: { popup: 'rounded-[2rem]' }
    });

    if (result.isConfirmed) {
        try {
            setIsLoading(true);
            await axios.delete(`${current.endpoint}/${id}`);
            showToast.success("Terminated", "Entity has been removed from service.");
            await fetchData();
        } catch (error) {
            showToast.error("Deletion Failed");
        } finally {
            setIsLoading(false);
        }
    }
  };

  const filteredRows = data
    .filter(a => (a.name || a.brand || "").toLowerCase().includes(searchQuery.toLowerCase()))
    ?.map(a => ({ id: a._id, ...a }));

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="max-w-7xl mx-auto px-6 pt-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
             <div className={`p-4 rounded-2xl text-white shadow-xl ${
               type === 'restaurant' ? 'bg-primary-500 shadow-primary-500/20' :
               type === 'hotel' ? 'bg-accent-500 shadow-accent-500/20' :
               'bg-primary-500 shadow-primary-500/20'
             }`}>
                {current.icon}
             </div>
             <div>
                <span className={`font-black uppercase tracking-[0.3em] text-[8px] flex items-center gap-2 ${
                  type === 'restaurant' ? 'text-primary-600' :
                  type === 'hotel' ? 'text-accent-600' :
                  'text-primary-600'
                }`}>
                    <Zap className="w-3 h-3" /> Moderation Pipeline
                </span>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">{current.label} Management</h1>
             </div>
          </div>

          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-full md:w-auto overflow-x-auto">
             {tabs?.map((tab) => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                   activeTab === tab.id 
                   ? `${tab.bg} ${tab.color} shadow-sm border border-slate-100` 
                   : "text-slate-400 hover:text-slate-600"
                 }`}
               >
                 {tab.icon}
                 {tab.label}
               </button>
             ))}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-3xl mb-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                    type="text" 
                    placeholder={`Search ${current.label.toLowerCase()}s by name...`} 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-slate-500/20 transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <button className="px-6 py-3 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100 transition-all">
                <Filter className="w-4 h-4" /> Filter Protocols
            </button>
        </div>

        {/* Data Grid */}
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100">
          <div style={{ height: 600, width: "100%" }}>
            <DataGrid
              columns={columns}
              rows={filteredRows}
              loading={isLoading}
              rowHeight={70}
              headerHeight={56}
              disableSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #f1f5f9',
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontSize: '10px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#64748b',
                  }
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f8fafc',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: '500',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: '#f8fafc',
                },
              }}
              slots={{
                loadingOverlay: () => (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
                        <CircularProgress size={32} thickness={5} className="text-slate-900" />
                    </div>
                )
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModerationPipeline;
