#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function loadEnvFile() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const envPath = path.resolve(__dirname, '../.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const raw = fs.readFileSync(envPath, 'utf8');
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const SCENARIOS = {
  health: {
    method: 'GET',
    path: '/health',
  },
  root: {
    method: 'GET',
    path: '/',
  },
  login: {
    method: 'POST',
    path: '/auth/login',
    body: () => ({
      email: process.env.LOAD_LOGIN_EMAIL || process.env.LOGIN_EMAIL || 'test@example.com',
      password: process.env.LOAD_LOGIN_PASSWORD || process.env.LOGIN_PASSWORD || '123456',
    }),
  },
};

const API_URL = (process.env.API_URL || process.env.api_url || 'http://localhost:3000').replace(/\/$/, '');
const CONCURRENCY = Number.parseInt(process.env.LOAD_CONCURRENCY || '50', 10);
const DURATION_SEC = Number.parseInt(process.env.LOAD_DURATION_SEC || '30', 10);
const TIMEOUT_MS = Number.parseInt(process.env.LOAD_TIMEOUT_MS || '10000', 10);
const scenarioArg = (process.argv[2] || 'health').toLowerCase();

if (Number.isNaN(CONCURRENCY) || CONCURRENCY < 1) {
  console.error('LOAD_CONCURRENCY debe ser un entero >= 1.');
  process.exit(1);
}

if (Number.isNaN(DURATION_SEC) || DURATION_SEC < 1) {
  console.error('LOAD_DURATION_SEC debe ser un entero >= 1.');
  process.exit(1);
}

if (Number.isNaN(TIMEOUT_MS) || TIMEOUT_MS < 100) {
  console.error('LOAD_TIMEOUT_MS debe ser un entero >= 100.');
  process.exit(1);
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

async function extractHttpErrorSample(response) {
  const contentType = response.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const payload = await response.json();
      const message = Array.isArray(payload?.message)
        ? payload.message.join(' | ')
        : payload?.message;

      if (typeof message === 'string' && message.trim()) {
        return `status ${response.status}: ${message}`;
      }
    }

    const text = await response.text();
    if (text && text.trim()) {
      return `status ${response.status}: ${text.slice(0, 120)}`;
    }
  } catch {
    // If body cannot be parsed, fallback to status only.
  }

  return `status ${response.status}`;
}

function printSummary(name, cfg, stats, elapsedMs) {
  const latencies = stats.latencies.sort((a, b) => a - b);
  const total = stats.ok + stats.httpErrors + stats.networkErrors;
  const seconds = elapsedMs / 1000;
  const reqPerSec = total / seconds;

  console.log('');
  console.log('='.repeat(60));
  console.log(`Escenario: ${name.toUpperCase()}  ${cfg.method} ${cfg.path}`);
  console.log('='.repeat(60));
  console.log(`URL base:          ${API_URL}`);
  console.log(`Duracion real:     ${seconds.toFixed(2)} s`);
  console.log(`Concurrencia:      ${CONCURRENCY}`);
  console.log(`Peticiones total:  ${total}`);
  console.log(`RPS promedio:      ${reqPerSec.toFixed(2)}`);
  console.log(`2xx/3xx:           ${stats.ok}`);
  console.log(`Errores HTTP 4xx/5xx: ${stats.httpErrors}`);
  console.log(`Errores de red/timeout: ${stats.networkErrors}`);
  console.log(`Latencia avg:      ${(stats.totalLatency / Math.max(total, 1)).toFixed(2)} ms`);
  console.log(`Latencia p50:      ${percentile(latencies, 50).toFixed(2)} ms`);
  console.log(`Latencia p95:      ${percentile(latencies, 95).toFixed(2)} ms`);
  console.log(`Latencia p99:      ${percentile(latencies, 99).toFixed(2)} ms`);

  if (stats.sampleHttpErrors.length > 0) {
    console.log('Muestra errores HTTP:', stats.sampleHttpErrors.join(' | '));
  }

  if (stats.sampleNetworkErrors.length > 0) {
    console.log('Muestra errores red:', stats.sampleNetworkErrors.join(' | '));
  }
}

async function runScenario(name) {
  const cfg = SCENARIOS[name];
  if (!cfg) {
    console.error(`Escenario no valido: ${name}`);
    console.error(`Validos: ${Object.keys(SCENARIOS).join(', ')}, all`);
    process.exit(1);
  }

  if (name === 'login' && !process.env.LOAD_LOGIN_EMAIL && !process.env.LOGIN_EMAIL) {
    console.warn('Aviso: usando email por defecto para login. Configura LOAD_LOGIN_EMAIL para una prueba real.');
  }

  const stats = {
    ok: 0,
    httpErrors: 0,
    networkErrors: 0,
    totalLatency: 0,
    latencies: [],
    sampleHttpErrors: [],
    sampleNetworkErrors: [],
  };

  const stopAt = Date.now() + DURATION_SEC * 1000;

  async function worker() {
    while (Date.now() < stopAt) {
      const started = performance.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const options = {
          method: cfg.method,
          signal: controller.signal,
          headers: {},
        };

        if (cfg.body) {
          options.headers['content-type'] = 'application/json';
          options.body = JSON.stringify(cfg.body());
        }

        const response = await fetch(`${API_URL}${cfg.path}`, options);
        const ended = performance.now();
        const latency = ended - started;

        stats.totalLatency += latency;
        stats.latencies.push(latency);

        if (response.ok) {
          stats.ok += 1;
        } else {
          stats.httpErrors += 1;
          if (stats.sampleHttpErrors.length < 5) {
            stats.sampleHttpErrors.push(await extractHttpErrorSample(response));
          }
        }
      } catch (err) {
        const ended = performance.now();
        const latency = ended - started;

        stats.totalLatency += latency;
        stats.latencies.push(latency);
        stats.networkErrors += 1;

        if (stats.sampleNetworkErrors.length < 5) {
          stats.sampleNetworkErrors.push(err.name || 'NetworkError');
        }
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  console.log(`Iniciando escenario ${name} -> ${cfg.method} ${cfg.path}`);
  console.log(`Target: ${API_URL} | Concurrency: ${CONCURRENCY} | Duration: ${DURATION_SEC}s`);

  const started = performance.now();
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  const ended = performance.now();

  printSummary(name, cfg, stats, ended - started);

  return stats.httpErrors + stats.networkErrors;
}

async function main() {
  let totalErrors = 0;

  if (scenarioArg === 'all') {
    for (const key of Object.keys(SCENARIOS)) {
      totalErrors += await runScenario(key);
    }
  } else {
    totalErrors += await runScenario(scenarioArg);
  }

  process.exitCode = totalErrors > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error('Fallo en load test:', err);
  process.exit(1);
});
