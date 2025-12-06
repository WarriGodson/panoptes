<?php

use App\Http\Controllers\Api\CveController;
use App\Http\Controllers\Api\SetupController;
use Illuminate\Support\Facades\Route;

// Simple test endpoint
Route::get('test', function () {
    return response()->json(['status' => 'ok']);
});

// Setup wizard endpoints (no auth required)
Route::prefix('setup')->group(function () {
    Route::get('status', [SetupController::class, 'status']);
    Route::post('test-db', [SetupController::class, 'testDb']);
    Route::post('test-openai', [SetupController::class, 'testOpenAi']);
    Route::post('test-telegram', [SetupController::class, 'testTelegram']);
    Route::post('save', [SetupController::class, 'save']);
});

// CVE API endpoints
Route::get('cves', [CveController::class, 'index']);
Route::get('cves/{cveId}', [CveController::class, 'show']);
