import os

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
        "profile_image": user.profile_image,
    }), 200


@profile_bp.route("/uploads/<path:filename>", methods=["GET"])
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)
