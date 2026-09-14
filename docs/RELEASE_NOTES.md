# Smart House Dingtian Manager 1.1.2

## 1.1.2

- Corrige os nomes das entidades no HA: usa apenas o nome do canal, sem prefixo do módulo.
- Corrige automaticamente canais existentes sem nome personalizado, inclusive nomes salvos antes de habilitar. Preserva nomes personalizados no HA, identidades e cômodos.
- Impede criar ou renomear módulos com nomes repetidos, ignorando maiúsculas e espaços repetidos.

Atualização pelo aplicativo do Home Assistant. A correção dos nomes é aplicada na reconciliação inicial, sem comandos de relé. A publicação depende dos testes do motor, interface, APIs reais do HA e contêineres amd64/aarch64.
