from fastapi import FastAPI

from .routes import auth, master, life, readings, warnings, billing, affiliate, consultation


def create_app() -> FastAPI:
    app = FastAPI(title='Tarot App API')
    app.include_router(auth.router)
    app.include_router(master.router)
    app.include_router(life.router)
    app.include_router(readings.router)
    app.include_router(warnings.router)
    app.include_router(billing.router)
    app.include_router(affiliate.router)
    app.include_router(consultation.router)
    return app


app = create_app()
