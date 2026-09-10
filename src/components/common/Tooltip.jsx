import React, { useState } from 'react';

// 轻量 hover/focus 气泡提示：无第三方依赖，仅用绝对定位 + 本地状态。
// content 为空时原样返回子节点，不额外包裹。
export default function Tooltip({ content, placement = 'top', align = 'center', children, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!content) return children;

  const posClass = placement === 'bottom'
    ? 'top-full mt-1.5'
    : 'bottom-full mb-1.5';
  // 盘面卡片是 overflow-hidden，居中气泡在靠边的触发元素上会被裁掉，故按位置选对齐方式
  const alignClass = {
    start: 'left-0',
    end: 'right-0',
    center: 'left-1/2 -translate-x-1/2'
  }[align] || 'left-1/2 -translate-x-1/2';

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
      tabIndex={0}
    >
      {children}
      {isOpen && (
        <span
          role="tooltip"
          className={`absolute z-30 ${alignClass} ${posClass} w-max max-w-[min(19rem,75vw)] px-2.5 py-2 rounded-lg bg-[#2D3330] text-white text-[11px] leading-relaxed font-normal text-left shadow-lg pointer-events-none whitespace-normal`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
