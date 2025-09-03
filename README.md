# Universal Annotator

Aplicativo de desenho moderno para Whiteboard e Overlay, desenvolvido em **Electron + JavaScript/TypeScript**.  
Permite desenhar diretamente sobre a tela do PC, com suporte a undo/redo, cores, espessura e gestos via webcam.

---

## 🎯 Objetivo

Criar um aplicativo polido, moderno e comercializável que funcione como:
- Whiteboard independente para desenho.
- Overlay transparente sobre qualquer aplicação.
- Controle de cores, espessura e modos via tooltip/toolbar.
- Integração com gestos de mãos via webcam.

---

## 🚀 Funcionalidades Principais

1. **Whiteboard Mode**
   - Janela de desenho independente.
   - Alterar cor, espessura, undo/redo.
   - Exportar desenho como PNG ou copiar para clipboard.

2. **Overlay Mode**
   - Janela transparente sempre em cima.
   - Desenhar sobre qualquer aplicação.
   - Toggle para ativar/desativar Overlay.

3. **Tooltip/Toolbar Oculta**
   - Fica escondida até hover ou atalho.
   - Controles: cor, espessura, modo, limpar tela.

4. **Gestos via Webcam**
   - Detectar gestos específicos usando MediaPipe Hands ou Handtrack.js:
     - Mão aberta → desfazer (undo)
     - Punho fechado → limpar tela
     - Dois dedos → mudar cor ou modo

5. **Undo / Redo**
   - Pilhas de ações locais para desfazer e refazer desenhos.

6. **Extras**
   - Camadas opcionais.
   - Atalhos globais configuráveis.
   - Inicialização em segundo plano.

---

## 🏗 Roadmap de Implementação

1. **Estrutura base Electron**
   - Criar janelas Whiteboard e Overlay.
   - Configurar transparência e atalhos globais.

2. **Motor de Desenho**
   - Estrutura de Stroke (`type`, `points`, `color`, `thickness`).
   - Implementar adicionar stroke, undo/redo, limpar.

3. **Whiteboard Mode**
   - Janela independente com canvas.
   - Renderização de strokes e controles básicos.

4. **Overlay Mode**
   - Janela transparente, sempre em cima.
   - Desenho sobre qualquer aplicação.

5. **Tooltip/Toolbar Oculta**
   - Controles de cor, espessura e modo.
   - Pequenos ícones animados.

6. **Gestos via Webcam**
   - Integração com MediaPipe Hands ou Handtrack.js.
   - Mapeamento de gestos para ações (undo, limpar, mudar cor).

7. **UX/UI Refinado**
   - UI moderna com HTML/CSS animado.
   - Transparência suave e suavização de traços.

8. **Exportação / Camadas**
   - Salvar desenho como PNG.
   - Suporte a camadas no Overlay.

9. **Distribuição**
   - Build multiplataforma com Electron Builder.
   - Testar Overlay e atalhos globais em múltiplos apps.
   - Criar instalador simples.

---

## 📌 Ordem sugerida de desenvolvimento

1. Estrutura base Electron + janelas.
2. Motor de desenho com strokes + undo/redo + limpar.
3. Whiteboard Mode funcional.
4. Overlay Mode funcional.
5. Tooltip/Toolbar oculta.
6. Gestos via webcam integrados.
7. UX refinado e animações.
8. Exportação, camadas e funcionalidades extras.
9. Preparação para build e distribuição.

---

## 📚 Tecnologias e Bibliotecas

- [Electron](https://www.electronjs.org/) → aplicação desktop moderna.
- [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands) → reconhecimento de gestos de mão.
- HTML5 Canvas → desenho de strokes.
- CSS3 → UI moderna e animações.
- Node.js → backend e gerenciamento de janelas / atalhos globais.

---

## ⚡ Próximos Passos

1. Criar janelas Whiteboard e Overlay básicas.  
2. Implementar canvas e motor de desenho com strokes.  
3. Implementar undo/redo e toolbar inicial.  

---
