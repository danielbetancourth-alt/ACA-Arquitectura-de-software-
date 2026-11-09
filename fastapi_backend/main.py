from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi_backend.core.config import settings
from fastapi_backend.database.session import engine
from fastapi_backend.database.models import Base
from fastapi_backend.routers import auth, students, teachers, academic, grades, reports, audit, ai

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización de tablas en PostgreSQL si no existen (DDL inicial)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Desconexión del motor de persistencia
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend Monolito Modular en capas para el Sistema de Gestión Académica (SGA) con persistencia ACID, Auditoría desacoplada y Google AI Studio.",
    lifespan=lifespan
)

# RNF-12: Compatibilidad y CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# RNF-11: Tolerancia a fallos y manejo global de excepciones
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Error interno en el servidor",
            "detail": str(exc),
            "path": request.url.path,
        }
    )

# RNF-04: Health Check para Alta Disponibilidad
@app.get("/health", tags=["Salud del Sistema"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "PostgreSQL ACID Connected",
        "gemini_model": settings.GEMINI_MODEL
    }

# Montar Routers Modulares
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(students.router, prefix=settings.API_V1_STR)
app.include_router(teachers.router, prefix=settings.API_V1_STR)
app.include_router(academic.router, prefix=settings.API_V1_STR)
app.include_router(grades.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_backend.main:app", host="0.0.0.0", port=8000, reload=True)
