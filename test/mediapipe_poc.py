import cv2
import numpy as np
import mediapipe as mp
from collections import deque

VISIBILITY_THRESHOLD = 0.65
SMOOTHING_WINDOW = 10
EMA_ALPHA = 0.3

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

COLOR_GREEN = (0, 255, 0)
COLOR_RED = (0, 0, 255)
COLOR_YELLOW = (0, 255, 255)
COLOR_WHITE = (255, 255, 255)
COLOR_CYAN = (255, 255, 0)
COLOR_BG = (30, 30, 30)
FONT = cv2.FONT_HERSHEY_SIMPLEX

RIGHT_SHOULDER = mp_pose.PoseLandmark.RIGHT_SHOULDER.value
RIGHT_ELBOW = mp_pose.PoseLandmark.RIGHT_ELBOW.value
RIGHT_WRIST = mp_pose.PoseLandmark.RIGHT_WRIST.value
JOINT_INDICES = [RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST]

LANDMARK_NAMES = {
    RIGHT_SHOULDER: "R.Shoulder",
    RIGHT_ELBOW: "R.Elbow",
    RIGHT_WRIST: "R.Wrist",
}


def calculate_angle(a, b, c):
    """
    Calculates the angle at joint B formed by points A-B-C
    using the dot product (Cosine theorem) with numpy vectorization.

    Args:
        a: (x, y) coordinates of the first point (e.g., shoulder)
        b: (x, y) coordinates of the middle joint (e.g., elbow)
        c: (x, y) coordinates of the third point (e.g., wrist)

    Returns:
        Angle in degrees at joint B
    """
    a = np.array(a, dtype=np.float64)
    b = np.array(b, dtype=np.float64)
    c = np.array(c, dtype=np.float64)

    ba = a - b
    bc = c - b

    dot_product = np.dot(ba, bc)
    magnitude_ba = np.linalg.norm(ba)
    magnitude_bc = np.linalg.norm(bc)

    if magnitude_ba < 1e-9 or magnitude_bc < 1e-9:
        return 0.0

    cosine_angle = np.clip(dot_product / (magnitude_ba * magnitude_bc), -1.0, 1.0)
    angle_rad = np.arccos(cosine_angle)
    angle_deg = np.degrees(angle_rad)

    return angle_deg


def check_visibility(landmarks, indices):
    """
    Checks if all landmarks at the given indices have visibility >= threshold.
    Returns (True, -1) if all pass, or (False, failed_index) on first failure.
    """
    for idx in indices:
        if landmarks[idx].visibility < VISIBILITY_THRESHOLD:
            return False, idx
    return True, -1


class TemporalSmoother:
    """
    Exponential Moving Average (EMA) filter with a sliding window (deque).
    Smooths raw sensor data to eliminate frame-to-frame jitter.

    - SMA: Simple Moving Average over last `window_size` values
    - EMA: Weighted average giving more importance to recent values (controlled by alpha)
    """
    def __init__(self, window_size=SMOOTHING_WINDOW, alpha=EMA_ALPHA):
        self.window = deque(maxlen=window_size)
        self.alpha = alpha
        self.ema_value = None

    def update(self, value):
        self.window.append(value)

        if self.ema_value is None:
            self.ema_value = value
        else:
            self.ema_value = self.alpha * value + (1.0 - self.alpha) * self.ema_value

        return self.ema_value

    def get_sma(self):
        if len(self.window) == 0:
            return 0.0
        return sum(self.window) / len(self.window)

    def get_ema(self):
        if self.ema_value is None:
            return 0.0
        return self.ema_value

    def reset(self):
        self.window.clear()
        self.ema_value = None


def draw_info_panel(frame, raw_angle, smoothed_angle, visibility_ok, fps, failed_idx):
    h, w = frame.shape[:2]
    panel_h = 180
    overlay = frame.copy()
    cv2.rectangle(overlay, (10, 10), (420, 10 + panel_h), COLOR_BG, -1)
    cv2.addWeighted(overlay, 0.85, frame, 0.15, 0, frame)

    cv2.putText(frame, "YogAI - MediaPipe BlazePose PoC", (20, 38), FONT, 0.6, COLOR_CYAN, 2)
    cv2.putText(frame, f"FPS: {fps:.1f}", (340, 38), FONT, 0.5, COLOR_WHITE, 1)

    if visibility_ok:
        cv2.putText(frame, "Visibility: OK", (20, 68), FONT, 0.55, COLOR_GREEN, 2)
        cv2.putText(frame, f"Raw Angle:      {raw_angle:.1f} deg", (20, 100), FONT, 0.55, COLOR_YELLOW, 1)
        cv2.putText(frame, f"Smoothed Angle: {smoothed_angle:.1f} deg", (20, 130), FONT, 0.55, COLOR_GREEN, 2)
        diff = abs(raw_angle - smoothed_angle)
        cv2.putText(frame, f"Jitter Removed: {diff:.1f} deg", (20, 160), FONT, 0.5, COLOR_WHITE, 1)
    else:
        name = LANDMARK_NAMES.get(failed_idx, f"Landmark {failed_idx}")
        cv2.putText(frame, "Low Confidence - Point Obscured", (20, 68), FONT, 0.6, COLOR_RED, 2)
        cv2.putText(frame, f"Failed: {name} (vis < {VISIBILITY_THRESHOLD})", (20, 100), FONT, 0.55, COLOR_RED, 1)
        cv2.putText(frame, "Angle calculation DROPPED", (20, 130), FONT, 0.55, COLOR_RED, 1)
        cv2.putText(frame, "Waiting for clear joint visibility...", (20, 160), FONT, 0.5, COLOR_YELLOW, 1)

    cv2.putText(frame, "Press 'q' to quit | 'r' to reset smoother", (20, h - 20), FONT, 0.45, COLOR_WHITE, 1)


def draw_angle_arc(frame, center, angle, radius=50):
    cx, cy = int(center[0]), int(center[1])
    cv2.ellipse(frame, (cx, cy), (radius, radius), 0, 0, int(angle), COLOR_GREEN, 2)
    label_x = cx + int(radius * 0.7 * np.cos(np.radians(angle / 2)))
    label_y = cy - int(radius * 0.7 * np.sin(np.radians(angle / 2)))
    cv2.putText(frame, f"{angle:.0f}", (label_x, label_y), FONT, 0.5, COLOR_GREEN, 2)


def main():
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("[ERROR] Cannot open camera. Check permissions or camera availability.")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    smoother = TemporalSmoother(window_size=SMOOTHING_WINDOW, alpha=EMA_ALPHA)

    prev_time = cv2.getTickCount()
    fps = 0.0

    print("=" * 60)
    print("  YogAI - MediaPipe BlazePose PoC")
    print(f"  MediaPipe version: {mp.__version__}")
    print("  Measuring: Right Elbow Angle (Shoulder-Elbow-Wrist)")
    print(f"  Visibility Threshold: {VISIBILITY_THRESHOLD}")
    print(f"  Smoothing: EMA (alpha={EMA_ALPHA}), Window={SMOOTHING_WINDOW}")
    print("  Controls: 'q' = quit, 'r' = reset smoother")
    print("=" * 60)

    with mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        smooth_landmarks=True,
        enable_segmentation=False,
        min_detection_confidence=0.7,
        min_tracking_confidence=0.6,
    ) as pose:

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                print("[WARN] Failed to read frame, retrying...")
                continue

            frame = cv2.flip(frame, 1)

            curr_time = cv2.getTickCount()
            time_diff = (curr_time - prev_time) / cv2.getTickFrequency()
            if time_diff > 0:
                fps = 1.0 / time_diff
            prev_time = curr_time

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb_frame.flags.writeable = False
            results = pose.process(rgb_frame)
            rgb_frame.flags.writeable = True

            visibility_ok = False
            raw_angle = 0.0
            smoothed_angle = 0.0
            failed_idx = -1

            if results.pose_landmarks:
                mp_drawing.draw_landmarks(
                    frame,
                    results.pose_landmarks,
                    mp_pose.POSE_CONNECTIONS,
                    landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style(),
                )

                landmarks = results.pose_landmarks.landmark
                visibility_ok, failed_idx = check_visibility(landmarks, JOINT_INDICES)

                if visibility_ok:
                    h, w = frame.shape[:2]

                    shoulder = [landmarks[RIGHT_SHOULDER].x * w, landmarks[RIGHT_SHOULDER].y * h]
                    elbow = [landmarks[RIGHT_ELBOW].x * w, landmarks[RIGHT_ELBOW].y * h]
                    wrist = [landmarks[RIGHT_WRIST].x * w, landmarks[RIGHT_WRIST].y * h]

                    raw_angle = calculate_angle(shoulder, elbow, wrist)
                    smoothed_angle = smoother.update(raw_angle)

                    for point in [shoulder, elbow, wrist]:
                        cv2.circle(frame, (int(point[0]), int(point[1])), 8, COLOR_GREEN, -1)
                        cv2.circle(frame, (int(point[0]), int(point[1])), 10, COLOR_WHITE, 2)

                    cv2.line(frame, (int(shoulder[0]), int(shoulder[1])), (int(elbow[0]), int(elbow[1])), COLOR_CYAN, 3)
                    cv2.line(frame, (int(elbow[0]), int(elbow[1])), (int(wrist[0]), int(wrist[1])), COLOR_CYAN, 3)

                    draw_angle_arc(frame, elbow, smoothed_angle)

            draw_info_panel(frame, raw_angle, smoothed_angle, visibility_ok, fps, failed_idx)

            cv2.imshow("YogAI - BlazePose PoC", frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break
            elif key == ord("r"):
                smoother.reset()
                print("[INFO] Smoother reset")

    cap.release()
    cv2.destroyAllWindows()
    print("[INFO] Session ended.")


if __name__ == "__main__":
    main()
