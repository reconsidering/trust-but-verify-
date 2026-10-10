"""Standalone charts from the fixed-denominator report; requires matplotlib."""
import csv, json, sys, os
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
os.environ.setdefault('MPLCONFIGDIR', '/tmp/fixed-review-matplotlib')
os.environ.setdefault('XDG_CACHE_HOME', '/tmp/fixed-review-font-cache')
Path(os.environ['XDG_CACHE_HOME']).mkdir(parents=True, exist_ok=True)
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

source = Path(sys.argv[1])
out = Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
r = json.loads(source.read_text())
runs = r['runs']
labels = [datetime.fromisoformat(v['date'].replace('Z', '+00:00')).astimezone(ZoneInfo('America/New_York')).strftime('%b %d')+'\n'+v['ref'][:7] for v in runs]
colors = {'Owner':'#1764ab', 'Claude':'#8456a7', 'ChatGPT':'#dc7c16', 'Both':'#288250'}
plt.rcParams.update({'font.family':'DejaVu Sans', 'font.size':10, 'axes.spines.top':False, 'axes.spines.right':False})
acts = ['All reviewed entries'] + [a['act'] for a in runs[0]['summary'] if a['expected']]
short = {'Anal penetration (penis)':'Penile anal contact', 'Vaginal penetration (penis)':'Vaginal sex', 'Toy insertion':'Toy acts'}
fig, axes = plt.subplots(3, 3, figsize=(15,12), constrained_layout=True)
rows = []
for ax, act in zip(axes.flat, acts):
    for group in r['reviewerGroups']:
        values=[]
        for v in runs:
            a = v['byReviewer'][group]
            a = a if act == 'All reviewed entries' else [x for x in a if x['act']==act]
            n=sum(x['expected'] for x in a); k=sum(x['matched'] for x in a)
            values.append(100*k/n if n else float('nan'))
            rows.append([v['ref'],v['date'],group,act,n,k,'' if not n else k/n])
        if n:ax.plot(range(len(runs)),values,marker='o',color=colors[group],label=f'{group} (n={n})',linewidth=2)
    ax.set_title(short.get(act,act));ax.set_ylim(-3,103);ax.set_xticks(range(len(runs)), labels,fontsize=8)
    ax.grid(axis='y',alpha=.22);ax.set_ylabel('Correct act + people (%)');ax.legend(fontsize=8,loc='best')
for ax in list(axes.flat)[len(acts):]:ax.set_visible(False)
fig.suptitle('Detection coverage on one fixed review set\nOwner / ChatGPT / Both; Claude independent recall: no inventory data',fontsize=17)
fig.savefig(out/'fixed-review-recall-history.png',dpi=180)
fig.savefig(out/'fixed-review-recall-history.pdf')
plt.close(fig)
with (out/'fixed-review-recall-history.csv').open('w') as f:
    w=csv.writer(f,lineterminator="\n");w.writerow(['engine','commit_date','reviewer','act','expected','correct','recall']);w.writerows(rows)

fig, axes=plt.subplots(1,3,figsize=(15,5.5),constrained_layout=True)
keys=[('wrongParticipants','Different participants at citation'),('wrongAct','Different act at citation'),('missed','No corresponding reading')]
for ax,(key,title) in zip(axes,keys):
    for group in r['reviewerGroups']:
        totals=[sum(a['expected'] for a in v['byReviewer'][group]) for v in runs]
        if totals[0]:ax.plot(range(len(runs)),[100*sum(a[key] for a in v['byReviewer'][group])/n for v,n in zip(runs,totals)],marker='o',color=colors[group],label=f'{group} (n={totals[0]})')
    ax.set_title(title);ax.set_ylabel('% of fixed expected entries');ax.set_xticks(range(len(runs)),labels,fontsize=8);ax.grid(axis='y',alpha=.22);ax.set_ylim(bottom=0);ax.legend(fontsize=8)
fig.suptitle('Why expected entries are not covered\nHint-only and nearby-only are separate in the data; these classes are mutually exclusive',fontsize=14)
fig.savefig(out/'fixed-review-failure-history.png',dpi=180);fig.savefig(out/'fixed-review-failure-history.pdf');plt.close(fig)

fig,axes=plt.subplots(1,2,figsize=(13,5.5),constrained_layout=True)
for ax,(den,num,title) in zip(axes,[('accepted','covered','Previously accepted act claims covered'),('rejected','survivingRejected','Original rejected claims still produced')]):
    for group in r['reviewerGroups']:
        n=runs[0]['claimSummary'][group][den]
        if not n:continue
        values=[100*v['claimSummary'][group][num]/n for v in runs]
        ax.plot(range(len(runs)),values,marker='o',linestyle=':' if n<10 else '-',color=colors[group],label=f'{group} (n={n})')
    ax.set_title(title);ax.set_ylabel('% of fixed labelled claims');ax.set_ylim(-3,103);ax.set_xticks(range(len(runs)),labels,fontsize=8);ax.grid(axis='y',alpha=.22);ax.legend(fontsize=8)
fig.suptitle('Detection-selected claims: a separate measure from recall\nEarlier rejection labels can predate current conventions; survival does not prove a current error',fontsize=14)
fig.savefig(out/'fixed-review-claim-history.png',dpi=180);fig.savefig(out/'fixed-review-claim-history.pdf');plt.close(fig)
print('Charts and recall CSV written to',out)

# The main view scores the engine once per version across all reference sources.
fig,axes=plt.subplots(1,2,figsize=(14,5.8),constrained_layout=True)
for act in ['All reviewed entries','Anal penetration (penis)','Blowjob','Fingering']:
    values=[]
    for v in runs:
        entries=v['summary'] if act=='All reviewed entries' else [a for a in v['summary'] if a['act']==act]
        n=sum(a['expected'] for a in entries);k=sum(a['matched'] for a in entries)
        values.append(100*k/n if n else float('nan'))
    axes[0].plot(range(len(runs)),values,marker='o',linewidth=2,label=f'{short.get(act,act)} (n={n})')
axes[0].set_title('Correct act and participants inside the cited range');axes[0].set_ylabel('Engine recall (%)');axes[0].set_ylim(0,100);axes[0].legend(fontsize=9)
failures=[('missed','No corresponding reading'),('wrongParticipants','Different participants at citation'),('wrongAct','Different act at citation'),('hintOnly','Hint only'),('nearbyOnly','One paragraph away only')]
for key,label in failures:
    axes[1].plot(range(len(runs)),[sum(a[key] for a in v['summary']) for v in runs],marker='o',label=label)
axes[1].set_title('Why the engine did not cover expected entries');axes[1].set_ylabel('Entries out of the fixed 349');axes[1].set_ylim(bottom=0);axes[1].legend(fontsize=8)
for ax in axes:ax.set_xticks(range(len(runs)),labels,fontsize=8);ax.grid(axis='y',alpha=.22)
fig.suptitle('ENGINE detection performance over time\nEvery point scores one archived engine version on the same reviewed acts',fontsize=16)
fig.savefig(out/'engine-detection-over-time.png',dpi=180);fig.savefig(out/'engine-detection-over-time.pdf');plt.close(fig)
fig,axes=plt.subplots(2,4,figsize=(16,8),constrained_layout=True)
for ax,act in zip(axes.flat,acts[1:]):
    values=[next(a['recall'] for a in v['summary'] if a['act']==act)*100 for v in runs]
    n=next(a['expected'] for a in runs[0]['summary'] if a['act']==act)
    ax.plot(range(len(runs)),values,color='#1764ab',marker='o',linewidth=2)
    ax.set_title(f"{short.get(act,act)} (n={n})");ax.set_ylim(-3,103);ax.set_xticks(range(len(runs)),labels,fontsize=7);ax.grid(axis='y',alpha=.22);ax.set_ylabel('Engine recall (%)')
fig.suptitle('ENGINE recall by act — all review sources combined\nFrozen denominator for each act; reviewer-source breakdowns are supporting evidence',fontsize=15)
fig.savefig(out/'engine-per-act-over-time.png',dpi=180);fig.savefig(out/'engine-per-act-over-time.pdf');plt.close(fig)
