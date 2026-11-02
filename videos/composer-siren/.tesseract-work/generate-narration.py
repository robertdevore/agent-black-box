from pathlib import Path
import os,subprocess,json,urllib.request,urllib.error,base64,hashlib
root=Path(__file__).resolve().parents[1]
key=os.environ.get('ELEVENLABS_API_KEY') or subprocess.run(['security','find-generic-password','-s','kujo-videoops-elevenlabs','-a','videoops','-w'],capture_output=True,check=True).stdout.decode().strip()
voice='eXpIbVcVbLo8ZJQDlDnl';model='eleven_v4'
segments=json.loads((root/'.tesseract-work/narration.json').read_text());out=[]
for i,s in enumerate(segments):
 payload={'text':s['text'],'model_id':model,'voice_settings':{'stability':0.5,'similarity_boost':0.75,'speed':1.0},'previous_text':segments[i-1]['text'] if i else '', 'next_text':segments[i+1]['text'] if i+1<len(segments) else ''}
 cache=hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest();audio=root/'assets'/f'{s["id"]}.mp3';meta=root/'assets'/f'{s["id"]}.json'
 if not(audio.exists() and meta.exists() and json.loads(meta.read_text()).get('payloadSha256')==cache):
  req=urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128',data=json.dumps(payload).encode(),headers={'xi-api-key':key,'Content-Type':'application/json'})
  try:
   with urllib.request.urlopen(req,timeout=120) as response:
    data=json.load(response);request_id=response.headers.get('request-id')
  except urllib.error.HTTPError as e:raise RuntimeError(f'ElevenLabs synthesis failed HTTP {e.code}; no automatic paid retry') from None
  audio.write_bytes(base64.b64decode(data['audio_base64']))
  meta.write_text(json.dumps({'provider':'ElevenLabs','voiceId':voice,'voiceName':'Siren - Natural realistic conversational voice','model':model,'payloadSha256':cache,'requestId':request_id,'text':s['text'],'alignment':data.get('normalized_alignment') or data.get('alignment')},indent=2)+'\n')
 duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(audio)]))
 out.append({**s,'audio':str(audio.relative_to(root)),'duration':duration,'hold':round(duration+1.2,3)})
 print(s['id'],round(duration,2),'seconds',flush=True)
(root/'.tesseract-work/timing.json').write_text(json.dumps(out,indent=2)+'\n')
