# Arquitetura — aplicativo 1.0.0

## Componentes

O contexto Docker `dingtian_manager/` contém servidor aiohttp, frontend estático e núcleo puro gerado do código compartilhado. A instalação não grava em `/config`, não instala integração companheira, não exige HACS e não reinicia o Core. O Dockerfile tem base explícita, suporta amd64/arm64 e não publica portas externas.

`HAClient` autentica no WebSocket `ws://supervisor/core/websocket` com `SUPERVISOR_TOKEN`. O backend usa `mqtt/subscribe` e `mqtt.publish` do HA: existe apenas a conexão MQTT já mantida pelo Core. Não recebe nem guarda credenciais de broker. A API REST interna de diagnostics MQTT fornece conexão, configuração efetiva e configurações ativas para detecção de conflito; esses dados não são expostos ao navegador nem aos logs do aplicativo.

Registros de entidades/dispositivos são consultados por APIs WebSocket do HA. Nomes externos e IDs efetivos são preservados. O teste Linux exercita essas APIs de verdade com Core 2026.9.2 e somente o transporte MQTT substituído por mock.

## Autorização e ciclo de vida

Ingress aceita apenas peer TCP `172.30.32.2`. O `X-Remote-User-Id` inserido pelo Supervisor é verificado contra usuários ativos administradores do HA em cada requisição. `panel_admin` não substitui essa verificação. POST requer JSON e cabeçalho próprio, sem CORS. Arquivos estáticos têm allowlist. Tokens nunca chegam ao JS.

O monitor consulta HA/MQTT, recupera assinaturas e sincroniza Discovery após reconexão. Requisições possuem timeout e nunca são repetidas pelo cliente. O frontend consulta snapshots a cada dois segundos; o recebimento MQTT e a confirmação de teste ocorrem no backend. Assinaturas são compartilhadas entre navegadores, liberadas ao remover módulos ou encerrar a conexão. A aplicação encerra tarefas/temporizadores ao parar.

## Inventário transacional

O núcleo usa um lock único para alterações e comandos. Revisões impedem ações de formulários antigos. O servidor resolve serial, base e canal pelo cadastro salvo, nunca por tópicos livres do navegador. Serial/capacidade/base ficam fixos após o cadastro.

A escrita de `/data/inventory.json` usa arquivo temporário, flush/fsync, substituição atômica e fsync do diretório em Linux. O diário grava propriedade dos tópicos Discovery antes de publicar. Remoções limpam apenas o namespace próprio; mudanças de domínio/prefixo limpam o anterior antes de recriar. Falhas deixam a intenção pendente para sincronização; inventário inválido não é apagado.

`build_addon.py` gera cópias do núcleo puro e painel; a CI verifica igualdade. Não existe import do pacote `homeassistant` dentro do contêiner do aplicativo. O adaptador nativo permanece disponível apenas para a integração anterior, como compatibilidade.

## Adendo 01

Uma operação de teste valida administrador, revisão, módulo salvo, canal dentro da capacidade, confirmação explícita, ON/OFF, broker e disponibilidade `online`. Não exige entidade, tipo ou uso. Publica exatamente uma vez: QoS 0, retain false. Não há fila de testes, reenvio, pulso ou OFF automático.

A pendência por canal é apenas em memória, com prazo de 15 segundos. A confirmação exige mensagem não retida no tópico da saída, recebida após a solicitação, com o estado desejado. Estado exibido continua vindo do equipamento; ACK ou sucesso HTTP não altera o estado. A ausência de correlação no protocolo significa que essa mensagem confirma o estado recebido, não identifica a carga nem prova causalidade exclusiva do comando.

Offline, desconexão e timeout encerram pendências como resultado não confirmado. Um canal não utilizado pode estar fisicamente ON e permanece visível. Salvar, cancelar, navegar, exportar, importar, atualizar ou iniciar não envia comando de relé. Mudanças de cadastro preservam rascunhos durante testes e observação de estado.

## Migração

A importação aceita JSON de Store da integração anterior ou exportação do aplicativo, somente no destino vazio e com a integração anterior desativada. Preserva UUIDs, sequência, canais e diário. Não há reset, leitura automática de arquivos privados ou coexistência ativa. O Supervisor inclui `/data` no backup frio do aplicativo.

## Referências oficiais

- [Comunicação de aplicativos](https://developers.home-assistant.io/docs/apps/communication/)
- [Ingress e apresentação](https://developers.home-assistant.io/docs/apps/presentation/)
- [Configuração do aplicativo](https://developers.home-assistant.io/docs/apps/configuration/)
- [APIs e diagnóstico MQTT do Core 2026.9.2](https://github.com/home-assistant/core/tree/2026.9.2/homeassistant/components/mqtt)
