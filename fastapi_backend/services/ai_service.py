import os
from google import genai
from fastapi_backend.core.config import settings

class AIService:
    @staticmethod
    def get_client() -> genai.Client:
        """Inicializa el cliente de Google GenAI usando la API Key inyectada"""
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        return genai.Client(api_key=api_key)

    @classmethod
    async def generate_academic_bulletin_insight(
        cls, student_name: str, program_name: str, grades_summary: list[dict]
    ) -> str:
        """
        Genera una evaluación pedagógica cualitativa y recomendaciones
        de mejora académica para el boletín oficial del estudiante.
        """
        client = cls.get_client()
        prompt = f"""
        Actúa como Decano Académico y Mentor Pedagógico de Educación Superior.
        Genera un análisis formativo, constructivo y motivacional para el Boletín Académico de:
        - Estudiante: {student_name}
        - Programa Académico: {program_name}
        - Calificaciones actuales: {grades_summary}

        Estructura tu respuesta en:
        1. Diagnóstico del Rendimiento Semestral (análisis de fortalezas y áreas de mejora).
        2. Plan de Acción y Recomendaciones de Aprendizaje.
        3. Mensaje Institucional de Motivación y Compromiso Académico.

        Sé conciso, empático y formal (máximo 250 palabras).
        """
        response = client.models.generateContent(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )
        return response.text or "No se pudo generar la síntesis pedagógica."

    @classmethod
    async def analyze_at_risk_students(cls, students_data: list[dict]) -> str:
        """
        Analiza cohortes de estudiantes para identificar riesgos de deserción
        o pérdida de calidad académica y sugiere intervenciones inmediatas.
        """
        client = cls.get_client()
        prompt = f"""
        Como especialista en retención universitaria y analítica de aprendizaje,
        analiza los siguientes datos de estudiantes que presentan calificaciones inferiores a 3.0:
        {students_data}

        Proporciona:
        1. Categorización de riesgo (Alto, Medio, Moderado).
        2. Estrategia de intervención docente recomendada (tutorías par, refuerzo conceptual, apoyo psicopedagógico).
        3. Indicadores de seguimiento para la coordinación de programa.
        """
        response = client.models.generateContent(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )
        return response.text or "No se pudo generar el análisis de riesgo."
