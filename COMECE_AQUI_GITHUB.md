# Do ZIP ao desenvolvimento local e online

## 1. Guarde a carreira que você está jogando
No jogo atual, clique em Exportar save. Guarde o JSON fora da pasta do código.
Este pacote tem ferramentas novas; as regras e o schema do save continuam v0.1.
Se você já alterou arquivos do jogo, use a pasta que contém suas mudanças como
base e adicione apenas as ferramentas/configurações deste pacote. Não substitua
suas alterações cegamente. Confira o diff antes de enviar ao GitHub.

## 2. Prepare o computador
Instale Node.js LTS: https://nodejs.org/en/download
Instale Git for Windows: https://git-scm.com/downloads/win
Depois feche e abra o PowerShell. Confirme:

```powershell
node --version
git --version
```

Para editar, use seu editor preferido. Se usar Codex no computador, abra a pasta
do projeto como workspace; ele poderá editar os arquivos e executar os testes.

## 3. Use a prévia automática
Extraia o ZIP e navegue até a pasta PRO_LIFE_GITHUB. Nela, abra o PowerShell:

```powershell
npm.cmd run dev
```

Abra http://127.0.0.1:5173. Mantenha o terminal aberto. Cada arquivo do jogo salvo
atualiza a página automaticamente. Ctrl+C encerra. Não precisa instalar as
bibliotecas para esse passo. `npm.cmd` evita o bloqueio do npm.ps1 sem mudar a
política de execução do Windows. Alternativa: DESENVOLVER_PRO_LIFE.bat.
Importe o JSON do seu save para continuar na prévia. O endereço file:// do jogo
antigo possui armazenamento distinto do endereço http://127.0.0.1:5173.
Abra o navegador após aparecer a mensagem de servidor iniciado.

## 4. Crie o repositório
No GitHub, crie um repositório vazio chamado `pro-life` (ou outro nome seu).
Não adicione README, licença ou gitignore na criação: já estão neste pacote.
Para Pages numa conta GitHub Free, o repositório precisa ser público. O código
ficará visível a outras pessoas. Com planos compatíveis, Pages também suporta
repositórios privados; um repositório privado não garante que o site seja privado.
Confira sua escolha de visibilidade antes de criar o repositório.
Fonte: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

Dentro da pasta do projeto, execute cada comando em ordem. Substitua SEU_USUARIO
pelo usuário/organização correto do GitHub. Se git já estiver configurado, não
mude sua identidade. Se o commit pedir nome/email, use a identidade que deseja
associar aos commits (pode usar o endereço noreply do GitHub).

```powershell
git init -b main
git add .
git status
git commit -m "Initial PRO LIFE with live preview and Pages deployment"
git remote add origin https://github.com/SEU_USUARIO/pro-life.git
git push -u origin main
```

Faça login pelo fluxo do Git no navegador quando solicitado. Não envie senha ou
token em mensagens. Se usar outro nome de repositório, ajuste a URL. Se já existir
um repositório remoto, não use force push: clone-o e coloque os arquivos na raiz.
As pastas `src`, `tools`, `.github` e o `index.html` devem estar na raiz do repo,
não dentro de uma subpasta PRO_LIFE_GITHUB no GitHub.

## 5. Ative publicação automática
Repositório > Settings > Pages > Build and deployment > Source: GitHub Actions.
Depois, Actions > Testar e publicar PRO LIFE > Run workflow > main > Run workflow.
A primeira tentativa pode falhar se Pages ainda não estiver ativado; execute de
novo após configurar. Mudanças futuras enviadas à main publicam automaticamente.
Fonte: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

O endereço aparece em Settings > Pages e na execução concluída de deploy.
Normalmente segue https://SEU_USUARIO.github.io/pro-life/ — use a URL mostrada
pelo GitHub, não presuma que está disponível antes do deploy terminar.
O jogo funciona na subpasta do repositório graças aos caminhos relativos.

## 6. Fluxo de alteração
Mantenha `npm.cmd run dev` aberto para ver a edição imediatamente no computador.
Em outro PowerShell, na mesma pasta:

```powershell
npm.cmd ci --ignore-scripts
npm.cmd run check
npm.cmd test
npm.cmd run test:ui
npm.cmd run build
git diff
git add .
git commit -m "Describe your game change"
git push
```

`npm ci` é necessário no primeiro uso e se o lockfile/dependências mudar; não
precisa repetir em cada edição. Revise o diff para evitar publicar alterações
indesejadas. No GitHub, acompanhe Actions; o link só muda após o deploy terminar.
A página aberta consulta a versão periodicamente e mostra Atualizar jogo. Pode
haver alguns minutos de espera pela publicação/cache. Sem clicar, ela mantém
sua sessão atual. Autosave preserva ações concluídas se o schema for compatível.

## 7. Limites importantes
Ainda não há multiplayer, saves na nuvem, login ou sincronização entre dispositivos.
GitHub guarda código, não sua carreira. Exportar/importar JSON transfere o save.
Para mudanças de schema, crie migração e testes; não apague saves silenciosamente.
O servidor de desenvolvimento aceita apenas acesso local e não publica seu PC.
Fechar a aba de prévia não fecha o servidor; Ctrl+C no terminal encerra.
