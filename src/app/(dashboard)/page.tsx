import Link from "next/link";
import { getAnalytics } from "@/lib/data/analytics";
import { CHART } from "@/components/charts/palette";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/charts/chart-card";
import { AreaTrendChart } from "@/components/charts/area-trend-chart";
import { CategoryBarChart } from "@/components/charts/bar-charts";
import { DistributionPieChart } from "@/components/charts/distribution-pie-chart";
import { Icons } from "@/components/icons";
import { formatCompact, formatNaira } from "@/lib/utils";

export default function OverviewPage() {
  // Brief overview pinned to the last 30 days. /analytics has the full report.
  const data = getAnalytics("30d");
  const { kpis } = data;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Last 30 days at a glance.
          </p>
        </div>
        <Link
          href="/analytics"
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-ink underline-offset-4 hover:underline"
        >
          View full analytics
          <Icons.chevronRight className="size-4" />
        </Link>
      </div>

      {/* KPI summary */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          label="Active users"
          value={formatCompact(kpis.activeUsers.value)}
          delta={kpis.activeUsers.delta}
          icon={Icons.users}
        />
        <StatCard
          label="Fees earned"
          value={formatNaira(kpis.totalFees.value, { compact: true })}
          delta={kpis.totalFees.delta}
          icon={Icons.receipt}
        />
      </div>

      {/* Brief charts */}
      <div className="mt-4 grid grid-cols-1 gap-4">
        <ChartCard
          title="Transaction volume"
          description="Daily value moved across the platform (NGN)"
        >
          <AreaTrendChart
            data={data.timeseries}
            format="naira"
            series={[{ dataKey: "volume", name: "Volume", color: CHART.ink }]}
          />
        </ChartCard>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Volume by asset" description="Share of value moved">
            <DistributionPieChart data={data.assets} format="naira" />
          </ChartCard>
          <ChartCard
            title="Transactions by type"
            description="Count per transaction type"
          >
            <CategoryBarChart
              data={data.txnTypes}
              dataKey="count"
              format="compact"
              height={300}
            />
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
