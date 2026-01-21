from contextlib import contextmanager
from psycopg_pool import ConnectionPool
from .config import DATABASE_URL

_pool = ConnectionPool(conninfo=DATABASE_URL) if DATABASE_URL else None


@contextmanager
def get_conn():
    if _pool is None:
        raise RuntimeError('DATABASE_URL is not set')
    with _pool.connection() as conn:
        yield conn
