from flask import Blueprint, request, jsonify
from src.models import db, User, PostUsage
import logging

# Blueprint erstellen
subscription_api_bp = Blueprint('subscription_api', __name__)

# Logging konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@subscription_api_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user_subscription(user_id):
    """
    Subscription eines Benutzers aktualisieren (ohne JWT-Authentication)
    """
    try:
        logger.info(f"Subscription-Update-Request für Benutzer {user_id}")
        
        # Request-Daten abrufen
        data = request.get_json()
        if not data:
            logger.error("Keine JSON-Daten erhalten")
            return jsonify({'error': 'Keine Daten erhalten'}), 400
        
        new_subscription = data.get('subscription')
        if not new_subscription:
            logger.error("Subscription-Feld fehlt")
            return jsonify({'error': 'Subscription-Feld ist erforderlich'}), 400
        
        # Gültige Subscription-Typen
        valid_subscriptions = ['free', 'basic', 'premium', 'enterprise']
        if new_subscription not in valid_subscriptions:
            logger.error(f"Ungültige Subscription: {new_subscription}")
            return jsonify({'error': f'Ungültige Subscription. Erlaubt: {valid_subscriptions}'}), 400
        
        # Benutzer finden
        user = User.query.get(user_id)
        if not user:
            logger.error(f"Benutzer {user_id} nicht gefunden")
            return jsonify({'error': 'Benutzer nicht gefunden'}), 404
        
        # Alte Subscription speichern
        old_subscription = user.subscription
        logger.info(f"Ändere Subscription von {old_subscription} zu {new_subscription}")
        
        # Subscription aktualisieren
        user.subscription = new_subscription
        
        # Post-Limits basierend auf Subscription setzen
        subscription_limits = {
            'free': 10,
            'basic': 50,
            'premium': 200,
            'enterprise': 1000
        }
        
        new_limit = subscription_limits.get(new_subscription, 10)
        
        # PostUsage aktualisieren oder erstellen
        post_usage = PostUsage.query.filter_by(user_id=user_id).first()
        if not post_usage:
            post_usage = PostUsage(
                user_id=user_id,
                posts_this_month=0,
                monthly_limit=new_limit
            )
            db.session.add(post_usage)
        else:
            post_usage.monthly_limit = new_limit
        
        # Änderungen speichern
        db.session.commit()
        
        logger.info(f"Subscription erfolgreich aktualisiert: {user.username} -> {new_subscription}")
        
        return jsonify({
            'message': 'Subscription erfolgreich aktualisiert',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'subscription': user.subscription,
                'monthly_limit': new_limit
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Fehler beim Subscription-Update: {str(e)}")
        db.session.rollback()
        return jsonify({'error': f'Server-Fehler: {str(e)}'}), 500

@subscription_api_bp.route('/users/<int:user_id>/subscription', methods=['PUT'])
def update_subscription_only(user_id):
    """
    Nur Subscription aktualisieren (alternative Route)
    """
    try:
        logger.info(f"Alternative Subscription-Update für Benutzer {user_id}")
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Keine Daten erhalten'}), 400
        
        new_subscription = data.get('subscription')
        if not new_subscription:
            return jsonify({'error': 'Subscription-Feld ist erforderlich'}), 400
        
        # Gültige Subscription-Typen
        valid_subscriptions = ['free', 'basic', 'premium', 'enterprise']
        if new_subscription not in valid_subscriptions:
            return jsonify({'error': f'Ungültige Subscription. Erlaubt: {valid_subscriptions}'}), 400
        
        # Benutzer finden und aktualisieren
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Benutzer nicht gefunden'}), 404
        
        user.subscription = new_subscription
        db.session.commit()
        
        logger.info(f"Subscription aktualisiert: {user.username} -> {new_subscription}")
        
        return jsonify({
            'message': 'Subscription erfolgreich aktualisiert',
            'subscription': new_subscription
        }), 200
        
    except Exception as e:
        logger.error(f"Fehler beim Subscription-Update: {str(e)}")
        db.session.rollback()
        return jsonify({'error': f'Server-Fehler: {str(e)}'}), 500

@subscription_api_bp.route('/bulk-update', methods=['POST'])
def bulk_update_subscriptions():
    """
    Mehrere Subscriptions gleichzeitig aktualisieren
    """
    try:
        logger.info("Bulk Subscription-Update gestartet")
        
        data = request.get_json()
        if not data or 'updates' not in data:
            return jsonify({'error': 'Updates-Array erforderlich'}), 400
        
        updates = data['updates']
        results = []
        
        for update in updates:
            user_id = update.get('user_id')
            subscription = update.get('subscription')
            
            if not user_id or not subscription:
                results.append({
                    'user_id': user_id,
                    'success': False,
                    'error': 'user_id und subscription erforderlich'
                })
                continue
            
            try:
                user = User.query.get(user_id)
                if not user:
                    results.append({
                        'user_id': user_id,
                        'success': False,
                        'error': 'Benutzer nicht gefunden'
                    })
                    continue
                
                user.subscription = subscription
                results.append({
                    'user_id': user_id,
                    'success': True,
                    'subscription': subscription
                })
                
            except Exception as e:
                results.append({
                    'user_id': user_id,
                    'success': False,
                    'error': str(e)
                })
        
        db.session.commit()
        logger.info(f"Bulk-Update abgeschlossen: {len(results)} Updates")
        
        return jsonify({
            'message': 'Bulk-Update abgeschlossen',
            'results': results
        }), 200
        
    except Exception as e:
        logger.error(f"Fehler beim Bulk-Update: {str(e)}")
        db.session.rollback()
        return jsonify({'error': f'Server-Fehler: {str(e)}'}), 500

@subscription_api_bp.route('/stats', methods=['GET'])
def get_subscription_stats():
    """
    Subscription-Statistiken abrufen
    """
    try:
        logger.info("Subscription-Statistiken angefordert")
        
        # Subscription-Verteilung zählen
        stats = {}
        for subscription_type in ['free', 'basic', 'premium', 'enterprise']:
            count = User.query.filter_by(subscription=subscription_type).count()
            stats[subscription_type] = count
        
        # Zusätzliche Statistiken
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        
        return jsonify({
            'subscription_distribution': stats,
            'total_users': total_users,
            'active_users': active_users,
            'premium_enterprise_users': stats.get('premium', 0) + stats.get('enterprise', 0)
        }), 200
        
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Statistiken: {str(e)}")
        return jsonify({'error': f'Server-Fehler: {str(e)}'}), 500

@subscription_api_bp.route('/health', methods=['GET'])
def subscription_api_health():
    """
    Health-Check für Subscription-API
    """
    try:
        # Einfache Datenbankverbindung testen
        user_count = User.query.count()
        
        return jsonify({
            'status': 'healthy',
            'message': 'Subscription-API funktioniert',
            'user_count': user_count,
            'timestamp': str(db.func.now())
        }), 200
        
    except Exception as e:
        logger.error(f"Health-Check fehlgeschlagen: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

