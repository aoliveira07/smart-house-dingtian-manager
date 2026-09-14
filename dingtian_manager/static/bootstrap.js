import './panel.js';
const panel = document.querySelector('smart-house-dingtian-panel');
panel.ingress = true;
panel.hass = {
  callWS: async message => {
    // Relative URL retains the opaque Ingress prefix. The Supervisor token never reaches JS.
    const response = await fetch('./api', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: {'Content-Type': 'application/json', 'X-Dingtian-Request': '1'},
      body: JSON.stringify(message), signal: AbortSignal.timeout(120000),
    });
    const result = await response.json().catch(() => ({error:'Não foi possível acessar o aplicativo. Reabra pelo Home Assistant.'}));
    if (!response.ok || result.error && !('modules' in result)) throw new Error(result.error || 'Operação recusada.');
    return result;
  },
  connection: {subscribeMessage: async callback => {
    const timer = setInterval(callback, 2000);
    return () => clearInterval(timer);
  }},
};
