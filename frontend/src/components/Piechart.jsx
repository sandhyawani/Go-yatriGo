import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const DATA = [
  { name: "Premium", value: 400 },
  { name: "Exclusive", value: 300 },
  { name: "Bronze", value: 300 },
  { name: "Silver", value: 200 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
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
        Share:{" "}
        <span className="font-semibold text-slate-700">
          {((value / total) * 100).toFixed(1)}%
        </span>
      </p>
    </div>
  );
};

const Piechart = () => (
  <div>
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={DATA}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius="75%"
          fill="#8884d8"
          dataKey="value"
        >
          {DATA.map((entry) => (
            <Cell
              key={`cell-${entry.name}`}
              fill={COLORS[DATA.indexOf(entry) % COLORS.length]}
            />
          ))}
        </Pie>

        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>

    <ul
      className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 px-6 pb-2"
      aria-label="Chart legend"
    >
      {DATA.map((item, index) => (
        <li key={item.name} className="flex items-center gap-2 cursor-default">
          <span
            className="inline-block h-3 w-3 rounded-sm shrink-0"
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
            aria-hidden="true"
          />
          <span className="text-xs font-semibold text-slate-500 truncate">
            {item.name}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export default Piechart;

