import React from 'react';

interface UserItem {
  id: number;
  title: string;
  image: string;
}

interface ItemsGridProps {
  items: UserItem[];
  loading: boolean;
  onAddItem?: () => void;
}

export const ItemsGrid: React.FC<ItemsGridProps> = ({ items, loading, onAddItem }) => {
  if (loading) {
    return <div className="col-span-2 text-center py-8 text-gray-500">Loading items...</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.length > 0 ? (
        items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl p-2.5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="aspect-square bg-gray-100 rounded-xl mb-3 overflow-hidden">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm px-1 truncate">{item.title}</h3>
          </div>
        ))
      ) : (
        <div className="col-span-2 text-center py-8 text-gray-500">No items yet</div>
      )}
      {/* Add New Placeholder */}
      <div 
        onClick={onAddItem}
        className="aspect-[4/5] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors cursor-pointer"
      >
        <span className="text-4xl mb-2 font-light">+</span>
        <span className="text-xs font-bold">Add Item</span>
      </div>
    </div>
  );
};




