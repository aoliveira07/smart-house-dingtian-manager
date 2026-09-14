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
