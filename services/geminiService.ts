
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AnalysisResult } from "../types";

export const analyzeImage = async (
  base64Image: string, 
  mimeType: string
): Promise<AnalysisResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('API_KEY_INVALID');
  }
  const ai = new GoogleGenAI({ apiKey });
  
  const promptInstruction = `
    TASK: Perform a Professional Graphic Design Analysis for Replication.
    
    Analyze the provided image and extract its core graphic design elements, including the characters and their outfits. Focus on the subject/attire, typography, visual effects, composition, and color.

    CRITICAL OBJECTIVE 1: SUBJECT, ATTITUDE & EXACT POSE
    - Describe the main subject or character's exact pose (how they are standing or sitting), posture, and facial expression.
    - Describe their attitude, vibe, and body language in detail.
    - EXPLICITLY detail the dress, clothing, garments, outfits, shoes, and any accessories. Describe the colors, fabric, and fashion aesthetic.
    - Note exactly what will be prominent in the foreground.
    - CRITICAL GUIDELINE: If the subject is a male/boy, you MUST explicitly include in the descriptions and the master prompt that he is wearing a mask over his face.

    CRITICAL OBJECTIVE 2: EXTREME BACKGROUND DETAILS
    - Describe every single detail present in the background.
    - Describe the spatial setting, background props, environment, and atmosphere in exhaustive detail.

    CRITICAL OBJECTIVE 3: TYPOGRAPHY, TEXT & GRAPHIC ANIMATIONS
    - Describe the style of the fonts used (e.g., serif, sans-serif, gothic, futuristic, handwritten).
    - Describe text placement, alignment, and graphic design styles.
    - Detail any text animation style, glow, drop shadow, outline, gradient fill, or visual motion effects that are implied.

    CRITICAL OBJECTIVE 4: COLOR PALETTE & MOOD
    - Identify the dominant colors and accent colors.
    - Describe the overall mood or aesthetic (e.g., cyberpunk, ethereal, dark fantasy, minimalist).

    CRITICAL OBJECTIVE 5: COMPOSITION, VIEWING ANGLE & QUALITY
    - Identify the camera angle (e.g., eye level, low angle, high angle, bird's-eye view).
    - Analyze the image quality and resolution. Determine if it looks professional like a DSLR/Studio shot or more like a mobile phone capture.
    - Identify any visual effects (e.g., neon glows, lens flares, particle effects, bokeh, glitches).
    - Describe overlays, textures, or patterns used in the background or foreground.
    - Note the exact relationship and spacing between the main subject, text, and the background.

    CRITICAL OBJECTIVE 6: MASTER PROMPT (REUSABLE TEMPLATE FOR ANY CHARACTER)
    - Write a single master prompt for an AI image generator (like Midjourney or DALL-E) that combines ALL of these descriptions.
    - Structure the prompt so that it acts as a reusable template. Describe the character subject generally as a placeholder (e.g. "[Insert Your Character Here]"), but DO include the specific required attitude, exact pose, standing/sitting details, mask if a boy, and the complete specific background, typography, and graphic effects from the image.
    - Include the camera angle and quality description (e.g. "shot on 35mm DSLR" or "grainy mobile phone photography style").
    - Crucially, instruct the AI to generate a result that is a complete copy of the reference's dress, style, and aesthetics ("complete copy of attire and style").
    - Use terms like "natural high graphics" and "ultra-realistic fidelity".

    Return ONLY in this exact format:
    ATTIRE: [Subject's attitude, exact pose, standing/sitting details, and strict detailed attire description for full copying]
    TYPOGRAPHY: [Typography, text details, and graphic animation styles, or 'none']
    EFFECTS: [Lighting and visual effects]
    COLOR: [Color palette and mood]
    COMPOSITION: [Extreme foreground and background details, layout]
    CAMERA: [Camera angle, photo quality (DSLR vs mobile), and resolution style]
    PROMPT: [The master prompt for generating the image, ensuring explicit inclusion of pose, background, text effects, explicitly asking for natural high graphics and complete style reproduction]
  `;

  const parts = [
    { text: promptInstruction },
    {
      inlineData: {
        mimeType: mimeType,
        data: base64Image.split(',')[1],
      },
    }
  ];

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts }
    });

    const text = response.text || '';
    
    return parseResponse(text);
  } catch (error: any) {
    if (error?.status === 429) {
      throw new Error('QUOTA_EXCEEDED');
    }
    if (error?.status === 404) {
      throw new Error('API_KEY_INVALID');
    }
    throw error;
  }
};

const parseResponse = (text: string): AnalysisResult => {
  const sections: AnalysisResult = {
    subjectAndAttire: '',
    typographyAndText: '',
    visualEffectsAndOverlays: '',
    colorPaletteAndMood: '',
    compositionAndLayout: '',
    cameraAndQuality: '',
    masterPrompt: '',
  };

  const lines = text.split('\n');
  let currentKey: keyof AnalysisResult | null = null;

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('ATTIRE:')) {
      sections.subjectAndAttire = trimmedLine.replace('ATTIRE:', '').trim();
      currentKey = 'subjectAndAttire';
    } else if (trimmedLine.startsWith('TYPOGRAPHY:')) {
      sections.typographyAndText = trimmedLine.replace('TYPOGRAPHY:', '').trim();
      currentKey = 'typographyAndText';
    } else if (trimmedLine.startsWith('EFFECTS:')) {
      sections.visualEffectsAndOverlays = trimmedLine.replace('EFFECTS:', '').trim();
      currentKey = 'visualEffectsAndOverlays';
    } else if (trimmedLine.startsWith('COLOR:')) {
      sections.colorPaletteAndMood = trimmedLine.replace('COLOR:', '').trim();
      currentKey = 'colorPaletteAndMood';
    } else if (trimmedLine.startsWith('COMPOSITION:')) {
      sections.compositionAndLayout = trimmedLine.replace('COMPOSITION:', '').trim();
      currentKey = 'compositionAndLayout';
    } else if (trimmedLine.startsWith('CAMERA:')) {
      sections.cameraAndQuality = trimmedLine.replace('CAMERA:', '').trim();
      currentKey = 'cameraAndQuality';
    } else if (trimmedLine.startsWith('PROMPT:')) {
      sections.masterPrompt = trimmedLine.replace('PROMPT:', '').trim();
      currentKey = 'masterPrompt';
    } else if (currentKey && trimmedLine) {
      const target = currentKey as keyof AnalysisResult;
      sections[target] += ' ' + trimmedLine;
    }
  });

  return sections;
};
