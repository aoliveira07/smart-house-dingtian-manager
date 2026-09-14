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
