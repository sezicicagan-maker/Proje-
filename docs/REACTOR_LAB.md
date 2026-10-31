# Reactor Lab: mimari ve kararlar (v4)

Eğitim amaçlı, tek dosyalık HTML5 nükleer reaktör simülatörü. Yayın: `/reactor/` (ve eski bağlantı `/rbmk/`).

## Kaynak düzeni
| Dosya | İçerik |
|---|---|
| `games/rbmk-sim/model.js` | Fizik: nokta kinetik (tek gecikmiş grup, örtük Euler), I-135/Xe-135 (zaman ×300), Doppler, buhar boşluğu, çubuk S-eğrisi/ORM, türe özgü: RBMK pozitif boşluk + pozitif scram + sıkışma, PWR bor + moderatör sıcaklığı + Tavg programı, BWR debi ile güç, CANDU güçlü ksenon. Regülatörler (OTOMATİK), geri çekme, kapatma ve yeniden başlatma. Node'da `require` edilebilir. |
| `src/shell.html` | HTML iskeleti ve tüm CSS (dikey ve yatay yerleşim, ekranlar, animasyonlar, `html.rm` azaltılmış hareket). |
| `src/js/01-core.js` | Kayıt (localStorage, doğrulamalı), dil seçimi, `t()` (çoğul nesneleri `Intl.PluralRules` ile), `nf()` sayı biçimi, sahte dil. |
| `src/js/02-audio.js` | Ses efektleri, güçle değişen reaktör uğultusu, çubuk motoru, titreşim. |
| `src/js/03-draw-common.js` | Canvas yardımcıları (sığdır, sar, "…" ile kes), ipucu bölgeleri, panel çerçevesi, kadran, lamba, açılış animasyonu, santral şeması kaydı `PLANT` ve `H` yardımcıları. |
| `src/js/04-plant-<tür>.js` | Türe özgü animasyonlu santral şemaları (158×146 yerel kutu). |
| `src/js/05-panels.js` | Yerleşim (dikey 360×520-640, yatay 720×480-580) ve paneller. |
| `src/js/06-controls.js` | Kaydırıcılar, düğmeler, koruma/limit çipleri, kapaklı kapatma düğmesi, yeniden başlatma, klavye, metni sığdırma. |
| `src/js/07-screens.js` | Menü, reaktör seçimi, brifing, duraklatma, ayarlar, aramalı dil seçici, yardım, ipucu kartı, vardiya raporu. |
| `src/js/08-sim.js` | Senaryolar, koruma sistemi v2, ağır çekim, puanlama, olay günlüğü, rapor verisi. |
| `src/js/09-loop.js` | Kare döngüsü, alarm bipleri, boyutlandırma, dokunma, açılış, test kancaları (`window.__RB_TEST__`). |
| `i18n/*.json`, `i18n/_meta.json` | 21 dil. |

Derleme `node scripts/build-rbmk.js` modülleri dosya adı sırasıyla tek bir IIFE içinde birleştirir ve sözdizimini denetler.

## Koruma sistemi v2 (neden ve nasıl)
v3'te otomatik kapatma oyuncuyu haksız yere cezalandırıyordu (ölçüldü): PWR Eğitim'de 12/12 koşuda 76. saniyede kendiliğinden kapanma, normal eğitimde gereksiz ağır çekim, BWR/CANDU serbest modda ilk müdahalede kapanma ve kapatmanın vardiyayı bitirmesi.
- Kademeler: UYARI (periyot < `alertPer`) → GERİ ÇEKME (periyot < `stepPer`, güç > `stepN` ya da düşük debi; çubuklar içeri, PWR'de türbin yükü düşer, OTOMATİK hedef %10 iner) → KAPATMA (Tam modda periyot < `tripPer` 0,5 sn, güç > `tripN` 0,8 sn, düşük debi 2 sn; Yardımcı modda yalnız aşırı durumlarda).
- Kapatma vardiyayı bitirmez; çubuklar tamamen girince SIFIRLA ile devam edilir. PWR'de kapatmada türbin düşer (yük 0) ve buhar boşaltma Tavg'ı yüksüz değerde tutar.
- Ağır çekim yalnız gerçek sıçramada (periyot < `tripPer`×1,2, ρ > 0,8 $ ya da güç > 3× hedef).
- Bot ölçümü (`tests/tools/trips.js`, tür × senaryo × 12 koşu): Eğitim ve Manevra'da 0 kapatma, 0 ağır çekim; Yardımcı modda rastgele müdahaleli serbest oyunda patlama 0.

## Çok dillilik
- Eksik anahtar İngilizceye düşer ve `MISSING` kümesine yazılır; `?lang=pseudo` uzatılmış sahte metinle taşmaları ortaya çıkarır.
- `scripts/i18n-check.js`: anahtar eşitliği, `{0}` yer tutucuları, yerel ayarın tüm CLDR çoğul kategorileri, İngilizce kalmış metinler, alfabe uyumu, dar alan uzunlukları.
- `scripts/i18n-qa.js <dil>`: telefon (360×640) ve masaüstünde tüm ekranları gezip DOM taşmalarını ve canvas'ta 7 px altına küçülen ya da kesilen metinleri raporlar. Düğmeler ve etiketler `fitEl` ile kutularına sığdırılır.
