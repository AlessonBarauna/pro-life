# PRO LIFE — Football Career

Simulador local de carreira no futebol, em português, com jogador e treinador,
universo fictício e partidas probabilísticas. Código do jogo v0.1, ferramentas
para desenvolvimento/publicação v0.1.1. Saves versão 1 permanecem compatíveis.

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
recarrega a prévia. Não precisa executar `npm install` para a prévia nem o build.
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
