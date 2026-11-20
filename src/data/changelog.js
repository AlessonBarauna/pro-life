/* Novidades mostradas no app depois de cada atualização.
 * REGRA: toda atualização publicada ganha uma entrada nova NO TOPO desta lista (a mais recente primeiro).
 * `id` é único e nunca muda (o app guarda o último id visto). Tipos: novo, ajuste, correcao.
 * Escreva para o jogador, em português, sem jargão técnico. */
(function (root) {
  "use strict";
  const ENTRIES = [
    {
      id: "2026-11-19-l",
      date: "2026-11-19",
      title: "Pop-ups de aviso corrigidos e testados",
      items: [
        { t: "ajuste", x: "Os pop-ups de aviso agora aparecem por cima do Mercado e de outras telas abertas e fecham ao clicar no botão. Cada botão foi testado: proposta recebida abre Negociações, sondagem aceita abre a negociação do jogador, relatório do olheiro abre a Rede de olheiros, base abre a Academia, convocação abre a aba Convocação e investidor abre Investidores." }
      ]
    },
    {
      id: "2026-11-19-k",
      date: "2026-11-19",
      title: "Pop-ups de aviso e escalação 100% manual",
      items: [
        { t: "novo", x: "Agora aparece um pop-up na tela quando o olheiro termina a pesquisa, quando alguém faz proposta por um jogador seu, quando uma sondagem é respondida, quando um jogador se lesiona ou é suspenso, quando a convocação da seleção abre e quando chega proposta de investidor. O botão do pop-up leva direto para a tela de responder (aceitar, recusar ou negociar)." },
        { t: "ajuste", x: "A escalação não é mais refeita pelo GER antes de cada jogo. Quem você colocar como titular continua titular, mesmo com GER baixo. O botão \"Escolher os melhores\" monta o time ideal só quando você clicar. Apenas lesionados e suspensos são trocados pelo melhor reserva da mesma posição." }
      ]
    },
    {
      id: "2026-11-19-j",
      date: "2026-11-19",
      title: "Prêmio de melhor treinador mostra o porquê",
      items: [
        { t: "ajuste", x: "O Troféu Cruyff agora explica a vitória: campanha (vitórias, empates, derrotas e gols), títulos da temporada e desempenho acima do esperado na liga." }
      ]
    },
    {
      id: "2026-11-19-i",
      date: "2026-11-19",
      title: "Todos os jogos de seleções contam para os atletas",
      items: [
        { t: "novo", x: "Os jogos de todas as seleções (Copa, eliminatórias, Liga das Nações e copas continentais) agora geram gols, assistências, minutos, cartões e nota para os atletas das duas seleções." },
        { t: "novo", x: "Esses números entram nos rankings do ano, nos prêmios individuais e na Bola de Ouro, e ficam no histórico de cada atleta na competição \"Seleções\"." }
      ]
    },
    {
      id: "2026-11-19-h",
      date: "2026-11-19",
      title: "Seleção: histórico, prêmios e atletas do seu clube",
      items: [
        { t: "novo", x: "A campanha e os títulos da seleção aparecem no histórico do treinador (Carreira e Vestiário) e no topo da tela da Seleção, e somam nos seus totais de vitórias, empates, derrotas e títulos." },
        { t: "novo", x: "Prêmios individuais da seleção: craque do ano e melhor jogador da seleção na Copa, com gols, assistências e jogos." },
        { t: "ajuste", x: "Os atletas do seu clube convocados passam a somar jogos, gols e assistências da seleção nas estatísticas, na competição \"Seleções\"." }
      ]
    },
    {
      id: "2026-11-19-g",
      date: "2026-11-19",
      title: "Jogos da seleção contam nas estatísticas e no calendário",
      items: [
        { t: "novo", x: "Os jogos da sua seleção (amistosos, eliminatórias e Copa) agora geram gols e assistências dos atletas, que entram nas estatísticas do ano e nos prêmios individuais, como a Bola de Ouro." },
        { t: "novo", x: "A campanha da seleção (vitórias, empates, derrotas, gols) e os títulos, como a Copa do Mundo, ficam registrados no seu histórico de treinador." },
        { t: "ajuste", x: "No calendário, os jogos da seleção já disputados continuam aparecendo com o placar e o resultado." }
      ]
    },
    {
      id: "2026-11-19-f",
      date: "2026-11-19",
      title: "Metas de investidor seguem o campeonato europeu",
      items: [
        { t: "correcao", x: "As metas de um investidor (posição na liga, títulos) eram avaliadas na virada do ano, com o campeonato europeu ainda no meio. Agora valem até o fim do campeonato (ex.: temporada 2026/27) e só são avaliadas quando a liga termina." },
        { t: "ajuste", x: "Acordos de investidor que você já tinha passam a seguir essa regra. A meta de posição volta a ficar em aberto até o fim da liga." }
      ]
    },
    {
      id: "2026-11-19-e",
      date: "2026-11-19",
      title: "Proposta de investidor abre o lugar certo",
      items: [
        { t: "correcao", x: "Ao tocar numa mensagem de proposta de investidor, o jogo ia para a lista de transferências. Agora o botão \"Ver proposta\" abre Finanças > Investidores, onde você aceita, negocia ou recusa." }
      ]
    },
    {
      id: "2026-11-19-d",
      date: "2026-11-19",
      title: "Aporte inicial funcionando",
      items: [
        { t: "correcao", x: "O aporte inicial escolhido ao criar a carreira não aparecia quando você começava sem clube. Agora ele entra no orçamento de transferências do primeiro clube que você assumir." }
      ]
    },
    {
      id: "2026-11-19-c",
      date: "2026-11-19",
      title: "Sheik não rouba mais seus alvos",
      items: [
        { t: "ajuste", x: "Quando um sheik compra um clube, ele só recebe o investimento: não contrata mais jogadores sozinho. As contratações ficam como meta do projeto, e assim ele não toma jogadores que você já está negociando." }
      ]
    },
    {
      id: "2026-11-19-b",
      date: "2026-11-19",
      title: "Excluir sondagem recusada",
      items: [
        { t: "novo", x: "Na negociação, quando a sondagem é recusada, agora há o botão \"Excluir da lista\" para tirar o jogador da lista de Negociações." }
      ]
    },
    {
      id: "2026-11-19-a",
      date: "2026-11-19",
      title: "Menos travadas, menu enxuto e trilha nova",
      items: [
        { t: "correcao", x: "O jogo travava depois de qualquer toque: ele salvava a carreira inteira a cada clique. Agora só salva quando algo muda e espera você parar de tocar." },
        { t: "ajuste", x: "Menu lateral mais limpo: saíram Transferências (no modo treinador), Olheiros, Registros, Movimentações, Mundo e Vida. Mercado reúne scouting, negociações, elenco e contratos." },
        { t: "ajuste", x: "\"Perspetiva geral\" virou \"Início\"." },
        { t: "novo", x: "Trilha sonora nova, mais animada: bateria de estádio, baixo pulsante e canto de torcida. Dá para desligar em Definições." }
      ]
    },
    {
      id: "2026-11-18-d",
      date: "2026-11-18",
      title: "Mercado e base mais coerentes",
      items: [
        { t: "novo", x: "Tela de Novidades: depois de cada atualização, o jogo mostra o que mudou." },
        { t: "novo", x: "Aviso na tela quando um olheiro termina o relatório (Mercado e Academia)." },
        { t: "correcao", x: "Propostas de compra deixaram de vir sempre do mesmo clube: o comprador varia e tem nível parecido com o do jogador." },
        { t: "correcao", x: "Jogador que aparecia em dois lugares ao mesmo tempo (base e clube antigo) agora fica só no seu clube." }
      ]
    },
    {
      id: "2026-11-18-c",
      date: "2026-11-18",
      title: "Seleção: escalação e convocação",
      items: [
        { t: "ajuste", x: "Escalação por posição específica (LD, ZAG, LE, VOL, MC, PD, CA...), com o campo inteiro na tela." },
        { t: "ajuste", x: "Jogador fora de posição aparece com borda laranja e rende menos." },
        { t: "ajuste", x: "Convocação mais compacta: lista em duas colunas, mais jogadores por página e contagem por posição." },
        { t: "correcao", x: "A tela da Seleção deixou de travar: a Copa do Mundo só é calculada quando você abre essa aba." }
      ]
    },
    {
      id: "2026-11-18-b",
      date: "2026-11-18",
      title: "Jogadores contratados e evolução",
      items: [
        { t: "correcao", x: "Jogadores contratados não somem mais do jogo quando você sai do clube: ficam no clube que os contratou e aparecem na Busca mundial." },
        { t: "ajuste", x: "Jovens com potencial 76 ou mais evoluem mais rápido; estrelas mantêm o auge por mais tempo." },
        { t: "ajuste", x: "O treinador pode trocar de clube a qualquer momento, sem esperar a janela de transferências." }
      ]
    },
    {
      id: "2026-11-18-a",
      date: "2026-11-18",
      title: "Seleção com convocação realista",
      items: [
        { t: "novo", x: "Convocação com janela e prazo: abre 12 dias antes dos jogos e fecha 3 dias antes. Se o prazo passar, a confederação convoca o rascunho e a diretoria cobra." },
        { t: "novo", x: "Modo Seleção: abas de Escalação, Táticas (estilo, pressão, construção, capitão e vice) e Relatórios." },
        { t: "novo", x: "Contraproposta nas propostas de compra pelos seus jogadores (Mercado > Negociações)." },
        { t: "ajuste", x: "Investidores saíram das Negociações e foram para Finanças > Investidores." },
        { t: "ajuste", x: "Posições específicas em vez de DEF, MEI e ATA genéricos." }
      ]
    }
  ];
  const api = { ENTRIES, latestId: () => ENTRIES[0].id };
  root.ProLifeChangelog = Object.assign(root.ProLifeChangelog || {}, api);
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeChangelog;
})(typeof globalThis !== "undefined" ? globalThis : this);
