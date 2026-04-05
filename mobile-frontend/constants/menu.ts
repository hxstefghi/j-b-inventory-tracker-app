/**
 * Menu Items & Raw Inventory Configuration
 * 
 * Contains all JB Chicken menu items with their ingredient recipes,
 * and raw inventory items with unit prices.
 */

/**
 * Menu category types for organizing POS entry
 */
export type MenuCategory = 
  | 'meals_with_rice'
  | 'ala_carte'
  | 'assorted'
  | 'combos'
  | 'chicken_skin'
  | 'extras'
  | 'drinks';

/**
 * Menu category configuration for display
 */
export interface MenuCategoryConfig {
  id: MenuCategory;
  label: string;
  icon: string;
}

export const MENU_CATEGORIES: MenuCategoryConfig[] = [
  { id: 'meals_with_rice', label: 'Meals with Rice', icon: 'restaurant' },
  { id: 'ala_carte', label: 'Ala Carte', icon: 'restaurant' },
  { id: 'assorted', label: 'Assorted Parts', icon: 'category' },
  { id: 'combos', label: 'Combo Meals', icon: 'star' },
  { id: 'chicken_skin', label: 'Chicken Skin', icon: 'info' },
  { id: 'extras', label: 'Extras', icon: 'add' },
  { id: 'drinks', label: 'Drinks', icon: 'info' },
];

/**
 * Raw inventory item configuration
 * Separate items for different portion sizes (60g/120g skin, 1oz/3oz gravy)
 */
export interface RawInventoryConfig {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  sortOrder: number;
}

export const RAW_INVENTORY_ITEMS: RawInventoryConfig[] = [
  { id: 'chicken', name: 'Chicken', unit: 'pcs', unitPrice: 0, sortOrder: 1 },
  { id: 'chicken_skin_60g', name: 'Chicken Skin 60g', unit: 'pcs', unitPrice: 50, sortOrder: 2 },
  { id: 'chicken_skin_120g', name: 'Chicken Skin 120g', unit: 'pcs', unitPrice: 100, sortOrder: 3 },
  { id: 'rice', name: 'Rice', unit: 'servings', unitPrice: 20, sortOrder: 4 },
  { id: 'gravy_1oz', name: 'Gravy 1oz', unit: 'servings', unitPrice: 15, sortOrder: 5 },
  { id: 'gravy_3oz', name: 'Gravy 3oz', unit: 'servings', unitPrice: 30, sortOrder: 6 },
  { id: 'water', name: 'Water', unit: 'bottles', unitPrice: 15, sortOrder: 7 },
  { id: 'coke_mismo', name: 'Coke Mismo', unit: 'bottles', unitPrice: 25, sortOrder: 8 },
  { id: 'coke_1_5l', name: 'Coke 1.5L', unit: 'bottles', unitPrice: 0, sortOrder: 9 },
  { id: 'spicy_sauce', name: 'Spicy Sauce', unit: 'servings', unitPrice: 5, sortOrder: 10 },
];

/**
 * Menu item with ingredient recipe
 * Maps each menu item to how many raw inventory items it consumes
 */
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: MenuCategory;
  recipe: {
    chicken?: number;
    chicken_skin_60g?: number;
    chicken_skin_120g?: number;
    rice?: number;
    gravy_1oz?: number;
    gravy_3oz?: number;
    water?: number;
    coke_mismo?: number;
    coke_1_5l?: number;
    spicy_sauce?: number;
  };
  sortOrder: number;
}

export const MENU_ITEMS: MenuItem[] = [
  // ===== MEALS WITH RICE =====
  // Note: Rice in meals is NOT tracked in inventory (only Extra Rice is tracked)
  {
    id: '1pc_chicken_rice',
    name: '1 pc Chicken w/ Rice',
    price: 70,
    category: 'meals_with_rice',
    recipe: { chicken: 1 },
    sortOrder: 1,
  },
  {
    id: '2pc_chicken_rice',
    name: '2 pc Chicken w/ Rice',
    price: 115,
    category: 'meals_with_rice',
    recipe: { chicken: 2 },
    sortOrder: 2,
  },
  
  // ===== ALA CARTE =====
  {
    id: '1pc_chicken_ala_carte',
    name: '1 pc Chicken Ala Carte',
    price: 50,
    category: 'ala_carte',
    recipe: { chicken: 1 },
    sortOrder: 3,
  },
  {
    id: '2pc_chicken_ala_carte',
    name: '2 pc Chicken Ala Carte',
    price: 95,
    category: 'ala_carte',
    recipe: { chicken: 2 },
    sortOrder: 4,
  },
  
  // ===== ASSORTED PARTS =====
  {
    id: '4pcs_assorted',
    name: '4 pcs Assorted Parts',
    price: 190,
    category: 'assorted',
    recipe: { chicken: 4 },
    sortOrder: 5,
  },
  {
    id: '6pcs_assorted',
    name: '6 pcs Assorted Parts',
    price: 285,
    category: 'assorted',
    recipe: { chicken: 6 },
    sortOrder: 6,
  },
  {
    id: '8pcs_assorted',
    name: '8 pcs Assorted Parts',
    price: 380,
    category: 'assorted',
    recipe: { chicken: 8 },
    sortOrder: 7,
  },
  
  // ===== COMBO MEALS =====
  // Note: Coke in combo meals is NOT tracked in inventory calculation
  // Rice in combos is NOT tracked in inventory (only Extra Rice is tracked)
  // Individual Coke Mismo orders are tracked separately
  {
    id: 'jb_fantastic_4',
    name: 'JB Fantastic 4',
    price: 260,
    category: 'combos',
    recipe: { chicken: 4 },
    sortOrder: 8,
  },
  {
    id: 'jb_winner_winner',
    name: 'JB Winner Winner',
    price: 510,
    category: 'combos',
    recipe: { chicken: 8 },
    sortOrder: 9,
  },
  
  // ===== CHICKEN SKIN =====
  {
    id: 'chicken_skin_60g',
    name: 'Chicken Skin 60g',
    price: 50,
    category: 'chicken_skin',
    recipe: { chicken_skin_60g: 1 },
    sortOrder: 10,
  },
  {
    id: 'chicken_skin_120g',
    name: 'Chicken Skin 120g',
    price: 100,
    category: 'chicken_skin',
    recipe: { chicken_skin_120g: 1 },
    sortOrder: 11,
  },
  
  // ===== EXTRAS =====
  {
    id: 'extra_rice',
    name: 'Extra Rice',
    price: 20,
    category: 'extras',
    recipe: { rice: 1 },
    sortOrder: 12,
  },
  {
    id: 'extra_gravy_1oz',
    name: 'Extra Gravy 1oz',
    price: 15,
    category: 'extras',
    recipe: { gravy_1oz: 1 },
    sortOrder: 13,
  },
  {
    id: 'extra_gravy_3oz',
    name: 'Extra Gravy 3oz',
    price: 30,
    category: 'extras',
    recipe: { gravy_3oz: 1 },
    sortOrder: 14,
  },
  {
    id: 'spicy_sauce',
    name: 'Spicy Sauce',
    price: 5,
    category: 'extras',
    recipe: { spicy_sauce: 1 },
    sortOrder: 15,
  },
  
  // ===== DRINKS =====
  // Individual Coke Mismo orders are tracked in inventory
  {
    id: 'coke_mismo',
    name: 'Coke Mismo',
    price: 25,
    category: 'drinks',
    recipe: { coke_mismo: 1 },
    sortOrder: 16,
  },
  {
    id: 'bottle_water',
    name: 'Bottle Water',
    price: 15,
    category: 'drinks',
    recipe: { water: 1 },
    sortOrder: 17,
  },
];

/**
 * Get menu items by category
 */
export function getMenuItemsByCategory(category: MenuCategory): MenuItem[] {
  return MENU_ITEMS
    .filter(item => item.category === category)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Calculate raw inventory usage from POS sales
 * @param sales Array of { menuItemId, quantity } representing sold items
 * @returns Object with raw inventory item IDs and their total quantities used
 */
export function calculateRawInventoryFromSales(
  sales: { menuItemId: string; quantity: number }[]
): Record<string, number> {
  const totals: Record<string, number> = {
    chicken: 0,
    chicken_skin_60g: 0,
    chicken_skin_120g: 0,
    rice: 0,
    gravy_1oz: 0,
    gravy_3oz: 0,
    water: 0,
    coke_mismo: 0,
    coke_1_5l: 0,
    spicy_sauce: 0,
  };

  for (const sale of sales) {
    const menuItem = MENU_ITEMS.find(item => item.id === sale.menuItemId);
    if (!menuItem) continue;

    for (const [ingredient, qty] of Object.entries(menuItem.recipe)) {
      if (qty && totals[ingredient] !== undefined) {
        totals[ingredient] += qty * sale.quantity;
      }
    }
  }

  return totals;
}

/**
 * Get raw inventory item by ID
 */
export function getRawInventoryItem(id: string): RawInventoryConfig | undefined {
  return RAW_INVENTORY_ITEMS.find(item => item.id === id);
}

/**
 * Get menu item by ID
 */
export function getMenuItem(id: string): MenuItem | undefined {
  return MENU_ITEMS.find(item => item.id === id);
}
