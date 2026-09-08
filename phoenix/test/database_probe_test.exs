defmodule Probe.DatabaseProbeTest do
  use ExUnit.Case, async: false

  test "missing database URL produces a safe failure" do
    assert {:error, :database_probe_failed} = Probe.DatabaseProbe.run(nil)
  end

  @tag :database
  test "counter persists between independent connections" do
    database_url = System.fetch_env!("TEST_DATABASE_URL")
    assert {:ok, first} = Probe.DatabaseProbe.run(database_url)
    assert {:ok, second} = Probe.DatabaseProbe.run(database_url)
    assert first > 0
    assert second == first + 1
  end
end
