# EVOLUTE (çalışma adı) — Birleştir, Evrimleştir, Hükmet

> Hedef platform: Google Play (Android) · Tür: Hibrit-casual (Merge + Auto-battle roguelite + Idle meta)
> Not: Bu proje "Archotech" ile ilgili değildir. Ad ve konsept tamamen bağımsızdır.
> Not: "Evolute" bir çalışma adıdır. Yayından önce Play Store'da ve marka veritabanlarında çakışma kontrol edilmeli.
> Tarih: 2026-10-28

## 0. Varsayımlar (yanlışsa plan değişir)

- Tek kişi veya 2–3 kişilik küçük ekip, sınırlı pazarlama bütçesi.
- Birincil gelir kaynağı reklam (rewarded ağırlıklı) + uygulama içi satın alma (IAP).
- Sunucusuz (offline-first) bir v1 hedefleniyor. Sunucu maliyeti ve karmaşıklığı yok.
- Hiçbir oyun fikri kazanç garantisi vermez. Bu doküman "kazanma ihtimalini artıran, kaybetme maliyetini düşüren" bir yol haritasıdır (bkz. Bölüm 6).

---

## 1. Tek cümlelik fikir

**Tek hücreli canlıdan galaksiye: aynı türden canlıları birleştirerek evrimleştir, birleştirdiğin ordunun dalga dalga gelen mutantları otomatik yok etmesini izle, "Çağ" atlayıp yeni bir dünyaya geç.**

Reklam kancası (5 saniyelik klip): minik bir canlı → birleştikçe devasa bir yaratık → ekranı kaplayan boss'u tek vuruşta eritiyor. "Küçükten dev'e" hissi kısa videoda anlaşılır ve izlemesi tatmin edicidir.

---

## 2. Neden bu fikir? (Pazar kanıtı)

| Veri | Anlamı |
|---|---|
| Merge türü H1 2026'da ~1,3 milyar $ gelir, yıllık %74 büyüme, 311 M indirme (AppMagic özeti) | En hızlı büyüyen casual alt türlerinden biri |
| Hibrit-casual IAP geliri H1 2026'da %23 arttı, mid-core %7 düştü (Sensor Tower, Playio üzerinden) | Küçük ekip için en sağlıklı alan "basit çekirdek + derin meta" |
| Hypercasual indirmede lider (2025'te ~22 milyar) ama gelir payı düşüyor | Salt hypercasual'a girme: LTV kısa, yayıncıya bağımlı |
| Roguelike (Archero, Survivor.io) "basit kontrol, derin tekrar oynanabilirlik" planını kanıtladı | Rastgele "mutasyon seç" mekaniği retention için kanıtlı |
| Idle türü uzun LTV ve düşük içerik maliyeti sunar | Meta katman olarak idle seçildi |

Kaynakların bir kısmı reklam ağı/ajans bloglarıdır ve rakamlar kaynaklar arasında farklılık gösterir. Rakamlar yön gösterir, kesin değildir (bkz. Kaynaklar).

### Neden başka türler değil

| Alternatif | Elenme nedeni |
|---|---|
| Match-3 (~2,4–2,5 milyar $ pazar) | King/Playrix/Dream Games hakimiyeti, çok yüksek CPI, devasa içerik |
| Saf hypercasual | Gelir payı düşüyor, LTV kısa, yayıncıya bağımlı |
| 4X / strateji | Sunucu, çok içerik, yüksek UA maliyeti gerekir |
| Anlatılı merge (Merge Mansion tarzı) | Sürekli içerik + sanat ağırlığı, tek kişi için sürdürülemez |
| PvP / çok oyunculu | Sunucu, hile, "boş lobi" (cold-start) problemi |

### Dürüst rekabet notu
Merge ve roguelite türleri kalabalık. Avantajımız tür icadı değil, üç şeydir:
1. **Çağ (Era) yapısı:** bol ve ucuz içerik üretimi (Bölüm 3.3).
2. **Şerit + komşuluk sinerjisi:** düşük içerik maliyetiyle yüksek beceri tavanı (Bölüm 3.1).
3. **Veriye dayalı aşamalı geliştirme:** her aşamada ucuz test, başarısızsa erken durdurma (Bölüm 6).

---

## 3. Oyun tasarımı

### 3.1 Çekirdek döngü (bir "Koşu", 1,5–3 dakika)

- **Tahta:** dikey ekran, 5 sütun × 5 satır. Her sütun bir **şerit (lane)**. Düşmanlar üstten, şeritler boyunca iner.
- **Üretim:** her ~2,5 sn'de boş bir hücreye tier-1 canlı düşer. Oyuncu hızlandırabilir (koşu içi altınla).
- **Birleştirme:** aynı tür + aynı tier iki canlıyı sürükleyip birleştir → bir üst tier. Her tier görsel olarak belirgin biçimde büyür.
- **Saldırı:** her canlı, kendi sütunundaki (şeridindeki) düşmana otomatik saldırır. Yani **nereye birleştirdiğin önemlidir**: boss hangi şeritteyse güçlü canlıyı oraya taşımak gerekir.
- **Sinerji:** aynı elementten komşu canlılar bonus verir (Çağ başına 3 element, örn. Su / Zehir / Elektrik). Bu, yeni içerik eklemeden derinlik katar.
- **Mutasyon seçimi:** her 3 birleştirmede veya her boss sonrası 3 pasif yetenekten 1'ini seç (ör. "Zincir Reaksiyon: birleşmede %20 şansla yan şeride sıçrar"). Her koşu farklı bir "build" olur, tekrar oynanabilirliğin ana kaynağıdır.
- **Bitiş:** taban canı sıfırlanınca veya bölüm boss'u ölünce. Ödül: **DNA** (yumuşak para), nadiren **Gen** (parçalama/üretim malzemesi).
- **Yenilgi anı:** "Bir kez canlan" (rewarded reklam) — oyuncunun isteğe bağlı seçtiği en güçlü reklam noktası.

İlk 20 saniye hedefi: ilk birleştirme. Eğitim (FTUE) tek ekran, metinsiz, el hareketi animasyonlu olmalı.

### 3.2 Meta katman (Idle + koleksiyon)

- **Laboratuvar:** 4 yükseltme dalı (Saldırı, Dayanıklılık, Ekonomi, Otomasyon). DNA harcanır.
- **Kuluçka makinesi (idle):** oyuncu yokken DNA üretir. Başlangıçta 4 saat, rewarded reklam veya IAP ile 8 saate çıkar. Geri dönüş sebebi.
- **Tür Kataloğu (Codex):** her türün her tier'ını ilk kez bulmak koleksiyon ödülü verir. Tamamlama ihtiyacı uzun vadeli hedef yaratır.
- **Mutasyon havuzu:** 30+ pasif. Parça toplayarak **deterministik** (şansa bağlı olmayan) açılır. Böylece loot-box ve olasılık açıklaması yükümlülüğü ağırlaşmaz. Şans içeren bir sandık eklenirse Google Play, olasılıkların açıklanmasını ister.
- **Prestige ("Çağ Atla"):** Çağ boss'unu yenince laboratuvar sıfırlanır, Katalog korunur, kalıcı **Evrim Puanı** çarpanı kazanılır ve sonraki Çağ açılır.

### 3.3 Çağlar (içerik büyüme motoru)

| Çağ | Tema |
|---|---|
| 1 | İlkel Deniz |
| 2 | Orman / Kara |
| 3 | Buzul Çağı |
| 4 | Antik Uygarlık |
| 5 | Siberpunk |
| 6 | Uzay |

- **Çağ = yeniden kullanılabilir içerik paketi:** yeni arka plan, 12 tier'lık yeni türler, yeni düşman seti, 1 boss, müzik. Mekanikler ortaktır, içerik maliyeti düşüktür.
- **Lansman:** Çağ 1–2. **Sonrası:** her 4–6 haftada bir yeni Çağ güncellemesi = oyuncuya geri dönüş sebebi + mağazada "güncelleme" görünürlüğü + pazarlama hikâyesi.

### 3.4 Canlı operasyon (LiveOps)

- Günlük görevler (3 adet), 7 günlük giriş sandığı.
- Günlük mini "zindan" (kural değiştiren modifikatör).
- Haftalık Boss Raid + liderlik tablosu (Google Play Games Services, kendi sunucun gerekmez).
- Aylık Sezon Bileti (30 gün; ücretsiz + premium kol).
- Mevsimlik/zamanlı etkinlikler (ör. "Meteor Haftası").
- Topluluk: Discord + Reddit. Güncelleme notlarını düzenli paylaş.

---

## 4. Monetizasyon (hibrit)

### Reklam
- **Rewarded (oyuncu isteğiyle):** canlan, ×2 ödül, 5 dk üretim hızlandırma, ücretsiz mutasyon yenileme, çevrimdışı kazancı ×2.
- **Interstitial:** koşu sonlarında, ilk 3 oturumda hiç yok, sonra sıklık sınırlı (ör. 2–3 koşuda bir). "Reklamları Kaldır" satın alınınca kapanır.
- **Banner:** yok (deneyimi bozar, getirisi düşük).
- Mediation: LevelPlay (ironSource) veya AdMob mediation ile birden çok ağ. Rewarded eCPM Tier-1'de kabaca 16–20 $ bandında rapor ediliyor. Hindistan ve Güneydoğu Asya'da belirgin biçimde düşük (bkz. Kaynaklar). Türkiye için güvenilir veri bulamadım. Genelde düşük eCPM'li bölge sayılır ama bunu teyit edemedim, kendi mediation verinden ölç.

### IAP
| Ürün | Not |
|---|---|
| Başlangıç Paketi (~1,99 $, tek seferlik) | Genelde ilk satın alma dönüşümünün ana sürücüsü |
| Reklamları Kaldır + "Premium Boost" (~4,99–7,99 $) | Rewarded bonusları kalıcı ×2 |
| Sezon Bileti (~4,99 $) | Aylık, tekrarlayan gelir |
| Gem paketleri (0,99–49,99 $) | Hızlandırma, kozmetik |
| Çağ Atlama Fırsatı | Prestige sonrası zamanlı teklif |
| Piggy Bank | Sürekli dolan, kırması ücretli kumbara |
| (v2) Abonelik "Laboratuvar Üyeliği" | Aylık, düşük Google komisyonu (aboneliklerde genelde %15) |

Planlama kuralı: **PvE'de pay-to-win duvarı yok.** Para harcamak ilerlemeyi hızlandırır, kilidi açmaz.

---

## 5. Gelir senaryoları (VARSAYIM, tahmin DEĞİL)

ARPDAU = günlük aktif kullanıcı başına günlük gelir. Hibrit-casual için yayınlanan aralık kabaca 0,15–0,50 $ (reklam/ölçüm sağlayıcı kaynaklı, kaba bir aralık).

| Senaryo | DAU | ARPDAU | Aylık brüt (DAU × ARPDAU × 30) |
|---|---|---|---|
| Kötümser | 2.000 | 0,10 $ | ~6.000 $ |
| Baz | 10.000 | 0,25 $ | ~75.000 $ |
| İyimser | 50.000 | 0,50 $ | ~750.000 $ |

- Brüt gelir ≠ kâr. Reklam geliri doğrudan ağdan gelir. IAP'te Google komisyonu genelde %15 (yıllık ilk 1 milyon $; resmî sayfadan doğrula), sonrası %30.
- Ücretli kullanıcı edinimi (UA) yapacaksan **LTV > CPI** olmalı. Bunu test etmeden büyük bütçe harcama.
- Çoğu oyun 2.000 DAU'ya bile ulaşamaz. Kötümser senaryo bile bir başarıdır. Beklentiyi bu tabana göre kur.

---

## 6. Doğrulama kapıları (stage-gate) — kaybı sınırlayan kısım

Her kapıda **geçemezsen dur veya fikri değiştir.** Bir sonraki aşamaya para ve zaman harcama.

| Kapı | Süre (tahmin) | Ne yapılır | Geçme ölçütü |
|---|---|---|---|
| G0: Çekirdek eğlence | Hf 0–4 | Gri kutu (art'sız) prototip: üretim + birleştirme + şerit + 1 boss | 10 kişilik testte "bir tur daha" isteği; 20 sn içinde ilk birleştirme |
| G1: Pazar ilgisi | Hf 4–6 | 3–5 video kreatif (5 sn kanca), küçük reklam bütçesi (kabaca 200–500 $, tahminim) | Rekabetçi CTR/IPM, tahmini CPI hedefin altında |
| G2: Dikey dilim | Hf 6–14 | Meta + Çağ 1 + reklam/IAP + analitik | İç testte D1 ≥ ~40% hedefi |
| G3: Soft launch | Hf 12–18 | Seçili 1–2 ülkede kademeli yayın, küçük bütçe | Aşağıdaki retention ve gelir hedefleri |
| G4: Global | Hf 18+ | Tüm ülkeler + LiveOps ritmi | LTV > CPI, retention korunuyor |

**Retention referansı** (GameAnalytics 2026 raporu, 2025 verisi): medyan oyun D1 ≈ %22, D7 ≈ %4. İlk %10 dilimi D1 ≈ %40, D7 ≈ %12. Hibrit bir oyunun ciddi bir iş olabilmesi için hedef = **ilk %10'a yakın olmak** (D1 ≥ %40, D7 ≥ %12, D30 ≥ ~%4–5). Kaynaklar arasında farklı rakamlar var (bazıları D1 %26, D7 %10 verir), bu yüzden kendi analitiğine güven.

Süre tahminleri kabaca: tek kişi tam zamanlı ~4–5 ay, yarı zamanlı ~8–10 ay (benim tahminim, sanat tedariki ve deneyime göre değişir).

---

## 7. Teknik yığın (öneri)

| Alan | Öneri | Not |
|---|---|---|
| Motor | **Unity LTS** (C#) | Reklam/IAP SDK ekosistemi en olgun. Godot 4 daha hafif ama reklam SDK desteği daha sınırlı |
| Reklam | LevelPlay veya AdMob mediation | UMP/GDPR onay akışı gerekir (AB/UK) |
| IAP | Unity IAP / Google Play Billing | İleride sunucu tarafı satın alma doğrulaması |
| Analitik | Firebase Analytics + Crashlytics + Remote Config | Remote Config ile ekonomiyi güncelleme yapmadan ayarla |
| Kayıt/Liderlik | Google Play Games Services | v1'de kendi sunucu yok |
| İçerik | Addressables | Çağ paketlerini küçük APK ile yönet |
| Sanat | 2D stilize; Asset Store / ısmarlama | Üretken yapay zekâ çıktısı kullanılırsa lisans ve mağaza politikalarını kontrol et |

Mimari ilke: **tüm denge değerleri veri dosyasında/Remote Config'te**, koda gömülü değil.

---

## 8. Google Play'e özgü gereklilikler (yayından önce doğrula)

- Geliştirici hesabı: tek seferlik ücret (25 $).
- **Yeni kişisel hesaplar** (13 Kasım 2023 sonrası açılanlar): üretime çıkmadan önce **en az 12 test kullanıcısıyla, 14 gün kesintisiz kapalı test** şartı. Kurumsal (D-U-N-S numaralı) hesaplar muaf olabilir. Resmî sayfa: https://support.google.com/googleplay/android-developer/answer/14151465
- Gizlilik politikası + "Data safety" formu zorunlu.
- Reklam SDK'sı kullanıyorsan: reklam beyanı, AB/UK için onay (consent) akışı.
- **Çocuklara yönelik hedefleme yapma** (Families politikası reklamı ve veri toplamayı ciddi kısıtlar). Yaş derecelendirmesi (IARC) anketini doğru doldur.
- Şans içeren ödüller varsa olasılık açıklaması gerekir (bkz. Bölüm 3.2: deterministik tasarım tercih edildi).
- Hedef API seviyesi her yıl yükseliyor, yayın öncesi güncel şartı kontrol et.
- Türkiye'den ücretli satış/ödeme profili ve vergi bilgileri: Play Console ödeme profili adımlarını ve yerel vergi yükümlülüklerini bir mali müşavirle teyit et.

---

## 9. Pazarlama ve ASO

- **Kreatif önce:** oyun yapmadan önce 5 farklı 5 saniyelik kanca videosu dene: (1) minik → dev merge, (2) boss'u tek vuruşta silme, (3) "yenilgi" kancası, (4) Çağ atlama zaman çizelgesi, (5) sinerji zincir reaksiyonu.
- Organik: TikTok / YouTube Shorts / Reels için "tatmin edici evrim" klipleri; r/AndroidGaming, Discord.
- **ASO:** başlıkta ana anahtar kelime ("Merge", "Evolution", "Idle"), 6–8 ekran görüntüsü evrim hikâyesini anlatsın, 30 sn tanıtım videosu.
- Yerelleştirme: oyun metni az olduğu için ucuzdur. İngilizce + Türkçe + İspanyolca + Portekizce + Almanca + Japonca önerilir.
- Reklam gelirini yüksek tutmak için trafik Tier-1'e (ABD, UK, Kanada, Avustralya, Almanya) yönlendirilmeli. Türkiye trafiğinin ARPDAU'sunu soft launch'ta kendi verinle ölç, Tier-1 ile kıyasla.

---

## 10. Riskler ve önlemler

| Risk | Önlem |
|---|---|
| Kalabalık tür, yüksek CPI | G1'de kreatif testi, organik ağırlık, niş kanca |
| Kapsam şişmesi (scope creep) | Çağ modülerliği, "kes listesi", lansmanda yalnızca Çağ 1–2 |
| Reklama aşırı bağımlılık | IAP katmanı (Başlangıç Paketi, Sezon Bileti), abonelik v2 |
| Politika ihlali / hesap kapanması | Bölüm 8 kontrol listesi, çocuk hedeflememe |
| Tek kişi tükenmişliği / LiveOps yükü | Çağ başına 4–6 hafta ritmi, şablonlaştırılmış içerik hattı |
| Sunucusuz ekonomide hile | PvE ağırlıklı, IAP için sonradan sunucu doğrulaması |
| Retention hedefi tutmaz | Kapı G2/G3'te dur, mutasyon/meta katmanını yeniden tasarla veya fikri değiştir |

---

## 11. Sonraki kararlar

1. Motor (Unity önerilir) ve kişi sayısı / haftalık çalışma süresi
2. Sanat yönü (bütçeye göre: hazır paket, ısmarlama, ya da kendin)
3. UA test bütçesi (G1 için ~200–500 $ tahmini)
4. Kişisel hesap mı kurumsal hesap mı (12 test kullanıcısı şartı)
5. Nihai ad ve Play Store çakışma kontrolü

---

## Kaynaklar

- [Casual Games Report H1 2026 — AppMagic](https://appmagic.rocks/research/casual-report-H12026)
- [Puzzle and merge continue to lead casual games growth in H1 2026 — Mobidictum](https://mobidictum.com/casual-games-mobile-marketing-report-h1-2026/)
- [Types of Mobile Games, Explained for Marketers (2026) — Playio](https://blog.playio.co/mobile-game-genres-list)
- [Mobile Casual Market in H1 2026 — Friendly GameDev](https://friendlygamedev.com/blog/mobile-casual-market-in-h1-2026/)
- [GameAnalytics: Mobile and PC Game Benchmarks 2026 (retention PDF)](https://investgame.net/wp-content/uploads/2026/01/2026-01-20-Mobile_retention_benchmarks_2026.pdf)
- [ARPDAU benchmarks — Playio](https://blog.playio.co/arpdau-benchmarks-mobile-games)
- [Rewarded ad benchmarks 2026 — Playio](https://blog.playio.co/rewarded-ad-benchmarks-2026)
- [Google Play Console Help: test requirements for new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465)
