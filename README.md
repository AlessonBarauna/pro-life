# PRO LIFE — Football Career

Simulador local de carreira no futebol, em português, com jogador e treinador,
base brasileira de clubes e atletas de 2026 e partidas probabilísticas. Código e ferramentas v0.4. Saves versão 1 permanecem compatíveis.

## Atualização 0.4

Séries A, B, C e D, com cobertura parcial de elencos nas Séries C/D; 27 atributos,
treino por especialidade e estilo, progressão mais rápida, estatísticas, assistências,
prêmios por divisão com clube do vencedor, quatro acessos e rebaixamentos,
Copa do Brasil em mata-mata, estadual do clube da carreira, decisões pessoais e
agência persistente.
Leia [mudanças, compatibilidade e limites](docs/ATUALIZACAO_0.4.md).

## Atualização 0.3

Tema escuro, visão geral detalhada, evolução por período, Séries A/B, janelas,
entrevistas com consequências, bens pessoais e feed de acontecimentos simulados.
Leia [regras, fontes, migração e testes](docs/ATUALIZACAO_0.3.md).
Carreiras antigas preservam a liga; a migração para o Brasil é opcional na virada.

## Jogar

Abra `index.html` ou `ABRIR_PRO_LIFE.bat`. Não precisa instalar nada para jogar
a versão offline. Exporte seu save antes de mudar de endereço/navegador.

## Editar com atualização automática

Instale Node.js LTS pelo site oficial https://nodejs.org/en/download.
Na pasta deste projeto:

```sh
npm run dev
```

Abra http://127.0.0.1:5173 e mantenha o terminal aberto. Salvar um arquivo do jogo
recarrega a prévia. Não precisa executar `npm install` para a prévia. Para recompilar o avatar e gerar build, execute `npm ci --ignore-scripts` primeiro.
No Windows, também pode usar `DESENVOLVER_PRO_LIFE.bat`.

## GitHub e publicação

Siga `COMECE_AQUI_GITHUB.md`. O workflow em `.github/workflows/pages.yml` testa
mudanças, cria `dist` e publica no GitHub Pages a cada push na branch `main`.
Configure no repositório Settings > Pages > Source: GitHub Actions.
Pull requests executam os testes sem publicar. A publicação só ocorre após testes
aprovados. No jogo online, aparece um aviso quando uma nova versão é detectada;
clique em Atualizar jogo para carregá-la. Não é edição compartilhada em tempo real.

## Desenvolvimento e testes

```sh
npm ci --ignore-scripts
npm run check
npm test
npm run test:ui
npm run build
```

`npm ci` instala apenas ferramentas de desenvolvimento. Produção não usa essas
bibliotecas; somente os arquivos do jogo são publicados. `dist` é descartável.
Node recomendado para os testes: 24, como no CI. A prévia funciona com Node 22.12+.

## Arquitetura

- `src/domain`: regras, entidades, calendário, RNG e motor de partidas.
- `src/application`: comandos e validação de ações.
- `src/infrastructure`: validação e persistência do save.
- `src/ui`: interface e aviso de atualização da publicação.
- `tools`: prévia local, catálogo explícito de assets e build estático.
- `tests`: motor, interface DOM e ferramentas.
- `docs`: design, arquitetura, testes e limites.

Nenhum save, segredo, documentação interna ou dependência é incluído no build.
O `.gitignore` exclui saves exportados, dependências, builds, ZIPs e `.env`.
Não coloque dados pessoais em arquivos de código versionados.

## Saves

Offline, prévia local e GitHub Pages são endereços diferentes: cada um tem seu
próprio armazenamento no navegador. Exporte/importe JSON para levar a carreira.
O save não é enviado ao GitHub nem sincronizado entre computadores. Mantenha o
endereço local fixo e o schema versão 1 até implementar migrações.

Código sob MIT. Retratos SVG originais; clubes e atletas fictícios.

## Atualização 0.2

Personagem 3D procedural, aparência editável, uniforme por clube, 16 comemorações,
radar de atributos e histórico semanal de evolução. Interface reformulada.
Leia docs/ATUALIZACAO_0.2.md para limites do 3D, migração de saves e testes.
Fonte do personagem: src/ui/avatar3d.source.js; recompilar com `npm run avatar`.
