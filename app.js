const axios = require("axios");
const TinyQueue = require("tinyqueue");

async function fetchDocument() {
    const docUrl = "http://norvig.com/big.txt";
    let result = await axios.get(docUrl, { headers: { Accept: "text/plain" } });
    return result.data;
}

function findTopN(map, n) {
    const queue = new TinyQueue([], (a, b) => a.numOccurs - b.numOccurs);
    for (let key of map.keys()) {
        if (queue.length < n) {
            queue.push({word: key, numOccurs: map.get(key)});
        } else {
            if (queue.peek() < map.get(key)) {
                queue.pop();
                queue.push({word: key, numOccurs: map.get(key)});
            }
        }
    }

    var array = [];
    while (queue.length) array.push(queue.pop());
    return array;
}

async function callYandex(word) { 
    const apiUrl = "https://dictionary.yandex.net/api/v1/dicservice.json/lookup"
    const response = await axios.get(apiUrl, { headers: { Accept: "application/json"}, params: { key: "dict.1.1.20170610T055246Z.0f11bdc42e7b693a.eefbde961e10106a4efa7d852287caa49ecc68cf", lang: "en-en", text: word} });
    const result = await response.data;
    return result;
}

async function getInfo(topItems){
    let result = [];
    for (let item of topItems) {
        const apiResult = await callYandex(item.word);
        result.push({word: item.word, ocurrs: item.numOccurs, syn: apiResult["def"].length ? apiResult["def"][0]["syn"]: [], pos: apiResult["def"].length ? apiResult["def"][0]["pos"]: []})
    }
    return result;
}

function findOccurences(text, n) {
    const words = text.match(/\b(\w+)\b/g);
    const map = new Map();
    for(let word of words) {
        if (!map.has(word)) {
            map.set(word, 1);
        } else {
            map.set(word, map.get(word) + 1);
        }
    }
    return map;
}

fetchDocument()
.then(text => {
    //console.log(bigText);
    const wordMap = findOccurences(text);
    
    const topTen = findTopN(wordMap, 10);
    
    // for (let elem of topTen) {
    //     console.log(elem.word + ": " + elem.numOccurs);
    // }

    return getInfo(topTen);
})
.then(result => {
    console.log(result);
})
.catch(e => {
    console.log(e);
})
