/*
Notes:
There are two parts to this problem:
    1. Fitting all of the information into 9 characters
    2. Obfuscating the encoding method from potential cheaters

Thought process:
- Fitting all the necessary info into 9 characters
  - Putting all the info in as plain text results in 14-character long strings at most (200 10000 31 12 99).
  - The simplest way to fit greater numbers into fewer characters is to use higher number systems.
  - Hexadecimals are promising (200 10000 31 12 99) -> (C8 2710 1F C 63), but it's still 11 characters long at most.
  - Space could be saved with dates by only tracking days instead of days/months, but it only saves space in base 10 (365 takes up less space than 31 and 12, but 365 base 10 = 16D base 16)
  - Tracking full dates probably isn't the way to go. Too much information.
  - Knowing time since a start date would be ideal. I believe the 1st January 1970 default date should work for this.

- Base 64 (200 10000 36500 64) -> (DI CcQ I6U +)
  - Convert all values to base 64
  - Include a randomisation seed at the end
  - The problem with only using base 64 is that the specified values are significantly smaller than base 64 allows, generally causing a large number of leading zeroes.
  - Choosing more appropriate number systems would more evenly distribute the values. It might also make it harder to crack.
  - You cannot feasibly go very far over base ~70 because you'd run out of common standard characters on an english keyboard.

- Characters/number systems for each part of the shortcode
  - 2 characters for store number
    - Hexadecimal is almost perfect for representing store number. (255 possible numbers in 2 digits).

  - 3 characters for transaction number
    - Base 22 reaches around 10,000 within three characters. (10,647 possible characters in 3 digits).
    - Higher number systems are definitely possible if more customers are expected.

  - 3 characters for date
    - Our smallest unit of measurement for dates is by day (not millseconds or hours, for example), so tracking the date as days is likely the way to go.
    - There isn't too much information on how long promotions are intended to go on for, so I will use the highest possible base I can fit. Base 64 allows for up to 262,143 possible days, which is around 718 years. Probably enough.

  - 1 character for randomisation seed
    - I want to fit as much information in there as possible, so using the highest possible base is ideal.
    - The higher the number, the more randomisation is possible.

- Dealing with cheaters
  - Codes cannot be in plaintext and must be encrypted in some way in a way that's reversible.
  - Obviously, the best way to do this is to store them on a database after creation and remove them upon use, but that's not the point of this task.
  - Ideas
    - SHA-3 looked promising and simple, but it's a hash function, so not reversible.
    - Symmetrical encryption sounds like the way to go, but character length is an issue. Most encryption algorithms add far too many characters.
    - Avoiding collisions is a serious consideration with small codes like these ones.
    - A replacement cipher is simple, but easy to crack.
    - Multiple layers of randomisation?
    - I've worked with password salting before, so maybe a similar thing could be used with deterministic randomisation.
    - Attempted to use a linear congruential generator, which gives high-quality random values, but I need to do more research on the math in order to understand it better.
*/

// All of these global variables might be saved as environment variables or as an object per promotion, depending on the use case.

// You could add greater or fewer characters, like '[' or '.'. These ones are mostly chosen for ease of demonstration.
const characterLookupTable = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
    'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
    'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 
    'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
    'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 
    'Y', 'Z', '!', '@', '#', '$', '%', '^', '&', '*', 
    '?'
];

// Number systems used for the different values.
const storeBase = 16;
const transactionBase = 22;
const dateBase = characterLookupTable.length;
const seedBase = characterLookupTable.length;

// Number of digits for each value. Codes can be of any length and they are controlled by these values. Please try changing them and taking a look.
const storeDigits = 2;
const transactionDigits = 3;
const dateDigits = 3;
const seedDigits = 1;

/*
Params:
    - storeId: number between 0 and shopBase ^ storeDigits
    - transactionId: number between 0 and transactionBase ^ transactionDigits

Output:
    - shortCode: string
*/
function generateShortCode(storeId, transactionId) {
    if(storeId >= Math.pow(storeBase, storeDigits)) {
        console.error(`Specified storeId ${storeId} is too large to fit into ${storeDigits} base ${storeBase} digits`);
        return "";
    }

    if(transactionId >= Math.pow(transactionBase, transactionDigits)) {
        console.error(`Specified transactionId ${transactionId} is too large to fit into ${transactionDigits} base ${transactionBase} digits`);
        return "";
    }

    const today = new Date();
    // Date rounding seems to cause mismatches with the current date, so 1 is subtracted.
    const todayInDays = Math.ceil(today / (1000 * 60 * 60 * 24) - 1); // Days since 1st January 1970

    // Randomisation here should be from a true random or unpredictable source. Math.random is used as a substitute.
    const seedValue = Math.round(Math.random() * ((seedBase - 1) - 1) + 1);
    
    const randomisedArray = arrayRandomisation(characterLookupTable, seedValue);

    const convertedStoreID = convertToAnyBase(storeBase, storeId, randomisedArray, storeDigits);
    const convertedTransactionID = convertToAnyBase(transactionBase, transactionId, randomisedArray, transactionDigits);
    const convertedDate = convertToAnyBase(dateBase, todayInDays, randomisedArray, dateDigits);
    const convertedSeed = convertToAnyBase(seedBase, seedValue, characterLookupTable, seedDigits);

    const unshuffledShortCodeAsArray = `${convertedStoreID}${convertedTransactionID}${convertedDate}`.split('');
    const shuffledShortCodeAsArray = arrayRandomisation(unshuffledShortCodeAsArray, seedValue);

    const shortCode = shuffledShortCodeAsArray.join('') + convertedSeed;
    
    return shortCode;
}

/*
Params:
    - shortCode: string

Output:
    - Object containing storeId, shopDate, transactionId
*/
function decodeShortCode(shortCode) {
    const originalSeedValue = convertAnyToBase10(seedBase, shortCode.charAt(shortCode.length - 1), characterLookupTable);

    // Lookup table is re-randomised using the same seed so that values can be converted back.
    const randomisedArray = arrayRandomisation(characterLookupTable, originalSeedValue);

    const shortCodeWithoutSeed = shortCode.substring(0,storeDigits+transactionDigits+dateDigits).split('');
    const unshuffledShortCode = arrayReverseRandomisation(shortCodeWithoutSeed, originalSeedValue).join('');

    const storeID = convertAnyToBase10(storeBase, unshuffledShortCode.substring(0,storeDigits), randomisedArray);
    const transactionID = convertAnyToBase10(transactionBase, unshuffledShortCode.substring(storeDigits,storeDigits+transactionDigits), randomisedArray);
    const dateOfTransaction = convertAnyToBase10(dateBase, unshuffledShortCode.substring(storeDigits+transactionDigits,storeDigits+transactionDigits+dateDigits), randomisedArray);

    const dateOfTransactionInMilliseconds = dateOfTransaction * 24 * 60 * 60 * 1000;

    return {
        storeId: storeID,
        shopDate: new Date(dateOfTransactionInMilliseconds),
        transactionId: transactionID,
    };
}

/*
Params:
    - seed: number between 0 and 2 ^ numDigits
    - numDigits: maximum number of digits used for randomisation. Greater values allow for more granularity in randomisation.
    - maxValue: Final value will be mapped to a value between 0 and maxValue

Output:
    - Random number between 0 and maxValue
*/

// Distribution of values for this type of randomisation is not great, but it's random enough to be difficult to discern.
// A better method like a linear congruential generator might be better here if I had the time to research the math behind it.
function deterministicReversibleRandom(seed, numDigits, maxValue) {
    const valueInBinaryAsArray = seed.toString(2).split('').reverse();

    if(valueInBinaryAsArray.length > numDigits) {
        console.error("Seed value is larger than maximum number of binary digits");
        return 0;
    }

    // Add necessary leading zeroes so values can be converted backwards and forwards.
    while(valueInBinaryAsArray.length < numDigits) {
        valueInBinaryAsArray.push('0');
    }

    const percentage = (parseInt(valueInBinaryAsArray.join(''), 2))/(Math.pow(2, numDigits) - 1);
    return Math.round(percentage * maxValue);
}

/*
Params:
    - array: array to shuffle
    - seed: number used for randomisation

Output:
    - Shuffled copy of the input array
*/

// Fisher–Yates shuffle
function arrayRandomisation(array, seed) {
    const arrayCopy = JSON.parse(JSON.stringify(array));

    let randomIndex = 0;

    for(let i = array.length - 1; i >= 0; i--) {
        randomIndex = deterministicReversibleRandom(seed++, 16, array.length-1);

        let value1 = arrayCopy[i];
        let value2 = arrayCopy[randomIndex];
        arrayCopy[i] = value2;
        arrayCopy[randomIndex] = value1;
    }

    return arrayCopy;
}

/*
Params:
    - array: array to shuffle
    - seed: number used for initial randomisation

Output:
    - The original array before shuffling
*/

// Fisher-Yates shuffle can be reversed by performing its steps in reverse.
// If you can reverse the randomisation seed, you can reverse this shuffle.
function arrayReverseRandomisation(shuffledArray, seed) {
    const arrayCopy = JSON.parse(JSON.stringify(shuffledArray));

    let finalSeed = seed + shuffledArray.length-1;

    let randomIndex = 0;

    for(let i = 0; i < shuffledArray.length; i++) {
        randomIndex = deterministicReversibleRandom(finalSeed--, 16, shuffledArray.length-1);

        let value1 = arrayCopy[i];
        let value2 = arrayCopy[randomIndex];
        arrayCopy[i] = value2;
        arrayCopy[randomIndex] = value1;
    }

    return arrayCopy;
}

/*
Params:
    - base: number system to use
    - base10Value: number to convert
    - lookupTable: array of strings to reference
    - maxDigits: length of the output

Output:
    - A value in the specified base, with leading zeroes if it's shorter than maxDigits
*/
function convertToAnyBase(base, base10Value, lookupTable, maxDigits) {
    if(base10Value > Math.pow(base, maxDigits)) {
        console.error(`${base10Value} is too large to fit into ${maxDigits} base ${base} digits.`);
        return "";
    }

    if(lookupTable.length < base) {
        console.error("Too few characters in lookup table");
        return "";
    }

    let quotient = base10Value;
    
    let base64String = "";

    while(quotient >= base) {
        base64String = lookupTable[(quotient % base)] + base64String;
        quotient = Math.floor(quotient/base);
    }

    base64String = lookupTable[quotient] + base64String;

    // Adds leading zeroes if the string is too short. Ensures that string length is consistent.
    while(base64String.length < maxDigits) {
        base64String = lookupTable[0] + base64String;
    }

    return base64String;
}

/*
Params:
    - base: number system to convert from
    - value: value in the specified number system to convert
    - lookupTable: array of strings to reference

Output:
    - A value in base 10
*/
function convertAnyToBase10(base, value, lookupTable) {
    if(lookupTable.length < base) {
        console.error("Too few characters in lookup table");
        return "";
    }

    let total = 0;
    for(let i = 0; i < value.length; i++) {
        total += lookupTable.indexOf(value.charAt(i)) * Math.pow(base, value.length-1-i);
    }

    return total;
}

function encodeFormData (form) {
    let storeID = form.storeIdBox.value;
    let transactionID = form.transactionIdBox.value;

    const elem = document.getElementById("shortcode");
    
    elem.innerHTML = generateShortCode(storeID, transactionID);
}

function decodeFormData (form) {
    const shortcode = form.inputbox.value;

    const elem = document.getElementById("decoded");

    const decodedCode = decodeShortCode(shortcode)
    
    elem.innerHTML = `<div>Store ID: ${decodedCode.storeId}</div> <div>Transaction ID: ${decodedCode.transactionId}</div> <div>Date: ${decodedCode.shopDate}</div>`;
}

// Test buttons

function printArray() {
    console.log(arrayRandomisation(characterLookupTable, 235235));
}

function decodeTest(code) {
    console.log(decodeShortCode(code));
}

function testEncodeAndDecode(storeID, transactionID) {
    const sc = generateShortCode(storeID, transactionID);
    console.log(sc);
    console.log(decodeShortCode(sc));
}

function testEncodeAndDecode2(storeID, transactionID) {
    const sc = generateShortCode2(storeID, transactionID);
    console.log(sc);
    console.log(decodeShortCode2(sc));
}

function testEncode() {
    for(let i = 0; i < 200; i++) {
        const sc = generateShortCode(i, Math.floor(Math.random() * (10000 - 0 + 1) + 0));
        // const sc = generateShortCode(1, i);
        console.log(sc);
    }
}

function printDate(days) {
    dateInMilliseconds = days * 1000 * 60 * 60 * 24;
    date = new Date(dateInMilliseconds);
    console.log(date);
}

function testBaseConverstion(base, value) {
    converted = convertToAnyBase(base, value, characterLookupTable, 10);
    console.log(converted);
    console.log(convertAnyToBase10(base, converted, characterLookupTable));
}

function testlcg() {
    let seed = 2;
    for(let i = 0; i < 10; i++) {
        // console.log(lcg(seed));
        seed = lcg(seed);
    }

    console.log('split');

    for(let i = 0; i < 10; i++) {
        // console.log(reverselcg(seed));
        seed = reverselcg(seed);
    }
}

function testRev(value) {
    for(let i = 0;i < 200; i++) {
        console.log(rev(i));
    }
}

function testArrayRandom() {
    for(let i = 1;i<1000;i++) {
        console.log(arrayRandomisation(characterLookupTable, i));
    }
}

function testReversibleRandom() {
    let seed = 2141;

    for(let i = seed; i < seed + 10; i++) {
        console.log(deterministicReversibleRandom(i, 16, 64));
    }

    for(let i = seed + 10; i >= seed; i--) {
        console.log(deterministicReversibleRandom(i, 16, 64));
    }
    // console.log(deterministicReversibleRandom(Math.floor(Math.random() * (10000 - 0 + 1) + 0), 16, 64));
}

function testArrayUnrandomisation() {
    let shuffledArray = arrayRandomisation(characterLookupTable, 141);
    console.log(shuffledArray);
    console.log(arrayReverseRandomisation(shuffledArray, 141))
}

function massTestBoth() {
    for(let i = 0; i < 200; i++) {
        for(let j = 0; j < 10; j++) {
            const sc = generateShortCode(i, Math.floor(Math.random() * (10000 - 0 + 1) + 0));
            console.log(sc);
            console.log(decodeShortCode(sc));
        }
    }
}