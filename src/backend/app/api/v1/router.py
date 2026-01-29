"""
API v1 router aggregation.
"""

from fastapi import APIRouter

from app.api.v1.routes import clients, jobs, product_customizations, products, styles

# Create v1 router
router: APIRouter = APIRouter(prefix="/api/v1")

# Include route modules
router.include_router(clients.router, prefix="/clients", tags=["clients"])
router.include_router(products.router, prefix="/products", tags=["products"])
# Styles are nested under products
router.include_router(
    styles.router, prefix="/products/{product_id}/styles", tags=["styles"]
)
router.include_router(
    product_customizations.router, prefix="/product-customizations", tags=["product-customizations"]
)
router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
