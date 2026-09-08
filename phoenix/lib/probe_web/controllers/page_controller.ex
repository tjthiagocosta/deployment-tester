defmodule ProbeWeb.PageController do
  use ProbeWeb, :controller

  def home(conn, _params) do
    html(conn, ~s(<h1 id="probe-marker">PHOENIX_LIVE</h1>))
  end

  def healthz(conn, _params) do
    json(conn, %{ok: true, framework: "phoenix", port: System.get_env("PORT")})
  end

  def db_test(conn, _params) do
    case Probe.DatabaseProbe.run(System.get_env("DATABASE_URL")) do
      {:ok, counter} ->
        json(conn, %{ok: true, framework: "phoenix", database: "postgresql", counter: counter})

      {:error, :database_probe_failed} ->
        conn
        |> put_status(:service_unavailable)
        |> json(%{ok: false, framework: "phoenix", error: "Database probe failed"})
    end
  end
end
