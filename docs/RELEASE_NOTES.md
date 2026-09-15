# Smart House Dingtian Manager 1.6.0

- Nomes de saídas únicos em todos os módulos, inclusive antes de marcar Usar. Maiúsculas e espaços extras não permitem duplicatas; nomes padrão de saídas ainda não configuradas são dispensados.
- Alterar cômodo pede confirmação antes de salvar, preservando código, identidade e marcação Usar da entidade.
- Ligar seleção e Desligar seleção funcionam em Todos os cômodos e Sem cômodo, atuando nas saídas exibidas, inclusive as desmarcadas em Usar.
- Cadastros antigos não são renomeados automaticamente: nomes conflitantes precisam ser corrigidos ao editar o módulo.

Validação: testes de backend e frontend, integração com Home Assistant e containers amd64/aarch64 na CI. Acionamento físico não testado nesta publicação.
