"use client";

import type { Ref } from "react";
import { MEDIAPIPE_CAM_W, MEDIAPIPE_CAM_H } from "@/hooks/useMediapipePoseCamera";

type Props = {
  containerRef: Ref<HTMLDivElement>;
  videoRef: Ref<HTMLVideoElement>;
  canvasRef: Ref<HTMLCanvasElement>;
  className?: string;
};

export function PoseCameraStage({ containerRef, videoRef, canvasRef, className }: Props) {
  return (
    <div ref={containerRef} className={className}>
      <video
        ref={videoRef}
        playsInline
        muted
        className="pointer-events-none absolute h-px w-px opacity-0"
        width={MEDIAPIPE_CAM_W}
        height={MEDIAPIPE_CAM_H}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />
    </div>
  );
}
