import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

test('compiled Vercel entry loads in plain Node ESM without tsx resolution', () => {
  const output = mkdtempSync(resolve('.runtime-test-'));
  try {
    const compile = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', 'api/index.ts', '--outDir', output, '--module', 'esnext', '--moduleResolution', 'bundler', '--target', 'es2022', '--skipLibCheck', '--esModuleInterop'], {encoding:'utf8'});
    assert.equal(compile.status, 0, compile.stdout + compile.stderr);
    const url = pathToFileURL(resolve(output, 'api/index.js')).href;
    const run = spawnSync(process.execPath, ['--input-type=module', '-e', `const {default:app}=await import(${JSON.stringify(url)}); const server=app.listen(0,'127.0.0.1'); await new Promise(r=>server.once('listening',r)); const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/gemini/status'); const data=await response.json(); if(response.status!==200 || typeof data.isAvailable!=='boolean') process.exitCode=1; server.close();`], {encoding:'utf8',env:{...process.env,VERCEL:'1'},timeout:10000});
    assert.equal(run.status, 0, run.stdout + run.stderr);
  } finally { rmSync(output, {recursive:true,force:true}); }
});
