# Changelog

## 1.1.2

- Corrige os nomes das entidades no HA: usa apenas o nome do canal, sem prefixo do módulo.
- Corrige automaticamente canais existentes sem nome personalizado, inclusive nomes salvos antes de habilitar. Preserva nomes personalizados no HA, identidades e cômodos.
- Impede criar ou renomear módulos com nomes repetidos, ignorando maiúsculas e espaços repetidos.

## 1.1.1

- Recuperação de rascunhos por aba também em acesso HTTP pelo IP local, sem depender de APIs restritas a HTTPS.
- Inclui a interface compacta, salvamento automático e cômodo por relé da versão 1.1.0.


## 1.1.0

- Módulos em linhas compactas com busca e layout mobile.
- Canais compactos; estado textual e IDs recolhidos em detalhes técnicos.
- Salvamento automático de nomes, tipo, uso e cômodo, com status e rascunho recuperável.
- Proteção de edição durante gravações lentas, falhas e conflitos entre abas.
- Cômodo por relé integrado às áreas do HA, com IDs preservados e sem enviar ON/OFF ao editar.


## 1.0.1

- Toggle de relé envia Ligar/Desligar diretamente ao clicar, sem diálogo de confirmação do navegador.
- Mantidos estado recebido do módulo, bloqueio durante pendência, disponibilidade e proteção contra comandos atrasados.
- Atualização pela tela Aplicativos; sem alteração do formato de armazenamento ou dos IDs.

## 1.0.0

- Primeira distribuição como aplicativo/add-on independente, amd64/aarch64, instalado pela loja do HA.
- Painel Ingress administrativo, sem credenciais no navegador ou integração HACS obrigatória.
- Cadastro persistente, exportação/importação explícita preservando IDs e bloqueio de execução simultânea com a integração anterior.
- Adendo 01 incluído: teste por canal antes do nome, tipo ou uso; estado recebido separado de intenção, disponibilidade obrigatória, timeout e proteção contra repetição.
- Comandos ON/OFF individuais QoS 0, retain false; nenhum comando automático ou acionamento coletivo.
- Homologação física pendente; release identificada como pré-release sem mudar o número 1.0.0.

## Histórico anterior

# Changelog

## 0.1.0b1

Primeira beta: integração de instância única, painel embarcado com módulos e canais isolados, capacidades 8/16/32, uso/tipo/nome por canal, IDs estáveis, MQTT existente e Discovery retido com limpeza restrita e diário persistido. API administrativa autenticada, revisões contra edição concorrente, comandos físicos individuais confirmados e sem retenção, documentação de instalação e reversão.

Homologação física pendente. Importação do legado, entradas digitais, pulso/intertravamento e substituição de hardware fora do escopo.
