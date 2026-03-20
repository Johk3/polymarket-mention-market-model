<?php

use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;

// Anonymous class that exposes the trait's protected methods for testing.
beforeEach(function () {
    $this->subject = new class
    {
        use ProfileValidationRules;

        public function getProfileRules(?int $userId = null): array
        {
            return $this->profileRules($userId);
        }

        public function getNameRules(): array
        {
            return $this->nameRules();
        }

        public function getEmailRules(?int $userId = null): array
        {
            return $this->emailRules($userId);
        }
    };
});

// ── nameRules ──────────────────────────────────────────────────────────────

test('name rules require a value', function () {
    $v = Validator::make(['name' => ''], ['name' => $this->subject->getNameRules()]);

    expect($v->fails())->toBeTrue();
    expect($v->errors()->has('name'))->toBeTrue();
});

test('name rules reject non-string values', function () {
    $v = Validator::make(['name' => ['array']], ['name' => $this->subject->getNameRules()]);

    expect($v->fails())->toBeTrue();
});

test('name rules enforce max length of 255', function () {
    $v = Validator::make(
        ['name' => str_repeat('a', 256)],
        ['name' => $this->subject->getNameRules()],
    );

    expect($v->fails())->toBeTrue();
    expect($v->errors()->has('name'))->toBeTrue();
});

test('name rules pass for valid name', function () {
    $v = Validator::make(['name' => 'Alice'], ['name' => $this->subject->getNameRules()]);

    expect($v->passes())->toBeTrue();
});

test('name rules pass for maximum-length name', function () {
    $v = Validator::make(
        ['name' => str_repeat('a', 255)],
        ['name' => $this->subject->getNameRules()],
    );

    expect($v->passes())->toBeTrue();
});

// ── emailRules ─────────────────────────────────────────────────────────────

test('email rules require a value', function () {
    $v = Validator::make(['email' => ''], ['email' => $this->subject->getEmailRules()]);

    expect($v->fails())->toBeTrue();
});

test('email rules reject invalid email format', function () {
    $v = Validator::make(
        ['email' => 'not-an-email'],
        ['email' => $this->subject->getEmailRules()],
    );

    expect($v->fails())->toBeTrue();
});

test('email rules enforce max length of 255', function () {
    $v = Validator::make(
        ['email' => str_repeat('a', 250).'@b.com'],
        ['email' => $this->subject->getEmailRules()],
    );

    expect($v->fails())->toBeTrue();
    expect($v->errors()->has('email'))->toBeTrue();
});

test('email rules enforce uniqueness without user id', function () {
    $existing = User::factory()->create();

    $v = Validator::make(
        ['email' => $existing->email],
        ['email' => $this->subject->getEmailRules()],
    );

    expect($v->fails())->toBeTrue();
});

test('email rules allow existing email when ignoring user id', function () {
    $existing = User::factory()->create();

    $v = Validator::make(
        ['email' => $existing->email],
        ['email' => $this->subject->getEmailRules($existing->id)],
    );

    expect($v->passes())->toBeTrue();
});

test('email rules reject duplicate email for different user', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    $v = Validator::make(
        ['email' => $user1->email],
        ['email' => $this->subject->getEmailRules($user2->id)],
    );

    expect($v->fails())->toBeTrue();
});

test('email rules pass for valid unique email', function () {
    $v = Validator::make(
        ['email' => 'unique@example.com'],
        ['email' => $this->subject->getEmailRules()],
    );

    expect($v->passes())->toBeTrue();
});

// ── profileRules ───────────────────────────────────────────────────────────

test('profile rules include name and email keys', function () {
    $rules = $this->subject->getProfileRules();

    expect($rules)->toHaveKey('name');
    expect($rules)->toHaveKey('email');
});

test('profile rules pass for valid input', function () {
    $v = Validator::make(
        ['name' => 'Bob', 'email' => 'bob@example.com'],
        $this->subject->getProfileRules(),
    );

    expect($v->passes())->toBeTrue();
});

test('profile rules fail when name is missing', function () {
    $v = Validator::make(
        ['email' => 'bob@example.com'],
        $this->subject->getProfileRules(),
    );

    expect($v->fails())->toBeTrue();
    expect($v->errors()->has('name'))->toBeTrue();
});

test('profile rules fail when email is missing', function () {
    $v = Validator::make(
        ['name' => 'Bob'],
        $this->subject->getProfileRules(),
    );

    expect($v->fails())->toBeTrue();
    expect($v->errors()->has('email'))->toBeTrue();
});
