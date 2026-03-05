from app import db

class LateWallet(db.Model):
    __tablename__ = "late_wallet"

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(
        db.String(20),
        db.ForeignKey("users.employee_id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False
    )
    monthly_limit = db.Column(db.Integer, default=45)
    used_minutes = db.Column(db.Integer, default=0)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)

    __table_args__ = (
        db.UniqueConstraint('employee_id', 'month', 'year', name='unique_wallet'),
    )
