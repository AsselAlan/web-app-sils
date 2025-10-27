# Script para cargar herramientas MAR desde Excel a Supabase

## Datos procesados de la tabla Excel - Código MAR

Cantidad | Descripción | Marca | Estado Final | Código | Puntuación
---------|-------------|--------|--------------|--------|------------
1 | Cinta metrica de 8 mts. | KLD | REGULAR | MAR001 | 5
1 | Tester de Medicion. | UNI-T | BUENO | MAR002 | 8
1 | Juego llaves allem pulgadas | NO POSEE | NO POSEE | MAR003 | 3
1 | juego llaves allem (mm) | NO POSEE | NO POSEE | MAR004 | 3
1 | juego llaves torx | - | REGULAR | MAR005 | 5
1 | Kit llaves para terminales | - | REGULAR | MAR006 | 5
1 | Punta torx (30mm) | NO POSEE | NO POSEE | MAR007 | 3
1 | Punta para atornilladora (1 philips,3 plano,1 torx,3 allem) | - | REGULAR | MAR008 | 5
1 | Punta de seguridad | HAMILTON | BUENO | MAR009 | 8
2 | Trincheta | - | BUENO | MAR010 | 8
1 | Mechas (13mm, 8,5mm, 6mm, 4mm) | - | BUENO | MAR011 | 8
1 | Crimpadora | NO POSEE | BUENO | MAR012 | 8
1 | Corta caño 22mm,30 mm | - | REGULAR | MAR013 | 5
1 | Pinza de fuerza | - | REGULAR | MAR014 | 5
2 | Alicate | - | REGULAR | MAR015 | 5
1 | Pico loro | NO POSEE | NO POSEE | MAR016 | 3
1 | Boca de perro | STANLEY | MALO | MAR017 | 3
1 | Pinza de punta proskit | EXTRAVIO | NO POSEE | MAR018 | 3
1 | Alicate proskit | EXTRAVIO | NO POSEE | MAR019 | 3
1 | Crimpadora para terminales | - | REGULAR | MAR020 | 5
1 | Destornillador Torx (20mm) | - | REGULAR | MAR021 | 5
1 | Destornillador Torx (25mm) | - | NO POSEE | MAR022 | 3
1 | Destornillador Torx (30mm) | - | BUENO | MAR023 | 8
3 | Destornillador plano | - | BUENO | MAR024 | 8
1 | Destornillador plano perillero | - | BUENO | MAR025 | 8
1 | Destornillador philips perillero | - | BUENO | MAR026 | 8
1 | Destornillador multipunta | - | BUENO | MAR027 | 8
3 | Destornillador philips | - | BUENO | MAR028 | 8
1 | Llave francesa | - | REGULAR | MAR029 | 5
1 | Cricket chico | - | MALO | MAR030 | 3
1 | Cricket grande | EXTRAVIO | NO POSEE | MAR031 | 3
1 | Prolongacion ckiquets grande (208mm,408mm) | - | REGULAR | MAR032 | 5
1 | Lima redonda | EXTRAVIO | NO POSEE | MAR033 | 3
1 | Llave combinada (13,8,9,11,,17,22,14) | - | BUENO | MAR034 | 8
1 | Destornillador multitubos | - | NO POSEE | MAR035 | 3
1 | Juego tubos | - | REGULAR | MAR036 | 5
1 | Masa de goma | - | BUENO | MAR037 | 8
1 | Espatula | - | BUENO | MAR038 | 8
1 | Soldador de estaño electrico 220V | - | REGULAR | MAR039 | 5
1 | Aplicador H-3000 | - | BUENO | MAR040 | 8
1 | Linternas iluminacion | NO POSEE | NO POSEE | MAR041 | 3
1 | atornilladora electrica/con cargador (1 bateria) | - | REGULAR | MAR042 | 5
1 | Punta imantada | EXTRAVIO | NO POSEE | MAR043 | 3
1 | Escalera | - | REGULAR | MAR044 | 5
1 | camilla mecanico | - | BUENO | MAR045 | 8
1 | Soldador de estaño electrico inhalambrico | NO POSEE | NO POSEE | MAR046 | 3
1 | juegos puntas atornilladora bosch | NO POSEE | NO POSEE | MAR047 | 3
1 | traca y cinta | - | REGULAR | MAR048 | 5
1 | lima redonda | EXTRAVIO | NO POSEE | MAR049 | 3
1 | prensa | - | REGULAR | MAR050 | 5
1 | pulverizador | - | MALO | MAR051 | 3
1 | pistola aplicadora teroson | - | MALO | MAR052 | 3
1 | Amoladora angular | HAMILTON | REGULAR | MAR053 | 5
1 | Taladro electrico 220v | - | MALO | MAR054 | 3
1 | copa 32mm | - | REGULAR | MAR055 | 5
1 | copa 22mm | - | NO POSEE | MAR056 | 3
1 | mandril | - | MALO | MAR057 | 3
1 | PISTOLA DE CALOR | - | REGULAR | MAR058 | 5

Total: 58 herramientas MAR

### Criterio para Estado Final:
- Se tomó el último estado mencionado en cada fila
- EXTRAVIO → NO POSEE → FALTANTE (estado 3)
- NO POSEE → FALTANTE (estado 3)
- BUENO → BIEN (estado 8) 
- REGULAR → REGULAR (estado 5)
- MALO → MAL (estado 3)
