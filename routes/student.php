<?php

use App\Http\Controllers\Students\StudentController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('students')->name('students.')->group(function () {
    Route::get('/', [StudentController::class, 'index'])->name('index');
    Route::post('/', [StudentController::class, 'store'])->name('store');
    Route::put('{student}', [StudentController::class, 'update'])->name('update');
    Route::delete('{student}', [StudentController::class, 'destroy'])->name('destroy');
    Route::patch('{student}/restore', [StudentController::class, 'restore'])
        ->withTrashed()->name('restore');
});