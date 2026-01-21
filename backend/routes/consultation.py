from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from uuid import uuid4

from ..db import get_conn
from .security import get_user_id

router = APIRouter(prefix='/consultation', tags=['consultation'])


class ConsultationRequest(BaseModel):
    contact_type: str
    contact_value: str
    message: str | None = None


@router.post('')
def request_consultation(payload: ConsultationRequest, user_id: str = Depends(get_user_id)):
    if not payload.contact_type or not payload.contact_value:
        raise HTTPException(status_code=400, detail='Missing contact_type or contact_value')

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'INSERT INTO consultation_requests (id, user_id, contact_type, contact_value, message) VALUES (%s, %s, %s, %s, %s)',
                (str(uuid4()), user_id, payload.contact_type, payload.contact_value, payload.message),
            )
            conn.commit()

    return {'ok': True}
