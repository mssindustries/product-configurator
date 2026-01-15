"""
Application configuration using Pydantic Settings.
Loads configuration from environment variables.
"""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # API Settings
    api_title: str = "MSS Industries Product Configurator API"
    api_version: str = "0.1.0"
    api_description: str = "B2B 3D product configurator platform API"

    # Database Settings
    database_url: str = Field(
        default="sqlite+aiosqlite:///./configurator.db",
        description="Database connection URL (SQLite with aiosqlite driver)",
    )

    # Azure Storage Settings
    azure_storage_connection_string: str = Field(
        default="UseDevelopmentStorage=true",
        description="Azure Blob Storage connection string",
    )

    # Blender Settings
    blender_path: str = Field(
        default="/usr/bin/blender",
        description="Path to Blender executable",
    )
    blender_max_concurrent: int = Field(
        default=2,
        description="Maximum concurrent Blender processes",
    )
    blender_timeout_seconds: int = Field(
        default=300,
        description="Blender process timeout in seconds",
    )

    # CORS Settings
    cors_origins: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        description="Allowed CORS origins",
    )

    # Server Settings
    host: str = Field(
        default="0.0.0.0",
        description="Server host",
    )
    port: int = Field(
        default=8000,
        description="Server port",
    )
    reload: bool = Field(
        default=False,
        description="Enable auto-reload for development",
    )


# Global settings instance
settings = Settings()
