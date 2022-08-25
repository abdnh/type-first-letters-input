// https://stackoverflow.com/a/3866442/19396312
function setEndOfContenteditable(contentEditableElement) {
    var range, selection;
    range = document.createRange();//Create a range (a range is a like the selection but invisible)
    range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
    range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
    selection = window.getSelection();//get the selection object (allows you to change selection)
    selection.removeAllRanges();//remove any selections already made
    selection.addRange(range);//make the range you have just created the visible selection
}

function cleanSavedLetters(offset, i) {
    for (let j = offset; j < inputFirstLetters[i].length; j++) {
        inputFirstLetters[i][j] = null;
    }
}

function firstLettersInputHandler(i) {
    return (e) => {
        const text = e.target.textContent;
        const words = text.split(/\s+/).filter(w => w);
        if (!words[words.length - 1]) {
            cleanSavedLetters(0, i);
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
        cleanSavedLetters(words.length, i);
        setEndOfContenteditable(e.target);
    };
}

function verbatimInputHandler() {
    return (e) => {
        const answer = e.target.parentElement.dataset.answer;
        let text = e.target.textContent;
        text = text.replaceAll('\u00A0', ' ');
        console.log('text', text);
        e.target.innerHTML = '';
        for (const [i, c] of Object.entries(text)) {
            let color;
            if (answer[i] && answer[i].toLowerCase() == c.toLowerCase()) {
                color = 'green';
            } else {
                color = 'red';
            }
            const span = document.createElement("span");
            span.style.backgroundColor = color;
            let d = answer[i] ? answer[i] : c;
            if (c === ' ') {
                d = '&nbsp;';
            }
            span.innerHTML = d;
            e.target.appendChild(span);
        }
        setEndOfContenteditable(e.target);
    };
}

const elements = Array.from(document.querySelectorAll(".typebox"));
const inputFirstLetters = [];
for (const [i, element] of Object.entries(elements)) {
    const input = document.createElement("div");
    input.contentEditable = 'true';
    const clearButton = document.createElement("button");
    clearButton.textContent = "Clear";
    element.append(input, clearButton);
    inputFirstLetters[i] = [];
    if (element.dataset.type.toLowerCase() === "first-letters") {
        input.addEventListener("input", firstLettersInputHandler(i));
    } else {
        input.addEventListener("input", verbatimInputHandler());
    }
    clearButton.addEventListener("click", ((i) => {
        return (e) => {
            e.target.previousElementSibling.textContent = '';
            inputFirstLetters[i] = [];
        }
    })(i));
}
