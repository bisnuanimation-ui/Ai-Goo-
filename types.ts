
export interface AnalysisResult {
  subjectAndAttire: string;
  typographyAndText: string;
  visualEffectsAndOverlays: string;
  colorPaletteAndMood: string;
  compositionAndLayout: string;
  cameraAndQuality: string;
  masterPrompt: string;
}

export interface AppState {
  image: string | null;
  imageMimeType: string | null;
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  error: string | null;
}
