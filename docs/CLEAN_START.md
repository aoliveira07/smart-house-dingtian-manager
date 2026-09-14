# Cadastro novo com retirada restrita do legado

Este é um procedimento para o administrador executar conscientemente. O desenvolvimento não acessa o Home Assistant nem o broker da residência.

1. Faça backup completo do HA e guarde os YAMLs atuais e o mapeamento de entidades/automações. Confirme o meio de restauração.
2. Identifique **somente** as saídas Dingtian que passarão para o gerenciador. Preserve outros equipamentos e todas as credenciais do broker.
3. Retire somente as declarações correspondentes em `mqtt.light` e, se realmente existirem, em `mqtt.switch`. Uma cópia antiga de `configuration.yaml` não representa necessariamente o arquivo vivo completo. Preserve os demais blocos e includes. Um modelo de switch fornecido como referência não é instalação ativa e não precisa ser removido.
4. Valide a configuração pelo HA e recarregue/reinicie pelo método suportado na instalação. Confira individualmente os registros legados remanescentes e remova apenas conflitos identificados usando a interface do HA. Nunca edite entity_registry manualmente.
5. Se houver discovery nativo do fabricante para a mesma saída, resolva essa duplicação antes de habilitar o canal. Não limpe `homeassistant/#`, `/Cabeado/#` ou o banco do broker.
6. Instale a beta. Cadastre manualmente serial e capacidade conferidos. O inventário começa vazio; fixtures públicos são fictícios e não devem ser publicados na residência.
7. Habilite um canal de carga não crítica; valide estado, nome, unique_id, entity_id e LWT. Só então realize uma operação individual observada.
8. Reinicie, valide persistência e amplie o cadastro gradualmente. Nenhum teste deve ligar todas as saídas.

## Reversão

Faça backup do cadastro beta. Com o broker online, desative os canais correspondentes ou prepare a remoção do gerenciador. Aguarde a limpeza confirmada e confira que suas entidades operacionais desapareceram. Restaure somente as declarações Dingtian legadas e recarregue/reinicie. Preserve MQTT, broker, dashboards, scripts, cenas e automações. Evite dois gerenciamentos simultâneos para a mesma saída.

Trocar domínio e remover entidades pode afetar referências/histórico. A restauração de IDs livres é tentada pelo gerenciador, mas não recupera automaticamente cenas, automações ou histórico apagado pelo usuário.
