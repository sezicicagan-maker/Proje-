# Tanı araçları (Reactor Lab)

| Dosya | Ne yapar |
|---|---|
| `trips.js` | Her tür x senaryo için insan benzeri rastgele müdahalelerle otomatik kapatma / ağır çekim sıklığını ölçer. Eski (v3) arayüz kancalarını kullanır (`__rb.initScenario`, `tick`), v4'e uyarlanmalı. |
| `pwrtune.js` | PWR ısıl dinamik ve regülatör parametre taraması (kT, çubuk hızı, kazanç, yakıt gecikmesi). Seçilen: kT 16, vRod 0.06, autoGain 2, tauF 8. |
| `dbg-period.js` | Modelde (Node) yük basamağında periyot, reaktivite ve ilk kısa periyot anını izler. |
| `dbg-slowmo.js` | Tarayıcıda ağır çekimi ilk tetikleyen koşulu bulur. |
