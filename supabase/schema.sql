create table if not exists public.care_requests (
 id uuid primary key default gen_random_uuid(),created_at timestamptz not null default now(),
 visitor_hash text not null,network_hash text not null,input jsonb not null,output jsonb,
 input_tokens integer not null default 0,output_tokens integer not null default 0,
 status text not null default 'pending' check(status in ('pending','success','refused','failed')),model text
);
create index if not exists care_requests_created on public.care_requests(created_at);
alter table public.care_requests enable row level security;
revoke all on public.care_requests from anon,authenticated;
create or replace function public.reserve_care_request(visitor_hash text,network_hash text,p_input jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid;begin
 perform pg_advisory_xact_lock(7600526);
 if (select count(*) from care_requests r where r.created_at>=date_trunc('day',now()) and r.visitor_hash=reserve_care_request.visitor_hash)>=3 then
  return jsonb_build_object('allowed',false,'message','You have used today''s three requests. Return tomorrow.');end if;
 if (select count(*) from care_requests r where r.created_at>=date_trunc('day',now()) and r.network_hash=reserve_care_request.network_hash)>=10 then
  return jsonb_build_object('allowed',false,'message','This network has reached today''s demo limit. Return tomorrow.');end if;
 if (select count(*) from care_requests r where r.created_at>=date_trunc('day',now()))>=50 then
  return jsonb_build_object('allowed',false,'message','The demo has reached today''s usage limit. Return tomorrow.');end if;
 insert into care_requests(visitor_hash,network_hash,input) values(reserve_care_request.visitor_hash,reserve_care_request.network_hash,p_input) returning id into v_id;
 return jsonb_build_object('allowed',true,'id',v_id);end;$$;
create or replace function public.care_usage_stats() returns jsonb language sql security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('checklists_created',(select count(*) from care_requests where status='success'),
 'most_common_task',coalesce((select task->>'type' from care_requests r cross join lateral jsonb_array_elements(r.input->'tasks') task where r.status='success' group by task->>'type' order by count(*) desc,task->>'type' limit 1),'none'),
 'avg_input_tokens',(select round(avg(input_tokens),1) from care_requests where status='success'),
 'avg_output_tokens',(select round(avg(output_tokens),1) from care_requests where status='success'));
$$;
revoke execute on function public.reserve_care_request(text,text,jsonb) from public,anon,authenticated;
revoke execute on function public.care_usage_stats() from public,anon,authenticated;
grant execute on function public.reserve_care_request(text,text,jsonb) to service_role;
grant execute on function public.care_usage_stats() to service_role;
