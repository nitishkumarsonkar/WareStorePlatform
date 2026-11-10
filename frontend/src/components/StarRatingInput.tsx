'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingInputProps {
  value: number;
  onChange: (score: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export function StarRatingInput({ value, onChange, size = 'md', readOnly = false }: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value;

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange(star)}
            onMouseEnter={() => !readOnly && setHoverValue(star)}
            onMouseLeave={() => !readOnly && setHoverValue(0)}
            className={`transition-transform ${
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
            title={labels[star]}
          >
            <Star
              className={`${sizeMap[size]} transition-colors ${
                isFilled
                  ? 'fill-amber-400 stroke-amber-400'
                  : 'fill-transparent stroke-slate-300'
              }`}
            />
          </button>
        );
      })}
      {displayValue > 0 && (
        <span className="ml-2 text-xs font-bold text-slate-600">
          {displayValue}/5 — {labels[displayValue]}
        </span>
      )}
    </div>
  );
}
