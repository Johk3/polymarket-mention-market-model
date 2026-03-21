import { Head } from '@inertiajs/react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Analysis', href: '/analysis' },
];

// Mock mention-frequency data (mentions per phrase)
const FREQUENCY_DATA = [
    { phrase: 'tariffs', count: 142 },
    { phrase: 'China', count: 118 },
    { phrase: 'deal', count: 97 },
    { phrase: 'great', count: 88 },
    { phrase: 'wall', count: 63 },
    { phrase: 'America', count: 54 },
    { phrase: 'jobs', count: 41 },
];

const ACCURACY_DATA = [
    { phrase: 'tariffs', predicted: 0.62, actual: 1, correct: true },
    { phrase: 'China', predicted: 0.78, actual: 1, correct: true },
    { phrase: 'deal', predicted: 0.71, actual: 1, correct: true },
    { phrase: 'great', predicted: 0.83, actual: 1, correct: true },
    { phrase: 'wall', predicted: 0.55, actual: 0, correct: false },
    { phrase: 'America', predicted: 0.44, actual: 0, correct: true },
    { phrase: 'jobs', predicted: 0.38, actual: 0, correct: true },
];

const correct = ACCURACY_DATA.filter((d) => d.correct).length;
const accuracy = (correct / ACCURACY_DATA.length) * 100;

// Brier score (lower is better)
const brierScore =
    ACCURACY_DATA.reduce(
        (sum, d) => sum + Math.pow(d.predicted - d.actual, 2),
        0,
    ) / ACCURACY_DATA.length;

export default function Analysis() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Analysis" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                        Analysis
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Model performance metrics and mention-frequency
                        breakdown.
                    </p>
                </div>

                {/* Filters (non-functional stubs) */}
                <Card>
                    <CardContent className="flex flex-wrap gap-4 pt-5">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Date range
                            </label>
                            <select className="rounded border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                <option>Last 7 days</option>
                                <option>Last 30 days</option>
                                <option>All time</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Keyword
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. tariffs"
                                className="rounded border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Accuracy summary cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Overall Accuracy
                            </p>
                            <p className="mt-1 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                {accuracy.toFixed(0)}%
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Brier Score
                            </p>
                            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                                {brierScore.toFixed(3)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Outcomes Evaluated
                            </p>
                            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                                {ACCURACY_DATA.length}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Mention-frequency bar chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Mention Frequency by Phrase
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart
                                data={FREQUENCY_DATA}
                                margin={{
                                    top: 4,
                                    right: 16,
                                    bottom: 4,
                                    left: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    className="stroke-slate-100 dark:stroke-slate-800"
                                />
                                <XAxis
                                    dataKey="phrase"
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={false}
                                    className="fill-slate-500 dark:fill-slate-400"
                                />
                                <YAxis
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={32}
                                    className="fill-slate-500 dark:fill-slate-400"
                                />
                                <Tooltip
                                    formatter={(value) => [
                                        Number(value),
                                        'Mentions',
                                    ]}
                                    contentStyle={{ fontSize: 12 }}
                                />
                                <Bar
                                    dataKey="count"
                                    radius={[4, 4, 0, 0]}
                                    className="fill-blue-500 dark:fill-blue-600"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Predicted vs actual comparison table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Predicted vs Actual Outcomes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs font-medium tracking-wide text-slate-500 uppercase dark:border-slate-700 dark:text-slate-400">
                                        <th className="pr-4 pb-2">Phrase</th>
                                        <th className="pr-4 pb-2">
                                            Model Prob.
                                        </th>
                                        <th className="pr-4 pb-2">Actual</th>
                                        <th className="pb-2">Correct?</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ACCURACY_DATA.map((row) => (
                                        <tr
                                            key={row.phrase}
                                            className="border-b last:border-0 dark:border-slate-700"
                                        >
                                            <td className="py-2 pr-4 font-mono text-xs">
                                                {row.phrase}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {(row.predicted * 100).toFixed(
                                                    0,
                                                )}
                                                %
                                            </td>
                                            <td className="py-2 pr-4">
                                                {row.actual === 1 ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400">
                                                        YES
                                                    </span>
                                                ) : (
                                                    <span className="text-red-500 dark:text-red-400">
                                                        NO
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2">
                                                {row.correct ? (
                                                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                        ✓
                                                    </span>
                                                ) : (
                                                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                        ✗
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
