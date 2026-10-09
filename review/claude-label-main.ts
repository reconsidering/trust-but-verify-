import {mountClaudeReview} from './claude-label-review';
try{const response=await fetch('./claude-oct4-5.json');if(!response.ok)throw Error('Review data could not be loaded. Reload this page.');mountClaudeReview(await response.json());}catch(e){document.getElementById('status')!.textContent=e instanceof Error?e.message:'The review could not be opened.';}
