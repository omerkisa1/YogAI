package handlers

import (
	"testing"
)

func TestValidateAndEnrichValidJSON(t *testing.T) {
	raw := `{
		"title_en": "Morning Flow",
		"title_tr": "Sabah Akışı",
		"focus_area": "flexibility",
		"difficulty": "Beginner",
		"total_duration_min": 6,
		"description_en": "A gentle morning flow for flexibility.",
		"description_tr": "Esneklik için nazik bir sabah akışı.",
		"exercises": [
			{
				"pose_id": "mountain",
				"duration_min": 3,
				"benefit_en": "Grounds the body and improves posture.",
				"benefit_tr": "Vücudu topraklar ve duruşu iyileştirir."
			},
			{
				"pose_id": "cat_cow",
				"duration_min": 3,
				"benefit_en": "Warms up the spine and relieves tension.",
				"benefit_tr": "Omurgayı ısıtır ve gerginliği azaltır."
			}
		]
	}`

	plan, err := validateAndEnrich(raw)
	if err != nil {
		t.Fatalf("validateAndEnrich failed: %v", err)
	}

	if plan.TitleEN != "Morning Flow" {
		t.Errorf("TitleEN = %q, want %q", plan.TitleEN, "Morning Flow")
	}
	if plan.TitleTR != "Sabah Akışı" {
		t.Errorf("TitleTR = %q, want %q", plan.TitleTR, "Sabah Akışı")
	}
	if len(plan.Exercises) != 2 {
		t.Fatalf("expected 2 exercises, got %d", len(plan.Exercises))
	}

	ex1 := plan.Exercises[0]
	if ex1.PoseID != "mountain" {
		t.Errorf("exercise[0].PoseID = %q, want %q", ex1.PoseID, "mountain")
	}
	if ex1.NameEN != "Mountain Pose" {
		t.Errorf("exercise[0].NameEN = %q, want %q (from catalog)", ex1.NameEN, "Mountain Pose")
	}
	if ex1.NameTR != "Dağ Duruşu" {
		t.Errorf("exercise[0].NameTR = %q, want %q (from catalog)", ex1.NameTR, "Dağ Duruşu")
	}
	if ex1.InstructionsEN == "" {
		t.Error("exercise[0].InstructionsEN should be populated from catalog")
	}
	if ex1.InstructionsTR == "" {
		t.Error("exercise[0].InstructionsTR should be populated from catalog")
	}
	if ex1.BenefitEN != "Grounds the body and improves posture." {
		t.Errorf("exercise[0].BenefitEN = %q (should come from LLM)", ex1.BenefitEN)
	}
	if ex1.TargetArea != "full_body" {
		t.Errorf("exercise[0].TargetArea = %q, want %q (from catalog)", ex1.TargetArea, "full_body")
	}
	if ex1.Category != "standing" {
		t.Errorf("exercise[0].Category = %q, want %q (from catalog)", ex1.Category, "standing")
	}

	t.Logf("[PASS] bilingual plan validated and enriched: %d exercises with catalog data", len(plan.Exercises))
}

func TestValidateAndEnrichInvalidPoseID(t *testing.T) {
	raw := `{
		"title_en": "Test",
		"title_tr": "Test",
		"focus_area": "test",
		"difficulty": "Beginner",
		"total_duration_min": 3,
		"description_en": "test",
		"description_tr": "test",
		"exercises": [
			{
				"pose_id": "fabricated_pose_that_does_not_exist",
				"duration_min": 3,
				"benefit_en": "test",
				"benefit_tr": "test"
			}
		]
	}`

	_, err := validateAndEnrich(raw)
	if err == nil {
		t.Fatal("validateAndEnrich should fail for fabricated pose_id")
	}
	t.Logf("[PASS] correctly rejected fabricated pose_id: %v", err)
}

func TestValidateAndEnrichInvalidJSON(t *testing.T) {
	_, err := validateAndEnrich("this is not json at all")
	if err == nil {
		t.Fatal("validateAndEnrich should fail for invalid JSON")
	}
	t.Logf("[PASS] correctly rejected invalid JSON: %v", err)
}

func TestValidateAndEnrichEmptyExercises(t *testing.T) {
	raw := `{
		"title_en": "Empty Plan",
		"title_tr": "Boş Plan",
		"focus_area": "test",
		"difficulty": "Beginner",
		"total_duration_min": 0,
		"description_en": "test",
		"description_tr": "test",
		"exercises": []
	}`

	_, err := validateAndEnrich(raw)
	if err == nil {
		t.Fatal("validateAndEnrich should fail for empty exercises")
	}
	t.Logf("[PASS] correctly rejected empty exercises: %v", err)
}

func TestValidateAndEnrichMissingTitle(t *testing.T) {
	raw := `{
		"title_en": "",
		"title_tr": "",
		"focus_area": "test",
		"difficulty": "Beginner",
		"total_duration_min": 3,
		"description_en": "test",
		"description_tr": "test",
		"exercises": [{"pose_id": "mountain", "duration_min": 3, "benefit_en": "t", "benefit_tr": "t"}]
	}`

	_, err := validateAndEnrich(raw)
	if err == nil {
		t.Fatal("validateAndEnrich should fail for missing title")
	}
	t.Logf("[PASS] correctly rejected missing title: %v", err)
}

func TestValidateAndEnrichZeroDuration(t *testing.T) {
	raw := `{
		"title_en": "Test",
		"title_tr": "Test",
		"focus_area": "test",
		"difficulty": "Beginner",
		"total_duration_min": 0,
		"description_en": "test",
		"description_tr": "test",
		"exercises": [{"pose_id": "mountain", "duration_min": 0, "benefit_en": "t", "benefit_tr": "t"}]
	}`

	_, err := validateAndEnrich(raw)
	if err == nil {
		t.Fatal("validateAndEnrich should fail for zero duration exercise")
	}
	t.Logf("[PASS] correctly rejected zero duration: %v", err)
}
