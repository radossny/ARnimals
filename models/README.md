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
podawania autora). Oryginał zawierał szkielet z 46 kośćmi i 26 animacji.

Wprowadzone zmiany:

1. **Usunięto animacje nieodpowiednie dla dzieci** – `Death`, `Attack_Headbutt`,
   `Attack_Kick`, `Idle_HitReact_Left`, `Idle_HitReact_Right`. W GLB zostały
   tylko: `Idle_2`, `Idle`, `Idle_Headlow`, `Eating`, `Walk`. To nie jest
   kosmetyka: `<model-viewer>` pozwala przełączać animacje, więc obecność
   sceny śmierci w pliku byłaby realnym ryzykiem.
2. **Usunięto duplikaty** – każda animacja występowała dwa razy, także pod
   nazwą z przedrostkiem `AnimalArmature|`.
3. **Poprawiono skalę** – oryginał miał wysokość 4,3 jednostki. Dodany węzeł
   nadrzędny skaluje model do **1,0 m** i stawia kopyta dokładnie na Y = 0.
4. **USDZ** – iOS dostaje animację `Idle_2` „zapieczoną” w wierzchołkach
   (`points.timeSamples`, 20 klatek, 6 kl./s, interpolacja liniowa po stronie
   USD). Model jest obrócony o 180°, bo Quick Look ustawia kamerę po stronie +Z.

| Plik | Rozmiar | Przeznaczenie |
|---|---|---|
| `sarna.usdz` | 2,3 MB | iOS AR Quick Look |
| `sarna.glb` | 416 KB | Android (wymaga `vendor/model-viewer.min.js`) |

USDZ jest duży, bo animacja zapisana w wierzchołkach powtarza całą geometrię
w każdej klatce. Zamiennik – `UsdSkel` – dałby ok. 300 KB, ale jest znacznie
bardziej podatny na błędy zapisu. Model ładuje się dopiero po wybraniu sarny.
