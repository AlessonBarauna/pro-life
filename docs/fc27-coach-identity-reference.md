# Referência oficial — Criação de treinador EA SPORTS FC 27 (14/10/2026)

Fonte: https://www.ea.com/pt-br/games/ea-sports-fc/fc-27/news/pitch-notes-fc27-career-mode-deep-dive

## Confirmado pela EA
- Personalização de manager com peças superiores completas, exteriores e interiores.
- Categorias de vestuário: **Esportiva, Casual, Clássica e Formal**.
- Conjuntos selecionados combinam múltiplas peças.
- O jogo oferece criação de manager; criar um manager não é o mesmo que assumir um manager real (documentação do Modo Carreira).

## Avaliação da 06B atual
- O modelo Vitruvian importado tem GLBs separados de corpo, cabeça e cabelo, mas não é um catálogo modular de roupas, barbas e penteados.
- O seletor atual de roupa (terno / polo / agasalho) **não troca uma malha 3D correspondente**.
- O cabelo atual é uma única malha; o menu oferece nomes de muitos estilos que não estão presentes nos arquivos instalados.
- Ainda não temos assets específicos para óculos e barba.
- O GLB montado foi projetado para Godot; rig, transformações e animações exigem validação visual em Three.js.

## Contrato para concluir a etapa Identidade
1. Registrar cada opção do formulário em um catálogo explícito com `modelPath`, `meshName` ou `materialSlot`, nunca apenas um label.
2. Mostrar e permitir selecionar apenas opções que tenham modelo funcional; as demais devem ficar marcadas como indisponíveis, não como personalização implementada.
3. Modificar modelos via troca de mesh/material, mantendo o mesmo avatar/rig/escala e sem reconstruir contexto WebGL.
4. Garantir preservação em save e reload e isolamento do criador de jogador.
5. Criar looks Esportivo, Casual, Clássico e Formal somente quando forem fornecidos modelos próprios/licenciados.
6. Não redistribuir arquivos proprietários da EA; usar FC 27 como referência funcional e visual.

## Lacuna de material
Precisamos obter um pacote modular licenciado que forneça realmente:
- corpo humano adulto vestido/animado;
- looks por categoria;
- penteados variados;
- barbas;
- óculos;
- compatibilidade de rig / ponto de ancoragem / materiais.

Enquanto não tivermos o pacote, não há como afirmar paridade visual com o FC 27.
