// Shared validation utilities
export const isValidWeight = (weight: number): boolean => {
  return weight > 0 && weight < 10000; // Max 10,000 lbs/kg
};

export const isValidReps = (reps: number): boolean => {
  return reps > 0 && reps < 1000;
};

export const isValidDuration = (seconds: number): boolean => {
  return seconds > 0 && seconds < 86400; // Max 24 hours
};

