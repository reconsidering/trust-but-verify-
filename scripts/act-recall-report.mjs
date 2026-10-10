import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const [dir=process.env.AO3_DIR,out,...rest]=process.argv.slice(2);
if(!dir||rest.length)throw Error('Usage: npm run recall -- <adult-fic directory> [report directory]');
const result=spawnSync('npx',['vitest','run','tests/act-recall-run.test.ts','--maxWorkers=1','--testTimeout=1500000'],{stdio:'inherit',env:{...process.env,ACT_RECALL_DIR:resolve(dir),ACT_RECALL_OUT:resolve(out??dir)}});
process.exit(result.status??1);
