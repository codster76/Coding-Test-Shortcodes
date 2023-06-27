/*
Notes:
Things to figure out:
- Fit all the necessary info into 9 characters
  - Putting all the info in as plain text results in 14-character long strings at most (200 10000 31 12 99)
  - The simplest way to fit greater numbers into fewer characters is to use higher number systems
  - Hexadecimals are promising (C8 2710 1F C 63), but it's still 11 characters long at most.
  - I could optimise a little and only track days in the year, but that would only save characters in base 10
  - Base64 url encoding could have an interesting application here, but it's not really made for this.
  - Dates are the issue. I don't think there's a great way to compress dates without losing any info, so that probably isn't the approach.
  - I think it's very reasonable to assume we'll know the start date for the promotion and will be able to use it in our own systems.
  - If we track days since the beginning of the promotion, we can fit up to 4095 days (>11 years) into 3 characters, which is likely enough.

  - Base 64 (200 10000 36500 64) -> (DI CcQ I6U +)
    - Convert all values to base64
    - Include a randomisation seed at the end
    - Keep a private key in the code

- Encryption for anti-cheating
  - SHA-3 looked promising and simple, but it's a hash function, so not reversible.
  - Symmetrical encryption sounds like the way to go, but character length is an issue.
  - Avoiding collisions is a serious consideration with small codes like these ones

  - Idea: Use base 64 for the codes to compress them as much as possible

- Advantages to my approach
    - Encoding is very hard to discern
    - Uses a good variety of characters
- Disadvantages of my approach
    - Multiple mapping collisions because of how the randomisation works.
    - Values are clustered together around the middle of the number set.

- There's only so much I can actually do with a single salt character.

*/

/*
There are two parts to this problem:
    1. Fitting all of the information into 9 characters
    2. Obfuscating the encoding method from potential cheaters

*/

// Figure out how to implement a linear congruential generator to map numbers
// https://stackoverflow.com/questions/44981398/how-to-map-number-in-a-range-to-another-in-the-same-range-with-no-collisions

const promotionStart = new Date("2000-01-01");

// TODO: Modify this function
function generateShortCode(storeId, transactionId) {
    // Logic goes here

    const today = new Date();
    const date = Math.ceil(Math.abs(today - promotionStart) / (1000 * 60 * 60 * 24));
    console.log(date);

    const seedValue = Math.round(Math.random() * (63 - 1) + 1);

    // Basically, adding or subtracting values around the middle of all possible numbers.
    // This makes leading zeroes a lot less common
    const twoDigitNumberToAddAround = (Math.pow(64, 2)) / 2;
    const threeDigitNumberToAddAround = (Math.pow(64, 3)) / 2;
    
    const randomisedArray = arrayRandomisation(base64Chars, seedValue);

    let base64StoreID = convertToBase64(twoDigitNumberToAddAround + storeId, randomisedArray, 2);
    let base64TransactionID = convertToBase64(threeDigitNumberToAddAround + transactionId, randomisedArray, 3);
    let base64Date = convertToBase64(threeDigitNumberToAddAround + date, randomisedArray, 3);
    let base64Seed = convertToBase64(seedValue, base64Chars, 1);

    shortCode = base64StoreID + base64TransactionID + base64Date + base64Seed;
    
    return shortCode;
}

// TODO: Modify this function
function decodeShortCode(shortCode) {
    // Logic goes here
    const seedValue = convertToBase10(shortCode.charAt(shortCode.length - 1), base64Chars);

    const randomisedArray = arrayRandomisation(base64Chars, seedValue);

    const twoDigitNumberToAddAround = (Math.pow(64, 2)) / 2;
    const threeDigitNumberToAddAround = (Math.pow(64, 3)) / 2;

    let storeID = convertToBase10(shortCode.substring(0,2), randomisedArray) - twoDigitNumberToAddAround;
    let transactionID = convertToBase10(shortCode.substring(2,5), randomisedArray) - threeDigitNumberToAddAround;
    let dateOfTransaction = convertToBase10(shortCode.substring(5,8), randomisedArray) - threeDigitNumberToAddAround;

    dateOfTransaction = dateOfTransaction * 24 * 60 * 60 * 1000;
    dateOfTransaction = +promotionStart + dateOfTransaction;

    return {
        storeId: storeID, // store id goes here,
        shopDate: new Date(dateOfTransaction), // the date the customer shopped,
        transactionId: transactionID, // transaction id goes here
    };
}

// https://gist.github.com/Protonk/5389384
function lcg(seed) {
    var m = 25;
    var a = 11;
    var c = 17;
  
    var z = seed || 3;

    z = (a * z + c) % m;
    
    return z;
}

function testlcg() {
    for(let i = 0; i < 1000; i++) {
        console.log(lcg(i));
    }
}

// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript

// Sine is not a great source of randomness, but it functions well enough for this purpose.
// This randomisation is mostly to obfuscate the codes in a way that can be reversed.
function deterministicRandom(seed, minValue, maxValue) {

    // 0 and all exact multiples of pi trend toward 0.
    if(seed === 0 || !Number.isInteger(seed)) {
        throw("Seed cannot be 0 or a non-integer");
    }

    const sinValue = Math.sin(seed) * 10000; // Multiplying here makes it drop more leading values, which helps with the pseudo-randomness
    const randomValue = sinValue - Math.floor(sinValue);
    return parseInt(Math.round((maxValue - minValue) * randomValue));
}

// Fisher–Yates shuffle
function arrayRandomisation(array, seed) {
    const arrayCopy = JSON.parse(JSON.stringify(array)); // without a deep copy, it modifies the original array repeatedly

    let currentIndex = array.length;
    let randomIndex = 0;

    while (currentIndex > 0) {
        randomIndex = deterministicRandom(seed++, 0, currentIndex);
        currentIndex--;

        value1 = arrayCopy[currentIndex];
        value2 = arrayCopy[randomIndex];
        arrayCopy[currentIndex] = value2;
        arrayCopy[randomIndex] = value1;
    }

    return arrayCopy;
}

function convertToBase64(base10Value, lookupTable, finalLength) {
    let quotient = base10Value;
    
    let base64String = "";

    while(quotient >= 64) {
        base64String = lookupTable[(quotient % 64)] + base64String;
        quotient = Math.floor(quotient/64);
    }

    base64String = lookupTable[quotient] + base64String;

    // Adds leading zeroes if the string is too short
    while(base64String.length < finalLength) {
        base64String = lookupTable[0] + base64String;
    }

    return base64String;
}

function convertToBase10(base64Value, lookupTable) {
    let total = 0;
    for(let i = 0;i<base64Value.length;i++) {
        total += lookupTable.indexOf(base64Value.charAt(i)) * Math.pow(64,base64Value.length-1-i);
    }
    return total;
}

function testBase64Convert() {
        console.log(convertToBase64(1111111111, base64Chars));
}

function testBase10Convert() {
    console.log(convertToBase10('12ezn7', base64Chars));
}

function printRandom(seed, minValue, maxValue) {
    console.log(deterministicRandom(seed, minValue, maxValue));
}

function printArray() {
    console.log(arrayRandomisation(base64Chars, 235235));
}

function decodeTest(code) {
    console.log(decodeShortCode(code));
}

function testEncodeAndDecode(storeID, transactionID) {
    const sc = generateShortCode(storeID, transactionID);
    console.log(sc);
    console.log(decodeShortCode(sc));
}

const base64Chars = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
    'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
    'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 
    'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
    'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 
    'Y', 'Z', '-', '+'
]