import jsonServer from 'json-server';
import bcrypt from 'bcryptjs';

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Route de login personnalisée
server.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const db = router.db;
  const users = db.get('users').value();
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ message: 'Identifiants incorrects' });
  }

  if (user.status === 'pending') {
    return res.status(403).json({ message: 'Votre compte est en attente de validation' });
  }

  if (user.status === 'rejected') {
    return res.status(403).json({ message: 'Votre compte a été refusé' });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ message: 'Identifiants incorrects' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Route d'inscription personnalisée
server.post('/auth/register', async (req, res) => {
  const { email, password, username } = req.body;
  const db = router.db;
  const users = db.get('users').value();

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'Cet email est déjà utilisé' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now(),
    email,
    password: hashedPassword,
    username,
    role: 'member',
    status: 'pending'
  };

  db.get('users').push(newUser).write();
  const { password: _, ...userWithoutPassword } = newUser;
  res.json(userWithoutPassword);
});

server.use(router);

server.listen(3000, () => {
  console.log('JSON Server avec bcrypt sur http://localhost:3000');
});