<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

Route::get('/', function () {
    try {
        $hasUsers = Schema::hasTable('users') && User::exists();
    } catch (\Throwable $e) {
        report($e);
        $hasUsers = false;
    }

    if (! $hasUsers) {
        return redirect()->route('register');
    }

    return Auth::check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('entry');

Route::middleware(['auth'])->group(function () {

    Route::get('/dashboard', fn() => Inertia::render('Dashboard'))->name('dashboard');

    Route::get('/schedule', fn() => Inertia::render('Schedule'))->name('schedule');

    Route::get('/lesson-plans', fn() => Inertia::render('LessonPlan'))->name('lesson-plan');

    Route::get('/tasks', fn() => Inertia::render('Tasks'))->name('tasks');

    Route::get('/materials', fn() => Inertia::render('Materials'))->name('materials');

    Route::get('/students', fn() => Inertia::render('Students'))->name('students');

    Route::get('/attendance', fn() => Inertia::render('Attendance'))->name('attendance');

    Route::get('/grades', fn() => Inertia::render('Grades'))->name('grades');

    Route::get('/settings', fn() => Inertia::render('SettingsAndBackup'))->name('settings');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
