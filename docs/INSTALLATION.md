# Dingtian Manager 1.3.0

Instale ou atualize pela loja de Aplicativos do Home Assistant. Repositório: https://github.com/aoliveira07/smart-house-dingtian-manager. Requer Core 2026.9.2+, Supervisor e MQTT configurado com Discovery.

## Uso

Cadastre módulos de 8, 16 ou 32 entradas. Abra as entradas para editar nome, cômodo, tipo e uso, com salvamento automático. Nome do módulo e serial ficam disponíveis somente no lápis da lista. Alterar serial substitui os tópicos preservando a identidade lógica; use um equipamento com a mesma capacidade.

O filtro por cômodo limita os módulos e entradas. Cada controle Acionar / Desacionar envia ON / OFF, QoS 0, retain false. A interface não aguarda feedback e não representa o estado físico. Controles coletivos atuam somente sobre entradas em uso na seleção. Os comandos exigem conexão com o broker, não são enfileirados e não são reenviados após falha. O estado e a disponibilidade das entidades no HA continuam vindo dos tópicos MQTT.

## Entidades independentes e atualização

Cada canal gera uma entidade MQTT independente, sem bloco device. Os módulos continuam organizados internamente no aplicativo. A atualização migra os antigos cadastros agrupados através de remoção e recriação do Discovery sob a mesma identidade lógica, preservando IDs de entidade, nomes, áreas, ícones, aliases, etiquetas e preferências de visibilidade. Áreas herdadas do dispositivo são copiadas para cada entidade. O agrupamento antigo pode desaparecer quando não contém mais entidades.

Durante a migração, as entidades podem ficar temporariamente indisponíveis. O cadastro e os metadados são salvos antes da remoção, permitindo retomar a operação após interrupção. Não remova o aplicativo nem o inventário durante uma sincronização pendente; use Tentar sincronizar após restabelecer MQTT/HA. A migração não altera estados físicos dos relés.

Não carregue o YAML de referência junto com entidades de mesmo unique_id gerenciadas pelo aplicativo. Ele descreve o formato desejado, não um segundo cadastro a ser importado automaticamente.

## Recuperação

Use backup do HA antes de atualizar. Exportar cadastro salva o inventário. Importar é permitido apenas em aplicativo vazio. Dados persistem em /data. A limpeza de remoção do gerenciador remove suas entidades e Discovery, mas não envia OFF aos equipamentos. O painel é restrito a administradores via Ingress.
