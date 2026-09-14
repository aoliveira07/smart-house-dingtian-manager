import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';

const window = new Window({url:'http://localhost/smart-house-dingtian'});
for(const key of ['window','document','HTMLElement','customElements','history','location','Event','CustomEvent'])globalThis[key]=window[key];
await import('../frontend/panel.js');
const tick = () => new Promise(resolve=>setTimeout(resolve,20));
function moduleData(n,count){return {module_uuid:String(n).padStart(32,'0'),technical_id:`Cabeado${n}`,serial:`000${n}`,channel_count:count,display_name:`Quadro ${n}`,used_count:0,availability:'unknown',channels:Array.from({length:count},(_,i)=>({number:i+1,enabled:false,entity_type:'light',display_name:`Saída ${i+1}`,unique_id:`Cabeado${n}-r${i+1}`,last_entity_ids:{},entity_id:null,state:'unknown',topics:{}}))};}
async function panel(modules=[]){
  window.history.replaceState(null,'','/smart-house-dingtian');
  const requests=[];
  const data={revision:1,next_module_number:modules.length+1,modules:Object.fromEntries(modules.map(m=>[m.module_uuid,m])),broker_connected:true,error:null};
  const node=document.createElement('smart-house-dingtian-panel');
  node.hass={callWS:async msg=>{requests.push(msg);return structuredClone(data);},connection:{subscribeMessage:async()=>()=>{}}};
  document.body.replaceChildren(node);await tick();
  return {node,requests,data};
}
test('empty install has no phantom modules or channels',async()=>{
  const {node}=await panel();assert.match(node.shadowRoot.textContent,/Comece pelo primeiro módulo/);
  assert.equal(node.shadowRoot.querySelectorAll('.channel').length,0);
});
test('separate 8,16,32 channel pages and history',async()=>{
  const {node}=await panel([moduleData(1,8),moduleData(2,16),moduleData(3,32)]);
  assert.equal(node.shadowRoot.querySelectorAll('.card').length,3);
  for(const [index,count] of [[1,8],[2,16],[3,32]]){
    node.navigate(String(index).padStart(32,'0'));
    assert.equal(node.shadowRoot.querySelectorAll('.channel').length,count);
    assert.equal(node.shadowRoot.querySelectorAll('nav [aria-current=page]').length,1);
  }
  node.navigate('');assert.equal(node.shadowRoot.querySelectorAll('.channel').length,0);
});
test('names are text, not injected markup',async()=>{
  const m=moduleData(1,8);m.display_name='<img src=x onerror=alert(1)>';
  const {node}=await panel([m]);assert.equal(node.shadowRoot.querySelector('img'),null);
  assert.ok(node.shadowRoot.textContent.includes(m.display_name));
});
test('unsaved navigation cancellation and batch save revision',async()=>{
  const {node,requests}=await panel([moduleData(1,8),moduleData(2,16)]);
  const id=String(1).padStart(32,'0');node.navigate(id);
  const input=node.shadowRoot.querySelector('[aria-label="Nome R1"]');input.value='Cozinha';input.dispatchEvent(new Event('input'));
  window.confirm=()=>false;node.navigate(String(2).padStart(32,'0'));assert.equal(node.active,id);
  await node.save();const save=requests.find(r=>r.action==='save');
  assert.equal(save.revision,1);assert.equal(save.data.channels.length,8);assert.equal(save.data.channels[0].display_name,'Cozinha');
  assert.equal(requests.filter(r=>r.action==='operate').length,0);
});
test('type change requires confirmation before any API mutation',async()=>{
  const m=moduleData(1,8);m.channels[0].enabled=true;
  const {node,requests}=await panel([m]);node.navigate(m.module_uuid);
  node.draft.channels[0].entity_type='switch';node.changed();window.confirm=()=>false;await node.save();
  assert.equal(requests.filter(r=>r.action==='save').length,0);
});

test('test control precedes name and works before use, preserving unsaved draft',async()=>{
  const m=moduleData(1,8);m.availability='online';m.channels[6].display_name='';m.channels[6].entity_type='';
  const {node,requests}=await panel([m]);node.navigate(m.module_uuid);
  const row=node.shadowRoot.querySelectorAll('.channel')[6];
  assert.equal(row.children[1].dataset.test,'7');assert.equal(row.children[2].className,'channel-name');
  assert.match(row.textContent,/Estado recebido: Desconhecido/);
  assert.equal(row.querySelectorAll('[role=switch]').length,0);
  const input=row.querySelector('[aria-label="Nome R7"]');input.value='Rascunho';input.dispatchEvent(new Event('input'));
  window.confirm=()=>true;
  await node.testRelay(m,m.channels[6],'ON');
  const commands=requests.filter(r=>r.action==='operate');assert.equal(commands.length,1);
  assert.deepEqual(commands[0].data,{module_uuid:m.module_uuid,number:7,payload:'ON'});
  assert.equal(node.draft.channels[6].display_name,'Rascunho');assert.equal(node.draft.channels[6].enabled,false);
  assert.equal(requests.filter(r=>r.action==='save').length,0);
});

test('pending and unavailable test buttons are disabled without invented OFF',async()=>{
  const m=moduleData(1,16);const {node,data,requests}=await panel([m]);node.navigate(m.module_uuid);
  let control=node.shadowRoot.querySelector('[data-test="1"]');
  assert.equal(control.querySelectorAll('button:disabled').length,2);
  data.modules[m.module_uuid].availability='online';data.modules[m.module_uuid].channels[0].test={status:'pending',desired:'ON'};
  await node.load();control=node.shadowRoot.querySelector('[data-test="1"]');
  assert.equal(control.querySelectorAll('button:disabled').length,2);assert.match(control.textContent,/aguardando retorno/);
  data.modules[m.module_uuid].channels[0].state='ON';data.modules[m.module_uuid].channels[0].test={status:'confirmed',message:'Estado recebido do módulo.'};
  await node.load();control=node.shadowRoot.querySelector('[data-test="1"]');
  assert.equal(control.querySelector('[role=switch]').getAttribute('aria-checked'),'true');
  assert.match(control.textContent,/Ligado, mesmo sem uso cadastrado/);
  window.confirm=()=>false;node.navigate('');assert.equal(node.active,m.module_uuid);
  assert.equal(requests.filter(r=>r.action==='operate').length,0);
});

test('Ingress routes retain the application base URL',async()=>{
  const m=moduleData(1,32);const {node}=await panel([m]);
  window.history.replaceState(null,'','/api/hassio_ingress/opaque-session/');node.ingress=true;
  node.navigate(m.module_uuid);assert.equal(window.location.pathname,'/api/hassio_ingress/opaque-session/');
  assert.equal(window.location.hash,`#/modules/${m.module_uuid}`);assert.equal(node.shadowRoot.querySelectorAll('[data-test]').length,32);
  node.navigate('');assert.equal(window.location.hash,'#/');
});

test('toggle clicks send ON and OFF directly without confirmation or duplicate commands',async()=>{
  const m=moduleData(1,8);m.availability='online';m.channels[0].state='OFF';
  const {node,data,requests}=await panel([m]);node.navigate(m.module_uuid);
  let confirmations=0;window.confirm=()=>{confirmations++;return false;};
  const on=node.shadowRoot.querySelector('[data-test="1"] [role=switch]');
  assert.equal(on.getAttribute('aria-checked'),'false');
  on.click();on.click();await tick();
  let commands=requests.filter(r=>r.action==='operate');
  assert.equal(commands.length,1);assert.equal(commands[0].data.payload,'ON');
  assert.equal(commands[0].data.number,1);assert.equal(commands[0].confirmed,true);
  assert.equal(node.shadowRoot.querySelector('[data-test="1"] [role=switch]').getAttribute('aria-checked'),'false');
  // Only equipment state changes the displayed toggle; the next click explicitly sends OFF.
  data.modules[m.module_uuid].channels[0].state='ON';await node.load();
  const off=node.shadowRoot.querySelector('[data-test="1"] [role=switch]');
  assert.equal(off.getAttribute('aria-checked'),'true');off.click();await tick();
  commands=requests.filter(r=>r.action==='operate');
  assert.deepEqual(commands.map(r=>r.data.payload),['ON','OFF']);
  assert.equal(confirmations,0);assert.equal(node.draft.channels[0].enabled,false);
  assert.equal(requests.filter(r=>r.action==='save').length,0);
});
