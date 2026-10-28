# Testler

Gereksinim: `npm i -D playwright` (ve bir kez `npx playwright install chromium`). Çıktılar (ekran görüntüleri) `tests/out/` altına yazılır.

| Dosya | Ne sınar |
|---|---|
| `test3.js` | Genel akış: diller, eğitim, duraklatma, günlük ödül, kuluçka, sıfırlama, laboratuvar, denge simülasyonu |
| `test4.js` | Sonsuz mod, başarımlar, grafik kalitesi, konfeti |
| `test5.js` | 6 çağın dengesi, Boss Akını, Günlük Meydan Okuma kuralları, mod seçici |
| `test6.js` | 16 mutasyon, boss yetenekleri, Teraryum |
| `test7.js` | **Güvenlik:** kayıt kurcalama, düşmanca kayıt, saat geri alma, çökme kurtarma |
| `test8.js` | **Üretim derlemesi** (`npm run build:www` sonrası `www/`): kanca yok, CSP ihlali yok, dış ağ yok |
| `test9.js` | **Düğme animasyonları:** her düğme türü kendi animasyonu/parçacığı, ekran geçiş yönleri, azaltılmış hareket |
| `test10.js` | **Günlük görevler + seviye:** 3 farklı görev, ilerleme, tek seferlik ödül, kurcalama sınırları, gün sıfırlama |
| `monkey.js` | Rastgele dokunma/sürükleme/tıklama ile hata avı: `node tests/monkey.js <tohum> <eylem sayısı>` |
| `bal.js` | Çağ başına zorluk ölçümü (bot) |

Oyunun test kancaları yalnızca sayfa yüklenmeden önce `window.__EVO_TEST__ = true` verilirse açılır. Üretim derlemesinde hiç yoktur.
Örnek: `node tests/test7.js`
