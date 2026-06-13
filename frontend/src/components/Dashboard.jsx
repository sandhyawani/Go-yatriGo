// import React from 'react'
// import {HiDownload } from "react-icons/hi";
// import { FaEllipsisV, FaRegCalendarMinus } from 'react-icons/fa';
// import { PureComponent } from 'react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import Piechart from './Piechart';

// const data = [
//   {
//     name: 'January',
//     Expected_revenue: 4000,
//      Real_revenue: 2400,
//     amt: 2400,
//   },
//   {
//     name: 'February',
//     Expected_revenue: 3000,
//      Real_revenue: 1398,
//     amt: 2210,
//   },
//   {
//     name: 'March',
//     Expected_revenue: 2000,
//      Real_revenue: 9800,
//     amt: 2290,
//   },
//   {
//     name: 'April',
//     Expected_revenue: 2780,
//      Real_revenue: 3908,
//     amt: 2000,
//   },
//   {
//     name: 'May',
//     Expected_revenue: 1890,
//      Real_revenue: 4800,
//     amt: 2181,
//   },
//   {
//     name: 'June',
//     Expected_revenue: 2390,
//      Real_revenue: 3800,
//     amt: 2500,
//   },
//   {
//     name: 'July',
//     Expected_revenue: 3490,
//      Real_revenue: 4300,
//     amt: 2100,
//   },
//    {
//     name: 'Auguest',
//     Expected_revenue: 2500,
//      Real_revenue: 4358,
//     amt: 2100,
//   },
//    {
//     name: 'September',
//     Expected_revenue: 3490,
//      Real_revenue: 4220,
//     amt: 2150,
//   },
//    {
//     name: 'Octomber',
//     Expected_revenue: 3420,
//      Real_revenue: 4380,
//     amt: 2500,
//   },
//    {
//     name: 'November',
//     Expected_revenue: 3490,
//      Real_revenue: 4300,
//     amt: 2100,
//   },
//    {
//     name: 'December',
//     Expected_revenue: 3490,
//     Real_revenue: 4300,
//     amt: 2100,
//   },
  
// ];




// const Dashboard = () => {
//   return (
//     <div className='pt-[25px] px-[25px] bg-[#F8F9FC] mt-3 ' >
//         <div className='flex items-center justify-between'>
//             <h1 className='text-[#5a5c69] text-[28px] leading-[34px] font-normal cursor-pointer'>Dashboard</h1>
            
          
//         </div>
//           <div className=' grid grid-cols-4 gap-[30px] mt-[25px] pb-[15px]'>

//              <div className='h-[100px] rounded-[8px] bg-white border-l-[4px] border-[#25db47] flex items-center justify-between px-[30px] cursor-pointer hover:shadow-lg transform hover:scale-[103%] transition duration-300 ease-out'>
//                 <div>

//                      <h2 className='text-[11px] leading-[17px] font-bold'>Earnings(Monthly)</h2>
//                       <h1 className='text-[20px] leading-[24px] font-bold text-[#5a5c69] mt-[5px]'>₹ 40,000</h1>
//                 </div>
//                 <FaRegCalendarMinus fontSize={28} color="" />
//              </div>
//                <div className='h-[100px] rounded-[8px] bg-white border-l-[4px] border-[#edea50] flex items-center justify-between px-[30px] cursor-pointer hover:shadow-lg transform hover:scale-[103%] transition duration-300 ease-out'>
//                 <div>

//                      <h2 className='text-[11px] leading-[17px] font-bold'>Earnings(Anually)</h2>
//                       <h1 className='text-[20px] leading-[24px] font-bold text-[#5a5c69] mt-[5px]'>₹ 100,000</h1>
//                 </div>
//                 <FaRegCalendarMinus fontSize={28} color="" />
//              </div> <div className='h-[100px] rounded-[8px] bg-white border-l-[4px] border-[#df4e4e] flex items-center justify-between px-[30px] cursor-pointer hover:shadow-lg transform hover:scale-[103%] transition duration-300 ease-out'>
//                 <div>

//                      <h2 className='text-[11px] leading-[17px] font-bold'>Expenses</h2>
//                       <h1 className='text-[20px] leading-[24px] font-bold text-[#5a5c69] mt-[5px]'>₹ 60,000</h1>
//                 </div>
//                 <FaRegCalendarMinus fontSize={28} color="" />
//              </div> <div className='h-[100px] rounded-[8px] bg-white border-l-[4px] border-[#4E73DF] flex items-center justify-between px-[30px] cursor-pointer hover:shadow-lg transform hover:scale-[103%] transition duration-300 ease-out'>
//                 <div>

//                      <h2 className='text-[11px] leading-[17px] font-bold'>Profit</h2>
//                       <h1 className='text-[20px] leading-[24px] font-bold text-[#5a5c69] mt-[5px]'>₹ 40,000</h1>
//                 </div>
//                 <FaRegCalendarMinus fontSize={28} color="" />
//              </div>
//             </div>

//             <div className='flex mt-[22px] w-full gap-[30px]'>
//                 <div className='basis-[70%] border bg-white shadow-md cursor-pointer rounded-[4px]' >
//                     <div className='bg-[#F8F9FC] flex items-center justify-between py-[15px] px-[20px] border-b-[1px] border-[#EDEDED] mb-[20px]'>
//                         <h2>Earning overview</h2>
//                         <FaEllipsisV color='gray' className='cursor-pointer'/>
//                     </div>
//             <div>
//                        <LineChart
//           width={750}
//           height={500}
//           data={data}
//           margin={{
//             top: 5,
//             right: 30,
//             left: 20,
//             bottom: 5,
//           }}
//         >
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis dataKey="name" />
//           <YAxis />
//           <Tooltip />
//           <Legend />
//           <Line type="monotone" dataKey="Expected_revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
//           <Line type="monotone" dataKey="Real_revenue" stroke="#82ca9d" />
//         </LineChart>
//         </div>
//             </div>
//         <div className='basis-[30%] border bg-white shadow-md cursor-pointer rounded-[4px]'>
//             <div className='bg-[#F8F9FC] flex items-center justify-between py-[15px] px-[20px] border-b-[1px] border-[#EDEDED]'>
//                 <h2>Revenue Resources</h2>
//                  <FaEllipsisV color='gray' className='cursor-pointer'/>
//             </div>
//             <div>
//                 <Piechart/>
//             </div>

//         </div>
//             </div>
//         </div>
//   )
// }

// export default Dashboard


import React, { Component } from 'react';
import {
  FaEllipsisV,
  FaRegCalendarMinus,
  FaChartLine,
  FaMoneyBillWave,
  FaArrowUp,
} from 'react-icons/fa';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Piechart from './Piechart';

// ─── Data & Config ────────────────────────────────────────────────────────────
// Values are plain numbers so they can be sorted, summed, or fetched from an API.
// Format them at render time with formatINR().

const MONTHLY_DATA = [
  { name: 'January',   expectedRevenue: 4000,  realRevenue: 2400 },
  { name: 'February',  expectedRevenue: 3000,  realRevenue: 1398 },
  { name: 'March',     expectedRevenue: 2000,  realRevenue: 9800 },
  { name: 'April',     expectedRevenue: 2780,  realRevenue: 3908 },
  { name: 'May',       expectedRevenue: 1890,  realRevenue: 4800 },
  { name: 'June',      expectedRevenue: 2390,  realRevenue: 3800 },
  { name: 'July',      expectedRevenue: 3490,  realRevenue: 4300 },
  { name: 'August',    expectedRevenue: 2500,  realRevenue: 4358 },
  { name: 'September', expectedRevenue: 3490,  realRevenue: 4220 },
  { name: 'October',   expectedRevenue: 3420,  realRevenue: 4380 },
  { name: 'November',  expectedRevenue: 3490,  realRevenue: 4300 },
  { name: 'December',  expectedRevenue: 3490,  realRevenue: 4300 },
];

// id field provides a stable React key independent of label text
const STAT_CARDS = [
  { id: 'monthly',  label: 'Earnings (Monthly)',  value: 40000,  accent: '#25db47', Icon: FaRegCalendarMinus },
  { id: 'annually', label: 'Earnings (Annually)', value: 100000, accent: '#edea50', Icon: FaChartLine },
  { id: 'expenses', label: 'Expenses',             value: 60000,  accent: '#df4e4e', Icon: FaMoneyBillWave },
  { id: 'profit',   label: 'Profit',               value: 40000,  accent: '#4E73DF', Icon: FaArrowUp },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats a number as Indian-locale currency, e.g. 100000 → "₹ 1,00,000" */
const formatINR = (n) =>
  '₹ ' + n.toLocaleString('en-IN');

// ─── Error Boundary ───────────────────────────────────────────────────────────
// Prevents a crash inside <Piechart> from taking down the whole Dashboard.

class ChartErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In production, pipe this to your error-reporting service (e.g. Sentry).
    console.error('[ChartErrorBoundary]', error, info);
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

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * StatCard — one card in the KPI row.
 * Uses a style prop for the accent color so we're not generating
 * arbitrary Tailwind class strings at runtime (which JIT won't purge correctly).
 * The left-border accent uses borderRadius 0 on the left sides to avoid
 * the visual glitch of rounded corners clashing with a flat colored border.
 */
const StatCard = ({ label, value, accent, Icon }) => (
  <div
    className="h-[100px] bg-white flex items-center justify-between px-[30px]
               cursor-pointer hover:shadow-lg transform hover:scale-[103%]
               transition duration-300 ease-out"
    style={{
      borderLeft: `4px solid ${accent}`,
      // Round only the right corners — left-border cards should be flat on the left.
      borderRadius: '0 8px 8px 0',
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

/**
 * PanelHeader — title bar shared by chart panels.
 * Uses <h3> because the page <h1> is "Dashboard"
 * and section titles like "Revenue Resources" are tertiary headings.
 */
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

/**
 * Custom Tooltip for the line chart.
 * Fixes the `undefined` series-name bug from passing undefined as the second
 * element of the formatter tuple.
 */
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

// ─── Main Component ───────────────────────────────────────────────────────────

const Dashboard = () => (
  <div className="pt-[25px] px-[25px] bg-[#F8F9FC] mt-3">

    {/* ── Page Header ── */}
    <h1 className="text-[#5a5c69] text-[28px] leading-[34px] font-normal">
      Dashboard
    </h1>

    {/* ── KPI Cards ── */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[30px] mt-[25px] pb-[15px]">
      {STAT_CARDS.map((card) => (
        <StatCard key={card.id} {...card} />
      ))}
    </div>

    {/* ── Charts Row ──
        Use CSS grid instead of flex + basis% to avoid overflow when gap is added.
        grid-cols-[70fr_30fr] gives an exact 70/30 split that accounts for the gap.
    */}
    <div className="grid grid-cols-1 xl:grid-cols-[70fr_30fr] gap-[30px] mt-[22px]">

      {/* Earnings Line Chart */}
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
                tick={{ fontSize: 11, fill: '#888' }}
                tickFormatter={(v) => v.slice(0, 3)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#888' }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              />
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

      {/* Revenue Pie Chart */}
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