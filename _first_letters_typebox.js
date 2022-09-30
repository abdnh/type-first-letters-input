(() => {
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

    function clearOldUserInput(context, offset) {
        context.userInput = context.userInput.slice(0, offset);
    }

    const SKIPPED_CHARS_RE = /\p{Symbol}|\p{Punctuation}+/gu;
    const SKIPPED_CHARS_GROUPED_RE = /(\p{Symbol}|\p{Punctuation})+/gu;

    function firstLettersInputHandler(i) {
        return (e) => {
            const text = e.target.textContent;
            let inputWords = text.split(/\s+/)
                .map(w => w.split(SKIPPED_CHARS_RE)).flat()
                .filter(w => w);

            e.target.innerHTML = '';
            const context = inputContexts[i];
            const correctWords = context.correctWords;

            if (context.userInput.length !== inputWords.length) {
                context.userInput.push(inputWords[inputWords.length - 1]);
            } else {
                const lastInputWord = inputWords[inputWords.length - 1];
                context.userInput[context.userInput.length - 1] += lastInputWord[lastInputWord.length - 1];
            }

            for (let j = 0; j < inputWords.length; j++) {
                const userWord = context.userInput[j];
                let classes = '';
                if (!correctWords[j].wordToType) {
                    // Word consisting entirely of stripped letters (e.g. punctuation)
                    classes = 'correct-section';
                }
                else if (userWord.toLowerCase() === correctWords[j].wordToType.toLowerCase()) {
                    classes = 'correct-section';
                } else if (userWord.length === correctWords[j].wordToType.length && correctWords[j].inputType !== 'number') {
                    classes = 'wrong-section';
                } else {
                    // Number
                    for (const [k, c] of Object.entries(userWord)) {
                        if (c === correctWords[j].wordToType[k]) {
                            classes = 'correct-section';
                        } else {
                            classes = 'wrong-section';
                        }
                        const span = document.createElement("span");
                        span.classList.add(classes);
                        span.innerHTML = correctWords[j].wordToType[k];
                        e.target.appendChild(span);
                    }
                    if (userWord.length === correctWords[j].wordToType.length && correctWords[j].inputType === 'number') {
                        // If user typed all required digits and this is not the last word to type, append the delimiting string
                        if (j < correctWords.length - 1) {
                            e.target.children[e.target.children.length - 1].innerHTML += correctWords[j].appendStr;
                        }
                    }
                    continue;
                }
                const span = document.createElement("span");
                span.classList.add(classes);
                span.innerHTML = correctWords[j].displayWord;
                // Do not add a space if this is the last word
                if (j < correctWords.length - 1) {
                    span.innerHTML += correctWords[j].appendStr;
                }
                e.target.appendChild(span);
            }

            clearOldUserInput(context, inputWords.length);
            setEndOfContenteditable(e.target);
        };
    }

    function onKeyDownHandler(i) {
        return (event) => {
            if (["Space", "Backspace"].includes(event.code)) {
                event.preventDefault();
            }
            if (["Enter", "NumpadEnter"].includes(event.code)) {
                // Show answer side
                if (window.bridgeCommand) {
                    bridgeCommand("ans");
                }
                event.preventDefault();
            }

            const context = inputContexts[i];
            const correctWords = context.correctWords;
            const userInput = context.userInput;
            // Prevent typing in more words than is correct
            if (userInput.length >= correctWords.length && correctWords[correctWords.length - 1].wordToType.length === userInput[userInput.length - 1].length) {
                event.preventDefault();
            }
        }
    }

    class InputContext {
        constructor(correctAnswer) {
            this._parseCorrectAnswer(correctAnswer);
            this.userInput = [];
        }

        _parseCorrectAnswer(correctAnswer) {
            this.correctWords = [];
            const splitTuples = correctAnswer.split(/\s+/).map(w => {
                const subWords = w.split(SKIPPED_CHARS_GROUPED_RE).filter(w => w);
                const subTuples = [];
                let i = 0;
                while (i < subWords.length) {
                    if (SKIPPED_CHARS_RE.test(subWords[i])) {
                        // Punctuation before an actual word; ignore
                        // TODO: maybe handle showing this too somehow
                        continue;
                    }
                    const tuple = [subWords[i].trim()];
                    if (SKIPPED_CHARS_RE.test(subWords[i + 1])) {
                        let punct = subWords[i + 1];
                        if (i + 1 == subWords.length - 1) {
                            punct += '&nbsp;';
                        }
                        tuple.push(punct);
                        i += 2;
                    } else {
                        tuple.push('&nbsp;');
                        i++;
                    }
                    subTuples.push(tuple);
                }

                return subTuples;
            }).flat();
            for (let [word, appendStr] of splitTuples) {
                let displayWord = word;
                let inputType = 'firstletter';
                let wordToType = displayWord.replace(SKIPPED_CHARS_RE, "");
                if (!/^\p{Number}+$/u.test(wordToType)) {
                    wordToType = wordToType[0];
                } else {
                    inputType = 'number';
                }
                if (!wordToType && this.correctWords.length) {
                    // if word is empty after stripping, display it in its pre-stripping state as soon as the previous word is revealed
                    this.correctWords[this.correctWords.length - 1].displayWord += ` ${displayWord}`;
                }
                else {
                    this.correctWords.push({
                        displayWord, wordToType, appendStr, inputType,
                    });
                }
            }
        }
    }

    const elements = Array.from(document.querySelectorAll(".typebox"));
    const inputContexts = [];
    for (const [i, element] of Object.entries(elements)) {
        const input = document.createElement("div");
        input.contentEditable = 'true';
        // https://forums.ankiweb.net/t/keyboard-not-always-shown-when-focusing-html-input-contenteditable-elements-on-ankimobile/22711
        input.classList.add("tappable");
        const clearButton = document.createElement("button");
        clearButton.textContent = "Clear";
        element.append(input, clearButton);
        // Focus first input
        if (i == 0) {
            input.focus();
        }
        inputContexts[i] = new InputContext(element.dataset.answer);
        input.addEventListener("input", firstLettersInputHandler(i));
        input.addEventListener("keydown", onKeyDownHandler(i));
        clearButton.addEventListener("click", (() => {
            return (e) => {
                e.target.previousElementSibling.textContent = '';
                clearOldUserInput(inputContexts[i], 0);
            }
        })(i));
    }
})();
