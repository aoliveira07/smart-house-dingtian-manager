# Smart House Dingtian Manager 1.0.1

O toggle de cada canal agora envia Ligar/Desligar diretamente ao clicar, sem a janela de confirmação do navegador.

Permanecem a indicação do estado recebido do módulo, a espera pelo retorno, o bloqueio contra cliques repetidos e a validação de disponibilidade. Com estado desconhecido, Ligar e Desligar continuam explícitos. Salvar o cadastro não envia comandos.

## Atualizar

Em **Configurações → Aplicativos → Smart House Dingtian Manager**, clique em **Atualizar**. Se ainda não aparecer, atualize a loja/verifique atualizações e reabra a página do aplicativo. Depois, reabra a interface Web para carregar o painel novo.

O repositório continua `https://github.com/aoliveira07/smart-house-dingtian-manager`. Inventário e IDs são preservados; não é necessário reinstalar ou importar o cadastro.

Pacote principal: `smart-house-dingtian-manager-addon-1.0.1.zip`, também disponível para instalação local em `/addons`. Os ZIPs de integração são apenas compatibilidade.

Testes de regressão verificam o clique real no toggle para ON e OFF sem chamar confirmação, ausência de duplicação e preservação do estado até o retorno do módulo. A CI completa, incluindo contêineres amd64/arm64, precisa passar antes da publicação.

Nenhum comando foi enviado à instalação residencial durante o desenvolvimento. Homologação física pendente.
