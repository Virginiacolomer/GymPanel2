# AGENTS.md — GymPanel (Proyecto 3 · Ingeniería y Calidad de Software + Programación Avanzada)

Este archivo reúne las reglas de la cátedra (apuntes de clase) y las decisiones del equipo.
**Leelo completo antes de revisar, refactorizar o agregar código.** Si una regla de acá choca con lo que te pide el usuario, avisá y preguntá; no resuelvas en silencio.

> **Fase 2 de la reestructuración (en curso).** Si te piden trabajar en una de las secciones 1 a 7, leé primero la **sección 16** (estado actual del código, qué hace cada sección, coordinaciones y checklist de PR) y después las reglas generales. Preguntá al usuario **qué sección (1–7) le toca** si no lo dijo, y trabajá solo dentro de esa sección.

---

## 0. Cómo trabajar (reglas para la IA)

1. **No tomes decisiones de diseño por tu cuenta.** Proponé un abanico de opciones con pros y contras; el equipo elige y justifica. Las decisiones son del equipo, no de la IA.
2. **No instales nada sin autorización.** El equipo usa **un solo gestor de paquetes: hoy es npm** (`package-lock.json` en `backend/` y `frontend/`). No mezcles gestores ni cambies a yarn sin decisión del equipo; no usar `ng add`/`ng update` sin permiso, porque instalan dependencias. No instales dependencias con menos de 1 día de antigüedad.
3. **Leé el proyecto y estas convenciones antes de tocar algo.** No asumas relaciones entre entidades que no están en el dominio (ej: no relacionar cosas "porque se parecen").
4. **YAGNI / KISS.** No hagas sobreingeniería ni cosas que no se pidieron. Si dudás si algo hace falta: **preguntá antes**.
5. **Antes de tocar cualquier atributo/método sin documentación** preguntate: ¿qué representa en el negocio? ¿qué comportamiento depende de él? ¿está documentado? Si no hay necesidad → se elimina (YAGNI). Si hay necesidad pero no está documentado → se documenta.
6. **Siempre justificá**: qué cambiaste, por qué, qué alternativas había y qué consecuencias tiene (el equipo debe poder explicarlo en la defensa).
7. **Cada cambio deja una huella** (complejidad, acoplamiento, deuda técnica, riesgo). Indicá si la huella es positiva o negativa.
8. **Los criterios de aceptación mandan.** Si un cambio no está en un criterio de aceptación, está mal. Si un criterio no se cumple en código, va a deuda técnica.
9. **No uses IA como excusa.** Todo código generado debe ser entendido por el equipo; el docente puede detectar secciones "puramente de IA".

---

## 1. Contexto del proyecto

- **Producto:** GymPanel — planes de entrenamiento y registro de sesiones para entrenadores y clientes.
- **Stack:** Backend NestJS 11 + TypeScript + TypeORM 0.3 + **PostgreSQL** (Supabase). Frontend **Angular 21 + TypeScript (Angular CLI)**, standalone components + SSR. Deploy: backend en **Railway**, frontend en **Vercel** (ver sección 11). Gestor de paquetes: npm.
- **Fuera del alcance (límite explícito del enunciado):** cuotas/pagos, turnos/reservas, facturación, administración comercial, multisucursal, reportes.
- **Es un MVP:** hay cosas que se dejan afuera a propósito. Lo que no está en el MVP se aclara como "fuera del MVP"; si no se aclara, se toma como que no está. **Un MVP no debería tener deuda técnica.**
- **Core domain:** *Sesiones* (registrar entrenamiento y seguir la evolución). Soporte: *Planes*, *Usuarios*, *Ejercicios*.
- **Enfoque del MVP:** las **herramientas inteligentes** planteadas en la landing (ver sección 14).

### Regla de oro de la fase de reestructuración
Salvo lo que se borra, **la app se comporta exactamente igual**: mismos endpoints, mismas respuestas JSON, mismos códigos de error, mismas pantallas. Nada de funcionalidades nuevas mezcladas con el refactor; si ves algo para mejorar, anotalo para después. Si un test e2e se pone rojo, el cambio no entra.

---

## 2. Principios de ingeniería de software

Aplicarlos de verdad, no solo nombrarlos ("los nombres engañan, el significado lo damos nosotros"):

- Rigor y formalidad · Separación de intereses · Modularidad · Abstracción · Incrementalidad.
- **Anticipación del cambio** = convivir con el cambio, no adivinarlo. El diseño debe permitir cambiar con costo y riesgo razonables.
- **Generalidad:** no abusar.
- **SOLID** (con su relación con los principios clásicos):
  - S: una sola razón para cambiar, alta cohesión.
  - O: abierto a extensión (polimorfismo, abstracción).
  - L: abstracciones bien aplicadas, diseño por contratos.
  - I: interfaces chicas, menos dependencias.
  - D: depender de abstracciones, bajo acoplamiento (en Angular: inyección de dependencias con `InjectionToken` cuando haga falta abstraer).
- **Interfaz ≠ clase.** Trabajar con interfaces es principio SOLID (muy usado en Angular para modelos y contratos de services).
- **Principios modernos:** diseño para el cambio continuo, automatización, medición y feedback continuo, DevOps, arquitectura evolutiva, ética y responsabilidad, colaboración radical, experiencia de desarrollador.
- **Unidad conceptual:** el sistema debe sentirse coherente (mismo lenguaje, mismas decisiones). Si falta, la validación con el cliente falla.
- El diseño inadecuado no lo salva ni el refactoring: **el diseño es nuestro, la IA solo programa.**

---

## 3. DDD (Domain-Driven Design) — reglas obligatorias

> "El estado es consecuencia del comportamiento, no el diseño del dominio." No importa cómo se guarda el estado, sino **cuáles son las transiciones válidas**. El DER responde *qué información guardo*; el DDD responde *qué puede pasar en el negocio*.

### 3.1 Orden de trabajo
1. **Entender el dominio primero.** Si no está claro, **no se empieza a programar**.
2. **Lenguaje ubicuo** → 3. **Event Storming (se hace ANTES)** → 4. Bounded contexts → 5. Agregados/entidades/VOs → 6. Reglas de negocio → 7. Casos de uso → 8. Recién ahí, código.

### 3.2 Lenguaje ubicuo
- Una palabra = un significado, igual en negocio, documentos, código, BD y UI.
- Documentar cada término con: definición, **"no confundir con"** y ejemplo. Cada término del lenguaje luego tiene reglas.
- **Se puede fallar en un agregado, no en el lenguaje ubicuo.**
- La IA suele inventar su propio vocabulario: **corregirlo siempre** al lenguaje del dominio.
- Si el código y la documentación difieren, decidir una estrategia explícita: (1) cambiar la documentación, (2) cambiar el código, (3) combinar/aclarar (concepto vs. representación), (4) mantener ambos definiendo cada uno. Dejar registro.
- Nombres: significativos con lo que hacen; el nombre no define la responsabilidad.

### 3.3 Bounded contexts
- Cada contexto tiene su dueño y sus reglas; "Cliente" o "Ejercicio" pueden significar cosas distintas en cada uno.
- Los contextos **se integran, no se mezclan**: se referencian **solo por ID** y se comunican por **puertos (interfaces)** o **eventos de dominio**.
- Prohibido importar el código interno de otro contexto (solo sus puertos). Lo controla una regla de ESLint.

### 3.4 Agregados, entidades y Value Objects
- **Agregado:** conjunto de objetos que se tratan como una unidad para mantener consistencia. Tiene una **raíz** que es la única puerta de entrada; todo cambio pasa por ella.
- **Entidad:** identidad propia que se conserva en el tiempo.
- **Value Object:** sin identidad, **inmutable**, se valida al crearse (nunca existe en estado inválido), igualdad por valores. **Las reglas de negocio en Value Objects es muy DDD.**
- **Modelo rico, no anémico.** Las entidades tienen comportamiento (métodos que protegen sus invariantes). Un modelo con solo getters/setters y la lógica en services es **anémico → hallazgo a corregir**.
- Con DDD el mapper DTO→Entity "muere": lo hace la propia entidad.
- **Eventos de dominio:** pensar en eventos/acciones/transiciones de estado, no en tablas. Los estados tienen transiciones, comportamientos e impacto.
- **Los roles no son tablas**; son participantes con comportamientos.

### 3.5 Reglas de negocio
- Cada regla: identificador (R1, R2…), enunciado claro, y rastreo a escenario/criterio de aceptación.
- **Dónde va la validación:**
  - Si la entidad tiene toda la información para decidir (importe > 0, fecha no futura, etc.) → **la valida la entidad / VO**.
  - Si hay que consultar otras entidades → **un Validator / Domain Service** (nunca el service de aplicación ni el repository).
  - Orden recomendado: primero las validaciones que consultan a otros, después las de la entidad.
  - **Validan front y back.** El back es "neurótico": revalida siempre.
  - Primero se validan **todas** las reglas de negocio y recién después se persiste.
- **Restricción ≠ regla:** lo que no pertenece al dominio central (ej. email único, no borrar ejercicio en uso) se documenta como **restricción**, no como regla de negocio.
- Las reglas que cambian con el negocio deben anotarse (los usuarios las cambian y después nadie recuerda qué se hizo).

### 3.6 Preguntas que decide DDD
Antes de poner código en un lugar: **¿Qué problema estamos resolviendo? → ¿Qué decisión hay que tomar? → ¿Quién conoce esa decisión? → ¿Quién debería ser responsable? → ¿Qué colaboración necesita? → ¿Dónde vive esa responsabilidad? → recién ahora, ¿qué nombre le damos?**
No es "¿dónde pongo este código?" sino **"¿quién debería hacerse cargo de esto?"**

| Necesidad | Pregunta | Solución posible |
|---|---|---|
| Ejecutar un caso de uso | ¿Quién coordina? | Application Service / Use Case |
| Regla del negocio | ¿Quién conoce la regla? | Entidad / Value Object / Domain Service |
| Crear un objeto complejo | ¿Quién sabe construirlo? | Factory |
| Elegir una implementación | ¿Quién decide cuál usar? | Resolver / Strategy |
| Validación técnica/de entrada | ¿Quién controla el formato? | Validator / Pipe |
| Transformar datos | ¿Quién convierte una representación en otra? | Mapper / Formatter |
| Función genérica sin conocimiento del dominio | ¿Es realmente genérica? | Helper / Utility |

---

## 4. Arquitectura por capas (backend)

```
Presentation   → Controllers, DTOs, validators de entrada
Infrastructure → Persistencia (TypeORM), mappers, adapters, servicios externos
Application    → Use cases / commands / queries, orquestación
Domain (núcleo)→ Entidades, Value Objects, interfaces de repositorio, servicios de dominio, excepciones
```

- **Domain NUNCA importa de Application, Infrastructure ni Presentation.** Las dependencias van hacia el dominio.
- **No mezclar presentación con aplicación** (hallazgo frecuente a corregir).
- Estructura objetivo (lo que ya existe está detallado en la sección 16):
```
backend/src/
  shared/
    domain/          → Entity, ValueObject, DomainError (+ categorías)
    infrastructure/  → DomainErrorFilter: DomainError → HTTP (mismos códigos/mensajes que hoy)
  contexts/
    auth/ usuarios/ ejercicios/ planes/ (sesiones/ cuando se implemente)
      index.ts       → API pública del contexto (lo único que importan los demás)
      domain/ application/ infrastructure/ presentation/
      <ctx>.module.ts
  database/          → opciones de conexión, data-source de la CLI, migraciones, seed
  modules/           → código viejo que todavía no se migró (desaparece al final de la Fase 2)
```
- Cada contexto expone **puertos** (ej. `UsuariosQuery`) en su API pública; otros contextos usan solo esos puertos. **Un puerto o un método nuevo se agrega cuando hay un consumidor real** (YAGNI), acordando la firma con el dueño del contexto.

### 4.1 Service → Use Cases
- Un **service gigante es hallazgo** (ej. service de 776 líneas). Se parte en **un use case por acción de dominio** (CrearPlan, EditarPlan, AsignarPlan, RegistrarSesión…). No se mezclan acciones de dominio distintas.
- El use case **orquesta**: llama al validator, a la entidad/factory, al repository y devuelve. No contiene reglas de negocio.
- Criterio para separar: **quién pide el cambio y por qué**, no la cantidad de métodos. Dos métodos van juntos si cambian por el mismo motivo.
- Ruta de adelgazamiento: reglas → entidad/VO; validaciones → Validator; service queda como orquestador; luego se reemplaza por use cases.

### 4.2 Repository
- **Solo persiste y consulta:** guardar, actualizar, eliminar, buscar. **No construye entidades, no valida, no tiene reglas.**
- Es una **interfaz en el dominio**; la implementación TypeORM vive en infraestructura. No debe conocer a la entidad de dominio más allá de lo necesario (usar mappers/adapters).
- Evitar doble capa repository + adapter redundante ("repository al vicio").
- **Anti-patrón:** el service crea la entidad y se la pasa al repository.
- `findBy`/`findOne` genéricos: usar solo cuando sirven; para vistas específicas usar **Query Objects** + `createQueryBuilder`. `relations` para casos simples, QueryBuilder para consultas con muchas entidades. Aplicar paginación y filtros en `findAll`.

### 4.3 Factory e Input
- La **Factory** se usa **solo cuando es realmente necesaria** (objeto complejo que involucra varias entidades/reglas). Para entidades simples (ej. una marca con un string) **no hace falta**.
- El **Input** es un **contrato de entrada** (interfaz/tipo) que se pasa a la Factory o a `Entidad.crear(input)`. No elimina el acoplamiento; cambia la forma y el lugar donde se expresa. Mejora legibilidad, evolución y mantenimiento.
- La entidad no puede pedir que se conecte un service.

### 4.4 Validators, Pipes y DTOs
- DTO de entrada con **class-validator obligatorio**; `ValidationPipe` en rutas. Los DTOs definen la estructura de datos entrantes/salientes.
- El Validator encapsula lo que antes hacía el service de validación (consultas a otras entidades).

### 4.5 Mappers
- Un mapper **especializado por cada necesidad**; evitar mappers gigantes.
- Manual (rápido, explícito, control total) vs `plainToInstance`/class-transformer (declarativo, algo más lento). Elegir y justificar.

### 4.6 Helpers
- Un Helper es un **nombre descriptivo, no una categoría arquitectónica**: ayuda técnica repetitiva. No decide reglas de negocio ni es servicio de dominio.
- Pregunta clave antes de extraer: **¿estamos repitiendo código o repitiendo conocimiento?** Si es conocimiento que debe evolucionar de forma coordinada → centralizar (ej. `DocumentQueryHelper`: no solo evita 3 líneas, centraliza conocimiento repetido).
- Los helpers de consulta son para el repository; no cualquiera los llama.
- No usar helper no es automáticamente deuda técnica, pero un helper también puede serlo.

### 4.7 Transacciones / Unit of Work
- Una transacción = A, B y C atómicos; si C falla, se revierte todo.
- Usar el patrón Unit of Work / `@Transactional` (TypeORM). El UoW **no valida ni crea**: solo guarda. La validación se hace antes, en otro lado.
- Cada decorador/transacción debe estar justificado.

### 4.8 Módulos NestJS
- El **module carga la responsabilidad**: pocos imports, pocos providers, pocos controllers. Una dependencia cíclica entre módulos es señal de diseño a revisar: antes de usar `forwardRef`, separá responsabilidades (ej. `AuthGuardsModule` separado de `AuthModule`, sección 16).
- `providers`: servicios, validators, pipes, factories, adapters, repos con `provide`/`useClass` (primero la interfaz), `useFactory` para UnitOfWork.
- `exports`: lo que se pone a disposición de otros (`TypeOrmModule`, service, adapter). Si no se exporta, es privado. Los queries que usan otros contextos hay que **proveerlos y exportarlos**.
- Los providers son los que más problemas causan: revisarlos siempre.
- `synchronize: true` solo para algo recién hecho; **en este proyecto `synchronize: false` y todo cambio por migración**.

### 4.9 Convenciones de API
> **Durante la reestructuración (Fase 2) NO se aplican** las que cambian el contrato (prefijo `/api`, `snake_case`, errores `{ "error": ... }`): rompen la regla de oro y los e2e. Hoy el contrato es: rutas sin prefijo, JSON en camelCase y errores con el formato de Nest `{ message, error, statusCode }`. Se adoptan en la etapa de funcionalidades, junto con el front.

- Prefijo global: `app.setGlobalPrefix('api')` (permite `/api/v1`).
- Documentar con **Swagger** (decoradores; tarea repetitiva que se puede delegar a la IA).
- **Logger** y **try/catch** bien manejados (invertir en mejorarlos); los errores deben servir para saber cuándo falló y cuánto cuesta solucionarlo.
- **Autorización por roles** en el servidor (responde 403 si no corresponde); todo endpoint exige token (401).
- Orden de rutas en controllers: **rutas fijas antes que `@Get(':id')`**.
- Convenciones del contrato: JSON `snake_case`, `Authorization: Bearer`, errores `{ "error": "mensaje" }`, fechas ISO 8601, peso en kg, contraseñas nunca se devuelven.

---

## 5. Persistencia y base de datos (TypeORM + PostgreSQL)

- **Nombres explícitos** (`@Entity('nombre')`, `@JoinColumn({ name })`, `@Column({ name })`); no dejar que el ORM decida. Al mover entidades se mantienen nombres de tabla y columna.
- **Exponer la FK explícitamente** además de la relación de navegación, ambas apuntando a la **misma columna**:
```ts
@ManyToOne(() => FacturaVenta, (f) => f.items)          // tipada con función, no string
@JoinColumn({ name: 'factura_venta_id' })
facturaVenta: FacturaVenta;

@Column({ type: 'int', name: 'factura_venta_id', nullable: true })
facturaVentaId?: number;                                  // evita JOINs/instancias innecesarias
```
- **Índices:** importantes para performance (se mide la performance, no el esfuerzo). Las fechas son candidatas; pueden ser compuestos. Saber cómo se consultan.
- **Soft delete** en lugar de borrado físico: `deletedAt` + **quién lo hizo**. Auditoría mínima: usuario que creó, modificó y eliminó. *(Cambia comportamiento: no se aplica durante la reestructuración; va a la etapa de funcionalidades.)*
- **UNIQUE:** verificar que no bloquee casos válidos (ej. unique en la categoría en vez del nombre). Si queda limitado → deuda técnica documentada.
- Atributos como `sistema`/`configuración sistema` suelen implicar "solo lectura / no editar / no borrar": **no tocar sin entender su uso**.
- Un string "motivo" casi nunca: si es motivo, probablemente sea tabla/entidad (o un enum); si es solo aclaración, es "detalle/comentario".
- Guardar textos en mayúsculas y mostrar al cliente como se quiera (política de la cátedra). *(Hoy solo ejercicios y grupos musculares se guardan en mayúsculas; extenderlo cambia comportamiento → etapa de funcionalidades.)*
- Pruebas de estrés / volumen: probar con decenas de miles de registros; operaciones masivas con mínimo 500–600 registros y desplegadas.

---

## 6. Frontend (Angular + TypeScript)

### 6.1 Componentes
- **Componentes con una responsabilidad.** Versión esperada: **componentizada** (no un solo componente con todo).
- **Standalone components** (sin `NgModule` salvo que el equipo decida lo contrario). Cada componente importa solo lo que usa.
- Comunicación padre → hijo con `input()` / `@Input()`; hijo → padre con `output()` / `@Output()`. No pasar services por inputs.
- **Contenedor vs presentacional:** el contenedor (página) inyecta services y maneja estado; el presentacional solo recibe inputs y emite outputs. Presentacionales con `ChangeDetectionStrategy.OnPush`.
- Templates sin lógica de negocio: nada de cálculos ni reglas en el HTML; si hace falta transformar para mostrar → **pipe** puro o propiedad derivada (`computed()`).
- Lógica de UI reutilizable → **directivas** o services; validaciones reutilizables → **validators propios** (`ValidatorFn` / `AsyncValidatorFn`).

### 6.2 Services y HTTP
- Todos los endpoints se llaman desde un service, **uno por contexto/dominio** (`AuthService`, `UsuarioService`, `EjercicioService`, `PlanService`, `SesionService`) usando `HttpClient`. Evitar el *god service*.
- Lo común (URL base desde `environment`, token `Authorization: Bearer`, manejo de errores 401/403) va en **interceptors funcionales** (`HttpInterceptorFn`), no repetido en cada service.
- Los componentes no usan `HttpClient` directamente.
- Inyección con `inject()` o constructor (elegir uno y ser consistentes). `providedIn: 'root'` solo para lo realmente global; lo de una feature se provee en la ruta de esa feature.

### 6.3 Estado compartido
- Para usuario/roles, tema, flujos de varias pantallas o datos leídos por muchos componentes lejanos → **service de estado con signals** (`signal`, `computed`), expuesto como solo lectura (`asReadonly()`). Varios services de estado chicos mejor que uno global.
- Para pasar un dato a un hijo directo → `input()`, no un service.
- **No se usa NgRx ni otras librerías de estado** (sin autorización del equipo).
- RxJS para flujos asíncronos (HTTP, eventos); en templates preferir `async` pipe o `toSignal()` para no dejar suscripciones abiertas. Si hay `subscribe` manual → `takeUntilDestroyed()`.

### 6.4 Formularios
- **Reactive Forms tipados** (`FormGroup`/`FormControl` con tipos). No mezclar con template-driven en la misma feature.
- Las validaciones de formulario son de UX; **el servidor decide las reglas de negocio** y revalida siempre.

### 6.5 Estructura y rutas
- **Por feature, no por tipo** ("lo que cambia junto vive junto"):
```
frontend/src/app/
  core/        → interceptors, guards, services globales (auth, estado de sesión de usuario)
  shared/      → componentes presentacionales, pipes y directivas genéricos (sin dominio)
  features/
    usuarios/ ejercicios/ planes/ sesiones/
      pages/ components/ services/ models/ <feature>.routes.ts
  app.routes.ts
```
- Capas (vista, lógica, dominio, validación, datos) que solo hablan con la vecina; **estado mínimo**; **única fuente de verdad** (interfaces de modelo compartidas por feature; tipos derivados en lugar de duplicados).
- **Rutas centralizadas** en `app.routes.ts` con **lazy loading** por feature (`loadChildren` / `loadComponent`) y **guards funcionales** por rol (`canActivate`). Menú coherente con las rutas; no agregar pantallas al menú sin preguntar.
- Evitar: pantallas dentro de `shared/` o `utils/`, carpetas duplicadas, componentes enormes, lógica de negocio en templates o páginas.
- El front **nunca decide reglas de negocio**: las decide el servidor; los errores se muestran tal como los devuelve el back (`{ "error": "mensaje" }`).
- Casos de prueba **manuales** para el front.
- Más que "responsive", a veces el celular implica **flujos de dominio distintos**.

---

## 7. Deuda técnica

- La deuda debe ser **consciente, planificada, anotada y gestionada**. No es "código que no me gusta": es una decisión/condición actual que aumenta el costo o el riesgo de cambios futuros. **Genera intereses.**
- Cuadrantes (Fowler): solo la **intencionada y estratégica** es aceptable (no buena, aceptable). Intencionada no estratégica = cuestionable; no intencionada estratégica = irresponsable; no intencionada no estratégica = incompetente.
- Tipos (Kruchten): visible (funcionalidad que falta) / no visible (arquitectónica, estructural, de pruebas, calidad).
- Si hay 10 criterios de aceptación y el código cumple 3, el resto va a deuda técnica.
- Se lleva en **tablero aparte**, con contexto (no solo un Excel). Formato de ficha:
```
DT-XX — Título
Tipo / Módulo / Área
Explicación de la implementación temporal (por qué, qué se asumió)
Tareas asociadas (qué hay que revisar/completar)
Impacto y riesgo actual (tabla solo si hace falta)
```
- Ejemplos aceptados en este proyecto: rol Administrador/Dueño fuera del MVP, soft delete sin usuario, unique limitado, etc.
- Para este MVP: **todo hack visible debe quedar registrado**.
- La deuda conocida al cerrar las Fases 0 y 1 está en la **sección 17** (DT-01 en adelante); numerar las nuevas a continuación.

---

## 8. Requerimientos, historias de usuario y pruebas

- **Historia de usuario:** Como `[rol]` quiero `[objetivo]` para `[beneficio]` + **criterios de aceptación siempre**. Sin criterios no hay historia. Criterios a nivel de negocio, **nunca detalles de implementación**. Pueden decir "a confirmar". Incluir prioridad y puntos de historia.
- Un pedido de cambio puede dispararse en 2–3 historias. No generar historias con muchos criterios sin relación (típico de IA).
- Criterios de aceptación **sin ambigüedad** (ej. definir si la coincidencia parcial es "contiene" o "comienza con").
- Si hay dudas del requerimiento → **preguntar o mostrar un prototipo** (papel o Figma) antes de comprometer.
- **EARS** para Kiro: `WHEN [evento] THEN THE SYSTEM SHALL …` / `IF [error] THEN …` / `WHILE [estado] …` / ubicuo `THE SYSTEM SHALL …`. Palabras clave en inglés, contenido en castellano con el lenguaje ubicuo.
- **Caso de prueba:** ID, título, **precondición**, **entrada**, **resultado esperado**, **oráculo** (a quién se consulta), **criterio pasa/falla**, **postcondición**. Al menos uno por criterio de aceptación.
- **Gherkin:** `Feature` / `Scenario` / `Given` / `When` / `Then` (bueno para tests unitarios).
- Tests desde el principio, no como carga posterior; más tests automáticos de los que solemos hacer. Los e2e fijan el comportamiento actual antes de refactorizar.
- Si se declara un número de cobertura en el Proyecto 3, **debe cumplirse**.
- Pruebas de validación contra el dominio; sin testing, planificación ni análisis "no es programación" (2026).
- Revisiones: inspección (formal), code review (informal), walkthrough, peer review, auditoría. El análisis estático antes del testing.

---

## 9. Cambio y mantenimiento

- Tipos de mantenimiento (ISO): **correctivo** (está roto, TENEMOS que arreglar), **adaptativo** (cambió el entorno), **perfectivo** (QUEREMOS mejorar/añadir), **preventivo** (DEBERÍAMOS cambiar antes de que sea problema). Los errores se clasifican por severidad.
- Proceso: identificar necesidad → clasificar → **análisis de impacto** → diseño → implementación → pruebas → despliegue → revisión post-implementación.
- Modelo evolutivo: construir → usar → cambiar → aprender. El mantenimiento va **dentro del backlog**.
- Aceptar el cambio ≠ estar preparado para cambiar: la adaptabilidad es propiedad del diseño y de las prácticas (arquitectura, tests, documentación viva).
- Si un cambio trivial afecta más de un componente de negocio, es crítico: revisar el diseño.
- Rotación del equipo: anotar reglas de negocio y documentar lo justo (el dominio).
- **Refactorizar siempre**, en pasos chicos.

---

## 10. Gestión: planificación, métricas, calidad

- **Plan de proyecto** siempre (IEEE 1058 adaptable, justificando lo que se agrega o cambia). Incluir supuestos, restricciones, riesgos, alcance, cronograma. Se replanifica, no se abandona; si hay incertidumbre se planifica a corto plazo (sprint ideal 15–21 días). Replanificar con al menos una semana de anticipación.
- Estimar por **complejidad** (no por horas), en **rangos con contexto/supuestos**; no confundir precisión con exactitud.
- **OKR:** Objetivo (dirección) + Key Results (evidencia medible de **outcome**, no de output). Pregunta de control: *¿podría cumplir el KR sin que ocurra el cambio buscado?* Si sí, no es un buen KR. No son tareas, ni sirven para controlar quién trabajó.
- Métricas: medidas → métricas → indicadores; objetivo definido antes de medir; empezar con pocas, baratas y automatizables; no criminalizar errores; foco en proceso y decisiones, no en números.
- **Retrospectivas** al cierre de sprint (5 min por tema, técnicas y no técnicas): qué salió bien / mal / qué mejorar. No es una auditoría ni un paso a paso.
- Tableros: uno para historias/tareas y otro para deuda técnica/hacks (front y back); GitHub Projects para vincular tareas con commits. La documentación es viva y debe decir lo mismo que el software.
- Definir **Definition of Ready / Done**; criterios de entrada y salida.
- Matriz **impacto–esfuerzo**: **definir qué significa alto/bajo y cómo se mide** (no usar alto/bajo sin criterio). Impacto alto si afecta reglas de negocio, datos, trazabilidad, seguridad, cumplimiento, consistencia o procesos críticos. Todo hallazgo lleva **categoría** (detectar ≠ analizar: explicar tipo, causa y consecuencia).

---

## 11. Git, commits y deploy

- Commits **pequeños y atómicos**, un cambio lógico, mensajes claros, frecuentes, **no commitear código roto**. Conventional Commits: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`. Relacionar con issue/ticket. Usar `.gitignore`.
- Nunca una sola rama. Ramas cortas (1–3 días): `chore/limpieza-<qué>`, `refactor/<contexto>-<qué>`, o una por historia de usuario. Salen de **`develop`** y se mergean por PR a `develop` (rama de integración). `git pull --rebase origin develop` todos los días. `main` es lo que se deploya: solo recibe merges de `develop` cuando el equipo lo decide. Importa más **quién mergea** que quién crea ramas.
- Deploy actual: backend en **Railway** (`backend/railway.json`, healthcheck `/health`) y frontend en **Vercel** (`frontend/vercel.json`), ambos desde `main`. **Al arrancar, el backend aplica las migraciones pendientes**: no mergear a `main` una migración destructiva sin avisar al equipo. `develop` no se deploya. El esquema con Docker (build → tag con versión → push → `pull` y `up -d --force-recreate`) es el que propone la cátedra; adoptarlo es decisión del equipo.
- Cambios de BD **solo por migración**.

---

## 12. Cómo revisar y arreglar código (procedimiento)

Para cada módulo/archivo revisado, producir hallazgos con este formato:

| # | Dónde | Qué se detectó | **Categoría** | Por qué ocurre | Consecuencia | Impacto (definido) | Esfuerzo (definido) | Acción propuesta |
|---|---|---|---|---|---|---|---|---|

**Categorías sugeridas:** modelo de dominio anémico · regla de negocio fuera del dominio · service gigante / múltiples responsabilidades · repository con lógica · violación de capas · acoplamiento entre contextos · lenguaje ubicuo inconsistente · nomenclatura ORM implícita · falta de índice/FK explícita · borrado físico/auditoría faltante · validación ausente o duplicada · código muerto / YAGNI · documentación desactualizada · deuda técnica no registrada · frontend: componente grande / lógica en template o página / service único (god service) / `HttpClient` en componentes / suscripciones sin cerrar / rutas sin guard.

**Checklist por archivo:**
1. ¿Qué responsabilidad tiene? ¿Es una sola? ¿Quién *debería* tenerla?
2. ¿Hay reglas de negocio? ¿Están en entidad/VO/validator o sueltas en service/controller?
3. ¿Respeta el sentido de las dependencias (domain no importa nada de afuera)?
4. ¿Usa el lenguaje ubicuo? ¿Los nombres coinciden con la documentación?
5. ¿Hay algo no pedido / sin uso (YAGNI)? ¿Se puede eliminar?
6. ¿El repository solo persiste? ¿Quién crea la entidad?
7. ¿Hay tests que fijen el comportamiento antes de cambiarlo?
8. ¿Qué huella deja el cambio (+/−)? ¿Queda deuda técnica? → registrarla.
9. ¿Cambia el comportamiento externo? Si sí (durante el refactor) → **no se hace**.

**Orden de trabajo recomendado:** limpieza (borrar lo que no corresponde, lo que más archivos toca va primero) → red de seguridad (e2e, CI, migraciones, `synchronize:false`) → reestructuración por contexto en paralelo → cierre (código muerto, README/CLAUDE.md actualizados).

---

## 13. Contextos del proyecto y puertos

| Contexto | Tipo | Dueño de | Puerto que expone |
|---|---|---|---|
| Sesiones | **Core** | Sesión de entrenamiento, ejercicios realizados, historial y progreso | `SesionesQuery` (a definir) |
| Planes | Soporte | Plan, días del plan, asignación, estado (VIGENTE/REEMPLAZADO) | `PlanesQuery` (a definir cuando alguien lo necesite) |
| Usuarios | Soporte | Cliente/entrenador, roles, estado (CREADO/ACTIVO/BAJA), credenciales | `UsuariosQuery.buscarPorEmail` (**implementado**) |
| Ejercicios | Soporte | Nombre, descripción, grupo muscular e imagen | `EjerciciosQuery` (a definir cuando alguien lo necesite) |
| Auth | Soporte | Login, JWT, guards | usa `UsuariosQuery` (no el repo de usuarios) |

> **Lenguaje ubicuo vs. código actual (pendiente, decisión registrada como DT-07):** el análisis dice Cliente/Entrenador/Administrador y estados CREADO/ACTIVO/BAJA; el código actual tiene `User` con roles `CLIENTE`/`ADMIN` y estados `creado`/`activo`/`inactivo`. Durante la reestructuración **se mantiene lo del código** (cambiarlo altera respuestas y datos); se alinea en la etapa de funcionalidades.

Reglas de negocio vigentes (R1–R11) y escenarios E1–E18 están en el análisis de dominio del proyecto; **cualquier cambio de código debe poder rastrearse a una regla o escenario**.

---

## 14. Herramientas inteligentes (foco del MVP) — PENDIENTE de dividir y plantear

Aún falta el análisis (lenguaje ubicuo, contexto, reglas, casos de uso, criterios de aceptación) antes de programar:

1. **Calculadora de peso máximo (1RM)** — Epley: `1RM = peso × (1 + reps/30)`; peso sugerido por repeticiones objetivo; redondeo hacia abajo de a 2,5 kg; precisa hasta ~10 reps.
2. **Peso sugerido para un ejercicio nuevo** (mismo grupo muscular) — usa historial; rango conservador; se ajusta según desempeño. Requiere `GrupoMuscular` en el dominio y definir qué es "equivalente".
3. **Evaluaciones mensuales** — mediciones (peso corporal, altura, medidas, resistencia, fuerza) + gráficos de evolución.

**Antes de implementar cada una:** definir contexto (¿nuevo bounded context "Progreso/Evaluaciones" o dentro de Sesiones?), términos del lenguaje ubicuo, reglas e invariantes, eventos de dominio, historias con criterios de aceptación (EARS/Gherkin), casos de prueba, OKR con outcome medible, y qué queda fuera del MVP. Las sugerencias son **orientativas**, no reemplazan al entrenador (dejarlo explícito en reglas y UI).

---

## 15. Qué NO hacer (resumen)

- ❌ Reglas de negocio en controller, service o repository.
- ❌ Repository que crea o valida entidades.
- ❌ Domain importando de application/infrastructure/presentation.
- ❌ Importar internals de otro contexto (solo puertos/IDs).
- ❌ Service gigante o un único service del front para todo.
- ❌ `HttpClient` directo en componentes; lógica de negocio en templates.
- ❌ NgRx u otra librería de estado sin autorización del equipo.
- ❌ Factory/Input/Helper "por las dudas" (YAGNI).
- ❌ `synchronize: true` fuera de pruebas; cambios de BD sin migración.
- ❌ Cambiar comportamiento durante el refactor; mezclar funcionalidades nuevas con refactor.
- ❌ Instalar dependencias o cambiar de gestor de paquetes sin permiso (incluye `ng add` / `ng update`).
- ❌ Historias de usuario sin criterios de aceptación, o con detalles de implementación.
- ❌ Deuda técnica sin registrar; "alto/bajo" sin definir.
- ❌ Dejar que la IA decida diseño o invente vocabulario del dominio.

---

## 16. Fase 2 de la reestructuración: guía para las secciones 1 a 7

### 16.1 Estado del código al terminar las Fases 0 y 1

**Ya se borró** (fuera de alcance): membresías, pagos/MercadoPago, gimnasio/multisucursal, horarios, superadmin, planes BASICO/PRO/FULL (`FeatureGuard`) y la entidad `Dia` sin uso. El email es único en todo el sistema. No reintroducir nada de esto.

**Backend (`backend/src/`):**

| Ruta | Qué es | Estado |
|---|---|---|
| `shared/domain/domain-error.ts` | `DomainError` y categorías: `NoEncontradoError` (404), `ConflictoError` (409), `ReglaDeNegocioError` (400), `NoAutorizadoError` (401), `ProhibidoError` (403) | Listo. Usalo en vez de las excepciones HTTP de Nest dentro de domain/application. |
| `shared/domain/entity.ts`, `value-object.ts` | Bases para entidades (igualdad por id) y VOs (inmutables, igualdad por valor) | Listo |
| `shared/infrastructure/domain-error.filter.ts` | Filtro global: traduce `DomainError` a HTTP con el **mismo cuerpo** que Nest (`{ message, error, statusCode }`) | Listo, registrado en `app.setup.ts` |
| `app.setup.ts` | CORS + `ValidationPipe` + filtro; lo usan `main.ts` y los e2e | Listo |
| `contexts/auth/` | **Contexto de ejemplo**: `domain/` (errores + regla "solo ACTIVO inicia sesión"), `application/` (caso de uso `IniciarSesion`), `presentation/` (controller, DTO, guards, `@Roles`), `index.ts` (API pública) | Migrado. **Copiá este patrón.** |
| `contexts/auth/auth-guards.module.ts` | JWT + `JwtAuthGuard` + `RolesGuard`. Lo importan Usuarios y Planes | Separado de `AuthModule` (login) para evitar el ciclo Usuarios ↔ Auth |
| `modules/users/` | Usuarios (código viejo). Expone el puerto `UsuariosQuery` (`usuarios.query.ts`, token `USUARIOS_QUERY`) con implementación `typeorm-usuarios.query.ts` | A migrar (sección 2) |
| `modules/plan-entrenamiento/` | Planes **y** ejercicios/grupos musculares mezclados; service de ~780 líneas | A migrar (secciones 3 y 4) |
| `database/` | `database-options.ts` (conexión compartida app/CLI), `data-source.ts` (CLI), `migrations/`, `seeds/seed.ts` | Listo. `synchronize: false`; la app corre migraciones al arrancar |

**Frontend (`frontend/src/app/`):** todavía organizado por tipo (`pages/`, `core/services/`, `shared/`). Services: `auth-api`, `auth-state`, `users-api` y `plan-entrenamiento-api` (este mezcla ejercicios, grupos musculares y planes). Componentes grandes: `crear-ejercicios.ts` (~880 líneas), `ver-plan.ts` (~740), `mi-plan.ts` (~370). Formularios con `FormsModule` (template-driven) en login, register, crear-ejercicios, crear-plan, editar-plan y ver-plan.

**Red de seguridad:**
- `npm run test:e2e` (backend): **50 tests e2e** que fijan códigos, mensajes y forma de cada respuesta. Si uno se pone rojo, cambiaste comportamiento.
- `npm test` (backend): tests unitarios (`src/**/*.spec.ts`). `ng test --watch=false` (frontend): specs de componentes.
- `npm run lint:check` (backend): lint + **regla de fronteras** (ver 16.4).
- CI: `.github/workflows/ci.yml` corre todo lo anterior en cada PR (e2e contra un Postgres propio del CI).

### 16.2 Cómo migrar un módulo a `contexts/` (receta)

1. **Leé el módulo y listá sus casos de uso** (una acción de dominio = un caso de uso, sección 4.1). Identificá reglas sueltas en services/controllers.
2. **Tests primero:** escribí tests unitarios de las reglas que vas a mover (como `contexts/auth/domain/politica-de-acceso.spec.ts`). Verificá que los e2e del módulo cubran lo que tocás; si falta algo, agregalo **antes** de refactorizar (helper `test/support/test-app.ts`: `Fixtures` crea datos con emails `@gympanel.test` y los borra al final; no borres datos ajenos).
3. **Mové archivos con `git mv`** a `contexts/<ctx>/{domain,application,infrastructure,presentation}` para conservar historial.
4. **Dominio:** entidades/VOs con comportamiento (modelo rico) y errores que extienden las categorías del shared kernel con **el mismo mensaje que hoy**.
5. **Aplicación:** un caso de uso por acción; orquesta (consulta puertos → dominio → repositorio). Sin reglas de negocio, sin TypeORM.
6. **Infraestructura:** entidad TypeORM (mismo `@Entity({ name })` y nombres de columna), repositorio que implementa la interfaz del dominio, adapters de servicios externos.
7. **Presentación:** controller con **las mismas rutas, en el mismo orden** (estáticas antes que `:id`), DTOs con los mismos mensajes de class-validator.
8. **`index.ts`** con la API pública (módulo, puertos, tipos). Si exportar el módulo crea un ciclo de imports, no lo exportes y registralo directo en `app.module.ts` (como `AuthModule`).
9. **Base de datos:** mover una entidad no cambia el esquema. Corré `npm run migration:generate -- src/database/migrations/Verificacion` contra tu base: **no debe generar nada** salvo los 3 `SET DEFAULT` de jsonb de `plan_entrenamiento` (falso positivo conocido, DT-05); si genera otra cosa, cambiaste el esquema sin querer. Borrá el archivo generado.
10. Corré el checklist 16.5 y abrí el PR.

### 16.3 Qué hace cada sección

> Regla de oro (sección 1): **mismas rutas, mismas respuestas, mismos códigos de error**. Nada de funcionalidades nuevas (sesiones, entrenador, días por semana, herramientas inteligentes): eso es la etapa siguiente.

**Sección 1 — Auth + shared kernel** (dueño de `shared/`, `app.module.ts`, `app.setup.ts`, `eslint.config.mjs`)
- Auth ya está migrado. Falta: puerto `HasherContrasenas` con adapter bcrypt (lo usa también el registro de Usuarios → coordinar con la sección 2) y puerto para emitir tokens (hoy `IniciarSesion` usa `JwtService` directo) — DT-01.
- Centralizar el secreto JWT, hoy repetido con fallback `'gympanel-dev-secret'` en 3 lugares — DT-06.
- Revisar todo PR que toque `shared/`; agregar al shared kernel solo lo que usan dos o más contextos.

**Sección 2 — Usuarios (backend)**
- Mover `modules/users` → `contexts/usuarios`. Entidad de dominio `Usuario` con su ciclo de estado (`activar()`, `desactivar()`), VOs `Email`, `EstadoUsuario`, `Rol` (con los valores **actuales** del código: `creado/activo/inactivo`, `CLIENTE/ADMIN`).
- Casos de uso: `RegistrarUsuario`, `CambiarEstado`, `ListarPendientes`, `ListarClientesActivos`, `ObtenerUsuario`, `EliminarUsuario`. Repositorio como interfaz + TypeORM.
- Mantener el puerto `UsuariosQuery` y moverlo a la API pública del contexto; actualizar el import de Auth.
- Hallazgos a resolver: `findCreatedUsers` filtra en memoria (pasar a query), `console.log` de depuración en service y controller (pasar a `Logger` o sacar).
- Coordinar con 4: hoy la asignación de plan vive en `user.plan_entrenamiento_id` y Planes usa el repositorio de usuarios directo (ver 16.6).

**Sección 3 — Ejercicios (backend)**
- **Primer PR junto con la sección 4:** mover `Ejercicio`, `GrupoMuscular`, sus DTOs, endpoints y `SupabaseStorageService` a `contexts/ejercicios`, sin cambiar lógica. Las rutas siguen siendo `/plan-entrenamiento/ejercicios/...` y `/plan-entrenamiento/grupos-musculares...`.
- ⚠️ Con dos controllers bajo el prefijo `plan-entrenamiento`, `GET plan-entrenamiento/:id` (planes) puede tapar a `GET plan-entrenamiento/grupos-musculares` si el módulo de planes se registra antes: **registrá el módulo de ejercicios antes que el de planes en `app.module.ts`** y verificalo con los e2e.
- Entidades con comportamiento (renombrar, normalizar nombre en mayúsculas → VO `NombreEjercicio`). Casos de uso de alta, edición, baja, consulta y subida de imagen.
- Puerto `AlmacenamientoImagenes` con adapter Supabase (hoy está acoplado).
- `EjerciciosQuery` **no hace falta todavía**: hoy crear un plan no valida que los ejercicios existan, y agregarlo cambiaría comportamiento.

**Sección 4 — Planes (backend)**
- Partir `plan-entrenamiento.service.ts` en casos de uso: `CrearPlan`, `EditarPlan`, `EliminarPlan`, `AsignarPlan`, `EditarPlanDeUsuario`, `ConsultarPlanDeUsuario`, `ListarPlanesPredeterminados`.
- Llevar al dominio las reglas sueltas: la semana de 7 posiciones y su validación (`normalizeEjercicios`, `normalizeRepeticiones`, `validateAlignedData` → entidad `PlanEntrenamiento` o VO de semana), predeterminado/editado, "un predeterminado no se borra", "un editado sin usuarios se borra al reasignar".
- `executeWithDbRetry` → infraestructura. Respetar el formato de respuesta de `formatPlanForResponse` (incluye `descripciones_dias` duplicado y los `id` bigint como string): está fijado por los e2e.
- Dejar de usar el repositorio de `User` directo (ver 16.6, coordinar con 2).

**Sección 5 — Frontend: core + Usuarios** (dueño de `app.routes.ts` y `core/`)
- Estructura por feature (sección 6.5): `features/usuarios`, `features/ejercicios`, `features/planes` con `pages/ components/ services/ models/` y rutas lazy.
- Un service por contexto: `AuthService`, `UsuarioService`, `EjercicioService`, `PlanService`. **Partir `plan-entrenamiento-api.service.ts`** en `EjercicioService` (grupos musculares y ejercicios) y `PlanService`; avisar a 6 y 7 antes de mergear.
- Páginas login, register, menús, alta-usuarios, gestion-usuarios: sin lógica de negocio, Reactive Forms tipados (sección 6.4), estado de sesión con signals (6.3).

**Sección 6 — Calidad + Frontend: Ejercicios**
- Mantener e2e y CI; ayudar a las demás secciones a escribir tests de dominio; revisar que cada PR traiga sus tests.
- Cubrir la subida exitosa de imágenes con un doble de `AlmacenamientoImagenes` cuando la sección 3 cree el puerto — DT-03.
- Frontend: componentizar `crear-ejercicios` (~880 líneas): contenedor + presentacionales, Reactive Forms, sin lógica en el template.

**Sección 7 — Persistencia + Frontend: Planes**
- Revisar toda migración y entidad TypeORM de los demás (nombres explícitos, que no se pierdan columnas, paso 9 de 16.2).
- Frontend: crear-plan, editar-plan, asignar-plan, ver-plan, mi-plan. Extraer el "editor de semana" repetido a un componente presentacional. Componentizar `ver-plan` (~740 líneas).
- Decidir con el equipo qué hacer con los planes hardcodeados de `ver-plan` — DT-02 — y corregir el texto con caracteres rotos — DT-04.

### 16.4 Regla de fronteras (ESLint)

`npm run lint:check` falla si:
- Desde fuera de `src/contexts` se importa una capa interna de un contexto (`contexts/<ctx>/domain|application|infrastructure|presentation/...`). Usá `contexts/<ctx>` (su `index.ts`).
- Desde un contexto se importa una capa de **otro** contexto (ej. `../../usuarios/domain/...`). `shared/` sí se puede importar.
- Un archivo de `domain/` (de un contexto o del shared kernel) importa de `application/`, `infrastructure/`, `presentation/`, `@nestjs/*`, `typeorm` o `express`.

Los bloques se generan solos leyendo las carpetas de `src/contexts`: al crear un contexto queda cubierto sin tocar la configuración. **No desactives la regla con `eslint-disable`**; si te bloquea, falta un puerto o la API pública del otro contexto.

### 16.5 Checklist de cada PR (Definition of Done de la Fase 2)

- [ ] Rama corta `refactor/<contexto>-<qué>` desde `develop` actualizado y PR contra `develop` (no contra `main`); commits Conventional Commits.
- [ ] `npm run lint:check`, `npm test`, `npm run build` y `npm run test:e2e` en verde (backend); `ng build` y `ng test --watch=false` en verde (frontend).
- [ ] Ningún e2e modificado para "hacerlo pasar". Si un e2e estaba mal, se discute aparte y se cambia en su propio commit `test:`.
- [ ] Mismas rutas, mismos JSON, mismos códigos y mensajes de error.
- [ ] Reglas nuevas en dominio con su test unitario; casos de uso sin reglas de negocio.
- [ ] Si tocaste entidades TypeORM: `migration:generate` sin cambios reales (16.2, paso 9). Si el esquema cambia **a propósito**, migración nueva en `src/database/migrations` y aviso al equipo (se aplica sola al arrancar el backend: en la base compartida le cambia el esquema a todos, y en producción al deployar `main`).
- [ ] Si tocaste un archivo de otra sección (`app.module.ts`, `app.routes.ts`, `shared/`, API pública de otro contexto), lo aprueba su dueño.
- [ ] Deuda técnica nueva registrada (sección 17) y justificación del cambio en el PR: qué, por qué, alternativas, huella (+/−).

### 16.6 Decisiones pendientes que bloquean coordinación

| Tema | Secciones | Opciones a evaluar (las decide el equipo) |
|---|---|---|
| Dónde vive la asignación de plan (hoy columna `user.plan_entrenamiento_id`, usada por Planes con el repositorio de usuarios) | 2 ↔ 4 | (a) Usuarios expone un puerto para leer/escribir el plan asignado; (b) Planes pasa a ser dueño de la asignación con una tabla propia (requiere migración de datos); (c) dejarlo como está y registrarlo como deuda |
| Hashing de contraseñas compartido entre login y registro | 1 ↔ 2 | Puerto `HasherContrasenas` en el shared kernel o en Usuarios (expuesto a Auth) |
| Orden de registro de módulos con rutas bajo `plan-entrenamiento` | 3 ↔ 4 | Ver la advertencia de la sección 3 |

### 16.7 Comandos útiles (backend)

```bash
npm run start:dev                   # levanta la API (aplica migraciones pendientes al arrancar)
npm run lint:check                  # lint + fronteras (lo que corre el CI)
npm test                            # unitarios
npm run test:e2e                    # e2e contra DATABASE_URL (crean y borran sus propios datos)
npm run migration:show              # migraciones aplicadas/pendientes
npm run migration:generate -- src/database/migrations/<Nombre>
npm run seed                        # admin inicial (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
```
Variables de entorno: `backend/.env.example`.

---

## 17. Deuda técnica conocida (pasar al tablero)

| ID | Título | Tipo / Área | Detalle | Sección que la toma |
|---|---|---|---|---|
| DT-01 | Auth usa bcrypt y JwtService directo | Arquitectónica / backend | `IniciarSesion` depende de implementaciones concretas; falta puerto de hashing y de emisión de tokens | 1 (y 2 para el registro) |
| DT-02 | Planes hardcodeados en `ver-plan` | Código muerto / frontend | Se filtraban por la frecuencia de la membresía (eliminada); la sección ya no se muestra | 7 |
| DT-03 | Sin test de subida exitosa de imágenes | Pruebas / backend | El e2e no llama a Supabase Storage; cubrir con un doble del puerto `AlmacenamientoImagenes` | 6 (cuando 3 cree el puerto) |
| DT-04 | Texto con caracteres rotos en `ver-plan` | Calidad / frontend | "Â¿Confirmar asignaciÃ³n..." (encoding) | 7 |
| DT-05 | Falso positivo de TypeORM en defaults jsonb | Herramientas / BD | `schema:log`/`migration:generate` siempre proponen 3 `SET DEFAULT` en `plan_entrenamiento`; ignorarlos | 7 |
| DT-06 | Secreto JWT con fallback repetido | Seguridad / backend | `'gympanel-dev-secret'` en 3 lugares; en producción debe fallar si falta `JWT_SECRET` | 1 |
| DT-07 | Lenguaje ubicuo distinto entre análisis y código | Lenguaje ubicuo | Cliente/Entrenador/BAJA (análisis) vs `User`/`ADMIN`/`inactivo` (código); se alinea en la etapa de funcionalidades | Equipo |
| DT-08 | Variables de entorno sin uso en Railway | Configuración | `MERCADOPAGO_*`, `GYM_SETUP_SECRET`, `BACKEND_URL`, `FRONTEND_URL` | Equipo |
| DT-09 | `user_role_enum` puede conservar `SUPERADMIN` en bases viejas | BD | Postgres no permite borrar un valor de enum sin recrear el tipo; no afecta al código | 7 |
| DT-10 | Tests unitarios con `--passWithNoTests` | Pruebas | Quitar el flag cuando haya tests en todos los contextos | 6 |
