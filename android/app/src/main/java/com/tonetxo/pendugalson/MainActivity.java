package com.tonetxo.pendugalson;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.graphics.Color;
import androidx.activity.EdgeToEdge;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
// TODO: Descomentar para pruebas con AdMob
/*
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.initialization.InitializationStatus;
import com.google.android.gms.ads.initialization.OnInitializationCompleteListener;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.view.Gravity;
import android.view.ViewGroup;
*/

public class MainActivity extends BridgeActivity {
    // TODO: Descomentar para pruebas con AdMob
    // private AdView mAdView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 1. Deixar que BridgeActivity (Capacitor) configure o seu tema e layout primeiro
        super.onCreate(savedInstanceState);

        // TODO: Descomentar para pruebas con AdMob
        // // 2. Inicializar AdMob
        // MobileAds.initialize(this, new OnInitializationCompleteListener() {
        //     @Override
        //     public void onInitializationComplete(InitializationStatus initializationStatus) {
        //     }
        // });
        //
        // // 3. Engadir o banner como overlay na parte inferior da pantalla
        // // NON tocar o layout do WebView para evitar parpadeos e problemas con xestos
        // mAdView = new AdView(this);
        // mAdView.setAdSize(AdSize.BANNER);
        // mAdView.setAdUnitId("ca-app-pub-3940256099942544/6300978111");
        //
        // // Usar o decorView (a vista raíz absoluta da ventana)
        // FrameLayout decorContent = (FrameLayout) getWindow().getDecorView().findViewById(android.R.id.content);
        // if (decorContent != null) {
        //     FrameLayout.LayoutParams adParams = new FrameLayout.LayoutParams(
        //             FrameLayout.LayoutParams.MATCH_PARENT,
        //             FrameLayout.LayoutParams.WRAP_CONTENT
        //     );
        //     adParams.gravity = Gravity.BOTTOM;
        //     decorContent.addView(mAdView, adParams);
        //
        //     // Cargar o banner
        //     AdRequest adRequest = new AdRequest.Builder().build();
        //     mAdView.loadAd(adRequest);
        // }

        // 4. Aplicar EdgeToEdge de forma moderna.
        EdgeToEdge.enable(this);

        // 5. Forza a ocultar a ActionBar se existe
        if (getActionBar() != null) {
            getActionBar().hide();
        }
    }
}
