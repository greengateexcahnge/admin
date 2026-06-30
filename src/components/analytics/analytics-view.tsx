"use client";

import * as React from "react";
import { getAnalytics, type TimeRange } from "@/lib/data/analytics";
import { CHART } from "@/components/charts/palette";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/charts/chart-card";
import { AreaTrendChart } from "@/components/charts/area-trend-chart";
import { MultiLineChart } from "@/components/charts/multi-line-chart";
import {
  CategoryBarChart,
  GroupedBarChart,
} from "@/components/charts/bar-charts";
import { DistributionPieChart } from "@/components/charts/distribution-pie-chart";
import { RangeFilter } from "@/components/analytics/range-filter";
import { Icons } from "@/components/icons";
import { formatCompact, formatNaira, formatNumber } from "@/lib/utils";

export function AnalyticsView() {
  const [range, setRange] = React.useState<TimeRange>("30d");
  const data = React.useMemo(() => getAnalytics(range), [range]);
  const { kpis } = data;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page header with timeline filter at the top right (responsive). */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Detailed platform reports across deposits, withdrawals, swaps and FX.
          </p>
        </div>
        <div className="sm:self-start">
          <RangeFilter value={range} onChange={setRange} />
        </div>
      </div>

      {/* KPI row */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Total volume"
          value={formatNaira(kpis.totalVolume.value, { compact: true })}
          delta={kpis.totalVolume.delta}
          icon={Icons.wallet}
        />
        <StatCard
          label="Transactions"
          value={formatCompact(kpis.totalTxns.value)}
          delta={kpis.totalTxns.delta}
          icon={Icons.activity}
        />
        <StatCard
          label="Fees earned"
          value={formatNaira(kpis.totalFees.value, { compact: true })}
          delta={kpis.totalFees.delta}
          icon={Icons.receipt}
        />
        <StatCard
          label="Active users"
          value={formatCompact(kpis.activeUsers.value)}
          delta={kpis.activeUsers.delta}
          icon={Icons.users}
        />
        <StatCard
          label="New users"
          value={formatNumber(kpis.newUsers.value)}
          delta={kpis.newUsers.delta}
          icon={Icons.user}
        />
        <StatCard
          label="Total users"
          value={formatCompact(kpis.totalUsers.value)}
          delta={kpis.totalUsers.delta}
          icon={Icons.users}
        />
      </div>

      {/* Charts */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Volume & fees"
          description="Transaction value and fees over the selected period"
          className="lg:col-span-2"
        >
          <AreaTrendChart
            data={data.timeseries}
            format="naira"
            series={[
              { dataKey: "volume", name: "Volume", color: CHART.ink },
              { dataKey: "fees", name: "Fees", color: CHART.coffee },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Transactions by type"
          description="Count per transaction type"
        >
          <CategoryBarChart data={data.txnTypes} dataKey="count" format="compact" />
        </ChartCard>

        <ChartCard
          title="Volume by asset"
          description="Share of total value moved"
        >
          <DistributionPieChart data={data.assets} format="naira" />
        </ChartCard>

        <ChartCard
          title="Deposits vs withdrawals"
          description="Inflow against outflow"
        >
          <GroupedBarChart
            data={data.timeseries}
            format="naira"
            series={[
              { dataKey: "deposits", name: "Deposits", color: CHART.sage },
              { dataKey: "withdrawals", name: "Withdrawals", color: CHART.clay },
            ]}
          />
        </ChartCard>

        <ChartCard title="User growth" description="New and active users">
          <MultiLineChart
            data={data.timeseries}
            format="number"
            series={[
              { dataKey: "activeUsers", name: "Active", color: CHART.ink },
              { dataKey: "newUsers", name: "New", color: CHART.coffee },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="KYC tier distribution"
          description="Users by verification tier"
          className="lg:col-span-2"
        >
          <DistributionPieChart data={data.kyc} format="number" />
        </ChartCard>
      </div>
    </div>
  );
}
