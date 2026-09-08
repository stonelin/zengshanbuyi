import React from 'react';

export default function YaoLine({ 
  yinYang = '阳', 
  isMoving = false, 
  size = 'md', // 'sm' | 'md' | 'lg'
  compact = false 
}) {
  const isYang = yinYang === '阳';

  // 尺寸配置
  const sizeConfig = {
    sm: {
      height: 'h-1.5',
      width: compact ? 'w-10' : 'w-14',
      gap: 'gap-1',
      rounded: 'rounded-[1px]',
      symbolSize: 'text-[10px]'
    },
    md: {
      height: 'h-2 sm:h-2.5',
      width: compact ? 'w-14' : 'w-20 sm:w-24',
      gap: 'gap-1.5 sm:gap-2',
      rounded: 'rounded-[2px]',
      symbolSize: 'text-xs'
    },
    lg: {
      height: 'h-3',
      width: 'w-28 sm:w-32',
      gap: 'gap-2.5',
      rounded: 'rounded-xs',
      symbolSize: 'text-sm'
    }
  };

  const cfg = sizeConfig[size] || sizeConfig.md;

  // 颜色风格：动爻使用朱砂红高亮，静爻使用高级水墨深灰
  const barBg = isMoving
    ? 'bg-[#C0392B] shadow-[0_0_8px_rgba(192,57,43,0.4)]'
    : 'bg-[#2D3330]';

  return (
    <div className="inline-flex items-center gap-1.5 select-none">
      {isYang ? (
        // 阳爻：单一连续圆角矩形条
        <div 
          className={`${cfg.width} ${cfg.height} ${cfg.rounded} ${barBg} transition-all duration-200`}
        />
      ) : (
        // 阴爻：两段等宽、居中间隔圆角矩形条
        <div className={`flex items-center ${cfg.gap} ${cfg.width}`}>
          <div className={`flex-1 ${cfg.height} ${cfg.rounded} ${barBg} transition-all duration-200`} />
          <div className={`flex-1 ${cfg.height} ${cfg.rounded} ${barBg} transition-all duration-200`} />
        </div>
      )}

      {/* 动爻动变标记 (◯ / ✕) */}
      {isMoving && (
        <span className={`font-bold font-mono text-[#C0392B] ${cfg.symbolSize} animate-cinnabar-pulse`}>
          {isYang ? '◯' : '✕'}
        </span>
      )}
    </div>
  );
}
