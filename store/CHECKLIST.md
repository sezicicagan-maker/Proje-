# Yayın kontrol listesi (senin yapacakların)

Kod, görsel ve metinler hazır. Aşağıdakiler hesap, ödeme ve kimlik gerektirdiği için sende.

## 1. Hesap ve ödeme
- [ ] Google Play Console geliştirici hesabı (tek seferlik 25 $).
- [ ] Ödeme profili ve vergi bilgileri (Türkiye'den satış/ödeme için mali müşavirle teyit et).
- [ ] Kişisel hesap mı kurumsal (D-U-N-S) mı? Kişisel hesapta yayından önce **12 test kullanıcısı, 14 gün kesintisiz kapalı test** şartı var (resmî sayfadan doğrula).

## 2. Uygulama kimliği
- [ ] Paket adını seç. Şu an `com.evolute.merge` (`capacitor.config.json`). Yayından sonra DEĞİŞTİRİLEMEZ. Kendi alan adın/adınla değiştirmek istersen önce burayı düzelt.
- [ ] Play Store'da "Evolute" adının ve marka çakışmasının kontrolü.

## 3. İmza anahtarı (bir kez)
```
keytool -genkeypair -v -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias evolute -keystore evolute-upload.jks
base64 -w0 evolute-upload.jks
```
GitHub depo ayarları > Secrets and variables > Actions altına şu 4 gizli anahtarı ekle:
`ANDROID_KEYSTORE_BASE64` (yukarıdaki çıktı), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (evolute), `ANDROID_KEY_PASSWORD`.
Keystore dosyasını ve şifreleri güvenli yerde yedekle. Kaybedersen güncelleme yükleyemezsin. Play Console'da "Play Uygulama İmzalama" açık bırak.

## 4. Derleme
- [ ] GitHub > Actions > "Android build" > Run workflow (versionCode her yüklemede artmalı).
- [ ] Çıktıdan `evolute-android` dosyasını indir: debug APK (telefonda dene) + release AAB (Play'e yükle).
- [ ] Gerçek telefonda dene: dokunmatik his, ses, performans, ekran kenarları, geri tuşu. Bu kodu cihazda ben deneyemedim.

## 5. Mağaza sayfası (Play Console)
- [ ] `store/listing.md` metinleri, `store/icon-512.png`, öne çıkan görsel, `store/screenshots/*`.
- [ ] Gizlilik politikası: `docs/privacy-policy.html` dosyasını bir adreste yayınla (örn. GitHub Pages), iletişim e-postasını doldur, bağlantıyı forma gir.
- [ ] İçerik derecelendirme (IARC), hedef kitle (13+), Veri güvenliği formu, reklam beyanı (şimdilik reklam yok).
- [ ] Önce Dahili/Kapalı test kanalı, sonra Üretim.

## 6. Para kazanma (sonra)
- [ ] AdMob (veya LevelPlay) hesabı, ödül reklamı yerleşimleri. Kodda reklam henüz yok.
- [ ] Play Faturalama ürünleri: reklamsız paket, başlangıç paketi, sezon bileti (bkz. `OYUN_FIKRI.md` Bölüm 4).
- [ ] Reklam gelince: gizlilik politikası + Veri güvenliği + AB/UK rıza (UMP) akışı güncellenmeli.

## Bilinen sınırlar
- Capacitor/WebView sürümü Play'in hedef API şartını (API 36) karşılıyor, ama Android derlemesini bu ortamda çalıştıramadım (SDK indirme engelli). İlk Actions çalıştırmasında hata çıkarsa log'u bana getir.
- Kayıt cihazdaki yerel depoda tutuluyor. Uygulama verisi temizlenirse ilerleme silinir. Bulut kaydı (Play Games) yok.
