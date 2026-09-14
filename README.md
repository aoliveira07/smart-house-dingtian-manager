# Smart House Dingtian Manager — 1.2.0

Aplicativo/add-on para **Home Assistant OS com Supervisor**, instalado pela tela **Aplicativos**. Organiza módulos Dingtian de **8, 16 ou 32 saídas**, com uma página por módulo e teste individual de relé antes de definir nome, tipo ou uso.

**1.2.0 inclui o handoff principal e o Adendo 01. Homologação física pendente.** A tag beta anterior `v0.1.0b1` permanece no histórico; o aplicativo é a distribuição principal a partir de 1.0.0. A release é sinalizada como pré-release até a homologação, sem alterar o número solicitado.

## Instalar como aplicativo

1. Abra **Configurações → Aplicativos → Instalar aplicativo**.
2. No menu **⋮ → Repositórios**, adicione:
   `https://github.com/aoliveira07/smart-house-dingtian-manager`
3. Atualize a loja, procure **Smart House Dingtian Manager** e clique em **Instalar**.
4. Clique em **Iniciar**, habilite **Mostrar na barra lateral** e abra a interface Web.

O Supervisor compila o aplicativo na instalação. São suportadas as arquiteturas `amd64` e `aarch64`, com **Home Assistant Core 2026.9.2 ou superior**. É necessário ter **MQTT configurado em Dispositivos e serviços**, com Discovery habilitado. Não é necessário instalar HACS, copiar componentes, editar YAML ou informar senhas MQTT ao aplicativo.

O aplicativo usa a conexão MQTT existente do Home Assistant pela API interna do Supervisor. Lê o prefixo Discovery efetivamente configurado no HA; não instala outro broker. O painel abre por Ingress, restrito a administradores. Credenciais nunca são enviadas ao navegador.

[Instalação, atualização e migração](dingtian_manager/DOCS.md) · [Pacotes e releases](https://github.com/aoliveira07/smart-house-dingtian-manager/releases) · [Evidências dos testes](docs/TEST_RESULTS.md)

## Atualização 1.2.0

Nomes de canais no HA sem prefixo automático do módulo, com correção dos registros existentes. Nomes repetidos entre módulos são rejeitados no cadastro e na edição.

Interface com lista compacta de módulos, busca e layout para celular. Cada canal permite testar o relé e editar **nome, cômodo, tipo e uso**. Os campos salvam automaticamente, com feedback e recuperação de rascunho; não existe dependência de botão no rodapé. O cômodo usa as áreas existentes do Home Assistant e é aplicado individualmente à entidade do canal.

O toggle envia ON/OFF diretamente, sem janela de confirmação do navegador. Estado recebido, bloqueio durante pendência e validação de disponibilidade continuam preservados.

## Cadastrar e identificar saídas

1. Cadastre o serial e a capacidade do módulo. O nome inicial pode ser provisório.
2. Abra sua página **CabeadoN**. Cada linha começa com a identificação física **R1, R2…** e **Testar relé — comando real**.
3. Quando o módulo estiver online, teste deliberadamente uma saída e observe a carga localmente. Com estado desconhecido, escolha explicitamente **Ligar** ou **Desligar**.
4. Preencha o nome, escolha **Luz** ou **Interruptor**, marque **Usar canal** e salve.

O teste funciona mesmo sem entidade, sem nome definitivo, sem tipo escolhido ou com uso desmarcado. Não cria Discovery nem modifica o formulário. Canais não utilizados continuam visíveis na administração. As entidades operacionais são criadas somente ao salvar canais utilizados.

O estado exibido vem das mensagens do equipamento. A publicação não confirma a ação física: o painel aguarda retorno, limita comandos repetidos e informa timeout sem reenviar. Broker desconectado, módulo offline ou disponibilidade desconhecida bloqueiam comandos. **Salvar, navegar ou reiniciar não envia ON/OFF e não desfaz um teste anterior.** Os controles coletivos atuam apenas sobre a seleção explícita de canais em uso. Não há pulso ou OFF automático.

## Identidade e MQTT

`Cabeado1` identifica permanentemente o módulo; `Cabeado1-r7` identifica sua saída física R7. Os IDs iniciais são `light.cabeado1_r7` ou `switch.cabeado1_r7`. Renomeações preservam o ID efetivo do registro do HA. Trocar entre light/switch muda o domínio e exige revisar referências de automações.

| Item | Contrato |
|---|---|
| Comando | `/Cabeado/relay<SERIAL>/in/r<N>` |
| Estado | `/Cabeado/relay<SERIAL>/out/r<N>` |
| Disponibilidade | `/Cabeado/relay<SERIAL>/out/lwt_availability` — `online` / `offline` |
| Payload de comando | `ON` ou `OFF`, QoS **0**, retain **false** |
| Discovery | Prefixo lido do HA; namespace exclusivo por gerenciador/módulo; QoS 1, retain true |
| Serial | Texto somente com dígitos; preserva zeros iniciais |

Inventário, UUIDs, sequência de módulos e diário Discovery ficam em `/data/inventory.json`, persistente nas atualizações e incluído nos backups do aplicativo. Versões desconhecidas ou arquivos corrompidos bloqueiam a inicialização; nunca geram um cadastro vazio silenciosamente.

## Atualização e compatibilidade

Atualize pela própria tela do aplicativo. A antiga integração continua no código para compatibilidade/migração, mas **não deve permanecer ativa simultaneamente com o aplicativo**. O backend bloqueia alterações nessa condição. A migração é explícita, importa o cadastro preservando IDs e aceita somente destino vazio; siga [DOCS.md](dingtian_manager/DOCS.md).

O arquivo `smart-house-dingtian-manager-addon-1.2.0.zip` contém o contexto instalável local em `/addons`. Os ZIPs `smart_house_dingtian.zip` e `smart-house-dingtian-manager-manual.zip` são da integração anterior e não são o pacote do aplicativo.

## Desenvolvimento

- `frontend/panel.js`: interface compartilhada, sem dependências de produção/CDN.
- `custom_components/smart_house_dingtian/`: núcleo canônico e adaptador da integração anterior.
- `dingtian_manager/`: contexto Docker independente, servidor Ingress e adaptador remoto.
- `python scripts/build_addon.py`: copia somente o núcleo puro e o frontend para o contexto Docker.
- `npm ci && npm run build && npm test`: build e testes do painel.
- `pytest tests/test_manager.py tests/test_addon.py`: testes isolados de transações, comandos e aplicativo.
- `pytest tests/ha`: testes em HA real 2026.9.2, com transporte MQTT simulado, executados em Linux/Python 3.14.

A CI verifica o código gerado e constrói/inicia contêineres amd64 e arm64. Nenhum teste usa a residência. Consulte [arquitetura](docs/ARCHITECTURE.md) e [plano de testes](docs/TEST_PLAN.md).

## Controles e substituição de módulo — 1.2.0

Na lista de módulos, o lápis permite editar nome e número de série em uma única operação. Use um equipamento substituto com a mesma quantidade de canais. O serial é validado contra os demais módulos; os tópicos MQTT são substituídos preservando unique_id, entity_id, nomes, tipos e cômodos. Capacidade e identidade lógica permanecem fixas. Uma falha de sincronização pode ser retomada sem comandos de relé.

Na página de canais, nome e serial do módulo são somente leitura. O botão redondo alterna o relé conforme o estado recebido. Em estado desconhecido, há duas ações explícitas de energia, com identificação acessível e por tooltip.

O filtro Cômodo limita a lista e os canais. Todos os cômodos remove o filtro; Sem cômodo seleciona canais sem área própria nem herdada do dispositivo. Os contadores mostram luzes em uso, relés em uso, relés acionados e relés sem estado recebido. Ligar seleção e Desligar seleção comandam somente os canais marcados como Usar dos módulos visíveis, respeitando a busca e o cômodo. Dentro de um módulo, a ação fica limitada a ele. Seleção offline ou com comando pendente é bloqueada antes do envio; uma falha durante o envio interrompe os canais restantes, mostra o progresso e não reenvia automaticamente. Nenhuma operação coletiva é feita ao editar, salvar ou trocar serial.

O ícone do aplicativo é distribuído em icon.png, seguindo a [documentação do Home Assistant](https://developers.home-assistant.io/docs/apps/presentation/).
