# Aplicativo 1.0.0

Consulte primeiro [instalação e falhas do aplicativo](../dingtian_manager/DOCS.md). As orientações abaixo são da integração de compatibilidade anterior e só se aplicam a ela.

# Solução de problemas

**MQTT ausente/Discovery desabilitado:** configure a integração MQTT existente e habilite Discovery nas suas opções. O gerenciador não solicita credenciais nem abre outra conexão.

**Aguardando estado:** não há mensagem válida ON/OFF para o canal nesta sessão. Sem retained state/LWT, aguarde atualização natural do equipamento. Não ligue uma saída para descobrir seu estado e não publique estado inventado.

**Broker offline:** distingue falha da conexão MQTT de LWT offline do módulo. A tela não converte indisponibilidade em OFF. Comandos são descartados sem fila; alterações destrutivas são bloqueadas.

**Sincronização pendente:** a intenção já foi salva, mas as entidades podem ainda refletir configuração anterior/parcial. Não interprete o cadastro desejado como aplicado. Reconecte MQTT e use Tentar sincronizar; retries automáticos também ocorrem. Lotes adicionais são bloqueados enquanto a pendência existir.

**Colisão:** confira o entity_id apontado, o YAML Dingtian e Discovery do fabricante. Remova o conflito individualmente pela interface do HA, com backup. Não exclua entidade alheia automaticamente. Após liberar o ID, tente sincronizar. O painel nunca oferece edição de unique_id.

**Alteração em outra aba:** use **Revisar / tentar novamente**. Confira as diferenças antes de aplicar sua edição; o rascunho é preservado.

**Painel antigo após atualização:** recarregue o navegador e confira se o frontend da versão nova foi incluído na instalação. O build já acompanha o ZIP.

## Remoção forçada ou offline

O HA não permite ao gerenciador impedir com segurança todos os caminhos externos de remoção de entrada. Por isso, desinstalar diretamente sem a preparação online pode deixar configs retidos. O armazenamento é preservado quando a preparação não foi concluída.

Reinstale a mesma versão, adicione novamente a integração e abra o cadastro recuperado do Store. Com broker online, prepare a remoção no painel e aguarde a limpeza confirmada. Depois remova a integração/código. Se o armazenamento tiver sido apagado, recupere um backup antes de tentar limpar; não adivinhe propriedade de tópicos e nunca faça limpeza global do broker.

Compartilhe diagnósticos da integração e mensagens de erro sanitizadas para investigação. Não publique backups, arquivos reais da residência ou credenciais em issues.
