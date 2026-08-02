// Marks a build output directory as ESM or CommonJS.
//
// Node decides how to parse a .js file from the "type" of the nearest
// package.json, not from the "exports" condition that resolved it. The root
// package.json has no "type" (so the package is CommonJS by default), which
// means dist/esm/*.js would be parsed as CommonJS and throw a SyntaxError on
// Node versions without module syntax detection (< 20.19 / < 22.7). Dropping a
// one-line package.json into each output directory pins the parse mode.
import { writeFileSync } from 'node:fs';

const TYPES = { esm: 'module', cjs: 'commonjs' };

const target = process.argv[2];
const type = TYPES[target];

if (!type) {
  console.error(`usage: write-module-type.mjs <${Object.keys(TYPES).join('|')}>`);
  process.exit(1);
}

writeFileSync(`dist/${target}/package.json`, `${JSON.stringify({ type }, null, 2)}\n`);
