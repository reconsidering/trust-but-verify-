// @vitest-environment jsdom
import {it,expect,vi,afterEach} from 'vitest';
import {createHash,webcrypto} from 'node:crypto';
import {TextEncoder,TextDecoder} from 'node:util';
import JSZip from 'jszip';
import {readFileSync} from 'node:fs';
import {loadReviewFics} from '../review/review-driven-loader';
import {reviewParagraphs,type ReviewSource} from '../review/review-batch-data';
const hash=(s:string|Uint8Array)=>createHash('sha256').update(s).digest('hex');
const fixture='<html><body><h1>Invented adult source</h1><div id="chapters"><div class="userstuff"><p>Morgan Vale passes a cup to Rowan Hale.</p><p>Rowan Hale sets the cup on the table.</p><p>Morgan Vale opens the window.</p></div></div></body></html>';
const bytes=(s:string)=>new TextEncoder().encode(s);
function source():ReviewSource{const paras=reviewParagraphs(fixture);return{file:'adults.html',title:'Invented adult source',sourceSha:hash(fixture),paragraphSha:hash(paras.join('\n')),paragraphCount:paras.length};}
afterEach(()=>vi.unstubAllGlobals());
function browserCrypto(){vi.stubGlobal('crypto',webcrypto);vi.stubGlobal('TextEncoder',TextEncoder);vi.stubGlobal('TextDecoder',TextDecoder);}
it('accepts renamed matching HTML and ZIP entries, skips unknown sources and rejects incompatible citations',async()=>{
 browserCrypto();const accept=vi.fn();const file={name:'Renamed upload.html',arrayBuffer:async()=>bytes(fixture).buffer};
 expect(await loadReviewFics([file],[source()],accept)).toEqual({loaded:1,skipped:0,errors:[]});expect(accept).toHaveBeenCalledWith('adults.html',reviewParagraphs(fixture));
 const zip=new JSZip();zip.file('nested/renamed.html',fixture);zip.file('unreviewed.html','<html>Unknown source</html>');zip.file('README.txt','Not story data');const zipBytes=await zip.generateAsync({type:'uint8array'});
 expect(await loadReviewFics([{name:'samples.zip',arrayBuffer:async()=>zipBytes.buffer as ArrayBuffer}],[source()],accept)).toEqual({loaded:1,skipped:1,errors:[]});
 const result=await loadReviewFics([file],[{...source(),paragraphSha:'wrong'}],accept);expect(result.loaded).toBe(0);expect(result.errors).toHaveLength(1);expect(accept).toHaveBeenCalledTimes(2);
});
it('keeps batch identities and recommendations separate from owner judgments, with recorded names',()=>{
 const c=JSON.parse(readFileSync('public/review/review-driven-error-check.json','utf8')),q=JSON.parse(readFileSync('public/review/review-driven-claims.json','utf8'));
 expect(c.batchId).toBe('review-driven-358b9ab935ee');expect(c.rows).toHaveLength(428);expect(q.rows).toHaveLength(36);
 for(const row of [...c.rows,...q.rows]){expect(['better','worse','same','uncertain']).toContain(row.recommendation.verdict);expect(row.recommendation.reason.trim()).not.toBe('');expect(row.verdict).toBeUndefined();}
 const known=c.rows.find((r:{fic:string;para:number;mode:string})=>r.fic==='tricks-of-the-trade.html'&&r.para===3604&&r.mode==='tagged');expect(known.recommendation.verdict).toBe('worse');expect(known.afterText.join(' ')).toContain('Castiel');expect(known.afterText.join(' ')).toContain('Dean Winchester');
 for(const row of c.rows)for(const hit of row.after)if(hit.a)expect(row.afterText.join(' ')).toContain(hit.a);
});
