import { Radio } from 'lucide-react';
import type { LiveStatus } from '@/types/market';

interface LiveEventBannerProps {
    liveStatus: LiveStatus;
}

export function LiveEventBanner({ liveStatus }: LiveEventBannerProps) {
    if (!liveStatus.is_live) {
        return null;
    }

    return (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950/40">
            <Radio className="h-4 w-4 animate-pulse text-red-600 dark:text-red-400" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-300">LIVE</span>
            {liveStatus.title && (
                <span className="text-sm text-red-600 dark:text-red-400">{liveStatus.title}</span>
            )}
            {liveStatus.utterance_count !== undefined && (
                <span className="ml-auto text-xs text-red-500 dark:text-red-500">
                    {liveStatus.utterance_count} utterances captured
                </span>
            )}
        </div>
    );
}
