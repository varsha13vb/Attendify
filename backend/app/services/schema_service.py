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

    if "system_config" not in table_names:
        try:
            if dialect == "mysql":
                ddl = """
                CREATE TABLE system_config (
                  id INTEGER NOT NULL,
                  check_in VARCHAR(5) NOT NULL DEFAULT '09:00',
                  check_out VARCHAR(5) NOT NULL DEFAULT '18:00',
                  late_tolerance INTEGER NOT NULL DEFAULT 15,
                  monthly_late_wallet INTEGER NOT NULL DEFAULT 45,
                  min_work_hours INTEGER NOT NULL DEFAULT 8,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (id)
                ) ENGINE=InnoDB
                """
            elif dialect == "sqlite":
                ddl = """
                CREATE TABLE system_config (
                  id INTEGER NOT NULL PRIMARY KEY,
                  check_in TEXT NOT NULL DEFAULT '09:00',
                  check_out TEXT NOT NULL DEFAULT '18:00',
                  late_tolerance INTEGER NOT NULL DEFAULT 15,
                  monthly_late_wallet INTEGER NOT NULL DEFAULT 45,
                  min_work_hours INTEGER NOT NULL DEFAULT 8,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            else:
                ddl = """
                CREATE TABLE system_config (
                  id INTEGER NOT NULL PRIMARY KEY,
                  check_in VARCHAR(5) NOT NULL DEFAULT '09:00',
                  check_out VARCHAR(5) NOT NULL DEFAULT '18:00',
                  late_tolerance INTEGER NOT NULL DEFAULT 15,
                  monthly_late_wallet INTEGER NOT NULL DEFAULT 45,
                  min_work_hours INTEGER NOT NULL DEFAULT 8,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """

            with engine.begin() as conn:
                conn.execute(text(ddl))
                conn.execute(text(
                    "INSERT INTO system_config (id, check_in, check_out, late_tolerance, monthly_late_wallet, min_work_hours) "
                    "VALUES (1, '09:00', '18:00', 15, 45, 8)"
                ))
            logging.info("Created system_config table with default row")
            table_names.add("system_config")
        except Exception:
            logging.exception("Failed creating system_config table")

    if "system_config" in table_names:
        try:
            existing_columns = {col["name"] for col in inspector.get_columns("system_config")}
        except Exception:
            logging.exception("Failed to inspect system_config table columns")
            existing_columns = set()

        system_columns = {
            "check_in": "VARCHAR(5) NOT NULL DEFAULT '09:00'",
            "check_out": "VARCHAR(5) NOT NULL DEFAULT '18:00'",
            "late_tolerance": "INTEGER NOT NULL DEFAULT 15",
            "monthly_late_wallet": "INTEGER NOT NULL DEFAULT 45",
            "min_work_hours": "INTEGER NOT NULL DEFAULT 8",
            "updated_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        }

        missing = [name for name in system_columns.keys() if name not in existing_columns]
        if missing:
            ddls: list[str] = []
            for col_name in missing:
                col_def = system_columns[col_name]
                ddls.append(f"ALTER TABLE system_config ADD COLUMN {col_name} {col_def}")

            try:
                with engine.begin() as conn:
                    for ddl in ddls:
                        conn.execute(text(ddl))
                logging.info("Added missing system_config columns: %s", ", ".join(missing))
            except Exception:
                logging.exception("Failed adding missing system_config columns: %s", ", ".join(missing))

        # Ensure at least one row exists.
        try:
            with engine.begin() as conn:
                count = conn.execute(text("SELECT COUNT(*) FROM system_config")).scalar() or 0
                if int(count) == 0:
                    conn.execute(text(
                        "INSERT INTO system_config (id, check_in, check_out, late_tolerance, monthly_late_wallet, min_work_hours) "
                        "VALUES (1, '09:00', '18:00', 15, 45, 8)"
                    ))
        except Exception:
            logging.exception("Failed ensuring system_config default row")

    if "users" in table_names:
        try:
            existing_columns = {col["name"] for col in inspector.get_columns("users")}
        except Exception:
            logging.exception("Failed to inspect users table columns")
            existing_columns = set()

        # Preferences columns used by the frontend.
        preference_columns = {
            "department": "VARCHAR(100) NULL",
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

    if "notifications" in table_names:
        try:
            existing_columns = {col["name"] for col in inspector.get_columns("notifications")}
        except Exception:
            logging.exception("Failed to inspect notifications table columns")
            existing_columns = set()

        notification_columns = {
            "event_key": "VARCHAR(140) NULL",
        }

        missing = [name for name in notification_columns.keys() if name not in existing_columns]
        if missing:
            ddls: list[str] = []
            for col_name in missing:
                col_def = notification_columns[col_name]
                ddls.append(f"ALTER TABLE notifications ADD COLUMN {col_name} {col_def}")

            try:
                with engine.begin() as conn:
                    for ddl in ddls:
                        conn.execute(text(ddl))
                logging.info("Added missing notifications columns: %s", ", ".join(missing))
            except Exception:
                logging.exception("Failed adding missing notifications columns: %s", ", ".join(missing))

    if "justifications" in table_names:
        try:
            existing_columns = {col["name"] for col in inspector.get_columns("justifications")}
        except Exception:
            logging.exception("Failed to inspect justifications table columns")
            existing_columns = set()

        justification_columns = {
            # Added later; older DBs may be missing these.
            "late_minutes": "INTEGER NULL DEFAULT 0",
            "admin_response": "TEXT NULL",
        }

        missing = [name for name in justification_columns.keys() if name not in existing_columns]
        if missing:
            ddls: list[str] = []
            for col_name in missing:
                col_def = justification_columns[col_name]
                ddls.append(f"ALTER TABLE justifications ADD COLUMN {col_name} {col_def}")

            try:
                with engine.begin() as conn:
                    for ddl in ddls:
                        conn.execute(text(ddl))
                logging.info("Added missing justifications columns: %s", ", ".join(missing))
            except Exception:
                logging.exception("Failed adding missing justifications columns: %s", ", ".join(missing))

    if "attendance" in table_names:
        try:
            existing_columns = {col["name"] for col in inspector.get_columns("attendance")}
        except Exception:
            logging.exception("Failed to inspect attendance table columns")
            existing_columns = set()

        if "checkout" not in existing_columns:
            if dialect == "sqlite":
                checkout_def = "TIME NULL"
            else:
                checkout_def = "TIME NULL"

            try:
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE attendance ADD COLUMN checkout {checkout_def}"))
                logging.info("Added missing attendance column: checkout")
            except Exception:
                logging.exception("Failed adding missing attendance column: checkout")

    if "leaves" in table_names:
        try:
            existing_columns = {col["name"] for col in inspector.get_columns("leaves")}
        except Exception:
            logging.exception("Failed to inspect leaves table columns")
            existing_columns = set()

        leave_columns = {
            "admin_response": "TEXT NULL",
        }

        missing = [name for name in leave_columns.keys() if name not in existing_columns]
        if missing:
            ddls: list[str] = []
            for col_name in missing:
                col_def = leave_columns[col_name]
                ddls.append(f"ALTER TABLE leaves ADD COLUMN {col_name} {col_def}")

            try:
                with engine.begin() as conn:
                    for ddl in ddls:
                        conn.execute(text(ddl))
                logging.info("Added missing leaves columns: %s", ", ".join(missing))
            except Exception:
                logging.exception("Failed adding missing leaves columns: %s", ", ".join(missing))
