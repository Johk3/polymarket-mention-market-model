<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::inertia('markets', 'markets/index')->name('markets.index');
    Route::inertia('markets/{id}', 'markets/show')->name('markets.show');

    Route::inertia('analysis', 'analysis/index')->name('analysis');

    Route::get('live', function () {
        $isDemo = request()->boolean('demo');

        return inertia('live/index', [
            'liveStatus' => $isDemo ? [
                'is_live'            => true,
                'title'              => 'Trump Press Conference — Rose Garden',
                'url'                => null,
                'utterance_count'    => 47,
                'recent_utterances'  => [
                    ['text' => "We're going to put tariffs on every single country that takes advantage of us.", 'start_seconds' => 312],
                    ['text' => "China has been ripping us off for years — that's going to stop.", 'start_seconds' => 298],
                    ['text' => "We made the greatest deal, believe me. The greatest.", 'start_seconds' => 281],
                    ['text' => "We're building the wall and Mexico is going to pay for it, one way or another.", 'start_seconds' => 265],
                    ['text' => "America first — that's what we do. We put America first.", 'start_seconds' => 247],
                ],
            ] : ['is_live' => false],
        ]);
    })->name('live');
});

require __DIR__.'/settings.php';
