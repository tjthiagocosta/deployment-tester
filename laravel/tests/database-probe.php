<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();
$databaseUrl = config('database.connections.pgsql.url');

function check(bool $condition, string $message): void
{
    if (! $condition) {
        throw new RuntimeException($message);
    }
}

try {
    foreach ([null, 'postgresql://secret:password@127.0.0.1:1/missing'] as $url) {
        config(['database.connections.pgsql.url' => $url]);
        DB::purge('pgsql');
        $request = Request::create('/db-test', 'GET');
        $response = $kernel->handle($request);
        check($response->getStatusCode() === 503, 'Unavailable database must return 503');
        check(json_decode($response->getContent(), true) === [
            'ok' => false, 'framework' => 'laravel', 'error' => 'Database probe failed',
        ], 'Database errors must not expose credentials');
        $kernel->terminate($request, $response);
    }

    config(['database.connections.pgsql.url' => $databaseUrl]);
    DB::purge('pgsql');
    check(is_string($databaseUrl) && $databaseUrl !== '', 'Run with a disposable PostgreSQL DATABASE_URL');
    $counters = [];
    for ($attempt = 0; $attempt < 2; $attempt++) {
        $request = Request::create('/db-test', 'GET');
        $response = $kernel->handle($request);
        check($response->getStatusCode() === 200, 'Database probe must succeed');
        $body = json_decode($response->getContent(), true);
        check($body['ok'] === true && $body['framework'] === 'laravel' && $body['database'] === 'postgresql', 'Success response must identify the fixture and database');
        check(is_int($body['counter']) && $body['counter'] > 0, 'Counter must be a positive integer');
        $counters[] = $body['counter'];
        $kernel->terminate($request, $response);
    }
    check($counters[1] === $counters[0] + 1, 'Repeated probes must increment the persisted counter');
    DB::purge('pgsql');
    $row = DB::connection('pgsql')->selectOne(
        'SELECT counter FROM nouva_deployment_probe WHERE fixture = ?', ['laravel'],
    );
    check((int) $row->counter === $counters[1], 'Counter must be committed and visible to a new connection');
    $health = $kernel->handle(Request::create('/healthz', 'GET'));
    check($health->getStatusCode() === 200, 'Existing health endpoint must remain available');
    echo "Database probe tests passed.\n";
} finally {
    config(['database.connections.pgsql.url' => $databaseUrl]);
    DB::disconnect('pgsql');
}
