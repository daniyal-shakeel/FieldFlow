'use client';

import React, { useState } from 'react';
import { usePdfStore } from '@/store/usePdfStore';
import { useUser } from '@clerk/nextjs';
import { Star, X, MessageSquare, Check } from 'lucide-react';
import { API_BASE_URL } from '@/constants';

export const RatingToast: React.FC = () => {
  const { user } = useUser();
  const showRatingToast = usePdfStore(state => state.showRatingToast);
  const setShowRatingToast = usePdfStore(state => state.setShowRatingToast);
  const isDarkMode = usePdfStore(state => state.isDarkMode);

  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [ratingId, setRatingId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [step, setStep] = useState<'stars' | 'comment' | 'thankyou'>('stars');
  const [error, setError] = useState('');

  if (!showRatingToast) return null;

  const handleStarClick = async (stars: number) => {
    setRating(stars);
    setError('');
    
    try {
      const email = user?.primaryEmailAddress?.emailAddress || 'Guest';
      const clerkId = user?.id || null;

      const res = await fetch(`${API_BASE_URL}/api/pdf/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: stars,
          clerkId,
          email,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit rating');
      }

      const data = await res.json();
      setRatingId(data.rating_id);
      setStep('comment');
    } catch (err) {
      console.error(err);
      setError('Failed to record rating. Please try again.');
      setRating(null);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingId) return;

    setSubmittingComment(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/pdf/rate/${ratingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: comment.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit comment');
      }

      setStep('thankyou');
      setTimeout(() => {
        setShowRatingToast(false);
        setRating(null);
        setRatingId(null);
        setComment('');
        setStep('stars');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to save review. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleClose = () => {
    setShowRatingToast(false);
    setRating(null);
    setRatingId(null);
    setComment('');
    setStep('stars');
    setError('');
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] w-full max-w-sm px-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`p-5 rounded-xl border shadow-2xl backdrop-blur-md flex flex-col space-y-4 ${
        isDarkMode 
          ? 'bg-surface-1/95 border-hairline text-slate-200 shadow-black/80' 
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-200/50'
      }`}>
        <div className="flex items-center justify-between border-b border-hairline pb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Rate Your Experience</span>
          </span>
          <button
            onClick={handleClose}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isDarkMode ? 'hover:bg-surface-3 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded p-2 text-center">
            {error}
          </div>
        )}

        {step === 'stars' && (
          <div className="text-center py-2 space-y-3">
            <p className="text-xs text-ink-subtle">
              How would you rate your exported PDF?
            </p>
            <div className="flex justify-center items-center space-x-2.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const isLit = (hoverRating !== null ? hoverRating : rating || 0) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-none outline-none"
                  >
                    <Star
                      className={`w-6.5 h-6.5 ${
                        isLit 
                          ? 'fill-amber-400 text-amber-400' 
                          : isDarkMode ? 'text-slate-600' : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 'comment' && (
          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-subtle">
                Awesome! Leave a review (optional):
              </p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      (rating || 0) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you think..."
              rows={3}
              className={`w-full text-xs rounded-md p-2.5 outline-none border transition-all resize-none ${
                isDarkMode 
                  ? 'bg-surface-2 border-hairline focus:border-primary/50 text-slate-200' 
                  : 'bg-slate-50 border-slate-200 focus:border-primary/50 text-slate-800'
              }`}
            />
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className={`flex-1 py-1.5 rounded text-xs font-semibold uppercase tracking-wider border transition-colors cursor-pointer ${
                  isDarkMode 
                    ? 'border-hairline bg-surface-2 hover:bg-surface-3 text-slate-400 hover:text-white' 
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800'
                }`}
              >
                No thanks
              </button>
              <button
                type="submit"
                disabled={submittingComment}
                className="flex-1 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {submittingComment && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Submit
              </button>
            </div>
          </form>
        )}

        {step === 'thankyou' && (
          <div className="text-center py-6 flex flex-col items-center justify-center space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink">Thank you!</p>
              <p className="text-[10px] text-ink-subtle mt-0.5">Your feedback has been saved successfully.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
