const { spawn } = require('child_process');

function run(name, color, command, args) {
  const child = spawn(command, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });

  const prefix = `\x1b[${color}m[${name}]\x1b[0m`;
  child.stdout.on('data', (chunk) => process.stdout.write(`${prefix} ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`${prefix} ${chunk}`));

  return child;
}

const processes = [
  run('site', '36', 'npm', ['run', 'dev:site']),
  run('api', '35', 'npm', ['run', 'dev:api']),
  run('cms', '33', 'npm', ['run', 'dev:cms']),
];

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  processes.forEach((proc) => proc.kill('SIGTERM'));
  setTimeout(() => process.exit(code), 200);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

processes.forEach((proc, index) => {
  proc.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[dev] process ${index} exited with code ${code}`);
      shutdown(code);
    }
  });
});
