# CrazyGames gönderim paketi (Basic Launch)

Yüklenecek dosya: **`store/web/index.html`** (TEK dosya, yazı tipleri gömülü, ~185 KB, dış bağlantı yok). Portal zip kabul etmiyor; bu dosyayı doğrudan yükleme alanına bırak. Yeniden üretmek için: `npm run build:www && node scripts/build-single.js`. (`evolute-web.zip` ve `www/` klasörü de duruyor ama portal zip kabul etmiyor.)
**Kayıt sorusu:** "Yes, using LocalStorage" seç (oyun localStorage kullanıyor).
Yeniden üretmek için: `npm run build:www` ve `www/` klasörünü zip'le.

## Oyun bilgileri (portala yapıştır, İngilizce)
**Title:** Evolute: Merge & Evolve
**Description:**
Merge matching creatures to evolve them into stronger forms. Each creature attacks the enemies in its own lane, so where you merge matters. Survive 10 waves per era, pick one of 16 roguelite mutations every few waves and beat a unique boss in each of 6 worlds. Includes Story, Endless, Boss Rush and a Daily Challenge, plus a Terrarium for the species you discover. Short runs, no login needed.
**Controls:** Mouse or touch: drag a creature onto another one with the same element and number to merge. Click the Spawn button to bring a new creature. Tap the buttons at the bottom to change speed or sound, top right to pause.
**Categories/tags (öneri):** Puzzle, Strategy, Merge, Idle, Tower Defense, Roguelite
**Languages:** English, Türkçe, Deutsch, Español, Português (cihaz diline göre otomatik)

## Görseller
Portalın istediği kapak boyutlarını yükleme sayfasında gör, bana yaz; `store/` altındaki `feature-1024x500-en.png`, `icon-512.png` ve `screenshots/en-*.png` dosyalarından o boyutlara uygun üretirim.

## Sonra (Full Launch seçilirse)
SDK + reklamlar (CrazyGames'in kendi SDK'sı), "doğrudan oyunda başla" kuralı, hesaba bağlı ilerleme. Belgeler: https://docs.crazygames.com
