import logging

from sqlalchemy import inspect, text

from app import db


def ensure_schema() -> None:
    """
    Best-effort, idempotent schema alignment for dev setups where the MySQL
    database already exists and `db.create_all()` cannot alter tables.
    """

    try:
        engine = db.engine
    except Exception:
        logging.exception("Failed to access database engine")
        return

    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    dialect = engine.dialect.name

    if "users" in table_names:
        try:
            existing_columns = {col["name"] for col in inspector.get_columns("users")}
        except Exception:
            logging.exception("Failed to inspect users table columns")
            existing_columns = set()

        # Preferences columns used by the frontend.
        preference_columns = {
            "dark_mode": "BOOLEAN NOT NULL DEFAULT 0",
            "email_notifications": "BOOLEAN NOT NULL DEFAULT 1",
            "push_notifications": "BOOLEAN NOT NULL DEFAULT 0",
            "attendance_alerts": "BOOLEAN NOT NULL DEFAULT 1",
            "leave_requests": "BOOLEAN NOT NULL DEFAULT 1",
        }

        missing = [name for name in preference_columns.keys() if name not in existing_columns]
        if missing:
            ddls: list[str] = []
            for col_name in missing:
                col_def = preference_columns[col_name]
                if dialect == "mysql":
                    ddls.append(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
                elif dialect == "sqlite":
                    ddls.append(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
                else:
                    ddls.append(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")

            try:
                with engine.begin() as conn:
                    for ddl in ddls:
                        conn.execute(text(ddl))
                logging.info("Added missing users columns: %s", ", ".join(missing))
            except Exception:
                logging.exception("Failed adding missing users columns: %s", ", ".join(missing))

    if "holidays" not in table_names:
        try:
            if dialect == "mysql":
                ddl = """
                CREATE TABLE holidays (
                  id INTEGER NOT NULL AUTO_INCREMENT,
                  name VARCHAR(150) NOT NULL,
                  date DATE NOT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  INDEX ix_holidays_date (date)
                ) ENGINE=InnoDB
                """
            elif dialect == "sqlite":
                ddl = """
                CREATE TABLE holidays (
                  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                  name VARCHAR(150) NOT NULL,
                  date DATE NOT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            else:
                ddl = """
                CREATE TABLE holidays (
                  id INTEGER NOT NULL PRIMARY KEY,
                  name VARCHAR(150) NOT NULL,
                  date DATE NOT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """

            with engine.begin() as conn:
                conn.execute(text(ddl))
            logging.info("Created holidays table")
        except Exception:
            logging.exception("Failed creating holidays table")

