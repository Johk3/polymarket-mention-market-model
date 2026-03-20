import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Market, PricePoint, ProbabilityEstimate } from '@/types/market';

// Mock probability-over-time data (last 14 days)
const MOCK_PRICE_HISTORY: PricePoint[] = Array.from({ length: 14 }, (_, i) => ({
    t: Date.now() / 1000 - (13 - i) * 86400,
    p: 0.4 + Math.sin(i * 0.6) * 0.15 + i * 0.012,
}));

const MOCK_MARKET: Market = {
    condition_id: 'mock-1',
    question: "Will Trump say 'tariffs' at the press conference?",
    description:
        'This market resolves YES if the target phrase is detected in the official transcript of the event. Resolution uses the model prediction pipeline.',
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
};

const MOCK_ESTIMATE: ProbabilityEstimate = {
    phrase: 'tariffs',
    probability: 0.64,
    lower_bound: 0.55,
    upper_bound: 0.73,
    base_rate: 0.41,
    statistical_probability: 0.61,
    llm_probability: 0.67,
    llm_available: true,
    reasoning:
        "Based on historical speech patterns, 'tariffs' appears frequently in trade-related press events. Recent policy context increases the likelihood.",
};

const MOCK_MARKETS_BY_ID: Record<string, { market: Market; estimate: ProbabilityEstimate }> = {
    'mock-1': { market: MOCK_MARKET, estimate: MOCK_ESTIMATE },
    'mock-2': {
        market: {
            ...MOCK_MARKET,
            condition_id: 'mock-2',
            question: "Will Trump mention 'wall' in his next speech?",
            target_phrase: 'wall',
            tokens: [
                { token_id: 't3', outcome: 'Yes', price: 0.55, winner: false },
                { token_id: 't4', outcome: 'No', price: 0.45, winner: false },
            ],
            volume: 32500,
            liquidity: 8400,
            end_date_iso: '2025-06-15T00:00:00Z',
        },
        estimate: { ...MOCK_ESTIMATE, phrase: 'wall', probability: 0.55, lower_bound: 0.46, upper_bound: 0.64 },
    },
    'mock-3': {
        market: {
            ...MOCK_MARKET,
            condition_id: 'mock-3',
            question: "Will Trump reference 'China' during the summit?",
            target_phrase: 'China',
            tokens: [
                { token_id: 't5', outcome: 'Yes', price: 0.78, winner: false },
                { token_id: 't6', outcome: 'No', price: 0.22, winner: false },
            ],
            volume: 61000,
            liquidity: 18200,
            end_date_iso: '2025-07-01T00:00:00Z',
        },
        estimate: { ...MOCK_ESTIMATE, phrase: 'China', probability: 0.78, lower_bound: 0.69, upper_bound: 0.87 },
    },
    'mock-4': {
        market: {
            ...MOCK_MARKET,
            condition_id: 'mock-4',
            question: "Will Trump use the word 'deal' in trade negotiations?",
            target_phrase: 'deal',
            tokens: [
                { token_id: 't7', outcome: 'Yes', price: 0.71, winner: false },
                { token_id: 't8', outcome: 'No', price: 0.29, winner: false },
            ],
            volume: 27800,
            liquidity: 9100,
            end_date_iso: '2025-06-20T00:00:00Z',
        },
        estimate: { ...MOCK_ESTIMATE, phrase: 'deal', probability: 0.71, lower_bound: 0.62, upper_bound: 0.80 },
    },
    'mock-5': {
        market: {
            ...MOCK_MARKET,
            condition_id: 'mock-5',
            question: "Will Trump say 'great' when describing the economy?",
            target_phrase: 'great',
            tokens: [
                { token_id: 't9', outcome: 'Yes', price: 0.83, winner: false },
                { token_id: 't10', outcome: 'No', price: 0.17, winner: false },
            ],
            volume: 19400,
            liquidity: 5600,
            end_date_iso: '2025-05-30T00:00:00Z',
        },
        estimate: { ...MOCK_ESTIMATE, phrase: 'great', probability: 0.83, lower_bound: 0.75, upper_bound: 0.91 },
    },
};

interface ShowProps {
    id?: string;
    market?: Market;
    priceHistory?: PricePoint[];
    estimate?: ProbabilityEstimate;
}

const CHART_W = 400;
const CHART_H = 120;
const PADDING = { top: 8, right: 8, bottom: 8, left: 8 };
const MAX_BREADCRUMB_TITLE_LENGTH = 40;

function ProbabilityChart({ data }: { data: PricePoint[] }) {
    if (data.length < 2) {
        // Need at least two points to draw a line
        return null;
    }

    const minT = data[0].t;
    const maxT = data[data.length - 1].t;
    const innerW = CHART_W - PADDING.left - PADDING.right;
    const innerH = CHART_H - PADDING.top - PADDING.bottom;

    const toX = (t: number) => PADDING.left + ((t - minT) / (maxT - minT)) * innerW;
    const toY = (p: number) => PADDING.top + (1 - p) * innerH;

    const polyline = data.map((pt) => `${toX(pt.t).toFixed(1)},${toY(pt.p).toFixed(1)}`).join(' ');
    const area =
        `M ${toX(data[0].t).toFixed(1)},${toY(0)} ` +
        data.map((pt) => `L ${toX(pt.t).toFixed(1)},${toY(pt.p).toFixed(1)}`).join(' ') +
        ` L ${toX(data[data.length - 1].t).toFixed(1)},${toY(0)} Z`;

    return (
        <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full"
            preserveAspectRatio="none"
            aria-label="Probability over time"
        >
            {/* 50% reference line */}
            <line
                x1={PADDING.left}
                y1={toY(0.5)}
                x2={CHART_W - PADDING.right}
                y2={toY(0.5)}
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeDasharray="4 3"
                strokeWidth="1"
            />
            {/* Area fill */}
            <path d={area} className="fill-blue-100 dark:fill-blue-900/30" />
            {/* Line */}
            <polyline points={polyline} className="fill-none stroke-blue-500 dark:stroke-blue-400" strokeWidth="2" />
        </svg>
    );
}

export default function MarketShow({ id, market, priceHistory, estimate }: ShowProps) {
    // Fall back to mock data when no server props are provided
    const mockEntry = MOCK_MARKETS_BY_ID[id ?? 'mock-1'] ?? MOCK_MARKETS_BY_ID['mock-1'];
    const m = market ?? mockEntry.market;
    const est = estimate ?? mockEntry.estimate;
    const history = priceHistory ?? MOCK_PRICE_HISTORY;

    const yesToken = m.tokens.find((t) => t.outcome === 'Yes');
    const noToken = m.tokens.find((t) => t.outcome === 'No');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Markets', href: '/markets' },
        { title: m.question.slice(0, MAX_BREADCRUMB_TITLE_LENGTH) + '…', href: `/markets/${m.condition_id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={m.question} />
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Back link */}
                <Link href="/markets" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Markets
                </Link>

                {/* Market header */}
                <Card>
                    <CardContent className="pt-6">
                        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{m.question}</h1>
                        {m.description && (
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{m.description}</p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <span>
                                Ends:{' '}
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {new Date(m.end_date_iso).toLocaleDateString()}
                                </span>
                            </span>
                            <span>
                                Volume:{' '}
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                    ${m.volume.toLocaleString()}
                                </span>
                            </span>
                            <span>
                                Liquidity:{' '}
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                    ${m.liquidity.toLocaleString()}
                                </span>
                            </span>
                            {m.target_phrase && (
                                <span>
                                    Target phrase:{' '}
                                    <span className="rounded bg-slate-100 px-1 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        "{m.target_phrase}"
                                    </span>
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Token prices + probability chart */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Yes token */}
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center pt-6">
                            <Badge variant="default" className="mb-2 text-sm">
                                YES
                            </Badge>
                            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                                {yesToken ? (yesToken.price * 100).toFixed(0) : '--'}¢
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">implied probability</p>
                        </CardContent>
                    </Card>

                    {/* No token */}
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center pt-6">
                            <Badge variant="secondary" className="mb-2 text-sm">
                                NO
                            </Badge>
                            <p className="text-4xl font-bold text-red-500 dark:text-red-400">
                                {noToken ? (noToken.price * 100).toFixed(0) : '--'}¢
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">implied probability</p>
                        </CardContent>
                    </Card>

                    {/* Model estimate */}
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center pt-6">
                            <p className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Model Estimate</p>
                            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                                {(est.probability * 100).toFixed(0)}%
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                CI: {(est.lower_bound * 100).toFixed(0)}%–{(est.upper_bound * 100).toFixed(0)}%
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Probability over time chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Model Prediction Curve (14 days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded border border-slate-100 dark:border-slate-800">
                            <ProbabilityChart data={history} />
                        </div>
                        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                            Dashed line = 50% baseline. Curve shows model YES probability over time.
                        </p>
                    </CardContent>
                </Card>

                {/* Mention score panel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Mention Score Panel</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Base rate</span>
                                <span className="font-medium">{(est.base_rate * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Statistical model</span>
                                <span className="font-medium">{(est.statistical_probability * 100).toFixed(0)}%</span>
                            </div>
                            {est.llm_available && est.llm_probability !== null && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">LLM estimate</span>
                                    <span className="font-medium">{(est.llm_probability * 100).toFixed(0)}%</span>
                                </div>
                            )}
                            <div className="flex justify-between border-t pt-2 dark:border-slate-700">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Combined</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                    {(est.probability * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                        {est.reasoning && (
                            <div className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
                                {est.reasoning}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
