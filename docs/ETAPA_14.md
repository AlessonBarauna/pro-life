# Etapa 14 — Histórias de origem, criação de jogador e início de carreira

- Regras em `src/domain/creation.js` (`ProLifeCreation`); catálogo único das histórias em `Training.origins[id].story` (6 histórias: Começando do Zero, Joia da Base, Grande Promessa, Recomeço, Caminho Difícil, Personalizada; "Herdeiro de uma Lenda" segue disponível via API).
- Criação opt-in: `D.create({ ..., creation: { difficulty, personality, custom } }, seed)`. Sem `config.creation` o fluxo clássico (e os saves antigos) não muda.
- Atributos: perfil por posição + arquétipo + estilo + variação semeada, normalizados ao overall alvo da história; ajuste fino de até 10 pontos (máx. 6 por atributo).
- Oportunidades: 3 (2 em "Caminho Difícil") a partir de elencos reais — vitrine, espaço para jogar, projeto de desenvolvimento — com salário via `Career.realisticSalary`, contrato via `Career.signContract`; nunca prometem titularidade (Etapa 6 decide).
- Início: `registerStart` (idempotente) grava evento "Início da carreira profissional", mensagens, expectativa e 3 objetivos derivados de estatísticas reais.
- Dificuldade (Casual/Normal/Realista/Desafiador): multiplicador de progressão, exigência das metas e salário. Não altera resultados de jogo.
- Persistência: `s.creation` (seed canônica, história, dificuldade, personalidade, arquétipo, estilo, pontos, contexto inicial, clube/contrato). Saves antigos não recebem origem retroativa.
- UI: `src/ui/creator.js` (HISTÓRIA → JOGADOR → POSIÇÃO → IDENTIDADE → OPORTUNIDADES → CONFIRMAR); treinador continua no formulário clássico. Painel "História de origem" em Meu Jogador.
- Testes: `tests/creation-stage14.test.cjs`.
- Pendências: tolerância do treinador por dificuldade não implementada; `potential` pouco limita a progressão (piso 82 em `Training.ceiling`); sem nacionalidade/posição secundária.
