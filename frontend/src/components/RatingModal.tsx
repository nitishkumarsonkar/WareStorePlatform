'use client';

import React, { useState } from 'react';
import { StarRatingInput } from './StarRatingInput';
import { api } from '../lib/api';
import { MessageSquare, Send, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface RatingModalProps {
  bidId: string;
  targetName: string;       // Name of the person being rated
  targetRole: 'builder' | 'vendor'; // Who is being rated
  onClose: () => void;
  onSubmitted: () => void;
}

export function RatingModal({ bidId, targetName, targetRole, onClose, onSubmitted }: RatingModalProps) {
  const [score, setScore] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) {
      setError('Please select a star rating.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.submitRating({
        bidId,
        score,
        review: review.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onSubmitted();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
              Rate & Review
            </span>
            <h3 className="text-lg font-bold mt-0.5">
              {targetRole === 'vendor' ? 'Rate Vendor' : 'Rate Builder'}: {targetName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-slate-900">Rating Submitted!</h4>
              <p className="text-xs text-slate-500">
                Thank you for your feedback. The {targetRole}&apos;s profile score has been updated.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Star Rating */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Your Rating <span className="text-red-500">*</span>
                </label>
                <StarRatingInput value={score} onChange={setScore} size="lg" />
              </div>

              {/* Review Text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Written Review (Optional)
                  </label>
                  <span className={`text-[10px] font-mono ${review.length > 500 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                    {review.length}/500
                  </span>
                </div>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder={
                    targetRole === 'vendor'
                      ? 'Share your experience with this vendor — product quality, delivery, communication...'
                      : 'Share your experience with this builder — payment timeliness, site readiness...'
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || score === 0}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Submitting...' : 'Submit Rating'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
