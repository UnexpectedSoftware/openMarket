const { spawn } = require('child_process');

const version = require('../../package.json').version;
const expected = `OPENMARKET_SMOKE ${version}`;
const command = process.argv[2];
const args = process.argv.slice(3);

if (!command) {
  console.error('usage: smoke-launch.js <command> [args...]');
  process.exit(1);
}

const child = spawn(command, args, {
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe']
});
let output = '';

child.stdout.on('data', chunk => {
  output += chunk;
  process.stdout.write(chunk);
});
child.stderr.on('data', chunk => {
  output += chunk;
  process.stderr.write(chunk);
});

const timer = setTimeout(() => {
  child.kill();
  console.error(`timed out waiting for ${expected}`);
  process.exit(1);
}, 60000);

child.on('error', error => {
  clearTimeout(timer);
  console.error(error.message);
  process.exit(1);
});

child.on('exit', code => {
  clearTimeout(timer);
  if (code === 0 && output.includes(expected)) {
    process.exit(0);
  }
  console.error(`smoke failed, exit ${code}, expected ${expected}`);
  process.exit(1);
});
