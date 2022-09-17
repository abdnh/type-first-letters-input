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

    const SKIPPED_CHARS_RE = /\p{Symbol}|\p{Punctuation}/gu;


    function firstLettersInputHandler(i) {
        return (e) => {
            const text = e.target.textContent;
            let inputWords = text.split(/\s+/)
                .filter(w => w)
                .map(w => w.split("-"))
                .flat()
                .map(w => w.replace(SKIPPED_CHARS_RE, ""))
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

            for (const [j, inputWord] of Object.entries(inputWords)) {

                const userWord = context.userInput[j];
                let classes = '';
                if (!correctWords[j]) {
                    // More input words than there are answer words
                    classes = 'wrong-section';
                }
                else if (!correctWords[j].wordToType) {
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
                        // For numbers, we don't display stripped letters like punctuation for simplicity
                        span.innerHTML = correctWords[j].wordToType[k];
                        e.target.appendChild(span);
                    }
                    if (userWord.length === correctWords[j].wordToType.length && correctWords[j].inputType === 'number') {
                        // If user typed all required digits, append the delimiting string
                        e.target.children[e.target.children.length - 1].innerHTML += correctWords[j].appendStr;
                    }
                    continue;
                }
                const span = document.createElement("span");
                span.classList.add(classes);
                // In the case of excess input words, display the input word, otherwise display the correct word
                span.innerHTML = correctWords[j] ? correctWords[j].displayWord : inputWord;
                span.innerHTML += correctWords[j] ? correctWords[j].appendStr : '&nbsp;';
                e.target.appendChild(span);
            }

            clearOldUserInput(context, inputWords.length);
            setEndOfContenteditable(e.target);
        };
    }

    function onKeyDown(event) {
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
    }

    class InputContext {
        constructor(correctAnswer) {
            this._parseCorrectAnswer(correctAnswer);
            this.userInput = [];
        }

        _parseCorrectAnswer(correctAnswer) {
            this.correctWords = [];
            const splitWords = correctAnswer.split(/\s+/).map(w => {
                const subWords = w.split("-");
                if (w.includes('-')) {
                    // Append hyphen to first part so that it gets displayed
                    subWords[0] += '-';
                };
                return subWords;
            }).flat();
            for (let word of splitWords) {
                let displayWord = word.trim();
                let appendStr = '&nbsp;';
                if (displayWord.endsWith("-")) {
                    appendStr = '-';
                    displayWord = displayWord.slice(0, -1);
                }
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
        input.addEventListener("keydown", onKeyDown);
        clearButton.addEventListener("click", (() => {
            return (e) => {
                e.target.previousElementSibling.textContent = '';
            }
        })(i));
    }
})();