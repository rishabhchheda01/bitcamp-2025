import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const SplineViewer = forwardRef(({ url, options, persistOnUpdate = false }, ref) => {
  const containerRef = useRef(null);
  const splineElementRef = useRef(null);
  const iframeRef = useRef(null);
  const isInitializedRef = useRef(false);
  const splineLoadedRef = useRef(false);

  // Enhanced function to send keyboard events to Spline iframe using multiple methods
  const sendKeyboardEvent = (type, key) => {
    try {
      if (iframeRef.current) {
        const iframeWindow = iframeRef.current.contentWindow;
        if (iframeWindow) {
          // Method 1: Try using postMessage to communicate with iframe
          iframeWindow.postMessage({
            type: 'spline-keyboard-event',
            eventType: type,
            key: key
          }, '*');
          
          // Method 2: Try to directly interact with iframe document
          try {
            const iframeDoc = iframeRef.current.contentDocument || iframeWindow.document;
            
            // Create a standard KeyboardEvent
            const event = new KeyboardEvent(type, {
              key: key,
              code: `Key${key.toUpperCase()}`,
              keyCode: key.charCodeAt(0),
              which: key.charCodeAt(0),
              bubbles: true,
              cancelable: true,
              composed: true
            });
            
            // Dispatch to document
            iframeDoc.dispatchEvent(event);
            
            // Method 3: Try to find the canvas element within Spline iframe (common for 3D scenes)
            const canvas = iframeDoc.querySelector('canvas');
            if (canvas) {
              canvas.dispatchEvent(event);
              canvas.focus();
            }
            
            // Method 4: Try to dispatch to document.body
            if (iframeDoc.body) {
              iframeDoc.body.dispatchEvent(event);
            }
            
            // Method 5: Try to dispatch to window
            iframeWindow.dispatchEvent(event);
          } catch (e) {
            console.warn("Couldn't dispatch direct event to iframe:", e);
          }
          
          // Method 6: Use direct window.eval within iframe (most intrusive but often effective)
          try {
            iframeWindow.eval(`
              document.dispatchEvent(new KeyboardEvent('${type}', {
                key: '${key}',
                code: 'Key${key.toUpperCase()}',
                keyCode: ${key.charCodeAt(0)},
                which: ${key.charCodeAt(0)},
                bubbles: true,
                cancelable: true
              }));
              console.log('Spline received ${key} via eval');
            `);
          } catch (e) {
            console.warn("Couldn't use eval in iframe:", e);
          }
        }
      }
      
      // Also dispatch to parent window as backup
      window.dispatchEvent(new KeyboardEvent(type, {
        key: key,
        code: `Key${key.toUpperCase()}`,
        keyCode: key.charCodeAt(0),
        which: key.charCodeAt(0),
        bubbles: true,
        cancelable: true
      }));
      
      // Log for debugging
      console.log(`Attempted to send ${type} event for key ${key} to Spline`);
    } catch (e) {
      console.error("Error sending keyboard event to iframe:", e);
    }
  };

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    getSplineElement: () => splineElementRef.current,
    getContainer: () => containerRef.current,
    getIframe: () => iframeRef.current,
    // Original combined method (for backward compatibility)
    sendKey: (key) => {
      sendKeyboardEvent('keydown', key);
      setTimeout(() => {
        sendKeyboardEvent('keyup', key);
      }, 100);
    },
    // Separate methods for keydown and keyup to support longer press durations
    sendKeyDown: (key) => {
      sendKeyboardEvent('keydown', key);
    },
    sendKeyUp: (key) => {
      sendKeyboardEvent('keyup', key);
    },
    isLoaded: () => splineLoadedRef.current
  }));

  // Listen for iframe elements being added to the DOM
  const observeIframe = () => {
    if (!containerRef.current) return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check each added node
          mutation.addedNodes.forEach((node) => {
            // Direct iframe detection
            if (node.tagName === 'IFRAME') {
              setupIframe(node);
            } else {
              // Look for iframes deeper in the added nodes
              const iframes = node.querySelectorAll('iframe');
              iframes.forEach(iframe => setupIframe(iframe));
            }
          });
        }
      });
    });
    
    observer.observe(containerRef.current, { childList: true, subtree: true });
    return observer;
  };
  
  // Setup and configure an iframe when found
  const setupIframe = (iframe) => {
    console.log('Spline iframe found');
    iframeRef.current = iframe;
    
    // Add listeners once the iframe is loaded
    iframe.addEventListener('load', () => {
      console.log('Spline iframe loaded');
      splineLoadedRef.current = true;
      
      // Focus the iframe
      setTimeout(() => {
        iframe.focus();
        
        // Try to find and focus the canvas inside iframe
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          const canvas = iframeDoc.querySelector('canvas');
          if (canvas) {
            canvas.focus();
          }
        } catch (e) {
          console.warn("Couldn't focus canvas in iframe:", e);
        }
      }, 500);
      
      // Test the keyboard event system with a longer press duration
      setTimeout(() => {
        // Send keydown
        sendKeyboardEvent('keydown', 'u');
        
        // Send keyup after 500ms (simulating a half-second press)
        setTimeout(() => {
          sendKeyboardEvent('keyup', 'u');
        }, 500);
      }, 1000);
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    // If we should persist and we already have a Spline instance, don't recreate
    if (persistOnUpdate && isInitializedRef.current && splineElementRef.current) {
      return;
    }
    
    // Clean up any existing spline-viewer elements if not persisting
    const existingViewer = containerRef.current.querySelector('spline-viewer');
    if (existingViewer && (!persistOnUpdate || !isInitializedRef.current)) {
      existingViewer.remove();
    }

    // If already initialized and should persist, don't continue
    if (persistOnUpdate && isInitializedRef.current) {
      return;
    }
    
    // Create a new spline-viewer element
    const splineViewer = document.createElement('spline-viewer');
    splineElementRef.current = splineViewer;
    
    // Set the URL attribute
    splineViewer.setAttribute('url', url);
    
    // Add an empty keyboard handler to ensure Spline accepts keyboard events
    splineViewer.addEventListener('keydown', (e) => {
      console.log(`Spline viewer received keydown: ${e.key}`);
    });
    
    splineViewer.addEventListener('keyup', (e) => {
      console.log(`Spline viewer received keyup: ${e.key}`);
    });
    
    // Set additional options if provided
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value === true) {
          splineViewer.setAttribute(key, '');
        } else if (value !== false) {
          splineViewer.setAttribute(key, value);
        }
      });
    }
    
    // Append the viewer to the container
    containerRef.current.appendChild(splineViewer);
    
    // Load the Spline viewer script if not already loaded
    if (!document.querySelector('script[src*="@splinetool/viewer"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.9.82/build/spline-viewer.js';
      document.head.appendChild(script);
    }

    // Observe for iframe creation
    const observer = observeIframe();
    
    // Try to locate any existing iframes - they might already be there
    const existingIframes = containerRef.current.querySelectorAll('iframe');
    if (existingIframes.length > 0) {
      setupIframe(existingIframes[0]);
    }

    // Mark as initialized
    isInitializedRef.current = true;
    
    // Set up event listeners for parent-window keyboard events
    const handleKeyEvent = (e) => {
      // We're only listening for our specific keys
      if (['u', 'd', 'l', 'r'].includes(e.key)) {
        console.log(`Parent window received key: ${e.key}`);
        // We don't need to do anything here as we're just debugging
      }
    };
    
    window.addEventListener('keydown', handleKeyEvent);
    window.addEventListener('keyup', handleKeyEvent);
    
    // Clean up function
    return () => {
      if (observer) {
        observer.disconnect();
      }
      
      window.removeEventListener('keydown', handleKeyEvent);
      window.removeEventListener('keyup', handleKeyEvent);
      
      if (!persistOnUpdate && containerRef.current) {
        const viewer = containerRef.current.querySelector('spline-viewer');
        if (viewer) {
          viewer.remove();
          isInitializedRef.current = false;
          splineLoadedRef.current = false;
        }
      }
    };
  }, [url, options, persistOnUpdate]);

  // Tab index allows the container to receive keyboard focus
  return <div 
    ref={containerRef} 
    style={{ width: '100%', height: '100%' }} 
    tabIndex="0"
    onKeyDown={(e) => {
      console.log(`Container onKeyDown: ${e.key}`);
    }}
    onKeyUp={(e) => {
      console.log(`Container onKeyUp: ${e.key}`);
    }}
  />;
});

export default SplineViewer; 