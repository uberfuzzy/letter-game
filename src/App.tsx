/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';

import './App.css'
import { GuessHistory } from './components/GuessHistory';

function App() {
  const [words, setWords] = useState<string[]>([]);
  const [randomWord, setRandomWord] = useState<string>('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [winState, setWinState] = useState<boolean>(false);

  useEffect(() => {
    const fetchAndSetWords = async () => {
      const words = await fetchWords('./words.txt');
      setWords(words);
    };
    fetchAndSetWords();
  }, []);

  const handleGetRandomWord = () => {
    if (words.length > 0) {
      setRandomWord(getRandomWord(words).toLocaleLowerCase());
      setInputValue("");
      setGuesses([]);
      setWinState(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value.toLocaleLowerCase());
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (inputValue.length === 5) {
        // add to history
        setGuesses(guesses => [...guesses, inputValue]);
        // clear it
        setInputValue("");
        if (randomWord.toLocaleLowerCase() === inputValue.toLocaleLowerCase()) {
          setWinState(true);
        }
      } else {
        window.alert("enter exactly 5 letters")
      }
    }
  };

  return (
    <>
      <div id="controls">
        <button onClick={handleGetRandomWord}>Get Random Word</button>
        {randomWord && <p>Random Word: <span className={`secretWord ${winState ? '' : "spoiler"}`} title={randomWord}>{randomWord.toLocaleUpperCase()}</span></p>}
      </div>
      <div>
        {randomWord && !winState && (
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={winState}
            pattern="[A-Za-z]{5}"
          />
        )}
      </div>
      <GuessHistory current={randomWord} thepast={guesses} />
    </>
  )
}

export default App

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
