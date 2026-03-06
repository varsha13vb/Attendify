import logging
import os
import re
from datetime import datetime

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import create_access_token
from flask_mail import Message

from app import db, mail
from app.models.user_model import User

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

    if not name:
        return jsonify({"message": "Name is required"}), 400

    email_regex = r"^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_regex, email):
        return jsonify({"message": "Invalid email format"}), 400

    if not password or len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters"}), 400

    if password != confirm_password:
        return jsonify({"message": "Passwords do not match"}), 400

    if role not in ("employee", "admin"):
        return jsonify({"message": "Role must be either 'employee' or 'admin'"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already exists"}), 400

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
            return jsonify({"message": "Invalid dob format. Use YYYY-MM-DD."}), 400

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

    access_token = create_access_token(identity=user.employee_id)

    return jsonify({
        "access_token": access_token,
        "user": {
            "employee_id": user.employee_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "profile_image": user.profile_image,
        }
    }), 200
