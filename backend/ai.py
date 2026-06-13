import httpx
import json
import logging
from typing import Dict, List, Any

from config import OPENROUTER_API_KEY, OPENROUTER_MODEL

logger = logging.getLogger(__name__)

class AIError(Exception):
    pass

SYSTEM_PROMPT = """You are a Senior Product Security Engineer.

Perform STRIDE threat modeling on the provided module within the context of the supplied application architecture.

You MUST identify and document at least one realistic threat for EACH of the 6 STRIDE categories:
1. Spoofing
2. Tampering
3. Repudiation
4. Information Disclosure
5. Denial of Service
6. Elevation of Privilege

This means your output JSON array MUST contain at least 6 threat entries (one for each of the 6 STRIDE methods listed above). Do not stop generating after only one or two threats; analyze all categories thoroughly.

Return only valid JSON matching this schema:
{
  "threats": [
    {
      "threat_name": "Name of the threat",
      "stride_category": "Spoofing / Tampering / Repudiation / Information Disclosure / Denial of Service / Elevation of Privilege",
      "risk_level": "Critical / High / Medium / Low",
      "attack_scenario": "Detailed scenario of how the threat is exploited",
      "mitigation": "Practical remediation or mitigation steps"
    }
  ]
}

Use practical application security knowledge.
Avoid generic responses.
"""

def generate_threat_model(
    project_info: Dict[str, str],
    architecture: str,
    module_name: str,
    module_notes: str
) -> List[Dict[str, str]]:
    if not OPENROUTER_API_KEY:
        raise AIError("OpenRouter API key is not configured. Please set the OPENROUTER_API_KEY environment variable.")

    # Construct the user message
    user_content = f"""
PROJECT METADATA:
Project Name: {project_info.get('name', 'Unknown')}
Description: {project_info.get('description', '')}
Tech Stack: {project_info.get('tech_stack', '')}
Notes: {project_info.get('notes', '')}

APPLICATION ARCHITECTURE:
{architecture}

CURRENT MODULE TO MODEL:
Module Name: {module_name}
Module Notes:
{module_notes}
"""

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/Bharathkumar-2006/website-using-Django",  # Optional, but nice for OpenRouter
        "X-Title": "ThreatForge"
    }

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content}
        ]
    }

    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                error_msg = response.text
                try:
                    error_json = response.json()
                    error_msg = error_json.get("error", {}).get("message", response.text)
                except Exception:
                    pass
                raise AIError(f"OpenRouter API returned error ({response.status_code}): {error_msg}")
                
            res_data = response.json()
            choices = res_data.get("choices", [])
            if not choices:
                raise AIError("No completion choices returned from OpenRouter.")
                
            message = choices[0].get("message", {})
            content = message.get("content")
            if content is None:
                refusal = message.get("refusal")
                if refusal:
                    raise AIError(f"Model refused request: {refusal}")
                raise AIError("Model returned empty content (null). The selected free model might be overloaded or rate-limited. Please try again.")
            content = content.strip()
            if not content:
                raise AIError("Empty content received from OpenRouter model.")
                
            # Parse the JSON response
            try:
                parsed = json.loads(content)
            except json.JSONDecodeError as je:
                # If json loading failed, maybe try to extract json from codeblock markers
                try:
                    if "```json" in content:
                        inner = content.split("```json")[1].split("```")[0].strip()
                        parsed = json.loads(inner)
                    elif "```" in content:
                        inner = content.split("```")[1].split("```")[0].strip()
                        parsed = json.loads(inner)
                    else:
                        raise je
                except Exception:
                    raise AIError(f"Failed to parse model output as JSON. Output received:\n{content}")
            
            threats = parsed.get("threats", [])
            if not isinstance(threats, list):
                raise AIError("Invalid response format: 'threats' key must map to a list.")
                
            # Validate each threat item
            validated_threats = []
            for t in threats:
                validated_threats.append({
                    "threat_name": str(t.get("threat_name", "Unnamed Threat")),
                    "stride_category": str(t.get("stride_category", "Unknown")),
                    "risk_level": str(t.get("risk_level", "Medium")),
                    "attack_scenario": str(t.get("attack_scenario", "")),
                    "mitigation": str(t.get("mitigation", ""))
                })
                
            return validated_threats
            
    except httpx.RequestError as re:
        raise AIError(f"Network error communicating with OpenRouter: {str(re)}")
    except Exception as e:
        if not isinstance(e, AIError):
            raise AIError(f"Threat generation failed: {str(e)}")
        raise e
