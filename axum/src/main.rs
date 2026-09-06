use axum::{response::Html, routing::get, Json, Router};
use serde_json::json;
use std::env;

#[tokio::main]
async fn main() {
    let port = env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr = format!("0.0.0.0:{}", port);
    let health_port = port.clone();

    let app = Router::new()
        .route("/", get(|| async { Html("<h1 id=\"probe-marker\">AXUM_LIVE</h1>") }))
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
