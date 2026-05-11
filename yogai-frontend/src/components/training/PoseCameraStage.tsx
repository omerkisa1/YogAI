"use client";

import type { Ref } from "react";
import { MEDIAPIPE_CAM_W, MEDIAPIPE_CAM_H } from "@/hooks/useMediapipePoseCamera";

type Props = {
  containerRef: Ref<HTMLDivElement>;
  videoRef: Ref<HTMLVideoElement>;
  canvasRef: Ref<HTMLCanvasElement>;
  className?: string;
  mirrorVideo?: boolean;
};

export function PoseCameraStage({
  containerRef,
  videoRef,
  canvasRef,
  className,
  mirrorVideo = false,
}: Props) {
  return (
    <div ref={containerRef} className={className}>
      <video
        ref={videoRef}
        playsInline
        muted
        className={
          mirrorVideo
            ? "pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover"
            : "pointer-events-none absolute h-px w-px opacity-0"
        }
        width={MEDIAPIPE_CAM_W}
        height={MEDIAPIPE_CAM_H}
      />
      <canvas
        ref={canvasRef}
        className={
          mirrorVideo
            ? "pointer-events-none absolute h-px w-px opacity-0"
            : "absolute inset-0 h-full w-full object-cover"
        }
      />
    </div>
  );
}
