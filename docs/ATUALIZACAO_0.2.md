# PRO LIFE 0.2 — personagem e gestão

## Mudanças implementadas
Interface de gestão com navegação compacta, dados em tabelas, painéis claros e
cabeçalho de carreira. Direção visual original, inspirada em interfaces de jogos
esportivos; não reproduz telas, marcas ou assets de EA FC / Football Manager.

Personagem 3D do tronco até as mãos, câmera com iluminação e rotação por arraste.
Modelo procedural original, sem downloads de modelos ou texturas externos. Este
personagem é estilizado e não tem fidelidade fotográfica de um jogo AAA. O objetivo
é uma base editável e leve. Para alcançar essa fidelidade, será necessário um modelo
artístico anatômico com texturas/rig profissionais e direitos de uso claros.

11 cabelos, 6 barbas/bigodes, 3 portes, óculos ou máscara facial protetora,
tatuagens no braço esquerdo/direito ou ambos. Os braços ficam à mostra. O uniforme
usa a cor do clube e atualiza ao mudar de time; fora de clube há roupa de treino.
Há 16 comemorações no perfil. Elas são opções registradas, não animações de jogo.
A aparência também pode ser editada durante a carreira em Meu personagem.

Radar inicial mostra a distribuição atual dos seis atributos. O histórico mostra
nível geral ou um atributo, com registros semanais. Séries constantes aparecem
constantes: não inventamos evolução para tornar o gráfico bonito.

## Compatibilidade
Schema do save continua 1, com campo development opcional (até 260 registros).
Novas carreiras registram o ponto inicial no dia zero. Saves antigos são migrados
em memória, com registro a partir do dia do save; o passado não registrado não
pode ser reconstruído. Nomes antigos de cabelo/barba/tatuagem são normalizados.
A mesma pessoa continua sendo a referência no elenco e no perfil. A chave do
autosave e a origem online são preservadas. Exporte cópia antes de atualizar.

## Renderização e dependências
Three.js está incluído no bundle local src/ui/avatar3d.js. A licença completa
acompanha o repositório em THREE_LICENSE.txt. src/ui/avatar3d.source.js contém o
código editável; npm run avatar recompila com esbuild. npm run build recompila
automaticamente antes de gerar dist. O runtime não usa CDN, imagem remota, conta
ou serviços de IA. O servidor de desenvolvimento precisa npm run avatar após
alterar a fonte 3D; o bundle recompilado dispara recarga automática.

O renderer desenha na abertura, mudança de configuração, redimensionamento e
arraste. Não existe um loop permanente de 60 FPS. Pixel ratio limitado a 1,5;
um só contexto WebGL ativo, com descarte de recursos ao navegar. Browsers sem
WebGL usam retrato SVG como alternativa. Ele não tem a mesma fidelidade do 3D.
Não foi medido consumo de GPU/RAM no notebook do usuário.

## Verificação
Testes do motor, charts, normalização, uniforme por clube, edição, gravação semanal,
migração de save e ferramentas. Testes DOM para as telas e aviso de nova versão.
Também executado Chromium real com renderização de WebGL por SwiftShader neste
ambiente: criação, uniforme, máscara, cabelo, tatuagens, edição, save, recarga,
gráfico e largura mobile. Screenshots de criação, visão geral e perfil inspecionados.
SwiftShader não é a Iris Xe; ainda é necessário conferir no computador do usuário.

## Teste no jogo
1. Atualize a página online e abra Meu personagem.
2. Edite cabelo, bigode/cavanhaque, porte e tatuagem; clique Salvar aparência.
3. Arraste o personagem para conferir a lateral do cabelo, os braços e a máscara.
4. Confira o uniforme do clube e escolha uma nova comemoração.
5. Avance algumas semanas e altere o indicador do gráfico. Não é garantido ganhar
   atributos a cada semana. Num save antigo, o histórico começa nesta atualização.
6. Exporte/importa o save e verifique que as opções e os registros permanecem.
