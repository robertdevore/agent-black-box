"""Execute a bounded real Kujo task; log observed commands using RunLedger's CLI.
Requires RUNLEDGER and KUJO absolute executable paths. Creates only a temporary git repo.
"""
import tempfile, pathlib, subprocess, os, json
root=pathlib.Path(__file__).resolve().parent.parent
with tempfile.TemporaryDirectory(prefix='blackbox-record-') as temp:
 p=pathlib.Path(temp)
 def run(args):
  r=subprocess.run(args,cwd=p,env=os.environ,text=True,capture_output=True)
  if r.returncode: raise RuntimeError(r.stderr+r.stdout)
  return r.stdout.strip()
 def ledger(*args):return run([os.environ['RUNLEDGER'],*args])
 run(['git','init','-b','main']);run(['git','config','user.email','fixture@example.invalid']);run(['git','config','user.name','Agent Black Box example'])
 (p/'.gitignore').write_text('.runledger/\n')
 (p/'task.md').write_text('Create a Kujo program that checks 6 * 7 equals 42. Run it and verify output.\n')
 run(['git','add','task.md','.gitignore']);run(['git','commit','-m','Define bounded verification task'])
 runid=ledger('start','--provider','openai','--model','codex','--task','Verify a Kujo arithmetic program','--prompt','task.md','--repo','.').split('Started run: ')[1].splitlines()[0]
 (p/'check.kujo').write_text('answer := 6 * 7\nassert(answer == 42)\nprint("verified: 42")\n')
 outputs=[]
 for args in [[os.environ['KUJO'],'check','check.kujo'],[os.environ['KUJO'],'run','check.kujo']]:
  output=run(args);command='kujo '+' '.join(args[1:]);ledger('command',runid,command);outputs.append({'command':command,'stdout':output,'exitCode':0})
 ledger('test',runid,'Arithmetic output matches 42','--status','pass','--details',outputs[-1]['stdout'])
 ledger('finish',runid,'--status','pass','--verdict','Created check.kujo; syntax check and runtime assertion passed.')
 receipt=json.loads(ledger('show',runid,'--json'))
 # Only local path removed. Public demo contains deliberately authored task/code, no private source.
 receipt['repo_path']='[isolated temporary repository]'
 (root/'fixtures/runledger-success.json').write_text(json.dumps({'schema':'runledger/1','receipt':receipt},indent=2)+'\n')
 (root/'evidence/recorded-execution.json').write_text(json.dumps({'kind':'real bounded execution','runId':runid,'runtime':run([os.environ['KUJO'],'--version']),'program':(p/'check.kujo').read_text(),'outputs':outputs,'privacy':'Only repo_path replaced; task authored for this public demonstration.'},indent=2)+'\n')
 print(runid)
