# Etapa 13 — Arquétipos 2.0, especializações e identidade

- Catálogo único em `src/domain/training.js`: 10 arquétipos (novos: Ponta Veloz, Lateral Ofensivo) e árvores de 3 especializações por arquétipo. As 5 especializações antigas viraram `legacy` e mantêm o bônus original.
- Regras em `src/domain/identity.js` (`ProLifeIdentity`): afinidade = comportamento (partidas + treino, média móvel) × encaixe de atributos; perfil secundário pode vir de posição vizinha; troca do principal exige margem sustentada por 20 partidas (com intervalo mínimo de 40).
- Métricas usadas: gols, assistências, finalizações, no alvo, xG, desarmes, defesas, clean sheet, minutos e nota — todas já registradas.
- Desbloqueio: nível + afinidade + atributos + estatística de carreira + 1 ponto de especialização. Efeitos moderados: +10% de progressão nos atributos da especialização ativa e +6% de XP em ações/treinos relacionados.
- Persistência: `trainingPlan.identity`, `trainingPlan.activeSpecialization`, `trainingPlan.specializations` (até 6). Saves antigos derivam a identidade só de posição, atributos e estilo atuais.
- Integrações leves: mercado (`styleFit`, peso 0,8 no sorteio de propostas), seleção (`tacticalFit`, até +1), patrocínio (`commercialAppeal`, até +2,5). Prêmios não foram alterados.
- Testes: `tests/identity-stage13.test.cjs`.
