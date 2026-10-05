# PRO-LIFE — Simulation Engine 3.0

## Visão
O PRO-LIFE permanece um simulador de carreira sem gameplay manual. O jogador configura sua identidade e comportamento; o técnico configura a equipe. O motor transforma essas decisões, atributos e contexto em uma partida determinística por seed, estatísticas e consequências de carreira.

## Referência de design
A referência conceitual é a Carreira/Authentic do FC 26: experiência metódica, tática, menos previsível; flexibilidade de visão tática; identidade por funções; progressão por arquétipos; mercado de treinadores alterando táticas; eventos inesperados. Não copiamos fórmulas proprietárias.

## Princípios
1. Mesma regra para partida rápida, avanço e temporada.
2. Nenhuma UI inventa resultado.
3. Toda configuração deve produzir efeito mensurável e também tradeoff.
4. Seed + estado + decisões iguais => resultado igual.
5. Compatibilidade com saves antigos.
6. Probabilidades calibradas por testes em lote, não por sensação.
7. Jogador e técnico usam o mesmo motor.

## Arquitetura alvo
- simulation-tactics.js: plano de equipe, instruções individuais, matchup e tradeoffs.
- match-simulation.js (próxima extração): fases, eventos, momentum e estatísticas.
- match-analysis.js: relatório pré/pós-jogo e explicações.
- engine.js: orquestra calendário e consequências; deixa de conter fórmulas detalhadas da partida.
- statistics.js: fonte canônica das estatísticas acumuladas.
- squad.js: seleção, hierarquia e funções.

## Plano tático do técnico
Formação; construção; abordagem defensiva; ritmo; largura; linha; pressão; verticalidade; risco. Próximos incrementos: funções por posição, bolas paradas, substituições planejadas, plano A/B/C e ajustes por placar/minuto.

Cada escolha precisa ter benefício e custo. Pressão alta aumenta recuperação e fadiga. Linha alta comprime espaço mas aumenta ameaça nas costas. Posse melhora controle, mas pode reduzir verticalidade. Contra-ataque abre mão de posse para ganhar transição.

## Plano individual do jogador
Intenção ofensiva; risco de passe; frequência de chute; pressão; movimentação. Próximos incrementos: liberdade criativa, entrada na área, apoio/profundidade, agressividade defensiva e bola parada.

O motor deve cruzar instrução com posição, arquétipo, atributos, moral, físico, confiança e plano do treinador. Instruções incompatíveis não criam bônus grátis: geram risco, fadiga ou queda de eficiência.

## Estados da partida
Planejado para a próxima etapa:
- equilíbrio;
- domínio territorial;
- pressão;
- transição;
- defesa de vantagem;
- busca do resultado;
- desorganização;
- final de jogo.

O estado muda com minuto, placar, força relativa, fadiga, cartões, substituições, mando e instruções. Isso cria narrativa sem gameplay manual.

## Estatísticas alvo
Equipe: posse, xG, chutes, no alvo, grandes chances, passes, precisão, passes progressivos, entradas no terço final, cruzamentos, escanteios, recuperações altas, desarmes, interceptações, duelos, faltas, cartões.
Jogador: minutos, nota, gols, assistências, xG/xA, chutes, passes, passes-chave, chances criadas, dribles, duelos, desarmes, interceptações, perdas, recuperações e mapa textual de influência por zona.

## Carreira de jogador
Pré-jogo: instrução do treinador + configuração individual + objetivos.
Pós-jogo: nota explicável, XP de carreira, XP de arquétipo, confiança, evolução e análise textual baseada em fatos.
A atuação deve influenciar titularidade, mercado, seleção, imprensa, prêmios e potencial dinâmico.

## Carreira de técnico
Pré-jogo: relatório do adversário, plano tático e escalação.
Durante a simulação: janelas de decisão opcionais (intervalo e momentos críticos), sem controle do atleta.
Pós-jogo: diagnóstico tático e efeitos em moral, diretoria, elenco e reputação.
IA dos treinadores mantém identidade e pode alterá-la após troca de comando.

## Roadmap
### S1 — Fundação
Núcleo tático isolado, presets legados, matchup e testes determinísticos.

### S2 — Match Engine
Extrair simulação do engine.js; introduzir estados de partida, contexto e estatísticas avançadas.

### S3 — Técnico
Editor tático completo, funções, planos A/B/C, substituições e instruções condicionais.

### S4 — Jogador
Instruções individuais, objetivos contextuais, nota explicável e impacto real dos arquétipos.

### S5 — Inteligência
Scout pré-jogo, IA adversária, adaptação por placar/minuto e identidade de treinadores.

### S6 — Matchday
Pré-jogo, simulação ao vivo com intervenções, intervalo e pós-jogo analítico.

### S7 — Calibração
Milhares de simulações por seed; metas de gols/xG/posse/cartões/mandante/upsets; regressão estatística.

### S8 — Mundo vivo
Mudanças de treinador alteram tática; eventos, lesões, moral, calendário e mercado afetam planejamento.

## Definition of Done
Nenhuma etapa entra na main sem check, testes unitários, UI tests e build verdes. Mudanças probabilísticas precisam de teste de distribuição e determinismo. Saves antigos devem abrir sem perda silenciosa.
