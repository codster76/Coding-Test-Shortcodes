/*
Notes:
Things to figure out:
- Fit all the necessary info into 9 characters
  - Putting all the info in as plain text results in 14-character long strings at most (200 10000 31 12 99)
  - The simplest way to fit greater numbers into fewer characters is to use higher number systems
  - Hexadecimals are promising (C8 2710 1F C 63), but it's still 11 characters long at most.
  - I could optimise a little and only track days in the year, but that would only save characters in base 10
  - Dates are the issue. I don't think there's a great way to compress dates without losing any info, so including a full date in the code is not too feasible.
  - I think it's very reasonable to assume that the start date of a promotion is known and can be stored on internal systems.
  - If we track days since the beginning of the promotion, we can fit up to 4095 days (>11 years) into 3 characters, which is likely enough.

  - Base 64 (200 10000 36500 64) -> (DI CcQ I6U +)
    - Convert all values to base64
    - Include a randomisation seed at the end
    - Keep a private key in the code
    - Problem with only using base64 is that our possible values are far smaller than the possible number sets, generally causing
    a large number of leading zeroes. Choosing smaller number systems would more evenly distribute our values across the number
    systems. It might also make it harder to crack.
    - I cannot feasibly go much over ~base 70 because you'd run out of common standard characters on an english keyboard

  - 2 characters for store number
    - Hexadecimal is almost perfect for representing store number. (255 possible numbers in 2 digits)

  - 3 characters for transaction number
    - Base 22 reaches around 10,000 within three characters.

  - 3 characters for date
    - Our smallest unit of measurement for dates is by day (not millseconds or hours, for example), so tracking the date in days is likely the way to go.
    - There isn't too much information on how long promotions are intended to go on for, so I will use the highest possible base
    I can fit. Base 64 allows for up to 262,143 possible days, which is around 718 years, which is probably enough.

  - 1 character for randomisation seed
    - I need to fit as much information in there as possible, so using the highest possible base is ideal.

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

// You could add more or less characters. These ones are mostly for demonstration purposes
const characterLookupTable = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
    'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
    'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 
    'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
    'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 
    'Y', 'Z', '!', '@', '#', '$', '%', '^', '&', "*", 
    '?'
];

// Number systems used for the different values
const shopBase = 16;
const transactionBase = 22;
const dateBase = characterLookupTable.length;
const seedBase = characterLookupTable.length;

// TODO: Modify this function
// function generateShortCode(storeId, transactionId) {
//     // Logic goes here

//     const today = new Date();
//     const date = Math.ceil(Math.abs(today - promotionStart) / (1000 * 60 * 60 * 24));

//     const seedValue = Math.round(Math.random() * (63 - 1) + 1);

//     // Possible values are a fairly small 
//     const twoDigitNumberToAddAround = (Math.pow(64, 2)) / 2;
//     const threeDigitNumberToAddAround = (Math.pow(64, 3)) / 2;
    
//     const randomisedArray = arrayRandomisation(characterLookupTable, seedValue);

//     let base64StoreID = convertToAnyBase(shopBase, twoDigitNumberToAddAround + storeId, randomisedArray, 2);
//     let base64TransactionID = convertToAnyBase(transactionBase, threeDigitNumberToAddAround + transactionId, randomisedArray, 3);
//     let base64Date = convertToAnyBase(dateBase, threeDigitNumberToAddAround + date, randomisedArray, 3);
//     let base64Seed = convertToAnyBase(seedBase, seedValue, characterLookupTable, 1);

//     shortCode = base64StoreID + base64TransactionID + base64Date + base64Seed;
    
//     return shortCode;
// }

function generateShortCode(storeId, transactionId) {
    // Logic goes here

    const today = new Date();
    const todayInDays = Math.ceil(today / (1000 * 60 * 60 * 24));

    const seedValue = Math.round(Math.random() * (63 - 1) + 1);
    
    const randomisedArray = arrayRandomisation(characterLookupTable, seedValue);

    let base64StoreID = convertToAnyBase(shopBase, storeId, randomisedArray, 2);
    let base64TransactionID = convertToAnyBase(transactionBase, transactionId, randomisedArray, 3);
    let base64Date = convertToAnyBase(dateBase, todayInDays, randomisedArray, 3);
    let base64Seed = convertToAnyBase(seedBase, seedValue, characterLookupTable, 1);

    shortCode = base64StoreID + base64TransactionID + base64Date + base64Seed;
    
    return shortCode;
}

// TODO: Modify this function
// function decodeShortCode(shortCode) {
//     // Logic goes here
//     const seedValue = convertAnyToBase10(seedBase, shortCode.charAt(shortCode.length - 1), characterLookupTable);

//     const randomisedArray = arrayRandomisation(characterLookupTable, seedValue);

//     const twoDigitNumberToAddAround = (Math.pow(64, 2)) / 2;
//     const threeDigitNumberToAddAround = (Math.pow(64, 3)) / 2;

//     let storeID = convertAnyToBase10(shopBase, shortCode.substring(0,2), randomisedArray) - twoDigitNumberToAddAround;
//     let transactionID = convertAnyToBase10(transactionBase, shortCode.substring(2,5), randomisedArray) - threeDigitNumberToAddAround;
//     let dateOfTransaction = convertAnyToBase10(dateBase, shortCode.substring(5,8), randomisedArray) - threeDigitNumberToAddAround;

//     dateOfTransaction = dateOfTransaction * 24 * 60 * 60 * 1000;
//     dateOfTransaction = +promotionStart + dateOfTransaction;

//     return {
//         storeId: storeID, // store id goes here,
//         shopDate: new Date(dateOfTransaction), // the date the customer shopped,
//         transactionId: transactionID, // transaction id goes here
//     };
// }

function decodeShortCode(shortCode) {
    // Logic goes here
    const seedValue = convertAnyToBase10(seedBase, shortCode.charAt(shortCode.length - 1), characterLookupTable);

    const randomisedArray = arrayRandomisation(characterLookupTable, seedValue);

    let storeID = convertAnyToBase10(shopBase, shortCode.substring(0,2), randomisedArray);
    let transactionID = convertAnyToBase10(transactionBase, shortCode.substring(2,5), randomisedArray);
    let dateOfTransaction = convertAnyToBase10(dateBase, shortCode.substring(5,8), randomisedArray);

    dateOfTransaction = dateOfTransaction * 24 * 60 * 60 * 1000;

    return {
        storeId: storeID, // store id goes here,
        shopDate: new Date(dateOfTransaction), // the date the customer shopped,
        transactionId: transactionID, // transaction id goes here
    };
}

// Values from: https://gist.github.com/Protonk/5389384
function lcg(seed) {
    const m = 25;
    const a = 11;
    const c = 17;
    // const m = Math.pow(2, 16) + 1;
    // const a = 75;
    // const c = 74;
    
    return (a * seed + c) % m;
}

function reverselcg(seed) {
    const m = 25;
    const a = 11;
    const c = 17;
    // const m = Math.pow(2, 16) + 1;
    // const a = 75;
    // const c = 74;

    // const ainverse = gcdExtended(a, m, 0, 0);
    const ainverse = egcd(a, m).y;

    console.log(ainverse * (seed - c));

    return ainverse * (seed - c) % m;
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

// From https://www.geeksforgeeks.org/euclidean-algorithms-basic-and-extended/
function gcdExtended(a, b, x, y) {
    // Base Case
    if (a == 0) {
        x = 0;
        y = 1;
        return b;
    }

    // To store results of recursive call
    let gcd = gcdExtended(b % a, a, x, y);

    // Update x and y using results of recursive call
    x = y - (b / a) * x;
    y = x;

    return {
        "gcd": b,
        "x": x,
        "y": y
    };
}

function egcd(a,b) {
    if (a < b) [a,b] = [b, a];
    let s = 0, old_s = 1;
    let t = 1, old_t = 0;
    let r = b, old_r = a;
    while (r != 0) {
        let q = Math.floor(old_r/r);
        [r, old_r] = [old_r - q*r, r];
        [s, old_s] = [old_s - q*s, s];
        [t, old_t] = [old_t - q*t, t];
    }
    return {
        "gcd": old_r,
        "x": old_s,
        "y": old_t
    }
}

function testegcd() {
    egcd(50, 35);
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

function convertToAnyBase(base, base10Value, lookupTable, finalLength) {
    let quotient = base10Value;
    
    let base64String = "";

    while(quotient >= base) {
        base64String = lookupTable[(quotient % base)] + base64String;
        quotient = Math.floor(quotient/base);
    }

    base64String = lookupTable[quotient] + base64String;

    // Adds leading zeroes if the string is too short
    while(base64String.length < finalLength) {
        base64String = lookupTable[0] + base64String;
    }

    return base64String;
}

function convertAnyToBase10(base, value, lookupTable) {
    if(lookupTable.length < base) {
        console.error("Too few characters in lookup table");
        return "";
    }

    let total = 0;
    for(let i = 0;i<value.length;i++) {
        total += lookupTable.indexOf(value.charAt(i)) * Math.pow(base, value.length-1-i);
    }

    return total;
}

function printRandom(seed, minValue, maxValue) {
    console.log(deterministicRandom(seed, minValue, maxValue));
}

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
        const sc = generateShortCode2(i, Math.floor(Math.random() * (10000 - 0 + 1) + 0));
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