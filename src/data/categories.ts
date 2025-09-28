export interface Category {
  id: string;
  label: string;
  description: string;
}

export const categories: Category[] = [
  {
    id: "household",
    label: "Objetos de casa",
    description: "Fridge, faucet, laundry basket",
  },
  {
    id: "kitchen",
    label: "Cozinha",
    description: "Utensílios e alimentos, como spatula, cauldron, canned food",
  },
  {
    id: "bathroom",
    label: "Casa de banho",
    description: "Objetos de casa de banho, como toilet brush, razor, Q-tip",
  },
  {
    id: "office",
    label: "Escritório",
    description: "Objetos de escritório, como briefcase, case, pen",
  },
  {
    id: "clothing",
    label: "Roupas e acessórios",
    description: "Vest, cloak, shoe horn",
  },
  {
    id: "furniture",
    label: "Móveis",
    description: "Bed, chair, table, cabinet",
  },
  {
    id: "tools",
    label: "Ferramentas e equipamentos",
    description: "Shovel, rake, plunger, crane",
  },
  {
    id: "medical",
    label: "Médico",
    description: "Bandage, band-aid, crutches, tweezers",
  },
  {
    id: "animals",
    label: "Animais",
    description: "Scavenger, cat, dog, horse",
  },
  {
    id: "social",
    label: "Social",
    description: "Interações sociais e comportamentos",
  },
  {
    id: "plants",
    label: "Plantas",
    description: "Plantas, flores, árvores",
  },
  {
    id: "geography",
    label: "Geografia",
    description: "Montanhas, rios, crater, trail",
  },
  {
    id: "weather",
    label: "Clima",
    description: "Fenómenos meteorológicos",
  },
  {
    id: "emotions",
    label: "Emoções",
    description: "Alegria, tristeza, raiva, medo",
  },
  {
    id: "food",
    label: "Alimentos",
    description: "Meat, bread, canned food",
  },
  {
    id: "drink",
    label: "Bebidas",
    description: "Water, coffee, wine",
  },
  {
    id: "music",
    label: "Música",
    description: "Instrumentos e termos musicais",
  },
  {
    id: "transport",
    label: "Transporte",
    description: "Carros, bicicletas, aviões, barcos",
  },
  {
    id: "taste",
    label: "Sabor",
    description: "Sabor/qualidade dos alimentos, como succulent, bitter, spicy",
  },
  {
    id: "health",
    label: "Saúde",
    description: "Enjoado, queasy, nauseated, fatigued",
  },
  {
    id: "personality",
    label: "Personalidade",
    description: "Stubborn, timid, cheerful",
  },
  {
    id: "objects",
    label: "Objetos",
    description: "Objetos físicos e materiais, como rope, rope, string, wire",
  },
  {
    id: "sports",
    label: "Desportos",
    description:
      "Desportos e atividades físicas, como football, basketball, swimming",
  },
  {
    id: "miscellaneous",
    label: "Miscellaneous",
    description:
      "Outros tipos de palavras que não se encaixam nas categorias acima",
  },
];
