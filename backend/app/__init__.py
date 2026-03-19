import os
from datetime import timedelta
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate   # ✅ IMPORTANT

db = SQLAlchemy()
jwt = JWTManager()
mail = Mail()
migrate = Migrate()   # ✅ ADD THIS


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
    load_dotenv()

    backend_dir = Path(__file__).resolve().parents[1]
    upload_dir = backend_dir / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)

    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = _resolve_database_uri(backend_dir)
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = (
        os.getenv("JWT_SECRET_KEY")
        or os.getenv("SECRET_KEY")
        or "dev-only-change-me"
    )
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

    # ✅ INIT EXTENSIONS
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)   # ✅ THIS FIXES YOUR ERROR

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # ===== IMPORT MODELS =====
    from app.models.attendance_model import Attendance
    from app.models.justification_model import Justification
    from app.models.leave_model import Leave
    from app.models.late_wallet_model import LateWallet
    from app.models.notification_model import Notification
    from app.models.user_model import User

    # ===== IMPORT ROUTES =====
    from app.routes.admin_routes import admin_bp
    from app.routes.attendance_routes import attendance_bp
    from app.routes.auth_routes import auth_bp
    from app.routes.justification_routes import justification_bp
    from app.routes.leave_routes import leave_bp
    from app.routes.profile_routes import profile_bp
    from app.routes.wallet_routes import wallet_bp
    from app.routes.preferences_routes import preferences_bp   # ✅ ADD THIS

    # ===== REGISTER ROUTES =====
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
    app.register_blueprint(leave_bp, url_prefix="/api/leave")
    app.register_blueprint(justification_bp, url_prefix="/api/justification")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")
    app.register_blueprint(wallet_bp, url_prefix="/api/wallet")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(preferences_bp, url_prefix="/api/preferences")  # ✅ ADD

    # ===== HEALTH CHECK =====
    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"}), 200

    return app