from pathlib import Path
import json,subprocess,math,os,shutil
root=Path(__file__).resolve().parents[1];ts=os.environ.get('TSRCT') or shutil.which('tsrct') or str(Path.home()/'Library/Application Support/Tesseract/bin/tsrct');project=root/'Agent-Black-Box-Explainer.tsrct'
subprocess.run([ts,'project','checkout','--project',str(project),'--output',str(root/'.tesseract-work/editable.json')],check=True)
doc=json.loads((root/'.tesseract-work/editable.json').read_text());chapters=json.loads((root/'.tesseract-work/capture-timing.json').read_text())
videoDuration=round(float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(root/'assets/screen-recording.mp4')]))*1000)
doc['dimensions']={'width':1920,'height':1080};layers=[];actions=[];offset=0;captionCues=[];chapterLines=[]
def stamp(t,sep=','):
 ms=round(t*1000);h=ms//3600000;m=(ms//60000)%60;s=(ms//1000)%60;return f'{h:02}:{m:02}:{s:02}{sep}{ms%1000:03}'
for i,c in enumerate(chapters):
 length=round(c['hold']*1000);voiceMs=round(c['duration']*1000);sourceStart=max(0,c['sourceStartMs']-80);chapterLines.append(f'{offset/1000:07.3f} {c["title"]}')
 layers.append({'id':10+i,'name':c['title']+' — real browser footage','type':'Video','activeRange':{'start':offset,'duration':length},'sourceRange':{'start':sourceStart,'duration':length},'sourceIntrinsicDuration':videoDuration,'volume':0,'transform':{'anchorPoint':[0,0],'position':[64,0],'scale':[140,140],'rotation':0,'opacity':100},'source':{'assetId':'siren-browser-capture','fit':'contain'}})
 layers.append({'id':30+i,'name':c['title']+' — ElevenLabs Siren / v4','type':'Audio','activeRange':{'start':offset+350,'duration':voiceMs},'sourceRange':{'start':0,'duration':voiceMs},'sourceIntrinsicDuration':voiceMs,'source':{'assetId':f'siren-voice-{i+1:02}'},'volume':1.0,'captionsEnabled':False})
 actions.append({'type':'createFxTextLayer','compositionId':'main','layerId':100+i,'name':c['title'],'insertIndex':0,'activeRange':{'start':offset,'duration':length},'transform':{'anchorPoint':[0,0],'position':[66,1024],'scale':[100,100],'rotation':0,'opacity':100},'sourceText':{'text':f'{i+1:02}  /  {c["title"]}','fontFamily':'Inter','fontStyle':'Regular','fontSize':25,'fillColor':[.85,.83,1,1],'justification':'left','boxText':True,'boxPosition':[0,0],'boxSize':[950,48]}})
 align=json.loads((root/'assets'/f'{c["id"]}.json').read_text())['alignment'];chars=align['characters'];starts=align['character_start_times_seconds'];ends=align['character_end_times_seconds'];at=0
 # Phrase captions use provider character alignment; do not invent speech.
 while at<len(chars):
  end=min(len(chars),at+92)
  if end<len(chars):
   options=[j for j in range(at+35,end) if chars[j]==' ']
   if options:end=options[-1]+1
  text=''.join(chars[at:end]).strip()
  if text:captionCues.append((offset/1000+.35+starts[at],offset/1000+.35+ends[end-1],text))
  at=end
 offset+=length
# Footage does not cover the reserved caption band; use opaque background.
doc['duration']=offset/1000;doc['composition']['layers']=layers
(root/'.tesseract-work/editable.json').write_text(json.dumps(doc,indent=2))
subprocess.run([ts,'project','commit','--project',str(project),'--file',str(root/'.tesseract-work/editable.json')],check=True)
actions.append({'type':'createFxTextLayer','compositionId':'main','layerId':150,'name':'Recording disclosure','insertIndex':0,'activeRange':{'start':0,'duration':offset},'transform':{'anchorPoint':[0,0],'position':[1170,1028],'scale':[100,100],'rotation':0,'opacity':100},'sourceText':{'text':'AGENT BLACK BOX × APP COMPOSER','fontFamily':'Inter','fontStyle':'Regular','fontSize':19,'fillColor':[.68,.72,.78,1],'justification':'left','boxText':True,'boxPosition':[0,0],'boxSize':[700,42]}})
(root/'.tesseract-work/title-actions.json').write_text(json.dumps(actions,indent=2))
subprocess.run([ts,'project','apply','--project',str(project),'--actions',str(root/'.tesseract-work/title-actions.json')],check=True)
(root/'Agent-Black-Box-Explainer.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(a)} --> {stamp(b)}\n{t}' for i,(a,b,t) in enumerate(captionCues))+'\n')
(root/'CHAPTERS.txt').write_text('\n'.join(chapterLines)+'\n')
(root/'TRANSCRIPT.md').write_text('# Agent Black Box — narrated walkthrough\n\n'+ '\n\n'.join('## '+c['title']+'\n\n'+c['text'] for c in chapters)+'\n')
print('Assembled',offset/1000,'seconds with',len(captionCues),'aligned captions')
