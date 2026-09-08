package cloud.nouva.probe;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class ProbeControllerTests {
  @Test
  void rejectsMissingDatabaseUrl() {
    assertThrows(IllegalArgumentException.class, () -> ProbeController.probeDatabase(null));
  }

  @Test
  void persistsCounter() throws Exception {
    String databaseUrl = System.getenv("TEST_DATABASE_URL");
    assumeTrue(databaseUrl != null && !databaseUrl.isBlank(), "TEST_DATABASE_URL is required for integration coverage");
    int first = ProbeController.probeDatabase(databaseUrl);
    int second = ProbeController.probeDatabase(databaseUrl);
    assertTrue(first > 0);
    assertEquals(first + 1, second);
  }
}
