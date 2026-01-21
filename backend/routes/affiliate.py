from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from uuid import uuid4

from ..db import get_conn
from .security import get_user_id

router = APIRouter(prefix='/affiliate', tags=['affiliate'])


class AffiliateClickRequest(BaseModel):
    affiliate_link_id: str
    placement: str | None = None


@router.post('/click')
def track_click(payload: AffiliateClickRequest, user_id: str = Depends(get_user_id)):
    if not payload.affiliate_link_id:
        raise HTTPException(status_code=400, detail='Missing affiliate_link_id')

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'INSERT INTO affiliate_clicks (id, user_id, affiliate_link_id, placement) VALUES (%s, %s, %s, %s)',
                (str(uuid4()), user_id, payload.affiliate_link_id, payload.placement),
            )
            conn.commit()

    return {'ok': True}
