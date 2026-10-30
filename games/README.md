# Yeni oyunlar

| Oyun | Durum | Not |
|---|---|---|
| `core-shift/` | Prototip hazır, test geçiyor | Kurgusal reaktör vardiyası: gücü şehrin talebine uydur, ısıyı yeşilde tut. Gerçek bir olay/marka yok. |

Testler: `node tests/coreshift.js` (arayüz), `node tests/coreshift-sim.js` (bot denge ölçümü).
Yayın: `Web yayın` iş akışı oyunu `https://<kullanıcı>.github.io/Proje-/core-shift/` adresine koyar.
| `rbmk-sim/` | Prototip hazır, test geçiyor | RBMK tipi reaktör **eğitim simülatörü**: nokta kinetik, Xe-135/I-135 zinciri, pozitif buhar boşluğu katsayısı, 0,4 m/sn çubuk hızı, ORM, grafit uçlu çubukların pozitif scram etkisi, kanal deformasyonunda çubuk sıkışması. Sayılar basitleştirilmiş yaklaşıklardır. v2: tasarım yenilendi (dokulu paneller, kadranlar, LCD), ksenon yüzde göstergesi, ORM 15 kilidi, otomatik AZ-5 korumaları, güç sıçramasında ağır çekim, AZ-5 kapaklı düğme, "nasıl çalışır" ekranı. |

`rbmk-sim/index.html` üretilir: `node scripts/build-rbmk.js` (model.js + template.html). Test: `node tests/rbmk.js`. Yayın adresi: `/rbmk/`.
