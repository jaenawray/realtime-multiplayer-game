import { useState } from "react";
import "./AvatarGallery.css";
import { AVATAR_LIBRARY } from "./avatarLibrary";

interface AvatarGalleryProps {
  onSelect: (avatarUrl: string) => void;
  selectedAvatar?: string;
}

export default function AvatarGallery({ onSelect, selectedAvatar }: AvatarGalleryProps) {
  const [error, setError] = useState<string | null>(null);

  const handleImageError = () => {
    setError("Failed to load avatar. Please try again.");
  };

  return (
    <div className="avatar-gallery-container">
      <h4>Select a profile picture</h4>
      {error && <p className="error-message">{error}</p>}
      <div className="avatar-gallery">
        {AVATAR_LIBRARY.map((avatarUrl) => (
          <button
            type="button"
            key={avatarUrl}
            className={`avatar-item ${selectedAvatar === avatarUrl ? "selected" : ""}`}
            onClick={() => {
              onSelect(avatarUrl);
              setError(null);
            }}
            aria-pressed={selectedAvatar === avatarUrl}
            aria-label={`Select avatar ${avatarUrl}`}
          >
            <img src={avatarUrl} alt="Avatar option" onError={handleImageError} />
          </button>
        ))}
      </div>
    </div>
  );
}
