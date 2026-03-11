import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from 'react-native-webview';

export interface RecaptchaModalHandle {
  verify: () => Promise<string>;
}

// ✅ Use an explicit named export
export const RecaptchaModal = forwardRef<RecaptchaModalHandle, { onVerify: (t: string) => void; onCancel?: () => void }>((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [resolvePromise, setResolvePromise] = useState<((token: string) => void) | null>(null);

  const firebaseWebHtml = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
        <script src="https://www.google.com/recaptcha/api.js"></script>
      </head>
      <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
        <div id="recaptcha-cont"></div>
        <script>
          window.onload = function() {
            window.grecaptcha.render('recaptcha-cont', {
              'sitekey': '6LcM9OUUAAAAAAmq44m4h-f1_s8Cj3c3Xgqg_XyG', 
              'callback': function(token) { window.ReactNativeWebView.postMessage(token); }
            });
          };
        </script>
      </body>
    </html>
  `;

  useImperativeHandle(ref, () => ({
    verify: () => {
      setVisible(true);
      return new Promise<string>((resolve) => { setResolvePromise(() => resolve); });
    }
  }));

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Verification</Text>
          <TouchableOpacity onPress={() => { setVisible(false); props.onCancel?.(); }}>
            <Text style={{ color: '#FF5A1F', fontWeight: 'bold' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <WebView
          originWhitelist={['*']}
          source={{ html: firebaseWebHtml, baseUrl: 'https://shubhyatra.world' }}
          onMessage={(event) => {
            const token = event.nativeEvent.data;
            if (resolvePromise) resolvePromise(token);
            props.onVerify(token);
            setVisible(false);
          }}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    </Modal>
  );
});