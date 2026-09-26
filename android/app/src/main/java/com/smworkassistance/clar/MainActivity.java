package com.smworkassistance.clar;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // B8 / T-061: let videos start WITH sound. Android's WebView default is "a user gesture is required for EVERY play", so every autoplay
    // with sound was refused and the app fell back to muted (owner report: "auto mute ho raha he har video").
    getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
  }
}
