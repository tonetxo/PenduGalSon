# Estado do Proxecto: PenduGalSon

Data da última actualización: 10 de febreiro de 2026

## 🚀 Situación Actual: Lanzamento en Play Store (v1.2)

O proxecto atópase listo para publicación en Google Play Store coa versión **1.2 (3)**. Solucionáronse os problemas de compatibilidade con Android 15 (Edge-to-Edge) e eliminouse a barra de título nativa persistente.

### ✅ Fitos Acadados

- **Compatibilidade Android 15**: Implementado `EdgeToEdge.enable()` e axustes de `safe-area` no CSS.
- **Corrección Visual**: Eliminada a `ActionBar` nativa forzando o tema `MaterialComponents.DayNight.NoActionBar` e ocultándoa por código.
- **Binario de Produción**: Xerado con éxito o ficheiro Android App Bundle (`app-release.aab`) asinado (v1.2).
- **Seguridade**: Auditoría completada e firma dixital configurada.
- **Política de Privacidade**: Ficheiro `privacy.html` aloxado e listo.

### 🛠️ Detalles Técnicos

- **Versión**: 1.2 (versionCode 3)
- **SDK Objetivo**: 36 (Android 15+)
- **Ruta do AAB**: `android/app/build/outputs/bundle/release/app-release.aab`
- **Ruta do APK**: `android/app/build/outputs/apk/release/app-release.apk`
- **Keystore**: `android/pendugalson-release.keystore`

### ⏳ Pendente de Acción (Google Play Console)

- **Subir nova versión**: Cargar o AAB v1.2 á Play Console para substituír a versión anterior con advertencias.
- **Verificación de Identidade**: Completar se aínda está pendente.
- **Lanzamento**: Enviar a revisión e publicar.

---

## 📅 Próximos Pasos

1. Probar a fondo a versión instalada no dispositivo móbil.
2. Subir o AAB `app-release.aab` á canle de produción/testing.
3. Solicitar revisión en Google Play.

---
© Toño Pita 2026
