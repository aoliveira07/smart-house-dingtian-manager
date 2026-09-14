// Dependency-free Web Component. Distributed verbatim: no CDN or production build tools.
const DOMAIN = 'smart_house_dingtian';
const ROOT = '/smart-house-dingtian';
const css = `
 .relay-switch{display:flex;align-items:center;gap:8px}.switch-track{position:relative;display:inline-block;width:34px;height:20px;border-radius:20px;background:var(--secondary-text-color,#60747d)}.switch-knob{position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:white}.relay-switch[aria-checked=true] .switch-track{background:var(--primary-color,#087f8c)}.relay-switch[aria-checked=true] .switch-knob{left:17px}
 :host{display:block;height:100%;overflow:auto;color:var(--primary-text-color,#172d35);background:var(--primary-background-color,#f4f7f8);font:15px/1.5 system-ui,sans-serif}
 *{box-sizing:border-box}main{max-width:1180px;margin:auto;padding:28px 28px 90px}h1{font-size:30px;line-height:1.2;margin:0 0 8px;letter-spacing:-.8px}h2{font-size:21px;margin:0 0 8px}p{margin:4px 0 16px}.muted{color:var(--secondary-text-color,#60747d)}.eyebrow{font-size:11px;letter-spacing:2px;font-weight:750;text-transform:uppercase;color:var(--primary-color,#087f8c);margin:0 0 12px}
 header,.bar,.module-header,.footer{display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap}.bar{margin:24px 0}.count{font-size:13px;color:var(--secondary-text-color,#60747d)}button,input,select{font:inherit}button{border:1px solid var(--divider-color,#d1dde1);border-radius:9px;padding:10px 15px;cursor:pointer;background:var(--card-background-color,#fff);color:inherit;min-height:44px}button:hover{border-color:var(--primary-color,#087f8c)}button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid var(--primary-color,#087f8c);outline-offset:2px}button.primary{background:var(--primary-color,#087f8c);color:var(--text-primary-color,#fff);border-color:transparent}button.danger{color:var(--error-color,#b32435)}button:disabled{opacity:.5;cursor:wait}input,select{border:1px solid var(--divider-color,#c9d7db);border-radius:7px;background:var(--card-background-color,#fff);color:inherit;padding:10px;width:100%;min-height:44px}input[type=checkbox]{width:22px;height:22px;min-height:22px;accent-color:var(--primary-color,#087f8c)}label{display:flex;flex-direction:column;gap:6px;font-size:13px}.inline{flex-direction:row;align-items:center;gap:10px}nav{display:flex;gap:8px;overflow-x:auto;padding:20px 0;border-bottom:1px solid var(--divider-color,#dbe3e6)}nav button{white-space:nowrap}nav button[aria-current=page]{background:var(--primary-color,#087f8c);color:var(--text-primary-color,#fff)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}.card,.channel{background:var(--card-background-color,#fff);border:1px solid var(--divider-color,#dbe3e6);border-radius:13px;padding:22px}.card .number{font-size:12px;font-weight:700;color:var(--primary-color,#087f8c);margin-bottom:10px}.meta{display:flex;gap:20px;margin:18px 0;flex-wrap:wrap}.meta strong{display:block;font-size:19px}.badge{font-size:12px;background:var(--secondary-background-color,#eaf0f2);border-radius:30px;padding:5px 10px;display:inline-block}.online{color:var(--success-color,#137958)}.empty{text-align:center;padding:70px 20px;border:1px dashed var(--divider-color,#becfd5);border-radius:16px;background:var(--card-background-color,#fff)}.empty .symbol{font-size:40px;color:var(--primary-color,#087f8c);margin-bottom:16px}.channels{display:grid;gap:10px;margin-top:20px}.channel{display:grid;grid-template-columns:44px minmax(190px,1fr) minmax(180px,1.4fr) 125px 110px;align-items:center;gap:18px;padding:16px 20px}.channel .position{font-size:18px;font-weight:750}.channel details{grid-column:1/-1;font-size:12px;color:var(--secondary-text-color,#60747d)}summary{cursor:pointer;padding:6px 0}code{display:block;overflow-wrap:anywhere;margin:4px 0}details .bar{justify-content:flex-start;margin:12px 0 0}.footer{position:sticky;bottom:0;background:var(--card-background-color,#fff);padding:16px 20px;border:1px solid var(--divider-color,#dbe3e6);border-radius:12px;margin-top:20px}.notice{padding:14px 18px;border-radius:9px;background:var(--secondary-background-color,#e5f0f2);margin:18px 0}.error{border-left:4px solid var(--error-color,#b32435)}dialog{max-width:480px;width:calc(100% - 32px);border:1px solid var(--divider-color,#dbe3e6);border-radius:15px;padding:26px;color:inherit;background:var(--card-background-color,#fff)}dialog::backdrop{background:#10272b80}dialog form{display:grid;gap:18px}.actions{display:flex;gap:8px;flex-wrap:wrap}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@media(max-width:720px){main{padding:20px 14px 80px}h1{font-size:25px}.channel{grid-template-columns:44px 1fr 1fr;gap:12px;padding:15px}.channel .channel-name{grid-column:1/3}.channel .state{grid-column:auto}.channel .test-control{grid-column:2/-1}.channel .channel-type{grid-column:1/3}.channel .channel-use{grid-column:3}.channel .channel-name{grid-column:1/-1}.module-header{align-items:flex-start}.module-header label{width:100%}.grid{grid-template-columns:1fr}}`;

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'className') node.className = value;
    else if (key in node && !key.startsWith('aria')) node[key] = value;
    else node.setAttribute(key, value);
  }
  node.append(...children.filter(x => x !== null && x !== undefined));
  return node;
}
const button = (label, onclick, className = '') => el('button', {type: 'button', onclick, className}, label);
const statusLabel = value => ({online: 'Conectado', offline: 'Desconectado', broker_offline: 'Broker offline', unknown: 'Aguardando informação'}[value] || 'Aguardando informação');

export class DingtianPanel extends HTMLElement {
  constructor() {
    super(); this.attachShadow({mode: 'open'}); this.data = null; this.draft = null;
    this.dirty = false; this.busy = false; this.error = ''; this.active = ''; this.loaded = false; this.localPending = new Set();
    this.onPop = () => this.readRoute();
    this.onUnload = e => {if (this.dirty || this.testWarning()) {e.preventDefault(); e.returnValue = '';}};
  }
  set hass(value) {
    this._hass = value;
    if (this.isConnected && !this.loaded) this.initialize();
  }
  get hass() {return this._hass;}
  set route(value) {this._route = value; if (this.loaded) this.readRoute();}
  connectedCallback() {
    window.addEventListener('popstate', this.onPop); window.addEventListener('hashchange', this.onPop); window.addEventListener('beforeunload', this.onUnload);
    if (this.hass && !this.loaded) this.initialize();
  }
  disconnectedCallback() {
    this.unsubscribe?.(); this.unsubscribe = null; this.loaded = false;
    clearTimeout(this.refreshTimer); window.removeEventListener('popstate', this.onPop);
    window.removeEventListener('beforeunload', this.onUnload); window.removeEventListener('hashchange', this.onPop);
  }
  async initialize() {
    this.loaded = true;
    await this.load(); this.readRoute();
    try {
      const unsub = await this.hass.connection.subscribeMessage(() => {
        clearTimeout(this.refreshTimer); this.refreshTimer = setTimeout(() => this.load(), 150);
      }, {type: `${DOMAIN}/subscribe`});
      if (!this.isConnected) unsub(); else this.unsubscribe = unsub;
    } catch (e) {this.error = e.message || String(e); this.render();}
  }
  async api(action, data = {}, confirmed = false) {
    return this.hass.callWS({type: `${DOMAIN}/request`, action, data, confirmed, revision: this.editRevision ?? this.data?.revision ?? 0});
  }
  async load() {
    try {
      if(this.loading)return; this.loading=true;
      const next = await this.api('list');
      const changed = !this.data || next.revision !== this.data.revision || next.error !== this.data.error || next.broker_connected !== this.data.broker_connected;
      this.data = next;
      if (!this.dirty && !this.busy && changed) {this.resetDraft();this.render();} else this.updateStates();
    } catch (e) {this.error = e.message || String(e); this.render();}
    finally {this.loading=false;}
  }
  resetDraft() {
    const m = this.data?.modules[this.active];
    this.draft = m ? structuredClone(m) : null; this.editRevision = this.data?.revision; this.dirty = false;
  }
  testWarning() {
    const m=this.data?.modules[this.active];
    return m?.channels.some(c=>c.test?.status==='pending'||(!c.enabled&&c.state==='ON')) || this.localPending.size>0;
  }
  routePath(mid) {return this.ingress ? (mid?`#/modules/${mid}`:'#/') : (mid?`${ROOT}/modules/${mid}`:ROOT);}
  updateStates() {
    const current = this.data?.modules[this.active];
    if (!current) {if(!this.active&&!this.shadowRoot.querySelector('dialog'))this.render();return;}
    for (const c of current.channels) {
      const node = this.shadowRoot.querySelector(`[data-test="${c.number}"]`);
      if(node) this.fillTest(node,current,c);
    }
  }
  fillTest(node,m,c) {
    const pending=this.localPending.has(c.number)||c.test?.status==='pending';
    const allowed=this.data.broker_connected&&m.availability==='online'&&!this.data.error&&!this.busy&&!pending&&this.editRevision===this.data.revision;
    const signature=JSON.stringify([c.state,c.test,pending,allowed,c.enabled]);
    if(node.dataset.signature===signature)return;
    node.dataset.signature=signature;
    const state=el('div',{className:'state muted','data-state':c.number,role:'status'},`Estado recebido: ${c.state==='unknown'?'Desconhecido / aguardando estado':c.state}`);
    const controls=el('div',{className:'actions'});
    const payloads=c.state==='ON'?['OFF']:c.state==='OFF'?['ON']:['ON','OFF'];
    for(const payload of payloads){
      const b=button(payload==='ON'?'Ligar':'Desligar',()=>this.testRelay(m,c,payload));
      b.setAttribute('aria-label',`${payload==='ON'?'Ligar':'Desligar'} R${c.number} — comando real`);
      if(c.state!=='unknown'){b.setAttribute('role','switch');b.setAttribute('aria-checked',String(c.state==='ON'));b.classList.add('relay-switch');b.prepend(el('span',{className:'switch-track','aria-hidden':'true'},el('span',{className:'switch-knob'})));}
      b.disabled=!allowed; controls.append(b);
    }
    node.replaceChildren(el('strong',{},'Testar relé — comando real'),controls,state);
    if(pending)node.append(el('small',{role:'status'},'Comando solicitado / aguardando retorno.'));
    else if(c.test?.message)node.append(el('small',{role:'status'},c.test.message));
    if(!c.enabled&&c.state==='ON')node.append(el('small',{},'Ligado, mesmo sem uso cadastrado.'));
    if(!allowed&&!pending)node.append(el('small',{},'Teste requer módulo online, conexão e cadastro atualizado.'));
  }
  async testRelay(m,c,payload) {
    if(this.localPending.has(c.number)||c.test?.status==='pending')return;
    this.localPending.add(c.number);this.updateStates();
    try{
      await this.api('operate',{module_uuid:m.module_uuid,number:c.number,payload},true);
      this.error='Comando enviado; resultado físico depende do estado retornado pelo módulo.';
    }catch(e){this.error=e.message||String(e);}
    finally{this.localPending.delete(c.number);await this.load();this.render();}
  }
  readRoute() {
    const match = this.ingress ? location.hash.match(/^#\/modules\/([a-f0-9]{32})/) : location.pathname.match(/\/smart-house-dingtian\/modules\/([a-f0-9]{32})/);
    const next = match?.[1] || '';
    if (next === this.active) return;
    if ((this.dirty || this.testWarning()) && !window.confirm('Sair deste módulo? Alterações não salvas serão descartadas. Relés ligados ou testes sem retorno não serão desligados automaticamente.')) {
      history.pushState(null, '', this.routePath(this.active));
      window.dispatchEvent(new Event('location-changed')); return;
    }
    this.active = next; this.error = ''; this.resetDraft(); this.render();
  }
  navigate(mid) {
    if (mid === this.active) return;
    if ((this.dirty || this.testWarning()) && !window.confirm('Sair deste módulo? Alterações não salvas serão descartadas. Relés ligados ou testes sem retorno não serão desligados automaticamente.')) return;
    this.dirty = false; history.pushState(null, '', this.routePath(mid));
    this.readRoute(); window.dispatchEvent(new Event('location-changed'));
  }
  changed() {
    this.dirty = true;
    const node = this.shadowRoot.querySelector('[data-dirty]'); if (node) node.textContent = 'Alterações não salvas';
  }
  async perform(action, data = {}, confirmed = false) {
    this.busy = true; this.error = ''; this.render();
    try {
      const result = await this.api(action, data, confirmed);
      if (action !== 'operate') {this.data = result; this.dirty = false; this.resetDraft();}
      else this.error = 'Comando enviado. Aguarde o estado informado pelo módulo.';
    } catch (e) {this.error = e.message || String(e);}
    finally {this.busy = false; this.render();}
  }
  async save() {
    const old = this.data.modules[this.active];
    const affected = this.draft.channels.filter((c, i) => old.channels[i].enabled && (!c.enabled || c.entity_type !== old.channels[i].entity_type)).length;
    if (affected && !window.confirm(`${affected} canal(is) terão entidade removida ou domínio alterado. Revise automações/cenas. Desativar cadastro não desliga o relé. Confirmar?`)) return;
    await this.perform('save', this.draft, affected > 0);
  }
  addDialog() {
    const form = el('form'); const dialog = el('dialog', {}, form);
    const serial = el('input', {required: true, pattern: '[0-9]{1,64}', maxLength: 64, inputMode: 'numeric', name: 'serial'});
    const count = el('select', {name: 'capacity'}, ...[8,16,32].map(n => el('option', {value: n}, `${n} canais`)));
    const name = el('input', {required: true, maxLength: 120, value: `Cabeado ${this.data.next_module_number}`, name: 'display_name'});
    const error = el('p', {role: 'alert', className: 'muted'});
    form.append(el('h2', {}, 'Adicionar módulo'), el('p', {className: 'muted'}, `Identificador reservado ao salvar: Cabeado${this.data.next_module_number}`), el('label', {}, 'Número de série', serial), el('small', {className: 'muted'}, 'Somente dígitos. Ex.: 12345 forma relay12345. Zeros iniciais são preservados.'), el('label', {}, 'Capacidade', count), el('label', {}, 'Nome do módulo', name), error, el('div', {className: 'actions'}, button('Cancelar', () => dialog.close()), el('button', {type: 'submit', className: 'primary'}, 'Cadastrar módulo')));
    form.addEventListener('submit', async e => {
      e.preventDefault(); const submit = form.querySelector('[type=submit]'); submit.disabled = true;
      try {
        this.data = await this.api('create', {serial: serial.value, channel_count: Number(count.value), display_name: name.value});
        dialog.close(); this.resetDraft(); this.render();
      } catch (e) {error.textContent = e.message || String(e); submit.disabled = false;}
    });
    dialog.addEventListener('close', () => dialog.remove()); this.shadowRoot.append(dialog); dialog.showModal(); serial.focus();
  }
  render() {
    // No dynamic HTML strings: names, errors, MQTT paths and IDs are text nodes.
    const root = this.shadowRoot; root.replaceChildren(el('style', {}, css));
    const main = el('main'); root.append(main);
    main.append(el('header', {}, el('div', {}, el('p', {className: 'eyebrow'}, 'SMART HOUSE / AUTOMAÇÃO CABEADA'), el('h1', {}, 'Dingtian Manager'), el('p', {className: 'muted'}, 'Seus módulos, organizados canal por canal.')), this.ingress ? null : button('☰ Menu', () => this.dispatchEvent(new CustomEvent('hass-toggle-menu', {bubbles: true, composed: true})))));
    if (!this.data) {main.append(el('p', {role:'status'}, this.error || 'Carregando cadastro…')); return;}
    const modules = Object.values(this.data.modules).filter(m => !m.deleted);
    const nav = el('nav', {'aria-label': 'Módulos'});
    for (const [id, label] of [['','Módulos'], ...modules.map(m => [m.module_uuid,m.technical_id])]) {
      const b = button(label, () => this.navigate(id)); if (id === this.active) b.setAttribute('aria-current', 'page'); nav.append(b);
    }
    main.append(nav);
    if (this.error) main.append(el('div', {className:'notice',role:'alert'}, this.error));
    if (this.data.error) main.append(el('div', {className:'notice error',role:'alert'}, el('p', {}, this.data.error), button('Tentar sincronizar', () => this.perform('reconcile'))));
    if (!this.data.broker_connected) main.append(el('div',{className:'notice',role:'status'},'Broker MQTT desconectado. Não é possível enviar comandos ou remover entidades.'));
    if (this.data.prepared_removal) main.append(el('div',{className:'notice'},'Preparação para remoção concluída somente quando não houver pendências. Depois, desinstale o aplicativo pela tela Aplicativos (ou a integração, se estiver usando a versão anterior).'));
    if (!this.active) this.renderOverview(main, modules); else if (this.draft) this.renderModule(main); else main.append(el('p', {}, 'Módulo não encontrado.'), button('Voltar aos módulos', () => this.navigate('')));
    if (this.busy) for (const b of root.querySelectorAll('button,input,select')) b.disabled = true;
  }
  renderOverview(main, modules) {
    main.append(el('div',{className:'bar'},el('div',{},el('h2',{},'Módulos'),el('span',{className:'count'},`${modules.length} cadastrado(s) · ${modules.reduce((a,m)=>a+m.used_count,0)} canais utilizados`)),button('+ Adicionar módulo',()=>this.addDialog(),'primary')));
    if (!modules.length) main.append(el('section',{className:'empty'},el('div',{className:'symbol','aria-hidden':'true'},'▦'),el('h2',{},'Comece pelo primeiro módulo'),el('p',{className:'muted'},'Cadastre o serial e a capacidade. Depois, escolha os canais utilizados.'),button('Adicionar módulo',()=>this.addDialog(),'primary')));
    const grid=el('div',{className:'grid'});
    for (const m of modules) grid.append(el('article',{className:'card'},el('div',{className:'number'},m.technical_id),el('h2',{},m.display_name),el('span',{className:`badge ${m.availability}`},statusLabel(m.availability)),el('div',{className:'meta'},el('div',{},el('span',{className:'muted'},'Serial'),el('strong',{},m.serial)),el('div',{},el('span',{className:'muted'},'Utilização'),el('strong',{},`${m.used_count} de ${m.channel_count}`))),el('div',{className:'actions'},button('Abrir canais',()=>this.navigate(m.module_uuid),'primary'),button('Editar nome',()=>{this.navigate(m.module_uuid); this.shadowRoot.querySelector('[data-module-name]')?.focus();}),button('Remover',()=>{if(window.confirm(`Remover ${m.technical_id} e ${m.used_count} entidade(s)? Automações podem ser afetadas. Nenhum OFF será enviado.`))this.perform('delete',{module_uuid:m.module_uuid},true);},'danger'))));
    if(this.ingress)main.append(el('div',{className:'bar'},button('Exportar cadastro',()=>this.exportInventory()),button('Importar cadastro existente',()=>this.importInventory())));
    main.append(grid,el('details',{className:'notice'},el('summary',{},'Manutenção e remoção do gerenciador'),el('p',{},'Para desinstalar, prepare a limpeza online dos configs Discovery deste gerenciador. Salve antes um backup do Home Assistant. O cadastro será removido e as cargas permanecerão no estado físico atual.'),button('Preparar remoção permanente',()=>{if(window.confirm('Remover todas as entidades e módulos DESTE gerenciador? Outros dispositivos MQTT serão preservados. Este passo exige broker online.'))this.perform('prepare_remove',{},true);},'danger')));
  }
  async exportInventory() {
    try{const data=await this.api('export');const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=el('a',{href:url,download:'dingtian-cadastro.json'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    catch(e){this.error=e.message;this.render();}
  }
  importInventory() {
    const input=el('input',{type:'file',accept:'.json,application/json'});
    input.addEventListener('change',async()=>{
      if(!input.files?.length)return;
      try{
        const inventory=JSON.parse(await input.files[0].text());
        if(!window.confirm('Importar cadastro preservando IDs? O aplicativo deve estar vazio e a integração anterior desativada. Nenhum comando de relé será enviado.'))return;
        await this.perform('import',{inventory},true);
      }catch(e){this.error=e.message;this.render();}
    });input.click();
  }
  renderModule(main) {
    const m=this.draft;
    const name=el('input',{value:m.display_name,maxLength:120,'data-module-name':'',oninput:e=>{m.display_name=e.target.value;this.changed();}});
    main.append(el('div',{className:'bar module-header'},el('div',{},el('p',{className:'eyebrow'},`${m.technical_id} / CONFIGURAÇÃO DO MÓDULO`),el('h2',{},m.display_name),el('p',{className:'muted'},`Serial ${m.serial} · ${m.channel_count} canais · ${m.channels.filter(c=>c.enabled).length} utilizados`)),el('label',{},'Nome do módulo',name)),el('p',{className:'muted'},'Teste uma saída por vez, observe a carga e depois preencha nome, tipo e uso. Salvar não aciona relés. Cancelar o cadastro não desfaz comandos de teste.'));
    const channels=el('section',{className:'channels','aria-label':`Canais de ${m.technical_id}`});
    for(const c of m.channels){
      const use=el('input',{type:'checkbox',checked:c.enabled,'aria-label':`R${c.number} utilizado`,onchange:e=>{c.enabled=e.target.checked;this.changed();}});
      const type=el('select',{'aria-label':`Tipo R${c.number}`,onchange:e=>{c.entity_type=e.target.value;this.changed();}},el('option',{value:''},'Selecionar'),el('option',{value:'light'},'Luz'),el('option',{value:'switch'},'Interruptor'));type.value=c.entity_type;
      const display=el('input',{value:c.display_name,maxLength:120,'aria-label':`Nome R${c.number}`,oninput:e=>{c.display_name=e.target.value;this.changed();}});
      const details=el('details',{},el('summary',{},`Identificação e operação · ${c.unique_id}`),el('code',{},`Nickname: ${c.unique_id}`),el('code',{},`Entidade efetiva: ${c.entity_id||'ainda não criada'}`),el('code',{},`Estado: ${c.topics?.state_topic||''}`),el('code',{},`Comando: ${c.topics?.command_topic||''}`),el('code',{},`Disponibilidade: ${c.topics?.availability_topic||''}`),el('p',{},`Nome exibido pelo HA: ${c.effective_name||c.display_name}`));
      const live=this.data.modules[m.module_uuid]?.channels[c.number-1]||c;
      const test=el('div',{className:'test-control','data-test':c.number});this.fillTest(test,this.data.modules[m.module_uuid]||m,live);
      channels.append(el('article',{className:'channel'},el('div',{className:'position'},`R${c.number}`),test,el('label',{className:'channel-name'},'Nome do canal',display),el('label',{className:'channel-type'},'Tipo',type),el('label',{className:'inline channel-use'},use,'Usar canal'),details));
    }
    main.append(channels,el('div',{className:'footer'},el('span',{'data-dirty':'',role:'status'},this.dirty?'Alterações não salvas':`Revisão ${this.editRevision} · IDs preservados ao renomear`),el('div',{className:'actions'},button('Cancelar',()=>{this.resetDraft();this.render();}),button(this.busy?'Aplicando…':'Salvar módulo',()=>this.save(),'primary'))));
  }
}
if (!customElements.get('smart-house-dingtian-panel')) customElements.define('smart-house-dingtian-panel', DingtianPanel);
