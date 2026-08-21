import { db } from '../src/lib/db'

async function checkAllTbc() {
  const users = await db.user.findMany({
    where: { email: 'tbcjanakiraman@gmail.com' },
  })
  console.log('Users found with tbcjanakiraman@gmail.com:', users)
}

checkAllTbc()
