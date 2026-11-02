from pathlib import Path
import json,subprocess,hashlib
r=Path(__file__).resolve().parents[1];t=json.loads((r/'.tesseract-work/timing.json').read_text());duration=sum(x['hold'] for x in t);results=[]
for name,dimensions in [('Agent-Black-Box-Explainer.mp4',(1920,1080)),('Agent-Black-Box-Explainer-480p.mp4',(854,480))]:
 p=r/name;d=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]));v=next(s for s in d['streams'] if s['codec_type']=='video');a=next(s for s in d['streams'] if s['codec_type']=='audio');assert (v['width'],v['height'])==dimensions;assert abs(float(d['format']['duration'])-duration)<.1;assert float(a['duration'])>duration-.1
 subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],check=True)
 results.append({'file':name,'dimensions':dimensions,'duration':float(d['format']['duration']),'bytes':p.stat().st_size,'fullDecode':'pass','sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
for c in t:
 d=json.loads((r/'assets'/f'{c["id"]}.json').read_text());assert d['model']=='eleven_v4' and d['voiceId']=='eXpIbVcVbLo8ZJQDlDnl';assert d['alignment']['characters']
b=json.loads((r/'evidence/browser-check.json').read_text());assert b['chapterCount']==10 and b['graphTimelineAssertionsPassed'] and b['anonymousReportPassed'] and not b['pageErrors']
assert 'prepared demo' not in (r/'TRANSCRIPT.md').read_text().lower()
(r/'evidence/media-check.json').write_text(json.dumps({'status':'pass','chapters':10,'voice':'Siren','model':'eleven_v4','outputs':results,'listeningReview':'unavailable'},indent=2)+'\n');print(json.dumps(results,indent=2))
