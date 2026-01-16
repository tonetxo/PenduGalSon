# 🚀 Próximos Pasos: Publicación en Google Play

O desenvolvemento da aplicación **PenduGalSon** está completo. A interface, iconas e funcionalidades (Snap to Grid) están listas e gardadas no repositorio.

Para publicar a app, precisamos xerar unha versión asinada ("Signed Release").

## 1. Xerar Keystore (Chave de Seguridade)

Se non tes un `keystore` previo para esta app, xera un novo co seguinte comando no terminal (dentro do cartafol do proxecto):

```bash
keytool -genkey -v -keystore pendugalson-release.keystore -alias pendugalson -keyalg RSA -keysize 2048 -validity 10000
```

*Garda este arquivo e o contrasinal en lugar seguro. Sen el non poderás actualizar a app no futuro.*

## 2. Xerar o App Bundle (AAB)

O formato .AAB é o requirido por Google Play hoxe en día (optimiza a descarga para cada usuario).

```bash
cd android
./gradlew bundleRelease
```

Se o build falla por falta de configuración de asinado, pódese asinar manualmente ou configurar o `build.gradle`.
**Opción rápida**: Abrir o proxecto en **Android Studio** (`npx cap open android`), ir a `Build > Generate Signed Bundle / APK`, escoller `Android App Bundle` e seleccionar o keystore creado no paso 1.

## 3. Localizar o Arquivo

Unha vez xerado, o arquivo estará en:
`android/app/build/outputs/bundle/release/app-release.aab`

## 4. Subir a Google Play Console

1. Accede a [Play Console](https://play.google.com/console).
2. Crea unha nova app.
3. No apartado "Produción" ou "Testing pechado", sube o arquivo `.aab`.
4. Completa a ficha da tenda (descrición, capturas de pantalla, icona).

---
*Cando volvas, podemos facer estes pasos xuntos.*
