const { spawn } = require('child_process');
const http = require('http');

const API_ORIGIN = process.env.VITE_API_ORIGIN || process.env.API_ORIGIN || 'http://127.0.0.1:3001';
const API_READY_PATH = '/api/v1/ready';
const API_READY_TIMEOUT_MS = Number(process.env.API_READY_TIMEOUT_MS || 90000);
const API_READY_INTERVAL_MS = Number(process.env.API_READY_INTERVAL_MS || 1200);

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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkApiReady() {
  const readyUrl = new URL(API_READY_PATH, API_ORIGIN);

  return new Promise((resolve) => {
    const request = http.request(
      readyUrl,
      {
        method: 'GET',
        timeout: 2000,
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          try {
            const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            resolve(response.statusCode === 200 && payload?.ready === true);
          } catch {
            resolve(response.statusCode === 200);
          }
        });
      },
    );

    request.on('error', () => resolve(false));
    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });

    request.end();
  });
}

async function waitForApiReady() {
  const startedAt = Date.now();
  process.stdout.write(`[dev] waiting for API readiness at ${new URL(API_READY_PATH, API_ORIGIN).toString()}\n`);

  while (Date.now() - startedAt < API_READY_TIMEOUT_MS) {
    if (await checkApiReady()) {
      process.stdout.write('[dev] API ready; starting site and CMS.\n');
      return;
    }
    await wait(API_READY_INTERVAL_MS);
  }

  throw new Error(`API readiness timeout after ${API_READY_TIMEOUT_MS}ms (${API_ORIGIN}${API_READY_PATH}).`);
}

const processes = [];
let shuttingDown = false;

function registerProcess(proc) {
  processes.push(proc);
  return proc;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  processes.forEach((proc) => proc.kill('SIGTERM'));
  setTimeout(() => process.exit(code), 250);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

function attachFailureHandler(proc, name) {
  proc.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[dev] process ${name} exited with code ${code}`);
      shutdown(code);
    }
  });
}

async function main() {
  const api = registerProcess(run('api', '35', 'npm', ['run', 'dev:api']));
  attachFailureHandler(api, 'api');

  await waitForApiReady();

  const site = registerProcess(run('site', '36', 'npm', ['run', 'dev:site']));
  const cms = registerProcess(run('cms', '33', 'npm', ['run', 'dev:cms']));

  attachFailureHandler(site, 'site');
  attachFailureHandler(cms, 'cms');
}

main().catch((error) => {
  console.error(`[dev] startup failed: ${error?.message || error}`);
  shutdown(1);
});
