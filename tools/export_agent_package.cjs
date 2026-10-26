'use strict';
/* Local CLI: dry run by default. No package install without two explicit switches. */
const fs=require('node:fs');
const path=require('node:path');
const {compile,install}=require('./agent_package.cjs');
function run(argv) {
  const flags=new Map();
  for(let i=0;i<argv.length;i++) {
    const token=argv[i];
    if(['--write','--confirm-export'].includes(token)){flags.set(token,true);continue;}
    if(!['--projection','--catalog','--destination','--target'].includes(token)||i===argv.length-1)
      throw new Error('Unexpected argument: '+token);
    flags.set(token,argv[++i]);
  }
  for(const option of ['--projection','--catalog','--destination'])
    if(!flags.has(option))throw new Error('Missing required option '+option);
  const projection=JSON.parse(fs.readFileSync(path.resolve(flags.get('--projection')),'utf8'));
  const catalog=JSON.parse(fs.readFileSync(path.resolve(flags.get('--catalog')),'utf8'));
  const bundle=compile(projection,catalog,{target:flags.get('--target')||'generic'});
  return install(bundle,flags.get('--destination'),{
    write:flags.get('--write')===true,confirmedExport:flags.get('--confirm-export')===true
  });
}
if(require.main===module) {
  try {console.log(JSON.stringify(run(process.argv.slice(2)),null,2));}
  catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={run};