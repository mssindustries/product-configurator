"""
API v1 router aggregation.
"""

from fastapi import APIRouter

# Create v1 router
router = APIRouter(prefix="/api/v1")

# Import and include route modules here
# Example:
# from app.api.v1.routes import products, configurations, jobs
# router.include_router(products.router, prefix="/products", tags=["products"])
# router.include_router(configurations.router, prefix="/configurations", tags=["configurations"])
# router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
