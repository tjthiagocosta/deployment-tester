// #284 fixture: a queue worker that finishes its current job on the stop signal.
// JOB_SECONDS: how long the in-flight job takes after the signal arrives.
// LOCK_URL (optional): an HTTP lock service is overkill; instead each instance logs
// "started <epoch>" / "stopped <epoch>" with its container hostname so overlap is provable.
const jobSeconds = Number(process.env.JOB_SECONDS ?? 20);
const id = process.env.HOSTNAME ?? "unknown";
const now = () => Math.floor(Date.now() / 1000);
console.log(`WORKER started ${now()} host=${id} deployment=${process.env.NOUVA_DEPLOYMENT_ID ?? "?"}`);
let tick = 0;
const timer = setInterval(() => console.log(`WORKER tick ${++tick} host=${id}`), 5000);
for (const sig of ["SIGTERM", "SIGINT", "SIGQUIT", "SIGHUP", "SIGUSR1", "SIGUSR2"]) {
  process.on(sig, () => {
    console.log(`WORKER got ${sig} ${now()} host=${id}; finishing job for ${jobSeconds}s`);
    clearInterval(timer);
    setTimeout(() => {
      console.log(`WORKER finished job ${now()} host=${id}`);
      console.log(`WORKER stopped ${now()} host=${id}`);
      process.exit(0);
    }, jobSeconds * 1000);
  });
}
