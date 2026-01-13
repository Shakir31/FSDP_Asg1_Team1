import React, { useEffect, useRef } from "react";
import "../EmojiReactionPicker.css";

const EMOJIS = [
  { emoji: "👍", label: "Helpful" },
  { emoji: "❤️", label: "Love" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "😂", label: "Funny" },
  { emoji: "🤤", label: "Delicious" },
  { emoji: "👏", label: "Well done" },
];

const EmojiReactionPicker = ({ position, onReact, onClose }) => {
  const pickerRef = useRef(null);

  useEffect(() => {
    // Close on click outside
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Close on ESC key
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Adjust position if near screen edge
  const getPickerStyle = () => {
    const style = {
      left: position.x,
      top: position.y,
    };

    // If too close to right edge, flip left
    if (position.x > window.innerWidth - 250) {
      style.left = position.x - 240;
    }

    // If too close to bottom edge, flip up
    if (position.y > window.innerHeight - 100) {
      style.top = position.y - 80;
    }

    return style;
  };

  return (
    <div ref={pickerRef} className="emoji-picker" style={getPickerStyle()}>
      {EMOJIS.map(({ emoji, label }) => (
        <button
          key={emoji}
          className="emoji-button"
          onClick={() => onReact(emoji)}
          title={label}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmojiReactionPicker;
