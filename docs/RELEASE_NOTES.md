# Smart House Dingtian Manager 1.8.0

- Canais Cíclico de 3 agora são uma única luz MQTT RGB, sem entidade de tonalidade separada.
- O seletor de cores da própria luz escolhe Quente, Neutro ou Frio e mantém a confirmação de cada ciclo por feedback MQTT.
- A atualização remove a entidade select criada pela versão 1.7.0, mantendo o ID, o nome e a área da luz.

Após atualizar, abra a luz e use o seletor RGB nativo. A configuração da sequência e a sincronização inicial continuam em Avançado. Testes automatizados e CI; sem acionamento de hardware físico nesta publicação.
