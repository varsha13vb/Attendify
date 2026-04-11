from flask_mail import Message
from flask import Blueprint, request, jsonify
from app import db, mail
from app.models.user_model import User
from flask_jwt_extended import jwt_required

admin_bp = Blueprint('admin', __name__)

<<<<<<< HEAD
# GET all employees
@admin_bp.route('/employees', methods=['GET'])
@jwt_required()
def get_employees():
    try:
        employees = User.query.filter_by(role='employee').all()
        output = []

        for emp in employees:
            output.append({
                "name": emp.name,
                "email": emp.email,
                "employee_id": emp.employee_id,
                "dob": emp.dob.strftime('%Y-%m-%d') if emp.dob else None,
                "role": emp.role,
                "created_at": emp.created_at.strftime('%Y-%m-%d') if emp.created_at else None,
            })

        return jsonify(output), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500


# ✅ SINGLE POST API (FIXED)
@admin_bp.route('/employees', methods=['POST'])
@jwt_required()
def add_employee():
    data = request.get_json()

    # Validation
    if User.query.filter_by(employee_id=data.get('employee_id')).first():
        return jsonify({"message": "Employee ID already exists"}), 400

    try:
        new_user = User(
            name=data.get('name'),
            email=data.get('email'),
            employee_id=data.get('employee_id'),
            dob=data.get('dob'),
            role='employee'
        )

        # ✅ password = dob
        new_user.set_password(data.get('password'))

        db.session.add(new_user)
        db.session.commit()

        # ✅ SEND EMAIL
        msg = Message(
            subject="Your Account Details",
            recipients=[data.get('email')]
        )

        msg.body = f"""
Hello {data.get('name')},

Your account has been created.

Employee ID: {data.get('employee_id')}
Password: {data.get('dob')}

Please login and change your password.
        """

        mail.send(msg)

        return jsonify({"message": "Employee created & email sent"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500


# DELETE
@admin_bp.route('/employees/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_employee(user_id):
    user = User.query.get_or_404(user_id)

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "Employee deleted successfully"}), 200


# UPDATE
@admin_bp.route('/employees/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_employee(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json

    user.name = data.get('name', user.name)
    user.email = data.get('email', user.email)
    user.employee_id = data.get('employee_id', user.employee_id)
    user.dob = data.get('dob', user.dob)

    db.session.commit()

    return jsonify({"message": "Employee updated successfully"}), 200
=======

def _get_admin_user():
    employee_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=employee_id).first()
    if not user or user.role != "admin":
        return None
    return user


@admin_bp.route("/", methods=["GET"])
