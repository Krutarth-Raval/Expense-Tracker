"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Zap, ZapOff } from "lucide-react";
import jsQR from "jsqr";

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
    } catch {}
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
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [detectedMerchant, setDetectedMerchant] = useState<ScannedMerchant>({
    merchantName: "UPI Merchant",
    merchantUpi: "merchant@upi",
  });

  // Stop camera stream tracks
  const stopCameraTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

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
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
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
          videoRef.current.play().catch(() => {});
        }
        setHasCamera(true);
      })
      .catch((err) => {
        console.warn("Camera access not available or denied:", err);
        if (isMounted) {
          setHasCamera(false);
        }
      });

    return () => {
      isMounted = false;
      stopCameraTracks();
    };
  }, [isOpen, stopCameraTracks]);

  // Live real-time QR code detection from video frames using optimized jsQR
  useEffect(() => {
    if (!isOpen || !hasCamera) return;

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
  }, [isOpen, hasCamera]);

  // Toggle Torch/Flashlight
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
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
        console.warn("Failed to toggle torch constraint:", e);
        setIsTorchOn((prev) => !prev);
      }
    }
  };

  // Capture snapshot, run high-resolution QR decode, and proceed to payment modal
  const handlePayClick = () => {
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
      {/* Top Header: Torch on Left, Close Cross on Right (Strictly themed, zero text) */}
      <div
        className="relative z-10 w-full flex items-center justify-between px-5 sm:px-6 py-4"
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
      >
        {/* Left Side: Torch Option */}
        <button
          type="button"
          onClick={handleToggleTorch}
          aria-label="Toggle Torch"
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all cursor-pointer active:scale-95 ${
            isTorchOn
              ? "bg-text-primary text-background border-text-primary shadow-lg"
              : "bg-surface-elevated text-text-primary border-border hover:opacity-80"
          }`}
        >
          {isTorchOn ? <Zap size={20} /> : <ZapOff size={20} />}
        </button>

        {/* Right Side: Cross to Cancel */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Scanner"
          className="w-11 h-11 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-text-primary active:scale-95 transition-all cursor-pointer hover:opacity-80"
        >
          <X size={20} />
        </button>
      </div>

      {/* Center: Camera Box ONLY (Contained video stream) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden border-2 border-text-primary/70 bg-black shadow-2xl flex items-center justify-center">
          {/* Live Camera Video Stream is strictly contained inside the box */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              hasCamera ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* 4 Corner Markers */}
          <div className="absolute top-2.5 left-2.5 w-6 h-6 border-t-4 border-l-4 border-text-primary rounded-tl-lg pointer-events-none" />
          <div className="absolute top-2.5 right-2.5 w-6 h-6 border-t-4 border-r-4 border-text-primary rounded-tr-lg pointer-events-none" />
          <div className="absolute bottom-2.5 left-2.5 w-6 h-6 border-b-4 border-l-4 border-text-primary rounded-bl-lg pointer-events-none" />
          <div className="absolute bottom-2.5 right-2.5 w-6 h-6 border-b-4 border-r-4 border-text-primary rounded-br-lg pointer-events-none" />

          {/* Animated Scanning Beam Line */}
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-text-primary to-transparent animate-scan pointer-events-none" />
        </div>
      </div>

      {/* Bottom: Themed Circular Click/Capture Button (Zero text) */}
      <div
        className="relative z-10 w-full flex items-center justify-center pb-8 sm:pb-10"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={handlePayClick}
          aria-label="Capture and Scan QR"
          className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-text-primary/70 p-1 flex items-center justify-center active:scale-90 transition-transform cursor-pointer shadow-2xl focus:outline-none"
        >
          <div className="w-full h-full rounded-full bg-text-primary shadow-inner active:opacity-75 transition-opacity" />
        </button>
      </div>
    </div>
  );
}
