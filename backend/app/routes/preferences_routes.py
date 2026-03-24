from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user_model import User

preferences_bp = Blueprint("preferences", __name__)


def _bool_or_default(value, default: bool) -> bool:
    if value is None:
        return default
    return bool(value)


@preferences_bp.route("/get", methods=["GET"])
@jwt_required()
def get_preferences():
    user_id = get_jwt_identity()

    user = User.query.filter_by(employee_id=user_id).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify({
        "darkMode": _bool_or_default(user.dark_mode, False),
        "emailNotifications": _bool_or_default(user.email_notifications, True),
        "pushNotifications": _bool_or_default(user.push_notifications, False),
        "attendanceAlerts": _bool_or_default(user.attendance_alerts, True),
        "leaveRequests": _bool_or_default(user.leave_requests, True),
    }), 200


@preferences_bp.route("/update", methods=["PUT"])
@jwt_required()
def update_preferences():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    user = User.query.filter_by(employee_id=user_id).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    user.dark_mode = data.get("darkMode", False)
    user.email_notifications = data.get("emailNotifications", True)
    user.push_notifications = data.get("pushNotifications", False)
    user.attendance_alerts = data.get("attendanceAlerts", True)
    user.leave_requests = data.get("leaveRequests", True)

    db.session.commit()

    return jsonify({"message": "Preferences updated"}), 200
