import requests
from flask import current_app
from typing import Optional, Dict, Any
import json
import os

class OpenAIService:
    """Service for OpenAI API integration using direct HTTP calls."""
    
    def __init__(self):
        # Get API key from environment or current_app config
        self.api_key = os.environ.get('OPENAI_API_KEY')
        if not self.api_key:
            try:
                from flask import has_app_context
                if has_app_context():
                    self.api_key = current_app.config.get('OPENAI_API_KEY')
            except:
                pass
        
        if not self.api_key:
            raise ValueError("OpenAI API key not configured")
        
        # OpenAI API endpoints
        self.chat_url = "https://api.openai.com/v1/chat/completions"
        self.images_url = "https://api.openai.com/v1/images/generations"
        
        # Headers for API requests
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def generate_social_media_post(self, profile_url: str, post_theme: str, 
                                 additional_details: str = "", platform: str = "linkedin") -> str:
        """
        Generate a social media post using ChatGPT API via HTTP requests.
        
        Args:
            profile_url: URL of the website/company to analyze
            post_theme: Main theme of the post
            additional_details: Additional context and details
            platform: Target platform (linkedin, facebook, twitter, instagram)
            
        Returns:
            Generated post content
        """
        try:
            # Analyze the website content first
            website_content = self._analyze_website(profile_url)
            
            # Create the prompt based on the specifications
            prompt = self._create_post_prompt(
                profile_url, post_theme, additional_details, 
                website_content, platform
            )
            
            # Prepare the API request payload
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "Du bist ein Top-performing LinkedIn Content Creator mit 15 Jahren Erfahrung in B2B-Content."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 1000,
                "temperature": 0.7
            }
            
            # Make the API request
            response = requests.post(self.chat_url, headers=self.headers, json=payload)
            
            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content'].strip()
            else:
                error_msg = f"OpenAI API error: {response.status_code} - {response.text}"
                raise Exception(error_msg)
            
        except Exception as e:
            raise Exception(f"Error generating post: {str(e)}")
    
    def generate_image(self, prompt: str, size: str = "1024x1024") -> str:
        """
        Generate an image using GPT-Image-1 via direct HTTP API calls.
        Following the official OpenAI API documentation.
        
        Args:
            prompt: Description for image generation
            size: Image size (1024x1024, 1024x1536, 1536x1024, auto)
            
        Returns:
            Base64 encoded image data URL or placeholder
        """
        try:
            print(f"=== GPT-IMAGE-1 HTTP API GENERATION ===")
            print(f"Prompt: {prompt}")
            print(f"Size: {size}")
            
            # Prepare the API request payload for GPT-Image-1
            # According to OpenAI docs: model, prompt, size, quality are the main parameters
            payload = {
                "model": "gpt-image-1",
                "prompt": prompt,
                "size": size,
                "quality": "high"
                # Note: response_format is NOT a valid parameter for GPT-Image-1
                # Base64 data is automatically available in response.data[0].b64_json
            }
            
            print(f"Payload: {payload}")
            
            # Make the HTTP API request to GPT-Image-1
            response = requests.post(
                self.images_url, 
                headers=self.headers, 
                json=payload,
                timeout=180  # 3 minutes timeout for GPT-Image-1 generation
            )
            
            print(f"GPT-Image-1 Response Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"GPT-Image-1 Success! Response keys: {list(result.keys())}")
                
                # Process the base64 image response from GPT-Image-1
                if 'data' in result and len(result['data']) > 0:
                    first_item = result['data'][0]
                    print(f"Image data keys: {list(first_item.keys())}")
                    
                    # According to OpenAI docs, base64 data is in b64_json field
                    if 'b64_json' in first_item and first_item['b64_json']:
                        print("✅ GPT-Image-1 base64 image generated successfully!")
                        return f"data:image/png;base64,{first_item['b64_json']}"
                    elif 'url' in first_item and first_item['url']:
                        print(f"✅ GPT-Image-1 URL generated: {first_item['url']}")
                        return first_item['url']
                    else:
                        print(f"❌ No usable image data. Available keys: {list(first_item.keys())}")
                        raise Exception("No usable image data returned from GPT-Image-1")
                else:
                    print("❌ Invalid response structure from GPT-Image-1")
                    raise Exception("Invalid API response structure")
            else:
                error_text = response.text
                print(f"❌ GPT-Image-1 API error: {response.status_code} - {error_text}")
                
                # No fallback - go directly to placeholder if GPT-Image-1 fails
                print("🔄 GPT-Image-1 failed, using placeholder...")
                return "https://via.placeholder.com/1024x1024/4A90E2/FFFFFF?text=Professional+Business+Image"
            
        except Exception as e:
            print(f"❌ Image generation error: {str(e)}")
            # Final fallback to placeholder
            return "https://via.placeholder.com/1024x1024/4A90E2/FFFFFF?text=Professional+Business+Image"
    
    def create_image_prompt(self, post_content: str, platform: str = "linkedin") -> str:
        """
        Create a platform-specific image prompt based on the generated post content.
        Focus on authentic everyday scenarios instead of corporate presentations.
        
        Args:
            post_content: The generated post content to base the image on
            platform: Target platform (linkedin, facebook, twitter, instagram)
            
        Returns:
            Platform-specific image prompt optimized for authentic everyday photos
        """
        
        # Platform-specific descriptions
        platform_descriptions = {
            "linkedin": "ein authentisches, alltägliches Foto",
            "facebook": "ein natürliches, alltägliches Foto", 
            "instagram": "ein authentisches, alltägliches Foto",
            "twitter": "ein natürliches, alltägliches Foto"
        }
        
        platform_desc = platform_descriptions.get(platform, platform_descriptions["linkedin"])
        
        # Create the improved prompt focusing on authentic everyday scenarios
        prompt = f"""
Erstelle {platform_desc} das zu folgendem Social Media Post passt:

---
{post_content}
---

🎯 WICHTIG: Erstelle ein authentisches Alltags-Foto, NICHT eine Corporate-Präsentation!

📸 Bildstil:
- Zeige echte Menschen in natürlichen Situationen
- Fokus auf die tatsächliche Nutzung des Produkts/Services
- Alltägliche, realistische Szenarien
- Natürliche Umgebung, keine Büro-Präsentationen
- Echte Emotionen und Interaktionen

🏢 Branchen-Beispiele:
- Markisen/Sonnenschutz: Menschen entspannen unter Markise im Garten/Terrasse
- Restaurant/Gastronomie: Gäste genießen Essen in gemütlicher Atmosphäre
- Fitness/Sport: Echte Menschen beim Training, nicht gestellte Posen
- Handwerk: Handwerker bei der Arbeit, authentische Arbeitsszene
- Technologie: Menschen nutzen Technik natürlich im Alltag
- Beratung: Natürliches Gespräch zwischen Menschen
- Einzelhandel: Kunden in echter Einkaufssituation

🎨 Technische Qualität:
- Professional photography, ultra-realistic
- Natural lighting, authentic colors
- High resolution, sharp focus
- Candid moments, not staged poses
- Real-world settings

🚫 VERMEIDE:
- Geschäftsmänner mit Präsentationen
- Corporate Symbole (Pfeile, Diagramme, Zielscheiben)
- Künstliche Business-Szenarien
- Gestellte Stock-Photo-Posen
- Büro-Umgebungen (außer wenn relevant)

📝 Text im Bild:
- Produktname/Firmenname natürlich integriert (z.B. auf Schild, Produkt)
- Deutsche Texte, außer bei Produktnamen
- Subtil und authentisch platziert

Das Bild soll zeigen, wie echte Menschen das Produkt/den Service im Alltag nutzen und davon profitieren.
        """
        
        return prompt.strip()
    
    def get_platform_image_size(self, platform: str) -> str:
        """
        Get the optimal image size for each platform.
        
        Args:
            platform: Target platform
            
        Returns:
            Image size string for the platform
        """
        platform_sizes = {
            "linkedin": "1024x1024",    # Square format works well for LinkedIn
            "facebook": "1024x1024",    # Square format for Facebook posts
            "instagram": "1024x1536",   # Portrait format (9:16 ratio)
            "twitter": "1024x1024"      # Square format for Twitter
        }
        
        return platform_sizes.get(platform, "1024x1024")
    
    def _analyze_website(self, url: str) -> str:
        """
        Analyze website content to extract relevant information.
        
        Args:
            url: Website URL to analyze
            
        Returns:
            Extracted website information
        """
        try:
            # Simple website content extraction
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # Extract basic information (title, meta description, etc.)
            content = response.text
            
            # Simple extraction of title
            title_start = content.find('<title>')
            title_end = content.find('</title>')
            title = ""
            if title_start != -1 and title_end != -1:
                title = content[title_start + 7:title_end].strip()
            
            # Extract meta description
            meta_desc = ""
            if 'meta name="description"' in content:
                desc_start = content.find('meta name="description"')
                desc_content = content[desc_start:desc_start + 200]
                if 'content="' in desc_content:
                    content_start = desc_content.find('content="') + 9
                    content_end = desc_content.find('"', content_start)
                    if content_end != -1:
                        meta_desc = desc_content[content_start:content_end]
            
            return f"Website Title: {title}\nDescription: {meta_desc}"
            
        except Exception as e:
            return f"Could not analyze website: {str(e)}"
    
    def _create_post_prompt(self, profile_url: str, post_theme: str, 
                          additional_details: str, website_content: str, 
                          platform: str) -> str:
        """
        Create the prompt for post generation based on specifications.
        
        Args:
            profile_url: URL of the website/company
            post_theme: Main theme of the post
            additional_details: Additional context
            website_content: Analyzed website content
            platform: Target platform
            
        Returns:
            Complete prompt for ChatGPT
        """
        prompt = f"""
Analysiere die folgende Website: {profile_url} und erstelle basierend auf dem Post-Thema "{post_theme}" und den Zusatzinformationen "{additional_details}" einen professionellen Social Media Post.

Website-Informationen:
{website_content}

🎯 Rolle:
Du bist ein Top-performing LinkedIn Content Creator mit 15 Jahren Erfahrung in B2B-Content.

📌 Ziel:
Erstelle einen **deutschen Social Media Post**, der professionell klingt, aber nicht wie ein Blogartikel – kurz, klar und mit echtem Mehrwert für die Zielgruppe.

📋 Aufbau:
- Beginne mit einem auffälligen Hook (1–2 Zeilen)
- Erkläre kurz, warum das Thema relevant ist
- Gib 2–3 konkrete Tipps, Impulse oder Learnings
- Baue den Namen der Firma subtil als erfahrenen Partner ein (nicht werblich!)
- Schließe mit einer Frage oder Call-to-Conversation ab
- Füge max. 3 relevante Hashtags hinzu

🧠 Stil:
- Aktiv, direkt und menschlich
- Keine Buzzwords (z. B. „disruptiv", „nahtlos integrieren", „revolutionieren")
- Keine Floskeln
- Kurze, abwechslungsreiche Sätze
- Authentisch, aber pointiert

🚨 WICHTIG:
- Verwende KEINE strukturellen Bezeichnungen wie "Einleitung:", "Hauptteil:", "Abschluss:" im Text
- Der Post soll direkt postfähig sein ohne weitere Bearbeitung
- Schreibe fließenden Text ohne Meta-Strukturen

🎯 Output:
Nur der fertige Social Media Post auf Deutsch, **kein Kommentar, keine Erklärung**, sofort postfähig. Maximal ca. 500 Wörter oder 1.300 Zeichen.
"""
        
        # Platform-specific adjustments
        if platform == "twitter":
            prompt += "\n\nBesondere Anforderung: Der Post muss für Twitter optimiert sein (max. 280 Zeichen)."
        elif platform == "instagram":
            prompt += "\n\nBesondere Anforderung: Der Post sollte visuell ansprechend und für Instagram optimiert sein."
        elif platform == "facebook":
            prompt += "\n\nBesondere Anforderung: Der Post sollte für Facebook optimiert sein und kann etwas länger sein."
        
        return prompt.strip()

