import { type JSX, useEffect, useMemo } from "react";
import { type AuthContext, LoginContext } from "../contexts/LoginContext.ts";
import { type GameSocket } from "../util/types.ts";
import { Navigate } from "react-router-dom";
import PendingRequestNotificationProvider from "./PendingRequestNotificationProvider.tsx";

interface LoggedInRouteParams {
  auth: AuthContext | null;
  socket: GameSocket | null;
  children: JSX.Element;
}

/**
 * Ensures that, if we're not in an appropriately-initialized logged-in
 * context with auth and socket both non-null, we will navigate to `/login`.
 *
 * This setup assumes that socket will be non-null by the time auth becomes
 * non-null. This could cause unexpected behavior if the socket is unable
 * to initialize correctly. If socket is null when auth becomes non-null, we
 * will navigate back to the login page, even though the user will have just,
 * from their perspective, logged in.
 */
export default function LoggedInRoute({ auth, socket, children }: LoggedInRouteParams) {
  // This use of `useMemo` is critical, because there are there are other
  // places in the app where `context` appears as part of a dependency array
  // (notably in `useAuth`). If we don't use `useMemo` here, those dependency
  // arrays will change every time the app updates.
  const context = useMemo(() => (auth && socket ? { ...auth, socket } : null), [auth, socket]);

  // Register this tab as online; unregister when the logged-in session ends
  useEffect(() => {
    if (!auth || !socket) return;
    const creds = { username: auth.user.username, password: auth.pass };
    socket.emit("presenceRegister", { auth: creds, payload: {} });
    return () => {
      socket.emit("presenceUnregister", { auth: creds, payload: {} });
    };
  }, [auth, socket]);

  return context ? (
    <LoginContext.Provider value={context}>
      <PendingRequestNotificationProvider>{children}</PendingRequestNotificationProvider>
    </LoginContext.Provider>
  ) : (
    <Navigate to="/login" />
  );
}
