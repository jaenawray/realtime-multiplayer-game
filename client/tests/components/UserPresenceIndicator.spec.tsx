import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginContext } from "../../src/contexts/LoginContext.ts";
import type { GameSocket } from "../../src/util/types.ts";
import UserPresenceIndicator from "../../src/components/UserPresenceIndicator.tsx";

describe("UserPresenceIndicator", () => {
  it("renders offline initially and updates to online from socket event", async () => {
    let presenceHandler: ((payload: { username: string; isOnline: boolean }) => void) | undefined;

    const socket = {
      on: vi.fn(
        (event: string, handler: (payload: { username: string; isOnline: boolean }) => void) => {
          if (event === "userPresenceChanged") {
            presenceHandler = handler;
          }
        },
      ),
      off: vi.fn(),
    } as unknown as GameSocket;

    render(
      <LoginContext
        value={{
          user: {
            username: "user1",
            display: "Yāo",
            createdAt: new Date("2025-01-01"),
            isOnline: true,
            profileVisibility: "public",
          },
          pass: "pwd1111",
          socket,
          reset: vi.fn(),
        }}
      >
        <UserPresenceIndicator
          user={{
            username: "user2",
            display: "Sénior Dos",
            createdAt: new Date("2025-01-01"),
            isOnline: false,
            profileVisibility: "public",
          }}
        />
      </LoginContext>,
    );

    expect(screen.getByText("Offline")).toBeTruthy();
    act(() => {
      if (presenceHandler) {
        presenceHandler({ username: "user2", isOnline: true });
      }
    });
    expect(await screen.findByText("Online")).toBeTruthy();
  });
});
