# Dingtian Manager 1.7.0

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

## Interface 1.7.0

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

## Iluminação cíclica de três tons

No aplicativo, abra o módulo e expanda **Avançado** ao final da página. Apenas saídas marcadas como Usar aparecem. Selecione **Cíclico de 3**, organize as três posições e informe o intervalo entre o feedback OFF e o envio de ON. Trocar uma posição permuta as opções para evitar duplicatas. O padrão é 500 ms; ajuste conforme a luminária (100–10000 ms).

Na primeira configuração, escolha a tonalidade observada e clique em **Sincronizar tonalidade atual**. Isso apenas ajusta a memória. Com a luz desligada, escolha a última tonalidade conhecida; o próximo ON avançará uma posição. Ao mudar a sequência, substituir o serial ou reativar uma saída, sincronize novamente.

A entidade de luz permanece. O aplicativo cria também `select.<id_da_luz>_tonalidade`, com Quente, Neutro e Frio. O ID é preservado após renomeações. Selecionar uma opção executa os ciclos necessários e deixa a luz ligada; aguarda feedback real em cada etapa. Comandos pelo interruptor físico também avançam a memória em cada OFF → ON observado. Mensagens retidas apenas estabelecem o estado inicial, sem contar um ciclo. Documentação da entidade: [MQTT Select](https://www.home-assistant.io/integrations/select.mqtt/).

Sem feedback em 5 segundos, a sequência para, registra erro e solicita sincronização. A última posição conhecida é conservada, mas não anunciada como confirmada enquanto houver incerteza. Não há reenvio nem retomada de sequência após reinício. Durante uma sequência, o canal não aceita outro comando individual/coletivo do Manager; um novo destino de tonalidade substitui o anterior. O feedback continua sendo processado.

A posição sobrevive ao reinício. Alterações físicas ocorridas enquanto o aplicativo estava desconectado não podem ser reconstruídas: use sincronização manual se a tonalidade observada divergir. A tonalidade é calculada pelo ciclo elétrico, não medida por um sensor de cor. Esta função pertence ao aplicativo/add-on; a integração legada não executa sequências cíclicas. Canais Normal mantêm o comportamento anterior.

Validação automatizada usa MQTT simulado, integração real com Home Assistant e containers amd64/aarch64. A temporização na luminária física deve ser conferida na instalação.
