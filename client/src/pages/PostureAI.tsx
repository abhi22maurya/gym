import { useRef, useEffect, useState, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { savePostureScore } from '../lib/api';
import { Camera, ChevronUp } from 'lucide-react';
import { ActivityRing } from '../components/ui/ActivityRing';

function analyzePosture(landmarks: any[]): { score: number; status: 'good' | 'warning' | 'poor'; feedback: string[] } {
  if (!landmarks || landmarks.length < 25) {
    return { score: 0, status: 'poor', feedback: ['No pose detected. Step back so your full upper body is visible.'] };
  }
  const [lS, rS, lH, rH, lE, rE] = [landmarks[11], landmarks[12], landmarks[23], landmarks[24], landmarks[7], landmarks[8]];
  const feedback: string[] = [];
  let score = 100;

  if (Math.abs(lS.y - rS.y) > 0.05) { score -= 20; feedback.push('Shoulders uneven — level them out.'); }
  const headForward = Math.abs(((lE.x + rE.x) / 2) - ((lS.x + rS.x) / 2));
  if (headForward > 0.07) { score -= 25; feedback.push('Forward head posture — pull chin back.'); }
  if (((lS.y + rS.y) / 2) > ((lH.y + rH.y) / 2)) { score -= 15; feedback.push('Slouching detected — sit up straight.'); }
  if (Math.abs(lH.y - rH.y) > 0.06) { score -= 15; feedback.push('Hips uneven — check your stance.'); }

  score = Math.max(0, score);
  if (feedback.length === 0) feedback.push('Excellent posture! Keep it up.');
  return { score, status: score >= 80 ? 'good' : score >= 50 ? 'warning' : 'poor', feedback };
}

export function PostureAI() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animRef = useRef(0);

  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzePosture> | null>(null);
  const [saved, setSaved] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadModel = useCallback(async () => {
    setIsLoading(true);
    try {
      const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
      landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
      setModelLoaded(true);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  }, []);

  const startCamera = useCallback(async () => {
    if (!modelLoaded) await loadModel();
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
    if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); setIsRunning(true); }
  }, [modelLoaded, loadModel]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    let lastTime = 0;
    const detect = async (ts: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !landmarkerRef.current || video.readyState < 2) {
        animRef.current = requestAnimationFrame(detect); return;
      }
      if (ts - lastTime < 100) { animRef.current = requestAnimationFrame(detect); return; }
      lastTime = ts;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const result = landmarkerRef.current.detectForVideo(video, ts);
      if (result.landmarks?.length > 0) {
        const du = new DrawingUtils(ctx);
        du.drawConnectors(result.landmarks[0], PoseLandmarker.POSE_CONNECTIONS, { color: 'rgba(10, 132, 255, 0.7)', lineWidth: 2 });
        du.drawLandmarks(result.landmarks[0], { color: '#30D158', lineWidth: 1, radius: 4 });
        setAnalysis(analyzePosture(result.landmarks[0]));
        if (!sheetOpen) setSheetOpen(true);
      }
      animRef.current = requestAnimationFrame(detect);
    };
    animRef.current = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(animRef.current);
  }, [isRunning, sheetOpen]);

  const handleSave = async () => {
    if (!analysis) return;
    await savePostureScore(analysis.score, analysis.feedback.join('; '));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const scoreColor = analysis
    ? analysis.status === 'good' ? 'var(--color-green)' : analysis.status === 'warning' ? 'var(--color-yellow)' : 'var(--color-red)'
    : 'var(--label-tertiary)';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--label-primary)' }}>Posture AI</h1>
        <p style={{ fontSize: 15, color: 'var(--label-secondary)', marginTop: 2 }}>Real-time analysis via MediaPipe</p>
      </div>

      {/* Camera frame */}
      <div style={{
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        background: 'var(--bg-secondary)',
        aspectRatio: '4/3',
        boxShadow: 'var(--shadow-lg)',
        marginBottom: 16,
      }}>
        <video ref={videoRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0 }} muted playsInline />
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        {!isRunning && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
            background: 'var(--bg-tertiary)',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22,
              background: 'var(--fill-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Camera size={32} color="var(--label-tertiary)" />
            </div>
            <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--label-secondary)' }}>Camera Off</p>
            <p style={{ fontSize: 13, color: 'var(--label-tertiary)', textAlign: 'center', maxWidth: 220 }}>
              Tap "Start Analysis" to begin real-time posture detection
            </p>
          </div>
        )}

        {/* Score overlay on camera */}
        {isRunning && analysis && (
          <div style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
            borderRadius: 16, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <ActivityRing progress={analysis.score} color={scoreColor} size={44} strokeWidth={5} />
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{analysis.score}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>SCORE</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          onClick={isRunning ? stopCamera : startCamera}
          disabled={isLoading}
          style={{
            flex: 1, padding: 14, borderRadius: 'var(--radius-md)', border: 'none',
            cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 700,
            background: isRunning ? 'var(--color-red)' : 'var(--color-blue)',
            color: 'white', transition: 'all 200ms var(--spring)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {isLoading ? 'Loading Model…' : isRunning ? 'Stop Camera' : '▶ Start Analysis'}
        </button>
        {analysis && (
          <button
            onClick={handleSave}
            style={{
              padding: '14px 20px', borderRadius: 'var(--radius-md)', border: 'none',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
              background: saved ? 'var(--color-green)' : 'var(--fill-primary)',
              color: saved ? 'white' : 'var(--label-primary)',
              transition: 'all 200ms var(--spring)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {saved ? '✓ Saved' : 'Save Score'}
          </button>
        )}
      </div>

      {/* Feedback bottom panel */}
      {analysis && (
        <div className="apple-card animate-scale-in" style={{ padding: '16px 20px' }}>
          <button
            onClick={() => setSheetOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, marginBottom: sheetOpen ? 12 : 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ActivityRing progress={analysis.score} color={scoreColor} size={40} strokeWidth={5} />
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 17, fontWeight: 700, color: scoreColor }}>
                  {analysis.score}/100
                </p>
                <p style={{ fontSize: 13, color: 'var(--label-secondary)', textTransform: 'capitalize' }}>
                  {analysis.status} posture
                </p>
              </div>
            </div>
            <ChevronUp
              size={20} color="var(--label-tertiary)"
              style={{ transition: 'transform 250ms', transform: sheetOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {sheetOpen && (
            <div>
              <div style={{ width: '100%', height: 0.5, background: 'var(--separator)', marginBottom: 12 }} />
              {analysis.feedback.map((tip, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 11, background: scoreColor + '20',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: 4, background: scoreColor }} />
                  </div>
                  <p style={{ fontSize: 15, color: 'var(--label-primary)', lineHeight: 1.5 }}>{tip}</p>
                </div>
              ))}

              {/* Tips */}
              <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, background: 'var(--fill-tertiary)' }}>
                <p style={{ fontSize: 12, color: 'var(--label-tertiary)', fontWeight: 500, marginBottom: 4 }}>TIPS</p>
                {['Ensure good lighting', 'Face camera at eye level', 'Full upper body visible', 'Hold still for 5 seconds'].map(t => (
                  <p key={t} style={{ fontSize: 13, color: 'var(--label-secondary)', marginBottom: 2 }}>· {t}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
