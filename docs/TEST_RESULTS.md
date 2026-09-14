# Atualização 1.1.2 — nomes das entidades e módulos

Validação local: 46 testes do motor/aplicativo e 15 da interface aprovados; Ruff e geração dos arquivos aprovados. Regressões cobrem nome antes de habilitar, reparo de entidades existentes, nome externo preservado, troca de tipo e duplicidade de módulos sem persistência parcial. Teste com APIs reais do HA verifica friendly_name sem prefixo após habilitar e após reparar registro antigo; execução na CI antes da publicação.

# Atualização 1.1.1 — rascunhos em acesso local

Teste adicional verifica identidade própria de rascunho para cada aba e recuperação após recarga, sem usar `crypto.randomUUID` (restrito a contextos seguros). Total: **41 testes de núcleo/aplicativo + 15 de frontend + 5 de HA = 61**, além dos builds/smoke tests de contêiner.

# Atualização 1.1.0 — UI e cômodos

Validação local: **41 testes de núcleo/aplicativo e 14 testes de interface aprovados**. A CI executa também os 5 testes com HA Core real (transporte MQTT isolado), incluindo seleção/remoção de área pela API e preservação ao trocar o tipo da entidade, além dos dois builds/smoke tests de contêiner. A publicação depende desses jobs.

Regressões de interface: debounce e blur, navegação com flush, edição durante pedido lento, falha de rede com rascunho persistente, recuperação após recarga, conflito entre abas com revisão, configuração de cômodo/tipo/uso sem comandos de relé e toggle direto ON/OFF com estado confirmado pelo equipamento.

Regressões de cômodo no backend: preenchimento antes de habilitar, criação e troca de domínio, persistência após restart, alteração externa no HA, remoção da área própria da entidade, rejeição de área inexistente e recuperação de falha no registro do HA pelo diário de sincronização. Nenhuma dessas operações envia ON/OFF.

## Histórico de validação

# Atualização 1.0.1

Regressão do toggle validada em teste de DOM: clique com estado OFF envia ON; após retorno ON, clique envia OFF; zero chamadas de confirmação, nenhum comando duplicado e estado sem alteração otimista. **9 testes de frontend e 38 de núcleo/aplicativo passaram localmente**. A publicação exige também os 5 testes no HA e os builds/smoke tests amd64/arm64; a execução da versão está vinculada nas notas da release. Total da suíte: **52 testes**.

O backend, armazenamento e IDs não tiveram alteração funcional nesta atualização. Nenhum teste acionou a instalação residencial.

## Referência da versão anterior

# Evidências — aplicativo 1.0.0

Execução em 14/09/2026. [CI completo aprovado de referência](https://github.com/aoliveira07/smart-house-dingtian-manager/actions/runs/34860152154), commit `12845a53564159192febd33145bd15f0ec652178`. A release executa novamente todos os jobs no commit publicado; o link fica nas notas da tag.

| Verificação | Ambiente | Resultado |
|---|---|---|
| Núcleo transacional e contrato MQTT | Windows/Python 3.12.14 e Linux/Python 3.14.7 | 26 testes passaram |
| Backend do aplicativo, comandos, autorização, importação e persistência | API MQTT/HA simulada, sem rede residencial | 12 testes passaram |
| Interface, páginas 8/16/32, rascunhos, estado desconhecido, toggle e rota Ingress | Node 24 local / Node 22 CI, happy-dom 20.14.5 | 8 testes passaram |
| Integração de compatibilidade e aplicativo remoto usando APIs reais do HA | HA Core 2026.9.2/Python 3.14.7, somente transporte MQTT simulado | 5 testes passaram |
| Contêiner amd64 | Docker, Python 3.14.0, aiohttp 3.13.3 | Build, inicialização, bloqueio de acesso direto e persistência após restart passaram |
| Contêiner arm64/aarch64 | Docker/QEMU, Python 3.14.0, aiohttp 3.13.3 | Build, inicialização, bloqueio de acesso direto e persistência após restart passaram |
| Lint/formatação, frontend gerado e pacotes ZIP | Ruff, Node, Python | Passaram |
| Compatibilidade HACS da integração anterior | hacs/action | Passou; não é necessária para o aplicativo |
| Inspeção visual do novo painel | Browser isolado, desktop e viewport 390×844 | Controles por canal, estados, campos e espaçamento conferidos; sem erros de console observados |

**51 testes automatizados**, além dos dois smoke tests de contêiner. Não houve instalação no HA residencial nem homologação física.

## Publicações verificadas

Nos módulos de 8, 16 e 32 canais, o teste de R7 sem nome, sem tipo e sem uso gera exatamente:

`/Cabeado/relay00123/in/r7`, payload `ON`, QoS `0`, retain `false`.

Nenhum Discovery/entidade é criado nesse passo e o inventário permanece idêntico. Ao nomear e habilitar R7, ocorre uma publicação Discovery e nenhuma publicação adicional em `/in/`. Mensagens de R1 não confirmam R7; mensagens retidas não confirmam comandos pendentes. Estado desconhecido não vira OFF presumido.

Revisão antiga, usuário não administrador, peer fora do Ingress, tópico arbitrário, capacidade inválida, broker offline e LWT não confirmado são rejeitados sem publicar. Comandos durante outra operação são rejeitados imediatamente, sem esperar na fila. Cliques durante pendência não duplicam; timeout libera o controle e reconexão não reenvia. Restart/importação preservam o cadastro; exclusão libera assinaturas e limpa apenas Discovery próprio.

O teste com HA real verifica autenticação administrativa, prefixo Discovery personalizado, publicação pela API do HA, teste sem entidade, criação real de entidade MQTT, nome/ID alterados externamente, renomeação pelo aplicativo e remoção. Todo esse ciclo contém exatamente um comando de relé simulado.

## Limites e piloto

Os contêineres foram construídos e iniciados em Docker isolado; não simulam a instalação interativa completa do Supervisor/HA OS. O contrato de API foi validado no Core real, usando token de teste em lugar do proxy Supervisor. A instalação pela loja, o Ingress completo no equipamento, atualização com backup do Supervisor e as mensagens do hardware ainda precisam ser homologados pelo responsável.

Os testes não identificam cargas, não validam automações particulares nem garantem detecção universal de outros controladores MQTT. O protocolo não possui ID de correlação: confirmação indica estado recebido, não identidade da carga. Use o plano de homologação antes de ampliar a instalação.
