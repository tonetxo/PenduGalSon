# Péndulo Musical - PenduGalSon

Unha aplicación interactiva de péndulo físico que xera sons baseados nos movementos dos péndulos. Esta aplicación combina conceptos de física, matemáticas e síntese de son para crear unha experiencia musical única.

## Características

- Simulación física de péndulos simples e compostos
- Xeración de son en tempo real baseada nos movementos dos péndulos
- Interface visual interactiva con posibilidade de arrastrar e soltar
- Controis para axustar parámetros físicos (gravidade, masas)
- Visualización de trazos de movemento
- Soporte para multitáctil e zoom

## Estructura do proxecto

```
PenduGalSon/
├── src/
│   ├── components/
│   │   ├── PendulumCanvas.jsx
│   │   └── ControlPanel.jsx
│   ├── hooks/
│   │   ├── usePhysics.js
│   │   └── usePendulumRenderer.js
│   ├── audio/
│   │   └── useAudio.js
│   ├── styles.css
│   └── App.jsx
├── index.html
├── index.js
├── package.json
└── README.md
```

## Instalación

Para executar este proxecto localmente:

1. Clona ou descarga o código
2. Abre o arquivo `index.html` nun navegador moderno

## Uso

- Arrastra no lenzo para crear o péndulo
- Usa os controis para axustar os parámetros físicos
- Activa/desactiva a simulación co botón Reproducir/Parar
- Usa o modo simple ou composto para diferentes tipos de péndulos

## Tecnoloxías utilizadas

- React
- Web Audio API
- Canvas 2D API
- CSS3
- HTML5

## Contribucións

As contribucións son benvidas! Por favor, abre un issue ou envía un pull request para melloras.

## Licenza

Este proxecto está dispoñible baixo a licenza MIT.