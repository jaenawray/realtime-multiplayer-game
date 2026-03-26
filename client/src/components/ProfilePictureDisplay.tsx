import { useState } from "react";
import "./ProfilePictureDisplay.css";
import { DEFAULT_AVATAR } from "./avatarLibrary";

interface ProfilePictureDisplayProps {
  avatarUrl?: string;
  displayName: string;
  size?: "tiny" | "small" | "medium" | "large";
}

export default function ProfilePictureDisplay({
  avatarUrl,
  displayName,
  size = "medium",
}: ProfilePictureDisplayProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  // Use the provided avatar URL, or fall back to default if not provided or if image fails to load
  const imageUrl = imageError || !avatarUrl ? DEFAULT_AVATAR : avatarUrl;

  return (
    <div className={`profile-picture-display ${size}`}>
      <img
        src={imageUrl}
        alt={`${displayName}'s profile picture`}
        onError={handleImageError}
        className="profile-picture-image"
      />
    </div>
  );
}
