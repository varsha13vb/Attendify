import os
from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app import db
from app.models.user_model import User

profile_bp = Blueprint("profile_bp", __name__)

# ✅ Correct absolute upload path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@profile_bp.route("/update-profile", methods=["PUT"])
@jwt_required()
def update_profile():
    employee_id = get_jwt_identity()

    user = User.query.filter_by(employee_id=employee_id).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    name = request.form.get("name")
    if name:
        user.name = name

    if "profile_image" in request.files:
        file = request.files["profile_image"]
        if file.filename != "":
            filename = secure_filename(file.filename)
            file.save(os.path.join(UPLOAD_FOLDER, filename))
            user.profile_image = filename

    db.session.commit()

    return jsonify({
        "message": "Profile updated successfully",
        "name": user.name,
        "profile_image": user.profile_image
    })


# ✅ Serve image correctly
@profile_bp.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)