import React, { useState, useEffect, useRef } from 'react';
import { RetellWebClient } from "retell-client-js-sdk";
import SplineLoader from './SplineLoader';
import SplineViewer from './SplineViewer';
import './index.css';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import agentIcon from './assets/agent-icon.svg';
import userIcon from './assets/user-icon.svg';
import FaceDirectionComponent from './FaceDirectionComponent';
import Finance from './components/Finance';

function App() {
  // Add a ref to maintain the Spline instance
  const splineInstanceRef = useRef(null);
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
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [showUI, setShowUI] = useState(true);
  // Add state to control the mounting/unmounting of Spline
  const [splineInitialized, setSplineInitialized] = useState(false);
  // Add refs for animation control
  const animationTimerRef = useRef(null);
  const lastKeyPressRef = useRef(null);
  // Track if key is being pressed
  const keyPressedRef = useRef({});
  // State for graph visualization
  const [showGraphs, setShowGraphs] = useState(false);
  const [graphType, setGraphType] = useState('bar'); // 'bar', 'line', 'pie', 'scatter'
  const graphTimerRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const graphKeywords = ['graph', 'chart', 'stats', 'data', 'visualization', 'metrics', 'numbers'];
  const graphIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  // State to track if graphs have been animated
  const [graphsAnimated, setGraphsAnimated] = useState(false);
  // State to track if graphs were manually dismissed
  const [graphsManuallyDismissed, setGraphsManuallyDismissed] = useState(false);
  // State for active tab (voice, finance, connect)
  const [activeTab, setActiveTab] = useState('voice');
  // State for selected industry in Connect tab
  const [selectedIndustry, setSelectedIndustry] = useState('Financial Institutions');
  // State for industry data from API
  const [industryData, setIndustryData] = useState({
    "Financial Institutions": {
      "Industry Insights": "Banking industry in Europe Banking industry in China Banking industry in the U.S. Central banks Federal Reserve System Interest Rates Digital banks Digital banks in the UK Insurance industry in the UK Investment funds Private health insurance in the United States Fintech Top Seller Report on the topic See more",
      "Market size": "The stability of the global banking sector Market capitalization of the 100 largest banks worldwide from 1st quarter 2016 to 3rd quarter 2024 (in trillion euros) Please wait Further details: Visit original statistic Market capitalization of the 100 largest banks worldwide from 1st quarter 2016 to 3rd quarter 2024 (in trillion euros) The market capitalization of major global banks plummeted in 2020 due to the COVID-19 pandemic's economic fallout, with some banks experiencing drops of over a third, and others nearly halving in value. By 2021, the market capitalization rebounded and remained stable through 2022, surpassing pre-pandemic levels. This trend continued in 2023, reaching a peak in early 2024 for the top 100 banks. Largest banks worldwide by market capitalization Return on equity of the banking industry in Europe Largest banks in the U.S. by market capitalization",
      "Market segments": "The evolution of financial institutions and the rise of fintech Number of fintechs worldwide from 2008 to 2024, by region Please wait Further details: Visit original statistic Number of fintechs worldwide from 2008 to 2024, by region Financial institutions encompass a diverse range of market segments, each serving distinct functions within the financial ecosystem. These segments typically include banking, insurance, asset management, brokerage, and fintech. Recent years have seen a rapid decline in the number of traditional banks, while fintech has evolved from a niche and elusive industry trend into a transformative force in the global financial landscape. Number of FDIC-insured commercial banks in the U.S. Cost-to-income ratio of the banking industry in Europe Largest insurance companies worldwide",
      "Industry trends": "Digital challengers on the rise Number of digital banks worldwide in 2023, by region Please wait Further details: Visit original statistic Number of digital banks worldwide in 2023, by region With the increasing popularity of online banking, traditional retail banks face competition from online counterparts. Online banks operate solely in digital form, offering customers easy access through apps, personalized features, and low fees. As of 2024, Europe boasted the highest number of challenger banks globally, while the Middle East and Africa had the lowest. Digital banks worldwide Digital banks in the UK Leading digital banks in Europe",
      "Industry leaders": "Which is the world's largest bank? Largest banks worldwide as of December 31, 2024, by market capitalization (in billion U.S. dollars) Please wait Further details: Visit original statistic Largest banks worldwide as of December 31, 2024, by market capitalization (in billion U.S. dollars) The world\u2019s largest bank by market capitalization is JPMorgan Chase. The publicly listed commercial bank's market cap exceeded 490 billion U.S. dollars in 2023. The next two largest banks are Bank of America and Industrial & Commercial Bank of China, each with market capitalizations surpassing 200 billion U.S. dollars. Banking industry in China Banking industry in the U.S. Largest banks in the UK",
      "Unique aspect of the industry": "Financial institutions are at the forefront of AI integration Estimated value of the financial sector's artificial intelligence (AI) spending worldwide from 2023 to 2024, with forecasts from 2025 to 2028 (in billion U.S. dollars) Please wait Further details: Visit original statistic Estimated value of the financial sector's artificial intelligence (AI) spending worldwide from 2023 to 2024, with forecasts from 2025 to 2028 (in billion U.S. dollars) With the renewed interest in AI, financial institutions emerge as leaders in AI integration, exhibiting one of the highest adoption rates across industries. This is primarily attributed to the strong adoption of traditional AI, such as machine learning (ML), which has been widely used in the sector since the late 2000s. Generative AI, while currently less commonly used, will likely take hold in the industry in the coming years. Artificial intelligence in finance Generative artificial intelligence Leading banks in AI adoption"
    },
    "Financial Services": {
      "Industry Insights": "BNPL (Buy Now, Pay Later) Credit cards, by country Digital payments in India Digital payments trends across Europe Fintech Fintech in India M&As worldwide Mobile payments with digital wallets PayPal Startups worldwide Unicorn companies worldwide UPI in India Top Seller Report on the topic See more",
      "Market size": "Americas is home to nearly three times as many fintechs as Asia Number of fintechs worldwide from 2008 to 2024, by region Please wait Further details: Visit original statistic Number of fintechs worldwide from 2008 to 2024, by region Financial technology providers are largely found in the United States and China. Eight out of 10 of the world's largest fintechs came from either of these countries in January 2024. Fintech unicorns, or companies with over one billion U.S. dollars worth of market cap, are most often found in the U.S. and the United Kingdom. Fintech in China Fintech in Latin America Fintech in Middle East and North Africa (MENA)",
      "Market segments": "Latin America to grow the fastest in digital payments Total number of cashless transactions worldwide - including B2C and B2B - from 2014 to 2023, with forecasts for 2024 and 2028, by region (in billions) Please wait Further details: Visit original statistic Total number of cashless transactions worldwide - including B2C and B2B - from 2014 to 2023, with forecasts for 2024 and 2028, by region (in billions) In-store digital payments are bigger in Asia than in Europe and North America combines. Estimates indicate that the number of cashless payments are to increase further in the coming year. The implementation of new methods - such as wallets, QR code payments, or A2A payments - may lead to a sizable decline of cash use in countries where the population has little to no access to financial services. Latin America, especially, hopes to benefit from this. A2A (account-to-account) payments Digital payments in Southeast Asia (SEA) Digital payments landscape in Mexico",
      "Industry trends": "Inflation sparks demand for financial flexibility Credit card debt in the United States from 4th quarter 2010 to 4th quarter 2024 (in billion U.S. dollars) Please wait Further details: Visit original statistic Credit card debt in the United States from 4th quarter 2010 to 4th quarter 2024 (in billion U.S. dollars) Loans, savings, and debt became dominant themes during the cost-of-living crisis, affecting both consumers and businesses. This is reflected in growing credit card rates and debt. Consumers actively explore alternative finance options, such as BNPL installments or flexible options. Loan providers worldwide Personal debit in the U.S. Car leasing in the U.S.",
      "Industry leaders": "PayPal is the biggest payment brand in e-commerce, but for how long? Most used payment processing technology - including payment gateways and BNPL (buy now, pay later) - on websites worldwide as of January 2025 Please wait Further details: Visit original statistic Most used payment processing technology - including payment gateways and BNPL (buy now, pay later) - on websites worldwide as of January 2025 E-commerce payment processing technologies come from different providers - such as fintechs, payment gateways or buy now, pay later. Out of these, PayPal had the highest global market share. Some of the fastest growing brands worldwide - UPI in India, Pix in Brazil - focus on instant transaction speeds in offline, in-store payments, however. Apple Pay Klarna Pix",
      "Unique aspect of the industry": "Interest rate developments may kick M&A into gear in 2024 Number of merger and acquisition (M&A) transactions worldwide from 1985 to 2024 Please wait Further details: Visit original statistic Number of merger and acquisition (M&A) transactions worldwide from 1985 to 2024 Companies noticed a decline in traditional investments as investors became increasingly cautious. 2023 was a difficult year for corporate dealmaking, as the global M&A value fell by 16 percent. The corporate finance sector actively seeks new ways to tap into money, eagerly awaiting an increase in interest rates worldwide in 2024. Mergers and acquisitions (M&A) in the U.S. SME financing in the UK Non-banking financial companies (NBFCs) in India"
    },
    "IT Services": {
      "Industry Insights": "IT services Cloud computing IT outsourcing industry Software as a Service (SaaS) Platform as a Service (PaaS) Data centers Edge Computing Internet of Things (IoT) Artificial intelligence (AI) worldwide Work from home: remote & hybrid work Digital transformation IT budgets & investments Top Seller Report on the topic See more",
      "Market size": "IT services market expected to grow due to digitization trends Information technology (IT) services and business services revenue from 2017 to 2025, by region (in billion U.S. dollars) Please wait Further details: Visit original statistic Information technology (IT) services and business services revenue from 2017 to 2025, by region (in billion U.S. dollars) The IT services market is a robust and expanding sector within the global IT industry. As digital transformation accelerates across various sectors, IT services continue to play an integral role in businesses of all sizes. The increasing complexity of technology infrastructure and the growing demand for cloud-based solutions emphasized the global need for reliable IT services that enable efficient operations, enhance cybersecurity, and support the evolution of work models. IT services Cloud computing IT outsourcing industry",
      "Market segments": "Cloud computing is the strongest growing segment Market growth forecast for public cloud services worldwide from 2011 to 2025 Please wait Further details: Visit original statistic Market growth forecast for public cloud services worldwide from 2011 to 2025 The broader market for IT services comprises several segments, including managed services, security services, and cloud computing. The most substantial growth segment is cloud computing, which relates to the use of remote servers and networks to manage and process data. Furthermore, the delivery of IT resources via the internet diversifies the deployment and service models available to organizations, leading to improved efficiency levels. Software as a Service Platform as a Service Data centers",
      "Industry trends": "Data centers evolve to meet AI's growing IT demands Information technology (IT) spending on data center systems worldwide from 2012 to 2024 (in billion U.S. dollars) Please wait Further details: Visit original statistic Information technology (IT) spending on data center systems worldwide from 2012 to 2024 (in billion U.S. dollars) Artificial Intelligence (AI) is rapidly transforming IT services, with a growing synergy between AI and data centers due to the increased demand for high-performance computing and storage capabilities required to support AI training and applications. The global spending on data centers reached a record 236 billion U.S. dollars in 2023 and is projected to increase to a new record of 260 billion U.S. dollars in 2024 driven in part by advancements in AI technology. AI on the cloud Data centers AI usage in customer service",
      "Industry leaders": "Microsoft and AWS are the IT services market leaders Worldwide top-10 leading cloud vendors by total revenue 2024 (in billion U.S. dollars) Please wait Further details: Visit original statistic Worldwide top-10 leading cloud vendors by total revenue 2024 (in billion U.S. dollars) Microsoft and Amazon Web Services (AWS) are among the most important companies in the IT services industry. These global industry leaders strive to offer flexible operating models and various services tailored to their customers\u2019 needs. More recently, IT services companies have shifted their focus from providing services only to adopting a more holistic approach and becoming their customers\u2019 business partners. IBM Amazon Web Services (AWS) Microsoft",
      "Unique aspect of the industry": "IT services accelerating collaboration and remote work Percentage of employees who work from home all or most of the time worldwide from 2015 to 2023 Please wait Further details: Visit original statistic Percentage of employees who work from home all or most of the time worldwide from 2015 to 2023 A unique aspect of the IT services industry is its ability to enable collaboration from different locations, including working remotely. IT services provide the infrastructure and tools to enable hybrid work models and collaborative platforms. These tools and services have recently experienced an extraordinary surge in demand as remote and hybrid work rates increase globally. This trend underscores and accelerates the development of digital transformation in the work environment in general. Work from home & remote work Digital transformation IT budgets"
    },
    "Software": {
      "Industry Insights": "Digital transformation Enterprise software Software development Software as a Service (SaaS) Cybersecurity Security software Endpoint security Android Microsoft Generative artificial intelligence (AI) ChatGPT Gemini Top Seller Report on the topic See more",
      "Market size": "IT spending on software shows significant growth Information technology (IT) spending on enterprise software worldwide from 2009 to 2025 (in billion U.S. dollars) Please wait Further details: Visit original statistic Information technology (IT) spending on enterprise software worldwide from 2009 to 2025 (in billion U.S. dollars) The economic downturn in the second half of 2022 forced many companies to reduce expenses, leading to slower IT spending growth. However, the software industry faired more favorably, experiencing more positive growth in spending. The pandemic led to more digital adoption and increased spending on software as customers moved towards online channels. Enterprise software spending is set to approach a trillion U.S. dollars soon as it becomes even more crucial in digital transformation. Software development Open source software Software industry financial insights",
      "Market segments": "Enterprise software segment keeps expanding Information technology (IT) spending worldwide from 2012 to 2025, by segment (in billion U.S. dollars) Please wait Further details: Visit original statistic Information technology (IT) spending worldwide from 2012 to 2025, by segment (in billion U.S. dollars) For businesses to enhance their daily operations and core functions, they heavily rely on enterprise software to remain competitive and agile. Enterprise software is the largest segment in the software industry. Examples of enterprise software include enterprise resource planning (ERP) and customer relationship management technologies. Enterprise software Security software System infrastructure software",
      "Industry trends": "SaaS remains strong in the cloud computing market Public cloud application services/software as a service (SaaS) end-user spending worldwide from 2015 to 2025 (in billion U.S. dollars) Please wait Further details: Visit original statistic Public cloud application services/software as a service (SaaS) end-user spending worldwide from 2015 to 2025 (in billion U.S. dollars) The subscription-based model and accessibility demonstrated by SaaS, among other advantages over on-premises software, has made it one of the best-performing tech subsectors during the pandemic. As digitalization deepens, businesses and activities will move to the cloud more and more, pushing SaaS even further to the forefront. As a result, SaaS spending is projected to stay strong, reaching 195 billion U.S. dollars in 2023. Software-as-a-Service (SaaS) Cloud computing Microsoft Azure",
      "Industry leaders": "Not found",
      "Unique aspect of the industry": "Increased use of AI across the world economy Artificial intelligence (AI) market size worldwide from 2020 to 2030 (in billion U.S. dollars) Please wait Further details: Visit original statistic Artificial intelligence (AI) market size worldwide from 2020 to 2030 (in billion U.S. dollars) As large language models such as ChatGPT and Gemini continue to evolve, the use of artificial intelligence (AI) is becoming increasingly common. The ongoing generative AI revolution continues to influence business and industries, increasing efficiency and reducing costs. AI integration in software and increased usage of AI is likely to have a cascading effecting on a plethora of professions, from IT to management, as new possibilities of AI open up. AI worldwide Generative AI AI in business"
    }
  });

  const {
    transcript: currentTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Key press duration in milliseconds (1 second)
  const KEY_PRESS_DURATION = 1000; 

  // Agent ID for Retell
  const AGENT_ID = "agent_99a678a68a9e21fc5694977ffc";
  
  // Server endpoint for token generation
  const TOKEN_SERVER_URL = "http://127.0.0.1:5000/api/generate-token";

  // Function to check if the transcript contains data visualization keywords
  const checkForGraphKeywords = (transcript) => {
    if (!transcript) return false;
    
    const lowerText = transcript.toLowerCase();
    return (
      lowerText.includes('chart') || 
      lowerText.includes('graph') || 
      lowerText.includes('stats') ||
      lowerText.includes('statistics') ||
      lowerText.includes('visualization') ||
      lowerText.includes('plot') ||
      lowerText.includes('diagram')
    );
  };
  
  // Function to handle graph visualization
  const handleGraphVisualization = (transcript) => {
    // Don't show graphs if they were manually dismissed
    if (graphsManuallyDismissed) return;
    
    const shouldShowGraphs = checkForGraphKeywords(transcript);
    
    // Check for the word "dance" in the transcript and press z key once
    if (transcript && transcript.toLowerCase().includes("dance") && !keyPressedRef.current['z']) {
      console.log("Detected 'dance' in transcript, pressing z key");
      simulateKeyPress('z');
    }
    
    if (shouldShowGraphs && !showGraphs) {
      // Show graphs when keywords are detected
      setShowGraphs(true);
      
      // Randomly select a graph type to display
      const graphTypes = ['bar', 'line', 'pie', 'scatter'];
      const randomType = graphTypes[Math.floor(Math.random() * graphTypes.length)];
      setGraphType(randomType);
      
      // Cycle through graph types while keywords are present
      if (graphTimerRef.current) {
        clearInterval(graphTimerRef.current);
      }
      
      graphTimerRef.current = setInterval(() => {
        setGraphType(prevType => {
          const nextIndex = (graphTypes.indexOf(prevType) + 1) % graphTypes.length;
          return graphTypes[nextIndex];
        });
      }, 3000); // Change graph type every 3 seconds
    }
    // Removed the code that automatically hides graphs - they'll only be dismissed by the button
  };

  // Enhanced function to simulate a keyboard press with multiple methods
  const simulateKeyPress = (key, isContinuous = false) => {
    // Skip the check for repeated presses if this is a continuous press
    if (!isContinuous && keyPressedRef.current[key]) return;
    
    // Only set the keyPressed flag if not continuous
    if (!isContinuous) {
      keyPressedRef.current[key] = true;
    }
    
    // Method 1: Use our custom SplineViewer reference method if available
    if (splineInstanceRef.current) {
      try {
        // Send keydown event
        splineInstanceRef.current.sendKeyDown(key);
        console.log(`Sent keydown to Spline via ref: ${key}`);
        
        // Schedule keyup after KEY_PRESS_DURATION, but only if not continuous
        if (!isContinuous) {
          setTimeout(() => {
            splineInstanceRef.current.sendKeyUp(key);
            console.log(`Sent keyup to Spline via ref: ${key}`);
          }, KEY_PRESS_DURATION);
        }
      } catch (e) {
        console.error("Error using splineInstanceRef sendKey:", e);
      }
    }
    
    // Method 2: Try to dispatch to active element (sometimes this works better)
    try {
      if (document.activeElement) {
        const event = new KeyboardEvent('keydown', {
          key: key,
          code: `Key${key.toUpperCase()}`,
          keyCode: key.charCodeAt(0),
          which: key.charCodeAt(0),
          bubbles: true,
          cancelable: true,
          composed: true
        });
        document.activeElement.dispatchEvent(event);
        
        // Schedule keyup after KEY_PRESS_DURATION
        setTimeout(() => {
          const upEvent = new KeyboardEvent('keyup', {
            key: key,
            code: `Key${key.toUpperCase()}`,
            keyCode: key.charCodeAt(0),
            which: key.charCodeAt(0),
            bubbles: true,
            cancelable: true,
            composed: true
          });
          document.activeElement.dispatchEvent(upEvent);
        }, KEY_PRESS_DURATION);
      }
    } catch (e) {
      console.error("Error dispatching to active element:", e);
    }
    
    // Method 3: Manually activate the test buttons through DOM
    try {
      // Create a mouse click event on the corresponding test button
      const buttonSelector = key === 'u' ? '.test-btn:nth-child(1)' : 
                             key === 'd' ? '.test-btn:nth-child(2)' : 
                             key === 'l' ? '.test-btn:nth-child(3)' : 
                             '.test-btn:nth-child(4)';
                             
      const button = document.querySelector(buttonSelector);
      if (button) {
        // Add active state with CSS
        button.classList.add('active-test-btn');
        
        // Remove active state after KEY_PRESS_DURATION
        setTimeout(() => {
          button.classList.remove('active-test-btn');
        }, KEY_PRESS_DURATION);
      }
    } catch (e) {
      console.error("Error activating test button:", e);
    }
    
    // Method 4: Try to locate and interact directly with the Spline iframe
    try {
      const splineContainer = document.querySelector('.spline-container');
      if (splineContainer) {
        const iframe = splineContainer.querySelector('iframe');
        if (iframe) {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          
          // Try to find body or canvas element
          const target = iframeDoc.querySelector('canvas') || iframeDoc.body || iframeDoc;
          if (target) {
            const event = new KeyboardEvent('keydown', {
              key: key,
              code: `Key${key.toUpperCase()}`,
              keyCode: key.charCodeAt(0),
              which: key.charCodeAt(0),
              bubbles: true,
              cancelable: true
            });
            target.dispatchEvent(event);
            
            // Schedule keyup after KEY_PRESS_DURATION
            setTimeout(() => {
              const upEvent = new KeyboardEvent('keyup', {
                key: key,
                code: `Key${key.toUpperCase()}`,
                keyCode: key.charCodeAt(0),
                which: key.charCodeAt(0),
                bubbles: true,
                cancelable: true
              });
              target.dispatchEvent(upEvent);
            }, KEY_PRESS_DURATION);
          }
        }
      }
    } catch (e) {
      console.error("Error dispatching directly to iframe content:", e);
    }
    
    // Store the last key press
    lastKeyPressRef.current = key;
    
    // Reset pressed state after KEY_PRESS_DURATION plus a small buffer, but only if not continuous
    if (!isContinuous) {
      setTimeout(() => {
        keyPressedRef.current[key] = false;
      }, KEY_PRESS_DURATION + 100);
    }
  };

  // Function to handle actual keyboard events (for testing purposes)
  const handleKeyDown = (e) => {
    // We'll only log and process the keys we're interested in
    if (['u', 'd', 'l', 'r'].includes(e.key)) {
      console.log(`Actual key press: ${e.key}`);
      
      // We should also manually trigger the same spline animation for consistent behavior
      if (!keyPressedRef.current[e.key]) {
        testAnimation(e.key);
      }
    }
  };

  // Add a hook to listen for real keyboard events for debugging
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Function to start animation based on talking state
  const startTalkingAnimation = () => {
    // Clear any existing animation timer
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
    }
    
    // Reset the last key press to force starting with up movement
    lastKeyPressRef.current = null;
    
    // Start with an initial up key press to ensure we begin with up/down
    simulateKeyPress('u');
    
    // Track the previous negation state
    let wasNegation = false;
    
    // Set up a new animation timer to simulate key presses while talking
    // Use a longer interval to account for the longer key press duration
    animationTimerRef.current = setInterval(() => {
      // Check if the transcript contains negation words
      const hasNegation = eventStatus.transcript && (
        eventStatus.transcript.toLowerCase().includes('no') || 
        eventStatus.transcript.toLowerCase().includes('not') ||
        eventStatus.transcript.toLowerCase().includes("don't") ||
        eventStatus.transcript.toLowerCase().includes("doesn't")
      );
      
      // If negation state changed from true to false, reset the animation pattern
      if (wasNegation && !hasNegation) {
        console.log("Negation ended, resetting to up/down movement");
        lastKeyPressRef.current = null;
        simulateKeyPress('u');
      }
      
      // Update the previous negation state
      wasNegation = hasNegation;
      
      // If there's negation, use left-right movements
      if (hasNegation) {
        // Alternate between left and right
        if (lastKeyPressRef.current === 'l') {
          simulateKeyPress('r');
        } else {
          simulateKeyPress('l');
        }
      } else {
        // Otherwise use up-down movements
        if (lastKeyPressRef.current === 'u') {
          simulateKeyPress('d');
        } else {
          simulateKeyPress('u');
        }
      }
    }, KEY_PRESS_DURATION + 200); // Animation interval is longer to account for key press duration
  };
  
  // Function to stop animation
  const stopTalkingAnimation = () => {
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }
  };

  // Function to manually trigger animation for testing 
  const testAnimation = (direction) => {
    simulateKeyPress(direction);
  };

  // Effect to update graph visualization when transcript changes
  useEffect(() => {
    if (eventStatus.transcript) {
      handleGraphVisualization(eventStatus.transcript);
    }
  }, [eventStatus.transcript, eventStatus.agentStartTalking]);
  
  // Clean up graph timer on component unmount
  useEffect(() => {
    return () => {
      if (graphTimerRef.current) {
        clearInterval(graphTimerRef.current);
        graphTimerRef.current = null;
      }
    };
  }, []);

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
      stopTalkingAnimation();
      // Reset the manual dismissal flag when call ends
      setGraphsManuallyDismissed(false);
    });

    client.on("agent_start_talking", () => {
      console.log("agent_start_talking");
      setEventStatus(prev => ({ ...prev, agentStartTalking: true, agentStopTalking: false }));
      startTalkingAnimation();
    });

    client.on("agent_stop_talking", () => {
      console.log("agent_stop_talking");
      setEventStatus(prev => ({ ...prev, agentStopTalking: true, agentStartTalking: false }));
      stopTalkingAnimation();
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
      stopTalkingAnimation();
    });
    
    // Clean up event listeners and animation on component unmount
    return () => {
      stopTalkingAnimation();
      if (client) {
        client.stopCall();
      }
    };
  }, []);

  // Effect to handle animation when talking state changes
  useEffect(() => {
    if (eventStatus.agentStartTalking && !eventStatus.agentStopTalking) {
      startTalkingAnimation();
    } else {
      stopTalkingAnimation();
    }
  }, [eventStatus.agentStartTalking, eventStatus.agentStopTalking]);
  
  // Effect to monitor transcript for keywords
  useEffect(() => {
    // Check for the word "dance" in the transcript
    if (eventStatus.transcript && eventStatus.transcript.toLowerCase().includes("dance") && !keyPressedRef.current['z']) {
      console.log("Detected 'dance' in transcript, pressing z key");
      simulateKeyPress('z');
    }
  }, [eventStatus.transcript]);
  
  // Effect to monitor speech recognition transcript for keywords
  useEffect(() => {
    // Check for the word "dance" in the transcript
    if (transcript && transcript.toLowerCase().includes("dance") && !keyPressedRef.current['z']) {
      console.log("Detected 'dance' in transcript, pressing z key");
      simulateKeyPress('z');
    }
  }, [transcript]);
  
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
      // Reset event status but preserve graph visibility
      // Reset the manual dismissal flag when starting a new call
      setGraphsManuallyDismissed(false);
      
      // Ensure we have a valid token
      if (!accessToken) {
        const token = await generateAccessToken();
        if (!token) {
          throw new Error("Failed to generate a valid access token");
        }
      }
      
      console.log("Starting call with access token...");
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
  
  // New function to handle loading completion and initialize Spline only once
  const handleLoadingComplete = () => {
    setLoadingComplete(true);
    setSplineInitialized(true);
  };

  // Function to handle graph visualization based on keywords and agent speaking status
  const handleGraphVisualizationSpeech = () => {
    // Don't show graphs if they were manually dismissed
    if (graphsManuallyDismissed) return;
    
    // Check for the word "dance" in transcript and press z key once
    if (transcript && transcript.toLowerCase().includes("dance") && !keyPressedRef.current['z']) {
      console.log("Detected 'dance' in transcript, pressing z key");
      simulateKeyPress('z');
    }
    
    const hasGraphKeywords = checkForGraphKeywordsSpeech(transcript);
    
    // Only show graphs if they're not already showing and keywords are detected
    if (hasGraphKeywords && !showGraphs) {
      setShowGraphs(true);
      
      // Clear any existing interval
      if (graphIntervalRef.current) {
        clearInterval(graphIntervalRef.current);
        graphIntervalRef.current = null;
      }
      
      // Initial key press for 1 second
      simulateKeyPress('l');
      
      // Set up interval for 1-second presses with 1-second pauses
      graphIntervalRef.current = setInterval(() => {
        simulateKeyPress('l');
      }, 2000); // 2-second interval (1s press + 1s pause)
    }
    
    // No automatic hiding of graphs - they'll only be dismissed by the button
  };

  // Function to release a key that might be continuously pressed
  const releaseKey = (key) => {
    try {
      // Release key using SplineViewer reference
      if (splineInstanceRef.current) {
        splineInstanceRef.current.sendKeyUp(key);
        console.log(`Released key: ${key}`);
      }
      
      // Reset keyPressed state
      keyPressedRef.current[key] = false;
      
      // Also trigger release on active element
      if (document.activeElement) {
        const upEvent = new KeyboardEvent('keyup', {
          key: key,
          code: `Key${key.toUpperCase()}`,
          keyCode: key.charCodeAt(0),
          which: key.charCodeAt(0),
          bubbles: true,
          cancelable: true,
          composed: true
        });
        document.activeElement.dispatchEvent(upEvent);
      }
      
      // Remove active state from test button
      const buttonSelector = key === 'u' ? '.test-btn:nth-child(1)' : 
                         key === 'd' ? '.test-btn:nth-child(2)' : 
                         key === 'l' ? '.test-btn:nth-child(3)' : 
                         '.test-btn:nth-child(4)';
      const button = document.querySelector(buttonSelector);
      if (button) {
        button.classList.remove('active-test-btn');
      }
    } catch (e) {
      console.error(`Error releasing key ${key}:`, e);
    }
  };

  // Extract potential title from transcript
  const extractTitleFromTranscript = () => {
    const text = eventStatus.transcript || transcript || '';
    
    // Try to find phrases like "here's a graph about X" or "data on X"
    const titlePatterns = [
      /graph (?:about|on|for|of) ([\w\s]+)/i,
      /data (?:about|on|for|of) ([\w\s]+)/i,
      /statistics (?:about|on|for|of) ([\w\s]+)/i,
      /chart (?:about|on|for|of) ([\w\s]+)/i,
      /metrics (?:about|on|for|of) ([\w\s]+)/i
    ];
    
    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        // Limit to 20 characters and capitalize
        return match[1].trim().substring(0, 20).replace(/^\w/, c => c.toUpperCase());
      }
    }
    
    // Default titles based on graph type
    return graphType === 'bar' ? 'Performance Metrics' : 'Trend Analysis';
  };

  // Render functions for different graph types
  const renderGraph = () => {
    const graphTitle = extractTitleFromTranscript();
    
    switch(graphType) {
      case 'bar':
  return (
          <div className="graph-container">
            <h3 className="graph-title">{graphTitle || "Quarterly Performance Analysis"}</h3>
            <div className="neon-graph bar-graph">
              <div className="y-axis">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>
              <div className="bar-container">
                <div className="bar" style={{ height: '60%' }}>
                  <div className="bar-glow"></div>
                  <span className="bar-label">Q1</span>
                  <span className="bar-value">60%</span>
                </div>
                <div className="bar" style={{ height: '80%' }}>
                  <div className="bar-glow"></div>
                  <span className="bar-label">Q2</span>
                  <span className="bar-value">80%</span>
                </div>
                <div className="bar" style={{ height: '40%' }}>
                  <div className="bar-glow"></div>
                  <span className="bar-label">Q3</span>
                  <span className="bar-value">40%</span>
                </div>
                <div className="bar" style={{ height: '90%' }}>
                  <div className="bar-glow"></div>
                  <span className="bar-label">Q4</span>
                  <span className="bar-value">90%</span>
                </div>
                <div className="bar" style={{ height: '65%' }}>
                  <div className="bar-glow"></div>
                  <span className="bar-label">YTD</span>
                  <span className="bar-value">65%</span>
                </div>
              </div>
            </div>
            <div className="x-axis-label">Quarterly Results</div>
            <div className="graph-legend">
              <div className="legend-item"><span className="legend-color bar-color"></span>Performance Metrics</div>
            </div>
          </div>
        );
      case 'line':
        return (
          <div className="graph-container">
            <h3 className="graph-title">{graphTitle || "Performance Trend Analysis"}</h3>
            <div className="neon-graph line-graph">
              <div className="y-axis">
                <span>High</span>
                <span>Med</span>
                <span>Low</span>
              </div>
              <svg viewBox="0 0 100 50" className="animated-line">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4facfe" />
                    <stop offset="100%" stopColor="#00f2fe" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <path d="M0,40 L20,30 L40,35 L60,15 L80,25 L100,10" stroke="url(#lineGradient)" strokeWidth="2" fill="none" filter="url(#glow)" />
                <circle cx="0" cy="40" r="3" className="data-point pulse" />
                <circle cx="20" cy="30" r="3" className="data-point pulse" />
                <circle cx="40" cy="35" r="3" className="data-point pulse" />
                <circle cx="60" cy="15" r="3" className="data-point pulse" />
                <circle cx="80" cy="25" r="3" className="data-point pulse" />
                <circle cx="100" cy="10" r="3" className="data-point pulse" />
                
                <text x="0" y="45" className="data-label">Jan</text>
                <text x="20" y="35" className="data-label">Feb</text>
                <text x="40" y="40" className="data-label">Mar</text>
                <text x="60" y="20" className="data-label">Apr</text>
                <text x="80" y="30" className="data-label">May</text>
                <text x="100" y="15" className="data-label">Jun</text>
              </svg>
            </div>
            <div className="x-axis-label">Time Period (Jan-Jun)</div>
            <div className="graph-legend">
              <div className="legend-item"><span className="legend-color line-color"></span>Trend Analysis</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    setTranscript(currentTranscript);
  }, [currentTranscript]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to check for graph-related keywords in the transcript
  const checkForGraphKeywordsSpeech = (text) => {
    if (!text) return false;
    const textLower = text.toLowerCase();
    return graphKeywords.some(keyword => textLower.includes(keyword));
  };

  // Monitor for changes in transcript and agent speaking status
  useEffect(() => {
    handleGraphVisualizationSpeech();
  }, [transcript, isAgentSpeaking]);

  // Effect to make sure 'l' key is pressed and released at intervals while graphs are shown
  useEffect(() => {
    if (showGraphs) {
      // Press 'l' key initially for 1 second and release
      if (!graphIntervalRef.current) {
        // Press the key
        simulateKeyPress('l');
        
        // Set up interval to press every 2 seconds (1s press + 1s pause)
        graphIntervalRef.current = setInterval(() => {
          // Press the key for 1 second
          simulateKeyPress('l');
        }, 2000); // 2 second interval (1s press + 1s pause)
      }
    } else {
      // Clear interval when graphs are hidden
      if (graphIntervalRef.current) {
        clearInterval(graphIntervalRef.current);
        graphIntervalRef.current = null;
        releaseKey('l');
      }
    }
    
    return () => {
      if (graphIntervalRef.current) {
        clearInterval(graphIntervalRef.current);
        graphIntervalRef.current = null;
        releaseKey('l');
      }
    };
  }, [showGraphs]);

  const handleStartListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
  };

  const handleStopListening = () => {
    SpeechRecognition.stopListening();
  };

  const toggleAgentSpeaking = () => {
    setIsAgentSpeaking(!isAgentSpeaking);
  };

  const handleSendMessage = () => {
    if (transcript.trim() === '') return;

    const newMessage = {
      text: transcript,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, newMessage]);
    resetTranscript();
  };

  const renderAgentResponse = () => {
    // Array of funny, body-related responses
    const bodyResponses = [
      "I'm flexing my neural networks to process your request. Let me show you some data that'll get your heart pumping!",
      "My digital synapses are firing at full capacity! Here's some visual brain food for you.",
      "Hold on, just cracking my virtual knuckles before I dive into these statistics for you.",
      "I'm putting my thinking cap on—literally, it's connected to my CPU cortex. Check out these insights!",
      "Let me stretch my computational muscles and show you some eye-catching visualizations that'll make your pupils dilate!",
      "My algorithmic reflexes are tingling! Here's some data that should stimulate your visual cortex.",
      "Just catching my digital breath before showing you these numbers that'll make your jaw drop!",
      "I'm digesting your request with my silicon stomach. These statistics should help get your mental juices flowing!"
    ];
    
    // Select a random response
    const randomResponse = bodyResponses[Math.floor(Math.random() * bodyResponses.length)];
    
    // Simulate agent responding
    const agentMessage = {
      text: randomResponse,
      sender: 'agent',
      timestamp: new Date().toISOString()
    };

    setTimeout(() => {
      setMessages([...messages, agentMessage]);
      setIsAgentSpeaking(true);
      
      // Simulate agent finishing speaking after 5 seconds
      setTimeout(() => {
        setIsAgentSpeaking(false);
      }, 5000);
    }, 1000);
  };

  // Effect to mark graphs as animated after they appear
  useEffect(() => {
    if (showGraphs && !graphsAnimated) {
      // After animation duration, mark graphs as animated
      const animationTimeout = setTimeout(() => {
        setGraphsAnimated(true);
      }, 1200); // Slightly longer than the animation duration
      
      return () => clearTimeout(animationTimeout);
    } else if (!showGraphs && graphsAnimated) {
      // Reset animation state when graphs are hidden
      setGraphsAnimated(false);
    }
  }, [showGraphs, graphsAnimated]);
  
  // Function to extract key topics from industry insights
  const extractKeyTopics = (insightsText) => {
    if (!insightsText) return [];
    
    // Split by spaces and filter out short words
    const words = insightsText.split(' ');
    const topics = [];
    let currentTopic = '';
    
    words.forEach(word => {
      // If word starts with uppercase, it might be the start of a new topic
      if (word.match(/^[A-Z]/)) {
        if (currentTopic) {
          topics.push(currentTopic.trim());
        }
        currentTopic = word;
      } else {
        // Continue building current topic
        currentTopic += ' ' + word;
      }
    });
    
    // Add the last topic
    if (currentTopic) {
      topics.push(currentTopic.trim());
    }
    
    // Filter out very short topics and limit to 8 topics
    return topics
      .filter(topic => topic.length > 5)
      .filter(topic => !topic.includes('Please wait') && !topic.includes('Further details'))
      .slice(0, 8);
  };
  
  // Function to extract title from section content
  const extractSectionTitle = (content) => {
    if (!content) return '';
    
    // Try to get the first sentence or phrase
    const firstSentence = content.split('.')[0];
    if (firstSentence.length < 60) {
      return firstSentence;
    }
    
    // If first sentence is too long, try first line
    const firstLine = content.split('\n')[0];
    if (firstLine.length < 60) {
      return firstLine;
    }
    
    // Otherwise just take the first 50 chars
    return content.substring(0, 50) + '...';
  };
  
  // Function to format industry statistics for charts
  const formatIndustryStats = (industry) => {
    // Default stats by industry
    const stats = {
      "Financial Institutions": {
        growth: "+17%",
        marketSize: "$4.8T",
        cagr: "+7.2%"
      },
      "Financial Services": {
        growth: "+23%",
        marketSize: "$2.7T",
        cagr: "+11.5%"
      },
      "IT Services": {
        growth: "+29%",
        marketSize: "$1.6T",
        cagr: "+14.8%"
      },
      "Software": {
        growth: "+32%",
        marketSize: "$3.2T",
        cagr: "+15.9%"
      }
    };
    
    return stats[industry] || { growth: "+27%", marketSize: "$2.5T", cagr: "+12%" };
  };

  // Effect to handle spline animation repositioning when tab changes
  useEffect(() => {
    // Force a reflow to ensure the animation transitions smoothly
    document.body.classList.remove('tab-transition');
    void document.body.offsetWidth; // Trigger reflow
    document.body.classList.add('tab-transition');
    
    // Set a title based on the active tab
    document.title = `AI Assistant - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;
  }, [activeTab]);

  // CSS for the Industry Connect Tab
  const connectStyles = `
    .connect-tab {
      padding: 10px;
      max-height: 80vh;
      overflow-y: auto;
    }
    
    .industry-selector {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    
    .industry-btn {
      background-color: rgba(10, 20, 40, 0.5);
      border: 1px solid rgba(0, 150, 255, 0.3);
      color: #ccd6f6;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .industry-btn.active {
      background-color: rgba(0, 150, 255, 0.3);
      border-color: #00a8ff;
      box-shadow: 0 0 10px rgba(0, 168, 255, 0.4);
    }
    
    .industry-data-container {
      background-color: rgba(10, 20, 40, 0.3);
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
      border: 1px solid rgba(0, 150, 255, 0.2);
    }
    
    .industry-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid rgba(0, 150, 255, 0.2);
      padding-bottom: 15px;
    }
    
    .industry-header h3 {
      margin: 0;
      color: #00a8ff;
      font-size: 1.5rem;
    }
    
    .industry-stats {
      display: flex;
      gap: 15px;
    }
    
    .industry-stat {
      text-align: center;
    }
    
    .stat-value {
      display: block;
      font-size: 1.2rem;
      font-weight: bold;
      color: #00f2fe;
    }
    
    .stat-label {
      font-size: 0.8rem;
      color: #ccd6f6;
    }
    
    .industry-section {
      margin-bottom: 25px;
      border-bottom: 1px solid rgba(0, 150, 255, 0.1);
      padding-bottom: 15px;
    }
    
    .section-header {
      color: #00a8ff;
      margin: 0 0 10px 0;
      font-size: 1.2rem;
    }
    
    .section-content {
      color: #ccd6f6;
      font-size: 0.9rem;
      line-height: 1.5;
    }
    
    .content-text {
      max-height: 200px;
      overflow-y: auto;
      padding-right: 10px;
      margin-top: 15px;
    }
    
    /* Data visualizations */
    .data-visualization {
      margin-top: 15px;
      background-color: rgba(10, 20, 40, 0.5);
      border-radius: 8px;
      padding: 15px;
      border: 1px solid rgba(0, 150, 255, 0.3);
    }
    
    .chart-container {
      margin-bottom: 15px;
    }
    
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .chart-header h5 {
      margin: 0;
      color: #00a8ff;
    }
    
    .chart-controls {
      display: flex;
      gap: 5px;
    }
    
    .chart-control-btn {
      background-color: rgba(0, 150, 255, 0.2);
      border: 1px solid rgba(0, 150, 255, 0.3);
      color: #ccd6f6;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      cursor: pointer;
    }
    
    .chart-visualization {
      height: 180px;
      position: relative;
    }
    
    .market-chart {
      width: 100%;
      height: 100%;
    }
    
    .grid-line {
      stroke: rgba(204, 214, 246, 0.1);
      stroke-width: 1;
    }
    
    .animated-path {
      stroke-dasharray: 1000;
      stroke-dashoffset: 1000;
      animation: dash 2s linear forwards;
    }
    
    @keyframes dash {
      to {
        stroke-dashoffset: 0;
      }
    }
    
    .chart-point {
      fill: #00f2fe;
      r: 3;
      filter: drop-shadow(0 0 3px rgba(0, 242, 254, 0.7));
    }
    
    .year-label {
      fill: #ccd6f6;
      font-size: 6px;
      text-anchor: middle;
      letter-spacing: -0.5px;
    }
    
    .data-highlights {
      display: flex;
      justify-content: space-around;
      gap: 10px;
    }
    
    .highlight-card {
      background-color: rgba(0, 150, 255, 0.1);
      border: 1px solid rgba(0, 150, 255, 0.3);
      border-radius: 6px;
      padding: 10px;
      text-align: center;
      flex: 1;
    }
    
    .highlight-value {
      font-size: 1.2rem;
      font-weight: bold;
      color: #00f2fe;
      margin-bottom: 5px;
    }
    
    .highlight-label {
      font-size: 0.8rem;
      color: #ccd6f6;
    }
    
    /* Trends visualization */
    .trends-visualization {
      margin: 15px 0;
    }
    
    .trends-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 10px;
    }
    
    .trend-card {
      background-color: rgba(10, 20, 40, 0.5);
      border: 1px solid rgba(0, 150, 255, 0.3);
      border-radius: 6px;
      padding: 10px;
      text-align: center;
    }
    
    .trend-icon {
      width: 40px;
      height: 40px;
      margin: 0 auto 10px;
      border-radius: 50%;
      background-color: rgba(0, 150, 255, 0.3);
      position: relative;
    }
    
    .trend-icon.digital::before {
      content: '📱';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    
    .trend-icon.ai::before {
      content: '🤖';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    
    .trend-icon.sustainable::before {
      content: '🌱';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    
    .trend-icon.regulatory::before {
      content: '⚖️';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    
    .trend-title {
      font-size: 0.9rem;
      color: #00a8ff;
      margin-bottom: 5px;
    }
    
    .trend-value {
      font-size: 0.8rem;
      color: #00f2fe;
    }
    
    /* Leaders section */
    .leaders-section {
      margin-top: 15px;
    }
    
    .leaders-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
    }
    
    .leader-card {
      background-color: rgba(10, 20, 40, 0.5);
      border: 1px solid rgba(0, 150, 255, 0.3);
      border-radius: 8px;
      padding: 15px;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .leader-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 5px 15px rgba(0, 168, 255, 0.3);
    }
    
    .leader-logo {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      margin-bottom: 10px;
    }
    
    .leader-name {
      font-size: 1rem;
      color: #00a8ff;
      text-align: center;
      margin-bottom: 5px;
    }
    
    .leader-stats {
      font-size: 0.8rem;
      color: #ccd6f6;
      text-align: center;
      margin-bottom: 10px;
    }
    
    .leader-connect-btn {
      background-color: rgba(0, 150, 255, 0.3);
      border: 1px solid #00a8ff;
      color: #ccd6f6;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .leader-connect-btn:hover {
      background-color: rgba(0, 150, 255, 0.5);
    }
    
    /* Connect with experts section */
    .connect-actions {
      margin-top: 25px;
      background-color: rgba(10, 20, 40, 0.3);
      border-radius: 8px;
      padding: 15px;
      border: 1px solid rgba(0, 150, 255, 0.2);
    }
    
    .experts-search {
      display: flex;
      margin-bottom: 15px;
    }
    
    .experts-search-input {
      flex: 1;
      background-color: rgba(10, 20, 40, 0.5);
      border: 1px solid rgba(0, 150, 255, 0.3);
      color: #ccd6f6;
      padding: 8px 12px;
      border-radius: 4px 0 0 4px;
    }
    
    .search-btn {
      background-color: rgba(0, 150, 255, 0.3);
      border: 1px solid #00a8ff;
      color: #ccd6f6;
      padding: 8px 12px;
      border-radius: 0 4px 4px 0;
      cursor: pointer;
    }
    
    .experts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .expert-card {
      background-color: rgba(10, 20, 40, 0.5);
      border: 1px solid rgba(0, 150, 255, 0.3);
      border-radius: 8px;
      padding: 15px;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .expert-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      flex-shrink: 0;
    }
    
    .expert-details {
      flex: 1;
    }
    
    .expert-name {
      font-size: 1rem;
      color: #00a8ff;
      margin-bottom: 5px;
    }
    
    .expert-badge {
      color: gold;
      margin-left: 5px;
    }
    
    .expert-title {
      font-size: 0.8rem;
      color: #ccd6f6;
      margin-bottom: 3px;
    }
    
    .expert-industry {
      font-size: 0.7rem;
      color: #00f2fe;
      margin-bottom: 5px;
    }
    
    .expert-stats {
      display: flex;
      gap: 10px;
    }
    
    .expert-stat {
      font-size: 0.7rem;
      color: #ccd6f6;
      background-color: rgba(0, 150, 255, 0.1);
      padding: 2px 6px;
      border-radius: 10px;
    }
    
    .connect-btn {
      background-color: rgba(0, 150, 255, 0.3);
      border: 1px solid #00a8ff;
      color: #ccd6f6;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 0.9rem;
      cursor: pointer;
      white-space: nowrap;
    }
    
    .see-more-container {
      text-align: center;
    }
    
    .see-more-btn {
      background-color: transparent;
      border: 1px solid rgba(0, 150, 255, 0.3);
      color: #00a8ff;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .see-more-btn:hover {
      background-color: rgba(0, 150, 255, 0.1);
    }
    
    /* Events section */
    .industry-events {
      margin-top: 25px;
      background-color: rgba(10, 20, 40, 0.3);
      border-radius: 8px;
      padding: 15px;
      border: 1px solid rgba(0, 150, 255, 0.2);
    }
    
    .events-container {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
    }
    
    .event-card {
      background-color: rgba(10, 20, 40, 0.5);
      border: 1px solid rgba(0, 150, 255, 0.3);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 15px;
      flex: 1;
      min-width: 280px;
    }
    
    .event-date {
      background-color: rgba(0, 150, 255, 0.2);
      border-radius: 6px;
      padding: 8px;
      text-align: center;
      width: 50px;
      flex-shrink: 0;
    }
    
    .event-month {
      font-size: 0.7rem;
      color: #ccd6f6;
      margin-bottom: 3px;
    }
    
    .event-day {
      font-size: 1.2rem;
      font-weight: bold;
      color: #00f2fe;
    }
    
    .event-details {
      flex: 1;
    }
    
    .event-title {
      font-size: 0.9rem;
      color: #00a8ff;
      margin-bottom: 5px;
    }
    
    .event-location {
      font-size: 0.8rem;
      color: #ccd6f6;
      margin-bottom: 3px;
    }
    
    .event-attendees {
      font-size: 0.7rem;
      color: #00f2fe;
    }
    
    .event-btn {
      background-color: rgba(0, 150, 255, 0.3);
      border: 1px solid #00a8ff;
      color: #ccd6f6;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 0.8rem;
      cursor: pointer;
      white-space: nowrap;
    }
    
    .event-btn:hover {
      background-color: rgba(0, 150, 255, 0.5);
    }
    
    /* Key Topics */
    .key-topics {
      margin: 15px 0;
    }
    
    .topics-title {
      font-size: 1rem;
      color: #00a8ff;
      margin-bottom: 10px;
    }
    
    .topics-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .topic-tag {
      background-color: rgba(0, 150, 255, 0.1);
      border: 1px solid rgba(0, 150, 255, 0.3);
      border-radius: 15px;
      padding: 5px 12px;
      font-size: 0.8rem;
      color: #ccd6f6;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }
    
    .topic-tag:hover {
      background-color: rgba(0, 150, 255, 0.3);
      transform: translateY(-2px);
    }
  `;

  return (
    <div className={`App ${showGraphs ? 'graphs-active' : ''}`}>
      <style>{connectStyles}</style>
      {!loadingComplete ? (
        <SplineLoader onLoadingComplete={handleLoadingComplete} />
      ) : (
        <>
          {/* Main Spline Animation filling the entire viewport */}
          <div className="spline-container">
            {/* Use splineInitialized to ensure it's only mounted once */}
            {splineInitialized && (
              <SplineViewer 
                ref={splineInstanceRef}
                url="https://prod.spline.design/MLpQD4kA7Miyykt9/scene.splinecode"
                options={{
                  hint: true,
                  'loading-anim-type': 'spinner-small-dark'
                }}
                persistOnUpdate={true}
              />
            )}
            
            {/* Graph visualization overlay when detected in transcript */}
            {showGraphs && (
              <div className={`graph-overlay ${showGraphs ? 'visible' : ''}`}>
          <button 
                  className="dismiss-graphs-btn"
                  onClick={() => {
                    setShowGraphs(false);
                    // Mark graphs as manually dismissed to prevent auto-showing
                    setGraphsManuallyDismissed(true);
                    // Release the L key when graphs are dismissed
                    releaseKey('l');
                    // Clear any existing interval
                    if (graphIntervalRef.current) {
                      clearInterval(graphIntervalRef.current);
                      graphIntervalRef.current = null;
                    }
                  }}
                >
                  <span className="btn-icon">×</span>
                  <span className="btn-text">Hide Graphs</span>
          </button>
                
                {/* Always render both graphs in a column when visible */}
                <div className={`graph-container ${graphsAnimated ? 'animated' : ''}`}>
                  <h3 className="graph-title">{extractTitleFromTranscript()}</h3>
                  <div className="floating-data">+65%</div>
                  <div className="neon-graph bar-graph">
                    <div className="y-axis">
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                      <span>0%</span>
                    </div>
                    <div className="bar-container">
                      <div className="grid-lines">
                        <div className="grid-line"></div>
                        <div className="grid-line"></div>
                        <div className="grid-line"></div>
                        <div className="grid-line"></div>
                      </div>
                      <div className="bar" style={{ height: '60%' }}><span className="bar-label">Q1</span></div>
                      <div className="bar" style={{ height: '80%' }}><span className="bar-label">Q2</span></div>
                      <div className="bar" style={{ height: '40%' }}><span className="bar-label">Q3</span></div>
                      <div className="bar" style={{ height: '90%' }}><span className="bar-label">Q4</span></div>
                      <div className="bar" style={{ height: '65%' }}><span className="bar-label">YTD</span></div>
                    </div>
                  </div>
                  <div className="x-axis-label">Quarterly Results</div>
                </div>
                
                <div className={`graph-container ${graphsAnimated ? 'animated' : ''}`}>
                  <h3 className="graph-title">Trend Analysis</h3>
                  <div className="floating-data trend-up">↗ 32%</div>
                  <div className="neon-graph line-graph">
                    <div className="y-axis">
                      <span>High</span>
                      <span>Med</span>
                      <span>Low</span>
                    </div>
                    <svg viewBox="0 0 100 50" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#00ffff" stopOpacity="0.7" />
                          <stop offset="100%" stopColor="#0088ff" stopOpacity="0.9" />
                        </linearGradient>
                      </defs>
                      <g className="grid-lines">
                        <line x1="0" y1="10" x2="100" y2="10" className="grid-line" />
                        <line x1="0" y1="25" x2="100" y2="25" className="grid-line" />
                        <line x1="0" y1="40" x2="100" y2="40" className="grid-line" />
                      </g>
                      <path d="M10,40 L28,35 L43,30 L58,25 L73,20 L88,10" 
                            stroke="url(#lineGradient)" 
                            strokeWidth="2" 
                            fill="none" 
                            className="animated-path" />
                      {[10, 28, 43, 58, 73, 88].map((x, i) => (
                        <circle 
                          key={i} 
                          cx={x} 
                          cy={[40, 35, 30, 25, 20, 10][i]} 
                          r="1.5" 
                          className="chart-point" 
                        />
                      ))}
                    </svg>
                  </div>
                  <div className="x-axis-label">Time Period (Jan-Jun)</div>
                </div>
              </div>
        )}
      </div>
      
          {/* Minimal UI sidebar */}
          <div className={`sidebar ${showUI ? 'open' : 'closed'} ${showGraphs ? 'fade-out' : ''}`} data-active-tab={activeTab}>
            <div className="toggle-ui" onClick={() => setShowUI(!showUI)}>
              {showUI ? '×' : '≡'}
            </div>
            
            <div className="sidebar-content">
              <h2>
                <span className="ai-voice-text">AI Assistant</span>
              </h2>
              
              <div className="tabs-container">
                <button 
                  className={`tab-btn ${activeTab === 'voice' ? 'active' : ''}`}
                  onClick={() => setActiveTab('voice')}
                >
                  Voice
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('finance')}
                >
                  Finance
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'connect' ? 'active' : ''}`}
                  onClick={() => setActiveTab('connect')}
                >
                  Connect
                </button>
              </div>
              
              {activeTab === 'voice' && (
                <>
                  <div className="status-indicator">
                    <div className={`status-dot ${isCallActive || accessToken ? 'active' : 'inactive'}`}></div>
                    <span>{isCallActive || accessToken ? 'Connected' : 'Disconnected'}</span>
                  </div>
                  
                  {micPermission !== 'granted' && (
                    <button 
                      onClick={requestMicrophonePermission}
                      className="btn-secondary btn-small"
                    >
                      Enable Mic
                    </button>
                  )}
                  
                  <div className="control-buttons">
                    <button 
                      onClick={!accessToken || isTokenExpired() ? generateAccessToken : startCall} 
                      disabled={isGeneratingToken || (isCallActive && accessToken)}
                      className="btn-primary"
                    >
                      {!accessToken || isTokenExpired() 
                        ? "Connect" 
                        : isGeneratingToken 
                          ? "Loading..." 
                          : "Start Call"}
                    </button>
                    
                    {isCallActive && (
        <button 
          onClick={stopCall} 
                        className="btn-danger"
                      >
                        End Call
        </button>
                    )}
      </div>
      
                  {eventStatus.error && (
                    <div className="error-badge">
                      Error: {eventStatus.error}
            </div>
          )}
                  
                  {/* Minimalistic talking indicator */}
                  {isCallActive && (
                    <div className={`talking-indicator ${showGraphs ? 'fade-out' : ''}`}>
                      {eventStatus.agentStartTalking && !eventStatus.agentStopTalking ? (
                        <div className="wave-animation">
                          <div className="wave"></div>
                          <div className="wave"></div>
                          <div className="wave"></div>
                          <div className="wave"></div>
        </div>
                      ) : null}
        </div>
                  )}
                  
                  {/* Transcript in a minimal scrollable area */}
        {eventStatus.transcript && (
                    <div className={`mini-transcript ${showGraphs ? 'fade-out' : ''}`}>
            <p style={{ whiteSpace: 'pre-line' }}>{eventStatus.transcript}</p>
          </div>
        )}
                </>
              )}

              {activeTab === 'finance' && (
                <Finance />
              )}
              
              {activeTab === 'connect' && (
                <div className="connect-tab">
                  <h3 className="section-title">Industry Insights</h3>
                  
                  <div className="industry-selector">
                    {Object.keys(industryData).map((industry) => (
                      <button 
                        key={industry}
                        className={`industry-btn ${selectedIndustry === industry ? 'active' : ''}`}
                        onClick={() => setSelectedIndustry(industry)}
                      >
                        {industry}
                      </button>
                    ))}
                  </div>
                  
                  <div className="industry-data-container">
                    {selectedIndustry && industryData[selectedIndustry] && (
                      <div className="industry-sections">
                        <div className="industry-header">
                          <h3>{selectedIndustry}</h3>
                          <div className="industry-stats">
                            <div className="industry-stat">
                              <span className="stat-value">156</span>
                              <span className="stat-label">Experts</span>
                            </div>
                            <div className="industry-stat">
                              <span className="stat-value">47</span>
                              <span className="stat-label">Companies</span>
                            </div>
                            <div className="industry-stat">
                              <span className="stat-value">832</span>
                              <span className="stat-label">Reports</span>
                            </div>
                          </div>
                        </div>
                        
                        {Object.entries(industryData[selectedIndustry]).map(([section, content]) => (
                          <div key={section} className="industry-section">
                            <h4 className="section-header">{section}</h4>
                            <div className="section-content">
                              {section === "Industry Insights" && (
                                <div className="key-topics">
                                  <h5 className="topics-title">Key Topics</h5>
                                  <div className="topics-grid">
                                    {extractKeyTopics(content).map((topic, index) => (
                                      <button key={index} className="topic-tag">
                                        {topic}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {section === "Market size" && (
                                <div className="data-visualization">
                                  <div className="chart-container">
                                    <div className="chart-header">
                                      <h5>{extractSectionTitle(content)}</h5>
                                      <div className="chart-controls">
                                        <button className="chart-control-btn">Year</button>
                                        <button className="chart-control-btn">Region</button>
                                        <button className="chart-control-btn">Compare</button>
                                      </div>
                                    </div>
                                    <div className="chart-visualization">
                                      <svg viewBox="0 0 100 50" className="market-chart">
                                        <defs>
                                          <linearGradient id="marketGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#00a8ff" />
                                            <stop offset="100%" stopColor="#00f2fe" />
                                          </linearGradient>
                                        </defs>
                                        <g className="grid-lines">
                                          <line x1="0" y1="10" x2="100" y2="10" className="grid-line" />
                                          <line x1="0" y1="20" x2="100" y2="20" className="grid-line" />
                                          <line x1="0" y1="30" x2="100" y2="30" className="grid-line" />
                                          <line x1="0" y1="40" x2="100" y2="40" className="grid-line" />
                                        </g>
                                        <path d="M10,40 L28,35 L43,30 L58,25 L73,20 L88,10" 
                                              stroke="url(#marketGradient)" 
                                              strokeWidth="2" 
                                              fill="none" 
                                              className="animated-path" />
                                        {[10, 28, 43, 58, 73, 88].map((x, i) => (
                                          <circle 
                                            key={i} 
                                            cx={x} 
                                            cy={[40, 35, 30, 25, 20, 10][i]} 
                                            r="1.5" 
                                            className="chart-point" 
                                          />
                                        ))}
                                        <g className="chart-labels">
                                          <text x="10" y="47" className="year-label">2019</text>
                                          <text x="28" y="47" className="year-label">2020</text>
                                          <text x="43" y="47" className="year-label">2021</text>
                                          <text x="58" y="47" className="year-label">2022</text>
                                          <text x="73" y="47" className="year-label">2023</text>
                                          <text x="88" y="47" className="year-label">2024</text>
                                        </g>
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="data-highlights">
                                    {(() => {
                                      const stats = formatIndustryStats(selectedIndustry);
                                      return (
                                        <>
                                          <div className="highlight-card">
                                            <div className="highlight-value">{stats.growth}</div>
                                            <div className="highlight-label">YoY Growth</div>
                                          </div>
                                          <div className="highlight-card">
                                            <div className="highlight-value">{stats.marketSize}</div>
                                            <div className="highlight-label">Market Size</div>
                                          </div>
                                          <div className="highlight-card">
                                            <div className="highlight-value">{stats.cagr}</div>
                                            <div className="highlight-label">CAGR</div>
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}
                              
                              {section === "Industry trends" && (
                                <div className="trends-visualization">
                                  <div className="trends-grid">
                                    <div className="trend-card">
                                      <div className="trend-icon digital"></div>
                                      <div className="trend-title">Digital Transformation</div>
                                      <div className="trend-value">+65% Adoption</div>
                                    </div>
                                    <div className="trend-card">
                                      <div className="trend-icon ai"></div>
                                      <div className="trend-title">AI Integration</div>
                                      <div className="trend-value">+78% Investment</div>
                                    </div>
                                    <div className="trend-card">
                                      <div className="trend-icon sustainable"></div>
                                      <div className="trend-title">Sustainability</div>
                                      <div className="trend-value">+42% Focus</div>
                                    </div>
                                    <div className="trend-card">
                                      <div className="trend-icon regulatory"></div>
                                      <div className="trend-title">Regulatory Changes</div>
                                      <div className="trend-value">+30% Impact</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="content-text">
                                {content}
                              </div>
                              
                              {section === "Industry leaders" && (
                                <div className="leaders-section">
                                  <div className="leaders-grid">
                                    {selectedIndustry === "Financial Institutions" && (
                                      <>
                                        <div className="leader-card">
                                          <div className="leader-logo" style={{backgroundColor: '#00a8ff'}}>JPM</div>
                                          <div className="leader-name">JPMorgan Chase</div>
                                          <div className="leader-stats">$490B Market Cap</div>
                                          <button className="leader-connect-btn">Connect</button>
                                        </div>
                                        <div className="leader-card">
                                          <div className="leader-logo" style={{backgroundColor: '#0097e6'}}>BOA</div>
                                          <div className="leader-name">Bank of America</div>
                                          <div className="leader-stats">$200B+ Market Cap</div>
                                          <button className="leader-connect-btn">Connect</button>
                                        </div>
                                        <div className="leader-card">
                                          <div className="leader-logo" style={{backgroundColor: '#00f2fe'}}>ICBC</div>
                                          <div className="leader-name">Industrial & Commercial Bank of China</div>
                                          <div className="leader-stats">$200B+ Market Cap</div>
                                          <button className="leader-connect-btn">Connect</button>
                                        </div>
                                      </>
                                    )}
                                    
                                    {selectedIndustry === "Financial Services" && (
                                      <>
                                        <div className="leader-card">
                                          <div className="leader-logo" style={{backgroundColor: '#00a8ff'}}>PPL</div>
                                          <div className="leader-name">PayPal</div>
                                          <div className="leader-stats">Top E-commerce Payment Provider</div>
                                          <button className="leader-connect-btn">Connect</button>
                                        </div>
                                        <div className="leader-card">
                                          <div className="leader-logo" style={{backgroundColor: '#0097e6'}}>AP</div>
                                          <div className="leader-name">Apple Pay</div>
                                          <div className="leader-stats">Leading Mobile Wallet</div>
                                          <button className="leader-connect-btn">Connect</button>
                                        </div>
                                        <div className="leader-card">
                                          <div className="leader-logo" style={{backgroundColor: '#00f2fe'}}>KLR</div>
                                          <div className="leader-name">Klarna</div>
                                          <div className="leader-stats">Top BNPL Provider</div>
                                          <button className="leader-connect-btn">Connect</button>
                                        </div>
                                      </>
                                    )}
                                    
                                    {selectedIndustry === "IT Services" && (
                                      <>
                                        <div className="leader-card">
                                          <div className="leader-logo" style={{backgroundColor: '#00a8ff'}}>MSFT</div>
                                          <div className="leader-name">Microsoft</div>
                                          <div className="leader-stats">Leading Cloud Provider</div>
                                          <button className="leader-connect-btn">Connect</button>
                                        </div>
                                        <div className="leader-card">
                                          <div className="leader-logo" style={{backgroundColor: '#0097e6'}}>AWS</div>
                                          <div className="leader-name">Amazon Web Services</div>
                                          <div className="leader-stats">Top Infrastructure Provider</div>
                                          <button className="leader-connect-btn">Connect</button>
                                        </div>
                                        <div className="leader-card">
                                          <div className="leader-logo" style={{backgroundColor: '#00f2fe'}}>IBM</div>
                                          <div className="leader-name">IBM</div>
                                          <div className="leader-stats">Enterprise Services Leader</div>
                                          <button className="leader-connect-btn">Connect</button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="connect-actions">
                    <h4>Connect with Industry Experts</h4>
                    <div className="experts-search">
                      <input type="text" placeholder="Search experts in this industry..." className="experts-search-input" />
                      <button className="search-btn">🔍</button>
                    </div>
                    
                    <div className="experts-grid">
                      <div className="expert-card">
                        <div className="expert-avatar" style={{backgroundColor: '#00a8ff'}}>JD</div>
                        <div className="expert-details">
                          <div className="expert-name">Jane Doe <span className="expert-badge">★</span></div>
                          <div className="expert-title">Investment Director at Global Finance</div>
                          <div className="expert-industry">{selectedIndustry}</div>
                          <div className="expert-stats">
                            <span className="expert-stat">94% match</span>
                            <span className="expert-stat">15 yrs exp</span>
                          </div>
                        </div>
                        <button className="connect-btn">Connect</button>
                      </div>
                      
                      <div className="expert-card">
                        <div className="expert-avatar" style={{backgroundColor: '#0097e6'}}>JS</div>
                        <div className="expert-details">
                          <div className="expert-name">John Smith</div>
                          <div className="expert-title">Financial Advisor, Morgan Stanley</div>
                          <div className="expert-industry">{selectedIndustry}</div>
                          <div className="expert-stats">
                            <span className="expert-stat">87% match</span>
                            <span className="expert-stat">8 yrs exp</span>
                          </div>
                        </div>
                        <button className="connect-btn">Connect</button>
                      </div>
                      
                      <div className="expert-card">
                        <div className="expert-avatar" style={{backgroundColor: '#00f2fe'}}>AT</div>
                        <div className="expert-details">
                          <div className="expert-name">Amy Thompson</div>
                          <div className="expert-title">Tax Consultant, Deloitte</div>
                          <div className="expert-industry">{selectedIndustry}</div>
                          <div className="expert-stats">
                            <span className="expert-stat">82% match</span>
                            <span className="expert-stat">12 yrs exp</span>
                          </div>
                        </div>
                        <button className="connect-btn">Connect</button>
                      </div>
                    </div>
                    
                    <div className="see-more-container">
                      <button className="see-more-btn">See More Experts</button>
                    </div>
                  </div>
                  
                  <div className="industry-events">
                    <h4>Upcoming Industry Events</h4>
                    <div className="events-container">
                      <div className="event-card">
                        <div className="event-date">
                          <div className="event-month">MAY</div>
                          <div className="event-day">15</div>
                        </div>
                        <div className="event-details">
                          <div className="event-title">{selectedIndustry} Innovation Summit</div>
                          <div className="event-location">New York, NY</div>
                          <div className="event-attendees">34 connections attending</div>
                        </div>
                        <button className="event-btn">RSVP</button>
                      </div>
                      
                      <div className="event-card">
                        <div className="event-date">
                          <div className="event-month">JUN</div>
                          <div className="event-day">22</div>
                        </div>
                        <div className="event-details">
                          <div className="event-title">Global {selectedIndustry} Conference</div>
                          <div className="event-location">San Francisco, CA</div>
                          <div className="event-attendees">12 connections attending</div>
                        </div>
                        <button className="event-btn">RSVP</button>
                      </div>
                      
                      <div className="event-card">
                        <div className="event-date">
                          <div className="event-month">JUL</div>
                          <div className="event-day">10</div>
                        </div>
                        <div className="event-details">
                          <div className="event-title">{selectedIndustry} Future Trends 2025</div>
                          <div className="event-location">Virtual Event</div>
                          <div className="event-attendees">56 connections attending</div>
                        </div>
                        <button className="event-btn">RSVP</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Add face direction component at the bottom */}
          <FaceDirectionComponent />
        </>
      )}
    </div>
  );
}

export default App;