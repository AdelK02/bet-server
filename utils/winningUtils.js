/**
 * Shared logic for calculating winning types and amounts.
 */

const extractBaseType = (type) => {
    if (!type) return "SUPER";
    const upper = type.toString().toUpperCase();
    if (upper.includes("SUPER")) return "SUPER";
    if (upper.includes("BOX")) return "BOX";
    if (upper.includes("AB")) return "AB";
    if (upper.includes("BC")) return "BC";
    if (upper.includes("AC")) return "AC";
    if (upper.endsWith("A") || upper.includes("-A")) return "A";
    if (upper.endsWith("B") || upper.includes("-B")) return "B";
    if (upper.endsWith("C") || upper.includes("-C")) return "C";
    const parts = type.toString().split("-");
    return parts[parts.length - 1] || "SUPER";
};

const computeWinType = (entry, results) => {
    if (!results) return [];
    const baseType = extractBaseType(entry.type);
    const num = entry.number;
    const first = results["1"];
    const others = results.others || [];
    const wins = [];

    if (baseType === "SUPER") {
        if (num === results["1"]) wins.push("SUPER 1");
        if (num === results["2"]) wins.push("SUPER 2");
        if (num === results["3"]) wins.push("SUPER 3");
        if (num === results["4"]) wins.push("SUPER 4");
        if (num === results["5"]) wins.push("SUPER 5");
        if (others.includes(num)) wins.push("SUPER other");
        return wins;
    }

    if (baseType === "BOX") {
        const sortStr = (s) => s.split("").sort().join("");
        const numSorted = sortStr(num);
        const firstPrize = results["1"];

        if (!firstPrize) return [];

        const uniqueDigits = new Set(num.toString().split("")).size;
        let suffix = "";
        if (uniqueDigits === 2) suffix = " (2 Same)";
        else if (uniqueDigits === 1) suffix = " (3 Same)";

        if (num === firstPrize) {
            wins.push(`BOX perfect${suffix}`); // Maps to Pos 1
        } else if (numSorted === sortStr(firstPrize)) {
            wins.push(`BOX permutation${suffix}`); // Maps to Pos 6 (or pos 2/3 for double)
        }
        return wins;
    }

    if (["AB", "BC", "AC", "A", "B", "C"].includes(baseType)) {
        if (!first || first.length < 3) return [];
        const [d1, d2, d3] = first.split("");
        if (baseType === "A" && num === d1) wins.push("A");
        if (baseType === "B" && num === d2) wins.push("B");
        if (baseType === "C" && num === d3) wins.push("C");
        if (baseType === "AB" && num === (d1 + d2)) wins.push("AB");
        if (baseType === "BC" && num === (d2 + d3)) wins.push("BC");
        if (baseType === "AC" && num === (d1 + d3)) wins.push("AC");
        return wins;
    }
    return wins;
};

const fallbackRates = {
    "A": { amount: 100, super: 0 },
    "B": { amount: 100, super: 0 },
    "C": { amount: 100, super: 0 },
    "AB": { amount: 700, super: 30 },
    "BC": { amount: 700, super: 30 },
    "AC": { amount: 700, super: 30 },
    "SUPER 1": { amount: 5000, super: 400 },
    "SUPER 2": { amount: 500, super: 50 },
    "SUPER 3": { amount: 250, super: 20 },
    "SUPER 4": { amount: 100, super: 20 },
    "SUPER 5": { amount: 50, super: 20 },
    "SUPER other": { amount: 20, super: 10 },
    "BOX perfect": { amount: 3000, super: 300 },
    "BOX permutation": { amount: 800, super: 30 },
    "BOX perfect (2 Same)": { amount: 3800, super: 330 },
    "BOX permutation (2 Same)": { amount: 1600, super: 60 },
    "BOX perfect (3 Same)": { amount: 7000, super: 450 }
};

const calculateWinAmountFull = (entry, results, schemeData, fallbackPrizes = {}) => {
    if (!results || !results["1"]) return [];

    const baseType = extractBaseType(entry.type);
    const winTypes = computeWinType(entry, results);
    if (!winTypes || winTypes.length === 0) return [];

    // Find the group in schemeData that matches this baseType
    let targetGroup = "";
    if (baseType === "A" || baseType === "B" || baseType === "C") {
        targetGroup = "Group 1";
    } else if (["AB", "BC", "AC"].includes(baseType)) {
        targetGroup = "Group 2";
    } else if (baseType === "SUPER") {
        targetGroup = "Group 3-SUPER";
    } else if (baseType === "BOX") {
        const uniqueDigits = new Set(entry.number.toString().split("")).size;
        if (uniqueDigits === 2) {
            targetGroup = "Group 3-BOX (2 Same)";
        } else if (uniqueDigits === 1) {
            targetGroup = "Group 3-BOX (3 Same)";
        } else {
            targetGroup = "Group 3-BOX";
        }
    }

    const group = (schemeData?.schemes || []).find(g => g.group === targetGroup);
    // If group is missing, we can't find rows, but we can still return fallback if provided

    const allWins = [];
    for (const winType of winTypes) {
        let row;
        if (group) {
            if (baseType === "SUPER" || baseType === "BOX") {
                const cleanWinType = winType.replace(/\s*\(.*?\)\s*/g, "");
                const match = cleanWinType.match(/(\d+)/); // Extracts 1, 2, 3...
                let pos = match ? parseInt(match[1], 10) : 1;
                if (!match) {
                    if (winType.toLowerCase().includes("other") || winType.toLowerCase().includes("permutation")) {
                        if (targetGroup.includes("2 Same")) {
                            pos = 2; // For 2 same, permutations map to pos 2 or 3 (both have same rate)
                        } else {
                            pos = 6;
                        }
                    } else {
                        pos = 1;
                    }
                }
                row = group.rows.find(r => r.pos === pos);

                // Box fallback for non-doubles if pos > 1
                if (!row && baseType === "BOX" && pos <= 1) {
                    row = group.rows[0]; // Default to first row
                }
            } else {
                row = group.rows.find(r => r.scheme === baseType);
            }
        }

        const count = entry.count || 0;
        const fallback = fallbackRates[winType] || { amount: 0, super: 0 };
        
        const finalAmount = row ? (row.amount !== undefined ? row.amount : fallback.amount) : fallback.amount;

        // Prioritize backend-provided fallbackPrizes map, then user's row, then static fallbackRates
        const superFallback = fallbackPrizes[winType] !== undefined ? fallbackPrizes[winType] : fallback.super;
        const finalSuper = row ? (row.super !== undefined ? row.super : superFallback) : superFallback;

        allWins.push({
            prize: finalAmount * count,
            superPrize: finalSuper * count,
            winType: winType
        });
    }

    return allWins;
};

const calculateWinAmount = (entry, results, schemeData) => {
    const wins = calculateWinAmountFull(entry, results, schemeData);
    return wins.reduce((sum, w) => sum + w.prize, 0);
};

module.exports = {
    extractBaseType,
    computeWinType,
    calculateWinAmount,
    calculateWinAmountFull
};