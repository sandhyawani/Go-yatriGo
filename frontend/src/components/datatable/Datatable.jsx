import { showToast } from "../../utils/showToast";
import { DataGrid } from "@mui/x-data-grid";
import CircularProgress from "@mui/material/CircularProgress";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Trash2,
  FileText,
} from "lucide-react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import moment from "moment";
import axios from "../../api/axios";
import { AuthContext } from "../../context/authContext";
import useFetch from "../../hooks/useFetch";
import "./datatable.scss";

const ACTIVE_WINDOW_MS = 30 * 60 * 1000;
const USER_PAGE_SIZE = 8;

const getRoleBadge = (user) => {
  const role = `${user.role || ""} ${user.type || ""}`.toLowerCase();

  if (user.isAdmin || role.includes("admin")) {
    return { label: "Admin", className: "role-admin" };
  }
  if (role.includes("guide")) {
    return { label: "Guide", className: "role-guide" };
  }
  return { label: "Traveler", className: "role-traveler" };
};

const getUserStatus = (user) => {
  if (user.isSuspended) {
    return { label: "Suspended", className: "status-suspended" };
  }

  const lastUpdated = new Date(user.updatedAt).getTime();
  const active = Number.isFinite(lastUpdated) && Date.now() - lastUpdated < ACTIVE_WINDOW_MS;
  return active
    ? { label: "Online", className: "status-online" }
    : { label: "Offline", className: "status-offline" };
};

const UserActionMenu = ({ user, isOpen, isBusy, onToggle, onAction }) => {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen) return undefined;

    const updatePosition = () => {
      const bounds = triggerRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const menuHeight = user.isSuspended ? 216 : 216;
      const top =
        bounds.bottom + 8 + menuHeight > window.innerHeight
          ? Math.max(12, bounds.top - menuHeight - 8)
          : bounds.bottom + 8;

      setPosition({
        top,
        left: Math.max(12, bounds.right - 190),
      });
    };

    const closeOnOutsideClick = (event) => {
      if (
        !triggerRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        onToggle(false);
      }
    };

    updatePosition();
    document.addEventListener("mousedown", closeOnOutsideClick);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, onToggle, user.isSuspended]);

  const menu = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -4 }}
          transition={{ duration: 0.14 }}
          style={{ left: position.left, top: position.top }}
          className="user-action-menu fixed z-[1200] w-[190px] rounded-xl p-1.5"
          role="menu"
          aria-label={`Actions for ${user.name}`}
        >
          <button type="button" role="menuitem" onClick={() => onAction("view")}>
            <Eye /> View details
          </button>
          {user.govId && (
            <button type="button" role="menuitem" onClick={() => onAction("viewId")}>
              <FileText /> View Gov ID
            </button>
          )}
          <button type="button" role="menuitem" onClick={() => onAction("verify")}>
            <ShieldCheck /> {user.isVerified ? "Unverify User" : "Verify Identity"}
          </button>
          <button type="button" role="menuitem" onClick={() => onAction("edit")}>
            <Edit3 /> Edit user
          </button>
          <button type="button" role="menuitem" onClick={() => onAction("warn")}>
            <AlertTriangle /> Warn user
          </button>
          <button
            type="button"
            role="menuitem"
            className={user.isSuspended ? "success-action" : "danger-action"}
            onClick={() => onAction("suspend")}
          >
            <Ban /> {user.isSuspended ? "Unsuspend" : "Suspend"}
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            role="menuitem"
            className="danger-action"
            onClick={() => onAction("delete")}
          >
            <Trash2 /> Delete
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onToggle(!isOpen)}
        disabled={isBusy}
        aria-label={`Open actions for ${user.name}`}
        aria-expanded={isOpen}
        className="user-action-trigger"
      >
        {isBusy ? <CircularProgress size={16} color="inherit" /> : <MoreHorizontal className="h-4 w-4" />}
      </button>
      {typeof document !== "undefined" && createPortal(menu, document.body)}
    </>
  );
};

const Datatable = ({ columns, onDirectoryChange, activeFilter = "all" }) => {
  const { user: currentUser } = useContext(AuthContext);
  const location = useLocation();
  const path = location.pathname.split("/")[1];
  const isUserDirectory = path === "users";
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [list, setList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [page, setPage] = useState(0);
  const { data, loading: dataLoading } = useFetch(`/${path}`);

  useEffect(() => {
    setList(Array.isArray(data) ? data : (Array.isArray(data?.users) ? data.users : []));
  }, [data]);

  const refreshParentMetrics = () => {
    if (isUserDirectory && onDirectoryChange) {
      onDirectoryChange();
    }
  };

  const handleDelete = async (id) => {
    const entityLabel = isUserDirectory ? "user" : "entry";
    const confirmResult = await Swal.fire({
      title: `Delete ${entityLabel}?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Delete ${entityLabel}`,
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e11d48",
      reverseButtons: true,
      customClass: { popup: "moderation-dialog" },
    });

    if (!confirmResult.isConfirmed) return;

    try {
      setBusyUserId(id);
      setIsLoading(true);
      await axios.delete(`/${path}/${id}`);
      setList((previous) => previous.filter((item) => item._id !== id));
      refreshParentMetrics();
      await Swal.fire({
        icon: "success",
        title: `${isUserDirectory ? "User" : "Entry"} deleted`,
        timer: 1300,
        showConfirmButton: false,
        customClass: { popup: "moderation-dialog" },
      });
    } catch (error) {
      Swal.fire("Error", `Could not delete the ${entityLabel}.`, "error");
    } finally {
      setBusyUserId(null);
      setIsLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setIsLoading(true);
      await axios.put(`/${path}/approve/${id}`);
      setList((previous) =>
        previous.map((item) => (item._id === id ? { ...item, status: "APPROVED" } : item))
      );
      showToast.success("Approved!", "The restaurant is now active.");
    } catch (error) {
      showToast.error("Error", "Could not approve the restaurant.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = async (id) => {
    try {
      if (path === "users") {
        const userData = await axios.get(`/${path}/${id}`);
        navigate("/userpage", { state: userData.data });
      }
      if (path === "hotels") {
        const hotelData = await axios.get(`/${path}/find/${id}`);
        navigate("/hoteladmin", { state: hotelData.data });
      }
    } catch (error) {
      showToast.error("Error", "Could not open this record.");
    }
  };

  const handleViewId = (user) => {
    if (!user.govId) {
       Swal.fire("No Document", "This user has not uploaded a Government ID yet.", "info");
       return;
    }
    Swal.fire({
      title: `${user.name}'s Government ID`,
      imageUrl: user.govId,
      imageAlt: "Government ID",
      width: 'auto',
      imageHeight: 400,
      confirmButtonText: "Close",
      confirmButtonColor: "#9333ea",
      customClass: { popup: "moderation-dialog" }
    });
  };

  const handleVerify = async (user) => {
    const action = user.isVerified ? "unverify" : "verify";
    const actionLabel = user.isVerified ? "Unverify User" : "Verify Identity";
    const confirmResult = await Swal.fire({
      title: `${actionLabel} ${user.name}?`,
      text: user.isVerified
        ? "Their profile will no longer show the verified badge."
        : "Their profile will show the verified badge.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: actionLabel,
      confirmButtonColor: "#9333ea",
      customClass: { popup: "moderation-dialog" },
    });

    if (!confirmResult.isConfirmed) return;

    try {
      setBusyUserId(user._id);
      await axios.put(`/admin/user/${user._id}/verify`);
      setList((previous) =>
        previous.map((item) =>
          item._id === user._id ? { ...item, isVerified: !user.isVerified } : item
        )
      );
      Swal.fire({
        icon: "success",
        title: `User ${action === "verify" ? "verified" : "unverified"}`,
        timer: 1300,
        showConfirmButton: false,
        customClass: { popup: "moderation-dialog" },
      });
    } catch (error) {
      Swal.fire("Error", `Could not ${action} the user.`, "error");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleSuspend = async (user) => {
    const action = user.isSuspended ? "unsuspend" : "suspend";
    const actionLabel = user.isSuspended ? "Unsuspend" : "Suspend";
    const confirmResult = await Swal.fire({
      title: `${actionLabel} ${user.name}?`,
      text: user.isSuspended
        ? "Their platform access will be restored."
        : "Their account will be restricted immediately.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: actionLabel,
      confirmButtonColor: user.isSuspended ? "#059669" : "#e11d48",
      customClass: { popup: "moderation-dialog" },
    });

    if (!confirmResult.isConfirmed) return;

    try {
      setBusyUserId(user._id);
      await axios.put(`/admin/user/${user._id}/${action}`);
      setList((previous) =>
        previous.map((item) =>
          item._id === user._id ? { ...item, isSuspended: !user.isSuspended } : item
        )
      );
      refreshParentMetrics();
      Swal.fire({
        icon: "success",
        title: `User ${action === "suspend" ? "suspended" : "restored"}`,
        timer: 1300,
        showConfirmButton: false,
        customClass: { popup: "moderation-dialog" },
      });
    } catch (error) {
      Swal.fire("Error", `Could not ${action} the user.`, "error");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleWarn = async (user) => {
    const { value: message } = await Swal.fire({
      title: `Warn ${user.name}`,
      text: "Send an in-app moderation notice.",
      input: "textarea",
      inputPlaceholder: "Explain which policy needs attention...",
      inputAttributes: { "aria-label": "Warning message" },
      showCancelButton: true,
      confirmButtonText: "Send warning",
      confirmButtonColor: "#7c3aed",
      customClass: { popup: "moderation-dialog" },
      inputValidator: (value) => (!value?.trim() ? "A warning message is required." : undefined),
    });

    if (!message?.trim()) return;

    try {
      setBusyUserId(user._id);
      await axios.post(`/admin/user/${user._id}/warn`, { message: message.trim() });
      showToast.success("Warning sent");
    } catch (error) {
      showToast.error("Error", "Could not send this warning.");
    } finally {
      setBusyUserId(null);
    }
  };

  const filteredList = useMemo(() => {
    let baseList = Array.isArray(list) ? list : [];

    if (activeFilter === "admin") {
      baseList = baseList.filter(item => item.isAdmin || item?.role?.toLowerCase() === "admin" || item?.type?.toLowerCase() === "admin");
    } else if (activeFilter === "suspended") {
      baseList = baseList.filter(item => item.isSuspended);
    } else if (activeFilter === "online") {
      const ACTIVE_WINDOW_MS = 30 * 60 * 1000;
      baseList = baseList.filter(item => {
        const lastUpdated = new Date(item.updatedAt).getTime();
        return Number.isFinite(lastUpdated) && Date.now() - lastUpdated < ACTIVE_WINDOW_MS;
      });
    }

    if (currentUser && !currentUser.isAdmin && (path === "restaurant" || path === "hotels")) {
      baseList = baseList.filter((item) => {
        const rowUser = item.user || item.userId;
        const rowUserId = typeof rowUser === "object" ? rowUser?._id : rowUser;
        return rowUserId === currentUser?._id;
      });
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return baseList;

    return baseList.filter((item) =>
      [item.name, item.username, item.type, item.role, item.email, item.mobile, item.country, item.ownerName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [list, searchQuery, currentUser, path, activeFilter]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  useEffect(() => {
    const maximumPage = Math.max(0, Math.ceil(filteredList.length / USER_PAGE_SIZE) - 1);
    if (page > maximumPage) setPage(maximumPage);
  }, [filteredList.length, page]);

  const handleUserAction = (action, user) => {
    setOpenMenuId(null);
    if (action === "view") handleView(user._id);
    if (action === "viewId") handleViewId(user);
    if (action === "verify") handleVerify(user);
    if (action === "edit") navigate("/update", { state: user });
    if (action === "warn") handleWarn(user);
    if (action === "suspend") handleSuspend(user);
    if (action === "delete") handleDelete(user._id);
  };

  if (isUserDirectory) {
    const pageCount = Math.max(1, Math.ceil(filteredList.length / USER_PAGE_SIZE));
    const visibleUsers = filteredList.slice(page * USER_PAGE_SIZE, (page + 1) * USER_PAGE_SIZE);

    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: 0.16 }}
        aria-label="User directory"
        className="premium-directory flex flex-col gap-2"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Directory</h2>
            <p className="text-xs text-slate-500">
              {filteredList.length} account{filteredList.length === 1 ? "" : "s"} visible
            </p>
          </div>
          <label className="directory-search group relative w-full md:max-w-[470px]">
            <Search className="absolute left-3.5 top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-purple-600" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search users, email, role or location..."
              className="h-9 w-full rounded-lg border border-purple-100 bg-white/55 pl-10 pr-3 text-xs text-slate-700 outline-none backdrop-blur-xl transition-all placeholder:text-slate-400 focus:border-purple-300 focus:bg-white/90 focus:ring-4 focus:ring-purple-500/10"
            />
          </label>
        </div>

        <div className="directory-surface rounded-xl p-2">
          <div className="premium-table-scroll overflow-auto">
            <table className="premium-user-table w-full min-w-[820px] text-left">
              <thead>
                <tr>
                  <th className="w-[20%]">User</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="w-16 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dataLoading && !list.length
                  ? Array.from({ length: 5 }, (_, index) => (
                      <tr className="loading-row" key={`loading-${index}`}>
                        <td colSpan={6}>
                          <div className="h-10 animate-pulse rounded-lg bg-purple-50/80" />
                        </td>
                      </tr>
                    ))
                  : visibleUsers.map((user, index) => {
                      const role = getRoleBadge(user);
                      const status = getUserStatus(user);
                      return (
                        <motion.tr
                          layout
                          key={user._id}
                          initial={{ opacity: 0, y: 7 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.025 }}
                          className="premium-user-row"
                        >
                          <td>
                            <div className="flex items-center gap-3">
                              <img
                                className="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-100"
                                src={
                                  user.img ||
                                  user.pic ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    user.name || "User"
                                  )}&background=ede9fe&color=6d28d9&bold=true`
                                }
                                alt=""
                              />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-slate-900">{user.name}</p>
                                <p className="truncate text-[10px] text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`user-role-badge ${role.className}`}>{role.label}</span>
                          </td>
                          <td className="text-xs text-slate-500">{user.country || "Not specified"}</td>
                          <td>
                            <span className={`user-status ${status.className}`}>
                              <span />
                              {status.label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap text-xs text-slate-500">
                            {user.createdAt ? moment(user.createdAt).format("MMM D, YYYY") : "-"}
                          </td>
                          <td className="text-center">
                            <UserActionMenu
                              user={user}
                              isOpen={openMenuId === user._id}
                              isBusy={busyUserId === user._id}
                              onToggle={(open) => setOpenMenuId(open ? user._id : null)}
                              onAction={(action) => handleUserAction(action, user)}
                            />
                          </td>
                        </motion.tr>
                      );
                    })}
              </tbody>
            </table>
            {!dataLoading && !visibleUsers.length && (
              <div className="my-4 rounded-xl border border-dashed border-purple-200 bg-white/50 p-6 text-center">
                <p className="text-xs font-medium text-slate-700">No users match your search.</p>
                <p className="mt-1 text-[10px] text-slate-400">Try a name, email address, role, or country.</p>
              </div>
            )}
          </div>

          <footer className="flex flex-col gap-2 border-t border-purple-100 px-2 pb-1 pt-2 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {filteredList.length ? page * USER_PAGE_SIZE + 1 : 0}-
              {Math.min((page + 1) * USER_PAGE_SIZE, filteredList.length)} of {filteredList.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="directory-page-button"
                disabled={page === 0}
                onClick={() => setPage((previous) => Math.max(0, previous - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[68px] text-center font-medium text-slate-600">
                {page + 1} / {pageCount}
              </span>
              <button
                type="button"
                className="directory-page-button"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((previous) => Math.min(pageCount - 1, previous + 1))}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </div>
      </motion.section>
    );
  }

  const actionColumn = [
    {
      field: "action",
      headerName: "Actions",
      width: 180,
      renderCell: (params) => {
        const rowUser = params.row.user || params.row.userId;
        const rowUserId = typeof rowUser === "object" ? rowUser._id : rowUser;
        const isOwner = rowUserId === currentUser?._id;
        const canManage = currentUser?.isAdmin || isOwner;

        return (
          <div className="flex items-center space-x-2">
            <button
              title="View"
              className="rounded-lg bg-slate-100 p-1.5 text-slate-600 shadow-sm transition-all hover:bg-slate-900 hover:text-white"
              onClick={() => handleView(params.row._id)}
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            {currentUser?.isAdmin && path === "restaurant" && params.row.status === "PENDING" && (
              <button
                title="Approve"
                onClick={() => handleApprove(params.row._id)}
                className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600 shadow-sm transition-all hover:bg-emerald-600 hover:text-white"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
              </button>
            )}
            {canManage && ["hotels", "train", "restaurant"].includes(path) && (
              <Link to={`/${path}/update/${params.row._id}`}>
                <button
                  title="Edit"
                  className="rounded-lg bg-blue-50 p-1.5 text-blue-600 shadow-sm transition-all hover:bg-blue-600 hover:text-white"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </Link>
            )}
            {canManage && (
              <button
                title="Delete"
                onClick={() => handleDelete(params.row._id)}
                className="rounded-lg bg-purple-50 p-1.5 text-purple-600 shadow-sm transition-all hover:bg-purple-600 hover:text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 pb-12 pt-0">
      <div className="flex justify-end">
        <label className="group relative w-full md:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-purple-600" />
          <input
            className="w-full rounded-lg border border-purple-200 bg-white py-2 pl-10 pr-4 text-[10px] font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
            placeholder="Filter data..."
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
      </div>
      <div className="overflow-hidden rounded-xl border border-purple-100 bg-white shadow-sm">
        <DataGrid
          className="datagrid"
          rows={filteredList}
          columns={columns.concat(actionColumn)}
          loading={isLoading}
          getRowId={(row) => row._id}
          pageSize={10}
          rowsPerPageOptions={[10]}
          checkboxSelection
          disableSelectionOnClick
          rowHeight={40}
          headerHeight={36}
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#faf5ff",
              color: "#7e22ce",
              fontSize: "9px",
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              borderBottom: "1px solid #f3e8ff",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #faf5ff",
              color: "#475569",
              fontSize: "10px",
              fontWeight: "500",
            },
            "& .MuiDataGrid-row:hover": { backgroundColor: "#faf5ff" },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid #f3e8ff",
              minHeight: "36px",
            },
          }}
        />
      </div>
    </div>
  );
};

export default Datatable;
