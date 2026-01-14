import { useEffect } from "react";
import { useMyUserStore } from "../store/useMyUserStore";
import { createMyUser } from "../utils/create-my-user";
import { SocketManager } from "../../../shared/services/SocketManager";

export const useJoinMyUser = () => {
  const { setMyUser } = useMyUserStore();

  useEffect(() => {
    SocketManager.listen("myUser:joined", (data) => {
      setMyUser(data.user);
    });

    return () => {
      SocketManager.off("myUser:joined");
    }
  }, [setMyUser]);


  const joinMyUser = () => {
    SocketManager.emit("myUser:join", createMyUser() );
  }
  
  return { joinMyUser };
}