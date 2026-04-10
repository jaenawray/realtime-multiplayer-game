import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FriendRequestInfo, SafeUserInfo } from "@gamenite/shared";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginContext } from "../../src/contexts/LoginContext.ts";
import type { GameSocket } from "../../src/util/types.ts";
import ViewProfile from "../../src/pages/ViewProfile.tsx";
import type { FriendStatus } from "../../src/services/friendService.ts";
import * as friendService from "../../src/services/friendService.ts";
import * as userService from "../../src/services/userService.ts";

vi.mock("../../src/services/userService.ts");
vi.mock("../../src/services/friendService.ts");

vi.mock("../../src/components/ProfilePictureDisplay.tsx", () => ({
  default: () => <div>ProfilePictureDisplay</div>,
}));
vi.mock("../../src/components/UserStatsPanel.tsx", () => ({
  default: () => <div>UserStatsPanel</div>,
}));
vi.mock("../../src/components/UserGameHistoryPanel.tsx", () => ({
  default: () => <div>UserGameHistoryPanel</div>,
}));
vi.mock("../../src/components/UserPresenceIndicator.tsx", () => ({
  default: () => <span>Offline</span>,
}));
vi.mock("../../src/hooks/useTimeSince.ts", () => ({ default: () => () => "just now" }));

const baseProfile: SafeUserInfo = {
  username: "user2",
  display: "Sénior Dos",
  createdAt: new Date("2025-01-01"),
  isOnline: false,
  profileVisibility: "public" as const,
};

const mockOutgoingFriendRequest: FriendRequestInfo = {
  requestId: "req-123",
  fromUser: {
    username: "user1",
    display: "Yāo",
    createdAt: new Date("2025-01-01"),
    isOnline: true,
    profileVisibility: "public",
  },
  toUser: baseProfile,
  status: "pending",
  createdAt: new Date("2025-01-01"),
};

const renderProfile = (status: FriendStatus) => {
  vi.mocked(userService.getUserById).mockResolvedValue(baseProfile);
  vi.mocked(friendService.getFriendStatus).mockResolvedValue(status);
  vi.mocked(friendService.fetchMutualFriends).mockResolvedValue([]);
  vi.mocked(friendService.sendFriendRequest).mockResolvedValue(mockOutgoingFriendRequest);
  vi.mocked(friendService.blockUser).mockResolvedValue({ success: true });
  vi.mocked(friendService.unblockUser).mockResolvedValue({ success: true });
  vi.mocked(friendService.cancelFriendRequest).mockResolvedValue({ success: true });

  const socket = {
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as GameSocket;

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
        <ViewProfile username="user2" />
      </LoginContext>
    </MemoryRouter>,
  );
};

describe("ViewProfile friend actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows send friend request and transitions to cancel after sending", async () => {
    renderProfile({ status: "none" });

    expect(await screen.findByText("Send Friend Request")).toBeTruthy();
    fireEvent.click(screen.getByText("Send Friend Request"));

    await waitFor(() => {
      expect(friendService.sendFriendRequest).toHaveBeenCalledTimes(1);
      expect(friendService.sendFriendRequest).toHaveBeenCalledWith(
        { username: "user1", password: "pwd1111" },
        "user2",
      );
    });
    expect(await screen.findByText("Cancel Request")).toBeTruthy();
  });

  it("loads and renders mutual friends list", async () => {
    vi.mocked(friendService.fetchMutualFriends).mockResolvedValueOnce([
      {
        username: "user3",
        display: "Frau Drei",
        createdAt: new Date("2025-01-01"),
        isOnline: false,
        profileVisibility: "public",
      },
    ]);

    renderProfile({ status: "none" });
    expect(await screen.findByText("Mutual friends")).toBeTruthy();
    expect(await screen.findByText("Frau Drei")).toBeTruthy();
    expect(screen.getByText("(user3)")).toBeTruthy();
  });

  it("blocks user from profile action", async () => {
    renderProfile({ status: "none" });

    const blockButton = await screen.findByRole("button", { name: "Block user" });
    fireEvent.click(blockButton);

    await waitFor(() => {
      expect(friendService.blockUser).toHaveBeenCalledTimes(1);
      expect(friendService.blockUser).toHaveBeenCalledWith(
        { username: "user1", password: "pwd1111" },
        "user2",
      );
    });
    expect(await screen.findByText("You have blocked this user.")).toBeTruthy();
  });
});
