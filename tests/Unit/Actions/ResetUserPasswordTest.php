<?php

use App\Actions\Fortify\ResetUserPassword;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

// ── Successful reset ───────────────────────────────────────────────────────

test('resets the user password with valid input', function () {
    $user = User::factory()->create();
    $action = new ResetUserPassword;

    $action->reset($user, [
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ]);

    expect(Hash::check('new-password', $user->fresh()->password))->toBeTrue();
});

test('persists the hashed password in the database', function () {
    $user = User::factory()->create();
    $action = new ResetUserPassword;

    $action->reset($user, [
        'password' => 'another-secret',
        'password_confirmation' => 'another-secret',
    ]);

    $stored = $user->fresh()->getAttributes()['password'];

    expect($stored)->not->toBe('another-secret');
    expect(Hash::check('another-secret', $stored))->toBeTrue();
});

test('old password no longer works after reset', function () {
    $user = User::factory()->create();
    $action = new ResetUserPassword;

    $action->reset($user, [
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ]);

    expect(Hash::check('password', $user->fresh()->password))->toBeFalse();
});

// ── Validation failures ────────────────────────────────────────────────────

test('throws validation exception when password is missing', function () {
    $user = User::factory()->create();
    $action = new ResetUserPassword;

    expect(fn () => $action->reset($user, []))->toThrow(ValidationException::class);
});

test('throws validation exception when confirmation does not match', function () {
    $user = User::factory()->create();
    $action = new ResetUserPassword;

    expect(fn () => $action->reset($user, [
        'password' => 'new-password',
        'password_confirmation' => 'mismatch',
    ]))->toThrow(ValidationException::class);
});

test('does not modify user when validation fails', function () {
    $user = User::factory()->create();
    $original = $user->fresh()->getAttributes()['password'];
    $action = new ResetUserPassword;

    try {
        $action->reset($user, ['password' => '', 'password_confirmation' => '']);
    } catch (ValidationException) {
        // expected
    }

    expect($user->fresh()->getAttributes()['password'])->toBe($original);
});
