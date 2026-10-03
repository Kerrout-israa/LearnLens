from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "LearnLens API"
    database_url: str = "sqlite:///./learnlens.db"
    upload_dir: str = "./uploads"
    max_pdf_mb: int = 10
    cors_origins: str = "*"

    ai_mode: str = "live"
    ai_provider: str = "gemini"
    ai_api_key: str = ""
    ai_model: str = "gemini-2.0-flash"
    ai_timeout_seconds: int = 45

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()