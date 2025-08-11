import openai
from openai import OpenAI
import requests
from flask import current_app
from typing import Optional, Dict, Any
import os

class OpenAIService:
    """Service for OpenAI API integration."""
    
    def __init__(self):
        self.api_key = current_app.config.get('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API key not configured")
        
        # Initialize the OpenAI client (v1.0+ API)
        self.client = OpenAI(api_key=self.api_key)
    
    def generate_social_media_post(self, profile_url: str, post_theme: str, 
                                 additional_details: str = "", platform: str = "linkedin") -> str:
        """
        Generate a social media post using ChatGPT API.
        
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
            
            # Generate the post using ChatGPT
            response = self.client.chat.completions.create(
                model="gpt-4.1-mini",  # Updated to available model
                messages=[
                    {"role": "system", "content": "Du bist ein Top-performing LinkedIn Content Creator mit 15 Jahren Erfahrung in B2B-Content."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            raise Exception(f"Error generating post: {str(e)}")
    
    def generate_image(self, prompt: str, size: str = "1024x1024") -> str:
        """
        Generate an image using available image generation services.
        Note: Image generation is currently not available with this API key.
        
        Args:
            prompt: Description for image generation
            size: Image size (256x256, 512x512, 1024x1024)
            
        Returns:
            Placeholder message or alternative solution
        """
        # Image generation is not available with current API access
        # Return a placeholder or alternative solution
        return "https://via.placeholder.com/1024x1024/4A90E2/FFFFFF?text=Professional+Business+Image"
    
    def create_image_prompt(self, post_theme: str, company_info: str = "") -> str:
        """
        Create a professional image prompt optimized for GPT-Image-1.
        
        Args:
            post_theme: Main theme of the post
            company_info: Information about the company
            
        Returns:
            Professional image prompt optimized for GPT-Image-1
        """
        base_prompt = f"""
        Create a professional business image for social media about: {post_theme}
        
        Style: Modern, clean, professional business aesthetic with high visual impact
        Colors: Professional color palette featuring blues, whites, and subtle accent colors
        Composition: Well-balanced, visually appealing layout suitable for social media
        Quality: High-resolution, crisp, and professional-grade imagery
        Elements: Business-appropriate visual elements, no text overlays, focus on visual storytelling
        
        {f"Company context: {company_info}" if company_info else ""}
        
        The image should be optimized for GPT-Image-1's capabilities and convey professionalism, trust, and expertise.
        Perfect for LinkedIn, Facebook, and other professional social media platforms.
        """
        
        return base_prompt.strip()
    
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

📋 Struktur:
1. **Hook (1–2 Zeilen)** – auffällig für die Vorschau
2. **Einleitung** – Warum ist das Thema relevant?
3. **Hauptteil** – 2–3 konkrete Tipps, Impulse oder Learnings
4. **Name der Firma** – subtil als erfahrener Partner einbauen (nicht werblich!)
5. **Abschluss** – Frage oder Call-to-Conversation
6. **Max. 3 relevante Hashtags**

🧠 Stil:
- Aktiv, direkt und menschlich
- Keine Buzzwords (z. B. „disruptiv", „nahtlos integrieren", „revolutionieren")
- Keine Floskeln
- Kurze, abwechslungsreiche Sätze
- Authentisch, aber pointiert

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

