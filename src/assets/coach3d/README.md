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
- Cabelo, barba, óculos, roupa e biotipo agora acionam acessórios e roupas 3D procedurais sobre o GLB, com atualização em tempo real. Ainda não são malhas humanas de alta fidelidade e podem exigir calibração de encaixe.
- O novo modelo não deve ser confundido com a qualidade visual do FC 27. A base ainda usa uma pose em T; enquadramento fechado reduz sua exposição, mas corrigir o esqueleto/animação e criar modelos detalhados de cabelo e roupas continuam pendentes.
- O criador de jogador não foi alterado.
