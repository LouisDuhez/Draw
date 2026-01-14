import { useEffect } from "react";
import { useUserListStore } from "../store/useUserListStore";
import { SocketManager } from "../../../shared/services/SocketManager";

/* Ceci est un "hook" custom, sachez que partout où vous l'importez, le code sera exécuté. Donc à chaque endroit où il sera utilisé, dans ce cas par exemple, on ajoutera un listener sur le "users:updated" et on mettra à jour le store. Ce n'est pas toujours ce qu'on souhaite. Mais dans notre cas, ça ira. */

/* On pourrait davantage découper notre structure pour avoir quelque chose de plus propre et mettre de la logique dans un dossier service par exemple */ 

export function useUpdatedUserList() {
  const { setUserList, userList } = useUserListStore();
  
  useEffect(() => {
    SocketManager.listen("users:updated", (data) => {
      setUserList(data.users);
    });
    
    return () => {
      SocketManager.off("users:updated");
    } 
  }, [setUserList]);
    
  useEffect(() => {
    SocketManager.get('users').then((data) => {
      setUserList(data ? data.users : []);
    });
  }, [setUserList]);
    
  return { userList };
}
  