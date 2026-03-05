from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token
from flask_mail import Message
from app import db, mail
from app.models.user_model import User
from datetime import datetime
import os
import re
import logging

auth_bp = Blueprint("auth", __name__)

# ================= REGISTER =================
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    # Validate input fields
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")
    confirm_password = data.get("confirm_password")
    role = (data.get("role") or "employee").strip().lower()
    dob_str = data.get("dob")

    # Name cannot be empty
    if not name:
        return jsonify({"message": "Name is required"}), 400

    # Email format
    email_regex = r"^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_regex, email):
        return jsonify({"message": "Invalid email format"}), 400

    # Password checks
    if not password or len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters"}), 400

    if password != confirm_password:
        return jsonify({"message": "Passwords do not match"}), 400

    # Role validation
    if role not in ("employee", "admin"):
        return jsonify({"message": "Role must be either 'employee' or 'admin'"}), 400

    # Check duplicate email (unique)
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already exists"}), 400

    # Auto generate employee_id
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

    # Parse DOB safely (optional)
    dob = None
    if dob_str:
        try:
            dob = datetime.strptime(dob_str, "%Y-%m-%d")
        except Exception:
            return jsonify({"message": "Invalid dob format. Use YYYY-MM-DD."}), 400

    # Create new user
    new_user = User()
    new_user.employee_id = new_employee_id
    new_user.name = name
    new_user.email = email
    new_user.dob = dob
    new_user.role = role
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    # Prepare and send welcome email (non-blocking failure)
    try:
        sender = current_app.config.get("MAIL_USERNAME") or os.getenv("MAIL_USERNAME")
        msg = Message(
            subject="Welcome to Attendify",
            sender=sender,
            recipients=[email]
        )

        msg.html = f"""
        <h2>Welcome to Attendify</h2>
        <p>Hello <b>{name}</b>,</p>
        <p>Your Employee ID is:</p>
        <h3 style=\"color:#7D3C98\">{new_employee_id}</h3>
        <p>Role: {role}</p>
        <p>Please keep this ID safe for login.</p>
        """

        mail.send(msg)
        mail_status = "sent"

    except Exception as e:
        # Log the mail error but do NOT fail the registration
        logging.exception("Failed to send welcome email to %s", email)
        mail_status = "failed"

    response = {
        "message": "User registered successfully",
        "employee_id": new_employee_id,
        "role": role,
        "email_status": mail_status,
    }

    return jsonify(response), 201

# ================= LOGIN =================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    user = User.query.filter_by(employee_id=data["employee_id"]).first()

    if not user or not user.check_password(data["password"]):
        return jsonify({"message": "Invalid credentials"}), 401

    access_token = create_access_token(identity=user.employee_id)

    return jsonify({
        "access_token": access_token,
        "user": {
            "employee_id": user.employee_id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }), 200
