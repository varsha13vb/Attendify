import os
import re
from datetime import datetime

from flask import Blueprint, jsonify, request, send_from_directory
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.utils import secure_filename

from app import db
from app.models.user_model import User

profile_bp = Blueprint("profile_bp", __name__)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


def _allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@profile_bp.route("/update-profile", methods=["PUT"])
@jwt_required()
def update_profile():
    employee_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=employee_id).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    name = (request.form.get("name") or "").strip()
    if name:
        user.name = name

    email = (request.form.get("email") or "").strip().lower()
    if email and email != (user.email or "").strip().lower():
        email_regex = r"^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
        if not re.match(email_regex, email):
            return jsonify({"message": "Invalid email format"}), 400
        if User.query.filter(User.email == email, User.employee_id != employee_id).first():
            return jsonify({"message": "Email already exists"}), 400
        user.email = email

    dob_raw = (request.form.get("dob") or "").strip()
    if dob_raw:
        try:
            user.dob = datetime.strptime(dob_raw, "%Y-%m-%d").date()
        except Exception:
            return jsonify({"message": "Invalid dob format. Use YYYY-MM-DD."}), 400

    if "profile_image" in request.files:
        file = request.files["profile_image"]
        if file and file.filename:
            if not _allowed_file(file.filename):
                return jsonify({"message": "Invalid image format"}), 400

            filename = secure_filename(file.filename)
            file.save(os.path.join(UPLOAD_FOLDER, filename))
            user.profile_image = filename

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Failed to update profile"}), 500

    return jsonify({
        "message": "Profile updated successfully",
        "name": user.name,
        "email": user.email,
        "dob": user.dob.isoformat() if user.dob else None,
        "profile_image": user.profile_image,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }), 200


@profile_bp.route("/uploads/<path:filename>", methods=["GET"])
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@profile_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    employee_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=employee_id).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify({
        "employee_id": user.employee_id,
        "name": user.name,
        "email": user.email,
        "dob": user.dob.isoformat() if user.dob else None,
        "role": user.role,
        "profile_image": user.profile_image,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "preferences": {
            "darkMode": bool(user.dark_mode),
            "emailNotifications": bool(user.email_notifications),
            "pushNotifications": bool(user.push_notifications),
            "attendanceAlerts": bool(user.attendance_alerts),
            "leaveRequests": bool(user.leave_requests),
        },
    }), 200


@profile_bp.route("/change-password", methods=["PUT"])
@jwt_required()
def change_password():
    employee_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=employee_id).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json() or {}
    old_password = data.get("old_password") or data.get("oldPassword")
    new_password = data.get("new_password") or data.get("newPassword")

    if not old_password or not new_password:
        return jsonify({"message": "old_password and new_password are required"}), 400

    if len(new_password) < 6:
        return jsonify({"message": "New password must be at least 6 characters"}), 400

    if not user.check_password(old_password):
        return jsonify({"message": "Old password is incorrect"}), 400

    user.set_password(new_password)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Failed to update password"}), 500

    return jsonify({"message": "Password updated successfully"}), 200
