from flask import Blueprint, jsonify
from src.models import db, User
import logging

# Blueprint erstellen
migration_fix_bp = Blueprint('migration_fix', __name__)

# Logging konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@migration_fix_bp.route('/add-subscription-column', methods=['POST'])
def add_subscription_column():
    """
    Subscription-Spalte zur User-Tabelle hinzufügen
    """
    try:
        logger.info("Starte Subscription-Spalten-Migration...")
        
        # SQL-Befehl zum Hinzufügen der Subscription-Spalte
        sql_commands = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription VARCHAR(20) DEFAULT 'free';",
            "UPDATE users SET subscription = 'free' WHERE subscription IS NULL;"
        ]
        
        results = []
        for sql in sql_commands:
            try:
                logger.info(f"Führe SQL aus: {sql}")
                db.session.execute(db.text(sql))
                results.append(f"✅ Erfolgreich: {sql}")
            except Exception as e:
                logger.error(f"Fehler bei SQL: {sql} - {str(e)}")
                results.append(f"❌ Fehler: {sql} - {str(e)}")
        
        # Änderungen speichern
        db.session.commit()
        logger.info("Migration erfolgreich abgeschlossen")
        
        return jsonify({
            'message': 'Subscription-Spalte erfolgreich hinzugefügt',
            'results': results,
            'status': 'success'
        }), 200
        
    except Exception as e:
        logger.error(f"Migration fehlgeschlagen: {str(e)}")
        db.session.rollback()
        return jsonify({
            'error': f'Migration fehlgeschlagen: {str(e)}',
            'status': 'error'
        }), 500

@migration_fix_bp.route('/check-schema', methods=['GET'])
def check_schema():
    """
    Datenbank-Schema überprüfen
    """
    try:
        logger.info("Überprüfe Datenbank-Schema...")
        
        # Tabellen-Schema abfragen
        result = db.session.execute(db.text("""
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position;
        """))
        
        columns = []
        for row in result:
            columns.append({
                'column_name': row[0],
                'data_type': row[1],
                'is_nullable': row[2],
                'column_default': row[3]
            })
        
        # Prüfen ob Subscription-Spalte existiert
        has_subscription = any(col['column_name'] == 'subscription' for col in columns)
        
        return jsonify({
            'table': 'users',
            'columns': columns,
            'has_subscription_column': has_subscription,
            'status': 'success'
        }), 200
        
    except Exception as e:
        logger.error(f"Schema-Check fehlgeschlagen: {str(e)}")
        return jsonify({
            'error': f'Schema-Check fehlgeschlagen: {str(e)}',
            'status': 'error'
        }), 500

@migration_fix_bp.route('/test-subscription', methods=['GET'])
def test_subscription():
    """
    Subscription-Zugriff testen
    """
    try:
        logger.info("Teste Subscription-Zugriff...")
        
        # Ersten Benutzer abrufen
        user = User.query.first()
        if not user:
            return jsonify({
                'error': 'Keine Benutzer gefunden',
                'status': 'error'
            }), 404
        
        # Versuche auf Subscription-Attribut zuzugreifen
        try:
            subscription = getattr(user, 'subscription', 'NICHT_VORHANDEN')
            return jsonify({
                'user_id': user.id,
                'username': user.username,
                'subscription': subscription,
                'has_subscription_attr': hasattr(user, 'subscription'),
                'status': 'success'
            }), 200
        except Exception as attr_error:
            return jsonify({
                'user_id': user.id,
                'username': user.username,
                'subscription_error': str(attr_error),
                'has_subscription_attr': hasattr(user, 'subscription'),
                'status': 'error'
            }), 500
        
    except Exception as e:
        logger.error(f"Subscription-Test fehlgeschlagen: {str(e)}")
        return jsonify({
            'error': f'Subscription-Test fehlgeschlagen: {str(e)}',
            'status': 'error'
        }), 500

@migration_fix_bp.route('/health', methods=['GET'])
def migration_health():
    """
    Migration-Health-Check
    """
    try:
        # Einfache Datenbankverbindung testen
        user_count = User.query.count()
        
        return jsonify({
            'status': 'healthy',
            'message': 'Migration-API funktioniert',
            'user_count': user_count
        }), 200
        
    except Exception as e:
        logger.error(f"Health-Check fehlgeschlagen: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

