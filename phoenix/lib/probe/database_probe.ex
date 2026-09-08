defmodule Probe.DatabaseProbe do
  @spec run(String.t() | nil) :: {:ok, pos_integer()} | {:error, :database_probe_failed}
  def run(database_url) do
    uri = URI.parse(database_url || "")

    if uri.scheme not in ["postgres", "postgresql"] or is_nil(uri.host) or is_nil(uri.path) do
      raise ArgumentError, "DATABASE_URL is required"
    end

    [username, password] = String.split(uri.userinfo || "", ":", parts: 2)

    options = [
      hostname: uri.host,
      port: uri.port || 5432,
      database: URI.decode(String.trim_leading(uri.path, "/")),
      username: URI.decode(username),
      password: URI.decode(password),
      ssl: false,
      connect_timeout: 5_000,
      timeout: 5_000,
      pool_size: 1
    ]

    {:ok, connection} = Postgrex.start_link(options)

    try do
      Postgrex.query!(
        connection,
        "CREATE TABLE IF NOT EXISTS nouva_deployment_probe (fixture TEXT PRIMARY KEY, counter INTEGER NOT NULL)",
        []
      )

      Postgrex.query!(
        connection,
        "INSERT INTO nouva_deployment_probe (fixture, counter) VALUES ('phoenix', 1) ON CONFLICT (fixture) DO UPDATE SET counter = nouva_deployment_probe.counter + 1",
        []
      )

      %Postgrex.Result{rows: [[counter]]} =
        Postgrex.query!(
          connection,
          "SELECT counter FROM nouva_deployment_probe WHERE fixture = 'phoenix'",
          []
        )

      {:ok, counter}
    after
      if Process.alive?(connection), do: GenServer.stop(connection)
    end
  rescue
    # Database failures are expected probe results and must not expose credentials.
    _error -> {:error, :database_probe_failed}
  catch
    :exit, _reason -> {:error, :database_probe_failed}
  end
end
