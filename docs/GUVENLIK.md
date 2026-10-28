# Güvenlik ve hile koruması

Bu belge, oyunda neyin korunduğunu, neyin korunamadığını ve seni neyin beklediğini dürüstçe anlatır.

## Önce gerçek: çevrimdışı oyunu tamamen hilesiz yapmak mümkün değil
Oyun sunucusuz çalışıyor, ilerleme telefonda duruyor. Telefonun sahibi (özellikle root'lu cihazda) ve oyunun kodunu değiştirip yeniden paketleyen biri her şeyi değiştirebilir. Tek oyunculu oyunlarda bunun zararı sınırlı: hile yapan kendi oyununu bozar. Asıl risk **para kazandıran yollar**: reklam ve satın alma. Orada koruma sunucu/Google tarafında olmalı (aşağıda).

Yapılan şey, sıradan hileyi ve "modlu APK" sitelerinin işini **zorlaştırmak**, bozuk veya oynanmış veriyle oyunun çökmesini engellemek ve geri kalan riski bilinçli yönetmek.

## Neler yapıldı

| Koruma | Ne engelliyor |
|---|---|
| **İmzalı kayıt (checksum) + iki kopya** | Kayıt dosyasında DNA/seviye elle değiştirilirse imza tutmaz, kayıt reddedilir ve sıfırlanır (uyarı gösterilir). Bir kopya bozulursa diğerinden kurtarılır |
| **Her alanı doğrulama (sanitize)** | İmza geçse bile mantıksız değer kabul edilmez: sayılar sınırlanır, çağ kilidi temizlenen çağlarla tutarlı olmak zorunda (kilit atlanamaz), kataloğa sahte anahtar eklenemez, metin alanları beyaz listeyle sınırlı |
| **Test kancaları üretim derlemesinde yok** | Konsoldan `__evolute` ile para/seviye verme yolu kapalı. Derleme betiği kancaları kaynaktan siler ve bulursa derlemeyi durdurur |
| **Kod küçültme ve isim karıştırma** | Kodu okuyup değiştirmeyi zorlaştırır (engellemez) |
| **Monoton saat** | Cihaz saati geri alınınca bekleme DNA'sı ve günlük ödül tekrar alınamaz. 30+ gün geri alınırsa güvenle sıfırlanır |
| **Sıkı CSP** | Oyun yalnızca kendi içeriğini çalıştırır, dışarıdan betik/veri yüklenemez, ağ bağlantısı yok (reklam eklenince ilgili alan adları izinlenecek) |
| **Android yedeği kapalı** | `adb backup` veya bulut yedeğiyle kayıt çıkarılıp değiştirilip geri yüklenemez |
| **WebView uzaktan hata ayıklama kapalı, düz HTTP kapalı** | Chrome DevTools ile canlı oyuna bağlanıp değer değiştirmek zorlaşır |
| **Çökme koruması** | Beklenmedik hata olursa oyun donmaz, çökme ekranı verir ve menüye döner |
| **Sabit imza anahtarı (debug)** | Güncelleme eskisinin üstüne kurulur. (Mağaza sürümünde Play'in imza anahtarı kullanılacak) |

## Test edildi
- `test7.js`: kayıt kurcalama (iki kopya, tek kopya, bozuk, JSON olmayan), düşmanca kayıt (aşırı değerler, prototip kirletme, sahte anahtarlar), saat geri alma, çökme kurtarma, kancaların bayraksız yokluğu.
- `test8.js`: üretim derlemesi (`www/`) gerçek dokunmalarla: kanca yok, CSP ihlali yok, dış ağ isteği yok, kayıt yazılıyor.
- `monkey.js`: rastgele 3000+ dokunma/sürükleme/menü tıklaması (6 tohum, 4 dil), her adımda sayıların bozulmadığı ve durumların tutarlı olduğu denetlendi. Hata çıkmadı.

## Bilinen sınırlar (dürüstçe)
1. **Depo herkese açık.** Kaynak kod, kayıt imza anahtarı ve oyun mantığı herkes tarafından okunabilir. Kararlı biri kendi sürümünü yapabilir. **Öneri: depoyu özel (private) yap** (GitHub > Settings > en altta Danger Zone > Change visibility). Özel depoda Actions ücretsiz dakikası sınırlı (ayda 2000 dk), bu oyun için yeter. APK indirme bağlantısı o zaman yalnızca GitHub'a giriş yapmış sana açılır.
2. **Telefon saatini ileri almak** günlük ödülü ve bekleme DNA'sını erken verir. Bunu önlemek için güvenilir zaman (sunucu) gerekir. Şimdilik etkisi küçük (günde birkaç yüz DNA) ve çevrimdışı kalır.
3. **Root'lu cihazda** bellek düzenleme araçları (Game Guardian vb.) çalışan oyunun değerlerini değiştirebilir. WebView içinde zor ama imkânsız değil.
4. **Modlu APK siteleri:** Biri APK'yı açıp kodu değiştirip yeniden imzalayabilir. Play Store'daki gerçek uygulamaya zarar vermez ama kullanıcı kandırılabilir. Önlem: oyunu **yalnızca Play Store'dan** dağıt ve resmî sürüm bağlantısını paylaş.

## Para kazanma başlayınca (asıl koruma burada)
- **Satın alma:** Google Play Faturalama makbuzunu Google imzalar. Sunucuda doğrulanmalı (Play Developer API). Aksi halde modlu APK "satın aldım" diyebilir. Bu yüzden küçük bir sunucu/bulut fonksiyonu gerekecek.
- **Cihaz bütünlüğü:** Play Integrity API ile uygulamanın değiştirilmemiş, Play'den kurulmuş olduğu doğrulanır. Yine sunucu tarafı gerektirir.
- **Reklam ödülü:** Ödül yalnızca reklam SDK'sının "izlendi" geri çağrısında verilmeli. Modlu APK bunu atlayabilir. Önlem: ödülleri küçük tut, AdMob **sunucu tarafı doğrulama** (SSV) kullan. Ayrıntı: `docs/REKLAM_PLANI.md`.
- **Gerçek çevrimiçi özellik** (liderlik tablosu, bulut kayıt) eklenirse kayıt ve skorlar sunucuda doğrulanmalı.

## Yayın sırasında yapılacaklar
- [ ] Depoyu private yap.
- [ ] Mağaza sürümünü **Play Uygulama İmzalama** ile yayınla (kendi imza anahtarını güvenli sakla, depoya koyma).
- [ ] `.aab` debug değil **release** derlemesi olsun (workflow bunu `bundleRelease` ile yapar).
- [ ] Gizlilik politikasını ve Veri güvenliği formunu reklam/satın alma eklenince güncelle.
