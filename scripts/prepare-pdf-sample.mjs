// Reproduce a private HTML sample from a PDF for the HTML-only learning/check tools.
// node scripts/prepare-pdf-sample.mjs input.pdf output.html --title 'Work title' --chapters 32/32
// The output contains the private work: keep it outside Git, e.g. under ao3-samples/.
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {JSDOM} from 'jsdom';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';

const [input,output,...args]=process.argv.slice(2);
const option=name=>{const i=args.indexOf(`--${name}`);return i<0?undefined:args[i+1]};
if(!input||!output||!input.toLowerCase().endsWith('.pdf')||!output.toLowerCase().endsWith('.html'))throw Error('Provide an input PDF and a private output HTML path.');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const bytes=readFileSync(input),window=new JSDOM('').window;
globalThis.DOMParser=window.DOMParser;globalThis.Node=window.Node;
const server=await createServer({root,server:{middlewareMode:true}});
let loading;
try{
  const {joinPdfTextItems,joinPdfPages,extractFromText,extractFromHtml}=await server.ssrLoadModule('/src/extract.ts');
  const {reviewParagraphs}=await server.ssrLoadModule('/review/review-batch-data.ts');
  loading=getDocument({data:new Uint8Array(bytes),useSystemFonts:true});
  const pdf=await loading.promise,pages=[];
  for(let i=1;i<=pdf.numPages;i++){
    const content=await(await pdf.getPage(i)).getTextContent();
    pages.push(joinPdfTextItems(content.items.filter(item=>'str' in item)));
  }
  const work=extractFromText(joinPdfPages(pages));
  // Repeated running titles may be removed during stitching; use the supplied AO3 title.
  work.meta.title=option('title')??work.meta.title;
  if(!work.meta.title)throw Error('Supply the PDF work title with --title.');
  if(option('chapters'))work.meta.chapters=option('chapters');
  const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const fields=[['Rating',work.meta.rating],['Fandoms',work.meta.fandoms.join(', ')],['Relationships',work.meta.relationships.join(', ')],['Characters',work.meta.characters.join(', ')],['Additional Tags',work.meta.freeforms.join(', ')],['Categories',work.meta.categories.join(', ')],['Stats',`Words: ${work.meta.words} Chapters: ${work.meta.chapters}`]];
  const html='<!doctype html><html><head><meta charset="UTF-8"><title>'+esc(work.meta.title)+'</title></head><body><div id="preface"><h2 class="title">'+esc(work.meta.title)+'</h2><a href="'+esc(work.meta.url)+'">Original work</a><dl>'+fields.map(([k,v])=>'<dt>'+k+':</dt><dd>'+esc(v)+'</dd>').join('')+'</dl></div><div id="chapters"><div class="userstuff">'+work.text.split(/\n\s*\n/).map(p=>'<p>'+esc(p)+'</p>').join('\n')+'</div></div></body></html>';
  const normalized=extractFromHtml(html);
  // HTML extraction collapses horizontal whitespace; retain all words and paragraph boundaries.
  if(normalized.text!==work.text.replace(/[ \t\u00a0]+/g,' '))throw Error('HTML normalization changed the extracted story text.');
  if(existsSync(output)&&readFileSync(output,'utf8')!==html)throw Error('The output already exists with different content; choose a new path.');
  mkdirSync(dirname(resolve(output)),{recursive:true});writeFileSync(output,html);
  const sha=value=>createHash('sha256').update(value).digest('hex');
  console.log(JSON.stringify({title:normalized.meta.title,originalPdfSha:sha(bytes),sourceSha:sha(html),pages:pdf.numPages,paragraphs:reviewParagraphs(html).length,output:resolve(output)}));
}finally{await server.close();await loading?.destroy?.();window.close();}
