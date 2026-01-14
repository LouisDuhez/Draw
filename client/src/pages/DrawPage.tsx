import { AppHeader } from '../shared/components/AppHeader/AppHeader'
import { DrawLayout } from '../shared/components/layouts/DrawLayout/DrawLayout'

import { Instructions } from '../shared/components/Instructions/Instructions'
import { getInstructions } from '../shared/utils/get-instructions'
import { UserList } from '../features/user/components/UserList'
import { DrawArea } from '../features/drawing/components/DrawArea/DrawArea'
// NEW : Import de la Toolbar
import { Toolbar } from '../features/drawing/components/DrawToolbar/toolbar' 

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
      
      {/* Instructions flottantes par dessus la draw area */}
      {/* <Instructions className="max-w-xs absolute top-4 left-4 pointer-events-none">
        {getInstructions('draw-area')}
      </Instructions> */}
      
    </DrawLayout>
  )
}

export default DrawPage;