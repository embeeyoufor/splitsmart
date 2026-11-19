
const participantInput = document.getElementById("participantName");
const addParticipantButton = document.getElementById("addParticipant");
const participantList = document.getElementById("participantList");

const addFoodButton = document.getElementById("addFood");
const foodList = document.getElementById("foodList");

let participants = [];
let foodItems = [];

// ===================================
// PARTICIPANT FEATURES
// ===================================

addParticipantButton.addEventListener("click", addParticipant);

function addParticipant() {
    const name = participantInput.value.trim();

    if (name === "") {
        alert("Please enter a participant's name.");
        return;
    }

    if (participants.includes(name)) {
        alert("This participant already exists.");
        return;
    }

    participants.push(name);

    displayParticipants();
    persistBill();

    participantInput.value = "";
    participantInput.focus();
}

function displayParticipants() {
    participantList.innerHTML = "";

    if (participants.length === 0) {
        participantList.innerHTML =
            '<p class="empty-message">No participants added yet.</p>';
        return;
    }

    participants.forEach(function (name) {
        const participant = document.createElement("div");
        participant.className = "participant-item";

        const nameText = document.createElement("span");
        nameText.textContent = name;

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.className = "remove-button";

        removeButton.addEventListener("click", function () {
            // Remove participant from the participant list
            participants = participants.filter(function (person) {
                return person !== name;
            });

            // Remove participant from any food item assignments
            foodItems.forEach(function (item) {
                item.sharedBy = item.sharedBy.filter(function (person) {
                    return person !== name;
                });
            });

            displayParticipants();
            displayFoodItems();
            persistBill();
        });

        participant.appendChild(nameText);
        participant.appendChild(removeButton);

        participantList.appendChild(participant);
    });
}

// ===================================
// FOOD ITEM FEATURES
// ===================================

addFoodButton.addEventListener("click", function () {
    showFoodForm();
});

/**
 * Shows the food form.
 * - showFoodForm()       → add a new item
 * - showFoodForm(index)  → edit foodItems[index] in place
 */
function showFoodForm(editIndex) {
    const isEditing = Number.isInteger(editIndex);
    const editingItem = isEditing ? foodItems[editIndex] : null;

    if (isEditing && !editingItem) {
        return;
    }

    if (participants.length === 0) {
        alert("Please add participants before adding food items.");
        return;
    }

    // Only one add/edit form at a time
    const openForm = document.getElementById("foodForm");

    if (openForm) {
        alert("Please save or cancel the food form that is already open.");
        openForm.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    const form = document.createElement("div");
    form.id = "foodForm";
    form.className = "food-form";

    const title = document.createElement("h3");
    title.textContent = isEditing ? "Edit Food Item" : "Add Food Item";

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Food or drink name";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "e.g. Chicken Rice";

    const priceLabel = document.createElement("label");
    priceLabel.textContent = "Price (RM)";

    const priceInput = document.createElement("input");
    priceInput.type = "number";
    priceInput.placeholder = "e.g. 12.50";
    priceInput.min = "0.01";
    priceInput.step = "0.01";

    const quantityLabel = document.createElement("label");
    quantityLabel.textContent = "Quantity";

    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.value = "1";
    quantityInput.min = "1";
    quantityInput.step = "1";

    const peopleTitle = document.createElement("p");
    peopleTitle.textContent = "Who shared this item?";
    peopleTitle.className = "people-title";

    const checkboxContainer = document.createElement("div");
    checkboxContainer.className = "checkbox-container";

    participants.forEach(function (person) {
        const label = document.createElement("label");
        label.className = "checkbox-label";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = person;
        checkbox.checked = isEditing &&
            editingItem.sharedBy.includes(person);

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(person));

        checkboxContainer.appendChild(label);
    });

    // Pre-fill the form with the existing item when editing
    if (isEditing) {
        nameInput.value = editingItem.name;
        priceInput.value = editingItem.price;
        quantityInput.value = editingItem.quantity;
    }

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = isEditing ? "Save Changes" : "Save Food Item";
    saveButton.className = "save-button";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    cancelButton.className = "cancel-button";

    saveButton.addEventListener("click", function () {
        const name = nameInput.value.trim();
        const price = Number(priceInput.value);
        const quantity = Number(quantityInput.value);

        const selectedPeople = Array.from(
            checkboxContainer.querySelectorAll("input:checked")
        ).map(function (checkbox) {
            return checkbox.value;
        });

        if (name === "" || price <= 0 || !priceInput.value ||
            !Number.isFinite(price)) {
            alert("Please enter a valid food name and price.");
            return;
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            alert("Quantity must be a whole number of at least 1.");
            return;
        }

        if (selectedPeople.length === 0) {
            alert("Please select at least one participant.");
            return;
        }

        const foodItem = {
            name: name,
            price: price,
            quantity: quantity,
            sharedBy: selectedPeople
        };

        if (isEditing) {
            // Make sure the list hasn't changed underneath the form
            if (foodItems[editIndex] !== editingItem) {
                alert("This food item has changed. Please try editing it again.");
                displayFoodItems();
                return;
            }

            foodItems[editIndex] = foodItem;
        } else {
            foodItems.push(foodItem);
        }

        displayFoodItems();
        persistBill();
    });

    // Re-rendering removes the form and brings back the original card
    cancelButton.addEventListener("click", function () {
        displayFoodItems();
    });

    form.appendChild(title);
    form.appendChild(nameLabel);
    form.appendChild(nameInput);
    form.appendChild(priceLabel);
    form.appendChild(priceInput);
    form.appendChild(quantityLabel);
    form.appendChild(quantityInput);
    form.appendChild(peopleTitle);
    form.appendChild(checkboxContainer);
    form.appendChild(saveButton);
    form.appendChild(cancelButton);

    const cardToReplace = isEditing
        ? foodList.querySelector('[data-index="' + editIndex + '"]')
        : null;

    if (cardToReplace) {
        cardToReplace.replaceWith(form);
    } else {
        foodList.appendChild(form);
    }

    form.scrollIntoView({ behavior: "smooth", block: "center" });
    nameInput.focus({ preventScroll: true });
}

function displayFoodItems() {
    foodList.innerHTML = "";

    if (foodItems.length === 0) {
        foodList.innerHTML =
            '<p class="empty-message">No food items added yet.</p>';
        return;
    }

    foodItems.forEach(function (item, index) {
        const card = document.createElement("div");
        card.className = "food-item-card";
        card.dataset.index = index;

        const name = document.createElement("h3");
        name.textContent = item.name;

        const details = document.createElement("p");
        details.textContent =
            "RM " + (item.price * item.quantity).toFixed(2) +
            " · Quantity: " + item.quantity;

        const shared = document.createElement("p");
        shared.textContent = "Shared by: " +
            (item.sharedBy.length > 0
                ? item.sharedBy.join(", ")
                : "No participants assigned");

        const actions = document.createElement("div");
        actions.className = "food-item-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.className = "edit-button";

        editButton.addEventListener("click", function () {
            showFoodForm(index);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Remove";
        deleteButton.className = "remove-button";

        deleteButton.addEventListener("click", function () {
            foodItems.splice(index, 1);
            displayFoodItems();
            persistBill();
        });

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        card.appendChild(name);
        card.appendChild(details);
        card.appendChild(shared);
        card.appendChild(actions);

        foodList.appendChild(card);
    });
}


const calculateButton = document.getElementById("calculateBillButton");
const updateBillButton = document.getElementById("updateBillButton");

const summarySection = document.getElementById("summarySection");
const summaryList = document.getElementById("summaryList");

const foodTotalDisplay = document.getElementById("foodTotal");
const chargesTotalDisplay = document.getElementById("chargesTotal");
const grandTotal = document.getElementById("grandTotal");

const receiptTitle = document.getElementById("receiptTitle");

const whatsappButton = document.getElementById("whatsappButton");
const pdfButton = document.getElementById("pdfButton");

let latestBill = null;

function formatRM(cents) {
    return "RM " + (cents / 100).toFixed(2);
}

function updateBillSummary() {
    if (participants.length === 0 || foodItems.length === 0) {
        alert("Please add participants and food items first.");
        return;
    }

    const charges = {
        service: document.getElementById("serviceCharge").value,
        sst: document.getElementById("sstCharge").value,
        tip: document.getElementById("tipCharge").value,
        other: document.getElementById("otherCharge").value
    };

    const chargeValues = Object.values(charges);

    if (chargeValues.some(function (value) {
        return value.trim() === "" ||
            !Number.isFinite(Number(value)) ||
            Number(value) < 0;
    })) {
        alert("Please enter valid non-negative charge amounts.");
        return;
    }

    try {
        latestBill = calculateBill(foodItems, participants, charges);

        summaryList.innerHTML = "";

        const billName =
            document.getElementById("billName").value.trim() ||
            "SplitSmart Bill";

        receiptTitle.textContent = billName;
        receiptTitle.className = "receipt-title";

        latestBill.participants.forEach(function (person) {
            const card = document.createElement("div");
            card.className = "person-summary";

            const name = document.createElement("h3");
            name.textContent = person.name;

            const foodRow = document.createElement("div");
            foodRow.className = "breakdown-row";
            foodRow.textContent =
                "Food subtotal: " + formatRM(person.foodSubtotal);

            const chargeRow = document.createElement("div");
            chargeRow.className = "breakdown-row";
            chargeRow.textContent =
                "Additional charges: " +
                formatRM(person.additionalCharges);

            const finalRow = document.createElement("div");
            finalRow.className = "person-final";
            finalRow.textContent =
                "Total to pay: " + formatRM(person.finalAmount);

            card.appendChild(name);
            card.appendChild(foodRow);
            card.appendChild(chargeRow);
            card.appendChild(finalRow);

            summaryList.appendChild(card);
        });

        foodTotalDisplay.textContent = formatRM(latestBill.foodTotal);
        chargesTotalDisplay.textContent = formatRM(latestBill.chargeTotal);
        grandTotal.textContent = formatRM(latestBill.total);

        summarySection.style.display = "block";

        summarySection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {
        alert(error.message);
    }
}

calculateButton.addEventListener("click", updateBillSummary);

if (updateBillButton) {
    updateBillButton.addEventListener("click", updateBillSummary);
}

// WhatsApp sharing
whatsappButton.addEventListener("click", function () {
    if (!latestBill) {
        alert("Please calculate the bill first.");
        return;
    }

    const billName =
        document.getElementById("billName").value.trim() ||
        "SplitSmart Bill";

    let message = "*" + billName + "*\n";
    message += "Payment Breakdown\n\n";

    latestBill.participants.forEach(function (person) {
        message += "*" + person.name + "*\n";
        message += "Food: " + formatRM(person.foodSubtotal) + "\n";
        message += "Additional charges: " +
            formatRM(person.additionalCharges) + "\n";
        message += "Total to pay: *" +
            formatRM(person.finalAmount) + "*\n\n";
    });

    message += "--------------------------\n";
    message += "Food total: " + formatRM(latestBill.foodTotal) + "\n";
    message += "Additional charges: " +
        formatRM(latestBill.chargeTotal) + "\n";
    message += "*Grand total: " + formatRM(latestBill.total) + "*\n\n";
    message += "Calculated with SplitSmart.";

    const whatsappURL =
        "https://wa.me/?text=" + encodeURIComponent(message);

    window.open(whatsappURL, "_blank");
});

// PDF generation using browser print
pdfButton.addEventListener("click", function () {
    if (!latestBill) {
        alert("Please calculate the bill first.");
        return;
    }

    window.print();
});

// ===================================
// AUTO-SAVE, RESTORE & RESET
// (storage helpers live in storage.js)
// ===================================

const billNameInput = document.getElementById("billName");
const resetBillButton = document.getElementById("resetBillButton");

const chargeInputs = {
    service: document.getElementById("serviceCharge"),
    sst: document.getElementById("sstCharge"),
    tip: document.getElementById("tipCharge"),
    other: document.getElementById("otherCharge")
};

// True while restoring, so restoring never triggers a save that could
// overwrite the saved bill halfway through.
let isRestoring = false;

function getBillState() {
    const charges = {};

    Object.keys(chargeInputs).forEach(function (field) {
        charges[field] = chargeInputs[field].value;
    });

    return {
        billName: billNameInput.value,
        participants: participants,
        foodItems: foodItems,
        charges: charges
    };
}

// Any change makes the shown summary out of date. Hide it and forget the
// old result so WhatsApp / PDF can only use a freshly calculated bill.
function invalidateBillSummary() {
    if (!latestBill) return;

    latestBill = null;
    summarySection.style.display = "none";
}

function persistBill() {
    if (isRestoring) return;

    invalidateBillSummary();
    saveBill(getBillState());
}

function restoreBill() {
    const savedBill = loadBill();

    if (!savedBill) return;

    isRestoring = true;

    billNameInput.value = savedBill.billName;
    participants = savedBill.participants;
    foodItems = savedBill.foodItems;

    Object.keys(chargeInputs).forEach(function (field) {
        chargeInputs[field].value = savedBill.charges[field];
    });

    displayParticipants();
    displayFoodItems();

    isRestoring = false;
}

function resetBill() {
    const confirmed = confirm(
        "Reset this bill? All participants, food items and charges " +
        "will be cleared. This cannot be undone."
    );

    if (!confirmed) return;

    participants = [];
    foodItems = [];
    latestBill = null;

    billNameInput.value = "";
    participantInput.value = "";

    Object.keys(chargeInputs).forEach(function (field) {
        chargeInputs[field].value = "0";
    });

    // Re-rendering also removes an open "Add Food Item" form
    displayParticipants();
    displayFoodItems();

    summaryList.innerHTML = "";
    receiptTitle.textContent = "";
    foodTotalDisplay.textContent = formatRM(0);
    chargesTotalDisplay.textContent = formatRM(0);
    grandTotal.textContent = formatRM(0);
    summarySection.style.display = "none";

    clearSavedBill();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Text and charge fields save as the user types
billNameInput.addEventListener("input", persistBill);

Object.values(chargeInputs).forEach(function (input) {
    input.addEventListener("input", persistBill);
});

resetBillButton.addEventListener("click", resetBill);

// Restore the saved bill when the page opens
restoreBill();
