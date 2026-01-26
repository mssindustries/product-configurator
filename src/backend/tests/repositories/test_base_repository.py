"""
Tests for BaseRepository ensure_unique method.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EntityAlreadyExistsError
from app.db.models import Client, Product, Style
from app.repositories.client import ClientRepository
from app.repositories.style import StyleRepository


@pytest.mark.asyncio
async def test_ensure_unique_success_no_duplicates(db_session: AsyncSession) -> None:
    """Test ensure_unique succeeds when no duplicate exists."""
    repo = ClientRepository(db_session)

    # Should not raise - no duplicate exists
    await repo.ensure_unique("name", "Unique Client")


@pytest.mark.asyncio
async def test_ensure_unique_raises_when_duplicate_exists(
    db_session: AsyncSession,
) -> None:
    """Test ensure_unique raises EntityAlreadyExistsError when duplicate exists."""
    # Create a client
    client = Client(name="Existing Client")
    db_session.add(client)
    await db_session.commit()

    # Try to create another with same name
    repo = ClientRepository(db_session)
    with pytest.raises(EntityAlreadyExistsError) as exc_info:
        await repo.ensure_unique("name", "Existing Client")

    # Verify exception details
    assert exc_info.value.entity_name == "Client"
    assert exc_info.value.field_name == "name"
    assert exc_info.value.field_value == "Existing Client"
    assert "Client with name 'Existing Client' already exists" in str(exc_info.value)


@pytest.mark.asyncio
async def test_ensure_unique_with_exclude_id(db_session: AsyncSession) -> None:
    """Test ensure_unique with exclude_id allows updating without conflict."""
    # Create a client
    client = Client(name="Original Name")
    db_session.add(client)
    await db_session.commit()
    await db_session.refresh(client)

    # Should not raise - excluding the current client's ID
    repo = ClientRepository(db_session)
    await repo.ensure_unique("name", "Original Name", exclude_id=client.id)


@pytest.mark.asyncio
async def test_ensure_unique_with_exclude_id_still_detects_other_duplicates(
    db_session: AsyncSession,
) -> None:
    """Test ensure_unique with exclude_id still detects duplicates in other records."""
    # Create two clients
    client1 = Client(name="Client One")
    client2 = Client(name="Client Two")
    db_session.add_all([client1, client2])
    await db_session.commit()
    await db_session.refresh(client1)
    await db_session.refresh(client2)

    # Try to update client1 to have client2's name
    repo = ClientRepository(db_session)
    with pytest.raises(EntityAlreadyExistsError) as exc_info:
        await repo.ensure_unique("name", "Client Two", exclude_id=client1.id)

    assert exc_info.value.field_value == "Client Two"


@pytest.mark.asyncio
async def test_ensure_unique_with_scope_filters(db_session: AsyncSession) -> None:
    """Test ensure_unique with scope_filters for scoped uniqueness."""
    # Create a client first
    client = Client(name="Test Client")
    db_session.add(client)
    await db_session.commit()
    await db_session.refresh(client)

    # Create two products
    product1 = Product(name="Product 1", client_id=str(client.id))
    product2 = Product(name="Product 2", client_id=str(client.id))
    db_session.add_all([product1, product2])
    await db_session.commit()
    await db_session.refresh(product1)
    await db_session.refresh(product2)

    # Create a style for product1
    style1 = Style(
        product_id=str(product1.id),
        name="Style A",
        blend_file_url="https://example.com/style1.blend",
        customization_schema={},
    )
    db_session.add(style1)
    await db_session.commit()

    # Should succeed - same name but different product (scope)
    repo = StyleRepository(db_session)
    await repo.ensure_unique(
        "name",
        "Style A",
        scope_filters=[Style.product_id == str(product2.id)],
    )


@pytest.mark.asyncio
async def test_ensure_unique_with_scope_filters_detects_duplicates_in_scope(
    db_session: AsyncSession,
) -> None:
    """Test ensure_unique with scope_filters detects duplicates within the scope."""
    # Create a client first
    client = Client(name="Test Client")
    db_session.add(client)
    await db_session.commit()
    await db_session.refresh(client)

    # Create a product
    product = Product(name="Product 1", client_id=str(client.id))
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)

    # Create a style
    style = Style(
        product_id=str(product.id),
        name="Style A",
        blend_file_url="https://example.com/style.blend",
        customization_schema={},
    )
    db_session.add(style)
    await db_session.commit()

    # Try to create another style with same name for same product
    repo = StyleRepository(db_session)
    with pytest.raises(EntityAlreadyExistsError) as exc_info:
        await repo.ensure_unique(
            "name",
            "Style A",
            scope_filters=[Style.product_id == str(product.id)],
        )

    assert exc_info.value.entity_name == "Style"
    assert exc_info.value.field_name == "name"
    assert exc_info.value.field_value == "Style A"


@pytest.mark.asyncio
async def test_ensure_unique_with_scope_filters_and_exclude_id(
    db_session: AsyncSession,
) -> None:
    """Test ensure_unique with both scope_filters and exclude_id."""
    # Create a client first
    client = Client(name="Test Client")
    db_session.add(client)
    await db_session.commit()
    await db_session.refresh(client)

    # Create a product
    product = Product(name="Product 1", client_id=str(client.id))
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)

    # Create a style
    style = Style(
        product_id=str(product.id),
        name="Style A",
        blend_file_url="https://example.com/style.blend",
        customization_schema={},
    )
    db_session.add(style)
    await db_session.commit()
    await db_session.refresh(style)

    # Should not raise - updating the same style with same name
    repo = StyleRepository(db_session)
    await repo.ensure_unique(
        "name",
        "Style A",
        exclude_id=style.id,
        scope_filters=[Style.product_id == str(product.id)],
    )


@pytest.mark.asyncio
async def test_ensure_unique_case_sensitive(db_session: AsyncSession) -> None:
    """Test ensure_unique is case-sensitive (database default behavior)."""
    # Create a client with lowercase name
    client = Client(name="test client")
    db_session.add(client)
    await db_session.commit()

    # Should succeed with different case (case-sensitive check)
    repo = ClientRepository(db_session)
    await repo.ensure_unique("name", "Test Client")
