# PRO LIFE 0.3 — Brasil, mercado e vida de carreira

## Mudanças

- Tema escuro em todas as telas, incluindo formulários, tabelas e gráficos.
- Visão geral com número da camisa editável, atributos, ficha, salário, contrato,
  minutos/gols na temporada, números de carreira registrados e nota média.
- Evolução: 30/90/180 dias ou histórico completo, seis curvas simultâneas,
  variação por atributo, pontos com valores e tabela. Snapshots semanais e a cada
  melhoria, limitados aos 260 registros mais recentes. Não inventa histórico antigo.
- Novas carreiras: Séries A e B brasileiras, 20 clubes por liga, 38 rodadas em
  turno/returno. Clubes das duas ligas são destinos possíveis de carreira e scouting.
- Três janelas do jogo: 01/01–28/02, 01/07–31/08, 15/11–31/12. Aceitar proposta
  ou contratar fica bloqueado no domínio fora desses períodos, mesmo por comando.
- Entrevista equilibrada aumenta moral/reputação/seguidores. Prometer resultados
  gera objetivo de duas vitórias em três partidas do clube; cumprir/falhar afeta
  reputação, moral, pressão e confiança. O objetivo sobrevive ao save.
- Sete bens pessoais: recuperação, bicicleta, academia, carros e imóveis. Compra
  única, manutenção mensal, efeitos explícitos, extrato e revenda por 70%. Não há
  pagamentos reais, crédito, juros, aluguel nem valorização imobiliária.
- Feed com notícias, torcida, entrevistas, transferências confirmadas, títulos,
  rumores identificados e curtidas locais. NPCs podem trocar de clube em janelas,
  com conservação do dinheiro dos clubes. Nenhuma publicação é notícia real.

## Dados e fontes

Base factual consultada em 02/10/2026 (01/10 à noite no Brasil):

- Confrontos e mandos da Série A: [tabela básica CBF 2026, emitida em 15/12/2025](https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn/Tabela_BA_sica_Brasileiro_SA_rie_A_2026_d64996b4d8.pdf).
  São 380 confrontos; a simulação agrupa todos os jogos na primeira data prevista
  de cada rodada. Não reproduz horários, adiamentos ou atualizações posteriores.
- Clubes e nomes/idades/posições dos jogadores: registros da ESPN para [Série A](https://site.api.espn.com/apis/site/v2/sports/soccer/bra.1/teams?limit=100)
  e [Série B](https://site.api.espn.com/apis/site/v2/sports/soccer/bra.2/teams?limit=100),
  com os endpoints de elenco guardados em cada clube de `world2026.js`.
  Elencos reduzidos a 32 atletas, priorizando aparições registradas e goleiros.
  Registros duplicados de atletas em clubes diferentes usam o clube com mais
  aparições. São 1.280 nomes na base; não é um cadastro completo nem oficial de
  atletas inscritos. Os dados não se atualizam pela internet durante o jogo.
- Tabela da Série B: gerada pelo motor; usa o mesmo calendário agrupado da
  simulação. Não representa confrontos ou datas oficiais da Série B.
- Atributos, estrutura, orçamento, salários, preços, resultados e relações são
  valores de game design. Não são estatísticas ou avaliações oficiais dos atletas.
  Não copiamos escudos, fotografias, modelos, interface ou assets de EA/SEGA.

## Compatibilidade

Saves versão 1 continuam válidos. Uma carreira antiga conserva seus oito clubes,
14 rodadas, progresso, personagem e dinheiro. Ela recebe as outras funcionalidades
imediatamente. Em **Liga e calendário**, é possível escolher um clube brasileiro e
clicar **Migrar na próxima temporada**. A troca de universo acontece na virada do
ano. Resumos da antiga liga ficam no histórico/diário; relatórios de partidas da
liga anterior são limpos porque seus IDs pertenciam ao mundo antigo.

O carregamento de um autosave sem identificação de universo guarda uma cópia
local em `prolife.v02.backup` antes de migrar a estrutura. Exportar JSON continua
sendo o backup portátil. Números de carreira anteriores disponíveis vêm dos
contadores existentes; notas e extrato começam nesta versão, sem reconstrução
fictícia. Bens, promessas, feed e destino da migração persistem no JSON.

## Limites

Sem acesso/rebaixamento, playoffs, copas nacionais/continentais, escalação por
formação geométrica, animação de partidas ou comemorações. As temporadas futuras
reutilizam a base de confrontos 2026, em anos simulados de 365 dias. Veteranos
aposentados são substituídos por jovens fictícios. O contrato continua informativo
no vencimento; não há multa rescisória nem renovação detalhada. 3D do personagem
continua procedural e estilizado. O gráfico acompanha atributos futebolísticos,
portanto tem utilidade limitada no modo treinador.

## Teste no jogo

1. Atualize a página e confirme que Visão geral, Mercado e Finanças estão escuras.
2. Em Meu personagem, mude o número, salve e confira a camisa e a visão geral.
3. Avance o calendário, escolha Todos os atributos na evolução e troque o período.
4. Confira ambas as ligas e as 38 rodadas numa nova carreira brasileira.
5. Tente aceitar proposta fora de uma janela; o botão deve ficar bloqueado.
6. Responda entrevista prometendo resultados e acompanhe três partidas do clube.
7. Com saldo, compre equipamento de recuperação; confira o extrato e a manutenção
   no próximo fechamento mensal. Venda e confira os 70% creditados.
8. Veja transferências, filtre Rumores, curta um post e recarregue a página.
9. Em save antigo, programe migração; confira que a liga muda somente na virada.

## Validação

26 testes automatizados: calendário, temporadas, determinismo, save e migração,
janelas, bens, promessas, transferência NPC, conservação de dinheiro e corrupção
numérica/estrutural. Fluxos DOM verificam ambos os modos e escape de dados. A
verificação em Chromium cobre tema, WebGL, camisa, compra, gráfico, ligas, bloqueio
do mercado, feed, reload e ausência de overflow horizontal em 390 px.

## Correção de propostas após assinatura
Assinar com um clube encerra as propostas de carreira da janela atual. Novas
propostas só voltam na abertura da janela seguinte, mesmo que a janela atual
ainda esteja aberta. Isso não bloqueia o scouting do treinador ou o mercado NPC.
Saves existentes usam o último contrato registrado para recuperar esse prazo e
removem as propostas antigas que estavam aparecendo indevidamente.
