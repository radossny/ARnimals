# models/

Miejsce na modele 3D zwierząt:

```
models/lew.glb      models/lew.usdz
models/slon.glb     models/slon.usdz
...
```

Ścieżki wpisuje się dla każdego zwierzęcia w pliku `js/animals.js` w polach
`glb` i `usdz`. Dopóki jest tam `null`, aplikacja używa wbudowanych zastępczych
rysunków SVG.

## Lew – model kreskówkowy z animacją

`lew.usdz` (472 KB, iOS) i `lew.glb` (211 KB, Android) przedstawiają to samo
zwierzę: styl kreskówkowy, duża głowa, duże oczy z błyskami, 9788 trójkątów,
sześć materiałów bez tekstur.

**Animacja w pętli**, 4 sekundy, 12 klatek na sekundę:

| Element | Ruch |
|---|---|
| korpus | oddech, dwa wdechy na pętlę (skala ±3 %) |
| głowa | powolne rozglądanie się na boki (±11°) z lekkim kiwaniem |
| ogon | machanie na boki, trzy razy na pętlę (±24°) |
| uszy | strzyżenie w dwóch momentach, każde ucho osobno |

Pierwsza i ostatnia klatka są identyczne, więc pętla nie skacze.

**Ustawienie w przestrzeni:** wysokość 0,77 m, łapy dokładnie na Y = 0,
jednostki w metrach. Plik GLB jest zwrócony w kierunku −Z (konwencja glTF),
a USDZ obrócony o 180°, ponieważ Quick Look ustawia kamerę po przeciwnej
stronie – dzięki temu lew staje przodem do dziecka.

Model powstał na potrzeby tego projektu, więc nie ma ograniczeń licencyjnych.
W `js/animals.js` włączony jest tylko `usdz`. Aby użyć `lew.glb` na Androidzie,
trzeba najpierw umieścić `model-viewer.min.js` w katalogu `vendor/`.

---
## Sarna – model zewnętrzny

Źródło: **Quaternius**, licencja **CC0** (domena publiczna, bez obowiązku
podawania autora). Oryginał: szkielet z 46 kośćmi, 26 animacji.

Wprowadzone zmiany:

1. **Usunięto animacje nieodpowiednie dla dzieci** – `Death`,
   `Attack_Headbutt`, `Attack_Kick` i obie reakcje na uderzenie. W GLB zostały
   `Idle_2`, `Idle`, `Idle_Headlow`, `Eating`, `Walk`. To nie kosmetyka:
   `<model-viewer>` pozwala przełączać animacje, więc scena śmierci w pliku
   byłaby realnie dostępna.
2. **Usunięto duplikaty** – każda animacja występowała dwa razy, także pod
   nazwą z przedrostkiem `AnimalArmature|`.
3. **Poprawiono skalę** – oryginał miał wysokość 4,3 jednostki. Model jest
   sprowadzony do **1,0 m**, kopyta stoją na Y = 0.
4. **USDZ zapisany jako UsdSkel** – prawdziwy szkielet, nie zapieczone
   wierzchołki. Animacja `Idle_2`, 81 klatek, 24 kl./s, pętla domknięta.

| Plik | Rozmiar | Przeznaczenie |
|---|---|---|
| `sarna.usdz` | 816 KB | iOS AR Quick Look |
| `sarna.glb` | 416 KB | Android (wymaga `vendor/model-viewer.min.js`) |

### Pułapki, na które warto uważać przy kolejnych modelach

**Kierunek.** AR Quick Look ustawia kamerę po stronie **+Z**, więc model musi
patrzeć w +Z. Konwencja glTF jest odwrotna (−Z), dlatego modele własne trzeba
obrócić o 180°, a pobrane – najpierw sprawdzić. Ta sarna patrzyła już w +Z
i obrót był zbędny.

**Przestrzeń szkieletu.** W tym pliku `inverseBindMatrices` **nie** zawierały
transformacji węzłów nadrzędnych, mimo że armatura miała skalę 100 i obrót
Z-up → Y-up. Dlatego `bindTransforms` i `restTransforms` zapisano bez zmian,
a całe przejście do świata trafiło do `xformOp:transform` obejmującego
`SkelRoot`. W innych plikach bywa odwrotnie – warto to sprawdzić liczbowo,
porównując skinning policzony z zapisanych danych z oryginałem.

**Animacja zapieczona w wierzchołkach** (`points.timeSamples`) nie jest
odtwarzana przez Quick Look. Dla modeli ze szkieletem jedyną działającą drogą
jest UsdSkel.
