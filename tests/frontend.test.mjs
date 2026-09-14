import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';

const window = new Window({url:'http://localhost/smart-house-dingtian'});
for(const key of ['window','document','HTMLElement','customElements','history','location','Event','CustomEvent'])globalThis[key]=window[key];
const {excelWorkbook}=await import('../frontend/panel.js');
const tick = () => new Promise(resolve=>setTimeout(resolve,20));
function moduleData(n,count){return {module_uuid:String(n).padStart(32,'0'),technical_id:`Cabeado${n}`,serial:`000${n}`,channel_count:count,display_name:`Quadro ${n}`,used_count:0,availability:'unknown',channels:Array.from({length:count},(_,i)=>({number:i+1,enabled:false,entity_type:'light',display_name:`Saída ${i+1}`,unique_id:`Cabeado${n}-r${i+1}`,last_entity_ids:{},entity_id:null,state:'unknown',topics:{}}))};}
async function panel(modules=[]){
  window.localStorage.clear();
  window.history.replaceState(null,'','/smart-house-dingtian');
  const requests=[];
  const data={revision:1,next_module_number:modules.length+1,modules:Object.fromEntries(modules.map(m=>[m.module_uuid,m])),broker_connected:true,error:null,areas:[{area_id:'cozinha',name:'Cozinha'},{area_id:'sala',name:'Sala'}]};
  const node=document.createElement('smart-house-dingtian-panel');
  node.hass={callWS:async msg=>{requests.push(structuredClone(msg));if(msg.action==='save'){const mod=data.modules[msg.data.module_uuid];if(msg.data.display_name!==undefined)mod.display_name=msg.data.display_name;msg.data.channels.forEach((c,i)=>Object.assign(mod.channels[i],structuredClone(c)));data.revision++;}return structuredClone(data);},connection:{subscribeMessage:async()=>()=>{}}};
  document.body.replaceChildren(node);await tick();
  return {node,requests,data};
}
test('empty install has no phantom modules or channels',async()=>{
  const {node}=await panel();assert.match(node.shadowRoot.textContent,/Comece pelo primeiro módulo/);
  assert.equal(node.shadowRoot.querySelectorAll('.channel').length,0);
});
test('separate 8,16,32 channel pages and history',async()=>{
  const {node}=await panel([moduleData(1,8),moduleData(2,16),moduleData(3,32)]);
  assert.equal(node.shadowRoot.querySelectorAll('.module-row').length,3);
  for(const [index,count] of [[1,8],[2,16],[3,32]]){
    node.navigate(String(index).padStart(32,'0'));
    assert.equal(node.shadowRoot.querySelectorAll('.channel').length,count);
    assert.equal(node.shadowRoot.querySelectorAll('nav').length,0);
  }
  node.navigate('');assert.equal(node.shadowRoot.querySelectorAll('.channel').length,0);
});
test('names are text, not injected markup',async()=>{
  const m=moduleData(1,8);m.display_name='<img src=x onerror=alert(1)>';
  const {node}=await panel([m]);assert.equal(node.shadowRoot.querySelector('img'),null);
  assert.ok(node.shadowRoot.textContent.includes(m.display_name));
});
test('navigation flushes latest text without manual save or relay operations',async()=>{
  const {node,requests}=await panel([moduleData(1,8),moduleData(2,16)]);
  const id=String(1).padStart(32,'0');node.navigate(id);
  const input=node.shadowRoot.querySelector('[aria-label="Nome R1"]');input.value='Cozinha';input.dispatchEvent(new Event('input'));
  await node.navigate(String(2).padStart(32,'0'));assert.equal(node.active,String(2).padStart(32,'0'));
  const save=requests.find(r=>r.action==='save');
  assert.equal(save.revision,1);assert.equal(save.data.channels.length,8);assert.equal(save.data.channels[0].display_name,'Cozinha');
  assert.equal(requests.filter(r=>r.action==='command').length,0);
  assert.ok(!node.shadowRoot.textContent.includes('Salvar módulo'));
});

test('type, area and usage automatically persist as configuration only',async()=>{
  const m=moduleData(1,8);m.channels[0].enabled=true;
  const {node,requests}=await panel([m]);node.navigate(m.module_uuid);
  window.confirm=()=>{throw new Error('Unexpected dialog');};
  for(const [label,value] of [['Tipo R1','switch'],['Cômodo R1','cozinha']]){
    const input=node.shadowRoot.querySelector(`[aria-label="${label}"]`);input.value=value;input.dispatchEvent(new Event('change'));await tick();
  }
  const use=node.shadowRoot.querySelector('[aria-label="R1 utilizado"]');use.checked=false;use.dispatchEvent(new Event('change'));await tick();
  const saves=requests.filter(r=>r.action==='save');assert.equal(saves.length,3);assert.equal(saves[1].data.channels[0].area_id,'cozinha');assert.equal(saves[2].data.channels[0].enabled,false);
  assert.equal(requests.filter(r=>r.action==='command').length,0);assert.equal(node.dirty,false);
});

test('test control precedes name, unknown state is explicit, editing blocks real commands',async()=>{
  const m=moduleData(1,8);m.availability='online';
  const {node,requests}=await panel([m]);node.navigate(m.module_uuid);
  const row=node.shadowRoot.querySelectorAll('.channel')[6];
  assert.equal(row.children[1].dataset.test,'7');assert.equal(row.children[2].className,'channel-name');
  assert.ok(!row.textContent.includes('Estado recebido'));assert.ok(!row.textContent.includes('Estado desconhecido'));
  assert.equal(row.querySelectorAll('[role=switch]').length,0);
  const input=row.querySelector('[aria-label="Nome R7"]');input.value='Rascunho';input.dispatchEvent(new Event('input'));
  await node.testRelay(m,m.channels[6],'ON');assert.equal(requests.filter(r=>r.action==='command').length,0);
  await node.save();assert.equal(node.dirty,false);assert.equal(node.draft.channels[6].display_name,'Rascunho');
});

test('commands ignore reported state and pending feedback but require broker connection',async()=>{
 const m=moduleData(1,8);m.channels[0].test={status:'pending'};
 const {node,data,requests}=await panel([m]);await node.navigate(m.module_uuid);
 let control=node.shadowRoot.querySelector('[data-test="1"]');
 assert.equal(control.querySelectorAll('button:disabled').length,0);
 assert.ok(!control.textContent.includes('aguardando'));
 data.broker_connected=false;await node.load();control=node.shadowRoot.querySelector('[data-test="1"]');
 assert.equal(control.querySelectorAll('button:disabled').length,1);
 assert.equal(requests.filter(r=>r.action==='command').length,0);
});

test('Ingress routes retain the application base URL',async()=>{
  const m=moduleData(1,32);const {node}=await panel([m]);
  window.history.replaceState(null,'','/api/hassio_ingress/opaque-session/');node.ingress=true;
  node.navigate(m.module_uuid);assert.equal(window.location.pathname,'/api/hassio_ingress/opaque-session/');
  assert.equal(window.location.hash,`#/modules/${m.module_uuid}`);assert.equal(node.shadowRoot.querySelectorAll('[data-test]').length,32);
  node.navigate('');assert.equal(window.location.hash,'#/');
});

test('explicit ON and OFF commands need no state feedback or confirmation',async()=>{
 const m=moduleData(1,8);const {node,requests}=await panel([m]);await node.navigate(m.module_uuid);
 window.confirm=()=>{throw new Error('No confirmation expected');};
 const control=node.shadowRoot.querySelector('[data-test="1"]');
 control.querySelector('button').click();control.querySelector('button').click();await tick();
 assert.equal(requests.filter(r=>r.action==='command').length,1);
 node.shadowRoot.querySelector('[data-test="1"] button').click();await tick();
 const commands=requests.filter(r=>r.action==='command');assert.deepEqual(commands.map(c=>c.data.payload),['ON','OFF']);
 assert.equal(node.shadowRoot.querySelector('[role=switch]'),null);
 assert.ok(node.shadowRoot.querySelector('.channel').textContent.includes('Saída 1'));
 assert.ok(!node.shadowRoot.textContent.includes('Estado desconhecido'));
});

test('slow saves serialize edits, preserve focused input and send latest value',async()=>{
  const m=moduleData(1,32);const {node,requests,data}=await panel([m]);node.navigate(m.module_uuid);
  const original=node.hass.callWS;let release;let active=0,max=0;
  node.hass.callWS=async msg=>{
    if(msg.action!=='save')return original(msg);
    active++;max=Math.max(max,active);
    if(!release)await new Promise(resolve=>{release=resolve;});
    const out=await original(msg);active--;return out;
  };
  const input=node.shadowRoot.querySelector('[aria-label="Nome R1"]');input.focus();
  input.value='Primeiro';input.dispatchEvent(new Event('input'));const pending=node.save();
  input.value='Última edição';input.dispatchEvent(new Event('input'));
  await node.load();assert.equal(node.shadowRoot.querySelector('[aria-label="Nome R1"]'),input);
  release();await pending;
  assert.equal(max,1);assert.equal(data.modules[m.module_uuid].channels[0].display_name,'Última edição');
  assert.deepEqual(requests.filter(r=>r.action==='save').map(r=>r.revision),[1,2]);
  assert.equal(node.shadowRoot.activeElement,input);assert.equal(node.dirty,false);
});

test('network failure preserves draft and blocks navigation, retry persists it',async()=>{
  const m=moduleData(1,8);const {node,data}=await panel([m]);node.navigate(m.module_uuid);
  const original=node.hass.callWS;node.hass.callWS=async msg=>{if(msg.action==='save')throw new Error('Sem conexão');return original(msg);};
  const input=node.shadowRoot.querySelector('[aria-label="Nome R1"]');input.value='Edição importante';input.dispatchEvent(new Event('input'));
  await node.navigate('');assert.equal(node.active,m.module_uuid);assert.equal(node.dirty,true);
  assert.match(node.shadowRoot.querySelector('[data-dirty]').textContent,/Não salvo/);
  assert.ok(window.localStorage.getItem(node.draftKey()).includes('Edição importante'));
  node.hass.callWS=original;await node.retrySave();assert.equal(node.dirty,false);
  assert.equal(data.modules[m.module_uuid].channels[0].display_name,'Edição importante');
});

test('reload restores the unsaved draft and revision conflict does not overwrite server',async()=>{
  const m=moduleData(1,8);const {node,data,requests}=await panel([m]);node.navigate(m.module_uuid);
  node.draft.channels[0].display_name='Local';node.changed();clearTimeout(node.saveTimer);
  data.revision=2;data.modules[m.module_uuid].channels[1].display_name='Outra aba';
  node.data=structuredClone(data);node.resetDraft();clearTimeout(node.saveTimer);
  assert.equal(node.draft.channels[0].display_name,'Local');assert.equal(node.editRevision,1);
  assert.equal(await node.save(),false);assert.equal(requests.filter(r=>r.action==='save').length,0);
  await node.retrySave();const dialog=node.shadowRoot.querySelector('dialog');assert.ok(dialog);
  [...dialog.querySelectorAll('button')].find(b=>b.textContent==='Aplicar minhas alterações').click();await tick();
  assert.equal(data.modules[m.module_uuid].channels[0].display_name,'Local');
  assert.equal(data.modules[m.module_uuid].channels[1].display_name,'Outra aba');
});

test('debounce saves channels and module identity is read only here',async()=>{
  const m=moduleData(1,8);const {node,requests}=await panel([m]);node.navigate(m.module_uuid);
  const input=node.shadowRoot.querySelector('[aria-label="Nome R1"]');
  input.value='Auto';input.dispatchEvent(new Event('input'));
  await new Promise(resolve=>setTimeout(resolve,680));assert.equal(node.dirty,false);
  assert.equal(node.shadowRoot.querySelector('[data-module-name]'),null);
  assert.equal(requests.filter(r=>r.action==='save').at(-1).data.display_name,undefined);
  assert.equal(node.shadowRoot.querySelector('.module-details'),null);
  assert.equal(requests.filter(r=>r.action==='command').length,0);
});

test('overview has compact header, export and no filters, search or maintenance',async()=>{
 const {node}=await panel([moduleData(1,8),moduleData(2,32)]);
 assert.equal(node.shadowRoot.querySelector('[type=search]'),null);
 assert.equal(node.shadowRoot.querySelector('.filter-bar'),null);
 assert.equal(node.shadowRoot.querySelector('details'),null);
 assert.match(node.shadowRoot.querySelector('header').textContent,/Módulos/);
 assert.match(node.shadowRoot.textContent,/Exportar para Excel/);
 assert.ok(!node.shadowRoot.textContent.includes('Importar'));
});

test('draft ownership is unique per tab and survives reload on local HTTP',async()=>{
  const key='smart_house_dingtian:editor';window.sessionStorage.removeItem(key);
  const first=document.createElement('smart-house-dingtian-panel');
  const reloaded=document.createElement('smart-house-dingtian-panel');
  assert.equal(first.editorId,reloaded.editorId);assert.notEqual(first.editorId,'default');
  window.sessionStorage.removeItem(key); // Another browser tab has its own session storage.
  const other=document.createElement('smart-house-dingtian-panel');
  assert.notEqual(first.editorId,other.editorId);
});


test('room filter shows scoped group actions only after selecting a room',async()=>{
 const a=moduleData(1,8),b=moduleData(2,8);
 a.channels[0].enabled=a.channels[1].enabled=b.channels[0].enabled=true;
 a.channels[0].area_id='cozinha';a.channels[1].area_id='sala';b.area_id='sala';
 const {node,requests}=await panel([a,b]);await node.navigate(a.module_uuid);
 assert.equal(node.shadowRoot.querySelector('.selection-actions').hidden,true);
 const filter=node.shadowRoot.querySelector('[aria-label="Filtrar por cômodo"]');filter.value='cozinha';filter.dispatchEvent(new Event('change'));
 assert.equal(node.shadowRoot.querySelector('.selection-actions').hidden,false);
 assert.equal(node.shadowRoot.querySelectorAll('.channel:not([hidden])').length,1);
 const original=node.hass.callWS;node.hass.callWS=async msg=>{if(msg.action==='operate_group'){requests.push(msg);return {sent:[{module_uuid:a.module_uuid,number:1}]};}return original(msg);};
 node.shadowRoot.querySelector('.group-off').click();node.shadowRoot.querySelector('.group-off').click();await tick();
 const batch=requests.filter(r=>r.action==='operate_group');assert.equal(batch.length,1);assert.deepEqual(batch[0].data,{module_ids:[a.module_uuid],area_id:'cozinha',payload:'OFF'});
 await node.navigate('');assert.equal(node.shadowRoot.querySelectorAll('.module-row:not([hidden])').length,2);
});

test('command is immediate, after two seconds only fresh feedback can confirm ON',async()=>{
 const m=moduleData(1,8);m.channels[0].state='OFF';m.channels[0].state_version=1;
 const {node,data,requests}=await panel([m]);await node.navigate(m.module_uuid);
 const get=()=>node.shadowRoot.querySelector('[data-test="1"] button');
 get().click();assert.equal(get().textContent,'Ligado');await tick();
 assert.equal(requests.filter(r=>r.action==='command')[0].data.payload,'ON');
 await new Promise(r=>setTimeout(r,2100));assert.equal(get().textContent,'Desligado');
 get().click();await tick();data.modules[m.module_uuid].channels[0].state='ON';data.modules[m.module_uuid].channels[0].state_version=2;await node.load();
 await new Promise(r=>setTimeout(r,2100));assert.equal(get().textContent,'Ligado');
 get().click();await tick();assert.equal(get().textContent,'Desligado');
 await new Promise(r=>setTimeout(r,2100));assert.equal(get().textContent,'Desligado'); // stale ON is not a reply
 data.modules[m.module_uuid].channels[0].state_version=3;await node.load();assert.equal(get().textContent,'Ligado');
});

test('failed command rolls back the optimistic button and exposes error',async()=>{
 const m=moduleData(1,8);m.channels[0].state='OFF';const {node}=await panel([m]);await node.navigate(m.module_uuid);
 const original=node.hass.callWS;node.hass.callWS=msg=>{if(msg.action==='command')throw new Error('Falha de envio');return original(msg);};
 node.shadowRoot.querySelector('[data-test="1"] button').click();await tick();
 assert.equal(node.shadowRoot.querySelector('[data-test="1"] button').textContent,'Desligado');assert.match(node.error,/Falha de envio/);
});

test('xlsx cells preserve accents, special characters and formula-like names as literal strings',()=>{
 const bytes=excelWorkbook([['Nome do módulo','Saída do módulo','Nome','Cômodo','Tipo'],['Quadro & <1>','Saída 1','=1+1','Área','Luz']]);
 const text=new TextDecoder().decode(bytes);
 assert.equal(new DataView(bytes.buffer).getUint32(0,true),0x04034b50);
 assert.match(text,/inlineStr/);assert.match(text,/Quadro &amp; &lt;1&gt;/);assert.match(text,/Área/);assert.match(text,/>=1\+1</);assert.ok(!text.includes('<f>'));
});

test('overview edits serial and name together, preserving channels and showing rejected edits',async()=>{
 const m=moduleData(1,8);const {node,requests}=await panel([m]);
 assert.equal(node.shadowRoot.querySelector('nav'),null);
 node.shadowRoot.querySelector(`[aria-label="Editar módulo ${m.display_name}"]`).click();
 const dialog=node.shadowRoot.querySelector('dialog');assert.ok(dialog);
 dialog.querySelector('[aria-label="Nome do módulo"]').value='Novo quadro';dialog.querySelector('[aria-label="Número de série"]').value='00999';
 node.hass.callWS=async msg=>{requests.push(msg);throw new Error('Serial/base MQTT já cadastrado.');};
 dialog.querySelector('form').dispatchEvent(new Event('submit',{cancelable:true}));await tick();
 const req=requests.at(-1);assert.equal(req.action,'edit_module');assert.deepEqual(req.data,{module_uuid:m.module_uuid,display_name:'Novo quadro',serial:'00999'});
 assert.match(dialog.textContent,/já cadastrado/);assert.equal(dialog.querySelector('[aria-label="Número de série"]').value,'00999');
});
