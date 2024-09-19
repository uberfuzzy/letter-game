/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef, useCallback } from 'react';

import './App.css'
import { GuessType, GuessHistory } from './components/GuessHistory';

export function App() {
  const [words, setWords] = useState<string[]>([]);
  const [randomWord, setRandomWord] = useState<string>('');
  const [guesses, setGuesses] = useState<GuessType[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [winState, setWinState] = useState<boolean>(false);
  const [newWordText, setNewWordText] = useState<string>('Start!');
  const [inputRegex, setInputRegex] = useState<string>("[A-Za-z]{5}");
  const [wordSetLength, setWordSetLength] = useState<number>(5);

  // Use refs to store the latest values
  const randomWordRef = useRef(randomWord);
  const winStateRef = useRef(winState);

  // Update refs whenever state changes
  useEffect(() => {
    randomWordRef.current = randomWord;
    setInputRegex(`[A-Za-z]{${randomWord.length}}`);
  }, [randomWord]);

  useEffect(() => {
    winStateRef.current = winState;
  }, [winState]);


  useEffect(() => {
    const fetchAndSetWords = async () => {
      const words = await fetchWords(`./words${wordSetLength}.txt`);
      setWords(words);
    };
    fetchAndSetWords();
  }, [wordSetLength]);

  const handleGetRandomWord = useCallback(() => {
    if (words.length > 0) {
      setRandomWord(getRandomWord(words).toLocaleLowerCase());
      setInputValue("");
      setGuesses([]);
      setWinState(false);
      window.setTimeout(() => {
        document.getElementById('wordInput')?.focus();
        setNewWordText('♻️ New Random Word');
      }, 1);
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
    if (inGuess.length !== currentRandomWord.length) {
      console.log("doGuess) guess wrong length", inGuess?.length, currentRandomWord?.length);
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

    if (inputValue.length >= randomWord.length && key !== 'Backspace' && key !== 'Tab' && key !== 'Enter') {
      event.preventDefault();
      return;
    }

    if (key === 'Enter') {
      if (inputValue.length === randomWord.length) {
        doGuess(inputValue);
      } else {
        window.alert(`enter exactly ${randomWord.length} letters`)
      }
      // key was handled, stop here
      return;
    }

  };

  const handleLengthRadioChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    // event.preventDefault();
    const myValue = parseInt(event.target.value, 10);
    setWordSetLength(myValue);
  }, [])

  return (
    <>
      <h1>Letter Game</h1>
      <div id="controls">
        <div>
          Word length set:
          <label><input type='radio' name='wordLengthRadio' value='5' onChange={handleLengthRadioChange} defaultChecked /> 5</label>
          <label><input type='radio' name='wordLengthRadio' value='6' onChange={handleLengthRadioChange} /> 6</label>
        </div>
        <button onClick={handleGetRandomWord}>{newWordText}</button>
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
              pattern={inputRegex}
              size={7}
              placeholder=''
            />
            <br />
            Length: {randomWord.length}<br />
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
