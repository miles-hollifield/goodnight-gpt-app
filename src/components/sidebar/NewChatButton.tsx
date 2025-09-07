"use client";

interface NewChatButtonProps {
  onClick: () => void;
  collapsed?: boolean;
}

export function NewChatButton({ onClick, collapsed = false }: NewChatButtonProps) {
  const base = '#CC0000';
  const hover = '#B30000';
  const active = '#990000';
  const text = '#FFFFFF';
  const currentBg = base;
  let isMouseDown = false;

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isMouseDown) e.currentTarget.style.backgroundColor = hover;
  };
  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    isMouseDown = false;
    e.currentTarget.style.backgroundColor = base;
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    isMouseDown = true;
    e.currentTarget.style.backgroundColor = active;
  };
  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    isMouseDown = false;
    e.currentTarget.style.backgroundColor = hover;
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-3 text-sm rounded-lg transition-colors select-none cursor-pointer"
      style={{ backgroundColor: currentBg, color: text, border: `1px solid ${active}` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      aria-label="New chat"
      title={collapsed ? 'New chat' : undefined}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 4C12.5523 4 13 4.44772 13 5V11H19C19.5523 11 20 11.4477 20 12C20 12.5523 19.5523 13 19 13H13V19C13 19.5523 12.5523 20 12 20C11.4477 20 11 19.5523 11 19V13H5C4.44772 13 4 12.5523 4 12C4 11.4477 4.44772 11 5 11H11V5C11 4.44772 11.4477 4 12 4Z"
          fill="currentColor"
        />
      </svg>
      <span
        className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
          collapsed ? 'opacity-0 -translate-x-1 w-0 max-w-0' : 'opacity-100 translate-x-0 w-auto max-w-[10rem]'
        }`}
      >
        New chat
      </span>
    </button>
  );
}
