import React, { useState } from "react";
import useLoginContext from "./useLoginContext.ts";
import useAuth from "./useAuth.ts";
import { updateUser } from "../services/userService.ts";
import type { ProfileVisibility, UserUpdateRequest } from "@gamenite/shared";
import { DEFAULT_AVATAR } from "../components/avatarLibrary";

const BIO_MAX_LENGTH = 500;

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Return shape of {@link useEditProfileForm} — exported so callers get stable, named types. */
export interface EditProfileFormResult {
  display: string;
  setDisplay: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirm: string;
  setConfirm: (value: string) => void;
  avatar: string;
  setAvatar: (url: string) => void;
  bio: string;
  setBio: (value: string) => void;
  bioMaxLength: number;
  profileVisibility: "public" | "friends-only";
  setProfileVisibility: (value: "public" | "friends-only") => void;
  twitterLink: string;
  setTwitterLink: (value: string) => void;
  instagramLink: string;
  setInstagramLink: (value: string) => void;
  discordLink: string;
  setDiscordLink: (value: string) => void;
  err: string | null;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

/**
 * Custom hook to manage profile form logic
 * @returns an object containing
 *  - Form values `display`, `password`, `confirm`, `avatar`, `bio`, `profileVisibility`, and social URL fields
 *  - Matching setters and `bioMaxLength`
 *  - Possibly-null error message `err`
 *  - Submission handler `handleSubmit`
 */
export default function useEditProfileForm(): EditProfileFormResult {
  const { user, reset } = useLoginContext();
  const [display, setDisplay] = useState(user.display);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [avatar, setAvatar] = useState<string>(user.avatar ?? DEFAULT_AVATAR);
  const [bio, setBio] = useState(user.bio ?? "");
  const [twitterLink, setTwitterLink] = useState<string>(user.socialTwitter ?? "");
  const [instagramLink, setInstagramLink] = useState<string>(user.socialInstagram ?? "");
  const [discordLink, setDiscordLink] = useState<string>(user.socialDiscord ?? "");
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>(
    user.profileVisibility ?? "public",
  );
  const [err, setErr] = useState<null | string>(null);
  const auth = useAuth();

  /**
   * Handles submission of the form
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const hasDisplayChange = display !== user.display;
    const hasPasswordChange = password !== "" && password === confirm;
    const hasAvatarChange = avatar !== user.avatar;
    const hasBioChange = bio !== (user.bio ?? "");
    const hasVisibilityChange = profileVisibility !== (user.profileVisibility ?? "public");
    const tw = twitterLink.trim();
    const ig = instagramLink.trim();
    const dc = discordLink.trim();
    const hasSocialTwitterChange = tw !== (user.socialTwitter ?? "").trim();
    const hasSocialInstagramChange = ig !== (user.socialInstagram ?? "").trim();
    const hasSocialDiscordChange = dc !== (user.socialDiscord ?? "").trim();

    if (
      !hasDisplayChange &&
      !hasPasswordChange &&
      !hasAvatarChange &&
      !hasBioChange &&
      !hasVisibilityChange &&
      !hasSocialTwitterChange &&
      !hasSocialInstagramChange &&
      !hasSocialDiscordChange
    ) {
      setErr("No changes to submit");
      return;
    }

    if (hasBioChange && bio.length > BIO_MAX_LENGTH) {
      setErr(`Bio must be ${BIO_MAX_LENGTH} characters or less`);
      return;
    }

    if (hasDisplayChange) {
      if (display.trim() !== display) {
        setErr("Display names can't begin or end with whitespace");
        return;
      }

      if (display.trim() === "") {
        setErr("Please enter a display name");
        return;
      }
    }

    if (hasPasswordChange) {
      if (password.trim() !== password) {
        setErr("Passwords can't begin or end with whitespace");
        return;
      }
    }

    if (password !== "" && password !== confirm) {
      setErr("Passwords don't match");
      return;
    }

    const checkSocial = (label: string, value: string): boolean => {
      if (value === "") return true;
      if (!isValidHttpUrl(value)) {
        setErr(`${label} must be a valid http(s) URL`);
        return false;
      }
      return true;
    };
    if (hasSocialTwitterChange && !checkSocial("Twitter URL", tw)) return;
    if (hasSocialInstagramChange && !checkSocial("Instagram URL", ig)) return;
    if (hasSocialDiscordChange && !checkSocial("Discord URL", dc)) return;

    // Perform updates
    const updates: UserUpdateRequest = {};
    if (hasDisplayChange) updates.display = display;
    if (hasPasswordChange) updates.password = password;
    if (hasAvatarChange) updates.avatar = avatar;
    if (hasBioChange) updates.bio = bio;
    if (hasVisibilityChange) updates.profileVisibility = profileVisibility;
    if (hasSocialTwitterChange) updates.socialTwitter = tw === "" ? "" : tw;
    if (hasSocialInstagramChange) updates.socialInstagram = ig === "" ? "" : ig;
    if (hasSocialDiscordChange) updates.socialDiscord = dc === "" ? "" : dc;

    const response = await updateUser(auth, updates);
    if ("error" in response) {
      setErr(response.error);
      return;
    }

    // We need to do this — or do something else that resets the login context
    reset();
  };

  const handleSetAvatar = (url: string) => {
    setAvatar(url);
  };

  return {
    display,
    setDisplay,
    password,
    setPassword,
    confirm,
    setConfirm,
    avatar,
    setAvatar: handleSetAvatar,
    bio,
    setBio,
    bioMaxLength: BIO_MAX_LENGTH,
    profileVisibility,
    setProfileVisibility,
    twitterLink,
    setTwitterLink,
    instagramLink,
    setInstagramLink,
    discordLink,
    setDiscordLink,
    err,
    handleSubmit,
  };
}
