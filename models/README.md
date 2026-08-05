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

## Model testowy

`lew.glb` i `lew.usdz` to wygenerowany model zastępczy (low-poly, 3044 trójkąty,
wysokość 1,08 m, stopy na Y = 0, zwierzę patrzy w kierunku −Z). Powstał na
potrzeby tego projektu, więc nie ma żadnych ograniczeń licencyjnych.

W `js/animals.js` włączony jest tylko `usdz`, bo ścieżka AR Quick Look na iOS
nie wymaga żadnej biblioteki. Aby użyć `lew.glb` na Androidzie, trzeba najpierw
umieścić `model-viewer.min.js` w katalogu `vendor/` i dopiero potem wpisać
`glb: 'models/lew.glb'`.
