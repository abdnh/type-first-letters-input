function cleanSavedLetters(words, offset, i) {
    for (let j = offset; j < inputFirstLetters[i].length; j++) {
        inputFirstLetters[i][j] = null;
    }
}

function keydownHandler(i) {
    return (e) => {
        if (e.key.length > 1) return;
        e.preventDefault();
        e.stopPropagation();
        const text = e.target.textContent + ` ${e.key}`;
        const words = text.split(/\s+/).filter(w => w);
        if (!words[words.length - 1]) {
            cleanSavedLetters(words, 0, i);
            return;
        }
        e.target.innerHTML = '';
        const answerWords = e.target.parentElement.dataset.answer.split(" ");
        for (const [j, word] of Object.entries(words)) {
            let color;
            let firstLetter = inputFirstLetters[i][j];
            if (!firstLetter) {
                firstLetter = word[0];
                inputFirstLetters[i][j] = firstLetter;
            }
            if (answerWords[j] && answerWords[j][0].toLowerCase().startsWith(firstLetter.toLowerCase())) {
                color = 'green';
            } else {
                color = 'red';
            }
            const span = document.createElement("span");
            span.style.backgroundColor = color;
            span.innerHTML = `${answerWords[j] ? answerWords[j] : firstLetter}&nbsp;`;
            e.target.appendChild(span);
        }
        cleanSavedLetters(words, words.length, i);
    };
}


const elements = Array.from(document.querySelectorAll(".type-first-letters"));
const inputFirstLetters = [];
for (const [i, element] of Object.entries(elements)) {
    const input = document.createElement("div");
    input.tabIndex = '0';
    const clearButton = document.createElement("button");
    clearButton.textContent = "Clear";
    element.append(input, clearButton);
    inputFirstLetters[i] = [];
    input.addEventListener("keydown", keydownHandler(i));
    clearButton.addEventListener("click", ((i) => {
        return (e) => {
            e.target.previousElementSibling.textContent = '';
            inputFirstLetters[i] = [];
        }
    })(i));
}
