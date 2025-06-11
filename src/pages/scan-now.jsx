// src/pages/ScanNow.jsx
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const ScanNow = () => {
  const qrCodeRegionId = "qr-reader";
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const html5QrCodeRef = useRef(null);

  const startScanning = async () => {
    setError(null);
    setScanning(true);

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    setTimeout(async () => {
      html5QrCodeRef.current = new Html5Qrcode(qrCodeRegionId);
      try {
        await html5QrCodeRef.current.start(
          { facingMode: "environment" }, // or "user" for front
          config,
          (decodedText) => {
            console.log("✅ QR Code Scanned:", decodedText);
            alert(`Scanned: ${decodedText}`);
            stopScanning();
          },
          (errorMsg) => {
            // Ignore scan errors
            console.log("Scan error:", errorMsg);
          }
        );
      } catch (err) {
        console.error("❌ Camera error:", err);
        setError("Camera access denied or unavailable.");
        setScanning(false);
      }
    }, 100); // slight delay to ensure DOM mounts
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Error stopping QR scanner:", err);
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current.clear();
        });
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4">
      <h2 className="text-3xl font-bold mb-6">📷 Scan Now</h2>

      {!scanning && (
        <button
          onClick={startScanning}
          className="bg-yellow-400 text-black px-6 py-3 rounded-lg shadow hover:bg-yellow-300 transition"
        >
          Click to Scan QR
        </button>
      )}

      {scanning && (
        <div className="mt-6 w-full max-w-md">
          <div
            id={qrCodeRegionId}
            className="w-full h-[350px] bg-white rounded shadow-lg"
          ></div>
          <button
            onClick={stopScanning}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
          >
            Stop Scanning
          </button>
        </div>
      )}

      {error && <p className="text-red-300 mt-4">{error}</p>}
    </div>
  );
};

export default ScanNow;
