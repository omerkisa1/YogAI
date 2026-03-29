package handlers

import (
	"strings"
	"testing"

	"github.com/omerkisa/yogai-backend/internal/catalog"
)


func TestValidateAndEnrichValidJSON(t *testing.T) {
	raw := `{
		"title_en": "Morning Flow",
		"title_tr": "Sabah Akışı",
		"focus_area": "flexibility",
		"difficulty": "Beginner",
		"total_duration_min": 9,
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
			},
			{
				"pose_id": "corpse",
				"duration_min": 3,
				"benefit_en": "Deep relaxation.",
				"benefit_tr": "Derin rahatlama."
			}
		]
	}`

	plan, err := validateAndEnrich(raw, nil)
	if err != nil {
		t.Fatalf("validateAndEnrich failed: %v", err)
	}

	if plan.TitleEN != "Morning Flow" {
		t.Errorf("TitleEN = %q, want %q", plan.TitleEN, "Morning Flow")
	}
	if plan.TitleTR != "Sabah Akışı" {
		t.Errorf("TitleTR = %q, want %q", plan.TitleTR, "Sabah Akışı")
	}
	if len(plan.Exercises) != 3 {
		t.Fatalf("expected 3 exercises, got %d", len(plan.Exercises))
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
	if plan.TotalPoseCount != 3 {
		t.Errorf("TotalPoseCount = %d, want 3", plan.TotalPoseCount)
	}

	t.Logf("[PASS] bilingual plan validated and enriched: %d exercises, %d analyzable", len(plan.Exercises), plan.AnalyzablePoseCount)
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

	_, err := validateAndEnrich(raw, nil)
	if err == nil {
		t.Fatal("validateAndEnrich should fail for fabricated pose_id")
	}
	t.Logf("[PASS] correctly rejected fabricated pose_id: %v", err)
}

func TestValidateAndEnrichInvalidJSON(t *testing.T) {
	_, err := validateAndEnrich("this is not json at all", nil)
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

	_, err := validateAndEnrich(raw, nil)
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

	_, err := validateAndEnrich(raw, nil)
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

	_, err := validateAndEnrich(raw, nil)
	if err == nil {
		t.Fatal("validateAndEnrich should fail for zero duration exercise")
	}
	t.Logf("[PASS] correctly rejected zero duration: %v", err)
}

// ─── isContraindicated tests ────────────────────────────────────────────────

func TestIsContraindicated_NoInjuries(t *testing.T) {
	pose, _ := catalog.GetPoseByID("warrior_2") // contraindications: knee_injury
	if isContraindicated(pose, nil) {
		t.Error("expected false when no injuries provided")
	}
	if isContraindicated(pose, []string{}) {
		t.Error("expected false when empty injuries provided")
	}
	t.Log("[PASS] no injuries → never contraindicated")
}

func TestIsContraindicated_KneeWithWarrior2(t *testing.T) {
	pose, _ := catalog.GetPoseByID("warrior_2") // contraindications: knee_injury
	if !isContraindicated(pose, []string{"knee_injury"}) {
		t.Error("warrior_2 MUST be contraindicated for knee_injury")
	}
	t.Log("[PASS] warrior_2 correctly blocked for knee_injury")
}

func TestIsContraindicated_SafePose(t *testing.T) {
	pose, _ := catalog.GetPoseByID("mountain") // contraindications: []
	if isContraindicated(pose, []string{"knee_injury", "ankle_injury", "herniated_disc"}) {
		t.Error("mountain pose should never be contraindicated")
	}
	t.Log("[PASS] mountain pose always safe")
}

func TestIsContraindicated_MultipleInjuries(t *testing.T) {
	// eagle: contraindications: knee_injury, shoulder_injury
	pose, _ := catalog.GetPoseByID("eagle")
	if !isContraindicated(pose, []string{"ankle_injury", "shoulder_injury"}) {
		t.Error("eagle must be contraindicated for shoulder_injury")
	}
	t.Log("[PASS] eagle blocked for shoulder_injury")
}

func TestIsContraindicated_UnrelatedInjury(t *testing.T) {
	// warrior_2: contraindications: knee_injury only
	pose, _ := catalog.GetPoseByID("warrior_2")
	if isContraindicated(pose, []string{"herniated_disc", "shoulder_injury"}) {
		t.Error("warrior_2 should NOT be contraindicated for unrelated injuries")
	}
	t.Log("[PASS] warrior_2 safe for unrelated injuries")
}

// ─── Re-Test 1: Catalog contraindication verification ───────────────────────

// Verifies that the poses flagged in Re-Test 1 are ALL correctly marked in catalog
func TestCatalogContraindications_ReTest1(t *testing.T) {
	cases := []struct {
		poseID      string
		injury      string
		wantBlocked bool
	}{
		// These MUST be blocked for knee_injury or ankle_injury:
		{"warrior_2", "knee_injury", true},
		{"tree", "ankle_injury", true},
		{"chair", "knee_injury", true},
		{"eagle", "knee_injury", true},
		{"lotus", "knee_injury", true},
		{"warrior_1", "knee_injury", true},
		{"warrior_3", "knee_injury", true},
		{"warrior_3", "ankle_injury", true},
		// These must remain safe:
		{"mountain", "knee_injury", false},
		{"corpse", "knee_injury", false},
		{"easy_seat", "knee_injury", false},
		{"triangle", "knee_injury", false},      // only low_back_pain
		{"bridge", "knee_injury", false},          // only neck_injury
	}

	allPass := true
	for _, tc := range cases {
		pose, found := catalog.GetPoseByID(tc.poseID)
		if !found {
			t.Errorf("pose %q not found in catalog", tc.poseID)
			allPass = false
			continue
		}
		got := isContraindicated(pose, []string{tc.injury})
		status := "✅"
		if got != tc.wantBlocked {
			status = "❌"
			allPass = false
			t.Errorf("isContraindicated(%q, %q) = %v, want %v", tc.poseID, tc.injury, got, tc.wantBlocked)
		}
		t.Logf("  %s  %-30s + %-20s → blocked=%v", status, tc.poseID, tc.injury, got)
	}
	if allPass {
		t.Log("[PASS] All Re-Test 1 contraindication checks verified ✅")
	}
}

// ─── Re-Test 2 & Pre-Validation tests ────────────────────────────────────────

// Re-Test 2: balance + beginner + 45dk → MUST return error (400)
func TestPreValidation_ReTest2_Balance_Beginner_45min(t *testing.T) {
	// balance poses: tree(diff=2), eagle(diff=3), half_moon(diff=3), warrior_3(diff=4), dancer(diff=4)
	// beginner filter (max diff=2) → only tree
	// 1 pose < 3 minimum → error
	count, maxDur, err := preValidatePlanRequest("beginner", 45, "balance", []string{})
	t.Logf("Re-Test 2 → available_poses=%d, max_duration=%d, error=%v", count, maxDur, err)
	if err == nil {
		t.Errorf("❌ Re-Test 2 FAILED: expected error for balance+beginner+45min, got count=%d maxDur=%d", count, maxDur)
	} else {
		t.Logf("✅ Re-Test 2 PASSED: would return 400 Bad Request")
		t.Logf("   Error message: %s", err.Error())
	}
}

// Re-Test 2 variant: advanced level, balance, 45min → max 25min → error
func TestPreValidation_Balance_Advanced_45min(t *testing.T) {
	// balance poses: tree(2), eagle(3), half_moon(3), warrior_3(4), dancer(4) = 5 poses
	// advanced → no difficulty filter → 5 poses
	// maxDuration = 5*5 = 25 min → 45 > 25 → error
	count, maxDur, err := preValidatePlanRequest("advanced", 45, "balance", []string{})
	t.Logf("Balance+advanced+45min → available_poses=%d, max_duration=%d, error=%v", count, maxDur, err)
	if err == nil {
		t.Errorf("❌ expected error (max 25min), got no error")
	} else {
		if maxDur != 25 {
			t.Errorf("expected maxDur=25, got %d", maxDur)
		}
		t.Logf("✅ PASSED: %s", err.Error())
	}
}

// Valid request — must NOT return error
func TestPreValidation_ValidRequest_Legs_Intermediate_30min(t *testing.T) {
	count, maxDur, err := preValidatePlanRequest("intermediate", 30, "legs", []string{})
	t.Logf("Valid request → available_poses=%d, max_duration=%d", count, maxDur)
	if err != nil {
		t.Errorf("❌ expected no error for valid request, got: %v", err)
	} else {
		t.Log("✅ PASSED: valid request correctly accepted")
	}
}

// Re-Test 1 pre-validation: legs + knee + ankle (intermediate, 30min)
func TestPreValidation_ReTest1_Legs_KneeAnkle_30min(t *testing.T) {
	injuries := []string{"knee_injury", "ankle_injury"}
	count, maxDur, err := preValidatePlanRequest("intermediate", 30, "legs", injuries)
	t.Logf("Re-Test 1 pre-validation → available_poses=%d, max_duration=%d, err=%v", count, maxDur, err)
	if err != nil {
		t.Logf("→ Would return 400: %s", err.Error())
	} else {
		t.Logf("✅ Pre-validation passed (%d safe poses). Gemini would be called, then contraindication double-check would filter its response.", count)
		// Log which poses are available
		safePoses := catalog.GetSafePoseIDs(injuries)
		legsPoses := catalog.GetPosesByTargetArea(safePoses, "legs")
		t.Logf("   Safe leg poses with knee+ankle injuries: %s", strings.Join(legsPoses, ", "))
	}
}

// Re-Test 3: extreme filter — 7 injuries, full_body, beginner, 30min
func TestPreValidation_ReTest3_ExtremeInjuries(t *testing.T) {
	injuries := []string{"knee_injury", "ankle_injury", "herniated_disc", "low_back_pain", "shoulder_injury", "wrist_injury", "neck_injury"}
	count, maxDur, err := preValidatePlanRequest("beginner", 30, "full_body", injuries)
	t.Logf("Re-Test 3 → available_poses=%d, max_duration=%d, err=%v", count, maxDur, err)
	if err != nil {
		t.Logf("✅ Would return 400: %s", err.Error())
	} else {
		if count < 3 {
			t.Errorf("❌ count=%d < 3 but no error returned", count)
		} else {
			t.Logf("✅ %d safe poses found, would proceed to Gemini", count)
			// List the safe poses
			safe := catalog.GetSafePoseIDs(injuries)
			safe = catalog.GetPosesByMaxDifficulty(safe, 2)
			t.Logf("   Safe poses (beginner, 7 injuries): %s", strings.Join(safe, ", "))
		}
	}
}

// ─── Post-validation: contraindication filter in validateAndEnrich ───────────

// Re-Test 1 simulation: Gemini returns warrior_2 despite knee_injury → must be stripped
func TestValidateAndEnrich_ReTest1_ContradictedPoseStripped(t *testing.T) {
	// Simulate Gemini hallucinating warrior_2 despite knee_injury filter
	raw := `{
		"title_en": "Leg Strength Flow",
		"title_tr": "Bacak Güç Akışı",
		"focus_area": "legs",
		"difficulty": "Intermediate",
		"total_duration_min": 12,
		"description_en": "Strengthening legs.",
		"description_tr": "Bacakları güçlendirme.",
		"exercises": [
			{
				"pose_id": "warrior_2",
				"duration_min": 3,
				"benefit_en": "Strengthens legs.",
				"benefit_tr": "Bacakları güçlendirir."
			},
			{
				"pose_id": "tree",
				"duration_min": 3,
				"benefit_en": "Balance.",
				"benefit_tr": "Denge."
			},
			{
				"pose_id": "triangle",
				"duration_min": 3,
				"benefit_en": "Leg stretch.",
				"benefit_tr": "Bacak germe."
			},
			{
				"pose_id": "wide_leg_forward_fold",
				"duration_min": 3,
				"benefit_en": "Hamstring.",
				"benefit_tr": "Hamstring."
			}
		]
	}`

	injuries := []string{"knee_injury", "ankle_injury"}
	plan, err := validateAndEnrich(raw, injuries)

	// List returned pose IDs
	var poseIDs []string
	if plan != nil {
		for _, ex := range plan.Exercises {
			poseIDs = append(poseIDs, ex.PoseID)
		}
	}
	t.Logf("Re-Test 1 simulation → returned pose_ids: %v", poseIDs)

	if err != nil {
		// Less than 3 valid poses after filtering → correct behavior
		t.Logf("✅ validateAndEnrich returned error (too few safe poses): %v", err)
		return
	}

	// Verify warrior_2 and tree are NOT in the result
	for _, ex := range plan.Exercises {
		if ex.PoseID == "warrior_2" {
			t.Errorf("❌ warrior_2 should have been stripped (knee_injury contraindication)")
		}
		if ex.PoseID == "tree" {
			t.Errorf("❌ tree should have been stripped (ankle_injury contraindication)")
		}
	}
	t.Logf("✅ Re-Test 1 PASSED: contraindicated poses stripped from plan")
}

// ─── Post-validation: duplicate limit ────────────────────────────────────────

func TestValidateAndEnrich_DuplicateLimit(t *testing.T) {
	raw := `{
		"title_en": "Duplicate Test",
		"title_tr": "Tekrar Testi",
		"focus_area": "flexibility",
		"difficulty": "Beginner",
		"total_duration_min": 20,
		"description_en": "Test.",
		"description_tr": "Test.",
		"exercises": [
			{"pose_id": "mountain", "duration_min": 3, "benefit_en": "b", "benefit_tr": "b"},
			{"pose_id": "mountain", "duration_min": 3, "benefit_en": "b", "benefit_tr": "b"},
			{"pose_id": "mountain", "duration_min": 3, "benefit_en": "b", "benefit_tr": "b"},
			{"pose_id": "mountain", "duration_min": 3, "benefit_en": "b", "benefit_tr": "b"},
			{"pose_id": "corpse",   "duration_min": 4, "benefit_en": "b", "benefit_tr": "b"},
			{"pose_id": "easy_seat","duration_min": 4, "benefit_en": "b", "benefit_tr": "b"}
		]
	}`

	plan, err := validateAndEnrich(raw, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	mountainCount := 0
	for _, ex := range plan.Exercises {
		if ex.PoseID == "mountain" {
			mountainCount++
		}
	}
	if mountainCount > 2 {
		t.Errorf("❌ mountain appeared %d times, max allowed is 2", mountainCount)
	} else {
		t.Logf("✅ Duplicate limit passed: mountain appears %d times (max 2)", mountainCount)
	}
}

// ─── Post-validation: duration capping ───────────────────────────────────────

func TestValidateAndEnrich_DurationCapping(t *testing.T) {
	raw := `{
		"title_en": "Duration Test",
		"title_tr": "Süre Testi",
		"focus_area": "flexibility",
		"difficulty": "Beginner",
		"total_duration_min": 20,
		"description_en": "Test.",
		"description_tr": "Test.",
		"exercises": [
			{"pose_id": "mountain",  "duration_min": 10, "benefit_en": "b", "benefit_tr": "b"},
			{"pose_id": "corpse",    "duration_min": 15, "benefit_en": "b", "benefit_tr": "b"},
			{"pose_id": "easy_seat", "duration_min": 3,  "benefit_en": "b", "benefit_tr": "b"}
		]
	}`

	plan, err := validateAndEnrich(raw, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	for _, ex := range plan.Exercises {
		if ex.DurationMin > 5 {
			t.Errorf("❌ pose %q has duration %d > 5 min cap", ex.PoseID, ex.DurationMin)
		}
		if ex.DurationMin < 1 {
			t.Errorf("❌ pose %q has duration %d < 1 min floor", ex.PoseID, ex.DurationMin)
		}
	}
	t.Logf("✅ Duration capping passed: all poses within 1-5 min range")
}

// ─── Post-validation: IsAnalyzable populated ─────────────────────────────────

func TestValidateAndEnrich_IsAnalyzable(t *testing.T) {
	raw := `{
		"title_en": "Analyzable Test",
		"title_tr": "Analiz Testi",
		"focus_area": "full_body",
		"difficulty": "Beginner",
		"total_duration_min": 9,
		"description_en": "Test.",
		"description_tr": "Test.",
		"exercises": [
			{"pose_id": "mountain",  "duration_min": 3, "benefit_en": "b", "benefit_tr": "b"},
			{"pose_id": "plank",     "duration_min": 3, "benefit_en": "b", "benefit_tr": "b"},
			{"pose_id": "easy_seat", "duration_min": 3, "benefit_en": "b", "benefit_tr": "b"}
		]
	}`

	plan, err := validateAndEnrich(raw, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	for _, ex := range plan.Exercises {
		pose, _ := catalog.GetPoseByID(ex.PoseID)
		if ex.IsAnalyzable != pose.IsAnalyzable {
			t.Errorf("❌ pose %q IsAnalyzable mismatch: got %v, catalog has %v", ex.PoseID, ex.IsAnalyzable, pose.IsAnalyzable)
		}
	}

	t.Logf("✅ IsAnalyzable populated correctly for all exercises")
	t.Logf("   Plan summary: total=%d, analyzable=%d", plan.TotalPoseCount, plan.AnalyzablePoseCount)
}
