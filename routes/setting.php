<?php

use App\Http\Controllers\Settings\AcademicYearSetup\AcademicYearController;
use App\Http\Controllers\Settings\AcademicYearSetup\GradeLevelController;
use App\Http\Controllers\Settings\AcademicYearSetup\GradingPeriodController;
use App\Http\Controllers\Settings\AcademicYearSetup\SectionController;
use App\Http\Controllers\Settings\AcademicYearSetup\SubjectController;
use App\Http\Controllers\Settings\Main\SettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {

    Route::get('settings', [SettingsController::class, 'index'])->name('settings.index');

    Route::prefix('settings/academic-years')->name('academic-years.')->group(function () {
        Route::post('/', [AcademicYearController::class, 'store'])->name('store');
        Route::put('{academicYear:id}', [AcademicYearController::class, 'update'])->name('update');
        Route::patch('{academicYear:id}/activate', [AcademicYearController::class, 'activate'])->name('activate');
        Route::delete('{academicYear:id}', [AcademicYearController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('settings/grade-levels')->name('grade-levels.')->group(function () {
        Route::post('/', [GradeLevelController::class, 'store'])->name('store');
        Route::put('{gradeLevel:id}', [GradeLevelController::class, 'update'])->name('update');
        Route::delete('{gradeLevel:id}', [GradeLevelController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('settings/academic-years/{academicYear:id}/grading-periods')
        ->name('grading-periods.')
        ->scopeBindings()
        ->group(function () {
            Route::post('/', [GradingPeriodController::class, 'store'])->name('store');
            Route::put('{gradingPeriod}', [GradingPeriodController::class, 'update'])->name('update');
            Route::delete('{gradingPeriod}', [GradingPeriodController::class, 'destroy'])->name('destroy');
        });

    Route::prefix('settings/academic-years/{academicYear:id}/sections')
        ->name('sections.')
        ->scopeBindings()
        ->group(function () {
            Route::post('/', [SectionController::class, 'store'])->name('store');
            Route::put('{section}', [SectionController::class, 'update'])->name('update');
            Route::delete('{section}', [SectionController::class, 'destroy'])->name('destroy');
        });

    Route::prefix('settings/subjects')->name('subjects.')->group(function () {
        Route::post('/', [SubjectController::class, 'store'])->name('store');
        Route::put('{subject:id}', [SubjectController::class, 'update'])->name('update');
        Route::delete('{subject:id}', [SubjectController::class, 'destroy'])->name('destroy');
    });
});