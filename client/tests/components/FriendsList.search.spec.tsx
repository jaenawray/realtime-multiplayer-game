import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SafeUserInfo } from "@gamenite/shared";
import { LoginContext } from "../../src/contexts/LoginContext.ts";
import type { GameSocket } from "../../src/util/types.ts";
import FriendsList from "../../src/components/FriendsList.tsx";
import * as friendService from "../../src/services/friendService.ts";

vi.mock("../../src/services/friendService.ts");

describe("FriendsList search/filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(friendService.getFriendsList).mockResolvedValue([
      {
        username: "user2",
        display: "Sénior Dos",
        createdAt: new Date("2025-01-01"),
        isOnline: false,
        profileVisibility: "public",
      },
      {
        username: "user3",
        display: "Frau Drei",
        createdAt: new Date("2025-01-01"),
        isOnline: true,
        profileVisibility: "public",
      },
    ] as SafeUserInfo[]);
    vi.mocked(friendService.removeFriend).mockResolvedValue({ success: true });
  });

  it("filters by username and display name", async () => {
    const socket = { on: vi.fn(), off: vi.fn() } as unknown as GameSocket;
    render(
      <MemoryRouter>
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
          <FriendsList auth={{ username: "user1", password: "pwd1111" }} />
        </LoginContext>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Sénior Dos")).toBeTruthy();
    expect(screen.getByText("Frau Drei")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Search friends"), { target: { value: "frau" } });
    expect(screen.queryByText("Sénior Dos")).toBeNull();
    expect(screen.getByText("Frau Drei")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Search friends"), { target: { value: "user2" } });
    expect(screen.getByText("Sénior Dos")).toBeTruthy();
    expect(screen.queryByText("Frau Drei")).toBeNull();
  });
});
