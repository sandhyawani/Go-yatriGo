import { motion } from "framer-motion";
import { Activity, Download, Flag, ShieldCheck, UserPlus, Users, UserX } from "lucide-react";
import moment from "moment";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Link, useLocation, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import Datatable from "../components/datatable/Datatable";
import useFetch from "../hooks/useFetch";

const CARD_ENTRANCE = {
  hidden: { opacity: 0, y: 14 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 + index * 0.045, duration: 0.32, ease: "easeOut" },
  }),
};

const Userlist = ({ columns }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const initialFilter = searchParams.get("filter") || "all";
  const path = location.pathname.split("/")[1];
  const {
    data: usersData,
    loading: usersLoading,
    error,
    reFetch: refreshUsers,
  } = useFetch(`/${path}`);
  const {
    data: stats,
    loading: statsLoading,
    reFetch: refreshStats,
  } = useFetch("/admin/stats");

  const users = Array.isArray(usersData) ? usersData : [];
  const metrics = [
    {
      label: "Total Users",
      value: usersLoading ? null : users.length,
      detail: "Directory accounts",
      icon: Users,
      tone: "purple",
      filterValue: "all"
    },
    {
      label: "Active Users",
      value: statsLoading ? null : stats?.activeUsers ?? 0,
      detail: "Active in 30 minutes",
      icon: Activity,
      tone: "purple",
      filterValue: "online"
    },
    {
      label: "Admins",
      value: usersLoading ? null : users.filter((user) => user.isAdmin).length,
      detail: "Privileged access",
      icon: ShieldCheck,
      tone: "purple",
      filterValue: "admin"
    },
    {
      label: "Suspended",
      value: statsLoading
        ? null
        : stats?.suspendedUsers ?? users.filter((user) => user.isSuspended).length,
      detail: "Restricted accounts",
      icon: UserX,
      tone: "purple",
      filterValue: "suspended"
    },
    {
      label: "Pending Reports",
      value: statsLoading ? null : stats?.reports ?? stats?.metrics?.reportsPending ?? 0,
      detail: "Awaiting review",
      icon: Flag,
      tone: "purple",
      filterValue: "reports"
    },
  ];

  const [activeFilter, setActiveFilter] = useState(initialFilter);

  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  const handleMetricClick = (filterValue) => {
    if (filterValue === "reports") {
      navigate("/admin/reports");
    } else {
      setActiveFilter(filterValue);
      // Optional: update URL
      navigate(`/users${filterValue === "all" ? "" : `?filter=${filterValue}`}`);
    }
  };

  const generatePDF = () => {
    if (!users.length) return;

    const doc = new jsPDF();
    const tableColumn = [
      "No",
      "Name",
      "Email",
      "Mobile",
      "Country",
      "Type",
      "Created At",
      "Updated At",
    ];
    const tableRows = [...users].reverse().map((user, index) => [
      index + 1,
      user.name ?? "-",
      user.email ?? "-",
      user.mobile ?? "-",
      user.country ?? "-",
      user.type ?? "-",
      moment(user.createdAt).format("MM/DD/YYYY h:mm A"),
      moment(user.updatedAt).format("MM/DD/YYYY h:mm A"),
    ]);
    const dateStr = moment().format("MMM-DD-YYYY");

    doc.setFontSize(20).setTextColor(80, 53, 192);
    doc.setFont("helvetica", "bold");
    doc.text("Go Go YatriGo", 14, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10).setTextColor(50, 55, 65);
    doc.text("User Details Report", 14, 23);
    doc.text(`Report Generated: ${dateStr}`, 14, 30);
    doc.text("Go Go YatriGo.co, Connaught Place, New Delhi, India", 14, 37);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 7 },
      startY: 45,
      headStyles: { fillColor: [80, 53, 192] },
    });
    doc.save(`User-Details-Report_${dateStr}.pdf`);
  };

  const refreshDirectoryMetrics = () => {
    refreshUsers();
    refreshStats();
  };

  return (
    <div className="user-management-page relative min-h-[calc(100vh-72px)] overflow-hidden bg-white px-3 pb-6 pt-4 sm:px-4 lg:px-6">
      <div className="pointer-events-none absolute -right-28 -top-36 h-96 w-96 rounded-full bg-purple-400/10 blur-3xl" />
      <div className="pointer-events-none absolute left-10 top-52 h-64 w-64 rounded-full bg-purple-400/5 blur-3xl" />

      <div className="relative mx-auto max-w-[1450px] space-y-4">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34 }}
          className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end"
        >
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-purple-600">
                Trust and Safety
              </span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              User Management
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              Monitor identities, permissions, and moderation actions in one workspace.
            </p>
            {error && (
              <p className="mt-2 text-xs font-semibold text-rose-600">
                Failed to load users. Please refresh.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/adduser"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-500 hover:shadow-md active:translate-y-0"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Operator
            </Link>
            <button
              type="button"
              onClick={generatePDF}
              disabled={usersLoading || !users.length}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-purple-200 bg-white/55 px-3.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-xl transition-all duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {usersLoading ? "Loading..." : "Export Report"}
            </button>
          </div>
        </motion.header>

        <section
          aria-label="User moderation metrics"
          className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5"
        >
          {metrics.map(({ label, value, detail, icon: Icon, tone, filterValue }, index) => (
            <motion.article
              key={label}
              custom={index}
              variants={CARD_ENTRANCE}
              initial="hidden"
              animate="visible"
              onClick={() => handleMetricClick(filterValue)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative flex items-center gap-3 cursor-pointer overflow-hidden rounded-xl border bg-white p-3 transition-colors duration-300 hover:border-purple-300 hover:bg-purple-50 ${
                activeFilter === filterValue ? "border-purple-400 bg-purple-50/50 shadow-sm" : "border-purple-200"
              }`}
            >
              <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-gradient-to-br from-purple-200 to-transparent blur-2xl transition-opacity duration-300 group-hover:opacity-80" />
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                activeFilter === filterValue ? "bg-purple-200 text-purple-800" : "bg-purple-100 text-purple-700 group-hover:bg-purple-200"
              }`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="relative min-w-0 flex-1">
                <p className="text-lg font-bold tracking-tight text-slate-900 tabular-nums leading-tight">
                  {value === null ? (
                    <span className="inline-block h-5 w-10 animate-pulse rounded bg-slate-200/70" />
                  ) : (
                    value
                  )}
                </p>
                <p className="truncate text-xs font-semibold text-slate-700">{label}</p>
                <p className="truncate text-[10px] text-slate-500">{detail}</p>
              </div>
            </motion.article>
          ))}
        </section>

        <Datatable columns={columns} onDirectoryChange={refreshDirectoryMetrics} activeFilter={activeFilter} />
      </div>
    </div>
  );
};

export default Userlist;
