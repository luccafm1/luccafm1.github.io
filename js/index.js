function isDigit(c) {
    return (c >= '0' && c <= '9');
}

function cleanWord(word) {
    let result = '';
    for (let i = 0; i < word.length; i++) {
        if (/[a-zA-Z]/.test(word[i])) {
            result += word[i].toLowerCase();
        }
    }
    return result;
}

function hashFunction(word, hashTableSize) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
        hash = (hash * 31) + word.charCodeAt(i);
    }
    return hash % hashTableSize;
}

function bubbleSort(arr, freq) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (freq[j] < freq[j + 1]) {
                [freq[j], freq[j + 1]] = [freq[j + 1], freq[j]];
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }
}

async function processFile(input) {
    if (input == 1)
    {
        fileInput = document.getElementById('input_file');
        file = fileInput.files[0];
    }
    else if (input == 0)
    {
        fileInput = document.getElementById('input_text');
        const fileContent = fileInput.value;
        const blob = new Blob([fileContent], { type: 'text/plain' });
        file = new File([blob], 'textFile.txt');    
    }
    const outputDiv = document.getElementById('output');

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const content = e.target.result;
            const lines = content.split(/\s+/);

            const hashTableSize = 10000;
            const hashTable = new Array(hashTableSize).fill('');
            const wordFreq = new Array(hashTableSize).fill(0);

            let totalWord = 0;
            let totalDistinct = 0;

            for (const word of lines) {
                const cleanedWord = cleanWord(word);
                if (cleanedWord.length > 0) {
                    const hash = hashFunction(cleanedWord, hashTableSize);
                    hashTable[hash] = cleanedWord;
                    wordFreq[hash]++;
                    totalWord++;
                }
            }

            bubbleSort(hashTable, wordFreq);

            // OUTPUT

            let outputHTML = '';
            outputHTML += '<ul>';
            for (let i = 0; i < hashTableSize; i++) {
                if (wordFreq[i] > 0) {
                    outputHTML += `<li><b>${hashTable[i]}</b>: ${wordFreq[i]}</li>`;
                    totalDistinct++;
                }
            }
            outputHTML += '</ul>';

            outputHTML += `<div id="totalpalavras">Total de palavras: <h3>${totalWord}</h3></div>`;
            outputHTML += `<div id="totaldistintas">Total de palavras distintas: <h3>${totalDistinct}</h3></div>`;

            outputDiv.innerHTML = outputHTML;
        };

        reader.readAsText(file);
    } else {
        outputDiv.innerHTML = '<p>Nenhum arquivo selecionado...</p>';
        alert("Selecione um arquivo!");
    }
}
