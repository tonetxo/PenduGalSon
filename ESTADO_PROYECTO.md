# Estado do Proxecto: PenduGalSon

Data da última actualización: 21 de xaneiro de 2026

## 🚀 Situación Actual: Lanzamento en Play Store

O proxecto atópase na fase final de publicación en Google Play Store. O código é estable, pasou unha auditoría de seguridade e os binarios de produción xa foron xerados.

### ✅ Fitos Acadados

- **Binario de Produción**: Xerado con éxito o ficheiro Android App Bundle (`app-release.aab`) asinado.
- **Seguridade**: Auditoría completada (sen fugas de segredos, comunicacións seguras).
- **Firma Dixital**: Keystore de produción creado e configurado no proxecto (`pendugalson-release.keystore`).
- **Política de Privacidade**: Ficheiro `privacy.html` creado en galego e aloxado en GitHub Pages.
- **Git**: Repositorio sincronizado coa pola `feature/android-playstore` en GitHub.

### 🛠️ Detalles Técnicos

- **Ruta do AAB**: `android/app/build/outputs/bundle/release/app-release.aab`
- **Ruta do Keystore**: `android/pendugalson-release.keystore`
- **Ruta da Privacidade**: `https://tonetxo.github.io/PenduGalSon/privacy.html`
- **Configuración Gradle**: Uso de `keystore.properties` para xestionar credenciais de firma de forma segura (ignorado en Git).

### ⏳ Pendente de Acción (Google Play Console)

- **Verificación de Identidade**: Google está procesando os documentos de identidade do propietario (pode tardar uns días).
- **Configuración da Ficha**: Pendente de subir icona (512x512) e capturas de pantalla de móvil (mínimo 2).
- **Lanzamento**: Unha vez verificada a identidade e completada a ficha, proceder á subida do AAB a produción.

---

## 📅 Próximos Pasos (Tras a verificación)

1. Subir o AAB `app-release.aab` á canle de produción.
2. Definir o público obxectivo e clasificación de contido (PEGI 3).
3. Solicitar a revisión final da aplicación por parte de Google.
4. Publicación definitiva na tenda.

---
© Toño Pita 2026
