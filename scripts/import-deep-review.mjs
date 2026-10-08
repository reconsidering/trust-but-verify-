// node scripts/import-deep-review.mjs public/review/negotiation.json private-answers.json labels-output.json scene-output.json
import{readFileSync,writeFileSync,existsSync}from'node:fs';import{resolve,sep}from'node:path';import{createHash}from'node:crypto';
import{buildDeepReviewImports}from'./deep-review-feedback.mjs';
const[batchFile,answerFile,labelFile,sceneFile]=process.argv.slice(2);if(!batchFile||!answerFile||!labelFile||!sceneFile)throw Error('Supply manifest, answers, and separate label and scene-review output files.');
if(new Set([batchFile,answerFile,labelFile,sceneFile].map(p=>resolve(p))).size!==4)throw Error('Inputs and outputs must be separate files.');
if(['tests/labels','tests/right-set','tests/gold'].some(dir=>resolve(sceneFile).startsWith(resolve(dir)+sep)))throw Error('Scene reviews must stay outside confidence and gold label directories.');
if(existsSync(labelFile)||existsSync(sceneFile))throw Error('Output already exists. Use fresh output paths to preserve earlier imports.');
const batch=JSON.parse(readFileSync(batchFile,'utf8')),bytes=readFileSync(answerFile),feedback=JSON.parse(bytes),result=buildDeepReviewImports(batch,feedback),sha=createHash('sha256').update(bytes).digest('hex');
result.confidence.feedbackSha=sha;result.inventory.feedbackSha=sha;
writeFileSync(labelFile,JSON.stringify(result.confidence,null,1)+'\n');writeFileSync(sceneFile,JSON.stringify(result.inventory,null,1)+'\n');
console.log(`${Object.keys(result.confidence.labels).length} explicit reading decisions; ${result.inventory.windows.reduce((n,w)=>n+w.events.length,0)} confirmed performed events. Unmarked hints and inventory omissions produce no confidence labels; uncertain decisions are excluded from training.`);
