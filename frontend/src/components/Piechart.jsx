// import React from 'react'
// import { PieChart, Pie, Cell } from 'recharts';

// const data = [
//   { name: 'Premium ', value: 400 },
//   { name: 'Exclusive ', value: 300 },
//   { name: 'Bronze', value: 300 },
//   { name: 'Silver', value: 200 },
// ];

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// const RADIAN = Math.PI / 180;
// const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
//   const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
//   const x = cx + radius * Math.cos(-midAngle * RADIAN);
//   const y = cy + radius * Math.sin(-midAngle * RADIAN);

//   return (
//     <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
//       {`${(percent * 100).toFixed(0)}%`}
//     </text>
//   );
// };


// const Piechart = () => {
//   return (
//     <div> <PieChart width={400} height={400}>
//           <Pie
//             data={data}
//             cx="50%"
//             cy="50%"
//             labelLine={false}
//             label={renderCustomizedLabel}
//             outerRadius={150}
//             fill="#8884d8"
//             dataKey="value"
//           >
//             {data?.map((entry, index) => (
//               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//             ))}
//           </Pie>
//         </PieChart>
//         <div flex justify-between>
//             <div className='grid grid-cols-4  justify-content pl-6'>
//           {data?.map((item,index) => {
//             return (
//               <p key={index} className='cursor-pointer text-[#7f8180] font-bold'>
//                 {item.name}
//               </p>
//             );
//           })}
//         </div>
//         <div className='grid grid-cols-4 mt-[15px] pl-6'>
//           {COLORS?.map((item,index) => {
//             return (
//               <div className='h-[30px] w-[30px]'style={{backgroundColor:item}} key={index}></div>
//             );
//           })}
//         </div>
//         </div>
      
//     </div>
//   )
// }

// export default Piechart


import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Data & Config ────────────────────────────────────────────────────────────
// Values are plain numbers — format at render time, never bake formatting into data.
// Names have no trailing spaces.

const DATA = [
  { name: 'Premium',   value: 400 },
  { name: 'Exclusive', value: 300 },
  { name: 'Bronze',    value: 300 },
  { name: 'Silver',    value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const RADIAN = Math.PI / 180;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Renders a percentage label inside each pie slice.
 * Uses `text-anchor="middle"` instead of the `x > cx` heuristic
 * which misaligns on narrow slices.
 */
const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}) => {
  // Skip label if slice is too small to fit text (< 5%)
  if (percent < 0.05) return null;

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={13}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/**
 * Custom tooltip shown on slice hover.
 * Keeps consistent with the INR formatting used in Dashboard.
 */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  const total = DATA.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-bold text-slate-700">{name}</p>
      <p className="text-slate-500">
        Value: <span className="font-semibold text-slate-700">{value}</span>
      </p>
      <p className="text-slate-500">
        Share:{' '}
        <span className="font-semibold text-slate-700">
          {((value / total) * 100).toFixed(1)}%
        </span>
      </p>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const Piechart = () => (
  <div>
    {/*
      Fix #2 — ResponsiveContainer instead of fixed width/height.
      Height is fixed at 260px; width fills the parent panel.
    */}
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={DATA}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius="75%"   // Fix #9 — percentage, adapts to container
          fill="#8884d8"
          dataKey="value"
        >
          {DATA.map((entry) => (
            // Fix #4 — use entry.name as stable key instead of index
            <Cell
              key={`cell-${entry.name}`}
              fill={COLORS[DATA.indexOf(entry) % COLORS.length]}
            />
          ))}
        </Pie>

        {/* Fix #8 — proper recharts Tooltip */}
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>

    {/*
      Fix #1 — `flex justify-between` moved into className, not bare attributes.
      Fix #6 — color swatch and label co-located in the same element per item
               so they can never fall out of alignment.
    */}
    <ul
      className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 px-6 pb-2"
      aria-label="Chart legend"
    >
      {DATA.map((item, index) => (
        // Fix #4 — stable key from item.name
        <li
          key={item.name}
          className="flex items-center gap-2 cursor-default"
        >
          {/* Color swatch */}
          <span
            className="inline-block h-3 w-3 rounded-sm shrink-0"
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
            aria-hidden="true"
          />
          {/* Label */}
          {/* Fix #5 — names trimmed in DATA, no trailing spaces */}
          <span className="text-xs font-semibold text-slate-500 truncate">
            {item.name}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export default Piechart;