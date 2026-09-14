# Smart House Dingtian Manager — 1.4.0

Aplicativo para Home Assistant OS com Supervisor, módulos Dingtian de 8, 16 ou 32 saídas, visual Petróleo e entidades MQTT independentes.

Instale pela loja de Aplicativos adicionando https://github.com/aoliveira07/smart-house-dingtian-manager. Requer Home Assistant Core 2026.9.2+, MQTT e Discovery configurados. Abra a interface por Ingress.

[Instalação e migração](dingtian_manager/DOCS.md) · [Resultados de testes](docs/TEST_RESULTS.md) · [Releases](https://github.com/aoliveira07/smart-house-dingtian-manager/releases)

O projeto inclui o aplicativo principal em dingtian_manager e a integração de compatibilidade em custom_components. Edite o motor compartilhado e execute scripts/build_addon.py. Valide com pytest, npm test e a CI de Home Assistant real antes de publicar.

Homologação física permanece sob responsabilidade do instalador; os testes do projeto usam MQTT simulado.

## Interface 1.4.0

- Cabeçalhos compactos: título à esquerda, módulo e utilização ao centro, ação de navegação à direita.
- Lista sem busca, filtro, comandos coletivos, importação ou manutenção. Edição de nome/serial continua no lápis.
- Exportar para Excel (.xlsx): saídas cadastradas, com Nome do módulo, Saída do módulo, Nome, Cômodo e Tipo (Luz ou Switch). Cabeçalho congelado e filtro nas colunas.
- Tela de saídas com filtro alinhado ao cômodo; comandos da seleção aparecem após escolher um cômodo e respeitam Usar.
- Botão único Ligado/Desligado: envia imediatamente e mostra o comando por dois segundos. Depois usa novo feedback MQTT; sem retorno volta visualmente a Desligado, sem enviar OFF automático.
- Entidades MQTT independentes e personalizações preservadas.

Validação: 53 testes Python, 20 testes da interface; CI também valida Home Assistant real e containers amd64/aarch64.
