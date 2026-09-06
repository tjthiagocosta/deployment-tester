// Fails the build deterministically, in seconds, with a marker that is easy to grep for in the
// dashboard's build log panel. Used to verify that a failed build still produces build output
// (nouva-platform#181).
console.log("NOUVA_PROBE: starting the build step");
console.log("NOUVA_PROBE: resolving dependencies");
console.error("NOUVA_PROBE_BUILD_FAILURE: unable to resolve package 'this-package-does-not-exist'");
console.error("NOUVA_PROBE: build aborted");
process.exit(1);
