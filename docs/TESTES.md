# Validação da entrega

## Executado nesta entrega
Node 24.19.0, Linux. Nove testes do motor passaram:
1. Calendário: todos os 56 confrontos ordenados, sem duplicidade.
2. Limite de pontos e idade por modo.
3. Seeds e ações iguais resultam em estado igual; round-trip de save recupera
   a referência única do protagonista no elenco.
4. Seis anos completos do treinador, com validação de saves e balanço da tabela.
5. Em 100 partidas, placar igual à contagem de gols e estatísticas coerentes.
6. Em 1.000 partidas, favorito tem vantagem sem eliminar zebras.
7. Contratação transfere atleta e conserva o dinheiro entre clubes.
8. Save inválido, calendário corrupto, escalação e proposta inexistente são recusados.
9. Decisão e aposentadoria preservam patrimônio e universo.

### Calibração
Capital Esporte (nível base 76, mandante) versus Mogi Atlético (base 53):
1.000 universos/seeds, 693 vitórias do favorito, 185 empates e 122 zebras.
Média: 2,744 gols por jogo. Isso verifica variabilidade e faixa básica do modelo,
não calibração acadêmica ou reprodução estatística de campeonatos reais.
Seed determinística não fixa vencedor antes da partida: reproduz os mesmos
sorteios e as mesmas ações quando todos os parâmetros são iguais.

### Interface
Testes DOM com jsdom 30.1.1 passaram nos dois modos: criação, aceite de proposta,
todas as 11 páginas, primeira rodada, relatório, decisão e retomada por autosave.
Treinador: mudar tática, salvar titulares e curso de licença. Save com nome
contendo HTML é renderizado como texto; histórico com campo numérico malicioso
é recusado. Isso não substitui revisão profissional de segurança.

### Limites da validação
Não foi possível executar Chromium gráfico neste ambiente. Não houve inspeção
visual por screenshot nem teste em Windows, Edge ou Chrome reais. Não medimos
memória, responsividade percebida ou compatibilidade de localStorage via file://
no notebook do usuário. A exportação usa APIs padrão, mas o download e o seletor
de importação precisam de teste no navegador real. O BAT não foi executado em
Windows. Não apresentar estes testes como certificação de funcionamento universal.

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
