import { type SubmitEvent, useState } from "react";
import useLoginContext from "./useLoginContext.ts";
import useAuth from "./useAuth.ts";
import { updateUser } from "../services/userService.ts";
import type { UserUpdateRequest } from "@gamenite/shared";
import { DEFAULT_AVATAR } from "../components/avatarLibrary";

/**
 * Custom hook to manage profile form logic
 * @returns an object containing
 *  - Form values `display`, `password`, `confirm`, and `avatar`
 *  - Form setters `setDisplay`, `setPassword`, `setConfirm`, and `setAvatar`
 *  - Possibly-null error message `err`
 *  - Submission handler `handleSubmit`
 */
export default function useEditProfileForm() {
  const { user, reset } = useLoginContext();
  const [display, setDisplay] = useState(user.display);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [avatar, setAvatar] = useState<string>(user.avatar ?? DEFAULT_AVATAR);
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

    if (!hasDisplayChange && !hasPasswordChange && !hasAvatarChange) {
      setErr("No changes to submit");
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
    err,
    handleSubmit,
  };
}
