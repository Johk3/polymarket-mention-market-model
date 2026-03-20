import { Head, Link } from '@inertiajs/react';
import { LiveEventBanner } from '@/components/LiveEventBanner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { LiveStatus, Market } from '@/types/market';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Markets', href: '/markets' },
];

const MOCK_MARKETS: Market[] = [
    {
        condition_id: 'mock-1',
        question: "Will Trump say 'tariffs' at the press conference?",
        description: '',
        end_date_iso: '2025-06-01T00:00:00Z',
        active: true,
        closed: false,
        tokens: [
            { token_id: 't1', outcome: 'Yes', price: 0.62, winner: false },
            { token_id: 't2', outcome: 'No', price: 0.38, winner: false },
        ],
        volume: 48200,
        liquidity: 12000,
        target_phrase: 'tariffs',
    },
    {
        condition_id: 'mock-2',
        question: "Will Trump mention 'wall' in his next speech?",
        description: '',
        end_date_iso: '2025-06-15T00:00:00Z',
        active: true,
        closed: false,
        tokens: [
            { token_id: 't3', outcome: 'Yes', price: 0.55, winner: false },
            { token_id: 't4', outcome: 'No', price: 0.45, winner: false },
        ],
        volume: 32500,
        liquidity: 8400,
        target_phrase: 'wall',
    },
    {
        condition_id: 'mock-3',
        question: "Will Trump reference 'China' during the summit?",
        description: '',
        end_date_iso: '2025-07-01T00:00:00Z',
        active: true,
        closed: false,
        tokens: [
            { token_id: 't5', outcome: 'Yes', price: 0.78, winner: false },
            { token_id: 't6', outcome: 'No', price: 0.22, winner: false },
        ],
        volume: 61000,
        liquidity: 18200,
        target_phrase: 'China',
    },
    {
        condition_id: 'mock-4',
        question: "Will Trump use the word 'deal' in trade negotiations?",
        description: '',
        end_date_iso: '2025-06-20T00:00:00Z',
        active: true,
        closed: false,
        tokens: [
            { token_id: 't7', outcome: 'Yes', price: 0.71, winner: false },
            { token_id: 't8', outcome: 'No', price: 0.29, winner: false },
        ],
        volume: 27800,
        liquidity: 9100,
        target_phrase: 'deal',
    },
    {
        condition_id: 'mock-5',
        question: "Will Trump say 'great' when describing the economy?",
        description: '',
        end_date_iso: '2025-05-30T00:00:00Z',
        active: true,
        closed: false,
        tokens: [
            { token_id: 't9', outcome: 'Yes', price: 0.83, winner: false },
            { token_id: 't10', outcome: 'No', price: 0.17, winner: false },
        ],
        volume: 19400,
        liquidity: 5600,
        target_phrase: 'great',
    },
];

const MOCK_LIVE_STATUS: LiveStatus = {
    is_live: false,
};

interface MarketsProps {
    markets?: Market[];
    liveStatus?: LiveStatus;
}

export default function Markets({ markets = MOCK_MARKETS, liveStatus = MOCK_LIVE_STATUS }: MarketsProps) {
    const activeMarkets = markets.filter((m) => m.active && !m.closed);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Markets" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <LiveEventBanner liveStatus={liveStatus} />

                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                        Trump Mention Markets
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Prediction markets tracking phrase mentions in presidential speeches and press events.
                    </p>
                </div>

                {activeMarkets.length === 0 ? (
                    <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                        <p className="text-sm text-slate-500 dark:text-slate-400">No active markets at this time.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {activeMarkets.map((market) => (
                            <Link key={market.condition_id} href={`/markets/${market.condition_id}`}>
                                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                                    <CardHeader>
                                        <CardTitle className="text-sm leading-snug">{market.question}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-3">
                                        <div className="flex gap-2">
                                            {market.tokens.map((token) => (
                                                <Badge
                                                    key={token.token_id}
                                                    variant={token.outcome === 'Yes' ? 'default' : 'secondary'}
                                                >
                                                    {token.outcome} {(token.price * 100).toFixed(0)}¢
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            Volume: ${market.volume.toLocaleString()}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
