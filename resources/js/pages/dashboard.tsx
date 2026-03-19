import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                        Polymarket Mention Market Model
                    </h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                        Welcome to the dashboard. This is the central hub for monitoring mention markets using real-time and historical data.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Markets</span>
                        <span className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">0</span>
                    </div>
                    <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Mentions</span>
                        <span className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">0</span>
                    </div>
                    <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">System Status</span>
                        <span className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">Online</span>
                    </div>
                </div>
                <div className="min-h-[400px] flex-1 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/50">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Detailed analytics will appear here.</p>
                </div>
            </div>
        </AppLayout>
    );
}
