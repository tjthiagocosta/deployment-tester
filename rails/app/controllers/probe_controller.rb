class ProbeController < ActionController::API
  def index
    render html: '<h1 id="probe-marker">RAILS_LIVE</h1>'.html_safe, content_type: "text/html"
  end

  def healthz
    render json: { ok: true, framework: "rails", port: ENV["PORT"] }
  end

  def db_test
    database_url = ENV.fetch("DATABASE_URL")
    raise ArgumentError, "A PostgreSQL URL is required" unless database_url.start_with?("postgres://", "postgresql://")

    counter = PG.connect(database_url, connect_timeout: 5) do |connection|
      connection.exec("SET statement_timeout = '5s'")
      connection.transaction do
        connection.exec("CREATE TABLE IF NOT EXISTS nouva_deployment_probe (fixture TEXT PRIMARY KEY, counter INTEGER NOT NULL)")
        connection.exec_params(
          "INSERT INTO nouva_deployment_probe (fixture, counter) VALUES ($1, 1) ON CONFLICT (fixture) DO UPDATE SET counter = nouva_deployment_probe.counter + 1",
          [ "rails" ]
        )
      end
      row = connection.exec_params("SELECT counter FROM nouva_deployment_probe WHERE fixture = $1", [ "rails" ]).first
      Integer(row.fetch("counter"))
    end
    render json: { ok: true, framework: "rails", database: "postgresql", counter: counter }
  rescue KeyError, ArgumentError, PG::Error
    # Public deployment probes must never expose connection details.
    render json: { ok: false, framework: "rails", error: "Database probe failed" }, status: :service_unavailable
  end
end
