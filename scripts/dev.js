const { spawn } = require('child_process');

function run(name, color, command, args) {
  const child = spawn(command, args, { stdio: ['inherit', 'pipe', 'pipe'], shell: process.platform === 'win32' });

  const prefix = `\x1b[${color}m[${name}]\x1b[0m`;
  child.stdout.on('data', (chunk) => process.stdout.write(`${prefix} ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`${prefix} ${chunk}`));

  return child;
}

const client = run('client', '36', 'npm', ['run', 'dev:client']);
const server = run('server', '35', 'npm', ['run', 'dev:server']);

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  client.kill('SIGTERM');
  server.kill('SIGTERM');
  setTimeout(() => process.exit(code), 200);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

client.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`[dev] client exited with code ${code}`);
    shutdown(code);
  }
});

server.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`[dev] server exited with code ${code}`);
    shutdown(code);
  }
});
