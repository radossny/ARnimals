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
