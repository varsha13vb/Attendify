from app import create_app, db

app = create_app()

with app.app_context():
    try:
        db.create_all()
        print("Database connected and tables ensured.")
    except Exception as exc:
        print(f"Database initialization failed: {exc}")
        raise


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
