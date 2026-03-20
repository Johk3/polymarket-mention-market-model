<?php

use App\Models\User;

test('settings redirect sends authenticated users to profile page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings')
        ->assertRedirect('/settings/profile');
});

test('settings redirect sends guests to login page', function () {
    $this->get('/settings')
        ->assertRedirect(route('login'));
});
