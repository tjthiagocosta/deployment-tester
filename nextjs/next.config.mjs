/** @type {import("next").NextConfig} */
export default {
  output: "standalone",
  // Keep this tiny fixture build within the test server's constrained build allocation.
  experimental: { cpus: 1, webpackMemoryOptimizations: true },
};
