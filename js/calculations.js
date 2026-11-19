
function allocateCents(totalCents, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    if (totalWeight === 0) {
        return weights.map(() => 0);
    }

    const exactShares = weights.map(function (weight) {
        return (totalCents * weight) / totalWeight;
    });

    const amounts = exactShares.map(Math.floor);

    let remaining = totalCents -
        amounts.reduce((sum, amount) => sum + amount, 0);

    const ranked = exactShares
        .map(function (share, index) {
            return {
                index: index,
                remainder: share - Math.floor(share)
            };
        })
        .sort(function (a, b) {
            return b.remainder - a.remainder || a.index - b.index;
        });

    for (let i = 0; i < remaining; i++) {
        amounts[ranked[i].index]++;
    }

    return amounts;
}

function calculateBill(foodItems, participants, charges = {}) {
    const foodWeights = participants.map(() => 0);

    // Calculate each participant's exact food share in cents
    foodItems.forEach(function (item) {
        const itemTotal = Math.round(item.price * 100) * item.quantity;
        const selectedPeople = item.sharedBy;

        if (selectedPeople.length === 0) return;

        selectedPeople.forEach(function (person) {
            const index = participants.indexOf(person);

            if (index !== -1) {
                foodWeights[index] += itemTotal / selectedPeople.length;
            }
        });
    });

    const foodTotal = Math.round(
        foodWeights.reduce((sum, amount) => sum + amount, 0)
    );

    const service = Math.round(Number(charges.service || 0) * 100);
    const sst = Math.round(Number(charges.sst || 0) * 100);
    const tip = Math.round(Number(charges.tip || 0) * 100);
    const other = Math.round(Number(charges.other || 0) * 100);

    const chargeTotal = service + sst + tip + other;

    if (chargeTotal > 0 && foodTotal === 0) {
        throw new Error(
            "Cannot allocate additional charges because the food subtotal is zero."
        );
    }

    // Allocate food shares so they add up exactly
    const foodAmounts = allocateCents(foodTotal, foodWeights);

    // Allocate each charge proportionally to food consumption
    const serviceAmounts = allocateCents(service, foodWeights);
    const sstAmounts = allocateCents(sst, foodWeights);
    const tipAmounts = allocateCents(tip, foodWeights);
    const otherAmounts = allocateCents(other, foodWeights);

    const results = participants.map(function (name, index) {
        const additionalCharges =
            serviceAmounts[index] +
            sstAmounts[index] +
            tipAmounts[index] +
            otherAmounts[index];

        return {
            name: name,
            foodSubtotal: foodAmounts[index],
            additionalCharges: additionalCharges,
            finalAmount: foodAmounts[index] + additionalCharges
        };
    });

    return {
        participants: results,
        foodTotal: foodTotal,
        chargeTotal: chargeTotal,
        total: foodTotal + chargeTotal
    };
}
