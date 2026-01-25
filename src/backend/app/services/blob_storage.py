"""
Azure Blob Storage service for file uploads.

Provides async methods for uploading, deleting, and accessing files
in Azure Blob Storage. Uses Azurite for local development.
"""

import logging
from typing import BinaryIO

from azure.core.exceptions import ResourceNotFoundError
from azure.storage.blob import ContentSettings
from azure.storage.blob.aio import BlobServiceClient

from app.core.config import settings

logger = logging.getLogger(__name__)

# Container name for Blender template files
BLENDER_TEMPLATES_CONTAINER = "blender-templates"


class BlobStorageService:
    """
    Service for managing files in Azure Blob Storage.

    Supports async operations for upload, delete, and URL generation.
    Automatically creates containers if they don't exist.
    """

    def __init__(self, connection_string: str | None = None):
        """
        Initialize the blob storage service.

        Args:
            connection_string: Azure Storage connection string.
                             Defaults to settings.azure_storage_connection_string.
        """
        self.connection_string = (
            connection_string or settings.azure_storage_connection_string
        )

    async def _get_client(self) -> BlobServiceClient:
        """Create and return a BlobServiceClient."""
        return BlobServiceClient.from_connection_string(self.connection_string)

    async def _ensure_container_exists(
        self, client: BlobServiceClient, container_name: str
    ) -> None:
        """Create container if it doesn't exist."""
        container_client = client.get_container_client(container_name)
        try:
            await container_client.get_container_properties()
        except ResourceNotFoundError:
            logger.info(f"Creating container: {container_name}")
            await container_client.create_container()

    async def upload_file(
        self,
        file: BinaryIO,
        blob_name: str,
        container_name: str = BLENDER_TEMPLATES_CONTAINER,
        content_type: str = "application/octet-stream",
    ) -> str:
        """
        Upload a file to blob storage.

        Args:
            file: File-like object to upload
            blob_name: Name for the blob (e.g., "{style_id}.blend")
            container_name: Container to upload to (default: blender-templates)
            content_type: MIME type for the file

        Returns:
            Full blob path: "{container_name}/{blob_name}"

        Raises:
            Exception: If upload fails
        """
        async with await self._get_client() as client:
            await self._ensure_container_exists(client, container_name)

            blob_client = client.get_blob_client(
                container=container_name, blob=blob_name
            )

            # Reset file pointer to beginning
            file.seek(0)

            # Upload the file
            await blob_client.upload_blob(
                file,
                overwrite=True,
                content_settings=ContentSettings(content_type=content_type),
            )

            logger.info(f"Uploaded blob: {container_name}/{blob_name}")
            return f"{container_name}/{blob_name}"

    async def delete_file(
        self,
        blob_name: str,
        container_name: str = BLENDER_TEMPLATES_CONTAINER,
    ) -> bool:
        """
        Delete a file from blob storage.

        Args:
            blob_name: Name of the blob to delete
            container_name: Container containing the blob

        Returns:
            True if deleted, False if not found
        """
        async with await self._get_client() as client:
            blob_client = client.get_blob_client(
                container=container_name, blob=blob_name
            )

            try:
                await blob_client.delete_blob()
                logger.info(f"Deleted blob: {container_name}/{blob_name}")
                return True
            except ResourceNotFoundError:
                logger.warning(
                    f"Blob not found for deletion: {container_name}/{blob_name}"
                )
                return False

    async def get_file_url(
        self,
        blob_name: str,
        container_name: str = BLENDER_TEMPLATES_CONTAINER,
    ) -> str:
        """
        Get the URL for a blob.

        Note: This returns the direct URL. For production, you may want to
        generate SAS tokens for secured access.

        Args:
            blob_name: Name of the blob
            container_name: Container containing the blob

        Returns:
            URL to access the blob
        """
        async with await self._get_client() as client:
            blob_client = client.get_blob_client(
                container=container_name, blob=blob_name
            )
            return blob_client.url

    async def file_exists(
        self,
        blob_name: str,
        container_name: str = BLENDER_TEMPLATES_CONTAINER,
    ) -> bool:
        """
        Check if a file exists in blob storage.

        Args:
            blob_name: Name of the blob to check
            container_name: Container to check in

        Returns:
            True if file exists, False otherwise
        """
        async with await self._get_client() as client:
            blob_client = client.get_blob_client(
                container=container_name, blob=blob_name
            )

            try:
                await blob_client.get_blob_properties()
                return True
            except ResourceNotFoundError:
                return False
