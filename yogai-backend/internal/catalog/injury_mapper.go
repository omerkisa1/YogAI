package catalog

var injuryNormalizer = map[string]string{
	"back_pain":           "low_back_pain",
	"lower_back_pain":     "low_back_pain",
	"low_back_pain":       "low_back_pain",
	"wrist_sensitivity":   "wrist_injury",
	"wrist_pain":          "wrist_injury",
	"wrist_injury":        "wrist_injury",
	"neck_tension":        "neck_injury",
	"neck_pain":           "neck_injury",
	"neck_injury":         "neck_injury",
	"hip_pain":            "hip_injury",
	"hip_injury":          "hip_injury",
	"knee_pain":           "knee_injury",
	"knee_injury":         "knee_injury",
	"ankle_pain":          "ankle_injury",
	"ankle_injury":        "ankle_injury",
	"shoulder_pain":       "shoulder_injury",
	"shoulder_injury":     "shoulder_injury",
	"herniated_disc":      "herniated_disc",
	"groin_injury":        "groin_injury",
	"groin_pain":          "groin_injury",
	"hamstring_injury":    "hamstring_injury",
	"spinal_injury":       "spinal_injury",
	"high_blood_pressure": "high_blood_pressure",
	"pregnancy":           "pregnancy",
	"glaucoma":            "glaucoma",
}

func NormalizeInjuries(raw []string) []string {
	seen := make(map[string]bool)
	var result []string
	for _, inj := range raw {
		normalized := inj
		if mapped, ok := injuryNormalizer[inj]; ok {
			normalized = mapped
		}
		if !seen[normalized] {
			seen[normalized] = true
			result = append(result, normalized)
		}
	}
	return result
}
