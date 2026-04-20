from datetime import datetime

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services.late_wallet_service import (
    check_and_send_late_wallet_alert,
    get_monthly_late_wallet_limit,
    get_used_late_wallet_minutes,
)

wallet_bp = Blueprint('wallet', __name__)


@wallet_bp.route('/', methods=['GET'])
@jwt_required()
def wallet_info():
    employee_id = get_jwt_identity()
    now = datetime.now()
    monthly_limit = get_monthly_late_wallet_limit()
    used_minutes = get_used_late_wallet_minutes(employee_id, when=now)
    remaining = max(monthly_limit - used_minutes, 0)

    try:
        check_and_send_late_wallet_alert(employee_id, when=now)
    except Exception:
        pass

    return jsonify({
        "monthly_limit": monthly_limit,
        "used_minutes": used_minutes,
        "remaining_minutes": remaining,
    }), 200
