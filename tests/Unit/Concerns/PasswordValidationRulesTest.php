<?php

use App\Concerns\PasswordValidationRules;
use Illuminate\Support\Facades\Validator;

// Anonymous class that exposes the trait's protected methods for testing.
beforeEach(function () {
    $this->subject = new class
    {
        use PasswordValidationRules;

        public function getPasswordRules(): array
        {
            return $this->passwordRules();
        }

        public function getCurrentPasswordRules(): array
        {
            return $this->currentPasswordRules();
        }
    };
});

// ── passwordRules ──────────────────────────────────────────────────────────

test('password rules require a value', function () {
    $v = Validator::make(
        ['password' => '', 'password_confirmation' => ''],
        ['password' => $this->subject->getPasswordRules()],
    );

    expect($v->fails())->toBeTrue();
    expect($v->errors()->has('password'))->toBeTrue();
});

test('password rules require confirmation', function () {
    $v = Validator::make(
        ['password' => 'secret123'],
        ['password' => $this->subject->getPasswordRules()],
    );

    expect($v->fails())->toBeTrue();
});

test('password rules fail when confirmation does not match', function () {
    $v = Validator::make(
        ['password' => 'secret123', 'password_confirmation' => 'different'],
        ['password' => $this->subject->getPasswordRules()],
    );

    expect($v->fails())->toBeTrue();
});

test('password rules pass for matching passwords', function () {
    $v = Validator::make(
        ['password' => 'password', 'password_confirmation' => 'password'],
        ['password' => $this->subject->getPasswordRules()],
    );

    expect($v->passes())->toBeTrue();
});

// ── currentPasswordRules ───────────────────────────────────────────────────

test('current password rules require a value', function () {
    $v = Validator::make(
        ['current_password' => ''],
        ['current_password' => $this->subject->getCurrentPasswordRules()],
    );

    expect($v->fails())->toBeTrue();
    expect($v->errors()->has('current_password'))->toBeTrue();
});

test('current password rules include current_password rule', function () {
    $rules = $this->subject->getCurrentPasswordRules();

    expect($rules)->toContain('current_password');
});

test('current password rules are required', function () {
    $rules = $this->subject->getCurrentPasswordRules();

    expect($rules)->toContain('required');
});

test('current password rules include string rule', function () {
    $rules = $this->subject->getCurrentPasswordRules();

    expect($rules)->toContain('string');
});

test('password rules array contains required', function () {
    $rules = $this->subject->getPasswordRules();

    expect($rules)->toContain('required');
});

test('password rules array contains confirmed', function () {
    $rules = $this->subject->getPasswordRules();

    expect($rules)->toContain('confirmed');
});
