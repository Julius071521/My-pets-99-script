const fs = require('fs');
const path = require('path');

function parseRuntimeConfigText(raw) {
  const text = String(raw || '').replace(/^\uFEFF/, '').trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('Invalid config.json; ignoring malformed runtime config:', err.message);
    return {};
  }
}

function sleepMs(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // Busy wait keeps sync call chain intact for existing server.js usage.
  }
}

function commitTempConfigFile(tempPath, targetPath) {
  try {
    fs.renameSync(tempPath, targetPath);
    return;
  } catch (renameErr) {
    if (process.platform !== 'win32') throw renameErr;
    fs.copyFileSync(tempPath, targetPath);
    fs.unlinkSync(tempPath);
  }
}

function createRuntimeConfigStore(configPath) {
  const resolvedPath = path.resolve(configPath);

  function readRuntimeConfig() {
    try {
      if (fs.existsSync(resolvedPath)) {
        return parseRuntimeConfigText(fs.readFileSync(resolvedPath, 'utf8'));
      }
    } catch (err) {
      if (err.code === 'EBUSY' || err.code === 'EPERM') {
        console.warn('config.json read skipped due to file lock:', err.message);
      }
    }
    return {};
  }

  function writeRuntimeConfig(config, options = {}) {
    const maxAttempts = Number(options.maxAttempts || 5);
    const payload = `${JSON.stringify(config || {}, null, 2)}\n`;
    const dir = path.dirname(resolvedPath);
    fs.mkdirSync(dir, { recursive: true });

    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const tempPath = path.join(dir, `.config.${process.pid}.${Date.now()}.${attempt}.tmp`);
      try {
        fs.writeFileSync(tempPath, payload, 'utf8');
        commitTempConfigFile(tempPath, resolvedPath);
        return true;
      } catch (err) {
        lastError = err;
        if (fs.existsSync(tempPath)) {
          try { fs.unlinkSync(tempPath); } catch (_unlinkErr) {}
        }
        if (attempt >= maxAttempts || (err.code !== 'EBUSY' && err.code !== 'EPERM')) {
          throw err;
        }
        sleepMs(40 * attempt);
      }
    }

    if (lastError) throw lastError;
    return false;
  }

  return {
    path: resolvedPath,
    parseRuntimeConfigText,
    readRuntimeConfig,
    writeRuntimeConfig
  };
}

module.exports = {
  parseRuntimeConfigText,
  createRuntimeConfigStore
};