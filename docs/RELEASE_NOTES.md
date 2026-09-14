# Smart House Dingtian Manager 1.2.0

## 1.2.0

- Ícone próprio do aplicativo e cabeçalho compacto, sem abas de módulos.
- Botões de energia redondos, sem texto visível de ligar/desligar; estado real refletido por cor.
- Filtro por cômodo na lista e nos canais; contadores de luzes, canais em uso, relés acionados e estado desconhecido.
- Ligar/desligar seleção atua somente nos canais em uso do filtro; falhas interrompem o envio e não provocam reenvio automático.
- Nome e serial editáveis somente no lápis da lista de módulos. A substituição do serial atualiza todos os tópicos preservando entidades, nomes, tipos e cômodos.
- Removida a seção de detalhes técnicos da tela de canais.

Publicação condicionada aos testes da interface, motor, APIs reais do Home Assistant e contêineres amd64/aarch64. Testes físicos residenciais não são executados durante a validação.
