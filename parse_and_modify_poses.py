import re

content = open('yogai-backend/internal/catalog/poses.go', 'r', encoding='utf-8').read()

landmark_rules = {
    'mountain': '''LandmarkRules: []LandmarkRule{
			{Joint: "left_leg", PointA: 23, PointB: 25, PointC: 27, AngleMin: 170, AngleMax: 180, Weight: 0.25, FeedbackEN: "Keep your left leg straight.", FeedbackTR: "Sol bacağınızı düz tutun."},
			{Joint: "right_leg", PointA: 24, PointB: 26, PointC: 28, AngleMin: 170, AngleMax: 180, Weight: 0.25, FeedbackEN: "Keep your right leg straight.", FeedbackTR: "Sağ bacağınızı düz tutun."},
			{Joint: "left_arm", PointA: 11, PointB: 13, PointC: 15, AngleMin: 160, AngleMax: 180, Weight: 0.25, FeedbackEN: "Keep your left arm straight down.", FeedbackTR: "Sol kolunuzu düz aşağı sarkıtın."},
			{Joint: "upright_body", PointA: 11, PointB: 23, PointC: 25, AngleMin: 170, AngleMax: 180, Weight: 0.25, FeedbackEN: "Stand tall and straight.", FeedbackTR: "Dik ve düz durun."},
		}''',
    'warrior_1': '''LandmarkRules: []LandmarkRule{
			{Joint: "front_knee", PointA: 23, PointB: 25, PointC: 27, AngleMin: 85, AngleMax: 110, Weight: 0.30, FeedbackEN: "Bend your front knee close to 90 degrees.", FeedbackTR: "Ön dizinizi 90 dereceye yakın bükün."},
			{Joint: "back_leg", PointA: 24, PointB: 26, PointC: 28, AngleMin: 160, AngleMax: 180, Weight: 0.25, FeedbackEN: "Keep your back leg straight.", FeedbackTR: "Arka bacağınızı düz tutun."},
			{Joint: "arms_up", PointA: 13, PointB: 11, PointC: 23, AngleMin: 150, AngleMax: 180, Weight: 0.25, FeedbackEN: "Reach your arms up straight.", FeedbackTR: "Kollarınızı yukarı uzatın."},
			{Joint: "torso_upright", PointA: 11, PointB: 23, PointC: 25, AngleMin: 160, AngleMax: 180, Weight: 0.20, FeedbackEN: "Keep your torso upright.", FeedbackTR: "Gövdenizi dik tutun."},
		}''',
    'warrior_2': '''LandmarkRules: []LandmarkRule{
			{Joint: "front_knee", PointA: 23, PointB: 25, PointC: 27, AngleMin: 85, AngleMax: 110, Weight: 0.30, FeedbackEN: "Bend your front knee close to 90 degrees.", FeedbackTR: "Ön dizinizi 90 dereceye yakın bükün."},
			{Joint: "back_leg", PointA: 24, PointB: 26, PointC: 28, AngleMin: 160, AngleMax: 180, Weight: 0.25, FeedbackEN: "Keep your back leg straight.", FeedbackTR: "Arka bacağınızı düz tutun."},
			{Joint: "arms_parallel", PointA: 15, PointB: 11, PointC: 12, AngleMin: 160, AngleMax: 180, Weight: 0.25, FeedbackEN: "Keep arms parallel to the floor.", FeedbackTR: "Kollarınızı yere paralel tutun."},
			{Joint: "torso_upright", PointA: 11, PointB: 23, PointC: 25, AngleMin: 160, AngleMax: 180, Weight: 0.20, FeedbackEN: "Keep your torso centered.", FeedbackTR: "Gövdenizi ortada ve dik tutun."},
		}''',
    'tree': '''LandmarkRules: []LandmarkRule{
			{Joint: "standing_leg", PointA: 23, PointB: 25, PointC: 27, AngleMin: 170, AngleMax: 180, Weight: 0.40, FeedbackEN: "Keep your standing leg straight.", FeedbackTR: "Yere basan bacağınızı düz tutun."},
			{Joint: "bent_knee", PointA: 24, PointB: 26, PointC: 28, AngleMin: 30, AngleMax: 90, Weight: 0.30, FeedbackEN: "Bend your other knee and place your foot on your thigh or calf.", FeedbackTR: "Diğer dizinizi bükün ve ayağınızı bacağınıza yerleştirin."},
			{Joint: "torso", PointA: 11, PointB: 23, PointC: 25, AngleMin: 170, AngleMax: 180, Weight: 0.30, FeedbackEN: "Stand tall.", FeedbackTR: "Dik durun."},
		}''',
    'chair': '''LandmarkRules: []LandmarkRule{
			{Joint: "knees_bent", PointA: 23, PointB: 25, PointC: 27, AngleMin: 90, AngleMax: 140, Weight: 0.40, FeedbackEN: "Bend your knees as if sitting in a chair.", FeedbackTR: "Sanki bir sandalyede oturuyormuş gibi dizlerinizi bükün."},
			{Joint: "hips_flexed", PointA: 11, PointB: 23, PointC: 25, AngleMin: 90, AngleMax: 140, Weight: 0.30, FeedbackEN: "Hinge at your hips.", FeedbackTR: "Kalçalarınızdan eğilin."},
			{Joint: "arms_up", PointA: 15, PointB: 11, PointC: 23, AngleMin: 140, AngleMax: 180, Weight: 0.30, FeedbackEN: "Extend arms up alongside your ears.", FeedbackTR: "Kollarınızı kulaklarınızın yanına doğru uzatın."},
		}''',
    'triangle': '''LandmarkRules: []LandmarkRule{
			{Joint: "front_leg", PointA: 23, PointB: 25, PointC: 27, AngleMin: 160, AngleMax: 180, Weight: 0.25, FeedbackEN: "Keep your front leg straight.", FeedbackTR: "Ön bacağınızı düz tutun."},
			{Joint: "back_leg", PointA: 24, PointB: 26, PointC: 28, AngleMin: 160, AngleMax: 180, Weight: 0.25, FeedbackEN: "Keep your back leg straight.", FeedbackTR: "Arka bacağınızı düz tutun."},
			{Joint: "torso_lateral", PointA: 11, PointB: 23, PointC: 25, AngleMin: 60, AngleMax: 110, Weight: 0.25, FeedbackEN: "Bend sideways over your front leg.", FeedbackTR: "Ön bacağınızın üzerine doğru yana eğilin."},
			{Joint: "arms_vertical", PointA: 15, PointB: 11, PointC: 12, AngleMin: 160, AngleMax: 180, Weight: 0.25, FeedbackEN: "Extend arms vertically.", FeedbackTR: "Kollarınızı dikey olarak uzatın."},
		}''',
    'cobra': '''LandmarkRules: []LandmarkRule{
			{Joint: "arms_bent", PointA: 11, PointB: 13, PointC: 15, AngleMin: 90, AngleMax: 160, Weight: 0.30, FeedbackEN: "Keep a slight bend in your elbows.", FeedbackTR: "Dirseklerinizde hafif bir bükülme bırakın."},
			{Joint: "back_extension", PointA: 11, PointB: 23, PointC: 25, AngleMin: 120, AngleMax: 160, Weight: 0.40, FeedbackEN: "Lift your chest, arching your back gently.", FeedbackTR: "Göğsünüzü kaldırın, sırtınızı nazikçe kavisleştirin."},
			{Joint: "legs_straight", PointA: 23, PointB: 25, PointC: 27, AngleMin: 160, AngleMax: 180, Weight: 0.30, FeedbackEN: "Keep your legs straight behind you.", FeedbackTR: "Bacaklarınızı arkanızda düz tutun."},
		}''',
    'plank': '''LandmarkRules: []LandmarkRule{
			{Joint: "body_straight", PointA: 11, PointB: 23, PointC: 25, AngleMin: 165, AngleMax: 180, Weight: 0.40, FeedbackEN: "Keep your body in a straight line.", FeedbackTR: "Vücudunuzu düz bir çizgide tutun."},
			{Joint: "legs_straight", PointA: 23, PointB: 25, PointC: 27, AngleMin: 165, AngleMax: 180, Weight: 0.30, FeedbackEN: "Keep your legs straight.", FeedbackTR: "Bacaklarınızı düz tutun."},
			{Joint: "arms_straight", PointA: 11, PointB: 13, PointC: 15, AngleMin: 165, AngleMax: 180, Weight: 0.30, FeedbackEN: "Keep your arms straight under your shoulders.", FeedbackTR: "Kollarınızı omuzlarınızın altında düz tutun."},
		}''',
    'bridge': '''LandmarkRules: []LandmarkRule{
			{Joint: "knees_bent", PointA: 23, PointB: 25, PointC: 27, AngleMin: 60, AngleMax: 110, Weight: 0.30, FeedbackEN: "Keep your knees bent over your ankles.", FeedbackTR: "Dizlerinizi ayak bileklerinizin hizasında bükük tutun."},
			{Joint: "hips_lifted", PointA: 11, PointB: 23, PointC: 25, AngleMin: 140, AngleMax: 180, Weight: 0.50, FeedbackEN: "Lift your hips high.", FeedbackTR: "Kalçalarınızı yükseğe kaldırın."},
			{Joint: "arms_down", PointA: 13, PointB: 11, PointC: 23, AngleMin: 0, AngleMax: 45, Weight: 0.20, FeedbackEN: "Keep your arms flat on the mat.", FeedbackTR: "Kollarınızı matın üzerinde düz tutun."},
		}''',
    'downward_dog': '''LandmarkRules: []LandmarkRule{
			{Joint: "shoulder_flexion", PointA: 13, PointB: 11, PointC: 23, AngleMin: 150, AngleMax: 180, Weight: 0.30, FeedbackEN: "Push your chest towards your thighs.", FeedbackTR: "Göğsünüzü uyluklarınıza doğru itin."},
			{Joint: "hip_angle", PointA: 11, PointB: 23, PointC: 25, AngleMin: 60, AngleMax: 100, Weight: 0.40, FeedbackEN: "Create a sharp inverted V shape with your hips.", FeedbackTR: "Kalçalarınızla keskin bir ters V şekli oluşturun."},
			{Joint: "legs_straight", PointA: 23, PointB: 25, PointC: 27, AngleMin: 150, AngleMax: 180, Weight: 0.30, FeedbackEN: "Try to keep your legs straight.", FeedbackTR: "Bacaklarınızı düz tutmaya çalışın."},
		}'''
}

out_content = content
for pose_id, rule_str in landmark_rules.items():
    pattern = r'(PoseID:\s*"' + pose_id + r'".*?Contraindications:\s*\[\]string\{.*?\})\s*\}'
    replacement = r'\1,\n\t\t' + rule_str + r'\n\t}'
    out_content = re.sub(pattern, replacement, out_content, flags=re.DOTALL)

with open('yogai-backend/internal/catalog/poses.go', 'w', encoding='utf-8') as f:
    f.write(out_content)
