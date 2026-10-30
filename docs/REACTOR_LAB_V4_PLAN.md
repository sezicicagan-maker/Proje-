# Reactor Lab v4: yarım kalan iş (devir notu)

Bu dal (`claude/reactor-lab-v4-wip`) yayındaki v3'ü bozmamak için ayrı tutuldu. Yayındaki sürüm `claude/oyun-fikri` dalındadır (web: `/reactor/`).

## Kullanıcı istekleri
1. "Otomatik kapatma kötü, arayüz çok daha iyi olabilir, dil özellikleri ekle, çok ama çok iyi olsun."
2. "Animasyonlar ekle, genel arayüzü ve ayar kısmını değiştir, çok ama çok iyi olsun."
3. "Şimdilik durdur, yarın sabah yapacağız."

## Teşhis: otomatik kapatma gerçekten bozuktu (ölçüldü)
`tests/tools/trips.js` ile, oyuncu müdahalesi olmadan / insan benzeri rastgele müdahalelerle, tür x senaryo başına 12 koşu:
- **PWR Eğitim: 12/12 koşuda t=76 sn'de kendiliğinden kapanma.** Yük basamağında (0,7 → 1,0) güç 1 sn'de %39 sıçrıyor (ısıl kapasite ~12x küçüktü + basamak yük) ve hem "kısa periyot < 3 sn" hem "güç > %109" eşiği aşılıyor. Senaryo geçilemez.
- **Ağır çekim normal eğitimde tetikleniyor:** RBMK 11/12, PWR 12/12, CANDU 12/12 (periyot < 15 sn eşiği, otomatik yük artışında bile aşılıyor).
- **BWR/CANDU serbest modda ilk müdahalede kapanma:** BWR nominal debi 0,9 iken kaydırıcı 1,1'e çıkınca güç 1,22 > 1,2 eşiği.
- Kapatma **nihai:** tetiklenince vardiya bitiyor, geri dönüş yok.

## Modelde yapılanlar (bu dalda `games/rbmk-sim/model.js`)
- Tür başına kademeli koruma eşikleri `T.prot` = `{alertPer, stepPer, tripPer, stepN, tripN, lowFlow, lowFlowN}` (eski `tripN/tripPer/tripFlow` kalktı).
- `s.stepback` (çubuk geri çekme: içeri sürer, hız 1,6x; BWR'de debiyi de düşürür), `s.trips` sayacı, `M.resetTrip(s)` (kapatma sonrası devam).
- **PWR:** kT 16, tauF 8, `dSlew` 0,04 (yük hedefi `s.Dset` → kaydırılmış `s.D`), orantılı hızlı regülatör (bang-bang yerine, `autoGain 2`, `autoDead 0.25`, vRod 0,06). Tarama: Eğitim %100, Manevra %100, aşım ≤ %16, en kısa periyot ≥ 8 sn. (kT 3 ve altı **salınım yapıyordu**.)
- **BWR:** nominal debi 1,0; AUTO artık **debiyi** sürer (`T.actuator = 'flow'`), çubuklar elle kalır.
- `T.actuator`, `flowMin/flowMax` eklendi.
- UYARI: eski arayüz (`template.html`, üretilen `index.html`) `T.tripN/T.tripPer/T.tripFlow` kullanıyordu; bu dalda yeni modelle **derlenmemeli**. Fizik testlerinde (`tests/rbmk.js`) `s.D = ...` atamaları `s.Dset = ...` olmalı; BWR manevra botu nominal debi 1,0'a göre güncellenmeli.

## Koruma sistemi v2 tasarımı (yapılacak, arayüz tarafı)
- Kademeler: **UYARI** (lamba + bip: periyot < alertPer) → **GERİ ÇEKME** (stepback: periyot < stepPer ya da güç > stepN) → **KAPATMA** (yalnız gerçek tehlike: periyot < tripPer 0,5 sn süreyle ya da güç > tripN 0,8 sn süreyle, düşük debi + yüksek güç 2 sn).
- Ayarlardan mod: **Tam / Yardımcı (varsayılan: uyarı + geri çekme, kapatma yok) / Kapalı**. Oyun içinde ayrı çip: PROT ve ÇUBUK LİMİTİ (kilit). Düşürmek onay ister. Test senaryosunda "devre dışı bırak" tarihsel hatayı yeniden yaşatır (`bypassUsed`).
- Kapatma sonrası **YENİDEN BAŞLAT** düğmesi (çubuklar tamamen içerideyken); Eğitim/Manevra/Serbest'te vardiya **bitmez** (kapatma sonrası otomatik bitirme yalnız Test'te). Yıldız: hedefte kalma yüzdesi, kapatma sayısı raporda.
- Ağır çekim yalnız gerçek sıçramada: `periyot < tripPer*1,2` ve `n > 0,05`, ya da `ρ > 0,8 $`, ya da `n > 3 x hedef`.
- Serbest mod varsayılanı: AUTO açık, hedef = mevcut güç.

## Çeviri altyapısı (kısmen hazır)
- `games/rbmk-sim/i18n/*.json`: en, tr, de, es, pt, fr, ru (her biri 176 anahtar) + `_meta.json` (21 dil: + it pl uk nl cs ro sv id vi ar hi ja ko zh; ad, locale, dir, script).
- Yapılacak: derleme betiği (JSON → `T`/`LANGS`), `scripts/i18n-check.js` (anahtar eşitliği, `{0}` yer tutucu, çoğul kategorileri, uzunluk oranı), `scripts/i18n-qa.js` (Playwright: her dil x ekran için DOM taşması ve canvas `fitTxt` küçülmesi < 7 px), sahte dil (`?lang=pseudo`), `Intl` sayı biçimi ve çoğul (`Intl.PluralRules`), RTL (Arapça: `dir=rtl`, canvas yerleşimi LTR kalır), dil başına yazı tipi yığını, `?lang=xx` URL parametresi, yardım kartlarında İngilizce terim.
- Ortamdaki yazı tipleri (ekran görüntüsüyle doğrulama için): Inter (Latin/Kiril), DejaVu (Arapça), WenQuanYi Zen Hei (CJK), FreeSans (Devanagari).

## Arayüz v4 kararları
- Modüler kaynak: `src/shell.html` + `src/js/*.js`, `scripts/build-rbmk.js` birleştirir (`template.html` emekli).
- **Dikey (telefon)** 360x(520-640) ve **yatay (masaüstü)** 720x470 yerleşim; paneller dikdörtgen tabanlı (tasarım boyutu + `place(rect, dw, dh)` ile ölçeklenir). Yatay yerleşimde çekirdek ve santral şeması ayrı paneller; dikeyde çekirdek/santral geçişi.
- Kontrol düzeni 3 satır (tüm türlerde aynı): Hedef/Yük, Çubuklar, Debi/Bor. Kaydırıcıda **gerçek değer işareti** (hedef kaydırıcıda, gerçek değer çizgi olarak). Otomatik hangi aktüatörü sürerse onun kaydırıcısı kilitlenir (BWR: debi).
- Senaryo **brifingi**, panel **ipuçları** (? simgesi, canvas hit-region), **vardiya raporu** (güç/talep grafiği, olay zaman çizelgesi), **klavye kısayolları**, 3 satırlı kontrol, büyük yazı seçeneği.
- **Animasyonlar:** ekran geçişleri (kayma/solma), kart girişi, yıldız patlaması, sayıların akıcı değişimi, alarm yanıp sönme, kapatma/sıçrama efektleri, çekirdek parıltısı, kabarcık/buhar, santral şemasında akan borular ve dönen türbin, çubuk hareket göstergesi; `prefers-reduced-motion` ve "hareketi azalt" ayarına saygı.
- **Ayarlar** bölümlü: Dil (21 dil, aramalı seçici), Ses (ana, ses düzeyi, ortam uğultusu, titreşim), Oynanış (koruma modu, ağır çekim, ipuçları), Görünüm (birim, yazı boyutu, hareketi azalt, flaş), Veri (ilerlemeyi sıfırla), Hakkında.

## Planlanan iş akışları (Workflow, ultracode)
1. **Santral şemaları:** 4 paralel ajan (`PLANT.rbmk/pwr/bwr/candu`), 170x168 yerel kutuda, ortak yardımcılarla; durum başına (tam güç, %40, kapatılmış, yüksek boşluk) ekran görüntüsüyle doğrulama.
2. **Çeviri:** 14 yeni dil + 6 mevcut dilin yeni anahtarları; her dil için çevirmen ajan, ardından bağımsız gözden geçiren ajan; denetim ve taşma QA betikleriyle doğrulama. (İngilizce ana metin dondurulduktan sonra.)
3. **İnceleme paneli:** ekran görüntülerine dayalı tasarım eleştirmenleri (mobil, masaüstü, uzun diller, Arapça RTL) ve kod gözden geçirenler (fizik, durum makinesi, i18n); doğrulanmış bulgular düzeltilir.

## Yarın ilk adımlar
1. `git checkout claude/reactor-lab-v4-wip`; `node tests/rbmk.js` (yeni modelle bazı fizik testleri `s.Dset` için güncellenecek).
2. Görev listesi sırası: koruma v2 (arayüz) → çeviri altyapısı → arayüz v4 + animasyonlar + ayarlar → workflow'lar → son testler ve yayın.
3. Kullanıcıdan teyit: "otomatik kapatma" şikâyeti yukarıdaki teşhisle örtüşüyor mu; varsayılan koruma modu (Yardımcı) uygun mu; dil listesi (21) uygun mu.
