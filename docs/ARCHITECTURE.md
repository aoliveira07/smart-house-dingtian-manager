# Arquitetura

O núcleo puro (`models`, `mqtt_discovery`, `manager`) depende de uma porta de infraestrutura. `HAPort` conecta Store, MQTT, registros de entidades/dispositivos e eventos do HA. A API WebSocket é autenticada e exige administrador também para leitura; o painel não contém segredos.

O Store versão 1 guarda UUIDs, sequência monotônica, revisão desejada/aplicada, fichas e tópicos possuídos. Não existe versão predecessora a importar: versões incompatíveis falham com erro explícito. O lock global serializa inclusive módulos diferentes, impedindo colisões de serial/sequência e interleaving entre comandos e alterações estruturais.

## Reconciliação

1. Validação integral, conflitos de registro/discovery e revisão.
2. Intenção desejada e renomeações pendentes persistidas atomicamente pelo Store.
3. Remoção dos configs possuídos que não pertencem ao estado desejado; confirmação de eco pelo broker e ausência da entidade antiga.
4. Registro de propriedade persistido **antes** de cada publicação nova; eco e criação no registro do HA confirmados.
5. Nomes explícitos aplicados via APIs de registro, IDs efetivos consultados e revisão aplicada persistida.

Payloads serializados deterministicamente evitam publicações idênticas em tentativas normais. Inicialização/reconexão pode forçar rediscovery. Em falha, o diário continua suficiente para retomar; backoff de 1 até 60 segundos e ação manual no painel. Nenhum retry contém comandos físicos.

QoS 1 do Discovery confirma transporte; o eco confirma recepção pelo broker. A verificação do registro diferencia publicação de criação efetiva. QoS 0 e `retain: false` são exclusivos do caminho de operação individual. Estado não é atualizado por comandos: somente mensagens MQTT válidas atualizam a exibição.

## Conflitos e limites da detecção

São verificados `unique_id` em ambos os domínios, ID proposto/anterior ocupado, configs MQTT ativos no HA e mensagens Discovery observadas (inclusive componentes de device discovery). Um registro só é considerado próprio quando o dispositivo contém o identificador UUID deste módulo. Configs de terceiros não são adotados ou apagados.

A detecção não é um inventário universal do broker: configurações não retidas, outro prefixo Discovery não carregado no HA, controladores externos e tópicos nunca anunciados podem não ser visíveis. O administrador precisa conferir o legado e o discovery nativo antes do piloto. O gerenciador não bloqueia outros administradores de criar novas duplicações simultaneamente fora dele.

## Nomes e IDs

Nomes personalizados no registro têm precedência ao consultar o painel. Alteração explícita de nome pelo gerenciador gera intenção persistida e atualiza `name`/`name_by_user` pelas APIs; restart lê personalizações externas sem sobrescrevê-las. O detalhe mostra também o nome efetivamente apresentado pelo HA, que pode combinar nome de dispositivo e entidade conforme as regras da plataforma MQTT.

Os IDs técnicos são reservados, não derivados de rótulos. `default_entity_id` propõe o ID inicial ou o último por domínio; o registro real é consultado. Uma colisão posterior à validação mantém sincronização pendente, exigindo resolução, em vez de aceitar silenciosamente um sufixo.

## Superfície WebSocket

`smart_house_dingtian/request`: ações `list`, `get`, `create`, `save`, `delete`, `reconcile`, `operate`, `prepare_remove`. As mutações usam `revision`, `data` e, para impacto destrutivo/operação, `confirmed: true`.

`smart_house_dingtian/subscribe`: avisos de mudança; o cliente consulta snapshot atualizado sem sobrescrever rascunho sujo. Desconectar o painel cancela a assinatura. Diagnósticos públicos contêm somente contagens e status, sem serial, nomes ou tópicos.

## Referências oficiais verificadas

- [MQTT e Discovery](https://www.home-assistant.io/integrations/mqtt/)
- [Painéis customizados](https://developers.home-assistant.io/docs/frontend/custom-ui/creating-custom-panels/)
- [API WebSocket](https://developers.home-assistant.io/docs/frontend/extending/websocket-api/)
- [Código MQTT HA 2026.9.2](https://github.com/home-assistant/core/tree/2026.9.2/homeassistant/components/mqtt)
- [Registro automático de painel na versão alvo](https://github.com/home-assistant/core/blob/2026.9.2/homeassistant/components/panel_custom/__init__.py)
- [Requisitos HACS](https://www.hacs.xyz/docs/publish/integration/)
