# Overlay Annotator

## 🎯 **Descrição do Projeto**

O Overlay Annotator é uma ferramenta para anotações sobre a tela do computador em tempo real.
Ele permite desenhar, mover a tela, apagar linhas individualmente ou em área, e salvar capturas com as anotações.

O projeto é desenvolvido usando HTML, CSS e JavaScript, e integrado com Electron para captura da tela e comunicação com a camada nativa.

---

## 🚀 **Funcionalidades Implementadas**

### 🎨 Ferramentas de Desenho

* **Draw**: desenhar linhas com cor e espessura configuráveis.
* **Eraser-Stroke**: apagar linhas inteiras clicando sobre elas.
* **Eraser-Paint**: apagar pixels em uma área (visual apenas, não altera permanentemente o stroke).
* **Pan**: mover o conteúdo da tela (offset aplicado aos desenhos).

### 🛠 Controles e Toolbar

* **Toolbar flutuante**:

  * Toggle Draw Mode (ativar/desativar interação com a tela)
  * Toggle Persistente/Temporário (modo de anotações persistente ou descartável)
  * Undo / Redo
  * Limpar todos os desenhos
  * Salvar PNG (em desenvolvimento)
  * Seleção de cor e espessura da linha
  * Botões de ferramentas (Draw, Pan, Eraser-Paint, Eraser-Stroke)

### ⚡ Funcionalidades Extras

* **Redraw automático** ao mover a tela ou mudar o tamanho da janela.
* **Gerenciamento de camadas e offsets** para suportar Pan e Draw simultaneamente.
* **Integração com Electron**:

  * Recebe eventos de mudança de modo de desenho (`drawing-mode`) e de overlay (`overlay-mode`).
  * Captura de tela para salvar imagens com sobreposição de anotações.

---

## 📝 Funcionalidades Planejadas

* **Salvar Screenshot**:

  * Salvar o conteúdo da tela junto com as anotações em PNG (melhorar integração com offsets e dimensionamento da tela).
* **Melhorias no Eraser-Paint**:

  * Tornar a borracha permanente, removendo pixels diretamente dos strokes.
* **Aprimoramento do Pan/Draw**:

  * Corrigir offsets residuais ao alternar entre Pan e Draw, evitando deslocamento incorreto dos strokes durante o desenho.

---

## ⚠️ Pontos a Corrigir / Em Desenvolvimento

1. **Salvar Screenshot**

   * Atualmente salva a tela, mas pode haver distorções devido ao dimensionamento do canvas e offsets.

2. **Eraser-Paint**

   * Apenas remove visualmente pixels da tela, mas não altera permanentemente os strokes.

3. **Pan**

   * Após usar o Pan, alternar para Draw pode fazer com que os strokes sejam desenhados “deslocados” até finalizar a linha.

---

## 📂 Estrutura do Projeto

```
overlay-annotator/
│
├─ index.html
├─ css/
│  ├─ style.css
│  └─ overlay.css
├─ scripts/
│  ├─ app.js
│  ├─ overlayApp.js
│  ├─ canvasManager.js
│  └─ eventManager.js
└─ README.md
```

---

## ⚡ Como Executar

1. Clonar o repositório.
2. Abrir o `index.html` em um navegador (ou executar via Electron para integração com captura de tela).
3. Interagir com a toolbar:

   * Selecionar ferramentas (Draw, Pan, Eraser)
   * Ajustar cor e espessura
   * Salvar ou limpar a tela
