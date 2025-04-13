import React, { useState, useEffect } from 'react';
import { RetellWebClient } from "retell-client-js-sdk";

function App() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [retellWebClient, setRetellWebClient] = useState(null);
  const [eventStatus, setEventStatus] = useState({
    callStarted: false,
    callEnded: false,
    agentStartTalking: false,
    agentStopTalking: false,
    error: null,
    transcript: ''
  });
  const [micPermission, setMicPermission] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [callInfo, setCallInfo] = useState(null);

  // Agent ID for Retell
  const AGENT_ID = "agent_30b1b504a89d37e3109a7da3e9";
  
  // Server endpoint for token generation
  const TOKEN_SERVER_URL = "https://retell-custom-functions-api-2.azurewebsites.net/api/generate-token";

  useEffect(() => {
    // Initialize the RetellWebClient
    const client = new RetellWebClient();
    setRetellWebClient(client);
    
    // Check for microphone permissions
    checkMicrophonePermission();
    
    // Set up event listeners
    client.on("call_started", () => {
      console.log("call started");
      setEventStatus(prev => ({ ...prev, callStarted: true, callEnded: false }));
    });

    client.on("call_ended", () => {
      console.log("call ended");
      setIsCallActive(false);
      setEventStatus(prev => ({ ...prev, callEnded: true }));
    });

    client.on("agent_start_talking", () => {
      console.log("agent_start_talking");
      setEventStatus(prev => ({ ...prev, agentStartTalking: true, agentStopTalking: false }));
    });

    client.on("agent_stop_talking", () => {
      console.log("agent_stop_talking");
      setEventStatus(prev => ({ ...prev, agentStopTalking: true, agentStartTalking: false }));
    });

    client.on("update", (update) => {
      console.log("Update received:", update);
      if (update.transcript) {
        // Check if transcript is an object with role and content properties
        if (typeof update.transcript === 'object' && update.transcript.role && update.transcript.content) {
          // Extract the content text
          setEventStatus(prev => ({ ...prev, transcript: update.transcript.content }));
        } 
        // Check if transcript is an array of message objects
        else if (Array.isArray(update.transcript)) {
          // Map through messages and format them
          const formattedTranscript = update.transcript
            .map(msg => {
              if (typeof msg === 'object' && msg.role && msg.content) {
                return `${msg.role}: ${msg.content}`;
              }
              return String(msg); // Convert to string if it's some other type
            })
            .join('\n');
          setEventStatus(prev => ({ ...prev, transcript: formattedTranscript }));
        } 
        // If it's a string or can be converted to string
        else {
          setEventStatus(prev => ({ ...prev, transcript: String(update.transcript) }));
        }
      }
    });

    client.on("metadata", (metadata) => {
      console.log("Metadata received:", metadata);
    });

    client.on("error", (error) => {
      console.error("An error occurred:", error);
      setEventStatus(prev => ({ ...prev, error: error.message || "Unknown error" }));
      client.stopCall();
    });
    
    // Clean up event listeners on component unmount
    return () => {
      if (client) {
        client.stopCall();
      }
    };
  }, []);
  
  // Function to generate an access token from the server
  const generateAccessToken = async () => {
    try {
      setIsGeneratingToken(true);
      setEventStatus(prev => ({ ...prev, error: null }));
      console.log("Requesting access token from server...");
      
      // Make the API call to our server endpoint
      const response = await fetch(TOKEN_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: AGENT_ID,
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.access_token) {
        throw new Error("No access token received from server");
      }
      
      console.log("Access token received from server:", data.access_token);
      setAccessToken(data.access_token);
      setCallInfo(data); // Store the full call info for reference
      setIsGeneratingToken(false);
      
      return data.access_token;
    } catch (error) {
      console.error("Failed to generate access token:", error);
      setEventStatus(prev => ({ ...prev, error: error.message || "Failed to generate access token" }));
      setIsGeneratingToken(false);
      return null;
    }
  };
  
  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      // Stop the stream tracks immediately
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setMicPermission('denied');
    }
  };
  
  const requestMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      return true;
    } catch (error) {
      console.error('Failed to get microphone permission:', error);
      setMicPermission('denied');
      return false;
    }
  };
  
  const startCall = async () => {
    if (!retellWebClient || isCallActive) return;
    
    // First ensure we have microphone permissions
    if (micPermission !== 'granted') {
      const permissionGranted = await requestMicrophonePermission();
      if (!permissionGranted) {
        alert('Microphone permission is required to start a call');
        return;
      }
    }
    
    try {
      // Reset event status
      setEventStatus({
        callStarted: false,
        callEnded: false,
        agentStartTalking: false,
        agentStopTalking: false,
        error: null,
        transcript: ''
      });
      
      // Ensure we have a valid token
      if (!accessToken) {
        const token = await generateAccessToken();
        if (!token) {
          throw new Error("Failed to generate a valid access token");
        }
      }
      
      console.log("Starting call with access token...");
      
      // Start the call using the access token
      await retellWebClient.startCall({
        accessToken: accessToken,
        sampleRate: 24000,
        captureDeviceId: "default",
        emitRawAudioSamples: false,
      });
      
      setIsCallActive(true);
    } catch (error) {
      console.error("Failed to start call:", error);
      setEventStatus(prev => ({ ...prev, error: error.message || "Failed to start call" }));
    }
  };
  
  const stopCall = () => {
    if (retellWebClient && isCallActive) {
      retellWebClient.stopCall();
      setIsCallActive(false);
    }
  };
  
  // Function to check if token is expired (tokens are valid for 30 seconds)
  const isTokenExpired = () => {
    // If we don't have token info, consider it expired
    if (!accessToken || !callInfo) return true;
    
    // Track when we received the token in our application
    if (!callInfo._tokenReceivedTime) {
      // If this is the first time checking, add a timestamp of when we received it
      callInfo._tokenReceivedTime = Date.now();
      setCallInfo({...callInfo}); // Update the state to save this timestamp
      return false; // Token is fresh
    }
    
    // Calculate how long ago we received the token
    const tokenReceivedTime = callInfo._tokenReceivedTime;
    const currentTime = Date.now();
    const tokenAgeInSeconds = (currentTime - tokenReceivedTime) / 1000;
    
    // Token expires after 30 seconds, but we consider it expired at 25s
    // to give us a buffer to generate a new one
    return tokenAgeInSeconds > 25;
  };
  
  return (
    <div className="App" style={{ textAlign: 'center', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Retell Voice Demo</h1>
      
      <div style={{ margin: '20px 0', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>Microphone Permission: {micPermission === 'granted' ? '✅ Granted' : micPermission === 'denied' ? '❌ Denied' : '❓ Unknown'}</h3>
        {micPermission !== 'granted' && (
          <button 
            onClick={requestMicrophonePermission}
            style={{ 
              padding: '8px 15px', 
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Request Mic Permission
          </button>
        )}
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={!accessToken || isTokenExpired() ? generateAccessToken : startCall} 
          disabled={isCallActive || isGeneratingToken}
          style={{ 
            padding: '10px 20px', 
            margin: '0 10px', 
            backgroundColor: isCallActive || isGeneratingToken ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isCallActive || isGeneratingToken ? 'default' : 'pointer'
          }}
        >
          {!accessToken || isTokenExpired() ? "Generate Token" : isGeneratingToken ? "Generating..." : "Start Call with Agent"}
        </button>
        <button 
          onClick={stopCall} 
          disabled={!isCallActive}
          style={{ 
            padding: '10px 20px', 
            margin: '0 10px',
            backgroundColor: !isCallActive ? '#ccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !isCallActive ? 'default' : 'pointer'
          }}
        >
          Stop Call
        </button>
      </div>
      
      <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'left' }}>
        <h3>Call Status: {isCallActive ? '🟢 Active' : '🔴 Inactive'}</h3>
        <div style={{ marginTop: '10px' }}>
          <p><strong>Agent ID:</strong> {AGENT_ID}</p>
          {accessToken && (
            <div>
              <p>
                <strong>Access Token:</strong> {accessToken.substring(0, 8)}...
                {accessToken.substring(accessToken.length-4)}
                {isTokenExpired() && <span style={{color: 'red'}}> (Expired)</span>}
              </p>
              {callInfo && callInfo.call_id && (
                <p><strong>Call ID:</strong> {callInfo.call_id}</p>
              )}
            </div>
          )}
        </div>
        <div style={{ marginTop: '10px' }}>
          <p><strong>Connection Info:</strong></p>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            <li>🔑 {accessToken ? 
              (isTokenExpired() ? "Token expired (valid for 30 seconds)" : "Using valid access token") 
              : "No token generated yet"}
            </li>
            <li>🔒 Token generated via server using Retell SDK</li>
          </ul>
        </div>
        <div style={{ marginTop: '10px' }}>
          <p><strong>Event Status:</strong></p>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            <li>🎤 Call Started: {eventStatus.callStarted ? '✅ Yes' : '❌ No'}</li>
            <li>🛑 Call Ended: {eventStatus.callEnded ? '✅ Yes' : '❌ No'}</li>
            <li>🗣️ Agent Talking: {eventStatus.agentStartTalking && !eventStatus.agentStopTalking ? '✅ Yes' : '❌ No'}</li>
            {eventStatus.error && (
              <li style={{ color: 'red', marginTop: '10px', padding: '5px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
                ⚠️ Error: {eventStatus.error}
              </li>
            )}
          </ul>
        </div>
        {eventStatus.transcript && (
          <div style={{ marginTop: '10px', maxHeight: '150px', overflowY: 'auto', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            <p><strong>Latest Transcript:</strong></p>
            <p style={{ whiteSpace: 'pre-line' }}>{eventStatus.transcript}</p>
          </div>
        )}
      </div>
      <div style={{ margin: '20px 0', fontSize: '12px', color: '#666' }}>
        <p>Debug Info: Check console for detailed logs</p>
      </div>
    </div>
  );
}

export default App;