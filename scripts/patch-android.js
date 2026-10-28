// `npx cap add android` sonrası çalışır: dikey kilit, sürüm numarası, tam ekran ayarları.
// Kullanım: VERSION_CODE=3 VERSION_NAME=1.0.2 node scripts/patch-android.js
const fs = require('fs');
const path = require('path');
const android = path.join(__dirname, '..', 'android');

const manifestPath = path.join(android, 'app/src/main/AndroidManifest.xml');
let m = fs.readFileSync(manifestPath, 'utf8');
if (!m.includes('android:screenOrientation')) m = m.replace('<activity', '<activity\n            android:screenOrientation="portrait"');
fs.writeFileSync(manifestPath, m);

// Sabit debug anahtarı: her derleme aynı anahtarla imzalanır, yeni APK eskisinin üstüne kurulabilir.
fs.copyFileSync(path.join(__dirname, '..', 'app', 'debug.keystore'), path.join(android, 'app', 'debug.keystore'));

const gradlePath = path.join(android, 'app/build.gradle');
let g = fs.readFileSync(gradlePath, 'utf8');
const code = process.env.VERSION_CODE || '1', name = process.env.VERSION_NAME || '1.0.0';
g = g.replace(/versionCode \d+/, 'versionCode ' + code).replace(/versionName "[^"]*"/, 'versionName "' + name + '"');
// İmzalama: keystore.properties varsa release imzalanır (CI gizli anahtarlardan üretir).
if (!g.includes('keystore.properties')) {
  g = 'def keystorePropsFile = rootProject.file("keystore.properties")\ndef keystoreProps = new Properties()\nif (keystorePropsFile.exists()) keystoreProps.load(new FileInputStream(keystorePropsFile))\n' + g;
  g = g.replace(/android \{/, `android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (keystorePropsFile.exists()) {
                storeFile file(keystoreProps['storeFile'])
                storePassword keystoreProps['storePassword']
                keyAlias keystoreProps['keyAlias']
                keyPassword keystoreProps['keyPassword']
            }
        }
    }`);
  g = g.replace(/buildTypes \{\s*release \{/, 'buildTypes {\n        release {\n            if (keystorePropsFile.exists()) signingConfig signingConfigs.release');
}
fs.writeFileSync(gradlePath, g);
console.log('Android projesi yamalandı: versionCode', code, 'versionName', name);
