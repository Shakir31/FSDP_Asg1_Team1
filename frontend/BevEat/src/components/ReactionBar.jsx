import React from "react";
import "../ReactionBar.css";

const ReactionBar = ({ reactions, userReactions, onReact }) => {
  // Get sorted list of emojis with counts
  const reactionEntries = Object.entries(reactions || {})
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]); // Sort by count descending

  if (reactionEntries.length === 0) {
    return null; // Don't show anything if no reactions
  }

  return (
    <div className="reaction-bar">
      {reactionEntries.map(([emoji, count]) => {
        const isUserReacted = userReactions?.includes(emoji);

        return (
          <button
            key={emoji}
            className={`reaction-chip ${isUserReacted ? "user-reacted" : ""}`}
            onClick={() => onReact(emoji)}
            title={isUserReacted ? "Remove your reaction" : "React with this"}
          >
            <span className="reaction-emoji">{emoji}</span>
            <span className="reaction-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ReactionBar;
