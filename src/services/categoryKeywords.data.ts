/**
 * Lightweight, offline keyword → category guesser used by quick-add so items
 * don't all default to "Others". Keywords are multilingual (en / es / fr) and
 * matched against normalized (accent-stripped, lowercased) name tokens.
 */

const CATEGORY_KEYWORDS: [categoryId: string, keywords: string[]][] = [
  [
    'vegetables',
    [
      'tomato', 'potato', 'onion', 'garlic', 'carrot', 'lettuce', 'spinach', 'broccoli',
      'pepper', 'cucumber', 'zucchini', 'mushroom', 'salad', 'celery', 'cabbage',
      'tomate', 'patata', 'papa', 'cebolla', 'ajo', 'zanahoria', 'lechuga', 'espinaca',
      'brocoli', 'pimiento', 'pepino', 'calabacin', 'champinon', 'ensalada', 'verdura',
      'legume', 'pomme de terre', 'oignon', 'carotte', 'laitue', 'epinard', 'poivron',
      'concombre', 'courgette', 'champignon',
    ],
  ],
  [
    'fruits',
    [
      'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry', 'blueberry',
      'mango', 'pear', 'peach', 'melon', 'watermelon', 'pineapple', 'kiwi', 'cherry', 'avocado',
      'manzana', 'platano', 'naranja', 'limon', 'uva', 'fresa', 'arandano', 'pera',
      'melocoton', 'sandia', 'pina', 'cereza', 'aguacate', 'fruta',
      'pomme', 'banane', 'citron', 'raisin', 'fraise', 'myrtille', 'poire', 'peche',
      'ananas', 'cerise', 'avocat', 'fruit',
    ],
  ],
  [
    'meat',
    [
      'chicken', 'beef', 'pork', 'steak', 'sausage', 'bacon', 'ham', 'turkey', 'lamb', 'mince',
      'pollo', 'carne', 'ternera', 'cerdo', 'filete', 'salchicha', 'jamon', 'pavo', 'cordero',
      'poulet', 'boeuf', 'porc', 'saucisse', 'jambon', 'dinde', 'agneau', 'viande',
    ],
  ],
  [
    'fish',
    [
      'fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'cod', 'seafood',
      'pescado', 'atun', 'gamba', 'camaron', 'bacalao', 'marisco',
      'poisson', 'saumon', 'thon', 'crevette', 'cabillaud', 'fruits de mer',
    ],
  ],
  [
    'dairy',
    [
      'milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream', 'egg',
      'leche', 'queso', 'yogur', 'mantequilla', 'nata', 'crema', 'huevo',
      'lait', 'fromage', 'yaourt', 'beurre', 'creme', 'oeuf',
    ],
  ],
  [
    'bakery',
    [
      'bread', 'baguette', 'croissant', 'bun', 'roll', 'cake', 'pastry', 'toast', 'muffin',
      'pan', 'bollo', 'pastel', 'torta', 'tostada', 'magdalena',
      'pain', 'gateau', 'brioche', 'viennoiserie',
    ],
  ],
  [
    'pasta',
    [
      'pasta', 'spaghetti', 'macaroni', 'noodle', 'rice', 'lasagna',
      'espagueti', 'macarron', 'fideo', 'arroz', 'lasana',
      'riz', 'nouille', 'lasagne',
    ],
  ],
  [
    'pantry',
    [
      'flour', 'sugar', 'salt', 'oil', 'vinegar', 'sauce', 'beans', 'lentil', 'cereal',
      'honey', 'jam', 'ketchup', 'mustard', 'nut', 'peanut',
      'harina', 'azucar', 'sal', 'aceite', 'vinagre', 'salsa', 'frijol', 'judia', 'lenteja',
      'miel', 'mermelada', 'cacahuete',
      'farine', 'sucre', 'sel', 'huile', 'vinaigre', 'haricot', 'lentille', 'cereale',
      'confiture', 'moutarde', 'cacahuete',
    ],
  ],
  [
    'drinks',
    [
      'water', 'juice', 'soda', 'cola', 'beer', 'wine', 'coffee', 'tea', 'drink', 'smoothie',
      'agua', 'zumo', 'refresco', 'cerveza', 'vino', 'cafe', 'bebida',
      'eau', 'jus', 'biere', 'vin', 'the', 'boisson',
    ],
  ],
  [
    'frozen',
    ['frozen', 'ice cream', 'congelado', 'helado', 'surgele', 'glace', 'glacon'],
  ],
  [
    'cleaning',
    [
      'detergent', 'soap', 'bleach', 'cleaner', 'dishwasher', 'sponge',
      'detergente', 'jabon', 'lejia', 'limpiador', 'lavavajillas', 'esponja',
      'savon', 'javel', 'nettoyant', 'lessive', 'eponge',
    ],
  ],
  [
    'household',
    [
      'paper', 'towel', 'napkin', 'foil', 'bag', 'battery', 'bulb', 'toilet', 'wrap',
      'papel', 'servilleta', 'bolsa', 'pila', 'bombilla', 'aluminio',
      'papier', 'serviette', 'sac', 'pile', 'ampoule', 'aluminium',
    ],
  ],
  [
    'pharmacy',
    [
      'medicine', 'pill', 'vitamin', 'bandage', 'aspirin', 'ibuprofen', 'toothpaste', 'shampoo',
      'medicina', 'pastilla', 'vitamina', 'tirita', 'aspirina', 'dentifrico', 'champu',
      'medicament', 'vitamine', 'pansement', 'dentifrice', 'shampooing',
    ],
  ],
  [
    'pets',
    [
      'dog', 'cat', 'pet', 'kibble', 'litter',
      'perro', 'gato', 'mascota', 'pienso', 'arena',
      'chien', 'chat', 'croquette', 'litiere',
    ],
  ],
]

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

/**
 * Returns a best-guess built-in category id for a free-text item name, or
 * `undefined` when nothing matches (caller should fall back to "Others").
 */
export function guessCategoryId(name: string): string | undefined {
  const normalized = normalize(name)
  if (!normalized) return undefined
  const tokens = normalized.split(/[\s,\-/]+/).filter(Boolean)

  for (const [categoryId, keywords] of CATEGORY_KEYWORDS) {
    for (const keyword of keywords) {
      if (keyword.includes(' ')) {
        if (normalized.includes(keyword)) return categoryId
      } else if (tokens.some((token) => token === keyword || token.startsWith(keyword))) {
        return categoryId
      }
    }
  }
  return undefined
}
