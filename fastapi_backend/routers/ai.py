from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from fastapi_backend.services.ai_service import AIService
from fastapi_backend.core.security import require_roles, TokenPayload

router = APIRouter(prefix="/ai", tags=["Google AI Studio Integration"])

class BulletinInsightRequest(BaseModel):
    student_name: str
    program_name: str
    grades_summary: list[dict]

class AtRiskAnalysisRequest(BaseModel):
    students_data: list[dict]

@router.post("/bulletin-insight")
async def generate_bulletin_insight(
    payload: BulletinInsightRequest,
    current_user: TokenPayload = Depends(require_roles(["Admin", "Coordinador", "Docente", "Estudiante"]))
):
    try:
        insight = await AIService.generate_academic_bulletin_insight(
            student_name=payload.student_name,
            program_name=payload.program_name,
            grades_summary=payload.grades_summary
        )
        return {"insight": insight}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en Google AI Studio: {str(e)}")

@router.post("/at-risk-analysis")
async def analyze_at_risk(
    payload: AtRiskAnalysisRequest,
    current_user: TokenPayload = Depends(require_roles(["Admin", "Coordinador", "Docente"]))
):
    try:
        analysis = await AIService.analyze_at_risk_students(payload.students_data)
        return {"analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en Google AI Studio: {str(e)}")
