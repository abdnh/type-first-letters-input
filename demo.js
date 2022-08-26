// https://stackoverflow.com/a/3866442/19396312
function setEndOfContenteditable(contentEditableElement) {
    var range, selection;
    range = document.createRange();
    range.selectNodeContents(contentEditableElement);
    range.collapse(false);
    selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

function clearUserInput(i, offset) {
    userInput[i] = userInput[i].slice(0, offset);
}

const SKIPPED_CHARS_RE = /\p{Symbol}|\p{Punctuation}/gu;


function firstLettersInputHandler(i) {
    return (e) => {
        const text = e.target.textContent;
        const words = text.split(/\s+/).filter(w => w);
        e.target.innerHTML = '';
        const answerWords = e.target.parentElement.dataset.answer.split(" ");
        for (const [j, word] of Object.entries(words)) {
            let firstLetter = userInput[i][j];
            if (!firstLetter) {
                firstLetter = word[0];
                userInput[i][j] = firstLetter;
            }
            let strippedAnswerWord = '';
            if (answerWords[j]) {
                strippedAnswerWord = answerWords[j].replace(SKIPPED_CHARS_RE, '');
            }
            let color;
            if (strippedAnswerWord && strippedAnswerWord[0].toLowerCase().startsWith(firstLetter.toLowerCase())) {
                color = 'green';
            } else {
                color = 'red';
            }
            const span = document.createElement("span");
            span.style.backgroundColor = color;
            span.innerHTML = `${answerWords[j] ? answerWords[j] : firstLetter}&nbsp;`;
            e.target.appendChild(span);
        }
        clearUserInput(i, words.length);
        setEndOfContenteditable(e.target);
    };
}

function verbatimInputHandler(i) {
    return (e) => {
        const answer = e.target.parentElement.dataset.answer;
        let text = e.target.textContent;
        text = text.replaceAll('\u00A0', ' ');
        e.target.innerHTML = '';
        for (const [j, c] of Object.entries(text)) {
            let color;
            let currentLetter = userInput[i][j];
            if (!currentLetter) {
                currentLetter = c;
                userInput[i][j] = currentLetter;
            }
            if (answer[j] && answer[j].toLowerCase() == currentLetter.toLowerCase()) {
                color = 'green';
            } else {
                color = 'red';
            }
            const span = document.createElement("span");
            span.style.backgroundColor = color;
            let d = answer[j] ? answer[j] : currentLetter;
            if (d === ' ') {
                d = '&nbsp;';
            }
            span.innerHTML = d;
            e.target.appendChild(span);
        }
        clearUserInput(i, text.length);
        setEndOfContenteditable(e.target);
    };
}

const elements = Array.from(document.querySelectorAll(".typebox"));
const userInput = [];
for (const [i, element] of Object.entries(elements)) {
    const input = document.createElement("div");
    input.contentEditable = 'true';
    const clearButton = document.createElement("button");
    clearButton.textContent = "Clear";
    element.append(input, clearButton);
    userInput[i] = [];
    if (element.dataset.type.toLowerCase() === "first-letters") {
        input.addEventListener("input", firstLettersInputHandler(i));
    } else {
        input.addEventListener("input", verbatimInputHandler(i));
    }
    clearButton.addEventListener("click", ((i) => {
        return (e) => {
            e.target.previousElementSibling.textContent = '';
            userInput[i] = [];
        }
    })(i));
}
