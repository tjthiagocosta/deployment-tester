package cloud.nouva.probe;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Map;
import java.util.Properties;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProbeController {

  @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
  public String root() {
    return "<h1 id=\"probe-marker\">SPRINGBOOT_LIVE</h1>";
  }

  @GetMapping(value = "/healthz", produces = MediaType.APPLICATION_JSON_VALUE)
  public Map<String, Object> healthz() {
    return Map.of("ok", true, "framework", "springboot", "port", System.getenv().getOrDefault("PORT", "unset"));
  }

  @GetMapping(value = "/db-test", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Map<String, Object>> dbTest() {
    try {
      int counter = probeDatabase(System.getenv("DATABASE_URL"));
      return ResponseEntity.ok(Map.of("ok", true, "framework", "springboot", "database", "postgresql", "counter", counter));
    } catch (Exception error) {
      // A database failure is probe output; never expose connection details to callers.
      return ResponseEntity.status(503).body(Map.of("ok", false, "framework", "springboot", "error", "Database probe failed"));
    }
  }

  static int probeDatabase(String databaseUrl) throws Exception {
    if (databaseUrl == null || databaseUrl.isBlank()) {
      throw new IllegalArgumentException("DATABASE_URL is required");
    }
    URI uri = URI.create(databaseUrl);
    if (!("postgresql".equals(uri.getScheme()) || "postgres".equals(uri.getScheme())) || uri.getHost() == null) {
      throw new IllegalArgumentException("Expected a PostgreSQL URL");
    }
    Properties properties = new Properties();
    if (uri.getRawUserInfo() != null) {
      String[] credentials = uri.getRawUserInfo().split(":", 2);
      properties.setProperty("user", URLDecoder.decode(credentials[0].replace("+", "%2B"), StandardCharsets.UTF_8));
      if (credentials.length == 2) {
        properties.setProperty("password", URLDecoder.decode(credentials[1].replace("+", "%2B"), StandardCharsets.UTF_8));
      }
    }
    properties.setProperty("connectTimeout", "10");
    properties.setProperty("socketTimeout", "10");
    String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + (uri.getPort() < 0 ? 5432 : uri.getPort())
        + uri.getRawPath() + (uri.getRawQuery() == null ? "" : "?" + uri.getRawQuery());
    try (var connection = DriverManager.getConnection(jdbcUrl, properties);
         var statement = connection.createStatement()) {
      statement.setQueryTimeout(10);
      statement.executeUpdate("CREATE TABLE IF NOT EXISTS nouva_deployment_probe (fixture TEXT PRIMARY KEY, counter INTEGER NOT NULL)");
      statement.executeUpdate("INSERT INTO nouva_deployment_probe (fixture, counter) VALUES ('springboot', 1) ON CONFLICT (fixture) DO UPDATE SET counter = nouva_deployment_probe.counter + 1");
      try (var result = statement.executeQuery("SELECT counter FROM nouva_deployment_probe WHERE fixture = 'springboot'")) {
        if (!result.next()) throw new SQLException("Database probe readback was empty");
        return result.getInt(1);
      }
    }
  }
}
