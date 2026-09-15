# Dingtian Manager 1.6.0

Instale ou atualize pela loja de Aplicativos do Home Assistant. Repositório: https://github.com/aoliveira07/smart-house-dingtian-manager. Requer Core 2026.9.2+, Supervisor e MQTT configurado com Discovery.

## Uso

Cadastre módulos de 8, 16 ou 32 saídas. Abra as saídas para editar nome, cômodo, tipo e uso, com salvamento automático. Nome do módulo e serial ficam disponíveis somente no lápis da lista. Alterar serial substitui os tópicos preservando a identidade lógica; use um equipamento com a mesma capacidade.

O filtro por cômodo seleciona as saídas do módulo aberto. Os controles coletivos atuam em todas as saídas exibidas pelo filtro, inclusive as desmarcadas em Usar, em Todos os cômodos e em Sem cômodo. Usar controla apenas o cadastro da entidade no Home Assistant. Cada clique envia ON/OFF imediatamente, QoS 0, retain false. O botão mostra o comando por dois segundos, depois acompanha um novo feedback MQTT. Sem retorno, volta visualmente para Desligado; isso não envia OFF automático nem confirma o estado físico. Mensagens antigas não contam como resposta. Os comandos não são enfileirados nem reenviados após falha.

## Entidades independentes e atualização

Cada canal gera uma entidade MQTT independente, sem bloco device. Os módulos continuam organizados internamente no aplicativo. A atualização migra os antigos cadastros agrupados através de remoção e recriação do Discovery sob a mesma identidade lógica, preservando IDs de entidade, nomes, áreas, ícones, aliases, etiquetas e preferências de visibilidade. Áreas herdadas do dispositivo são copiadas para cada entidade. O agrupamento antigo pode desaparecer quando não contém mais entidades.

Durante a migração, as entidades podem ficar temporariamente indisponíveis. O cadastro e os metadados são salvos antes da remoção, permitindo retomar a operação após interrupção. Não remova o aplicativo nem o inventário durante uma sincronização pendente; use Tentar sincronizar após restabelecer MQTT/HA. A migração não altera estados físicos dos relés.

Não carregue o YAML de referência junto com entidades de mesmo unique_id gerenciadas pelo aplicativo. Ele descreve o formato desejado, não um segundo cadastro a ser importado automaticamente.

## Recuperação

Use backup do HA para recuperação integral. O Excel é um relatório das saídas cadastradas, não um backup restaurável. Dados persistem em /data. Remover uma saída ou módulo limpa as entidades correspondentes. O painel é restrito a administradores via Ingress.

## Interface 1.6.0

- Cabeçalhos compactos: título à esquerda, módulo e utilização ao centro, ação de navegação à direita.
- Lista sem busca, filtro, comandos coletivos, importação ou manutenção. Edição de nome/serial continua no lápis.
- Exportar para Excel (.xlsx): saídas cadastradas, com Nome do módulo, Saída do módulo, Nome, Cômodo e Tipo (Luz ou Switch). Cabeçalho congelado e filtro nas colunas.
- Tela de saídas com filtro alinhado ao cômodo; comandos coletivos atuam nas saídas exibidas, inclusive em Todos os cômodos e Sem cômodo.
- Botão único Ligado/Desligado: envia imediatamente e mostra o comando por dois segundos. Depois usa novo feedback MQTT; sem retorno volta visualmente a Desligado, sem enviar OFF automático.
- Entidades MQTT independentes e personalizações preservadas.

Validação: 53 testes Python, 20 testes da interface; CI também valida Home Assistant real e containers amd64/aarch64.

## Validação do cadastro

- Nomes de saídas únicos em todos os módulos, inclusive antes de marcar Usar. Maiúsculas e espaços extras não permitem duplicatas; nomes padrão de saídas ainda não configuradas são dispensados.
- Alterar cômodo pede confirmação antes de salvar, preservando código, identidade e marcação Usar da entidade.
- Ligar seleção e Desligar seleção funcionam em Todos os cômodos e Sem cômodo, atuando nas saídas exibidas, inclusive as desmarcadas em Usar.
- Cadastros antigos não são renomeados automaticamente: nomes conflitantes precisam ser corrigidos ao editar o módulo.
