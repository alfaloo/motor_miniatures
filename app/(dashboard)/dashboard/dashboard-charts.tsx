"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type MonthlyValueData = { month: string; value: number };
type MonthlyCountData = { month: string; count: number };
type TokenData = { name: string; count: number };

interface DashboardChartsProps {
  purchaseValueByMonth: MonthlyValueData[];
  modelCountByMonth: MonthlyCountData[];
  topBrands: TokenData[];
  topMakes: TokenData[];
}

const BLUE = "#2563EB";

const valueChartConfig: ChartConfig = {
  value: { label: "Purchase Value", color: BLUE },
};
const countChartConfig: ChartConfig = {
  count: { label: "Models", color: BLUE },
};
const brandChartConfig: ChartConfig = {
  count: { label: "Count", color: BLUE },
};
const makeChartConfig: ChartConfig = {
  count: { label: "Count", color: BLUE },
};

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function DashboardCharts({
  purchaseValueByMonth,
  modelCountByMonth,
  topBrands,
  topMakes,
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Chart 1: Purchase Value Per Month */}
      <ChartCard title="Purchase Value Per Month (Past 12 Months)">
        <ChartContainer
          config={valueChartConfig}
          className="min-h-[220px] w-full"
        >
          <BarChart
            data={purchaseValueByMonth}
            margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="month"
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              axisLine={{ stroke: "#334155" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${v}`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill={BLUE} radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="value"
                position="top"
                formatter={(v: number) => `$${v}`}
                style={{ fill: "#94A3B8", fontSize: 11 }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </ChartCard>

      {/* Chart 2: Models Purchased Per Month */}
      <ChartCard title="Models Purchased Per Month (Past 12 Months)">
        <ChartContainer
          config={countChartConfig}
          className="min-h-[220px] w-full"
        >
          <BarChart
            data={modelCountByMonth}
            margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="month"
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              axisLine={{ stroke: "#334155" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill={BLUE} radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="count"
                position="top"
                style={{ fill: "#94A3B8", fontSize: 11 }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </ChartCard>

      {/* Chart 3: Top 12 Model Brands */}
      <ChartCard title="Top 12 Model Brands in Collection">
        {topBrands.length === 0 ? (
          <p className="text-slate-400 text-sm py-8 text-center">
            No data available
          </p>
        ) : (
          <ChartContainer
            config={brandChartConfig}
            className="min-h-[280px] w-full"
          >
            <BarChart
              data={topBrands}
              layout="vertical"
              margin={{ top: 5, right: 35, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                type="number"
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill={BLUE} radius={[0, 4, 4, 0]}>
                <LabelList
                  dataKey="count"
                  position="right"
                  style={{ fill: "#94A3B8", fontSize: 11 }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </ChartCard>

      {/* Chart 4: Top 12 Car Makes */}
      <ChartCard title="Top 12 Car Makes in Collection">
        {topMakes.length === 0 ? (
          <p className="text-slate-400 text-sm py-8 text-center">
            No data available
          </p>
        ) : (
          <ChartContainer
            config={makeChartConfig}
            className="min-h-[280px] w-full"
          >
            <BarChart
              data={topMakes}
              layout="vertical"
              margin={{ top: 5, right: 35, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                type="number"
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill={BLUE} radius={[0, 4, 4, 0]}>
                <LabelList
                  dataKey="count"
                  position="right"
                  style={{ fill: "#94A3B8", fontSize: 11 }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </ChartCard>
    </div>
  );
}
