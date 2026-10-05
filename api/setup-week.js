import {MODEL,SYSTEM_PROMPT,validateInput,parseResult,supabase,identity,json} from '../lib/care.mjs';
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Use POST.'});
 if(req.headers.origin&&req.headers.origin!==`https://${req.headers.host}`)return json(res,403,{error:'Use this page to create a checklist.'});
 let input,error;
 try{input=validateInput(typeof req.body==='string'?JSON.parse(req.body):req.body);}catch(e){error=e.message;input={rejected:true,reason:'non-allowlisted routine input'};}
 let job;
 try{
  if(!process.env.GEMINI_API_KEY)throw Error('Missing Gemini configuration');
  const ids=identity(req,res);
  const reserved=await supabase('rpc/reserve_care_request',{method:'POST',body:JSON.stringify({...ids,p_input:input})});
  if(!reserved.allowed)return json(res,429,{error:reserved.message});job=reserved.id;
  if(error){const output={refused:true,message:error};await supabase('care_requests?id=eq.'+job,{method:'PATCH',body:JSON.stringify({output,status:'refused'})});return json(res,400,output);}
  const upstream=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({systemInstruction:{parts:[{text:SYSTEM_PROMPT}]},contents:[{role:'user',parts:[{text:JSON.stringify(input)}]}],generationConfig:{temperature:0.2,maxOutputTokens:350,responseMimeType:'application/json'}}),signal:AbortSignal.timeout(8000)});
  if(!upstream.ok)throw Error('Gemini request failed');const data=await upstream.json();const output=parseResult(data,input);
  await supabase('care_requests?id=eq.'+job,{method:'PATCH',body:JSON.stringify({output,status:output.refused?'refused':'success',input_tokens:data.usageMetadata?.promptTokenCount||0,output_tokens:data.usageMetadata?.candidatesTokenCount||0,model:MODEL})});
  return json(res,200,{...output,request_id:job});
 }catch(e){
  if(job)try{await supabase('care_requests?id=eq.'+job,{method:'PATCH',body:JSON.stringify({status:'failed',output:{error:'Service unavailable'}})});}catch{}
  return json(res,503,{error:'The live planner is unavailable. Please try again later. No checklist has been generated.'});
 }
}
