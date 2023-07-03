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
// This randomisation is mostly to obfuscate the codes in a way that can be replicated.
function deterministicRandom(seed, minValue, maxValue) {

    // 0 and all exact multiples of pi trend toward 0.
    if(seed === 0 || !Number.isInteger(seed)) {
        throw("Seed cannot be 0 or a non-integer");
    }

    const sinValue = Math.sin(seed) * 10000; // Multiplying here makes it drop more leading values, which helps with the pseudo-randomness
    const randomValue = sinValue - Math.floor(sinValue);
    return parseInt(Math.round((maxValue - minValue) * randomValue));
}

// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript

// Sine is not a great source of randomness, but it functions well enough for this purpose.
// This randomisation is mostly to obfuscate the codes in a way that can be replicated.
function deterministicRandom(seed, minValue, maxValue) {

    // 0 and all exact multiples of pi trend toward 0.
    if(seed === 0 || !Number.isInteger(seed)) {
        throw("Seed cannot be 0 or a non-integer");
    }

    const sinValue = Math.sin(seed) * 10000; // Multiplying here makes it drop more leading values, which helps with the pseudo-randomness
    const randomValue = sinValue - Math.floor(sinValue);
    return parseInt(Math.round((maxValue - minValue) * randomValue));
}