<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

// ── Factory states ─────────────────────────────────────────────────────────

test('factory creates a verified user by default', function () {
    $user = User::factory()->create();

    expect($user->email_verified_at)->not->toBeNull();
    expect($user->hasVerifiedEmail())->toBeTrue();
});

test('factory unverified state creates an unverified user', function () {
    $user = User::factory()->unverified()->create();

    expect($user->email_verified_at)->toBeNull();
    expect($user->hasVerifiedEmail())->toBeFalse();
});

test('factory withTwoFactor state creates a user with 2fa configured', function () {
    $user = User::factory()->withTwoFactor()->create();

    expect($user->two_factor_confirmed_at)->not->toBeNull();
    expect($user->hasEnabledTwoFactorAuthentication())->toBeTrue();
});

test('factory creates user with hashed password', function () {
    $user = User::factory()->create();

    expect(Hash::check('password', $user->getAttributes()['password']))->toBeTrue();
});

// ── Fillable attributes ────────────────────────────────────────────────────

test('user model accepts fillable attributes', function () {
    $user = new User;
    $user->fill(['name' => 'Alice', 'email' => 'alice@example.com', 'password' => 'hashed']);

    expect($user->name)->toBe('Alice');
    expect($user->email)->toBe('alice@example.com');
});

// ── Hidden attributes ──────────────────────────────────────────────────────

test('password is hidden from array output', function () {
    $user = User::factory()->create();

    expect(array_key_exists('password', $user->toArray()))->toBeFalse();
});

test('two_factor_secret is hidden from array output', function () {
    $user = User::factory()->withTwoFactor()->create();

    expect(array_key_exists('two_factor_secret', $user->toArray()))->toBeFalse();
});

test('two_factor_recovery_codes is hidden from array output', function () {
    $user = User::factory()->withTwoFactor()->create();

    expect(array_key_exists('two_factor_recovery_codes', $user->toArray()))->toBeFalse();
});

test('remember_token is hidden from array output', function () {
    $user = User::factory()->create();

    expect(array_key_exists('remember_token', $user->toArray()))->toBeFalse();
});

// ── Attribute casting ──────────────────────────────────────────────────────

test('email_verified_at is cast to a datetime instance', function () {
    $user = User::factory()->create();

    expect($user->email_verified_at)->toBeInstanceOf(DateTimeInterface::class);
});

test('password is automatically hashed on assignment', function () {
    $user = User::factory()->create(['password' => 'plain-text-password']);

    expect($user->getAttributes()['password'])->not->toBe('plain-text-password');
    expect(Hash::check('plain-text-password', $user->getAttributes()['password']))->toBeTrue();
});

test('two_factor_confirmed_at is cast to a datetime when set', function () {
    $user = User::factory()->withTwoFactor()->create();

    expect($user->two_factor_confirmed_at)->toBeInstanceOf(DateTimeInterface::class);
});

// ── Database persistence ───────────────────────────────────────────────────

test('user is persisted to the database', function () {
    $user = User::factory()->create(['email' => 'persist@example.com']);

    $this->assertDatabaseHas('users', ['email' => 'persist@example.com']);
    expect(User::find($user->id))->not->toBeNull();
});

test('user can be soft deleted by deleting the record', function () {
    $user = User::factory()->create();
    $id = $user->id;

    $user->delete();

    expect(User::find($id))->toBeNull();
});
