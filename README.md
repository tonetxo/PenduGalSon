# PenduGalSon — Péndulo Musical & Físico

<p align="center">
  <strong>Interactive Visual & Musical Compound Pendulum Simulator</strong><br>
  <em>Simulador interactivo de física de péndulos e síntese de son en tempo real para Android e Web</em>
</p>

<p align="center">
  <a href="https://play.google.com/store/apps/details?id=com.tonetxo.pendugalson">
    <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" height="80">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20Web-green" alt="Platform">
  <img src="https://img.shields.io/badge/Audio-Web%20Audio%20API-blue" alt="Web Audio API">
  <img src="https://img.shields.io/badge/Framework-React%20%2B%20Capacitor-61dafb" alt="React + Capacitor">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

---

## 🌟 English Overview

**PenduGalSon** is a creative audiovisual physics simulator that translates the complex dynamics of simple and compound pendulums into generative musical soundscapes. By combining classical mechanics, non-linear chaotic motion, and real-time audio synthesis (Web Audio API), every trajectory produces unique acoustic harmonies and rhythmic patterns.

### Key Highlights
- **Real-Time Sound Synthesis**: Oscillators and musical notes dynamically modulated by angular velocity, position, and acceleration.
- **Physics Engine**: Accurate simulation of both simple harmonic pendulums and double/compound chaotic pendulums.
- **Interactive Touch & Canvas**: Drag, drop, pull, and adjust physical parameters (gravity, mass, arm length, damping).
- **Motion Tracing**: Visual persistence of trajectories revealing chaotic attractors and phase space patterns.
- **Cross-Platform**: Available natively on [Google Play Store](https://play.google.com/store/apps/details?id=com.tonetxo.pendugalson) for Android, and executable on any modern web browser.

---

## 🌐 Galego

Unha aplicación interactiva de péndulo físico que xera sons baseados nos movementos dos péndulos. Esta aplicación combina conceptos de física, matemáticas e síntese de son para crear unha experiencia musical única.

### Características

- **Simulación física** de péndulos simples e compostos (movemento caótico).
- **Xeración de son en tempo real** baseada nos movementos, velocidades e aceleracións dos péndulos.
- **Interface visual interactiva** con posibilidade de arrastrar e soltar.
- **Controis de precisión** para axustar parámetros físicos (gravidade, lonxitude, masas, amortecemento).
- **Visualización de trazos** de movemento para observar patróns visuais complexos.
- **Soporte para multitáctil e zoom**.

---

## 📲 Descarga para Android

Podes instalar a aplicación directamente dende Google Play Store:
👉 **[Instalar PenduGalSon en Google Play](https://play.google.com/store/apps/details?id=com.tonetxo.pendugalson)**

---

## 🛠️ Tecnoloxías / Tech Stack

- **Frontend & UI**: React, HTML5 Canvas 2D
- **Audio Engine**: Web Audio API (Síntese en tempo real, osciladores de frecuencia e modulación)
- **Mobile Runtime**: Capacitor (Android native bridge)
- **Build Tool**: Vite

---

## 📁 Estructura do proxecto

```
PenduGalSon/
├── android/          # Proxecto nativo de Android (Capacitor)
├── src/
│   ├── components/
│   │   ├── PendulumCanvas.jsx   # Renderizado de física e gráficos en Canvas 2D
│   │   └── ControlPanel.jsx     # Controis de masas, gravidade e parámetros
│   ├── hooks/
│   │   ├── usePhysics.js        # Ecuacións diferenciais e cálculo do péndulo
│   │   └── usePendulumRenderer.js
│   ├── audio/
│   │   └── useAudio.js          # Xeración sonora mediante Web Audio API
│   ├── styles.css
│   └── App.jsx
├── capacitor.config.json        # Configuración da app de Android
├── index.html
├── package.json
└── README.md
```

---

## 🚀 Execución en local

Para executar este proxecto no teu computador:

1. **Clonar o repositorio:**
   ```bash
   git clone https://github.com/tonetxo/PenduGalSon.git
   cd PenduGalSon
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar servidor de desenvolvemento:**
   ```bash
   npm run dev
   ```
   Abre a URL que se amosa na consola (por exemplo, `http://localhost:5173`) nun navegador moderno.

---

## 🤝 Contribucións

As contribucións son benvidas! Se tes ideas para novos algoritmos de síntese sonora, modos de péndulos triples o melloras visuais, por favor abre un issue ou envía un pull request.

---

## 📄 Licenza

Este proxecto está dispoñible baixo a licenza MIT.