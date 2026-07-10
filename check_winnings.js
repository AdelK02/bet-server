const { calculateWinAmountFull, computeWinType } = require('./utils/winningUtils');

function testBoxFallbacks() {
  console.log("\n--- Testing BOX Double/Triple Fallbacks ---");

  // 1. Double Box permutation (e.g. entry 121, result 112)
  const doubleEntry = { number: "121", type: "BOX", count: 5 };
  const doubleResult = { "1": "112" };
  const doubleWins = calculateWinAmountFull(doubleEntry, doubleResult, null);
  console.log("Double Box permutation wins (expected prize: 1600*5=8000, super: 60*5=300):");
  console.log(JSON.stringify(doubleWins, null, 2));

  // 2. Triple Box perfect (e.g. entry 111, result 111)
  const tripleEntry = { number: "111", type: "BOX", count: 10 };
  const tripleResult = { "1": "111" };
  const tripleWins = calculateWinAmountFull(tripleEntry, tripleResult, null);
  console.log("Triple Box perfect wins (expected prize: 7000*10=70000, super: 450*10=4500):");
  console.log(JSON.stringify(tripleWins, null, 2));
}

testBoxFallbacks();
