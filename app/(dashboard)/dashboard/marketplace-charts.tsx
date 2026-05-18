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
type BrandData = { make: string; quantity: number };
type ListingData = { label: string; quantity: number };

interface MarketplaceChartsProps {
  saleValuePerMonth: MonthlyValueData[];
  modelsSoldPerMonth: MonthlyCountData[];
  topBrandsSold: BrandData[];
  topListingsSold: ListingData[];
  monthsLookBack: number;
  topValuesCount: number;
}

const BLUE = "#2563EB";
const BLUE_ACTIVE = "#1d4ed8";

const saleValueChartConfig: ChartConfig = {
  value: { label: "Sale Value", color: BLUE },
};
const soldCountChartConfig: ChartConfig = {
  count: { label: "Models Sold", color: BLUE },
};
const brandChartConfig: ChartConfig = {
  quantity: { label: "Count", color: BLUE },
};
const listingChartConfig: ChartConfig = {
  quantity: { label: "Count", color: BLUE },
};

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function MarketplaceCharts({
  saleValuePerMonth,
  modelsSoldPerMonth,
  topBrandsSold,
  topListingsSold,
  monthsLookBack,
  topValuesCount,
}: MarketplaceChartsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Chart 1: Sale Value Per Month */}
      <ChartCard title={`Sale Value Per Month (Past ${monthsLookBack} Months)`}>
        <ChartContainer
          config={saleValueChartConfig}
          className="min-h-[220px] w-full"
        >
          <BarChart
            data={saleValuePerMonth}
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
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill={BLUE} radius={[4, 4, 0, 0]} activeBar={{ fill: BLUE_ACTIVE }}>
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

      {/* Chart 2: Models Sold Per Month */}
      <ChartCard title={`Models Sold Per Month (Past ${monthsLookBack} Months)`}>
        <ChartContainer
          config={soldCountChartConfig}
          className="min-h-[220px] w-full"
        >
          <BarChart
            data={modelsSoldPerMonth}
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
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill={BLUE} radius={[4, 4, 0, 0]} activeBar={{ fill: BLUE_ACTIVE }}>
              <LabelList
                dataKey="count"
                position="top"
                style={{ fill: "#94A3B8", fontSize: 11 }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </ChartCard>

      {/* Chart 3: Top M Model Brands Sold */}
      <ChartCard title={`Top ${topValuesCount} Model Brands Sold`}>
        {topBrandsSold.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No data available
          </p>
        ) : (
          <ChartContainer
            config={brandChartConfig}
            className="min-h-[280px] w-full"
          >
            <BarChart
              data={topBrandsSold}
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
                dataKey="make"
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="quantity" fill={BLUE} radius={[0, 4, 4, 0]} activeBar={{ fill: BLUE_ACTIVE }}>
                <LabelList
                  dataKey="quantity"
                  position="right"
                  style={{ fill: "#94A3B8", fontSize: 11 }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </ChartCard>

      {/* Chart 4: Top M Models Sold */}
      <ChartCard title={`Top ${topValuesCount} Models Sold`}>
        {topListingsSold.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No data available
          </p>
        ) : (
          <ChartContainer
            config={listingChartConfig}
            className="min-h-[280px] w-full"
          >
            <BarChart
              data={topListingsSold}
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
                dataKey="label"
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="quantity" fill={BLUE} radius={[0, 4, 4, 0]} activeBar={{ fill: BLUE_ACTIVE }}>
                <LabelList
                  dataKey="quantity"
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
