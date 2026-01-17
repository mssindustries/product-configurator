"""
API v1 router aggregation.
"""

from fastapi import APIRouter

from app.api.v1.routes import configurations, products

# Create v1 router
router = APIRouter(prefix="/api/v1")

# Include route modules
router.include_router(products.router, prefix="/products", tags=["products"])
router.include_router(
    configurations.router, prefix="/configurations", tags=["configurations"]
)
