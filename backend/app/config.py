from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    cors_origins: str = "http://localhost:5173"
    # Autorise toutes les URLs Vercel du projet (production + prévisualisations),
    # dont l'URL change à chaque déploiement.
    cors_origin_regex: str = r"https://compliance-audit-system.*\.vercel\.app"
    upload_dir: str = "uploads"
    demo_password: str = "Demo1234!"
    # IA — fournisseur gratuit (Groq) prioritaire, Anthropic en option payante.
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    anthropic_api_key: str = ""
    ai_model: str = "claude-opus-4-8"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
