# Evidências de execução

Execução em 14/09/2026. [CI aprovado de referência](https://github.com/aoliveira07/smart-house-dingtian-manager/actions/runs/34855162416), commit `b7e723dabfd56be4b6bf8f0c70fbaa819b059c8b`. A publicação da release repete os mesmos jobs no commit da tag e só ocorre se todos passarem; o link dessa execução fica nas notas da release.

| Verificação | Ambiente | Resultado |
|---|---|---|
| Núcleo, protocolo, identidades, falhas, concorrência e limpeza seletiva | Windows/Python 3.12.14 e Ubuntu/Python 3.14.7 | **26 passaram** |
| Web Component: vazio, páginas 8/16/32, XSS, rascunho, confirmação e lote | Node 24.19.0 local / Node 22 no CI; happy-dom 20.14.5 | **5 passaram** |
| Config flow e instância única; painel automático/unload; ciclo MQTT e registros; WebSocket não admin | HA Core **2026.9.2**, Python **3.14.7**, Ubuntu 24.04, pytest 9.0.3 | **4 passaram** |
| Lint/formatação e build embarcado | Ruff 0.16.7, Node.js | Aprovados |
| Manifest, metadados e HACS | hacs/action | Aprovados; catálogo padrão não solicitado |
| ZIP HACS/manual, arquivos obrigatórios e frontend incluído | scripts/package.py | Aprovados |
| npm audit das dependências de desenvolvimento | happy-dom atualizado para 20.14.5 | 0 vulnerabilidades reportadas na execução |
| Inspeção de UI desktop e 390×844 | Navegador, host visual isolado com dados fictícios | Layout e salvamento conferidos |

**Total: 35 testes automatizados.** O CI executa Home Assistant e as plataformas MQTT reais; somente transporte de rede/heartbeat do cliente MQTT são simulados. As publicações são capturadas: cadastro, renomeação e reconciliação não enviam comandos; o comando explícito tem tópico exato, QoS 0 e `retain: false`. O estado permanece não otimista.

O teste de ciclo completo também verifica personalização de nome e entity_id pelo HA, preservação na reconciliação e recuperação do ID anterior ao retornar de switch para light. O fixture de transporte não inicia socket físico nem broker residencial.

## Correções encontradas durante validação

- O schema `default` do exemplo do handoff é rejeitado por HA 2026.9.2; corrigido para `basic`.
- O ambiente Linux de teste precisou do frontend oficial `20260826.7`, além do pacote Core.
- O HACS exigiu tópicos no repositório; metadados públicos foram preenchidos.
- Foram corrigidos o caminho de imports do teste Linux e o encerramento do heartbeat do transporte simulado.

## Ainda depende do piloto

Instalação interativa pelo HACS/HA OS, atualização de uma instalação existente, rotação real de dispositivo móvel, histórico/automações particulares, mensagens efetivas do hardware, reinício do broker físico e acionamento observado das cargas. O setup da integração foi executado no HA de teste; o HA da residência não foi acessado.

**Homologação física: não executada.** Seguir `TEST_PLAN.md`. A beta não promete importação de YAML, reconstrução automática de referências ou detecção universal de outros controladores do broker.
