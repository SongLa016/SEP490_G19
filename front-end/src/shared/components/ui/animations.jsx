import React from 'react';

// Fade In Animation
export function FadeIn({ children, delay = 0, duration = 0.5, className = "" }) {
  return (
    <div
      className={`animate-fade-in-up ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}s`,
      }}
    >
      {children}
    </div>
  );
}

// Slide In Animation
export function SlideIn({ children, direction = "up", delay = 0, duration = 0.5, className = "" }) {
  const directionClasses = {
    up: 'animate-fade-in-up',
    down: 'animate-fade-in-down',
    left: 'animate-slide-fade-in',
    right: 'animate-slide-fade-in',
  };

  return (
    <div
      className={`${directionClasses[direction] || directionClasses.up} ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}s`,
      }}
    >
      {children}
    </div>
  );
}

// Scale In Animation
export function ScaleIn({ children, delay = 0, duration = 0.3, className = "" }) {
  return (
    <div
      className={`animate-scale-in ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}s`,
      }}
    >
      {children}
    </div>
  );
}

// Stagger Container - for animating children with staggered delays
export function StaggerContainer({ children, staggerDelay = 100, className = "" }) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            style: {
              ...child.props.style,
              animationDelay: `${index * staggerDelay}ms`,
            },
            className: `animate-in fade-in slide-in-from-bottom-4 duration-500 ${child.props.className || ''}`,
          });
        }
        return child;
      })}
    </div>
  );
}

// Hover Scale Animation Wrapper
export function HoverScale({ children, scale = 1.05, className = "" }) {
  return (
    <div
      className={`transition-transform duration-300 hover:scale-${scale} ${className}`}
      style={{
        transform: 'scale(1)',
      }}
    >
      {children}
    </div>
  );
}

// Pulse Animation
export function Pulse({ children, className = "" }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  );
}

// Bounce Animation
export function Bounce({ children, className = "" }) {
  return (
    <div className={`animate-bounce ${className}`}>
      {children}
    </div>
  );
}

// Shimmer Effect (for loading skeletons)
export function Shimmer({ className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

