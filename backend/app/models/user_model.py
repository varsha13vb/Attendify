from app import db

import bcrypt
from flask import current_app
from typing import Optional
from werkzeug.security import check_password_hash, generate_password_hash

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    dob = db.Column(db.Date, nullable=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum("admin", "employee"), default="employee")
    profile_image = db.Column(db.String(255))

    # ===== NEW: PREFERENCES =====
    dark_mode = db.Column(db.Boolean, default=False)
    email_notifications = db.Column(db.Boolean, default=True)
    push_notifications = db.Column(db.Boolean, default=False)
    attendance_alerts = db.Column(db.Boolean, default=True)
    leave_requests = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())

    def _bcrypt_rounds(self) -> int:
        rounds = current_app.config.get("BCRYPT_ROUNDS", 12)
        try:
            rounds = int(rounds)
        except Exception:
            rounds = 12
        # bcrypt valid range is 4..31
        return max(4, min(31, rounds))

    def _bcrypt_rounds_from_hash(self) -> Optional[int]:
        if not self.password:
            return None
        if not self.password.startswith(("$2a$", "$2b$", "$2y$")):
            return None
        try:
            # $2b$12$<rest>
            return int(self.password.split("$")[2])
        except Exception:
            return None

    def set_password(self, password):
        salt = bcrypt.gensalt(rounds=self._bcrypt_rounds())
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        self.password = hashed.decode("utf-8")

    def check_password(self, password):
        if not self.password:
            return False

        # Backward compatible: old rows may use Werkzeug hashes.
        if self.password.startswith(("$2a$", "$2b$", "$2y$")):
            try:
                return bcrypt.checkpw(password.encode("utf-8"), self.password.encode("utf-8"))
            except Exception:
                return False

        return check_password_hash(self.password, password)

    def maybe_rehash_password(self, password: str) -> bool:
        """
        Re-hash bcrypt passwords to match configured rounds.

        - Useful in development to speed up login by lowering rounds.
        - Safe by default in production because downgrades are blocked unless enabled.
        """
        if not current_app.config.get("BCRYPT_REHASH_ON_LOGIN", True):
            return False

        current_rounds = self._bcrypt_rounds_from_hash()
        if current_rounds is None:
            return False

        desired_rounds = self._bcrypt_rounds()
        if current_rounds == desired_rounds:
            return False

        if current_rounds > desired_rounds and not current_app.config.get("BCRYPT_ALLOW_DOWNGRADE", False):
            return False

        self.set_password(password)
        return True
