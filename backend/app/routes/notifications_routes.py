from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models.notification_model import Notification

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("", methods=["GET"])
@jwt_required()
def get_notifications():
    employee_id = get_jwt_identity()

    notifications = (
        Notification.query
        .filter((Notification.employee_id == employee_id) | (Notification.employee_id.is_(None)))
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(50)
        .all()
    )

    return jsonify([
        {
            "message": n.message,
            "is_read": bool(n.is_read),
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifications
    ]), 200

