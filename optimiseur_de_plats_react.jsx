import React, { useState, useMemo } from "react";

// Single-file React app (Tailwind CSS assumed)
// Export default component so it can be previewed

export default function App() {
  // initial stock
  const [stock, setStock] = useState({
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
  });

  // initial recipes (mapping ingredient -> qty)
  const [recipes, setRecipes] = useState({
    dinde_roti: { dinde: 2, beurre: 1, assaisonement: 1 },
    pain_mais: { mais: 2, oeuf: 1, farine: 1 },
    tarte_citrouille: { citrouille: 2, lait: 1, farine: 1 },
    casserole_haricots: { haricots: 2, beurre: 1, eau: 1 },
    puree: { patate: 2, lait: 1, oeuf: 1 },
    sauce: { canneberge: 2, assaisonement: 1, eau: 1 },
  });

  const [prices, setPrices] = useState({
    dinde_roti: 40,
    pain_mais: 40,
    tarte_citrouille: 50,
    casserole_haricots: 40,
    puree: 40,
    sauce: 50,
  });

  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  // helpers to edit stock/recipes/prices
  function updateStockKey(key, value) {
    setStock((s) => ({ ...s, [key]: Math.max(0, Number(value) || 0) }));
  }

  function addStockItem() {
    const name = prompt("Nom de l'ingrédient (ex: miel) :");
    if (!name) return;
    setStock((s) => ({ ...s, [name]: 0 }));
  }

  function removeStockItem(key) {
    const copy = { ...stock };
    delete copy[key];
    setStock(copy);
  }

  function addRecipe() {
    const name = prompt("Nom de la recette (ex: biscuit) :");
    if (!name) return;
    // default empty recipe
    setRecipes((r) => ({ ...r, [name]: {} }));
    setPrices((p) => ({ ...p, [name]: 0 }));
  }

  function removeRecipe(key) {
    const r = { ...recipes };
    delete r[key];
    setRecipes(r);
    const p = { ...prices };
    delete p[key];
    setPrices(p);
  }

  function updateRecipeIngredient(recipeName) {
    // ask user for comma separated list like "dinde:2, beurre:1"
    const current = recipes[recipeName];
    const text = prompt(
      `Édite les ingrédients pour ${recipeName} au format ing:qty,ing2:qty2`,
      Object.entries(current)
        .map(([k, v]) => `${k}:${v}`)
        .join(", ")
    );
    if (text == null) return;
    const parts = text
      .split(/[,;]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    const newMap = {};
    for (const part of parts) {
      const [k, v] = part.split(":").map((s) => s && s.trim());
      if (!k) continue;
      const qty = Math.max(0, Number(v) || 0);
      newMap[k] = qty;
    }
    setRecipes((r) => ({ ...r, [recipeName]: newMap }));
  }

  function updatePrice(key, val) {
    setPrices((p) => ({ ...p, [key]: Math.max(0, Number(val) || 0) }));
  }

  // Solver: branch & bound DFS implemented in JS
  function computeOptimal() {
    setRunning(true);
    // clone current data
    const stockInit = { ...stock };
    const recs = Object.entries(recipes).map(([name, ing]) => ({ name, ing }));
    const priceMap = { ...prices };

    // compute max_possible per recipe
    const maxPossible = {};
    for (const { name, ing } of recs) {
      let best = Infinity;
      for (const [k, q] of Object.entries(ing)) {
        const have = stockInit[k] || 0;
        best = Math.min(best, Math.floor(have / q || 0));
      }
      if (best === Infinity) best = 0; // recipe without ingredients
      maxPossible[name] = best;
    }

    // precompute optimistic upper bound per recipe (price * max)
    const maxPerRecipe = recs.map((r) => priceMap[r.name] * (maxPossible[r.name] || 0));

    let bestRevenue = 0;
    let bestCombo = {};

    // order recipes to help pruning: sort by price descending
    const ordered = [...recs].sort((a, b) => (priceMap[b.name] || 0) - (priceMap[a.name] || 0));
    const orderedMax = ordered.map((r) => maxPossible[r.name] || 0);
    const orderedMaxRevenue = ordered.map((r) => (priceMap[r.name] || 0) * (maxPossible[r.name] || 0));

    function dfs(i, curStock, revenue, combo) {
      // bound: revenue + optimistic remaining
      const optimisticRemaining = orderedMaxRevenue.slice(i).reduce((a, b) => a + b, 0);
      if (revenue + optimisticRemaining <= bestRevenue) return;

      if (i === ordered.length) {
        if (revenue > bestRevenue) {
          bestRevenue = revenue;
          bestCombo = { ...combo };
        }
        return;
      }

      const r = ordered[i];
      const name = r.name;
      const recIng = r.ing;
      const price = priceMap[name] || 0;

      // compute max feasible now given curStock
      let maxN = Infinity;
      for (const [k, q] of Object.entries(recIng)) {
        const have = curStock[k] || 0;
        maxN = Math.min(maxN, Math.floor(have / q || 0));
      }
      if (maxN === Infinity) maxN = 0;

      // try from maxN down to 0 (prefer higher revenue first)
      for (let n = maxN; n >= 0; n--) {
        // apply
        const nextStock = { ...curStock };
        let ok = true;
        for (const [k, q] of Object.entries(recIng)) {
          nextStock[k] = (nextStock[k] || 0) - q * n;
          if (nextStock[k] < 0) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
        combo[name] = n;
        dfs(i + 1, nextStock, revenue + n * price, combo);
      }
      // cleanup
      delete combo[name];
    }

    dfs(0, { ...stockInit }, 0, {});

    setResult({ revenue: bestRevenue, combo: bestCombo });
    setRunning(false);
  }

  // pretty rendering helpers
  const recipeRows = useMemo(() => Object.entries(recipes), [recipes]);
  const stockRows = useMemo(() => Object.entries(stock), [stock]);
  const priceRows = useMemo(() => Object.entries(prices), [prices]);

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">Optimiseur de plats — interactif</h1>
      <p className="mb-6 text-sm text-gray-600">Modifie le stock, les recettes et les prix, puis clique <strong>Calculer</strong> pour obtenir la répartition optimale et le revenu maximal.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Stock</h2>
            <div className="space-x-2">
              <button onClick={addStockItem} className="px-2 py-1 text-sm rounded bg-gray-100">+ ingréd.</button>
            </div>
          </div>
          <div className="space-y-2">
            {stockRows.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <div className="capitalize">{k.replaceAll("_", " ")}</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-20 p-1 border rounded"
                    value={v}
                    onChange={(e) => updateStockKey(k, e.target.value)}
                  />
                  <button className="text-sm text-red-500" onClick={() => removeStockItem(k)}>suppr</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm col-span-1 md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Recettes</h2>
            <div className="space-x-2">
              <button onClick={addRecipe} className="px-2 py-1 text-sm rounded bg-gray-100">+ recette</button>
            </div>
          </div>

          <div className="space-y-3">
            {recipeRows.map(([name, ing]) => (
              <div key={name} className="p-3 border rounded flex items-start justify-between">
                <div>
                  <div className="font-medium">{name.replaceAll("_", " ")}</div>
                  <div className="text-sm text-gray-600 mt-1">{Object.entries(ing).map(([k, q]) => `${k}:${q}`).join(", ") || <em>aucun</em>}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-24 p-1 border rounded"
                      value={prices[name] ?? 0}
                      onChange={(e) => updatePrice(name, e.target.value)}
                    />
                    <span className="text-sm">€</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateRecipeIngredient(name)} className="px-2 py-1 text-sm rounded bg-gray-100">éditer ingr.</button>
                    <button onClick={() => removeRecipe(name)} className="px-2 py-1 text-sm rounded bg-red-50 text-red-600">suppr</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={computeOptimal}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow"
          disabled={running}
        >
          {running ? "Calcul en cours..." : "Calculer le meilleur prix de vente"}
        </button>

        <button
          onClick={() => {
            setResult(null);
          }}
          className="px-4 py-2 border rounded"
        >
          Réinitialiser résultat
        </button>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold">Résultat</h3>
        {!result && <div className="text-sm text-gray-600">Aucun résultat — lance le calcul.</div>}
        {result && (
          <div className="mt-3 p-4 bg-white rounded shadow-sm">
            <div className="mb-2">Revenu maximal estimé : <strong>{result.revenue} €</strong></div>
            <div className="text-sm text-gray-700">Répartition optimale :</div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.keys(recipes).map((r) => (
                <div key={r} className="p-2 border rounded flex justify-between items-center">
                  <div className="capitalize">{r.replaceAll("_", " ")}</div>
                  <div className="font-medium">{result.combo[r] ?? 0}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-8 text-xs text-gray-500">
        Astuce : tu peux ajouter/retirer ingrédients ou recettes, modifier les quantités au format <em>ing:qty</em>, puis recalculer.
      </footer>
    </div>
  );
}
