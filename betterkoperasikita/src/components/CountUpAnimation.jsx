import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/format';

const CountUpAnimation = ({ value, duration = 2500 }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTimestamp = null;
        const startValue = 0; // Always start from 0 for the "load" effect
        const endValue = parseFloat(value) || 0;

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Ease out Quart: 1 - pow(1 - x, 4) -- smoother slowdown than Cubic
            const ease = 1 - Math.pow(1 - progress, 4);

            const current = startValue + (endValue - startValue) * ease;
            setDisplayValue(current);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }, [value, duration]);

    return <>{formatCurrency(displayValue)}</>;
};

export default CountUpAnimation;
