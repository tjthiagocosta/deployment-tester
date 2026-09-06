defmodule ProbeWeb.PageController do
  use ProbeWeb, :controller

  def home(conn, _params) do
    html(conn, ~s(<h1 id="probe-marker">PHOENIX_LIVE</h1>))
  end

  def healthz(conn, _params) do
    json(conn, %{ok: true, framework: "phoenix", port: System.get_env("PORT")})
  end
end
