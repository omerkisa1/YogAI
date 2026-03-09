package catalog

import (
	"testing"
)

func TestAllPosesLoaded(t *testing.T) {
	poses := GetAllPoses()
	if len(poses) < 50 {
		t.Errorf("expected at least 50 poses, got %d", len(poses))
	}
	t.Logf("[PASS] catalog loaded with %d poses", len(poses))
}

func TestTotalPoseCount(t *testing.T) {
	count := TotalPoseCount()
	if count != len(AllPoses) {
		t.Errorf("TotalPoseCount() = %d, want %d", count, len(AllPoses))
	}
}

func TestAllPoseIDsUnique(t *testing.T) {
	ids := AllPoseIDs()
	seen := make(map[string]bool, len(ids))
	for _, id := range ids {
		if seen[id] {
			t.Errorf("duplicate pose_id found: %q", id)
		}
		seen[id] = true
	}
	t.Logf("[PASS] all %d pose_ids are unique", len(ids))
}

func TestGetPoseByIDValid(t *testing.T) {
	testCases := []string{"mountain", "warrior_1", "cobra", "bridge", "headstand", "cat_cow", "corpse"}
	for _, id := range testCases {
		pose, ok := GetPoseByID(id)
		if !ok {
			t.Errorf("GetPoseByID(%q) returned not found", id)
			continue
		}
		if pose.PoseID != id {
			t.Errorf("GetPoseByID(%q).PoseID = %q", id, pose.PoseID)
		}
		if pose.NameEN == "" {
			t.Errorf("GetPoseByID(%q).NameEN is empty", id)
		}
		if pose.NameTR == "" {
			t.Errorf("GetPoseByID(%q).NameTR is empty", id)
		}
		if pose.InstructionsEN == "" {
			t.Errorf("GetPoseByID(%q).InstructionsEN is empty", id)
		}
		if pose.InstructionsTR == "" {
			t.Errorf("GetPoseByID(%q).InstructionsTR is empty", id)
		}
	}
}

func TestGetPoseByIDInvalid(t *testing.T) {
	_, ok := GetPoseByID("nonexistent_pose_xyz")
	if ok {
		t.Error("GetPoseByID should return false for nonexistent pose")
	}
}

func TestAllPosesHaveRequiredFields(t *testing.T) {
	for i, p := range AllPoses {
		if p.PoseID == "" {
			t.Errorf("pose[%d] has empty PoseID", i)
		}
		if p.NameEN == "" {
			t.Errorf("pose[%d] (%s) has empty NameEN", i, p.PoseID)
		}
		if p.NameTR == "" {
			t.Errorf("pose[%d] (%s) has empty NameTR", i, p.PoseID)
		}
		if p.Category == "" {
			t.Errorf("pose[%d] (%s) has empty Category", i, p.PoseID)
		}
		if p.Difficulty < 1 || p.Difficulty > 5 {
			t.Errorf("pose[%d] (%s) has invalid Difficulty: %d", i, p.PoseID, p.Difficulty)
		}
		if p.TargetArea == "" {
			t.Errorf("pose[%d] (%s) has empty TargetArea", i, p.PoseID)
		}
		if p.InstructionsEN == "" {
			t.Errorf("pose[%d] (%s) has empty InstructionsEN", i, p.PoseID)
		}
		if p.InstructionsTR == "" {
			t.Errorf("pose[%d] (%s) has empty InstructionsTR", i, p.PoseID)
		}
		if p.Contraindications == nil {
			t.Errorf("pose[%d] (%s) has nil Contraindications (use empty slice)", i, p.PoseID)
		}
	}
}

func TestCategoryCoverage(t *testing.T) {
	counts := CategoriesWithCounts()

	expectedCategories := []Category{CategoryStanding, CategorySeated, CategoryProne, CategorySupine, CategoryInversion}
	for _, cat := range expectedCategories {
		count, exists := counts[cat]
		if !exists || count == 0 {
			t.Errorf("category %q has no poses", cat)
			continue
		}
		t.Logf("[PASS] category %q: %d poses", cat, count)
	}
}

func TestGetSafePoseIDsNoInjuries(t *testing.T) {
	safe := GetSafePoseIDs(nil)
	total := TotalPoseCount()
	if len(safe) != total {
		t.Errorf("GetSafePoseIDs(nil) returned %d poses, expected %d", len(safe), total)
	}
}

func TestGetSafePoseIDsWithKneeInjury(t *testing.T) {
	safe := GetSafePoseIDs([]string{"knee_injury"})
	total := TotalPoseCount()
	if len(safe) >= total {
		t.Errorf("knee_injury filter should reduce pose count, got %d/%d", len(safe), total)
	}
	for _, id := range safe {
		pose, _ := GetPoseByID(id)
		for _, c := range pose.Contraindications {
			if c == "knee_injury" {
				t.Errorf("pose %q has knee_injury contraindication but was not filtered", id)
			}
		}
	}
	t.Logf("[PASS] knee_injury filter: %d/%d poses safe", len(safe), total)
}

func TestGetSafePoseIDsWithMultipleInjuries(t *testing.T) {
	injuries := []string{"knee_injury", "herniated_disc", "neck_injury"}
	safe := GetSafePoseIDs(injuries)
	total := TotalPoseCount()
	if len(safe) >= total {
		t.Errorf("multiple injuries should reduce pose count significantly, got %d/%d", len(safe), total)
	}
	for _, id := range safe {
		pose, _ := GetPoseByID(id)
		for _, c := range pose.Contraindications {
			for _, inj := range injuries {
				if c == inj {
					t.Errorf("pose %q has %q contraindication but was not filtered", id, inj)
				}
			}
		}
	}
	t.Logf("[PASS] multi-injury filter: %d/%d poses safe", len(safe), total)
}

func TestPoseIndexConsistency(t *testing.T) {
	for _, p := range AllPoses {
		indexed, ok := GetPoseByID(p.PoseID)
		if !ok {
			t.Errorf("pose %q in AllPoses but not in index", p.PoseID)
			continue
		}
		if indexed.NameEN != p.NameEN {
			t.Errorf("index mismatch for %q: NameEN %q vs %q", p.PoseID, indexed.NameEN, p.NameEN)
		}
	}
}
