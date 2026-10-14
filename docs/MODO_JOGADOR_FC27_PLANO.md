# PRO-LIFE — Modo Jogador: auditoria e plano de evolução

Data: 2026-10-14
Branch de trabalho: `feature/fc27-player-career-overhaul`
Base: `main` (commit `a1686cfa2305ff4611678a19788071e283faa3d5`)

## Objetivo
Evoluir o modo carreira de jogador para uma experiência profunda de futebol: criação, configuração, decisões, rotina, progressão, mercado, partidas e apresentação. O EA SPORTS FC serve de referência de **funcionalidades e princípios de usabilidade**, sem copiar código, arquivos proprietários, identidade visual exclusiva ou alegar acesso ao motor interno do jogo.

## Inventário verificado no repositório

| Área | Evidência no código | Próxima investigação |
|---|---|---|
| Criador | `src/ui/creator.js`, `src/domain/creation.js` | Validar ponta a ponta 6 etapas, idade, perfil, aparência, dificuldade, clube inicial |
| Identidade e avatar | `src/domain/identity.js`, `src/domain/character.js`, `src/ui/avatar3d.js` | Conferir persistência de cada opção e reflexo efetivo no modelo 3D |
| Carreira, contratos e mercado | `src/domain/career.js`, `src/domain/world-live-market.js` | Coerência entre ofertas, papel no elenco, negociação e transferências |
| Hierarquia e partidas | `src/domain/squad.js`, `src/domain/engine.js`, `src/ui/live-match.js` | Titular, banco, substituições, minutagem e notas vinculadas a acontecimentos reais |
| Treino e evolução | `src/domain/training.js`, `src/domain/player-development.js`, `src/ui/player-development-view.js` | Ganhos graduais e consistência entre atributos, GER, potencial, fadiga e idade |
| Treinador e personalidade | `src/domain/player-personality.js`, testes stage19–22 | Consequências coerentes, cooldowns e relações que mudam com desempenho |
| Eventos narrativos | `src/domain/unexpected-events.js`, `src/domain/story-hub.js` | Decisões contextualizadas, prazos, efeitos persistentes e não repetição excessiva |
| Condicionamento | `src/domain/physical.js` | Lesões, recuperação, retorno, risco e impacto real no tempo de jogo |
| Vida fora de campo | `src/domain/life.js`, `src/domain/off-field.js`, `src/domain/commercial.js` | Contratos, dinheiro, rotina, patrocínio e efeitos moderados na carreira |
| Dashboard e UI | `src/ui/home-dashboard.js`, `src/ui/fc27-05c-player.css` | Hierarquia visual, navegação, responsividade e explicação dos resultados |
| Saves | `src/infrastructure/save.js`, `src/infrastructure/validate-expansion.js` | Compatibilidade com carreiras anteriores, migrações e persistência |
| Isolamento treinador | `src/domain/coach-career.js` | Regressão de `mode === "coach"` após toda mudança compartilhada |

### Configurações atuais já identificadas
- Dificuldades em `creation.js`: casual, normal, realista e desafiador, com modificadores de progressão, metas e salário.
- Personalidades iniciais: equilibrado, profissional, ambicioso, carismático e líder.
- Criador em seis passos: história, jogador, posição, identidade, oportunidades e confirmação.
- Idade personalizada saneada entre 14 e 32; overall inicial e reputação limitados para evitar estados impossíveis.
- Base de elencos FC27 escolhida no criador (`fc27_v1`); isso **não** implica equivalência funcional completa com o jogo de referência.

## Etapas de implementação

### J01 — Auditoria funcional do modo jogador
- Mapear as configurações acessíveis, seu armazenamento e efeitos reais.
- Testar criação, primeiro dia, avanço de tempo, jogos, transferências, aposentadoria e recarga de save.
- Gerar matriz: implementado / parcial / ausente / com defeito, por tela e por sistema.
- Evitar mudanças de mecânica até fixar os contratos que precisam ser preservados.

### J02 — Criar jogador e configurações iniciais
- Configurações reais e persistentes de dificuldade, duração, assistências de simulação e ritmo de evolução, onde suportado pelo motor.
- Personalização de rosto, pele, cabelo, barba, olhos e acessórios com atualização do avatar.
- Nomes, nacionalidade, aniversário, altura, peso, posição, pé dominante e estilo.
- Clubes de partida e ofertas adequadas ao nível inicial; prévia honesta das consequências.

### J03 — Central de carreira
- Próximo jogo, posição no elenco, forma, moral, confiança do treinador, condição física e notificações.
- Navegação padronizada, sem informações inventadas ou duplicadas.

### J04 — Treino, progressão e temporada
- Vincular ações e partidas aos atributos e GER, com curva por idade, potencial e perfil.
- Corrigir inconsistências entre screens, cargas de treino e descanso.
- Avaliação por temporada e histórico das mudanças.

### J05 — Acontecimentos, decisões e consequências
- Conversas com treinador, imprensa, empresário e clube condicionadas ao estado real da carreira.
- Decisões com prazo, cooldown, contexto, efeito verificável e prevenção de repetição.
- Lesões, recuperação e mudanças de papel no elenco conectadas a eventos e escalação.

### J06 — Mercado, contratos e transições
- Interesse de clubes plausível por posição, qualidade, reputação, finanças e necessidade do time.
- Propostas com papel, tempo de contrato, salário e perspectiva de minutos.
- Persistência e histórico após trocar de clube.

### J07 — Interface e validação final
- Refinar hierarquia visual baseada em padrões de interface de jogos de futebol, com design próprio.
- Navegação acessível por teclado, estados vazios e layout responsivo.
- Testes de fluxo jogador e de não regressão do treinador.

## Regras de engenharia
1. A `main` permanece intacta até validação e revisão.
2. Não alterar saves existentes sem migração compatível.
3. Preferir o motor compartilhado de partidas/competições; não duplicar sistemas já validados.
4. Usar RNG determinístico para acontecimentos; evitar `Math.random()` e `Date.now()` no domínio.
5. Testar primeiro `node --check` nos módulos alterados e `node --test --test-reporter=tap` nos testes afetados; depois `npm run check`, `npm run test:ui` e regressões relevantes.
6. Ao fornecer PowerShell, capturar pass/fail corretamente pelo resumo TAP e exit code; gravar logs em .txt e abrir no Notepad para compartilhamento.
7. Não considerar testado localmente o que só foi revisado por leitura do GitHub.
8. Cada etapa termina com arquivos alterados, evidências de teste, riscos restantes e roteiro de teste manual.

## Primeira entrega
Esta mudança registra o inventário inicial e o sequenciamento, sem modificar ainda as regras da partida. Antes de ampliar o escopo, usar a matriz J01 para priorizar defeitos efetivos e integrações faltantes.
