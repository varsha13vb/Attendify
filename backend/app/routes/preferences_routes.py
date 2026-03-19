from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user_model import User

preferences_bp = Blueprint("preferences", __name__)


@preferences_bp.route("/get", methods=["GET"])
@jwt_required()
def get_preferences():
    user_id = get_jwt_identity()

    user = User.query.get(user_id)

    return jsonify({
        "darkMode": user.dark_mode or False,
        "emailNotifications": user.email_notifications or True,
        "pushNotifications": user.push_notifications or False,
        "attendanceAlerts": user.attendance_alerts or True,
        "leaveRequests": user.leave_requests or True
    }), 200


@preferences_bp.route("/update", methods=["PUT"])
@jwt_required()
def update_preferences():
    user_id = get_jwt_identity()
    data = request.get_json()

    user = User.query.get(user_id)

    user.dark_mode = data.get("darkMode", False)
    user.email_notifications = data.get("emailNotifications", True)
    user.push_notifications = data.get("pushNotifications", False)
    user.attendance_alerts = data.get("attendanceAlerts", True)
    user.leave_requests = data.get("leaveRequests", True)

    db.session.commit()

    return jsonify({"message": "Preferences updated"}), 200