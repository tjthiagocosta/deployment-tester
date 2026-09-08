<?php

use App\Http\Controllers\DatabaseProbeController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response('<h1 id="probe-marker">LARAVEL_LIVE</h1>')
        ->header('Content-Type', 'text/html');
});

Route::get('/healthz', function () {
    return response()->json([
        'ok' => true,
        'framework' => 'laravel',
        'port' => env('PORT'),
    ]);
});

Route::get('/db-test', DatabaseProbeController::class);
