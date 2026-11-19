// ===================================
// LOCAL STORAGE — save / load / clear the current bill
// ===================================
// This file only deals with storage. It knows nothing about the page;
// app.js decides *when* to save and how to show restored data.

const STORAGE_KEY = "splitsmart.bill";
const STORAGE_VERSION = 1;

const CHARGE_FIELDS = ["service", "sst", "tip", "other"];

/**
 * Save the bill as JSON. Fails quietly (with a console warning) when
 * storage is unavailable, e.g. private mode or storage full.
 */
function saveBill(bill) {
    try {
        const data = {
            version: STORAGE_VERSION,
            savedAt: new Date().toISOString(),
            bill: bill
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        console.warn("SplitSmart: could not save bill.", error);
        return false;
    }
}

/**
 * Load the saved bill. Returns a clean bill object, or null when there
 * is nothing saved or the saved data is unreadable.
 */
function loadBill() {
    let raw;

    try {
        raw = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        console.warn("SplitSmart: could not read saved bill.", error);
        return null;
    }

    if (!raw) return null;

    try {
        const data = JSON.parse(raw);

        if (!data || typeof data !== "object" || !data.bill) {
            throw new Error("Unexpected format");
        }

        return sanitizeBill(data.bill);
    } catch (error) {
        console.warn("SplitSmart: saved bill was invalid and was removed.", error);
        clearSavedBill();
        return null;
    }
}

/** Remove the saved bill. */
function clearSavedBill() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.warn("SplitSmart: could not clear saved bill.", error);
    }
}

/**
 * Turn possibly-damaged saved data into a valid bill. Invalid entries are
 * dropped instead of breaking the whole restore.
 */
function sanitizeBill(bill) {
    const billName = typeof bill.billName === "string" ? bill.billName : "";

    // Participants: unique, non-empty strings
    const participants = [];

    if (Array.isArray(bill.participants)) {
        bill.participants.forEach(function (name) {
            if (typeof name !== "string") return;

            const trimmed = name.trim();

            if (trimmed !== "" && !participants.includes(trimmed)) {
                participants.push(trimmed);
            }
        });
    }

    // Food items: valid name, price > 0, whole quantity >= 1,
    // sharedBy limited to known participants
    const foodItems = [];

    if (Array.isArray(bill.foodItems)) {
        bill.foodItems.forEach(function (item) {
            if (!item || typeof item !== "object") return;

            const name = typeof item.name === "string" ? item.name.trim() : "";
            const price = Number(item.price);
            const quantity = Number(item.quantity);

            if (name === "" || !Number.isFinite(price) || price <= 0) return;
            if (!Number.isInteger(quantity) || quantity < 1) return;

            const sharedBy = Array.isArray(item.sharedBy)
                ? item.sharedBy.filter(function (person, index, list) {
                    return participants.includes(person) &&
                        list.indexOf(person) === index;
                })
                : [];

            foodItems.push({
                name: name,
                price: price,
                quantity: quantity,
                sharedBy: sharedBy
            });
        });
    }

    // Charges: kept as strings (like the inputs), must be >= 0
    const charges = {};
    const savedCharges = bill.charges && typeof bill.charges === "object"
        ? bill.charges
        : {};

    CHARGE_FIELDS.forEach(function (field) {
        const value = savedCharges[field];
        const number = Number(value);

        charges[field] =
            value !== "" && value !== null && value !== undefined &&
            Number.isFinite(number) && number >= 0
                ? String(value)
                : "0";
    });

    return {
        billName: billName,
        participants: participants,
        foodItems: foodItems,
        charges: charges
    };
}
