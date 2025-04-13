import React, { useRef, useState, useEffect } from "react";
import "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_mesh";
import Webcam from "react-webcam";
import FaceDirectionDetector from "./FaceDirectionDetector";

const inputResolution = {
  width: 730,
  height: 640,
};

const videoConstraints = {
  width: inputResolution.width,
  height: inputResolution.height,
  facingMode: "user",
};

function FaceDirectionExample() {
  const canvasRef = useRef(null);
  const webcamRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [options, setOptions] = useState({
    showMesh: false,
    showTagNumbers: false,
    showDirection: false
  });
  const [detector, setDetector] = useState(null);
  const [facePosition, setFacePosition] = useState({ x: 0, y: 0 });

  // Initialize the detector
  useEffect(() => {
    const initializeDetector = async () => {
      const faceDetector = new FaceDirectionDetector(options);
      setDetector(faceDetector);
    };

    initializeDetector();

    // Cleanup on unmount
    return () => {
      if (detector) {
        detector.stop();
      }
    };
  }, []);

  // Update detector options when they change
  useEffect(() => {
    if (detector) {
      detector.setOptions(options);
    }
  }, [options, detector]);

  // Handle video load
  const handleVideoLoad = async (videoNode) => {
    const video = videoNode.target;
    if (video.readyState !== 4) return;
    if (loaded) return;

    if (detector && webcamRef.current && canvasRef.current) {
      await detector.start(
        webcamRef.current.video, 
        canvasRef.current, 
        (data) => {
          // Extract face position from nose tip (keypoint 1)
          if (data && data.keypoints && data.keypoints[1]) {
            setFacePosition({
              x: Math.round(data.keypoints[1].x),
              y: Math.round(data.keypoints[1].y)
            });
          }
        }
      );
      setLoaded(true);
    }
  };

  return (
    <div>
      <div style={{ position: "absolute", visibility: "hidden" }}>
        <Webcam
          ref={webcamRef}
          width={inputResolution.width}
          height={inputResolution.height}
          videoConstraints={videoConstraints}
          onLoadedData={handleVideoLoad}
        />
        
        <canvas
          ref={canvasRef}
          width={inputResolution.width}
          height={inputResolution.height}
        />
      </div>

      <div style={{ 
        position: "absolute", 
        top: "50%", 
        left: "50%", 
        transform: "translate(-50%, -50%)",
        fontSize: "24px",
        fontFamily: "monospace"
      }}>
        {facePosition.x},{facePosition.y}
      </div>
    </div>
  );
}

export default FaceDirectionExample; 