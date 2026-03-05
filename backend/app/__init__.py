import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from dotenv import load_dotenv
from urllib.parse import quote_plus

db = SQLAlchemy()
jwt = JWTManager()
mail = Mail()

def create_app():
    load_dotenv()

    app = Flask(__name__)

    # ================= DATABASE CONFIG =================
    DB_USER = os.getenv("DB_USER") or "root"
    DB_HOST = os.getenv("DB_HOST") or "localhost"
    DB_NAME = os.getenv("DB_NAME") or "attendify"

    raw_password = os.getenv("DB_PASSWORD")
    if raw_password is None:
        raise ValueError("DB_PASSWORD is not set in .env file")

    DB_PASSWORD = quote_plus(raw_password)

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
    )

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # ================= JWT CONFIG =================
    SECRET_KEY = os.getenv("SECRET_KEY")
    if SECRET_KEY is None:
        raise ValueError("SECRET_KEY is not set in .env file")

    app.config["JWT_SECRET_KEY"] = SECRET_KEY
    app.config["JWT_IDENTITY_CLAIM"] = "sub"
    app.config["JWT_VERIFY_SUB"] = False
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False

    # ================= MAIL CONFIG =================
    app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER")
    app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT", 587))
    app.config["MAIL_USE_TLS"] = os.getenv("MAIL_USE_TLS") == "True"
    app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
    app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")

    # ================= INIT EXTENSIONS =================
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    CORS(app)

    # ================= REGISTER BLUEPRINTS =================
    from app.routes.auth_routes import auth_bp
    from app.routes.attendance_routes import attendance_bp
    from app.routes.leave_routes import leave_bp
    from app.routes.justification_routes import justification_bp
    from app.routes.profile_routes import profile_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
    app.register_blueprint(leave_bp, url_prefix="/api/leave")
    app.register_blueprint(justification_bp, url_prefix="/api/justification")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")

    return app