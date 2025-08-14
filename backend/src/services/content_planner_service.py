import requests
import json
import uuid
from bs4 import BeautifulSoup
from flask import current_app
from typing import List, Dict, Any, Optional
from src.services.openai_service import OpenAIService

class ContentPlannerService:
    """Service for generating content ideas from URLs or custom ideas."""
    
    def __init__(self):
        self.openai_service = OpenAIService()
        self.default_channels = ["LI", "FB", "IG", "X"]
        self.default_persona = "Unternehmer:in"
        
    def generate_ideas_from_urls(self, urls: List[str], limit: int = 10, 
                                persona: Optional[str] = None, 
                                channels: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Generate content ideas from website URLs.
        
        Args:
            urls: List of URLs to analyze (max 3)
            limit: Number of ideas to generate (default 10)
            persona: Target persona (optional)
            channels: Target channels (optional)
            
        Returns:
            Dictionary with ideas list and optional warnings
        """
        try:
            # Validate URLs
            if not urls or len(urls) == 0:
                raise ValueError("At least one URL is required")
            
            if len(urls) > 3:
                raise ValueError("Maximum 3 URLs allowed")
            
            # Set defaults
            persona = persona or self.default_persona
            channels = channels or self.default_channels
            
            # Extract content from URLs
            extracted_content = []
            warnings = []
            
            for url in urls:
                try:
                    content = self._extract_website_content(url)
                    # Always add content, even if it's just fallback content
                    if content:
                        extracted_content.append(f"URL: {url}\n{content}")
                    else:
                        # Create fallback content if extraction completely fails
                        fallback_content = f"URL: {url}\nTitel: {url}\nInhalt: Website für Content-Analyse verfügbar."
                        extracted_content.append(fallback_content)
                        warnings.append(f"Could not extract detailed content from {url}, using fallback")
                except Exception as e:
                    # Always create fallback content instead of skipping
                    fallback_content = f"URL: {url}\nTitel: {url}\nInhalt: Website für Content-Analyse verfügbar (Fehler: {str(e)[:100]})."
                    extracted_content.append(fallback_content)
                    warnings.append(f"Failed to process {url}: {str(e)}")
            
            # We should always have content now, but double-check
            if not extracted_content:
                # Create minimal fallback content from URLs
                for url in urls:
                    extracted_content.append(f"URL: {url}\nTitel: {url}\nInhalt: Website für grundlegende Content-Analyse verfügbar.")
                warnings.append("Could not extract detailed content from any URL, using basic URL information")
            
            # Combine all extracted content
            combined_context = "\n\n---\n\n".join(extracted_content)
            
            # Generate ideas using OpenAI
            ideas = self._generate_ideas_with_openai(
                context=combined_context,
                mode="url",
                limit=limit,
                persona=persona,
                channels=channels
            )
            
            result = {"ideas": ideas}
            if warnings:
                result["warnings"] = warnings
                
            return result
            
        except Exception as e:
            raise Exception(f"Error generating ideas from URLs: {str(e)}")
    
    def generate_ideas_from_idea(self, idea: str, limit: int = 10,
                                persona: Optional[str] = None,
                                channels: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Generate content ideas from a custom idea/text.
        
        Args:
            idea: Custom idea or text input
            limit: Number of ideas to generate (default 10)
            persona: Target persona (optional)
            channels: Target channels (optional)
            
        Returns:
            Dictionary with ideas list
        """
        try:
            if not idea or not idea.strip():
                raise ValueError("Idea text is required")
            
            # Set defaults
            persona = persona or self.default_persona
            channels = channels or self.default_channels
            
            # Generate ideas using OpenAI
            ideas = self._generate_ideas_with_openai(
                context=idea.strip(),
                mode="idea",
                limit=limit,
                persona=persona,
                channels=channels
            )
            
            return {"ideas": ideas}
            
        except Exception as e:
            raise Exception(f"Error generating ideas from custom idea: {str(e)}")
    
    def _extract_website_content(self, url: str) -> str:
        """
        Extract relevant content from a website URL.
        
        Args:
            url: Website URL to extract content from
            
        Returns:
            Extracted and cleaned content
        """
        try:
            # Validate URL format
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            
            # Set headers to mimic a real browser
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
            
            # Fetch the webpage with timeout
            response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
            response.raise_for_status()
            
            # Check if we got HTML content
            content_type = response.headers.get('content-type', '').lower()
            if 'text/html' not in content_type:
                # Try to extract basic info from non-HTML content
                return f"Titel: {url}\nInhalt: Nicht-HTML-Inhalt gefunden ({content_type})"
            
            # Parse HTML content
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove unwanted elements
            for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'noscript']):
                element.decompose()
            
            # Extract title
            title = ""
            title_tag = soup.find('title')
            if title_tag:
                title = title_tag.get_text().strip()
            
            # Extract meta description
            meta_desc = ""
            meta_tag = soup.find('meta', attrs={'name': 'description'})
            if not meta_tag:
                meta_tag = soup.find('meta', attrs={'property': 'og:description'})
            if meta_tag:
                meta_desc = meta_tag.get('content', '').strip()
            
            # Extract main content
            main_content = ""
            
            # Try to find main content areas (expanded list)
            content_selectors = [
                'main', 'article', '[role="main"]',
                '.content', '#content', '.main', '#main',
                '.post-content', '.entry-content', '.page-content',
                '.container', '.wrapper', '.site-content'
            ]
            
            content_element = None
            for selector in content_selectors:
                content_element = soup.select_one(selector)
                if content_element:
                    break
            
            # If no specific content area found, use body
            if not content_element:
                content_element = soup.find('body')
            
            if content_element:
                # Extract text from paragraphs and headings
                text_elements = content_element.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'div'])
                text_parts = []
                
                for element in text_elements:
                    text = element.get_text().strip()
                    # Filter out very short texts and common navigation elements
                    if (text and len(text) > 15 and 
                        not any(skip in text.lower() for skip in ['cookie', 'datenschutz', 'impressum', 'navigation', 'menu'])):
                        text_parts.append(text)
                
                # Take first 15 meaningful text parts and limit total length
                main_content = ' '.join(text_parts[:15])
                if len(main_content) > 1500:
                    main_content = main_content[:1500] + "..."
            
            # Fallback: extract any text if main content is empty
            if not main_content and soup.body:
                all_text = soup.body.get_text()
                # Clean up whitespace
                import re
                all_text = re.sub(r'\s+', ' ', all_text).strip()
                if len(all_text) > 100:
                    main_content = all_text[:800] + "..." if len(all_text) > 800 else all_text
            
            # Combine extracted information
            extracted_parts = []
            if title:
                extracted_parts.append(f"Titel: {title}")
            if meta_desc:
                extracted_parts.append(f"Beschreibung: {meta_desc}")
            if main_content:
                extracted_parts.append(f"Inhalt: {main_content}")
            
            # Ensure we have at least some content
            if not extracted_parts:
                extracted_parts.append(f"Titel: {url}")
                extracted_parts.append("Inhalt: Website-Inhalt konnte nicht vollständig extrahiert werden, aber URL ist verfügbar für Analyse.")
            
            return '\n'.join(extracted_parts)
            
        except requests.exceptions.Timeout:
            # Return fallback content instead of raising exception
            return f"Titel: {url}\nInhalt: Website-Timeout - URL ist verfügbar für grundlegende Analyse."
        except requests.exceptions.RequestException as e:
            # Return fallback content for network errors
            return f"Titel: {url}\nInhalt: Netzwerkfehler beim Laden der Website - URL ist verfügbar für grundlegende Analyse."
        except Exception as e:
            # Return fallback content for any other errors
            return f"Titel: {url}\nInhalt: Fehler beim Extrahieren des Inhalts - URL ist verfügbar für grundlegende Analyse."
    
    def _generate_ideas_with_openai(self, context: str, mode: str, limit: int,
                                   persona: str, channels: List[str]) -> List[Dict[str, Any]]:
        """
        Generate ideas using OpenAI based on context.
        
        Args:
            context: Content context (extracted from URLs or custom idea)
            mode: Generation mode ("url" or "idea")
            limit: Number of ideas to generate
            persona: Target persona
            channels: Target channels
            
        Returns:
            List of generated ideas
        """
        try:
            # Create the prompt based on mode
            if mode == "url":
                user_prompt = f"""
Lies folgenden Seiten-Kontext (gekürzt, konsolidiert aus URLs). Erzeuge {limit} Social-Media-Themenideen für {', '.join(channels)}, Persona "{persona}", Funnel-Mischung aus Awareness/Consideration/Decision.

Antwortformat (ausschließlich valides JSON):
{{"ideas":[{{"title":"","hook":"","persona":"","funnel":"","channels":["LI"]}}]}}

Kontext:
{context}
"""
            else:  # mode == "idea"
                user_prompt = f"""
Ausgangsidee: {context}

Erzeuge {limit} Social-Media-Themenideen für {', '.join(channels)}, Persona "{persona}", Funnel-Mischung aus Awareness/Consideration/Decision.

Antwortformat (ausschließlich valides JSON):
{{"ideas":[{{"title":"","hook":"","persona":"","funnel":"","channels":["LI"]}}]}}
"""
            
            # Prepare the API request payload
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {
                        "role": "system", 
                        "content": "Du bist eine Content-Strategie-KI für KMU. Liefere ausschließlich valides JSON gemäß Schema. Erstelle vielfältige, praxisnahe Social-Media-Ideen mit klaren Hooks und passenden Funnel-Stufen."
                    },
                    {
                        "role": "user", 
                        "content": user_prompt
                    }
                ],
                "max_tokens": 2000,
                "temperature": 0.8
            }
            
            # Make the API request
            response = requests.post(
                self.openai_service.chat_url,
                headers=self.openai_service.headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"OpenAI API error: {response.status_code} - {response.text}")
            
            result = response.json()
            content = result['choices'][0]['message']['content'].strip()
            
            # Parse JSON response
            try:
                ideas_data = json.loads(content)
                raw_ideas = ideas_data.get('ideas', [])
            except json.JSONDecodeError:
                # Fallback: try to extract JSON from response
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    ideas_data = json.loads(json_match.group())
                    raw_ideas = ideas_data.get('ideas', [])
                else:
                    raise Exception("Could not parse JSON response from OpenAI")
            
            # Normalize and validate ideas
            normalized_ideas = []
            for i, idea in enumerate(raw_ideas[:limit]):
                normalized_idea = {
                    "id": f"idea_{uuid.uuid4().hex[:8]}",
                    "title": idea.get('title', f'Idee {i+1}'),
                    "hook": idea.get('hook', 'Interessanter Hook für Social Media Post.'),
                    "persona": idea.get('persona', persona),
                    "funnel": idea.get('funnel', 'Awareness'),
                    "channels": idea.get('channels', channels)
                }
                normalized_ideas.append(normalized_idea)
            
            # Ensure we have at least some ideas
            if not normalized_ideas:
                # Create fallback ideas
                for i in range(min(3, limit)):
                    fallback_idea = {
                        "id": f"idea_{uuid.uuid4().hex[:8]}",
                        "title": f"Content-Idee {i+1}",
                        "hook": "Spannender Hook für Ihre Zielgruppe.",
                        "persona": persona,
                        "funnel": ["Awareness", "Consideration", "Decision"][i % 3],
                        "channels": channels
                    }
                    normalized_ideas.append(fallback_idea)
            
            return normalized_ideas
            
        except Exception as e:
            raise Exception(f"Error generating ideas with OpenAI: {str(e)}")

