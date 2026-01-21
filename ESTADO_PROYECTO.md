# PenduGalSon - Estado del Proyecto

**Fecha**: 16 de Enero de 2026  
**Rama**: `feature/android-playstore`  
**Último commit**: `637c1fb` - refactor: mapeo de audio baseado en ángulo e velocidade

---

## Resumen

PenduGalSon es una aplicación de péndulo musical que transforma el movimiento físico en sonido. El proyecto está listo para revisión final antes de su publicación en Google Play Store.

## Funcionalidades Implementadas

### Simulación Física

- ✅ Péndulo simple con física newtoniana
- ✅ Péndulo doble (compuesto) con ecuaciones de movimiento acopladas
- ✅ Arrastre interactivo de pivote y masas
- ✅ Zoom y pan del lienzo
- ✅ Snap to grid opcional

### Audio Generativo

- ✅ Síntesis en tiempo real con Web Audio API
- ✅ Bass (triángulo) y Lead (seno + armónico)
- ✅ Mapeo de audio basado en ángulo y velocidad (independiente del zoom)
- ✅ Control de volumen individual por péndulo
- ✅ Efecto de delay dinámico

### Interfaz de Usuario

- ✅ Header responsive con dos filas en móvil
- ✅ Panel de control deslizable (bottom sheet)
- ✅ Fuentes personalizadas gallegas (GaliciaDiario, Castelao)
- ✅ Panel de información poético con créditos
- ✅ Botones de Play/Pause, Mute, Reset, Menú, Ayuda

### Plataforma

- ✅ Build de producción con Vite
- ✅ Empaquetado Android con Capacitor
- ✅ Probado en dispositivo físico

---

## Arquitectura de Código

```
src/
├── App.jsx              # Componente raíz, gestión de estado global
├── main.jsx             # Entry point
├── styles.css           # Estilos base y fuentes personalizadas
├── audio/
│   └── useAudio.js      # Hook de síntesis de audio (ángulo/velocidad)
├── components/
│   ├── Header.jsx       # Cabecera con controles principales
│   ├── ControlPanel.jsx # Panel lateral de ajustes físicos
│   └── PendulumCanvas.jsx # Canvas, interacción y modal de ayuda
└── hooks/
    ├── usePhysics.jsx       # Provider y estado del motor de física
    └── usePendulumRenderer.js # Renderizado canvas 2D
```

---

## Cambios Realizados (Sesión 16/01/2026)

1. **Header Redesign**: Título "PenduGalSon", dos filas en móvil, iconos reorganizados
2. **Grid Visibility**: Mayor opacidad y grosor de líneas
3. **Reset Functionality**: Limpieza completa del lienzo + silencio audio
4. **Poetic Info**: Descripción artística en gallego + © Toño Pita 2026
5. **Code Review Fixes**: Null checks, código muerto eliminado, dependencias
6. **Audio Refactor**: Mapeo basado en ángulo/velocidad (independiente del zoom)

---

## Pendientes para Play Store

- [ ] Generar APK/AAB firmado para producción
- [ ] Preparar capturas de pantalla para la ficha
- [ ] Redactar descripción de la tienda (gallego + español)
- [ ] Configurar política de privacidad
- [ ] Subir a Google Play Console

---

## Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Sincronizar con Android
npx cap sync

# Desplegar a dispositivo
export ANDROID_HOME=/home/tonetxo/Android/Sdk
npx cap run android --target=38171FDJG007SK
```

---

**Contacto**: <tonetxo@gmail.com>
