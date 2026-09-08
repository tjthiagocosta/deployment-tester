use axum::{http::StatusCode, response::Html, routing::get, Json, Router};
use postgres_native_tls::MakeTlsConnector;
use serde_json::json;
use std::{env, time::Duration};
use tokio_postgres::config::SslMode;

#[tokio::main]
async fn main() {
    let port = env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr = format!("0.0.0.0:{}", port);
    let health_port = port.clone();

    let app = Router::new()
        .route(
            "/",
            get(|| async { Html("<h1 id=\"probe-marker\">AXUM_LIVE</h1>") }),
        )
        .route("/db-test", get(db_test))
        .route(
            "/healthz",
            get(move || {
                let port = health_port.clone();
                async move { Json(json!({ "ok": true, "framework": "axum", "port": port })) }
            }),
        );

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    println!("axum-probe listening on {}", addr);
    axum::serve(listener, app).await.unwrap();
}

async fn db_test() -> (StatusCode, Json<serde_json::Value>) {
    let database_url = env::var("DATABASE_URL").unwrap_or_default();
    match tokio::time::timeout(Duration::from_secs(10), probe_database(&database_url)).await {
        Ok(Ok(counter)) => (
            StatusCode::OK,
            Json(
                json!({"ok": true, "framework": "axum", "database": "postgresql", "counter": counter}),
            ),
        ),
        _ => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"ok": false, "framework": "axum", "error": "Database probe failed"})),
        ),
    }
}

async fn probe_database(
    database_url: &str,
) -> Result<i32, Box<dyn std::error::Error + Send + Sync>> {
    if database_url.is_empty() {
        return Err("DATABASE_URL is required".into());
    }
    let mut config: tokio_postgres::Config = database_url.parse()?;
    if config.get_ssl_mode() == SslMode::Prefer {
        config.ssl_mode(SslMode::Require);
    }
    // Nouva currently serves an encrypt-only self-signed certificate without a service SAN.
    // Require TLS without falling back to plaintext; explicit sslmode=disable is for local tests.
    let connector = native_tls::TlsConnector::builder()
        .danger_accept_invalid_certs(true)
        .danger_accept_invalid_hostnames(true)
        .build()?;
    let (client, connection) = config.connect(MakeTlsConnector::new(connector)).await?;
    // Driving the connection alongside the queries propagates connection failures.
    let queries = async {
        client.batch_execute("CREATE TABLE IF NOT EXISTS nouva_deployment_probe (fixture TEXT PRIMARY KEY, counter INTEGER NOT NULL)").await?;
        client.execute("INSERT INTO nouva_deployment_probe (fixture, counter) VALUES ('axum', 1) ON CONFLICT (fixture) DO UPDATE SET counter = nouva_deployment_probe.counter + 1", &[]).await?;
        let row = client
            .query_one(
                "SELECT counter FROM nouva_deployment_probe WHERE fixture = 'axum'",
                &[],
            )
            .await?;
        Ok(row.get(0))
    };
    tokio::select! {
        result = queries => result,
        result = connection => {
            result?;
            Err("database connection closed before readback".into())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn rejects_missing_database_url() {
        assert!(probe_database("").await.is_err());
    }

    #[tokio::test]
    async fn persists_counter() {
        let Ok(database_url) = env::var("TEST_DATABASE_URL") else {
            eprintln!("TEST_DATABASE_URL is required for integration coverage");
            return;
        };
        let first = probe_database(&database_url).await.unwrap();
        let second = probe_database(&database_url).await.unwrap();
        assert!(first > 0);
        assert_eq!(second, first + 1);
    }
}
