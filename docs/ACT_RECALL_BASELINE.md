# Per-act recall baseline

[Machine-readable data](data/act-recall-baseline.json) · [How to rerun](ACT_RECALL.md)

Engine: 7f77a765cea99589cb8d75c4d5da67ba3da3e787. Inventory fingerprint: 4e3ae4c4a3a29f835fd9f3b2b0497b3863719399c6210d1890936ae7985418d9.

Strict inventory-event recall, not whole-corpus scene recall. A performed reading must fall inside the cited event range and have the correct act and participants. Nearby matches do not count. Hints and absent acts never become training labels. Exact duplicate events are collapsed; overlapping ranges may still describe the same scene.

Anal/finger/toy entrance contact counts under AGENTS.md; the legacy category names say penetration/insertion. This report evaluates internal surviving readings, not whether every act appears in the displayed scene list. Historical events and unsupported categories are excluded, not counted as misses.

| Act | Expected | Correct | Recall | Wrong people | Wrong act | Hint only | Nearby only | Missed | Excluded |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Anal penetration (penis) | 66 | 51 | 77.3% | 3 | 2 | 6 | 0 | 4 | 8 |
| Blowjob | 56 | 42 | 75.0% | 1 | 2 | 0 | 1 | 10 | 3 |
| Rimming | 18 | 10 | 55.6% | 2 | 3 | 0 | 0 | 3 | 2 |
| Cunnilingus | 0 | 0 | — | 0 | 0 | 0 | 0 | 0 | 0 |
| Vaginal penetration (penis) | 2 | 0 | 0.0% | 0 | 0 | 0 | 0 | 2 | 0 |
| Fingering | 63 | 38 | 60.3% | 6 | 3 | 3 | 0 | 13 | 4 |
| Toy insertion | 18 | 4 | 22.2% | 1 | 2 | 2 | 0 | 9 | 3 |
| Handjob | 80 | 31 | 38.8% | 8 | 9 | 2 | 0 | 30 | 6 |
| Solo masturbation | 57 | 20 | 35.1% | 3 | 0 | 0 | 0 | 34 | 4 |

## owner

| Act | Expected | Correct | Recall | Wrong people | Wrong act | Hint only | Nearby only | Missed | Excluded |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Anal penetration (penis) | 24 | 22 | 91.7% | 0 | 0 | 1 | 0 | 1 | 8 |
| Blowjob | 20 | 17 | 85.0% | 0 | 0 | 0 | 1 | 2 | 3 |
| Rimming | 7 | 6 | 85.7% | 0 | 1 | 0 | 0 | 0 | 2 |
| Cunnilingus | 0 | 0 | — | 0 | 0 | 0 | 0 | 0 | 0 |
| Vaginal penetration (penis) | 0 | 0 | — | 0 | 0 | 0 | 0 | 0 | 0 |
| Fingering | 20 | 14 | 70.0% | 1 | 1 | 1 | 0 | 3 | 4 |
| Toy insertion | 10 | 4 | 40.0% | 0 | 2 | 1 | 0 | 3 | 3 |
| Handjob | 26 | 10 | 38.5% | 1 | 5 | 0 | 0 | 10 | 6 |
| Solo masturbation | 22 | 9 | 40.9% | 1 | 0 | 0 | 0 | 12 | 4 |

## AI

| Act | Expected | Correct | Recall | Wrong people | Wrong act | Hint only | Nearby only | Missed | Excluded |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Anal penetration (penis) | 41 | 28 | 68.3% | 3 | 2 | 5 | 0 | 3 | 0 |
| Blowjob | 34 | 23 | 67.6% | 1 | 2 | 0 | 0 | 8 | 0 |
| Rimming | 11 | 4 | 36.4% | 2 | 2 | 0 | 0 | 3 | 0 |
| Cunnilingus | 0 | 0 | — | 0 | 0 | 0 | 0 | 0 | 0 |
| Vaginal penetration (penis) | 2 | 0 | 0.0% | 0 | 0 | 0 | 0 | 2 | 0 |
| Fingering | 41 | 23 | 56.1% | 5 | 2 | 2 | 0 | 9 | 0 |
| Toy insertion | 7 | 0 | 0.0% | 1 | 0 | 1 | 0 | 5 | 0 |
| Handjob | 51 | 20 | 39.2% | 7 | 4 | 2 | 0 | 18 | 0 |
| Solo masturbation | 33 | 9 | 27.3% | 2 | 0 | 0 | 0 | 22 | 0 |

## partial / assistant

| Act | Expected | Correct | Recall | Wrong people | Wrong act | Hint only | Nearby only | Missed | Excluded |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Anal penetration (penis) | 1 | 1 | 100.0% | 0 | 0 | 0 | 0 | 0 | 0 |
| Blowjob | 2 | 2 | 100.0% | 0 | 0 | 0 | 0 | 0 | 0 |
| Rimming | 0 | 0 | — | 0 | 0 | 0 | 0 | 0 | 0 |
| Cunnilingus | 0 | 0 | — | 0 | 0 | 0 | 0 | 0 | 0 |
| Vaginal penetration (penis) | 0 | 0 | — | 0 | 0 | 0 | 0 | 0 | 0 |
| Fingering | 2 | 1 | 50.0% | 0 | 0 | 0 | 0 | 1 | 0 |
| Toy insertion | 1 | 0 | 0.0% | 0 | 0 | 0 | 0 | 1 | 0 |
| Handjob | 3 | 1 | 33.3% | 0 | 0 | 0 | 0 | 2 | 0 |
| Solo masturbation | 2 | 2 | 100.0% | 0 | 0 | 0 | 0 | 0 | 0 |

## Events needing attention

- bluebells.html, paragraphs 812–813: Handjob; Brother Diarmuid → David Shepherd; **missed** (chatgpt-five-fic-deep-dives.json, bluebells-act-2).
- bluebells.html, paragraphs 1162–1162: Handjob; David Shepherd → Brother Diarmuid; **missed** (suspect-two-569919fdfb5e.json, T35).
- bluebells.html, paragraphs 1165–1165: Solo masturbation; David Shepherd → David Shepherd; **missed** (chatgpt-five-fic-deep-dives.json, bluebells-act-16).
- bluebells.html, paragraphs 1168–1170: Handjob; Brother Diarmuid → David Shepherd; **missed** (chatgpt-five-fic-deep-dives.json, bluebells-act-18).
- bluebells.html, paragraphs 1263–1263: Handjob; Brother Diarmuid → David Shepherd; **missed** (chatgpt-five-fic-deep-dives.json, bluebells-act-19).
- bluebells.html, paragraphs 1650–1650: Solo masturbation; David Shepherd → David Shepherd; **missed** (chatgpt-five-fic-deep-dives.json, bluebells-act-26).
- were-compeer.html, paragraphs 166–168: Toy insertion; Derek Hale → Stiles Stilinski; **hint-only** (chatgpt-five-fic-deep-dives.json, were-compeer-act-4).
- were-compeer.html, paragraphs 305–306: Handjob; Derek Hale → Stiles Stilinski; **wrong-act** (chatgpt-five-fic-deep-dives.json, were-compeer-act-15).
- were-compeer.html, paragraphs 462–462: Toy insertion; Derek Hale → Stiles Stilinski; **missed** (chatgpt-five-fic-deep-dives.json, were-compeer-act-23).
- were-compeer.html, paragraphs 473–473: Toy insertion; Stiles Stilinski → Stiles Stilinski; **missed** (chatgpt-five-fic-deep-dives.json, were-compeer-act-25).
- were-compeer.html, paragraphs 532–533: Toy insertion; Stiles Stilinski → Stiles Stilinski; **missed** (chatgpt-five-fic-deep-dives.json, were-compeer-act-26).
- were-compeer.html, paragraphs 1168–1168: Handjob; Derek Hale → Stiles Stilinski; **missed** (chatgpt-five-fic-deep-dives.json, were-compeer-act-49).
- dogbird.html, paragraphs 1284–1285: Blowjob; Evan "Buck" Buckley → Eddie Diaz; **missed** (chatgpt-five-fic-deep-dives.json, dogbird-act-20).
- dogbird.html, paragraphs 1308–1308: Solo masturbation; Evan "Buck" Buckley → Evan "Buck" Buckley; **missed** (chatgpt-five-fic-deep-dives.json, dogbird-act-27).
- dogbird.html, paragraphs 1344–1346: Fingering; Evan "Buck" Buckley → Eddie Diaz; **wrong-participants** (chatgpt-five-fic-deep-dives.json, dogbird-act-33).
- needing-the-knot.html, paragraphs 86–88: Solo masturbation; Dean Winchester → Dean Winchester; **missed** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-0).
- needing-the-knot.html, paragraphs 86–88: Toy insertion; Dean Winchester → Dean Winchester; **missed** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-1).
- needing-the-knot.html, paragraphs 118–123: Toy insertion; Dean Winchester → Dean Winchester; **missed** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-2).
- needing-the-knot.html, paragraphs 168–169: Fingering; Dean Winchester → Dean Winchester; **wrong-participants** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-8).
- needing-the-knot.html, paragraphs 213–213: Solo masturbation; Castiel → Castiel; **missed** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-11).
- needing-the-knot.html, paragraphs 603–603: Rimming; Castiel → Dean Winchester; **missed** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-16).
- needing-the-knot.html, paragraphs 606–607: Fingering; Castiel → Dean Winchester; **wrong-act** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-17).
- needing-the-knot.html, paragraphs 615–615: Handjob; Dean Winchester → Castiel; **missed** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-18).
- needing-the-knot.html, paragraphs 668–671: Handjob; Castiel → Dean Winchester; **wrong-act** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-21).
- needing-the-knot.html, paragraphs 776–778: Blowjob; Dean Winchester → Castiel; **missed** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-22).
- needing-the-knot.html, paragraphs 781–781: Rimming; Castiel → Dean Winchester; **missed** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-23).
- needing-the-knot.html, paragraphs 783–783: Fingering; Castiel → Dean Winchester; **missed** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-24).
- needing-the-knot.html, paragraphs 783–783: Blowjob; Castiel → Dean Winchester; **missed** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-25).
- needing-the-knot.html, paragraphs 1029–1038: Anal penetration (penis); Castiel → Dean Winchester; **hint-only** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-27).
- needing-the-knot.html, paragraphs 1091–1091: Blowjob; Castiel → Dean Winchester; **wrong-act** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-28).
- needing-the-knot.html, paragraphs 1091–1091: Rimming; Castiel → Dean Winchester; **wrong-act** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-29).
- needing-the-knot.html, paragraphs 1102–1104: Blowjob; Dean Winchester → Castiel; **missed** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-33).
- needing-the-knot.html, paragraphs 1109–1111: Solo masturbation; Dean Winchester → Dean Winchester; **missed** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-35).
- needing-the-knot.html, paragraphs 1132–1132: Blowjob; Castiel → Dean Winchester; **wrong-act** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-39).
- needing-the-knot.html, paragraphs 1132–1140: Anal penetration (penis); Castiel → Dean Winchester; **wrong-act** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-40).
- needing-the-knot.html, paragraphs 1132–1132: Handjob; Castiel → Dean Winchester; **wrong-act** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-41).
- needing-the-knot.html, paragraphs 1173–1173: Anal penetration (penis); Castiel → Dean Winchester; **hint-only** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-44).
- needing-the-knot.html, paragraphs 1173–1173: Handjob; Castiel → Dean Winchester; **hint-only** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-45).
- needing-the-knot.html, paragraphs 1219–1219: Rimming; Dean Winchester → Castiel; **wrong-act** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-49).
- needing-the-knot.html, paragraphs 1415–1423: Anal penetration (penis); Castiel → Dean Winchester; **hint-only** (chatgpt-five-fic-deep-dives.json, needing-the-knot-act-53).
- wicked-thing.html, paragraphs 249–249: Fingering; Obi-Wan Kenobi → Anakin Skywalker; **missed** (chatgpt-five-fic-deep-dives.json, wicked-thing-act-4).
- wicked-thing.html, paragraphs 249–251: Anal penetration (penis); Obi-Wan Kenobi → Anakin Skywalker; **missed** (chatgpt-five-fic-deep-dives.json, wicked-thing-act-5).
- wicked-thing.html, paragraphs 2152–2152: Solo masturbation; Obi-Wan Kenobi → Obi-Wan Kenobi; **missed** (chatgpt-five-fic-deep-dives.json, wicked-thing-act-18).
- wicked-thing.html, paragraphs 2152–2164: Handjob; Obi-Wan Kenobi → Anakin Skywalker; **hint-only** (chatgpt-five-fic-deep-dives.json, wicked-thing-act-19).
- wicked-thing.html, paragraphs 2156–2164: Handjob; Anakin Skywalker → Obi-Wan Kenobi; **missed** (chatgpt-five-fic-deep-dives.json, wicked-thing-act-20).
- wicked-thing.html, paragraphs 3113–3123: Anal penetration (penis); Obi-Wan Kenobi → Anakin Skywalker; **wrong-act** (chatgpt-five-fic-deep-dives.json, wicked-thing-act-27).
- lover-you-cant-be-wrong.html, paragraphs 184–208: Solo masturbation; Steve Harrington → Steve Harrington; **missed** (chatgpt-four-pdf-deep-dives.json, lover-you-cant-be-wrong-act-5).
- lover-you-cant-be-wrong.html, paragraphs 265–265: Solo masturbation; Steve Harrington → Steve Harrington; **missed** (chatgpt-four-pdf-deep-dives.json, lover-you-cant-be-wrong-act-7).
- lover-you-cant-be-wrong.html, paragraphs 296–298: Solo masturbation; Steve Harrington → Steve Harrington; **missed** (chatgpt-four-pdf-deep-dives.json, lover-you-cant-be-wrong-act-8).
- lover-you-cant-be-wrong.html, paragraphs 849–875: Fingering; Steve Harrington → Steve Harrington; **wrong-participants** (chatgpt-four-pdf-deep-dives.json, lover-you-cant-be-wrong-act-21).
- lover-you-cant-be-wrong.html, paragraphs 882–883: Solo masturbation; Steve Harrington → Steve Harrington; **missed** (chatgpt-four-pdf-deep-dives.json, lover-you-cant-be-wrong-act-31).
- lover-you-cant-be-wrong.html, paragraphs 1480–1483: Handjob; Eddie Munson → Steve Harrington; **missed** (chatgpt-four-pdf-deep-dives.json, lover-you-cant-be-wrong-act-57).
- lover-you-cant-be-wrong.html, paragraphs 1513–1550: Anal penetration (penis); Eddie Munson → Steve Harrington; **missed** (chatgpt-four-pdf-deep-dives.json, lover-you-cant-be-wrong-act-61).
- the-lathe.html, paragraphs 920–925: Blowjob; Eddie Munson → Steve Harrington; **missed** (chatgpt-four-pdf-deep-dives.json, the-lathe-act-0).
- the-lathe.html, paragraphs 923–923: Handjob; Steve Harrington → Eddie Munson; **missed** (chatgpt-four-pdf-deep-dives.json, the-lathe-act-1).
- heavyweight.html, paragraphs 2209–2213: Handjob; Dean Winchester → Castiel Novak; **wrong-participants** (chatgpt-four-pdf-deep-dives.json, heavyweight-act-12).
- heavyweight.html, paragraphs 2210–2218: Handjob; Castiel Novak → Dean Winchester; **wrong-participants** (chatgpt-four-pdf-deep-dives.json, heavyweight-act-13).
- heavyweight.html, paragraphs 2344–2349: Blowjob; Dean Winchester → Castiel Novak; **missed** (chatgpt-four-pdf-deep-dives.json, heavyweight-act-18).
- heavyweight.html, paragraphs 3226–3226: Solo masturbation; Castiel → Castiel; **missed** (chatgpt-four-pdf-deep-dives.json, heavyweight-act-37).
- heavyweight.html, paragraphs 3585–3585: Handjob; Castiel → Dean Winchester; **missed** (chatgpt-four-pdf-deep-dives.json, heavyweight-act-45).
- heavyweight.html, paragraphs 4247–4251: Rimming; Castiel → Dean Winchester; **missed** (chatgpt-four-pdf-deep-dives.json, heavyweight-act-64).
- wretched-rhetoric.html, paragraphs 171–181: Solo masturbation; Anakin Skywalker → Anakin Skywalker; **missed** (chatgpt-four-pdf-deep-dives.json, wretched-rhetoric-act-2).
- wretched-rhetoric.html, paragraphs 644–657: Fingering; Obi-Wan Kenobi → Anakin Skywalker; **missed** (chatgpt-four-pdf-deep-dives.json, wretched-rhetoric-act-10).
- wretched-rhetoric.html, paragraphs 657–662: Rimming; Obi-Wan Kenobi → Anakin Skywalker; **wrong-participants** (chatgpt-four-pdf-deep-dives.json, wretched-rhetoric-act-11).
- wretched-rhetoric.html, paragraphs 897–897: Blowjob; Obi-Wan Kenobi → Anakin Skywalker; **missed** (chatgpt-four-pdf-deep-dives.json, wretched-rhetoric-act-20).
- wretched-rhetoric.html, paragraphs 899–901: Rimming; Obi-Wan Kenobi → Anakin Skywalker; **wrong-participants** (chatgpt-four-pdf-deep-dives.json, wretched-rhetoric-act-21).
- wretched-rhetoric.html, paragraphs 899–900: Fingering; Obi-Wan Kenobi → Anakin Skywalker; **hint-only** (chatgpt-four-pdf-deep-dives.json, wretched-rhetoric-act-22).
- wretched-rhetoric.html, paragraphs 909–920: Anal penetration (penis); Obi-Wan Kenobi → Anakin Skywalker; **hint-only** (chatgpt-four-pdf-deep-dives.json, wretched-rhetoric-act-24).
- wretched-rhetoric.html, paragraphs 1027–1036: Anal penetration (penis); Obi-Wan Kenobi → Anakin Skywalker; **wrong-participants** (chatgpt-four-pdf-deep-dives.json, wretched-rhetoric-act-29).
- wretched-rhetoric.html, paragraphs 1034–1035: Handjob; Obi-Wan Kenobi → Anakin Skywalker; **missed** (chatgpt-four-pdf-deep-dives.json, wretched-rhetoric-act-30).
- wretched-rhetoric.html, paragraphs 605–605: Fingering; Obi-Wan Kenobi → Anakin Skywalker; **missed** (chatgpt-four-pdf-deep-dives.json, wretched-rhetoric-act-34).
- foxden-park.html, paragraphs 1117–1118: Fingering; Alex Claremont-Diaz → Henry Fox-Mountchristen-Windsor; **wrong-act** (chatgpt-foxden-park-deep-dive.json, foxden-park-act-28).
- foxden-park.html, paragraphs 1133–1144: Fingering; Alex Claremont-Diaz → Henry Fox-Mountchristen-Windsor; **missed** (chatgpt-foxden-park-deep-dive.json, foxden-park-act-32).
- foxden-park.html, paragraphs 1331–1332: Fingering; Alex Claremont-Diaz → Henry Fox-Mountchristen-Windsor; **missed** (chatgpt-foxden-park-deep-dive.json, foxden-park-act-39).
- foxden-park.html, paragraphs 1334–1338: Fingering; Alex Claremont-Diaz → Henry Fox-Mountchristen-Windsor; **missed** (chatgpt-foxden-park-deep-dive.json, foxden-park-act-41).
- icarus-burning.html, paragraphs 2171–2171: Handjob; Samiel Tremark → Jason Lane; **wrong-participants** (chatgpt-icarus-burning-deep-dive.json, icarus-burning-act-3).
- icarus-burning.html, paragraphs 3226–3231: Handjob; Samiel Tremark → Jason Lane; **wrong-participants** (chatgpt-icarus-burning-deep-dive.json, icarus-burning-act-10).
- icarus-burning.html, paragraphs 3279–3284: Handjob; Samiel Tremark → Jason Lane; **wrong-participants** (chatgpt-icarus-burning-deep-dive.json, icarus-burning-act-19).
- icarus-burning.html, paragraphs 3293–3294: Handjob; Samiel Tremark → Jason Lane; **wrong-participants** (chatgpt-icarus-burning-deep-dive.json, icarus-burning-act-21).
- icarus-burning.html, paragraphs 3311–3311: Fingering; Samiel Tremark → Jason Lane; **missed** (chatgpt-icarus-burning-deep-dive.json, icarus-burning-act-23).
- icarus-burning.html, paragraphs 3322–3323: Anal penetration (penis); Samiel Tremark → Jason Lane; **wrong-participants** (chatgpt-icarus-burning-deep-dive.json, icarus-burning-act-25).
- icarus-burning.html, paragraphs 8005–8009: Handjob; Jason Lane → Samiel Tremark; **missed** (chatgpt-icarus-burning-deep-dive.json, icarus-burning-act-36).
- icarus-burning.html, paragraphs 8026–8029: Solo masturbation; Jason Lane → self; **missed** (chatgpt-icarus-burning-deep-dive.json, icarus-burning-act-41).
- icarus-burning.html, paragraphs 8032–8034: Handjob; Jason Lane → Samiel Tremark; **wrong-participants** (chatgpt-icarus-burning-deep-dive.json, icarus-burning-act-42).
- icarus-burning.html, paragraphs 8037–8040: Fingering; Jason Lane → Jason Lane; **wrong-participants** (chatgpt-icarus-burning-deep-dive.json, icarus-burning-act-43).
- icarus-burning.html, paragraphs 8055–8068: Solo masturbation; Jason Lane → self; **wrong-participants** (chatgpt-icarus-burning-deep-dive.json, icarus-burning-act-45).
- icarus-burning.html, paragraphs 8062–8062: Handjob; Samiel Tremark → Jason Lane; **missed** (chatgpt-icarus-burning-deep-dive.json, icarus-burning-act-46).
- icarus-burning.html, paragraphs 8065–8070: Anal penetration (penis); Samiel Tremark → Jason Lane; **missed** (chatgpt-icarus-burning-deep-dive.json, icarus-burning-act-47).
- panuelo-melody.html, paragraphs 1572–1575: Solo masturbation; Henry Fox-Mountchristen-Windsor → self; **missed** (chatgpt-panuelo-melody-deep-dive.json, panuelo-melody-act-18).
- panuelo-melody.html, paragraphs 1715–1717: Handjob; Alex Claremont-Diaz → Henry Fox-Mountchristen-Windsor; **missed** (chatgpt-panuelo-melody-deep-dive.json, panuelo-melody-act-20).
- panuelo-melody.html, paragraphs 1786–1786: Anal penetration (penis); Alex Claremont-Diaz → Henry Fox-Mountchristen-Windsor; **hint-only** (chatgpt-panuelo-melody-deep-dive.json, panuelo-melody-act-23).
- apogee.html, paragraphs 823–831: Handjob; Shane Hollander → Ilya Rozanov; **missed** (chatgpt-six-upload-deep-dives.json, apogee-inv-9).
- dog-roses.html, paragraphs 143–152: Blowjob; Corbin → Lauchlan; **wrong-participants** (chatgpt-six-upload-deep-dives.json, roses-activity-008).
- dog-roses.html, paragraphs 143–145: Handjob; Corbin → Lauchlan; **missed** (chatgpt-six-upload-deep-dives.json, roses-activity-009).
- dog-roses.html, paragraphs 148–150: Solo masturbation; Corbin → Corbin; **missed** (chatgpt-six-upload-deep-dives.json, roses-activity-010).
- dog-roses.html, paragraphs 143–152: Handjob; Corbin Scargill → Lauchlan Huxley; **wrong-act** (chatgpt-six-upload-deep-dives.json, roses-qa-inv-0).
- wolfbird.html, paragraphs 793–814: Solo masturbation; Shane Hollander → Shane Hollander; **missed** (chatgpt-six-upload-deep-dives.json, wolfbird-primary-inv-5).
- wolfbird.html, paragraphs 1093–1105: Vaginal penetration (penis); Ilya Rozanov → Renée; **missed** (chatgpt-six-upload-deep-dives.json, wolfbird-primary-inv-8).
- wolfbird.html, paragraphs 1143–1146: Blowjob; Mr. Thompson → Ilya Rozanov; **missed** (chatgpt-six-upload-deep-dives.json, wolfbird-primary-inv-12).
- wolfbird.html, paragraphs 1154–1154: Anal penetration (penis); Ilya Rozanov → unnamed rope client; **wrong-participants** (chatgpt-six-upload-deep-dives.json, wolfbird-primary-inv-14).
- wolfbird.html, paragraphs 1429–1432: Handjob; Ilya Rozanov → Shane Hollander; **missed** (chatgpt-six-upload-deep-dives.json, wolfbird-primary-inv-19).
- wolfbird.html, paragraphs 1558–1585: Solo masturbation; Shane Hollander → Shane Hollander; **missed** (chatgpt-six-upload-deep-dives.json, wolfbird-primary-inv-23).
- wolfbird.html, paragraphs 1889–1889: Fingering; Ilya Rozanov → Claire; **missed** (chatgpt-six-upload-deep-dives.json, wolfbird-primary-inv-28).
- wolfbird.html, paragraphs 2264–2266: Solo masturbation; Shane Hollander → Shane Hollander; **missed** (chatgpt-six-upload-deep-dives.json, wolfbird-primary-inv-32).
- wolfbird.html, paragraphs 2341–2380: Solo masturbation; Shane Hollander → Shane Hollander; **wrong-participants** (chatgpt-six-upload-deep-dives.json, wolfbird-primary-inv-33).
- wolfbird.html, paragraphs 2580–2714: Solo masturbation; Shane Hollander → Shane Hollander; **missed** (chatgpt-six-upload-deep-dives.json, wolfbird-primary-inv-35).
- wolfbird.html, paragraphs 2590–2707: Solo masturbation; Ilya Rozanov → Ilya Rozanov; **missed** (chatgpt-six-upload-deep-dives.json, wolfbird-primary-inv-36).
- wolfbird.html, paragraphs 2638–2643: Fingering; Shane Hollander → Shane Hollander; **wrong-participants** (chatgpt-six-upload-deep-dives.json, wolfbird-primary-inv-37).
- wolfbird.html, paragraphs 2648–2714: Toy insertion; Shane Hollander → Shane Hollander; **wrong-participants** (chatgpt-six-upload-deep-dives.json, wolfbird-primary-inv-38).
- wolfbird.html, paragraphs 2953–2957: Handjob; Ilya Rozanov → Shane Hollander; **missed** (chatgpt-six-upload-deep-dives.json, wolfbird-qa-inv-0).
- wolfbird.html, paragraphs 4152–4153: Solo masturbation; Shane Hollander → Shane Hollander; **missed** (chatgpt-six-upload-deep-dives.json, wolfbird-qa-inv-8).
- wolfbird.html, paragraphs 4291–4291: Handjob; unnamed adult woman → Ilya Rozanov; **missed** (chatgpt-six-upload-deep-dives.json, wolfbird-qa-inv-9).
- wolfbird.html, paragraphs 4296–4296: Vaginal penetration (penis); Ilya Rozanov → unnamed adult woman; **missed** (chatgpt-six-upload-deep-dives.json, wolfbird-qa-inv-10).
- wolfbird.html, paragraphs 4484–4485: Fingering; Ilya Rozanov → Shane Hollander; **hint-only** (chatgpt-six-upload-deep-dives.json, wolfbird-qa-inv-14).
- on-my-mind.html, paragraphs 242–242: Handjob; Alex Claremont-Diaz → Henry Hanover-Stuart-Fox; **missed** (missed-2051db5b4e06-partial.json, M14).
- belonging.html, paragraphs 1152–1155: Fingering; Castiel → Dean Winchester; **missed** (missed-2051db5b4e06-partial.json, M26).
- belonging.html, paragraphs 1152–1155: Handjob; Castiel → Dean Winchester; **missed** (missed-2051db5b4e06-partial.json, M26).
- belonging.html, paragraphs 1162–1163: Toy insertion; Dean Winchester → Dean Winchester; **missed** (missed-2051db5b4e06-partial.json, M26).
- rwrb-balls.html, paragraphs 128–128: Blowjob; Henry Fox-Mountchristen-Windsor → Alex Claremont-Diaz; **nearby-only** (missed-2051db5b4e06.json, M1).
- on-my-mind.html, paragraphs 192–194: Solo masturbation; Henry Hanover-Stuart-Fox → self; **missed** (missed-2051db5b4e06.json, M3).
- a-la-carte.html, paragraphs 1935–1935: Fingering; Anakin Skywalker → Anakin Skywalker; **source-unverified** (missed-2051db5b4e06.json, M7).
- innocent-until.html, paragraphs 1234–1234: Toy insertion; James "Bucky" Barnes → Steve Rogers; **missed** (missed-2051db5b4e06.json, M10).
- innocent-until.html, paragraphs 1686–1689: Handjob; James "Bucky" Barnes → Steve Rogers; **missed** (missed-2051db5b4e06.json, M17).
- innocent-until.html, paragraphs 1693–1695: Toy insertion; James "Bucky" Barnes → Steve Rogers; **missed** (missed-2051db5b4e06.json, M17).
- dogbird.html, paragraphs 1328–1328: Handjob; Evan "Buck" Buckley → Eddie Diaz; **wrong-act** (missed-2051db5b4e06.json, M19).
- lightning.html, paragraphs 5407–5407: Blowjob; Evan "Buck" Buckley → Eddie Diaz; **missed** (missed-2051db5b4e06.json, M30).
- rwrb-balls.html, paragraphs 264–264: Handjob; Henry Fox-Mountchristen-Windsor → Alex Claremont-Diaz; **missed** (missed-2051db5b4e06.json, M34).
- rwrb-balls.html, paragraphs 264–270: Anal penetration (penis); Alex Claremont-Diaz → Henry Fox-Mountchristen-Windsor; **missed** (missed-2051db5b4e06.json, M34).
- belonging.html, paragraphs 4279–4279: Toy insertion; Castiel (Supernatural) → Dean Winchester; **needs-adjudication** (missed-2051db5b4e06.json, M35).
- tricks-of-the-trade.html, paragraphs 2935–2935: Handjob; Unnamed adult audience member → Another unnamed adult audience member; **missed** (missed-2051db5b4e06.json, M36).
- lightning.html, paragraphs 5632–5647: Handjob; Evan "Buck" Buckley → Eddie Diaz; **missed** (missed-2051db5b4e06.json, M37).
- new-bitch.html, paragraphs 2658–2669: Solo masturbation; Laurent → self; **source-unverified** (new-bitch-errors-b91edd7-v1.json, W7).
- new-bitch.html, paragraphs 6321–6324: Rimming; Damen → Laurent; **source-unverified** (new-bitch-errors-b91edd7-v1.json, W16).
- sugar-alpha.html, paragraphs 219–228: Blowjob; Isaac Lahey → Peter Hale; **missed** (sugar-alpha-errors-b91edd7-v1.json, W4).
- sugar-alpha.html, paragraphs 849–849: Toy insertion; Stiles Stilinski → Stiles Stilinski; **missed** (sugar-alpha-errors-b91edd7-v1.json, W19).
- sugar-alpha.html, paragraphs 849–851: Solo masturbation; Stiles Stilinski → self; **missed** (sugar-alpha-errors-b91edd7-v1.json, W19).
- sugar-alpha.html, paragraphs 850–850: Fingering; Stiles Stilinski → Stiles Stilinski; **missed** (sugar-alpha-errors-b91edd7-v1.json, W19).
- sugar-alpha.html, paragraphs 1760–1761: Fingering; Stiles Stilinski → Stiles Stilinski; **missed** (sugar-alpha-errors-b91edd7-v1.json, W29).
- sugar-alpha.html, paragraphs 1831–1843: Toy insertion; Derek Hale → Stiles Stilinski; **wrong-act** (sugar-alpha-errors-b91edd7-v1.json, W33).
- sugar-alpha.html, paragraphs 2050–2050: Toy insertion; Derek Hale → Stiles Stilinski; **hint-only** (sugar-alpha-errors-b91edd7-v1.json, W36).
- sugar-alpha.html, paragraphs 371–371: Solo masturbation; Stiles Stilinski → self; **missed** (suspect-three-4dd3a27d25b0.json, U10).
- new-bitch.html, paragraphs 4723–4725: Handjob; Damen → Laurent; **source-unverified** (suspect-three-4dd3a27d25b0.json, U11).
- new-bitch.html, paragraphs 4728–4730: Fingering; Damen → Laurent; **source-unverified** (suspect-three-4dd3a27d25b0.json, U11).
- hate.html, paragraphs 327–327: Solo masturbation; Steve Harrington → self; **missed** (suspect-three-4dd3a27d25b0.json, U12).
- new-bitch.html, paragraphs 6421–6424: Anal penetration (penis); Damen → Laurent; **source-unverified** (suspect-three-4dd3a27d25b0.json, U14).
- new-bitch.html, paragraphs 6300–6303: Handjob; Damen → Laurent; **source-unverified** (suspect-three-4dd3a27d25b0.json, U19).
- new-bitch.html, paragraphs 1961–1963: Blowjob; Damen → Laurent; **source-unverified** (suspect-three-4dd3a27d25b0.json, U25).
- please.html, paragraphs 2227–2229: Handjob; Eddie Munson → Steve Harrington; **wrong-act** (suspect-three-4dd3a27d25b0.json, U27).
- sugar-alpha.html, paragraphs 1738–1743: Rimming; Derek Hale → Stiles Stilinski; **wrong-act** (suspect-three-4dd3a27d25b0.json, U28).
- sugar-alpha.html, paragraphs 1840–1843: Toy insertion; Derek Hale → Stiles Stilinski; **wrong-act** (suspect-three-4dd3a27d25b0.json, U29).
- jacks.html, paragraphs 3509–3515: Anal penetration (penis); Dracula → Jack Seward; **source-unverified** (suspect-three-4dd3a27d25b0.json, U35).
- found-in-the-upside-down.html, paragraphs 2903–2903: Fingering; Steve Harrington → Billy Hargrove; **wrong-participants** (suspect-three-4dd3a27d25b0.json, U36).
- ethan.html, paragraphs 3235–3236: Handjob; Ethan Barnes → Hank; **missed** (suspect-three-4dd3a27d25b0.json, U38).
- jacks.html, paragraphs 6008–6009: Fingering; Jack Seward → Dracula; **source-unverified** (suspect-three-4dd3a27d25b0.json, U44).
- belonging.html, paragraphs 4985–4985: Handjob; Castiel → Dean Winchester; **missed** (suspect-three-4dd3a27d25b0.json, U47).
- jacks.html, paragraphs 3750–3755: Anal penetration (penis); Dracula → Jack Seward; **source-unverified** (suspect-three-4dd3a27d25b0.json, U49).
- jacks.html, paragraphs 3753–3753: Solo masturbation; Jack Seward → self; **source-unverified** (suspect-three-4dd3a27d25b0.json, U49).
- jacks.html, paragraphs 2786–2791: Anal penetration (penis); Dracula → Jack Seward; **source-unverified** (suspect-three-4dd3a27d25b0.json, U50).
- jacks.html, paragraphs 6955–6991: Anal penetration (penis); Dracula → Jack Seward; **source-unverified** (suspect-two-569919fdfb5e.json, T1).
- jacks.html, paragraphs 6982–6982: Handjob; Dracula → Jack Seward; **source-unverified** (suspect-two-569919fdfb5e.json, T1).
- jacks.html, paragraphs 6930–6932: Solo masturbation; Jack Seward → self; **source-unverified** (suspect-two-569919fdfb5e.json, T1).
- belonging.html, paragraphs 1035–1045: Solo masturbation; Dean Winchester → self; **missed** (suspect-two-569919fdfb5e.json, T5).
- more-views.html, paragraphs 556–565: Handjob; Dean Winchester → Castiel; **wrong-participants** (suspect-two-569919fdfb5e.json, T7).
- more-views.html, paragraphs 576–579: Handjob; Castiel → Dean Winchester; **wrong-act** (suspect-two-569919fdfb5e.json, T7).
- innocent-until.html, paragraphs 4104–4104: Handjob; Steve Rogers → James "Bucky" Barnes; **missed** (suspect-two-569919fdfb5e.json, T8).
- jacks.html, paragraphs 7799–7829: Anal penetration (penis); Dracula → Jack Seward; **source-unverified** (suspect-two-569919fdfb5e.json, T10).
- jacks.html, paragraphs 7813–7813: Handjob; Dracula → Jack Seward; **source-unverified** (suspect-two-569919fdfb5e.json, T10).
- jacks.html, paragraphs 4743–4743: Handjob; Jack Seward → Dracula; **source-unverified** (suspect-two-569919fdfb5e.json, T15).
- jacks.html, paragraphs 4748–4774: Anal penetration (penis); Dracula → Jack Seward; **source-unverified** (suspect-two-569919fdfb5e.json, T15).
- jacks.html, paragraphs 4751–4757: Solo masturbation; Jack Seward → self; **source-unverified** (suspect-two-569919fdfb5e.json, T15).
- innocent-until.html, paragraphs 4816–4837: Handjob; James "Bucky" Barnes → Steve Rogers; **wrong-act** (suspect-two-569919fdfb5e.json, T16).
- innocent-until.html, paragraphs 4876–4885: Solo masturbation; Steve Rogers → self; **missed** (suspect-two-569919fdfb5e.json, T16).
- innocent-until.html, paragraphs 4889–4889: Fingering; James "Bucky" Barnes → Steve Rogers; **missed** (suspect-two-569919fdfb5e.json, T16).
- innocent-until.html, paragraphs 4889–4895: Anal penetration (penis); James "Bucky" Barnes → Steve Rogers; **hint-only** (suspect-two-569919fdfb5e.json, T16).
- jacks.html, paragraphs 6053–6061: Blowjob; Jack Seward → Dracula; **source-unverified** (suspect-two-569919fdfb5e.json, T17).
- jacks.html, paragraphs 6053–6054: Fingering; Jack Seward → Dracula; **source-unverified** (suspect-two-569919fdfb5e.json, T17).
- tricks-of-the-trade.html, paragraphs 3757–3757: Solo masturbation; Castiel → self; **missed** (suspect-two-569919fdfb5e.json, T18).
- rwrb-balls.html, paragraphs 194–194: Solo masturbation; Henry Fox-Mountchristen-Windsor → self; **missed** (suspect-two-569919fdfb5e.json, T20).
- jacks.html, paragraphs 9061–9064: Blowjob; Dracula → Jack Seward; **source-unverified** (suspect-two-569919fdfb5e.json, T22).
- jacks.html, paragraphs 9065–9067: Rimming; Dracula → Jack Seward; **source-unverified** (suspect-two-569919fdfb5e.json, T22).
- jacks.html, paragraphs 9075–9084: Anal penetration (penis); Dracula → Jack Seward; **source-unverified** (suspect-two-569919fdfb5e.json, T22).
- jacks.html, paragraphs 9078–9080: Handjob; Dracula → Jack Seward; **source-unverified** (suspect-two-569919fdfb5e.json, T22).
- tricks-of-the-trade.html, paragraphs 2271–2271: Toy insertion; Castiel → Dean Winchester; **needs-adjudication** (suspect-two-569919fdfb5e.json, T25).
- starting-place.html, paragraphs 544–544: Solo masturbation; Castiel → self; **missed** (suspect-two-569919fdfb5e.json, T28).
- mars.html, paragraphs 635–649: Solo masturbation; Dean Winchester → self; **missed** (suspect-two-569919fdfb5e.json, T29).
- mars.html, paragraphs 640–655: Solo masturbation; Castiel → self; **missed** (suspect-two-569919fdfb5e.json, T29).
- starting-place.html, paragraphs 634–638: Solo masturbation; Dean Winchester → self; **wrong-participants** (suspect-two-569919fdfb5e.json, T30).
- belonging.html, paragraphs 725–731: Toy insertion; Castiel → Dean Winchester; **needs-adjudication** (suspect-two-569919fdfb5e.json, T31).
- starting-place.html, paragraphs 1019–1019: Fingering; Castiel → Dean Winchester; **hint-only** (suspect-two-569919fdfb5e.json, T32).
- more-views.html, paragraphs 274–274: Handjob; Dean Winchester → Castiel; **missed** (suspect-two-569919fdfb5e.json, T34).
- bluebells.html, paragraphs 1168–1171: Handjob; Brother Diarmuid → David Shepherd; **missed** (suspect-two-569919fdfb5e.json, T35).
- starting-place.html, paragraphs 689–697: Fingering; Castiel → Dean Winchester; **wrong-act** (suspect-two-569919fdfb5e.json, T37).
- innocent-until.html, paragraphs 2568–2573: Handjob; James "Bucky" Barnes → Steve Rogers; **wrong-act** (suspect-two-569919fdfb5e.json, T39).
- innocent-until.html, paragraphs 2575–2575: Solo masturbation; James "Bucky" Barnes → self; **missed** (suspect-two-569919fdfb5e.json, T39).
