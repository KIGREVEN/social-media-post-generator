from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from src.services.content_planner_service import ContentPlannerService
import logging

# Create blueprint for planner routes
planner_bp = Blueprint('planner', __name__)

# Initialize the content planner service
content_planner_service = ContentPlannerService()

@planner_bp.route('/ideas', methods=['POST'])
@cross_origin()
def generate_ideas():
    """
    Generate content ideas from URLs or custom ideas.
    
    Request JSON:
    {
        "mode": "url" | "idea",
        "urls": ["https://www.greven.de"],   // Required for mode=url (max 3)
        "idea": "Custom idea text",         // Required for mode=idea
        "limit": 10,                        // Optional, default 10
        "persona": "Inhaber:in KMU Köln",   // Optional
        "channels": ["LI","FB","IG","X"]    // Optional
    }
    
    Response JSON:
    {
        "ideas": [
            {
                "id": "idea_1",
                "title": "Lokale Sichtbarkeit stärken",
                "hook": "Kurzer 1-Satz-Hook mit Nutzen & Kontext.",
                "persona": "Inhaber:in KMU Köln",
                "funnel": "Awareness|Consideration|Decision",
                "channels": ["LI","FB","IG","X"]
            }
        ],
        "warnings": []  // Optional, only if there were issues
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        # Validate required fields
        mode = data.get('mode')
        if not mode or mode not in ['url', 'idea']:
            return jsonify({"error": "Mode must be 'url' or 'idea'"}), 400
        
        # Get optional parameters
        limit = data.get('limit', 10)
        persona = data.get('persona')
        channels = data.get('channels')
        
        # Validate limit
        if not isinstance(limit, int) or limit < 1 or limit > 20:
            return jsonify({"error": "Limit must be an integer between 1 and 20"}), 400
        
        # Validate channels if provided
        valid_channels = ["LI", "FB", "IG", "X"]
        if channels:
            if not isinstance(channels, list):
                return jsonify({"error": "Channels must be a list"}), 400
            for channel in channels:
                if channel not in valid_channels:
                    return jsonify({"error": f"Invalid channel: {channel}. Valid channels: {valid_channels}"}), 400
        
        # Log the request (metadata only)
        logging.info(f"Content Planner request: mode={mode}, limit={limit}, persona={persona}, channels={channels}")
        
        # Handle URL mode
        if mode == 'url':
            urls = data.get('urls')
            if not urls:
                return jsonify({"error": "URLs are required for URL mode"}), 400
            
            if not isinstance(urls, list):
                return jsonify({"error": "URLs must be a list"}), 400
            
            if len(urls) == 0:
                return jsonify({"error": "At least one URL is required"}), 400
            
            if len(urls) > 3:
                return jsonify({"error": "Maximum 3 URLs allowed"}), 400
            
            # Validate URL formats
            for url in urls:
                if not isinstance(url, str) or not url.strip():
                    return jsonify({"error": "All URLs must be non-empty strings"}), 400
                
                # Basic URL validation
                url_lower = url.lower().strip()
                if not (url_lower.startswith('http://') or url_lower.startswith('https://') or 
                       ('.' in url_lower and not url_lower.startswith('.'))):
                    return jsonify({"error": f"Invalid URL format: {url}"}), 400
            
            # Generate ideas from URLs
            try:
                result = content_planner_service.generate_ideas_from_urls(
                    urls=urls,
                    limit=limit,
                    persona=persona,
                    channels=channels
                )
                
                logging.info(f"Generated {len(result.get('ideas', []))} ideas from {len(urls)} URLs")
                return jsonify(result), 200
                
            except Exception as e:
                logging.error(f"Error generating ideas from URLs: {str(e)}")
                return jsonify({"error": f"Failed to generate ideas from URLs: {str(e)}"}), 500
        
        # Handle idea mode
        elif mode == 'idea':
            idea = data.get('idea')
            if not idea:
                return jsonify({"error": "Idea text is required for idea mode"}), 400
            
            if not isinstance(idea, str) or not idea.strip():
                return jsonify({"error": "Idea must be a non-empty string"}), 400
            
            if len(idea.strip()) < 5:
                return jsonify({"error": "Idea text must be at least 5 characters long"}), 400
            
            # Generate ideas from custom idea
            try:
                result = content_planner_service.generate_ideas_from_idea(
                    idea=idea,
                    limit=limit,
                    persona=persona,
                    channels=channels
                )
                
                logging.info(f"Generated {len(result.get('ideas', []))} ideas from custom idea")
                return jsonify(result), 200
                
            except Exception as e:
                logging.error(f"Error generating ideas from custom idea: {str(e)}")
                return jsonify({"error": f"Failed to generate ideas from custom idea: {str(e)}"}), 500
    
    except Exception as e:
        logging.error(f"Unexpected error in generate_ideas: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@planner_bp.route('/health', methods=['GET'])
@cross_origin()
def health_check():
    """Health check endpoint for the planner service."""
    return jsonify({
        "status": "healthy",
        "service": "content-planner",
        "version": "1.0.0"
    }), 200

