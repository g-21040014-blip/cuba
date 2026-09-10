# Ujian NFC iPhone

## Cara tag NFC berfungsi

Tulis URL HTTPS berikut ke kad NFC:

`https://DOMAIN-VERCEL-KAU/nfc?kp=NO_KP_12_DIGIT`

Contoh format (gunakan No. KP sebenar hanya ketika menulis kad):

`https://DOMAIN-VERCEL-KAU/nfc?kp=xxxxxxxxxxxx`

Apabila iPhone membaca tag, iOS membuka URL dan halaman `/nfc` memproses `kp` secara automatik.

## Laluan yang disokong

- `/nfc?kp=...`
- `/scanner?kp=...`
- `/?kp=...`
- `/?nfc=...`
- `/?scan=...`

No. KP dipadankan selepas membuang ruang dan sengkang.
