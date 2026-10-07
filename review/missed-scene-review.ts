import {storyBytes,verifyStory} from './review-batch-data';
import {ACTS,OCCURRENCES,emptyAnswer,eventComplete,validSceneAnswer,importSceneAnswers,validateSceneProposals,sameProposalReading,proposalEventText,type SceneProposals,type SceneBatch,type SceneAnswer,type SceneEvent} from './missed-scene-data';
const FLAGS=['Participants / pronouns unclear','Penis vs fingers vs toy unclear','Oral vs anal unclear','Actual vs imagined unclear','Act continues outside this window','Multiple simultaneous acts','Needs more context','Other'];
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const notice=(text:string)=>{el('status').textContent=text;};

export async function mountMissedReview(batch:SceneBatch,proposals?:SceneProposals) {
  if(proposals)validateSceneProposals(batch,proposals);
  const answers:Record<string,SceneAnswer>={},stories=new Map<string,string[]>(),storageKey='missed-scene-review:'+batch.batchId;
  let current:string|undefined=batch.rows[0]?.id,browse:number|undefined,expanded=false,loading=false;
  try {const saved=JSON.parse(localStorage.getItem(storageKey)??'{}');for(const row of batch.rows) if(validSceneAnswer(saved[row.id],row)) answers[row.id]=saved[row.id];} catch {notice('Browser storage is unavailable. Export answers before leaving.');}
  const finished=(id:string)=>answers[id]?.complete===true;
  const visible=()=>batch.rows.filter(r=>el<HTMLSelectElement>('filter').value==='all'||(el<HTMLSelectElement>('filter').value==='answered'?finished(r.id):!finished(r.id)||r.id===current));
  const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(answers));}catch{notice('Browser storage is unavailable. Export answers before leaving.');}el('progress').textContent=`${batch.rows.filter(r=>finished(r.id)).length} of ${batch.rows.length} finished`;};
  const renderProposal=()=>{
    const row=batch.rows.find(r=>r.id===current),proposal=proposals?.rows.find(p=>p.id===current);el('proposal').hidden=!proposal;if(!row||!proposal)return;
    el('proposal-summary').textContent=proposal.summary;
    const list=el('proposal-events');list.replaceChildren();for(const event of proposal.events){const li=document.createElement('li');li.textContent=proposalEventText(event);list.append(li);}list.hidden=!proposal.events.length;
    const answer=answers[row.id],review=answer?.proposalRevision===proposals!.revision?answer.proposalReview:undefined;
    document.querySelectorAll<HTMLButtonElement>('[data-proposal]').forEach(b=>{b.disabled=!stories.has(row.fic);b.setAttribute('aria-pressed',String(b.dataset.proposal===review));});
    el('proposal-state').textContent=review==='agree'?'You agree. Confirm completion below after checking the whole window.':review==='disagree'?'You disagree or have changed the reading. Edit the act fields and add context below.':review==='uncertain'?'You are not sure. This window remains unfinished.':answer?.proposalRevision?'Your saved decision concerns an earlier proposal. Check this version; your answer is preserved.':answer?.verdict?'Your saved answer is preserved. You have not rated this proposal.':'No agreement recorded yet.';
  };
  const update=(patch:Partial<SceneAnswer>,invalidate=false)=>{
    const row=batch.rows.find(r=>r.id===current);if(!row||!stories.has(row.fic))return;
    const old=answers[row.id];
    answers[row.id]={...(old??emptyAnswer()),...(invalidate?{complete:false,...(old?.proposalReview?{proposalReview:'disagree' as const}:{} )}:{}),...patch,updatedAt:new Date().toISOString()};
    save();renderProposal();if(invalidate)el<HTMLInputElement>('complete').checked=false;
  };
  const render=()=>{
    const rows=visible();if(!rows.some(r=>r.id===current))current=rows[0]?.id;
    const row=rows.find(r=>r.id===current);el('card').hidden=!row;el('empty').hidden=!!row;save();if(!row)return;
    const source=batch.sources.find(s=>s.file===row.fic)!,paras=stories.get(row.fic),answer=answers[row.id];
    renderProposal();
    el('where').textContent=`${source.title} · ${source.wordCount.toLocaleString()} words · Window ${row.from}–${row.to}`;
    el('loaded').textContent=`${stories.size} of ${batch.sources.length} stories loaded. Text stays on this device.`;
    const root=el('passages');root.replaceChildren();
    if(!paras){const p=document.createElement('p');p.textContent=`Choose ${source.file}, or the samples ZIP containing it.`;root.append(p);}
    else {
      const from=browse===undefined?Math.max(0,row.from-(expanded?8:2)):Math.max(0,browse-8);
      const to=browse===undefined?Math.min(paras.length-1,row.to+(expanded?8:2)):Math.min(paras.length-1,browse+8);
      for(let i=from;i<=to;i++){const p=document.createElement('p'),n=document.createElement('span');n.className='number';n.textContent=String(i);p.className=i>=row.from&&i<=row.to?'focus':'dim';p.append(n,document.createTextNode(paras[i]));root.append(p);}
    }
    el('more').textContent=expanded?'Less context':'More context';
    el<HTMLInputElement>('passage-number').value=String(browse??row.from);el<HTMLInputElement>('passage-number').max=String(source.paragraphCount-1);
    document.querySelectorAll<HTMLButtonElement>('[data-answer]').forEach(b=>{b.disabled=!paras;b.setAttribute('aria-pressed',String(b.dataset.answer===answer?.verdict));});
    el('act-section').hidden=answer?.verdict!=='acts';
    const events=el('events');events.replaceChildren();
    for(const [index,event] of (answer?.events??[]).entries()){
      const field=document.createElement('fieldset'),legend=document.createElement('legend'),grid=document.createElement('div');legend.textContent=`Act ${index+1}`;grid.className='event-grid';field.append(legend,grid);
      const change=(patch:Partial<SceneEvent>)=>{const values=answers[row.id].events.map((e,i)=>i===index?{...e,...patch}:e);update({events:values},true);};
      const select=(label:string,key:'act'|'occurrence',values:readonly string[])=>{
        const wrap=document.createElement('label'),input=document.createElement('select');wrap.textContent=label;
        for(const value of values){const option=document.createElement('option');option.value=value;option.textContent=value||'Choose an act';input.append(option);}input.value=event[key];input.disabled=!paras;
        input.onchange=()=>change({[key]:input.value});wrap.append(input);grid.append(wrap);
      };
      select('Act','act',['',...ACTS]);select('Does it actually happen?','occurrence',OCCURRENCES);
      for(const [key,label] of [['performer','Performer / person doing it'],['receiver','Receiver / person it is done to']] as const){
        const wrap=document.createElement('label'),input=document.createElement('input'),list=document.createElement('datalist');wrap.textContent=label;input.value=event[key];input.disabled=!paras;input.placeholder=key==='receiver'?'Leave blank only for solo masturbation':'Name or Unclear';list.id=`names-${index}-${key}`;input.setAttribute('list',list.id);
        for(const name of [...source.participants,'Unclear']){const option=document.createElement('option');option.value=name;list.append(option);}input.oninput=()=>change({[key]:input.value});wrap.append(input,list);grid.append(wrap);
      }
      for(const [key,label] of [['from','Evidence start paragraph'],['to','Evidence end paragraph']] as const){const wrap=document.createElement('label'),input=document.createElement('input');wrap.textContent=label;input.type='number';input.min=String(row.from);input.max=String(row.to);input.value=String(event[key]);input.disabled=!paras;input.onchange=()=>{const n=Number(input.value),other=key==='from'?event.to:event.from;if(!Number.isInteger(n)||n<row.from||n>row.to||(key==='from'?n>other:n<other)){notice('Keep the evidence range inside the highlighted window, with start before end.');input.value=String(answers[row.id].events[index][key]);return;}change({[key]:n});render();};wrap.append(input);grid.append(wrap);}
      const remove=document.createElement('button');remove.textContent='Remove this act';remove.disabled=!paras;remove.onclick=()=>{update({events:answers[row.id].events.filter((_,i)=>i!==index)},true);render();};field.append(remove);events.append(field);
    }
    el<HTMLInputElement>('complete').checked=answer?.complete??false;el<HTMLInputElement>('complete').disabled=!paras||!answer?.verdict||answer.verdict==='uncertain';
    el<HTMLTextAreaElement>('context').value=answer?.context??'';el<HTMLTextAreaElement>('context').disabled=!paras;
    const checks=el('errors');checks.replaceChildren();for(const flag of FLAGS){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.disabled=!paras;input.checked=answer?.flags.includes(flag)??false;input.onchange=()=>{const flags=new Set(answers[row.id]?.flags??[]);input.checked?flags.add(flag):flags.delete(flag);update({flags:[...flags]});};label.append(input,document.createTextNode(flag));checks.append(label);}
    for(const id of ['more','add-act','clear','go-passage','earlier-passages','later-passages','return-window','passage-number'])(el(id) as HTMLButtonElement).disabled=!paras;
    const at=rows.indexOf(row);el<HTMLButtonElement>('previous').disabled=at===0;el<HTMLButtonElement>('next').disabled=at===rows.length-1;el('position').textContent=`${at+1} of ${rows.length}`;
  };
  const move=(step:number)=>{const rows=visible(),next=rows[rows.findIndex(r=>r.id===current)+step];if(next){current=next.id;browse=undefined;expanded=false;render();el('card').scrollIntoView?.({block:'start'});}};
  const loadFiles=async(files:{name:string;arrayBuffer:()=>Promise<ArrayBuffer>}[])=>{
    if(loading)return;loading=true;el<HTMLInputElement>('stories').disabled=true;let matched=0;const errors:string[]=[];
    for(const file of files)try{el('loaded').textContent=`Reading ${file.name}…`;for await(const bytes of storyBytes(file)){const found=await verifyStory(bytes,batch.sources);if(found){stories.set(found.source.file,found.paras);matched++;}}}catch(error){errors.push(error instanceof Error?error.message:'A file could not be read.');}
    loading=false;el<HTMLInputElement>('stories').disabled=false;render();notice(errors.length?errors.join(' '):matched?'Stories loaded. Saved answers are unchanged.':'No matching story versions. Choose the original samples ZIP or listed HTML files.');
  };
  const payload=()=>({schema:batch.schema,batchId:batch.batchId,referenceCommit:batch.referenceCommit,...(proposals?{reviewMode:'proposal-assisted',proposalRevision:proposals.revision}:{}),exportedAt:new Date().toISOString(),answers:batch.rows.filter(r=>answers[r.id]).map(r=>({...r,sourceSha:batch.sources.find(s=>s.file===r.fic)!.sourceSha,...answers[r.id]}))});
  const file=()=>new File([JSON.stringify(payload(),null,2)],'missed-scene-review-answers.json',{type:'application/json'});
  el<HTMLInputElement>('stories').onchange=()=>{void loadFiles(Array.from(el<HTMLInputElement>('stories').files??[]));};
  document.querySelectorAll<HTMLButtonElement>('[data-proposal]').forEach(b=>b.onclick=()=>{
    const proposal=proposals?.rows.find(p=>p.id===current);if(!proposal)return;
    const choice=b.dataset.proposal as SceneAnswer['proposalReview'],old=answers[current!];
    const copy={verdict:proposal.verdict,events:proposal.events.map(e=>({...e})),flags:[...new Set([...(old?.flags??[]),...proposal.flags])]};
    update({...((choice==='agree'||(choice==='disagree'&&!old?.verdict))?copy:{}),...(choice==='uncertain'?{verdict:'uncertain' as const}:{}),complete:false,proposalReview:choice,proposalRevision:proposals!.revision});render();
  });
  document.querySelectorAll<HTMLButtonElement>('[data-answer]').forEach(b=>b.onclick=()=>{const verdict=b.dataset.answer as SceneAnswer['verdict'];const row=batch.rows.find(r=>r.id===current)!;update({verdict,...(verdict==='none'?{events:[]}:verdict==='acts'&&!answers[row.id]?.events.length?{events:[{act:'',occurrence:OCCURRENCES[0],performer:'',receiver:'',from:row.from,to:row.to}]}:{})},true);render();});
  el('add-act').onclick=()=>{const row=batch.rows.find(r=>r.id===current)!;update({events:[...(answers[row.id]?.events??[]),{act:'',occurrence:OCCURRENCES[0],performer:'',receiver:'',from:row.from,to:row.to}]},true);render();};
  el<HTMLInputElement>('complete').onchange=()=>{const a=answers[current!];if(el<HTMLInputElement>('complete').checked&&a.verdict==='acts'&&(!a.events.length||!a.events.every(eventComplete))){el<HTMLInputElement>('complete').checked=false;notice('Choose each act and name its participants (or enter Unclear) before finishing.');return;}update({complete:el<HTMLInputElement>('complete').checked});render();};
  el<HTMLTextAreaElement>('context').oninput=()=>update({context:el<HTMLTextAreaElement>('context').value});
  el('previous').onclick=()=>move(-1);el('next').onclick=()=>move(1);el('more').onclick=()=>{expanded=!expanded;browse=undefined;render();};
  const jump=(number:number)=>{const row=batch.rows.find(r=>r.id===current)!;if(Number.isFinite(number))browse=Math.max(0,Math.min(Math.trunc(number),batch.sources.find(s=>s.file===row.fic)!.paragraphCount-1));render();};
  el('go-passage').onclick=()=>jump(Number(el<HTMLInputElement>('passage-number').value));el('earlier-passages').onclick=()=>jump((browse??batch.rows.find(r=>r.id===current)!.from)-16);el('later-passages').onclick=()=>jump((browse??batch.rows.find(r=>r.id===current)!.to)+16);el('return-window').onclick=()=>{browse=undefined;render();};
  el<HTMLSelectElement>('filter').onchange=()=>{current=undefined;browse=undefined;render();};
  el('next-unanswered').onclick=()=>{const at=batch.rows.findIndex(r=>r.id===current),next=[...batch.rows.slice(at+1),...batch.rows.slice(0,at+1)].find(r=>!finished(r.id));if(next){el<HTMLSelectElement>('filter').value='unanswered';current=next.id;browse=undefined;expanded=false;render();}else notice('Every window is finished.');};
  el('clear').onclick=()=>{if(current)delete answers[current];save();render();};
  el('export').onclick=()=>{const url=URL.createObjectURL(file()),a=document.createElement('a');a.href=url;a.download='missed-scene-review-answers.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Answers exported. Send the JSON back for comparison.');};
  if(navigator.share&&navigator.canShare){el('share').hidden=false;el('share').onclick=async()=>{const f=file();if(!navigator.canShare({files:[f]})){notice('Use Export my answers.');return;}try{await navigator.share({files:[f],title:'Missed-scene review answers'});}catch(error){if(!(error instanceof Error&&error.name==='AbortError'))notice('Sharing is unavailable. Use Export my answers.');}};}
  const importPayload=(p:unknown)=>{const imported:Record<string,SceneAnswer>={};importSceneAnswers(batch,p,imported);
    for(const [id,a] of Object.entries(imported)){const proposal=proposals?.rows.find(r=>r.id===id);if(a.proposalReview==='agree'&&a.proposalRevision===proposals?.revision&&proposal&&!sameProposalReading(a,proposal))throw Error('An agreement contains changes to the proposed reading. Mark it Disagree / correct instead.');}
    const n=importSceneAnswers(batch,p,answers);save();render();return n;};
  el<HTMLInputElement>('answers-file').onchange=async()=>{const f=el<HTMLInputElement>('answers-file').files?.[0];if(!f)return;try{notice(`${importPayload(JSON.parse(await f.text()))} answers imported; newer answers preserved.`);}catch(error){notice(error instanceof Error?error.message:'Answers could not be imported.');}el<HTMLInputElement>('answers-file').value='';};
  el('needed').replaceChildren();for(const source of batch.sources){const li=document.createElement('li');li.textContent=`${source.title} — ${source.file}`;el('needed').append(li);}render();
  return {answers,loadFiles,payload,move,render,import:importPayload};
}
