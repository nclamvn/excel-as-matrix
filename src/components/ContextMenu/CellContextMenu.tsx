import React, { useRef, useEffect, useState } from 'react';

interface CellContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: string) => void;
}

export const CellContextMenu: React.FC<CellContextMenuProps> = ({
  x,
  y,
  onClose,
  onAction,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const newX = x + rect.width > window.innerWidth ? x - rect.width : x;
      const newY = y + rect.height > window.innerHeight ? y - rect.height : y;
      setPosition({ x: newX, y: newY });
    }
  }, [x, y]);

  const handleAction = (action: string) => {
    onAction(action);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border rounded-lg shadow-xl py-1 min-w-48"
      style={{ left: position.x, top: position.y }}
    >
      <MenuItem
        icon={<ScissorsIcon />}
        label="Cut"
        shortcut="Ctrl+X"
        onClick={() => handleAction('CUT')}
      />
      <MenuItem
        icon={<CopyIcon />}
        label="Copy"
        shortcut="Ctrl+C"
        onClick={() => handleAction('COPY')}
      />
      <MenuItem
        icon={<ClipboardIcon />}
        label="Paste"
        shortcut="Ctrl+V"
        onClick={() => handleAction('PASTE')}
      />
      <MenuItem
        label="Paste Special..."
        shortcut="Ctrl+Shift+V"
        onClick={() => handleAction('PASTE_SPECIAL')}
        indent
      />

      <Divider />

      <SubMenu label="Insert" icon={<PlusIcon />}>
        <MenuItem label="Insert cells..." onClick={() => handleAction('INSERT_CELLS')} />
        <MenuItem label="Insert row above" onClick={() => handleAction('INSERT_ROW_ABOVE')} />
        <MenuItem label="Insert row below" onClick={() => handleAction('INSERT_ROW_BELOW')} />
        <MenuItem label="Insert column left" onClick={() => handleAction('INSERT_COL_LEFT')} />
        <MenuItem label="Insert column right" onClick={() => handleAction('INSERT_COL_RIGHT')} />
      </SubMenu>

      <MenuItem icon={<TrashIcon />} label="Delete..." onClick={() => handleAction('DELETE_CELLS')} />
      <MenuItem
        label="Clear contents"
        shortcut="Delete"
        onClick={() => handleAction('CLEAR_CONTENTS')}
      />

      <Divider />

      <MenuItem
        icon={<PaintBucketIcon />}
        label="Format cells..."
        shortcut="Ctrl+1"
        onClick={() => handleAction('FORMAT_CELLS')}
      />

      <Divider />

      <MenuItem icon={<FilterIcon />} label="Filter" onClick={() => handleAction('FILTER')} />
      <MenuItem label="Sort A to Z" onClick={() => handleAction('SORT_ASC')} />
      <MenuItem label="Sort Z to A" onClick={() => handleAction('SORT_DESC')} />

      <Divider />

      <MenuItem
        icon={<LinkIcon />}
        label="Insert link..."
        shortcut="Ctrl+K"
        onClick={() => handleAction('INSERT_LINK')}
      />
      <MenuItem
        icon={<CommentIcon />}
        label="Insert comment"
        onClick={() => handleAction('INSERT_COMMENT')}
      />
    </div>
  );
};

interface MenuItemProps {
  icon?: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  indent?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  shortcut,
  onClick,
  disabled = false,
  indent = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full flex items-center justify-between px-3 py-1.5 text-sm
      ${disabled ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}
      ${indent ? 'pl-8' : ''}
    `}
  >
    <span className="flex items-center gap-2">
      {icon && <span className="w-4 h-4 text-gray-500">{icon}</span>}
      <span>{label}</span>
    </span>
    {shortcut && <span className="text-xs text-gray-400 ml-4">{shortcut}</span>}
  </button>
);

interface SubMenuProps {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

const SubMenu: React.FC<SubMenuProps> = ({ icon, label, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-gray-100">
        <span className="flex items-center gap-2">
          {icon && <span className="w-4 h-4 text-gray-500">{icon}</span>}
          <span>{label}</span>
        </span>
        <ArrowRightIcon />
      </button>

      {isOpen && (
        <div className="absolute left-full top-0 ml-0.5 bg-white border rounded-lg shadow-lg py-1 min-w-40">
          {children}
        </div>
      )}
    </div>
  );
};

const Divider: React.FC = () => <div className="my-1 border-t" />;

// Icons
const ScissorsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PaintBucketIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const CommentIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export default CellContextMenu;
