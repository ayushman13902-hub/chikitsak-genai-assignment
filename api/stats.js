import {supabase,json} from '../lib/care.mjs';
export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'Use GET.'});
 try{const stats=await supabase('rpc/care_usage_stats',{method:'POST',body:'{}'});return json(res,200,stats);}catch{return json(res,503,{error:'Usage data unavailable'});}
}
