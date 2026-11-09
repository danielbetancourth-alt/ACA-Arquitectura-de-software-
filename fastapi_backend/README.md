# Sistema de Gestión Académica (SGA) - Backend FastAPI

Arquitectura en Capas (**Monolito Modular**) con persistencia de datos relacional (**PostgreSQL / ACID**), lógica de negocio transaccional, módulo de auditoría desacoplado basado en eventos e integración con **Google AI Studio (Gemini 3.8 Flash)**.

---

## 🏛️ Arquitectura de Software: Monolito Modular

El sistema se estructura en capas de responsabilidad única y desacopladas en memoria:

```
┌────────────────────────────────────────────────────────┐
│             Capa de Presentación / API                 │
│  - FastAPI Routers (auth, students, teachers, grades)  │
│  - Pydantic DTOs y validación de esquemas              │
│  - Swagger / OpenAPI automatizado                      │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│          Capa de Casos de Uso / Servicios              │
│  - AcademicService (Matrícula atómica, Calificaciones) │
│  - AIService (Google GenAI Gemini 3.8 Flash)          │
│  - RBAC Security Guard (Admin, Coord, Docente, Est)    │
└──────────────┬───────────────────────────┬─────────────┘
               │                           │ (Dispara Eventos)
┌──────────────▼─────────────┐   ┌─────────▼─────────────┐
│      Capa de Dominio       │   │  Módulo de Auditoría  │
│  - Invariantes de Negocio  │   │  Desacoplado (Bus)    │
│  - Notas 0.0 - 5.0         │   │  - EventBus en memoria│
│  - Cupos no excedidos      │   │  - Registro inmutable │
└──────────────┬─────────────┘   │  - Hash SHA-256       │
               │                 └─────────┬─────────────┘
┌──────────────▼───────────────────────────▼─────────────┐
│      Capa de Persistencia e Infraestructura (ACID)     │
│  - PostgreSQL 16 con SQLAlchemy 2.0 (Async/Sync)       │
│  - Bloqueo de filas 'SELECT ... FOR UPDATE' (RNF-03)   │
│  - Transacciones con Begin, Commit y Rollback          │
└────────────────────────────────────────────────────────┘
```

---

## 📋 Matriz de Requerimientos Funcionales (RF)

| Requerimiento | Descripción | Implementación |
|---|---|---|
| **RF-01** | Autenticación JWT | `routers/auth.py`, `core/security.py` (Tokens Bearer HS256 firmados). |
| **RF-02** | Roles y Permisos (RBAC) | Dependencia `require_roles(["Admin", "Coordinador", "Docente", "Estudiante"])`. |
| **RF-03** | CRUD Estudiantes | `routers/students.py` con creación sincronizada de usuario y perfil. |
| **RF-04** | CRUD Docentes | `routers/teachers.py` con especialidad y departamento académico. |
| **RF-05** | Programas y Asignaturas | `database/models.py`, `routers/academic.py` con créditos y prerrequisitos. |
| **RF-06** | Periodos Lectivos y Horarios | Catálogo de calendarios y franjas horarias con gestión de cupos máximos. |
| **RF-07** | Matrícula con Cupos | `AcademicService.enroll_student_atomic()` con verificación y decremento atómico. |
| **RF-08** | Registro de Calificaciones | Calificaciones de 0.0 a 5.0 (C1 30%, C2 30%, C3 40%) con CheckConstraints. |
| **RF-09** | Historial y Notas | `routers/reports.py` con promedio ponderado acumulado (PPA). |
| **RF-10** | Reportes y Boletines | Boletín Oficial con síntesis formativa y código QR de validación. |
| **RF-11** | Notificaciones | Registro de alertas clave en `notifications` por eventos del sistema. |
| **RF-12** | Bitácora de Auditoría | Módulo desacoplado en `audit/service.py` con diff de estados (before/after). |

---

## 🛡️ Matriz de Requerimientos No Funcionales (RNF)

- **RNF-01 (Seguridad)**: Cifrado bcrypt de contraseñas, tokens JWT con expiración estricta y protección Bearer.
- **RNF-02 (Rendimiento)**: Respuestas < 3 segundos gracias a consultas asíncronas indexadas en PostgreSQL.
- **RNF-03 (Concurrencia)**: Soporte para hasta 300 usuarios simultáneos mediante bloqueos a nivel de fila `SELECT ... FOR UPDATE` en transacciones de matrícula para prevenir sobrecupo.
- **RNF-04 (Alta Disponibilidad)**: Endpoint `/health` para sondas Liveness/Readiness y contenedor Dockerizado.
- **RNF-05 (Mantenibilidad)**: Monolito modular desacoplado en memoria mediante Event Bus.
- **RNF-06 (Escalabilidad)**: Arquitectura stateless preparada para escalar horizontalmente detrás de un balanceador.
- **RNF-07 (Integridad ACID)**: Restricciones de integridad referencial (Foreign Keys), Check Constraints de rango y reversión en caso de error.
- **RNF-08 (Usabilidad)**: API RESTful autodocumentada mediante OpenAPI / Swagger UI.
- **RNF-09 (Portabilidad)**: Estándares HTTP/JSON universales accesibles desde navegadores web modernos.
- **RNF-10 (Trazabilidad)**: Bitácora inmutable con hash SHA-256 de integridad por cada mutación.
- **RNF-11 (Tolerancia a Fallos)**: Manejador global de excepciones con respuestas estructuradas HTTP 500/400.
- **RNF-12 (Compatibilidad)**: Middlewares CORS preconfigurados y tipos Pydantic normalizados.

---

## 🚀 Despliegue Rápido con Docker

```bash
# 1. Configurar variables de entorno en .env
cp .env.example .env

# 2. Levantar servicios con Docker Compose
docker-compose up --build -d

# 3. Acceder a la documentación Swagger UI
# http://localhost:8000/docs
```
