"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Zap, ZapOff, SwitchCamera, Camera, CameraOff } from "lucide-react";
import jsQR from "jsqr";
import { triggerHaptic } from "@/lib/haptics";

export interface ScannedMerchant {
  merchantName: string;
  merchantUpi: string;
  photoDataUrl?: string;
}

interface UpiScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToPay: (merchant: ScannedMerchant) => void;
}

// Parse real QR text into merchant name and UPI ID
function parseUpiData(rawText: string): ScannedMerchant | null {
  const text = rawText.trim();
  if (!text) return null;

  // 1. Standard or URL UPI format (Case-insensitive match for pa= and pn=)
  const paMatch = text.match(/[?&]pa=([^&]+)/i);
  const pnMatch = text.match(/[?&]pn=([^&]+)/i);

  if (paMatch) {
    const pa = decodeURIComponent(paMatch[1]).trim();
    let cleanName = "";
    if (pnMatch) {
      cleanName = decodeURIComponent(pnMatch[1]).replace(/\+/g, " ").trim();
    }
    if (!cleanName) {
      const prefix = pa.split("@")[0].replace(/[._-]/g, " ").trim();
      cleanName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return {
      merchantName: cleanName || "UPI Merchant",
      merchantUpi: pa,
    };
  }

  // 2. Direct VPA format: e.g. name@bank or phone@upi
  const vpaRegex = /([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})/;
  const match = text.match(vpaRegex);
  if (match) {
    const vpa = match[1].trim();
    const prefix = vpa.split("@")[0].replace(/[._-]/g, " ").trim();
    const cleanName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    return {
      merchantName: cleanName || "UPI Merchant",
      merchantUpi: vpa,
    };
  }

  // 3. Fallback for Web URL
  if (text.startsWith("http://") || text.startsWith("https://")) {
    try {
      const url = new URL(text);
      return {
        merchantName: url.hostname.replace(/^www\./, ""),
        merchantUpi: `${url.hostname.replace(/[^a-zA-Z0-9]/g, "")}@upi`,
      };
    } catch { }
  }

  return {
    merchantName: text.slice(0, 28) || "UPI Merchant",
    merchantUpi: `${text.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 16)}@upi`,
  };
}

// Fast multi-pass QR decoder (optimized full-frame + center viewfinder crop)
function decodeQrFromVideo(
  video: HTMLVideoElement,
  scanCanvas: HTMLCanvasElement
): ScannedMerchant | null {
  const vWidth = video.videoWidth;
  const vHeight = video.videoHeight;
  if (!vWidth || !vHeight) return null;

  const ctx = scanCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  // 1. Scaled down full-frame pass (fast 10-15ms)
  const maxDim = 640;
  const scale = Math.min(1, maxDim / Math.max(vWidth, vHeight));
  const sWidth = Math.floor(vWidth * scale);
  const sHeight = Math.floor(vHeight * scale);

  scanCanvas.width = sWidth;
  scanCanvas.height = sHeight;
  ctx.drawImage(video, 0, 0, sWidth, sHeight);

  let imgData = ctx.getImageData(0, 0, sWidth, sHeight);
  let code = jsQR(imgData.data, sWidth, sHeight, { inversionAttempts: "attemptBoth" });
  if (code && code.data) {
    const parsed = parseUpiData(code.data);
    if (parsed) return parsed;
  }

  // 2. Center crop pass (focused on viewfinder box)
  const minDim = Math.min(vWidth, vHeight);
  const cropSize = Math.floor(minDim * 0.75);
  const cropX = Math.floor((vWidth - cropSize) / 2);
  const cropY = Math.floor((vHeight - cropSize) / 2);

  scanCanvas.width = 480;
  scanCanvas.height = 480;
  ctx.drawImage(video, cropX, cropY, cropSize, cropSize, 0, 0, 480, 480);

  imgData = ctx.getImageData(0, 0, 480, 480);
  code = jsQR(imgData.data, 480, 480, { inversionAttempts: "attemptBoth" });
  if (code && code.data) {
    const parsed = parseUpiData(code.data);
    if (parsed) return parsed;
  }

  return null;
}

export function UpiScannerModal({
  isOpen,
  onClose,
  onProceedToPay,
}: UpiScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [detectedMerchant, setDetectedMerchant] = useState<ScannedMerchant>({
    merchantName: "UPI Merchant",
    merchantUpi: "merchant@upi",
  });

  // Stop all camera stream tracks
  const stopCameraTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Request camera and torch permissions, attach live stream
  const startCamera = useCallback(
    async (mode: "environment" | "user" = facingMode) => {
      stopCameraTracks();
      setIsRequesting(true);
      setPermissionError(null);

      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setPermissionError("Camera API is not supported on this device.");
        setHasCamera(false);
        setIsCameraActive(false);
        setIsRequesting(false);
        return;
      }

      try {
        let stream: MediaStream;
        try {
          // Attempt preferred facing mode first
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: mode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          // Fallback to general camera if exact mode constraint is rejected
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play().catch(() => { });
        }
        setHasCamera(true);
        setIsCameraActive(true);
        setPermissionError(null);
      } catch (err: unknown) {
        console.warn("Camera permission / access error:", err);
        setHasCamera(false);
        setIsCameraActive(false);
        const name = (err as { name?: string })?.name;
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setPermissionError("Camera permission denied. Tap Enable to allow.");
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setPermissionError("No camera found on this device.");
        } else {
          setPermissionError("Could not access camera. Tap Enable to retry.");
        }
      } finally {
        setIsRequesting(false);
      }
    },
    [facingMode, stopCameraTracks]
  );

  // Initialize camera stream when modal opens or facingMode changes
  useEffect(() => {
    if (!isOpen) {
      stopCameraTracks();
      return;
    }

    let isMounted = true;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      .then((stream) => {
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play().catch(() => { });
        }
        setHasCamera(true);
        setIsCameraActive(true);
        setPermissionError(null);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.warn("Camera permission / access error:", err);
        setHasCamera(false);
        setIsCameraActive(false);
        const name = (err as { name?: string })?.name;
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setPermissionError("Camera permission denied. Tap Enable to allow.");
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setPermissionError("No camera found on this device.");
        } else {
          setPermissionError("Could not access camera. Tap Enable to retry.");
        }
      });

    return () => {
      isMounted = false;
      stopCameraTracks();
    };
  }, [isOpen, facingMode, stopCameraTracks]);

  // Live real-time QR code detection from video frames using optimized jsQR
  useEffect(() => {
    if (!isOpen || !hasCamera || !isCameraActive) return;

    let isScanning = true;
    const scanCanvas = document.createElement("canvas");

    const intervalId = setInterval(() => {
      if (!isScanning || !videoRef.current || videoRef.current.readyState < 2) {
        return;
      }

      try {
        const parsed = decodeQrFromVideo(videoRef.current, scanCanvas);
        if (parsed) {
          setDetectedMerchant(parsed);
        }
      } catch (err) {
        console.warn("Continuous QR frame decoding error:", err);
      }
    }, 200);

    return () => {
      isScanning = false;
      clearInterval(intervalId);
    };
  }, [isOpen, hasCamera, isCameraActive]);

  // Turn Camera On / Off
  const handleToggleCamera = async () => {
    triggerHaptic("light");
    if (isCameraActive && streamRef.current) {
      stopCameraTracks();
      setIsCameraActive(false);
      setHasCamera(false);
      setIsTorchOn(false);
    } else {
      await startCamera(facingMode);
    }
  };

  // Flip Camera (Rear <-> Front)
  const handleFlipCamera = async () => {
    triggerHaptic("light");
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    setIsTorchOn(false);
    await startCamera(nextMode);
  };

  // Toggle Torch/Flashlight
  const handleToggleTorch = async () => {
    triggerHaptic("light");
    if (!isCameraActive || !streamRef.current) {
      // If camera is off, turn on rear camera first
      setFacingMode("environment");
      await startCamera("environment");
    }

    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !isTorchOn;
        await (track as MediaStreamTrack & {
          applyConstraints: (c: unknown) => Promise<void>;
        }).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      } catch (e) {
        console.warn("Torch constraint error:", e);
        setIsTorchOn((prev) => !prev);
      }
    }
  };

  // Capture snapshot, run high-resolution QR decode, and proceed to payment modal
  const handlePayClick = () => {
    triggerHaptic("medium");
    let photoDataUrl: string | undefined = undefined;
    let finalMerchant: ScannedMerchant = detectedMerchant;

    if (videoRef.current && hasCamera) {
      try {
        const v = videoRef.current;
        const width = v.videoWidth || 640;
        const height = v.videoHeight || 480;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(v, 0, 0, width, height);
          photoDataUrl = canvas.toDataURL("image/jpeg", 0.85);

          // Full-resolution QR decode at moment of shutter click
          const parsed = decodeQrFromVideo(v, canvas);
          if (parsed) {
            finalMerchant = parsed;
          }
        }
      } catch (err) {
        console.warn("Could not capture frame snapshot:", err);
      }
    }

    stopCameraTracks();
    setIsTorchOn(false);
    onProceedToPay({
      ...finalMerchant,
      photoDataUrl,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-background flex flex-col justify-between overflow-hidden animate-in fade-in duration-200"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* Top Header: Torch & Camera controls on Left, Close on Right */}
      <div
        className="relative z-10 w-full flex items-center justify-between px-5 sm:px-6 py-4"
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
      >
        {/* Left Side: Torch + Camera Toggle Options */}
        <div className="flex items-center gap-2.5">
          {/* Torch Button */}
          <button
            type="button"
            onClick={handleToggleTorch}
            aria-label={isTorchOn ? "Turn off torch" : "Turn on torch"}
            className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all cursor-pointer active:scale-95 ${isTorchOn
                ? "bg-text-primary text-background border-text-primary shadow-lg"
                : "bg-surface-elevated text-text-primary border-border hover:opacity-80"
              }`}
          >
            {isTorchOn ? <Zap size={20} /> : <ZapOff size={20} />}
          </button>

          {/* Camera On / Off Toggle */}
          <button
            type="button"
            onClick={handleToggleCamera}
            aria-label={isCameraActive ? "Turn off camera" : "Turn on camera"}
            className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all cursor-pointer active:scale-95 ${isCameraActive
                ? "bg-surface-elevated text-text-primary border-border hover:opacity-80"
                : "bg-rose-500/20 text-rose-500 border-rose-500/30 shadow-lg"
              }`}
          >
            {isCameraActive ? <Camera size={20} /> : <CameraOff size={20} />}
          </button>
        </div>

        {/* Right Side: Cross to Close */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            onClose();
          }}
          aria-label="Close Scanner"
          className="w-11 h-11 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-text-primary active:scale-95 transition-all cursor-pointer hover:opacity-80"
        >
          <X size={20} />
        </button>
      </div>

      {/* Center: Camera Box (Viewfinder) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden border-2 border-text-primary/70 bg-black shadow-2xl flex items-center justify-center">
          {/* Live Camera Video Stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover transition-opacity duration-200 ${hasCamera && isCameraActive ? "opacity-100" : "opacity-0"
              }`}
          />

          {/* Fallback & Permission Prompt Screen */}
          {(!hasCamera || !isCameraActive || permissionError) && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center bg-black/85 text-white gap-2.5">
              <CameraOff size={32} className="text-zinc-400" />
              <p className="text-xs text-zinc-300 font-medium px-2">
                {permissionError || (isRequesting ? "Starting camera..." : "Camera is turned off")}
              </p>
              <button
                type="button"
                disabled={isRequesting}
                onClick={() => startCamera(facingMode)}
                className="mt-1 px-4 py-2 rounded-full squircle-btn bg-white text-black font-semibold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                <Camera size={14} />
                <span>{isRequesting ? "Requesting..." : "Enable Camera"}</span>
              </button>
            </div>
          )}

          {/* 4 Corner Markers */}
          <div className="absolute top-2.5 left-2.5 w-6 h-6 border-t-4 border-l-4 border-text-primary rounded-tl-lg pointer-events-none" />
          <div className="absolute top-2.5 right-2.5 w-6 h-6 border-t-4 border-r-4 border-text-primary rounded-tr-lg pointer-events-none" />
          <div className="absolute bottom-2.5 left-2.5 w-6 h-6 border-b-4 border-l-4 border-text-primary rounded-bl-lg pointer-events-none" />
          <div className="absolute bottom-2.5 right-2.5 w-6 h-6 border-b-4 border-r-4 border-text-primary rounded-br-lg pointer-events-none" />

          {/* Animated Scanning Beam Line (Active when camera is running) */}
          {hasCamera && isCameraActive && (
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-text-primary to-transparent animate-scan pointer-events-none" />
          )}
        </div>
      </div>

      {/* Bottom: Themed Circular Click/Capture Button + Flip Camera Option beside it */}
      <div
        className="relative z-10 w-full flex items-center justify-center gap-6 pb-8 sm:pb-10"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
      >
        {/* Left balance spacer */}
        <div className="w-12 h-12 flex-shrink-0" />

        {/* Center: Themed Circular Click/Capture Button */}
        <button
          type="button"
          onClick={handlePayClick}
          aria-label="Capture and Scan QR"
          className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-text-primary/70 p-1 flex items-center justify-center active:scale-90 transition-transform cursor-pointer shadow-2xl focus:outline-none flex-shrink-0"
        >
          <div className="w-full h-full rounded-full bg-text-primary shadow-inner active:opacity-75 transition-opacity" />
        </button>

        {/* Side by the click: Flip Camera Option (Rear / Front) */}
        <button
          type="button"
          onClick={handleFlipCamera}
          aria-label={`Flip camera to ${facingMode === "environment" ? "front" : "rear"}`}
          className="w-12 h-12 rounded-full squircle-btn bg-surface-elevated border border-border flex items-center justify-center text-text-primary active:scale-90 transition-transform cursor-pointer shadow-lg hover:opacity-80 flex-shrink-0"
        >
          <SwitchCamera size={22} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
