import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { PricePoint } from '@/types/market';

interface MarketPriceChartProps {
    data: PricePoint[];
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

function formatPct(value: number): string {
    return `${(value * 100).toFixed(0)}%`;
}

export function MarketPriceChart({ data }: MarketPriceChartProps) {
    if (data.length < 2) {
        return (
            <div className="flex h-40 items-center justify-center rounded border border-dashed border-slate-200 text-sm text-slate-400 dark:border-slate-700">
                Not enough data to display a chart.
            </div>
        );
    }

    const chartData = data.map((pt) => ({
        t: pt.t,
        label: formatDate(pt.t),
        probability: pt.p,
    }));

    return (
        <ResponsiveContainer width="100%" height={180}>
            <LineChart
                data={chartData}
                margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            >
                <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-slate-100 dark:stroke-slate-800"
                />
                <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    className="fill-slate-400 dark:fill-slate-500"
                    interval="preserveStartEnd"
                />
                <YAxis
                    tickFormatter={formatPct}
                    domain={[0, 1]}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    className="fill-slate-400 dark:fill-slate-500"
                />
                <Tooltip
                    formatter={(value) => [
                        `${(Number(value) * 100).toFixed(1)}%`,
                        'Probability',
                    ]}
                    labelFormatter={(label) => String(label)}
                    contentStyle={{ fontSize: 12 }}
                />
                <ReferenceLine
                    y={0.5}
                    strokeDasharray="4 3"
                    className="stroke-slate-300 dark:stroke-slate-600"
                />
                <Line
                    type="monotone"
                    dataKey="probability"
                    dot={false}
                    strokeWidth={2}
                    className="stroke-blue-500 dark:stroke-blue-400"
                    activeDot={{ r: 4 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
