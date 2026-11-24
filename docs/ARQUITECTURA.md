# Arquitectura y decisiones técnicas

## Diagrama de componentes

```
   Cliente (React / Vite)                 Servidor (Express / TypeScript)
  ┌──────────────────────┐               ┌────────────────────────────────┐
  │ Página pública       │  /api/spin    │ Validación Zod + rate limit    │
  │  - Formulario        │ ────────────► │ Motor de probabilidades        │
  │  - Ruleta SVG        │ ◄──────────── │ Transacción BEGIN IMMEDIATE    │
  │  - Celebración       │ segments +    │ Código único + descuento stock │
  │                      │ winningIndex  └───────────────┬────────────────┘
  │ Panel admin (JWT)    │                               │
  │  - Premios           │  /api/admin/*                 ▼
  │  - Editor visual     │ ────────────►        SQLite (WAL) persistente
  │  - Historial         │                      premios / participaciones /
  │  - Códigos           │                      settings / admins / audit_logs
  └──────────────────────┘                      └──────── uploads/ (assets)
```

## Decisiones

1. **SQLite con `node:sqlite`**: Node 24 incluye el motor embebido; evita compilar `better-sqlite3` en Windows y ofrece transacciones ACID reales con `BEGIN IMMEDIATE`.
2. **Resultado enviado antes de animar**: el backend devuelve `segments` y `winningIndex` en la misma respuesta que la participación. El frontend solo anima; no existe un "cálculo client-side" que pueda manipularse.
3. **Inventario como columna `delivered` + restricción en UPDATE**: `WHERE delivered < quantity` con verificación de `changes === 1` es la última línea de defensa aunque otra transacción haya modificado el premio.
4. **Premio ilimitado**: `is_unlimited = 1` omite el control de stock. Se usa para "Sigue participando" y sigue teniendo probabilidad configurable.
5. **Probabilidad efectiva**: `p / Σ(p elegibles) * 100`. El panel muestra original y efectiva para que el administrador entienda el impacto de los agotamientos.
6. **Historial inmutable**: el nombre, icono y mensaje se guardan como snapshot en `participations`; borrar un premio con historial está prohibido, solo se puede desactivar.
7. **Configuración visual en BD**: `settings` guarda JSON por dominio (`theme`, `promotion`, `whatsapp`). El editor administrativo modifica esos registros; no hay constantes de UI que editar en código.
8. **Cookies httpOnly en vez de localStorage**: el token JWT no es accesible desde JavaScript del navegador, reduciendo el impacto de XSS.

## Concurrencia

`withTransaction()` ejecuta `BEGIN IMMEDIATE`, que adquiere el bloqueo de escritura de SQLite antes de leer el inventario. Otras transacciones esperan (`busy_timeout = 10000`). Por ello, en un giro por el último premio:

- La primera transacción descuenta el stock y hace commit.
- La segunda ve `delivered >= quantity`, por lo que el premio ya no está entre los elegibles y selecciona otra opción (o devuelve error si no queda ninguna).

La prueba `protege el último premio ante giros simultáneos` lanza 40 peticiones en paralelo y verifica que exactamente una gana.
