const planner=document.getElementById('weekForm'),rows=document.getElementById('routineRows'),result=document.getElementById('weekResult'),notice=document.getElementById('weekNotice');
const taskLabels={'medicine-reminder':'Existing prescribed medicine reminder',meal:'Meal check-in',walk:'Already agreed walk',appointment:'Appointment reminder','family-call':'Family check-in call'};
function addRoutine(){
 if(rows.children.length===3)return;const row=document.createElement('div');row.className='routine-row';const n=rows.children.length+1;
 row.innerHTML=`<label>Task ${n}<select name="type">${Object.entries(taskLabels).map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label><label>Frequency<select name="frequency"><option value="daily">Every day</option><option value="weekdays">Monday to Friday</option><option value="alternate">Monday, Wednesday, Friday</option><option value="weekly">Saturday</option></select></label><label>Reminder time<select name="time"><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></label>`;rows.append(row);document.getElementById('addRoutine').disabled=rows.children.length===3;
}
document.getElementById('addRoutine').addEventListener('click',addRoutine);addRoutine();
async function stats(){
 const label=document.getElementById('weekStats');try{const r=await fetch('/api/stats');if(!r.ok)throw Error();const s=await r.json();label.textContent=`${s.checklists_created} weekly checklists created. Most common task: ${taskLabels[s.most_common_task]||'no completed checklist yet'}.`;}catch{label.textContent='Live usage figures will appear when the planner is connected.';}
}
planner.addEventListener('submit',async e=>{
 e.preventDefault();const button=document.getElementById('createWeek');button.disabled=true;notice.textContent='Creating your checklist...';result.replaceChildren();
 const tasks=[...rows.children].map(row=>Object.fromEntries([...row.querySelectorAll('select')].map(el=>[el.name,el.value])));
 try{const response=await fetch('/api/setup-week',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tasks})});const data=await response.json();if(!response.ok||data.refused)throw Error(data.error||data.message||'The planner is unavailable.');
  for(const task of data.tasks){const item=document.createElement('li');item.textContent=`${task.label}: ${task.days.join(', ')} in the ${task.time}. Owner: family member ${task.member}.`;result.append(item);}
  notice.textContent=data.note;await stats();
 }catch(error){notice.textContent=error.message||'The live planner is unavailable. No checklist has been generated.';}finally{button.disabled=false;}
});stats();
