import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import './QuoteOfTheDay.css';

const QuoteOfTheDay = () => {
  const [user] = useAuthState(auth);
  const [quote, setQuote] = useState('The only way to do great work is to love what you do.');
  const [newQuote, setNewQuote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch the current quote
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // Check if Firestore is available
        if (!db) {
          console.error('Firestore not initialized');
          setError(true);
          setLoading(false);
          return;
        }
        
        const quoteDoc = await getDoc(doc(db, 'settings', 'quoteOfTheDay'));
        if (quoteDoc.exists()) {
          const quoteData = quoteDoc.data();
          if (quoteData && quoteData.text) {
            setQuote(quoteData.text);
            setNewQuote(quoteData.text);
          }
        } else {
          // Create a default quote if none exists
          const defaultQuote = 'The only way to do great work is to love what you do.';
          try {
            await setDoc(doc(db, 'settings', 'quoteOfTheDay'), {
              text: defaultQuote,
              updatedAt: new Date(),
              updatedBy: user ? user.uid : 'system'
            });
            console.log('Created default quote');
          } catch (createError) {
            console.error('Error creating default quote:', createError);
            // Continue with default quote in state
          }
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
        setError(true);
        // Don't show toast error to avoid annoying users
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [user]);

  // Handle quote update
  const handleUpdateQuote = async (e) => {
    e.preventDefault();
    if (!newQuote.trim()) {
      toast.error('Quote cannot be empty');
      return;
    }

    try {
      if (!user) {
        toast.error('You must be logged in to update the quote');
        return;
      }
      
      await setDoc(doc(db, 'settings', 'quoteOfTheDay'), {
        text: newQuote.trim(),
        updatedAt: new Date(),
        updatedBy: user.uid,
      });
      setQuote(newQuote.trim());
      toast.success('Quote updated successfully');
    } catch (error) {
      console.error('Error updating quote:', error);
      toast.error('Failed to update quote');
    }
  };

  return (
    <div className="quote-container">
      <div className="section-title">Quote of the Day</div>
      {loading ? (
        <div className="quote-loading">Loading...</div>
      ) : error ? (
        <div className="quote-text">{quote}</div>
      ) : (
        <>
          {user ? (
            <form onSubmit={handleUpdateQuote} className="quote-form">
              <textarea
                value={newQuote}
                onChange={(e) => setNewQuote(e.target.value)}
                placeholder="Enter a quote"
                className="quote-input"
                rows={3}
              />
              <button type="submit" className="quote-update-btn">
                Update
              </button>
            </form>
          ) : (
            <div className="quote-text">{quote}</div>
          )}
        </>
      )}
    </div>
  );
};

export default QuoteOfTheDay; 