// Dependency-free Web Component. Distributed verbatim: no CDN or production build tools.
const DOMAIN = 'smart_house_dingtian';
const ROOT = '/smart-house-dingtian';
const css = `
 .relay-switch{display:flex;align-items:center;gap:8px}.switch-track{position:relative;display:inline-block;width:34px;height:20px;border-radius:20px;background:var(--secondary-text-color,#60747d)}.switch-knob{position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:white}.relay-switch[aria-checked=true] .switch-track{background:var(--primary-color,#087f8c)}.relay-switch[aria-checked=true] .switch-knob{left:17px}
 :host{position:relative;display:block;height:100%;overflow:auto;color:var(--primary-text-color,#172d35);background:var(--primary-background-color,#f4f7f8);font:15px/1.5 system-ui,sans-serif}
 *{box-sizing:border-box}main{max-width:1180px;margin:auto;padding:28px 28px 90px}h1{font-size:30px;line-height:1.2;margin:0 0 8px;letter-spacing:-.8px}h2{font-size:21px;margin:0 0 8px}p{margin:4px 0 16px}.muted{color:var(--secondary-text-color,#60747d)}.eyebrow{font-size:11px;letter-spacing:2px;font-weight:750;text-transform:uppercase;color:var(--primary-color,#087f8c);margin:0 0 12px}
 header,.bar,.module-header,.footer{display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap}.bar{margin:24px 0}.count{font-size:13px;color:var(--secondary-text-color,#60747d)}button,input,select{font:inherit}button{border:1px solid var(--divider-color,#d1dde1);border-radius:9px;padding:10px 15px;cursor:pointer;background:var(--card-background-color,#fff);color:inherit;min-height:44px}button:hover{border-color:var(--primary-color,#087f8c)}button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid var(--primary-color,#087f8c);outline-offset:2px}button.primary{background:var(--primary-color,#087f8c);color:var(--text-primary-color,#fff);border-color:transparent}button.danger{color:var(--error-color,#b32435)}button:disabled{opacity:.5;cursor:wait}input,select{border:1px solid var(--divider-color,#c9d7db);border-radius:7px;background:var(--card-background-color,#fff);color:inherit;padding:10px;width:100%;min-height:44px}input[type=checkbox]{width:22px;height:22px;min-height:22px;accent-color:var(--primary-color,#087f8c)}label{display:flex;flex-direction:column;gap:6px;font-size:13px}.inline{flex-direction:row;align-items:center;gap:10px}nav{display:flex;gap:8px;overflow-x:auto;padding:20px 0;border-bottom:1px solid var(--divider-color,#dbe3e6)}nav button{white-space:nowrap}nav button[aria-current=page]{background:var(--primary-color,#087f8c);color:var(--text-primary-color,#fff)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}.card,.channel{background:var(--card-background-color,#fff);border:1px solid var(--divider-color,#dbe3e6);border-radius:13px;padding:22px}.card .number{font-size:12px;font-weight:700;color:var(--primary-color,#087f8c);margin-bottom:10px}.meta{display:flex;gap:20px;margin:18px 0;flex-wrap:wrap}.meta strong{display:block;font-size:19px}.badge{font-size:12px;background:var(--secondary-background-color,#eaf0f2);border-radius:30px;padding:5px 10px;display:inline-block}.online{color:var(--success-color,#137958)}.empty{text-align:center;padding:70px 20px;border:1px dashed var(--divider-color,#becfd5);border-radius:16px;background:var(--card-background-color,#fff)}.empty .symbol{font-size:40px;color:var(--primary-color,#087f8c);margin-bottom:16px}.channels{display:grid;gap:10px;margin-top:20px}.channel{display:grid;grid-template-columns:44px minmax(190px,1fr) minmax(180px,1.4fr) 125px 110px;align-items:center;gap:18px;padding:16px 20px}.channel .position{font-size:18px;font-weight:750}.channel details{grid-column:1/-1;font-size:12px;color:var(--secondary-text-color,#60747d)}summary{cursor:pointer;padding:6px 0}code{display:block;overflow-wrap:anywhere;margin:4px 0}details .bar{justify-content:flex-start;margin:12px 0 0}.footer{position:sticky;bottom:0;background:var(--card-background-color,#fff);padding:16px 20px;border:1px solid var(--divider-color,#dbe3e6);border-radius:12px;margin-top:20px}.notice{padding:14px 18px;border-radius:9px;background:var(--secondary-background-color,#e5f0f2);margin:18px 0}.error{border-left:4px solid var(--error-color,#b32435)}dialog{max-width:480px;width:calc(100% - 32px);border:1px solid var(--divider-color,#dbe3e6);border-radius:15px;padding:26px;color:inherit;background:var(--card-background-color,#fff)}dialog::backdrop{background:#10272b80}dialog form{display:grid;gap:18px}.actions{display:flex;gap:8px;flex-wrap:wrap}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@media(max-width:720px){main{padding:20px 14px 80px}h1{font-size:25px}.channel{grid-template-columns:44px 1fr 1fr;gap:12px;padding:15px}.channel .channel-name{grid-column:1/3}.channel .state{grid-column:auto}.channel .test-control{grid-column:2/-1}.channel .channel-type{grid-column:1/3}.channel .channel-use{grid-column:3}.channel .channel-name{grid-column:1/-1}.module-header{align-items:flex-start}.module-header label{width:100%}.grid{grid-template-columns:1fr}}
 main{padding-bottom:32px}header p{margin-bottom:0}nav{padding:16px 0}.bar{margin:20px 0}.grid{display:block}.module-list{display:grid;gap:8px}.module-row{display:grid;grid-template-columns:minmax(160px,1.5fr) minmax(100px,1fr) 100px auto;gap:20px;align-items:center;background:var(--card-background-color,#fff);border:1px solid var(--divider-color,#dbe3e6);border-radius:10px;padding:14px 16px}.module-row h3{font-size:16px;margin:0 0 5px;overflow-wrap:anywhere}.module-row .meta-item{min-width:0;overflow-wrap:anywhere}.meta-item small{display:block;color:var(--secondary-text-color,#60747d)}.module-row .actions{flex-wrap:nowrap;gap:6px}.icon-button{padding:9px;width:44px;display:inline-flex;align-items:center;justify-content:center}.icon-button svg{width:19px;height:19px}.badge{padding:3px 9px}.badge.online{background:var(--secondary-background-color,#e8f5ee)}.badge.online::before{content:'●';margin-right:5px}.overview-tools{display:flex;gap:12px;margin-bottom:14px}.overview-tools input{max-width:340px}.module-header{gap:20px}.module-header>div{min-width:0}.module-header h2{overflow-wrap:anywhere}.module-header label{width:min(300px,100%)}.module-heading{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.module-header p{margin:4px 0 0}.save-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:10px 0}.save-status{font-size:13px;color:var(--success-color,#137958)}.save-status[data-pending=true]{color:var(--secondary-text-color,#60747d)}.save-status[data-error=true]{color:var(--error-color,#b32435)}.helper{font-size:13px;margin:8px 0 14px;color:var(--secondary-text-color,#60747d)}.channels{display:block;margin-top:12px;border:1px solid var(--divider-color,#dbe3e6);border-radius:10px;overflow:hidden;background:var(--card-background-color,#fff)}.channel,.channel-head{display:grid;grid-template-columns:36px 140px minmax(140px,1.4fr) minmax(130px,1fr) 110px 60px;gap:14px;align-items:center;padding:8px 14px;border:0;border-radius:0}.channel+.channel{border-top:1px solid var(--divider-color,#dbe3e6)}.channel-head{background:var(--secondary-background-color,#eaf0f2);font-size:12px;font-weight:650;min-height:40px}.channel .position{font-size:14px}.channel label{gap:0;min-width:0}.channel input,.channel select{padding:8px;font-size:15px}.channel .channel-name,.channel .channel-type,.channel .channel-use,.channel .test-control{grid-column:auto}.channel .channel-use{min-height:44px;justify-content:center}.channel-use span{display:none}.relay-switch{padding:6px 9px;border-color:transparent;background:transparent;gap:7px;font-size:12px}.test-control .actions{gap:4px;flex-wrap:nowrap}.test-control .actions button:not(.relay-switch){font-size:12px;padding:6px 8px}.test-control small{display:block;font-size:11px;line-height:1.3;margin:3px 0;overflow-wrap:anywhere}.test-control .state{display:none}.module-details{margin-top:18px;font-size:12px;color:var(--secondary-text-color,#60747d)}.module-details .technical-row{padding:8px 0;border-bottom:1px solid var(--divider-color,#dbe3e6)}.module-picker{display:none}.conflict-list{max-height:45vh;overflow:auto;font-size:13px}.conflict-list p{overflow-wrap:anywhere;padding:8px 0;border-bottom:1px solid var(--divider-color,#dbe3e6)}[hidden]{display:none!important}
 @media(max-width:900px){.module-row{grid-template-columns:minmax(130px,1fr) 100px auto;gap:12px}.module-row .usage{grid-column:2;grid-row:1}.module-row .serial{grid-column:1;grid-row:2}.module-row .actions{grid-column:3;grid-row:1/3}.channel,.channel-head{grid-template-columns:28px 130px minmax(110px,1fr) minmax(110px,1fr) 100px 46px;gap:10px}}
 @media(max-width:760px){main{padding:18px 12px 28px}h1{font-size:24px}.eyebrow{font-size:9px;letter-spacing:1.4px;margin-bottom:6px}header p.muted{display:none}nav{display:none}.module-picker{display:flex;gap:8px;align-items:center;margin-top:16px}.module-picker select{min-width:0;flex:1}.bar{margin:18px 0 12px;gap:10px}.bar h2{font-size:19px}.bar>.primary{font-size:13px;padding:8px 10px}.module-row{grid-template-columns:minmax(0,1fr) auto;padding:12px;gap:8px 12px}.module-row .module-title{grid-column:1;grid-row:1}.module-row .usage{grid-column:2;grid-row:1;text-align:right}.module-row .serial{grid-column:1/-1;grid-row:2;max-width:calc(100% - 184px)}.module-row .actions{grid-column:1/-1;grid-row:2;justify-content:flex-end}.module-row .actions .primary{font-size:12px;padding:8px}.module-row h3{font-size:15px}.module-row .actions{gap:4px}.module-row .icon-button{width:44px}.module-row .meta-item{font-size:13px}.module-row .serial small{display:none}.module-row .serial strong::before{content:'Serial ';font-weight:400}.module-header{display:block}.module-header label{margin-top:12px;width:100%}.module-header p{font-size:12px}.helper{font-size:12px}.save-bar{position:sticky;top:0;z-index:2;background:var(--primary-background-color,#f4f7f8);padding:8px 0;margin:0}.save-bar button{font-size:12px;padding:6px 10px}.channels{margin-top:6px}.channel-head{display:none}.channel{grid-template-columns:32px minmax(0,1fr) minmax(100px,1fr);gap:6px 10px;padding:10px 12px}.channel .position{grid-column:1;grid-row:1}.channel .test-control{grid-column:2;grid-row:1;justify-self:start;max-width:100%}.channel .channel-name{grid-column:1/-1;grid-row:2}.channel .channel-area{grid-column:1/3;grid-row:3}.channel .channel-type{grid-column:3;grid-row:3}.channel .channel-use{grid-column:3;grid-row:1;justify-content:flex-end;font-size:12px;gap:8px}.channel-use span{display:inline}.channel input,.channel select{font-size:16px}.test-control small{max-width:240px}.test-control .actions{justify-content:flex-end}.module-details{margin-top:12px}dialog{padding:20px}}
`;

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
    this.editorId=`${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {this.editorId=window.sessionStorage.getItem(`${DOMAIN}:editor`) || this.editorId;window.sessionStorage.setItem(`${DOMAIN}:editor`,this.editorId);}catch{}
    this.onPop = () => this.readRoute();
    this.saveMessage = 'Salvo'; this.saveError = ''; this.saving = null;
    this.onHidden = () => {if(document.visibilityState==='hidden' && this.dirty) this.save();};
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
    document.addEventListener('visibilitychange', this.onHidden);
    if (this.hass && !this.loaded) this.initialize();
  }
  disconnectedCallback() {
    this.unsubscribe?.(); this.unsubscribe = null; this.loaded = false;
    clearTimeout(this.refreshTimer); clearTimeout(this.saveTimer); document.removeEventListener('visibilitychange', this.onHidden); window.removeEventListener('popstate', this.onPop);
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
      if(this.data && next.revision < this.data.revision)return;
      const changed = !this.data || next.revision !== this.data.revision || next.error !== this.data.error || next.broker_connected !== this.data.broker_connected || JSON.stringify(next.areas)!==JSON.stringify(this.data.areas);
      this.data = next;
      if (!this.dirty && !this.busy && !this.saving && changed) {this.resetDraft();this.render();} else this.updateStates();
    } catch (e) {this.error = e.message || String(e); if(this.dirty)this.updateSaveStatus();else this.render();}
    finally {this.loading=false;}
  }
  draftKey() {return `${DOMAIN}:draft:${this.data?.manager_uuid || 'preview'}:${this.active}:${this.editorId}`;}
  config(m) {return {module_uuid:m.module_uuid,display_name:m.display_name,channels:m.channels.map(c=>({number:c.number,display_name:c.display_name,entity_type:c.entity_type,enabled:c.enabled,area_id:c.area_id??null}))};}
  resetDraft() {
    clearTimeout(this.saveTimer);
    const m = this.data?.modules[this.active];
    this.draft = m && !m.deleted ? structuredClone(m) : null;
    this.editRevision = this.data?.revision; this.dirty = false; this.saveError = ''; this.saveMessage = 'Salvo';
    this.base = this.draft ? this.config(this.draft) : null;
    if(!this.draft)return;
    try {
      const saved=JSON.parse(window.localStorage.getItem(this.draftKey()) || 'null');
      if(saved?.draft?.module_uuid===this.active && saved.draft.channels?.length===m.channels.length){
        this.draft.display_name=saved.draft.display_name;
        for(const c of saved.draft.channels) Object.assign(this.draft.channels[c.number-1],c);
        this.base=saved.base;this.editRevision=saved.revision;
        this.dirty=true;this.saveMessage='Rascunho recuperado · salvando…';
        this.saveTimer=setTimeout(()=>this.save(),600);
      }
    }catch {this.saveError='Não foi possível recuperar o rascunho local.';}
  }
  rememberDraft() {
    try {window.localStorage.setItem(this.draftKey(),JSON.stringify({revision:this.editRevision,base:this.base,draft:this.config(this.draft)}));this.cacheError='';}
    catch {this.cacheError='Armazenamento local indisponível. Mantenha esta tela aberta até salvar.';}
  }
  updateSaveStatus() {
    const node=this.shadowRoot.querySelector('[data-dirty]');
    if(node){node.textContent=this.saveError || this.cacheError || this.saveMessage;node.dataset.error=String(Boolean(this.saveError||this.cacheError));node.dataset.pending=String(this.dirty);}
    const retry=this.shadowRoot.querySelector('[data-retry]');if(retry)retry.hidden=!this.saveError;
    const title=this.shadowRoot.querySelector('[data-title]');if(title)title.textContent=this.draft?.display_name || 'Módulo';
    const count=this.shadowRoot.querySelector('[data-used]');if(count)count.textContent=`${this.draft.channels.filter(c=>c.enabled).length} utilizados`;
    this.updateStates();
  }
  testWarning() {
    const m=this.data?.modules[this.active];
    return m?.channels.some(c=>c.test?.status==='pending'||(!c.enabled&&c.state==='ON')) || this.localPending.size>0;
  }
  routePath(mid) {return this.ingress ? (mid?`#/modules/${mid}`:'#/') : (mid?`${ROOT}/modules/${mid}`:ROOT);}
  updateStates() {
    const message=this.shadowRoot.querySelector('[data-message]');if(message){message.hidden=!this.error;message.textContent=this.error;}
    const sync=this.shadowRoot.querySelector('[data-sync]');if(sync){sync.hidden=!this.data?.error;sync.querySelector('p').textContent=this.data?.error||'';}
    const current = this.data?.modules[this.active];
    if (!current) {
      for(const row of this.shadowRoot.querySelectorAll('[data-module]')){
        const m=this.data?.modules[row.dataset.module];if(!m)continue;
        const badge=row.querySelector('.badge');badge.textContent=statusLabel(m.availability);badge.className=`badge ${m.availability}`;
      }
      return;
    }
    const badge=this.shadowRoot.querySelector('.module-heading .badge');if(badge){badge.textContent=statusLabel(current.availability);badge.className=`badge ${current.availability}`;}

    for (const c of current.channels) {
      const node = this.shadowRoot.querySelector(`[data-test="${c.number}"]`);
      if(node) this.fillTest(node,current,c);
    }
  }
  fillTest(node,m,c) {
    const pending=this.localPending.has(c.number)||c.test?.status==='pending';
    const allowed=this.data.broker_connected&&m.availability==='online'&&!this.data.error&&!this.busy&&!this.saving&&!this.dirty&&!pending&&this.editRevision===this.data.revision;
    const signature=JSON.stringify([c.state,c.test,pending,allowed,c.enabled]);
    if(node.dataset.signature===signature)return;
    node.dataset.signature=signature;
    const controls=el('div',{className:'actions'});
    const payloads=c.state==='ON'?['OFF']:c.state==='OFF'?['ON']:['ON','OFF'];
    for(const payload of payloads){
      const b=button(payload==='ON'?'Ligar':'Desligar',()=>this.testRelay(m,c,payload));
      b.setAttribute('aria-label',`${payload==='ON'?'Ligar':'Desligar'} R${c.number} — comando real`);
      if(c.state!=='unknown'){b.setAttribute('role','switch');b.setAttribute('aria-checked',String(c.state==='ON'));b.classList.add('relay-switch');b.prepend(el('span',{className:'switch-track','aria-hidden':'true'},el('span',{className:'switch-knob'})));}
      b.disabled=!allowed; controls.append(b);
    }
    node.replaceChildren(controls);
    if(c.state==='unknown')node.append(el('small',{},'Estado desconhecido'));
    if(pending)node.append(el('small',{role:'status'},'Comando solicitado / aguardando retorno.'));
    else if(c.test?.message && c.test.status!=='confirmed')node.append(el('small',{role:'status'},c.test.message));
    if(!c.enabled&&c.state==='ON')node.append(el('small',{},'Ligado, mesmo sem uso cadastrado.'));
    node.title=!allowed&&!pending?(this.dirty||this.saving?'Aguardando salvar configuração.':'Teste requer módulo online e conexão.'):'';
  }
  async testRelay(m,c,payload) {
    if(this.dirty||this.saving||this.busy||this.localPending.has(c.number)||c.test?.status==='pending')return;
    this.localPending.add(c.number);this.updateStates();
    try{
      await this.api('operate',{module_uuid:m.module_uuid,number:c.number,payload},true);
      this.error='';
    }catch(e){this.error=e.message||String(e);}
    finally{this.localPending.delete(c.number);await this.load();this.updateStates();}
  }
  async readRoute() {
    const match = this.ingress ? location.hash.match(/^#\/modules\/([a-f0-9]{32})/) : location.pathname.match(/\/smart-house-dingtian\/modules\/([a-f0-9]{32})/);
    const next=match?.[1] || '';
    if(next===this.active)return;
    if(this.dirty || this.saving){
      history.replaceState(null,'',this.routePath(this.active));
      if(!await this.save())return;
    }
    if(this.testWarning()&&!window.confirm('Sair deste módulo? Relés ligados ou testes sem retorno não serão desligados automaticamente.')){
      history.replaceState(null,'',this.routePath(this.active));return;
    }
    history.replaceState(null,'',this.routePath(next));
    this.active=next;this.error='';this.resetDraft();this.render();
  }
  async navigate(mid) {
    if(mid===this.active || this.navigating)return;
    this.navigating=true;
    try {
      if((this.dirty||this.saving)&&!await this.save())return;
      if(this.testWarning()&&!window.confirm('Sair deste módulo? Relés ligados ou testes sem retorno não serão desligados automaticamente.'))return;
      history.pushState(null,'',this.routePath(mid));this.active=mid;this.error='';this.resetDraft();this.render();
      window.dispatchEvent(new Event('location-changed'));
    }finally{this.navigating=false;}
  }
  changed(immediate=false) {
    this.dirty=true;this.saveError='';this.saveMessage='Alterações pendentes…';this.rememberDraft();this.updateSaveStatus();
    clearTimeout(this.saveTimer);this.saveTimer=setTimeout(()=>this.save(),immediate?0:600);
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
    clearTimeout(this.saveTimer);
    if(this.saving)return this.saving;
    if(!this.dirty)return true;
    this.saving=this.drainSaves();
    this.updateSaveStatus();
    try{return await this.saving;}finally{this.saving=null;this.updateSaveStatus();}
  }
  async drainSaves() {
    // One configuration request at a time. New keystrokes remain in the draft.
    while(this.dirty){
      if(this.editRevision!==this.data.revision){this.saveError='Cadastro alterado em outra aba. Revise antes de salvar.';return false;}
      if(this.localPending.size){this.saveError='Aguarde o retorno do teste e tente salvar novamente.';return false;}
      const sent=this.config(this.draft), revision=this.editRevision;
      this.saveError='';this.saveMessage='Salvando…';this.updateSaveStatus();
      try {
        // Explicit edits to type/use authorize configuration changes only, never relay commands.
        const result=await this.api('save',sent,true);
        if(!result.modules?.[this.active] || result.revision<=revision)throw new Error('O servidor não confirmou o salvamento.');
        if(!this.data || result.revision>=this.data.revision)this.data=result;
        this.editRevision=result.revision;this.base=this.config(result.modules[this.active]);
        this.dirty=JSON.stringify(this.config(this.draft))!==JSON.stringify(sent);
        if(this.dirty)this.rememberDraft();
        else {try{window.localStorage.removeItem(this.draftKey());}catch{}this.cacheError='';this.saveMessage='✓ Salvo';}
      }catch(e){this.saveError=`Não salvo: ${e.message||String(e)}`;this.rememberDraft();return false;}
    }
    return true;
  }
  async retrySave() {
    if(this.saving)return;
    await this.load();
    if(this.editRevision===this.data.revision){await this.save();return;}
    const reviewedRevision=this.data.revision, latest=this.data.modules[this.active];
    if(!latest || latest.deleted){this.saveError='Módulo removido em outra aba. O rascunho local foi preservado.';this.updateSaveStatus();return;}
    const local=this.config(this.draft), merged=this.config(latest), changes=[];
    const compare=(a,b,out,label)=>{for(const key of ['display_name','entity_type','enabled','area_id'])if(key in b && a?.[key]!==b[key]){changes.push(`${label} · ${{display_name:'Nome',entity_type:'Tipo',enabled:'Usar',area_id:'Cômodo'}[key]}: servidor “${out[key]}” → edição “${b[key]}”`);out[key]=b[key];}};
    compare(this.base,local,merged,'Módulo');
    local.channels.forEach((c,i)=>compare(this.base?.channels[i],c,merged.channels[i],`R${c.number}`));
    const dialog=el('dialog',{},el('h2',{},'Revisar alterações'),el('p',{},'O cadastro mudou. Confira sua edição antes de aplicá-la sobre a versão atual.'),el('div',{className:'conflict-list'},...changes.map(t=>el('p',{},t))));
    dialog.append(el('div',{className:'actions'},button('Voltar à edição',()=>dialog.close()),button('Aplicar minhas alterações',async()=>{
      dialog.close();if(this.data.revision!==reviewedRevision){await this.retrySave();return;}this.draft.display_name=merged.display_name;merged.channels.forEach((c,i)=>Object.assign(this.draft.channels[i],c));
      this.editRevision=this.data.revision;this.base=this.config(latest);this.rememberDraft();this.render();await this.save();
    },'primary')));
    dialog.addEventListener('close',()=>dialog.remove());this.shadowRoot.append(dialog);dialog.showModal();
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
    const picker=el('select',{'aria-label':'Selecionar módulo',onchange:async e=>{await this.navigate(e.target.value);e.target.value=this.active;}},el('option',{value:''},'Todos os módulos'),...modules.map(m=>el('option',{value:m.module_uuid},m.display_name)));picker.value=this.active;
    main.append(el('div',{className:'module-picker'},this.active?button('←',()=>this.navigate('')):null,picker));
    main.append(el('div', {className:'notice',role:'alert','data-message':'',hidden:!this.error}, this.error));
    main.append(el('div', {className:'notice error',role:'alert','data-sync':'',hidden:!this.data.error}, el('p', {}, this.data.error||''), button('Tentar sincronizar', () => this.perform('reconcile'))));
    if (!this.data.broker_connected) main.append(el('div',{className:'notice',role:'status'},'Broker MQTT desconectado. Não é possível enviar comandos ou remover entidades.'));
    if (this.data.prepared_removal) main.append(el('div',{className:'notice'},'Preparação para remoção concluída somente quando não houver pendências. Depois, desinstale o aplicativo pela tela Aplicativos (ou a integração, se estiver usando a versão anterior).'));
    if (!this.active) this.renderOverview(main, modules); else if (this.draft) this.renderModule(main); else main.append(el('p', {}, 'Módulo não encontrado.'), button('Voltar aos módulos', () => this.navigate('')));
    if (this.busy) for (const b of root.querySelectorAll('button,input,select')) b.disabled = true;
  }
  renderOverview(main, modules) {
    main.append(el('div',{className:'bar'},el('div',{},el('h2',{},'Módulos'),el('span',{className:'count'},`${modules.length} cadastrado(s) · ${modules.reduce((a,m)=>a+m.used_count,0)} canais utilizados`)),button('+ Adicionar módulo',()=>this.addDialog(),'primary')));
    if (!modules.length) main.append(el('section',{className:'empty'},el('div',{className:'symbol','aria-hidden':'true'},'▦'),el('h2',{},'Comece pelo primeiro módulo'),el('p',{className:'muted'},'Cadastre o serial e a capacidade. Depois, escolha os canais utilizados.'),button('Adicionar módulo',()=>this.addDialog(),'primary')));
    const grid=el('div',{className:'module-list'});
    const search=el('input',{type:'search',placeholder:'Buscar módulo ou serial…','aria-label':'Buscar módulo',oninput:e=>{const q=e.target.value.toLocaleLowerCase();for(const row of grid.children)row.hidden=!row.dataset.search.includes(q);}});
    if(modules.length)main.append(el('div',{className:'overview-tools'},search));
    const icon=(path)=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('aria-hidden','true');const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',path);svg.append(p);return svg;};
    for (const m of modules){
      const edit=button('',async()=>{await this.navigate(m.module_uuid);this.shadowRoot.querySelector('[data-module-name]')?.focus();},'icon-button');edit.title=`Editar nome de ${m.display_name}`;edit.setAttribute('aria-label',edit.title);edit.append(icon('M14 5l5 5M4 20l4-1L20 7a2 2 0 0 0-4-4L4 15v5Z'));
      const remove=button('',()=>{if(window.confirm(`Remover ${m.technical_id} e ${m.used_count} entidade(s)? Automações podem ser afetadas. Nenhum OFF será enviado.`))this.perform('delete',{module_uuid:m.module_uuid},true);},'icon-button danger');remove.title=`Remover ${m.display_name}`;remove.setAttribute('aria-label',remove.title);remove.append(icon('M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7'));
      grid.append(el('article',{className:'module-row','data-module':m.module_uuid,'data-search':`${m.display_name} ${m.serial} ${m.technical_id}`.toLocaleLowerCase()},el('div',{className:'module-title'},el('h3',{},m.display_name),el('span',{className:`badge ${m.availability}`},statusLabel(m.availability))),el('div',{className:'meta-item serial'},el('small',{},'Serial'),el('strong',{},m.serial)),el('div',{className:'meta-item usage'},el('small',{},'Utilização'),el('strong',{},`${m.used_count} de ${m.channel_count}`)),el('div',{className:'actions'},button('Abrir canais',()=>this.navigate(m.module_uuid),'primary'),edit,remove)));
    }

    main.append(grid);
    if(this.ingress)main.append(el('div',{className:'bar'},button('Exportar cadastro',()=>this.exportInventory()),button('Importar cadastro existente',()=>this.importInventory())));
    main.append(el('details',{className:'notice'},el('summary',{},'Manutenção e remoção do gerenciador'),el('p',{},'Para desinstalar, prepare a limpeza online dos configs Discovery deste gerenciador. Salve antes um backup do Home Assistant. O cadastro será removido e as cargas permanecerão no estado físico atual.'),button('Preparar remoção permanente',()=>{if(window.confirm('Remover todas as entidades e módulos DESTE gerenciador? Outros dispositivos MQTT serão preservados. Este passo exige broker online.'))this.perform('prepare_remove',{},true);},'danger')));
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
    const name=el('input',{value:m.display_name,maxLength:120,'data-module-name':'',oninput:e=>{m.display_name=e.target.value;this.changed();},onblur:()=>this.save()});
    const current=this.data.modules[this.active];
    main.append(el('div',{className:'bar module-header'},el('div',{},el('div',{className:'module-heading'},el('h2',{'data-title':''},m.display_name),el('span',{className:`badge ${current.availability}`},statusLabel(current.availability))),el('p',{className:'muted'},`Serial ${m.serial} · ${m.channel_count} canais · `,el('span',{'data-used':''},`${m.channels.filter(c=>c.enabled).length} utilizados`))),el('label',{},'Nome do módulo',name)));
    const retry=button('Revisar / tentar novamente',()=>this.retrySave());retry.dataset.retry='';retry.hidden=!this.saveError;
    main.append(el('div',{className:'save-bar'},el('span',{className:'save-status','data-dirty':'',role:'status','aria-live':'polite'},this.saveMessage),retry),el('p',{className:'helper'},'Edição salva automaticamente. Só o teste envia comandos ao relé.'));
    const channels=el('section',{className:'channels','aria-label':`Canais de ${m.technical_id}`},el('div',{className:'channel-head','aria-hidden':'true'},...['Canal','Teste','Nome do canal','Cômodo','Tipo','Usar'].map(t=>el('span',{},t))));
    const details=el('details',{className:'module-details'},el('summary',{},'Detalhes técnicos dos canais'),el('p',{},'Tipo, uso e cômodo alteram entidades do Home Assistant e podem afetar automações. Editar não envia ON/OFF. Padrão do módulo permite herdar a área do dispositivo.'));
    for(const c of m.channels){
      const use=el('input',{type:'checkbox',checked:c.enabled,'aria-label':`R${c.number} utilizado`,onchange:e=>{c.enabled=e.target.checked;this.changed(true);}});
      const type=el('select',{'aria-label':`Tipo R${c.number}`,onchange:e=>{c.entity_type=e.target.value;this.changed(true);}},el('option',{value:''},'Selecionar'),el('option',{value:'light'},'Luz'),el('option',{value:'switch'},'Switch'));type.value=c.entity_type;
      const display=el('input',{value:c.display_name,maxLength:120,'aria-label':`Nome R${c.number}`,oninput:e=>{c.display_name=e.target.value;this.changed();},onblur:()=>this.save()});
      const area=el('select',{'aria-label':`Cômodo R${c.number}`,onchange:e=>{c.area_id=e.target.value||null;this.changed(true);}},el('option',{value:''},'Padrão do módulo'),...(this.data.areas||[]).map(a=>el('option',{value:a.area_id},a.name)));
      if(c.area_id && !(this.data.areas||[]).some(a=>a.area_id===c.area_id))area.append(el('option',{value:c.area_id},'Área removida · selecione outra'));
      area.value=c.area_id||'';
      const live=current?.channels[c.number-1]||c;
      details.append(el('div',{className:'technical-row'},el('strong',{},`R${c.number} · ${c.unique_id}`),el('code',{},`Entidade: ${c.entity_id||'ainda não criada'}`),el('code',{},`Estado: ${live.state}`),el('code',{},`Tópico de estado: ${c.topics?.state_topic||''}`),el('code',{},`Comando: ${c.topics?.command_topic||''}`),el('code',{},`Disponibilidade: ${c.topics?.availability_topic||''}`)));
      const test=el('div',{className:'test-control','data-test':c.number});this.fillTest(test,current||m,live);
      channels.append(el('article',{className:'channel'},el('div',{className:'position'},`R${c.number}`),test,el('label',{className:'channel-name'},el('span',{className:'sr'},'Nome do canal'),display),el('label',{className:'channel-area'},el('span',{className:'sr'},'Cômodo'),area),el('label',{className:'channel-type'},el('span',{className:'sr'},'Tipo'),type),el('label',{className:'inline channel-use'},use,el('span',{},'Usar'))));
    }
    main.append(channels,details);this.updateSaveStatus();
  }
}
if (!customElements.get('smart-house-dingtian-panel')) customElements.define('smart-house-dingtian-panel', DingtianPanel);
