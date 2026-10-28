# Evolute (oyun kaynağı)

`OYUN_FIKRI.md` içindeki **G0 kapısı** (çekirdek eğlence testi) için oynanabilir prototip. Tek dosya: `evolute.html`.

## Nasıl çalıştırılır

- Tarayıcıda `evolute.html` dosyasını aç (telefonda veya masaüstünde). Sunucu gerekmez.
- Kayıt (DNA ve yükseltmeler) yalnızca o tarayıcıda, `localStorage` içinde tutulur.

## Oynanış

- Tahta 5×5. Her sütun bir şerit; canlılar kendi şeridindeki düşmana otomatik saldırır.
- Aynı element ve aynı sayıdaki iki canlıyı sürükleyip birleştir: sayı bir artar, hasar 2,4 kat büyür.
- Aynı elementten komşu canlılar sinerji bonusu verir (bağlantı çizgisi görünür).
- **ÜRET** düğmesi altınla anında canlı üretir. Otomatik üretim de var.
- Dalga 2, 4, 6, 8 başlangıcında 3 mutasyondan 1'i seçilir.
- 10. dalgada boss gelir. Koşu sonunda DNA kazanılır ve Laboratuvar'da kalıcı yükseltmeye harcanır.
- **6 Çağ:** İlkel Deniz, Sisli Orman, Buzul Çağı, Çöl Kumulları, Siber Şehir, Yıldız Boşluğu. Her çağın kendi arka planı, hücre dokusu, düşman süsü, ortam efekti ve müzik ölçüsü var. Bir çağın boss'unu devirince sonraki açılır. Çağlar daha çok can, daha çok DNA verir. Tamamlanan her çağ kalıcı +%10 hasar sağlar.
- **Tür Kataloğu:** 6 çağ × 3 element × 8 sayı = 144 tür. Bir türü ilk kez bulunca sayısı × 3 DNA kazanılır.
- **Ses:** Dosyasız (WebAudio) efektler. Sağ alttaki SES ile veya Ayarlar'dan kapatılır.
- **5 dil:** Türkçe, English, Deutsch, Español, Português. Cihaz diline göre seçilir, Ayarlar'dan değişir. Bilinmeyen dilde İngilizce.
- **Duraklatma** (sağ üst), ilk açılışta 3 adımlık **eğitim**, titreşim ayarı, ilerlemeyi silme (onaylı).
- **Günlük ödül:** 20 DNA + seri başına 10 (en çok 7 seri). **Kuluçka:** sen yokken DNA biriktirir (en fazla 4 saat; hız kazanılan galibiyet, en iyi dalga ve açık çağlarla artar).
- **Görsel yenileme:** Dokulu yaratıklar (her element kendi deseniyle), evrim aşamaları (boynuz, altın hale, kanat, aura, yıldız parıltısı), göz kırpma ve nefes animasyonu, her çağa özel katmanlı arka plan ve ortam parçacıkları (balon, ateş böceği, kar), kabartmalı tahta.
- **Oynanış çeşitliliği:** 3 düşman tipi (normal, hızlı koşucu, yavaş tank), boss %66 ve %33 canda takviye çağırır, şeritte tehlike uyarısı.
- **His (juice):** Birleştirme şok dalgası ve yıldızlar, kombo (ardışık birleştirmede ek altın), uçan altınlar, vuruş kıvılcımları, ekran sarsıntısı, yeni tür keşfinde tam ekran kutlama.
- **Kısa vadeli hedefler:** Her turda 3 hedef (sayı, öldürme, kombo, birleştirme), tamamlanınca DNA. 2× hız düğmesi. Sonuç ekranında sonraki yükseltmeye ilerleme çubuğu.
- **DNA kimliği:** Menüde dönen çift sarmal ve süzülen yaratıklar, DNA simgesi (arayüzde ve oyun içi sayaçta), öldürülen düşmandan sayaca uçan DNA, sonuçta DNA sayacı animasyonu ve 3 yıldız (tamamlanan hedeflere göre).
- **Hücre görünümü:** Tahta karoları petri kuyucuğu gibi detaylı (metalik çerçeve, çukur derinlik, organeller, çağa özel doku: balon, yosun filizi, kristal) ve içinde süzülen parçacıklar. Dolu hücrede elemente göre ışıma.
- **Animasyonlar:** Yaratık doğarken yumurtadan çıkar gibi büyür (dalgacık), sürüklenen yaratık hücreler arası uçar, birleşmede iki yaratık buluşup parlayarak yeni evrime geçer, düşman portalden belirir, canı azalınca kırmızı ekran vurgusu, can çubuğunda gecikmeli iz.
- **Arayüz:** Cam görünümlü paneller, kabartmalı düğmeler (basma animasyonu), kayarak giren öğeler, seviye çubuklu laboratuvar, renk kodlu mutasyon kartları, animasyonlu eğitim.
- **Modlar:** Menüdeki seçiciden: **Hikaye** (çağları sırayla bitir), **Sonsuz**, **Boss Akını** ve **Günlük**. Sonsuz ve Boss Akını o çağı bitirince açılır.
- **Boss Akını:** 5 boss art arda (her biri öncekinden güçlü, aralarda mutasyon seçimi). En iyi boss sayısı ve en iyi süre kaydedilir.
- **Günlük Meydan Okuma:** Her gün farklı kural: Sürü, Cam Top, Acele, Kıtlık, Devler, Tek Tür. Günün ilk galibiyeti bonus DNA verir.
- **Sonsuz mod:** Bir çağı bitirince o çağda açılır. Dalgalar bitmez, her 10. dalgada boss gelir, en iyi dalga kaydedilir.
- **22 başarım:** Toplam birleştirme/öldürme, sayı, galibiyet, kombo, katalog, çağ, tur sayısı. Her biri DNA verir, sonuç ekranında ve Başarımlar ekranında görünür.
- **Grafik kalitesi:** Oyun yavaşlarsa kendiliğinden düşük efekt moduna geçer (Ayarlar > Grafik ile elle de seçilir).
- **Ekstra animasyonlar:** Dokunma halkası, arka planda hafif kayma, düşman patlaması, hasar sayıları, zaferde konfeti, parıldayan başlık.
- **Müzik:** Çok kısık üretken fon müziği (çağa göre ölçü), Ayarlar'dan kapatılır. Gerçek kulakla denenmedi.
- **Android geri tuşu:** oyunda duraklatır, alt ekranlarda geri gider, ana menüde çıkar (Capacitor App eklentisiyle).

## G0 için ne ölçülmeli

`OYUN_FIKRI.md` Bölüm 6'daki ölçütler:

| Ölçüt | Nasıl bakılır |
|---|---|
| İlk birleştirme 20 sn altında mı | Sonuç ekranında "İlk birleştirme" satırı (tahta hazır çiftlerle başlar) |
| "Bir tur daha" isteği | Test edenin "Bir Tur Daha"ya basıp basmadığı, kaç tur oynadığı |
| Zorluk eğrisi | İlk turlarda yenilgi, birkaç yükseltmeden sonra boss'a ulaşma |

10 kişiye oynat, her birini izle ve şunları not et: nerede takıldı, kaç tur oynadı, hangi mutasyonu seçti.

## Test sonuçları (otomatik)

Basit bir bot (açık çiftleri birleştirir, ÜRET'i harcar, mutasyonu rastgele seçer), 150 koşu:

| Yükseltme | Boss'u devirme oranı |
|---|---|
| Yok (Çağ 1) | ~%11–19 |
| Orta (Saldırı 4, Dayanıklılık 3, Üretim 3) | ~%45–52 |
| Yüksek (Saldırı 10, Dayanıklılık 6, Üretim 6) | ~%76 |

Çağlar için aynı bot (150'ye yakın koşu): her çağ bir öncekinden belirgin biçimde daha fazla yükseltme ister. Çağ 1 orta yükseltmeyle ~%64, Çağ 2 orta yükseltmeyle ~%19 ve yüksekle ~%55, Çağ 3 yüksekle ~%13 ve çok yüksekle ~%57 kazanıyor.

Playwright ile doğrulananlar (G1 için ayrıca çağ açma, katalog keşfi, menü/katalog ekranları): gerçek fare sürükle-bırak ile birleştirme, ÜRET düğmesi, mutasyon seçimi, koşu sonu ekranı, 7 mutasyonun çökmeden çalışması, 360×640 ve 390×844 ekran düzeni.

**Sınırlar:** Denge yalnızca bota göre ayarlandı. Gerçek oyuncu farklı oynar, bu sayılar yön gösterir. Gerçek cihazda dokunmatik his, performans ve ses test edilmedi (ses yalnızca kodla yazıldı, bu ortamda duyulamadı).

## Bilerek yapılmayanlar (G0 kapsamı dışı)

Reklam ve satın alma (sonraya bırakıldı), günlük görevler, LiveOps, analitik, yerelleştirme. Çağ geçişi, tasarım dokümanındaki gibi laboratuvarı sıfırlayan bir prestige değil. Çağlar ilerleme ve kalıcı bonus olarak çalışıyor, çünkü sıfırlama olmadan prototipte test etmesi daha kolay.

## Sonraki adım

G0 geçilirse (testte "bir tur daha" isteği varsa) üretim sürümü için motor seçimi gerekir (Unity önerilir). Bu prototipin kodu doğrudan taşınmaz. Taşınacak olan tasarım ve denge sayılarıdır (`TIERMUL`, `waveHp`, mutasyon etkileri).
