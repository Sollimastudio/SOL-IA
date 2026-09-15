export const ANTI_FATIGUE_VERSION: string;

export type AntiFatigueOrientation = {
  rootTopic: string;
  currentBranch: string;
  similarityToPrevious: number;
  novelty: number;
  likelyRepeat: boolean;
  likelyBranch: boolean;
  returnNeeded: boolean;
  repeatedSignals: string[];
  newSignals: string[];
  userTurnCount: number;
  guidance: string;
};

export function analyzeConversation(
  history?: Array<{ role?: string; content?: string }>,
  message?: string
): AntiFatigueOrientation;
