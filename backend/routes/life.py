from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from uuid import uuid4

from ..db import get_conn
from .security import get_user_id

router = APIRouter(prefix='', tags=['life'])


class LifeConsumeRequest(BaseModel):
    fortune_type_key: str


class RewardAdRequest(BaseModel):
    ad_provider: str
    placement: str
    reward_amount: int = 2


@router.get('/life')
def get_life(user_id: str = Depends(get_user_id)):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT current_life, max_life, updated_at FROM user_lives WHERE user_id = %s', (user_id,))
            row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail='Life not found')

    return {'current_life': row[0], 'max_life': row[1], 'updated_at': row[2]}


@router.post('/life/consume')
def consume_life(payload: LifeConsumeRequest, user_id: str = Depends(get_user_id)):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT current_life FROM user_lives WHERE user_id = %s FOR UPDATE', (user_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail='Life not found')
            if row[0] <= 0:
                raise HTTPException(status_code=409, detail='Life is empty')

            cur.execute(
                'UPDATE user_lives SET current_life = current_life - 1, updated_at = now() WHERE user_id = %s RETURNING current_life, max_life, updated_at',
                (user_id,),
            )
            updated = cur.fetchone()
            cur.execute(
                'INSERT INTO life_events (id, user_id, event_type, amount, reason) VALUES (%s, %s, %s, %s, %s)',
                (str(uuid4()), user_id, 'consume', -1, f'manual_consume:{payload.fortune_type_key}'),
            )
            conn.commit()

    return {'current_life': updated[0], 'max_life': updated[1], 'updated_at': updated[2]}


@router.post('/ads/reward/complete')
def reward_ad(payload: RewardAdRequest, user_id: str = Depends(get_user_id)):
    with get_conn() as conn:
        with conn.cursor() as cur:
            ad_event_id = str(uuid4())
            cur.execute(
                'INSERT INTO ad_events (id, user_id, ad_type, provider, placement, rewarded, reward_amount) VALUES (%s, %s, %s, %s, %s, %s, %s)',
                (ad_event_id, user_id, 'reward', payload.ad_provider, payload.placement, True, payload.reward_amount),
            )
            cur.execute(
                'UPDATE user_lives SET current_life = LEAST(current_life + %s, max_life), updated_at = now() WHERE user_id = %s RETURNING current_life, max_life, updated_at',
                (payload.reward_amount, user_id),
            )
            updated = cur.fetchone()
            cur.execute(
                'INSERT INTO life_events (id, user_id, event_type, amount, reason, related_ad_event_id) VALUES (%s, %s, %s, %s, %s, %s)',
                (str(uuid4()), user_id, 'recover', payload.reward_amount, 'reward_ad', ad_event_id),
            )
            conn.commit()

    return {'current_life': updated[0], 'max_life': updated[1], 'updated_at': updated[2]}
