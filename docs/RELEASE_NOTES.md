# Smart House Dingtian Manager 1.0.0 — aplicativo/add-on

Esta versão reúne a entrega principal e o Adendo 01 na distribuição por **Aplicativos** do Home Assistant.

Adicione `https://github.com/aoliveira07/smart-house-dingtian-manager` em **Instalar aplicativo → ⋮ → Repositórios**, instale **Smart House Dingtian Manager**, inicie e abra a interface Web. Requer Core 2026.9.2+, Supervisor e MQTT configurado. Suporta amd64/aarch64.

Inclui teste explícito em cada linha de canal antes do cadastro operacional, sem criar entidade provisória, sem enviar comandos ao salvar e com confirmação pelo estado recebido. Cadastro persistente em `/data`; exportação/importação preservando identidades. Não depende de HACS.

**Pacote principal:** `smart-house-dingtian-manager-addon-1.0.0.zip` (alternativa para instalação local em `/addons`). Os outros dois ZIPs são da integração de compatibilidade, não necessários para instalar o aplicativo.

Testes automatizados de núcleo, interface, backend e APIs reais do HA com MQTT simulado; builds e inicialização em contêineres amd64/arm64. Detalhes e limitações em `docs/TEST_RESULTS.md` e na CI abaixo.

**Homologação física pendente.** Nenhum acesso à casa ou acionamento real foi feito nesta implementação. A release é marcada como pré-release até a homologação, mantendo o número 1.0.0 solicitado. A tag beta anterior permanece no histórico.
