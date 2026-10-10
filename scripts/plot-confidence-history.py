"""Plot recorded unseen-fic confidence results; label mix varies between runs."""
import csv, json, os, re, sys
from pathlib import Path
os.environ.setdefault('MPLCONFIGDIR','/tmp/fixed-review-matplotlib')
os.environ.setdefault('XDG_CACHE_HOME','/tmp/fixed-review-font-cache')
Path(os.environ['XDG_CACHE_HOME']).mkdir(parents=True,exist_ok=True)
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
src=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
rows=[]
for line in src.read_text().splitlines():
    if not re.match(r'^\| 20\d\d-',line):continue
    cells=[c.strip() for c in line.strip('|').split('|')]
    date,counts,_,_,ll,auc,commit=cells
    if 'not recorded' in ll or 'not recorded' in auc:continue
    record_ll,context_ll=map(float,ll.split('→'));record_auc,context_auc=map(float,auc.split('→'))
    n,wrong=map(int,re.findall(r'\d+',counts.replace(',','')))
    rows.append(dict(date=date,engine=commit,labelled=n,wrong=wrong,logLoss=context_ll,auc=context_auc,recordLogLoss=record_ll,recordAuc=record_auc))
x=list(range(len(rows)));labels=[r['date'][5:]+'\n'+r['engine'] for r in rows]
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.spines.top':False,'axes.spines.right':False})
fig,axes=plt.subplots(3,1,figsize=(14,10),constrained_layout=True)
for ax,key,record,title in [(axes[0],'auc','recordAuc','Unseen-fic AUC — higher is better'),(axes[1],'logLoss','recordLogLoss','Unseen-fic log loss — lower is better')]:
    ax.plot(x,[r[key] for r in rows],marker='o',linewidth=2,label='Pattern record + context model')
    ax.plot(x,[r[record] for r in rows],marker='o',color='#888888',linestyle='--',label='Pattern record alone')
    ax.set_title(title);ax.grid(axis='y',alpha=.22);ax.legend(fontsize=9)
    for i,r in enumerate(rows):ax.annotate(f'{r[key]:.3f}',(i,r[key]),xytext=(0,8),textcoords='offset points',ha='center',fontsize=8)
axes[0].set_ylim(.48,.84);axes[1].set_ylim(.13,.41)
axes[2].plot(x,[r['labelled'] for r in rows],marker='o',color='#288250',label='Labelled detections found')
second=axes[2].twinx();second.plot(x,[100*r['wrong']/r['labelled'] for r in rows],marker='o',color='#b3423d',label='Wrong-label share')
axes[2].set_ylabel('Labelled detections');second.set_ylabel('Wrong-label share (%)');axes[2].set_title('The evaluation set changed between these runs');axes[2].grid(axis='y',alpha=.22)
axes[2].legend(loc='upper left');second.legend(loc='lower right')
for ax in axes:ax.set_xticks(x,labels,fontsize=8)
fig.suptitle('ENGINE confidence quality over recorded runs\nChanging labels and fics: these values do not isolate the effect of engine changes',fontsize=16)
fig.savefig(out/'engine-confidence-over-time.png',dpi=180);fig.savefig(out/'engine-confidence-over-time.pdf');plt.close(fig)
(out/'engine-confidence-over-time.json').write_text(json.dumps(rows,indent=2)+'\n')
with (out/'engine-confidence-over-time.csv').open('w') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator='\n');w.writeheader();w.writerows(rows)
print('Recorded unseen-fic confidence runs:',len(rows))
