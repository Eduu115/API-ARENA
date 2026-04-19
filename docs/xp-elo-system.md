# API Arena — Sistema de XP y ELO

## Resumen

API Arena utiliza dos sistemas de progresion independientes:

- **XP (Experience Points)**: Progresion acumulativa y constante. Siempre se gana XP al completar un challenge, aunque la cantidad varia segun si es la primera vez, si se mejora la nota, o si se repite sin mejorar.
- **ELO (Rating competitivo)**: Sistema dinamico tipo Elo (como CS:GO, ajedrez). No es acumulativo: sube y baja segun el rendimiento del jugador respecto a lo esperado para su nivel. Requiere un minimo de 3 challenges completados para clasificarse.

---

## XP — Experience Points

### Filosofia

La XP es una recompensa constante por participar y completar retos. Varia poco entre dificultades para que la progresion sea predecible y no dependa exclusivamente de hacer solo retos dificiles.

### XP base por dificultad (campo `xp_reward` en cada challenge)

| Dificultad | xp_reward |
|---|---|
| EASY | 150 |
| MEDIUM | 200 |
| HARD | 250 |
| EXPERT | 350 |

### Formulas de calculo

Se calcula `scoreRatio = totalScore / 1000` (nota obtenida normalizada entre 0 y 1).

**Caso 1 — Primera vez completando el challenge:**

```
xpEarned = floor(xp_reward * scoreRatio)
```

Ejemplo: Challenge MEDIUM (xp_reward=200), score 850/1000 -> `floor(200 * 0.85)` = **170 XP**

**Caso 2 — Repite y mejora su nota anterior:**

```
improvement = (nuevoScore - mejorScoreAnterior) / 1000
xpEarned = floor(xp_reward * improvement * 0.8)
```

Se otorga XP proporcional a cuanto mejoro, con un factor de 0.8 (80% del valor de la mejora).

Ejemplo: Mejora de 700 a 850 en MEDIUM -> `improvement = 0.15`, `floor(200 * 0.15 * 0.8)` = **24 XP**

**Caso 3 — Repite SIN mejorar su nota:**

```
xpEarned = max(1, floor(xp_reward * 0.02))
```

Recibe un 2% del xp_reward como minimo simbolico. La intencion es que repetir sin mejorar no sea rentable.

Ejemplo: MEDIUM sin mejorar -> `max(1, floor(200 * 0.02))` = **4 XP**

### Nivel (Level)

El nivel se recalcula automaticamente a partir del XP total acumulado con la formula:

```
level = floor((1 + sqrt(1 + 8 * totalXP / 300)) / 2)
```

Tabla de niveles resultante:

| Nivel | XP acumulada necesaria |
|---|---|
| 1 | 0 |
| 2 | 300 |
| 3 | 900 |
| 4 | 1,800 |
| 5 | 3,000 |
| 6 | 4,500 |
| 7 | 6,300 |
| 8 | 8,400 |
| 9 | 10,800 |
| 10 | 13,500 |

---

## ELO — Rating competitivo

### Filosofia

El ELO representa la habilidad real del jugador. No es acumulativo: sube cuando el jugador rinde por encima de lo esperado y baja cuando rinde por debajo. Las dificultades bajas (EASY) no afectan al ELO. A mayor dificultad, mayor impacto en el ELO.

### Requisito minimo

Se necesitan **3 challenges unicos completados** para obtener un ranking de ELO. Antes de eso, el jugador aparece como **"Unranked"** (Sin clasificar).

### Dificultades que NO contribuyen

| Dificultad | Contribuye al ELO |
|---|---|
| EASY | No |
| MEDIUM | Si |
| HARD | Si |
| EXPERT | Si |

### Rating de challenge por dificultad

Cada dificultad tiene un "rating de challenge" interno que se usa en la formula, equivalente al rating del oponente en ajedrez:

| Dificultad | Challenge Rating |
|---|---|
| EASY | 800 |
| MEDIUM | 1,200 |
| HARD | 1,600 |
| EXPERT | 2,000 |

### Multiplicador de impacto por dificultad

Ademas del rating, cada dificultad tiene un multiplicador que amplifica el cambio de ELO:

| Dificultad | Multiplicador |
|---|---|
| EASY | x0.0 (sin efecto) |
| MEDIUM | x1.0 (base) |
| HARD | x1.4 (+40%) |
| EXPERT | x1.8 (+80%) |

### Formula de calculo

```
expected = 1 / (1 + 10^((challengeRating - userELO) / 400))
actual = totalScore / 1000
eloChange = round(K * multiplicador * (actual - expected))
```

Donde:

- `expected` es la probabilidad esperada de que el jugador obtenga una puntuacion perfecta, calculada a partir de la diferencia entre su ELO y el rating del challenge.
- `actual` es la nota real obtenida normalizada (0 a 1).
- `K` es el factor de sensibilidad:
  - **K = 48** durante los primeros 10 challenges completados (periodo de calibracion).
  - **K = 32** a partir del challenge 11 (periodo estable).
- `multiplicador` es el multiplicador de dificultad de la tabla anterior.

### Como interpretar la formula

- Si `actual > expected` -> el jugador rindio mejor de lo esperado -> **ELO sube**.
- Si `actual < expected` -> el jugador rindio peor de lo esperado -> **ELO baja**.
- Si `actual == expected` -> rendimiento exacto al esperado -> **ELO no cambia**.

### Repeticiones y rendimiento muy malo (submission-service)

Ademas de la formula base, el backend aplica:

1. **Penalizacion por regresion en el mismo challenge**: si no es la primera completion y la nota es **inferior a tu mejor nota previa** en ese challenge, se resta ELO extra (proporcional a cuanto empeoras respecto a ese mejor intento). Asi repetir y hacerlo peor **si** impacta el rating.

2. **Anti-cero al quedar por debajo de lo esperado**: si `actual < expected` pero el redondeo del termino principal daria **0**, se aplica una **perdida minima** para que siempre haya algo de ELO en contra cuando rindes por debajo de lo esperado.

3. **Rendimiento muy bajo** (`actual` por debajo de ~0,32): penalizacion adicional acorde a lo lejos que estas de ese umbral (sigue valiendo en reintentos).

4. **Tope de seguridad** por envio: el cambio de ELO de una sola submission no baja de **-90** puntos en un unico paso.

### Ejemplos practicos

**Ejemplo 1: Jugador con ELO 1400 hace un challenge MEDIUM (rating 1200)**

```
expected = 1 / (1 + 10^((1200-1400)/400)) = 1 / (1 + 10^(-0.5)) = 0.76
```

Se espera que saque ~760/1000. Si saca 800:
```
eloChange = round(32 * 1.0 * (0.8 - 0.76)) = round(32 * 0.04) = +1
```

Si saca 600 (peor de lo esperado):
```
eloChange = round(32 * 1.0 * (0.6 - 0.76)) = round(32 * -0.16) = -5
```

**Ejemplo 2: Jugador con ELO 1400 hace un challenge HARD (rating 1600)**

```
expected = 1 / (1 + 10^((1600-1400)/400)) = 1 / (1 + 10^(0.5)) = 0.24
```

Se espera que saque ~240/1000. Si saca 850:
```
eloChange = round(32 * 1.4 * (0.85 - 0.24)) = round(44.8 * 0.61) = +27
```

Si saca 200 (justo lo esperado):
```
eloChange = round(32 * 1.4 * (0.2 - 0.24)) = round(44.8 * -0.04) = -2
```

**Ejemplo 3: Jugador con ELO 1400 hace un challenge EASY**

```
eloChange = 0 (los EASY no contribuyen al ELO)
```

### ELO base

Todos los usuarios comienzan con un ELO base de **1000**. Durante el periodo de calibracion (primeras 10 entregas), el K-factor mas alto (48) permite que el ELO converja rapidamente al nivel real del jugador.

---

## Resumen de campos en base de datos

### Tabla `users`

| Campo | Tipo | Descripcion |
|---|---|---|
| rating | INTEGER (default 1000) | ELO actual del usuario |
| level | INTEGER (default 1) | Nivel calculado a partir del XP |
| experience_points | INTEGER (default 0) | XP total acumulada |
| total_challenges_completed | INTEGER (default 0) | Numero de challenges unicos completados |

### Tabla `challenges`

| Campo | Tipo | Descripcion |
|---|---|---|
| xp_reward | INTEGER (default 200) | XP base que otorga el challenge |
| difficulty | VARCHAR | EASY, MEDIUM, HARD o EXPERT |

### Tabla `submissions` (campos de recompensa)

| Campo | Tipo | Descripcion |
|---|---|---|
| xp_earned | INTEGER | XP ganada en esta entrega |
| elo_change | INTEGER | Cambio de ELO (positivo o negativo) |
| previous_best_score | DECIMAL(5,2) | Mejor nota previa del usuario en este challenge |
| is_first_completion | BOOLEAN | Si es la primera vez que completa este challenge |

---

## Pantalla de resultados (frontend)

Tras completar una submission, el usuario ve una pantalla de resultados con:

- Puntuacion total obtenida (contador animado).
- Badge de estado:
  - **FIRST CLEAR** — primera vez completando el challenge.
  - **NEW RECORD** — mejoro su nota anterior.
  - **REPEATED** — repitio sin mejorar.
- Tarjeta de XP con la cantidad ganada y nota de penalizacion si no mejoro.
- Tarjeta de ELO con el cambio:
  - Positivo en verde (+N).
  - Negativo en rojo (-N) con nota "Below expected performance".
  - **UNRANKED** si el usuario tiene menos de 3 challenges completados, con indicador de cuantos faltan.
- ELO actual del usuario tras el cambio.
- Botones para volver a challenges o ver el detalle de la submission.

---

## Endpoints involucrados

| Servicio | Endpoint | Descripcion |
|---|---|---|
| challenge-service | GET /api/challenges/{id} | Obtiene xp_reward y difficulty del challenge |
| auth-service | GET /api/auth/users/{id}/profile | Obtiene rating y totalChallengesCompleted del usuario |
| auth-service | POST /internal/users/{id}/reward | Aplica XP y ELO al usuario (endpoint interno, sin auth) |
| submission-service | GET /api/submissions/{id} | Retorna xpEarned, eloChange, previousBestScore, isFirstCompletion |

---

## Flujo completo

1. El pipeline de submission completa y calcula scores (correctness, performance, design).
2. `submission-service` consulta el challenge (xp_reward, difficulty) y el perfil del usuario (rating, totalChallengesCompleted).
3. Calcula XP segun el caso (primera vez, mejora, repeticion sin mejora).
4. Calcula ELO segun la formula (solo si difficulty >= MEDIUM).
5. Guarda xpEarned, eloChange, previousBestScore, isFirstCompletion en la submission.
6. Llama a `auth-service` via POST /internal/users/{id}/reward para aplicar los cambios al usuario.
7. El frontend muestra la pantalla de resultados con toda esta informacion.
