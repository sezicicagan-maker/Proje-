# Web yayını ve oyun siteleri (Play'den önce gelir toplamak için)

## 1. Web sürümünü yayınla (ücretsiz, GitHub Pages)
1. GitHub > Actions > **Web yayın** > Run workflow (dal: `claude/oyun-fikri`).
2. Bitince: Settings > Pages > Source: **Deploy from a branch** > Branch: `gh-pages` / `(root)` > Save.
3. Adres: `https://<kullanıcı>.github.io/Proje-/`. Telefonda açılır, "Ana ekrana ekle" ile uygulama gibi durur.
Not: Ücretsiz hesapta Pages yalnızca **herkese açık** depoda çalışır. Oyun zaten tarayıcıya gönderilen bir dosya, gizli sır içermiyor (bkz. `docs/GUVENLIK.md`).

## 2. HTML5 oyun siteleri (reklam payı ile kazanç)
Başvuru sırası (şartları ve gelir payını her sitenin resmî sayfasından doğrula; değişebilir):
1. **CrazyGames** (geliştirici portalı, ücretsiz gönderim)
2. **Poki** (seçici, kalite ister)
3. **Y8 / GameDistribution** (daha kolay kabul)
4. **itch.io** (ücretsiz yükle, isteğe bağlı bağış/ödeme)

Her sitenin kendi reklam kodu (SDK) oyuna eklenir; reklamı site gösterir. Onay çıkınca hangi SDK isterse eklenir (bana söyle).
Gönderimde gerekenler: oyun linki veya zip (`www/` klasörü), 512 ve 1280x720 görseller (`store/`), kısa açıklama (`store/listing.md`).

## 3. 25 $ toplanınca
Play Console hesabı aç, `store/CHECKLIST.md` adımlarını izle.
