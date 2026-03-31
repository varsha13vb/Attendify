from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.models.justification_model import Justification
from app.models.leave_model import Leave
from app.models.user_model import User
from app.services.notification_service import ensure_notification_once

admin_bp = Blueprint("admin", __name__)


def _get_admin_user():
    employee_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=employee_id).first()
    if not user or user.role != "admin":
        return None
    return user


@admin_bp.route("/", methods=["GET"])
@jwt_required()
def admin_dashboard():
    user = _get_admin_user()
    if not user:
        return jsonify({"message": "Forbidden"}), 403

    return jsonify({
        "users": User.query.count(),
        "pending_leaves": Leave.query.filter_by(status="Pending").count(),
        "pending_justifications": Justification.query.filter_by(status="Pending").count(),
    }), 200


@admin_bp.route("/leaves/pending", methods=["GET"])
@jwt_required()
def pending_leaves():
    user = _get_admin_user()
    if not user:
        return jsonify({"message": "Forbidden"}), 403

    leaves = Leave.query.filter_by(status="Pending").order_by(Leave.applied_on.desc(), Leave.id.desc()).all()
    return jsonify([
        {
            "id": l.id,
            "employee_id": l.employee_id,
            "leave_type": l.leave_type,
            "from_date": l.from_date.strftime("%Y-%m-%d") if l.from_date else None,
            "to_date": l.to_date.strftime("%Y-%m-%d") if l.to_date else None,
            "reason": l.reason,
            "status": l.status,
            "applied_on": l.applied_on.isoformat() if l.applied_on else None,
        }
        for l in leaves
    ]), 200


@admin_bp.route("/leaves/<int:leave_id>/status", methods=["PUT"])
@jwt_required()
def update_leave_status(leave_id: int):
    user = _get_admin_user()
    if not user:
        return jsonify({"message": "Forbidden"}), 403

    data = request.get_json() or {}
    status = (data.get("status") or "").strip().title()
    if status not in {"Approved", "Rejected"}:
        return jsonify({"message": "Invalid status"}), 400

    leave = Leave.query.get(leave_id)
    if not leave:
        return jsonify({"message": "Leave not found"}), 404

    leave.status = status

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Failed to update leave status"}), 500

    if status == "Approved":
        employee = User.query.filter_by(employee_id=leave.employee_id).first()
        send_email = bool(employee and employee.email_notifications and employee.leave_requests)
        ensure_notification_once(
            employee_id=leave.employee_id,
            event_key=f"leave_approved:{leave.id}",
            message=(
                f"Your leave request ({leave.leave_type}) from "
                f"{leave.from_date.strftime('%Y-%m-%d')} to {leave.to_date.strftime('%Y-%m-%d')} "
                "has been approved."
            ),
            send_email=send_email,
            email_subject="Leave Approved",
        )

    return jsonify({"message": "Leave status updated", "status": status}), 200


@admin_bp.route("/justifications/pending", methods=["GET"])
@jwt_required()
def pending_justifications():
    user = _get_admin_user()
    if not user:
        return jsonify({"message": "Forbidden"}), 403

    records = (
        Justification.query
        .filter_by(status="Pending")
        .order_by(Justification.created_at.desc(), Justification.id.desc())
        .all()
    )

    return jsonify([
        {
            "id": r.id,
            "employee_id": r.employee_id,
            "date": r.date.strftime("%Y-%m-%d") if r.date else None,
            "reason": r.reason,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]), 200


@admin_bp.route("/justifications/<int:justification_id>/status", methods=["PUT"])
@jwt_required()
def update_justification_status(justification_id: int):
    user = _get_admin_user()
    if not user:
        return jsonify({"message": "Forbidden"}), 403

    data = request.get_json() or {}
    status = (data.get("status") or "").strip().title()
    if status not in {"Approved", "Rejected"}:
        return jsonify({"message": "Invalid status"}), 400

    record = Justification.query.get(justification_id)
    if not record:
        return jsonify({"message": "Justification not found"}), 404

    record.status = status

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Failed to update justification status"}), 500

    if status == "Approved":
        employee = User.query.filter_by(employee_id=record.employee_id).first()
        send_email = bool(employee and employee.email_notifications and employee.attendance_alerts)
        ensure_notification_once(
            employee_id=record.employee_id,
            event_key=f"justification_approved:{record.id}",
            message=(
                f"Your late justification request for {record.date.strftime('%Y-%m-%d')} "
                "has been approved."
            ),
            send_email=send_email,
            email_subject="Justification Approved",
        )

    return jsonify({"message": "Justification status updated", "status": status}), 200
