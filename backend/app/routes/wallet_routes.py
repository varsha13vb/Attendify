from flask import Blueprint, jsonify

wallet_bp = Blueprint('wallet', __name__)

@wallet_bp.route('/', methods=['GET'])
def wallet_info():
    return jsonify({"message": "Wallet route working"})
