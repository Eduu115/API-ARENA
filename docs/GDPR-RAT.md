# Registro de Actividades de Tratamiento (RAT) — API Arena

> Documento interno conforme al **art. 30 RGPD** y la **LOPDGDD**. No es un documento público:
> es la evidencia de responsabilidad proactiva (*accountability*) del responsable del tratamiento.
> Debe revisarse al menos una vez al año o ante cualquier cambio sustancial del tratamiento.

- **Última actualización:** 11 de junio de 2026
- **Versión de consentimiento vigente:** 1.0

---

## 1. Responsable del tratamiento

| Campo | Valor |
|---|---|
| Responsable | Eduardo Serrano Trenado |
| NIF/DNI | 47317646E |
| Domicilio | Paseo de Rinconete y Cortadillo, nº 3, portal 3, 1ºA, 28906 Getafe (Madrid, España) |
| Contacto | privacy@apiarena.net / legal@apiarena.net |
| Email (privacidad / derechos) | privacy@apiarena.net |
| Email (legal) | legal@apiarena.net |
| Sitio | https://apiarena.net |
| Contexto | Proyecto Fin de Grado (TFG) de Ciclo Formativo de Grado Superior. Titularidad y autoría: Eduardo Serrano Trenado. |

> No se ha designado Delegado de Protección de Datos (DPD): no concurre ninguno de los supuestos
> obligatorios del art. 37 RGPD ni del art. 34 LOPDGDD. Revisar si el proyecto pasa a explotación real.

---

## 2. Actividades de tratamiento

### 2.1 Gestión de usuarios y autenticación

| Elemento | Detalle |
|---|---|
| Finalidad | Alta y gestión de cuentas, inicio de sesión, verificación de email, recuperación de contraseña, control de edad (+14). |
| Base jurídica | Ejecución de contrato / términos de uso (art. 6.1.b RGPD). Verificación de edad: obligación legal (art. 8 RGPD, art. 7 LOPDGDD). |
| Categorías de interesados | Usuarios registrados (estudiantes, profesores, administradores). |
| Categorías de datos | Nombre de usuario, email, contraseña (hash BCrypt), fecha de nacimiento, fecha y versión de consentimiento, rol, fechas de alta/último acceso, tokens de verificación/recuperación. |
| Conservación | Hasta que el usuario solicite la baja (derecho de supresión). Tokens de recuperación: 1 h. Tokens de verificación: 48 h. |
| Destinatarios / encargados | Resend (envío de emails transaccionales). Infraestructura autoalojada (§3). |
| Transferencias internacionales | Resend (EE. UU.) — ver §4. |
| Categorías especiales (art. 9) | No se tratan. |

### 2.2 Participación en retos y evaluación

| Elemento | Detalle |
|---|---|
| Finalidad | Recepción de entregas (ZIP), ejecución en sandbox, testing automático, puntuación, XP/ELO, ranking, replay. |
| Base jurídica | Ejecución de contrato / términos de uso (art. 6.1.b RGPD). |
| Categorías de interesados | Usuarios registrados. |
| Categorías de datos | Código fuente entregado (ZIP), logs de build/ejecución, resultados de tests, puntuaciones, métricas de la entrega, identificador de usuario. |
| Conservación | Entrega y puntuaciones: mientras exista la cuenta. **ZIP subido: 90 días** (`submission.zip-availability-days`, borrado automático en disco). **Eventos de replay: 30 días** (`replay.retention-days`, Postgres + MongoDB). |
| Destinatarios / encargados | Servicios internos propios (sandbox, testing, ai-review). Infraestructura autoalojada (§3). |
| Transferencias internacionales | Solo si se activa `ai-review` con proveedor externo (Gemini/Google) — por defecto **desactivado** (heurístico local). Ver §4. |

### 2.3 Comunicaciones

| Elemento | Detalle |
|---|---|
| Finalidad | Emails transaccionales (verificación, bienvenida, recuperación, notificaciones IMPORTANT, revisión docente) y alertas opt-in de nuevos challenges; notificaciones in-app. |
| Base jurídica | Transaccionales: ejecución de contrato (art. 6.1.b). Alertas de nuevos challenges: **consentimiento** (art. 6.1.a), revocable desde el perfil; los emails incluyen cabecera `List-Unsubscribe`. |
| Categorías de interesados | Usuarios registrados (alertas: solo estudiantes verificados que han optado). |
| Categorías de datos | Email, nombre de usuario, preferencia `new_challenge_email_alerts`, contenido de la notificación. |
| Conservación | Preferencia mientras exista la cuenta. Entrega del email gestionada por el encargado (Resend). |
| Destinatarios / encargados | Resend. |
| Transferencias internacionales | Resend (EE. UU.) — ver §4. |

### 2.4 Gestión académica (profesores y grupos)

| Elemento | Detalle |
|---|---|
| Finalidad | Creación y gestión de grupos, co-profesor, asociación de alumnos, corrección de entregas (penalizaciones, notas manuales, feedback, bonus). |
| Base jurídica | Ejecución de contrato / términos de uso (art. 6.1.b RGPD). |
| Categorías de interesados | Profesores y estudiantes miembros de grupos. |
| Categorías de datos | Pertenencia a grupos, relación profesor–alumno, correcciones, comentarios y notas docentes sobre entregas. |
| Conservación | Mientras exista la cuenta / el grupo. |
| Destinatarios / encargados | Infraestructura autoalojada (§3). |
| Transferencias internacionales | No (salvo notificación por email vía Resend, §4). |

### 2.5 Métricas de producto y mejora

| Elemento | Detalle |
|---|---|
| Finalidad | Estadísticas agregadas de uso del producto, feedback de documentación, BI interno. |
| Base jurídica | Interés legítimo en mejorar el servicio (art. 6.1.f) con datos minimizados/agregados; analítica de cliente sujeta a **consentimiento** (banner de cookies, categoría *analytics*, hoy inactiva). |
| Categorías de interesados | Usuarios (eventos asociables a `user_id` solo cuando aplica) y visitantes. |
| Categorías de datos | Eventos de producto (`product_events`), feedback de docs, agregados. Ingesta restringida a servicios internos (token `X-Internal-Token`); lectura de negocio restringida a rol ADMIN. |
| Conservación | Agregados/eventos según necesidad de análisis; revisar política de borrado al activar analítica de cliente. |
| Destinatarios / encargados | Infraestructura autoalojada (§3). Grafana/Prometheus/InfluxDB autoalojados. |
| Transferencias internacionales | No (infraestructura autoalojada). |

### 2.6 Seguridad y soporte

| Elemento | Detalle |
|---|---|
| Finalidad | Prevención de abuso (anti-farm, límites de intentos), control de sesiones (refresh tokens), trazas técnicas. |
| Base jurídica | Interés legítimo en la seguridad del servicio (art. 6.1.f RGPD). |
| Categorías de datos | Identificadores de sesión/token, marcas temporales, métricas de intentos. |
| Conservación | Tokens hasta expiración/revocación; trazas técnicas el tiempo mínimo necesario. |

---

## 3. Encargados del tratamiento (procesadores)

| Encargado | Servicio | Datos tratados | Ubicación | Garantías | Contrato (art. 28) |
|---|---|---|---|---|---|
| **Resend** (Resend, Inc.) | Envío de emails transaccionales y alertas | Email, nombre de usuario, contenido del mensaje | EE. UU. | Cláusulas Contractuales Tipo (SCC) / DPA del proveedor | Verificar y conservar el DPA de Resend |
| **Google (Gemini API)** *(opcional)* | Revisión de código por IA (`ai-review`) | Fragmentos de código de la entrega | EE. UU. | SCC / términos de la API | Solo aplica **si se activa** el proveedor `gemini` (por defecto desactivado) |

> **Alojamiento on‑premise (autoalojado).** La aplicación y todas las bases de datos se ejecutan en
> infraestructura propia del responsable; **no existe un proveedor de hosting externo** que actúe
> como encargado del tratamiento, por lo que no se requiere DPA de hosting. El proveedor de
> conectividad a Internet (ISP) actúa como mero transportista y no trata los datos por cuenta del
> responsable.
>
> Componentes de infraestructura **autoalojados** (PostgreSQL, Redis, MongoDB, InfluxDB, Kafka,
> Prometheus, Grafana) corren en esa misma infraestructura y **no** son encargados externos. Las
> tipografías se sirven autoalojadas (sin Google Fonts), por lo que no hay transferencia a Google
> por ese motivo.

---

## 4. Transferencias internacionales

- **Resend (EE. UU.):** transferencia amparada en Cláusulas Contractuales Tipo (SCC) y/o el marco
  *EU–US Data Privacy Framework* según la adhesión vigente del proveedor. Conservar evidencia.
- **Google Gemini (EE. UU.):** solo si se habilita la revisión por IA con proveedor externo.
  Por defecto el sistema usa un evaluador heurístico local, **sin** transferencia.
- No se realizan otras transferencias internacionales.

---

## 5. Plazos de conservación (resumen técnico)

| Dato | Plazo | Mecanismo |
|---|---|---|
| Cuenta y perfil | Hasta baja del usuario | `DELETE /api/auth/me` (borrado + purga en cascada) |
| Token recuperación contraseña | 1 hora | `password_reset_expires_at` |
| Token verificación email | 48 horas | `email_verification_expires_at` |
| ZIP de entrega | 90 días | `ZipRetentionService` (`submission.zip-retention.cron`) |
| Eventos de replay | 30 días | `ReplayRetentionService` (Postgres + MongoDB) |
| Sesiones (refresh tokens) | Hasta expiración/revocación | Revocados en cambio de contraseña y baja |

---

## 6. Medidas técnicas y organizativas (art. 32 RGPD)

- Contraseñas con hash **BCrypt**; nunca en claro.
- Autenticación con **JWT** + refresh tokens revocables; sesiones invalidadas al cambiar contraseña.
- **Verificación de email** obligatoria y **control de edad +14**.
- **Aislamiento del sandbox** del código del candidato en red interna sin salida a Internet ni a BD.
- **Minimización**: borrado automático de ZIPs (90 d) y replays (30 d).
- **Control de acceso**: métricas de negocio solo ADMIN; ingesta de eventos solo con token interno.
- **Derechos del interesado** implementados: acceso/portabilidad (`GET /api/auth/me/export`) y
  supresión (`DELETE /api/auth/me`, con purga de entregas, ZIPs y replays en submission-service).
- **Consentimiento granular** de almacenamiento (banner de cookies; sin rastreo de terceros).
- Cifrado en tránsito (HTTPS) en el dominio público.

---

## 7. Derechos de los interesados

Ejercicio en **privacy@apiarena.net**. Derechos: acceso, rectificación, supresión, oposición,
limitación y portabilidad (arts. 15–22 RGPD). Vía de reclamación: **Agencia Española de Protección
de Datos (AEPD)**, https://www.aepd.es.

| Derecho | Cómo se atiende |
|---|---|
| Acceso / Portabilidad | Autoservicio: *Export my data* en el perfil (`GET /api/auth/me/export`, JSON). |
| Supresión | Autoservicio: *Delete my account* en el perfil (`DELETE /api/auth/me`). |
| Rectificación | Edición de perfil + solicitud por email para otros datos. |
| Oposición / Limitación | Solicitud por email; revocación de alertas desde el perfil. |

---

## 8. Pendientes / a revisar

- [x] **Hosting**: on‑premise / autoalojado — sin encargado de hosting externo (sin DPA de hosting).
- [ ] Conservar copia del **DPA de Resend** y verificar el marco de transferencia vigente.
- [ ] Asegurar **HTTPS/TLS** y copias de seguridad cifradas en el servidor propio (medidas art. 32).
- [ ] **Domicilio**: actualmente se publica el domicilio particular; valorar migrar a un **apartado de Correos** cuando sea viable para no exponer la dirección personal.
- [ ] Si se activa **analítica de cliente**, definir su plazo de conservación y reflejarlo aquí.
- [ ] Si se activa **ai-review con Gemini**, documentar la transferencia y la base jurídica.
- [ ] Revisión legal final del conjunto (textos legales + este RAT) antes de explotación real.
