# Smart House Dingtian Manager 1.7.0

- Seção Avançado recolhida ao final do módulo: Normal (padrão) ou Cíclico de 3 por saída utilizada.
- Ordem Quente/Neutro/Frio configurável sem repetições, intervalo OFF → ON de 100 a 10000 ms (padrão 500 ms).
- Entidade MQTT select de tonalidade independente, mantendo a entidade original e seus identificadores.
- Posição persistente atualizada somente por feedback OFF → ON; acompanha interruptores físicos e ignora mensagens repetidas/retidas como novos ciclos.
- Troca automática confirma OFF e ON, considera a luz inicialmente desligada, serializa por canal e conserva apenas o último destino solicitado.
- Timeout de 5 segundos interrompe a operação sem reenvio; sincronização manual corrige a memória sem acionar relés.

Após ativar Cíclico de 3, sincronize a tonalidade inicial em Avançado. Nenhum canal existente é convertido automaticamente.

Testes automatizados e CI; sem acionamento de hardware físico nesta publicação.
