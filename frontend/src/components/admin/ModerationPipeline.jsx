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
      endpoint: "/restaurant"
    },
    hotel: {
      label: "Hotel",
      icon: <Hotel className="w-5 h-5" />,
      endpoint: "/hotels"
    },
    activity: {
      label: "Special Activity",
      icon: <Activity className="w-5 h-5" />,
      endpoint: "/activities"
    }
  };

  const current = config[type] || config.restaurant;

  const tabs = [
    { id: "PENDING", label: "Pending Approval", icon: <Clock className="w-4 h-4" />, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
    { id: "APPROVED", label: "Authorized Assets", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
    { id: "DECLINED", label: "Declined Protocols", icon: <XCircle className="w-4 h-4" />, color: "text-rose-600", bg: "bg-rose-50 border-rose-100" },
    { id: "SUSPENDED", label: "Suspended Ops", icon: <ShieldAlert className="w-4 h-4" />, color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
  ];

  const columns = [
    {
      field: "name",
      headerName: "Entity Name",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <div className="flex flex-col justify-center h-full">
          <span className="font-bold text-slate-900 text-sm tracking-tight">{params.value || `${params.row.brand || ''} ${params.row.model || ''}`.trim()}</span>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{params.row.city || params.row.location || "Global"}</span>
        </div>
      )
    },
    {
      field: "user",
      headerName: "Provider",
      width: 150,
      renderCell: (params) => (
        <div className="flex items-center h-full text-xs font-semibold text-slate-600">
          {params.value?.name || "System"}
        </div>
      )
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params) => (
        <div className="flex items-center h-full">
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            params.value === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
            params.value === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
            params.value === 'SUSPENDED' ? 'bg-slate-50 text-slate-600 border border-slate-200' :
            'bg-rose-50 text-rose-600 border border-rose-100'
          }`}>
            {params.value}
          </div>
        </div>
      )
    },
    {
      field: "actions",
      headerName: "Command Core",
      width: 280,
      sortable: false,
      renderCell: (params) => (
        <div className="flex items-center gap-2 h-full">
          {activeTab === 'PENDING' && (
            <>
              <button
                className="bg-brand-600 text-white font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-xl hover:bg-brand-700 transition-all active:scale-95 shadow-sm"
                onClick={() => handleUpdateStatus(params.id, "approve")}
              >
                Authorize
              </button>
              <button
                className="bg-rose-50 text-rose-600 border border-rose-100 font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-95"
                onClick={() => handleUpdateStatus(params.id, "reject")}
              >
                Decline
              </button>
            </>
          )}
          {activeTab === 'APPROVED' && (
            <button
              className="bg-slate-50 text-slate-600 border border-slate-200 font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all active:scale-95"
              onClick={() => handleUpdateStatus(params.id, "suspend")}
            >
              Suspend
            </button>
          )}
          {(activeTab === 'DECLINED' || activeTab === 'SUSPENDED') && (
            <button
              className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
              onClick={() => handleUpdateStatus(params.id, "approve")}
            >
              Reinstate
            </button>
          )}
          <button
            className="p-2 text-slate-300 hover:text-rose-600 transition-colors ml-auto"
            onClick={() => handleDelete(params.id)}
            aria-label="Delete entity"
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
      customClass: { popup: 'rounded-3xl' }
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
            <div className="p-4 rounded-2xl text-white shadow-md bg-gradient-to-br from-brand-500 to-brand-600 shadow-brand-500/20">
              {current.icon}
            </div>
            <div>
              <span className="font-bold uppercase tracking-wider text-xs flex items-center gap-2 text-brand-600">
                <Zap className="w-3 h-3" /> Moderation Pipeline
              </span>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight mt-1">{current.label} Management</h1>
            </div>
          </div>

          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-full md:w-auto overflow-x-auto">
            {tabs?.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? `${tab.bg} ${tab.color} shadow-sm border` 
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={`Search ${current.label.toLowerCase()}s by name...`} 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100 transition-all outline-none text-slate-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="px-6 py-3 bg-slate-50 text-slate-500 border border-slate-100 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-slate-100 transition-all">
            <Filter className="w-4 h-4" /> Filter Protocols
          </button>
        </div>

        {/* Data Grid */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
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
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#64748b',
                  }
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f8fafc',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: '#f8fafc',
                },
              }}
              slots={{
                loadingOverlay: () => (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-50">
                    <CircularProgress size={32} thickness={5} className="text-brand-600" />
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

