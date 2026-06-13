import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import axios from "../api/axios";
import { useAuth } from "../context/authContext";

const KPI_CONFIG = [
  {
    key: "totalUsers",
    label: "Total users",
    detail: "Registered travelers",
    to: "/users",
    Icon: Users,
    iconClass: "bg-purple-100 text-purple-700",
    glowClass: "from-purple-200",
  },
  {
    key: "activeUsers",
    label: "Active users",
    detail: "Sessions in last 30 min",
    to: "/users?filter=online",
    Icon: Activity,
    iconClass: "bg-purple-100 text-purple-700",
    glowClass: "from-purple-200",
  },
  {
    key: "reportsPending",
    label: "Reports pending",
    detail: "Needs a moderator",
    to: "/admin/reports",
    Icon: ShieldAlert,
    iconClass: "bg-purple-100 text-purple-700",
    glowClass: "from-purple-300",
    priority: true,
  },
  {
    key: "suspendedUsers",
    label: "Suspended users",
    detail: "Access restricted",
    to: "/users?filter=suspended",
    Icon: XCircle,
    iconClass: "bg-purple-100 text-purple-700",
    glowClass: "from-purple-200",
  },
  {
    key: "newPostsToday",
    label: "New posts today",
    detail: "Community submissions",
    to: "/",
    Icon: FileText,
    iconClass: "bg-purple-100 text-purple-700",
    glowClass: "from-purple-200",
  },
];

const STATUS_COLORS = {
  pending: "#a855f7",
  resolved: "#c084fc",
  dismissed: "#e9d5ff",
  unknown: "#d8b4fe",
};

const formatNumber = (number) =>
  typeof number === "number" ? new Intl.NumberFormat("en-IN").format(number) : "--";

const displayName = (person) => person?.username || person?.name || "Unknown user";

const reportStatus = (report) => (report?.status || "pending").toLowerCase();

const formatReportAge = (date) => {
  if (!date) return "Recently";

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (elapsedMinutes < 60) return `${Math.max(1, elapsedMinutes)}m ago`;
  if (elapsedMinutes < 1440) return `${Math.floor(elapsedMinutes / 60)}h ago`;
  return `${Math.floor(elapsedMinutes / 1440)}d ago`;
};

const MetricSkeleton = () => (
  <div className="flex h-full min-h-[120px] animate-pulse flex-col justify-between rounded-xl border border-purple-200 bg-purple-50 p-3">
    <div className="mb-3 h-8 w-8 rounded-lg bg-purple-100" />
    <div>
      <div className="mb-1.5 h-6 w-16 rounded bg-purple-100" />
      <div className="h-3 w-24 rounded bg-purple-100" />
    </div>
  </div>
);

const MetricCard = ({ config, value, index }) => {
  const { label, detail, to, Icon, iconClass, glowClass, priority } = config;

  const content = (
    <div
      className={`group relative flex h-full min-h-[120px] flex-col justify-between overflow-hidden rounded-xl border p-3 transition duration-300 ${
        priority
          ? "border-purple-300 bg-purple-50 hover:border-purple-400"
          : "border-purple-200 bg-white hover:border-purple-300 hover:bg-purple-50"
      }`}
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-gradient-to-br ${glowClass} to-transparent blur-2xl`}
      />
      <div className="relative flex items-start justify-between">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        {priority && (
          <span className="rounded-full border border-purple-200 bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-purple-700">
            Urgent
          </span>
        )}
      </div>
      <div className="relative mt-3">
        <p className="text-xl font-bold tracking-tight text-slate-900">{formatNumber(value)}</p>
        <p className="text-xs font-semibold text-slate-800">{label}</p>
        <p className="text-[10px] text-slate-500">{detail}</p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: index * 0.045 }}
      whileHover={{ y: -2 }}
      className="h-full"
    >
      {to ? (
        <Link to={to} className="block h-full" aria-label={`${label}: ${formatNumber(value)}`}>
          {content}
        </Link>
      ) : (
        content
      )}
    </motion.div>
  );
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-purple-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur">
      <p className="mb-1.5 text-xs font-medium text-slate-700">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="text-xs font-medium" style={{ color: item.color }}>
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
};

const EmptyChart = ({ children }) => (
  <div className="flex h-[160px] items-center justify-center text-sm text-slate-500">{children}</div>
);

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  const fetchStats = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get("/admin/stats", { signal });
      setStats(data);
      setUpdatedAt(new Date());
    } catch (requestError) {
      if (requestError.code !== "ERR_CANCELED" && requestError.name !== "CanceledError") {
        setError(requestError?.response?.data?.message || "Unable to load moderation insights.");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchStats(controller.signal);
    return () => controller.abort();
  }, [fetchStats]);

  const metrics = useMemo(
    () => ({
      totalUsers: stats?.metrics?.totalUsers ?? stats?.totalUsers ?? stats?.counts?.users,
      activeUsers: stats?.metrics?.activeUsers ?? stats?.activeUsers,
      reportsPending: stats?.metrics?.reportsPending ?? stats?.reports ?? stats?.counts?.reports,
      suspendedUsers: stats?.metrics?.suspendedUsers ?? stats?.suspendedUsers,
      newPostsToday: stats?.metrics?.newPostsToday ?? stats?.newPostsToday,
    }),
    [stats]
  );

  const trend = useMemo(
    () =>
      (stats?.activityTrend || []).map((entry) => ({
        ...entry,
        label: new Date(`${entry.date}T00:00:00`).toLocaleDateString("en-US", {
          weekday: "short",
        }),
      })),
    [stats]
  );

  const reportDistribution = stats?.reportStatusDistribution || [];
  const pendingQueue = stats?.priorityReports || [];
  const recentReports = stats?.recentReports || [];
  const hasReports = Number(metrics.reportsPending || 0) > 0;

  if (!user) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <main
      className="min-h-[calc(100vh-72px)] bg-white px-3 pb-6 pt-4 text-slate-900 sm:px-4 lg:px-6"
      aria-label="Admin dashboard"
    >
      <div className="mx-auto max-w-[1450px]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-4 overflow-hidden rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-50 px-4 py-3 shadow-sm sm:px-5 sm:py-4"
        >
          <div className="pointer-events-none absolute -right-12 -top-20 h-52 w-52 rounded-full bg-purple-200 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <p className="mb-2 text-xs font-medium text-purple-600">
                {greeting}, {user.name || "Administrator"}
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                Moderation Command Center
              </h1>
              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-600">
                Monitor community safety, review flagged content, and respond to trust signals in real time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fetchStats()}
                disabled={loading}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 text-xs font-medium text-slate-700 transition hover:bg-purple-50 hover:text-slate-900 disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <Link
                to="/admin/reports"
                className="flex h-9 items-center gap-1.5 rounded-lg bg-purple-600 px-4 text-xs font-semibold text-white shadow-md shadow-purple-900/20 transition hover:bg-purple-700"
              >
                Review reports
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          {updatedAt && (
            <p className="relative mt-3 text-[10px] text-slate-500">
              Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-xl border border-purple-300 bg-purple-50 px-3 py-2 text-xs text-purple-800"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-purple-600" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => fetchStats()} className="font-medium text-purple-900 hover:underline">
              Retry
            </button>
          </motion.div>
        )}

        <div role="region" aria-label="Live platform metrics" className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {loading && !stats
            ? KPI_CONFIG.map((card) => <MetricSkeleton key={card.key} />)
            : KPI_CONFIG.map((card, index) => (
                <MetricCard key={card.key} config={card} value={metrics[card.key]} index={index} />
              ))}
        </div>

        <div className="mb-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            role="region"
            aria-label="Moderation alerts"
            className={`relative overflow-hidden rounded-xl border p-4 shadow-sm sm:p-5 ${
              hasReports
                ? "border-purple-300 bg-gradient-to-br from-purple-100 via-white to-transparent"
                : "border-purple-200 bg-gradient-to-br from-purple-50 via-white to-transparent"
            }`}
          >
            <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-purple-200/50 blur-3xl" />
            <div className="relative mb-4 flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    hasReports ? "bg-purple-200 text-purple-700" : "bg-purple-100 text-purple-600"
                  }`}
                >
                  {hasReports ? <ShieldAlert className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Moderation alerts
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {hasReports ? `${metrics.reportsPending} reports require review` : "Moderation queue is clear"}
                  </h2>
                  <p className="text-xs text-slate-600">
                    {hasReports ? "Investigate recent safety flags and take action." : "There are no pending reports right now."}
                  </p>
                </div>
              </div>
              <Link
                to="/admin/reports"
                className="hidden items-center gap-1 text-xs font-medium text-purple-600 transition hover:text-slate-900 sm:flex"
              >
                Full queue <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="relative grid gap-2.5">
              {pendingQueue.length > 0 ? (
                pendingQueue.slice(0, 3).map((report) => (
                  <Link
                    key={report._id}
                    to="/admin/reports"
                    className="group flex items-center gap-2 rounded-xl border border-purple-200 bg-white px-3 py-2 transition hover:border-purple-300 hover:bg-purple-50"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-purple-500 shadow-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-900">
                        {displayName(report.reportedUser)}
                        <span className="ml-1.5 text-[10px] font-normal text-slate-500">{report.targetType}</span>
                      </p>
                      <p className="truncate text-[11px] text-slate-600">{report.reason}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">{formatReportAge(report.createdAt)}</span>
                  </Link>
                ))
              ) : (
                <div className="rounded-xl border border-purple-200 bg-white px-3 py-5 text-center text-xs text-slate-500">
                  No flagged items waiting in the queue.
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-purple-200 bg-purple-50 p-4 shadow-sm sm:p-5"
            role="region"
            aria-label="Recent moderation activity"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Activity
                </p>
                <h2 className="text-base font-semibold text-slate-900">Recent reports</h2>
              </div>
              <Clock className="h-4 w-4 text-slate-500" />
            </div>
            <div className="space-y-1">
              {recentReports.length > 0 ? (
                recentReports.slice(0, 5).map((report) => {
                  const status = reportStatus(report);
                  return (
                    <div key={report._id} className="flex items-center gap-2.5 rounded-lg px-1 py-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[status] || STATUS_COLORS.unknown }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-slate-800">
                          {displayName(report.reportedUser)}
                          <span className="ml-1 text-[10px] text-slate-500">reported for {report.targetType}</span>
                        </p>
                      </div>
                      <span className="rounded-md bg-purple-100 px-1.5 py-0.5 text-[9px] capitalize text-slate-600">
                        {status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">No moderation activity recorded.</div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.55fr_0.75fr]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.23 }}
            className="rounded-xl border border-purple-200 bg-purple-50 p-4 shadow-sm sm:p-5"
            role="region"
            aria-label="Content and reports analytics"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Analytics
                </p>
                <h2 className="text-base font-semibold text-slate-900">Safety signals over 7 days</h2>
              </div>
              <span className="flex items-center gap-1 rounded-md bg-purple-100 px-2 py-1 text-[10px] font-medium text-purple-700">
                <TrendingUp className="h-3.5 w-3.5" />
                Live data
              </span>
            </div>
            {trend.length ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={trend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="postsColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.42} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="reportsColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d8b4fe" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#d8b4fe" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.10)" strokeDasharray="4 5" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="posts"
                    name="New posts"
                    stroke="#8b5cf6"
                    fill="url(#postsColor)"
                    strokeWidth={2.25}
                  />
                  <Area
                    type="monotone"
                    dataKey="reports"
                    name="Reports"
                    stroke="#a855f7"
                    fill="url(#reportsColor)"
                    strokeWidth={2.25}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart>Analytics will appear after the first sync.</EmptyChart>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="rounded-xl border border-purple-200 bg-purple-50 p-4 shadow-sm sm:p-5"
            role="region"
            aria-label="Report outcomes"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Resolution mix
            </p>
            <h2 className="text-base font-semibold text-slate-900">Report outcomes</h2>
            {reportDistribution.length ? (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie
                      data={reportDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={46}
                      outerRadius={65}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {reportDistribution.map((item) => (
                        <Cell
                          key={item.name}
                          fill={STATUS_COLORS[item.name.toLowerCase()] || STATUS_COLORS.unknown}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {reportDistribution.map((item) => (
                    <div key={item.name} className="flex items-center text-xs">
                      <span
                        className="mr-2 h-2 w-2 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[item.name.toLowerCase()] || STATUS_COLORS.unknown }}
                      />
                      <span className="flex-1 capitalize text-slate-600">{item.name}</span>
                      <span className="font-medium text-slate-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyChart>No reports recorded yet.</EmptyChart>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
};

export default Admin;
