import { Head } from '@inertiajs/react';
import { Radio } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { LiveStatus } from '@/types/market';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Live', href: '/live' }];

// Simulated mention counter that ticks when "live"
function useMockMentionCounter(isLive: boolean, initial: number) {
    const [count, setCount] = useState(initial);
    const ref = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!isLive) {
return;
}

        ref.current = setInterval(() => {
            setCount((c) => c + Math.floor(Math.random() * 3));
        }, 4000);

        return () => {
            if (ref.current) {
clearInterval(ref.current);
}
        };
    }, [isLive]);

    return count;
}

interface LiveProps {
    liveStatus?: LiveStatus;
}

export default function Live({ liveStatus }: LiveProps) {
    // Default to "no live event" when no server prop provided
    const status = liveStatus ?? { is_live: false };
    const mentionCount = useMockMentionCounter(status.is_live, status.utterance_count ?? 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Live" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Live</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Real-time event monitoring and mention tracking.
                    </p>
                </div>

                {!status.is_live ? (
                    /* Empty state */
                    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/50">
                        <Radio className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                        <div>
                            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No live event active</p>
                            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                                When a speech or press conference is live, the feed will appear here automatically.
                            </p>
                        </div>
                        {/* Preview: demo active-event variant */}
                        <button
                            type="button"
                            className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-600 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                            onClick={() => {
                                window.location.href = '/live?demo=1';
                            }}
                        >
                            Preview active-event demo →
                        </button>
                    </div>
                ) : (
                    /* Active-event variant */
                    <>
                        {/* Live banner */}
                        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950/40">
                            <Radio className="h-4 w-4 animate-pulse text-red-600 dark:text-red-400" />
                            <span className="text-sm font-semibold text-red-700 dark:text-red-300">LIVE</span>
                            {status.title && (
                                <span className="text-sm text-red-600 dark:text-red-400">{status.title}</span>
                            )}
                        </div>

                        {/* Stats row */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        Utterances Captured
                                    </p>
                                    <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                                        {mentionCount}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        Tracked Phrases
                                    </p>
                                    <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">5</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        Stream Status
                                    </p>
                                    <p className="mt-1 flex items-center gap-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                        <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                                        Active
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Transcript feed */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Radio className="h-4 w-4 animate-pulse text-red-500" />
                                    Transcript Feed
                                    <Badge variant="destructive" className="ml-auto text-xs">
                                        LIVE
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-3">
                                    {(status.recent_utterances ?? []).map((u, i) => (
                                        <div
                                            key={i}
                                            className="flex gap-3 rounded-lg border border-slate-100 p-3 dark:border-slate-800"
                                        >
                                            <span className="mt-0.5 shrink-0 font-mono text-xs text-slate-400 dark:text-slate-500">
                                                {formatTime(u.start_seconds)}
                                            </span>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">{u.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
                                    Updating every few seconds…
                                </p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </AppLayout>
    );
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
        .toString()
        .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');

    return `${m}:${s}`;
}
