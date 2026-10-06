# Validação da entrega

## Executado na v0.4

Node 24 no Windows. A suíte automatizada terminou com 40 testes aprovados,
sem falhas, cancelamentos, testes ignorados ou pendentes. Ela cobre motor,
personagem, carreira, ferramentas e a expansão da v0.4, incluindo:

1. Séries A/B/C/D, 80 clubes e 38 rodadas por divisão.
2. Temporada completa, placares, eventos, transferências e decisões.
3. Modos Jogador e Treinador, tática, escalação e licença.
4. Treinamento com 27 atributos e evolução influenciada pelo estilo.
5. Estatísticas, assistências, melhores em campo e prêmios.
6. Competições nacionais/estaduais simuladas e agência de carreira.
7. Inicialização limpa, migração e carregamento de save existente.
8. Novo save, autosave, save manual, exportação/importação, reabertura e
   integridade do round-trip.
9. Rejeição de saves corrompidos e renderização segura de conteúdo importado.
10. Copa do Brasil com 32 classificados, cinco fases e 31 jogos.
11. Estadual do clube da carreira no início do ano.
12. Quatro acessos e quatro rebaixamentos entre A/B, B/C e C/D.
13. Prêmios por Série A/B/C/D com atleta, clube e divisão registrados.
14. Time da temporada 4-3-3 por competição, combinando nota, gols, assistências, defesas e desarmes.

### Calibração
Capital Esporte (nível base 76, mandante) versus Mogi Atlético (base 53):
1.000 universos/seeds, 686 vitórias do favorito, 203 empates e 111 zebras.
Média: 2,739 gols por jogo. Isso verifica variabilidade e faixa básica do modelo,
não calibração acadêmica ou reprodução estatística de campeonatos reais.
Seed determinística não fixa vencedor antes da partida: reproduz os mesmos
sorteios e as mesmas ações quando todos os parâmetros são iguais.

### Interface
Testes DOM com jsdom 30.1.1 passaram nos dois modos: criação, aceite de proposta,
todas as 14 páginas, primeira rodada, relatório, decisão e retomada por autosave.
Treinador: mudar tática, salvar titulares e curso de licença. Save com nome
contendo HTML é renderizado como texto; histórico com campo numérico malicioso
é recusado. Isso não substitui revisão profissional de segurança.

### Conferência visual e limites

A aplicação foi aberta no navegador integrado local em Windows. As 14 telas
foram navegadas nos dois modos; o tema escuro, a responsividade em 390 px e a
ausência de overflow horizontal foram conferidos. Tática, escalação, licença,
treino, calendário, Séries A/B/C/D, partidas e telas novas foram acionados sem
erros ou warnings no console. O navegador confirmou a ação de exportar; o
conteúdo JSON e a importação são cobertos pelos testes automatizados, pois o
ambiente integrado não expõe o arquivo de download. Não houve matriz manual em
Edge/Chrome externos nem medição de memória ou desempenho prolongado.

## Reproduzir como desenvolvedor
Na pasta do jogo, com Node instalado:

```
node --test tests/engine.test.cjs
node --check src/ui/app.js
```

Teste DOM adicional (apenas desenvolvimento, não necessário para jogar):

```
npm install
npm run test:ui
```

O pacote não contém node_modules. Não rode npm se quiser apenas jogar.

## Teste no notebook
1. Extraia e abra index.html/ABRIR_PRO_LIFE.bat; confirme layout sem textos cortados.
2. Crie jogador aos 16 com retrato customizado; verifique a identidade na página.
3. Aceite proposta e avance sete dias; confirme quatro resultados na liga.
4. Confira seu resultado, eventos e estatísticas; ficar no banco é possível.
5. Avance até dia 21, faça uma decisão e confira alterações de indicadores.
6. Exporte o save JSON, recarregue e compare dia, clube, saldo e atributos.
7. Importe o mesmo arquivo; confirme os mesmos dados. Faça isso antes de trocar
   navegador ou mover pasta. Se autosave não funcionar, use exportação sempre.
8. Exporte a carreira, crie treinador, ajuste tática, selecione 11 com goleiro.
9. Faça contratação compatível com orçamento; confira transferência e débito.
10. Ajuste a janela entre 1280x720 e tela cheia; confira navegação e tabelas.

Para abrir pelo PowerShell, se extraído em Downloads:

```
Start-Process "$env:USERPROFILE\Downloads\PRO_LIFE_v0.1\ABRIR_PRO_LIFE.bat"
```

Envie o texto do erro ou descreva o passo que falhou para corrigirmos a próxima versão.

## Infraestrutura v0.1.1
Adicionados testes HTTP/SSE da prévia local: só assets permitidos, cache desativado,
rota de live reload e notificação ao modificar arquivo. Teste de build verifica
que arquivos pessoais não são copiados, hash é estável e alterações o modificam.
CI executa testes de motor, ferramentas e DOM antes de gerar o artefato estático.
Deploy real no GitHub e abertura do BAT no Windows ainda dependem do repositório
configurado e da validação no computador do usuário.

## Validação v0.4

A suíte automatizada inclui testes de Séries A/B/C/D, cobertura parcial C/D,
27 atributos, evolução por estilo, estatísticas, assistências, prêmios, agência,
competições, autosave, exportação/importação, save manual, reabertura e integridade
após round-trip. Também cobre Copa do Brasil, estadual da carreira, ranking,
acesso/rebaixamento e premiações com clube. O fluxo DOM percorre todas as telas
nos modos Jogador e Treinador.

## Career 2.0 — Etapa 5

Os testes cobrem normalização de saves antigos sem dados internacionais,
persistência da carreira pela Seleção, composição da agenda integrada, mudança
de mês, retorno ao mês atual, grade de 42 dias, rota do botão Abrir calendário e
renderização não vazia da Seleção antes da primeira convocação.

A cobertura de competições valida todos os estaduais representados, fase de
grupos, geração das eliminatórias e final, campeão/vice, estatísticas isoladas
da Copa do Brasil e dos estaduais, cinco prêmios gerais do ano e migração do
calendário estadual antigo sem recriar a Copa do Brasil em andamento.

Datas FIFA são verificadas quanto à convocação com sete dias de antecedência,
Brasil x Argentina em 30/05, Brasil x Uruguai em 02/06, ausência de partidas de
clube durante a janela protegida, prioridade na tela inicial e permanência dos
jogos da Seleção no calendário depois de disputados.

### Etapa 7 — Mundo Vivo
- normalização do estado `extras.livingWorld` em saves anteriores;
- cálculo de forma dos 80 clubes a partir de partidas reais da carreira;
- persistência de acontecimentos e feed `Mundo do futebol`;
- ausências da IA por lesão/suspensão sem quebrar escalações.

## Career 2.0 — Etapa 12

A cobertura específica possui 18 testes para separação entre reputação,
popularidade, valor de mercado e valor comercial; critérios das oito marcas;
perfis de balanceamento; pipeline determinístico; aceitar, recusar, negociar e
pedir tempo; exclusividade; quatro tipos de acordo; eventos e conflitos de
agenda; advertências; renovação; ledger e deduplicação; equivalência temporal;
saves antigos; retenção histórica e carreira longa. O roteiro
`node tools/simulate-stage12.cjs` simula dez temporadas e reabre o save a cada
ano mantendo o limite de 3 MB.


## Etapa 17

`tests/agency-stage17.test.cjs` cobre o sistema de empres?rio e ag?ncia.

`tests/calendar-special-dates.test.cjs` protege os eventos recorrentes de Natal e Ano-Novo.

Antes de publica??o, executar:

```
npm run check
npm test
npm run test:ui
npm run build
```

Depois dos testes automatizados, realizar teste manual da carreira antes de commit/push.
