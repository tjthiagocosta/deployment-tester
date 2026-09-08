<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class DatabaseProbeController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            $url = config('database.connections.pgsql.url');
            if (! is_string($url) || ! preg_match('/^postgres(ql)?:\/\//', $url)) {
                throw new \InvalidArgumentException('A PostgreSQL URL is required');
            }

            $connection = DB::connection('pgsql');
            $connection->statement("SET statement_timeout = '5s'");
            $connection->transaction(function () use ($connection): void {
                $connection->statement('CREATE TABLE IF NOT EXISTS nouva_deployment_probe (fixture TEXT PRIMARY KEY, counter INTEGER NOT NULL)');
                $connection->statement(
                    'INSERT INTO nouva_deployment_probe (fixture, counter) VALUES (?, 1) ON CONFLICT (fixture) DO UPDATE SET counter = nouva_deployment_probe.counter + 1',
                    ['laravel'],
                );
            });
            $row = $connection->selectOne('SELECT counter FROM nouva_deployment_probe WHERE fixture = ?', ['laravel']);
            if ($row === null) {
                throw new \RuntimeException('Probe row was not persisted');
            }

            return response()->json([
                'ok' => true,
                'framework' => 'laravel',
                'database' => 'postgresql',
                'counter' => (int) $row->counter,
            ]);
        } catch (Throwable) {
            // Public deployment probes must never expose connection details.
            return response()->json([
                'ok' => false,
                'framework' => 'laravel',
                'error' => 'Database probe failed',
            ], 503);
        } finally {
            DB::disconnect('pgsql');
        }
    }
}
