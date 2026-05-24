import logging
import os
import re
from datetime import datetime
from urllib.parse import urlencode

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import create_access_token
from flask_mail import Message
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app import db, mail
from app.models.user_model import User
from app.services.email_service import send_message_async

auth_bp = Blueprint("auth", __name__)
PASSWORD_RESET_SALT = "attendify-password-reset"


def _mail_sender():
    return (
        current_app.config.get("MAIL_DEFAULT_SENDER")
        or current_app.config.get("MAIL_USERNAME")
        or os.getenv("MAIL_USERNAME")
    )


def _password_reset_mail_available() -> bool:
    return bool(
        current_app.config.get("SEND_PASSWORD_RESET_EMAIL", True)
        and current_app.config.get("MAIL_SERVER")
        and _mail_sender()
    )


def _password_reset_serializer() -> URLSafeTimedSerializer:
    secret_key = (
        current_app.config.get("JWT_SECRET_KEY")
        or current_app.config.get("SECRET_KEY")
        or os.getenv("SECRET_KEY")
        or "dev-only-change-me"
    )
    return URLSafeTimedSerializer(secret_key)


def _create_password_reset_token(user: User) -> str:
    return _password_reset_serializer().dumps(
        {
            "email": user.email,
            "employee_id": user.employee_id,
        },
        salt=PASSWORD_RESET_SALT,
    )


def _read_password_reset_token(token: str) -> str:
    max_age = current_app.config.get("PASSWORD_RESET_TOKEN_MAX_AGE", 3600)
    try:
        max_age = int(max_age)
    except Exception:
        max_age = 3600

    payload = _password_reset_serializer().loads(
        token,
        salt=PASSWORD_RESET_SALT,
        max_age=max_age,
    )
    return (payload.get("email") or "").strip().lower()


def _build_password_reset_url(token: str) -> str:
    frontend_url = (
        current_app.config.get("FRONTEND_URL")
        or os.getenv("FRONTEND_URL")
        or "http://localhost:5173"
    ).rstrip("/")
    return f"{frontend_url}/reset-password?{urlencode({'token': token})}"


def _send_password_reset_email(user: User) -> str:
    sender = _mail_sender()
    token = _create_password_reset_token(user)
    reset_url = _build_password_reset_url(token)

    msg = Message(
        subject="Reset your Attendify password",
        sender=sender,
        recipients=[user.email],
    )

    msg.body = (
        "We received a request to reset your Attendify password.\n\n"
        f"Employee ID: {user.employee_id}\n"
        f"Reset link: {reset_url}\n\n"
        "This link will expire soon. If you did not request this change, you can ignore this email."
    )

    msg.html = f"""
    <h2>Reset your Attendify password</h2>
    <p>Hello <b>{user.name}</b>,</p>
    <p>We received a request to reset the password for your Attendify account.</p>
    <p><b>Employee ID:</b> {user.employee_id}</p>
    <p>
      <a
        href="{reset_url}"
        style="display:inline-block;padding:12px 20px;background:#7D3C98;color:#ffffff;text-decoration:none;border-radius:8px"
      >
        Reset Password
      </a>
    </p>
    <p>If the button does not work, copy and paste this link into your browser:</p>
    <p>{reset_url}</p>
    <p>This link will expire soon. If you did not request this change, you can ignore this email.</p>
    """

    if current_app.config.get("PASSWORD_RESET_EMAIL_ASYNC", True):
        send_message_async(current_app._get_current_object(), msg)
        return "queued"

    mail.send(msg)
    return "sent"

# ================= REGISTER =================
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    # Validate input fields
    name = (
        data.get("name")
        or data.get("full_name")
        or data.get("fullName")
        or ""
    ).strip()
    email = (
        data.get("email")
        or data.get("mail")
        or ""
    ).strip().lower()
    password = data.get("password")
    confirm_password = data.get("confirm_password") or data.get("confirmPassword")
    role = (data.get("role") or "employee").strip().lower()
    dob_str = data.get("dob") or data.get("date_of_birth") or data.get("dateOfBirth")

    if not name:
        return jsonify({"message": "Name is required", "field": "name"}), 400

    if not email:
        return jsonify({"message": "Email is required", "field": "email"}), 400

    email_regex = r"^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_regex, email):
        return jsonify({"message": "Invalid email format", "field": "email"}), 400

    if not password or len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters", "field": "password"}), 400

    if confirm_password is None:
        return jsonify({"message": "confirm_password is required", "field": "confirm_password"}), 400

    if password != confirm_password:
        return jsonify({"message": "Passwords do not match", "field": "confirm_password"}), 400

    if role not in ("employee", "admin"):
        return jsonify({"message": "Role must be either 'employee' or 'admin'", "field": "role"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already exists", "field": "email"}), 400

    last_user = User.query.order_by(User.id.desc()).first()
    if last_user and last_user.employee_id and last_user.employee_id.startswith("EMP"):
        try:
            last_number = int(last_user.employee_id.replace("EMP", ""))
            new_number = last_number + 1
        except Exception:
            new_number = 1
    else:
        new_number = 1

    new_employee_id = f"EMP{str(new_number).zfill(3)}"

    dob = None
    if dob_str:
        try:
            dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
        except Exception:
            return jsonify({"message": "Invalid dob format. Use YYYY-MM-DD.", "field": "dob"}), 400

    new_user = User()
    new_user.employee_id = new_employee_id
    new_user.name = name
    new_user.email = email
    new_user.dob = dob
    new_user.role = role
    new_user.set_password(password)

    try:
        db.session.add(new_user)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Failed to register user"}), 500

    mail_status = "skipped"

    try:
        if not current_app.config.get("SEND_WELCOME_EMAIL", True):
            mail_status = "disabled"
            raise StopIteration()

        sender = (
            current_app.config.get("MAIL_DEFAULT_SENDER")
            or current_app.config.get("MAIL_USERNAME")
            or os.getenv("MAIL_USERNAME")
        )
        if not current_app.config.get("MAIL_SERVER") or not sender:
            mail_status = "skipped"
            raise StopIteration()

        msg = Message(
            subject="Your Attendify account credentials",
            sender=sender,
            recipients=[email],
        )

        msg.body = (
            "Welcome to Attendify!\n\n"
            f"Name: {name}\n"
            f"Employee ID: {new_employee_id}\n"
            f"Role: {role}\n"
            f"Email: {email}\n"
            f"Password: {password}\n\n"
            "Please change your password after your first login."
        )

        msg.html = f"""
        <h2>Welcome to Attendify</h2>
        <p>Hello <b>{name}</b>,</p>
        <p>Your account has been created with the following credentials:</p>
        <ul>
          <li><b>Employee ID:</b> <span style="color:#7D3C98">{new_employee_id}</span></li>
          <li><b>Role:</b> {role}</li>
          <li><b>Email:</b> {email}</li>
          <li><b>Password:</b> {password}</li>
        </ul>
        <p><i>Recommendation:</i> change your password after your first login.</p>
        """

        if current_app.config.get("WELCOME_EMAIL_ASYNC", True):
            send_message_async(current_app._get_current_object(), msg)
            mail_status = "queued"
        else:
            mail.send(msg)
            mail_status = "sent"

    except StopIteration:
        pass
    except Exception:
        logging.exception("Failed to send welcome email to %s", email)
        mail_status = "failed"

    response = {
        "message": "User registered successfully",
        "employee_id": new_employee_id,
        "role": role,
        "email_status": mail_status,
    }

    return jsonify(response), 201


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = (data.get("email") or data.get("mail") or "").strip().lower()

    if not email:
        return jsonify({"message": "Email is required", "field": "email"}), 400

    email_regex = r"^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_regex, email):
        return jsonify({"message": "Invalid email format", "field": "email"}), 400

    if not _password_reset_mail_available():
        return jsonify({
            "message": "Password reset email is unavailable right now. Please contact your admin."
        }), 503

    user = User.query.filter_by(email=email).first()
    if user:
        try:
            _send_password_reset_email(user)
        except Exception:
            logging.exception("Failed to send password reset email to %s", email)
            return jsonify({"message": "Failed to send password reset email. Please try again later."}), 500

    return jsonify({
        "message": "If an account exists for this email, a password reset link has been sent."
    }), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    token = (data.get("token") or "").strip()
    password = data.get("password") or ""
    confirm_password = data.get("confirm_password") or data.get("confirmPassword")

    if not token:
        return jsonify({"message": "Reset token is required", "field": "token"}), 400

    if not password or len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters", "field": "password"}), 400

    if confirm_password is None:
        return jsonify({"message": "confirm_password is required", "field": "confirm_password"}), 400

    if password != confirm_password:
        return jsonify({"message": "Passwords do not match", "field": "confirm_password"}), 400

    try:
        email = _read_password_reset_token(token)
    except SignatureExpired:
        return jsonify({"message": "This reset link has expired. Please request a new one."}), 410
    except BadSignature:
        return jsonify({"message": "This reset link is invalid. Please request a new one."}), 400
    except Exception:
        logging.exception("Failed to decode password reset token")
        return jsonify({"message": "This reset link is invalid. Please request a new one."}), 400

    if not email:
        return jsonify({"message": "This reset link is invalid. Please request a new one."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "This reset link is invalid. Please request a new one."}), 400

    user.set_password(password)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        logging.exception("Failed to reset password for %s", email)
        return jsonify({"message": "Failed to reset password. Please try again."}), 500

    return jsonify({"message": "Password reset successful. You can now log in."}), 200

# ================= LOGIN =================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    employee_id = (data.get("employee_id") or "").strip()
    password = data.get("password")

    if not employee_id or not password:
        return jsonify({"message": "Employee ID and password are required"}), 400

    user = User.query.filter_by(employee_id=employee_id).first()

    if not user or not user.check_password(password):
        return jsonify({"message": "Invalid credentials"}), 401

    # Optional: rehash to match configured bcrypt rounds (e.g., faster dev logins).
    try:
        if user.maybe_rehash_password(password):
            db.session.commit()
    except Exception:
        db.session.rollback()
        logging.exception("Password rehash failed for %s", user.employee_id)

    access_token = create_access_token(identity=user.employee_id)

    return jsonify({
        "access_token": access_token,
        "user": {
            "employee_id": user.employee_id,
            "name": user.name,
            "email": user.email,
            "dob": user.dob.isoformat() if user.dob else None,
            "department": user.department,
            "role": user.role,
            "profile_image": user.profile_image,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
    }), 200
