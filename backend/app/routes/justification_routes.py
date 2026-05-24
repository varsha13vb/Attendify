import logging
import os

from flask import Blueprint, current_app, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from flask_mail import Message

from app import db
from app.models.justification_model import Justification
from app.models.user_model import User
from app.services.email_service import send_message_async
from app.services.notification_service import preference_enabled

justification_bp = Blueprint("justification", __name__)


def _send_justification_status_email(*, employee: User, justification: Justification) -> None:
    if not current_app.config.get("SEND_JUSTIFICATION_STATUS_EMAIL", True):
        return

    if not preference_enabled(employee, "email_notifications", default=True):
        return

    if not preference_enabled(employee, "attendance_alerts", default=True):
        return

    sender = (
        current_app.config.get("MAIL_DEFAULT_SENDER")
        or current_app.config.get("MAIL_USERNAME")
        or os.getenv("MAIL_USERNAME")
    )
    if not current_app.config.get("MAIL_SERVER") or not sender or not employee.email:
        return

    status = (justification.status or "").strip()
    response = (justification.admin_response or "").strip()

    subject = f"Justification Request {status}"

    msg = Message(
        subject=subject,
        sender=sender,
        recipients=[employee.email],
    )

    date_str = justification.date.strftime("%Y-%m-%d") if justification.date else ""
    msg.body = (
        f"Hello {employee.name},\n\n"
        f"Your justification request has been {status.lower()}.\n\n"
        f"Employee ID: {employee.employee_id}\n"
        + (f"Date: {date_str}\n" if date_str else "")
        + (f"Late Minutes: {justification.late_minutes}\n" if justification.late_minutes is not None else "")
        + f"Reason: {justification.reason}\n"
        + (f"\nAdmin Response: {response}\n" if response else "")
        + "\nRegards,\nAttendify Admin\n"
    )

    try:
        if current_app.config.get("JUSTIFICATION_STATUS_EMAIL_ASYNC", True):
            send_message_async(current_app._get_current_object(), msg)
        else:
            from app import mail

            mail.send(msg)
    except Exception:
        logging.exception("Failed sending justification status email to %s", employee.email)


# ================= APPLY JUSTIFICATION =================
@justification_bp.route("/apply", methods=["POST"])
@jwt_required()
def apply_justification():

    data = request.get_json() or {}

    employee_id = get_jwt_identity()
    reason = (data.get("reason") or "").strip()

    if not reason:
        return jsonify({"message": "Reason is required"}), 400

    # ✅ Ensure integer
    try:
        late_minutes = int(data.get("late_minutes", 0))
    except Exception:
        return jsonify({"message": "Invalid late minutes"}), 400

    new_request = Justification(
        employee_id=employee_id,
        date=datetime.today().date(),
        late_minutes=late_minutes,
        reason=reason,
        status="Pending"
    )

    try:
        db.session.add(new_request)
        db.session.commit()
        return jsonify({"message": "Justification submitted successfully"}), 201
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Failed to submit justification"}), 500


# ================= GET MY JUSTIFICATIONS =================
@justification_bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_justifications():

    employee_id = get_jwt_identity()

    records = (
        Justification.query
        .filter_by(employee_id=employee_id)
        .order_by(Justification.created_at.desc(), Justification.id.desc())
        .all()
    )

    return jsonify([
        {
            "id": r.id,
            "date": r.date.strftime("%Y-%m-%d"),
            "late_minutes": r.late_minutes,
            "reason": r.reason,
            "status": r.status,
            "admin_response": r.admin_response
        }
        for r in records
    ]), 200


# ================= ADMIN: GET ALL JUSTIFICATIONS =================
@justification_bp.route("/all", methods=["GET"])
@jwt_required()
def get_all_justifications():

    # ✅ Check admin role
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()

    if not user or user.role != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    # JOIN with User table
    results = db.session.query(Justification, User).join(
        User, Justification.employee_id == User.employee_id
    ).order_by(Justification.created_at.desc()).all()

    return jsonify([
        {
            "id": j.id,
            "employee_id": j.employee_id,
            "name": u.name,
            "date": j.date.strftime("%Y-%m-%d"),
            "late_minutes": j.late_minutes,
            "reason": j.reason,
            "status": j.status,
            "admin_response": j.admin_response
        }
        for j, u in results
    ]), 200


# ================= ADMIN: APPROVE / REJECT =================
@justification_bp.route("/<int:jid>/<string:action>", methods=["PUT"])
@jwt_required()
def handle_admin_action(jid, action):

    # ✅ Check admin role
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()

    if not user or user.role != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json() or {}
    record = Justification.query.get_or_404(jid)

    admin_response = (data.get("admin_response") or "").strip()

    if action == "approve":
        record.status = "Approved"

    elif action == "reject":
        if not admin_response:
            return jsonify({"message": "Response is required for rejection"}), 400
        record.status = "Rejected"

    else:
        return jsonify({"message": "Invalid action"}), 400

    record.admin_response = admin_response

    try:
        db.session.commit()
        employee = User.query.filter_by(employee_id=record.employee_id).first()
        if employee:
            _send_justification_status_email(employee=employee, justification=record)
        return jsonify({"message": f"Justification {action}d successfully"}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Database update failed"}), 500
