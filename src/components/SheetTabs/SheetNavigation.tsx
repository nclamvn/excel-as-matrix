import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface SheetNavigationProps {
  onFirst?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onLast?: () => void;
}

export const SheetNavigation: React.FC<SheetNavigationProps> = ({
  onFirst,
  onPrev,
  onNext,
  onLast,
}) => {
  return (
    <div className="sheet-navigation">
      <button onClick={onFirst} title="First Sheet">
        <ChevronsLeft className="w-4 h-4" />
      </button>
      <button onClick={onPrev} title="Previous Sheet">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button onClick={onNext} title="Next Sheet">
        <ChevronRight className="w-4 h-4" />
      </button>
      <button onClick={onLast} title="Last Sheet">
        <ChevronsRight className="w-4 h-4" />
      </button>
    </div>
  );
};
