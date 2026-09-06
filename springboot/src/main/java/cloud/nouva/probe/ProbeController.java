package cloud.nouva.probe;

import java.util.Map;

import org.springframework.http.MediaType;
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
}
