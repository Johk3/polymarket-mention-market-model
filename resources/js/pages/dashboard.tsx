import { Head, Link } from '@inertiajs/react';
import { Radio, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

// Mock mention-trend data (mentions per day over last 7 days)
const TREND_DATA = [
    { day: 'Mon', mentions: 42 },
    { day: 'Tue', mentions: 67 },
    { day: 'Wed', mentions: 55 },
    { day: 'Thu', mentions: 89 },
    { day: 'Fri', mentions: 104 },
    { day: 'Sat', mentions: 78 },
    { day: 'Sun', mentions: 93 },
];

const RECENT_MARKETS = [
    { id: 'mock-1', question: "Will Trump say 'tariffs' at the press conference?", yesPrice: 0.62 },
    { id: 'mock-3', question: "Will Trump reference 'China' during the summit?", yesPrice: 0.78 },
    { id: 'mock-5', question: "Will Trump say 'great' when describing the economy?", yesPrice: 0.83 },
];

const MAX_MENTIONS = Math.max(...TREND_DATA.map((d) => d.mentions));

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Live event indicator */}
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
                    <Radio className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">No live event active</span>
                    <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">Next scheduled: check /live</span>
                </div>

                {/* KPI cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Markets</p>
                            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">5</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Recent Mentions (7d)</p>
                            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">528</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Model Accuracy</p>
                            <p className="mt-1 text-3xl font-bold text-emerald-600 dark:text-emerald-400">73%</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">System Status</p>
                            <p className="mt-1 text-3xl font-bold text-emerald-600 dark:text-emerald-400">Online</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Mention trend chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="h-4 w-4" />
                            Mention Volume — Last 7 Days
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-40 items-end gap-3">
                            {TREND_DATA.map((d) => (
                                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {d.mentions}
                                    </span>
                                    <div
                                        className="w-full rounded-t bg-blue-500 dark:bg-blue-600"
                                        style={{ height: `${(d.mentions / MAX_MENTIONS) * 100}%` }}
                                    />
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{d.day}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent markets */}
                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Markets</h2>
                        <Link href="/markets" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                            View all →
                        </Link>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        {RECENT_MARKETS.map((m) => (
                            <Link key={m.id} href={`/markets/${m.id}`}>
                                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                                    <CardContent className="pt-4">
                                        <p className="mb-3 text-sm font-medium leading-snug text-slate-800 dark:text-slate-200">
                                            {m.question}
                                        </p>
                                        <div className="flex gap-2">
                                            <Badge variant="default">Yes {(m.yesPrice * 100).toFixed(0)}¢</Badge>
                                            <Badge variant="secondary">
                                                No {((1 - m.yesPrice) * 100).toFixed(0)}¢
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
