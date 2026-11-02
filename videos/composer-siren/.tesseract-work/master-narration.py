from pathlib import Path
import subprocess,json,re
root=Path(__file__).resolve().parents[1]
for p in sorted((root/'assets').glob('[0-9][0-9]*.mp3')):
 first=subprocess.run(['ffmpeg','-hide_banner','-i',str(p),'-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 stats=json.loads(re.findall(r'\{[^{}]+\}',first.stderr)[-1])
 filt='loudnorm=I=-16:TP=-1.5:LRA=7:linear=true:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}'.format(**stats)
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(p),'-af',filt,'-ar','48000',str(p.with_suffix('.wav'))],check=True)
 (root/'evidence'/f'{p.stem}-mastering.json').write_text(json.dumps({'source':p.name,'measurement':stats,'filter':filt},indent=2)+'\n')
 print(p.stem,flush=True)
