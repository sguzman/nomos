'use strict';
/* Three independent disposable Rust cases, never a silent production approval. */
const runner=require('./run_luna_acceptance.cjs');
const CASES=['RUST-CLI','RUST-PERSIST','RUST-MIXED'];
function run(argv){
 const execute=argv.includes('--execute');
 const rest=argv.filter(x=>x!=='--execute');
 let model=null;
 if(rest.length){
  if(rest.length!==2||rest[0]!=='--model')throw new Error('Usage: node tools/run_luna_acceptance_suite.cjs [--model MODEL] [--execute]');
  model=rest[1];
 }
 const results=[];
 for(const case_id of CASES){
  const args=['--case',case_id];
  if(model)args.push('--model',model);
  if(execute)args.push('--execute');
  try{results.push({case_id,success:true,report:runner.run(args)});}
  catch(error){results.push({case_id,success:false,error:error.message});}
 }
 return {kind:'nomos_agent_acceptance_suite',schema_version:1,
  execution_explicitly_requested:execute,case_count:CASES.length,
  cases:results,
  actual_model_runs:results.filter(r=>r.report?.agent_invoked).length,
  independently_accepted_runs:0,production_accepted:false,
  all_cases_prepared:results.every(r=>r.success),
  warning:'Independent behavioral review is required; planning and even successful Cargo tests cannot approve production.'};
}
if(require.main===module){
 try{
  const result=run(process.argv.slice(2));
  console.log(JSON.stringify(result,null,2));
  if(!result.all_cases_prepared)process.exitCode=1;
 }catch(error){console.error('Nomos acceptance suite refused: '+error.message);process.exitCode=1;}
}
module.exports={CASES,run};
