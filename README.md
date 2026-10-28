# Evolute

Mobil merge + roguelite + idle oyunu. Google Play için hazırlanıyor. Bu proje "Archotech" ile ilgili değildir.

## İçerik

| Yol | Ne |
|---|---|
| `OYUN_FIKRI.md` | Oyun fikri, pazar verisi, monetizasyon, doğrulama kapıları |
| `prototype/evolute.html` | **Oyunun kendisi** (tek dosya HTML5). Tarayıcıda açılır |
| `prototype/README.md` | Oynanış, denge, test sonuçları |
| `store/` | Mağaza metinleri, ikon, öne çıkan görsel, ekran görüntüleri, **`CHECKLIST.md` (senin yapacakların)** |
| `docs/privacy-policy.html` | Gizlilik politikası (TR + EN) |
| `docs/GUVENLIK.md` | Hile koruması: neler yapıldı, bilinen sınırlar, para kazanırken asıl koruma |
| `docs/REKLAM_PLANI.md` | Reklam nasıl eklenecek (türler, AdMob, kurallar, sıra) |
| `docs/APK_KURULUM.md` | **APK nasıl indirilir ve telefona kurulur (adım adım, Türkçe)** |
| `capacitor.config.json`, `package.json`, `scripts/`, `.github/workflows/android.yml` | Android paketleme (Capacitor 8, API 36) |
| `assets/`, `app/fonts/` | Uygulama ikonu, açılış ekranı, gömülü yazı tipi (Fredoka, SIL OFL) |

## Oyun özeti

- 5×5 tahta, 5 şerit. Aynı element ve sayıdaki canlıları sürükleyip birleştir. Canlılar kendi şeridindeki düşmana saldırır.
- **6 çağ** (İlkel Deniz, Sisli Orman, Buzul Çağı, Çöl Kumulları, Siber Şehir, Yıldız Boşluğu), her birinde kendi dünyası, 10 dalga ve boss.
- **4 mod:** Hikaye, Sonsuz, Boss Akını (5 boss art arda), Günlük Meydan Okuma (her gün farklı kural).
- Sonsuz mod (her çağ tamamlanınca açılır, rekor tutulur), 26 başarım, otomatik grafik kalitesi.
- **Çağa özel boss yetenekleri** (mürekkep, kökler, dondurma, skarab sürüsü, arıza, meteor) ve her çağın boss'una isim.
- **Teraryum:** Keşfettiğin yaratıklar serbestçe dolaşır, dokunup sevebilirsin (günde bir kez +1 DNA).
- 7 mutasyon, 144 türlük katalog, laboratuvar yükseltmeleri, günlük ödül, kuluçka (çevrimdışı DNA).
- 5 dil: Türkçe, English, Deutsch, Español, Português (cihaz diline göre seçilir).
- Duraklatma, eğitim, ses ve titreşim ayarları, Android geri tuşu desteği.
- Düğmeye özel animasyon, ses, titreşim ve parçacık efektleri (jöle, zıplama, çevirme, dönen dişli…), yönlü ekran geçişleri, anahtar (switch) tarzı ayarlar, HUD düğme efektleri; "hareketi azalt" ayarına saygılı.

## Android derlemesi

Bu ortamda Android SDK indirilemediği için derleme GitHub Actions'ta yapılır:

1. GitHub > Actions > **Android build** > Run workflow.
2. Çıktıdaki `evolute-android` dosyasından debug APK (telefonda dene) ve release AAB (Play'e yükle) alınır.
3. İmzalı AAB için `store/CHECKLIST.md` Bölüm 3'teki gizli anahtarlar eklenmeli.

Yerelde (JDK 21 + Android SDK varsa):

```
npm ci && npm run build:www
npx cap add android && node scripts/patch-android.js
npx capacitor-assets generate --android && npx cap sync android
cd android && ./gradlew assembleDebug
```

## Doğrulama durumu

Tarayıcıda otomatik testlerle doğrulandı: oynanış akışı, 5 dilde metin eşitliği, eğitim, duraklatma, günlük ödül, kuluçka, sıfırlama, geri tuşu mantığı, 3 çağın denge simülasyonu. Android paketi ve gerçek cihaz davranışı (dokunmatik his, ses, performans) henüz denenmedi.

Mağaza görsellerini yeniden üretmek için: `node scripts/make-assets.js` (playwright gerekir).
