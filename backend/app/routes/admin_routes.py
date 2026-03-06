from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models.justification_model import Justification
from app.models.leave_model import Leave
from app.models.user_model import User

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/", methods=["GET"])
@jwt_required()
def admin_dashboard():
    employee_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=employee_id).first()
    if not user or user.role != "admin":
        return jsonify({"message": "Forbidden"}), 403

    return jsonify({
        "users": User.query.count(),
        "pending_leaves": Leave.query.filter_by(status="Pending").count(),
        "pending_justifications": Justification.query.filter_by(status="Pending").count(),
    }), 200
