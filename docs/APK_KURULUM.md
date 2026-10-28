# APK nasıl alınır ve telefona kurulur

İki yol var. **A yolu için bilgisayarına hiçbir şey kurman gerekmez.** B yolunu yalnızca kendi bilgisayarında derlemek istersen kullan.

---

## A) GitHub'ın sunucusunda derlenmiş APK'yı indir (önerilen, kurulumsuz)

### 1. APK'yı indir (en kolay yol: Releases)
Her derleme otomatik olarak bir **Release** olarak yayınlanır. Zip açmana gerek yok, doğrudan `.apk` iner.

1. Telefonun tarayıcısında şu sayfayı aç: `github.com/sezicicagan-maker/Proje-/releases`
2. En üstteki sürümü seç (örn. "Evolute 1.6.0 (build 7)").
3. **Assets** altındaki `Evolute-x.y.z.apk` dosyasına dokun, iner.
4. Aşağıdaki "Telefona kur" adımlarına geç.

> Depo özelse (private) önce tarayıcıda GitHub hesabınla giriş yapmış olmalısın.

Alternatif: **Actions** sekmesi > en üstteki "Android build" çalışması (yeşil tik) > en alttaki **Artifacts** > `evolute-android` (zip, içinde `app-debug.apk` ve `app-release.aab` var).

### 2. Telefona kur
1. İndirdiğin `.apk` dosyasına dokun (bildirimden veya "Dosyalarım > İndirilenler").
2. Android "güvenlik nedeniyle yüklenemiyor" derse: açılan pencerede **Ayarlar**'a dokun ve o dosyayı açan uygulama (Chrome, Dosyalarım...) için **Bu kaynaktan izin ver**'i aç. Geri dönüp tekrar dokun.
3. "Play Protect bu uygulamayı taramadı" uyarısı çıkarsa **Yine de yükle**'ye dokun. Bu normal: uygulama Play Store'dan gelmiyor.
4. **Yükle** ve **Aç**.

### 3. Yeni sürümü eskisinin üstüne kurmak
Tüm APK'lar aynı sabit anahtarla imzalanıyor: yeni sürüm eskisinin **üstüne** kurulur ve ilerlemen korunur.
İstisna: bu özellikten önce kurduğun çok eski bir APK varsa Android "paket çakışıyor" der. Bir kereye mahsus eski Evolute'u kaldırıp yenisini kur.
Not: 1.6.0 ile kayıt formatı değişti (güvenlik için imzalı kayıt). Eski sürümlerdeki ilerleme bir kere sıfırlanır.

### Kendim derletmek istiyorum
Varsayılan dal artık `claude/oyun-fikri`, yani düğme çıkıyor:
1. Depoda **Actions** sekmesi > soldan **Android build** > sağdaki **Run workflow**.
2. `versionCode` kutusuna her seferinde bir öncekinden büyük sayı yaz (örn. 8, 9, 10), `versionName`'e `1.6.1` gibi bir şey yaz. **Run workflow**.
3. 2-3 dakika sonra yeşil tik çıkar ve Releases sayfasında yeni APK belirir.

---

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
