# Smart House Dingtian Manager

Integração personalizada para Home Assistant com **visão geral dos módulos** e **página independente de canais de cada módulo**. Suporta capacidades de **8, 16 e 32 saídas**. Cada canal pode ficar não utilizado, ser uma luz liga/desliga ou um interruptor liga/desliga.

**Beta `0.1.0b1`: homologação física pendente.** Começa sem equipamentos. Não importa configurações antigas automaticamente. O painel é pt-BR, responsivo, compatível com temas claro/escuro e acompanha o pacote, sem CDN, Node ou servidor externo em produção.

## Funcionamento

Configure uma vez a integração MQTT do próprio HA. O gerenciador reutiliza sua conexão e seu prefixo Discovery, sem pedir credenciais. Os canais utilizados tornam-se entidades das plataformas MQTT `light` e `switch`, agrupadas por módulo. A administração fica em **Dingtian Manager**, na barra lateral; as entidades aparecem na integração **MQTT**.

1. Em **Módulos**, cadastre serial, capacidade e nome.
2. Abra **CabeadoN**, edite somente os canais daquele módulo e salve o lote.
3. Use os detalhes de um canal para consultar tópicos, ID efetivo e comandos individuais explicitamente confirmados.

`Cabeado1` é a identidade permanente do módulo; `Cabeado1-r7` é o `unique_id` da saída física R7. Renomear o ambiente não muda esses IDs. O ID inicial sugerido é `light.cabeado1_r7` ou `switch.cabeado1_r7`; a aplicação consulta o ID efetivamente registrado no HA. Trocar light/switch muda o domínio e pode exigir correções em automações, cenas e dashboards.

## Instalação

Alvo: **Home Assistant Core 2026.9.2 / Python 3.14.2 ou superior**. Veja [evidências e limites dos testes](docs/TEST_RESULTS.md) antes do piloto. A versão instalada na sua residência não foi consultada.

**HACS:** adicione `https://github.com/aoliveira07/smart-house-dingtian-manager` como repositório personalizado, categoria **Integração**. Habilite versões beta/pré-release, baixe a beta e reinicie o HA. Não há inclusão no catálogo padrão do HACS.

**Manual:** baixe `smart-house-dingtian-manager-manual.zip` na [página de releases](https://github.com/aoliveira07/smart-house-dingtian-manager/releases). Extraia o diretório `custom_components/smart_house_dingtian` dentro da pasta de configuração do HA. Reinicie.

Nos dois casos, em **Configurações → Dispositivos e serviços → Adicionar integração**, procure **Smart House Dingtian Manager**. Abra o painel pela barra lateral ou pelo link em Configurar. Não acrescente `panel_custom:` nem recursos JavaScript ao YAML.

O arquivo `smart_house_dingtian.zip` é o asset do HACS e contém diretamente o conteúdo da integração. Para instalá-lo manualmente, extraia-o **dentro** de `config/custom_components/smart_house_dingtian/`.

Leia [instalação e atualização](docs/INSTALLATION.md) e [retirada restrita do legado / reversão](docs/CLEAN_START.md) antes de habilitar o primeiro canal.

## Contrato MQTT

| Item | Valor |
|---|---|
| Base | `/Cabeado/relay<SERIAL>` — serial é texto, preservando zeros |
| Estado | `/Cabeado/relay<SERIAL>/out/r<N>` |
| Comando | `/Cabeado/relay<SERIAL>/in/r<N>` |
| Disponibilidade | `/Cabeado/relay<SERIAL>/out/lwt_availability` |
| Liga / desliga | `ON` / `OFF` |
| Disponível / indisponível | `online` / `offline` |
| Comandos | QoS 0, não retidos, sem fila própria/repetição |
| Configs Discovery | QoS 1, retidos, namespace exclusivo do gerenciador |

Cadastrar, salvar, renomear, remover e reconciliar **não enviam comandos aos relés**. Desativar o cadastro não desliga a carga. Sem estado recebido, o painel aguarda informação; não fabrica `OFF` nem aciona uma saída para consultar seu estado.

## Segurança e recuperação

Todas as chamadas administrativas exigem administrador no backend. O lote inteiro é validado antes do salvamento; revisões impedem sobrescrita de duas abas. O gerenciador guarda a intenção e a propriedade de cada tópico antes de publicar. Uma falha mantém o status pendente para nova tentativa. A remoção exige broker online e confirmação de exclusão da entidade anterior antes da criação em outro domínio.

Antes de desinstalar, use **Módulos → Manutenção → Preparar remoção permanente**, com broker online, e aguarde o fim das pendências. Depois remova a integração. Recarregar/desabilitar temporariamente não remove entidades MQTT. Remoção forçada/offline exige a recuperação descrita em [Solução de problemas](docs/TROUBLESHOOTING.md).

Não edite `.storage` nem apague globalmente tópicos MQTT. Backups e configurações reais não pertencem a este repositório.

## Desenvolvimento

```sh
python -m pip install pytest pytest-asyncio ruff
pytest tests/test_manager.py -q
ruff check .
ruff format --check .
npm ci
npm run build
npm test
python scripts/package.py
```

Em Linux com Python 3.14.2+:

```sh
python -m pip install pytest-homeassistant-custom-component==0.13.365
pytest tests/ha -v
```

O frontend é um Web Component JavaScript nativo. O build verifica e copia o módulo distribuível; não há bibliotecas de interface para baixar em runtime. `happy-dom` é usado somente nos testes.

[Arquitetura](docs/ARCHITECTURE.md) · [Plano e checklist físico](docs/TEST_PLAN.md) · [Resultados](docs/TEST_RESULTS.md) · [Changelog](CHANGELOG.md)
