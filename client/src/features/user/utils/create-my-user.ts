
const DEFAULT_USERS = [
  {
    username: 'Megara',
    avatar: 'https://api.dicebear.com/9.x/glass/svg?seed=Jameson'
  },
  {
    username: 'Hercules',
    avatar: 'https://api.dicebear.com/9.x/glass/svg?seed=Kimberly'
  },
  {
    username: 'Hades',
    avatar: 'https://api.dicebear.com/9.x/glass/svg?seed=Easton'
  },
  {
    username: 'Zeus',
    avatar: 'https://api.dicebear.com/9.x/glass/svg?seed=Ryan'
  },
  {
    username: 'Hera',
    avatar: 'https://api.dicebear.com/9.x/glass/svg?seed=Leah'
  },
  {
    username: 'Hermes',
    avatar: 'https://api.dicebear.com/9.x/glass/svg?seed=Eden'
  },
  {
    username: 'Clotho',
    avatar: 'https://api.dicebear.com/9.x/glass/svg?seed=Nolan'
  },
  {
    username: 'Clio',
    avatar: 'https://api.dicebear.com/9.x/glass/svg?seed=Chase'
  }
];

export const createMyUser = () => {
  const { username, avatar } = DEFAULT_USERS[Math.floor(Math.random() * DEFAULT_USERS.length)];
  return {
    username,
    avatar
  };
}
