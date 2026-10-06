# Etapa 22 — Personalidade e reputação dinâmica

A carreira de jogador agora constrói uma identidade persistente a partir das escolhas feitas em entrevistas, conversas com o treinador e acontecimentos inesperados. A implementação preserva a reputação global já usada pelo jogo e adiciona uma camada complementar, sem substituir os sistemas das etapas anteriores.

## Estado persistido

O bloco `extras.playerCareer.personality` guarda oito traços (profissionalismo, ambição, lealdade, humildade, liderança, disciplina, presença na mídia e espírito de equipe), quatro segmentos de reputação (pública, vestiário, treinador e comercial), perfil dominante, histórico limitado e controle idempotente de eventos processados.

Saves antigos recebem valores neutros na primeira inicialização. A migração é determinística, não consome o RNG global e não é criada no modo treinador.

## Integrações

- Entrevistas atuais e legadas influenciam os traços de acordo com a resposta.
- Conversas da Etapa 19 atualizam a personalidade sem substituir confiança, papel, promessas ou histórico com o treinador.
- Eventos da Etapa 20 aplicam seus efeitos antigos e, em seguida, registram a consequência de personalidade uma única vez.
- A reputação no vestiário ajusta em no máximo 10% os pesos relativos de apoio de companheiro e conflito no treino.
- Mercado, marcas e exigência mínima de promessas recebem modificadores pequenos e limitados.
- O agente pode contextualizar sua recomendação com ambição ou lealdade altas, sem alterar a estratégia escolhida pelo usuário.
- A reputação esportiva global continua canônica e separada da reputação segmentada.
- A tela Vida mostra perfil dominante, principais traços, reputações, imagem pública e histórico recente.

## Segurança e compatibilidade

Todos os valores ficam entre 0 e 100, cada escolha altera no máximo cinco pontos por campo e o histórico mantém as cem entradas mais recentes. O módulo não usa `Math.random()` nem altera `state.rng`. A validação de save reconhece e verifica a versão 1 do novo bloco.

## Testes

Os testes específicos estão em `tests/player-personality-stage22.test.cjs` e `tests/player-personality-ui-stage22.test.cjs`. Eles cobrem migração, idempotência, limites, escolhas válidas e inválidas, integrações com as Etapas 19–21, save/reload, independência de RNG, modo treinador e apresentação da interface.
