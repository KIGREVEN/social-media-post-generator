/**
 * API client for Content Planner functionality
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Generate content ideas from URLs or custom idea
 * @param {Object} payload - Request payload
 * @param {string} payload.mode - "url" or "idea"
 * @param {string[]} [payload.urls] - Array of URLs (required for mode="url", max 3)
 * @param {string} [payload.idea] - Custom idea text (required for mode="idea")
 * @param {number} [payload.limit=10] - Number of ideas to generate
 * @param {string} [payload.persona] - Target persona
 * @param {string[]} [payload.channels] - Target channels ["LI","FB","IG","X"]
 * @returns {Promise<Object>} Response with ideas array and optional warnings
 */
export async function generatePlannerIdeas(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/planner/ideas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Planner API Error:', error);
    throw new Error(`Planner API Fehler: ${error.message}`);
  }
}

/**
 * Health check for planner service
 * @returns {Promise<Object>} Health status
 */
export async function checkPlannerHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/planner/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Planner Health Check Error:', error);
    throw new Error(`Health Check Fehler: ${error.message}`);
  }
}

