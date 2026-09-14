# Smart House Dingtian Manager — 1.3.0

Aplicativo para Home Assistant OS com Supervisor, módulos Dingtian de 8, 16 ou 32 entradas, visual Petróleo e entidades MQTT independentes.

Instale pela loja de Aplicativos adicionando https://github.com/aoliveira07/smart-house-dingtian-manager. Requer Home Assistant Core 2026.9.2+, MQTT e Discovery configurados. Abra a interface por Ingress.

## 1.3.0

- Visual Petróleo em toda a aplicação, com controles largos Acionar / Desacionar e identificação Entrada 1, Entrada 2 etc.
- Entidades MQTT independentes, sem dispositivo agrupador. Mantém o recebimento de estado no HA, conforme o modelo do YAML de referência.
- Migração dos cadastros antigos preserva entity_id, unique_id, nome, cômodo (inclusive herdado), ícone, aliases, etiquetas e preferências de visibilidade/habilitação. Registro persistente permite retomar a migração após interrupção.
- Comandos da configuração enviam ON/OFF diretamente, QoS 0 e sem retenção, sem aguardar estado ou disponibilidade do módulo. Broker desconectado e falha de sincronização continuam bloqueando envio. Não há fila ou reenvio automático.
- Removidos o feedback físico, contadores de estado e confirmação de navegação da tela de configuração. O HA mantém seus estados reais.

[Instalação e migração](dingtian_manager/DOCS.md) · [Resultados de testes](docs/TEST_RESULTS.md) · [Releases](https://github.com/aoliveira07/smart-house-dingtian-manager/releases)

O projeto inclui o aplicativo principal em dingtian_manager e a integração de compatibilidade em custom_components. Edite o motor compartilhado e execute scripts/build_addon.py. Valide com pytest, npm test e a CI de Home Assistant real antes de publicar.

Homologação física permanece sob responsabilidade do instalador; os testes do projeto usam MQTT simulado.
