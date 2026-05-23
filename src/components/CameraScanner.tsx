'use client';
import { useRef, useEffect, useState, useCallback } from 'react';

// Frame detection: check if image has strong rectangular edges in center
function detectCardInFrame(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const width = canvas.width;
  const height = canvas.height;

  // Check center region
  const centerX = width * 0.15;
  const centerY = height * 0.25;
  const regionW = width * 0.7;
  const regionH = height * 0.5;

  try {
    const imageData = ctx.getImageData(centerX, centerY, regionW, regionH);
    const data = imageData.data;

    let minBrightness = 255;
    let maxBrightness = 0;
    let totalBrightness = 0;
    const sampleStep = 20; // Sample every 20th pixel for performance
    let samples = 0;

    for (let i = 0; i < data.length; i += 4 * sampleStep) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      minBrightness = Math.min(minBrightness, brightness);
      maxBrightness = Math.max(maxBrightness, brightness);
      totalBrightness += brightness;
      samples++;
    }

    const avgBrightness = totalBrightness / samples;
    const contrast = maxBrightness - minBrightness;

    // Card detected if: high contrast (card edges) and reasonable brightness (not too dark)
    return contrast > 80 && avgBrightness > 100 && avgBrightness < 240;
  } catch {
    return false;
  }
}

interface CameraScannerProps {
  onCapture: (imageData: string) => void;
}

export default function CameraScanner({ onCapture }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionFrames = useRef(0);
  const animFrameRef = useRef<number>(0);
  const hasCaptured = useRef(false);

  const [isDetected, setIsDetected] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [cameraError, setCameraError] = useState('');
  const [isReady, setIsReady] = useState(false);

  const DETECTION_THRESHOLD = 45; // frames at ~30fps = 1.5 seconds

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    onCapture(imageData);
  }, [onCapture]);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Back camera
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setIsReady(true);
        }
      } catch {
        setCameraError('カメラへのアクセスが許可されていません');
      }
    }
    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    function processFrame() {
      if (!video || !canvas || hasCaptured.current) return;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx && video.readyState >= 2) {
        ctx.drawImage(video, 0, 0);
        const detected = detectCardInFrame(canvas);

        if (detected) {
          detectionFrames.current++;
          if (detectionFrames.current >= DETECTION_THRESHOLD) {
            setIsDetected(true);
            setCountdown(0);
            hasCaptured.current = true;
            captureFrame();
            detectionFrames.current = 0;
            return; // Stop loop after capture
          }
          setCountdown(Math.floor(detectionFrames.current / (DETECTION_THRESHOLD / 3)));
        } else {
          detectionFrames.current = Math.max(0, detectionFrames.current - 2);
          setIsDetected(false);
          if (detectionFrames.current === 0) setCountdown(0);
        }
      }
      animFrameRef.current = requestAnimationFrame(processFrame);
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isReady, captureFrame]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden" style={{ minHeight: '100vh' }}>
      {cameraError ? (
        <div className="text-white text-center p-8">
          <p className="text-xl mb-2">⚠️</p>
          <p>{cameraError}</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* Frame overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Dark overlay outside the frame */}
            <div className="absolute inset-0 bg-black/40" />
            {/* Card frame guide - business card ratio ~1.58:1 */}
            <div
              className="relative z-10 transition-all duration-300"
              style={{
                width: '85%',
                aspectRatio: '1.586',
                border: `3px solid ${isDetected ? '#4ade80' : 'rgba(255,255,255,0.8)'}`,
                borderRadius: '8px',
                boxShadow: isDetected
                  ? '0 0 0 4px rgba(74, 222, 128, 0.3), 0 0 30px rgba(74, 222, 128, 0.4)'
                  : '0 0 0 2px rgba(255,255,255,0.2)',
              }}
            >
              {/* Corner marks */}
              {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(corner => (
                <div
                  key={corner}
                  className="absolute w-6 h-6"
                  style={{
                    top: corner.includes('top') ? -3 : undefined,
                    bottom: corner.includes('bottom') ? -3 : undefined,
                    left: corner.includes('left') ? -3 : undefined,
                    right: corner.includes('right') ? -3 : undefined,
                    borderTopWidth: corner.includes('top') ? 3 : 0,
                    borderBottomWidth: corner.includes('bottom') ? 3 : 0,
                    borderLeftWidth: corner.includes('left') ? 3 : 0,
                    borderRightWidth: corner.includes('right') ? 3 : 0,
                    borderStyle: 'solid',
                    borderColor: isDetected ? '#4ade80' : 'white',
                  }}
                />
              ))}

              {/* Progress bar */}
              {countdown > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b">
                  <div
                    className="h-full bg-green-400 rounded-b transition-all"
                    style={{ width: `${(countdown / 3) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <p className={`text-sm font-medium px-4 py-2 rounded-full inline-block backdrop-blur-sm ${
                isDetected
                  ? 'bg-green-500/80 text-white'
                  : 'bg-black/50 text-white/90'
              }`}>
                {isDetected ? '名刺を認識しました！' : '名刺をフレーム内に合わせてください'}
              </p>
            </div>
          </div>
          {/* Hidden canvas for frame processing */}
          <canvas ref={canvasRef} className="hidden" />
        </>
      )}
    </div>
  );
}
