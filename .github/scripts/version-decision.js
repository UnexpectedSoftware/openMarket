const body = process.env.PR_BODY || '';
const base = process.argv[2];
const head = process.argv[3];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function decision(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.startsWith('Version:'));
  if (lines.length !== 1) {
    fail('Add one line to the pull request: Version: patch, minor, major, or none');
  }
  const match = /^Version:\s*(patch|minor|major|none)\s*$/.exec(lines[0]);
  if (!match) {
    fail('Version line must be exactly: Version: patch, minor, major, or none');
  }
  return match[1];
}

function parts(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    fail(`Version must be major.minor.patch, got ${version}`);
  }
  return match.slice(1).map(Number);
}

const kind = decision(body);
const [baseMajor, baseMinor, basePatch] = parts(base);
const [headMajor, headMinor, headPatch] = parts(head);

if (kind === 'none' && base !== head) {
  fail(`Version is none, but package.json changed from ${base} to ${head}`);
}
if (kind === 'major' && !(headMajor > baseMajor)) {
  fail(`major requires the major number to increase (${base} -> ${head})`);
}
if (kind === 'minor' && !(headMajor === baseMajor && headMinor > baseMinor)) {
  fail(`minor requires the minor number to increase and the major number to stay the same (${base} -> ${head})`);
}
if (kind === 'patch' && !(headMajor === baseMajor && headMinor === baseMinor && headPatch > basePatch)) {
  fail(`patch requires the patch number to increase and the major and minor numbers to stay the same (${base} -> ${head})`);
}
