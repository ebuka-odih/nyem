import { 
  Globe, 
  Star, 
  Smartphone, 
  Shirt, 
  Home, 
  Dumbbell, 
  Sparkles, 
  Gamepad2, 
  Book, 
  Car, 
  Leaf, 
  Activity, 
  Dog,
  LucideIcon
} from 'lucide-react';

/**
 * Maps category names to their corresponding icons
 * Used when displaying categories fetched from the backend
 */
export const getCategoryIcon = (categoryName: string): LucideIcon => {
  const name = categoryName.toLowerCase().trim();
  
  // Map category names to icons
  const iconMap: Record<string, LucideIcon> = {
    'all': Globe,
    'accessories': Star,
    'electronics': Smartphone,
    'fashion': Shirt,
    'clothing': Shirt,
    'home & decor': Home,
    'home': Home,
    'decor': Home,
    'sports & fitness': Dumbbell,
    'sports': Dumbbell,
    'fitness': Dumbbell,
    'beauty & care': Sparkles,
    'beauty': Sparkles,
    'care': Sparkles,
    'toys & games': Gamepad2,
    'toys': Gamepad2,
    'games': Gamepad2,
    'books & media': Book,
    'books': Book,
    'media': Book,
    'automotive': Car,
    'vehicles': Car,
    'garden & outdoor': Leaf,
    'garden': Leaf,
    'outdoor': Leaf,
    'health & wellness': Activity,
    'health': Activity,
    'wellness': Activity,
    'pet supplies': Dog,
    'pets': Dog,
  };
  
  // Try exact match first
  if (iconMap[name]) {
    return iconMap[name];
  }
  
  // Try partial matches
  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key) || key.includes(name)) {
      return icon;
    }
  }
  
  // Default icon if no match found
  return Globe;
};

