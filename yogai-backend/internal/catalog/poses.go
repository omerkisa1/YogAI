package catalog

type Category string

const (
	CategoryStanding  Category = "standing"
	CategorySeated    Category = "seated"
	CategoryProne     Category = "prone"
	CategorySupine    Category = "supine"
	CategoryInversion Category = "inversion"
)

type Pose struct {
	PoseID             string   `json:"pose_id"`
	NameEN             string   `json:"name_en"`
	NameTR             string   `json:"name_tr"`
	Category           Category `json:"category"`
	Difficulty         int      `json:"difficulty"`
	TargetArea         string   `json:"target_area"`
	Contraindications  []string `json:"contraindications"`
}

var AllPoses = []Pose{
	{PoseID: "mountain", NameEN: "Mountain Pose", NameTR: "Dağ Duruşu", Category: CategoryStanding, Difficulty: 1, TargetArea: "full_body", Contraindications: []string{}},
	{PoseID: "forward_fold", NameEN: "Standing Forward Fold", NameTR: "Ayakta Öne Eğilme", Category: CategoryStanding, Difficulty: 1, TargetArea: "hamstrings", Contraindications: []string{"herniated_disc", "low_back_pain"}},
	{PoseID: "warrior_1", NameEN: "Warrior I", NameTR: "Savaşçı I", Category: CategoryStanding, Difficulty: 2, TargetArea: "legs", Contraindications: []string{"knee_injury"}},
	{PoseID: "warrior_2", NameEN: "Warrior II", NameTR: "Savaşçı II", Category: CategoryStanding, Difficulty: 2, TargetArea: "legs", Contraindications: []string{"knee_injury"}},
	{PoseID: "warrior_3", NameEN: "Warrior III", NameTR: "Savaşçı III", Category: CategoryStanding, Difficulty: 4, TargetArea: "balance", Contraindications: []string{"knee_injury", "ankle_injury"}},
	{PoseID: "triangle", NameEN: "Triangle Pose", NameTR: "Üçgen Duruşu", Category: CategoryStanding, Difficulty: 2, TargetArea: "legs", Contraindications: []string{"low_back_pain"}},
	{PoseID: "extended_side_angle", NameEN: "Extended Side Angle", NameTR: "Uzatılmış Yan Açı", Category: CategoryStanding, Difficulty: 2, TargetArea: "legs", Contraindications: []string{"knee_injury"}},
	{PoseID: "tree", NameEN: "Tree Pose", NameTR: "Ağaç Duruşu", Category: CategoryStanding, Difficulty: 2, TargetArea: "balance", Contraindications: []string{"ankle_injury"}},
	{PoseID: "chair", NameEN: "Chair Pose", NameTR: "Sandalye Duruşu", Category: CategoryStanding, Difficulty: 2, TargetArea: "legs", Contraindications: []string{"knee_injury"}},
	{PoseID: "half_moon", NameEN: "Half Moon Pose", NameTR: "Yarım Ay Duruşu", Category: CategoryStanding, Difficulty: 3, TargetArea: "balance", Contraindications: []string{"low_back_pain", "ankle_injury"}},
	{PoseID: "eagle", NameEN: "Eagle Pose", NameTR: "Kartal Duruşu", Category: CategoryStanding, Difficulty: 3, TargetArea: "balance", Contraindications: []string{"knee_injury", "shoulder_injury"}},
	{PoseID: "dancer", NameEN: "Dancer Pose", NameTR: "Dansçı Duruşu", Category: CategoryStanding, Difficulty: 4, TargetArea: "balance", Contraindications: []string{"ankle_injury", "low_back_pain"}},
	{PoseID: "high_lunge", NameEN: "High Lunge", NameTR: "Yüksek Hamle", Category: CategoryStanding, Difficulty: 2, TargetArea: "legs", Contraindications: []string{"knee_injury"}},
	{PoseID: "crescent_lunge", NameEN: "Crescent Lunge", NameTR: "Hilal Hamle", Category: CategoryStanding, Difficulty: 2, TargetArea: "hip_flexors", Contraindications: []string{"knee_injury"}},
	{PoseID: "wide_leg_forward_fold", NameEN: "Wide-Legged Forward Fold", NameTR: "Geniş Bacak Öne Eğilme", Category: CategoryStanding, Difficulty: 2, TargetArea: "hamstrings", Contraindications: []string{"herniated_disc"}},
	{PoseID: "goddess", NameEN: "Goddess Pose", NameTR: "Tanrıça Duruşu", Category: CategoryStanding, Difficulty: 2, TargetArea: "legs", Contraindications: []string{"knee_injury"}},
	{PoseID: "standing_split", NameEN: "Standing Split", NameTR: "Ayakta Spagat", Category: CategoryStanding, Difficulty: 4, TargetArea: "hamstrings", Contraindications: []string{"hamstring_injury", "low_back_pain"}},

	{PoseID: "seated_forward_fold", NameEN: "Seated Forward Fold", NameTR: "Oturarak Öne Eğilme", Category: CategorySeated, Difficulty: 1, TargetArea: "hamstrings", Contraindications: []string{"herniated_disc"}},
	{PoseID: "easy_seat", NameEN: "Easy Seat", NameTR: "Kolay Oturuş", Category: CategorySeated, Difficulty: 1, TargetArea: "hips", Contraindications: []string{}},
	{PoseID: "bound_angle", NameEN: "Bound Angle Pose", NameTR: "Bağlı Açı Duruşu", Category: CategorySeated, Difficulty: 1, TargetArea: "hips", Contraindications: []string{"groin_injury"}},
	{PoseID: "head_to_knee", NameEN: "Head-to-Knee Pose", NameTR: "Baş-Diz Duruşu", Category: CategorySeated, Difficulty: 2, TargetArea: "hamstrings", Contraindications: []string{"herniated_disc", "knee_injury"}},
	{PoseID: "half_lord_of_fishes", NameEN: "Half Lord of the Fishes", NameTR: "Yarım Balıkların Efendisi", Category: CategorySeated, Difficulty: 2, TargetArea: "spine", Contraindications: []string{"herniated_disc", "spinal_injury"}},
	{PoseID: "hero", NameEN: "Hero Pose", NameTR: "Kahraman Duruşu", Category: CategorySeated, Difficulty: 2, TargetArea: "quadriceps", Contraindications: []string{"knee_injury"}},
	{PoseID: "cow_face", NameEN: "Cow Face Pose", NameTR: "İnek Yüzü Duruşu", Category: CategorySeated, Difficulty: 3, TargetArea: "shoulders", Contraindications: []string{"shoulder_injury", "knee_injury"}},
	{PoseID: "pigeon", NameEN: "Pigeon Pose", NameTR: "Güvercin Duruşu", Category: CategorySeated, Difficulty: 3, TargetArea: "hips", Contraindications: []string{"knee_injury", "hip_injury"}},
	{PoseID: "fire_log", NameEN: "Fire Log Pose", NameTR: "Ateş Kütüğü Duruşu", Category: CategorySeated, Difficulty: 3, TargetArea: "hips", Contraindications: []string{"knee_injury"}},
	{PoseID: "lotus", NameEN: "Lotus Pose", NameTR: "Lotus Duruşu", Category: CategorySeated, Difficulty: 4, TargetArea: "hips", Contraindications: []string{"knee_injury", "ankle_injury"}},
	{PoseID: "staff", NameEN: "Staff Pose", NameTR: "Asa Duruşu", Category: CategorySeated, Difficulty: 1, TargetArea: "core", Contraindications: []string{}},
	{PoseID: "cat_cow", NameEN: "Cat-Cow Stretch", NameTR: "Kedi-İnek Germe", Category: CategorySeated, Difficulty: 1, TargetArea: "spine", Contraindications: []string{}},

	{PoseID: "cobra", NameEN: "Cobra Pose", NameTR: "Kobra Duruşu", Category: CategoryProne, Difficulty: 1, TargetArea: "back", Contraindications: []string{"herniated_disc", "pregnancy"}},
	{PoseID: "upward_dog", NameEN: "Upward-Facing Dog", NameTR: "Yukarı Bakan Köpek", Category: CategoryProne, Difficulty: 2, TargetArea: "back", Contraindications: []string{"herniated_disc", "wrist_injury"}},
	{PoseID: "sphinx", NameEN: "Sphinx Pose", NameTR: "Sfenks Duruşu", Category: CategoryProne, Difficulty: 1, TargetArea: "back", Contraindications: []string{"herniated_disc"}},
	{PoseID: "locust", NameEN: "Locust Pose", NameTR: "Çekirge Duruşu", Category: CategoryProne, Difficulty: 2, TargetArea: "back", Contraindications: []string{"herniated_disc", "pregnancy"}},
	{PoseID: "bow", NameEN: "Bow Pose", NameTR: "Yay Duruşu", Category: CategoryProne, Difficulty: 3, TargetArea: "back", Contraindications: []string{"herniated_disc", "pregnancy", "low_back_pain"}},
	{PoseID: "plank", NameEN: "Plank Pose", NameTR: "Plank Duruşu", Category: CategoryProne, Difficulty: 2, TargetArea: "core", Contraindications: []string{"wrist_injury"}},
	{PoseID: "side_plank", NameEN: "Side Plank", NameTR: "Yan Plank", Category: CategoryProne, Difficulty: 3, TargetArea: "core", Contraindications: []string{"wrist_injury", "shoulder_injury"}},
	{PoseID: "forearm_plank", NameEN: "Forearm Plank", NameTR: "Ön Kol Plank", Category: CategoryProne, Difficulty: 2, TargetArea: "core", Contraindications: []string{}},
	{PoseID: "downward_dog", NameEN: "Downward-Facing Dog", NameTR: "Aşağı Bakan Köpek", Category: CategoryProne, Difficulty: 2, TargetArea: "full_body", Contraindications: []string{"wrist_injury", "high_blood_pressure"}},
	{PoseID: "child", NameEN: "Child's Pose", NameTR: "Çocuk Duruşu", Category: CategoryProne, Difficulty: 1, TargetArea: "back", Contraindications: []string{"knee_injury"}},
	{PoseID: "swimming", NameEN: "Swimming Pose", NameTR: "Yüzme Duruşu", Category: CategoryProne, Difficulty: 2, TargetArea: "back", Contraindications: []string{"low_back_pain"}},

	{PoseID: "bridge", NameEN: "Bridge Pose", NameTR: "Köprü Duruşu", Category: CategorySupine, Difficulty: 1, TargetArea: "glutes", Contraindications: []string{"neck_injury"}},
	{PoseID: "supine_twist", NameEN: "Supine Spinal Twist", NameTR: "Sırtüstü Omurga Bükümü", Category: CategorySupine, Difficulty: 1, TargetArea: "spine", Contraindications: []string{"herniated_disc"}},
	{PoseID: "happy_baby", NameEN: "Happy Baby Pose", NameTR: "Mutlu Bebek Duruşu", Category: CategorySupine, Difficulty: 1, TargetArea: "hips", Contraindications: []string{"neck_injury", "pregnancy"}},
	{PoseID: "legs_up_wall", NameEN: "Legs Up the Wall", NameTR: "Duvarda Bacaklar", Category: CategorySupine, Difficulty: 1, TargetArea: "legs", Contraindications: []string{"high_blood_pressure"}},
	{PoseID: "reclined_bound_angle", NameEN: "Reclined Bound Angle", NameTR: "Sırtüstü Bağlı Açı", Category: CategorySupine, Difficulty: 1, TargetArea: "hips", Contraindications: []string{"groin_injury"}},
	{PoseID: "wind_relieving", NameEN: "Wind Relieving Pose", NameTR: "Gaz Giderici Duruş", Category: CategorySupine, Difficulty: 1, TargetArea: "core", Contraindications: []string{}},
	{PoseID: "corpse", NameEN: "Corpse Pose", NameTR: "Ölü Duruşu (Savasana)", Category: CategorySupine, Difficulty: 1, TargetArea: "full_body", Contraindications: []string{}},
	{PoseID: "fish", NameEN: "Fish Pose", NameTR: "Balık Duruşu", Category: CategorySupine, Difficulty: 2, TargetArea: "chest", Contraindications: []string{"neck_injury", "low_back_pain"}},
	{PoseID: "wheel", NameEN: "Wheel Pose", NameTR: "Tekerlek Duruşu", Category: CategorySupine, Difficulty: 5, TargetArea: "back", Contraindications: []string{"wrist_injury", "shoulder_injury", "neck_injury", "herniated_disc"}},
	{PoseID: "reclined_hand_to_toe", NameEN: "Reclined Hand-to-Big-Toe", NameTR: "Sırtüstü El-Ayak Parmağı", Category: CategorySupine, Difficulty: 2, TargetArea: "hamstrings", Contraindications: []string{}},

	{PoseID: "headstand", NameEN: "Headstand", NameTR: "Baş Üstü Duruş", Category: CategoryInversion, Difficulty: 5, TargetArea: "core", Contraindications: []string{"neck_injury", "high_blood_pressure", "pregnancy", "glaucoma"}},
	{PoseID: "shoulderstand", NameEN: "Shoulderstand", NameTR: "Omuz Üstü Duruş", Category: CategoryInversion, Difficulty: 4, TargetArea: "core", Contraindications: []string{"neck_injury", "high_blood_pressure", "pregnancy"}},
	{PoseID: "plow", NameEN: "Plow Pose", NameTR: "Saban Duruşu", Category: CategoryInversion, Difficulty: 4, TargetArea: "spine", Contraindications: []string{"neck_injury", "herniated_disc", "high_blood_pressure"}},
	{PoseID: "forearm_stand", NameEN: "Forearm Stand", NameTR: "Ön Kol Duruşu", Category: CategoryInversion, Difficulty: 5, TargetArea: "shoulders", Contraindications: []string{"shoulder_injury", "neck_injury", "high_blood_pressure"}},
	{PoseID: "dolphin", NameEN: "Dolphin Pose", NameTR: "Yunus Duruşu", Category: CategoryInversion, Difficulty: 3, TargetArea: "shoulders", Contraindications: []string{"shoulder_injury"}},
}

var poseIndex map[string]*Pose

func init() {
	poseIndex = make(map[string]*Pose, len(AllPoses))
	for i := range AllPoses {
		poseIndex[AllPoses[i].PoseID] = &AllPoses[i]
	}
}

func GetPoseByID(id string) (*Pose, bool) {
	p, ok := poseIndex[id]
	return p, ok
}

func GetAllPoses() []Pose {
	return AllPoses
}

func AllPoseIDs() []string {
	ids := make([]string, len(AllPoses))
	for i, p := range AllPoses {
		ids[i] = p.PoseID
	}
	return ids
}

func GetSafePoseIDs(injuries []string) []string {
	if len(injuries) == 0 {
		return AllPoseIDs()
	}
	injurySet := make(map[string]bool, len(injuries))
	for _, inj := range injuries {
		injurySet[inj] = true
	}
	var safe []string
	for _, p := range AllPoses {
		blocked := false
		for _, c := range p.Contraindications {
			if injurySet[c] {
				blocked = true
				break
			}
		}
		if !blocked {
			safe = append(safe, p.PoseID)
		}
	}
	return safe
}
