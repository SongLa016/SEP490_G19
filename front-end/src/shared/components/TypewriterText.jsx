import React, { useState, useEffect, useRef } from 'react';

const TypewriterText = ({
    text,
    speed = 50,
    delay = 0,
    className = "",
    onComplete,
    cursor = true,
    cursorChar = "|"
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [showCursor, setShowCursor] = useState(true);
    const timeoutRef = useRef(null);
    const cursorIntervalRef = useRef(null);
    const previousTextRef = useRef('');

    useEffect(() => {
        // Reset when text changes
        if (previousTextRef.current !== text) {
            setDisplayedText('');
            previousTextRef.current = text;
        }

        // Clear any existing timeouts
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (cursorIntervalRef.current) {
            clearInterval(cursorIntervalRef.current);
        }

        // Start cursor blinking immediately
        if (cursor) {
            cursorIntervalRef.current = setInterval(() => {
                setShowCursor(prev => !prev);
            }, 530);
        }

        // Start typing after delay
        const startTyping = () => {
            let currentIndex = 0;

            const typeNextChar = () => {
                if (currentIndex < text.length) {
                    setDisplayedText(text.slice(0, currentIndex + 1));
                    currentIndex++;
                    timeoutRef.current = setTimeout(typeNextChar, speed);
                } else {
                    if (onComplete) {
                        onComplete();
                    }
                }
            };

            typeNextChar();
        };

        const delayTimeout = setTimeout(startTyping, delay);

        return () => {
            clearTimeout(delayTimeout);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (cursorIntervalRef.current) {
                clearInterval(cursorIntervalRef.current);
            }
        };
    }, [text, speed, delay, cursor, onComplete]);

    return (
        <span className={className}>
            {displayedText}
            {cursor && (
                <span
                    className={`inline-block ml-1 align-middle transition-opacity duration-300 ${showCursor ? 'opacity-100' : 'opacity-0'
                        }`}
                    style={{
                        fontFamily: 'monospace',
                        fontWeight: 'normal'
                    }}
                >
                    {cursorChar}
                </span>
            )}
        </span>
    );
};

export default TypewriterText;

