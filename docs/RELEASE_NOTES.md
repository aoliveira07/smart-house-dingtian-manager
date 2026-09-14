# Dingtian Manager 0.1.0b1

Primeira beta instalável para Home Assistant Core 2026.9.2+. MQTT existente, módulos 8/16/32, visão geral e página individual dos canais, light/switch por saída, nomes editáveis e IDs estáveis.

Os pacotes incluem frontend pronto para uso. `smart_house_dingtian.zip` é o asset do HACS; `smart-house-dingtian-manager-manual.zip` contém a estrutura `custom_components/` para extração na pasta de configuração.

A publicação exige sucesso dos testes do núcleo, testes do Web Component, integração no HA 2026.9.2 com MQTT simulado, lint, validação do pacote e HACS, no mesmo commit. Consulte o workflow **Validate integration** e `docs/TEST_RESULTS.md`.

**Homologação física pendente.** Não foi acessado o HA/broker da residência nem acionada qualquer carga. Faça backup, retire somente o legado Dingtian correspondente e habilite primeiro um único canal de carga não crítica. Leia `docs/CLEAN_START.md` e `docs/TEST_PLAN.md`.

Limites: sem importação automática, pulso/intertravamento, dimmer ou troca de hardware. Troca de domínio pode afetar automações/cenas/histórico. Remoção exige preparação online no painel; remoção forçada/offline pode deixar Discovery retido e exige recuperação do diário/backup.
