from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from uuid import uuid4

from ..db import get_conn
from .security import get_user_id

router = APIRouter(prefix='/warnings', tags=['warnings'])


class WarningRequest(BaseModel):
    fortune_type_key: str
    ip: str | None = None
    user_agent: str | None = None


@router.post('/accept')
def accept_warning(payload: WarningRequest, user_id: str = Depends(get_user_id)):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT id FROM fortune_types WHERE key = %s', (payload.fortune_type_key,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail='Fortune type not found')
            fortune_type_id = row[0]
            cur.execute(
                'INSERT INTO warnings_acceptance (id, user_id, fortune_type_id, ip, user_agent) VALUES (%s, %s, %s, %s, %s)',
                (str(uuid4()), user_id, fortune_type_id, payload.ip, payload.user_agent),
            )
            conn.commit()

    return {'ok': True}
