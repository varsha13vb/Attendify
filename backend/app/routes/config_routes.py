from datetime import datetime
from typing import Optional

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.models.system_config_model import SystemConfig
from app.models.user_model import User

config_bp = Blueprint("config", __name__)


def _require_admin() -> bool:
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()
    return bool(user and user.role == "admin")


def _get_or_create_config() -> SystemConfig:
    cfg = SystemConfig.query.get(1)
    if cfg:
        return cfg

    cfg = SystemConfig(id=1)
    db.session.add(cfg)
    db.session.commit()
    return cfg


@config_bp.route("/work-timing", methods=["GET"])
@jwt_required()
def get_work_timing():
    cfg = _get_or_create_config()
    return (
        jsonify(
            {
                "check_in": cfg.check_in,
                "check_out": cfg.check_out,
                "late_tolerance": cfg.late_tolerance,
                "monthly_late_wallet": cfg.monthly_late_wallet,
                "min_work_hours": cfg.min_work_hours,
                "updated_at": cfg.updated_at.isoformat() if cfg.updated_at else None,
            }
        ),
        200,
    )


@config_bp.route("/work-timing", methods=["PUT"])
@jwt_required()
def update_work_timing():
    if not _require_admin():
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json() or {}
    cfg = _get_or_create_config()

    if "check_in" in data:
        cfg.check_in = str(data.get("check_in") or "").strip() or cfg.check_in
    if "check_out" in data:
        cfg.check_out = str(data.get("check_out") or "").strip() or cfg.check_out

    def _int_field(key: str, minimum: int = 0) -> Optional[int]:
        if key not in data:
            return None
        try:
            value = int(data.get(key))
        except Exception:
            raise ValueError(f"Invalid {key}")
        if value < minimum:
            raise ValueError(f"{key} must be >= {minimum}")
        return value

    try:
        late_tolerance = _int_field("late_tolerance", minimum=0)
        monthly_late_wallet = _int_field("monthly_late_wallet", minimum=0)
        min_work_hours = _int_field("min_work_hours", minimum=0)
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400

    if late_tolerance is not None:
        cfg.late_tolerance = late_tolerance
    if monthly_late_wallet is not None:
        cfg.monthly_late_wallet = monthly_late_wallet
    if min_work_hours is not None:
        cfg.min_work_hours = min_work_hours

    cfg.updated_at = datetime.utcnow()

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Failed to update configuration"}), 500

    return jsonify({"message": "Work timing updated"}), 200
