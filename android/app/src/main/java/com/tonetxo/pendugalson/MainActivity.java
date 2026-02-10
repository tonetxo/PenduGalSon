package com.tonetxo.pendugalson;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
        
        // Forza a ocultar a ActionBar se existe
        if (getActionBar() != null) {
            getActionBar().hide();
        }
    }
}
