const yesClass = 'correct_exact';
const maybeClass = 'correct_wrong';
const noClass = 'incorrect';

import "./GuessHistory.css";
type historyEntry = [number, string, number[]]

export type GuessType = {
  guess: string,
  who: string,
}

export function GuessHistory({ current, thepast }: { current: string, thepast: GuessType[] }) {
  const rows: historyEntry[] = [];

  const currentLow = current.toLocaleLowerCase();
  const currentLetters = current.split("");
  // console.log("current stuff>", current, currentLetters);

  thepast.forEach((entry, guessId) => {
    const { guess } = entry;
    const guessLow = guess.toLocaleLowerCase();
    const isMatch = guessLow === currentLow;

    const guessLetters = guess.split("");
    // console.log(guess, guessLetters);

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

    rows.unshift([guessId + 1, guess, matchMap]);
  })

  return <>
    <div id="history">
      <div id="historyRows">
        {rows.map((hEnt, ri) => {
          const [guessId, guessWord, guessMap] = hEnt;
          // console.debug(hEnt);

          return (
            <div key={`guess-${ri}`} className='guessRow' data-guess={guessId}>
              <div className="guessNumber">{guessId}</div>
              <div className="guessLetters">
                <LetterBoxes guessId={guessId} guessWord={guessWord} matchMap={guessMap} />
              </div>
              <div className="guessName"></div>
            </div>
          )
        })}
      </div>
    </div>
  </>
}

const LetterBoxes = ({ guessId, guessWord, matchMap }: { guessId: number, guessWord: string, matchMap: number[] }) => {
  const guessLetters = guessWord.split("");

  return (<table className="guessLettersTable">
    <tbody><tr>
      {matchMap.map((mm, index) => {
        const matchClass = mm == 2 ? yesClass : (mm == 1 ? maybeClass : noClass);
        // console.log({ mm, index, gl: guessLetters?.[index] })
        return (
          <td key={`guess-${guessId}-letter-${index}`} className={`letterBox ${matchClass}`}>
            {guessLetters[index].toLocaleUpperCase()}
          </td>
        )
      })}
    </tr></tbody>
  </table>)

}