from fastapi import APIRouter
from .clients import router as clients_router
from .intake import router as intake_router
from .auth import router as auth_router

router = APIRouter()

# Include route modules
router.include_router(auth_router, tags=["Authentication"])
router.include_router(clients_router, prefix="/clients", tags=["clients"])
router.include_router(intake_router, prefix="/intake", tags=["intake"])

# Add more routes as needed:
# from .appointments import router as appointments_router
# from .services import router as services_router
# router.include_router(appointments_router, prefix="/appointments", tags=["appointments"])
# router.include_router(services_router, prefix="/services", tags=["services"])