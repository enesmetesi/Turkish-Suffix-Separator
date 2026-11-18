# Turkish Suffix Separator

Türkçe öğrenenler için Chrome eklentisinin ayrıştırıcı çekirdeği. Bir kelimeyi
kökü ve eklerine ayırır, her ekin işlevini İngilizce ve Türkçe etiketle verir.
Tamamen tarayıcı içinde, kural tabanlı çalışır: sunucu ve yapay zekâ yok.

```
gidemeyeceklermiş -> git + eme + yecek + ler + miş
                     (Unable, Fut, A3pl, CopNarr)
```

## Eklentiyi denemek

1. `npm run build` komutu `dist/extension` klasörünü ve Web Store için zip dosyasını üretir.
2. Chrome'da `chrome://extensions` sayfasını aç, sağ üstten **Geliştirici modu**nu aç.
3. **Paketlenmemiş öğe yükle** düğmesiyle `dist/extension` klasörünü seç.
4. Türkçe bir sayfada (ör. bir haber sitesi) farenin bir kelimenin üzerinde durmasını bekle.

Türkçe olmayan sayfalarda kart yalnızca Alt + üzerine gelince açılır. Bu ayar eklenti simgesinden değiştirilebilir.

## Kullanım (kod)

```js
import { createAnalyzer } from './src/index.js';
const analyzer = createAnalyzer(lexiconJson, glossesJson); // data/lexicon.json, data/glosses.json
analyzer.analyze('kitaplarımızdan');
// [{ root: { lemma: 'kitap', pos: 'N', surface: 'kitap' },
//    suffixes: [{ id: 'Pl', surface: 'lar', en: 'plural', tr: 'çoğul' }, ...],
//    score: 3 }]
```

Okumalar en olasıdan en aza sıralıdır. Boş dizi "tanınmadı" demektir.

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm test` | Birim testleri ve `test/words.tsv` listesindeki tüm kelimeleri çalıştırır |
| `npm run report -- --misses` | Doğru okumanın bulunma ve ilk sırada çıkma oranını yazar |
| `node scripts/try.mjs kelime1 kelime2` | Kelimeleri elle denemek için |
| `npm run build` | Eklentiyi `dist/extension` klasörüne ve zip dosyasına paketler |
| `npm run build:lexicon -- <zemberek-nlp yolu>` | `data/lexicon.json` dosyasını Zemberek sözlüğünden yeniden üretir |
| `npm run build:glosses -- <kaikki Turkish .jsonl>` | `data/glosses.json` İngilizce anlamlarını Vikisözlük verisinden üretir |

Node 20 veya üstü gerekir, başka bağımlılık yok.

## Yapı

- `src/phonology.js`: ses uyumu, d/t ve c/ç benzeşmesi, kaynaştırma harfleri, yumuşama
- `src/suffixes.js`: ek listesi, soyut biçimler (`(y)AcAk`, `DAn`...) ve etiketler
- `src/morphotactics.js`: ek sırası kuralları (durum makinesi)
- `src/lexicon.js`: kök sözlüğü ve köklerin yüzey biçimleri (kitap/kitab, ağız/ağz)
- `src/analyzer.js`: ayrıştırıcı ve sıralama
- `src/card.js`: hover kartında gösterilecek satırlar (DOM'suz, test edilebilir)
- `extension/`: manifest, içerik betiği (hover kartı), ayarlar penceresi, simgeler

## Kaynaklar ve lisanslar

Kök sözlüğü [Zemberek NLP](https://github.com/ahmetaa/zemberek-nlp) projesinin
sözlük dosyalarından ve sıklık listesinden üretilmiştir (Apache License 2.0,
telif: Ahmet A. Akın, Mehmet D. Akın). Lisans metni `data/LICENSE-zemberek.txt`
dosyasındadır.

İngilizce anlamlar [Vikisözlük](https://en.wiktionary.org/)'ün Türkçe maddelerinden
[wiktextract](https://kaikki.org/dictionary/Turkish/) ile alınıp tek satıra kısaltılmıştır
(CC BY-SA 4.0, ayrıntılar `data/LICENSE-wiktionary.txt`). Eklentinin ayar penceresinde
ve `licenses.html` sayfasında iki kaynak da gösterilir.
