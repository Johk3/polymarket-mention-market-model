<?php

use App\Actions\Fortify\CreateNewUser;
use App\Models\User;
use Illuminate\Validation\ValidationException;

// ── Successful creation ────────────────────────────────────────────────────

test('creates a new user with valid input', function () {
    $action = new CreateNewUser;

    $user = $action->create([
        'name' => 'Alice',
        'email' => 'alice@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    expect($user)->toBeInstanceOf(User::class);
    expect($user->name)->toBe('Alice');
    expect($user->email)->toBe('alice@example.com');
    expect($user->id)->not->toBeNull();
});

test('persists the new user in the database', function () {
    $action = new CreateNewUser;

    $action->create([
        'name' => 'Bob',
        'email' => 'bob@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertDatabaseHas('users', [
        'name' => 'Bob',
        'email' => 'bob@example.com',
    ]);
});

// ── Name validation failures ───────────────────────────────────────────────

test('throws validation exception when name is missing', function () {
    $action = new CreateNewUser;

    expect(fn () => $action->create([
        'email' => 'alice@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]))->toThrow(ValidationException::class);
});

test('throws validation exception when name exceeds 255 characters', function () {
    $action = new CreateNewUser;

    expect(fn () => $action->create([
        'name' => str_repeat('x', 256),
        'email' => 'alice@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]))->toThrow(ValidationException::class);
});

// ── Email validation failures ──────────────────────────────────────────────

test('throws validation exception when email is missing', function () {
    $action = new CreateNewUser;

    expect(fn () => $action->create([
        'name' => 'Alice',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]))->toThrow(ValidationException::class);
});

test('throws validation exception when email format is invalid', function () {
    $action = new CreateNewUser;

    expect(fn () => $action->create([
        'name' => 'Alice',
        'email' => 'not-an-email',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]))->toThrow(ValidationException::class);
});

test('throws validation exception when email is already taken', function () {
    User::factory()->create(['email' => 'existing@example.com']);

    $action = new CreateNewUser;

    expect(fn () => $action->create([
        'name' => 'Alice',
        'email' => 'existing@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]))->toThrow(ValidationException::class);
});

// ── Password validation failures ───────────────────────────────────────────

test('throws validation exception when password is missing', function () {
    $action = new CreateNewUser;

    expect(fn () => $action->create([
        'name' => 'Alice',
        'email' => 'alice@example.com',
    ]))->toThrow(ValidationException::class);
});

test('throws validation exception when password confirmation does not match', function () {
    $action = new CreateNewUser;

    expect(fn () => $action->create([
        'name' => 'Alice',
        'email' => 'alice@example.com',
        'password' => 'password',
        'password_confirmation' => 'different',
    ]))->toThrow(ValidationException::class);
});
