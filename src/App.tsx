/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef, useCallback } from 'react';

import './App.css'
import { GuessType, GuessHistory } from './components/GuessHistory';
import WebSocketClient from './components/WebSocketClient';

export function App() {
  const [words, setWords] = useState<string[]>([]);
  const [randomWord, setRandomWord] = useState<string>('');
  const [guesses, setGuesses] = useState<GuessType[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [winState, setWinState] = useState<boolean>(false);

  const [status, setStatus] = useState<string>('🟠'); // Initial status is reconnecting
  const [statusText, setStatusText] = useState<string>('not connected'); // Initial status is reconnecting

  const ws = useRef<WebSocket | null>(null);

  // Use refs to store the latest values
  const randomWordRef = useRef(randomWord);
  const winStateRef = useRef(winState);

  // Update refs whenever state changes
  useEffect(() => {
    randomWordRef.current = randomWord;
  }, [randomWord]);

  useEffect(() => {
    winStateRef.current = winState;
  }, [winState]);


  useEffect(() => {
    const fetchAndSetWords = async () => {
      const words = await fetchWords('./words5.txt');
      setWords(words);
    };
    fetchAndSetWords();
  }, []);

  const handleGetRandomWord = useCallback(() => {
    if (words.length > 0) {
      setRandomWord(getRandomWord(words).toLocaleLowerCase());
      setInputValue("");
      setGuesses([]);
      setWinState(false);
    }
  }, [words]);

  const doGuess = useCallback((inGuess: string, src = 'local') => {
    const currentRandomWord = randomWordRef.current;
    const currentWinState = winStateRef.current;
    if (!currentRandomWord || currentRandomWord === "") {
      console.log("doGuess) NO RANDOM WORD, GAME NOT ACTIVE", typeof currentRandomWord, { currentRandomWord });
      return;
    }
    if (currentWinState === true) {
      console.log("doGuess) GAME IS WON, NO NEW GUESSES", typeof currentWinState, { currentWinState });
      return;
    }
    if (inGuess === "") {
      console.log("doGuess) empty guess, likely broken/missing");
      return;
    }
    if (inGuess.length !== 5) {
      console.log("doGuess) guess wrong length");
      return;
    }

    const cleanGuess = inGuess.toLocaleLowerCase().replace(/[^a-z]*/g, "");
    if (cleanGuess.length !== 5) {
      console.log("doGuess) clean guess wrong length. needed ===5, got ", cleanGuess.length, typeof cleanGuess, { cleanGuess });
      return;
    }

    // push to top of history
    setGuesses(guesses => [...guesses, { guess: cleanGuess, src }]);
    // clear it
    if (currentRandomWord.toLocaleLowerCase() === inGuess.toLocaleLowerCase()) {
      setWinState(true);
    }
    setInputValue("");
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value.toLocaleLowerCase());
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const key = event.key;
    // Allow only letters
    if (!/^[a-zA-Z]$/.test(key) && key !== 'Backspace' && key !== 'Tab' && key !== 'Enter') {
      event.preventDefault();
      return;
    }

    if (inputValue.length >= 5 && key !== 'Backspace' && key !== 'Tab' && key !== 'Enter') {
      event.preventDefault();
      return;
    }

    if (key === 'Enter') {
      if (inputValue.length === 5) {
        doGuess(inputValue);
      } else {
        window.alert("enter exactly 5 letters")
      }
      // key was handled, stop here
      return;
    }

  };


  useEffect(() => {
    const connectWebSocket = () => {
      setStatus('🟡'); // Attempting to reconnect
      setStatusText('Attempting to reconnect'); // Attempting to reconnect
      ws.current = new WebSocket('ws://localhost:8080');

      ws.current.onopen = () => {
        console.log('Connected to server');
        setStatus('🟢'); // Connected
        setStatusText('connected'); // Connected

        // Send registration message
        if (ws.current) {
          ws.current.send(JSON.stringify({ type: 'register', as: 'game' }));
        }
      };

      ws.current.onmessage = (event) => {
        console.log(`WS Received message: ${event.data}`);
        // Process incoming messages here if needed

        const parsedMessage = JSON.parse(event.data.toString());
        console.log(parsedMessage);

        if (parsedMessage !== false) {
          switch (parsedMessage?.type) {
            case "guess":
              doGuess(parsedMessage?.guess ?? "", 'net');
              break;
            case "hello":
              // server said hello
              console.log("HELLO from server");
              break;
            case "command":
              // got a request to run a command
              console.log("incoming command!", parsedMessage?.command);
              switch (parsedMessage?.command) {
                case "newword":
                  console.log("currnet winState is:", winStateRef.current);
                  if (winStateRef.current === true) {
                    console.log("attempting to call handleGetRandomWord()")
                    handleGetRandomWord();
                  } else {
                    console.log("game isnt won, ignoring `newword` comand")
                  }
                  break;
                default:
                  console.error("unhandled command triggered", parsedMessage?.command);
              }
              break;
            default:
              // other type
              console.log(`unknown 'type': ${parsedMessage?.type ?? "<nullish>"}`);

          }
        } else {
          //was false, bad parse
          console.error("non structured message:", JSON.stringify(event.data));
        }

      };

      ws.current.onclose = () => {
        console.log('Disconnected from server');
        setStatus('🔴'); // Disconnected
        setStatusText('disconnected'); // Disconnected
        setTimeout(connectWebSocket, 3000); // Reconnect after 3 seconds
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [doGuess, handleGetRandomWord]);

  const bigCommand = {
    fontSize: "x-large",
    color: "red",
    padding: "0.5rem",
    margin: "0.5rem",
    width: "fit-content",
    display: "inline-block",
    borderStyle: "outset",
  }

  const innerBigCommand = {
    textDecoration: "underline dotted",
    color: "white",
    fontSize: "150%"
  }

  return (
    <>
      <div id="controls">
        <WebSocketClient status={status} statusText={statusText} />
        <button onClick={handleGetRandomWord}>♻️ New Random Word</button>
        {randomWord && !winState && <span title={randomWord}>🆘</span>}
        {randomWord && winState && <span title="good job!">👍</span>}
      </div>
      <div>
        {randomWord && !winState && (
          <>
            <input
              type="text"
              id="wordInput"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={winState}
              pattern="[A-Za-z]{5}"
              size={7}
              placeholder='guess?'
            />
            <br />
            <big style={bigCommand}>use <code style={innerBigCommand}>!guess [your word]</code> in chat</big>
          </>
        )}
        {randomWord && winState && (
          <>
            <big style={bigCommand}>use <code style={innerBigCommand}>!newword</code> in chat</big>
          </>
        )}
      </div>
      <GuessHistory current={randomWord} thepast={guesses} />
    </>
  )
}

async function fetchWords(filePath: string): Promise<string[]> {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const text = await response.text();
    return text.split('\n').map(word => word.trim()).filter(word => word.length > 0);
  } catch (error) {
    console.error('Error fetching and parsing the file:', error);
    return [];
  }
}

function getRandomWord(words: string[]): string {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}
