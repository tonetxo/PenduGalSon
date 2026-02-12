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

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 1. Deixar que BridgeActivity (Capacitor) configure o seu tema e layout primeiro
        super.onCreate(savedInstanceState);

        // 2. Aplicar EdgeToEdge de forma moderna.
        // Isto encárgase de facer as barras transparentes e configurar o decor fits.
        EdgeToEdge.enable(this);

        // 3. Forza a ocultar a ActionBar se existe (redundante co tema pero seguro)
        if (getActionBar() != null) {
            getActionBar().hide();
        }
    }
}
