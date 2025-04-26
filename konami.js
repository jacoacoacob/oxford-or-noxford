// Example of a solution to a related problem...

// Up, Up, Down, Down, Left, Right, Left, Right, B, A.
const SEQUENCE = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "KeyB",
    "KeyA"
];

function useKonamiCode() {
    const didKonami = ref(false);

    const _keyCodeQueue = ref<string[]>([]);

    function _checkDidKonami() {
        let nValidChars = 0;

        for (let i = 0; i < _keyCodeQueue.value.length; i++) {
            const current = _keyCodeQueue.value[i];

            if (current === SEQUENCE[nValidChars]) {
                nValidChars += 1;
            } else {
                nValidChars = 0;
            }
            
            if (nValidChars === SEQUENCE.length) {
                return true;
            }
        }

        return false;
    }

    function recordKeyPress(ev: KeyboardEvent) {
        _keyCodeQueue.value.push(ev.code);
    }

    function reset() {
        didKonami.value = false;
    }

    let _timeoutHandle: NodeJS.Timeout;

    watchEffect(() => {
        if (_checkDidKonami() && didKonami.value === false) {
            didKonami.value = true;
        }
        clearTimeout(_timeoutHandle);
        _timeoutHandle = setTimeout(() => {
            if (_keyCodeQueue.value.length > 0) {
                _keyCodeQueue.value = [];
            }
        }, 1000)
    });

    return reactive({ didKonami, reset, recordKeyPress });
}

export { useKonamiCode };


/*
************************
**** TEST DOCUMENTS ****
************************

---

I went to the store, the coffee shop and the 
bar.

I went to the store, the coffee shop, and the bar.

---

*/