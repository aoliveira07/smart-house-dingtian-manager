# Smart House Dingtian Manager — 1.8.0

Aplicativo para Home Assistant OS com Supervisor, módulos Dingtian de 8, 16 ou 32 saídas, visual Petróleo e entidades MQTT independentes.

Instale pela loja de Aplicativos adicionando https://github.com/aoliveira07/smart-house-dingtian-manager. Requer Home Assistant Core 2026.9.2+, MQTT e Discovery configurados. Abra a interface por Ingress.

[Instalação e migração](dingtian_manager/DOCS.md) · [Resultados de testes](docs/TEST_RESULTS.md) · [Releases](https://github.com/aoliveira07/smart-house-dingtian-manager/releases)

O projeto inclui o aplicativo principal em dingtian_manager e a integração de compatibilidade em custom_components. Edite o motor compartilhado e execute scripts/build_addon.py. Valide com pytest, npm test e a CI de Home Assistant real antes de publicar.

Homologação física permanece sob responsabilidade do instalador; os testes do projeto usam MQTT simulado.

## Interface 1.8.0

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

A entidade de luz permanece como uma única `light`. Para Cíclico de 3, ela apresenta o seletor RGB nativo do Home Assistant, com as cores Quente, Neutro e Frio; não cria uma entidade `select` separada. A escolha de qualquer cor no seletor é associada à tonalidade configurada mais próxima e executa os ciclos necessários, aguardando feedback real em cada etapa. Comandos pelo interruptor físico também avançam a memória em cada OFF → ON observado. Mensagens retidas apenas estabelecem o estado inicial, sem contar um ciclo. A atualização remove automaticamente a antiga entidade `select` de tonalidade. Documentação da entidade: [MQTT Light](https://www.home-assistant.io/integrations/light.mqtt/).

Sem feedback em 5 segundos, a sequência para, registra erro e solicita sincronização. A última posição conhecida é conservada, mas não anunciada como confirmada enquanto houver incerteza. Não há reenvio nem retomada de sequência após reinício. Durante uma sequência, o canal não aceita outro comando individual/coletivo do Manager; um novo destino de tonalidade substitui o anterior. O feedback continua sendo processado.

A posição sobrevive ao reinício. Alterações físicas ocorridas enquanto o aplicativo estava desconectado não podem ser reconstruídas: use sincronização manual se a tonalidade observada divergir. A tonalidade é calculada pelo ciclo elétrico, não medida por um sensor de cor. Esta função pertence ao aplicativo/add-on; a integração legada não executa sequências cíclicas. Canais Normal mantêm o comportamento anterior.

Validação automatizada usa MQTT simulado, integração real com Home Assistant e containers amd64/aarch64. A temporização na luminária física deve ser conferida na instalação.
