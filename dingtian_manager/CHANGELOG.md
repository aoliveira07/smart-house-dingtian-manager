# 1.7.0

- Seção Avançado recolhida ao final do módulo: Normal (padrão) ou Cíclico de 3 por saída utilizada.
- Ordem Quente/Neutro/Frio configurável sem repetições, intervalo OFF → ON de 100 a 10000 ms (padrão 500 ms).
- Entidade MQTT select de tonalidade independente, mantendo a entidade original e seus identificadores.
- Posição persistente atualizada somente por feedback OFF → ON; acompanha interruptores físicos e ignora mensagens repetidas/retidas como novos ciclos.
- Troca automática confirma OFF e ON, considera a luz inicialmente desligada, serializa por canal e conserva apenas o último destino solicitado.
- Timeout de 5 segundos interrompe a operação sem reenvio; sincronização manual corrige a memória sem acionar relés.

# 1.6.0

- Nomes de saídas únicos em todos os módulos, inclusive antes de marcar Usar. Maiúsculas e espaços extras não permitem duplicatas; nomes padrão de saídas ainda não configuradas são dispensados.
- Alterar cômodo pede confirmação antes de salvar, preservando código, identidade e marcação Usar da entidade.
- Ligar seleção e Desligar seleção funcionam em Todos os cômodos e Sem cômodo, atuando nas saídas exibidas, inclusive as desmarcadas em Usar.
- Cadastros antigos não são renomeados automaticamente: nomes conflitantes precisam ser corrigidos ao editar o módulo.

# 1.5.0

- Layout específico para celular, preservando a apresentação no computador.
- Adicionar módulo, Abrir saídas e Exportar para Excel ocupam toda a largura; editar e remover ficam na linha de Conectado.
- Cada saída apresenta Saída, Tipo e Usar no topo, nome e cômodo abaixo, e botão Ligado/Desligado largo no final.
- Filtro de cômodo inteiro visível e comandos da seleção na linha seguinte, sem rolagem horizontal.
- Rolagem vertical da página Ingress no celular, permitindo alcançar todos os módulos e a exportação.
- Mantidos salvamento automático, Excel e comportamento de comando/feedback da versão anterior.

Validação: testes Python e frontend, conferência responsiva e CI com Home Assistant e containers amd64/aarch64.

# 1.4.1

- Controles da seleção e filtro por cômodo em uma única linha, com rótulo ao lado do seletor e menor espaçamento.
- Removidos tooltip do botão de saída, mensagens de salvamento normal e contagem de comandos enviados. Falhas continuam visíveis e permitem tentar novamente.
- Adicionar módulo e Exportar para Excel têm a mesma cor e largura do conjunto Abrir saídas + editar + remover, alinhados à direita.
- Exportação somente ao clicar, com nome Organização cabeados.xlsx. Colunas: Nome do módulo, Saída do módulo, Nome, Cômodo e Tipo.
- Mantidos salvamento automático, envio imediato e feedback após dois segundos, com retorno visual a Desligado quando não chega resposta nova.

Validação: testes Python e frontend, verificação visual e CI com Home Assistant e builds amd64/aarch64.

# 1.4.0

- Cabeçalhos compactos: título à esquerda, módulo e utilização ao centro, ação de navegação à direita.
- Lista sem busca, filtro, comandos coletivos, importação ou manutenção. Edição de nome/serial continua no lápis.
- Exportar para Excel (.xlsx): saídas cadastradas, com Nome do módulo, Saída do módulo, Nome, Cômodo e Tipo (Luz ou Switch). Cabeçalho congelado e filtro nas colunas.
- Tela de saídas com filtro alinhado ao cômodo; comandos coletivos atuam nas saídas exibidas, inclusive em Todos os cômodos e Sem cômodo.
- Botão único Ligado/Desligado: envia imediatamente e mostra o comando por dois segundos. Depois usa novo feedback MQTT; sem retorno volta visualmente a Desligado, sem enviar OFF automático.
- Entidades MQTT independentes e personalizações preservadas.

Validação: 53 testes Python, 20 testes da interface; CI também valida Home Assistant real e containers amd64/aarch64.

# Changelog

## 1.3.0

- Visual Petróleo em toda a aplicação, com controles largos Acionar / Desacionar e identificação Entrada 1, Entrada 2 etc.
- Entidades MQTT independentes, sem dispositivo agrupador. Mantém o recebimento de estado no HA, conforme o modelo do YAML de referência.
- Migração dos cadastros antigos preserva entity_id, unique_id, nome, cômodo (inclusive herdado), ícone, aliases, etiquetas e preferências de visibilidade/habilitação. Registro persistente permite retomar a migração após interrupção.
- Comandos da configuração enviam ON/OFF diretamente, QoS 0 e sem retenção, sem aguardar estado ou disponibilidade do módulo. Broker desconectado e falha de sincronização continuam bloqueando envio. Não há fila ou reenvio automático.
- Removidos o feedback físico, contadores de estado e confirmação de navegação da tela de configuração. O HA mantém seus estados reais.

## 1.2.0

- Ícone próprio do aplicativo e cabeçalho compacto, sem abas de módulos.
- Botões de energia redondos, sem texto visível de ligar/desligar; estado real refletido por cor.
- Filtro por cômodo na lista e nos canais; contadores de luzes, canais em uso, relés acionados e estado desconhecido.
- Ligar/desligar seleção atua somente nos canais em uso do filtro; falhas interrompem o envio e não provocam reenvio automático.
- Nome e serial editáveis somente no lápis da lista de módulos. A substituição do serial atualiza todos os tópicos preservando entidades, nomes, tipos e cômodos.
- Removida a seção de detalhes técnicos da tela de canais.

## 1.1.2

- Corrige os nomes das entidades no HA: usa apenas o nome do canal, sem prefixo do módulo.
- Corrige automaticamente canais existentes sem nome personalizado, inclusive nomes salvos antes de habilitar. Preserva nomes personalizados no HA, identidades e cômodos.
- Impede criar ou renomear módulos com nomes repetidos, ignorando maiúsculas e espaços repetidos.

## 1.1.1

- Recuperação de rascunhos por aba também em acesso HTTP pelo IP local, sem depender de APIs restritas a HTTPS.
- Inclui a interface compacta, salvamento automático e cômodo por relé da versão 1.1.0.


## 1.1.0

- Módulos em linhas compactas com busca e layout mobile.
- Canais compactos; estado textual e IDs recolhidos em detalhes técnicos.
- Salvamento automático de nomes, tipo, uso e cômodo, com status e rascunho recuperável.
- Proteção de edição durante gravações lentas, falhas e conflitos entre abas.
- Cômodo por relé integrado às áreas do HA, com IDs preservados e sem enviar ON/OFF ao editar.


## 1.0.1

- Toggle de relé envia Ligar/Desligar diretamente ao clicar, sem diálogo de confirmação do navegador.
- Mantidos estado recebido do módulo, bloqueio durante pendência, disponibilidade e proteção contra comandos atrasados.
- Atualização pela tela Aplicativos; sem alteração do formato de armazenamento ou dos IDs.

## 1.0.0

- Primeira distribuição como aplicativo/add-on independente, amd64/aarch64, instalado pela loja do HA.
- Painel Ingress administrativo, sem credenciais no navegador ou integração HACS obrigatória.
- Cadastro persistente, exportação/importação explícita preservando IDs e bloqueio de execução simultânea com a integração anterior.
- Adendo 01 incluído: teste por canal antes do nome, tipo ou uso; estado recebido separado de intenção, disponibilidade obrigatória, timeout e proteção contra repetição.
- Comandos ON/OFF individuais QoS 0, retain false; nenhum comando automático ou acionamento coletivo.
- Homologação física pendente; release identificada como pré-release sem mudar o número 1.0.0.
