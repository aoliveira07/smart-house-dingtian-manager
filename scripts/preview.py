"""Serve ONLY an isolated demo host for visual QA, never a production backend."""

from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = """<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dingtian Manager — teste visual isolado</title><style>html,body{margin:0;height:100%}</style><smart-house-dingtian-panel></smart-house-dingtian-panel><script type="module">
import '/panel.js';
const data={revision:0,applied_revision:0,next_module_number:1,modules:{},broker_connected:true,error:null};
let notify=()=>{};
const component=document.querySelector('smart-house-dingtian-panel');
component.hass={connection:{subscribeMessage:async cb=>{notify=cb;return()=>{};}},callWS:async m=>{
 if(m.action==='create'){
  const n=data.next_module_number++,id=crypto.randomUUID().replaceAll('-','');
  data.modules[id]={...m.data,module_uuid:id,technical_id:`Cabeado${n}`,used_count:0,availability:'unknown',channels:Array.from({length:m.data.channel_count},(_,i)=>({number:i+1,enabled:false,entity_type:'light',display_name:`Saída ${i+1}`,unique_id:`Cabeado${n}-r${i+1}`,last_entity_ids:{},entity_id:null,state:'unknown',topics:{}}))};data.revision++;
 }else if(m.action==='save') {data.modules[m.data.module_uuid]=structuredClone(m.data);data.modules[m.data.module_uuid].used_count=m.data.channels.filter(c=>c.enabled).length;data.revision++;}
 else if(m.action==='delete'){delete data.modules[m.data.module_uuid];data.revision++;}
 else if(m.action==='operate')throw new Error('Operação física não disponível no teste visual.');
 if(m.action!=='list')notify();return structuredClone(data);
}};
</script></html>"""


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/panel.js":
            content = (ROOT / "frontend/panel.js").read_bytes()
            mime = "text/javascript"
        elif self.path.startswith("/smart-house-dingtian") or self.path == "/":
            content, mime = HTML.encode(), "text/html"
        else:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", mime + "; charset=utf-8")
        self.end_headers()
        self.wfile.write(content)


if __name__ == "__main__":
    print("Isolated visual QA at http://127.0.0.1:8765 — no broker", flush=True)
    HTTPServer(("127.0.0.1", 8765), Handler).serve_forever()
