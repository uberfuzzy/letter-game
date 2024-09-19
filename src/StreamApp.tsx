/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef, useCallback } from 'react';

import './App.css'
import './StreamApp.css'

import { GuessType, GuessHistory } from './components/GuessHistory';
import WebSocketClient from './components/WebSocketClient';

export function StreamApp() {
  const [words, setWords] = useState<string[]>([]);
  const [randomWord, setRandomWord] = useState<string>('');
  const [guesses, setGuesses] = useState<GuessType[]>([]);
  const [winState, setWinState] = useState<boolean>(false);

  const [status, setStatus] = useState<string>('🟠'); // Initial status is reconnecting
  const [statusText, setStatusText] = useState<string>('not connected'); // Initial status is reconnecting

  const [wordSetLength, _setWordSetLength] = useState<number>(5);

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

  const doNewWordStuff = useCallback(() => {
    if (words.length > 0) {
      setWinState(false);
      setGuesses([]);
      const newWord = selectRandomWord(words).toLocaleLowerCase();
      console.log("doNewWordStuff()", `new word is: ${newWord}`);

      if (ws && ws?.current) {
        ws.current.send(JSON.stringify({ type: 'newWord', word: newWord }));
      }

      setRandomWord(newWord);
    }
  }, [words])

  const handleGetRandomWord = () => {
    doNewWordStuff();
  };

  useEffect(() => {
    const fetchAndSetWords = async () => {
      const words = await fetchWords(`./words${wordSetLength}.txt`);
      setWords(words);
    };
    fetchAndSetWords();
  }, [wordSetLength]);

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
    if (inGuess.length !== currentRandomWord.length) {
      console.log("doGuess) guess wrong length");
      return;
    }

    const cleanGuess = inGuess.toLocaleLowerCase().replace(/[^a-z]*/g, "");
    if (cleanGuess.length !== currentRandomWord.length) {
      console.log(`doGuess) clean guess wrong length. needed ===${currentRandomWord.length}, got `, cleanGuess.length, typeof cleanGuess, { cleanGuess });
      return;
    }

    // push to top of history
    setGuesses(guesses => [...guesses, { guess: cleanGuess, src }]);
    // clear it
    if (currentRandomWord.toLocaleLowerCase() === inGuess.toLocaleLowerCase()) {
      setWinState(true);
    }
  }, []);

  useEffect(() => {
    const connectWebSocket = () => {
      setStatus('🟡'); // Attempting to reconnect
      setStatusText('Attempting to reconnect'); // Attempting to reconnect
      ws.current = new WebSocket('ws://localhost:8080');

      ws.current.onopen = () => {
        console.log('Connected to server');
        setStatus('🟢'); // Connected
        setStatusText('connected'); // Connected

        // TODO somehow check and only do this on (re)connect if randomWord is blank or if winState==win
        // aka dont interupt a game in progress
        doNewWordStuff();

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
                    console.log("attempting to call doNewWordStuff()")
                    doNewWordStuff();
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
  }, [doGuess, doNewWordStuff]);

  return (
    <>
      <h1>Letter Game (on Stream)</h1>
      <div id="controls">
        <span className='upperLeft'>
          <WebSocketClient status={status} statusText={statusText} />
        </span>
        <button className='upperRight hideUnlessHover' onClick={handleGetRandomWord}>♻️</button>
      </div>
      <div>
        {randomWord && !winState && (
          <>
            <big className='bigCommand'>use <code className='innerBigCommand'>!guess [your word]</code> in chat</big><br />
            Word Length: {randomWord.length}|{wordSetLength}<br />
          </>
        )}
        {randomWord && winState && (
          <>
            <big className='bigCommand'>use <code className='innerBigCommand'>!newword</code> in chat</big>
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

function selectRandomWord(words: string[]): string {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}
