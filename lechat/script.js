// Données initiales
let stocks = {
    dinde: 7,
    patate: 21,
    citrouille: 8,
    mais: 13,
    haricots: 4,
    canneberge: 7,
    beurre: 9,
    assaisonement: 10,
    eau: 11,
    lait: 5,
    oeuf: 19,
    farine: 3,
};

let recipes = {
    dinde_roti: { ingredients: { dinde: 2, beurre: 1, assaisonement: 1 }, price: 40 },
    pain_mais: { ingredients: { mais: 2, oeuf: 1, farine: 1 }, price: 40 },
    tarte_citrouille: { ingredients: { citrouille: 2, lait: 1, farine: 1 }, price: 50 },
    casserole_haricots: { ingredients: { haricots: 2, beurre: 1, eau: 1 }, price: 40 },
    puree: { ingredients: { patate: 2, lait: 1, oeuf: 1 }, price: 40 },
    sauce: { ingredients: { canneberge: 2, assaisonement: 1, eau: 1 }, price: 50 },
};

// Fonction pour afficher les stocks
function displayStocks() {
    const tableBody = document.querySelector("#stocksTable tbody");
    tableBody.innerHTML = "";
    for (const [ingredient, quantity] of Object.entries(stocks)) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${ingredient}</td>
            <td><input type="number" value="${quantity}" onchange="updateStock('${ingredient}', this.value)"></td>
            <td><button onclick="removeIngredient('${ingredient}')">Supprimer</button></td>
        `;
        tableBody.appendChild(row);
    }
}

// Fonction pour afficher les recettes
function displayRecipes() {
    const tableBody = document.querySelector("#recipesTable tbody");
    tableBody.innerHTML = "";
    for (const [dish, data] of Object.entries(recipes)) {
        const ingredientsList = Object.entries(data.ingredients)
            .map(([ing, qty]) => `${qty} × ${ing}`)
            .join(", ");
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${dish}</td>
            <td>${ingredientsList}</td>
            <td><input type="number" value="${data.price}" onchange="updateRecipePrice('${dish}', this.value)"></td>
            <td><button onclick="removeDish('${dish}')">Supprimer</button></td>
        `;
        tableBody.appendChild(row);
    }
}

// Fonction pour mettre à jour un stock
function updateStock(ingredient, value) {
    stocks[ingredient] = parseInt(value);
}

// Fonction pour mettre à jour le prix d'une recette
function updateRecipePrice(dish, value) {
    recipes[dish].price = parseInt(value);
}

// Fonction pour ajouter un ingrédient
function addIngredient() {
    const name = document.getElementById("newIngredientName").value.trim();
    const quantity = parseInt(document.getElementById("newIngredientQuantity").value);
    if (name && !isNaN(quantity)) {
        stocks[name] = quantity;
        displayStocks();
        document.getElementById("newIngredientName").value = "";
        document.getElementById("newIngredientQuantity").value = "0";
    }
}

// Fonction pour supprimer un ingrédient
function removeIngredient(ingredient) {
    delete stocks[ingredient];
    // Supprimer l'ingrédient de toutes les recettes
    for (const dish in recipes) {
        delete recipes[dish].ingredients[ingredient];
    }
    displayStocks();
    displayRecipes();
}

// Fonction pour ajouter un plat
function addDish() {
    const name = document.getElementById("newDishName").value.trim();
    const ingredientsStr = document.getElementById("newDishIngredients").value.trim();
    const price = parseInt(document.getElementById("newDishPrice").value);
    if (name && ingredientsStr && !isNaN(price)) {
        const ingredients = {};
        ingredientsStr.split(",").forEach(pair => {
            const [ing, qty] = pair.split(":");
            ingredients[ing.trim()] = parseInt(qty.trim());
        });
        recipes[name] = { ingredients, price };
        displayRecipes();
        document.getElementById("newDishName").value = "";
        document.getElementById("newDishIngredients").value = "";
        document.getElementById("newDishPrice").value = "0";
    }
}

// Fonction pour supprimer un plat
function removeDish(dish) {
    delete recipes[dish];
    displayRecipes();
}

// Fonction pour vérifier si une combinaison est valide
function isCombinationValid(combination) {
    const tempStocks = { ...stocks };
    for (const [dish, quantity] of Object.entries(combination)) {
        for (const [ingredient, required] of Object.entries(recipes[dish].ingredients)) {
            if (!tempStocks[ingredient] || tempStocks[ingredient] < required * quantity) {
                return false;
            }
            tempStocks[ingredient] -= required * quantity;
        }
    }
    return true;
}

// Fonction pour calculer le revenu d'une combinaison
function calculateRevenue(combination) {
    let revenue = 0;
    for (const [dish, quantity] of Object.entries(combination)) {
        revenue += recipes[dish].price * quantity;
    }
    return revenue;
}

// Fonction pour calculer le nombre total d'ingrédients utilisés
function calculateTotalIngredientsUsed(combination) {
    let total = 0;
    for (const quantity of Object.values(combination)) {
        total += quantity;
    }
    return total;
}

// Fonction pour générer une combinaison aléatoire
function generateRandomCombination() {
    const combination = {};
    for (const dish in recipes) {
        let maxPossible = Infinity;
        for (const [ingredient, required] of Object.entries(recipes[dish].ingredients)) {
            const possible = Math.floor((stocks[ingredient] || 0) / required);
            if (possible < maxPossible) {
                maxPossible = possible;
            }
        }
        combination[dish] = Math.floor(Math.random() * (maxPossible + 1));
    }
    return combination;
}

// Fonction pour calculer la production optimale
function calculateOptimalProduction() {
    const targetRevenue = parseInt(document.getElementById("targetRevenue").value);
    const stopAtTarget = document.getElementById("stopAtTarget").checked;

    let bestCombination = null;
    let bestRevenue = 0;
    let bestTotalIngredients = Infinity;

    // Nombre d'itérations pour la recherche aléatoire
    const maxIterations = 10000;
    let iterations = 0;

    while (iterations < maxIterations) {
        const combination = generateRandomCombination();
        if (isCombinationValid(combination)) {
            const revenue = calculateRevenue(combination);
            const totalIngredients = calculateTotalIngredientsUsed(combination);

            if (stopAtTarget) {
                // On cherche à atteindre le revenu cible avec le moins d'ingrédients
                if (revenue >= targetRevenue) {
                    if (totalIngredients < bestTotalIngredients) {
                        bestCombination = combination;
                        bestRevenue = revenue;
                        bestTotalIngredients = totalIngredients;
                    }
                }
            } else {
                // On cherche à maximiser le revenu
                if (revenue > bestRevenue) {
                    bestCombination = combination;
                    bestRevenue = revenue;
                    bestTotalIngredients = totalIngredients;
                }
            }
        }
        iterations++;
    }

    // Si aucune combinaison n'atteint le revenu cible, on utilise la meilleure combinaison possible
    if (stopAtTarget && (!bestCombination || bestRevenue < targetRevenue)) {
        let fallbackCombination = null;
        let fallbackRevenue = 0;
        let fallbackTotalIngredients = 0;

        // On cherche la combinaison qui utilise le plus d'ingrédients
        iterations = 0;
        while (iterations < maxIterations) {
            const combination = generateRandomCombination();
            if (isCombinationValid(combination)) {
                const revenue = calculateRevenue(combination);
                const totalIngredients = calculateTotalIngredientsUsed(combination);

                if (revenue > fallbackRevenue ||
                    (revenue === fallbackRevenue && totalIngredients > fallbackTotalIngredients)) {
                    fallbackCombination = combination;
                    fallbackRevenue = revenue;
                    fallbackTotalIngredients = totalIngredients;
                }
            }
            iterations++;
        }

        // Affichage des résultats de repli
        const resultDiv = document.getElementById("result");
        let resultHTML = `<h3>Revenu cible non atteignable. Meilleure combinaison possible (revenu: ${fallbackRevenue})</h3>`;
        resultHTML += "<ul>";
        for (const [dish, quantity] of Object.entries(fallbackCombination)) {
            if (quantity > 0) {
                resultHTML += `<li>${dish}: ${quantity} (${recipes[dish].price} × ${quantity} = ${recipes[dish].price * quantity})</li>`;
            }
        }
        resultHTML += "</ul>";
        resultDiv.innerHTML = resultHTML;
        return;
    }

    // Affichage des résultats optimaux
    const resultDiv = document.getElementById("result");
    if (bestCombination) {
        let resultHTML = `<h3>Combinaison optimale trouvée (revenu: ${bestRevenue})</h3>`;
        resultHTML += "<ul>";
        for (const [dish, quantity] of Object.entries(bestCombination)) {
            if (quantity > 0) {
                resultHTML += `<li>${dish}: ${quantity} (${recipes[dish].price} × ${quantity} = ${recipes[dish].price * quantity})</li>`;
            }
        }
        resultHTML += "</ul>";
        resultDiv.innerHTML = resultHTML;
    } else {
        resultDiv.innerHTML = "<p>Aucune combinaison valide trouvée.</p>";
    }
}

// Initialisation
displayStocks();
displayRecipes();
