const yesClass = 'correct_exact';
const maybeClass = 'correct_wrong';
const noClass = 'incorrect';

import "./GuessHistory.css";

export function GuessHistory({ current, thepast }: { current: string, thepast: string[] }) {
  const rows: [number, JSX.Element[]][] = [];

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

      // loop over letters, mark the ones we have exactly right
      guessLetters.forEach((gl, index) => {
        if (gl.localeCompare(currentLetters[index], undefined, { sensitivity: "base" }) === 0) {
          // letter is right in right place, mark it as good
          // console.log(`on index[${index}], locale said yes`, { gl }, currentLetters[index])
          matchMap[index] = 2;
        }
      });

      const incorrectLetters = currentLetters.filter((_cl, ci) => {
        return matchMap[ci] != 2;
      }
      ).join("");

      // was not right place, see if the guess letter exists at all
      guessLetters.forEach((gl, index) => {
        if (matchMap[index] != 2 && incorrectLetters.includes(gl)) {
          // exists in pool, mark as correct-but-not-here
          matchMap[index] = 1;
        }
      });
    }

    const letterBoxes: JSX.Element[] = matchMap.map((mm, index) => {
      const matchClass = mm == 2 ? yesClass : (mm == 1 ? maybeClass : noClass);
      return (<>
        <span key={`guess-${guessId}-letter-${index}`} className={`letterBox ${matchClass}`}>{guessLetters[index].toLocaleUpperCase()}</span>
      </>)
    })

    rows.unshift([guessId + 1, letterBoxes]);
  })

  return <>
    <div id="history">
      <div id="historyRows">
        {rows.map((r, ri) => {
          const [guessId, letterBoxes] = r;

          return (<>
            <div key={`guess-${ri}`} className='guessRow' data-guess={guessId}>
              <span className="guessNumber">{guessId}</span>
              <span className="guessLetters">{letterBoxes}</span>
              <span className="guessNumber"></span>
            </div>
          </>
          )
        })}
      </div>
    </div >
  </>
}