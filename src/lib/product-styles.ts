export interface ProductStyle {
    bg: string;
    iconColor: string;
}

export const productStyles: ProductStyle[] = [
    { bg: 'bg-[#fff5f5]', iconColor: 'text-red-500' },
    { bg: 'bg-[#f0f9ff]', iconColor: 'text-sky-500' },
    { bg: 'bg-[#f0fdf4]', iconColor: 'text-emerald-500' },
    { bg: 'bg-[#fefce8]', iconColor: 'text-yellow-500' },
    { bg: 'bg-[#faf5ff]', iconColor: 'text-purple-500' },
    { bg: 'bg-[#fff7ed]', iconColor: 'text-orange-500' },
    { bg: 'bg-[#f5f3ff]', iconColor: 'text-indigo-500' },
    { bg: 'bg-[#ecfeff]', iconColor: 'text-cyan-500' },
];

export function getProductStyle(id: string | number): ProductStyle {
    const index = typeof id === 'number' ? id : id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return productStyles[index % productStyles.length];
}
