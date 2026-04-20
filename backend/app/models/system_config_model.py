from app import db


class SystemConfig(db.Model):
    __tablename__ = "system_config"

    # Single-row table (id=1) used for system-wide settings.
    id = db.Column(db.Integer, primary_key=True)

    check_in = db.Column(db.String(5), nullable=False, default="09:00")
    check_out = db.Column(db.String(5), nullable=False, default="18:00")
    late_tolerance = db.Column(db.Integer, nullable=False, default=15)
    monthly_late_wallet = db.Column(db.Integer, nullable=False, default=45)
    min_work_hours = db.Column(db.Integer, nullable=False, default=8)

    updated_at = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())

