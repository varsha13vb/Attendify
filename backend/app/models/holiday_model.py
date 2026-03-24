from app import db


class Holiday(db.Model):
    __tablename__ = "holidays"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    date = db.Column(db.Date, nullable=False, index=True)

    created_at = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
