"""Explicit local FFmpeg fallback for slow Tesseract 0.2.0 export; preserves native edit."""
from pathlib import Path
import json,subprocess
r=Path(__file__).resolve().parents[1];w=r/'.tesseract-work';parts=w/'fallback-parts';parts.mkdir(exist_ok=True)
chapters=json.loads((w/'capture-timing.json').read_text());offset=0;files=[];font=r/'assets/Inter-Regular.ttf'
def run(args):subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y',*args],check=True)
for i,c in enumerate(chapters):
 end=offset+c['hold'];frames=round(end*30)-round(offset*30);out=parts/f'{i:02}.mp4';title=parts/f'{i:02}.txt';title.write_text(f'{i+1:02}  /  {c["title"]}')
 disclosure=parts/'disclosure.txt';disclosure.write_text('AGENT BLACK BOX × APP COMPOSER')
 vf=f'scale=1792:1008,pad=1920:1080:64:0:color=0x201f2f,setsar=1,drawtext=fontfile={font}:textfile={title}:fontcolor=0xd9d4ff:fontsize=25:x=66:y=1029,drawtext=fontfile={font}:textfile={disclosure}:fontcolor=0xaeb8c7:fontsize=19:x=1170:y=1032,fps=30'
 run(['-ss',str(max(0,c['sourceStartMs']-80)/1000),'-i',str(r/'assets/screen-recording.mp4'),'-vf',vf,'-frames:v',str(frames),'-an','-c:v','libx264','-crf','18','-preset','fast','-pix_fmt','yuv420p','-video_track_timescale','90000',str(out)])
 files.append(out);offset=end;print('Rendered',c['id'],flush=True)
 listing=parts/'concat.txt';listing.write_text(''.join(f"file '{p}'\n" for p in files))
run(['-f','concat','-safe','0','-i',str(listing),'-c','copy',str(parts/'picture.mp4')])
args=['-i',str(parts/'picture.mp4')];filters=[];offset=0
for i,c in enumerate(chapters):
 args+=['-i',str(r/'assets'/f'{c["id"]}.wav')];filters.append(f'[{i+1}:a]adelay={round(offset*1000)+350}:all=1[a{i}]');offset+=c['hold']
filters.append(''.join(f'[a{i}]' for i in range(len(chapters)))+f'amix=inputs={len(chapters)}:normalize=0,apad,atrim=duration={offset}[mix]')
run(args+['-filter_complex',';'.join(filters),'-map','0:v','-map','[mix]','-c:v','copy','-c:a','aac','-b:a','192k','-t',str(offset),'-movflags','+faststart',str(r/'Agent-Black-Box-Explainer.mp4')])
(r/'evidence/render-method.json').write_text(json.dumps({'editableProject':'Native Tesseract edit retained; rendered with verified FFmpeg workflow','nativePreviews':'Reference previews inspected','finalRenderer':'FFmpeg 8.0.1 explicit fallback','reason':'Native export yielded only 0.533 seconds of video after approximately 129 seconds; short video-only reproduction also slow. Root cause unverified.','source':'actual Playwright browser recording','durationSeconds':offset,'fps':30,'dimensions':[1920,1080],'captions':'ElevenLabs Siren / eleven_v4 character alignment'},indent=2)+'\n')
