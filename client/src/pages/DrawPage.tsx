import { AppHeader } from '../shared/components/AppHeader/AppHeader'
import { DrawLayout } from '../shared/components/layouts/DrawLayout/DrawLayout'
import { UserList } from '../features/user/components/UserList'
import { DrawArea } from '../features/drawing/components/DrawArea/DrawArea'
import { Toolbar } from '../features/drawing/components/DrawToolbar/ToolBar' 
import { useUpdatedUserList } from '../features/user/hooks/useUpdatedUserList'
import { useJoinMyUser } from '../features/user/hooks/useJoinMyUser'

function DrawPage() {
  const { joinMyUser }  = useJoinMyUser();
  const { userList } = useUpdatedUserList();

  return (
    <DrawLayout
      topArea={
        <AppHeader 
          onClickJoin={() => joinMyUser()}
        />
      }
      rightArea={
        <>
          {/* <Instructions>
            {getInstructions('user-list')}
          </Instructions> */}
          <UserList users={userList} />
        </>
      }
      bottomArea={
        <div className="flex justify-center pb-4">
           <Toolbar />
        </div>
      }
    >
      <DrawArea />
      
    </DrawLayout>
  )
}

export default DrawPage;