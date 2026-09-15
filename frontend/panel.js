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
 main{padding-top:14px}h1{font-size:23px;margin-bottom:0}.eyebrow,header p.muted{display:none}.bar{margin:12px 0}.back-modules{margin-top:0;padding:6px 12px}.filter-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:12px 0;padding:10px 12px;background:var(--card-background-color,#fff);border:1px solid var(--divider-color,#dbe3e6);border-radius:10px}.filter-bar label{min-width:180px;flex:1;max-width:260px}.filter-bar .count{flex:1;min-width:200px}.filter-bar .actions button{font-size:13px;padding:8px 12px}.relay-switch{width:44px;height:44px;border-radius:50%;padding:0;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--divider-color,#bdcdd2);background:var(--secondary-background-color,#e7ecee);font-size:24px;color:var(--secondary-text-color,#60747d)}.relay-switch[aria-checked=true],.relay-switch:not([role])[data-power=ON]{background:var(--primary-color,#087f8c);color:white}.relay-switch:not([role])[data-power=OFF]{background:var(--secondary-background-color,#e7ecee)}.module-header{margin:10px 0}.module-header h2{font-size:19px}.save-bar{margin:4px 0}.helper{margin:4px 0 8px}@media(max-width:760px){.filter-bar{gap:8px;padding:8px}.filter-bar label{max-width:none;min-width:100%;}.filter-bar .actions{width:100%}.filter-bar .actions button{flex:1}h1{font-size:22px}}
 :host{--primary-background-color:#10232a;--card-background-color:#183039;--secondary-background-color:#213e49;--primary-text-color:#eef7f8;--secondary-text-color:#b1cbd2;--divider-color:#375763;--primary-color:#76d4e2;--text-primary-color:#102b34;--success-color:#9de4d4;--error-color:#ffb4b4;color-scheme:dark}.channel,.channel-head{grid-template-columns:80px 220px minmax(130px,1.4fr) minmax(120px,1fr) 100px 50px;gap:12px}.test-control .direct-control{display:flex;gap:0;width:100%}.test-control .direct-control button{flex:1;min-height:44px;border-radius:8px 0 0 8px;background:var(--secondary-background-color);padding:8px 10px;font-size:13px}.test-control .direct-control button+button{border-radius:0 8px 8px 0;border-left:0}.module-header .badge{display:none}.channel .position{font-size:13px;white-space:nowrap}.module-row{background:var(--card-background-color)}@media(max-width:1000px) and (min-width:761px){.channel,.channel-head{grid-template-columns:70px 180px minmax(100px,1fr) minmax(110px,1fr) 85px 40px;gap:8px}}@media(max-width:760px){.channel{grid-template-columns:70px minmax(0,1fr);gap:10px}.channel .position{grid-column:1;grid-row:1}.channel .test-control{grid-column:2;grid-row:1;width:100%;justify-self:stretch}.channel .channel-name{grid-column:1/-1;grid-row:2}.channel .channel-area{grid-column:1/-1;grid-row:3}.channel .channel-type{grid-column:1;grid-row:4}.channel .channel-use{grid-column:2;grid-row:4}.test-control .direct-control button{font-size:12px;padding:6px}}

 header{display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;padding-bottom:16px;margin-bottom:18px;border-bottom:1px solid var(--divider-color)}header>.primary,header>.back-modules{justify-self:end}.header-center{text-align:center}.header-center h2{font-size:22px;margin:0}.header-center p{margin:2px 0 0}.channel,.channel-head,.filter-bar{grid-template-columns:80px 124px minmax(140px,1.4fr) minmax(150px,1fr) 100px 50px;gap:14px}.filter-bar{display:grid;background:transparent;border:0;padding:4px 14px;margin:8px 0 12px}.filter-bar .selection-actions{grid-column:1/4;justify-content:flex-start;min-width:0}.filter-bar label{grid-column:4;max-width:none;min-width:0;width:100%}.command-toggle{width:124px;min-height:44px;background:#414e55;color:var(--primary-text-color);font-size:14px;padding:8px}.command-toggle[aria-pressed=true]{background:var(--primary-color);color:var(--text-primary-color);border-color:transparent}.save-bar{min-height:20px}.helper{margin-bottom:8px}
 @media(max-width:1000px) and (min-width:761px){.channel,.channel-head,.filter-bar{grid-template-columns:65px 124px minmax(100px,1fr) minmax(120px,1fr) 85px 40px;gap:8px}}
 @media(max-width:760px){header{grid-template-columns:1fr auto;gap:12px}header h1{font-size:20px}.header-center{grid-column:1/-1;grid-row:2;text-align:left}.header-center h2{font-size:19px}header>.primary,header>.back-modules{grid-column:2;grid-row:1;font-size:12px;padding:8px}.filter-bar{display:flex;flex-wrap:wrap;padding:0}.filter-bar label{order:0;min-width:100%}.filter-bar .selection-actions{order:1;width:100%}.channel{grid-template-columns:70px minmax(0,1fr);gap:10px}.command-toggle{width:124px}.channel .test-control{justify-self:start}.save-bar{position:static}.channel .channel-type{min-width:110px}}

 :host{--module-action-width:224px}.module-row .actions{width:var(--module-action-width);gap:6px}.module-row .actions .primary{width:124px;flex:none}.module-row .icon-button{width:44px;flex:none}.overview-action{width:var(--module-action-width);height:44px}.export-bar{justify-content:flex-end;padding-right:16px}header>.overview-action{margin-right:16px}.filter-bar{display:flex;flex-wrap:nowrap;justify-content:space-between;align-items:center;gap:16px;margin:4px 0 10px;padding:0 14px;min-height:44px}.filter-bar .selection-actions{width:auto;flex:none;gap:8px}.filter-bar label{display:flex;flex-direction:row;align-items:center;gap:12px;width:auto;min-width:0;max-width:none;flex:none;margin-left:auto;white-space:nowrap}.filter-bar select{width:280px;max-width:100%}.channels{margin-top:8px}
 @media(max-width:760px){header:has(.overview-action){grid-template-columns:1fr}header>.overview-action{grid-column:1;grid-row:3;margin-right:12px}.export-bar{padding-right:12px}.module-row .serial{max-width:calc(100% - 230px)}.filter-bar{overflow-x:auto;justify-content:flex-start;padding:0 0 4px;gap:12px}.filter-bar label{order:1;min-width:0;flex:none;gap:8px;margin-left:auto;font-size:12px}.filter-bar .selection-actions{order:0;width:auto;flex:none}.filter-bar .actions button{flex:none;white-space:nowrap}.filter-bar select{width:180px}.filter-bar .selection-actions[hidden]+label{margin-left:0}}
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
    this.dirty = false; this.busy = false; this.error = ''; this.active = ''; this.loaded = false; this.localPending = new Set(); this.commandStates = new Map(); this.feedbackTimers = new Set();
    this.editorId=`${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {this.editorId=window.sessionStorage.getItem(`${DOMAIN}:editor`) || this.editorId;window.sessionStorage.setItem(`${DOMAIN}:editor`,this.editorId);}catch{}
    this.onPop = () => this.readRoute();
    this.saveMessage = 'Salvo'; this.saveError = ''; this.saving = null; this.areaFilter=null; this.search=''; this.groupBusy=false; this.groupMessage='';
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
    clearTimeout(this.refreshTimer); clearTimeout(this.saveTimer); for(const timer of this.feedbackTimers)clearTimeout(timer);this.feedbackTimers.clear(); document.removeEventListener('visibilitychange', this.onHidden); window.removeEventListener('popstate', this.onPop);
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
  config(m) {return {module_uuid:m.module_uuid,channels:m.channels.map(c=>({number:c.number,display_name:c.display_name,entity_type:c.entity_type,enabled:c.enabled,area_id:c.area_id??null}))};}
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
        // Module identity is edited only from the overview dialog.
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
    if(node){node.textContent=this.saveError || this.cacheError || '';node.dataset.error=String(Boolean(this.saveError||this.cacheError));node.dataset.pending=String(this.dirty);}
    const saveBar=this.shadowRoot.querySelector('.save-bar');if(saveBar)saveBar.hidden=!(this.saveError||this.cacheError);
    const retry=this.shadowRoot.querySelector('[data-retry]');if(retry)retry.hidden=!this.saveError;
    const title=this.shadowRoot.querySelector('[data-title]');if(title)title.textContent=this.draft?.display_name || 'Módulo';
    const count=this.shadowRoot.querySelector('[data-used]');if(count)count.textContent=`${this.draft.channels.filter(c=>c.enabled).length} de ${this.draft.channel_count} saídas utilizadas`;
    this.updateStates();
  }
  testWarning() {return false;}
  routePath(mid) {return this.ingress ? (mid?`#/modules/${mid}`:'#/') : (mid?`${ROOT}/modules/${mid}`:ROOT);}
  updateStates() {
    const message=this.shadowRoot.querySelector('[data-message]');if(message){message.hidden=!this.error;message.textContent=this.error;}
    const sync=this.shadowRoot.querySelector('[data-sync]');if(sync){sync.hidden=!this.data?.error;sync.querySelector('p').textContent=this.data?.error||'';}
    this.updateFilter();
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
    const pending=this.localPending.has(c.number);
    const allowed=this.data.broker_connected&&!this.data.error&&!this.busy&&!this.groupBusy&&!this.saving&&!this.dirty&&!pending&&this.editRevision===this.data.revision;
    const key=`${m.module_uuid}:${m.serial}:${c.number}`;
    const command=this.commandStates.get(key);
    const optimistic=command && Date.now()<command.until;
    const fresh=!command||(c.state_version??0)!==command.version;
    const state=optimistic?command.payload:fresh?c.state:'unknown';
    const known=state==='ON'||state==='OFF';
    const on=state==='ON';
    const signature=JSON.stringify([pending,allowed,on,known,optimistic]);
    if(node.dataset.signature===signature)return;
    node.dataset.signature=signature;
    const b=button(on?'Ligado':'Desligado',()=>this.testRelay(m,c,on?'OFF':'ON'),'command-toggle');
    b.setAttribute('aria-label',`${on?'Desligar':'Ligar'} saída ${c.number}`);
    b.setAttribute('aria-pressed',String(on));
    b.disabled=!allowed;
    node.replaceChildren(b);
  }
  rememberCommand(m,number,payload) {
    this.commandStates.set(`${m.module_uuid}:${m.serial}:${number}`,{payload,until:Date.now()+2000,version:m.channels[number-1]?.state_version??0});
    const timer=setTimeout(()=>{this.feedbackTimers.delete(timer);this.updateStates();this.load();},2050);
    this.feedbackTimers.add(timer);
  }
  async testRelay(m,c,payload) {
    if(this.dirty||this.saving||this.busy||this.groupBusy||this.localPending.has(c.number))return;
    this.localPending.add(c.number);this.rememberCommand(m,c.number,payload);this.updateStates();
    try{
      await this.api('command',{module_uuid:m.module_uuid,number:c.number,payload},true);
      this.error='';
    }catch(e){this.commandStates.delete(`${m.module_uuid}:${m.serial}:${c.number}`);this.error=e.message||String(e);}
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
      dialog.close();if(this.data.revision!==reviewedRevision){await this.retrySave();return;}merged.channels.forEach((c,i)=>Object.assign(this.draft.channels[i],c));
      this.editRevision=this.data.revision;this.base=this.config(latest);this.rememberDraft();this.render();await this.save();
    },'primary')));
    dialog.addEventListener('close',()=>dialog.remove());this.shadowRoot.append(dialog);dialog.showModal();
  }
  editModule(m) {
    const dialog=el('dialog'),form=el('form');
    const name=el('input',{value:m.display_name,required:true,maxLength:120,'aria-label':'Nome do módulo'});
    const serial=el('input',{value:m.serial,required:true,pattern:'[0-9]{1,64}',maxLength:64,inputMode:'numeric','aria-label':'Número de série'});
    const error=el('p',{role:'alert'});
    const revision=this.data.revision;
    const submit=el('button',{type:'submit',className:'primary'},'Salvar módulo');
    form.append(el('h2',{},'Editar módulo'),el('label',{},'Nome do módulo',name),el('label',{},'Número de série',serial),el('p',{className:'helper'},'Ao substituir o módulo, informe o novo serial. Os canais, nomes e cômodos serão mantidos.'),error,el('div',{className:'actions'},button('Cancelar',()=>dialog.close()),submit));
    form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;
      try{const result=await this.hass.callWS({type:`${DOMAIN}/request`,action:'edit_module',revision,confirmed:true,data:{module_uuid:m.module_uuid,display_name:name.value,serial:serial.value}});this.data=result;dialog.close();this.resetDraft();this.render();}
      catch(e){error.textContent=e.message||String(e);submit.disabled=false;}
    });
    dialog.append(form);dialog.addEventListener('close',()=>dialog.remove());this.shadowRoot.append(dialog);dialog.showModal();name.focus();
  }
  matchesArea(m,c) {return this.areaFilter===null || (c.area_id || m.area_id || '')===this.areaFilter;}
  selectedModules() {return Object.values(this.data?.modules||{}).filter(m=>!m.deleted && (!this.active || m.module_uuid===this.active) && (this.active || `${m.display_name} ${m.serial} ${m.technical_id}`.toLocaleLowerCase().includes(this.search)));}
  selectedChannels(m) {return m.channels.filter(c=>c.enabled&&this.matchesArea(m,c));}
  filterBar(main) {
    const select=el('select',{'aria-label':'Filtrar por cômodo',onchange:e=>{this.areaFilter=e.target.value==='*'?null:e.target.value;this.groupMessage='';this.updateFilter();}},el('option',{value:'*'},'Todos os cômodos'),el('option',{value:''},'Sem cômodo'),...(this.data.areas||[]).map(a=>el('option',{value:a.area_id},a.name)));select.value=this.areaFilter??'*';
    main.append(el('section',{className:'filter-bar'},el('div',{className:'actions selection-actions',title:'Aciona somente as saídas marcadas como Usar neste filtro.'},button('Ligar seleção',()=>this.operateGroup('ON'),'group-on'),button('Desligar seleção',()=>this.operateGroup('OFF'),'group-off')),el('label',{},'Filtrar por cômodo',select)),el('p',{'data-group-message':'',className:'helper',role:'status'},this.groupMessage));
  }
  updateFilter() {
    if(!this.data)return;
    const mods=this.selectedModules(), channels=mods.flatMap(m=>this.selectedChannels(m));
    const summary=this.shadowRoot.querySelector('[data-summary]');
    if(summary)summary.textContent=`${channels.filter(c=>c.entity_type==='light').length} luzes · ${channels.length} entradas em uso`;
    const actions=this.shadowRoot.querySelector('.selection-actions');if(actions)actions.hidden=this.areaFilter===null;
    const current=this.draft;
    for(const row of this.shadowRoot.querySelectorAll('[data-channel]'))row.hidden=current?!this.matchesArea(current,current.channels[Number(row.dataset.channel)-1]):false;
    const blocked=!channels.length||this.dirty||this.saving||this.busy||this.groupBusy||this.localPending.size||this.data.error||!this.data.broker_connected;
    for(const b of this.shadowRoot.querySelectorAll('.group-on,.group-off'))b.disabled=Boolean(blocked);
    const message=this.shadowRoot.querySelector('[data-group-message]');if(message){message.textContent=this.groupMessage;message.hidden=!this.groupMessage;}
  }
  async operateGroup(payload) {
    if(!this.active||this.areaFilter===null||this.groupBusy||this.dirty||this.saving||this.busy||this.localPending.size)return;
    const ids=this.selectedModules().filter(m=>this.selectedChannels(m).length).map(m=>m.module_uuid);
    if(!ids.length)return;
    const baselines=new Map(ids.map(id=>[id,structuredClone(this.data.modules[id])]));
    this.groupBusy=true;this.groupMessage='';this.updateStates();
    try{const result=await this.api('operate_group',{module_ids:ids,area_id:this.areaFilter,payload},true);this.groupMessage=result.error||'';for(const item of result.sent||[]){const mod=this.data.modules[item.module_uuid];if(mod)this.rememberCommand(baselines.get(item.module_uuid)||mod,item.number,payload);}}
    catch(e){this.groupMessage=e.message||String(e);}
    finally{this.groupBusy=false;await this.load();this.updateStates();}
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
    if(this.active)main.querySelector('header').append(button('← Voltar aos módulos',()=>this.navigate(''),'back-modules'));

    main.append(el('div', {className:'notice',role:'alert','data-message':'',hidden:!this.error}, this.error));
    main.append(el('div', {className:'notice error',role:'alert','data-sync':'',hidden:!this.data.error}, el('p', {}, this.data.error||''), button('Tentar sincronizar', () => this.perform('reconcile'))));
    if (!this.data.broker_connected) main.append(el('div',{className:'notice',role:'status'},'Broker MQTT desconectado. Não é possível enviar comandos ou remover entidades.'));
    if (this.data.prepared_removal) main.append(el('div',{className:'notice'},'Preparação para remoção concluída somente quando não houver pendências. Depois, desinstale o aplicativo pela tela Aplicativos (ou a integração, se estiver usando a versão anterior).'));
    if (!this.active) this.renderOverview(main, modules); else if (this.draft) this.renderModule(main); else main.append(el('p', {}, 'Módulo não encontrado.'), button('Voltar aos módulos', () => this.navigate('')));
    if (this.busy) for (const b of root.querySelectorAll('button,input,select')) b.disabled = true;
  }
  renderOverview(main, modules) {
    main.querySelector('header').append(el('div',{className:'header-center'},el('h2',{},'Módulos'),el('span',{className:'count'},`${modules.length} cadastrados · ${modules.reduce((a,m)=>a+m.used_count,0)} canais utilizados`)),button('+ Adicionar módulo',()=>this.addDialog(),'primary overview-action'));
    if (!modules.length) main.append(el('section',{className:'empty'},el('div',{className:'symbol','aria-hidden':'true'},'▦'),el('h2',{},'Comece pelo primeiro módulo'),el('p',{className:'muted'},'Cadastre o serial e a capacidade. Depois, escolha os canais utilizados.'),button('Adicionar módulo',()=>this.addDialog(),'primary')));
    const grid=el('div',{className:'module-list'});
    const icon=(path)=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('aria-hidden','true');const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',path);svg.append(p);return svg;};
    for (const m of modules){
      const edit=button('',()=>this.editModule(m),'icon-button');edit.title=`Editar módulo ${m.display_name}`;edit.setAttribute('aria-label',edit.title);edit.append(icon('M14 5l5 5M4 20l4-1L20 7a2 2 0 0 0-4-4L4 15v5Z'));
      const remove=button('',()=>{if(window.confirm(`Remover ${m.technical_id} e ${m.used_count} entidade(s)? Automações podem ser afetadas. Nenhum OFF será enviado.`))this.perform('delete',{module_uuid:m.module_uuid},true);},'icon-button danger');remove.title=`Remover ${m.display_name}`;remove.setAttribute('aria-label',remove.title);remove.append(icon('M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7'));
      grid.append(el('article',{className:'module-row','data-module':m.module_uuid,'data-search':`${m.display_name} ${m.serial} ${m.technical_id}`.toLocaleLowerCase()},el('div',{className:'module-title'},el('h3',{},m.display_name),el('span',{className:`badge ${m.availability}`},statusLabel(m.availability))),el('div',{className:'meta-item serial'},el('small',{},'Serial'),el('strong',{},m.serial)),el('div',{className:'meta-item usage'},el('small',{},'Utilização'),el('strong',{},`${m.used_count} de ${m.channel_count}`)),el('div',{className:'actions'},button('Abrir saídas',()=>this.navigate(m.module_uuid),'primary'),edit,remove)));
    }

    main.append(grid);this.updateFilter();
    main.append(el('div',{className:'bar export-bar'},button('Exportar para Excel',()=>this.exportInventory(),'primary overview-action')));
  }
  async exportInventory() {
    try{
      const data=await this.api('list');
      const rows=[['Nome do módulo','Saída do módulo','Nome','Cômodo','Tipo']];
      const areas=new Map((data.areas||[]).map(a=>[a.area_id,a.name]));
      for(const m of Object.values(data.modules||{}).filter(m=>!m.deleted)){
        for(const c of m.channels)rows.push([m.display_name,`Saída ${c.number}`,c.display_name,areas.get(c.area_id||m.area_id)||'',c.entity_type==='light'?'Luz':'Switch']);
      }
      const url=URL.createObjectURL(new Blob([excelWorkbook(rows)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
      const a=el('a',{href:url,download:'Organização cabeados.xlsx'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(e){this.error=e.message||String(e);this.render();}
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
    const current=this.data.modules[this.active];
    const center=el('div',{className:'header-center'},el('h2',{'data-title':''},m.display_name),el('p',{className:'count'},`Serial ${m.serial} · `,el('span',{'data-used':''},`${m.channels.filter(c=>c.enabled).length} de ${m.channel_count} saídas utilizadas`)));
    main.querySelector('header').insertBefore(center,main.querySelector('.back-modules'));
    this.filterBar(main);
    const retry=button('Revisar / tentar novamente',()=>this.retrySave());retry.dataset.retry='';retry.hidden=!this.saveError;
    main.append(el('div',{className:'save-bar',hidden:!(this.saveError||this.cacheError)},el('span',{className:'save-status','data-dirty':'',role:'status','aria-live':'polite'},this.saveError||this.cacheError||''),retry));
    const channels=el('section',{className:'channels','aria-label':`Canais de ${m.technical_id}`},el('div',{className:'channel-head','aria-hidden':'true'},...['Saída','Comando','Nome','Cômodo','Tipo','Usar'].map(t=>el('span',{},t))));
    for(const c of m.channels){
      const use=el('input',{type:'checkbox',checked:c.enabled,'aria-label':`R${c.number} utilizado`,onchange:e=>{c.enabled=e.target.checked;this.changed(true);}});
      const type=el('select',{'aria-label':`Tipo R${c.number}`,onchange:e=>{c.entity_type=e.target.value;this.changed(true);}},el('option',{value:''},'Selecionar'),el('option',{value:'light'},'Luz'),el('option',{value:'switch'},'Switch'));type.value=c.entity_type;
      const display=el('input',{value:c.display_name,maxLength:120,'aria-label':`Nome R${c.number}`,oninput:e=>{c.display_name=e.target.value;this.changed();},onblur:()=>this.save()});
      const area=el('select',{'aria-label':`Cômodo R${c.number}`,onchange:e=>{c.area_id=e.target.value||null;this.changed(true);}},el('option',{value:''},'Sem cômodo'),...(this.data.areas||[]).map(a=>el('option',{value:a.area_id},a.name)));
      if(c.area_id && !(this.data.areas||[]).some(a=>a.area_id===c.area_id))area.append(el('option',{value:c.area_id},'Área removida · selecione outra'));
      area.value=c.area_id||'';
      const live=current?.channels[c.number-1]||c;
      const test=el('div',{className:'test-control','data-test':c.number});this.fillTest(test,current||m,live);
      channels.append(el('article',{className:'channel','data-channel':c.number},el('div',{className:'position'},`Saída ${c.number}`),test,el('label',{className:'channel-name'},el('span',{className:'sr'},'Nome do canal'),display),el('label',{className:'channel-area'},el('span',{className:'sr'},'Cômodo'),area),el('label',{className:'channel-type'},el('span',{className:'sr'},'Tipo'),type),el('label',{className:'inline channel-use'},use,el('span',{},'Usar'))));
    }
    main.append(channels);this.updateSaveStatus();
  }
}
if (!customElements.get('smart-house-dingtian-panel')) customElements.define('smart-house-dingtian-panel', DingtianPanel);

// Small uncompressed OOXML workbook. Inline strings keep names literal, never formulas.
export function excelWorkbook(rows) {
  const xml=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const base='http'+':/'+'/schemas.openxmlformats.org/';
  const files={
    '[Content_Types].xml':`<Types xmlns="${base}package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    '_rels/.rels':`<Relationships xmlns="${base}package/2006/relationships"><Relationship Id="rId1" Type="${base}officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml':`<workbook xmlns="${base}spreadsheetml/2006/main" xmlns:r="${base}officeDocument/2006/relationships"><sheets><sheet name="Saídas" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels':`<Relationships xmlns="${base}package/2006/relationships"><Relationship Id="rId1" Type="${base}officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    'xl/worksheets/sheet1.xml':`<worksheet xmlns="${base}spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="26" customWidth="1"/><col min="2" max="2" width="20" customWidth="1"/><col min="3" max="3" width="36" customWidth="1"/><col min="4" max="4" width="24" customWidth="1"/><col min="5" max="5" width="14" customWidth="1"/></cols><sheetData>${rows.map((row,i)=>`<row r="${i+1}">${row.map((v,j)=>`<c r="${String.fromCharCode(65+j)}${i+1}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`).join('')}</row>`).join('')}</sheetData><autoFilter ref="A1:E${Math.max(1,rows.length)}"/></worksheet>`
  };
  const encoder=new TextEncoder(), parts=[],central=[];let offset=0;
  const pack=(size,values)=>{const bytes=new Uint8Array(size),view=new DataView(bytes.buffer);for(const [at,value,width] of values)width===2?view.setUint16(at,value,true):view.setUint32(at,value,true);return bytes;};
  for(const [name,text] of Object.entries(files)){
    const n=encoder.encode(name),data=encoder.encode(text);let crc=0xffffffff;
    for(const byte of data){crc^=byte;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}crc=(crc^0xffffffff)>>>0;
    const local=pack(30,[[0,0x04034b50,4],[4,20,2],[12,33,2],[14,crc,4],[18,data.length,4],[22,data.length,4],[26,n.length,2]]);
    parts.push(local,n,data);
    central.push(pack(46,[[0,0x02014b50,4],[4,20,2],[6,20,2],[14,33,2],[16,crc,4],[20,data.length,4],[24,data.length,4],[28,n.length,2],[42,offset,4]]),n);
    offset+=local.length+n.length+data.length;
  }
  const centralSize=central.reduce((n,p)=>n+p.length,0),count=Object.keys(files).length;
  parts.push(...central,pack(22,[[0,0x06054b50,4],[8,count,2],[10,count,2],[12,centralSize,4],[16,offset,4]]));
  const result=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const part of parts){result.set(part,at);at+=part.length;}return result;
}
