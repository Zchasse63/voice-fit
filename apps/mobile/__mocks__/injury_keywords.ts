// Re-export the JSON data with proper typing
const injuryKeywords = {
  version: "1.0",
  description: "Comprehensive injury keyword dictionary for NLP-based injury detection",
  pain_descriptors: {
    sharp_acute: ["sharp", "shooting", "stabbing", "piercing", "acute"],
    dull_chronic: ["dull", "aching", "persistent", "chronic", "nagging"],
    burning: ["burning", "searing", "hot"],
    throbbing: ["throbbing", "pulsating", "pulsing", "beating"],
    radiating: ["radiating", "shooting", "radiates"],
    tingling: ["tingling", "pins and needles", "numbness", "paresthesia"],
    cramping: ["cramping", "cramp", "spasm", "tightness"],
    stiffness: ["stiff", "stiffness", "rigid", "inflexible"],
  },
  discomfort_indicators: {
    mild: ["slight", "minor", "little", "bit of", "slight discomfort"],
    moderate: ["moderate", "noticeable", "significant", "considerable"],
    severe: ["severe", "intense", "unbearable", "excruciating", "extreme"],
  },
  injury_types: {
    strains: ["strain", "pulled", "torn", "rupture"],
    sprains: ["sprain", "twisted", "rolled"],
    tendinitis: ["tendinitis", "tendonitis", "tendon pain"],
    bursitis: ["bursitis", "bursa"],
    fractures: ["fracture", "broken", "crack"],
    inflammation: ["inflammation", "inflamed", "swollen"],
  },
  context_clues: {
    injury_indicators: {
      functional_limitation: ["can't", "cannot", "unable to", "difficulty", "limited"],
      acute_onset: ["suddenly", "all of a sudden", "out of nowhere", "just started"],
      worsening: ["getting worse", "worsening", "deteriorating", "increasing"],
      persistent: ["persistent", "ongoing", "continues", "still have"],
    },
    false_positives: {
      normal_soreness: ["sore", "soreness", "DOMS", "delayed onset"],
      hyperbolic_expressions: ["dying", "killing me", "dead", "broken", "destroyed"],
    },
  },
  body_parts: {
    upper_body: {
      shoulder: ["shoulder", "rotator cuff", "supraspinatus"],
      elbow: ["elbow", "tennis elbow", "golfer's elbow"],
      wrist: ["wrist", "carpal tunnel"],
      hand: ["hand", "finger", "thumb"],
    },
    core: {
      lower_back: ["lower back", "lumbar", "L4", "L5"],
      upper_back: ["upper back", "thoracic", "mid-back"],
      abdomen: ["abs", "abdominal"],
    },
    lower_body: {
      hip: ["hip", "hip flexor", "glute"],
      knee: ["knee", "ACL", "MCL", "meniscus"],
      ankle: ["ankle", "Achilles"],
      foot: ["foot", "plantar fascia"],
    },
  },
  false_positives: {
    hyperbolic_expressions: ["dying", "killing me", "dead", "broken", "destroyed"],
  },
};

export default injuryKeywords;

