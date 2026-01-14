import { useMyUserStore } from "../../../features/user/store/useMyUserStore";
import { MyUserBadge } from "../../../features/user/components/MyUserBadge/MyUserBadge";

type AppHeaderProps = {
  onClickJoin: () => void;
};

export function AppHeader({ onClickJoin }: AppHeaderProps) {
  const myUser = useMyUserStore().myUser
  return (
    <div className="join items-center justify-between gap-4 w-full">
      <h1 className="join-item text-5xl font-bold">MMI3 Draw App</h1>
      {myUser ?
      <MyUserBadge username={myUser.username} avatar={myUser.avatar} />
        :
        <div className="join-item">
          <button className="btn btn-primary" onClick={onClickJoin}>Rejoindre</button>
        </div>
    }
    </div>
  )
}