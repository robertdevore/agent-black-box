"""Create a reviewable publication snapshot, excluding local memories and agent prompts.
Does not create a remote, upload anything, or rewrite the working repository.
"""
from pathlib import Path
import argparse,subprocess,shutil,re,json
p=argparse.ArgumentParser();p.add_argument('destination',type=Path);args=p.parse_args()
repo=Path(__file__).resolve().parents[1];dest=args.destination.resolve()
if dest.exists() and any(dest.iterdir()):raise SystemExit('Destination must be empty; refusing to overwrite')
dest.mkdir(parents=True,exist_ok=True)
files=subprocess.check_output(['git','ls-files','-z'],cwd=repo).decode().split('\0');copied=[];excluded=[]
private={'MEGA_PROMPT.md','docs/MEMORY.md','evidence/review-handoff.txt','evidence/push-result.txt'}
for name in files:
 if not name:continue
 path=Path(name)
 if name in private or name.startswith('agent/') or any(x in name for x in ['strata-handoff','memory-results','push-result','narration-waveform.json']):excluded.append(name);continue
 if name.startswith('.loop-engineering/') and path.name not in {'loop.yml','SUMMARY.md','gate-unit.log','gate-browser.log','gate-build.log','gate-whitespace.log','verdict.yml'}:excluded.append(name);continue
 if name.startswith('videos/real-world-explainer/') and path.name not in {'recorded-run.json','runledger-receipt.json','execution-provenance.json','inventory-before.mjs','inventory-after.mjs','inventory.test.mjs'}:excluded.append(name);continue
 if name.startswith('videos/composer-siren/') and path.suffix in {'.wav','.webm','.tsrct'}:excluded.append(name);continue
 out=dest/name;out.parent.mkdir(parents=True,exist_ok=True);data=(repo/name).read_bytes()
 try:
  text=data.decode('utf-8');text=text.replace(str(repo),'<workspace>').replace('<kujo-repos>','<kujo-repos>').replace('<home>','<home>');data=text.encode()
 except UnicodeDecodeError:pass
 out.write_bytes(data);copied.append(name)
# The snapshot is a separate history: private prompts and local memory never enter its Git objects.
(dest/'PUBLICATION.md').write_text('# Public source snapshot\n\nThis snapshot contains the application, tests, recorded fixtures, Composer source attribution and narrated walkthrough. Local memory notes, private agent prompts, raw iteration diffs and local handoffs are excluded. The original editable video and raw recording remain in the owner’s workspace. Video build scripts and narration alignment are included.\n\nSee docs/RESEARCH.md for the exact Composer and Kujo integration boundaries. No public application hosting is implied by publishing source.\n')
print(json.dumps({'destination':str(dest),'filesCopied':len(copied),'filesExcluded':len(excluded),'excluded':excluded},indent=2))
