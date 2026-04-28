import { GoogleGenAI, Type } from "@google/genai";
import { Need, Volunteer } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const aiService = {
  /**
   * Parses unstructured community reporting text, voice transcripts, or images into a structured Need object.
   */
  async parseNeedFromReport(report: string, imageBase64?: string): Promise<Partial<Need>> {
    const parts: any[] = [{ text: `Extract community need details from this report: "${report}".` }];
    
    if (imageBase64) {
      const mimeType = imageBase64.split(';')[0].split(':')[1] || "image/jpeg";
      const base64Data = imageBase64.split(',')[1];
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            category: { 
              type: Type.STRING,
              description: "Must be one of: medical, food, water, infrastructure, education, other"
            },
            population: { type: Type.INTEGER },
            severity: { 
              type: Type.STRING,
              description: "Must be one of: low, medium, high, critical"
            },
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER }
          },
          required: ["description", "category", "severity"]
        }
      }
    });

    const responseText = response.text;

    try {
      const data = JSON.parse(responseText || "{}");
      
      // Ensure category is whitelisted
      const validCategories = ['medical', 'food', 'water', 'infrastructure', 'education', 'other'];
      let category = data.category?.toLowerCase() || 'other';
      if (!validCategories.includes(category)) category = 'other';

      // Ensure severity is whitelisted
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      let severity = data.severity?.toLowerCase() || 'medium';
      if (!validSeverities.includes(severity)) severity = 'medium';

      return {
        description: data.description || report,
        category: category as any,
        severity: severity as any,
        population: data.population || 0,
        location: {
          lat: data.lat || 19.0760,
          lng: data.lng || 72.8777
        }
      };
    } catch (e) {
      console.error("AI Parsing failed", e);
      return { description: report, category: 'other', severity: 'medium' };
    }
  },

  /**
   * Calculates a priority score (0-100) based on need details and context.
   */
  async calculatePriority(need: Partial<Need>): Promise<number> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Rate the urgency (0-100) for this need: ${JSON.stringify(need)}. Consider population size and severity. Return only the number.`
    });
    const score = parseInt(response.text?.trim() || "50");
    return isNaN(score) ? 50 : score;
  },

  /**
   * Smart allocation: finds the best volunteer for a need.
   * Considers skills, current workload (activeTasks), fatigueLevel, and proximity.
   */
  async matchVolunteer(need: Need, availableVolunteers: Volunteer[]): Promise<string | null> {
    const eligibleVolunteers = availableVolunteers.filter(v => v.available && v.activeTasks < 3); // Max 3 tasks
    if (eligibleVolunteers.length === 0) return null;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Match the best volunteer for this situation.
      Need: ${JSON.stringify(need)}
      Volunteers: ${JSON.stringify(eligibleVolunteers)}
      Rules:
      1. Prefer skills matching the category.
      2. Minimize activeTasks to prevent burnout.
      3. Consider fatigueLevel (lower is better).
      4. Consider physical distance if locations are provided.
      Return ONLY the matched volunteer's uid.`
    });

    const matchUid = response.text?.trim();
    const volunteer = eligibleVolunteers.find(v => v.uid === matchUid);
    return volunteer ? volunteer.uid : eligibleVolunteers[0].uid;
  },

  /**
   * Predicts future needs based on existing historical patterns in the area.
   */
  async predictFutureNeeds(historicalNeeds: Need[]): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze these community needs: ${JSON.stringify(historicalNeeds)}. Identify patterns and predict the next 48 hours for this community. Format as a single punchy sentence starting with "Predictive Insight:"`
    });
    return response.text?.trim() || "Predictive models are calibrating based on field data.";
  }
};
