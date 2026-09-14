# Smart House Dingtian Manager 1.1.1

Correção 1.1.1: rascunhos isolados por aba também no acesso HTTP por IP local.

Módulos em lista compacta, canais em linhas responsivas e edição com salvamento automático. A nova coluna **Cômodo** permite escolher uma área existente do Home Assistant para cada relé.

- Lista de módulos com busca por nome/serial, disponibilidade, utilização e ações compactas.
- Layout mobile sem rolagem lateral, controles de toque e seletor de módulo.
- Nome, cômodo, tipo e uso salvos automaticamente; status Salvo/Salvando e recuperação de rascunho no navegador.
- Gravações serializadas preservam a última edição, inclusive durante pedidos lentos. Falhas impedem a navegação que perderia a edição; conflitos entre abas exigem revisão explícita.
- Cômodo persistido por canal, aplicado à área da entidade MQTT e preservado ao trocar Luz/Switch ou reiniciar. “Padrão do módulo” remove a substituição na entidade e permite a herança da área do dispositivo no HA.
- Estado e identificação técnica ficam em detalhes recolhidos. O toggle continua enviando ON/OFF sem confirmação e sem estado otimista; editar configuração nunca envia comando ao relé.

## Atualizar

Instalação e atualização pela página **Configurações → Aplicativos → Smart House Dingtian Manager**. Reabra a interface Web depois da atualização. `/data`, módulos, seriais, nicknames e IDs são preservados; não é necessário reinstalar ou importar.

O novo campo `area_id` é opcional e compatível com cadastros anteriores. Áreas são administradas no Home Assistant. Uma escolha em canal ainda não utilizado fica salva e é aplicada quando sua entidade for criada. Não são criadas áreas automaticamente.

O pacote principal é `smart-house-dingtian-manager-addon-1.1.1.zip`. Os ZIPs de integração são apenas compatibilidade. A publicação é condicionada aos testes e aos contêineres amd64/aarch64 aprovados na CI. Capturas de desktop e celular usam dados fictícios; nenhum comando de relé residencial é necessário para validar esta interface.
