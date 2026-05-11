package catalog

type Category string

const (
	CategoryStanding  Category = "standing"
	CategorySeated    Category = "seated"
	CategoryProne     Category = "prone"
	CategorySupine    Category = "supine"
	CategoryInversion Category = "inversion"
	CategoryFace      Category = "face"
)

type LandmarkRule struct {
	Joint      string  `json:"joint"`
	PointA     int     `json:"point_a"`
	PointB     int     `json:"point_b"`
	PointC     int     `json:"point_c"`
	AngleMin   float64 `json:"angle_min"`
	AngleMax   float64 `json:"angle_max"`
	Weight     float64 `json:"weight"`
	RuleType   string  `json:"rule_type"`
	FeedbackEN string  `json:"feedback_en"`
	FeedbackTR string  `json:"feedback_tr"`
}

type Pose struct {
	PoseID            string         `json:"pose_id"`
	NameEN            string         `json:"name_en"`
	NameTR            string         `json:"name_tr"`
	Category          Category       `json:"category"`
	Difficulty        int            `json:"difficulty"`
	TargetArea        string         `json:"target_area"`
	InstructionsEN    string         `json:"instructions_en"`
	InstructionsTR    string         `json:"instructions_tr"`
	Contraindications []string       `json:"contraindications"`
	LandmarkRules     []LandmarkRule `json:"landmark_rules"`
	IsAnalyzable      bool           `json:"is_analyzable"`
	AnalysisKind      string         `json:"analysis_kind"`
	MetricType        string         `json:"metric_type"`
	RepTarget         int            `json:"rep_target"`
}

var AllPoses = []Pose{
	{PoseID: "test_right_arm_up", NameEN: "[TEST] Right Arm Up", NameTR: "[TEST] Sağ Kol Yukarı", Category: CategoryStanding, Difficulty: 1, TargetArea: "arms",
		InstructionsEN: "Raise your right arm straight up.", InstructionsTR: "Sağ kolunuzu dümdüz yukarı kaldırın.", Contraindications: []string{},
		LandmarkRules: []LandmarkRule{
			{Joint: "right_shoulder", PointA: 24, PointB: 12, PointC: 14, AngleMin: 150, AngleMax: 180, Weight: 0.50, RuleType: "target", FeedbackEN: "Raise your right arm higher.", FeedbackTR: "Sağ kolunuzu daha yukarı kaldırın."},
			{Joint: "right_elbow", PointA: 12, PointB: 14, PointC: 16, AngleMin: 160, AngleMax: 180, Weight: 0.50, RuleType: "target", FeedbackEN: "Keep your right elbow straight.", FeedbackTR: "Sağ dirseğinizi bükmeyin, dümdüz tutun."},
			{Joint: "torso_lean", PointA: 12, PointB: 24, PointC: 26, AngleMin: 0, AngleMax: 160, Weight: 0.15, RuleType: "fault", FeedbackEN: "Don't lean your torso, stand straight.", FeedbackTR: "Gövdenizi yana eğmeyin, dik durun."},
		},
	},
	{PoseID: "test_bend_elbows", NameEN: "[TEST] Bend Elbows", NameTR: "[TEST] İki Dirseği Bük", Category: CategoryStanding, Difficulty: 1, TargetArea: "arms",
		InstructionsEN: "Bend both of your elbows tightly.", InstructionsTR: "İki dirseğinizi de kendinize doğru iyice bükün.", Contraindications: []string{},
		LandmarkRules: []LandmarkRule{
			{Joint: "left_elbow", PointA: 11, PointB: 13, PointC: 15, AngleMin: 10, AngleMax: 60, Weight: 0.50, RuleType: "target", FeedbackEN: "Bend your left elbow more.", FeedbackTR: "Sol dirseğinizi daha fazla bükün."},
			{Joint: "right_elbow", PointA: 12, PointB: 14, PointC: 16, AngleMin: 10, AngleMax: 60, Weight: 0.50, RuleType: "target", FeedbackEN: "Bend your right elbow more.", FeedbackTR: "Sağ dirseğinizi daha fazla bükün."},
		},
	},
	{PoseID: "test_t_pose", NameEN: "[TEST] T-Pose", NameTR: "[TEST] Kolları Yana Aç (T)", Category: CategoryStanding, Difficulty: 1, TargetArea: "arms",
		InstructionsEN: "Raise both arms to the sides parallel to the floor.", InstructionsTR: "İki kolunuzu da yere paralel olacak şekilde yana açın.", Contraindications: []string{},
		LandmarkRules: []LandmarkRule{
			{Joint: "left_shoulder_raise", PointA: 23, PointB: 11, PointC: 13, AngleMin: 75, AngleMax: 105, Weight: 0.25, RuleType: "target", FeedbackEN: "Keep left arm parallel to floor.", FeedbackTR: "Sol kolunuzu yere paralel hizaya getirin."},
			{Joint: "right_shoulder_raise", PointA: 24, PointB: 12, PointC: 14, AngleMin: 75, AngleMax: 105, Weight: 0.25, RuleType: "target", FeedbackEN: "Keep right arm parallel to floor.", FeedbackTR: "Sağ kolunuzu yere paralel hizaya getirin."},
			{Joint: "left_elbow_straight", PointA: 11, PointB: 13, PointC: 15, AngleMin: 160, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Straighten left arm.", FeedbackTR: "Sol kolunuzu tamamen düzeltin."},
			{Joint: "right_elbow_straight", PointA: 12, PointB: 14, PointC: 16, AngleMin: 160, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Straighten right arm.", FeedbackTR: "Sağ kolunuzu tamamen düzeltin."},
		},
	},
	{PoseID: "mountain", NameEN: "Mountain Pose", NameTR: "Dağ Duruşu", Category: CategoryStanding, Difficulty: 1, TargetArea: "full_body", InstructionsEN: "Stand tall with feet together, arms at sides. Distribute weight evenly, engage thighs, lengthen spine. Relax shoulders down and breathe deeply.", InstructionsTR: "Ayaklar bitişik, kollar yanlarda dik durun. Ağırlığı eşit dağıtın, baldırları sıkın, omurgayı uzatın. Omuzları gevşetin ve derin nefes alın.", Contraindications: []string{},
		LandmarkRules: []LandmarkRule{
			{Joint: "left_leg", PointA: 23, PointB: 25, PointC: 27, AngleMin: 170, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Keep your left leg straight.", FeedbackTR: "Sol bacağınızı düz tutun."},
			{Joint: "right_leg", PointA: 24, PointB: 26, PointC: 28, AngleMin: 170, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Keep your right leg straight.", FeedbackTR: "Sağ bacağınızı düz tutun."},
			{Joint: "left_arm", PointA: 11, PointB: 13, PointC: 15, AngleMin: 160, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Keep your left arm straight down.", FeedbackTR: "Sol kolunuzu düz aşağı sarkıtın."},
			{Joint: "upright_body", PointA: 11, PointB: 23, PointC: 25, AngleMin: 170, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Stand tall and straight.", FeedbackTR: "Dik ve düz durun."},
		},
	},
	{PoseID: "forward_fold", NameEN: "Standing Forward Fold", NameTR: "Ayakta Öne Eğilme", Category: CategoryStanding, Difficulty: 1, TargetArea: "hamstrings", InstructionsEN: "From standing, hinge at hips and fold forward. Let head hang heavy, bend knees slightly if needed. Hold opposite elbows and sway gently.", InstructionsTR: "Ayakta duruştan kalçalardan öne doğru katlayın. Başı serbest bırakın, gerekirse dizleri hafifçe bükün. Dirseklerden tutup hafifçe sallanın.", Contraindications: []string{"herniated_disc", "low_back_pain"},
		LandmarkRules: []LandmarkRule{
			{Joint: "hip_fold", PointA: 11, PointB: 23, PointC: 25, AngleMin: 30, AngleMax: 90, Weight: 0.40, RuleType: "target", FeedbackEN: "Fold deeper from your hips.", FeedbackTR: "Kalçalarınızdan daha fazla katlayın."},
			{Joint: "legs_straight", PointA: 23, PointB: 25, PointC: 27, AngleMin: 150, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Try to keep your legs straight.", FeedbackTR: "Bacaklarınızı düz tutmaya çalışın."},
			{Joint: "arms_hanging", PointA: 11, PointB: 13, PointC: 15, AngleMin: 140, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Let your arms hang naturally.", FeedbackTR: "Kollarınızı doğal şekilde sarkıtın."},
		},
	},
	{PoseID: "warrior_1", NameEN: "Warrior I", NameTR: "Savaşçı I", Category: CategoryStanding, Difficulty: 2, TargetArea: "legs", InstructionsEN: "Step one foot back, bend front knee to 90 degrees. Square hips forward, raise arms overhead. Press back heel firmly into the mat.", InstructionsTR: "Bir ayağı geriye atın, ön dizi 90 derece bükün. Kalçaları öne hizalayın, kolları yukarı kaldırın. Arka topuğu yere sıkıca basın.", Contraindications: []string{"knee_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "front_knee", PointA: 23, PointB: 25, PointC: 27, AngleMin: 85, AngleMax: 110, Weight: 0.30, RuleType: "target", FeedbackEN: "Bend your front knee close to 90 degrees.", FeedbackTR: "Ön dizinizi 90 dereceye yakın bükün."},
			{Joint: "back_leg", PointA: 24, PointB: 26, PointC: 28, AngleMin: 160, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Keep your back leg straight.", FeedbackTR: "Arka bacağınızı düz tutun."},
			{Joint: "arms_up", PointA: 13, PointB: 11, PointC: 23, AngleMin: 150, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Reach your arms up straight.", FeedbackTR: "Kollarınızı yukarı uzatın."},
			{Joint: "torso_upright", PointA: 11, PointB: 23, PointC: 25, AngleMin: 160, AngleMax: 180, Weight: 0.20, RuleType: "target", FeedbackEN: "Keep your torso upright.", FeedbackTR: "Gövdenizi dik tutun."},
		},
	},
	{PoseID: "warrior_2", NameEN: "Warrior II", NameTR: "Savaşçı II", Category: CategoryStanding, Difficulty: 2, TargetArea: "legs", InstructionsEN: "Step feet wide apart, turn front foot out 90 degrees. Bend front knee over ankle, extend arms parallel to floor. Gaze over front fingertips.", InstructionsTR: "Ayakları geniş açın, ön ayağı 90 derece dışa çevirin. Ön dizi bilek üzerine bükün, kolları yere paralel uzatın. Bakışları ön parmak uçlarına yöneltin.", Contraindications: []string{"knee_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "front_knee", PointA: 23, PointB: 25, PointC: 27, AngleMin: 85, AngleMax: 110, Weight: 0.30, RuleType: "target", FeedbackEN: "Bend your front knee close to 90 degrees.", FeedbackTR: "Ön dizinizi 90 dereceye yakın bükün."},
			{Joint: "back_leg", PointA: 24, PointB: 26, PointC: 28, AngleMin: 160, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Keep your back leg straight.", FeedbackTR: "Arka bacağınızı düz tutun."},
			{Joint: "arms_parallel", PointA: 15, PointB: 11, PointC: 12, AngleMin: 160, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Keep arms parallel to the floor.", FeedbackTR: "Kollarınızı yere paralel tutun."},
			{Joint: "torso_upright", PointA: 11, PointB: 23, PointC: 25, AngleMin: 160, AngleMax: 180, Weight: 0.20, RuleType: "target", FeedbackEN: "Keep your torso centered.", FeedbackTR: "Gövdenizi ortada ve dik tutun."},
		},
	},
	{PoseID: "warrior_3", NameEN: "Warrior III", NameTR: "Savaşçı III", Category: CategoryStanding, Difficulty: 4, TargetArea: "balance", InstructionsEN: "From standing, hinge forward at hips while lifting one leg behind. Arms extend forward, body forms a T-shape. Keep standing leg strong and hips level.", InstructionsTR: "Ayakta duruştan kalçalardan öne eğilirken bir bacağı arkaya kaldırın. Kollar öne uzanır, vücut T şekli oluşturur. Duran bacağı güçlü tutun, kalçaları hizada tutun.", Contraindications: []string{"knee_injury", "ankle_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "standing_leg", PointA: 23, PointB: 25, PointC: 27, AngleMin: 165, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Keep your standing leg straight.", FeedbackTR: "Duran bacağınızı düz tutun."},
			{Joint: "torso_parallel", PointA: 11, PointB: 23, PointC: 25, AngleMin: 70, AngleMax: 110, Weight: 0.35, RuleType: "target", FeedbackEN: "Lower your torso parallel to the floor.", FeedbackTR: "Gövdenizi yere paralel hale getirin."},
			{Joint: "arms_forward", PointA: 13, PointB: 11, PointC: 23, AngleMin: 150, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Extend your arms forward.", FeedbackTR: "Kollarınızı öne uzatın."},
		},
	},
	{PoseID: "triangle", NameEN: "Triangle Pose", NameTR: "Üçgen Duruşu", Category: CategoryStanding, Difficulty: 2, TargetArea: "legs", InstructionsEN: "Step feet wide, turn front foot out. Extend torso over front leg, lower hand to shin or floor. Top arm reaches to ceiling.", InstructionsTR: "Ayakları geniş açın, ön ayağı dışa çevirin. Gövdeyi ön bacak üzerine uzatın, eli baldıra veya yere indirin. Üst kol tavana uzanır.", Contraindications: []string{"low_back_pain"},
		LandmarkRules: []LandmarkRule{
			{Joint: "front_leg", PointA: 23, PointB: 25, PointC: 27, AngleMin: 160, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Keep your front leg straight.", FeedbackTR: "Ön bacağınızı düz tutun."},
			{Joint: "back_leg", PointA: 24, PointB: 26, PointC: 28, AngleMin: 160, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Keep your back leg straight.", FeedbackTR: "Arka bacağınızı düz tutun."},
			{Joint: "torso_lateral", PointA: 11, PointB: 23, PointC: 25, AngleMin: 60, AngleMax: 110, Weight: 0.25, RuleType: "target", FeedbackEN: "Bend sideways over your front leg.", FeedbackTR: "Ön bacağınızın üzerine doğru yana eğilin."},
			{Joint: "arms_vertical", PointA: 15, PointB: 11, PointC: 12, AngleMin: 160, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Extend arms vertically.", FeedbackTR: "Kollarınızı dikey olarak uzatın."},
		},
	},
	{PoseID: "extended_side_angle", NameEN: "Extended Side Angle", NameTR: "Uzatılmış Yan Açı", Category: CategoryStanding, Difficulty: 2, TargetArea: "legs", InstructionsEN: "From Warrior II, bring front forearm to front thigh or hand to floor. Extend top arm over ear creating one long line from back foot to fingertips.", InstructionsTR: "Savaşçı II'den ön kolu ön uyluğa veya eli yere indirin. Üst kolu kulak üzerinden uzatarak arka ayaktan parmak uçlarına tek bir çizgi oluşturun.", Contraindications: []string{"knee_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "front_knee", PointA: 23, PointB: 25, PointC: 27, AngleMin: 85, AngleMax: 110, Weight: 0.30, RuleType: "target", FeedbackEN: "Bend your front knee to 90 degrees.", FeedbackTR: "Ön dizinizi 90 dereceye bükün."},
			{Joint: "back_leg", PointA: 24, PointB: 26, PointC: 28, AngleMin: 160, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Keep your back leg straight.", FeedbackTR: "Arka bacağınızı düz tutun."},
			{Joint: "torso_lateral", PointA: 12, PointB: 24, PointC: 26, AngleMin: 140, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Extend your torso over the front leg.", FeedbackTR: "Gövdenizi ön bacağınızın üzerine uzatın."},
			{Joint: "top_arm", PointA: 13, PointB: 11, PointC: 23, AngleMin: 150, AngleMax: 180, Weight: 0.20, RuleType: "target", FeedbackEN: "Reach your top arm over your ear.", FeedbackTR: "Üst kolunuzu kulağınızın üzerinden uzatın."},
		},
	},
	{PoseID: "tree", NameEN: "Tree Pose", NameTR: "Ağaç Duruşu", Category: CategoryStanding, Difficulty: 2, TargetArea: "balance", InstructionsEN: "Stand on one leg, place other foot on inner thigh or calf (never on knee). Bring hands to prayer or overhead. Fix gaze on a steady point.", InstructionsTR: "Tek bacak üzerinde durun, diğer ayağı iç uyluğa veya baldıra yerleştirin (asla dize değil). Elleri namaz pozisyonuna veya yukarı getirin. Bakışları sabit bir noktaya odaklayın.", Contraindications: []string{"ankle_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "standing_leg", PointA: 23, PointB: 25, PointC: 27, AngleMin: 170, AngleMax: 180, Weight: 0.40, RuleType: "target", FeedbackEN: "Keep your standing leg straight.", FeedbackTR: "Yere basan bacağınızı düz tutun."},
			{Joint: "bent_knee", PointA: 24, PointB: 26, PointC: 28, AngleMin: 30, AngleMax: 90, Weight: 0.30, RuleType: "target", FeedbackEN: "Bend your other knee and place your foot on your thigh or calf.", FeedbackTR: "Diğer dizinizi bükün ve ayağınızı bacağınıza yerleştirin."},
			{Joint: "torso", PointA: 11, PointB: 23, PointC: 25, AngleMin: 170, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Stand tall.", FeedbackTR: "Dik durun."},
		},
	},
	{PoseID: "chair", NameEN: "Chair Pose", NameTR: "Sandalye Duruşu", Category: CategoryStanding, Difficulty: 2, TargetArea: "legs", InstructionsEN: "Stand with feet together, bend knees as if sitting in a chair. Keep knees behind toes, raise arms overhead. Engage core and lengthen tailbone down.", InstructionsTR: "Ayaklar bitişik, dizleri sandalyeye oturur gibi bükün. Dizleri parmak uçlarının gerisinde tutun, kolları yukarı kaldırın. Karnı sıkın ve kuyruk kemiğini aşağı uzatın.", Contraindications: []string{"knee_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "knees_bent", PointA: 23, PointB: 25, PointC: 27, AngleMin: 90, AngleMax: 140, Weight: 0.40, RuleType: "target", FeedbackEN: "Bend your knees as if sitting in a chair.", FeedbackTR: "Sanki bir sandalyede oturuyormuş gibi dizlerinizi bükün."},
			{Joint: "hips_flexed", PointA: 11, PointB: 23, PointC: 25, AngleMin: 90, AngleMax: 140, Weight: 0.30, RuleType: "target", FeedbackEN: "Hinge at your hips.", FeedbackTR: "Kalçalarınızdan eğilin."},
			{Joint: "arms_up", PointA: 15, PointB: 11, PointC: 23, AngleMin: 140, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Extend arms up alongside your ears.", FeedbackTR: "Kollarınızı kulaklarınızın yanına doğru uzatın."},
		},
	},
	{PoseID: "half_moon", NameEN: "Half Moon Pose", NameTR: "Yarım Ay Duruşu", Category: CategoryStanding, Difficulty: 3, TargetArea: "balance", InstructionsEN: "From Triangle, bend front knee and shift weight forward. Lift back leg parallel to floor, open hips and chest to the side. Bottom hand on floor or block.", InstructionsTR: "Üçgen duruşundan ön dizi bükün ve ağırlığı öne kaydırın. Arka bacağı yere paralel kaldırın, kalça ve göğsü yana açın. Alt el yerde veya blokta.", Contraindications: []string{"low_back_pain", "ankle_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "standing_leg", PointA: 23, PointB: 25, PointC: 27, AngleMin: 160, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Keep your standing leg straight.", FeedbackTR: "Duran bacağınızı düz tutun."},
			{Joint: "lifted_leg", PointA: 24, PointB: 26, PointC: 28, AngleMin: 160, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Keep your lifted leg straight and parallel to the floor.", FeedbackTR: "Kaldırdığınız bacağı düz ve yere paralel tutun."},
			{Joint: "torso_open", PointA: 15, PointB: 11, PointC: 23, AngleMin: 150, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Open your chest to the side.", FeedbackTR: "Göğsünüzü yana açın."},
		},
	},
	{PoseID: "eagle", NameEN: "Eagle Pose", NameTR: "Kartal Duruşu", Category: CategoryStanding, Difficulty: 3, TargetArea: "balance", InstructionsEN: "Wrap one leg over the other, cross arms at elbows and wrists. Sink hips down, lift elbows up. Focus on a fixed point for balance.", InstructionsTR: "Bir bacağı diğerinin üzerine sarın, kolları dirsek ve bileklerden çaprazlayın. Kalçaları aşağı indirin, dirsekleri yukarı kaldırın. Denge için sabit bir noktaya odaklanın.", Contraindications: []string{"knee_injury", "shoulder_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "knees_bent", PointA: 23, PointB: 25, PointC: 27, AngleMin: 100, AngleMax: 150, Weight: 0.40, RuleType: "target", FeedbackEN: "Sink your hips lower.", FeedbackTR: "Kalçalarınızı daha aşağı indirin."},
			{Joint: "elbows_up", PointA: 11, PointB: 13, PointC: 15, AngleMin: 30, AngleMax: 90, Weight: 0.30, RuleType: "target", FeedbackEN: "Lift your elbows to shoulder height.", FeedbackTR: "Dirseklerinizi omuz hizasına kaldırın."},
			{Joint: "torso_upright", PointA: 11, PointB: 23, PointC: 25, AngleMin: 160, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Keep your torso upright.", FeedbackTR: "Gövdenizi dik tutun."},
		},
	},
	{PoseID: "dancer", NameEN: "Dancer Pose", NameTR: "Dansçı Duruşu", Category: CategoryStanding, Difficulty: 4, TargetArea: "balance", InstructionsEN: "Stand on one leg, grab opposite foot behind you. Press foot into hand and lean forward, extending free arm ahead. Open chest and hold balance.", InstructionsTR: "Tek bacak üzerinde durun, karşı ayağı arkanızdan tutun. Ayağı ele doğru bastırın ve öne eğilin, serbest kolu öne uzatın. Göğsü açın ve dengeyi koruyun.", Contraindications: []string{"ankle_injury", "low_back_pain"},
		LandmarkRules: []LandmarkRule{
			{Joint: "standing_leg", PointA: 23, PointB: 25, PointC: 27, AngleMin: 160, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Keep your standing leg straight.", FeedbackTR: "Duran bacağınızı düz tutun."},
			{Joint: "back_leg_lift", PointA: 24, PointB: 26, PointC: 28, AngleMin: 30, AngleMax: 90, Weight: 0.30, RuleType: "target", FeedbackEN: "Kick your back foot higher.", FeedbackTR: "Arka ayağınızı daha yukarı kaldırın."},
			{Joint: "forward_lean", PointA: 11, PointB: 23, PointC: 25, AngleMin: 100, AngleMax: 150, Weight: 0.35, RuleType: "target", FeedbackEN: "Lean your torso forward.", FeedbackTR: "Gövdenizi öne eğin."},
		},
	},
	{PoseID: "high_lunge", NameEN: "High Lunge", NameTR: "Yüksek Hamle", Category: CategoryStanding, Difficulty: 2, TargetArea: "legs", InstructionsEN: "Step one foot back, bend front knee to 90 degrees. Back heel lifted, arms reach overhead. Keep core engaged and hips square.", InstructionsTR: "Bir ayağı geriye atın, ön dizi 90 derece bükün. Arka topuk havada, kollar yukarı uzanır. Karnı sıkı ve kalçaları hizada tutun.", Contraindications: []string{"knee_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "front_knee", PointA: 23, PointB: 25, PointC: 27, AngleMin: 85, AngleMax: 110, Weight: 0.30, RuleType: "target", FeedbackEN: "Bend your front knee to 90 degrees.", FeedbackTR: "Ön dizinizi 90 dereceye bükün."},
			{Joint: "arms_up", PointA: 13, PointB: 11, PointC: 23, AngleMin: 150, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Raise your arms overhead.", FeedbackTR: "Kollarınızı yukarı kaldırın."},
			{Joint: "torso_upright", PointA: 11, PointB: 23, PointC: 25, AngleMin: 160, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Keep your torso upright.", FeedbackTR: "Gövdenizi dik tutun."},
			{Joint: "back_leg", PointA: 24, PointB: 26, PointC: 28, AngleMin: 150, AngleMax: 180, Weight: 0.20, RuleType: "target", FeedbackEN: "Straighten your back leg.", FeedbackTR: "Arka bacağınızı düzeltin."},
		},
	},
	{PoseID: "crescent_lunge", NameEN: "Crescent Lunge", NameTR: "Hilal Hamle", Category: CategoryStanding, Difficulty: 2, TargetArea: "hip_flexors", InstructionsEN: "From High Lunge, gently arch back, lifting chest and reaching arms up and slightly back. Deepen the stretch in hip flexors. Breathe steadily.", InstructionsTR: "Yüksek Hamle'den hafifçe arkaya kavis yapın, göğsü kaldırın ve kolları yukarı ve hafifçe geriye uzatın. Kalça fleksörlerinde gerilmeyi derinleştirin. Düzenli nefes alın.", Contraindications: []string{"knee_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "front_knee", PointA: 23, PointB: 25, PointC: 27, AngleMin: 85, AngleMax: 110, Weight: 0.30, RuleType: "target", FeedbackEN: "Bend your front knee to 90 degrees.", FeedbackTR: "Ön dizinizi 90 dereceye bükün."},
			{Joint: "arms_up_back", PointA: 15, PointB: 11, PointC: 23, AngleMin: 150, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Reach your arms up and slightly back.", FeedbackTR: "Kollarınızı yukarı ve hafifçe geriye uzatın."},
			{Joint: "back_arch", PointA: 11, PointB: 23, PointC: 25, AngleMin: 140, AngleMax: 170, Weight: 0.25, RuleType: "target", FeedbackEN: "Gently arch your back.", FeedbackTR: "Sırtınızı nazikçe kavisleştirin."},
			{Joint: "back_leg", PointA: 24, PointB: 26, PointC: 28, AngleMin: 150, AngleMax: 180, Weight: 0.20, RuleType: "target", FeedbackEN: "Straighten your back leg.", FeedbackTR: "Arka bacağınızı düzeltin."},
		},
	},
	{PoseID: "wide_leg_forward_fold", NameEN: "Wide-Legged Forward Fold", NameTR: "Geniş Bacak Öne Eğilme", Category: CategoryStanding, Difficulty: 2, TargetArea: "hamstrings", InstructionsEN: "Step feet wide apart, toes slightly inward. Fold forward from hips, bring hands to floor or hold ankles. Keep legs strong and spine long.", InstructionsTR: "Ayakları geniş açın, parmak uçları hafif içe dönük. Kalçalardan öne katlayın, elleri yere veya bileklere getirin. Bacakları güçlü ve omurgayı uzun tutun.", Contraindications: []string{"herniated_disc"},
		LandmarkRules: []LandmarkRule{
			{Joint: "hip_fold", PointA: 11, PointB: 23, PointC: 25, AngleMin: 30, AngleMax: 90, Weight: 0.40, RuleType: "target", FeedbackEN: "Fold forward from your hips.", FeedbackTR: "Kalçalarınızdan öne katlayın."},
			{Joint: "left_leg", PointA: 23, PointB: 25, PointC: 27, AngleMin: 160, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Keep your legs straight.", FeedbackTR: "Bacaklarınızı düz tutun."},
			{Joint: "right_leg", PointA: 24, PointB: 26, PointC: 28, AngleMin: 160, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Keep your legs straight.", FeedbackTR: "Bacaklarınızı düz tutun."},
		},
	},
	{PoseID: "goddess", NameEN: "Goddess Pose", NameTR: "Tanrıça Duruşu", Category: CategoryStanding, Difficulty: 2, TargetArea: "legs", InstructionsEN: "Step feet wide, turn toes out 45 degrees. Bend knees over ankles into a deep squat. Arms at shoulder height with elbows bent, palms forward.", InstructionsTR: "Ayakları geniş açın, parmak uçlarını 45 derece dışa çevirin. Dizleri bilekler üzerine bükün ve derin çömelin. Kollar omuz hizasında, dirsekler bükülü, avuçlar öne bakıyor.", Contraindications: []string{"knee_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "left_knee", PointA: 23, PointB: 25, PointC: 27, AngleMin: 80, AngleMax: 120, Weight: 0.25, RuleType: "target", FeedbackEN: "Bend your knees deeply.", FeedbackTR: "Dizlerinizi derince bükün."},
			{Joint: "right_knee", PointA: 24, PointB: 26, PointC: 28, AngleMin: 80, AngleMax: 120, Weight: 0.25, RuleType: "target", FeedbackEN: "Bend your knees deeply.", FeedbackTR: "Dizlerinizi derince bükün."},
			{Joint: "arms_bent", PointA: 11, PointB: 13, PointC: 15, AngleMin: 70, AngleMax: 110, Weight: 0.25, RuleType: "target", FeedbackEN: "Bend elbows at 90 degrees, arms at shoulder height.", FeedbackTR: "Dirsekleri 90 derecede, kollar omuz hizasında."},
			{Joint: "torso_upright", PointA: 11, PointB: 23, PointC: 25, AngleMin: 165, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Keep your torso upright.", FeedbackTR: "Gövdenizi dik tutun."},
		},
	},
	{PoseID: "standing_split", NameEN: "Standing Split", NameTR: "Ayakta Spagat", Category: CategoryStanding, Difficulty: 4, TargetArea: "hamstrings", InstructionsEN: "From forward fold, lift one leg high behind you. Keep hips square and standing leg straight. Hands on floor or blocks for support.", InstructionsTR: "Öne eğilmeden bir bacağı arkaya doğru yükseğe kaldırın. Kalçaları hizada ve duran bacağı düz tutun. Eller yerde veya bloklarda destek için.", Contraindications: []string{"hamstring_injury", "low_back_pain"},
		LandmarkRules: []LandmarkRule{
			{Joint: "standing_leg", PointA: 23, PointB: 25, PointC: 27, AngleMin: 160, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Keep your standing leg straight.", FeedbackTR: "Duran bacağınızı düz tutun."},
			{Joint: "lifted_leg", PointA: 24, PointB: 26, PointC: 28, AngleMin: 160, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Keep your lifted leg straight.", FeedbackTR: "Kaldırdığınız bacağı düz tutun."},
			{Joint: "hip_split", PointA: 11, PointB: 23, PointC: 25, AngleMin: 30, AngleMax: 90, Weight: 0.35, RuleType: "target", FeedbackEN: "Fold forward and lift your leg higher.", FeedbackTR: "Öne katlayın ve bacağınızı daha yükseğe kaldırın."},
		},
	},

	{PoseID: "seated_forward_fold", NameEN: "Seated Forward Fold", NameTR: "Oturarak Öne Eğilme", Category: CategorySeated, Difficulty: 1, TargetArea: "hamstrings", InstructionsEN: "Sit with legs extended, flex feet. Hinge forward from hips reaching for feet or shins. Keep spine long, avoid rounding the back.", InstructionsTR: "Bacaklar uzatılmış oturun, ayakları esnetin. Kalçalardan öne eğilin, ayaklara veya baldırlara uzanın. Omurgayı uzun tutun, sırtı yuvarlaklaştırmayın.", Contraindications: []string{"herniated_disc"},
		LandmarkRules: []LandmarkRule{
			{Joint: "hip_fold", PointA: 11, PointB: 23, PointC: 25, AngleMin: 20, AngleMax: 80, Weight: 0.50, RuleType: "target", FeedbackEN: "Fold forward from your hips.", FeedbackTR: "Kalçalarınızdan öne katlayın."},
			{Joint: "legs_straight", PointA: 23, PointB: 25, PointC: 27, AngleMin: 160, AngleMax: 180, Weight: 0.50, RuleType: "target", FeedbackEN: "Keep your legs straight.", FeedbackTR: "Bacaklarınızı düz tutun."},
		},
	},
	{PoseID: "easy_seat", NameEN: "Easy Seat", NameTR: "Kolay Oturuş", Category: CategorySeated, Difficulty: 1, TargetArea: "hips", InstructionsEN: "Sit cross-legged with spine tall. Rest hands on knees, relax shoulders. Close eyes and breathe deeply into the belly.", InstructionsTR: "Bağdaş kurup omurga dik oturun. Elleri dizlere koyun, omuzları gevşetin. Gözleri kapatın ve karnınıza doğru derin nefes alın.", Contraindications: []string{},
		LandmarkRules: []LandmarkRule{
			{Joint: "spine_upright", PointA: 0, PointB: 11, PointC: 23, AngleMin: 160, AngleMax: 180, Weight: 0.50, RuleType: "target", FeedbackEN: "Sit tall with a straight spine.", FeedbackTR: "Omurganız dik olacak şekilde oturun."},
			{Joint: "shoulders_relaxed", PointA: 13, PointB: 11, PointC: 23, AngleMin: 0, AngleMax: 40, Weight: 0.50, RuleType: "target", FeedbackEN: "Relax your shoulders down.", FeedbackTR: "Omuzlarınızı aşağıya gevşetin."},
		},
	},
	{PoseID: "bound_angle", NameEN: "Bound Angle Pose", NameTR: "Bağlı Açı Duruşu", Category: CategorySeated, Difficulty: 1, TargetArea: "hips", InstructionsEN: "Sit with soles of feet together, knees out to sides. Hold feet and gently press knees toward floor. Sit tall and breathe.", InstructionsTR: "Ayak tabanları birleşik, dizler yanlara açık oturun. Ayakları tutun ve dizleri yere doğru hafifçe bastırın. Dik oturun ve nefes alın.", Contraindications: []string{"groin_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "spine_upright", PointA: 0, PointB: 11, PointC: 23, AngleMin: 160, AngleMax: 180, Weight: 0.50, RuleType: "target", FeedbackEN: "Sit tall with a straight spine.", FeedbackTR: "Dik oturun."},
			{Joint: "knees_open", PointA: 23, PointB: 25, PointC: 27, AngleMin: 30, AngleMax: 100, Weight: 0.50, RuleType: "target", FeedbackEN: "Let your knees fall open.", FeedbackTR: "Dizlerinizi yanlara açın."},
		},
	},
	{PoseID: "head_to_knee", NameEN: "Head-to-Knee Pose", NameTR: "Baş-Diz Duruşu", Category: CategorySeated, Difficulty: 2, TargetArea: "hamstrings", InstructionsEN: "Sit with one leg extended, other foot to inner thigh. Fold over extended leg reaching for foot. Keep spine long.", InstructionsTR: "Bir bacak uzatılmış, diğer ayak iç uyluğa dayalı oturun. Uzatılmış bacak üzerine katlayın ve ayağa uzanın. Omurgayı uzun tutun.", Contraindications: []string{"herniated_disc", "knee_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "extended_leg", PointA: 23, PointB: 25, PointC: 27, AngleMin: 155, AngleMax: 180, Weight: 0.40, RuleType: "target", FeedbackEN: "Keep your extended leg straight.", FeedbackTR: "Uzattığınız bacağı düz tutun."},
			{Joint: "forward_fold", PointA: 11, PointB: 23, PointC: 25, AngleMin: 20, AngleMax: 80, Weight: 0.60, RuleType: "target", FeedbackEN: "Fold over your extended leg.", FeedbackTR: "Uzattığınız bacağın üzerine katlayın."},
		},
	},
	{PoseID: "half_lord_of_fishes", NameEN: "Half Lord of the Fishes", NameTR: "Yarım Balıkların Efendisi", Category: CategorySeated, Difficulty: 2, TargetArea: "spine", InstructionsEN: "Sit with one leg crossed over the other. Twist torso toward the top knee, using opposite elbow for leverage. Lengthen spine with each inhale.", InstructionsTR: "Bir bacağı diğerinin üzerinden geçirerek oturun. Gövdeyi üst dize doğru döndürün, karşı dirseği kaldıraç olarak kullanın. Her nefeste omurgayı uzatın.", Contraindications: []string{"herniated_disc", "spinal_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "spine_upright", PointA: 0, PointB: 11, PointC: 23, AngleMin: 155, AngleMax: 180, Weight: 0.50, RuleType: "target", FeedbackEN: "Lengthen your spine with each inhale.", FeedbackTR: "Her nefeste omurganızı uzatın."},
			{Joint: "twist_depth", PointA: 15, PointB: 11, PointC: 12, AngleMin: 60, AngleMax: 120, Weight: 0.50, RuleType: "target", FeedbackEN: "Deepen your twist.", FeedbackTR: "Bükülmenizi derinleştirin."},
		},
	},
	{PoseID: "hero", NameEN: "Hero Pose", NameTR: "Kahraman Duruşu", Category: CategorySeated, Difficulty: 2, TargetArea: "quadriceps", InstructionsEN: "Kneel with knees together, sit between heels. Keep spine tall and hands on thighs. Use a block under seat if needed for comfort.", InstructionsTR: "Dizler bitişik diz çökün, topuklar arasına oturun. Omurgayı dik tutun, eller uyluklar üzerinde. Gerekirse oturağın altına blok koyun.", Contraindications: []string{"knee_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "spine_upright", PointA: 0, PointB: 11, PointC: 23, AngleMin: 160, AngleMax: 180, Weight: 0.50, RuleType: "target", FeedbackEN: "Sit tall.", FeedbackTR: "Dik oturun."},
			{Joint: "knees_together", PointA: 23, PointB: 25, PointC: 27, AngleMin: 20, AngleMax: 60, Weight: 0.50, RuleType: "target", FeedbackEN: "Keep your knees close together.", FeedbackTR: "Dizlerinizi bitişik tutun."},
		},
	},
	{PoseID: "cow_face", NameEN: "Cow Face Pose", NameTR: "İnek Yüzü Duruşu", Category: CategorySeated, Difficulty: 3, TargetArea: "shoulders", InstructionsEN: "Stack knees and sit between heels. Reach one arm overhead and the other behind your back, clasp fingers. Sit tall and open the chest.", InstructionsTR: "Dizleri üst üste getirin ve topuklar arasına oturun. Bir kolu yukarıdan, diğerini sırt arkasından uzatın ve parmakları kavuşturun. Dik oturun ve göğsü açın.", Contraindications: []string{"shoulder_injury", "knee_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "spine_upright", PointA: 0, PointB: 11, PointC: 23, AngleMin: 160, AngleMax: 180, Weight: 0.40, RuleType: "target", FeedbackEN: "Sit tall and open your chest.", FeedbackTR: "Dik oturun ve göğsünüzü açın."},
			{Joint: "top_arm", PointA: 13, PointB: 11, PointC: 23, AngleMin: 150, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Reach your top arm overhead.", FeedbackTR: "Üst kolunuzu yukarı uzatın."},
			{Joint: "bottom_arm", PointA: 14, PointB: 12, PointC: 24, AngleMin: 0, AngleMax: 45, Weight: 0.30, RuleType: "target", FeedbackEN: "Reach your bottom arm behind your back.", FeedbackTR: "Alt kolunuzu sırtınızın arkasına uzatın."},
		},
	},
	{PoseID: "pigeon", NameEN: "Pigeon Pose", NameTR: "Güvercin Duruşu", Category: CategorySeated, Difficulty: 3, TargetArea: "hips", InstructionsEN: "From Downward Dog, bring one knee forward behind wrist. Extend opposite leg back. Walk hands forward and lower torso over front shin.", InstructionsTR: "Aşağı Bakan Köpek'ten bir dizi bileğin arkasına getirin. Karşı bacağı geriye uzatın. Elleri öne yürütün ve gövdeyi ön baldır üzerine indirin.", Contraindications: []string{"knee_injury", "hip_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "front_knee", PointA: 23, PointB: 25, PointC: 27, AngleMin: 30, AngleMax: 90, Weight: 0.40, RuleType: "target", FeedbackEN: "Bend your front knee.", FeedbackTR: "Ön dizinizi bükün."},
			{Joint: "back_leg", PointA: 24, PointB: 26, PointC: 28, AngleMin: 155, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Extend your back leg straight.", FeedbackTR: "Arka bacağınızı düz uzatın."},
			{Joint: "torso_upright", PointA: 11, PointB: 23, PointC: 25, AngleMin: 140, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Lift your chest.", FeedbackTR: "Göğsünüzü kaldırın."},
		},
	},
	{PoseID: "fire_log", NameEN: "Fire Log Pose", NameTR: "Ateş Kütüğü Duruşu", Category: CategorySeated, Difficulty: 3, TargetArea: "hips", InstructionsEN: "Stack shins on top of each other with feet outside opposite knees. Sit tall and fold forward for a deeper stretch in hips.", InstructionsTR: "Baldırları üst üste koyun, ayaklar karşı dizlerin dışında. Dik oturun ve kalçalarda daha derin gerilme için öne katlayın.", Contraindications: []string{"knee_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "spine_upright", PointA: 0, PointB: 11, PointC: 23, AngleMin: 160, AngleMax: 180, Weight: 0.50, RuleType: "target", FeedbackEN: "Sit tall.", FeedbackTR: "Dik oturun."},
			{Joint: "hip_fold", PointA: 11, PointB: 23, PointC: 25, AngleMin: 60, AngleMax: 120, Weight: 0.50, RuleType: "target", FeedbackEN: "Fold forward for a deeper stretch.", FeedbackTR: "Daha derin gerilme için öne katlayın."},
		},
	},
	{PoseID: "lotus", NameEN: "Lotus Pose", NameTR: "Lotus Duruşu", Category: CategorySeated, Difficulty: 4, TargetArea: "hips", InstructionsEN: "Sit cross-legged and place each foot on the opposite thigh. Rest hands on knees in mudra. Keep spine tall and breathe deeply.", InstructionsTR: "Bağdaş kurup her ayağı karşı uyluğun üzerine yerleştirin. Elleri dizlerde mudra pozisyonunda tutun. Omurgayı dik tutun ve derin nefes alın.", Contraindications: []string{"knee_injury", "ankle_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "spine_upright", PointA: 0, PointB: 11, PointC: 23, AngleMin: 160, AngleMax: 180, Weight: 0.60, RuleType: "target", FeedbackEN: "Sit tall with a straight spine.", FeedbackTR: "Omurganız dik oturun."},
			{Joint: "shoulders_relaxed", PointA: 13, PointB: 11, PointC: 23, AngleMin: 0, AngleMax: 40, Weight: 0.40, RuleType: "target", FeedbackEN: "Relax your shoulders.", FeedbackTR: "Omuzlarınızı gevşetin."},
		},
	},
	{PoseID: "staff", NameEN: "Staff Pose", NameTR: "Asa Duruşu", Category: CategorySeated, Difficulty: 1, TargetArea: "core", InstructionsEN: "Sit with legs extended straight ahead, feet flexed. Place hands beside hips, press palms into floor. Sit tall, engaging core muscles.", InstructionsTR: "Bacaklar düz öne uzatılmış, ayaklar esnetilmiş oturun. Elleri kalçaların yanına koyun, avuçları yere basın. Dik oturun, karın kaslarını çalıştırın.", Contraindications: []string{},
		LandmarkRules: []LandmarkRule{
			{Joint: "spine_upright", PointA: 0, PointB: 11, PointC: 23, AngleMin: 160, AngleMax: 180, Weight: 0.40, RuleType: "target", FeedbackEN: "Sit tall.", FeedbackTR: "Dik oturun."},
			{Joint: "legs_straight", PointA: 23, PointB: 25, PointC: 27, AngleMin: 165, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Keep your legs straight.", FeedbackTR: "Bacaklarınızı düz tutun."},
			{Joint: "hip_angle", PointA: 11, PointB: 23, PointC: 25, AngleMin: 80, AngleMax: 100, Weight: 0.25, RuleType: "target", FeedbackEN: "Maintain a 90-degree angle at your hips.", FeedbackTR: "Kalçalarınızda 90 derecelik açıyı koruyun."},
		},
	},
	{PoseID: "cat_cow", NameEN: "Cat-Cow Stretch", NameTR: "Kedi-İnek Germe", Category: CategorySeated, Difficulty: 1, TargetArea: "spine", InstructionsEN: "Start on all fours. Inhale, drop belly and lift head (Cow). Exhale, round spine up and tuck chin (Cat). Alternate with breath.", InstructionsTR: "Dört ayak üstü başlayın. Nefes alın, karnı indirin ve başı kaldırın (İnek). Nefes verin, omurgayı yukarı yuvarlayın ve çeneyi içeri çekin (Kedi). Nefesle dönüşümlü tekrarlayın.", Contraindications: []string{},
		LandmarkRules: []LandmarkRule{
			{Joint: "arms_straight", PointA: 11, PointB: 13, PointC: 15, AngleMin: 160, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Keep your arms straight.", FeedbackTR: "Kollarınızı düz tutun."},
			{Joint: "back_arch", PointA: 11, PointB: 23, PointC: 25, AngleMin: 120, AngleMax: 170, Weight: 0.40, RuleType: "target", FeedbackEN: "Alternate between arching and rounding your back.", FeedbackTR: "Sırtınızı kavisleştirme ve yuvarlama arasında geçiş yapın."},
			{Joint: "knees_bent", PointA: 23, PointB: 25, PointC: 27, AngleMin: 80, AngleMax: 100, Weight: 0.30, RuleType: "target", FeedbackEN: "Keep your knees under your hips.", FeedbackTR: "Dizlerinizi kalçalarınızın altında tutun."},
		},
	},

	{PoseID: "cobra", NameEN: "Cobra Pose", NameTR: "Kobra Duruşu", Category: CategoryProne, Difficulty: 1, TargetArea: "back", InstructionsEN: "Lie face down, place hands under shoulders. Press up gently, lifting chest while keeping hips on the floor. Elbows slightly bent, shoulders down.", InstructionsTR: "Yüzüstü uzanın, elleri omuzların altına koyun. Karnı yerde tutarak göğsü yukarı kaldırın. Dirsekler hafif bükülü, omuzlar aşağıda.", Contraindications: []string{"herniated_disc", "pregnancy"},
		LandmarkRules: []LandmarkRule{
			{Joint: "arms_bent", PointA: 11, PointB: 13, PointC: 15, AngleMin: 90, AngleMax: 160, Weight: 0.30, RuleType: "target", FeedbackEN: "Keep a slight bend in your elbows.", FeedbackTR: "Dirseklerinizde hafif bir bükülme bırakın."},
			{Joint: "back_extension", PointA: 11, PointB: 23, PointC: 25, AngleMin: 120, AngleMax: 160, Weight: 0.40, RuleType: "target", FeedbackEN: "Lift your chest, arching your back gently.", FeedbackTR: "Göğsünüzü kaldırın, sırtınızı nazikçe kavisleştirin."},
			{Joint: "legs_straight", PointA: 23, PointB: 25, PointC: 27, AngleMin: 160, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Keep your legs straight behind you.", FeedbackTR: "Bacaklarınızı arkanızda düz tutun."},
		},
	},
	{PoseID: "upward_dog", NameEN: "Upward-Facing Dog", NameTR: "Yukarı Bakan Köpek", Category: CategoryProne, Difficulty: 2, TargetArea: "back", InstructionsEN: "From prone position, press hands into floor and straighten arms. Lift thighs and knees off the mat. Open chest, shoulders back and down.", InstructionsTR: "Yüzüstü pozisyondan elleri yere basın ve kolları düzeltin. Uyluk ve dizleri matın üzerinden kaldırın. Göğsü açın, omuzları geri ve aşağı çekin.", Contraindications: []string{"herniated_disc", "wrist_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "arms_straight", PointA: 11, PointB: 13, PointC: 15, AngleMin: 160, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Straighten your arms.", FeedbackTR: "Kollarınızı düzeltin."},
			{Joint: "chest_lift", PointA: 11, PointB: 23, PointC: 25, AngleMin: 130, AngleMax: 170, Weight: 0.35, RuleType: "target", FeedbackEN: "Lift your chest high.", FeedbackTR: "Göğsünüzü yükseğe kaldırın."},
			{Joint: "legs_engaged", PointA: 23, PointB: 25, PointC: 27, AngleMin: 160, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Keep your legs straight and lifted.", FeedbackTR: "Bacaklarınızı düz ve havada tutun."},
		},
	},
	{PoseID: "sphinx", NameEN: "Sphinx Pose", NameTR: "Sfenks Duruşu", Category: CategoryProne, Difficulty: 1, TargetArea: "back", InstructionsEN: "Lie face down, place forearms on floor with elbows under shoulders. Lift chest gently, keeping lower body relaxed. Hold and breathe deeply.", InstructionsTR: "Yüzüstü uzanın, ön kolları yere koyun, dirsekler omuzların altında. Göğsü hafifçe kaldırın, alt vücudu gevşek tutun. Tutun ve derin nefes alın.", Contraindications: []string{"herniated_disc"},
		LandmarkRules: []LandmarkRule{
			{Joint: "elbows_bent", PointA: 11, PointB: 13, PointC: 15, AngleMin: 70, AngleMax: 110, Weight: 0.40, RuleType: "target", FeedbackEN: "Keep your elbows under your shoulders.", FeedbackTR: "Dirseklerinizi omuzlarınızın altında tutun."},
			{Joint: "chest_lift", PointA: 11, PointB: 23, PointC: 25, AngleMin: 140, AngleMax: 170, Weight: 0.35, RuleType: "target", FeedbackEN: "Lift your chest gently.", FeedbackTR: "Göğsünüzü nazikçe kaldırın."},
			{Joint: "legs_relaxed", PointA: 23, PointB: 25, PointC: 27, AngleMin: 160, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Keep your legs relaxed on the floor.", FeedbackTR: "Bacaklarınızı yerde gevşek tutun."},
		},
	},
	{PoseID: "locust", NameEN: "Locust Pose", NameTR: "Çekirge Duruşu", Category: CategoryProne, Difficulty: 2, TargetArea: "back", InstructionsEN: "Lie face down, arms alongside body. Lift head, chest, arms, and legs off the floor simultaneously. Squeeze glutes and reach back through toes.", InstructionsTR: "Yüzüstü uzanın, kollar vücudun yanında. Baş, göğüs, kollar ve bacakları aynı anda yerden kaldırın. Kalçaları sıkın ve parmak uçlarından geriye uzanın.", Contraindications: []string{"herniated_disc", "pregnancy"},
		LandmarkRules: []LandmarkRule{
			{Joint: "chest_lift", PointA: 11, PointB: 23, PointC: 25, AngleMin: 150, AngleMax: 180, Weight: 0.40, RuleType: "target", FeedbackEN: "Lift your chest off the floor.", FeedbackTR: "Göğsünüzü yerden kaldırın."},
			{Joint: "legs_lift", PointA: 23, PointB: 25, PointC: 27, AngleMin: 160, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Lift your legs off the floor.", FeedbackTR: "Bacaklarınızı yerden kaldırın."},
			{Joint: "arms_back", PointA: 13, PointB: 11, PointC: 23, AngleMin: 0, AngleMax: 45, Weight: 0.30, RuleType: "target", FeedbackEN: "Reach your arms back.", FeedbackTR: "Kollarınızı geriye uzatın."},
		},
	},
	{PoseID: "bow", NameEN: "Bow Pose", NameTR: "Yay Duruşu", Category: CategoryProne, Difficulty: 3, TargetArea: "back", InstructionsEN: "Lie face down, bend knees and reach back to hold ankles. Kick feet into hands to lift chest and thighs. Open chest and look forward.", InstructionsTR: "Yüzüstü uzanın, dizleri bükün ve bilekleri tutmak için geriye uzanın. Ayakları ellere doğru iterek göğsü ve uylukları kaldırın. Göğsü açın ve öne bakın.", Contraindications: []string{"herniated_disc", "pregnancy", "low_back_pain"},
		LandmarkRules: []LandmarkRule{
			{Joint: "knees_bent", PointA: 23, PointB: 25, PointC: 27, AngleMin: 30, AngleMax: 80, Weight: 0.35, RuleType: "target", FeedbackEN: "Bend your knees and grab your ankles.", FeedbackTR: "Dizlerinizi bükün ve bileklerinizi tutun."},
			{Joint: "chest_lift", PointA: 11, PointB: 23, PointC: 25, AngleMin: 140, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Lift your chest and thighs off the floor.", FeedbackTR: "Göğsünüzü ve uyluklarınızı yerden kaldırın."},
			{Joint: "arms_back", PointA: 12, PointB: 14, PointC: 16, AngleMin: 140, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Reach back to hold your ankles.", FeedbackTR: "Bileklerinizi tutmak için geriye uzanın."},
		},
	},
	{PoseID: "plank", NameEN: "Plank Pose", NameTR: "Plank Duruşu", Category: CategoryProne, Difficulty: 2, TargetArea: "core", InstructionsEN: "Place hands under shoulders, extend legs back. Body forms a straight line from head to heels. Engage core, hold steady and breathe.", InstructionsTR: "Elleri omuzların altına koyun, bacakları geriye uzatın. Vücut baştan topuklara düz bir çizgi oluşturur. Karnı sıkın, sabit tutun ve nefes alın.", Contraindications: []string{"wrist_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "body_line", PointA: 11, PointB: 23, PointC: 27, AngleMin: 165, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Keep your body in a straight line.", FeedbackTR: "Vücudunuzu düz bir çizgide tutun."},
			{Joint: "arms_straight", PointA: 12, PointB: 14, PointC: 16, AngleMin: 160, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Keep your arms straight.", FeedbackTR: "Kollarınızı düz tutun."},
			{Joint: "core_engage", PointA: 12, PointB: 24, PointC: 26, AngleMin: 165, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Engage your core, keep hips aligned.", FeedbackTR: "Karnınızı sıkın, kalçanızı hizada tutun."},
			{Joint: "hip_drop", PointA: 11, PointB: 23, PointC: 25, AngleMin: 120, AngleMax: 155, Weight: 0.20, RuleType: "fault", FeedbackEN: "Your hips are dropping, lift them up.", FeedbackTR: "Kalçanız düşüyor, yukarı kaldırın."},
			{Joint: "hip_pike", PointA: 11, PointB: 23, PointC: 25, AngleMin: 190, AngleMax: 220, Weight: 0.15, RuleType: "fault", FeedbackEN: "Your hips are too high, lower them.", FeedbackTR: "Kalçanız çok yukarıda, aşağı indirin."},
			{Joint: "head_drop", PointA: 0, PointB: 11, PointC: 23, AngleMin: 0, AngleMax: 130, Weight: 0.15, RuleType: "fault", FeedbackEN: "Don't drop your head, keep it aligned with spine.", FeedbackTR: "Kafanızı öne eğmeyin, omurga hizasında tutun."},
		},
	},
	{PoseID: "side_plank", NameEN: "Side Plank", NameTR: "Yan Plank", Category: CategoryProne, Difficulty: 3, TargetArea: "core", InstructionsEN: "From Plank, shift weight to one hand and stack feet. Raise opposite arm to ceiling. Keep body in a straight line, engage obliques.", InstructionsTR: "Plank'tan ağırlığı bir ele kaydırın ve ayakları üst üste koyun. Karşı kolu tavana kaldırın. Vücudu düz çizgide tutun, yan karın kaslarını çalıştırın.", Contraindications: []string{"wrist_injury", "shoulder_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "body_line", PointA: 11, PointB: 23, PointC: 27, AngleMin: 165, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Keep your body in a straight line.", FeedbackTR: "Vücudunuzu düz bir çizgide tutun."},
			{Joint: "support_arm", PointA: 11, PointB: 13, PointC: 15, AngleMin: 160, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Keep your support arm straight.", FeedbackTR: "Destek kolunuzu düz tutun."},
			{Joint: "top_arm", PointA: 14, PointB: 12, PointC: 24, AngleMin: 150, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Raise your top arm to the ceiling.", FeedbackTR: "Üst kolunuzu tavana kaldırın."},
		},
	},
	{PoseID: "forearm_plank", NameEN: "Forearm Plank", NameTR: "Ön Kol Plank", Category: CategoryProne, Difficulty: 2, TargetArea: "core", InstructionsEN: "Place forearms on floor, elbows under shoulders. Extend legs back, body in a straight line. Hold position, engaging core throughout.", InstructionsTR: "Ön kolları yere koyun, dirsekler omuzların altında. Bacakları geriye uzatın, vücut düz çizgide. Pozisyonu tutun, karnı sürekli sıkın.", Contraindications: []string{},
		LandmarkRules: []LandmarkRule{
			{Joint: "body_line", PointA: 11, PointB: 23, PointC: 27, AngleMin: 165, AngleMax: 180, Weight: 0.40, RuleType: "target", FeedbackEN: "Keep your body in a straight line.", FeedbackTR: "Vücudunuzu düz bir çizgide tutun."},
			{Joint: "elbows_bent", PointA: 11, PointB: 13, PointC: 15, AngleMin: 70, AngleMax: 110, Weight: 0.30, RuleType: "target", FeedbackEN: "Keep elbows under shoulders.", FeedbackTR: "Dirseklerinizi omuzlarınızın altında tutun."},
			{Joint: "hips_aligned", PointA: 12, PointB: 24, PointC: 26, AngleMin: 165, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Don't let your hips drop or pike.", FeedbackTR: "Kalçanızın düşmesine veya yükselmesine izin vermeyin."},
			{Joint: "hip_drop", PointA: 11, PointB: 23, PointC: 25, AngleMin: 120, AngleMax: 155, Weight: 0.15, RuleType: "fault", FeedbackEN: "Your hips are dropping.", FeedbackTR: "Kalçanız düşüyor."},
		},
	},
	{PoseID: "downward_dog", NameEN: "Downward-Facing Dog", NameTR: "Aşağı Bakan Köpek", Category: CategoryProne, Difficulty: 2, TargetArea: "full_body", InstructionsEN: "From all fours, lift hips up and back forming an inverted V. Press hands into mat, straighten legs and relax head between arms.", InstructionsTR: "Dört ayak üstünden kalçaları yukarı ve geriye kaldırarak ters V oluşturun. Elleri mata basın, bacakları düzeltin ve başı kollar arasında gevşetin.", Contraindications: []string{"wrist_injury", "high_blood_pressure"},
		LandmarkRules: []LandmarkRule{
			{Joint: "shoulder_flexion", PointA: 13, PointB: 11, PointC: 23, AngleMin: 150, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Push your chest towards your thighs.", FeedbackTR: "Göğsünüzü uyluklarınıza doğru itin."},
			{Joint: "hip_angle", PointA: 11, PointB: 23, PointC: 25, AngleMin: 60, AngleMax: 100, Weight: 0.40, RuleType: "target", FeedbackEN: "Create a sharp inverted V shape with your hips.", FeedbackTR: "Kalçalarınızla keskin bir ters V şekli oluşturun."},
			{Joint: "legs_straight", PointA: 23, PointB: 25, PointC: 27, AngleMin: 150, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Try to keep your legs straight.", FeedbackTR: "Bacaklarınızı düz tutmaya çalışın."},
		},
	},
	{PoseID: "child", NameEN: "Child's Pose", NameTR: "Çocuk Duruşu", Category: CategoryProne, Difficulty: 1, TargetArea: "back", InstructionsEN: "Kneel, sit back on heels, fold forward with arms extended or alongside body. Rest forehead on mat. Breathe deeply and release tension.", InstructionsTR: "Diz çökün, topuklara oturun, kollar uzatılmış veya vücudun yanında öne katlayın. Alnı mata koyun. Derin nefes alın ve gerginliği bırakın.", Contraindications: []string{"knee_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "knees_bent", PointA: 23, PointB: 25, PointC: 27, AngleMin: 20, AngleMax: 60, Weight: 0.40, RuleType: "target", FeedbackEN: "Sit back on your heels.", FeedbackTR: "Topuklarınıza oturun."},
			{Joint: "forward_fold", PointA: 11, PointB: 23, PointC: 25, AngleMin: 20, AngleMax: 70, Weight: 0.35, RuleType: "target", FeedbackEN: "Fold forward and rest your forehead on the mat.", FeedbackTR: "Öne katlayın ve alnınızı matın üzerine koyun."},
			{Joint: "arms_extended", PointA: 13, PointB: 11, PointC: 23, AngleMin: 120, AngleMax: 180, Weight: 0.25, RuleType: "target", FeedbackEN: "Extend your arms forward.", FeedbackTR: "Kollarınızı öne uzatın."},
		},
	},
	{PoseID: "swimming", NameEN: "Swimming Pose", NameTR: "Yüzme Duruşu", Category: CategoryProne, Difficulty: 2, TargetArea: "back", InstructionsEN: "Lie face down, extend arms forward. Lift opposite arm and leg simultaneously, alternating sides. Keep core engaged throughout the movement.", InstructionsTR: "Yüzüstü uzanın, kolları öne uzatın. Karşılıklı kol ve bacağı aynı anda kaldırarak yer değiştirin. Hareket boyunca karnı sıkı tutun.", Contraindications: []string{"low_back_pain"},
		LandmarkRules: []LandmarkRule{
			{Joint: "arms_extended", PointA: 13, PointB: 11, PointC: 23, AngleMin: 140, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Extend your arms forward.", FeedbackTR: "Kollarınızı öne uzatın."},
			{Joint: "legs_straight", PointA: 23, PointB: 25, PointC: 27, AngleMin: 160, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Keep your legs straight.", FeedbackTR: "Bacaklarınızı düz tutun."},
			{Joint: "chest_lift", PointA: 11, PointB: 23, PointC: 25, AngleMin: 155, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Lift your chest slightly.", FeedbackTR: "Göğsünüzü hafifçe kaldırın."},
		},
	},

	{PoseID: "bridge", NameEN: "Bridge Pose", NameTR: "Köprü Duruşu", Category: CategorySupine, Difficulty: 1, TargetArea: "glutes", InstructionsEN: "Lie on back, bend knees with feet flat. Lift hips toward ceiling, clasp hands under back. Press feet and shoulders into mat.", InstructionsTR: "Sırt üstü uzanın, dizleri bükün, ayaklar yerde. Kalçaları tavana doğru kaldırın, elleri sırtın altında kavuşturun. Ayakları ve omuzları mata basın.", Contraindications: []string{"neck_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "knees_bent", PointA: 23, PointB: 25, PointC: 27, AngleMin: 60, AngleMax: 110, Weight: 0.30, RuleType: "target", FeedbackEN: "Keep your knees bent over your ankles.", FeedbackTR: "Dizlerinizi ayak bileklerinizin hizasında bükük tutun."},
			{Joint: "hips_lifted", PointA: 11, PointB: 23, PointC: 25, AngleMin: 140, AngleMax: 180, Weight: 0.50, RuleType: "target", FeedbackEN: "Lift your hips high.", FeedbackTR: "Kalçalarınızı yükseğe kaldırın."},
			{Joint: "arms_down", PointA: 13, PointB: 11, PointC: 23, AngleMin: 0, AngleMax: 45, Weight: 0.20, RuleType: "target", FeedbackEN: "Keep your arms flat on the mat.", FeedbackTR: "Kollarınızı matın üzerinde düz tutun."},
		},
	},
	{PoseID: "supine_twist", NameEN: "Supine Spinal Twist", NameTR: "Sırtüstü Omurga Bükümü", Category: CategorySupine, Difficulty: 1, TargetArea: "spine", InstructionsEN: "Lie on back, draw one knee to chest. Guide knee across body to opposite side, extend arm out. Look opposite direction and relax.", InstructionsTR: "Sırt üstü uzanın, bir dizi göğse çekin. Dizi karşı tarafa doğru yönlendirin, kolu yana uzatın. Ters yöne bakın ve gevşeyin.", Contraindications: []string{"herniated_disc"},
		LandmarkRules: []LandmarkRule{
			{Joint: "knee_across", PointA: 23, PointB: 25, PointC: 27, AngleMin: 60, AngleMax: 110, Weight: 0.50, RuleType: "target", FeedbackEN: "Guide your knee across your body.", FeedbackTR: "Dizinizi vücudunuzun karşı tarafına yönlendirin."},
			{Joint: "arm_extended", PointA: 13, PointB: 11, PointC: 23, AngleMin: 70, AngleMax: 110, Weight: 0.50, RuleType: "target", FeedbackEN: "Extend your arm out to the side.", FeedbackTR: "Kolunuzu yana uzatın."},
		},
	},
	{PoseID: "happy_baby", NameEN: "Happy Baby Pose", NameTR: "Mutlu Bebek Duruşu", Category: CategorySupine, Difficulty: 1, TargetArea: "hips", InstructionsEN: "Lie on back, grab outsides of feet with knees bent. Pull knees toward armpits gently. Rock side to side to massage spine.", InstructionsTR: "Sırt üstü uzanın, dizler bükülü halde ayakların dışını tutun. Dizleri koltuk altlarına doğru çekin. Omurgayı masaj etmek için yana sallanın.", Contraindications: []string{"neck_injury", "pregnancy"},
		LandmarkRules: []LandmarkRule{
			{Joint: "knees_bent", PointA: 23, PointB: 25, PointC: 27, AngleMin: 30, AngleMax: 80, Weight: 0.50, RuleType: "target", FeedbackEN: "Pull your knees toward your armpits.", FeedbackTR: "Dizlerinizi koltuk altlarınıza doğru çekin."},
			{Joint: "hips_open", PointA: 11, PointB: 23, PointC: 25, AngleMin: 30, AngleMax: 80, Weight: 0.50, RuleType: "target", FeedbackEN: "Open your hips.", FeedbackTR: "Kalçalarınızı açın."},
		},
	},
	{PoseID: "legs_up_wall", NameEN: "Legs Up the Wall", NameTR: "Duvarda Bacaklar", Category: CategorySupine, Difficulty: 1, TargetArea: "legs", InstructionsEN: "Sit next to a wall, swing legs up as you lie back. Rest legs vertically against the wall. Arms at sides, close eyes and breathe.", InstructionsTR: "Duvarın yanında oturun, sırt üstü uzanırken bacakları yukarı kaldırın. Bacakları duvara dikey dayayın. Kollar yanlarda, gözleri kapatın ve nefes alın.", Contraindications: []string{"high_blood_pressure"},
		LandmarkRules: []LandmarkRule{
			{Joint: "legs_vertical", PointA: 23, PointB: 25, PointC: 27, AngleMin: 160, AngleMax: 180, Weight: 0.50, RuleType: "target", FeedbackEN: "Keep your legs straight up.", FeedbackTR: "Bacaklarınızı düz yukarı tutun."},
			{Joint: "hips_angle", PointA: 11, PointB: 23, PointC: 25, AngleMin: 75, AngleMax: 105, Weight: 0.50, RuleType: "target", FeedbackEN: "Keep your hips at 90 degrees.", FeedbackTR: "Kalçalarınızı 90 derecede tutun."},
		},
	},
	{PoseID: "reclined_bound_angle", NameEN: "Reclined Bound Angle", NameTR: "Sırtüstü Bağlı Açı", Category: CategorySupine, Difficulty: 1, TargetArea: "hips", InstructionsEN: "Lie on back, bring soles of feet together and let knees fall open. Arms resting at sides or on belly. Breathe deeply and surrender.", InstructionsTR: "Sırt üstü uzanın, ayak tabanlarını birleştirip dizleri yana açın. Kollar yanlarda veya karnın üzerinde. Derin nefes alın ve teslim olun.", Contraindications: []string{"groin_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "knees_open", PointA: 23, PointB: 25, PointC: 27, AngleMin: 30, AngleMax: 100, Weight: 0.50, RuleType: "target", FeedbackEN: "Let your knees fall open.", FeedbackTR: "Dizlerinizi yanlara bırakın."},
			{Joint: "arms_relaxed", PointA: 13, PointB: 11, PointC: 23, AngleMin: 20, AngleMax: 70, Weight: 0.50, RuleType: "target", FeedbackEN: "Rest your arms at your sides.", FeedbackTR: "Kollarınızı yanlarınızda dinlendirin."},
		},
	},
	{PoseID: "wind_relieving", NameEN: "Wind Relieving Pose", NameTR: "Gaz Giderici Duruş", Category: CategorySupine, Difficulty: 1, TargetArea: "core", InstructionsEN: "Lie on back, hug one or both knees to chest. Rock gently side to side. Keep shoulders and head on the mat.", InstructionsTR: "Sırt üstü uzanın, bir veya iki dizi göğse sarın. Yanlara hafifçe sallanın. Omuzları ve başı matta tutun.", Contraindications: []string{},
		LandmarkRules: []LandmarkRule{
			{Joint: "knees_to_chest", PointA: 11, PointB: 23, PointC: 25, AngleMin: 20, AngleMax: 60, Weight: 0.60, RuleType: "target", FeedbackEN: "Hug your knees to your chest.", FeedbackTR: "Dizlerinizi göğsünüze sarın."},
			{Joint: "knees_bent", PointA: 23, PointB: 25, PointC: 27, AngleMin: 20, AngleMax: 60, Weight: 0.40, RuleType: "target", FeedbackEN: "Bend your knees tightly.", FeedbackTR: "Dizlerinizi sıkıca bükün."},
		},
	},
	{PoseID: "corpse", NameEN: "Corpse Pose", NameTR: "Ölü Duruşu (Savasana)", Category: CategorySupine, Difficulty: 1, TargetArea: "full_body", InstructionsEN: "Lie flat on back, legs slightly apart, arms at sides with palms up. Close eyes, relax entire body. Focus only on breathing.", InstructionsTR: "Sırt üstü düz uzanın, bacaklar hafif ayrık, kollar yanlarda avuçlar yukarı. Gözleri kapatın, tüm vücudu gevşetin. Sadece nefese odaklanın.", Contraindications: []string{},
		LandmarkRules: []LandmarkRule{
			{Joint: "legs_straight", PointA: 23, PointB: 25, PointC: 27, AngleMin: 165, AngleMax: 180, Weight: 0.40, RuleType: "target", FeedbackEN: "Keep your legs straight and relaxed.", FeedbackTR: "Bacaklarınızı düz ve gevşek tutun."},
			{Joint: "arms_relaxed", PointA: 13, PointB: 11, PointC: 23, AngleMin: 10, AngleMax: 50, Weight: 0.30, RuleType: "target", FeedbackEN: "Rest your arms at your sides.", FeedbackTR: "Kollarınızı yanlarınızda bırakın."},
			{Joint: "body_flat", PointA: 11, PointB: 23, PointC: 25, AngleMin: 165, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Lie completely flat.", FeedbackTR: "Tamamen düz uzanın."},
		},
	},
	{PoseID: "fish", NameEN: "Fish Pose", NameTR: "Balık Duruşu", Category: CategorySupine, Difficulty: 2, TargetArea: "chest", InstructionsEN: "Lie on back, slide hands under hips. Press forearms into floor and lift chest, arching upper back. Top of head may lightly touch floor.", InstructionsTR: "Sırt üstü uzanın, elleri kalçaların altına kaydırın. Ön kolları yere basın ve göğsü kaldırın, üst sırtı kavislendirin. Başın üstü yere hafifçe değebilir.", Contraindications: []string{"neck_injury", "low_back_pain"},
		LandmarkRules: []LandmarkRule{
			{Joint: "chest_arch", PointA: 11, PointB: 23, PointC: 25, AngleMin: 140, AngleMax: 170, Weight: 0.40, RuleType: "target", FeedbackEN: "Arch your upper back and lift your chest.", FeedbackTR: "Üst sırtınızı kavisleştirin ve göğsünüzü kaldırın."},
			{Joint: "legs_straight", PointA: 23, PointB: 25, PointC: 27, AngleMin: 165, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Keep your legs straight.", FeedbackTR: "Bacaklarınızı düz tutun."},
			{Joint: "arms_support", PointA: 13, PointB: 11, PointC: 23, AngleMin: 0, AngleMax: 30, Weight: 0.30, RuleType: "target", FeedbackEN: "Press your forearms into the floor.", FeedbackTR: "Ön kollarınızı yere basın."},
		},
	},
	{PoseID: "wheel", NameEN: "Wheel Pose", NameTR: "Tekerlek Duruşu", Category: CategorySupine, Difficulty: 5, TargetArea: "back", InstructionsEN: "Lie on back, place hands by ears, fingertips toward shoulders. Press up, straightening arms and lifting entire body into a backbend.", InstructionsTR: "Sırt üstü uzanın, elleri kulakların yanına koyun, parmak uçları omuzlara doğru. Yukarı itin, kolları düzeltin ve tüm vücudu arka eğime kaldırın.", Contraindications: []string{"wrist_injury", "shoulder_injury", "neck_injury", "herniated_disc"},
		LandmarkRules: []LandmarkRule{
			{Joint: "arms_straight", PointA: 11, PointB: 13, PointC: 15, AngleMin: 160, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Straighten your arms.", FeedbackTR: "Kollarınızı düzeltin."},
			{Joint: "hips_up", PointA: 11, PointB: 23, PointC: 25, AngleMin: 140, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Push your hips high.", FeedbackTR: "Kalçalarınızı yükseğe itin."},
			{Joint: "legs_bent", PointA: 23, PointB: 25, PointC: 27, AngleMin: 70, AngleMax: 110, Weight: 0.35, RuleType: "target", FeedbackEN: "Keep your feet flat, knees over ankles.", FeedbackTR: "Ayaklarınız yerde, dizler bileklerin üstünde."},
		},
	},
	{PoseID: "reclined_hand_to_toe", NameEN: "Reclined Hand-to-Big-Toe", NameTR: "Sırtüstü El-Ayak Parmağı", Category: CategorySupine, Difficulty: 2, TargetArea: "hamstrings", InstructionsEN: "Lie on back, extend one leg up and hold big toe or use a strap. Keep other leg extended on floor. Straighten raised leg without forcing.", InstructionsTR: "Sırt üstü uzanın, bir bacağı yukarı uzatıp ayak parmağını tutun veya kayış kullanın. Diğer bacak yerde uzanır. Kaldırılan bacağı zorlamadan düzeltin.", Contraindications: []string{},
		LandmarkRules: []LandmarkRule{
			{Joint: "raised_leg", PointA: 23, PointB: 25, PointC: 27, AngleMin: 155, AngleMax: 180, Weight: 0.40, RuleType: "target", FeedbackEN: "Straighten your raised leg.", FeedbackTR: "Kaldırdığınız bacağı düzeltin."},
			{Joint: "hip_angle", PointA: 11, PointB: 23, PointC: 25, AngleMin: 60, AngleMax: 100, Weight: 0.30, RuleType: "target", FeedbackEN: "Bring your leg toward your body.", FeedbackTR: "Bacağınızı vücudunuza doğru çekin."},
			{Joint: "bottom_leg", PointA: 24, PointB: 26, PointC: 28, AngleMin: 165, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Keep your other leg flat on the floor.", FeedbackTR: "Diğer bacağınızı yerde düz tutun."},
		},
	},

	{PoseID: "headstand", NameEN: "Headstand", NameTR: "Baş Üstü Duruş", Category: CategoryInversion, Difficulty: 5, TargetArea: "core", InstructionsEN: "Interlace fingers and place forearms on floor. Set crown of head on mat, cradled by hands. Walk feet in and lift legs overhead. Engage core strongly.", InstructionsTR: "Parmakları kenetleyin ve ön kolları yere koyun. Başın tepesini ellerin içine alarak mata koyun. Ayakları yaklaştırın ve bacakları yukarı kaldırın. Karnı güçlü sıkın.", Contraindications: []string{"neck_injury", "high_blood_pressure", "pregnancy", "glaucoma"},
		LandmarkRules: []LandmarkRule{
			{Joint: "legs_straight_up", PointA: 23, PointB: 25, PointC: 27, AngleMin: 165, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Keep your legs straight overhead.", FeedbackTR: "Bacaklarınızı düz yukarı tutun."},
			{Joint: "body_vertical", PointA: 11, PointB: 23, PointC: 25, AngleMin: 165, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Keep your body vertical.", FeedbackTR: "Vücudunuzu dikey tutun."},
			{Joint: "arms_support", PointA: 11, PointB: 13, PointC: 15, AngleMin: 60, AngleMax: 110, Weight: 0.30, RuleType: "target", FeedbackEN: "Keep your forearms firm on the floor.", FeedbackTR: "Ön kollarınızı yere sıkıca basın."},
		},
	},
	{PoseID: "shoulderstand", NameEN: "Shoulderstand", NameTR: "Omuz Üstü Duruş", Category: CategoryInversion, Difficulty: 4, TargetArea: "core", InstructionsEN: "From lying on back, lift legs and hips overhead, supporting lower back with hands. Extend legs straight up, body weight on shoulders and upper arms.", InstructionsTR: "Sırt üstü yatarken bacakları ve kalçaları yukarı kaldırın, alt sırtı ellerle destekleyin. Bacakları düz yukarı uzatın, vücut ağırlığı omuzlar ve üst kollarda.", Contraindications: []string{"neck_injury", "high_blood_pressure", "pregnancy"},
		LandmarkRules: []LandmarkRule{
			{Joint: "legs_vertical", PointA: 23, PointB: 25, PointC: 27, AngleMin: 165, AngleMax: 180, Weight: 0.40, RuleType: "target", FeedbackEN: "Extend your legs straight up.", FeedbackTR: "Bacaklarınızı düz yukarı uzatın."},
			{Joint: "body_vertical", PointA: 11, PointB: 23, PointC: 25, AngleMin: 165, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Keep your body vertical.", FeedbackTR: "Vücudunuzu dikey tutun."},
			{Joint: "elbows_support", PointA: 11, PointB: 13, PointC: 15, AngleMin: 30, AngleMax: 80, Weight: 0.25, RuleType: "target", FeedbackEN: "Support your back with your hands.", FeedbackTR: "Sırtınızı ellerinizle destekleyin."},
		},
	},
	{PoseID: "plow", NameEN: "Plow Pose", NameTR: "Saban Duruşu", Category: CategoryInversion, Difficulty: 4, TargetArea: "spine", InstructionsEN: "From Shoulderstand, lower feet toward floor behind head. Keep legs straight and support back with hands if needed. Breathe steadily.", InstructionsTR: "Omuz Üstü Duruş'tan ayakları başın arkasına doğru yere indirin. Bacakları düz tutun ve gerekirse sırtı ellerle destekleyin. Düzenli nefes alın.", Contraindications: []string{"neck_injury", "herniated_disc", "high_blood_pressure"},
		LandmarkRules: []LandmarkRule{
			{Joint: "legs_over", PointA: 11, PointB: 23, PointC: 25, AngleMin: 20, AngleMax: 60, Weight: 0.40, RuleType: "target", FeedbackEN: "Lower your feet toward the floor behind your head.", FeedbackTR: "Ayaklarınızı başınızın arkasına doğru indirin."},
			{Joint: "legs_straight", PointA: 23, PointB: 25, PointC: 27, AngleMin: 160, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Keep your legs straight.", FeedbackTR: "Bacaklarınızı düz tutun."},
			{Joint: "arms_support", PointA: 13, PointB: 11, PointC: 23, AngleMin: 0, AngleMax: 45, Weight: 0.25, RuleType: "target", FeedbackEN: "Press your arms into the floor for support.", FeedbackTR: "Destek için kollarınızı yere basın."},
		},
	},
	{PoseID: "forearm_stand", NameEN: "Forearm Stand", NameTR: "Ön Kol Duruşu", Category: CategoryInversion, Difficulty: 5, TargetArea: "shoulders", InstructionsEN: "Place forearms on floor shoulder-width apart. Kick one leg up and bring the other to meet it overhead. Engage core and press forearms firmly down.", InstructionsTR: "Ön kolları omuz genişliğinde yere koyun. Bir bacağı yukarı tekmeleyip diğerini başın üzerinde birleştirin. Karnı sıkın ve ön kolları yere sıkıca basın.", Contraindications: []string{"shoulder_injury", "neck_injury", "high_blood_pressure"},
		LandmarkRules: []LandmarkRule{
			{Joint: "body_vertical", PointA: 11, PointB: 23, PointC: 25, AngleMin: 165, AngleMax: 180, Weight: 0.35, RuleType: "target", FeedbackEN: "Keep your body vertical.", FeedbackTR: "Vücudunuzu dikey tutun."},
			{Joint: "legs_straight", PointA: 23, PointB: 25, PointC: 27, AngleMin: 165, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Keep your legs straight overhead.", FeedbackTR: "Bacaklarınızı düz yukarıda tutun."},
			{Joint: "forearms_down", PointA: 11, PointB: 13, PointC: 15, AngleMin: 70, AngleMax: 110, Weight: 0.35, RuleType: "target", FeedbackEN: "Press your forearms firmly into the floor.", FeedbackTR: "Ön kollarınızı yere sıkıca basın."},
		},
	},
	{PoseID: "dolphin", NameEN: "Dolphin Pose", NameTR: "Yunus Duruşu", Category: CategoryInversion, Difficulty: 3, TargetArea: "shoulders", InstructionsEN: "From all fours, place forearms on floor. Lift hips up and back like Downward Dog but on forearms. Walk feet closer and press chest toward thighs.", InstructionsTR: "Dört ayak üstünden ön kolları yere koyun. Kalçaları Aşağı Bakan Köpek gibi yukarı ve geriye kaldırın ama ön kollar üzerinde. Ayakları yaklaştırın ve göğsü uyluklara doğru bastırın.", Contraindications: []string{"shoulder_injury"},
		LandmarkRules: []LandmarkRule{
			{Joint: "hip_angle", PointA: 11, PointB: 23, PointC: 25, AngleMin: 60, AngleMax: 100, Weight: 0.35, RuleType: "target", FeedbackEN: "Push your hips up and back.", FeedbackTR: "Kalçalarınızı yukarı ve geriye itin."},
			{Joint: "forearms_down", PointA: 11, PointB: 13, PointC: 15, AngleMin: 70, AngleMax: 110, Weight: 0.35, RuleType: "target", FeedbackEN: "Keep forearms on the floor.", FeedbackTR: "Ön kollarınızı yerde tutun."},
			{Joint: "legs_straight", PointA: 23, PointB: 25, PointC: 27, AngleMin: 155, AngleMax: 180, Weight: 0.30, RuleType: "target", FeedbackEN: "Try to straighten your legs.", FeedbackTR: "Bacaklarınızı düzeltmeye çalışın."},
		},
	},

	{
		PoseID:            "face_jaw_open",
		NameEN:            "Jaw Open & Close",
		NameTR:            "Ağız Açma Kapama",
		Category:          CategoryFace,
		Difficulty:        1,
		TargetArea:        "face",
		InstructionsEN:    "Open your mouth wide, hold for a moment, then close. Repeat slowly and controlled.",
		InstructionsTR:    "Ağzınızı sonuna kadar açın, bir an bekleyin, sonra kapatın. Yavaş ve kontrollü tekrarlayın.",
		Contraindications: []string{},
		LandmarkRules:     []LandmarkRule{},
		IsAnalyzable:      true,
		AnalysisKind:      "face",
		MetricType:        "reps",
		RepTarget:         10,
	},

	{
		PoseID:            "face_brow_raise",
		NameEN:            "Eyebrow Raise",
		NameTR:            "Kaş Kaldırma",
		Category:          CategoryFace,
		Difficulty:        1,
		TargetArea:        "face",
		InstructionsEN:    "Raise both eyebrows as high as possible, hold briefly, then relax. Repeat slowly.",
		InstructionsTR:    "İki kaşınızı da olabildiğince yukarı kaldırın, kısa süre tutun, sonra gevşetin. Yavaşça tekrarlayın.",
		Contraindications: []string{},
		LandmarkRules:     []LandmarkRule{},
		IsAnalyzable:      true,
		AnalysisKind:      "face",
		MetricType:        "reps",
		RepTarget:         10,
	},

	{
		PoseID:            "face_wide_smile",
		NameEN:            "Wide Smile",
		NameTR:            "Geniş Gülümseme",
		Category:          CategoryFace,
		Difficulty:        1,
		TargetArea:        "face",
		InstructionsEN:    "Smile as wide as you can, showing your teeth. Hold for a moment, then relax your face completely. Repeat.",
		InstructionsTR:    "Dişlerinizi gösterecek şekilde olabildiğince geniş gülümseyin. Bir an tutun, sonra yüzünüzü tamamen gevşetin. Tekrarlayın.",
		Contraindications: []string{},
		LandmarkRules:     []LandmarkRule{},
		IsAnalyzable:      true,
		AnalysisKind:      "face",
		MetricType:        "reps",
		RepTarget:         12,
	},

	{
		PoseID:            "face_lip_pucker",
		NameEN:            "Lip Pucker",
		NameTR:            "Dudak Büzme",
		Category:          CategoryFace,
		Difficulty:        1,
		TargetArea:        "face",
		InstructionsEN:    "Pucker your lips as if you are about to kiss. Hold briefly, then relax. Repeat slowly.",
		InstructionsTR:    "Dudaklarınızı öpücük verir gibi büzün. Kısa süre tutun, sonra gevşetin. Yavaşça tekrarlayın.",
		Contraindications: []string{},
		LandmarkRules:     []LandmarkRule{},
		IsAnalyzable:      true,
		AnalysisKind:      "face",
		MetricType:        "reps",
		RepTarget:         12,
	},

	{
		PoseID:            "face_eye_wide",
		NameEN:            "Eye Wide Open",
		NameTR:            "Gözleri Büyük Açma",
		Category:          CategoryFace,
		Difficulty:        1,
		TargetArea:        "face",
		InstructionsEN:    "Open your eyes as wide as possible, as if you are surprised. Hold, then relax. Repeat.",
		InstructionsTR:    "Gözlerinizi şaşırmış gibi olabildiğince büyük açın. Tutun, sonra gevşetin. Tekrarlayın.",
		Contraindications: []string{},
		LandmarkRules:     []LandmarkRule{},
		IsAnalyzable:      true,
		AnalysisKind:      "face",
		MetricType:        "reps",
		RepTarget:         10,
	},

	{
		PoseID:            "face_eye_squeeze",
		NameEN:            "Eye Squeeze",
		NameTR:            "Gözleri Sıkma",
		Category:          CategoryFace,
		Difficulty:        1,
		TargetArea:        "face",
		InstructionsEN:    "Squeeze both eyes shut tightly, hold for a moment, then open wide. Repeat.",
		InstructionsTR:    "İki gözünüzü de sıkıca kapatın, bir an tutun, sonra büyük açın. Tekrarlayın.",
		Contraindications: []string{},
		LandmarkRules:     []LandmarkRule{},
		IsAnalyzable:      true,
		AnalysisKind:      "face",
		MetricType:        "reps",
		RepTarget:         10,
	},

	{
		PoseID:            "face_mouth_o",
		NameEN:            "Mouth O Shape",
		NameTR:            "O Ağzı",
		Category:          CategoryFace,
		Difficulty:        2,
		TargetArea:        "face",
		InstructionsEN:    "Form a round O shape with your mouth, as if saying 'Oh'. Hold, then relax. Repeat.",
		InstructionsTR:    "Ağzınızla yuvarlak bir O şekli yapın, sanki 'Oh' der gibi. Tutun, sonra gevşetin. Tekrarlayın.",
		Contraindications: []string{},
		LandmarkRules:     []LandmarkRule{},
		IsAnalyzable:      true,
		AnalysisKind:      "face",
		MetricType:        "reps",
		RepTarget:         10,
	},

	{
		PoseID:            "face_jaw_slide_right",
		NameEN:            "Jaw Slide Right",
		NameTR:            "Çeneyi Sağa Kaydırma",
		Category:          CategoryFace,
		Difficulty:        2,
		TargetArea:        "face",
		InstructionsEN:    "Slide your jaw to the right side, hold briefly, then return to center. Repeat.",
		InstructionsTR:    "Çenenizi sağ tarafa kaydırın, kısa süre tutun, sonra merkeze döndürün. Tekrarlayın.",
		Contraindications: []string{"jaw_injury"},
		LandmarkRules:     []LandmarkRule{},
		IsAnalyzable:      true,
		AnalysisKind:      "face",
		MetricType:        "reps",
		RepTarget:         8,
	},

	{
		PoseID:            "face_jaw_slide_left",
		NameEN:            "Jaw Slide Left",
		NameTR:            "Çeneyi Sola Kaydırma",
		Category:          CategoryFace,
		Difficulty:        2,
		TargetArea:        "face",
		InstructionsEN:    "Slide your jaw to the left side, hold briefly, then return to center. Repeat.",
		InstructionsTR:    "Çenenizi sol tarafa kaydırın, kısa süre tutun, sonra merkeze döndürün. Tekrarlayın.",
		Contraindications: []string{"jaw_injury"},
		LandmarkRules:     []LandmarkRule{},
		IsAnalyzable:      true,
		AnalysisKind:      "face",
		MetricType:        "reps",
		RepTarget:         8,
	},

	{
		PoseID:            "face_brow_furrow",
		NameEN:            "Brow Furrow & Release",
		NameTR:            "Kaş Çatma ve Gevşetme",
		Category:          CategoryFace,
		Difficulty:        1,
		TargetArea:        "face",
		InstructionsEN:    "Furrow your brows as if you are frowning or concentrating hard. Hold, then completely relax your forehead. Repeat.",
		InstructionsTR:    "Kaşlarınızı çok konsantre olmuş gibi çatın. Tutun, sonra alnınızı tamamen gevşetin. Tekrarlayın.",
		Contraindications: []string{},
		LandmarkRules:     []LandmarkRule{},
		IsAnalyzable:      true,
		AnalysisKind:      "face",
		MetricType:        "reps",
		RepTarget:         10,
	},
}

var poseIndex map[string]*Pose

func init() {
	poseIndex = make(map[string]*Pose, len(AllPoses))
	for i := range AllPoses {
		if AllPoses[i].AnalysisKind == "" {
			AllPoses[i].AnalysisKind = "body"
		}
		if AllPoses[i].MetricType == "" {
			AllPoses[i].MetricType = "accuracy"
		}
		if AllPoses[i].LandmarkRules == nil {
			AllPoses[i].LandmarkRules = []LandmarkRule{}
		}
		if AllPoses[i].Contraindications == nil {
			AllPoses[i].Contraindications = []string{}
		}
		if len(AllPoses[i].LandmarkRules) > 0 {
			AllPoses[i].IsAnalyzable = true
		}
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

func TotalPoseCount() int {
	return len(AllPoses)
}

func AllPoseIDs() []string {
	ids := make([]string, len(AllPoses))
	for i, p := range AllPoses {
		ids[i] = p.PoseID
	}
	return ids
}

func GetSafePoseIDs(injuries []string) []string {
	injuries = NormalizeInjuries(injuries)
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

func CategoriesWithCounts() map[Category]int {
	counts := make(map[Category]int)
	for _, p := range AllPoses {
		counts[p.Category]++
	}
	return counts
}

func GetAnalyzablePoses() []Pose {
	var analyzable []Pose
	for _, p := range AllPoses {
		if p.IsAnalyzable {
			analyzable = append(analyzable, p)
		}
	}
	return analyzable
}

func GetPoseRules(id string) ([]LandmarkRule, bool) {
	p, ok := poseIndex[id]
	if !ok || !p.IsAnalyzable {
		return nil, false
	}
	return p.LandmarkRules, true
}

func GetPosesByTargetArea(poseIDs []string, focusArea string) []string {
	var filtered []string
	for _, id := range poseIDs {
		pose, ok := GetPoseByID(id)
		if ok && pose.TargetArea == focusArea {
			filtered = append(filtered, id)
		}
	}
	return filtered
}

func GetPosesByMaxDifficulty(poseIDs []string, maxDifficulty int) []string {
	var filtered []string
	for _, id := range poseIDs {
		pose, ok := GetPoseByID(id)
		if ok && pose.Difficulty <= maxDifficulty {
			filtered = append(filtered, id)
		}
	}
	return filtered
}
