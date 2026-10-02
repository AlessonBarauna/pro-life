> Documento original da v0.1. Para as regras vigentes, consulte [Atualização 0.3](ATUALIZACAO_0.3.md).

# Design da versão 0.1

## Experiência entregável
Escolher carreira > criar identidade > escolher clube/proposta > treinar ou
escalar > avançar o tempo > ler partidas > decidir > mudar de clube > continuar.
Treinador contrata atletas e compra licenças. Jogador pode aposentar aos 30 anos
ou depois e virar treinador, preservando patrimônio, reputação e universo.

## Identidade
Nome, cidade, idade (jogador 14–35, treinador 25–65), altura, peso, posição,
pé, estilo, comemoração e retrato SVG com pele, cabelo, olhos, roupa, barba,
porte, óculos e tatuagens. É um retrato 2D com opções limitadas, não editor de
rosto 3D. Cidade, pé, altura, roupa, estilo e comemoração são metadados; nesta
versão não afetam partidas. Não há animações de corrida ou comemoração.

Realista começa com atributos base 40, Promessa 46 e Prodígio 54. Há 30 pontos
adicionais distribuíveis, máximo 20 por atributo. Isso não garante sucesso.
Jogador inicia numa categoria descrita pela idade; não existe campeonato de
base separado nem promoção formal nesta versão. Titularidade depende da
comparação com o elenco, moral e condição, com oportunidades probabilísticas
para o protagonista. Pode iniciar na base e não ser usado em jogos profissionais.

## Partidas
94 passos temporais agregados: não há física nem ação por segundo. A posse é
probabilística e depende de passe, resistência e tática; o mandante recebe
vantagem pequena. Ataque usa velocidade/passe; defesa usa marcação/força.
Finalizações geram xG estimado pela qualidade da chance, força relativa e
variação. A execução depende da finalização e da marcação do goleiro.
O placar é a soma dos eventos de gol, sem sorteio prévio do resultado.
Moral e condição afetam qualidade; desgaste durante jogo reduz controle.
Lesões e cartões amarelos são sorteados como eventos com influência de disciplina.
Lesões podem gerar reposição, mas não há expulsões, suspensões acumuladas,
substituição manual, formação geométrica ou intervenções durante uma partida.
Minutos e notas são aproximações; substituições por lesão não possuem contagem
individual exata de minutos. Goleiro usa marcação como atributo agregado de defesa.
Resumo é texto determinístico a partir de estatísticas e eventos; não usa IA online.

## Desenvolvimento e mundo
Foco/carga influenciam progressão do protagonista, condição e lesões. A chance
de melhorar depende de disciplina, idade e potencial oculto. NPCs evoluem na
virada de ano; veteranos regridem e são substituídos por jovens quando passam
de 36. NPCs não treinam diariamente individualmente. A liga funciona para todos
os clubes. NPCs não negociam transferências ou demitem seus próprios técnicos.
Seu treinador pode ser demitido por baixa confiança, aferida mensalmente.

## Calendário
Uma liga de oito clubes, ida e volta, 14 rodadas. Rodadas nos dias 7, 28, 49,
70, 91, 112, 133, 154, 175, 196, 217, 238, 259, 280 de cada ano simulado.
Virada no dia 365. Esse calendário experimental não corresponde ao futebol real.
A tabela é atualizada em cada rodada; pontos, saldo e gols decidem a ordem.

## Mercado, contratos e finanças
Propostas de carreira a cada 28 dias, até três, ordenadas por encaixe aproximado
entre estrutura e nível/reputação; expiram em 21 dias. As primeiras duram 30 dias.
Clube direto na criação é permitido. Aceitar muda o clube imediatamente.
Sem janela, multa, rescisão ou negociação salarial; contrato de 365 dias é
informativo e não vence operacionalmente. Não confundir com sistema contratual real.
Como treinador, compras usam valor por nível/idade, orçamento e estrutura do
clube; vendedores preservam ao menos 18 atletas. Não há salários NPC individuais.
Pessoal recebe mensalmente se tiver clube, paga despesas e cursos/agência.
Clube paga custo fixo e salário do personagem; recebe verba na virada do ano.
Não há sistema de falência nem cobrança de dívida pessoal.

## Vida
Três famílias de eventos: visita à família, entrevista e agência. Ocorrem a
cada 21 dias, se não houver pendência. Escolhas alteram patrimônio, reputação,
pressão, família, moral, progresso ou confiança. Família/pressão são indicadores
narrativos, sem modelo psicológico profundo. Sem escola, bens, romance ou rede
social funcional. Nada é promessa de simular toda a vida de um atleta agora.

## Próximos incrementos de produto
1. Base com liga própria, peneiras, promoção e participação nos treinos.
2. Contratos com término efetivo, janelas e interesses das duas partes.
3. Licenças, comissão e personalidade afetando treino e gestão.
4. Empresas, imprensa e relacionamentos com memória e consequências.
5. Calendário brasileiro real, copas e expansão regional/internacional.
6. Scouts com intervalos de avaliação, dados editáveis/importáveis e saves migráveis.
7. Retrato mais completo e cenas de apresentação. Partidas visuais só se fizer sentido.

A base foi projetada para expansão. Os tópicos acima ainda não estão implementados.
