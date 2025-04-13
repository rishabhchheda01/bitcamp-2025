import React, { useRef, useState, useEffect } from "react";
import "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_mesh";
import Webcam from "react-webcam";
import FaceDirectionDetector from "./face_detection/FaceDirectionDetector";

const inputResolution = {
  width: 640,
  height: 480,
};

const videoConstraints = {
  width: inputResolution.width,
  height: inputResolution.height,
  facingMode: "user",
};

function FaceDirectionComponent() {
  const canvasRef = useRef(null);
  const webcamRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [detector, setDetector] = useState(null);
  const [faceData, setFaceData] = useState({
    position: { x: 0, y: 0 },
    direction: { yaw: 0, turn: 0 },
    horizontalDirection: "center",
    verticalDirection: "center"
  });
  const lastDirectionRef = useRef({ horizontal: "center", vertical: "center" });
  const keyPressTimerRef = useRef(null);
  const sequenceTimerRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initialize the detector
  useEffect(() => {
    const initializeDetector = async () => {
      const options = {
        showMesh: false,
        showTagNumbers: false,
        showDirection: false
      };
      const faceDetector = new FaceDirectionDetector(options);
      setDetector(faceDetector);
    };

    initializeDetector();

    // Cleanup on unmount
    return () => {
      if (detector) {
        detector.stop();
      }
      // Clear any active timers
      if (keyPressTimerRef.current) {
        clearInterval(keyPressTimerRef.current);
      }
      if (sequenceTimerRef.current) {
        clearTimeout(sequenceTimerRef.current);
      }
    };
  }, []);

  // Check sidebar state - run once on component mount and then on any DOM changes
  useEffect(() => {
    // Function to check if sidebar is open
    const checkSidebar = () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        const isOpen = sidebar.classList.contains('open');
        setIsSidebarOpen(isOpen);
      }
    };

    // Initial check
    checkSidebar();

    // Set up a MutationObserver to watch for changes to the sidebar class
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkSidebar();
        }
      });
    });

    // Start observing the sidebar
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      observer.observe(sidebar, { attributes: true });
    }

    // Clean up the observer on component unmount
    return () => {
      observer.disconnect();
    };
  }, []);

  // Determine horizontal direction based on x coordinate
  const determineHorizontalDirection = (x) => {
    if (x < 250) {
      return "left";
    } else if (x > 450) {
      return "right";
    } else {
      return "center";
    }
  };

  // Determine vertical direction based on y coordinate
  const determineVerticalDirection = (y) => {
    if (y < 200) {
      return "up";
    } else if (y > 350) {
      return "down";
    } else {
      return "center";
    }
  };

  // Simulate keyboard press for regular keys
  const simulateKeyPress = (key) => {
    try {
      // Create keydown event
      const keyDownEvent = new KeyboardEvent('keydown', {
        key: key,
        code: `Key${key.toUpperCase()}`,
        keyCode: key.charCodeAt(0),
        which: key.charCodeAt(0),
        bubbles: true,
        cancelable: true
      });
      
      // Dispatch the event
      document.dispatchEvent(keyDownEvent);
      
      // Log the key press
      console.log(`Key ${key} pressed based on face direction`);
      
      // Create and dispatch keyup event after a short delay
      setTimeout(() => {
        const keyUpEvent = new KeyboardEvent('keyup', {
          key: key,
          code: `Key${key.toUpperCase()}`,
          keyCode: key.charCodeAt(0),
          which: key.charCodeAt(0),
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(keyUpEvent);
      }, 100);
    } catch (error) {
      console.error("Error simulating key press:", error);
    }
  };

  // Simulate arrow key press
  const simulateArrowKeyPress = (direction) => {
    try {
      // Map direction to arrow key
      const arrowKey = direction === 'left' ? 'ArrowLeft' : 
                       direction === 'right' ? 'ArrowRight' : 
                       direction === 'up' ? 'ArrowUp' : 
                       'ArrowDown';
                       
      // Create keydown event for arrow key
      const keyDownEvent = new KeyboardEvent('keydown', {
        key: arrowKey,
        code: arrowKey,
        keyCode: arrowKey === 'ArrowLeft' ? 37 : 
                 arrowKey === 'ArrowUp' ? 38 : 
                 arrowKey === 'ArrowRight' ? 39 : 40,
        which: arrowKey === 'ArrowLeft' ? 37 : 
               arrowKey === 'ArrowUp' ? 38 : 
               arrowKey === 'ArrowRight' ? 39 : 40,
        bubbles: true,
        cancelable: true
      });
      
      // Dispatch the event
      document.dispatchEvent(keyDownEvent);
      
      // Log the key press
      console.log(`Arrow key ${arrowKey} pressed based on face direction`);
      
      // Create and dispatch keyup event after a short delay
      setTimeout(() => {
        const keyUpEvent = new KeyboardEvent('keyup', {
          key: arrowKey,
          code: arrowKey,
          keyCode: arrowKey === 'ArrowLeft' ? 37 : 
                   arrowKey === 'ArrowUp' ? 38 : 
                   arrowKey === 'ArrowRight' ? 39 : 40,
          which: arrowKey === 'ArrowLeft' ? 37 : 
                 arrowKey === 'ArrowUp' ? 38 : 
                 arrowKey === 'ArrowRight' ? 39 : 40,
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(keyUpEvent);
      }, 100);
    } catch (error) {
      console.error(`Error simulating arrow key press for ${direction}:`, error);
    }
  };

  // Get key for direction
  const getKeyForDirection = (horizontalDir, verticalDir) => {
    if (horizontalDir === "left") return 'l';
    if (horizontalDir === "right") return 'r';
    if (verticalDir === "up") return 'u';
    if (verticalDir === "down") return 'd';
    return null;
  };

  // Handle sequential key presses for multiple directions
  const handleDirectionChanges = () => {
    // Clear any existing timer
    if (keyPressTimerRef.current) {
      clearInterval(keyPressTimerRef.current);
      keyPressTimerRef.current = null;
    }
    
    if (sequenceTimerRef.current) {
      clearTimeout(sequenceTimerRef.current);
      sequenceTimerRef.current = null;
    }
    
    // Check if we have any direction to handle
    const horizontalDir = faceData.horizontalDirection;
    const verticalDir = faceData.verticalDirection;
    
    // Store current directions to ref for next comparison
    lastDirectionRef.current = {
      horizontal: horizontalDir,
      vertical: verticalDir
    };
    
    // Determine if we need to handle multiple directions sequentially
    const hasHorizontalMovement = horizontalDir !== "center";
    const hasVerticalMovement = verticalDir !== "center";
    
    // First handle horizontal direction if it's not center
    if (hasHorizontalMovement) {
      const horizontalKey = horizontalDir === "left" ? 'l' : 'r';
      
      // Press both the letter key and the arrow key
      simulateKeyPress(horizontalKey);
      simulateArrowKeyPress(horizontalDir);
      
      // Set up interval for continuous horizontal key presses
      keyPressTimerRef.current = setInterval(() => {
        simulateKeyPress(horizontalKey);
        simulateArrowKeyPress(horizontalDir);
      }, 300);
      
      // If we also have vertical movement, handle it after horizontal
      if (hasVerticalMovement) {
        // After 1 second, switch to vertical direction
        sequenceTimerRef.current = setTimeout(() => {
          // Stop horizontal key presses
          if (keyPressTimerRef.current) {
            clearInterval(keyPressTimerRef.current);
            keyPressTimerRef.current = null;
          }
          
          // Start vertical key presses
          const verticalKey = verticalDir === "up" ? 'u' : 'd';
          simulateKeyPress(verticalKey);
          simulateArrowKeyPress(verticalDir);
          
          keyPressTimerRef.current = setInterval(() => {
            simulateKeyPress(verticalKey);
            simulateArrowKeyPress(verticalDir);
          }, 300);
        }, 300); // 1 second delay before switching directions
      }
    }
    // If only vertical direction is detected, handle it immediately
    else if (hasVerticalMovement) {
      const verticalKey = verticalDir === "up" ? 'u' : 'd';
      
      // Press both the letter key and the arrow key
      simulateKeyPress(verticalKey);
      simulateArrowKeyPress(verticalDir);
      
      // Set up interval for continuous vertical key presses
      keyPressTimerRef.current = setInterval(() => {
        simulateKeyPress(verticalKey);
        simulateArrowKeyPress(verticalDir);
      }, 300);
    }
    // If neither direction is active, do nothing (center position)
  };

  // Effect to handle direction changes and trigger key presses
  useEffect(() => {
    // Check if either direction has changed
    if (faceData.horizontalDirection !== lastDirectionRef.current.horizontal || 
        faceData.verticalDirection !== lastDirectionRef.current.vertical) {
      
      handleDirectionChanges();
    }
  }, [faceData.horizontalDirection, faceData.verticalDirection]);

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
          // Update face data when detection occurs
          if (data && data.keypoints && data.keypoints[1]) {
            const x = Math.round(data.keypoints[1].x);
            const y = Math.round(data.keypoints[1].y);
            const horizontalDirection = determineHorizontalDirection(x);
            const verticalDirection = determineVerticalDirection(y);
            
            setFaceData({
              position: { x, y },
              direction: {
                yaw: Math.round(data.yaw || 0),
                turn: Math.round(data.turn || 0)
              },
              horizontalDirection,
              verticalDirection
            });
          }
        }
      );
      setLoaded(true);
    }
  };

  // Helper function to get active key display text
  const getActiveKeyText = () => {
    const { horizontalDirection, verticalDirection } = faceData;
    const hasHorizontal = horizontalDirection !== "center";
    const hasVertical = verticalDirection !== "center";
    
    if (hasHorizontal && hasVertical) {
      const hKey = horizontalDirection === "left" ? "'l' + ←" : "'r' + →";
      const vKey = verticalDirection === "up" ? "'u' + ↑" : "'d' + ↓";
      return ``;
    } else if (hasHorizontal) {
      const hKey = horizontalDirection === "left" ? "'l' + ←" : "'r' + →";
      return ``;
    } else if (hasVertical) {
      const vKey = verticalDirection === "up" ? "'u' + ↑" : "'d' + ↓";
      return ``;
    } else {
      return "";
    }
  };

  return (
    <div>
      {/* Hidden webcam and canvas for detection */}
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

      {/* Simple display of face data - only show when sidebar is closed */}
      {!isSidebarOpen && (
        <div style={{ 
          position: "fixed", 
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "#00f2fe",
          padding: "8px 16px",
          borderRadius: "8px",
          fontFamily: "monospace",
          fontSize: "14px",
          zIndex: 1000,
          display: "flex",
          gap: "16px"
        }}>
          <div>
            Position: x={faceData.position.x}, y={faceData.position.y}
          </div>
          <div>
            Direction: H:{faceData.horizontalDirection.toUpperCase()} V:{faceData.verticalDirection.toUpperCase()} {getActiveKeyText()}
          </div>
          <div>
            Angles: yaw={faceData.direction.yaw}°, turn={faceData.direction.turn}°
          </div>
        </div>
      )}
    </div>
  );
}

export default FaceDirectionComponent; 