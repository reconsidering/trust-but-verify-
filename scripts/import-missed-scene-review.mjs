// node scripts/import-missed-scene-review.mjs batch.json owner-answers.json output.json
// Writes a separate act-only inventory. Never writes tests/labels or tests/right-set.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {buildActInventory} from './scene-review-scope.mjs';
const [batchPath,answersPath,output] = process.argv.slice(2);
if (!batchPath || !answersPath || !output) throw Error('Supply batch metadata, owner answers, and a separate inventory output file.');
for (const dir of ['tests/labels', 'tests/right-set', 'tests/gold']) if (resolve(output).startsWith(resolve(dir)+sep)) throw Error('Use a separate scene-review inventory directory; this import must not write confidence or gold labels.');
const bytes = readFileSync(answersPath), inventory = buildActInventory(JSON.parse(readFileSync(batchPath,'utf8')),JSON.parse(bytes));
inventory.feedbackSha = createHash('sha256').update(bytes).digest('hex');
writeFileSync(output,JSON.stringify(inventory,null,1)+'\n');
console.log(`${inventory.windows.length} completed windows, ${inventory.windows.reduce((n,w)=>n+w.events.length,0)} performed sex acts; ${inventory.skippedUnfinished.length} unfinished windows excluded. Hints and training labels unchanged.`);
