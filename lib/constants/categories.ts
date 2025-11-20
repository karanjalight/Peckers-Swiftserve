// Category and subcategory definitions for the e-commerce platform

export interface CategoryConfig {
  value: string;
  label: string;
  subcategories: { value: string; label: string }[];
}

export const CATEGORIES: CategoryConfig[] = [
  {
    value: 'books',
    label: 'Books',
    subcategories: [
      { value: 'international', label: 'International' },
      { value: 'cbc', label: 'CBC' },
    ],
  },
  {
    value: 'stationery',
    label: 'Stationery',
    subcategories: [
      { value: 'art-and-crafts', label: 'Art and Crafts' },
      { value: 'office', label: 'Office' },
      { value: 'school', label: 'School' },
    ],
  },
  {
    value: 'lab equipments',
    label: 'Lab Equipments',
    subcategories: [
      { value: 'equipments', label: 'Equipments' },
      { value: 'glassware', label: 'Glassware' },
    ],
  },
  {
    value: 'computer accessories',
    label: 'Computer Accessories',
    subcategories: [
      { value: 'accessories', label: 'Accessories' },
      { value: 'laptops', label: 'Laptops' },
      { value: 'printers', label: 'Printers' },
    ],
  },
  {
    value: 'kids bestsellers',
    label: 'Kids Bestsellers',
    subcategories: [],
  },
];

// Helper function to get subcategories for a category
export function getSubcategories(categoryValue: string): { value: string; label: string }[] {
  const category = CATEGORIES.find((cat) => cat.value.toLowerCase() === categoryValue.toLowerCase());
  return category?.subcategories || [];
}

// Helper function to get category label
export function getCategoryLabel(categoryValue: string): string {
  const category = CATEGORIES.find((cat) => cat.value.toLowerCase() === categoryValue.toLowerCase());
  return category?.label || categoryValue;
}

// Helper function to get subcategory label
export function getSubcategoryLabel(categoryValue: string, subcategoryValue: string): string {
  const subcategories = getSubcategories(categoryValue);
  const subcategory = subcategories.find(
    (sub) => sub.value.toLowerCase() === subcategoryValue.toLowerCase()
  );
  return subcategory?.label || subcategoryValue;
}


