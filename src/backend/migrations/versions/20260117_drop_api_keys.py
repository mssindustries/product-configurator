"""drop api_keys table

Revision ID: 20260117_drop_api_keys
Revises: 68727358918b
Create Date: 2026-01-17

Removes the api_keys table as API key authentication has been deferred.
Authentication will be implemented later using user sessions/JWT.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20260117_drop_api_keys'
down_revision: Union[str, Sequence[str]] = '68727358918b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop the api_keys table."""
    op.drop_index(op.f('ix_api_keys_client_id'), table_name='api_keys')
    op.drop_table('api_keys')


def downgrade() -> None:
    """Recreate the api_keys table."""
    op.create_table('api_keys',
        sa.Column('client_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('key_hash', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
        sa.Column('last_used_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], name=op.f('fk_api_keys_client_id_clients'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_api_keys'))
    )
    op.create_index(op.f('ix_api_keys_client_id'), 'api_keys', ['client_id'], unique=False)
