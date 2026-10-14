# Avatar do treinador — 06B.1

## Modelo e licença
- Modelo: Superhero Male, pacote Universal Base Characters (Standard), Quaternius.
- Distribuição GLB original adaptada no projeto público `programasweights/avatar`, sob CC0 1.0.
- Licença preservada em `LICENSE-CC0.txt`.
- A malha é humanoide 3D de baixo/médio detalhe; **não é um modelo fotorrealista** nem contém ativos proprietários do EA Sports FC.
- Nenhuma chamada de rede é necessária no jogo: `coach-base.glb` está no repositório.

## Build e execução
`npm run dev` gera automaticamente `src/ui/coach-glb.js` com esbuild + three antes de iniciar o servidor.
`npm run build` faz o mesmo para a publicação offline.
O arquivo minificado é gerado localmente, enquanto o código-fonte editável fica em `src/ui/coach-glb.source.js`.

## Limitações da primeira integração
- Rotação por arraste, iluminação PBR e escolha de cor de pele são renderizadas pelo motor GLB.
- Cabelo, barba, óculos, roupa e biotipo são registrados no formulário e salvos na carreira, mas ainda **não correspondem a modelos 3D independentes no GLB**.
- O novo modelo não deve ser confundido com a qualidade visual do FC 27. Melhorias de malha, penteados e vestuário seguem como pendências.
- O criador de jogador não foi alterado.
