from datetime import datetime

import logging
import os
from typing import Optional

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_mail import Message
from sqlalchemy import desc

from app import db
from app.models.leave_model import Leave
from app.models.user_model import User
from app.services.email_service import send_message_async

leave_bp = Blueprint("leave", __name__)


@leave_bp.route("/apply-leave", methods=["POST"])
@jwt_required()
def apply_leave():
    data = request.get_json() or {}
    employee_id = get_jwt_identity()

    leave_type = data.get("leave_type")
    reason = (data.get("reason") or "").strip()
    from_date_raw = data.get("from_date")
    to_date_raw = data.get("to_date")

    if not leave_type or not from_date_raw or not to_date_raw or not reason:
        return jsonify({"message": "All leave fields are required"}), 400

    try:
        from_date = datetime.strptime(from_date_raw, "%Y-%m-%d").date()
        to_date = datetime.strptime(to_date_raw, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"message": "Invalid date format. Use YYYY-MM-DD"}), 400

    today = datetime.today().date()
    if from_date < today:
        return jsonify({"message": "Cannot apply leave for past dates"}), 400

    if to_date < from_date:
        return jsonify({"message": "To date cannot be before From date"}), 400

    new_leave = Leave(
        employee_id=employee_id,
        leave_type=leave_type,
        from_date=from_date,
        to_date=to_date,
        reason=reason,
        status="Pending",
    )

    try:
        db.session.add(new_leave)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Failed to apply leave"}), 500

    return jsonify({"message": "Leave applied successfully"}), 200


@leave_bp.route("/latest-leave/<string:employee_id>", methods=["GET"])
@jwt_required()
def get_latest_leave(employee_id):
    user = User.query.filter_by(employee_id=employee_id).first()
    if not user:
        return jsonify({}), 200

    latest_leave = (
        Leave.query
        .filter_by(employee_id=employee_id)
        .order_by(desc(Leave.applied_on), desc(Leave.id))
        .first()
    )

    if not latest_leave:
        return jsonify({}), 200

    return jsonify({
        "leaveType": latest_leave.leave_type,
        "fromDate": latest_leave.from_date.strftime("%Y-%m-%d"),
        "toDate": latest_leave.to_date.strftime("%Y-%m-%d"),
        "status": latest_leave.status,
    }), 200

@leave_bp.route("/my-leaves/<string:employee_id>", methods=["GET"])
@jwt_required()
def get_my_leaves(employee_id):

    user = User.query.filter_by(employee_id=employee_id).first()
    if not user:
        return jsonify([]), 200

    leaves = (
        Leave.query
        .filter_by(employee_id=employee_id)
        .order_by(desc(Leave.applied_on))
        .all()
    )

    result = []

    for leave in leaves:
        result.append({
            "leave_type": leave.leave_type,
            "from_date": leave.from_date.strftime("%Y-%m-%d"),
            "to_date": leave.to_date.strftime("%Y-%m-%d"),
            "reason": leave.reason,
            "status": leave.status,
        })

    return jsonify(result), 200

@leave_bp.route("/all", methods=["GET"])
@jwt_required()
def get_all_leaves():
    if not _require_admin():
        return jsonify({"message": "Unauthorized"}), 403

    # Join Leave with User to get employee names
    leaves = db.session.query(Leave, User).join(User, Leave.employee_id == User.employee_id)\
        .order_by(desc(Leave.applied_on)).all()

    result = []
    for leave, user in leaves:
        result.append({
            "id": leave.id,
            "employee_id": leave.employee_id,
            "name": user.name,
            "leave_type": leave.leave_type,
            "from_date": leave.from_date.strftime("%Y-%m-%d"),
            "to_date": leave.to_date.strftime("%Y-%m-%d"),
            "reason": leave.reason,
            "status": leave.status,
            "admin_response": leave.admin_response,
            "applied_on": leave.applied_on.strftime("%Y-%m-%d")
        })

    return jsonify(result), 200


def _require_admin() -> Optional[User]:
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()
    if not user or user.role != "admin":
        return None
    return user


def _send_leave_status_email(*, employee: User, leave: Leave) -> None:
    if not current_app.config.get("SEND_LEAVE_STATUS_EMAIL", True):
        return

    sender = (
        current_app.config.get("MAIL_DEFAULT_SENDER")
        or current_app.config.get("MAIL_USERNAME")
        or os.getenv("MAIL_USERNAME")
    )
    if not current_app.config.get("MAIL_SERVER") or not sender or not employee.email:
        return

    status = (leave.status or "").strip()
    response = (leave.admin_response or "").strip()

    subject = f"Leave Request {status}"

    msg = Message(
        subject=subject,
        sender=sender,
        recipients=[employee.email],
    )

    date_range = f"{leave.from_date.strftime('%Y-%m-%d')} to {leave.to_date.strftime('%Y-%m-%d')}"
    msg.body = (
        f"Hello {employee.name},\n\n"
        f"Your leave request has been {status.lower()}.\n\n"
        f"Employee ID: {employee.employee_id}\n"
        f"Leave Type: {leave.leave_type}\n"
        f"Dates: {date_range}\n"
        f"Reason: {leave.reason}\n"
        + (f"\nAdmin Response: {response}\n" if response else "")
        + "\nRegards,\nAttendify Admin\n"
    )

    try:
        if current_app.config.get("LEAVE_STATUS_EMAIL_ASYNC", True):
            send_message_async(current_app._get_current_object(), msg)
        else:
            from app import mail

            mail.send(msg)
    except Exception:
        logging.exception("Failed sending leave status email to %s", employee.email)


@leave_bp.route("/<int:leave_id>/approve", methods=["PUT"])
@jwt_required()
def approve_leave(leave_id):
    if not _require_admin():
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json() or {}
    admin_response = (data.get("admin_response") or "").strip()

    leave = Leave.query.get_or_404(leave_id)
    leave.status = "Approved"
    leave.admin_response = admin_response or None

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Failed to approve leave"}), 500

    employee = User.query.filter_by(employee_id=leave.employee_id).first()
    if employee:
        _send_leave_status_email(employee=employee, leave=leave)
    return jsonify({"message": "Leave approved"}), 200

@leave_bp.route("/<int:leave_id>/reject", methods=["PUT"])
@jwt_required()
def reject_leave(leave_id):
    if not _require_admin():
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json() or {}
    admin_response = (data.get("admin_response") or "").strip()
    if not admin_response:
        return jsonify({"message": "Response is required for rejection"}), 400

    leave = Leave.query.get_or_404(leave_id)
    leave.status = "Rejected"
    leave.admin_response = admin_response

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Failed to reject leave"}), 500

    employee = User.query.filter_by(employee_id=leave.employee_id).first()
    if employee:
        _send_leave_status_email(employee=employee, leave=leave)
    return jsonify({"message": "Leave rejected"}), 200

# @leave_bp.route('/<int:leave_id>/<action>', methods=['PUT'])
# @jwt_required()
# def manage_leave(leave_id, action):
#     leave = Leave.query.get_or_404(leave_id)
#     data = request.json
#     if action == 'approve':
#         leave.status = 'Approved'
#     elif action == 'reject':
#         leave.status = 'Rejected'
#         leave.admin_response = data.get('admin_response') # Ensure column exists in DB
#     db.session.commit()
#     return jsonify({"message": f"Leave {action}ed successfully"}), 200
