from pulp import LpMaximize, LpProblem, LpVariable, lpSum, value

# Définir le problème d'optimisation
model = LpProblem(name="max-ingredients", sense=LpMaximize)

# Définir les variables entières
marteau = LpVariable("marteau", lowBound=0, cat="Integer")
neige = LpVariable("neige", lowBound=0, cat="Integer")
biscuit = LpVariable("biscuit", lowBound=0, cat="Integer")
mousse = LpVariable("mousse", lowBound=0, cat="Integer")
cappuccino = LpVariable("cappuccino", lowBound=0, cat="Integer")
gateau = LpVariable("gateau", lowBound=0, cat="Integer")

# Contraintes numériques données
oeuf = 20
levure = 26
bonbon = 34
amandes = 18
lait = 19
confiture = 38
sucre = 15
glacage = 25
cacao = 18
farine = 27
cafe = 19
guimauve = 21

# Ajouter les contraintes
model += (marteau + gateau <= oeuf)
model += (marteau + mousse <= levure)
model += (2 * marteau <= bonbon)
model += (neige + cappuccino <= amandes)
model += (neige + biscuit <= lait)
model += (2 * neige <= confiture)
model += (biscuit + cappuccino <= sucre)
model += (2 * biscuit <= glacage)
model += (2 * mousse <= cacao)
model += (mousse + gateau <= farine)
model += (2 * cappuccino <= cafe)
model += (2 * gateau <= guimauve)

# Fonction objectif : maximiser la somme des ingrédients
model += lpSum([marteau, neige, biscuit, mousse, cappuccino, gateau])

# Résoudre le problème
model.solve()

# Afficher les résultats
for var in [marteau, neige, biscuit, mousse, cappuccino, gateau]:
    print(f"{var.name} = {var.varValue}")

print("Somme totale =", value(model.objective))

