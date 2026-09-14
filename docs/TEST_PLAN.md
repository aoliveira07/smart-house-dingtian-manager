# Plano de testes e homologação

Os testes automatizados usam dados fictícios e uma fronteira MQTT isolada. Nenhum fixture deve ser enviado ao broker residencial.

| Grupo do handoff | Evidência automatizada / etapa |
|---|---|
| UI-01/02/03 | Testes do Web Component: vazio; módulos 8/16/32; páginas isoladas |
| UI-04/05 | Testes de navegação/rascunho; inspeção visual desktop/mobile; reload e Voltar no piloto |
| CAD-01/02/03 | Validação serial, duplicação, sequência sem reuso |
| CAN-01/02/03 | Módulo vazio, R1/R7, mistura light/switch |
| ID-01/02/03/04/05 | Núcleo e integração HA: nomes, IDs, reativação e troca de domínio; conferir referências/histórico em campo |
| MQTT-01/02/03/04/05 | Captura de publicações, estado não otimista, OFF não inventado, LWT no HA isolado |
| REC-01/02/03 | Restart, falhas injetadas, diário, tombstone e limpeza seletiva |
| SAFE-01/02/03/04 | Escopo de limpeza, usuário não admin, XSS/lote inválido e concorrência |
| SRC-01 | Inventário inicial vazio; referências privadas fora do repositório |
| PKG-01/02 | ZIP verificado; setup/reload do HA em CI; instalação HACS/manual e atualização no piloto |

## Checklist físico — executar pelo administrador

- [ ] Backup do HA e reversão disponíveis; versão do HA compatível.
- [ ] Somente legado Dingtian do piloto removido; outros MQTT preservados.
- [ ] Serial e capacidade conferidos fisicamente; um canal não crítico identificado.
- [ ] Instalação manual ou HACS concluída; painel automático, cadastro vazio.
- [ ] Páginas de módulos isoladas; teclado, celular, rotação, Voltar e reload utilizáveis.
- [ ] Habilitar R1 e/ou R7 mantém posição física; tipos e IDs corretos.
- [ ] Salvar/renomear não gera publicações em `/in/r<N>` (captura MQTT controlada).
- [ ] ON/OFF recebido atualiza somente o canal correto; comando não altera estado otimisticamente.
- [ ] LWT online/offline e desconexão do broker distinguíveis; sem mensagens inicia aguardando.
- [ ] Um comando individual ON/OFF, confirmado e observado na carga correta, QoS 0 e não retido.
- [ ] Renomear pelo HA fora do painel é refletido; restart preserva personalização e IDs.
- [ ] Desativar/reativar e trocar light/switch com backup, sem duas entidades operacionais; conferir cenas/automações.
- [ ] Reiniciar HA e broker; retained configs não recriam entidades removidas.
- [ ] Atualizar a beta e reiniciar; inventário, sequência e UUIDs preservados.
- [ ] Preparação para remoção e reversão verificadas antes de ampliar o piloto.

Não há botão de ligar todos, importação automática, pulso, intertravamento, entradas digitais, dimmer, persianas ou troca de firmware nesta V1. Nenhuma instalação é considerada homologada fisicamente por testes de software.
