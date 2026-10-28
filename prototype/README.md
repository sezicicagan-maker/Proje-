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
- **3 Çağ:** İlkel Deniz, Sisli Orman, Buzul Çağı. Bir çağın boss'unu devirince sonraki açılır. Çağlar daha çok can, daha çok DNA verir. Tamamlanan her çağ kalıcı +%10 hasar sağlar.
- **Tür Kataloğu:** 3 çağ × 3 element × 8 sayı = 72 tür. Bir türü ilk kez bulunca sayısı × 3 DNA kazanılır.
- **Ses:** Dosyasız (WebAudio) efektler. Sağ alttaki SES ile veya Ayarlar'dan kapatılır.
- **5 dil:** Türkçe, English, Deutsch, Español, Português. Cihaz diline göre seçilir, Ayarlar'dan değişir. Bilinmeyen dilde İngilizce.
- **Duraklatma** (sağ üst), ilk açılışta 3 adımlık **eğitim**, titreşim ayarı, ilerlemeyi silme (onaylı).
- **Günlük ödül:** 20 DNA + seri başına 10 (en çok 7 seri). **Kuluçka:** sen yokken DNA biriktirir (en fazla 4 saat; hız kazanılan galibiyet, en iyi dalga ve açık çağlarla artar).
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
