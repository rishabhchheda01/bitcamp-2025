import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { TRIANGULATION } from "./triangulation";

/**
 * FaceDirectionDetector class
 * A reusable class for detecting face landmarks and calculating face direction
 */
class FaceDirectionDetector {
  constructor(options = {}) {
    // Default options
    this.options = {
      runtime: "tfjs",
      showMesh: true,
      showTagNumbers: false,
      showDirection: true,
      drawDelay: 300, // ms
      ...options
    };
    
    this.detector = null;
    this.canvas = null;
    this.video = null;
    this.isRunning = false;
    this.animationId = null;
  }

  /**
   * Initialize the detector
   * @returns {Promise<void>}
   */
  async initialize() {
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detectorConfig = {
      runtime: this.options.runtime,
    };
    
    this.detector = await faceLandmarksDetection.createDetector(
      model,
      detectorConfig
    );
  }

  /**
   * Start the face direction detection process
   * @param {HTMLVideoElement} video - Video element to detect faces from
   * @param {HTMLCanvasElement} canvas - Canvas element to draw on
   * @param {Function} callback - Callback function to receive direction data
   * @returns {Promise<void>}
   */
  async start(video, canvas, callback) {
    if (!this.detector) {
      await this.initialize();
    }
    
    this.video = video;
    this.canvas = canvas;
    this.callback = callback;
    this.isRunning = true;
    
    this.detect();
  }

  /**
   * Stop the detection process
   */
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Set options for the detector
   * @param {Object} options - Options to set
   */
  setOptions(options) {
    this.options = {
      ...this.options,
      ...options
    };
  }

  /**
   * Main detection loop
   */
  async detect() {
    if (!this.isRunning) return;
    
    const estimationConfig = { flipHorizontal: true };
    const faces = await this.detector.estimateFaces(this.video, estimationConfig);
    const ctx = this.canvas.getContext("2d");
    
    setTimeout(() => {
      this.animationId = requestAnimationFrame(() => {
        if (faces && faces.length > 0) {
          const data = this.drawMesh(faces[0], ctx);
          if (this.callback) {
            // Pass the full face data to the callback
            this.callback({
              ...data,
              keypoints: faces[0].keypoints
            });
          }
        }
        
        if (this.isRunning) {
          this.detect();
        }
      });
    }, this.options.drawDelay);
  }

  /**
   * Draw the face mesh on canvas and calculate direction
   * @param {Object} prediction - Face prediction data
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @returns {Object} Direction data
   */
  drawMesh(prediction, ctx) {
    if (!prediction) return;
    const keyPoints = prediction.keypoints;
    if (!keyPoints || keyPoints.length === 0) return;

    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw and calculate
    this.drawFaceMesh(ctx, keyPoints);
    return this.calculateDirection(ctx, keyPoints);
  }

  /**
   * Draw face mesh on canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} keyPoints - Face keypoints
   */
  drawFaceMesh(ctx, keyPoints) {
    if (this.options.showMesh) {
      this.drawMeshPaths(keyPoints, ctx);
    }
    
    if (this.options.showTagNumbers) {
      let index = 0;
      for (let keyPoint of keyPoints) {
        ctx.beginPath();
        ctx.arc(keyPoint.x, keyPoint.y, 1, 0, 3 * Math.PI);
        ctx.fillText(index, keyPoint.x, keyPoint.y);
        ctx.fillStyle = "black";
        ctx.fill();
        index++;
      }
    }
  }

  /**
   * Draw mesh paths on canvas
   * @param {Array} keyPoints - Face keypoints
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  drawMeshPaths(keyPoints, ctx) {
    for (let i = 0; i < TRIANGULATION.length / 3; i++) {
      const points = [
        TRIANGULATION[i * 3],
        TRIANGULATION[i * 3 + 1],
        TRIANGULATION[i * 3 + 2],
      ].map((index) => keyPoints[index]);
      
      this.drawPath(ctx, points, true);
    }
  }

  /**
   * Draw a path on canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} points - Points to draw
   * @param {boolean} closePath - Whether to close the path
   */
  drawPath(ctx, points, closePath) {
    const region = new Path2D();
    region.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      region.lineTo(point.x, point.y);
    }
    
    if (closePath) {
      region.closePath();
    }
    
    ctx.strokeStyle = "black";
    ctx.stroke(region);
  }

  /**
   * Calculate face direction based on keypoints
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} keyPoints - Face keypoints
   * @returns {Object} Direction data
   */
  calculateDirection(ctx, keyPoints) {
    let noseTip, leftNose, rightNose;
    
    try {
      noseTip = { ...keyPoints[1], name: "nose tip" };
      leftNose = { ...keyPoints[279], name: "left nose" };
      rightNose = { ...keyPoints[49], name: "right nose" };
    } catch (error) {
      console.log("Error creating directional points", keyPoints, error);
      return null;
    }

    // Midsection of nose is back of nose perpendicular
    const midpoint = {
      x: (leftNose.x + rightNose.x) / 2,
      y: (leftNose.y + rightNose.y) / 2,
      z: (leftNose.z + rightNose.z) / 2,
    };
    
    const perpendicularUp = { 
      x: midpoint.x, 
      y: midpoint.y - 50, 
      z: midpoint.z 
    };

    // Calculate angles
    const yaw = this.getAngleBetweenLines(midpoint, noseTip, perpendicularUp);
    const turn = this.getAngleBetweenLines(midpoint, rightNose, noseTip);

    if (this.options.showDirection) {
      // Draw the direction indicators
      this.drawDirectionIndicators(ctx, noseTip, leftNose, rightNose, midpoint, perpendicularUp, yaw, turn);
    }

    // Calculate distance between nose tip and midpoint, and left and right nose points
    const zDistance = this.getDistanceBetweenPoints(noseTip, midpoint);
    const xDistance = this.getDistanceBetweenPoints(leftNose, rightNose);

    return { yaw, turn, zDistance, xDistance };
  }

  /**
   * Draw direction indicators on canvas
   */
  drawDirectionIndicators(ctx, noseTip, leftNose, rightNose, midpoint, perpendicularUp, yaw, turn) {
    // Draw the turn angle
    const region2 = new Path2D();
    region2.moveTo(leftNose.x, leftNose.y);
    region2.lineTo(noseTip.x, noseTip.y);
    region2.lineTo(rightNose.x, rightNose.y);
    region2.lineTo(midpoint.x, midpoint.y);
    region2.lineTo(leftNose.x, leftNose.y);
    region2.closePath();
    ctx.fillStyle = "brown";
    ctx.stroke(region2);
    ctx.fillText(Math.trunc(turn) + "°", rightNose.x + 10, rightNose.y);
    ctx.fill(region2);

    // Draw the yaw angle
    const region = new Path2D();
    region.moveTo(midpoint.x, midpoint.y);
    region.lineTo(perpendicularUp.x, perpendicularUp.y);
    region.lineTo(noseTip.x, noseTip.y);
    region.lineTo(midpoint.x, midpoint.y);
    region.closePath();
    ctx.fillStyle = "red";
    ctx.stroke(region);
    ctx.fillText(Math.trunc(yaw) + "°", midpoint.x + 10, midpoint.y);
    ctx.fill(region);
  }

  /**
   * Calculate distance between two points
   * @param {Object} point1 - First point
   * @param {Object} point2 - Second point
   * @returns {number} Distance
   */
  getDistanceBetweenPoints(point1, point2) {
    const xDistance = point1.x - point2.x;
    const yDistance = point1.y - point2.y;
    return Math.sqrt(xDistance * xDistance + yDistance * yDistance);
  }

  /**
   * Calculate angle between two lines with common midpoint
   * @param {Object} midpoint - Common point of both lines
   * @param {Object} point1 - End point of first line
   * @param {Object} point2 - End point of second line
   * @returns {number} Angle in degrees
   */
  getAngleBetweenLines(midpoint, point1, point2) {
    const vector1 = { x: point1.x - midpoint.x, y: point1.y - midpoint.y };
    const vector2 = { x: point2.x - midpoint.x, y: point2.y - midpoint.y };

    // Calculate the dot product of the two vectors
    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;

    // Calculate the magnitudes of the vectors
    const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

    // Calculate the cosine of the angle between the two vectors
    const cosineTheta = dotProduct / (magnitude1 * magnitude2);

    // Use the arccosine function to get the angle in radians
    const angleInRadians = Math.acos(cosineTheta);

    // Convert the angle to degrees
    const angleInDegrees = (angleInRadians * 180) / Math.PI;

    return angleInDegrees;
  }
}

export default FaceDirectionDetector; 