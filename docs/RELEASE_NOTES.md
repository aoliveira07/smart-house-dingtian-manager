# Smart House Dingtian Manager 1.4.1

- Controles da seleção e filtro por cômodo em uma única linha, com rótulo ao lado do seletor e menor espaçamento.
- Removidos tooltip do botão de saída, mensagens de salvamento normal e contagem de comandos enviados. Falhas continuam visíveis e permitem tentar novamente.
- Adicionar módulo e Exportar para Excel têm a mesma cor e largura do conjunto Abrir saídas + editar + remover, alinhados à direita.
- Exportação somente ao clicar, com nome Organização cabeados.xlsx. Colunas: Nome do módulo, Saída do módulo, Nome, Cômodo e Tipo.
- Mantidos salvamento automático, envio imediato e feedback após dois segundos, com retorno visual a Desligado quando não chega resposta nova.

Validação: testes Python e frontend, verificação visual e CI com Home Assistant e builds amd64/aarch64.
