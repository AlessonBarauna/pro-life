# Identidade 06B — Avatar humano Vitruvian (protótipo)

A fonte da implementação é o arquivo `VitruvianGodot-main.zip` fornecido pelo usuário. São três arquivos GLB originais: `vitruvian_body.glb`, `vitruvian_head.glb` e `vitruvian_hair.glb`. Leia `NOTICE.md` no ZIP: base do personagem derivada do CharMorph/Vitruvian em CC0, ferramentas e shaders MIT. A publicação de animações Mixamo merece revisão separada antes de distribuir os próprios arquivos-fonte externos.

Os três GLBs são grandes e, por isso, **não estão versionados nesta branch**. Instale-os no diretório `src/assets/coach3d-realistic/` utilizando o pacote separado `PRO_LIFE_MODELOS_TREINADOR_REALISTA.zip` fornecido na conversa. A lista de assets os incorpora ao build somente quando os arquivos existem.

O visualizador `src/ui/coach-glb.source.js` monta as três partes e reproduz o Idle fornecido no corpo; foi removido o vestuário procedural anterior. Mantém compatibilidade com a interface de `ProLifeCoachAvatar3D`. Rode `npm run coach:avatar` para recompilar o visualizador; `npm run dev` também recompila.

**Limitações reais:** ainda é um protótipo. Os GLBs originais foram preparados para Godot, a cabeça e o cabelo são componentes estáticos, e pode ser necessário sincronizar transformações ao esqueleto em Three.js. Os seletores de roupa, barba e biotipo continuam salvos, mas não possuem malhas alternáveis correspondentes nesse conjunto. Somente mudanças sustentadas pelos materiais e malhas disponíveis são visualizadas. A validação visual manual ainda é obrigatória.

Não modificar o motor de jogador nem saves existentes.
