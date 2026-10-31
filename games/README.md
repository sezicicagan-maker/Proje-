# Yeni oyunlar

| Oyun | Durum | Not |
|---|---|---|
| `core-shift/` | Prototip hazır, test geçiyor | Kurgusal reaktör vardiyası: gücü şehrin talebine uydur, ısıyı yeşilde tut. Gerçek bir olay/marka yok. |

Testler: `node tests/coreshift.js` (arayüz), `node tests/coreshift-sim.js` (bot denge ölçümü).
Yayın: `Web yayın` iş akışı oyunu `https://<kullanıcı>.github.io/Proje-/core-shift/` adresine koyar.
| `rbmk-sim/` | Prototip hazır, test geçiyor | RBMK tipi reaktör **eğitim simülatörü**: nokta kinetik, Xe-135/I-135 zinciri, pozitif buhar boşluğu katsayısı, 0,4 m/sn çubuk hızı, ORM, grafit uçlu çubukların pozitif scram etkisi, kanal deformasyonunda çubuk sıkışması. Sayılar basitleştirilmiş yaklaşıklardır. v2: tasarım yenilendi (dokulu paneller, kadranlar, LCD), ksenon yüzde göstergesi, ORM 15 kilidi, otomatik AZ-5 korumaları, güç sıçramasında ağır çekim, AZ-5 kapaklı düğme, "nasıl çalışır" ekranı. |

`rbmk-sim/index.html` üretilir: `node scripts/build-rbmk.js`. Test: `node tests/rbmk.js`. Yayın adresleri: `/reactor/` ve `/rbmk/`.

## Reactor Lab (`rbmk-sim/`, v4)
- **4 reaktör türü:** RBMK-1000 (pozitif boşluk, yavaş çubuk, pozitif scram, çubuk sıkışması), PWR (borik asit, negatif moderatör katsayısı, Tavg programı), BWR (gücü devridaim debisi belirler, OTOMATİK pompaları sürer), CANDU (hızlı kapatma, güçlü ksenon zehirlenmesi).
- **Senaryolar:** Eğitim, Güç Manevrası (tüm türler), Test (yalnız RBMK, 1986 tarzı), Serbest mod. Her senaryodan önce brifing (hedef, yıldız ölçütü, türe özgü ipuçları); sonunda vardiya raporu (KPI'lar, güç/talep grafiği, olay günlüğü, "ne oldu" açıklamaları).
- **Koruma sistemi v2:** UYARI (kısa periyot lambası ve bip) → GERİ ÇEKME (çubuklar otomatik içeri, PWR'de türbin geri çekmesi) → KAPATMA. Modlar: Tam / Yardımcı (varsayılan; kapatma yalnız aşırı tehlikede) / Kapalı. Kapatma artık vardiyayı bitirmez: çubuklar tamamen girince YENİDEN BAŞLAT (SIFIRLA). Periyot koruması düşük güçte de çalışır.
- **7 dil (tam):** İngilizce, Türkçe, Almanca, İspanyolca, Portekizce, Fransızca, Rusça (`i18n/<kod>.json`). `i18n/_meta.json` 21 dili tanımlar (ad, yerel ayar, yön, alfabe); dosyası eklenen dil otomatik olarak oyuna girer (it, pl, uk, nl, cs, ro, sv, id, vi, ar, hi, ja, ko, zh hazır bekliyor). Cihaz diline göre açılır, `?lang=xx` ile zorlanabilir, Ayarlar'da aramalı seçici. `Intl` ile sayı/yüzde biçimi ve çoğul kuralları, Arapça için sağdan sola, alfabe başına yazı tipi yığını, yardım kartlarında İngilizce terim. `?lang=pseudo` sahte dil (eksik çeviri ve taşma avı).
- **Arayüz:** telefonda dikey, geniş ekranda yatay yerleşim (çekirdek + santral şeması yan yana, sağda kontrol sütunu ve senaryo kartı). Panellerde ⓘ ipuçları, çekirdek ⇄ santral görünümü, kaydırıcılarda gerçek değer işareti, klavye kısayolları, bölümlü ayarlar (Dil, Ses, Oynanış, Görünüm, Veri, Hakkında).
- **Animasyonlar:** ekran geçişleri ve sıralı giriş, panel açılış animasyonu, akıcı ibreler ve LCD, alarm yanıp sönmesi, kapatmada sarsıntı ve flaş, ağır çekim uyarısı, yıldız patlaması, sayı sayacı, grafik çizimi; "hareketi azalt" ayarına ve sistem tercihine uyar.
- **Kaynak:** `src/shell.html` (HTML/CSS) + `src/js/NN-*.js` (modüller, tek kapsamda birleştirilir) + `model.js` (fizik) + `i18n/*.json`. Derleme: `node scripts/build-rbmk.js` (seçenekler: `--out <dosya>`, `--langs en,tr`, `--plant <tür>`).
- **Araçlar:** `node scripts/i18n-check.js [dil]` (anahtar, yer tutucu, çoğul denetimi), `node scripts/i18n-qa.js <dil> [klasör]` (telefon ve masaüstünde tüm ekranlarda taşma QA'sı), `node tests/tools/trips.js [assist|full|off]` (koruma botu), `node tests/tools/plant-preview.js <tür> <klasör>` (santral şeması önizleme).
