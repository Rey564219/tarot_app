from fastapi import APIRouter

from ..db import get_conn

router = APIRouter(prefix='/master', tags=['master'])


@router.get('/fortune-types')
def list_fortune_types():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT id, key, name, access_type_default, requires_warning, description FROM fortune_types ORDER BY key'
            )
            rows = cur.fetchall()

    return [
        {
            'id': r[0],
            'key': r[1],
            'name': r[2],
            'access_type_default': r[3],
            'requires_warning': r[4],
            'description': r[5],
        }
        for r in rows
    ]


@router.get('/products')
def list_products():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT id, product_key, fortune_type_id, name, price_cents, currency, platform, active FROM products WHERE active = true ORDER BY product_key'
            )
            rows = cur.fetchall()

    return [
        {
            'id': r[0],
            'product_key': r[1],
            'fortune_type_id': r[2],
            'name': r[3],
            'price_cents': r[4],
            'currency': r[5],
            'platform': r[6],
            'active': r[7],
        }
        for r in rows
    ]


@router.get('/affiliate-links')
def list_affiliate_links():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT id, title, url, provider, active FROM affiliate_links WHERE active = true ORDER BY created_at'
            )
            rows = cur.fetchall()

    return [
        {
            'id': r[0],
            'title': r[1],
            'url': r[2],
            'provider': r[3],
            'active': r[4],
        }
        for r in rows
    ]
