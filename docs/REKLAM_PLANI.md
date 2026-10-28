# Reklam planı (nasıl yapacağız)

Şimdilik oyunda **reklam yok**. Bu belge, ekleneceği zaman izlenecek yolu anlatır. Önce oyuncunun oyuna tutunduğunu ölçmeden reklam eklemek, oyuncuyu kaçırır.

## 1. Hangi reklam, nerede?

| Tür | Ne zaman | Not |
|---|---|---|
| **Ödüllü reklam (en önemlisi)** | Oyuncu isteyince | "Yenilince bir kez canlan", "koşu sonu DNA ×2", "kuluçka DNA'sını ×2 topla", "bedava mutasyon yenile", "5 dk hızlı üretim". Oyuncu seçtiği için memnun kalır, geliri en yüksek olan budur |
| **Geçiş reklamı (interstitial)** | Sonuç ekranından sonra | İlk 3 turda hiç yok. En fazla 3 turda 1. İki reklam arası en az 90 sn. Oyun sırasında asla |
| **Banner** | Yok | Gelir düşük, görüntüyü bozar |
| **"Reklamları Kaldır" satın alması** | Menüde | Geçiş reklamını kapatır, ödüllü reklam bonuslarını kalıcı açar. Reklam yüzünden kaçanlardan gelir sağlar |

## 2. Hangi şirket?
- **Google AdMob** (önerilen başlangıç): Play ile uyumlu, kurulumu kolay, ödül/geçiş desteği, Türkiye'den ödeme alınabilir.
- **İleride:** Birden çok ağ arasında rekabet ettiren mediation (AppLovin MAX veya Unity LevelPlay) geliri artırır ama kurulumu karmaşık. Önce AdMob ile başla, oyun tutunursa geç.

## 3. Teknik yol
1. Capacitor eklentisi: `@capacitor-community/admob`. Ben eklentiyi ekler, oyuna ödüllü/geçiş çağrılarını bağlarım. İlk haliyle **yalnızca test reklam kimlikleriyle** çalışır.
2. Bunun için gereken: **senin AdMob hesabın**, Android uygulaması, ve şu kimlikler: Uygulama Kimliği (`ca-app-pub-xxxx~yyyy`), Ödüllü birim kimliği, Geçiş birim kimliği.
3. Kapsam: reklam servislerinin alan adları CSP'ye eklenir (`scripts/build-www.js`, `connect-src` ve `script-src`), `AndroidManifest`'e AdMob uygulama kimliği ve `AD_ID` izni yazılır.
4. AB/İngiltere kullanıcıları için **rıza formu (UMP)** eklentinin içinde hazır, açılışta çağrılır.
5. Gizlilik politikası ve Play **Veri güvenliği** formu güncellenir (reklam kimliği ve cihaz bilgisi toplanıyor diye).

## 4. Çok önemli kurallar (hesabını korumak için)
- **Kendi reklamına tıklama.** Geliştirme sırasında yalnızca test kimlikleri kullanılır. Gerçek kimlikle kendi reklamını görüntüleyip tıklarsan AdMob hesabı kalıcı kapatılabilir. Ben test kimlikleriyle bağlarım, gerçek kimlikleri yayın günü eklersin.
- Hedef kitle **13+** kalmalı. Çocuklara yönelik seçilirse reklam ve veri kuralları çok sıkılaşır.
- Reklam sıklığını aşma, yanlışlıkla tıklatan düzenler yasak (düğmenin hemen yanına reklam koyma vb.).

## 5. Gelir beklentisi (kaba, doğrulanmamış)
- Ödüllü reklam başına gelir (eCPM) ABD/İngiltere gibi ülkelerde kabaca 16–20 $/1000 gösterim bandında rapor ediliyor (reklam şirketi kaynaklı). Türkiye daha düşük, kesin rakam bulamadım.
- Hibrit-casual günlük kullanıcı başına gelir kabaca 0,15–0,50 $ aralığında rapor ediliyor. 10.000 günlük aktif kullanıcıyla aylık ~45–150 bin $ brüt demektir ama oraya ulaşmak ayrı iştir (bkz. `OYUN_FIKRI.md` Bölüm 5).
- AdMob ödemesi 100 $ eşiğinden sonra yapılır. Vergi bilgileri ve adres doğrulaması gerekir. Türkiye'de vergi yükümlülüğü için mali müşavire danış.

## 6. Hile ve sahte ödül
Ödül yalnızca reklam SDK'sı "izlendi" dediğinde verilir. Modlu APK bunu atlayabilir. Bu yüzden: ödülleri küçük tut ve ölçeklenince AdMob **sunucu tarafı doğrulaması** ekle (küçük bir bulut fonksiyonu). Ayrıntı: `docs/GUVENLIK.md`.

## 7. Sıra
1. Oyunu önce reklamsız yayınla veya kapalı test et. Oyuncu tutunması ölçülür (D1 ≥ ~%40, D7 ≥ ~%12 hedefi, `OYUN_FIKRI.md` Bölüm 6).
2. **Sen:** Google Play Console hesabı (+ ödeme/vergi) ve AdMob hesabı aç.
3. **Ben:** eklentiyi ve çağrıları test kimlikleriyle bağlarım, ayarları ve gizlilik metnini güncellerim.
4. Kapalı testte reklamları dene (test reklamlarıyla), sıklığı ayarla.
5. Yayın günü gerçek reklam kimliklerini koyarız.
6. Sonra: "Reklamları Kaldır" satın alması (Play Faturalama), mediation, sunucu doğrulaması.

## Oyuncuyu oyunda tutan sistemler ve reklam noktaları (v1.8)

Oyun süresi arttıkça ödüllü reklam izleme fırsatı artar. Şu an var olan döngüler: günlük görevler (3 görev + tamamlama bonusu), oyuncu seviyesi (her seviyede DNA), günlük ödül serisi, kuluçka, başarımlar, teraryum, 4 mod.
Reklam eklendiğinde (isteğe bağlı, zorlamasız) bağlanacak yerler:
- Görev ödülünü **2x** yapan ödüllü reklam (görev ekranındaki Al düğmesinin yanında).
- Günlük ödül ve kuluçka için **2x** reklamı.
- Yenilgi ekranında "devam et" (bir kez) ödüllü reklamı.
- Tur sonunda en fazla birkaç turda bir araya giren (kısa) geçiş reklamı; ilk oturumlarda yok.
