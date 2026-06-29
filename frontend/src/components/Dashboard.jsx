import React, { Component } from "react";
import {
  FaEllipsisV,
  FaRegCalendarMinus,
  FaChartLine,
  FaMoneyBillWave,
  FaArrowUp,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Piechart from "./Piechart";

const MONTHLY_DATA = [
  { name: "January", expectedRevenue: 4000, realRevenue: 2400 },
  { name: "February", expectedRevenue: 3000, realRevenue: 1398 },
  { name: "March", expectedRevenue: 2000, realRevenue: 9800 },
  { name: "April", expectedRevenue: 2780, realRevenue: 3908 },
  { name: "May", expectedRevenue: 1890, realRevenue: 4800 },
  { name: "June", expectedRevenue: 2390, realRevenue: 3800 },
  { name: "July", expectedRevenue: 3490, realRevenue: 4300 },
  { name: "August", expectedRevenue: 2500, realRevenue: 4358 },
  { name: "September", expectedRevenue: 3490, realRevenue: 4220 },
  { name: "October", expectedRevenue: 3420, realRevenue: 4380 },
  { name: "November", expectedRevenue: 3490, realRevenue: 4300 },
  { name: "December", expectedRevenue: 3490, realRevenue: 4300 },
];

const STAT_CARDS = [
  {
    id: "monthly",
    label: "Earnings (Monthly)",
    value: 40000,
    accent: "#25db47",
    Icon: FaRegCalendarMinus,
  },
  {
    id: "annually",
    label: "Earnings (Annually)",
    value: 100000,
    accent: "#edea50",
    Icon: FaChartLine,
  },
  {
    id: "expenses",
    label: "Expenses",
    value: 60000,
    accent: "#df4e4e",
    Icon: FaMoneyBillWave,
  },
  {
    id: "profit",
    label: "Profit",
    value: 40000,
    accent: "#4E73DF",
    Icon: FaArrowUp,
  },
];

const formatINR = (n) => "₹ " + n.toLocaleString("en-IN");

class ChartErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[ChartErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">
          Chart unavailable
        </div>
      );
    }
    return this.props.children;
  }
}

const StatCard = ({ label, value, accent, Icon }) => (
  <div
    className="h-[100px] bg-white flex items-center justify-between px-[30px]
               cursor-pointer hover:shadow-lg transform hover:scale-[103%]
               transition duration-300 ease-out"
    style={{
      borderLeft: `4px solid ${accent}`,
      borderRadius: "0 8px 8px 0",
    }}
    role="region"
    aria-label={label}
  >
    <div>
      <p className="text-[11px] font-bold text-[#5a5c69] uppercase tracking-wide">
        {label}
      </p>
      <p className="text-[20px] font-bold text-[#5a5c69] mt-[5px]">
        {formatINR(value)}
      </p>
    </div>
    <Icon fontSize={28} color="#cccccc" aria-hidden="true" />
  </div>
);

const PanelHeader = ({ title }) => (
  <div className="bg-[#F8F9FC] flex items-center justify-between py-[15px] px-[20px] border-b border-[#EDEDED]">
    <h3 className="text-[14px] font-semibold text-[#5a5c69] m-0">{title}</h3>
    <button
      type="button"
      aria-label={`More options for ${title}`}
      className="p-1 rounded hover:bg-gray-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <FaEllipsisV color="gray" aria-hidden="true" />
    </button>
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded shadow-md p-3 text-sm">
      <p className="font-semibold text-[#5a5c69] mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.stroke }}>
          {entry.name}: {formatINR(entry.value)}
        </p>
      ))}
    </div>
  );
};

const Dashboard = () => (
  <div className="pt-[25px] px-[25px] bg-[#F8F9FC] mt-3">
    <h1 className="text-[#5a5c69] text-[28px] leading-[34px] font-normal">
      Dashboard
    </h1>

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[30px] mt-[25px] pb-[15px]">
      {STAT_CARDS.map((card) => (
        <StatCard key={card.id} {...card} />
      ))}
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-[70fr_30fr] gap-[30px] mt-[22px]">
      <div className="border bg-white shadow-md rounded-[4px] min-w-0">
        <PanelHeader title="Earning overview" />
        <div className="p-4">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={MONTHLY_DATA}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#888" }}
                tickFormatter={(v) => v.slice(0, 3)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#888" }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Line
                type="monotone"
                dataKey="expectedRevenue"
                name="Expected Revenue"
                stroke="#8884d8"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="realRevenue"
                name="Real Revenue"
                stroke="#82ca9d"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border bg-white shadow-md rounded-[4px] min-w-0">
        <PanelHeader title="Revenue resources" />
        <div className="p-4">
          <ChartErrorBoundary>
            <Piechart />
          </ChartErrorBoundary>
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;
