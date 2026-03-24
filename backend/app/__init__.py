import os
import logging
from datetime import timedelta
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
jwt = JWTManager()
mail = Mail()
migrate = Migrate()


def _resolve_database_uri(base_dir: Path) -> str:
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url

    db_provider = (os.getenv("DB_PROVIDER") or "sqlite").strip().lower()
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST", "localhost")
    db_name = os.getenv("DB_NAME")

    if db_provider == "mysql" and db_user and db_password and db_name:
        encoded_password = quote_plus(db_password)
        return f"mysql+pymysql://{db_user}:{encoded_password}@{db_host}/{db_name}"

    sqlite_path = base_dir / "attendify.db"
    return f"sqlite:///{sqlite_path.as_posix()}"


def create_app() -> Flask:
    backend_dir = Path(__file__).resolve().parents[1]
    # In dev, override inherited env so edits to `backend/.env` take effect
    # even under Flask's reloader.
    loaded_env = load_dotenv(backend_dir / ".env", override=True)
    if not loaded_env:
        load_dotenv(override=True)

    upload_dir = backend_dir / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)

    app = Flask(__name__)

    database_uri = _resolve_database_uri(backend_dir)
    app.config["SQLALCHEMY_DATABASE_URI"] = database_uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Database connection options (helps avoid first-query stalls due to stale pooled connections).
    if database_uri.startswith("mysql"):
        try:
            db_connect_timeout = int(os.getenv("DB_CONNECT_TIMEOUT", 5))
        except Exception:
            db_connect_timeout = 5
        app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
            "pool_pre_ping": True,
            "pool_recycle": 1800,
            "connect_args": {"connect_timeout": db_connect_timeout},
        }

    # Auth performance/security knobs.
    is_dev = (os.getenv("FLASK_ENV") or "").strip().lower() == "development" or (
        os.getenv("FLASK_DEBUG") or ""
    ).strip() in {"1", "true", "True"}
    default_bcrypt_rounds = 10 if is_dev else 12
    try:
        bcrypt_rounds = int(os.getenv("BCRYPT_ROUNDS", default_bcrypt_rounds))
    except Exception:
        bcrypt_rounds = default_bcrypt_rounds
    app.config["BCRYPT_ROUNDS"] = bcrypt_rounds
    app.config["BCRYPT_REHASH_ON_LOGIN"] = os.getenv("BCRYPT_REHASH_ON_LOGIN", "true").lower() == "true"
    app.config["BCRYPT_ALLOW_DOWNGRADE"] = os.getenv("BCRYPT_ALLOW_DOWNGRADE", str(is_dev)).lower() == "true"

    # Email sending (registration).
    app.config["SEND_WELCOME_EMAIL"] = os.getenv("SEND_WELCOME_EMAIL", "true").lower() == "true"
    app.config["WELCOME_EMAIL_ASYNC"] = os.getenv("WELCOME_EMAIL_ASYNC", "true").lower() == "true"
    app.config["JWT_SECRET_KEY"] = (
        os.getenv("JWT_SECRET_KEY")
        or os.getenv("SECRET_KEY")
        or "dev-only-change-me"
    )
    try:
        if len(app.config["JWT_SECRET_KEY"].encode("utf-8")) < 32:
            logging.warning("JWT_SECRET_KEY is shorter than 32 bytes; use a longer random secret for production.")
    except Exception:
        pass
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
    app.config["JWT_IDENTITY_CLAIM"] = "sub"
    app.config["JWT_VERIFY_SUB"] = False
    app.config["UPLOAD_FOLDER"] = str(upload_dir)
    app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

    app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER")
    app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT", 587))
    app.config["MAIL_USE_TLS"] = os.getenv("MAIL_USE_TLS", "True").lower() == "true"
    app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
    app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
    app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_USERNAME")

    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Import models so SQLAlchemy/Alembic sees them.
    from app.models.attendance_model import Attendance  # noqa: F401
    from app.models.holiday_model import Holiday  # noqa: F401
    from app.models.justification_model import Justification  # noqa: F401
    from app.models.leave_model import Leave  # noqa: F401
    from app.models.late_wallet_model import LateWallet  # noqa: F401
    from app.models.notification_model import Notification  # noqa: F401
    from app.models.user_model import User  # noqa: F401

    # Ensure existing MySQL schemas have required columns/tables (dev convenience).
    try:
        from app.services.schema_service import ensure_schema

        with app.app_context():
            ensure_schema()
    except Exception:
        # Never block app startup for schema repair.
        logging.exception("Schema ensure failed")

    from app.routes.admin_routes import admin_bp
    from app.routes.attendance_routes import attendance_bp
    from app.routes.auth_routes import auth_bp
    from app.routes.holidays_routes import holidays_bp
    from app.routes.justification_routes import justification_bp
    from app.routes.leave_routes import leave_bp
    from app.routes.notifications_routes import notifications_bp
    from app.routes.preferences_routes import preferences_bp
    from app.routes.profile_routes import profile_bp
    from app.routes.wallet_routes import wallet_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
    app.register_blueprint(leave_bp, url_prefix="/api/leave")
    app.register_blueprint(justification_bp, url_prefix="/api/justification")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")
    app.register_blueprint(wallet_bp, url_prefix="/api/wallet")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(preferences_bp, url_prefix="/api/preferences")
    app.register_blueprint(holidays_bp, url_prefix="/api/holidays")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"}), 200

    return app
