/*
Notes:
Things to figure out:
- Fit all the necessary info into 9 characters
  - Putting all the info in as plain text results in 14-character long strings at most (200 10000 31 12 99)
  - The simplest way to fit greater numbers into fewer characters is to use higher number systems
  - Hexadecimals are promising (C8 2710 1F C 63), but it's still 11 characters long at most.
  - I could optimise a little and only track days in the year, but that would only save characters in base 10
  - Dates are the issue. I don't think there's a great way to compress dates without losing any info, so including a full date in the code is not too feasible.
  - Knowing time since a start date would be ideal. I believe the 1st January 1970 default date should work for this.

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

// Number systems used for the different values
const shopBase = 16;
const transactionBase = 22;
const dateBase = characterLookupTable.length;
const seedBase = characterLookupTable.length;

// TODO: Modify this function
function generateShortCode(storeId, transactionId) {
    const today = new Date();
    const todayInDays = Math.ceil(today / (1000 * 60 * 60 * 24));

    const seedValue = Math.round(Math.random() * (63 - 1) + 1);
    
    const randomisedArray = arrayRandomisation(characterLookupTable, seedValue);

    const base64StoreID = convertToAnyBase(shopBase, storeId, randomisedArray, 2);
    const base64TransactionID = convertToAnyBase(transactionBase, transactionId, randomisedArray, 3);
    const base64Date = convertToAnyBase(dateBase, todayInDays, randomisedArray, 3);
    const base64Seed = convertToAnyBase(seedBase, seedValue, characterLookupTable, 1);

    // Shortcode is shuffled. This helps to avoid predictable repeat characters.
    const unshuffledShortCodeAsArray = `${base64StoreID}${base64TransactionID}${base64Date}`.split('');
    const shuffledShortCodeAsArray = arrayRandomisation(unshuffledShortCodeAsArray, seedValue);

    const shortCode = shuffledShortCodeAsArray.join('') + base64Seed;
    
    return shortCode;
}

// TODO: Modify this function
function decodeShortCode(shortCode) {
    // Logic goes here
    const seedValue = convertAnyToBase10(seedBase, shortCode.charAt(shortCode.length - 1), characterLookupTable);

    const randomisedArray = arrayRandomisation(characterLookupTable, seedValue);

    const shortCodeWithoutSeed = shortCode.substring(0,8).split('');
    const unshuffledShortCode = arrayReverseRandomisation(shortCodeWithoutSeed, seedValue).join('');

    let storeID = convertAnyToBase10(shopBase, unshuffledShortCode.substring(0,2), randomisedArray);
    let transactionID = convertAnyToBase10(transactionBase, unshuffledShortCode.substring(2,5), randomisedArray);
    let dateOfTransaction = convertAnyToBase10(dateBase, unshuffledShortCode.substring(5,8), randomisedArray);

    // Date rounding seems to cause mismatches in dates, so 1 day needs to be subtracted
    dateOfTransaction = (dateOfTransaction - 1) * 24 * 60 * 60 * 1000;

    return {
        storeId: storeID,
        shopDate: new Date(dateOfTransaction),
        transactionId: transactionID,
    };
}

// Not crypographically secure at all, but random enough to be usable.
function deterministicReversibleRandom(seed, numDigits, maxValue) {
    let valueInBinaryAsArray = seed.toString(2).split('').reverse();
    if(valueInBinaryAsArray.length > numDigits) {
        console.error("Seed value is larger than maximum number of binary digits");
        return 0;
    }

    while(valueInBinaryAsArray.length < numDigits) {
        valueInBinaryAsArray.push('0');
    }

    let percentage = (parseInt(valueInBinaryAsArray.join(''), 2))/(Math.pow(2, numDigits) - 1);
    return Math.round(percentage * maxValue);
}

// Fisher–Yates shuffle
function arrayRandomisation(array, seed) {
    const arrayCopy = JSON.parse(JSON.stringify(array)); // without a deep copy, it modifies the original array repeatedly

    // let currentIndex = array.length;
    let randomIndex = 0;

    for(let i = array.length-1;i>=0;i--) {
        randomIndex = deterministicReversibleRandom(seed++, 16, array.length-1);

        value1 = arrayCopy[i];
        value2 = arrayCopy[randomIndex];
        arrayCopy[i] = value2;
        arrayCopy[randomIndex] = value1;
    }

    return arrayCopy;
}

// Fisher-Yates shuffle can be reversed by performing its steps in reverse.
// Essentially just reverse the seed, since it generates sequentially.
function arrayReverseRandomisation(shuffledArray, seed) {
    const arrayCopy = JSON.parse(JSON.stringify(shuffledArray)); // without a deep copy, it modifies the original array repeatedly
    endSeed = seed + shuffledArray.length-1;

    // let currentIndex = array.length;
    let randomIndex = 0;

    for(let i = 0; i < shuffledArray.length; i++) {
        randomIndex = deterministicReversibleRandom(endSeed--, 16, shuffledArray.length-1);

        value1 = arrayCopy[i];
        value2 = arrayCopy[randomIndex];
        arrayCopy[i] = value2;
        arrayCopy[randomIndex] = value1;
    }

    return arrayCopy;
}

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