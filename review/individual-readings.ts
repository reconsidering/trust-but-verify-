import type {ReadingReview,ReviewAnswer,ReviewRow} from './review-batch-data';
export function renderIndividualReadings(root:HTMLElement,row:ReviewRow,paras:string[]|undefined,answer:()=>ReviewAnswer|undefined,update:(patch:Partial<ReviewAnswer>)=>void,render:()=>void){
 root.replaceChildren();
 for(const hit of row.engineReadings??[]){
  const p=hit.proposal,id=hit.id,primary=id==='primary';
  if(!p||!id){const line=document.createElement('p');line.textContent=`¶${hit.para} · ${hit.claim} · ${hit.kind} · Engine confidence: ${score(hit.confidence)}`;root.append(line);continue;}
  const current=()=>primary?answer():answer()?.readingReviews?.[id];
  const change=(patch:Partial<ReadingReview>)=>{if(primary)update({...patch,...(patch.proposalReview===undefined?{proposalRevision:undefined}:{})});else update({readingReviews:{...(answer()?.readingReviews??{}),[id]:{errors:[],context:'',updatedAt:new Date().toISOString(),...current(),...patch,proposalRevision:p.revision}}});};
  const a=current(),card=document.createElement('section');card.className='act-card';card.dataset.engineReadingId=id;
  const title=document.createElement('h4');title.textContent=`${primary?'Target reading · ':''}${hit.claim}`;
  const scores=document.createElement('p');scores.textContent=`¶${hit.para} · ${hit.kind} · ${hit.act} · Engine confidence: ${score(hit.confidence)} · My verdict: engine ${p.verdict} · My confidence: ${score(p.confidence)}`;
  const basis=document.createElement('p');basis.className='small';basis.textContent=hit.confidenceBasis??'';
  const reading=document.createElement('p');reading.textContent=p.reading;
  const why=document.createElement('p');why.textContent=p.rationale;
  const cite=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Cited paragraph and adjacent context';cite.append(summary);
  if(paras)for(let i=Math.max(0,hit.para-1);i<=Math.min(paras.length-1,hit.para+1);i++){const line=document.createElement('p');line.textContent=`¶${i} · ${paras[i]}`;cite.append(line);}else{const line=document.createElement('p');line.textContent='Load the fic to view the cited paragraphs and answer.';cite.append(line);}
  const choices=document.createElement('div');choices.className='choices';
  const button=(text:string,pressed:boolean,act:()=>void)=>{const b=document.createElement('button');b.textContent=text;b.disabled=!paras;b.setAttribute('aria-pressed',String(pressed));b.onclick=()=>{act();render();};choices.append(b);};
  button('Agree with my assessment',a?.proposalReview==='agree',()=>{const prev=current(),text=`${p.reading}\n\n${p.rationale}`;change({verdict:p.verdict,proposalReview:'agree',proposalRevision:p.revision,errors:[...new Set([...(prev?.errors??[]),...p.errors])],context:prev?.context?(prev.context.includes(text)?prev.context:prev.context+'\n\n'+text):text,...(primary&&row.labelAudit?{pastLabelReview:'replace' as const}:{})});});
  button('Disagree with my assessment',a?.proposalReview==='disagree',()=>{const prev=current(),text=`${p.reading}\n\n${p.rationale}`;change({verdict:undefined,proposalReview:'disagree',proposalRevision:p.revision,...(prev?.proposalReview==='agree'?{context:prev.context.replace(text,'').trim(),errors:prev.errors.filter(e=>!p.errors.includes(e))}:{})});});
  for(const [v,text] of [['correct','Engine correct'],['wrong','Engine wrong'],['uncertain','Not sure']] as const)button(text,a?.verdict===v,()=>change({verdict:v,proposalReview:undefined,proposalRevision:p.revision}));
  const notes=document.createElement('details'),heading=document.createElement('summary');heading.textContent='Additional context / correction and common errors';notes.append(heading);notes.open=a?.proposalReview==='disagree';
  const label=document.createElement('label');label.textContent='Additional context / correction';const input=document.createElement('textarea');input.disabled=!paras;input.value=a?.context??'';input.oninput=()=>change({context:input.value});label.append(input);notes.append(label);
  const checks=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent='Common errors';checks.append(legend);
  for(const error of [...new Set(['Wrong person','Roles reversed','Wrong act or body part','No act happened','Wish or dialogue treated as an act','Memory counted as a new scene','Needs more context','Other',...p.errors,...(a?.errors??[])])]){const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.disabled=!paras;box.checked=a?.errors.includes(error)??false;box.onchange=()=>{const values=new Set(current()?.errors??[]);box.checked?values.add(error):values.delete(error);change({errors:[...values]});};label.append(box,document.createTextNode(error));checks.append(label);}
  notes.append(checks);card.append(title,scores,basis,reading,why,cite,choices,notes);root.append(card);
 }
}
const score=(p:number|null)=>p===null?'unavailable':Math.round(p*100)+'%';
