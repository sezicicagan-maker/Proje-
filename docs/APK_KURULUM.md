# APK nasıl alınır ve telefona kurulur

İki yol var. **A yolu için bilgisayarına hiçbir şey kurman gerekmez.** B yolunu yalnızca kendi bilgisayarında derlemek istersen kullan.

---

## A) GitHub'ın sunucusunda derlenmiş APK'yı indir (önerilen, kurulumsuz)

### 1. Derlemeyi başlat
Şu an derlemeyi ben başlatıyorum (sohbette "derleme başlattım" dediğimde hazırdır, 2-3 dakika sürer).
Kendin başlatmak istersen bir kerelik ayar gerekir (aşağıdaki "Kendim başlatmak istiyorum" kısmına bak).

### 2. APK'yı indir
1. Tarayıcıda depoyu aç: `github.com/sezicicagan-maker/Proje-` (GitHub hesabınla giriş yapmış olmalısın).
2. Üstteki **Actions** sekmesine gir.
3. Listenin en üstündeki **Android build** çalışmasına tıkla (yeşil tik varsa hazırdır).
4. Sayfayı en alta kaydır, **Artifacts** bölümündeki **evolute-android** dosyasına tıkla. Bir `.zip` iner.
5. Zip'i aç. İçinde iki dosya var:
   - `app-debug.apk`: telefona kurup denemek için
   - `app-release.aab`: Google Play'e yüklemek için (şimdilik gerekmez)

> Telefondan da yapabilirsin: aynı sayfayı telefonun tarayıcısında aç, zip'i indir, "Dosyalarım" uygulamasında zip'e dokunup çıkar.
> Bilgisayardan indirdiysen APK'yı telefona USB, Drive veya WhatsApp ile at.

### 3. Telefona kur
1. `app-debug.apk` dosyasına dokun.
2. Android "güvenlik nedeniyle yüklenemiyor" derse: açılan pencerede **Ayarlar**'a dokun ve o dosyayı açan uygulama (Dosyalarım, Chrome, WhatsApp...) için **Bu kaynaktan izin ver**'i aç. Geri dönüp tekrar dokun.
3. "Play Protect bu uygulamayı taramadı" uyarısı çıkarsa **Yine de yükle**'ye dokun. Bu normal: uygulama Play Store'dan gelmiyor.
4. **Yükle** ve **Aç**.

### 4. Yeni sürümü eskisinin üstüne kurmak
Bu projeden sonraki tüm APK'lar aynı sabit anahtarla imzalanıyor, yani yeni sürüm eskisinin **üstüne** kurulur ve ilerlemen (DNA, yükseltmeler) korunur.
İstisna: bu rehberden önce kurduğun eski bir APK varsa Android "uygulama yüklenemedi / paket çakışıyor" der. Bir kereye mahsus eski Evolute'u kaldırıp yenisini kur (ilerleme silinir).

### Kendim başlatmak istiyorum
Derleme düğmesi GitHub'da yalnızca **varsayılan dalda** görünür. Şu an kod `claude/oyun-fikri` dalında. Tek seferlik ayar:
1. Depoda **Settings > Branches** bölümüne gir.
2. **Default branch** yanındaki kalem/ok düğmesine bas, `claude/oyun-fikri` dalını seç ve onayla.
3. Artık **Actions > Android build > Run workflow** düğmesi çıkar. `versionCode` kutusuna her seferinde bir öncekinden büyük sayı yaz (örn. 6, 7, 8), `versionName`'e `1.3.1` gibi bir şey yaz.

---

## B) Kendi bilgisayarında derle (isteğe bağlı)

Bunu yalnızca internet olmadan çalışmak veya hızlı deneme döngüsü için yap. Gerekenler:

1. **Node.js 22**: nodejs.org
2. **JDK 21**: adoptium.net (Temurin 21)
3. **Android Studio**: developer.android.com/studio. İlk açılışta "Standard" kurulumu seç, SDK'yı indirsin. Sonra **Settings > Languages & Frameworks > Android SDK** bölümünden **Android 16 (API 36)** paketini işaretleyip kur.
4. Ortam değişkeni: `ANDROID_HOME` = SDK klasörün (Android Studio'da SDK yolunu gösterir).

Sonra projenin klasöründe:

```
npm ci
npm run build:www
npx cap add android
node scripts/patch-android.js
npx capacitor-assets generate --android
npx cap sync android
cd android
./gradlew assembleDebug        # Windows'ta: gradlew.bat assembleDebug
```

APK burada çıkar: `android/app/build/outputs/apk/debug/app-debug.apk`.

Telefonu USB ile bağlayıp (Ayarlar > Telefon hakkında > Yapı numarasına 7 kez dokun > Geliştirici seçenekleri > **USB hata ayıklama** açık) doğrudan kurmak için:

```
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## Telefonda denerken bak
- İlk açılış: eğitim çıkıyor mu, ilk birleştirme kolay mı?
- Dokunma: sürüklemek akıcı mı, yanlış hücreye mi bırakıyor?
- Performans: yoğun anlarda (boss, çok yaratık) takılıyor mu? Takılırsa Ayarlar > Grafik > Düşük dene ve bana söyle.
- Ses ve müzik: rahatsız edici mi? Ayarlar'dan kapatılabilir.
- Geri tuşu: oyunda duraklatıyor mu, ana menüde çıkıyor mu?
- Ekran kenarları: çentik veya alt çubuk içeriği kesiyor mu?
- Uygulamayı arka plana atıp geri dönünce oyun duraklıyor mu?

## Sorun giderme
| Sorun | Çözüm |
|---|---|
| Artifacts bölümü görünmüyor | Çalışma henüz bitmemiştir veya kırmızıdır. Yeşil tik bekle, kırmızıysa bana yaz |
| İndirince "404" | GitHub hesabınla giriş yapmadan artifact indirilmez |
| "Uygulama yüklenemedi" | Eski bir Evolute kuruluysa önce kaldır (bkz. 4. adım) |
| Zip açılmıyor | Telefonda "Dosyalarım"da zip'e dokun, "Çıkar" seç |
| Artifact kayboldu | Artifact'lar 90 gün saklanır. Yeniden derlet |

## Google Play için
Play'e yüklenecek dosya `.aab`'dır ve imzalı olmalıdır. Adımlar `store/CHECKLIST.md` içinde.
