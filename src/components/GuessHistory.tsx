const yesClass = 'correct_exact';
const maybeClass = 'correct_wrong';
const noClass = 'incorrect';

import "./GuessHistory.css";

export function GuessHistory({ current, thepast }: { current: string, thepast: string[] }) {
  const rows: JSX.Element[] = [];

  thepast.forEach((guess, guessId) => {
    const isMatch = guess.toLocaleLowerCase() === current.toLocaleLowerCase();

    const currentLetters = current.split("");
    const guessLetters = guess.split("");

    // make some slots, default to all wrong
    const matchMap: number[] = new Array(current.length).fill(0);

    if (isMatch) {
      // is the same, just set all to match
      matchMap.fill(2);
    } else {
      // was not match, do some work

      guessLetters.forEach((gl, index) => {
        if (gl.localeCompare(currentLetters[index], undefined, { sensitivity: "base" }) === 0) {
          // letter is right in right place, mark it as good
          matchMap[index] = 2;
        } else {
          // was not right place, see if the guess letter exists at all
          if (currentLetters.includes(gl)) {
            // exists in pool, mark as correct-but-not-here
            matchMap[index] = 1;
          }
        }
      });
    }

    const letterBoxes: JSX.Element[] = matchMap.map((mm, index) => {
      const matchClass = mm == 2 ? yesClass : (mm == 1 ? maybeClass : noClass);
      return (<>
        <span className={`letterBox ${matchClass}`}>{guessLetters[index].toLocaleUpperCase()}</span>
      </>)
    })

    rows.unshift(
      <div className='guessRow' key={`${guessId}-${guess}`}>
        <span className="guessLetters">{letterBoxes.map((lb) => { return lb })}</span>
      </div>
    )
  })

  return <>
    <div id="history">
      {thepast.length > 0 && (<>{thepast.length} guesses<br /></>)}
      <div id="historyRows">
        {rows.map((r) => { return r })}
      </div>
    </div>
  </>
}