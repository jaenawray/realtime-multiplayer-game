import { type SubmitEvent, useState } from "react";
import useLoginContext from "./useLoginContext.ts";
import useAuth from "./useAuth.ts";
import { updateUser } from "../services/userService.ts";
import type { UserUpdateRequest } from "@gamenite/shared";
import { DEFAULT_AVATAR } from "../components/avatarLibrary";

const BIO_MAX_LENGTH = 500;

/**
 * Custom hook to manage profile form logic
 * @returns an object containing
 *  - Form values `display`, `password`, `confirm`, `avatar`, and `bio`
 *  - Form setters `setDisplay`, `setPassword`, `setConfirm`, `setAvatar`, and `setBio`
 *  - Possibly-null error message `err`
 *  - Submission handler `handleSubmit`
 */
export default function useEditProfileForm() {
  const { user, reset } = useLoginContext();
  const [display, setDisplay] = useState(user.display);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [avatar, setAvatar] = useState<string>(user.avatar ?? DEFAULT_AVATAR);
  const [bio, setBio] = useState(user.bio ?? "");
  const [err, setErr] = useState<null | string>(null);
  const auth = useAuth();

  /**
   * Handles submission of the form
   */
  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const hasDisplayChange = display !== user.display;
    const hasPasswordChange = password !== "" && password === confirm;
    const hasAvatarChange = avatar !== user.avatar;
    const hasBioChange = bio !== (user.bio ?? "");

    if (!hasDisplayChange && !hasPasswordChange && !hasAvatarChange && !hasBioChange) {
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

    // Perform updates
    const updates: UserUpdateRequest = {};
    if (hasDisplayChange) updates.display = display;
    if (hasPasswordChange) updates.password = password;
    if (hasAvatarChange) updates.avatar = avatar;
    if (hasBioChange) updates.bio = bio;

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
    err,
    handleSubmit,
  };
}
