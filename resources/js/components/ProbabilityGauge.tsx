interface ProbabilityGaugeProps {
    modelProbability: number; // 0–1
    marketPrice: number; // 0–1 (Yes token price)
    lowerBound?: number;
    upperBound?: number;
    size?: number;
}

const STROKE_WIDTH = 12;

/** Converts a probability (0–1) to an SVG arc path on a semicircle. */
function arcPath(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
): string {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/** Maps a probability to an angle on the semicircle (180° = left, 0° = right). */
function probToAngle(p: number): number {
    return 180 - p * 180;
}

export function ProbabilityGauge({
    modelProbability,
    marketPrice,
    lowerBound,
    upperBound,
    size = 200,
}: ProbabilityGaugeProps) {
    const cx = size / 2;
    const cy = size * 0.6;
    const r = (size / 2) * 0.72;

    // Track arc: full semicircle background

    // Model probability arc (filled from 0% up to model value)
    const modelAngle = 180 + modelProbability * 180;

    // Needle for market price
    const marketAngle = probToAngle(marketPrice);
    const needleRad = ((180 + marketAngle) * Math.PI) / 180;
    const needleLength = r - STROKE_WIDTH / 2;
    const nx = cx + needleLength * Math.cos(needleRad);
    const ny = cy + needleLength * Math.sin(needleRad);

    // Confidence interval arc (only if bounds given)
    const hasBounds = lowerBound !== undefined && upperBound !== undefined;
    const ciStartAngle = 180 + (lowerBound ?? 0) * 180;
    const ciEndAngle = 180 + (upperBound ?? 1) * 180;

    return (
        <div className="flex flex-col items-center">
            <svg
                width={size}
                height={size * 0.65}
                viewBox={`0 0 ${size} ${size * 0.65}`}
                aria-label="Probability gauge"
            >
                {/* Track */}
                <path
                    d={arcPath(cx, cy, r, 180, 360)}
                    fill="none"
                    strokeWidth={STROKE_WIDTH}
                    className="stroke-slate-200 dark:stroke-slate-700"
                    strokeLinecap="round"
                />

                {/* Confidence interval band */}
                {hasBounds && (
                    <path
                        d={arcPath(cx, cy, r, ciStartAngle, ciEndAngle)}
                        fill="none"
                        strokeWidth={STROKE_WIDTH + 4}
                        className="stroke-blue-100 dark:stroke-blue-900/50"
                        strokeLinecap="butt"
                    />
                )}

                {/* Model probability fill */}
                <path
                    d={arcPath(cx, cy, r, 180, modelAngle)}
                    fill="none"
                    strokeWidth={STROKE_WIDTH}
                    className="stroke-blue-500 dark:stroke-blue-400"
                    strokeLinecap="round"
                />

                {/* Market price needle */}
                <line
                    x1={cx}
                    y1={cy}
                    x2={nx.toFixed(2)}
                    y2={ny.toFixed(2)}
                    strokeWidth={2}
                    className="stroke-amber-500 dark:stroke-amber-400"
                    strokeLinecap="round"
                />
                <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    className="fill-amber-500 dark:fill-amber-400"
                />

                {/* Labels */}
                <text
                    x={cx - r - 4}
                    y={cy + 14}
                    textAnchor="end"
                    fontSize={10}
                    className="fill-slate-400 dark:fill-slate-500"
                >
                    0%
                </text>
                <text
                    x={cx + r + 4}
                    y={cy + 14}
                    textAnchor="start"
                    fontSize={10}
                    className="fill-slate-400 dark:fill-slate-500"
                >
                    100%
                </text>
                <text
                    x={cx}
                    y={cy - r - 6}
                    textAnchor="middle"
                    fontSize={10}
                    className="fill-slate-400 dark:fill-slate-500"
                >
                    50%
                </text>
            </svg>

            {/* Legend */}
            <div className="mt-2 flex gap-6 text-xs">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                    <span className="text-slate-600 dark:text-slate-400">
                        Model&nbsp;
                        <strong className="text-slate-900 dark:text-white">
                            {(modelProbability * 100).toFixed(0)}%
                        </strong>
                    </span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                    <span className="text-slate-600 dark:text-slate-400">
                        Market&nbsp;
                        <strong className="text-slate-900 dark:text-white">
                            {(marketPrice * 100).toFixed(0)}¢
                        </strong>
                    </span>
                </span>
            </div>
        </div>
    );
}
