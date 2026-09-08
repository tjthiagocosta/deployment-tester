ENV["RAILS_ENV"] = "test"
require_relative "../config/environment"
require "minitest/autorun"
require "rack/mock"

class DatabaseProbeTest < Minitest::Test
  def setup
    @database_url = ENV["DATABASE_URL"]
    @client = Rack::MockRequest.new(Rails.application)
  end

  def teardown
    ENV["DATABASE_URL"] = @database_url
  end

  def test_missing_database_returns_safe_failure_and_keeps_health
    ENV.delete("DATABASE_URL")
    response = @client.get("/db-test")
    assert_equal 503, response.status
    assert_equal({ "ok" => false, "framework" => "rails", "error" => "Database probe failed" }, JSON.parse(response.body))
    assert JSON.parse(@client.get("/healthz").body).fetch("ok")
  end

  def test_unreachable_database_does_not_expose_credentials
    ENV["DATABASE_URL"] = "postgresql://secret:password@127.0.0.1:1/missing"
    response = @client.get("/db-test")
    assert_equal 503, response.status
    assert_equal "Database probe failed", JSON.parse(response.body).fetch("error")
    refute_includes response.body, "password"
  end

  def test_persists_increment_visible_to_another_connection
    refute_nil @database_url, "Run with a disposable PostgreSQL DATABASE_URL"
    first = @client.get("/db-test")
    second = @client.get("/db-test")
    assert_equal 200, first.status
    assert_equal 200, second.status
    before, after = JSON.parse(first.body), JSON.parse(second.body)
    assert_equal({ "ok" => true, "framework" => "rails", "database" => "postgresql", "counter" => before.fetch("counter") + 1 }, after)
    PG.connect(@database_url) do |connection|
      row = connection.exec_params("SELECT counter FROM nouva_deployment_probe WHERE fixture = $1", [ "rails" ]).first
      assert_equal after.fetch("counter"), Integer(row.fetch("counter"))
    end
  end
end
