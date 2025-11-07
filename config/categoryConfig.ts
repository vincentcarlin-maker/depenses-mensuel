import React from 'react';
import { Category } from '../types';
import DocumentIcon from '../components/icons/DocumentIcon';
import FuelIcon from '../components/icons/FuelIcon';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import FireIcon from '../components/icons/FireIcon';
import WrenchIcon from '../components/icons/WrenchIcon';
import RestaurantIcon from '../components/icons/RestaurantIcon';
import GiftIcon from '../components/icons/GiftIcon';

export const CategoryConfig: Record<Category, { icon: React.FC; bgColor: string; iconColor: string; }> = {
    [Category.Mandatory]: { icon: DocumentIcon, bgColor: 'bg-slate-100 dark:bg-slate-700', iconColor: 'text-slate-500 dark:text-slate-300' },
    [Category.Fuel]: { icon: FuelIcon, bgColor: 'bg-orange-100 dark:bg-orange-900', iconColor: 'text-orange-500 dark:text-orange-400' },
    [Category.Groceries]: { icon: ShoppingCartIcon, bgColor: 'bg-green-100 dark:bg-green-900', iconColor: 'text-green-500 dark:text-green-400' },
    [Category.Heating]: { icon: FireIcon, bgColor: 'bg-red-100 dark:bg-red-900', iconColor: 'text-red-500 dark:text-red-400' },
    [Category.CarRepair]: { icon: WrenchIcon, bgColor: 'bg-indigo-100 dark:bg-indigo-900', iconColor: 'text-indigo-500 dark:text-indigo-400' },
    [Category.Restaurant]: { icon: RestaurantIcon, bgColor: 'bg-pink-100 dark:bg-pink-900', iconColor: 'text-pink-500 dark:text-pink-400' },
    [Category.Misc]: { icon: GiftIcon, bgColor: 'bg-purple-100 dark:bg-purple-900', iconColor: 'text-purple-500 dark:text-purple-400' },
};
