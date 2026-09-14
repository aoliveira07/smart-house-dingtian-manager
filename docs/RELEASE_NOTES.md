# Smart House Dingtian Manager 1.3.0

## 1.3.0

- Visual Petróleo em toda a aplicação, com controles largos Acionar / Desacionar e identificação Entrada 1, Entrada 2 etc.
- Entidades MQTT independentes, sem dispositivo agrupador. Mantém o recebimento de estado no HA, conforme o modelo do YAML de referência.
- Migração dos cadastros antigos preserva entity_id, unique_id, nome, cômodo (inclusive herdado), ícone, aliases, etiquetas e preferências de visibilidade/habilitação. Registro persistente permite retomar a migração após interrupção.
- Comandos da configuração enviam ON/OFF diretamente, QoS 0 e sem retenção, sem aguardar estado ou disponibilidade do módulo. Broker desconectado e falha de sincronização continuam bloqueando envio. Não há fila ou reenvio automático.
- Removidos o feedback físico, contadores de estado e confirmação de navegação da tela de configuração. O HA mantém seus estados reais.

Instale pelo aplicativo do Home Assistant. A migração não envia ON/OFF. O cadastro MQTT continua administrado pelo aplicativo, sem necessidade de editar YAML. As entidades não são vinculadas a um dispositivo agrupador.
