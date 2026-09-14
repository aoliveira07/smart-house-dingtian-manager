# Instalação e atualização

Requisitos: HA Core 2026.9.2+, MQTT configurado e Discovery habilitado, usuário administrador. O projeto não instala broker nem depende de add-on externo.

1. Faça backup completo do HA e confirme que você consegue restaurá-lo.
2. Remova somente as definições Dingtian legadas que serão substituídas, conforme CLEAN_START.md. Não mantenha YAML e Discovery concorrentes para a mesma saída.
3. Instale pelo HACS (repositório personalizado, categoria Integração, versões beta visíveis) ou extraia o ZIP manual na pasta de configuração.
4. Confira a presença de `custom_components/smart_house_dingtian/manifest.json` e `frontend/panel.js`. Não deixe uma pasta extra entre `custom_components` e o domínio.
5. Reinicie o HA, adicione a integração e abra Dingtian Manager. Se o MQTT estiver ausente, configure-o primeiro usando o fluxo normal do HA.
6. Cadastre um piloto. Todos os canais começam não utilizados. Habilite somente uma carga não crítica identificada fisicamente.

## Atualizar

Faça backup; use a atualização do HACS ou substitua **a pasta do código** `custom_components/smart_house_dingtian` com o pacote novo. Reinicie o HA e recarregue o navegador. Não remova a integração nem seu armazenamento para atualizar. UUIDs, sequência e fichas ficam no Store do HA e persistem entre versões. Versões desconhecidas de armazenamento são rejeitadas, nunca convertidas em cadastro vazio.

O painel é registrado por API assíncrona de arquivos estáticos e `panel_custom.async_register_panel`, incluindo `config_panel_domain`. O caminho `/smart-house-dingtian/modules/<uuid>` permite reabrir o módulo por URL.

Após mudar o prefixo Discovery na integração MQTT, reinicie o HA para restabelecer todas as assinaturas com a nova configuração. O diário preserva os tópicos antigos para limpeza restrita.

## Remover

Com broker online, no painel abra Manutenção e confirme Preparar remoção permanente. A ação remove somente os Discovery configs deste cadastro, não envia OFF e deixa o gerenciador bloqueado para novas alterações. Aguarde ausência de pendências. Remova então a integração em Dispositivos e serviços e desinstale seu código. Somente após a preparação concluída o armazenamento pode ser descartado automaticamente.

Desabilitar/recarregar a entrada libera o painel e os listeners, sem apagar os configs retidos. Entidades MQTT já criadas continuam sob responsabilidade da integração MQTT até a preparação de remoção.
