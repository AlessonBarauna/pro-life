# Etapa 12 — Patrocínios, marcas, mídia e popularidade

Esta etapa adiciona uma camada comercial à carreira de jogador sem substituir os
sistemas esportivos, de mídia ou financeiros existentes.

## Conceitos separados

- **GER/qualidade esportiva:** capacidade técnica usada pelo motor.
- **Reputação:** reconhecimento esportivo acumulado.
- **Popularidade:** alcance público, exposição e repercussão.
- **Valor de mercado:** avaliação para transferências.
- **Valor comercial:** avaliação derivada para marcas e campanhas.

Popularidade e contratos não aumentam atributos, não garantem escalação,
transferência ou convocação.

## Fluxo comercial

Oito marcas fictícias possuem categoria, prestígio, orçamento, mercados, faixa
etária e critérios próprios. O fluxo persistido é: observação, interesse,
contato, negociação, proposta, contrato ativo e encerramento. São suportados
pagamento fixo, fixo com bônus, contrato por temporada e campanha pontual.

Propostas permitem aceitar, recusar, pedir tempo ou negociar valor, duração e
bônus, com limite de rodadas. Exclusividade impede dois acordos incompatíveis na
mesma categoria. Contratos podem expirar, renovar ou ser encerrados após
descumprimentos repetidos.

## Finanças, agenda e mídia

Pagamentos e bônus usam a carteira e o ledger canônicos. Chaves persistidas
evitam pagamento duplicado após save/reload. Eventos comerciais aparecem no
calendário, nunca substituem partida oficial e podem ser confirmados, recusados
ou reagendados. Inbox e notícias existentes recebem contatos, propostas,
contratos, renovações e acontecimentos publicáveis.

A tela **Mundo > Patrocínios** reúne visão geral, propostas, contratos, marcas e
histórico. A tela de finanças mostra receita comercial acumulada.

## Compatibilidade e determinismo

Saves anteriores recebem estado comercial seguro, sem contratos retroativos.
Interesses, propostas e eventos usam o RNG canônico; não há `Math.random()` na
lógica persistente. Históricos encerrados e partidas neutras antigas são
compactados sem apagar placares, carreira do jogador ou arquivos anuais
relevantes, mantendo a carreira de dez temporadas dentro do limite de 3 MB.

## Validação

- 18 testes específicos da Etapa 12.
- equivalência entre avanço de 30 dias e 30 avanços diários;
- pagamento único após salvar e reabrir;
- exclusividade e decisões de evento;
- perfis de entrada até superestrela e valor comercial não dependente só do GER;
- simulação determinística de dez temporadas, com save/reload anual.

