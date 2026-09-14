# Instalação e uso — aplicativo 1.0.0

## Requisitos

Home Assistant OS/Supervisor, Core 2026.9.2+, CPU amd64 ou aarch64, administrador e integração MQTT ativa com Discovery habilitado. O aplicativo reutiliza o MQTT do HA, inclusive um broker externo já configurado, sem pedir credenciais ou instalar Mosquitto adicional.

## Instalar pela loja

1. Abra **Configurações → Aplicativos → Instalar aplicativo**.
2. Em **⋮ → Repositórios**, adicione `https://github.com/aoliveira07/smart-house-dingtian-manager`.
3. Atualize a loja e abra **Smart House Dingtian Manager**.
4. Instale a **1.0.0**, aguarde a compilação, inicie e abra a interface Web. Habilite a barra lateral se desejar.

Não instale o ZIP de integração pelo HACS para obter o aplicativo. Não é necessário reiniciar o Core para instalar este aplicativo. Seu inventário começa vazio.

Alternativa para instalação local: extraia `smart-house-dingtian-manager-addon-1.0.0.zip` e coloque a pasta `dingtian_manager` em `/addons/dingtian_manager`, acessível pelo método administrativo já usado na instalação. Atualize a loja e procure em Aplicativos locais. O ZIP não é um backup do HA e não é enviado ao botão Restaurar backup.

## Primeiro módulo e teste

Cadastre serial e capacidade. Esses campos ficam fixos depois de salvar para impedir comandos baseados em edições ainda não confirmadas. Use um nome provisório se necessário. Abra o módulo e espere a disponibilidade `online`.

Cada canal possui **Testar relé — comando real** antes do nome. Se o estado é desconhecido, escolha Ligar/Desligar explicitamente; nunca é apresentado um OFF presumido. A ação é confirmada individualmente e exige observação local em condições seguras. O painel aguarda uma mensagem de estado nova e não retida correspondente à intenção por até 15 segundos. Timeout ou falha não significa que a carga esteja desligada. Não há reenvio.

Depois de identificar a carga, preencha nome e tipo, marque **Usar canal** e salve. Canais não utilizados podem ficar com nome/tipo vazios. Testar não cria entidades; salvar não envia comandos. Cancelar descarta edições de cadastro, mas mantém o estado físico resultante dos comandos. Canais não utilizados que reportam ON permanecem visíveis, com aviso ao sair.

## Atualizar e fazer backup

Faça um backup do aplicativo/HA antes de atualizar. Use **Atualizar** na página do aplicativo; o Supervisor mantém `/data`. Também é possível exportar um JSON do cadastro pela visão geral. O arquivo contém seus seriais, nomes e tópicos, portanto mantenha-o privado.

A opção **Importar cadastro existente** aceita esse JSON somente em aplicativo ainda vazio. Não sobrescreve módulos atuais nem corrige arquivos corrompidos silenciosamente. A importação não envia ON/OFF; a sincronização automática posterior restaura Discovery quando o MQTT estiver pronto.

## Migrar da integração beta anterior

Somente se você já instalou e cadastrou módulos na integração `smart_house_dingtian`:

1. Faça um backup do HA. Guarde uma cópia privada de `/config/.storage/smart_house_dingtian` (o arquivo é JSON; não o edite). Caso o editor oculte `.storage`, use o recurso de arquivos/backup administrativo disponível na instalação.
2. **Desative** a integração Smart House Dingtian Manager em Dispositivos e serviços. Não use “Preparar remoção permanente”, pois isso apagaria o cadastro/Discovery que será migrado. Se preferir, faça a cópia do arquivo depois da desativação para capturar a gravação mais recente.
3. Instale/inicie o aplicativo e use **Importar cadastro existente**, selecionando o JSON salvo. Tanto o formato Store do HA (`version`/`data`) quanto o JSON exportado pelo aplicativo são aceitos.
4. Confira módulos, seriais, nomes, IDs e canais utilizados. O UUID do gerenciador, UUIDs dos módulos, sequência e diário são preservados. O aplicativo reaproveita as entidades existentes e só sincroniza configurações.
5. Mantenha a integração anterior desativada. Não ative os dois gerenciadores simultaneamente; o aplicativo bloqueia essa condição.

A integração antiga pode continuar desativada para reversão. Para reverter após novas alterações no aplicativo, pare o aplicativo e restaure um backup consistente de antes da migração; não ligue a integração antiga com um cadastro desatualizado esperando que ela importe alterações sozinha.

Se você usa apenas YAML legado, não importe os exemplos como inventário. Siga a retirada individual descrita no documento [CLEAN_START](https://github.com/aoliveira07/smart-house-dingtian-manager/blob/main/docs/CLEAN_START.md), preservando outras entidades MQTT.

## Remover

Para desinstalar definitivamente e limpar as entidades deste gerenciador, use **Manutenção → Preparar remoção permanente**, com broker online. Verifique que a sincronização terminou; então desinstale o aplicativo. Nenhum OFF é enviado. Desinstalar diretamente pode deixar Discovery retido no broker. O backend limpa somente os tópicos do diário próprio.

## Falhas comuns

- **Não aparece na loja:** confira a URL do repositório, atualize a loja e confirme arquitetura/Core suportados.
- **Acesso negado:** abra pela interface Web/Ingress com administrador ativo. Porta 8099 não é publicada e acesso direto é rejeitado.
- **Aguardando disponibilidade:** o módulo precisa publicar `online` no tópico LWT contratado. Não há comando de consulta inventado.
- **Broker desconectado:** confira MQTT em Dispositivos e serviços. O gerenciador tenta reconectar a API e sincronizar Discovery, sem reenviar comandos de relé.
- **Conflito MQTT/entity_id:** resolva individualmente o legado ou Discovery concorrente. O gerenciador não aceita silenciosamente um ID com sufixo.
- **Resultado físico não confirmado:** observe a carga antes de decidir o próximo comando; não suponha OFF.
- **Cadastro alterado:** cancele/recarregue o formulário para obter a revisão salva por outra sessão.

A versão 1.0.0 ainda exige homologação física pelo responsável pela instalação. Os testes publicados usam dados fictícios e transporte MQTT isolado.
